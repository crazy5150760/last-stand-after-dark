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
