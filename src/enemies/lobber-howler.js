const LOBBER_TUNING=Object.freeze({first:255,interval:70,maxAlive:1,hp:65,speed:55,range:230,windup:1,warning:1.4,cooldown:6.5,radius:52,damage:14,maxBombs:1});
function lobberBlocked(){return overtime<1&&!(training&&trainingScenario==='lobber')||howlBlocked()}
function cancelLobbers(){lobberBombs=[];for(const e of enemies)if(e.lobber){e.phase='approach';e.phaseTime=0;e.cooldown=Math.max(e.cooldown,1.5)}}
function updateLobberSchedule(){
 if(mode!=='play'||p.hp<=0)return;
 for(let i=enemies.length-1;i>=0;i--)if(enemies[i].lobber&&dist(enemies[i],p)>1200)enemies.splice(i,1);
 if(elapsed<nextLobberAt)return;
 if(lobberBlocked()||enemies.length>=239||enemies.some(e=>e.lobber&&e.hp>0)){nextLobberAt=elapsed+3;return}
 const a=rand(0,Math.PI*2),r=Math.min(W,H)*.5+70,hp=LOBBER_TUNING.hp*(1+elapsed/200),e={...ENEMY_ART.lobber,x:p.x+Math.cos(a)*r,y:p.y+Math.sin(a)*r,hp,max:hp,speed:LOBBER_TUNING.speed,dmg:10,hit:0,phase:'approach',phaseTime:0,cooldown:1.5};
 resolveBarricadeBody(e,{x:e.x,y:e.y});enemies.push(e);nextLobberAt=elapsed+LOBBER_TUNING.interval;
 if(!lobberIntroduced){lobberIntroduced=true;toast('LOBBER • LEAVE THE ORANGE GROUND WARNING',3500)}
}
function updateLobbers(dt){
 if(mode!=='play'||p.hp<=0)return;
 if(lobberBlocked()){cancelLobbers();return}
 for(let i=lobberBombs.length-1;i>=0;i--){
  const b=lobberBombs[i];b.remaining-=dt;
  if(dist(b,p)>1200){lobberBombs.splice(i,1);continue}
  if(b.remaining<=1e-8){lobberBombs.splice(i,1);blastRings.push({x:b.x,y:b.y,life:.35,max:.35,radius:b.r,color:'#ffa375'});burst(b.x,b.y,'#ffa375',12);if(dist(b,p)<=b.r+p.r){hurtPlayer(LOBBER_TUNING.damage,'lobber-blast');if(mode==='end')return}}
 }
 for(const e of enemies)if(e.lobber&&e.hp>0){
  if(!rangedEnemyVisible(e)||elapsed<(e.salvageStunUntil||0)){e.phase='approach';e.phaseTime=0;e.cooldown=Math.max(e.cooldown,1.5);continue}
  if(e.phase==='windup'){
   e.phaseTime-=dt;
   if(e.phaseTime<=1e-8){if(lobberBombs.length<LOBBER_TUNING.maxBombs){const bomb={x:p.x,y:p.y,r:LOBBER_TUNING.radius,remaining:LOBBER_TUNING.warning};lobberBombs.push(bomb);noteFieldLobberThrow(e,bomb)}e.phase='approach';e.cooldown=LOBBER_TUNING.cooldown}
  }else{e.cooldown=Math.max(0,e.cooldown-dt);if(e.cooldown<=0&&dist(e,p)<=LOBBER_TUNING.range&&lobberBombs.length<LOBBER_TUNING.maxBombs){e.phase='windup';e.phaseTime=LOBBER_TUNING.windup}}
 }
}
function moveLobber(e,dt){if(mode!=='play'||e.hp<=0||e.phase==='windup'||elapsed<(e.salvageStunUntil||0))return;if(dist(e,p)>LOBBER_TUNING.range*.85||!rangedEnemyVisible(e)){const a=Math.atan2(p.y-e.y,p.x-e.x);e.x+=Math.cos(a)*e.speed*dt;e.y+=Math.sin(a)*e.speed*dt}}
function renderLobber(e,ctx=g,field=false){ctx.save();ctx.strokeStyle='#e0e9ff';ctx.lineWidth=5;if(field){ctx.save();ctx.translate(-e.r-14,e.r*.6-FIELD_ACTOR_HEIGHTS.lobber+2);ctx.lineWidth=2.2}ctx.beginPath();ctx.moveTo(e.x-8,e.y-6);ctx.lineTo(e.x,e.y-16);ctx.lineTo(e.x+8,e.y-6);ctx.stroke();if(field)ctx.restore();ctx.font='bold 10px system-ui';ctx.textAlign='center';ctx.fillStyle='#e0e9ff';ctx.fillText(e.phase==='windup'?'LOBBER · LAUNCHING':'LOBBER',e.x,field?e.y+e.r*.6-FIELD_ACTOR_HEIGHTS.lobber-24:e.y-e.r-24);ctx.restore()}
function renderLobberBombs(){
 for(const b of lobberBombs){g.save();g.fillStyle='#ff754d33';g.strokeStyle='#ffbe8e';g.lineWidth=3;g.setLineDash([6,5]);g.beginPath();g.arc(b.x,b.y,b.r,0,Math.PI*2);g.fill();g.stroke();g.setLineDash([]);g.beginPath();g.arc(b.x,b.y,b.r*clamp(1-b.remaining/LOBBER_TUNING.warning,0,1),0,Math.PI*2);g.stroke();g.fillStyle='#ffe1c4';g.font='bold 11px system-ui';g.textAlign='center';g.fillText('MOVE · BLAST',b.x,b.y-b.r-12);g.restore()}
}
// A single support enemy rallies a small ordinary crowd, with no extra damage or spawns.
const HOWLER_TUNING=Object.freeze({first:210,interval:55,maxAlive:1,hp:50,speed:68,range:140,radius:170,targets:8,windup:1.2,cooldown:6.5,duration:3,haste:1.2});
function howlBlocked(){return !!(activeBoss||bossWarned||nextBossAt-elapsed<=10||rushPhase==='active'||rushPhase==='warning'||nextRushAt-elapsed<=5||elapsed<reliefUntil||salvage||convoy||supplyDrop||exitBeacon)}
function rallyEligible(e){return e.hp>0&&e!==activeBoss&&!e.convoy&&!e.rush&&!e.spitter&&!e.riot&&!e.howler&&e.type>=0&&e.type<=2}
function howlMultiplier(e){return rallyEligible(e)&&elapsed<(e.howlUntil||0)?HOWLER_TUNING.haste:1}
function rallyTargets(e){return enemies.filter(other=>rallyEligible(other)&&elapsed>=(other.salvageStunUntil||0)&&dist(e,other)<=HOWLER_TUNING.radius).sort((a,b)=>dist(e,a)-dist(e,b)).slice(0,HOWLER_TUNING.targets)}
function cancelHowls(){
  for(const e of enemies){
    if(e.howlUntil)e.howlUntil=0;
    if(e.howler){e.phase='approach';e.phaseTime=0;e.pulseUntil=0;e.cooldown=Math.max(e.cooldown,1.5)}
  }
}
function updateHowlerSchedule(){
  if(mode!=='play'||p.hp<=0)return;
  for(let i=enemies.length-1;i>=0;i--)if(enemies[i].howler&&dist(enemies[i],p)>1200)enemies.splice(i,1);
  if(elapsed<nextHowlerAt)return;
  if(howlBlocked()||enemies.length>=239||enemies.some(e=>e.howler&&e.hp>0)){nextHowlerAt=elapsed+3;return}
  const angle=rand(0,Math.PI*2),radius=Math.min(W,H)*.5+80,hp=HOWLER_TUNING.hp*(1+elapsed/200);
  const e={...ENEMY_ART.howler,x:p.x+Math.cos(angle)*radius,y:p.y+Math.sin(angle)*radius,hp,max:hp,speed:HOWLER_TUNING.speed*overtimePressure().speed,dmg:10,hit:0,phase:'approach',phaseTime:0,cooldown:1.5,pulseUntil:0};
  resolveBarricadeBody(e,{x:e.x,y:e.y});enemies.push(e);nextHowlerAt=elapsed+HOWLER_TUNING.interval;
  if(!howlerIntroduced){howlerIntroduced=true;toast('HOWLER • STOP THE GOLD RALLY WINDUP',3500)}
}
function updateHowls(dt){
  if(mode!=='play'||p.hp<=0)return;
  if(howlBlocked()){cancelHowls();return}
  for(const e of enemies)if(e.howler&&e.hp>0){
    if(!rangedEnemyVisible(e)||elapsed<(e.salvageStunUntil||0)){
      e.phase='approach';e.phaseTime=0;e.cooldown=Math.max(e.cooldown,1.5);continue;
    }
    if(e.phase==='howl'){
      e.phaseTime=Math.max(0,e.phaseTime-dt);
      if(e.phaseTime<=1e-8){
        const targets=rallyTargets(e);
        for(const other of targets)other.howlUntil=elapsed+HOWLER_TUNING.duration;
        if(targets.length){e.pulseUntil=elapsed+.35;sound(180,.14,'triangle',.018,'alerts')}
        e.phase='approach';e.cooldown=HOWLER_TUNING.cooldown;
      }
      continue;
    }
    e.cooldown=Math.max(0,e.cooldown-dt);
    if(e.cooldown<=0&&rallyTargets(e).length){e.phase='howl';e.phaseTime=HOWLER_TUNING.windup;sound(340,.08,'triangle',.012,'alerts')}
  }
}
function moveHowler(e,dt){
  if(mode!=='play'||e.hp<=0||e.phase==='howl'||elapsed<(e.salvageStunUntil||0))return;
  if(dist(e,p)>HOWLER_TUNING.range||!rangedEnemyVisible(e)){
    const angle=Math.atan2(p.y-e.y,p.x-e.x);e.x+=Math.cos(angle)*e.speed*dt;e.y+=Math.sin(angle)*e.speed*dt;
  }
}
function renderHowler(e,ctx=g,field=false){
  ctx.save();ctx.fillStyle='#20212b';ctx.beginPath();ctx.ellipse(e.x,e.y+6,4,6,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#fff0a3';ctx.lineWidth=2;
  for(const radius of [e.r+5,e.r+10])for(const angle of [0,Math.PI]){ctx.beginPath();ctx.arc(e.x,e.y,radius,angle-.48,angle+.48);ctx.stroke()}
  ctx.fillStyle='#fff0a3';ctx.font='bold 10px system-ui';ctx.textAlign='center';ctx.fillText(e.phase==='howl'?'HOWLER · RALLYING':'HOWLER',e.x,field?e.y+e.r*.6-FIELD_ACTOR_HEIGHTS.howler-22:e.y-e.r-22);ctx.restore();
}
function renderHowlerWarnings(){
  g.save();
  for(const e of enemies)if(e.howler&&e.hp>0){
    if(e.phase==='howl'){
      const progress=clamp(1-e.phaseTime/HOWLER_TUNING.windup,0,1);
      g.fillStyle='#ffe0820b';g.strokeStyle='#ffe08288';g.lineWidth=2;g.setLineDash([7,7]);g.beginPath();g.arc(e.x,e.y,HOWLER_TUNING.radius,0,Math.PI*2);g.fill();g.stroke();g.setLineDash([]);
      g.strokeStyle='#fff0a3';g.lineWidth=3;g.beginPath();g.arc(e.x,e.y,HOWLER_TUNING.radius*progress,0,Math.PI*2);g.stroke();
    }else if(elapsed<(e.pulseUntil||0)){
      g.globalAlpha=clamp((e.pulseUntil-elapsed)/.35,0,1);g.strokeStyle='#fff0a3';g.lineWidth=3;g.beginPath();g.arc(e.x,e.y,HOWLER_TUNING.radius,0,Math.PI*2);g.stroke();g.globalAlpha=1;
    }
  }
  g.restore();
}
// Rare slow shield carriers offer a short locked bash, then a generous gun opening.
