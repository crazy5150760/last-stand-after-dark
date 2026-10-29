function freshFieldRiot(){return{status:'idle',row:null}}
function releaseFieldRiot(){const row=fieldArt.riot.row;if(row?.image){row.image.onload=null;row.image.onerror=null}fieldArt.riot=freshFieldRiot()}
function fieldRiotStatus(){const s=fieldArt.riot.status;return s==='idle'?'':s==='ready'?' · Riot Guard art ready.':s==='loading'?' · Loading Riot Guard art; Classic guard remains visible.':' · Riot Guard art unavailable; Classic guard remains playable.'}
function fieldRiotWanted(){return bossLab&&training&&trainingScenario==='riot'||enemies.some(e=>e.riot&&e.hp>0)||fieldDefeatWanted('riot')}
function failFieldRiot(owner,group){if(fieldArt!==owner||owner.riot!==group)return;if(group.row?.image){group.row.image.onload=null;group.row.image.onerror=null}group.row=null;group.status='failed';refreshFieldArtStatus()}
function prepareFieldRiot(){
 if(!fieldActorsActive()||runLogged)return;const owner=fieldArt,group=owner.riot;
 if(!fieldRiotWanted()){if(group.status!=='idle'){releaseFieldRiot();refreshFieldArtStatus()}return}if(group.status!=='idle')return;group.status='loading';
 try{
  const meta=JSON.parse(document.getElementById('sampleAssets').textContent).riot;if(!meta||!/^data:image\/(?:png|webp);base64,/.test(meta.src)||meta.frames?.length!==35||meta.pivots?.length!==35||meta.referenceHeights?.length!==5||!meta.referenceHeights.every(n=>Number.isFinite(n)&&n>0)||!(meta.width*meta.height*4>0)||meta.width*meta.height*4>2*1024*1024)throw Error('Riot Guard atlas');
  const row={ready:false,image:null,meta:{frames:meta.frames,pivots:meta.pivots,referenceHeights:meta.referenceHeights}};group.row=row;const image=new Image();row.image=image;
  image.onload=()=>{if(fieldArt!==owner||owner.riot!==group||group.status==='failed')return;if(!(image.naturalWidth>0&&image.naturalHeight>0)){failFieldRiot(owner,group);return}image.onload=null;image.onerror=null;row.ready=true;group.status='ready';refreshFieldArtStatus()};image.onerror=()=>failFieldRiot(owner,group);image.src=meta.src;
 }catch{failFieldRiot(owner,group)}refreshFieldArtStatus();
}
function fieldRiotActive(e){return fieldActorsActive()&&!!e&&e.riot&&e.hp>0&&fieldArt.riot.status==='ready'}
function fieldRiotPose(e,motion){
 const direction=((Math.round((Number.isFinite(e.facing)?e.facing:0)/(Math.PI/4))%8)+8)%8,column=[0,1,2,1,0,3,4,3][direction];
 let row=motion?.moving?Math.floor((motion.travel||0)/64*4)%4:0;if(!riotShieldUp(e))row=6;else if(e.phase==='warn')row=4;else if(e.phase==='bash')row=5;
 return{pose:{asset:'riot',frame:row*5+column},direction,flip:FIELD_ACTOR_FLIPS[direction]};
}
function fieldRiotMotion(e){let m=fieldArt.motion.get(e);if(!m){const k=fieldRiotPose(e);m={x:e.x,y:e.y,travel:0,moving:false,direction:k.direction,flip:k.flip,pose:k.pose,previous:null,changedAt:elapsed,blend:0,shieldUp:riotShieldUp(e)};fieldArt.motion.set(e,m)}return m}
function advanceFieldRiot(dt){
 if(mode!=='play'||!(dt>0)||!fieldActorsActive())return;
 for(const e of enemies){if(!fieldRiotActive(e))continue;const m=fieldRiotMotion(e),distance=Math.hypot(e.x-m.x,e.y-m.y),teleport=distance>1200*dt+2;m.x=e.x;m.y=e.y;m.moving=!teleport&&distance/dt>3;if(teleport){m.travel=0;m.previous=null}if(m.moving)m.travel=(m.travel+distance)%64;
  const key=fieldRiotPose(e,m),shield=riotShieldUp(e),changedShield=shield!==m.shieldUp;
  if(key.pose.frame!==m.pose.frame||key.flip!==m.flip){m.previous=changedShield?null:{...m.pose,flip:m.flip};m.pose=key.pose;m.changedAt=elapsed;m.blend=preferences.reduced||changedShield?0:e.phase==='bash'?.025:e.phase==='approach'?.045:.07}m.flip=key.flip;m.direction=key.direction;m.shieldUp=shield;if(m.previous&&(preferences.reduced||elapsed-m.changedAt>=m.blend))m.previous=null;
 }
}

