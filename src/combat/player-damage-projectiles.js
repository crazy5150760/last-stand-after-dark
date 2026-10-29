function hurtPlayer(damage,source='contact'){
  if(training){if(mode==='play'&&p.inv<=0&&p.hp>0&&Number.isFinite(damage)&&damage>0&&elapsed>=practiceThreatReadyAt){practiceThreats++;practiceThreatReadyAt=elapsed+.55;practiceLastThreat=knownThreat(source)?source:'contact'}return false}
  if(mode!=='play'||p.inv>0||p.hp<=0||!Number.isFinite(damage)||damage<=0)return false;
  const incoming=damage;damage=Math.min(incoming,Math.max(1,incoming-(p.armor||0)));const lost=Math.min(p.hp,damage);damageTaken+=lost;recordPace(0,lost);hitsTaken++;armorPrevented+=incoming-damage;lastThreat=knownThreat(source)?source:'contact';healthCue={until:elapsed+.7,text:'−'+Number(lost.toFixed(1))+' HP'};p.hp=Math.max(0,p.hp-damage);p.inv=.55;shake=10;burst(p.x,p.y,'#ff697c',16);sound(90,.25,'sawtooth',.04,'alerts');
  if(p.hp<=0&&p.secondWind&&!p.windSpent){healthCue={until:elapsed+2,text:'SECOND WIND'};p.windSpent=true;recordRunEvent('second-wind');p.hp=Math.min(p.max,25);p.inv=2;toast('SECOND WIND • 25 HP • LAST CHANCE',2600);sound(520,.16,'sine',.03,'alerts')}else if(p.hp<=0)end();return true;
}
function updateHostileShots(dt,fromPlayer){
  if(mode!=='play')return;
  for(let i=hostileShots.length-1;i>=0;i--){
    const b=hostileShots[i];if(b.life<=0){hostileShots.splice(i,1);continue}
    const from={x:b.x,y:b.y},step=Math.min(dt,b.life),fraction=dt?step/dt:1;
    b.x+=b.vx*step;b.y+=b.vy*step;b.life-=step;
    const playerEnd={x:fromPlayer.x+(p.x-fromPlayer.x)*fraction,y:fromPlayer.y+(p.y-fromPlayer.y)*fraction};
    const playerHit=projectileHitTime({x:0,y:0},{x:from.x-fromPlayer.x,y:from.y-fromPlayer.y},{x:b.x-playerEnd.x,y:b.y-playerEnd.y},b.r+p.r);
    let bladeHit=Infinity;
    if(p.reaper&&p.blades===3){
      const before=bladePositions(elapsed-dt,fromPlayer),after=bladePositions(elapsed-dt+step,playerEnd);
      for(let j=0;j<before.length;j++)bladeHit=Math.min(bladeHit,projectileHitTime({x:0,y:0},{x:from.x-before[j].x,y:from.y-before[j].y},{x:b.x-after[j].x,y:b.y-after[j].y},b.r+11));
    }
    const cover=firstBarricadeHit(from,b,b.r);
    if(cover.barrier&&cover.time<=Math.min(bladeHit,playerHit)){hostileShots.splice(i,1);damageBarricade(cover.barrier,b.dmg,'shot')}
    else if(bladeHit!==Infinity&&bladeHit<=playerHit){hostileShots.splice(i,1);burst(from.x+(b.x-from.x)*bladeHit,from.y+(b.y-from.y)*bladeHit,'#ffe29b',3)}
    else if(playerHit!==Infinity){hostileShots.splice(i,1);hurtPlayer(b.dmg,b.kind==='warden'?'warden-shot':b.kind==='spitter'?'spitter-shot':'shot');if(mode==='end')return}
    else if(b.life<=0||dist(b,p)>1400)hostileShots.splice(i,1);
  }
}
function renderSpitterWarnings(){
  g.save();g.lineWidth=2;g.strokeStyle='#ff9fbd';g.setLineDash([7,8]);
  for(const e of enemies)if(e.hp>0&&e.spitter&&e.phase==='aim'){
    g.beginPath();g.moveTo(e.x,e.y);g.lineTo(e.x+e.aimX*SPITTER_TUNING.shotSpeed*SPITTER_TUNING.shotLife,e.y+e.aimY*SPITTER_TUNING.shotSpeed*SPITTER_TUNING.shotLife);g.stroke();
  }
  g.restore();
}
function renderHostileShots(){
  g.save();g.lineWidth=2;
  for(const b of hostileShots){g.fillStyle=b.kind==='warden'?'#78baff':'#ff6d9f';g.strokeStyle=b.kind==='warden'?'#e0f7ff':'#ffe3ee';g.beginPath();if(b.kind==='warden')g.arc(b.x,b.y,b.r,0,Math.PI*2);else{g.moveTo(b.x,b.y-b.r);g.lineTo(b.x+b.r,b.y);g.lineTo(b.x,b.y+b.r);g.lineTo(b.x-b.r,b.y);g.closePath()}g.fill();g.stroke()}
  g.restore();
}
