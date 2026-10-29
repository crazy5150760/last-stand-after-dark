const RIOT_TUNING=Object.freeze({first:150,interval:40,maxAlive:2,hp:55,speed:62,turn:1.4,windup:.9,bashTime:.24,bashDistance:90,recovery:2.2,cooldown:1.8,shieldOffset:6,shieldWidth:8,shieldHalfAngle:Math.PI/3});
function updateRiotSchedule(){
  if(mode!=='play'||elapsed<nextRiotAt||elapsed<reliefUntil)return;
  if(activeBoss||nextBossAt-elapsed<=10||rushPhase==='active'||rushPhase==='warning'||salvage||exitBeacon||enemies.length>=239||enemies.filter(e=>e.riot&&e.hp>0).length>=RIOT_TUNING.maxAlive){nextRiotAt=elapsed+3;return}
  const angle=rand(0,Math.PI*2),radius=clamp(Math.min(W,H)*.5+40,180,260),hp=RIOT_TUNING.hp*(1+elapsed/200);
  const e={x:p.x+Math.cos(angle)*radius,y:p.y+Math.sin(angle)*radius,hp,max:hp,speed:RIOT_TUNING.speed*overtimePressure().speed,r:ENEMY_ART.riot.r,dmg:12,col:ENEMY_ART.riot.col,hit:0,type:5,riot:true,phase:'approach',phaseTime:0,cooldown:1.2,facing:angle+Math.PI};
  resolveBarricadeBody(e,{x:e.x,y:e.y});enemies.push(e);nextRiotAt=elapsed+RIOT_TUNING.interval;
  if(!riotIntroduced){riotIntroduced=true;toast('RIOT GUARD • FLANK GOLD SHIELD • SHOOT WHEN OPEN',4000)}
}
function riotShieldUp(e){return e.riot&&e.phase!=='recover'&&elapsed>=(e.salvageStunUntil||0)}
function riotShieldHitTime(e,from,to,shotRadius){
  if(!riotShieldUp(e))return Infinity;
  const radius=e.r+RIOT_TUNING.shieldOffset,padding=RIOT_TUNING.shieldWidth/2+shotRadius,outer=radius+padding,half=RIOT_TUNING.shieldHalfAngle;
  if(Math.max(from.x,to.x)<e.x-outer||Math.min(from.x,to.x)>e.x+outer||Math.max(from.y,to.y)<e.y-outer||Math.min(from.y,to.y)>e.y+outer)return Infinity;
  const inArc=(x,y)=>Math.cos(Math.atan2(y-e.y,x-e.x)-e.facing)>=Math.cos(half)-1e-10;
  const angle=Math.atan2(from.y-e.y,from.x-e.x),delta=Math.atan2(Math.sin(angle-e.facing),Math.cos(angle-e.facing)),nearest=e.facing+clamp(delta,-half,half);
  if(Math.hypot(from.x-e.x-Math.cos(nearest)*radius,from.y-e.y-Math.sin(nearest)*radius)<=padding+1e-9)return 0;
  const dx=to.x-from.x,dy=to.y-from.y,ox=from.x-e.x,oy=from.y-e.y,A=dx*dx+dy*dy;
  let first=Infinity;
  if(A>0){
    // The stroked arc has outer/inner circular faces plus round endpoint caps.
    for(const r of [outer,radius-padding]){
      if(r<=0)continue;
      const B=2*(ox*dx+oy*dy),C=ox*ox+oy*oy-r*r,D=B*B-4*A*C;if(D<0)continue;
      const root=Math.sqrt(D);
      for(const t of [(-B-root)/(2*A),(-B+root)/(2*A)])if(t>=0&&t<=1&&inArc(from.x+dx*t,from.y+dy*t))first=Math.min(first,t);
    }
  }
  for(const sign of [-1,1]){
    const a=e.facing+sign*half,cap={x:e.x+Math.cos(a)*radius,y:e.y+Math.sin(a)*radius};
    first=Math.min(first,projectileHitTime(cap,from,to,padding));
  }
  return first;
}
function riotShotImpact(e,from,to,shotRadius){
  const body=projectileHitTime(e,from,to,e.r+shotRadius),shield=riotShieldHitTime(e,from,to,shotRadius);
  return shield!==Infinity&&shield<=body?{time:shield,shield:true}:{time:body,shield:false};
}
function blockRiotShot(e){
  e.shieldHitUntil=elapsed+.12;burst(e.x+Math.cos(e.facing)*e.r,e.y+Math.sin(e.facing)*e.r,'#ffe3a1',3);
  if(elapsed>=(e.nextBlockText||0)){e.nextBlockText=elapsed+.3;floatText(e.x,e.y-e.r-25,'BLOCK','#ffdb8d');sound(240,.03,'triangle',.008)}
}
function moveRiot(e,dt){
  if(mode!=='play'||e.trainingDummy&&!e.trainingLive||e.hp<=0||elapsed<(e.salvageStunUntil||0))return;
  if(e.phase==='recover'){
    e.phaseTime=Math.max(0,e.phaseTime-dt);if(e.phaseTime<=0){e.phase='approach';e.cooldown=RIOT_TUNING.cooldown}return;
  }
  if(e.phase==='warn'){
    if(!rangedEnemyVisible(e)){e.phase='approach';e.cooldown=1;return}
    e.phaseTime-=dt;if(e.phaseTime<=0){e.phase='bash';e.phaseTime=RIOT_TUNING.bashTime}return;
  }
  if(e.phase==='bash'){
    const step=Math.min(dt,e.phaseTime),distance=RIOT_TUNING.bashDistance*step/RIOT_TUNING.bashTime;
    e.x+=Math.cos(e.facing)*distance;e.y+=Math.sin(e.facing)*distance;e.phaseTime=Math.max(0,e.phaseTime-dt);
    if(e.phaseTime<=1e-8){e.phase='recover';e.phaseTime=RIOT_TUNING.recovery}return;
  }
  const angle=Math.atan2(p.y-e.y,p.x-e.x),difference=Math.atan2(Math.sin(angle-e.facing),Math.cos(angle-e.facing));
  e.facing+=clamp(difference,-RIOT_TUNING.turn*dt,RIOT_TUNING.turn*dt);e.cooldown=Math.max(0,e.cooldown-dt);
  if(dist(e,p)>70){e.x+=Math.cos(e.facing)*e.speed*dt;e.y+=Math.sin(e.facing)*e.speed*dt}
  const aim=Math.atan2(p.y-e.y,p.x-e.x),error=Math.atan2(Math.sin(aim-e.facing),Math.cos(aim-e.facing));
  if(e.cooldown<=0&&dist(e,p)<=105&&Math.abs(error)<.3&&rangedEnemyVisible(e)){e.facing=aim;e.phase='warn';e.phaseTime=RIOT_TUNING.windup}
}
function updateRiotMotion(dt){
  if(mode!=='play')return;
  for(const e of enemies)if(e.riot&&e.hp>0){
    e.riotFrom={x:e.x,y:e.y};moveRiot(e,dt);applyEnemyBarricades(e,e.riotFrom,dt,false);
  }
}
function renderRiot(e,ctx=g,field=false){
  const shield=riotShieldUp(e);ctx.save();ctx.lineCap='round';
  if(shield){
    ctx.strokeStyle=elapsed<(e.shieldHitUntil||0)?'#fff6d4':'#f2c36b';ctx.lineWidth=RIOT_TUNING.shieldWidth;
    ctx.beginPath();ctx.arc(e.x,e.y,e.r+RIOT_TUNING.shieldOffset,e.facing-RIOT_TUNING.shieldHalfAngle,e.facing+RIOT_TUNING.shieldHalfAngle);ctx.stroke();
  }else{
    // Move the lowered shield to the flank so there is visibly no front barrier.
    const side=e.facing+Math.PI/2,cx=e.x+Math.cos(side)*(e.r+6),cy=e.y+Math.sin(side)*(e.r+6);
    ctx.strokeStyle='#667d86';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(cx-Math.cos(e.facing)*10,cy-Math.sin(e.facing)*10);ctx.lineTo(cx+Math.cos(e.facing)*10,cy+Math.sin(e.facing)*10);ctx.stroke();
    ctx.strokeStyle='#a7ffda';ctx.lineWidth=2;ctx.beginPath();ctx.arc(e.x,e.y,e.r+2,0,Math.PI*2);ctx.stroke();
  }
  ctx.fillStyle=shield?'#ffe1a4':'#a7ffda';ctx.font='bold 11px system-ui';ctx.textAlign='center';ctx.fillText(shield?'GUARD · SHIELDED':'GUARD · SHIELD DOWN',e.x,field?e.y+e.r*.6-FIELD_ACTOR_HEIGHTS.riot-24:e.y-e.r-24);
  if(e.phase==='warn'&&elapsed>=(e.salvageStunUntil||0)){
    ctx.strokeStyle='#ffd79488';ctx.lineWidth=2*(e.r+p.r);ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(e.x+Math.cos(e.facing)*RIOT_TUNING.bashDistance,e.y+Math.sin(e.facing)*RIOT_TUNING.bashDistance);ctx.stroke();
    ctx.strokeStyle='#ffe3ad';ctx.lineWidth=2;ctx.setLineDash([6,6]);ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(e.x+Math.cos(e.facing)*RIOT_TUNING.bashDistance,e.y+Math.sin(e.facing)*RIOT_TUNING.bashDistance);ctx.stroke();
  }
  ctx.restore();
}
function rangedEnemyVisible(e){if(streetSession&&streetAngled){const at=streetProject(e.x,e.y);return at.x>25&&at.x<W-25&&at.y>40&&at.y<H-25&&!streetBlocked(p,e)}return Math.abs(e.x-p.x)<W/2-35&&Math.abs(e.y-p.y)<H/2-35}
function moveSpitter(e,dt){
  const visible=rangedEnemyVisible(e),range=clamp(Math.min(W,H)*.35,120,240);
  if(e.phase==='aim'){
    if(!visible){e.phase='approach';e.cooldown=SPITTER_TUNING.cooldown;return}
    e.phaseTime-=dt;
    if(e.phaseTime<=0){
      if(hostileShots.length<FX_LIMITS.hostileShots){hostileShots.push({x:e.x+e.aimX*(e.r+8),y:e.y+e.aimY*(e.r+8),vx:e.aimX*SPITTER_TUNING.shotSpeed,vy:e.aimY*SPITTER_TUNING.shotSpeed,r:7,life:SPITTER_TUNING.shotLife,dmg:SPITTER_TUNING.shotDamage,kind:'spitter'});noteFieldSpitterShot(e)}
      e.phase='approach';e.cooldown=SPITTER_TUNING.cooldown;sound(230,.08,'triangle',.015,'alerts');
    }
    return;
  }
  e.cooldown=Math.max(0,e.cooldown-dt);
  if(dist(e,p)>range||!visible){const a=Math.atan2(p.y-e.y,p.x-e.x);e.x+=Math.cos(a)*e.speed*dt;e.y+=Math.sin(a)*e.speed*dt}
  if(e.cooldown<=0&&rangedEnemyVisible(e)&&dist(e,p)<=range+25){
    const a=Math.atan2(p.y-e.y,p.x-e.x);e.aimX=Math.cos(a);e.aimY=Math.sin(a);e.phase='aim';e.phaseTime=SPITTER_TUNING.windup;
  }
}