// Spitter presentation observes native aim and fresh shots; it never emits attacks.
function freshFieldSpitter(){return{status:'idle',row:null}}
function releaseFieldSpitter(){const row=fieldArt.spitter.row;if(row?.image){row.image.onload=null;row.image.onerror=null}fieldArt.spitter=freshFieldSpitter()}
function fieldSpitterStatus(){const s=fieldArt.spitter.status;return s==='idle'?'':s==='ready'?' · Spitter art ready.':s==='loading'?' · Loading Spitter art; Classic spitter remains visible.':' · Spitter art unavailable; Classic spitter remains playable.'}
function fieldSpitterWanted(){return bossLab&&training&&trainingScenario==='spitter'||enemies.some(e=>e.spitter&&e.hp>0)||fieldDefeatWanted('spitter')}
function failFieldSpitter(owner,group){if(fieldArt!==owner||owner.spitter!==group)return;if(group.row?.image){group.row.image.onload=null;group.row.image.onerror=null}group.row=null;group.status='failed';refreshFieldArtStatus()}
function prepareFieldSpitter(){
 if(!fieldActorsActive()||runLogged)return;const owner=fieldArt,group=owner.spitter;
 if(!fieldSpitterWanted()){if(group.status!=='idle'){releaseFieldSpitter();refreshFieldArtStatus()}return}if(group.status!=='idle')return;group.status='loading';
 try{
  const meta=JSON.parse(document.getElementById('sampleAssets').textContent).spitter;if(!meta||!/^data:image\/(?:png|webp);base64,/.test(meta.src)||meta.frames?.length!==35||meta.pivots?.length!==35||meta.referenceHeights?.length!==5||!meta.referenceHeights.every(n=>Number.isFinite(n)&&n>0)||!(meta.width*meta.height*4>0)||meta.width*meta.height*4>2*1024*1024)throw Error('Spitter atlas');
  const row={ready:false,image:null,meta:{frames:meta.frames,pivots:meta.pivots,referenceHeights:meta.referenceHeights}};group.row=row;const image=new Image();row.image=image;
  image.onload=()=>{if(fieldArt!==owner||owner.spitter!==group||group.status==='failed')return;if(!(image.naturalWidth>0&&image.naturalHeight>0)){failFieldSpitter(owner,group);return}image.onload=null;image.onerror=null;row.ready=true;group.status='ready';refreshFieldArtStatus()};image.onerror=()=>failFieldSpitter(owner,group);image.src=meta.src;
 }catch{failFieldSpitter(owner,group)}refreshFieldArtStatus();
}
function fieldSpitterActive(e){return fieldActorsActive()&&!!e&&e.spitter&&e.hp>0&&fieldArt.spitter.status==='ready'}
function fieldSpitterPose(e,m){
 const since=elapsed-(m?.releaseAt??-Infinity),released=since>=0&&since<.5,aim=e.phase==='aim',stunned=elapsed<(e.salvageStunUntil||0),angle=aim?Math.atan2(e.aimY,e.aimX):released?m.releaseAngle:m?.moving?Math.atan2(m.dy,m.dx):Math.atan2(p.y-e.y,p.x-e.x),direction=((Math.round(angle/(Math.PI/4))%8)+8)%8,column=[0,1,2,1,0,3,4,3][direction];
 let row=m?.moving?Math.floor((m.travel||0)/62*4)%4:0;if(stunned)row=6;else if(aim)row=4;else if(released)row=since<.14?5:6;
 return{pose:{asset:'spitter',frame:row*5+column},direction,flip:[1,1,1,-1,-1,1,1,-1][direction]};
}
function fieldSpitterMotion(e){let m=fieldArt.motion.get(e);if(!m){const k=fieldSpitterPose(e);m={x:e.x,y:e.y,dx:0,dy:0,travel:0,moving:false,direction:k.direction,flip:k.flip,pose:k.pose,previous:null,changedAt:elapsed,blend:0,phase:e.phase,releaseAt:-Infinity,releaseAngle:0};fieldArt.motion.set(e,m)}return m}
function noteFieldSpitterShot(e){if(!fieldSpitterActive(e))return;const m=fieldSpitterMotion(e);m.releaseAt=elapsed;m.releaseAngle=Math.atan2(e.aimY,e.aimX)}
function advanceFieldSpitter(dt){
 if(mode!=='play'||!(dt>0)||!fieldActorsActive())return;
 for(const e of enemies){if(!fieldSpitterActive(e))continue;const m=fieldSpitterMotion(e),dx=e.x-m.x,dy=e.y-m.y,distance=Math.hypot(dx,dy),teleport=distance>1200*dt+2;m.x=e.x;m.y=e.y;m.dx=dx;m.dy=dy;m.moving=!teleport&&distance/dt>3;if(teleport){m.travel=0;m.previous=null;m.releaseAt=-Infinity}if(m.moving)m.travel=(m.travel+distance)%62;
  const k=fieldSpitterPose(e,m);if(k.pose.frame!==m.pose.frame||k.flip!==m.flip){m.previous={...m.pose,flip:m.flip};m.pose=k.pose;m.changedAt=elapsed;m.blend=preferences.reduced?0:Math.floor(k.pose.frame/5)===5?.025:e.phase==='aim'?.07:.045}m.flip=k.flip;m.direction=k.direction;m.phase=e.phase;if(m.previous&&(preferences.reduced||elapsed-m.changedAt>=m.blend))m.previous=null;
 }
}

