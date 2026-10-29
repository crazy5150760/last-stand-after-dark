
(()=>{'use strict';
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
const CONTRACTS=Object.freeze([
 Object.freeze({id:'resupply',name:'Field Resupply',short:'LOCKERS USED',target:1,goal:'Take one tool from a field locker.',hint:'A locker appears after a boss defeat in a quiet window. Approach, Pause and choose a tool under capacity. Canceling does not count.'}),
 Object.freeze({id:'evolution',name:'Field Evolution',short:'EVOLVED PATHS',target:1,goal:'Evolve 1 weapon path.',hint:'Build any weapon to rank three, then choose its evolution on a later offer. One contract upgrade; no timer or extra enemies.'}),
 Object.freeze({id:'patrol',name:'Night Circuit',short:'CHECKPOINTS',target:3,goal:'Visit 3 numbered blue patrol checkpoints.',hint:'Markers are placed around your starting district. Walk or Dash through each once; no timer, extra enemies, or per-checkpoint XP.'}),
  Object.freeze({id:'lure',name:'Distraction Detail',short:'ENEMIES LURED',target:10,goal:'Lure 10 distinct ordinary enemies with decoys.',hint:'Only the nearest 12 eligible enemies per decoy can count; the same enemy counts once this run. No extra enemy spawns or decoy charges.'}),
  Object.freeze({id:'shock',name:'Power Outage',short:'SHOCK DRUMS',target:3,goal:'Discharge 3 teal shock drums by dashing through them.',hint:'Each drum counts once, even if no enemies are nearby. No deadline; the normal drum schedule stays the same.'}),
  Object.freeze({id:'demolition',name:'Demolition Detail',short:'BARRELS',target:3,goal:'Detonate 3 fuel barrels.'}),
  Object.freeze({id:'salvage',name:'Salvage Runner',short:'HOLDOUTS',target:2,goal:'Secure 2 salvage holdouts.'}),
  Object.freeze({id:'bosses',name:'Night Watch',short:'BOSSES',target:2,goal:'Defeat 2 bosses of any kind.'}),
  Object.freeze({id:'rescue',name:'Rescue Dispatch',short:'ESCORTS',target:1,goal:'Escort 1 survivor to the green exit.',hint:'Recruiting alone does not count. Your normal rescue upgrade is separate.'}),
  Object.freeze({id:'convoy',name:'Road Intercept',short:'CONVOYS',target:1,goal:'Destroy 1 supply convoy.',hint:'Stop the moving truck before it leaves. Your normal convoy upgrade is separate.'}),
  Object.freeze({id:'fire',name:'Firebreak',short:'FIRE KILLS',target:40,goal:'Defeat 40 enemies with Molotov or Wildfire burns.',hint:'Choose Molotov during upgrades. Fuel blasts, wood, and trucks do not count as fire eliminations.'})
]);
// Shared appearance data keeps field portraits and spawned enemies in sync.
const ENEMY_ART=Object.freeze(Object.fromEntries(Object.entries({
  shambler:{r:15,col:'#b2ca80',type:0},runner:{r:11,col:'#f0ad7e',type:1},brute:{r:23,col:'#ab8fe1',type:2},
  hunter:{r:12,col:'#c9b4ff',type:1,rush:true},spitter:{r:17,col:'#ec79a8',type:4,spitter:true},
  riot:{r:19,col:'#90a7b4',type:5,riot:true},lobber:{r:20,col:'#8da5d4',type:8,lobber:true},howler:{r:18,col:'#e2cf75',type:7,howler:true},breaker:{r:34,col:'#ee6a85',type:3,bossKind:'breaker'},warden:{r:34,col:'#7eb8ed',type:3,bossKind:'warden'},harvester:{r:36,col:'#90c5a0',type:3,bossKind:'harvester'}
}).map(([id,art])=>[id,Object.freeze(art)])));
const ENEMY_GUIDE=Object.freeze([
  Object.freeze({id:'shambler',name:'Shambler',group:'horde',look:'Green, steady-moving street horde.',tell:'Closes directly and hurts you on contact.',counter:'Keep a path open. Use piercing shots, fire pools, or fuel blasts against a crowd.'}),
  Object.freeze({id:'runner',name:'Runner',group:'horde',look:'Small orange pursuer, faster than a Shambler.',tell:'Rushes into gaps while you are handling slower enemies.',counter:'Turn before you are boxed in. Save Dash for an open escape lane.'}),
  Object.freeze({id:'brute',name:'Brute',group:'horde',look:'Large purple body with a health bar; appears after 00:30.',tell:'Slow approach, more health, and a heavier contact hit.',counter:'Keep moving while your weapons work. Fuel and piercing shots help clear the bodies around it.'}),
  Object.freeze({id:'hunter',name:'Blackout Hunter',group:'horde',look:'Small violet enemies arriving during Blackout Rush.',tell:'Hunters alternate from the edges marked by the Blackout HUD.',counter:'Watch the marked edges and keep a route through the inward-moving wave. Survive the event; you do not need to kill every hunter.'}),
  Object.freeze({id:'spitter',name:'Spitter',group:'specialist',look:'Pink ranged enemy labeled SPITTER; starts after 01:05 when encounters allow.',tell:'A pink aim line pauses before a single hostile shot.',counter:'Move across the aim line. Wood can block shots, and Reaper Ring can intercept them.'}),
  Object.freeze({id:'riot',name:'Riot Guard',group:'specialist',look:'Steel-blue body with a gold front shield; starts after 02:30 when encounters allow.',tell:'The shield blocks front gunfire, including Railstorm. A short bash is followed by SHIELD DOWN recovery.',counter:'Flank it or shoot during SHIELD DOWN. Lightning, blades, ground fire, and fuel bypass the raised shield.'}),
  Object.freeze({id:'howler',name:'Howler',group:'specialist',look:'Yellow body, open mouth, and sound arcs; appears after 03:30 in quiet windows.',tell:'Stops for a 1.2-second gold rally warning, then briefly speeds up at most eight nearby ordinary enemies. Gold outlines mark rallied enemies.',counter:'Close in and let your gun, lightning, blades, fire, or fuel kill it before the howl. Rally gives only 20% movement speed for 3 seconds, never stacks, and does not affect bosses, specialists, or Blackout Hunters. Existing boosts expire even if the Howler dies.'}),
  Object.freeze({id:'lobber',name:'Lobber',group:'specialist',look:'Slate-blue body with a raised launcher and LOBBER label; overtime only, from 04:15 in quiet windows.',tell:'Stops for a one-second throwing windup, then marks a fixed orange ground circle for 1.4 seconds before one blast.',counter:'Leave the marked circle; it never follows you. Kill or stun the Lobber before launch. A launched warning remains even if its caster dies. Bosses, Blackouts, salvage, convoys, drops, and open exits cancel its attacks. Only one Lobber and one warning may be active.'}),
  Object.freeze({id:'breaker',name:'Breaker',group:'boss',look:'Large rose-colored first boss, due at 01:30.',tell:'An orange charge lane locks before the rush, followed by a recovery window.',counter:'Sidestep the locked lane or Dash clear. Attack during recovery and use fuel barrels when the boss is close.'}),
  Object.freeze({id:'warden',name:'Warden',group:'boss',look:'Blue hex-marked boss that alternates with Breaker after the first defeat.',tell:'Five blue lines warn of a fan of shots, followed by recovery.',counter:'Move into the gaps between lanes. Use wood or Reaper Ring for cover and attack during recovery.'}),
 Object.freeze({id:'harvester',name:'Harvester',group:'boss',look:'Large green boss with three radial prongs. Third in the Breaker, Warden, Harvester cycle.',tell:'Stops for a 1.35-second circular ground warning, then pulses once around its fixed position and rests.',counter:'Leave the 135-unit warning circle or Dash clear. It cannot move the warning onto you; attack during its 1.4-second recovery. No extra shots, summons, or lingering damage pools.'})
]);
function emptyEnemyTally(){return Object.fromEntries(ENEMY_GUIDE.map(entry=>[entry.id,0]))}
function cleanEnemyTally(raw){return Object.fromEntries(ENEMY_GUIDE.map(entry=>[entry.id,safeCount(raw&&typeof raw==='object'&&!Array.isArray(raw)?raw[entry.id]:undefined)]))}
function enemySpecies(e){
  if(e.convoy)return null;
  if(e===activeBoss)return ['breaker','warden','harvester'].includes(e.bossKind)?e.bossKind:'breaker';
  if(e.lobber)return 'lobber';if(e.rush)return 'hunter';if(e.spitter)return 'spitter';if(e.riot)return 'riot';if(e.howler)return 'howler';
  return e.type===0?'shambler':e.type===1?'runner':e.type===2?'brute':null;
}
const WEAPON_LABELS=Object.freeze({gun:'Gun',lightning:'Lightning',blades:'Blades',fire:'Fire',fuel:'Fuel blasts',utility:'Exit / other utility'});
function emptyWeaponLedger(){return Object.fromEntries(Object.keys(WEAPON_LABELS).map(key=>[key,{damage:0,kills:0}]))}
function cleanWeaponLedger(raw){if(!raw||typeof raw!=='object'||Array.isArray(raw))return null;return Object.fromEntries(Object.keys(WEAPON_LABELS).map(key=>[key,{damage:cleanMeasure(raw[key]?.damage)??0,kills:safeCount(raw[key]?.kills)}]))}
function weaponSource(source){switch(source){case '':return 'gun';case 'LIGHTNING':return 'lightning';case 'BLADES':return 'blades';case 'FIRE':return 'fire';case 'BLAST':return 'fuel';default:return 'utility'}}
function weaponPanel(ledger){return `<details class="medal-goals"><summary>WEAPON CONTRIBUTIONS</summary>${ledger?`<table class="weapon-ranks"><thead><tr><th>Source</th><th>HP removed</th><th>Last-hit kills</th></tr></thead><tbody>${Object.entries(WEAPON_LABELS).map(([key,label])=>`<tr><th>${label}</th><td>${Number(ledger[key].damage.toFixed(1))}</td><td>${ledger[key].kills}</td></tr>`).join('')}</tbody></table><p class="muted">Actual enemy HP removed, excluding overkill, wood and trucks. Eliminations belong to the final hit. Exit clearing is utility, not gun damage.</p>`:'<p class="muted">Unavailable in this older run.</p>'}</details>`}
const MEDAL_TRACKERS=Object.freeze([
 {id:'extract',name:'Made It Out',target:1,value:()=>runOutcome==='extracted'?1:0,hint:'extract to earn'},
 {id:'boss',name:'Boss Hunter',target:2,value:()=>bossesDefeated},
 {id:'fuel',name:'Demolition',target:5,value:()=>barrelsBlown},
 {id:'overtime',name:'After Hours',target:1,value:()=>runOutcome==='extracted'&&overtime>=1?1:0,hint:'extract after overtime'},
 {id:'rescue',name:'Lifeline',target:1,value:()=>rescuesCompleted},
 {id:'stun',name:'Crowd Control',target:20,value:()=>shockStuns},
 {id:'arsenal',name:'Arsenal',target:2,value:()=>EVOLUTIONS.filter(e=>p[e.weapon]===3&&p[e.field]).length},
 {id:'iron',name:'Iron Escape',target:1,value:()=>runOutcome==='extracted'&&runRule==='iron'?1:0,hint:'Iron Horde + extract'}
].map(m=>Object.freeze(m)));
const RUN_EVENT_LABELS=Object.freeze({deployment:'Deployed',locker:'Field locker resupplied',patrol:'Patrol checkpoint reached',extracted:'Extracted successfully',defeated:'Defeated',abandoned:'Run ended manually','breaker-arrived':'Breaker arrived','warden-arrived':'Warden arrived','breaker-down':'Breaker defeated','warden-down':'Warden defeated','harvester-arrived':'Harvester arrived','harvester-down':'Harvester defeated',blackout:'Blackout Rush began','blackout-clear':'Blackout survived',salvage:'Salvage secured',rescue:'Survivor delivered',convoy:'Convoy intercepted',drop:'Supply drop collected',contract:'Contract completed','second-wind':'Second Wind used',overtime:'Chose to stay in overtime','exit-open':'Green exit opened',decoy:'Decoy deployed',shock:'Shock drum discharged','evolve-rail':'Evolved Railstorm','evolve-thunder':'Evolved Thunderweb','evolve-reaper':'Evolved Reaper Ring','evolve-wildfire':'Evolved Wildfire'});
function cleanTimeline(raw){if(!Array.isArray(raw))return null;return raw.slice(-40).filter(row=>row&&typeof row==='object'&&typeof row.kind==='string'&&Object.prototype.hasOwnProperty.call(RUN_EVENT_LABELS,row.kind)&&typeof row.time==='number'&&Number.isFinite(row.time)&&row.time>=0).map(row=>({kind:row.kind,time:Math.round(Math.min(86400,row.time)*1000)/1000})).sort((a,b)=>a.time-b.time)}
function recordRunEvent(kind){if(runLogged||!['play','paused','upgrade','extraction'].includes(mode)||typeof kind!=='string'||!Object.prototype.hasOwnProperty.call(RUN_EVENT_LABELS,kind)||!Number.isFinite(elapsed))return;runTimeline.push({kind,time:elapsed});if(runTimeline.length>40){runTimeline.shift();timelineDropped++}}
function timelinePanel(stats){return `<details class="medal-goals"><summary>RUN TIMELINE</summary>${stats.timeline?`<p class="muted">Latest ${stats.timeline.length} events${stats.timelineDropped?' · '+stats.timelineDropped+' earlier events omitted':''}. Times use active play time.</p><ol>${stats.timeline.map(row=>`<li>${fmt(row.time)} · ${RUN_EVENT_LABELS[row.kind]}</li>`).join('')}</ol>`:'<p class="muted">Unavailable in this older run.</p>'}</details>`}
const THREAT_LABELS=Object.freeze({none:'No hits recorded',contact:'Enemy contact',shot:'Hostile shot','lobber-blast':'Lobber blast','harvester-pulse':'Harvester pulse','spitter-shot':'Spitter shot','warden-shot':'Warden volley',...Object.fromEntries(ENEMY_GUIDE.map(e=>[e.id,e.name]))});
function knownThreat(id){return typeof id==='string'&&Object.prototype.hasOwnProperty.call(THREAT_LABELS,id)}
function threatName(id){return knownThreat(id)?THREAT_LABELS[id]:'Not recorded in this older run'}
function cleanMeasure(value){return typeof value==='number'&&Number.isFinite(value)?Math.round(Math.max(0,Math.min(1e9,value))*10)/10:null}
const JOURNAL_KEY='ls-journal-v1';
const PREFS_KEY='ls-preferences-v1';
const FAVORED_PATHS=Object.freeze({off:'No favored path',pierce:'Piercing Rounds → Railstorm',arc:'Chain Lightning → Thunderweb',blades:'Orbiting Blades → Reaper Ring',molotov:'Molotov → Wildfire'});
const AUDIO_LEVELS=Object.freeze({masterVolume:'Master',effectsVolume:'Effects',alertsVolume:'Alerts',musicVolume:'Music'});
function defaultPreferences(){return{masterVolume:80,effectsVolume:80,alertsVolume:80,musicVolume:35,sound:true,shake:true,numbers:true,reduced:false,waypoints:true,warnings:true,mirrored:false,aim:false,favored:'off',hud:'composed',actors:'field',scenery:'street',available:true,readOnly:false}}
function cleanAudioLevel(value,fallback=80){return typeof value==='number'&&Number.isFinite(value)?Math.max(0,Math.min(100,Math.round(value))):fallback}
function audioOutputLevel(bus='effects'){return musicOn?4*preferences.masterVolume/100*preferences[bus==='music'?'musicVolume':bus==='alerts'?'alertsVolume':'effectsVolume']/100:0}
function applyAudioMix(sync=true){
 if(!audioMix||audioMix.ctx!==audioCtx)return;
 const set=(node,value)=>{const param=node.gain;if(param.setTargetAtTime)param.setTargetAtTime(value,audioCtx.currentTime,.015);else param.setValueAtTime(value,audioCtx.currentTime)};
 set(audioMix.master,musicOn?4*preferences.masterVolume/100:0);set(audioMix.effects,preferences.effectsVolume/100);set(audioMix.alerts,preferences.alertsVolume/100);set(audioMix.music,preferences.musicVolume/100);if(sync)syncBackgroundMusic();
}
function getAudioMix(){
 audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();unlockAudio();if(audioMix?.ctx===audioCtx)return audioMix;
 const master=audioCtx.createGain(),effects=audioCtx.createGain(),alerts=audioCtx.createGain(),music=audioCtx.createGain(),limiter=audioCtx.createDynamicsCompressor?.();
 effects.connect(master);alerts.connect(master);music.connect(master);if(limiter){limiter.threshold.value=-12;limiter.knee.value=18;limiter.ratio.value=12;limiter.attack.value=.003;limiter.release.value=.2;master.connect(limiter);limiter.connect(audioCtx.destination)}else master.connect(audioCtx.destination);
 audioMix={ctx:audioCtx,master,effects,alerts,music,limiter};applyAudioMix(false);return audioMix;
}
const audioVoices=new Set();
function stopAudioVoices(){for(const cancel of [...audioVoices])cancel()}
function startAudioVoice(from,to,len,type,volume,bus='effects',ended=null){
 bus=bus==='alerts'?'alerts':'effects';if(!musicOn||document.hidden||audioOutputLevel(bus)===0)return false;unlockAudio();if(activeAudioVoices>=24||bus==='effects'&&effectAudioVoices>=20)return false;
 let o,a,occupied=false;const cancel=()=>{try{o?.stop()}catch{}cleanup()},cleanup=()=>{if(!occupied)return;occupied=false;audioVoices.delete(cancel);activeAudioVoices--;if(bus==='effects')effectAudioVoices--;try{o.disconnect();a.disconnect()}catch{}if(ended)ended()};
 try{const mix=getAudioMix(),at=audioCtx.currentTime;o=audioCtx.createOscillator();a=audioCtx.createGain();o.type=type;o.frequency.setValueAtTime(from,at);o.frequency.exponentialRampToValueAtTime(Math.max(30,to),at+len);a.gain.setValueAtTime(volume,at);a.gain.exponentialRampToValueAtTime(.0001,at+len);o.connect(a);a.connect(mix[bus]);o.onended=cleanup;activeAudioVoices++;if(bus==='effects')effectAudioVoices++;occupied=true;audioVoices.add(cancel);o.start();o.stop(at+len);return true}catch{cleanup();try{o?.disconnect();a?.disconnect()}catch{}return false}
}
// One cached, original 48-second loop; no game RNG, network, sequencer or timers.
function stopBackgroundMusic(reset=false){
 const handle=musicTrack.node;musicTrack.node=null;if(reset)musicTrack.offset=0;
 if(!handle)return;
 if(!reset&&!handle.preview&&musicTrack.buffer)musicTrack.offset=(handle.offset+Math.max(0,handle.ctx.currentTime-handle.startedAt))%musicTrack.buffer.duration;
 if(musicTrack.tail){const old=musicTrack.tail;try{old.source.stop()}catch{}old.cleanup()}
 musicTrack.tail=handle;
 try{const at=handle.ctx.currentTime,param=handle.gain.gain;param.cancelScheduledValues?.(at);param.setValueAtTime(param.value,at);if(param.linearRampToValueAtTime)param.linearRampToValueAtTime(0,at+.025);handle.source.stop(at+.03)}catch{handle.cleanup()}
}
function syncBackgroundMusic(){
 const preview=musicTrack.preview&&['paused','settings'].includes(mode);
 if(document.hidden||!musicOn||preferences.masterVolume===0||preferences.musicVolume===0||mode!=='play'&&!preview){musicTrack.preview=false;stopBackgroundMusic();return}
 if(musicTrack.error){musicTrack.preview=false;return}if(musicTrack.node||musicTrack.loading)return;
 try{
  const mix=getAudioMix(),ctx=audioCtx;
  if(musicTrack.ctx!==ctx){musicTrack.buffer=null;musicTrack.ctx=ctx;musicTrack.offset=0}
  if(!musicTrack.buffer){
   const asset=JSON.parse(document.getElementById('musicAsset').textContent),bytes=Uint8Array.from(atob(asset.data.split(',')[1]),c=>c.charCodeAt(0));
   const pending=Promise.resolve(ctx.decodeAudioData(bytes.buffer));musicTrack.loading=pending;
   pending.then(buffer=>{if(musicTrack.loading!==pending)return;musicTrack.loading=null;if(!buffer||!Number.isFinite(buffer.duration)||buffer.duration<=0)throw Error('Invalid music');musicTrack.buffer=buffer;syncBackgroundMusic();refreshAudioControls()}).catch(()=>{if(musicTrack.loading&&musicTrack.loading!==pending)return;musicTrack.loading=null;musicTrack.error=true;musicTrack.preview=false;refreshAudioControls()});return;
  }
  const source=ctx.createBufferSource(),gain=ctx.createGain(),at=ctx.currentTime,offset=preview?0:musicTrack.offset%musicTrack.buffer.duration;
  const handle={source,gain,ctx,preview,offset,startedAt:at,cleaned:false,cleanup(){if(handle.cleaned)return;handle.cleaned=true;source.onended=null;try{source.disconnect();gain.disconnect()}catch{}if(musicTrack.tail===handle)musicTrack.tail=null;if(musicTrack.node===handle){musicTrack.node=null;if(handle.preview){musicTrack.preview=false;refreshAudioControls()}}}};
  source.buffer=musicTrack.buffer;source.loop=true;source.loopStart=0;source.loopEnd=musicTrack.buffer.duration;source.connect(gain);gain.connect(mix.music);gain.gain.setValueAtTime(0,at);if(gain.gain.linearRampToValueAtTime)gain.gain.linearRampToValueAtTime(1,at+.08);else gain.gain.setValueAtTime(1,at);source.onended=handle.cleanup;musicTrack.node=handle;
  if(preview)source.start(at,offset,6);else source.start(at,offset);
 }catch{stopBackgroundMusic();musicTrack.error=true;musicTrack.preview=false;refreshAudioControls()}
}
function audioControls(withMute=false){
 return `<section class="medal-goals audio-controls" aria-label="Audio volume"><h2 style="font-size:16px;color:#ffdf93;margin:0 0 10px">AUDIO</h2>${Object.entries(AUDIO_LEVELS).map(([key,label])=>`<div class="audio-row"><label for="audio-${key}">${label} <output id="audio-value-${key}">${preferences[key]}%</output></label><input id="audio-${key}" type="range" min="0" max="100" step="5" value="${preferences[key]}" aria-valuetext="${preferences[key]} percent"></div>`).join('')}<p class="muted">Master changes everything. Effects covers combat and pickups; Alerts covers danger and encounter cues. Music plays the original Night Watch track during active play.</p><div class="result-actions">${withMute?`<button class="btn secondary" id="sound">Sound: ${musicOn?'ON':'OFF'}</button>`:''}<button class="btn secondary" id="audioTestEffects">TEST EFFECTS</button><button class="btn secondary" id="audioTestAlerts">TEST ALERTS</button><button class="btn secondary" id="audioTestMusic">PREVIEW MUSIC · 6 SEC</button><button class="btn secondary" id="audioReset">RESET LEVELS</button></div><p id="audioStatus" class="muted" role="status"></p></section>`;
}
function refreshAudioControls(){
 for(const key of Object.keys(AUDIO_LEVELS)){const input=document.getElementById('audio-'+key),value=document.getElementById('audio-value-'+key);if(input){input.value=String(preferences[key]);input.setAttribute('aria-valuetext',preferences[key]+' percent')}if(value)value.textContent=preferences[key]+'%'}
 const button=document.getElementById('sound');if(button)button.textContent='Sound: '+(musicOn?'ON':'OFF');
 const status=document.getElementById('audioStatus'),storageNote=preferences.readOnly?'Levels last for this visit; newer preferences are preserved.':preferences.available?'Levels saved in this browser.':'Storage unavailable; levels last for this visit.';if(status)status.textContent=(!musicOn||preferences.masterVolume===0?'Muted. Turn Sound on and raise Master to hear previews. ':'')+storageNote+(musicTrack.error?' Music could not load in this browser; effects still work.':'');const preview=document.getElementById('audioTestMusic');if(preview)preview.textContent=musicTrack.preview?'STOP MUSIC PREVIEW':'PREVIEW MUSIC · 6 SEC';
}
function bindAudioControls(){
 const current=input=>['paused','settings'].includes(mode)&&!document.hidden&&input.isConnected&&document.getElementById(input.id)===input;
 for(const key of Object.keys(AUDIO_LEVELS)){const input=document.getElementById('audio-'+key);input.addEventListener('input',()=>{if(!current(input))return;const value=Number(input.value);if(!Number.isFinite(value))return;preferences[key]=cleanAudioLevel(value,key==='musicVolume'?35:80);applyAudioMix();syncBackgroundMusic();savePreferences();refreshAudioControls()})}
 for(const bus of ['Effects','Alerts'])bindPress(document.getElementById('audioTest'+bus),()=>{if(['paused','settings'].includes(mode)&&!document.hidden)sound(bus==='Effects'?460:220,.18,'triangle',.03,bus.toLowerCase())});
 bindPress(document.getElementById('audioTestMusic'),()=>{if(!['paused','settings'].includes(mode)||document.hidden)return;musicTrack.preview=!musicTrack.preview;syncBackgroundMusic();refreshAudioControls()});
 bindPress(document.getElementById('audioReset'),()=>{if(!['paused','settings'].includes(mode)||document.hidden)return;for(const key of Object.keys(AUDIO_LEVELS))preferences[key]=key==='musicVolume'?35:80;applyAudioMix();syncBackgroundMusic();savePreferences();refreshAudioControls()});refreshAudioControls();
}
function readPreferences(){
 const result=defaultPreferences();try{const raw=localStorage.getItem(PREFS_KEY);if(!raw)return result;const data=JSON.parse(raw);if(data?.version>1){result.readOnly=true;result.available=false;return result}if(data?.version===1){for(const key of Object.keys(AUDIO_LEVELS))result[key]=cleanAudioLevel(data[key],result[key]);for(const key of ['sound','shake','numbers','reduced','waypoints','warnings','mirrored','aim'])if(typeof data[key]==='boolean')result[key]=data[key];if(['composed','classic'].includes(data.hud))result.hud=data.hud;if(['field','classic'].includes(data.actors))result.actors=data.actors;if(['street','classic'].includes(data.scenery))result.scenery=data.scenery;if(typeof data.favored==='string'&&Object.prototype.hasOwnProperty.call(FAVORED_PATHS,data.favored))result.favored=data.favored}}catch{result.available=false}return result;
}
function savePreferences(){
 if(mainPerfTest){diagnostics=freshPerformance(diagnostics.enabled);return true}
 if(preferences.readOnly)return false;try{const value=JSON.stringify({version:1,...Object.fromEntries(['sound','shake','numbers','reduced','waypoints','warnings','mirrored','aim'].map(key=>[key,preferences[key]])),favored:preferences.favored,hud:preferences.hud,actors:preferences.actors,scenery:preferences.scenery,...Object.fromEntries(Object.keys(AUDIO_LEVELS).map(key=>[key,preferences[key]]))});localStorage.setItem(PREFS_KEY,value);preferences.available=localStorage.getItem(PREFS_KEY)===value;return preferences.available}catch{preferences.available=false;return false}
}
function favoredPicker(){return `<div class="contract-picker"><label for="favoredPick">FAVORED WEAPON PATH</label><select id="favoredPick">${Object.entries(FAVORED_PATHS).map(([id,name])=>`<option value="${id}">${name}</option>`).join('')}</select><p class="muted">Highlight matching rank and evolution cards. Offers, rewards and fresh-choice controls stay the same.</p></div>`}
function bindFavoredPicker(){
 const picker=document.getElementById('favoredPick');picker.value=preferences.favored;picker.addEventListener('change',()=>{if(['roster','paused','settings'].includes(mode)&&picker.isConnected&&Object.prototype.hasOwnProperty.call(FAVORED_PATHS,picker.value)){preferences.favored=picker.value;savePreferences()}});
}
function favoredChoice(choice){return preferences.favored!=='off'&&(choice.weapon===preferences.favored||choice.evolution===EVOLUTIONS.find(e=>e.weapon===preferences.favored)?.field)}
function showSettings(){
 if(!['menu','paused','end'].includes(mode))return;settingsReturn=mode;mode='settings';renderSettings();
}
function renderSettings(){
 if(mode!=='settings')return;
 const rows=[['sound','Sound'],['shake','Screen shake'],['numbers','Damage numbers'],['reduced','Reduced decorative effects'],['waypoints','Objective pointer'],['warnings','Offscreen shot warnings'],['mirrored','Left-handed controls'],['aim','Gun target and range display']];
 const sameView=!!document.getElementById('settingsBack')?.isConnected,scroll=sameView?panel.scrollTop:0;
 const opened=id=>sameView&&document.getElementById(id)?.open?' open':'';
 const buttons=keys=>`<div class="result-actions">${rows.filter(([key])=>keys.includes(key)).map(([key,label])=>`<button class="btn secondary" id="pref-${key}" aria-pressed="${preferences[key]}">${label}: ${preferences[key]?'ON':'OFF'}</button>`).join('')}</div>`;
 show(`<div class="eyebrow">PHONE COMFORT</div><h1 style="font-size:44px">SETTINGS</h1><p>Open a section to adjust your phone setup. Changes apply immediately.</p><button class="btn" id="settingsBack">${settingsReturn==='paused'?'BACK TO PAUSE':settingsReturn==='end'?'BACK TO RESULTS':'MAIN MENU'}</button><details class="medal-goals" id="settingsAudio"${opened('settingsAudio')}><summary>AUDIO &amp; VOLUME</summary>${buttons(['sound'])}${audioControls()}</details><details class="medal-goals" id="settingsControls"${opened('settingsControls')}><summary>CONTROLS &amp; WARNINGS</summary><p>Choose your thumb layout and optional markers. Core enemy aim lines stay visible.</p>${buttons(['mirrored','waypoints','warnings','aim'])}</details><details class="medal-goals" id="settingsVisuals"${opened('settingsVisuals')}><summary>VISUALS &amp; EFFECTS</summary>${runHudStylePicker()}${fieldActorStylePicker()}${fieldWorldStylePicker()}${buttons(['shake','numbers','reduced'])}</details><details class="medal-goals" id="settingsBuild"${opened('settingsBuild')}><summary>UPGRADE HIGHLIGHT</summary>${favoredPicker()}</details>${performanceSettings()}${settingsReturn!=='paused'?'<details class="medal-goals"><summary>RECORD BACKUPS</summary><p>Keep a copy before changing game files, browsers or devices.</p><button class="btn secondary" id="backupOpen">SAVE / RESTORE BACKUP</button></details>':''}<p class="muted">${mainPerfTest?'Temporary test settings; normal settings return on exit.':preferences.readOnly?'A newer preferences file is present; changes last for this visit.':preferences.available?'Preferences saved in this browser.':'Storage unavailable; changes last for this visit.'}</p>`);
 panel.scrollTop=scroll;
 const worldPicker=document.getElementById('fieldWorldStyle');worldPicker.value=preferences.scenery;worldPicker.addEventListener('change',()=>{if(worldPicker.isConnected&&mode==='settings')selectFieldWorld(worldPicker.value)});
 const actorPicker=document.getElementById('fieldActorStyle');actorPicker.value=fieldStyle();actorPicker.addEventListener('change',()=>{if(actorPicker.isConnected&&mode==='settings')selectFieldActors(actorPicker.value)});const hudPicker=document.getElementById('runHudStyle');hudPicker.value=preferences.hud;hudPicker.addEventListener('change',()=>{if(hudPicker.isConnected&&mode==='settings')selectRunHud(hudPicker.value)});bindAudioControls();bindFavoredPicker();for(const [key] of rows)bindPress(document.getElementById('pref-'+key),()=>{if(mode!=='settings')return;preferences[key]=!preferences[key];if(key==='mirrored')applyTouchLayout();if(key==='sound'){musicOn=preferences.sound;applyAudioMix()}if(key==='shake'&&!preferences.shake)shake=0;savePreferences();renderSettings()});
 bindPress(document.getElementById('perfToggle'),togglePerformance);bindPress(document.getElementById('perfReset'),resetPerformance);bindPress(document.getElementById('perfReport'),showBenchmark);
 if(document.getElementById('backupOpen'))bindPress(document.getElementById('backupOpen'),showBackup);bindPress(document.getElementById('settingsBack'),closeSettings);
}
// Phone diagnostics are opt-in, session-only, and never affect records or combat.
function freshPerformance(enabled=false){return{enabled,samples:[],cursor:0,lastFrame:null,lastHud:-Infinity,totalFrames:0,totalMs:0,slowFrames:0,maxMs:0,peaks:{}}}
function breakPerformanceSegment(){diagnostics.lastFrame=null;diagnostics.lastHud=-Infinity;perfHud.style.display='none'}
function sceneCounts(){return{enemies:enemies.length,xpGems:gems.length,gunShots:bullets.length,hostileShots:hostileShots.length,particles:particles.length,floatingText:texts.length,lightning:lightning.length,bottles:bottles.length,fires:fires.length,bladeCooldowns:bladeHits.size,burnCooldowns:burnHits.size}}
function performanceSnapshot(){
 const sorted=[...diagnostics.samples].sort((a,b)=>a-b),n=sorted.length,sum=sorted.reduce((a,b)=>a+b,0);
 return Object.freeze({enabled:diagnostics.enabled,frames:diagnostics.totalFrames,seconds:diagnostics.totalMs/1000,averageFps:diagnostics.totalMs?1000*diagnostics.totalFrames/diagnostics.totalMs:null,recentFrames:n,recentFps:n?1000*n/sum:null,p95Ms:n?sorted[Math.ceil(n*.95)-1]:null,slowFrames:diagnostics.slowFrames,maxMs:diagnostics.maxMs,counts:Object.freeze(sceneCounts()),peaks:Object.freeze({...diagnostics.peaks})});
}
function recordPerformanceFrame(t){
 if(!diagnostics.enabled)return;
 if(mode!=='play'||document.hidden||!Number.isFinite(t)||mainPerfTest&&elapsed-mainPerfTest.startedAt<5){breakPerformanceSegment();return}
 const previous=diagnostics.lastFrame;diagnostics.lastFrame=t;
 const counts=sceneCounts();for(const [key,value] of Object.entries(counts))diagnostics.peaks[key]=Math.max(diagnostics.peaks[key]||0,value);
 if(previous!==null&&t>previous){const ms=t-previous;if(diagnostics.samples.length<300)diagnostics.samples.push(ms);else diagnostics.samples[diagnostics.cursor]=ms;diagnostics.cursor=(diagnostics.cursor+1)%300;diagnostics.totalFrames++;diagnostics.totalMs+=ms;diagnostics.maxMs=Math.max(diagnostics.maxMs,ms);if(ms>50)diagnostics.slowFrames++}
 if(t-diagnostics.lastHud>=1000){diagnostics.lastHud=t;const row=performanceSnapshot();perfHud.textContent=`${row.recentFps===null?'Measuring…':row.recentFps.toFixed(0)+' FPS · p95 '+row.p95Ms.toFixed(1)+' ms'}\n${counts.enemies} enemies · ${counts.xpGems} XP gems`;perfHud.style.display='block'}
}
function togglePerformance(){if(mode!=='settings')return;if(diagnostics.enabled){diagnostics.enabled=false;breakPerformanceSegment()}else{diagnostics=freshPerformance(true)}renderSettings()}
function resetPerformance(){if(mode!=='settings')return;diagnostics=freshPerformance(diagnostics.enabled);breakPerformanceSegment();renderSettings()}
function performanceSettings(){
 const row=performanceSnapshot(),value=(n,suffix='')=>n===null?'Not measured':n.toFixed(1)+suffix;
 return `<details class="medal-goals" id="settingsPerformance"${document.getElementById('settingsPerformance')?.open?' open':''}><summary>PHONE PERFORMANCE · ${diagnostics.enabled?'ON':'OFF'}</summary><p>Optional readout, off on each page load. Measures active game frame intervals, including drawing and browser scheduling. Pauses, upgrade reading and background time are excluded. Reset before a new test condition.</p><p>${row.frames} measured intervals · ${value(row.recentFps,' recent FPS')} · ${value(row.p95Ms,' ms p95')} · ${row.slowFrames} intervals over 50 ms</p><div class="result-actions"><button class="btn secondary" id="perfToggle">${diagnostics.enabled?'STOP MEASURING':'START MEASURING'}</button><button class="btn secondary" id="perfReset">RESET MEASUREMENTS</button><button class="btn secondary" id="perfReport">BENCHMARK REPORT TXT</button></div><p class="muted">Latest 300 intervals for recent FPS/p95; whole capture for slow intervals and peaks. Includes a small measurement cost. Object counts are not memory usage. Measurements are temporary and separate from saved runs.</p></details>`;
}
function showBenchmark(returnTo='settings'){
 if(mode!=='settings'&&!(mode==='paused'&&(streetSession||bossLab||mainPerfTest)&&returnTo==='paused'))return;const back=mode==='paused'?'paused':'settings';
 const held=runLogged&&settingsReturn==='end'?runResult?.perfTest:null,row=held?.row||performanceSnapshot(),trial=streetSession?Object.freeze({id:streetTrial,name:streetTrialInfo().name,slots:streetTrialInfo().slots}):null;benchmarkCapture=Object.freeze({row,trial,...(mainPerfTest||held?{perfTest:held||mainPerfSnapshot()}:{}),...(bossLab?{bossTest:bossTestSnapshot()}:{}),returnTo:back,scenery:held?'Held performance test · '+held.scenery:fieldWorldStatus(),actorArt:held?held.actorArt:!training||bossLab||mainPerfTest?fieldArtStatus():null,presentation:mainPerfTest||held?'Main game performance test · overhead':bossLab?'Boss testing · overhead · '+fieldStyle():streetSession?((streetAngled?'Angled intersection prototype · '+(streetDressed?'textured environment':'simple environment'):'Intersection · overhead comparison')+' · '+(streetHudPolished?'composed HUD':'classic HUD')):sampleLookActive()?'Grounded realism study':!training&&preferences.hud==='composed'?'Composed run HUD':'Classic',time:elapsed,training,survivor:runSurvivor,route:runRoute,rule:runRule,build:buildSummary(),level,viewport:held?held.viewport:`${W} × ${H} CSS px · ${W>=H?'landscape':'portrait'} · canvas DPR ${DPR}`,reduced:held?held.reduced:preferences.reduced,mirrored:held?held.mirrored:preferences.mirrored});mode='benchmark';
 show(`<div class="eyebrow">PHONE PERFORMANCE</div><h1 style="font-size:38px">BENCHMARK REPORT</h1><p>Capture held. Add your device/browser and what you noticed, then download or copy the text. No information is sent automatically.</p><label for="benchmarkDevice">DEVICE AND BROWSER</label><input class="save-text" id="benchmarkDevice" maxlength="160" placeholder="Example: S21 Ultra · Brave"><label for="benchmarkNotes">TEST CONDITIONS AND OBSERVATIONS</label><textarea class="save-text" id="benchmarkNotes" maxlength="500" rows="3" placeholder="Example: busy overtime; warm phone; brief hitch during a blast"></textarea><label for="benchmarkText">REPORT TEXT</label><textarea class="save-text" id="benchmarkText" rows="12" readonly></textarea><button class="btn" id="benchmarkDownload">DOWNLOAD REPORT TXT</button><p id="benchmarkMessage" role="status"></p><button class="btn secondary" id="benchmarkBack">${back==='paused'?'BACK TO PAUSE':'BACK TO SETTINGS'}</button>`);
 const refresh=()=>{if(mode==='benchmark')document.getElementById('benchmarkText').value=benchmarkText()};for(const id of ['benchmarkDevice','benchmarkNotes'])document.getElementById(id).addEventListener('input',refresh);refresh();bindPress(document.getElementById('benchmarkDownload'),downloadBenchmark);bindPress(document.getElementById('benchmarkBack'),()=>{if(mode==='benchmark'){const origin=benchmarkCapture?.returnTo;benchmarkCapture=null;if(origin==='paused'){mode='play';pause()}else{mode='settings';renderSettings()}}});
}
function benchmarkText(){
 if(!benchmarkCapture)return '';
 const c=benchmarkCapture,r=c.row,device=String(document.getElementById('benchmarkDevice')?.value||'Not supplied').slice(0,160),notes=String(document.getElementById('benchmarkNotes')?.value||'Not supplied').slice(0,500),value=(n,suffix='')=>n===null?'Unavailable':n.toFixed(2)+suffix;
 return ['LAST STAND: AFTER DARK — ALPHA 0.86 PHONE BENCHMARK',`Device/browser (owner supplied): ${device}`,`Observations (owner supplied): ${notes}`,`Context: ${c.training?'Training · unscored':'Normal run'} · ${fmt(c.perfTest?c.perfTest.duration:c.time)} active ${c.perfTest?'test':'run'} time · level ${c.level}`,`${survivorById(c.survivor).name} · ${routeById(c.route).name} · ${ruleById(c.rule).name}`,`Build at capture: ${c.build}`,...mainPerfReportLines(c.perfTest),`Presentation at capture: ${c.presentation}`,...(c.bossTest?[`${c.bossTest.boss==='riot'?'Developer guard drill':c.bossTest.boss==='spitter'?'Developer Spitter drill':c.bossTest.boss==='howler'?'Developer Howler drill':c.bossTest.boss==='lobber'?'Developer Lobber drill':c.bossTest.boss==='hunter'?'Developer Blackout Hunter drill':'Boss test'}: ${c.bossTest.boss} · ${c.bossTest.weapon} · evolution ${c.bossTest.evolved?'ON':'OFF'} · attacks ${c.bossTest.attacks?'ON':'OFF'} · HP safe`]:[]),...(c.actorArt?[`Actor art at capture: ${c.actorArt}`]:[]),`Scenery at capture: ${c.scenery}`,...(c.trial?[`Scene trial: ${c.trial.name} · ${c.trial.slots} infected slots + Breaker · safe HP · unscored`]:[]),`Viewport at capture: ${c.viewport}`,`Reduced effects: ${c.reduced?'ON':'OFF'} · Mirrored controls: ${c.mirrored?'ON':'OFF'}`,`Measuring at capture: ${r.enabled?'ON':'OFF'}`,`Measured intervals: ${r.frames} · sampled active seconds: ${r.seconds.toFixed(2)}`,`Capture average: ${value(r.averageFps,' FPS')}`,`Recent window: ${r.recentFrames} intervals · ${value(r.recentFps,' FPS')} · p95 ${value(r.p95Ms,' ms')}`,`Capture intervals over 50 ms: ${r.slowFrames} · maximum ${r.maxMs.toFixed(2)} ms`,'','SCENE OBJECT COUNTS (current / capture peak; not memory bytes)',...Object.entries(r.counts).map(([key,n])=>`${key}: ${n} / ${r.peaks[key]||0}`),'','Raw requestAnimationFrame intervals; simulation delta remains capped at 35 ms.','Only active play, including unscored practice when used. Modal/background gaps excluded.','Recent FPS/p95 uses at most 300 intervals; totals/peaks are since reset or new run.','No samples means unavailable, not an assumed frame rate. Reset between orientations/test conditions.','Counts do not measure JavaScript heap, GPU memory, temperature or battery.','Diagnostic overhead is included; use the same setting when comparing builds.','This temporary report is not saved to Run Log or backup. Share it yourself.',''].join('\n');
}
function downloadBenchmark(){
 if(mode!=='benchmark'||!benchmarkCapture||document.hidden)return;
 try{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([benchmarkText()],{type:'text/plain;charset=utf-8'}));a.download='Last_Stand_After_Dark_Alpha_0_86_Phone_Benchmark.txt';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);document.getElementById('benchmarkMessage').textContent='Download requested. You can also select and copy the text.'}catch{document.getElementById('benchmarkMessage').textContent='Select and copy the text if downloading is unavailable.'}
}
function applyTouchLayout(){
 clearInput();document.getElementById('hud').setAttribute('data-mirrored',String(preferences.mirrored));document.getElementById('touch').setAttribute('data-mirrored',String(preferences.mirrored));
}
function closeSettings(){
 if(mode!=='settings')return;if(settingsReturn==='end'&&runResult)showRunResult();else if(settingsReturn==='paused'){mode='play';pause()}else menu();
}

const EVOLUTIONS=Object.freeze([
  Object.freeze({field:'rail',weapon:'pierce',name:'Railstorm',hint:'Piercing Rounds 3/3 → eight-target rail shots.'}),
  Object.freeze({field:'thunder',weapon:'arc',name:'Thunderweb',hint:'Chain Lightning 3/3 → two branches, up to eight enemies.'}),
  Object.freeze({field:'reaper',weapon:'blades',name:'Reaper Ring',hint:'Orbiting Blades 3/3 → six blades that block pink shots.'}),
  Object.freeze({field:'wildfire',weapon:'molotov',name:'Wildfire',hint:'Molotov 3/3 → up to two spread-out, larger burns; a short gap between volleys.'})
]);
const c=document.getElementById('game'),g=c.getContext('2d'),panel=document.getElementById('panel'),modal=document.getElementById('modal'),perfHud=document.getElementById('performanceHud');let W,H,DPR,last=0,titleArtwork=null,titleFocused=true,streetSession=false,streetTrial='standard',streetTrialChoice='standard',streetAngled=true,streetDressed=true,streetHudPolished=true,streetHudPortraitImage=null,streetMotion=new WeakMap(),streetCombat=freshStreetCombat(),artSession=false,artLook=true,sampleArtworkData=null,sampleArtwork={},sampleAudioVoices=0,diagnostics=freshPerformance(),benchmarkCapture=null,reviewedRun=null,buildProgress=null,paceBuckets=[],locker=null,lockerOffered=false,lockersUsed=0,preferences=readPreferences(),training=false,mainPerfTest=null,bossLab=false,bossLabFire=false,bossLabField=true,bossLabWeapon='gun',trainingScenario='targets',practiceLedger=emptyWeaponLedger(),practiceStartedAt=0,practiceHits=0,practiceTargets=0,practiceThreats=0,practiceThreatReadyAt=0,practiceLastThreat='none',trainingWeapon='pierce',trainingEvolved=false,trainingClock=0,presetSlot=0,mapRange=600,guideReturn='menu',manualReturn='menu',settingsReturn='menu',backupReturn='menu',pendingRestore=null,restoreInput='',backupMessage='',runTimeline=[],timelineDropped=0,trackedMedal='off',objectiveFocus='auto',journalView={outcome:'all',survivor:'all',rule:'all',route:'all',sort:'newest'},elapsed=0,spawn=0,mode='menu',enemies=[],bullets=[],particles=[],gems=[],texts=[],obstacles=[],barrels=[],blastRings=[],barrelClock=0,barricades=[],barricadeClock=18,barricadesCleared=0,weaponLedger=emptyWeaponLedger(),decoy=null,decoyCharges=1,decoysUsed=0,decoyLured=0,shockDrums=[],shockClock=40,shocksUsed=0,shockStuns=0,enemyTally=emptyEnemyTally(),damageTaken=0,hitsTaken=0,armorPrevented=0,lastThreat='none',nextScrapAt=0,scrapRefreshes=0,scrapRecovered=0,barrelsBlown=0,blastKills=0,lightning=[],bottles=[],fires=[],burnHits=new Map(),molotovClock=.2,burnKills=0,bladeHits=new Map(),chainClock=.2,nextRushAt=45,rushPhase='waiting',rushUntil=0,rushAxis='horizontal',rushClock=0,rushSpawned=0,rushPendingReward=false,rushesSurvived=0,bonusChoices=0,bonusKinds=[],rerollsLeft=1,banishesLeft=1,banished=new Set(),upgradeOffer=null,selectedRoute='downtown',runRoute='downtown',selectedRule='standard',runRule='standard',selectedContract='none',runContract='none',contractCompleted=false,patrol=[],patrolVisited=0,salvage=null,nextSalvageAt=15,salvagesSecured=0,rescue=null,rescueOffered=false,nextRescueAt=120,rescuesCompleted=0,rescueArrival=null,exitBeacon=null,exitAt=180,overtime=0,runOutcome='',reliefLabel='BREAKER DOWN',nextBossAt=90,bossWarned=false,bossesDefeated=0,wardensDefeated=0,harvestersDefeated=0,activeBoss=null,reliefUntil=0,shake=0,killCount=0,level=1,xp=0,nextXp=8,upgrades=0,record=readRecord(),journal=readJournal(),selectedSurvivor=journal.selected,runSurvivor='survivor',runLogged=false,runResult=null,runComparison=null,runRecordSaved=true,bestiaryReturn='menu',weaponGuideReturn='menu',bestiaryFilter='all',convoy=null,nextConvoyAt=25,convoysStopped=0,convoyRewardPending=false,supplyDrop=null,nextDropAt=70,dropsCollected=0,dropXpRecovered=0,supplyCache=null,nextSupplyAt=20,suppliesCollected=0,supplyHealing=0,hostileShots=[],nextSpitterAt=65,spittersDefeated=0,spitterIntroduced=false,nextRiotAt=150,riotsDefeated=0,riotIntroduced=false,nextHowlerAt=210,howlerIntroduced=false,nextLobberAt=255,lobberIntroduced=false,lobberBombs=[],musicOn=preferences.sound,audioCtx=null,audioMix=null,activeAudioVoices=0,effectAudioVoices=0,musicTrack={ctx:null,buffer:null,loading:null,node:null,tail:null,offset:0,preview:false,error:false};const p={x:0,y:0,r:16,hp:100,max:100,speed:210,damage:18,fire:.33,fireClock:0,range:720,proj:1,bulletSpeed:600,magnet:80,dash:0,dashCd:0,inv:0,regen:0,pierce:0,arc:0,blades:0,molotov:0,rail:false,thunder:false,reaper:false,wildfire:false,secondWind:false,windSpent:false,capacitor:0,armor:0,decoyPouch:false,gunPriority:'nearest',steady:false,stillTime:0,evasive:false,evasiveUntil:0,arcRelay:false,bladeReach:false};const keys={},touch={x:0,y:0,id:null},lastMove={x:0,y:1},rand=(a,b)=>a+Math.random()*(b-a),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),clamp=(n,a,b)=>Math.max(a,Math.min(b,n));let cam={x:0,y:0};function resize(){DPR=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;c.width=W*DPR;c.height=H*DPR;g.setTransform(DPR,0,0,DPR,0,0)}addEventListener('resize',resize);resize();
function readRecord(){try{const value=Number(localStorage.getItem('ls-record'));return Number.isFinite(value)&&value>=0?value:0}catch{return 0}}
function saveRecord(){try{const value=String(record);localStorage.setItem('ls-record',value);return localStorage.getItem('ls-record')===value}catch{return false}}
function survivorById(id){return SURVIVORS.find(role=>role.id===id)||SURVIVORS[0]}
function contractById(id){return CONTRACTS.find(contract=>contract.id===id)||null}
function cleanContract(row){
  const goal=contractById(row.contract);
  if(!goal)return{contract:row.contract==='none'?'none':null,contractProgress:0,contractCompleted:false};
  const progress=safeCount(row.contractProgress,goal.target);
  return{contract:goal.id,contractProgress:progress,contractCompleted:row.contractCompleted===true&&progress===goal.target};
}
function contractProgress(){
  const goal=contractById(runContract);if(!goal)return 0;
  const count={resupply:lockersUsed,evolution:EVOLUTIONS.filter(e=>p[e.weapon]===3&&p[e.field]).length,patrol:patrolVisited,lure:decoyLured,shock:shocksUsed,demolition:barrelsBlown,salvage:salvagesSecured,bosses:bossesDefeated,rescue:rescuesCompleted,convoy:convoysStopped,fire:burnKills}[runContract]||0;
  return Math.min(goal.target,count);
}
function currentContractStats(){return{contract:runContract,contractProgress:contractProgress(),contractCompleted}}
function contractSummary(stats=currentContractStats()){
  const goal=contractById(stats.contract);if(!goal)return 'No contract selected.';
  const progress=safeCount(stats.contractProgress,goal.target),complete=stats.contractCompleted===true&&progress===goal.target;
  return `${goal.name} · ${progress}/${goal.target} · ${complete?'COMPLETED':goal.goal}`;
}
function contractPanel(stats=currentContractStats()){
  return contractById(stats.contract)?`<p class="contract-note">RUN CONTRACT · ${contractSummary(stats)}</p>`:'';
}
function refreshContract(){
  const goal=contractById(selectedContract);document.getElementById('contractPick').value=selectedContract;
  document.getElementById('contractDetail').textContent=goal?`${goal.goal}${goal.hint?' '+goal.hint:''} Reward: one bonus upgrade this run. No time limit or penalty.`:'Optional. Choose a goal for this run, or deploy without one.';refreshDeploymentSummary();
}
function selectContract(id){
  if(mode!=='roster'||id!=='none'&&!contractById(id))return;
  selectedContract=id;refreshContract();
}
function seedPatrol(){
 if(runContract!=='patrol')return;
 for(let index=0;index<3;index++){
  let chosen=null,fallback=null;
  for(let i=0;i<64;i++){const angle=index*Math.PI*2/3+i*2.3999632297,r=280+Math.floor(i/16)*120,b={x:Math.cos(angle)*r,y:Math.sin(angle)*r,r:20,number:index+1,visited:false};
   if(nearBarricade(b,40)||barrels.some(a=>dist(a,b)<65)||shockDrums.some(a=>dist(a,b)<65)||patrol.some(a=>dist(a,b)<140))continue;
   if(!fallback)fallback=b;if(obstacles.some(o=>pointRectDistance(b,o)<40))continue;chosen=b;break;
  }
  if(!chosen&&fallback){chosen=fallback;obstacles=obstacles.filter(o=>pointRectDistance(chosen,o)>=40)}
  if(chosen)patrol.push(chosen);
 }
}
function patrolTarget(){return patrol.find(b=>!b.visited)||null}
function updatePatrol(from){
 if(mode!=='play'||p.hp<=0||runContract!=='patrol')return;
 for(const b of patrol)if(!b.visited&&segmentDistance(b,from,p)<=b.r+p.r){b.visited=true;patrolVisited++;recordRunEvent('patrol');toast(`PATROL ${patrolVisited}/3`,1500)}
}
function renderPatrol(){
 for(const b of patrol){if(Math.abs(b.x-p.x)>W/2+60||Math.abs(b.y-p.y)>H/2+60)continue;g.save();g.strokeStyle=b.visited?'#679c86':'#84d7ff';g.fillStyle='#143042aa';g.lineWidth=2;g.beginPath();g.arc(b.x,b.y,b.r,0,Math.PI*2);g.fill();g.stroke();g.fillStyle=b.visited?'#98d9b5':'#d8f5ff';g.font='bold 16px system-ui';g.textAlign='center';g.fillText(b.visited?'✓':String(b.number),b.x,b.y+6);g.font='bold 10px system-ui';g.fillText(b.visited?'VISITED':'PATROL',b.x,b.y-31);g.restore()}
}
function checkContract(){
  if(mode!=='play'||p.hp<=0||contractCompleted||!contractById(runContract)||contractProgress()<contractById(runContract).target)return;
  contractCompleted=true;recordRunEvent('contract');bonusChoices++;bonusKinds.push('contract');
  toast('CONTRACT COMPLETE • BONUS UPGRADE',2500);sound(620,.15,'sine',.03);
}
function cleanPreset(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||!SURVIVORS.some(r=>r.id===raw.survivor)||!ROUTES.some(r=>r.id===raw.route)||!RUN_RULES.some(r=>r.id===raw.rule)||raw.contract!=='none'&&!contractById(raw.contract))return null;
 return{survivor:raw.survivor,route:raw.route,rule:raw.rule,contract:raw.contract};
}
function cleanPresets(raw){return Array.from({length:3},(_,i)=>cleanPreset(Array.isArray(raw)?raw[i]:null))}
function refreshPresets(){
 if(mode!=='roster')return;const row=journal.presets[presetSlot];document.getElementById('presetSlot').value=String(presetSlot);document.getElementById('presetDetail').textContent=row?`${survivorById(row.survivor).name} · ${routeById(row.route).name} · ${ruleById(row.rule).name} · ${contractById(row.contract)?.name||'No contract'}`:'Empty slot. Save your current roster setup here.';
}
function saveDeployment(){
 if(mode!=='roster'||document.hidden)return;journal.presets[presetSlot]={survivor:selectedSurvivor,route:selectedRoute,rule:selectedRule,contract:selectedContract};const saved=saveJournal();refreshPresets();toast(saved?'DEPLOYMENT PRESET SAVED':'PRESET SAVED FOR THIS VISIT',1800);
}
function loadDeployment(){
 if(mode!=='roster'||document.hidden)return;const row=journal.presets[presetSlot];if(!row)return;selectedSurvivor=row.survivor;selectedRoute=row.route;selectedRule=row.rule;selectedContract=row.contract;journal.selected=selectedSurvivor;saveJournal();refreshRoster();toast('SETUP LOADED • REVIEW THEN DEPLOY',1800);
}
function presetControls(){return `<details class="medal-goals"><summary>DEPLOYMENT PRESETS · 3 SLOTS</summary><div class="contract-picker"><label for="presetSlot">PRESET SLOT</label><select id="presetSlot"><option value="0">Slot 1</option><option value="1">Slot 2</option><option value="2">Slot 3</option></select><p id="presetDetail"></p></div><div class="result-actions"><button class="btn secondary" id="presetSave">SAVE CURRENT SETUP</button><button class="btn secondary" id="presetLoad">LOAD SLOT</button></div><p class="muted">Saves survivor, route, rules and contract only. Saving replaces this slot. Loading fills the roster; review and press Deploy yourself. No upgrades, charges or active run are saved. Included in Save Backup.</p></details>`}
function freshJournal(){return{presets:[null,null,null],bestiary:emptyEnemyTally(),version:1,selected:'survivor',totals:{runs:0,extractions:0,breakers:0,wardens:0,harvesters:0,blackouts:0,bestOvertime:0},history:[],available:true,readOnly:false}}
function safeCount(value,max=1e9,min=0){return typeof value==='number'&&Number.isFinite(value)?Math.max(min,Math.min(max,Math.floor(value))):min}
function cleanCombatStat(value,min=0){return typeof value==='number'&&Number.isFinite(value)&&value>=min?Math.max(min,Math.round(Math.min(1e9,value)*1e6)/1e6):null}
function savedCombatStats(row){return Object.fromEntries(['hp','max','damage','fire','speed','regen','magnet','bulletSpeed'].map(key=>[key,cleanCombatStat(row[key],key==='fire'?1e-6:0)]))}
function cleanPace(raw,time){
 if(!Array.isArray(raw))return null;const rows=[];
 for(const b of raw.slice(-60)){if(!b||typeof b!=='object'||!Number.isInteger(b.minute)||b.minute<0||b.minute>Math.floor(time/60)||rows.length&&b.minute<=rows[rows.length-1].minute||typeof b.kills!=='number'||!Number.isFinite(b.kills)||b.kills<0||typeof b.hpLost!=='number'||!Number.isFinite(b.hpLost)||b.hpLost<0)continue;rows.push({minute:b.minute,kills:safeCount(b.kills),hpLost:cleanMeasure(b.hpLost)})}return rows;
}
function recordPace(kills=0,hpLost=0){
 if(training||!['play','extraction'].includes(mode))return;const minute=Math.floor(elapsed/60);let b=paceBuckets[paceBuckets.length-1];
 if(!b||b.minute!==minute){b={minute,kills:0,hpLost:0};paceBuckets.push(b);paceBuckets=paceBuckets.filter(row=>row.minute>=minute-59)}b.kills+=kills;b.hpLost+=hpLost;
}
function paceSnapshot(){
 const lastMinute=Math.floor(elapsed/60),rows=[];for(let minute=Math.max(0,lastMinute-59);minute<=lastMinute;minute++){const b=paceBuckets.find(row=>row.minute===minute);rows.push(Object.freeze({minute,kills:b?.kills||0,hpLost:Math.round((b?.hpLost||0)*10)/10}))}return Object.freeze(rows);
}
function pacePanel(rows){
 if(!rows?.length)return '<details class="medal-goals"><summary>RUN PACE</summary><p class="muted">Minute-by-minute data unavailable in this older run.</p></details>';
 const maxKills=Math.max(0,...rows.map(b=>b.kills)),maxLost=Math.max(0,...rows.map(b=>b.hpLost)),width=560/rows.length;
 return `<details class="medal-goals"><summary>RUN PACE</summary><p>Eliminations and HP lost to hits per active minute. Latest ${rows.length} minute buckets; the final minute may be partial. Gold/pink bars use separate scales.</p><svg viewBox="0 0 600 182" role="img" aria-label="Run pace: gold eliminations, pink HP lost to hits" style="width:100%;height:auto;background:#101b29;border-radius:8px"><title>Run pace · peak ${maxKills} eliminations / ${maxLost} HP lost per minute</title><path d="M20 150H580 M20 85H580 M20 20H580" stroke="#34465b" fill="none"/>${rows.map((b,i)=>{const x=20+i*width,killHeight=b.kills/Math.max(1,maxKills)*130,hurtHeight=b.hpLost/Math.max(1,maxLost)*130;return `<rect x="${x.toFixed(2)}" y="${(150-killHeight).toFixed(2)}" width="${(width*.42).toFixed(2)}" height="${killHeight.toFixed(2)}" fill="#e9ba65"/><rect x="${(x+width*.45).toFixed(2)}" y="${(150-hurtHeight).toFixed(2)}" width="${(width*.42).toFixed(2)}" height="${hurtHeight.toFixed(2)}" fill="#ee829e"/>${i%Math.ceil(rows.length/10)===0?`<text x="${x.toFixed(2)}" y="174" fill="#c5cfda" font-size="11">${b.minute+1}</text>`:''}`}).join('')}</svg><p class="muted">Minute number along the bottom. This shows your recorded combat, not enemy spawn counts. Armor/protection, healing and movement affect the outcome.</p><table class="weapon-ranks"><thead><tr><th>Minute</th><th>Eliminations</th><th>HP lost to hits</th></tr></thead><tbody>${rows.map(b=>`<tr><th>${b.minute+1}</th><td>${b.kills}</td><td>${b.hpLost}</td></tr>`).join('')}</tbody></table></details>`;
}
// Bounded measurements only: four weapon paths, three rank times and one evolution each.
function freshBuildProgress(){return{collected:0,xpChoices:0,bonusChoices:0,firstChoice:null,paths:Object.fromEntries(EVOLUTIONS.map(e=>[e.weapon,{ranks:[null,null,null],evolution:null}]))}}
function recordCollectedXp(value){if(!training&&mode==='play'&&Number.isFinite(value)&&value>0)buildProgress.collected+=value}
function recordBuildChoice(choice,reward){
 if(training||mode!=='upgrade')return;
 if(buildProgress.firstChoice===null)buildProgress.firstChoice=elapsed;
 buildProgress[reward?'bonusChoices':'xpChoices']++;
 if(choice.weapon){const rank=p[choice.weapon]-1;if(rank>=0&&rank<3)buildProgress.paths[choice.weapon].ranks[rank]=elapsed}
 if(choice.evolution){const e=EVOLUTIONS.find(e=>e.field===choice.evolution);if(e)buildProgress.paths[e.weapon].evolution=elapsed}
}
function buildProgressSnapshot(){
 if(training||!buildProgress)return null;
 return Object.freeze({...buildProgress,xp,nextXp,onStreet:gems.reduce((total,a)=>total+a.value,0),paths:Object.freeze(Object.fromEntries(EVOLUTIONS.map(e=>{const row=buildProgress.paths[e.weapon];return[e.weapon,Object.freeze({ranks:Object.freeze([...row.ranks]),evolution:row.evolution})]})))});
}
function cleanBuildProgress(raw,time){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return null;
 const fields=['collected','xpChoices','bonusChoices','xp','nextXp','onStreet'];
 if(fields.some(key=>!Number.isInteger(raw[key])||raw[key]<0||raw[key]>1e9)||raw.nextXp<1)return null;
 const validTime=value=>typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=Math.min(time,86400);
 const firstChoice=validTime(raw.firstChoice)?raw.firstChoice:null,paths={};
 for(const e of EVOLUTIONS){const row=raw.paths?.[e.weapon],ranks=[null,null,null];let previous=firstChoice;
  for(let i=0;i<3;i++){const value=row?.ranks?.[i];if(previous===null||!validTime(value)||value<previous)break;ranks[i]=value;previous=value}
  paths[e.weapon]={ranks,evolution:ranks[2]!==null&&validTime(row?.evolution)&&row.evolution>=ranks[2]?row.evolution:null};
 }
 return{...Object.fromEntries(fields.map(key=>[key,raw[key]])),firstChoice,paths};
}
function buildProgressLines(row){
 if(!row)return ['Build progression unavailable in this older run.'];
 const when=value=>value===null?'Not chosen':fmt(value);
 return[`First upgrade chosen: ${when(row.firstChoice)}`,`Upgrades chosen: ${row.xpChoices} from XP · ${row.bonusChoices} bonus`, `XP collected: ${row.collected} · XP still on the street: ${row.onStreet}`,`Progress toward next XP upgrade: ${row.xp} / ${row.nextXp}`,...EVOLUTIONS.map(e=>{const path=row.paths[e.weapon];return `${e.name} path: ranks 1 / 2 / 3 at ${path.ranks.map(when).join(' / ')} · Evolution: ${when(path.evolution)}`})];
}
function buildProgressPanel(row){return `<details class="medal-goals"><summary>BUILD PROGRESSION</summary><p class="muted">Active run time when you chose each upgrade. Bonus choices do not spend XP. Collected XP includes supply-drop recovery; street XP is what remains at the end. These are your choices, not the earliest an upgrade was offered.</p><div class="field-list">${buildProgressLines(row).map(line=>`<div><p>${line}</p></div>`).join('')}</div></details>`}
function cleanRunEntry(row){
  if(!row||typeof row!=='object'||row.training===true||!['extracted','defeated','abandoned'].includes(row.outcome)||typeof row.time!=='number'||!Number.isFinite(row.time)||row.time<0)return null;
  return{progression:cleanBuildProgress(row.progression,row.time),pace:cleanPace(row.pace,row.time),bladeReach:row.bladeReach===true,arcRelay:row.arcRelay===true,lockers:typeof row.lockers==='number'?safeCount(row.lockers,1):null,evasive:typeof row.evasive==='boolean'?row.evasive:null,patrols:typeof row.patrols==='number'?safeCount(row.patrols,3):null,harvesters:typeof row.harvesters==='number'?safeCount(row.harvesters):null,steady:row.steady===true,steadyReady:row.steady===true&&row.steadyReady===true,route:ROUTES.some(r=>r.id===row.route)?row.route:null,timeline:cleanTimeline(row.timeline),timelineDropped:safeCount(row.timelineDropped),trackedMedal:row.trackedMedal==='off'||MEDAL_TRACKERS.some(m=>m.id===row.trackedMedal)?row.trackedMedal:null,newDiscoveries:cleanDiscoveries(row.newDiscoveries),weapons:cleanWeaponLedger(row.weapons),gunPriority:['nearest','weakest','threats'].includes(row.gunPriority)?row.gunPriority:null,decoyPouch:row.decoyPouch===true,decoys:typeof row.decoys==='number'?safeCount(row.decoys):null,decoyLured:typeof row.decoyLured==='number'?safeCount(row.decoyLured):null,...savedCombatStats(row),shocks:typeof row.shocks==='number'?safeCount(row.shocks):null,shockStuns:typeof row.shockStuns==='number'?safeCount(row.shockStuns):null,rule:RUN_RULES.some(r=>r.id===row.rule)?row.rule:null,damageTaken:cleanMeasure(row.damageTaken),hitsTaken:typeof row.hitsTaken==='number'?safeCount(row.hitsTaken):null,armorPrevented:cleanMeasure(row.armorPrevented),lastThreat:knownThreat(row.lastThreat)?row.lastThreat:null,armor:safeCount(row.armor,3),capacitor:safeCount(row.capacitor,2),secondWind:row.secondWind===true,windSpent:row.secondWind===true&&row.windSpent===true,enemyTally:row.enemyTally&&typeof row.enemyTally==='object'&&!Array.isArray(row.enemyTally)?cleanEnemyTally(row.enemyTally):null,...cleanContract(row),survivor:survivorById(row.survivor).id,outcome:row.outcome,time:Math.min(86400,row.time),kills:safeCount(row.kills),level:safeCount(row.level,10000,1),breakers:safeCount(row.breakers),wardens:typeof row.wardens==='number'?safeCount(row.wardens):null,blackouts:safeCount(row.blackouts),overtime:safeCount(row.overtime,1e6),pierce:safeCount(row.pierce,3),arc:safeCount(row.arc,3),blades:safeCount(row.blades,3),molotov:safeCount(row.molotov,3),wildfire:row.wildfire===true&&safeCount(row.molotov,3)===3,scrapRefreshes:typeof row.scrapRefreshes==='number'?safeCount(row.scrapRefreshes):null,scrapRecovered:typeof row.scrapRecovered==='number'&&Number.isFinite(row.scrapRecovered)?Math.round(Math.max(0,Math.min(1e9,row.scrapRecovered))*10)/10:null,convoys:typeof row.convoys==='number'?safeCount(row.convoys):null,drops:typeof row.drops==='number'?safeCount(row.drops):null,dropXp:typeof row.dropXp==='number'?safeCount(row.dropXp):null,fireKills:typeof row.fireKills==='number'?safeCount(row.fireKills):null,proj:safeCount(row.proj,5,1),rail:row.rail===true&&safeCount(row.pierce,3)===3,thunder:row.thunder===true&&safeCount(row.arc,3)===3,reaper:row.reaper===true&&safeCount(row.blades,3)===3,barricades:typeof row.barricades==='number'?safeCount(row.barricades):null,barrels:typeof row.barrels==='number'?safeCount(row.barrels):null,blastKills:typeof row.blastKills==='number'?safeCount(row.blastKills):null,salvages:typeof row.salvages==='number'?safeCount(row.salvages):null,spitters:typeof row.spitters==='number'?safeCount(row.spitters):null,riotGuards:typeof row.riotGuards==='number'?safeCount(row.riotGuards):null,rescues:typeof row.rescues==='number'?safeCount(row.rescues):null,supplies:typeof row.supplies==='number'?safeCount(row.supplies):null,supplyHealing:typeof row.supplyHealing==='number'&&Number.isFinite(row.supplyHealing)?Math.round(Math.max(0,Math.min(1e9,row.supplyHealing))*10)/10:null};
}
function readJournal(){
  const result=freshJournal();let raw;
  try{raw=localStorage.getItem(JOURNAL_KEY)}catch{result.available=false;return result}
  if(!raw)return result;let data;try{data=JSON.parse(raw)}catch{return result}
  return normalizeJournal(data);
}
function normalizeJournal(data){
  const result=freshJournal();
  if(!data||typeof data!=='object'||Array.isArray(data))return result;
  if(data.version>1){result.available=false;result.readOnly=true;return result}
  if(data.version!==1)return result;
  result.presets=cleanPresets(data.presets);result.selected=survivorById(data.selected).id;result.bestiary=cleanEnemyTally(data.bestiary);
  if(Array.isArray(data.history))for(const row of data.history){const entry=cleanRunEntry(row);if(entry)result.history.push(entry);if(result.history.length===8)break}
  const totals=data.totals&&typeof data.totals==='object'?data.totals:{};
  result.totals={runs:Math.max(result.history.length,safeCount(totals.runs)),extractions:safeCount(totals.extractions),breakers:safeCount(totals.breakers),wardens:safeCount(totals.wardens),harvesters:safeCount(totals.harvesters),blackouts:safeCount(totals.blackouts),bestOvertime:safeCount(totals.bestOvertime,1e6)};
  result.totals.extractions=Math.min(result.totals.runs,Math.max(result.totals.extractions,result.history.filter(row=>row.outcome==='extracted').length));
  result.totals.breakers=Math.max(result.totals.breakers,result.history.reduce((sum,row)=>sum+row.breakers,0));
  result.totals.wardens=Math.max(result.totals.wardens,result.history.reduce((sum,row)=>sum+(row.wardens??0),0));
  result.totals.harvesters=Math.max(result.totals.harvesters,result.history.reduce((sum,row)=>sum+(row.harvesters??0),0));
  result.totals.blackouts=Math.max(result.totals.blackouts,result.history.reduce((sum,row)=>sum+row.blackouts,0));
  result.totals.bestOvertime=Math.max(result.totals.bestOvertime,...result.history.map(row=>row.overtime));
  for(const entry of ENEMY_GUIDE){const recent=result.history.reduce((sum,row)=>sum+(row.enemyTally?.[entry.id]||0),0);result.bestiary[entry.id]=Math.min(1e9,Math.max(result.bestiary[entry.id],recent))}
  return result;
}
function journalPayload(log=journal){return{version:1,presets:log.presets,bestiary:log.bestiary,selected:log.selected,totals:log.totals,history:log.history}}
function saveJournal(){
  if(journal.readOnly)return false;
  try{const value=JSON.stringify(journalPayload());localStorage.setItem(JOURNAL_KEY,value);journal.available=localStorage.getItem(JOURNAL_KEY)===value;return journal.available}catch{journal.available=false;return false}
}
function journalNote(){return journal.readOnly?'A newer run log is present; this build keeps a temporary log.':journal.available?'Run log saved only in this browser.':'Browser storage is unavailable; the run log lasts for this visit.'}
function logCompletedRun(){
  const row=cleanRunEntry(runResult);
  journal.history.unshift(row);journal.history=journal.history.slice(0,8);
  const t=journal.totals;t.runs=Math.min(1e9,t.runs+1);if(runOutcome==='extracted')t.extractions=Math.min(1e9,t.extractions+1);
  t.breakers=Math.min(1e9,t.breakers+row.breakers);t.wardens=Math.min(1e9,t.wardens+(row.wardens??0));t.harvesters=Math.min(1e9,t.harvesters+(row.harvesters??0));t.blackouts=Math.min(1e9,t.blackouts+rushesSurvived);t.bestOvertime=Math.max(t.bestOvertime,overtime);
  for(const entry of ENEMY_GUIDE)journal.bestiary[entry.id]=Math.min(1e9,journal.bestiary[entry.id]+(row.enemyTally?.[entry.id]||0));
  return saveJournal();
}
function selectSurvivor(id){
  if(mode!=='roster'||!SURVIVORS.some(role=>role.id===id))return;
  selectedSurvivor=id;journal.selected=id;saveJournal();refreshRoster();
}
function refreshRoster(){
  for(const role of SURVIVORS){const button=document.getElementById('role-'+role.id);button.setAttribute('aria-pressed',String(selectedSurvivor===role.id));button.style.borderColor=selectedSurvivor===role.id?role.color:'#657b8c'}
  document.getElementById('deploy').textContent='DEPLOY '+survivorById(selectedSurvivor).name.toUpperCase();
  document.getElementById('survivorDetail').textContent=survivorById(selectedSurvivor).hint;refreshContract();refreshRule();refreshRoute();refreshPresets();refreshDeploymentSummary();
}
function refreshDeploymentSummary(){
 const role=survivorById(selectedSurvivor),rules=ruleById(selectedRule),contract=contractById(selectedContract);
 document.getElementById('deploymentSummary').textContent=`${role.name} · ${routeById(selectedRoute).name} · ${rules.name} · ${contract?contract.name:'No contract'}`;
 document.getElementById('deploymentStats').textContent=`Starting loadout: ${Math.round(role.hp*rules.hp)} HP · ${role.speed} movement · ${Number((18*rules.damage).toFixed(1))} gun damage · ${(role.dash||2.5).toFixed(2)}s Dash · ${role.decoys||1} decoy${role.decoys===2?'s':''} · ${role.rerolls||1} reroll${role.rerolls===2?'s':''}`;
}
function useStarterSetup(){
 if(mode!=='roster'||document.hidden)return;selectedSurvivor='survivor';selectedRoute='downtown';selectedRule='standard';selectedContract='none';journal.selected=selectedSurvivor;saveJournal();refreshRoster();toast('STARTER SETUP READY · REVIEW THEN DEPLOY',2000);
}
function showRoster(){
 if(!['menu','end','roster'].includes(mode))return;
 mode='roster';show(`<div class="eyebrow">CHOOSE YOUR SURVIVOR</div><h1 style="font-size:44px">YOUR NEXT RUN</h1><p id="deploymentSummary" class="setup-summary"></p><p class="muted" id="deploymentStats"></p><button class="btn primary-wide" id="deploy">DEPLOY</button><p class="muted">Defeat the first boss. Reach green at or after 03:00, with no active boss or Blackout.</p><div class="home-actions"><button class="btn secondary" id="starterSetup">USE STARTER SETUP</button></div><details class="medal-goals setup-section"><summary>PRACTICE &amp; HOW TO PLAY</summary><div class="home-actions"><button class="btn secondary" id="trainingOpen">TRAINING · UNSCORED</button><button class="btn secondary" id="rosterGuide">FIRST RUN GUIDE</button></div></details><p class="muted">Recommended start: Survivor · Downtown · Standard · No contract. Your choices change only when you select a setup.</p><details class="medal-goals setup-section" id="survivorChoices"><summary>CHANGE SURVIVOR · ${SURVIVORS.length} AVAILABLE</summary><div class="cards four roster">${SURVIVORS.map(role=>`<button class="choice survivor" id="role-${role.id}" aria-pressed="${selectedSurvivor===role.id}"><span class="emoji" style="color:${role.color}">${role.icon}</span><b>${role.name}</b><span>${role.stats}</span></button>`).join('')}</div><p id="survivorDetail"></p></details><details class="medal-goals setup-section" id="routeChoices"><summary>CHANGE ROUTE · ${ROUTES.length} AVAILABLE</summary><div class="contract-picker"><label for="routePick">NIGHT ROUTE</label><select id="routePick">${ROUTES.map(r=>`<option value="${r.id}">${r.name}</option>`).join('')}</select><p class="muted" id="routeDetail"></p></div></details><details class="medal-goals setup-section" id="optionalSetup"><summary>RULES, CONTRACTS &amp; PRESETS</summary><div class="contract-picker"><label for="rulePick">RUN RULES · OPTIONAL CHALLENGE</label><select id="rulePick">${RUN_RULES.map(r=>`<option value="${r.id}">${r.name}</option>`).join('')}</select><p class="muted" id="ruleDetail"></p></div><div class="contract-picker"><label for="contractPick">OPTIONAL RUN CONTRACT</label><select id="contractPick"><option value="none">No contract</option>${CONTRACTS.map(goal=>`<option value="${goal.id}">${goal.name}</option>`).join('')}</select><p class="muted" id="contractDetail"></p></div>${favoredPicker()}${presetControls()}</details><p><button class="btn secondary" id="rosterBack">MAIN MENU</button></p><p class="muted">All loadouts are available now. Every run starts with base stats and no upgrades.</p><details class="medal-goals setup-section"><summary>RUN MEDALS · OPTIONAL GOALS</summary>${medalGoals()}</details>`);
  bindPress(document.getElementById('trainingOpen'),showTraining);bindPress(document.getElementById('starterSetup'),useStarterSetup);bindPress(document.getElementById('rosterGuide'),showQuickGuide);bindFavoredPicker();for(const role of SURVIVORS)bindPress(document.getElementById('role-'+role.id),()=>selectSurvivor(role.id));
  const slotPicker=document.getElementById('presetSlot');slotPicker.value=String(presetSlot);slotPicker.addEventListener('change',()=>{if(mode==='roster'&&slotPicker.isConnected&&['0','1','2'].includes(slotPicker.value)){presetSlot=Number(slotPicker.value);refreshPresets()}});bindPress(document.getElementById('presetSave'),saveDeployment);bindPress(document.getElementById('presetLoad'),loadDeployment);
  const routePicker=document.getElementById('routePick');routePicker.addEventListener('change',()=>{if(routePicker.isConnected)selectRoute(routePicker.value)});
  const rulePicker=document.getElementById('rulePick');rulePicker.addEventListener('change',()=>{if(rulePicker.isConnected)selectRule(rulePicker.value)});
  const picker=document.getElementById('contractPick');picker.addEventListener('change',()=>{if(picker.isConnected)selectContract(picker.value)});
  bindPress(document.getElementById('deploy'),()=>{if(mode==='roster')start()});bindPress(document.getElementById('rosterBack'),menu);refreshRoster();
}
function showJournal(){
  if(!['menu','end','journal'].includes(mode))return;if(mode!=='journal')journalView={outcome:'all',survivor:'all',rule:'all',route:'all',sort:'newest'};mode='journal';
  const t=journal.totals,rows=journal.history.filter(row=>(journalView.outcome==='all'||row.outcome===journalView.outcome)&&(journalView.survivor==='all'||row.survivor===journalView.survivor)&&(journalView.rule==='all'||journalView.rule==='legacy'&&row.rule===null||row.rule===journalView.rule)&&(journalView.route==='all'||journalView.route==='legacy'&&row.route===null||row.route===journalView.route));
  if(journalView.sort==='time')rows.sort((a,b)=>b.time-a.time);if(journalView.sort==='kills')rows.sort((a,b)=>b.kills-a.kills);
  const records=journal.history.length?`<p class="muted">Records in your saved eight runs: ${Math.max(...journal.history.map(r=>r.kills))} eliminations · level ${Math.max(...journal.history.map(r=>r.level))}. Older trimmed runs are not included.</p>`:'';
  const controls=`<div class="contract-picker"><label for="logOutcome">OUTCOME</label><select id="logOutcome"><option value="all">All outcomes</option><option value="extracted">Extracted</option><option value="defeated">Defeated</option><option value="abandoned">Ended manually</option></select><label for="logSurvivor">SURVIVOR</label><select id="logSurvivor"><option value="all">All survivors</option>${SURVIVORS.map(r=>`<option value="${r.id}">${r.name}</option>`).join('')}</select><label for="logRule">RUN RULES</label><select id="logRule"><option value="all">All rules</option>${RUN_RULES.map(r=>`<option value="${r.id}">${r.name}</option>`).join('')}<option value="legacy">Older runs · rules unknown</option></select><label for="logRoute">ROUTE</label><select id="logRoute"><option value="all">All routes</option>${ROUTES.map(r=>`<option value="${r.id}">${r.name}</option>`).join('')}<option value="legacy">Older runs · route unknown</option></select><label for="logSort">ORDER</label><select id="logSort"><option value="newest">Newest first</option><option value="time">Longest survived</option><option value="kills">Most eliminations</option></select></div><p class="muted">Showing ${rows.length} of ${journal.history.length} saved runs.</p>${records}`;
  show(`<div class="eyebrow">YOUR LOCAL RUN LOG</div><h1 style="font-size:44px">NIGHTS REMEMBERED</h1><p>${t.runs} completed · ${t.extractions} extracted · ${t.breakers} Breakers · ${t.wardens} Wardens · ${t.harvesters} Harvesters defeated</p><p class="muted">Best survival ${fmt(record)} · Best overtime ${t.bestOvertime}</p><button class="btn secondary" id="journalBack">MAIN MENU</button><details class="medal-goals"><summary>GUIDES &amp; MEDALS</summary><div class="home-actions"><button class="btn secondary" id="bestiaryOpen">BESTIARY</button><button class="btn secondary" id="weaponsOpen">WEAPON GUIDE</button><button class="btn secondary" id="manualOpen">FIELD MANUAL</button></div><details class="medal-goals"><summary>RUN MEDALS</summary>${medalGoals()}</details></details><details class="medal-goals" ${Object.values(journalView).some(v=>v!=='all'&&v!=='newest')?'open':''}><summary>FILTER RUN HISTORY</summary>${controls}</details>${savedRunReviewPicker(rows)}${routeRecordsPanel()}<div class="run-list">${rows.length?rows.map(row=>`<article class="run-row"><div><b style="color:${row.outcome==='extracted'?'#a7ffda':row.outcome==='defeated'?'#ffb4c0':'#c6d0dd'}">${row.outcome==='extracted'?'EXTRACTED':row.outcome==='defeated'?'DEFEATED':'ENDED'} · ${survivorById(row.survivor).name}</b><strong>${fmt(row.time)}</strong></div><p>Level ${row.level} · ${row.kills} eliminations · ${row.breakers} Breakers${row.wardens===null?'':` · ${row.wardens} Wardens`} · Overtime ${row.overtime}${row.harvesters===null?'':` · ${row.harvesters} Harvesters`}</p><small>${buildSummary(row)}</small><p class="medal-line">${earnedMedals(row).map(m=>m.name).join(" · ")||"No medals recorded"}${row.barrels===null?" · Barrel stats unavailable in this older run":` · ${row.barrels} barrels · ${row.blastKills??0} blast eliminations`}</p>${row.barricades===null?'':`<p class="muted">${row.barricades} barricades cleared</p>`}${row.salvages===null?'':`<p class="muted">${row.salvages} salvage holdouts secured</p>`}${contractPanel(row)}${ruleNote(row)}${routeNote(row)}${row.damageTaken===null?'':`<p class="muted">${row.hitsTaken??0} hits · ${row.damageTaken} HP lost to hits · Last hit: ${threatName(row.lastThreat)}</p>`}${row.spitters===null?'':`<p class="muted">${row.spitters} Spitters defeated</p>`}${row.riotGuards===null?'':`<p class="muted">${row.riotGuards} Riot Guards defeated</p>`}${row.enemyTally?.howler?`<p class="muted">${row.enemyTally.howler} Howlers defeated</p>`:''}${row.rescues===null?'':`<p class="muted">${row.rescues} survivors rescued</p>`}${row.survivor==='engineer'&&row.scrapRefreshes!==null?`<p class="muted">Scrapwork: ${row.scrapRefreshes} Dash refreshes${row.scrapRecovered===null?'':` · ${row.scrapRecovered}s recovered`}</p>`:''}${row.convoys===null?'':`<p class="muted">${row.convoys} convoys intercepted</p>`}${row.drops===null?'':`<p class="muted">${row.drops} supply drops${row.dropXp===null?'':` · ${row.dropXp} XP recovered`}</p>`}${row.fireKills===null?'':`<p class="muted">${row.fireKills} fire eliminations</p>`}${row.supplies===null?'':`<p class="muted">${row.supplies} medical caches · ${row.supplyHealing===null?'HP restored unavailable':row.supplyHealing+' HP restored'}</p>`}${runLogDetails(row)}</article>`).join(''):journal.history.length?'<p>No runs match these filters.</p>':'<p>No completed runs logged yet. Finish a run to add it here.</p>'}</div><p class="muted">Most recent eight runs shown. Totals include older logged runs.<br>${journalNote()}</p>`);
  bindPress(document.getElementById('journalBack'),menu);bindPress(document.getElementById('bestiaryOpen'),showBestiary);bindPress(document.getElementById('weaponsOpen'),showWeaponGuide);bindPress(document.getElementById('manualOpen'),showManual);
  if(document.getElementById('savedRunOpen')){const picker=document.getElementById('savedRunPick');picker.value=String(journal.history.indexOf(rows[0]));bindPress(document.getElementById('savedRunOpen'),()=>{if(picker.isConnected)showSavedRun(Number(picker.value))})}
  for(const [id,key] of [['logOutcome','outcome'],['logSurvivor','survivor'],['logSort','sort'],['logRule','rule'],['logRoute','route']]){const picker=document.getElementById(id);picker.value=journalView[key];picker.addEventListener('change',()=>{if(picker.isConnected)setJournalView(key,picker.value)})}
}
function savedRunReviewPicker(rows){
 if(!rows.length)return '';return `<div class="contract-picker"><label for="savedRunPick">REVIEW A SAVED RUN</label><select id="savedRunPick">${rows.map(row=>`<option value="${journal.history.indexOf(row)}">${fmt(row.time)} · ${survivorById(row.survivor).name} · ${row.route?routeById(row.route).name:'Older route unknown'} · ${row.outcome}</option>`).join('')}</select><button class="btn secondary" id="savedRunOpen">READ RUN DETAILS</button><p class="muted">Read only. Reviewing never equips a build or changes records.</p></div>`;
}
function showSavedRun(index){
 if(mode!=='journal'||!Number.isInteger(index)||index<0||index>=journal.history.length)return;
 const freeze=v=>{if(v&&typeof v==='object'){for(const item of Object.values(v))freeze(item);Object.freeze(v)}return v};reviewedRun=freeze(JSON.parse(JSON.stringify(journal.history[index])));mode='review';const r=reviewedRun;
 show(`<div class="eyebrow">SAVED RUN · READ ONLY</div><h1 style="font-size:44px">RUN REVIEW</h1><p>${survivorById(r.survivor).name} · ${fmt(r.time)} · ${r.outcome.toUpperCase()}</p><p>${r.kills} eliminations · level ${r.level} · ${r.hp===null||r.max===null?'HP not recorded':r.hp+' / '+r.max+' HP'}</p><p class="muted">${buildSummary(r)}</p>${ruleNote(r)}${routeNote(r)}${contractPanel(r)}<button class="btn secondary" id="reviewBack">BACK TO RUN LOG</button>${runLogDetails(r).replace('<details class="medal-goals">','<details class="medal-goals" open>')}`);
 bindPress(document.getElementById('reviewBack'),()=>{if(mode==='review'){reviewedRun=null;mode='journal';showJournal()}});
}
function routeRecordsPanel(){
 return `<details class="medal-goals"><summary>RECENT ROUTE RECORDS</summary><p class="muted">Across the saved eight runs, independent of filters. These are recent records, not all-time route records.</p><table class="weapon-ranks"><thead><tr><th>Route</th><th>Runs / exits</th><th>Best time</th><th>Most kills</th></tr></thead><tbody>${ROUTES.map(route=>{const rows=journal.history.filter(r=>r.route===route.id);return `<tr><th>${route.name}</th><td>${rows.length} / ${rows.filter(r=>r.outcome==='extracted').length}</td><td>${rows.length?fmt(Math.max(...rows.map(r=>r.time))):'—'}</td><td>${rows.length?Math.max(...rows.map(r=>r.kills)):'—'}</td></tr>`}).join('')}</tbody></table><p class="muted">${journal.history.filter(r=>r.route===null).length} older saved runs have unknown route; their original records remain.</p></details>`;
}
function runLogDetails(row){
 const stats=[['HP remaining',row.hp===null||row.max===null?null:`${row.hp} / ${row.max}`],['Base weapon damage',row.damage],['Gun volleys/sec',row.fire===null?null:Number((1/row.fire).toFixed(2))],['Movement speed',row.speed],['HP/sec regeneration',row.regen],['Pickup reach',row.magnet],['Bullet speed',row.bulletSpeed],['Shock drums',row.shocks],['Stun applications',row.shockStuns],['Armor prevented',row.armorPrevented]];
 return `<details class="medal-goals"><summary>OPEN RUN DETAILS</summary><p class="muted">Recorded at the end of this run. Unknown values in older runs are marked unavailable. Reading does not equip this build.</p><dl>${stats.map(([label,value])=>`<dt>${label}</dt><dd>${value===null?'Unavailable':value}</dd>`).join('')}</dl><p><b>Eliminations by enemy</b></p>${row.enemyTally?ENEMY_GUIDE.map(e=>`<p>${e.name}: ${row.enemyTally[e.id]}</p>`).join(''):'<p class="muted">Enemy breakdown unavailable in this older run.</p>'}<p class="muted">${row.secondWind?'Second Wind '+(row.windSpent?'spent':'unused'):'Second Wind not recorded as owned'} · Armor ${row.armor}/3 · Capacitor ${row.capacitor}/2</p>${buildProgressPanel(row.progression)}${pacePanel(row.pace)}${weaponPanel(row.weapons)}${discoveryPanel(row.newDiscoveries)}${timelinePanel(row)}</details>`;
}
function setJournalView(key,value){
 if(mode!=='journal')return;const allowed={outcome:['all','extracted','defeated','abandoned'],survivor:['all',...SURVIVORS.map(r=>r.id)],rule:['all','legacy',...RUN_RULES.map(r=>r.id)],route:['all','legacy',...ROUTES.map(r=>r.id)],sort:['newest','time','kills']};if(!allowed[key]?.includes(value))return;journalView[key]=value;showJournal();
}
// Backups move validated records only; active runs and runtime powers are excluded.
function backupText(){return journal.readOnly?'':JSON.stringify({game:'last-stand-after-dark',format:1,record,journal:journalPayload()},null,2)}
function parseBackup(text){
 if(typeof text!=='string'||text.length>262144)throw Error('Backup is too large or unreadable.');let data;
 try{data=JSON.parse(text)}catch{throw Error('This is not valid backup JSON.')}
 if(!data||data.game!=='last-stand-after-dark'||data.format!==1||data.journal?.version!==1||!Array.isArray(data.journal.history)||typeof data.record!=='number'||!Number.isFinite(data.record)||data.record<0||data.record>1e9)throw Error('This is not a supported Last Stand backup.');
 return{journal:normalizeJournal(data.journal),record:data.record};
}
function showBackup(){
 if(!['menu','end','settings'].includes(mode)||mode==='settings'&&settingsReturn==='paused')return;backupReturn=mode;pendingRestore=null;restoreInput='';backupMessage='';mode='backup';renderBackup();
}
function renderBackup(){
 if(mode!=='backup')return;const candidate=pendingRestore,recovery=restoreRecoveryText();
 show(`<div class="eyebrow">LOCAL RECORDS · NO ACCOUNT NEEDED</div><h1 style="font-size:44px">SAVE BACKUP</h1><p>Download or copy your run log, survivor selection, Bestiary totals, and best time. Active runs, upgrades, and presentation settings are not transferred.</p>${journal.readOnly?'<p>This build cannot back up or replace a newer-format log. Your existing save is untouched.</p>':''}<p><button class="btn secondary" id="backupDownload" ${journal.readOnly?'disabled':''}>DOWNLOAD BACKUP JSON</button></p><label for="backupExport">YOUR BACKUP TEXT</label><textarea id="backupExport" class="save-text" rows="5" readonly></textarea>${recovery?`<details class="medal-goals"><summary>PREVIOUS RECORDS COPY</summary><p>Saved before the last restore in this browser. This local copy shares browser storage; download a backup before changing files or browsers.</p><button class="btn secondary" id="recoveryReview" ${candidate||journal.readOnly?'disabled':''}>REVIEW PREVIOUS RECORDS</button></details>`:''}<p class="muted">Restoring first saves a verified local copy, then checks the written records. Use an external backup to move to another file or browser.</p><label for="backupFile">OPEN A LOCAL BACKUP FILE</label><input id="backupFile" type="file" accept="application/json,.json" ${candidate||journal.readOnly?'disabled':''}><label for="backupImport">OR PASTE A BACKUP TO RESTORE</label><textarea id="backupImport" class="save-text" rows="5" ${candidate?'readonly':''}></textarea><p id="backupMessage" class="contract-note" role="status"></p>${candidate?`<p>Replace ${journal.totals.runs} recorded runs and best ${fmt(record)} with ${candidate.journal.totals.runs} runs and best ${fmt(candidate.record)}?</p><p>This replaces this browser’s records. It does not merge. Export your current backup first if you want to keep it.</p><button class="btn" id="restoreConfirm">REPLACE RECORDS WITH REVIEWED BACKUP</button><p><button class="btn secondary" id="restoreEdit">CANCEL / EDIT BACKUP</button></p>`:`<p><button class="btn secondary" id="backupReview" ${journal.readOnly?'disabled':''}>REVIEW RESTORE</button></p>`}<button class="btn secondary" id="backupBack">${backupReturn==='end'?'BACK TO RESULTS':backupReturn==='settings'?'BACK TO SETTINGS':'MAIN MENU'}</button>`);
 document.getElementById('backupExport').value=backupText();document.getElementById('backupImport').value=restoreInput;document.getElementById('backupMessage').textContent=backupMessage;
 bindPress(document.getElementById('backupBack'),closeBackup);
 const filePicker=document.getElementById('backupFile');let fileRequest=0;
 if(!candidate&&!journal.readOnly)filePicker.addEventListener('change',async()=>{
   const request=++fileRequest,file=filePicker.files?.[0];if(!file)return;
   try{if(file.size>262144)throw Error('Backup is too large or unreadable.');const text=await file.text();if(!filePicker.isConnected||mode!=='backup'||request!==fileRequest)return;restoreInput=text;pendingRestore=parseBackup(text);backupMessage='Backup validated. Review the replacement before confirming.'}
   catch(error){if(!filePicker.isConnected||mode!=='backup'||request!==fileRequest)return;pendingRestore=null;backupMessage='Could not read a supported Last Stand backup file.'}
   renderBackup();
 });
 if(!journal.readOnly)bindPress(document.getElementById('backupDownload'),downloadBackup);
 if(recovery&&!candidate&&!journal.readOnly){const button=document.getElementById('recoveryReview');bindPress(button,()=>{if(button.isConnected)reviewRestoreRecovery()})}
 if(candidate){bindUpgradePress(document.getElementById('restoreConfirm'),()=>applyRestore(candidate),()=>mode==='backup'&&pendingRestore===candidate);bindPress(document.getElementById('restoreEdit'),()=>{pendingRestore=null;backupMessage='';renderBackup()})}
 else if(!journal.readOnly)bindPress(document.getElementById('backupReview'),reviewBackup);
}
function downloadBackup(){
 if(mode!=='backup'||journal.readOnly)return;
 try{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([backupText()],{type:'application/json'}));a.download='Last_Stand_After_Dark_Save_Alpha_0_86.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);backupMessage='Backup download requested. You can also select and copy the text.'}catch{backupMessage='Download unavailable here; select and copy the backup text instead.'}
 document.getElementById('backupMessage').textContent=backupMessage;
}
function reviewBackup(){
 if(mode!=='backup'||journal.readOnly)return;restoreInput=document.getElementById('backupImport').value;
 try{pendingRestore=parseBackup(restoreInput);backupMessage='Backup validated. Review the replacement before confirming.'}catch(error){pendingRestore=null;backupMessage=error.message}
 renderBackup();
}
function restoreRecoveryText(){try{const text=localStorage.getItem('ls-restore-recovery-v1');if(!text)return '';parseBackup(text);return text}catch{return ''}}
function reviewRestoreRecovery(){
 if(mode!=='backup'||document.hidden||journal.readOnly||pendingRestore)return;const text=restoreRecoveryText();if(!text){backupMessage='No readable previous-records copy is available.';renderBackup();return}restoreInput=text;pendingRestore=parseBackup(text);backupMessage='Previous-records copy validated. Review before replacing current records.';renderBackup();
}
function applyRestore(candidate){
 if(mode!=='backup'||document.hidden||journal.readOnly||candidate!==pendingRestore)return;let prior=null,priorRecord=null,attempted=false;
 try{
  prior=localStorage.getItem(JOURNAL_KEY);priorRecord=localStorage.getItem('ls-record');const copy=backupText();parseBackup(copy);localStorage.setItem('ls-restore-recovery-v1',copy);if(localStorage.getItem('ls-restore-recovery-v1')!==copy)throw Error('Recovery copy verification failed');
  const next=JSON.stringify(journalPayload(candidate.journal)),best=String(candidate.record);attempted=true;localStorage.setItem(JOURNAL_KEY,next);localStorage.setItem('ls-record',best);if(localStorage.getItem(JOURNAL_KEY)!==next||localStorage.getItem('ls-record')!==best)throw Error('Record verification failed');
 }catch{
  let restored=!attempted;if(attempted)try{for(const [key,value]of [[JOURNAL_KEY,prior],['ls-record',priorRecord]])try{if(localStorage.getItem(key)!==value){if(value===null)localStorage.removeItem(key);else localStorage.setItem(key,value)}}catch{}restored=localStorage.getItem(JOURNAL_KEY)===prior&&localStorage.getItem('ls-record')===priorRecord}catch{}
  if(!restored)journal.available=false;backupMessage=restored?'Restore failed; previous saved records and this session are unchanged. A verified safety copy is required before replacement.':'Restore failed and storage rejected rollback. Export this session backup before closing; a previous-records copy may be available here.';renderBackup();return;
 }
 journal=candidate.journal;record=candidate.record;selectedSurvivor=journal.selected;selectedContract='none';runResult=null;runComparison=null;runLogged=false;pendingRestore=null;restoreInput='';clearInput();menu();toast('BACKUP RESTORED · READ-BACK VERIFIED · PREVIOUS COPY KEPT',3500);
}
function closeBackup(){if(mode!=='backup')return;pendingRestore=null;if(backupReturn==='end'&&runResult)showRunResult();else if(backupReturn==='settings'){mode='settings';renderSettings()}else menu()}
function showBestiary(){
  if(!['menu','end','weapons','journal'].includes(mode))return;
  bestiaryReturn=mode==='weapons'?weaponGuideReturn:mode;bestiaryFilter='all';bestiaryLook=preferences.actors;mode='bestiary';renderBestiary();
}
function setBestiaryFilter(value){
  if(mode!=='bestiary'||!['all','horde','specialist','boss'].includes(value))return;
  bestiaryFilter=value;renderBestiary();
}
function closeBestiary(){
  if(mode!=='bestiary')return;
  if(bestiaryReturn==='end'&&runResult)showRunResult();else if(bestiaryReturn==='journal')returnToJournal();else menu();
}
function renderBestiary(){
  if(mode!=='bestiary')return;
  const entries=ENEMY_GUIDE.filter(entry=>bestiaryFilter==='all'||entry.group===bestiaryFilter),total=ENEMY_GUIDE.reduce((sum,entry)=>sum+journal.bestiary[entry.id],0),back=bestiaryReturn==='end'?'BACK TO RESULTS':bestiaryReturn==='journal'?'BACK TO JOURNAL':'MAIN MENU';
  show(`<div class="eyebrow">BESTIARY · ENEMY FIELD GUIDE</div><h1 style="font-size:44px">KNOW THE NIGHT</h1><p>Read the tell. Choose your counter.</p><button class="btn secondary" id="bestiaryBack">${back}</button><p><button class="btn secondary" id="bestiaryWeapons">WEAPON GUIDE</button></p><div class="field-filter"><label for="bestiaryFilter">SHOW THREATS</label><select id="bestiaryFilter"><option value="all">All threats · ${ENEMY_GUIDE.length}</option><option value="horde">Horde · 4</option><option value="specialist">Specialists · ${ENEMY_GUIDE.filter(e=>e.group==='specialist').length}</option><option value="boss">Bosses · ${ENEMY_GUIDE.filter(e=>e.group==='boss').length}</option></select></div><div class="field-filter"><label for="bestiaryArt">REFERENCE ART</label><select id="bestiaryArt"><option value="field">Field · current characters</option><option value="classic">Classic · previous characters</option></select></div><p id="bestiaryArtStatus" class="muted" role="status">${bestiaryArtStatus()}</p><p class="muted">${entries.length} entries shown · ${total} recorded defeats<br>Counts track completed runs from Alpha 0.25 onward. Earlier runs remain in Run Log.<br>Howler tracking begins in Alpha 0.29; Lobber tracking in Alpha 0.32.<br>All tactics are available now. This guide gives no stat bonuses.</p><div class="field-list">${entries.map(entry=>`<article class="field-card" data-enemy="${entry.id}"><div class="field-head"><canvas id="portrait-${entry.id}" class="enemy-portrait" width="288" height="224" aria-hidden="true"></canvas><div><h2>${entry.name}</h2><div class="field-count">Defeated: ${journal.bestiary[entry.id]}</div></div></div><p>${bestiaryAppearance(entry)}</p><p><b>Attack tell:</b> ${entry.tell}</p><p><b>Counter:</b> ${entry.counter}</p></article>`).join('')}</div><button class="btn secondary" id="bestiaryBackBottom">${back}</button><p class="muted">${journalNote()}</p>`);
  const picker=document.getElementById('bestiaryFilter');picker.value=bestiaryFilter;picker.addEventListener('change',()=>{if(picker.isConnected)setBestiaryFilter(picker.value)});
  for(const id of ['bestiaryBack','bestiaryBackBottom'])bindPress(document.getElementById(id),closeBestiary);
  bindPress(document.getElementById('bestiaryWeapons'),showWeaponGuide);
  const artwork=document.getElementById('bestiaryArt');artwork.value=bestiaryLook;artwork.addEventListener('change',()=>{if(artwork.isConnected)selectBestiaryArt(artwork.value)});
  for(const entry of entries)drawEnemyPortrait(entry.id);prepareBestiaryArt();
}
function enemyPortraitEntity(id){return{x:72,y:70,hp:1,max:1,hit:0,phase:'approach',facing:Math.PI/2,...ENEMY_ART[id]}}
function drawEnemyPortrait(id){
  const canvas=document.getElementById('portrait-'+id);if(mode!=='bestiary'||!canvas?.isConnected)return;const ctx=canvas.getContext('2d');
  ctx.setTransform(2,0,0,2,0,0);ctx.clearRect(0,0,144,112);if(!drawBestiaryField(id,ctx))renderEnemy(enemyPortraitEntity(id),ctx,true);
}
// A static guide image never prepares combat animation caches or runs enemy AI.
const BESTIARY_FIELD_IDS=Object.freeze(['shambler','runner','brute','hunter','breaker','warden','harvester','riot','spitter','howler','lobber']);
const BESTIARY_FIELD_LOOK=Object.freeze({hunter:'Lean, fast infected in a torn plum jacket; arrives during Blackout Rush. Violet foot markers identify it in Field play.',shambler:'Weathered infected in olive street clothing; steady-moving horde.',runner:'Lean infected in torn brown-orange clothing; faster than a Shambler.',brute:'Broad, heavy infected in ragged dark clothing; appears after 00:30.',breaker:'Massive burgundy-armored infected; first boss, due at 01:30.',warden:'Armored infected with blue-lit gauntlets; follows Breaker in the boss cycle.',harvester:'Pale, hunched infected with exposed ribs, long claws and ivory spines; third in the boss cycle.',riot:'Infected officer in navy armor carrying a gold-edged front shield; starts after 02:30 when encounters allow.',spitter:'Hunched infected with a swollen pink throat; starts after 01:05 when encounters allow.',howler:'Emaciated infected in a torn yellow hooded jacket; appears after 03:30 in quiet windows.',lobber:'Stocky infected worker in a blue vest, carrying small orange canisters by hand; overtime only, from 04:15 in quiet windows.'});
let bestiaryLook='field',bestiaryArtwork=freshBestiaryArt();
function freshBestiaryArt(){return{status:'idle',image:null,meta:null}}
function releaseBestiaryArt(){if(bestiaryArtwork.image){bestiaryArtwork.image.onload=null;bestiaryArtwork.image.onerror=null}bestiaryArtwork=freshBestiaryArt()}
function bestiaryAppearance(entry){return bestiaryLook==='field'?BESTIARY_FIELD_LOOK[entry.id]||entry.look:entry.look}
function bestiaryArtStatus(){return bestiaryLook==='classic'?'Classic reference art. This choice affects this guide only.':bestiaryArtwork.status==='ready'?'Field reference art for all eleven enemies. Portraits are fitted to the cards.':bestiaryArtwork.status==='failed'?'Field portraits unavailable here; Classic portraits and every tactic remain available. Switch reference art to retry.':'Loading Field portraits… Classic portraits remain visible. This choice affects this guide only.'}
function refreshBestiaryArt(){if(mode!=='bestiary')return;const label=document.getElementById('bestiaryArtStatus');if(label)label.textContent=bestiaryArtStatus();for(const id of Object.keys(ENEMY_ART))if(document.getElementById('portrait-'+id)?.isConnected)drawEnemyPortrait(id)}
function selectBestiaryArt(value){if(mode!=='bestiary'||!['field','classic'].includes(value)||value===bestiaryLook)return;bestiaryLook=value;releaseBestiaryArt();renderBestiary()}
function failBestiaryArt(owner){if(bestiaryArtwork!==owner)return;if(owner.image){owner.image.onload=null;owner.image.onerror=null}owner.image=null;owner.meta=null;owner.status='failed';refreshBestiaryArt()}
function prepareBestiaryArt(){
 if(mode!=='bestiary'||bestiaryLook!=='field'||bestiaryArtwork.status!=='idle')return;
 const owner=bestiaryArtwork;owner.status='loading';
 try{
  const data=JSON.parse(document.getElementById('sampleAssets').textContent),m=data.bestiaryPortraits;
  if(!m||!/^data:image\/webp;base64,/.test(m.src)||!Number.isInteger(m.width)||!Number.isInteger(m.height)||m.width<=0||m.height<=0||m.width*m.height*4>1024*1024||m.ids?.join(',')!==BESTIARY_FIELD_IDS.join(',')||m.frames?.length!==11||!m.frames.every(r=>Array.isArray(r)&&r.length===4&&r.every(Number.isInteger)&&r[0]>=0&&r[1]>=0&&r[2]>0&&r[3]>0&&r[0]+r[2]<=m.width&&r[1]+r[3]<=m.height))throw Error('Portrait metadata');
  owner.meta={width:m.width,height:m.height,frames:m.frames};const image=new Image();owner.image=image;
  image.onload=()=>{if(bestiaryArtwork!==owner||mode!=='bestiary'||bestiaryLook!=='field'||owner.status!=='loading')return;if(image.naturalWidth!==owner.meta.width||image.naturalHeight!==owner.meta.height){failBestiaryArt(owner);return}image.onload=null;image.onerror=null;owner.status='ready';refreshBestiaryArt()};
  image.onerror=()=>failBestiaryArt(owner);image.src=m.src;
 }catch{failBestiaryArt(owner)}
}
function drawBestiaryField(id,ctx){
 const index=BESTIARY_FIELD_IDS.indexOf(id);if(bestiaryLook!=='field'||bestiaryArtwork.status!=='ready'||index<0)return false;
 const crop=bestiaryArtwork.meta.frames[index],height=id==='breaker'||id==='harvester'?96:id==='warden'?92:id==='brute'?82:id==='runner'?64:72,scale=Math.min(height/crop[3],124/crop[2]),w=crop[2]*scale,h=crop[3]*scale;
 ctx.save();ctx.fillStyle='#02070a88';ctx.beginPath();ctx.ellipse(72,103,w*.38,4,0,0,Math.PI*2);ctx.fill();ctx.drawImage(bestiaryArtwork.image,...crop,72-w/2,104-h,w,h);ctx.restore();return true;
}
function showWeaponGuide(){
  if(!['menu','end','bestiary','journal'].includes(mode))return;
  weaponGuideReturn=mode==='bestiary'?bestiaryReturn:mode;mode='weapons';renderWeaponGuide();
}
function closeWeaponGuide(){
  if(mode!=='weapons')return;
  if(weaponGuideReturn==='end'&&runResult)showRunResult();else if(weaponGuideReturn==='journal')returnToJournal();else menu();
}
function weaponGuideRows(weapon){
  return [1,2,3].map(rank=>{
    if(weapon==='pierce')return `${rank+1} targets per bullet, if lined up.`;
    if(weapon==='arc')return `Up to ${rank+2} distinct targets · ${Number((1.35-(rank-1)*.175).toFixed(3))}s between successful strikes · 80% weapon damage.`;
    if(weapon==='blades')return `${rank+1} blades · radius 78 · 110% weapon damage · 0.45s per-target hit interval.`;
    const fire=molotovStats(rank,false);return `One bottle · radius ${fire.radius} · ${fire.cooldown}s between volleys · ${fire.duration}s burn · ${fire.multiplier*100}% weapon damage per tick.`;
  });
}
function renderWeaponGuide(){
  if(mode!=='weapons')return;
  const back=weaponGuideReturn==='end'?'BACK TO RESULTS':weaponGuideReturn==='journal'?'BACK TO JOURNAL':'MAIN MENU';
  const paths=[
    {weapon:'pierce',name:'Piercing Rounds',role:'Your auto-fired gun hits enemies lined up behind its first target. Raised Riot shields stop the shot.',evolution:'Eight targets per bullet; +25% gun damage and +20% bullet speed. Raised Riot shields still stop Railstorm.'},
    {weapon:'arc',name:'Chain Lightning',role:'Automatic chain strikes jump between nearby enemies and bypass raised Riot shields.',evolution:'Two chains strike up to eight distinct enemies at 100% weapon damage, every 0.8s when targets are available.'},
    {weapon:'blades',name:'Orbiting Blades',role:'Rotating blades damage enemies near you and bypass raised Riot shields.',evolution:'Six blades; radius 100; 135% weapon damage; 0.35s per-target hit interval. The blades also intercept hostile shots.'},
    {weapon:'molotov',name:'Molotov',role:'Automatically throws at visible nearby targets. Player-safe fire burns enemies, fuel, and wood; it bypasses raised Riot shields.',evolution:`Up to two spread-out burns; radius ${molotovStats(3,true).radius}; ${molotovStats(3,true).cooldown}s between volleys; ${molotovStats(3,true).duration}s burn; ${molotovStats(3,true).multiplier*100}% weapon damage per tick. A close crowd may receive only one bottle.`}
  ];
  show(`<div class="eyebrow">WEAPON GUIDE · PLAN YOUR BUILD</div><h1 style="font-size:44px">BUILD FOR THE NIGHT</h1><p>Reach a weapon’s rank 3/3, then choose its evolution on a later upgrade. An evolution is a choice, not automatic.</p><p class="muted">The first weapon choice offers all four paths. You can mix paths during a run. All ranks reset on deployment; reading grants no upgrades. After the first four-weapon choice, you have one reroll per run to refresh an upgrade offer.</p><button class="btn secondary" id="weaponsBack">${back}</button><p><button class="btn secondary" id="weaponsBestiary">BESTIARY</button></p>${weaponGuideReturn==='end'&&runResult?`<p class="muted">Finished build: ${buildSummary(runResult)}</p>`:''}<p class="muted">Optional support upgrades: Second Wind recovers up to 25 HP once on a lethal hit; Dash Capacitor has two ranks down to 2.00s recharge; Armor Plating has three ranks, reducing hits by up to 3 with a minimum of 1 damage. Steady Aim adds 15% gun damage after 0.6 seconds still, lost on movement or Dash. Decoy Pouch adds one charge once when there is carrying room. These reset each run and can be banished like other non-weapon upgrades.</p><div class="field-list">${paths.map(path=>`<article class="field-card" data-weapon="${path.weapon}"><h2>${path.name}</h2><p>${path.role}</p><table class="weapon-ranks"><caption class="muted">${path.name} ranks</caption><thead><tr><th scope="col">Rank</th><th scope="col">Effect</th></tr></thead><tbody>${weaponGuideRows(path.weapon).map((effect,index)=>`<tr><th scope="row">${index+1}/3</th><td>${effect}</td></tr>`).join('')}</tbody></table><div class="weapon-evolution"><b>EVOLUTION · ${EVOLUTIONS.find(e=>e.weapon===path.weapon).name}</b><br>${path.evolution}</div></article>`).join('')}</div><p class="muted">Heavy Rounds increases base damage for all four paths. Rapid Fire, Multishot, and Velocity affect the gun. Fire damage ticks every ${MOLOTOV_TUNING.tick}s; overlapping pools use the strongest burn and never stack. At most two bottles and two pools can be active.</p><button class="btn secondary" id="weaponsBackBottom">${back}</button>`);
  for(const id of ['weaponsBack','weaponsBackBottom'])bindPress(document.getElementById(id),closeWeaponGuide);
  bindPress(document.getElementById('weaponsBestiary'),showBestiary);
}
function unlockAudio(){if(audioCtx&&audioCtx.state==='suspended')audioCtx.resume().catch(()=>{})}
function sound(freq=250,len=.06,type='square',volume=.025,bus='effects'){startAudioVoice(freq,Math.max(30,freq*.52),len,type,volume,bus)}
function showTacticalMap(){
 if(mode!=='paused')return;mode='map';mapRange=600;
 show(`<div class="eyebrow">${routeById(runRoute).name.toUpperCase()} · TIME IS PAUSED</div><h1 style="font-size:44px">TACTICAL MAP</h1><p>Local positions around you. No objectives are collected here.</p><canvas id="tacticalCanvas" width="640" height="640" style="width:min(100%,320px);height:auto;margin:0 auto;border:1px solid #657b8c;border-radius:12px" aria-label="Local tactical map; objectives are listed below"></canvas><div class="contract-picker"><label for="mapRangePick">MAP RANGE</label><select id="mapRangePick"><option value="300">300 units</option><option value="600">600 units</option><option value="1000">1000 units</option></select></div><p class="muted">You: teal crosshair. Enemies: red dots; bosses: gold rings. Orange: fuel. Cyan: shock drums. Brown: solid wood. Gray scenery is decorative.</p><p>${mapObjectives().map(t=>`${t.label}: ${Math.round(dist(t,p))} units`).join(' · ')||'No active objectives nearby.'}</p><button class="btn secondary" id="mapBack">BACK TO PAUSE</button>`);
 const picker=document.getElementById('mapRangePick');picker.value='600';picker.addEventListener('change',()=>{if(mode==='map'&&picker.isConnected&&['300','600','1000'].includes(picker.value)){mapRange=Number(picker.value);drawTacticalMap()}});bindPress(document.getElementById('mapBack'),()=>{if(mode==='map'){mode='play';pause()}});drawTacticalMap();
}
function mapObjectives(){return [...objectiveTargets().filter(t=>t.id!=='patrol'),...patrol.filter(b=>!b.visited).map(b=>({...b,id:'patrol',label:'PATROL '+b.number,color:'#84d7ff'}))]}
function mapPoint(point){const x=(point.x-p.x)*145/mapRange,y=(point.y-p.y)*145/mapRange;return Math.abs(x)<=145&&Math.abs(y)<=145?{x:x+160,y:y+160}:null}
function drawTacticalMap(){
 if(mode!=='map')return;const ctx=document.getElementById('tacticalCanvas').getContext('2d');ctx.setTransform(2,0,0,2,0,0);ctx.clearRect(0,0,320,320);ctx.fillStyle='#101b29';ctx.fillRect(0,0,320,320);ctx.save();ctx.beginPath();ctx.rect(10,10,300,300);ctx.clip();const scale=145/mapRange;
 for(const o of obstacles){ctx.fillStyle='#344251';ctx.fillRect(160+(o.x-p.x)*scale,160+(o.y-p.y)*scale,o.w*scale,o.h*scale)}
 for(const b of barricades)if(b.hp>0){ctx.fillStyle='#cea06c';ctx.fillRect(160+(b.x-p.x)*scale,160+(b.y-p.y)*scale,Math.max(2,b.w*scale),Math.max(2,b.h*scale))}
 const dot=(point,color,r)=>{const v=mapPoint(point);if(!v)return;ctx.fillStyle=color;ctx.beginPath();ctx.arc(v.x,v.y,r,0,Math.PI*2);ctx.fill()};
 for(const b of barrels)if(!b.spent)dot(b,'#ffb76b',3);for(const b of shockDrums)if(!b.spent)dot(b,'#77f2ed',3);
 for(const e of enemies)if(e.hp>0&&!e.convoy){dot(e,'#ed7e91',2);if(e===activeBoss){const v=mapPoint(e);if(v){ctx.strokeStyle='#ffdf93';ctx.lineWidth=2;ctx.beginPath();ctx.arc(v.x,v.y,6,0,Math.PI*2);ctx.stroke()}}}
 for(const t of mapObjectives()){const v=mapPoint(t);if(!v)continue;dot(t,t.color,4);ctx.fillStyle=t.color;ctx.font='bold 8px system-ui';ctx.textAlign='center';ctx.fillText(t.label,v.x,Math.max(20,v.y-8))}
 ctx.fillStyle='#75f1ce';ctx.beginPath();ctx.arc(160,160,5,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#d5fff0';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(151,160);ctx.lineTo(169,160);ctx.moveTo(160,151);ctx.lineTo(160,169);ctx.stroke();ctx.fillStyle='#d5fff0';ctx.font='bold 10px system-ui';ctx.textAlign='center';ctx.fillText('YOU',160,182);ctx.restore();ctx.fillStyle='#b4c5d2';ctx.font='bold 10px system-ui';ctx.textAlign='center';ctx.fillText('N ↑',160,12);
}
const TRAINING_SCENARIOS=Object.freeze({targets:'Stationary targets',breaker:'Breaker charge drill',warden:'Warden lane drill',harvester:'Harvester pulse drill',spitter:'Spitter aim drill',riot:'Riot shield and bash drill',howler:'Howler rally drill',lobber:'Lobber ground-warning drill',hunter:'Blackout Hunter movement drill',extraction:'Exit & overtime practice'});
const TRAINING_PATHS=Object.freeze({pierce:'Piercing Rounds',arc:'Chain Lightning',blades:'Orbiting Blades',molotov:'Molotov'});
// Scored-run actor art reads native movement; it owns no combat state or RNG.
const FIELD_ACTOR_ASSETS=Object.freeze(['survivorWalk','survivorAim','shamblerWalk','runnerRun','bruteWalk']);
const FIELD_ACTOR_HEIGHTS=Object.freeze({survivor:54,shambler:49,runner:44,brute:65,breaker:104,warden:102,harvester:108,riot:60,spitter:52,howler:56,lobber:58,hunter:46});
const FIELD_ACTOR_ROWS=Object.freeze([0,3,4,3,0,1,2,1]),FIELD_ACTOR_FLIPS=Object.freeze([1,1,1,-1,-1,-1,1,1]);
let fieldArt=freshFieldArtwork();
function freshFieldArtwork(){return{status:'idle',rows:{},motion:new WeakMap(),serial:0,combat:freshFieldCombat(),breaker:freshFieldBreaker(),warden:freshFieldWarden(),harvester:freshFieldHarvester(),riot:freshFieldRiot(),spitter:freshFieldSpitter(),howler:freshFieldHowler(),lobber:freshFieldLobber(),hunter:freshFieldHunter()}}
function releaseFieldArtwork(){for(const row of [...Object.values(fieldArt.rows),...Object.values(fieldArt.breaker.rows),...(fieldArt.warden.row?[fieldArt.warden.row]:[]),...(fieldArt.harvester.row?[fieldArt.harvester.row]:[]),...(fieldArt.riot.row?[fieldArt.riot.row]:[]),...(fieldArt.spitter.row?[fieldArt.spitter.row]:[]),...(fieldArt.howler.row?[fieldArt.howler.row]:[]),...(fieldArt.lobber.row?[fieldArt.lobber.row]:[]),...(fieldArt.hunter.row?[fieldArt.hunter.row]:[])])if(row.image){row.image.onload=null;row.image.onerror=null}fieldArt=freshFieldArtwork()}
function fieldArtStatus(){return fieldStyle()==='classic'?'Classic actors selected.':training&&!bossLab&&!mainPerfTest?'Field actors are selected for normal runs; practice keeps its own artwork.':fieldArt.status==='ready'?'Field actors ready · survivor, Shambler, Runner and Brute.'+fieldBreakerStatus()+fieldWardenStatus()+fieldHarvesterStatus()+fieldRiotStatus()+fieldSpitterStatus()+fieldHowlerStatus()+fieldLobberStatus()+fieldHunterStatus():fieldArt.status==='loading'?'Loading field actors… Classic remains visible until ready.':fieldArt.status==='failed'?'Field artwork unavailable. Classic remains playable; switch styles or deploy again to retry.':bossLab?'Boss-test artwork loads on entry.':'Field actors load when you deploy a normal run.'}
function refreshFieldArtStatus(){const status=document.getElementById('fieldArtStatus');if(status&&status.textContent!==fieldArtStatus())status.textContent=fieldArtStatus()}
function failFieldArtwork(owner){if(fieldArt!==owner)return;for(const row of Object.values(owner.rows))if(row.image){row.image.onload=null;row.image.onerror=null}owner.rows={};owner.status='failed';refreshFieldArtStatus()}
function ensureFieldArtwork(){
 if(fieldStyle()!=='field'||fieldArt.status!=='idle')return;
 const owner=fieldArt;owner.status='loading';
 try{
  const data=JSON.parse(document.getElementById('sampleAssets').textContent);let pixels=0;
  for(const id of FIELD_ACTOR_ASSETS){const meta=data[id];if(!meta||!/^data:image\/(?:png|webp);base64,/.test(meta.src)||!meta.frames?.length||!meta.pivots?.length||!meta.referenceHeights?.length)throw Error('Missing actor art');pixels+=meta.width*meta.height*4;owner.rows[id]={ready:false,image:null,meta:{frames:meta.frames,pivots:meta.pivots,referenceHeights:meta.referenceHeights,...(meta.muzzles?{muzzles:meta.muzzles}:{})},src:meta.src}}
  if(!Number.isFinite(pixels)||pixels>32*1024*1024)throw Error('Actor art budget');
  for(const id of FIELD_ACTOR_ASSETS){
   if(owner.status==='failed')break;const row=owner.rows[id],image=new Image();row.image=image;
   image.onload=()=>{if(fieldArt!==owner||owner.status==='failed')return;if(!(image.naturalWidth>0&&image.naturalHeight>0)){failFieldArtwork(owner);return}image.onload=null;image.onerror=null;row.ready=true;if(FIELD_ACTOR_ASSETS.every(key=>owner.rows[key]?.ready)){owner.status='ready';prepareFieldBreaker();prepareFieldWarden();prepareFieldHarvester();prepareFieldRiot();prepareFieldSpitter();prepareFieldHowler();prepareFieldLobber();prepareFieldHunter()}refreshFieldArtStatus()};
   image.onerror=()=>failFieldArtwork(owner);image.src=row.src;delete row.src;
  }
 }catch{failFieldArtwork(owner)}refreshFieldArtStatus();
}
function fieldActorsActive(){return (!training||bossLab||!!mainPerfTest)&&!artSession&&!streetSession&&fieldStyle()==='field'&&fieldArt.status==='ready'}
function fieldEnemyKind(e){const kind=sampleEnemyKind(e);return kind&&kind!=='breaker'?kind:null}
function fieldActorStylePicker(){return `<div class="contract-picker"><label for="fieldActorStyle">ACTOR ART · ${mainPerfTest?'PERFORMANCE TEST':bossLab?'BOSS TESTING':'NORMAL RUNS'}</label><select id="fieldActorStyle"><option value="field">Field · animated people</option><option value="classic">Classic · previous actors</option></select><p id="fieldArtStatus" class="muted" role="status">${fieldArtStatus()}</p><p class="muted">${bossLab?'This actor choice is temporary for Boss Testing. ':''}Overhead camera and combat stay the same. All three bosses, four specialists and Blackout Hunters use Field artwork.</p></div>`}
function fieldActorPauseControl(){return `<button class="btn secondary" id="fieldActorCompare">SHOW ${fieldStyle()==='field'?'CLASSIC':'FIELD'} ACTORS</button><p id="fieldArtStatus" class="muted" role="status">${fieldArtStatus()}</p>`}
function selectFieldActors(style){
 if(!['paused','settings'].includes(mode)||document.hidden||!['classic','field'].includes(style))return;
 if(bossLab){bossLabField=style==='field';releaseFieldArtwork();if(!runLogged)ensureFieldArtwork();if(mode==='settings')renderSettings();else{mode='play';pause()}return}
 if(preferences.actors!==style){preferences.actors=style;releaseFieldArtwork();if(style==='field'&&(!training||!!mainPerfTest)&&(mode==='paused'||settingsReturn==='paused')&&!runLogged)ensureFieldArtwork();savePreferences()}
 if(mode==='settings')renderSettings();else{mode='play';pause()}
}
// Optional Breaker imagery is independent of the five common-actor sheets.
const FIELD_BREAKER_ASSETS=Object.freeze(['breakerWalk','breakerCombat']);
function freshFieldBreaker(){return{status:'idle',rows:{},seen:false}}
function releaseFieldBreaker(){for(const row of Object.values(fieldArt.breaker.rows))if(row.image){row.image.onload=null;row.image.onerror=null}fieldArt.breaker=freshFieldBreaker()}
function fieldBreakerStatus(){const status=fieldArt.breaker.status;return status==='idle'?'':status==='ready'?' · Breaker art ready.':status==='loading'?' · Loading Breaker art; Classic boss remains visible.':' · Breaker art unavailable; Classic boss remains playable.'}
function fieldBreakerWanted(){return bossLab&&training&&trainingScenario==='breaker'||activeBoss?.hp>0&&activeBoss.bossKind==='breaker'||!activeBoss&&bossWarned&&nextBossKind()==='breaker'||fieldDefeatWanted('breaker')}
function failFieldBreaker(owner,group){if(fieldArt!==owner||owner.breaker!==group)return;for(const row of Object.values(group.rows))if(row.image){row.image.onload=null;row.image.onerror=null}group.rows={};group.status='failed';refreshFieldArtStatus()}
function loadFieldBreakerImage(owner,group,id,meta){
 const row={ready:false,image:null,meta:{frames:meta.frames,pivots:meta.pivots,referenceHeights:meta.referenceHeights}};group.rows[id]=row;const image=new Image();row.image=image;
 image.onload=()=>{if(fieldArt!==owner||owner.breaker!==group||group.status==='failed')return;if(!(image.naturalWidth>0&&image.naturalHeight>0)){failFieldBreaker(owner,group);return}image.onload=null;image.onerror=null;row.ready=true;if(FIELD_BREAKER_ASSETS.every(key=>group.rows[key]?.ready))group.status='ready';refreshFieldArtStatus()};
 image.onerror=()=>failFieldBreaker(owner,group);image.src=meta.src;
}
function prepareFieldBreaker(){
 if(!fieldActorsActive()||runLogged)return;
 const owner=fieldArt,group=owner.breaker,wanted=fieldBreakerWanted();
 if(!wanted){if(group.status!=='idle'){releaseFieldBreaker();refreshFieldArtStatus()}return}
 if(activeBoss?.bossKind==='breaker')group.seen=true;if(group.status!=='idle')return;if(owner.warden.status!=='idle')releaseFieldWarden();if(owner.harvester.status!=='idle')releaseFieldHarvester();group.status='loading';
 try{const data=JSON.parse(document.getElementById('sampleAssets').textContent);let bytes=0;for(const id of FIELD_BREAKER_ASSETS){const meta=data[id];if(!meta||!/^data:image\/(?:png|webp);base64,/.test(meta.src)||meta.frames?.length!==(id==='breakerCombat'?25:4)||!meta.pivots?.length||!meta.referenceHeights?.every(n=>Number.isFinite(n)&&n>0))throw Error('Missing Breaker art');bytes+=meta.width*meta.height*4}if(!Number.isFinite(bytes)||bytes>12*1024*1024)throw Error('Breaker pixel budget');for(const id of FIELD_BREAKER_ASSETS){if(group.status==='failed')break;loadFieldBreakerImage(owner,group,id,data[id])}}
 catch{failFieldBreaker(owner,group)}refreshFieldArtStatus();
}
function fieldBreakerActive(e){return fieldActorsActive()&&!!e&&e===activeBoss&&e.hp>0&&e.bossKind==='breaker'&&fieldArt.breaker.status==='ready'}
function fieldBreakerPose(e,motion){
 const locked=['warn','charge','recover'].includes(e.phase),dx=locked?e.chargeX||0:p.x-e.x,dy=locked?e.chargeY||0:p.y-e.y,direction=Math.hypot(dx,dy)>.00001?(Math.round(Math.atan2(dy,dx)/(Math.PI/4))+8)%8:motion?.direction||0,column=[0,1,2,1,0,3,4,3][direction],flip=FIELD_ACTOR_FLIPS[direction];let row=0;
 if(e.phase==='warn')row=clamp(1-e.phaseTime/BREAKER_TUNING.windup,0,1)>=.42?1:0;
 else if(e.phase==='charge')row=2+Math.min(3,Math.floor(clamp(1-e.phaseTime/BREAKER_TUNING.chargeTime,0,1)*4))%2;
 else if(e.phase==='recover')row=clamp(1-e.phaseTime/BREAKER_TUNING.recovery,0,1)<.65?4:0;
 return{pose:{asset:'breakerCombat',frame:row*5+column},direction,flip};
}
function fieldBreakerMotion(e){let motion=fieldArt.motion.get(e);if(!motion){const key=fieldBreakerPose(e);motion={x:e.x,y:e.y,travel:0,moving:false,direction:key.direction,flip:key.flip,pose:key.pose,previous:null,changedAt:elapsed,blend:0};fieldArt.motion.set(e,motion)}return motion}
function advanceFieldBreaker(dt){
 if(mode!=='play'||!(dt>0)||!fieldBreakerActive(activeBoss))return;
 const e=activeBoss,motion=fieldBreakerMotion(e),dx=e.x-motion.x,dy=e.y-motion.y,distance=Math.hypot(dx,dy),teleport=distance>1200*dt+2;motion.x=e.x;motion.y=e.y;motion.moving=!teleport&&distance/dt>3;if(teleport){motion.travel=0;motion.previous=null}if(motion.moving)motion.travel=(motion.travel+distance)%96;
 const key=fieldBreakerPose(e,motion);let pose=key.pose,flip=key.flip;
 if(e.phase==='approach'&&motion.moving){pose={asset:'breakerWalk',frame:Math.floor(motion.travel/96*4)%4};flip=Math.abs(dx)>.01?(dx<0?-1:1):motion.flip}
 const walking=pose.asset==='breakerWalk'&&motion.pose.asset===pose.asset;
 if(pose.asset!==motion.pose.asset||pose.frame!==motion.pose.frame||flip!==motion.flip){motion.previous={...motion.pose,flip:motion.flip};motion.pose=pose;motion.changedAt=elapsed;motion.blend=preferences.reduced?0:walking?.045:e.phase==='charge'?.035:e.phase==='recover'&&pose.frame<5?clamp(e.phaseTime,.06,.38):.09}motion.flip=flip;motion.direction=key.direction;
 if(motion.previous&&(preferences.reduced||elapsed-motion.changedAt>=motion.blend))motion.previous=null;
}

// Warden presentation reads native aimAngle/phase; it never emits attacks.
function freshFieldWarden(){return{status:'idle',row:null}}
function releaseFieldWarden(){const row=fieldArt.warden.row;if(row?.image){row.image.onload=null;row.image.onerror=null}fieldArt.warden=freshFieldWarden()}
function fieldWardenStatus(){const status=fieldArt.warden.status;return status==='idle'?'':status==='ready'?' · Warden art ready.':status==='loading'?' · Loading Warden art; Classic boss remains visible.':' · Warden art unavailable; Classic boss remains playable.'}
function fieldWardenWanted(){return bossLab&&training&&trainingScenario==='warden'||activeBoss?.hp>0&&activeBoss.bossKind==='warden'||!activeBoss&&bossWarned&&nextBossKind()==='warden'||fieldDefeatWanted('warden')}
function failFieldWarden(owner,group){if(fieldArt!==owner||owner.warden!==group)return;if(group.row?.image){group.row.image.onload=null;group.row.image.onerror=null}group.row=null;group.status='failed';refreshFieldArtStatus()}
function loadFieldWardenImage(owner,group,meta){
 const row={ready:false,image:null,meta:{frames:meta.frames,pivots:meta.pivots,referenceHeights:meta.referenceHeights}};group.row=row;const image=new Image();row.image=image;
 image.onload=()=>{if(fieldArt!==owner||owner.warden!==group||group.status==='failed')return;if(!(image.naturalWidth>0&&image.naturalHeight>0)){failFieldWarden(owner,group);return}image.onload=null;image.onerror=null;row.ready=true;group.status='ready';refreshFieldArtStatus()};image.onerror=()=>failFieldWarden(owner,group);image.src=meta.src;
}
function prepareFieldWarden(){
 if(!fieldActorsActive()||runLogged)return;const owner=fieldArt,group=owner.warden;
 if(!fieldWardenWanted()){if(group.status!=='idle'){releaseFieldWarden();refreshFieldArtStatus()}return}
 if(group.status!=='idle')return;if(owner.breaker.status!=='idle')releaseFieldBreaker();if(owner.harvester.status!=='idle')releaseFieldHarvester();group.status='loading';
 try{const meta=JSON.parse(document.getElementById('sampleAssets').textContent).warden;if(!meta||!/^data:image\/(?:png|webp);base64,/.test(meta.src)||meta.frames?.length!==35||meta.pivots?.length!==35||meta.referenceHeights?.length!==5||!meta.referenceHeights.every(n=>Number.isFinite(n)&&n>0)||!(meta.width*meta.height*4>0)||meta.width*meta.height*4>12*1024*1024)throw Error('Warden atlas');loadFieldWardenImage(owner,group,meta)}catch{failFieldWarden(owner,group)}refreshFieldArtStatus();
}
function fieldWardenActive(e){return fieldActorsActive()&&!!e&&e===activeBoss&&e.hp>0&&e.bossKind==='warden'&&fieldArt.warden.status==='ready'}
function fieldWardenPose(e,motion){
 const locked=e.phase==='warn'||e.phase==='recover',angle=locked?e.aimAngle:motion?.moving?Math.atan2(motion.dy,motion.dx):Math.atan2(p.y-e.y,p.x-e.x),direction=(Math.round(angle/(Math.PI/4))+8)%8,column=[0,1,2,1,0,3,4,3][direction];
 let row=motion?.moving?Math.floor((motion.travel||0)/84*4)%4:0;if(e.phase==='warn')row=4;else if(e.phase==='recover'){const t=clamp(1-e.phaseTime/WARDEN_TUNING.recovery,0,1);row=t<.1?5:t<.82?6:0}
 return{pose:{asset:'warden',frame:row*5+column},direction,flip:FIELD_ACTOR_FLIPS[direction]};
}
function fieldWardenMotion(e){let motion=fieldArt.motion.get(e);if(!motion){const key=fieldWardenPose(e);motion={x:e.x,y:e.y,dx:0,dy:0,travel:0,moving:false,direction:key.direction,flip:key.flip,pose:key.pose,previous:null,changedAt:elapsed,blend:0};fieldArt.motion.set(e,motion)}return motion}
function advanceFieldWarden(dt){
 if(mode!=='play'||!(dt>0)||!fieldWardenActive(activeBoss))return;const e=activeBoss,motion=fieldWardenMotion(e),dx=e.x-motion.x,dy=e.y-motion.y,distance=Math.hypot(dx,dy),teleport=distance>1200*dt+2;motion.x=e.x;motion.y=e.y;motion.dx=dx;motion.dy=dy;motion.moving=!teleport&&distance/dt>3;if(teleport){motion.travel=0;motion.previous=null}if(motion.moving)motion.travel=(motion.travel+distance)%84;
 const key=fieldWardenPose(e,motion);if(key.pose.frame!==motion.pose.frame||key.flip!==motion.flip){motion.previous={...motion.pose,flip:motion.flip};motion.pose=key.pose;motion.changedAt=elapsed;motion.blend=preferences.reduced?0:e.phase==='approach'?.045:e.phase==='recover'&&key.pose.frame>=25&&key.pose.frame<30?.035:.09}motion.flip=key.flip;motion.direction=key.direction;if(motion.previous&&(preferences.reduced||elapsed-motion.changedAt>=motion.blend))motion.previous=null;
}

// Harvester artwork follows native pulse phase; only native code resolves damage.
function freshFieldHarvester(){return{status:'idle',row:null}}
function releaseFieldHarvester(){const row=fieldArt.harvester.row;if(row?.image){row.image.onload=null;row.image.onerror=null}fieldArt.harvester=freshFieldHarvester()}
function fieldHarvesterStatus(){const s=fieldArt.harvester.status;return s==='idle'?'':s==='ready'?' · Harvester art ready.':s==='loading'?' · Loading Harvester art; Classic boss remains visible.':' · Harvester art unavailable; Classic boss remains playable.'}
function fieldHarvesterWanted(){return bossLab&&training&&trainingScenario==='harvester'||activeBoss?.hp>0&&activeBoss.bossKind==='harvester'||!activeBoss&&bossWarned&&nextBossKind()==='harvester'||fieldDefeatWanted('harvester')}
function failFieldHarvester(owner,group){if(fieldArt!==owner||owner.harvester!==group)return;if(group.row?.image){group.row.image.onload=null;group.row.image.onerror=null}group.row=null;group.status='failed';refreshFieldArtStatus()}
function loadFieldHarvesterImage(owner,group,meta){
 const row={ready:false,image:null,meta:{frames:meta.frames,pivots:meta.pivots,referenceHeights:meta.referenceHeights}};group.row=row;const image=new Image();row.image=image;
 image.onload=()=>{if(fieldArt!==owner||owner.harvester!==group||group.status==='failed')return;if(!(image.naturalWidth>0&&image.naturalHeight>0)){failFieldHarvester(owner,group);return}image.onload=null;image.onerror=null;row.ready=true;group.status='ready';refreshFieldArtStatus()};image.onerror=()=>failFieldHarvester(owner,group);image.src=meta.src;
}
function prepareFieldHarvester(){
 if(!fieldActorsActive()||runLogged)return;const owner=fieldArt,group=owner.harvester;
 if(!fieldHarvesterWanted()){if(group.status!=='idle'){releaseFieldHarvester();refreshFieldArtStatus()}return}
 if(group.status!=='idle')return;if(owner.breaker.status!=='idle')releaseFieldBreaker();if(owner.warden.status!=='idle')releaseFieldWarden();group.status='loading';
 try{const meta=JSON.parse(document.getElementById('sampleAssets').textContent).harvester;if(!meta||!/^data:image\/(?:png|webp);base64,/.test(meta.src)||meta.frames?.length!==35||meta.pivots?.length!==35||meta.referenceHeights?.length!==5||!meta.referenceHeights.every(n=>Number.isFinite(n)&&n>0)||!(meta.width*meta.height*4>0)||meta.width*meta.height*4>12*1024*1024)throw Error('Harvester atlas');loadFieldHarvesterImage(owner,group,meta)}catch{failFieldHarvester(owner,group)}refreshFieldArtStatus();
}
function fieldHarvesterActive(e){return fieldActorsActive()&&!!e&&e===activeBoss&&e.hp>0&&e.bossKind==='harvester'&&fieldArt.harvester.status==='ready'}
function fieldHarvesterPose(e,motion){
 const locked=e.phase==='warn'||e.phase==='recover',angle=motion?.moving?Math.atan2(motion.dy,motion.dx):Math.atan2(p.y-e.y,p.x-e.x),direction=locked&&motion?motion.direction:(Math.round(angle/(Math.PI/4))+8)%8,column=[0,1,2,1,0,3,4,3][direction];
 let row=motion?.moving?Math.floor((motion.travel||0)/88*4)%4:0;if(e.phase==='warn')row=4;else if(e.phase==='recover'){const t=clamp(1-e.phaseTime/HARVESTER_TUNING.recovery,0,1);row=t<.12?5:t<.82?6:0}
 return{pose:{asset:'harvester',frame:row*5+column},direction,flip:FIELD_ACTOR_FLIPS[direction]};
}
function fieldHarvesterMotion(e){let motion=fieldArt.motion.get(e);if(!motion){const k=fieldHarvesterPose(e);motion={x:e.x,y:e.y,dx:0,dy:0,travel:0,moving:false,direction:k.direction,flip:k.flip,pose:k.pose,previous:null,changedAt:elapsed,blend:0};fieldArt.motion.set(e,motion)}return motion}
function advanceFieldHarvester(dt){
 if(mode!=='play'||!(dt>0)||!fieldHarvesterActive(activeBoss))return;const e=activeBoss,m=fieldHarvesterMotion(e),dx=e.x-m.x,dy=e.y-m.y,d=Math.hypot(dx,dy),teleport=d>1200*dt+2;m.x=e.x;m.y=e.y;m.dx=dx;m.dy=dy;m.moving=!teleport&&d/dt>3;if(teleport){m.travel=0;m.previous=null}if(m.moving)m.travel=(m.travel+d)%88;
 const k=fieldHarvesterPose(e,m);if(k.pose.frame!==m.pose.frame||k.flip!==m.flip){m.previous={...m.pose,flip:m.flip};m.pose=k.pose;m.changedAt=elapsed;m.blend=preferences.reduced?0:e.phase==='approach'?.045:e.phase==='recover'&&k.pose.frame>=25&&k.pose.frame<30?.035:.09}m.flip=k.flip;m.direction=k.direction;if(m.previous&&(preferences.reduced||elapsed-m.changedAt>=m.blend))m.previous=null;
}

// Riot presentation follows native facing/shield state; it creates no collision or attacks.
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

function fieldSeedMotion(e,kind){const serial=fieldArt.serial++,direction=kind==='survivor'?streetHeading(lastMove.x,lastMove.y,0):streetHeading(p.x-e.x,p.y-e.y,0),motion={x:e.x,y:e.y,travel:0,moving:false,direction,flip:FIELD_ACTOR_FLIPS[direction],pose:{asset:kind==='survivor'?'survivorWalk':STREET_ENEMY_GAITS[kind].asset,frame:FIELD_ACTOR_ROWS[direction]*4},previous:null,changedAt:elapsed,offset:kind==='survivor'?0:serial*.173%1,aim:null};fieldArt.motion.set(e,motion);return motion}
function advanceFieldActors(dt){
 if(training&&!bossLab&&!mainPerfTest||streetSession||artSession||mode!=='play'||fieldStyle()!=='field'||!(dt>0))return;
 advanceFieldCombat();prepareFieldBreaker();prepareFieldWarden();prepareFieldHarvester();prepareFieldRiot();prepareFieldSpitter();prepareFieldHowler();prepareFieldLobber();prepareFieldHunter();advanceFieldBreaker(dt);advanceFieldWarden(dt);advanceFieldHarvester(dt);advanceFieldRiot(dt);advanceFieldSpitter(dt);advanceFieldHowler(dt);advanceFieldLobber(dt);advanceFieldHunter(dt);
 for(const e of [p,...enemies]){
  const kind=e===p?'survivor':fieldEnemyKind(e);if(!kind||e.hp<=0)continue;
  const motion=fieldArt.motion.get(e)||fieldSeedMotion(e,kind),dx=e.x-motion.x,dy=e.y-motion.y,distance=Math.hypot(dx,dy),teleport=distance>1200*dt+2;
  motion.x=e.x;motion.y=e.y;motion.moving=!teleport&&distance/dt>3;if(teleport){motion.travel=0;motion.previous=null}
  const stride=kind==='survivor'?76:STREET_ENEMY_GAITS[kind].stride;if(motion.moving)motion.travel=(motion.travel+distance)%stride;
  const target=kind==='survivor'?(gunTarget()||{x:e.x+lastMove.x,y:e.y+lastMove.y}):p,sx=motion.moving?dx:target.x-e.x,sy=motion.moving?dy:target.y-e.y;
  if(motion.moving||Math.hypot(sx,sy)>14)motion.direction=streetHeading(sx,sy,motion.direction);
  const rows=FIELD_ACTOR_ROWS,flips=FIELD_ACTOR_FLIPS,phase=motion.moving&&!(kind==='survivor'&&p.dash>0)?Math.floor((motion.travel/stride+motion.offset)%1*4):0,pose={asset:motion.pose.asset,frame:rows[motion.direction]*4+phase},flip=flips[motion.direction];
  if(pose.frame!==motion.pose.frame||flip!==motion.flip){motion.previous={...motion.pose,flip:motion.flip};motion.pose=pose;motion.changedAt=elapsed}motion.flip=flip;
  if(motion.previous&&(preferences.reduced||elapsed-motion.changedAt>=.045))motion.previous=null;
  if(kind==='survivor'){
   const direction=streetHeading(target.x-e.x,target.y-e.y,motion.aim?.direction??motion.direction),row=rows[direction],aimFlip=flips[direction];
   if(!motion.aim||motion.aim.direction!==direction)motion.aim={direction,row,flip:aimFlip,previous:motion.aim?{row:motion.aim.row,flip:motion.aim.flip}:null,changedAt:elapsed};
   if(motion.aim.previous&&(preferences.reduced||elapsed-motion.aim.changedAt>=.06))motion.aim.previous=null;
  }
 }
}
function fieldPoseInfo(pose,kind){const row=kind==='hunter'?fieldArt.hunter.row:kind==='lobber'?fieldArt.lobber.row:kind==='howler'?fieldArt.howler.row:kind==='spitter'?fieldArt.spitter.row:kind==='riot'?fieldArt.riot.row:kind==='harvester'?fieldArt.harvester.row:kind==='warden'?fieldArt.warden.row:(kind==='breaker'?fieldArt.breaker.rows:fieldArt.rows)[pose.asset],meta=row?.meta,crop=meta?.frames[pose.frame],pivot=meta?.pivots[pose.frame],height=FIELD_ACTOR_HEIGHTS[kind],reference=meta?.referenceHeights[kind==='hunter'||kind==='lobber'||kind==='howler'||kind==='spitter'||kind==='riot'||kind==='warden'||kind==='harvester'?pose.frame%5:kind==='breaker'?(pose.asset==='breakerCombat'?pose.frame%5:0):Math.floor(pose.frame/4)];return{image:row?.ready?row.image:null,crop,pivot,scale:height/reference,height,flip:pose.flip}}
function fieldActorInfo(e,kind){
 const motion=kind==='hunter'?fieldHunterMotion(e):kind==='lobber'?fieldLobberMotion(e):kind==='howler'?fieldHowlerMotion(e):kind==='spitter'?fieldSpitterMotion(e):kind==='riot'?fieldRiotMotion(e):kind==='harvester'?fieldHarvesterMotion(e):kind==='warden'?fieldWardenMotion(e):kind==='breaker'?fieldBreakerMotion(e):fieldArt.motion.get(e)||fieldSeedMotion(e,kind),current=fieldPoseInfo({...motion.pose,flip:motion.flip},kind),blend=kind==='hunter'||kind==='lobber'||kind==='howler'||kind==='spitter'||kind==='riot'||kind==='breaker'||kind==='warden'||kind==='harvester'?motion.blend:.045,t=motion.previous&&!preferences.reduced&&blend>0?clamp((elapsed-motion.changedAt)/blend,0,1):1,weight=t*t*(3-2*t);
 return{...current,motion,layers:motion.previous&&weight<1?[{...fieldPoseInfo(motion.previous,kind),weight:1-weight},{...current,weight}]:[{...current,weight:1}]};
}
function drawFieldLayers(ctx,layers,alpha){for(const layer of layers){if(!layer.image||!layer.crop||!layer.pivot||!(layer.scale>0)||layer.weight<=0)continue;ctx.save();ctx.scale(layer.flip,1);ctx.globalAlpha=alpha*layer.weight;ctx.drawImage(layer.image,...layer.crop,-layer.pivot[0]*layer.scale,-layer.pivot[1]*layer.scale,layer.crop[2]*layer.scale,layer.crop[3]*layer.scale);ctx.restore()}}
function drawFieldSurvivor(ctx,info,alpha){
 const trackedAim=info.motion.aim,shot=fieldShotVisual(),aim=shot.flash?{row:shot.row,flip:shot.flip,previous:null,changedAt:elapsed}:trackedAim,row=fieldArt.rows.survivorAim;if(!aim||!row?.ready){drawFieldLayers(ctx,info.layers,alpha);return}
 const waist=22;ctx.save();ctx.beginPath();ctx.rect(-90,-waist,180,100);ctx.clip();drawFieldLayers(ctx,info.layers,alpha);ctx.restore();
 const t=aim.previous&&!preferences.reduced?clamp((elapsed-aim.changedAt)/.06,0,1):1,weight=t*t*(3-2*t),poses=aim.previous&&weight<1?[{...aim.previous,weight:1-weight},{row:aim.row,flip:aim.flip,weight}]:[{...aim,weight:1}];
 ctx.save();ctx.translate(-(shot.dx||0)*shot.recoil,-waist+1.5-(shot.dy||0)*shot.recoil);drawFieldLayers(ctx,poses.map(pose=>({image:row.image,crop:row.meta.frames[pose.row],pivot:row.meta.pivots[pose.row],scale:32/row.meta.referenceHeights[pose.row],flip:pose.flip,weight:pose.weight})),alpha);ctx.restore();
 if(shot.flash){const tip=row.meta.muzzles?.[shot.row],pivot=row.meta.pivots[shot.row],scale=32/row.meta.referenceHeights[shot.row];if(tip?.every(Number.isFinite)){ctx.save();ctx.translate((tip[0]-pivot[0])*scale*shot.flip-shot.dx*shot.recoil,-waist+1.5+(tip[1]-pivot[1])*scale-shot.dy*shot.recoil);ctx.rotate(Math.atan2(shot.dy,shot.dx));ctx.fillStyle='#ffe7a7';ctx.globalAlpha=.9;ctx.beginPath();ctx.moveTo(0,-1.3);ctx.lineTo(5.5,0);ctx.lineTo(0,1.3);ctx.lineTo(-1,0);ctx.closePath();ctx.fill();ctx.restore()}}
}
function drawFieldActor(ctx,e,kind){
 if(!fieldActorsActive()||kind==='breaker'&&!fieldBreakerActive(e)||kind==='warden'&&!fieldWardenActive(e)||kind==='harvester'&&!fieldHarvesterActive(e)||kind==='riot'&&!fieldRiotActive(e)||kind==='spitter'&&!fieldSpitterActive(e)||kind==='howler'&&!fieldHowlerActive(e)||kind==='lobber'&&!fieldLobberActive(e)||kind==='hunter'&&!fieldHunterActive(e))return false;
 if(e.x<p.x-W/2-90||e.x>p.x+W/2+90||e.y<p.y-H/2-90||e.y>p.y+H/2+110)return true;
 const info=fieldActorInfo(e,kind);if(!info.image||!info.crop||!info.pivot)return false;
 ctx.save();ctx.translate(e.x,e.y);ctx.fillStyle='#02070a99';ctx.beginPath();ctx.ellipse(2,3,e.r,e.r*.45,0,0,7);ctx.fill();
 if(kind==='hunter'){ctx.strokeStyle='#c9b4ff';ctx.lineWidth=1.3;ctx.beginPath();ctx.ellipse(0,e.r*.5,e.r+1,e.r*.4,0,0,Math.PI*2);ctx.stroke()}
 if(kind==='survivor'){ctx.strokeStyle=p.color||'#8cf9d4';ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(0,0,e.r+3,0,Math.PI*2);ctx.stroke()}
 const alpha=e.hit||kind==='survivor'&&p.inv>0&&Math.floor(elapsed*15)%2?.6:1;ctx.translate(0,e.r*.6);ctx.imageSmoothingEnabled=true;
 if(kind==='survivor')drawFieldSurvivor(ctx,info,alpha);else{const shear=fieldReaction(e,kind);if(shear)ctx.transform(1,0,shear,1,0,0);drawFieldLayers(ctx,info.layers,alpha)}ctx.restore();return true;
}

// Bounded visual notifications; native simulation alone owns damage and credit.
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
const FIELD_WORLD_PALETTES=Object.freeze({downtown:{floor:'#222b31',road:'#141d24',edge:'#526063',paint:'#aaa58a55',accent:'#81bcc5',warm:'#c99862'},freight:{floor:'#252c2c',road:'#1c2428',edge:'#62645b',paint:'#a29c7155',accent:'#9ba999',warm:'#b88b59'},riverside:{floor:'#202d32',road:'#17262e',edge:'#59757c',paint:'#99ada455',accent:'#82bbca',warm:'#c4a675'},park:{floor:'#202f29',road:'#39413b',edge:'#687669',paint:'#b5b5a355',accent:'#8daa8b',warm:'#b2a178'},market:{floor:'#2b2e31',road:'#1d252b',edge:'#6c6e67',paint:'#c4b79d55',accent:'#9bbbbb',warm:'#c49b72'}});
let fieldWorldCache=freshFieldWorldCache();
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
 const phase=(elapsed*.55+(seed%31)/31)%1;g.globalAlpha=(1-phase)*.6;g.strokeStyle='#a1c0c04d';g.lineWidth=.75;g.beginPath();g.ellipse((seed%13)-6,1,2+phase*8,1+phase*2.5,0,0,Math.PI*2);g.stroke();g.restore();
}
function drawFieldWetReflection(x,y,color){
 const seed=fieldWorldHash(Math.round(x),Math.round(y),79);g.save();g.strokeStyle=color+'35';g.lineWidth=1;g.beginPath();for(let i=0;i<5;i++){const y0=y+7+i*5,half=17-i*2,offset=((seed>>>(i*3))%5)-2;g.moveTo(x-half+offset,y0);g.lineTo(x-3+offset,y0+.5);g.moveTo(x+1+offset,y0);g.lineTo(x+half+offset,y0-.5)}g.stroke();g.restore();
}
function drawFieldRain(tiles,left,top){
 if(preferences.reduced)return;g.save();g.strokeStyle='#9abac221';g.lineWidth=.7;g.beginPath();for(const tile of tiles){if(tile.x+180<left||tile.x>left+W+5||tile.y+180<top||tile.y>top+H+5)continue;for(let i=0;i<2;i++){const h=fieldWorldHash(tile.seed,i,83),phase=(elapsed*145+(h>>>8)%160)%160,x=tile.x+h%145+phase*.08,y=tile.y+phase;g.moveTo(x-1.5,y-6);g.lineTo(x,y)}}g.stroke();g.restore();
}

function drawFieldWorldGround(left,top){
 if(!fieldWorldActive())return false;const palette=FIELD_WORLD_PALETTES[runRoute]||FIELD_WORLD_PALETTES.downtown,tiles=fieldWorldTiles(left,top);g.save();g.fillStyle=palette.floor;g.fillRect(left-5,top-5,W+10,H+10);drawFieldWorldRoute(left,top,palette);drawFieldRouteDressing(left,top,tiles);
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

// Foreground accents reuse native attack/goal geometry; never advance state.
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

function showArtSample(){
 if(!['menu','end','art-menu','previews'].includes(mode))return;mode='art-menu';artLook=true;
 show(`<div class="eyebrow">ART & AUDIO DIRECTION · REVIEW SAMPLE</div><h1 style="font-size:40px">LAST LIGHT<br>ON THE STREET</h1><p>A grounded realism study: detailed human anatomy, worn clothing, a compact held firearm, and a wet street with warm practical lighting. This is a proposed direction for your review.</p><canvas id="artBoard" role="img" aria-label="Proposed survivor, Shambler, Runner, Brute and Breaker on a night street" style="width:100%;height:auto;border-radius:12px"></canvas><p class="muted">The board and playable sample use the same artwork. The survivor’s firearm is part of the held pose; the old oversized gun overlay is removed. The Runner is a small, orange-clothed infected person. Street facades are decorative and do not block movement.</p><details class="medal-goals"><summary>SURVIVOR DETAIL VIEW</summary><canvas id="artDetail" role="img" aria-label="Enlarged survivor and two walking poses" style="width:100%;height:auto"></canvas><p class="muted">An enlarged view of the same survivor artwork used in practice.</p></details><p id="artAssetStatus" class="muted" role="status">Loading artwork…</p><div class="cards two"><button class="choice" id="artStreet" disabled><b>WALK THE STREET</b><span>Unscored weapon range · normal movement and Dash · respawning targets</span></button><button class="choice" id="artBreaker" disabled><b>TRY THE BREAKER DRILL</b><span>Actual warning and charge · no HP loss or records</span></button></div><p>Pause to compare Classic / Proposed without resetting the drill. Other enemies and the wider game keep their current art until you approve a direction.</p>${sampleAudioButtons()}<p class="muted">Sound follows your current Sound setting. These are synthesized gun, impact, Dash and warning sketches. Background music follows the separate Music level during play.</p><button class="btn secondary" id="artBack">BACK TO PREVIEWS</button>`);
 ensureSampleArtwork();bindUpgradePress(document.getElementById('artStreet'),()=>{if(mode==='art-menu'&&sampleArtworkReady()){mode='training-menu';startTraining('pierce',false,'targets',true)}},()=>mode==='art-menu');bindUpgradePress(document.getElementById('artBreaker'),()=>{if(mode==='art-menu'&&sampleArtworkReady()){mode='training-menu';startTraining('pierce',false,'breaker',true)}},()=>mode==='art-menu');bindSampleAudio();bindPress(document.getElementById('artBack'),showPreviews);
}
function sampleAudioButtons(){return `<div class="result-actions">${['gun','impact','dash','warning'].map(id=>`<button class="btn secondary" id="sample-${id}">HEAR ${id.toUpperCase()}</button>`).join('')}</div>`}
function sampleCuePlan(id){return({gun:[[620,180,.055,'triangle',.012],[130,60,.08,'sine',.014]],impact:[[190,55,.09,'triangle',.02]],dash:[[170,600,.13,'sine',.018]],warning:[[160,80,.25,'triangle',.025],[320,160,.18,'sine',.012]]})[id]||null}
function playStyleAudio(id){
 const plan=sampleCuePlan(id);if(!plan||sampleAudioVoices>=6)return;for(const [from,to,len,type,volume] of plan){if(sampleAudioVoices>=6)break;if(startAudioVoice(from,to,len,type,volume,id==='warning'?'alerts':'effects',()=>{sampleAudioVoices=Math.max(0,sampleAudioVoices-1)}))sampleAudioVoices++}
}
function sampleSound(id){if(mode!=='art-menu'&&!(mode==='paused'&&artSession))return;if(artLook)playStyleAudio(id);else{const original={gun:[460,.035,'square',.009],impact:[130,.055,'triangle',.018],dash:[190,.14,'sawtooth',.02],warning:[110,.12,'sawtooth',.025]}[id];if(original)sound(...original,id==='warning'?'alerts':'effects')}}
function bindSampleAudio(){for(const id of ['gun','impact','dash','warning'])bindPress(document.getElementById('sample-'+id),()=>sampleSound(id))}
function combatCue(id,freq,len,type,volume){if(sampleLookActive())playStyleAudio(id);else sound(freq,len,type,volume)}
function samplePauseControls(){if(streetSession)return streetPauseControls();return artSession&&training?`<details class="medal-goals" open><summary>ART & AUDIO REVIEW</summary><p>Current look/sound: ${artLook?'PROPOSED · GROUNDED REALISM':'CLASSIC · COMPACT WEAPON'}. This comparison changes presentation only. The original attack warnings and hit rules remain.</p><button class="btn secondary" id="sampleCompare">SHOW ${artLook?'CLASSIC':'PROPOSED'}</button>${sampleAudioButtons()}<p class="muted">Toggle Sound below if you cannot hear the samples. This drill is unscored; End Run returns to held practice stats.</p></details>`:''}
function bindSamplePause(){if(streetSession){bindStreetPause();return}if(!artSession||!training)return;bindSampleAudio();bindPress(document.getElementById('sampleCompare'),()=>{if(mode==='paused'&&training&&artSession){artLook=!artLook;mode='play';pause()}})}
// Developer boss access reuses damage-safe, unscored training; no saved cheat state.
const DEVELOPER_TARGETS=Object.freeze(['breaker','warden','harvester','riot','spitter','howler','lobber','hunter']);
function developerSpecialist(id=trainingScenario){return DEVELOPER_TARGETS.indexOf(id)>=3}
function developerTargetName(id=trainingScenario){return id==='riot'?'RIOT GUARD':id==='hunter'?'BLACKOUT HUNTER':id.toUpperCase()}
function fieldStyle(){return bossLab?(bossLabField?'field':'classic'):preferences.actors}
function bossTestSnapshot(){return Object.freeze({boss:trainingScenario,weapon:bossLabWeapon,evolved:trainingEvolved,attacks:bossLabFire,field:bossLabField})}
// Controlled main-renderer pressure fixtures; training owns score/HP isolation.
const MAIN_PERF_TESTS=Object.freeze(Object.fromEntries(Object.entries({early:{name:'Early',clock:0,count:12,gems:0,boss:null},crowded:{name:'Crowded',clock:150,count:100,gems:160,boss:'breaker'},overtime:{name:'Overtime',clock:600,count:220,gems:600,boss:null}}).map(([id,spec])=>[id,Object.freeze(spec)])));
function leaveMainPerfTest(){if(!mainPerfTest)return;const old=mainPerfTest.restore;mainPerfTest=null;preferences=old.preferences;musicOn=old.sound;diagnostics=freshPerformance(old.measuring);breakPerformanceSegment();clearInput();applyTouchLayout();applyAudioMix()}
function mainPerfSnapshot(){if(!mainPerfTest)return null;const spec=MAIN_PERF_TESTS[mainPerfTest.id];return Object.freeze({id:mainPerfTest.id,name:spec.name,clock:spec.clock,duration:Math.max(0,elapsed-mainPerfTest.startedAt),targetPopulation:spec.count,targetGems:spec.gems,actors:fieldStyle(),scenery:preferences.scenery,reduced:preferences.reduced,hud:preferences.hud,mirrored:preferences.mirrored,actorArt:fieldArtStatus(),viewport:`${W} × ${H} CSS px · ${W>=H?'landscape':'portrait'} · canvas DPR ${DPR}`,warmup:5,row:performanceSnapshot()})}
function startMainPerfTest(id,replay=null){
 if(document.hidden||!Object.prototype.hasOwnProperty.call(MAIN_PERF_TESTS,id)||!(['previews','end'].includes(mode)||mainPerfTest&&mode==='paused'))return;
 const held=mode==='paused',look={...preferences},soundOn=musicOn;if(replay){for(const key of ['actors','scenery','hud'])if((key==='hud'?['classic','composed']:key==='actors'?['classic','field']:['classic','street']).includes(replay[key]))look[key]=replay[key];for(const key of ['reduced','mirrored'])if(typeof replay[key]==='boolean')look[key]=replay[key]}leaveMainPerfTest();const restore={preferences,sound:musicOn,measuring:diagnostics.enabled},setup={selectedSurvivor,selectedRoute,selectedRule,selectedContract};
 selectedSurvivor='survivor';selectedRoute='downtown';selectedRule='standard';selectedContract='none';preferences=look;musicOn=soundOn;start(false,false);({selectedSurvivor,selectedRoute,selectedRule,selectedContract}=setup);training=true;trainingScenario='targets';runTimeline=[];const spec=MAIN_PERF_TESTS[id];mainPerfTest={id,restore,startedAt:spec.clock,refillAt:0,next:0,bossAt:0};elapsed=spec.clock;practiceStartedAt=elapsed;practiceThreatReadyAt=elapsed;diagnostics=freshPerformance(true);breakPerformanceSegment();
 spawn=nextBossAt=nextHowlerAt=nextLobberAt=nextConvoyAt=nextDropAt=nextSpitterAt=nextRiotAt=nextRescueAt=nextSalvageAt=nextSupplyAt=exitAt=barrelClock=barricadeClock=shockClock=Infinity;scheduleRush(Infinity);patrol=[];overtime=id==='overtime'?3:0;
 obstacles=[{x:-300,y:-200,w:110,h:70,type:0},{x:230,y:-180,w:100,h:80,type:1},{x:-310,y:200,w:120,h:70,type:0},{x:200,y:220,w:120,h:80,type:1}];barrels=[{x:160,y:140,r:17},{x:-160,y:-170,r:17}];barricades=[{x:95,y:-120,w:20,h:85,hp:90,max:90}];shockDrums=[{x:-170,y:130,r:17,spent:false}];
 if(id!=='early'){p.damage=id==='crowded'?54:120;p.fire=id==='crowded'?.2:.14;p.proj=id==='crowded'?3:5;p.pierce=id==='crowded'?1:3;p.arc=3;p.blades=id==='crowded'?2:3;level=id==='crowded'?12:40}if(id==='overtime'){p.molotov=3;p.rail=p.thunder=p.reaper=p.wildfire=true}nextXp=1e9;
 updateMainPerfTargets();applyTouchLayout();applyAudioMix();if(fieldStyle()==='field')ensureFieldArtwork();updateHUD();last=performance.now();toast('MAIN GAME PERFORMANCE TEST · HP SAFE · UNSCORED',4000);if(held)pause();
}
function makeMainPerfEnemy(kind,index){
 const spec=MAIN_PERF_TESTS[mainPerfTest.id],base={shambler:[30,70,12],runner:[19,130,9],brute:[95,49,20],hunter:[24,145,9],spitter:[42,82,10],riot:[55,62,12],howler:[50,68,10],lobber:[65,55,10]}[kind],a=index*2.399963,r=mainPerfTest.id==='early'?190+index%4*20:90+index%11*19,hp=base[0]*(1+spec.clock/200);
 return {...ENEMY_ART[kind],x:p.x+Math.cos(a)*r,y:p.y+Math.sin(a)*r,hp,max:hp,speed:base[1]*(ENEMY_ART[kind].type<3?Math.min(1.6,1+spec.clock/350):1)*overtimePressure().speed,dmg:base[2],hit:0,trainingDummy:true,trainingLive:true,perfKind:kind,phase:'approach',phaseTime:0,cooldown:1.2,facing:a+Math.PI,aimX:0,aimY:1,pulseUntil:0};
}
function updateMainPerfTargets(){
 if(!mainPerfTest||mode!=='play')return;if(activeBoss?.hp<=0){activeBoss=null;mainPerfTest.bossAt=elapsed+2}if(elapsed<mainPerfTest.refillAt)return;mainPerfTest.refillAt=elapsed+.2;const spec=MAIN_PERF_TESTS[mainPerfTest.id];enemies=enemies.filter(e=>e.hp>0)
 if(spec.boss&&!activeBoss&&elapsed>=mainPerfTest.bossAt){spawnBoss(spec.boss);Object.assign(activeBoss,{x:p.x,y:p.y-180,trainingDummy:true,trainingBoss:true,trainingLive:true})}
 const kinds=mainPerfTest.id==='overtime'?['spitter','spitter','riot','riot','howler','lobber',...Array(16).fill('hunter')]:mainPerfTest.id==='crowded'?['spitter','riot']:[];const counts={};for(const kind of kinds){counts[kind]=(counts[kind]||0)+1;if(enemies.filter(e=>e.perfKind===kind).length<counts[kind])enemies.push(makeMainPerfEnemy(kind,mainPerfTest.next++%1024))}
 while(enemies.length<spec.count){const n=mainPerfTest.next++%1024,kind=mainPerfTest.id==='early'?(n%4?'shambler':'runner'):n%9===0?'brute':n%4===0?'runner':'shambler';enemies.push(makeMainPerfEnemy(kind,n))}while(enemies.length>spec.count)enemies.pop();
 while(gems.length<spec.gems){const n=gems.length,a=n*2.399963,r=140+n%17*17;gems.push({x:p.x+Math.cos(a)*r,y:p.y+Math.sin(a)*r,r:7,value:1})}
}
function mainPerfControls(){return `<details class="medal-goals" open><summary>MAIN GAME PERFORMANCE TEST · UNSCORED</summary><p>HP safe · controlled loadout and replenished crowd, not a balance test. Settings here are temporary.</p><label for="mainPerfScene">TEST SCENE</label><select id="mainPerfScene">${Object.entries(MAIN_PERF_TESTS).map(([id,s])=>`<option value="${id}">${s.name} · ${s.count} targets · ${s.gems} XP gems</option>`).join('')}</select><button class="btn secondary" id="mainPerfRestart">RESTART SCENE</button><button class="btn secondary" id="mainPerfReset">RESET MEASUREMENTS</button><button class="btn secondary" id="mainPerfReport">CAPTURE PHONE REPORT</button><p class="muted">Five active seconds warm up before timing. Wait for art, then reset measurements and play 30 seconds. Compare HUD, actors and scenery below; use Settings for Reduced Effects. Presentation changes clear samples. Restart restores the fixed layout/loadout and stays paused. End Run holds test stats; normal settings return on exit.</p></details>`}
function bindMainPerfControls(){
 const valid=el=>el.isConnected&&mainPerfTest&&mode==='paused'&&!document.hidden,pick=document.getElementById('mainPerfScene');pick.value=mainPerfTest.id;pick.addEventListener('change',()=>{if(valid(pick))startMainPerfTest(pick.value)});
 for(const [id,fn]of [['mainPerfRestart',()=>startMainPerfTest(mainPerfTest.id)],['mainPerfReset',()=>{diagnostics=freshPerformance(true);mode='play';pause()}],['mainPerfReport',()=>showBenchmark('paused')]]){const el=document.getElementById(id);bindPress(el,()=>{if(valid(el))fn()})}
}
function mainPerfReportLines(s){return s?[`MAIN GAME PERFORMANCE TEST: ${s.name} · UNSCORED · HP SAFE`,`Controlled initial scene clock: ${fmt(s.clock)} · active test age: ${fmt(s.duration)}`,`Target population: ${s.targetPopulation} · replenished XP: ${s.targetGems} · fixed synthetic loadout`,`Test presentation: ${s.actors} actors · ${s.scenery} scenery · ${s.hud} HUD · Reduced ${s.reduced?'ON':'OFF'}`,`Warm-up: first ${s.warmup} active seconds excluded; art readiness and manual resets affect samples.`,`Measured intervals: ${s.row.frames} · sampled seconds: ${s.row.seconds.toFixed(2)} · average FPS: ${s.row.averageFps===null?'Unavailable':s.row.averageFps.toFixed(2)} · p95 ms: ${s.row.p95Ms===null?'Unavailable':s.row.p95Ms.toFixed(2)}`,'Controlled pressure fixture; native AI/weapons/rendering, not proof of natural run difficulty.']:[]}

function startBossTesting(kind,options=null){
 if(!['previews','end'].includes(mode)||document.hidden||!DEVELOPER_TARGETS.includes(kind))return;
 const choice=options&&typeof options==='object'?options:{};mode='training-menu';startTraining('pierce',false,kind);
 bossLab=true;bossLabFire=choice.attacks===true;bossLabField=choice.field!==false;bossLabWeapon=choice.weapon==='gun'||Object.prototype.hasOwnProperty.call(TRAINING_PATHS,choice.weapon)?choice.weapon:'gun';
 resetBossTesting(kind,bossLabWeapon,choice.evolved===true);toast((developerSpecialist(kind)?developerTargetName(kind)+' DRILL':'BOSS TESTING')+' · HP SAFE · UNSCORED · PAUSE FOR CONTROLS',4500);
}
function clearBossTestAttacks(){bullets=[];lightning=[];bottles=[];fires=[];burnHits=new Map();bladeHits=new Map();chainClock=molotovClock=.2;p.fireClock=0}
function positionBossTest(){if(!bossLab||!training)return;const target=activeBoss||enemies.find(e=>(e.riot||e.spitter||e.howler||e.lobber||e.rush)&&e.trainingSpecialist&&e.hp>0);if(!target)return;clearBossTestAttacks();target.x=p.x;target.y=p.y-Math.max(70,Math.min(140,H/2-65,W/2-60))}
function resetBossTesting(kind=trainingScenario,weapon=bossLabWeapon,evolved=trainingEvolved){
 if(!bossLab||!training||!['play','paused'].includes(mode)||document.hidden||!DEVELOPER_TARGETS.includes(kind)||!(weapon==='gun'||Object.prototype.hasOwnProperty.call(TRAINING_PATHS,weapon)))return;
 const held=mode==='paused';mode='play';clearInput();elapsed=0;p.x=p.y=0;p.hp=p.max;p.inv=0;lastMove.x=0;lastMove.y=1;bossLabWeapon=weapon;trainingScenario=kind;diagnostics=freshPerformance(diagnostics.enabled);benchmarkCapture=null;
 configureTrainingWeapon(weapon==='gun'?'pierce':weapon,weapon!=='gun'&&evolved);if(weapon==='gun')p.pierce=0;positionBossTest();releaseFieldArtwork();ensureFieldArtwork();updateHUD();last=performance.now();if(held)pause();
}
function toggleBossTestAttacks(){if(!bossLab||!training||mode!=='paused'||document.hidden)return;bossLabFire=!bossLabFire;clearBossTestAttacks();updateHUD();mode='play';pause()}
function bossTestingControls(){
 return `<details class="medal-goals" open><summary>DEVELOPER MODE · ${developerSpecialist()?developerTargetName()+' ART DRILL':'BOSS TESTING'}</summary><p>UNSCORED · PLAYER HP SAFE · ${developerTargetName()}. ${developerSpecialist()?'The target respawns with 300 training HP.':'Bosses respawn at base stats.'}${trainingScenario==='howler'?' Three infected helpers demonstrate its rally.':''} Normal records, medals and setup are untouched.</p><div class="contract-picker"><label for="bossTestKind">JUMP TO TARGET</label><select id="bossTestKind">${DEVELOPER_TARGETS.map(id=>`<option value="${id}">${developerTargetName(id)}</option>`).join('')}</select></div><button class="btn secondary" id="bossTestRestart">RESTART THIS ${developerSpecialist()?'TARGET':'BOSS'}</button><button class="btn secondary" id="bossTestNext">NEXT ${developerSpecialist()?'TARGET':'BOSS'} →</button><button class="btn secondary" id="bossTestAttacks">PLAYER ATTACKS: ${bossLabFire?'ON':'OFF'}</button><div class="contract-picker"><label for="bossTestWeapon">TEST LOADOUT</label><select id="bossTestWeapon"><option value="gun">Starting gun only</option>${Object.entries(TRAINING_PATHS).map(([id,name])=>`<option value="${id}">${name} III + gun</option>`).join('')}</select></div><button class="btn secondary" id="bossTestEvolved" ${bossLabWeapon==='gun'?'disabled':''}>EVOLUTION: ${trainingEvolved?'ON':'OFF'}</button><button class="btn secondary" id="bossTestArt">SHOW ${fieldStyle()==='field'?'CLASSIC':'FIELD'} ACTORS</button><p id="fieldArtStatus" class="muted" role="status">${fieldArtStatus()}</p><button class="btn secondary" id="bossTestReport">CAPTURE PHONE REPORT</button><p class="muted">Target, loadout and Restart reset this test to full HP and 00:00; you stay paused. Attacks OFF lets you inspect animation without killing the target. Toggle ON to fight with native weapons. End Run opens held practice stats. Field/Classic is temporary here.</p></details>`;
}
function bindBossTestingControls(){
 const valid=el=>el.isConnected&&bossLab&&training&&mode==='paused'&&!document.hidden;
 const bind=(id,action)=>{const el=document.getElementById(id);bindPress(el,()=>{if(valid(el))action()})};
 const boss=document.getElementById('bossTestKind');boss.value=trainingScenario;boss.addEventListener('change',()=>{if(valid(boss))resetBossTesting(boss.value)});
 const weapon=document.getElementById('bossTestWeapon');weapon.value=bossLabWeapon;weapon.addEventListener('change',()=>{if(valid(weapon))resetBossTesting(trainingScenario,weapon.value,trainingEvolved)});
 bind('bossTestRestart',()=>resetBossTesting());bind('bossTestNext',()=>{const ids=DEVELOPER_TARGETS.slice(0,3);resetBossTesting(ids[(ids.indexOf(trainingScenario)+1)%ids.length])});bind('bossTestAttacks',toggleBossTestAttacks);bind('bossTestEvolved',()=>{if(bossLabWeapon!=='gun')resetBossTesting(trainingScenario,bossLabWeapon,!trainingEvolved)});bind('bossTestArt',()=>selectFieldActors(fieldStyle()==='field'?'classic':'field'));bind('bossTestReport',()=>showBenchmark('paused'));
}

function showTraining(){
 if(!['menu','end','roster'].includes(mode))return;mode='training-menu';show(`<div class="eyebrow">UNSCORED · NO RECORD CHANGES</div><h1 style="font-size:44px">TRAINING RANGE</h1><p>Choose a rank-three weapon path. Stationary targets respawn; the Riot target has its real front shield. Pause to change weapon, toggle its evolution, or reset targets. Your starting gun still fires.</p><h2>EXIT PRACTICE</h2><p>Reach green immediately. Try Extract or Stay with safe HP and no record changes. After Stay, the next practice exit opens in 10 active seconds; normal overtime takes at least 60 seconds.</p><button class="btn secondary" id="drill-extraction">EXIT &amp; OVERTIME PRACTICE</button><div class="cards four">${Object.entries(TRAINING_PATHS).map(([id,name])=>`<button class="choice" id="train-${id}"><b>${name}</b><span>Rank 3 · practice the actual weapon</span></button>`).join('')}</div><h2>LIVE BOSS DRILLS</h2><p>Practice the real warnings and attacks without taking damage. Bosses respawn; no scores or rewards.</p><div class="cards">${['breaker','warden','harvester'].map(id=>`<button class="choice" id="drill-${id}"><b>${TRAINING_SCENARIOS[id]}</b><span>Rank-three Piercing Rounds · change weapon in Pause</span></button>`).join('')}</div><h2>SPECIALIST DRILLS</h2><p>Practice real aim lines, shields, rallies and ground warnings without losing HP.</p><div class="cards four">${['spitter','riot','howler','lobber'].map(id=>`<button class="choice" id="drill-${id}"><b>${TRAINING_SCENARIOS[id]}</b><span>Live enemy · Pause changes weapon and drill</span></button>`).join('')}</div><button class="btn secondary" id="trainingBack">BACK TO PLAY</button>`);
 for(const id of ['breaker','warden','harvester','spitter','riot','howler','lobber','extraction'])bindUpgradePress(document.getElementById('drill-'+id),()=>startTraining('pierce',false,id),()=>mode==='training-menu');
 for(const id of Object.keys(TRAINING_PATHS))bindUpgradePress(document.getElementById('train-'+id),()=>startTraining(id),()=>mode==='training-menu');bindPress(document.getElementById('trainingBack'),()=>{mode='roster';showRoster()});
}
function startTraining(weapon,evolved=false,scenario='targets',preview=false){
 if(!['menu','end','training-menu','paused'].includes(mode)||!Object.prototype.hasOwnProperty.call(TRAINING_PATHS,weapon)||!Object.prototype.hasOwnProperty.call(TRAINING_SCENARIOS,scenario))return;
 const previous={selectedSurvivor,selectedRoute,selectedRule,selectedContract};selectedSurvivor='survivor';selectedRoute='downtown';selectedRule='standard';selectedContract='none';start(preview,false);({selectedSurvivor,selectedRoute,selectedRule,selectedContract}=previous);training=true;trainingScenario=scenario;
 spawn=nextBossAt=nextHowlerAt=nextLobberAt=nextConvoyAt=nextDropAt=nextSpitterAt=nextRiotAt=nextRescueAt=nextSalvageAt=nextSupplyAt=exitAt=barrelClock=barricadeClock=shockClock=Infinity;scheduleRush(Infinity);obstacles=[];barrels=[];barricades=[];shockDrums=[];patrol=[];
 configureTrainingWeapon(weapon,evolved);artSession=preview===true;artLook=true;if(artSession)ensureSampleArtwork();updateHUD();toast('TRAINING · UNSCORED · PAUSE TO CHANGE WEAPON',3000);
}
function configureTrainingWeapon(weapon,evolved){
 if(!training||!Object.prototype.hasOwnProperty.call(TRAINING_PATHS,weapon))return;if(trainingScenario==='extraction'||exitBeacon||overtime){exitBeacon=null;exitAt=trainingScenario==='extraction'?elapsed:Infinity;overtime=0;rescue=null;nextRescueAt=Infinity;scheduleRush(Infinity)}if(streetSession&&streetTrial==='effects'){streetTrial='crowd';streetTrialChoice='crowd'}trainingWeapon=weapon;trainingEvolved=!!evolved;if(weapon!=='arc')p.arcRelay=false;if(weapon!=='blades')p.bladeReach=false;practiceLedger=emptyWeaponLedger();practiceStartedAt=elapsed;practiceHits=practiceTargets=practiceThreats=0;practiceThreatReadyAt=elapsed;practiceLastThreat='none';
 for(const e of EVOLUTIONS){p[e.weapon]=e.weapon===weapon?3:0;p[e.field]=e.weapon===weapon&&trainingEvolved}chainClock=molotovClock=.2;bullets=[];lightning=[];bottles=[];fires=[];gems=[];burnHits=new Map();bladeHits=new Map();decoy=null;decoyCharges=1;p.dash=p.dashCd=0;enemies=[];activeBoss=null;hostileShots=[];lobberBombs=[];trainingClock=0;updateTrainingTargets(0);if(streetSession)primeStreetAnimations();else streetCombat=freshStreetCombat();if(mode==='paused'){mode='play';pause()}
}
function placeTrainingExit(){
 if(!training||trainingScenario!=='extraction'||!['play','paused'].includes(mode)||exitBeacon)return;
 exitBeacon={x:p.x+Math.min(W*.28,150),y:p.y-Math.min(H*.16,100),r:48};exitAt=Infinity;
 enemies=[[-55,-20],[55,-20],[-55,45],[55,45]].map(([x,y],slot)=>({...ENEMY_ART.shambler,x:exitBeacon.x+x,y:exitBeacon.y+y,r:15,hp:300,max:300,speed:0,dmg:0,hit:0,trainingDummy:true,slot}));
}
function updateTrainingTargets(dt){
 if(!training||!['play','paused'].includes(mode))return;if(mainPerfTest){updateMainPerfTargets();return}if(trainingScenario==='extraction'){if(!exitBeacon&&elapsed>=exitAt)placeTrainingExit();return}if(bossLab&&activeBoss?.hp<=0){activeBoss=null;hostileShots=[]}trainingClock-=dt;if(trainingClock>0)return;trainingClock=1.5;
 if(streetSession){updateStreetTargets();return}
 if(['breaker','warden','harvester'].includes(trainingScenario)){if(!activeBoss||activeBoss.hp<=0){activeBoss=null;enemies=[];hostileShots=[];spawnBoss(trainingScenario);activeBoss.trainingDummy=true;activeBoss.trainingBoss=true;if(bossLab)positionBossTest()}return}
 if(trainingScenario!=='targets'){
  let primary=enemies.find(e=>e.trainingSpecialist&&e.hp>0);
  if(!primary){enemies=[];hostileShots=[];lobberBombs=[];const paused=mode==='paused';if(paused)mode='play';
   if(trainingScenario==='spitter'){nextSpitterAt=elapsed;updateSpitterSchedule();nextSpitterAt=Infinity}
   if(trainingScenario==='riot'){nextRiotAt=elapsed;updateRiotSchedule();nextRiotAt=Infinity}
   if(trainingScenario==='howler'){nextHowlerAt=elapsed;updateHowlerSchedule();nextHowlerAt=Infinity}
   if(trainingScenario==='lobber'){nextLobberAt=elapsed;updateLobberSchedule();nextLobberAt=Infinity}
   if(trainingScenario==='hunter'){const prior=rushSpawned;try{rushSpawned=0;spawnRushHunter()}finally{rushSpawned=prior}}
   if(paused)mode='paused';primary=enemies[0];if(primary)Object.assign(primary,{trainingDummy:true,trainingLive:true,trainingSpecialist:true,hp:300,max:300});if(primary&&bossLab&&developerSpecialist())positionBossTest();
  }
  if(trainingScenario==='howler'&&primary)for(let slot=0;slot<3;slot++)if(!enemies.some(e=>e.trainingHelper===slot&&e.hp>0))enemies.push({...ENEMY_ART.shambler,x:primary.x+(slot-1)*35,y:primary.y+40,hp:300,max:300,speed:70,dmg:12,hit:0,trainingDummy:true,trainingLive:true,trainingHelper:slot});
  return;
 }
 const specs=[{id:'shambler',x:-130,y:30},{id:'runner',x:130,y:30},{id:'brute',x:0,y:150},{id:'riot',x:0,y:-150}];
 for(let index=0;index<specs.length;index++)if(!enemies.some(e=>e.trainingDummy&&e.slot===index&&e.hp>0)){const t=specs[index];enemies.push({...ENEMY_ART[t.id],x:p.x+t.x,y:p.y+t.y,hp:300,max:300,speed:0,dmg:0,hit:0,trainingDummy:true,slot:index,phase:'approach',phaseTime:0,cooldown:Infinity,facing:Math.PI/2})}
}
function practiceSnapshot(){
 const time=Math.max(0,elapsed-practiceStartedAt),damage=Object.values(practiceLedger).reduce((sum,row)=>sum+row.damage,0);
 return Object.freeze({...(mainPerfTest?{label:'Performance test · '+MAIN_PERF_TESTS[mainPerfTest.id].name}:trainingScenario==='extraction'?{label:'Exit & overtime practice · 10-second practice return'}:{}),threats:practiceThreats,lastThreat:practiceLastThreat,scenario:trainingScenario,time,damage,hits:practiceHits,targets:practiceTargets,average:time>0?damage/time:0,weapons:Object.freeze(Object.fromEntries(Object.entries(practiceLedger).map(([id,row])=>[id,Object.freeze({...row})])))});
}
function practicePanel(stats=training?practiceSnapshot():null){
 if(!stats)return '';return `<details class="medal-goals" open><summary>PRACTICE STATISTICS · UNSCORED</summary><p>${hudEscape(stats.label||TRAINING_SCENARIOS[stats.scenario])} · ${fmt(stats.time)} active time</p><p>${Number(stats.damage.toFixed(1))} target HP removed · ${stats.hits} damage hits · ${stats.targets} targets broken · ${Number(stats.average.toFixed(1))} average HP/s</p><p>${stats.threats} would-be hits · Last: ${threatName(stats.lastThreat)}</p><table class="weapon-ranks"><thead><tr><th>Practice source</th><th>HP removed</th><th>Targets broken</th></tr></thead><tbody>${Object.entries(WEAPON_LABELS).map(([id,name])=>`<tr><th>${name}</th><td>${Number(stats.weapons[id].damage.toFixed(1))}</td><td>${stats.weapons[id].kills}</td></tr>`).join('')}</tbody></table><p class="muted">Totals since your last weapon/drill change or target reset. Average includes moving and waiting. Would-be hits use normal collisions, Dash protection and a 0.55s feedback gap; HP stays safe. Targets cap overkill damage; these are practice figures, not run scores.</p></details>`;
}
function trainingControls(){if(mainPerfTest)return '';if(bossLab&&training)return bossTestingControls();return training?`<details class="medal-goals" open><summary>TRAINING CONTROLS · UNSCORED</summary><div class="contract-picker"><label for="trainingScenarioPick">PRACTICE DRILL</label><select id="trainingScenarioPick">${Object.entries(TRAINING_SCENARIOS).map(([id,name])=>`<option value="${id}">${name}</option>`).join('')}</select></div><div class="contract-picker"><label for="trainingWeaponPick">WEAPON PATH</label><select id="trainingWeaponPick">${Object.entries(TRAINING_PATHS).map(([id,name])=>`<option value="${id}">${name}</option>`).join('')}</select></div><button class="btn secondary" id="trainingEvolution">EVOLUTION: ${trainingEvolved?'ON':'OFF'}</button><p>${['arc','blades'].includes(trainingWeapon)?`<button class="btn secondary" id="trainingMod">${trainingWeapon==='arc'?'ARC RELAY: '+(p.arcRelay?'ON':'OFF'):'BLADE REACH: '+(p.bladeReach?'ON':'OFF')}</button>`:''}</p><p><button class="btn secondary" id="trainingReset">${trainingScenario==='extraction'?'RESET EXIT HERE':'RESET TARGETS HERE'}</button></p><p class="muted">${trainingScenario==='extraction'?'Exit practice: reach green, choose Extract for held stats, or Stay for the landing pulse and a new practice exit after 10 active seconds. Reset Exit restarts this drill here. Real exits begin at 03:00 after a boss; real overtime waits at least 60 seconds.':'Changes reset test shots/fire and targets around your current position.'} ${streetSession&&streetTrial==='effects'?'Single-weapon changes or resets switch Evolved Effects to Crowd; Restart Selected Trial restores all four evolved paths. ':''}Resume to continue. Training never saves scores or Bestiary kills.</p></details>`:''}
function bindTrainingControls(){
 if(mainPerfTest){bindMainPerfControls();return}
 if(bossLab){bindBossTestingControls();return}
 if(document.getElementById('trainingMod'))bindPress(document.getElementById('trainingMod'),()=>{if(mode==='paused'&&training){if(trainingWeapon==='arc')p.arcRelay=!p.arcRelay;else if(trainingWeapon==='blades')p.bladeReach=!p.bladeReach;configureTrainingWeapon(trainingWeapon,trainingEvolved)}});
 const scenario=document.getElementById('trainingScenarioPick');scenario.value=trainingScenario;scenario.addEventListener('change',()=>{if(mode==='paused'&&training&&scenario.isConnected&&Object.prototype.hasOwnProperty.call(TRAINING_SCENARIOS,scenario.value)){if(streetSession){streetSession=false;streetCombat=freshStreetCombat();streetMotion=new WeakMap();obstacles=[];barrels=[]}trainingScenario=scenario.value;configureTrainingWeapon(trainingWeapon,trainingEvolved)}});

 const picker=document.getElementById('trainingWeaponPick');picker.value=trainingWeapon;picker.addEventListener('change',()=>{if(mode==='paused'&&training&&picker.isConnected&&Object.prototype.hasOwnProperty.call(TRAINING_PATHS,picker.value)){configureTrainingWeapon(picker.value,trainingEvolved)}});
 bindPress(document.getElementById('trainingEvolution'),()=>{if(mode==='paused'&&training){configureTrainingWeapon(trainingWeapon,!trainingEvolved);document.getElementById('trainingEvolution').textContent='EVOLUTION: '+(trainingEvolved?'ON':'OFF')}});bindPress(document.getElementById('trainingReset'),()=>{if(mode==='paused'&&training)configureTrainingWeapon(trainingWeapon,trainingEvolved)});
}
function showQuickGuide(){
 if(!['menu','roster','paused','end'].includes(mode))return;guideReturn=mode;mode='guide';
 show(`<div class="eyebrow">YOUR FIRST THREE MINUTES</div><h1 style="font-size:44px">MAKE IT OUT</h1>${training&&['paused','end'].includes(guideReturn)?(trainingScenario==='extraction'?'<p class="muted">This guide describes normal scored runs. Exit practice starts with an immediate beacon and repeats after 10 active seconds; it does not save a victory.</p>':'<p class="muted">This is the normal-run guide. Your unscored Training session has no timed street encounters or extraction.</p>'):''}<ol class="first-run-steps"><li><b>Move while your gun fires.</b><p>${preferences.mirrored?'The joystick is on the right; Dash is on the left.':'The joystick is on the left; Dash is on the right.'} On keyboard use WASD or arrows and Space to Dash. Your gun aims and fires automatically. A second finger can press Pause while you keep moving.</p></li><li><b>Collect green XP. Choose a weapon.</b><p>Pick up green gems to level up. Choices pause the game and wait for a fresh tap. Start with piercing rounds, chain lightning, orbiting blades or Molotov. Strengthen your path to rank three, then choose its evolution on a later offer.</p></li><li><b>Read the warnings. Reach green.</b><p>Blackout Hunters arrive at 00:45. The first Breaker arrives at 01:30 after a warning; sidestep its locked orange charge lane. At or after 03:00, the green exit opens once you've defeated a boss and no boss or Blackout is active. You do not need to clear the ordinary horde. Enter it and choose Extract to finish on your stats, or Stay for tougher overtime.</p></li></ol><p class="muted">Orange fuel: Dash through it for player-safe blasts. Blue medical caches: restore up to ${SUPPLY_TUNING.heal} HP when hurt. Other objectives and contracts are optional; you can learn them later.</p><button class="btn primary-wide" id="guideBack">${guideReturn==='paused'?'BACK TO PAUSE':guideReturn==='end'?'BACK TO RESULTS':guideReturn==='roster'?'BACK TO YOUR RUN':'MAIN MENU'}</button>`);
 bindPress(document.getElementById('guideBack'),closeQuickGuide);
}
function closeQuickGuide(){
 if(mode!=='guide')return;if(guideReturn==='paused'){mode='play';pause()}else if(guideReturn==='end'){mode='end';showRunResult()}else if(guideReturn==='roster'){mode='roster';showRoster()}else menu();
}
function showManual(){
 if(!['menu','paused','end','journal'].includes(mode))return;manualReturn=mode;mode='manual';
 const topics=[
 ['Survive your first three minutes',`Move continuously and collect green XP gems. Your gun aims and fires automatically. Clear the first Breaker after 01:30, then survive to 03:00 for the green exit, when the active encounter is clear. Enter green to Extract for victory or Stay for overtime. You never have to complete an optional contract to leave.`],
 ['Touch and keyboard controls',`Drag the joystick to move (left by default; right with Left-handed controls in Settings). Use another finger for DASH, PAUSE, or REGROUP while moving. On keyboard, use WASD or arrow keys; Space dashes; P or Escape pauses; R regroups a recruited survivor; Q or DECOY deploys a three-second lure (one charge per run). Dash follows your current movement or last direction. Backgrounding pauses; Resume is deliberate.`],
 ['Build your weapons',`The first upgrade offers four weapon paths. Take one, reach rank 3/3, then choose its evolution on a later offer. There is one reroll (two for Quartermaster) and one non-weapon banish per run after the first offer. A favored weapon path highlights matching rank/evolution cards without changing offers. Choices pause the game and require a fresh tap. Pause has INSPECT CURRENT BUILD with current values. Arc Relay extends later lightning jumps by 20%; Blade Reach widens the orbit by 12. Both are optional support cards after owning the weapon. A new run resets every upgrade, including Second Wind, armor, capacitors and weapon supports.`],
 ['Use the city',`Orange fuel barrels: Dash or burn them for player-safe chain blasts. Teal lightning drums: Dash through one to stun at most ${SHOCK_TUNING.targets} nearby non-boss enemies for ${SHOCK_TUNING.duration} seconds; no damage or XP. Stunned bodies can still hurt on contact. Decoys divert at most twelve nearby ordinary enemies; bosses, Hunters, and specialists ignore them. Decoy Pouch grants one extra charge once; no overtime refill. Striped wood: blocks movement and shots; Dash breaks it. Blue medical caches: collect when hurt for up to ${SUPPLY_TUNING.heal} HP. Your fire is safe for you and rescued survivors.`],
 ['Read optional signals',`Gold salvage: remain inside for ${SALVAGE_TUNING.hold} seconds while moving; the first entry creates space and enemies inside do not stop progress. Cyan convoy: stop the truck for a bonus upgrade. Purple drop: wait ${DROP_TUNING.signal} seconds for landing, collect to sweep already-earned XP and refresh Dash. White survivor: approach, escort to green, and use REGROUP if needed. After a boss, one field locker may appear in a quiet window. Approach and open it from Pause for one reroll or decoy under capacity; no HP or stat boost. A claim completes Field Resupply if selected; Resume to take its queued contract choice. Pause lets you choose a currently active objective for the pointer.`],
 ['Routes, presets and patrol',`Market District adds striped awning stalls, hanging lights and three starting wood barriers. Downtown keeps the original streets. Freight Yard offers container lanes, three starting wood barriers and one extra fuel barrel; Riverside has open promenade scenery and two relocated wood barriers; Memorial Park has tree islands, walking loops and a decorative fountain. Gray scenery is decorative; striped wood is solid. Night Circuit is an optional contract to visit three numbered checkpoints for one final bonus upgrade. Pause has a tactical map. Three deployment presets save only roster choices, never powers.`],
 ['Training and tactical tradeoffs',`Training Range is unscored: actual rank-three weapons, stationary targets with a real Riot shield, and live Breaker/Warden/Harvester and Spitter/Riot/Howler/Lobber drills without player damage. Pause changes paths, evolutions and drills. Practice statistics count actual target HP removed and would-be hits since the last reset, separately from run scores. Dash protection and a 0.55s feedback gap apply. Arc Relay and Blade Reach can be toggled in the matching training path. Ending never changes score records or Bestiary totals. Courier starts with 90 HP/220 speed and 2.25s Dash recharge, reaching 2.00/1.75 with capacitors. Tactician starts with two decoys at 90 HP and 200 speed. Steady Aim is an optional 15% gun bonus after 0.6 seconds standing still; moving or dashing removes it. Evasive Reload primes one gun volley for +20% damage within two active seconds of a successful Dash; it adds no bullets. Field Evolution rewards choosing one actual weapon evolution. All upgrades reset next run.`],
 ['Choose your rules',`${RUN_RULES.map(r=>r.name+': '+r.hint).join(' ')} Rules change only when deploying from the roster. ONE MORE RUN repeats your last roster choice this visit. All loadouts are available; medals give no permanent bonuses.`],
 ['Know the threats',`Pink Spitters lock an aim line; move across it. Gold Riot shields block front gunfire: flank, wait for recovery, or use other weapon paths. Howlers warn before a short nearby rally: interrupt them. Blackout warns at 00:40; Breaker warns at 01:20. Bosses cycle Breaker, Warden, then Harvester. Harvester locks a 1.35-second circle before one pulse; leave it and attack during recovery. Pause offers an encounter briefing with current status and counter tips. Optional Gun target and range display follows actual targeting; cover and shields still block shots. Optional SHOT edge markers warn of approaching offscreen projectiles on their current path; movement changes that path relative to you. Overtime Lobbers from 04:15 mark one fixed ground blast with a full 1.4-second warning; leave the circle. Major encounters cancel their attacks. Bestiary and Weapon Guide offer more detail between runs.`],
 ['Finish, compare, and keep your records',`Extracting, defeat, and END RUN all stop on your stats screen. Record Chase compares prior saved runs with the same survivor, rules and route; it never counts the current run as its own previous best. Run Report downloads plain text without sending it. Weapon Contributions counts actual enemy HP removed and last-hit kills. Field Notes marks first recorded species defeats. Run Timeline keeps the latest forty key events, and Pause can track one medal on the HUD. Run Pace shows eliminations and HP lost by active minute, with separate scales and the latest 60 minutes. Run Log keeps eight detailed runs plus cumulative totals; READ RUN DETAILS opens a frozen saved-run review without equipping powers. Save Backup exports a local file; review and confirm before replacing records. Browser/file-opening contexts may have separate storage. Save backups before changing devices or browser context. No active run or upgrades are restored.`]
 ];
 show(`<div class="eyebrow">LAST STAND · FIELD MANUAL</div><h1 style="font-size:44px">KNOW THE NIGHT</h1><p>Time stays paused while you read. Open any topic below.</p><button class="btn secondary" id="manualBack">${manualReturn==='paused'?'BACK TO PAUSE':manualReturn==='end'?'BACK TO RESULTS':manualReturn==='journal'?'BACK TO JOURNAL':'MAIN MENU'}</button>${topics.map(([title,body],i)=>`<details class="medal-goals" ${i===0?'open':''}><summary>${title}</summary><p>${body}</p></details>`).join('')}<button class="btn secondary" id="manualBackBottom">${manualReturn==='paused'?'BACK TO PAUSE':manualReturn==='end'?'BACK TO RESULTS':manualReturn==='journal'?'BACK TO JOURNAL':'MAIN MENU'}</button>`);
 for(const id of ['manualBack','manualBackBottom'])bindPress(document.getElementById(id),closeManual);
}
function closeManual(){if(mode!=='manual')return;if(manualReturn==='end'&&runResult)showRunResult();else if(manualReturn==='paused'){mode='play';pause()}else if(manualReturn==='journal')returnToJournal();else menu()}
// One same-URL history guard protects in-game screens without storing run state.
// Home releases it, so browser Back can still leave from the title screen.
const phoneBack={ready:false,enabled:true,draining:false,handling:false};
function syncPhoneBack(){
 if(!phoneBack.enabled||phoneBack.handling||phoneBack.draining)return;
 try{
  const h=window.history;
  if(!h?.pushState||!h?.replaceState||!h?.back){phoneBack.enabled=false;return}
  if(!phoneBack.ready){
   if(h.state?.lastStandBack!=='guard')h.replaceState({...h.state,lastStandBack:'home'},'');
   phoneBack.ready=true;
  }
  if(mode!=='menu'){
   if(h.state?.lastStandBack!=='guard')h.pushState({...h.state,lastStandBack:'guard'},'');
  }else if(h.state?.lastStandBack==='guard'){
   phoneBack.draining=true;h.back();
  }
 }catch{phoneBack.enabled=false;phoneBack.draining=false}
}
function gameBack(){
 clearInput();
 if(mode==='play'){pause('Paused with Back. Tap Resume when you are ready.');return}
 if(mode==='paused'){toast('PAUSED • TAP RESUME TO CONTINUE',2200);return}
 if(mode==='upgrade'||mode==='extraction'){toast(mode==='upgrade'?'CHOOSE AN UPGRADE TO CONTINUE':'CHOOSE EXTRACT OR STAY TO CONTINUE',2200);return}
 // Cancel a reviewed restore first; Back never confirms a replacement.
 if(mode==='backup'&&pendingRestore){document.getElementById('restoreEdit')?.click();return}
 const id={'end-confirm':'cancelEndRun',roster:'rosterBack',journal:'journalBack',review:'reviewBack',settings:'settingsBack',benchmark:'benchmarkBack',backup:'backupBack',bestiary:'bestiaryBack',weapons:'weaponsBack',guide:'guideBack',manual:'manualBack',map:'mapBack',locker:'lockerBack','training-menu':'trainingBack',previews:'previewsBack','art-menu':'artBack','street-menu':'streetBack',report:'reportBack',end:'resultMenu'}[mode];
 if(id)document.getElementById(id)?.click();
}
addEventListener('popstate',event=>{
 if(!phoneBack.enabled)return;
 if(phoneBack.draining){phoneBack.draining=false;syncPhoneBack();return}
 if(event.state?.lastStandBack==='home'){
  phoneBack.handling=true;
  try{gameBack()}finally{phoneBack.handling=false;syncPhoneBack()}
 }else if(event.state?.lastStandBack==='guard')syncPhoneBack();
});
addEventListener('pageshow',syncPhoneBack);
function show(html){const focusId=modal.contains(document.activeElement)?document.activeElement.id:'';if(mode!=='bestiary')releaseBestiaryArt();musicTrack.preview=false;syncBackgroundMusic();clearInput();document.getElementById('decoy').style.display='none';document.getElementById('touch').style.visibility='hidden';panel.classList.remove('hidden');modal.innerHTML=html;panel.scrollTop=0;syncTitleScene();syncPhoneBack();syncStreetHud();modal.setAttribute('tabindex','-1');try{(document.getElementById(focusId)||modal).focus({preventScroll:true})}catch{}}function hide(){releaseBestiaryArt();releaseTitleArtwork();document.getElementById('titleScene').hidden=true;musicTrack.preview=false;syncBackgroundMusic();panel.classList.add('hidden');updateDecoyHUD();document.getElementById('touch').style.visibility='visible';syncPhoneBack();syncStreetHud();c.setAttribute('tabindex','0');try{c.focus({preventScroll:true})}catch{}}function toast(s,duration=1700){let t=document.getElementById('toast');t.textContent=s;t.style.opacity=1;clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.style.opacity=0,duration)}function releaseTitleArtwork(){if(titleArtwork?.image){titleArtwork.image.onload=null;titleArtwork.image.onerror=null}titleArtwork=null;const art=document.getElementById('titleArt');art.style.backgroundImage='none';art.dataset.ready='false'}
function syncTitleMotion(){const active=mode==='menu'&&!document.hidden&&titleFocused;document.getElementById('titleScene').dataset.motion=preferences.reduced?'still':active?'on':'paused'}
function ensureTitleArtwork(){
 if(mode!=='menu'||titleArtwork)return;const row={status:'loading',image:null};titleArtwork=row;const status=document.getElementById('titleArtStatus');if(status)status.textContent='Loading title artwork…';
 try{const data=JSON.parse(document.getElementById('titleAsset').textContent);if(!/^data:image\/webp;base64,/.test(data.src))throw Error('Missing title art');const image=new Image();row.image=image;
  image.onload=()=>{if(titleArtwork!==row||mode!=='menu')return;if(!(image.naturalWidth>0&&image.naturalHeight>0)){image.onerror();return}row.status='ready';const art=document.getElementById('titleArt');art.style.backgroundImage=`url("${data.src}")`;art.dataset.ready='true';const label=document.getElementById('titleArtStatus');if(label)label.textContent=''};
  image.onerror=()=>{if(titleArtwork!==row||mode!=='menu')return;row.status='failed';const label=document.getElementById('titleArtStatus');if(label)label.textContent='Title artwork unavailable. Play is ready.'};image.src=data.src;
 }catch{row.status='failed';if(status)status.textContent='Title artwork unavailable. Play is ready.'}
}
function syncTitleScene(){const home=mode==='menu';panel.dataset.screen=home?'home':'modal';document.getElementById('titleScene').hidden=!home;syncTitleMotion();if(home)ensureTitleArtwork();else releaseTitleArtwork()}
function showPreviews(){
 if(!['menu','previews','art-menu','street-menu'].includes(mode))return;streetSession=false;artSession=false;releaseSampleArtwork();mode='previews';show(`<div class="eyebrow">DEVELOPMENT PREVIEWS</div><h1 style="font-size:40px">ON THE<br>WORKBENCH</h1><p>Optional, unscored testing. Normal runs, records and medals stay intact.</p><h2>MAIN GAME PERFORMANCE TEST</h2><p>Quick controlled scenes · HP safe · unscored. Uses the main renderer and temporary settings.</p><div class="home-actions">${Object.entries(MAIN_PERF_TESTS).map(([id,s])=>`<button class="btn secondary" id="mainPerf-${id}">${s.name.toUpperCase()} TEST</button>`).join('')}</div><h2>DEVELOPER MODE · BOSS TESTING</h2><p>Jump straight to any boss with normal Field artwork. HP is safe. Player attacks start OFF; Pause to enable attacks, change weapon, switch boss or restart.</p><div class="cards">${['breaker','warden','harvester'].map(id=>`<button class="choice" id="bossTest-${id}"><b>${id.toUpperCase()}</b><span>Start immediately · HP safe · unscored</span></button>`).join('')}</div><h2>SPECIALIST ART REVIEW</h2><button class="btn secondary" id="riotReview">RIOT GUARD ART DRILL</button><button class="btn secondary" id="spitterReview">SPITTER ART DRILL</button><button class="btn secondary" id="howlerReview">HOWLER ART DRILL</button><button class="btn secondary" id="lobberReview">LOBBER ART DRILL</button><p class="muted">Immediate specialist attack review · HP safe · unscored · attacks OFF. Normal attacks; 300 HP training target. Howler includes three infected helpers.</p><h2>BLACKOUT ART REVIEW</h2><button class="btn secondary" id="hunterReview">BLACKOUT HUNTER ART DRILL</button><p class="muted">Immediate running/contact review · HP safe · unscored · attacks OFF · 300 HP training target. No timed wave or rewards.</p><h2>ART & CAMERA STUDIES</h2><div class="home-actions"><button class="btn secondary" id="streetOpen">STREET PROTOTYPE</button><button class="btn secondary" id="artOpen">ART & AUDIO SAMPLE</button></div><button class="btn secondary" id="previewsBack">MAIN MENU</button>`);for(const id of Object.keys(MAIN_PERF_TESTS))bindUpgradePress(document.getElementById('mainPerf-'+id),()=>startMainPerfTest(id),()=>mode==='previews');for(const id of ['breaker','warden','harvester'])bindUpgradePress(document.getElementById('bossTest-'+id),()=>startBossTesting(id),()=>mode==='previews');bindPress(document.getElementById('riotReview'),()=>startBossTesting('riot'));bindUpgradePress(document.getElementById('spitterReview'),()=>startBossTesting('spitter'),()=>mode==='previews');bindUpgradePress(document.getElementById('howlerReview'),()=>startBossTesting('howler'),()=>mode==='previews');bindUpgradePress(document.getElementById('lobberReview'),()=>startBossTesting('lobber'),()=>mode==='previews');bindUpgradePress(document.getElementById('hunterReview'),()=>startBossTesting('hunter'),()=>mode==='previews');bindPress(document.getElementById('streetOpen'),showStreetPrototype);bindPress(document.getElementById('artOpen'),showArtSample);bindPress(document.getElementById('previewsBack'),menu);
}
function returnToJournal(){mode='journal';showJournal()}
function menu(){
 leaveMainPerfTest();bossLab=false;bossLabFire=false;bossLabField=true;bossLabWeapon='gun';releaseFieldArtwork();releaseFieldWorld();streetCombat=freshStreetCombat();streetMotion=new WeakMap();streetSession=false;artSession=false;releaseSampleArtwork();mode='menu';show(`<section class="title-screen" aria-label="Last Stand: After Dark main menu"><div class="title-copy"><div class="title-kicker">SURVIVE · ADAPT · EXTRACT</div><h1>LAST STAND<span>AFTER DARK</span></h1><p class="title-tagline">The night is yours to survive.</p><nav class="title-actions" aria-label="Main menu"><button class="title-play" id="start">PLAY <span aria-hidden="true">↗</span></button><button id="runLog">JOURNAL</button><button id="settingsOpen">SETTINGS</button></nav><p class="title-record">${record>0?'BEST SURVIVAL · '+fmt(record):'YOUR FIRST NIGHT AWAITS'}</p><p id="titleArtStatus" class="title-art-status" role="status" aria-live="polite"></p></div><footer class="title-footer"><button class="title-link" id="previewsOpen">DEVELOPMENT PREVIEWS</button><span>ALPHA 0.86</span></footer>${!journal.available||journal.readOnly?`<p class="muted">${journalNote()}</p>`:''}</section>`);
 bindPress(document.getElementById('start'),showRoster);bindPress(document.getElementById('runLog'),showJournal);bindPress(document.getElementById('settingsOpen'),showSettings);bindPress(document.getElementById('previewsOpen'),showPreviews);document.getElementById('boot').hidden=true;
}
addEventListener('blur',()=>{titleFocused=false;syncTitleMotion()});addEventListener('focus',()=>{titleFocused=true;syncTitleMotion()});document.addEventListener('visibilitychange',syncTitleMotion);

function start(presentationPreview=false,scoredRun=true){healthCue=null;leaveMainPerfTest();releaseFieldWorld();bossLab=false;bossLabFire=false;bossLabField=true;bossLabWeapon='gun';releaseFieldArtwork();streetCombat=freshStreetCombat();streetMotion=new WeakMap();streetSession=false;streetAngled=true;streetDressed=true;stopBackgroundMusic(true);if(!presentationPreview)releaseSampleArtwork();artSession=false;artLook=true;diagnostics=freshPerformance(diagnostics.enabled);benchmarkCapture=null;buildProgress=freshBuildProgress();paceBuckets=[];locker=null;lockerOffered=false;lockersUsed=0;training=false;trainingScenario='targets';practiceLedger=emptyWeaponLedger();practiceStartedAt=0;practiceHits=practiceTargets=practiceThreats=0;practiceThreatReadyAt=elapsed;practiceLastThreat='none';patrol=[];patrolVisited=0;runRoute=selectedRoute;runTimeline=[];timelineDropped=0;trackedMedal='off';weaponLedger=emptyWeaponLedger();decoy=null;decoyCharges=1;decoysUsed=decoyLured=0;nextLobberAt=LOBBER_TUNING.first;lobberIntroduced=false;lobberBombs=[];objectiveFocus='auto';shockDrums=[];shockClock=40;shocksUsed=shockStuns=0;runRule=selectedRule;damageTaken=hitsTaken=armorPrevented=0;lastThreat='none';nextHowlerAt=HOWLER_TUNING.first;howlerIntroduced=false;rerollsLeft=1;banishesLeft=1;banished=new Set();upgradeOffer=null;enemyTally=emptyEnemyTally();runRecordSaved=true;bestiaryReturn='menu';weaponGuideReturn='menu';bestiaryFilter='all';nextScrapAt=0;scrapRefreshes=0;scrapRecovered=0;runLogged=false;runResult=null;runComparison=null;convoy=null;nextConvoyAt=CONVOY_TUNING.first;convoysStopped=0;convoyRewardPending=false;supplyDrop=null;nextDropAt=DROP_TUNING.first;dropsCollected=dropXpRecovered=0;runContract=selectedContract;contractCompleted=false;hostileShots=[];nextSpitterAt=SPITTER_TUNING.first;spittersDefeated=0;spitterIntroduced=false;nextRiotAt=RIOT_TUNING.first;riotsDefeated=0;riotIntroduced=false;supplyCache=null;nextSupplyAt=SUPPLY_TUNING.first;suppliesCollected=supplyHealing=0;runSurvivor=selectedSurvivor;clearInput();lastMove.x=0;lastMove.y=1;Object.assign(p,{x:0,y:0,hp:100,max:100,speed:210,damage:18,fire:.33,fireClock:0,proj:1,bulletSpeed:600,magnet:80,dash:0,dashCd:0,dashX:0,dashY:1,inv:0,regen:0,pierce:0,arc:0,blades:0,molotov:0,rail:false,thunder:false,reaper:false,wildfire:false,secondWind:false,windSpent:false,capacitor:0,armor:0,decoyPouch:false,gunPriority:'nearest',steady:false,stillTime:0,evasive:false,evasiveUntil:0,arcRelay:false,bladeReach:false});const role=survivorById(runSurvivor);p.hp=p.max=Math.round(role.hp*ruleById(runRule).hp);p.damage*=ruleById(runRule).damage;p.speed=role.speed;p.color=role.color;p.magnet=role.magnet||80;decoyCharges=role.decoys||1;rerollsLeft=role.rerolls||1;lightning=[];bottles=[];fires=[];burnHits=new Map();molotovClock=.2;burnKills=0;bladeHits=new Map();chainClock=.2;scheduleRush(45);rushesSurvived=bonusChoices=0;bonusKinds=[];salvage=null;nextSalvageAt=SALVAGE_TUNING.first;salvagesSecured=0;rescue=null;rescueOffered=false;nextRescueAt=RESCUE_TUNING.first;rescuesCompleted=0;rescueArrival=null;exitBeacon=null;exitAt=180;overtime=0;runOutcome='';reliefLabel='BREAKER DOWN';enemies=[];bullets=[];particles=[];gems=[];texts=[];obstacles=[];barrels=[];blastRings=[];barrelClock=12;barricades=[];barricadeClock=BARRICADE_TUNING.interval;barricadesCleared=0;barrelsBlown=blastKills=bossesDefeated=wardensDefeated=harvestersDefeated=0;nextBossAt=90;bossWarned=false;activeBoss=null;reliefUntil=0;elapsed=spawn=killCount=0;level=1;xp=0;nextXp=8;upgrades=0;shake=0;for(let i=0;i<95;i++){let x=rand(-1800,1800),y=rand(-1800,1800);if(Math.hypot(x,y)<200)continue;obstacles.push({x,y,w:rand(40,150),h:rand(30,120),type:Math.random()<.45?0:1})}seedBarrels();seedBarricades();configureRoute();seedShockDrum();seedPatrol();mode='play';recordRunEvent('deployment');hide();updateHUD();last=performance.now();toast('DASH THROUGH ORANGE BARRELS • BLAST-SAFE',4500);sound(320,.2);if(scoredRun&&preferences.actors==='field')ensureFieldArtwork()}function fmt(t){return String(Math.floor(t/60)).padStart(2,'0')+':'+String(Math.floor(t%60)).padStart(2,'0')}
let healthCue=null;
function healthFeedback(){if(training||runLogged||p.hp<=0)return '';return healthCue&&elapsed<healthCue.until?healthCue.text:p.hp<=p.max*.25?'LOW HP':''}
const FX_LIMITS=Object.freeze({particles:600,texts:100,bullets:100,lightning:15,hostileShots:12,bottles:2,fires:2});

function evolutionHint(){
  const ready=EVOLUTIONS.filter(e=>p[e.weapon]===3&&!p[e.field]);
  return ready.length?'EVOLUTION CAN APPEAR: '+ready.map(e=>e.name).join(' · '):'Build a weapon to rank 3/3, then take its evolution on a later upgrade.';
}
const opts=[
{icon:'✦',name:'Blade Reach',desc:'Orbiting Blades circle 12 units farther out. Same blade count, damage, rotation and per-target interval. Also widens Reaper Ring and its shot interception orbit.',available:()=>p.blades>0&&!p.bladeReach,apply:()=>{p.bladeReach=true}},
{icon:'ϟ',name:'Arc Relay',desc:'Chain Lightning jumps 20% farther after its first target. First-target range, target cap, damage and recharge stay the same. Also works with Thunderweb.',available:()=>p.arc>0&&!p.arcRelay,apply:()=>{p.arcRelay=true}},
{icon:'↗',name:'Evasive Reload',desc:'Dash to prime your next gun volley for +20% damage within 2 active seconds. One volley per Dash; no extra bullets. Other weapons are unchanged.',available:()=>!p.evasive,apply:()=>{p.evasive=true;p.evasiveUntil=0}},
{icon:'⌾',name:'Steady Aim',desc:'After standing still for 0.6 seconds, gun bullets deal 15% more damage. Moving or dashing removes the bonus. Other weapons are unchanged.',available:()=>!p.steady,apply:()=>{p.steady=true;p.stillTime=0}},
{icon:'◇',name:'Decoy Pouch',desc:'Gain one extra decoy charge now (carry at most 2). Once per run; does not refill in overtime.',available:()=>!p.decoyPouch&&decoyCharges<DECOY_TUNING.maxCharges,apply:()=>{p.decoyPouch=true;decoyCharges=Math.min(DECOY_TUNING.maxCharges,decoyCharges+1);updateHUD()}},
{icon:'▰',name:'Armor Plating',desc:()=>`Plating rank ${p.armor+1}/3: reduce incoming hits by ${p.armor+1}, minimum 1 damage. No effect on movement or enemy damage values.`,available:()=>p.armor<3,apply:()=>{p.armor=Math.min(3,p.armor+1)}},
{icon:'↯',name:'Dash Capacitor',desc:()=>`Dash recharge rank ${p.capacitor+1}/2: ${dashCooldown(p.capacitor+1).toFixed(2)}s instead of ${dashCooldown(0).toFixed(2)}s at base.`,available:()=>p.capacitor<2,apply:()=>{p.capacitor=Math.min(2,p.capacitor+1);p.dashCd=Math.min(p.dashCd,dashCooldown())}},
{icon:'↟',name:'Second Wind',desc:'Once this run, a lethal hit restores up to 25 HP and gives 2 seconds of protection. Does not recharge in overtime.',available:()=>!p.secondWind,apply:()=>{p.secondWind=true}},
{icon:'🔥',evolution:'wildfire',name:'Evolve: Wildfire',desc:'Throw at up to 2 spread-out targets. Wider, stronger burns, then a short gap. At most 2 fires; overlapping damage does not stack.',available:()=>p.molotov===3&&!p.wildfire,apply:()=>{p.wildfire=true;molotovClock=Math.min(molotovClock,.2)}},
{icon:'➶',evolution:'rail',name:'Evolve: Railstorm',desc:'Pierce up to 8 enemies per shot, +25% gun damage, faster rail shots.',available:()=>p.pierce===3&&!p.rail,apply:()=>{p.rail=true}},
{icon:'ϟ',evolution:'thunder',name:'Evolve: Thunderweb',desc:'Fork into 2 chains striking up to 8 distinct enemies. More damage and faster recharge.',available:()=>p.arc===3&&!p.thunder,apply:()=>{p.thunder=true;chainClock=Math.min(chainClock,.2)}},
{icon:'✦',evolution:'reaper',name:'Evolve: Reaper Ring',desc:'6 wider, stronger blades. Blade contacts also block enemy shots.',available:()=>p.blades===3&&!p.reaper,apply:()=>{p.reaper=true}},
{icon:'➶',weapon:'pierce',name:'Piercing Rounds',desc:()=>`Bullets pass through ${p.pierce+1} extra ${p.pierce?'enemies':'enemy'}. Line up the horde.`,available:()=>p.pierce<3,apply:()=>p.pierce++},
{icon:'ϟ',weapon:'arc',name:'Chain Lightning',desc:()=>`Auto-zap up to ${p.arc+3} nearby enemies. Higher ranks strike more often.`,available:()=>p.arc<3,apply:()=>{p.arc++;if(p.arc===1)chainClock=.2}},
{icon:'✦',weapon:'blades',name:'Orbiting Blades',desc:()=>`${p.blades+2} blades circle you and cut enemies on contact.`,available:()=>p.blades<3,apply:()=>p.blades++},
{icon:'🔥',weapon:'molotov',name:'Molotov',desc:()=>`Lob burning ground: radius ${molotovStats(p.molotov+1,false).radius}, recharge ${molotovStats(p.molotov+1,false).cooldown}s. Safe for you and survivors.`,available:()=>p.molotov<3,apply:()=>{p.molotov++;if(p.molotov===1)molotovClock=.2}},
{icon:'⚡',name:'Rapid Fire',desc:'18% shorter gun intervals, with a 0.075s minimum.',available:()=>p.fire>.075001,apply:()=>p.fire=Math.max(.075,p.fire*.82)},{icon:'💥',name:'Heavy Rounds',desc:'Damage +30%',apply:()=>p.damage*=1.3},{icon:'👟',name:'Runner',desc:'Movement speed +18%',apply:()=>p.speed*=1.18},{icon:'❤️',name:'Field Medic',desc:'Max HP +30 and heal 40',apply:()=>{p.max+=30;p.hp=Math.min(p.max,p.hp+40)}},{icon:'🔫',name:'Multishot',desc:'Shoot one extra bullet (max 5)',available:()=>p.proj<5,apply:()=>p.proj=Math.min(5,p.proj+1)},{icon:'🧲',name:'Salvager',desc:'Pickup range +55%',apply:()=>p.magnet*=1.55},{icon:'🩹',name:'Regeneration',desc:'Recover 1.5 HP per second',apply:()=>p.regen+=1.5},{icon:'🚀',name:'Velocity',desc:'Bullet speed +25%',apply:()=>p.bulletSpeed*=1.25}];
function shuffled(items){const result=[...items];for(let i=result.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[result[i],result[j]]=[result[j],result[i]]}return result}
function upgradeChoices(previous=[]){
  const pool=opts.filter(o=>!banished.has(o.name)&&(!o.available||o.available())),starters=pool.filter(o=>o.weapon);
  if(level===2&&starters.length===4)return shuffled(starters);
  if(previous.length){
    const unseen=shuffled(pool.filter(o=>!previous.includes(o)));if(!unseen.length)return null;
    // Prefer fresh cards on a refresh, with no reserved weapon/evolution slot.
    const picks=unseen.slice(0,3);
    if(picks.length<3)picks.push(...shuffled(pool.filter(o=>previous.includes(o))).slice(0,3-picks.length));
    return shuffled(picks);
  }
  return shuffled(pool).slice(0,3);
}
function levelUp(reward=false){
  level++;upgrades++;sound(570,.2,'sine',.06);mode='upgrade';showUpgradeChoices(upgradeChoices(),reward);
}
// Choice-screen text only: never apply an option or sample the random pool here.
function upgradeImpact(o){
  const change=(label,from,to,unit='')=>`${label}: ${Number(from.toFixed(unit==='s'?2:1))} → ${Number(to.toFixed(unit==='s'?2:1))}${unit}`;
  if(o.weapon)return `RANK ${p[o.weapon]}/3 → ${p[o.weapon]+1}/3`;
  if(o.evolution)return 'RANK 3/3 → EVOLVED';
  switch(o.name){
    case 'Rapid Fire':return change('Gun volleys/s',1/p.fire,1/Math.max(.075,p.fire*.82));
    case 'Heavy Rounds':return change('Weapon base damage',p.damage,p.damage*1.3);
    case 'Runner':return change('Move speed',p.speed,p.speed*1.18);
    case 'Field Medic':return change('Max HP',p.max,p.max+30)+' · '+change('HP',p.hp,Math.min(p.max+30,p.hp+40));
    case 'Multishot':return change('Bullets/volley',p.proj,Math.min(5,p.proj+1));
    case 'Salvager':return change('XP pickup range',p.magnet,p.magnet*1.55);
    case 'Regeneration':return change('Recovery',p.regen,p.regen+1.5,' HP/s');
    case 'Velocity':return change('Base bullet speed',p.bulletSpeed,p.bulletSpeed*1.25);
    case 'Armor Plating':return change('Hit reduction',p.armor,Math.min(3,p.armor+1));
    case 'Dash Capacitor':return change('Dash recharge',dashCooldown(),dashCooldown((p.capacitor||0)+1),'s');
    case 'Decoy Pouch':return change('Decoy charges',decoyCharges,Math.min(DECOY_TUNING.maxCharges,decoyCharges+1));
    default:return 'SUPPORT · NEW ABILITY';
  }
}
function showUpgradeChoices(picks,reward=false,rerolled=false){
  const offer={picks,reward};upgradeOffer=offer;
  const canReroll=rerollsLeft>0&&picks.length===3&&opts.some(o=>!banished.has(o.name)&&(!o.available||o.available())&&!picks.includes(o));
  const rerollControl=picks.length===4?'<p class="muted">All four starting weapons are offered. Your rerolls are available from the next upgrade.</p>':`<button class="btn secondary reroll-control" id="rerollUpgrade" ${canReroll?'':'disabled'}>${rerollsLeft?canReroll?'REROLL CHOICES · '+rerollsLeft+' LEFT':'NO DIFFERENT CHOICES':'REROLL USED · 0 LEFT'}</button><p class="muted">${rerolled?'Choices refreshed. ':''}${runSurvivor==='quartermaster'?'Two rerolls per run.':'One reroll per run.'} Fresh choices are random; no weapon or evolution is guaranteed. No extra upgrade is granted.</p>`;
  const banishOptions=picks.filter(o=>!o.weapon&&!o.evolution);
  const banishControl=picks.length===3&&banishesLeft&&banishOptions.length?`<div class="contract-picker"><label for="banishPick">OPTIONAL BANISH · ONCE PER RUN</label><select id="banishPick">${banishOptions.map(o=>`<option value="${o.name}">${o.name}</option>`).join('')}</select><p class="muted">Remove this non-weapon upgrade from this run’s future offers and refresh these choices. No extra upgrade.</p><button class="btn secondary reroll-control" id="banishUpgrade">BANISH SELECTED · 1 LEFT</button></div>`:picks.length===3?`<p class="muted">${banishesLeft?'Banish is available when a non-weapon upgrade is offered.':'Banish used this run.'}</p>`:'';
  show(`<div class="eyebrow">${reward==='convoy'?'CONVOY INTERCEPTED · BONUS UPGRADE':reward==='rescue'?'SURVIVOR RESCUED · BONUS UPGRADE':reward==='contract'?'CONTRACT COMPLETE · BONUS UPGRADE':reward==='salvage'?'SALVAGE SECURED · BONUS UPGRADE':reward?'BLACKOUT SURVIVED · BONUS UPGRADE':`LEVEL ${level} REACHED`}</div><h1 style="font-size:44px">CHOOSE YOUR EDGE</h1><p>${level===2?'Pick a weapon to shape this run.':'Three random choices. Take an opportunity or try a new combination.'}</p><p class="muted">Time is paused. Take your time, then tap a power-up.</p><div class="cards${picks.length===4?' four':''}">${picks.map((o,i)=>`<button class="choice${o.evolution?' evolution':''}${favoredChoice(o)?' favored-choice':''}" data-pick="${i}">${favoredChoice(o)?'<small class="evolution-tag">FAVORED PATH</small>':''}${o.evolution?'<small class="evolution-tag">EVOLUTION</small>':''}<div class="emoji">${o.icon}</div><b>${o.name}</b><small class="upgrade-impact">${upgradeImpact(o)}</small><span>${typeof o.desc==='function'?o.desc():o.desc}</span></button>`).join('')}</div><details class="medal-goals" id="upgradeBuild"><summary>YOUR BUILD &amp; EVOLUTIONS</summary><p class="muted">${buildSummary()}</p><p class="evolution-hint">${evolutionHint()}</p></details>${rerollControl}${banishControl}`);
  if(banishesLeft&&picks.length===3&&banishOptions.length){const picker=document.getElementById('banishPick');picker.value=banishOptions[0].name;bindUpgradePress(document.getElementById('banishUpgrade'),()=>banishUpgrade(offer,picker.value))}
  if(canReroll)bindUpgradePress(document.getElementById('rerollUpgrade'),()=>rerollUpgrade(offer));
  modal.querySelectorAll('[data-pick]').forEach(el=>bindUpgradePress(el,()=>{const choice=picks[+el.dataset.pick];if(mode!=='upgrade'||upgradeOffer!==offer||!el.isConnected||choice.available&&!choice.available())return;upgradeOffer=null;choice.apply();recordBuildChoice(choice,reward);if(choice.evolution)recordRunEvent('evolve-'+choice.evolution);mode='play';hide();toast(choice.name.toUpperCase());sound(690,.1);checkLevelUp();finishRescueArrival();updateHUD()}));
}
function rerollUpgrade(offer){
  if(mode!=='upgrade'||document.hidden||p.hp<=0||rerollsLeft<=0||offer!==upgradeOffer||offer.picks.length!==3)return;
  const picks=upgradeChoices(offer.picks);if(!picks)return;
  rerollsLeft--;showUpgradeChoices(picks,offer.reward,true);sound(420,.07,'sine',.025);
}
function banishUpgrade(offer,name){
  if(mode!=='upgrade'||document.hidden||p.hp<=0||offer!==upgradeOffer||banishesLeft<=0||offer.picks.length!==3)return;
  const choice=offer.picks.find(o=>o.name===name&&!o.weapon&&!o.evolution);if(!choice)return;
  banished.add(name);const picks=upgradeChoices(offer.picks);
  if(!picks){banished.delete(name);return}
  banishesLeft--;showUpgradeChoices(picks,offer.reward);sound(260,.08,'triangle',.02);
}
// A card must receive a fresh gesture after this screen opens. Ignore browser
// compatibility clicks and scrolling; each queued upgrade gets its own guard.
function bindUpgradePress(button,action,allowed=()=>mode==='upgrade',delay=450){
  const readyAt=performance.now()+delay;let pointer=null,key=null,startX=0,startY=0,stamp=0;
  const current=()=>allowed()&&button.isConnected&&!document.hidden;
  const ready=()=>current()&&performance.now()>=readyAt;
  const cancel=()=>{pointer=null;key=null};
  const travelled=e=>Math.hypot((e.clientX??startX)-startX,(e.clientY??startY)-startY)>12;
  button.addEventListener('pointerdown',e=>{
    if(stamp!==inputEpoch)cancel();if(e.button!==0||pointer!==null||!ready())return;
    stamp=inputEpoch;pointer=e.pointerId;startX=e.clientX;startY=e.clientY;
  });
  button.addEventListener('pointermove',e=>{if(e.pointerId===pointer&&travelled(e))pointer=null});
  button.addEventListener('pointerup',e=>{
    if(pointer===null||e.pointerId!==pointer)return;
    pointer=null;if(stamp===inputEpoch&&ready()&&!travelled(e)){e.preventDefault();action()}
  });
  for(const event of ['pointercancel','pointerleave','lostpointercapture'])button.addEventListener(event,e=>{if(e.pointerId===pointer)pointer=null});
  button.addEventListener('blur',cancel);
  button.addEventListener('keydown',e=>{
    if(e.key!=='Enter'&&e.key!==' ')return;
    if(stamp!==inputEpoch)cancel();e.preventDefault();if(!e.repeat&&ready()){key=e.key;stamp=inputEpoch}
  });
  button.addEventListener('keyup',e=>{
    if(e.key!=='Enter'&&e.key!==' ')return;
    e.preventDefault();const armed=key===e.key&&stamp===inputEpoch;key=null;if(armed&&ready())action();
  });
  // Screen readers and programmatic accessibility activation use detail zero.
  button.onclick=e=>{if(stamp!==inputEpoch)cancel();if(e?.detail===0&&pointer===null&&key===null&&ready())action()};
}
// Ease toward the late-run floor instead of reaching it before the first exit.
// Active run time only: records, retries and completed runs never affect this curve.
function evasiveMultiplier(){return p.evasive&&p.evasiveUntil>elapsed?1.2:1}
function hordeSpawnInterval(){return .085+.695*Math.exp(-elapsed/150)}
function spawnEnemy(){let angle=rand(0,Math.PI*2),radius=Math.max(W,H)*.65+rand(50,180),tier=Math.random();let type=tier<.14&&elapsed>30?2:tier<.34?1:0;let stats=[{hp:30,spd:70,r:ENEMY_ART.shambler.r,dmg:12,col:ENEMY_ART.shambler.col},{hp:19,spd:130,r:ENEMY_ART.runner.r,dmg:9,col:ENEMY_ART.runner.col},{hp:95,spd:49,r:ENEMY_ART.brute.r,dmg:20,col:ENEMY_ART.brute.col},{hp:700,spd:55,r:45,dmg:30,col:'#ee6a85'}][type];let scale=(1+elapsed/200)*ruleById(runRule).horde;enemies.push({x:p.x+Math.cos(angle)*radius,y:p.y+Math.sin(angle)*radius,hp:stats.hp*scale,max:stats.hp*scale,speed:stats.spd* Math.min(1.6,1+elapsed/350)*overtimePressure().speed,r:stats.r,dmg:stats.dmg,col:stats.col,hit:0,type})}
function burst(x,y,color,n=9){if(preferences.reduced)n=Math.min(n,4);for(let i=0;i<n&&particles.length<(preferences.reduced?120:FX_LIMITS.particles);i++){let a=rand(0,Math.PI*2),s=rand(25,160);particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:rand(.2,.65),max:.65,color,r:rand(2,5)})}}function floatText(x,y,t,color='#f9e7a2'){if(!preferences.numbers&&/^(?:(?:FIRE|BLAST|LIGHTNING|BLADES) )?\d+(?:\.\d+)?$/.test(String(t)))return;if(texts.length>=FX_LIMITS.texts)return;texts.push({x,y,t,color,life:.8})}function hitEnemy(e,d,source=''){
 if(e.hp<=0||!Number.isFinite(d)||d<=0)return;
 noteFieldHit(e,d,source);if(streetSession)streetCombatHit(e,d);
 if(e.trainingDummy){if(sampleLookActive())playStyleAudio('impact');const actual=Math.min(e.hp,d),row=practiceLedger[weaponSource(source)];row.damage+=actual;practiceHits++;if(d>=e.hp){row.kills++;practiceTargets++}e.hp-=d;e.hit=.08;floatText(e.x,e.y,Math.round(d));burst(e.x,e.y,e.col,3);return}
 if(e.convoy){hitConvoy(e,d);return}
 const tally=weaponLedger[weaponSource(source)];tally.damage+=Math.min(e.hp,d);
 e.hp-=d;e.hit=.08;burst(e.x,e.y,e.col,3);
 const bypass=e.riot&&riotShieldUp(e)&&['LIGHTNING','BLADES','BLAST','FIRE'].includes(source);
 floatText(e.x,e.y,bypass?`${source} ${Math.round(d)}`:Math.round(d),bypass?'#a7ffda':'#f9e7a2');
 if(e.hp<=0){
  tally.kills++;killCount++;recordPace(1,0);const species=enemySpecies(e);if(species)enemyTally[species]=Math.min(1e9,enemyTally[species]+1);
  if(source==='FIRE')burnKills++;if(e.spitter)spittersDefeated++;if(e.riot)riotsDefeated++;
  burst(e.x,e.y,e.col,e.type===3?35:12);gems.push({x:e.x,y:e.y,r:e.type===3?11:7,value:e.type===3?20:e.type===2?4:e.spitter||e.riot||e.howler||e.lobber?3:1});
  if(killCount%25===0&&elapsed>=reliefUntil)toast(`${killCount} ELIMINATED`);sound(130,.055,'triangle',.018);if(e===activeBoss)defeatBoss(e);
 }
}
// Limited ranged pressure: visible locked aim, then one slow non-homing shot.
const SPITTER_TUNING=Object.freeze({first:65,interval:30,maxAlive:2,windup:1,cooldown:2.8,shotSpeed:210,shotLife:2.5,shotDamage:10});
function updateSpitterSchedule(){
  if(mode!=='play'||elapsed<nextSpitterAt||elapsed<reliefUntil)return;
  if(activeBoss||nextBossAt-elapsed<=10||rushPhase==='active'||rushPhase==='warning'||enemies.length>=239||enemies.filter(e=>e.spitter&&e.hp>0).length>=SPITTER_TUNING.maxAlive){nextSpitterAt=elapsed+3;return}
  const angle=rand(0,Math.PI*2),radius=Math.min(W,H)*.5+80,hp=42*(1+elapsed/200);
  enemies.push({x:p.x+Math.cos(angle)*radius,y:p.y+Math.sin(angle)*radius,hp,max:hp,speed:82*overtimePressure().speed,r:ENEMY_ART.spitter.r,dmg:10,col:ENEMY_ART.spitter.col,hit:0,type:4,spitter:true,phase:'approach',cooldown:1.2,phaseTime:0,aimX:0,aimY:1});
  nextSpitterAt=elapsed+SPITTER_TUNING.interval;
  if(!spitterIntroduced){spitterIntroduced=true;toast('SPITTERS • SIDESTEP THE PINK AIM LINE',3500)}
}
const DECOY_TUNING=Object.freeze({duration:3,radius:240,targets:12,charges:1,maxCharges:2});
function deployDecoy(){
 if(mode!=='play'||document.hidden||p.hp<=0||decoyCharges<=0||decoy)return;
 const point={x:p.x-lastMove.x*60,y:p.y-lastMove.y*60};
 if(nearBarricade(point,18)){point.x=p.x;point.y=p.y}
 const targets=enemies.filter(e=>rallyEligible(e)&&elapsed>=(e.salvageStunUntil||0)&&dist(e,point)<=DECOY_TUNING.radius).sort((a,b)=>dist(a,point)-dist(b,point)).slice(0,DECOY_TUNING.targets);
 decoyCharges--;decoysUsed++;recordRunEvent('decoy');decoy={...point,until:elapsed+DECOY_TUNING.duration,targets:new Set(targets)};
 for(const e of targets)if(!e.decoyCounted){e.decoyCounted=true;decoyLured++}
 sound(580,.12,'triangle',.025);updateHUD();
}
function moveHorde(e,dt){
 const lured=decoy&&elapsed<decoy.until&&decoy.targets.has(e)&&rallyEligible(e),target=lured?decoy:streetSession?streetSteering(e):p;
 if(lured&&dist(e,target)<=e.r+10)return;
 const a=Math.atan2(target.y-e.y,target.x-e.x);e.x+=Math.cos(a)*e.speed*howlMultiplier(e)*dt;e.y+=Math.sin(a)*e.speed*howlMultiplier(e)*dt;
}
function updateDecoyHUD(){
 const b=document.getElementById('decoy');b.style.display=mode==='play'?'block':'none';b.textContent=decoy?'DECOY ACTIVE':`DECOY · ${decoyCharges}`;b.setAttribute('aria-disabled',String(mode!=='play'||!!decoy||decoyCharges<=0));b.setAttribute('aria-label',decoy?'Decoy active':`${decoyCharges} decoy charges remaining; press Q or tap to deploy`);
}
function renderDecoy(){
 if(!decoy)return;g.save();g.strokeStyle='#c9c6ff';g.fillStyle='#aaa7ff24';g.lineWidth=2;g.setLineDash([4,7]);g.beginPath();g.arc(decoy.x,decoy.y,25,0,Math.PI*2);g.fill();g.stroke();g.setLineDash([]);g.beginPath();g.moveTo(decoy.x-8,decoy.y-12);g.lineTo(decoy.x+8,decoy.y+12);g.moveTo(decoy.x+8,decoy.y-12);g.lineTo(decoy.x-8,decoy.y+12);g.stroke();g.fillStyle='#e1deff';g.font='bold 10px system-ui';g.textAlign='center';g.fillText('DECOY '+Math.max(0,Math.ceil(decoy.until-elapsed))+'s',decoy.x,decoy.y-34);g.restore();
}
// Overtime artillery adds one fixed, fully telegraphed ground hazard in quiet windows.
const LOBBER_TUNING=Object.freeze({first:255,interval:70,maxAlive:1,hp:65,speed:55,range:230,windup:1,warning:1.4,cooldown:6.5,radius:52,damage:14,maxBombs:1});
function lobberBlocked(){return overtime<1&&!(training&&trainingScenario==='lobber')||howlBlocked()}
function cancelLobbers(){lobberBombs=[];for(const e of enemies)if(e.lobber){e.phase='approach';e.phaseTime=0;e.cooldown=Math.max(e.cooldown,1.5)}}
function updateLobberSchedule(){
 if(mode!=='play'||p.hp<=0)return;
 for(let i=enemies.length-1;i>=0;i--)if(enemies[i].lobber&&dist(enemies[i],p)>1200)enemies.splice(i,1);
 if(elapsed<nextLobberAt)return;
 if(lobberBlocked()||enemies.length>=239||enemies.some(e=>e.lobber&&e.hp>0)){nextLobberAt=elapsed+3;return}
 const a=rand(0,Math.PI*2),r=Math.min(W,H)*.5+70,hp=LOBBER_TUNING.hp*(1+elapsed/200),e={...ENEMY_ART.lobber,x:p.x+Math.cos(a)*r,y:p.y+Math.sin(a)*r,hp,max:hp,speed:LOBBER_TUNING.speed,dmg:10,hit:0,phase:'approach',phaseTime:0,cooldown:1.5};
 resolveBarricadeBody(e,{x:e.x,y:e.y});enemies.push(e);nextLobberAt=elapsed+LOBBER_TUNING.interval;
 if(!lobberIntroduced){lobberIntroduced=true;toast('LOBBER • LEAVE THE ORANGE GROUND WARNING',3500)}
}
function updateLobbers(dt){
 if(mode!=='play'||p.hp<=0)return;
 if(lobberBlocked()){cancelLobbers();return}
 for(let i=lobberBombs.length-1;i>=0;i--){
  const b=lobberBombs[i];b.remaining-=dt;
  if(dist(b,p)>1200){lobberBombs.splice(i,1);continue}
  if(b.remaining<=1e-8){lobberBombs.splice(i,1);blastRings.push({x:b.x,y:b.y,life:.35,max:.35,radius:b.r,color:'#ffa375'});burst(b.x,b.y,'#ffa375',12);if(dist(b,p)<=b.r+p.r){hurtPlayer(LOBBER_TUNING.damage,'lobber-blast');if(mode==='end')return}}
 }
 for(const e of enemies)if(e.lobber&&e.hp>0){
  if(!rangedEnemyVisible(e)||elapsed<(e.salvageStunUntil||0)){e.phase='approach';e.phaseTime=0;e.cooldown=Math.max(e.cooldown,1.5);continue}
  if(e.phase==='windup'){
   e.phaseTime-=dt;
   if(e.phaseTime<=1e-8){if(lobberBombs.length<LOBBER_TUNING.maxBombs){const bomb={x:p.x,y:p.y,r:LOBBER_TUNING.radius,remaining:LOBBER_TUNING.warning};lobberBombs.push(bomb);noteFieldLobberThrow(e,bomb)}e.phase='approach';e.cooldown=LOBBER_TUNING.cooldown}
  }else{e.cooldown=Math.max(0,e.cooldown-dt);if(e.cooldown<=0&&dist(e,p)<=LOBBER_TUNING.range&&lobberBombs.length<LOBBER_TUNING.maxBombs){e.phase='windup';e.phaseTime=LOBBER_TUNING.windup}}
 }
}
function moveLobber(e,dt){if(mode!=='play'||e.hp<=0||e.phase==='windup'||elapsed<(e.salvageStunUntil||0))return;if(dist(e,p)>LOBBER_TUNING.range*.85||!rangedEnemyVisible(e)){const a=Math.atan2(p.y-e.y,p.x-e.x);e.x+=Math.cos(a)*e.speed*dt;e.y+=Math.sin(a)*e.speed*dt}}
function renderLobber(e,ctx=g,field=false){ctx.save();ctx.strokeStyle='#e0e9ff';ctx.lineWidth=5;if(field){ctx.save();ctx.translate(-e.r-14,e.r*.6-FIELD_ACTOR_HEIGHTS.lobber+2);ctx.lineWidth=2.2}ctx.beginPath();ctx.moveTo(e.x-8,e.y-6);ctx.lineTo(e.x,e.y-16);ctx.lineTo(e.x+8,e.y-6);ctx.stroke();if(field)ctx.restore();ctx.font='bold 10px system-ui';ctx.textAlign='center';ctx.fillStyle='#e0e9ff';ctx.fillText(e.phase==='windup'?'LOBBER · LAUNCHING':'LOBBER',e.x,field?e.y+e.r*.6-FIELD_ACTOR_HEIGHTS.lobber-24:e.y-e.r-24);ctx.restore()}
function renderLobberBombs(){
 for(const b of lobberBombs){g.save();g.fillStyle='#ff754d33';g.strokeStyle='#ffbe8e';g.lineWidth=3;g.setLineDash([6,5]);g.beginPath();g.arc(b.x,b.y,b.r,0,Math.PI*2);g.fill();g.stroke();g.setLineDash([]);g.beginPath();g.arc(b.x,b.y,b.r*clamp(1-b.remaining/LOBBER_TUNING.warning,0,1),0,Math.PI*2);g.stroke();g.fillStyle='#ffe1c4';g.font='bold 11px system-ui';g.textAlign='center';g.fillText('MOVE · BLAST',b.x,b.y-b.r-12);g.restore()}
}
// A single support enemy rallies a small ordinary crowd, with no extra damage or spawns.
const HOWLER_TUNING=Object.freeze({first:210,interval:55,maxAlive:1,hp:50,speed:68,range:140,radius:170,targets:8,windup:1.2,cooldown:6.5,duration:3,haste:1.2});
function howlBlocked(){return !!(activeBoss||bossWarned||nextBossAt-elapsed<=10||rushPhase==='active'||rushPhase==='warning'||nextRushAt-elapsed<=5||elapsed<reliefUntil||salvage||convoy||supplyDrop||exitBeacon)}
function rallyEligible(e){return e.hp>0&&e!==activeBoss&&!e.convoy&&!e.rush&&!e.spitter&&!e.riot&&!e.howler&&e.type>=0&&e.type<=2}
function howlMultiplier(e){return rallyEligible(e)&&elapsed<(e.howlUntil||0)?HOWLER_TUNING.haste:1}
function rallyTargets(e){return enemies.filter(other=>rallyEligible(other)&&elapsed>=(other.salvageStunUntil||0)&&dist(e,other)<=HOWLER_TUNING.radius).sort((a,b)=>dist(e,a)-dist(e,b)).slice(0,HOWLER_TUNING.targets)}
function cancelHowls(){
  for(const e of enemies){
    if(e.howlUntil)e.howlUntil=0;
    if(e.howler){e.phase='approach';e.phaseTime=0;e.pulseUntil=0;e.cooldown=Math.max(e.cooldown,1.5)}
  }
}
function updateHowlerSchedule(){
  if(mode!=='play'||p.hp<=0)return;
  for(let i=enemies.length-1;i>=0;i--)if(enemies[i].howler&&dist(enemies[i],p)>1200)enemies.splice(i,1);
  if(elapsed<nextHowlerAt)return;
  if(howlBlocked()||enemies.length>=239||enemies.some(e=>e.howler&&e.hp>0)){nextHowlerAt=elapsed+3;return}
  const angle=rand(0,Math.PI*2),radius=Math.min(W,H)*.5+80,hp=HOWLER_TUNING.hp*(1+elapsed/200);
  const e={...ENEMY_ART.howler,x:p.x+Math.cos(angle)*radius,y:p.y+Math.sin(angle)*radius,hp,max:hp,speed:HOWLER_TUNING.speed*overtimePressure().speed,dmg:10,hit:0,phase:'approach',phaseTime:0,cooldown:1.5,pulseUntil:0};
  resolveBarricadeBody(e,{x:e.x,y:e.y});enemies.push(e);nextHowlerAt=elapsed+HOWLER_TUNING.interval;
  if(!howlerIntroduced){howlerIntroduced=true;toast('HOWLER • STOP THE GOLD RALLY WINDUP',3500)}
}
function updateHowls(dt){
  if(mode!=='play'||p.hp<=0)return;
  if(howlBlocked()){cancelHowls();return}
  for(const e of enemies)if(e.howler&&e.hp>0){
    if(!rangedEnemyVisible(e)||elapsed<(e.salvageStunUntil||0)){
      e.phase='approach';e.phaseTime=0;e.cooldown=Math.max(e.cooldown,1.5);continue;
    }
    if(e.phase==='howl'){
      e.phaseTime=Math.max(0,e.phaseTime-dt);
      if(e.phaseTime<=1e-8){
        const targets=rallyTargets(e);
        for(const other of targets)other.howlUntil=elapsed+HOWLER_TUNING.duration;
        if(targets.length){e.pulseUntil=elapsed+.35;sound(180,.14,'triangle',.018,'alerts')}
        e.phase='approach';e.cooldown=HOWLER_TUNING.cooldown;
      }
      continue;
    }
    e.cooldown=Math.max(0,e.cooldown-dt);
    if(e.cooldown<=0&&rallyTargets(e).length){e.phase='howl';e.phaseTime=HOWLER_TUNING.windup;sound(340,.08,'triangle',.012,'alerts')}
  }
}
function moveHowler(e,dt){
  if(mode!=='play'||e.hp<=0||e.phase==='howl'||elapsed<(e.salvageStunUntil||0))return;
  if(dist(e,p)>HOWLER_TUNING.range||!rangedEnemyVisible(e)){
    const angle=Math.atan2(p.y-e.y,p.x-e.x);e.x+=Math.cos(angle)*e.speed*dt;e.y+=Math.sin(angle)*e.speed*dt;
  }
}
function renderHowler(e,ctx=g,field=false){
  ctx.save();ctx.fillStyle='#20212b';ctx.beginPath();ctx.ellipse(e.x,e.y+6,4,6,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#fff0a3';ctx.lineWidth=2;
  for(const radius of [e.r+5,e.r+10])for(const angle of [0,Math.PI]){ctx.beginPath();ctx.arc(e.x,e.y,radius,angle-.48,angle+.48);ctx.stroke()}
  ctx.fillStyle='#fff0a3';ctx.font='bold 10px system-ui';ctx.textAlign='center';ctx.fillText(e.phase==='howl'?'HOWLER · RALLYING':'HOWLER',e.x,field?e.y+e.r*.6-FIELD_ACTOR_HEIGHTS.howler-22:e.y-e.r-22);ctx.restore();
}
function renderHowlerWarnings(){
  g.save();
  for(const e of enemies)if(e.howler&&e.hp>0){
    if(e.phase==='howl'){
      const progress=clamp(1-e.phaseTime/HOWLER_TUNING.windup,0,1);
      g.fillStyle='#ffe0820b';g.strokeStyle='#ffe08288';g.lineWidth=2;g.setLineDash([7,7]);g.beginPath();g.arc(e.x,e.y,HOWLER_TUNING.radius,0,Math.PI*2);g.fill();g.stroke();g.setLineDash([]);
      g.strokeStyle='#fff0a3';g.lineWidth=3;g.beginPath();g.arc(e.x,e.y,HOWLER_TUNING.radius*progress,0,Math.PI*2);g.stroke();
    }else if(elapsed<(e.pulseUntil||0)){
      g.globalAlpha=clamp((e.pulseUntil-elapsed)/.35,0,1);g.strokeStyle='#fff0a3';g.lineWidth=3;g.beginPath();g.arc(e.x,e.y,HOWLER_TUNING.radius,0,Math.PI*2);g.stroke();g.globalAlpha=1;
    }
  }
  g.restore();
}
// Rare slow shield carriers offer a short locked bash, then a generous gun opening.
const RIOT_TUNING=Object.freeze({first:150,interval:40,maxAlive:2,hp:55,speed:62,turn:1.4,windup:.9,bashTime:.24,bashDistance:90,recovery:2.2,cooldown:1.8,shieldOffset:6,shieldWidth:8,shieldHalfAngle:Math.PI/3});
function updateRiotSchedule(){
  if(mode!=='play'||elapsed<nextRiotAt||elapsed<reliefUntil)return;
  if(activeBoss||nextBossAt-elapsed<=10||rushPhase==='active'||rushPhase==='warning'||salvage||exitBeacon||enemies.length>=239||enemies.filter(e=>e.riot&&e.hp>0).length>=RIOT_TUNING.maxAlive){nextRiotAt=elapsed+3;return}
  const angle=rand(0,Math.PI*2),radius=clamp(Math.min(W,H)*.5+40,180,260),hp=RIOT_TUNING.hp*(1+elapsed/200);
  const e={x:p.x+Math.cos(angle)*radius,y:p.y+Math.sin(angle)*radius,hp,max:hp,speed:RIOT_TUNING.speed*overtimePressure().speed,r:ENEMY_ART.riot.r,dmg:12,col:ENEMY_ART.riot.col,hit:0,type:5,riot:true,phase:'approach',phaseTime:0,cooldown:1.2,facing:angle+Math.PI};
  resolveBarricadeBody(e,{x:e.x,y:e.y});enemies.push(e);nextRiotAt=elapsed+RIOT_TUNING.interval;
  if(!riotIntroduced){riotIntroduced=true;toast('RIOT GUARD • FLANK GOLD SHIELD • SHOOT WHEN OPEN',4000)}
}
function riotShieldUp(e){return e.riot&&e.phase!=='recover'&&elapsed>=(e.salvageStunUntil||0)}
function riotShieldHitTime(e,from,to,shotRadius){
  if(!riotShieldUp(e))return Infinity;
  const radius=e.r+RIOT_TUNING.shieldOffset,padding=RIOT_TUNING.shieldWidth/2+shotRadius,outer=radius+padding,half=RIOT_TUNING.shieldHalfAngle;
  if(Math.max(from.x,to.x)<e.x-outer||Math.min(from.x,to.x)>e.x+outer||Math.max(from.y,to.y)<e.y-outer||Math.min(from.y,to.y)>e.y+outer)return Infinity;
  const inArc=(x,y)=>Math.cos(Math.atan2(y-e.y,x-e.x)-e.facing)>=Math.cos(half)-1e-10;
  const angle=Math.atan2(from.y-e.y,from.x-e.x),delta=Math.atan2(Math.sin(angle-e.facing),Math.cos(angle-e.facing)),nearest=e.facing+clamp(delta,-half,half);
  if(Math.hypot(from.x-e.x-Math.cos(nearest)*radius,from.y-e.y-Math.sin(nearest)*radius)<=padding+1e-9)return 0;
  const dx=to.x-from.x,dy=to.y-from.y,ox=from.x-e.x,oy=from.y-e.y,A=dx*dx+dy*dy;
  let first=Infinity;
  if(A>0){
    // The stroked arc has outer/inner circular faces plus round endpoint caps.
    for(const r of [outer,radius-padding]){
      if(r<=0)continue;
      const B=2*(ox*dx+oy*dy),C=ox*ox+oy*oy-r*r,D=B*B-4*A*C;if(D<0)continue;
      const root=Math.sqrt(D);
      for(const t of [(-B-root)/(2*A),(-B+root)/(2*A)])if(t>=0&&t<=1&&inArc(from.x+dx*t,from.y+dy*t))first=Math.min(first,t);
    }
  }
  for(const sign of [-1,1]){
    const a=e.facing+sign*half,cap={x:e.x+Math.cos(a)*radius,y:e.y+Math.sin(a)*radius};
    first=Math.min(first,projectileHitTime(cap,from,to,padding));
  }
  return first;
}
function riotShotImpact(e,from,to,shotRadius){
  const body=projectileHitTime(e,from,to,e.r+shotRadius),shield=riotShieldHitTime(e,from,to,shotRadius);
  return shield!==Infinity&&shield<=body?{time:shield,shield:true}:{time:body,shield:false};
}
function blockRiotShot(e){
  e.shieldHitUntil=elapsed+.12;burst(e.x+Math.cos(e.facing)*e.r,e.y+Math.sin(e.facing)*e.r,'#ffe3a1',3);
  if(elapsed>=(e.nextBlockText||0)){e.nextBlockText=elapsed+.3;floatText(e.x,e.y-e.r-25,'BLOCK','#ffdb8d');sound(240,.03,'triangle',.008)}
}
function moveRiot(e,dt){
  if(mode!=='play'||e.trainingDummy&&!e.trainingLive||e.hp<=0||elapsed<(e.salvageStunUntil||0))return;
  if(e.phase==='recover'){
    e.phaseTime=Math.max(0,e.phaseTime-dt);if(e.phaseTime<=0){e.phase='approach';e.cooldown=RIOT_TUNING.cooldown}return;
  }
  if(e.phase==='warn'){
    if(!rangedEnemyVisible(e)){e.phase='approach';e.cooldown=1;return}
    e.phaseTime-=dt;if(e.phaseTime<=0){e.phase='bash';e.phaseTime=RIOT_TUNING.bashTime}return;
  }
  if(e.phase==='bash'){
    const step=Math.min(dt,e.phaseTime),distance=RIOT_TUNING.bashDistance*step/RIOT_TUNING.bashTime;
    e.x+=Math.cos(e.facing)*distance;e.y+=Math.sin(e.facing)*distance;e.phaseTime=Math.max(0,e.phaseTime-dt);
    if(e.phaseTime<=1e-8){e.phase='recover';e.phaseTime=RIOT_TUNING.recovery}return;
  }
  const angle=Math.atan2(p.y-e.y,p.x-e.x),difference=Math.atan2(Math.sin(angle-e.facing),Math.cos(angle-e.facing));
  e.facing+=clamp(difference,-RIOT_TUNING.turn*dt,RIOT_TUNING.turn*dt);e.cooldown=Math.max(0,e.cooldown-dt);
  if(dist(e,p)>70){e.x+=Math.cos(e.facing)*e.speed*dt;e.y+=Math.sin(e.facing)*e.speed*dt}
  const aim=Math.atan2(p.y-e.y,p.x-e.x),error=Math.atan2(Math.sin(aim-e.facing),Math.cos(aim-e.facing));
  if(e.cooldown<=0&&dist(e,p)<=105&&Math.abs(error)<.3&&rangedEnemyVisible(e)){e.facing=aim;e.phase='warn';e.phaseTime=RIOT_TUNING.windup}
}
function updateRiotMotion(dt){
  if(mode!=='play')return;
  for(const e of enemies)if(e.riot&&e.hp>0){
    e.riotFrom={x:e.x,y:e.y};moveRiot(e,dt);applyEnemyBarricades(e,e.riotFrom,dt,false);
  }
}
function renderRiot(e,ctx=g,field=false){
  const shield=riotShieldUp(e);ctx.save();ctx.lineCap='round';
  if(shield){
    ctx.strokeStyle=elapsed<(e.shieldHitUntil||0)?'#fff6d4':'#f2c36b';ctx.lineWidth=RIOT_TUNING.shieldWidth;
    ctx.beginPath();ctx.arc(e.x,e.y,e.r+RIOT_TUNING.shieldOffset,e.facing-RIOT_TUNING.shieldHalfAngle,e.facing+RIOT_TUNING.shieldHalfAngle);ctx.stroke();
  }else{
    // Move the lowered shield to the flank so there is visibly no front barrier.
    const side=e.facing+Math.PI/2,cx=e.x+Math.cos(side)*(e.r+6),cy=e.y+Math.sin(side)*(e.r+6);
    ctx.strokeStyle='#667d86';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(cx-Math.cos(e.facing)*10,cy-Math.sin(e.facing)*10);ctx.lineTo(cx+Math.cos(e.facing)*10,cy+Math.sin(e.facing)*10);ctx.stroke();
    ctx.strokeStyle='#a7ffda';ctx.lineWidth=2;ctx.beginPath();ctx.arc(e.x,e.y,e.r+2,0,Math.PI*2);ctx.stroke();
  }
  ctx.fillStyle=shield?'#ffe1a4':'#a7ffda';ctx.font='bold 11px system-ui';ctx.textAlign='center';ctx.fillText(shield?'GUARD · SHIELDED':'GUARD · SHIELD DOWN',e.x,field?e.y+e.r*.6-FIELD_ACTOR_HEIGHTS.riot-24:e.y-e.r-24);
  if(e.phase==='warn'&&elapsed>=(e.salvageStunUntil||0)){
    ctx.strokeStyle='#ffd79488';ctx.lineWidth=2*(e.r+p.r);ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(e.x+Math.cos(e.facing)*RIOT_TUNING.bashDistance,e.y+Math.sin(e.facing)*RIOT_TUNING.bashDistance);ctx.stroke();
    ctx.strokeStyle='#ffe3ad';ctx.lineWidth=2;ctx.setLineDash([6,6]);ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(e.x+Math.cos(e.facing)*RIOT_TUNING.bashDistance,e.y+Math.sin(e.facing)*RIOT_TUNING.bashDistance);ctx.stroke();
  }
  ctx.restore();
}
function rangedEnemyVisible(e){if(streetSession&&streetAngled){const at=streetProject(e.x,e.y);return at.x>25&&at.x<W-25&&at.y>40&&at.y<H-25&&!streetBlocked(p,e)}return Math.abs(e.x-p.x)<W/2-35&&Math.abs(e.y-p.y)<H/2-35}
function moveSpitter(e,dt){
  const visible=rangedEnemyVisible(e),range=clamp(Math.min(W,H)*.35,120,240);
  if(e.phase==='aim'){
    if(!visible){e.phase='approach';e.cooldown=SPITTER_TUNING.cooldown;return}
    e.phaseTime-=dt;
    if(e.phaseTime<=0){
      if(hostileShots.length<FX_LIMITS.hostileShots){hostileShots.push({x:e.x+e.aimX*(e.r+8),y:e.y+e.aimY*(e.r+8),vx:e.aimX*SPITTER_TUNING.shotSpeed,vy:e.aimY*SPITTER_TUNING.shotSpeed,r:7,life:SPITTER_TUNING.shotLife,dmg:SPITTER_TUNING.shotDamage,kind:'spitter'});noteFieldSpitterShot(e)}
      e.phase='approach';e.cooldown=SPITTER_TUNING.cooldown;sound(230,.08,'triangle',.015,'alerts');
    }
    return;
  }
  e.cooldown=Math.max(0,e.cooldown-dt);
  if(dist(e,p)>range||!visible){const a=Math.atan2(p.y-e.y,p.x-e.x);e.x+=Math.cos(a)*e.speed*dt;e.y+=Math.sin(a)*e.speed*dt}
  if(e.cooldown<=0&&rangedEnemyVisible(e)&&dist(e,p)<=range+25){
    const a=Math.atan2(p.y-e.y,p.x-e.x);e.aimX=Math.cos(a);e.aimY=Math.sin(a);e.phase='aim';e.phaseTime=SPITTER_TUNING.windup;
  }
}
function hurtPlayer(damage,source='contact'){
  if(training){if(mode==='play'&&p.inv<=0&&p.hp>0&&Number.isFinite(damage)&&damage>0&&elapsed>=practiceThreatReadyAt){practiceThreats++;practiceThreatReadyAt=elapsed+.55;practiceLastThreat=knownThreat(source)?source:'contact'}return false}
  if(mode!=='play'||p.inv>0||p.hp<=0||!Number.isFinite(damage)||damage<=0)return false;
  const incoming=damage;damage=Math.min(incoming,Math.max(1,incoming-(p.armor||0)));const lost=Math.min(p.hp,damage);damageTaken+=lost;recordPace(0,lost);hitsTaken++;armorPrevented+=incoming-damage;lastThreat=knownThreat(source)?source:'contact';healthCue={until:elapsed+.7,text:'−'+Number(lost.toFixed(1))+' HP'};p.hp=Math.max(0,p.hp-damage);p.inv=.55;shake=10;burst(p.x,p.y,'#ff697c',16);sound(90,.25,'sawtooth',.04,'alerts');
  if(p.hp<=0&&p.secondWind&&!p.windSpent){healthCue={until:elapsed+2,text:'SECOND WIND'};p.windSpent=true;recordRunEvent('second-wind');p.hp=Math.min(p.max,25);p.inv=2;toast('SECOND WIND • 25 HP • LAST CHANCE',2600);sound(520,.16,'sine',.03,'alerts')}else if(p.hp<=0)end();return true;
}
function updateHostileShots(dt,fromPlayer){
  if(mode!=='play')return;
  for(let i=hostileShots.length-1;i>=0;i--){
    const b=hostileShots[i];if(b.life<=0){hostileShots.splice(i,1);continue}
    const from={x:b.x,y:b.y},step=Math.min(dt,b.life),fraction=dt?step/dt:1;
    b.x+=b.vx*step;b.y+=b.vy*step;b.life-=step;
    const playerEnd={x:fromPlayer.x+(p.x-fromPlayer.x)*fraction,y:fromPlayer.y+(p.y-fromPlayer.y)*fraction};
    const playerHit=projectileHitTime({x:0,y:0},{x:from.x-fromPlayer.x,y:from.y-fromPlayer.y},{x:b.x-playerEnd.x,y:b.y-playerEnd.y},b.r+p.r);
    let bladeHit=Infinity;
    if(p.reaper&&p.blades===3){
      const before=bladePositions(elapsed-dt,fromPlayer),after=bladePositions(elapsed-dt+step,playerEnd);
      for(let j=0;j<before.length;j++)bladeHit=Math.min(bladeHit,projectileHitTime({x:0,y:0},{x:from.x-before[j].x,y:from.y-before[j].y},{x:b.x-after[j].x,y:b.y-after[j].y},b.r+11));
    }
    const cover=firstBarricadeHit(from,b,b.r);
    if(cover.barrier&&cover.time<=Math.min(bladeHit,playerHit)){hostileShots.splice(i,1);damageBarricade(cover.barrier,b.dmg,'shot')}
    else if(bladeHit!==Infinity&&bladeHit<=playerHit){hostileShots.splice(i,1);burst(from.x+(b.x-from.x)*bladeHit,from.y+(b.y-from.y)*bladeHit,'#ffe29b',3)}
    else if(playerHit!==Infinity){hostileShots.splice(i,1);hurtPlayer(b.dmg,b.kind==='warden'?'warden-shot':b.kind==='spitter'?'spitter-shot':'shot');if(mode==='end')return}
    else if(b.life<=0||dist(b,p)>1400)hostileShots.splice(i,1);
  }
}
function renderSpitterWarnings(){
  g.save();g.lineWidth=2;g.strokeStyle='#ff9fbd';g.setLineDash([7,8]);
  for(const e of enemies)if(e.hp>0&&e.spitter&&e.phase==='aim'){
    g.beginPath();g.moveTo(e.x,e.y);g.lineTo(e.x+e.aimX*SPITTER_TUNING.shotSpeed*SPITTER_TUNING.shotLife,e.y+e.aimY*SPITTER_TUNING.shotSpeed*SPITTER_TUNING.shotLife);g.stroke();
  }
  g.restore();
}
function renderHostileShots(){
  g.save();g.lineWidth=2;
  for(const b of hostileShots){g.fillStyle=b.kind==='warden'?'#78baff':'#ff6d9f';g.strokeStyle=b.kind==='warden'?'#e0f7ff':'#ffe3ee';g.beginPath();if(b.kind==='warden')g.arc(b.x,b.y,b.r,0,Math.PI*2);else{g.moveTo(b.x,b.y-b.r);g.lineTo(b.x+b.r,b.y);g.lineTo(b.x,b.y+b.r);g.lineTo(b.x-b.r,b.y);g.closePath()}g.fill();g.stroke()}
  g.restore();
}
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
const SHOCK_TUNING=Object.freeze({radius:150,duration:1.5,targets:12,max:2,interval:40});
function seedShockDrum(){
 const b={x:-Math.min(130,W*.3),y:125,r:17,spent:false};
 obstacles=obstacles.filter(o=>pointRectDistance(b,o)>40);
 barricades=barricades.filter(o=>pointRectDistance(b,o)>40);shockDrums=[b];
}
function dischargeShock(b){
 if(mode!=='play'||p.hp<=0||b.spent||!shockDrums.includes(b))return;
 b.spent=true;shocksUsed++;recordRunEvent('shock');
 const targets=enemies.filter(e=>e.hp>0&&e!==activeBoss&&!e.convoy&&e.type!==3&&dist(e,b)<=SHOCK_TUNING.radius+e.r).sort((a,c)=>dist(a,b)-dist(c,b)).slice(0,SHOCK_TUNING.targets);
 for(const e of targets){e.salvageStunUntil=Math.max(e.salvageStunUntil||0,elapsed+SHOCK_TUNING.duration);e.howlUntil=0;if(e.spitter||e.howler||e.riot||e.lobber){e.phase=e.riot?'recover':'approach';e.phaseTime=Math.max(e.phaseTime||0,SHOCK_TUNING.duration);e.cooldown=Math.max(e.cooldown||0,SHOCK_TUNING.duration)}}
 shockStuns+=targets.length;
 blastRings.push({x:b.x,y:b.y,life:.4,max:.4,radius:SHOCK_TUNING.radius,color:'#77f2ed'});
 floatText(b.x,b.y-25,`SHOCK • ${targets.length} STUNNED`,'#a7ffff');sound(560,.15,'triangle',.025);
}
function updateShockDrums(dt,from,wasDashing){
 if(mode!=='play'||p.hp<=0)return;
 if(wasDashing)for(const b of shockDrums)if(!b.spent&&segmentDistance(b,from,p)<=b.r+p.r)dischargeShock(b);
 shockDrums=shockDrums.filter(b=>!b.spent&&dist(b,p)<1200);shockClock-=dt;
 if(shockClock>0)return;shockClock=SHOCK_TUNING.interval;if(shockDrums.length>=SHOCK_TUNING.max)return;
 for(let i=0;i<16;i++){
  const a=rand(0,Math.PI*2),r=rand(180,Math.max(220,Math.min(W,H)*.6)),b={x:p.x+Math.cos(a)*r,y:p.y+Math.sin(a)*r,r:17,spent:false};
  if(obstacles.some(o=>pointRectDistance(b,o)<40)||nearBarricade(b,40)||nearDrop(b,40)||nearConvoyRoute(b,40)||barrels.some(o=>dist(o,b)<70)||shockDrums.some(o=>dist(o,b)<100)||salvage&&dist(b,salvage)<salvage.r+40||exitBeacon&&dist(b,exitBeacon)<80)continue;
  shockDrums.push(b);break;
 }
}
function renderShockDrums(){
 for(const b of shockDrums){
  if(b.spent||Math.abs(b.x-p.x)>W/2+180||Math.abs(b.y-p.y)>H/2+180)continue;
  if(dist(b,p)<240){g.strokeStyle='#77f2ed55';g.lineWidth=2;g.setLineDash([3,7]);g.beginPath();g.arc(b.x,b.y,SHOCK_TUNING.radius,0,Math.PI*2);g.stroke();g.setLineDash([])}
  if(drawFieldDrum(b,true)){g.fillStyle='#c8ffff';g.textAlign='center'}else{
  g.fillStyle='#277f88';g.fillRect(b.x-14,b.y-18,28,34);g.strokeStyle='#a7ffff';g.lineWidth=2;g.strokeRect(b.x-14,b.y-18,28,34);
  g.fillStyle='#c8ffff';g.font='bold 23px system-ui';g.textAlign='center';g.fillText('ϟ',b.x,b.y+9);
  }
  if(dist(b,p)<240){g.font='bold 10px system-ui';g.fillText('DASH · STUN',b.x,b.y-30)}
 }
}
// Fuel barrels are tactical tools; shots keep targeting enemies and the player is blast-safe.
const FUEL_RADIUS=145;
function fuelRadius(){return FUEL_RADIUS*(runSurvivor==='engineer'?ENGINEER_TUNING.fuelRadius:1)}
function seedBarrels(){
  const offset=Math.min(110,W*.27);
  barrels=[{x:offset,y:0,r:17,spent:false},{x:offset+80,y:35,r:17,spent:false},{x:-offset,y:-90,r:17,spent:false}];
  // Starting barrels get open ground, so a decorative building cannot conceal the tutorial.
  obstacles=obstacles.filter(o=>!barrels.some(b=>b.x>o.x-35&&b.x<o.x+o.w+35&&b.y>o.y-35&&b.y<o.y+o.h+35));
}
function segmentDistance(point,a,b){
  const dx=b.x-a.x,dy=b.y-a.y,length=dx*dx+dy*dy;
  const t=length?clamp(((point.x-a.x)*dx+(point.y-a.y)*dy)/length,0,1):0;
  return Math.hypot(point.x-a.x-t*dx,point.y-a.y-t*dy);
}
function detonateBarrel(first){
  if(first.spent)return;
  const radius=fuelRadius(),queue=[first];let count=0,killsBefore=killCount;
  while(queue.length){
    const b=queue.shift();if(b.spent)continue;b.spent=true;count++;barrelsBlown++;
    blastRings.push({x:b.x,y:b.y,life:.45,max:.45,radius});burst(b.x,b.y,'#ffbd69',22);
    for(const e of enemies){
      if(e.hp>0&&dist(e,b)<=radius+e.r){
        hitEnemy(e,120*(1+elapsed/200),'BLAST');
        if(e.hp>0&&!e.convoy){const d=dist(e,b)||1;e.x+=(e.x-b.x)/d*30;e.y+=(e.y-b.y)/d*30}
      }
    }
    for(const barrier of barricades)if(barrier.hp>0&&pointRectDistance(b,barrier)<=radius)damageBarricade(barrier,120*(1+elapsed/200),'barrel');
    for(const other of barrels)if(!other.spent&&dist(other,b)<=radius+other.r)queue.push(other);
  }
  const kills=killCount-killsBefore;blastKills+=kills;shake=Math.max(shake,8);
  floatText(first.x,first.y-30,count>1?'CHAIN REACTION ×'+count:'FUEL BLAST','#ffd09a');
  if(kills&&elapsed>=reliefUntil)toast(`${count>1?'CHAIN BLAST':'FUEL BLAST'} • ${kills} ELIMINATED`);
  sound(75,.25,'sawtooth',.045);
}
function updateBarrels(dt,from,wasDashing){
  for(let i=blastRings.length-1;i>=0;i--){blastRings[i].life-=dt;if(blastRings[i].life<=0)blastRings.splice(i,1)}
  if(wasDashing)for(const b of barrels)if(!b.spent&&segmentDistance(b,from,p)<=b.r+p.r)detonateBarrel(b);
  barrels=barrels.filter(b=>!b.spent&&dist(b,p)<Math.max(W,H)+650);
  barrelClock-=dt;
  if(barrelClock<=0){
    barrelClock=12;
    if(barrels.length<6){
      for(let attempt=0;attempt<12;attempt++){
        const angle=rand(0,Math.PI*2),radius=rand(180,Math.max(220,Math.min(W,H)*.65));
        const b={x:p.x+Math.cos(angle)*radius,y:p.y+Math.sin(angle)*radius,r:17,spent:false};
        const blocked=obstacles.some(o=>b.x>o.x-35&&b.x<o.x+o.w+35&&b.y>o.y-35&&b.y<o.y+o.h+35);
        if(!blocked&&!nearBarricade(b,35)&&!nearDrop(b,b.r+20)&&!nearConvoyRoute(b,b.r+20)&&barrels.every(other=>dist(other,b)>65)){barrels.push(b);break}
      }
    }
  }
}
function renderFuel(left,top){
  const radius=fuelRadius();
  for(const b of barrels){
    if(b.x<left-radius||b.x>left+W+radius||b.y<top-radius||b.y>top+H+radius)continue;
    if(dist(b,p)<240){
      g.strokeStyle='#ffb55c30';g.lineWidth=2;g.setLineDash([5,9]);g.beginPath();g.arc(b.x,b.y,radius,0,Math.PI*2);g.stroke();g.setLineDash([]);
    }
    if(drawFieldDrum(b)){g.textAlign='center'}else{
    g.fillStyle='#0007';g.beginPath();g.ellipse(b.x+4,b.y+16,21,9,0,0,Math.PI*2);g.fill();
    g.fillStyle='#f0a550';g.fillRect(b.x-14,b.y-18,28,34);
    g.fillStyle='#5c392b';g.fillRect(b.x-15,b.y-13,30,4);g.fillRect(b.x-15,b.y+8,30,4);
    g.fillStyle='#ffd092';g.beginPath();g.ellipse(b.x,b.y-18,14,5,0,0,Math.PI*2);g.fill();
    g.fillStyle='#342e2b';g.font='bold 17px system-ui';g.textAlign='center';g.fillText('!',b.x,b.y+6);
    }
    if(dist(b,p)<240){g.fillStyle='#ffcf8c';g.font='bold 10px system-ui';g.fillText('DASH',b.x,b.y-31)}
  }
}
function renderBlasts(){
  for(const b of blastRings){
    const progress=1-b.life/b.max,radius=18+((b.radius||FUEL_RADIUS)-18)*progress;
    g.globalAlpha=1-progress;g.fillStyle=b.color?'#65ffbc22':'#ffaf4c33';g.strokeStyle=b.color||'#ffe2a3';g.lineWidth=5*(1-progress)+1;
    g.beginPath();g.arc(b.x,b.y,radius,0,Math.PI*2);g.fill();g.stroke();
  }
  g.globalAlpha=1;
}
// One temporary medical cache at a time; schedule and lifetime use gameplay time.
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
const DROP_TUNING=Object.freeze({first:70,interval:100,signal:4,lifetime:22,radius:21,sweep:500,retry:5});
function nearDrop(a,padding=0){return !!supplyDrop&&dist(a,supplyDrop)<supplyDrop.r+padding}
function placeDrop(){
  if(supplyDrop)return false;
  const r=DROP_TUNING.radius,facing=Math.atan2(lastMove.y,lastMove.x);let fallback=null;
  for(let i=0;i<72;i++){
    const angle=facing+(i%24)*2.3999632297,d=140+Math.floor(i/24)*25;
    const b={x:p.x+Math.cos(angle)*d,y:p.y+Math.sin(angle)*d,r,phase:'signal',readyAt:elapsed+DROP_TUNING.signal,until:elapsed+DROP_TUNING.signal+DROP_TUNING.lifetime};
    if(Math.abs(b.x-p.x)>W/2-r-18||Math.abs(b.y-p.y)>H/2-r-30||nearBarricade(b,r+20)||barrels.some(a=>!a.spent&&dist(a,b)<r+a.r+25)||supplyCache&&dist(supplyCache,b)<r+supplyCache.r+20||salvage&&dist(salvage,b)<r+salvage.r+20||rescue&&dist(rescue,b)<r+rescue.r+25||exitBeacon&&dist(exitBeacon,b)<r+exitBeacon.r+30)continue;
    const overlaps=o=>b.x>o.x-r-20&&b.x<o.x+o.w+r+20&&b.y>o.y-r-20&&b.y<o.y+o.h+r+20;
    if(!obstacles.some(overlaps)){supplyDrop=b;return true}if(!fallback)fallback={b,overlaps};
  }
  if(fallback){obstacles=obstacles.filter(o=>!fallback.overlaps(o));supplyDrop=fallback.b;return true}return false;
}
function placeLocker(){
 let fallback=null;
 for(let i=0;i<72;i++){const angle=Math.atan2(lastMove.y,lastMove.x)+i*2.3999632297,d=165+Math.floor(i/24)*30,b={x:p.x+Math.cos(angle)*d,y:p.y+Math.sin(angle)*d,r:22};
  if(Math.abs(b.x-p.x)>W/2-36||Math.abs(b.y-p.y)>H/2-45||nearBarricade(b,45)||barrels.some(a=>dist(a,b)<65)||shockDrums.some(a=>dist(a,b)<65)||objectiveTargets().some(a=>dist(a,b)<(a.r||20)+60))continue;
  if(!fallback)fallback=b;if(obstacles.some(o=>pointRectDistance(b,o)<50))continue;locker=b;return true;
 }
 if(fallback){obstacles=obstacles.filter(o=>pointRectDistance(fallback,o)>=50);locker=fallback;return true}return false;
}
function updateLocker(){
 if(mode!=='play'||training||p.hp<=0||lockerOffered||!bossesDefeated)return;
 if(activeBoss||bossWarned||rushPhase==='active'||rushPhase==='warning'||elapsed<reliefUntil||salvage||convoy||supplyDrop||exitBeacon)return;
 if(placeLocker()){lockerOffered=true;toast('FIELD LOCKER · PAUSE NEARBY FOR A TOOL CHOICE',2800)}
}
function nearLocker(){return !!(locker&&dist(p,locker)<=80)}
function lockerPauseControl(){return !training&&nearLocker()?'<p><button class="btn secondary" id="pauseLocker">OPEN FIELD LOCKER</button></p>':''}
function showLocker(){
 if(mode!=='paused'||training||p.hp<=0||!nearLocker())return;mode='locker';
 show(`<div class="eyebrow">ONE FIELD RESUPPLY PER RUN</div><h1 style="font-size:44px">FIELD LOCKER</h1><p>Choose one tool. No health, damage, XP or enemy changes. The locker is consumed only when you take a tool.</p><div class="cards two"><button class="choice" id="locker-reroll" ${rerollsLeft>=2?'disabled':''}><b>ONE REROLL</b><span>${rerollsLeft}/2 carried · take one if below capacity</span></button><button class="choice" id="locker-decoy" ${decoyCharges>=2?'disabled':''}><b>ONE DECOY</b><span>${decoyCharges}/2 carried · take one if below capacity</span></button></div><button class="btn secondary" id="lockerBack">BACK TO PAUSE</button>`);
 for(const kind of ['reroll','decoy'])bindUpgradePress(document.getElementById('locker-'+kind),()=>takeLocker(kind),()=>mode==='locker');bindPress(document.getElementById('lockerBack'),()=>{if(mode==='locker'){mode='play';pause()}});
}
function takeLocker(kind){
 if(mode!=='locker'||document.hidden||p.hp<=0||!nearLocker()||kind==='reroll'&&rerollsLeft>=2||kind==='decoy'&&decoyCharges>=2||!['reroll','decoy'].includes(kind))return;
 if(kind==='reroll')rerollsLeft++;else decoyCharges++;locker=null;lockersUsed=1;mode='play';recordRunEvent('locker');checkContract();pause();
}
function renderLocker(){if(!locker)return;g.save();if(!drawFieldCase(locker,'locker')){g.fillStyle='#b8e1ce';g.strokeStyle='#324e45';g.lineWidth=3;g.fillRect(locker.x-20,locker.y-18,40,36);g.strokeRect(locker.x-20,locker.y-18,40,36);g.beginPath();g.moveTo(locker.x,locker.y-17);g.lineTo(locker.x,locker.y+17);g.stroke();}g.fillStyle='#c9f9df';g.font='bold 10px system-ui';g.textAlign='center';g.fillText('FIELD LOCKER',locker.x,locker.y-28);g.restore()}
function dropSweepRadius(){return runSurvivor==='scavenger'?650:DROP_TUNING.sweep}
function updateDrops(dt,from){
  if(mode!=='play'||p.hp<=0)return;
  if(supplyDrop&&(elapsed>=supplyDrop.until||dist(supplyDrop,p)>1200||exitBeacon&&dist(supplyDrop,exitBeacon)<supplyDrop.r+exitBeacon.r+20))supplyDrop=null;
  if(supplyDrop){
    const b=supplyDrop;
    if(b.phase==='signal'&&elapsed>=b.readyAt){b.phase='ready';toast('SUPPLY DOWN • XP SWEEP + DASH REFRESH',2300);sound(430,.13,'triangle',.025)}
    // Only the part of a dash after touchdown can collect the crate.
    const t=dt>0?clamp((b.readyAt-(elapsed-dt))/dt,0,1):0,collectFrom={x:from.x+(p.x-from.x)*t,y:from.y+(p.y-from.y)*t};
    if(b.phase==='ready'&&segmentDistance(b,collectFrom,p)<=b.r+p.r){
      supplyDrop=null;let recovered=0;
      for(let i=gems.length-1;i>=0;i--)if(dist(gems[i],p)<=dropSweepRadius()){recovered+=gems[i].value;gems.splice(i,1)}
      recordCollectedXp(recovered);xp+=recovered;dropXpRecovered+=recovered;dropsCollected++;recordRunEvent('drop');p.dashCd=0;
      floatText(b.x,b.y-35,`XP SWEEP +${recovered} • DASH READY`,'#d5b6ff');burst(b.x,b.y,'#c49bff',14);sound(590,.15,'sine',.03);toast(`SUPPLY COLLECTED • +${recovered} EARNED XP • DASH READY`,2400);
    }
  }
  if(supplyDrop||elapsed<nextDropAt)return;
  if(convoy||activeBoss||bossWarned||rushPhase==='active'||rushPhase==='warning'||elapsed<reliefUntil||salvage||exitBeacon)return;
  const placed=placeDrop();nextDropAt=elapsed+(placed?DROP_TUNING.interval:DROP_TUNING.retry);
  if(placed)toast('SUPPLY SIGNAL • PURPLE MARKER • LANDING IN 4s',2500);
}
function dropHUD(){
  const b=supplyDrop;document.getElementById('dropGoal').textContent=b?`DROP ${bossBearing(b)} • ${b.phase==='signal'?'LANDING IN '+Math.max(0,Math.ceil(b.readyAt-elapsed))+'s':Math.max(0,Math.ceil(b.until-elapsed))+'s • XP SWEEP + DASH READY'}`:'';
}
function renderDrop(){
  if(!supplyDrop)return;const b=supplyDrop;g.save();g.textAlign='center';g.lineWidth=2;g.strokeStyle='#c49bff';g.fillStyle='#c49bff18';
  g.beginPath();g.arc(b.x,b.y,b.r+7+Math.sin(elapsed*4)*2,0,Math.PI*2);g.fill();g.stroke();
  if(b.phase==='signal'){
    g.setLineDash([5,6]);g.beginPath();g.moveTo(b.x,b.y-65);g.lineTo(b.x,b.y+26);g.moveTo(b.x-26,b.y);g.lineTo(b.x+26,b.y);g.stroke();g.setLineDash([]);
    g.fillStyle='#e3ceff';g.font='bold 10px system-ui';g.fillText('SUPPLY IN '+Math.max(0,Math.ceil(b.readyAt-elapsed))+'s',b.x,b.y-38);
  }else{
    if(drawFieldCase(b,'drop')){g.fillStyle='#bfa1e5'}else{
    g.fillStyle='#44345d';g.fillRect(b.x-18,b.y-15,36,30);g.strokeStyle='#d5b6ff';g.strokeRect(b.x-18,b.y-15,36,30);g.fillStyle='#bfa1e5';g.fillRect(b.x-12,b.y-15,4,30);g.fillRect(b.x+8,b.y-15,4,30);g.strokeStyle='#ffe1a3';g.beginPath();g.moveTo(b.x-5,b.y-4);g.lineTo(b.x,b.y+4);g.lineTo(b.x+5,b.y-4);g.stroke();
    }
    g.font='bold 10px system-ui';g.fillText('XP SWEEP • DASH',b.x,b.y-34);
  }
  g.restore();
}
// Small pressure increase after owner found Alpha 0.4's boss a little easy.
const BREAKER_TUNING=Object.freeze({windup:.8,chargeTime:.44,recovery:1.1,approach:1.8});
const WARDEN_TUNING=Object.freeze({windup:1.1,recovery:1.6,approach:.8,shotSpeed:200,shotLife:2.8,shotDamage:12,spread:Object.freeze([-.9,-.45,0,.45,.9])});
function nextBossKind(){return ['breaker','warden','harvester'][bossesDefeated%3]}
function bossName(e){const kind=e?e.bossKind:nextBossKind();return kind==='harvester'?'HARVESTER':kind==='warden'?'WARDEN':'BREAKER'}
// The first milestone is the original Breaker; later defeats cycle through Warden and Harvester.
function spawnBoss(kind=nextBossKind()){
  if(activeBoss)return;
  if(!['breaker','warden','harvester'].includes(kind))kind='breaker';
  scheduleRush(Infinity);
  const warden=kind==='warden',angle=rand(0,Math.PI*2),radius=Math.min(W,H)*.5+95,hp=(kind==='harvester'?750:warden?700:650)*(1+bossesDefeated*.4);
  activeBoss={x:p.x+Math.cos(angle)*radius,y:p.y+Math.sin(angle)*radius,hp,max:hp,speed:kind==='harvester'?90:warden?72:78,r:ENEMY_ART[kind].r,dmg:kind==='harvester'?26:warden?25:30,col:ENEMY_ART[kind].col,hit:0,type:3,bossKind:kind,phase:'approach',phaseTime:2.8,chargeX:0,chargeY:1,chargeLength:0,aimAngle:0};
  enemies.push(activeBoss);recordRunEvent(kind+'-arrived');toast(kind==='harvester'?'THE HARVESTER • LEAVE THE GREEN PULSE CIRCLE':warden?'THE WARDEN • DODGE BETWEEN BLUE LANES':'THE BREAKER • DODGE THE ORANGE CHARGE LANE',3500);sound(65,.35,'sawtooth',.045,'alerts');
}
function updateEncounter(){
  if(activeBoss)return;
  if(!bossWarned&&elapsed>=nextBossAt-10){bossWarned=true;toast(`${bossName()} IN 10 SECONDS • SAVE A BARREL`,3000);sound(140,.2,'triangle',.035,'alerts')}
  if(elapsed>=nextBossAt)spawnBoss();
}
function defeatBoss(boss){
  if(boss!==activeBoss)return;
  const label=bossName(boss);recordRunEvent(boss.bossKind+'-down');if(boss.bossKind==='warden')wardensDefeated++;if(boss.bossKind==='harvester')harvestersDefeated++;
  hostileShots=hostileShots.filter(b=>b.source!==boss);
  activeBoss=null;bossesDefeated++;nextBossAt=elapsed+90;bossWarned=false;reliefUntil=elapsed+8;reliefLabel=label+' DOWN';scheduleRush(elapsed+35);
  const heal=Math.min(25,p.max-p.hp);p.hp+=heal;
  toast(`${label} DOWN • +${Math.ceil(heal)} HP • 8s SPAWN BREAK`,3500);sound(540,.25,'sine',.045,'alerts');
  floatText(boss.x,boss.y-50,label+' DOWN','#ffe4a0');
}
function moveWarden(e,dt){
  const visible=rangedEnemyVisible(e),range=clamp(Math.min(W,H)*.38,135,250);
  if(e.phase==='approach'){
    if(dist(e,p)>range||!visible){const a=Math.atan2(p.y-e.y,p.x-e.x);e.x+=Math.cos(a)*e.speed*dt;e.y+=Math.sin(a)*e.speed*dt}
    e.phaseTime-=dt;
    if(e.phaseTime<=0&&rangedEnemyVisible(e)&&dist(e,p)<=range+25){e.aimAngle=Math.atan2(p.y-e.y,p.x-e.x);e.phase='warn';e.phaseTime=WARDEN_TUNING.windup}
  }else if(e.phase==='warn'){
    if(!visible){e.phase='approach';e.phaseTime=WARDEN_TUNING.approach;return}
    e.phaseTime-=dt;
    if(e.phaseTime<=0){
      if(hostileShots.length+WARDEN_TUNING.spread.length<=FX_LIMITS.hostileShots){
        for(const offset of WARDEN_TUNING.spread){const a=e.aimAngle+offset,x=Math.cos(a),y=Math.sin(a);hostileShots.push({x:e.x+x*(e.r+9),y:e.y+y*(e.r+9),vx:x*WARDEN_TUNING.shotSpeed,vy:y*WARDEN_TUNING.shotSpeed,r:7,life:WARDEN_TUNING.shotLife,dmg:WARDEN_TUNING.shotDamage,kind:'warden',source:e})}
        sound(175,.16,'triangle',.03,'alerts');
      }
      e.phase='recover';e.phaseTime=WARDEN_TUNING.recovery;
    }
  }else if(e.phase==='recover'){
    e.phaseTime-=dt;if(e.phaseTime<=0){e.phase='approach';e.phaseTime=WARDEN_TUNING.approach}
  }
}
const HARVESTER_TUNING=Object.freeze({windup:1.35,recovery:1.4,approach:2.4,radius:135,damage:16});
function moveHarvester(e,dt){
 if(mode!=='play'||e.hp<=0)return;
 if(e.phase==='approach'){const a=Math.atan2(p.y-e.y,p.x-e.x);if(dist(e,p)>105){e.x+=Math.cos(a)*e.speed*dt;e.y+=Math.sin(a)*e.speed*dt}e.phaseTime-=dt;if(e.phaseTime<=0&&rangedEnemyVisible(e)&&dist(e,p)<180){e.phase='warn';e.phaseTime=HARVESTER_TUNING.windup;e.pulseX=e.x;e.pulseY=e.y}}
 else if(e.phase==='warn'){e.phaseTime-=dt;if(e.phaseTime<=1e-8){e.phase='recover';e.phaseTime=HARVESTER_TUNING.recovery;blastRings.push({x:e.pulseX,y:e.pulseY,life:.4,max:.4,radius:HARVESTER_TUNING.radius,color:'#b0ffd3'});sound(120,.18,'triangle',.025,'alerts');if(Math.hypot(p.x-e.pulseX,p.y-e.pulseY)<=HARVESTER_TUNING.radius+p.r)hurtPlayer(HARVESTER_TUNING.damage,'harvester-pulse')}}
 else if(e.phase==='recover'){e.phaseTime-=dt;if(e.phaseTime<=0){e.phase='approach';e.phaseTime=HARVESTER_TUNING.approach}}
}
function renderHarvester(e,ctx=g){ctx.save();ctx.strokeStyle='#dbffe1';ctx.lineWidth=4;for(let i=0;i<3;i++){const a=i*Math.PI*2/3;ctx.beginPath();ctx.moveTo(e.x+Math.cos(a)*(e.r-8),e.y+Math.sin(a)*(e.r-8));ctx.lineTo(e.x+Math.cos(a)*(e.r+11),e.y+Math.sin(a)*(e.r+11));ctx.stroke()}ctx.restore()}
function moveBoss(e,dt){
  if(e.bossKind==='harvester'){moveHarvester(e,dt);return}
  if(e.bossKind==='warden'){moveWarden(e,dt);return}
  if(e.phase==='approach'){
    const target=streetSession?streetSteering(e):p,angle=Math.atan2(target.y-e.y,target.x-e.x);e.x+=Math.cos(angle)*e.speed*dt;e.y+=Math.sin(angle)*e.speed*dt;e.phaseTime-=dt;
    if(e.phaseTime<=0&&dist(e,p)<420){
      const aim=Math.atan2(p.y-e.y,p.x-e.x);e.chargeX=Math.cos(aim);e.chargeY=Math.sin(aim);e.chargeLength=clamp(dist(e,p)+90,180,360);e.phase='warn';e.phaseTime=BREAKER_TUNING.windup;if(sampleLookActive())playStyleAudio('warning');
    }
  }else if(e.phase==='warn'){
    e.phaseTime-=dt;if(e.phaseTime<=0){e.phase='charge';e.phaseTime=BREAKER_TUNING.chargeTime;sound(110,.12,'sawtooth',.025,'alerts')}
  }else if(e.phase==='charge'){
    const step=Math.min(dt,e.phaseTime)*e.chargeLength/BREAKER_TUNING.chargeTime;e.x+=e.chargeX*step;e.y+=e.chargeY*step;e.phaseTime=Math.max(0,e.phaseTime-dt);
    if(e.phaseTime<=0){e.phase='recover';e.phaseTime=BREAKER_TUNING.recovery}
  }else if(e.phase==='recover'){
    e.phaseTime-=dt;if(e.phaseTime<=0){e.phase='approach';e.phaseTime=BREAKER_TUNING.approach}
  }
}
function bossBearing(e){
  const arrows=['→','↘','↓','↙','←','↖','↑','↗'];return arrows[(Math.round(Math.atan2(e.y-p.y,e.x-p.x)/(Math.PI/4))+8)%8];
}
const RESCUE_TUNING=Object.freeze({first:120,afterStay:20,radius:13,recruitRange:48,regroup:4,relocate:900});
function rescueSpot(distance=150){
  const r=RESCUE_TUNING.radius,facing=Math.atan2(lastMove.y,lastMove.x);
  let fallback=null;
  for(let i=0;i<64;i++){
    const angle=facing+i*2.3999632297,d=distance+(i%3)*15,b={x:p.x+Math.cos(angle)*d,y:p.y+Math.sin(angle)*d,r,following:false,regroupReadyAt:0};
    if(Math.abs(b.x-p.x)>W/2-r-18||Math.abs(b.y-p.y)>H/2-r-30||nearBarricade(b,r+12)||nearDrop(b,r+15)||barrels.some(a=>!a.spent&&dist(a,b)<r+a.r+20)||supplyCache&&dist(supplyCache,b)<r+supplyCache.r+15||salvage&&dist(salvage,b)<r+salvage.r+15||exitBeacon&&dist(exitBeacon,b)<r+exitBeacon.r+35)continue;
    const overlaps=o=>b.x>o.x-r-15&&b.x<o.x+o.w+r+15&&b.y>o.y-r-15&&b.y<o.y+o.h+r+15;
    if(!obstacles.some(overlaps))return b;if(!fallback)fallback={b,overlaps};
  }
  if(fallback){obstacles=obstacles.filter(o=>!fallback.overlaps(o));return fallback.b}return null;
}
function updateRescueAvailability(){
  if(mode!=='play'||p.hp<=0||elapsed<nextRescueAt)return;
  if(convoy||activeBoss||bossWarned||rushPhase==='active'||rushPhase==='warning'||elapsed<reliefUntil||salvage)return;
  if(rescue&&(rescue.following||dist(rescue,p)<=RESCUE_TUNING.relocate))return;
  if(!rescue&&rescueOffered)return;
  nextRescueAt=elapsed+5;const spot=rescueSpot();if(!spot)return;
  rescue=spot;rescueOffered=true;toast('SURVIVOR SIGNAL • APPROACH WHITE MARKER • ESCORT TO GREEN',3500);
}
function rescueHUD(){
  const line=document.getElementById('rescueGoal'),button=document.getElementById('regroup');
  line.textContent=rescue?rescue.following?`RESCUE ${bossBearing(rescue)} • ${dist(rescue,p)>120?'REGROUP TO CATCH UP':exitBeacon?'ESCORT TO GREEN':'FOLLOWING · EXIT AT '+fmt(exitAt)}`:`SURVIVOR ${bossBearing(rescue)} • APPROACH TO RECRUIT`:'';
  const available=mode==='play'&&!!(rescue&&rescue.following),ready=available&&elapsed>=rescue.regroupReadyAt;
  button.style.display=available?'block':'none';button.textContent=ready?'REGROUP':available?`REGROUP ${Math.max(0,rescue.regroupReadyAt-elapsed).toFixed(1)}s`:'REGROUP';button.setAttribute('aria-disabled',String(!ready));
}
function regroupRescue(){
  if(mode!=='play'||p.hp<=0||!rescue||!rescue.following||elapsed<rescue.regroupReadyAt)return false;
  let spot=null;
  for(let i=0;i<24;i++){
    const a=Math.atan2(lastMove.y,lastMove.x)+Math.PI+i*2.3999632297,b={x:p.x+Math.cos(a)*45,y:p.y+Math.sin(a)*45};
    if(!nearBarricade(b,rescue.r+3)){spot=b;break}
  }
  if(!spot&&!nearBarricade(p,rescue.r+2))spot={x:p.x,y:p.y};if(!spot)return false;
  rescue.x=spot.x;rescue.y=spot.y;rescue.regroupReadyAt=elapsed+RESCUE_TUNING.regroup;
  burst(rescue.x,rescue.y,'#e9ffff',6);toast('SURVIVOR REGROUPED • HEAD FOR GREEN',1500);updateHUD();return true;
}
function updateRescue(dt,from){
  if(mode!=='play'||p.hp<=0)return;updateRescueAvailability();if(!rescue)return;
  if(!rescue.following&&segmentDistance(rescue,from,p)<=RESCUE_TUNING.recruitRange){rescue.following=true;toast('SURVIVOR FOLLOWING • ESCORT TO GREEN • REGROUP IF SEPARATED',3000);sound(510,.12,'sine',.03)}
  if(!rescue.following)return;
  const before={x:rescue.x,y:rescue.y},d=dist(rescue,p),speed=Math.max(245,p.speed*(d>120?4:1.15)),step=Math.min(Math.max(0,d-42),speed*dt);
  if(d>0){rescue.x+=(p.x-rescue.x)*step/d;rescue.y+=(p.y-rescue.y)*step/d}resolveBarricadeBody(rescue,before);
  if(!exitBeacon)return;
  const playerArrives=segmentDistance(exitBeacon,from,p)<=exitBeacon.r+p.r;
  if(!playerArrives&&segmentDistance(exitBeacon,before,rescue)>exitBeacon.r+rescue.r)return;
  // Recruited survivors board together on player arrival, even if cover separated the party.
  if(playerArrives)rescueArrival={from:{x:from.x,y:from.y},beacon:exitBeacon};
  rescue=null;rescuesCompleted++;recordRunEvent('rescue');bonusChoices++;bonusKinds.push('rescue');nextRescueAt=Infinity;
  toast('SURVIVOR SAFE • BONUS UPGRADE',2500);sound(660,.18,'sine',.03);
}
function finishRescueArrival(){
  if(mode!=='play'||!rescueArrival)return;
  const arrival=rescueArrival;rescueArrival=null;if(exitBeacon===arrival.beacon)updateExtractionArrival(arrival.from);
}
function renderRescue(){
  if(!rescue)return;const b=rescue;g.save();
  if(b.following){g.strokeStyle='#c8ffff55';g.lineWidth=1;g.setLineDash([4,7]);g.beginPath();g.moveTo(b.x,b.y);g.lineTo(p.x,p.y);g.stroke();g.setLineDash([])}
  g.fillStyle='#e9ffff';g.strokeStyle='#719bad';g.lineWidth=2;g.beginPath();g.arc(b.x,b.y,b.r,0,Math.PI*2);g.fill();g.stroke();
  g.fillStyle='#355466';g.fillRect(b.x-5,b.y-3,3,3);g.fillRect(b.x+3,b.y-3,3,3);g.fillStyle='#a7ffda';g.fillRect(b.x-4,b.y+5,8,4);
  g.strokeStyle='#d7ffff88';g.lineWidth=1;g.beginPath();g.arc(b.x,b.y,b.r+8+Math.sin(elapsed*3)*2,0,Math.PI*2);g.stroke();
  g.font='bold 10px system-ui';g.textAlign='center';g.fillStyle='#e9ffff';g.fillText(b.following?'FOLLOWING · TO GREEN':'SURVIVOR · APPROACH',b.x,b.y-30);g.restore();
}
function updateContractHUD(){
  const goal=contractById(runContract);
  document.getElementById('contractGoal').textContent=goal?`CONTRACT ${contractCompleted?'✓':'•'} ${goal.short} ${contractProgress()}/${goal.target}${contractCompleted?' DONE':''}`:'';
}
function updateEncounterHUD(){
  updateContractHUD();rescueHUD();dropHUD();
  const box=document.getElementById('encounter'),label=document.getElementById('objective'),meter=document.getElementById('bossMeter');
  box.style.visibility=mode==='menu'||mode==='end'?'hidden':'visible';meter.hidden=!activeBoss;
  if(training){meter.hidden=!activeBoss;label.textContent=activeBoss?(bossLab?'BOSS TEST · ':streetSession?'INTERSECTION · ':'TRAINING · ')+bossName(activeBoss)+' · '+activeBoss.phase.toUpperCase():bossLab?(developerSpecialist()?(trainingScenario==='riot'?'GUARD':developerTargetName())+' TEST · '+(enemies.find(e=>e.trainingSpecialist&&e.hp>0)?.phase?.toUpperCase()||(trainingScenario==='hunter'&&enemies.some(e=>e.trainingSpecialist&&e.hp>0)?'PURSUING':'RESPAWNING')):'BOSS TEST · RESPAWNING'):'TRAINING RANGE · UNSCORED';if(activeBoss)document.getElementById('bossFill').style.width=`${clamp(100*activeBoss.hp/activeBoss.max,0,100)}%`;for(const id of ['runGoal','supplyGoal','salvageGoal','contractGoal','rescueGoal','dropGoal','medalGoal'])document.getElementById(id).textContent='';const stats=practiceSnapshot();document.getElementById('runGoal').textContent=`PRACTICE · ${Number(stats.damage.toFixed(1))} HP · ${stats.targets} targets · ${Number(stats.average.toFixed(1))} avg HP/s · ${stats.threats} would-be hits`;if(bossLab)document.getElementById('runGoal').textContent=`DEVELOPER · UNSCORED · HP SAFE · ATTACKS ${bossLabFire?'ON':'OFF'} · ${stats.targets} ${trainingScenario==='riot'?'guards':trainingScenario==='spitter'?'spitters':trainingScenario==='howler'?'targets':trainingScenario==='lobber'?'lobbers':trainingScenario==='hunter'?'hunters':'bosses'} defeated · ${stats.threats} would-be hits`;return}
  if(activeBoss){
    label.textContent=`${bossName(activeBoss)} ${bossBearing(activeBoss)} • ${activeBoss.phase==='warn'?(activeBoss.bossKind==='harvester'?'LEAVE PULSE CIRCLE':activeBoss.bossKind==='warden'?'DODGE BLUE LANES':'DODGE THE LINE'):activeBoss.phase==='recover'?'RECOVERING — ATTACK!':'DEFEAT THE '+bossName(activeBoss)}`;
    box.style.color=activeBoss.bossKind==='warden'?'#c0e7ff':activeBoss.phase==='warn'?'#ffd08b':'#ffb4c0';
    document.getElementById('bossFill').style.background=activeBoss.bossKind==='warden'?'linear-gradient(90deg,#6aa7ef,#c0f2ff)':'linear-gradient(90deg,#ef6882,#ffc387)';
    document.getElementById('bossFill').style.width=`${clamp(100*activeBoss.hp/activeBoss.max,0,100)}%`;
  }else if(rushPhase==='active'){
    label.textContent=`BLACKOUT RUSH ${Math.max(0,Math.ceil(rushUntil-elapsed))}s • SURVIVE ${rushAxis==='horizontal'?'↔':'↕'}`;box.style.color='#d4c2ff';
  }else if(rushPhase==='warning'){
    label.textContent=`BLACKOUT IN ${Math.max(0,Math.ceil(nextRushAt-elapsed))}s • HUNTERS ${rushAxis==='horizontal'?'↔':'↕'}`;box.style.color='#d4c2ff';
  }else if(convoy&&!bossWarned&&!exitBeacon){
    label.textContent=convoy.phase==='signal'?`CONVOY ${bossBearing(convoy)} IN ${Math.max(0,Math.ceil(convoy.readyAt-elapsed))}s • OPTIONAL`:`CONVOY ${bossBearing(convoy)} • ${Math.ceil(convoy.hp)} HP • ${Math.max(0,Math.ceil(convoy.until-elapsed))}s • SHOOT FOR UPGRADE`;box.style.color='#9ee8f0';
  }else if(exitBeacon&&bossWarned){
    label.textContent=`${bossName()} IN ${Math.max(0,Math.ceil(nextBossAt-elapsed))}s • PREPARE`;box.style.color='#ffd08b';
  }else if(exitBeacon){
    label.textContent=`EXIT ${bossBearing(exitBeacon)} • REACH THE GREEN BEACON`;box.style.color='#a7ffda';
  }else{
    label.textContent=elapsed<reliefUntil?`${reliefLabel} • BREATHER ${Math.ceil(reliefUntil-elapsed)}s`:`BOSS ${bossesDefeated+1} IN ${fmt(Math.max(0,Math.ceil(nextBossAt-elapsed)))}${bossWarned?' • PREPARE':''} • ${bossName()}`;
    box.style.color=bossWarned?'#ffd08b':'#d0dce2';
  }
  const med=document.getElementById('supplyGoal');med.textContent=supplyCache?`MED ${bossBearing(supplyCache)} • ${Math.max(0,Math.ceil(supplyCache.until-elapsed))}s • ${p.hp>=p.max?'FULL HP':`UP TO +${SUPPLY_TUNING.heal} HP`}`:'';
  const salvageLine=document.getElementById('salvageGoal');salvageLine.textContent=salvage?`SALVAGE ${bossBearing(salvage)} • ${salvage.progress.toFixed(1)}/${SALVAGE_TUNING.hold}s • ${Math.max(0,Math.ceil(salvage.until-elapsed))}s LEFT • ${salvageStatus()}`:salvageWaitingStatus();
  const goal=document.getElementById('runGoal');
  if(exitBeacon)goal.textContent=activeBoss||bossWarned||rushPhase==='active'||rushPhase==='warning'?`EXIT ${bossBearing(exitBeacon)} • REACH GREEN BEACON`:'EXTRACT = VICTORY · STAY = OVERTIME';
  else if(elapsed>=exitAt)goal.textContent=bossesDefeated<1?'EXIT LOCKED • DEFEAT A BREAKER':'EXIT READY • FINISH THIS ENCOUNTER';
  else goal.textContent=`${overtime?'NEXT EXIT':'EXIT'} IN ${fmt(Math.max(0,Math.ceil(exitAt-elapsed)))} • ${overtime?'OVERTIME '+overtime:bossesDefeated?'BREAKER ✓':'DEFEAT A BREAKER'}`;
}
function renderBossWarning(){
  const e=activeBoss;if(!e||e.phase!=='warn')return;
  if(e.bossKind==='harvester'){g.save();g.fillStyle='#9bffbf1e';g.strokeStyle='#b7ffd0';g.lineWidth=3;g.setLineDash([8,7]);g.beginPath();g.arc(e.pulseX,e.pulseY,HARVESTER_TUNING.radius,0,Math.PI*2);g.fill();g.stroke();g.setLineDash([]);g.fillStyle='#d7ffe1';g.font='bold 11px system-ui';g.textAlign='center';g.fillText('LEAVE PULSE CIRCLE',e.pulseX,e.pulseY-HARVESTER_TUNING.radius-12);g.restore();return}
  if(e.bossKind==='warden'){g.save();g.lineWidth=2;g.strokeStyle='#9edaff';g.setLineDash([8,7]);for(const offset of WARDEN_TUNING.spread){const a=e.aimAngle+offset;g.beginPath();g.moveTo(e.x,e.y);g.lineTo(e.x+Math.cos(a)*WARDEN_TUNING.shotSpeed*WARDEN_TUNING.shotLife,e.y+Math.sin(a)*WARDEN_TUNING.shotSpeed*WARDEN_TUNING.shotLife);g.stroke()}g.restore();return}
  const endX=e.x+e.chargeX*e.chargeLength,endY=e.y+e.chargeY*e.chargeLength;
  g.lineCap='round';g.lineWidth=2*(e.r+p.r);g.strokeStyle='#ffad4840';g.beginPath();g.moveTo(e.x,e.y);g.lineTo(endX,endY);g.stroke();
  g.lineWidth=3;g.strokeStyle='#ffd394';g.setLineDash([9,7]);g.beginPath();g.moveTo(e.x,e.y);g.lineTo(endX,endY);g.stroke();g.setLineDash([]);g.lineCap='butt';
}
const RUN_MEDALS=Object.freeze([
  Object.freeze({name:'Made It Out',hint:'Extract successfully.',earned:r=>r.outcome==='extracted'}),
  Object.freeze({name:'Boss Hunter',hint:'Defeat 2 bosses in one run.',earned:r=>r.breakers+(r.wardens??0)+(r.harvesters??0)>=2}),
  Object.freeze({name:'Demolition',hint:'Detonate 5 fuel barrels in one run.',earned:r=>r.barrels>=5}),
  Object.freeze({name:'After Hours',hint:'Extract after at least 1 overtime push.',earned:r=>r.outcome==='extracted'&&r.overtime>=1}),
  Object.freeze({name:'Lifeline',hint:'Deliver 1 survivor to the green exit.',earned:r=>r.rescues>=1}),
  Object.freeze({name:'Crowd Control',hint:'Apply 20 stuns with shock drums in one run.',earned:r=>r.shockStuns>=20}),
  Object.freeze({name:'Arsenal',hint:'Evolve 2 different weapon paths in one run.',earned:r=>EVOLUTIONS.filter(e=>r[e.weapon]===3&&r[e.field]===true).length>=2}),
  Object.freeze({name:'Iron Escape',hint:'Extract under Iron Horde rules.',earned:r=>r.outcome==='extracted'&&r.rule==='iron'})
]);
function selectTrackedMedal(id){if(mode!=='paused'||id!=='off'&&!MEDAL_TRACKERS.some(m=>m.id===id))return;trackedMedal=id;document.getElementById('medalPick').value=id}
function medalTrackerPicker(){return `<div class="contract-picker"><label for="medalPick">OPTIONAL MEDAL TRACKER</label><select id="medalPick"><option value="off">Off · no extra HUD line</option>${MEDAL_TRACKERS.map(m=>`<option value="${m.id}">${m.name}</option>`).join('')}</select><p class="muted">Track one existing medal. No stat bonus or extra reward; resets to Off next run.</p></div>`}
function updateMedalTracker(){const line=document.getElementById('medalGoal'),goal=MEDAL_TRACKERS.find(m=>m.id===trackedMedal);line.textContent=mode==='play'&&goal?`MEDAL · ${goal.name} ${Math.min(goal.target,goal.value())}/${goal.target}${goal.value()>=goal.target?' · EARNED':goal.hint?' · '+goal.hint:''}`:''}
function earnedMedals(stats){return stats.training?[]:RUN_MEDALS.filter(m=>m.earned(stats))}
function medalGoals(){return RUN_MEDALS.map(m=>`<p><b>${m.name}</b> — ${m.hint}</p>`).join('')+'<p class="muted">Earned per run. Medals give no stat bonuses.</p>'}
function cleanDiscoveries(raw){return Array.isArray(raw)?ENEMY_GUIDE.filter(e=>raw.includes(e.id)).map(e=>e.id):null}
function currentDiscoveries(){return ENEMY_GUIDE.filter(e=>(enemyTally[e.id]||0)>0&&(journal.bestiary[e.id]||0)===0).map(e=>e.id)}
function discoveryPanel(ids){if(!ids?.length)return '';return `<div class="field-card"><h2>NEW FIELD NOTES</h2><p>First recorded defeats: ${ENEMY_GUIDE.filter(e=>ids.includes(e.id)).map(e=>e.name).join(' · ')}.</p><p class="muted">Recorded from completed runs. All Bestiary tactics remain available; this grants no upgrades.</p></div>`}
function currentRunStats(){
  return{...(mainPerfTest?{perfTest:mainPerfSnapshot()}:{}),...(bossLab&&training?{bossTest:bossTestSnapshot()}:{}),progression:buildProgressSnapshot(),pace:training?null:paceSnapshot(),bladeReach:p.bladeReach,arcRelay:p.arcRelay,lockers:lockersUsed,practice:training?practiceSnapshot():null,evasive:p.evasive,training,patrols:patrolVisited,harvesters:harvestersDefeated,steady:p.steady,steadyReady:p.steady&&p.stillTime>=.6,route:runRoute,timeline:Object.freeze(runTimeline.map(row=>Object.freeze({...row}))),timelineDropped,trackedMedal,newDiscoveries:Object.freeze(currentDiscoveries()),weapons:Object.freeze(Object.fromEntries(Object.entries(weaponLedger).map(([key,row])=>[key,Object.freeze({...row})]))),gunPriority:p.gunPriority,decoyPouch:p.decoyPouch,decoys:decoysUsed,decoyLured,shocks:shocksUsed,shockStuns,rule:runRule,damageTaken,hitsTaken,armorPrevented,lastThreat,armor:p.armor,capacitor:p.capacitor,secondWind:p.secondWind,windSpent:p.windSpent,enemyTally:Object.freeze({...enemyTally}),...currentContractStats(),survivor:runSurvivor,outcome:runOutcome,time:elapsed,kills:killCount,level,breakers:Math.max(0,bossesDefeated-wardensDefeated-harvestersDefeated),wardens:wardensDefeated,blackouts:rushesSurvived,overtime,barrels:barrelsBlown,barricades:barricadesCleared,blastKills,supplies:suppliesCollected,supplyHealing,spitters:spittersDefeated,riotGuards:riotsDefeated,rescues:rescuesCompleted,salvages:salvagesSecured,rail:p.rail,thunder:p.thunder,reaper:p.reaper,wildfire:p.wildfire,molotov:p.molotov,fireKills:burnKills,scrapRefreshes,scrapRecovered,convoys:convoysStopped,drops:dropsCollected,dropXp:dropXpRecovered,pierce:p.pierce,arc:p.arc,blades:p.blades,proj:p.proj,hp:p.hp,max:p.max,damage:p.damage,fire:p.fire,speed:p.speed,regen:p.regen,magnet:p.magnet,bulletSpeed:p.bulletSpeed};
}
function buildSummary(stats=p){
  return [`Gun ×${stats.proj}`,stats.pierce?(stats.rail&&stats.pierce===3?'Railstorm (EVOLVED)':`Pierce ${stats.pierce}/3`):'',stats.arc?(stats.thunder&&stats.arc===3?'Thunderweb (EVOLVED)':`Lightning ${stats.arc}/3`):'',stats.blades?(stats.reaper&&stats.blades===3?'Reaper Ring (EVOLVED)':`Blades ${stats.blades}/3`):'',stats.molotov?(stats.wildfire&&stats.molotov===3?'Wildfire (EVOLVED)':`Molotov ${stats.molotov}/3`):'',stats.secondWind?`Second Wind (${stats.windSpent?'spent':'ready'})`:'',stats.capacitor?`Dash Capacitor ${stats.capacitor}/2`:'',stats.armor?`Armor Plating ${stats.armor}/3`:'',stats.decoyPouch?'Decoy Pouch':'',stats.steady?'Steady Aim':'',stats.evasive?'Evasive Reload':'',stats.arcRelay?'Arc Relay':'',stats.bladeReach?'Blade Reach':''].filter(Boolean).join(' · ');
}
// Swept intersections stop fast or piercing shots from skipping targets, and order hits along the shot.
function projectileHitTime(e,from,to,r){
  const dx=to.x-from.x,dy=to.y-from.y,ox=from.x-e.x,oy=from.y-e.y;
  const c0=ox*ox+oy*oy-r*r;if(c0<=0)return 0;
  const a=dx*dx+dy*dy;if(!a)return Infinity;
  const b=2*(ox*dx+oy*dy),discriminant=b*b-4*a*c0;if(discriminant<0)return Infinity;
  const t=(-b-Math.sqrt(discriminant))/(2*a);return t>=0&&t<=1?t:Infinity;
}
function updateProjectiles(dt){
  for(let i=bullets.length-1;i>=0;i--){
    const b=bullets[i],from={x:b.x,y:b.y},travel=Math.min(dt,Math.max(0,b.life));
    b.x+=b.vx*travel;b.y+=b.vy*travel;b.life-=dt;b.hitEnemies??=new Set();b.remainingHits??=1;
    const hits=[];if(streetSession)for(const wall of STREET_BLOCKS){const time=rectHitTime(wall,from,b,b.r);if(time!==Infinity)hits.push({wall,time,kind:'wall'})}
    for(const e of enemies){
      if(e.hp<=0||b.hitEnemies.has(e))continue;
      const impact=e.riot?riotShotImpact(e,from,b,b.r):{time:projectileHitTime(e,from,b,b.r+e.r),shield:false};if(impact.time!==Infinity)hits.push({e,time:impact.time,kind:impact.shield?'shield':'enemy'});
    }
    for(const barrier of barricades)if(barrier.hp>0){const time=rectHitTime(barrier,from,b,b.r);if(time!==Infinity)hits.push({barrier,time,kind:'barrier'})}
    hits.sort((a,b)=>a.time-b.time||(b.kind==='barrier'||b.kind==='wall'?2:b.kind==='shield'?1:0)-(a.kind==='barrier'||a.kind==='wall'?2:a.kind==='shield'?1:0));
    for(const {e,barrier,wall,kind} of hits){
      if(wall){b.remainingHits=0;break}
      if(barrier){if(barrier.hp<=0)continue;damageBarricade(barrier,b.dmg,'gun');b.remainingHits=0;break}
      if(e.hp<=0)continue;b.hitEnemies.add(e);if(kind==='shield'){blockRiotShot(e);b.remainingHits=0;break}hitEnemy(e,b.dmg);b.remainingHits--;
      if(b.remainingHits<=0)break;
    }
    if(b.remainingHits<=0||b.life<=0)bullets.splice(i,1);
  }
}
function fireLightning(){
  if(!p.arc)return 0;
  const evolved=p.thunder&&p.arc===3,struck=new Set(),damage=p.damage*(evolved?1:.8);
  for(let branch=0;branch<(evolved?2:1);branch++){
    let origin={x:p.x,y:p.y};
    for(let hop=0;hop<(evolved?(branch===0?5:3):p.arc+2);hop++){
      const reach=hop?(evolved?180:150)*(p.arcRelay?1.2:1):300;let target=null,nearest=reach;
      for(const e of enemies){const d=dist(origin,e);if(e.hp>0&&!struck.has(e)&&d<=nearest){nearest=d;target=e}}
      if(!target)break;
      struck.add(target);const end={x:target.x,y:target.y};
      lightning.push({x1:origin.x,y1:origin.y,x2:end.x,y2:end.y,life:.18,max:.18,evolved});
      if(lightning.length>FX_LIMITS.lightning)lightning.shift();
      hitEnemy(target,damage,'LIGHTNING');origin=end;
    }
  }
  if(struck.size)sound(700,.06,'triangle',.02);return struck.size;
}
function bladeRadius(){return (p.reaper&&p.blades===3?100:78)+(p.bladeReach?12:0)}
function bladePositions(at=elapsed,centre=p){
  if(!p.blades)return[];
  const evolved=p.reaper&&p.blades===3,count=evolved?6:p.blades+1;return Array.from({length:count},(_,i)=>{
    const angle=at*(evolved?3.4:2.8)+i*Math.PI*2/count;
    return{x:centre.x+Math.cos(angle)*bladeRadius(),y:centre.y+Math.sin(angle)*bladeRadius(),angle};
  });
}
const MOLOTOV_TUNING=Object.freeze({flight:.45,tick:.4,life:2.4,range:300,wildfireLife:2.8,wildfireCooldown:3.6,separation:1.25,radii:Object.freeze([58,72,86]),cooldowns:Object.freeze([3.8,3.3,2.8])});
function molotovStats(rank=p.molotov,evolved=p.wildfire&&rank===3){
  const index=clamp(rank-1,0,2);
  return{radius:evolved?96:MOLOTOV_TUNING.radii[index],cooldown:evolved?MOLOTOV_TUNING.wildfireCooldown:MOLOTOV_TUNING.cooldowns[index],duration:evolved?MOLOTOV_TUNING.wildfireLife:MOLOTOV_TUNING.life,multiplier:evolved?.6:.45,count:evolved?2:1,evolved};
}
function launchMolotov(){
  if(mode!=='play'||!p.molotov||bottles.length>=FX_LIMITS.bottles)return 0;
  const stats=molotovStats(),targets=enemies.filter(e=>e.hp>0&&dist(e,p)<=MOLOTOV_TUNING.range&&rangedEnemyVisible(e)).sort((a,b)=>dist(a,p)-dist(b,p));
  let count=0;const selected=[];
  for(const target of targets){
    if(count>=stats.count||bottles.length>=FX_LIMITS.bottles)break;
    if(selected.some(other=>dist(other,target)<stats.radius*MOLOTOV_TUNING.separation))continue;
    selected.push(target);
    bottles.push({x:p.x,y:p.y,tx:target.x,ty:target.y,age:0,flight:MOLOTOV_TUNING.flight,radius:stats.radius,damage:p.damage*stats.multiplier,duration:stats.duration,evolved:stats.evolved});count++;
  }
  if(count)sound(330,.07,'triangle',.012);return count;
}
function updateMolotov(dt){
  if(mode!=='play')return;
  fires=fires.filter(f=>{f.life-=dt;return f.life>0&&dist(f,p)<1200});
  for(let i=bottles.length-1;i>=0;i--){
    const b=bottles[i];b.age+=dt;
    if(b.age>=b.flight){
      const life=b.duration-(b.age-b.flight);
      if(life>0&&Math.hypot(b.tx-p.x,b.ty-p.y)<1200){
        if(fires.length>=FX_LIMITS.fires)fires.shift();
        fires.push({x:b.tx,y:b.ty,r:b.radius,damage:b.damage,life,max:b.duration,evolved:b.evolved});burst(b.tx,b.ty,'#ffb36d',6);
      }
      bottles.splice(i,1);
    }
  }
  for(const [e,until] of burnHits)if(e.hp<=0||until<=elapsed)burnHits.delete(e);
  if(fires.length){
    for(const e of enemies){
      if(e.hp<=0||elapsed+1e-8<(burnHits.get(e)||0))continue;
      let damage=0;for(const f of fires)if(dist(e,f)<=e.r+f.r)damage=Math.max(damage,f.damage);
      if(damage>0){burnHits.set(e,elapsed+MOLOTOV_TUNING.tick);hitEnemy(e,damage,'FIRE')}
    }
    for(const b of barrels)if(!b.spent&&fires.some(f=>dist(f,b)<=f.r+b.r))detonateBarrel(b);
    for(const b of barricades)if(b.hp>0&&elapsed+1e-8>=(b.fireNextAt||0)){
      let damage=0;for(const f of fires)if(pointRectDistance(f,b)<=f.r)damage=Math.max(damage,f.damage);
      if(damage>0){b.fireNextAt=elapsed+MOLOTOV_TUNING.tick;damageBarricade(b,damage,'fire')}
    }
  }
  if(!p.molotov)return;
  molotovClock=Math.max(0,molotovClock-dt);
  if(molotovClock<=0)molotovClock=launchMolotov()?molotovStats().cooldown:.1;
}
function renderGroundFire(){
  g.save();
  for(const f of fires){
    g.globalAlpha=Math.min(1,f.life/.5);g.fillStyle=f.evolved?'#ff7f371f':'#ffad5424';g.strokeStyle=f.evolved?'#ffaf63aa':'#ffc07888';g.lineWidth=2;
    g.beginPath();g.arc(f.x,f.y,f.r,0,Math.PI*2);g.fill();g.stroke();
    for(let i=0;i<(preferences.reduced?2:5);i++){const a=i*2.3999632297,x=f.x+Math.cos(a)*f.r*.52,y=f.y+Math.sin(a)*f.r*.52,h=12+Math.sin(elapsed*7+i)*4;g.fillStyle=i%2?'#ffd792bb':'#ff9c50aa';g.beginPath();g.moveTo(x-5,y+4);g.quadraticCurveTo(x-8,y-h*.4,x+2,y-h);g.quadraticCurveTo(x+9,y-4,x+5,y+4);g.closePath();g.fill()}
    if(dist(f,p)<220){g.fillStyle='#ffd6a4';g.font='bold 9px system-ui';g.textAlign='center';g.fillText('YOUR FIRE',f.x,f.y+f.r+12)}
  }
  g.restore();
}
function renderMolotovBottles(){
  g.save();for(const b of bottles){const t=clamp(b.age/b.flight,0,1),x=b.x+(b.tx-b.x)*t,y=b.y+(b.ty-b.y)*t-Math.sin(t*Math.PI)*55;g.save();g.translate(x,y);g.rotate(t*5);g.fillStyle='#dfa667';g.fillRect(-4,-6,8,12);g.fillStyle='#a2ded3';g.fillRect(-2,-10,4,5);g.fillStyle='#ffbf68';g.beginPath();g.arc(0,-11,3,0,Math.PI*2);g.fill();g.restore()}g.restore();
}
function updateWeapons(dt,from){
 if(bossLab&&!bossLabFire)return;
  updateMolotov(dt);
  for(let i=lightning.length-1;i>=0;i--){lightning[i].life-=dt;if(lightning[i].life<=0)lightning.splice(i,1)}
  if(p.arc){chainClock-=dt;if(chainClock<=0){if(fireLightning())chainClock=p.thunder&&p.arc===3?.8:1.35-(p.arc-1)*.175;else chainClock=.1}}
  for(const [e,until] of bladeHits)if(e.hp<=0||until<=elapsed)bladeHits.delete(e);
  if(!p.blades)return;
  const before=bladePositions(elapsed-dt,from),after=bladePositions();
  for(const e of enemies){
    if(e.hp<=0||bladeHits.has(e))continue;
    for(let i=0;i<after.length;i++){
      if(segmentDistance(e,before[i],after[i])<=e.r+11){hitEnemy(e,p.damage*(p.reaper&&p.blades===3?1.35:1.1),'BLADES');bladeHits.set(e,elapsed+(p.reaper&&p.blades===3?.35:.45));break}
    }
  }
}
function renderWeapons(){
 if(bossLab&&!bossLabFire)return;
  renderMolotovBottles();
  if(p.blades){
    g.strokeStyle='#cbb5ff25';g.lineWidth=1;g.beginPath();g.arc(p.x,p.y,bladeRadius(),0,Math.PI*2);g.stroke();
    for(const blade of bladePositions()){
      g.save();g.translate(blade.x,blade.y);g.rotate(blade.angle+Math.PI/2);g.fillStyle=p.reaper&&p.blades===3?'#ffe29b':'#d7c1ff';g.shadowColor=p.reaper&&p.blades===3?'#ffcd67':'#b38aff';g.shadowBlur=7;
      g.beginPath();g.moveTo(-13,3);g.lineTo(15,-5);g.lineTo(6,6);g.lineTo(-10,7);g.fill();g.restore();
    }
  }
  for(const arc of lightning){
    const dx=arc.x2-arc.x1,dy=arc.y2-arc.y1,length=Math.hypot(dx,dy)||1;
    g.globalAlpha=clamp(arc.life/arc.max,0,1);g.strokeStyle=arc.evolved?'#ffe29b':'#83e6ff';g.lineWidth=arc.evolved?4:3;
    g.beginPath();g.moveTo(arc.x1,arc.y1);g.lineTo((arc.x1+arc.x2)/2-dy/length*8,(arc.y1+arc.y2)/2+dx/length*8);g.lineTo(arc.x2,arc.y2);g.stroke();
  }
  g.globalAlpha=1;
}
const SALVAGE_TUNING=Object.freeze({first:15,lifetime:20,hold:6,radius:110,compactRadius:80,entryRadius:260,stun:2,shield:1,interval:90,gap:3});
function salvageInterrupted(){return !!(activeBoss||bossWarned||rushPhase==='active'||rushPhase==='warning'||exitBeacon)}
function salvageContested(){return salvage&&enemies.some(e=>e.hp>0&&dist(e,salvage)<=e.r+salvage.r)}
function salvageStatus(){return !salvage||dist(p,salvage)>salvage.r?'ENTER GOLD CIRCLE':salvageContested()?'UNDER ATTACK · KEEP MOVING':'HOLD POSITION'}
function placeSalvage(){
  const facing=Math.atan2(lastMove.y,lastMove.x);
  // Prefer more dodging room; retain the proven compact size when physical clearance is tight.
  for(const r of [SALVAGE_TUNING.radius,SALVAGE_TUNING.compactRadius]){
    const maxX=Math.max(0,W/2-r-12),maxY=Math.max(0,H/2-r-24);
    let fallback=null;
    for(let i=0;i<192;i++){
      const angle=facing+(i%32)*2.3999632297,d=120+Math.floor(i/32)*24;
      const b={x:p.x+Math.cos(angle)*d,y:p.y+Math.sin(angle)*d,r,until:elapsed+SALVAGE_TUNING.lifetime,progress:0,entered:false};
      if(Math.abs(b.x-p.x)>maxX||Math.abs(b.y-p.y)>maxY||nearDrop(b,r+15)||barrels.some(other=>!other.spent&&dist(other,b)<r+other.r+20)||supplyCache&&dist(supplyCache,b)<r+supplyCache.r+20||nearBarricade(b,r+20))continue;
      const overlaps=o=>b.x>o.x-r-15&&b.x<o.x+o.w+r+15&&b.y>o.y-r-15&&b.y<o.y+o.h+r+15;
      if(!obstacles.some(overlaps)){salvage=b;return true}
      if(!fallback)fallback={b,overlaps};
    }
    if(fallback){obstacles=obstacles.filter(o=>!fallback.overlaps(o));salvage=fallback.b;return true}
  }
  return false;
}
function activateSalvage(){
  if(mode!=='play'||p.hp<=0||!salvage||salvage.entered||salvageInterrupted()||elapsed>=salvage.until||dist(p,salvage)>salvage.r)return false;
  salvage.entered=true;
  const radius=SALVAGE_TUNING.entryRadius;
  for(const e of enemies){
    if(e.hp<=0||dist(e,p)>radius+e.r)continue;
    const d=dist(e,p),angle=d?Math.atan2(e.y-p.y,e.x-p.x):Math.atan2(lastMove.y,lastMove.x);
    e.x=p.x+Math.cos(angle)*(radius+e.r+1);e.y=p.y+Math.sin(angle)*(radius+e.r+1);
    e.salvageStunUntil=Math.max(e.salvageStunUntil||0,elapsed+SALVAGE_TUNING.stun);
    if(e.spitter){e.phase='approach';e.cooldown=SPITTER_TUNING.cooldown;e.phaseTime=0}
    // Keep displaced bodies outside solid wood; the brief shield also covers an obstructed push.
    resolveBarricadeBody(e,{x:e.x,y:e.y});
  }
  hostileShots=hostileShots.filter(shot=>dist(shot,p)>radius+shot.r);
  p.inv=Math.max(p.inv,SALVAGE_TUNING.shield);
  blastRings.push({x:p.x,y:p.y,life:.55,max:.55,radius,color:'#ffdb8d'});
  burst(p.x,p.y,'#ffdb8d',12);sound(440,.18,'sine',.03);
  toast('SALVAGE PULSE • HOLD 6s • KEEP MOVING',2500);return true;
}
function salvageHasWindow(){
  const window=SALVAGE_TUNING.lifetime+SALVAGE_TUNING.gap;
  return nextBossAt-elapsed>window+10&&nextRushAt-elapsed>window+RUSH_TUNING.warning&&exitAt-elapsed>window;
}
function salvageWaitingStatus(){
  if(exitBeacon)return '';
  if(salvageInterrupted()||elapsed<reliefUntil)return 'SALVAGE • AFTER THIS ENCOUNTER';
  if(nextSalvageAt<=elapsed+3&&!salvageHasWindow())return 'SALVAGE • WAITING FOR A SAFE WINDOW';
  if(elapsed<nextSalvageAt)return `SALVAGE IN ${fmt(Math.ceil(nextSalvageAt-elapsed))}`;
  return 'SALVAGE • FINDING A CLEAR SPOT';
}
function updateSalvageAvailability(){
  if(mode!=='play')return;
  if(salvage&&(salvageInterrupted()||elapsed>=salvage.until)){salvage=null;return}
  if(convoy||salvage||elapsed<nextSalvageAt||elapsed<reliefUntil)return;
  if(salvageInterrupted()||!salvageHasWindow()){nextSalvageAt=elapsed+3;return}
  const placed=placeSalvage();nextSalvageAt=elapsed+(placed?SALVAGE_TUNING.interval:5);
  if(placed)toast('SALVAGE OPEN • ENTER FOR A DEFENSIVE PULSE',3000);
}
function updateSalvageProgress(dt,from){
  if(mode!=='play'||p.hp<=0||!salvage)return;
  if(salvageInterrupted()||elapsed>=salvage.until){salvage=null;return}
  if(dist(p,salvage)>salvage.r||dist(from,salvage)>salvage.r)return;
  salvage.progress=Math.min(SALVAGE_TUNING.hold,salvage.progress+dt);
  if(salvage.progress+1e-8<SALVAGE_TUNING.hold)return;
  const b=salvage;salvage=null;salvagesSecured++;recordRunEvent('salvage');bonusChoices++;bonusKinds.push('salvage');
  floatText(b.x,b.y-25,'SALVAGE SECURED','#ffdb8d');burst(b.x,b.y,'#ffdb8d',12);sound(590,.2,'sine',.035);
  toast('SALVAGE SECURED • FREE UPGRADE',2200);
}
function renderSalvage(){
  if(!salvage)return;const b=salvage;
  g.save();g.fillStyle='#ffd56a0d';g.strokeStyle='#b79550';g.lineWidth=2;g.beginPath();g.arc(b.x,b.y,b.r,0,Math.PI*2);g.fill();g.stroke();
  g.strokeStyle='#ffe09a';g.lineWidth=5;g.beginPath();g.arc(b.x,b.y,b.r,-Math.PI/2,-Math.PI/2+Math.PI*2*b.progress/SALVAGE_TUNING.hold);g.stroke();
  if(drawFieldCase(b,'salvage')){g.fillStyle='#ffdb8d'}else{
  g.fillStyle='#3c3328';g.fillRect(b.x-17,b.y-14,34,28);g.strokeStyle='#ffdb8d';g.lineWidth=2;g.strokeRect(b.x-17,b.y-14,34,28);g.fillStyle='#ffdb8d';g.fillRect(b.x-3,b.y-14,6,28);
  }
  g.font='bold 11px system-ui';g.textAlign='center';g.fillText('SALVAGE · FREE UPGRADE',b.x,b.y-b.r-13);g.fillText(salvageStatus(),b.x,b.y+b.r+18);g.restore();
}
const RUSH_TUNING=Object.freeze({warning:5,duration:12,hunters:16,interval:.75,heal:15,breather:4});
function scheduleRush(at){
  nextRushAt=at;rushPhase='waiting';rushUntil=0;rushClock=0;rushSpawned=0;rushPendingReward=false;
}
function spawnRushHunter(){
  if(enemies.length>=239||rushSpawned>=RUSH_TUNING.hunters)return false;
  const side=rushSpawned%2?-1:1,scale=1+elapsed/200;
  const x=p.x+(rushAxis==='horizontal'?side*(W/2+70):rand(-W*.3,W*.3));
  const y=p.y+(rushAxis==='vertical'?side*(H/2+70):rand(-H*.3,H*.3));
  enemies.push({x,y,hp:24*scale,max:24*scale,speed:145*Math.min(1.6,1+elapsed/350)*overtimePressure().speed,r:ENEMY_ART.hunter.r,dmg:9,col:ENEMY_ART.hunter.col,hit:0,type:1,rush:true});
  rushSpawned++;return true;
}
function updateRush(dt){
  if(activeBoss){if(rushPhase!=='waiting'||Number.isFinite(nextRushAt))scheduleRush(Infinity);return}
  if(rushPhase!=='active'){
    if(!Number.isFinite(nextRushAt))return;
    // Reserve time for the whole event and a clear gap before the next boss warning.
    if(elapsed<reliefUntil)return;
    if(nextBossAt-elapsed<RUSH_TUNING.duration+15){scheduleRush(Infinity);return}
    if(rushPhase==='waiting'&&elapsed>=nextRushAt-RUSH_TUNING.warning){
      rushPhase='warning';rushAxis=Math.random()<.5?'horizontal':'vertical';
      toast(`BLACKOUT IN 5s • HUNTERS ${rushAxis==='horizontal'?'LEFT + RIGHT':'TOP + BOTTOM'}`,3000);sound(160,.2,'triangle',.025,'alerts');
    }
    if(rushPhase==='warning'&&elapsed>=nextRushAt){
      rushPhase='active';recordRunEvent('blackout');rushUntil=nextRushAt+RUSH_TUNING.duration;rushClock=0;
      toast('BLACKOUT RUSH • SURVIVE 12 SECONDS',2500);sound(100,.25,'sawtooth',.03,'alerts');
    }
  }
  if(rushPhase==='active'){
    if(elapsed>=rushUntil){rushPendingReward=true;return}
    rushClock-=dt;
    if(rushClock<=0&&spawnRushHunter())rushClock=RUSH_TUNING.interval;
  }
}
function resolveRushReward(){
  // Resolve after damage, so dying on the final tick never grants a survival reward.
  if(!rushPendingReward||mode!=='play'||p.hp<=0)return;
  scheduleRush(Infinity);rushesSurvived++;recordRunEvent('blackout-clear');bonusChoices++;bonusKinds.push('blackout');
  const heal=Math.min(RUSH_TUNING.heal,p.max-p.hp);p.hp+=heal;reliefUntil=elapsed+RUSH_TUNING.breather;reliefLabel='BLACKOUT CLEAR';
  toast('BLACKOUT SURVIVED • BONUS UPGRADE',3500);sound(620,.2,'sine',.04,'alerts');
  if(heal>0)floatText(p.x,p.y-35,`+${Math.ceil(heal)} HP`,'#dac5ff');
}
function renderRushLights(){
  if(rushPhase!=='warning'&&rushPhase!=='active')return;
  g.save();g.globalAlpha=.45+.12*Math.sin(elapsed*Math.PI);g.strokeStyle='#b8a4ff';g.lineWidth=6;g.strokeRect(4,4,W-8,H-8);g.fillStyle='#d4c4ff';
  const markers=rushAxis==='horizontal'?[[18,H/2,0],[W-18,H/2,Math.PI]]:[[W/2,18,Math.PI/2],[W/2,H-18,-Math.PI/2]];
  for(const [x,y,angle] of markers){
    g.save();g.translate(x,y);g.rotate(angle);g.beginPath();g.moveTo(9,0);g.lineTo(-6,-9);g.lineTo(-6,9);g.closePath();g.fill();g.restore();
  }
  g.restore();
}
function overtimePressure(){return{spawn:Math.min(1.75,1+overtime*.2),speed:1+Math.min(.2,overtime*.04)}}
function updateExtractionWindow(){
  if(mode!=='play'||exitBeacon||elapsed<exitAt||bossesDefeated<1||activeBoss||rushPhase==='active'||rushPhase==='warning')return;
  exitBeacon={x:p.x+Math.min(W*.28,150),y:p.y-Math.min(H*.16,100),r:48};salvage=null;barricades=barricades.filter(b=>pointRectDistance(exitBeacon,b)>exitBeacon.r+50);
  obstacles=obstacles.filter(o=>!(exitBeacon.x>o.x-80&&exitBeacon.x<o.x+o.w+80&&exitBeacon.y>o.y-80&&exitBeacon.y<o.y+o.h+80));
  // A brief arrival margin prevents a newly scheduled encounter landing on the reveal.
  nextBossAt=Math.max(nextBossAt,elapsed+25);bossWarned=false;scheduleRush(Infinity);
  recordRunEvent('exit-open');toast('EXIT OPEN • REACH THE GREEN BEACON',3500);sound(440,.25,'sine',.04,'alerts');
}
function updateExtractionArrival(from){
  if(mode==='play'&&p.hp>0&&exitBeacon&&segmentDistance(exitBeacon,from,p)<=exitBeacon.r+p.r)showExtractionChoice();
}
function showExtractionChoice(){
  if(mode!=='play'||!exitBeacon||p.hp<=0)return;
  mode='extraction';
  const practice=training&&trainingScenario==='extraction';
  const nextPressure=Math.round(100*(Math.min(1.75,1+(overtime+1)*.2)-1));
  show(`<div class="eyebrow">${practice?'EXIT PRACTICE · UNSCORED':'THE EXIT IS YOURS'}</div><h1 style="font-size:48px">LEAVE OR<br>GO FURTHER?</h1><p>${fmt(elapsed)} survived · ${killCount} eliminations · ${bossesDefeated} bosses defeated</p><p class="muted">${survivorById(runSurvivor).name} · ${buildSummary()}</p>${practice?'<p>Practice only: Extract ends on frozen stats without saving a victory. Stay demonstrates the landing pulse and protection; the next practice exit opens in 10 active seconds. Normal runs need 03:00 and a defeated boss; normal overtime waits at least 60 seconds.</p>':'<p>Extract now to finish this run with a victory.</p>'}${practice?'<p>Stay to practice the landing pulse and safe escape. No new encounters spawn here; another practice exit opens after 10 active seconds.</p>':`<p>Stay to grow this build and chase a longer record.<br>Overtime ${overtime+1}: new hordes arrive ${nextPressure}% more often than normal and move a little faster.<br>The next exit can open after 60 seconds, once any active encounter is clear.</p>`}<p style="color:#a7ffda">Returning clears nearby enemies and grants ${EXIT_RETURN_TUNING.shield}s of protection so you can move away.</p><button class="btn" id="extract">EXTRACT — VICTORY →</button><p><button class="btn secondary" id="stay">STAY — OVERTIME ${overtime+1}</button></p><p class="muted">Time is paused while you choose. Weapons reset when you start a new run.</p>`);
  bindUpgradePress(document.getElementById('extract'),completeExtraction,()=>mode==='extraction');
  bindUpgradePress(document.getElementById('stay'),stayAfterDark,()=>mode==='extraction');
}
function completeExtraction(){if(mode==='extraction'&&exitBeacon&&p.hp>0)end('extracted')}
const EXIT_RETURN_TUNING=Object.freeze({radius:160,shield:1.5,breather:2});
function clearExitLanding(){
  let cleared=0;
  for(const e of enemies){
    if(e.hp>0&&dist(e,p)<=EXIT_RETURN_TUNING.radius+e.r){hitEnemy(e,e.hp,'EXIT');cleared++}
  }
  for(const b of barricades)if(b.hp>0&&pointRectDistance(p,b)<=EXIT_RETURN_TUNING.radius)damageBarricade(b,b.hp,'exit');
  enemies=enemies.filter(e=>e.hp>0);hostileShots=[];cancelHowls();cancelLobbers();
  for(const e of enemies)if(e.spitter){e.phase='approach';e.cooldown=SPITTER_TUNING.cooldown}
  if(activeBoss&&activeBoss.bossKind==='warden'){activeBoss.phase='approach';activeBoss.phaseTime=2.8}
  p.inv=Math.max(p.inv,EXIT_RETURN_TUNING.shield);
  if(elapsed+EXIT_RETURN_TUNING.breather>reliefUntil){reliefUntil=elapsed+EXIT_RETURN_TUNING.breather;reliefLabel='EXIT CLEAR'}
  blastRings.push({x:p.x,y:p.y,life:.55,max:.55,radius:EXIT_RETURN_TUNING.radius,color:'#8fffd8'});
  sound(390,.18,'sine',.035,'alerts');return cleared;
}
function stayAfterDark(){
  if(mode!=='extraction'||!exitBeacon||p.hp<=0)return;
  overtime++;recordRunEvent('overtime');exitBeacon=null;exitAt=elapsed+60;rescueArrival=null;if(!rescue){rescueOffered=false;nextRescueAt=elapsed+RESCUE_TUNING.afterStay;}
  if(!activeBoss){
    nextBossAt=Math.max(nextBossAt,elapsed+40);bossWarned=false;
    if(rushPhase!=='active'&&rushPhase!=='warning')scheduleRush(elapsed+10);
  }
  const cleared=clearExitLanding();
  if(training&&trainingScenario==='extraction'){exitAt=elapsed+10;scheduleRush(Infinity);rescue=null;nextRescueAt=Infinity}
  mode='play';hide();clearInput();last=performance.now();unlockAudio();
  toast(`EXIT CLEAR • ${cleared} ELIMINATED • ${EXIT_RETURN_TUNING.shield}s PROTECTION • OVERTIME ${overtime}`,3000);checkLevelUp();updateHUD();
}
function renderExtraction(){
  if(!exitBeacon)return;const b=exitBeacon;
  g.fillStyle='#65ffbc18';g.strokeStyle='#9affd2';g.lineWidth=3;
  g.beginPath();g.arc(b.x,b.y,b.r+3*Math.sin(elapsed*3),0,Math.PI*2);g.fill();g.stroke();
  g.strokeStyle='#b6ffdc';g.lineWidth=4;g.strokeRect(b.x-13,b.y-13,26,26);g.fillStyle='#c4ffe5';g.font='bold 12px system-ui';g.textAlign='center';g.fillText('EXTRACT',b.x,b.y+b.r+18);
}
function update(dt){if(mode!=='play')return;elapsed+=dt;if(decoy&&elapsed>=decoy.until)decoy=null;updateExtractionWindow();updateEncounter();updateRush(dt);updateSalvageAvailability();updateSpitterSchedule();updateRiotSchedule();updateHowlerSchedule();updateLobberSchedule();updateBarricades(dt);spawn-=dt;p.fireClock-=dt;p.dashCd=Math.max(0,p.dashCd-dt);p.inv=Math.max(0,p.inv-dt);p.hp=Math.min(p.max,p.hp+p.regen*dt);if(spawn<=0&&enemies.length<239&&elapsed>=reliefUntil){spawnEnemy();spawn=hordeSpawnInterval()*rand(.5,1.3)*(activeBoss?1.6:1)/overtimePressure().spawn}let {x:mx,y:my}=movementInput(),len=Math.hypot(mx,my);if(len>0){lastMove.x=mx/Math.hypot(mx,my);lastMove.y=my/Math.hypot(mx,my)}const from={x:p.x,y:p.y},wasDashing=p.dash>0;let speed=p.speed*(wasDashing?3.8:1);p.x+=(p.dash>0?p.dashX:mx)*speed*dt;p.y+=(p.dash>0?p.dashY:my)*speed*dt;p.dash=Math.max(0,p.dash-dt);if(streetSession)streetResolveBody(p,from);applyPlayerBarricades(from,wasDashing);p.stillTime=p.steady&&len<.05&&!wasDashing&&Math.hypot(p.x-from.x,p.y-from.y)<.01?Math.min(.6,p.stillTime+dt):0;updateBarrels(dt,from,wasDashing);updateShockDrums(dt,from,wasDashing);activateSalvage();updateRiotMotion(dt);updateConvoy();if(p.dash>0&&Math.random()<.8)burst(p.x,p.y,'#67f4d0',2);if(p.fireClock<=0&&bullets.length<FX_LIMITS.bullets&&(!bossLab||bossLabFire)){const near=gunTarget();if(near){if(streetSession)streetCombatShot(near);const volleyMultiplier=evasiveMultiplier(),a=Math.atan2(near.y-p.y,near.x-p.x);for(let j=0;j<p.proj&&bullets.length<FX_LIMITS.bullets;j++){let spread=(j-(p.proj-1)/2)*.15;bullets.push({x:p.x,y:p.y,vx:Math.cos(a+spread)*p.bulletSpeed*(p.rail?1.2:1),vy:Math.sin(a+spread)*p.bulletSpeed*(p.rail?1.2:1),r:p.rail?5:4,life:1.2,dmg:p.damage*(p.rail?1.25:1)*steadyMultiplier()*volleyMultiplier,remainingHits:p.rail?8:p.pierce+1,hitEnemies:new Set(),piercing:p.pierce>0,rail:p.rail});if(j===0)noteFieldShot(near)}p.evasiveUntil=0;p.fireClock=p.fire;combatCue('gun',460,.035,'square',.009)}}
updateProjectiles(dt);updateWeapons(dt,from);updateHowls(dt);updateLobbers(dt);if(mode==='end')return;for(let i=enemies.length-1;i>=0;i--){let e=enemies[i];if(e.hp<=0){enemies.splice(i,1);continue}if(e.trainingDummy&&!e.trainingBoss&&!e.trainingLive){e.hit=Math.max(0,e.hit-dt);continue}if(e.convoy){e.hit=Math.max(0,e.hit-dt);continue}const fromEnemy=e.riot?e.riotFrom||{x:e.x,y:e.y}:{x:e.x,y:e.y},wasCharging=e===activeBoss&&e.bossKind!=='warden'&&e.phase==='charge';if(!e.riot){if(elapsed>=(e.salvageStunUntil||0)){if(e===activeBoss){moveBoss(e,dt)}else if(e.spitter){moveSpitter(e,dt)}else if(e.lobber){moveLobber(e,dt)}else if(e.howler){moveHowler(e,dt)}else{moveHorde(e,dt)}}applyEnemyBarricades(e,fromEnemy,dt,wasCharging);if(streetSession){const at={x:e.x,y:e.y};streetResolveBody(e,fromEnemy);if(wasCharging&&(e.x!==at.x||e.y!==at.y)){e.phase='recover';e.phaseTime=BREAKER_TUNING.recovery}}}e.hit=Math.max(0,e.hit-dt);if(segmentDistance(p,fromEnemy,e)<e.r+p.r&&p.inv<=0){hurtPlayer(e.dmg,enemySpecies(e)||'contact');if(mode==='end')return}}updateHostileShots(dt,from);if(mode==='end')return;for(let i=gems.length-1;i>=0;i--){let a=gems[i],d=dist(a,p);if(d<p.magnet*2){a.x+=(p.x-a.x)*Math.min(1,dt*(d<p.magnet?12:4));a.y+=(p.y-a.y)*Math.min(1,dt*(d<p.magnet?12:4))}if(d<20){recordCollectedXp(a.value);xp+=a.value;gems.splice(i,1);sound(720,.025,'sine',.009)}}for(let i=particles.length-1;i>=0;i--){let q=particles[i];q.x+=q.vx*dt;q.y+=q.vy*dt;q.life-=dt;if(q.life<=0)particles.splice(i,1)}for(let i=texts.length-1;i>=0;i--){texts[i].y-=30*dt;texts[i].life-=dt;if(texts[i].life<=0)texts.splice(i,1)}updateSupplies(from);updateDrops(dt,from);resolveConvoyReward();updateSalvageProgress(dt,from);resolveRushReward();updateRescue(dt,from);updatePatrol(from);updateTrainingTargets(dt);checkLevelUp();updateExtractionArrival(from);updateLocker();if(streetSession)advanceStreetAnimations(dt);else advanceFieldActors(dt);updateHUD()}
function checkLevelUp(){if(mode!=='play'||training)return;checkContract();if(bonusChoices>0){bonusChoices--;levelUp(bonusKinds.shift()||'blackout')}else if(xp>=nextXp){xp-=nextXp;nextXp=Math.floor(nextXp*1.32+5);levelUp()}}
// Read-only prototype instruments; no simulation, rewards, timers or saved options.
// Scored-run presentation reads existing state/labels and never advances gameplay.
function composedRunHud(){return (!training||!!mainPerfTest)&&!streetSession&&!runLogged&&preferences.hud==='composed'&&['play','paused','upgrade','extraction','settings','guide','manual','map','locker','benchmark'].includes(mode)}
function hudNumber(value){const n=Math.max(0,Number(value)||0);return n<1000?String(Math.floor(n)):n<1e6?(n/1e3).toFixed(1)+'K':n<1e9?(n/1e6).toFixed(1)+'M':(n/1e9).toFixed(1)+'B'}
function hudAttribute(id,name,value){const el=document.getElementById(id),text=String(value);if(el.getAttribute(name)!==text)el.setAttribute(name,text)}
function hudEscape(text){return String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function runHudRows(){
 const rows=['objective','runGoal','supplyGoal','salvageGoal','contractGoal','medalGoal','rescueGoal','dropGoal','lockerGoal'].map(id=>({id,text:String(document.getElementById(id).textContent||'').trim()})).filter(row=>row.text);
 const patrolGoal=patrolTarget();if(patrolGoal)rows.push({id:'patrol',text:`PATROL ${patrol.filter(b=>b.visited).length}/${patrol.length} · ${bossBearing(patrolGoal)} TO CHECKPOINT ${patrolGoal.number}`});
 if(convoy&&!rows.some(row=>row.id==='objective'&&row.text.startsWith('CONVOY')))rows.push({id:'convoy',text:`CONVOY ${bossBearing(convoy)} · ${convoy.phase==='signal'?'ARRIVING IN '+Math.max(0,Math.ceil(convoy.readyAt-elapsed))+'s':Math.ceil(convoy.hp)+' HP · '+Math.max(0,Math.ceil(convoy.until-elapsed))+'s LEFT'}`});
 return rows;
}
function runHudSnapshot(){
 const rows=runHudRows(),line=id=>rows.find(row=>row.id===id)?.text||'',boss=activeBoss&&activeBoss.hp>0?activeBoss:null,role=survivorById(runSurvivor),encounter=line('objective');
 let threat=null;
 if(boss)threat={name:bossName(boss)+' '+bossBearing(boss),state:encounter.split(' • ').slice(1).join(' • ')||encounter,kind:boss.bossKind||'breaker',phase:boss.phase};
 else if(rushPhase==='warning'||rushPhase==='active')threat={name:'BLACKOUT',state:encounter,kind:'blackout',phase:rushPhase};
 else if(bossWarned)threat={name:bossName()+' INCOMING',state:encounter,kind:'incoming',phase:'warn'};
 const ids={exit:'runGoal',medical:'supplyGoal',salvage:'salvageGoal',rescue:'rescueGoal',drop:'dropGoal',convoy:encounter.startsWith('CONVOY')?'objective':'convoy',locker:'lockerGoal',patrol:'patrol'};
 let hint=objectiveFocus!=='auto'?line(ids[objectiveFocus]):'',optional=!!hint&&objectiveFocus!=='exit';
 if(objectiveFocus==='exit'&&exitBeacon)hint=`EXIT ${bossBearing(exitBeacon)} · REACH THE GREEN BEACON`;
 if(!hint){const candidates=[supplyCache&&p.hp<p.max&&'supplyGoal',rescue?.following&&'rescueGoal',salvage&&'salvageGoal',rescue&&'rescueGoal',supplyDrop&&'dropGoal',convoy&&(encounter.startsWith('CONVOY')?'objective':'convoy'),locker&&'lockerGoal',patrolTarget()&&'patrol'];const chosen=candidates.find(id=>id&&line(id));hint=chosen?line(chosen):!threat?encounter:'Keep clear of the marked attack.';optional=!!chosen;}if(optional)hint='OPTIONAL · '+hint;
 const contract=contractById(runContract),medal=MEDAL_TRACKERS.find(m=>m.id===trackedMedal),badges={survivor:'SU',scout:'SC',bulwark:'BU',engineer:'EN',scavenger:'SA',tactician:'TA',quartermaster:'QM',courier:'CO'};
 return{health:Math.ceil(p.hp),max:p.max,healthPercent:clamp(100*p.hp/p.max,0,100),xpPercent:clamp(100*xp/nextXp,0,100),xpText:`LV ${level} · ${hudNumber(xp)} / ${hudNumber(nextXp)} XP`,xpExact:`Level ${level} · ${xp} / ${nextXp} XP`,time:fmt(mainPerfTest?elapsed-mainPerfTest.startedAt:elapsed),targets:hudNumber(mainPerfTest?practiceTargets:killCount),survivor:role.name.toUpperCase(),badge:badges[role.id],color:role.color,threat,boss:boss?{hp:Math.max(0,Math.ceil(boss.hp)),max:Math.ceil(boss.max),percent:clamp(100*boss.hp/boss.max,0,100)}:null,title:line('runGoal')||'SURVIVE · BUILD · REACH GREEN',hint,contract:contract?`${Math.min(contract.target,contractProgress())}/${contract.target} ${contract.short}${contractCompleted?' ✓':''}`:'',medal:medal?`${Math.min(medal.target,medal.value())}/${medal.target} ${medal.name}`:''};
}
function runHudStylePicker(){return `<div class="contract-picker"><label for="runHudStyle">RUN HUD</label><select id="runHudStyle"><option value="composed">Composed · field instruments</option><option value="classic">Classic · previous HUD</option></select><p class="muted">Controls follow the selected style. Combat, rewards and saves stay the same. Street Prototype has its own comparison.</p></div>`}
function selectRunHud(style){
 if(!['paused','settings'].includes(mode)||document.hidden||!['composed','classic'].includes(style))return;
 preferences.hud=style;savePreferences();if(mode==='settings')renderSettings();else{mode='play';pause()}
}
function runHudPauseControls(){
 if(training&&!mainPerfTest)return '';
 return `<details class="medal-goals"><summary>RUN HUD &amp; FIELD STATUS · ${preferences.hud.toUpperCase()}</summary><button class="btn secondary" id="runHudCompare">SHOW ${preferences.hud==='composed'?'CLASSIC':'COMPOSED'} HUD</button>${fieldActorPauseControl()}${fieldWorldPauseControl()}<p>Level ${level} · ${xp} / ${nextXp} XP · ${killCount} eliminations</p>${activeBoss?`<p>${bossName(activeBoss)} · ${Math.max(0,Math.ceil(activeBoss.hp))} / ${Math.ceil(activeBoss.max)} HP</p>`:''}<p class="muted">The composed HUD prioritizes encounter warnings, extraction and a selected or relevant goal. All current status lines are below. Optional objectives keep their existing rules.</p><div class="run-status-list">${runHudRows().map(row=>`<p>${hudEscape(row.text)}</p>`).join('')}</div></details>`;
}
function streetHudSnapshot(){
 if(!streetSession||!training)return null;
 const boss=activeBoss&&activeBoss.hp>0?activeBoss:null,phase=boss?.phase||'clear';
 const cues={approach:['KEEP MOVING','Auto-fire handles your aim.'],warn:['DODGE THE GOLD LANE','Sidestep the locked charge.'],charge:['STAY CLEAR','Let the charge pass.'],recover:['OPENING — ATTACK','The Breaker is recovering.']},cue=cues[phase]||['PRACTICE YOUR BUILD','Targets respawn. Pause to change weapons.'];
 return{health:Math.ceil(p.hp),max:p.max,healthPercent:clamp(100*p.hp/p.max,0,100),xpPercent:training?0:clamp(100*xp/nextXp,0,100),xpText:training?'XP OFF · PRACTICE':`LV ${level} · ${xp} / ${nextXp} XP`,time:fmt(elapsed),targets:practiceTargets,phase,boss:boss?{name:bossName(boss),hp:Math.max(0,Math.ceil(boss.hp)),max:Math.ceil(boss.max),percent:clamp(100*boss.hp/boss.max,0,100)}:null,title:cue[0],hint:cue[1],weapon:streetTrialInfo().effects?'ALL FOUR PATHS · EVOLVED':`${TRAINING_PATHS[trainingWeapon]} III${trainingEvolved?' · EVOLVED':''}`};
}
function streetHudText(id,value){const el=document.getElementById(id),text=String(value);if(el.textContent!==text)el.textContent=text}
function streetHudWidth(id,value){const el=document.getElementById(id),width=value+'%';if(el.style.width!==width)el.style.width=width}
function syncStreetHud(){
 const run=composedRunHud(),street=streetSession&&training&&!runLogged&&streetHudPolished&&['play','paused','settings','guide','manual','map','locker','benchmark'].includes(mode),active=run||street,presentation=run?'run':street?'street':'classic';
 for(const id of ['hud','touch']){const el=document.getElementById(id);if(el.dataset.presentation!==presentation)el.dataset.presentation=presentation}
 const root=document.getElementById('streetHud');if(root.hidden!==!active)root.hidden=!active;
 if(!active){if(streetHudPortraitImage){document.getElementById('streetPortrait').getContext('2d').clearRect(0,0,96,96);streetHudPortraitImage=null}return}
 const row=run?runHudSnapshot():streetHudSnapshot(),threat=run?row.threat:row.boss?{name:row.boss.name,state:{approach:'APPROACHING',warn:'CHARGE WARNING',charge:'CHARGING',recover:'RECOVERING'}[row.phase]||row.phase.toUpperCase(),kind:'breaker',phase:row.phase}:null;
 root.dataset.threat=String(!!threat);hudAttribute('streetHud','aria-label',run?'Run status':'Street practice status');streetHudText('streetSurvivorName',run?row.survivor:'SURVIVOR');streetHudText('runBadge',run?row.badge:'');streetHudText('streetSafetyText',run?(healthFeedback()||'HP'):'HP SAFE');const cue=document.getElementById('streetSafetyText');cue.style.color=run&&healthFeedback()?'#ffd0aa':'';cue.style.fontSize=run&&healthFeedback()?'9px':'';streetHudText('streetClockLabel',run?'SURVIVE':'PRACTICE');streetHudText('streetCountLabel',run?' ELIMS':' TARGETS');
 const badge=document.getElementById('runBadge');if(run&&badge.dataset.color!==row.color){badge.style.color=row.color;badge.dataset.color=row.color}
 streetHudText('streetHealthText',row.health+' / '+row.max);streetHudWidth('streetHealthFill',row.healthPercent);document.getElementById('streetVitals').dataset.health=row.healthPercent<=25?'low':'normal';streetHudWidth('streetXpFill',row.xpPercent);streetHudText('streetXpText',row.xpText);streetHudText('streetTime',row.time);streetHudText('streetTargets',row.targets);streetHudText('streetWeapon',run?'':row.weapon);streetHudText('streetTrialLabel',run?'':streetTrialInfo().name.toUpperCase()+' · UNSCORED');streetHudText('streetTaskTitle',row.title);streetHudText('streetTaskHint',row.hint);
 hudAttribute('streetHealthTrack','role','progressbar');hudAttribute('streetHealthTrack','aria-label','Health');hudAttribute('streetHealthTrack','aria-valuemin',0);hudAttribute('streetHealthTrack','aria-valuemax',p.max);hudAttribute('streetHealthTrack','aria-valuenow',clamp(p.hp,0,p.max));hudAttribute('streetXpTrack','role','progressbar');hudAttribute('streetXpTrack','aria-label',run?'Experience':'Experience disabled in practice');hudAttribute('streetXpTrack','aria-valuemin',0);hudAttribute('streetXpTrack','aria-valuemax',run?nextXp:1);hudAttribute('streetXpTrack','aria-valuenow',run?clamp(xp,0,nextXp):0);hudAttribute('streetXpTrack','aria-valuetext',run?row.xpExact:row.xpText);
 const panel=document.getElementById('streetThreat');panel.hidden=!threat;panel.dataset.phase=threat?.phase||'clear';panel.dataset.kind=threat?.kind||'none';document.getElementById('streetBossTrack').hidden=!row.boss;
 if(threat){streetHudText('streetBossName',threat.name);streetHudText('streetBossHp',row.boss?(run?hudNumber(row.boss.hp)+' / '+hudNumber(row.boss.max):row.boss.hp+' / '+row.boss.max):'');streetHudText('streetBossState',threat.state)}if(row.boss){streetHudWidth('streetBossFill',row.boss.percent);hudAttribute('streetBossTrack','role','progressbar');hudAttribute('streetBossTrack','aria-label',threat.name+' health');hudAttribute('streetBossTrack','aria-valuemin',0);hudAttribute('streetBossTrack','aria-valuemax',row.boss.max);hudAttribute('streetBossTrack','aria-valuenow',row.boss.hp);hudAttribute('streetBossHp','title',row.boss.hp+' / '+row.boss.max+' HP')}
 for(const [id,value] of [['runHudContract',run?row.contract:''],['runHudMedal',run?row.medal:'']]){const el=document.getElementById(id);streetHudText(id,value);el.hidden=!value;hudAttribute(id,'title',value)}document.getElementById('runHudMeta').hidden=!run||!row.contract&&!row.medal;
 if(run){if(streetHudPortraitImage){document.getElementById('streetPortrait').getContext('2d').clearRect(0,0,96,96);streetHudPortraitImage=null}return}
 const art=sampleArtwork.intersection;if(art?.ready&&streetHudPortraitImage!==art.image){const ctx=document.getElementById('streetPortrait').getContext('2d'),[x,y,w,h]=art.frames[0];ctx.clearRect(0,0,96,96);ctx.drawImage(art.image,x+w*.24,y,w*.68,h*.46,0,0,96,96);streetHudPortraitImage=art.image}
}
function updateHUD(){document.getElementById('lockerGoal').textContent=locker?`LOCKER ${bossBearing(locker)} · PAUSE NEARBY TO OPEN`:'';updateMedalTracker();updateDecoyHUD();if(objectiveFocus!=='auto'&&!objectiveTargets().some(t=>t.id===objectiveFocus))objectiveFocus='auto';document.getElementById('hp').style.width=`${100*p.hp/p.max}%`;document.getElementById('healthText').textContent=`${Math.ceil(p.hp)} / ${p.max} HP${healthFeedback()?' · '+healthFeedback():''}`;document.getElementById('healthText').style.color=healthFeedback()?'#ffd0aa':'';document.getElementById('xp').style.width=`${Math.min(100,100*xp/nextXp)}%`;document.getElementById('time').textContent=fmt(elapsed);document.getElementById('kills').textContent=killCount+' KILLS';document.getElementById('level').textContent='LVL '+level;const dashButton=document.getElementById('dash'),ready=p.dashCd<=0;dashButton.textContent=ready?'DASH':p.dashCd.toFixed(1)+'s';dashButton.setAttribute('aria-disabled',String(!ready));dashButton.setAttribute('aria-label',ready?'Dash ready':'Dash recharging');dashButton.style.background=`conic-gradient(#427d70 ${360*(1-p.dashCd/dashCooldown())}deg, #344054 0deg)`;updateEncounterHUD();if(mainPerfTest){document.getElementById('objective').textContent='PERFORMANCE TEST · '+MAIN_PERF_TESTS[mainPerfTest.id].name.toUpperCase()+' · UNSCORED';document.getElementById('runGoal').textContent=(elapsed-mainPerfTest.startedAt<5?'WARM-UP '+Math.ceil(5-elapsed+mainPerfTest.startedAt)+'s · ':'')+'HP SAFE · '+enemies.length+' targets · PAUSE FOR REPORT';document.getElementById('time').textContent=fmt(elapsed-mainPerfTest.startedAt);document.getElementById('kills').textContent=practiceTargets+' TARGETS'}if(training&&trainingScenario==='extraction'){document.getElementById('objective').textContent='EXIT PRACTICE · HP SAFE · UNSCORED';document.getElementById('runGoal').textContent=exitBeacon?'REACH GREEN · CHOOSE EXTRACT OR STAY':'STAY COMPLETE · NEXT PRACTICE EXIT IN '+Math.max(0,Math.ceil(exitAt-elapsed))+'s'}syncStreetHud()}
function end(outcome='defeated'){
  if(runLogged||!['play','paused','extraction'].includes(mode))return;
  runOutcome=['extracted','abandoned'].includes(outcome)?outcome:'defeated';recordRunEvent(runOutcome);runLogged=true;mode='end';
  runResult=Object.freeze(currentRunStats());runComparison=training?null:comparisonSnapshot(runResult);clearInput();shake=0;updateHUD();render();releaseFieldWorld();if(!training||bossLab||mainPerfTest)releaseFieldArtwork();leaveMainPerfTest();
  if(training){runRecordSaved=true;showRunResult();return}
  if(elapsed>record)record=elapsed;runRecordSaved=saveRecord();logCompletedRun();showRunResult();
}
function comparisonSnapshot(stats,history=journal.history,best=record){
 const rows=history.filter(r=>r.survivor===stats.survivor&&r.rule===stats.rule&&r.route===stats.route&&ROUTES.some(route=>route.id===stats.route));
 return Object.freeze({previousBest:best,overallNew:stats.time>best,matched:rows.length,time:rows.length?Math.max(...rows.map(r=>r.time)):null,kills:rows.length?Math.max(...rows.map(r=>r.kills)):null,level:rows.length?Math.max(...rows.map(r=>r.level)):null});
}
function comparisonPanel(){
 const r=runResult,b=runComparison;if(!r||!b)return '';
 const lines=[b.overallNew?`NEW SURVIVAL BEST · +${fmt(Math.max(0,r.time-b.previousBest))} over your previous best`:r.time===b.previousBest?'Matched your survival best.':`${fmt(Math.max(0,b.previousBest-r.time))} short of your survival best.`];
 if(b.matched){
  const compare=(value,previous,format=String)=>value>previous?`new best +${format(value-previous)}`:value===previous?'matched best':`${format(previous-value)} below best`;
  lines.push(`Compared with ${b.matched} prior saved run${b.matched===1?'':'s'} using ${survivorById(r.survivor).name} + ${ruleById(r.rule).name} + ${routeById(r.route).name}, all outcomes:`,`Survival: ${compare(r.time,b.time,fmt)} · Eliminations: ${compare(r.kills,b.kills)} · Level: ${compare(r.level,b.level)}`);
 }else lines.push('First saved run with this survivor, these rules and this route. Set a mark to chase next time.');
 return `<div class="field-card"><h2>YOUR RECORD CHASE</h2>${lines.map(line=>`<p>${line}</p>`).join('')}<p class="muted">Survival best spans all rules and routes. Survivor/rules/route comparison uses only the eight saved runs before this result; older runs without recorded rules or route are excluded.</p></div>`;
}
function runReportText(r=runResult){
 if(!r)return '';
 const lines=['LAST STAND: AFTER DARK — ALPHA 0.86 RUN REPORT',...(r.training?['TRAINING · UNSCORED · NOT SAVED TO RUN LOG']:[]),...mainPerfReportLines(r.perfTest),...(r.bossTest?[`${r.bossTest.boss==='riot'?'RIOT GUARD DRILL':r.bossTest.boss==='spitter'?'SPITTER DRILL':r.bossTest.boss==='howler'?'HOWLER DRILL':r.bossTest.boss==='lobber'?'LOBBER DRILL':r.bossTest.boss==='hunter'?'BLACKOUT HUNTER DRILL':'BOSS TESTING'}: ${r.bossTest.boss} · ${r.bossTest.weapon} · evolution ${r.bossTest.evolved?'ON':'OFF'} · attacks ${r.bossTest.attacks?'ON':'OFF'} · ${r.bossTest.field?'Field':'Classic'} actors`]:[]),`${r.outcome.toUpperCase()} · ${survivorById(r.survivor).name} · ${ruleById(r.rule).name}`,`${r.perfTest?'Test age':'Survived'}: ${fmt(r.perfTest?r.perfTest.duration:r.time)} · Eliminations: ${r.kills} · Level: ${r.level}`,`HP: ${Number(r.hp.toFixed(1))} / ${r.max} · Overtime: ${r.overtime}`,`Bosses: ${r.breakers} Breakers, ${r.wardens} Wardens, ${r.harvesters} Harvesters · Blackouts: ${r.blackouts}`,`Build: ${buildSummary(r)}`,`Route: ${routeById(r.route).name}`,`Gun priority: ${GUN_PRIORITIES[r.gunPriority]||'Not recorded'}`,`Hits: ${r.hitsTaken} · HP lost to hits: ${Number(r.damageTaken.toFixed(1))} · Armor prevented: ${Number(r.armorPrevented.toFixed(1))}`,`Last hit: ${threatName(r.lastThreat)}`,`Salvage: ${r.salvages} · Rescues: ${r.rescues} · Convoys: ${r.convoys} · Drops: ${r.drops}`,`Fuel barrels: ${r.barrels} · Barricades: ${r.barricades} · Shock drums: ${r.shocks} · Stuns: ${r.shockStuns}`,`Decoys: ${r.decoys} · Distinct enemies lured: ${r.decoyLured}`,`Medical caches: ${r.supplies} · Cache HP restored: ${Number(r.supplyHealing.toFixed(1))}`,`Field lockers: ${r.lockers}`,`Patrol checkpoints: ${r.patrols}`,`Contract: ${contractSummary(r)}`,`Medals: ${earnedMedals(r).map(m=>m.name).join(', ')||'None'}`,`First recorded defeats: ${ENEMY_GUIDE.filter(e=>r.newDiscoveries.includes(e.id)).map(e=>e.name).join(', ')||'None this run'}`,'','ENEMY ELIMINATIONS',...ENEMY_GUIDE.map(e=>`${e.name}: ${r.enemyTally[e.id]}`),'','WEAPON CONTRIBUTIONS (actual HP removed / final-hit kills)',...Object.entries(WEAPON_LABELS).map(([id,name])=>`${name}: ${Number(r.weapons[id].damage.toFixed(1))} / ${r.weapons[id].kills}`)];
 if(!r.training)lines.push('','BUILD PROGRESSION',...buildProgressLines(r.progression));
 if(r.pace)lines.push('','RUN PACE (active minutes; latest 60)',...r.pace.map(b=>`Minute ${b.minute+1}: ${b.kills} eliminations · ${b.hpLost} HP lost to hits`));
 if(r.practice)lines.push('','PRACTICE STATISTICS (unscored; since last reset)',`Would-be hits: ${r.practice.threats} · Last: ${threatName(r.practice.lastThreat)}`,`${r.practice.label||TRAINING_SCENARIOS[r.practice.scenario]} · ${fmt(r.practice.time)} active time · ${Number(r.practice.damage.toFixed(1))} HP removed · ${r.practice.hits} damage hits · ${r.practice.targets} targets broken · ${Number(r.practice.average.toFixed(1))} average HP/s`,...Object.entries(WEAPON_LABELS).map(([id,name])=>`${name}: ${Number(r.practice.weapons[id].damage.toFixed(1))} / ${r.practice.weapons[id].kills} targets broken`));
 lines.push('','RUN TIMELINE (latest 40 events)',...r.timeline.map(row=>`${fmt(row.time)} ${RUN_EVENT_LABELS[row.kind]}`));if(r.timelineDropped)lines.push(`${r.timelineDropped} earlier events omitted.`);
 return lines.join('\n')+'\n';
}
function showRunReport(){
 if(mode!=='end'||!runResult)return;mode='report';
 show(`<div class="eyebrow">YOUR FINISHED RUN</div><h1 style="font-size:44px">RUN REPORT</h1><p>Download a text report or select and copy it. Share it yourself wherever you choose. No message is sent automatically.</p><label for="runReportText">REPORT TEXT</label><textarea id="runReportText" class="save-text" rows="12" readonly></textarea><button class="btn" id="reportDownload">DOWNLOAD REPORT TXT</button><p id="reportMessage" role="status"></p><button class="btn secondary" id="reportBack">BACK TO RESULTS</button>`);
 document.getElementById('runReportText').value=runReportText();
 bindPress(document.getElementById('reportDownload'),downloadRunReport);bindPress(document.getElementById('reportBack'),()=>{if(mode==='report')showRunResult()});
}
function downloadRunReport(){
 if(mode!=='report'||!runResult||document.hidden)return;
 try{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([runReportText()],{type:'text/plain;charset=utf-8'}));a.download='Last_Stand_After_Dark_Alpha_0_86_Run.txt';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);document.getElementById('reportMessage').textContent='Download requested. The text is also available above.'}catch{document.getElementById('reportMessage').textContent='Download unavailable here; select and copy the report text.'}
}
function retryRunSave(result){
 if(mode!=='end'||document.hidden||runResult!==result||result.training||journal.readOnly)return;runRecordSaved=saveRecord();saveJournal();showRunResult();
}
function showRunResult(){
  if(!runResult||!runLogged||!['end','bestiary','weapons','settings','backup','manual','report'].includes(mode))return;mode='end';
  const saved=runRecordSaved;
  const r=runResult,medals=earnedMedals(r),saveWarning=!r.training&&(!saved||!journal.available);
  const cells=[[fmt(r.perfTest?r.perfTest.duration:r.time),r.perfTest?'TEST TIME':'SURVIVED'],[r.kills,'ELIMINATIONS'],[r.level,'LEVEL'],[`${Math.ceil(r.hp)} / ${r.max}`,'HP REMAINING'],[r.breakers,'BREAKERS DEFEATED'],[r.wardens,'WARDENS DEFEATED'],[r.harvesters,'HARVESTERS DEFEATED'],[r.blackouts,'BLACKOUTS SURVIVED'],[r.barrels,'FUEL BARRELS'],[r.barricades,'BARRICADES CLEARED'],[r.blastKills,'BLAST ELIMINATIONS'],[r.overtime,'OVERTIME PUSHES'],[r.spitters,'SPITTERS DEFEATED'],[r.riotGuards,'RIOT GUARDS'],[r.enemyTally.howler,'HOWLERS DEFEATED'],[r.enemyTally.lobber,'LOBBERS DEFEATED'],[r.decoys,'DECOYS USED'],[r.decoyLured,'DISTINCT ENEMIES LURED'],[r.lockers,'FIELD LOCKERS'],[r.shocks,'SHOCK DRUMS'],[r.shockStuns,'STUN APPLICATIONS'],[r.hitsTaken,'HITS TAKEN'],[Number(r.damageTaken.toFixed(1)),'HP LOST TO HITS'],[Number(r.armorPrevented.toFixed(1)),'DAMAGE STOPPED BY ARMOR'],[r.rescues,'SURVIVORS RESCUED'],[r.fireKills,'FIRE ELIMINATIONS'],[r.convoys,'CONVOYS INTERCEPTED'],[r.drops,'SUPPLY DROPS'],[r.dropXp,'DROP XP RECOVERED'],[r.salvages,'SALVAGE HOLDOUTS'],[r.supplies,'MEDICAL CACHES'],[Number(r.supplyHealing.toFixed(1)),'CACHE HP RESTORED']];
  if(r.survivor==='engineer')cells.push([r.scrapRefreshes,'SCRAPWORK REFRESHES'],[Number(r.scrapRecovered.toFixed(1)),'DASH SECONDS RECOVERED']);
  show(`<div class="eyebrow">${r.perfTest?'MAIN GAME PERFORMANCE TEST · UNSCORED':r.training?(r.bossTest?(r.bossTest.boss==='riot'?'RIOT GUARD DRILL COMPLETE · UNSCORED':r.bossTest.boss==='spitter'?'SPITTER DRILL COMPLETE · UNSCORED':r.bossTest.boss==='howler'?'HOWLER DRILL COMPLETE · UNSCORED':r.bossTest.boss==='lobber'?'LOBBER DRILL COMPLETE · UNSCORED':r.bossTest.boss==='hunter'?'BLACKOUT HUNTER DRILL COMPLETE · UNSCORED':'BOSS TESTING COMPLETE · UNSCORED'):'TRAINING COMPLETE · UNSCORED'):r.outcome==='extracted'?'EXTRACTION COMPLETE':'RUN COMPLETE'}</div><h1 class="result-title">${r.perfTest?'PERFORMANCE<br>TEST COMPLETE.':r.training&&r.practice?.scenario==='extraction'?'EXIT PRACTICE<br>COMPLETE.':r.outcome==='extracted'?'EXTRACTED.<br>YOU MADE IT.':r.outcome==='abandoned'?'RUN ENDED.':'THE NIGHT<br>WON.'}</h1><p class="result-note">${r.training?'Training does not change records, medals, discoveries or saved runs.':'Run finished. The action is stopped.'}<br>These stats stay here until you choose what to do next.</p>${saveWarning?`<p class="contract-note" role="status">${journal.readOnly?'NEWER RUN LOG · This run is temporary in this build.':'RECORDS NOT FULLY SAVED · Export a backup before closing.'}</p>${journal.readOnly?'':'<button class="btn secondary" id="endBackup">SAVE BACKUP</button><button class="btn secondary" id="retryRunSave">TRY SAVING AGAIN</button>'}`:''}<h2 class="result-label">THIS RUN’S STATS</h2><p>Survivor: ${survivorById(r.survivor).name} · ${routeById(r.route).name} · ${ruleById(r.rule).name}</p><div class="result-stats result-summary">${cells.slice(0,4).map(([value,label])=>`<div><strong>${value}</strong><small>${label}</small></div>`).join('')}</div>${!r.training?`<p class="medal-line">${runComparison?.overallNew?'NEW SURVIVAL BEST · ':'Personal best: '}${fmt(record)}</p>`:''}<div class="result-actions result-next"><button class="btn" id="again">${r.perfTest?'RESTART TEST':'ONE MORE RUN ↗'}</button><button class="btn secondary" id="changeSurvivor">CHANGE SURVIVOR</button><button class="btn secondary" id="resultMenu">MAIN MENU</button></div>${r.perfTest?`<p>${mainPerfReportLines(r.perfTest).map(hudEscape).join('<br>')}</p>`:''}${practicePanel(r.practice)}<details class="medal-goals menu-section" id="resultStats"><summary>ALL RUN STATS</summary><p class="muted">Last hit: ${threatName(r.lastThreat)}${r.secondWind?` · Second Wind ${r.windSpent?'used':'unused'}`:''}</p>${r.survivor==='engineer'?`<p class="muted">${survivorById(r.survivor).hint}</p>`:''}<div class="result-stats">${cells.slice(4).map(([value,label])=>`<div><strong>${value}</strong><small>${label}</small></div>`).join('')}</div>${contractPanel(r)}${ruleNote(r)}${routeNote(r)}</details><details class="medal-goals menu-section" id="resultBuild"><summary>BUILD &amp; RUN ANALYSIS</summary><p class="muted">Build: ${buildSummary(r)}<br>${r.damage.toFixed(0)} weapon damage · ${(1/r.fire).toFixed(1)} gun volleys/sec<br>${Math.round(r.speed)} movement speed · ${r.regen.toFixed(1)} HP/sec regeneration</p>${!r.training?buildProgressPanel(r.progression)+pacePanel(r.pace):''}${weaponPanel(r.weapons)}${timelinePanel(r)}</details><details class="medal-goals menu-section" id="resultRecords"><summary>RECORDS &amp; MEDALS · ${medals.length}/${RUN_MEDALS.length}</summary><p>Personal best: ${fmt(record)} · all rules and routes</p>${comparisonPanel()}${discoveryPanel(r.newDiscoveries)}<h2 class="result-label">MEDALS THIS RUN · ${medals.length}/${RUN_MEDALS.length}</h2><div class="medal-list">${medals.length?medals.map(m=>`<div class="run-medal"><b>✦ ${m.name}</b><small>${m.hint}</small></div>`).join(''):`<p class="muted">${r.training?'Practice does not award run medals.':'No medals this time. Every run is a fresh attempt.'}</p>`}</div><details class="medal-goals"><summary>VIEW ALL MEDAL GOALS</summary>${medalGoals()}</details></details><details class="medal-goals menu-section" id="resultTools"><summary>REPORTS, BACKUP &amp; GUIDES</summary><div class="result-actions"><button class="btn secondary" id="endRunLog">RUN LOG</button><button class="btn secondary" id="endReport">${r.perfTest?'TEST REPORT TXT':'RUN REPORT TXT'}</button><button class="btn secondary" id="endBestiary">BESTIARY</button><button class="btn secondary" id="endWeapons">WEAPON GUIDE</button>${saveWarning&&!journal.readOnly?'':'<button class="btn secondary" id="endBackup">SAVE BACKUP</button>'}<button class="btn secondary" id="endGuide">FIRST RUN GUIDE</button><button class="btn secondary" id="endManual">FIELD MANUAL</button><button class="btn secondary" id="endSettings">SETTINGS</button></div></details><p class="muted">${journalNote()}${saved?'':'<br>Browser storage is unavailable; this best time lasts for this visit.'}</p>`);
  if(saveWarning&&!journal.readOnly)bindResultPress(document.getElementById('retryRunSave'),()=>retryRunSave(r));
  bindResultPress(document.getElementById('again'),()=>{if(runResult?.perfTest)startMainPerfTest(runResult.perfTest.id,runResult.perfTest);else if(runResult?.bossTest)startBossTesting(runResult.bossTest.boss,runResult.bossTest);else if(runResult?.training&&streetSession)startStreetPrototype();else if(runResult?.training)startTraining(trainingWeapon,trainingEvolved,trainingScenario,artSession);else start()});
  bindResultPress(document.getElementById('changeSurvivor'),showRoster);
  bindResultPress(document.getElementById('endRunLog'),showJournal);bindResultPress(document.getElementById('endReport'),showRunReport);
  bindResultPress(document.getElementById('endBestiary'),showBestiary);
  bindResultPress(document.getElementById('endWeapons'),showWeaponGuide);
  bindResultPress(document.getElementById('endGuide'),showQuickGuide);bindResultPress(document.getElementById('endManual'),showManual);bindResultPress(document.getElementById('endBackup'),showBackup);bindResultPress(document.getElementById('endSettings'),showSettings);bindResultPress(document.getElementById('resultMenu'),menu);
}
// Results require a new down/up on the same button. The finishing touch's release
// and compatibility click cannot activate a button that appeared underneath it.
function bindResultPress(button,action){const result=runResult;bindUpgradePress(button,action,()=>mode==='end'&&runResult===result,0)}
function showEndRunConfirm(){
 if(mode!=='paused'||document.hidden)return;if(training){end('abandoned');return}mode='end-confirm';
 show(`<div class="eyebrow">RUN PAUSED</div><h1 style="font-size:44px">END THIS RUN?</h1><p>${fmt(elapsed)} survived · ${killCount} eliminations.</p><p>End now to record this run and view its stats. This is not an extraction victory. Your current weapon build cannot be resumed afterward.</p><button class="btn secondary" id="cancelEndRun">BACK TO PAUSE</button><p><button class="btn" id="confirmEndRun">END RUN AND VIEW STATS</button></p>`);
 bindPress(document.getElementById('cancelEndRun'),cancelEndRun);bindUpgradePress(document.getElementById('confirmEndRun'),()=>{mode='paused';end('abandoned')},()=>mode==='end-confirm');
}
function cancelEndRun(){if(mode!=='end-confirm')return;mode='play';pause()}
function resume(){if(mode!=='paused'||document.hidden)return;clearInput();last=performance.now();mode='play';hide();unlockAudio()}
const GUN_PRIORITIES=Object.freeze({nearest:'Nearest enemy',weakest:'Lowest current HP',threats:'Specialists and bosses first'});
function steadyMultiplier(){return p.steady&&p.stillTime>=.6?1.15:1}
function gunTarget(){
 const candidates=enemies.filter(e=>e.hp>0&&dist(e,p)<p.range&&(!streetSession||!streetBlocked(p,e)));if(!candidates.length)return null;
 const special=e=>e===activeBoss||e.spitter||e.riot||e.howler||e.lobber;
 return candidates.reduce((a,e)=>{
  if(p.gunPriority==='weakest'&&e.hp!==a.hp)return e.hp<a.hp?e:a;
  if(p.gunPriority==='threats'&&!!special(e)!==!!special(a))return special(e)?e:a;
  return dist(e,p)<dist(a,p)?e:a;
 });
}
function renderAimDisplay(target=gunTarget()){
 if(!preferences.aim||!['play','paused'].includes(mode))return;
 g.save();g.strokeStyle='#ffe0a044';g.lineWidth=1;g.setLineDash([8,8]);g.beginPath();g.arc(p.x,p.y,p.range,0,Math.PI*2);g.stroke();
 if(target&&target.hp>0){g.strokeStyle='#ffe0a099';g.lineWidth=2;g.beginPath();g.moveTo(p.x,p.y);g.lineTo(target.x,target.y);g.stroke();g.setLineDash([]);g.beginPath();g.arc(target.x,target.y,target.r+8,0,Math.PI*2);g.stroke();g.fillStyle='#ffe0a0';g.font='bold 9px system-ui';g.textAlign='center';g.fillText('GUN TARGET',target.x,target.y-target.r-16)}g.restore();
}
function selectGunPriority(value){if(mode!=='paused'||!Object.prototype.hasOwnProperty.call(GUN_PRIORITIES,value))return;p.gunPriority=value;document.getElementById('gunPriorityPick').value=value}
function gunPriorityPicker(){return `<div class="contract-picker"><label for="gunPriorityPick">GUN TARGET PRIORITY</label><select id="gunPriorityPick">${Object.entries(GUN_PRIORITIES).map(([id,name])=>`<option value="${id}">${name}</option>`).join('')}</select><p class="muted">Gun only, within normal range. Cover and shields still block shots. Other weapons keep their own targeting. Resets to Nearest on a new run.</p></div>`}
function buildSheet(){
 const fmtStat=n=>Number(n.toFixed(2));
 const progress=buildProgressSnapshot();
 const rows=[...(!training&&progress?[['XP',`${xp} / ${nextXp} toward next XP upgrade · ${progress.collected} collected`],['Upgrade choices',`${progress.xpChoices} from XP · ${progress.bonusChoices} bonus · first chosen ${progress.firstChoice===null?'not yet':fmt(progress.firstChoice)}`]]:[]),['Gun targeting',GUN_PRIORITIES[p.gunPriority]],['Gun',`${fmtStat(p.damage*(p.rail?1.25:1)*steadyMultiplier())} per bullet · ${p.proj} bullet${p.proj===1?'':'s'} per volley · ${fmtStat(1/p.fire)} volleys/s · up to ${p.rail?8:p.pierce+1} targets per bullet`]];
 if(p.arc)rows.push([p.thunder?'Thunderweb':'Chain Lightning',`${fmtStat(p.damage*(p.thunder?1:.8))} per target · up to ${p.thunder?8:p.arc+2} distinct targets · ${fmtStat(p.thunder?.8:1.35-(p.arc-1)*.175)}s successful-strike interval`]);
 if(p.blades)rows.push([p.reaper?'Reaper Ring':'Orbiting Blades',`${p.reaper?6:p.blades+1} blades · ${fmtStat(p.damage*(p.reaper?1.35:1.1))} per hit · ${p.reaper?.35:.45}s per-target interval${p.reaper?' · blocks hostile shots':''}`]);
 if(p.molotov){const f=molotovStats();rows.push([p.wildfire?'Wildfire':'Molotov',`${fmtStat(p.damage*f.multiplier)} per ${MOLOTOV_TUNING.tick}s tick · radius ${f.radius} · ${f.cooldown}s volley interval · up to ${f.count} bottle${f.count===1?'':'s'} · overlapping burns do not stack`])}
 rows.push(['Blade Reach',p.bladeReach?`Owned · orbit radius ${bladeRadius()}; damage and count unchanged`:'Not owned'],['Arc Relay',p.arcRelay?'Owned · lightning jumps +20%; first range and target cap unchanged':'Not owned'],['Evasive Reload',p.evasive?(evasiveMultiplier()>1?'READY · next gun volley +20%':'Dash to prime one volley for 2s'):'Not owned'],['Steady Aim',p.steady?(steadyMultiplier()>1?'READY · gun damage +15%':'Stand still for 0.6s to activate'):'Not owned'],['Decoy',`${decoyCharges} charge${decoyCharges===1?'':'s'} remaining · ${decoy?'active':'not active'} · Pouch ${p.decoyPouch?'owned':'not owned'}`],['Survival',`${fmtStat(p.hp)} / ${fmtStat(p.max)} HP · ${fmtStat(p.regen)} HP/s regeneration · Armor ${p.armor}/3${p.secondWind?' · Second Wind '+(p.windSpent?'spent':'ready'):''}`],['Movement',`${fmtStat(p.speed)} units/s · Dash ${dashCooldown().toFixed(2)}s recharge · ${p.dashCd.toFixed(1)}s remaining`],['Pickup',`${fmtStat(p.magnet)} units pickup reach · supply-drop sweep ${dropSweepRadius()} units`],['Choices',`Reroll ${rerollsLeft} · Banish ${banishesLeft}${banished.size?' · Banished: '+[...banished].join(', '):''}`]);
 return `<details class="medal-goals"><summary>INSPECT CURRENT BUILD</summary><p class="muted">Current values, not guaranteed damage per second. Range, line-up, shields, cover, and targets affect hits. All upgrades reset next run.</p><div class="field-list">${rows.map(([name,value])=>`<div><b>${name}</b><p>${value}</p></div>`).join('')}</div><p class="evolution-hint">${evolutionHint()}</p></details>`;
}
function encounterBriefing(){
 if(training)return '<details class="medal-goals"><summary>ENCOUNTER BRIEFING</summary><p>Unscored practice. Timed street encounters and extraction are disabled.</p></details>';
 const eta=t=>Number.isFinite(t)?fmt(Math.max(0,Math.ceil(t-elapsed))):'not scheduled';
 const boss=activeBoss?`${bossName(activeBoss)} active · ${ENEMY_GUIDE.find(e=>e.id===activeBoss.bossKind)?.counter||'Keep moving.'}`:`${bossName()} due in ${eta(nextBossAt)} · a ten-second warning comes first.`;
 const kinds=['spitter','riot','howler','lobber'].map(id=>({id,count:enemies.filter(e=>e.hp>0&&e[id]).length})).filter(row=>row.count);
 return `<details class="medal-goals"><summary>ENCOUNTER BRIEFING</summary><p>${boss}</p><p>Blackout: ${rushPhase==='active'?'ACTIVE · keep a route through the marked edges':rushPhase==='warning'?'WARNING · prepare to move':Number.isFinite(nextRushAt)?'due in '+eta(nextRushAt):'waiting for the next boss defeat'}.</p><p>${exitBeacon?'Green exit open':elapsed<exitAt?'Extraction time in '+eta(exitAt):'Extraction time reached'} · ${bossesDefeated?'boss requirement met':'defeat the first boss'}${activeBoss||rushPhase==='active'||rushPhase==='warning'?' · finish the active encounter first':''}.</p>${kinds.length?kinds.map(row=>`<p>${ENEMY_GUIDE.find(e=>e.id===row.id).name} ×${row.count}: ${ENEMY_GUIDE.find(e=>e.id===row.id).counter}</p>`).join(''):'<p>No living specialists in the street.</p>'}<p class="muted">Active gameplay time only. Specialist arrivals wait for quiet windows. Pausing freezes all clocks.</p></details>`;
}
function pauseRunSummary(){
 const cells=[[`${Math.max(0,Math.ceil(p.hp))} / ${Math.ceil(p.max)}`,'HP REMAINING'],[level,'LEVEL'],[fmt(mainPerfTest?elapsed-mainPerfTest.startedAt:elapsed),mainPerfTest?'TEST ACTIVE':training?'PRACTICE CLOCK':'SURVIVED'],[killCount,'ELIMINATIONS']];
 return `<div class="result-stats result-summary" aria-label="Current run">${cells.map(([value,label])=>`<div><strong>${value}</strong><small>${label}</small></div>`).join('')}</div><p class="muted">${survivorById(runSurvivor).name} · ${routeById(runRoute).name} · ${ruleById(runRule).name}${training?' · UNSCORED':''}</p>`;
}
function pauseExitBriefing(){
 if(training)return `<p class="muted">${trainingScenario==='extraction'?'Exit practice · use the green beacon to Extract or Stay. Repeat exits take 10 active seconds.':'Unscored practice · normal-run extraction is disabled.'}</p>`;
 if(exitBeacon)return `<section class="medal-goals" id="pauseExit" aria-label="Extraction status"><h2 class="result-label">GREEN EXIT OPEN</h2><p>Reach the green beacon ${hudEscape(bossBearing(exitBeacon))}. Choose Extract to finish on your stats, or Stay for overtime.</p><p class="muted">You do not need to clear the ordinary horde.</p></section>`;
 const blockers=[activeBoss&&`defeat the active ${bossName(activeBoss)}`,(rushPhase==='active'||rushPhase==='warning')&&'finish the Blackout'].filter(Boolean);
 const time=elapsed>=exitAt?'✓ Time reached':Number.isFinite(exitAt)?`${fmt(Math.max(0,Math.ceil(exitAt-elapsed)))} until ${overtime?'the next exit':'03:00 extraction'}`:'Exit time not scheduled';
 return `<section class="medal-goals" id="pauseExit" aria-label="Extraction status"><h2 class="result-label">${overtime?'NEXT EXIT':'EXTRACTION'} CHECKLIST</h2><ul class="pause-checklist"><li>${time}</li><li>${bossesDefeated?'✓ Boss requirement met':'Defeat at least one boss'}</li><li>${blockers.length?hudEscape(blockers.join(' and ')):'✓ No active boss or Blackout'}</li></ul><p class="muted">The green beacon opens when all three are met. Ordinary enemies and optional objectives do not block it. All clocks are frozen while paused.</p></section>`;
}
function pause(reason=''){
  if(mode==='play'){
    mode='paused';
    show(`<div class="eyebrow">${training?'TRAINING · UNSCORED':'TIME OUT'}</div><h1 style="font-size:50px">PAUSED</h1><button class="btn" id="resume">RESUME →</button>${mainPerfTest?mainPerfControls():''}<p>${reason||'Take a breath. The night can wait.'}</p>${pauseRunSummary()}${pauseExitBriefing()}${runSurvivor==='engineer'?`<p class="muted">${survivorById(runSurvivor).hint}</p>`:''}<p class="muted">Upgrade reroll: ${rerollsLeft?rerollsLeft+' available':'used this run'}.</p><p class="muted">Build: ${buildSummary()}${overtime?`<br>Overtime ${overtime} · next exit in ${fmt(Math.max(0,Math.ceil(exitAt-elapsed)))}`:""}</p>${runHudPauseControls()}<details class="medal-goals" id="pauseAudio"><summary>AUDIO · VOLUME &amp; SOUND</summary>${audioControls(true)}</details>${lockerPauseControl()}<details class="medal-goals"><summary>RUN BUILD &amp; ENCOUNTERS</summary>${contractPanel()}${ruleNote()}${routeNote()}${buildSheet()}${encounterBriefing()}${practicePanel()}</details>${trainingControls()}${samplePauseControls()}<details class="medal-goals"><summary>COMBAT &amp; OBJECTIVE OPTIONS</summary>${gunPriorityPicker()}${favoredPicker()}${objectivePicker()}${medalTrackerPicker()}</details><details class="medal-goals"><summary>RUN MEDALS · ${earnedMedals(currentRunStats()).length}/${RUN_MEDALS.length} EARNED</summary>${medalGoals()}<p class="muted">Progress: ${bossesDefeated}/2 Bosses · ${barrelsBlown}/5 barrels · Overtime ${overtime}<br>New goals: ${rescuesCompleted}/1 delivered · ${shockStuns}/20 shock stuns · ${EVOLUTIONS.filter(e=>p[e.weapon]===3&&p[e.field]).length}/2 evolved paths.<br>Extraction medals are awarded when you leave successfully.</p></details><p><button class="btn secondary" id="pauseMap">TACTICAL MAP</button></p><details class="medal-goals"><summary>HELP &amp; REFERENCE</summary><p><button class="btn secondary" id="pauseGuide">FIRST RUN GUIDE</button></p><p><button class="btn secondary" id="pauseManual">FIELD MANUAL</button></p></details><p><button class="btn secondary" id="pauseSettings">SETTINGS</button></p><p><button class="btn secondary" id="quit">END RUN</button></p>`);
    if(document.getElementById('fieldWorldCompare')){const worldButton=document.getElementById('fieldWorldCompare');bindPress(worldButton,()=>{if(worldButton.isConnected)selectFieldWorld(preferences.scenery==='street'?'classic':'street')})}
    if(document.getElementById('fieldActorCompare'))bindPress(document.getElementById('fieldActorCompare'),()=>selectFieldActors(fieldStyle()==='field'?'classic':'field'));if(document.getElementById('runHudCompare'))bindPress(document.getElementById('runHudCompare'),()=>selectRunHud(preferences.hud==='composed'?'classic':'composed'));bindAudioControls();if(document.getElementById('pauseLocker'))bindPress(document.getElementById('pauseLocker'),showLocker);bindFavoredPicker();if(training)bindTrainingControls();bindSamplePause();
    const medalPicker=document.getElementById('medalPick');medalPicker.value=trackedMedal;medalPicker.addEventListener('change',()=>{if(medalPicker.isConnected)selectTrackedMedal(medalPicker.value)});
    const gunPicker=document.getElementById('gunPriorityPick');gunPicker.value=p.gunPriority;gunPicker.addEventListener('change',()=>{if(gunPicker.isConnected)selectGunPriority(gunPicker.value)});
    const picker=document.getElementById('objectivePick');picker.value=objectiveFocus;picker.addEventListener('change',()=>{if(picker.isConnected)selectObjective(picker.value)});
    bindPress(document.getElementById('pauseGuide'),showQuickGuide);bindPress(document.getElementById('pauseMap'),showTacticalMap);bindPress(document.getElementById('pauseManual'),showManual);bindPress(document.getElementById('pauseSettings'),showSettings);bindPress(document.getElementById('resume'),resume);
    bindPress(document.getElementById('sound'),()=>{musicOn=!musicOn;preferences.sound=musicOn;applyAudioMix();savePreferences();refreshAudioControls();document.getElementById('sound').textContent='Sound: '+(musicOn?'ON':'OFF');if(musicOn)sound(320,.06,'sine')});
    bindPress(document.getElementById('quit'),showEndRunConfirm);
  }else if(mode==='paused'){resume()}
}
// Non-primary touch pointers need pointerdown: browsers may omit their click.
// Real pointer clicks are ignored here so a delayed click cannot toggle twice.
function bindPress(button,action){
  button.addEventListener('pointerdown',e=>{if(e.button!==0||!button.isConnected||document.hidden)return;e.preventDefault();action()});
  button.onclick=e=>{if(e.detail===0&&button.isConnected&&!document.hidden)action()};
}
bindPress(document.getElementById('pause'),()=>pause());
bindPress(document.getElementById('regroup'),regroupRescue);bindPress(document.getElementById('decoy'),deployDecoy);
document.addEventListener('keydown',e=>{
  const key=e.key.toLowerCase();
  if(document.hidden)return;if(key==='escape'){e.preventDefault();if(!e.repeat)gameBack();return}
  if(mode!=='play'&&['SELECT','INPUT','TEXTAREA','BUTTON','SUMMARY'].includes(e.target?.tagName))return;
  if([' ','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))e.preventDefault();
  if(key==='p'&&!e.repeat){pause();return}
  if(mode!=='play')return;
  if(key==='r'&&!e.repeat){regroupRescue();return}
  if(key==='q'&&!e.repeat){deployDecoy();return}
  keys[key]=true;
  if(e.code==='Space'&&!e.repeat)dash();
});
document.addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
function movementInput(){let x=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0)+touch.x,y=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0)+touch.y;const length=Math.hypot(x,y);if(length>1){x/=length;y/=length}return streetSession&&streetAngled?streetDirection(x,y):{x,y}}
function dashCooldown(rank=p.capacitor||0){return (survivorById(runSurvivor).dash||2.5)-.25*Math.min(2,rank)}
function dash(){if(mode==='play'&&p.dashCd<=0){const move=movementInput(),length=Math.hypot(move.x,move.y);if(length>0){lastMove.x=move.x/length;lastMove.y=move.y/length}p.stillTime=0;if(p.evasive)p.evasiveUntil=elapsed+2;p.dashX=lastMove.x;p.dashY=lastMove.y;p.dash=.17;p.dashCd=dashCooldown();p.inv=Math.max(p.inv,.25);updateHUD();combatCue('dash',190,.14,'sawtooth',.02)}}
bindPress(document.getElementById('dash'),dash);
let stick=document.getElementById('stick'),nub=document.getElementById('nub');
function moveStick(e){
  const r=stick.getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2,l=Math.hypot(x,y),f=clamp((l-6)/39,0,1);
  touch.x=l?x/l*f:0;touch.y=l?y/l*f:0;
  nub.style.transform=`translate(${touch.x*38}px,${touch.y*38}px)`;
}
stick.addEventListener('pointerdown',e=>{
  if(mode!=='play'||touch.id!==null)return;
  e.preventDefault();touch.id=e.pointerId;stick.setPointerCapture(e.pointerId);moveStick(e);
});
stick.addEventListener('pointermove',e=>{if(e.pointerId===touch.id)moveStick(e)});
function resetStick(){
  const id=touch.id;touch.x=touch.y=0;touch.id=null;nub.style.transform='';
  if(id!==null&&stick.hasPointerCapture(id))stick.releasePointerCapture(id);
}
function finishStick(e){if(e.pointerId===touch.id)resetStick()}
stick.addEventListener('pointerup',finishStick);
stick.addEventListener('pointercancel',finishStick);
stick.addEventListener('lostpointercapture',finishStick);
let inputEpoch=0,phoneWide=W>H;
function clearInput(){inputEpoch++;breakPerformanceSegment();for(const key of Object.keys(keys))delete keys[key];resetStick()}
function suspendGame(){stopAudioVoices();musicTrack.preview=false;stopBackgroundMusic();clearInput();if(mode==='play')pause('Paused when you left the game. Tap resume when you are ready.');if(audioCtx&&audioCtx.state==='running')audioCtx.suspend().catch(()=>{})}
addEventListener('blur',suspendGame);
addEventListener('pagehide',suspendGame);
document.addEventListener('visibilitychange',()=>{if(document.hidden)suspendGame()});
document.addEventListener('freeze',suspendGame);
addEventListener('resize',()=>{clearInput();const wide=W>H;if(wide!==phoneWide){phoneWide=wide;if(mode==='play')pause('Screen rotated. Resume when you are ready.')}if(mode==='end')render()});

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
function renderEnemy(e,ctx=g,portrait=false){if(!portrait&&fieldActorsActive()&&!preferences.reduced&&e.hp<=0&&fieldArt.combat.dead.has(e))return;const field=!portrait&&fieldActorsActive()&&(fieldEnemyKind(e)||fieldBreakerActive(e)&&'breaker'||fieldWardenActive(e)&&'warden'||fieldHarvesterActive(e)&&'harvester'||fieldRiotActive(e)&&'riot'||fieldSpitterActive(e)&&'spitter'||fieldHowlerActive(e)&&'howler'||fieldLobberActive(e)&&'lobber'||fieldHunterActive(e)&&'hunter');if(field)drawFieldActor(ctx,e,field);else if(sampleLookActive()&&sampleEnemyKind(e))drawSamplePerson(ctx,e,sampleEnemyKind(e));else{ctx.fillStyle='#050a11a8';ctx.beginPath();ctx.ellipse(e.x+4,e.y+e.r*.8,e.r*.9,e.r*.4,0,0,7);ctx.fill();ctx.fillStyle=e.hit?'#fff1dc':e.col;ctx.beginPath();ctx.arc(e.x,e.y,e.r,0,7);ctx.fill();ctx.strokeStyle='#131826';ctx.lineWidth=3;ctx.stroke();ctx.fillStyle='#131826';ctx.fillRect(e.x-e.r*.5,e.y-e.r*.18,e.r*.28,e.r*.22);ctx.fillRect(e.x+e.r*.2,e.y-e.r*.18,e.r*.28,e.r*.22);}if(e===activeBoss||portrait&&e.bossKind){ctx.strokeStyle=e.phase==='recover'?'#ffe9a0':'#ff879f';ctx.lineWidth=3;ctx.beginPath();ctx.arc(e.x,e.y,e.r+7,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#ffd0d9';ctx.font='bold 11px system-ui';ctx.textAlign='center';ctx.fillText(bossName(e),e.x,field==='breaker'||field==='warden'||field==='harvester'?e.y+e.r*.6-FIELD_ACTOR_HEIGHTS[field]-22:e.y-e.r-22);if(e.bossKind==='warden'){ctx.strokeStyle='#c0f2ff';ctx.lineWidth=3;ctx.beginPath();for(let i=0;i<6;i++){const a=i*Math.PI/3,x=e.x+Math.cos(a)*(e.r+10),y=e.y+Math.sin(a)*(e.r+10);if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y)}ctx.closePath();ctx.stroke()}}if(howlMultiplier(e)>1){ctx.strokeStyle='#ffe58a';ctx.lineWidth=2;ctx.beginPath();ctx.arc(e.x,e.y,e.r+3,0,Math.PI*2);ctx.stroke()}if(e.bossKind==='harvester')renderHarvester(e,ctx);if(e.lobber)renderLobber(e,ctx,field==='lobber');if(e.howler)renderHowler(e,ctx,field==='howler');if(e.riot)renderRiot(e,ctx,field==='riot');if(e.spitter){ctx.fillStyle='#ffe3ee';ctx.font='bold 10px system-ui';ctx.textAlign='center';ctx.fillText(e.phase==='aim'?'SPITTER !':'SPITTER',e.x,field==='spitter'?e.y+e.r*.6-FIELD_ACTOR_HEIGHTS.spitter-22:e.y-e.r-22);ctx.strokeStyle='#ffd1e0';ctx.lineWidth=2;ctx.strokeRect(e.x-6,e.y-4,12,8)}if(e.type>=2||e.trainingDummy){const barY=field?e.y+e.r*.6-FIELD_ACTOR_HEIGHTS[field]-12:e.y-e.r-12;ctx.fillStyle='#171822';ctx.fillRect(e.x-e.r,barY,e.r*2,5);ctx.fillStyle='#ef6685';ctx.fillRect(e.x-e.r,barY,e.r*2*(e.hp/e.max),5)}}
function renderGems(left,top){if(drawFieldGems(left,top))return;for(const gem of gems){if(gem.x<left-40||gem.x>left+W+40||gem.y<top-40||gem.y>top+H+40)continue;g.fillStyle='#55f7d4';g.shadowColor='#55f7d4';g.shadowBlur=12;g.beginPath();g.moveTo(gem.x,gem.y-gem.r);g.lineTo(gem.x+gem.r*.7,gem.y);g.lineTo(gem.x,gem.y+gem.r);g.lineTo(gem.x-gem.r*.7,gem.y);g.fill();g.shadowBlur=0}}
function render(){if(streetSession&&streetAngled){renderStreetPrototype();return}g.clearRect(0,0,W,H);g.fillStyle='#111925';g.fillRect(0,0,W,H);cam.x=p.x-W/2;cam.y=p.y-H/2;g.save();if(!preferences.shake)shake=0;if(shake>0){g.translate(rand(-shake,shake),rand(-shake,shake));shake*=.85;if(shake<.2)shake=0}g.translate(-cam.x,-cam.y);const left=cam.x,top=cam.y;if(sampleLookActive())paintSampleStreet(g,left,top,W,H);else if(!drawFieldWorldGround(left,top))renderRouteGround(left,top);if(!sampleLookActive()&&!fieldWorldActive()){g.strokeStyle='#1b2836';g.lineWidth=1;g.beginPath();for(let x=Math.floor(left/80)*80;x<left+W+80;x+=80){g.moveTo(x,top);g.lineTo(x,top+H)}for(let y=Math.floor(top/80)*80;y<top+H+80;y+=80){g.moveTo(left,y);g.lineTo(left+W,y)}g.stroke();g.strokeStyle='#293440';g.lineWidth=3;for(let x=Math.floor(left/400)*400;x<left+W+400;x+=400){g.beginPath();g.moveTo(x+180,top);g.lineTo(x+180,top+H);g.stroke()}for(let y=Math.floor(top/400)*400;y<top+H+400;y+=400){g.beginPath();g.moveTo(left,y+170);g.lineTo(left+W,y+170);g.stroke()}}for(const o of obstacles){if(o.x+o.w<left-30||o.x>left+W+30||o.y+o.h<top-30||o.y>top+H+30)continue;if(drawFieldWorldStructure(o)||renderRouteStructure(o))continue;g.fillStyle='#080d16';g.fillRect(o.x+8,o.y+12,o.w,o.h);g.fillStyle=o.type?'#283645':'#303b4a';g.fillRect(o.x,o.y,o.w,o.h);g.strokeStyle='#506174';g.strokeRect(o.x,o.y,o.w,o.h);g.fillStyle='#182433';for(let x=o.x+10;x<o.x+o.w-8;x+=23)for(let y=o.y+8;y<o.y+o.h-8;y+=22)g.fillRect(x,y,10,8)}renderFieldDefeats();renderGroundFire();renderConvoyRoute();renderBarricades(left,top);renderExtraction();renderPatrol();renderSalvage();renderBossWarning();renderSpitterWarnings();renderHowlerWarnings();renderLobberBombs();renderFuel(left,top);renderShockDrums();renderSupplies();renderDrop();renderGems(left,top);for(const b of bullets){if(b.rail){g.strokeStyle='#d3ffff';g.lineWidth=3;const len=Math.hypot(b.vx,b.vy)||1;g.beginPath();g.moveTo(b.x-b.vx/len*24,b.y-b.vy/len*24);g.lineTo(b.x,b.y);g.stroke()}g.fillStyle=b.rail?'#f0ffff':b.piercing?'#b1eeff':'#ffd28a';g.shadowBlur=9;g.shadowColor=b.piercing?'#73dcff':'#ffc676';g.beginPath();g.arc(b.x,b.y,b.r,0,7);g.fill();g.shadowBlur=0}for(const e of enemies){if(e.convoy){renderConvoy(e);continue}renderEnemy(e)}renderFieldImpacts();const aim=gunTarget();renderAimDisplay(aim);const angle=aim?Math.atan2(aim.y-p.y,aim.x-p.x):0;if(drawFieldActor(g,p,'survivor')){}else if(sampleLookActive())drawSamplePerson(g,p,'survivor');else{g.fillStyle=p.inv>0&&Math.floor(performance.now()/65)%2?'#fff':(p.color||'#65e9d5');g.shadowColor=p.color||'#3bbfa9';g.shadowBlur=18;g.beginPath();g.arc(p.x,p.y,p.r,0,7);g.fill();g.shadowBlur=0;g.strokeStyle='#0e1928';g.lineWidth=5;g.stroke();if(runSurvivor==='courier'){g.strokeStyle='#71483d';g.lineWidth=4;g.beginPath();g.moveTo(p.x-9,p.y-9);g.lineTo(p.x+9,p.y+9);g.stroke()}if(runSurvivor==='quartermaster'){g.strokeStyle='#685330';g.lineWidth=3;g.strokeRect(p.x-11,p.y-6,22,12);g.beginPath();g.moveTo(p.x,p.y-6);g.lineTo(p.x,p.y+6);g.stroke()}if(runSurvivor==='tactician'){g.strokeStyle='#45436a';g.lineWidth=3;g.strokeRect(p.x-10,p.y-9,20,18)}if(runSurvivor==='scavenger'){g.strokeStyle='#375d42';g.lineWidth=4;g.strokeRect(p.x-12,p.y-6,9,12)}if(runSurvivor==='engineer'){g.strokeStyle='#634332';g.lineWidth=3;g.beginPath();g.moveTo(p.x-8,p.y-6);g.lineTo(p.x+8,p.y-6);g.moveTo(p.x,p.y-12);g.lineTo(p.x,p.y-4);g.stroke()}}renderPlayerGun(angle);renderBlasts();renderWeapons();renderHostileShots();renderDecoy();renderLocker();renderRescue();for(const q of particles){g.globalAlpha=clamp(q.life/q.max,0,1);g.fillStyle=q.color;g.fillRect(q.x-q.r/2,q.y-q.r/2,q.r,q.r)}g.globalAlpha=1;renderFieldReadability();g.font='bold 15px system-ui';g.textAlign='center';for(const t of texts){g.globalAlpha=t.life/.8;g.fillStyle=t.color;g.fillText(t.t,t.x,t.y)}g.globalAlpha=1;g.restore();let grad=g.createRadialGradient(W/2,H/2,Math.min(W,H)*.15,W/2,H/2,Math.max(W,H)*.75);grad.addColorStop(0,'#0000');grad.addColorStop(1,'#03030ecc');g.fillStyle=grad;g.fillRect(0,0,W,H);renderRushLights();renderShotWarnings();renderWaypoint();if(mode==='menu'){g.fillStyle='#63e4c8';g.font='bold 13px system-ui';g.fillText('◈',W/2,H/2)}}let frame=t=>{recordPerformanceFrame(t);let dt=Math.min(.035,(t-last)/1000||.016);last=t;update(dt);if(!(mode==='guide'&&guideReturn==='end')&&mode!=='review'&&mode!=='end'&&mode!=='report'&&mode!=='benchmark'&&mode!=='menu'&&mode!=='previews'&&mode!=='art-menu'&&mode!=='street-menu'&&!(mode==='bestiary'&&bestiaryReturn==='end')&&!(mode==='weapons'&&weaponGuideReturn==='end')&&!(mode==='settings'&&settingsReturn==='end')&&!(mode==='backup'&&(backupReturn==='end'||backupReturn==='settings'&&settingsReturn==='end'))&&!(mode==='manual'&&manualReturn==='end'))render();requestAnimationFrame(frame)};applyTouchLayout();menu();requestAnimationFrame(frame)
})();
