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