// Howler artwork only reads native howl/pulse state; native code owns the rally.
function freshFieldHowler(){return{status:'idle',row:null}}
function releaseFieldHowler(){const row=fieldArt.howler.row;if(row?.image){row.image.onload=null;row.image.onerror=null}fieldArt.howler=freshFieldHowler()}
function fieldHowlerStatus(){const s=fieldArt.howler.status;return s==='idle'?'':s==='ready'?' · Howler art ready.':s==='loading'?' · Loading Howler art; Classic howler remains visible.':' · Howler art unavailable; Classic howler remains playable.'}
function fieldHowlerWanted(){return bossLab&&training&&trainingScenario==='howler'||enemies.some(e=>e.howler&&e.hp>0)||fieldDefeatWanted('howler')}
function failFieldHowler(owner,group){if(fieldArt!==owner||owner.howler!==group)return;if(group.row?.image){group.row.image.onload=null;group.row.image.onerror=null}group.row=null;group.status='failed';refreshFieldArtStatus()}
function fieldHowlerBudget(data){const bytes=id=>{const m=data[id],n=m?.width*m?.height*4;return Number.isFinite(n)&&n>0?n:Infinity};return FIELD_ACTOR_ASSETS.reduce((n,id)=>n+bytes(id),0)+Math.max(bytes('breakerWalk')+bytes('breakerCombat'),bytes('warden'),bytes('harvester'))+['riot','spitter','howler','lobber','hunter'].reduce((n,id)=>n+bytes(id),0)<=44*1024*1024}
function prepareFieldHowler(){
 if(!fieldActorsActive()||runLogged)return;const owner=fieldArt,group=owner.howler;
 if(!fieldHowlerWanted()){if(group.status!=='idle'){releaseFieldHowler();refreshFieldArtStatus()}return}if(group.status!=='idle')return;group.status='loading';
 try{
  const data=JSON.parse(document.getElementById('sampleAssets').textContent),meta=data.howler;if(!meta||!/^data:image\/(?:png|webp);base64,/.test(meta.src)||meta.frames?.length!==35||meta.pivots?.length!==35||meta.referenceHeights?.length!==5||!meta.referenceHeights.every(n=>Number.isFinite(n)&&n>0)||!(meta.width*meta.height*4>0)||meta.width*meta.height*4>2*1024*1024||!fieldHowlerBudget(data))throw Error('Howler atlas/budget');
  const row={ready:false,image:null,meta:{frames:meta.frames,pivots:meta.pivots,referenceHeights:meta.referenceHeights}};group.row=row;const image=new Image();row.image=image;
  image.onload=()=>{if(fieldArt!==owner||owner.howler!==group||group.status==='failed')return;if(!(image.naturalWidth>0&&image.naturalHeight>0)){failFieldHowler(owner,group);return}image.onload=null;image.onerror=null;row.ready=true;group.status='ready';refreshFieldArtStatus()};image.onerror=()=>failFieldHowler(owner,group);image.src=meta.src;
 }catch{failFieldHowler(owner,group)}refreshFieldArtStatus();
}
function fieldHowlerActive(e){return fieldActorsActive()&&!!e&&e.howler&&e.hp>0&&fieldArt.howler.status==='ready'}
function fieldHowlerPose(e,m){
 const pulse=e.pulseUntil||0,recent=pulse>0&&elapsed<pulse+.14,locked=e.phase==='howl'||recent,angle=m?.moving?Math.atan2(m.dy,m.dx):Math.atan2(p.y-e.y,p.x-e.x),direction=locked&&m?m.direction:((Math.round(angle/(Math.PI/4))%8)+8)%8,column=[0,1,2,1,0,3,4,3][direction];
 let row=m?.moving?Math.floor((m.travel||0)/66*4)%4:0;if(elapsed<(e.salvageStunUntil||0))row=6;else if(e.phase==='howl')row=4;else if(recent)row=pulse-elapsed>.22?5:6;
 return{pose:{asset:'howler',frame:row*5+column},direction,flip:[1,1,1,-1,-1,1,1,-1][direction]};
}
function fieldHowlerMotion(e){let m=fieldArt.motion.get(e);if(!m){const k=fieldHowlerPose(e);m={x:e.x,y:e.y,dx:0,dy:0,travel:0,moving:false,direction:k.direction,flip:k.flip,pose:k.pose,previous:null,changedAt:elapsed,blend:0};fieldArt.motion.set(e,m)}return m}
function advanceFieldHowler(dt){
 if(mode!=='play'||!(dt>0)||!fieldActorsActive())return;
 for(const e of enemies){if(!fieldHowlerActive(e))continue;const m=fieldHowlerMotion(e),dx=e.x-m.x,dy=e.y-m.y,distance=Math.hypot(dx,dy),teleport=distance>1200*dt+2;m.x=e.x;m.y=e.y;m.dx=dx;m.dy=dy;m.moving=!teleport&&distance/dt>3;if(teleport){m.travel=0;m.previous=null}if(m.moving)m.travel=(m.travel+distance)%66;
  const k=fieldHowlerPose(e,m);if(k.pose.frame!==m.pose.frame||k.flip!==m.flip){m.previous=teleport?null:{...m.pose,flip:m.flip};m.pose=k.pose;m.changedAt=elapsed;m.blend=preferences.reduced||teleport?0:Math.floor(k.pose.frame/5)===5?.025:e.phase==='howl'?.07:.045}m.flip=k.flip;m.direction=k.direction;if(m.previous&&(preferences.reduced||elapsed-m.changedAt>=m.blend))m.previous=null;
 }
}

