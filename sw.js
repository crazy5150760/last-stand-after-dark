/* Generated from reviewed local files. No runtime caching of other content. */
'use strict';
const CONFIG={"version":"Alpha 0.83","build":"9af87ff2adc01745","assets":[{"key":"index.html","url":"./","sha256":"016275d93949067c8e992ae196fbe292c29a8bb9ef9d53545834f26db230f3ff","types":["text/html"]},{"key":"manifest.webmanifest","url":"manifest.webmanifest","sha256":"3caa780fff809b1cb37efa7099601d4fdd7c9c323d249e5e67cab021d6dd108e","types":["application/manifest+json","application/json"]},{"key":"install/","url":"install/","sha256":"09876140391bf97c162c3b4f2c8004f2ac172bff818d79afaae5f18043c8957f","types":["text/html"]},{"key":"install.css","url":"install.css","sha256":"92883a7b09185a7e327f7da7ded2d603bc3a8eea01e7b85d9778b7ec8d6a637b","types":["text/css"]},{"key":"install.js","url":"install.js","sha256":"656482a69e76436d60313f636f43d543a9fc55b2d0d77593b0a105390294fdf1","types":["text/javascript","application/javascript"]},{"key":"icons/icon-192.png","url":"icons/icon-192.png","sha256":"54e96a02f204149c4e2259eb57fefebaee32eb8090454a2c527ecef8207e2cbd","types":["image/png"]},{"key":"icons/icon-512.png","url":"icons/icon-512.png","sha256":"a7672e7ad3908d3e5128b12ff842f421aefd5f105843360e8cf30b809c2f9e53","types":["image/png"]},{"key":"icons/maskable-512.png","url":"icons/maskable-512.png","sha256":"93ced22688953195b913fbf79539a5214f208372294b6367feb5928f9e06f3f0","types":["image/png"]}]};
const SCOPE=new URL(self.registration.scope);
const PREFIX='lsad-pwa-v1:'+encodeURIComponent(SCOPE.href)+':';
const CACHE=PREFIX+CONFIG.build;
const keyFor=entry=>new URL(entry.key,SCOPE).href;
const routes=new Map(CONFIG.assets.map(entry=>[new URL(entry.key,SCOPE).pathname,keyFor(entry)]));
routes.set(SCOPE.pathname,new URL('index.html',SCOPE).href);
routes.set(new URL('install/index.html',SCOPE).pathname,new URL('install/',SCOPE).href);
async function complete(){
 if(!(await caches.keys()).includes(CACHE))return false;
 const cache=await caches.open(CACHE);
 for(const entry of CONFIG.assets)if(!await cache.match(keyFor(entry)))return false;
 return true;
}
async function prepare(){
 if(await complete())return;
 try{
  const cache=await caches.open(CACHE);
  for(const entry of CONFIG.assets){
   const request=new Request(new URL(entry.url,SCOPE),{cache:'reload',credentials:'same-origin',redirect:'error'});
   const response=await fetch(request);
   if(!response.ok||response.redirected||response.type==='opaque')throw Error('Offline download rejected');
   const type=(response.headers.get('content-type')||'').split(';')[0].trim().toLowerCase();
   if(!entry.types.includes(type))throw Error('Unexpected offline content type');
   const digest=await crypto.subtle.digest('SHA-256',await response.clone().arrayBuffer());
   const hash=Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
   if(hash!==entry.sha256)throw Error('Offline content does not match this release');
   await cache.put(keyFor(entry),response);
  }
  if(!await complete())throw Error('Offline copy incomplete');
 }catch(error){await caches.delete(CACHE).catch(()=>{});throw error}
}
let preparing=null;
function ensurePrepared(){if(!preparing)preparing=prepare().finally(()=>{preparing=null});return preparing}
self.addEventListener('install',event=>event.waitUntil(ensurePrepared()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 if(!await complete())throw Error('Offline copy unavailable');
 const keys=await caches.keys();
 await Promise.all(keys.filter(key=>key.startsWith(PREFIX)&&key!==CACHE).map(key=>caches.delete(key))).catch(()=>{});
 // Default worker lifecycle: no claim, forced activation or page reload.
})()));
self.addEventListener('fetch',event=>{
 const request=event.request;if(request.method!=='GET')return;
 const url=new URL(request.url);if(url.origin!==SCOPE.origin)return;
 if(url.pathname===new URL('install',SCOPE).pathname){event.respondWith(Promise.resolve(Response.redirect(new URL('install/',SCOPE).href,302)));return}
 const key=routes.get(url.pathname);if(!key)return;
 event.respondWith((async()=>{const cache=await caches.open(CACHE);return await cache.match(key)||fetch(request)})());
});
self.addEventListener('message',event=>{
 if(!['LSAD_STATUS','LSAD_PREPARE'].includes(event.data?.type)||!event.ports?.[0])return;
 event.waitUntil((async()=>{
  let failed=false;
  if(event.data.type==='LSAD_PREPARE')try{await ensurePrepared()}catch{failed=true}
  event.ports[0].postMessage({type:'LSAD_STATUS',version:CONFIG.version,build:CONFIG.build,ready:await complete(),failed});
 })());
});
