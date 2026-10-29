const SUPPLY_TUNING=Object.freeze({first:20,interval:60,lifetime:45,heal:20});
function placeSupply(){
  const facing=Math.atan2(lastMove.y,lastMove.x),radius=clamp(Math.min(W,H)*.4,140,230);
  for(let i=0;i<32;i++){
    const angle=facing+i*2.3999632297,d=radius+(i%3)*30;
    const b={x:p.x+Math.cos(angle)*d,y:p.y+Math.sin(angle)*d,r:19,until:elapsed+SUPPLY_TUNING.lifetime};
    const blocked=obstacles.some(o=>b.x>o.x-48&&b.x<o.x+o.w+48&&b.y>o.y-48&&b.y<o.y+o.h+48);
    if(blocked||nearDrop(b,b.r+20)||nearConvoyRoute(b,b.r+20)||barrels.some(other=>!other.spent&&dist(other,b)<80)||exitBeacon&&dist(exitBeacon,b)<exitBeacon.r+70||salvage&&dist(salvage,b)<salvage.r+45||nearBarricade(b,b.r+25))continue;
    supplyCache=b;return true;
  }
  return false;
}
function updateSupplies(from){
  if(mode!=='play'||p.hp<=0)return;
  if(supplyCache&&elapsed>=supplyCache.until)supplyCache=null;
  if(supplyCache&&p.hp<p.max&&segmentDistance(supplyCache,from,p)<=supplyCache.r+p.r){
    const heal=Math.min(SUPPLY_TUNING.heal,p.max-p.hp),b=supplyCache;
    supplyCache=null;p.hp+=heal;suppliesCollected++;supplyHealing+=heal;
    floatText(b.x,b.y-35,`+${Number(heal.toFixed(1))} HP`,'#9fdcff');burst(b.x,b.y,'#9fdcff',10);sound(640,.12,'sine',.025);
    toast(`MEDICAL CACHE • +${Number(heal.toFixed(1))} HP`,1600);
  }
  if(supplyCache&&dist(supplyCache,p)>1200)supplyCache=null;
  if(!supplyCache&&elapsed>=nextSupplyAt){
    nextSupplyAt=elapsed+(placeSupply()?SUPPLY_TUNING.interval:5);
  }
}
function renderSupplies(){
  if(!supplyCache)return;const b=supplyCache;
  g.save();if(!drawFieldCase(b,'medical')){g.fillStyle='#071320';g.fillRect(b.x-20,b.y-13,40,31);
  g.strokeStyle='#9fdcff';g.lineWidth=2;g.strokeRect(b.x-20,b.y-15,40,30);
  g.fillStyle='#294f70';g.fillRect(b.x-18,b.y-13,36,26);
  g.fillStyle='#cceeff';g.fillRect(b.x-3,b.y-10,6,20);g.fillRect(b.x-10,b.y-3,20,6);
  }
  g.strokeStyle='#9fdcff70';g.lineWidth=2;g.beginPath();g.arc(b.x,b.y,b.r+10+Math.sin(elapsed*2)*2,0,Math.PI*2);g.stroke();
  g.fillStyle='#cceeff';g.font='bold 11px system-ui';g.textAlign='center';g.fillText(`MED +${SUPPLY_TUNING.heal} HP`,b.x,b.y-38);g.restore();
}
// A convoy is a harmless moving objective in the target list, never a boss/kill.
const CONVOY_TUNING=Object.freeze({first:25,interval:120,signal:3,lifetime:11,hp:180,radius:28,retry:5});
function nearConvoyRoute(a,padding=0){return !!convoy&&segmentDistance(a,convoy.a,convoy.z)<convoy.r+padding}
function convoyRoute(){
  const r=CONVOY_TUNING.radius;let fallback=null;
  for(let i=0;i<64;i++){
    const horizontal=i%4<2,forward=i%2?1:-1,half=Math.min(175,(horizontal?W:H)/2-r-22),offset=(55+Math.floor(i/8)*35)*(Math.floor(i/4)%2?1:-1);
    if(half<90||Math.abs(offset)>(horizontal?H:W)/2-r-30)continue;
    const a={x:p.x+(horizontal?-half*forward:offset),y:p.y+(horizontal?offset:-half*forward)},z={x:p.x+(horizontal?half*forward:offset),y:p.y+(horizontal?offset:half*forward)};
    if(barricades.some(b=>b.hp>0&&rectHitTime(b,a,z,r+20)!==Infinity)||barrels.some(b=>!b.spent&&segmentDistance(b,a,z)<r+b.r+20)||supplyCache&&segmentDistance(supplyCache,a,z)<r+supplyCache.r+20||supplyDrop&&segmentDistance(supplyDrop,a,z)<r+supplyDrop.r+20||rescue&&segmentDistance(rescue,a,z)<r+rescue.r+20||salvage&&segmentDistance(salvage,a,z)<r+salvage.r+20)continue;
    const overlaps=o=>rectHitTime(o,a,z,r+15)!==Infinity;
    if(!obstacles.some(overlaps))return{a,z};if(!fallback)fallback={a,z,overlaps};
  }
  if(fallback){obstacles=obstacles.filter(o=>!fallback.overlaps(o));return{a:fallback.a,z:fallback.z}}return null;
}
function leaveConvoy(){
  if(!convoy)return;const e=convoy;convoy=null;e.hp=0;enemies=enemies.filter(other=>other!==e);
}
function updateConvoy(){
  if(mode!=='play'||p.hp<=0)return;
  if(convoy){
    const e=convoy;
    if(activeBoss||bossWarned||rushPhase==='active'||rushPhase==='warning'||exitBeacon||salvage||elapsed>=e.until||dist(e,p)>1200){leaveConvoy();return}
    if(e.phase==='signal'&&elapsed>=e.readyAt){
      if(enemies.length>=239){leaveConvoy();nextConvoyAt=elapsed+CONVOY_TUNING.retry;return}
      e.phase='active';enemies.push(e);toast('CONVOY PASSING • APPROACH AND SHOOT FOR AN UPGRADE',2800);
    }
    if(e.phase==='active'){
      const t=clamp((elapsed-e.readyAt)/CONVOY_TUNING.lifetime,0,1);e.x=e.a.x+(e.z.x-e.a.x)*t;e.y=e.a.y+(e.z.y-e.a.y)*t;
    }
    return;
  }
  if(convoyRewardPending||elapsed<nextConvoyAt||activeBoss||bossWarned||rushPhase==='active'||rushPhase==='warning'||elapsed<reliefUntil||salvage||supplyDrop||exitBeacon||enemies.length>=238)return;
  const window=CONVOY_TUNING.signal+CONVOY_TUNING.lifetime;
  if(nextBossAt-elapsed<window+10||nextRushAt-elapsed<window+5||exitAt-elapsed<window+3)return;
  const route=convoyRoute();nextConvoyAt=elapsed+(route?CONVOY_TUNING.interval:CONVOY_TUNING.retry);if(!route)return;
  const hp=CONVOY_TUNING.hp*(1+elapsed/200);
  convoy={...route,x:route.a.x,y:route.a.y,r:CONVOY_TUNING.radius,hp,max:hp,convoy:true,phase:'signal',readyAt:elapsed+CONVOY_TUNING.signal,until:elapsed+window,hit:0,col:'#a8cbd3',type:6,speed:0,dmg:0};
  toast('CONVOY ROUTE • CYAN LINE • OPTIONAL INTERCEPT IN 3s',3000);sound(300,.13,'triangle',.02);
}
function hitConvoy(e,damage){
  if(mode!=='play'||p.hp<=0||e!==convoy||e.phase!=='active'||e.hp<=0)return;
  e.hp-=damage;e.hit=.08;burst(e.x,e.y,'#a8cbd3',3);floatText(e.x,e.y,Math.round(damage),'#b8f5ff');
  if(e.hp<=0){e.hp=0;convoy=null;convoyRewardPending=true;burst(e.x,e.y,'#b8f5ff',18)}
}
function resolveConvoyReward(){
  if(!convoyRewardPending||mode!=='play'||p.hp<=0)return;
  convoyRewardPending=false;convoysStopped++;recordRunEvent('convoy');bonusChoices++;bonusKinds.push('convoy');toast('CONVOY INTERCEPTED • BONUS UPGRADE',2800);sound(650,.18,'sine',.03);
}
function renderConvoyRoute(){
  if(!convoy)return;const e=convoy;g.save();g.strokeStyle='#88dfe366';g.lineWidth=2;g.setLineDash([6,9]);g.beginPath();g.moveTo(e.a.x,e.a.y);g.lineTo(e.z.x,e.z.y);g.stroke();g.setLineDash([]);
  if(e.phase==='signal'){g.strokeStyle='#a6edf4';g.beginPath();g.arc(e.a.x,e.a.y,19+Math.sin(elapsed*4)*3,0,Math.PI*2);g.stroke();g.fillStyle='#b8f5ff';g.font='bold 10px system-ui';g.textAlign='center';g.fillText('CONVOY IN '+Math.max(0,Math.ceil(e.readyAt-elapsed))+'s',e.a.x,e.a.y-30)}
  g.restore();
}
function renderConvoy(e){
  g.save();g.translate(e.x,e.y);g.rotate(Math.atan2(e.z.y-e.a.y,e.z.x-e.a.x));g.fillStyle='#07111a';for(const x of [-17,10])for(const y of [-18,13])g.fillRect(x,y,10,6);
  g.fillStyle=e.hit?'#f0ffff':'#587c89';g.fillRect(-24,-14,48,28);g.strokeStyle='#a8d9e0';g.lineWidth=2;g.strokeRect(-24,-14,48,28);g.fillStyle='#a4d9e6';g.fillRect(10,-10,9,20);g.fillStyle='#334e5d';g.fillRect(-18,-9,19,18);g.fillStyle='#e8c67a';g.fillRect(-12,-2,8,4);g.restore();
  g.fillStyle='#122330';g.fillRect(e.x-28,e.y-39,56,5);g.fillStyle='#a6edf4';g.fillRect(e.x-28,e.y-39,56*clamp(e.hp/e.max,0,1),5);g.fillStyle='#b8f5ff';g.font='bold 10px system-ui';g.textAlign='center';g.fillText('SUPPLY CONVOY',e.x,e.y-47);
}
// Optional utility drops recover earned XP; they add no health or weapon power.