// Lobber presentation observes the real ground-target placement, never creating attacks.
function freshFieldLobber(){return{status:'idle',row:null}}
function releaseFieldLobber(){const row=fieldArt.lobber.row;if(row?.image){row.image.onload=null;row.image.onerror=null}fieldArt.lobber=freshFieldLobber()}
function fieldLobberStatus(){const s=fieldArt.lobber.status;return s==='idle'?'':s==='ready'?' · Lobber art ready.':s==='loading'?' · Loading Lobber art; Classic lobber remains visible.':' · Lobber art unavailable; Classic lobber remains playable.'}
function fieldLobberWanted(){return bossLab&&training&&trainingScenario==='lobber'||enemies.some(e=>e.lobber&&e.hp>0)||fieldDefeatWanted('lobber')}
function failFieldLobber(owner,group){if(fieldArt!==owner||owner.lobber!==group)return;if(group.row?.image){group.row.image.onload=null;group.row.image.onerror=null}group.row=null;group.status='failed';refreshFieldArtStatus()}
function prepareFieldLobber(){
 if(!fieldActorsActive()||runLogged)return;const owner=fieldArt,group=owner.lobber;
 if(!fieldLobberWanted()){if(group.status!=='idle'){releaseFieldLobber();refreshFieldArtStatus()}return}if(group.status!=='idle')return;group.status='loading';
 try{
  const data=JSON.parse(document.getElementById('sampleAssets').textContent),meta=data.lobber;if(!meta||!/^data:image\/(?:png|webp);base64,/.test(meta.src)||meta.frames?.length!==35||meta.pivots?.length!==35||meta.referenceHeights?.length!==5||!meta.referenceHeights.every(n=>Number.isFinite(n)&&n>0)||!(meta.width*meta.height*4>0)||meta.width*meta.height*4>2*1024*1024||!fieldHowlerBudget(data))throw Error('Lobber atlas/budget');
  const row={ready:false,image:null,meta:{frames:meta.frames,pivots:meta.pivots,referenceHeights:meta.referenceHeights}};group.row=row;const image=new Image();row.image=image;
  image.onload=()=>{if(fieldArt!==owner||owner.lobber!==group||group.status==='failed')return;if(!(image.naturalWidth>0&&image.naturalHeight>0)){failFieldLobber(owner,group);return}image.onload=null;image.onerror=null;row.ready=true;group.status='ready';refreshFieldArtStatus()};image.onerror=()=>failFieldLobber(owner,group);image.src=meta.src;
 }catch{failFieldLobber(owner,group)}refreshFieldArtStatus();
}
function fieldLobberActive(e){return fieldActorsActive()&&!!e&&e.lobber&&e.hp>0&&fieldArt.lobber.status==='ready'}
function fieldLobberPose(e,m){
 const since=elapsed-(m?.releaseAt??-Infinity),released=since>=0&&since<.5,angle=e.phase==='windup'?Math.atan2(p.y-e.y,p.x-e.x):released?m.releaseAngle:m?.moving?Math.atan2(m.dy,m.dx):Math.atan2(p.y-e.y,p.x-e.x),direction=((Math.round(angle/(Math.PI/4))%8)+8)%8,column=[0,1,2,1,0,3,4,3][direction];
 let row=m?.moving?Math.floor((m.travel||0)/68*4)%4:0;if(elapsed<(e.salvageStunUntil||0))row=6;else if(e.phase==='windup')row=4;else if(released)row=since<.14?5:6;
 return{pose:{asset:'lobber',frame:row*5+column},direction,flip:[1,1,1,-1,-1,1,1,-1][direction]};
}
function fieldLobberMotion(e){let m=fieldArt.motion.get(e);if(!m){const k=fieldLobberPose(e);m={x:e.x,y:e.y,dx:0,dy:0,travel:0,moving:false,direction:k.direction,flip:k.flip,pose:k.pose,previous:null,changedAt:elapsed,blend:0,releaseAt:-Infinity,releaseAngle:0};fieldArt.motion.set(e,m)}return m}
function noteFieldLobberThrow(e,bomb){if(!fieldLobberActive(e))return;const m=fieldLobberMotion(e);m.releaseAt=elapsed;m.releaseAngle=Math.atan2(bomb.y-e.y,bomb.x-e.x)}
function advanceFieldLobber(dt){
 if(mode!=='play'||!(dt>0)||!fieldActorsActive())return;
 for(const e of enemies){if(!fieldLobberActive(e))continue;const m=fieldLobberMotion(e),dx=e.x-m.x,dy=e.y-m.y,distance=Math.hypot(dx,dy),teleport=distance>1200*dt+2;m.x=e.x;m.y=e.y;m.dx=dx;m.dy=dy;m.moving=!teleport&&distance/dt>3;if(teleport){m.travel=0;m.previous=null;m.releaseAt=-Infinity}if(m.moving)m.travel=(m.travel+distance)%68;
  const k=fieldLobberPose(e,m);if(k.pose.frame!==m.pose.frame||k.flip!==m.flip){m.previous=teleport?null:{...m.pose,flip:m.flip};m.pose=k.pose;m.changedAt=elapsed;m.blend=preferences.reduced||teleport?0:Math.floor(k.pose.frame/5)===5?.025:e.phase==='windup'?.07:.045}m.flip=k.flip;m.direction=k.direction;if(m.previous&&(preferences.reduced||elapsed-m.changedAt>=m.blend))m.previous=null;
 }
}

