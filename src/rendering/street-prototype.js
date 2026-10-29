const STREET_BLOCKS=Object.freeze([
 Object.freeze({x:-650,y:-650,w:455,h:455,z:125,name:'LAST LIGHT',sign:'#6ae3df'}),
 Object.freeze({x:195,y:-650,w:455,h:455,z:95,name:'AFTER HOURS',sign:'#e9b674'}),
 Object.freeze({x:-650,y:195,w:455,h:455,z:110,name:'NIGHT PHARMACY',sign:'#8ebda6'}),
 Object.freeze({x:195,y:195,w:455,h:455,z:88,name:'STILL HERE',sign:'#dca79a'})
]);
function streetScale(){return clamp(Math.min(W/600,H/420),.8,1.15)}
function streetProject(x,y,z=0){const s=streetScale(),a=Math.SQRT1_2*s;return{x:W/2+a*((x-p.x)-(y-p.y)),y:H*.58+a*.55*((x-p.x)+(y-p.y))-z*s}}
function streetUnproject(x,y){const a=Math.SQRT1_2*streetScale(),dx=(x-W/2)/a,dy=(y-H*.58)/(a*.55);return{x:p.x+(dx+dy)/2,y:p.y+(dy-dx)/2}}
function streetDirection(x,y){const length=Math.hypot(x,y);if(!length)return{x:0,y:0};const wx=(x+y/.55)/2,wy=(y/.55-x)/2,n=Math.hypot(wx,wy);return{x:wx/n*length,y:wy/n*length}}
function streetBlocked(from,to,r=0){return STREET_BLOCKS.some(b=>rectHitTime(b,from,to,r)!==Infinity)}
function streetSteering(e){return streetBlocked(e,p,e.r)?{x:0,y:0}:p}
function streetResolveBody(e,from){
 const limit=650-e.r;e.x=clamp(e.x,-limit,limit);e.y=clamp(e.y,-limit,limit);
 const blocked=(x,y)=>STREET_BLOCKS.some(b=>x>b.x-e.r&&x<b.x+b.w+e.r&&y>b.y-e.r&&y<b.y+b.h+e.r);
 if(blocked(e.x,from.y))e.x=from.x;if(blocked(e.x,e.y))e.y=from.y;
 // A blast/reset can displace an actor into a footprint; restore the nearest road.
 if(blocked(e.x,e.y)){if(Math.abs(e.x)<Math.abs(e.y))e.x=Math.sign(e.x||1)*(195-e.r-1);else e.y=Math.sign(e.y||1)*(195-e.r-1)}
}
function streetArtworkReady(){return sampleArtworkReady()&&sampleArtwork.intersection?.ready===true&&sampleArtwork.survivorWalk?.ready===true&&['shamblerWalk','runnerRun','bruteWalk','breakerWalk','survivorAim','environment','breakerCombat'].every(id=>sampleArtwork[id]?.ready===true)}
function refreshStreetMenu(){
 if(mode!=='street-menu')return;const ready=streetArtworkReady(),failed=Object.values(sampleArtwork).some(r=>r.failed),status=document.getElementById('streetAssetStatus'),button=document.getElementById('streetEnter');
 if(status)status.textContent=ready?'Street ready. Enter the unscored prototype.':failed?'Artwork could not load. Return to Main and reopen to retry. Normal play is available.':'Loading the street and character poses…';if(button)button.disabled=!ready;
}
// Session-only scene trials: fixed starting layouts, existing AI and weapons, no records.
const STREET_TRIALS=Object.freeze({
 standard:Object.freeze({name:'Standard',slots:6,effects:false,detail:'Six infected + Breaker · Piercing Rounds III'}),
 crowd:Object.freeze({name:'Crowd',slots:24,effects:false,detail:'24 infected + Breaker · Piercing Rounds III'}),
 effects:Object.freeze({name:'Evolved Effects',slots:24,effects:true,detail:'24 infected + Breaker · all four paths evolved'})
});
function streetTrialInfo(id=streetTrial){return Object.prototype.hasOwnProperty.call(STREET_TRIALS,id)?STREET_TRIALS[id]:STREET_TRIALS.standard}
function streetTrialPicker(){return `<div class="contract-picker"><label for="streetTrialPick">SCENE TRIAL</label><select id="streetTrialPick">${Object.entries(STREET_TRIALS).map(([id,t])=>`<option value="${id}">${t.name} · ${t.slots} infected</option>`).join('')}</select><p id="streetTrialDetail" class="muted"></p></div>`}
function bindStreetTrialPicker(){
 const picker=document.getElementById('streetTrialPick');picker.value=streetTrialChoice;document.getElementById('streetTrialDetail').textContent=streetTrialInfo(streetTrialChoice).detail;
 picker.addEventListener('change',()=>{if(!picker.isConnected||document.hidden||!['street-menu','paused'].includes(mode)||mode==='paused'&&!streetSession||!Object.prototype.hasOwnProperty.call(STREET_TRIALS,picker.value))return;streetTrialChoice=picker.value;document.getElementById('streetTrialDetail').textContent=streetTrialInfo(streetTrialChoice).detail});
}
function streetTrialSpots(){
 const spots=[[-105,-50],[140,-40],[15,260],[-280,20],[270,-25],[70,-155]];
 for(let i=6;i<streetTrialInfo().slots;i++){const n=i-6,lane=n%4,along=220+Math.floor(n/4)*38,across=(Math.floor(n/4)%3-1)*60;spots.push(lane===0?[along,across]:lane===1?[-along,across]:lane===2?[across,along]:[across,-along])}
 return spots;
}
function captureStreetReport(){if(mode!=='paused'||!streetSession||document.hidden)return;breakPerformanceSegment();showBenchmark('paused')}
function showStreetPrototype(){
 if(!['menu','end','street-menu','previews'].includes(mode))return;mode='street-menu';
 show(`<div class="eyebrow">CAMERA & ANIMATION PROTOTYPE · UNSCORED</div><h1 style="font-size:40px">LAST LIGHT<br>INTERSECTION</h1><p>A first playable step toward the angled city view: upright characters, real building sides, wet streets and a Breaker whose poses follow its actual attack.</p><p>Move and Dash toward the direction you press on the screen. The four buildings are solid in this prototype. Foreground walls fade when they cover you. Dash through the orange fuel barrel to test an explosion.</p><p>Your HP is safe. The Breaker and your selected crowd respawn. Pause to compare the composed / classic HUD, Angled / Overhead view, change weapons, or capture a phone benchmark. The new instruments show actual boss HP and attack cues, with safe practice HP and disabled XP labelled clearly.</p><details class="medal-goals" open><summary>SCENE TRIALS · SAFE HP · UNSCORED</summary>${streetTrialPicker()}<label class="street-measure"><input type="checkbox" id="streetMeasure">Measure frame timing for this trial</label><p class="muted">Optional, temporary measurements. Nothing is sent automatically. Changing a trial starts only when you press Enter.</p></details><p id="streetAssetStatus" role="status" class="muted">Loading artwork…</p><button class="btn primary-wide" id="streetEnter" disabled>ENTER INTERSECTION</button><p class="muted">The survivor and ordinary infected use eight movement directions and distance-driven steps. The Breaker keeps its approach walk and now braces, loads, charges and recovers in eight screen directions. Its attack facing stays locked to the real warning lane, including recovery. Compare the textured street and simple environment in Pause. Materials, signs, rooftop equipment, drains and wet-light highlights are decorative; the same four buildings remain solid. Try moving across a target while firing: the upper body aims separately from the walking legs. Hits react and defeated enemies briefly collapse. Breaker anticipation and recovery follow the real attack. Generated poses and final materials remain in development.</p><button class="btn secondary" id="streetBack">BACK TO PREVIEWS</button>`);
 bindStreetTrialPicker();document.getElementById('streetMeasure').checked=diagnostics.enabled;ensureSampleArtwork(true);bindUpgradePress(document.getElementById('streetEnter'),()=>{if(mode==='street-menu'&&streetArtworkReady())startStreetPrototype()},()=>mode==='street-menu');bindPress(document.getElementById('streetBack'),showPreviews);
}
function startStreetPrototype(trial=streetTrialChoice){
 if(!['street-menu','paused','end'].includes(mode)||document.hidden||!streetArtworkReady()||!Object.prototype.hasOwnProperty.call(STREET_TRIALS,trial))return;
 const measure=document.getElementById('streetMeasure');if(mode==='street-menu'&&measure){diagnostics.enabled=measure.checked;breakPerformanceSegment()}streetTrialChoice=trial;
 mode='training-menu';startTraining('pierce',false,'breaker',true);streetSession=true;streetTrial=trial;if(streetTrialInfo().effects){for(const evolution of EVOLUTIONS){p[evolution.weapon]=3;p[evolution.field]=true}trainingEvolved=true}streetAngled=true;streetDressed=true;streetHudPolished=true;p.x=0;p.y=70;lastMove.x=1;lastMove.y=0;
 obstacles=STREET_BLOCKS.map(b=>({...b}));barrels=[{x:105,y:65,r:17,spent:false}];enemies=[];activeBoss=null;trainingClock=0;updateTrainingTargets(0);primeStreetAnimations();clearInput();updateHUD();toast('INTERSECTION · UNSCORED · PAUSE TO COMPARE',3500);
}
function updateStreetTargets(){
 if(!activeBoss||activeBoss.hp<=0){activeBoss=null;enemies=enemies.filter(e=>e.hp>0&&!e.bossKind);spawnBoss('breaker');Object.assign(activeBoss,{x:0,y:-245,trainingDummy:true,trainingBoss:true})}
 const spots=streetTrialSpots();
 for(let i=0;i<spots.length;i++)if(!enemies.some(e=>e.streetSlot===i&&e.hp>0)){const kind=['shambler','runner','brute'][i%3],base=ENEMY_ART[kind],e={...base,x:spots[i][0],y:spots[i][1],hp:base.type===2?160:90,max:base.type===2?160:90,speed:base.type===1?85:45,dmg:12,hit:0,trainingDummy:true,trainingLive:true,streetSlot:i};streetResolveBody(e,e);enemies.push(e)}
}
function streetPauseControls(){return `<details class="medal-goals" open><summary>INTERSECTION PROTOTYPE · UNSCORED</summary><p>View: ${streetAngled?'ANGLED · UPRIGHT CHARACTERS':'OVERHEAD · PREVIOUS ART STUDY'}. Movement follows screen directions in either view. Buildings stay solid in this drill.</p><p>Environment: ${streetDressed?'TEXTURED STREET':'SIMPLE BLOCKS'}. Compare in the same camera; reset Phone Performance between captures.</p><button class="btn secondary" id="streetCompare">SHOW ${streetAngled?'OVERHEAD':'ANGLED'}</button><button class="btn secondary" id="streetEnvironment">SHOW ${streetDressed?'SIMPLE':'TEXTURED'} ENVIRONMENT</button><button class="btn secondary" id="streetHudCompare">SHOW ${streetHudPolished?'CLASSIC':'COMPOSED'} HUD</button><details class="medal-goals"><summary>SCENE TRIALS · ${streetTrialInfo().name.toUpperCase()}</summary><p>Current trial: ${streetTrialInfo().name} · ${streetTrialInfo().slots} infected slots + Breaker. Targets respawn; live counts vary. The build above shows your current weapons. Restart preset: ${streetTrialInfo().detail}.</p>${streetTrialPicker()}<p class="muted">Restart applies the selected trial and resets this unscored scene, build, practice totals and frame measurements. Camera, environment and HUD return to their composed defaults. Existing records stay intact.</p><button class="btn secondary" id="streetReset">RESTART SELECTED TRIAL</button><button class="btn secondary" id="streetReport">CAPTURE PHONE REPORT</button><p class="muted">Capture holds the current measurements. Back returns directly to Pause. Start/stop measurement in Settings → Phone Performance. Compare one visual option at a time and reset measurements between captures.</p></details><p class="muted">Compare camera and readability before wider use. Survivor facing follows travel in eight directions; gait stops against walls. Ordinary infected now use directional walk/run cycles. The upper body aims separately from the walking legs; hits react and defeats briefly collapse. Breaker anticipation and recovery follow the real attack. The new directional attack sheet retains the native windup, charge and recovery times. Approach turning and defeat motion remain procedural. Other practice drills leave this prototype.</p></details>`}
function bindStreetPause(){
 bindStreetTrialPicker();bindPress(document.getElementById('streetReport'),captureStreetReport);
 bindPress(document.getElementById('streetHudCompare'),()=>{if(mode!=='paused'||!streetSession)return;streetHudPolished=!streetHudPolished;syncStreetHud();clearInput();mode='play';pause()});
 bindPress(document.getElementById('streetCompare'),()=>{if(mode!=='paused'||!streetSession)return;streetAngled=!streetAngled;clearInput();mode='play';pause()});
 bindPress(document.getElementById('streetEnvironment'),()=>{if(mode!=='paused'||!streetSession)return;streetDressed=!streetDressed;clearInput();mode='play';pause()});
 bindPress(document.getElementById('streetReset'),()=>{if(mode==='paused'&&streetSession)startStreetPrototype()});
}
// Animation is presentation state, advanced once by active simulation updates.
// Weak keys release defeated/respawned actors without a growing history.
const STREET_ENEMY_GAITS=Object.freeze({shambler:Object.freeze({asset:'shamblerWalk',stride:48}),runner:Object.freeze({asset:'runnerRun',stride:64}),brute:Object.freeze({asset:'bruteWalk',stride:72}),breaker:Object.freeze({asset:'breakerWalk',stride:96})});
function streetRestFrame(kind){return {survivor:0,shambler:4,runner:5,brute:6,breaker:8}[kind]??4}
function streetHeading(dx,dy,current=0){if(Math.hypot(dx,dy)<.001)return current;const angle=Math.atan2(dy,dx),center=current*Math.PI/4,delta=Math.atan2(Math.sin(angle-center),Math.cos(angle-center));return Math.abs(delta)<Math.PI/8+.08?current:(Math.round(angle/(Math.PI/4))+8)%8}
function streetMotionFor(e){return streetMotion.get(e)}
function primeStreetAnimations(){streetCombat=freshStreetCombat();streetMotion=new WeakMap();for(const e of [p,...enemies])streetSeedMotion(e,e===p?'survivor':sampleEnemyKind(e)||'shambler');advanceStreetAim()}
function streetSeedMotion(e,kind){const motion={x:e.x,y:e.y,travel:0,speed:0,moving:false,facing:1,direction:0,pose:kind==='survivor'?{asset:'survivorWalk',frame:0}:{asset:'intersection',frame:streetRestFrame(kind)},previous:null,changedAt:elapsed,blend:0};streetMotion.set(e,motion);return motion}
// Attack artwork reads the native locked charge vector; it never steers the boss.
function streetBreakerPose(e,motion){
 const origin=streetProject(e.x,e.y),locked=['warn','charge','recover'].includes(e.phase),aim=locked?streetProject(e.x+(e.chargeX||0),e.y+(e.chargeY||0)):streetProject(p.x,p.y),dx=aim.x-origin.x,dy=aim.y-origin.y;
 const direction=Math.hypot(dx,dy)>.00001?(Math.round(Math.atan2(dy,dx)/(Math.PI/4))+8)%8:(motion?.bossDirection??motion?.direction??0),column=[0,1,2,1,0,3,4,3][direction],flip=[1,1,1,-1,-1,-1,1,1][direction];
 let row=0;
 if(e.phase==='warn')row=clamp(1-e.phaseTime/BREAKER_TUNING.windup,0,1)>=.42?1:0;
 else if(e.phase==='charge')row=2+Math.min(3,Math.floor(clamp(1-e.phaseTime/BREAKER_TUNING.chargeTime,0,1)*4))%2;
 else if(e.phase==='recover')row=clamp(1-e.phaseTime/BREAKER_TUNING.recovery,0,1)<.65?4:0;
 return{pose:{asset:'breakerCombat',frame:row*5+column},direction,flip};
}
function drawStreetBreakerLayers(info,alpha){
 for(const layer of info.layers){if(!layer.image||!layer.crop||!layer.pivot||layer.weight<=0)continue;g.save();g.scale(layer.flip??info.flip,1);g.globalAlpha=alpha*layer.weight;g.drawImage(layer.image,...layer.crop,-layer.pivot[0]*layer.scale,-layer.pivot[1]*layer.scale,layer.crop[2]*layer.scale,layer.crop[3]*layer.scale);g.restore()}
}
function advanceStreetAnimations(dt){
 if(!streetSession||mode!=='play'||!(dt>0))return;
 streetCombat.defeats=streetCombat.defeats.filter(body=>elapsed-body.at<body.duration);
 for(const e of [p,...enemies]){
  if(e!==p&&e.hp<=0)continue;const kind=e===p?'survivor':sampleEnemyKind(e)||'shambler',motion=streetMotion.get(e)||streetSeedMotion(e,kind),dx=e.x-motion.x,dy=e.y-motion.y,distance=Math.hypot(dx,dy),teleport=distance>1200*dt+2;
  const previousFacing=motion.facing;motion.x=e.x;motion.y=e.y;motion.speed=teleport?0:distance/dt;motion.moving=motion.speed>3;
  if(teleport){motion.travel=0;motion.previous=null}
  const gait=STREET_ENEMY_GAITS[kind],stride=gait?.stride||76;if(motion.moving)motion.travel=(motion.travel+distance)%stride;
  const origin=streetProject(e.x,e.y),target=kind==='survivor'?(gunTarget()||{x:e.x+lastMove.x,y:e.y+lastMove.y}):p,aim=streetProject(target.x,target.y),step=streetProject(e.x+dx,e.y+dy),direction=motion.moving?step.x-origin.x:aim.x-origin.x;
  const sx=motion.moving?step.x-origin.x:aim.x-origin.x,sy=motion.moving?step.y-origin.y:aim.y-origin.y;
  if(motion.moving||Math.hypot(sx,sy)>14)motion.direction=streetHeading(sx,sy,motion.direction);
  if(Math.abs(direction)>(motion.moving?.3:14))motion.facing=direction<0?-1:1;
  let pose;
  if(kind==='survivor'){
   const rows=[0,3,4,3,0,1,2,1],flip=[1,1,1,-1,-1,-1,1,1],phase=motion.moving?(p.dash>0?0:Math.floor(motion.travel/76*4)%4):0;
   pose={asset:'survivorWalk',frame:rows[motion.direction]*4+phase};motion.facing=flip[motion.direction];
  }else if(kind==='breaker'){
   if(e.phase==='approach'&&motion.moving)pose={asset:gait.asset,frame:Math.floor(motion.travel/stride*4)%4};
   else{const attack=streetBreakerPose(e,motion);pose=attack.pose;motion.facing=attack.flip;motion.bossDirection=attack.direction}
  }else if(gait){
   const rows=[0,3,4,3,0,1,2,1],flip=[1,1,1,-1,-1,-1,1,1],offset=((e.streetSlot||0)*.173)%1,phase=motion.moving?Math.floor((motion.travel/stride+offset)%1*4):0;
   pose={asset:gait.asset,frame:rows[motion.direction]*4+phase};motion.facing=flip[motion.direction];
  }else pose={asset:'intersection',frame:streetRestFrame(kind)};
  if(pose.asset!==motion.pose.asset||pose.frame!==motion.pose.frame||kind==='breaker'&&previousFacing!==motion.facing){const walking=motion.moving&&pose.asset===motion.pose.asset&&(pose.asset==='survivorWalk'||pose.asset===gait?.asset);motion.previous=motion.pose;motion.pose=pose;motion.changedAt=elapsed;motion.blend=preferences.reduced?0:kind==='breaker'&&!walking?.12:walking?.04:.09;if(kind==='breaker'){motion.previousFacing=previousFacing;if(!preferences.reduced&&!walking)motion.blend=e.phase==='charge'?.035:e.phase==='recover'&&pose.asset==='breakerCombat'&&pose.frame<5?clamp(e.phaseTime,.06,.38):.09}}
  if(kind==='breaker'){if(motion.combatPhase==='charge'&&e.phase==='recover')motion.impact={x:e.x,y:e.y,at:elapsed};motion.combatPhase=e.phase}
  if(motion.previous&&elapsed-motion.changedAt>=motion.blend)motion.previous=null;
 }
 advanceStreetAim();
}
// Visual combat state holds no live enemy references or gameplay timers.
const STREET_COMBAT_LIMIT=12;
function freshStreetCombat(){return{reactions:new WeakMap(),defeats:[],shot:null,aim:null}}
function streetCombatHit(e,damage){
 if(!streetSession||mode!=='play'||e.hp<=0)return;
 const kind=sampleEnemyKind(e);if(!kind)return;const motion=streetMotion.get(e),dx=e.x-p.x,dy=e.y-p.y,n=Math.hypot(dx,dy)||1,old=streetCombat.reactions.get(e);
 if(!old||elapsed-old.at>=.09)streetCombat.reactions.set(e,{at:elapsed,dx:dx/n,dy:dy/n});
 if(damage<e.hp)return;
 // Damage, removal, drops and practice credit still resolve immediately.
 const pose=motion?.pose||{asset:'intersection',frame:streetRestFrame(kind)},origin=streetProject(p.x,p.y),at=streetProject(e.x,e.y);
 streetCombat.defeats.push({x:e.x,y:e.y,r:e.r,kind,pose:{...pose},flip:motion?.facing||1,fall:Math.abs(at.x-origin.x)>1?Math.sign(at.x-origin.x):(motion?.facing||1),at:elapsed,duration:kind==='breaker'?.95:.65});
 if(streetCombat.defeats.length>STREET_COMBAT_LIMIT)streetCombat.defeats.shift();
}
function streetCombatShot(target){if(!streetSession)return;const dx=target.x-p.x,dy=target.y-p.y,n=Math.hypot(dx,dy)||1;streetCombat.shot={at:elapsed,dx:dx/n,dy:dy/n}}
function streetReactionVisual(e,kind){
 const hit=streetCombat.reactions.get(e),t=hit?(elapsed-hit.at)/.2:1,origin=streetProject(e.x,e.y),away=hit?streetProject(e.x+hit.dx,e.y+hit.dy):origin,lean=t>=0&&t<1?Math.sin(t*Math.PI)*(kind==='breaker'?.025:kind==='brute'?.045:.075):0;
 return{shear:preferences.reduced?0:-Math.sign(away.x-origin.x||1)*lean,flash:t>=0&&t<.25};
}
function streetBossVisual(e){
 const motion=streetMotion.get(e),origin=streetProject(e.x,e.y),aim=streetProject(e.x+(e.chargeX||0),e.y+(e.chargeY||0)),sign=Math.sign(aim.x-origin.x)||motion?.facing||1;
 let squash=1,shear=0;if(!preferences.reduced){if(e.phase==='warn'){const t=clamp(1-e.phaseTime/BREAKER_TUNING.windup,0,1);squash=1-.055*Math.sin(t*Math.PI);shear=-sign*.025*t}else if(e.phase==='charge'){squash=.97;shear=-sign*.09}else if(e.phase==='recover'){const t=clamp(1-e.phaseTime/BREAKER_TUNING.recovery,0,1);squash=.9+.1*(1-(1-t)*(1-t));shear=-sign*.035*(1-t)}}
 return{squash,shear,flip:['warn','charge'].includes(e.phase)&&Math.abs(aim.x-origin.x)>.01?sign:null};
}
function drawStreetBossImpact(){
 if(preferences.reduced)return;const impact=activeBoss&&streetMotion.get(activeBoss)?.impact;if(!impact)return;const t=(elapsed-impact.at)/.32;if(t<0||t>=1)return;const at=streetProject(impact.x,impact.y),s=streetScale();g.save();g.globalAlpha=(1-t)*.4;g.strokeStyle='#bba98a';g.lineWidth=2*s;g.beginPath();g.ellipse(at.x,at.y,(12+32*t)*s,(5+12*t)*s,0,0,7);g.stroke();g.restore();
}
function streetDefeatInfo(body){const t=clamp((elapsed-body.at)/body.duration,0,1),fall=clamp(t/.68,0,1),ease=fall*fall*(3-2*fall);return{...streetPoseInfo(body.pose,body.kind),point:streetProject(body.x,body.y),flip:body.flip,angle:preferences.reduced?0:body.fall*ease*1.35,squash:preferences.reduced?1:1-.72*ease,alpha:preferences.reduced?1-t:1-Math.pow(t,1.6)}}
function drawStreetDefeat(body){
 const info=streetDefeatInfo(body);if(!info.image||!info.crop||!info.pivot||info.alpha<=0)return;g.save();g.translate(info.point.x,info.point.y);g.globalAlpha=info.alpha*.5;g.fillStyle='#02070a';g.beginPath();g.ellipse(3,2,body.r*streetScale(),body.r*.4*streetScale(),0,0,7);g.fill();g.globalAlpha=info.alpha;g.rotate(info.angle);g.scale(info.flip,info.squash);g.imageSmoothingEnabled=true;g.drawImage(info.image,...info.crop,-info.pivot[0]*info.scale,-info.pivot[1]*info.scale,info.crop[2]*info.scale,info.crop[3]*info.scale);g.restore();
}

