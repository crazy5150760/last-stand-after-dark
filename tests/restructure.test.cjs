'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {read,json,hash,assemble,render,acorn}=require('../scripts/lib/project.cjs');
test('all ordered source fragments reconstruct the unchanged readable game',()=>{
 assert.equal(assemble(),read('legacy/alpha-0.86/game.js').toString());
});
test('every module boundary is a complete top-level statement boundary',()=>{
 const source=assemble(),manifest=json('src/modules.json');
 const ast=acorn().parse(source,{ecmaVersion:'latest'}),body=ast.body[0].expression.callee.body.body,starts=new Set(body.map(n=>n.start));
 let offset=manifest.prefix.length;
 for(const file of manifest.files){assert.ok(starts.has(offset),file);offset+=read(file).toString().length+(manifest.gaps?.[file]||'').length;}
 assert.equal(offset,body.at(-1).end);
});
test('standalone build is byte identical to the preserved published release',()=>{
 const info=json('legacy/alpha-0.86/preservation.json');
 assert.equal(hash(read('legacy/alpha-0.86/index.html')),info.htmlSha256);
 assert.equal(hash(read('legacy/alpha-0.86/game.js')),info.sourceSha256);
 assert.deepEqual(render(),read('legacy/alpha-0.86/index.html'));
 assert.deepEqual(read('dist/index.html'),read('legacy/alpha-0.86/index.html'));
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
 for(const file of ['Last_Stand_After_Dark_Alpha_0_82.html','.openai/hosting.json','tests/game.test.cjs','tests/pwa.test.cjs','pwa/sw.template.js','pwa/manifest.webmanifest'])assert.equal(hash(read(file)),inventory.find(f=>f.file===file).sha256);
});
test('build rejects missing and escaping module paths',()=>{
 const {resolve}=require('../scripts/lib/project.cjs');assert.throws(()=>resolve('../outside'),/escapes/);assert.throws(()=>read('src/does-not-exist.js'),/ENOENT/);
});
test('production preserves the exact previously published PWA build identity',()=>{
 const info=json('web-dist/build-info.json');assert.equal(info.build,json('legacy/alpha-0.86/preservation.json').webBuild);
 assert.equal(info.standaloneSha256,hash(read('legacy/alpha-0.86/index.html')));
 for(const asset of info.cacheAssets){const file=asset.key==='install/'?'install/index.html':asset.key;assert.equal(hash(read('web-dist/'+file)),asset.sha256,file);assert.ok(new URL(asset.url,'https://example.test/last-stand-after-dark/').pathname.startsWith('/last-stand-after-dark/'));}
});
