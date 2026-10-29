function updateContractHUD(){
  const goal=contractById(runContract);
  document.getElementById('contractGoal').textContent=goal?`CONTRACT ${contractCompleted?'✓':'•'} ${goal.short} ${contractProgress()}/${goal.target}${contractCompleted?' DONE':''}`:'';
}
function updateEncounterHUD(){
  updateContractHUD();rescueHUD();dropHUD();
  const box=document.getElementById('encounter'),label=document.getElementById('objective'),meter=document.getElementById('bossMeter');
  box.style.visibility=mode==='menu'||mode==='end'?'hidden':'visible';meter.hidden=!activeBoss;
  if(training){meter.hidden=!activeBoss;label.textContent=activeBoss?(bossLab?'BOSS TEST · ':streetSession?'INTERSECTION · ':'TRAINING · ')+bossName(activeBoss)+' · '+activeBoss.phase.toUpperCase():bossLab?(developerSpecialist()?(trainingScenario==='riot'?'GUARD':developerTargetName())+' TEST · '+(enemies.find(e=>e.trainingSpecialist&&e.hp>0)?.phase?.toUpperCase()||(trainingScenario==='hunter'&&enemies.some(e=>e.trainingSpecialist&&e.hp>0)?'PURSUING':'RESPAWNING')):'BOSS TEST · RESPAWNING'):'TRAINING RANGE · UNSCORED';if(activeBoss)document.getElementById('bossFill').style.width=`${clamp(100*activeBoss.hp/activeBoss.max,0,100)}%`;for(const id of ['runGoal','supplyGoal','salvageGoal','contractGoal','rescueGoal','dropGoal','medalGoal'])document.getElementById(id).textContent='';const stats=practiceSnapshot();document.getElementById('runGoal').textContent=`PRACTICE · ${Number(stats.damage.toFixed(1))} HP · ${stats.targets} targets · ${Number(stats.average.toFixed(1))} avg HP/s · ${stats.threats} would-be hits`;if(bossLab)document.getElementById('runGoal').textContent=`DEVELOPER · UNSCORED · HP SAFE · ATTACKS ${bossLabFire?'ON':'OFF'} · ${stats.targets} ${trainingScenario==='riot'?'guards':trainingScenario==='spitter'?'spitters':trainingScenario==='howler'?'targets':trainingScenario==='lobber'?'lobbers':trainingScenario==='hunter'?'hunters':'bosses'} defeated · ${stats.threats} would-be hits`;return}
  if(activeBoss){
    label.textContent=`${bossName(activeBoss)} ${bossBearing(activeBoss)} • ${activeBoss.phase==='warn'?(activeBoss.bossKind==='harvester'?'LEAVE PULSE CIRCLE':activeBoss.bossKind==='warden'?'DODGE BLUE LANES':'DODGE THE LINE'):activeBoss.phase==='recover'?'RECOVERING — ATTACK!':'DEFEAT THE '+bossName(activeBoss)}`;
    box.style.color=activeBoss.bossKind==='warden'?'#c0e7ff':activeBoss.phase==='warn'?'#ffd08b':'#ffb4c0';
    document.getElementById('bossFill').style.background=activeBoss.bossKind==='warden'?'linear-gradient(90deg,#6aa7ef,#c0f2ff)':'linear-gradient(90deg,#ef6882,#ffc387)';
    document.getElementById('bossFill').style.width=`${clamp(100*activeBoss.hp/activeBoss.max,0,100)}%`;
  }else if(rushPhase==='active'){
    label.textContent=`BLACKOUT RUSH ${Math.max(0,Math.ceil(rushUntil-elapsed))}s • SURVIVE ${rushAxis==='horizontal'?'↔':'↕'}`;box.style.color='#d4c2ff';
  }else if(rushPhase==='warning'){
    label.textContent=`BLACKOUT IN ${Math.max(0,Math.ceil(nextRushAt-elapsed))}s • HUNTERS ${rushAxis==='horizontal'?'↔':'↕'}`;box.style.color='#d4c2ff';
  }else if(convoy&&!bossWarned&&!exitBeacon){
    label.textContent=convoy.phase==='signal'?`CONVOY ${bossBearing(convoy)} IN ${Math.max(0,Math.ceil(convoy.readyAt-elapsed))}s • OPTIONAL`:`CONVOY ${bossBearing(convoy)} • ${Math.ceil(convoy.hp)} HP • ${Math.max(0,Math.ceil(convoy.until-elapsed))}s • SHOOT FOR UPGRADE`;box.style.color='#9ee8f0';
  }else if(exitBeacon&&bossWarned){
    label.textContent=`${bossName()} IN ${Math.max(0,Math.ceil(nextBossAt-elapsed))}s • PREPARE`;box.style.color='#ffd08b';
  }else if(exitBeacon){
    label.textContent=`EXIT ${bossBearing(exitBeacon)} • REACH THE GREEN BEACON`;box.style.color='#a7ffda';
  }else{
    label.textContent=elapsed<reliefUntil?`${reliefLabel} • BREATHER ${Math.ceil(reliefUntil-elapsed)}s`:`BOSS ${bossesDefeated+1} IN ${fmt(Math.max(0,Math.ceil(nextBossAt-elapsed)))}${bossWarned?' • PREPARE':''} • ${bossName()}`;
    box.style.color=bossWarned?'#ffd08b':'#d0dce2';
  }
  const med=document.getElementById('supplyGoal');med.textContent=supplyCache?`MED ${bossBearing(supplyCache)} • ${Math.max(0,Math.ceil(supplyCache.until-elapsed))}s • ${p.hp>=p.max?'FULL HP':`UP TO +${SUPPLY_TUNING.heal} HP`}`:'';
  const salvageLine=document.getElementById('salvageGoal');salvageLine.textContent=salvage?`SALVAGE ${bossBearing(salvage)} • ${salvage.progress.toFixed(1)}/${SALVAGE_TUNING.hold}s • ${Math.max(0,Math.ceil(salvage.until-elapsed))}s LEFT • ${salvageStatus()}`:salvageWaitingStatus();
  const goal=document.getElementById('runGoal');
  if(exitBeacon)goal.textContent=activeBoss||bossWarned||rushPhase==='active'||rushPhase==='warning'?`EXIT ${bossBearing(exitBeacon)} • REACH GREEN BEACON`:'EXTRACT = VICTORY · STAY = OVERTIME';
  else if(elapsed>=exitAt)goal.textContent=bossesDefeated<1?'EXIT LOCKED • DEFEAT A BREAKER':'EXIT READY • FINISH THIS ENCOUNTER';
  else goal.textContent=`${overtime?'NEXT EXIT':'EXIT'} IN ${fmt(Math.max(0,Math.ceil(exitAt-elapsed)))} • ${overtime?'OVERTIME '+overtime:bossesDefeated?'BREAKER ✓':'DEFEAT A BREAKER'}`;
}
function renderBossWarning(){
  const e=activeBoss;if(!e||e.phase!=='warn')return;
  if(e.bossKind==='harvester'){g.save();g.fillStyle='#9bffbf1e';g.strokeStyle='#b7ffd0';g.lineWidth=3;g.setLineDash([8,7]);g.beginPath();g.arc(e.pulseX,e.pulseY,HARVESTER_TUNING.radius,0,Math.PI*2);g.fill();g.stroke();g.setLineDash([]);g.fillStyle='#d7ffe1';g.font='bold 11px system-ui';g.textAlign='center';g.fillText('LEAVE PULSE CIRCLE',e.pulseX,e.pulseY-HARVESTER_TUNING.radius-12);g.restore();return}
  if(e.bossKind==='warden'){g.save();g.lineWidth=2;g.strokeStyle='#9edaff';g.setLineDash([8,7]);for(const offset of WARDEN_TUNING.spread){const a=e.aimAngle+offset;g.beginPath();g.moveTo(e.x,e.y);g.lineTo(e.x+Math.cos(a)*WARDEN_TUNING.shotSpeed*WARDEN_TUNING.shotLife,e.y+Math.sin(a)*WARDEN_TUNING.shotSpeed*WARDEN_TUNING.shotLife);g.stroke()}g.restore();return}
  const endX=e.x+e.chargeX*e.chargeLength,endY=e.y+e.chargeY*e.chargeLength;
  g.lineCap='round';g.lineWidth=2*(e.r+p.r);g.strokeStyle='#ffad4840';g.beginPath();g.moveTo(e.x,e.y);g.lineTo(endX,endY);g.stroke();
  g.lineWidth=3;g.strokeStyle='#ffd394';g.setLineDash([9,7]);g.beginPath();g.moveTo(e.x,e.y);g.lineTo(endX,endY);g.stroke();g.setLineDash([]);g.lineCap='butt';
}
