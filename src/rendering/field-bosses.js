const FIELD_BREAKER_ASSETS=Object.freeze(['breakerWalk','breakerCombat']);
function freshFieldBreaker(){return{status:'idle',rows:{},seen:false}}
function releaseFieldBreaker(){for(const row of Object.values(fieldArt.breaker.rows))if(row.image){row.image.onload=null;row.image.onerror=null}fieldArt.breaker=freshFieldBreaker()}
function fieldBreakerStatus(){const status=fieldArt.breaker.status;return status==='idle'?'':status==='ready'?' · Breaker art ready.':status==='loading'?' · Loading Breaker art; Classic boss remains visible.':' · Breaker art unavailable; Classic boss remains playable.'}
function fieldBreakerWanted(){return bossLab&&training&&trainingScenario==='breaker'||activeBoss?.hp>0&&activeBoss.bossKind==='breaker'||!activeBoss&&bossWarned&&nextBossKind()==='breaker'||fieldDefeatWanted('breaker')}
function failFieldBreaker(owner,group){if(fieldArt!==owner||owner.breaker!==group)return;for(const row of Object.values(group.rows))if(row.image){row.image.onload=null;row.image.onerror=null}group.rows={};group.status='failed';refreshFieldArtStatus()}
function loadFieldBreakerImage(owner,group,id,meta){
 const row={ready:false,image:null,meta:{frames:meta.frames,pivots:meta.pivots,referenceHeights:meta.referenceHeights}};group.rows[id]=row;const image=new Image();row.image=image;
 image.onload=()=>{if(fieldArt!==owner||owner.breaker!==group||group.status==='failed')return;if(!(image.naturalWidth>0&&image.naturalHeight>0)){failFieldBreaker(owner,group);return}image.onload=null;image.onerror=null;row.ready=true;if(FIELD_BREAKER_ASSETS.every(key=>group.rows[key]?.ready))group.status='ready';refreshFieldArtStatus()};
 image.onerror=()=>failFieldBreaker(owner,group);image.src=meta.src;
}
function prepareFieldBreaker(){
 if(!fieldActorsActive()||runLogged)return;
 const owner=fieldArt,group=owner.breaker,wanted=fieldBreakerWanted();
 if(!wanted){if(group.status!=='idle'){releaseFieldBreaker();refreshFieldArtStatus()}return}
 if(activeBoss?.bossKind==='breaker')group.seen=true;if(group.status!=='idle')return;if(owner.warden.status!=='idle')releaseFieldWarden();if(owner.harvester.status!=='idle')releaseFieldHarvester();group.status='loading';
 try{const data=JSON.parse(document.getElementById('sampleAssets').textContent);let bytes=0;for(const id of FIELD_BREAKER_ASSETS){const meta=data[id];if(!meta||!/^data:image\/(?:png|webp);base64,/.test(meta.src)||meta.frames?.length!==(id==='breakerCombat'?25:4)||!meta.pivots?.length||!meta.referenceHeights?.every(n=>Number.isFinite(n)&&n>0))throw Error('Missing Breaker art');bytes+=meta.width*meta.height*4}if(!Number.isFinite(bytes)||bytes>12*1024*1024)throw Error('Breaker pixel budget');for(const id of FIELD_BREAKER_ASSETS){if(group.status==='failed')break;loadFieldBreakerImage(owner,group,id,data[id])}}
 catch{failFieldBreaker(owner,group)}refreshFieldArtStatus();
}
function fieldBreakerActive(e){return fieldActorsActive()&&!!e&&e===activeBoss&&e.hp>0&&e.bossKind==='breaker'&&fieldArt.breaker.status==='ready'}
function fieldBreakerPose(e,motion){
 const locked=['warn','charge','recover'].includes(e.phase),dx=locked?e.chargeX||0:p.x-e.x,dy=locked?e.chargeY||0:p.y-e.y,direction=Math.hypot(dx,dy)>.00001?(Math.round(Math.atan2(dy,dx)/(Math.PI/4))+8)%8:motion?.direction||0,column=[0,1,2,1,0,3,4,3][direction],flip=FIELD_ACTOR_FLIPS[direction];let row=0;
 if(e.phase==='warn')row=clamp(1-e.phaseTime/BREAKER_TUNING.windup,0,1)>=.42?1:0;
 else if(e.phase==='charge')row=2+Math.min(3,Math.floor(clamp(1-e.phaseTime/BREAKER_TUNING.chargeTime,0,1)*4))%2;
 else if(e.phase==='recover')row=clamp(1-e.phaseTime/BREAKER_TUNING.recovery,0,1)<.65?4:0;
 return{pose:{asset:'breakerCombat',frame:row*5+column},direction,flip};
}
function fieldBreakerMotion(e){let motion=fieldArt.motion.get(e);if(!motion){const key=fieldBreakerPose(e);motion={x:e.x,y:e.y,travel:0,moving:false,direction:key.direction,flip:key.flip,pose:key.pose,previous:null,changedAt:elapsed,blend:0};fieldArt.motion.set(e,motion)}return motion}
function advanceFieldBreaker(dt){
 if(mode!=='play'||!(dt>0)||!fieldBreakerActive(activeBoss))return;
 const e=activeBoss,motion=fieldBreakerMotion(e),dx=e.x-motion.x,dy=e.y-motion.y,distance=Math.hypot(dx,dy),teleport=distance>1200*dt+2;motion.x=e.x;motion.y=e.y;motion.moving=!teleport&&distance/dt>3;if(teleport){motion.travel=0;motion.previous=null}if(motion.moving)motion.travel=(motion.travel+distance)%96;
 const key=fieldBreakerPose(e,motion);let pose=key.pose,flip=key.flip;
 if(e.phase==='approach'&&motion.moving){pose={asset:'breakerWalk',frame:Math.floor(motion.travel/96*4)%4};flip=Math.abs(dx)>.01?(dx<0?-1:1):motion.flip}
 const walking=pose.asset==='breakerWalk'&&motion.pose.asset===pose.asset;
 if(pose.asset!==motion.pose.asset||pose.frame!==motion.pose.frame||flip!==motion.flip){motion.previous={...motion.pose,flip:motion.flip};motion.pose=pose;motion.changedAt=elapsed;motion.blend=preferences.reduced?0:walking?.045:e.phase==='charge'?.035:e.phase==='recover'&&pose.frame<5?clamp(e.phaseTime,.06,.38):.09}motion.flip=flip;motion.direction=key.direction;
 if(motion.previous&&(preferences.reduced||elapsed-motion.changedAt>=motion.blend))motion.previous=null;
}