function streetFrame(e,kind){const motion=streetMotion.get(e);if(motion)return motion.pose.frame;return kind==='breaker'?(e.phase==='warn'?9:e.phase==='charge'?10:e.phase==='recover'?11:8):streetRestFrame(kind)}
function streetPoseInfo(pose,kind){
 const row=sampleArtwork[pose.asset],meta=sampleArtworkData?.[pose.asset],crop=row?.frames[pose.frame],pivot=meta?.pivots[pose.frame],s=streetScale(),height={survivor:72,shambler:66,runner:57,brute:82,breaker:112}[kind]||66;
 const sourceHeight=pose.asset==='breakerCombat'?(meta?.referenceHeights?.[pose.frame%5]||254):(pose.asset==='survivorWalk'||pose.asset===STREET_ENEMY_GAITS[kind]?.asset)?(meta?.referenceHeights?.[Math.floor(pose.frame/4)]||308):({survivor:308,shambler:328,runner:304,brute:348,breaker:407}[kind]||328);
 return{asset:pose.asset,index:pose.frame,crop,pivot,scale:height/sourceHeight*s,height:height*s,image:row?.ready?row.image:null};
}
function streetActorInfo(e,kind){
 const motion=streetMotion.get(e),pose=motion?.pose||{asset:'intersection',frame:streetFrame(e,kind)},current=streetPoseInfo(pose,kind),point=streetProject(e.x,e.y),t=motion?.previous&&motion.blend>0&&!preferences.reduced?clamp((elapsed-motion.changedAt)/motion.blend,0,1):1,weight=t*t*(3-2*t);
 const layers=motion?.previous&&weight<1?[{...streetPoseInfo(motion.previous,kind),weight:1-weight},{...current,weight}]:[{...current,weight:1}];
 if(kind==='breaker')for(let i=0;i<layers.length;i++)layers[i].flip=layers.length===2&&i===0?(motion?.previousFacing??motion?.facing??1):(motion?.facing||1);
 return{...current,point,flip:motion?.facing||1,layers};
}
function advanceStreetAim(){
 const shot=streetCombat.shot,locked=shot&&elapsed-shot.at<.12,target=locked?{x:p.x+shot.dx*100,y:p.y+shot.dy*100}:gunTarget(),old=streetCombat.aim;
 if(!target){if(old&&elapsed-old.lastSeenAt>.35)streetCombat.aim=null;return}
 const origin=streetProject(p.x,p.y),point=streetProject(target.x,target.y),dx=point.x-origin.x,dy=point.y-origin.y,n=Math.hypot(dx,dy)||1,direction=streetHeading(dx,dy,old?.direction||0),row=[0,3,4,3,0,1,2,1][direction],flip=[1,1,1,-1,-1,-1,1,1][direction];
 streetCombat.aim={direction,row,flip,dx:dx/n,dy:dy/n,lastSeenAt:elapsed,changedAt:old&&old.direction===direction?old.changedAt:elapsed,previous:old&&old.direction!==direction?{row:old.row,flip:old.flip}:old?.previous||null};
 if(streetCombat.aim.previous&&elapsed-streetCombat.aim.changedAt>=.06)streetCombat.aim.previous=null;
}
function streetAimInfo(){
 const aim=streetCombat.aim,row=sampleArtwork.survivorAim,meta=sampleArtworkData?.survivorAim;if(!aim||!row?.ready||!meta)return null;
 const t=preferences.reduced?1:clamp((elapsed-aim.changedAt)/.06,0,1),weight=t*t*(3-2*t),poses=aim.previous&&weight<1?[{...aim.previous,weight:1-weight},{row:aim.row,flip:aim.flip,weight}]:[{row:aim.row,flip:aim.flip,weight:1}],s=streetScale(),shot=streetCombat.shot,shotAge=shot?elapsed-shot.at:Infinity,recoil=!preferences.reduced&&shotAge>=0&&shotAge<.12?Math.sin(shotAge/.12*Math.PI)*.85*s:0;
 return{direction:aim.direction,dx:aim.dx,dy:aim.dy,waist:30*s,recoil,flash:!preferences.reduced&&shotAge>=0&&shotAge<.065,layers:poses.map(pose=>({...pose,image:row.image,crop:row.frames[pose.row],pivot:meta.pivots[pose.row],muzzle:meta.muzzles[pose.row],scale:44/meta.referenceHeights[pose.row]*s}))};
}
function drawStreetPoseLayers(info,alpha=1){for(const layer of info.layers){if(!layer.image||!layer.crop||!layer.pivot||layer.weight<=0)continue;g.globalAlpha=alpha*layer.weight;g.drawImage(layer.image,...layer.crop,-layer.pivot[0]*layer.scale,-layer.pivot[1]*layer.scale,layer.crop[2]*layer.scale,layer.crop[3]*layer.scale)}}
function drawStreetSurvivor(info,alpha){
 const aim=streetAimInfo();if(!aim){g.save();g.scale(info.flip,1);drawStreetPoseLayers(info,alpha);g.restore();return}
 // Keep the accepted lower-body gait; replace the baked upper body at the belt.
 g.save();g.beginPath();g.rect(-120*streetScale(),-aim.waist,240*streetScale(),100*streetScale());g.clip();g.scale(info.flip,1);drawStreetPoseLayers(info,alpha);g.restore();
 for(const layer of aim.layers){if(layer.weight<=0)continue;g.save();g.translate(-aim.dx*aim.recoil,-aim.waist-aim.dy*aim.recoil+2*streetScale());g.scale(layer.flip,1);g.globalAlpha=alpha*layer.weight;g.drawImage(layer.image,...layer.crop,-layer.pivot[0]*layer.scale,-layer.pivot[1]*layer.scale,layer.crop[2]*layer.scale,layer.crop[3]*layer.scale);g.restore()}
 if(aim.flash){const layer=aim.layers[aim.layers.length-1],x=(layer.muzzle[0]-layer.pivot[0])*layer.scale*layer.flip,y=-aim.waist+(layer.muzzle[1]-layer.pivot[1])*layer.scale+2*streetScale();g.save();g.translate(x,y);g.rotate(Math.atan2(aim.dy,aim.dx));g.globalAlpha=.9;g.fillStyle='#ffe7a7';g.beginPath();g.moveTo(0,-2);g.lineTo(8,0);g.lineTo(0,2);g.lineTo(-2,0);g.closePath();g.fill();g.restore()}
}

