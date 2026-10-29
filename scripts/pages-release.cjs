'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const allowed=['index.html','manifest.webmanifest','sw.js','install/index.html','install.js','install.css','icons/icon-192.png','icons/icon-512.png','icons/maskable-512.png','_headers','build-info.json'];
const cached=allowed.filter(p=>!['sw.js','_headers','build-info.json'].includes(p)).sort();
const hash=data=>crypto.createHash('sha256').update(data).digest('hex');
function config(value){
 assert.deepEqual(Object.keys(value).sort(),['schema','source_ref','expected_live_commit','expected_build','expected_game_sha256','publish'].sort(),'Unexpected release configuration');
 assert.equal(value.schema,1);assert.equal(typeof value.publish,'boolean');
 for(const key of ['source_ref','expected_live_commit'])assert.match(value[key],/^[a-f0-9]{40}$/,'Immutable '+key+' required');
 assert.match(value.expected_build,/^[a-f0-9]{16}$/);assert.match(value.expected_game_sha256,/^[a-f0-9]{64}$/);
 return value;
}
function files(directory,prefix=''){
 return fs.readdirSync(directory,{withFileTypes:true}).flatMap(entry=>{
  if(!prefix&&entry.name==='.git')return[];
  const rel=prefix+entry.name,full=path.join(directory,entry.name);
  assert.ok(!entry.isSymbolicLink(),'Symlink rejected: '+rel);
  if(entry.isDirectory())return files(full,rel+'/');
  assert.ok(entry.isFile(),'Non-file rejected: '+rel);return[rel];
 }).sort();
}
function validatePackage(directory,release){
 assert.deepEqual(files(directory),[...allowed].sort(),'Unexpected production file set');
 const read=name=>fs.readFileSync(path.join(directory,name));
 const info=JSON.parse(read('build-info.json'));
 assert.equal(info.build,release.expected_build,'Unexpected candidate build');
 assert.equal(info.standaloneSha256,release.expected_game_sha256,'Unexpected game bytes');
 assert.equal(hash(read('index.html')),info.hostedGameSha256,'Hosted HTML hash mismatch');
 assert.deepEqual(info.cacheAssets.map(a=>a.key==='install/'?'install/index.html':a.key).sort(),cached,'Cached asset set mismatch');
 for(const asset of info.cacheAssets){const name=asset.key==='install/'?'install/index.html':asset.key;assert.ok(allowed.includes(name));assert.equal(hash(read(name)),asset.sha256,'Hash mismatch: '+name)}
 return info;
}
function compose({baseline,candidate,output,release}){
 config(release);baseline=path.resolve(baseline);candidate=path.resolve(candidate);output=path.resolve(output);
 const contains=(parent,child)=>child===parent||child.startsWith(parent+path.sep);
 for(const input of [baseline,candidate])assert.ok(!contains(input,output)&&!contains(output,input),'Output overlaps an input');
 assert.ok(!fs.existsSync(output),'Output must be a new directory; nothing is deleted');
 const info=validatePackage(candidate,release),original=files(baseline),candidateFiles=files(candidate);
 // Reject destination symlinks/path conflicts before writing any output.
 for(const name of candidateFiles){const target=path.join(baseline,name);if(fs.existsSync(target))assert.ok(fs.statSync(target).isFile(),'Destination is not a file: '+name)}
 fs.mkdirSync(output,{recursive:true});
 for(const [from,list]of [[baseline,original],[candidate,candidateFiles]])for(const name of list){const target=path.join(output,name);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(from,name),target)}
 for(const name of original.filter(name=>!allowed.includes(name)))assert.equal(hash(fs.readFileSync(path.join(output,name))),hash(fs.readFileSync(path.join(baseline,name))),'Existing content changed: '+name);
 return{build:info.build,productionFiles:allowed.length,preservedOtherFiles:original.filter(n=>!allowed.includes(n)).length,publish:release.publish};
}
if(require.main===module){
 const [command,configPath,baseline,candidate,output]=process.argv.slice(2),release=config(JSON.parse(fs.readFileSync(configPath,'utf8')));
 if(command==='config'){
  const lines=['source_ref='+release.source_ref,'expected_live_commit='+release.expected_live_commit,'publish='+release.publish].join('\n')+'\n';
  if(process.env.GITHUB_OUTPUT)fs.appendFileSync(process.env.GITHUB_OUTPUT,lines);else process.stdout.write(lines);
 }else if(command==='compose')console.log(JSON.stringify(compose({baseline,candidate,output,release})));
 else throw Error('Usage: pages-release.cjs config CONFIG | compose CONFIG BASELINE CANDIDATE OUTPUT');
}
module.exports={config,compose,validatePackage};
