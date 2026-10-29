function fieldSeedMotion(e,kind){const serial=fieldArt.serial++,direction=kind==='survivor'?streetHeading(lastMove.x,lastMove.y,0):streetHeading(p.x-e.x,p.y-e.y,0),motion={x:e.x,y:e.y,travel:0,moving:false,direction,flip:FIELD_ACTOR_FLIPS[direction],pose:{asset:kind==='survivor'?'survivorWalk':STREET_ENEMY_GAITS[kind].asset,frame:FIELD_ACTOR_ROWS[direction]*4},previous:null,changedAt:elapsed,offset:kind==='survivor'?0:serial*.173%1,aim:null};fieldArt.motion.set(e,motion);return motion}
function advanceFieldActors(dt){
 if(training&&!bossLab&&!mainPerfTest||streetSession||artSession||mode!=='play'||fieldStyle()!=='field'||!(dt>0))return;
 advanceFieldCombat();prepareFieldBreaker();prepareFieldWarden();prepareFieldHarvester();prepareFieldRiot();prepareFieldSpitter();prepareFieldHowler();prepareFieldLobber();prepareFieldHunter();advanceFieldBreaker(dt);advanceFieldWarden(dt);advanceFieldHarvester(dt);advanceFieldRiot(dt);advanceFieldSpitter(dt);advanceFieldHowler(dt);advanceFieldLobber(dt);advanceFieldHunter(dt);
 for(const e of [p,...enemies]){
  const kind=e===p?'survivor':fieldEnemyKind(e);if(!kind||e.hp<=0)continue;
  const motion=fieldArt.motion.get(e)||fieldSeedMotion(e,kind),dx=e.x-motion.x,dy=e.y-motion.y,distance=Math.hypot(dx,dy),teleport=distance>1200*dt+2;
  motion.x=e.x;motion.y=e.y;motion.moving=!teleport&&distance/dt>3;if(teleport){motion.travel=0;motion.previous=null}
  const stride=kind==='survivor'?76:STREET_ENEMY_GAITS[kind].stride;if(motion.moving)motion.travel=(motion.travel+distance)%stride;
  const target=kind==='survivor'?(gunTarget()||{x:e.x+lastMove.x,y:e.y+lastMove.y}):p,sx=motion.moving?dx:target.x-e.x,sy=motion.moving?dy:target.y-e.y;
  if(motion.moving||Math.hypot(sx,sy)>14)motion.direction=streetHeading(sx,sy,motion.direction);
  const rows=FIELD_ACTOR_ROWS,flips=FIELD_ACTOR_FLIPS,phase=motion.moving&&!(kind==='survivor'&&p.dash>0)?Math.floor((motion.travel/stride+motion.offset)%1*4):0,pose={asset:motion.pose.asset,frame:rows[motion.direction]*4+phase},flip=flips[motion.direction];
  if(pose.frame!==motion.pose.frame||flip!==motion.flip){motion.previous={...motion.pose,flip:motion.flip};motion.pose=pose;motion.changedAt=elapsed}motion.flip=flip;
  if(motion.previous&&(preferences.reduced||elapsed-motion.changedAt>=.045))motion.previous=null;
  if(kind==='survivor'){
   const direction=streetHeading(target.x-e.x,target.y-e.y,motion.aim?.direction??motion.direction),row=rows[direction],aimFlip=flips[direction];
   if(!motion.aim||motion.aim.direction!==direction)motion.aim={direction,row,flip:aimFlip,previous:motion.aim?{row:motion.aim.row,flip:motion.aim.flip}:null,changedAt:elapsed};
   if(motion.aim.previous&&(preferences.reduced||elapsed-motion.aim.changedAt>=.06))motion.aim.previous=null;
  }
 }
}
function fieldPoseInfo(pose,kind){const row=kind==='hunter'?fieldArt.hunter.row:kind==='lobber'?fieldArt.lobber.row:kind==='howler'?fieldArt.howler.row:kind==='spitter'?fieldArt.spitter.row:kind==='riot'?fieldArt.riot.row:kind==='harvester'?fieldArt.harvester.row:kind==='warden'?fieldArt.warden.row:(kind==='breaker'?fieldArt.breaker.rows:fieldArt.rows)[pose.asset],meta=row?.meta,crop=meta?.frames[pose.frame],pivot=meta?.pivots[pose.frame],height=FIELD_ACTOR_HEIGHTS[kind],reference=meta?.referenceHeights[kind==='hunter'||kind==='lobber'||kind==='howler'||kind==='spitter'||kind==='riot'||kind==='warden'||kind==='harvester'?pose.frame%5:kind==='breaker'?(pose.asset==='breakerCombat'?pose.frame%5:0):Math.floor(pose.frame/4)];return{image:row?.ready?row.image:null,crop,pivot,scale:height/reference,height,flip:pose.flip}}
function fieldActorInfo(e,kind){
 const motion=kind==='hunter'?fieldHunterMotion(e):kind==='lobber'?fieldLobberMotion(e):kind==='howler'?fieldHowlerMotion(e):kind==='spitter'?fieldSpitterMotion(e):kind==='riot'?fieldRiotMotion(e):kind==='harvester'?fieldHarvesterMotion(e):kind==='warden'?fieldWardenMotion(e):kind==='breaker'?fieldBreakerMotion(e):fieldArt.motion.get(e)||fieldSeedMotion(e,kind),current=fieldPoseInfo({...motion.pose,flip:motion.flip},kind),blend=kind==='hunter'||kind==='lobber'||kind==='howler'||kind==='spitter'||kind==='riot'||kind==='breaker'||kind==='warden'||kind==='harvester'?motion.blend:.045,t=motion.previous&&!preferences.reduced&&blend>0?clamp((elapsed-motion.changedAt)/blend,0,1):1,weight=t*t*(3-2*t);
 return{...current,motion,layers:motion.previous&&weight<1?[{...fieldPoseInfo(motion.previous,kind),weight:1-weight},{...current,weight}]:[{...current,weight:1}]};
}
function drawFieldLayers(ctx,layers,alpha){for(const layer of layers){if(!layer.image||!layer.crop||!layer.pivot||!(layer.scale>0)||layer.weight<=0)continue;ctx.save();ctx.scale(layer.flip,1);ctx.globalAlpha=alpha*layer.weight;ctx.drawImage(layer.image,...layer.crop,-layer.pivot[0]*layer.scale,-layer.pivot[1]*layer.scale,layer.crop[2]*layer.scale,layer.crop[3]*layer.scale);ctx.restore()}}
function drawFieldSurvivor(ctx,info,alpha){
 const trackedAim=info.motion.aim,shot=fieldShotVisual(),aim=shot.flash?{row:shot.row,flip:shot.flip,previous:null,changedAt:elapsed}:trackedAim,row=fieldArt.rows.survivorAim;if(!aim||!row?.ready){drawFieldLayers(ctx,info.layers,alpha);return}
 const waist=22;ctx.save();ctx.beginPath();ctx.rect(-90,-waist,180,100);ctx.clip();drawFieldLayers(ctx,info.layers,alpha);ctx.restore();
 const t=aim.previous&&!preferences.reduced?clamp((elapsed-aim.changedAt)/.06,0,1):1,weight=t*t*(3-2*t),poses=aim.previous&&weight<1?[{...aim.previous,weight:1-weight},{row:aim.row,flip:aim.flip,weight}]:[{...aim,weight:1}];
 ctx.save();ctx.translate(-(shot.dx||0)*shot.recoil,-waist+1.5-(shot.dy||0)*shot.recoil);drawFieldLayers(ctx,poses.map(pose=>({image:row.image,crop:row.meta.frames[pose.row],pivot:row.meta.pivots[pose.row],scale:32/row.meta.referenceHeights[pose.row],flip:pose.flip,weight:pose.weight})),alpha);ctx.restore();
 if(shot.flash){const tip=row.meta.muzzles?.[shot.row],pivot=row.meta.pivots[shot.row],scale=32/row.meta.referenceHeights[shot.row];if(tip?.every(Number.isFinite)){ctx.save();ctx.translate((tip[0]-pivot[0])*scale*shot.flip-shot.dx*shot.recoil,-waist+1.5+(tip[1]-pivot[1])*scale-shot.dy*shot.recoil);ctx.rotate(Math.atan2(shot.dy,shot.dx));ctx.fillStyle='#ffe7a7';ctx.globalAlpha=.9;ctx.beginPath();ctx.moveTo(0,-1.3);ctx.lineTo(5.5,0);ctx.lineTo(0,1.3);ctx.lineTo(-1,0);ctx.closePath();ctx.fill();ctx.restore()}}
}
function drawFieldActor(ctx,e,kind){
 if(!fieldActorsActive()||kind==='breaker'&&!fieldBreakerActive(e)||kind==='warden'&&!fieldWardenActive(e)||kind==='harvester'&&!fieldHarvesterActive(e)||kind==='riot'&&!fieldRiotActive(e)||kind==='spitter'&&!fieldSpitterActive(e)||kind==='howler'&&!fieldHowlerActive(e)||kind==='lobber'&&!fieldLobberActive(e)||kind==='hunter'&&!fieldHunterActive(e))return false;
 if(e.x<p.x-W/2-90||e.x>p.x+W/2+90||e.y<p.y-H/2-90||e.y>p.y+H/2+110)return true;
 const info=fieldActorInfo(e,kind);if(!info.image||!info.crop||!info.pivot)return false;
 ctx.save();ctx.translate(e.x,e.y);ctx.fillStyle='#02070a99';ctx.beginPath();ctx.ellipse(2,3,e.r,e.r*.45,0,0,7);ctx.fill();
 if(kind==='hunter'){ctx.strokeStyle='#c9b4ff';ctx.lineWidth=1.3;ctx.beginPath();ctx.ellipse(0,e.r*.5,e.r+1,e.r*.4,0,0,Math.PI*2);ctx.stroke()}
 if(kind==='survivor'){ctx.strokeStyle=p.color||'#8cf9d4';ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(0,0,e.r+3,0,Math.PI*2);ctx.stroke()}
 const alpha=e.hit||kind==='survivor'&&p.inv>0&&Math.floor(elapsed*15)%2?.6:1;ctx.translate(0,e.r*.6);ctx.imageSmoothingEnabled=true;
 if(kind==='survivor')drawFieldSurvivor(ctx,info,alpha);else{const shear=fieldReaction(e,kind);if(shear)ctx.transform(1,0,shear,1,0,0);drawFieldLayers(ctx,info.layers,alpha)}ctx.restore();return true;
}

// Bounded visual notifications; native simulation alone owns damage and credit.
