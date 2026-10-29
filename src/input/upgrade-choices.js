function bindUpgradePress(button,action,allowed=()=>mode==='upgrade',delay=450){
  const readyAt=performance.now()+delay;let pointer=null,key=null,startX=0,startY=0,stamp=0;
  const current=()=>allowed()&&button.isConnected&&!document.hidden;
  const ready=()=>current()&&performance.now()>=readyAt;
  const cancel=()=>{pointer=null;key=null};
  const travelled=e=>Math.hypot((e.clientX??startX)-startX,(e.clientY??startY)-startY)>12;
  button.addEventListener('pointerdown',e=>{
    if(stamp!==inputEpoch)cancel();if(e.button!==0||pointer!==null||!ready())return;
    stamp=inputEpoch;pointer=e.pointerId;startX=e.clientX;startY=e.clientY;
  });
  button.addEventListener('pointermove',e=>{if(e.pointerId===pointer&&travelled(e))pointer=null});
  button.addEventListener('pointerup',e=>{
    if(pointer===null||e.pointerId!==pointer)return;
    pointer=null;if(stamp===inputEpoch&&ready()&&!travelled(e)){e.preventDefault();action()}
  });
  for(const event of ['pointercancel','pointerleave','lostpointercapture'])button.addEventListener(event,e=>{if(e.pointerId===pointer)pointer=null});
  button.addEventListener('blur',cancel);
  button.addEventListener('keydown',e=>{
    if(e.key!=='Enter'&&e.key!==' ')return;
    if(stamp!==inputEpoch)cancel();e.preventDefault();if(!e.repeat&&ready()){key=e.key;stamp=inputEpoch}
  });
  button.addEventListener('keyup',e=>{
    if(e.key!=='Enter'&&e.key!==' ')return;
    e.preventDefault();const armed=key===e.key&&stamp===inputEpoch;key=null;if(armed&&ready())action();
  });
  // Screen readers and programmatic accessibility activation use detail zero.
  button.onclick=e=>{if(stamp!==inputEpoch)cancel();if(e?.detail===0&&pointer===null&&key===null&&ready())action()};
}
// Ease toward the late-run floor instead of reaching it before the first exit.
// Active run time only: records, retries and completed runs never affect this curve.