function drawStreetActor(e,kind){
 const info=streetActorInfo(e,kind);if(!info.image||!info.crop||!info.pivot)return;
 const {point,height}=info;g.save();g.translate(point.x,point.y);g.fillStyle='#02070ab0';g.beginPath();g.ellipse(4,2,e.r*streetScale(),e.r*.4*streetScale(),0,0,7);g.fill();
 if(kind==='survivor'){g.strokeStyle='#8cf9d4';g.lineWidth=1.5;g.beginPath();g.ellipse(0,0,(e.r+5)*streetScale(),(e.r+5)*.42*streetScale(),0,0,7);g.stroke()}
 const flash=e.hit||kind==='survivor'&&p.inv>0&&Math.floor(elapsed*15)%2,alpha=flash?.6:1;g.imageSmoothingEnabled=true;
 if(kind==='survivor')drawStreetSurvivor(info,alpha);else{
  const reaction=streetReactionVisual(e,kind),boss=kind==='breaker'?streetBossVisual(e):{squash:1,shear:0,flip:null};g.transform(1,0,reaction.shear+boss.shear,boss.squash,0,0);if(kind==='breaker')drawStreetBreakerLayers(info,alpha);else{g.scale(info.flip,1);drawStreetPoseLayers(info,alpha)}
 }g.restore();
 if(e!==p){g.fillStyle='#080f18dd';g.fillRect(point.x-19,point.y-height-10,38,4);g.fillStyle=e.bossKind?'#f27683':'#c8b897';g.fillRect(point.x-19,point.y-height-10,38*clamp(e.hp/e.max,0,1),4)}
}
function streetPolygon(points,fill,stroke=null){g.beginPath();points.forEach((v,i)=>i?g.lineTo(v.x,v.y):g.moveTo(v.x,v.y));g.closePath();if(fill){g.fillStyle=fill;g.fill()}if(stroke){g.strokeStyle=stroke;g.lineWidth=1;g.stroke()}}
function streetBuildingShape(b){const a=streetProject(b.x,b.y),c=streetProject(b.x+b.w,b.y+b.h),right=streetProject(b.x+b.w,b.y),left=streetProject(b.x,b.y+b.h),ra=streetProject(b.x,b.y,b.z),rr=streetProject(b.x+b.w,b.y,b.z),rc=streetProject(b.x+b.w,b.y+b.h,b.z),rl=streetProject(b.x,b.y+b.h,b.z);return{a,c,right,left,ra,rr,rc,rl,silhouette:[ra,rr,right,c,left,rl]}}
function streetPointInPolygon(point,poly){let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a.y>point.y)!==(b.y>point.y)&&point.x<(b.x-a.x)*(point.y-a.y)/(b.y-a.y)+a.x)inside=!inside}return inside}
function streetBuildingAlpha(b){const shape=streetBuildingShape(b),head=streetProject(p.x,p.y,56),mid=streetProject(p.x,p.y,28);return (streetPointInPolygon(head,shape.silhouette)||streetPointInPolygon(mid,shape.silhouette))? .22:1}
function drawStreetBlockout(b){
 const {c,right,left,ra,rr,rc,rl}=streetBuildingShape(b),alpha=streetBuildingAlpha(b);g.save();g.globalAlpha=alpha;
 streetPolygon([rr,rc,c,right],'#1c2b32','#41525b');streetPolygon([rl,rc,c,left],'#293940','#526269');streetPolygon([ra,rr,rc,rl],'#35454b','#6b7b7b');
 // Roof inset and ventilation; facade detail follows its actual projected plane.
 const roof=[streetProject(b.x+18,b.y+18,b.z+1),streetProject(b.x+b.w-18,b.y+18,b.z+1),streetProject(b.x+b.w-18,b.y+b.h-18,b.z+1),streetProject(b.x+18,b.y+b.h-18,b.z+1)];streetPolygon(roof,'#24353b','#526569');
 for(let i=0;i<5;i++){
  const x=b.x+35+i*76,y=b.y+b.h,z=38;
  streetPolygon([streetProject(x,y,z),streetProject(x+43,y,z),streetProject(x+43,y,z+30),streetProject(x,y,z+30)],i%3?'#435956':b.sign,'#0a1720');
  streetPolygon([streetProject(b.x+b.w,b.y+35+i*76,30),streetProject(b.x+b.w,b.y+78+i*76,30),streetProject(b.x+b.w,b.y+78+i*76,61),streetProject(b.x+b.w,b.y+35+i*76,61)],i%3?'#243c45':'#b99366','#14212a');
 }
 const sign=streetProject(b.x+b.w*.5,b.y+b.h+2,82);g.save();g.translate(sign.x,sign.y);g.rotate(Math.atan(.55));g.fillStyle='#091b24';g.fillRect(-73,-14,146,23);g.strokeStyle=b.sign;g.lineWidth=1;g.strokeRect(-73,-14,146,23);g.fillStyle=b.sign;g.font='bold 11px system-ui';g.textAlign='center';g.fillText(b.name,0,2);g.restore();g.restore();
}
function streetGroundTransform(){const a=Math.SQRT1_2*streetScale();g.transform(a,a*.55,-a,a*.55,W/2-a*(p.x-p.y),H*.58-a*.55*(p.x+p.y))}
function drawStreetGroundBlockout(){
 g.save();streetGroundTransform();g.fillStyle='#19272d';g.fillRect(-720,-720,1440,1440);const texture=sampleArtwork.street;if(texture?.ready){g.globalAlpha=.25;g.drawImage(texture.image,-720,-720,1440,1440);g.globalAlpha=1}
 g.fillStyle='#1d2a30bb';g.fillRect(-180,-700,360,1400);g.fillRect(-700,-180,1400,360);
 g.strokeStyle='#687b7d';g.lineWidth=9;g.strokeRect(-660,-660,470,470);g.strokeRect(190,-660,470,470);g.strokeRect(-660,190,470,470);g.strokeRect(190,190,470,470);
 g.fillStyle='#bbb59477';for(let n=-580;n<=580;n+=95){if(Math.abs(n)<210)continue;g.fillRect(-3,n,6,36);g.fillRect(n,-3,36,6)}
 g.fillStyle='#b3bdb080';for(let n=-145;n<150;n+=34){g.fillRect(n,-218,19,52);g.fillRect(n,166,19,52);g.fillRect(-218,n,52,19);g.fillRect(166,n,52,19)}
 for(let i=0;i<28;i++){const x=((i*137)%1080)-540,y=((i*211)%1080)-540;if(Math.abs(x)>165&&Math.abs(y)>165)continue;g.fillStyle=i%2?'#69b4b017':'#d4b06b12';g.beginPath();g.ellipse(x,y,35+i%4*8,8,Math.sin(i),0,7);g.fill()}
 renderGroundFire();renderBossWarning();for(const gem of gems){g.fillStyle='#6cf7d7';g.fillRect(gem.x-3,gem.y-3,6,6)}renderBlasts();renderWeapons();renderDecoy();g.restore();
}
function drawStreetLampBlockout(lamp){
 const foot=streetProject(lamp.x,lamp.y),top=streetProject(lamp.x,lamp.y,82),s=streetScale();g.strokeStyle='#101b23';g.lineWidth=5*s;g.beginPath();g.moveTo(foot.x,foot.y);g.lineTo(top.x,top.y);g.stroke();g.fillStyle='#ffe0a3';g.fillRect(top.x-6*s,top.y-6*s,12*s,9*s);
 if(!preferences.reduced){const glow=g.createRadialGradient(top.x,top.y,0,top.x,top.y,40*s);glow.addColorStop(0,'#ffd29455');glow.addColorStop(1,'#ffd29400');g.fillStyle=glow;g.fillRect(top.x-40*s,top.y-40*s,80*s,80*s)}
}
function drawStreetBarrel(b){const at=streetProject(b.x,b.y),s=streetScale();g.save();g.translate(at.x,at.y);g.fillStyle='#131b20';g.beginPath();g.ellipse(3,2,18*s,7*s,0,0,7);g.fill();g.fillStyle='#ad6834';g.fillRect(-12*s,-27*s,24*s,27*s);g.fillStyle='#dda75b';g.beginPath();g.ellipse(0,-27*s,12*s,5*s,0,0,7);g.fill();g.strokeStyle='#482f26';g.lineWidth=3*s;g.strokeRect(-12*s,-21*s,24*s,14*s);g.fillStyle='#ffe2a8';g.font='bold 13px system-ui';g.textAlign='center';g.fillText('!',0,-8*s);g.restore()}
// One shared material atlas, fixed scene detail and no gameplay/random state.
const STREET_LIGHTS=Object.freeze([
 Object.freeze({x:-185,y:-155,color:'#edbd7a'}),Object.freeze({x:185,y:155,color:'#edbd7a'}),
 Object.freeze({x:155,y:-185,color:'#edbd7a'}),Object.freeze({x:-155,y:185,color:'#edbd7a'}),
 Object.freeze({x:-230,y:-170,color:'#66c9d1'}),Object.freeze({x:-170,y:260,color:'#79bdb1'})
]);
function streetQuadVisible(points){return !points.every(v=>v.x<-90)&&!points.every(v=>v.x>W+90)&&!points.every(v=>v.y<-90)&&!points.every(v=>v.y>H+90)}
function streetMaterialInfo(id){const row=sampleArtwork.environment,meta=sampleArtworkData?.environment,index=meta?.materials?.indexOf(id)??-1;return row?.ready&&index>=0?{image:row.image,crop:row.frames[index]}:null}
function drawStreetMaterial(id,points,opacity=1,parentAlpha=1,uv=[0,0,1,1]){
 const material=streetMaterialInfo(id);if(!material||!streetQuadVisible(points))return false;const [a,b,,d]=points,[x,y,w,h]=material.crop;
 g.save();g.globalAlpha=parentAlpha*opacity;g.transform(b.x-a.x,b.y-a.y,d.x-a.x,d.y-a.y,a.x,a.y);g.imageSmoothingEnabled=true;g.drawImage(material.image,x+w*uv[0],y+h*uv[1],w*uv[2],h*uv[3],0,0,1,1);g.restore();return true;
}
function streetFaceQuad(b,face,u,z,width,height){const point=(v,h)=>face==='front'?streetProject(b.x+v,b.y+b.h,h):streetProject(b.x+b.w,b.y+v,h);return[point(u,z+height),point(u+width,z+height),point(u+width,z),point(u,z)]}
function drawStreetRoofUnit(x,y,width,depth,z,height,alpha){
 const top=[streetProject(x,y,z+height),streetProject(x+width,y,z+height),streetProject(x+width,y+depth,z+height),streetProject(x,y+depth,z+height)],front=[top[3],top[2],streetProject(x+width,y+depth,z),streetProject(x,y+depth,z)],side=[top[1],top[2],streetProject(x+width,y+depth,z),streetProject(x+width,y,z)];
 streetPolygon(front,'#29383c','#101a20');streetPolygon(side,'#19292e','#101a20');streetPolygon(top,'#66716b','#8a958b');drawStreetMaterial('metal',top,.8,alpha);
 for(let i=1;i<5;i++){const a=streetProject(x+width*i/5,y+4,z+height+.1),b=streetProject(x+width*i/5,y+depth-4,z+height+.1);g.strokeStyle='#17262d';g.lineWidth=1;g.beginPath();g.moveTo(a.x,a.y);g.lineTo(b.x,b.y);g.stroke()}
}
function drawStreetBuilding(b){
 if(!streetDressed){drawStreetBlockout(b);return}
 const shape=streetBuildingShape(b),{c,right,left,ra,rr,rc,rl}=shape,alpha=streetBuildingAlpha(b);if(!streetQuadVisible(shape.silhouette))return;
 g.save();g.globalAlpha=alpha;streetPolygon([rr,rc,c,right],'#1c2b32','#35474c');streetPolygon([rl,rc,c,left],'#27343a','#4b5b60');streetPolygon([ra,rr,rc,rl],'#2a3639','#6a7472');
 for(const face of ['side','front']){
  for(let u=0;u<b.w;u+=128)for(let z=8;z<b.z;z+=64){const width=Math.min(128,b.w-u),height=Math.min(64,b.z-z);drawStreetMaterial('brick',streetFaceQuad(b,face,u,z,width,height),face==='front'?.74:.48,alpha,[0,0,width/128,height/64])}
  const base=streetFaceQuad(b,face,0,0,b.w,8);streetPolygon(base,'#141f25','#47575b');
  for(let i=0;i<3;i++){
   const panel=streetFaceQuad(b,face,24+i*116,12,94,49),shutter=face==='side'&&i>0||b.name==='STILL HERE'&&i===1;streetPolygon(panel,'#0c171d','#0a1118');drawStreetMaterial(shutter?'metal':'window',panel,shutter?.88:.92,alpha);streetPolygon(panel,null,'#6a797773');
   if(!shutter){g.globalAlpha=alpha*.17;streetPolygon(streetFaceQuad(b,face,29+i*116,15,84,39),face==='front'?b.sign:'#e2bd80');g.globalAlpha=alpha}
   if(shutter){g.strokeStyle='#0c1924';g.lineWidth=1;for(let z=19;z<58;z+=8){const q=streetFaceQuad(b,face,26+i*116,z,90,.8);streetPolygon(q,'#0b17267a')}}
  }
  const door=streetFaceQuad(b,face,378,8,48,55);streetPolygon(door,'#10252b','#8c999478');drawStreetMaterial('window',door,.78,alpha);streetPolygon(streetFaceQuad(b,face,402,29,4,2),'#c6b78c');
  // A shallow lintel, corner trim, drain pipe and wall-mounted service cabinet.
  streetPolygon(streetFaceQuad(b,face,17,64,417,5),'#263f47','#6e817e');streetPolygon(streetFaceQuad(b,face,5,0,6,b.z),'#53615f','#1a2b31');streetPolygon(streetFaceQuad(b,face,362,2,4,b.z-9),'#42545a','#111e29');
  const cabinet=streetFaceQuad(b,face,438,18,14,29);streetPolygon(cabinet,'#60706a','#18252c');drawStreetMaterial('metal',cabinet,.7,alpha);
  if(b.z>105)for(let i=0;i<3;i++){const q=streetFaceQuad(b,face,48+i*126,83,56,20);streetPolygon(q,'#182a31','#68766c');drawStreetMaterial('window',q,.48,alpha)}
 }
 const roof=[streetProject(b.x+9,b.y+9,b.z+.1),streetProject(b.x+b.w-9,b.y+9,b.z+.1),streetProject(b.x+b.w-9,b.y+b.h-9,b.z+.1),streetProject(b.x+9,b.y+b.h-9,b.z+.1)];drawStreetMaterial('roof',roof,.82,alpha);
 // Rooftop detail stays inside the existing solid footprint.
 drawStreetRoofUnit(b.x+b.w-122,b.y+b.h-113,72,49,b.z+1,16,alpha);drawStreetRoofUnit(b.x+b.w-190,b.y+b.h-63,30,30,b.z+1,24,alpha);
 const sign=streetProject(b.x+b.w*.5,b.y+b.h+.3,b.z-17),s=streetScale();g.save();g.translate(sign.x,sign.y);g.rotate(Math.atan(.55));g.fillStyle='#09161e';g.fillRect(-88*s,-13,176*s,24);g.strokeStyle=b.sign;g.lineWidth=preferences.reduced?1:2;g.strokeRect(-86*s,-11,172*s,20);g.fillStyle=b.sign;g.font='bold 11px system-ui';g.textAlign='center';g.fillText(b.name,0,4);g.restore();g.restore();
}
function drawStreetWetLight(){
 if(preferences.reduced)return;
 for(const light of STREET_LIGHTS){const glow=g.createRadialGradient(light.x,light.y,8,light.x,light.y,118);glow.addColorStop(0,light.color+'25');glow.addColorStop(1,light.color+'00');g.fillStyle=glow;g.fillRect(light.x-118,light.y-118,236,236);
  for(let i=0;i<5;i++){g.fillStyle=light.color+(i%2?'13':'20');g.fillRect(light.x-25+i*9,light.y+18+i*8,28-i*3,1.5)}
 }
}
function drawStreetGround(){
 if(!streetDressed){drawStreetGroundBlockout();return}
 g.save();streetGroundTransform();g.fillStyle='#243038';g.fillRect(-720,-720,1440,1440);const asphalt=streetMaterialInfo('asphalt'),concrete=streetMaterialInfo('concrete');
 if(asphalt){g.globalAlpha=.55;for(let x=-720;x<720;x+=240)for(let y=-720;y<720;y+=240){const q=[streetProject(x,y),streetProject(x+240,y),streetProject(x+240,y+240),streetProject(x,y+240)];if(streetQuadVisible(q))g.drawImage(asphalt.image,...asphalt.crop,x,y,240,240)}g.globalAlpha=1}
 // Sidewalks stay within the unchanged building footprints and their visible curb.
 for(const b of STREET_BLOCKS){g.fillStyle='#465151';g.fillRect(b.x-7,b.y-7,b.w+14,b.h+14);if(concrete){g.globalAlpha=.55;g.drawImage(concrete.image,...concrete.crop,b.x-7,b.y-7,b.w+14,b.h+14);g.globalAlpha=1}g.strokeStyle='#87908a';g.lineWidth=3;g.strokeRect(b.x-7,b.y-7,b.w+14,b.h+14);g.strokeStyle='#101d25';g.lineWidth=4;g.strokeRect(b.x-2,b.y-2,b.w+4,b.h+4)}
 g.fillStyle='#b3ac8966';for(let n=-580;n<=580;n+=95){if(Math.abs(n)<230)continue;g.fillRect(-3,n,6,36);g.fillRect(n,-3,36,6)}
 g.fillStyle='#c1c5b16b';for(let n=-145;n<150;n+=34){g.fillRect(n,-218,19,51);g.fillRect(n,167,19,51);g.fillRect(-218,n,51,19);g.fillRect(167,n,51,19)}
 // Fixed puddles, drain grilles and litter are flat decals, with no new colliders.
 for(let i=0;i<24;i++){const x=((i*137)%1080)-540,y=((i*211)%1080)-540;if(Math.abs(x)>148&&Math.abs(y)>148)continue;g.fillStyle='#07141b45';g.beginPath();g.ellipse(x,y,32+i%4*7,8+i%3,Math.sin(i),0,7);g.fill();if(!preferences.reduced){g.strokeStyle=i%2?'#75bfc625':'#d2b18224';g.lineWidth=1;g.beginPath();g.moveTo(x-18,y);g.lineTo(x+13,y+2);g.stroke()}}
 for(const [x,y] of [[-164,-85],[164,85],[85,-164],[-85,164]]){g.fillStyle='#111e24';g.fillRect(x-13,y-7,26,14);g.strokeStyle='#6c7a77';g.lineWidth=1;g.strokeRect(x-13,y-7,26,14);for(let i=-9;i<=9;i+=4){g.fillStyle='#495b60';g.fillRect(x+i,y-5,1,10)}}
 g.fillStyle='#34464a';g.beginPath();g.ellipse(62,-62,22,18,0,0,7);g.fill();g.strokeStyle='#6b7875';g.lineWidth=2;g.stroke();for(let i=-12;i<=12;i+=6){g.strokeStyle='#162a31';g.beginPath();g.moveTo(49,-62+i);g.lineTo(75,-62+i);g.stroke()}
 for(let i=0;i<10;i++){const x=i%2?154:-151,y=-390+i*81;g.fillStyle=i%3?'#7a797159':'#a19a7852';g.fillRect(x,y,4+i%3,3)}drawStreetWetLight();
 // Damage warnings and gameplay effects always draw after decorative ground work.
 renderGroundFire();renderBossWarning();for(const gem of gems){g.fillStyle='#6cf7d7';g.fillRect(gem.x-3,gem.y-3,6,6)}renderBlasts();renderWeapons();renderDecoy();g.restore();
}
function drawStreetLamp(lamp){
 if(!streetDressed){drawStreetLampBlockout(lamp);return}
 const foot=streetProject(lamp.x,lamp.y),top=streetProject(lamp.x,lamp.y,82),s=streetScale();g.save();g.fillStyle='#0a151d';g.beginPath();g.ellipse(foot.x+3*s,foot.y+2*s,8*s,4*s,0,0,7);g.fill();g.strokeStyle='#0a151d';g.lineWidth=5*s;g.beginPath();g.moveTo(foot.x,foot.y);g.lineTo(top.x,top.y);g.lineTo(top.x+12*s,top.y);g.stroke();g.strokeStyle='#8b8f75';g.lineWidth=1*s;g.beginPath();g.moveTo(foot.x-s,foot.y);g.lineTo(top.x-s,top.y+3*s);g.stroke();g.fillStyle='#192a30';g.fillRect(top.x+5*s,top.y-4*s,15*s,9*s);g.fillStyle='#ffe0a6';g.fillRect(top.x+8*s,top.y-2*s,9*s,5*s);
 if(!preferences.reduced){const glow=g.createRadialGradient(top.x+12*s,top.y,0,top.x+12*s,top.y,32*s);glow.addColorStop(0,'#ffd29444');glow.addColorStop(1,'#ffd29400');g.fillStyle=glow;g.fillRect(top.x-20*s,top.y-32*s,64*s,64*s)}g.restore();
}

