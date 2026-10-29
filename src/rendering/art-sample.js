function releaseSampleArtwork(){streetCombat=freshStreetCombat();for(const row of Object.values(sampleArtwork)){if(row.image){row.image.onload=null;row.image.onerror=null}}sampleArtwork={};sampleArtworkData=null}
function sampleArtworkReady(){return ['survivor','street','enemies'].every(id=>sampleArtwork[id]?.ready)}
function refreshSampleArtwork(){
 refreshStreetMenu();if(mode!=='art-menu')return;
 const status=document.getElementById('artAssetStatus');if(status)status.textContent=sampleArtworkReady()?'Artwork ready. Choose a practice scene.':Object.values(sampleArtwork).some(row=>row.failed)?'Artwork could not load. Return to Main and reopen the sample to retry; Classic play is still available.':'Loading the detailed artwork…';
 for(const id of ['artStreet','artBreaker']){const button=document.getElementById(id);if(button)button.disabled=!sampleArtworkReady()}
 drawArtBoard();drawSurvivorDetail();
}
function ensureSampleArtwork(withIntersection=false){
 if(!sampleArtworkData){try{sampleArtworkData=JSON.parse(document.getElementById('sampleAssets').textContent)}catch{sampleArtworkData={}}}
 for(const id of (withIntersection?['survivor','street','enemies','intersection','survivorWalk','shamblerWalk','runnerRun','bruteWalk','breakerWalk','survivorAim','environment','breakerCombat']:['survivor','street','enemies'])){
  const old=sampleArtwork[id];if(old&&(old.ready||old.loading))continue;
  const row={ready:false,loading:true,failed:false,image:null,frames:sampleArtworkData[id]?.frames||[]};sampleArtwork[id]=row;
  try{const data=sampleArtworkData[id];if(!data||!/^data:image\/(?:png|webp);base64,/.test(data.src))throw Error('Missing embedded artwork');const image=new Image();row.image=image;
   image.onload=()=>{if(sampleArtwork[id]!==row)return;row.ready=image.naturalWidth>0&&image.naturalHeight>0;row.loading=false;row.failed=!row.ready;refreshSampleArtwork()};
   image.onerror=()=>{if(sampleArtwork[id]!==row)return;row.ready=false;row.loading=false;row.failed=true;refreshSampleArtwork()};image.src=data.src;
  }catch{row.loading=false;row.failed=true}
 }
 refreshSampleArtwork();
}
function drawSurvivorDetail(){
 const canvas=document.getElementById('artDetail'),row=sampleArtwork.survivor;if(!canvas||!row?.ready)return;canvas.width=640;canvas.height=240;const ctx=canvas.getContext('2d');ctx.fillStyle='#17232b';ctx.fillRect(0,0,640,240);ctx.imageSmoothingEnabled=true;
 for(let i=0;i<3;i++){const crop=row.frames[i],height=180,width=height*crop[2]/crop[3],x=110+i*210;ctx.drawImage(row.image,...crop,x-width/2,12,width,height);ctx.fillStyle='#eddab1';ctx.font='bold 12px system-ui';ctx.textAlign='center';ctx.fillText(['READY','LEFT STEP','RIGHT STEP'][i],x,222)}
}
function sampleSpriteFrame(kind,time,moving){return kind==='survivor'?(moving?1+Math.floor(time*8)%2:0):({shambler:0,runner:1,brute:2,breaker:3})[kind]}
function drawSampleSprite(ctx,e,kind,time=elapsed){
 const row=sampleArtwork[kind==='survivor'?'survivor':'enemies'];if(!row?.ready)return false;
 const player=kind==='survivor',moving=player?Math.hypot(movementInput().x,movementInput().y)>.05:e.speed>0,index=sampleSpriteFrame(kind,time,moving),crop=row.frames[index];if(!crop)return false;
 const target=player?gunTarget():p,angle=player?(target?Math.atan2(target.y-e.y,target.x-e.x):0):Math.atan2(p.y-e.y,p.x-e.x),height=e.r*(player?2.7:2.05),width=height*crop[2]/crop[3],flash=e.hit||player&&e===p&&p.inv>0&&Math.floor(performance.now()/65)%2;
 ctx.save();ctx.translate(e.x,e.y);ctx.fillStyle='#03080d88';ctx.beginPath();ctx.ellipse(2,e.r*.45,e.r*.7,e.r*.3,0,0,7);ctx.fill();ctx.rotate(angle+(player?Math.PI/2:-Math.PI/2));ctx.imageSmoothingEnabled=true;
 if(flash)ctx.globalAlpha=.55;ctx.drawImage(row.image,...crop,-width/2,-height/2,width,height);ctx.restore();return true;
}
function drawSamplePerson(ctx,e,kind,time=elapsed){if(!drawSampleSprite(ctx,e,kind,time))drawSamplePersonFallback(ctx,e,kind,time)}
function paintSampleStreet(ctx,left,top,width,height){
 const row=sampleArtwork.street;if(!row?.ready){paintSampleStreetFallback(ctx,left,top,width,height);return}
 const tile=640;ctx.save();ctx.imageSmoothingEnabled=true;for(let x=Math.floor((left+tile/2)/tile)*tile-tile/2;x<left+width;x+=tile)for(let y=Math.floor(top/tile)*tile;y<top+height;y+=tile)ctx.drawImage(row.image,x,y,tile,tile);ctx.restore();
}
function renderPlayerGun(angle){
 if(sampleLookActive()||fieldActorsActive())return;
 g.save();g.translate(p.x,p.y);g.rotate(angle);g.fillStyle='#e7c081';g.fillRect(9,-2,12,4);g.fillStyle='#233549';g.fillRect(-6,-12,12,8);g.restore();
}
// Detailed artwork remains confined to explicit, unscored practice.
function sampleLookActive(){return training&&artSession&&artLook}
function sampleEnemyKind(e){return e.bossKind==='breaker'?'breaker':!e.bossKind&&!e.spitter&&!e.riot&&!e.howler&&!e.lobber&&!e.rush&&e.type<=2?['shambler','runner','brute'][e.type]:null}
function drawSamplePersonFallback(ctx,e,kind,time=elapsed){
 const r=e.r,runner=kind==='runner',boss=kind==='breaker',player=kind==='survivor',brute=kind==='brute',moving=player?Math.hypot(movementInput().x,movementInput().y)>.05:e.speed>0,stride=moving?Math.sin(time*(runner?15:8))*r*.17:0;
 const target=player?gunTarget():p,angle=player?(target?Math.atan2(target.y-e.y,target.x-e.x):0):Math.atan2(p.y-e.y,p.x-e.x);
 ctx.save();ctx.translate(e.x,e.y);ctx.fillStyle='#03080dbb';ctx.beginPath();ctx.ellipse(3,r*.7,r*.9,r*.4,0,0,7);ctx.fill();ctx.rotate(angle+Math.PI/2);
 const flash=e.hit||player&&e===p&&p.inv>0&&Math.floor(performance.now()/65)%2;
 const coat=player?'#397e79':runner?'#b57545':brute?'#77627e':boss?'#695665':'#66795b',light=player?'#8dc9b9':runner?'#e0a164':brute?'#b4a0c2':boss?'#d2a6ac':'#a4b08b';
 // Boots, coat tails, shoulders and hands form a human silhouette inside the hit radius.
 ctx.fillStyle='#131e26';ctx.fillRect(-r*.48,r*.28+stride,r*.35,r*.52);ctx.fillRect(r*.13,r*.28-stride,r*.35,r*.52);
 ctx.fillStyle=flash?'#fff0cc':coat;ctx.beginPath();ctx.moveTo(-r*.56,-r*.35);ctx.lineTo(r*.56,-r*.35);ctx.lineTo(r*.7,r*.58);ctx.lineTo(-r*.7,r*.58);ctx.closePath();ctx.fill();
 ctx.strokeStyle='#17222a';ctx.lineWidth=Math.max(1.5,r*.1);ctx.stroke();ctx.strokeStyle=light;ctx.lineWidth=Math.max(1,r*.06);ctx.beginPath();ctx.moveTo(-r*.42,-r*.2);ctx.lineTo(-r*.34,r*.45);ctx.moveTo(r*.3,-r*.1);ctx.lineTo(r*.35,r*.4);ctx.stroke();
 ctx.fillStyle=boss?'#b99a8c':'#b4a28b';const lift=boss&&e.phase==='warn'?-r*.38:stride;
 ctx.beginPath();ctx.ellipse(-r*.72,-r*.02+lift,r*.22,r*.35,runner?-.4:0,0,7);ctx.ellipse(r*.72,-r*.02-lift,r*.22,r*.35,runner?.4:0,0,7);ctx.fill();
 ctx.fillStyle=flash?'#fff5d7':player?'#c9b99b':'#b2ac91';ctx.beginPath();ctx.ellipse(0,-r*.45,r*.35,r*.39,0,0,7);ctx.fill();ctx.fillStyle=player?'#243b3e':'#394038';ctx.beginPath();ctx.ellipse(0,-r*.66,r*.36,r*.2,0,0,7);ctx.fill();
 ctx.fillStyle=player?'#ffe4aa':'#e6cc9a';ctx.fillRect(-r*.23,-r*.46,r*.12,r*.08);ctx.fillRect(r*.11,-r*.46,r*.12,r*.08);
 if(player){ctx.fillStyle='#dfb76c';ctx.fillRect(-r*.2,r*.1,r*.4,r*.12);ctx.fillStyle='#243b3e';ctx.fillRect(-r*.44,r*.18,r*.26,r*.25)}
 if(brute||boss){ctx.strokeStyle=boss?'#dd9c91':'#b5a2c5';ctx.lineWidth=r*.1;ctx.beginPath();ctx.moveTo(-r*.45,-r*.1);ctx.lineTo(r*.45,r*.35);ctx.stroke();ctx.fillStyle='#333039';ctx.fillRect(-r*.55,-r*.25,r*.3,r*.3);ctx.fillRect(r*.25,-r*.25,r*.3,r*.3)}
 if(runner){ctx.strokeStyle='#efd2a4';ctx.lineWidth=r*.09;ctx.beginPath();ctx.moveTo(-r*.5,r*.04);ctx.lineTo(r*.47,r*.3);ctx.stroke()}
 ctx.restore();
}
function paintSampleStreetFallback(ctx,left,top,width,height){
 ctx.save();ctx.fillStyle='#182329';ctx.fillRect(left,top,width,height);
 for(let cx=Math.floor((left-240)/480)*480;cx<left+width+480;cx+=480){
  ctx.fillStyle='#222e33';ctx.fillRect(cx-130,top,260,height);ctx.fillStyle='#445052';ctx.fillRect(cx-150,top,18,height);ctx.fillRect(cx+132,top,18,height);
  for(let y=Math.floor(top/96)*96;y<top+height+96;y+=96){ctx.fillStyle='#b6a87466';ctx.fillRect(cx-2,y,4,28);ctx.strokeStyle='#798b8a22';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(cx-125,y+48);ctx.lineTo(cx+125,y+40);ctx.stroke();ctx.fillStyle='#79a2a01a';ctx.beginPath();ctx.ellipse(cx+64,y+67,38,6,-.2,0,7);ctx.fill()}
  for(let y=Math.floor(top/240)*240;y<top+height+240;y+=240)for(const side of [-1,1]){
   const x=cx+side*195-43;ctx.fillStyle='#0a1219';ctx.fillRect(x+7,y+8,86,184);ctx.fillStyle='#344149';ctx.fillRect(x,y,86,176);ctx.strokeStyle='#596466';ctx.lineWidth=2;ctx.strokeRect(x+3,y+3,80,170);ctx.fillStyle='#17252c';ctx.fillRect(x+9,y+12,68,134);
   for(let row=0;row<4;row++)for(let col=0;col<3;col++){ctx.fillStyle=(row+col)%3?'#33484c':'#bc9b6666';ctx.fillRect(x+15+col*20,y+20+row*28,11,16)}
   ctx.fillStyle='#86684e';ctx.fillRect(x+9,y+150,68,15);ctx.fillStyle='#edc183';ctx.font='bold 8px system-ui';ctx.textAlign='center';ctx.fillText(side<0?'LAST LIGHT':'AFTER HOURS',x+43,y+161);
   ctx.fillStyle='#e7b66f14';ctx.beginPath();ctx.ellipse(cx+side*105,y+191,44,21,0,0,7);ctx.fill();ctx.strokeStyle='#647174';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(cx+side*140,y+196);ctx.lineTo(cx+side*140,y+168);ctx.stroke();ctx.fillStyle='#e6bb78';ctx.fillRect(cx+side*140-6,y+165,12,4);
  }
 }
 ctx.restore();
}
function drawArtBoard(){
 const canvas=document.getElementById('artBoard');if(!canvas)return;const ctx=canvas.getContext('2d');canvas.width=640;canvas.height=300;ctx.save();ctx.translate(320,150);paintSampleStreet(ctx,-320,-150,640,300);
 const people=[['survivor',-205,22,16],['shambler',-100,25,15],['runner',0,25,11],['brute',95,25,23],['breaker',205,20,34]];
 for(const [kind,x,y,r] of people){drawSamplePerson(ctx,{x,y,r,speed:0,phase:kind==='breaker'?'warn':'approach'},kind,0);ctx.fillStyle='#f3e1b9';ctx.font='bold 11px system-ui';ctx.textAlign='center';ctx.fillText(kind.toUpperCase(),x,y+58)}ctx.restore();
}
// Optional unscored intersection. All geometry stays in native world units.
