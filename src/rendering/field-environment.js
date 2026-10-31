const FIELD_WORLD_PALETTES=Object.freeze({downtown:{floor:'#222b31',road:'#141d24',edge:'#526063',paint:'#aaa58a55',accent:'#81bcc5',warm:'#c99862'},freight:{floor:'#252c2c',road:'#1c2428',edge:'#62645b',paint:'#a29c7155',accent:'#9ba999',warm:'#b88b59'},riverside:{floor:'#202d32',road:'#17262e',edge:'#59757c',paint:'#99ada455',accent:'#82bbca',warm:'#c4a675'},park:{floor:'#202f29',road:'#39413b',edge:'#687669',paint:'#b5b5a355',accent:'#8daa8b',warm:'#b2a178'},market:{floor:'#2b2e31',road:'#1d252b',edge:'#6c6e67',paint:'#c4b79d55',accent:'#9bbbbb',warm:'#c49b72'}});
let fieldWorldCache=freshFieldWorldCache();
let downtownPilotArt=null;
function releaseDowntownPilot(){if(downtownPilotArt?.image){downtownPilotArt.image.onload=null;downtownPilotArt.image.onerror=null}downtownPilotArt=null}
function ensureDowntownPilot(){
 if(!(mainPerfTest?.pilot||mainPerfTest?.shopfront&&mainPerfTest.dressed)||downtownPilotArt)return;
 try{
  const meta=JSON.parse(document.getElementById('sampleAssets').textContent).environment;
  if(!meta||!/^data:image\/(?:png|webp);base64,/.test(meta.src)||meta.width!==1536||meta.height!==1024||meta.frames?.length!==6||meta.width*meta.height*4>7*1024*1024)throw Error('Pilot atlas');
  const row={image:new Image(),frames:meta.frames,ready:false,failed:false};downtownPilotArt=row;
  row.image.onload=()=>{if(downtownPilotArt!==row)return;row.ready=row.image.naturalWidth===meta.width&&row.image.naturalHeight===meta.height;row.failed=!row.ready;row.image.onload=null;row.image.onerror=null};
  row.image.onerror=()=>{if(downtownPilotArt!==row)return;row.failed=true;row.image.onload=null;row.image.onerror=null};row.image.src=meta.src;
 }catch{downtownPilotArt={failed:true}}
}
function drawDowntownPilot(tiles){
 if(!(mainPerfTest?.pilot||mainPerfTest?.shopfront&&mainPerfTest.dressed)||!downtownPilotArt?.ready||preferences.reduced)return;
 const row=downtownPilotArt;g.save();g.globalAlpha=.32;
 for(const tile of tiles){const x=tile.x,y=tile.y,roadX=Math.abs(((x+100)%400+400)%400-200)<72,roadY=Math.abs(((y+110)%400+400)%400-200)<72,crop=row.frames[roadX||roadY?0:1];g.drawImage(row.image,...crop,x,y,160,160)}
 g.restore();if(mainPerfTest.pilot){const glow=g.createRadialGradient(-205,-185,8,-205,-185,125);glow.addColorStop(0,'#d9a46b44');glow.addColorStop(1,'#d9a46b00');g.fillStyle=glow;g.fillRect(-330,-310,250,250)}
}
function freshFieldWorldCache(){return{key:'',tiles:[]}}
function releaseFieldWorld(){fieldWorldCache=freshFieldWorldCache()}
function fieldWorldActive(){return (!training||!!mainPerfTest)&&!artSession&&!streetSession&&preferences.scenery==='street'}
function fieldWorldHash(x,y,salt=0){let n=Math.imul(x|0,374761393)^Math.imul(y|0,668265263)^Math.imul(salt|0,1274126177);n=Math.imul(n^(n>>>13),1274126177);return(n^(n>>>16))>>>0}
function fieldWorldTiles(left,top){
 const x0=Math.floor(left/160)-1,y0=Math.floor(top/160)-1,nx=Math.min(16,Math.ceil(W/160)+3),ny=Math.min(16,Math.ceil(H/160)+3),key=[runRoute,x0,y0,nx,ny,preferences.reduced].join('|');
 if(fieldWorldCache.key===key)return fieldWorldCache.tiles;const tiles=[];for(let y=0;y<ny;y++)for(let x=0;x<nx;x++)tiles.push({x:(x0+x)*160,y:(y0+y)*160,seed:fieldWorldHash(x0+x,y0+y,23)});fieldWorldCache={key,tiles};return tiles;
}
function fieldWorldStatus(){const style=preferences.scenery==='street'?'Street materials':'Classic ground';if(mode==='menu'||mode==='settings'&&settingsReturn==='menu')return 'Menus · next-run setting: '+style;return mainPerfTest?'Performance test · '+style+(preferences.reduced?' · reduced decoration':''):streetSession?'Street Prototype · its own scenery comparison':artSession?'Art sample · its own street plate':training?'Training · Classic ground':runLogged?'Held results · next-run setting: '+style:style+(preferences.reduced?' · reduced decoration':'')}
function fieldWorldStylePicker(){return `<div class="contract-picker"><label for="fieldWorldStyle">WORLD SCENERY · ${mainPerfTest?'PERFORMANCE TEST':'NORMAL RUNS'}</label><select id="fieldWorldStyle"><option value="street">Street · worn materials and lights</option><option value="classic">Classic · original ground</option></select><p class="muted">${mainPerfTest?'This test uses the main-game scenery; changes are temporary.':'Street surfaces and route details use the same overhead camera and escape paths. Practice keeps its own scenery.'}</p></div>`}
function selectFieldWorld(style){
 if(!['paused','settings'].includes(mode)||document.hidden||!['street','classic'].includes(style))return;
 if(preferences.scenery!==style){preferences.scenery=style;releaseFieldWorld();if(!training&&!runLogged&&(mode==='paused'||settingsReturn==='paused'))diagnostics=freshPerformance(diagnostics.enabled);savePreferences()}
 if(mode==='settings')renderSettings();else{mode='play';pause()}
}
function fieldWorldPauseControl(){return `<button class="btn secondary" id="fieldWorldCompare">SHOW ${preferences.scenery==='street'?'CLASSIC':'STREET'} SCENERY</button><p class="muted">Scenery comparison keeps your run paused. Performance samples reset when the scenery changes.</p>`}
function drawFieldWorldRoads(left,top,palette){
 const right=left+W,bottom=top+H,period=400,half=72;
 for(let axis=0;axis<2;axis++){
  const low=axis?top:left,high=axis?bottom:right,offset=axis?170:180;
  for(let n=Math.floor((low-offset-100)/period),count=0;n*period+offset<high+100&&count<32;n++,count++){
   const center=n*period+offset;g.fillStyle=palette.road;if(axis)g.fillRect(left,center-half,W,half*2);else g.fillRect(center-half,top,half*2,H);
   g.fillStyle=palette.edge;g.globalAlpha=.38;for(const side of [-1,1]){const edge=center+side*(half+2);if(axis)g.fillRect(left,edge,W,2);else g.fillRect(edge,top,2,H)}g.globalAlpha=1;
   g.strokeStyle='#0b141b';g.lineWidth=2;g.beginPath();for(const side of [-1,1]){const edge=center+side*(half+5);if(axis){g.moveTo(left,edge);g.lineTo(right,edge)}else{g.moveTo(edge,top);g.lineTo(edge,bottom)}}g.stroke();
   // Weathered dashes avoid the wider crosswalk region of perpendicular roads.
   g.fillStyle=palette.paint;const otherLow=axis?left:top,otherHigh=axis?right:bottom,otherOffset=axis?180:170;
   for(let q=Math.floor(otherLow/64)*64,marks=0;q<otherHigh&&marks<96;q+=64,marks++){const d=((q-otherOffset)%400+400)%400;if(d<110||d>290)continue;if(axis)g.fillRect(q,center-1,22,2);else g.fillRect(center-1,q,2,22)}
  }
 }
 // Five worn bars per crossing arm; fixed world anchors never drift with camera.
 g.fillStyle=palette.paint;
 for(let x=Math.floor((left-180-140)/400)*400+180,cols=0;x<right+140&&cols<16;x+=400,cols++)for(let y=Math.floor((top-170-140)/400)*400+170,rows=0;y<bottom+140&&rows<16;y+=400,rows++){
  for(let i=-2;i<=2;i++){const step=i*21;g.fillRect(x+step-6,y-102,12,22);g.fillRect(x+step-6,y+80,12,22);g.fillRect(x-102,y+step-6,22,12);g.fillRect(x+80,y+step-6,22,12)}
  g.strokeStyle='#80929438';g.lineWidth=1;g.beginPath();g.arc(x+43,y-39,13,0,Math.PI*2);g.stroke();g.fillStyle='#101b23';g.fillRect(x+35,y-42,17,6);g.fillStyle=palette.paint;
 }
}
function drawFieldWorldRoute(left,top,palette){
 if(runRoute==='downtown'){drawFieldWorldRoads(left,top,palette);return}
 if(runRoute==='freight'){
  for(let x=Math.floor((left-145)/320)*320+125,cols=0;x<left+W+40&&cols<24;x+=320,cols++){
   g.fillStyle='#111b2080';g.fillRect(x-10,top,36,H);g.fillStyle='#66675b55';for(let y=Math.floor(top/36)*36,rows=0;y<top+H&&rows<96;y+=36,rows++)g.fillRect(x-8,y,33,5);
   g.strokeStyle='#9b9d8e88';g.lineWidth=2;g.beginPath();g.moveTo(x,top);g.lineTo(x,top+H);g.moveTo(x+17,top);g.lineTo(x+17,top+H);g.stroke();
  }
 }else if(runRoute==='park'){
  for(let y=Math.floor((top-145)/300)*300+145,rows=0;y<top+H+55&&rows<24;y+=300,rows++){g.fillStyle=palette.road;g.fillRect(left,y-36,W,72);g.strokeStyle='#8b938647';g.lineWidth=2;g.beginPath();g.moveTo(left,y-35);g.lineTo(left+W,y-35);g.moveTo(left,y+35);g.lineTo(left+W,y+35);g.stroke()}
  g.strokeStyle='#80907c55';g.lineWidth=2;for(const r of [180,205]){g.beginPath();g.arc(0,0,r,0,Math.PI*2);g.stroke()}
 }else if(runRoute==='riverside'){
  for(let x=Math.floor((left-150)/340)*340+150,cols=0;x<left+W+45&&cols<24;x+=340,cols++){g.fillStyle='#38565f66';g.fillRect(x-17,top,34,H);g.strokeStyle='#86a5a655';g.lineWidth=2;g.beginPath();g.moveTo(x-18,top);g.lineTo(x-18,top+H);g.moveTo(x+18,top);g.lineTo(x+18,top+H);g.stroke();g.strokeStyle='#14252d';g.lineWidth=1;g.beginPath();for(let y=Math.floor(top/32)*32,rows=0;y<top+H&&rows<100;y+=32,rows++){g.moveTo(x-15,y);g.lineTo(x+15,y)}g.stroke()}
 }else{
  for(let y=Math.floor((top-125)/260)*260+125,rows=0;y<top+H+45&&rows<24;y+=260,rows++){g.fillStyle=palette.road;g.fillRect(left,y-42,W,84);g.strokeStyle='#a4947855';g.lineWidth=2;g.beginPath();g.moveTo(left,y-42);g.lineTo(left+W,y-42);g.moveTo(left,y+42);g.lineTo(left+W,y+42);g.stroke()}
 }
}
// Flat route wear stays decorative, world anchored and below wet ground/combat.
function drawFieldRouteDressing(left,top,tiles){
 if(!fieldWorldActive()||preferences.reduced)return false;g.save();let drawn=0;
 for(const tile of tiles){const h=tile.seed,x=tile.x+28+h%100,y=tile.y+28+(h>>>9)%100;if(h%3||x<left-35||x>left+W+35||y<top-35||y>top+H+35||drawn>=24)continue;drawn++;g.save();g.translate(x,y);
  if(runRoute==='downtown'){
   g.fillStyle='#131f2588';g.fillRect(-19,-13,38,26);g.strokeStyle='#88918a66';g.lineWidth=1;g.strokeRect(-18,-12,36,24);g.strokeStyle='#050e18b0';g.lineWidth=2;g.beginPath();for(let i=-12;i<=12;i+=6){g.moveTo(i,-8);g.lineTo(i,8)}g.stroke();g.fillStyle='#b8b59b66';g.fillRect(-16,-10,3,2);g.fillRect(13,8,3,2);
  }else if(runRoute==='freight'){
   g.strokeStyle='#c4ad704d';g.lineWidth=2;g.beginPath();g.moveTo(-24,-11);g.lineTo(-24,11);g.lineTo(-13,11);g.moveTo(24,11);g.lineTo(24,-11);g.lineTo(13,-11);g.stroke();g.fillStyle='#b6b19a66';g.font='bold 13px system-ui';g.textAlign='center';g.fillText('0'+(1+h%9),0,5);g.strokeStyle='#96866a44';g.lineWidth=3;g.beginPath();g.moveTo(-22,18);g.lineTo(-7,12);g.moveTo(3,18);g.lineTo(18,12);g.stroke();
  }else if(runRoute==='riverside'){
   g.strokeStyle='#819b9c44';g.lineWidth=1;g.beginPath();for(let i=-1;i<=1;i++){g.moveTo(-22,i*10);g.lineTo(22,i*10)}g.moveTo(-7,-16);g.lineTo(-7,16);g.moveTo(13,-16);g.lineTo(13,16);g.stroke();g.strokeStyle='#617b4c66';g.lineWidth=3;g.beginPath();g.moveTo(-19,-8);g.lineTo(-8,-8);g.moveTo(12,2);g.lineTo(20,2);g.moveTo(-5,9);g.lineTo(7,9);g.stroke();
  }else if(runRoute==='park'){
   for(let i=0;i<5;i++){const q=fieldWorldHash(h,i,97);g.fillStyle=i%2?'#9c855459':'#62764b66';g.beginPath();g.ellipse(q%39-19,(q>>>7)%27-13,2+q%2,4,(q%10)*.3,0,Math.PI*2);g.fill()}g.strokeStyle='#524b38aa';g.lineWidth=1;g.beginPath();g.moveTo(-13,13);g.lineTo(7,-3);g.lineTo(14,-4);g.stroke();
  }else{
   g.fillStyle='#665b484d';g.fillRect(-21,-12,36,23);g.strokeStyle='#b1a58b55';g.lineWidth=1;g.beginPath();for(let i=-8;i<8;i+=5){g.moveTo(-18,i);g.lineTo(12,i)}g.stroke();g.fillStyle='#bcb59a70';g.beginPath();g.moveTo(12,8);g.lineTo(22,5);g.lineTo(25,15);g.lineTo(17,19);g.closePath();g.fill();g.strokeStyle='#5d5b4a';g.lineWidth=1;g.beginPath();g.moveTo(17,9);g.lineTo(21,9);g.stroke();
  }
  g.strokeStyle='#07111866';g.lineWidth=2;g.beginPath();g.moveTo(-30,23);g.quadraticCurveTo(-5,30,29,18);g.moveTo(-27,27);g.quadraticCurveTo(-2,34,32,22);g.stroke();g.restore();
 }
 if(runRoute==='downtown')drawFieldRoadStencils(left,top);g.restore();return true;
}
function drawFieldRoadStencils(left,top){
 g.save();g.fillStyle='#b0aa8b55';g.font='bold 12px system-ui';g.textAlign='center';let marks=0;for(let x=Math.floor((left-180)/400)*400+180;x<left+W+80&&marks<16;x+=400)for(let y=Math.floor((top-30)/400)*400+30;y<top+H+30&&marks<16;y+=400){if(x-42<left-30||x-42>left+W+30||y<top-30)continue;g.save();g.translate(x-42,y);g.rotate(-Math.PI/2);g.fillText('SLOW',0,0);g.restore();marks++}g.restore();
}

