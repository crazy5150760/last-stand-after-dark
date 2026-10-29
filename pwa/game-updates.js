/* Hosted shell only. Checks/downloads updates; the browser activates on normal reopen. */
(()=>{
'use strict';
const secure=location.protocol==='https:'||(location.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(location.hostname));
if(!secure||globalThis.isSecureContext!==true||!navigator.serviceWorker)return;
const root=new URL('./',location.href),workerUrl=new URL('sw.js',root).href;
let busy=false,nextCheck=0;
function owned(reg){
 return !reg||reg.scope===root.href&&[reg.active,reg.waiting,reg.installing].filter(Boolean).every(worker=>worker.scriptURL===workerUrl);
}
async function check(){
 if(busy||document.hidden||navigator.onLine===false||Date.now()<nextCheck)return;
 busy=true;
 // A failed/offline attempt can retry on a later return without hammering the network.
 nextCheck=Date.now()+30000;
 try{
  const reg=await navigator.serviceWorker.getRegistration(root.href);
  if(!owned(reg))return;
  if(!reg)await navigator.serviceWorker.register(workerUrl,{scope:root.href,updateViaCache:'none'});
  else if(!reg.waiting&&!reg.installing)await reg.update();
  nextCheck=Date.now()+15*60*1000;
 }catch{
  // Offline/failure leaves the current game, records and any ready update intact.
 }finally{busy=false}
}
window.addEventListener('online',()=>void check());
window.addEventListener('pageshow',()=>void check());
document.addEventListener('visibilitychange',()=>void check());
if(document.readyState==='complete')void check();
else window.addEventListener('load',()=>void check(),{once:true});
})();