// Blackout Hunter imagery observes native travel; it never owns wave or combat state.
function freshFieldHunter(){return{status:'idle',row:null}}
function releaseFieldHunter(){const image=fieldArt.hunter.row?.image;if(image){image.onload=null;image.onerror=null}fieldArt.hunter=freshFieldHunter()}
function fieldHunterStatus(){const state=fieldArt.hunter.status;return state==='idle'?'':state==='ready'?' · Blackout Hunter art ready.':state==='loading'?' · Loading Hunter art; Classic remains visible.':' · Hunter art unavailable; Classic remains playable.'}
function fieldHunterWanted(){return bossLab&&training&&trainingScenario==='hunter'||!training&&['warning','active'].includes(rushPhase)||enemies.some(e=>e.rush&&e.hp>0)||fieldDefeatWanted('hunter')}
function failFieldHunter(owner,group){if(fieldArt!==owner||owner.hunter!==group)return;const image=group.row?.image;if(image){image.onload=null;image.onerror=null}group.row=null;group.status='failed';refreshFieldArtStatus()}
function prepareFieldHunter(){
 if(!fieldActorsActive()||runLogged)return;const owner=fieldArt,group=owner.hunter;
 if(!fieldHunterWanted()){if(group.status!=='idle'){releaseFieldHunter();refreshFieldArtStatus()}return}if(group.status!=='idle')return;group.status='loading';
 try{
  const data=JSON.parse(document.getElementById('sampleAssets').textContent),meta=data.hunter;
  if(!meta||!/^data:image\/(?:png|webp);base64,/.test(meta.src)||!Number.isInteger(meta.width)||!Number.isInteger(meta.height)||meta.width<=0||meta.height<=0||meta.width*meta.height*4>1024*1024||meta.frames?.length!==20||meta.pivots?.length!==20||meta.referenceHeights?.length!==5||!meta.referenceHeights.every(n=>Number.isFinite(n)&&n>0)||!meta.frames.every((r,i)=>Array.isArray(r)&&r.length===4&&r.every(Number.isInteger)&&r[0]>=0&&r[1]>=0&&r[2]>0&&r[3]>0&&r[0]+r[2]<=meta.width&&r[1]+r[3]<=meta.height&&Array.isArray(meta.pivots[i])&&meta.pivots[i].length===2&&meta.pivots[i].every(Number.isFinite)&&meta.pivots[i][0]>=0&&meta.pivots[i][0]<=r[2]&&meta.pivots[i][1]===r[3])||!fieldHowlerBudget(data))throw Error('Hunter atlas/budget');
  const row={ready:false,image:null,meta:{frames:meta.frames,pivots:meta.pivots,referenceHeights:meta.referenceHeights}};group.row=row;const image=new Image();row.image=image;const width=meta.width,height=meta.height;
  image.onload=()=>{if(fieldArt!==owner||owner.hunter!==group||group.status!=='loading')return;if(image.naturalWidth!==width||image.naturalHeight!==height){failFieldHunter(owner,group);return}image.onload=null;image.onerror=null;row.ready=true;group.status='ready';refreshFieldArtStatus()};image.onerror=()=>failFieldHunter(owner,group);image.src=meta.src;
 }catch{failFieldHunter(owner,group)}refreshFieldArtStatus();
}
function fieldHunterActive(e){return fieldActorsActive()&&fieldArt.hunter.status==='ready'&&e.rush&&e.hp>0}
function fieldHunterPose(e,m){
 const direction=m?.moving?streetHeading(m.dx,m.dy,m.direction):Math.hypot(p.x-e.x,p.y-e.y)>14?streetHeading(p.x-e.x,p.y-e.y,m?.direction??0):m?.direction??0,column=[0,1,2,1,0,3,4,3][direction],phase=m?.moving?Math.floor(((m.travel||0)/60+(m.offset||0))%1*4):0;
 return{pose:{asset:'hunter',frame:phase*5+column},direction,flip:[1,1,1,-1,-1,1,1,-1][direction]};
}
function fieldHunterMotion(e){let m=fieldArt.motion.get(e);if(!m){const k=fieldHunterPose(e);m={x:e.x,y:e.y,dx:0,dy:0,travel:0,moving:false,direction:k.direction,flip:k.flip,pose:k.pose,previous:null,changedAt:elapsed,blend:.045,offset:(Math.abs(e.x)*.003+Math.abs(e.y)*.007)%1};fieldArt.motion.set(e,m)}return m}
function advanceFieldHunter(dt){
 if(mode!=='play'||!(dt>0)||!fieldActorsActive())return;
 for(const e of enemies){if(!fieldHunterActive(e))continue;const m=fieldHunterMotion(e),dx=e.x-m.x,dy=e.y-m.y,distance=Math.hypot(dx,dy),teleport=distance>1200*dt+2;m.x=e.x;m.y=e.y;m.dx=dx;m.dy=dy;m.moving=!teleport&&distance/dt>3;if(teleport){m.travel=0;m.previous=null}if(m.moving)m.travel=(m.travel+distance)%60;
  const k=fieldHunterPose(e,m);if(k.pose.frame!==m.pose.frame||k.flip!==m.flip){m.previous=teleport?null:{...m.pose,flip:m.flip};m.pose=k.pose;m.changedAt=elapsed;m.blend=preferences.reduced||teleport?0:.045}m.direction=k.direction;m.flip=k.flip;if(m.previous&&(preferences.reduced||elapsed-m.changedAt>=m.blend))m.previous=null;
 }
}