// World-anchored wet surfaces and rain use simulation time, never gameplay RNG.
function drawFieldWetPatch(x,y,seed,palette){
 const rx=34+seed%24,ry=9+(seed>>>5)%9;g.save();g.translate(x,y);g.rotate((seed%9-4)*.035);const water=g.createLinearGradient(0,-ry,0,ry);water.addColorStop(0,'#0b1922b8');water.addColorStop(.55,'#172f3b99');water.addColorStop(1,'#45616a47');g.fillStyle=water;g.beginPath();g.moveTo(-rx*.96,-ry*.2);g.bezierCurveTo(-rx*.85,-ry*1.1,-rx*.35,-ry*.65,-rx*.08,-ry*.9);g.bezierCurveTo(rx*.25,-ry*1.15,rx*.5,-ry*.5,rx*.84,-ry*.55);g.bezierCurveTo(rx*1.1,-ry*.3,rx*.95,ry*.4,rx*.63,ry*.58);g.bezierCurveTo(rx*.38,ry*1.12,rx*.1,ry*.65,-rx*.24,ry*.9);g.bezierCurveTo(-rx*.53,ry*1.1,-rx*1.1,ry*.45,-rx*.96,-ry*.2);g.closePath();g.fill();
 g.strokeStyle=palette.accent+'28';g.lineWidth=.8;g.beginPath();g.moveTo(-rx*.8,ry*.3);g.quadraticCurveTo(-rx*.15,ry*.96,rx*.4,ry*.57);g.moveTo(-rx*.3,-ry*.6);g.lineTo(rx*.25,-ry*.72);g.stroke();
 const rawPhase=(elapsed*.55+(seed%31)/31)%1,phase=rawPhase<0?rawPhase+1:rawPhase;g.globalAlpha=(1-phase)*.6;g.strokeStyle='#a1c0c04d';g.lineWidth=.75;g.beginPath();g.ellipse((seed%13)-6,1,2+phase*8,1+phase*2.5,0,0,Math.PI*2);g.stroke();g.restore();
}
function drawFieldWetReflection(x,y,color){
 const seed=fieldWorldHash(Math.round(x),Math.round(y),79);g.save();g.strokeStyle=color+'35';g.lineWidth=1;g.beginPath();for(let i=0;i<5;i++){const y0=y+7+i*5,half=17-i*2,offset=((seed>>>(i*3))%5)-2;g.moveTo(x-half+offset,y0);g.lineTo(x-3+offset,y0+.5);g.moveTo(x+1+offset,y0);g.lineTo(x+half+offset,y0-.5)}g.stroke();g.restore();
}
function drawFieldRain(tiles,left,top){
 if(preferences.reduced)return;g.save();g.strokeStyle='#9abac221';g.lineWidth=.7;g.beginPath();for(const tile of tiles){if(tile.x+180<left||tile.x>left+W+5||tile.y+180<top||tile.y>top+H+5)continue;for(let i=0;i<2;i++){const h=fieldWorldHash(tile.seed,i,83),phase=(elapsed*145+(h>>>8)%160)%160,x=tile.x+h%145+phase*.08,y=tile.y+phase;g.moveTo(x-1.5,y-6);g.lineTo(x,y)}}g.stroke();g.restore();
}

