function freshFieldCombat(){return{reactions:new WeakMap(),dead:new WeakSet(),hits:[],defeats:[],shot:null}}
function fieldCombatKind(e){return fieldEnemyKind(e)||fieldBreakerActive(e)&&'breaker'||fieldWardenActive(e)&&'warden'||fieldHarvesterActive(e)&&'harvester'||fieldRiotActive(e)&&'riot'||fieldSpitterActive(e)&&'spitter'||fieldHowlerActive(e)&&'howler'||fieldLobberActive(e)&&'lobber'||fieldHunterActive(e)&&'hunter'}
function fieldCombatVisible(e,margin=80){return e.x>=p.x-W/2-margin&&e.x<=p.x+W/2+margin&&e.y>=p.y-H/2-margin&&e.y<=p.y+H/2+margin}
function noteFieldShot(target){
 if(!fieldActorsActive()||preferences.reduced||mode!=='play'||runLogged)return;const dx=target.x-p.x,dy=target.y-p.y,n=Math.hypot(dx,dy)||1,direction=((Math.round(Math.atan2(dy,dx)/(Math.PI/4))%8)+8)%8;
 fieldArt.combat.shot={at:elapsed,dx:dx/n,dy:dy/n,row:FIELD_ACTOR_ROWS[direction],flip:FIELD_ACTOR_FLIPS[direction]};
}
function fieldShotVisual(){const shot=fieldArt.combat.shot,age=shot?elapsed-shot.at:Infinity,active=!preferences.reduced&&age>=0&&age<.12;return{...(shot||{}),active,flash:active&&age<.055,recoil:active?Math.sin(age/.12*Math.PI)*.75:0}}
function fieldDefeatPose(e,kind){
 const m=fieldArt.motion.get(e);if(m?.pose)return{pose:{...m.pose},flip:m.flip};
 if(['shambler','runner','brute'].includes(kind)){const direction=streetHeading(p.x-e.x,p.y-e.y,0);return{pose:{asset:STREET_ENEMY_GAITS[kind].asset,frame:FIELD_ACTOR_ROWS[direction]*4},flip:FIELD_ACTOR_FLIPS[direction]}}
 const get={breaker:fieldBreakerPose,warden:fieldWardenPose,harvester:fieldHarvesterPose,riot:fieldRiotPose,spitter:fieldSpitterPose,howler:fieldHowlerPose,lobber:fieldLobberPose,hunter:fieldHunterPose}[kind],k=get?.(e);return k?{pose:{...k.pose},flip:k.flip}:null;
}
function noteFieldHit(e,damage,source){
 if(!fieldActorsActive()||preferences.reduced||mode!=='play'||runLogged||e.convoy||!fieldCombatVisible(e))return;const kind=fieldCombatKind(e);if(!kind)return;
 const c=fieldArt.combat,dx=e.x-p.x,dy=e.y-p.y,n=Math.hypot(dx,dy)||1,old=c.reactions.get(e),color={LIGHTNING:'#a5edff',BLADES:'#d9c3ff',FIRE:'#ffc68b',BLAST:'#ffdc9b'}[source]||'#ffe1ad';
 if(!old||elapsed-old.at>=.09){c.reactions.set(e,{at:elapsed,dx:dx/n,dy:dy/n});c.hits.push({x:e.x,y:e.y+e.r*.6-FIELD_ACTOR_HEIGHTS[kind]*.55,at:elapsed,dx:dx/n,dy:dy/n,color});if(c.hits.length>24)c.hits.shift()}
 if(damage<e.hp)return;const snapshot=fieldDefeatPose(e,kind);if(!snapshot)return;c.dead.add(e);c.defeats.push({x:e.x,y:e.y,r:e.r,kind,...snapshot,at:elapsed,duration:['breaker','warden','harvester'].includes(kind)?.5:.42,fall:dx<0?-1:1});if(c.defeats.length>12)c.defeats.shift();
}
function advanceFieldCombat(){
 const c=fieldArt.combat;if(preferences.reduced){c.hits=[];c.defeats=[];c.shot=null;return}c.hits=c.hits.filter(h=>elapsed>=h.at&&elapsed-h.at<.14);c.defeats=c.defeats.filter(d=>elapsed>=d.at&&elapsed-d.at<d.duration);if(c.shot&&elapsed-c.shot.at>=.12)c.shot=null;
}
function fieldDefeatWanted(kind){
 if(preferences.reduced||runLogged)return false;
 if(['breaker','warden','harvester'].includes(kind)&&(activeBoss?.hp>0&&activeBoss.bossKind!==kind||!activeBoss&&bossWarned&&nextBossKind()!==kind))return false;
 return fieldArt.combat.defeats.some(d=>d.kind===kind&&elapsed>=d.at&&elapsed-d.at<d.duration);
}
function fieldReaction(e,kind){const hit=fieldArt.combat.reactions.get(e),t=hit?(elapsed-hit.at)/.18:1,strength=['breaker','warden','harvester'].includes(kind)?.3:kind==='brute'?.7:1;return !preferences.reduced&&t>=0&&t<1?-hit.dx*Math.sin(t*Math.PI)*.04*strength:0}
function renderFieldDefeats(){
 if(!fieldActorsActive()||preferences.reduced)return;
 for(const body of fieldArt.combat.defeats){const t=(elapsed-body.at)/body.duration;if(t<0||t>=1||!fieldCombatVisible(body,100))continue;const info=fieldPoseInfo({...body.pose,flip:body.flip},body.kind);if(!info.image||!info.crop||!info.pivot)continue;
  const ease=Math.min(1,t/.7),boss=['breaker','warden','harvester'].includes(body.kind);g.save();g.translate(body.x,body.y+body.r*.6);g.rotate(body.fall*ease*(boss?.3:.75));g.scale(1,1-ease*(boss?.45:.65));drawFieldLayers(g,[{...info,weight:1}],1-Math.pow(t,1.35));g.restore();
 }
}
function renderFieldImpacts(){
 if(!fieldActorsActive()||preferences.reduced)return;
 for(const hit of fieldArt.combat.hits){const age=elapsed-hit.at;if(age<0||age>=.14||!fieldCombatVisible(hit,30))continue;const t=age/.14,angle=Math.atan2(hit.dy,hit.dx);g.save();g.translate(hit.x,hit.y);g.globalAlpha=(1-t)*.8;g.strokeStyle=hit.color;g.lineWidth=1.3;g.beginPath();for(const offset of [-1.1,-.35,.35,1.1]){const a=angle+offset,r=2+t*4;g.moveTo(Math.cos(a)*r,Math.sin(a)*r);g.lineTo(Math.cos(a)*(r+3),Math.sin(a)*(r+3))}g.stroke();g.restore();
 }
}

// Street dressing is world-anchored drawing only: no RNG, colliders or raster cache.
