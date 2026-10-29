function fieldReadabilityActive(){return !artSession&&!streetSession&&(fieldWorldActive()||bossLab&&fieldStyle()==='field')}
function fieldCueStroke(color,width,dash){g.save();g.globalAlpha=1;g.shadowBlur=0;g.lineCap='round';g.setLineDash(dash);g.strokeStyle='#071018';g.lineWidth=width+3;g.stroke();g.strokeStyle=color;g.lineWidth=width;g.stroke();g.restore()}
function fieldCueLine(x,y,X,Y,color,width,dash=[]){if(Math.max(x,X)<p.x-W/2-8||Math.min(x,X)>p.x+W/2+8||Math.max(y,Y)<p.y-H/2-8||Math.min(y,Y)>p.y+H/2+8)return;g.beginPath();g.moveTo(x,y);g.lineTo(X,Y);fieldCueStroke(color,width,dash)}
function fieldCueCircle(x,y,r,color,width,dash=[],start=0,end=Math.PI*2){if(r<=0||x+r<p.x-W/2-8||x-r>p.x+W/2+8||y+r<p.y-H/2-8||y-r>p.y+H/2+8)return;g.beginPath();g.arc(x,y,r,start,end);fieldCueStroke(color,width,dash)}
function renderFieldReadability(){
 if(!fieldReadabilityActive())return;g.save();
 const boss=activeBoss;if(boss&&boss.phase==='warn'){
  if(boss.bossKind==='harvester')fieldCueCircle(boss.pulseX,boss.pulseY,HARVESTER_TUNING.radius,'#b7ffd0',3,[8,7]);
  else if(boss.bossKind==='warden'){for(const offset of WARDEN_TUNING.spread){const a=boss.aimAngle+offset;fieldCueLine(boss.x,boss.y,boss.x+Math.cos(a)*WARDEN_TUNING.shotSpeed*WARDEN_TUNING.shotLife,boss.y+Math.sin(a)*WARDEN_TUNING.shotSpeed*WARDEN_TUNING.shotLife,'#9edaff',2,[8,7])}}
  else fieldCueLine(boss.x,boss.y,boss.x+boss.chargeX*boss.chargeLength,boss.y+boss.chargeY*boss.chargeLength,'#ffd394',3,[9,7]);
 }
 for(const e of enemies){if(e.hp<=0)continue;
  if(e.spitter&&e.phase==='aim')fieldCueLine(e.x,e.y,e.x+e.aimX*SPITTER_TUNING.shotSpeed*SPITTER_TUNING.shotLife,e.y+e.aimY*SPITTER_TUNING.shotSpeed*SPITTER_TUNING.shotLife,'#ff9fbd',2,[7,8]);
  if(e.riot&&e.phase==='warn'&&elapsed>=(e.salvageStunUntil||0))fieldCueLine(e.x,e.y,e.x+Math.cos(e.facing)*RIOT_TUNING.bashDistance,e.y+Math.sin(e.facing)*RIOT_TUNING.bashDistance,'#ffe3ad',2,[6,6]);
  if(e.howler&&e.phase==='howl'){fieldCueCircle(e.x,e.y,HOWLER_TUNING.radius,'#ffe08288',2,[7,7]);fieldCueCircle(e.x,e.y,HOWLER_TUNING.radius*clamp(1-e.phaseTime/HOWLER_TUNING.windup,0,1),'#fff0a3',3)}
 }
 for(const b of lobberBombs){fieldCueCircle(b.x,b.y,b.r,'#ffbe8e',3,[6,5]);fieldCueCircle(b.x,b.y,b.r*clamp(1-b.remaining/LOBBER_TUNING.warning,0,1),'#ffbe8e',3)}
 if(salvage){const b=salvage;fieldCueCircle(b.x,b.y,b.r,'#b79550',2);fieldCueCircle(b.x,b.y,b.r,'#ffe09a',5,[],-Math.PI/2,-Math.PI/2+Math.PI*2*b.progress/SALVAGE_TUNING.hold)}
 if(exitBeacon){const b=exitBeacon;fieldCueCircle(b.x,b.y,b.r+3*Math.sin(elapsed*3),'#9affd2',3)}
 g.restore();
}
function drawFieldGems(left,top){
 if(!fieldWorldActive())return false;g.save();g.shadowBlur=0;g.fillStyle='#55f7d4';g.strokeStyle='#07151d';g.lineWidth=1.5;g.beginPath();let visible=false;
 for(const gem of gems){if(gem.x<left-40||gem.x>left+W+40||gem.y<top-40||gem.y>top+H+40)continue;visible=true;g.moveTo(gem.x,gem.y-gem.r);g.lineTo(gem.x+gem.r*.7,gem.y);g.lineTo(gem.x,gem.y+gem.r);g.lineTo(gem.x-gem.r*.7,gem.y);g.closePath()}
 if(visible){g.fill();g.stroke()}g.restore();return true;
}