// Warden presentation reads native aimAngle/phase; it never emits attacks.
function freshFieldWarden(){return{status:'idle',row:null}}
function releaseFieldWarden(){const row=fieldArt.warden.row;if(row?.image){row.image.onload=null;row.image.onerror=null}fieldArt.warden=freshFieldWarden()}
function fieldWardenStatus(){const status=fieldArt.warden.status;return status==='idle'?'':status==='ready'?' · Warden art ready.':status==='loading'?' · Loading Warden art; Classic boss remains visible.':' · Warden art unavailable; Classic boss remains playable.'}
function fieldWardenWanted(){return bossLab&&training&&trainingScenario==='warden'||activeBoss?.hp>0&&activeBoss.bossKind==='warden'||!activeBoss&&bossWarned&&nextBossKind()==='warden'||fieldDefeatWanted('warden')}
function failFieldWarden(owner,group){if(fieldArt!==owner||owner.warden!==group)return;if(group.row?.image){group.row.image.onload=null;group.row.image.onerror=null}group.row=null;group.status='failed';refreshFieldArtStatus()}
function loadFieldWardenImage(owner,group,meta){
 const row={ready:false,image:null,meta:{frames:meta.frames,pivots:meta.pivots,referenceHeights:meta.referenceHeights}};group.row=row;const image=new Image();row.image=image;
 image.onload=()=>{if(fieldArt!==owner||owner.warden!==group||group.status==='failed')return;if(!(image.naturalWidth>0&&image.naturalHeight>0)){failFieldWarden(owner,group);return}image.onload=null;image.onerror=null;row.ready=true;group.status='ready';refreshFieldArtStatus()};image.onerror=()=>failFieldWarden(owner,group);image.src=meta.src;
}
function prepareFieldWarden(){
 if(!fieldActorsActive()||runLogged)return;const owner=fieldArt,group=owner.warden;
 if(!fieldWardenWanted()){if(group.status!=='idle'){releaseFieldWarden();refreshFieldArtStatus()}return}
 if(group.status!=='idle')return;if(owner.breaker.status!=='idle')releaseFieldBreaker();if(owner.harvester.status!=='idle')releaseFieldHarvester();group.status='loading';
 try{const meta=JSON.parse(document.getElementById('sampleAssets').textContent).warden;if(!meta||!/^data:image\/(?:png|webp);base64,/.test(meta.src)||meta.frames?.length!==35||meta.pivots?.length!==35||meta.referenceHeights?.length!==5||!meta.referenceHeights.every(n=>Number.isFinite(n)&&n>0)||!(meta.width*meta.height*4>0)||meta.width*meta.height*4>12*1024*1024)throw Error('Warden atlas');loadFieldWardenImage(owner,group,meta)}catch{failFieldWarden(owner,group)}refreshFieldArtStatus();
}
function fieldWardenActive(e){return fieldActorsActive()&&!!e&&e===activeBoss&&e.hp>0&&e.bossKind==='warden'&&fieldArt.warden.status==='ready'}
function fieldWardenPose(e,motion){
 const locked=e.phase==='warn'||e.phase==='recover',angle=locked?e.aimAngle:motion?.moving?Math.atan2(motion.dy,motion.dx):Math.atan2(p.y-e.y,p.x-e.x),direction=(Math.round(angle/(Math.PI/4))+8)%8,column=[0,1,2,1,0,3,4,3][direction];
 let row=motion?.moving?Math.floor((motion.travel||0)/84*4)%4:0;if(e.phase==='warn')row=4;else if(e.phase==='recover'){const t=clamp(1-e.phaseTime/WARDEN_TUNING.recovery,0,1);row=t<.1?5:t<.82?6:0}
 return{pose:{asset:'warden',frame:row*5+column},direction,flip:FIELD_ACTOR_FLIPS[direction]};
}
function fieldWardenMotion(e){let motion=fieldArt.motion.get(e);if(!motion){const key=fieldWardenPose(e);motion={x:e.x,y:e.y,dx:0,dy:0,travel:0,moving:false,direction:key.direction,flip:key.flip,pose:key.pose,previous:null,changedAt:elapsed,blend:0};fieldArt.motion.set(e,motion)}return motion}
function advanceFieldWarden(dt){
 if(mode!=='play'||!(dt>0)||!fieldWardenActive(activeBoss))return;const e=activeBoss,motion=fieldWardenMotion(e),dx=e.x-motion.x,dy=e.y-motion.y,distance=Math.hypot(dx,dy),teleport=distance>1200*dt+2;motion.x=e.x;motion.y=e.y;motion.dx=dx;motion.dy=dy;motion.moving=!teleport&&distance/dt>3;if(teleport){motion.travel=0;motion.previous=null}if(motion.moving)motion.travel=(motion.travel+distance)%84;
 const key=fieldWardenPose(e,motion);if(key.pose.frame!==motion.pose.frame||key.flip!==motion.flip){motion.previous={...motion.pose,flip:motion.flip};motion.pose=key.pose;motion.changedAt=elapsed;motion.blend=preferences.reduced?0:e.phase==='approach'?.045:e.phase==='recover'&&key.pose.frame>=25&&key.pose.frame<30?.035:.09}motion.flip=key.flip;motion.direction=key.direction;if(motion.previous&&(preferences.reduced||elapsed-motion.changedAt>=motion.blend))motion.previous=null;
}

