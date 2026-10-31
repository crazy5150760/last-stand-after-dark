'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {read,json,hash,assemble,render,acorn}=require('../scripts/lib/project.cjs');
test('ordered source retains the private closure and only an optional visual pilot entry',()=>{
 const source=assemble();assert.ok(source.startsWith(json('src/modules.json').prefix));assert.ok(source.endsWith(json('src/modules.json').suffix));
 assert.match(source,/id="downtownPilot"/);assert.match(source,/mainPerfTest\.pilot/);assert.match(source,/releaseDowntownPilot\(\)/);
 assert.equal(hash(read('legacy/alpha-0.86/game.js')),json('legacy/alpha-0.86/preservation.json').sourceSha256);
});
test('every module boundary is a complete top-level statement boundary',()=>{
 const source=assemble(),manifest=json('src/modules.json');
 const ast=acorn().parse(source,{ecmaVersion:'latest'}),body=ast.body[0].expression.callee.body.body,starts=new Set(body.map(n=>n.start));
 let offset=manifest.prefix.length;
 for(const file of manifest.files){assert.ok(starts.has(offset),file);offset+=read(file).toString().length+(manifest.gaps?.[file]||'').length;}
 assert.equal(offset,body.at(-1).end);
});
test('feature standalone builds from source while immutable Alpha 0.86 remains intact',()=>{
 const info=json('legacy/alpha-0.86/preservation.json');
 assert.equal(hash(read('legacy/alpha-0.86/index.html')),info.htmlSha256);
 assert.equal(hash(read('legacy/alpha-0.86/game.js')),info.sourceSha256);
 assert.deepEqual(render(),read('dist/index.html'));
 assert.notEqual(hash(read('dist/index.html')),info.htmlSha256);
 assert.ok(read('dist/index.html').length<12*1024*1024+16*1024);
});
test('all 22 runtime media files preserve original encoded bytes and metadata',()=>{
 const before=[...read('legacy/alpha-0.86/index.html').toString().matchAll(/data:([\w/+.-]+);base64,([A-Za-z0-9+/=]+)/g)],assets=json('assets/embedded.json').assets;
 assert.equal(assets.length,22);assert.equal(before.length,assets.length);
 for(let i=0;i<assets.length;i++){assert.equal(assets[i].mime,before[i][1]);assert.deepEqual(read(assets[i].file),Buffer.from(before[i][2],'base64'));}
});
test('moved artwork and historical documents retain original file hashes',()=>{
 const inventory=json('legacy/alpha-0.86/source-inventory.json').files;
 for(const asset of json('assets/catalog.json').files)assert.equal(hash(read(asset.file)),inventory.find(f=>f.file===asset.legacy).sha256);
 for(const file of ['README.md','DEVELOPMENT.md','BUILDING.md','GITHUB_DEPLOYMENT.md','INSTALL_UPDATE_GUIDE.md'])assert.equal(hash(read('docs/history/'+file)),inventory.find(f=>f.file===file).sha256);
 // The current VM test's HTML cap follows the approved pilot allowance; legacy media and tests remain protected separately.
 for(const file of ['Last_Stand_After_Dark_Alpha_0_82.html','.openai/hosting.json','tests/pwa.test.cjs','pwa/sw.template.js','pwa/manifest.webmanifest'])assert.equal(hash(read(file)),inventory.find(f=>f.file===file).sha256);
});
test('build rejects missing and escaping module paths',()=>{
 const {resolve}=require('../scripts/lib/project.cjs');assert.throws(()=>resolve('../outside'),/escapes/);assert.throws(()=>read('src/does-not-exist.js'),/ENOENT/);
});
test('hosted update shell remains the exact wrapper around the current feature standalone',()=>{
 const standalone=read('dist/index.html').toString();
 const expected=standalone.replace('</head>','<link rel="manifest" href="manifest.webmanifest"><link rel="icon" href="icons/icon-192.png"><link rel="apple-touch-icon" href="icons/icon-192.png"><meta name="application-name" content="Last Stand: After Dark"></head>').replace('</body>','<script id="lsad-auto-updates">'+read('pwa/game-updates.js')+'</script></body>');
 assert.equal(read('web-dist/index.html').toString(),expected);
 const info=json('web-dist/build-info.json');assert.notEqual(info.build,json('legacy/alpha-0.86/preservation.json').webBuild);
 assert.equal(info.standaloneSha256,hash(read('dist/index.html')));
 for(const asset of info.cacheAssets){const file=asset.key==='install/'?'install/index.html':asset.key;assert.equal(hash(read('web-dist/'+file)),asset.sha256,file);assert.ok(new URL(asset.url,'https://example.test/last-stand-after-dark/').pathname.startsWith('/last-stand-after-dark/'));}
});
