const BARRICADE_TUNING=Object.freeze({hp:90,interval:18,max:5,pressure:60});
function pointRectDistance(a,b){return Math.hypot(a.x-clamp(a.x,b.x,b.x+b.w),a.y-clamp(a.y,b.y,b.y+b.h))}
function rectHitTime(b,from,to,r){
  if(Math.max(from.x,to.x)+r<b.x||Math.min(from.x,to.x)-r>b.x+b.w||Math.max(from.y,to.y)+r<b.y||Math.min(from.y,to.y)-r>b.y+b.h)return Infinity;
  if(pointRectDistance(from,b)<=r)return 0;
  const dx=to.x-from.x,dy=to.y-from.y;let first=Infinity;
  const face=(t,value,low,high)=>{if(t>=0&&t<=1&&value>=low&&value<=high)first=Math.min(first,t)};
  if(dx>0){const t=(b.x-r-from.x)/dx;face(t,from.y+dy*t,b.y,b.y+b.h)}
  if(dx<0){const t=(b.x+b.w+r-from.x)/dx;face(t,from.y+dy*t,b.y,b.y+b.h)}
  if(dy>0){const t=(b.y-r-from.y)/dy;face(t,from.x+dx*t,b.x,b.x+b.w)}
  if(dy<0){const t=(b.y+b.h+r-from.y)/dy;face(t,from.x+dx*t,b.x,b.x+b.w)}
  for(const x of [b.x,b.x+b.w])for(const y of [b.y,b.y+b.h])first=Math.min(first,projectileHitTime({x,y},from,to,r));
  return first;
}
function firstBarricadeHit(from,to,r){
  let barrier=null,time=Infinity;
  for(const b of barricades)if(b.hp>0){const t=rectHitTime(b,from,to,r);if(t<time){time=t;barrier=b}}
  return{barrier,time};
}
function nearBarricade(a,clearance){return barricades.some(b=>b.hp>0&&pointRectDistance(a,b)<clearance)}
function barricadeNormal(a,b){
  const dx=a.x-clamp(a.x,b.x,b.x+b.w),dy=a.y-clamp(a.y,b.y,b.y+b.h),d=Math.hypot(dx,dy);
  if(d>1e-9)return{x:dx/d,y:dy/d,inside:0};
  const sides=[{x:-1,y:0,inside:a.x-b.x},{x:1,y:0,inside:b.x+b.w-a.x},{x:0,y:-1,inside:a.y-b.y},{x:0,y:1,inside:b.y+b.h-a.y}];
  return sides.reduce((best,side)=>side.inside<best.inside?side:best);
}
function resolveBarricadeBody(body,from){
  const pos={x:from.x,y:from.y},remaining={x:body.x-from.x,y:body.y-from.y},contacts=new Set();
  for(const b of barricades)if(b.hp>0&&pointRectDistance(pos,b)<body.r-1e-7){
    const n=barricadeNormal(pos,b),push=body.r-pointRectDistance(pos,b)+n.inside+.001;pos.x+=n.x*push;pos.y+=n.y*push;contacts.add(b);
  }
  for(let iteration=0;iteration<3;iteration++){
    const to={x:pos.x+remaining.x,y:pos.y+remaining.y};let barrier=null,time=Infinity;
    for(const b of barricades)if(b.hp>0){const t=rectHitTime(b,pos,to,body.r);if(t===0){const n=barricadeNormal(pos,b);if(remaining.x*n.x+remaining.y*n.y>=-1e-9)continue}if(t<time){barrier=b;time=t}}
    if(!barrier){pos.x=to.x;pos.y=to.y;break}
    contacts.add(barrier);pos.x+=remaining.x*Math.max(0,time-1e-6);pos.y+=remaining.y*Math.max(0,time-1e-6);
    const n=barricadeNormal(pos,barrier);remaining.x*=1-time;remaining.y*=1-time;const inward=Math.min(0,remaining.x*n.x+remaining.y*n.y);remaining.x-=inward*n.x;remaining.y-=inward*n.y;pos.x+=n.x*.001;pos.y+=n.y*.001;
  }
  body.x=pos.x;body.y=pos.y;return contacts;
}
const ENGINEER_TUNING=Object.freeze({fuelRadius:1.2,scrap:.6,interval:1});
function recoverScrapDash(b,source){
  if(mode!=='play'||p.hp<=0||runSurvivor!=='engineer'||!['dash','gun','barrel','fire'].includes(source)||p.dashCd<=0||elapsed+1e-8<nextScrapAt)return;
  const recovered=Math.min(ENGINEER_TUNING.scrap,p.dashCd);p.dashCd=Math.max(0,p.dashCd-recovered);nextScrapAt=elapsed+ENGINEER_TUNING.interval;scrapRefreshes++;scrapRecovered+=recovered;
  floatText(b.x+b.w/2,b.y-32,p.dashCd<=0?'SCRAPWORK • DASH READY':`SCRAPWORK • DASH -${recovered.toFixed(1)}s`,'#f0bb92');sound(510,.07,'triangle',.015);
}
function damageBarricade(b,damage,source){
  if(b.hp<=0)return false;b.hp=Math.max(0,b.hp-damage);if(b.hp>0)return false;
  if(['dash','gun','barrel','exit','fire'].includes(source))barricadesCleared++;
  recoverScrapDash(b,source);
  burst(b.x+b.w/2,b.y+b.h/2,'#c9a36e',9);floatText(b.x+b.w/2,b.y-15,'BARRICADE DOWN','#ead4ac');sound(145,.09,'triangle',.012);return true;
}
function shatterBarricades(from,to,r,source){for(const b of barricades)if(b.hp>0&&rectHitTime(b,from,to,r)!==Infinity)damageBarricade(b,b.hp,source)}
function makeBarricade(x,y,vertical=false){return{x,y,w:vertical?18:130,h:vertical?110:18,hp:BARRICADE_TUNING.hp,max:BARRICADE_TUNING.hp,pressureDamage:0}}
function seedBarricades(){
  barricades=[makeBarricade(-175,-139),makeBarricade(131,35,true)];
  obstacles=obstacles.filter(o=>!barricades.some(b=>o.x<b.x+b.w+25&&o.x+o.w>b.x-25&&o.y<b.y+b.h+25&&o.y+o.h>b.y-25));
}
function placeBarricade(){
  if(barricades.filter(b=>b.hp>0).length>=BARRICADE_TUNING.max)return false;
  for(let i=0;i<16;i++){
    const angle=rand(0,Math.PI*2),radius=rand(220,340),b=makeBarricade(p.x+Math.cos(angle)*radius,p.y+Math.sin(angle)*radius,i%2===0);
    b.x-=b.w/2;b.y-=b.h/2;
    const overlap=obstacles.some(o=>o.x<b.x+b.w+25&&o.x+o.w>b.x-25&&o.y<b.y+b.h+25&&o.y+o.h>b.y-25);
    if(overlap||convoy&&rectHitTime(b,convoy.a,convoy.z,convoy.r+20)!==Infinity||supplyDrop&&pointRectDistance(supplyDrop,b)<supplyDrop.r+25||rescue&&pointRectDistance(rescue,b)<rescue.r+25||pointRectDistance(p,b)<180||barrels.some(a=>!a.spent&&pointRectDistance(a,b)<a.r+25)||enemies.some(e=>e.hp>0&&pointRectDistance(e,b)<e.r+15)||salvage&&pointRectDistance(salvage,b)<salvage.r+30||supplyCache&&pointRectDistance(supplyCache,b)<supplyCache.r+30||exitBeacon&&pointRectDistance(exitBeacon,b)<exitBeacon.r+60||barricades.some(other=>other.hp>0&&Math.hypot(b.x+b.w/2-other.x-other.w/2,b.y+b.h/2-other.y-other.h/2)<210))continue;
    barricades.push(b);return true;
  }
  return false;
}
function updateBarricades(dt){
  if(mode!=='play')return;
  barricades=barricades.filter(b=>b.hp>0&&pointRectDistance(p,b)<1200);for(const b of barricades)b.pressureDamage=0;
  barricadeClock-=dt;if(barricadeClock<=0){barricadeClock=BARRICADE_TUNING.interval;placeBarricade()}
}
function applyPlayerBarricades(from,dashing){if(dashing)shatterBarricades(from,p,p.r,'dash');resolveBarricadeBody(p,from)}
function applyEnemyBarricades(e,from,dt,charging){
  if(charging){shatterBarricades(from,e,e.r,'boss');return}
  for(const b of resolveBarricadeBody(e,from)){const allowance=Math.max(0,BARRICADE_TUNING.pressure*dt-(b.pressureDamage||0)),damage=Math.min(e.dmg*2*dt,allowance);b.pressureDamage=(b.pressureDamage||0)+damage;damageBarricade(b,damage,'enemy')}
}
function renderBarricades(left,top){
  for(const b of barricades){
    if(b.hp<=0||b.x+b.w<left-60||b.x>left+W+60||b.y+b.h<top-60||b.y>top+H+60)continue;
    g.save();if(!drawFieldBarricade(b)){g.fillStyle='#060a10';g.fillRect(b.x+5,b.y+7,b.w,b.h);g.fillStyle='#8d714e';g.fillRect(b.x,b.y,b.w,b.h);g.strokeStyle='#ead4ac';g.lineWidth=2;g.strokeRect(b.x,b.y,b.w,b.h);g.fillStyle='#edc66f';
    if(b.w>b.h){for(let x=b.x+4;x<b.x+b.w-4;x+=20)g.fillRect(x,b.y+3,9,b.h-6)}else{for(let y=b.y+4;y<b.y+b.h-4;y+=20)g.fillRect(b.x+3,y,b.w-6,9)}
g.fillStyle='#1a202b';g.fillRect(b.x+b.w/2-16,b.y+b.h/2-3,32,6);}g.fillStyle='#f6e3bd';g.font='bold 10px system-ui';g.textAlign='center';g.fillText('BARRICADE',b.x+b.w/2,b.y-15);
    if(pointRectDistance(p,b)<210)g.fillText('DASH TO BREAK',b.x+b.w/2,b.y+b.h+17);
    if(b.hp<b.max){g.fillStyle='#171c27';g.fillRect(b.x+b.w/2-24,b.y-10,48,4);g.fillStyle='#e9ba65';g.fillRect(b.x+b.w/2-24,b.y-10,48*b.hp/b.max,4)}g.restore();
  }
}
// Teal shock drums are dash-only utility: bounded stun, no damage or XP.
