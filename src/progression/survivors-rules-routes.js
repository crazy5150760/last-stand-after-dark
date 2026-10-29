const SURVIVORS=Object.freeze([
  Object.freeze({id:'survivor',name:'Survivor',icon:'◈',hp:100,speed:210,color:'#65e9d5',stats:'100 HP · Balanced speed',hint:'The original balanced loadout. A steady choice for any weapon.'}),
  Object.freeze({id:'scout',name:'Scout',icon:'➤',hp:85,speed:245,color:'#ffd28a',stats:'85 HP · 17% faster',hint:'Reposition quickly and line up piercing shots. Less health leaves less room for mistakes.'}),
  Object.freeze({id:'bulwark',name:'Bulwark',icon:'⬡',hp:140,speed:185,color:'#9dcaff',stats:'140 HP · 12% slower',hint:'Take more punishment, but plan your route and use dash to clear danger.'}),
  Object.freeze({id:'engineer',name:'Engineer',icon:'⚙',hp:95,speed:200,color:'#e6a17c',stats:'95 HP · 5% slower · Scrapwork',hint:'Fuel blasts have 20% more radius. Player-broken barricades recover up to 0.6s of Dash cooldown, once per second. Tradeoff: less health and slightly slower movement.'}),
  Object.freeze({id:'scavenger',name:'Scavenger',icon:'▣',hp:90,speed:210,magnet:120,color:'#b3df94',stats:'90 HP · 50% more pickup reach',hint:'Wider gem pickup reach and a 650-unit supply-drop XP sweep instead of 500. Collects existing XP only. Tradeoff: 10 less starting HP.'}),
  Object.freeze({id:'tactician',name:'Tactician',icon:'⌖',hp:90,speed:200,decoys:2,color:'#aaa9e8',stats:'90 HP · 5% slower · 2 decoys',hint:'Starts with two decoy charges instead of one. Tradeoff: 10 less HP and 5% slower movement. Pouch can add one charge after you make room; carry cap remains two.'}),
  Object.freeze({id:'quartermaster',name:'Quartermaster',icon:'▤',hp:100,speed:200,rerolls:2,color:'#d9bd80',stats:'100 HP · 5% slower · 2 rerolls',hint:'Starts with two upgrade rerolls instead of one, available after the first weapon choice. Tradeoff: slightly slower movement. Rerolls do not refill in overtime.'}),
  Object.freeze({id:'courier',name:'Courier',icon:'↯',hp:90,speed:220,dash:2.25,color:'#e8ab9d',stats:'90 HP · 5% faster · 2.25s Dash',hint:'Dash recharges in 2.25 seconds instead of 2.50. Capacitor ranks lower it to 2.00/1.75 seconds. Tradeoff: 10 less starting HP. Same gun, damage and Dash protection.'})
]);
const RUN_RULES=Object.freeze([
 Object.freeze({id:'standard',name:'Standard',hint:'The current game balance. No modifiers.',hp:1,damage:1,horde:1}),
 Object.freeze({id:'glass',name:'Glass Cannon',hint:'Start with 20% less maximum HP and 20% more weapon damage. Enemy schedules and rewards stay the same.',hp:.8,damage:1.2,horde:1}),
 Object.freeze({id:'iron',name:'Iron Horde',hint:'Ordinary Shamblers, Runners, and Brutes have 25% more HP. Bosses, specialists, Hunters, schedules, and rewards stay the same.',hp:1,damage:1,horde:1.25})
]);
function ruleById(id){return RUN_RULES.find(r=>r.id===id)||RUN_RULES[0]}
function selectRule(id){if(mode!=='roster'||!RUN_RULES.some(r=>r.id===id))return;selectedRule=id;refreshRule()}
function refreshRule(){document.getElementById('rulePick').value=selectedRule;document.getElementById('ruleDetail').textContent=ruleById(selectedRule).hint;refreshDeploymentSummary()}
function ruleNote(stats={rule:runRule}){return stats.rule?`<p class="muted">RUN RULES · ${ruleById(stats.rule).name}</p>`:'<p class="muted">Run rules not recorded in this older run.</p>'}
const ROUTES=Object.freeze([
 Object.freeze({id:'downtown',name:'Downtown',hint:'The original streets, buildings, and starting cover.'}),
 Object.freeze({id:'freight',name:'Freight Yard',hint:'Container lanes, three starting wood barricades, and one additional fuel barrel. Enemy timing and rewards stay normal.'}),
 Object.freeze({id:'riverside',name:'Riverside',hint:'Open blue promenade lanes and tree-planter scenery, with two relocated wood barricades and the normal fuel supply. Enemy timing and rewards stay normal.'}),
 Object.freeze({id:'park',name:'Memorial Park',hint:'Green walking loops, tree islands and a decorative fountain. Two starting wood barriers, normal fuel and the same enemy pacing.'}),
 Object.freeze({id:'market',name:'Market District',hint:'Awning stalls, hanging lights and three starting wood barriers. Scenery is decorative; normal fuel and the tested enemy ramp.'})
]);
function routeById(id){return ROUTES.find(r=>r.id===id)||ROUTES[0]}
function selectRoute(id){if(mode!=='roster'||!ROUTES.some(r=>r.id===id))return;selectedRoute=id;refreshRoute()}
function refreshRoute(){document.getElementById('routePick').value=selectedRoute;document.getElementById('routeDetail').textContent=routeById(selectedRoute).hint;refreshDeploymentSummary()}
function routeNote(stats={route:runRoute}){return `<p class="muted">ROUTE · ${stats.route?routeById(stats.route).name:'Not recorded in this older run'}</p>`}
function configureRoute(){
 if(runRoute==='downtown')return;
 if(runRoute==='freight'){
  obstacles=[];for(let row=-6;row<=6;row++)for(let col=-5;col<=5;col++){const x=col*320-100,y=row*280-35;if(Math.hypot(x,y)<320)continue;obstacles.push({x,y,w:190,h:65,type:2})}
  barricades=[makeBarricade(-290,-170),makeBarricade(210,-110,true),makeBarricade(-160,230)];barrels.push({x:290,y:200,r:17,spent:false});
 }
 if(runRoute==='market'){obstacles=[];for(let row=-5;row<=5;row++)for(let col=-4;col<=4;col++){const x=col*300-55,y=row*260-40;if(Math.hypot(x,y)<350)continue;obstacles.push({x,y,w:110,h:80,type:5})}barricades=[makeBarricade(-300,-210),makeBarricade(250,140,true),makeBarricade(-140,280)]}
 if(runRoute==='park'){obstacles=[];for(let row=-4;row<=4;row++)for(let col=-4;col<=4;col++){const x=col*320-35,y=row*300-35;if(Math.hypot(x,y)<300)continue;obstacles.push({x,y,w:70,h:70,type:3})}obstacles.push({x:400,y:-65,w:130,h:130,type:4});barricades=[makeBarricade(-300,200),makeBarricade(220,-220,true)]}
 if(runRoute==='riverside'){obstacles=[];for(let row=-4;row<=4;row++)for(let col=-4;col<=4;col++){const x=col*340-35,y=row*320-35;if(Math.hypot(x,y)<300)continue;obstacles.push({x,y,w:70,h:70,type:3})}barricades=[makeBarricade(-240,210),makeBarricade(240,-230,true)]}
 obstacles=obstacles.filter(o=>!barrels.some(b=>pointRectDistance(b,o)<45)&&!barricades.some(b=>o.x<b.x+b.w+25&&o.x+o.w>b.x-25&&o.y<b.y+b.h+25&&o.y+o.h>b.y-25));
}
function renderRouteGround(left,top){
 if(runRoute==='downtown')return;g.save();g.strokeStyle='#6d644633';g.lineWidth=3;
 if(runRoute==='freight')for(let x=Math.floor(left/320)*320;x<left+W+320;x+=320){g.beginPath();g.moveTo(x+125,top);g.lineTo(x+125,top+H);g.moveTo(x+142,top);g.lineTo(x+142,top+H);g.stroke()}
 if(runRoute==='riverside'){g.strokeStyle='#4b869b25';g.lineWidth=22;for(let x=Math.floor(left/340)*340;x<left+W+340;x+=340){g.beginPath();g.moveTo(x+150,top);g.lineTo(x+150,top+H);g.stroke()}}
 if(runRoute==='park'){g.strokeStyle='#72a87922';g.lineWidth=28;for(let y=Math.floor(top/300)*300;y<top+H+300;y+=300){g.beginPath();g.moveTo(left,y+145);g.lineTo(left+W,y+145);g.stroke()}g.strokeStyle='#b2b49733';g.lineWidth=3;for(const r of [180,205]){g.beginPath();g.arc(0,0,r,0,Math.PI*2);g.stroke()}}
 if(runRoute==='market'){g.strokeStyle='#bca96b44';g.lineWidth=2;for(let y=Math.floor(top/260)*260;y<top+H+260;y+=260){g.beginPath();g.moveTo(left,y+125);g.lineTo(left+W,y+125);g.stroke();g.fillStyle='#efcb8677';for(let x=Math.floor(left/100)*100;x<left+W+100;x+=100){g.beginPath();g.arc(x,y+130,3,0,Math.PI*2);g.fill()}}}
 g.fillStyle='#a6b3ab66';g.font='bold 16px system-ui';g.textAlign='center';g.fillText(routeById(runRoute).name.toUpperCase(),0,-210);g.restore();
}
function renderRouteStructure(o){
 if(o.type===5){g.fillStyle='#6a4657';g.fillRect(o.x,o.y,o.w,o.h);g.fillStyle='#d1b081';g.fillRect(o.x,o.y,o.w,23);g.fillStyle='#9b5861';for(let x=o.x;x<o.x+o.w;x+=22)g.fillRect(x,o.y,11,23);g.strokeStyle='#c6a7a1';g.lineWidth=2;g.strokeRect(o.x,o.y,o.w,o.h);g.fillStyle='#33434c';g.fillRect(o.x+10,o.y+39,o.w-20,25);return true}
 if(o.type===4){g.fillStyle='#475a5b';g.beginPath();g.arc(o.x+65,o.y+65,65,0,Math.PI*2);g.fill();g.fillStyle='#397d8a';g.beginPath();g.arc(o.x+65,o.y+65,51,0,Math.PI*2);g.fill();g.strokeStyle='#91c6cb';g.lineWidth=3;g.beginPath();g.arc(o.x+65,o.y+65,29,0,Math.PI*2);g.stroke();return true}
 if(o.type===3){g.fillStyle='#304c49';g.fillRect(o.x,o.y,o.w,o.h);g.fillStyle='#3b6458';g.beginPath();g.arc(o.x+o.w/2,o.y+o.h/2,27,0,Math.PI*2);g.fill();g.strokeStyle='#71988b';g.lineWidth=2;g.strokeRect(o.x,o.y,o.w,o.h);return true}
 if(o.type!==2)return false;g.fillStyle='#050b1399';g.fillRect(o.x+7,o.y+9,o.w,o.h);g.fillStyle='#354e58';g.fillRect(o.x,o.y,o.w,o.h);g.strokeStyle='#6b858a';g.lineWidth=2;g.strokeRect(o.x,o.y,o.w,o.h);for(let x=o.x+12;x<o.x+o.w;x+=18){g.beginPath();g.moveTo(x,o.y+5);g.lineTo(x,o.y+o.h-5);g.stroke()}return true;
}
