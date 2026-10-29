function bindPress(button,action){
  button.addEventListener('pointerdown',e=>{if(e.button!==0||!button.isConnected||document.hidden)return;e.preventDefault();action()});
  button.onclick=e=>{if(e.detail===0&&button.isConnected&&!document.hidden)action()};
}
bindPress(document.getElementById('pause'),()=>pause());
bindPress(document.getElementById('regroup'),regroupRescue);bindPress(document.getElementById('decoy'),deployDecoy);
document.addEventListener('keydown',e=>{
  const key=e.key.toLowerCase();
  if(document.hidden)return;if(key==='escape'){e.preventDefault();if(!e.repeat)gameBack();return}
  if(mode!=='play'&&['SELECT','INPUT','TEXTAREA','BUTTON','SUMMARY'].includes(e.target?.tagName))return;
  if([' ','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))e.preventDefault();
  if(key==='p'&&!e.repeat){pause();return}
  if(mode!=='play')return;
  if(key==='r'&&!e.repeat){regroupRescue();return}
  if(key==='q'&&!e.repeat){deployDecoy();return}
  keys[key]=true;
  if(e.code==='Space'&&!e.repeat)dash();
});
document.addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
function movementInput(){let x=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0)+touch.x,y=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0)+touch.y;const length=Math.hypot(x,y);if(length>1){x/=length;y/=length}return streetSession&&streetAngled?streetDirection(x,y):{x,y}}
function dashCooldown(rank=p.capacitor||0){return (survivorById(runSurvivor).dash||2.5)-.25*Math.min(2,rank)}
function dash(){if(mode==='play'&&p.dashCd<=0){const move=movementInput(),length=Math.hypot(move.x,move.y);if(length>0){lastMove.x=move.x/length;lastMove.y=move.y/length}p.stillTime=0;if(p.evasive)p.evasiveUntil=elapsed+2;p.dashX=lastMove.x;p.dashY=lastMove.y;p.dash=.17;p.dashCd=dashCooldown();p.inv=Math.max(p.inv,.25);updateHUD();combatCue('dash',190,.14,'sawtooth',.02)}}
bindPress(document.getElementById('dash'),dash);
let stick=document.getElementById('stick'),nub=document.getElementById('nub');
function moveStick(e){
  const r=stick.getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2,l=Math.hypot(x,y),f=clamp((l-6)/39,0,1);
  touch.x=l?x/l*f:0;touch.y=l?y/l*f:0;
  nub.style.transform=`translate(${touch.x*38}px,${touch.y*38}px)`;
}
stick.addEventListener('pointerdown',e=>{
  if(mode!=='play'||touch.id!==null)return;
  e.preventDefault();touch.id=e.pointerId;stick.setPointerCapture(e.pointerId);moveStick(e);
});
stick.addEventListener('pointermove',e=>{if(e.pointerId===touch.id)moveStick(e)});
function resetStick(){
  const id=touch.id;touch.x=touch.y=0;touch.id=null;nub.style.transform='';
  if(id!==null&&stick.hasPointerCapture(id))stick.releasePointerCapture(id);
}
function finishStick(e){if(e.pointerId===touch.id)resetStick()}
stick.addEventListener('pointerup',finishStick);
stick.addEventListener('pointercancel',finishStick);
stick.addEventListener('lostpointercapture',finishStick);
let inputEpoch=0,phoneWide=W>H;
function clearInput(){inputEpoch++;breakPerformanceSegment();for(const key of Object.keys(keys))delete keys[key];resetStick()}
function suspendGame(){stopAudioVoices();musicTrack.preview=false;stopBackgroundMusic();clearInput();if(mode==='play')pause('Paused when you left the game. Tap resume when you are ready.');if(audioCtx&&audioCtx.state==='running')audioCtx.suspend().catch(()=>{})}
addEventListener('blur',suspendGame);
addEventListener('pagehide',suspendGame);
document.addEventListener('visibilitychange',()=>{if(document.hidden)suspendGame()});
document.addEventListener('freeze',suspendGame);
addEventListener('resize',()=>{clearInput();const wide=W>H;if(wide!==phoneWide){phoneWide=wide;if(mode==='play')pause('Screen rotated. Resume when you are ready.')}if(mode==='end')render()});