// Existing interactive footprints, color roles and rules; material drawing only.
function fieldPropVisible(b,wood=false){const x=wood?b.x+b.w/2:b.x,y=wood?b.y+b.h/2:b.y,rx=wood?b.w/2+10:35,ry=wood?b.h/2+10:35;return x+rx>=p.x-W/2-10&&x-rx<=p.x+W/2+10&&y+ry>=p.y-H/2-10&&y-ry<=p.y+H/2+10}
function fieldPropMetal(left,right,dark,base,light){if(preferences.reduced)return base;const paint=g.createLinearGradient(left,0,right,0);for(const [at,color]of [[0,dark],[.22,base],[.42,light],[.68,base],[1,dark]])paint.addColorStop(at,color);return paint}
function drawFieldDrum(b,shock=false){
 if(!fieldWorldActive())return false;if(!fieldPropVisible(b))return true;
 const dark=shock?'#17505b':'#78482d',base=shock?'#277f88':'#f0a550',light=shock?'#69b9bd':'#f5bc76',top=shock?'#92d5d4':'#ffd092',ink=shock?'#c8ffff':'#342e2b';g.save();g.translate(b.x,b.y);
 g.fillStyle='#02090d88';g.beginPath();g.ellipse(4,17,20,8,0,0,Math.PI*2);g.fill();g.fillStyle=fieldPropMetal(-14,14,dark,base,light);g.fillRect(-14,-21,28,37);g.fillStyle=dark;g.beginPath();g.ellipse(0,16,14,4,0,0,Math.PI*2);g.fill();
 g.strokeStyle=shock?'#9bcfd0':'#80583b';g.lineWidth=1;g.strokeRect(-14,-21,28,37);g.fillStyle=shock?'#154a56':'#5c392b';g.fillRect(-15,-13,30,4);g.fillRect(-15,8,30,4);g.fillStyle=shock?'#83b8b5':'#bd9063';g.fillRect(-15,-13,30,1);g.fillRect(-15,8,30,1);
 g.fillStyle=top;g.beginPath();g.ellipse(0,-21,14,4.5,0,0,Math.PI*2);g.fill();g.strokeStyle=dark;g.lineWidth=1;g.stroke();g.fillStyle=shock?'#346b72':'#906239';g.beginPath();g.ellipse(6,-21,2.5,1.5,0,0,Math.PI*2);g.fill();
 if(!preferences.reduced){g.strokeStyle=shock?'#b9e6df66':'#ffdeb866';g.lineWidth=1;g.beginPath();g.moveTo(-10,-17);g.lineTo(-10,4);g.moveTo(-9,13);g.lineTo(-7,13);g.stroke();g.fillStyle=dark;g.fillRect(8,2,3,1);g.fillRect(-9,6,2,2)}
 g.fillStyle=shock?'#173b4888':'#ffe0a35c';g.fillRect(-7,-8,14,15);g.fillStyle=ink;g.font=shock?'bold 23px system-ui':'bold 17px system-ui';g.textAlign='center';g.fillText(shock?'ϟ':'!',0,shock?9:6);g.restore();return true;
}
function drawFieldBarricade(b){
 if(!fieldWorldActive())return false;if(!fieldPropVisible(b,true))return true;const length=Math.max(b.w,b.h),thick=Math.min(b.w,b.h),ratio=Number.isFinite(b.hp/b.max)?clamp(b.hp/b.max,0,1):1;g.save();
 g.fillStyle='#060a10';g.fillRect(b.x+5,b.y+7,b.w,b.h);g.translate(b.x+b.w/2,b.y+b.h/2);if(b.h>b.w)g.rotate(Math.PI/2);g.fillStyle='#5b4535';g.fillRect(-length/2,-thick/2,length,thick);
 for(let row=0;row<3;row++){const y=-thick/2+row*thick/3;g.fillStyle=['#987a54','#8d714e','#795d42'][row];g.fillRect(-length/2,y+.7,length,thick/3-1);g.fillStyle='#c0a47588';g.fillRect(-length/2+2,y+1,length-4,1);
  if(!preferences.reduced){g.strokeStyle='#4b382b99';g.lineWidth=.7;g.beginPath();for(let n=0;n<4;n++){const x=-length/2+7+n*(length-14)/4;g.moveTo(x,y+thick/6);g.lineTo(x+length/7,y+thick/6+.6)}g.stroke()}
 }
 for(const side of [-1,1]){const x=side*length*.28;g.fillStyle='#374147';g.fillRect(x-4,-thick/2-1,8,thick+2);g.fillStyle='#edc66f';g.fillRect(x-3,-thick/2+1,6,Math.min(5,thick-2));if(!preferences.reduced){g.fillStyle='#d4d2b1';for(const y of [-thick/2+3,thick/2-3])g.fillRect(x-1,y-1,2,2)}}
 if(ratio<.7){g.strokeStyle='#30271f';g.lineWidth=1.5;g.beginPath();g.moveTo(-length*.12,-thick/2);g.lineTo(-length*.04,0);g.lineTo(-length*.09,thick/2);if(ratio<.35){g.moveTo(length*.13,-thick/2);g.lineTo(length*.03,1);g.lineTo(length*.2,thick/2)}g.stroke()}
 g.strokeStyle='#ead4ac88';g.lineWidth=1;g.strokeRect(-length/2,-thick/2,length,thick);g.fillStyle='#1a202b';g.fillRect(-Math.min(16,length*.2),-2.5,Math.min(32,length*.4),5);g.restore();return true;
}
function drawFieldCase(b,kind){
 if(!fieldWorldActive())return false;if(!fieldPropVisible(b))return true;
 const palette={medical:['#18384e','#294f70','#537b93','#9fdcff'],drop:['#2d2541','#44345d','#776087','#d5b6ff'],salvage:['#292822','#3c3328','#776145','#ffdb8d'],locker:['#2c443f','#56756b','#96b6a6','#c9f9df']}[kind];if(!palette)return false;
 const [dark,base,light,edge]=palette,w=kind==='locker'?40:kind==='medical'?40:kind==='drop'?36:34,h=kind==='locker'?36:kind==='salvage'?28:30;g.save();g.translate(b.x,b.y);g.fillStyle='#030a1288';g.beginPath();g.ellipse(3,h/2+4,w*.59,6,0,0,Math.PI*2);g.fill();
 g.fillStyle=fieldPropMetal(-w/2,w/2,dark,base,light);g.fillRect(-w/2,-h/2,w,h);g.fillStyle=light;g.fillRect(-w/2,-h/2-3,w,4);g.strokeStyle=edge;g.lineWidth=1.4;g.strokeRect(-w/2,-h/2,w,h);g.fillStyle=dark;g.fillRect(-w/2+1,h/2-4,w-2,3);
 for(const side of [-1,1]){g.fillStyle=light;g.fillRect(side*(w/2-3)-2,-h/2+1,4,5);g.fillRect(side*(w/2-3)-2,h/2-7,4,5)}
 if(kind==='medical'){
  g.fillStyle=dark;g.fillRect(-8,-h/2-6,16,3);g.fillStyle='#cceeff';g.fillRect(-3,-10,6,20);g.fillRect(-10,-3,20,6);g.fillStyle=edge;g.fillRect(-w/2+3,-3,2,5);g.fillRect(w/2-5,-3,2,5);
 }else if(kind==='locker'){
  g.strokeStyle='#2d4b44';g.lineWidth=2;g.beginPath();g.moveTo(0,-h/2+1);g.lineTo(0,h/2-2);g.stroke();g.fillStyle=edge;g.fillRect(-5,-1,2,7);g.fillRect(3,-1,2,7);g.strokeStyle='#2d4b44';g.lineWidth=1;g.beginPath();for(const side of [-1,1])for(let y=-11;y<-4;y+=3){g.moveTo(side*10-5,y);g.lineTo(side*10+5,y)}g.stroke();
 }else{
  g.fillStyle=kind==='drop'?'#bfa1e5':'#c9a05b';for(const x of [-w*.27,w*.27])g.fillRect(x-2,-h/2+1,4,h-3);g.fillStyle=dark;g.fillRect(-7,-5,14,11);g.strokeStyle=kind==='drop'?'#ffe1a3':edge;g.lineWidth=2;g.beginPath();if(kind==='drop'){g.moveTo(-5,-3);g.lineTo(0,4);g.lineTo(5,-3)}else{g.moveTo(0,-4);g.lineTo(4,0);g.lineTo(0,4);g.lineTo(-4,0);g.closePath()}g.stroke();g.fillStyle=edge;g.fillRect(-3,-h/2-1,6,4);
 }
 if(!preferences.reduced){g.strokeStyle=edge+'55';g.lineWidth=1;g.beginPath();g.moveTo(-w/2+6,-h/2+6);g.lineTo(-w/2+11,-h/2+6);g.moveTo(w/2-10,h/2-7);g.lineTo(w/2-6,h/2-9);g.stroke()}
 g.restore();return true;
}

// Embedded raster assets load only for the explicit art-review sample.
