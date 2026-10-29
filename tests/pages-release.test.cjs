'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const {config,compose}=require('../scripts/pages-release.cjs');
const digest=data=>crypto.createHash('sha256').update(data).digest('hex');
const names=['index.html','manifest.webmanifest','sw.js','install/index.html','install.js','install.css','icons/icon-192.png','icons/icon-512.png','icons/maskable-512.png','_headers','build-info.json'];
function fixture(t){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'lsad-pages-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const baseline=path.join(root,'baseline'),candidate=path.join(root,'candidate'),output=path.join(root,'output');fs.mkdirSync(baseline);fs.mkdirSync(candidate);
 for(const [file,body]of Object.entries({'CNAME':'game.example.test\n','.nojekyll':'','index.html':'old verified game','notes/keep.txt':'owner content'})){const p=path.join(baseline,file);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,body)}
 for(const file of names){const p=path.join(candidate,file);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,'candidate '+file)}
 const release={schema:1,source_ref:'a'.repeat(40),expected_live_commit:'b'.repeat(40),expected_build:'c'.repeat(16),expected_game_sha256:'d'.repeat(64),publish:false};
 const cacheAssets=names.filter(n=>!['sw.js','_headers','build-info.json'].includes(n)).map(n=>({key:n==='install/index.html'?'install/':n,sha256:digest(fs.readFileSync(path.join(candidate,n)))}));
 const info={build:release.expected_build,standaloneSha256:release.expected_game_sha256,hostedGameSha256:digest(fs.readFileSync(path.join(candidate,'index.html'))),cacheAssets};
 fs.writeFileSync(path.join(candidate,'build-info.json'),JSON.stringify(info));
 return{root,baseline,candidate,output,release,info};
}
test('release configuration requires immutable identifiers and explicit boolean publication',()=>{
 const valid={schema:1,source_ref:'a'.repeat(40),expected_live_commit:'b'.repeat(40),expected_build:'c'.repeat(16),expected_game_sha256:'d'.repeat(64),publish:false};assert.equal(config(valid).publish,false);
 for(const change of [{source_ref:'main'},{source_ref:'$(echo bad)'},{expected_live_commit:'gh-pages'},{publish:'false'},{schema:2},{expected_build:'latest'},{expected_game_sha256:'x'},{extra:true}])assert.throws(()=>config({...valid,...change}));
});
test('composition preserves CNAME, unrelated files and baseline bytes while replacing only game payload',t=>{
 const f=fixture(t),result=compose(f);assert.equal(result.productionFiles,11);assert.equal(result.publish,false);
 for(const file of ['CNAME','.nojekyll','notes/keep.txt'])assert.deepEqual(fs.readFileSync(path.join(f.output,file)),fs.readFileSync(path.join(f.baseline,file)));
 assert.equal(fs.readFileSync(path.join(f.baseline,'index.html'),'utf8'),'old verified game');assert.equal(fs.readFileSync(path.join(f.output,'index.html'),'utf8'),'candidate index.html');
});
test('modified cached asset is rejected before output creation',t=>{const f=fixture(t);fs.writeFileSync(path.join(f.candidate,'install.js'),'corrupt');assert.throws(()=>compose(f),/Hash mismatch/);assert.ok(!fs.existsSync(f.output))});
test('unexpected/missing files and custom-domain candidate injection are rejected',t=>{const f=fixture(t);fs.writeFileSync(path.join(f.candidate,'CNAME'),'other.example');assert.throws(()=>compose(f),/file set/);fs.unlinkSync(path.join(f.candidate,'CNAME'));fs.unlinkSync(path.join(f.candidate,'sw.js'));assert.throws(()=>compose(f),/file set/)});
test('wrong release build/game identity is rejected',t=>{const f=fixture(t);assert.throws(()=>compose({...f,release:{...f.release,expected_build:'f'.repeat(16)}}),/candidate build/);assert.throws(()=>compose({...f,release:{...f.release,expected_game_sha256:'e'.repeat(64)}}),/game bytes/)});
test('symlinks in either input cannot escape or replace files',t=>{const f=fixture(t);fs.symlinkSync(path.join(f.root,'outside'),path.join(f.baseline,'link'));assert.throws(()=>compose(f),/Symlink/);fs.unlinkSync(path.join(f.baseline,'link'));fs.symlinkSync(path.join(f.root,'outside'),path.join(f.candidate,'link'));assert.throws(()=>compose(f),/Symlink/)});
test('overlapping or existing output cannot delete a working input',t=>{const f=fixture(t);for(const output of [f.baseline,f.candidate,f.root,path.join(f.baseline,'out')])assert.throws(()=>compose({...f,output}),/overlaps/);fs.mkdirSync(f.output);fs.writeFileSync(path.join(f.output,'keep'),'untouched');assert.throws(()=>compose(f),/new directory/);assert.equal(fs.readFileSync(path.join(f.output,'keep'),'utf8'),'untouched')});
test('duplicate or traversal cache entries are rejected',t=>{const f=fixture(t);f.info.cacheAssets[0]={key:'../escape',sha256:'e'.repeat(64)};fs.writeFileSync(path.join(f.candidate,'build-info.json'),JSON.stringify(f.info));assert.throws(()=>compose(f),/asset set/)});
test('actual browser build composes intact with existing owner content',t=>{
 const f=fixture(t),actual=path.resolve(__dirname,'../web-dist'),info=JSON.parse(fs.readFileSync(path.join(actual,'build-info.json')));compose({...f,candidate:actual,release:{...f.release,expected_build:info.build,expected_game_sha256:info.standaloneSha256}});
 for(const file of names)assert.deepEqual(fs.readFileSync(path.join(f.output,file)),fs.readFileSync(path.join(actual,file)));
 assert.equal(fs.readFileSync(path.join(f.output,'notes/keep.txt'),'utf8'),'owner content');
});
