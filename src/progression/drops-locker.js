const DROP_TUNING=Object.freeze({first:70,interval:100,signal:4,lifetime:22,radius:21,sweep:500,retry:5});
function nearDrop(a,padding=0){return !!supplyDrop&&dist(a,supplyDrop)<supplyDrop.r+padding}
function placeDrop(){
  if(supplyDrop)return false;
  const r=DROP_TUNING.radius,facing=Math.atan2(lastMove.y,lastMove.x);let fallback=null;
  for(let i=0;i<72;i++){
    const angle=facing+(i%24)*2.3999632297,d=140+Math.floor(i/24)*25;
    const b={x:p.x+Math.cos(angle)*d,y:p.y+Math.sin(angle)*d,r,phase:'signal',readyAt:elapsed+DROP_TUNING.signal,until:elapsed+DROP_TUNING.signal+DROP_TUNING.lifetime};
    if(Math.abs(b.x-p.x)>W/2-r-18||Math.abs(b.y-p.y)>H/2-r-30||nearBarricade(b,r+20)||barrels.some(a=>!a.spent&&dist(a,b)<r+a.r+25)||supplyCache&&dist(supplyCache,b)<r+supplyCache.r+20||salvage&&dist(salvage,b)<r+salvage.r+20||rescue&&dist(rescue,b)<r+rescue.r+25||exitBeacon&&dist(exitBeacon,b)<r+exitBeacon.r+30)continue;
    const overlaps=o=>b.x>o.x-r-20&&b.x<o.x+o.w+r+20&&b.y>o.y-r-20&&b.y<o.y+o.h+r+20;
    if(!obstacles.some(overlaps)){supplyDrop=b;return true}if(!fallback)fallback={b,overlaps};
  }
  if(fallback){obstacles=obstacles.filter(o=>!fallback.overlaps(o));supplyDrop=fallback.b;return true}return false;
}
function placeLocker(){
 let fallback=null;
 for(let i=0;i<72;i++){const angle=Math.atan2(lastMove.y,lastMove.x)+i*2.3999632297,d=165+Math.floor(i/24)*30,b={x:p.x+Math.cos(angle)*d,y:p.y+Math.sin(angle)*d,r:22};
  if(Math.abs(b.x-p.x)>W/2-36||Math.abs(b.y-p.y)>H/2-45||nearBarricade(b,45)||barrels.some(a=>dist(a,b)<65)||shockDrums.some(a=>dist(a,b)<65)||objectiveTargets().some(a=>dist(a,b)<(a.r||20)+60))continue;
  if(!fallback)fallback=b;if(obstacles.some(o=>pointRectDistance(b,o)<50))continue;locker=b;return true;
 }
 if(fallback){obstacles=obstacles.filter(o=>pointRectDistance(fallback,o)>=50);locker=fallback;return true}return false;
}
function updateLocker(){
 if(mode!=='play'||training||p.hp<=0||lockerOffered||!bossesDefeated)return;
 if(activeBoss||bossWarned||rushPhase==='active'||rushPhase==='warning'||elapsed<reliefUntil||salvage||convoy||supplyDrop||exitBeacon)return;
 if(placeLocker()){lockerOffered=true;toast('FIELD LOCKER · PAUSE NEARBY FOR A TOOL CHOICE',2800)}
}
function nearLocker(){return !!(locker&&dist(p,locker)<=80)}
function lockerPauseControl(){return !training&&nearLocker()?'<p><button class="btn secondary" id="pauseLocker">OPEN FIELD LOCKER</button></p>':''}
function showLocker(){
 if(mode!=='paused'||training||p.hp<=0||!nearLocker())return;mode='locker';
 show(`<div class="eyebrow">ONE FIELD RESUPPLY PER RUN</div><h1 style="font-size:44px">FIELD LOCKER</h1><p>Choose one tool. No health, damage, XP or enemy changes. The locker is consumed only when you take a tool.</p><div class="cards two"><button class="choice" id="locker-reroll" ${rerollsLeft>=2?'disabled':''}><b>ONE REROLL</b><span>${rerollsLeft}/2 carried · take one if below capacity</span></button><button class="choice" id="locker-decoy" ${decoyCharges>=2?'disabled':''}><b>ONE DECOY</b><span>${decoyCharges}/2 carried · take one if below capacity</span></button></div><button class="btn secondary" id="lockerBack">BACK TO PAUSE</button>`);
 for(const kind of ['reroll','decoy'])bindUpgradePress(document.getElementById('locker-'+kind),()=>takeLocker(kind),()=>mode==='locker');bindPress(document.getElementById('lockerBack'),()=>{if(mode==='locker'){mode='play';pause()}});
}
function takeLocker(kind){
 if(mode!=='locker'||document.hidden||p.hp<=0||!nearLocker()||kind==='reroll'&&rerollsLeft>=2||kind==='decoy'&&decoyCharges>=2||!['reroll','decoy'].includes(kind))return;
 if(kind==='reroll')rerollsLeft++;else decoyCharges++;locker=null;lockersUsed=1;mode='play';recordRunEvent('locker');checkContract();pause();
}
function renderLocker(){if(!locker)return;g.save();if(!drawFieldCase(locker,'locker')){g.fillStyle='#b8e1ce';g.strokeStyle='#324e45';g.lineWidth=3;g.fillRect(locker.x-20,locker.y-18,40,36);g.strokeRect(locker.x-20,locker.y-18,40,36);g.beginPath();g.moveTo(locker.x,locker.y-17);g.lineTo(locker.x,locker.y+17);g.stroke();}g.fillStyle='#c9f9df';g.font='bold 10px system-ui';g.textAlign='center';g.fillText('FIELD LOCKER',locker.x,locker.y-28);g.restore()}
function dropSweepRadius(){return runSurvivor==='scavenger'?650:DROP_TUNING.sweep}
function updateDrops(dt,from){
  if(mode!=='play'||p.hp<=0)return;
  if(supplyDrop&&(elapsed>=supplyDrop.until||dist(supplyDrop,p)>1200||exitBeacon&&dist(supplyDrop,exitBeacon)<supplyDrop.r+exitBeacon.r+20))supplyDrop=null;
  if(supplyDrop){
    const b=supplyDrop;
    if(b.phase==='signal'&&elapsed>=b.readyAt){b.phase='ready';toast('SUPPLY DOWN • XP SWEEP + DASH REFRESH',2300);sound(430,.13,'triangle',.025)}
    // Only the part of a dash after touchdown can collect the crate.
    const t=dt>0?clamp((b.readyAt-(elapsed-dt))/dt,0,1):0,collectFrom={x:from.x+(p.x-from.x)*t,y:from.y+(p.y-from.y)*t};
    if(b.phase==='ready'&&segmentDistance(b,collectFrom,p)<=b.r+p.r){
      supplyDrop=null;let recovered=0;
      for(let i=gems.length-1;i>=0;i--)if(dist(gems[i],p)<=dropSweepRadius()){recovered+=gems[i].value;gems.splice(i,1)}
      recordCollectedXp(recovered);xp+=recovered;dropXpRecovered+=recovered;dropsCollected++;recordRunEvent('drop');p.dashCd=0;
      floatText(b.x,b.y-35,`XP SWEEP +${recovered} • DASH READY`,'#d5b6ff');burst(b.x,b.y,'#c49bff',14);sound(590,.15,'sine',.03);toast(`SUPPLY COLLECTED • +${recovered} EARNED XP • DASH READY`,2400);
    }
  }
  if(supplyDrop||elapsed<nextDropAt)return;
  if(convoy||activeBoss||bossWarned||rushPhase==='active'||rushPhase==='warning'||elapsed<reliefUntil||salvage||exitBeacon)return;
  const placed=placeDrop();nextDropAt=elapsed+(placed?DROP_TUNING.interval:DROP_TUNING.retry);
  if(placed)toast('SUPPLY SIGNAL • PURPLE MARKER • LANDING IN 4s',2500);
}
function dropHUD(){
  const b=supplyDrop;document.getElementById('dropGoal').textContent=b?`DROP ${bossBearing(b)} • ${b.phase==='signal'?'LANDING IN '+Math.max(0,Math.ceil(b.readyAt-elapsed))+'s':Math.max(0,Math.ceil(b.until-elapsed))+'s • XP SWEEP + DASH READY'}`:'';
}
function renderDrop(){
  if(!supplyDrop)return;const b=supplyDrop;g.save();g.textAlign='center';g.lineWidth=2;g.strokeStyle='#c49bff';g.fillStyle='#c49bff18';
  g.beginPath();g.arc(b.x,b.y,b.r+7+Math.sin(elapsed*4)*2,0,Math.PI*2);g.fill();g.stroke();
  if(b.phase==='signal'){
    g.setLineDash([5,6]);g.beginPath();g.moveTo(b.x,b.y-65);g.lineTo(b.x,b.y+26);g.moveTo(b.x-26,b.y);g.lineTo(b.x+26,b.y);g.stroke();g.setLineDash([]);
    g.fillStyle='#e3ceff';g.font='bold 10px system-ui';g.fillText('SUPPLY IN '+Math.max(0,Math.ceil(b.readyAt-elapsed))+'s',b.x,b.y-38);
  }else{
    if(drawFieldCase(b,'drop')){g.fillStyle='#bfa1e5'}else{
    g.fillStyle='#44345d';g.fillRect(b.x-18,b.y-15,36,30);g.strokeStyle='#d5b6ff';g.strokeRect(b.x-18,b.y-15,36,30);g.fillStyle='#bfa1e5';g.fillRect(b.x-12,b.y-15,4,30);g.fillRect(b.x+8,b.y-15,4,30);g.strokeStyle='#ffe1a3';g.beginPath();g.moveTo(b.x-5,b.y-4);g.lineTo(b.x,b.y+4);g.lineTo(b.x+5,b.y-4);g.stroke();
    }
    g.font='bold 10px system-ui';g.fillText('XP SWEEP • DASH',b.x,b.y-34);
  }
  g.restore();
}
// Small pressure increase after owner found Alpha 0.4's boss a little easy.
