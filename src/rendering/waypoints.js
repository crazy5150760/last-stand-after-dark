function screenMarker(dx,dy){
 if(composedRunHud()){
  const wide=W>H,top=wide?Math.min(200,H*.55):H<700?Math.min(286,H*.5):315,bottom=Math.max(top,wide?H-42:H-180);
  let x=clamp(W/2+dx,45,W-45),y=clamp(H/2+dy,top,bottom);
  if(Math.hypot(x-W/2,y-H/2)<60)x=preferences.mirrored?W-45:45;
  const towardThumb=preferences.mirrored?dx>0:dx<0;if(top>=H/2-60&&Math.abs(dx)>Math.abs(dy)&&towardThumb)y=clamp(H/2+60,top,bottom);
  const utility=preferences.mirrored?20:W-118,stick=preferences.mirrored?W-153:28,dash=preferences.mirrored?28:W-110;
  const boxes=[{x:utility,y:H-252,w:98,h:44,thumb:false},{x:utility,y:H-198,w:98,h:44,thumb:false},{x:stick,y:H-155,w:125,h:125,thumb:true},{x:dash,y:H-134,w:82,h:82,thumb:false}];
  for(const box of boxes)if(x+30>box.x&&x-30<box.x+box.w&&y+18>box.y&&y-34<box.y+box.h)x=box.thumb?(preferences.mirrored?W-190:190):(preferences.mirrored?160:W-160);
  return{x,y};
 }
 const short=H<550&&W>=600,left=short?Math.min(390,W-185):45,right=short?W-145:W-45;
 const top=short?Math.min(preferences.mirrored?252:235,H-160):Math.min(275,H*.45),bottom=Math.max(top,H-185);
 return{x:preferences.mirrored?W-clamp(W/2-dx,left,right):clamp(W/2+dx,left,right),y:clamp(H/2+dy,top,bottom)};
}
function shotWarnings(){
 if(mode!=='play'||!preferences.warnings)return [];
 const candidates=[];
 for(const b of hostileShots){
  const dx=b.x-p.x,dy=b.y-p.y;if(b.life<=0||Math.abs(dx)<W/2-b.r&&Math.abs(dy)<H/2-b.r)continue;
  const horizon=Math.min(1.2,b.life),end={x:b.x+b.vx*horizon,y:b.y+b.vy*horizon};
  const t=projectileHitTime(p,b,end,p.r+b.r+14);if(t===Infinity)continue;
  candidates.push({time:t*horizon,angle:Math.atan2(dy,dx),color:b.kind==='warden'?'#9edaff':'#ff9fbd',...screenMarker(dx,dy)});
 }
 candidates.sort((a,b)=>a.time-b.time);const marks=[];
 for(const mark of candidates){if(marks.every(other=>Math.abs(Math.atan2(Math.sin(mark.angle-other.angle),Math.cos(mark.angle-other.angle)))>.18))marks.push(mark);if(marks.length===3)break}
 return marks;
}
function renderShotWarnings(){
 for(const mark of shotWarnings()){
  g.save();g.translate(mark.x,mark.y);g.strokeStyle=mark.color;g.fillStyle='#0b1325ee';g.lineWidth=2;g.beginPath();g.arc(0,0,13,0,Math.PI*2);g.fill();g.stroke();g.fillStyle=mark.color;g.font='bold 16px system-ui';g.textAlign='center';g.fillText('!',0,6);g.font='bold 9px system-ui';g.fillText('SHOT',0,-18);g.restore();
 }
}
function objectiveTargets(){
 return [exitBeacon&&{...exitBeacon,id:'exit',label:'EXIT',color:'#a7ffda'},rescue&&!rescue.following&&{...rescue,id:'rescue',label:'SURVIVOR',color:'#e9ffff'},salvage&&{...salvage,id:'salvage',label:'SALVAGE',color:'#ffdb8d'},supplyDrop&&{...supplyDrop,id:'drop',label:'DROP',color:'#d5b6ff'},convoy&&{...convoy,id:'convoy',label:'CONVOY',color:'#9ee8f0'},patrolTarget()&&{...patrolTarget(),id:'patrol',label:'PATROL '+patrolTarget().number,color:'#84d7ff'},locker&&{...locker,id:'locker',label:'LOCKER',color:'#c9f9df'},supplyCache&&p.hp<p.max&&{...supplyCache,id:'medical',label:'MEDICAL',color:'#9fdcff'}].filter(Boolean);
}
function selectObjective(id){if(mode!=='paused'||id!=='auto'&&!objectiveTargets().some(t=>t.id===id))return;objectiveFocus=id;document.getElementById('objectivePick').value=id}
function objectivePicker(){return `<div class="contract-picker"><label for="objectivePick">OBJECTIVE POINTER</label><select id="objectivePick"><option value="auto">Automatic priority</option>${objectiveTargets().map(t=>`<option value="${t.id}">${t.label} · ${Math.round(dist(t,p))} units away</option>`).join('')}</select><p class="muted">Choose a currently active goal. Automatic prioritizes EXIT. Expired or collected goals return to Automatic. ${preferences.waypoints?'':'Pointer is OFF in Settings.'}</p></div>`}
function objectiveWaypoint(){
  if(mode!=='play'||!preferences.waypoints)return null;
  const targets=objectiveTargets(),target=targets.find(t=>t.id===objectiveFocus)||targets[0];
  if(!target)return null;const dx=target.x-p.x,dy=target.y-p.y;
  if(Math.abs(dx)<W/2-35&&Math.abs(dy)<H/2-45)return null;
  return{label:target.label,color:target.color,...screenMarker(dx,dy),angle:Math.atan2(dy,dx)};
}
function renderWaypoint(){
  const mark=objectiveWaypoint();if(!mark)return;
  g.save();g.translate(mark.x,mark.y);g.fillStyle='#0b1325dd';g.beginPath();g.arc(0,0,18,0,Math.PI*2);g.fill();g.fillStyle=mark.color;g.save();g.rotate(mark.angle);g.beginPath();g.moveTo(11,0);g.lineTo(-6,-7);g.lineTo(-2,0);g.lineTo(-6,7);g.closePath();g.fill();g.restore();g.font='bold 10px system-ui';g.textAlign='center';g.fillText(mark.label,0,-24);g.restore();
}
