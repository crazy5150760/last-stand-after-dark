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
 if(!['menu','previews','art-menu','street-menu'].includes(mode))return;streetSession=false;artSession=false;releaseSampleArtwork();mode='previews';show(`<div class="eyebrow">DEVELOPMENT PREVIEWS</div><h1 style="font-size:40px">ON THE<br>WORKBENCH</h1><p>Optional, unscored testing. Normal runs, records and medals stay intact.</p><h2>DOWNTOWN VISUAL PILOT</h2><p>Optional overhead night-street comparison · Early test · HP safe · unscored.</p><button class="btn secondary" id="downtownPilot">ENTER VISUAL PILOT</button><h2>DOWNTOWN SHOPFRONT STUDY</h2><p>Optional overhead solid-block study · dressed/plain comparison · 12 targets · HP safe · unscored.</p><button class="btn secondary" id="shopfrontStudy">ENTER SHOPFRONT STUDY</button><h2>MAIN GAME PERFORMANCE TEST</h2><p>Quick controlled scenes · HP safe · unscored. Uses the main renderer and temporary settings.</p><div class="home-actions">${Object.entries(MAIN_PERF_TESTS).map(([id,s])=>`<button class="btn secondary" id="mainPerf-${id}">${s.name.toUpperCase()} TEST</button>`).join('')}</div><h2>DEVELOPER MODE · BOSS TESTING</h2><p>Jump straight to any boss with normal Field artwork. HP is safe. Player attacks start OFF; Pause to enable attacks, change weapon, switch boss or restart.</p><div class="cards">${['breaker','warden','harvester'].map(id=>`<button class="choice" id="bossTest-${id}"><b>${id.toUpperCase()}</b><span>Start immediately · HP safe · unscored</span></button>`).join('')}</div><h2>SPECIALIST ART REVIEW</h2><button class="btn secondary" id="riotReview">RIOT GUARD ART DRILL</button><button class="btn secondary" id="spitterReview">SPITTER ART DRILL</button><button class="btn secondary" id="howlerReview">HOWLER ART DRILL</button><button class="btn secondary" id="lobberReview">LOBBER ART DRILL</button><p class="muted">Immediate specialist attack review · HP safe · unscored · attacks OFF. Normal attacks; 300 HP training target. Howler includes three infected helpers.</p><h2>BLACKOUT ART REVIEW</h2><button class="btn secondary" id="hunterReview">BLACKOUT HUNTER ART DRILL</button><p class="muted">Immediate running/contact review · HP safe · unscored · attacks OFF · 300 HP training target. No timed wave or rewards.</p><h2>ART & CAMERA STUDIES</h2><div class="home-actions"><button class="btn secondary" id="streetOpen">STREET PROTOTYPE</button><button class="btn secondary" id="artOpen">ART & AUDIO SAMPLE</button></div><button class="btn secondary" id="previewsBack">MAIN MENU</button>`);bindUpgradePress(document.getElementById('downtownPilot'),()=>startMainPerfTest('early',null,true),()=>mode==='previews');bindUpgradePress(document.getElementById('shopfrontStudy'),()=>startMainPerfTest('early',null,'shopfront'),()=>mode==='previews');for(const id of Object.keys(MAIN_PERF_TESTS))bindUpgradePress(document.getElementById('mainPerf-'+id),()=>startMainPerfTest(id),()=>mode==='previews');for(const id of ['breaker','warden','harvester'])bindUpgradePress(document.getElementById('bossTest-'+id),()=>startBossTesting(id),()=>mode==='previews');bindPress(document.getElementById('riotReview'),()=>startBossTesting('riot'));bindUpgradePress(document.getElementById('spitterReview'),()=>startBossTesting('spitter'),()=>mode==='previews');bindUpgradePress(document.getElementById('howlerReview'),()=>startBossTesting('howler'),()=>mode==='previews');bindUpgradePress(document.getElementById('lobberReview'),()=>startBossTesting('lobber'),()=>mode==='previews');bindUpgradePress(document.getElementById('hunterReview'),()=>startBossTesting('hunter'),()=>mode==='previews');bindPress(document.getElementById('streetOpen'),showStreetPrototype);bindPress(document.getElementById('artOpen'),showArtSample);bindPress(document.getElementById('previewsBack'),menu);
}
function returnToJournal(){mode='journal';showJournal()}
function menu(){
 leaveMainPerfTest();bossLab=false;bossLabFire=false;bossLabField=true;bossLabWeapon='gun';releaseFieldArtwork();releaseFieldWorld();streetCombat=freshStreetCombat();streetMotion=new WeakMap();streetSession=false;artSession=false;releaseSampleArtwork();mode='menu';show(`<section class="title-screen" aria-label="Last Stand: After Dark main menu"><div class="title-copy"><div class="title-kicker">SURVIVE · ADAPT · EXTRACT</div><h1>LAST STAND<span>AFTER DARK</span></h1><p class="title-tagline">The night is yours to survive.</p><nav class="title-actions" aria-label="Main menu"><button class="title-play" id="start">PLAY <span aria-hidden="true">↗</span></button><button id="runLog">JOURNAL</button><button id="settingsOpen">SETTINGS</button></nav><p class="title-record">${record>0?'BEST SURVIVAL · '+fmt(record):'YOUR FIRST NIGHT AWAITS'}</p><p id="titleArtStatus" class="title-art-status" role="status" aria-live="polite"></p></div><footer class="title-footer"><button class="title-link" id="previewsOpen">DEVELOPMENT PREVIEWS</button><span>ALPHA 0.87</span></footer>${!journal.available||journal.readOnly?`<p class="muted">${journalNote()}</p>`:''}</section>`);
 bindPress(document.getElementById('start'),showRoster);bindPress(document.getElementById('runLog'),showJournal);bindPress(document.getElementById('settingsOpen'),showSettings);bindPress(document.getElementById('previewsOpen'),showPreviews);document.getElementById('boot').hidden=true;
}
addEventListener('blur',()=>{titleFocused=false;syncTitleMotion()});addEventListener('focus',()=>{titleFocused=true;syncTitleMotion()});document.addEventListener('visibilitychange',syncTitleMotion);