function streetDrawQueue(){return [...STREET_BLOCKS.map(b=>({depth:b.x+b.w+b.y+b.h,kind:'building',item:b})),...[{x:-185,y:-155},{x:185,y:155},{x:155,y:-185},{x:-155,y:185}].map(l=>({depth:l.x+l.y,kind:'lamp',item:l})),...barrels.filter(b=>!b.spent).map(b=>({depth:b.x+b.y,kind:'barrel',item:b})),...streetCombat.defeats.map(body=>({depth:body.x+body.y-.5,kind:'defeat',item:body})),...enemies.filter(e=>e.hp>0).map(e=>({depth:e.x+e.y,kind:sampleEnemyKind(e)||'shambler',item:e})),{depth:p.x+p.y,kind:'survivor',item:p}].sort((a,b)=>a.depth-b.depth)}
function renderStreetPrototype(){
 g.clearRect(0,0,W,H);g.fillStyle='#101e27';g.fillRect(0,0,W,H);drawStreetGround();drawStreetBossImpact();
 for(const row of streetDrawQueue()){if(row.kind==='building')drawStreetBuilding(row.item);else if(row.kind==='lamp')drawStreetLamp(row.item);else if(row.kind==='barrel')drawStreetBarrel(row.item);else if(row.kind==='defeat')drawStreetDefeat(row.item);else drawStreetActor(row.item,row.kind)}
 // Shots and hit feedback share world anchors; the height is presentation only.
 for(const b of bullets){const at=streetProject(b.x,b.y,55),tail=streetProject(b.x-b.vx*.018,b.y-b.vy*.018,55);g.strokeStyle=b.piercing?'#a6eeff':'#ffe3a5';g.lineWidth=2;g.beginPath();g.moveTo(tail.x,tail.y);g.lineTo(at.x,at.y);g.stroke()}
 for(const q of particles){const at=streetProject(q.x,q.y,8);g.globalAlpha=clamp(q.life/q.max,0,1);g.fillStyle=q.color;g.fillRect(at.x,at.y,q.r,q.r)}g.globalAlpha=1;
 if(preferences.numbers){g.font='bold 12px system-ui';g.textAlign='center';for(const t of texts){const at=streetProject(t.x,t.y,35);g.fillStyle=t.color;g.globalAlpha=clamp(t.life/.8,0,1);g.fillText(t.t,at.x,at.y)}g.globalAlpha=1}
 const vignette=g.createRadialGradient(W/2,H*.55,Math.min(W,H)*.2,W/2,H*.55,Math.max(W,H)*.8);vignette.addColorStop(0,'#07101a00');vignette.addColorStop(1,'#030a15bb');g.fillStyle=vignette;g.fillRect(0,0,W,H);
}
