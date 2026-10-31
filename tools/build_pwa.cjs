// Build a reviewable static HTTPS package; never deploy or change the standalone.
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),source=path.join(root,'pwa'),out=path.join(root,'web-dist');
const hash=data=>crypto.createHash('sha256').update(data).digest('hex');
const files=new Map(),add=(name,data)=>files.set(name,Buffer.isBuffer(data)?data:Buffer.from(data));
let html=fs.readFileSync(path.join(root,'dist/index.html'),'utf8');
assert.ok(!html.includes('rel="manifest"'),'Standalone unexpectedly contains web installation markup');
html=html.replace('</head>','<link rel="manifest" href="manifest.webmanifest"><link rel="icon" href="icons/icon-192.png"><link rel="apple-touch-icon" href="icons/icon-192.png"><meta name="application-name" content="Last Stand: After Dark"></head>');
const updates=fs.readFileSync(path.join(source,'game-updates.js'),'utf8');new vm.Script(updates);
assert.ok(!updates.includes('</script>'),'Update helper must remain an inline script');
html=html.replace('</body>','<script id="lsad-auto-updates">'+updates+'</script></body>');
assert.ok(Buffer.byteLength(html)<12*1024*1024,'Hosted game exceeds the standalone budget');add('index.html',html);
for(const name of ['manifest.webmanifest','install/index.html','install.css','install.js','icons/icon-192.png','icons/icon-512.png','icons/maskable-512.png'])add(name,fs.readFileSync(path.join(source,name)));
const manifest=JSON.parse(files.get('manifest.webmanifest'));assert.equal(manifest.id,'./');assert.equal(manifest.start_url,'./');assert.equal(manifest.scope,'./');assert.equal(manifest.display,'standalone');assert.ok(!manifest.orientation,'Both phone orientations must remain available');
for(const icon of manifest.icons){const data=files.get(icon.src);assert.equal(data.subarray(1,4).toString(),'PNG');assert.equal(icon.sizes,data.readUInt32BE(16)+'x'+data.readUInt32BE(20));assert.ok(data.length<200000)}
const template=fs.readFileSync(path.join(source,'sw.template.js'),'utf8'),assets=[...files].map(([name,data])=>({key:name==='install/index.html'?'install/':name,url:name==='index.html'?'./':name==='install/index.html'?'install/':name,sha256:hash(data),types:name.endsWith('.html')?['text/html']:name.endsWith('.js')?['text/javascript','application/javascript']:name.endsWith('.css')?['text/css']:name.endsWith('.png')?['image/png']:['application/manifest+json','application/json']}));
const build=hash(JSON.stringify(assets)+template).slice(0,16),config={version:'Alpha 0.86',build,assets};
assert.equal(template.split('__LSAD_CONFIG__').length,2);const worker=template.replace('__LSAD_CONFIG__',JSON.stringify(config));new vm.Script(worker);new vm.Script(files.get('install.js').toString());add('sw.js',worker);
add('_headers','/sw.js\n  Cache-Control: no-cache\n/manifest.webmanifest\n  Cache-Control: no-cache\n/install/*\n  Cache-Control: no-cache\n/install.js\n  Cache-Control: no-cache\n/install.css\n  Cache-Control: no-cache\n/index.html\n  Cache-Control: no-cache\n/\n  Cache-Control: no-cache\n');
add('build-info.json',JSON.stringify({version:config.version,build,standaloneSha256:hash(fs.readFileSync(path.join(root,'dist/index.html'))),hostedGameSha256:hash(files.get('index.html')),cacheAssets:assets,policy:'Automatic game-page update checks/downloads; verified exact static payloads; default waiting lifecycle applies after all game windows close; no forced reload/activation; records remain browser-local.'},null,2)+'\n');
if(process.argv.includes('--check')){
 const list=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?list(path.join(dir,entry.name)):[path.relative(out,path.join(dir,entry.name)).split(path.sep).join('/')]);
 assert.deepEqual(list(out).sort(),[...files.keys()].sort());for(const [name,data]of files)assert.deepEqual(fs.readFileSync(path.join(out,name)),data,name+' is stale');
}else{
 // Only this generated output directory is replaced; source/game data is untouched.
 fs.rmSync(out,{recursive:true,force:true});for(const [name,data]of files){const target=path.join(out,name);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,data)}
}
console.log(JSON.stringify({version:config.version,build,files:files.size,cacheAssets:assets.length,hostedGameBytes:files.get('index.html').length,totalBytes:[...files.values()].reduce((sum,data)=>sum+data.length,0),checkOnly:process.argv.includes('--check')}));
