const SHOCK_TUNING=Object.freeze({radius:150,duration:1.5,targets:12,max:2,interval:40});
function seedShockDrum(){
 const b={x:-Math.min(130,W*.3),y:125,r:17,spent:false};
 obstacles=obstacles.filter(o=>pointRectDistance(b,o)>40);
 barricades=barricades.filter(o=>pointRectDistance(b,o)>40);shockDrums=[b];
}
function dischargeShock(b){
 if(mode!=='play'||p.hp<=0||b.spent||!shockDrums.includes(b))return;
 b.spent=true;shocksUsed++;recordRunEvent('shock');
 const targets=enemies.filter(e=>e.hp>0&&e!==activeBoss&&!e.convoy&&e.type!==3&&dist(e,b)<=SHOCK_TUNING.radius+e.r).sort((a,c)=>dist(a,b)-dist(c,b)).slice(0,SHOCK_TUNING.targets);
 for(const e of targets){e.salvageStunUntil=Math.max(e.salvageStunUntil||0,elapsed+SHOCK_TUNING.duration);e.howlUntil=0;if(e.spitter||e.howler||e.riot||e.lobber){e.phase=e.riot?'recover':'approach';e.phaseTime=Math.max(e.phaseTime||0,SHOCK_TUNING.duration);e.cooldown=Math.max(e.cooldown||0,SHOCK_TUNING.duration)}}
 shockStuns+=targets.length;
 blastRings.push({x:b.x,y:b.y,life:.4,max:.4,radius:SHOCK_TUNING.radius,color:'#77f2ed'});
 floatText(b.x,b.y-25,`SHOCK • ${targets.length} STUNNED`,'#a7ffff');sound(560,.15,'triangle',.025);
}
function updateShockDrums(dt,from,wasDashing){
 if(mode!=='play'||p.hp<=0)return;
 if(wasDashing)for(const b of shockDrums)if(!b.spent&&segmentDistance(b,from,p)<=b.r+p.r)dischargeShock(b);
 shockDrums=shockDrums.filter(b=>!b.spent&&dist(b,p)<1200);shockClock-=dt;
 if(shockClock>0)return;shockClock=SHOCK_TUNING.interval;if(shockDrums.length>=SHOCK_TUNING.max)return;
 for(let i=0;i<16;i++){
  const a=rand(0,Math.PI*2),r=rand(180,Math.max(220,Math.min(W,H)*.6)),b={x:p.x+Math.cos(a)*r,y:p.y+Math.sin(a)*r,r:17,spent:false};
  if(obstacles.some(o=>pointRectDistance(b,o)<40)||nearBarricade(b,40)||nearDrop(b,40)||nearConvoyRoute(b,40)||barrels.some(o=>dist(o,b)<70)||shockDrums.some(o=>dist(o,b)<100)||salvage&&dist(b,salvage)<salvage.r+40||exitBeacon&&dist(b,exitBeacon)<80)continue;
  shockDrums.push(b);break;
 }
}
function renderShockDrums(){
 for(const b of shockDrums){
  if(b.spent||Math.abs(b.x-p.x)>W/2+180||Math.abs(b.y-p.y)>H/2+180)continue;
  if(dist(b,p)<240){g.strokeStyle='#77f2ed55';g.lineWidth=2;g.setLineDash([3,7]);g.beginPath();g.arc(b.x,b.y,SHOCK_TUNING.radius,0,Math.PI*2);g.stroke();g.setLineDash([])}
  if(drawFieldDrum(b,true)){g.fillStyle='#c8ffff';g.textAlign='center'}else{
  g.fillStyle='#277f88';g.fillRect(b.x-14,b.y-18,28,34);g.strokeStyle='#a7ffff';g.lineWidth=2;g.strokeRect(b.x-14,b.y-18,28,34);
  g.fillStyle='#c8ffff';g.font='bold 23px system-ui';g.textAlign='center';g.fillText('ϟ',b.x,b.y+9);
  }
  if(dist(b,p)<240){g.font='bold 10px system-ui';g.fillText('DASH · STUN',b.x,b.y-30)}
 }
}
// Fuel barrels are tactical tools; shots keep targeting enemies and the player is blast-safe.
const FUEL_RADIUS=145;
function fuelRadius(){return FUEL_RADIUS*(runSurvivor==='engineer'?ENGINEER_TUNING.fuelRadius:1)}
function seedBarrels(){
  const offset=Math.min(110,W*.27);
  barrels=[{x:offset,y:0,r:17,spent:false},{x:offset+80,y:35,r:17,spent:false},{x:-offset,y:-90,r:17,spent:false}];
  // Starting barrels get open ground, so a decorative building cannot conceal the tutorial.
  obstacles=obstacles.filter(o=>!barrels.some(b=>b.x>o.x-35&&b.x<o.x+o.w+35&&b.y>o.y-35&&b.y<o.y+o.h+35));
}
function segmentDistance(point,a,b){
  const dx=b.x-a.x,dy=b.y-a.y,length=dx*dx+dy*dy;
  const t=length?clamp(((point.x-a.x)*dx+(point.y-a.y)*dy)/length,0,1):0;
  return Math.hypot(point.x-a.x-t*dx,point.y-a.y-t*dy);
}
function detonateBarrel(first){
  if(first.spent)return;
  const radius=fuelRadius(),queue=[first];let count=0,killsBefore=killCount;
  while(queue.length){
    const b=queue.shift();if(b.spent)continue;b.spent=true;count++;barrelsBlown++;
    blastRings.push({x:b.x,y:b.y,life:.45,max:.45,radius});burst(b.x,b.y,'#ffbd69',22);
    for(const e of enemies){
      if(e.hp>0&&dist(e,b)<=radius+e.r){
        hitEnemy(e,120*(1+elapsed/200),'BLAST');
        if(e.hp>0&&!e.convoy){const d=dist(e,b)||1;e.x+=(e.x-b.x)/d*30;e.y+=(e.y-b.y)/d*30}
      }
    }
    for(const barrier of barricades)if(barrier.hp>0&&pointRectDistance(b,barrier)<=radius)damageBarricade(barrier,120*(1+elapsed/200),'barrel');
    for(const other of barrels)if(!other.spent&&dist(other,b)<=radius+other.r)queue.push(other);
  }
  const kills=killCount-killsBefore;blastKills+=kills;shake=Math.max(shake,8);
  floatText(first.x,first.y-30,count>1?'CHAIN REACTION ×'+count:'FUEL BLAST','#ffd09a');
  if(kills&&elapsed>=reliefUntil)toast(`${count>1?'CHAIN BLAST':'FUEL BLAST'} • ${kills} ELIMINATED`);
  sound(75,.25,'sawtooth',.045);
}
function updateBarrels(dt,from,wasDashing){
  for(let i=blastRings.length-1;i>=0;i--){blastRings[i].life-=dt;if(blastRings[i].life<=0)blastRings.splice(i,1)}
  if(wasDashing)for(const b of barrels)if(!b.spent&&segmentDistance(b,from,p)<=b.r+p.r)detonateBarrel(b);
  barrels=barrels.filter(b=>!b.spent&&dist(b,p)<Math.max(W,H)+650);
  barrelClock-=dt;
  if(barrelClock<=0){
    barrelClock=12;
    if(barrels.length<6){
      for(let attempt=0;attempt<12;attempt++){
        const angle=rand(0,Math.PI*2),radius=rand(180,Math.max(220,Math.min(W,H)*.65));
        const b={x:p.x+Math.cos(angle)*radius,y:p.y+Math.sin(angle)*radius,r:17,spent:false};
        const blocked=obstacles.some(o=>b.x>o.x-35&&b.x<o.x+o.w+35&&b.y>o.y-35&&b.y<o.y+o.h+35);
        if(!blocked&&!nearBarricade(b,35)&&!nearDrop(b,b.r+20)&&!nearConvoyRoute(b,b.r+20)&&barrels.every(other=>dist(other,b)>65)){barrels.push(b);break}
      }
    }
  }
}
function renderFuel(left,top){
  const radius=fuelRadius();
  for(const b of barrels){
    if(b.x<left-radius||b.x>left+W+radius||b.y<top-radius||b.y>top+H+radius)continue;
    if(dist(b,p)<240){
      g.strokeStyle='#ffb55c30';g.lineWidth=2;g.setLineDash([5,9]);g.beginPath();g.arc(b.x,b.y,radius,0,Math.PI*2);g.stroke();g.setLineDash([]);
    }
    if(drawFieldDrum(b)){g.textAlign='center'}else{
    g.fillStyle='#0007';g.beginPath();g.ellipse(b.x+4,b.y+16,21,9,0,0,Math.PI*2);g.fill();
    g.fillStyle='#f0a550';g.fillRect(b.x-14,b.y-18,28,34);
    g.fillStyle='#5c392b';g.fillRect(b.x-15,b.y-13,30,4);g.fillRect(b.x-15,b.y+8,30,4);
    g.fillStyle='#ffd092';g.beginPath();g.ellipse(b.x,b.y-18,14,5,0,0,Math.PI*2);g.fill();
    g.fillStyle='#342e2b';g.font='bold 17px system-ui';g.textAlign='center';g.fillText('!',b.x,b.y+6);
    }
    if(dist(b,p)<240){g.fillStyle='#ffcf8c';g.font='bold 10px system-ui';g.fillText('DASH',b.x,b.y-31)}
  }
}
function renderBlasts(){
  for(const b of blastRings){
    const progress=1-b.life/b.max,radius=18+((b.radius||FUEL_RADIUS)-18)*progress;
    g.globalAlpha=1-progress;g.fillStyle=b.color?'#65ffbc22':'#ffaf4c33';g.strokeStyle=b.color||'#ffe2a3';g.lineWidth=5*(1-progress)+1;
    g.beginPath();g.arc(b.x,b.y,radius,0,Math.PI*2);g.fill();g.stroke();
  }
  g.globalAlpha=1;
}
// One temporary medical cache at a time; schedule and lifetime use gameplay time.
