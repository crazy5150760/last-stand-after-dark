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
