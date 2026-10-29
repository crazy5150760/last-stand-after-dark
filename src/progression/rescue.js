const RESCUE_TUNING=Object.freeze({first:120,afterStay:20,radius:13,recruitRange:48,regroup:4,relocate:900});
function rescueSpot(distance=150){
  const r=RESCUE_TUNING.radius,facing=Math.atan2(lastMove.y,lastMove.x);
  let fallback=null;
  for(let i=0;i<64;i++){
    const angle=facing+i*2.3999632297,d=distance+(i%3)*15,b={x:p.x+Math.cos(angle)*d,y:p.y+Math.sin(angle)*d,r,following:false,regroupReadyAt:0};
    if(Math.abs(b.x-p.x)>W/2-r-18||Math.abs(b.y-p.y)>H/2-r-30||nearBarricade(b,r+12)||nearDrop(b,r+15)||barrels.some(a=>!a.spent&&dist(a,b)<r+a.r+20)||supplyCache&&dist(supplyCache,b)<r+supplyCache.r+15||salvage&&dist(salvage,b)<r+salvage.r+15||exitBeacon&&dist(exitBeacon,b)<r+exitBeacon.r+35)continue;
    const overlaps=o=>b.x>o.x-r-15&&b.x<o.x+o.w+r+15&&b.y>o.y-r-15&&b.y<o.y+o.h+r+15;
    if(!obstacles.some(overlaps))return b;if(!fallback)fallback={b,overlaps};
  }
  if(fallback){obstacles=obstacles.filter(o=>!fallback.overlaps(o));return fallback.b}return null;
}
function updateRescueAvailability(){
  if(mode!=='play'||p.hp<=0||elapsed<nextRescueAt)return;
  if(convoy||activeBoss||bossWarned||rushPhase==='active'||rushPhase==='warning'||elapsed<reliefUntil||salvage)return;
  if(rescue&&(rescue.following||dist(rescue,p)<=RESCUE_TUNING.relocate))return;
  if(!rescue&&rescueOffered)return;
  nextRescueAt=elapsed+5;const spot=rescueSpot();if(!spot)return;
  rescue=spot;rescueOffered=true;toast('SURVIVOR SIGNAL • APPROACH WHITE MARKER • ESCORT TO GREEN',3500);
}
function rescueHUD(){
  const line=document.getElementById('rescueGoal'),button=document.getElementById('regroup');
  line.textContent=rescue?rescue.following?`RESCUE ${bossBearing(rescue)} • ${dist(rescue,p)>120?'REGROUP TO CATCH UP':exitBeacon?'ESCORT TO GREEN':'FOLLOWING · EXIT AT '+fmt(exitAt)}`:`SURVIVOR ${bossBearing(rescue)} • APPROACH TO RECRUIT`:'';
  const available=mode==='play'&&!!(rescue&&rescue.following),ready=available&&elapsed>=rescue.regroupReadyAt;
  button.style.display=available?'block':'none';button.textContent=ready?'REGROUP':available?`REGROUP ${Math.max(0,rescue.regroupReadyAt-elapsed).toFixed(1)}s`:'REGROUP';button.setAttribute('aria-disabled',String(!ready));
}
function regroupRescue(){
  if(mode!=='play'||p.hp<=0||!rescue||!rescue.following||elapsed<rescue.regroupReadyAt)return false;
  let spot=null;
  for(let i=0;i<24;i++){
    const a=Math.atan2(lastMove.y,lastMove.x)+Math.PI+i*2.3999632297,b={x:p.x+Math.cos(a)*45,y:p.y+Math.sin(a)*45};
    if(!nearBarricade(b,rescue.r+3)){spot=b;break}
  }
  if(!spot&&!nearBarricade(p,rescue.r+2))spot={x:p.x,y:p.y};if(!spot)return false;
  rescue.x=spot.x;rescue.y=spot.y;rescue.regroupReadyAt=elapsed+RESCUE_TUNING.regroup;
  burst(rescue.x,rescue.y,'#e9ffff',6);toast('SURVIVOR REGROUPED • HEAD FOR GREEN',1500);updateHUD();return true;
}
function updateRescue(dt,from){
  if(mode!=='play'||p.hp<=0)return;updateRescueAvailability();if(!rescue)return;
  if(!rescue.following&&segmentDistance(rescue,from,p)<=RESCUE_TUNING.recruitRange){rescue.following=true;toast('SURVIVOR FOLLOWING • ESCORT TO GREEN • REGROUP IF SEPARATED',3000);sound(510,.12,'sine',.03)}
  if(!rescue.following)return;
  const before={x:rescue.x,y:rescue.y},d=dist(rescue,p),speed=Math.max(245,p.speed*(d>120?4:1.15)),step=Math.min(Math.max(0,d-42),speed*dt);
  if(d>0){rescue.x+=(p.x-rescue.x)*step/d;rescue.y+=(p.y-rescue.y)*step/d}resolveBarricadeBody(rescue,before);
  if(!exitBeacon)return;
  const playerArrives=segmentDistance(exitBeacon,from,p)<=exitBeacon.r+p.r;
  if(!playerArrives&&segmentDistance(exitBeacon,before,rescue)>exitBeacon.r+rescue.r)return;
  // Recruited survivors board together on player arrival, even if cover separated the party.
  if(playerArrives)rescueArrival={from:{x:from.x,y:from.y},beacon:exitBeacon};
  rescue=null;rescuesCompleted++;recordRunEvent('rescue');bonusChoices++;bonusKinds.push('rescue');nextRescueAt=Infinity;
  toast('SURVIVOR SAFE • BONUS UPGRADE',2500);sound(660,.18,'sine',.03);
}
function finishRescueArrival(){
  if(mode!=='play'||!rescueArrival)return;
  const arrival=rescueArrival;rescueArrival=null;if(exitBeacon===arrival.beacon)updateExtractionArrival(arrival.from);
}
function renderRescue(){
  if(!rescue)return;const b=rescue;g.save();
  if(b.following){g.strokeStyle='#c8ffff55';g.lineWidth=1;g.setLineDash([4,7]);g.beginPath();g.moveTo(b.x,b.y);g.lineTo(p.x,p.y);g.stroke();g.setLineDash([])}
  g.fillStyle='#e9ffff';g.strokeStyle='#719bad';g.lineWidth=2;g.beginPath();g.arc(b.x,b.y,b.r,0,Math.PI*2);g.fill();g.stroke();
  g.fillStyle='#355466';g.fillRect(b.x-5,b.y-3,3,3);g.fillRect(b.x+3,b.y-3,3,3);g.fillStyle='#a7ffda';g.fillRect(b.x-4,b.y+5,8,4);
  g.strokeStyle='#d7ffff88';g.lineWidth=1;g.beginPath();g.arc(b.x,b.y,b.r+8+Math.sin(elapsed*3)*2,0,Math.PI*2);g.stroke();
  g.font='bold 10px system-ui';g.textAlign='center';g.fillStyle='#e9ffff';g.fillText(b.following?'FOLLOWING · TO GREEN':'SURVIVOR · APPROACH',b.x,b.y-30);g.restore();
}
