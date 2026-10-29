// Real Chromium tests. A missing/blocked browser is a failure, never a silent pass.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
let chromium;
try{({chromium}=require('playwright'))}catch{throw Error('Browser tooling missing. Run npm run setup:browser in an environment with approved network access.');}
const {createServer}=require('../scripts/serve.cjs');
const {root,json}=require('../scripts/lib/project.cjs');
(async()=>{
 let browser,server;
 const output=path.join(root,'test-results');fs.mkdirSync(output,{recursive:true});
 const results=[];
 try{
  browser=await chromium.launch({headless:true,...(process.env.LS_CHROMIUM?{executablePath:process.env.LS_CHROMIUM}:{})});
  server=createServer();await new Promise((ok,fail)=>{server.once('error',fail);server.listen(0,'127.0.0.1',ok)});
  const base='http://127.0.0.1:'+server.address().port+'/last-stand-after-dark/';
  for(const [width,height]of [[412,915],[915,412]]){
   // Disposable storage: never point this fixture at the owner's installed profile.
   const context=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:true,deviceScaleFactor:1.75});
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
   // Use fresh tabs: keep the gameplay History/Back drill out of installer setup.
   const setupPage=await context.newPage();
   await setupPage.goto(base+'install/',{waitUntil:'networkidle'});
   await setupPage.locator('#prepare').click();
   await setupPage.waitForFunction(async()=>{
    const registration=await navigator.serviceWorker.getRegistration();
    return registration?.active?.state==='activated'&&document.getElementById('status').textContent.includes('Offline play is ready');
   },undefined,{timeout:90000});
   const expected=json('web-dist/build-info.json').build;
   await setupPage.waitForFunction(async build=>(await caches.keys()).some(k=>k.includes(build)),expected,{timeout:90000});
   const controlledPage=await context.newPage();
   const response=await controlledPage.goto(base,{waitUntil:'networkidle'});
   const state=await controlledPage.evaluate(async()=>({
    url:location.href,controller:navigator.serviceWorker.controller?.scriptURL||null,
    controllerState:navigator.serviceWorker.controller?.state||null,
    registrations:(await navigator.serviceWorker.getRegistrations()).map(r=>({scope:r.scope,active:r.active?.scriptURL,state:r.active?.state})),
    caches:await caches.keys()
   }));
   console.log(JSON.stringify({phase:'before-offline',width,height,fromServiceWorker:response.fromServiceWorker(),state}));
   await controlledPage.waitForFunction(()=>navigator.serviceWorker.controller?.state==='activated');
   await context.setOffline(true);await controlledPage.reload({waitUntil:'load'});await controlledPage.locator('#start').waitFor();
   const coldPage=await context.newPage();await coldPage.goto(base,{waitUntil:'load'});await coldPage.locator('#start').waitFor();
   results.at(-1).offlineReload=true;results.at(-1).offlineLaunch=true;await context.close();
  }
  fs.writeFileSync(path.join(output,'browser-results.json'),JSON.stringify({status:'passed',results,limits:'Synthetic Chromium touch; no physical Android FPS, heat, battery, controller or APK claim.'},null,2)+'\n');
  console.log(JSON.stringify({browser:'Chromium',viewports:results.length,results}));
 }catch(error){fs.writeFileSync(path.join(output,'browser-results.json'),JSON.stringify({status:'failed',results,error:error.message},null,2)+'\n');throw error;}finally{if(browser)await browser.close();if(server)await new Promise(ok=>server.close(ok));}
})().catch(error=>{console.error(error);process.exitCode=1});
