// Real Chromium tests. A missing/blocked browser is a failure, never a silent pass.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
let chromium;
try{({chromium}=require('playwright'))}catch{throw Error('Browser tooling missing. Run npm run setup:browser in an environment with approved network access.');}
const {createServer}=require('../scripts/serve.cjs');
const {root,json}=require('../scripts/lib/project.cjs');
const {waitForAsyncState}=require('./lib/browser-state.cjs');
(async()=>{
 let browser,server;
 const output=path.join(root,'test-results');fs.mkdirSync(output,{recursive:true});
 const results=[];let automaticUpdates;
 try{
  browser=await chromium.launch({headless:true,channel:'chromium',...(process.env.LS_CHROMIUM?{executablePath:process.env.LS_CHROMIUM}:{})});
  let updateWorker=null;
  const handler=createServer().listeners('request')[0];
  server=http.createServer((req,res)=>{
   if(updateWorker&&req.url==='/last-stand-after-dark/sw.js')res.writeHead(200,{'Content-Type':'text/javascript','Cache-Control':'no-store'}).end(updateWorker);
   else handler(req,res);
  });
  await new Promise((ok,fail)=>{server.once('error',fail);server.listen(0,'127.0.0.1',ok)});
  const base='http://127.0.0.1:'+server.address().port+'/last-stand-after-dark/';
  // Independent control experiment: the default worker lifecycle must attach
  // a worker to a new page without claim/skipWaiting before testing game offline.
  let probeNoStore=false;
  const probe=http.createServer((req,res)=>{
   if(probeNoStore)res.setHeader('Cache-Control','no-store');
   if(req.url.endsWith('/sw.js'))res.writeHead(200,{'Content-Type':'text/javascript'}).end("self.addEventListener('fetch',event=>event.respondWith(new Response('<title>controlled</title>',{headers:{'Content-Type':'text/html'}})));");
   else res.writeHead(200,{'Content-Type':'text/html'}).end('<title>worker control probe</title>');
  });
  let probeContext;
  try{
   await new Promise((ok,fail)=>{probe.once('error',fail);probe.listen(0,'127.0.0.1',ok)});
   const url='http://127.0.0.1:'+probe.address().port+'/';
   const modes=[['desktop',{},'/',false],['no-store',{},'/',true],['subdirectory',{},'/last-stand-after-dark/',false],['subdirectory-no-store',{},'/last-stand-after-dark/',true]];
   for(const [mode,options,prefix,noStore]of modes){
    probeNoStore=noStore;
    probeContext=await browser.newContext({...options,serviceWorkers:'allow'});
    const installer=await probeContext.newPage();await installer.goto(url+prefix.slice(1));
    await installer.evaluate(async()=>{await navigator.serviceWorker.register('sw.js');await navigator.serviceWorker.ready});
    await waitForAsyncState(installer,async()=>(await navigator.serviceWorker.getRegistration())?.active?.state==='activated');
    const client=await probeContext.newPage();const response=await client.goto(url+prefix.slice(1));
    const controlled=await client.evaluate(()=>!!navigator.serviceWorker.controller);
    console.log(JSON.stringify({phase:'independent-worker-probe',mode,controlled,fromServiceWorker:response.fromServiceWorker()}));
    if(mode==='desktop')assert.ok(controlled&&response.fromServiceWorker(),'Independent worker control failed in this browser runner; not a game-code result');
    await probeContext.close();probeContext=null;
   }
  }finally{if(probeContext)await probeContext.close();await new Promise(ok=>probe.close(ok));}
  for(const [width,height]of [[412,915],[915,412]]){
   // Disposable storage: never point this fixture at the owner's installed profile.
   const context=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:true,deviceScaleFactor:1.75,serviceWorkers:'allow'});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('requestfailed',r=>errors.push(r.url()+': '+r.failure()?.errorText));
   page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
   await page.goto(base,{waitUntil:'networkidle'});await page.locator('#start').waitFor();
   assert.match(await page.locator('.title-footer').innerText(),/ALPHA 0\.86/);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'mobile width overflow');
   const canvas=await page.locator('#game').boundingBox();assert.ok(canvas.width>0&&canvas.height>0);
   const media=await page.evaluate(async()=>{
    const images=[...Object.entries(JSON.parse(document.getElementById('sampleAssets').textContent)),['title',JSON.parse(document.getElementById('titleAsset').textContent)]];
    const decoded=[];
    for(const [id,meta]of images){
     const image=new Image();image.src=meta.src;await image.decode();
     if(image.naturalWidth!==meta.width||image.naturalHeight!==meta.height)throw Error('Decoded image dimensions differ: '+id);
     decoded.push({id,width:image.naturalWidth,height:image.naturalHeight});
    }
    const music=JSON.parse(document.getElementById('musicAsset').textContent),raw=atob(music.data.split(',')[1]);
    const bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));
    const audio=new AudioContext();
    try{const track=await audio.decodeAudioData(bytes.buffer);return{images:decoded,audio:{duration:track.duration,channels:track.numberOfChannels}}}
    finally{await audio.close()}
   });
   assert.equal(media.images.length,21);assert.equal(media.audio.channels,2);assert.ok(Math.abs(media.audio.duration-48)<.1);
   await page.locator('#start').tap();await page.locator('#deploy').tap();
   await page.waitForTimeout(1200);
   // Native multi-touch: hold the joystick, then press Pause with a second finger.
   const stick=await page.locator('#stick').boundingBox(),pause=await page.locator('#pause').boundingBox();
   assert.ok(stick&&pause,'touch controls visible');
   const cdp=await context.newCDPSession(page);
   const first={x:Math.round(stick.x+stick.width*.75),y:Math.round(stick.y+stick.height*.5),id:1};
   const second={x:Math.round(pause.x+pause.width*.5),y:Math.round(pause.y+pause.height*.5),id:2};
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[first]});
   await page.waitForTimeout(200);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[first,second]});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   await page.locator('#resume').waitFor();
   const clock=await page.locator('#time').textContent();await page.waitForTimeout(1100);
   assert.equal(await page.locator('#time').textContent(),clock,'Pause freezes the native clock');
   await page.locator('#pauseSettings').tap();await page.locator('#settingsBack').tap();
   await page.locator('#resume').tap();await page.waitForTimeout(300);
   await page.screenshot({path:path.join(output,'game-'+width+'x'+height+'.png')});
   await page.locator('#pause').tap();
   assert.deepEqual(errors,[],'no initialization/loading errors');
   results.push({width,height,launch:true,touchJoystickAndPause:true,pauseClockFrozen:true,settingsReturn:true,media,errors});
   fs.writeFileSync(path.join(output,'browser-results.json'),JSON.stringify({status:'running',results},null,2)+'\n');
   const study=await context.newPage();study.on('pageerror',e=>errors.push(e.message));await study.goto(base,{waitUntil:'networkidle'});
   await study.locator('#previewsOpen').tap();await study.waitForTimeout(500);await study.locator('#shopfrontStudy').tap();
   await study.waitForFunction(()=>document.getElementById('objective')?.textContent.includes('SHOPFRONT STUDY'));
   await study.locator('#pause').tap();await study.locator('#shopfrontCompare').tap();
   assert.match(await study.locator('#objective').textContent(),/SHOPFRONT STUDY · PLAIN/);
   await study.screenshot({path:path.join(output,'shopfront-plain-'+width+'x'+height+'.png')});
   await study.locator('#shopfrontCompare').tap();assert.match(await study.locator('#objective').textContent(),/SHOPFRONT STUDY · DRESSED/);
   await study.screenshot({path:path.join(output,'shopfront-dressed-'+width+'x'+height+'.png')});
   await study.close();assert.deepEqual(errors,[],'shopfront entry and comparison have no page errors');results.at(-1).shopfrontEntryAndComparison=true;
   // Use fresh tabs: keep the gameplay History/Back drill out of installer setup.
   // Worker integration uses a standard engine context. Mobile touch/layout
   // above remains a separate assertion; Android offline still needs the phone.
   const offlineContext=await browser.newContext({viewport:{width,height},serviceWorkers:'allow'});
   const setupPage=await offlineContext.newPage();
   await setupPage.goto(base+'install/',{waitUntil:'networkidle'});
   await setupPage.locator('#prepare').click();
   await waitForAsyncState(setupPage,async()=>{
    const registration=await navigator.serviceWorker.getRegistration();
    return registration?.active?.state==='activated'&&document.getElementById('status').textContent.includes('Offline play is ready');
   },undefined,{timeout:90000});
   const expected=json('web-dist/build-info.json').build;
   await waitForAsyncState(setupPage,async build=>(await caches.keys()).some(k=>k.includes(build)),expected,{timeout:90000});
   const controlledPage=await offlineContext.newPage();
   const offlineCdp=await offlineContext.newCDPSession(controlledPage);
   await offlineCdp.send('Network.enable');
   await offlineCdp.send('Network.setBypassServiceWorker',{bypass:false});
   await offlineCdp.send('ServiceWorker.enable');
   const workerVersions=[];offlineCdp.on('ServiceWorker.workerVersionUpdated',event=>workerVersions.push(...event.versions));
   const response=await controlledPage.goto(base,{waitUntil:'networkidle'});
   const state=await controlledPage.evaluate(async()=>({
    url:location.href,origin:location.origin,secure:isSecureContext,controller:navigator.serviceWorker.controller?.scriptURL||null,
    controllerState:navigator.serviceWorker.controller?.state||null,
    registrations:(await navigator.serviceWorker.getRegistrations()).map(r=>({scope:r.scope,active:r.active?.scriptURL,state:r.active?.state})),
    caches:await caches.keys()
   }));
   const worker=offlineContext.serviceWorkers().find(w=>w.url().endsWith('/sw.js'));
   const workerState=worker?await worker.evaluate(async()=>({scope:self.registration.scope,routes:[...routes],clients:(await self.clients.matchAll({includeUncontrolled:true,type:'window'})).map(c=>({url:c.url,id:c.id,frameType:c.frameType}))})):null;
   console.log(JSON.stringify({phase:'before-offline',width,height,fromServiceWorker:response.fromServiceWorker(),state,workerVersions,workerState}));
   // A prepared worker does not claim an already loaded document. Perform the
   // normal online reload before asserting control; do not force worker activation.
   if(!await controlledPage.evaluate(()=>!!navigator.serviceWorker.controller))await controlledPage.reload({waitUntil:'networkidle'});
   await controlledPage.waitForFunction(()=>navigator.serviceWorker.controller?.state==='activated');
   await offlineContext.setOffline(true);await controlledPage.reload({waitUntil:'load'});await controlledPage.locator('#start').waitFor();
   const coldPage=await offlineContext.newPage();await coldPage.goto(base,{waitUntil:'load'});await coldPage.locator('#start').waitFor();
   results.at(-1).offlineReload=true;results.at(-1).offlineLaunch=true;results.at(-1).offlineBrowserMode='standard Chromium, separate from mobile emulation';await offlineContext.close();await context.close();
  }
  // Two real worker versions, installed and updated through the game URL alone.
  const context=await browser.newContext({serviceWorkers:'allow'});
  const updateErrors=[];context.on('page',page=>page.on('pageerror',e=>updateErrors.push(e.message)));
  try{
   const current=json('web-dist/build-info.json').build,older='1111111111111111';assert.notEqual(current,older);
   updateWorker=fs.readFileSync(path.join(root,'web-dist/sw.js'),'utf8').replace('"build":"'+current+'"','"build":"'+older+'"');
   const first=await context.newPage();await first.goto(base,{waitUntil:'networkidle'});
   await waitForAsyncState(first,async()=>{const r=await navigator.serviceWorker.getRegistration();return r?.active?.state==='activated'},undefined,{timeout:90000});
   await first.close();
   const game=await context.newPage();
   const updateCdp=await context.newCDPSession(game);await updateCdp.send('Network.enable');await updateCdp.send('Network.setBypassServiceWorker',{bypass:false});
   await game.goto(base,{waitUntil:'networkidle'});
   if(!await game.evaluate(()=>!!navigator.serviceWorker.controller))await game.reload({waitUntil:'networkidle'});
   await game.waitForFunction(()=>navigator.serviceWorker.controller?.state==='activated');
   console.log(JSON.stringify({phase:'automatic-update-controlled-client',state:await game.evaluate(async()=>({controller:navigator.serviceWorker.controller?.scriptURL,scope:(await navigator.serviceWorker.getRegistration()).scope}))}));
   await game.locator('#start').click();await game.locator('#deploy').click();await game.waitForTimeout(300);await game.locator('#pause').click();
   const clock=await game.locator('#time').textContent();
   const saved=await game.evaluate(()=>JSON.stringify(Object.entries(localStorage).sort()));
   let navigations=0;game.on('framenavigated',frame=>{if(frame===game.mainFrame())navigations++});
   updateWorker=null;
   // Another ordinary game launch discovers B while the first run remains open.
   // Exercise real multi-window behavior without altering browser/game clocks.
   const checker=await context.newPage();await checker.goto(base,{waitUntil:'networkidle'});
   await waitForAsyncState(game,async()=>{const r=await navigator.serviceWorker.getRegistration();return r?.waiting?.state==='installed'},undefined,{timeout:90000});
   const workerBuild=(page,slot)=>page.evaluate(async slot=>{
    const reg=await navigator.serviceWorker.getRegistration(),worker=reg[slot];
    if(!worker)throw Error('Missing worker slot '+slot+': '+JSON.stringify({url:location.href,controller:navigator.serviceWorker.controller?.state,active:reg.active?.state,waiting:reg.waiting?.state,installing:reg.installing?.state}));
    return new Promise((resolve,reject)=>{const c=new MessageChannel();const timer=setTimeout(()=>reject(Error('Worker status timeout')),8000);c.port1.onmessage=e=>{clearTimeout(timer);c.port1.close();c.port2.close();resolve(e.data)};worker.postMessage({type:'LSAD_STATUS'},[c.port2])});
   },slot);
   assert.equal((await workerBuild(game,'active')).build,older);
   const waiting=await workerBuild(game,'waiting');assert.equal(waiting.build,current);assert.equal(waiting.ready,true);
   assert.equal(await game.evaluate(async()=>(await navigator.serviceWorker.getRegistration()).waiting?.state),'installed','downloaded worker must stay waiting during the paused run');
   assert.equal(navigations,0,'automatic download must not reload an open run');
   assert.equal(await game.locator('#time').textContent(),clock);await game.locator('#resume').waitFor();
   assert.equal(await game.evaluate(()=>JSON.stringify(Object.entries(localStorage).sort())),saved,'records unchanged during update');
   let nextWorker;
   for(const w of context.serviceWorkers())try{if(await w.evaluate(()=>CONFIG.build)===current)nextWorker=w}catch{}
   assert.ok(nextWorker,'new real worker is present');
   await checker.close();assert.equal((await workerBuild(game,'active')).build,older);
   assert.equal(await game.evaluate(async()=>(await navigator.serviceWorker.getRegistration()).waiting?.state),'installed','one remaining game window must still block activation');
   await game.close();
   await nextWorker.evaluate(async()=>{for(let i=0;i<150;i++){if(!self.registration.waiting&&self.registration.active?.state==='activated')return;await new Promise(ok=>setTimeout(ok,100))}throw Error('Worker did not activate after natural client closure')});
   await context.setOffline(true);
   const reopened=await context.newPage();await reopened.goto(base,{waitUntil:'load'});await reopened.locator('#start').waitFor();
   const active=await workerBuild(reopened,'active');assert.equal(active.build,current);assert.equal(active.ready,true);
   assert.equal(await reopened.evaluate(()=>JSON.stringify(Object.entries(localStorage).sort())),saved);
   assert.deepEqual(updateErrors,[],'no page errors in automatic update migration');
   automaticUpdates={gameUrlOnly:true,downloadedWithoutSetupPage:true,openRunNotReloaded:true,recordsUnchanged:true,activatedAfterNaturalClose:true,reopenedOffline:true};
  }finally{updateWorker=null;await context.close()}
  fs.writeFileSync(path.join(output,'browser-results.json'),JSON.stringify({status:'passed',results,automaticUpdates,limits:'Synthetic mobile Chromium touch plus separate standard Chromium offline/update integration; no physical Android FPS, heat, battery, controller or APK claim.'},null,2)+'\n');
  console.log(JSON.stringify({browser:'Chromium',viewports:results.length,results,automaticUpdates}));
 }catch(error){fs.writeFileSync(path.join(output,'browser-results.json'),JSON.stringify({status:'failed',results,error:error.message},null,2)+'\n');throw error;}finally{if(browser)await browser.close();if(server)await new Promise(ok=>server.close(ok));}
})().catch(error=>{console.error(error);process.exitCode=1});