function drawFieldWorldGround(left,top){
 if(!fieldWorldActive())return false;const palette=FIELD_WORLD_PALETTES[runRoute]||FIELD_WORLD_PALETTES.downtown,tiles=fieldWorldTiles(left,top);g.save();g.fillStyle=palette.floor;g.fillRect(left-5,top-5,W+10,H+10);drawFieldWorldRoute(left,top,palette);drawDowntownPilot(tiles);drawFieldRouteDressing(left,top,tiles);
 if(!preferences.reduced){
  // Material grain is batched in one path; no bitmap allocation or random calls.
  g.fillStyle='#a8b6b30c';g.beginPath();for(const tile of tiles)for(let i=0;i<9;i++){const h=fieldWorldHash(tile.seed,i,31);g.rect(tile.x+(h%157),tile.y+((h>>>8)%157),1+(h%2),1)}g.fill();
  g.strokeStyle='#080f1780';g.lineWidth=1;g.beginPath();for(const tile of tiles){const h=tile.seed,x=tile.x+22+h%80,y=tile.y+20+(h>>>7)%90;g.moveTo(x,y);g.lineTo(x+13,y+5);g.lineTo(x+17,y+19);g.moveTo(x+13,y+5);g.lineTo(x+29,y+2)}g.stroke();
 }
 for(const tile of tiles){const h=tile.seed,x=tile.x+30+h%85,y=tile.y+30+(h>>>10)%90;if(x<left-50||x>left+W+50||y<top-25||y>top+H+25)continue;
  if(!preferences.reduced&&h%4===0){drawFieldWetPatch(x,y,h,palette)}else if(h%4===0){g.fillStyle='#07141a55';g.beginPath();g.ellipse(x,y,21+h%18,5+(h>>>5)%5,(h%11)/10,0,Math.PI*2);g.fill();if(!preferences.reduced){g.strokeStyle='#91bdc522';g.lineWidth=1;g.beginPath();g.moveTo(x-13,y);g.lineTo(x+11,y+1);g.stroke()}}
  if(h%7===0){g.fillStyle='#101a20';g.fillRect(x-9,y-5,18,10);g.strokeStyle='#64797b66';g.lineWidth=1;g.strokeRect(x-9,y-5,18,10);g.fillStyle='#63727388';for(let i=-5;i<=5;i+=5)g.fillRect(x+i,y-3,1,6)}
  if(!preferences.reduced&&h%3===0){g.fillStyle='#a2a28b44';g.fillRect(x+17,y+12,3,2);g.fillRect(x+21,y+15,2,3)}
 }
 drawFieldRain(tiles,left,top);g.restore();return true;
}
function drawFieldWorldLight(x,y,color){if(preferences.reduced)return;const halo=g.createRadialGradient(x,y,0,x,y,42);halo.addColorStop(0,color+'22');halo.addColorStop(1,color+'00');g.fillStyle=halo;g.fillRect(x-42,y-42,84,84);drawFieldWetReflection(x,y,color)}
function drawFieldWorldStructure(o){
 if(!fieldWorldActive()||![0,1,2,3,4,5].includes(o.type)||!(o.w>0&&o.h>0))return false;
 const palette=FIELD_WORLD_PALETTES[runRoute]||FIELD_WORLD_PALETTES.downtown,h=fieldWorldHash(Math.round(o.x),Math.round(o.y),o.type),x=o.x,y=o.y,w=o.w,Hh=o.h;g.save();
 // Existing decorative footprints remain flat/passable; actors and warnings draw later.
 g.fillStyle='#050c124d';g.fillRect(x+5,y+6,w,Hh);
 if(o.type===3){
  g.fillStyle='#414b42';g.fillRect(x,y,w,Hh);g.fillStyle='#243b2e';g.fillRect(x+4,y+4,w-8,Hh-8);g.strokeStyle='#7a8d7466';g.lineWidth=2;g.strokeRect(x+2,y+2,w-4,Hh-4);for(let i=0;i<7;i++){const q=fieldWorldHash(h,i,9);g.fillStyle=i%2?'#47624b':'#36553f';g.beginPath();g.ellipse(x+12+q%Math.max(1,w-24),y+12+(q>>>8)%Math.max(1,Hh-24),8+q%7,6+q%5,(q%6)/3,0,Math.PI*2);g.fill()}g.fillStyle='#8b998247';g.fillRect(x+9,y+8,10,2);
 }else if(o.type===4){
  const cx=x+w/2,cy=y+Hh/2,r=Math.min(w,Hh)/2;g.fillStyle='#4d6464';g.beginPath();g.arc(cx,cy,r,0,Math.PI*2);g.fill();g.fillStyle='#183b47';g.beginPath();g.arc(cx,cy,r-8,0,Math.PI*2);g.fill();g.strokeStyle='#91b7b65c';g.lineWidth=2;for(const n of [r-12,r-24]){g.beginPath();g.arc(cx,cy,n,0,Math.PI*2);g.stroke()}g.fillStyle='#667e7b';g.beginPath();g.arc(cx,cy,13,0,Math.PI*2);g.fill();
 }else if(o.type===2){
  g.fillStyle=h%2?'#34454b':'#3b4847';g.fillRect(x,y,w,Hh);g.strokeStyle='#7c8b8480';g.lineWidth=2;g.strokeRect(x+1,y+1,w-2,Hh-2);g.strokeStyle='#142831';g.lineWidth=2;g.beginPath();for(let n=10,count=0;n<w-4&&count<32;n+=12,count++){g.moveTo(x+n,y+5);g.lineTo(x+n,y+Hh-5)}g.stroke();g.fillStyle='#a4a49155';g.fillRect(x+12,y+8,26,5);g.fillStyle='#9b704f66';g.fillRect(x+w-24,y+Hh-10,18,3);g.strokeStyle='#97a6a066';g.lineWidth=1;g.strokeRect(x+w-37,y+8,25,Hh-16);
 }else if(o.type===5){
  g.fillStyle='#333e42';g.fillRect(x,y,w,Hh);g.strokeStyle='#687876';g.lineWidth=2;g.strokeRect(x,y,w,Hh);g.fillStyle='#4c5e61';g.fillRect(x+5,y+28,w-10,Hh-34);g.fillStyle=h%2?'#6f6660':'#666958';g.fillRect(x,y,w,22);g.fillStyle='#aaa18b';for(let n=0,count=0;n<w&&count<32;n+=20,count++)g.fillRect(x+n,y,Math.min(9,w-n),22);g.fillStyle='#222e32';g.fillRect(x+10,y+38,w-20,20);g.fillStyle='#a6a69a77';g.fillRect(x+16,y+44,17,2);drawFieldWorldLight(x+w/2,y+Hh+7,palette.warm);
 }else{
  // Weathered service pads, inset panels and drains, rather than new solid walls.
  g.fillStyle=o.type?'#344146':'#3b4548';g.fillRect(x,y,w,Hh);g.strokeStyle='#87958f55';g.lineWidth=2;g.strokeRect(x+2,y+2,w-4,Hh-4);g.strokeStyle='#111f2899';g.lineWidth=3;g.strokeRect(x+6,y+6,w-12,Hh-12);g.fillStyle='#17272d';g.fillRect(x+12,y+12,Math.max(10,w*.45),Math.max(7,Hh*.2));g.fillStyle='#7d8c8b55';for(let n=0;n<3;n++)g.fillRect(x+16+n*6,y+15,2,Math.max(3,Hh*.2-6));g.fillStyle='#172b32';g.fillRect(x+w*.56,y+Hh*.48,w*.28,Hh*.32);g.strokeStyle='#82908d55';g.lineWidth=1;g.strokeRect(x+w*.56,y+Hh*.48,w*.28,Hh*.32);g.fillStyle='#8d887d66';g.fillRect(x+9,y+Hh-9,w*.23,2);
  if(w>70){g.fillStyle=h%2?palette.accent:palette.warm;g.globalAlpha=.6;g.fillRect(x+w-15,y+5,8,2);g.globalAlpha=1;drawFieldWorldLight(x+w-11,y+Hh+6,h%2?palette.accent:palette.warm)}
 }
 g.restore();return true;
}

