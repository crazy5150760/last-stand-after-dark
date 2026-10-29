const SPITTER_TUNING=Object.freeze({first:65,interval:30,maxAlive:2,windup:1,cooldown:2.8,shotSpeed:210,shotLife:2.5,shotDamage:10});
function updateSpitterSchedule(){
  if(mode!=='play'||elapsed<nextSpitterAt||elapsed<reliefUntil)return;
  if(activeBoss||nextBossAt-elapsed<=10||rushPhase==='active'||rushPhase==='warning'||enemies.length>=239||enemies.filter(e=>e.spitter&&e.hp>0).length>=SPITTER_TUNING.maxAlive){nextSpitterAt=elapsed+3;return}
  const angle=rand(0,Math.PI*2),radius=Math.min(W,H)*.5+80,hp=42*(1+elapsed/200);
  enemies.push({x:p.x+Math.cos(angle)*radius,y:p.y+Math.sin(angle)*radius,hp,max:hp,speed:82*overtimePressure().speed,r:ENEMY_ART.spitter.r,dmg:10,col:ENEMY_ART.spitter.col,hit:0,type:4,spitter:true,phase:'approach',cooldown:1.2,phaseTime:0,aimX:0,aimY:1});
  nextSpitterAt=elapsed+SPITTER_TUNING.interval;
  if(!spitterIntroduced){spitterIntroduced=true;toast('SPITTERS • SIDESTEP THE PINK AIM LINE',3500)}
}
