const DECOY_TUNING=Object.freeze({duration:3,radius:240,targets:12,charges:1,maxCharges:2});
function deployDecoy(){
 if(mode!=='play'||document.hidden||p.hp<=0||decoyCharges<=0||decoy)return;
 const point={x:p.x-lastMove.x*60,y:p.y-lastMove.y*60};
 if(nearBarricade(point,18)){point.x=p.x;point.y=p.y}
 const targets=enemies.filter(e=>rallyEligible(e)&&elapsed>=(e.salvageStunUntil||0)&&dist(e,point)<=DECOY_TUNING.radius).sort((a,b)=>dist(a,point)-dist(b,point)).slice(0,DECOY_TUNING.targets);
 decoyCharges--;decoysUsed++;recordRunEvent('decoy');decoy={...point,until:elapsed+DECOY_TUNING.duration,targets:new Set(targets)};
 for(const e of targets)if(!e.decoyCounted){e.decoyCounted=true;decoyLured++}
 sound(580,.12,'triangle',.025);updateHUD();
}
function moveHorde(e,dt){
 const lured=decoy&&elapsed<decoy.until&&decoy.targets.has(e)&&rallyEligible(e),target=lured?decoy:streetSession?streetSteering(e):p;
 if(lured&&dist(e,target)<=e.r+10)return;
 const a=Math.atan2(target.y-e.y,target.x-e.x);e.x+=Math.cos(a)*e.speed*howlMultiplier(e)*dt;e.y+=Math.sin(a)*e.speed*howlMultiplier(e)*dt;
}
function updateDecoyHUD(){
 const b=document.getElementById('decoy');b.style.display=mode==='play'?'block':'none';b.textContent=decoy?'DECOY ACTIVE':`DECOY · ${decoyCharges}`;b.setAttribute('aria-disabled',String(mode!=='play'||!!decoy||decoyCharges<=0));b.setAttribute('aria-label',decoy?'Decoy active':`${decoyCharges} decoy charges remaining; press Q or tap to deploy`);
}
function renderDecoy(){
 if(!decoy)return;g.save();g.strokeStyle='#c9c6ff';g.fillStyle='#aaa7ff24';g.lineWidth=2;g.setLineDash([4,7]);g.beginPath();g.arc(decoy.x,decoy.y,25,0,Math.PI*2);g.fill();g.stroke();g.setLineDash([]);g.beginPath();g.moveTo(decoy.x-8,decoy.y-12);g.lineTo(decoy.x+8,decoy.y+12);g.moveTo(decoy.x+8,decoy.y-12);g.lineTo(decoy.x-8,decoy.y+12);g.stroke();g.fillStyle='#e1deff';g.font='bold 10px system-ui';g.textAlign='center';g.fillText('DECOY '+Math.max(0,Math.ceil(decoy.until-elapsed))+'s',decoy.x,decoy.y-34);g.restore();
}
// Overtime artillery adds one fixed, fully telegraphed ground hazard in quiet windows.