// Overhead shopfront study: every painted pixel stays inside its solid street block.
function drawShopfrontStudy(o){
 if(!mainPerfTest?.shopfront||!o.shopfront)return false;
 const dressed=mainPerfTest.dressed&&!preferences.reduced&&downtownPilotArt?.ready,row=downtownPilotArt,x=o.x,y=o.y,w=o.w,h=o.h;
 g.save();g.beginPath();g.rect(x,y,w,h);g.clip();g.fillStyle='#354349';g.fillRect(x,y,w,h);
 if(dressed){g.globalAlpha=.65;g.drawImage(row.image,...row.frames[3],x,y,w,h);g.globalAlpha=1}
 g.fillStyle='#17242b';g.fillRect(x+9,y+9,w-18,h-18);
 if(dressed){g.globalAlpha=.74;g.drawImage(row.image,...row.frames[2],x+11,y+11,w-22,h-22);g.globalAlpha=1}
 g.strokeStyle='#7c8883';g.lineWidth=4;g.strokeRect(x+3,y+3,w-6,h-6);
 const east=x>0,south=y>0,fx=east?x:x+w-68,fy=south?y:y+h-68;
 g.fillStyle='#263339';g.fillRect(fx,y+12,68,h-24);g.fillRect(x+12,fy,w-24,68);
 if(dressed){
  const window=row.frames[4],metal=row.frames[5];g.globalAlpha=.7;g.drawImage(row.image,...metal,fx,y+13,67,h-26);g.drawImage(row.image,...metal,x+13,fy,w-26,67);g.globalAlpha=1;
  for(let n=0;n<4;n++){
   const wy=y+36+n*93,wx=x+36+n*93;
   g.fillStyle='#0e1d25';g.fillRect(fx+13,wy,42,65);g.fillRect(wx,fy+13,65,42);
   g.globalAlpha=.65;g.drawImage(row.image,...window,fx+15,wy+2,38,61);g.drawImage(row.image,...window,wx+2,fy+15,61,38);g.globalAlpha=1;
   g.fillStyle='#d9a46d33';g.fillRect(fx+18,wy+5,31,20);g.fillRect(wx+5,fy+18,24,30);
   g.strokeStyle='#111c21';g.lineWidth=3;g.strokeRect(fx+13,wy,42,65);g.strokeRect(wx,fy+13,65,42)
  }
  if(east&&south){const glow=g.createRadialGradient(x+48,y+95,2,x+48,y+95,85);glow.addColorStop(0,'#edab5966');glow.addColorStop(1,'#edab5900');g.fillStyle=glow;g.fillRect(x,y+10,75,170);const flicker=Math.sin(elapsed*9)*3;g.fillStyle='#873b2e';g.fillRect(x+41,y+103,26,7);g.fillStyle='#ee873d';g.beginPath();g.moveTo(x+43,y+103);g.lineTo(x+48,y+79+flicker);g.lineTo(x+52,y+91);g.lineTo(x+59,y+73-flicker);g.lineTo(x+66,y+103);g.closePath();g.fill();g.fillStyle='#ffd18a';g.beginPath();g.moveTo(x+49,y+102);g.lineTo(x+54,y+87-flicker);g.lineTo(x+61,y+102);g.closePath();g.fill()}
  g.fillStyle='#0d171d';g.fillRect(fx+5,y+8,58,20);g.fillStyle=o.sign;g.fillRect(fx+10,y+14,45,4);
 }
 g.restore();return true;
}

// Foreground accents reuse native attack/goal geometry; never advance state.
