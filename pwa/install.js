/* Installation UI only. Never reads records, activates a waiting worker or reloads a game. */
(()=>{
'use strict';
const root=new URL('../',location.href),workerUrl=new URL('sw.js',root).href;
const ui=Object.fromEntries(['prepare','install','play','status','version','installHint'].map(id=>[id,document.getElementById(id)]));
const secure=location.protocol==='https:'||(location.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(location.hostname));
const supported=secure&&globalThis.isSecureContext===true&&!!navigator.serviceWorker;
let registration=null,promptEvent=null,ready=false,busy=false,installed=!!window.matchMedia?.('(display-mode: standalone)').matches,serial=0,error='';
const watchedRegistrations=new WeakSet(),watchedWorkers=new WeakSet();
function buttons(){ui.prepare.disabled=!supported||busy||!!registration?.installing;ui.install.hidden=!ready||!promptEvent||installed;ui.install.disabled=busy||document.hidden}
function status(worker,repair=false){
 return new Promise((resolve,reject)=>{
  const channel=new MessageChannel();let settled=false;
  const finish=(value,failure)=>{if(settled)return;settled=true;clearTimeout(timer);channel.port1.close();channel.port2.close();failure?reject(failure):resolve(value)};
  const timer=setTimeout(()=>finish(null,Error('Offline status unavailable')),repair?120000:8000);
  channel.port1.onmessage=event=>{const data=event.data;if(data?.type==='LSAD_STATUS'&&typeof data.ready==='boolean'&&typeof data.version==='string'&&/^[a-f0-9]{16}$/.test(data.build))finish(data)};
  try{worker.postMessage({type:repair?'LSAD_PREPARE':'LSAD_STATUS'},[channel.port2])}catch(e){finish(null,e)}
 });
}
async function refresh(){
 const token=++serial;
 try{
  const active=registration?.active?await status(registration.active):null,waiting=registration?.waiting?await status(registration.waiting):null;
  if(token!==serial)return;ready=!!active?.ready;
  ui.version.textContent=active?.ready?'Offline copy: '+active.version+' · '+active.build.slice(0,8):'';
  if(waiting?.ready){ui.status.textContent='Update ready: '+waiting.version+'. Finish your run, close this page and every game window, then reopen the home-screen icon.';ui.prepare.textContent='CHECK FOR UPDATES'}
  else if(registration?.installing){ui.status.textContent='Preparing the complete offline game. Keep this page open; the first download is about 13 MB.'}
  else if(ready){ui.status.textContent=error||'Offline play is ready on this device.';ui.prepare.textContent='CHECK FOR UPDATES'}
  else{ui.status.textContent=error||'Prepare offline play while connected, then add the home-screen icon.';ui.prepare.textContent='PREPARE OFFLINE PLAY'}
  ui.installHint.textContent=installed?'You are running in an installed app window. The home-screen icon opens the game directly.':'After offline setup, use Brave’s menu → Add to Home screen or Install app if a button is not offered.';
 }catch(e){if(token===serial){ready=false;ui.status.textContent='Offline readiness could not be confirmed. Reconnect and try setup again. Your game records have not been changed.'}}
 if(token===serial)buttons();
}
function watchWorker(worker){
 if(!worker||watchedWorkers.has(worker))return;watchedWorkers.add(worker);
 worker.addEventListener('statechange',()=>{if(worker.state==='redundant')error='The new offline copy could not be prepared. Reconnect and try again; an existing ready copy can still be used.';void refresh()});
}
function watch(reg){
 registration=reg;
 if(!watchedRegistrations.has(reg)){watchedRegistrations.add(reg);reg.addEventListener('updatefound',()=>{watchWorker(reg.installing);void refresh()})}
 watchWorker(reg.installing);watchWorker(reg.waiting);
}
function owned(reg){return !reg||reg.scope===root.href&&[reg.active,reg.waiting,reg.installing].filter(Boolean).every(worker=>worker.scriptURL===workerUrl)}
async function prepare(){
 if(!supported||busy||document.hidden)return;busy=true;error='';buttons();
 try{
  const existing=await navigator.serviceWorker.getRegistration(root.href);
  if(!owned(existing))throw Error('This address already has another offline setup');
  if(existing){
   watch(existing);await registration.update();
   if(registration.active&&!registration.waiting&&!registration.installing){
    const current=await status(registration.active);
    if(!current.ready){
     ui.status.textContent='Restoring the offline copy. Keep this page open while the game downloads again.';
     const restored=await status(registration.active,true);
     if(!restored.ready)error='Offline repair did not finish. Reconnect and try again; your records have not been changed.';
    }
   }
  }
  else watch(await navigator.serviceWorker.register(workerUrl,{scope:root.href,updateViaCache:'none'}));
 }catch(e){error='Offline setup did not finish. Check your connection and try again. You can still open the game online.'}
 busy=false;await refresh();
}
ui.prepare.addEventListener('click',()=>void prepare());
ui.install.addEventListener('click',async()=>{
 if(!ready||!promptEvent||document.hidden||busy)return;
 const event=promptEvent;promptEvent=null;busy=true;buttons();
 try{await event.prompt();const result=await event.userChoice;ui.status.textContent=result?.outcome==='accepted'?'Installation requested. Complete the browser’s installation steps, then open the home-screen icon.':'Offline play remains ready. You can install later from the browser menu.'}
 catch{ui.status.textContent='Use the browser menu to add the game to your home screen. Offline play remains ready.'}
 busy=false;buttons();
});
window.addEventListener('beforeinstallprompt',event=>{if(!supported)return;event.preventDefault();promptEvent=event;buttons()});
window.addEventListener('appinstalled',()=>{installed=true;promptEvent=null;ui.status.textContent='Home-screen installation completed. Open the Last Stand icon to play.';buttons()});
document.addEventListener('visibilitychange',buttons);
if(!supported){ui.status.textContent='Home-screen installation needs this package hosted at a secure web address. This downloaded setup page cannot install the app; the standalone HTML still plays offline.';ui.installHint.textContent='Use the secure installation link when it is available.';buttons()}
else navigator.serviceWorker.getRegistration(root.href).then(reg=>{if(!owned(reg)){ui.status.textContent='Another offline setup already uses this address. This package has not replaced it.';ui.prepare.disabled=true;return}if(reg)watch(reg);void refresh()}).catch(()=>{ui.status.textContent='Offline setup is unavailable in this browser session. You can still open the game online.';ui.prepare.disabled=true});
})();
