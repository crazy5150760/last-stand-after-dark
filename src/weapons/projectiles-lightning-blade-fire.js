function projectileHitTime(e,from,to,r){
  const dx=to.x-from.x,dy=to.y-from.y,ox=from.x-e.x,oy=from.y-e.y;
  const c0=ox*ox+oy*oy-r*r;if(c0<=0)return 0;
  const a=dx*dx+dy*dy;if(!a)return Infinity;
  const b=2*(ox*dx+oy*dy),discriminant=b*b-4*a*c0;if(discriminant<0)return Infinity;
  const t=(-b-Math.sqrt(discriminant))/(2*a);return t>=0&&t<=1?t:Infinity;
}
function updateProjectiles(dt){
  for(let i=bullets.length-1;i>=0;i--){
    const b=bullets[i],from={x:b.x,y:b.y},travel=Math.min(dt,Math.max(0,b.life));
    b.x+=b.vx*travel;b.y+=b.vy*travel;b.life-=dt;b.hitEnemies??=new Set();b.remainingHits??=1;
    const hits=[];if(streetSession)for(const wall of STREET_BLOCKS){const time=rectHitTime(wall,from,b,b.r);if(time!==Infinity)hits.push({wall,time,kind:'wall'})}
    for(const e of enemies){
      if(e.hp<=0||b.hitEnemies.has(e))continue;
      const impact=e.riot?riotShotImpact(e,from,b,b.r):{time:projectileHitTime(e,from,b,b.r+e.r),shield:false};if(impact.time!==Infinity)hits.push({e,time:impact.time,kind:impact.shield?'shield':'enemy'});
    }
    for(const barrier of barricades)if(barrier.hp>0){const time=rectHitTime(barrier,from,b,b.r);if(time!==Infinity)hits.push({barrier,time,kind:'barrier'})}
    hits.sort((a,b)=>a.time-b.time||(b.kind==='barrier'||b.kind==='wall'?2:b.kind==='shield'?1:0)-(a.kind==='barrier'||a.kind==='wall'?2:a.kind==='shield'?1:0));
    for(const {e,barrier,wall,kind} of hits){
      if(wall){b.remainingHits=0;break}
      if(barrier){if(barrier.hp<=0)continue;damageBarricade(barrier,b.dmg,'gun');b.remainingHits=0;break}
      if(e.hp<=0)continue;b.hitEnemies.add(e);if(kind==='shield'){blockRiotShot(e);b.remainingHits=0;break}hitEnemy(e,b.dmg);b.remainingHits--;
      if(b.remainingHits<=0)break;
    }
    if(b.remainingHits<=0||b.life<=0)bullets.splice(i,1);
  }
}
function fireLightning(){
  if(!p.arc)return 0;
  const evolved=p.thunder&&p.arc===3,struck=new Set(),damage=p.damage*(evolved?1:.8);
  for(let branch=0;branch<(evolved?2:1);branch++){
    let origin={x:p.x,y:p.y};
    for(let hop=0;hop<(evolved?(branch===0?5:3):p.arc+2);hop++){
      const reach=hop?(evolved?180:150)*(p.arcRelay?1.2:1):300;let target=null,nearest=reach;
      for(const e of enemies){const d=dist(origin,e);if(e.hp>0&&!struck.has(e)&&d<=nearest){nearest=d;target=e}}
      if(!target)break;
      struck.add(target);const end={x:target.x,y:target.y};
      lightning.push({x1:origin.x,y1:origin.y,x2:end.x,y2:end.y,life:.18,max:.18,evolved});
      if(lightning.length>FX_LIMITS.lightning)lightning.shift();
      hitEnemy(target,damage,'LIGHTNING');origin=end;
    }
  }
  if(struck.size)sound(700,.06,'triangle',.02);return struck.size;
}
function bladeRadius(){return (p.reaper&&p.blades===3?100:78)+(p.bladeReach?12:0)}
function bladePositions(at=elapsed,centre=p){
  if(!p.blades)return[];
  const evolved=p.reaper&&p.blades===3,count=evolved?6:p.blades+1;return Array.from({length:count},(_,i)=>{
    const angle=at*(evolved?3.4:2.8)+i*Math.PI*2/count;
    return{x:centre.x+Math.cos(angle)*bladeRadius(),y:centre.y+Math.sin(angle)*bladeRadius(),angle};
  });
}
const MOLOTOV_TUNING=Object.freeze({flight:.45,tick:.4,life:2.4,range:300,wildfireLife:2.8,wildfireCooldown:3.6,separation:1.25,radii:Object.freeze([58,72,86]),cooldowns:Object.freeze([3.8,3.3,2.8])});
function molotovStats(rank=p.molotov,evolved=p.wildfire&&rank===3){
  const index=clamp(rank-1,0,2);
  return{radius:evolved?96:MOLOTOV_TUNING.radii[index],cooldown:evolved?MOLOTOV_TUNING.wildfireCooldown:MOLOTOV_TUNING.cooldowns[index],duration:evolved?MOLOTOV_TUNING.wildfireLife:MOLOTOV_TUNING.life,multiplier:evolved?.6:.45,count:evolved?2:1,evolved};
}
function launchMolotov(){
  if(mode!=='play'||!p.molotov||bottles.length>=FX_LIMITS.bottles)return 0;
  const stats=molotovStats(),targets=enemies.filter(e=>e.hp>0&&dist(e,p)<=MOLOTOV_TUNING.range&&rangedEnemyVisible(e)).sort((a,b)=>dist(a,p)-dist(b,p));
  let count=0;const selected=[];
  for(const target of targets){
    if(count>=stats.count||bottles.length>=FX_LIMITS.bottles)break;
    if(selected.some(other=>dist(other,target)<stats.radius*MOLOTOV_TUNING.separation))continue;
    selected.push(target);
    bottles.push({x:p.x,y:p.y,tx:target.x,ty:target.y,age:0,flight:MOLOTOV_TUNING.flight,radius:stats.radius,damage:p.damage*stats.multiplier,duration:stats.duration,evolved:stats.evolved});count++;
  }
  if(count)sound(330,.07,'triangle',.012);return count;
}
function updateMolotov(dt){
  if(mode!=='play')return;
  fires=fires.filter(f=>{f.life-=dt;return f.life>0&&dist(f,p)<1200});
  for(let i=bottles.length-1;i>=0;i--){
    const b=bottles[i];b.age+=dt;
    if(b.age>=b.flight){
      const life=b.duration-(b.age-b.flight);
      if(life>0&&Math.hypot(b.tx-p.x,b.ty-p.y)<1200){
        if(fires.length>=FX_LIMITS.fires)fires.shift();
        fires.push({x:b.tx,y:b.ty,r:b.radius,damage:b.damage,life,max:b.duration,evolved:b.evolved});burst(b.tx,b.ty,'#ffb36d',6);
      }
      bottles.splice(i,1);
    }
  }
  for(const [e,until] of burnHits)if(e.hp<=0||until<=elapsed)burnHits.delete(e);
  if(fires.length){
    for(const e of enemies){
      if(e.hp<=0||elapsed+1e-8<(burnHits.get(e)||0))continue;
      let damage=0;for(const f of fires)if(dist(e,f)<=e.r+f.r)damage=Math.max(damage,f.damage);
      if(damage>0){burnHits.set(e,elapsed+MOLOTOV_TUNING.tick);hitEnemy(e,damage,'FIRE')}
    }
    for(const b of barrels)if(!b.spent&&fires.some(f=>dist(f,b)<=f.r+b.r))detonateBarrel(b);
    for(const b of barricades)if(b.hp>0&&elapsed+1e-8>=(b.fireNextAt||0)){
      let damage=0;for(const f of fires)if(pointRectDistance(f,b)<=f.r)damage=Math.max(damage,f.damage);
      if(damage>0){b.fireNextAt=elapsed+MOLOTOV_TUNING.tick;damageBarricade(b,damage,'fire')}
    }
  }
  if(!p.molotov)return;
  molotovClock=Math.max(0,molotovClock-dt);
  if(molotovClock<=0)molotovClock=launchMolotov()?molotovStats().cooldown:.1;
}
function renderGroundFire(){
  g.save();
  for(const f of fires){
    g.globalAlpha=Math.min(1,f.life/.5);g.fillStyle=f.evolved?'#ff7f371f':'#ffad5424';g.strokeStyle=f.evolved?'#ffaf63aa':'#ffc07888';g.lineWidth=2;
    g.beginPath();g.arc(f.x,f.y,f.r,0,Math.PI*2);g.fill();g.stroke();
    for(let i=0;i<(preferences.reduced?2:5);i++){const a=i*2.3999632297,x=f.x+Math.cos(a)*f.r*.52,y=f.y+Math.sin(a)*f.r*.52,h=12+Math.sin(elapsed*7+i)*4;g.fillStyle=i%2?'#ffd792bb':'#ff9c50aa';g.beginPath();g.moveTo(x-5,y+4);g.quadraticCurveTo(x-8,y-h*.4,x+2,y-h);g.quadraticCurveTo(x+9,y-4,x+5,y+4);g.closePath();g.fill()}
    if(dist(f,p)<220){g.fillStyle='#ffd6a4';g.font='bold 9px system-ui';g.textAlign='center';g.fillText('YOUR FIRE',f.x,f.y+f.r+12)}
  }
  g.restore();
}
function renderMolotovBottles(){
  g.save();for(const b of bottles){const t=clamp(b.age/b.flight,0,1),x=b.x+(b.tx-b.x)*t,y=b.y+(b.ty-b.y)*t-Math.sin(t*Math.PI)*55;g.save();g.translate(x,y);g.rotate(t*5);g.fillStyle='#dfa667';g.fillRect(-4,-6,8,12);g.fillStyle='#a2ded3';g.fillRect(-2,-10,4,5);g.fillStyle='#ffbf68';g.beginPath();g.arc(0,-11,3,0,Math.PI*2);g.fill();g.restore()}g.restore();
}
function updateWeapons(dt,from){
 if(bossLab&&!bossLabFire)return;
  updateMolotov(dt);
  for(let i=lightning.length-1;i>=0;i--){lightning[i].life-=dt;if(lightning[i].life<=0)lightning.splice(i,1)}
  if(p.arc){chainClock-=dt;if(chainClock<=0){if(fireLightning())chainClock=p.thunder&&p.arc===3?.8:1.35-(p.arc-1)*.175;else chainClock=.1}}
  for(const [e,until] of bladeHits)if(e.hp<=0||until<=elapsed)bladeHits.delete(e);
  if(!p.blades)return;
  const before=bladePositions(elapsed-dt,from),after=bladePositions();
  for(const e of enemies){
    if(e.hp<=0||bladeHits.has(e))continue;
    for(let i=0;i<after.length;i++){
      if(segmentDistance(e,before[i],after[i])<=e.r+11){hitEnemy(e,p.damage*(p.reaper&&p.blades===3?1.35:1.1),'BLADES');bladeHits.set(e,elapsed+(p.reaper&&p.blades===3?.35:.45));break}
    }
  }
}
function renderWeapons(){
 if(bossLab&&!bossLabFire)return;
  renderMolotovBottles();
  if(p.blades){
    g.strokeStyle='#cbb5ff25';g.lineWidth=1;g.beginPath();g.arc(p.x,p.y,bladeRadius(),0,Math.PI*2);g.stroke();
    for(const blade of bladePositions()){
      g.save();g.translate(blade.x,blade.y);g.rotate(blade.angle+Math.PI/2);g.fillStyle=p.reaper&&p.blades===3?'#ffe29b':'#d7c1ff';g.shadowColor=p.reaper&&p.blades===3?'#ffcd67':'#b38aff';g.shadowBlur=7;
      g.beginPath();g.moveTo(-13,3);g.lineTo(15,-5);g.lineTo(6,6);g.lineTo(-10,7);g.fill();g.restore();
    }
  }
  for(const arc of lightning){
    const dx=arc.x2-arc.x1,dy=arc.y2-arc.y1,length=Math.hypot(dx,dy)||1;
    g.globalAlpha=clamp(arc.life/arc.max,0,1);g.strokeStyle=arc.evolved?'#ffe29b':'#83e6ff';g.lineWidth=arc.evolved?4:3;
    g.beginPath();g.moveTo(arc.x1,arc.y1);g.lineTo((arc.x1+arc.x2)/2-dy/length*8,(arc.y1+arc.y2)/2+dx/length*8);g.lineTo(arc.x2,arc.y2);g.stroke();
  }
  g.globalAlpha=1;
}