// Harvester artwork follows native pulse phase; only native code resolves damage.
function freshFieldHarvester(){return{status:'idle',row:null}}
function releaseFieldHarvester(){const row=fieldArt.harvester.row;if(row?.image){row.image.onload=null;row.image.onerror=null}fieldArt.harvester=freshFieldHarvester()}
function fieldHarvesterStatus(){const s=fieldArt.harvester.status;return s==='idle'?'':s==='ready'?' · Harvester art ready.':s==='loading'?' · Loading Harvester art; Classic boss remains visible.':' · Harvester art unavailable; Classic boss remains playable.'}
function fieldHarvesterWanted(){return bossLab&&training&&trainingScenario==='harvester'||activeBoss?.hp>0&&activeBoss.bossKind==='harvester'||!activeBoss&&bossWarned&&nextBossKind()==='harvester'||fieldDefeatWanted('harvester')}
function failFieldHarvester(owner,group){if(fieldArt!==owner||owner.harvester!==group)return;if(group.row?.image){group.row.image.onload=null;group.row.image.onerror=null}group.row=null;group.status='failed';refreshFieldArtStatus()}
function loadFieldHarvesterImage(owner,group,meta){
 const row={ready:false,image:null,meta:{frames:meta.frames,pivots:meta.pivots,referenceHeights:meta.referenceHeights}};group.row=row;const image=new Image();row.image=image;
 image.onload=()=>{if(fieldArt!==owner||owner.harvester!==group||group.status==='failed')return;if(!(image.naturalWidth>0&&image.naturalHeight>0)){failFieldHarvester(owner,group);return}image.onload=null;image.onerror=null;row.ready=true;group.status='ready';refreshFieldArtStatus()};image.onerror=()=>failFieldHarvester(owner,group);image.src=meta.src;
}
function prepareFieldHarvester(){
 if(!fieldActorsActive()||runLogged)return;const owner=fieldArt,group=owner.harvester;
 if(!fieldHarvesterWanted()){if(group.status!=='idle'){releaseFieldHarvester();refreshFieldArtStatus()}return}
 if(group.status!=='idle')return;if(owner.breaker.status!=='idle')releaseFieldBreaker();if(owner.warden.status!=='idle')releaseFieldWarden();group.status='loading';
 try{const meta=JSON.parse(document.getElementById('sampleAssets').textContent).harvester;if(!meta||!/^data:image\/(?:png|webp);base64,/.test(meta.src)||meta.frames?.length!==35||meta.pivots?.length!==35||meta.referenceHeights?.length!==5||!meta.referenceHeights.every(n=>Number.isFinite(n)&&n>0)||!(meta.width*meta.height*4>0)||meta.width*meta.height*4>12*1024*1024)throw Error('Harvester atlas');loadFieldHarvesterImage(owner,group,meta)}catch{failFieldHarvester(owner,group)}refreshFieldArtStatus();
}
function fieldHarvesterActive(e){return fieldActorsActive()&&!!e&&e===activeBoss&&e.hp>0&&e.bossKind==='harvester'&&fieldArt.harvester.status==='ready'}
function fieldHarvesterPose(e,motion){
 const locked=e.phase==='warn'||e.phase==='recover',angle=motion?.moving?Math.atan2(motion.dy,motion.dx):Math.atan2(p.y-e.y,p.x-e.x),direction=locked&&motion?motion.direction:(Math.round(angle/(Math.PI/4))+8)%8,column=[0,1,2,1,0,3,4,3][direction];
 let row=motion?.moving?Math.floor((motion.travel||0)/88*4)%4:0;if(e.phase==='warn')row=4;else if(e.phase==='recover'){const t=clamp(1-e.phaseTime/HARVESTER_TUNING.recovery,0,1);row=t<.12?5:t<.82?6:0}
 return{pose:{asset:'harvester',frame:row*5+column},direction,flip:FIELD_ACTOR_FLIPS[direction]};
}
function fieldHarvesterMotion(e){let motion=fieldArt.motion.get(e);if(!motion){const k=fieldHarvesterPose(e);motion={x:e.x,y:e.y,dx:0,dy:0,travel:0,moving:false,direction:k.direction,flip:k.flip,pose:k.pose,previous:null,changedAt:elapsed,blend:0};fieldArt.motion.set(e,motion)}return motion}
function advanceFieldHarvester(dt){
 if(mode!=='play'||!(dt>0)||!fieldHarvesterActive(activeBoss))return;const e=activeBoss,m=fieldHarvesterMotion(e),dx=e.x-m.x,dy=e.y-m.y,d=Math.hypot(dx,dy),teleport=d>1200*dt+2;m.x=e.x;m.y=e.y;m.dx=dx;m.dy=dy;m.moving=!teleport&&d/dt>3;if(teleport){m.travel=0;m.previous=null}if(m.moving)m.travel=(m.travel+d)%88;
 const k=fieldHarvesterPose(e,m);if(k.pose.frame!==m.pose.frame||k.flip!==m.flip){m.previous={...m.pose,flip:m.flip};m.pose=k.pose;m.changedAt=elapsed;m.blend=preferences.reduced?0:e.phase==='approach'?.045:e.phase==='recover'&&k.pose.frame>=25&&k.pose.frame<30?.035:.09}m.flip=k.flip;m.direction=k.direction;if(m.previous&&(preferences.reduced||elapsed-m.changedAt>=m.blend))m.previous=null;
}

// Riot presentation follows native facing/shield state; it creates no collision or attacks.
