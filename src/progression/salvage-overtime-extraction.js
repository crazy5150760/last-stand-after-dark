const SALVAGE_TUNING=Object.freeze({first:15,lifetime:20,hold:6,radius:110,compactRadius:80,entryRadius:260,stun:2,shield:1,interval:90,gap:3});
function salvageInterrupted(){return !!(activeBoss||bossWarned||rushPhase==='active'||rushPhase==='warning'||exitBeacon)}
function salvageContested(){return salvage&&enemies.some(e=>e.hp>0&&dist(e,salvage)<=e.r+salvage.r)}
function salvageStatus(){return !salvage||dist(p,salvage)>salvage.r?'ENTER GOLD CIRCLE':salvageContested()?'UNDER ATTACK · KEEP MOVING':'HOLD POSITION'}
function placeSalvage(){
  const facing=Math.atan2(lastMove.y,lastMove.x);
  // Prefer more dodging room; retain the proven compact size when physical clearance is tight.
  for(const r of [SALVAGE_TUNING.radius,SALVAGE_TUNING.compactRadius]){
    const maxX=Math.max(0,W/2-r-12),maxY=Math.max(0,H/2-r-24);
    let fallback=null;
    for(let i=0;i<192;i++){
      const angle=facing+(i%32)*2.3999632297,d=120+Math.floor(i/32)*24;
      const b={x:p.x+Math.cos(angle)*d,y:p.y+Math.sin(angle)*d,r,until:elapsed+SALVAGE_TUNING.lifetime,progress:0,entered:false};
      if(Math.abs(b.x-p.x)>maxX||Math.abs(b.y-p.y)>maxY||nearDrop(b,r+15)||barrels.some(other=>!other.spent&&dist(other,b)<r+other.r+20)||supplyCache&&dist(supplyCache,b)<r+supplyCache.r+20||nearBarricade(b,r+20))continue;
      const overlaps=o=>b.x>o.x-r-15&&b.x<o.x+o.w+r+15&&b.y>o.y-r-15&&b.y<o.y+o.h+r+15;
      if(!obstacles.some(overlaps)){salvage=b;return true}
      if(!fallback)fallback={b,overlaps};
    }
    if(fallback){obstacles=obstacles.filter(o=>!fallback.overlaps(o));salvage=fallback.b;return true}
  }
  return false;
}
function activateSalvage(){
  if(mode!=='play'||p.hp<=0||!salvage||salvage.entered||salvageInterrupted()||elapsed>=salvage.until||dist(p,salvage)>salvage.r)return false;
  salvage.entered=true;
  const radius=SALVAGE_TUNING.entryRadius;
  for(const e of enemies){
    if(e.hp<=0||dist(e,p)>radius+e.r)continue;
    const d=dist(e,p),angle=d?Math.atan2(e.y-p.y,e.x-p.x):Math.atan2(lastMove.y,lastMove.x);
    e.x=p.x+Math.cos(angle)*(radius+e.r+1);e.y=p.y+Math.sin(angle)*(radius+e.r+1);
    e.salvageStunUntil=Math.max(e.salvageStunUntil||0,elapsed+SALVAGE_TUNING.stun);
    if(e.spitter){e.phase='approach';e.cooldown=SPITTER_TUNING.cooldown;e.phaseTime=0}
    // Keep displaced bodies outside solid wood; the brief shield also covers an obstructed push.
    resolveBarricadeBody(e,{x:e.x,y:e.y});
  }
  hostileShots=hostileShots.filter(shot=>dist(shot,p)>radius+shot.r);
  p.inv=Math.max(p.inv,SALVAGE_TUNING.shield);
  blastRings.push({x:p.x,y:p.y,life:.55,max:.55,radius,color:'#ffdb8d'});
  burst(p.x,p.y,'#ffdb8d',12);sound(440,.18,'sine',.03);
  toast('SALVAGE PULSE • HOLD 6s • KEEP MOVING',2500);return true;
}
function salvageHasWindow(){
  const window=SALVAGE_TUNING.lifetime+SALVAGE_TUNING.gap;
  return nextBossAt-elapsed>window+10&&nextRushAt-elapsed>window+RUSH_TUNING.warning&&exitAt-elapsed>window;
}
function salvageWaitingStatus(){
  if(exitBeacon)return '';
  if(salvageInterrupted()||elapsed<reliefUntil)return 'SALVAGE • AFTER THIS ENCOUNTER';
  if(nextSalvageAt<=elapsed+3&&!salvageHasWindow())return 'SALVAGE • WAITING FOR A SAFE WINDOW';
  if(elapsed<nextSalvageAt)return `SALVAGE IN ${fmt(Math.ceil(nextSalvageAt-elapsed))}`;
  return 'SALVAGE • FINDING A CLEAR SPOT';
}
function updateSalvageAvailability(){
  if(mode!=='play')return;
  if(salvage&&(salvageInterrupted()||elapsed>=salvage.until)){salvage=null;return}
  if(convoy||salvage||elapsed<nextSalvageAt||elapsed<reliefUntil)return;
  if(salvageInterrupted()||!salvageHasWindow()){nextSalvageAt=elapsed+3;return}
  const placed=placeSalvage();nextSalvageAt=elapsed+(placed?SALVAGE_TUNING.interval:5);
  if(placed)toast('SALVAGE OPEN • ENTER FOR A DEFENSIVE PULSE',3000);
}
function updateSalvageProgress(dt,from){
  if(mode!=='play'||p.hp<=0||!salvage)return;
  if(salvageInterrupted()||elapsed>=salvage.until){salvage=null;return}
  if(dist(p,salvage)>salvage.r||dist(from,salvage)>salvage.r)return;
  salvage.progress=Math.min(SALVAGE_TUNING.hold,salvage.progress+dt);
  if(salvage.progress+1e-8<SALVAGE_TUNING.hold)return;
  const b=salvage;salvage=null;salvagesSecured++;recordRunEvent('salvage');bonusChoices++;bonusKinds.push('salvage');
  floatText(b.x,b.y-25,'SALVAGE SECURED','#ffdb8d');burst(b.x,b.y,'#ffdb8d',12);sound(590,.2,'sine',.035);
  toast('SALVAGE SECURED • FREE UPGRADE',2200);
}
function renderSalvage(){
  if(!salvage)return;const b=salvage;
  g.save();g.fillStyle='#ffd56a0d';g.strokeStyle='#b79550';g.lineWidth=2;g.beginPath();g.arc(b.x,b.y,b.r,0,Math.PI*2);g.fill();g.stroke();
  g.strokeStyle='#ffe09a';g.lineWidth=5;g.beginPath();g.arc(b.x,b.y,b.r,-Math.PI/2,-Math.PI/2+Math.PI*2*b.progress/SALVAGE_TUNING.hold);g.stroke();
  if(drawFieldCase(b,'salvage')){g.fillStyle='#ffdb8d'}else{
  g.fillStyle='#3c3328';g.fillRect(b.x-17,b.y-14,34,28);g.strokeStyle='#ffdb8d';g.lineWidth=2;g.strokeRect(b.x-17,b.y-14,34,28);g.fillStyle='#ffdb8d';g.fillRect(b.x-3,b.y-14,6,28);
  }
  g.font='bold 11px system-ui';g.textAlign='center';g.fillText('SALVAGE · FREE UPGRADE',b.x,b.y-b.r-13);g.fillText(salvageStatus(),b.x,b.y+b.r+18);g.restore();
}
const RUSH_TUNING=Object.freeze({warning:5,duration:12,hunters:16,interval:.75,heal:15,breather:4});
function scheduleRush(at){
  nextRushAt=at;rushPhase='waiting';rushUntil=0;rushClock=0;rushSpawned=0;rushPendingReward=false;
}
function spawnRushHunter(){
  if(enemies.length>=239||rushSpawned>=RUSH_TUNING.hunters)return false;
  const side=rushSpawned%2?-1:1,scale=1+elapsed/200;
  const x=p.x+(rushAxis==='horizontal'?side*(W/2+70):rand(-W*.3,W*.3));
  const y=p.y+(rushAxis==='vertical'?side*(H/2+70):rand(-H*.3,H*.3));
  enemies.push({x,y,hp:24*scale,max:24*scale,speed:145*Math.min(1.6,1+elapsed/350)*overtimePressure().speed,r:ENEMY_ART.hunter.r,dmg:9,col:ENEMY_ART.hunter.col,hit:0,type:1,rush:true});
  rushSpawned++;return true;
}
function updateRush(dt){
  if(activeBoss){if(rushPhase!=='waiting'||Number.isFinite(nextRushAt))scheduleRush(Infinity);return}
  if(rushPhase!=='active'){
    if(!Number.isFinite(nextRushAt))return;
    // Reserve time for the whole event and a clear gap before the next boss warning.
    if(elapsed<reliefUntil)return;
    if(nextBossAt-elapsed<RUSH_TUNING.duration+15){scheduleRush(Infinity);return}
    if(rushPhase==='waiting'&&elapsed>=nextRushAt-RUSH_TUNING.warning){
      rushPhase='warning';rushAxis=Math.random()<.5?'horizontal':'vertical';
      toast(`BLACKOUT IN 5s • HUNTERS ${rushAxis==='horizontal'?'LEFT + RIGHT':'TOP + BOTTOM'}`,3000);sound(160,.2,'triangle',.025,'alerts');
    }
    if(rushPhase==='warning'&&elapsed>=nextRushAt){
      rushPhase='active';recordRunEvent('blackout');rushUntil=nextRushAt+RUSH_TUNING.duration;rushClock=0;
      toast('BLACKOUT RUSH • SURVIVE 12 SECONDS',2500);sound(100,.25,'sawtooth',.03,'alerts');
    }
  }
  if(rushPhase==='active'){
    if(elapsed>=rushUntil){rushPendingReward=true;return}
    rushClock-=dt;
    if(rushClock<=0&&spawnRushHunter())rushClock=RUSH_TUNING.interval;
  }
}
function resolveRushReward(){
  // Resolve after damage, so dying on the final tick never grants a survival reward.
  if(!rushPendingReward||mode!=='play'||p.hp<=0)return;
  scheduleRush(Infinity);rushesSurvived++;recordRunEvent('blackout-clear');bonusChoices++;bonusKinds.push('blackout');
  const heal=Math.min(RUSH_TUNING.heal,p.max-p.hp);p.hp+=heal;reliefUntil=elapsed+RUSH_TUNING.breather;reliefLabel='BLACKOUT CLEAR';
  toast('BLACKOUT SURVIVED • BONUS UPGRADE',3500);sound(620,.2,'sine',.04,'alerts');
  if(heal>0)floatText(p.x,p.y-35,`+${Math.ceil(heal)} HP`,'#dac5ff');
}
function renderRushLights(){
  if(rushPhase!=='warning'&&rushPhase!=='active')return;
  g.save();g.globalAlpha=.45+.12*Math.sin(elapsed*Math.PI);g.strokeStyle='#b8a4ff';g.lineWidth=6;g.strokeRect(4,4,W-8,H-8);g.fillStyle='#d4c4ff';
  const markers=rushAxis==='horizontal'?[[18,H/2,0],[W-18,H/2,Math.PI]]:[[W/2,18,Math.PI/2],[W/2,H-18,-Math.PI/2]];
  for(const [x,y,angle] of markers){
    g.save();g.translate(x,y);g.rotate(angle);g.beginPath();g.moveTo(9,0);g.lineTo(-6,-9);g.lineTo(-6,9);g.closePath();g.fill();g.restore();
  }
  g.restore();
}
function overtimePressure(){return{spawn:Math.min(1.75,1+overtime*.2),speed:1+Math.min(.2,overtime*.04)}}
function updateExtractionWindow(){
  if(mode!=='play'||exitBeacon||elapsed<exitAt||bossesDefeated<1||activeBoss||rushPhase==='active'||rushPhase==='warning')return;
  exitBeacon={x:p.x+Math.min(W*.28,150),y:p.y-Math.min(H*.16,100),r:48};salvage=null;barricades=barricades.filter(b=>pointRectDistance(exitBeacon,b)>exitBeacon.r+50);
  obstacles=obstacles.filter(o=>!(exitBeacon.x>o.x-80&&exitBeacon.x<o.x+o.w+80&&exitBeacon.y>o.y-80&&exitBeacon.y<o.y+o.h+80));
  // A brief arrival margin prevents a newly scheduled encounter landing on the reveal.
  nextBossAt=Math.max(nextBossAt,elapsed+25);bossWarned=false;scheduleRush(Infinity);
  recordRunEvent('exit-open');toast('EXIT OPEN • REACH THE GREEN BEACON',3500);sound(440,.25,'sine',.04,'alerts');
}
function updateExtractionArrival(from){
  if(mode==='play'&&p.hp>0&&exitBeacon&&segmentDistance(exitBeacon,from,p)<=exitBeacon.r+p.r)showExtractionChoice();
}
function showExtractionChoice(){
  if(mode!=='play'||!exitBeacon||p.hp<=0)return;
  mode='extraction';
  const practice=training&&trainingScenario==='extraction';
  const nextPressure=Math.round(100*(Math.min(1.75,1+(overtime+1)*.2)-1));
  show(`<div class="eyebrow">${practice?'EXIT PRACTICE · UNSCORED':'THE EXIT IS YOURS'}</div><h1 style="font-size:48px">LEAVE OR<br>GO FURTHER?</h1><p>${fmt(elapsed)} survived · ${killCount} eliminations · ${bossesDefeated} bosses defeated</p><p class="muted">${survivorById(runSurvivor).name} · ${buildSummary()}</p>${practice?'<p>Practice only: Extract ends on frozen stats without saving a victory. Stay demonstrates the landing pulse and protection; the next practice exit opens in 10 active seconds. Normal runs need 03:00 and a defeated boss; normal overtime waits at least 60 seconds.</p>':'<p>Extract now to finish this run with a victory.</p>'}${practice?'<p>Stay to practice the landing pulse and safe escape. No new encounters spawn here; another practice exit opens after 10 active seconds.</p>':`<p>Stay to grow this build and chase a longer record.<br>Overtime ${overtime+1}: new hordes arrive ${nextPressure}% more often than normal and move a little faster.<br>The next exit can open after 60 seconds, once any active encounter is clear.</p>`}<p style="color:#a7ffda">Returning clears nearby enemies and grants ${EXIT_RETURN_TUNING.shield}s of protection so you can move away.</p><button class="btn" id="extract">EXTRACT — VICTORY →</button><p><button class="btn secondary" id="stay">STAY — OVERTIME ${overtime+1}</button></p><p class="muted">Time is paused while you choose. Weapons reset when you start a new run.</p>`);
  bindUpgradePress(document.getElementById('extract'),completeExtraction,()=>mode==='extraction');
  bindUpgradePress(document.getElementById('stay'),stayAfterDark,()=>mode==='extraction');
}
function completeExtraction(){if(mode==='extraction'&&exitBeacon&&p.hp>0)end('extracted')}
const EXIT_RETURN_TUNING=Object.freeze({radius:160,shield:1.5,breather:2});
function clearExitLanding(){
  let cleared=0;
  for(const e of enemies){
    if(e.hp>0&&dist(e,p)<=EXIT_RETURN_TUNING.radius+e.r){hitEnemy(e,e.hp,'EXIT');cleared++}
  }
  for(const b of barricades)if(b.hp>0&&pointRectDistance(p,b)<=EXIT_RETURN_TUNING.radius)damageBarricade(b,b.hp,'exit');
  enemies=enemies.filter(e=>e.hp>0);hostileShots=[];cancelHowls();cancelLobbers();
  for(const e of enemies)if(e.spitter){e.phase='approach';e.cooldown=SPITTER_TUNING.cooldown}
  if(activeBoss&&activeBoss.bossKind==='warden'){activeBoss.phase='approach';activeBoss.phaseTime=2.8}
  p.inv=Math.max(p.inv,EXIT_RETURN_TUNING.shield);
  if(elapsed+EXIT_RETURN_TUNING.breather>reliefUntil){reliefUntil=elapsed+EXIT_RETURN_TUNING.breather;reliefLabel='EXIT CLEAR'}
  blastRings.push({x:p.x,y:p.y,life:.55,max:.55,radius:EXIT_RETURN_TUNING.radius,color:'#8fffd8'});
  sound(390,.18,'sine',.035,'alerts');return cleared;
}
function stayAfterDark(){
  if(mode!=='extraction'||!exitBeacon||p.hp<=0)return;
  overtime++;recordRunEvent('overtime');exitBeacon=null;exitAt=elapsed+60;rescueArrival=null;if(!rescue){rescueOffered=false;nextRescueAt=elapsed+RESCUE_TUNING.afterStay;}
  if(!activeBoss){
    nextBossAt=Math.max(nextBossAt,elapsed+40);bossWarned=false;
    if(rushPhase!=='active'&&rushPhase!=='warning')scheduleRush(elapsed+10);
  }
  const cleared=clearExitLanding();
  if(training&&trainingScenario==='extraction'){exitAt=elapsed+10;scheduleRush(Infinity);rescue=null;nextRescueAt=Infinity}
  mode='play';hide();clearInput();last=performance.now();unlockAudio();
  toast(`EXIT CLEAR • ${cleared} ELIMINATED • ${EXIT_RETURN_TUNING.shield}s PROTECTION • OVERTIME ${overtime}`,3000);checkLevelUp();updateHUD();
}
function renderExtraction(){
  if(!exitBeacon)return;const b=exitBeacon;
  g.fillStyle='#65ffbc18';g.strokeStyle='#9affd2';g.lineWidth=3;
  g.beginPath();g.arc(b.x,b.y,b.r+3*Math.sin(elapsed*3),0,Math.PI*2);g.fill();g.stroke();
  g.strokeStyle='#b6ffdc';g.lineWidth=4;g.strokeRect(b.x-13,b.y-13,26,26);g.fillStyle='#c4ffe5';g.font='bold 12px system-ui';g.textAlign='center';g.fillText('EXTRACT',b.x,b.y+b.r+18);
}
