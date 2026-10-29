// Exercise the actual HTTP handler without binding a socket (restricted hosts).
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{Writable}=require('node:stream');
const {createServer}=require('../scripts/serve.cjs'),{json,read,hash}=require('../scripts/lib/project.cjs');
async function request(url){
 const handler=createServer().listeners('request')[0];
 return new Promise((resolve,reject)=>{
  const chunks=[],res=new Writable({write(chunk,encoding,done){chunks.push(Buffer.from(chunk));done();}});
  res.writeHead=(status,headers={})=>{res.status=status;res.headers=headers;return res;};
  res.on('error',reject);res.on('finish',()=>resolve({status:res.status,headers:res.headers,body:Buffer.concat(chunks)}));
  handler({url},res);
 });
}
test('all production cache URLs resolve at the GitHub Pages repository subdirectory',async()=>{
 for(const asset of json('web-dist/build-info.json').cacheAssets){
  const url=new URL(asset.url,'http://localhost/last-stand-after-dark/');
  const response=await request(url.pathname);assert.equal(response.status,200,url.pathname);
  assert.equal(hash(response.body),asset.sha256);assert.ok(asset.types.some(t=>response.headers['Content-Type'].startsWith(t)));
 }
});
test('worker and production manifest are served with correct MIME and bytes',async()=>{
 for(const [file,mime]of [['sw.js','text/javascript'],['manifest.webmanifest','application/manifest+json']]){
  const r=await request('/last-stand-after-dark/'+file);assert.equal(r.status,200);assert.ok(r.headers['Content-Type'].startsWith(mime));assert.deepEqual(r.body,read('web-dist/'+file));assert.equal(r.headers['Cache-Control'],'no-store');
 }
});
test('local server redirects repository root and rejects missing/outside paths',async()=>{
 const r=await request('/last-stand-after-dark');assert.equal(r.status,302);assert.equal(r.headers.Location,'/last-stand-after-dark/');
 for(const url of ['/','/last-stand-after-dark/missing.js','/last-stand-after-dark/../package.json'])assert.equal((await request(url)).status,404,url);
 assert.equal((await request('/last-stand-after-dark/%2f..%2fpackage.json')).status,403);
});
