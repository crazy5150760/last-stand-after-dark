// Runs the actual shipped inline script with a small DOM/audio boundary.
// Test access is injected in memory; the downloadable game exposes no test API.
const {readFileSync} = require('node:fs');
const {join} = require('node:path');
const {runInNewContext} = require('node:vm');
const test = require('node:test');
const assert = require('node:assert/strict');
// The full VM suite loads many embedded-art contexts; optionally collect completed
// fixtures between tests while retaining the same 512 MiB runner heap ceiling.
if(process.env.LS_TEST_GC==='1'){
  assert.equal(typeof global.gc,'function','LS_TEST_GC needs node --expose-gc');
  require('node:test').afterEach(t=>{global.gc();if(process.env.LS_TEST_PROGRESS==='1')process.stderr.write(t.name+' · heap '+Math.round(process.memoryUsage().heapUsed/1048576)+' MiB\n')});
}
const html = readFileSync(process.env.LS_GAME_HTML || join(__dirname, '../dist/index.html'), 'utf8');
const source = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const sampleAssetText=html.match(/<script id="sampleAssets" type="application\/json">([\s\S]*?)<\/script>/)?.[1]||'{}';

// Logical image fixtures share identical immutable media strings across VMs.
// This is a mock boundary optimization, not a browser memory measurement.
const canonicalImageSources=new Map(Object.values(JSON.parse(sampleAssetText)).map(row=>[row.src,row.src]));

const musicAssetText=html.match(/<script id="musicAsset" type="application\/json">([\s\S]*?)<\/script>/)?.[1]||'{}';
const titleAssetText=html.match(/<script id="titleAsset" type="application\/json">([\s\S]*?)<\/script>/)?.[1]||'{}';

function loadGame({stored = null, journalStored = null, storageBlocked = false, writeBlocked = false, seed = 0x5eed1234, width = 412, height = 915, traceCanvas = false, preferencesStored = null, failWriteKey = null, recoveryStored = null, storageFault = null, storageReadFault = null, artworkStatus = 'ready', titleStatus = 'ready', historyMode = 'ready', historyGuard = false} = {}) {
  const elements = new Map(), listeners = new Map();
  let choices = [], dynamic = [], now = 0, nextFrame, canvasCalls=0;const downloads=[];
  const traces=new Map();
  function makeCanvas(id){
    const trace=[];traces.set(id,trace);
    return new Proxy({}, {get:(_,key)=>key==='createRadialGradient'?(...args)=>({radial:args,stops:[],addColorStop(at,color){this.stops.push([at,color])}}):key==='createLinearGradient'?(...args)=>({linear:args,stops:[],addColorStop(at,color){this.stops.push([at,color])}}):(...args)=>{if(id==='game')canvasCalls++;if(traceCanvas)trace.push([key,...args])},set:(_,key,value)=>{if(traceCanvas)trace.push(['set',key,value]);return true}});
  }
  const canvas=makeCanvas('game');
  class Element {
    constructor(id) {this.id=id;this.style={};this.attrs={};this.listeners={};this.isConnected=true;this.dataset={};this.owner=null;this.captures=new Set();this.classes=new Set();this.classList={add:c=>this.classes.add(c),remove:c=>this.classes.delete(c)};}
    set innerHTML(value) {
      this.html=value;
      for(const el of dynamic){el.isConnected=false;elements.delete(el.id)}
      dynamic=[];choices=[];
      for(const match of value.matchAll(/id="([^"]+)"/g)){const el=new Element(match[1]);el.owner=this;elements.set(el.id,el);dynamic.push(el)}
      for(const match of value.matchAll(/data-pick="(\d+)"/g)){const el=new Element();el.dataset.pick=match[1];choices.push(el);dynamic.push(el)}
    }
    get innerHTML(){return this.html||''}
    contains(el){return el===this||!!el&&el.owner===this}
    focus(options){const old=document.activeElement;if(old&&old!==this)old.dispatch('blur');document.activeElement=this;this.focusOptions=options}
    getContext(){return this.id==='game'?canvas:(this.canvasContext??=makeCanvas(this.id))}
    addEventListener(name,fn){(this.listeners[name]||=[]).push(fn)}
    dispatch(name,props={}){let result;for(const fn of this.listeners[name]||[])result=fn({button:0,preventDefault(){},...props});return result}
    click(detail=0){if(this.onclick)this.onclick({detail})}
    querySelectorAll(){return choices}
    setAttribute(name,value){this.attrs[name]=value}
    getAttribute(name){return this.attrs[name]??null}
    getBoundingClientRect(){return{left:28,top:600,width:125,height:125}}
    setPointerCapture(id){this.captures.add(id)}
    hasPointerCapture(id){return this.captures.has(id)}
    releasePointerCapture(id){this.captures.delete(id);this.dispatch('lostpointercapture',{pointerId:id})}
  }
  for(const id of ['hud','game','panel','modal','touch','toast','hp','healthText','xp','time','kills','level','dash','pause','stick','nub','encounter','objective','bossMeter','bossFill','runGoal','supplyGoal','salvageGoal','contractGoal','rescueGoal','dropGoal','regroup','decoy','medalGoal','lockerGoal','performanceHud','sampleAssets','musicAsset','titleAsset','titleScene','titleArt','boot','streetHud','streetHeader','streetVitals','streetPortrait','streetHealthText','streetHealthFill','streetXpFill','streetXpText','streetTime','streetTargets','streetThreat','streetBossName','streetBossHp','streetBossFill','streetBossState','streetTask','streetTaskTitle','streetTaskHint','streetLoadout','streetWeapon','streetTrialLabel','runBadge','streetSurvivorName','streetSafetyText','streetHealthTrack','streetXpTrack','streetClockLabel','streetCountLabel','streetBossTrack','runHudMeta','runHudContract','runHudMedal'])elements.set(id,new Element(id));
  elements.get('sampleAssets').textContent=sampleAssetText;elements.get('musicAsset').textContent=musicAssetText;elements.get('titleAsset').textContent=titleAssetText;
  const bestiarySource=JSON.parse(sampleAssetText).bestiaryPortraits?.src,bestiaryMeta=JSON.parse(sampleAssetText).bestiaryPortraits,hunterMeta=JSON.parse(sampleAssetText).hunter,hunterSource=hunterMeta?.src;
  const pendingImages=[],pendingTitleImages=[],titleSource=JSON.parse(titleAssetText).src;class MockImage{set src(value){this.source=canonicalImageSources.get(value)||value;const title=value===titleSource;(title?pendingTitleImages:pendingImages).push(this);const status=title?titleStatus:artworkStatus;if(status==='ready'){this.naturalWidth=value===bestiarySource?bestiaryMeta.width:value===hunterSource?hunterMeta.width:2172;this.naturalHeight=value===bestiarySource?bestiaryMeta.height:value===hunterSource?hunterMeta.height:724;this.onload?.()}else if(status==='error')this.onerror?.()}get src(){return this.source}}
  const on=(name,fn)=>{if(!listeners.has(name))listeners.set(name,[]);listeners.get(name).push(fn)};
  const document={activeElement:null,hidden:false,createElement:tag=>new Element(tag),getElementById:id=>elements.get(id),addEventListener:on};
  const savedValues=new Map([['ls-record',stored],['ls-journal-v1',journalStored],['ls-preferences-v1',preferencesStored],['ls-restore-recovery-v1',recoveryStored]]);
  const storage={getItem(key){if(storageBlocked||storageReadFault?.({key,values:savedValues}))throw Error('SecurityError');return savedValues.get(key)??null},setItem(key,value){if(storageFault?.({key,value:String(value),values:savedValues})==='ignore')return;if(storageBlocked||writeBlocked||key===failWriteKey)throw Error('QuotaExceededError');savedValues.set(key,String(value))},removeItem(key){if(storageBlocked||writeBlocked)throw Error('SecurityError');savedValues.delete(key)}};
  const math=Object.create(Math);let randomState=seed>>>0;math.random=()=>{randomState=(Math.imul(1664525,randomState)+1013904223)>>>0;return randomState/4294967296};
  // History traversal is asynchronous, including cleanup after an on-screen Back.
  const historyEntries=[{outside:true},{other:'preserved',lastStandBack:'home'}];if(historyGuard)historyEntries.push({other:'preserved',lastStandBack:'guard'});
  let historyIndex=historyEntries.length-1,historyLeft=0,historyPushes=0;const historyTasks=[];
  const emitHistory=()=>{for(const fn of listeners.get('popstate')||[])fn({state:historyEntries[historyIndex]})};
  const cloneState=v=>JSON.parse(JSON.stringify(v));
  const history={get state(){return historyEntries[historyIndex]},replaceState(value,...args){assert.equal(args.length,1,'history must not change URL');if(historyMode==='replace-error')throw Error('SecurityError');historyEntries[historyIndex]=cloneState(value)},pushState(value,...args){assert.equal(args.length,1,'history must not change URL');if(historyMode==='push-error')throw Error('SecurityError');historyEntries.splice(historyIndex+1);historyEntries.push(cloneState(value));historyIndex++;historyPushes++},back(){historyTasks.push(()=>{if(historyIndex>0){historyIndex--;if(historyEntries[historyIndex].outside)historyLeft++;emitHistory()}else historyLeft++})},forward(){historyTasks.push(()=>{if(historyIndex+1<historyEntries.length){historyIndex++;emitHistory()}})}};
  const flushHistory=()=>{let steps=0;while(historyTasks.length){assert.ok(++steps<30,'history traversal must settle');historyTasks.shift()()}};
  const context={atob:value=>Buffer.from(value,'base64').toString('binary'),Blob,Image:MockImage,URL:{createObjectURL:blob=>{downloads.push(blob);return 'blob:local-save'},revokeObjectURL(){}},Math:math,document,window:{history:historyMode==='missing'?undefined:history},devicePixelRatio:3,innerWidth:width,innerHeight:height,addEventListener:on,localStorage:storage,performance:{now:()=>now},setTimeout:()=>1,clearTimeout(){},requestAnimationFrame:fn=>{nextFrame=fn}};
  const marker=';menu();requestAnimationFrame(frame)';
  assert.equal(source.split(marker).length,2,'test injection anchor must be unique');
  const instrument=`;globalThis.api={...(typeof upgradeImpact==='function'?{upgradeImpact}:{}),...(typeof placeTrainingExit==='function'?{placeTrainingExit}:{}),...(typeof showEndRunConfirm==='function'?{showEndRunConfirm,cancelEndRun,stopAudioVoices,audioVoiceHandles:()=>audioVoices.size}:{}),...(typeof retryRunSave==='function'?{retryRunSave}:{}),...(typeof restoreRecoveryText==='function'?{restoreRecoveryText,reviewRestoreRecovery,recoverySaved:()=>localStorage.getItem('ls-restore-recovery-v1')}:{}),...(typeof startMainPerfTest==='function'?{startMainPerfTest,leaveMainPerfTest,mainPerfSnapshot,updateMainPerfTargets,mainPerfTests:MAIN_PERF_TESTS,mainPerfState:()=>mainPerfTest}:{}),...(typeof drawFieldRouteDressing==='function'?{drawFieldRouteDressing,drawFieldRoadStencils}:{}),...(typeof drawFieldWetPatch==='function'?{drawFieldWetPatch,drawFieldWetReflection,drawFieldRain,drawFieldWorldLight}:{}),...(typeof renderFieldReadability==='function'?{fieldReadabilityActive,renderFieldReadability,drawFieldGems,renderExtraction,renderBossWarning}:{}),...(typeof drawFieldDrum==='function'?{drawFieldDrum,drawFieldBarricade,drawFieldCase,fieldPropVisible,renderFuel,renderBarricades,renderSupplies,renderDrop,renderSalvage,renderLocker}:{}),...(typeof noteFieldHit==='function'?{noteFieldHit,noteFieldShot,fieldShotVisual,fieldDefeatWanted,fieldReaction,renderFieldDefeats,renderFieldImpacts,advanceFieldCombat}:{}),...(typeof fieldWorldActive==='function'?{fieldWorldActive,fieldWorldTiles,drawFieldWorldGround,drawFieldWorldStructure,fieldWorldHash,selectFieldWorld,fieldWorldStatus,worldCacheState:()=>fieldWorldCache}:{}),...(typeof fieldHunterPose==='function'?{fieldHunterPose,fieldHunterMotion,prepareFieldHunter,advanceFieldHunter,fieldHunterActive,releaseFieldHunter,fieldHunterWanted}:{}),...(typeof prepareBestiaryArt==='function'?{prepareBestiaryArt,releaseBestiaryArt,selectBestiaryArt,drawEnemyPortrait,bestiaryArtStatus,bestiaryArtState:()=>({look:bestiaryLook,...bestiaryArtwork})}:{}),...(typeof fieldLobberPose==='function'?{fieldLobberPose,fieldLobberMotion,prepareFieldLobber,advanceFieldLobber,fieldLobberActive,releaseFieldLobber,renderLobber,renderLobberBombs}:{}),...(typeof fieldHowlerPose==='function'?{fieldHowlerPose,fieldHowlerMotion,prepareFieldHowler,advanceFieldHowler,fieldHowlerActive,releaseFieldHowler,fieldHowlerBudget,renderHowler,renderHowlerWarnings}:{}),...(typeof fieldSpitterPose==='function'?{fieldSpitterPose,fieldSpitterMotion,prepareFieldSpitter,advanceFieldSpitter,renderSpitterWarnings,fieldSpitterActive,releaseFieldSpitter}:{}),...(typeof fieldRiotPose==='function'?{fieldRiotPose,fieldRiotMotion,prepareFieldRiot,advanceFieldRiot,fieldRiotActive,releaseFieldRiot,renderRiot}:{}),...(typeof startBossTesting==='function'?{startBossTesting,resetBossTesting,toggleBossTestAttacks,bossTestSnapshot,fieldStyle,bossTestState:()=>({active:bossLab,attacks:bossLabFire,field:bossLabField,weapon:bossLabWeapon})}:{}),...(typeof fieldHarvesterPose==='function'?{fieldHarvesterPose,fieldHarvesterMotion,prepareFieldHarvester,advanceFieldHarvester,fieldHarvesterActive,releaseFieldHarvester,renderBossWarning}:{}),...(typeof fieldWardenPose==='function'?{fieldWardenPose,fieldWardenMotion,prepareFieldWarden,advanceFieldWarden,fieldWardenActive,releaseFieldWarden}:{}),...(typeof fieldBreakerPose==='function'?{fieldBreakerPose,fieldBreakerMotion,prepareFieldBreaker,advanceFieldBreaker,fieldBreakerActive,releaseFieldBreaker}:{}),...(typeof ensureFieldArtwork==='function'?{ensureFieldArtwork,releaseFieldArtwork,fieldActorsActive,fieldArtStatus,selectFieldActors,advanceFieldActors,fieldActorInfo,drawFieldActor,fieldEnemyKind,fieldState:()=>fieldArt}:{}),...(typeof runHudSnapshot==='function'?{runHudSnapshot,runHudRows,selectRunHud,composedRunHud,screenMarker}:{}),...(typeof streetTrialInfo==='function'?{streetTrialInfo,streetTrialSpots,captureStreetReport,streetTrialState:()=>({active:streetTrial,choice:streetTrialChoice})}:{}),...(typeof streetBreakerPose==='function'?{streetBreakerPose}:{}),...(typeof syncStreetHud==='function'?{syncStreetHud,streetHudSnapshot,updateHUD,streetHudState:()=>({polished:streetHudPolished,portrait:streetHudPortraitImage})}:{}),...(typeof ensureTitleArtwork==='function'?{showPreviews,ensureTitleArtwork,releaseTitleArtwork,titleState:()=>({status:titleArtwork?.status||'idle',motion:document.getElementById('titleScene').dataset.motion,visible:!document.getElementById('titleScene').hidden})}:{}),...(typeof streetCombatHit==='function'?{streetCombatHit,streetReactionVisual,streetDefeatInfo,streetAimInfo,streetBossVisual,streetCombatSnapshot:()=>streetCombat}:{}),...(typeof streetMaterialInfo==='function'?{streetMaterialInfo,streetFaceQuad,drawStreetBuilding,drawStreetGround,streetEnvironmentState:()=>streetDressed}:{}),showUpgradeChoices,advanceStreetAnimations,streetMotionFor,streetHeading,primeStreetAnimations,showStreetPrototype,startStreetPrototype,streetProject,streetUnproject,streetDirection,streetResolveBody,streetBlocked,streetFrame,streetActorInfo,streetDrawQueue,streetBuildingAlpha,renderStreetPrototype,streetBlocks:STREET_BLOCKS,syncBackgroundMusic,stopBackgroundMusic,sound,cleanAudioLevel,audioOutputLevel,applyAudioMix,renderPlayerGun,sampleArtworkReady,ensureSampleArtwork,sampleSpriteFrame,drawSampleSprite,setSampleAudio(ctx,on){audioCtx=ctx;musicOn=on},showArtSample,sampleLookActive,sampleEnemyKind,drawSamplePerson,paintSampleStreet,sampleCuePlan,sampleSound,playStyleAudio,renderGems,recordPerformanceFrame,performanceSnapshot,togglePerformance,resetPerformance,showBenchmark,benchmarkText,downloadBenchmark,buildProgressSnapshot,cleanBuildProgress,buildProgressPanel,buildProgressLines,showQuickGuide,closeQuickGuide,useStarterSetup,refreshDeploymentSummary,showSavedRun,cleanPace,recordPace,paceSnapshot,pacePanel,bladeRadius,placeLocker,updateLocker,nearLocker,showLocker,takeLocker,favoredChoice,practiceSnapshot,practicePanel,renderAimDisplay,applyTouchLayout,encounterBriefing,evasiveMultiplier,hordeSpawnInterval,end,showTraining,startTraining,configureTrainingWeapon,saveDeployment,loadDeployment,showTacticalMap,mapPoint,drawTacticalMap,updatePatrol,patrolTarget,moveHarvester,harvesterTuning:HARVESTER_TUNING,steadyMultiplier,selectRoute,routeById,routes:ROUTES,configureRoute,recordRunEvent,timelinePanel,selectTrackedMedal,updateMedalTracker,medalTrackers:MEDAL_TRACKERS,currentDiscoveries,discoveryPanel,runReportText,showRunReport,downloadRunReport,weaponPanel,gunTarget,selectGunPriority,deployDecoy,moveHorde,decoyTuning:DECOY_TUNING,lobberTuning:LOBBER_TUNING,lobberBlocked,updateLobberSchedule,updateLobbers,moveLobber,cancelLobbers,renderLobberBombs,showManual,closeManual,runLogDetails,comparisonSnapshot,comparisonPanel,buildSheet,objectiveTargets,selectObjective,shotWarnings,renderShotWarnings,dischargeShock,updateShockDrums,renderShockDrums,shockTuning:SHOCK_TUNING,ruleById,selectRule,threatName,backupText,parseBackup,showBackup,reviewBackup,closeBackup,setJournalView,showSettings,closeSettings,objectiveWaypoint,renderWaypoint,dashCooldown,hurtPlayer,dropSweepRadius,howlerTuning:HOWLER_TUNING,howlBlocked,rallyEligible,howlMultiplier,rallyTargets,cancelHowls,updateHowlerSchedule,updateHowls,moveHowler,renderHowler,renderHowlerWarnings,enemyArt:ENEMY_ART,enemyPortraitEntity,renderEnemy,weaponGuideRows,showWeaponGuide,closeWeaponGuide,enemyGuide:ENEMY_GUIDE,enemySpecies,cleanEnemyTally,showBestiary,setBestiaryFilter,closeBestiary,showRunResult,engineerTuning:ENGINEER_TUNING,fuelRadius,convoyTuning:CONVOY_TUNING,convoyRoute,updateConvoy,leaveConvoy,hitConvoy,resolveConvoyReward,renderConvoyRoute,renderConvoy,dropTuning:DROP_TUNING,placeDrop,updateDrops,dropHUD,renderDrop,nearDrop,molotovTuning:MOLOTOV_TUNING,molotovStats,launchMolotov,updateMolotov,rescueTuning:RESCUE_TUNING,rescueSpot,updateRescueAvailability,updateRescue,regroupRescue,finishRescueArrival,riotTuning:RIOT_TUNING,updateRiotSchedule,moveRiot,updateRiotMotion,riotShieldUp,riotShieldHitTime,riotShotImpact,contracts:CONTRACTS,selectContract,contractProgress,checkContract,currentContractStats,contractSummary,start,update,render,hitEnemy,dash,pause,resume,checkLevelUp,readRecord,movementInput,detonateBarrel,updateBarrels,spawnEnemy,spawnBoss,updateEncounter,moveBoss,updateEncounterHUD,updateProjectiles,updateWeapons,fireLightning,bladePositions,buildSummary,scheduleRush,updateRush,resolveRushReward,spawnRushHunter,updateExtractionWindow,updateExtractionArrival,showExtractionChoice,completeExtraction,stayAfterDark,exitReturnTuning:EXIT_RETURN_TUNING,overtimePressure,showRoster,selectSurvivor,showJournal,readJournal,saveJournal,survivorById,earnedMedals,currentRunStats,placeSupply,updateSupplies,renderSupplies,supplyTuning:SUPPLY_TUNING,updateSpitterSchedule,moveSpitter,updateHostileShots,spitterTuning:SPITTER_TUNING,upgradeChoices,evolutionHint,evolutions:EVOLUTIONS,placeSalvage,activateSalvage,updateSalvageAvailability,updateSalvageProgress,salvageStatus,salvageTuning:SALVAGE_TUNING,survivors:SURVIVORS,opts,limits:FX_LIMITS,tuning:BREAKER_TUNING,wardenTuning:WARDEN_TUNING,moveWarden,nextBossKind,bossName,rectHitTime,pointRectDistance,resolveBarricadeBody,applyPlayerBarricades,applyEnemyBarricades,damageBarricade,updateBarricades,placeBarricade,barricadeTuning:BARRICADE_TUNING,p,keys,touch,document,\n get state(){return{streetSession,streetAngled,musicTrack,audioMix,activeAudioVoices,effectAudioVoices,sampleArtwork,artSession,artLook,sampleAudioVoices,diagnostics,benchmarkCapture,guideReturn,reviewedRun,locker,lockerOffered,lockersUsed,trainingScenario,training,trainingWeapon,trainingEvolved,presetSlot,mapRange,patrol,patrolVisited,runRoute,selectedRoute,runTimeline,timelineDropped,trackedMedal,weaponLedger,decoy,decoyCharges,decoysUsed,decoyLured,nextLobberAt,lobberIntroduced,lobberBombs,manualReturn,runComparison,objectiveFocus,shockDrums,shockClock,shocksUsed,shockStuns,runRule,selectedRule,damageTaken,hitsTaken,armorPrevented,lastThreat,pendingRestore,backupReturn,journalView,preferences,settingsReturn,banishesLeft,banished,nextHowlerAt,howlerIntroduced,rerollsLeft,upgradeOffer,upgrades,weaponGuideReturn,enemyTally,bestiaryReturn,bestiaryFilter,runRecordSaved,nextScrapAt,scrapRefreshes,scrapRecovered,convoy,nextConvoyAt,convoysStopped,convoyRewardPending,supplyDrop,nextDropAt,dropsCollected,dropXpRecovered,bottles,fires,burnHits,molotovClock,burnKills,rescue,rescueOffered,nextRescueAt,rescuesCompleted,rescueArrival,nextRiotAt,riotsDefeated,riotIntroduced,selectedContract,runContract,contractCompleted,mode,elapsed,spawn,killCount,level,xp,nextXp,record,enemies,bullets,gems,particles,texts,obstacles,barrels,blastRings,barrelsBlown,blastKills,activeBoss,nextBossAt,bossWarned,bossesDefeated,wardensDefeated,harvestersDefeated,reliefUntil,lightning,bladeHits,chainClock,nextRushAt,rushPhase,rushUntil,rushAxis,rushSpawned,rushPendingReward,rushesSurvived,bonusChoices,exitBeacon,exitAt,overtime,runOutcome,journal,selectedSurvivor,runSurvivor,runLogged,runResult,supplyCache,nextSupplyAt,suppliesCollected,supplyHealing,hostileShots,nextSpitterAt,spittersDefeated,salvage,nextSalvageAt,salvagesSecured,bonusKinds,barricades,barricadeClock,barricadesCleared}},\n setup(v){if('locker'in v)locker=v.locker;if('bossWarned'in v)bossWarned=v.bossWarned;if('nextXp'in v)nextXp=v.nextXp;if('exitBeacon'in v)exitBeacon=v.exitBeacon;if('nextLobberAt'in v)nextLobberAt=v.nextLobberAt;if('lobberBombs'in v)lobberBombs=v.lobberBombs;if('overtime'in v)overtime=v.overtime;if('shockDrums'in v)shockDrums=v.shockDrums;if('shockClock'in v)shockClock=v.shockClock;if('nextHowlerAt'in v)nextHowlerAt=v.nextHowlerAt;if('convoy'in v)convoy=v.convoy;if('nextConvoyAt'in v)nextConvoyAt=v.nextConvoyAt;if('supplyDrop'in v)supplyDrop=v.supplyDrop;if('nextDropAt'in v)nextDropAt=v.nextDropAt;if('fires'in v)fires=v.fires;if('bottles'in v)bottles=v.bottles;if('molotovClock'in v)molotovClock=v.molotovClock;if('rescue'in v)rescue=v.rescue;if('nextRescueAt'in v)nextRescueAt=v.nextRescueAt;if('rescueOffered'in v)rescueOffered=v.rescueOffered;if('nextRiotAt'in v)nextRiotAt=v.nextRiotAt;if('enemies'in v)enemies=v.enemies;if('bullets'in v)bullets=v.bullets;if('gems'in v)gems=v.gems;if('xp'in v)xp=v.xp;if('elapsed'in v)elapsed=v.elapsed;if('spawn'in v)spawn=v.spawn;if('barrels'in v)barrels=v.barrels;if('barrelClock'in v)barrelClock=v.barrelClock;if('obstacles'in v)obstacles=v.obstacles;if('activeBoss'in v)activeBoss=v.activeBoss;if('nextBossAt'in v)nextBossAt=v.nextBossAt;if('rushAxis'in v)rushAxis=v.rushAxis;if('bonusChoices'in v)bonusChoices=v.bonusChoices;if('bossesDefeated'in v)bossesDefeated=v.bossesDefeated;if('wardensDefeated'in v)wardensDefeated=v.wardensDefeated;if('exitAt'in v)exitAt=v.exitAt;if('rushesSurvived'in v)rushesSurvived=v.rushesSurvived;if('barrelsBlown'in v)barrelsBlown=v.barrelsBlown;if('blastKills'in v)blastKills=v.blastKills;if('killCount'in v)killCount=v.killCount;if('level'in v)level=v.level;if('supplyCache'in v)supplyCache=v.supplyCache;if('nextSupplyAt'in v)nextSupplyAt=v.nextSupplyAt;if('nextSpitterAt'in v)nextSpitterAt=v.nextSpitterAt;if('hostileShots'in v)hostileShots=v.hostileShots;if('nextSalvageAt'in v)nextSalvageAt=v.nextSalvageAt;if('salvage'in v)salvage=v.salvage;if('reliefUntil'in v)reliefUntil=v.reliefUntil;if('barricades'in v)barricades=v.barricades;if('barricadeClock'in v)barricadeClock=v.barricadeClock;},mute(){musicOn=false}};menu();requestAnimationFrame(frame)`;
  runInNewContext(source.replace(marker,instrument),context,{timeout:1000});
  const game=context.api;game.mute();
  return Object.assign(game,{resizeTo(w,h){context.innerWidth=w;context.innerHeight=h;game.event('resize')},phoneBack(){history.back();flushHistory()},phoneForward(){history.forward();flushHistory()},flushHistory,historyInfo:()=>({index:historyIndex,length:historyEntries.length,pushes:historyPushes,left:historyLeft,state:cloneState(history.state),pending:historyTasks.length}),el:id=>elements.get(id),pendingImages,pendingTitleImages,resolveTitle:()=>{for(const im of pendingTitleImages){im.naturalWidth=1536;im.naturalHeight=1024;im.onload?.()}},openHomeEntry(id){if(!elements.has(id)){const parent={trainingOpen:'start',bestiaryOpen:'runLog',weaponsOpen:'runLog',manualOpen:'runLog',backupOpen:'settingsOpen',streetOpen:'previewsOpen',artOpen:'previewsOpen'}[id];assert.ok(parent&&elements.get(parent),'parent navigation must exist for '+id);elements.get(parent).click()}assert.ok(elements.get(id),'entry must exist: '+id);elements.get(id).click()},resolveArtwork:()=>{for(const im of pendingImages){im.naturalWidth=im.src===bestiarySource?bestiaryMeta.width:im.src===hunterSource?hunterMeta.width:2172;im.naturalHeight=im.src===bestiarySource?bestiaryMeta.height:im.src===hunterSource?hunterMeta.height:724;im.onload?.()}},event:(name,props={})=>{for(const fn of listeners.get(name)||[])fn({key:'',code:'',repeat:false,preventDefault(){},...props})},choose:index=>{now+=500;const button=choices[index];button.dispatch('pointerdown',{pointerId:99,clientX:100,clientY:100});button.dispatch('pointerup',{pointerId:99,clientX:100,clientY:100})},choices:()=>choices,advanceClock:ms=>{now+=ms},frame:ms=>{now=ms;nextFrame(ms)},drawCount:()=>canvasCalls,drawingTrace:(id='game')=>traces.get(id),clearTrace:(id='game')=>{traces.get(id).length=0},saved:()=>savedValues.get('ls-record'),downloads:()=>downloads,preferencesSaved:()=>savedValues.get('ls-preferences-v1'),journalSaved:()=>savedValues.get('ls-journal-v1')});
}
function confirmEndForTest(g){if(g.el('confirmEndRun')){g.advanceClock(500);const b=g.el('confirmEndRun');b.dispatch('pointerdown',{pointerId:777,clientX:100,clientY:100,isPrimary:false});b.dispatch('pointerup',{pointerId:777,clientX:100,clientY:100,isPrimary:false})}}
function quitForTest(g){g.el('quit').click();confirmEndForTest(g)}
function chooseExitForTest(g,id){g.advanceClock(500);const b=g.el(id);b.dispatch('pointerdown',{pointerId:778,clientX:100,clientY:100});b.dispatch('pointerup',{pointerId:778,clientX:100,clientY:100})}
function cleanRun(game){game.start();game.setup({nextLobberAt:Infinity,shockDrums:[],shockClock:Infinity,spawn:1000,nextHowlerAt:Infinity,nextConvoyAt:Infinity,nextDropAt:Infinity,nextSpitterAt:Infinity,nextRiotAt:Infinity,nextRescueAt:Infinity,nextSalvageAt:Infinity,barricades:[],barricadeClock:Infinity});}
function enemy(overrides={}){return{x:100,y:0,hp:10,max:10,speed:0,r:15,dmg:12,col:'#fff',hit:0,type:0,...overrides}}
function bullet(){return{x:100,y:0,vx:0,vy:0,r:4,life:1,dmg:18}}
function near(actual,expected){assert.ok(Math.abs(actual-expected)<1e-8,`${actual} ~= ${expected}`)}

test('small joystick deflection retains proportional movement; dead zone is still',()=>{
  const g=loadGame();cleanRun(g);
  g.touch.x=.25;g.update(.02);near(g.p.x,1.05);near(g.p.y,0);
  g.touch.x=0;g.el('stick').dispatch('pointerdown',{pointerId:1,clientX:93,clientY:662.5});
  near(g.touch.x,0);near(g.touch.y,0);
});
test('keyboard diagonal movement has the same speed as straight movement',()=>{
  const g=loadGame();cleanRun(g);g.keys.d=true;g.keys.s=true;g.update(.02);near(Math.hypot(g.p.x,g.p.y),4.2);
});
test('second touch cannot steal joystick and its release cannot stop the first',()=>{
  const g=loadGame();cleanRun(g);const s=g.el('stick');
  s.dispatch('pointerdown',{pointerId:10,clientX:135.5,clientY:662.5});
  s.dispatch('pointerdown',{pointerId:11,clientX:45.5,clientY:662.5});
  assert.equal(g.touch.id,10);near(g.touch.x,1);
  s.dispatch('pointerup',{pointerId:11});assert.equal(g.touch.id,10);near(g.touch.x,1);
  s.dispatch('pointerup',{pointerId:10});assert.equal(g.touch.id,null);near(g.touch.x,0);assert.equal(s.captures.size,0);
});
for(const event of ['pointercancel','lostpointercapture'])test(`${event} clears joystick`,()=>{
  const g=loadGame();cleanRun(g);g.el('stick').dispatch('pointerdown',{pointerId:1,clientX:135.5,clientY:662.5});
  g.el('stick').dispatch(event,{pointerId:1});assert.equal(g.touch.id,null);near(g.touch.x,0);
});
test('dash works with a second finger and reads direction before the next frame',()=>{
  const g=loadGame();cleanRun(g);g.el('stick').dispatch('pointerdown',{pointerId:1,clientX:135.5,clientY:662.5});
  g.el('dash').dispatch('pointerdown',{pointerId:2});near(g.p.dashX,1);near(g.p.dashY,0);assert.equal(g.touch.id,1);
  assert.equal(g.el('dash').attrs['aria-disabled'],'true');
  g.update(.02);near(g.p.x,15.96);g.dash();near(g.p.dashCd,2.48);
});
test('stationary dash uses last direction and cooldown becomes ready again',()=>{
  const g=loadGame();cleanRun(g);g.keys.a=true;g.update(.02);delete g.keys.a;const x=g.p.x;g.dash();g.update(.02);assert.ok(g.p.x<x);
  for(let i=0;i<130;i++)g.update(.02);near(g.p.dashCd,0);assert.equal(g.el('dash').textContent,'DASH');
});
for(const event of ['blur','pagehide'])test(`${event} pauses, clears input, and requires explicit resume`,()=>{
  const g=loadGame();cleanRun(g);g.keys.d=true;g.touch.x=.5;g.update(.02);g.event(event);
  const before=g.state.elapsed,x=g.p.x;g.update(1);assert.equal(g.state.mode,'paused');near(g.state.elapsed,before);near(g.p.x,x);near(g.touch.x,0);assert.equal(Object.keys(g.keys).length,0);
  g.resume();g.update(.02);near(g.p.x,x);assert.equal(g.state.mode,'play');
});
test('hidden document cannot resume and becoming visible does not auto-resume',()=>{
  const g=loadGame();cleanRun(g);g.document.hidden=true;g.event('visibilitychange');g.resume();assert.equal(g.state.mode,'paused');
  g.document.hidden=false;g.event('visibilitychange');assert.equal(g.state.mode,'paused');g.el('resume').click();assert.equal(g.state.mode,'play');
});
test('orientation/resize clears input without losing the run',()=>{
  const g=loadGame();cleanRun(g);g.keys.w=true;g.touch.y=-1;g.event('resize');assert.equal(g.state.mode,'play');assert.equal(Object.keys(g.keys).length,0);near(g.touch.y,0);
});
test('pause key autorepeat does not toggle the game repeatedly',()=>{
  const g=loadGame();cleanRun(g);g.event('keydown',{key:'p'});assert.equal(g.state.mode,'paused');g.event('keydown',{key:'p',repeat:true});assert.equal(g.state.mode,'paused');
});
test('two lethal bullets in the same frame award only one kill and one drop',()=>{
  const g=loadGame();cleanRun(g);g.p.fireClock=10;g.setup({enemies:[enemy()],bullets:[bullet(),bullet()]});g.update(.02);
  assert.equal(g.state.killCount,1);assert.equal(g.state.gems.length,1);assert.equal(g.state.enemies.length,0);assert.equal(g.state.bullets.length,1);
});
test('repeated direct damage cannot reward an already defeated enemy',()=>{
  const g=loadGame();cleanRun(g);const e=enemy();g.hitEnemy(e,20);g.hitEnemy(e,20);assert.equal(g.state.killCount,1);assert.equal(g.state.gems.length,1);
});
test('queued upgrades freeze the run and obsolete choice callbacks cannot apply twice',()=>{
  const g=loadGame();cleanRun(g);g.keys.d=true;g.setup({xp:100});g.checkLevelUp();assert.equal(g.state.mode,'upgrade');assert.equal(g.touch.id,null);assert.equal(Object.keys(g.keys).length,0);
  const elapsed=g.state.elapsed;g.update(1);near(g.state.elapsed,elapsed);const stale=g.choices()[0],lv=g.state.level;g.choose(0);assert.equal(g.state.level,lv+1);assert.equal(g.state.mode,'upgrade');
  const after=g.state.level;stale.onclick();assert.equal(g.state.level,after);let selections=1;while(g.state.mode==='upgrade'){g.choose(0);assert.ok(++selections<20)}near(g.state.elapsed,elapsed);
});
test('capped Multishot is never offered and starter/later choices remain distinct',()=>{
  const g=loadGame();cleanRun(g);g.p.proj=5;
  for(let i=0;i<30;i++){g.setup({xp:g.state.nextXp});g.checkLevelUp();const labels=[...g.el('modal').innerHTML.matchAll(/<b>(.*?)<\/b>/g)].map(m=>m[1]);assert.equal(labels.length,i===0?4:3);assert.equal(new Set(labels).size,labels.length);assert.ok(!labels.includes('Multishot'));g.choose(0)}
});
test('death renders zero HP and retry resets HUD, cooldown, upgrades, and inputs',()=>{
  const g=loadGame();cleanRun(g);g.p.hp=1;g.p.proj=5;g.p.fireClock=10;g.setup({enemies:[enemy({x:0,dmg:99})],elapsed:12});g.update(.02);assert.equal(g.state.mode,'end');assert.equal(g.el('healthText').textContent,'0 / 100 HP');assert.ok(g.el('again'));
  g.keys.d=true;g.el('again').click();assert.equal(g.state.mode,'play');assert.equal(g.p.proj,1);assert.equal(g.el('healthText').textContent,'100 / 100 HP');assert.equal(g.el('time').textContent,'00:00');assert.equal(g.el('kills').textContent,'0 KILLS');assert.equal(g.el('xp').style.width,'0%');assert.equal(g.el('dash').textContent,'DASH');assert.equal(Object.keys(g.keys).length,0);
});
test('blocked browser storage allows startup, death, and retry with a session record',()=>{
  const g=loadGame({storageBlocked:true});assert.ok(g.el('start'));cleanRun(g);g.setup({elapsed:20});g.pause();quitForTest(g);assert.equal(g.state.mode,'end');near(g.state.record,20);assert.match(g.el('modal').innerHTML,/storage is unavailable/);g.el('again').click();assert.equal(g.state.mode,'play');near(g.state.record,20);
});
test('invalid saved records are ignored and valid best times persist',()=>{
  for(const stored of ['NaN','Infinity','-9','bad'])assert.equal(loadGame({stored}).state.record,0);
  const g=loadGame({stored:'30'});cleanRun(g);g.setup({elapsed:31});g.pause();quitForTest(g);assert.equal(g.saved(),'31');
});
test('frame and Canvas rendering execute through menu, combat, upgrade, pause, and end',()=>{
  const g=loadGame();g.frame(16);cleanRun(g);g.setup({enemies:[enemy({type:2})]});g.frame(32);g.setup({xp:8});g.frame(48);assert.equal(g.state.mode,'upgrade');g.render();g.choose(0);g.pause();g.frame(64);quitForTest(g);g.frame(80);
});
test('original Site identity stays unchanged',()=>{
  const manifest=JSON.parse(readFileSync(join(__dirname,'../.openai/hosting.json')));assert.equal(manifest.project_id,'appgprj_6ad44e1d8fa48191b59d8c10b22c7a86');assert.equal(manifest.static.directory,'web-dist');
});

test('pause responds immediately to a second touch while joystick is held',()=>{
  const g=loadGame();cleanRun(g);
  g.el('stick').dispatch('pointerdown',{pointerId:1,clientX:135.5,clientY:662.5,isPrimary:true});
  assert.equal(g.touch.id,1);g.update(.02);
  // No click is dispatched: mobile browsers may omit it for a non-primary touch.
  g.el('pause').dispatch('pointerdown',{pointerId:2,pointerType:'touch',isPrimary:false});
  assert.equal(g.state.mode,'paused');assert.equal(g.touch.id,null);assert.equal(g.el('stick').captures.size,0);
  const time=g.state.elapsed,x=g.p.x;g.update(.02);near(g.state.elapsed,time);near(g.p.x,x);
  g.el('pause').click(1);assert.equal(g.state.mode,'paused','delayed compatibility click must not resume');
  g.el('resume').dispatch('pointerdown',{pointerId:3,pointerType:'touch',isPrimary:false});
  assert.equal(g.state.mode,'play');g.update(.02);near(g.p.x,x);
});
test('pause still supports keyboard activation, and ignores right-button pointers',()=>{
  const g=loadGame();cleanRun(g);g.el('pause').dispatch('pointerdown',{button:2});assert.equal(g.state.mode,'play');
  g.el('pause').click();assert.equal(g.state.mode,'paused');g.el('resume').click();assert.equal(g.state.mode,'play');
});
test('pause-menu sound and end-run buttons accept a secondary touch',()=>{
  const g=loadGame();cleanRun(g);g.el('pause').dispatch('pointerdown',{pointerId:2,isPrimary:false});
  g.el('sound').dispatch('pointerdown',{pointerId:3,isPrimary:false});assert.match(g.el('sound').textContent,/ON/);assert.equal(g.state.mode,'paused');
  g.el('quit').dispatch('pointerdown',{pointerId:4,isPrimary:false});assert.equal(g.state.mode,'end-confirm');confirmEndForTest(g);assert.equal(g.state.mode,'end');
});
test('dash supports keyboard/assistive click without duplicate activation',()=>{
  const g=loadGame();cleanRun(g);g.el('dash').click();near(g.p.dashCd,2.5);g.update(.02);g.el('dash').click(1);near(g.p.dashCd,2.48);
});
function fuel(x,y=0){return{x,y,r:17,spent:false}}
test('walking through a barrel leaves it intact; a dash detonates it',()=>{
  const g=loadGame();cleanRun(g);g.setup({barrels:[fuel(50)]});g.touch.x=1;g.update(.02);assert.equal(g.state.barrelsBlown,0);
  g.dash();g.update(.04);assert.equal(g.state.barrelsBlown,1);assert.equal(g.state.barrels.length,0);assert.equal(g.state.blastRings.length,1);near(g.p.hp,100);
});
test('fast dashes sweep the whole segment instead of tunneling past fuel',()=>{
  const g=loadGame();cleanRun(g);g.setup({barrels:[fuel(200)]});g.p.speed=10000;g.touch.x=1;g.dash();g.update(.02);
  assert.ok(g.p.x>700);assert.equal(g.state.barrelsBlown,1);
});
test('chain blasts reward each enemy and barrel only once and leave player unharmed',()=>{
  const g=loadGame();cleanRun(g);const barrels=[fuel(60),fuel(180),fuel(300)];
  g.setup({barrels,enemies:[enemy({x:60}),enemy({x:180}),enemy({x:300})]});g.p.hp=17;g.detonateBarrel(barrels[0]);
  assert.equal(g.state.barrelsBlown,3);assert.equal(g.state.blastKills,3);assert.equal(g.state.killCount,3);assert.equal(g.state.gems.length,3);near(g.p.hp,17);
  assert.ok(barrels.every(b=>b.spent));g.detonateBarrel(barrels[0]);assert.equal(g.state.blastKills,3);assert.equal(g.state.gems.length,3);
});
test('blasts damage and push surviving bosses; enemies outside the radius are safe',()=>{
  const g=loadGame();cleanRun(g);const b=fuel(60),boss=enemy({x:70,hp:1000,max:1000,type:3}),far=enemy({x:500});
  g.setup({barrels:[b],enemies:[boss,far]});g.detonateBarrel(b);
  near(boss.hp,880);assert.ok(boss.x>70);near(far.hp,10);assert.equal(g.state.blastKills,0);
});
test('explosion effects freeze while paused, expire in play, and retry clears fuel statistics',()=>{
  const g=loadGame();cleanRun(g);const b=fuel(60);g.setup({barrels:[b]});g.detonateBarrel(b);g.pause();const life=g.state.blastRings[0].life;g.update(1);near(g.state.blastRings[0].life,life);
  g.resume();g.update(.5);assert.equal(g.state.blastRings.length,0);g.start();assert.equal(g.state.barrelsBlown,0);assert.equal(g.state.blastKills,0);assert.equal(g.state.barrels.length,3);
});
test('barrel replenishment stays bounded and discards distant fuel',()=>{
  const g=loadGame();cleanRun(g);g.setup({barrels:[],barrelClock:0,obstacles:[]});
  for(let i=0;i<50;i++)g.updateBarrels(12.1,g.p,false);
  assert.equal(g.state.barrels.length,6);assert.ok(g.state.barrels.every(b=>Math.hypot(b.x-g.p.x,b.y-g.p.y)>=180));
  g.setup({barrels:[fuel(10000)],barrelClock:12});g.updateBarrels(.01,g.p,false);assert.equal(g.state.barrels.length,0);
});
test('initial fuel has clear ground and is reachable with the first dash',()=>{
  const g=loadGame();cleanRun(g);const b=g.state.barrels[0];assert.ok(b.x<g.p.speed*3.8*.17+g.p.r+b.r);
  for(const b of g.state.barrels)assert.ok(!g.state.obstacles.some(o=>b.x>o.x-35&&b.x<o.x+o.w+35&&b.y>o.y-35&&b.y<o.y+o.h+35));
});
test('auto-fire ignores an enemy just defeated by a fuel blast',()=>{
  const g=loadGame();cleanRun(g);g.setup({barrels:[fuel(50)],enemies:[enemy({x:50})]});g.touch.x=1;g.dash();g.update(.04);
  assert.equal(g.state.killCount,1);assert.equal(g.state.bullets.length,0);assert.ok(g.p.fireClock<=0);
});
test('three-minute combat simulation preserves finite state and cleans up blast effects',()=>{
  const g=loadGame();g.start();g.p.inv=999;
  for(let frame=0;frame<10800;frame++){
    while(g.state.mode==='upgrade')g.choose(0);
    const direction=Math.floor(frame/180)%4;g.keys.d=direction===0;g.keys.s=direction===1;g.keys.a=direction===2;g.keys.w=direction===3;
    if(frame%180===0)g.dash();g.update(1/60);if(frame%120===0)g.render();
    assert.ok(Number.isFinite(g.p.x)&&Number.isFinite(g.p.y)&&Number.isFinite(g.p.hp));assert.ok(g.state.barrels.length<=6);assert.ok(g.state.enemies.length<=240);
  }
  assert.ok(g.state.elapsed>179);assert.equal(g.state.mode==='end',false);
  g.scheduleRush(Infinity);g.setup({barrels:[],barrelClock:1000,enemies:[],spawn:1000,activeBoss:null,nextBossAt:1000});g.p.fireClock=10;
  for(let i=0;i<60;i++){while(g.state.mode==='upgrade')g.choose(0);g.update(1/60)}
  assert.equal(g.state.blastRings.length,0);assert.equal(g.state.particles.length,0);
});

test('first boss warns at 80s and spawns once at the 90s milestone',()=>{
  const g=loadGame();cleanRun(g);g.setup({elapsed:79.9});g.update(.05);assert.equal(g.state.bossWarned,false);assert.equal(g.state.activeBoss,null);
  g.update(.06);assert.equal(g.state.bossWarned,true);assert.match(g.el('toast').textContent,/10 SECONDS/);assert.equal(g.state.activeBoss,null);
  g.setup({elapsed:89.99});g.update(.02);const boss=g.state.activeBoss;assert.ok(boss);assert.equal(boss.type,3);assert.equal(g.state.enemies.filter(e=>e.type===3).length,1);
  for(let i=0;i<10;i++)g.updateEncounter();assert.equal(g.state.activeBoss,boss);assert.equal(g.state.enemies.length,1);
});
test('ordinary horde spawns no longer create random bosses at old timing windows',()=>{
  const g=loadGame();cleanRun(g);g.setup({elapsed:110});for(let i=0;i<300;i++)g.spawnEnemy();assert.ok(g.state.enemies.every(e=>e.type<3));
});
test('boss still arrives when the regular horde reaches its reserved capacity',()=>{
  const g=loadGame();cleanRun(g);g.setup({enemies:Array.from({length:239},(_,i)=>enemy({x:2000+i})),elapsed:89.99});g.update(.02);
  assert.ok(g.state.activeBoss);assert.equal(g.state.enemies.length,240);
});
test('paused and upgrade screens freeze boss arrival and charge timing',()=>{
  const g=loadGame();cleanRun(g);g.setup({elapsed:89.9});g.pause();g.update(10);assert.equal(g.state.activeBoss,null);near(g.state.elapsed,89.9);
  g.resume();g.spawnBoss();const boss=g.state.activeBoss;boss.phase='warn';boss.phaseTime=g.tuning.windup;g.setup({xp:8});g.checkLevelUp();assert.equal(g.state.mode,'upgrade');
  g.update(10);near(boss.phaseTime,g.tuning.windup);g.choose(0);g.update(.02);near(boss.phaseTime,g.tuning.windup-.02);
});
test('boss warning locks the charge direction and gives a full stationary windup',()=>{
  const g=loadGame();cleanRun(g);g.spawnBoss();const b=g.state.activeBoss;Object.assign(b,{x:200,y:0,phaseTime:0});g.moveBoss(b,.01);
  assert.equal(b.phase,'warn');near(b.phaseTime,.8);const x=b.x,y=b.y,aimX=b.chargeX,aimY=b.chargeY;
  g.p.y=200;g.moveBoss(b,.4);near(b.x,x);near(b.y,y);near(b.chargeX,aimX);near(b.chargeY,aimY);
  g.moveBoss(b,.6);assert.equal(b.phase,'charge');near(b.phaseTime,.44);g.moveBoss(b,.22);assert.ok(b.x<x);near(b.y,y);
});
test('charge stops for a recovery window before pursuing again',()=>{
  const g=loadGame();cleanRun(g);g.spawnBoss();const b=g.state.activeBoss;Object.assign(b,{x:200,y:0,phase:'charge',phaseTime:g.tuning.chargeTime,chargeX:-1,chargeY:0,chargeLength:300});
  g.moveBoss(b,g.tuning.chargeTime);assert.equal(b.phase,'recover');near(b.x,-100);const x=b.x;g.moveBoss(b,.5);near(b.x,x);assert.equal(b.phase,'recover');
  g.moveBoss(b,.9);assert.equal(b.phase,'approach');near(b.x,x);g.moveBoss(b,.02);assert.ok(b.x>x);
});
function chargingBoss(g,{x=-150,y=0}={}){
  g.spawnBoss();const b=g.state.activeBoss;Object.assign(b,{x,y,phase:'charge',phaseTime:g.tuning.chargeTime,chargeX:1,chargeY:0,chargeLength:360});
  g.setup({enemies:[b],barrels:[]});g.p.fireClock=10;return b;
}
test('charge contact is swept across the path and can be avoided sideways',()=>{
  const hit=loadGame();cleanRun(hit);chargingBoss(hit);hit.update(.3);near(hit.p.hp,70);
  const dodge=loadGame();cleanRun(dodge);chargingBoss(dodge);dodge.p.y=140;dodge.update(.3);near(dodge.p.hp,100);
});
test('dash invulnerability protects against an overlapping boss charge',()=>{
  const g=loadGame();cleanRun(g);chargingBoss(g,{x:0});g.dash();g.update(.02);near(g.p.hp,100);
});
test('boss defeat rewards once, heals within the cap, and schedules the next encounter',()=>{
  const g=loadGame();cleanRun(g);g.setup({elapsed:112});g.spawnBoss();const b=g.state.activeBoss;g.p.hp=40;g.hitEnemy(b,b.hp+1);
  assert.equal(g.state.activeBoss,null);assert.equal(g.state.bossesDefeated,1);near(g.p.hp,65);near(g.state.nextBossAt,202);near(g.state.reliefUntil,120);assert.equal(g.state.gems[0].value,20);
  g.hitEnemy(b,1000);assert.equal(g.state.bossesDefeated,1);assert.equal(g.state.gems.length,1);near(g.p.hp,65);
  g.setup({elapsed:201.9});g.updateEncounter();assert.equal(g.state.activeBoss,null);g.setup({elapsed:202});g.updateEncounter();assert.ok(g.state.activeBoss);assert.ok(g.state.activeBoss.max>b.max);
});
test('boss healing cannot exceed upgraded max health',()=>{
  const g=loadGame();cleanRun(g);g.p.max=130;g.p.hp=125;g.spawnBoss();g.hitEnemy(g.state.activeBoss,9999);near(g.p.hp,130);
});
test('fuel blast can defeat a scheduled boss and keeps its victory notification',()=>{
  const g=loadGame();cleanRun(g);g.spawnBoss();const b=g.state.activeBoss;Object.assign(b,{x:60,y:0,hp:100});const barrel=fuel(60);g.setup({barrels:[barrel]});g.p.hp=50;g.detonateBarrel(barrel);
  assert.equal(g.state.bossesDefeated,1);assert.equal(g.state.blastKills,1);assert.equal(g.state.killCount,1);near(g.p.hp,75);assert.match(g.el('toast').textContent,/BREAKER DOWN/);assert.equal(g.state.gems[0].value,20);
});
test('post-boss breather stops new spawns for eight gameplay seconds',()=>{
  const g=loadGame();cleanRun(g);g.setup({elapsed:100});g.spawnBoss();g.hitEnemy(g.state.activeBoss,9999);g.setup({spawn:0});g.update(1);assert.equal(g.state.enemies.length,0);
  g.pause();g.update(20);near(g.state.elapsed,101);g.resume();g.setup({elapsed:107.99});g.update(.02);assert.equal(g.state.enemies.length,1);assert.ok(g.state.enemies[0].type<3);
});
test('boss HUD shows health, warning, and recovery; retry resets encounter state',()=>{
  const g=loadGame();cleanRun(g);assert.match(g.el('objective').textContent,/BOSS 1 IN 01:30/);assert.equal(g.el('bossMeter').hidden,true);
  g.spawnBoss();const b=g.state.activeBoss;Object.assign(b,{x:200,y:0,phase:'warn',hp:b.max/2});g.updateEncounterHUD();assert.equal(g.el('bossMeter').hidden,false);assert.equal(g.el('bossFill').style.width,'50%');assert.match(g.el('objective').textContent,/→.*DODGE THE LINE/);g.render();
  b.phase='recover';g.updateEncounterHUD();assert.match(g.el('objective').textContent,/RECOVERING/);g.hitEnemy(b,9999);g.updateEncounterHUD();assert.equal(g.el('bossMeter').hidden,true);assert.match(g.el('objective').textContent,/BREATHER/);
  g.start();assert.equal(g.state.bossesDefeated,0);assert.equal(g.state.activeBoss,null);near(g.state.nextBossAt,90);assert.equal(g.state.bossWarned,false);near(g.state.reliefUntil,0);assert.match(g.el('objective').textContent,/BOSS 1 IN 01:30/);
});
test('a boss-and-horde chain blast keeps the victory message over elimination milestones',()=>{
  const g=loadGame();cleanRun(g);g.spawnBoss();const b=g.state.activeBoss;Object.assign(b,{x:60,y:0,hp:100});
  const barrel=fuel(60);g.setup({barrels:[barrel],enemies:[b,...Array.from({length:24},()=>enemy({x:60}))]});g.detonateBarrel(barrel);
  assert.equal(g.state.killCount,25);assert.equal(g.state.blastKills,25);assert.equal(g.state.bossesDefeated,1);assert.match(g.el('toast').textContent,/BREAKER DOWN/);
});
test('base-speed sideways movement can clear the tuned charge after a short reaction delay',()=>{
  const g=loadGame();cleanRun(g);g.spawnBoss();const b=g.state.activeBoss;Object.assign(b,{x:200,y:0,phaseTime:0});g.setup({barrels:[]});g.p.fireClock=10;
  g.moveBoss(b,.001);assert.equal(b.phase,'warn');
  // React after 160ms with normal movement: no dash, invulnerability, or upgrades.
  for(let frame=0;frame<80;frame++){g.keys.s=frame>=8;g.update(.02)}
  near(g.p.hp,100);assert.ok(g.p.y>b.r+g.p.r);assert.equal(b.phase,'recover');
});

function choiceLabels(g){return [...g.el('modal').innerHTML.matchAll(/<b>(.*?)<\/b>/g)].map(m=>m[1])}
test('first upgrade offers each new weapon, and each selection equips the chosen rank',()=>{
  for(const [name,field] of [['Piercing Rounds','pierce'],['Chain Lightning','arc'],['Orbiting Blades','blades'],['Molotov','molotov']]){
    const g=loadGame();cleanRun(g);g.setup({xp:8});g.checkLevelUp();const labels=choiceLabels(g);
    assert.equal(labels.length,4);for(const n of ['Piercing Rounds','Chain Lightning','Orbiting Blades','Molotov'])assert.ok(labels.includes(n));
    g.choose(labels.indexOf(name));assert.equal(g.p[field],1);assert.equal(g.state.mode,'play');
  }
});
test('capped weapons, Multishot, and Rapid Fire stop consuming upgrade choices',()=>{
  const g=loadGame();cleanRun(g);Object.assign(g.p,{pierce:3,arc:3,blades:3,molotov:3,proj:5,fire:.075});
  for(let i=0;i<25;i++){
    g.setup({xp:g.state.nextXp});g.checkLevelUp();const labels=choiceLabels(g);assert.equal(labels.length,3);
    for(const name of ['Piercing Rounds','Chain Lightning','Orbiting Blades','Molotov','Multishot','Rapid Fire'])assert.ok(!labels.some(l=>l.startsWith(name)));
    g.choose(0);
  }
});
test('ordinary fast bullets hit the closest target along the path, regardless of array order',()=>{
  const g=loadGame();cleanRun(g);const far=enemy({x:150,hp:100,r:10}),nearEnemy=enemy({x:40,hp:100,r:10});
  g.setup({enemies:[far,nearEnemy]});g.p.bulletSpeed=1000;g.update(.2);near(nearEnemy.hp,82);near(far.hp,100);assert.equal(g.state.bullets.length,0);
});
test('piercing ranks hit the intended number of successive enemies in path order',()=>{
  for(const rank of [1,2,3]){
    const g=loadGame();cleanRun(g);g.p.pierce=rank;g.p.bulletSpeed=1000;
    const targets=Array.from({length:5},(_,i)=>enemy({x:40+i*40,hp:100,r:10}));g.setup({enemies:[...targets].reverse()});g.update(.25);
    for(let i=0;i<targets.length;i++)near(targets[i].hp,i<=rank?82:100);assert.equal(g.state.bullets.length,0);
  }
});
test('piercing shot cannot damage the same large enemy on successive frames',()=>{
  const g=loadGame();cleanRun(g);const e=enemy({x:0,r:45,hp:1000});g.setup({enemies:[e],bullets:[{...bullet(),x:0,vx:10,remainingHits:4}]});
  g.updateProjectiles(.01);g.updateProjectiles(.01);g.updateProjectiles(.01);near(e.hp,982);assert.equal(g.state.bullets[0].remainingHits,3);
});
test('expired bullets do not hit enemies beyond their remaining travel distance',()=>{
  const g=loadGame();cleanRun(g);const e=enemy({x:100,hp:100});g.setup({enemies:[e],bullets:[{...bullet(),x:0,vx:1000,life:.01}]});g.updateProjectiles(1);
  near(e.hp,100);assert.equal(g.state.bullets.length,0);
});
test('upgrading piercing does not retroactively modify shots already in flight',()=>{
  const g=loadGame();cleanRun(g);g.setup({enemies:[enemy({x:200,hp:100})]});g.update(.01);assert.equal(g.state.bullets[0].remainingHits,1);
  g.p.pierce=3;g.p.fireClock=10;const a=enemy({x:40,hp:100,r:10}),b=enemy({x:80,hp:100,r:10});g.setup({enemies:[a,b]});g.update(.2);near(a.hp,82);near(b.hp,100);
});
test('lightning follows nearby enemies, respects jump count, and never repeats a target',()=>{
  const g=loadGame();cleanRun(g);g.p.arc=1;
  const targets=[100,200,320,500].map(x=>enemy({x,hp:1000}));g.setup({enemies:targets});assert.equal(g.fireLightning(),3);
  for(let i=0;i<4;i++)near(targets[i].hp,i<3?985.6:1000);
  assert.equal(g.state.lightning.length,3);near(g.state.lightning[1].x1,100);near(g.state.lightning[1].x2,200);
  const pair=loadGame();cleanRun(pair);pair.p.arc=3;const a=enemy({x:100,hp:1000}),b=enemy({x:120,hp:1000});pair.setup({enemies:[a,b]});assert.equal(pair.fireLightning(),2);near(a.hp,985.6);near(b.hp,985.6);
});
test('lightning stops across a gap and ignores dead or initially out-of-range targets',()=>{
  const g=loadGame();cleanRun(g);g.p.arc=3;const a=enemy({x:100,hp:100}),b=enemy({x:251,hp:100});g.setup({enemies:[a,b]});assert.equal(g.fireLightning(),1);near(b.hp,100);
  g.setup({enemies:[enemy({x:10,hp:0}),enemy({x:301,hp:100})]});assert.equal(g.fireLightning(),0);
});
test('higher lightning rank reaches five distinct enemies through a chain',()=>{
  const g=loadGame();cleanRun(g);g.p.arc=3;const targets=Array.from({length:6},(_,i)=>enemy({x:100+i*120,hp:100}));g.setup({enemies:targets});assert.equal(g.fireLightning(),5);
  for(let i=0;i<6;i++)near(targets[i].hp,i<5?85.6:100);
});
test('lightning waits between pulses and starts sooner after its first unlock',()=>{
  const g=loadGame();cleanRun(g);g.opts.find(o=>o.weapon==='arc').apply();g.p.fireClock=10;const e=enemy({x:100,hp:1000});g.setup({enemies:[e]});
  g.update(.19);near(e.hp,1000);g.update(.02);near(e.hp,985.6);g.update(.7);g.update(.6);near(e.hp,985.6);g.update(.06);near(e.hp,971.2);
});
test('blades damage on contact, not every frame, and can hit again after their cooldown',()=>{
  const g=loadGame();cleanRun(g);g.p.blades=1;g.p.fireClock=10;const e=enemy({x:78,hp:100});g.setup({enemies:[e]});g.update(.01);near(e.hp,80.2);g.update(.01);near(e.hp,80.2);
  g.setup({elapsed:.5});const pos=g.bladePositions()[0];e.x=pos.x;e.y=pos.y;g.update(.001);near(e.hp,60.4);
});
test('overlapping blades share an enemy cooldown instead of multiplying instant contact damage',()=>{
  const g=loadGame();cleanRun(g);g.p.blades=3;g.p.fireClock=10;g.p.inv=999;const e=enemy({x:0,r:100,hp:1000});g.setup({enemies:[e]});g.update(.01);g.update(.01);
  near(e.hp,980.2);assert.equal(g.state.bladeHits.size,1);assert.equal(g.bladePositions().length,4);
});
test('moving blades sweep their path during a fast dash',()=>{
  const g=loadGame();cleanRun(g);g.p.blades=1;g.p.fireClock=10;g.p.speed=10000;g.touch.x=1;const e=enemy({x:400,hp:100});g.setup({enemies:[e],barrels:[]});g.dash();g.update(.02);
  assert.ok(g.p.x>700);near(e.hp,80.2);
});
test('Heavy Rounds damage feeds both lightning and blade contact',()=>{
  const g=loadGame();cleanRun(g);g.p.arc=1;g.p.damage=100;const e=enemy({x:78,hp:1000});g.setup({enemies:[e]});g.fireLightning();near(e.hp,920);
  g.p.arc=0;g.p.blades=1;g.updateWeapons(0,g.p);near(e.hp,810);
});
test('new weapon timers and effects freeze during pause and upgrades',()=>{
  const g=loadGame();cleanRun(g);g.p.arc=1;g.p.blades=1;g.p.fireClock=10;g.setup({enemies:[enemy({x:100,hp:1000})]});g.update(.21);
  const clock=g.state.chainClock,life=g.state.lightning[0].life,pos=g.bladePositions()[0];g.pause();g.update(10);near(g.state.chainClock,clock);near(g.state.lightning[0].life,life);near(g.bladePositions()[0].x,pos.x);
  g.resume();g.setup({xp:g.state.nextXp});g.checkLevelUp();g.update(10);near(g.state.chainClock,clock);near(g.state.lightning[0].life,life);
});
test('combined gun, lightning, and blades reward a defeated boss only once',()=>{
  const g=loadGame();cleanRun(g);g.spawnBoss();const b=g.state.activeBoss;Object.assign(b,{x:78,y:0,hp:10});Object.assign(g.p,{arc:1,blades:1,hp:50,fireClock:10});
  g.setup({enemies:[b],bullets:[{...bullet(),x:78,remainingHits:4}]});g.update(.21);
  assert.equal(g.state.bossesDefeated,1);assert.equal(g.state.killCount,1);assert.equal(g.state.gems.length,1);assert.equal(g.state.gems[0].value,20);near(g.p.hp,75);
});
test('build summary is visible on pause/end and retry clears new weapons and effects',()=>{
  const g=loadGame();cleanRun(g);Object.assign(g.p,{pierce:2,arc:1,blades:3,proj:4});g.setup({enemies:[enemy({x:78,hp:1000})]});g.fireLightning();g.updateWeapons(0,g.p);g.pause();
  assert.match(g.el('modal').innerHTML,/Gun ×4 · Pierce 2\/3 · Lightning 1\/3 · Blades 3\/3/);quitForTest(g);assert.match(g.el('modal').innerHTML,/Build: Gun ×4/);g.el('again').click();
  assert.equal(g.p.pierce,0);assert.equal(g.p.arc,0);assert.equal(g.p.blades,0);assert.equal(g.state.lightning.length,0);assert.equal(g.state.bladeHits.size,0);assert.equal(g.state.bullets.length,0);assert.equal(g.buildSummary(),'Gun ×1');
});
test('Rapid Fire caps cleanly and bounded lightning effects expire',()=>{
  const g=loadGame();cleanRun(g);const rapid=g.opts.find(o=>o.name==='Rapid Fire');for(let i=0;i<100&&rapid.available();i++)rapid.apply();near(g.p.fire,.075);assert.equal(rapid.available(),false);
  g.p.arc=3;g.setup({enemies:[enemy({x:100,hp:1000000}),enemy({x:150,hp:1000000})]});for(let i=0;i<20;i++)g.fireLightning();assert.ok(g.state.lightning.length<=g.limits.lightning);
  g.p.arc=0;g.updateWeapons(.2,g.p);assert.equal(g.state.lightning.length,0);
});
test('two-minute combined-weapon simulation respects effect/entity budgets and cleans up',()=>{
  const g=loadGame();g.start();Object.assign(g.p,{pierce:3,arc:3,blades:3,molotov:3,proj:5,fire:.075,inv:999});
  for(let frame=0;frame<7200;frame++){
    while(g.state.mode==='upgrade')g.choose(0);
    const direction=Math.floor(frame/150)%4;g.keys.d=direction===0;g.keys.s=direction===1;g.keys.a=direction===2;g.keys.w=direction===3;
    if(frame%180===0)g.dash();g.update(1/60);if(frame%120===0)g.render();
    assert.ok(Number.isFinite(g.p.hp)&&Number.isFinite(g.p.x)&&Number.isFinite(g.p.y));assert.ok(g.state.enemies.length<=240);assert.ok(g.state.bullets.length<=g.limits.bullets);assert.ok(g.state.lightning.length<=g.limits.lightning);assert.ok(g.state.particles.length<=g.limits.particles);assert.ok(g.state.texts.length<=g.limits.texts);assert.ok(g.state.bladeHits.size<=240);
  }
  while(g.state.mode==='upgrade')g.choose(0);
  g.scheduleRush(Infinity);g.leaveConvoy();g.setup({nextConvoyAt:Infinity});g.p.arc=g.p.blades=g.p.molotov=0;g.p.fireClock=10;g.setup({enemies:[],barrels:[],gems:[],salvage:null,nextSalvageAt:Infinity,supplyDrop:null,nextDropAt:Infinity,rescue:null,nextRescueAt:Infinity,spawn:1000,activeBoss:null,nextBossAt:1000,nextSpitterAt:Infinity,nextRiotAt:Infinity});
  // Isolate natural effect expiry from fresh loot and objective choice screens.
  for(let i=0;i<300;i++){g.update(1/60);assert.equal(g.state.mode,'play')}
  assert.equal(g.state.bullets.length,0);assert.equal(g.state.lightning.length,0);assert.equal(g.state.bladeHits.size,0);assert.equal(g.state.bottles.length,0);assert.equal(g.state.fires.length,0);assert.equal(g.state.burnHits.size,0);assert.equal(g.state.particles.length,0);assert.equal(g.state.texts.length,0);
});

function startTestRush(g){g.setup({elapsed:44.99});g.update(.02);assert.equal(g.state.rushPhase,'active')}
function finishTestRush(g){g.setup({elapsed:56.99});g.update(.02)}
test('Blackout warns at 40s, starts at 45s, and leaves the boss schedule intact',()=>{
  const g=loadGame();cleanRun(g);g.setup({elapsed:39.9});g.update(.05);assert.equal(g.state.rushPhase,'waiting');
  g.update(.06);assert.equal(g.state.rushPhase,'warning');assert.match(g.el('objective').textContent,/BLACKOUT IN 5s/);g.render();
  startTestRush(g);near(g.state.rushUntil,57);assert.equal(g.state.rushSpawned,1);assert.match(g.el('objective').textContent,/BLACKOUT RUSH 12s/);near(g.state.nextBossAt,90);g.render();
});
test('Rush hunters alternate outside their marked sides in both directions',()=>{
  for(const axis of ['horizontal','vertical']){
    const g=loadGame();cleanRun(g);g.setup({rushAxis:axis});g.spawnRushHunter();g.spawnRushHunter();const [a,b]=g.state.enemies;
    if(axis==='horizontal'){assert.ok(a.x>206+12);assert.ok(b.x< -206-12);near(a.x,-b.x)}else{assert.ok(a.y>457.5+12);assert.ok(b.y< -457.5-12);near(a.y,-b.y)}
    assert.ok(a.rush&&b.rush);assert.equal(a.type,1);assert.equal(b.type,1);
  }
});
test('Rush spawns at most sixteen hunters and respects the reserved horde capacity',()=>{
  const g=loadGame();cleanRun(g);startTestRush(g);
  for(let i=1;i<600;i++){g.setup({elapsed:45+i*.02});g.updateRush(.02)}
  assert.equal(g.state.rushSpawned,16);assert.equal(g.state.enemies.length,16);
  const capped=loadGame();cleanRun(capped);capped.setup({enemies:Array.from({length:239},(_,i)=>enemy({x:2000+i}))});startTestRush(capped);assert.equal(capped.state.rushSpawned,0);assert.equal(capped.state.enemies.length,239);
  capped.setup({enemies:capped.state.enemies.slice(1)});capped.updateRush(.02);assert.equal(capped.state.rushSpawned,1);assert.equal(capped.state.enemies.length,239);
});
test('survival grants one bonus choice, capped healing, and preserves earned XP',()=>{
  const g=loadGame();cleanRun(g);startTestRush(g);g.p.hp=40;g.p.fireClock=10;g.setup({xp:3});finishTestRush(g);
  assert.equal(g.state.rushesSurvived,1);assert.equal(g.state.rushPhase,'waiting');assert.equal(g.state.mode,'upgrade');near(g.p.hp,55);assert.equal(g.state.xp,3);assert.equal(g.state.nextXp,8);assert.match(g.el('modal').innerHTML,/BLACKOUT SURVIVED · BONUS UPGRADE/);
  g.choose(0);assert.equal(g.state.mode,'play');g.resolveRushReward();assert.equal(g.state.rushesSurvived,1);near(g.p.hp,55);assert.equal(g.state.xp,3);assert.equal(g.state.nextRushAt,Infinity);
  const full=loadGame();cleanRun(full);startTestRush(full);full.p.hp=98;finishTestRush(full);near(full.p.hp,100);
});
test('bonus and already-earned level-up choices both resolve without losing XP',()=>{
  const g=loadGame();cleanRun(g);startTestRush(g);g.setup({xp:8});finishTestRush(g);
  assert.equal(g.state.level,2);assert.equal(g.state.xp,8);assert.equal(g.state.nextXp,8);g.choose(0);
  assert.equal(g.state.mode,'upgrade');assert.equal(g.state.level,3);assert.equal(g.state.xp,0);assert.equal(g.state.nextXp,15);g.choose(0);assert.equal(g.state.mode,'play');
});
test('dying on the final Rush tick grants no survival credit, healing, or upgrade',()=>{
  const g=loadGame();cleanRun(g);startTestRush(g);g.p.hp=1;g.p.fireClock=10;g.setup({enemies:[enemy({x:0,hp:10000,dmg:99})]});finishTestRush(g);
  assert.equal(g.state.mode,'end');assert.equal(g.state.rushesSurvived,0);assert.equal(g.state.bonusChoices,0);near(g.p.hp,0);g.resolveRushReward();assert.equal(g.state.rushesSurvived,0);assert.match(g.el('modal').innerHTML,/<strong>0<\/strong><small>BLACKOUTS SURVIVED/);
});
test('manual end-run before completion does not award a Rush reward',()=>{
  const g=loadGame();cleanRun(g);startTestRush(g);g.pause();quitForTest(g);g.update(30);assert.equal(g.state.mode,'end');assert.equal(g.state.rushesSurvived,0);assert.equal(g.state.bonusChoices,0);
});
test('pause and upgrade screens freeze warning and active Rush timers',()=>{
  const g=loadGame();cleanRun(g);g.setup({elapsed:44.9});g.updateRush(0);assert.equal(g.state.rushPhase,'warning');g.pause();g.update(10);near(g.state.elapsed,44.9);assert.equal(g.state.rushPhase,'warning');
  g.resume();g.setup({xp:8});g.checkLevelUp();g.update(10);near(g.state.elapsed,44.9);assert.equal(g.state.rushPhase,'warning');g.choose(0);g.update(.11);assert.equal(g.state.rushPhase,'active');
  const until=g.state.rushUntil,count=g.state.rushSpawned,clock=g.state.elapsed;g.pause();g.update(100);near(g.state.rushUntil,until);near(g.state.elapsed,clock);assert.equal(g.state.rushSpawned,count);
});
test('a late event is skipped instead of colliding with boss preparation',()=>{
  const g=loadGame();cleanRun(g);g.setup({elapsed:79});g.updateRush(.02);assert.equal(g.state.rushPhase,'waiting');assert.equal(g.state.nextRushAt,Infinity);assert.equal(g.state.rushSpawned,0);
  g.setup({elapsed:90});g.updateEncounter();assert.ok(g.state.activeBoss);assert.equal(g.state.rushPhase,'waiting');
});
test('boss arrival cancels a Rush and boss defeat schedules the next one after a safe gap',()=>{
  const g=loadGame();cleanRun(g);startTestRush(g);g.spawnBoss();assert.equal(g.state.rushPhase,'waiting');assert.equal(g.state.nextRushAt,Infinity);assert.equal(g.state.rushesSurvived,0);
  g.setup({elapsed:100});g.hitEnemy(g.state.activeBoss,9999);near(g.state.nextRushAt,135);near(g.state.nextBossAt,190);
  g.setup({elapsed:129.99});g.updateRush(0);assert.equal(g.state.rushPhase,'waiting');g.setup({elapsed:130.01});g.updateRush(0);assert.equal(g.state.rushPhase,'warning');g.setup({elapsed:135});g.updateRush(.01);assert.equal(g.state.rushPhase,'active');near(g.state.rushUntil,147);
});
test('Rush completion gives a four-second spawn break with an accurate HUD label',()=>{
  const g=loadGame();cleanRun(g);startTestRush(g);finishTestRush(g);g.choose(0);assert.match(g.el('objective').textContent,/BLACKOUT CLEAR • BREATHER/);
  g.p.fireClock=10;const count=g.state.enemies.length;g.setup({spawn:0,elapsed:58});g.update(.02);assert.equal(g.state.enemies.length,count);
  g.setup({elapsed:61.02});g.update(.02);assert.equal(g.state.enemies.length,count+1);assert.match(g.el('objective').textContent,/BOSS 1 IN/);
});
test('Rush survival appears on the end screen and retry clears its state',()=>{
  const g=loadGame();cleanRun(g);startTestRush(g);finishTestRush(g);g.choose(0);g.pause();quitForTest(g);assert.match(g.el('modal').innerHTML,/<strong>1<\/strong><small>BLACKOUTS SURVIVED/);
  g.el('again').click();assert.equal(g.state.rushPhase,'waiting');near(g.state.nextRushAt,45);assert.equal(g.state.rushesSurvived,0);assert.equal(g.state.rushSpawned,0);assert.equal(g.state.rushPendingReward,false);assert.equal(g.state.bonusChoices,0);
});
test('Rush bonus upgrades remain selectable when every weapon is already capped',()=>{
  const g=loadGame();cleanRun(g);Object.assign(g.p,{pierce:3,arc:3,blades:3,molotov:3,proj:5,fire:.075});startTestRush(g);g.setup({enemies:[],barrels:[]});finishTestRush(g);
  const labels=choiceLabels(g);assert.equal(labels.length,3);for(const label of labels)assert.ok(!/Piercing|Lightning|Blades|Multishot|Rapid Fire/.test(label));g.choose(0);assert.equal(g.state.mode,'play');
});
test('Rush reward resolves once even if its resolver is called repeatedly',()=>{
  const g=loadGame();cleanRun(g);startTestRush(g);g.setup({elapsed:57});g.updateRush(.02);assert.equal(g.state.rushPendingReward,true);assert.equal(g.state.rushesSurvived,0);
  for(let i=0;i<10;i++)g.resolveRushReward();assert.equal(g.state.rushesSurvived,1);assert.equal(g.state.bonusChoices,1);g.checkLevelUp();assert.equal(g.state.bonusChoices,0);assert.equal(g.state.mode,'upgrade');
});

function prepareExit(g){
  cleanRun(g);g.scheduleRush(Infinity);g.setup({elapsed:179.99,bossesDefeated:1,nextBossAt:1000});g.update(.02);assert.ok(g.state.exitBeacon);
}
function reachExit(g){const b=g.state.exitBeacon,from={x:g.p.x,y:g.p.y};g.p.x=b.x;g.p.y=b.y;g.updateExtractionArrival(from);assert.equal(g.state.mode,'extraction')}
test('first exit is the owner-selected three-minute milestone and requires a Breaker defeat',()=>{
  const g=loadGame();cleanRun(g);assert.equal(g.state.exitAt,180);assert.match(g.el('runGoal').textContent,/EXIT IN 03:00/);g.scheduleRush(Infinity);g.setup({elapsed:179.9,nextBossAt:1000,bossesDefeated:1});g.update(.02);assert.equal(g.state.exitBeacon,null);
  g.setup({elapsed:180,bossesDefeated:0});g.update(.02);assert.equal(g.state.exitBeacon,null);assert.match(g.el('runGoal').textContent,/EXIT LOCKED.*DEFEAT A BREAKER/);
  g.setup({bossesDefeated:1});g.update(.02);assert.ok(g.state.exitBeacon);assert.equal(g.state.mode,'play');
});
test('exit waits for an active boss, then opens when the fight is cleared',()=>{
  const g=loadGame();cleanRun(g);g.scheduleRush(Infinity);g.setup({elapsed:179.99});g.spawnBoss();g.update(.02);assert.equal(g.state.exitBeacon,null);
  g.hitEnemy(g.state.activeBoss,9999);g.update(.02);assert.ok(g.state.exitBeacon);assert.equal(g.state.bossesDefeated,1);
});
test('exit waits for a Rush and its bonus choice before opening',()=>{
  const g=loadGame();cleanRun(g);g.setup({elapsed:168,bossesDefeated:1,nextBossAt:1000});g.scheduleRush(168);g.updateRush(.01);assert.equal(g.state.rushPhase,'active');
  g.setup({elapsed:179.99});g.update(.02);assert.equal(g.state.exitBeacon,null);assert.equal(g.state.mode,'upgrade');g.choose(0);g.update(.02);assert.ok(g.state.exitBeacon);
});
test('beacon appears on clear ground and does not automatically extract a distant player',()=>{
  const g=loadGame();cleanRun(g);g.scheduleRush(Infinity);g.setup({elapsed:180,bossesDefeated:1,nextBossAt:1000,obstacles:[{x:100,y:-110,w:30,h:30},{x:10000,y:10000,w:30,h:30}]});g.updateExtractionWindow();
  const b=g.state.exitBeacon;assert.ok(Math.hypot(b.x-g.p.x,b.y-g.p.y)>b.r+g.p.r);assert.equal(g.state.obstacles.length,1);assert.equal(g.state.mode,'play');g.render();
});
test('reaching the exit freezes combat and supports a held-joystick secondary touch to extract',()=>{
  const g=loadGame();prepareExit(g);g.keys.d=true;g.touch.x=1;reachExit(g);const elapsed=g.state.elapsed,hp=g.p.hp;assert.equal(Object.keys(g.keys).length,0);near(g.touch.x,0);
  g.update(20);near(g.state.elapsed,elapsed);near(g.p.hp,hp);g.advanceClock(500);g.el('extract').dispatch('pointerdown',{pointerId:2,isPrimary:false});g.el('extract').dispatch('pointerup',{pointerId:2,isPrimary:false});assert.equal(g.state.mode,'end');assert.equal(g.state.runOutcome,'extracted');assert.match(g.el('modal').innerHTML,/EXTRACTED.<br>YOU MADE IT./);near(Number(g.saved()),elapsed);
});
test('extraction buttons ignore delayed clicks and cannot award a second result',()=>{
  const g=loadGame();prepareExit(g);reachExit(g);const button=g.el('extract');button.click(1);assert.equal(g.state.mode,'extraction');g.advanceClock(500);button.click();assert.equal(g.state.runOutcome,'extracted');const record=g.saved();button.dispatch('pointerdown',{pointerId:4});g.completeExtraction();assert.equal(g.saved(),record);assert.equal(g.state.mode,'end');
});
test('a fast pass through the beacon is detected even if the endpoint is outside it',()=>{
  const g=loadGame();prepareExit(g);const b=g.state.exitBeacon;g.p.x=b.x-200;g.p.y=b.y;g.p.speed=20000;g.touch.x=1;g.update(.02);
  assert.ok(g.p.x>b.x+b.r);assert.equal(g.state.mode,'extraction');
});
test('death during a beacon crossing gives a defeat, not an extraction victory',()=>{
  const g=loadGame();prepareExit(g);const b=g.state.exitBeacon;g.p.x=b.x;g.p.y=b.y;g.p.hp=1;g.p.fireClock=10;g.setup({bullets:[],enemies:[enemy({x:b.x,y:b.y,hp:10000,dmg:99})]});g.update(.02);
  assert.equal(g.state.mode,'end');assert.equal(g.state.runOutcome,'defeated');assert.equal(g.el('extract'),undefined);g.completeExtraction();assert.equal(g.state.runOutcome,'defeated');
});
test('extracting with blocked storage still produces a victory with a session record',()=>{
  const g=loadGame({storageBlocked:true});prepareExit(g);reachExit(g);chooseExitForTest(g,'extract');assert.equal(g.state.runOutcome,'extracted');assert.match(g.el('modal').innerHTML,/storage is unavailable/);assert.ok(g.state.record>=180);
  const best=loadGame({stored:'500'});prepareExit(best);reachExit(best);chooseExitForTest(best,'extract');assert.equal(best.saved(),'500');near(best.state.record,500);
});
test('ending a run manually is recorded as abandoned rather than an extraction',()=>{
  const g=loadGame();cleanRun(g);g.pause();quitForTest(g);assert.equal(g.state.runOutcome,'abandoned');assert.match(g.el('modal').innerHTML,/RUN ENDED./);assert.doesNotMatch(g.el('modal').innerHTML,/EXTRACTION COMPLETE/);
});
test('visibility changes and pause shortcuts cannot bypass or resume the extraction choice',()=>{
  const g=loadGame();prepareExit(g);reachExit(g);const elapsed=g.state.elapsed;g.event('keydown',{key:'p'});g.document.hidden=true;g.event('visibilitychange');g.resume();g.update(30);assert.equal(g.state.mode,'extraction');near(g.state.elapsed,elapsed);
  g.document.hidden=false;g.event('visibilitychange');assert.equal(g.state.mode,'extraction');chooseExitForTest(g,'stay');assert.equal(g.state.mode,'play');
});
test('staying retains the build and health, starts overtime once, and schedules a later exit',()=>{
  const g=loadGame();prepareExit(g);Object.assign(g.p,{pierce:2,arc:1,blades:3,hp:57,damage:40});reachExit(g);const elapsed=g.state.elapsed,button=g.el('stay');g.advanceClock(500);button.dispatch('pointerdown',{pointerId:2,isPrimary:false});button.dispatch('pointerup',{pointerId:2,isPrimary:false});
  assert.equal(g.state.mode,'play');assert.equal(g.state.overtime,1);assert.equal(g.state.exitBeacon,null);near(g.state.exitAt,elapsed+60);near(g.p.hp,57);assert.equal(g.p.pierce,2);assert.equal(g.p.arc,1);assert.equal(g.p.blades,3);near(g.p.damage,40);assert.equal(g.state.runOutcome,'');button.click(1);assert.equal(g.state.overtime,1);near(g.state.nextRushAt,elapsed+10);assert.ok(g.state.nextBossAt>=elapsed+40);
});
test('overtime changes new spawn cadence and movement without changing existing enemy speeds',()=>{
  const base=loadGame();cleanRun(base);base.scheduleRush(Infinity);base.setup({elapsed:182.11,nextBossAt:1000,spawn:0});base.update(.001);
  const g=loadGame();prepareExit(g);reachExit(g);chooseExitForTest(g,'stay');g.setup({elapsed:182.11,spawn:0});g.update(.001);
  near(base.state.spawn/g.state.spawn,1.2);assert.equal(base.state.enemies[0].type,g.state.enemies[0].type);near(g.state.enemies[0].speed/base.state.enemies[0].speed,1.04);
  const existing=g.state.enemies[0],speed=existing.speed;g.setup({elapsed:g.state.exitAt,activeBoss:null,nextBossAt:1000});g.scheduleRush(Infinity);g.updateExtractionWindow();reachExit(g);chooseExitForTest(g,'stay');near(existing.speed,speed);near(g.overtimePressure().spawn,1.4);
});
test('repeated overtime pressure is capped and later exits remain available',()=>{
  const g=loadGame();prepareExit(g);
  for(let i=0;i<8;i++){
    reachExit(g);chooseExitForTest(g,'stay');assert.equal(g.state.overtime,i+1);g.scheduleRush(Infinity);g.setup({elapsed:g.state.exitAt,activeBoss:null,nextBossAt:10000});g.updateExtractionWindow();assert.ok(g.state.exitBeacon);
  }
  near(g.overtimePressure().spawn,1.75);near(g.overtimePressure().speed,1.2);reachExit(g);chooseExitForTest(g,'extract');assert.equal(g.state.runOutcome,'extracted');assert.match(g.el('modal').innerHTML,/<strong>8<\/strong><small>OVERTIME PUSHES/);
});
test('opening a beacon grants a short arrival margin without suppressing bosses indefinitely',()=>{
  const g=loadGame();cleanRun(g);g.scheduleRush(Infinity);g.setup({elapsed:179.99,bossesDefeated:1,nextBossAt:180});g.update(.02);assert.ok(g.state.exitBeacon);assert.equal(g.state.activeBoss,null);near(g.state.nextBossAt,205.01);
  g.setup({elapsed:195.02});g.updateEncounter();g.updateEncounterHUD();assert.equal(g.state.bossWarned,true);assert.match(g.el('objective').textContent,/WARDEN IN/);assert.match(g.el('runGoal').textContent,/EXIT/);
  g.setup({elapsed:205.02});g.updateEncounter();assert.ok(g.state.activeBoss);assert.ok(g.state.exitBeacon);
});
test('staying during a later active encounter preserves its boss or Rush state',()=>{
  const g=loadGame();prepareExit(g);g.spawnBoss('breaker');const boss=g.state.activeBoss;boss.x=g.state.exitBeacon.x+500;boss.y=g.state.exitBeacon.y;boss.phase='warn';boss.phaseTime=.7;reachExit(g);chooseExitForTest(g,'stay');assert.equal(g.state.activeBoss,boss);assert.equal(boss.phase,'warn');near(boss.phaseTime,.7);
  const rush=loadGame();prepareExit(rush);rush.scheduleRush(rush.state.elapsed);rush.updateRush(.01);const until=rush.state.rushUntil;reachExit(rush);chooseExitForTest(rush,'stay');assert.equal(rush.state.rushPhase,'active');near(rush.state.rushUntil,until);
});
test('earned and bonus upgrades remain queued when continuing from the extraction choice',()=>{
  const g=loadGame();prepareExit(g);g.setup({xp:8,bonusChoices:1});reachExit(g);chooseExitForTest(g,'stay');assert.equal(g.state.mode,'upgrade');assert.equal(g.state.overtime,1);assert.equal(g.state.xp,8);g.choose(0);assert.equal(g.state.mode,'upgrade');assert.equal(g.state.xp,0);g.choose(0);assert.equal(g.state.mode,'play');
});
test('arriving with an earned upgrade resolves that choice before offering extraction',()=>{
  const g=loadGame();prepareExit(g);const b=g.state.exitBeacon;g.p.x=b.x;g.p.y=b.y;g.setup({xp:8});g.update(.02);assert.equal(g.state.mode,'upgrade');assert.equal(g.el('extract'),undefined);g.choose(0);g.update(.02);assert.equal(g.state.mode,'extraction');
});
test('a later exit waits at least sixty seconds and until any current boss is cleared',()=>{
  const g=loadGame();prepareExit(g);reachExit(g);chooseExitForTest(g,'stay');g.scheduleRush(Infinity);g.setup({elapsed:g.state.exitAt-.1,nextBossAt:1000});g.updateExtractionWindow();assert.equal(g.state.exitBeacon,null);
  g.spawnBoss();g.setup({elapsed:g.state.exitAt+.1});g.updateExtractionWindow();assert.equal(g.state.exitBeacon,null);g.hitEnemy(g.state.activeBoss,99999);g.updateExtractionWindow();assert.ok(g.state.exitBeacon);
});
test('retry clears exit, overtime, and outcome while preserving the personal record',()=>{
  const g=loadGame();prepareExit(g);reachExit(g);chooseExitForTest(g,'stay');g.scheduleRush(Infinity);g.setup({elapsed:g.state.exitAt,nextBossAt:1000});g.updateExtractionWindow();reachExit(g);chooseExitForTest(g,'extract');const record=g.state.record;g.el('again').click();
  assert.equal(g.state.mode,'play');assert.equal(g.state.exitBeacon,null);assert.equal(g.state.exitAt,180);assert.equal(g.state.overtime,0);assert.equal(g.state.runOutcome,'');near(g.state.record,record);assert.equal(g.state.bossesDefeated,0);assert.match(g.el('runGoal').textContent,/EXIT IN 03:00/);
});
test('a full three-minute combat simulation can reach the beacon and finish with a victory',()=>{
  const g=loadGame();g.start();Object.assign(g.p,{inv:999,pierce:3,arc:3,blades:3,molotov:3,proj:5,fire:.075,damage:54,magnet:300});
  for(let frame=0;frame<6500&&!g.state.exitBeacon;frame++){
    while(g.state.mode==='upgrade')g.choose(0);g.update(1/30);
    assert.ok(g.state.enemies.length<=240);assert.ok(g.state.bullets.length<=g.limits.bullets);assert.ok(g.state.particles.length<=g.limits.particles);assert.ok(g.state.texts.length<=g.limits.texts);
  }
  while(g.state.mode==='upgrade')g.choose(0);assert.ok(g.state.elapsed>=180);assert.ok(g.state.exitBeacon);assert.ok(g.state.bossesDefeated>=1);
  for(let frame=0;frame<180&&g.state.mode!=='extraction';frame++){
    while(g.state.mode==='upgrade')g.choose(0);const b=g.state.exitBeacon,dx=b.x-g.p.x,dy=b.y-g.p.y,length=Math.hypot(dx,dy)||1;g.touch.x=dx/length;g.touch.y=dy/length;g.update(1/60);
  }
  assert.equal(g.state.mode,'extraction');chooseExitForTest(g,'extract');assert.equal(g.state.runOutcome,'extracted');assert.equal(g.state.mode,'end');assert.ok(Number(g.saved())>=180);
});

function journalData(selected='survivor',extra={}){return JSON.stringify({version:1,selected,totals:{runs:0,extractions:0,breakers:0,blackouts:0,bestOvertime:0},history:[],...extra})}
function pickSurvivor(g,id){g.showRoster();g.el('role-'+id).click();g.el('deploy').click()}
test('new game offers all four survivors with no unlock requirement',()=>{
  const g=loadGame();assert.ok(g.el('start'));g.el('start').click();assert.equal(g.state.mode,'roster');
  for(const id of ['survivor','scout','bulwark','engineer','scavenger'])assert.ok(g.el('role-'+id));assert.equal(g.el('role-survivor').attrs['aria-pressed'],'true');assert.match(g.el('modal').innerHTML,/All loadouts are available/);
});
test('Scout selection/deploy supports secondary touches and ignores stale deploy events',()=>{
  const g=loadGame({stored:'42'});g.el('start').click();g.el('role-scout').dispatch('pointerdown',{pointerId:2,isPrimary:false});assert.equal(g.state.selectedSurvivor,'scout');assert.equal(g.el('role-scout').attrs['aria-pressed'],'true');assert.match(g.el('deploy').textContent,/SCOUT/);
  const deploy=g.el('deploy');deploy.dispatch('pointerdown',{pointerId:3,isPrimary:false});assert.equal(g.state.mode,'play');assert.equal(g.state.runSurvivor,'scout');near(g.p.hp,85);near(g.p.max,85);near(g.p.speed,245);assert.equal(g.saved(),'42');
  g.update(.02);const time=g.state.elapsed;deploy.click(1);deploy.dispatch('pointerdown',{pointerId:4});near(g.state.elapsed,time);
});
test('each survivor has its own base movement/health and the same starting weapons',()=>{
  for(const [id,hp,speed] of [['survivor',100,210],['scout',85,245],['bulwark',140,185],['engineer',95,200]]){
    const g=loadGame({journalStored:journalData(id)});cleanRun(g);assert.equal(g.state.runSurvivor,id);near(g.p.hp,hp);near(g.p.max,hp);near(g.p.speed,speed);near(g.p.damage,18);near(g.p.fire,.33);assert.equal(g.p.proj,1);assert.equal(g.p.arc+g.p.blades+g.p.pierce,0);
    g.keys.d=true;g.update(.02);near(g.p.x,speed*.02);g.render();
  }
});
test('selected survivor persists independently from the existing best-time key',()=>{
  const g=loadGame({stored:'77'});g.showRoster();g.selectSurvivor('scout');assert.equal(JSON.parse(g.journalSaved()).selected,'scout');assert.equal(g.saved(),'77');
  const reloaded=loadGame({stored:g.saved(),journalStored:g.journalSaved()});cleanRun(reloaded);assert.equal(reloaded.state.runSurvivor,'scout');near(reloaded.p.hp,85);near(reloaded.state.record,77);assert.equal(reloaded.state.journal.totals.runs,0);
});
test('survivor choice and run-log navigation cannot replace a live run',()=>{
  const g=loadGame({journalStored:journalData('scout')});cleanRun(g);g.selectSurvivor('bulwark');g.showRoster();g.showJournal();assert.equal(g.state.mode,'play');assert.equal(g.state.selectedSurvivor,'scout');assert.equal(g.state.runSurvivor,'scout');near(g.p.max,85);near(g.p.speed,245);
});
test('medic/runner upgrades use the chosen base and retry resets that same loadout',()=>{
  const g=loadGame({journalStored:journalData('scout')});cleanRun(g);g.opts.find(o=>o.name==='Field Medic').apply();g.opts.find(o=>o.name==='Runner').apply();near(g.p.max,115);near(g.p.hp,115);near(g.p.speed,245*1.18);
  g.pause();quitForTest(g);g.el('again').click();assert.equal(g.state.runSurvivor,'scout');near(g.p.hp,85);near(g.p.max,85);near(g.p.speed,245);assert.equal(g.el('healthText').textContent,'85 / 85 HP');
});
test('slower Bulwark can still dodge a locked charge after a short reaction delay',()=>{
  const g=loadGame({journalStored:journalData('bulwark')});cleanRun(g);g.spawnBoss();const b=g.state.activeBoss;Object.assign(b,{x:200,y:0,phaseTime:0});g.setup({barrels:[]});g.p.fireClock=10;g.moveBoss(b,.001);
  for(let i=0;i<80;i++){g.keys.s=i>=8;g.update(.02)}near(g.p.hp,140);assert.equal(b.phase,'recover');
});
test('run log records extraction build and overtime, then survives a reload',()=>{
  const g=loadGame({journalStored:journalData('scout')});prepareExit(g);Object.assign(g.p,{pierce:2,arc:1,blades:3,proj:4});reachExit(g);chooseExitForTest(g,'stay');g.scheduleRush(Infinity);g.setup({elapsed:g.state.exitAt,nextBossAt:1000});g.updateExtractionWindow();reachExit(g);chooseExitForTest(g,'extract');
  const data=JSON.parse(g.journalSaved());assert.equal(data.totals.runs,1);assert.equal(data.totals.extractions,1);assert.equal(data.totals.breakers,1);assert.equal(data.totals.bestOvertime,1);const row=data.history[0];assert.equal(row.survivor,'scout');assert.equal(row.outcome,'extracted');assert.equal(row.overtime,1);assert.equal(row.pierce,2);assert.equal(row.arc,1);assert.equal(row.blades,3);assert.equal(row.proj,4);assert.ok(row.time>=240);
  const next=loadGame({stored:g.saved(),journalStored:g.journalSaved()});next.showJournal();assert.match(next.el('modal').innerHTML,/EXTRACTED · Scout/);assert.match(next.el('modal').innerHTML,/Pierce 2\/3 · Lightning 1\/3 · Blades 3\/3/);assert.equal(next.state.journal.totals.extractions,1);
});
test('defeat and voluntary end are distinct completed journal outcomes',()=>{
  const dead=loadGame();cleanRun(dead);dead.p.hp=1;dead.p.fireClock=10;dead.setup({elapsed:20,enemies:[enemy({x:0,hp:10000,dmg:99})]});dead.update(.02);assert.equal(dead.state.journal.history[0].outcome,'defeated');assert.equal(dead.state.journal.totals.runs,1);assert.equal(dead.state.journal.totals.extractions,0);
  const quit=loadGame();cleanRun(quit);quit.pause();quitForTest(quit);assert.equal(quit.state.journal.history[0].outcome,'abandoned');assert.equal(quit.state.journal.totals.extractions,0);
});
test('viewing a finished log and old callbacks cannot duplicate the completed run',()=>{
  const g=loadGame();cleanRun(g);g.pause();const quit=g.el('quit');quit.click();confirmEndForTest(g);g.el('endRunLog').click();assert.equal(g.state.mode,'journal');quit.dispatch('pointerdown',{pointerId:2});assert.equal(g.state.journal.totals.runs,1);assert.equal(g.state.journal.history.length,1);assert.equal(g.state.mode,'journal');
  g.el('journalBack').click();assert.equal(g.state.mode,'menu');assert.equal(g.state.journal.totals.runs,1);
});
test('newest eight runs are retained while lifetime totals keep older completions',()=>{
  const g=loadGame();
  for(let i=0;i<12;i++){
    pickSurvivor(g,['survivor','scout','bulwark'][i%3]);g.setup({elapsed:10+i});
    if(i%2===0){g.scheduleRush(Infinity);g.setup({elapsed:180+i,bossesDefeated:1,nextBossAt:1000});g.updateExtractionWindow();reachExit(g);chooseExitForTest(g,'extract')}else{g.pause();quitForTest(g)}
  }
  assert.equal(g.state.journal.totals.runs,12);assert.equal(g.state.journal.totals.extractions,6);assert.equal(g.state.journal.totals.breakers,6);assert.equal(g.state.journal.history.length,8);near(g.state.journal.history[0].time,21);near(g.state.journal.history[7].time,184);assert.equal(g.state.journal.history[0].survivor,'bulwark');
  const next=loadGame({journalStored:g.journalSaved()});assert.equal(next.state.journal.totals.runs,12);assert.equal(next.state.journal.totals.extractions,6);assert.equal(next.state.journal.history.length,8);
});
test('stored data cannot supply arbitrary combat stats or unknown survivor IDs',()=>{
  const g=loadGame({journalStored:journalData('scout',{hp:100000,speed:100000,damage:100000})});cleanRun(g);near(g.p.hp,85);near(g.p.speed,245);near(g.p.damage,18);
  const invalid=loadGame({journalStored:journalData('<img src=x onerror=alert(1)>')});cleanRun(invalid);assert.equal(invalid.state.runSurvivor,'survivor');near(invalid.p.max,100);invalid.pause();quitForTest(invalid);invalid.showJournal();assert.doesNotMatch(invalid.el('modal').innerHTML,/<img/);
});
test('malformed journal JSON recovers without altering an existing best time',()=>{
  for(const raw of ['{bad','null','[]','42','{"version":0}']){
    const g=loadGame({stored:'88',journalStored:raw});assert.equal(g.state.journal.history.length,0);cleanRun(g);g.pause();quitForTest(g);assert.equal(g.state.journal.history.length,1);assert.equal(g.saved(),'88');assert.equal(JSON.parse(g.journalSaved()).version,1);
  }
});
test('journal rows and totals are sanitized before being rendered',()=>{
  const raw=journalData('__proto__',{totals:{runs:-9,extractions:999,breakers:-2,blackouts:-5,bestOvertime:-1},history:[{survivor:'<script>bad()</script>',outcome:'extracted',time:62,kills:-4,level:-1,breakers:3,blackouts:2,overtime:1,pierce:99,arc:-2,blades:1.5,proj:999,build:'<img src=x>'},{survivor:'scout',outcome:'<script>',time:5},{survivor:'scout',outcome:'defeated',time:null}]});
  const g=loadGame({journalStored:raw});assert.equal(g.state.journal.history.length,1);const row=g.state.journal.history[0];assert.equal(row.survivor,'survivor');assert.equal(row.pierce,3);assert.equal(row.arc,0);assert.equal(row.blades,1);assert.equal(row.proj,5);assert.equal(row.kills,0);assert.equal(row.level,1);assert.equal(g.state.journal.totals.runs,1);assert.equal(g.state.journal.totals.extractions,1);assert.equal(g.state.journal.totals.breakers,3);assert.equal(g.state.journal.totals.blackouts,2);assert.equal(g.state.journal.totals.bestOvertime,1);
  g.showJournal();assert.doesNotMatch(g.el('modal').innerHTML,/<script>|<img/);assert.match(g.el('modal').innerHTML,/EXTRACTED · Survivor/);
});
test('future journal versions are preserved while this build keeps a temporary log',()=>{
  const future=JSON.stringify({version:2,selected:'scout',futureField:'keep me'});const g=loadGame({stored:'90',journalStored:future});assert.equal(g.state.journal.readOnly,true);g.showRoster();g.selectSurvivor('bulwark');g.el('deploy').click();g.pause();quitForTest(g);assert.equal(g.journalSaved(),future);assert.equal(g.saved(),'90');assert.equal(g.state.journal.history.length,1);assert.match(g.el('modal').innerHTML,/newer run log/);
});
test('blocked storage still allows character selection and a complete session run log',()=>{
  const g=loadGame({storageBlocked:true});pickSurvivor(g,'scout');near(g.p.hp,85);g.pause();quitForTest(g);assert.equal(g.state.journal.history.length,1);assert.equal(g.state.journal.history[0].survivor,'scout');g.showJournal();assert.match(g.el('modal').innerHTML,/lasts for this visit/);
});
test('write failures retain loaded preferences, old data, and new session history',()=>{
  const original=journalData('scout');const g=loadGame({stored:'100',journalStored:original,writeBlocked:true});cleanRun(g);near(g.p.hp,85);g.pause();quitForTest(g);assert.equal(g.journalSaved(),original);assert.equal(g.saved(),'100');assert.equal(g.state.journal.history.length,1);assert.equal(g.state.journal.available,false);
  g.showRoster();g.selectSurvivor('bulwark');g.el('deploy').click();near(g.p.hp,140);g.pause();quitForTest(g);assert.equal(g.state.journal.history.length,2);assert.equal(g.journalSaved(),original);
});
test('change-survivor result action starts a fresh profile without logging menu activity',()=>{
  const g=loadGame();cleanRun(g);g.pause();quitForTest(g);g.el('changeSurvivor').click();assert.equal(g.state.mode,'roster');g.selectSurvivor('bulwark');assert.equal(g.state.journal.totals.runs,1);g.el('deploy').click();near(g.p.hp,140);near(g.p.speed,185);assert.equal(g.state.journal.totals.runs,1);assert.equal(g.state.runLogged,false);
});
test('loadout identity appears in paused, extraction, and result summaries',()=>{
  const g=loadGame({journalStored:journalData('scout')});prepareExit(g);g.pause();assert.match(g.el('modal').innerHTML,/Scout · Downtown · Standard/);g.resume();reachExit(g);assert.match(g.el('modal').innerHTML,/Scout · Gun ×1/);chooseExitForTest(g,'extract');assert.match(g.el('modal').innerHTML,/Survivor: Scout/);
});


test('finishing touch release and compatibility click cannot leave the run results',()=>{
  const g=loadGame();prepareExit(g);reachExit(g);
  const extract=g.el('extract');g.advanceClock(500);extract.dispatch('pointerdown',{pointerId:7,isPrimary:false});extract.dispatch('pointerup',{pointerId:7,isPrimary:false});
  const sheet=g.el('modal').innerHTML,again=g.el('again');
  // The old screen is replaced under a held finger. Release/click may retarget.
  again.dispatch('pointerup',{pointerId:7});again.click(1);extract.click(1);
  assert.equal(g.state.mode,'end');assert.equal(g.el('modal').innerHTML,sheet);
  assert.match(sheet,/THIS RUN’S STATS/);assert.equal(g.state.journal.totals.runs,1);
});
test('manual finish and lethal combat also hold the stat sheet through delayed clicks',()=>{
  for(const outcome of ['abandoned','defeated']){
    const g=loadGame();cleanRun(g);
    if(outcome==='abandoned'){g.pause();g.el('quit').dispatch('pointerdown',{pointerId:2});confirmEndForTest(g)}
    else{g.p.hp=1;g.p.fireClock=10;g.setup({enemies:[enemy({x:0,hp:10000,dmg:99})]});g.update(.02)}
    for(const id of ['again','changeSurvivor','endRunLog','resultMenu']){g.el(id).dispatch('pointerup',{pointerId:2});g.el(id).click(1)}
    assert.equal(g.state.mode,'end');assert.equal(g.state.runOutcome,outcome);assert.equal(g.state.journal.history.length,1);
  }
});
test('result actions require a fresh matching pointer down and up, including second fingers',()=>{
  const g=loadGame();cleanRun(g);g.pause();quitForTest(g);const again=g.el('again');
  again.dispatch('pointerdown',{pointerId:3,isPrimary:false});assert.equal(g.state.mode,'end');
  again.dispatch('pointerup',{pointerId:4});assert.equal(g.state.mode,'end');
  again.dispatch('pointerup',{pointerId:3});assert.equal(g.state.mode,'play');near(g.state.elapsed,0);assert.equal(g.state.runResult,null);
  g.update(.02);again.click(0);again.dispatch('pointerdown',{pointerId:8});again.dispatch('pointerup',{pointerId:8});near(g.state.elapsed,.02);
});
test('cancelled or dragged-off result presses leave the summary open',()=>{
  for(const cancel of ['pointercancel','pointerleave','lostpointercapture']){
    const g=loadGame();cleanRun(g);g.pause();quitForTest(g);const button=g.el('again');
    button.dispatch('pointerdown',{pointerId:4});button.dispatch(cancel,{pointerId:4});button.dispatch('pointerup',{pointerId:4});button.click(1);assert.equal(g.state.mode,'end');
  }
});
test('all result destinations support deliberate pointer activation and keyboard clicks',()=>{
  for(const [id,mode] of [['again','play'],['changeSurvivor','roster'],['endRunLog','journal'],['resultMenu','menu']]){
    for(const pointer of [false,true]){
      const g=loadGame();cleanRun(g);g.pause();quitForTest(g);const button=g.el(id);
      if(pointer){button.dispatch('pointerdown',{pointerId:11});button.dispatch('pointerup',{pointerId:11})}else button.click(0);
      assert.equal(g.state.mode,mode);assert.equal(g.state.journal.totals.runs,1);
    }
  }
});
test('finished run snapshots exact current stats and freezes combat, input, and scene frames',()=>{
  const g=loadGame({journalStored:journalData('scout')});prepareExit(g);
  g.setup({elapsed:193.5,killCount:73,level:9,bossesDefeated:2,rushesSurvived:2,barrelsBlown:6,blastKills:15});
  Object.assign(g.p,{hp:47,max:115,damage:36,fire:.2,speed:280,regen:1,pierce:2,arc:3,blades:1,proj:4});reachExit(g);chooseExitForTest(g,'extract');
  const r=g.state.runResult,sheet=g.el('modal').innerHTML,calls=g.drawCount();
  assert.ok(Object.isFrozen(r));near(r.time,193.5);assert.equal(r.kills,73);assert.equal(r.level,9);assert.equal(r.hp,47);assert.equal(r.max,115);assert.equal(r.survivor,'scout');assert.equal(r.breakers,2);assert.equal(r.blackouts,2);assert.equal(r.barrels,6);assert.equal(r.blastKills,15);assert.equal(r.arc,3);
  assert.match(sheet,/<strong>03:13<\/strong><small>SURVIVED/);assert.match(sheet,/<strong>47 \/ 115<\/strong><small>HP REMAINING/);assert.match(sheet,/36 weapon damage · 5.0 gun volleys\/sec/);assert.match(sheet,/Gun ×4 · Pierce 2\/3 · Lightning 3\/3 · Blades 1\/3/);
  g.event('keydown',{key:'p'});g.event('keydown',{key:'d'});g.el('dash').dispatch('pointerdown',{pointerId:5});g.resume();g.update(999);g.frame(1000);g.frame(2000);g.document.hidden=true;g.event('visibilitychange');
  assert.equal(g.state.mode,'end');near(g.state.elapsed,193.5);near(g.p.hp,47);assert.equal(g.drawCount(),calls);assert.equal(g.el('modal').innerHTML,sheet);assert.equal(g.state.journal.totals.runs,1);
});
test('opening results scrolls back to the top and a resize redraws without resuming',()=>{
  const g=loadGame();prepareExit(g);reachExit(g);g.el('panel').scrollTop=800;chooseExitForTest(g,'extract');assert.equal(g.el('panel').scrollTop,0);
  const before=g.drawCount(),time=g.state.elapsed;g.event('resize');assert.ok(g.drawCount()>before);near(g.state.elapsed,time);assert.equal(g.state.mode,'end');
});
test('old result buttons and old finish callbacks cannot affect a subsequent live run',()=>{
  const g=loadGame();cleanRun(g);g.pause();const quit=g.el('quit');quit.click();confirmEndForTest(g);const again=g.el('again'),log=g.el('endRunLog');again.click();g.update(.02);
  quit.click();confirmEndForTest(g);quit.dispatch('pointerdown',{pointerId:9});log.click();log.dispatch('pointerdown',{pointerId:10});log.dispatch('pointerup',{pointerId:10});again.click();
  assert.equal(g.state.mode,'play');near(g.state.elapsed,.02);assert.equal(g.state.journal.totals.runs,1);
});
test('run medals use exact thresholds and require extraction for extraction medals',()=>{
  const base={outcome:'defeated',breakers:1,barrels:4,overtime:0};assert.equal(loadGame().earnedMedals(base).length,0);
  const g=loadGame();assert.deepEqual(Array.from(g.earnedMedals({...base,breakers:2,barrels:5}),m=>m.name),['Boss Hunter','Demolition']);
  assert.deepEqual(Array.from(g.earnedMedals({...base,outcome:'extracted',overtime:1}),m=>m.name),['Made It Out','After Hours']);
  assert.equal(g.earnedMedals({...base,outcome:'abandoned',overtime:2}).length,0);
});
test('medals and barrel stats are retained in local history and rendered after reload',()=>{
  const g=loadGame();prepareExit(g);reachExit(g);chooseExitForTest(g,'stay');g.scheduleRush(Infinity);g.setup({elapsed:g.state.exitAt,bossesDefeated:2,nextBossAt:1000,barrelsBlown:5,blastKills:12});g.updateExtractionWindow();reachExit(g);chooseExitForTest(g,'extract');
  assert.equal(g.earnedMedals(g.state.runResult).length,4);assert.match(g.el('modal').innerHTML,/MEDALS THIS RUN · 4\/8/);
  const next=loadGame({journalStored:g.journalSaved()});next.showJournal();assert.match(next.el('modal').innerHTML,/Made It Out · Boss Hunter · Demolition · After Hours/);assert.match(next.el('modal').innerHTML,/5 barrels · 12 blast eliminations/);
});
test('old journals load without fabricating missing barrel stats or demolition medals',()=>{
  const row={survivor:'scout',outcome:'extracted',time:183,kills:20,level:7,breakers:1,blackouts:1,overtime:0,proj:1};
  const g=loadGame({journalStored:journalData('scout',{history:[row]})});assert.equal(g.state.journal.history[0].barrels,null);g.showJournal();assert.match(g.el('modal').innerHTML,/Barrel stats unavailable/);const runRow=g.el('modal').innerHTML.match(/<article class="run-row">[\s\S]*?<\/article>/)[0];assert.doesNotMatch(runRow,/Demolition/);
});
test('saved medal/barrel data is validated and medal names come from the game',()=>{
  const row={outcome:'defeated',time:1,barrels:-8,blastKills:'<img>',medals:['<script>bad()</script>']};
  const g=loadGame({journalStored:journalData('survivor',{history:[row]})});assert.equal(g.state.journal.history[0].barrels,0);assert.equal(g.state.journal.history[0].blastKills,null);g.showJournal();assert.doesNotMatch(g.el('modal').innerHTML,/<script>|<img/);
});
test('medal goals are available before a run and show current progress while paused',()=>{
  const g=loadGame();g.showRoster();assert.match(g.el('modal').innerHTML,/RUN MEDALS · OPTIONAL GOALS/);assert.match(g.el('modal').innerHTML,/Medals give no stat bonuses/);g.el('deploy').click();g.setup({bossesDefeated:2,barrelsBlown:3});g.pause();assert.match(g.el('modal').innerHTML,/RUN MEDALS · 1\/8 EARNED/);assert.match(g.el('modal').innerHTML,/Progress: 2\/2 Bosses · 3\/5 barrels/);
});
test('retry resets medal progress and each completed run keeps its own snapshot',()=>{
  const g=loadGame();prepareExit(g);g.setup({barrelsBlown:5,blastKills:10});reachExit(g);chooseExitForTest(g,'extract');const first=g.state.runResult;assert.equal(g.earnedMedals(first).length,2);
  g.el('again').click();assert.equal(g.state.runResult,null);assert.equal(g.earnedMedals(g.currentRunStats()).length,0);g.pause();quitForTest(g);assert.notEqual(g.state.runResult,first);assert.equal(g.state.runResult.barrels,0);assert.equal(g.state.journal.history[0].barrels,0);assert.equal(g.state.journal.history[1].barrels,5);assert.equal(first.barrels,5);
});


function prepareSupply(g){
  cleanRun(g);g.setup({elapsed:19.99,barrels:[],obstacles:[],nextBossAt:1000});g.update(.02);assert.ok(g.state.supplyCache);
}
function moveToSupply(g){const b=g.state.supplyCache,from={x:g.p.x,y:g.p.y};g.p.x=b.x;g.p.y=b.y;g.updateSupplies(from)}
test('medical supplies first appear after twenty gameplay seconds and never stack',()=>{
  const g=loadGame();cleanRun(g);assert.equal(g.state.supplyCache,null);near(g.state.nextSupplyAt,20);
  g.setup({elapsed:19.9,barrels:[],obstacles:[]});g.update(.02);assert.equal(g.state.supplyCache,null);
  g.setup({elapsed:20});g.update(.02);const b=g.state.supplyCache;assert.ok(b);assert.ok(Math.hypot(b.x-g.p.x,b.y-g.p.y)>140);near(b.until,g.state.elapsed+45);near(g.state.nextSupplyAt,g.state.elapsed+60);
  g.update(.02);assert.equal(g.state.supplyCache,b);assert.equal(g.state.suppliesCollected,0);g.render();
});
test('supply placement finds open ground away from barrels and exits without moving scenery',()=>{
  const g=loadGame();cleanRun(g);const scenery=[{x:-50,y:100,w:100,h:100}],barrels=[{x:150,y:0,r:17,spent:false}];g.setup({obstacles:scenery,barrels});
  g.setup({elapsed:180,bossesDefeated:1,nextBossAt:1000});g.scheduleRush(Infinity);g.updateExtractionWindow();const exit=g.state.exitBeacon;assert.ok(g.placeSupply());const b=g.state.supplyCache;
  assert.ok(!(b.x>-98&&b.x<98&&b.y>52&&b.y<248));assert.ok(Math.hypot(b.x-150,b.y)>=80);assert.ok(Math.hypot(b.x-exit.x,b.y-exit.y)>=exit.r+70);assert.equal(g.state.obstacles.length,1);assert.equal(g.state.barrels,barrels);
});
test('blocked supply placement retries later rather than looping or deleting scenery',()=>{
  const g=loadGame();cleanRun(g);g.setup({elapsed:20,obstacles:[{x:-1000,y:-1000,w:2000,h:2000}],barrels:[]});g.update(.02);assert.equal(g.state.supplyCache,null);near(g.state.nextSupplyAt,25.02);assert.equal(g.state.obstacles.length,1);
  g.setup({obstacles:[],elapsed:25});g.update(.03);assert.ok(g.state.supplyCache);
});
test('each survivor receives up to twenty HP and a cache is counted once',()=>{
  for(const role of ['survivor','scout','bulwark','engineer','scavenger']){
    const g=loadGame({journalStored:journalData(role)});prepareSupply(g);g.p.hp=g.p.max-40;moveToSupply(g);near(g.p.hp,g.p.max-20);assert.equal(g.state.suppliesCollected,1);near(g.state.supplyHealing,20);assert.equal(g.state.supplyCache,null);
    g.updateSupplies({x:g.p.x,y:g.p.y});assert.equal(g.state.suppliesCollected,1);near(g.state.supplyHealing,20);
  }
});
test('full health leaves the cache available and a small wound heals only the missing HP',()=>{
  const g=loadGame();prepareSupply(g);const b=g.state.supplyCache;moveToSupply(g);assert.equal(g.state.supplyCache,b);assert.equal(g.state.suppliesCollected,0);
  g.updateEncounterHUD();assert.match(g.el('supplyGoal').textContent,/FULL HP/);
  g.p.hp=99.5;g.updateSupplies({x:g.p.x,y:g.p.y});near(g.p.hp,100);near(g.state.supplyHealing,.5);assert.equal(g.state.suppliesCollected,1);
});
test('dashing through a supply collects it even if the final position is past it',()=>{
  const g=loadGame();prepareSupply(g);const b=g.state.supplyCache;g.p.hp=50;g.p.x=b.x-100;g.p.y=b.y;g.p.speed=30000;g.keys.d=true;g.dash();g.update(.02);
  assert.ok(g.p.x>b.x+b.r);near(g.p.hp,70);assert.equal(g.state.supplyCache,null);assert.equal(g.state.suppliesCollected,1);
});
test('supplies expire after forty-five seconds and a later cache follows the original schedule',()=>{
  const g=loadGame();prepareSupply(g);const first=g.state.supplyCache,next=g.state.nextSupplyAt;
  g.setup({elapsed:first.until-.01});g.updateSupplies({x:g.p.x,y:g.p.y});assert.equal(g.state.supplyCache,first);
  g.setup({elapsed:first.until});g.updateSupplies({x:g.p.x,y:g.p.y});assert.equal(g.state.supplyCache,null);near(g.state.nextSupplyAt,next);
  g.setup({elapsed:next});g.updateSupplies({x:g.p.x,y:g.p.y});assert.ok(g.state.supplyCache);assert.notEqual(g.state.supplyCache,first);near(g.state.nextSupplyAt,next+60);
});
test('leaving a cache far behind removes it without spawning an immediate replacement',()=>{
  const g=loadGame();prepareSupply(g);const next=g.state.nextSupplyAt;g.p.x=2000;g.updateSupplies({x:g.p.x,y:g.p.y});assert.equal(g.state.supplyCache,null);near(g.state.nextSupplyAt,next);assert.equal(g.state.suppliesCollected,0);
});
test('pause, upgrades, extraction choice, and finished results freeze supply time and pickups',()=>{
  for(const target of ['paused','upgrade','extraction','end']){
    const g=loadGame();prepareSupply(g);g.p.hp=70;
    if(target==='paused')g.pause();
    if(target==='upgrade'){g.setup({xp:8});g.checkLevelUp()}
    if(target==='extraction'){g.setup({elapsed:180,bossesDefeated:1,nextBossAt:1000});g.scheduleRush(Infinity);g.updateExtractionWindow();reachExit(g)}
    if(target==='end'){g.pause();quitForTest(g)}
    const b=g.state.supplyCache,t=g.state.elapsed,next=g.state.nextSupplyAt;g.update(100);g.p.x=b.x;g.p.y=b.y;g.updateSupplies({x:b.x,y:b.y});assert.equal(g.state.supplyCache,b);near(g.state.elapsed,t);near(g.state.nextSupplyAt,next);near(g.p.hp,70);assert.equal(g.state.suppliesCollected,0);
  }
});
test('a medical cache cannot rescue a lethal combat frame',()=>{
  const g=loadGame();prepareSupply(g);const b=g.state.supplyCache;g.p.x=b.x;g.p.y=b.y;g.p.hp=1;g.p.fireClock=10;g.setup({enemies:[enemy({x:b.x,y:b.y,hp:10000,dmg:99})]});g.update(.02);
  assert.equal(g.state.mode,'end');assert.equal(g.state.runOutcome,'defeated');near(g.p.hp,0);assert.equal(g.state.suppliesCollected,0);assert.equal(g.state.runResult.supplies,0);
});
test('nonlethal combat damage resolves before a supply heals the surviving player',()=>{
  const g=loadGame();prepareSupply(g);const b=g.state.supplyCache;g.p.x=b.x;g.p.y=b.y;g.p.hp=50;g.p.fireClock=10;g.setup({enemies:[enemy({x:b.x,y:b.y,hp:10000,dmg:12})]});g.update(.02);near(g.p.hp,58);near(g.state.supplyHealing,20);assert.equal(g.state.suppliesCollected,1);
});
test('supply collection resolves before a same-frame earned upgrade',()=>{
  const g=loadGame();prepareSupply(g);const b=g.state.supplyCache;g.p.x=b.x;g.p.y=b.y;g.p.hp=50;g.setup({xp:8});g.update(.02);assert.equal(g.state.mode,'upgrade');near(g.p.hp,70);assert.equal(g.state.suppliesCollected,1);g.choose(0);assert.equal(g.state.mode,'play');
});
test('barrel explosions do not consume medical caches or award supply healing remotely',()=>{
  const g=loadGame();prepareSupply(g);const b=g.state.supplyCache,barrel={x:b.x,y:b.y,r:17,spent:false};g.setup({barrels:[barrel]});g.p.hp=50;g.detonateBarrel(barrel);assert.equal(g.state.supplyCache,b);near(g.p.hp,50);assert.equal(g.state.suppliesCollected,0);
});
test('supply HUD preserves encounter warnings and clears after collection',()=>{
  const g=loadGame();prepareSupply(g);g.spawnBoss();const boss=g.state.activeBoss;boss.phase='warn';g.updateEncounterHUD();assert.match(g.el('objective').textContent,/DODGE THE LINE/);assert.match(g.el('supplyGoal').textContent,/MED .*45s.*FULL HP/);assert.equal(g.el('bossMeter').hidden,false);
  g.p.hp=50;moveToSupply(g);g.updateEncounterHUD();assert.equal(g.el('supplyGoal').textContent,'');assert.match(g.el('objective').textContent,/DODGE THE LINE/);
});
test('cache stats appear on the frozen results and survive a local journal reload',()=>{
  const g=loadGame();prepareSupply(g);g.p.hp=90;moveToSupply(g);g.pause();quitForTest(g);assert.equal(g.state.runResult.supplies,1);near(g.state.runResult.supplyHealing,10);assert.match(g.el('modal').innerHTML,/<strong>1<\/strong><small>MEDICAL CACHES/);assert.match(g.el('modal').innerHTML,/<strong>10<\/strong><small>CACHE HP RESTORED/);
  const next=loadGame({journalStored:g.journalSaved()});next.showJournal();assert.match(next.el('modal').innerHTML,/1 medical caches · 10 HP restored/);assert.equal(next.state.journal.history[0].supplies,1);
});
test('older runs retain unknown supply counters and saved supply fields are sanitized',()=>{
  const g=loadGame({journalStored:journalData('survivor',{history:[{outcome:'extracted',time:181},{outcome:'defeated',time:20,supplies:-3,supplyHealing:'<img>'}]})});
  assert.equal(g.state.journal.history[0].supplies,null);assert.equal(g.state.journal.history[0].supplyHealing,null);assert.equal(g.state.journal.history[1].supplies,0);assert.equal(g.state.journal.history[1].supplyHealing,null);g.showJournal();assert.doesNotMatch(g.el('modal').innerHTML,/<img/);
});
test('overtime retains medical state while retry clears it and resets the first opportunity',()=>{
  const g=loadGame();prepareExit(g);g.setup({barrels:[],obstacles:[],nextSupplyAt:240});g.placeSupply();const b=g.state.supplyCache;reachExit(g);chooseExitForTest(g,'stay');assert.equal(g.state.supplyCache,b);near(g.state.nextSupplyAt,240);
  g.pause();quitForTest(g);g.el('again').click();assert.equal(g.state.supplyCache,null);near(g.state.nextSupplyAt,20);assert.equal(g.state.suppliesCollected,0);near(g.state.supplyHealing,0);assert.equal(g.el('supplyGoal').textContent,'');
});


test('staying clears every nearby living enemy once and preserves enemies outside the pulse',()=>{
  const g=loadGame();prepareExit(g);reachExit(g);const {x,y}=g.p,r=g.exitReturnTuning.radius;
  const nearEnemy=enemy({x:x+30,y,hp:9000}),edge=enemy({x:x+r+15,y,hp:5000}),outside=enemy({x:x+r+15.01,y,hp:1000}),dead=enemy({x,y,hp:0});
  g.setup({enemies:[nearEnemy,edge,outside,dead]});const stay=g.el('stay');g.advanceClock(500);stay.dispatch('pointerdown',{pointerId:2,isPrimary:false});stay.dispatch('pointerup',{pointerId:2,isPrimary:false});
  assert.equal(nearEnemy.hp,0);assert.equal(edge.hp,0);assert.equal(outside.hp,1000);assert.equal(g.state.enemies.length,1);assert.equal(g.state.enemies[0],outside);assert.equal(g.state.killCount,2);assert.equal(g.state.gems.length,2);assert.equal(g.state.blastKills,0);assert.equal(g.state.barrelsBlown,0);
  assert.equal(g.state.overtime,1);stay.click(1);stay.dispatch('pointerdown',{pointerId:3});assert.equal(g.state.killCount,2);assert.equal(g.state.gems.length,2);assert.equal(g.state.overtime,1);
});
test('returning grants a brief shield and spawn break, then normal danger resumes',()=>{
  const g=loadGame();prepareExit(g);reachExit(g);g.p.hp=1;const {x,y}=g.p;
  const charger=enemy({x:x+200,y,hp:100000,speed:2000,dmg:99});g.setup({enemies:[charger],spawn:0});chooseExitForTest(g,'stay');near(g.p.inv,1.5);near(g.state.reliefUntil,g.state.elapsed+2);
  g.p.fireClock=100;g.update(.035);assert.equal(g.state.mode,'play');near(g.p.hp,1);assert.equal(g.state.enemies.length,1);
  for(let i=0;i<50&&g.state.mode==='play';i++)g.update(.035);
  assert.equal(g.state.mode,'end');assert.equal(g.state.runOutcome,'defeated');
});
test('the exit spawn break expires after two gameplay seconds and freezes under pause',()=>{
  const g=loadGame();prepareExit(g);reachExit(g);g.setup({spawn:0});chooseExitForTest(g,'stay');const until=g.state.reliefUntil;
  g.update(.5);assert.equal(g.state.enemies.length,0);g.pause();g.update(100);near(g.state.reliefUntil,until);g.resume();g.setup({elapsed:until-.01,spawn:0});g.update(.02);assert.equal(g.state.enemies.length,1);
});
test('the clearing pulse centers on the survivor and includes a nearby Breaker',()=>{
  const g=loadGame();prepareExit(g);g.spawnBoss('breaker');const boss=g.state.activeBoss;reachExit(g);boss.x=g.p.x;boss.y=g.p.y;g.p.hp=50;
  const barrel={x:g.p.x,y:g.p.y,r:17,spent:false};g.setup({barrels:[barrel]});g.placeSupply();const cache=g.state.supplyCache;chooseExitForTest(g,'stay');
  assert.equal(g.state.activeBoss,null);assert.equal(g.state.bossesDefeated,2);assert.equal(g.state.killCount,1);assert.equal(g.state.gems[0].value,20);near(g.p.hp,75);near(g.state.reliefUntil,g.state.elapsed+8);assert.equal(g.state.reliefUntil>g.state.elapsed+2,true);
  assert.equal(barrel.spent,false);assert.equal(g.state.supplyCache,cache);assert.equal(g.state.barrelsBlown,0);assert.equal(g.state.blastKills,0);assert.equal(g.state.blastRings.length,1);near(g.state.blastRings[0].x,g.p.x);near(g.state.blastRings[0].y,g.p.y);g.render();
});
test('entering the door or extracting does not award clearing kills or restart combat',()=>{
  const g=loadGame();prepareExit(g);const b=g.state.exitBeacon,target=enemy({x:b.x,y:b.y,hp:5000});g.setup({enemies:[target]});reachExit(g);assert.equal(target.hp,5000);assert.equal(g.state.killCount,0);chooseExitForTest(g,'extract');assert.equal(target.hp,5000);assert.equal(g.state.killCount,0);assert.equal(g.state.mode,'end');assert.equal(g.state.runOutcome,'extracted');
});
test('return protection and the clearing effect freeze through queued upgrades and reset on retry',()=>{
  const g=loadGame();prepareExit(g);reachExit(g);g.setup({xp:8});chooseExitForTest(g,'stay');assert.equal(g.state.mode,'upgrade');const ring=g.state.blastRings[0];g.update(100);near(g.p.inv,1.5);near(ring.life,.55);g.choose(0);assert.equal(g.state.mode,'play');g.update(.02);near(g.p.inv,1.48);assert.ok(ring.life<.55);
  g.pause();quitForTest(g);g.el('again').click();near(g.p.inv,0);near(g.state.reliefUntil,0);assert.equal(g.state.blastRings.length,0);
});
test('twenty-HP cache messaging matches capped healing and partial heal accounting',()=>{
  const g=loadGame();g.showQuickGuide();assert.match(g.el('modal').innerHTML,/up to 20 HP/);g.closeQuickGuide();prepareSupply(g);g.p.hp=75;moveToSupply(g);near(g.p.hp,95);near(g.state.supplyHealing,20);assert.match(g.el('toast').textContent,/\+20 HP/);
  const partial=loadGame();prepareSupply(partial);partial.p.hp=93;moveToSupply(partial);near(partial.p.hp,100);near(partial.state.supplyHealing,7);
});

function spitter(overrides={}){return enemy({x:140,y:0,hp:10000,max:10000,speed:82,r:17,dmg:10,col:'#ec79a8',type:4,spitter:true,phase:'approach',cooldown:0,phaseTime:0,aimX:0,aimY:1,...overrides})}
function hostileShot(overrides={}){return{x:-100,y:0,vx:500,vy:0,r:7,life:2.5,dmg:10,...overrides}}
test('Spitters begin at sixty-five seconds, have a living cap, and reserve the boss slot',()=>{
  const g=loadGame();cleanRun(g);g.scheduleRush(Infinity);g.setup({elapsed:64.99,nextBossAt:1000,nextSpitterAt:65});g.updateSpitterSchedule();assert.equal(g.state.enemies.length,0);
  g.setup({elapsed:65});g.updateSpitterSchedule();assert.equal(g.state.enemies.length,1);assert.equal(g.state.enemies[0].spitter,true);near(g.state.nextSpitterAt,95);assert.match(g.el('toast').textContent,/PINK AIM LINE/);
  g.setup({elapsed:95});g.updateSpitterSchedule();assert.equal(g.state.enemies.length,2);g.setup({elapsed:125});g.updateSpitterSchedule();assert.equal(g.state.enemies.length,2);
  g.setup({elapsed:140,nextSpitterAt:140,enemies:Array.from({length:239},()=>enemy({x:1000}))});g.updateSpitterSchedule();assert.equal(g.state.enemies.length,239);g.spawnBoss();assert.equal(g.state.enemies.length,240);
});
test('new Spitters wait out boss encounters, warnings, Rushes, and spawn relief',()=>{
  for(const encounter of ['boss','bossWarning','rush','relief']){
    const g=loadGame();cleanRun(g);g.scheduleRush(Infinity);g.setup({elapsed:65,nextBossAt:1000,nextSpitterAt:65});
    if(encounter==='boss')g.spawnBoss();if(encounter==='bossWarning')g.setup({nextBossAt:70});if(encounter==='rush'){g.scheduleRush(65);g.updateRush(.01)}
    if(encounter==='relief'){g.pause();quitForTest(g);prepareExit(g);reachExit(g);chooseExitForTest(g,'stay');g.setup({nextSpitterAt:g.state.elapsed})}
    const before=g.state.enemies.filter(e=>e.spitter).length;g.updateSpitterSchedule();assert.equal(g.state.enemies.filter(e=>e.spitter).length,before);
  }
});
test('Spitters stand still for a full warning and fire along the locked aim, without tracking',()=>{
  const g=loadGame();cleanRun(g);const e=spitter();g.setup({enemies:[e]});g.moveSpitter(e,.01);assert.equal(e.phase,'aim');near(e.phaseTime,1);near(e.aimX,-1);near(e.aimY,0);
  g.p.y=60;g.moveSpitter(e,.5);near(e.phaseTime,.5);near(e.x,140);near(e.y,0);assert.equal(g.state.hostileShots.length,0);g.moveSpitter(e,.49);assert.equal(g.state.hostileShots.length,0);g.moveSpitter(e,.02);
  assert.equal(g.state.hostileShots.length,1);near(g.state.hostileShots[0].vx,-210);near(g.state.hostileShots[0].vy,0);near(e.cooldown,2.8);assert.equal(e.phase,'approach');g.render();
});
test('offscreen Spitters approach rather than firing, and cancel an unseen windup',()=>{
  const g=loadGame();cleanRun(g);const e=spitter({x:300});g.setup({enemies:[e]});g.moveSpitter(e,.1);assert.equal(e.phase,'approach');assert.ok(e.x<300);assert.equal(g.state.hostileShots.length,0);
  Object.assign(e,{x:300,phase:'aim',phaseTime:.01});g.moveSpitter(e,.02);assert.equal(e.phase,'approach');assert.equal(g.state.hostileShots.length,0);near(e.cooldown,2.8);
});
test('Bulwark can sidestep a locked Spitter shot after a short reaction delay without dashing',()=>{
  const g=loadGame({journalStored:journalData('bulwark')});cleanRun(g);g.p.fireClock=100;const e=spitter();g.setup({enemies:[e]});g.moveSpitter(e,.001);
  for(let i=0;i<90;i++){g.keys.s=i>=10;g.update(.02)}near(g.p.hp,140);assert.ok(g.p.y>200);assert.ok(g.state.hostileShots.length>0);
});
test('hostile shots use swept collision for both shot and survivor movement',()=>{
  const g=loadGame();cleanRun(g);g.setup({hostileShots:[hostileShot()]});g.updateHostileShots(.4,{x:0,y:0});near(g.p.hp,90);assert.equal(g.state.hostileShots.length,0);
  const moving=loadGame();cleanRun(moving);moving.p.x=100;moving.setup({hostileShots:[hostileShot({x:0,vx:0})]});moving.updateHostileShots(.035,{x:-100,y:0});near(moving.p.hp,90);assert.equal(moving.state.hostileShots.length,0);
});
test('expired hostile shots cannot hit a survivor who arrives after their lifetime',()=>{
  const g=loadGame();cleanRun(g);g.p.x=-200;g.setup({hostileShots:[hostileShot({x:-50,vx:0,life:.1})]});g.updateHostileShots(1,{x:0,y:0});near(g.p.hp,100);assert.equal(g.state.hostileShots.length,0);
});
test('shot contacts share damage grace with melee, and protection absorbs shots without leaving them stacked',()=>{
  const g=loadGame();cleanRun(g);g.setup({hostileShots:[hostileShot(),hostileShot()]});g.updateHostileShots(.4,{x:0,y:0});near(g.p.hp,90);assert.equal(g.state.hostileShots.length,0);
  const dash=loadGame();cleanRun(dash);dash.dash();dash.setup({hostileShots:[hostileShot()]});dash.updateHostileShots(.4,{x:0,y:0});near(dash.p.hp,100);assert.equal(dash.state.hostileShots.length,0);
});
test('lethal ranged damage resolves before medical caches or green-door arrival',()=>{
  const g=loadGame();prepareExit(g);const b=g.state.exitBeacon;g.p.x=b.x;g.p.y=b.y;g.p.hp=1;g.setup({supplyCache:{x:b.x,y:b.y,r:19,until:999},hostileShots:[hostileShot({x:b.x-30,y:b.y,vx:1000})]});g.update(.035);
  assert.equal(g.state.mode,'end');assert.equal(g.state.runOutcome,'defeated');near(g.p.hp,0);assert.equal(g.state.suppliesCollected,0);assert.equal(g.el('extract'),undefined);
});
test('hostile shot capacity and lifetime stay bounded',()=>{
  const g=loadGame();cleanRun(g);const e=spitter({phase:'aim',phaseTime:.01,aimX:0,aimY:1});g.setup({enemies:[e],hostileShots:Array.from({length:g.limits.hostileShots},()=>hostileShot({x:500,y:500,vx:0,vy:0}))});g.moveSpitter(e,.02);assert.equal(g.state.hostileShots.length,12);g.updateHostileShots(3,{x:0,y:0});assert.equal(g.state.hostileShots.length,0);
});
test('pause, upgrades, extraction choices, and results freeze Spitter aim and shot motion',()=>{
  for(const target of ['paused','upgrade','extraction','end']){
    const g=loadGame();if(target==='extraction')prepareExit(g);else cleanRun(g);
    const e=spitter({phase:'aim',phaseTime:.6}),shot=hostileShot({x:300,y:100});g.setup({enemies:[e],hostileShots:[shot]});
    if(target==='paused')g.pause();if(target==='upgrade'){g.setup({xp:8});g.checkLevelUp()}if(target==='extraction')reachExit(g);if(target==='end'){g.pause();quitForTest(g)}
    const x=shot.x,life=shot.life,elapsed=g.state.elapsed;g.update(100);g.updateHostileShots(100,{x:g.p.x,y:g.p.y});near(e.phaseTime,.6);near(shot.x,x);near(shot.life,life);near(g.state.elapsed,elapsed);
  }
});
test('green-door Stay clears hostile shots and resets surviving distant Spitter windups',()=>{
  const g=loadGame();prepareExit(g);reachExit(g);const close=spitter({x:g.p.x,y:g.p.y}),far=spitter({x:g.p.x+500,y:g.p.y,phase:'aim',phaseTime:.01});g.setup({enemies:[close,far],hostileShots:[hostileShot({x:g.p.x+5,y:g.p.y})]});g.p.hp=1;chooseExitForTest(g,'stay');
  assert.equal(g.state.hostileShots.length,0);assert.equal(close.hp,0);assert.ok(far.hp>0);assert.equal(far.phase,'approach');near(far.cooldown,2.8);near(g.p.inv,1.5);assert.equal(g.state.spittersDefeated,1);g.update(.02);near(g.p.hp,1);
});
test('Spitter kills use normal weapons, barrel damage, XP accounting, and frozen history stats',()=>{
  const g=loadGame();cleanRun(g);const e=spitter({x:60,hp:10});g.setup({enemies:[e],barrels:[{x:60,y:0,r:17,spent:false}]});g.detonateBarrel(g.state.barrels[0]);g.hitEnemy(e,100);assert.equal(g.state.spittersDefeated,1);assert.equal(g.state.killCount,1);assert.equal(g.state.gems.length,1);assert.equal(g.state.gems[0].value,3);assert.equal(g.state.blastKills,1);
  g.pause();quitForTest(g);assert.equal(g.state.runResult.spitters,1);assert.match(g.el('modal').innerHTML,/<strong>1<\/strong><small>SPITTERS DEFEATED/);const next=loadGame({journalStored:g.journalSaved()});next.showJournal();assert.match(next.el('modal').innerHTML,/1 Spitters defeated/);
});
test('killing a Spitter during warning prevents its pending shot',()=>{
  const g=loadGame();cleanRun(g);const e=spitter({phase:'aim',phaseTime:.01,hp:10});g.setup({enemies:[e]});g.hitEnemy(e,10);g.update(.02);assert.equal(g.state.hostileShots.length,0);assert.equal(g.state.spittersDefeated,1);
});
test('retry clears Spitter counters, projectiles, and schedule without altering 20 HP cache or exit safety tuning',()=>{
  const g=loadGame();cleanRun(g);const e=spitter({hp:10});g.setup({enemies:[e],hostileShots:[hostileShot()]});g.hitEnemy(e,10);g.pause();quitForTest(g);g.el('again').click();assert.equal(g.state.spittersDefeated,0);assert.equal(g.state.hostileShots.length,0);near(g.state.nextSpitterAt,65);assert.equal(g.supplyTuning.heal,20);near(g.exitReturnTuning.shield,1.5);assert.equal(g.state.exitAt,180);
});
test('old and untrusted journals safely omit or clamp Spitter counts',()=>{
  const g=loadGame({journalStored:journalData('survivor',{history:[{outcome:'extracted',time:181},{outcome:'defeated',time:1,spitters:'<img>'},{outcome:'abandoned',time:2,spitters:-5}]})});assert.equal(g.state.journal.history[0].spitters,null);assert.equal(g.state.journal.history[1].spitters,null);assert.equal(g.state.journal.history[2].spitters,0);g.showJournal();assert.doesNotMatch(g.el('modal').innerHTML,/<img/);
});
test('two-minute integrated Spitter simulation fires shots and keeps ranged state bounded',()=>{
  const g=loadGame();cleanRun(g);g.scheduleRush(Infinity);g.setup({elapsed:64.5,nextBossAt:1000,nextSpitterAt:65});g.p.inv=999;g.p.fireClock=999;let sawWarning=false,sawShot=false;
  for(let i=0;i<3600;i++){
    g.update(1/30);sawWarning ||= g.state.enemies.some(e=>e.spitter&&e.phase==='aim');sawShot ||= g.state.hostileShots.length>0;
    assert.equal(g.state.mode,'play');assert.ok(g.state.enemies.filter(e=>e.spitter&&e.hp>0).length<=2);assert.ok(g.state.hostileShots.length<=g.limits.hostileShots);assert.ok(g.state.hostileShots.every(b=>Number.isFinite(b.x)&&Number.isFinite(b.y)&&b.life>0));if(i%180===0)g.render();
  }
  assert.equal(sawWarning,true);assert.equal(sawShot,true);assert.equal(g.state.enemies.filter(e=>e.spitter).length,2);near(g.p.hp,100);
});

function earnUpgrade(g){g.setup({xp:g.state.nextXp});g.checkLevelUp();assert.equal(g.state.mode,'upgrade');return choiceLabels(g)}
function chooseNamed(g,name){const labels=choiceLabels(g),index=labels.findIndex(label=>label.startsWith(name));assert.ok(index>=0,`${name} should be offered: ${labels}`);g.choose(index)}
// Explicit legal offer fixture for card effects/accounting, independent of draw luck.
// Distribution tests below always exercise unmodified native random offers.
function fixtureOfferedUpgrade(g,name){
 assert.equal(g.state.mode,'upgrade');const option=g.opts.find(o=>o.name===name);assert.ok(option&&(!option.available||option.available())&&!g.state.banished.has(name),'fixture must be legal');
 if(g.state.upgradeOffer.picks.includes(option))return;
 const {picks,reward}=g.state.upgradeOffer;g.showUpgradeChoices([option,...picks.filter(o=>o!==option)].slice(0,picks.length),reward);
}

test('each explicitly offered weapon rank and evolution card applies the selected stage',()=>{
  for(const [weapon,rank,flag,evolution] of [['Piercing Rounds','pierce','rail','Railstorm'],['Chain Lightning','arc','thunder','Thunderweb'],['Orbiting Blades','blades','reaper','Reaper Ring'],['Molotov','molotov','wildfire','Wildfire']]){
    const g=loadGame();cleanRun(g);
    for(let i=1;i<=3;i++){earnUpgrade(g);fixtureOfferedUpgrade(g,weapon);chooseNamed(g,weapon);assert.equal(g.p[rank],i);assert.equal(g.p[flag],false)}
    earnUpgrade(g);assert.match(g.el('modal').innerHTML,/EVOLUTION CAN APPEAR/);fixtureOfferedUpgrade(g,'Evolve: '+evolution);chooseNamed(g,'Evolve: '+evolution);assert.equal(g.p[flag],true);assert.equal(g.p[rank],3);assert.match(g.buildSummary(),new RegExp(evolution+' \\(EVOLVED\\)'));
  }
});
test('evolutions require rank three and completed evolutions leave the upgrade pool',()=>{
  const g=loadGame();cleanRun(g);
  for(const e of g.evolutions){const option=g.opts.find(o=>o.evolution===e.field);for(const rank of [0,1,2]){g.p[e.weapon]=rank;assert.equal(option.available(),false)}g.p[e.weapon]=3;assert.equal(option.available(),true);option.apply();assert.equal(option.available(),false)}
  const labels=earnUpgrade(g);assert.ok(labels.every(label=>!label.startsWith('Evolve: ')));assert.equal(new Set(labels).size,3);
});
test('declining an evolution keeps it available and every upgrade retains three distinct choices',()=>{
  const g=loadGame();cleanRun(g);g.p.pierce=3;g.setup({level:4});let labels=earnUpgrade(g);fixtureOfferedUpgrade(g,'Evolve: Railstorm');labels=choiceLabels(g);assert.ok(labels.includes('Evolve: Railstorm'));g.choose(labels.findIndex(label=>label!=='Evolve: Railstorm'));assert.equal(g.p.rail,false);
  labels=earnUpgrade(g);assert.equal(g.opts.find(o=>o.evolution==='rail').available(),true);fixtureOfferedUpgrade(g,'Evolve: Railstorm');labels=choiceLabels(g);assert.ok(labels.includes('Evolve: Railstorm'));assert.equal(new Set(labels).size,3);fixtureOfferedUpgrade(g,'Evolve: Railstorm');chooseNamed(g,'Evolve: Railstorm');const stale=g.choices()[0];assert.equal(g.p.rail,true);assert.equal(g.state.mode,'play');
});
test('owned ranks and ready evolutions can appear or be absent across native random offers',()=>{
 const g=loadGame();cleanRun(g);g.p.arc=1;g.p.pierce=3;g.setup({level:4});let ranks=0,evolutions=0;
 for(let i=0;i<500;i++){const picks=g.upgradeChoices();assert.equal(picks.length,3);assert.equal(new Set(picks).size,3);ranks+=picks.some(o=>o.weapon==='arc');evolutions+=picks.some(o=>o.evolution==='rail')}
 assert.ok(ranks>0&&ranks<500);assert.ok(evolutions>0&&evolutions<500);
});
test('Blackout bonus choices can select evolutions without consuming earned XP',()=>{
  const g=loadGame();cleanRun(g);g.p.blades=3;g.setup({level:4,xp:7,bonusChoices:1});g.checkLevelUp();assert.equal(g.state.xp,7);fixtureOfferedUpgrade(g,'Evolve: Reaper Ring');chooseNamed(g,'Evolve: Reaper Ring');assert.equal(g.p.reaper,true);assert.equal(g.state.xp,7);assert.equal(g.state.mode,'play');
});
test('Railstorm shots hit eight distinct enemies in order with boosted snapshot damage',()=>{
  const g=loadGame();cleanRun(g);Object.assign(g.p,{pierce:3,rail:true,bulletSpeed:1000,inv:999});const targets=Array.from({length:9},(_,i)=>enemy({x:60+i*60,r:10,hp:1000}));g.setup({enemies:[...targets].reverse(),barrels:[]});g.update(.6);
  for(let i=0;i<9;i++)near(targets[i].hp,i<8?977.5:1000);assert.equal(g.state.bullets.length,0);near(g.p.damage,18);
});
test('evolving piercing changes future shots while bullets in flight retain their old stats',()=>{
  const g=loadGame();cleanRun(g);g.p.pierce=3;g.setup({enemies:[enemy({x:600,hp:1000})]});g.update(.01);const old=g.state.bullets[0];near(old.dmg,18);assert.equal(old.remainingHits,4);near(old.vx,600);
  g.opts.find(o=>o.evolution==='rail').apply();g.p.fireClock=0;g.update(.001);const newer=g.state.bullets.find(b=>b!==old);near(old.dmg,18);assert.equal(old.remainingHits,4);assert.equal(old.rail,false);near(newer.dmg,22.5);assert.equal(newer.remainingHits,8);near(newer.vx,720);assert.equal(newer.rail,true);g.render();
});
test('Thunderweb branches across eight distinct targets and cannot double-hit a lone boss',()=>{
  const g=loadGame();cleanRun(g);Object.assign(g.p,{arc:3,thunder:true});const targets=Array.from({length:8},(_,i)=>enemy({x:80+(i%4)*35,y:i<4?-45:45,hp:1000}));g.setup({enemies:targets});assert.equal(g.fireLightning(),8);for(const e of targets)near(e.hp,982);assert.equal(g.state.lightning.length,8);assert.ok(g.state.lightning.every(e=>e.evolved));
  g.spawnBoss();const b=g.state.activeBoss;Object.assign(b,{x:120,y:0,hp:1000});g.setup({enemies:[b]});assert.equal(g.fireLightning(),1);near(b.hp,982);
});
test('Thunderweb preserves at least a full five-target chain when a second branch cannot reach',()=>{
  const g=loadGame();cleanRun(g);Object.assign(g.p,{arc:3,thunder:true});const targets=Array.from({length:6},(_,i)=>enemy({x:100+i*170,hp:1000}));g.setup({enemies:targets});assert.equal(g.fireLightning(),5);for(let i=0;i<5;i++)near(targets[i].hp,982);near(targets[5].hp,1000);
});
test('evolved weapon damage still benefits from Heavy Rounds without changing the base gun fire rate',()=>{
  const g=loadGame();cleanRun(g);Object.assign(g.p,{arc:3,thunder:true,blades:3,reaper:true});g.opts.find(o=>o.name==='Heavy Rounds').apply();const e=enemy({x:100,hp:1000});g.setup({enemies:[e]});g.fireLightning();near(e.hp,1000-18*1.3);g.updateWeapons(0,g.p);near(e.hp,1000-18*1.3-18*1.3*1.35);near(g.p.fire,.33);
});
test('Thunderweb recharges in eight-tenths of a gameplay second',()=>{
  const g=loadGame();cleanRun(g);Object.assign(g.p,{arc:3,thunder:true});g.setup({enemies:[enemy({x:200,hp:10000})]});g.updateWeapons(.21,g.p);near(g.state.chainClock,.8);
});
test('Reaper Ring has six wider blades and shares one stronger contact cooldown per target',()=>{
  const g=loadGame();cleanRun(g);Object.assign(g.p,{blades:3,reaper:true});assert.equal(g.bladePositions().length,6);for(const b of g.bladePositions())near(Math.hypot(b.x,b.y),100);
  const e=enemy({x:0,r:120,hp:1000});g.setup({enemies:[e]});g.updateWeapons(0,g.p);near(e.hp,975.7);g.updateWeapons(.01,g.p);near(e.hp,975.7);g.setup({elapsed:.36});g.updateWeapons(.01,g.p);near(e.hp,951.4);g.render();
});
test('only evolved blades block Spitter shots on a swept blade contact',()=>{
  for(const evolved of [false,true]){
    const g=loadGame();cleanRun(g);Object.assign(g.p,{blades:3,reaper:evolved});g.setup({elapsed:.035,hostileShots:[hostileShot({x:120,vx:-1000})]});g.updateHostileShots(.035,{x:0,y:0});near(g.p.hp,100);assert.equal(g.state.hostileShots.length,evolved?0:1);assert.equal(g.state.killCount,0);assert.equal(g.state.gems.length,0);
  }
});
test('Reaper Ring blocks a shot encountered by a moving survivor before the body reaches it',()=>{
  const g=loadGame();cleanRun(g);Object.assign(g.p,{blades:3,reaper:true,x:200});g.setup({elapsed:.035,hostileShots:[hostileShot({x:150,vx:0})]});g.updateHostileShots(.035,{x:0,y:0});near(g.p.hp,100);assert.equal(g.state.hostileShots.length,0);
});
test('Reaper Ring is not immunity: shots already inside the blades can hit the body first',()=>{
  const g=loadGame();cleanRun(g);Object.assign(g.p,{blades:3,reaper:true});g.setup({elapsed:1,hostileShots:[hostileShot({x:10,vx:0})]});g.updateHostileShots(1,{x:0,y:0});near(g.p.hp,90);assert.equal(g.state.hostileShots.length,0);
});
test('evolutions survive overtime, remain frozen while paused, and reset on retry',()=>{
  const g=loadGame();prepareExit(g);Object.assign(g.p,{pierce:3,arc:3,blades:3,rail:true,thunder:true,reaper:true});reachExit(g);chooseExitForTest(g,'stay');assert.equal(g.p.rail&&g.p.thunder&&g.p.reaper,true);g.pause();const before=g.bladePositions().map(b=>[b.x,b.y]);g.update(100);assert.deepEqual(g.bladePositions().map(b=>[b.x,b.y]),before);quitForTest(g);assert.equal(g.state.runResult.rail,true);assert.match(g.el('modal').innerHTML,/Railstorm \(EVOLVED\).*Thunderweb \(EVOLVED\).*Reaper Ring \(EVOLVED\)/);g.el('again').click();assert.equal(g.p.rail||g.p.thunder||g.p.reaper,false);assert.equal(g.buildSummary(),'Gun ×1');
});
test('completed evolution names persist in the local journal while old runs stay unevolved',()=>{
  const g=loadGame();cleanRun(g);Object.assign(g.p,{pierce:3,rail:true,arc:3,thunder:true,blades:3,reaper:true});g.pause();quitForTest(g);const next=loadGame({journalStored:g.journalSaved()});next.showJournal();assert.match(next.el('modal').innerHTML,/Railstorm \(EVOLVED\).*Thunderweb \(EVOLVED\).*Reaper Ring \(EVOLVED\)/);next.showRoster();
  const old=loadGame({journalStored:journalData('survivor',{history:[{outcome:'extracted',time:181,pierce:3,arc:3,blades:3}]})});old.showJournal();assert.doesNotMatch(old.el('modal').innerHTML,/EVOLVED/);assert.match(old.el('modal').innerHTML,/Pierce 3\/3 · Lightning 3\/3 · Blades 3\/3/);
});
test('saved evolution flags require explicit booleans and rank three, and never give a new run combat power',()=>{
  const g=loadGame({journalStored:journalData('survivor',{history:[{outcome:'extracted',time:181,pierce:1,rail:true,arc:3,thunder:'true',blades:3,reaper:true}]})});const row=g.state.journal.history[0];assert.equal(row.rail,false);assert.equal(row.thunder,false);assert.equal(row.reaper,true);cleanRun(g);assert.equal(g.p.rail||g.p.thunder||g.p.reaper,false);near(g.p.damage,18);
});
test('an evolution choice cannot apply twice through a stale queued-upgrade callback',()=>{
  const g=loadGame();cleanRun(g);g.p.pierce=3;g.setup({level:4,bonusChoices:1,xp:g.state.nextXp});g.checkLevelUp();fixtureOfferedUpgrade(g,'Evolve: Railstorm');const labels=choiceLabels(g),index=labels.indexOf('Evolve: Railstorm'),old=g.choices()[index];assert.ok(index>=0);g.choose(index);assert.equal(g.p.rail,true);assert.equal(g.state.mode,'upgrade');const level=g.state.level;old.onclick();assert.equal(g.state.level,level);assert.equal(g.p.rail,true);assert.equal(g.state.mode,'upgrade');assert.ok(!choiceLabels(g).includes('Evolve: Railstorm'));
});
test('two-minute evolved combat simulation respects effect, enemy, and hostile-shot budgets',()=>{
  const g=loadGame();g.start();Object.assign(g.p,{pierce:3,arc:3,blades:3,rail:true,thunder:true,reaper:true,proj:5,fire:.075,inv:999});
  for(let i=0;i<3600;i++){
    while(g.state.mode==='upgrade')g.choose(0);g.touch.x=Math.cos(i/100)*.5;g.touch.y=Math.sin(i/100)*.5;g.update(1/30);
    assert.ok(Number.isFinite(g.p.hp)&&Number.isFinite(g.p.x)&&Number.isFinite(g.p.y));assert.ok(g.state.enemies.length<=240);assert.ok(g.state.bullets.length<=g.limits.bullets);assert.ok(g.state.lightning.length<=g.limits.lightning);assert.ok(g.state.hostileShots.length<=g.limits.hostileShots);assert.ok(g.state.particles.length<=g.limits.particles);assert.ok(g.state.texts.length<=g.limits.texts);assert.ok(g.state.bladeHits.size<=240);if(i%180===0)g.render();
  }
  assert.equal(g.p.rail&&g.p.thunder&&g.p.reaper,true);
});

function prepareSalvage(g){cleanRun(g);g.setup({elapsed:14.99,nextSalvageAt:15,obstacles:[],barrels:[]});g.update(.02);assert.ok(g.state.salvage)}
// Capture-only fixtures start after the one-time entry pulse; pulse behavior has separate combat checks.
function enterSalvage(g){const b=g.state.salvage;g.p.x=b.x;g.p.y=b.y;b.entered=true;return b}
function finishSalvage(g){const b=enterSalvage(g);b.progress=5.99;g.update(.02);assert.equal(g.state.mode,'upgrade');assert.equal(g.state.salvagesSecured,1)}
test('the first optional salvage holdout appears at fifteen seconds with one bounded window',()=>{
  const g=loadGame();cleanRun(g);g.setup({elapsed:14.9,nextSalvageAt:15,barrels:[],obstacles:[]});g.update(.02);assert.equal(g.state.salvage,null);g.setup({elapsed:15});g.update(.02);const b=g.state.salvage;
  assert.ok(b);near(b.until,g.state.elapsed+20);near(g.state.nextSalvageAt,g.state.elapsed+90);assert.equal(b.r,110);g.update(.02);assert.equal(g.state.salvage,b);assert.match(g.el('salvageGoal').textContent,/SALVAGE .*0.0\/6s/);g.render();
});
test('salvage placement preserves scenery and avoids medical caches and barrels',()=>{
  const g=loadGame();cleanRun(g);const scenery=[{x:-50,y:100,w:100,h:100}],fuel={x:170,y:0,r:17,spent:false},med={x:-170,y:0,r:19,until:99};g.setup({obstacles:scenery,barrels:[fuel],supplyCache:med});assert.ok(g.placeSalvage());const b=g.state.salvage;
  assert.ok(!(b.x>-145&&b.x<145&&b.y>5&&b.y<295));assert.ok(Math.hypot(b.x-fuel.x,b.y-fuel.y)>=117);assert.ok(Math.hypot(b.x-med.x,b.y-med.y)>=119);assert.equal(g.state.obstacles,scenery);assert.equal(g.state.supplyCache,med);assert.equal(g.state.barrels[0],fuel);
});
test('physically blocked holdout placement retries after five seconds without mutating the city',()=>{
  const g=loadGame();cleanRun(g);g.setup({elapsed:15,nextSalvageAt:15,obstacles:[{x:-1000,y:-1000,w:2000,h:2000}],barricades:[{x:-1000,y:-1000,w:2000,h:2000,hp:90}],barrels:[]});g.updateSalvageAvailability();assert.equal(g.state.salvage,null);near(g.state.nextSalvageAt,20);assert.equal(g.state.obstacles.length,1);g.setup({elapsed:20,obstacles:[],barricades:[]});g.scheduleRush(Infinity);g.updateSalvageAvailability();assert.ok(g.state.salvage);
});
test('the first holdout appears with untouched generated scenery, fuel, and cover across seeded maps',()=>{
  for(const seed of [138,...Array.from({length:150},(_,i)=>i+1)]){
    const g=loadGame({seed});g.start();g.setup({elapsed:15});g.updateSalvageAvailability();const b=g.state.salvage;
    assert.ok(b,`seed ${seed} must offer the first holdout`);near(b.until,35);near(g.state.nextSalvageAt,105);
    assert.ok(Math.abs(b.x-g.p.x)+b.r<=206-12);assert.ok(Math.abs(b.y-g.p.y)+b.r<=457.5-24);
    assert.ok(g.state.barrels.every(a=>Math.hypot(a.x-b.x,a.y-b.y)>=b.r+a.r+20));
    assert.ok(g.state.barricades.every(a=>g.pointRectDistance(b,a)>=b.r+20));
  }
});
test('salvage fits portrait and landscape viewports with actual generated starting objects',()=>{
  for(const [width,height] of [[412,915],[915,412],[320,568],[568,320]]){
    for(const seed of [1,138,427,0x5eed1234]){
      const g=loadGame({seed,width,height});g.start();g.setup({elapsed:15});g.updateSalvageAvailability();const b=g.state.salvage;
      assert.ok(b,`${width}x${height} seed ${seed}`);assert.ok(Math.abs(b.x-g.p.x)+b.r<=width/2-12);assert.ok(Math.abs(b.y-g.p.y)+b.r<=height/2-24);g.render();
    }
  }
});
test('scenery-only blockage gets a clearing without deleting solid cover, fuel, or pickups',()=>{
  const g=loadGame();cleanRun(g);const far={x:2000,y:2000,w:100,h:100},fuel={x:1500,y:0,r:17,spent:false};
  g.setup({obstacles:[{x:-500,y:-500,w:1000,h:1000},far],barrels:[fuel]});const cover=g.state.barricades;
  assert.ok(g.placeSalvage());assert.deepEqual(g.state.obstacles,[far]);assert.equal(g.state.barrels[0],fuel);assert.equal(g.state.barricades,cover);
  assert.equal(g.state.killCount,0);assert.equal(g.state.bonusChoices,0);near(g.p.hp,100);
});
test('the previously missed map now offers salvage at fifteen seconds through normal updates',()=>{
  const g=loadGame({seed:138});g.start();g.p.inv=999;
  for(let i=0;i<470&&!g.state.salvage;i++){
    while(g.state.mode==='upgrade')g.choose(0);g.update(1/30);
  }
  assert.ok(g.state.salvage);assert.ok(g.state.elapsed>=15&&g.state.elapsed<15.1);assert.ok(g.state.barricades.every(a=>g.pointRectDistance(g.state.salvage,a)>=g.state.salvage.r+20));
  assert.match(g.el('salvageGoal').textContent,/SALVAGE .*0.0\/6s/);g.render();
});
test('salvage HUD explains countdown and encounter deferral and clears for extraction',()=>{
  const g=loadGame();g.start();assert.equal(g.el('salvageGoal').textContent,'SALVAGE IN 00:15');
  g.setup({elapsed:15,barricades:[{x:-1000,y:-1000,w:2000,h:2000,hp:90}]});g.updateSalvageAvailability();g.updateEncounterHUD();assert.equal(g.el('salvageGoal').textContent,'SALVAGE IN 00:05');
  g.scheduleRush(45);g.setup({elapsed:20,nextSalvageAt:20});g.updateSalvageAvailability();g.updateEncounterHUD();assert.equal(g.el('salvageGoal').textContent,'SALVAGE • WAITING FOR A SAFE WINDOW');
  g.setup({elapsed:40});g.updateRush(.01);g.updateEncounterHUD();assert.equal(g.el('salvageGoal').textContent,'SALVAGE • AFTER THIS ENCOUNTER');
  g.scheduleRush(Infinity);g.setup({elapsed:180,bossesDefeated:1,nextBossAt:1000});g.updateExtractionWindow();g.updateEncounterHUD();assert.ok(g.state.exitBeacon);assert.equal(g.el('salvageGoal').textContent,'');
});
test('first entry pulses before contact damage, cancels local ranged threats, and grants no kill or heal',()=>{
  const g=loadGame();prepareSalvage(g);const b=enterSalvage(g);b.entered=false;g.p.hp=1;g.p.fireClock=999;
  const contact=enemy({x:g.p.x,y:g.p.y,hp:1000,speed:130}),spitter=enemy({x:g.p.x+50,y:g.p.y,spitter:true,hp:1000,speed:82,phase:'aim',phaseTime:.001,cooldown:0}),far=enemy({x:g.p.x+500,y:g.p.y,hp:1000});
  const farShot=hostileShot({x:g.p.x+600,y:g.p.y,vx:0});g.setup({enemies:[contact,spitter,far],hostileShots:[hostileShot({x:g.p.x,y:g.p.y,vx:0}),farShot]});
  g.update(.02);assert.equal(g.state.mode,'play');assert.equal(b.entered,true);near(g.p.hp,1);near(g.p.inv,1);
  for(const e of [contact,spitter]){assert.ok(Math.hypot(e.x-g.p.x,e.y-g.p.y)>260+e.r);near(e.salvageStunUntil,g.state.elapsed+2);near(e.hp,1000)}
  assert.equal(spitter.phase,'approach');near(spitter.cooldown,2.8);assert.equal(far.salvageStunUntil,undefined);assert.equal(g.state.hostileShots.length,1);assert.equal(g.state.hostileShots[0],farShot);
  assert.equal(g.state.killCount,0);assert.equal(g.state.gems.length,0);assert.equal(g.state.xp,0);assert.equal(g.state.bonusChoices,0);assert.equal(g.state.blastKills,0);assert.equal(g.state.blastRings.at(-1).color,'#ffdb8d');
});
test('a salvage pulse is spent once and cannot be refreshed by leaving, reentering, or stale calls',()=>{
  const g=loadGame();prepareSalvage(g);const b=enterSalvage(g);b.entered=false;g.p.inv=3;
  const e=enemy({x:g.p.x,y:g.p.y,hp:1000});g.setup({enemies:[e]});assert.equal(g.activateSalvage(),true);near(g.p.inv,3);const until=e.salvageStunUntil,rings=g.state.blastRings.length;
  g.p.x=b.x+b.r+10;assert.equal(g.activateSalvage(),false);g.p.x=b.x;g.p.inv=0;e.x=g.p.x;e.y=g.p.y;
  g.setup({elapsed:g.state.elapsed+3});assert.equal(g.activateSalvage(),false);near(g.p.inv,0);near(e.x,g.p.x);near(e.salvageStunUntil,until);assert.equal(g.state.blastRings.length,rings);assert.equal(g.state.salvagesSecured,0);
});
test('entry pulses cannot activate outside, after expiry, during a boss, or in frozen modes',()=>{
  for(const reason of ['outside','expired','boss','pause','upgrade','end','dead']){
    const g=loadGame();prepareSalvage(g);const b=enterSalvage(g);b.entered=false;
    if(reason==='outside')g.p.x=b.x+b.r+1;if(reason==='expired')g.setup({elapsed:b.until});if(reason==='boss')g.spawnBoss();if(reason==='pause')g.pause();if(reason==='upgrade'){g.setup({xp:8});g.checkLevelUp()}if(reason==='end'){g.pause();quitForTest(g)}if(reason==='dead')g.p.hp=0;
    const rings=g.state.blastRings.length,inv=g.p.inv;assert.equal(g.activateSalvage(),false,reason);assert.equal(b.entered,false);assert.equal(g.state.blastRings.length,rings);near(g.p.inv,inv);
  }
});
test('entry stun and shield freeze while paused, expire during play, and fresh runs remove them',()=>{
  const g=loadGame();prepareSalvage(g);const b=enterSalvage(g);b.entered=false;g.p.fireClock=999;
  const e=enemy({x:g.p.x+40,y:g.p.y,hp:1000,speed:100});g.setup({enemies:[e]});g.update(.02);const x=e.x,y=e.y,until=e.salvageStunUntil,time=g.state.elapsed;
  g.pause();g.update(100);near(g.state.elapsed,time);near(e.salvageStunUntil,until);near(g.p.inv,1);g.resume();
  for(let i=0;i<90;i++)g.update(.02);near(e.x,x);near(e.y,y);near(g.p.inv,0);
  for(let i=0;i<12;i++)g.update(.02);assert.ok(Math.hypot(e.x-g.p.x,e.y-g.p.y)<Math.hypot(x-g.p.x,y-g.p.y));
  g.start();assert.equal(g.state.salvage,null);assert.equal(g.state.enemies.length,0);near(g.p.inv,0);assert.equal(g.state.blastRings.length,0);
});
test('pulse displacements repair overlap with solid wood without damaging or crediting it',()=>{
  const g=loadGame();prepareSalvage(g);const b=enterSalvage(g);b.entered=false;
  const cover=barrier({x:g.p.x+250,y:g.p.y-40,w:18,h:80}),e=enemy({x:g.p.x+40,y:g.p.y,hp:1000});g.setup({barricades:[cover],enemies:[e]});
  assert.equal(g.activateSalvage(),true);assert.ok(g.pointRectDistance(e,cover)>=e.r-.001);near(cover.hp,90);assert.equal(g.state.barricadesCleared,0);near(e.hp,1000);
});
test('all survivors can secure salvage against a moving full-capacity horde with base stats and one entry pulse',()=>{
  for(const role of ['survivor','scout','bulwark','engineer','scavenger']){
    const g=loadGame();g.showRoster();g.selectSurvivor(role);cleanRun(g);g.scheduleRush(Infinity);
    g.setup({elapsed:145,nextBossAt:1000,exitAt:1000,obstacles:[],barrels:[],nextSupplyAt:Infinity});g.placeSalvage();const b=g.state.salvage;g.p.x=b.x;g.p.y=b.y;g.p.fireClock=999;
    // A surrounding moving horde, with the gun disabled to isolate room created by the single pulse.
    g.setup({enemies:Array.from({length:239},(_,i)=>enemy({x:b.x+100*Math.cos(i/239*Math.PI*2),y:b.y+100*Math.sin(i/239*Math.PI*2),hp:1000,speed:i%3===0?208:i%3===1?112:78,dmg:i%3===0?9:i%3===1?12:20,r:i%3===2?23:15}))});
    for(let i=0;i<360&&g.state.mode==='play';i++){
      const a=i*g.p.speed/85/60,target={x:b.x+85*Math.cos(a),y:b.y+85*Math.sin(a)},d=Math.hypot(target.x-g.p.x,target.y-g.p.y),strength=d?Math.min(1,d*60/g.p.speed):0;
      g.touch.x=d?strength*(target.x-g.p.x)/d:0;g.touch.y=d?strength*(target.y-g.p.y)/d:0;g.update(1/60);
    }
    assert.equal(g.state.mode,'upgrade',role);assert.equal(g.state.salvagesSecured,1);assert.ok(g.p.hp>0&&g.p.hp<g.p.max,role+' survives but remains vulnerable');
    near(g.state.elapsed,151);assert.equal(g.state.killCount,0);assert.equal(g.state.xp,0);assert.equal(g.state.enemies.length,239);assert.equal(g.state.blastRings.length,0);assert.ok(g.state.enemies.every(e=>e.salvageStunUntil<g.state.elapsed));
  }
});
test('six clear seconds grant one labeled bonus choice without spending XP or healing',()=>{
  const g=loadGame();prepareSalvage(g);enterSalvage(g);g.p.hp=70;g.setup({xp:7});
  for(let i=0;i<300&&g.state.mode==='play';i++)g.update(.02);
  assert.equal(g.state.mode,'upgrade');assert.equal(g.state.salvage,null);assert.equal(g.state.salvagesSecured,1);assert.equal(g.state.xp,7);near(g.p.hp,70);assert.match(g.el('modal').innerHTML,/SALVAGE SECURED · BONUS UPGRADE/);assert.equal(g.choices().length,4);g.choose(0);g.updateSalvageProgress(100,g.p);assert.equal(g.state.salvagesSecured,1);assert.equal(g.state.bonusChoices,0);
});
test('leaving pauses salvage while enemy contest retains full progress speed',()=>{
  const g=loadGame();prepareSalvage(g);const b=enterSalvage(g);g.updateSalvageProgress(1,g.p);near(b.progress,1);g.p.x=b.x+b.r+1;g.updateSalvageProgress(1,g.p);near(b.progress,1);g.p.x=b.x;
  const e=enemy({x:b.x+b.r+15,y:b.y,hp:100});g.setup({enemies:[e]});g.updateSalvageProgress(1,g.p);near(b.progress,2);assert.equal(g.salvageStatus(),'UNDER ATTACK · KEEP MOVING');e.hp=0;g.updateSalvageProgress(1,g.p);near(b.progress,3);assert.equal(g.salvageStatus(),'HOLD POSITION');
});
test('a full enemy capacity cannot slow the six-second salvage capture',()=>{
  for(const count of [1,60,239]){
    const g=loadGame();prepareSalvage(g);const b=enterSalvage(g);
    g.setup({enemies:Array.from({length:count},()=>enemy({x:b.x+b.r,y:b.y,hp:1000}))});
    g.updateSalvageProgress(4,g.p);near(b.progress,4);assert.equal(g.state.salvagesSecured,0);
    g.updateSalvageProgress(1.99,g.p);near(b.progress,5.99);assert.equal(g.state.salvagesSecured,0);
    g.updateSalvageProgress(.02,g.p);assert.equal(g.state.salvagesSecured,1);assert.equal(g.state.bonusChoices,1);
    g.updateSalvageProgress(10,g.p);assert.equal(g.state.salvagesSecured,1);assert.equal(g.state.bonusChoices,1);
  }
});
test('mixed clear and contested time combines, with progress preserved across an escape',()=>{
  const g=loadGame();prepareSalvage(g);const b=enterSalvage(g);g.updateSalvageProgress(3,g.p);near(b.progress,3);
  g.setup({enemies:[enemy({x:b.x+b.r,y:b.y,hp:1000})]});g.p.x=b.x+b.r+10;
  assert.equal(g.salvageStatus(),'ENTER GOLD CIRCLE');g.updateSalvageProgress(2,g.p);near(b.progress,3);
  g.p.x=b.x;g.updateSalvageProgress(1,{x:b.x+b.r+10,y:b.y});near(b.progress,3);
  g.updateSalvageProgress(2.99,g.p);near(b.progress,5.99);g.updateSalvageProgress(.02,g.p);assert.equal(g.state.salvagesSecured,1);
});
test('later and overtime holdouts complete under persistent dense contest in the actual update loop',()=>{
  for(const time of [145,260,620]){
    const g=loadGame();cleanRun(g);g.scheduleRush(Infinity);
    g.setup({elapsed:time,nextSalvageAt:time,nextBossAt:time+90,exitAt:time+60,nextSupplyAt:Infinity,obstacles:[],barrels:[]});
    g.updateSalvageAvailability();const b=enterSalvage(g);assert.ok(b);near(b.until,time+20);g.p.fireClock=1000;g.p.hp=70;
    // Stationary edge enemies isolate persistent contest from combat survival, without player invulnerability.
    g.setup({enemies:Array.from({length:239},(_,i)=>enemy({x:b.x+(b.r+14)*Math.cos(i/239*Math.PI*2),y:b.y+(b.r+14)*Math.sin(i/239*Math.PI*2),hp:1000}))});
    for(let i=0;i<299;i++)g.update(.02);
    assert.equal(g.state.mode,'play');near(b.progress,5.98);assert.match(g.el('salvageGoal').textContent,/UNDER ATTACK · KEEP MOVING/);g.render();
    g.update(.02);assert.equal(g.state.mode,'upgrade');assert.equal(g.state.salvagesSecured,1);assert.equal(g.state.enemies.length,239);
    near(g.state.elapsed,time+6);near(g.p.hp,70);assert.equal(g.state.xp,0);assert.match(g.el('modal').innerHTML,/SALVAGE SECURED · BONUS UPGRADE/);
    g.choose(0);g.update(.02);assert.equal(g.state.salvagesSecured,1);assert.equal(g.state.bonusChoices,0);
  }
});
test('contested holdouts still expire on time and lethal contact prevents the final reward',()=>{
  for(const lethal of [false,true]){
    const g=loadGame();prepareSalvage(g);const b=enterSalvage(g);b.progress=5.99;g.p.fireClock=1000;
    g.setup({enemies:[enemy({x:g.p.x,y:g.p.y,hp:1000})]});
    if(lethal)g.p.hp=1;else g.setup({elapsed:b.until-.01});
    g.update(.02);assert.equal(g.state.salvagesSecured,0);assert.equal(g.state.bonusChoices,0);
    assert.equal(g.state.mode,lethal?'end':'play');if(lethal)assert.equal(g.state.runResult.salvages,0);else assert.equal(g.state.salvage,null);
  }
});
test('contested progress and remaining window freeze under pause and resume at full speed',()=>{
  const g=loadGame();prepareSalvage(g);const b=enterSalvage(g);g.p.fireClock=1000;
  g.setup({enemies:[enemy({x:b.x+b.r+14,y:b.y,hp:1000})]});g.update(.02);near(b.progress,.02);
  const time=g.state.elapsed,until=b.until;g.pause();g.update(100);g.updateSalvageProgress(100,g.p);near(b.progress,.02);near(g.state.elapsed,time);near(b.until,until);
  g.resume();g.update(.02);near(b.progress,.04);assert.equal(g.salvageStatus(),'UNDER ATTACK · KEEP MOVING');
});
test('a fast dash across the circle or first arrival frame cannot instantly grant hold progress',()=>{
  const g=loadGame();prepareSalvage(g);const b=g.state.salvage;g.p.x=b.x+b.r+100;g.p.y=b.y;g.updateSalvageProgress(6,{x:b.x-b.r-100,y:b.y});near(b.progress,0);g.p.x=b.x;g.updateSalvageProgress(6,{x:b.x-b.r-100,y:b.y});near(b.progress,0);assert.equal(g.state.salvagesSecured,0);g.updateSalvageProgress(.1,g.p);near(b.progress,.1);
});
test('ignored or expired holdouts award nothing and do not grant an immediate replacement',()=>{
  const g=loadGame();prepareSalvage(g);const b=g.state.salvage,next=g.state.nextSalvageAt;b.progress=5.99;g.setup({elapsed:b.until});g.updateSalvageProgress(.1,g.p);assert.equal(g.state.salvage,null);assert.equal(g.state.salvagesSecured,0);assert.equal(g.state.bonusChoices,0);near(g.state.nextSalvageAt,next);near(g.p.hp,100);g.updateSalvageAvailability();assert.equal(g.state.salvage,null);
});
test('new holdouts defer for bosses, Rushes, relief, and insufficient room before extraction',()=>{
  for(const reason of ['boss','bossSoon','rush','rushSoon','relief','exitSoon']){
    const g=loadGame();cleanRun(g);g.setup({elapsed:15,nextSalvageAt:15,obstacles:[],barrels:[],nextBossAt:1000});g.scheduleRush(Infinity);
    if(reason==='boss')g.spawnBoss();if(reason==='bossSoon')g.setup({nextBossAt:40});if(reason==='rush'){g.scheduleRush(15);g.updateRush(.01)}if(reason==='rushSoon')g.scheduleRush(40);if(reason==='relief')g.setup({reliefUntil:18});if(reason==='exitSoon')g.setup({exitAt:30});
    g.updateSalvageAvailability();assert.equal(g.state.salvage,null,reason);assert.equal(g.state.salvagesSecured,0);
  }
});
test('an unexpected boss or Blackout warning cancels an active holdout without a reward',()=>{
  for(const event of ['boss','rush']){
    const g=loadGame();prepareSalvage(g);g.state.salvage.progress=5.99;
    if(event==='boss'){g.setup({nextBossAt:g.state.elapsed+10});g.updateEncounter()}else{g.scheduleRush(g.state.elapsed+5);g.updateRush(.01)}
    g.updateSalvageAvailability();assert.equal(g.state.salvage,null);assert.equal(g.state.salvagesSecured,0);assert.equal(g.state.bonusChoices,0);
  }
});
test('opening extraction cancels salvage immediately and never waits for the holdout',()=>{
  const g=loadGame();prepareSalvage(g);g.state.salvage.until=999;g.state.salvage.progress=5.99;g.setup({elapsed:180,bossesDefeated:1,nextBossAt:1000});g.scheduleRush(Infinity);g.updateExtractionWindow();assert.ok(g.state.exitBeacon);assert.equal(g.state.salvage,null);assert.equal(g.state.salvagesSecured,0);reachExit(g);chooseExitForTest(g,'stay');near(g.p.inv,1.5);
});
test('pause, blur, upgrades, and results freeze holdout progress and lifetime',()=>{
  for(const target of ['pause','blur','upgrade','end']){
    const g=loadGame();prepareSalvage(g);const b=enterSalvage(g);b.progress=2;
    if(target==='pause')g.pause();if(target==='blur')g.event('blur');if(target==='upgrade'){g.setup({xp:8});g.checkLevelUp()}if(target==='end'){g.pause();quitForTest(g)}
    const time=g.state.elapsed,until=b.until,next=g.state.nextSalvageAt;g.update(100);g.updateSalvageAvailability();g.updateSalvageProgress(100,g.p);near(g.state.elapsed,time);near(b.until,until);near(b.progress,2);near(g.state.nextSalvageAt,next);assert.equal(g.state.salvagesSecured,0);
  }
});
test('lethal ranged damage on the final hold tick prevents the reward',()=>{
  const g=loadGame();prepareSalvage(g);const b=enterSalvage(g);b.progress=5.99;g.p.hp=1;g.setup({hostileShots:[hostileShot({x:g.p.x-30,y:g.p.y,vx:1000})]});g.update(.02);assert.equal(g.state.mode,'end');assert.equal(g.state.salvagesSecured,0);assert.equal(g.state.bonusChoices,0);assert.equal(g.state.runResult.salvages,0);
});
test('surviving ranged damage can still complete a clear holdout without an extra heal',()=>{
  const g=loadGame();prepareSalvage(g);const b=enterSalvage(g);b.progress=5.99;g.p.hp=50;g.setup({hostileShots:[hostileShot({x:g.p.x-30,y:g.p.y,vx:1000})]});g.update(.02);assert.equal(g.state.mode,'upgrade');assert.equal(g.state.salvagesSecured,1);near(g.p.hp,40);
});
test('same-frame earned XP remains queued behind the salvage bonus upgrade',()=>{
  const g=loadGame();prepareSalvage(g);const b=enterSalvage(g);b.progress=5.99;g.setup({xp:7,gems:[{x:g.p.x,y:g.p.y,r:7,value:1}]});g.update(.02);assert.equal(g.state.mode,'upgrade');assert.match(g.el('modal').innerHTML,/SALVAGE SECURED/);assert.equal(g.state.xp,8);g.choose(0);assert.equal(g.state.mode,'upgrade');assert.doesNotMatch(g.el('modal').innerHTML,/SALVAGE SECURED|BLACKOUT SURVIVED/);assert.equal(g.state.xp,0);g.choose(0);assert.equal(g.state.mode,'play');assert.equal(g.state.salvagesSecured,1);
});
test('salvage, Blackout, and earned upgrade queues retain their own labels and XP',()=>{
  const g=loadGame();prepareSalvage(g);enterSalvage(g);g.updateSalvageProgress(6,g.p);g.scheduleRush(45);g.setup({elapsed:57,xp:8});g.updateRush(.01);g.resolveRushReward();assert.equal(g.state.bonusChoices,2);assert.deepEqual(Array.from(g.state.bonusKinds),['salvage','blackout']);
  g.checkLevelUp();assert.match(g.el('modal').innerHTML,/SALVAGE SECURED/);assert.equal(g.state.xp,8);g.choose(0);assert.match(g.el('modal').innerHTML,/BLACKOUT SURVIVED/);assert.equal(g.state.xp,8);g.choose(0);assert.equal(g.state.xp,0);assert.doesNotMatch(g.el('modal').innerHTML,/SALVAGE SECURED|BLACKOUT SURVIVED/);g.choose(0);assert.equal(g.state.mode,'play');assert.equal(g.state.bonusKinds.length,0);
});
test('a salvage bonus can evolve a ready weapon without spending earned XP',()=>{
  const g=loadGame();prepareSalvage(g);g.p.pierce=3;g.setup({level:4,xp:3});finishSalvage(g);fixtureOfferedUpgrade(g,'Evolve: Railstorm');chooseNamed(g,'Evolve: Railstorm');assert.equal(g.p.rail,true);assert.equal(g.state.xp,3);assert.equal(g.state.salvagesSecured,1);
});
test('secured holdouts appear on frozen results and survive local journal reload',()=>{
  const g=loadGame();prepareSalvage(g);finishSalvage(g);g.choose(0);g.pause();quitForTest(g);assert.equal(g.state.runResult.salvages,1);assert.match(g.el('modal').innerHTML,/<strong>1<\/strong><small>SALVAGE HOLDOUTS/);const next=loadGame({journalStored:g.journalSaved()});next.showJournal();assert.match(next.el('modal').innerHTML,/1 salvage holdouts secured/);
});
test('older and untrusted history cannot fabricate a salvage reward or render saved HTML',()=>{
  const g=loadGame({journalStored:journalData('survivor',{history:[{outcome:'extracted',time:181},{outcome:'defeated',time:1,salvages:'<img>'},{outcome:'abandoned',time:2,salvages:-5}]})});assert.equal(g.state.journal.history[0].salvages,null);assert.equal(g.state.journal.history[1].salvages,null);assert.equal(g.state.journal.history[2].salvages,0);g.showJournal();assert.doesNotMatch(g.el('modal').innerHTML,/<img/);assert.equal(g.state.bonusChoices,0);
});
test('retry clears salvage progress, counters, and bonus sources and restores the first opportunity',()=>{
  const g=loadGame();prepareSalvage(g);finishSalvage(g);g.choose(0);g.pause();quitForTest(g);g.el('again').click();assert.equal(g.state.salvage,null);assert.equal(g.state.salvagesSecured,0);near(g.state.nextSalvageAt,15);assert.equal(g.state.bonusChoices,0);assert.equal(g.state.bonusKinds.length,0);assert.equal(g.el('salvageGoal').textContent,'SALVAGE IN 00:15');assert.equal(g.state.exitAt,180);assert.equal(g.supplyTuning.heal,20);
});
test('an integrated early holdout can be reached and completed through the real update loop',()=>{
  const g=loadGame();g.start();g.setup({spawn:1000,nextSpitterAt:Infinity,obstacles:[],barrels:[]});g.p.inv=999;g.p.fireClock=999;
  for(let i=0;i<950&&!g.state.salvage;i++)g.update(1/60);assert.ok(g.state.salvage);assert.ok(g.state.elapsed>=15);const b=enterSalvage(g);
  for(let i=0;i<365&&g.state.mode==='play';i++)g.update(1/60);assert.equal(g.state.mode,'upgrade');assert.equal(g.state.salvagesSecured,1);assert.match(g.el('modal').innerHTML,/SALVAGE SECURED/);assert.equal(g.state.salvage,null);assert.equal(g.state.xp,0);g.choose(0);g.update(.02);assert.equal(g.state.salvagesSecured,1);g.render();
});

function positionedWarden(g){g.setup({bossesDefeated:1,wardensDefeated:0});g.spawnBoss();const w=g.state.activeBoss;assert.equal(w.bossKind,'warden');Object.assign(w,{x:g.p.x+150,y:g.p.y,phase:'approach',phaseTime:0});return w}
function fireWarden(g,w){g.moveBoss(w,.001);assert.equal(w.phase,'warn');g.moveBoss(w,1.11);assert.equal(w.phase,'recover')}
test('bosses cycle Breaker, Warden and Harvester while the original first encounter stays intact',()=>{
  const g=loadGame();cleanRun(g);const kinds=[];
  for(let i=0;i<4;i++){g.spawnBoss();const b=g.state.activeBoss;kinds.push(b.bossKind);if(i===0){near(b.hp,650);near(b.speed,78);near(b.phaseTime,2.8);near(b.dmg,30)}g.hitEnemy(b,b.hp);assert.equal(g.state.bossesDefeated,i+1)}
  assert.deepEqual(kinds,['breaker','warden','harvester','breaker']);assert.equal(g.state.wardensDefeated,1);assert.equal(g.currentRunStats().breakers,2);assert.equal(g.currentRunStats().wardens,1);assert.equal(g.currentRunStats().harvesters,1);assert.equal(g.nextBossKind(),'warden');
});
test('overtime warns by the next boss name and admits only one Warden at its scheduled time',()=>{
  const g=loadGame();prepareExit(g);reachExit(g);chooseExitForTest(g,'stay');const due=g.state.nextBossAt;assert.ok(due>=g.state.elapsed+40);g.setup({elapsed:due-10});g.updateEncounter();assert.match(g.el('toast').textContent,/WARDEN IN 10 SECONDS/);assert.equal(g.state.activeBoss,null);g.setup({elapsed:due});g.updateEncounter();const w=g.state.activeBoss;assert.equal(w.bossKind,'warden');near(w.max,980);for(let i=0;i<10;i++)g.updateEncounter();assert.equal(g.state.activeBoss,w);assert.equal(g.state.enemies.filter(e=>e.type===3).length,1);
});
test('Warden locks five visible lanes for the full warning then fires a non-homing spread',()=>{
  const g=loadGame();cleanRun(g);const w=positionedWarden(g);g.moveBoss(w,.001);assert.equal(w.phase,'warn');near(w.phaseTime,1.1);near(w.aimAngle,Math.PI);g.p.y=60;g.moveBoss(w,.5);g.moveBoss(w,.59);assert.equal(g.state.hostileShots.length,0);near(w.x,150);g.moveBoss(w,.02);
  assert.equal(w.phase,'recover');assert.equal(g.state.hostileShots.length,5);for(let i=0;i<5;i++){const b=g.state.hostileShots[i],a=Math.PI+g.wardenTuning.spread[i];near(b.vx,Math.cos(a)*200);near(b.vy,Math.sin(a)*200);near(b.life,2.8);assert.equal(b.dmg,12);assert.equal(b.kind,'warden');assert.equal(b.source,w)}g.render();
});
test('Warden recovers before beginning another warned attack and never fires offscreen',()=>{
  const g=loadGame();cleanRun(g);const w=positionedWarden(g);fireWarden(g,w);g.moveBoss(w,.8);assert.equal(w.phase,'recover');g.moveBoss(w,.81);assert.equal(w.phase,'approach');g.moveBoss(w,.81);assert.equal(w.phase,'warn');assert.equal(g.state.hostileShots.length,5);
  Object.assign(w,{x:300,phase:'warn',phaseTime:.01});g.moveBoss(w,.02);assert.equal(w.phase,'approach');assert.equal(g.state.hostileShots.length,5);Object.assign(w,{phaseTime:0});g.moveBoss(w,.02);assert.equal(w.phase,'approach');assert.ok(w.x<300);
});
test('Bulwark can avoid a full Warden volley with sideways movement after a short reaction delay',()=>{
  const g=loadGame({journalStored:journalData('bulwark')});cleanRun(g);const w=positionedWarden(g);g.p.fireClock=100;g.moveBoss(w,.001);let sawVolley=false;
  for(let i=0;i<120;i++){g.keys.s=i>=10;g.update(.02);sawVolley ||= g.state.hostileShots.some(b=>b.kind==='warden')}
  assert.equal(sawVolley,true);near(g.p.hp,140);assert.equal(g.p.dashCd,0);assert.ok(g.p.y>300);
});
test('the blue spread leaves a genuine gap that a stationary survivor can occupy',()=>{
  const g=loadGame();cleanRun(g);const w=positionedWarden(g);g.moveBoss(w,.001);const a=Math.PI+.225;g.p.x=w.x+Math.cos(a)*150;g.p.y=w.y+Math.sin(a)*150;g.moveBoss(w,1.11);assert.equal(g.state.hostileShots.length,5);
  for(let i=0;i<285;i++)g.updateHostileShots(.01,{x:g.p.x,y:g.p.y});near(g.p.hp,100);assert.equal(g.state.hostileShots.length,0);
});
test('Warden volleys respect the existing hostile-shot cap without emitting a partial pattern',()=>{
  const g=loadGame();cleanRun(g);const w=positionedWarden(g);g.setup({hostileShots:Array.from({length:10},()=>hostileShot({x:500,y:500,vx:0}))});fireWarden(g,w);assert.equal(g.state.hostileShots.length,10);
  g.setup({hostileShots:g.state.hostileShots.slice(0,7)});Object.assign(w,{phase:'warn',phaseTime:.01});g.moveBoss(w,.02);assert.equal(g.state.hostileShots.length,12);assert.equal(g.state.hostileShots.filter(b=>b.kind==='warden').length,5);
});
test('blue shots use shared twelve-HP damage and Reaper Ring blocks them on blade contact',()=>{
  const g=loadGame();cleanRun(g);g.setup({hostileShots:[hostileShot({x:-30,vx:1000,dmg:12,kind:'warden'})]});g.updateHostileShots(.02,{x:0,y:0});near(g.p.hp,88);assert.equal(g.state.hostileShots.length,0);
  const blades=loadGame();cleanRun(blades);Object.assign(blades.p,{blades:3,reaper:true});blades.setup({elapsed:.035,hostileShots:[hostileShot({x:105,vx:-200,dmg:12,kind:'warden'})]});blades.updateHostileShots(.035,{x:0,y:0});near(blades.p.hp,100);assert.equal(blades.state.hostileShots.length,0);assert.equal(blades.state.killCount,0);
});
test('Warden name, warning, recovery, and blue health meter stay readable in the boss HUD',()=>{
  const g=loadGame();cleanRun(g);const w=positionedWarden(g);w.hp=w.max/2;g.moveBoss(w,.001);g.updateEncounterHUD();assert.match(g.el('objective').textContent,/WARDEN .*DODGE BLUE LANES/);assert.equal(g.el('bossFill').style.width,'50%');assert.match(g.el('bossFill').style.background,/#6aa7ef/);g.render();g.moveBoss(w,1.11);g.updateEncounterHUD();assert.match(g.el('objective').textContent,/WARDEN .*RECOVERING/);
});
test('all pause and choice modes freeze Warden warning and blue shots',()=>{
  for(const target of ['paused','upgrade','extraction','end']){
    const g=loadGame();if(target==='extraction')prepareExit(g);else cleanRun(g);const w=positionedWarden(g);Object.assign(w,{phase:'warn',phaseTime:.6});const shot=hostileShot({x:500,y:100,kind:'warden',source:w});g.setup({hostileShots:[shot]});
    if(target==='paused')g.pause();if(target==='upgrade'){g.setup({xp:8});g.checkLevelUp()}if(target==='extraction')reachExit(g);if(target==='end'){g.pause();quitForTest(g)}
    const time=g.state.elapsed,x=shot.x,life=shot.life;g.update(100);g.updateHostileShots(100,{x:g.p.x,y:g.p.y});near(g.state.elapsed,time);near(w.phaseTime,.6);near(shot.x,x);near(shot.life,life);
  }
});
test('defeating a Warden gives the normal boss reward once, with correct kind counters and future scheduling',()=>{
  const g=loadGame();cleanRun(g);g.setup({elapsed:230});const w=positionedWarden(g);g.p.hp=90;g.hitEnemy(w,w.hp);assert.equal(g.state.activeBoss,null);assert.equal(g.state.bossesDefeated,2);assert.equal(g.state.wardensDefeated,1);assert.equal(g.currentRunStats().breakers,1);near(g.p.hp,100);near(g.state.nextBossAt,320);near(g.state.nextRushAt,265);near(g.state.reliefUntil,238);assert.equal(g.state.gems[0].value,20);assert.match(g.el('toast').textContent,/WARDEN DOWN/);
  g.hitEnemy(w,99999);assert.equal(g.state.bossesDefeated,2);assert.equal(g.state.wardensDefeated,1);assert.equal(g.state.gems.length,1);assert.equal(g.nextBossKind(),'harvester');
});
test('defeating a Warden cancels its pending volley and clears only its own live projectiles',()=>{
  const g=loadGame();cleanRun(g);const w=positionedWarden(g);fireWarden(g,w);g.state.hostileShots.push(hostileShot({x:500,y:500}));g.hitEnemy(w,w.hp);assert.equal(g.state.hostileShots.length,1);assert.equal(g.state.hostileShots[0].kind,undefined);g.update(.02);assert.equal(g.state.hostileShots.filter(b=>b.kind==='warden').length,0);
});
test('returning through green clears blue shots and restarts a distant Warden with preparation time',()=>{
  const g=loadGame();prepareExit(g);const w=positionedWarden(g);reachExit(g);Object.assign(w,{x:g.p.x+500,y:g.p.y,phase:'warn',phaseTime:.01});g.setup({hostileShots:[hostileShot({x:g.p.x+5,y:g.p.y,kind:'warden',source:w})]});g.p.hp=1;chooseExitForTest(g,'stay');assert.equal(g.state.hostileShots.length,0);assert.equal(w.phase,'approach');near(w.phaseTime,2.8);near(g.p.inv,1.5);g.update(.02);near(g.p.hp,1);assert.equal(g.state.hostileShots.length,0);
});
test('the return pulse can defeat a nearby Warden and preserves the longer boss relief',()=>{
  const g=loadGame();prepareExit(g);const w=positionedWarden(g);reachExit(g);w.x=g.p.x;w.y=g.p.y;g.p.hp=50;chooseExitForTest(g,'stay');assert.equal(g.state.activeBoss,null);assert.equal(g.state.wardensDefeated,1);assert.equal(g.state.bossesDefeated,2);near(g.p.hp,75);near(g.state.reliefUntil,g.state.elapsed+8);assert.equal(g.state.blastKills,0);
});
test('Warden encounters keep salvage, Blackout, and new Spitter arrivals separated',()=>{
  const g=loadGame();cleanRun(g);g.setup({elapsed:220,obstacles:[],barrels:[],nextSalvageAt:220,nextSpitterAt:220});g.placeSalvage();positionedWarden(g);g.scheduleRush(220);g.updateRush(.01);g.updateSalvageAvailability();g.updateSpitterSchedule();assert.equal(g.state.salvage,null);assert.equal(g.state.rushPhase,'waiting');assert.equal(g.state.nextRushAt,Infinity);assert.equal(g.state.enemies.some(e=>e.spitter),false);
});
test('a later exit waits for the active Warden, then opens immediately after its defeat',()=>{
  const g=loadGame();prepareExit(g);reachExit(g);chooseExitForTest(g,'stay');g.scheduleRush(Infinity);g.setup({elapsed:g.state.exitAt});const w=positionedWarden(g);g.updateExtractionWindow();assert.equal(g.state.exitBeacon,null);g.hitEnemy(w,w.hp);g.updateExtractionWindow();assert.ok(g.state.exitBeacon);assert.equal(g.state.wardensDefeated,1);
});
test('results, lifetime totals, and saved history separate Breakers and Wardens while Boss Hunter counts both',()=>{
  const g=loadGame();cleanRun(g);g.spawnBoss();g.hitEnemy(g.state.activeBoss,99999);g.spawnBoss();g.hitEnemy(g.state.activeBoss,99999);g.pause();quitForTest(g);assert.equal(g.state.runResult.breakers,1);assert.equal(g.state.runResult.wardens,1);assert.match(g.el('modal').innerHTML,/<strong>1<\/strong><small>BREAKERS DEFEATED/);assert.match(g.el('modal').innerHTML,/<strong>1<\/strong><small>WARDENS DEFEATED/);assert.ok(g.earnedMedals(g.state.runResult).some(m=>m.name==='Boss Hunter'));
  const next=loadGame({journalStored:g.journalSaved()});assert.equal(next.state.journal.totals.breakers,1);assert.equal(next.state.journal.totals.wardens,1);next.showJournal();assert.match(next.el('modal').innerHTML,/1 Breakers · 1 Wardens/);assert.equal(next.state.journal.history[0].wardens,1);
});
test('old and malformed Warden history preserves old boss counts without inventing or rendering data',()=>{
  const g=loadGame({journalStored:journalData('survivor',{totals:{runs:3,breakers:5,wardens:-1},history:[{outcome:'extracted',time:181,breakers:2},{outcome:'defeated',time:220,breakers:1,wardens:2},{outcome:'abandoned',time:1,wardens:'<img>'}]})});assert.equal(g.state.journal.history[0].wardens,null);assert.equal(g.state.journal.history[2].wardens,null);assert.equal(g.state.journal.totals.breakers,5);assert.equal(g.state.journal.totals.wardens,2);assert.ok(g.earnedMedals(g.state.journal.history[0]).some(m=>m.name==='Boss Hunter'));g.showJournal();assert.doesNotMatch(g.el('modal').innerHTML,/<img/);
});
test('retry restores the first Breaker and resets Warden state and projectiles',()=>{
  const g=loadGame();cleanRun(g);const w=positionedWarden(g);g.hitEnemy(w,w.hp);g.pause();quitForTest(g);g.el('again').click();assert.equal(g.state.bossesDefeated,0);assert.equal(g.state.wardensDefeated,0);assert.equal(g.state.hostileShots.length,0);assert.equal(g.nextBossKind(),'breaker');near(g.state.nextBossAt,90);assert.equal(g.state.exitAt,180);assert.equal(g.supplyTuning.heal,20);
});
test('one minute of integrated Warden combat cycles warnings and recovery within projectile budgets',()=>{
  const g=loadGame();cleanRun(g);g.setup({elapsed:220});const w=positionedWarden(g);g.p.inv=999;g.p.fireClock=999;let warned=false,shot=false,recovered=false;
  for(let i=0;i<1800;i++){g.update(1/30);warned ||= w.phase==='warn';shot ||= g.state.hostileShots.some(b=>b.kind==='warden');recovered ||= w.phase==='recover';assert.equal(g.state.activeBoss,w);assert.ok(g.state.hostileShots.length<=g.limits.hostileShots);assert.ok(g.state.hostileShots.every(b=>Number.isFinite(b.x)&&Number.isFinite(b.y)&&b.life>0));if(i%180===0)g.render()}
  assert.equal(warned&&shot&&recovered,true);near(g.p.hp,100);assert.equal(g.state.enemies.filter(e=>e.type===3).length,1);
});

function barrier(overrides={}){return{x:100,y:-50,w:18,h:100,hp:90,max:90,pressureDamage:0,...overrides}}
test('starting barricades are few, visible, and leave the survivor a clear central route',()=>{
  const g=loadGame();g.start();assert.equal(g.state.barricades.length,2);for(const b of g.state.barricades){assert.ok(g.pointRectDistance(g.p,b)>g.p.r+20);assert.equal(b.hp,90)}g.p.x=300;g.resolveBarricadeBody(g.p,{x:0,y:0});near(g.p.x,300);near(g.p.y,0);g.render();
});
test('swept barricade collision handles flat faces, rounded corners, and clear misses',()=>{
  const g=loadGame(),b=barrier();near(g.rectHitTime(b,{x:0,y:0},{x:200,y:0},16),.42);near(g.rectHitTime(b,{x:0,y:-65},{x:200,y:-65},16),(100-Math.sqrt(31))/200);assert.equal(g.rectHitTime(b,{x:0,y:-67},{x:200,y:-67},16),Infinity);assert.equal(g.rectHitTime(b,{x:0,y:1000},{x:200,y:1000},16),Infinity);
});
test('walking stops at a barricade, slides along it, and can move away without sticking',()=>{
  const g=loadGame();cleanRun(g);const b=barrier();g.setup({barricades:[b]});g.p.speed=1000;g.keys.d=true;g.update(.2);assert.ok(g.p.x<=84&&g.p.x>83.99);near(g.p.y,0);near(g.p.hp,100);
  g.keys.s=true;g.update(.02);assert.ok(g.p.x<=84);assert.ok(g.p.y>10);const x=g.p.x;g.keys.d=g.keys.s=false;g.keys.a=true;g.update(.02);assert.ok(g.p.x<x-19);assert.equal(b.hp,90);
});
test('high-speed walking cannot tunnel through cover, while a dash shatters every crossed barricade once',()=>{
  const walk=loadGame();cleanRun(walk);walk.setup({barricades:[barrier()]});walk.p.speed=100000;walk.keys.d=true;walk.update(.035);assert.ok(walk.p.x<=84);
  const g=loadGame();cleanRun(g);const a=barrier(),b=barrier({x:300});g.setup({barricades:[a,b],barrels:[]});g.p.speed=10000;g.keys.d=true;g.dash();g.update(.02);assert.ok(g.p.x>500);assert.equal(a.hp,0);assert.equal(b.hp,0);assert.equal(g.state.barricadesCleared,2);assert.equal(g.state.killCount,0);assert.equal(g.state.gems.length,0);near(g.p.hp,100);g.applyPlayerBarricades({x:0,y:0},true);assert.equal(g.state.barricadesCleared,2);
});
test('enemy bodies stop behind cover and wear it down rather than hitting the survivor through it',()=>{
  const g=loadGame();cleanRun(g);const b=barrier(),e=enemy({x:200,speed:100,hp:10000});g.p.fireClock=100;g.setup({barricades:[b],enemies:[e]});g.update(1);assert.ok(e.x>=133&&e.x<133.01);near(b.hp,66);near(g.p.hp,100);assert.equal(g.state.barricadesCleared,0);
});
test('crowd pressure has a per-frame cap and enemy destruction gives no player clear credit',()=>{
  const g=loadGame();cleanRun(g);const b=barrier();g.setup({barricades:[b]});g.updateBarricades(.1);
  for(let i=0;i<30;i++){const e=enemy({x:0});g.applyEnemyBarricades(e,{x:200,y:0},.1,false)}near(b.hp,84);near(b.pressureDamage,6);
  for(let frame=0;frame<14;frame++){g.updateBarricades(.1);for(let i=0;i<30;i++){const e=enemy({x:0});g.applyEnemyBarricades(e,{x:200,y:0},.1,false)}}assert.equal(b.hp,0);assert.equal(g.state.barricadesCleared,0);assert.equal(g.state.gems.length,0);
});
test('enemies can advance through the gap after breaking a barricade',()=>{
  const g=loadGame();cleanRun(g);const b=barrier({hp:1}),e=enemy({x:200,speed:100,hp:10000});g.p.fireClock=100;g.setup({barricades:[b],enemies:[e]});g.update(.8);assert.equal(b.hp,0);g.update(1.5);assert.ok(e.x<0);near(g.p.hp,88);assert.equal(g.state.barricadesCleared,0);
});
test('a Breaker charging through cover smashes it even on the final charge frame',()=>{
  const g=loadGame();cleanRun(g);g.p.x=-500;g.spawnBoss('breaker');const boss=g.state.activeBoss;Object.assign(boss,{x:0,y:0,phase:'charge',phaseTime:g.tuning.chargeTime,chargeX:1,chargeY:0,chargeLength:360});const b=barrier();g.setup({barricades:[b],barrels:[]});g.update(.5);assert.equal(b.hp,0);near(boss.x,360);assert.equal(boss.phase,'recover');assert.equal(g.state.barricadesCleared,0);
});
test('a walking Warden is physically blocked and can damage a barricade by pushing',()=>{
  const g=loadGame();cleanRun(g);const b=barrier(),e=enemy({x:50,r:34,dmg:25,type:3,bossKind:'warden'});g.setup({barricades:[b]});g.applyEnemyBarricades(e,{x:200,y:0},.1,false);assert.ok(e.x>=152&&e.x<152.01);near(b.hp,85);
});
test('player bullets resolve enemies before cover in travel order and stop at cover even when piercing',()=>{
  const g=loadGame();cleanRun(g);const b=barrier(),front=enemy({x:50,r:10,hp:100}),back=enemy({x:160,r:10,hp:100});g.setup({barricades:[b],enemies:[back,front],bullets:[{...bullet(),x:0,vx:1000,dmg:22.5,remainingHits:8,rail:true}]});g.updateProjectiles(.2);near(front.hp,77.5);near(back.hp,100);near(b.hp,67.5);assert.equal(g.state.bullets.length,0);assert.equal(g.state.killCount,0);
});
test('gunfire breaks cover once, stops on the breaking hit, and creates no XP',()=>{
  const g=loadGame();cleanRun(g);const b=barrier(),e=enemy({x:160,hp:100});g.setup({barricades:[b],enemies:[e]});
  for(let i=0;i<5;i++){g.setup({bullets:[{...bullet(),x:0,vx:1000}]});g.updateProjectiles(.2)}assert.equal(b.hp,0);assert.equal(g.state.barricadesCleared,1);near(e.hp,100);assert.equal(g.state.gems.length,0);
  g.setup({bullets:[{...bullet(),x:0,vx:1000}]});g.updateProjectiles(.2);near(e.hp,82);assert.equal(g.state.barricadesCleared,1);
});
test('expired player shots cannot damage a barricade beyond their remaining travel distance',()=>{
  const g=loadGame();cleanRun(g);const b=barrier();g.setup({barricades:[b],bullets:[{...bullet(),x:0,vx:1000,life:.01}]});g.updateProjectiles(1);near(b.hp,90);assert.equal(g.state.bullets.length,0);
});
test('both pink and blue shots hit and damage cover before reaching the survivor',()=>{
  const g=loadGame();cleanRun(g);const b=barrier();g.setup({barricades:[b],hostileShots:[hostileShot({x:200,vx:-1000}),hostileShot({x:200,vx:-1000,dmg:12,kind:'warden'})]});g.updateHostileShots(.2,{x:0,y:0});near(g.p.hp,100);near(b.hp,68);assert.equal(g.state.hostileShots.length,0);assert.equal(g.state.barricadesCleared,0);
});
test('a barricade behind the survivor cannot absorb a shot that reaches the body first',()=>{
  const g=loadGame();cleanRun(g);const b=barrier({x:-100});g.setup({barricades:[b],hostileShots:[hostileShot({x:100,vx:-1000})]});g.updateHostileShots(.2,{x:0,y:0});near(g.p.hp,90);near(b.hp,90);assert.equal(g.state.hostileShots.length,0);
});
test('barrel blasts clear only nearby barricades and credit each object once without kill XP',()=>{
  const g=loadGame();cleanRun(g);const b=barrier(),far=barrier({x:400}),fuel={x:0,y:0,r:17,spent:false};g.setup({barricades:[b,far],barrels:[fuel]});g.detonateBarrel(fuel);assert.equal(b.hp,0);near(far.hp,90);assert.equal(g.state.barricadesCleared,1);assert.equal(g.state.barrelsBlown,1);assert.equal(g.state.blastKills,0);assert.equal(g.state.gems.length,0);g.detonateBarrel(fuel);assert.equal(g.state.barricadesCleared,1);
});
test('extraction reveal clears its landing space without granting automatic player credit',()=>{
  const g=loadGame();cleanRun(g);g.scheduleRush(Infinity);const near=barrier({x:100,y:-110,w:130,h:18}),far=barrier({x:800,y:800});g.setup({elapsed:180,bossesDefeated:1,nextBossAt:1000,barricades:[near,far]});g.updateExtractionWindow();assert.ok(g.state.exitBeacon);assert.equal(g.state.barricades.length,1);assert.equal(g.state.barricades[0],far);assert.equal(g.state.barricadesCleared,0);
});
test('choosing Stay clears nearby barricades so return protection cannot leave the survivor trapped',()=>{
  const g=loadGame();prepareExit(g);reachExit(g);const closeBarrier=barrier({x:g.p.x+50,y:g.p.y-50}),far=barrier({x:g.p.x+500,y:g.p.y-50});g.setup({barricades:[closeBarrier,far]});chooseExitForTest(g,'stay');assert.equal(closeBarrier.hp,0);assert.equal(far.hp,90);assert.equal(g.state.barricadesCleared,1);near(g.p.inv,1.5);assert.equal(g.state.gems.length,0);
});
test('medical and salvage placement keep their collection and hold areas away from solid cover',()=>{
  const g=loadGame();cleanRun(g);const b=barrier({x:-65,y:150,w:130,h:18});g.setup({barricades:[b],barrels:[],obstacles:[]});assert.ok(g.placeSupply());assert.ok(g.pointRectDistance(g.state.supplyCache,b)>=g.state.supplyCache.r+25);assert.ok(g.placeSalvage());assert.ok(g.pointRectDistance(g.state.salvage,b)>=g.state.salvage.r+20);
});
test('new barricades respect open areas, the five-object budget, and distant cleanup',()=>{
  const g=loadGame();cleanRun(g);const e=enemy({x:250,y:0}),med={x:0,y:-250,r:19,until:999},zone={x:-250,y:0,r:80,until:999,progress:0};g.setup({barrels:[],obstacles:[],enemies:[e],supplyCache:med,salvage:zone});assert.ok(g.placeBarricade());const b=g.state.barricades[0];assert.ok(g.pointRectDistance(g.p,b)>=180);assert.ok(g.pointRectDistance(e,b)>=e.r+15);assert.ok(g.pointRectDistance(med,b)>=med.r+30);assert.ok(g.pointRectDistance(zone,b)>=zone.r+30);
  g.setup({barricades:Array.from({length:5},(_,i)=>barrier({x:300+i*250,y:300}))});assert.equal(g.placeBarricade(),false);g.p.x=-5000;g.updateBarricades(.02);assert.equal(g.state.barricades.length,0);assert.equal(g.state.barricadesCleared,0);
});
test('barricade HP, replacement timer, and movement freeze under paused and choice modes',()=>{
  for(const target of ['paused','upgrade','extraction','end']){
    const g=loadGame();if(target==='extraction')prepareExit(g);else cleanRun(g);const b=barrier();g.setup({barricades:[b],barricadeClock:10});
    if(target==='paused')g.pause();if(target==='upgrade'){g.setup({xp:8});g.checkLevelUp()}if(target==='extraction')reachExit(g);if(target==='end'){g.pause();quitForTest(g)}
    g.update(100);g.updateBarricades(100);near(b.hp,90);near(g.state.barricadeClock,10);assert.equal(g.state.barricades.length,1);
  }
});
test('player barricade clears appear in fixed results/history and retry seeds fresh intact cover',()=>{
  const g=loadGame();cleanRun(g);const b=barrier();g.setup({barricades:[b]});g.damageBarricade(b,90,'dash');g.pause();quitForTest(g);assert.equal(g.state.runResult.barricades,1);assert.match(g.el('modal').innerHTML,/<strong>1<\/strong><small>BARRICADES CLEARED/);const next=loadGame({journalStored:g.journalSaved()});next.showJournal();assert.match(next.el('modal').innerHTML,/1 barricades cleared/);g.el('again').click();assert.equal(g.state.barricadesCleared,0);assert.equal(g.state.barricades.length,2);assert.ok(g.state.barricades.every(b=>b.hp===90));near(g.state.barricadeClock,18);
});
test('old or untrusted barricade history cannot create clears or grant combat rewards',()=>{
  const g=loadGame({journalStored:journalData('survivor',{history:[{outcome:'extracted',time:181},{outcome:'defeated',time:1,barricades:'<img>'},{outcome:'abandoned',time:2,barricades:-5}]})});assert.equal(g.state.journal.history[0].barricades,null);assert.equal(g.state.journal.history[1].barricades,null);assert.equal(g.state.journal.history[2].barricades,0);g.showJournal();assert.doesNotMatch(g.el('modal').innerHTML,/<img/);assert.equal(g.state.barricadesCleared,0);assert.equal(g.state.bonusChoices,0);
});
test('rounded solid-body resolution stays finite and nonpenetrating across faces, corners, and initial overlaps',()=>{
  const g=loadGame();cleanRun(g);const b=barrier();g.setup({barricades:[b]});
  for(const x of [0,50,84,134,200])for(const y of [-100,-66,0,66,100]){
    const from={x,y};if(g.pointRectDistance(from,b)<16-.001)continue;
    for(const tx of [-200,0,84,134,300])for(const ty of [-200,-60,0,60,200]){const body={x:tx,y:ty,r:16};g.resolveBarricadeBody(body,from);assert.ok(Number.isFinite(body.x)&&Number.isFinite(body.y));assert.ok(g.pointRectDistance(body,b)>=15.998,`${x},${y} -> ${tx},${ty} ended ${body.x},${body.y}`)}
  }
  const embedded={x:109,y:0,r:16};g.resolveBarricadeBody(embedded,{x:109,y:0});assert.ok(g.pointRectDistance(embedded,b)>=16);
});
test('one minute of combat with dashing and live barricades preserves movement and entity budgets',()=>{
  const g=loadGame();g.start();Object.assign(g.p,{inv:999,pierce:3,arc:3,blades:3,rail:true,thunder:true,reaper:true});
  for(let i=0;i<3600;i++){
    while(g.state.mode==='upgrade')g.choose(0);g.touch.x=Math.cos(i/80);g.touch.y=Math.sin(i/80);if(i%120===0)g.dash();g.update(1/60);
    assert.ok(Number.isFinite(g.p.x)&&Number.isFinite(g.p.y)&&Number.isFinite(g.p.hp));assert.ok(g.state.barricades.filter(b=>b.hp>0).length<=g.barricadeTuning.max);for(const b of g.state.barricades)if(b.hp>0)assert.ok(g.pointRectDistance(g.p,b)>=g.p.r-.01);assert.ok(g.state.enemies.length<=240);assert.ok(g.state.particles.length<=g.limits.particles);assert.ok(g.state.bullets.length<=g.limits.bullets);assert.ok(g.state.hostileShots.length<=g.limits.hostileShots);if(i%180===0)g.render();
  }
});


function startContract(g,id){g.showRoster();g.selectContract(id);cleanRun(g)}
test('contracts are optional, default to none, and do not alter survivor combat stats',()=>{
  const g=loadGame();g.showRoster();assert.equal(g.el('contractPick').value,'none');assert.match(g.el('contractDetail').textContent,/Optional/);g.el('deploy').click();
  assert.equal(g.state.runContract,'none');assert.equal(g.el('contractGoal').textContent,'');near(g.p.hp,100);near(g.p.speed,210);near(g.p.damage,18);
  g.setup({barrelsBlown:100,bossesDefeated:20});g.checkLevelUp();assert.equal(g.state.mode,'play');assert.equal(g.state.bonusChoices,0);assert.equal(g.state.contractCompleted,false);
});
test('native contract selection updates its goal and reward and survives survivor selection',()=>{
  const g=loadGame();g.showRoster();const picker=g.el('contractPick');picker.value='salvage';picker.dispatch('change');
  assert.equal(g.state.selectedContract,'salvage');assert.match(g.el('contractDetail').textContent,/Secure 2 salvage holdouts.*one bonus upgrade.*No time limit or penalty/);
  g.selectSurvivor('scout');assert.equal(g.el('contractPick').value,'salvage');g.el('deploy').click();assert.equal(g.state.runContract,'salvage');near(g.p.hp,85);
  g.updateEncounterHUD();assert.equal(g.el('contractGoal').textContent,'CONTRACT • HOLDOUTS 0/2');
});
test('contracts reject unknown choices, mid-run changes, and stale native change events',()=>{
  const g=loadGame();g.showRoster();g.selectContract('demolition');g.selectContract('<img>');assert.equal(g.state.selectedContract,'demolition');const old=g.el('contractPick');g.el('deploy').click();
  g.selectContract('bosses');assert.equal(g.state.runContract,'demolition');assert.equal(g.state.selectedContract,'demolition');g.pause();g.selectContract('none');assert.equal(g.state.selectedContract,'demolition');quitForTest(g);g.showRoster();
  old.value='bosses';old.dispatch('change');assert.equal(g.state.selectedContract,'demolition');assert.doesNotMatch(g.el('modal').innerHTML,/RUN CONTRACT · Demolition Detail · 0\/3/);
});
test('three actual fuel barrels complete Demolition once without contract healing or XP spending',()=>{
  const g=loadGame();startContract(g,'demolition');g.p.hp=70;g.setup({xp:7});
  const fuel=[{x:100,y:0,r:17,spent:false},{x:140,y:0,r:17,spent:false},{x:180,y:0,r:17,spent:false}];g.setup({barrels:fuel});g.detonateBarrel(fuel[0]);g.update(.02);
  assert.equal(g.state.barrelsBlown,3);assert.equal(g.state.contractCompleted,true);assert.equal(g.state.mode,'upgrade');assert.match(g.el('modal').innerHTML,/CONTRACT COMPLETE · BONUS UPGRADE/);near(g.p.hp,70);assert.equal(g.state.xp,7);
  assert.equal(g.contractProgress(),3);g.checkContract();g.checkLevelUp();assert.equal(g.state.bonusChoices,0);g.choose(0);g.update(.02);assert.equal(g.state.mode,'play');assert.equal(g.state.bonusChoices,0);g.updateEncounterHUD();assert.equal(g.el('contractGoal').textContent,'CONTRACT ✓ BARRELS 3/3 DONE');
});
test('two actual holdouts queue their salvage reward before the Salvage Runner contract',()=>{
  const g=loadGame();startContract(g,'salvage');g.scheduleRush(Infinity);g.setup({elapsed:15,obstacles:[],barrels:[],nextBossAt:1000,xp:7});
  for(let i=0;i<2;i++){
    assert.ok(g.placeSalvage());const b=enterSalvage(g);b.progress=5.99;g.update(.02);assert.equal(g.state.salvagesSecured,i+1);assert.match(g.el('modal').innerHTML,/SALVAGE SECURED · BONUS UPGRADE/);
    assert.equal(g.state.contractCompleted,i===1);g.choose(0);
    if(i===0)assert.equal(g.state.mode,'play');else{assert.match(g.el('modal').innerHTML,/CONTRACT COMPLETE · BONUS UPGRADE/);assert.equal(g.state.xp,7);g.choose(0)}
  }
  assert.equal(g.state.mode,'play');assert.equal(g.state.bonusChoices,0);assert.equal(g.contractProgress(),2);
});
test('Night Watch counts one Breaker and one Warden and not ordinary enemies',()=>{
  const g=loadGame();startContract(g,'bosses');g.hitEnemy(enemy(),20);g.checkLevelUp();assert.equal(g.contractProgress(),0);
  for(const kind of ['breaker','warden']){
    g.spawnBoss(kind);g.hitEnemy(g.state.activeBoss,1e9);g.checkLevelUp();assert.equal(g.contractProgress(),kind==='breaker'?1:2);
    if(kind==='breaker')assert.equal(g.state.mode,'play');else{assert.equal(g.state.mode,'upgrade');assert.match(g.el('modal').innerHTML,/CONTRACT COMPLETE/)}
  }
  assert.equal(g.state.contractCompleted,true);assert.equal(g.state.bossesDefeated,2);assert.equal(g.state.wardensDefeated,1);
});
test('Blackout, contract, and earned XP choices keep distinct labels and each pays once',()=>{
  const g=loadGame();startContract(g,'demolition');g.setup({barrelsBlown:3,bonusChoices:1,xp:8});g.state.bonusKinds.push('blackout');g.checkLevelUp();
  assert.match(g.el('modal').innerHTML,/BLACKOUT SURVIVED/);assert.equal(g.state.xp,8);g.choose(0);assert.match(g.el('modal').innerHTML,/CONTRACT COMPLETE/);assert.equal(g.state.xp,8);g.choose(0);
  assert.doesNotMatch(g.el('modal').innerHTML,/BLACKOUT SURVIVED|CONTRACT COMPLETE/);assert.equal(g.state.xp,0);g.choose(0);assert.equal(g.state.mode,'play');assert.equal(g.state.bonusChoices,0);assert.equal(g.state.bonusKinds.length,0);
});
test('a contract bonus can evolve a ready weapon and stale choices cannot repeat its reward',()=>{
  const g=loadGame();startContract(g,'demolition');g.p.pierce=3;g.setup({level:4,barrelsBlown:3,xp:3});g.checkLevelUp();const index=choiceLabels(g).indexOf('Evolve: Railstorm'),old=g.choices()[index];assert.ok(index>=0);g.choose(index);
  assert.equal(g.p.rail,true);assert.equal(g.state.xp,3);assert.equal(g.state.mode,'play');old.onclick();g.checkLevelUp();assert.equal(g.state.mode,'play');assert.equal(g.state.bonusChoices,0);assert.equal(g.state.contractCompleted,true);
});
test('lethal damage before contract resolution prevents a same-frame reward',()=>{
  const g=loadGame();startContract(g,'demolition');g.p.hp=1;g.p.fireClock=999;g.setup({barrelsBlown:3,enemies:[enemy({x:0,y:0,hp:1000})]});g.update(.02);
  assert.equal(g.state.mode,'end');assert.equal(g.state.contractCompleted,false);assert.equal(g.state.bonusChoices,0);assert.equal(g.state.runResult.contractCompleted,false);assert.equal(g.state.runResult.contractProgress,3);
});
test('pause, choices, extraction, and finished results cannot resolve a contract',()=>{
  for(const target of ['pause','upgrade','extraction','end']){
    const g=loadGame();startContract(g,'demolition');if(target==='extraction'){prepareExit(g);reachExit(g)}if(target==='pause')g.pause();if(target==='upgrade'){g.setup({xp:8});g.checkLevelUp()}if(target==='end'){g.pause();quitForTest(g)}
    g.setup({barrelsBlown:3});const mode=g.state.mode,elapsed=g.state.elapsed;g.update(100);g.checkContract();g.checkLevelUp();assert.equal(g.state.mode,mode);near(g.state.elapsed,elapsed);assert.equal(g.state.contractCompleted,false);assert.equal(g.state.bonusChoices,0);
  }
});
test('pause shows exact contract progress, with no deadline or combat change on resume',()=>{
  const g=loadGame();startContract(g,'demolition');g.setup({barrelsBlown:2});g.pause();assert.match(g.el('modal').innerHTML,/RUN CONTRACT · Demolition Detail · 2\/3/);const hp=g.p.hp;g.resume();g.update(.02);near(g.p.hp,hp);assert.equal(g.contractProgress(),2);assert.equal(g.state.mode,'play');
});
test('a contract remains active across Stay and can complete in overtime',()=>{
  const g=loadGame();startContract(g,'bosses');prepareExit(g);assert.equal(g.contractProgress(),1);reachExit(g);chooseExitForTest(g,'stay');assert.equal(g.state.runContract,'bosses');assert.equal(g.state.contractCompleted,false);
  g.spawnBoss('warden');g.hitEnemy(g.state.activeBoss,1e9);g.checkLevelUp();assert.equal(g.state.contractCompleted,true);assert.match(g.el('modal').innerHTML,/CONTRACT COMPLETE/);assert.equal(g.state.overtime,1);
});
test('fixed results and journal reload retain completed and incomplete contracts without granting new-run stats',()=>{
  const g=loadGame();startContract(g,'demolition');g.setup({barrelsBlown:3});g.checkLevelUp();g.choose(0);g.pause();quitForTest(g);const result=g.state.runResult,sheet=g.el('modal').innerHTML;
  assert.equal(result.contract,'demolition');assert.equal(result.contractCompleted,true);assert.match(sheet,/RUN CONTRACT · Demolition Detail · 3\/3 · COMPLETED/);g.setup({barrelsBlown:0});g.update(100);assert.equal(g.state.runResult,result);assert.equal(g.el('modal').innerHTML,sheet);
  const next=loadGame({journalStored:g.journalSaved()});next.showJournal();assert.match(next.el('modal').innerHTML,/Demolition Detail · 3\/3 · COMPLETED/);next.el('journalBack').click();cleanRun(next);assert.equal(next.state.runContract,'none');near(next.p.damage,18);assert.equal(next.state.bonusChoices,0);
  next.pause();quitForTest(next);next.showRoster();next.selectContract('salvage');next.el('deploy').click();next.pause();quitForTest(next);assert.match(next.el('modal').innerHTML,/Salvage Runner · 0\/2 · Secure 2 salvage holdouts/);
});
test('retry keeps the selected contract but resets progress, completion, and bonus state',()=>{
  const g=loadGame();startContract(g,'demolition');g.setup({barrelsBlown:3});g.checkLevelUp();g.choose(0);g.pause();quitForTest(g);g.el('again').click();
  assert.equal(g.state.runContract,'demolition');assert.equal(g.contractProgress(),0);assert.equal(g.state.contractCompleted,false);assert.equal(g.state.bonusChoices,0);assert.equal(g.state.bonusKinds.length,0);assert.equal(g.el('contractGoal').textContent,'CONTRACT • BARRELS 0/3');
  g.pause();quitForTest(g);g.showRoster();g.selectContract('none');g.el('deploy').click();assert.equal(g.state.runContract,'none');assert.equal(g.el('contractGoal').textContent,'');
});
test('old and untrusted contract history is bounded, named by the game, and never supplies rewards',()=>{
  const rows=[{outcome:'extracted',time:181},{outcome:'defeated',time:10,contract:'<img>',contractProgress:999,contractCompleted:true},{outcome:'abandoned',time:10,contract:'salvage',contractProgress:'2',contractCompleted:true},{outcome:'extracted',time:181,contract:'bosses',contractProgress:1,contractCompleted:true},{outcome:'extracted',time:181,contract:'demolition',contractProgress:999,contractCompleted:'true'}];
  const g=loadGame({journalStored:journalData('survivor',{history:rows})});const saved=g.state.journal.history;assert.equal(saved[0].contract,null);assert.equal(saved[1].contract,null);assert.equal(saved[2].contractProgress,0);assert.equal(saved[2].contractCompleted,false);assert.equal(saved[3].contractCompleted,false);assert.equal(saved[4].contractProgress,3);assert.equal(saved[4].contractCompleted,false);
  g.showJournal();assert.doesNotMatch(g.el('modal').innerHTML,/<img|COMPLETED/);g.el('journalBack').click();cleanRun(g);assert.equal(g.state.bonusChoices,0);assert.equal(g.state.runContract,'none');
});
test('contracts work without storage and preserve their completed session log',()=>{
  const g=loadGame({storageBlocked:true});startContract(g,'demolition');g.setup({barrelsBlown:3});g.checkLevelUp();g.choose(0);g.pause();quitForTest(g);assert.equal(g.state.journal.history[0].contractCompleted,true);assert.equal(g.state.journal.available,false);g.showJournal();assert.match(g.el('modal').innerHTML,/Demolition Detail.*COMPLETED/);assert.match(g.el('modal').innerHTML,/lasts for this visit/);
});
test('an unfinished contract never blocks extraction or turns a victory into a failure',()=>{
  const g=loadGame();startContract(g,'bosses');prepareExit(g);reachExit(g);chooseExitForTest(g,'extract');
  assert.equal(g.state.mode,'end');assert.equal(g.state.runOutcome,'extracted');assert.equal(g.state.runResult.contractProgress,1);assert.equal(g.state.runResult.contractCompleted,false);assert.equal(g.state.bonusChoices,0);assert.match(g.el('modal').innerHTML,/Night Watch · 1\/2/);assert.match(g.el('modal').innerHTML,/EXTRACTION COMPLETE/);
});

function riot(overrides={}){return enemy({x:100,y:0,hp:100,max:100,speed:62,r:19,dmg:12,col:'#90a7b4',type:5,riot:true,phase:'approach',phaseTime:0,cooldown:1.2,facing:Math.PI,...overrides})}
function prepareRiot(g){cleanRun(g);g.scheduleRush(Infinity);g.setup({elapsed:110,nextRiotAt:110,nextBossAt:1000,exitAt:1000,obstacles:[],barrels:[]})}
test('Riot Guards first opportunity is 02:30, cap at two alive, and leave a boss slot',()=>{
  const g=loadGame();g.start();assert.equal(g.state.nextRiotAt,150);prepareRiot(g);g.setup({elapsed:149.99,nextRiotAt:150});g.updateRiotSchedule();assert.equal(g.state.enemies.length,0);g.setup({elapsed:150});g.updateRiotSchedule();const e=g.state.enemies[0];
  assert.equal(e.riot,true);near(e.hp,55*1.75);near(e.speed,62);assert.equal(e.r,19);near(g.state.nextRiotAt,190);assert.equal(g.state.riotIntroduced,true);
  g.setup({elapsed:190});g.updateRiotSchedule();assert.equal(g.state.enemies.filter(e=>e.riot).length,2);g.setup({elapsed:230});g.updateRiotSchedule();assert.equal(g.state.enemies.length,2);near(g.state.nextRiotAt,233);
  g.setup({elapsed:233,enemies:Array.from({length:239},()=>enemy({hp:1000}))});g.updateRiotSchedule();assert.equal(g.state.enemies.length,239);g.spawnBoss();assert.equal(g.state.enemies.length,240);
});
test('new Guards defer during encounters, salvage, relief, open exits, and paused play',()=>{
  for(const reason of ['boss','bossSoon','rush','rushWarning','salvage','relief','exit','pause']){
    const g=loadGame();prepareRiot(g);
    if(reason==='boss')g.spawnBoss();if(reason==='bossSoon')g.setup({nextBossAt:120});if(reason==='rush'){g.scheduleRush(110);g.updateRush(.01)}if(reason==='rushWarning'){g.scheduleRush(115);g.updateRush(.01)}if(reason==='salvage')g.placeSalvage();if(reason==='relief')g.setup({reliefUntil:115});if(reason==='exit'){g.setup({exitAt:110,bossesDefeated:1});g.updateExtractionWindow()}if(reason==='pause')g.pause();
    g.updateRiotSchedule();assert.equal(g.state.enemies.some(e=>e.riot),false,reason);
  }
});
test('Guard facing turns slowly across angle wrap so flanking remains possible',()=>{
  const g=loadGame();cleanRun(g);const e=riot({x:100,facing:0});g.moveRiot(e,.1);near(Math.abs(e.facing),.14);assert.ok(e.x>100);
  const wrapped=riot({x:100,y:1,facing:-Math.PI+.01});g.moveRiot(wrapped,.02);assert.ok(Math.abs(wrapped.facing+Math.PI)<.05);assert.ok(Number.isFinite(wrapped.x)&&Number.isFinite(wrapped.y));
});
test('Guard warnings lock their facing and cancel if they become offscreen',()=>{
  const g=loadGame();cleanRun(g);const e=riot({cooldown:0});g.moveRiot(e,.001);assert.equal(e.phase,'warn');near(e.phaseTime,.9);const facing=e.facing;
  g.p.y=100;g.moveRiot(e,.2);near(e.facing,facing);assert.equal(e.phase,'warn');g.setup({enemies:[e]});g.render();g.p.x=1000;g.moveRiot(e,.02);assert.equal(e.phase,'approach');near(e.cooldown,1);
});
test('Guard bash travels only ninety units then leaves a full 2.2-second gun opening',()=>{
  const g=loadGame();cleanRun(g);const e=riot({x:100,phase:'bash',phaseTime:.24});g.moveRiot(e,.1);g.moveRiot(e,1);near(e.x,10);near(e.y,0);assert.equal(e.phase,'recover');near(e.phaseTime,2.2);assert.equal(g.riotShieldUp(e),false);
  g.moveRiot(e,2.19);assert.equal(e.phase,'recover');g.moveRiot(e,.02);assert.equal(e.phase,'approach');near(e.cooldown,1.8);assert.equal(g.riotShieldUp(e),true);
});
test('Bulwark can dodge a warned Guard bash after a quarter-second reaction delay without dashing',()=>{
  const g=loadGame();g.showRoster();g.selectSurvivor('bulwark');cleanRun(g);g.p.fireClock=999;const e=riot({cooldown:0,hp:10000,max:10000});g.setup({enemies:[e]});g.update(.02);assert.equal(e.phase,'warn');
  for(let i=0;i<60;i++){if(i===13)g.keys.s=true;g.update(.02)}near(g.p.hp,140);near(g.p.inv,0);assert.equal(e.phase,'recover');
});
test('the physical shield arc blocks front shots and its round ends while permitting clear side and rear hits',()=>{
  const g=loadGame();cleanRun(g);const e=riot({x:0,y:0,facing:0});
  for(const degrees of [-180,-120,-90,-60,-30,0,30,60,90,120,180]){
    const a=degrees*Math.PI/180,from={x:Math.cos(a)*100,y:Math.sin(a)*100},to={x:-Math.cos(a)*100,y:-Math.sin(a)*100};
    assert.equal(g.riotShotImpact(e,from,to,4).shield,Math.abs(degrees)<=60,`source angle ${degrees}`);
  }
  assert.equal(g.riotShieldHitTime(e,{x:25,y:0},{x:25,y:0},4),0);assert.equal(g.riotShieldHitTime(e,{x:0,y:0},{x:0,y:0},4),Infinity);
  e.phase='recover';assert.equal(g.riotShotImpact(e,{x:100,y:0},{x:-100,y:0},4).shield,false);e.phase='warn';e.salvageStunUntil=2;assert.equal(g.riotShotImpact(e,{x:100,y:0},{x:-100,y:0},4).shield,false);
});
test('frontal blocks stop piercing and Railstorm shots without damage or rewards behind the Guard',()=>{
  for(const evolved of [false,true]){
    const g=loadGame();cleanRun(g);const guard=riot(),behind=enemy({x:160,hp:100}),before=enemy({x:40,hp:10});g.setup({enemies:[behind,guard,before],bullets:[{x:0,y:0,vx:1000,vy:0,r:4,life:1,dmg:18,remainingHits:evolved?8:4,rail:evolved}]});g.updateProjectiles(.2);
    near(guard.hp,100);near(behind.hp,100);assert.ok(before.hp<=0);assert.equal(g.state.bullets.length,0);assert.equal(g.state.killCount,1);assert.equal(g.state.riotsDefeated,0);assert.equal(g.state.gems.length,1);assert.ok(guard.shieldHitUntil>g.state.elapsed);
  }
});
test('side, rear, and recovery gun hits deal full normal damage',()=>{
  for(const side of ['side','rear','recovery']){
    const g=loadGame();cleanRun(g);const guard=riot({phase:side==='recovery'?'recover':'approach'}),b=side==='side'?{x:100,y:-100,vx:0,vy:1000}:side==='rear'?{x:200,y:0,vx:-1000,vy:0}:{x:0,y:0,vx:1000,vy:0};
    g.setup({enemies:[guard],bullets:[{...b,r:4,life:1,dmg:18}]});g.updateProjectiles(.2);near(guard.hp,82);assert.equal(g.state.bullets.length,0);
  }
});
test('barricade and Guard shield collisions retain earliest-impact order',()=>{
  for(const woodFirst of [false,true]){
    const g=loadGame();cleanRun(g);const guard=riot(),wood=barrier({x:woodFirst?40:145});g.setup({enemies:[guard],barricades:[wood],bullets:[{x:0,y:0,vx:1000,vy:0,r:4,life:1,dmg:18,remainingHits:8,rail:true}]});g.updateProjectiles(.2);
    near(guard.hp,100);near(wood.hp,woodFirst?72:90);assert.equal(g.state.bullets.length,0);
  }
});
test('base gunfire can defeat the first Guard during one recovery opening',()=>{
  const g=loadGame();cleanRun(g);const e=riot({hp:55*1.55,max:55*1.55,phase:'recover',phaseTime:2.2});g.setup({enemies:[e]});
  for(let i=0;i<105&&e.hp>0;i++)g.update(.02);assert.ok(e.hp<=0);near(g.p.hp,100);assert.equal(g.state.riotsDefeated,1);assert.equal(g.state.killCount,1);assert.equal(g.state.gems[0].value,3);
});
test('lightning, blades, and fuel ignore the shield and preserve normal kill rewards',()=>{
  const lightning=loadGame();cleanRun(lightning);const a=riot();lightning.setup({enemies:[a]});lightning.p.arc=1;lightning.fireLightning();near(a.hp,100-18*.8);
  const blades=loadGame();cleanRun(blades);const b=riot({x:78});blades.setup({enemies:[b]});blades.p.blades=1;blades.updateWeapons(0,{x:0,y:0});near(b.hp,100-18*1.1);
  const fuel=loadGame();cleanRun(fuel);const c=riot({hp:100});fuel.setup({enemies:[c],barrels:[{x:100,y:0,r:17,spent:false}]});fuel.detonateBarrel(fuel.state.barrels[0]);fuel.hitEnemy(c,1000);assert.equal(fuel.state.riotsDefeated,1);assert.equal(fuel.state.killCount,1);assert.equal(fuel.state.blastKills,1);assert.equal(fuel.state.gems.length,1);assert.equal(fuel.state.gems[0].value,3);
});
test('Guard shield block effects stay within existing particle and text budgets under rapid multishot',()=>{
  const g=loadGame();cleanRun(g);const e=riot();g.setup({enemies:[e],bullets:Array.from({length:100},()=>({x:0,y:0,vx:1000,vy:0,r:4,life:1,dmg:18,remainingHits:8}))});g.updateProjectiles(.2);
  near(e.hp,100);assert.equal(g.state.bullets.length,0);assert.ok(g.state.particles.length<=g.limits.particles);assert.equal(g.state.texts.filter(t=>t.t==='BLOCK').length,1);
});
test('all paused modes freeze Guard facing, attack phase, and the spawn schedule',()=>{
  for(const target of ['pause','upgrade','extraction','end']){
    const g=loadGame();if(target==='extraction')prepareExit(g);else cleanRun(g);const e=riot({phase:'warn',phaseTime:.6});g.setup({enemies:[e],nextRiotAt:110});
    if(target==='pause')g.pause();if(target==='upgrade'){g.setup({xp:8});g.checkLevelUp()}if(target==='extraction')reachExit(g);if(target==='end'){g.pause();quitForTest(g)}
    const elapsed=g.state.elapsed,x=e.x,facing=e.facing;g.update(100);g.moveRiot(e,100);g.updateRiotSchedule();near(e.x,x);near(e.phaseTime,.6);near(e.facing,facing);near(g.state.elapsed,elapsed);near(g.state.nextRiotAt,110);
  }
});
test('salvage entry still pushes and stuns Guards and their shields open during the stun',()=>{
  const g=loadGame();prepareSalvage(g);const zone=enterSalvage(g);zone.entered=false;const e=riot({x:g.p.x+30,y:g.p.y,phase:'warn',phaseTime:.1});g.setup({enemies:[e]});g.p.fireClock=999;g.update(.02);
  assert.equal(zone.entered,true);assert.ok(Math.hypot(e.x-g.p.x,e.y-g.p.y)>260);assert.equal(g.riotShieldUp(e),false);near(e.salvageStunUntil,g.state.elapsed+2);near(g.p.hp,100);assert.equal(g.state.riotsDefeated,0);
  const x=e.x;g.moveRiot(e,1);near(e.x,x);near(e.phaseTime,.1);
});
test('Guard bashes respect solid barricades and cannot use the Breaker smash rule',()=>{
  const g=loadGame();cleanRun(g);const e=riot({x:40,phase:'bash',phaseTime:.24,facing:0}),wood=barrier({x:70});g.setup({enemies:[e],barricades:[wood]});g.p.x=400;g.p.fireClock=999;g.update(.24);
  assert.ok(e.x<=70-e.r+.01);assert.ok(wood.hp>0);assert.equal(g.state.barricadesCleared,0);assert.equal(e.phase,'recover');
});
test('Stay clears nearby Guards through their shields without adding boss contract progress',()=>{
  const g=loadGame();startContract(g,'bosses');prepareExit(g);reachExit(g);const close=riot({x:g.p.x,y:g.p.y}),far=riot({x:g.p.x+500,y:g.p.y,phase:'warn',phaseTime:.01});g.setup({enemies:[close,far]});chooseExitForTest(g,'stay');
  assert.ok(close.hp<=0);assert.ok(far.hp>0);assert.equal(g.state.riotsDefeated,1);assert.equal(g.state.bossesDefeated,1);assert.equal(g.contractProgress(),1);assert.equal(g.state.contractCompleted,false);near(g.p.inv,1.5);
});
test('Guard statistics remain on held results and local history and reset on retry',()=>{
  const g=loadGame();cleanRun(g);const e=riot({hp:10});g.hitEnemy(e,10);g.pause();quitForTest(g);const result=g.state.runResult;assert.equal(result.riotGuards,1);assert.match(g.el('modal').innerHTML,/<strong>1<\/strong><small>RIOT GUARDS/);
  const next=loadGame({journalStored:g.journalSaved()});next.showJournal();assert.match(next.el('modal').innerHTML,/1 Riot Guards defeated/);g.el('again').click();assert.equal(g.state.riotsDefeated,0);near(g.state.nextRiotAt,150);assert.equal(g.state.riotIntroduced,false);assert.equal(result.riotGuards,1);
});
test('old or malformed saved Guard fields cannot fabricate enemies, rewards, or HTML',()=>{
  const g=loadGame({journalStored:journalData('survivor',{history:[{outcome:'extracted',time:181},{outcome:'defeated',time:10,riotGuards:'<img>'},{outcome:'abandoned',time:10,riotGuards:-5}]})});assert.equal(g.state.journal.history[0].riotGuards,null);assert.equal(g.state.journal.history[1].riotGuards,null);assert.equal(g.state.journal.history[2].riotGuards,0);g.showJournal();assert.doesNotMatch(g.el('modal').innerHTML,/<img/);g.el('journalBack').click();cleanRun(g);assert.equal(g.state.enemies.length,0);assert.equal(g.state.riotsDefeated,0);assert.equal(g.state.bonusChoices,0);
});
test('a minute of live combat with Guards respects encounter and effect budgets',()=>{
  const g=loadGame();g.start();g.scheduleRush(Infinity);g.setup({elapsed:110,nextBossAt:1000,exitAt:1000,nextSalvageAt:Infinity});Object.assign(g.p,{inv:999,arc:3,blades:3,pierce:3});const seen=new Set();
  for(let i=0;i<1800;i++){
    while(g.state.mode==='upgrade')g.choose(0);g.touch.x=Math.cos(i/100)*.7;g.touch.y=Math.sin(i/100)*.7;g.update(1/30);for(const e of g.state.enemies)if(e.riot)seen.add(e);
    assert.ok(g.state.enemies.filter(e=>e.riot&&e.hp>0).length<=2);assert.ok(g.state.enemies.length<=240);assert.ok(g.state.bullets.length<=g.limits.bullets);assert.ok(g.state.hostileShots.length<=g.limits.hostileShots);assert.ok(g.state.particles.length<=g.limits.particles);assert.ok(g.state.texts.length<=g.limits.texts);assert.ok(Number.isFinite(g.p.x)&&Number.isFinite(g.p.y));if(i%180===0)g.render();
  }
  assert.ok(seen.size>=1);assert.equal(g.state.riotIntroduced,true);
});

test('rapid five-shot Railstorm cannot damage a raised frontal shield through real combat updates',()=>{
  const g=loadGame();cleanRun(g);Object.assign(g.p,{damage:191,fire:.075,proj:5,pierce:3,rail:true});const e=riot({x:150,hp:85.25,max:85.25,speed:0,cooldown:999});g.setup({enemies:[e]});
  for(let i=0;i<180;i++)g.update(1/60);
  near(e.hp,85.25);assert.equal(g.riotShieldUp(e),true);assert.equal(g.state.riotsDefeated,0);assert.equal(g.state.killCount,0);near(g.p.hp,100);assert.ok(g.state.texts.some(t=>t.t==='BLOCK'));
});
test('a combined build can kill a shielded frontal Guard with lightning or blades while gunfire remains blocked',()=>{
  for(const weapon of ['lightning','blades']){
    const g=loadGame();cleanRun(g);Object.assign(g.p,{damage:191,fire:.075,proj:5,pierce:3,rail:true});
    if(weapon==='lightning')Object.assign(g.p,{arc:3,thunder:true});else Object.assign(g.p,{blades:3,reaper:true});
    const e=riot({x:weapon==='lightning'?150:100,hp:85.25,max:85.25,speed:0,cooldown:999});g.setup({enemies:[e]});
    for(let i=0;i<30&&e.hp>0;i++)g.update(1/60);
    assert.ok(e.hp<=0);assert.equal(g.riotShieldUp(e),true);assert.equal(g.state.riotsDefeated,1);assert.equal(g.state.killCount,1);assert.equal(g.state.gems.length,1);assert.equal(g.state.gems[0].value,3);
    assert.ok(g.state.texts.some(t=>String(t.t).startsWith(weapon==='lightning'?'LIGHTNING ':'BLADES ')));
  }
});
test('glancing normal gunfire cannot cross the visible front shield arc',()=>{
  for(const degrees of [-60,-55,-52,52,55,60]){
    const g=loadGame();cleanRun(g);const e=riot({x:150,facing:Math.PI+degrees*Math.PI/180}),angle=degrees<0?.15:-.15;
    g.setup({enemies:[e],bullets:[{x:0,y:0,vx:600*Math.cos(angle),vy:600*Math.sin(angle),r:4,life:1,dmg:18}]});g.updateProjectiles(.4);
    near(e.hp,100);assert.equal(g.state.bullets.length,0);assert.equal(g.state.killCount,0);
  }
});
test('the recovery-to-raised frame cannot show a gold shield after taking a front bullet',()=>{
  const g=loadGame();cleanRun(g);g.p.fireClock=999;const e=riot({phase:'recover',phaseTime:.01,speed:0});g.setup({enemies:[e],bullets:[{x:50,y:0,vx:2000,vy:0,r:4,life:1,dmg:18}]});g.update(.02);
  assert.equal(e.phase,'approach');assert.equal(g.riotShieldUp(e),true);near(e.hp,100);
});
test('shield sweeps match the drawn arc radius, stroke thickness, and round endpoint caps',()=>{
  const g=loadGame();cleanRun(g);const e=riot({x:0,y:0,facing:0}),radius=e.r+g.riotTuning.shieldOffset,pad=g.riotTuning.shieldWidth/2+4;
  near(g.riotShieldHitTime(e,{x:100,y:0},{x:-100,y:0},4),(100-radius-pad)/200);
  const cap={x:radius*Math.cos(Math.PI/3),y:radius*Math.sin(Math.PI/3)};
  near(g.riotShieldHitTime(e,{x:cap.x,y:100},{x:cap.x,y:0},4),(100-cap.y-pad)/100);
  assert.equal(g.riotShieldHitTime(e,cap,cap,4),0);assert.equal(g.riotShieldHitTime(e,{x:0,y:100},{x:0,y:-100},4),Infinity);
  assert.equal(g.riotShotImpact(e,{x:-100,y:0},{x:100,y:0},4).shield,false);assert.equal(g.riotShotImpact(e,{x:200,y:200},{x:300,y:200},4).time,Infinity);
});
test('the shield intercepts bullets before nearby targets or wood between its visible arc and body',()=>{
  for(const kind of ['enemy','wood']){
    const g=loadGame();cleanRun(g);const guard=riot(),target=enemy({x:74,r:1,hp:100}),wood=barrier({x:73,w:1});
    g.setup({enemies:kind==='enemy'?[target,guard]:[guard],barricades:kind==='wood'?[wood]:[],bullets:[{x:0,y:0,vx:1000,vy:0,r:4,life:1,dmg:18,remainingHits:8,rail:true}]});g.updateProjectiles(.2);
    near(guard.hp,100);near(target.hp,100);near(wood.hp,90);assert.equal(g.state.bullets.length,0);assert.equal(g.state.killCount,0);
  }
});
test('shield collision respects projectile lifetime and stops a whole-frame crossing at high speed',()=>{
  for(const life of [.05,.07,1]){
    const g=loadGame();cleanRun(g);const guard=riot();g.setup({enemies:[guard],bullets:[{x:0,y:0,vx:1000,vy:0,r:4,life,dmg:18,remainingHits:8,rail:true}]});g.updateProjectiles(.3);
    near(guard.hp,100);assert.equal(g.state.bullets.length,0);assert.equal(guard.shieldHitUntil!==undefined,life>=.067);assert.equal(g.state.killCount,0);
  }
});
test('a Guard turning its shield into a bullet uses the same pose for blocking and rendering',()=>{
  const g=loadGame();cleanRun(g);g.p.fireClock=999;const e=riot({x:150,facing:Math.PI+80*Math.PI/180,speed:0,cooldown:999});
  g.setup({enemies:[e],bullets:[{x:110,y:0,vx:1000,vy:0,r:4,life:1,dmg:18}]});g.update(.035);
  near(e.hp,100);assert.equal(g.riotShieldUp(e),true);assert.ok(e.shieldHitUntil>g.state.elapsed);g.render();
});
test('the earlier Guard motion pass still moves once and applies cover pressure once per frame',()=>{
  const g=loadGame();cleanRun(g);g.p.x=400;g.p.fireClock=999;const e=riot({x:40,phase:'bash',phaseTime:.24,facing:0}),wood=barrier({x:70});g.setup({enemies:[e],barricades:[wood]});g.update(.1);
  near(e.phaseTime,.14);assert.ok(e.x<=51&&e.x>50.99);near(e.riotFrom.x,40);near(wood.hp,87.6);assert.equal(g.state.barricadesCleared,0);
});

function stranded(overrides={}){return{x:150,y:0,r:13,following:false,regroupReadyAt:0,...overrides}}
function prepareRescue(g){cleanRun(g);g.scheduleRush(Infinity);g.setup({elapsed:119.99,nextRescueAt:120,nextBossAt:1000,obstacles:[],barrels:[]});g.update(.02);assert.ok(g.state.rescue);return g.state.rescue}
function recruitRescue(g){const b=g.state.rescue;g.p.x=b.x;g.p.y=b.y;g.updateRescue(.02,{x:g.p.x,y:g.p.y});assert.equal(b.following,true);return b}
function reachRescueExit(g){const b=g.state.exitBeacon;g.p.x=b.x;g.p.y=b.y;g.update(.02);assert.equal(g.state.rescuesCompleted,1);assert.equal(g.state.mode,'upgrade');assert.match(g.el('modal').innerHTML,/SURVIVOR RESCUED · BONUS UPGRADE/)}
test('the first survivor signal starts at two minutes, remains optional, and has no expiry',()=>{
  const g=loadGame();cleanRun(g);g.scheduleRush(Infinity);g.setup({elapsed:119.99,nextRescueAt:120,nextBossAt:1000,obstacles:[],barrels:[]});g.updateRescueAvailability();assert.equal(g.state.rescue,null);g.setup({elapsed:120});g.updateRescueAvailability();const b=g.state.rescue;assert.ok(b);assert.equal(b.following,false);assert.equal(g.state.rescueOffered,true);
  g.setup({elapsed:150});g.updateRescue(0,{x:0,y:0});assert.equal(g.state.rescue,b);assert.equal(g.state.rescuesCompleted,0);g.updateEncounterHUD();assert.match(g.el('rescueGoal').textContent,/SURVIVOR .*APPROACH TO RECRUIT/);assert.equal(g.el('regroup').style.display,'none');
});
test('survivor placement stays visible and clear across real maps and portrait/landscape sizes',()=>{
  for(const [width,height] of [[412,915],[915,412],[320,568],[568,320]])for(let seed=1;seed<=40;seed++){
    const g=loadGame({seed,width,height});g.start();g.scheduleRush(Infinity);g.setup({elapsed:120,nextBossAt:1000});g.updateRescueAvailability();const b=g.state.rescue;assert.ok(b,`${width}x${height} seed ${seed}`);
    assert.ok(Math.abs(b.x-g.p.x)+b.r<=width/2-18);assert.ok(Math.abs(b.y-g.p.y)+b.r<=height/2-30);assert.ok(g.state.barricades.every(a=>g.pointRectDistance(b,a)>=b.r+12));assert.ok(g.state.barrels.every(a=>Math.hypot(a.x-b.x,a.y-b.y)>=b.r+a.r+20));
  }
});
test('physical blockage retries without offering a phantom rescue or mutating scenery',()=>{
  const g=loadGame();cleanRun(g);g.scheduleRush(Infinity);const scenery={x:-1000,y:-1000,w:2000,h:2000};g.setup({elapsed:120,nextRescueAt:120,nextBossAt:1000,obstacles:[scenery],barrels:[],barricades:[barrier(scenery)]});g.updateRescueAvailability();assert.equal(g.state.rescue,null);assert.equal(g.state.rescueOffered,false);near(g.state.nextRescueAt,125);assert.equal(g.state.obstacles[0],scenery);
  g.setup({elapsed:125,barricades:[]});g.updateRescueAvailability();assert.ok(g.state.rescue);assert.equal(g.state.obstacles.length,0);
});
test('new survivor signals defer during boss, Blackout, salvage, and spawn relief',()=>{
  for(const reason of ['boss','bossWarning','rush','rushWarning','salvage','relief']){
    const g=loadGame();cleanRun(g);g.scheduleRush(Infinity);g.setup({elapsed:120,nextRescueAt:120,nextBossAt:1000,obstacles:[],barrels:[]});
    if(reason==='boss')g.spawnBoss();if(reason==='bossWarning'){g.setup({nextBossAt:130});g.updateEncounter()}if(reason==='rush'){g.scheduleRush(120);g.updateRush(.01)}if(reason==='rushWarning'){g.scheduleRush(125);g.updateRush(.01)}if(reason==='salvage')g.placeSalvage();if(reason==='relief')g.setup({reliefUntil:125});
    g.updateRescueAvailability();assert.equal(g.state.rescue,null,reason);assert.equal(g.state.rescueOffered,false);
  }
});
test('walking or dashing past a survivor recruits them without a heal, XP, or early reward',()=>{
  for(const crossed of [false,true]){
    const g=loadGame();cleanRun(g);const b=stranded({x:0});g.setup({rescue:b,rescueOffered:true,xp:3});g.p.hp=70;g.p.x=crossed?100:20;g.updateRescue(.02,{x:crossed?-100:20,y:0});
    assert.equal(b.following,true);near(g.p.hp,70);assert.equal(g.state.xp,3);assert.equal(g.state.rescuesCompleted,0);assert.equal(g.state.bonusChoices,0);g.updateEncounterHUD();assert.equal(g.el('regroup').style.display,'block');
  }
});
test('a recruited survivor follows without becoming a combat target or blocking normal shots',()=>{
  const g=loadGame();cleanRun(g);const b=stranded({x:100,following:true});g.setup({rescue:b,rescueOffered:true,hostileShots:[hostileShot({x:50,y:0,vx:200,life:2})],barrels:[{x:100,y:0,r:17,spent:false}]});g.detonateBarrel(g.state.barrels[0]);g.p.x=300;g.update(.02);
  assert.ok(b.x>100);assert.equal(b.following,true);assert.equal(g.state.enemies.length,0);assert.equal(g.state.killCount,0);assert.equal(g.state.gems.length,0);assert.equal(g.state.xp,0);assert.equal(g.state.hostileShots.length,1);assert.equal(g.state.rescue,b);near(g.p.hp,100);
});
test('followers stop at solid cover without damaging it and can safely regroup across it',()=>{
  const g=loadGame();cleanRun(g);const b=stranded({x:0,following:true}),wood=barrier({x:70});g.p.x=140;g.setup({rescue:b,rescueOffered:true,barricades:[wood]});g.updateRescue(1,{x:140,y:0});assert.ok(b.x<=57);near(wood.hp,90);assert.equal(g.state.barricadesCleared,0);
  assert.equal(g.regroupRescue(),true);assert.ok(Math.hypot(b.x-g.p.x,b.y-g.p.y)<=45.0001);assert.ok(g.pointRectDistance(b,wood)>=b.r);near(wood.hp,90);assert.equal(g.state.rescuesCompleted,0);
});
test('Regroup works with a second finger and keyboard without stealing the joystick, with a four-second cooldown',()=>{
  const g=loadGame();cleanRun(g);const b=stranded({x:600,following:true});g.setup({rescue:b,rescueOffered:true});g.updateEncounterHUD();g.el('stick').dispatch('pointerdown',{pointerId:1,clientX:135.5,clientY:662.5});g.el('regroup').dispatch('pointerdown',{pointerId:2});
  assert.equal(g.touch.id,1);assert.ok(Math.hypot(b.x-g.p.x,b.y-g.p.y)<46);near(b.regroupReadyAt,4);const x=b.x,y=b.y;assert.equal(g.regroupRescue(),false);near(b.x,x);near(b.y,y);assert.equal(g.el('regroup').attrs['aria-disabled'],'true');
  g.setup({elapsed:4});b.x=600;g.event('keydown',{key:'r'});assert.ok(Math.hypot(b.x-g.p.x,b.y-g.p.y)<46);near(b.regroupReadyAt,8);b.x=600;g.event('keydown',{key:'r',repeat:true});near(b.x,600);assert.equal(g.touch.id,1);
});
test('Regroup cannot recruit an unmet survivor or run while paused or dead',()=>{
  const g=loadGame();cleanRun(g);assert.equal(g.regroupRescue(),false);const b=stranded({x:400});g.setup({rescue:b,rescueOffered:true});assert.equal(g.regroupRescue(),false);near(b.x,400);b.following=true;g.pause();assert.equal(g.regroupRescue(),false);near(b.x,400);g.resume();g.p.hp=0;assert.equal(g.regroupRescue(),false);near(b.x,400);
});
test('a survivor boards with the player even when separated, then rewards before a held exit choice',()=>{
  const g=loadGame();prepareExit(g);const b=stranded({x:g.p.x-2000,following:true});g.setup({rescue:b,rescueOffered:true,xp:7});g.p.hp=70;reachRescueExit(g);const time=g.state.elapsed;assert.equal(g.state.rescue,null);near(g.p.hp,70);assert.equal(g.state.xp,7);assert.ok(g.state.rescueArrival);
  g.choose(0);assert.equal(g.state.mode,'extraction');near(g.state.elapsed,time);assert.equal(g.state.rescueArrival,null);assert.equal(g.el('regroup').style.display,'none');chooseExitForTest(g,'extract');assert.equal(g.state.runResult.rescues,1);g.updateRescue(100,g.p);assert.equal(g.state.rescuesCompleted,1);
});
test('an ignored survivor never prevents successful extraction and receives no reward',()=>{
  const g=loadGame();prepareExit(g);g.setup({rescue:stranded({x:1000}),rescueOffered:true});reachExit(g);chooseExitForTest(g,'extract');assert.equal(g.state.runOutcome,'extracted');assert.equal(g.state.rescuesCompleted,0);assert.equal(g.state.runResult.rescues,0);assert.equal(g.state.bonusChoices,0);
});
test('a follower reaching green on their own pays a rescue without forcing the player to extract',()=>{
  const g=loadGame();prepareExit(g);const gate=g.state.exitBeacon;g.p.x=gate.x+200;g.p.y=gate.y;g.setup({rescue:stranded({x:gate.x-80,y:gate.y,following:true}),rescueOffered:true});g.updateRescue(.5,{x:g.p.x,y:g.p.y});
  assert.equal(g.state.rescuesCompleted,1);assert.equal(g.state.rescueArrival,null);g.checkLevelUp();assert.match(g.el('modal').innerHTML,/SURVIVOR RESCUED/);g.choose(0);assert.equal(g.state.mode,'play');assert.ok(g.state.exitBeacon);
});
test('lethal melee or ranged damage at the exit prevents rescue and its bonus',()=>{
  for(const kind of ['melee','ranged']){
    const g=loadGame();prepareExit(g);const gate=g.state.exitBeacon;g.p.x=gate.x;g.p.y=gate.y;g.p.hp=1;g.p.fireClock=999;g.setup({rescue:stranded({x:gate.x+40,y:gate.y,following:true}),rescueOffered:true});
    if(kind==='melee')g.setup({enemies:[enemy({x:g.p.x,y:g.p.y,hp:10000})]});else g.setup({hostileShots:[hostileShot({x:g.p.x-30,y:g.p.y,vx:1000})]});g.update(.02);
    assert.equal(g.state.mode,'end');assert.equal(g.state.rescuesCompleted,0);assert.equal(g.state.bonusChoices,0);assert.equal(g.state.runResult.rescues,0);
  }
});
test('salvage, rescue, contract, and earned XP rewards keep their labels before opening Extract/Stay',()=>{
  const g=loadGame();startContract(g,'demolition');prepareExit(g);g.setup({rescue:stranded({following:true}),rescueOffered:true,barrelsBlown:3,bonusChoices:1,xp:8});g.state.bonusKinds.push('salvage');const gate=g.state.exitBeacon;g.p.x=gate.x;g.p.y=gate.y;g.update(.02);const time=g.state.elapsed;
  for(const label of ['SALVAGE SECURED','SURVIVOR RESCUED','CONTRACT COMPLETE','LEVEL']){assert.equal(g.state.mode,'upgrade');assert.match(g.el('modal').innerHTML,new RegExp(label));g.choose(0)}
  assert.equal(g.state.mode,'extraction');near(g.state.elapsed,time);assert.equal(g.state.xp,0);assert.equal(g.state.rescuesCompleted,1);assert.equal(g.state.bonusChoices,0);assert.equal(g.state.bonusKinds.length,0);
});
test('a rescue bonus offers weapon evolution and stale callbacks cannot duplicate a rescue',()=>{
  const g=loadGame();prepareExit(g);g.p.pierce=3;g.setup({level:4,xp:3,rescue:stranded({following:true}),rescueOffered:true});reachRescueExit(g);const index=choiceLabels(g).indexOf('Evolve: Railstorm'),old=g.choices()[index];assert.ok(index>=0);g.choose(index);assert.equal(g.p.rail,true);assert.equal(g.state.mode,'extraction');assert.equal(g.state.xp,3);old.onclick();g.finishRescueArrival();assert.equal(g.state.rescuesCompleted,1);assert.equal(g.state.mode,'extraction');
});
test('pause, upgrades, extraction, and results freeze survivor positions, availability, and Regroup cooldown',()=>{
  for(const target of ['pause','upgrade','extraction','end']){
    const g=loadGame();if(target==='extraction')prepareExit(g);else cleanRun(g);const b=stranded({following:true,regroupReadyAt:999});g.setup({rescue:b,rescueOffered:true,nextRescueAt:120});
    if(target==='pause')g.pause();if(target==='upgrade'){g.setup({xp:8});g.checkLevelUp()}if(target==='extraction')reachExit(g);if(target==='end'){g.pause();quitForTest(g)}
    const time=g.state.elapsed;g.update(100);g.updateRescue(100,g.p);g.updateRescueAvailability();assert.equal(g.regroupRescue(),false);near(b.x,150);near(b.y,0);near(b.regroupReadyAt,999);near(g.state.nextRescueAt,120);near(g.state.elapsed,time);assert.equal(g.state.rescuesCompleted,0);
  }
});
test('Stay opens one new rescue opportunity after twenty seconds while retaining already waiting survivors',()=>{
  const g=loadGame();prepareExit(g);g.setup({rescue:stranded({following:true}),rescueOffered:true});reachRescueExit(g);g.choose(0);chooseExitForTest(g,'stay');assert.equal(g.state.rescueOffered,false);near(g.state.nextRescueAt,g.state.elapsed+20);g.scheduleRush(Infinity);const due=g.state.nextRescueAt;
  g.setup({elapsed:due-.01});g.updateRescueAvailability();assert.equal(g.state.rescue,null);g.setup({elapsed:due});g.updateRescueAvailability();const b=g.state.rescue;assert.ok(b);g.updateRescueAvailability();assert.equal(g.state.rescue,b);assert.equal(g.state.rescuesCompleted,1);
  g.setup({elapsed:g.state.exitAt,bossesDefeated:1,nextBossAt:1000});g.updateExtractionWindow();reachExit(g);chooseExitForTest(g,'stay');assert.equal(g.state.rescue,b);assert.equal(g.state.rescueOffered,true);
});
test('a distant unrecruited signal relocates nearby without duplication or free completion',()=>{
  const g=loadGame();prepareRescue(g);const old=g.state.rescue;g.p.x+=2000;g.setup({elapsed:g.state.nextRescueAt});g.updateRescueAvailability();const fresh=g.state.rescue;assert.notEqual(fresh,old);assert.ok(Math.hypot(fresh.x-g.p.x,fresh.y-g.p.y)<200);assert.equal(fresh.following,false);assert.equal(g.state.rescuesCompleted,0);assert.equal(g.state.bonusChoices,0);g.updateRescueAvailability();assert.equal(g.state.rescue,fresh);
});
test('rescue counts stay on fixed results and local history and retry restores a fresh first opportunity',()=>{
  const g=loadGame();prepareExit(g);g.setup({rescue:stranded({following:true}),rescueOffered:true});reachRescueExit(g);g.choose(0);chooseExitForTest(g,'extract');const result=g.state.runResult;assert.equal(result.rescues,1);assert.match(g.el('modal').innerHTML,/<strong>1<\/strong><small>SURVIVORS RESCUED/);
  const next=loadGame({journalStored:g.journalSaved()});next.showJournal();assert.match(next.el('modal').innerHTML,/1 survivors rescued/);g.el('again').click();assert.equal(g.state.rescuesCompleted,0);assert.equal(g.state.rescue,null);assert.equal(g.state.rescueOffered,false);assert.equal(g.state.rescueArrival,null);near(g.state.nextRescueAt,120);assert.equal(g.el('regroup').style.display,'none');assert.equal(result.rescues,1);
});
test('old or malformed rescue history cannot create followers, rewards, or HTML',()=>{
  const g=loadGame({journalStored:journalData('survivor',{history:[{outcome:'extracted',time:181},{outcome:'defeated',time:10,rescues:'<img>'},{outcome:'abandoned',time:10,rescues:-7}]})});assert.equal(g.state.journal.history[0].rescues,null);assert.equal(g.state.journal.history[1].rescues,null);assert.equal(g.state.journal.history[2].rescues,0);g.showJournal();assert.doesNotMatch(g.el('modal').innerHTML,/<img/);g.el('journalBack').click();cleanRun(g);assert.equal(g.state.rescue,null);assert.equal(g.state.rescuesCompleted,0);assert.equal(g.state.bonusChoices,0);
});
test('all four profiles can recruit and escort through real updates with starting cover and a safe reward-to-exit handoff',()=>{
  for(const role of ['survivor','scout','bulwark','engineer','scavenger']){
    const g=loadGame();g.showRoster();g.selectSurvivor(role);g.start();g.scheduleRush(Infinity);g.setup({elapsed:119.99,spawn:1000,nextHowlerAt:Infinity,nextConvoyAt:Infinity,nextDropAt:Infinity,nextBossAt:1000,nextSpitterAt:Infinity,nextRiotAt:Infinity,nextSalvageAt:Infinity,nextSupplyAt:Infinity});g.update(.02);assert.ok(g.state.rescue);const initial=g.state.rescue;
    const walkTo=target=>{const d=Math.hypot(target.x-g.p.x,target.y-g.p.y),strength=d?Math.min(1,d*60/g.p.speed):0;g.touch.x=d?strength*(target.x-g.p.x)/d:0;g.touch.y=d?strength*(target.y-g.p.y)/d:0};
    for(let i=0;i<180&&!initial.following;i++){walkTo(initial);g.update(1/60)}assert.equal(initial.following,true,role);
    const center={x:g.p.x,y:g.p.y};
    for(let i=0;i<900;i++){walkTo({x:center.x+100*Math.cos(i/100),y:center.y+100*Math.sin(i/100)});g.update(1/60);if(Math.hypot(initial.x-g.p.x,initial.y-g.p.y)>220)g.regroupRescue();assert.equal(g.state.rescue,initial);assert.ok(Number.isFinite(initial.x)&&Number.isFinite(initial.y));if(i%180===0)g.render()}
    g.setup({elapsed:179.99,bossesDefeated:1});g.update(.02);assert.ok(g.state.exitBeacon);
    for(let i=0;i<240&&g.state.mode!=='extraction';i++){while(g.state.mode==='upgrade')g.choose(0);if(g.state.mode==='extraction')break;walkTo(g.state.exitBeacon);g.update(1/60)}
    while(g.state.mode==='upgrade')g.choose(0);assert.equal(g.state.mode,'extraction',role);assert.equal(g.state.rescuesCompleted,1);assert.equal(g.state.rescue,null);near(g.p.hp,g.p.max);assert.equal(g.state.bonusChoices,0);
  }
});
test('new barricades keep the waiting survivor clear of solid cover',()=>{
  const g=loadGame();cleanRun(g);const b=stranded({x:300,y:0});g.setup({rescue:b,rescueOffered:true,obstacles:[],barrels:[]});for(let i=0;i<30;i++)g.placeBarricade();assert.ok(g.state.barricades.length>0);assert.ok(g.state.barricades.every(wood=>g.pointRectDistance(b,wood)>=b.r+25));assert.equal(g.state.rescue,b);
});

function groundFire(overrides={}){return{x:100,y:0,r:58,damage:8.1,life:3.2,max:3.2,evolved:false,...overrides}}
function burnStep(g,dt){g.setup({elapsed:g.state.elapsed+dt});g.updateMolotov(dt)}
function prepareFire(g){cleanRun(g);g.setup({barrels:[],obstacles:[]});g.p.fireClock=999}
test('Molotov ranks widen coverage and recharge faster; Wildfire throws at distinct targets only',()=>{
  const g=loadGame();prepareFire(g);let radius=0,cooldown=Infinity;
  for(const rank of [1,2,3]){g.p.molotov=rank;const s=g.molotovStats();assert.ok(s.radius>radius);assert.ok(s.cooldown<cooldown);radius=s.radius;cooldown=s.cooldown;assert.equal(s.count,1);near(s.duration,2.4)}
  g.p.wildfire=true;const s=g.molotovStats();assert.ok(s.radius>radius);assert.ok(s.cooldown>s.duration);near(s.duration,2.8);assert.equal(s.count,2);
  const a=enemy({x:100,hp:1000}),b=enemy({x:-120,hp:1000});g.setup({enemies:[b,a]});assert.equal(g.launchMolotov(),2);assert.deepEqual(Array.from(g.state.bottles,b=>b.tx),[100,-120]);
  g.setup({bottles:[],enemies:[a]});assert.equal(g.launchMolotov(),1);assert.equal(g.state.bottles.length,1,'a lone boss must not receive duplicate bottles');
});
test('Molotov targets living visible enemies in range and retries without consuming a full recharge',()=>{
  const g=loadGame({width:412,height:915});prepareFire(g);g.p.molotov=1;
  g.setup({enemies:[enemy({hp:0,x:10}),enemy({x:180}),enemy({x:0,y:310})],molotovClock:0});g.updateMolotov(.01);assert.equal(g.state.bottles.length,0);near(g.state.molotovClock,.1);
  g.setup({enemies:[enemy({x:100,hp:1000})]});burnStep(g,.11);assert.equal(g.state.bottles.length,1);near(g.state.molotovClock,3.8);
});
test('bottles land at the locked position after flight, with launch-time damage and radius',()=>{
  const g=loadGame();prepareFire(g);g.p.molotov=1;const moving=enemy({x:100,hp:1000}),waiting=enemy({x:100,hp:1000});g.setup({enemies:[moving,waiting],molotovClock:999});g.launchMolotov();
  moving.x=300;g.p.molotov=3;g.p.wildfire=true;g.opts.find(o=>o.name==='Heavy Rounds').apply();
  burnStep(g,.2);assert.equal(g.state.fires.length,0);near(waiting.hp,1000);g.render();burnStep(g,.26);
  assert.equal(g.state.bottles.length,0);assert.equal(g.state.fires.length,1);const f=g.state.fires[0];near(f.x,100);near(f.r,58);near(f.damage,8.1);near(f.life,2.39);near(waiting.hp,991.9);near(moving.hp,1000);g.render();
});
test('overlapping fire uses the strongest pool once per target cooldown, including newly landed pools',()=>{
  const g=loadGame();prepareFire(g);const e=enemy({hp:1000});g.setup({enemies:[e],fires:[groundFire(),groundFire({damage:12}),groundFire({damage:10})]});
  burnStep(g,.01);near(e.hp,988);g.state.fires.push(groundFire({damage:20}));burnStep(g,.2);near(e.hp,988);burnStep(g,.2);near(e.hp,968);assert.equal(g.state.burnHits.size,1);
});
test('ground fire delivers equal timed damage at 30 and 60 updates per second',()=>{
  const remaining=[];
  for(const fps of [30,60]){const g=loadGame();prepareFire(g);const e=enemy({hp:1000});g.setup({enemies:[e],fires:[groundFire()]});for(let i=0;i<fps*3;i++)burnStep(g,1/fps);remaining.push(e.hp);near(e.hp,1000-8*8.1)}
  near(remaining[0],remaining[1]);
});
test('expired and distant fire and overshot bottles cannot deal late damage',()=>{
  const g=loadGame();prepareFire(g);const e=enemy({hp:100});g.setup({enemies:[e],fires:[groundFire({life:.01}),groundFire({x:1300,r:1400})],bottles:[{x:0,y:0,tx:100,ty:0,age:0,flight:.45,radius:58,damage:99,duration:3.2}]});
  burnStep(g,4);assert.equal(g.state.fires.length,0);assert.equal(g.state.bottles.length,0);near(e.hp,100);assert.equal(g.state.killCount,0);
});
test('bottle and fire limits remain bounded and landing replaces the oldest active pool',()=>{
  const g=loadGame();prepareFire(g);Object.assign(g.p,{molotov:3,wildfire:true});g.setup({enemies:[enemy({hp:10000}),enemy({x:-100,hp:10000})],molotovClock:999});
  for(let i=0;i<8;i++)g.launchMolotov();assert.equal(g.state.bottles.length,2);const old=groundFire({damage:0}),newer=groundFire({x:0,damage:0});g.setup({fires:[old,newer]});burnStep(g,.46);assert.equal(g.state.fires.length,2);assert.equal(g.state.bottles.length,0);assert.ok(!g.state.fires.includes(old)&&!g.state.fires.includes(newer));assert.ok(g.state.fires.every(f=>f.evolved));
});
test('Heavy Rounds strengthens new bottles while gun-only upgrades preserve Molotov cadence and count',()=>{
  const g=loadGame();prepareFire(g);g.p.molotov=1;g.setup({enemies:[enemy({hp:1000})]});g.launchMolotov();const first=g.state.bottles[0],before=g.molotovStats();
  for(const name of ['Rapid Fire','Multishot','Velocity','Heavy Rounds'])g.opts.find(o=>o.name===name).apply();g.launchMolotov();near(first.damage,8.1);near(g.state.bottles[1].damage,8.1*1.3);near(g.molotovStats().cooldown,before.cooldown);assert.equal(g.molotovStats().count,1);
});
test('raised Riot shields block ordinary bullets while labeled ground fire bypasses them',()=>{
  const g=loadGame();prepareFire(g);const e=riot({speed:0});g.setup({enemies:[e],bullets:[{...bullet(),x:0,vx:1000}],fires:[groundFire()]});g.updateProjectiles(.15);near(e.hp,100);g.updateMolotov(.01);near(e.hp,91.9);assert.equal(g.riotShieldUp(e),true);assert.ok(g.state.texts.some(t=>t.t==='FIRE 8'));assert.equal(g.state.killCount,0);
});
test('fire eliminations count once with normal XP drops and Guard credit',()=>{
  const g=loadGame();prepareFire(g);const e=riot({hp:5});g.setup({enemies:[e],fires:[groundFire(),groundFire()]});g.updateMolotov(.01);g.updateMolotov(.01);g.hitEnemy(e,20,'FIRE');assert.equal(g.state.killCount,1);assert.equal(g.state.burnKills,1);assert.equal(g.state.riotsDefeated,1);assert.equal(g.state.gems.length,1);assert.equal(g.state.gems[0].value,3);assert.equal(g.state.bossesDefeated,0);burnStep(g,.5);assert.equal(g.state.burnHits.size,0);
});
test('ground fire is safe for the player, recruited survivor, and unrecruited survivor',()=>{
  for(const following of [false,true]){const g=loadGame();prepareFire(g);g.p.hp=70;const b=stranded({x:0,following});g.setup({rescue:b,rescueOffered:true,fires:[groundFire({x:0,r:100,damage:10000,life:4})]});for(let i=0;i<120;i++)g.update(1/60);near(g.p.hp,70);assert.equal(g.state.rescue,b);assert.equal(g.state.rescuesCompleted,0);assert.equal(g.state.killCount,0);assert.equal(g.state.burnKills,0)}
});
test('fire ignites fuel chains with blast accounting and the existing demolition contract reward',()=>{
  const g=loadGame();startContract(g,'demolition');g.setup({barrels:[fuel(100),fuel(200),fuel(300)],barricades:[],fires:[groundFire({r:10})],enemies:[enemy({x:300,hp:100})]});g.p.hp=70;g.updateMolotov(.01);
  assert.equal(g.state.barrelsBlown,3);assert.equal(g.state.blastKills,1);assert.equal(g.state.burnKills,0);assert.equal(g.state.killCount,1);near(g.p.hp,70);g.checkLevelUp();assert.equal(g.state.contractCompleted,true);assert.match(g.el('modal').innerHTML,/CONTRACT COMPLETE/);chooseNamed(g,'Molotov');assert.equal(g.p.molotov,1);
});
test('wood takes one strongest fire tick per interval and awards a single player clear',()=>{
  const g=loadGame();prepareFire(g);const b=barrier({hp:30,max:30});g.setup({barricades:[b],fires:[groundFire({damage:16}),groundFire({damage:10})]});burnStep(g,.01);near(b.hp,14);burnStep(g,.2);near(b.hp,14);burnStep(g,.2);assert.ok(b.hp<=0);assert.equal(g.state.barricadesCleared,1);burnStep(g,.5);assert.equal(g.state.barricadesCleared,1);assert.equal(g.state.killCount,0);assert.equal(g.state.gems.length,0);
});
test('pause, upgrades, extraction, and results freeze bottles, burns, recharge, and target cooldowns',()=>{
  for(const target of ['pause','upgrade','extraction','end']){
    const g=loadGame();if(target==='extraction')prepareExit(g);else prepareFire(g);const e=enemy({x:g.p.x+100,y:g.p.y,hp:1000});g.p.molotov=1;g.setup({enemies:[e],barrels:[],fires:[groundFire({x:e.x,y:e.y})],molotovClock:999});g.launchMolotov();g.updateMolotov(.01);
    if(target==='pause')g.pause();if(target==='upgrade')earnUpgrade(g);if(target==='extraction')reachExit(g);if(target==='end'){g.pause();quitForTest(g)}
    const before={time:g.state.elapsed,age:g.state.bottles[0].age,life:g.state.fires[0].life,hp:e.hp,clock:g.state.molotovClock,due:g.state.burnHits.get(e)};g.update(100);g.updateMolotov(100);assert.equal(g.launchMolotov(),0);near(g.state.elapsed,before.time);near(g.state.bottles[0].age,before.age);near(g.state.fires[0].life,before.life);near(e.hp,before.hp);near(g.state.molotovClock,before.clock);near(g.state.burnHits.get(e),before.due);
  }
});
test('retry clears Molotov ranks, evolution, active effects, hit map, and fire eliminations',()=>{
  const g=loadGame();prepareFire(g);Object.assign(g.p,{molotov:3,wildfire:true});g.setup({enemies:[enemy({hp:1}),enemy({x:-100,hp:1000})],fires:[groundFire()]});g.launchMolotov();g.updateMolotov(.01);assert.equal(g.state.burnKills,1);assert.ok(g.state.bottles.length&&g.state.fires.length&&g.state.burnHits.size);g.pause();quitForTest(g);const result=g.state.runResult;g.el('again').click();assert.equal(g.p.molotov,0);assert.equal(g.p.wildfire,false);assert.equal(g.state.burnKills,0);assert.equal(g.state.bottles.length+g.state.fires.length+g.state.burnHits.size,0);near(g.state.molotovClock,.2);assert.equal(result.fireKills,1);
});
test('held results and local run history retain Wildfire build and direct fire eliminations',()=>{
  const g=loadGame();prepareFire(g);Object.assign(g.p,{molotov:3,wildfire:true});g.setup({enemies:[enemy({hp:1})],fires:[groundFire()]});g.updateMolotov(.01);g.pause();quitForTest(g);assert.match(g.el('modal').innerHTML,/<strong>1<\/strong><small>FIRE ELIMINATIONS/);assert.match(g.el('modal').innerHTML,/Wildfire \(EVOLVED\)/);const next=loadGame({journalStored:g.journalSaved()});next.showJournal();assert.match(next.el('modal').innerHTML,/1 fire eliminations/);assert.match(next.el('modal').innerHTML,/Wildfire \(EVOLVED\)/);cleanRun(next);assert.equal(next.p.molotov,0);assert.equal(next.p.wildfire,false);assert.equal(next.state.burnKills,0);
});
test('old and malformed history cannot invent Molotov evolutions or new-run damage',()=>{
  const rows=[{outcome:'extracted',time:181},{outcome:'defeated',time:20,molotov:1,wildfire:true,fireKills:'<img>'},{outcome:'abandoned',time:10,molotov:3,wildfire:'true',fireKills:-5},{outcome:'extracted',time:181,molotov:999,wildfire:true,fireKills:12}];
  const g=loadGame({journalStored:journalData('survivor',{history:rows})}),h=g.state.journal.history;assert.equal(h[0].molotov,0);assert.equal(h[0].fireKills,null);assert.equal(h[0].wildfire,false);assert.equal(h[1].wildfire,false);assert.equal(h[1].fireKills,null);assert.equal(h[2].wildfire,false);assert.equal(h[2].fireKills,0);assert.equal(h[3].molotov,3);assert.equal(h[3].wildfire,true);g.showJournal();assert.doesNotMatch(g.el('modal').innerHTML,/<img/);cleanRun(g);near(g.p.damage,18);assert.equal(g.p.molotov,0);
});
test('salvage and rescue bonuses can evolve Molotov without consuming XP',()=>{
  for(const kind of ['salvage','rescue']){const g=loadGame();prepareFire(g);g.p.molotov=3;g.setup({level:4,xp:7,bonusChoices:1});g.state.bonusKinds.push(kind);g.checkLevelUp();assert.match(g.el('modal').innerHTML,new RegExp(kind==='salvage'?'SALVAGE SECURED':'SURVIVOR RESCUED'));fixtureOfferedUpgrade(g,'Evolve: Wildfire');chooseNamed(g,'Evolve: Wildfire');assert.equal(g.p.wildfire,true);assert.equal(g.state.xp,7);assert.equal(g.state.mode,'play')}
});
test('Stay retains Wildfire and existing ground effects without granting extra weapon power',()=>{
  const g=loadGame();prepareExit(g);Object.assign(g.p,{molotov:3,wildfire:true});g.setup({barrels:[],fires:[groundFire({x:g.p.x,y:g.p.y,evolved:true})]});reachExit(g);const fire=g.state.fires[0],life=fire.life,damage=g.p.damage;chooseExitForTest(g,'stay');assert.equal(g.state.mode,'play');assert.equal(g.p.molotov,3);assert.equal(g.p.wildfire,true);assert.equal(g.state.fires[0],fire);near(fire.life,life);near(g.p.damage,damage);assert.equal(g.state.overtime,1);
});
test('all evolved weapons run together with bounded fire, entity, and effect counts',()=>{
  const g=loadGame();g.start();Object.assign(g.p,{pierce:3,rail:true,arc:3,thunder:true,blades:3,reaper:true,molotov:3,wildfire:true,proj:5,fire:.075,inv:999});let sawBottle=false,sawFire=false;
  for(let i=0;i<5400;i++){
    while(g.state.mode==='upgrade')g.choose(0);g.touch.x=Math.cos(i/100);g.touch.y=Math.sin(i/100);if(i%150===0)g.dash();g.update(1/60);sawBottle ||= g.state.bottles.length>0;sawFire ||= g.state.fires.length>0;
    assert.ok(Number.isFinite(g.p.x)&&Number.isFinite(g.p.y)&&Number.isFinite(g.p.hp));assert.ok(g.state.enemies.length<=240);for(const key of ['bottles','fires','bullets','lightning','hostileShots','particles','texts'])assert.ok(g.state[key].length<=g.limits[key],key);assert.ok(g.state.burnHits.size<=240);assert.ok(g.state.fires.every(f=>f.life>0&&Number.isFinite(f.x)&&Number.isFinite(f.y)));if(i%120===0)g.render();
  }
  assert.equal(sawBottle,true);assert.equal(sawFire,true);assert.ok(g.state.burnKills<=g.state.killCount);
});


function choicePointer(button,event,pointerId=7,extra={}){button.dispatch(event,{pointerId,clientX:100,clientY:100,...extra})}
test('upgrade cards reject a held gameplay touch release and delayed compatibility click',()=>{
  const g=loadGame();cleanRun(g);g.el('stick').dispatch('pointerdown',{pointerId:7,clientX:135.5,clientY:662.5});earnUpgrade(g);const card=g.choices()[0],level=g.state.level,time=g.state.elapsed;
  g.advanceClock(1000);choicePointer(card,'pointerup');card.click(1);assert.equal(g.state.mode,'upgrade');assert.equal(g.state.level,level);assert.equal(g.p.pierce+g.p.arc+g.p.blades+g.p.molotov,0);near(g.state.elapsed,time);
});
test('upgrade cards ignore presses begun during the opening guard and wait indefinitely for a fresh choice',()=>{
  const g=loadGame();cleanRun(g);earnUpgrade(g);const card=g.choices()[0];choicePointer(card,'pointerdown');g.advanceClock(1000);choicePointer(card,'pointerup');card.click(1);assert.equal(g.state.mode,'upgrade');
  const time=g.state.elapsed;g.advanceClock(60000);g.update(60);near(g.state.elapsed,time);assert.equal(g.state.mode,'upgrade');choicePointer(card,'pointerdown');assert.equal(g.state.mode,'upgrade');choicePointer(card,'pointerup');assert.equal(g.state.mode,'play');assert.equal(g.p.pierce+g.p.arc+g.p.blades+g.p.molotov,1);
});
test('a new tap chooses the requested nonfirst upgrade exactly once',()=>{
  const g=loadGame();cleanRun(g);earnUpgrade(g);g.advanceClock(500);const labels=choiceLabels(g),index=labels.indexOf('Molotov'),card=g.choices()[index];assert.ok(index>=0);choicePointer(card,'pointerdown');assert.equal(g.p.molotov,0);choicePointer(card,'pointerup');assert.equal(g.p.molotov,1);card.click(1);choicePointer(card,'pointerup');assert.equal(g.p.molotov,1);assert.equal(g.state.mode,'play');
});
test('scrolling on a power-up card cancels selection and a later tap still works',()=>{
  const g=loadGame();cleanRun(g);earnUpgrade(g);g.advanceClock(500);const card=g.choices()[0];choicePointer(card,'pointerdown');choicePointer(card,'pointermove',7,{clientY:145});choicePointer(card,'pointerup',7,{clientY:145});card.click(1);assert.equal(g.state.mode,'upgrade');choicePointer(card,'pointerdown');choicePointer(card,'pointerup');assert.equal(g.state.mode,'play');
});
for(const cancel of ['pointercancel','pointerleave','lostpointercapture'])test(`upgrade ${cancel} prevents accidental selection`,()=>{
  const g=loadGame();cleanRun(g);earnUpgrade(g);g.advanceClock(500);const card=g.choices()[0];choicePointer(card,'pointerdown');choicePointer(card,cancel);choicePointer(card,'pointerup');card.click(1);assert.equal(g.state.mode,'upgrade');
});
test('upgrade pointer identity and button guards prevent mismatched releases and right clicks',()=>{
  const g=loadGame();cleanRun(g);earnUpgrade(g);g.advanceClock(500);const [a,b]=g.choices();choicePointer(a,'pointerdown');choicePointer(b,'pointerup');choicePointer(a,'pointerup',8);a.click(1);assert.equal(g.state.mode,'upgrade');choicePointer(a,'pointercancel');choicePointer(a,'pointerdown',9,{button:2});choicePointer(a,'pointerup',9,{button:2});assert.equal(g.state.mode,'upgrade');
});
test('queued bonus and XP choices each need a fresh tap with their own opening guard',()=>{
  const g=loadGame();cleanRun(g);g.setup({bonusChoices:1,xp:8});g.state.bonusKinds.push('salvage');g.checkLevelUp();g.advanceClock(500);const old=g.choices()[0];choicePointer(old,'pointerdown');choicePointer(old,'pointerup');assert.equal(g.state.mode,'upgrade');const next=g.choices()[0],level=g.state.level;
  next.click(1);choicePointer(next,'pointerup');choicePointer(next,'pointerdown',8);g.advanceClock(500);choicePointer(next,'pointerup',8);old.click(0);assert.equal(g.state.mode,'upgrade');assert.equal(g.state.level,level);choicePointer(next,'pointerdown',9);choicePointer(next,'pointerup',9);assert.equal(g.state.mode,'play');assert.equal(g.state.xp,0);
});
test('held activation keys and autorepeat cannot select an upgrade; fresh Enter and Space can',()=>{
  for(const key of ['Enter',' ']){
    const g=loadGame();cleanRun(g);earnUpgrade(g);g.advanceClock(500);const card=g.choices()[0];card.dispatch('keydown',{key,repeat:true});card.dispatch('keyup',{key});assert.equal(g.state.mode,'upgrade');card.dispatch('keydown',{key,repeat:false});assert.equal(g.state.mode,'upgrade');card.dispatch('keyup',{key});assert.equal(g.state.mode,'play');card.click(0);assert.equal(g.p.pierce+g.p.arc+g.p.blades+g.p.molotov,1);
  }
});
test('upgrade accessibility clicks work after the guard and obsolete cards cannot select again',()=>{
  const g=loadGame();cleanRun(g);earnUpgrade(g);const card=g.choices()[0];card.click(0);assert.equal(g.state.mode,'upgrade');g.advanceClock(500);card.click(0);assert.equal(g.state.mode,'play');g.setup({xp:g.state.nextXp});g.checkLevelUp();g.advanceClock(500);const level=g.state.level;card.click(0);assert.equal(g.state.mode,'upgrade');assert.equal(g.state.level,level);
});


test('Wildfire skips clustered targets and chooses a separated visible target when available',()=>{
  const g=loadGame();prepareFire(g);Object.assign(g.p,{molotov:3,wildfire:true});
  const nearTarget=enemy({x:50,hp:1000}),cluster=enemy({x:60,y:10,hp:1000}),spread=enemy({x:-100,hp:1000});g.setup({enemies:[spread,cluster,nearTarget]});assert.equal(g.launchMolotov(),2);assert.deepEqual(Array.from(g.state.bottles,b=>b.tx),[50,-100]);
  g.setup({bottles:[],enemies:[nearTarget,cluster]});assert.equal(g.launchMolotov(),1,'a tight cluster gets one burn, not duplicate coverage');assert.equal(g.state.bottles.length,1);
});
test('Molotov ranks leave a gap between pools and Wildfire never carpets the screen at 30 or 60 updates',()=>{
  for(const fps of [30,60])for(const [rank,evolved] of [[1,false],[2,false],[3,false],[3,true]]){
    const g=loadGame();prepareFire(g);Object.assign(g.p,{molotov:rank,wildfire:evolved});g.setup({enemies:[enemy({x:100,hp:1e8}),enemy({x:-100,hp:1e8})]});
    let peak=0,sawFire=false,gap=0,longestGap=0,volleys=0,previousBottles=0;const pools=new Set();
    for(let i=0;i<fps*30;i++){
      burnStep(g,1/fps);const {fires,bottles}=g.state;peak=Math.max(peak,fires.length);for(const fire of fires)pools.add(fire);if(bottles.length>previousBottles)volleys++;previousBottles=bottles.length;
      if(fires.length){sawFire=true;gap=0}else if(sawFire){gap+=1/fps;longestGap=Math.max(longestGap,gap)}
      assert.ok(fires.length<=2);assert.ok(bottles.length<=2);
    }
    assert.equal(peak,evolved?2:1);assert.ok(longestGap>=(evolved?.7:.3),`rank ${rank}, evolved ${evolved}, fps ${fps}: gap ${longestGap}`);assert.ok(volleys>=7&&volleys<=11);assert.equal(pools.size,volleys*(evolved?2:1));
  }
});
test('shorter-lived launched fires keep their hit strength but cannot tick after burning out',()=>{
  for(const evolved of [false,true]){
    const g=loadGame();prepareFire(g);Object.assign(g.p,{molotov:3,wildfire:evolved});const target=enemy({hp:1000});g.setup({enemies:[target],molotovClock:999});g.launchMolotov();const bottle=g.state.bottles[0];near(bottle.damage,18*(evolved?.6:.45));near(bottle.duration,evolved?2.8:2.4);
    g.p.molotov=0;for(let i=0;i<240;i++)burnStep(g,1/60);assert.equal(g.state.fires.length,0);assert.equal(g.state.bottles.length,0);const hp=target.hp;assert.ok(hp<1000);burnStep(g,2);near(target.hp,hp);
  }
});

function utilityDrop(overrides={}){return{x:100,y:0,r:21,phase:'signal',readyAt:74,until:96,...overrides}}
function prepareDrop(g){cleanRun(g);g.scheduleRush(Infinity);g.setup({elapsed:69.99,nextDropAt:70,nextBossAt:1000,exitAt:1000,barrels:[],obstacles:[]});g.p.fireClock=999}
function dropStep(g,dt,from={x:g.p.x,y:g.p.y}){g.setup({elapsed:g.state.elapsed+dt});g.updateDrops(dt,from)}
test('supply signal starts at seventy seconds and lands four gameplay seconds later without early rewards',()=>{
  const g=loadGame();prepareDrop(g);g.update(.005);assert.equal(g.state.supplyDrop,null);g.update(.01);const b=g.state.supplyDrop;assert.ok(b);assert.equal(b.phase,'signal');near(b.readyAt,g.state.elapsed+4);near(b.until,b.readyAt+22);near(g.state.nextDropAt,g.state.elapsed+100);near(g.p.hp,100);assert.equal(g.state.xp,0);assert.equal(g.state.dropsCollected,0);assert.match(g.el('dropGoal').textContent,/LANDING IN 4s/);g.render();
  dropStep(g,3.99);assert.equal(b.phase,'signal');dropStep(g,.02);assert.equal(b.phase,'ready');g.dropHUD();assert.match(g.el('dropGoal').textContent,/XP SWEEP \+ DASH READY/);g.render();assert.equal(g.state.dropsCollected,0);
});
test('a player waiting under a signal cannot collect it before touchdown',()=>{
  const g=loadGame();prepareDrop(g);g.setup({elapsed:70,supplyDrop:utilityDrop({x:0}),gems:[{x:200,y:0,value:4,r:7}],nextDropAt:170});g.p.dashCd=2;dropStep(g,3.9);assert.equal(g.state.dropsCollected,0);assert.equal(g.state.xp,0);near(g.p.dashCd,2);dropStep(g,.1);assert.equal(g.state.supplyDrop,null);assert.equal(g.state.dropsCollected,1);assert.equal(g.state.xp,4);near(g.p.dashCd,0);
});
test('utility collection conserves earned XP within the sweep radius and refreshes only Dash',()=>{
  const g=loadGame();prepareDrop(g);g.setup({elapsed:74,nextDropAt:170,supplyDrop:utilityDrop({x:0,phase:'ready'}),xp:7,gems:[{x:100,y:0,value:1},{x:500,y:0,value:4},{x:501,y:0,value:20}]});g.p.hp=70;g.p.dashCd=2;const before={damage:g.p.damage,fire:g.p.fire,speed:g.p.speed,inv:g.p.inv};g.updateDrops(.01,g.p);
  assert.equal(g.state.xp,12);assert.equal(g.state.dropXpRecovered,5);assert.equal(g.state.gems.length,1);assert.equal(g.state.gems[0].value,20);assert.equal(g.state.dropsCollected,1);assert.equal(g.state.killCount,0);assert.equal(g.state.bonusChoices,0);near(g.p.hp,70);near(g.p.dashCd,0);for(const key of Object.keys(before))near(g.p[key],before[key]);g.updateDrops(.01,g.p);assert.equal(g.state.xp,12);assert.equal(g.state.dropsCollected,1);
});
test('an empty utility drop grants no invented XP, heal, or bonus upgrade',()=>{
  const g=loadGame();prepareDrop(g);g.setup({elapsed:74,supplyDrop:utilityDrop({x:0,phase:'ready'}),gems:[],nextDropAt:170});g.p.hp=50;g.updateDrops(.02,g.p);assert.equal(g.state.xp,0);assert.equal(g.state.dropXpRecovered,0);assert.equal(g.state.bonusChoices,0);assert.equal(g.state.dropsCollected,1);near(g.p.hp,50);
});
test('walk and swept dash collect a landed drop through the real update path',()=>{
  for(const dashing of [false,true]){
    const g=loadGame();prepareDrop(g);g.setup({elapsed:74,supplyDrop:utilityDrop({x:dashing?100:25,phase:'ready'}),nextDropAt:170});g.keys.d=true;if(dashing)g.dash();g.update(dashing?.2:.02);assert.equal(g.state.supplyDrop,null);assert.equal(g.state.dropsCollected,1);near(g.p.dashCd,0);assert.equal(g.state.mode,'play');
  }
});
test('a dash crossing before touchdown is rejected but its post-touchdown crossing can collect',()=>{
  for(const [x,expected] of [[50,0],[180,1]]){
    const g=loadGame();prepareDrop(g);g.setup({elapsed:1,supplyDrop:utilityDrop({x,readyAt:.8,until:23}),nextDropAt:170});g.p.x=200;g.updateDrops(1,{x:0,y:0});assert.equal(g.state.dropsCollected,expected);assert.equal(g.state.supplyDrop===null,expected===1);
  }
});
test('melee and ranged lethal damage resolve before a utility drop can reward or refresh Dash',()=>{
  for(const kind of ['melee','ranged']){
    const g=loadGame();prepareDrop(g);g.setup({elapsed:74,supplyDrop:utilityDrop({x:0,phase:'ready'}),nextDropAt:170,gems:[{x:200,y:0,value:20}]});g.p.hp=1;g.p.dashCd=2;
    if(kind==='melee')g.setup({enemies:[enemy({x:0,hp:10000})]});else g.setup({hostileShots:[hostileShot({x:-30,vx:1000})]});g.update(.02);assert.equal(g.state.mode,'end');assert.equal(g.state.dropsCollected,0);assert.equal(g.state.dropXpRecovered,0);assert.equal(g.state.runResult.drops,0);assert.ok(g.p.dashCd>0);g.updateDrops(100,g.p);assert.equal(g.state.dropsCollected,0);
  }
});
test('new supply signals defer during bosses, warnings, Blackouts, relief, salvage, and open extraction',()=>{
  for(const reason of ['boss','boss warning','Blackout','Blackout warning','relief','salvage','exit']){
    const g=loadGame();if(reason==='exit'){prepareExit(g);g.setup({nextDropAt:70})}else prepareDrop(g);g.setup({elapsed:reason==='exit'?181:70});
    if(reason==='boss')g.spawnBoss();if(reason==='boss warning'){g.setup({nextBossAt:75});g.updateEncounter()}if(reason==='Blackout'){g.scheduleRush(70);g.updateRush(.01)}if(reason==='Blackout warning'){g.scheduleRush(74);g.updateRush(.01)}if(reason==='relief')g.setup({reliefUntil:80});if(reason==='salvage')g.setup({salvage:{x:100,y:0,r:80,until:100,progress:0}});
    g.updateDrops(.01,g.p);assert.equal(g.state.supplyDrop,null,reason);assert.equal(g.state.dropsCollected,0);
  }
});
test('an already signaled drop lands during a later encounter without spawning enemies or doing damage',()=>{
  const g=loadGame();prepareDrop(g);g.setup({elapsed:70});g.updateDrops(.01,g.p);const b=g.state.supplyDrop;g.spawnBoss();const count=g.state.enemies.length,hp=g.state.activeBoss.hp;dropStep(g,4.01);assert.equal(g.state.supplyDrop,b);assert.equal(b.phase,'ready');assert.equal(g.state.enemies.length,count);near(g.state.activeBoss.hp,hp);near(g.p.hp,100);assert.equal(g.state.killCount,0);
});
test('drop placement stays visible and clear across two hundred generated map and viewport combinations',()=>{
  for(const [width,height] of [[320,640],[412,915],[915,412],[1280,720]])for(let seed=1;seed<=50;seed++){
    const g=loadGame({width,height,seed});g.start();g.setup({elapsed:70});assert.equal(g.placeDrop(),true);const b=g.state.supplyDrop;assert.ok(Math.abs(b.x-g.p.x)+b.r+18<=width/2);assert.ok(Math.abs(b.y-g.p.y)+b.r+30<=height/2);assert.ok(g.state.barricades.every(a=>g.pointRectDistance(b,a)>=b.r+20));assert.ok(g.state.barrels.every(a=>Math.hypot(a.x-b.x,a.y-b.y)>=a.r+b.r+25));assert.ok(g.state.obstacles.every(o=>!(b.x>o.x-b.r-20&&b.x<o.x+o.w+b.r+20&&b.y>o.y-b.r-20&&b.y<o.y+o.h+b.r+20)));assert.equal(g.placeDrop(),false,'never replace an existing signal');
  }
});
test('physically blocked drop placement retries, while scenery fallback clears only decoration',()=>{
  const g=loadGame();prepareDrop(g);g.setup({elapsed:70,barricades:[barrier({x:-1000,y:-1000,w:2000,h:2000})]});g.updateDrops(.01,g.p);assert.equal(g.state.supplyDrop,null);near(g.state.nextDropAt,75);assert.equal(g.state.barricades.length,1);g.setup({elapsed:75,barricades:[],obstacles:[{x:-1000,y:-1000,w:2000,h:2000,type:1}]});g.updateDrops(.01,g.p);assert.ok(g.state.supplyDrop);assert.equal(g.state.obstacles.length,0);assert.equal(g.state.barricadesCleared,0);near(g.state.nextDropAt,175);
});
test('drop placement respects medical cache, salvage, follower, and exit clearances',()=>{
  const g=loadGame();prepareDrop(g);g.setup({elapsed:70,supplyCache:{x:0,y:140,r:19,until:999},salvage:{x:100,y:-100,r:80,until:999,progress:0},rescue:stranded({x:-100,y:-100})});assert.equal(g.placeDrop(),true);const b=g.state.supplyDrop;assert.ok(Math.hypot(b.x-g.state.supplyCache.x,b.y-g.state.supplyCache.y)>=b.r+19+20);assert.ok(Math.hypot(b.x-100,b.y+100)>=b.r+80+20);assert.ok(Math.hypot(b.x+100,b.y+100)>=b.r+13+25);
});
test('new physical cover, medical caches, salvage, and rescue points preserve drop access',()=>{
  const g=loadGame();prepareDrop(g);g.setup({supplyDrop:utilityDrop({x:0,y:140}),supplyCache:null,rescue:null,salvage:null});const b=g.state.supplyDrop;
  for(let i=0;i<40;i++)g.placeBarricade();assert.ok(g.state.barricades.length>0);assert.ok(g.state.barricades.every(a=>g.pointRectDistance(b,a)>=b.r+25));g.setup({barricades:[]});assert.equal(g.placeSupply(),true);assert.ok(Math.hypot(g.state.supplyCache.x-b.x,g.state.supplyCache.y-b.y)>=g.state.supplyCache.r+b.r+20);g.setup({supplyCache:null});assert.equal(g.placeSalvage(),true);assert.ok(Math.hypot(g.state.salvage.x-b.x,g.state.salvage.y-b.y)>=g.state.salvage.r+b.r+15);g.setup({salvage:null});const npc=g.rescueSpot();assert.ok(npc);assert.ok(Math.hypot(npc.x-b.x,npc.y-b.y)>=npc.r+b.r+15);
});
test('expired, distant, or exit-overlapped drops disappear without rewards or blocking extraction',()=>{
  for(const reason of ['expired','distant','exit']){
    const g=loadGame();if(reason==='exit')prepareExit(g);else prepareDrop(g);g.setup({nextDropAt:Infinity});const gate=g.state.exitBeacon;g.setup({supplyDrop:utilityDrop(reason==='expired'?{x:0,until:g.state.elapsed}:reason==='distant'?{x:1300}:{x:gate.x,y:gate.y,readyAt:0,until:999})});g.updateDrops(.01,g.p);assert.equal(g.state.supplyDrop,null);assert.equal(g.state.dropsCollected,0);assert.equal(g.state.xp,0);if(reason==='exit'){reachExit(g);chooseExitForTest(g,'extract');assert.equal(g.state.runOutcome,'extracted')}
  }
});
test('pause, upgrades, extraction choices, and results freeze drop timing and collection',()=>{
  for(const target of ['pause','upgrade','extraction','end']){
    const g=loadGame();if(target==='extraction')prepareExit(g);else prepareDrop(g);const b=utilityDrop({x:g.p.x,y:g.p.y,readyAt:g.state.elapsed+4,until:g.state.elapsed+26});g.setup({supplyDrop:b,nextDropAt:70});
    if(target==='pause')g.pause();if(target==='upgrade')earnUpgrade(g);if(target==='extraction')reachExit(g);if(target==='end'){g.pause();quitForTest(g)}const time=g.state.elapsed;g.update(100);g.updateDrops(100,g.p);assert.equal(g.state.supplyDrop,b);assert.equal(b.phase,'signal');near(g.state.elapsed,time);near(b.readyAt,time+4);assert.equal(g.state.dropsCollected,0);near(g.state.nextDropAt,70);
  }
});
test('recovered XP opens ordinary deliberate choices without free bonus upgrades or elapsed time',()=>{
  const g=loadGame();prepareDrop(g);g.setup({elapsed:74,nextDropAt:170,supplyDrop:utilityDrop({x:0,phase:'ready'}),gems:[{x:300,y:0,value:30}],xp:7});g.update(.02);assert.equal(g.state.mode,'upgrade');assert.equal(g.state.dropsCollected,1);assert.equal(g.state.dropXpRecovered,30);assert.equal(g.state.bonusChoices,0);assert.equal(g.state.xp,29);const time=g.state.elapsed;g.choices()[0].click(1);assert.equal(g.state.mode,'upgrade');g.choose(0);assert.equal(g.state.mode,'upgrade');g.choose(0);assert.equal(g.state.mode,'play');assert.equal(g.state.xp,14);near(g.state.elapsed,time);
});
test('collected and ignored drops follow the one-hundred-second schedule with one signal at a time',()=>{
  for(const collect of [false,true]){
    const g=loadGame();prepareDrop(g);g.setup({elapsed:70});g.updateDrops(.01,g.p);const b=g.state.supplyDrop;g.setup({elapsed:74});if(collect){g.p.x=b.x;g.p.y=b.y}g.updateDrops(.01,g.p);if(!collect){g.setup({elapsed:96});g.updateDrops(.01,g.p)}assert.equal(g.state.supplyDrop,null);near(g.state.nextDropAt,170);g.setup({elapsed:169.99});g.updateDrops(.01,g.p);assert.equal(g.state.supplyDrop,null);g.setup({elapsed:170});g.updateDrops(.01,g.p);const next=g.state.supplyDrop;assert.ok(next);near(g.state.nextDropAt,270);g.updateDrops(.01,g.p);assert.equal(g.state.supplyDrop,next);
  }
});
test('held results and history retain drop and recovered-XP counts while retry clears utility state',()=>{
  const g=loadGame();prepareDrop(g);g.setup({elapsed:74,nextDropAt:170,supplyDrop:utilityDrop({x:0,phase:'ready'}),gems:[{x:200,y:0,value:4}]});g.updateDrops(.01,g.p);g.pause();quitForTest(g);const result=g.state.runResult;assert.equal(result.drops,1);assert.equal(result.dropXp,4);assert.match(g.el('modal').innerHTML,/<strong>1<\/strong><small>SUPPLY DROPS/);assert.match(g.el('modal').innerHTML,/<strong>4<\/strong><small>DROP XP RECOVERED/);const next=loadGame({journalStored:g.journalSaved()});next.showJournal();assert.match(next.el('modal').innerHTML,/1 supply drops · 4 XP recovered/);g.el('again').click();assert.equal(g.state.supplyDrop,null);assert.equal(g.state.dropsCollected,0);assert.equal(g.state.dropXpRecovered,0);near(g.state.nextDropAt,70);assert.equal(g.el('dropGoal').textContent,'');assert.equal(result.dropXp,4);
});
test('legacy and malformed drop history cannot invent rewards or new-run utility',()=>{
  const g=loadGame({journalStored:journalData('survivor',{history:[{outcome:'extracted',time:181},{outcome:'abandoned',time:20,drops:'<img>',dropXp:'<script>'},{outcome:'defeated',time:10,drops:-4,dropXp:-8},{outcome:'extracted',time:200,drops:2,dropXp:40}]})}),h=g.state.journal.history;assert.equal(h[0].drops,null);assert.equal(h[0].dropXp,null);assert.equal(h[1].drops,null);assert.equal(h[1].dropXp,null);assert.equal(h[2].drops,0);assert.equal(h[2].dropXp,0);assert.equal(h[3].drops,2);g.showJournal();assert.doesNotMatch(g.el('modal').innerHTML,/<img|<script/);cleanRun(g);assert.equal(g.state.dropsCollected,0);assert.equal(g.state.dropXpRecovered,0);assert.equal(g.state.xp,0);assert.equal(g.state.supplyDrop,null);
});
test('all five survivor profiles can reach and collect the signal through actual movement updates',()=>{
  for(const role of ['survivor','scout','bulwark','engineer','scavenger']){
    const g=loadGame();g.showRoster();g.selectSurvivor(role);prepareDrop(g);g.setup({elapsed:70});g.update(.01);const b=g.state.supplyDrop;assert.ok(b);for(let i=0;i<300&&g.state.supplyDrop;i++){
      const d=Math.hypot(b.x-g.p.x,b.y-g.p.y);g.touch.x=d?(b.x-g.p.x)/d:0;g.touch.y=d?(b.y-g.p.y)/d:0;g.update(.02);
    }
    assert.equal(g.state.dropsCollected,1,role);assert.equal(g.state.supplyDrop,null);assert.equal(g.state.dropXpRecovered,0);near(g.p.hp,g.p.max);assert.equal(g.state.mode,'play');
  }
});

function prepareConvoy(g){cleanRun(g);g.setup({elapsed:24.99,nextConvoyAt:25,nextBossAt:90,barrels:[],obstacles:[]});g.p.fireClock=999}
function beginConvoy(g){g.setup({elapsed:25});g.updateConvoy();const e=g.state.convoy;assert.ok(e);g.setup({elapsed:e.readyAt});g.updateConvoy();assert.equal(e.phase,'active');assert.ok(g.state.enemies.includes(e));return e}
test('optional convoy signals at twenty-five seconds and becomes targetable after three seconds',()=>{
  const g=loadGame();prepareConvoy(g);g.update(.005);assert.equal(g.state.convoy,null);g.update(.01);const e=g.state.convoy;assert.ok(e);assert.equal(e.phase,'signal');assert.equal(g.state.enemies.includes(e),false);near(e.readyAt,g.state.elapsed+3);near(e.until,e.readyAt+11);near(g.state.nextConvoyAt,g.state.elapsed+120);assert.match(g.el('objective').textContent,/CONVOY.*OPTIONAL/);const hp=e.hp;g.hitEnemy(e,10000);near(e.hp,hp);g.render();g.setup({elapsed:e.readyAt});g.updateConvoy();assert.equal(e.phase,'active');assert.equal(g.state.enemies.filter(a=>a.convoy).length,1);g.updateEncounterHUD();assert.match(g.el('objective').textContent,/SHOOT FOR UPGRADE/);g.render();
});
test('convoy movement follows its fixed route in gameplay time without chasing or hurting the player',()=>{
  const g=loadGame();prepareConvoy(g);const e=beginConvoy(g);g.setup({elapsed:e.readyAt+5.5});g.updateConvoy();near(e.x,(e.a.x+e.z.x)/2);near(e.y,(e.a.y+e.z.y)/2);g.p.x=e.x;g.p.y=e.y;g.p.hp=70;g.update(.02);near(g.p.hp,70);near(g.p.inv,0);assert.equal(g.state.killCount,0);assert.equal(g.state.bonusChoices,0);assert.equal(g.state.convoy,e);
});
test('convoy routes fit the screen and avoid physical cover and fuel across two hundred generated maps',()=>{
  for(const [width,height] of [[320,640],[412,915],[915,412],[1280,720]])for(let seed=1;seed<=50;seed++){
    const g=loadGame({width,height,seed});g.start();g.setup({elapsed:25});const route=g.convoyRoute();assert.ok(route,`${width}x${height} seed ${seed}`);const r=g.convoyTuning.radius;
    for(const point of [route.a,route.z]){assert.ok(Math.abs(point.x-g.p.x)+r+22<=width/2+.001);assert.ok(Math.abs(point.y-g.p.y)+r+22<=height/2+.001)}
    assert.ok(g.state.barricades.every(b=>g.rectHitTime(b,route.a,route.z,r+20)===Infinity));assert.ok(g.state.obstacles.every(b=>g.rectHitTime(b,route.a,route.z,r+15)===Infinity));
    const dx=route.z.x-route.a.x,dy=route.z.y-route.a.y;for(const barrel of g.state.barrels){const t=Math.max(0,Math.min(1,((barrel.x-route.a.x)*dx+(barrel.y-route.a.y)*dy)/(dx*dx+dy*dy)));assert.ok(Math.hypot(barrel.x-route.a.x-dx*t,barrel.y-route.a.y-dy*t)>=r+barrel.r+20)}
  }
});
test('blocked convoy roads retry without clearing physical cover; scenery fallback opens only decoration',()=>{
  const g=loadGame();prepareConvoy(g);g.setup({elapsed:25,barricades:[barrier({x:-2000,y:-2000,w:4000,h:4000})]});g.updateConvoy();assert.equal(g.state.convoy,null);near(g.state.nextConvoyAt,30);assert.equal(g.state.barricades[0].hp,90);g.scheduleRush(Infinity);g.setup({elapsed:30,barricades:[],obstacles:[{x:-2000,y:-2000,w:4000,h:4000,type:1}]});g.updateConvoy();assert.ok(g.state.convoy);assert.equal(g.state.obstacles.length,0);assert.equal(g.state.barricadesCleared,0);
});
test('convoy route creation avoids caches, supply signals, survivors, and existing salvage',()=>{
  const g=loadGame();prepareConvoy(g);g.setup({supplyCache:{x:0,y:-55,r:19,until:999},supplyDrop:utilityDrop({x:0,y:55}),rescue:stranded({x:-90,y:0}),salvage:{x:90,y:0,r:80}});const route=g.convoyRoute();assert.ok(route);const r=g.convoyTuning.radius;
  const distance=(point)=>{const dx=route.z.x-route.a.x,dy=route.z.y-route.a.y,t=Math.max(0,Math.min(1,((point.x-route.a.x)*dx+(point.y-route.a.y)*dy)/(dx*dx+dy*dy)));return Math.hypot(point.x-route.a.x-dx*t,point.y-route.a.y-dy*t)};
  for(const point of [g.state.supplyCache,g.state.supplyDrop,g.state.rescue,g.state.salvage])assert.ok(distance(point)>=r+point.r+20);
});
test('convoys reserve a complete quiet window and defer conflicting objectives and crowded roads',()=>{
  for(const reason of ['boss soon','Blackout soon','exit soon','boss','boss warning','Blackout','relief','salvage','drop','capacity']){
    const g=loadGame();prepareConvoy(g);g.setup({elapsed:25});
    if(reason==='boss soon')g.setup({nextBossAt:45});if(reason==='Blackout soon')g.scheduleRush(40);if(reason==='exit soon')g.setup({exitAt:40});if(reason==='boss')g.spawnBoss();if(reason==='boss warning'){g.setup({nextBossAt:30});g.updateEncounter()}if(reason==='Blackout'){g.scheduleRush(25);g.updateRush(.01)}if(reason==='relief')g.setup({reliefUntil:30});if(reason==='salvage')g.setup({salvage:{x:100,y:0,r:80,until:99}});if(reason==='drop')g.setup({supplyDrop:utilityDrop()});if(reason==='capacity')g.setup({enemies:Array.from({length:238},()=>enemy({x:1000,hp:1000}))});g.updateConvoy();assert.equal(g.state.convoy,null,reason);assert.equal(g.state.convoysStopped,0);
  }
});
test('a moving convoy withdraws for higher-priority encounters, salvage, or an open exit without reward',()=>{
  for(const reason of ['boss','warning','Blackout','salvage','exit']){
    const g=loadGame();prepareConvoy(g);const e=beginConvoy(g);
    if(reason==='boss')g.spawnBoss();if(reason==='warning'){g.setup({nextBossAt:g.state.elapsed+5});g.updateEncounter()}if(reason==='Blackout'){g.scheduleRush(g.state.elapsed);g.updateRush(.01)}if(reason==='salvage')g.setup({salvage:{x:100,y:0,r:80,until:99}});if(reason==='exit'){g.setup({elapsed:180,bossesDefeated:1,nextBossAt:1000});g.updateExtractionWindow()}g.updateConvoy();assert.equal(g.state.convoy,null,reason);assert.equal(g.state.enemies.includes(e),false);assert.equal(g.state.convoysStopped,0);assert.equal(g.state.convoyRewardPending,false);assert.equal(g.state.gems.length,0);assert.equal(g.state.killCount,0);
  }
});
test('expiry and distant abandonment remove the target without penalties or a free upgrade',()=>{
  for(const reason of ['expiry','distance']){const g=loadGame();prepareConvoy(g);const e=beginConvoy(g);if(reason==='expiry')g.setup({elapsed:e.until});else g.p.x+=2000;g.updateConvoy();assert.equal(g.state.convoy,null);assert.equal(g.state.enemies.includes(e),false);assert.equal(g.state.convoysStopped,0);assert.equal(g.state.bonusChoices,0);near(g.p.hp,100)}
});
test('two lethal gun hits stop the truck once and reward only after surviving combat',()=>{
  const g=loadGame();prepareConvoy(g);const e=beginConvoy(g);e.x=100;e.y=0;e.hp=10;g.setup({bullets:[bullet(),bullet()],xp:7});g.updateProjectiles(.01);assert.equal(g.state.convoy,null);assert.equal(g.state.convoyRewardPending,true);assert.equal(g.state.convoysStopped,0);assert.equal(g.state.killCount,0);assert.equal(g.state.gems.length,0);g.resolveConvoyReward();g.resolveConvoyReward();assert.equal(g.state.convoysStopped,1);assert.equal(g.state.bonusChoices,1);g.checkLevelUp();assert.equal(g.state.mode,'upgrade');assert.match(g.el('modal').innerHTML,/CONVOY INTERCEPTED · BONUS UPGRADE/);assert.equal(g.state.xp,7);g.choices()[0].click(1);assert.equal(g.state.mode,'upgrade');g.choose(0);assert.equal(g.state.mode,'play');assert.equal(g.state.bonusChoices,0);assert.equal(g.state.killCount,0);
});
test('lightning, blades, and fire damage convoy armor without inventing enemy eliminations',()=>{
  for(const weapon of ['lightning','blades','fire']){
    const g=loadGame();prepareConvoy(g);const e=beginConvoy(g);e.hp=1;e.x=100;e.y=0;
    if(weapon==='lightning'){g.p.arc=1;g.fireLightning()}if(weapon==='blades'){g.p.blades=1;const b=g.bladePositions()[0];e.x=b.x;e.y=b.y;g.updateWeapons(.01,g.p)}if(weapon==='fire'){g.setup({fires:[groundFire()]});g.updateMolotov(.01)}assert.equal(g.state.convoy,null,weapon);g.resolveConvoyReward();assert.equal(g.state.convoysStopped,1);assert.equal(g.state.killCount,0);assert.equal(g.state.burnKills,0);assert.equal(g.state.bossesDefeated,0);assert.equal(g.state.gems.length,0);
  }
});
test('fuel can stop a convoy without blast-kill credit or knocking a surviving truck off its route',()=>{
  const g=loadGame();prepareConvoy(g);const e=beginConvoy(g);e.x=100;e.y=0;e.hp=1000;const b=fuel(100);g.setup({barrels:[b]});g.detonateBarrel(b);near(e.x,100);near(e.y,0);assert.ok(e.hp<1000);assert.equal(g.state.blastKills,0);e.hp=1;const second=fuel(100);g.setup({barrels:[second]});g.detonateBarrel(second);g.resolveConvoyReward();assert.equal(g.state.convoysStopped,1);assert.equal(g.state.blastKills,0);assert.equal(g.state.killCount,0);assert.equal(g.state.barrelsBlown,2);
});
test('death on the truck stopping frame denies convoy credit and its upgrade for melee and ranged hits',()=>{
  for(const kind of ['melee','ranged']){
    const g=loadGame();prepareConvoy(g);const e=beginConvoy(g);e.hp=1;e.a={x:100,y:0};e.z={x:100,y:0};e.x=100;e.y=0;g.p.hp=1;g.setup({bullets:[bullet()]});
    if(kind==='melee')g.state.enemies.push(enemy({x:0,hp:10000}));else g.setup({hostileShots:[hostileShot({x:-30,vx:1000})]});g.update(.02);assert.equal(g.state.mode,'end');assert.equal(g.state.convoysStopped,0);assert.equal(g.state.bonusChoices,0);assert.equal(g.state.runResult.convoys,0);g.resolveConvoyReward();assert.equal(g.state.convoysStopped,0);
  }
});
test('new wood and medical caches preserve the entire active convoy route',()=>{
  const g=loadGame();prepareConvoy(g);const e=beginConvoy(g);for(let i=0;i<50;i++)g.placeBarricade();assert.ok(g.state.barricades.length>0);assert.ok(g.state.barricades.every(b=>g.rectHitTime(b,e.a,e.z,e.r+20)===Infinity));assert.equal(g.placeSupply(),true);const b=g.state.supplyCache,dx=e.z.x-e.a.x,dy=e.z.y-e.a.y,t=Math.max(0,Math.min(1,((b.x-e.a.x)*dx+(b.y-e.a.y)*dy)/(dx*dx+dy*dy)));assert.ok(Math.hypot(b.x-e.a.x-dx*t,b.y-e.a.y-dy*t)>=e.r+b.r+20);
});
test('new salvage, supply signals, and waiting rescue opportunities defer while a convoy is active',()=>{
  const g=loadGame();prepareConvoy(g);beginConvoy(g);g.setup({nextSalvageAt:0,nextDropAt:0,nextRescueAt:0});g.updateSalvageAvailability();g.updateDrops(.01,g.p);g.updateRescueAvailability();assert.equal(g.state.salvage,null);assert.equal(g.state.supplyDrop,null);assert.equal(g.state.rescue,null);
});
test('signal activation preserves the reserved boss slot when target capacity fills',()=>{
  const g=loadGame();prepareConvoy(g);g.setup({elapsed:25});g.updateConvoy();const e=g.state.convoy;g.setup({elapsed:e.readyAt,enemies:Array.from({length:239},()=>enemy({x:1000,hp:1000}))});g.updateConvoy();assert.equal(g.state.convoy,null);assert.equal(g.state.enemies.length,239);near(g.state.nextConvoyAt,g.state.elapsed+5);assert.equal(g.state.convoysStopped,0);
});
test('pause, upgrade, extraction choice, and results freeze convoy movement, health, and schedules',()=>{
  for(const mode of ['pause','upgrade','extraction','end']){
    const g=loadGame();if(mode==='extraction')prepareExit(g);else prepareConvoy(g);const e={a:{x:0,y:100},z:{x:200,y:100},x:0,y:100,r:28,hp:200,max:200,convoy:true,phase:'active',readyAt:g.state.elapsed,until:g.state.elapsed+11,hit:0,col:'#a8cbd3',type:6};g.setup({convoy:e,enemies:[e],nextConvoyAt:145});
    if(mode==='pause')g.pause();if(mode==='upgrade')earnUpgrade(g);if(mode==='extraction')reachExit(g);if(mode==='end'){g.pause();quitForTest(g)}const time=g.state.elapsed;g.update(100);g.updateConvoy();g.hitEnemy(e,10000);g.resolveConvoyReward();assert.equal(g.state.convoy,e);near(e.hp,200);near(e.x,0);near(e.y,100);near(g.state.elapsed,time);near(g.state.nextConvoyAt,145);assert.equal(g.state.convoysStopped,0);
  }
});
test('a convoy bonus precedes earned XP and Night Watch still requires actual bosses',()=>{
  const g=loadGame();startContract(g,'bosses');g.setup({elapsed:25,nextConvoyAt:25,barrels:[],obstacles:[],nextBossAt:1000});g.scheduleRush(Infinity);const e=beginConvoy(g);g.setup({xp:8});g.hitEnemy(e,10000);g.resolveConvoyReward();g.checkLevelUp();assert.match(g.el('modal').innerHTML,/CONVOY INTERCEPTED/);g.choose(0);assert.match(g.el('modal').innerHTML,/LEVEL 3 REACHED/);g.choose(0);assert.equal(g.state.mode,'play');assert.equal(g.contractProgress(),0);assert.equal(g.state.contractCompleted,false);assert.equal(g.state.bossesDefeated,0);assert.equal(g.state.xp,0);
});
test('all profiles can intercept a moving convoy with their unupgraded gun without taking truck damage',()=>{
  for(const role of ['survivor','scout','bulwark','engineer','scavenger']){
    const g=loadGame();g.showRoster();g.selectSurvivor(role);prepareConvoy(g);const e=beginConvoy(g);g.p.x=e.x-45;g.p.y=e.y;g.p.fireClock=0;
    for(let i=0;i<550&&g.state.mode==='play';i++){
      if(g.state.convoy){const d=Math.hypot(e.x-g.p.x,e.y-g.p.y);g.touch.x=d>40?(e.x-g.p.x)/d:0;g.touch.y=d>40?(e.y-g.p.y)/d:0}g.update(.02);
    }
    assert.equal(g.state.mode,'upgrade',role);assert.equal(g.state.convoysStopped,1);assert.equal(g.state.killCount,0);near(g.p.hp,g.p.max);assert.equal(g.state.xp,0);assert.equal(g.p.damage,18);
  }
});
test('convoy results and journal retain one intercept while retry clears routes, pending reward, and schedule',()=>{
  const g=loadGame();prepareConvoy(g);const e=beginConvoy(g);g.hitEnemy(e,10000);g.resolveConvoyReward();g.checkLevelUp();g.choose(0);g.pause();quitForTest(g);const result=g.state.runResult;assert.equal(result.convoys,1);assert.match(g.el('modal').innerHTML,/<strong>1<\/strong><small>CONVOYS INTERCEPTED/);const next=loadGame({journalStored:g.journalSaved()});next.showJournal();assert.match(next.el('modal').innerHTML,/1 convoys intercepted/);g.el('again').click();assert.equal(g.state.convoy,null);assert.equal(g.state.convoysStopped,0);assert.equal(g.state.convoyRewardPending,false);near(g.state.nextConvoyAt,25);assert.equal(result.convoys,1);
});
test('legacy convoy history is optional and cannot grant a fresh-run bonus or route',()=>{
  const g=loadGame({journalStored:journalData('survivor',{history:[{outcome:'extracted',time:181},{outcome:'abandoned',time:20,convoys:'<img>'},{outcome:'defeated',time:30,convoys:-5},{outcome:'extracted',time:400,convoys:3}]})}),h=g.state.journal.history;assert.equal(h[0].convoys,null);assert.equal(h[1].convoys,null);assert.equal(h[2].convoys,0);assert.equal(h[3].convoys,3);g.showJournal();assert.doesNotMatch(g.el('modal').innerHTML,/<img/);cleanRun(g);assert.equal(g.state.convoy,null);assert.equal(g.state.convoysStopped,0);assert.equal(g.state.bonusChoices,0);
});

function engineerRun(g){g.showRoster();g.selectSurvivor('engineer');cleanRun(g);g.setup({barrels:[],obstacles:[]})}
test('Engineer selection supports secondary touch, persists the roster choice, and starts the stated tradeoff',()=>{
  const g=loadGame({stored:'80'});g.showRoster();g.el('role-engineer').dispatch('pointerdown',{pointerId:3,isPrimary:false});assert.equal(g.state.selectedSurvivor,'engineer');assert.match(g.el('deploy').textContent,/ENGINEER/);assert.match(g.el('survivorDetail').textContent,/20%.*0\.6s/);g.el('deploy').dispatch('pointerdown',{pointerId:4,isPrimary:false});assert.equal(g.state.runSurvivor,'engineer');near(g.p.hp,95);near(g.p.speed,200);near(g.p.damage,18);near(g.p.fire,.33);assert.equal(g.p.proj,1);assert.equal(g.saved(),'80');const next=loadGame({journalStored:g.journalSaved()});cleanRun(next);assert.equal(next.state.runSurvivor,'engineer');near(next.fuelRadius(),174);g.render();
});
test('Engineer fuel reaches farther without increasing blast damage or changing the original profiles',()=>{
  for(const role of ['survivor','scout','bulwark','engineer','scavenger']){
    const g=loadGame({journalStored:journalData(role)});cleanRun(g);const nearEnemy=enemy({x:100,hp:300,r:10}),edge=enemy({x:170,hp:300,r:10}),outside=enemy({x:200,hp:300,r:10}),b=fuel(0);g.setup({elapsed:0,barrels:[b],enemies:[nearEnemy,edge,outside]});g.detonateBarrel(b);near(nearEnemy.hp,180);near(edge.hp,role==='engineer'?180:300);near(outside.hp,300);near(g.fuelRadius(),role==='engineer'?174:145);near(g.state.blastRings[0].radius,role==='engineer'?174:145);near(g.p.hp,g.p.max);assert.equal(g.state.killCount,0);g.render();
  }
});
test('wider Engineer chain reach preserves one kill, XP drop, barrel credit, and demolition reward accounting',()=>{
  const g=loadGame();g.showRoster();g.selectSurvivor('engineer');g.selectContract('demolition');cleanRun(g);g.setup({elapsed:0,barrels:[fuel(0),fuel(180),fuel(370)],enemies:[enemy({x:180,hp:1,r:10})]});g.detonateBarrel(g.state.barrels[0]);assert.equal(g.state.barrelsBlown,3);assert.equal(g.state.killCount,1);assert.equal(g.state.blastKills,1);assert.equal(g.state.gems.length,1);assert.equal(g.state.gems[0].value,1);g.checkLevelUp();assert.equal(g.state.contractCompleted,true);assert.match(g.el('modal').innerHTML,/CONTRACT COMPLETE/);g.choose(0);assert.equal(g.state.mode,'play');
  const base=loadGame();cleanRun(base);base.setup({barrels:[fuel(0),fuel(180),fuel(370)]});base.detonateBarrel(base.state.barrels[0]);assert.equal(base.state.barrelsBlown,1);
});
test('Engineer blast edge breaks wood and triggers only the normal player-clear credit and Scrapwork',()=>{
  for(const role of ['survivor','engineer']){
    const g=loadGame({journalStored:journalData(role)});cleanRun(g);g.p.dashCd=2;const b=fuel(0),wood=barrier({x:160});g.setup({barrels:[b],barricades:[wood]});g.detonateBarrel(b);near(wood.hp,role==='engineer'?0:90);assert.equal(g.state.barricadesCleared,role==='engineer'?1:0);near(g.p.dashCd,role==='engineer'?1.4:2);assert.equal(g.state.scrapRefreshes,role==='engineer'?1:0);assert.equal(g.state.killCount,0);assert.equal(g.state.gems.length,0);
  }
});
test('Scrapwork responds to player dash, gun, barrel, and fire clears without granting healing or combat power',()=>{
  for(const source of ['dash','gun','barrel','fire']){
    const g=loadGame();engineerRun(g);g.p.dashCd=2;g.p.hp=70;const damage=g.p.damage,speed=g.p.speed,inv=g.p.inv,b=barrier();g.damageBarricade(b,90,source);near(g.p.dashCd,1.4);assert.equal(g.state.scrapRefreshes,1);near(g.state.scrapRecovered,.6);near(g.state.nextScrapAt,1);near(g.p.hp,70);near(g.p.damage,damage);near(g.p.speed,speed);near(g.p.inv,inv);assert.equal(g.state.xp,0);assert.equal(g.state.bonusChoices,0);assert.equal(g.state.gems.length,0);assert.ok(g.state.texts.some(t=>String(t.t).includes('SCRAPWORK')));
  }
});
test('partial wood damage and repeated damage to a destroyed barricade cannot duplicate Scrapwork',()=>{
  const g=loadGame();engineerRun(g);g.p.dashCd=2;const b=barrier();g.damageBarricade(b,45,'gun');near(g.p.dashCd,2);assert.equal(g.state.scrapRefreshes,0);g.damageBarricade(b,45,'gun');near(g.p.dashCd,1.4);g.damageBarricade(b,90,'fire');g.damageBarricade(b,90,'dash');assert.equal(g.state.scrapRefreshes,1);assert.equal(g.state.barricadesCleared,1);near(g.state.scrapRecovered,.6);
});
test('Scrapwork clamps to remaining Dash cooldown and does not consume a proc when Dash is already ready',()=>{
  const g=loadGame();engineerRun(g);g.damageBarricade(barrier(),90,'dash');assert.equal(g.state.scrapRefreshes,0);near(g.state.nextScrapAt,0);g.p.dashCd=.2;g.damageBarricade(barrier(),90,'gun');near(g.p.dashCd,0);near(g.state.scrapRecovered,.2);assert.equal(g.state.scrapRefreshes,1);assert.ok(g.state.texts.some(t=>t.t==='SCRAPWORK • DASH READY'));g.damageBarricade(barrier(),90,'gun');assert.equal(g.state.scrapRefreshes,1);
});
test('several simultaneous wood clears recover at most one Scrapwork charge per gameplay second',()=>{
  const g=loadGame();engineerRun(g);g.p.dashCd=2.5;for(let i=0;i<5;i++)g.damageBarricade(barrier(),90,'barrel');near(g.p.dashCd,1.9);assert.equal(g.state.scrapRefreshes,1);assert.equal(g.state.barricadesCleared,5);g.setup({elapsed:.99});g.damageBarricade(barrier(),90,'fire');near(g.p.dashCd,1.9);g.setup({elapsed:1});g.damageBarricade(barrier(),90,'gun');near(g.p.dashCd,1.3);assert.equal(g.state.scrapRefreshes,2);near(g.state.scrapRecovered,1.2);
});
test('a real Engineer dash smashing two barricades receives one recovery while original survivors receive none',()=>{
  for(const role of ['survivor','scout','bulwark','engineer','scavenger']){
    const g=loadGame({journalStored:journalData(role)});cleanRun(g);g.setup({barrels:[],obstacles:[],barricades:[barrier({x:60}),barrier({x:100})]});g.keys.d=true;g.dash();g.update(.15);assert.equal(g.state.barricadesCleared,2);near(g.p.dashCd,role==='engineer'?1.75:2.35);assert.equal(g.state.scrapRefreshes,role==='engineer'?1:0);assert.equal(g.state.killCount,0);near(g.p.hp,g.p.max);g.dash();near(g.p.dashCd,role==='engineer'?1.75:2.35);
  }
});
test('enemy, boss, and exit wood destruction never grant Engineer Scrapwork',()=>{
  for(const source of ['enemy','boss','exit']){const g=loadGame();engineerRun(g);g.p.dashCd=2;g.damageBarricade(barrier(),90,source);near(g.p.dashCd,2);assert.equal(g.state.scrapRefreshes,0);near(g.state.nextScrapAt,0)}
  const dead=loadGame();engineerRun(dead);dead.p.hp=0;dead.p.dashCd=2;dead.damageBarricade(barrier(),90,'gun');near(dead.p.dashCd,2);assert.equal(dead.state.scrapRefreshes,0);
});
test('green-door return retains its original clearing radius and protection without free Engineer recovery',()=>{
  const g=loadGame();g.showRoster();g.selectSurvivor('engineer');prepareExit(g);const gate=g.state.exitBeacon;g.setup({barricades:[barrier({x:gate.x,y:gate.y})]});reachExit(g);g.p.dashCd=2;chooseExitForTest(g,'stay');assert.equal(g.state.mode,'play');assert.equal(g.state.scrapRefreshes,0);near(g.p.dashCd,2);near(g.p.inv,1.5);near(g.fuelRadius(),174);assert.ok(g.state.blastRings.some(r=>r.radius===160));assert.equal(g.state.barricadesCleared,1);near(g.p.hp,95);
});
test('paused and choice modes freeze the Scrapwork lockout and cannot award additional recovery',()=>{
  for(const mode of ['pause','upgrade','extraction','end']){
    const g=loadGame();g.showRoster();g.selectSurvivor('engineer');if(mode==='extraction')prepareExit(g);else cleanRun(g);g.p.dashCd=2;g.damageBarricade(barrier(),90,'gun');const due=g.state.nextScrapAt,clock=g.p.dashCd,time=g.state.elapsed;
    if(mode==='pause')g.pause();if(mode==='upgrade')earnUpgrade(g);if(mode==='extraction')reachExit(g);if(mode==='end'){g.pause();quitForTest(g)}g.update(100);g.damageBarricade(barrier(),90,'fire');near(g.state.elapsed,time);near(g.state.nextScrapAt,due);near(g.p.dashCd,clock);assert.equal(g.state.scrapRefreshes,1);
  }
});
test('Engineer results and history retain Scrapwork measurements while retry and profile changes reset them',()=>{
  const g=loadGame();engineerRun(g);g.p.dashCd=2;g.damageBarricade(barrier(),90,'gun');g.pause();assert.match(g.el('modal').innerHTML,/20%.*0\.6s/);quitForTest(g);const result=g.state.runResult;assert.equal(result.survivor,'engineer');assert.equal(result.scrapRefreshes,1);near(result.scrapRecovered,.6);assert.match(g.el('modal').innerHTML,/SCRAPWORK REFRESHES/);assert.match(g.el('modal').innerHTML,/DASH SECONDS RECOVERED/);const next=loadGame({journalStored:g.journalSaved()});next.showJournal();assert.match(next.el('modal').innerHTML,/Engineer/);assert.match(next.el('modal').innerHTML,/Scrapwork: 1 Dash refreshes · 0.6s recovered/);g.el('again').click();near(g.p.hp,95);near(g.fuelRadius(),174);assert.equal(g.state.scrapRefreshes,0);near(g.state.scrapRecovered,0);near(g.state.nextScrapAt,0);g.pause();quitForTest(g);g.el('changeSurvivor').click();g.selectSurvivor('survivor');g.el('deploy').click();near(g.fuelRadius(),145);g.p.dashCd=2;g.damageBarricade(barrier(),90,'gun');near(g.p.dashCd,2);assert.equal(g.state.scrapRefreshes,0);assert.equal(result.scrapRefreshes,1);
});
test('old and malformed Scrapwork history cannot create cooldown recovery or alter Engineer base stats',()=>{
  const g=loadGame({journalStored:journalData('engineer',{damage:999,hp:999,speed:999,scrapRefreshes:999,nextScrapAt:999,history:[{outcome:'extracted',time:181},{outcome:'defeated',time:10,survivor:'engineer',scrapRefreshes:'<img>',scrapRecovered:'<script>'},{outcome:'abandoned',time:20,survivor:'engineer',scrapRefreshes:-5,scrapRecovered:-2},{outcome:'extracted',time:300,survivor:'engineer',scrapRefreshes:3,scrapRecovered:1.8}]})}),h=g.state.journal.history;assert.equal(h[0].scrapRefreshes,null);assert.equal(h[0].scrapRecovered,null);assert.equal(h[1].scrapRefreshes,null);assert.equal(h[1].scrapRecovered,null);assert.equal(h[2].scrapRefreshes,0);assert.equal(h[2].scrapRecovered,0);g.showJournal();assert.doesNotMatch(g.el('modal').innerHTML,/<img|<script/);cleanRun(g);near(g.p.hp,95);near(g.p.speed,200);near(g.p.damage,18);near(g.fuelRadius(),174);near(g.state.nextScrapAt,0);assert.equal(g.state.scrapRefreshes,0);near(g.state.scrapRecovered,0);
});
test('purple utility drops refresh Engineer Dash without inventing Scrapwork triggers',()=>{
  const g=loadGame();engineerRun(g);g.setup({elapsed:74,nextDropAt:170,supplyDrop:utilityDrop({x:0,phase:'ready'}),gems:[]});g.p.dashCd=2;g.updateDrops(.01,g.p);near(g.p.dashCd,0);assert.equal(g.state.dropsCollected,1);assert.equal(g.state.scrapRefreshes,0);near(g.state.nextScrapAt,0);g.damageBarricade(barrier(),90,'gun');assert.equal(g.state.scrapRefreshes,0);near(g.p.hp,95);
});
test('Engineer keeps the accepted Molotov and Wildfire limits and weapon upgrade rules',()=>{
  const base=loadGame();cleanRun(base);Object.assign(base.p,{molotov:3,wildfire:true});const expected={...base.molotovStats()};const g=loadGame();engineerRun(g);Object.assign(g.p,{molotov:3,wildfire:true});assert.deepEqual({...g.molotovStats()},expected);assert.equal(g.limits.fires,2);assert.equal(g.limits.bottles,2);earnUpgrade(g);assert.equal(g.choices().length,3);g.choices()[0].click(1);assert.equal(g.state.mode,'upgrade');g.choose(0);assert.equal(g.state.mode,'play');
});

function guideIds(g){return [...g.el('modal').innerHTML.matchAll(/data-enemy="([^"]+)"/g)].map(match=>match[1])}
function sumTally(tally){return Object.values(tally).reduce((sum,value)=>sum+value,0)}
function finishForGuide(g){g.pause();quitForTest(g);assert.equal(g.state.mode,'end')}
test('fresh Bestiary opens from menu with all eleven tactics and zero recorded defeats without saving',()=>{
  const g=loadGame();assert.equal(g.el('bestiaryOpen'),undefined);const saved=g.journalSaved();g.openHomeEntry('bestiaryOpen');assert.equal(g.state.mode,'bestiary');assert.equal(g.state.bestiaryReturn,'journal');assert.equal(guideIds(g).length,11);assert.match(g.el('modal').innerHTML,/Counts track completed runs from Alpha 0.25 onward/);assert.equal((g.el('modal').innerHTML.match(/Defeated: 0/g)||[]).length,11);assert.match(g.el('modal').innerHTML,/Railstorm.*SHIELD DOWN/);assert.match(g.el('modal').innerHTML,/gaps between lanes/);assert.equal(g.journalSaved(),saved);g.el('bestiaryBack').click();assert.equal(g.state.mode,'journal');assert.ok(g.el('journalBack'));assert.equal(g.state.journal.totals.runs,0);
});
test('native Bestiary filters show the correct groups and reject invalid or stale changes',()=>{
  const g=loadGame();g.showBestiary();let old;
  for(const [filter,count] of [['horde',4],['specialist',4],['boss',3],['all',11]]){old=g.el('bestiaryFilter');old.value=filter;old.dispatch('change');assert.equal(g.state.bestiaryFilter,filter);assert.equal(guideIds(g).length,count);assert.equal(g.el('bestiaryFilter').value,filter)}
  old.value='boss';old.dispatch('change');assert.equal(g.state.bestiaryFilter,'all');g.setBestiaryFilter('<img>');assert.equal(g.state.bestiaryFilter,'all');assert.doesNotMatch(g.el('modal').innerHTML,/<img/);assert.equal(sumTally(g.state.journal.bestiary),0);
});
test('each actual enemy species is counted once while bosses retain their existing rewards',()=>{
  const g=loadGame();cleanRun(g);const targets=[enemy(),enemy({type:1}),enemy({type:2}),enemy({type:1,rush:true}),spitter(),riot(),howler(),enemy({type:8,lobber:true})];g.setup({enemies:targets});
  for(const e of targets){g.hitEnemy(e,1e6);g.hitEnemy(e,1e6)}
  for(const kind of ['breaker','warden','harvester']){g.spawnBoss(kind);const b=g.state.activeBoss;g.hitEnemy(b,1e6);g.hitEnemy(b,1e6)}
  assert.equal(g.state.killCount,11);assert.equal(sumTally(g.state.enemyTally),11);for(const value of Object.values(g.state.enemyTally))assert.equal(value,1);assert.equal(g.state.bossesDefeated,3);assert.equal(g.state.wardensDefeated,1);assert.equal(sumTally(g.state.journal.bestiary),0);finishForGuide(g);for(const value of Object.values(g.state.journal.bestiary))assert.equal(value,1);assert.equal(g.state.runResult.enemyTally.breaker,1);assert.equal(g.state.runResult.enemyTally.warden,1);
});
test('lethal duplicate bullets update the run tally once and write Bestiary counts only on completion',()=>{
  const g=loadGame();cleanRun(g);g.p.fireClock=999;g.setup({enemies:[enemy()],bullets:[bullet(),bullet()]});const saved=g.journalSaved();g.update(.02);assert.equal(g.state.enemyTally.shambler,1);assert.equal(g.state.killCount,1);assert.equal(g.state.journal.bestiary.shambler,0);assert.equal(g.journalSaved(),saved);finishForGuide(g);assert.equal(g.state.journal.bestiary.shambler,1);assert.equal(JSON.parse(g.journalSaved()).bestiary.shambler,1);
});
test('weapon-independent Bestiary classification preserves fire, fuel, and lightning kill accounting',()=>{
  const g=loadGame();prepareFire(g);const runner=enemy({type:1,hp:1}),brute=enemy({type:2,hp:1}),pink=spitter({hp:1});g.setup({enemies:[runner],fires:[groundFire()]});g.updateMolotov(.01);g.setup({fires:[],enemies:[brute],barrels:[fuel(100)]});g.detonateBarrel(g.state.barrels[0]);g.setup({enemies:[pink]});g.p.arc=1;g.fireLightning();assert.equal(g.state.enemyTally.runner,1);assert.equal(g.state.enemyTally.brute,1);assert.equal(g.state.enemyTally.spitter,1);assert.equal(g.state.killCount,3);assert.equal(g.state.burnKills,1);assert.equal(g.state.blastKills,1);finishForGuide(g);assert.equal(sumTally(g.state.journal.bestiary),3);
});
test('convoys, wood, and unknown synthetic types cannot invent enemy or boss field-guide entries',()=>{
  const g=loadGame();prepareConvoy(g);const e=beginConvoy(g);g.hitEnemy(e,1e6);g.resolveConvoyReward();g.damageBarricade(barrier(),90,'gun');assert.equal(g.state.convoysStopped,1);assert.equal(g.state.killCount,0);assert.equal(sumTally(g.state.enemyTally),0);assert.equal(g.enemySpecies({convoy:true}),null);assert.equal(g.enemySpecies(enemy({type:3,bossKind:'warden'})),null);finishForGuide(g);assert.equal(sumTally(g.state.journal.bestiary),0);
});
test('recorded Bestiary totals survive history trimming and do not re-add recent runs on reload',()=>{
  const g=loadGame();
  for(let i=0;i<12;i++){cleanRun(g);const e=enemy({x:200});g.hitEnemy(e,20);finishForGuide(g)}
  assert.equal(g.state.journal.history.length,8);assert.equal(g.state.journal.bestiary.shambler,12);assert.equal(g.state.journal.totals.runs,12);const next=loadGame({journalStored:g.journalSaved()});assert.equal(next.state.journal.bestiary.shambler,12);next.showBestiary();assert.match(next.el('modal').innerHTML,/12 recorded defeats/);assert.equal(next.state.journal.totals.runs,12);
});
test('older unclassified kills and boss totals remain in Run Log without invented Bestiary breakdowns',()=>{
  const raw=journalData('scout',{totals:{runs:20,breakers:50,wardens:10},history:[{outcome:'extracted',time:400,kills:9999,breakers:5,wardens:2},{outcome:'defeated',time:20,kills:3,enemyTally:{runner:3}}]});const g=loadGame({journalStored:raw});assert.equal(g.state.journal.bestiary.runner,3);assert.equal(g.state.journal.bestiary.breaker,0);assert.equal(g.state.journal.bestiary.warden,0);assert.equal(g.state.journal.history[0].enemyTally,null);assert.equal(g.state.journal.totals.breakers,50);g.showBestiary();assert.match(g.el('modal').innerHTML,/Earlier runs remain in Run Log/);assert.equal(g.journalSaved(),raw);g.closeBestiary();g.showJournal();assert.match(g.el('modal').innerHTML,/9999 eliminations/);
});
test('malformed Bestiary counters are bounded, known-key-only, and unable to inject UI or player powers',()=>{
  const raw=journalData('engineer',{bestiary:{shambler:-5,runner:'99',brute:1e30,hunter:2.9,spitter:'<img>',riot:null,breaker:2,warden:3,'<script>':100,damage:1e9},history:[{outcome:'defeated',time:10,enemyTally:['<img>']}]});const g=loadGame({journalStored:raw}),b=g.state.journal.bestiary;assert.equal(b.shambler,0);assert.equal(b.runner,0);assert.equal(b.brute,1e9);assert.equal(b.hunter,2);assert.equal(b.spitter,0);assert.equal(b.riot,0);assert.equal(b.breaker,2);assert.equal(b.warden,3);assert.equal(Object.keys(b).length,11);assert.equal(g.state.journal.history[0].enemyTally,null);g.showBestiary();assert.doesNotMatch(g.el('modal').innerHTML,/<img|<script/);g.closeBestiary();cleanRun(g);near(g.p.damage,18);near(g.p.hp,95);assert.equal(sumTally(g.state.enemyTally),0);assert.equal(g.state.bonusChoices,0);
});
test('recent classified rows can recover missing counters without double counting stored lifetime totals',()=>{
  for(const [stored,expected] of [[2,8],[20,20]]){
    const g=loadGame({journalStored:journalData('survivor',{bestiary:{shambler:stored},history:[{outcome:'defeated',time:10,enemyTally:{shambler:3}},{outcome:'defeated',time:20,enemyTally:{shambler:5}}]})});assert.equal(g.state.journal.bestiary.shambler,expected);cleanRun(g);g.hitEnemy(enemy(),20);finishForGuide(g);assert.equal(g.state.journal.bestiary.shambler,expected+1);
  }
});
test('results to Bestiary and back preserve the same held snapshot, scene, record, and one logged completion',()=>{
  const g=loadGame();cleanRun(g);g.setup({elapsed:35});g.hitEnemy(enemy(),20);finishForGuide(g);const result=g.state.runResult,html=g.el('modal').innerHTML,saved=g.journalSaved(),record=g.saved(),draws=g.drawCount(),oldAgain=g.el('again'),open=g.el('endBestiary');open.dispatch('pointerup',{pointerId:7});open.click(1);assert.equal(g.state.mode,'end');open.dispatch('pointerdown',{pointerId:8});open.dispatch('pointerup',{pointerId:8});assert.equal(g.state.mode,'bestiary');assert.equal(g.state.bestiaryReturn,'end');g.frame(16);g.frame(32);g.update(100);assert.equal(g.drawCount(),draws);oldAgain.click();assert.equal(g.state.mode,'bestiary');g.setBestiaryFilter('boss');g.el('bestiaryBackBottom').dispatch('pointerdown',{pointerId:9,isPrimary:false});assert.equal(g.state.mode,'end');assert.equal(g.state.runResult,result);assert.equal(g.el('modal').innerHTML,html);assert.equal(g.journalSaved(),saved);assert.equal(g.saved(),record);assert.equal(g.state.journal.totals.runs,1);assert.equal(g.state.journal.bestiary.shambler,1);assert.equal(g.drawCount(),draws);near(g.state.elapsed,35);
});
test('returning from Bestiary preserves a failed-record-write warning and temporary guide counts',()=>{
  const original=journalData();const g=loadGame({stored:'10',journalStored:original,writeBlocked:true});cleanRun(g);g.setup({elapsed:20});g.hitEnemy(enemy(),20);finishForGuide(g);assert.equal(g.state.runRecordSaved,false);const html=g.el('modal').innerHTML;g.el('endBestiary').click();assert.match(g.el('modal').innerHTML,/lasts for this visit/);assert.equal(g.state.journal.bestiary.shambler,1);g.closeBestiary();assert.equal(g.el('modal').innerHTML,html);assert.match(g.el('modal').innerHTML,/this best time lasts for this visit/);assert.equal(g.journalSaved(),original);assert.equal(g.saved(),'10');
});
test('blocked storage and future journal versions support a temporary Bestiary without overwriting data',()=>{
  for(const options of [{storageBlocked:true},{journalStored:JSON.stringify({version:2,selected:'engineer',futureField:'preserve'})}]){
    const g=loadGame(options),raw=g.journalSaved();g.showBestiary();assert.equal(guideIds(g).length,11);g.closeBestiary();cleanRun(g);g.hitEnemy(enemy(),20);finishForGuide(g);g.showBestiary();assert.equal(g.state.journal.bestiary.shambler,1);g.closeBestiary();assert.equal(g.state.mode,'end');assert.equal(g.journalSaved(),raw);
  }
});
test('Bestiary navigation cannot replace active, paused, upgrade, or extraction gameplay',()=>{
  for(const target of ['play','paused','upgrade','extraction']){
    const g=loadGame();if(target==='extraction'){prepareExit(g);reachExit(g)}else cleanRun(g);if(target==='paused')g.pause();if(target==='upgrade')earnUpgrade(g);const mode=g.state.mode,time=g.state.elapsed,hp=g.p.hp;g.showBestiary();g.setBestiaryFilter('boss');g.closeBestiary();g.showRunResult();assert.equal(g.state.mode,mode);near(g.state.elapsed,time);near(g.p.hp,hp);assert.equal(g.state.journal.totals.runs,0);
  }
});
test('retry resets only the run tally and new completed runs add their own species exactly once',()=>{
  const g=loadGame();cleanRun(g);g.hitEnemy(enemy(),20);finishForGuide(g);g.showBestiary();g.closeBestiary();g.el('again').click();assert.equal(sumTally(g.state.enemyTally),0);assert.equal(g.state.journal.bestiary.shambler,1);g.hitEnemy(enemy({type:1}),20);finishForGuide(g);assert.equal(g.state.journal.bestiary.shambler,1);assert.equal(g.state.journal.bestiary.runner,1);assert.equal(g.state.runResult.enemyTally.runner,1);assert.equal(g.state.runResult.enemyTally.shambler,0);assert.equal(g.state.journal.totals.runs,2);near(g.p.damage,18);assert.equal(g.state.bonusChoices,0);
});
test('per-run enemy breakdown snapshots are frozen copies and history cannot mutate a later tally',()=>{
  const g=loadGame();cleanRun(g);g.hitEnemy(enemy(),20);const snapshot=g.currentRunStats();assert.equal(Object.isFrozen(snapshot.enemyTally),true);g.hitEnemy(enemy(),20);assert.equal(snapshot.enemyTally.shambler,1);assert.equal(g.state.enemyTally.shambler,2);finishForGuide(g);assert.equal(Object.isFrozen(g.state.runResult.enemyTally),true);const row=g.state.journal.history[0];g.el('again').click();assert.equal(g.state.enemyTally.shambler,0);assert.equal(row.enemyTally.shambler,2);assert.equal(g.state.journal.bestiary.shambler,2);
});

// Alpha 0.26: shared live portraits and the between-run weapon reference.
test('Bestiary portraits use the live drawing instructions for every species, not glyphs',()=>{
  const g=loadGame({traceCanvas:true,preferencesStored:JSON.stringify({version:1,actors:'classic'})});g.showBestiary();assert.doesNotMatch(g.el('modal').innerHTML,/field-icon/);
  for(const entry of g.enemyGuide){
    const canvas=g.el('portrait-'+entry.id);assert.ok(canvas);const e=g.enemyPortraitEntity(entry.id);
    if(e.bossKind)g.setup({activeBoss:e});else g.setup({activeBoss:null});
    g.clearTrace();g.renderEnemy(e);
    assert.deepEqual(g.drawingTrace(),g.drawingTrace(canvas.id).slice(2),entry.id+' must use actual live drawing');
  }
});
test('portraits preserve actual relative body sizes, colors, shield, and Warden markings',()=>{
  const g=loadGame({traceCanvas:true,preferencesStored:JSON.stringify({version:1,actors:'classic'})});g.showBestiary();
  const expected={shambler:[15,'#b2ca80'],runner:[11,'#f0ad7e'],brute:[23,'#ab8fe1'],hunter:[12,'#c9b4ff'],spitter:[17,'#ec79a8'],riot:[19,'#90a7b4'],howler:[18,'#e2cf75'],breaker:[34,'#ee6a85'],warden:[34,'#7eb8ed']};
  for(const [id,[r,col]] of Object.entries(expected)){
    const trace=g.drawingTrace('portrait-'+id);assert.ok(trace.some(row=>row[0]==='arc'&&row[3]===r));assert.ok(trace.some(row=>row[0]==='set'&&row[1]==='fillStyle'&&row[2]===col));
  }
  assert.ok(g.drawingTrace('portrait-riot').some(row=>row.includes('#f2c36b')));assert.ok(g.drawingTrace('portrait-warden').some(row=>row.includes('#c0f2ff')));
  g.setBestiaryFilter('horde');assert.ok(g.drawingTrace('portrait-runner').length>2);assert.equal(guideIds(g).length,4);
});
test('portrait browsing never mutates live enemies, active boss, combat stats, or saved data',()=>{
  const g=loadGame();cleanRun(g);g.spawnBoss('warden');finishForGuide(g);const boss=g.state.activeBoss,before=JSON.stringify({boss,p:g.p,r:g.state.runResult,j:g.state.journal});const saved=g.journalSaved();g.showBestiary();for(const filter of ['boss','specialist','horde','all'])g.setBestiaryFilter(filter);
  assert.equal(g.state.activeBoss,boss);assert.equal(JSON.stringify({boss,p:g.p,r:g.state.runResult,j:g.state.journal}),before);assert.equal(g.journalSaved(),saved);
});
test('weapon guide contains four rank paths and four matching evolutions with no saving or power changes',()=>{
  const g=loadGame(),before=JSON.stringify(g.p),saved=g.journalSaved();g.openHomeEntry('weaponsOpen');assert.equal(g.state.mode,'weapons');const sheet=g.el('modal').innerHTML;
  assert.equal((sheet.match(/data-weapon=/g)||[]).length,4);assert.equal((sheet.match(/scope="row"/g)||[]).length,12);
  for(const evo of g.evolutions)assert.ok(sheet.includes(evo.name));assert.match(sheet,/later upgrade/);assert.match(sheet,/not automatic/);assert.match(sheet,/never stack/);assert.equal(JSON.stringify(g.p),before);assert.equal(g.journalSaved(),saved);g.el('weaponsBackBottom').click();assert.equal(g.state.mode,'journal');
});
test('weapon reference rank facts match the accepted target counts and fire settings',()=>{
  const g=loadGame();for(let rank=1;rank<=3;rank++){
    assert.match(g.weaponGuideRows('pierce')[rank-1],new RegExp(`${rank+1} targets`));assert.match(g.weaponGuideRows('arc')[rank-1],new RegExp(`${rank+2} distinct`));assert.match(g.weaponGuideRows('blades')[rank-1],new RegExp(`${rank+1} blades`));
    const fire=g.molotovStats(rank,false),line=g.weaponGuideRows('molotov')[rank-1];for(const fact of [`radius ${fire.radius}`,`${fire.cooldown}s`,`${fire.duration}s`,`${fire.multiplier*100}%`])assert.ok(line.includes(fact));
  }
  g.showWeaponGuide();const sheet=g.el('modal').innerHTML;assert.match(sheet,/100% weapon damage, every 0.8s/);assert.match(sheet,/Eight targets per bullet/);assert.match(sheet,/Six blades; radius 100/);const fire=g.molotovStats(3,true);assert.ok(sheet.includes(`radius ${fire.radius}; ${fire.cooldown}s`));
});
test('cross-linking both guides retains menu origin and stale buttons cannot start anything',()=>{
  const g=loadGame();g.showBestiary();const old=g.el('bestiaryBack');g.el('bestiaryWeapons').dispatch('pointerdown',{pointerId:2,isPrimary:false});assert.equal(g.state.mode,'weapons');assert.equal(g.state.weaponGuideReturn,'menu');old.click();assert.equal(g.state.mode,'weapons');g.el('weaponsBestiary').click();assert.equal(g.state.bestiaryReturn,'menu');g.el('bestiaryBack').click();assert.equal(g.state.mode,'menu');assert.equal(g.state.journal.totals.runs,0);
});
test('result weapon access requires a fresh press and preserves frozen scene and exact result across both guides',()=>{
  const g=loadGame();cleanRun(g);g.setup({elapsed:181});finishForGuide(g);const r=g.state.runResult,sheet=g.el('modal').innerHTML,saved=g.journalSaved(),record=g.saved(),draws=g.drawCount();const button=g.el('endWeapons');button.dispatch('pointerup',{pointerId:1});button.click(1);assert.equal(g.state.mode,'end');button.dispatch('pointerdown',{pointerId:2});button.dispatch('pointerup',{pointerId:2});assert.equal(g.state.mode,'weapons');assert.equal(g.state.weaponGuideReturn,'end');assert.match(g.el('modal').innerHTML,/Finished build:/);g.frame(16);g.update(1);g.el('weaponsBestiary').click();assert.equal(g.state.bestiaryReturn,'end');g.frame(32);g.el('bestiaryWeapons').click();g.frame(48);assert.equal(g.drawCount(),draws);g.el('weaponsBack').click();assert.equal(g.state.runResult,r);assert.equal(g.el('modal').innerHTML,sheet);assert.equal(g.journalSaved(),saved);assert.equal(g.saved(),record);assert.equal(g.state.journal.totals.runs,1);near(g.state.elapsed,181);
});
test('weapon guide cannot replace active play, pause, upgrades, or extraction choices',()=>{
  const g=loadGame();cleanRun(g);g.showWeaponGuide();assert.equal(g.state.mode,'play');g.pause();const paused=g.el('modal').innerHTML;g.showWeaponGuide();assert.equal(g.state.mode,'paused');assert.equal(g.el('modal').innerHTML,paused);g.resume();earnUpgrade(g);const upgrade=g.el('modal').innerHTML;g.showWeaponGuide();assert.equal(g.state.mode,'upgrade');assert.equal(g.el('modal').innerHTML,upgrade);g.choose(0);g.setup({elapsed:181,bossesDefeated:1,nextBossAt:Infinity});g.updateExtractionWindow();reachExit(g);assert.equal(g.state.mode,'extraction');g.showWeaponGuide();assert.equal(g.state.mode,'extraction');
});
test('guides preserve temporary-storage result notices and retry clears navigation without adding a completion',()=>{
  const g=loadGame({writeBlocked:true});cleanRun(g);g.setup({elapsed:20});finishForGuide(g);const sheet=g.el('modal').innerHTML;g.el('endWeapons').click();g.el('weaponsBestiary').click();g.el('bestiaryWeapons').click();g.closeWeaponGuide();assert.equal(g.el('modal').innerHTML,sheet);assert.match(sheet,/best time lasts for this visit/);g.el('again').click();assert.equal(g.state.mode,'play');assert.equal(g.state.weaponGuideReturn,'menu');assert.equal(g.state.bestiaryReturn,'menu');assert.equal(g.state.runResult,null);assert.equal(g.state.journal.totals.runs,1);
});

// Alpha 0.27: optional contracts reuse real event outcomes, not new spawn rules.
function contractConvoy(g){
  g.scheduleRush(Infinity);g.setup({elapsed:25,nextConvoyAt:25,nextBossAt:1000,exitAt:1000,barrels:[],obstacles:[]});
  const truck=beginConvoy(g);g.hitEnemy(truck,1e9);g.resolveConvoyReward();return truck;
}
function contractBurns(g,count=40){
  const targets=Array.from({length:count},()=>enemy({hp:1,max:1}));
  g.setup({enemies:targets,fires:[groundFire()],barrels:[],barricades:[]});g.updateMolotov(.01);return targets;
}
function finishNewContract(g,id){
  if(id==='fire')contractBurns(g);
  if(id==='convoy')contractConvoy(g);
  if(id==='rescue'){
    prepareExit(g);g.setup({rescue:stranded({following:true}),rescueOffered:true});reachRescueExit(g);
  }
  if(g.state.mode==='play')g.checkLevelUp();
  let choices=0;while(g.state.mode==='upgrade'){g.choose(0);assert.ok(++choices<5)}
  assert.equal(g.state.contractCompleted,true);return choices;
}
test('expanded roster offers eleven optional contracts with clear credit and reward descriptions',()=>{
  const g=loadGame();g.showRoster();assert.equal(g.contracts.length,11);assert.equal((g.el('modal').innerHTML.match(/<select id="contractPick">([\s\S]*?)<\/select>/)[1].match(/<option value=/g)||[]).length,12);
  for(const [id,name,help] of [['rescue','Rescue Dispatch',/Recruiting alone does not count/],['convoy','Road Intercept',/normal convoy upgrade is separate/],['fire','Firebreak',/Fuel blasts, wood, and trucks do not count/]]){
    const picker=g.el('contractPick');picker.value=id;picker.dispatch('change');assert.equal(g.state.selectedContract,id);assert.match(g.el('contractDetail').textContent,help);assert.match(g.el('contractDetail').textContent,/one bonus upgrade this run.*No time limit or penalty/);assert.ok(g.el('modal').innerHTML.includes(name));g.selectSurvivor('engineer');assert.equal(picker.value,id);
  }
});
test('Rescue Dispatch counts delivery rather than recruitment and queues rescue, contract, then XP before extraction',()=>{
  const g=loadGame();startContract(g,'rescue');prepareExit(g);g.setup({rescue:stranded({x:0}),rescueOffered:true,xp:8});recruitRescue(g);g.updateEncounterHUD();assert.equal(g.contractProgress(),0);assert.equal(g.state.contractCompleted,false);assert.equal(g.el('contractGoal').textContent,'CONTRACT • ESCORTS 0/1');
  g.p.hp=70;reachRescueExit(g);const time=g.state.elapsed;assert.equal(g.contractProgress(),1);assert.equal(g.state.contractCompleted,true);near(g.p.hp,70);
  for(const label of ['SURVIVOR RESCUED','CONTRACT COMPLETE','LEVEL']){assert.equal(g.state.mode,'upgrade');assert.match(g.el('modal').innerHTML,new RegExp(label));g.choices()[0].click(1);assert.equal(g.state.mode,'upgrade');g.choose(0);near(g.state.elapsed,time)}
  assert.equal(g.state.mode,'extraction');assert.equal(g.state.xp,0);assert.equal(g.state.bonusChoices,0);chooseExitForTest(g,'extract');assert.equal(g.state.runResult.contractCompleted,true);assert.equal(g.state.runResult.rescues,1);
});
test('Road Intercept counts a resolved destruction, with exactly one convoy and one contract upgrade',()=>{
  const g=loadGame();startContract(g,'convoy');g.setup({elapsed:25,nextConvoyAt:25,nextBossAt:1000,exitAt:1000,barrels:[],obstacles:[],xp:7});g.scheduleRush(Infinity);g.updateConvoy();assert.equal(g.state.convoy.phase,'signal');g.checkContract();assert.equal(g.contractProgress(),0);assert.equal(g.state.bonusChoices,0);
  const truck=g.state.convoy;g.setup({elapsed:truck.readyAt});g.updateConvoy();g.hitEnemy(truck,1e9);assert.equal(g.contractProgress(),0);g.checkContract();assert.equal(g.state.contractCompleted,false);g.resolveConvoyReward();g.resolveConvoyReward();assert.equal(g.contractProgress(),1);g.checkLevelUp();assert.match(g.el('modal').innerHTML,/CONVOY INTERCEPTED/);g.choose(0);assert.match(g.el('modal').innerHTML,/CONTRACT COMPLETE/);g.choose(0);assert.equal(g.state.mode,'play');assert.equal(g.state.bonusChoices,0);assert.equal(g.state.xp,7);assert.equal(g.state.killCount,0);assert.equal(g.state.gems.length,0);g.updateEncounterHUD();assert.equal(g.el('contractGoal').textContent,'CONTRACT ✓ CONVOYS 1/1 DONE');
});
test('Firebreak can use a normally chosen rank-one Molotov and pays only at forty actual burn kills',()=>{
  const g=loadGame();startContract(g,'fire');earnUpgrade(g);chooseNamed(g,'Molotov');assert.equal(g.p.molotov,1);g.setup({barrels:[],obstacles:[],enemies:Array.from({length:39},()=>enemy({hp:1,max:1})),molotovClock:0,xp:3});g.p.hp=70;g.p.fireClock=999;
  g.updateMolotov(.01);assert.equal(g.state.bottles.length,1);assert.equal(g.contractProgress(),0);burnStep(g,.46);assert.equal(g.state.burnKills,39);g.checkLevelUp();assert.equal(g.state.mode,'play');assert.equal(g.state.contractCompleted,false);g.updateEncounterHUD();assert.equal(g.el('contractGoal').textContent,'CONTRACT • FIRE KILLS 39/40');
  const last=enemy({hp:1,max:1});g.state.enemies.push(last);burnStep(g,.01);assert.equal(g.state.burnKills,40);g.checkLevelUp();assert.match(g.el('modal').innerHTML,/CONTRACT COMPLETE/);near(g.p.hp,70);assert.equal(g.state.xp,3);g.choose(0);g.hitEnemy(last,100,'FIRE');g.checkLevelUp();assert.equal(g.state.mode,'play');assert.equal(g.state.burnKills,40);assert.equal(g.state.bonusChoices,0);assert.equal(g.contractProgress(),40);
});
test('fire-triggered fuel, burning wood, destroyed trucks, and normal gun kills do not count for Firebreak',()=>{
  const g=loadGame();startContract(g,'fire');const b=fuel(100);g.setup({barrels:[b],enemies:[enemy({hp:1})],fires:[groundFire({x:64,r:20})]});g.updateMolotov(.01);assert.equal(g.state.blastKills,1);assert.equal(g.state.burnKills,0);g.damageBarricade(barrier(),100,'fire');g.hitEnemy(enemy({hp:1}),20);contractConvoy(g);assert.equal(g.state.convoysStopped,1);assert.equal(g.state.burnKills,0);assert.equal(g.contractProgress(),0);g.checkLevelUp();assert.match(g.el('modal').innerHTML,/CONVOY INTERCEPTED/);g.choose(0);assert.equal(g.state.mode,'play');assert.equal(g.state.contractCompleted,false);
});
test('the three new goals ignore unrelated barrel, holdout, and boss counters',()=>{
  for(const id of ['rescue','convoy','fire']){
    const g=loadGame();startContract(g,id);g.setup({barrelsBlown:100,bossesDefeated:100});g.hitEnemy(enemy(),100);g.checkLevelUp();assert.equal(g.contractProgress(),0);assert.equal(g.state.contractCompleted,false);assert.equal(g.state.mode,'play');
  }
});
test('death before the existing reward stage blocks same-frame fire, convoy, and rescue contract rewards',()=>{
  for(const id of ['fire','convoy','rescue']){
    const g=loadGame();startContract(g,id);g.p.fireClock=999;
    if(id==='fire')g.setup({enemies:Array.from({length:40},()=>enemy({hp:1})),fires:[groundFire()],barrels:[]});
    if(id==='convoy'){
      g.setup({elapsed:25,nextConvoyAt:25,nextBossAt:1000,exitAt:1000,barrels:[],obstacles:[]});g.scheduleRush(Infinity);const truck=beginConvoy(g);g.hitEnemy(truck,1e9);assert.equal(g.state.convoyRewardPending,true);
    }
    if(id==='rescue'){
      prepareExit(g);const gate=g.state.exitBeacon;g.p.x=gate.x;g.p.y=gate.y;g.setup({rescue:stranded({x:gate.x+30,y:gate.y,following:true}),rescueOffered:true});
    }
    g.p.hp=1;g.state.enemies.push(enemy({x:g.p.x,y:g.p.y,hp:10000}));g.update(.02);assert.equal(g.state.mode,'end',id);assert.equal(g.state.contractCompleted,false,id);assert.equal(g.state.bonusChoices,0,id);assert.equal(g.state.runResult.contractCompleted,false,id);assert.equal(g.state.runResult.contractProgress,id==='fire'?40:0,id);
  }
});
test('repeat convoy interceptions retain normal rewards without paying Road Intercept twice',()=>{
  const g=loadGame();startContract(g,'convoy');assert.equal(finishNewContract(g,'convoy'),2);assert.equal(g.state.convoysStopped,1);
  g.setup({elapsed:145,nextConvoyAt:145,enemies:[],barrels:[],obstacles:[]});g.updateConvoy();const truck=g.state.convoy;assert.ok(truck);g.setup({elapsed:truck.readyAt});g.updateConvoy();g.hitEnemy(truck,1e9);g.resolveConvoyReward();g.checkLevelUp();assert.match(g.el('modal').innerHTML,/CONVOY INTERCEPTED/);g.choose(0);assert.equal(g.state.mode,'play');assert.equal(g.state.convoysStopped,2);assert.equal(g.contractProgress(),1);assert.equal(g.state.contractCompleted,true);assert.equal(g.state.bonusChoices,0);
});
test('completed new contracts retain held results, guide navigation, run logs, and clean retry progress',()=>{
  for(const id of ['rescue','convoy','fire']){
    const g=loadGame();startContract(g,id);finishNewContract(g,id);if(g.state.mode==='extraction')chooseExitForTest(g,'extract');else finishForGuide(g);const result=g.state.runResult,sheet=g.el('modal').innerHTML,saved=g.journalSaved();assert.equal(result.contract,id);assert.equal(result.contractCompleted,true);assert.match(sheet,/RUN CONTRACT.*COMPLETED/);
    g.showWeaponGuide();g.el('weaponsBestiary').click();g.closeBestiary();assert.equal(g.el('modal').innerHTML,sheet);assert.equal(g.state.runResult,result);assert.equal(g.journalSaved(),saved);
    const next=loadGame({journalStored:saved});next.showJournal();assert.match(next.el('modal').innerHTML,new RegExp(g.contracts.find(c=>c.id===id).name+'.*COMPLETED'));assert.equal(next.state.selectedContract,'none');
    g.el('again').click();assert.equal(g.state.runContract,id);assert.equal(g.contractProgress(),0);assert.equal(g.state.contractCompleted,false);assert.equal(g.state.bonusChoices,0);assert.equal(g.state.rescuesCompleted,0);assert.equal(g.state.convoysStopped,0);assert.equal(g.state.burnKills,0);assert.equal(result.contractCompleted,true);
  }
});
test('unfinished new contracts allow the normal three-minute extraction with no penalty',()=>{
  for(const id of ['rescue','convoy','fire']){
    const g=loadGame();startContract(g,id);prepareExit(g);reachExit(g);chooseExitForTest(g,'extract');assert.equal(g.state.runOutcome,'extracted');assert.equal(g.state.runResult.contract,id);assert.equal(g.state.runResult.contractProgress,0);assert.equal(g.state.runResult.contractCompleted,false);assert.match(g.el('modal').innerHTML,/EXTRACTION COMPLETE/);assert.equal(g.state.bonusChoices,0);
  }
});
test('new contract history is bounded and cannot supply a runtime completion, weapon, or reward',()=>{
  const rows=[{outcome:'extracted',time:181,contract:'rescue',contractProgress:999,contractCompleted:true},{outcome:'defeated',time:10,contract:'convoy',contractProgress:'1',contractCompleted:true},{outcome:'abandoned',time:20,contract:'fire',contractProgress:39,contractCompleted:true},{outcome:'extracted',time:181,contract:'fire',contractProgress:Infinity,contractCompleted:true},{outcome:'extracted',time:181},{outcome:'extracted',time:181,contract:'<script>',contractProgress:999,contractCompleted:true}];
  const g=loadGame({journalStored:journalData('engineer',{history:rows,selectedContract:'fire',contractCompleted:true,burnKills:999})});const h=g.state.journal.history;assert.equal(h[0].contractProgress,1);assert.equal(h[0].contractCompleted,true);assert.equal(h[1].contractProgress,0);assert.equal(h[1].contractCompleted,false);assert.equal(h[2].contractCompleted,false);assert.equal(h[3].contractProgress,0);assert.equal(h[4].contract,null);assert.equal(h[5].contract,null);g.showJournal();assert.doesNotMatch(g.el('modal').innerHTML,/<script>/);g.start();assert.equal(g.state.runContract,'none');assert.equal(g.contractProgress(),0);assert.equal(g.state.contractCompleted,false);assert.equal(g.state.bonusChoices,0);assert.equal(g.p.molotov,0);near(g.p.hp,95);
});
test('contracts remain optional on every survivor and work with blocked storage',()=>{
  for(const role of ['survivor','scout','bulwark','engineer','scavenger']){
    const g=loadGame({storageBlocked:true});g.showRoster();g.selectSurvivor(role);g.selectContract('fire');cleanRun(g);const base=g.survivors.find(r=>r.id===role);near(g.p.hp,base.hp);near(g.p.speed,base.speed);near(g.p.damage,18);assert.equal(finishNewContract(g,'fire'),1);finishForGuide(g);assert.equal(g.state.journal.history[0].contractCompleted,true);assert.equal(g.state.journal.available,false);g.showJournal();assert.match(g.el('modal').innerHTML,/Firebreak.*COMPLETED/);assert.match(g.el('modal').innerHTML,/lasts for this visit/);
  }
});

// Alpha 0.28: one optional reroll replaces an offer, never its earned upgrade.
function laterUpgrade(g){cleanRun(g);earnUpgrade(g);chooseNamed(g,'Piercing Rounds');earnUpgrade(g);assert.equal(g.state.level,3);assert.equal(g.choices().length,3)}
function rerollPress(g){const b=g.el('rerollUpgrade');assert.ok(b);g.advanceClock(500);choicePointer(b,'pointerdown');choicePointer(b,'pointerup');return b}
function offerNames(g){return g.state.upgradeOffer.picks.map(o=>o.name).sort()}
test('all four first weapons stay visible and the single reroll becomes available on a later offer',()=>{
  const g=loadGame();cleanRun(g);earnUpgrade(g);assert.equal(g.choices().length,4);assert.equal(g.el('rerollUpgrade'),undefined);assert.equal(g.state.rerollsLeft,1);assert.match(g.el('modal').innerHTML,/available from the next upgrade/);chooseNamed(g,'Piercing Rounds');earnUpgrade(g);assert.match(g.el('modal').innerHTML,/REROLL CHOICES · 1 LEFT/);assert.equal(g.state.rerollsLeft,1);
});
test('reroll changes at least one legal choice without modifying gameplay stats, level, earned XP, or reward queues',()=>{
  const g=loadGame();laterUpgrade(g);g.p.hp=70;const names=offerNames(g),before=JSON.stringify({p:g.p,time:g.state.elapsed,level:g.state.level,upgrades:g.state.upgrades,xp:g.state.xp,nextXp:g.state.nextXp,bonus:g.state.bonusChoices,kinds:g.state.bonusKinds,kills:g.state.killCount,journal:g.state.journal}),saved=g.journalSaved();rerollPress(g);
  assert.equal(g.state.mode,'upgrade');assert.equal(g.state.rerollsLeft,0);assert.notDeepEqual(offerNames(g),names);assert.equal(g.choices().length,3);for(const o of g.state.upgradeOffer.picks)assert.ok(!o.available||o.available());assert.equal(JSON.stringify({p:g.p,time:g.state.elapsed,level:g.state.level,upgrades:g.state.upgrades,xp:g.state.xp,nextXp:g.state.nextXp,bonus:g.state.bonusChoices,kinds:g.state.bonusKinds,kills:g.state.killCount,journal:g.state.journal}),before);assert.equal(g.journalSaved(),saved);g.update(100);assert.equal(g.state.mode,'upgrade');g.choose(0);assert.equal(g.state.mode,'play');assert.equal(g.state.upgradeOffer,null);
});
test('used reroll is disabled and stale buttons and old upgrade cards cannot grant anything',()=>{
  const g=loadGame();laterUpgrade(g);const cards=g.choices().slice(),old=rerollPress(g),names=offerNames(g),p=JSON.stringify(g.p);assert.match(g.el('modal').innerHTML,/id="rerollUpgrade" disabled/);assert.match(g.el('modal').innerHTML,/REROLL USED · 0 LEFT/);g.advanceClock(500);old.click(0);choicePointer(old,'pointerdown');choicePointer(old,'pointerup');for(const card of cards){card.click(0);choicePointer(card,'pointerdown');choicePointer(card,'pointerup')}g.el('rerollUpgrade').click(0);assert.deepEqual(offerNames(g),names);assert.equal(JSON.stringify(g.p),p);assert.equal(g.state.rerollsLeft,0);g.choose(0);earnUpgrade(g);assert.match(g.el('modal').innerHTML,/REROLL USED · 0 LEFT/);assert.equal(g.state.rerollsLeft,0);
});
test('reroll opening guard rejects carried releases, compatibility clicks, and a press that began too early',()=>{
  const g=loadGame();laterUpgrade(g);const b=g.el('rerollUpgrade'),names=offerNames(g);choicePointer(b,'pointerup');b.click(1);b.click(0);choicePointer(b,'pointerdown');g.advanceClock(500);choicePointer(b,'pointerup');assert.deepEqual(offerNames(g),names);assert.equal(g.state.rerollsLeft,1);choicePointer(b,'pointerdown');choicePointer(b,'pointerup');assert.equal(g.state.rerollsLeft,0);
});
test('scrolling and canceled reroll gestures preserve the charge and permit a later fresh tap',()=>{
  for(const cancel of ['pointercancel','pointerleave','lostpointercapture','blur','scroll']){
    const g=loadGame();laterUpgrade(g);g.advanceClock(500);const b=g.el('rerollUpgrade');choicePointer(b,'pointerdown');if(cancel==='scroll')choicePointer(b,'pointermove',7,{clientY:150});else b.dispatch(cancel,{pointerId:7});choicePointer(b,'pointerup');b.click(1);assert.equal(g.state.rerollsLeft,1,cancel);choicePointer(b,'pointerdown',9);choicePointer(b,'pointerup',9);assert.equal(g.state.rerollsLeft,0,cancel);
  }
});
test('new cards after reroll require their own fresh gesture and opening guard',()=>{
  const g=loadGame();laterUpgrade(g);rerollPress(g);const card=g.choices()[0],p=JSON.stringify(g.p);choicePointer(card,'pointerup');card.click(1);card.dispatch('keyup',{key:'Enter'});choicePointer(card,'pointerdown',9);g.advanceClock(500);choicePointer(card,'pointerup',9);assert.equal(g.state.mode,'upgrade');assert.equal(JSON.stringify(g.p),p);choicePointer(card,'pointerdown',10);choicePointer(card,'pointerup',10);assert.equal(g.state.mode,'play');assert.equal(g.state.level,3);
});
test('reroll supports fresh keyboard activation while repeated or held keys do nothing',()=>{
  for(const key of ['Enter',' ']){
    const g=loadGame();laterUpgrade(g);g.advanceClock(500);const b=g.el('rerollUpgrade');b.dispatch('keydown',{key,repeat:true});b.dispatch('keyup',{key});assert.equal(g.state.rerollsLeft,1);b.dispatch('keyup',{key});assert.equal(g.state.rerollsLeft,1);b.dispatch('keydown',{key,repeat:false});assert.equal(g.state.rerollsLeft,1);b.dispatch('keyup',{key});assert.equal(g.state.rerollsLeft,0);assert.equal(g.state.mode,'upgrade');g.choices()[0].dispatch('keyup',{key});assert.equal(g.state.mode,'upgrade');
  }
});
test('accessibility reroll activation waits for the guard and does not select a refreshed card',()=>{
  const g=loadGame();laterUpgrade(g);const b=g.el('rerollUpgrade');b.click(0);assert.equal(g.state.rerollsLeft,1);g.advanceClock(500);b.click(0);assert.equal(g.state.rerollsLeft,0);const p=JSON.stringify(g.p);g.choices()[0].click(0);assert.equal(g.state.mode,'upgrade');assert.equal(JSON.stringify(g.p),p);g.advanceClock(500);g.choices()[0].click(0);assert.equal(g.state.mode,'play');
});
test('reroll retains convoy and contract labels and consumes only the selected offer before queued XP',()=>{
  const g=loadGame();cleanRun(g);earnUpgrade(g);chooseNamed(g,'Piercing Rounds');g.setup({bonusChoices:2,xp:g.state.nextXp});g.state.bonusKinds.push('convoy','contract');g.checkLevelUp();assert.match(g.el('modal').innerHTML,/CONVOY INTERCEPTED/);const level=g.state.level,upgrades=g.state.upgrades,xp=g.state.xp;rerollPress(g);assert.match(g.el('modal').innerHTML,/CONVOY INTERCEPTED/);assert.equal(g.state.level,level);assert.equal(g.state.upgrades,upgrades);assert.equal(g.state.xp,xp);assert.equal(g.state.bonusChoices,1);g.choose(0);assert.match(g.el('modal').innerHTML,/CONTRACT COMPLETE/);assert.equal(g.state.xp,xp);assert.equal(g.state.rerollsLeft,0);g.choose(0);assert.match(g.el('modal').innerHTML,/LEVEL 5 REACHED/);assert.equal(g.state.xp,0);g.choose(0);assert.equal(g.state.mode,'play');assert.equal(g.state.level,5);assert.equal(g.state.bonusKinds.length,0);
});
test('rerolled rescue reward still holds through contract and XP choices before Extract or Stay',()=>{
  const g=loadGame();startContract(g,'rescue');prepareExit(g);earnUpgrade(g);chooseNamed(g,'Piercing Rounds');g.setup({rescue:stranded({following:true}),rescueOffered:true,xp:g.state.nextXp});reachRescueExit(g);const time=g.state.elapsed;rerollPress(g);assert.match(g.el('modal').innerHTML,/SURVIVOR RESCUED/);assert.ok(g.state.rescueArrival);g.choose(0);assert.match(g.el('modal').innerHTML,/CONTRACT COMPLETE/);g.choose(0);assert.match(g.el('modal').innerHTML,/LEVEL 5 REACHED/);g.choose(0);assert.equal(g.state.mode,'extraction');near(g.state.elapsed,time);assert.equal(g.state.rescueArrival,null);assert.equal(g.state.rerollsLeft,0);chooseExitForTest(g,'extract');assert.equal(g.state.runResult.rescues,1);assert.equal(g.state.runResult.contractCompleted,true);
});
test('reroll leaves an unchosen evolution eligible and a later offered selection evolves exactly once',()=>{
 const g=loadGame();cleanRun(g);earnUpgrade(g);chooseNamed(g,'Piercing Rounds');g.p.pierce=3;earnUpgrade(g);fixtureOfferedUpgrade(g,'Evolve: Railstorm');const previous=offerNames(g);rerollPress(g);assert.notDeepEqual(offerNames(g),previous);assert.equal(g.opts.find(o=>o.evolution==='rail').available(),true);assert.ok(!g.state.upgradeOffer.picks.some(o=>o.evolution==='rail'),'fresh cards replace a previous evolution when enough alternatives exist');fixtureOfferedUpgrade(g,'Evolve: Railstorm');const old=g.choices().find((_,i)=>g.state.upgradeOffer.picks[i].evolution==='rail');chooseNamed(g,'Evolve: Railstorm');assert.equal(g.p.rail,true);assert.equal(g.state.mode,'play');old.click(0);assert.equal(g.p.rail,true);assert.equal(g.state.level,3);
});
test('seeded rerolls keep legal unique fresh choices with no reserved rank or evolution slot',()=>{
  for(let seed=1;seed<=80;seed++){
    const g=loadGame({seed});laterUpgrade(g);
    for(const stage of ['rank','evolution','capped']){
      Object.assign(g.p,{pierce:stage==='rank'?1:3,rail:stage==='capped',arc:stage==='capped'?3:0,thunder:stage==='capped',blades:stage==='capped'?3:0,reaper:stage==='capped',molotov:stage==='capped'?3:0,wildfire:stage==='capped',proj:stage==='capped'?5:1,fire:stage==='capped'?.075:.33});
      const previous=g.upgradeChoices(),next=g.upgradeChoices(previous);assert.equal(next.length,3);assert.equal(new Set(next).size,3);assert.ok(next.some(o=>!previous.includes(o)));for(const o of next)assert.ok(!o.available||o.available());assert.ok(next.every(o=>!previous.includes(o)),'enough unseen choices should give a completely fresh offer');
    }
  }
});
test('an exhausted option pool cannot consume a reroll or replace the current offer',()=>{
  const g=loadGame();laterUpgrade(g);const offer=g.state.upgradeOffer;for(const o of g.opts)if(!offer.picks.includes(o))o.available=()=>false;const sheet=g.el('modal').innerHTML;rerollPress(g);assert.equal(g.state.rerollsLeft,1);assert.equal(g.state.upgradeOffer,offer);assert.equal(g.el('modal').innerHTML,sheet);assert.equal(g.state.mode,'upgrade');g.choose(0);assert.equal(g.state.mode,'play');
});
test('backgrounded or blurred reroll input cannot consume the charge',()=>{
  const g=loadGame();laterUpgrade(g);g.advanceClock(500);const b=g.el('rerollUpgrade');choicePointer(b,'pointerdown');g.document.hidden=true;choicePointer(b,'pointerup');b.click(0);assert.equal(g.state.rerollsLeft,1);g.document.hidden=false;choicePointer(b,'pointerup');assert.equal(g.state.rerollsLeft,1);choicePointer(b,'pointerdown',9);choicePointer(b,'pointerup',9);assert.equal(g.state.rerollsLeft,0);
});
test('Stay and later offers do not restore a used reroll; held results stay fixed and retry restores one',()=>{
  const g=loadGame();prepareExit(g);earnUpgrade(g);chooseNamed(g,'Piercing Rounds');earnUpgrade(g);rerollPress(g);g.choose(0);g.pause();assert.match(g.el('modal').innerHTML,/Upgrade reroll: used this run/);g.resume();reachExit(g);chooseExitForTest(g,'stay');assert.equal(g.state.rerollsLeft,0);earnUpgrade(g);assert.match(g.el('modal').innerHTML,/REROLL USED · 0 LEFT/);g.choose(0);finishForGuide(g);const r=g.state.runResult,sheet=g.el('modal').innerHTML,saved=g.journalSaved();g.showWeaponGuide();g.closeWeaponGuide();assert.equal(g.state.runResult,r);assert.equal(g.el('modal').innerHTML,sheet);assert.equal(g.journalSaved(),saved);g.el('again').click();assert.equal(g.state.rerollsLeft,1);assert.equal(g.state.upgradeOffer,null);assert.equal(g.state.mode,'play');g.pause();assert.match(g.el('modal').innerHTML,/Upgrade reroll: 1 available/);
});
test('every survivor gets one per-run reroll even without storage and saved data cannot supply charges',()=>{
  for(const role of ['survivor','scout','bulwark','engineer','scavenger']){
    const g=loadGame({storageBlocked:true});g.showRoster();g.selectSurvivor(role);laterUpgrade(g);const hp=g.p.hp,speed=g.p.speed;rerollPress(g);near(g.p.hp,hp);near(g.p.speed,speed);g.choose(0);assert.equal(g.state.rerollsLeft,0);finishForGuide(g);g.el('again').click();assert.equal(g.state.rerollsLeft,1);assert.equal(g.state.runSurvivor,role);
  }
  const g=loadGame({journalStored:journalData('survivor',{rerollsLeft:999,upgradeOffer:{picks:['Field Medic']},history:[{outcome:'extracted',time:181,rerollsLeft:999}]})});assert.equal(g.state.rerollsLeft,1);assert.equal(g.state.upgradeOffer,null);cleanRun(g);assert.equal(g.state.rerollsLeft,1);near(g.p.hp,100);
});

function howler(overrides={}){return{...enemy({r:18,hp:100,max:100,col:'#e2cf75',type:7,dmg:10}),howler:true,phase:'approach',phaseTime:0,cooldown:0,pulseUntil:0,...overrides}}

// Alpha 0.29: a bounded support enemy with clear warning and protected objectives.
function quietHowler(g){cleanRun(g);g.scheduleRush(Infinity);g.setup({elapsed:135,nextHowlerAt:Infinity,nextBossAt:1000,exitAt:1000,barrels:[],obstacles:[]});g.p.fireClock=999}
function readyHowl(g,targets=[enemy({x:120,hp:100,max:100})]){quietHowler(g);const h=howler({x:100,y:-60,phase:'howl',phaseTime:.01});g.setup({enemies:[h,...targets]});return h}
test('Howler first opportunity is 03:30, after the first exit, with one alive and a reserved boss slot',()=>{
  const g=loadGame();g.start();near(g.state.nextHowlerAt,210);cleanRun(g);g.scheduleRush(Infinity);g.setup({elapsed:209.99,nextHowlerAt:210,nextBossAt:1000,exitAt:1000,barrels:[],obstacles:[]});g.updateHowlerSchedule();assert.equal(g.state.enemies.length,0);g.setup({elapsed:210});g.updateHowlerSchedule();const h=g.state.enemies[0];assert.ok(h.howler);assert.equal(g.state.enemies.length,1);near(h.hp,102.5);near(h.r,18);near(h.speed,68);assert.equal(h.col,'#e2cf75');near(g.state.nextHowlerAt,265);assert.equal(g.state.howlerIntroduced,true);assert.match(g.el('toast').textContent,/STOP THE GOLD RALLY/);
  g.setup({elapsed:265});g.updateHowlerSchedule();assert.equal(g.state.enemies.length,1);near(g.state.nextHowlerAt,268);g.setup({enemies:Array.from({length:239},()=>enemy()),elapsed:268});g.updateHowlerSchedule();assert.equal(g.state.enemies.length,239);g.setup({enemies:g.state.enemies.slice(0,238),elapsed:271});g.updateHowlerSchedule();assert.equal(g.state.enemies.length,239);assert.equal(g.state.enemies.filter(e=>e.howler).length,1);
});
test('a naturally spawned Howler approaches, stops for a full warning, then rallies through actual updates',()=>{
  const g=loadGame();quietHowler(g);g.setup({elapsed:134.99,nextHowlerAt:135});g.update(.02);const h=g.state.enemies.find(e=>e.howler);assert.ok(h);const target=enemy({x:h.x+10,y:h.y+10,hp:10000,max:10000});g.state.enemies.push(target);let warning=false,warningAt=0,rallied=false;
  for(let i=0;i<600;i++){
    const before={x:h.x,y:h.y,phase:h.phase};g.update(1/60);if(h.phase==='howl'&&!warning){warning=true;warningAt=g.state.elapsed}if(before.phase==='howl'&&h.phase==='howl'){near(h.x,before.x);near(h.y,before.y)}if(g.howlMultiplier(target)>1){rallied=true;assert.ok(g.state.elapsed-warningAt>=1.2-1/60-1e-8);break}
  }
  assert.equal(warning,true);assert.equal(rallied,true);assert.equal(g.state.hostileShots.length,0);assert.equal(g.state.killCount,0);assert.equal(g.state.bonusChoices,0);near(g.p.hp,100);
});
test('rally selects at most eight nearest eligible enemies in its actual radius and never stacks speed',()=>{
  const g=loadGame();quietHowler(g);const h=howler({x:0,y:-80,phase:'howl',phaseTime:.01}),inside=Array.from({length:12},(_,i)=>enemy({x:20+i*10,y:-80,hp:100})),edge=enemy({x:170,y:-80}),outside=enemy({x:170.01,y:-80});g.setup({enemies:[h,...inside,edge,outside]});g.updateHowls(.02);assert.equal(inside.filter(e=>g.howlMultiplier(e)>1).length,8);for(const e of inside.slice(0,8)){near(g.howlMultiplier(e),1.2);near(e.howlUntil,138)}for(const e of [...inside.slice(8),edge,outside])near(g.howlMultiplier(e),1);assert.equal(h.phase,'approach');near(h.cooldown,6.5);
  h.phase='howl';h.phaseTime=.01;g.updateHowls(.02);for(const e of inside.slice(0,8))near(g.howlMultiplier(e),1.2);g.setup({enemies:[h,edge,outside]});h.phase='howl';h.phaseTime=.01;g.updateHowls(.02);near(g.howlMultiplier(edge),1.2);near(g.howlMultiplier(outside),1);
});
test('rally never affects bosses, ranged specialists, guards, hunters, trucks, survivors, or dead enemies',()=>{
  const g=loadGame();quietHowler(g);const h=howler({phase:'howl',phaseTime:.01}),normal=enemy({x:100}),special=[enemy({x:100,type:3}),spitter({x:100}),riot({x:100}),howler({x:100,cooldown:99}),enemy({x:100,rush:true,type:1}),enemy({x:100,convoy:true,type:6}),enemy({x:100,hp:0}),enemy({x:100,salvageStunUntil:140})];g.setup({enemies:[h,normal,...special],rescue:stranded({x:100,following:true}),rescueOffered:true});const role=JSON.stringify(g.p),npc=JSON.stringify(g.state.rescue);g.updateHowls(.02);near(g.howlMultiplier(normal),1.2);for(const e of special)near(g.howlMultiplier(e),1);assert.equal(JSON.stringify(g.p),role);assert.equal(JSON.stringify(g.state.rescue),npc);assert.equal(g.state.bonusChoices,0);assert.equal(g.state.hostileShots.length,0);
});
test('the rally changes ordinary movement by exactly twenty percent without changing base speed, HP, or damage',()=>{
  const positions=[];
  for(const type of [0,1,2]){
    const g=loadGame(),target=enemy({x:100,hp:100,max:100,speed:100,type});readyHowl(g,[target]);const hp=target.hp,dmg=target.dmg;g.update(.1);near(target.x,88);near(target.y,0);near(target.speed,100);near(target.hp,hp);near(target.dmg,dmg);near(g.p.hp,100);g.setup({elapsed:target.howlUntil+.01});const x=target.x;g.update(.1);near(target.x,x-10);near(g.howlMultiplier(target),1);positions.push(target.x);
  }
  assert.equal(new Set(positions).size,1);
});
test('rally expiry, cooldown, lack of targets, offscreen cancellation, and salvage stun prevent hidden repeated casts',()=>{
  const g=loadGame();quietHowler(g);const h=howler({x:100}),target=enemy({x:120,hp:100});g.setup({enemies:[h]});g.updateHowls(.1);assert.equal(h.phase,'approach');g.state.enemies.push(target);g.updateHowls(.01);assert.equal(h.phase,'howl');near(h.phaseTime,1.2);g.updateHowls(.6);near(g.howlMultiplier(target),1);h.x=1000;g.updateHowls(.7);assert.equal(h.phase,'approach');near(g.howlMultiplier(target),1);h.x=100;h.cooldown=0;h.salvageStunUntil=140;g.updateHowls(.01);assert.equal(h.phase,'approach');near(g.howlMultiplier(target),1);h.salvageStunUntil=0;h.cooldown=0;g.updateHowls(.01);g.updateHowls(1.2);near(g.howlMultiplier(target),1.2);near(h.cooldown,6.5);g.setup({elapsed:138});near(g.howlMultiplier(target),1);g.updateHowls(3);assert.equal(h.phase,'approach');near(h.cooldown,3.5);
});
test('boss and Blackout warnings, relief, salvage, convoy, drop, and open exit defer spawning and cancel existing rallies',()=>{
  for(const kind of ['boss','boss-warning','rush-warning','rush-active','relief','salvage','convoy','drop','exit']){
    const g=loadGame(),target=enemy({x:120,howlUntil:140}),h=readyHowl(g,[target]);g.setup({nextHowlerAt:135});
    if(kind==='boss')g.setup({activeBoss:enemy({type:3})});if(kind==='boss-warning')g.setup({nextBossAt:145});if(kind==='rush-warning')g.scheduleRush(139);if(kind==='rush-active'){g.scheduleRush(135);g.updateRush(.01)}if(kind==='relief')g.setup({reliefUntil:140});if(kind==='salvage')g.setup({salvage:{progress:0}});if(kind==='convoy')g.setup({convoy:{}});if(kind==='drop')g.setup({supplyDrop:{}});if(kind==='exit'){g.setup({elapsed:180,exitAt:180,bossesDefeated:1});g.updateExtractionWindow();assert.ok(g.state.exitBeacon)}
    assert.equal(g.howlBlocked(),true,kind);g.updateHowlerSchedule();near(g.state.nextHowlerAt,g.state.elapsed+3);assert.equal(g.state.enemies.filter(e=>e.howler).length,1);g.updateHowls(.02);assert.equal(h.phase,'approach',kind);near(h.phaseTime,0);near(g.howlMultiplier(target),1);near(target.howlUntil,0);assert.ok(h.cooldown>=1.5);assert.equal(g.state.killCount,0);
  }
});
test('killing a Howler with the normal gun before its warning finishes prevents the pulse and gives normal XP',()=>{
  const g=loadGame(),target=enemy({x:140,hp:100,max:100});readyHowl(g,[target]);const h=howler({x:100,hp:10,phase:'howl',phaseTime:.01});g.setup({enemies:[h,target],bullets:[bullet()]});g.update(.02);assert.ok(h.hp<=0);near(g.howlMultiplier(target),1);assert.equal(g.state.enemyTally.howler,1);assert.equal(g.state.killCount,1);assert.equal(g.state.bossesDefeated,0);assert.equal(g.state.gems.length,1);assert.equal(g.state.gems[0].value,3);assert.equal(g.state.bonusChoices,0);
});
test('already applied boosts expire normally after their Howler is killed instead of persisting permanently',()=>{
  const g=loadGame(),target=enemy({x:120,hp:100});const h=readyHowl(g,[target]);g.updateHowls(.02);near(g.howlMultiplier(target),1.2);g.hitEnemy(h,1e9);near(g.howlMultiplier(target),1.2);g.setup({elapsed:138});g.updateHowls(.01);near(g.howlMultiplier(target),1);assert.equal(g.state.enemyTally.howler,1);
});
test('all established damage sources defeat Howlers with ordinary accounting and without boss-contract credit',()=>{
  for(const weapon of ['gun','lightning','blades','fire','fuel']){
    const g=loadGame();startContract(g,'bosses');quietHowler(g);const h=howler({x:100,hp:1,max:1,cooldown:99});g.setup({enemies:[h]});
    if(weapon==='gun'){g.setup({bullets:[bullet()]});g.updateProjectiles(.01)}if(weapon==='lightning'){g.p.arc=1;g.fireLightning()}if(weapon==='blades'){g.p.blades=1;const b=g.bladePositions()[0];h.x=b.x;h.y=b.y;g.updateWeapons(.01,g.p)}if(weapon==='fire'){g.setup({fires:[groundFire()]});g.updateMolotov(.01)}if(weapon==='fuel'){const b=fuel(100);g.setup({barrels:[b]});g.detonateBarrel(b)}
    assert.ok(h.hp<=0,weapon);assert.equal(g.state.enemyTally.howler,1,weapon);assert.equal(g.state.killCount,1);assert.equal(g.state.gems[0].value,3);assert.equal(g.state.burnKills,weapon==='fire'?1:0);assert.equal(g.state.blastKills,weapon==='fuel'?1:0);assert.equal(g.contractProgress(),0);assert.equal(g.state.bossesDefeated,0);assert.equal(g.state.bonusChoices,0);
  }
});
test('Howler bodies still respect solid cover, deal only their normal contact hit, and retreat without rewards when abandoned',()=>{
  const g=loadGame();quietHowler(g);const h=howler({x:50,y:0,speed:68}),wood=barrier({x:70});g.p.x=220;g.setup({enemies:[h],barricades:[wood]});g.update(.1);assert.ok(g.pointRectDistance(h,wood)>=h.r-.001);assert.equal(g.state.barricadesCleared,0);h.x=g.p.x;h.y=g.p.y;g.setup({barricades:[]});g.update(.02);near(g.p.hp,90);const kills=g.state.killCount,xp=g.state.xp;h.x=g.p.x+1201;g.updateHowlerSchedule();assert.equal(g.state.enemies.includes(h),false);assert.equal(g.state.killCount,kills);assert.equal(g.state.xp,xp);assert.equal(g.state.gems.length,0);assert.equal(g.state.enemyTally.howler,0);
});
test('paused, upgrade, extraction, bestiary, weapon-guide, and held-result modes freeze Howler lifecycle and warning',()=>{
  for(const mode of ['pause','upgrade','extraction','bestiary','weapons','end']){
    const g=loadGame();if(mode==='extraction'){prepareExit(g)}else quietHowler(g);const h=howler({phase:'howl',phaseTime:.6}),target=enemy({x:120,howlUntil:g.state.elapsed+3});g.setup({enemies:[h,target],nextHowlerAt:g.state.elapsed});
    if(mode==='pause')g.pause();if(mode==='upgrade')earnUpgrade(g);if(mode==='extraction')reachExit(g);if(['bestiary','weapons','end'].includes(mode)){finishForGuide(g);if(mode==='bestiary')g.showBestiary();if(mode==='weapons')g.showWeaponGuide()}
    const before=JSON.stringify({h,target,time:g.state.elapsed,next:g.state.nextHowlerAt,mode:g.state.mode});g.update(100);g.updateHowlerSchedule();g.updateHowls(100);g.moveHowler(h,100);assert.equal(JSON.stringify({h,target,time:g.state.elapsed,next:g.state.nextHowlerAt,mode:g.state.mode}),before,mode);
  }
});
test('green-door return clears nearby Howlers, cancels distant windups and haste, and retains accepted protection',()=>{
  const g=loadGame();prepareExit(g);const gate=g.state.exitBeacon;g.p.x=gate.x;g.p.y=gate.y;const close=howler({x:g.p.x+30,y:g.p.y,phase:'howl',phaseTime:.01}),far=howler({x:g.p.x+300,y:g.p.y,phase:'howl',phaseTime:.01}),target=enemy({x:g.p.x+250,y:g.p.y,howlUntil:999});g.setup({enemies:[close,far,target]});reachExit(g);chooseExitForTest(g,'stay');assert.ok(close.hp<=0);assert.ok(far.hp>0);assert.equal(far.phase,'approach');near(target.howlUntil,0);near(g.howlMultiplier(target),1);near(g.p.inv,1.5);near(g.state.reliefUntil,g.state.elapsed+2);assert.equal(g.state.enemyTally.howler,1);assert.equal(g.state.bossesDefeated,1);assert.equal(g.state.bonusChoices,0);
});
test('Bestiary exposes the actual Howler portrait and rally counters with eleven entries and four specialists',()=>{
  const g=loadGame({traceCanvas:true,preferencesStored:JSON.stringify({version:1,actors:'classic'})});g.showBestiary();assert.equal(guideIds(g).length,11);assert.match(g.el('modal').innerHTML,/All threats · 11/);assert.match(g.el('modal').innerHTML,/Howler tracking begins in Alpha 0.29/);g.setBestiaryFilter('specialist');assert.deepEqual(guideIds(g),['spitter','riot','howler','lobber']);assert.match(g.el('modal').innerHTML,/20% movement speed for 3 seconds/);const trace=g.drawingTrace('portrait-howler');assert.ok(trace.some(row=>row[0]==='ellipse'&&row[3]===4&&row[4]===6));assert.ok(trace.some(row=>row[0]==='fillText'&&row[1]==='HOWLER'));assert.ok(trace.some(row=>row.includes('#e2cf75')));
});
test('Howler result count and frozen per-enemy tally survive guides and reload, while retry resets encounter state',()=>{
  const g=loadGame();quietHowler(g);g.hitEnemy(howler(),1000);finishForGuide(g);const r=g.state.runResult,sheet=g.el('modal').innerHTML,saved=g.journalSaved();assert.equal(r.enemyTally.howler,1);assert.match(sheet,/<strong>1<\/strong><small>HOWLERS DEFEATED/);g.showBestiary();assert.equal(g.state.journal.bestiary.howler,1);g.closeBestiary();assert.equal(g.el('modal').innerHTML,sheet);assert.equal(g.journalSaved(),saved);const next=loadGame({journalStored:saved});assert.equal(next.state.journal.bestiary.howler,1);assert.equal(next.state.journal.history[0].enemyTally.howler,1);next.showJournal();assert.match(next.el('modal').innerHTML,/1 Howlers defeated/);g.el('again').click();near(g.state.nextHowlerAt,210);assert.equal(g.state.howlerIntroduced,false);assert.equal(g.state.enemyTally.howler,0);assert.equal(g.state.enemies.some(e=>e.howler),false);assert.equal(r.enemyTally.howler,1);
});
test('legacy, malformed, blocked, and future logs cannot invent Howler runtime powers or overwrite records',()=>{
  const old=journalData('scout',{bestiary:{shambler:10},history:[{outcome:'extracted',time:181,enemyTally:{runner:7}}]});const g=loadGame({journalStored:old});assert.equal(g.state.journal.bestiary.howler,0);assert.equal(g.state.journal.history[0].enemyTally.howler,0);assert.equal(g.state.journal.bestiary.shambler,10);assert.equal(g.journalSaved(),old);
  const bad=loadGame({journalStored:journalData('survivor',{bestiary:{howler:'<img>'},howlUntil:999,nextHowlerAt:0,history:[{outcome:'extracted',time:181,enemyTally:{howler:1e20}}]})});assert.equal(bad.state.journal.bestiary.howler,1e9);bad.start();near(bad.state.nextHowlerAt,210);assert.equal(bad.state.enemies.length,0);near(bad.p.speed,210);
  for(const options of [{storageBlocked:true},{journalStored:JSON.stringify({version:99,secret:'keep'})}]){const h=loadGame(options),raw=h.journalSaved();quietHowler(h);h.hitEnemy(howler(),1000);finishForGuide(h);assert.equal(h.state.journal.bestiary.howler,1);assert.equal(h.journalSaved(),raw)}
});
test('all five base survivors retain six-second dense-horde salvage with a Howler present and incoming haste canceled',()=>{
  for(const role of ['survivor','scout','bulwark','engineer','scavenger']){
    const g=loadGame();g.showRoster();g.selectSurvivor(role);cleanRun(g);g.scheduleRush(Infinity);g.setup({elapsed:145,nextBossAt:1000,exitAt:1000,obstacles:[],barrels:[],nextSupplyAt:Infinity});assert.ok(g.placeSalvage());const b=g.state.salvage;g.p.x=b.x;g.p.y=b.y;g.p.fireClock=999;
    const crowd=Array.from({length:238},(_,i)=>enemy({x:b.x+100*Math.cos(i/238*Math.PI*2),y:b.y+100*Math.sin(i/238*Math.PI*2),hp:1000,speed:i%3===0?208:i%3===1?112:78,dmg:i%3===0?9:i%3===1?12:20,r:i%3===2?23:15,howlUntil:999})),h=howler({x:b.x+100,y:b.y,phase:'howl',phaseTime:.01,speed:68,hp:1000,max:1000});g.setup({enemies:[h,...crowd]});
    for(let i=0;i<360&&g.state.mode==='play';i++){
      const a=i*g.p.speed/85/60,target={x:b.x+85*Math.cos(a),y:b.y+85*Math.sin(a)},d=Math.hypot(target.x-g.p.x,target.y-g.p.y),strength=d?Math.min(1,d*60/g.p.speed):0;g.touch.x=d?strength*(target.x-g.p.x)/d:0;g.touch.y=d?strength*(target.y-g.p.y)/d:0;g.update(1/60);assert.ok(crowd.every(e=>g.howlMultiplier(e)===1));
    }
    assert.equal(g.state.mode,'upgrade',role);assert.equal(g.state.salvagesSecured,1);assert.ok(g.p.hp>0,role);near(g.state.elapsed,151);assert.equal(g.state.killCount,0);assert.equal(g.state.enemies.length,239);
  }
});
test('two full six-minute overtime combat simulations encounter native Howlers while respecting all entity and effect budgets',()=>{
  for(const seed of [0x12345,0x67890]){
    const g=loadGame({seed});g.start();Object.assign(g.p,{inv:999,damage:80,pierce:3,arc:3,blades:3,molotov:3,rail:true,thunder:true,reaper:true,wildfire:true,proj:3,fire:.12});let seen=false,firstSeenAt=null;
    const settle=()=>{while(g.state.mode==='upgrade')g.choose(0);if(g.state.mode==='extraction')chooseExitForTest(g,'stay');while(g.state.mode==='upgrade')g.choose(0)};
    for(let i=0;i<10800;i++){
      settle();if(g.state.exitBeacon){const from={x:g.p.x,y:g.p.y};g.p.x=g.state.exitBeacon.x;g.p.y=g.state.exitBeacon.y;g.updateExtractionArrival(from);settle()}assert.equal(g.state.mode,'play');g.touch.x=Math.cos(i/90)*.6;g.touch.y=Math.sin(i/90)*.6;if(i%90===0)g.dash();g.update(1/30);seen||=g.state.enemies.some(e=>e.howler)||g.state.enemyTally.howler>0;if(seen&&firstSeenAt===null)firstSeenAt=g.state.elapsed;
      if(i%30===0){assert.ok(Number.isFinite(g.p.x)&&Number.isFinite(g.p.y)&&Number.isFinite(g.p.hp));assert.ok(g.state.enemies.length<=240);assert.ok(g.state.enemies.filter(e=>e.howler&&e.hp>0).length<=1);assert.ok(g.state.bullets.length<=g.limits.bullets);assert.ok(g.state.fires.length<=g.limits.fires);assert.ok(g.state.bottles.length<=g.limits.bottles);assert.ok(g.state.hostileShots.length<=g.limits.hostileShots);assert.ok(g.state.particles.length<=g.limits.particles);assert.ok(g.state.texts.length<=g.limits.texts);g.render()}
    }
    assert.ok(g.state.elapsed>=359.9);assert.equal(seen,true,'native Howler schedule is reachable with all events enabled, seed '+seed);assert.ok(firstSeenAt>=210-1e-8);assert.ok(g.state.overtime>0);
  }
});

// Overnight step 1: Scavenger collects earned XP without creating more.
test('Scavenger roster, persistence, pickup reach and supply sweep have the stated tradeoff',()=>{
 const g=loadGame();g.showRoster();assert.ok(g.el('role-scavenger'));g.selectSurvivor('scavenger');cleanRun(g);near(g.p.hp,90);near(g.p.speed,210);near(g.p.magnet,120);near(g.dropSweepRadius(),650);near(g.p.damage,18);near(g.fuelRadius(),145);
 g.setup({elapsed:74,supplyDrop:utilityDrop({x:0,phase:'ready'}),gems:[{x:600,y:0,value:4},{x:651,y:0,value:7}],nextDropAt:Infinity});g.updateDrops(.01,g.p);assert.equal(g.state.xp,4);assert.equal(g.state.gems.length,1);assert.equal(g.state.dropXpRecovered,4);const next=loadGame({journalStored:g.journalSaved()});assert.equal(next.state.selectedSurvivor,'scavenger');
 g.pause();quitForTest(g);g.showRoster();g.selectSurvivor('survivor');g.el('deploy').click();near(g.p.hp,100);near(g.p.magnet,80);near(g.dropSweepRadius(),500);
});

// Overnight step 2: banish modifies the pool, not earned rewards.
test('banish refreshes one offered non-weapon upgrade, excludes it for the run, and resets on retry',()=>{
 const g=loadGame();laterUpgrade(g);const picker=g.el('banishPick');assert.ok(picker);const name=picker.value,level=g.state.level,xp=g.state.xp,old=g.choices()[0];g.advanceClock(500);const b=g.el('banishUpgrade');choicePointer(b,'pointerdown');choicePointer(b,'pointerup');assert.equal(g.state.banishesLeft,0);assert.equal(g.state.rerollsLeft,1);assert.equal(g.state.level,level);assert.equal(g.state.xp,xp);assert.equal(g.state.banished.has(name),true);assert.ok(!offerNames(g).includes(name));g.advanceClock(500);old.click(0);assert.equal(g.state.mode,'upgrade');
 for(let i=0;i<50;i++)assert.ok(!g.upgradeChoices().some(o=>o.name===name));g.choose(0);finishForGuide(g);g.el('again').click();assert.equal(g.state.banishesLeft,1);assert.equal(g.state.banished.size,0);
});
test('banish has a fresh input guard and cannot remove starting weapons or consume reroll charges',()=>{
 const g=loadGame();cleanRun(g);earnUpgrade(g);assert.equal(g.el('banishUpgrade'),undefined);chooseNamed(g,'Piercing Rounds');earnUpgrade(g);const b=g.el('banishUpgrade');assert.ok(b);choicePointer(b,'pointerup');b.click(1);b.click(0);assert.equal(g.state.banishesLeft,1);g.advanceClock(500);choicePointer(b,'pointerdown');choicePointer(b,'pointermove',7,{clientY:150});choicePointer(b,'pointerup');assert.equal(g.state.banishesLeft,1);rerollPress(g);assert.equal(g.state.banishesLeft,1);assert.equal(g.state.rerollsLeft,0);
});

test('Second Wind rescues one lethal hit, preserves ordinary damage/invulnerability, and cannot recharge or import powers',()=>{
 const g=loadGame();cleanRun(g);const perk=g.opts.find(o=>o.name==='Second Wind');assert.ok(perk.available());perk.apply();assert.equal(perk.available(),false);g.p.hp=5;g.hurtPlayer(10);near(g.p.hp,25);near(g.p.inv,2);assert.equal(g.p.windSpent,true);assert.equal(g.state.mode,'play');g.hurtPlayer(1000);near(g.p.hp,25);g.p.inv=0;g.hurtPlayer(1000);assert.equal(g.state.mode,'end');assert.equal(g.state.runResult.secondWind,true);assert.equal(g.state.runResult.windSpent,true);assert.match(g.el('modal').innerHTML,/Second Wind.*spent/);g.el('again').click();assert.equal(g.p.secondWind,false);assert.equal(g.p.windSpent,false);
 const next=loadGame({journalStored:g.journalSaved()});cleanRun(next);assert.equal(next.p.secondWind,false);
});

test('Dash Capacitor has two bounded ranks and changes actual Dash cooldown without altering duration or protection',()=>{
 const g=loadGame();cleanRun(g);const o=g.opts.find(o=>o.name==='Dash Capacitor');g.dash();near(g.p.dashCd,2.5);o.apply();near(g.p.dashCd,2.25);near(g.dashCooldown(),2.25);o.apply();assert.equal(o.available(),false);near(g.dashCooldown(),2);g.p.dashCd=0;g.dash();near(g.p.dashCd,2);near(g.p.dash,.17);near(g.p.inv,.25);finishForGuide(g);assert.equal(g.state.runResult.capacitor,2);g.el('again').click();near(g.dashCooldown(),2.5);
});

test('Armor Plating reduces actual hits by at most three, never makes them harmless, and resets with no saved powers',()=>{
 const g=loadGame();cleanRun(g);const o=g.opts.find(o=>o.name==='Armor Plating');for(let i=0;i<3;i++)o.apply();assert.equal(o.available(),false);g.hurtPlayer(10);near(g.p.hp,93);g.p.inv=0;g.hurtPlayer(1);near(g.p.hp,92);g.hurtPlayer(10);near(g.p.hp,92);g.p.secondWind=true;g.p.hp=1;g.p.inv=0;g.hurtPlayer(100);near(g.p.hp,25);assert.equal(g.p.windSpent,true);finishForGuide(g);assert.equal(g.state.runResult.armor,3);g.el('again').click();near(g.p.armor,0);
});

test('objective waypoint marks only offscreen goals, prioritizes extraction, and stays outside thumb and HUD regions',()=>{
 for(const [width,height] of [[412,915],[915,412],[320,640]]){const g=loadGame({width,height});cleanRun(g);g.setup({rescue:stranded({x:2000})});const mark=g.objectiveWaypoint();assert.equal(mark.label,'SURVIVOR');assert.ok(mark.x>=45&&mark.x<=width-45);assert.ok(mark.y>=0&&mark.y<=height-160);g.setup({rescue:stranded({x:0})});assert.equal(g.objectiveWaypoint(),null);prepareExit(g);g.p.x+=2000;assert.equal(g.objectiveWaypoint().label,'EXIT');g.pause();assert.equal(g.objectiveWaypoint(),null);}
});

test('settings persist validated presentation preferences and return to pause or the exact held results without running gameplay',()=>{
 const g=loadGame();g.showSettings();g.el('pref-shake').click();g.el('pref-reduced').click();g.el('pref-numbers').click();assert.equal(g.state.preferences.shake,false);assert.equal(g.state.preferences.reduced,true);g.closeSettings();const next=loadGame({preferencesStored:g.preferencesSaved()});assert.equal(next.state.preferences.reduced,true);assert.equal(next.state.preferences.numbers,false);cleanRun(g);g.pause();g.showSettings();const time=g.state.elapsed;g.update(100);g.closeSettings();assert.equal(g.state.mode,'paused');near(g.state.elapsed,time);quitForTest(g);const sheet=g.el('modal').innerHTML,draws=g.drawCount(),saved=g.journalSaved();g.showSettings();g.frame(100);assert.equal(g.drawCount(),draws);g.closeSettings();assert.equal(g.el('modal').innerHTML,sheet);assert.equal(g.journalSaved(),saved);
});
test('settings tolerate blocked and future storage and cannot modify combat tuning or activate in play',()=>{
 for(const options of [{storageBlocked:true},{preferencesStored:JSON.stringify({version:99,sound:false})}]){const g=loadGame(options),raw=g.preferencesSaved();g.showSettings();g.el('pref-waypoints').click();assert.equal(g.state.preferences.waypoints,false);assert.equal(g.preferencesSaved(),raw);g.closeSettings();cleanRun(g);near(g.p.damage,18);near(g.p.speed,210);g.showSettings();assert.equal(g.state.mode,'play');}
});

test('Run Log filters and sorting never reorder stored history, rewrite records, or accept stale selectors',()=>{
 const raw=journalData('survivor',{history:[{outcome:'defeated',time:30,kills:10,level:2,survivor:'scout'},{outcome:'extracted',time:190,kills:90,level:8,survivor:'scavenger'},{outcome:'abandoned',time:50,kills:30,level:4,survivor:'scout'}]});const g=loadGame({journalStored:raw}),before=JSON.stringify(g.state.journal.history);g.showJournal();assert.match(g.el('modal').innerHTML,/90 eliminations · level 8/);const old=g.el('logOutcome');g.setJournalView('outcome','extracted');assert.match(g.el('modal').innerHTML,/Showing 1 of 3/);assert.doesNotMatch(g.el('modal').innerHTML,/DEFEATED · Scout/);old.value='defeated';old.dispatch('change');assert.equal(g.state.journalView.outcome,'extracted');g.setJournalView('outcome','all');g.setJournalView('sort','kills');assert.ok(g.el('modal').innerHTML.indexOf('EXTRACTED · Scavenger')<g.el('modal').innerHTML.indexOf('DEFEATED · Scout'));g.setJournalView('survivor','engineer');assert.match(g.el('modal').innerHTML,/No runs match/);g.setJournalView('sort','<img>');assert.equal(g.state.journalView.sort,'kills');assert.equal(JSON.stringify(g.state.journal.history),before);assert.equal(g.journalSaved(),raw);
});

function confirmRestore(g){g.advanceClock(500);const b=g.el('restoreConfirm');choicePointer(b,'pointerdown');choicePointer(b,'pointerup')}
function exampleBackup(){return JSON.stringify({game:'last-stand-after-dark',format:1,record:220,journal:{version:1,selected:'scavenger',bestiary:{howler:4},totals:{runs:3},history:[{outcome:'extracted',time:220,kills:50,survivor:'scavenger',secondWind:true,windSpent:true}]}})}
test('backup exports real JSON records, validates restore without mutation, and requires deliberate reviewed confirmation',async()=>{
 const g=loadGame();g.showBackup();const text=g.el('backupExport').value;assert.equal(JSON.parse(text).game,'last-stand-after-dark');g.el('backupDownload').click();assert.equal(g.downloads().length,1);assert.equal(await g.downloads()[0].text(),text);g.el('backupImport').value=exampleBackup();const saved=g.journalSaved();g.el('backupReview').click();assert.equal(g.journalSaved(),saved);assert.equal(g.state.journal.totals.runs,0);assert.match(g.el('modal').innerHTML,/does not merge/);const b=g.el('restoreConfirm');b.click(1);choicePointer(b,'pointerup');b.click(0);assert.equal(g.state.mode,'backup');confirmRestore(g);assert.equal(g.state.mode,'menu');assert.equal(g.state.record,220);assert.equal(g.state.journal.bestiary.howler,4);assert.equal(g.state.selectedSurvivor,'scavenger');assert.equal(g.state.journal.totals.runs,3);cleanRun(g);near(g.p.hp,90);assert.equal(g.p.secondWind,false);assert.equal(g.p.windSpent,false);
});
test('invalid oversized and future backup formats are rejected without HTML injection or record writes',()=>{
 const g=loadGame();g.showBackup();const saved=g.journalSaved();for(const input of ['<img src=x>','x'.repeat(262145),'{}',JSON.stringify({game:'last-stand-after-dark',format:99})]){g.el('backupImport').value=input;g.reviewBackup();assert.equal(g.state.pendingRestore,null);assert.equal(g.journalSaved(),saved);assert.doesNotMatch(g.el('modal').innerHTML,/<img/)}g.closeBackup();cleanRun(g);g.showBackup();assert.equal(g.state.mode,'play');
});
test('backup cancel preserves the exact result and failed second write rolls back the old journal',()=>{
 const g=loadGame();cleanRun(g);finishForGuide(g);const sheet=g.el('modal').innerHTML,saved=g.journalSaved(),draws=g.drawCount();g.showBackup();g.frame(100);assert.equal(g.drawCount(),draws);g.el('backupImport').value=exampleBackup();g.reviewBackup();g.closeBackup();assert.equal(g.el('modal').innerHTML,sheet);assert.equal(g.journalSaved(),saved);
 const raw=journalData('scout',{totals:{runs:2}}),h=loadGame({journalStored:raw,stored:'90',failWriteKey:'ls-record'});h.showBackup();h.el('backupImport').value=exampleBackup();h.reviewBackup();confirmRestore(h);assert.equal(h.journalSaved(),raw);assert.equal(h.saved(),'90');assert.equal(h.state.record,90);assert.equal(h.state.journal.totals.runs,2);assert.match(h.el('backupMessage').textContent,/unchanged/);
});
test('blocked storage and newer local journals cannot be replaced by a backup',()=>{
 const g=loadGame({storageBlocked:true});g.showBackup();g.el('backupImport').value=exampleBackup();g.reviewBackup();confirmRestore(g);assert.equal(g.state.journal.totals.runs,0);assert.equal(g.state.mode,'backup');
 const raw=JSON.stringify({version:99,keep:true}),h=loadGame({journalStored:raw});h.showBackup();assert.equal(h.backupText(),'');assert.equal(h.el('backupReview').onclick,undefined);assert.equal(h.journalSaved(),raw);
});

test('local backup files are reviewed without writes and asynchronous reads cannot reopen a screen after leaving',async()=>{
 const g=loadGame();g.showBackup();const picker=g.el('backupFile');picker.files=[{size:100,text:async()=>exampleBackup()}];const saved=g.journalSaved();await picker.dispatch('change');assert.ok(g.state.pendingRestore);assert.equal(g.journalSaved(),saved);g.closeBackup();g.showBackup();let resolve;const file=g.el('backupFile');file.files=[{size:100,text:()=>new Promise(r=>{resolve=r})}];const reading=file.dispatch('change');g.closeBackup();resolve(exampleBackup());await reading;assert.equal(g.state.mode,'menu');assert.equal(g.state.pendingRestore,null);
});

test('damage recap records real HP loss, armor prevention and canonical contact/projectile sources without counting protected hits',()=>{
 const g=loadGame();cleanRun(g);g.p.armor=3;g.hurtPlayer(10,'runner');near(g.state.damageTaken,7);near(g.state.armorPrevented,3);assert.equal(g.state.hitsTaken,1);assert.equal(g.state.lastThreat,'runner');g.hurtPlayer(100,'warden-shot');assert.equal(g.state.hitsTaken,1);g.p.inv=0;g.hurtPlayer(0);g.hurtPlayer(NaN);assert.equal(g.state.hitsTaken,1);g.p.hp=2;g.hurtPlayer(100,'spitter-shot');assert.equal(g.state.mode,'end');near(g.state.runResult.damageTaken,9);near(g.state.runResult.armorPrevented,6);assert.equal(g.state.runResult.lastThreat,'spitter-shot');assert.match(g.el('modal').innerHTML,/Last hit: Spitter shot/);const next=loadGame({journalStored:g.journalSaved()});next.showJournal();assert.match(next.el('modal').innerHTML,/9 HP lost to hits/);g.el('again').click();near(g.state.damageTaken,0);near(g.state.hitsTaken,0);assert.equal(g.state.lastThreat,'none');
});
test('actual melee and hostile-shot updates identify the last threat and Second Wind still accounts only for HP actually lost',()=>{
 const g=loadGame();cleanRun(g);g.p.fireClock=999;g.setup({enemies:[enemy({x:0,y:0,type:1})]});g.update(.01);assert.equal(g.state.lastThreat,'runner');g.setup({enemies:[],hostileShots:[hostileShot({x:-30,y:0,vx:1000,kind:'warden'})]});g.p.inv=0;g.update(.03);assert.equal(g.state.lastThreat,'warden-shot');g.p.inv=0;g.p.hp=2;g.p.secondWind=true;const before=g.state.damageTaken;g.hurtPlayer(100,'brute');near(g.state.damageTaken,before+2);near(g.p.hp,25);assert.equal(g.p.windSpent,true);
});
test('all three support perks can be selected through actual later-upgrade cards and never replace the four starting weapons',()=>{
 for(const [name,field] of [['Second Wind','secondWind'],['Dash Capacitor','capacitor'],['Armor Plating','armor']]){
  let selected=false;
  for(let seed=1;seed<=60&&!selected;seed++){const g=loadGame({seed});laterUpgrade(g);if(g.state.upgradeOffer.picks.some(o=>o.name===name)){chooseNamed(g,name);assert.ok(g.p[field]);assert.equal(g.state.mode,'play');assert.equal(g.state.level,3);selected=true}}
  assert.equal(selected,true,name);
 }
});
test('banish and reroll coexist with a ready evolution and preserve its single queued contract reward',()=>{
 const g=loadGame();cleanRun(g);earnUpgrade(g);chooseNamed(g,'Piercing Rounds');g.p.pierce=3;g.setup({bonusChoices:1,xp:3});g.state.bonusKinds.push('contract');g.checkLevelUp();const level=g.state.level;const name=g.el('banishPick').value;g.advanceClock(500);choicePointer(g.el('banishUpgrade'),'pointerdown');choicePointer(g.el('banishUpgrade'),'pointerup');assert.equal(g.state.banishesLeft,0);rerollPress(g);assert.equal(g.state.rerollsLeft,0);assert.equal(g.state.level,level);assert.match(g.el('modal').innerHTML,/CONTRACT COMPLETE/);assert.ok(!offerNames(g).includes(name));fixtureOfferedUpgrade(g,'Evolve: Railstorm');chooseNamed(g,'Evolve: Railstorm');assert.equal(g.p.rail,true);assert.equal(g.state.mode,'play');assert.equal(g.state.xp,3);assert.equal(g.state.bonusChoices,0);
});
test('reduced decorative effects and hidden damage numbers keep enemy deaths, XP, incoming damage, and Howler warnings intact',()=>{
 const g=loadGame({preferencesStored:JSON.stringify({version:1,reduced:true,numbers:false,shake:false})});cleanRun(g);for(let i=0;i<100;i++)g.hitEnemy(enemy({hp:1}),2);assert.equal(g.state.killCount,100);assert.equal(g.state.gems.length,100);assert.ok(g.state.particles.length<=120);assert.ok(g.state.texts.every(t=>!/^[0-9]+$/.test(String(t.t))));g.hurtPlayer(10,'runner');near(g.p.hp,90);near(g.state.damageTaken,10);
 const h=loadGame({traceCanvas:true,preferencesStored:JSON.stringify({version:1,reduced:true})});readyHowl(h);h.renderHowlerWarnings();assert.ok(h.drawingTrace().some(row=>row.includes('#ffe08288')));assert.ok(h.drawingTrace().some(row=>row[0]==='arc'&&row[3]===170));
});
test('forged support and recap history is bounded display data and cannot create runtime upgrades or HTML',()=>{
 const raw=JSON.parse(exampleBackup());raw.journal.history[0]={...raw.journal.history[0],armor:999,capacitor:999,secondWind:true,windSpent:false,damageTaken:'<img>',hitsTaken:Infinity,lastThreat:'constructor'};const g=loadGame();g.showBackup();g.el('backupImport').value=JSON.stringify(raw);g.reviewBackup();confirmRestore(g);const row=g.state.journal.history[0];assert.equal(row.armor,3);assert.equal(row.capacitor,2);assert.equal(row.damageTaken,null);assert.equal(row.lastThreat,null);g.showJournal();assert.doesNotMatch(g.el('modal').innerHTML,/<img|Last hit: constructor/);cleanRun(g);assert.equal(g.p.armor,0);assert.equal(g.p.capacitor,0);assert.equal(g.p.secondWind,false);assert.equal(g.state.hitsTaken,0);
});
test('scrolling or an obsolete restore confirmation cannot replace local records',()=>{
 const g=loadGame();g.showBackup();g.el('backupImport').value=exampleBackup();g.reviewBackup();const old=g.el('restoreConfirm'),before=g.journalSaved();g.advanceClock(500);choicePointer(old,'pointerdown');choicePointer(old,'pointermove',7,{clientY:160});choicePointer(old,'pointerup');assert.equal(g.journalSaved(),before);g.el('restoreEdit').click();g.el('backupImport').value=exampleBackup();g.reviewBackup();g.advanceClock(500);old.click(0);choicePointer(old,'pointerdown');choicePointer(old,'pointerup');assert.equal(g.journalSaved(),before);assert.equal(g.state.journal.totals.runs,0);g.closeBackup();
});
test('Scavenger with support upgrades completes a full four-minute simulation with normal encounter/effect limits',()=>{
 const g=loadGame({seed:0x130030,preferencesStored:JSON.stringify({version:1,reduced:true})});g.showRoster();g.selectSurvivor('scavenger');g.start();Object.assign(g.p,{armor:3,capacitor:2,secondWind:true,inv:999,damage:65,pierce:3,arc:3,blades:3,molotov:3,rail:true,thunder:true,reaper:true,wildfire:true,proj:3,fire:.12});
 for(let i=0;i<7200;i++){
  while(g.state.mode==='upgrade')g.choose(0);if(g.state.mode==='extraction')chooseExitForTest(g,'stay');g.touch.x=Math.cos(i/90)*.6;g.touch.y=Math.sin(i/90)*.6;if(i%90===0)g.dash();g.update(1/30);
  if(i%60===0){assert.equal(g.state.mode,'play');assert.ok(Number.isFinite(g.p.hp)&&Number.isFinite(g.p.x));assert.ok(g.state.enemies.length<=240);assert.ok(g.state.particles.length<=120);assert.ok(g.state.bullets.length<=g.limits.bullets);assert.ok(g.state.fires.length<=2);assert.ok(g.state.hostileShots.length<=12);g.render()}
 }
 assert.equal(g.state.runSurvivor,'scavenger');assert.ok(g.state.elapsed>=239.9);near(g.dashCooldown(),2);assert.equal(g.p.windSpent,false);
});
test('thirty-minute overnight soak retains bounded effects, one-per-run choices, finite stats, and a valid final backup',()=>{
 const g=loadGame({seed:0x303030});g.showRoster();g.selectSurvivor('scavenger');g.start();Object.assign(g.p,{armor:3,capacitor:2,secondWind:true,inv:99999,damage:65,pierce:3,arc:3,blades:3,molotov:3,rail:true,thunder:true,reaper:true,wildfire:true,proj:5,fire:.075});let usedBanish=false,usedReroll=false;
 const choose=()=>{while(g.state.mode==='upgrade'){
   if(!usedBanish&&g.el('banishUpgrade')){g.advanceClock(500);choicePointer(g.el('banishUpgrade'),'pointerdown');choicePointer(g.el('banishUpgrade'),'pointerup');usedBanish=true}
   if(!usedReroll&&g.el('rerollUpgrade')?.onclick){rerollPress(g);usedReroll=true}g.choose(0);
 }};
 for(let i=0;i<54000;i++){
  choose();if(g.state.mode==='extraction')chooseExitForTest(g,'stay');g.touch.x=Math.cos(i/90)*.6;g.touch.y=Math.sin(i/90)*.6;if(i%90===0)g.dash();g.update(1/30);
  if(i%90===0){choose();if(g.state.mode==='extraction')chooseExitForTest(g,'stay');choose();assert.equal(g.state.mode,'play');for(const v of [g.p.x,g.p.y,g.p.hp,g.p.damage,g.p.speed,g.p.magnet,g.state.elapsed])assert.ok(Number.isFinite(v));assert.ok(g.state.enemies.length<=240);assert.ok(g.state.enemies.filter(e=>e.howler&&e.hp>0).length<=1);assert.ok(g.state.particles.length<=600);assert.ok(g.state.texts.length<=100);assert.ok(g.state.bullets.length<=100);assert.ok(g.state.hostileShots.length<=12);assert.ok(g.state.fires.length<=2);assert.ok(g.state.bottles.length<=2);assert.ok(g.state.burnHits.size<=240);assert.ok(g.state.bladeHits.size<=240);if(usedBanish)assert.equal(g.state.banishesLeft,0);if(usedReroll)assert.equal(g.state.rerollsLeft,0);g.render()}
 }
 choose();if(g.state.mode==='extraction')chooseExitForTest(g,'stay');choose();assert.ok(g.state.elapsed>=1799.9);assert.equal(usedBanish,true);assert.equal(usedReroll,true);assert.equal(g.p.windSpent,false);finishForGuide(g);assert.equal(g.state.journal.totals.runs,1);assert.ok(Object.isFrozen(g.state.runResult));const backup=g.parseBackup(g.backupText());assert.equal(backup.journal.history.length,1);assert.equal(backup.journal.selected,'scavenger');assert.ok(backup.record>=1799.9);
});

// Alpha 0.31 — optional rules are deployment choices, never imported powers.
test('challenge rules default to Standard and only change on the roster',()=>{
 const g=loadGame();assert.equal(g.state.selectedRule,'standard');g.selectRule('glass');assert.equal(g.state.selectedRule,'standard');g.showRoster();g.selectRule('bogus');assert.equal(g.state.selectedRule,'standard');g.selectRule('glass');g.start();assert.equal(g.state.runRule,'glass');near(g.p.max,80);near(g.p.damage,21.6);g.selectRule('iron');assert.equal(g.state.runRule,'glass');
 g.pause();quitForTest(g);assert.equal(JSON.parse(g.journalSaved()).history[0].rule,'glass');g.el('again').click();near(g.p.damage,21.6);near(g.p.max,80);
});
for(const role of ['survivor','scout','bulwark','engineer','scavenger'])test(`Glass Cannon applies once to ${role} base loadout`,()=>{
 const g=loadGame();g.showRoster();g.selectSurvivor(role);g.selectRule('glass');g.start();near(g.p.max,Math.round(g.survivorById(role).hp*.8));near(g.p.speed,g.survivorById(role).speed);near(g.p.damage,21.6);g.start();near(g.p.damage,21.6);
});
test('Iron Horde alters ordinary health only with identical seeded spawns',()=>{
 const a=loadGame(),b=loadGame();a.showRoster();b.showRoster();b.selectRule('iron');a.start();b.start();a.setup({elapsed:60});b.setup({elapsed:60});for(let i=0;i<20;i++){a.spawnEnemy();b.spawnEnemy()}
 for(let i=0;i<20;i++){const x=a.state.enemies[i],y=b.state.enemies[i];near(y.hp,x.hp*1.25);near(y.max,x.max*1.25);for(const key of ['x','y','speed','dmg','r','type'])near(y[key],x[key])}a.spawnBoss();b.spawnBoss();near(a.state.activeBoss.hp,b.state.activeBoss.hp);near(b.p.max,100);near(b.p.damage,18);
});
test('challenge history rejects unknown rules and backup never changes chosen run rules',()=>{
 const g=loadGame({journalStored:JSON.stringify({version:1,history:[{outcome:'extracted',time:180,rule:'<script>'},{outcome:'defeated',time:20,rule:'iron'}]})});assert.equal(g.state.journal.history[0].rule,null);assert.equal(g.state.journal.history[1].rule,'iron');assert.equal(g.state.selectedRule,'standard');
 const backup=JSON.parse(g.backupText());backup.runRule='glass';const parsed=g.parseBackup(JSON.stringify(backup));assert.equal(parsed.runRule,undefined);assert.equal(g.state.selectedRule,'standard');
});

test('shock drums seed one visible tool and ignore walking, gunfire, and spent replay',()=>{
 const g=loadGame();g.start();assert.equal(g.state.shockDrums.length,1);const b=g.state.shockDrums[0];g.p.x=b.x;g.p.y=b.y;g.updateShockDrums(.02,{x:b.x,y:b.y},false);assert.equal(g.state.shocksUsed,0);
 g.setup({bullets:[{...bullet(),x:b.x,y:b.y,vx:100,vy:0}]});g.updateProjectiles(.02);assert.equal(g.state.shocksUsed,0);g.updateShockDrums(.02,{x:b.x-100,y:b.y},true);assert.equal(g.state.shocksUsed,1);g.dischargeShock(b);assert.equal(g.state.shocksUsed,1);assert.equal(g.state.killCount,0);near(g.state.xp,0);
});
test('shock stun caps at nearest twelve, excludes bosses/trucks/dead, and does not hurt targets',()=>{
 const g=loadGame();cleanRun(g);const b={x:0,y:0,r:17,spent:false},targets=Array.from({length:20},(_,i)=>enemy({x:30+i,hp:100})),boss=enemy({x:0,type:3,hp:500}),truck=enemy({x:0,convoy:true});g.setup({shockDrums:[b],activeBoss:boss,enemies:[boss,truck,enemy({x:0,hp:0}),...targets]});g.dischargeShock(b);
 assert.equal(g.state.shockStuns,12);for(let i=0;i<20;i++){near(targets[i].hp,100);assert.equal(!!targets[i].salvageStunUntil,i<12)}assert.equal(boss.salvageStunUntil,undefined);assert.equal(truck.salvageStunUntil,undefined);near(g.p.hp,100);near(g.p.inv,0);assert.equal(g.state.gems.length,0);
});
test('shock cancels specialist windups and motion until stun expires',()=>{
 const g=loadGame();cleanRun(g);g.p.fireClock=100;const b={x:100,y:0,r:17,spent:false},e=enemy({x:100,hp:100,spitter:true,type:4,phase:'aim',phaseTime:.01,aimX:-1,aimY:0,speed:100,cooldown:0});g.setup({shockDrums:[b],enemies:[e]});g.dischargeShock(b);assert.equal(e.phase,'approach');g.update(.1);near(e.x,100);assert.equal(g.state.hostileShots.length,0);assert.ok(e.salvageStunUntil>g.state.elapsed);g.setup({elapsed:2});g.update(.02);assert.ok(e.cooldown<1.5);
});
test('shock scheduling is bounded, pauses, culls distant tools, and resets each run',()=>{
 const g=loadGame();cleanRun(g);g.setup({shockClock:0,obstacles:[],barrels:[]});g.updateShockDrums(.01,g.p,false);assert.equal(g.state.shockDrums.length,1);g.setup({shockClock:0});g.updateShockDrums(.01,g.p,false);assert.equal(g.state.shockDrums.length,2);g.setup({shockClock:0});g.updateShockDrums(.01,g.p,false);assert.equal(g.state.shockDrums.length,2);g.pause();g.updateShockDrums(100,g.p,true);assert.equal(g.state.shocksUsed,0);assert.equal(g.state.shockDrums.length,2);g.resume();g.p.x=5000;g.updateShockDrums(.01,g.p,false);assert.equal(g.state.shockDrums.length,0);g.start();assert.equal(g.state.shockDrums.length,1);assert.equal(g.state.shocksUsed,0);
});
test('shock results and history record usage without granting saved stun powers',()=>{
 const g=loadGame();cleanRun(g);const b={x:0,y:0,r:17,spent:false};g.setup({shockDrums:[b],enemies:[enemy()]});g.dischargeShock(b);g.pause();quitForTest(g);assert.equal(g.state.runResult.shocks,1);assert.equal(g.state.runResult.shockStuns,1);const row=JSON.parse(g.journalSaved()).history[0];assert.equal(row.shocks,1);assert.equal(row.shockStuns,1);assert.match(g.el('modal').innerHTML,/SHOCK DRUMS/);g.el('again').click();assert.equal(g.state.shocksUsed,0);assert.equal(g.state.shockStuns,0);
});

test('Power Outage contract rewards three distinct discharges once without changing schedules',()=>{
 const g=loadGame();startContract(g,'shock');assert.equal(g.state.shockClock,Infinity);for(let i=0;i<3;i++){const b={x:0,y:0,r:17,spent:false};g.setup({shockDrums:[b]});g.dischargeShock(b);g.dischargeShock(b);g.checkContract();assert.equal(g.contractProgress(),i+1);assert.equal(g.state.bonusChoices,i===2?1:0)}
 assert.equal(g.state.contractCompleted,true);g.checkContract();assert.equal(g.state.bonusChoices,1);g.checkLevelUp();assert.equal(g.state.mode,'upgrade');assert.match(g.el('modal').innerHTML,/CONTRACT COMPLETE/);g.choose(0);assert.equal(g.state.mode,'play');assert.equal(g.state.bonusChoices,0);g.pause();quitForTest(g);const row=JSON.parse(g.journalSaved()).history[0];assert.equal(row.contract,'shock');assert.equal(row.contractCompleted,true);assert.equal(row.contractProgress,3);
});
test('unfinished Power Outage never blocks extraction and Standard has no shock reward',()=>{
 const g=loadGame();startContract(g,'shock');prepareExit(g);reachExit(g);chooseExitForTest(g,'extract');assert.equal(g.state.runResult.contractCompleted,false);assert.equal(g.state.runResult.outcome,'extracted');
 const a=loadGame();cleanRun(a);for(let i=0;i<4;i++){const b={x:0,y:0,r:17};a.setup({shockDrums:[b]});a.dischargeShock(b)}a.checkContract();assert.equal(a.state.bonusChoices,0);
});

test('offscreen shot warnings show only approaching near-term trajectories and cap/deduplicate',()=>{
 const g=loadGame({width:412,height:500,preferencesStored:JSON.stringify({version:1,hud:'classic'})});cleanRun(g);g.setup({hostileShots:[{x:300,y:0,vx:-300,vy:0,r:7,life:2,kind:'spitter'},{x:310,y:0,vx:-300,vy:0,r:7,life:2},{x:-300,y:0,vx:300,vy:0,r:7,life:2,kind:'warden'},{x:0,y:300,vx:0,vy:-300,r:7,life:2},{x:0,y:-300,vx:0,vy:300,r:7,life:2}]});const marks=g.shotWarnings();assert.equal(marks.length,3);assert.equal(marks.filter(m=>Math.abs(m.angle)<.1).length,1);assert.ok(marks.every(m=>m.x>=22&&m.x<=390&&m.y>=225&&m.y<=315));
 for(const b of g.state.hostileShots){b.vx=-b.vx;b.vy=-b.vy}assert.equal(g.shotWarnings().length,0);
});
test('offscreen warnings ignore visible, expired, short-lived, distant, and passing shots without mutating combat',()=>{
 const g=loadGame();cleanRun(g);const shots=[{x:100,y:0,vx:-100,vy:0,r:7,life:2},{x:300,y:0,vx:-300,vy:0,r:7,life:0},{x:300,y:0,vx:-300,vy:0,r:7,life:.1},{x:1000,y:0,vx:-100,vy:0,r:7,life:20},{x:300,y:200,vx:-300,vy:0,r:7,life:2}];g.setup({hostileShots:shots});const before=JSON.stringify(shots);assert.equal(g.shotWarnings().length,0);assert.equal(JSON.stringify(shots),before);near(g.p.hp,100);
 g.setup({hostileShots:[{x:300,y:0,vx:-300,vy:0,r:7,life:2}]});assert.equal(g.shotWarnings().length,1);g.pause();assert.equal(g.shotWarnings().length,0);g.showSettings();g.el('pref-warnings').click();assert.equal(g.state.preferences.warnings,false);g.closeSettings();g.resume();assert.equal(g.shotWarnings().length,0);const next=loadGame({preferencesStored:g.preferencesSaved()});assert.equal(next.state.preferences.warnings,false);
});

test('pause objective selector can pin active goals and falls back when the goal disappears',()=>{
 const g=loadGame();cleanRun(g);g.setup({salvage:{x:600,y:0,r:110,progress:0,until:1000,entered:false},supplyDrop:{x:-600,y:0,r:21,phase:'signal'}});assert.equal(g.objectiveWaypoint().label,'SALVAGE');g.selectObjective('drop');assert.equal(g.state.objectiveFocus,'auto');g.pause();const time=g.state.elapsed,xp=g.state.xp;const picker=g.el('objectivePick');picker.value='drop';picker.dispatch('change');assert.equal(g.state.objectiveFocus,'drop');g.selectObjective('<script>');assert.equal(g.state.objectiveFocus,'drop');g.update(10);near(g.state.elapsed,time);near(g.state.xp,xp);g.resume();assert.equal(g.objectiveWaypoint().label,'DROP');g.setup({supplyDrop:null});g.updateEncounterHUD();g.update(.001);assert.equal(g.state.objectiveFocus,'auto');assert.equal(g.objectiveWaypoint().label,'SALVAGE');picker.value='drop';picker.dispatch('change');assert.equal(g.state.objectiveFocus,'auto');g.start();assert.equal(g.state.objectiveFocus,'auto');
});
test('automatic pointer still prioritizes green exit while manual selection is explicitly optional',()=>{
 const g=loadGame();prepareExit(g);g.setup({supplyCache:{x:-600,y:0,r:20}});g.p.hp=80;g.state.exitBeacon.x=600;g.state.exitBeacon.y=0;assert.equal(g.objectiveWaypoint().label,'EXIT');g.pause();g.selectObjective('medical');g.resume();assert.equal(g.objectiveWaypoint().label,'MEDICAL');g.pause();g.selectObjective('auto');g.resume();assert.equal(g.objectiveWaypoint().label,'EXIT');
});

test('pause build inspection reports actual gun and evolved path values without advancing the run',()=>{
 const g=loadGame();cleanRun(g);Object.assign(g.p,{damage:40,proj:3,fire:.2,pierce:3,rail:true,arc:3,thunder:true,blades:3,reaper:true,molotov:3,wildfire:true,capacitor:2,armor:3,regen:1.5,magnet:120,secondWind:true});const before=JSON.stringify(g.currentRunStats()),elapsed=g.state.elapsed;g.pause();const sheet=g.el('modal').innerHTML;
 for(const text of ['INSPECT CURRENT BUILD','50 per bullet','3 bullets per volley','5 volleys/s','up to 8 targets','40 per target','0.8s successful-strike','6 blades','54 per hit','24 per 0.4s tick','3.6s volley','2.00s recharge','120 units pickup','Second Wind ready','Armor 3/3'])assert.ok(sheet.includes(text),text);g.update(20);near(g.state.elapsed,elapsed);assert.equal(JSON.stringify(g.currentRunStats()),before);g.resume();assert.equal(g.state.mode,'play');
});
test('base build inspection omits unowned weapons and capacitor Dash ring uses its real recharge',()=>{
 const g=loadGame();cleanRun(g);const sheet=g.buildSheet();assert.match(sheet,/18 per bullet/);assert.doesNotMatch(sheet,/per-target interval|per 0.4s tick|successful-strike/);g.p.capacitor=2;g.dash();assert.match(g.el('dash').style.background,/0deg/);g.update(1);assert.match(g.el('dash').style.background,/180deg/);
});

test('four new medals use exact validated thresholds and grant no stats or retroactive unknown credit',()=>{
 const g=loadGame();cleanRun(g);const base={outcome:'defeated',breakers:0,barrels:0,overtime:0,rescues:0,shockStuns:19,pierce:3,rail:true,arc:2,thunder:true};assert.equal(g.earnedMedals(base).length,0);const r={...base,rescues:1,shockStuns:20,arc:3,rule:'iron',outcome:'extracted'};
 assert.deepEqual(Array.from(g.earnedMedals(r),m=>m.name),['Made It Out','Lifeline','Crowd Control','Arsenal','Iron Escape']);assert.ok(!g.earnedMedals({...r,outcome:'defeated'}).some(m=>m.name==='Iron Escape'));const before=JSON.stringify(g.p);g.earnedMedals(r);assert.equal(JSON.stringify(g.p),before);
 const h=loadGame({journalStored:JSON.stringify({version:1,history:[{outcome:'extracted',time:180,rail:true,thunder:true,pierce:0,arc:0,rule:'bogus',shockStuns:'999',rescues:null}]})});assert.deepEqual(Array.from(h.earnedMedals(h.state.journal.history[0]),m=>m.name),['Made It Out']);
});
test('new medal progress is visible in Pause and final medals remain frozen across retry',()=>{
 const g=loadGame();cleanRun(g);g.p.pierce=g.p.arc=3;g.p.rail=g.p.thunder=true;g.pause();assert.match(g.el('modal').innerHTML,/0\/1 delivered · 0\/20 shock stuns · 2\/2 evolved paths/);quitForTest(g);const r=g.state.runResult;assert.ok(g.earnedMedals(r).some(m=>m.name==='Arsenal'));g.el('again').click();assert.equal(g.earnedMedals(g.currentRunStats()).length,0);assert.ok(g.earnedMedals(r).some(m=>m.name==='Arsenal'));
});

test('result record chase compares prior matching survivor/rules without comparing to itself',()=>{
 const prior={outcome:'defeated',time:60,kills:10,level:4,survivor:'survivor',rule:'standard',route:'downtown'};const g=loadGame({stored:'100',journalStored:JSON.stringify({version:1,history:[prior,{...prior,time:999,kills:999,rule:'iron'},{...prior,time:999,kills:999,survivor:'scout'},{...prior,time:999,kills:999,rule:undefined}]})});cleanRun(g);g.setup({elapsed:70,killCount:20,level:3});g.pause();quitForTest(g);const b=g.state.runComparison;assert.ok(Object.isFrozen(b));assert.equal(b.matched,1);near(b.time,60);assert.equal(b.kills,10);assert.equal(b.level,4);const text=g.comparisonPanel();assert.match(text,/30 short/);assert.match(text,/new best \+00:10/);assert.match(text,/new best \+10/);assert.match(text,/1 below best/);const sheet=g.el('modal').innerHTML;g.showSettings();g.closeSettings();assert.equal(g.el('modal').innerHTML,sheet);assert.equal(g.state.runComparison,b);
});
test('first record chase and overall best are frozen before record storage and reset on retry',()=>{
 const g=loadGame({stored:'20',storageBlocked:true});cleanRun(g);g.setup({elapsed:30});g.pause();quitForTest(g);assert.equal(g.state.runComparison.matched,0);assert.equal(g.state.runComparison.overallNew,true);assert.match(g.comparisonPanel(),/NEW SURVIVAL BEST/);assert.match(g.comparisonPanel(),/First saved run/);const b=g.state.runComparison;g.showRunResult();assert.equal(g.state.runComparison,b);g.el('again').click();assert.equal(g.state.runComparison,null);
});

test('Run Log details persist final numeric build and species counts without equipping saved powers',()=>{
 const g=loadGame();cleanRun(g);Object.assign(g.p,{hp:73,max:130,damage:42,fire:.075,speed:250,regen:1.5,magnet:124,bulletSpeed:750,armor:2});g.hitEnemy(enemy({hp:1}),2);g.pause();quitForTest(g);const row=JSON.parse(g.journalSaved()).history[0];near(row.fire,.075);near(row.damage,42);near(row.hp,73);near(row.magnet,124);const h=loadGame({journalStored:g.journalSaved()});h.showJournal();const sheet=h.el('modal').innerHTML;for(const text of ['OPEN RUN DETAILS','13.33','Shambler: 1','73 / 130','124'])assert.ok(sheet.includes(text),text);h.el('journalBack').click();cleanRun(h);near(h.p.damage,18);near(h.p.max,100);near(h.p.fire,.33);near(h.p.armor,0);
});
test('Run Log rule filter distinguishes legacy and known rules without rewriting saves',()=>{
 const raw=JSON.stringify({version:1,history:[{outcome:'defeated',time:20,rule:'iron'},{outcome:'extracted',time:180,rule:'standard'},{outcome:'abandoned',time:4}]});const g=loadGame({journalStored:raw});g.showJournal();const stale=g.el('logRule');g.setJournalView('rule','iron');assert.match(g.el('modal').innerHTML,/Showing 1 of 3/);assert.match(g.el('modal').innerHTML,/RUN RULES · Iron Horde/);g.setJournalView('rule','legacy');assert.match(g.el('modal').innerHTML,/Showing 1 of 3/);assert.match(g.el('modal').innerHTML,/rules not recorded/);stale.value='standard';stale.dispatch('change');assert.equal(g.state.journalView.rule,'legacy');g.setJournalView('rule','<script>');assert.equal(g.state.journalView.rule,'legacy');assert.equal(g.journalSaved(),raw);assert.match(g.el('modal').innerHTML,/Unavailable/);
});
test('malformed combat snapshots cannot inject markup, divide by zero, or produce saved runtime power',()=>{
 const g=loadGame({journalStored:JSON.stringify({version:1,history:[{outcome:'defeated',time:1,fire:0,damage:'<img>',hp:-1,max:1e30,speed:null,magnet:'999',bulletSpeed:Infinity}]})});const r=g.state.journal.history[0];assert.equal(r.fire,null);assert.equal(r.damage,null);assert.equal(r.hp,null);assert.equal(r.max,1e9);g.showJournal();assert.doesNotMatch(g.el('modal').innerHTML,/<img|Infinity|NaN|undefined/);
});

test('field manual opens from menu or Pause, freezes combat, and never resumes automatically',()=>{
 const g=loadGame();g.openHomeEntry('manualOpen');assert.equal(g.state.mode,'manual');assert.equal(g.state.manualReturn,'journal');assert.match(g.el('modal').innerHTML,/KNOW THE NIGHT/);assert.doesNotMatch(g.el('modal').innerHTML,/undefined|NaN/);g.closeManual();assert.equal(g.state.mode,'journal');cleanRun(g);g.p.dashCd=1;g.setup({elapsed:12,enemies:[enemy({speed:100})]});g.pause();g.el('pauseManual').click();const x=g.state.enemies[0].x,time=g.state.elapsed;g.update(100);near(g.state.elapsed,time);near(g.state.enemies[0].x,x);near(g.p.dashCd,1);g.closeManual();assert.equal(g.state.mode,'paused');g.update(1);near(g.state.elapsed,time);g.resume();assert.equal(g.state.mode,'play');g.showManual();assert.equal(g.state.mode,'play');
});
test('field manual preserves held result pixels, exact statistics and one-time log; stale navigation cannot reopen it',()=>{
 const g=loadGame();cleanRun(g);g.setup({elapsed:42});g.pause();quitForTest(g);const sheet=g.el('modal').innerHTML,saved=g.journalSaved(),r=g.state.runResult,draws=g.drawCount();g.el('endManual').click();assert.equal(g.state.mode,'manual');g.frame(1000);g.update(100);assert.equal(g.drawCount(),draws);assert.equal(g.state.runResult,r);assert.equal(g.journalSaved(),saved);const stale=g.el('manualBack');g.closeManual();assert.equal(g.el('modal').innerHTML,sheet);g.el('again').click();stale.click();assert.equal(g.state.mode,'play');
});

test('native menu selects, manual summaries, and backup text keep their keyboard behavior',()=>{
 const g=loadGame();g.showRoster();let prevented=false;g.event('keydown',{key:'ArrowDown',target:{tagName:'SELECT'},preventDefault(){prevented=true}});assert.equal(prevented,false);cleanRun(g);g.pause();g.event('keydown',{key:'p',target:{tagName:'SELECT'}});assert.equal(g.state.mode,'paused');g.showManual();g.event('keydown',{key:' ',target:{tagName:'SUMMARY'},preventDefault(){prevented=true}});assert.equal(prevented,false);g.closeManual();g.resume();g.event('keydown',{key:'p'});assert.equal(g.state.mode,'paused');
});
for(const rule of ['glass','iron'])test(`Alpha 0.31 ${rule} four-minute integration respects tool, encounter, and effect budgets`,()=>{
 const g=loadGame({seed:0x310031});g.showRoster();g.selectRule(rule);g.selectContract('shock');g.start();Object.assign(g.p,{inv:999,damage:60,arc:3,blades:3,molotov:3,thunder:true,reaper:true,wildfire:true});let discharges=0;
 for(let i=0;i<240*30;i++){
  while(g.state.mode==='upgrade')g.choose(0);
  if(g.state.mode==='extraction')chooseExitForTest(g,'stay');
  assert.equal(g.state.mode,'play');
  if(i%60===0&&g.state.shockDrums.length){const b=g.state.shockDrums[0];g.p.x=b.x;g.p.y=b.y;g.p.dashCd=0;g.dash();discharges++}
  g.update(1/30);
  assert.ok(g.state.shockDrums.length<=2);assert.ok(g.state.enemies.length<=240);for(const key of ['particles','texts','bullets','lightning','hostileShots','bottles','fires'])assert.ok(g.state[key].length<=g.limits[key],key);assert.ok(Number.isFinite(g.p.hp)&&Number.isFinite(g.p.damage));
 }
 assert.ok(discharges>=3);assert.ok(g.state.shocksUsed>=3);assert.equal(g.state.contractCompleted,true);g.pause();quitForTest(g);assert.equal(g.state.runResult.rule,rule);assert.equal(g.state.runResult.shocks,g.state.shocksUsed);assert.ok(g.parseBackup(g.backupText()));
});

function readyLobber(g){cleanRun(g);g.scheduleRush(Infinity);g.setup({elapsed:255,overtime:1,exitAt:1000,nextBossAt:1000,nextLobberAt:255});g.updateLobberSchedule();const e=g.state.enemies.find(e=>e.lobber);assert.ok(e);Object.assign(e,{x:150,y:0,cooldown:0});return e}
test('Lobber arrives only in quiet overtime at 04:15 with one alive and reserved boss capacity',()=>{
 const g=loadGame();cleanRun(g);g.setup({elapsed:254.99,overtime:1,exitAt:1000,nextBossAt:1000,nextLobberAt:255});g.scheduleRush(Infinity);g.updateLobberSchedule();assert.equal(g.state.enemies.length,0);g.setup({elapsed:255,overtime:0});g.updateLobberSchedule();assert.equal(g.state.enemies.length,0);g.setup({elapsed:258,overtime:1});g.updateLobberSchedule();const e=g.state.enemies[0];assert.ok(e.lobber);near(e.hp,65*(1+258/200));assert.equal(g.enemySpecies(e),'lobber');g.setup({elapsed:400,nextLobberAt:400});g.updateLobberSchedule();assert.equal(g.state.enemies.length,1);g.p.x=5000;g.updateLobberSchedule();assert.ok(!g.state.enemies.includes(e));
});
test('Lobber stops for windup then gives a full fixed 1.4-second warning; moving away avoids damage',()=>{
 const g=loadGame();const e=readyLobber(g);g.updateLobbers(.01);assert.equal(e.phase,'windup');const x=e.x;g.moveLobber(e,.5);near(e.x,x);g.updateLobbers(1);assert.equal(g.state.lobberBombs.length,1);const b=g.state.lobberBombs[0];near(b.remaining,1.4);near(b.x,0);near(b.y,0);g.p.x=100;g.updateLobbers(1.3);near(g.p.hp,100);near(b.x,0);g.updateLobbers(.1);assert.equal(g.state.lobberBombs.length,0);near(g.p.hp,100);
});
test('Lobber blast hurts once with canonical source, never damages enemies or awards kills, and respects armor/shields',()=>{
 const g=loadGame();readyLobber(g);const target=enemy({x:0,hp:100});g.state.enemies.push(target);g.setup({lobberBombs:[{x:0,y:0,r:52,remaining:.01}]});g.p.armor=3;g.updateLobbers(.02);near(g.p.hp,89);near(target.hp,100);assert.equal(g.state.lastThreat,'lobber-blast');assert.equal(g.state.killCount,0);g.setup({lobberBombs:[{x:0,y:0,r:52,remaining:.01}]});g.updateLobbers(.02);near(g.p.hp,89);
});
test('Lobber windup cancels on kill/stun, launched marker survives caster death, and major encounters cancel both',()=>{
 const g=loadGame();const e=readyLobber(g);g.updateLobbers(.01);g.hitEnemy(e,9999);g.updateLobbers(2);assert.equal(g.state.lobberBombs.length,0);const h=loadGame();const other=readyLobber(h);h.updateLobbers(.01);other.salvageStunUntil=999;h.updateLobbers(2);assert.equal(h.state.lobberBombs.length,0);other.salvageStunUntil=0;other.cooldown=0;h.updateLobbers(.01);h.updateLobbers(1);h.hitEnemy(other,9999);h.p.x=100;h.updateLobbers(.2);assert.equal(h.state.lobberBombs.length,1);h.setup({salvage:{x:0,y:0,r:110}});h.updateLobbers(.01);assert.equal(h.state.lobberBombs.length,0);
});
test('Lobber marker freezes in menus, renders with reduced effects, and recorded tally survives reload without runtime hazards',()=>{
 const g=loadGame({traceCanvas:true});const e=readyLobber(g);g.updateLobbers(.01);g.updateLobbers(1);const b=g.state.lobberBombs[0];g.pause();g.updateLobbers(10);near(b.remaining,1.4);g.renderLobberBombs();assert.ok(g.drawingTrace().some(r=>r[0]==='fillText'&&r[1]==='MOVE · BLAST'));quitForTest(g);g.el('again').click();assert.equal(g.state.lobberBombs.length,0);near(g.state.nextLobberAt,255);
 const h=loadGame();const l=readyLobber(h);h.hitEnemy(l,9999);h.pause();quitForTest(h);assert.equal(h.state.runResult.enemyTally.lobber,1);assert.equal(h.state.journal.bestiary.lobber,1);const j=loadGame({journalStored:h.journalSaved()});assert.equal(j.state.journal.bestiary.lobber,1);j.start();assert.equal(j.state.lobberBombs.length,0);
});

test('all major encounters cancel Lobber windups and live markers before damage, retaining ordinary quiet timing',()=>{
 for(const blocked of [{salvage:{x:0,y:0,r:110}},{convoy:{x:0,y:0}},{supplyDrop:{x:0,y:0}},{exitBeacon:{x:0,y:0}},{activeBoss:enemy({type:3})},{reliefUntil:300},{nextBossAt:260}]){
  const g=loadGame();const e=readyLobber(g);e.phase='windup';e.phaseTime=.01;g.setup({lobberBombs:[{x:0,y:0,r:52,remaining:.01}],...blocked});
  g.updateLobbers(.02);assert.equal(g.state.lobberBombs.length,0);assert.equal(e.phase,'approach');near(g.p.hp,100);
 }
});
test('green-door return clears launched Lobber hazards and retry never imports them',()=>{
 const g=loadGame();prepareExit(g);g.setup({lobberBombs:[{x:0,y:0,r:52,remaining:.01}]});reachExit(g);chooseExitForTest(g,'stay');assert.equal(g.state.lobberBombs.length,0);assert.ok(g.p.inv>=1.5);assert.equal(g.state.overtime,1);
});

test('decoy works with another finger while joystick is captured and spends exactly one charge without stats buffs',()=>{
 const g=loadGame();cleanRun(g);g.el('stick').dispatch('pointerdown',{pointerId:1,clientX:135.5,clientY:662.5});const hp=g.p.hp;g.el('decoy').dispatch('pointerdown',{pointerId:2});assert.equal(g.touch.id,1);assert.equal(g.state.decoyCharges,0);assert.equal(g.state.decoysUsed,1);assert.ok(g.state.decoy);g.el('decoy').click(1);g.deployDecoy();assert.equal(g.state.decoysUsed,1);near(g.p.hp,hp);near(g.p.inv,0);near(g.p.damage,18);assert.equal(g.state.killCount,0);assert.equal(g.state.xp,0);
});
test('decoy diverts at most twelve nearest ordinary enemies and excludes bosses, Hunters, specialists and trucks',()=>{
 const g=loadGame();cleanRun(g);const ord=Array.from({length:20},(_,i)=>enemy({x:30+i,y:0,hp:100,speed:100})),special=[enemy({type:3}),enemy({rush:true}),enemy({spitter:true,type:4}),enemy({riot:true,type:5}),enemy({howler:true,type:7}),enemy({lobber:true,type:8}),enemy({convoy:true}),enemy({hp:0})];g.setup({enemies:[...special,...ord]});g.deployDecoy();assert.equal(g.state.decoy.targets.size,12);assert.equal(g.state.decoyLured,12);for(const e of special)assert.ok(!g.state.decoy.targets.has(e));const e=ord[0];g.moveHorde(e,.1);assert.ok(e.y<0,'moves to decoy behind player rather than player at origin');assert.equal(ord[12].decoyCounted,undefined);
});
test('decoy freezes with Pause/upgrade, expires after three play seconds, and does not refill in overtime',()=>{
 const g=loadGame();cleanRun(g);g.deployDecoy();const d=g.state.decoy;g.pause();g.update(10);assert.equal(g.state.decoy,d);near(g.state.elapsed,0);assert.equal(g.el('decoy').style.display,'none');g.resume();g.update(1);assert.equal(g.state.decoy,d);g.update(2);assert.equal(g.state.decoy,null);assert.equal(g.state.decoyCharges,0);prepareExit(g);g.deployDecoy();reachExit(g);chooseExitForTest(g,'stay');assert.equal(g.state.decoyCharges,0);g.pause();quitForTest(g);assert.equal(g.state.runResult.decoys,1);g.el('again').click();assert.equal(g.state.decoyCharges,1);assert.equal(g.state.decoysUsed,0);assert.equal(g.state.decoy,null);
});
test('keyboard Q deploys once, ignores repeat/background/menu, and new visits do not import charges or targets',()=>{
 const g=loadGame();g.event('keydown',{key:'q'});assert.equal(g.state.decoysUsed,0);cleanRun(g);g.document.hidden=true;g.event('keydown',{key:'q'});assert.equal(g.state.decoysUsed,0);g.document.hidden=false;g.event('keydown',{key:'q',repeat:true});assert.equal(g.state.decoysUsed,0);g.event('keydown',{key:'q'});assert.equal(g.state.decoysUsed,1);g.pause();quitForTest(g);const h=loadGame({journalStored:g.journalSaved()});h.start();assert.equal(h.state.decoyCharges,1);assert.equal(h.state.decoy,null);assert.equal(h.state.decoyLured,0);
});

test('Decoy Pouch can be chosen through a real later offer, adds one charge once, and cannot refill repeatedly',()=>{
 let found=false;for(let seed=1;seed<=60&&!found;seed++){
  const g=loadGame({seed});laterUpgrade(g);if(!g.state.upgradeOffer.picks.some(o=>o.name==='Decoy Pouch'))continue;chooseNamed(g,'Decoy Pouch');found=true;assert.equal(g.state.decoyCharges,2);assert.equal(g.p.decoyPouch,true);assert.match(g.buildSummary(),/Decoy Pouch/);g.deployDecoy();assert.equal(g.state.decoyCharges,1);g.update(3.01);g.deployDecoy();assert.equal(g.state.decoyCharges,0);for(let i=0;i<30;i++)assert.ok(!g.upgradeChoices().some(o=>o.name==='Decoy Pouch'));g.pause();quitForTest(g);assert.equal(g.state.journal.history[0].decoyPouch,true);g.el('again').click();assert.equal(g.p.decoyPouch,false);assert.equal(g.state.decoyCharges,1);
 }assert.equal(found,true);
});
test('Decoy Pouch after the first decoy was spent grants only one replacement and never imports saved charges',()=>{
 const g=loadGame();cleanRun(g);g.deployDecoy();g.update(3.01);const perk=g.opts.find(o=>o.name==='Decoy Pouch');assert.ok(perk.available());perk.apply();assert.equal(g.state.decoyCharges,1);assert.equal(perk.available(),false);g.pause();quitForTest(g);const h=loadGame({journalStored:g.journalSaved()});h.start();assert.equal(h.p.decoyPouch,false);assert.equal(h.state.decoyCharges,1);
});

test('Distraction Detail rewards ten distinct lured enemies exactly once with no extra charges or spawns',()=>{
 const g=loadGame();startContract(g,'lure');const targets=Array.from({length:10},(_,i)=>enemy({x:30+i,hp:100,speed:100}));g.setup({enemies:targets});g.deployDecoy();assert.equal(g.state.decoyLured,10);assert.equal(g.contractProgress(),10);g.checkContract();g.checkContract();assert.equal(g.state.bonusChoices,1);assert.equal(g.state.decoyCharges,0);assert.equal(g.state.enemies.length,10);g.checkLevelUp();assert.match(g.el('modal').innerHTML,/CONTRACT COMPLETE/);g.choose(0);assert.equal(g.state.bonusChoices,0);g.pause();quitForTest(g);assert.equal(g.state.runResult.contractCompleted,true);assert.equal(g.state.runResult.contract,'lure');
});
test('repeated lure targets cannot inflate contract credit and failed contracts never block extraction',()=>{
 const g=loadGame();startContract(g,'lure');const targets=Array.from({length:6},(_,i)=>enemy({x:30+i,hp:100,speed:0}));g.setup({enemies:targets});g.deployDecoy();g.setup({elapsed:4});g.update(.001);g.opts.find(o=>o.name==='Decoy Pouch').apply();g.deployDecoy();assert.equal(g.state.decoyLured,6);g.checkContract();assert.equal(g.state.bonusChoices,0);prepareExit(g);reachExit(g);chooseExitForTest(g,'extract');assert.equal(g.state.runResult.outcome,'extracted');assert.equal(g.state.runResult.contractCompleted,false);
 const a=loadGame();cleanRun(a);a.setup({enemies:Array.from({length:12},()=>enemy())});a.deployDecoy();a.checkContract();assert.equal(a.state.bonusChoices,0);
});

test('gun priority defaults to accepted nearest behavior and actual bullets follow the selected target',()=>{
 const g=loadGame();cleanRun(g);const close=enemy({x:100,y:0,hp:100}),weak=enemy({x:0,y:200,hp:5}),spit=enemy({x:-250,y:0,hp:50,type:4,spitter:true,phase:'approach',cooldown:100});g.setup({enemies:[close,weak,spit]});assert.equal(g.gunTarget(),close);g.selectGunPriority('weakest');assert.equal(g.p.gunPriority,'nearest');g.pause();g.selectGunPriority('weakest');assert.equal(g.gunTarget(),weak);const stale=g.el('gunPriorityPick');g.resume();g.update(.001);const b=g.state.bullets[0];near(b.vx,0);assert.ok(b.vy>0);stale.value='threats';stale.dispatch('change');assert.equal(g.p.gunPriority,'weakest');g.pause();g.selectGunPriority('threats');assert.equal(g.gunTarget(),spit);g.selectGunPriority('<img>');assert.equal(g.p.gunPriority,'threats');g.resume();g.start();assert.equal(g.p.gunPriority,'nearest');
});
test('gun preference ignores dead/out-of-range targets, breaks ties by distance, and never changes weapon damage or saved powers',()=>{
 const g=loadGame();cleanRun(g);const a=enemy({x:300,hp:10}),b=enemy({x:100,hp:10}),outside=enemy({x:1000,hp:1,spitter:true}),dead=enemy({x:0,hp:0});g.setup({enemies:[a,b,outside,dead]});g.pause();g.selectGunPriority('weakest');assert.equal(g.gunTarget(),b);g.selectGunPriority('threats');assert.equal(g.gunTarget(),b);near(g.p.damage,18);quitForTest(g);assert.equal(g.state.journal.history[0].gunPriority,'threats');const h=loadGame({journalStored:g.journalSaved()});h.start();assert.equal(h.p.gunPriority,'nearest');
});

test('weapon contribution counts actual removed HP and final-hit kills without overkill, duplicate or convoy damage',()=>{
 const g=loadGame();cleanRun(g);const e=enemy({hp:30});g.hitEnemy(e,18);g.hitEnemy(e,99,'LIGHTNING');g.hitEnemy(e,99,'FIRE');near(g.state.weaponLedger.gun.damage,18);assert.equal(g.state.weaponLedger.gun.kills,0);near(g.state.weaponLedger.lightning.damage,12);assert.equal(g.state.weaponLedger.lightning.kills,1);near(g.state.weaponLedger.fire.damage,0);assert.equal(g.state.killCount,1);
 for(const d of [0,-5,NaN,Infinity])g.hitEnemy(enemy({hp:10}),d);near(g.state.weaponLedger.gun.damage,18);const truck=enemy({hp:100,convoy:true});g.hitEnemy(truck,10);near(g.state.weaponLedger.gun.damage,18);
});
test('real gun, fire, blades, fuel and lightning updates contribute under their own labels',()=>{
 const g=loadGame();cleanRun(g);g.setup({enemies:[enemy()],bullets:[bullet()]});g.updateProjectiles(.01);assert.equal(g.state.weaponLedger.gun.kills,1);g.setup({enemies:[enemy({hp:1,x:70})]});g.p.arc=1;g.fireLightning();assert.equal(g.state.weaponLedger.lightning.kills,1);g.setup({enemies:[enemy({hp:1,x:78,y:0})]});g.p.blades=1;g.updateWeapons(.001,{x:0,y:0});assert.equal(g.state.weaponLedger.blades.kills,1);g.setup({enemies:[enemy({hp:1,x:0})],fires:[groundFire({x:0,y:0})]});g.updateMolotov(.01);assert.equal(g.state.weaponLedger.fire.kills,1);g.setup({enemies:[enemy({hp:1,x:100})],barrels:[fuel(100)]});g.detonateBarrel(g.state.barrels[0]);assert.equal(g.state.weaponLedger.fuel.kills,1);
});
test('green-door clearing is attributed to utility, while frozen contribution records survive guides and retry',()=>{
 const g=loadGame();prepareExit(g);const b=g.state.exitBeacon;g.setup({enemies:[enemy({x:b.x+40,y:b.y,hp:30})]});reachExit(g);chooseExitForTest(g,'stay');assert.equal(g.state.weaponLedger.utility.kills,1);near(g.state.weaponLedger.utility.damage,30);near(g.state.weaponLedger.gun.damage,0);g.pause();quitForTest(g);const r=g.state.runResult;assert.ok(Object.isFrozen(r.weapons)&&Object.isFrozen(r.weapons.utility));assert.match(g.el('modal').innerHTML,/WEAPON CONTRIBUTIONS/);const saved=g.journalSaved();g.showManual();g.closeManual();assert.equal(g.journalSaved(),saved);g.el('again').click();near(g.state.weaponLedger.utility.damage,0);near(r.weapons.utility.damage,30);
 const h=loadGame({journalStored:saved});assert.equal(h.state.journal.history[0].weapons.utility.kills,1);h.showJournal();assert.match(h.el('modal').innerHTML,/HP removed/);
});
test('legacy and hostile weapon contribution rows are bounded display data and never grant damage',()=>{
 const g=loadGame({journalStored:JSON.stringify({version:1,history:[{outcome:'defeated',time:10},{outcome:'extracted',time:180,weapons:{gun:{damage:'<img>',kills:-1},fire:{damage:1e30,kills:1e30},'<script>':{damage:999}}}]})});assert.equal(g.state.journal.history[0].weapons,null);const row=g.state.journal.history[1].weapons;near(row.gun.damage,0);near(row.fire.damage,1e9);assert.equal(row.fire.kills,1e9);assert.equal(Object.keys(row).length,6);g.showJournal();assert.doesNotMatch(g.el('modal').innerHTML,/<img|<script|NaN|undefined/);g.el('journalBack').click();g.start();near(g.p.damage,18);near(g.state.weaponLedger.fire.damage,0);
});

test('run report contains only the held result and downloads matching plain text without mutating records',async()=>{
 const g=loadGame();cleanRun(g);g.setup({elapsed:123,killCount:50});g.hitEnemy(enemy({hp:1}),2,'FIRE');g.pause();quitForTest(g);const saved=g.journalSaved(),r=g.state.runResult,sheet=g.el('modal').innerHTML;g.el('endReport').click();assert.equal(g.state.mode,'report');const text=g.el('runReportText').value;assert.match(text,/ALPHA 0.85 RUN REPORT/);assert.match(text,/Survived: 02:03 · Eliminations: 51/);assert.match(text,/Fire: 1 \/ 1/);assert.doesNotMatch(text,/undefined|NaN/);g.el('reportDownload').click();assert.equal(g.downloads().length,1);assert.equal(await g.downloads()[0].text(),text);const draws=g.drawCount();g.frame(10000);g.update(100);assert.equal(g.drawCount(),draws);assert.equal(g.state.runResult,r);assert.equal(g.journalSaved(),saved);g.el('reportBack').click();assert.equal(g.el('modal').innerHTML,sheet);
});
test('run report is unavailable during play, rejects stale/hidden download input, and works without storage',()=>{
 const g=loadGame({storageBlocked:true});g.showRunReport();assert.equal(g.state.mode,'menu');cleanRun(g);g.showRunReport();assert.equal(g.state.mode,'play');g.pause();quitForTest(g);g.showRunReport();const old=g.el('reportDownload');g.document.hidden=true;old.click();assert.equal(g.downloads().length,0);g.document.hidden=false;g.el('reportBack').click();old.click();assert.equal(g.downloads().length,0);g.el('again').click();g.showRunReport();assert.equal(g.state.mode,'play');
});

test('first-recorded species callouts compare cumulative prior records and freeze before the log is updated',()=>{
 const g=loadGame({journalStored:JSON.stringify({version:1,bestiary:{shambler:5},history:[]})});cleanRun(g);g.hitEnemy(enemy({hp:1}),2);g.hitEnemy(enemy({hp:1,type:8,lobber:true}),2);g.hitEnemy(enemy({hp:1,type:8,lobber:true}),2);assert.deepEqual(Array.from(g.currentDiscoveries()),['lobber']);g.pause();quitForTest(g);const r=g.state.runResult;assert.ok(Object.isFrozen(r.newDiscoveries));assert.deepEqual(Array.from(r.newDiscoveries),['lobber']);assert.match(g.el('modal').innerHTML,/First recorded defeats: Lobber/);assert.match(g.runReportText(),/First recorded defeats: Lobber/);assert.equal(g.state.journal.bestiary.lobber,2);g.showManual();g.closeManual();assert.deepEqual(Array.from(r.newDiscoveries),['lobber']);g.el('again').click();g.hitEnemy(enemy({hp:1,type:8,lobber:true}),2);assert.equal(g.currentDiscoveries().length,0);
});
test('discovery metadata rejects unknown/duplicate markup and old kills cannot invent named discoveries',()=>{
 const g=loadGame({journalStored:JSON.stringify({version:1,history:[{outcome:'defeated',time:20,kills:999},{outcome:'extracted',time:180,newDiscoveries:['lobber','lobber','<img>','bogus']}]})});assert.equal(g.state.journal.history[0].newDiscoveries,null);assert.deepEqual(Array.from(g.state.journal.history[1].newDiscoveries),['lobber']);g.showJournal();assert.doesNotMatch(g.el('modal').innerHTML,/<img|undefined/);g.el('journalBack').click();g.start();assert.equal(g.currentDiscoveries().length,0);assert.equal(g.state.enemyTally.lobber,0);
});

test('optional medal tracker defaults off, selects only in Pause, and follows actual thresholds without rewards',()=>{
 const g=loadGame();cleanRun(g);assert.equal(g.state.trackedMedal,'off');assert.equal(g.el('medalGoal').textContent,'');g.selectTrackedMedal('boss');assert.equal(g.state.trackedMedal,'off');g.pause();const time=g.state.elapsed;g.selectTrackedMedal('boss');g.selectTrackedMedal('bad');assert.equal(g.state.trackedMedal,'boss');g.update(10);near(g.state.elapsed,time);g.resume();g.updateMedalTracker();assert.match(g.el('medalGoal').textContent,/Boss Hunter 0\/2/);g.setup({bossesDefeated:2});g.updateMedalTracker();assert.match(g.el('medalGoal').textContent,/2\/2 · EARNED/);assert.equal(g.state.bonusChoices,0);near(g.p.damage,18);g.pause();g.selectTrackedMedal('off');g.resume();g.updateMedalTracker();assert.equal(g.el('medalGoal').textContent,'');
});
test('tracker matches all eight medal names and snapshot choice never equips on a new run',()=>{
 const g=loadGame();cleanRun(g);assert.equal(g.medalTrackers.length,8);g.pause();g.selectTrackedMedal('arsenal');g.p.pierce=g.p.arc=3;g.p.rail=g.p.thunder=true;g.resume();g.updateMedalTracker();assert.match(g.el('medalGoal').textContent,/Arsenal 2\/2 · EARNED/);g.pause();quitForTest(g);assert.equal(g.state.runResult.trackedMedal,'arsenal');const h=loadGame({journalStored:g.journalSaved()});h.start();assert.equal(h.state.trackedMedal,'off');g.el('again').click();assert.equal(g.state.trackedMedal,'off');
});

test('run timeline records real deployment, combat, tools, evolution and ending once at active-play timestamps',()=>{
 const g=loadGame();cleanRun(g);assert.deepEqual(Array.from(g.state.runTimeline,r=>r.kind),['deployment']);g.setup({elapsed:12});g.deployDecoy();g.spawnBoss();g.hitEnemy(g.state.activeBoss,99999);g.p.secondWind=true;g.p.hp=1;g.p.inv=0;g.hurtPlayer(20);g.pause();const time=g.state.elapsed,events=g.state.runTimeline.length;g.update(100);assert.equal(g.state.runTimeline.length,events);near(g.state.elapsed,time);quitForTest(g);const r=g.state.runResult;assert.ok(Object.isFrozen(r.timeline)&&Object.isFrozen(r.timeline[0]));assert.deepEqual(Array.from(r.timeline,row=>row.kind),['deployment','decoy','breaker-arrived','breaker-down','second-wind','abandoned']);for(const row of r.timeline.slice(1))near(row.time,12);assert.match(g.runReportText(),/00:12 Second Wind used/);assert.match(g.el('modal').innerHTML,/RUN TIMELINE/);const saved=g.journalSaved();g.showManual();g.closeManual();g.recordRunEvent('shock');assert.equal(g.journalSaved(),saved);assert.equal(g.state.runTimeline.length,6);g.el('again').click();assert.deepEqual(Array.from(g.state.runTimeline,row=>row.kind),['deployment']);
});
test('timeline keeps only forty latest meaningful events with bounded memory and frozen copies',()=>{
 const g=loadGame();cleanRun(g);for(let i=1;i<=60;i++){g.setup({elapsed:i,shockDrums:[{x:0,y:0,r:17,spent:false}]});g.dischargeShock(g.state.shockDrums[0])}assert.equal(g.state.runTimeline.length,40);assert.equal(g.state.timelineDropped,21);near(g.state.runTimeline[0].time,21);g.pause();quitForTest(g);assert.equal(g.state.runResult.timeline.length,40);assert.equal(g.state.runResult.timelineDropped,22);assert.equal(g.state.runResult.timeline.at(-1).kind,'abandoned');
});
test('timeline legacy and hostile rows remain safe metadata and never schedule encounters or grant bonuses',()=>{
 const g=loadGame({journalStored:JSON.stringify({version:1,history:[{outcome:'defeated',time:10},{outcome:'extracted',time:180,timeline:[{kind:{toString:'not callable'},time:1},{kind:'<img>',time:1},{kind:'shock',time:-1},{kind:'contract',time:'2'},{kind:'blackout',time:1e30},{kind:'deployment',time:0}],timelineDropped:1e30}]})});assert.equal(g.state.journal.history[0].timeline,null);const row=g.state.journal.history[1];assert.equal(row.timeline.length,2);near(row.timeline[0].time,0);near(row.timeline[1].time,86400);g.showJournal();assert.doesNotMatch(g.el('modal').innerHTML,/<img|undefined|NaN/);g.el('journalBack').click();g.start();assert.equal(g.state.bonusChoices,0);near(g.state.nextRushAt,45);near(g.state.nextLobberAt,255);assert.equal(g.state.runTimeline.length,1);
});

test('Alpha 0.32 eight-minute native overtime integration reaches Lobbers and retains all entity and record budgets',()=>{
 const g=loadGame({seed:0x320032,preferencesStored:JSON.stringify({version:1,reduced:true})});g.start();Object.assign(g.p,{inv:9999,damage:100,pierce:3,arc:3,blades:3,molotov:3,rail:true,thunder:true,reaper:true,wildfire:true,proj:3,fire:.12});let firstLobber=null;
 const settle=()=>{while(g.state.mode==='upgrade')g.choose(0);if(g.state.mode==='extraction')chooseExitForTest(g,'stay');while(g.state.mode==='upgrade')g.choose(0)};
 for(let i=0;i<480*30;i++){
  settle();assert.equal(g.state.mode,'play');
  if(g.state.exitBeacon){const from={x:g.p.x,y:g.p.y};g.p.x=g.state.exitBeacon.x;g.p.y=g.state.exitBeacon.y;g.updateExtractionArrival(from);settle()}
  g.touch.x=Math.cos(i/90)*.6;g.touch.y=Math.sin(i/90)*.6;if(i%90===0)g.dash();if(i===300)g.deployDecoy();g.update(1/30);
  if(firstLobber===null&&(g.state.enemies.some(e=>e.lobber)||g.state.enemyTally.lobber>0))firstLobber=g.state.elapsed;
  if(i%30===0){assert.ok(g.state.enemies.length<=240);assert.ok(g.state.enemies.filter(e=>e.lobber&&e.hp>0).length<=1);assert.ok(g.state.lobberBombs.length<=1);assert.ok(g.state.runTimeline.length<=40);assert.ok(!g.state.decoy||g.state.decoy.targets.size<=12);for(const key of ['particles','texts','bullets','lightning','hostileShots','bottles','fires'])assert.ok(g.state[key].length<=(key==='particles'?120:g.limits[key]),key);g.render()}
 }
 settle();assert.ok(firstLobber!==null,'native Lobber schedule reachable with every event enabled');assert.ok(firstLobber>=255);assert.ok(g.state.overtime>=2);g.pause();quitForTest(g);const r=g.state.runResult;assert.equal(Object.values(r.weapons).reduce((sum,row)=>sum+row.kills,0),r.kills);assert.equal(Object.values(r.enemyTally).reduce((sum,n)=>sum+n,0),r.kills);assert.equal(r.decoys>=1,true);assert.ok(r.timeline.length<=40);assert.ok(g.parseBackup(g.backupText()));assert.doesNotMatch(g.runReportText(),/undefined|NaN|Infinity/);
});
test('all five base survivors keep the accepted dense salvage escape with an overtime Lobber and live marker present',()=>{
 for(const role of ['survivor','scout','bulwark','engineer','scavenger']){
  const g=loadGame();g.showRoster();g.selectSurvivor(role);cleanRun(g);g.scheduleRush(Infinity);g.setup({elapsed:260,overtime:1,nextBossAt:1000,exitAt:1000,obstacles:[],barrels:[],nextSupplyAt:Infinity});assert.ok(g.placeSalvage());const b=g.state.salvage;g.p.x=b.x;g.p.y=b.y;g.p.fireClock=999;
  const crowd=Array.from({length:238},(_,i)=>enemy({x:b.x+100*Math.cos(i/238*Math.PI*2),y:b.y+100*Math.sin(i/238*Math.PI*2),hp:1000,speed:i%3===0?208:i%3===1?112:78,dmg:i%3===0?9:i%3===1?12:20,r:i%3===2?23:15})),l=enemy({x:b.x+100,y:b.y,hp:1000,max:1000,type:8,lobber:true,speed:55,phase:'windup',phaseTime:.01,cooldown:0});g.setup({enemies:[l,...crowd],lobberBombs:[{x:b.x,y:b.y,r:52,remaining:.01}]});
  for(let i=0;i<360&&g.state.mode==='play';i++){const a=i*g.p.speed/85/60,target={x:b.x+85*Math.cos(a),y:b.y+85*Math.sin(a)},d=Math.hypot(target.x-g.p.x,target.y-g.p.y),strength=d?Math.min(1,d*60/g.p.speed):0;g.touch.x=d?strength*(target.x-g.p.x)/d:0;g.touch.y=d?strength*(target.y-g.p.y)/d:0;g.update(1/60);assert.equal(g.state.lobberBombs.length,0)}
  assert.equal(g.state.mode,'upgrade',role);assert.equal(g.state.salvagesSecured,1);assert.ok(g.p.hp>0,role);near(g.state.elapsed,266);assert.equal(g.state.killCount,0);assert.equal(g.state.decoysUsed,0);
 }
});

test('S21 portrait and landscape marker labels reserve space for the new decoy control column',()=>{
 for(const [width,height] of [[412,915],[915,412],[320,640]]){
  const g=loadGame({width,height});cleanRun(g);g.setup({rescue:stranded({x:2000,y:-2000})});const mark=g.objectiveWaypoint(),controls={x:width-114,y:65,w:98,h:151};const overlaps=mark.x+30>controls.x&&mark.x-30<controls.x+controls.w&&mark.y+18>controls.y&&mark.y-34<controls.y+controls.h;assert.equal(overlaps,false,`${width}x${height}`);g.render();g.deployDecoy();g.render();
 }
});
test('timeline captures a selected evolution and extraction/overtime transitions without duplicates',()=>{
 const g=loadGame();laterUpgrade(g);g.choose(0);g.p.pierce=3;g.p.rail=false;earnUpgrade(g);fixtureOfferedUpgrade(g,'Evolve: Railstorm');chooseNamed(g,'Evolve: Railstorm');assert.equal(g.state.runTimeline.filter(r=>r.kind==='evolve-rail').length,1);prepareExit(g);assert.ok(g.state.runTimeline.some(r=>r.kind==='exit-open'));reachExit(g);chooseExitForTest(g,'stay');assert.equal(g.state.runTimeline.filter(r=>r.kind==='overtime').length,1);
});

test('route selection defaults to original Downtown and applies Freight only at deployment',()=>{
 const g=loadGame();assert.equal(g.state.selectedRoute,'downtown');g.selectRoute('freight');assert.equal(g.state.selectedRoute,'downtown');g.showRoster();g.selectRoute('<img>');assert.equal(g.state.selectedRoute,'downtown');g.selectRoute('freight');g.start();assert.equal(g.state.runRoute,'freight');assert.equal(g.state.barricades.length,3);assert.equal(g.state.barrels.length,4);assert.ok(g.state.obstacles.every(o=>o.type===2));near(g.p.hp,100);near(g.p.damage,18);near(g.state.nextBossAt,90);g.selectRoute('downtown');assert.equal(g.state.runRoute,'freight');g.pause();quitForTest(g);assert.equal(g.state.journal.history[0].route,'freight');assert.match(g.runReportText(),/Route: Freight Yard/);g.el('again').click();assert.equal(g.state.runRoute,'freight');
});
test('Freight cover uses accepted collision/destruction and leaves reachable salvage on phone-sized views',()=>{
 for(const [width,height] of [[412,915],[915,412],[320,640]]){const g=loadGame({width,height,traceCanvas:true,preferencesStored:JSON.stringify({version:1,scenery:'classic'})});g.showRoster();g.selectRoute('freight');g.start();assert.ok(g.state.barricades.every(b=>b.hp===90));assert.ok(g.placeSalvage());const b=g.state.barricades[0];assert.ok(g.damageBarricade(b,100,'dash'));assert.equal(g.state.barricadesCleared,1);g.render();assert.ok(g.drawingTrace().some(r=>r[0]==='fillText'&&r[1]==='FREIGHT YARD'))}
});
test('old or forged routes remain display metadata and cannot change default map or powers',()=>{
 const g=loadGame({journalStored:JSON.stringify({version:1,history:[{outcome:'defeated',time:10,route:'<script>'},{outcome:'extracted',time:180,route:'freight'}]})});assert.equal(g.state.journal.history[0].route,null);assert.equal(g.state.journal.history[1].route,'freight');g.start();assert.equal(g.state.runRoute,'downtown');near(g.p.damage,18);
});

test('Riverside provides open promenade scenery with standard fuel, destructible cover and unchanged encounters',()=>{
 const g=loadGame({traceCanvas:true,preferencesStored:JSON.stringify({version:1,scenery:'classic'})});g.showRoster();g.selectRoute('riverside');g.start();assert.equal(g.state.runRoute,'riverside');assert.equal(g.state.barrels.length,3);assert.equal(g.state.barricades.length,2);assert.ok(g.state.obstacles.length<95);assert.ok(g.state.obstacles.every(o=>o.type===3));near(g.state.nextBossAt,90);near(g.state.nextSalvageAt,15);near(g.p.hp,100);g.render();assert.ok(g.drawingTrace().some(r=>r[0]==='fillText'&&r[1]==='RIVERSIDE'));g.pause();quitForTest(g);assert.equal(g.state.journal.history[0].route,'riverside');g.el('again').click();assert.equal(g.state.runRoute,'riverside');
});
test('every route admits salvage on phone portrait and landscape without granting route powers',()=>{
 for(const route of ['downtown','freight','riverside'])for(const [width,height] of [[412,915],[915,412],[320,640]]){const g=loadGame({width,height});g.showRoster();g.selectRoute(route);g.start();assert.ok(g.placeSalvage(),route);near(g.p.damage,18);near(g.p.speed,210);near(g.state.exitAt,180);assert.equal(g.state.decoyCharges,1)}
});

test('Tactician has two finite decoy charges with reduced HP/speed, and Pouch waits for carrying room',()=>{
 const g=loadGame();g.showRoster();assert.ok(g.el('role-tactician'));g.selectSurvivor('tactician');g.start();near(g.p.hp,90);near(g.p.speed,200);near(g.p.damage,18);assert.equal(g.state.decoyCharges,2);const pouch=g.opts.find(o=>o.name==='Decoy Pouch');assert.equal(pouch.available(),false);g.deployDecoy();assert.equal(g.state.decoyCharges,1);assert.equal(pouch.available(),true);pouch.apply();assert.equal(g.state.decoyCharges,2);g.update(3.01);g.deployDecoy();g.update(3.01);g.deployDecoy();assert.equal(g.state.decoyCharges,0);assert.equal(pouch.available(),false);g.pause();quitForTest(g);const saved=g.journalSaved();g.el('again').click();assert.equal(g.state.decoyCharges,2);assert.equal(g.p.decoyPouch,false);const h=loadGame({journalStored:saved});assert.equal(h.state.selectedSurvivor,'tactician');h.start();near(h.p.max,90);assert.equal(h.state.decoyCharges,2);
});
test('Tactician follows Glass Cannon and 20-HP medical rules without importing powers',()=>{
 const g=loadGame();g.showRoster();g.selectSurvivor('tactician');g.selectRule('glass');g.start();near(g.p.hp,72);near(g.p.damage,21.6);g.p.hp=40;g.setup({supplyCache:{x:0,y:0,r:20,until:100}});g.updateSupplies(g.p);near(g.p.hp,60);assert.equal(g.state.suppliesCollected,1);assert.equal(g.state.decoyCharges,2);
});

test('Steady Aim charges only during still play and snapshots 15 percent extra gun damage, removed by movement or Dash',()=>{
 const g=loadGame();cleanRun(g);g.setup({enemies:[enemy({x:300,hp:1000})],barrels:[],obstacles:[]});g.opts.find(o=>o.name==='Steady Aim').apply();g.p.fireClock=999;g.update(.3);near(g.steadyMultiplier(),1);g.pause();g.update(10);near(g.p.stillTime,.3);g.resume();g.update(.31);near(g.steadyMultiplier(),1.15);g.p.fireClock=0;g.update(.01);near(g.state.bullets.at(-1).dmg,20.7);g.touch.x=1;g.p.fireClock=0;g.update(.01);near(g.steadyMultiplier(),1);near(g.state.bullets.at(-1).dmg,18);g.touch.x=0;g.p.fireClock=999;g.update(.61);near(g.steadyMultiplier(),1.15);g.dash();near(g.steadyMultiplier(),1);near(g.p.damage,18);
});
test('Steady Aim is selectable once in later offers, leaves other weapon damage intact and never imports from history',()=>{
 let found=false;for(let seed=1;seed<=80&&!found;seed++){const g=loadGame({seed});laterUpgrade(g);if(!g.state.upgradeOffer.picks.some(o=>o.name==='Steady Aim'))continue;chooseNamed(g,'Steady Aim');found=true;assert.equal(g.p.steady,true);g.p.stillTime=.6;g.p.arc=1;const e=enemy({hp:100});g.setup({enemies:[e]});g.fireLightning();near(e.hp,85.6);assert.ok(!g.upgradeChoices().some(o=>o.name==='Steady Aim'));g.pause();quitForTest(g);assert.equal(g.state.journal.history[0].steady,true);const h=loadGame({journalStored:g.journalSaved()});h.start();assert.equal(h.p.steady,false);near(h.p.stillTime,0)}assert.equal(found,true);
});

test('Harvester third boss uses a locked full-circle warning, one pulse and stationary recovery with no added shots',()=>{
 const g=loadGame();cleanRun(g);g.setup({bossesDefeated:2});g.spawnBoss();const b=g.state.activeBoss;assert.equal(b.bossKind,'harvester');assert.equal(g.enemySpecies(b),'harvester');near(b.hp,1350);Object.assign(b,{x:100,y:0,phaseTime:0});g.moveHarvester(b,.01);assert.equal(b.phase,'warn');near(b.phaseTime,1.35);const x=b.x,px=b.pulseX;g.p.y=200;g.moveHarvester(b,1);near(b.x,x);near(b.pulseX,px);assert.equal(b.phase,'warn');g.moveHarvester(b,.35);near(g.p.hp,100);assert.equal(b.phase,'recover');near(b.phaseTime,1.4);assert.equal(g.state.hostileShots.length,0);g.moveHarvester(b,1);near(b.x,x);assert.equal(b.phase,'recover');
});
test('Harvester pulse hurts once, respects armor/invulnerability and pauses, with canonical hit source',()=>{
 const g=loadGame();cleanRun(g);g.spawnBoss('harvester');const b=g.state.activeBoss;Object.assign(b,{x:100,y:0,phase:'warn',phaseTime:1.35,pulseX:100,pulseY:0});g.p.armor=3;g.pause();g.update(10);near(b.phaseTime,1.35);g.resume();g.moveHarvester(b,1.35);near(g.p.hp,87);assert.equal(g.state.lastThreat,'harvester-pulse');g.moveHarvester(b,.1);near(g.p.hp,87);g.p.inv=10;Object.assign(b,{phase:'warn',phaseTime:.01});g.moveHarvester(b,.02);near(g.p.hp,87);
});
test('Harvester defeat gives ordinary boss reward once, separate frozen count and validated saved tally',()=>{
 const g=loadGame();cleanRun(g);g.spawnBoss('harvester');const b=g.state.activeBoss;g.p.hp=50;g.hitEnemy(b,99999);g.hitEnemy(b,99999);near(g.p.hp,75);assert.equal(g.state.bossesDefeated,1);assert.equal(g.state.harvestersDefeated,1);assert.equal(g.currentRunStats().breakers,0);assert.equal(g.state.gems[0].value,20);assert.equal(g.state.enemyTally.harvester,1);g.pause();quitForTest(g);assert.equal(g.state.journal.totals.harvesters,1);assert.equal(g.state.runResult.harvesters,1);assert.match(g.runReportText(),/1 Harvesters/);const h=loadGame({journalStored:g.journalSaved()});assert.equal(h.state.journal.totals.harvesters,1);h.start();assert.equal(h.state.harvestersDefeated,0);
});

test('Night Circuit places three reachable numbered checkpoints in every route and rewards distinct visits once',()=>{
 for(const route of ['downtown','freight','riverside']){const g=loadGame();g.showRoster();g.selectRoute(route);g.selectContract('patrol');g.start();assert.equal(g.state.patrol.length,3);assert.equal(g.state.patrolVisited,0);for(const b of g.state.patrol){assert.ok(!g.state.barricades.some(o=>g.pointRectDistance(b,o)<40));const from={x:b.x-100,y:b.y};g.p.x=b.x+100;g.p.y=b.y;g.updatePatrol(from);g.updatePatrol(from)}assert.equal(g.state.patrolVisited,3);assert.equal(g.state.xp,0);assert.equal(g.state.killCount,0);g.checkContract();g.checkContract();assert.equal(g.state.bonusChoices,1);g.checkLevelUp();assert.match(g.el('modal').innerHTML,/CONTRACT COMPLETE/);g.choose(0);g.pause();quitForTest(g);assert.equal(g.state.runResult.patrols,3);assert.equal(g.state.runResult.contractCompleted,true)}
});
test('patrol markers freeze while paused or dead and unfinished exploration never blocks extraction',()=>{
 const g=loadGame();startContract(g,'patrol');const b=g.state.patrol[0];g.p.x=b.x;g.p.y=b.y;g.pause();g.updatePatrol(g.p);assert.equal(g.state.patrolVisited,0);g.resume();g.p.hp=0;g.updatePatrol(g.p);assert.equal(g.state.patrolVisited,0);g.p.hp=100;prepareExit(g);reachExit(g);chooseExitForTest(g,'extract');assert.equal(g.state.runResult.outcome,'extracted');assert.equal(g.state.runResult.contractCompleted,false);const h=loadGame();h.start();assert.equal(h.state.patrol.length,0);
});

test('tactical map freezes the exact run, draws player/targets/cover, and returns to Pause without storage writes',()=>{
 const g=loadGame({traceCanvas:true});startContract(g,'patrol');g.setup({enemies:[enemy({x:100})]});const before=JSON.stringify(g.currentRunStats()),saved=g.journalSaved(),time=g.state.elapsed;g.showTacticalMap();assert.equal(g.state.mode,'play');g.pause();g.el('pauseMap').click();assert.equal(g.state.mode,'map');assert.ok(g.drawingTrace('tacticalCanvas').some(r=>r[0]==='fillText'&&r[1]==='YOU'));assert.match(g.el('modal').innerHTML,/PATROL 1/);g.update(100);near(g.state.elapsed,time);assert.equal(JSON.stringify(g.currentRunStats()),before);assert.equal(g.journalSaved(),saved);g.el('mapBack').click();assert.equal(g.state.mode,'paused');g.update(100);near(g.state.elapsed,time);g.resume();assert.equal(g.state.mode,'play');
});
test('tactical map zoom is bounded and stale selectors cannot affect a resumed game',()=>{
 const g=loadGame();cleanRun(g);g.pause();g.showTacticalMap();assert.ok(g.mapPoint({x:500,y:0}));const picker=g.el('mapRangePick');picker.value='300';picker.dispatch('change');assert.equal(g.state.mapRange,300);assert.equal(g.mapPoint({x:500,y:0}),null);picker.value='-1';picker.dispatch('change');assert.equal(g.state.mapRange,300);picker.value='1000';picker.dispatch('change');assert.equal(g.state.mapRange,1000);g.el('mapBack').click();g.resume();picker.value='300';picker.dispatch('change');assert.equal(g.state.mapRange,1000);
});

test('three deployment preset slots persist only setup choices, load for review, and are included in records backup',()=>{
 const g=loadGame();g.showRoster();g.selectSurvivor('tactician');g.selectRoute('riverside');g.selectRule('glass');g.selectContract('patrol');g.saveDeployment();const saved=g.journalSaved(),data=JSON.parse(g.backupText());assert.equal(data.journal.presets.length,3);assert.deepEqual(Object.keys(data.journal.presets[0]).sort(),['contract','route','rule','survivor']);g.selectSurvivor('survivor');g.selectRoute('downtown');g.selectRule('standard');g.selectContract('none');g.loadDeployment();assert.equal(g.state.mode,'roster');assert.equal(g.state.selectedSurvivor,'tactician');assert.equal(g.state.selectedRoute,'riverside');assert.equal(g.state.selectedRule,'glass');assert.equal(g.state.selectedContract,'patrol');const h=loadGame({journalStored:saved});h.showRoster();h.loadDeployment();h.start();near(h.p.hp,72);near(h.p.damage,21.6);assert.equal(h.p.steady,false);assert.equal(h.state.decoyCharges,2);assert.equal(h.state.runRoute,'riverside');h.saveDeployment();assert.equal(h.state.mode,'play');
});
test('preset validation rejects unknown choices and extra powers; blocked or future journals keep temporary slots safely',()=>{
 const valid={survivor:'survivor',route:'freight',rule:'standard',contract:'none',damage:999999,decoyCharges:999};const g=loadGame({journalStored:JSON.stringify({version:1,presets:[valid,{...valid,route:'<img>'},null,valid]})});assert.equal(g.state.journal.presets.length,3);assert.equal(g.state.journal.presets[1],null);assert.equal(g.state.journal.presets[0].damage,undefined);g.showRoster();g.loadDeployment();g.start();near(g.p.damage,18);assert.equal(g.state.decoyCharges,1);
 for(const opts of [{storageBlocked:true},{journalStored:JSON.stringify({version:99,presets:[valid]})}]){const h=loadGame(opts),before=h.journalSaved();h.showRoster();h.selectRoute('riverside');h.saveDeployment();assert.equal(h.journalSaved(),before);h.selectRoute('downtown');h.loadDeployment();assert.equal(h.state.selectedRoute,'riverside')}
});

test('training uses actual rank-three paths and shield targets with no scores, XP, best time or Bestiary writes',()=>{
 const raw=JSON.stringify({version:1,totals:{runs:1},history:[{outcome:'extracted',time:180}]});const g=loadGame({stored:'180',journalStored:raw});g.showTraining();g.advanceClock(500);const b=g.el('train-arc');b.dispatch('pointerdown',{pointerId:99,clientX:0,clientY:0});b.dispatch('pointerup',{pointerId:99,clientX:0,clientY:0});assert.equal(g.state.training,true);assert.equal(g.p.arc,3);assert.equal(g.p.thunder,false);assert.equal(g.state.enemies.length,4);const target=g.state.enemies[0];g.hitEnemy(target,99999);g.update(.02);for(let i=0;i<90;i++)g.update(1/60);assert.equal(g.state.enemies.length,4);assert.equal(g.state.killCount,0);assert.equal(g.state.xp,0);assert.equal(g.state.level,1);assert.equal(g.state.journal.bestiary.shambler,0);g.setup({elapsed:999});g.pause();quitForTest(g);assert.equal(g.state.runResult.training,true);assert.equal(g.saved(),'180');assert.equal(g.journalSaved(),raw);assert.match(g.el('modal').innerHTML,/TRAINING COMPLETE · UNSCORED/);assert.match(g.runReportText(),/TRAINING · UNSCORED/);assert.doesNotMatch(g.runReportText(),/NaN|Infinity|undefined/);g.el('again').click();assert.equal(g.state.training,true);assert.equal(g.p.arc,3);
});
test('training preserves deployment choices, supports paused evolution/path/reset, and normal runs regain scoring',()=>{
 const g=loadGame();g.showRoster();g.selectSurvivor('tactician');g.selectRoute('freight');g.selectRule('glass');g.selectContract('patrol');g.el('rosterBack').click();const saved=g.journalSaved();g.showTraining();g.startTraining('pierce');near(g.p.hp,100);assert.equal(g.state.selectedSurvivor,'tactician');assert.equal(g.state.selectedRoute,'freight');assert.equal(g.state.selectedRule,'glass');assert.equal(g.state.decoyCharges,1);g.pause();g.el('trainingEvolution').click();assert.equal(g.p.rail,true);const pick=g.el('trainingWeaponPick');pick.value='molotov';pick.dispatch('change');assert.equal(g.p.pierce,0);assert.equal(g.p.molotov,3);assert.equal(g.p.wildfire,true);const time=g.state.elapsed;g.update(20);near(g.state.elapsed,time);g.el('trainingReset').click();assert.equal(g.state.enemies.length,4);assert.equal(g.journalSaved(),saved);quitForTest(g);g.el('changeSurvivor').click();g.el('deploy').click();assert.equal(g.state.training,false);near(g.state.nextBossAt,90);near(g.p.hp,72);assert.equal(g.state.decoyCharges,2);g.hitEnemy(enemy({hp:1}),2);assert.equal(g.state.killCount,1);
});
test('every training weapon and evolution remains bounded with real combat updates and dummy kills never produce drops',()=>{
 for(const weapon of ['pierce','arc','blades','molotov']){const g=loadGame();g.showTraining();g.startTraining(weapon,true);for(let i=0;i<180;i++)g.update(1/30);assert.equal(g.state.training,true);assert.ok(g.state.enemies.length<=4);assert.equal(g.state.gems.length,0);assert.equal(g.state.killCount,0);assert.equal(g.state.particles.length<=600,true);assert.equal(g.state.fires.length<=2,true);assert.equal(g.state.hostileShots.length,0);near(g.p.hp,100);g.pause();assert.doesNotMatch(g.el('modal').innerHTML,/NaN|Infinity|undefined/)}
});

test('route log filters and recent records keep route totals separate without rewriting saves',()=>{
 const raw=JSON.stringify({version:1,history:[{outcome:'extracted',time:200,kills:80,route:'freight'},{outcome:'defeated',time:150,kills:120,route:'riverside'},{outcome:'abandoned',time:400,kills:30}]});const g=loadGame({journalStored:raw});g.showJournal();assert.match(g.el('modal').innerHTML,/RECENT ROUTE RECORDS/);assert.match(g.el('modal').innerHTML,/03:20/);assert.match(g.el('modal').innerHTML,/02:30/);g.setJournalView('route','freight');assert.match(g.el('modal').innerHTML,/Showing 1 of 3/);assert.doesNotMatch(g.el('modal').innerHTML,/DEFEATED · Survivor/);const stale=g.el('logRoute');g.setJournalView('route','legacy');assert.match(g.el('modal').innerHTML,/Showing 1 of 3/);stale.value='riverside';stale.dispatch('change');assert.equal(g.state.journalView.route,'legacy');g.setJournalView('route','<img>');assert.equal(g.state.journalView.route,'legacy');assert.equal(g.journalSaved(),raw);
});
test('result comparisons use matching survivor, rules and route while preserving the overall survival best',()=>{
 const history=[{outcome:'defeated',time:60,kills:10,level:2,survivor:'survivor',rule:'standard',route:'downtown'},{outcome:'extracted',time:500,kills:1000,level:30,survivor:'survivor',rule:'standard',route:'freight'}];const g=loadGame({stored:'500',journalStored:JSON.stringify({version:1,history})});cleanRun(g);g.setup({elapsed:70,killCount:11});g.pause();quitForTest(g);assert.equal(g.state.runComparison.matched,1);near(g.state.runComparison.time,60);assert.match(g.comparisonPanel(),/Downtown/);near(g.state.record,500);const sheet=g.el('modal').innerHTML;g.showManual();g.closeManual();assert.equal(g.el('modal').innerHTML,sheet);
});
test('training rows cannot enter recent route records through an imported backup',()=>{
 const g=loadGame({journalStored:JSON.stringify({version:1,history:[{outcome:'abandoned',time:9999,route:'freight',training:true}]})});assert.equal(g.state.journal.history.length,0);g.showJournal();assert.doesNotMatch(g.el('modal').innerHTML,/166:39/);
});

test('all eight base survivors retain dense six-second salvage on all five routes without spending decoys',()=>{
 for(const route of ['downtown','freight','riverside','park','market'])for(const role of ['survivor','scout','bulwark','engineer','scavenger','tactician','quartermaster','courier']){
  const g=loadGame();g.showRoster();g.selectRoute(route);g.selectSurvivor(role);g.start();g.scheduleRush(Infinity);g.setup({elapsed:260,spawn:1000,overtime:1,nextBossAt:1000,exitAt:1000,nextHowlerAt:Infinity,nextLobberAt:Infinity,nextSpitterAt:Infinity,nextRiotAt:Infinity,nextConvoyAt:Infinity,nextDropAt:Infinity,nextRescueAt:Infinity,nextSalvageAt:Infinity,nextSupplyAt:Infinity,barrels:[],barrelClock:Infinity,barricadeClock:Infinity,shockDrums:[],shockClock:Infinity});assert.ok(g.placeSalvage(),route);const b=g.state.salvage;g.p.x=b.x;g.p.y=b.y;g.p.fireClock=999;
  const crowd=Array.from({length:239},(_,i)=>enemy({x:b.x+100*Math.cos(i/239*Math.PI*2),y:b.y+100*Math.sin(i/239*Math.PI*2),hp:1000,speed:i%3===0?208:i%3===1?112:78,dmg:i%3===0?9:i%3===1?12:20,r:i%3===2?23:15}));g.setup({enemies:crowd});
  for(let i=0;i<360&&g.state.mode==='play';i++){const a=i*g.p.speed/85/60,target={x:b.x+85*Math.cos(a),y:b.y+85*Math.sin(a)},d=Math.hypot(target.x-g.p.x,target.y-g.p.y),strength=d?Math.min(1,d*60/g.p.speed):0;g.touch.x=d?strength*(target.x-g.p.x)/d:0;g.touch.y=d?strength*(target.y-g.p.y)/d:0;g.update(1/60)}
  assert.equal(g.state.mode,'upgrade',`${route}/${role}`);assert.equal(g.state.salvagesSecured,1);assert.ok(g.p.hp>0,`${route}/${role}`);near(g.state.elapsed,266);assert.equal(g.state.decoysUsed,0);assert.equal(g.state.killCount,0);
 }
});
test('Alpha 0.33 native Freight/Tactician overtime reaches Harvester with patrol and records isolated from training',()=>{
 const g=loadGame({seed:0x330033,preferencesStored:JSON.stringify({version:1,reduced:true})});g.showRoster();g.selectSurvivor('tactician');g.selectRoute('freight');g.selectContract('patrol');g.start();Object.assign(g.p,{inv:9999,damage:100,pierce:3,arc:3,blades:3,molotov:3,rail:true,thunder:true,reaper:true,wildfire:true,proj:3,fire:.12});let harvesterSeen=false;
 const settle=()=>{while(g.state.mode==='upgrade')g.choose(0);if(g.state.mode==='extraction')chooseExitForTest(g,'stay');while(g.state.mode==='upgrade')g.choose(0)};
 for(let i=0;i<480*30;i++){
  settle();assert.equal(g.state.mode,'play');if(g.state.exitBeacon){const from={x:g.p.x,y:g.p.y};g.p.x=g.state.exitBeacon.x;g.p.y=g.state.exitBeacon.y;g.updateExtractionArrival(from);settle()}
  const goal=g.patrolTarget();if(goal){const dx=goal.x-g.p.x,dy=goal.y-g.p.y,d=Math.hypot(dx,dy)||1;g.touch.x=dx/d;g.touch.y=dy/d}else{g.touch.x=Math.cos(i/90)*.6;g.touch.y=Math.sin(i/90)*.6}if(i%90===0)g.dash();if(i===300)g.deployDecoy();g.update(1/30);harvesterSeen||=g.state.enemies.some(e=>e.bossKind==='harvester')||g.state.enemyTally.harvester>0;
  if(i%60===0){assert.ok(g.state.enemies.length<=240);assert.ok(g.state.lobberBombs.length<=1);assert.ok(g.state.runTimeline.length<=40);for(const key of ['particles','texts','bullets','lightning','hostileShots','bottles','fires'])assert.ok(g.state[key].length<=(key==='particles'?120:g.limits[key]),key);assert.ok(Number.isFinite(g.p.damage)&&Number.isFinite(g.p.x));g.render()}
 }
 settle();assert.equal(harvesterSeen,true);assert.equal(g.state.patrolVisited,3);assert.equal(g.state.contractCompleted,true);g.pause();quitForTest(g);const r=g.state.runResult;assert.equal(r.training,false);assert.equal(r.route,'freight');assert.equal(r.survivor,'tactician');assert.equal(Object.values(r.weapons).reduce((sum,row)=>sum+row.kills,0),r.kills);assert.equal(Object.values(r.enemyTally).reduce((sum,n)=>sum+n,0),r.kills);assert.ok(g.parseBackup(g.backupText()));assert.doesNotMatch(g.runReportText(),/NaN|Infinity|undefined/);const record=g.saved(),saved=g.journalSaved();g.showTraining();g.startTraining('molotov',true);g.update(5);g.pause();quitForTest(g);assert.equal(g.saved(),record);assert.equal(g.journalSaved(),saved);
});

// Alpha 0.34 — smooth the two-minute crowd spike without persistent difficulty.
test('early horde buildup has no two-minute cliff and still approaches the late-run floor',()=>{
 const g=loadGame();g.start();near(g.hordeSpawnInterval(),.78);let previous=g.hordeSpawnInterval();
 for(let t=30;t<=180;t+=30){g.setup({elapsed:t});const interval=g.hordeSpawnInterval();assert.ok(interval<previous);assert.ok(previous/interval<1.23,`30-second rate jump at ${t}`);previous=interval}
 g.setup({elapsed:119});const before=g.hordeSpawnInterval();g.setup({elapsed:121});assert.ok(before/g.hordeSpawnInterval()<1.02);
 g.setup({elapsed:120});assert.ok(g.hordeSpawnInterval()>.39&&g.hordeSpawnInterval()<.41);g.setup({elapsed:180});assert.ok(g.hordeSpawnInterval()>.28&&g.hordeSpawnInterval()<.31);
 g.setup({elapsed:900});assert.ok(g.hordeSpawnInterval()>=.085&&g.hordeSpawnInterval()<.087);g.setup({elapsed:100000});near(g.hordeSpawnInterval(),.085);
});
test('actual four-minute spawn updates build crowds gradually across seeds',()=>{
 for(const seed of [0x340034,0x340134,0x340234]){
  const g=loadGame({seed});cleanRun(g);g.scheduleRush(Infinity);g.setup({spawn:0,nextBossAt:Infinity,exitAt:Infinity,nextSupplyAt:Infinity,barrels:[],barrelClock:Infinity,obstacles:[]});g.p.fireClock=Infinity;const counts=[0,0,0,0];
  for(let i=0;i<7200;i++){g.update(1/30);counts[Math.floor(i/1800)]+=g.state.enemies.length;g.setup({enemies:[]});assert.equal(g.state.mode,'play')}
  assert.ok(counts[0]>=80&&counts[0]<=120,JSON.stringify(counts));assert.ok(counts[2]>=140&&counts[2]<=220,JSON.stringify(counts));
  for(let i=1;i<4;i++){assert.ok(counts[i]>counts[i-1],JSON.stringify(counts));assert.ok(counts[i]/counts[i-1]<1.5,JSON.stringify(counts))}
 }
});
for(const outcome of ['defeated','abandoned','extracted'])test(`${outcome} retries reset all difficulty after repeated late-game runs`,()=>{
 const g=loadGame();g.start();
 const baseline=()=>JSON.stringify({hp:g.p.hp,max:g.p.max,damage:g.p.damage,speed:g.p.speed,fire:g.p.fire,elapsed:g.state.elapsed,spawn:g.state.spawn,overtime:g.state.overtime,bosses:g.state.bossesDefeated,boss:g.state.nextBossAt,rush:g.state.nextRushAt,riot:g.state.nextRiotAt,howler:g.state.nextHowlerAt,rule:g.state.runRule,interval:g.hordeSpawnInterval()});const expected=baseline();
 for(let round=0;round<4;round++){
  g.setup({elapsed:1800+round*60,overtime:20,bossesDefeated:15,spawn:.01,nextRiotAt:0,nextHowlerAt:0});Object.assign(g.p,{hp:1,damage:500,speed:400,fire:.075,armor:3,rail:true});g.end(outcome);assert.equal(g.state.mode,'end');g.el('again').click();assert.equal(baseline(),expected);assert.equal(g.state.enemies.length,0);assert.equal(g.p.armor,0);assert.equal(g.p.rail,false);
  g.spawnEnemy();const e=g.state.enemies[0];near(e.hp,e.type===1?19:30);near(e.speed,e.type===1?130:70);g.setup({enemies:[]});
 }
 assert.equal(g.state.journal.totals.runs,4);
});
test('large best times and saved veteran records never increase Standard enemy stats or spawn intervals',()=>{
 const records=journalData('survivor',{totals:{runs:5000,extractions:4000,breakers:50000,blackouts:50000,bestOvertime:100},bestiary:{shambler:1000000},history:[{outcome:'extracted',time:1800,kills:23601,level:57,rule:'iron',route:'downtown',survivor:'survivor',overtime:20}]});
 const fresh=loadGame(),veteran=loadGame({stored:'1800',journalStored:records});fresh.start();veteran.start();assert.equal(veteran.state.runRule,'standard');assert.equal(veteran.state.record,1800);
 for(const elapsed of [0,60,120,180,600]){
  fresh.setup({elapsed});veteran.setup({elapsed});near(fresh.hordeSpawnInterval(),veteran.hordeSpawnInterval());
  for(let i=0;i<20;i++){fresh.spawnEnemy();veteran.spawnEnemy()}
  assert.equal(JSON.stringify(veteran.state.enemies),JSON.stringify(fresh.state.enemies));fresh.setup({enemies:[]});veteran.setup({enemies:[]});
 }
});
test('retry repeats an explicit challenge rule without escalating it and Standard remains available',()=>{
 const g=loadGame();g.showRoster();g.selectRule('iron');g.start();
 for(let i=0;i<3;i++){g.setup({elapsed:120,overtime:10});g.end('defeated');assert.match(g.el('modal').innerHTML,/RUN RULES · Iron Horde/);g.el('again').click();assert.equal(g.state.runRule,'iron');near(g.hordeSpawnInterval(),.78);g.spawnEnemy();const e=g.state.enemies[0];near(e.hp,(e.type===1?19:30)*1.25)}
 g.end('abandoned');g.el('changeSurvivor').click();g.selectRule('standard');g.el('deploy').click();assert.equal(g.state.runRule,'standard');g.spawnEnemy();const e=g.state.enemies[0];near(e.hp,e.type===1?19:30);
});

// Alpha 0.35 — ten additions, preserving the accepted gradual horde curve.
test('Alpha 0.35 Memorial Park has bounded scenery, normal stats and reachable patrol checkpoints',()=>{
 const g=loadGame({traceCanvas:true,preferencesStored:JSON.stringify({version:1,scenery:'classic'})});g.showRoster();g.selectRoute('park');g.selectContract('patrol');g.start();assert.equal(g.state.runRoute,'park');assert.equal(g.state.barricades.length,2);assert.equal(g.state.barrels.length,3);assert.ok(g.state.obstacles.length<=82);assert.ok(g.state.obstacles.some(o=>o.type===4));near(g.p.hp,100);near(g.state.nextBossAt,90);near(g.state.nextRiotAt,150);near(g.state.nextHowlerAt,210);near(g.hordeSpawnInterval(),.78);assert.equal(g.state.patrol.length,3);
 for(const b of g.state.patrol){assert.ok(g.state.barricades.every(o=>g.pointRectDistance(b,o)>b.r+g.p.r));g.p.x=b.x;g.p.y=b.y;g.updatePatrol({x:b.x,y:b.y})}assert.equal(g.state.patrolVisited,3);g.p.x=465;g.p.y=0;g.render();assert.ok(g.drawingTrace().some(row=>row[0]==='set'&&row[2]==='#397d8a'));g.pause();quitForTest(g);assert.equal(g.state.runResult.route,'park');const next=loadGame({journalStored:g.journalSaved()});assert.equal(next.state.journal.history[0].route,'park');
});

test('Alpha 0.35 Quartermaster trades speed for exactly two real rerolls and resets on retry',()=>{
 const g=loadGame();g.showRoster();g.selectSurvivor('quartermaster');g.start();near(g.p.hp,100);near(g.p.speed,200);near(g.p.damage,18);assert.equal(g.state.rerollsLeft,2);assert.equal(g.state.decoyCharges,1);earnUpgrade(g);assert.equal(g.el('rerollUpgrade'),undefined);chooseNamed(g,'Piercing Rounds');earnUpgrade(g);assert.match(g.el('modal').innerHTML,/REROLL CHOICES · 2 LEFT/);rerollPress(g);assert.equal(g.state.rerollsLeft,1);rerollPress(g);assert.equal(g.state.rerollsLeft,0);g.choose(0);g.pause();assert.match(g.el('modal').innerHTML,/Upgrade reroll: used this run/);quitForTest(g);assert.equal(g.state.runResult.survivor,'quartermaster');g.el('again').click();assert.equal(g.state.rerollsLeft,2);g.pause();assert.match(g.el('modal').innerHTML,/Upgrade reroll: 2 available/);
 const h=loadGame({journalStored:g.journalSaved()});assert.equal(h.state.selectedSurvivor,'quartermaster');h.start();assert.equal(h.state.rerollsLeft,2);
});

test('Alpha 0.35 Evasive Reload primes one whole volley, respects cooldown and pauses, and expires',()=>{
 const g=loadGame();cleanRun(g);g.opts.find(o=>o.name==='Evasive Reload').apply();g.p.proj=3;g.p.fireClock=0;g.setup({enemies:[enemy({x:300,hp:1000,max:1000})]});g.dash();near(g.evasiveMultiplier(),1.2);g.pause();const ready=g.p.evasiveUntil;g.update(10);near(g.p.evasiveUntil,ready);g.resume();g.update(.01);assert.equal(g.state.bullets.length,3);for(const b of g.state.bullets)near(b.dmg,21.6);near(g.evasiveMultiplier(),1);near(g.p.damage,18);g.p.fireClock=0;g.setup({bullets:[]});g.update(.01);for(const b of g.state.bullets)near(b.dmg,18);g.dash();near(g.evasiveMultiplier(),1);
 g.p.dashCd=0;g.setup({enemies:[],bullets:[]});g.dash();for(let i=0;i<61;i++)g.update(1/30);near(g.evasiveMultiplier(),1);g.pause();quitForTest(g);assert.equal(g.state.runResult.evasive,true);assert.match(g.el('modal').innerHTML,/Evasive Reload/);g.el('again').click();assert.equal(g.p.evasive,false);near(g.p.evasiveUntil,0);
});
test('Alpha 0.35 Evasive Reload keeps rail and steady multipliers and obeys the first-weapon choice',()=>{
 const g=loadGame();cleanRun(g);earnUpgrade(g);assert.ok(g.state.upgradeOffer.picks.every(o=>o.weapon));chooseNamed(g,'Piercing Rounds');g.opts.find(o=>o.name==='Evasive Reload').apply();assert.equal(g.opts.find(o=>o.name==='Evasive Reload').available(),false);Object.assign(g.p,{rail:true,steady:true,stillTime:.6,proj:1,fireClock:0});g.setup({enemies:[enemy({x:300,hp:1000})]});g.dash();g.p.dash=0;g.p.stillTime=.6;g.update(.01);near(g.state.bullets[0].dmg,18*1.25*1.15*1.2);const loaded=loadGame({journalStored:journalData('survivor',{history:[{outcome:'defeated',time:20,evasive:true}]})});loaded.start();assert.equal(loaded.p.evasive,false);
});

test('Alpha 0.35 Evasive Reload is selectable from a real later offer',()=>{
 let offered=false;for(let seed=1;seed<=30&&!offered;seed++){const g=loadGame({seed});laterUpgrade(g);const i=g.state.upgradeOffer.picks.findIndex(o=>o.name==='Evasive Reload');if(i<0)continue;g.choose(i);assert.equal(g.p.evasive,true);offered=true}assert.equal(offered,true);
});

test('Alpha 0.35 Field Evolution rewards a real evolution once and stays optional',()=>{
 const g=loadGame();startContract(g,'evolution');earnUpgrade(g);chooseNamed(g,'Piercing Rounds');g.p.pierce=3;g.checkContract();assert.equal(g.contractProgress(),0);assert.equal(g.state.contractCompleted,false);earnUpgrade(g);fixtureOfferedUpgrade(g,'Evolve: Railstorm');chooseNamed(g,'Evolve: Railstorm');g.checkLevelUp();assert.equal(g.contractProgress(),1);assert.equal(g.state.contractCompleted,true);assert.equal(g.state.mode,'upgrade');assert.match(g.el('modal').innerHTML,/CONTRACT COMPLETE/);g.choose(0);g.checkLevelUp();assert.equal(g.state.mode,'play');g.checkContract();assert.equal(g.state.bonusChoices,0);g.pause();quitForTest(g);assert.equal(g.state.runResult.contract,'evolution');assert.equal(g.state.runResult.contractCompleted,true);const h=loadGame({journalStored:g.journalSaved()});assert.equal(h.state.journal.history[0].contract,'evolution');h.start();assert.equal(h.p.rail,false);
 const unfinished=loadGame();startContract(unfinished,'evolution');prepareExit(unfinished);reachExit(unfinished);chooseExitForTest(unfinished,'extract');assert.equal(unfinished.state.runResult.outcome,'extracted');assert.equal(unfinished.state.runResult.contractCompleted,false);
});

test('Alpha 0.35 encounter briefing reads real encounters while all run state stays frozen',()=>{
 const g=loadGame();cleanRun(g);const snapshot=()=>JSON.stringify({p:g.p,t:g.state.elapsed,next:g.state.nextBossAt,rush:g.state.nextRushAt,rule:g.state.runRule,xp:g.state.xp});g.pause();const before=snapshot();assert.match(g.el('modal').innerHTML,/ENCOUNTER BRIEFING/);assert.match(g.encounterBriefing(),/BREAKER due in 01:30/);assert.match(g.encounterBriefing(),/Extraction time in 03:00/);g.update(100);assert.equal(snapshot(),before);g.resume();g.spawnBoss('warden');g.setup({enemies:[g.state.activeBoss,riot()]});g.pause();assert.match(g.encounterBriefing(),/WARDEN active/);assert.match(g.encounterBriefing(),/Riot Guard ×1/);assert.match(g.encounterBriefing(),/Flank it/);const h=loadGame();h.startTraining('pierce');h.pause();assert.match(h.encounterBriefing(),/Unscored practice/);assert.doesNotMatch(h.encounterBriefing(),/Infinity|NaN/);
});

test('Alpha 0.35 left-handed controls persist, clear input, and preserve second-finger Pause',()=>{
 const g=loadGame();assert.equal(g.el('hud').attrs['data-mirrored'],'false');cleanRun(g);g.touch.x=1;g.pause();g.showSettings();g.el('pref-mirrored').click();assert.equal(g.state.preferences.mirrored,true);assert.equal(g.el('hud').attrs['data-mirrored'],'true');assert.equal(g.el('touch').attrs['data-mirrored'],'true');near(g.touch.x,0);const saved=g.preferencesSaved();g.el('settingsBack').click();assert.equal(g.state.mode,'paused');g.resume();const stick=g.el('stick');stick.getBoundingClientRect=()=>({left:259,top:600,width:125,height:125});stick.dispatch('pointerdown',{pointerId:7,clientX:347,clientY:662.5});near(g.touch.x,.5);g.el('pause').dispatch('pointerdown',{pointerId:8});assert.equal(g.state.mode,'paused');assert.equal(g.touch.id,null);const next=loadGame({preferencesStored:saved});assert.equal(next.el('hud').attrs['data-mirrored'],'true');
});
test('Alpha 0.35 mirrored warning and objective labels avoid the left control column on phone views',()=>{
 for(const [width,height] of [[412,915],[915,412],[320,640]]){const g=loadGame({width,height,preferencesStored:JSON.stringify({version:1,mirrored:true})});cleanRun(g);g.setup({rescue:stranded({x:-2000,y:-2000})});const m=g.objectiveWaypoint();const overlap=m.x+30>16&&m.x-30<114&&m.y+18>65&&m.y-34<234;assert.equal(overlap,false,`${width}x${height}`);g.render()}
 const bad=loadGame({preferencesStored:JSON.stringify({version:1,mirrored:'true'})});assert.equal(bad.state.preferences.mirrored,false);const future=loadGame({preferencesStored:JSON.stringify({version:99,mirrored:true})});future.showSettings();future.el('pref-mirrored').click();assert.equal(future.preferencesSaved(),JSON.stringify({version:99,mirrored:true}));
});

test('Alpha 0.35 aim display follows the real gun priority without changing combat state',()=>{
 const a=loadGame({traceCanvas:true,preferencesStored:JSON.stringify({version:1,aim:true})}),b=loadGame({seed:0x5eed1234});for(const g of [a,b]){cleanRun(g);g.p.fireClock=999;g.setup({enemies:[enemy({x:100,hp:100}),riot({x:150,hp:10})]});g.pause();g.selectGunPriority('weakest');g.resume()}const target=a.gunTarget();assert.equal(target.riot,true);const before=JSON.stringify({p:a.p,e:a.state.enemies,elapsed:a.state.elapsed});a.clearTrace();a.renderAimDisplay();assert.ok(a.drawingTrace().some(row=>row[0]==='fillText'&&row[1]==='GUN TARGET'&&row[2]===150));assert.equal(JSON.stringify({p:a.p,e:a.state.enemies,elapsed:a.state.elapsed}),before);
 for(let i=0;i<60;i++){a.update(1/30);b.update(1/30)}assert.equal(JSON.stringify(a.state.enemies),JSON.stringify(b.state.enemies));assert.equal(JSON.stringify(a.p),JSON.stringify(b.p));const off=loadGame({traceCanvas:true});cleanRun(off);off.clearTrace();off.renderAimDisplay();assert.equal(off.drawingTrace().length,0);
});

for(const kind of ['breaker','warden','harvester'])test(`Alpha 0.35 ${kind} live drill uses real attacks, freezes on pause and never scores`,()=>{
 const g=loadGame({stored:'1800',journalStored:journalData('scout')});const saved=g.journalSaved();g.startTraining('pierce',false,kind);assert.equal(g.state.trainingScenario,kind);assert.equal(g.state.enemies.length,1);const boss=g.state.activeBoss;assert.equal(boss.bossKind,kind);assert.equal(boss.trainingBoss,true);Object.assign(boss,{x:90,y:0,phaseTime:0});g.p.fireClock=999;let warned=false,attacked=false;
 for(let i=0;i<300;i++){g.update(1/60);warned||=boss.phase==='warn';attacked||=boss.phase==='charge'||boss.phase==='recover'||g.state.hostileShots.length>0}assert.equal(warned,true);assert.equal(attacked,true);near(g.p.hp,100);g.pause();const before=JSON.stringify(boss),time=g.state.elapsed;g.update(100);assert.equal(JSON.stringify(boss),before);near(g.state.elapsed,time);g.resume();g.hitEnemy(boss,99999);assert.equal(g.state.bossesDefeated,0);assert.equal(g.state.killCount,0);assert.equal(g.state.gems.length,0);for(let i=0;i<100;i++)g.update(1/60);assert.notEqual(g.state.activeBoss,boss);assert.equal(g.state.activeBoss.bossKind,kind);assert.equal(g.state.enemyTally[kind],0);g.pause();quitForTest(g);assert.equal(g.saved(),'1800');assert.equal(g.journalSaved(),saved);g.el('again').click();assert.equal(g.state.trainingScenario,kind);assert.equal(g.state.activeBoss.bossKind,kind);
});
test('Alpha 0.35 boss drill selection is guarded and switches back to stationary targets cleanly',()=>{
 const g=loadGame();g.showTraining();const card=g.el('drill-warden');card.dispatch('pointerdown',{pointerId:1});card.dispatch('pointerup',{pointerId:1});assert.equal(g.state.mode,'training-menu');g.advanceClock(500);card.dispatch('pointerdown',{pointerId:2});card.dispatch('pointerup',{pointerId:2});assert.equal(g.state.trainingScenario,'warden');g.pause();const picker=g.el('trainingScenarioPick');picker.value='targets';picker.dispatch('change');assert.equal(g.state.activeBoss,null);assert.equal(g.state.enemies.length,4);assert.equal(g.state.hostileShots.length,0);assert.equal(g.state.mode,'paused');picker.value='harvester';picker.dispatch('change');assert.equal(g.state.trainingScenario,'targets');g.resume();g.pause();quitForTest(g);g.el('changeSurvivor').click();g.el('deploy').click();assert.equal(g.state.training,false);assert.equal(g.state.trainingScenario,'targets');near(g.state.nextBossAt,90);
});

test('Alpha 0.35 practice statistics cap overkill, separate sources and freeze/reset without score writes',()=>{
 const g=loadGame({stored:'1800',journalStored:journalData('scout')});const saved=g.journalSaved();g.startTraining('pierce');g.p.fireClock=999;const e=g.state.enemies[0],other=g.state.enemies[1];e.hp=7;g.hitEnemy(e,100,'FIRE');g.hitEnemy(e,100,'FIRE');g.hitEnemy(other,10);g.update(.5);const stats=g.practiceSnapshot();near(stats.damage,17);assert.equal(stats.hits,2);assert.equal(stats.targets,1);near(stats.average,34);near(stats.weapons.fire.damage,7);near(stats.weapons.gun.damage,10);assert.equal(stats.weapons.fire.kills,1);assert.equal(Object.values(g.state.weaponLedger).reduce((sum,row)=>sum+row.damage,0),0);assert.equal(g.state.killCount,0);assert.equal(g.state.xp,0);g.pause();assert.match(g.el('modal').innerHTML,/PRACTICE STATISTICS/);g.update(100);assert.equal(JSON.stringify(g.practiceSnapshot()),JSON.stringify(stats));quitForTest(g);const r=g.state.runResult;assert.ok(Object.isFrozen(r.practice)&&Object.isFrozen(r.practice.weapons.fire));near(r.practice.damage,17);assert.match(g.runReportText(),/PRACTICE STATISTICS \(unscored; since last reset\)/);assert.equal(g.journalSaved(),saved);assert.equal(g.saved(),'1800');g.el('again').click();near(g.practiceSnapshot().damage,0);near(g.practiceSnapshot().time,0);g.hitEnemy(g.state.enemies[0],1);g.pause();g.el('trainingReset').click();near(g.practiceSnapshot().damage,0);near(g.practiceSnapshot().time,0);near(r.practice.damage,17);
});
test('Alpha 0.35 normal runs cannot inherit training damage statistics',()=>{
 const g=loadGame();g.startTraining('molotov',true,'harvester');g.hitEnemy(g.state.activeBoss,100,'FIRE');g.pause();quitForTest(g);g.el('changeSurvivor').click();g.el('deploy').click();assert.equal(g.state.training,false);assert.equal(g.currentRunStats().practice,null);assert.equal(g.practicePanel(),'');g.pause();assert.doesNotMatch(g.el('modal').innerHTML,/PRACTICE STATISTICS/);
});

test('Alpha 0.35 favored path highlights real rank/evolution cards without changing seeded offers',()=>{
 const a=loadGame(),b=loadGame();a.showRoster();const pick=a.el('favoredPick');pick.value='arc';pick.dispatch('change');assert.equal(a.state.preferences.favored,'arc');assert.equal(a.p.arc,0);a.start();b.start();earnUpgrade(a);earnUpgrade(b);assert.equal(JSON.stringify(a.state.upgradeOffer.picks.map(o=>o.name)),JSON.stringify(b.state.upgradeOffer.picks.map(o=>o.name)));assert.match(a.el('modal').innerHTML,/FAVORED PATH/);assert.equal(a.state.upgradeOffer.picks.filter(a.favoredChoice).length,1);chooseNamed(a,'Chain Lightning');chooseNamed(b,'Chain Lightning');earnUpgrade(a);earnUpgrade(b);assert.equal(JSON.stringify(a.state.upgradeOffer.picks.map(o=>o.name)),JSON.stringify(b.state.upgradeOffer.picks.map(o=>o.name)));assert.equal(a.state.rerollsLeft,1);assert.equal(a.p.arc,1);assert.equal(a.favoredChoice(a.opts.find(o=>o.evolution==='thunder')),true);assert.equal(a.favoredChoice(a.opts.find(o=>o.name==='Evasive Reload')),false);
 const h=loadGame({preferencesStored:a.preferencesSaved()});assert.equal(h.state.preferences.favored,'arc');h.start();assert.equal(h.p.arc,0);h.pause();const pausePicker=h.el('favoredPick');pausePicker.value='molotov';pausePicker.dispatch('change');assert.equal(h.state.preferences.favored,'molotov');h.resume();pausePicker.value='pierce';pausePicker.dispatch('change');assert.equal(h.state.preferences.favored,'molotov');
});
test('Alpha 0.35 favored preferences validate identifiers and preserve future or blocked saves',()=>{
 const unknown=loadGame({preferencesStored:JSON.stringify({version:1,favored:'<img src=x>'})});assert.equal(unknown.state.preferences.favored,'off');unknown.showSettings();assert.doesNotMatch(unknown.el('modal').innerHTML,/<img/);const picker=unknown.el('favoredPick');picker.value='__proto__';picker.dispatch('change');assert.equal(unknown.state.preferences.favored,'off');
 const future=JSON.stringify({version:99,favored:'arc'}),g=loadGame({preferencesStored:future});g.showSettings();g.el('favoredPick').value='blades';g.el('favoredPick').dispatch('change');assert.equal(g.state.preferences.favored,'blades');assert.equal(g.preferencesSaved(),future);const blocked=loadGame({storageBlocked:true});blocked.showRoster();blocked.el('favoredPick').value='pierce';blocked.el('favoredPick').dispatch('change');assert.equal(blocked.state.preferences.favored,'pierce');assert.equal(blocked.state.preferences.available,false);
});

test('Alpha 0.35 practice statistics receive actual rank-three and evolved weapon hits across all paths',()=>{
 for(const [path,source] of [['pierce','gun'],['arc','lightning'],['blades','blades'],['molotov','fire']])for(const evolved of [false,true]){
  const g=loadGame();g.startTraining(path,evolved);g.p.x=path==='blades'?-130+(evolved?100:78):-65;g.p.y=30;for(let i=0;i<240;i++)g.update(1/60);assert.ok(g.practiceSnapshot().weapons[source].damage>0,`${path}/${evolved}`);assert.equal(g.state.killCount,0);assert.equal(g.state.gems.length,0);assert.equal(g.state.journal.totals.runs,0);assert.doesNotMatch(g.practicePanel(),/NaN|Infinity|Last-hit kills/);
 }
});
test('Alpha 0.35 native Park Quartermaster run combines mirrored aim, patrol and Evasive Reload with normal records',()=>{
 const g=loadGame({seed:0x350035,preferencesStored:JSON.stringify({version:1,mirrored:true,aim:true,favored:'molotov',reduced:true})});g.showRoster();g.selectRoute('park');g.selectSurvivor('quartermaster');g.selectContract('patrol');g.start();Object.assign(g.p,{inv:9999,damage:100,pierce:3,arc:3,blades:3,molotov:3,rail:true,thunder:true,reaper:true,wildfire:true,proj:3,fire:.12});g.opts.find(o=>o.name==='Evasive Reload').apply();
 const settle=()=>{while(g.state.mode==='upgrade')g.choose(0);if(g.state.mode==='extraction')chooseExitForTest(g,'stay');while(g.state.mode==='upgrade')g.choose(0)};
 for(let i=0;i<240*30;i++){settle();if(g.state.exitBeacon){const from={x:g.p.x,y:g.p.y};g.p.x=g.state.exitBeacon.x;g.p.y=g.state.exitBeacon.y;g.updateExtractionArrival(from);settle()}const goal=g.patrolTarget();if(goal){const dx=goal.x-g.p.x,dy=goal.y-g.p.y,d=Math.hypot(dx,dy)||1;g.touch.x=dx/d;g.touch.y=dy/d}else{g.touch.x=Math.cos(i/90)*.6;g.touch.y=Math.sin(i/90)*.6}if(i%90===0)g.dash();g.update(1/30);if(i%90===0){settle();assert.equal(g.state.mode,'play');assert.ok(g.state.enemies.length<=240);assert.ok(g.state.particles.length<=120);assert.ok(g.state.hostileShots.length<=12);assert.ok(Number.isFinite(g.p.hp)&&Number.isFinite(g.p.damage));g.render()}}
 settle();assert.equal(g.state.patrolVisited,3);assert.equal(g.state.contractCompleted,true);assert.ok(g.state.bossesDefeated>=1);assert.ok(g.state.overtime>=1);g.pause();quitForTest(g);const r=g.state.runResult;assert.equal(r.route,'park');assert.equal(r.survivor,'quartermaster');assert.equal(r.evasive,true);assert.equal(r.practice,null);assert.equal(Object.values(r.weapons).reduce((sum,row)=>sum+row.kills,0),r.kills);assert.ok(g.parseBackup(g.backupText()));assert.doesNotMatch(g.runReportText(),/undefined|NaN|Infinity/);const saved=g.journalSaved();g.startTraining('arc',true,'warden');g.update(1);g.pause();quitForTest(g);assert.equal(g.journalSaved(),saved);g.el('changeSurvivor').click();g.el('deploy').click();assert.equal(g.state.runRoute,'park');assert.equal(g.state.runSurvivor,'quartermaster');assert.equal(g.state.rerollsLeft,2);near(g.hordeSpawnInterval(),.78);assert.equal(g.p.evasive,false);
});

// Alpha 0.36 — field supplies, weapon choices and run review.
test('Alpha 0.36 field locker requires a boss and quiet window, stays optional and refills one capped tool',()=>{
 const g=loadGame();cleanRun(g);g.updateLocker();assert.equal(g.state.locker,null);g.setup({bossesDefeated:1,reliefUntil:10});g.updateLocker();assert.equal(g.state.locker,null);g.setup({elapsed:11,reliefUntil:0});g.updateLocker();assert.ok(g.state.locker);assert.equal(g.state.lockerOffered,true);g.p.x=g.state.locker.x;g.p.y=g.state.locker.y;g.update(.01);assert.equal(g.state.mode,'play');g.pause();g.el('pauseLocker').click();assert.equal(g.state.mode,'locker');const hp=g.p.hp,time=g.state.elapsed;g.update(10);near(g.state.elapsed,time);g.el('locker-reroll').dispatch('pointerdown',{pointerId:1});g.el('locker-reroll').dispatch('pointerup',{pointerId:1});assert.equal(g.state.rerollsLeft,1);g.advanceClock(500);g.el('locker-reroll').dispatch('pointerdown',{pointerId:2});g.el('locker-reroll').dispatch('pointerup',{pointerId:2});assert.equal(g.state.rerollsLeft,2);assert.equal(g.state.lockersUsed,1);assert.equal(g.state.locker,null);assert.equal(g.state.mode,'paused');near(g.p.hp,hp);g.resume();g.updateLocker();assert.equal(g.state.locker,null);g.pause();quitForTest(g);assert.equal(g.state.runResult.lockers,1);g.el('again').click();assert.equal(g.state.lockersUsed,0);assert.equal(g.state.lockerOffered,false);
});
test('Alpha 0.36 locker cancel preserves tools and full capacity cannot consume it',()=>{
 const g=loadGame();g.showRoster();g.selectSurvivor('quartermaster');cleanRun(g);g.setup({bossesDefeated:1});g.updateLocker();g.p.x=g.state.locker.x;g.p.y=g.state.locker.y;g.pause();g.showLocker();const b=g.state.locker;g.el('lockerBack').click();assert.equal(g.state.mode,'paused');assert.equal(g.state.locker,b);g.showLocker();g.takeLocker('unknown');g.takeLocker('reroll');assert.equal(g.state.rerollsLeft,2);assert.equal(g.state.locker,b);assert.equal(g.state.lockersUsed,0);g.advanceClock(500);g.el('locker-decoy').dispatch('pointerdown',{pointerId:7});g.el('locker-decoy').dispatch('pointerup',{pointerId:7});assert.equal(g.state.decoyCharges,2);assert.equal(g.state.lockersUsed,1);assert.equal(g.state.mode,'paused');const h=loadGame();h.startTraining('arc');h.setup({bossesDefeated:1});h.updateLocker();assert.equal(h.state.locker,null);
});

test('Alpha 0.36 Field Resupply pays one contract choice after a real tool claim and does not gate extraction',()=>{
 const g=loadGame();startContract(g,'resupply');g.setup({bossesDefeated:1});g.updateLocker();g.p.x=g.state.locker.x;g.p.y=g.state.locker.y;g.pause();g.showLocker();g.takeLocker('decoy');assert.equal(g.contractProgress(),1);assert.equal(g.state.mode,'paused');g.resume();g.update(.01);assert.equal(g.state.mode,'upgrade');assert.match(g.el('modal').innerHTML,/CONTRACT COMPLETE/);g.choose(0);g.checkContract();assert.equal(g.state.bonusChoices,0);g.pause();quitForTest(g);assert.equal(g.state.runResult.contract,'resupply');assert.equal(g.state.runResult.contractCompleted,true);assert.match(g.runReportText(),/Field lockers: 1/);const next=loadGame({journalStored:g.journalSaved()});assert.equal(next.state.journal.history[0].lockers,1);next.start();assert.equal(next.state.lockersUsed,0);
 const h=loadGame();startContract(h,'resupply');prepareExit(h);reachExit(h);chooseExitForTest(h,'extract');assert.equal(h.state.runResult.outcome,'extracted');assert.equal(h.state.runResult.contractCompleted,false);
});

test('Alpha 0.36 Courier base and capacitor cooldowns preserve damage/protection and reset normally',()=>{
 const g=loadGame();g.showRoster();g.selectSurvivor('courier');g.start();near(g.p.hp,90);near(g.p.speed,220);near(g.p.damage,18);near(g.dashCooldown(),2.25);g.dash();near(g.p.dashCd,2.25);near(g.p.inv,.25);g.opts.find(o=>o.name==='Dash Capacitor').apply();near(g.dashCooldown(),2);assert.match(g.opts.find(o=>o.name==='Dash Capacitor').desc(),/1.75s instead of 2.25s/);g.opts.find(o=>o.name==='Dash Capacitor').apply();near(g.dashCooldown(),1.75);g.pause();quitForTest(g);g.el('again').click();near(g.dashCooldown(),2.25);assert.equal(g.p.capacitor,0);const next=loadGame({journalStored:g.journalSaved()});assert.equal(next.state.selectedSurvivor,'courier');next.startTraining('pierce');near(next.dashCooldown(),2.5);
 for(const role of ['survivor','scout','bulwark','engineer','scavenger','tactician','quartermaster']){const h=loadGame();h.showRoster();h.selectSurvivor(role);h.start();near(h.dashCooldown(),2.5);h.p.capacitor=2;near(h.dashCooldown(),2)}
});

test('Alpha 0.36 Market District keeps normal pacing, reachable supplies and validated presets',()=>{
 const g=loadGame({traceCanvas:true,preferencesStored:JSON.stringify({version:1,scenery:'classic'})});g.showRoster();g.selectRoute('market');g.selectSurvivor('courier');g.selectContract('resupply');g.saveDeployment();g.selectRoute('downtown');g.selectSurvivor('survivor');g.loadDeployment();assert.equal(g.state.selectedRoute,'market');assert.equal(g.state.selectedSurvivor,'courier');g.start();assert.equal(g.state.barricades.length,3);assert.equal(g.state.barrels.length,3);assert.ok(g.state.obstacles.length<=99);assert.ok(g.state.obstacles.every(o=>o.type===5));near(g.hordeSpawnInterval(),.78);near(g.state.nextRiotAt,150);near(g.state.nextHowlerAt,210);g.setup({bossesDefeated:1});g.updateLocker();assert.ok(g.state.locker);assert.ok(g.state.barricades.every(b=>g.pointRectDistance(g.state.locker,b)>45));g.p.x=600;g.render();assert.ok(g.drawingTrace().some(r=>r[0]==='set'&&r[2]==='#6a4657'));g.pause();quitForTest(g);assert.equal(g.state.runResult.route,'market');assert.equal(g.state.journal.history[0].route,'market');
});

test('Alpha 0.36 Arc Relay extends only later lightning jumps while preserving damage, limits and reset',()=>{
 const g=loadGame();cleanRun(g);const perk=g.opts.find(o=>o.name==='Arc Relay');assert.equal(perk.available(),false);g.p.arc=1;assert.equal(perk.available(),true);let first=enemy({x:280,hp:100}),second=enemy({x:450,hp:100});g.setup({enemies:[first,second]});assert.equal(g.fireLightning(),1);near(second.hp,100);first.hp=100;perk.apply();assert.equal(perk.available(),false);assert.equal(g.fireLightning(),2);near(first.hp,85.6);near(second.hp,85.6);g.setup({enemies:[enemy({x:305,hp:100})]});assert.equal(g.fireLightning(),0);Object.assign(g.p,{arc:3,thunder:true});g.setup({enemies:Array.from({length:25},(_,i)=>enemy({x:280+i*30,hp:1000}))});assert.ok(g.fireLightning()<=8);g.pause();assert.match(g.el('modal').innerHTML,/lightning jumps \+20%/);quitForTest(g);assert.equal(g.state.runResult.arcRelay,true);g.el('again').click();assert.equal(g.p.arcRelay,false);
});

test('Alpha 0.36 Blade Reach changes real blade orbit/contact without extra blades, damage or permanent perks',()=>{
 const g=loadGame();cleanRun(g);const perk=g.opts.find(o=>o.name==='Blade Reach');assert.equal(perk.available(),false);Object.assign(g.p,{blades:3,reaper:true,fireClock:999});const target=enemy({x:132,hp:100});g.setup({enemies:[target]});g.updateWeapons(.01,{x:0,y:0});near(target.hp,100);perk.apply();near(g.bladeRadius(),112);assert.equal(g.bladePositions().length,6);for(const b of g.bladePositions())near(Math.hypot(b.x,b.y),112);g.updateWeapons(.01,{x:0,y:0});near(target.hp,75.7);assert.equal(perk.available(),false);g.pause();quitForTest(g);assert.equal(g.state.runResult.bladeReach,true);g.el('again').click();assert.equal(g.p.bladeReach,false);
});
test('Alpha 0.36 weapon support cards use real later offers and practice toggles reset practice totals',()=>{
 for(const [path,name] of [['arc','Arc Relay'],['blades','Blade Reach']]){let found=false;for(let seed=1;seed<=80&&!found;seed++){const g=loadGame({seed});cleanRun(g);earnUpgrade(g);chooseNamed(g,path==='arc'?'Chain Lightning':'Orbiting Blades');earnUpgrade(g);const i=g.state.upgradeOffer.picks.findIndex(o=>o.name===name);if(i<0)continue;g.choose(i);assert.equal(g.p[path==='arc'?'arcRelay':'bladeReach'],true);found=true}assert.equal(found,true,name)}
 const g=loadGame();g.startTraining('arc');g.hitEnemy(g.state.enemies[0],10,'LIGHTNING');g.pause();g.el('trainingMod').click();assert.equal(g.p.arcRelay,true);near(g.practiceSnapshot().damage,0);const picker=g.el('trainingWeaponPick');picker.value='blades';picker.dispatch('change');assert.equal(g.p.arcRelay,false);g.el('trainingMod').click();assert.equal(g.p.bladeReach,true);near(g.bladeRadius(),90);quitForTest(g);g.el('changeSurvivor').click();g.el('deploy').click();assert.equal(g.p.arcRelay,false);assert.equal(g.p.bladeReach,false);
});

for(const kind of ['spitter','riot','howler','lobber'])test(`Alpha 0.36 ${kind} specialist drill attacks, freezes and respawns without scores`,()=>{
 const g=loadGame({stored:'1800',journalStored:journalData('scout')});const saved=g.journalSaved();g.startTraining('pierce',false,kind);g.p.fireClock=999;const e=g.state.enemies.find(e=>e.trainingSpecialist);assert.ok(e);assert.equal(e[kind],true);Object.assign(e,{x:100,y:0,cooldown:0,facing:Math.PI});for(const helper of g.state.enemies.filter(e=>e.trainingHelper!==undefined)){helper.x=110;helper.y=20+helper.trainingHelper*25}let warning=false,attack=false;
 for(let i=0;i<600;i++){g.update(1/60);warning||=e.phase!=='approach';attack||=g.state.hostileShots.length>0||g.state.lobberBombs.length>0||e.phase==='bash'||g.state.enemies.some(other=>other.howlUntil>g.state.elapsed)}assert.equal(warning,true);assert.equal(attack,true,kind);near(g.p.hp,100);assert.ok(g.state.enemies.length<=(kind==='howler'?4:1));g.pause();const before=JSON.stringify(g.state.enemies),time=g.state.elapsed;g.update(100);assert.equal(JSON.stringify(g.state.enemies),before);near(g.state.elapsed,time);g.resume();g.hitEnemy(e,99999);for(let i=0;i<100;i++)g.update(1/60);assert.ok(g.state.enemies.some(other=>other!==e&&other.trainingSpecialist));assert.equal(g.state.killCount,0);assert.equal(g.state.gems.length,0);assert.equal(g.state.enemyTally[kind],0);g.pause();quitForTest(g);assert.equal(g.saved(),'1800');assert.equal(g.journalSaved(),saved);g.el('again').click();assert.equal(g.state.trainingScenario,kind);
});
test('Alpha 0.36 Lobber practice bypass cannot enable Lobbers in normal pre-overtime runs',()=>{
 const g=loadGame();cleanRun(g);g.setup({elapsed:255,nextLobberAt:255});g.updateLobberSchedule();assert.equal(g.state.enemies.some(e=>e.lobber),false);g.pause();g.startTraining('pierce',false,'lobber');assert.ok(g.state.enemies.some(e=>e.lobber));g.pause();quitForTest(g);g.el('changeSurvivor').click();g.el('deploy').click();assert.equal(g.state.training,false);assert.equal(g.state.trainingScenario,'targets');assert.equal(g.state.enemies.length,0);assert.equal(g.lobberBlocked(),true);
});

test('Alpha 0.36 practice dodge feedback respects collisions, protection, feedback gap, reset and score isolation',()=>{
 const g=loadGame({stored:'1000',journalStored:journalData('survivor')});const saved=g.journalSaved();g.startTraining('pierce',false,'spitter');g.p.fireClock=999;assert.equal(g.hurtPlayer(12,'spitter-shot'),false);assert.equal(g.practiceSnapshot().threats,1);assert.equal(g.practiceSnapshot().lastThreat,'spitter-shot');g.hurtPlayer(12,'spitter-shot');assert.equal(g.practiceSnapshot().threats,1);near(g.p.hp,100);assert.equal(g.state.hitsTaken,0);near(g.state.damageTaken,0);g.pause();g.hurtPlayer(12);g.update(100);assert.equal(g.practiceSnapshot().threats,1);g.resume();g.setup({elapsed:1});g.dash();g.hurtPlayer(12);assert.equal(g.practiceSnapshot().threats,1);g.p.inv=0;g.setup({elapsed:2});g.hurtPlayer(-1);g.hurtPlayer(NaN);assert.equal(g.practiceSnapshot().threats,1);g.hurtPlayer(10,'unknown');assert.equal(g.practiceSnapshot().threats,2);assert.equal(g.practiceSnapshot().lastThreat,'contact');g.pause();quitForTest(g);assert.equal(g.state.runResult.practice.threats,2);assert.match(g.runReportText(),/Would-be hits: 2/);assert.equal(g.journalSaved(),saved);assert.equal(g.saved(),'1000');g.el('again').click();assert.equal(g.practiceSnapshot().threats,0);g.pause();quitForTest(g);g.el('changeSurvivor').click();g.el('deploy').click();g.hurtPlayer(12,'spitter-shot');assert.equal(g.state.hitsTaken,1);near(g.p.hp,88);
});
test('Alpha 0.36 real Spitter shots feed practice hit feedback and target resets clear it',()=>{
 const g=loadGame();g.startTraining('pierce',false,'spitter');g.p.fireClock=999;const e=g.state.enemies.find(e=>e.spitter);Object.assign(e,{x:100,y:0,cooldown:0});for(let i=0;i<600;i++)g.update(1/60);assert.ok(g.practiceSnapshot().threats>0);near(g.p.hp,100);assert.equal(g.state.hitsTaken,0);g.pause();g.el('trainingReset').click();assert.equal(g.practiceSnapshot().threats,0);
});

test('Alpha 0.36 pace chart records actual kills and HP lost in bounded immutable minute buckets',()=>{
 const g=loadGame();cleanRun(g);g.setup({elapsed:59});g.hitEnemy(enemy({hp:1}),10);g.hitEnemy(enemy({hp:1}),10);g.hurtPlayer(12,'contact');g.setup({elapsed:60});g.p.inv=0;g.p.armor=3;g.hurtPlayer(10,'spitter-shot');g.hitEnemy(enemy({hp:1}),10);const rows=g.paceSnapshot();assert.equal(rows.length,2);assert.equal(rows[0].kills,2);near(rows[0].hpLost,12);assert.equal(rows[1].kills,1);near(rows[1].hpLost,7);assert.ok(Object.isFrozen(rows)&&Object.isFrozen(rows[0]));g.pause();const before=JSON.stringify(g.paceSnapshot());g.update(100);assert.equal(JSON.stringify(g.paceSnapshot()),before);quitForTest(g);const r=g.state.runResult;assert.match(g.el('modal').innerHTML,/RUN PACE/);assert.match(g.pacePanel(r.pace),/viewBox="0 0 600 182"/);assert.match(g.runReportText(),/Minute 2: 1 eliminations · 7 HP lost/);const next=loadGame({journalStored:g.journalSaved()});assert.equal(next.state.journal.history[0].pace[1].hpLost,7);g.el('again').click();assert.equal(g.paceSnapshot()[0].kills,0);near(r.pace[0].hpLost,12);g.setup({elapsed:60*90});g.hitEnemy(enemy({hp:1}),10);assert.equal(g.paceSnapshot().length,60);assert.equal(g.paceSnapshot()[0].minute,31);assert.equal(g.paceSnapshot()[59].kills,1);
});
test('Alpha 0.36 pace parsing rejects hostile/legacy values and excludes practice',()=>{
 const g=loadGame({journalStored:journalData('survivor',{history:[{outcome:'defeated',time:180,pace:[{minute:0,kills:'<img>',hpLost:0},{minute:1,kills:3,hpLost:-5},{minute:2,kills:7,hpLost:12},{minute:2,kills:8,hpLost:12},{minute:99,kills:2,hpLost:1}]},{outcome:'defeated',time:20}]})});assert.equal(g.state.journal.history[0].pace.length,1);assert.equal(g.state.journal.history[0].pace[0].kills,7);assert.equal(g.state.journal.history[1].pace,null);assert.doesNotMatch(g.pacePanel(g.state.journal.history[0].pace),/<img|NaN|Infinity/);g.startTraining('pierce');g.hitEnemy(g.state.enemies[0],1000);g.hurtPlayer(10);assert.equal(g.currentRunStats().pace,null);assert.equal(g.practiceSnapshot().targets,1);g.pause();quitForTest(g);assert.equal(g.runReportText().includes('RUN PACE (active minutes'),false);assert.equal(g.state.journal.history.length,2);
});

test('Alpha 0.36 saved-run review freezes a validated snapshot and preserves filters, powers and records',()=>{
 const g=loadGame();cleanRun(g);g.setup({elapsed:65});g.hitEnemy(enemy({hp:1}),20);g.pause();quitForTest(g);const result=g.state.runResult,saved=g.journalSaved(),power=JSON.stringify(g.p),best=g.saved();g.showJournal();g.setJournalView('route','downtown');const old=g.el('savedRunOpen');g.el('savedRunPick').value='0';old.click();assert.equal(g.state.mode,'review');assert.match(g.el('modal').innerHTML,/RUN REVIEW/);assert.match(g.el('modal').innerHTML,/RUN PACE/);assert.ok(Object.isFrozen(g.state.reviewedRun)&&Object.isFrozen(g.state.reviewedRun.pace[0]));const view=g.el('modal').innerHTML,time=g.state.elapsed,draws=g.drawCount();g.update(100);g.frame(100000);assert.equal(g.drawCount(),draws);near(g.state.elapsed,time);assert.equal(JSON.stringify(g.p),power);assert.equal(g.state.runResult,result);assert.equal(g.journalSaved(),saved);assert.equal(g.saved(),best);g.el('reviewBack').click();assert.equal(g.state.mode,'journal');assert.equal(g.state.journalView.route,'downtown');assert.equal(g.state.reviewedRun,null);old.click();assert.equal(g.state.mode,'journal');assert.equal(g.journalSaved(),saved);
});
test('Alpha 0.36 saved review rejects invalid indexes and handles older incomplete runs safely',()=>{
 const raw=journalData('survivor',{history:[{outcome:'defeated',time:20},{outcome:'extracted',time:180,route:'<img>',pace:[{minute:0,kills:1,hpLost:0}]}]});const g=loadGame({journalStored:raw});g.showJournal();const before=g.el('modal').innerHTML;for(const index of [-1,1.5,99,NaN,'0'])g.showSavedRun(index);assert.equal(g.el('modal').innerHTML,before);g.showSavedRun(0);assert.equal(g.state.mode,'review');assert.match(g.el('modal').innerHTML,/Unavailable|unavailable|Not recorded/);assert.doesNotMatch(g.el('modal').innerHTML,/undefined|NaN|<img/);g.el('reviewBack').click();g.showSavedRun(1);assert.match(g.el('modal').innerHTML,/RUN PACE/);assert.doesNotMatch(g.el('modal').innerHTML,/<img|undefined/);assert.equal(g.journalSaved(),raw);
});

test('Alpha 0.36 pace includes green-door utility eliminations exactly once',()=>{
 const g=loadGame();prepareExit(g);reachExit(g);g.setup({enemies:[enemy({x:g.p.x+40,y:g.p.y,hp:10})]});chooseExitForTest(g,'stay');while(g.state.mode==='upgrade')g.choose(0);assert.equal(g.state.killCount,1);assert.equal(g.paceSnapshot().reduce((sum,b)=>sum+b.kills,0),1);g.pause();quitForTest(g);assert.equal(g.state.runResult.pace.reduce((sum,b)=>sum+b.kills,0),g.state.runResult.kills);
});
test('Alpha 0.36 native Market Courier run combines tools, weapon supports, pace records and isolated training',()=>{
 const g=loadGame({seed:0x360036,preferencesStored:JSON.stringify({version:1,reduced:true,mirrored:true,aim:true,favored:'arc'})});g.showRoster();g.selectRoute('market');g.selectSurvivor('courier');g.selectContract('resupply');g.start();near(g.dashCooldown(),2.25);Object.assign(g.p,{inv:9999,damage:100,pierce:3,arc:3,blades:3,molotov:3,rail:true,thunder:true,reaper:true,wildfire:true,proj:3,fire:.12});g.opts.find(o=>o.name==='Arc Relay').apply();g.opts.find(o=>o.name==='Blade Reach').apply();
 const settle=()=>{while(g.state.mode==='upgrade')g.choose(0);if(g.state.mode==='extraction')chooseExitForTest(g,'stay');while(g.state.mode==='upgrade')g.choose(0)};
 for(let i=0;i<240*30;i++){settle();if(g.state.locker&&!g.state.lockersUsed){g.p.x=g.state.locker.x;g.p.y=g.state.locker.y;g.pause();g.showLocker();g.takeLocker('reroll');assert.equal(g.state.mode,'paused');g.resume()}if(g.state.exitBeacon){const from={x:g.p.x,y:g.p.y};g.p.x=g.state.exitBeacon.x;g.p.y=g.state.exitBeacon.y;g.updateExtractionArrival(from);settle()}g.touch.x=Math.cos(i/90)*.6;g.touch.y=Math.sin(i/90)*.6;if(i%90===0)g.dash();g.update(1/30);if(i%90===0){settle();assert.equal(g.state.mode,'play');assert.ok(g.state.enemies.length<=240);assert.ok(g.state.particles.length<=120);assert.ok(g.state.hostileShots.length<=12);assert.ok(g.state.lobberBombs.length<=1);g.render()}}
 settle();assert.equal(g.state.lockersUsed,1);assert.equal(g.state.contractCompleted,true);assert.ok(g.state.overtime>0);g.pause();quitForTest(g);const r=g.state.runResult;assert.equal(r.route,'market');assert.equal(r.survivor,'courier');assert.equal(r.arcRelay,true);assert.equal(r.bladeReach,true);assert.equal(r.pace.reduce((sum,b)=>sum+b.kills,0),r.kills);near(r.pace.reduce((sum,b)=>sum+b.hpLost,0),r.damageTaken);assert.equal(Object.values(r.weapons).reduce((sum,b)=>sum+b.kills,0),r.kills);const saved=g.journalSaved(),best=g.saved();g.showJournal();g.showSavedRun(0);assert.equal(g.state.mode,'review');assert.match(g.el('modal').innerHTML,/Market District|Courier/);g.el('reviewBack').click();g.el('journalBack').click();g.startTraining('arc',true,'howler');g.update(3);g.pause();quitForTest(g);assert.equal(g.journalSaved(),saved);assert.equal(g.saved(),best);const backup=g.backupText();assert.ok(backup.length<262144);assert.ok(g.parseBackup(backup));
});

test('Alpha 0.36 full sixty-minute charts across eight saved runs stay inside the backup budget',()=>{
 const g=loadGame();cleanRun(g);g.setup({elapsed:3600});g.pause();quitForTest(g);const packet=JSON.parse(g.backupText()),row=packet.journal.history[0];packet.journal.history=Array.from({length:8},()=>JSON.parse(JSON.stringify(row)));packet.journal.totals.runs=8;const text=JSON.stringify(packet);assert.ok(text.length<262144,text.length);const parsed=g.parseBackup(text);assert.equal(parsed.journal.history.length,8);for(const saved of parsed.journal.history){assert.equal(saved.pace.length,60);assert.equal(saved.pace[59].minute,60)}
});

// Alpha 0.37 — first-release scope and a clear first-run flow.
test('Alpha 0.37 home retains Play, Journal and Settings while secondary destinations are grouped',()=>{
 const g=loadGame(),markup=g.el('modal').innerHTML;assert.ok(markup.indexOf('id="start"')<markup.indexOf('id="runLog"'));assert.equal((markup.match(/id="start"/g)||[]).length,1);
 for(const id of ['trainingOpen','quickGuide','manualOpen','bestiaryOpen','weaponsOpen','backupOpen','artOpen','streetOpen'])assert.equal(g.el(id),undefined,id);
 for(const [id,mode] of [['start','roster'],['runLog','journal'],['settingsOpen','settings'],['previewsOpen','previews']]){const next=loadGame();next.el(id).click();assert.equal(next.state.mode,mode,id)}
});

test('Alpha 0.37 deployment preview stays current and shows base stats before optional setup',()=>{
 const g=loadGame();g.showRoster();const html=g.el('modal').innerHTML;assert.ok(html.indexOf('id="deploy"')<html.indexOf('id="survivorChoices"'));assert.ok(html.indexOf('id="deploy"')<html.indexOf('id="optionalSetup"'));assert.equal((html.match(/id="deploy"/g)||[]).length,1);assert.ok(!/<details[^>]*id="optionalSetup"[^>]*\bopen\b/.test(html));
 Object.assign(g.p,{hp:300,max:300,damage:400,armor:3});g.selectSurvivor('scout');g.selectRoute('market');g.selectRule('glass');g.selectContract('resupply');assert.match(g.el('deploymentSummary').textContent,/Scout · Market District · Glass Cannon · Field Resupply/);assert.match(g.el('deploymentStats').textContent,/68 HP · 245 movement · 21.6 gun damage/);near(g.p.hp,300);near(g.p.damage,400);g.el('deploy').click();assert.equal(g.state.mode,'play');near(g.p.hp,68);near(g.p.damage,21.6);assert.equal(g.p.armor,0);assert.equal(g.state.runRoute,'market');assert.equal(g.state.runRule,'glass');
});
test('Alpha 0.37 starter setup changes only explicit roster choices and preserves presets, records and comfort',()=>{
 const g=loadGame({stored:'1800',journalStored:journalData('courier',{totals:{runs:4,extractions:2},history:[{outcome:'extracted',time:1800,route:'market',survivor:'courier',rule:'iron'}]}),preferencesStored:JSON.stringify({version:1,mirrored:true,favored:'arc'})});g.showRoster();g.selectSurvivor('courier');g.selectRoute('market');g.selectRule('iron');g.selectContract('resupply');g.saveDeployment();const before=JSON.parse(g.journalSaved()),power=JSON.stringify(g.p);g.el('starterSetup').click();assert.equal(g.state.mode,'roster');assert.equal(g.state.selectedSurvivor,'survivor');assert.equal(g.state.selectedRoute,'downtown');assert.equal(g.state.selectedRule,'standard');assert.equal(g.state.selectedContract,'none');assert.equal(JSON.stringify(g.p),power);assert.equal(g.saved(),'1800');const after=JSON.parse(g.journalSaved());delete before.selected;delete after.selected;assert.deepEqual(after,before);assert.equal(g.state.preferences.mirrored,true);assert.equal(g.state.preferences.favored,'arc');assert.match(g.el('deploymentStats').textContent,/100 HP · 210 movement · 18 gun damage/);g.loadDeployment();assert.equal(g.state.selectedSurvivor,'courier');assert.equal(g.state.selectedRoute,'market');assert.equal(g.state.selectedRule,'iron');assert.equal(g.state.selectedContract,'resupply');assert.match(g.el('deploymentSummary').textContent,/Courier · Market District · Iron Horde · Field Resupply/);
});
test('Alpha 0.37 quick guide preserves roster choices and cannot activate on a stale release',()=>{
 const g=loadGame();g.showRoster();g.selectSurvivor('quartermaster');g.selectRoute('park');g.selectRule('iron');const saved=g.journalSaved();g.el('rosterGuide').dispatch('pointerdown',{pointerId:7});assert.equal(g.state.mode,'guide');assert.match(g.el('modal').innerHTML,/green gems|green XP/);assert.match(g.el('modal').innerHTML,/01:30/);assert.match(g.el('modal').innerHTML,/do not need to clear the ordinary horde/);g.el('guideBack').dispatch('pointerup',{pointerId:7});g.el('guideBack').click(1);assert.equal(g.state.mode,'guide');g.el('guideBack').click();assert.equal(g.state.mode,'roster');assert.equal(g.state.selectedSurvivor,'quartermaster');assert.equal(g.state.selectedRoute,'park');assert.equal(g.state.selectedRule,'iron');assert.equal(g.journalSaved(),saved);assert.match(g.el('deploymentSummary').textContent,/Quartermaster · Memorial Park · Iron Horde/);g.el('deploy').click();assert.equal(g.state.mode,'play');assert.equal(g.state.rerollsLeft,2);
});
test('Alpha 0.37 guide freezes paused play and returns to Pause until explicit Resume',()=>{
 const g=loadGame();cleanRun(g);g.p.dashCd=1;g.setup({enemies:[enemy({x:100,hp:100,speed:70})],elapsed:30});g.pause();g.el('pauseGuide').click();const snapshot=JSON.stringify({p:g.p,enemies:g.state.enemies,elapsed:g.state.elapsed});g.update(100);assert.equal(JSON.stringify({p:g.p,enemies:g.state.enemies,elapsed:g.state.elapsed}),snapshot);g.closeQuickGuide();assert.equal(g.state.mode,'paused');g.update(10);near(g.state.elapsed,30);g.resume();g.update(.01);assert.equal(g.state.mode,'play');assert.ok(g.state.elapsed>30);g.showQuickGuide();assert.equal(g.state.mode,'play');
});
test('Alpha 0.37 guide from results preserves the exact held sheet and never renders or logs again',()=>{
 const g=loadGame();cleanRun(g);g.setup({elapsed:80});g.pause();quitForTest(g);const result=g.state.runResult,sheet=g.el('modal').innerHTML,saved=g.journalSaved(),best=g.saved();g.el('endGuide').click();assert.equal(g.state.mode,'guide');const draws=g.drawCount(),time=g.state.elapsed;g.update(100);g.frame(100000);assert.equal(g.drawCount(),draws);near(g.state.elapsed,time);g.el('guideBack').click();assert.equal(g.state.mode,'end');assert.equal(g.state.runResult,result);assert.equal(g.el('modal').innerHTML,sheet);assert.equal(g.journalSaved(),saved);assert.equal(g.saved(),best);
});
test('Alpha 0.37 guide and starter navigation do not alter a seeded three-minute run',()=>{
 const a=loadGame(),b=loadGame();a.el('start').click();a.el('rosterGuide').click();a.el('guideBack').click();a.el('starterSetup').click();a.el('rosterGuide').click();a.el('guideBack').click();a.el('deploy').click();b.start();for(const g of [a,b])g.p.inv=9999;
 for(let i=0;i<180*30;i++){for(const g of [a,b]){while(g.state.mode==='upgrade')g.choose(0);g.touch.x=Math.cos(i/90)*.6;g.touch.y=Math.sin(i/90)*.6;if(i%90===0)g.dash();g.update(1/30)}if(i%90===0){assert.equal(JSON.stringify(a.p),JSON.stringify(b.p));assert.equal(JSON.stringify(a.state.enemies),JSON.stringify(b.state.enemies));near(a.state.elapsed,b.state.elapsed);near(a.state.xp,b.state.xp)}}assert.equal(a.state.killCount,b.state.killCount);assert.equal(a.state.bossesDefeated,b.state.bossesDefeated);
});

test('Alpha 0.37 starter setup respects hidden play and future/blocked storage while training guide is explicit',()=>{
 const raw=JSON.stringify({version:99,selected:'courier',history:[{outcome:'extracted',time:1800}]});const g=loadGame({journalStored:raw});g.showRoster();g.selectSurvivor('courier');g.selectRoute('market');g.selectRule('iron');g.document.hidden=true;g.useStarterSetup();assert.equal(g.state.selectedSurvivor,'courier');g.document.hidden=false;g.useStarterSetup();assert.equal(g.state.selectedSurvivor,'survivor');assert.equal(g.journalSaved(),raw);assert.equal(g.state.journal.readOnly,true);const blocked=loadGame({storageBlocked:true});blocked.showRoster();blocked.selectSurvivor('courier');blocked.useStarterSetup();assert.equal(blocked.state.selectedSurvivor,'survivor');assert.equal(blocked.state.journal.available,false);blocked.el('rosterBack').click();blocked.startTraining('pierce');blocked.pause();blocked.showQuickGuide();assert.match(blocked.el('modal').innerHTML,/unscored Training session has no timed street encounters/);blocked.closeQuickGuide();assert.equal(blocked.state.mode,'paused');
});

// Alpha 0.38 — evidence for the combat/XP milestone, without changing rewards.
for(const evolution of [{weapon:'pierce',name:'Piercing Rounds',evolve:'Railstorm'},{weapon:'arc',name:'Chain Lightning',evolve:'Thunderweb'},{weapon:'blades',name:'Orbiting Blades',evolve:'Reaper Ring'},{weapon:'molotov',name:'Molotov',evolve:'Wildfire'}])test(`Alpha 0.38 ${evolution.weapon} records chosen rank/evolution times and XP versus bonus upgrades`,()=>{
 const g=loadGame();cleanRun(g);g.p.fireClock=9999;
 for(let rank=1;rank<=3;rank++){
  g.setup({elapsed:rank*5,gems:[{x:g.p.x,y:g.p.y,value:g.state.nextXp}]});g.update(.01);assert.equal(g.state.mode,'upgrade');
  const before=g.buildProgressSnapshot();assert.equal(before.xpChoices,rank-1);assert.equal(before.paths[evolution.weapon].ranks[rank-1],null);
  g.advanceClock(15000);g.update(100);fixtureOfferedUpgrade(g,evolution.name);chooseNamed(g,evolution.name);
  near(g.buildProgressSnapshot().paths[evolution.weapon].ranks[rank-1],rank*5+.01);
 }
 g.setup({elapsed:25,bonusChoices:1});g.checkLevelUp();const requirement=g.state.nextXp;fixtureOfferedUpgrade(g,'Evolve: '+evolution.evolve);chooseNamed(g,'Evolve: '+evolution.evolve);
 const row=g.buildProgressSnapshot();near(row.firstChoice,5.01);assert.equal(row.xpChoices,3);assert.equal(row.bonusChoices,1);assert.equal(row.collected,8+15+24);assert.equal(row.nextXp,requirement);near(row.paths[evolution.weapon].evolution,25);
 assert.ok(Object.isFrozen(row)&&Object.isFrozen(row.paths)&&Object.isFrozen(row.paths[evolution.weapon])&&Object.isFrozen(row.paths[evolution.weapon].ranks));
 g.pause();assert.match(g.buildSheet(),/3 from XP · 1 bonus/);quitForTest(g);const r=g.state.runResult;assert.match(g.el('modal').innerHTML,/BUILD PROGRESSION/);assert.match(g.runReportText(),/First upgrade chosen: 00:05/);assert.match(g.runReportText(),/3 from XP · 1 bonus/);assert.equal(r.progression.paths[evolution.weapon].evolution,25);
 const next=loadGame({journalStored:g.journalSaved()});assert.deepEqual(JSON.parse(JSON.stringify(next.state.journal.history[0].progression)),JSON.parse(JSON.stringify(row)));next.showJournal();next.showSavedRun(0);assert.match(next.el('modal').innerHTML,/BUILD PROGRESSION/);const saved=next.journalSaved();next.frame(100000);assert.equal(next.journalSaved(),saved);
 const backup=g.parseBackup(g.backupText());assert.equal(backup.journal.history[0].progression.collected,47);g.el('again').click();assert.equal(g.buildProgressSnapshot().firstChoice,null);assert.equal(g.buildProgressSnapshot().collected,0);assert.equal(r.progression.paths[evolution.weapon].evolution,25);
});
test('Alpha 0.38 pickup and supply recovery count earned XP once and leave remote street XP visible',()=>{
 const g=loadGame();cleanRun(g);g.p.fireClock=9999;g.setup({gems:[{x:0,y:0,value:1},{x:300,y:0,value:4},{x:1000,y:0,value:7}]});g.update(.01);assert.equal(g.buildProgressSnapshot().collected,1);assert.equal(g.buildProgressSnapshot().onStreet,11);
 g.setup({supplyDrop:utilityDrop({x:0,phase:'ready',readyAt:0})});g.updateDrops(.01,g.p);g.updateDrops(.01,g.p);const row=g.buildProgressSnapshot();assert.equal(row.collected,5);assert.equal(row.onStreet,7);assert.equal(row.xp,5);assert.equal(g.state.dropXpRecovered,4);assert.equal(row.xpChoices,0);
 g.pause();g.update(100);assert.equal(JSON.stringify(g.buildProgressSnapshot()),JSON.stringify(row));quitForTest(g);const held=g.state.runResult.progression;assert.equal(held.onStreet,7);g.setup({gems:[]});assert.equal(held.onStreet,7);assert.match(g.runReportText(),/XP collected: 5 · XP still on the street: 7/);
});
test('Alpha 0.38 rerolls and stale or carried touches never record an upgrade choice',()=>{
 const g=loadGame();cleanRun(g);earnUpgrade(g);const stale=g.choices()[0];g.choose(0);const first=JSON.stringify(g.buildProgressSnapshot());stale.onclick();assert.equal(JSON.stringify(g.buildProgressSnapshot()),first);earnUpgrade(g);const before=JSON.stringify(g.buildProgressSnapshot());g.el('rerollUpgrade').click();assert.equal(JSON.stringify(g.buildProgressSnapshot()),before);const button=g.choices()[0];button.dispatch('pointerup',{pointerId:1});assert.equal(JSON.stringify(g.buildProgressSnapshot()),before);g.choose(0);assert.equal(g.buildProgressSnapshot().xpChoices,2);
});
test('Alpha 0.38 progression parser rejects hostile counters and invalid, reversed or oversized timing data',()=>{
 const g=loadGame();cleanRun(g);const row=JSON.parse(JSON.stringify(g.buildProgressSnapshot()));
 for(const key of ['collected','xpChoices','bonusChoices','xp','nextXp','onStreet'])for(const value of ['<img>',-1,Infinity,NaN,1.2,1e12])assert.equal(g.cleanBuildProgress({...row,[key]:value},30),null);
 assert.equal(g.cleanBuildProgress({...row,nextXp:0},30),null);assert.equal(g.cleanBuildProgress(null,30),null);assert.equal(g.cleanBuildProgress([],30),null);
 const bad={...row,firstChoice:5,paths:{pierce:{ranks:[5,4,20],evolution:21},arc:{ranks:[6,10,31],evolution:32},blades:{ranks:[7,8,9],evolution:8},molotov:{ranks:['<img>',10,15],evolution:'<img>'},unknown:{ranks:Array(1000).fill(1)}}};
 const clean=g.cleanBuildProgress(bad,30);assert.equal(JSON.stringify(clean.paths.pierce.ranks),'[5,null,null]');assert.equal(JSON.stringify(clean.paths.arc.ranks),'[6,10,null]');assert.equal(clean.paths.blades.evolution,null);assert.equal(clean.paths.molotov.ranks[0],null);assert.equal(Object.keys(clean.paths).length,4);assert.doesNotMatch(g.buildProgressPanel(clean),/<img|undefined|NaN|Infinity/);
 const old=loadGame({journalStored:journalData('survivor',{history:[{outcome:'defeated',time:30},{outcome:'defeated',time:30,progression:bad}]})});assert.equal(old.state.journal.history[0].progression,null);old.showJournal();old.showSavedRun(0);assert.match(old.el('modal').innerHTML,/Build progression unavailable/);assert.doesNotMatch(old.el('modal').innerHTML,/<img|undefined|NaN/);
});
test('Alpha 0.38 practice excludes progression data and blocked storage still holds a measured normal result',()=>{
 const g=loadGame({storageBlocked:true});cleanRun(g);earnUpgrade(g);g.choose(0);g.pause();quitForTest(g);assert.equal(g.state.runResult.progression.xpChoices,1);assert.equal(g.state.journal.available,false);g.startTraining('arc',true,'spitter');assert.equal(g.buildProgressSnapshot(),null);g.update(1);g.pause();assert.doesNotMatch(g.buildSheet(),/toward next XP upgrade/);quitForTest(g);assert.equal(g.state.runResult.progression,null);assert.doesNotMatch(g.el('modal').innerHTML,/BUILD PROGRESSION/);assert.doesNotMatch(g.runReportText(),/BUILD PROGRESSION/);g.el('changeSurvivor').click();g.el('deploy').click();assert.equal(g.buildProgressSnapshot().xpChoices,0);
});

// Alpha 0.39 — optional phone measurements and less offscreen XP drawing.
function startMeasurement(g){g.pause();g.showSettings();g.el('perfToggle').click();assert.equal(g.state.diagnostics.enabled,true);g.closeSettings();g.resume()}
test('Alpha 0.39 diagnostics default off, are session-only, and do not rewrite preferences or records',()=>{
 for(const options of [{},{storageBlocked:true},{preferencesStored:JSON.stringify({version:99})}]){
  const g=loadGame(options),prefs=g.preferencesSaved(),saved=g.journalSaved();assert.equal(g.state.diagnostics.enabled,false);g.frame(16);assert.equal(g.performanceSnapshot().frames,0);assert.equal(g.el('performanceHud').style.display,'none');g.showSettings();assert.match(g.el('modal').innerHTML,/PHONE PERFORMANCE · OFF/);g.el('perfToggle').click();assert.equal(g.state.diagnostics.enabled,true);assert.equal(g.preferencesSaved(),prefs);assert.equal(g.journalSaved(),saved);g.el('settingsBack').click();g.showRoster();g.start();assert.equal(g.state.diagnostics.enabled,true);assert.equal(g.performanceSnapshot().frames,0);
 }
 assert.equal(loadGame().state.diagnostics.enabled,false);
});
test('Alpha 0.39 raw frame intervals expose stalls while the simulation retains its 35ms cap',()=>{
 const g=loadGame();cleanRun(g);startMeasurement(g);g.frame(16);g.frame(32);g.frame(132);const row=g.performanceSnapshot();assert.equal(row.frames,2);near(row.seconds,.116);near(row.recentFps,2000/116);near(row.p95Ms,100);near(row.maxMs,100);assert.equal(row.slowFrames,1);near(g.state.elapsed,.016+.016+.035);assert.equal(g.el('performanceHud').style.display,'block');assert.match(g.el('performanceHud').textContent,/enemies.*XP gems/);
});
test('Alpha 0.39 Pause, upgrade reading, backgrounding and resize do not become false frame stalls',()=>{
 const g=loadGame();cleanRun(g);startMeasurement(g);g.frame(16);g.frame(32);assert.equal(g.performanceSnapshot().frames,1);g.pause();g.frame(100000);const time=g.state.elapsed;g.resume();g.frame(100016);g.frame(100032);assert.equal(g.performanceSnapshot().frames,2);near(g.state.elapsed,time+.032);g.setup({xp:8});g.checkLevelUp();g.frame(200000);g.choose(0);g.frame(210000);g.frame(210016);assert.equal(g.performanceSnapshot().frames,3);
 g.document.hidden=true;g.event('visibilitychange');g.frame(300000);assert.equal(g.state.mode,'paused');g.resume();assert.equal(g.state.mode,'paused');g.document.hidden=false;g.event('visibilitychange');g.resume();g.frame(310000);g.frame(310016);assert.equal(g.performanceSnapshot().frames,4);g.event('resize');g.frame(400000);g.frame(400016);assert.equal(g.performanceSnapshot().frames,5);near(g.performanceSnapshot().maxMs,16);assert.equal(g.performanceSnapshot().slowFrames,0);
});
test('Alpha 0.39 performance samples stay bounded and report observed scene peaks without retaining entities',()=>{
 const g=loadGame();cleanRun(g);startMeasurement(g);g.recordPerformanceFrame(0);g.setup({enemies:Array.from({length:5},()=>enemy()),gems:Array.from({length:20000},()=>({x:9999,y:9999,value:1,r:7}))});for(let i=1;i<=1000;i++)g.recordPerformanceFrame(i*16);const row=g.performanceSnapshot();assert.equal(row.frames,1000);assert.equal(row.recentFrames,300);assert.equal(g.state.diagnostics.samples.length,300);near(row.p95Ms,16);near(row.averageFps,62.5);assert.equal(row.peaks.enemies,5);assert.equal(row.peaks.xpGems,20000);g.setup({enemies:[],gems:[]});const later=g.performanceSnapshot();assert.equal(later.counts.enemies,0);assert.equal(later.peaks.enemies,5);assert.ok(Object.isFrozen(row)&&Object.isFrozen(row.counts)&&Object.isFrozen(row.peaks));assert.ok(JSON.stringify(g.state.diagnostics).length<3000);
});
for(const context of ['menu','paused','end'])test(`Alpha 0.39 benchmark report holds ${context} capture, safe notes, downloads and return context`,async()=>{
 const g=loadGame();if(context!=='menu'){cleanRun(g);startMeasurement(g);g.frame(16);g.frame(32);g.pause();if(context==='end')quitForTest(g)}const result=g.state.runResult,saved=g.journalSaved(),prefs=g.preferencesSaved();g.showSettings();g.el('perfReport').click();assert.equal(g.state.mode,'benchmark');const row=g.state.benchmarkCapture.row;assert.ok(Object.isFrozen(g.state.benchmarkCapture)&&Object.isFrozen(row));const time=g.state.elapsed,draws=g.drawCount();g.el('benchmarkDevice').value='S21 Ultra · Brave <img>';g.el('benchmarkNotes').value='Warm phone; two brief hitches';g.el('benchmarkNotes').dispatch('input');const text=g.el('benchmarkText').value;assert.match(text,/ALPHA 0.85 PHONE BENCHMARK/);assert.match(text,/S21 Ultra · Brave <img>/);assert.match(text,/Warm phone/);assert.doesNotMatch(g.el('modal').innerHTML,/S21 Ultra · Brave <img>/);g.frame(999999);near(g.state.elapsed,time);assert.equal(g.drawCount(),draws);assert.equal(g.state.benchmarkCapture.row,row);g.el('benchmarkDownload').click();assert.equal(await g.downloads()[0].text(),text);assert.equal(g.journalSaved(),saved);assert.equal(g.preferencesSaved(),prefs);g.el('benchmarkBack').click();assert.equal(g.state.mode,'settings');assert.equal(g.state.benchmarkCapture,null);g.el('settingsBack').click();assert.equal(g.state.mode,context);assert.equal(g.state.runResult,result);if(context==='paused'){g.update(10);near(g.state.elapsed,time)}
});
test('Alpha 0.39 reset, stop and fresh deployment have clear measurement lifetimes including practice',()=>{
 const g=loadGame();cleanRun(g);startMeasurement(g);g.recordPerformanceFrame(0);g.recordPerformanceFrame(100);g.pause();g.showSettings();g.el('perfToggle').click();assert.equal(g.state.diagnostics.enabled,false);assert.equal(g.performanceSnapshot().frames,1);g.recordPerformanceFrame(10000);assert.equal(g.performanceSnapshot().frames,1);g.el('perfReset').click();assert.equal(g.performanceSnapshot().frames,0);assert.equal(g.state.diagnostics.enabled,false);g.el('perfReport').click();assert.match(g.benchmarkText(),/Unavailable/);assert.doesNotMatch(g.benchmarkText(),/NaN|Infinity/);g.el('benchmarkBack').click();g.el('perfToggle').click();g.closeSettings();g.resume();g.recordPerformanceFrame(0);g.recordPerformanceFrame(100);g.pause();quitForTest(g);g.startTraining('arc',true,'spitter');assert.equal(g.state.diagnostics.enabled,true);assert.equal(g.performanceSnapshot().frames,0);g.recordPerformanceFrame(0);g.recordPerformanceFrame(16);g.pause();g.showSettings();g.el('perfReport').click();assert.match(g.benchmarkText(),/Training · unscored/);assert.equal(g.state.hitsTaken,0);
});
test('Alpha 0.39 gem culling skips 10000 offscreen paths, keeps native edge margins, and preserves all XP in both scenery styles',()=>{
 for(const scenery of ['street','classic']){const g=loadGame({traceCanvas:true,preferencesStored:JSON.stringify({version:1,scenery})});cleanRun(g);const visible=[{x:0,y:0,r:7,value:1},{x:-40,y:0,r:11,value:20},{x:452,y:955,r:7,value:4}],hidden=Array.from({length:10000},(_,i)=>({x:10000+i,y:10000,r:7,value:4}));g.setup({gems:[...visible,...hidden]});const refs=[...g.state.gems],values=JSON.stringify(g.state.gems);g.clearTrace();g.renderGems(0,0);const draw=g.drawingTrace();assert.equal(draw.filter(r=>r[0]==='beginPath').length,scenery==='street'?1:3);assert.equal(draw.filter(r=>r[0]==='fill').length,scenery==='street'?1:3);assert.equal(draw.filter(r=>r[0]==='moveTo').length,3);assert.equal(draw.some(r=>r[0]==='set'&&r[1]==='shadowBlur'&&r[2]===12),scenery==='classic');assert.equal(JSON.stringify(g.state.gems),values);assert.equal(g.state.gems.length,10003);assert.equal(g.state.gems[2],refs[2]);g.p.fireClock=9999;g.setup({gems:[hidden[0]]});g.p.x=hidden[0].x;g.p.y=hidden[0].y;g.update(.01);assert.equal(g.state.xp,4);assert.equal(g.state.gems.length,0);
}
});
test('Alpha 0.39 measurement enabled or disabled leaves a seeded frame-driven run identical',()=>{
 const runs=[];for(const enabled of [false,true]){const g=loadGame({seed:390039});cleanRun(g);if(enabled)startMeasurement(g);for(let i=1;i<=600;i++){g.touch.x=Math.cos(i/70);g.touch.y=Math.sin(i/70);g.frame(i*16)}runs.push(JSON.stringify({p:g.p,time:g.state.elapsed,xp:g.state.xp,kills:g.state.killCount,enemies:g.state.enemies,gems:g.state.gems,bullets:g.state.bullets}));assert.equal(g.performanceSnapshot().frames,enabled?599:0)}assert.equal(runs[0],runs[1]);
});

// Alpha 0.40 — proposed presentation stays inside an explicit unscored sample.
function enterArt(g,drill='artStreet'){g.openHomeEntry('artOpen');assert.equal(g.state.mode,'art-menu');g.advanceClock(500);g.el(drill).dispatch('pointerdown',{pointerId:77,clientX:50,clientY:50});g.el(drill).dispatch('pointerup',{pointerId:77,clientX:50,clientY:50});assert.equal(g.state.training,true);assert.equal(g.state.artSession,true);assert.equal(g.sampleLookActive(),true)}
test('Alpha 0.40 sample menu draws the shared board and freezes the world without changing records',()=>{
 const g=loadGame({traceCanvas:true,stored:'123',journalStored:journalData('scout')});const saved=g.journalSaved(),prefs=g.preferencesSaved();g.openHomeEntry('artOpen');assert.equal(g.state.mode,'art-menu');assert.match(g.el('modal').innerHTML,/LAST LIGHT|unscored|Unscored/);const trace=g.drawingTrace('artBoard');assert.ok(trace.some(r=>r[0]==='fillText'&&r[1]==='RUNNER'));assert.ok(trace.some(r=>r[0]==='fillText'&&r[1]==='BREAKER'));const count=g.drawCount();g.frame(10000);assert.equal(g.drawCount(),count);assert.equal(g.state.elapsed,0);assert.equal(g.journalSaved(),saved);assert.equal(g.preferencesSaved(),prefs);g.el('artBack').click();g.el('previewsBack').click();assert.equal(g.state.mode,'menu');assert.equal(g.state.artSession,false);
});
for(const drill of ['artStreet','artBreaker'])test(`Alpha 0.40 ${drill} is actual isolated practice with a presentation-only comparison`,()=>{
 const g=loadGame({stored:'123',journalStored:journalData('scout'),traceCanvas:true}),saved=g.journalSaved();enterArt(g,drill);assert.equal(g.state.trainingScenario,drill==='artBreaker'?'breaker':'targets');if(drill==='artBreaker')assert.equal(g.state.activeBoss.bossKind,'breaker');else assert.equal(g.state.enemies.filter(e=>e.trainingDummy).length,4);
 const stats=JSON.stringify(g.p),enemies=JSON.stringify(g.state.enemies),time=g.state.elapsed;g.pause();g.el('sampleCompare').click();assert.equal(g.state.mode,'paused');assert.equal(g.sampleLookActive(),false);assert.equal(JSON.stringify(g.p),stats);assert.equal(JSON.stringify(g.state.enemies),enemies);g.update(10);assert.equal(g.state.elapsed,time);g.el('sampleCompare').click();assert.equal(g.sampleLookActive(),true);assert.equal(g.state.mode,'paused');quitForTest(g);assert.equal(g.state.runResult.training,true);assert.equal(g.saved(),'123');assert.equal(g.journalSaved(),saved);g.el('again').click();assert.equal(g.state.artSession,true);assert.equal(g.sampleLookActive(),true);g.pause();quitForTest(g);g.el('changeSurvivor').click();g.el('deploy').click();assert.equal(g.state.training,false);assert.equal(g.state.artSession,false);assert.equal(g.sampleLookActive(),false);assert.equal(g.state.runSurvivor,'scout');
});
test('Alpha 0.40 sample and Classic practice have identical live Breaker motion, hits and weapon results',()=>{
 const outcomes=[];for(const preview of [false,true]){const g=loadGame({seed:400040});g.startTraining('pierce',false,'breaker',preview);for(let i=0;i<600;i++){g.touch.x=Math.cos(i/70);g.touch.y=Math.sin(i/70);g.update(1/60);if(i%30===0)g.render()}outcomes.push(JSON.stringify({p:g.p,time:g.state.elapsed,enemies:g.state.enemies,practice:g.practiceSnapshot(),kills:g.state.killCount,xp:g.state.xp}));assert.equal(g.state.bossesDefeated,0)}assert.equal(outcomes[0],outcomes[1]);
});
test('Alpha 0.40 shared sample art preserves enemy objects, hit radii and boss-warning geometry',()=>{
 const g=loadGame({traceCanvas:true});g.startTraining('pierce',false,'breaker',true);const e=g.state.activeBoss,before=JSON.stringify(e);g.clearTrace();g.renderEnemy(e);assert.equal(JSON.stringify(e),before);assert.ok(g.drawingTrace().some(r=>r[0]==='ellipse'));assert.equal(g.sampleEnemyKind({...g.enemyArt.runner}),'runner');for(const id of ['riot','spitter','lobber','howler','hunter','warden','harvester'])assert.equal(g.sampleEnemyKind(g.enemyArt[id]),null);g.clearTrace();const values=JSON.stringify(g.state.enemies);g.paintSampleStreet(g.el('game').getContext('2d'),-200,-400,412,915);assert.equal(JSON.stringify(g.state.enemies),values);assert.ok(g.drawingTrace().length<4000);
});
test('Alpha 0.40 proposed cues obey mute/hidden state and bound their audio voices with cleanup',()=>{
 const g=loadGame();g.openHomeEntry('artOpen');const created=[];const ctx={currentTime:0,state:'running',destination:{},createGain(){return{gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}}},createOscillator(){const o={frequency:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){o.disconnected=true},start(){},stop(){}};created.push(o);return o}};
 g.setSampleAudio(ctx,false);g.sampleSound('gun');assert.equal(created.length,0);g.setSampleAudio(ctx,true);g.document.hidden=true;g.sampleSound('gun');assert.equal(created.length,0);g.document.hidden=false;for(let i=0;i<20;i++)g.sampleSound('gun');assert.equal(created.length,6);assert.equal(g.state.sampleAudioVoices,6);for(const o of created)o.onended();assert.equal(g.state.sampleAudioVoices,0);assert.ok(created.every(o=>o.disconnected));assert.equal(g.sampleCuePlan('unknown'),null);g.sampleSound('warning');assert.equal(created.length,8);g.el('artBack').click();g.el('previewsBack').click();const count=created.length;g.sampleSound('gun');assert.equal(created.length,count);
});

// Alpha 0.41 — higher-fidelity assets and removal of the cannon-like overlay.
test('Alpha 0.41 embedded PNGs match source files and crop rectangles remain within original atlases',()=>{
 const data=JSON.parse(html.match(/<script id="sampleAssets" type="application\/json">([\s\S]*?)<\/script>/)[1]);const manifest=JSON.parse(readFileSync(join(__dirname,'../dist/assets/manifest.json'),'utf8'));let bytes=0;
 for(const id of ['survivor','street','enemies']){const row=data[id],png=readFileSync(join(__dirname,'../dist',manifest.assets[id].file)),runtime=readFileSync(join(__dirname,'../dist',row.file));assert.equal(row.src,'data:image/'+(row.file.endsWith('.webp')?'webp':'png')+';base64,'+runtime.toString('base64'));assert.equal(require('node:crypto').createHash('sha256').update(png).digest('hex'),manifest.assets[id].sha256);assert.equal(png.subarray(1,4).toString(),'PNG');assert.equal(png.readUInt32BE(16),row.width);assert.equal(png.readUInt32BE(20),row.height);for(const [x,y,w,h] of row.frames){assert.ok(x>=0&&y>=0&&w>0&&h>0&&x+w<=row.width&&y+h<=row.height)}assert.equal(JSON.stringify(row.frames),JSON.stringify(manifest.assets[id].frames));bytes+=png.length}
 assert.equal(data.survivor.frames.length,3);assert.equal(data.enemies.frames.length,4);assert.equal(new Set(data.survivor.frames.map(f=>f[3])).size,1);assert.ok(bytes<8*1024*1024);assert.ok(html.length<12*1024*1024);
});
test('Alpha 0.41 sample waits for artwork, caches images during comparison, and releases references on Main',()=>{
 const g=loadGame({artworkStatus:'pending'});g.openHomeEntry('artOpen');assert.equal(g.sampleArtworkReady(),false);assert.equal(g.el('artStreet').disabled,true);g.advanceClock(500);g.el('artStreet').dispatch('pointerdown',{pointerId:1});g.el('artStreet').dispatch('pointerup',{pointerId:1});assert.equal(g.state.mode,'art-menu');assert.equal(g.pendingImages.length,3);g.resolveArtwork();assert.equal(g.sampleArtworkReady(),true);assert.equal(g.el('artStreet').disabled,false);assert.match(g.el('artAssetStatus').textContent,/ready/);g.ensureSampleArtwork();assert.equal(g.pendingImages.length,3);g.el('artBack').click();g.el('previewsBack').click();assert.equal(Object.keys(g.state.sampleArtwork).length,0);assert.ok(g.pendingImages.every(im=>im.onload===null&&im.onerror===null));
 const failed=loadGame({artworkStatus:'error'});failed.openHomeEntry('artOpen');assert.equal(failed.sampleArtworkReady(),false);assert.match(failed.el('artAssetStatus').textContent,/could not load/);assert.equal(failed.el('artBreaker').disabled,true);failed.el('artBack').click();failed.el('previewsBack').click();failed.el('start').click();failed.el('deploy').click();assert.equal(failed.state.mode,'play');assert.equal(failed.state.training,false);
});
test('Alpha 0.41 proposed survivor uses its held firearm and never draws the legacy gun overlay',()=>{
 const g=loadGame({traceCanvas:true});enterArt(g);g.clearTrace();const p=JSON.stringify(g.p);g.drawSamplePerson(g.el('game').getContext('2d'),g.p,'survivor',0);assert.equal(g.drawingTrace().filter(r=>r[0]==='drawImage').length,1);assert.equal(JSON.stringify(g.p),p);g.clearTrace();g.renderPlayerGun(0);assert.equal(g.drawingTrace().length,0);g.pause();g.el('sampleCompare').click();g.clearTrace();g.renderPlayerGun(0);assert.ok(g.drawingTrace().some(r=>r[0]==='fillRect'&&r[1]===9&&r[3]===12));assert.equal(g.state.mode,'paused');quitForTest(g);g.el('changeSurvivor').click();g.el('deploy').click();assert.equal(Object.keys(g.state.sampleArtwork).length,0);
});
test('Alpha 0.41 walk poses and facing are presentation-only and survive Pause without stepping time',()=>{
 const g=loadGame({traceCanvas:true});enterArt(g);assert.equal(g.sampleSpriteFrame('survivor',1,false),0);assert.equal(g.sampleSpriteFrame('survivor',0,true),1);assert.equal(g.sampleSpriteFrame('survivor',.13,true),2);assert.equal(g.sampleSpriteFrame('breaker',0,true),3);g.touch.x=1;g.clearTrace();const before=JSON.stringify(g.p);g.drawSampleSprite(g.el('game').getContext('2d'),g.p,'survivor',.13);const calls=g.drawingTrace(),crop=g.state.sampleArtwork.survivor.frames[2];assert.deepEqual(calls.find(r=>r[0]==='drawImage').slice(2,6),[...crop]);assert.equal(JSON.stringify(g.p),before);g.pause();const time=g.state.elapsed;g.update(20);assert.equal(g.state.elapsed,time);g.showSettings();g.showBenchmark();assert.match(g.benchmarkText(),/Presentation at capture: Grounded realism study/);
});

// Alpha 0.42 — real pause-menu volume controls and a shared bounded mix.
function audioContextMock(){
 const param=()=>({value:1,setValueAtTime(v){this.value=v},setTargetAtTime(v){this.value=v},linearRampToValueAtTime(v){this.value=v},cancelScheduledValues(){},exponentialRampToValueAtTime(v){this.end=v}}),node=()=>({connections:[],connect(n){this.connections.push(n)},disconnect(){this.disconnected=true}});
 const ctx={currentTime:0,state:'running',destination:{},gains:[],oscillators:[],sources:[],decodes:[],decodeAudioData(bytes){this.decodes.push(bytes);return Promise.resolve({duration:48})},createBufferSource(){const source={...node(),start(...args){this.started=args},stop(at){this.stopsAt=at}};this.sources.push(source);return source},resumeCalls:0,resume(){this.resumeCalls++;this.state='running';return Promise.resolve()},suspend(){this.state='suspended';return Promise.resolve()},createGain(){const n={...node(),gain:param()};this.gains.push(n);return n},createDynamicsCompressor(){return this.compressor={...node(),threshold:{},knee:{},ratio:{},attack:{},release:{}}},createOscillator(){const o={...node(),frequency:param(),start(){this.started=true},stop(t){this.stopsAt=t}};this.oscillators.push(o);return o},finish(){for(const o of this.oscillators)o.onended?.()}};return ctx;
}
function slideAudio(g,key,value){const input=g.el('audio-'+key);input.value=String(value);input.dispatch('input')}
test('Alpha 0.42 Pause volume levels are visible, live, persistent and do not resume or change the run',()=>{
 const g=loadGame();cleanRun(g);g.setup({elapsed:20});g.pause();const p=JSON.stringify(g.p),saved=g.journalSaved();assert.match(g.el('modal').innerHTML,/AUDIO/);for(const key of ['masterVolume','effectsVolume','alertsVolume'])assert.equal(g.el('audio-'+key).value,'80');slideAudio(g,'masterVolume',100);slideAudio(g,'effectsVolume',60);slideAudio(g,'alertsVolume',90);assert.equal(g.el('audio-value-effectsVolume').textContent,'60%');assert.equal(g.el('audio-effectsVolume').attrs['aria-valuetext'],'60 percent');g.update(10);assert.equal(g.state.mode,'paused');near(g.state.elapsed,20);assert.equal(JSON.stringify(g.p),p);assert.equal(g.journalSaved(),saved);const next=loadGame({preferencesStored:g.preferencesSaved()});assert.equal(next.state.preferences.masterVolume,100);assert.equal(next.state.preferences.effectsVolume,60);assert.equal(next.state.preferences.alertsVolume,90);next.showSettings();assert.equal(next.el('audio-alertsVolume').value,'90');
});
test('Alpha 0.42 mixer boosts the default mix and routes previews, mute and zero independently',()=>{
 const g=loadGame();cleanRun(g);g.pause();const ctx=audioContextMock();g.setSampleAudio(ctx,true);near(g.audioOutputLevel('effects'),2.56);g.el('audioTestEffects').click();assert.equal(ctx.oscillators.length,1);const mix=g.state.audioMix;near(mix.master.gain.value,3.2);near(mix.effects.gain.value,.8);assert.equal(ctx.compressor.threshold.value,-12);assert.equal(mix.master.connections[0],ctx.compressor);assert.equal(ctx.oscillators[0].connections[0].connections[0],mix.effects);
 slideAudio(g,'effectsVolume',0);g.el('audioTestEffects').click();assert.equal(ctx.oscillators.length,1);g.el('audioTestAlerts').click();assert.equal(ctx.oscillators.length,2);assert.equal(ctx.oscillators[1].connections[0].connections[0],mix.alerts);slideAudio(g,'masterVolume',0);near(mix.master.gain.value,0);g.el('audioTestAlerts').click();assert.equal(ctx.oscillators.length,2);slideAudio(g,'masterVolume',80);g.el('sound').click();near(mix.master.gain.value,0);g.el('audioTestAlerts').click();assert.equal(ctx.oscillators.length,2);assert.match(g.el('audioStatus').textContent,/Muted/);g.el('audioReset').click();assert.equal(g.state.preferences.effectsVolume,80);assert.equal(g.audioOutputLevel(),0);ctx.finish();assert.equal(g.state.activeAudioVoices,0);
});
test('Alpha 0.42 saved audio numbers validate and future or unavailable storage is preserved',()=>{
 const g=loadGame({preferencesStored:JSON.stringify({version:1,masterVolume:999,effectsVolume:-10,alertsVolume:'loud'})});assert.equal(g.state.preferences.masterVolume,100);assert.equal(g.state.preferences.effectsVolume,0);assert.equal(g.state.preferences.alertsVolume,80);assert.equal(g.cleanAudioLevel(12.6),13);for(const value of [NaN,Infinity,null,true,'80'])assert.equal(g.cleanAudioLevel(value),80);
 for(const options of [{storageBlocked:true},{preferencesStored:JSON.stringify({version:99,masterVolume:5})}]){const h=loadGame(options),old=h.preferencesSaved();h.showSettings();slideAudio(h,'masterVolume',45);assert.equal(h.state.preferences.masterVolume,45);assert.equal(h.preferencesSaved(),old);assert.match(h.el('audioStatus').textContent,/visit/)}
});
test('Alpha 0.42 effect voice cap reserves warning headroom, resumes capped contexts and cleans up once',()=>{
 const g=loadGame(),ctx=audioContextMock();g.setSampleAudio(ctx,true);for(let i=0;i<50;i++)g.sound(220,.1,'sine',.02);assert.equal(ctx.oscillators.length,20);assert.equal(g.state.effectAudioVoices,20);for(let i=0;i<10;i++)g.sound(110,.2,'triangle',.02,'alerts');assert.equal(ctx.oscillators.length,24);assert.equal(g.state.activeAudioVoices,24);ctx.state='suspended';g.sound(110,.2,'triangle',.02,'alerts');assert.equal(ctx.resumeCalls,1);assert.equal(ctx.oscillators.length,24);ctx.finish();ctx.finish();assert.equal(g.state.activeAudioVoices,0);assert.equal(g.state.effectAudioVoices,0);assert.ok(ctx.oscillators.every(o=>o.disconnected));g.sound(220,.1);assert.equal(g.state.activeAudioVoices,1);
});
test('Alpha 0.42 stale/hidden slider events cannot alter play and Settings preserves the held result',()=>{
 const g=loadGame();cleanRun(g);g.pause();const stale=g.el('audio-masterVolume');g.resume();stale.value='5';stale.dispatch('input');assert.equal(g.state.preferences.masterVolume,80);g.pause();stale.dispatch('input');assert.equal(g.state.preferences.masterVolume,80);g.document.hidden=true;slideAudio(g,'masterVolume',5);assert.equal(g.state.preferences.masterVolume,80);g.document.hidden=false;quitForTest(g);const r=g.state.runResult,saved=g.journalSaved();g.showSettings();slideAudio(g,'alertsVolume',35);g.closeSettings();assert.equal(g.state.mode,'end');assert.equal(g.state.runResult,r);assert.equal(g.journalSaved(),saved);
});
test('Alpha 0.42 actual boss and proposed warning cues use Alerts while proposed gun uses Effects',()=>{
 const g=loadGame(),ctx=audioContextMock();cleanRun(g);g.setSampleAudio(ctx,true);g.spawnBoss('breaker');const mix=g.state.audioMix;assert.equal(ctx.oscillators.at(-1).connections[0].connections[0],mix.alerts);ctx.finish();g.playStyleAudio('warning');assert.equal(g.state.sampleAudioVoices,2);for(const o of ctx.oscillators.slice(-2))assert.equal(o.connections[0].connections[0],mix.alerts);ctx.finish();assert.equal(g.state.sampleAudioVoices,0);g.playStyleAudio('gun');for(const o of ctx.oscillators.slice(-2))assert.equal(o.connections[0].connections[0],mix.effects);
});

// Alpha 0.43 — original embedded soundtrack, independent gain and bounded lifecycle.
const settleMusic=async()=>{await Promise.resolve();await Promise.resolve();await Promise.resolve()};
test('Alpha 0.43 original soundtrack is embedded byte-for-byte and has a reproducible authored score',()=>{
 const asset=JSON.parse(musicAssetText),manifest=JSON.parse(readFileSync(join(__dirname,'../dist/assets/music.json'),'utf8')),bytes=readFileSync(join(__dirname,'../dist/assets/night-watch.ogg'));
 assert.equal(asset.title,'Night Watch');assert.equal(asset.duration_seconds,48);assert.equal(asset.bpm,80);assert.equal(asset.bars,16);assert.deepEqual(asset.progression,['Dm','Bb','F','C']);assert.equal(bytes.subarray(0,4).toString(),'OggS');assert.deepEqual(Buffer.from(asset.data.split(',')[1],'base64'),bytes);assert.equal(require('node:crypto').createHash('sha256').update(bytes).digest('hex'),manifest.sha256);assert.ok(manifest.rms_before_encoding>.01&&manifest.rms_before_encoding<.025);assert.ok(manifest.loop_seam_pcm_delta<.001);assert.ok(bytes.length<300000);assert.match(readFileSync(join(__dirname,'../tools/compose_music.py'),'utf8'),/No recordings/);assert.doesNotMatch(asset.data,/https?:/);
});
test('Alpha 0.43 Music slider defaults quietly, validates old saves, persists and resets independently of mute',()=>{
 for(const value of [undefined,'loud',null]){const g=loadGame({preferencesStored:JSON.stringify({version:1,musicVolume:value})});assert.equal(g.state.preferences.musicVolume,35)}
 const g=loadGame({preferencesStored:JSON.stringify({version:1,musicVolume:150,effectsVolume:60})});assert.equal(g.state.preferences.musicVolume,100);g.showSettings();slideAudio(g,'musicVolume',25);assert.equal(g.el('audio-value-musicVolume').textContent,'25%');assert.equal(g.state.preferences.effectsVolume,60);assert.equal(loadGame({preferencesStored:g.preferencesSaved()}).state.preferences.musicVolume,25);g.el('audioReset').click();assert.equal(g.state.preferences.musicVolume,35);assert.equal(g.audioOutputLevel('music'),0);
 for(const options of [{storageBlocked:true},{preferencesStored:JSON.stringify({version:99,musicVolume:99})}]){const h=loadGame(options),old=h.preferencesSaved();h.showSettings();slideAudio(h,'musicVolume',15);assert.equal(h.preferencesSaved(),old);assert.equal(h.state.preferences.musicVolume,15)}
});
test('Alpha 0.43 music starts on deployment, caches once, resumes position and resets a new run',async()=>{
 const g=loadGame(),ctx=audioContextMock();g.setSampleAudio(ctx,true);assert.equal(ctx.sources.length,0);assert.equal(ctx.decodes.length,0);cleanRun(g);await settleMusic();const first=g.state.musicTrack.node;assert.ok(first);assert.equal(ctx.decodes.length,1);assert.equal(ctx.sources.length,1);assert.equal(first.source.loop,true);assert.equal(first.source.loopEnd,48);assert.equal(first.gain.connections[0],g.state.audioMix.music);near(g.state.audioMix.music.gain.value,.35);assert.equal(g.state.activeAudioVoices,1);g.syncBackgroundMusic();g.syncBackgroundMusic();assert.equal(ctx.sources.length,1);
 ctx.currentTime=11;g.pause();assert.equal(g.state.musicTrack.node,null);near(g.state.musicTrack.offset,11);assert.equal(first.source.stopsAt,11.03);first.source.onended();assert.ok(first.source.disconnected&&first.gain.disconnected);g.resume();assert.equal(ctx.sources.length,2);assert.equal(ctx.decodes.length,1);near(ctx.sources[1].started[1],11);
 g.setup({xp:8});g.checkLevelUp();assert.equal(g.state.mode,'upgrade');assert.equal(g.state.musicTrack.node,null);g.choose(0);assert.ok(g.state.musicTrack.node);g.start();assert.equal(g.state.musicTrack.offset,0);assert.equal(g.state.musicTrack.node.source.started[1],0);assert.equal(ctx.decodes.length,1);g.end();assert.equal(g.state.mode,'end');assert.equal(g.state.musicTrack.node,null);
});
test('Alpha 0.43 six-second music preview stays paused and separate from Effects and Alerts',async()=>{
 const g=loadGame();cleanRun(g);g.pause();const ctx=audioContextMock();g.setSampleAudio(ctx,true);const before=JSON.stringify(g.p),journal=g.journalSaved(),elapsed=g.state.elapsed;g.el('audioTestMusic').click();await settleMusic();assert.equal(ctx.sources.length,1);const first=ctx.sources[0];assert.equal(first.started[2],6);assert.equal(g.state.musicTrack.preview,true);assert.match(g.el('audioTestMusic').textContent,/STOP/);slideAudio(g,'effectsVolume',0);slideAudio(g,'alertsVolume',0);assert.equal(g.state.musicTrack.node.source,first);near(g.state.audioMix.music.gain.value,.35);g.update(10);assert.equal(g.state.mode,'paused');assert.equal(g.state.elapsed,elapsed);assert.equal(JSON.stringify(g.p),before);assert.equal(g.journalSaved(),journal);first.onended();assert.equal(g.state.musicTrack.preview,false);assert.ok(first.disconnected);assert.match(g.el('audioTestMusic').textContent,/PREVIEW/);
 g.el('audioTestMusic').click();assert.ok(g.state.musicTrack.node);slideAudio(g,'musicVolume',0);assert.equal(g.state.musicTrack.node,null);assert.equal(g.state.musicTrack.preview,false);slideAudio(g,'musicVolume',35);assert.equal(g.state.musicTrack.node,null);g.el('audioTestMusic').click();slideAudio(g,'masterVolume',0);assert.equal(g.state.musicTrack.node,null);slideAudio(g,'masterVolume',80);g.el('sound').click();g.el('audioTestMusic').click();assert.equal(g.state.musicTrack.node,null);g.el('audioReset').click();assert.equal(g.audioOutputLevel('music'),0);
});
test('Alpha 0.43 late decode completion cannot start music behind a modal or hidden page',async()=>{
 for(const action of ['pause','menu','hide','mute']){
  const g=loadGame(),ctx=audioContextMock();let resolve;ctx.decodeAudioData=bytes=>{ctx.decodes.push(bytes);return new Promise(done=>{resolve=done})};g.setSampleAudio(ctx,true);cleanRun(g);assert.equal(ctx.decodes.length,1);g.syncBackgroundMusic();assert.equal(ctx.decodes.length,1);
  if(action==='pause')g.pause();else if(action==='menu'){g.pause();quitForTest(g)}else if(action==='hide'){g.document.hidden=true;g.event('visibilitychange')}else{g.pause();g.el('sound').click()}
  resolve({duration:48});await settleMusic();assert.equal(ctx.sources.length,0);assert.ok(g.state.musicTrack.buffer);if(action==='hide'){g.document.hidden=false;g.event('visibilitychange');assert.equal(ctx.sources.length,0);g.resume();assert.equal(ctx.sources.length,1)}
 }
});
for(const event of ['blur','pagehide','visibilitychange'])test(`Alpha 0.43 ${event} stops both music and previews without auto-resume`,async()=>{
 const g=loadGame(),ctx=audioContextMock();g.setSampleAudio(ctx,true);cleanRun(g);await settleMusic();if(event==='visibilitychange')g.document.hidden=true;g.event(event);assert.equal(g.state.mode,'paused');assert.equal(g.state.musicTrack.node,null);g.document.hidden=false;g.event('visibilitychange');assert.equal(g.state.musicTrack.node,null);g.resume();assert.ok(g.state.musicTrack.node);g.pause();g.el('audioTestMusic').click();assert.equal(g.state.musicTrack.preview,true);if(event==='visibilitychange')g.document.hidden=true;g.event(event);assert.equal(g.state.musicTrack.preview,false);assert.equal(g.state.musicTrack.node,null);
});
test('Alpha 0.43 decode failure preserves combat audio and reports music unavailable',async()=>{
 const g=loadGame(),ctx=audioContextMock();ctx.decodeAudioData=()=>Promise.reject(Error('Unsupported format'));g.setSampleAudio(ctx,true);cleanRun(g);await settleMusic();assert.equal(g.state.musicTrack.error,true);assert.equal(g.state.musicTrack.node,null);g.pause();assert.match(g.el('audioStatus').textContent,/Music could not load/);const n=ctx.oscillators.length;g.el('audioTestEffects').click();assert.equal(ctx.oscillators.length,n+1);g.el('audioTestMusic').click();assert.equal(ctx.sources.length,0);assert.equal(g.state.musicTrack.preview,false);
});
test('Alpha 0.43 rapid transitions bound music to one loop and one fading tail without timer or warning-voice use',async()=>{
 const g=loadGame(),ctx=audioContextMock();g.setSampleAudio(ctx,true);cleanRun(g);await settleMusic();ctx.finish();for(let i=0;i<40;i++){ctx.currentTime+=.005;g.pause();g.resume();assert.ok(ctx.sources.filter(s=>!s.disconnected).length<=2)}assert.equal(g.state.activeAudioVoices,0);assert.equal(g.state.effectAudioVoices,0);assert.equal(ctx.decodes.length,1);g.pause();const tail=g.state.musicTrack.tail;tail.source.onended();assert.equal(g.state.musicTrack.tail,null);assert.ok(ctx.sources.every(s=>s.disconnected));
});
test('Alpha 0.43 music preview in Settings preserves held finished stats and closes when leaving',async()=>{
 const g=loadGame(),ctx=audioContextMock();cleanRun(g);g.end();const result=g.state.runResult,saved=g.journalSaved(),preferences=g.preferencesSaved();g.setSampleAudio(ctx,true);g.showSettings();g.el('audioTestMusic').click();await settleMusic();assert.ok(g.state.musicTrack.node);g.closeSettings();assert.equal(g.state.musicTrack.node,null);assert.equal(g.state.runResult,result);assert.equal(g.journalSaved(),saved);assert.equal(g.preferencesSaved(),preferences);assert.equal(g.state.mode,'end');
});
test('Alpha 0.43 active soundtrack leaves seeded simulation, choices and stored records unchanged',async()=>{
 const a=loadGame({seed:4243}),b=loadGame({seed:4243}),ctx=audioContextMock();a.setSampleAudio(ctx,true);a.start();b.start();await settleMusic();assert.ok(a.state.musicTrack.node);for(let i=0;i<180;i++){a.touch.x=b.touch.x=.5;a.touch.y=b.touch.y=.25;a.update(1/30);b.update(1/30)}
 const snapshot=g=>JSON.stringify({p:g.p,enemies:g.state.enemies,bullets:g.state.bullets,gems:g.state.gems,time:g.state.elapsed,xp:g.state.xp,kills:g.state.killCount,offer:g.state.upgradeOffer,journal:g.journalSaved(),preferences:g.preferencesSaved()});assert.equal(snapshot(a),snapshot(b));
});

// Alpha 0.44 — isolated angled intersection, native combat and shared world projection.
function enterStreet(g){g.openHomeEntry('streetOpen');g.advanceClock(500);g.el('streetEnter').click();assert.equal(g.state.streetSession,true);assert.equal(g.state.training,true)}
test('Alpha 0.44 atlas is original embedded PNG with valid pose crops and foot pivots',()=>{
 const assets=JSON.parse(sampleAssetText),asset=assets.intersection,meta=JSON.parse(readFileSync(join(__dirname,'../dist/assets/intersection.json'),'utf8')),bytes=readFileSync(join(__dirname,'../dist/assets/intersection.png'));
 const runtime=readFileSync(join(__dirname,'../dist',asset.file));assert.deepEqual(Buffer.from(asset.src.split(',')[1],'base64'),runtime);assert.equal(runtime.subarray(8,12).toString(),'WEBP');assert.equal(asset.sourceSha256,meta.sha256);assert.equal(bytes.readUInt32BE(16),1448);assert.equal(bytes.readUInt32BE(20),1086);assert.equal(require('node:crypto').createHash('sha256').update(bytes).digest('hex'),meta.sha256);assert.equal(asset.frames.length,12);assert.equal(asset.pivots.length,12);
 for(let i=0;i<12;i++){const [x,y,w,h]=asset.frames[i],[px,py]=asset.pivots[i];assert.ok(x>=0&&y>=0&&x+w<=1448&&y+h<=1086);assert.ok(px>=0&&px<=w&&py>=0&&py<=h)}assert.match(meta.limits,/not complete directional/);
});
test('Alpha 0.44 intersection entry is explicit, decode-gated, held and recoverable after failure',()=>{
 const g=loadGame({artworkStatus:'pending'});assert.equal(g.pendingImages.length,0);g.openHomeEntry('streetOpen');assert.equal(g.state.mode,'street-menu');assert.equal(g.pendingImages.length,12);assert.equal(g.el('streetEnter').disabled,true);const draws=g.drawCount();g.frame(1000);assert.equal(g.drawCount(),draws);g.advanceClock(500);g.el('streetEnter').click();assert.equal(g.state.mode,'street-menu');g.resolveArtwork();assert.equal(g.el('streetEnter').disabled,false);g.el('streetEnter').click();assert.equal(g.state.streetSession,true);assert.equal(g.state.enemies.length,7);
 const h=loadGame({artworkStatus:'error'});h.openHomeEntry('streetOpen');assert.match(h.el('streetAssetStatus').textContent,/could not load/);h.el('streetBack').click();h.el('previewsBack').click();assert.equal(h.state.mode,'menu');assert.equal(Object.keys(h.state.sampleArtwork).length,0);h.start();assert.equal(h.state.streetSession,false);assert.equal(h.state.training,false);
});
test('Alpha 0.44 camera round trips and screen-relative input preserve world speed in both orientations',()=>{
 for(const [width,height] of [[412,915],[915,412]]){const g=loadGame({width,height});enterStreet(g);for(const [x,y] of [[0,70],[-330,20],[90,-500],[640,640]]){const screen=g.streetProject(x,y),world=g.streetUnproject(screen.x,screen.y);near(world.x,x);near(world.y,y)}
  for(const [x,y] of [[1,0],[0,1],[-1,0],[0,-1],[.3,.4]]){g.touch.x=x;g.touch.y=y;const world=g.movementInput(),before=g.streetProject(g.p.x,g.p.y),after=g.streetProject(g.p.x+world.x,g.p.y+world.y),dx=after.x-before.x,dy=after.y-before.y;near(Math.hypot(world.x,world.y),Math.hypot(x,y));near(dx*y-dy*x,0);assert.ok(dx*x+dy*y>0)}
  g.touch.x=1;g.touch.y=0;const dir=g.movementInput();g.el('dash').dispatch('pointerdown',{pointerId:2});near(g.p.dashX,dir.x);near(g.p.dashY,dir.y);
 }
});
test('Alpha 0.44 walls block and slide bodies, clamp bounds and stop piercing shots in time order',()=>{
 const g=loadGame();enterStreet(g);const body={x:-235,y:-240,r:16};g.streetResolveBody(body,{x:-150,y:-260});near(body.x,-150);near(body.y,-240);const outside={x:800,y:0,r:16};g.streetResolveBody(outside,{x:630,y:0});near(outside.x,634);const inside={x:-350,y:-350,r:16};g.streetResolveBody(inside,{x:-350,y:-350});assert.ok(Math.abs(inside.x)<180||Math.abs(inside.y)<180);
 const front=enemy({x:-100,y:-260,hp:100,trainingDummy:true}),behind=enemy({x:-400,y:-260,hp:100,trainingDummy:true});g.setup({enemies:[front,behind],bullets:[{x:0,y:-260,vx:-600,vy:0,r:4,life:2,dmg:18,remainingHits:8,hitEnemies:new Set()}]});g.updateProjectiles(.8);near(front.hp,82);near(behind.hp,100);assert.equal(g.state.bullets.length,0);assert.equal(g.streetBlocked({x:0,y:-260},behind),true);
});
test('Alpha 0.45 pose changes follow active updates, stabilize feet and retain native boss phases',()=>{
 const g=loadGame({traceCanvas:true});enterStreet(g);const boss=g.state.activeBoss;for(const [phase,time,row] of [['approach',2.8,0],['warn',.8,0],['charge',.44,2],['recover',1.1,4]]){boss.phase=phase;boss.phaseTime=time;g.advanceStreetAnimations(.01);assert.equal(Math.floor(g.streetFrame(boss,'breaker')/5),row);assert.equal(g.streetActorInfo(boss,'breaker').asset,'breakerCombat')}
 g.setup({enemies:[]});g.p.fireClock=Infinity;g.touch.x=1;g.update(.03);assert.equal(g.streetActorInfo(g.p,'survivor').asset,'survivorWalk');const moving=g.streetMotionFor(g.p);assert.equal(moving.moving,true);g.touch.x=0;g.update(.03);assert.equal(g.streetMotionFor(g.p).moving,false);assert.equal(g.streetFrame(g.p,'survivor')%4,0);
 g.clearTrace();g.render();const atlas=g.state.sampleArtwork.survivorWalk.image,draws=g.drawingTrace().filter(row=>row[0]==='drawImage'&&row[1]===atlas);assert.ok(draws.length>=1&&draws.length<=2);assert.ok(draws.every(row=>row.slice(2).every(Number.isFinite)));for(const layer of g.streetActorInfo(g.p,'survivor').layers)near(-layer.pivot[1]*layer.scale+layer.crop[3]*layer.scale,0);
});
test('Alpha 0.44 depth order and foreground fading use ground anchors without changing collisions',()=>{
 const g=loadGame();enterStreet(g);const queue=g.streetDrawQueue();assert.equal(queue.length,17);assert.ok(queue.every((row,i)=>i===0||queue[i-1].depth<=row.depth));let faded=false;
 for(const x of [-180,0,180,260])for(const y of [-180,0,180,260]){g.p.x=x;g.p.y=y;for(const b of g.streetBlocks)if(g.streetBuildingAlpha(b)<1)faded=true}assert.equal(faded,true);assert.ok(g.streetBlocks.every(b=>b.w===455&&b.h===455));
});
test('Alpha 0.44 overhead comparison freezes state, restores mapping and labels phone reports',()=>{
 const g=loadGame();enterStreet(g);g.pause();const before=JSON.stringify({p:g.p,time:g.state.elapsed,enemies:g.state.enemies}),saved=g.journalSaved();g.el('streetCompare').click();assert.equal(g.state.streetAngled,false);assert.equal(g.state.mode,'paused');assert.equal(JSON.stringify({p:g.p,time:g.state.elapsed,enemies:g.state.enemies}),before);g.touch.x=1;g.touch.y=0;near(g.movementInput().x,1);near(g.movementInput().y,0);g.el('streetCompare').click();assert.equal(g.state.streetAngled,true);assert.equal(g.touch.x,0);g.showSettings();g.el('perfReport').click();assert.match(g.benchmarkText(),/Angled intersection prototype/);g.el('benchmarkBack').click();g.closeSettings();assert.equal(g.state.mode,'paused');assert.equal(g.journalSaved(),saved);
});
test('Alpha 0.44 practice crowds respawn within bounds, HP stays safe and finish/retry/Main preserve records',()=>{
 const g=loadGame(),saved=g.journalSaved(),prefs=g.preferencesSaved(),record=g.saved();enterStreet(g);g.hurtPlayer(30,'breaker');assert.equal(g.p.hp,g.p.max);assert.equal(g.practiceSnapshot().threats,1);for(const e of g.state.enemies)g.hitEnemy(e,1e6);for(let i=0;i<80;i++)g.update(.025);assert.equal(g.state.enemies.filter(e=>e.hp>0).length,7);assert.ok(g.state.enemies.every(e=>Math.abs(e.x)<=650&&Math.abs(e.y)<=650));g.pause();quitForTest(g);const result=g.state.runResult;assert.equal(result.training,true);g.update(100);assert.equal(g.state.runResult,result);assert.equal(g.journalSaved(),saved);assert.equal(g.preferencesSaved(),prefs);assert.equal(g.saved(),record);g.advanceClock(500);g.el('again').click();assert.equal(g.state.streetSession,true);assert.equal(g.state.elapsed,0);g.pause();quitForTest(g);g.advanceClock(500);g.el('resultMenu').click();assert.equal(g.state.streetSession,false);assert.equal(Object.keys(g.state.sampleArtwork).length,0);g.start();assert.equal(g.state.training,false);assert.equal(g.state.streetSession,false);
});
test('Alpha 0.44 scene reset and drill change release prototype rules without changing normal practice',()=>{
 const g=loadGame();enterStreet(g);g.p.x=100;g.pause();g.el('streetReset').click();assert.equal(g.state.streetSession,true);assert.equal(g.p.x,0);g.pause();const pick=g.el('trainingScenarioPick');pick.value='targets';pick.dispatch('change');assert.equal(g.state.streetSession,false);assert.equal(g.state.trainingScenario,'targets');assert.equal(g.state.obstacles.length,0);assert.equal(g.state.barrels.length,0);assert.equal(g.state.enemies.length,4);g.resume();g.touch.x=1;g.touch.y=0;near(g.movementInput().x,1);near(g.movementInput().y,0);
});
test('Alpha 0.44 native warning lane projects with the same matrix as ground and collision geometry',()=>{
 const g=loadGame({traceCanvas:true});enterStreet(g);Object.assign(g.state.activeBoss,{x:0,y:-150,phase:'warn',chargeX:0,chargeY:1,chargeLength:300});g.clearTrace();g.render();const trace=g.drawingTrace(),worldMatrix=trace.find(row=>row[0]==='transform'),a=Math.SQRT1_2*.8;assert.deepEqual(worldMatrix.slice(1),[a,a*.55,-a,a*.55,206-a*(g.p.x-g.p.y),915*.58-a*.55*(g.p.x+g.p.y)]);assert.ok(trace.some(row=>row[0]==='moveTo'&&row[1]===0&&row[2]===-150));assert.ok(trace.some(row=>row[0]==='lineTo'&&row[1]===0&&row[2]===150));
});
test('Alpha 0.44 native Dash respects solid buildings and a Breaker charge ends against a wall',()=>{
 const g=loadGame();enterStreet(g);g.p.x=-150;g.p.y=-260;g.p.fireClock=Infinity;g.touch.x=-1;g.touch.y=-.55;g.dash();for(let i=0;i<8;i++)g.update(.035);assert.ok(g.p.x>=-179);assert.ok(g.p.y<-250);const boss=g.state.activeBoss;Object.assign(boss,{x:-140,y:-280,phase:'charge',phaseTime:.38,chargeX:-1,chargeY:0,chargeLength:360});g.touch.x=g.touch.y=0;g.update(.035);assert.equal(boss.phase,'recover');near(boss.x,-140);
});
test('Alpha 0.44 rendering cannot advance simulation, consume RNG or alter records; background clears projected input',()=>{
 const a=loadGame({seed:4444}),b=loadGame({seed:4444});enterStreet(a);enterStreet(b);const snapshot=g=>JSON.stringify({p:g.p,time:g.state.elapsed,enemies:g.state.enemies,barrels:g.state.barrels,preferences:g.preferencesSaved(),journal:g.journalSaved()});const before=snapshot(a);for(let i=0;i<25;i++)a.render();assert.equal(snapshot(a),before);a.touch.x=b.touch.x=.4;a.touch.y=b.touch.y=.2;for(let i=0;i<60;i++){a.update(1/30);b.update(1/30)}assert.equal(snapshot(a),snapshot(b));a.document.hidden=true;a.event('visibilitychange');assert.equal(a.state.mode,'paused');assert.equal(a.touch.x,0);const time=a.state.elapsed;a.frame(9999);near(a.state.elapsed,time);a.document.hidden=false;a.event('visibilitychange');assert.equal(a.state.mode,'paused');
});

// Alpha 0.45 — directional survivor gait follows measured displacement.
test('Alpha 0.45 directional art preserves original bytes and maps five views to valid foot-anchored frames',()=>{
 const asset=JSON.parse(sampleAssetText).survivorWalk,meta=JSON.parse(readFileSync(join(__dirname,'../dist/assets/survivor-walk.json'),'utf8')),bytes=readFileSync(join(__dirname,'../dist/assets/survivor-walk.png'));const runtime=readFileSync(join(__dirname,'../dist',asset.file)),formats=JSON.parse(readFileSync(join(__dirname,'../dist/assets/runtime-formats.json'),'utf8'));assert.deepEqual(Buffer.from(asset.src.split(',')[1],'base64'),runtime);assert.equal(runtime.subarray(8,12).toString(),'WEBP');assert.equal(formats.survivorWalk.runtime_sha256,asset.sha256);assert.equal(require('node:crypto').createHash('sha256').update(runtime).digest('hex'),asset.sha256);assert.equal(formats.survivorWalk.source_sha256,meta.sha256);assert.equal(require('node:crypto').createHash('sha256').update(bytes).digest('hex'),meta.sha256);assert.equal(bytes.readUInt32BE(16),1122);assert.equal(bytes.readUInt32BE(20),1402);assert.equal(asset.frames.length,20);assert.deepEqual(meta.rows,['east','northeast-rear','north-rear','southeast-front','south-front']);for(let i=0;i<20;i++){const [x,y,w,h]=asset.frames[i],[px,py]=asset.pivots[i];assert.ok(x>=0&&y>=0&&x+w<=asset.width&&y+h<=asset.height&&px>=0&&px<=w&&py===h)}
});
test('Alpha 0.45 all eight screen directions select the matching view and mirror while moving',()=>{
 const rows=[0,3,4,3,0,1,2,1],flips=[1,1,1,-1,-1,-1,1,1];for(const [width,height] of [[412,915],[915,412]])for(let direction=0;direction<8;direction++){
  const g=loadGame({width,height});enterStreet(g);g.setup({enemies:[]});g.p.fireClock=Infinity;g.touch.x=Math.cos(direction*Math.PI/4);g.touch.y=Math.sin(direction*Math.PI/4);g.update(.03);const state=g.streetMotionFor(g.p),info=g.streetActorInfo(g.p,'survivor');assert.equal(state.direction,direction);assert.equal(Math.floor(info.index/4),rows[direction]);assert.equal(info.flip,flips[direction]);
 }
});
test('Alpha 0.45 gait phase depends on distance, not elapsed time or firing, and remains bounded',()=>{
 const a=loadGame(),b=loadGame();enterStreet(a);enterStreet(b);a.setup({enemies:[]});b.setup({enemies:[]});a.p.fireClock=b.p.fireClock=Infinity;a.touch.x=b.touch.x=1;for(let i=0;i<20;i++)a.update(.02);b.touch.x=.5;for(let i=0;i<40;i++)b.update(.02);near(a.streetMotionFor(a.p).travel,b.streetMotionFor(b.p).travel);assert.equal(a.streetFrame(a.p,'survivor')%4,b.streetFrame(b.p,'survivor')%4);const before=a.streetMotionFor(a.p).travel;a.p.fireClock=a.p.fire;a.advanceStreetAnimations(.02);near(a.streetMotionFor(a.p).travel,before);assert.equal(a.streetMotionFor(a.p).moving,false);
 for(let i=0;i<90;i++){a.p.x=0;a.p.y=0;a.primeStreetAnimations();a.touch.x=1;a.update(.02)}assert.ok(a.streetMotionFor(a.p).travel>=0&&a.streetMotionFor(a.p).travel<76);
});
test('Alpha 0.45 blocked movement stops the gait and reversing travel overrides a target behind the player',()=>{
 const g=loadGame();enterStreet(g);g.p.x=-179;g.p.y=-260;g.primeStreetAnimations();g.p.fireClock=Infinity;g.setup({enemies:[]});g.touch.x=-1;g.touch.y=-.55;g.update(.03);assert.equal(g.streetMotionFor(g.p).moving,false);near(g.streetMotionFor(g.p).travel,0);assert.equal(g.streetFrame(g.p,'survivor')%4,0);
 g.p.x=0;g.p.y=70;g.primeStreetAnimations();const target=enemy({x:100,y:-50,hp:10000,trainingDummy:true});g.setup({enemies:[target]});g.touch.x=-1;g.touch.y=0;g.update(.03);assert.equal(g.streetMotionFor(g.p).direction,4);assert.equal(g.streetActorInfo(g.p,'survivor').flip,-1);g.touch.x=1;g.update(.03);assert.equal(g.streetMotionFor(g.p).direction,0);assert.equal(g.streetActorInfo(g.p,'survivor').flip,1);
});
test('Alpha 0.45 pose blends are bounded, foot anchored and freeze with Pause and background',()=>{
 const g=loadGame();enterStreet(g);g.setup({enemies:[]});g.p.fireClock=Infinity;g.touch.x=1;g.update(.02);let layers=g.streetActorInfo(g.p,'survivor').layers;assert.ok(layers.length<=2);near(layers.reduce((n,l)=>n+l.weight,0),1);for(const layer of layers)near(-layer.pivot[1]*layer.scale+layer.crop[3]*layer.scale,0);g.pause();const snapshot=JSON.stringify(g.streetMotionFor(g.p)),pose=JSON.stringify(g.streetActorInfo(g.p,'survivor').layers.map(l=>[l.index,l.weight]));g.frame(99999);g.advanceStreetAnimations(10);assert.equal(JSON.stringify(g.streetMotionFor(g.p)),snapshot);assert.equal(JSON.stringify(g.streetActorInfo(g.p,'survivor').layers.map(l=>[l.index,l.weight])),pose);g.document.hidden=true;g.event('visibilitychange');g.document.hidden=false;g.event('visibilitychange');assert.equal(JSON.stringify(g.streetMotionFor(g.p)),snapshot);g.resume();g.touch.x=1;for(let i=0;i<40;i++)g.update(.02);assert.ok(g.streetActorInfo(g.p,'survivor').layers.length<=2);
});
test('Alpha 0.45 heading hysteresis avoids boundary flicker and Reduced Effects removes blend layers',()=>{
 const g=loadGame();enterStreet(g);const angle=Math.PI/8;assert.equal(g.streetHeading(Math.cos(angle+.03),Math.sin(angle+.03),0),0);assert.equal(g.streetHeading(Math.cos(angle+.15),Math.sin(angle+.15),0),1);g.state.preferences.reduced=true;g.setup({enemies:[]});g.touch.x=1;g.update(.03);assert.equal(g.streetActorInfo(g.p,'survivor').layers.length,1);g.touch.y=1;g.update(.03);assert.equal(g.streetActorInfo(g.p,'survivor').layers.length,1);
});
test('Alpha 0.45 firing does not replace walking with an aiming pose and large relocations do not spin the gait',()=>{
 const g=loadGame();enterStreet(g);g.p.fireClock=g.p.fire;g.touch.x=1;g.update(.03);const motion=g.streetMotionFor(g.p),view=Math.floor(motion.pose.frame/4);assert.equal(motion.pose.asset,'survivorWalk');assert.equal(view,0);const frame=motion.pose.frame;g.p.fireClock=g.p.fire;g.advanceStreetAnimations(.001);assert.equal(g.streetMotionFor(g.p).pose.asset,'survivorWalk');assert.notEqual(g.streetMotionFor(g.p).pose.frame,3);g.p.x+=400;g.advanceStreetAnimations(.02);near(g.streetMotionFor(g.p).travel,0);assert.equal(g.streetMotionFor(g.p).moving,false);assert.ok(g.streetActorInfo(g.p,'survivor').layers.length<=2);
});
test('Alpha 0.45 animation state resets with the prototype and remains outside journal/preferences/results',()=>{
 const g=loadGame(),saved=g.journalSaved(),prefs=g.preferencesSaved();enterStreet(g);g.touch.x=1;g.update(.03);const old=g.streetMotionFor(g.p);g.pause();g.el('streetReset').click();assert.notEqual(g.streetMotionFor(g.p),old);near(g.streetMotionFor(g.p).travel,0);g.pause();quitForTest(g);assert.equal(g.journalSaved(),saved);assert.equal(g.preferencesSaved(),prefs);assert.doesNotMatch(JSON.stringify(g.state.runResult),/survivorWalk|changedAt|previous|direction/);
});

// Alpha 0.46 — enemy locomotion uses real displacement without changing combat.
const enemy46Specs=[['shambler','shamblerWalk','shambler-walk',48],['runner','runnerRun','runner-run',64],['brute','bruteWalk','brute-walk',72],['breaker','breakerWalk','breaker-walk',96]];
function enemy46(g,kind){const e=g.state.enemies.find(e=>g.sampleEnemyKind(e)===kind);assert.ok(e);g.p.fireClock=Infinity;return e}
function stepEnemy46(g,e,dx,dy,dt=.1){e.x+=dx;e.y+=dy;g.setup({elapsed:g.state.elapsed+dt});g.advanceStreetAnimations(dt)}
test('Alpha 0.46 enemy atlases preserve source bytes and validate runtime images, directional crops and transparent alpha provenance',()=>{
 const assets=JSON.parse(sampleAssetText),formats=JSON.parse(readFileSync(join(__dirname,'../dist/assets/runtime-formats.json'),'utf8'));
 for(const [kind,key,name] of enemy46Specs){const meta=JSON.parse(readFileSync(join(__dirname,'../dist/assets/'+name+'.json'),'utf8')),source=readFileSync(join(__dirname,'../dist/assets/'+name+'.png')),runtime=readFileSync(join(__dirname,'../dist/assets/'+name+'.webp')),asset=assets[key],record=formats[key],hash=bytes=>require('node:crypto').createHash('sha256').update(bytes).digest('hex');assert.equal(hash(source),meta.sha256);assert.equal(hash(runtime),asset.sha256);assert.deepEqual(Buffer.from(asset.src.split(',')[1],'base64'),runtime);assert.equal(runtime.subarray(8,12).toString(),'WEBP');assert.equal(record.alpha_exact,true);assert.ok(record.visible_rgb_psnr_db>34);assert.equal(asset.frames.length,kind==='breaker'?4:20);for(let i=0;i<asset.frames.length;i++){const [x,y,w,h]=asset.frames[i],[px,py]=asset.pivots[i];assert.ok(x>=0&&y>=0&&x+w<=meta.width&&y+h<=meta.height&&px>=0&&px<=w&&py===h)}
 }
 assert.ok(html.length<12*1024*1024);
});
test('Alpha 0.46 ordinary enemies select all eight travel views in portrait and landscape',()=>{
 const rows=[0,3,4,3,0,1,2,1],flips=[1,1,1,-1,-1,-1,1,1];for(const [width,height] of [[412,915],[915,412]])for(const kind of ['shambler','runner','brute'])for(let direction=0;direction<8;direction++){
  const g=loadGame({width,height});enterStreet(g);const e=enemy46(g,kind),d=g.streetDirection(Math.cos(direction*Math.PI/4),Math.sin(direction*Math.PI/4));stepEnemy46(g,e,d.x*8,d.y*8);const m=g.streetMotionFor(e),info=g.streetActorInfo(e,kind);assert.equal(m.direction,direction);assert.equal(Math.floor(info.index/4),rows[direction]);assert.equal(info.flip,flips[direction]);assert.equal(info.asset,enemy46Specs.find(spec=>spec[0]===kind)[1]);
 }
});
test('Alpha 0.46 all enemy cycles contain four phases and depend on distance rather than waiting time',()=>{
 for(const [kind,key,,stride] of enemy46Specs){const a=loadGame(),b=loadGame();enterStreet(a);enterStreet(b);const ea=enemy46(a,kind),eb=enemy46(b,kind),seen=new Set();for(let i=0;i<16;i++){stepEnemy46(a,ea,stride/8,0,.1);seen.add(a.streetFrame(ea,kind)%4)}for(let i=0;i<32;i++)stepEnemy46(b,eb,stride/16,0,.1);assert.equal(seen.size,4);near(a.streetMotionFor(ea).travel,b.streetMotionFor(eb).travel);assert.ok(a.streetMotionFor(ea).travel>=0&&a.streetMotionFor(ea).travel<stride);assert.equal(a.streetMotionFor(ea).pose.asset,key);stepEnemy46(a,ea,0,0,.5);assert.equal(a.streetMotionFor(ea).moving,false);if(kind==='breaker'){assert.equal(a.streetMotionFor(ea).pose.asset,'breakerCombat');assert.ok(a.streetFrame(ea,kind)<5)}else assert.equal(a.streetFrame(ea,kind)%4,0);
 }
});
test('Alpha 0.46 blocked or stunned enemies stop stepping without changing their native movement rules',()=>{
 const g=loadGame();enterStreet(g);const e=enemy46(g,'shambler');e.x=-179;e.y=-260;g.primeStreetAnimations();const from={x:e.x,y:e.y};e.x=-230;g.streetResolveBody(e,from);g.setup({elapsed:.1});g.advanceStreetAnimations(.1);assert.equal(g.streetMotionFor(e).moving,false);near(g.streetMotionFor(e).travel,0);assert.equal(g.streetFrame(e,'shambler')%4,0);
 e.x=0;e.y=-100;g.primeStreetAnimations();e.salvageStunUntil=g.state.elapsed+2;g.update(.03);assert.equal(g.streetMotionFor(e).moving,false);assert.equal(g.streetFrame(e,'shambler')%4,0);e.salvageStunUntil=0;g.update(.03);assert.equal(g.streetMotionFor(e).moving,true);
});
test('Alpha 0.46 Breaker walks during approach and retains actual warning, charge and recovery poses',()=>{
 const g=loadGame();enterStreet(g);const boss=enemy46(g,'breaker');stepEnemy46(g,boss,12,0);assert.equal(g.streetActorInfo(boss,'breaker').asset,'breakerWalk');for(const [phase,time,row,blend] of [['warn',.8,0,.09],['charge',.44,2,.035],['recover',1.1,4,.09]]){boss.phase=phase;boss.phaseTime=time;stepEnemy46(g,boss,0,0);const info=g.streetActorInfo(boss,'breaker');assert.equal(info.asset,'breakerCombat');assert.equal(Math.floor(info.index/5),row);assert.equal(g.streetMotionFor(boss).blend,blend)}assert.equal(g.state.activeBoss,boss);assert.equal(boss.trainingBoss,true);
});
test('Alpha 0.46 rendered enemies use the new images with bounded foot-anchored layers and freeze on Pause',()=>{
 const g=loadGame({traceCanvas:true});enterStreet(g);g.state.preferences.reduced=true;for(const [kind,key] of enemy46Specs){const e=enemy46(g,kind);stepEnemy46(g,e,10,0);const info=g.streetActorInfo(e,kind);assert.equal(info.asset,key);assert.equal(info.layers.length,1);for(const layer of info.layers)near(-layer.pivot[1]*layer.scale+layer.crop[3]*layer.scale,0)}
 // Advance all actors together so each remains in locomotion for this render.
 for(const e of g.state.enemies)e.x+=3;g.setup({elapsed:g.state.elapsed+.1});g.advanceStreetAnimations(.1);g.clearTrace();g.render();for(const [,key] of enemy46Specs){const image=g.state.sampleArtwork[key].image;assert.ok(g.drawingTrace().some(call=>call[0]==='drawImage'&&call[1]===image))}
 g.pause();const frozen=JSON.stringify(g.state.enemies.map(e=>g.streetMotionFor(e))),saved=g.journalSaved();g.frame(9999);g.advanceStreetAnimations(5);assert.equal(JSON.stringify(g.state.enemies.map(e=>g.streetMotionFor(e))),frozen);g.document.hidden=true;g.event('visibilitychange');assert.equal(JSON.stringify(g.state.enemies.map(e=>g.streetMotionFor(e))),frozen);assert.equal(g.journalSaved(),saved);
});
test('Alpha 0.46 enemy phases are staggered without RNG and late artwork cannot restart a closed preview',()=>{
 const g=loadGame();enterStreet(g);const shamblers=g.state.enemies.filter(e=>g.sampleEnemyKind(e)==='shambler');for(const e of shamblers)e.x+=10;g.setup({elapsed:.1});g.advanceStreetAnimations(.1);assert.notEqual(g.streetFrame(shamblers[0],'shambler')%4,g.streetFrame(shamblers[1],'shambler')%4);for(let i=0;i<80;i++)g.render();assert.equal(g.streetMotionFor(shamblers[0]).travel,10);
 const h=loadGame({artworkStatus:'pending'});h.openHomeEntry('streetOpen');assert.equal(h.pendingImages.length,12);assert.equal(h.el('streetEnter').disabled,true);h.el('streetBack').click();h.el('previewsBack').click();h.resolveArtwork();assert.equal(h.state.mode,'menu');assert.equal(h.state.streetSession,false);assert.equal(Object.keys(h.state.sampleArtwork).length,0);
});
test('Alpha 0.46 survivor animation matches the accepted Alpha 0.45 trajectory fingerprint',()=>{
 const g=loadGame({seed:4601});enterStreet(g);const poses=[];for(let i=0;i<150;i++){g.touch.x=Math.cos(i/25)*.7;g.touch.y=Math.sin(i/25)*.7;if(i===50)g.dash();g.update(1/30);const m=g.streetMotionFor(g.p),info=g.streetActorInfo(g.p,'survivor');poses.push({direction:m.direction,travel:+m.travel.toFixed(6),flip:info.flip,layers:info.layers.map(l=>[l.asset,l.index,+l.weight.toFixed(6)])})}assert.equal(require('node:crypto').createHash('sha256').update(JSON.stringify(poses)).digest('hex'),'0eedbfd3b501edf283fb2b8d615ef88e61651f2fb4b885add48cb892745812df');
});

// Alpha 0.47 — presentation-only combat reactions, collapse and independent aim.
test('Alpha 0.47 aiming atlas retains generated PNG, runtime alpha provenance and five isolated waist-anchored views',()=>{
 const asset=JSON.parse(sampleAssetText).survivorAim,meta=JSON.parse(readFileSync(join(__dirname,'../dist/assets/survivor-aim.json'),'utf8')),source=readFileSync(join(__dirname,'../dist/assets/survivor-aim.png')),runtime=readFileSync(join(__dirname,'../dist/assets/survivor-aim.webp')),record=JSON.parse(readFileSync(join(__dirname,'../dist/assets/runtime-formats.json'),'utf8')).survivorAim,hash=b=>require('node:crypto').createHash('sha256').update(b).digest('hex');
 assert.equal(hash(source),meta.sha256);assert.equal(hash(runtime),asset.sha256);assert.deepEqual(Buffer.from(asset.src.split(',')[1],'base64'),runtime);assert.equal(record.alpha_exact,true);assert.ok(record.visible_rgb_psnr_db>34);assert.equal(asset.frames.length,5);assert.deepEqual(meta.views,['east','northeast-rear','north-rear','southeast-front','south-front']);
 for(let i=0;i<5;i++){const [x,y,w,h]=asset.frames[i],[px,py]=asset.pivots[i],[mx,my]=asset.muzzles[i];assert.ok(x>=0&&y>=0&&x+w<=1536&&y+h<=1024&&px>0&&px<w&&py===h&&mx>=0&&mx<=w&&my>=0&&my<=h);for(let j=0;j<i;j++){const [u,v,a,b]=asset.frames[j];assert.ok(x>=u+a||u>=x+w||y>=v+b||v>=y+h)}}assert.ok(Buffer.byteLength(html)<12*1024*1024);
});
test('Alpha 0.47 prototype waits for the additional aim sheet and late completion cannot reopen Main',()=>{
 const g=loadGame({artworkStatus:'pending'});g.openHomeEntry('streetOpen');assert.equal(g.pendingImages.length,12);for(const im of g.pendingImages.filter((_,i)=>i!==9)){im.naturalWidth=1536;im.naturalHeight=1024;im.onload()}
 assert.equal(g.el('streetEnter').disabled,true);g.advanceClock(500);g.el('streetEnter').click();assert.equal(g.state.mode,'street-menu');g.el('streetBack').click();g.el('previewsBack').click();g.resolveArtwork();assert.equal(g.state.mode,'menu');assert.equal(Object.keys(g.state.sampleArtwork).length,0);assert.equal(g.streetCombatSnapshot().defeats.length,0);
});
test('Alpha 0.47 nonlethal reactions lean visually without moving, stunning or rewriting enemy combat fields',()=>{
 const g=loadGame();enterStreet(g);const e=enemy46(g,'shambler'),before={...e};g.hitEnemy(e,10,'GUN');assert.equal(e.hp,before.hp-10);assert.equal(e.x,before.x);assert.equal(e.y,before.y);assert.equal(e.speed,before.speed);assert.equal(e.salvageStunUntil,before.salvageStunUntil);assert.deepEqual(Object.keys(e).sort(),Object.keys(before).sort());
 g.setup({elapsed:.07});const visual=g.streetReactionVisual(e,'shambler');assert.ok(Math.abs(visual.shear)>0&&Math.abs(visual.shear)<=.075);const reaction=g.streetCombatSnapshot().reactions.get(e);g.hitEnemy(e,1);assert.equal(g.streetCombatSnapshot().reactions.get(e),reaction);g.setup({elapsed:.3});near(g.streetReactionVisual(e,'shambler').shear,0);assert.equal(g.streetCombatSnapshot().defeats.length,0);
});
test('Alpha 0.47 lethal hits count immediately once and retain at most twelve value-only defeat visuals',()=>{
 const g=loadGame();enterStreet(g);const targets=Array.from({length:25},(_,i)=>enemy({x:i,y:0,hp:10,trainingDummy:true}));g.setup({enemies:targets});const before=g.practiceSnapshot().targets;
 for(const e of targets){g.hitEnemy(e,20,'GUN');g.hitEnemy(e,20,'GUN')}assert.equal(g.practiceSnapshot().targets,before+25);assert.equal(g.state.killCount,0);assert.equal(g.state.gems.length,0);const bodies=g.streetCombatSnapshot().defeats;assert.equal(bodies.length,12);assert.equal(bodies[0].x,13);assert.ok(bodies.every(b=>!targets.includes(b)&&!('image'in b)&&!('enemy'in b)&&!('hp'in b)&&Object.keys(b.pose).sort().join(',')==='asset,frame'));assert.equal(g.gunTarget(),null);
});
test('Alpha 0.47 defeated actors leave collision immediately while their separate collapse draws and expires',()=>{
 const g=loadGame({traceCanvas:true});enterStreet(g);const e=enemy46(g,'runner');g.hitEnemy(e,1e6);const body=g.streetCombatSnapshot().defeats[0];assert.equal(g.streetDefeatInfo(body).alpha,1);g.update(.02);assert.equal(g.state.enemies.includes(e),false);assert.ok(g.streetDrawQueue().some(row=>row.kind==='defeat'&&row.item===body));
 g.setup({elapsed:.3});const halfway=g.streetDefeatInfo(body);assert.ok(Math.abs(halfway.angle)>.5);assert.ok(halfway.squash<1&&halfway.alpha<1);g.clearTrace();g.render();assert.ok(g.drawingTrace().some(call=>call[0]==='rotate'&&call[1]===halfway.angle));g.setup({elapsed:1});g.advanceStreetAnimations(.01);assert.equal(g.streetCombatSnapshot().defeats.length,0);assert.ok(g.streetDrawQueue().every(row=>row.kind!=='defeat'));
});
test('Alpha 0.47 eight independent aim directions preserve opposite-facing leg movement in both orientations',()=>{
 const rows=[0,3,4,3,0,1,2,1],flips=[1,1,1,-1,-1,-1,1,1];for(const [width,height] of [[412,915],[915,412]])for(let direction=0;direction<8;direction++){
  const g=loadGame({width,height});enterStreet(g);const d=g.streetDirection(Math.cos(direction*Math.PI/4),Math.sin(direction*Math.PI/4)),target=enemy({x:g.p.x+d.x*80,y:g.p.y+d.y*80,hp:1000,max:1000,trainingDummy:true});g.setup({enemies:[target]});g.p.fireClock=Infinity;g.primeStreetAnimations();g.touch.x=-Math.cos(direction*Math.PI/4);g.touch.y=-Math.sin(direction*Math.PI/4);g.update(.02);const aim=g.streetAimInfo(),legs=g.streetMotionFor(g.p);assert.equal(aim.direction,direction);assert.equal(aim.layers.at(-1).row,rows[direction]);assert.equal(aim.layers.at(-1).flip,flips[direction]);assert.equal(legs.direction,(direction+4)%8);assert.equal(legs.pose.asset,'survivorWalk');assert.ok(legs.moving);
 }
});
test('Alpha 0.47 actual fired direction drives brief recoil and muzzle flash without changing volley fields',()=>{
 const g=loadGame({traceCanvas:true});enterStreet(g);const target=enemy({x:g.p.x+80,y:g.p.y-80,hp:1000,max:1000,trainingDummy:true});g.setup({enemies:[target]});g.p.fireClock=0;g.update(.01);const shot=g.streetCombatSnapshot().shot,at=g.state.elapsed,bullet=g.state.bullets[0];assert.ok(shot);near(shot.dx,Math.SQRT1_2);near(shot.dy,-Math.SQRT1_2);near(bullet.vx,g.p.bulletSpeed*Math.SQRT1_2);near(bullet.vy,-g.p.bulletSpeed*Math.SQRT1_2);assert.equal(bullet.dmg,g.p.damage);assert.equal(g.streetAimInfo().flash,true);
 g.setup({elapsed:at+.04});assert.ok(g.streetAimInfo().recoil>0);g.clearTrace();g.render();assert.ok(g.drawingTrace().some(c=>c[0]==='clip'));assert.ok(g.drawingTrace().some(c=>c[0]==='drawImage'&&c[1]===g.state.sampleArtwork.survivorAim.image));g.setup({elapsed:at+.14});assert.equal(g.streetAimInfo().flash,false);near(g.streetAimInfo().recoil,0);
});
test('Alpha 0.47 Breaker anticipation, locked charge facing and recovery impact follow native phase transitions',()=>{
 const g=loadGame({traceCanvas:true});enterStreet(g);const e=enemy46(g,'breaker');Object.assign(e,{x:0,y:-100,phase:'warn',phaseTime:.4,chargeX:1,chargeY:0,chargeLength:180});g.p.x=-100;g.p.y=-100;g.advanceStreetAnimations(.01);let v=g.streetBossVisual(e);assert.equal(v.flip,1);assert.ok(v.squash<1);e.phase='charge';e.phaseTime=.1;g.advanceStreetAnimations(.01);v=g.streetBossVisual(e);assert.equal(v.flip,1);assert.ok(Math.abs(v.shear)>.05);g.moveBoss(e,.11);assert.equal(e.phase,'recover');near(e.phaseTime,1.1);g.advanceStreetAnimations(.01);assert.ok(g.streetMotionFor(e).impact);v=g.streetBossVisual(e);near(v.squash,.9);g.clearTrace();g.render();assert.ok(g.drawingTrace().some(c=>c[0]==='set'&&c[1]==='strokeStyle'&&c[2]==='#bba98a'));g.moveBoss(e,1.11);assert.equal(e.phase,'approach');
});
test('Alpha 0.47 Pause, background and comparison freeze reactions, recoil, collapse and boss feedback',()=>{
 const g=loadGame();enterStreet(g);g.update(.02);g.hitEnemy(enemy46(g,'shambler'),1e6);g.setup({elapsed:.08});const snapshot=()=>JSON.stringify({aim:g.streetAimInfo(),bodies:g.streetCombatSnapshot().defeats.map(b=>g.streetDefeatInfo(b)),reaction:g.streetReactionVisual(enemy46(g,'brute'),'brute'),time:g.state.elapsed});const before=snapshot();g.pause();g.update(5);g.frame(99999);g.advanceStreetAnimations(5);g.el('streetCompare').click();g.el('streetCompare').click();g.document.hidden=true;g.event('visibilitychange');g.document.hidden=false;g.event('visibilitychange');assert.equal(snapshot(),before);assert.equal(g.state.mode,'paused');g.resume();for(let i=0;i<40;i++)g.update(.03);assert.equal(g.streetCombatSnapshot().defeats.length,0);
});
test('Alpha 0.47 Reduced Effects keeps aiming and damage but removes recoil, lean, fall transforms and impact rings',()=>{
 const g=loadGame({traceCanvas:true});enterStreet(g);g.state.preferences.reduced=true;g.update(.02);g.hitEnemy(enemy46(g,'shambler'),1e6);g.hitEnemy(enemy46(g,'brute'),1);g.setup({elapsed:.06});const aim=g.streetAimInfo(),body=g.streetDefeatInfo(g.streetCombatSnapshot().defeats[0]);assert.equal(aim.layers.length,1);assert.equal(aim.flash,false);near(aim.recoil,0);near(body.angle,0);near(body.squash,1);near(g.streetReactionVisual(enemy46(g,'brute'),'brute').shear,0);const boss=enemy46(g,'breaker');boss.phase='charge';near(g.streetBossVisual(boss).shear,0);near(g.streetBossVisual(boss).squash,1);g.clearTrace();g.render();assert.ok(!g.drawingTrace().some(c=>c[0]==='set'&&c[1]==='strokeStyle'&&c[2]==='#bba98a'));
});
test('Alpha 0.47 rendering combat feedback is pure and reset/retry/Main release transient state and preserve records',()=>{
 const a=loadGame({seed:4701}),b=loadGame({seed:4701});enterStreet(a);enterStreet(b);for(const g of [a,b]){g.update(.02);g.hitEnemy(enemy46(g,'runner'),1e6)}const snapshot=g=>JSON.stringify({p:g.p,enemies:g.state.enemies,particles:g.state.particles,time:g.state.elapsed,practice:g.practiceSnapshot(),journal:g.journalSaved(),prefs:g.preferencesSaved()});for(let i=0;i<100;i++)a.render();assert.equal(snapshot(a),snapshot(b));for(let i=0;i<30;i++){a.update(.03);b.update(.03)}assert.equal(snapshot(a),snapshot(b));const saved=a.journalSaved(),prefs=a.preferencesSaved();a.pause();a.el('streetReset').click();assert.equal(a.streetCombatSnapshot().defeats.length,0);assert.equal(a.streetCombatSnapshot().shot,null);a.hitEnemy(enemy46(a,'brute'),1e6);a.pause();quitForTest(a);assert.doesNotMatch(JSON.stringify(a.state.runResult),/survivorAim|defeats|reactions|changedAt/);a.advanceClock(500);a.el('again').click();assert.equal(a.streetCombatSnapshot().defeats.length,0);a.pause();quitForTest(a);a.advanceClock(500);a.el('resultMenu').click();assert.equal(a.streetCombatSnapshot().aim,null);assert.equal(a.streetCombatSnapshot().defeats.length,0);assert.equal(a.journalSaved(),saved);assert.equal(a.preferencesSaved(),prefs);a.start();a.hitEnemy(enemy(),20);assert.equal(a.streetCombatSnapshot().defeats.length,0);assert.equal(a.streetCombatSnapshot().shot,null);
});

// Alpha 0.48 — ranks/evolutions share the ordinary random draw, without a reserved slot.
test('Alpha 0.48 every eligible card has comparable frequency, including owned ranks and ready evolutions',()=>{
 const g=loadGame({seed:4801});cleanRun(g);g.setup({level:4});Object.assign(g.p,{arc:1,pierce:3});const pool=g.opts.filter(o=>!o.available||o.available()),counts=new Map(pool.map(o=>[o,0])),before=JSON.stringify({p:g.p,journal:g.journalSaved(),prefs:g.preferencesSaved(),time:g.state.elapsed}),draws=6000;let noWeapon=0;
 for(let i=0;i<draws;i++){const picks=g.upgradeChoices();assert.equal(picks.length,3);assert.equal(new Set(picks).size,3);for(const o of picks){assert.ok(counts.has(o));counts.set(o,counts.get(o)+1)}if(picks.every(o=>!o.weapon&&!o.evolution))noWeapon++}
 const expected=draws*3/pool.length;for(const [o,n] of counts)assert.ok(n>expected*.75&&n<expected*1.25,`${o.name}: ${n} vs expected ${expected}`);assert.ok(noWeapon>0);assert.equal(JSON.stringify({p:g.p,journal:g.journalSaved(),prefs:g.preferencesSaved(),time:g.state.elapsed}),before);
});
test('Alpha 0.48 lightning may appear, repeat by chance or be absent for several draws after acquisition',()=>{
 const g=loadGame({seed:4802});cleanRun(g);earnUpgrade(g);chooseNamed(g,'Chain Lightning');earnUpgrade(g);const seen=[];for(let i=0;i<500;i++)seen.push(g.upgradeChoices().some(o=>o.weapon==='arc'));assert.ok(seen.some(Boolean));assert.ok(seen.some(v=>!v));assert.ok(seen.some((v,i)=>v&&seen[i+1]));assert.ok(seen.some((v,i)=>!v&&seen[i+1]===false&&seen[i+2]===false));assert.equal(g.p.arc,1);
});
test('Alpha 0.48 native bonus rewards use random later choices while preserving XP and reward labels',()=>{
 for(const reward of ['blackout','salvage','rescue','contract','convoy']){let withRank=0,withoutRank=0;for(let seed=1;seed<=30;seed++){const g=loadGame({seed});cleanRun(g);earnUpgrade(g);chooseNamed(g,'Chain Lightning');g.setup({xp:3,bonusChoices:1});g.state.bonusKinds.push(reward);g.checkLevelUp();assert.equal(g.state.upgradeOffer.reward,reward);assert.equal(g.state.xp,3);const picks=g.state.upgradeOffer.picks;assert.equal(picks.length,3);assert.equal(new Set(picks).size,3);if(picks.some(o=>o.weapon==='arc'))withRank++;else withoutRank++}assert.ok(withRank>0&&withoutRank>0,reward)}
});
test('Alpha 0.48 sparse rerolls include the unseen card, remain unique and stop when nothing new exists',()=>{
 const g=loadGame({seed:4803});laterUpgrade(g);const keep=['Chain Lightning','Heavy Rounds','Runner','Velocity'];g.p.arc=1;for(const o of g.opts)if(!keep.includes(o.name))o.available=()=>false;const first=g.upgradeChoices(),next=g.upgradeChoices(first);assert.equal(first.length,3);assert.equal(next.length,3);assert.equal(new Set(next).size,3);assert.ok(next.some(o=>!first.includes(o)));for(const o of g.opts)if(!next.includes(o))o.available=()=>false;assert.equal(g.upgradeChoices(next),null);
});
test('Alpha 0.48 all four paths can reach evolution through actual random level-ups without forced cards',()=>{
 for(const [path,name,evolution] of [['pierce','Piercing Rounds','rail'],['arc','Chain Lightning','thunder'],['blades','Orbiting Blades','reaper'],['molotov','Molotov','wildfire']]){const g=loadGame({seed:4804});cleanRun(g);earnUpgrade(g);chooseNamed(g,name);let skipped=0;for(let i=0;i<100&&!g.p[evolution];i++){earnUpgrade(g);const picks=g.state.upgradeOffer.picks;let index=picks.findIndex(o=>o.weapon===path||o.evolution===evolution);if(index<0){skipped++;index=picks.findIndex(o=>!o.weapon&&!o.evolution);if(index<0)index=0}g.choose(index)}assert.equal(g.p[path],3);assert.equal(g.p[evolution],true,path);assert.ok(skipped>0);assert.equal(g.state.mode,'play')}
});

// Alpha 0.49 — shared world material atlas, static dressing and paused comparison.
test('Alpha 0.49 material atlas preserves original bytes, runtime provenance, isolated cells and the 12 MiB budget',()=>{
 const meta=JSON.parse(readFileSync(join(__dirname,'../dist/assets/environment-materials.json'),'utf8')),asset=JSON.parse(sampleAssetText).environment,source=readFileSync(join(__dirname,'../dist/assets/environment-materials.png')),runtime=readFileSync(join(__dirname,'../dist/assets/environment-materials.webp')),record=JSON.parse(readFileSync(join(__dirname,'../dist/assets/runtime-formats.json'),'utf8')).environment,hash=b=>require('node:crypto').createHash('sha256').update(b).digest('hex');
 assert.equal(hash(source),meta.sha256);assert.equal(hash(runtime),asset.sha256);assert.deepEqual(Buffer.from(asset.src.split(',')[1],'base64'),runtime);assert.equal(source.readUInt32BE(16),1536);assert.equal(source.readUInt32BE(20),1024);assert.equal(record.alpha_exact,true);assert.ok(record.visible_rgb_psnr_db>34);assert.deepEqual(meta.materials,['asphalt','concrete','brick','roof','window','metal']);assert.equal(meta.frames.length,6);
 for(let i=0;i<6;i++){const [x,y,w,h]=meta.frames[i];assert.ok(x>=0&&y>=0&&x+w<=1536&&y+h<=1024);for(let j=0;j<i;j++){const [u,v,a,b]=meta.frames[j];assert.ok(x>=u+a||u>=x+w||y>=v+b||v>=y+h)}}assert.ok(Buffer.byteLength(html)<12*1024*1024);
});
test('Alpha 0.49 isolated environment load failure blocks entry safely and late completion cannot reopen Main',()=>{
 const g=loadGame({artworkStatus:'pending'});g.openHomeEntry('streetOpen');assert.equal(g.pendingImages.length,12);for(const im of g.pendingImages.slice(0,10)){im.naturalWidth=1536;im.naturalHeight=1024;im.onload()}assert.equal(g.el('streetEnter').disabled,true);g.pendingImages[10].onerror();assert.match(g.el('streetAssetStatus').textContent,/could not load/);g.el('streetBack').click();g.el('previewsBack').click();g.resolveArtwork();assert.equal(g.state.mode,'menu');assert.equal(g.state.streetSession,false);assert.equal(Object.keys(g.state.sampleArtwork).length,0);g.start();assert.equal(g.state.training,false);
});
test('Alpha 0.49 facade quads share world projection and actual atlas drawing preserves finite foreground alpha',()=>{
 const g=loadGame({traceCanvas:true});enterStreet(g);const b=g.streetBlocks[0],q=g.streetFaceQuad(b,'front',24,12,94,49),expected=[g.streetProject(b.x+24,b.y+b.h,61),g.streetProject(b.x+118,b.y+b.h,61),g.streetProject(b.x+118,b.y+b.h,12),g.streetProject(b.x+24,b.y+b.h,12)];assert.equal(JSON.stringify(q),JSON.stringify(expected));assert.ok(g.streetMaterialInfo('brick'));assert.equal(g.streetMaterialInfo('missing'),null);
 let faded;for(const x of [-180,0,180,260])for(const y of [-180,0,180,260]){g.p.x=x;g.p.y=y;for(const block of g.streetBlocks)if(g.streetBuildingAlpha(block)<1){faded=block;break}if(faded)break}assert.ok(faded);g.clearTrace();g.drawStreetBuilding(faded);const trace=g.drawingTrace();assert.ok(trace.some(row=>row[0]==='drawImage'&&row[1]===g.state.sampleArtwork.environment.image));for(const row of trace){if(row[0]==='set'&&row[1]==='globalAlpha')assert.ok(Number.isFinite(row[2])&&row[2]>=0&&row[2]<=.22);if(row[0]==='transform')assert.ok(row.slice(1).every(Number.isFinite))}
});
test('Alpha 0.49 same-camera environment comparison freezes gameplay, poses and records and changes only scenery drawing',()=>{
 const g=loadGame({traceCanvas:true});enterStreet(g);g.update(.03);const snapshot=()=>JSON.stringify({p:g.p,enemies:g.state.enemies,bullets:g.state.bullets,time:g.state.elapsed,pose:g.streetMotionFor(g.p),practice:g.practiceSnapshot(),journal:g.journalSaved(),prefs:g.preferencesSaved()}),before=snapshot();g.pause();const environment=g.state.sampleArtwork.environment.image;g.clearTrace();g.render();assert.ok(g.drawingTrace().some(row=>row[0]==='drawImage'&&row[1]===environment));g.el('streetEnvironment').click();assert.equal(g.streetEnvironmentState(),false);assert.equal(g.state.mode,'paused');assert.equal(snapshot(),before);g.clearTrace();g.render();assert.ok(!g.drawingTrace().some(row=>row[0]==='drawImage'&&row[1]===environment));assert.ok(g.drawingTrace().some(row=>row[0]==='drawImage'&&row[1]===g.state.sampleArtwork.street.image));g.el('streetEnvironment').click();assert.equal(g.streetEnvironmentState(),true);assert.equal(snapshot(),before);g.document.hidden=true;g.event('visibilitychange');g.frame(99999);assert.equal(snapshot(),before);
});
test('Alpha 0.49 decorative ground textures and light finish before the native locked attack lane',()=>{
 const g=loadGame({traceCanvas:true});enterStreet(g);Object.assign(g.state.activeBoss,{x:0,y:-150,phase:'warn',chargeX:0,chargeY:1,chargeLength:300});g.clearTrace();g.drawStreetGround();const trace=g.drawingTrace(),warning=trace.findIndex(row=>row[0]==='set'&&row[1]==='strokeStyle'&&row[2]==='#ffad4840');assert.ok(warning>0);const material=g.state.sampleArtwork.environment.image;assert.ok(trace.slice(0,warning).some(row=>row[0]==='drawImage'&&row[1]===material));assert.ok(!trace.slice(warning).some(row=>row[0]==='drawImage'&&row[1]===material));assert.ok(trace.slice(warning).some(row=>row[0]==='moveTo'&&row[1]===0&&row[2]===-150));assert.ok(trace.slice(warning).some(row=>row[0]==='lineTo'&&row[1]===0&&row[2]===150));
});
test('Alpha 0.49 Reduced Effects removes extra floor glows while retaining static materials and identical solid footprints',()=>{
 const g=loadGame({traceCanvas:true});enterStreet(g);const solids=JSON.stringify(g.state.obstacles);g.clearTrace();g.drawStreetGround();const gradCount=()=>g.drawingTrace().filter(row=>row[0]==='set'&&row[1]==='fillStyle'&&row[2]?.radial).length;assert.equal(gradCount(),6);g.state.preferences.reduced=true;g.clearTrace();g.drawStreetGround();assert.equal(gradCount(),0);assert.ok(g.drawingTrace().some(row=>row[0]==='drawImage'&&row[1]===g.state.sampleArtwork.environment.image));assert.equal(JSON.stringify(g.state.obstacles),solids);assert.equal(g.streetDrawQueue().length,17);assert.ok(g.streetDrawQueue().every((row,i,a)=>i===0||a[i-1].depth<=row.depth));
});
test('Alpha 0.49 environment draw work is bounded across phone and browser viewports without consuming gameplay RNG',()=>{
 for(const [width,height] of [[412,915],[915,412],[1920,1080]]){const a=loadGame({seed:4901,width,height,traceCanvas:true}),b=loadGame({seed:4901,width,height});enterStreet(a);enterStreet(b);const snapshot=g=>JSON.stringify({p:g.p,enemies:g.state.enemies,particles:g.state.particles,bullets:g.state.bullets,time:g.state.elapsed,practice:g.practiceSnapshot(),journal:g.journalSaved(),prefs:g.preferencesSaved()});const before=snapshot(a);a.clearTrace();a.render();const count=a.drawingTrace().filter(row=>row[0]==='drawImage'&&row[1]===a.state.sampleArtwork.environment.image).length;assert.ok(count>0&&count<=180,`bounded material draws: ${count}`);for(let i=0;i<12;i++)a.render();assert.equal(snapshot(a),before);a.touch.x=b.touch.x=.4;a.touch.y=b.touch.y=.2;for(let i=0;i<30;i++){a.update(.03);b.update(.03)}assert.equal(snapshot(a),snapshot(b))}
});
test('Alpha 0.49 environment comparison is labelled in benchmarks, resets on new practice and stays out of ordinary play',()=>{
 const g=loadGame();enterStreet(g);g.pause();g.showSettings();g.el('perfReport').click();assert.match(g.benchmarkText(),/Angled intersection prototype · textured environment/);g.el('benchmarkBack').click();g.closeSettings();g.el('streetEnvironment').click();g.showSettings();g.el('perfReport').click();assert.match(g.benchmarkText(),/simple environment/);g.el('benchmarkBack').click();g.closeSettings();g.el('streetReset').click();assert.equal(g.streetEnvironmentState(),true);g.pause();quitForTest(g);g.advanceClock(500);g.el('resultMenu').click();assert.equal(Object.keys(g.state.sampleArtwork).length,0);g.start();assert.equal(g.state.streetSession,false);assert.equal(Object.keys(g.state.sampleArtwork).length,0);
});

// Alpha 0.50 — three primary destinations, nonblocking title art and correct returns.
test('Alpha 0.50 title illustration preserves source/runtime provenance and the existing standalone budget',()=>{
 const asset=JSON.parse(titleAssetText),meta=JSON.parse(readFileSync(join(__dirname,'../dist/assets/title-night.json'),'utf8')),png=readFileSync(join(__dirname,'../dist/assets/title-night.png')),runtime=readFileSync(join(__dirname,'../dist/assets/title-night.webp')),record=JSON.parse(readFileSync(join(__dirname,'../dist/assets/runtime-formats.json'),'utf8')).homeTitle,hash=b=>require('node:crypto').createHash('sha256').update(b).digest('hex');assert.equal(hash(png),meta.sha256);assert.equal(hash(runtime),asset.sha256);assert.deepEqual(Buffer.from(asset.src.split(',')[1],'base64'),runtime);assert.equal(png.readUInt32BE(16),1536);assert.equal(png.readUInt32BE(20),1024);assert.equal(record.alpha_exact,true);assert.ok(record.visible_rgb_psnr_db>34);assert.ok(Buffer.byteLength(html)<12*1024*1024);assert.match(meta.usage,/not a gameplay screenshot/);
});
test('Alpha 0.50 only three primary actions appear on home and every secondary destination remains reachable',()=>{
 const g=loadGame(),markup=g.el('modal').innerHTML,nav=markup.match(/<nav class="title-actions"[\s\S]*?<\/nav>/)[0];assert.equal((nav.match(/<button/g)||[]).length,3);for(const id of ['start','runLog','settingsOpen'])assert.match(nav,new RegExp('id="'+id+'"'));assert.equal(g.el('boot').hidden,true);assert.ok(g.el('previewsOpen'));assert.doesNotMatch(markup,/CHOOSE SURVIVOR|FIRST RELEASE FOUNDATION|FIELD REFERENCES|BACK UP YOUR RECORDS/);
 for(const [id,mode] of [['trainingOpen','training-menu'],['bestiaryOpen','bestiary'],['weaponsOpen','weapons'],['manualOpen','manual'],['backupOpen','backup'],['artOpen','art-menu'],['streetOpen','street-menu']]){const a=loadGame();a.openHomeEntry(id);assert.equal(a.state.mode,mode,id)}
});
test('Alpha 0.50 title art loads once per home visit without gating Play or reviving a departed menu',()=>{
 const g=loadGame({titleStatus:'pending'});assert.equal(g.titleState().status,'loading');assert.equal(g.pendingTitleImages.length,1);g.ensureTitleArtwork();g.ensureTitleArtwork();assert.equal(g.pendingTitleImages.length,1);const late=g.pendingTitleImages[0].onload;g.el('start').dispatch('pointerdown',{pointerId:2});assert.equal(g.state.mode,'roster');assert.equal(g.titleState().status,'idle');assert.equal(g.titleState().visible,false);late();assert.equal(g.state.mode,'roster');assert.equal(g.el('titleArt').style.backgroundImage,'none');g.el('rosterBack').click();assert.equal(g.pendingTitleImages.length,2);g.resolveTitle();assert.equal(g.titleState().status,'ready');assert.match(g.el('titleArt').style.backgroundImage,/data:image\/webp;base64/);g.el('runLog').click();assert.equal(g.titleState().status,'idle');
});
test('Alpha 0.50 title load failure keeps a usable static home with settings and deployment available',()=>{
 const g=loadGame({titleStatus:'error',storageBlocked:true});assert.equal(g.titleState().status,'failed');assert.match(g.el('titleArtStatus').textContent,/Play is ready/);assert.equal(g.el('boot').hidden,true);g.el('settingsOpen').click();assert.equal(g.state.mode,'settings');g.el('settingsBack').click();g.el('start').click();g.el('deploy').click();assert.equal(g.state.mode,'play');assert.equal(g.titleState().visible,false);assert.equal(g.titleState().status,'idle');assert.equal(Object.keys(g.state.sampleArtwork).length,0);
});
test('Alpha 0.50 title motion respects focus, visibility and Reduced Effects and never renders the old horde',()=>{
 const g=loadGame();assert.equal(g.titleState().motion,'on');g.event('blur');assert.equal(g.titleState().motion,'paused');g.event('focus');assert.equal(g.titleState().motion,'on');g.document.hidden=true;g.event('visibilitychange');assert.equal(g.titleState().motion,'paused');g.document.hidden=false;g.event('visibilitychange');assert.equal(g.titleState().motion,'on');const draws=g.drawCount(),time=g.state.elapsed;g.frame(1000);g.frame(2000);assert.equal(g.drawCount(),draws);near(g.state.elapsed,time);const reduced=loadGame({preferencesStored:JSON.stringify({version:1,reduced:true})});assert.equal(reduced.titleState().motion,'still');assert.match(html,/@media\(prefers-reduced-motion:reduce\)/);assert.match(html,/#titleScene\[data-motion=still\]/);assert.match(html,/min-height:44px/);
});
test('Alpha 0.50 Play groups practice and help while preserving the selected setup and deliberate deployment',()=>{
 const g=loadGame();g.el('start').click();g.selectSurvivor('scout');g.selectRoute('park');const before=JSON.stringify({p:g.p,selected:g.state.selectedSurvivor,route:g.state.selectedRoute,journal:g.journalSaved()});g.el('trainingOpen').click();assert.equal(g.state.mode,'training-menu');g.el('trainingBack').click();assert.equal(g.state.mode,'roster');assert.equal(JSON.stringify({p:g.p,selected:g.state.selectedSurvivor,route:g.state.selectedRoute,journal:g.journalSaved()}),before);g.el('rosterGuide').click();assert.equal(g.state.mode,'guide');g.el('guideBack').click();assert.equal(g.state.mode,'roster');assert.equal(g.state.selectedSurvivor,'scout');assert.match(g.el('deploymentSummary').textContent,/Scout.*Memorial Park/);g.el('deploy').click();assert.equal(g.state.mode,'play');
});
test('Alpha 0.50 Journal guides, cross-references and medals return to the filtered Journal without record changes',()=>{
 const g=loadGame();g.el('runLog').click();g.setJournalView('outcome','extracted');const saved=g.journalSaved();assert.match(g.el('modal').innerHTML,/GUIDES &amp; MEDALS/);g.el('bestiaryOpen').click();assert.equal(g.state.bestiaryReturn,'journal');g.el('bestiaryWeapons').click();assert.equal(g.state.mode,'weapons');g.el('weaponsBack').click();assert.equal(g.state.mode,'journal');assert.equal(g.el('logOutcome').value,'extracted');g.el('manualOpen').click();assert.equal(g.state.manualReturn,'journal');g.el('manualBack').click();assert.equal(g.state.mode,'journal');assert.equal(g.el('logOutcome').value,'extracted');assert.equal(g.journalSaved(),saved);g.el('journalBack').click();assert.equal(g.state.mode,'menu');
});
test('Alpha 0.50 Settings contains safe backup navigation but paused Settings cannot begin record restore',()=>{
 const g=loadGame();g.el('settingsOpen').click();const saved=g.journalSaved();g.el('backupOpen').click();assert.equal(g.state.mode,'backup');assert.equal(g.state.backupReturn,'settings');g.el('backupBack').click();assert.equal(g.state.mode,'settings');g.el('settingsBack').click();assert.equal(g.state.mode,'menu');assert.equal(g.journalSaved(),saved);cleanRun(g);g.pause();g.showSettings();assert.equal(g.el('backupOpen'),undefined);g.showBackup();assert.equal(g.state.mode,'settings');g.closeSettings();assert.equal(g.state.mode,'paused');
});
test('Alpha 0.50 development studies stay behind the preview selector and release art on back or Main',()=>{
 const g=loadGame();g.el('previewsOpen').click();assert.equal(g.state.mode,'previews');assert.equal(g.titleState().visible,false);g.el('artOpen').click();assert.equal(g.state.mode,'art-menu');g.el('artBack').click();assert.equal(g.state.mode,'previews');assert.equal(Object.keys(g.state.sampleArtwork).length,0);g.el('streetOpen').click();assert.equal(g.state.mode,'street-menu');assert.equal(Object.keys(g.state.sampleArtwork).length,12);g.el('streetBack').click();assert.equal(g.state.mode,'previews');assert.equal(Object.keys(g.state.sampleArtwork).length,0);g.el('previewsBack').click();assert.equal(g.state.mode,'menu');assert.equal(g.titleState().visible,true);
});
test('Alpha 0.50 title loading and grouped navigation do not consume combat RNG or alter stored records',()=>{
 const a=loadGame({seed:5001,titleStatus:'ready'}),b=loadGame({seed:5001,titleStatus:'pending'}),saved=a.journalSaved(),prefs=a.preferencesSaved();a.el('runLog').click();a.el('manualOpen').click();a.el('manualBack').click();a.el('journalBack').click();a.el('settingsOpen').click();a.el('backupOpen').click();a.el('backupBack').click();a.el('settingsBack').click();a.el('previewsOpen').click();a.el('previewsBack').click();assert.equal(a.journalSaved(),saved);assert.equal(a.preferencesSaved(),prefs);a.start();b.start();for(let i=0;i<90;i++){a.touch.x=b.touch.x=.4;a.touch.y=b.touch.y=.1;a.update(1/30);b.update(1/30)}assert.equal(JSON.stringify({p:a.p,enemies:a.state.enemies,bullets:a.state.bullets}),JSON.stringify({p:b.p,enemies:b.state.enemies,bullets:b.state.bullets}));b.resolveTitle();assert.equal(b.state.mode,'play');assert.equal(b.titleState().visible,false);
});
test('Alpha 0.50 backups entered through finished-run Settings keep the held scene, statistics and record frozen',()=>{
 const g=loadGame();cleanRun(g);g.setup({elapsed:80});g.pause();quitForTest(g);const result=g.state.runResult,saved=g.journalSaved(),record=g.saved(),time=g.state.elapsed;g.showSettings();assert.equal(g.state.settingsReturn,'end');g.el('backupOpen').click();assert.equal(g.state.backupReturn,'settings');const draws=g.drawCount();g.frame(1000);g.update(10);g.frame(2000);assert.equal(g.drawCount(),draws);assert.equal(g.state.runResult,result);assert.equal(g.journalSaved(),saved);assert.equal(g.saved(),record);near(g.state.elapsed,time);g.el('backupBack').click();assert.equal(g.state.mode,'settings');g.el('settingsBack').click();assert.equal(g.state.mode,'end');assert.equal(g.state.runResult,result);
});

// Alpha 0.51 — Android/browser Back, with asynchronous History API boundaries.
test('Alpha 0.51 Back returns each home destination to title and leaves normally only from title',()=>{
 for(const id of ['start','runLog','settingsOpen','previewsOpen']){const g=loadGame();assert.equal(g.historyInfo().pushes,0);g.el(id).click();assert.equal(g.historyInfo().state.lastStandBack,'guard');g.phoneBack();assert.equal(g.state.mode,'menu');assert.equal(g.historyInfo().left,0);assert.equal(g.historyInfo().state.lastStandBack,'home');g.phoneBack();assert.equal(g.historyInfo().left,1)}
 const g=loadGame();g.phoneBack();assert.equal(g.historyInfo().left,1,'fresh title has no exit trap');
});
test('Alpha 0.51 Back follows Play help and Training parents without deploying or changing setup',()=>{
 const g=loadGame();g.el('start').click();g.selectSurvivor('scout');g.selectRoute('park');const saved=g.journalSaved();g.el('trainingOpen').click();g.phoneBack();assert.equal(g.state.mode,'roster');g.el('rosterGuide').click();g.phoneBack();assert.equal(g.state.mode,'roster');assert.equal(g.state.selectedSurvivor,'scout');assert.equal(g.state.selectedRoute,'park');assert.equal(g.journalSaved(),saved);assert.equal(g.state.runLogged,false);g.phoneBack();assert.equal(g.state.mode,'menu');assert.equal(g.historyInfo().left,0);
});
test('Alpha 0.51 Back follows Journal references and saved reviews while retaining filters',()=>{
 const g=loadGame({journalStored:journalData('survivor',{history:[{outcome:'defeated',time:30}]})});g.el('runLog').click();g.setJournalView('outcome','defeated');const saved=g.journalSaved();for(const id of ['bestiaryOpen','weaponsOpen','manualOpen']){g.el(id).click();g.phoneBack();assert.equal(g.state.mode,'journal');assert.equal(g.el('logOutcome').value,'defeated')}
 g.el('bestiaryOpen').click();g.el('bestiaryWeapons').click();g.phoneBack();assert.equal(g.state.mode,'journal','cross-references use their existing Journal parent');g.showSavedRun(0);assert.equal(g.state.mode,'review');g.phoneBack();assert.equal(g.state.mode,'journal');assert.equal(g.state.reviewedRun,null);assert.equal(g.journalSaved(),saved);assert.equal(g.historyInfo().left,0);
});
test('Alpha 0.51 Back cancels reviewed restore before returning through Backup and Settings',()=>{
 const g=loadGame();g.el('settingsOpen').click();g.el('backupOpen').click();const saved=g.journalSaved(),record=g.saved();g.el('backupImport').value=g.backupText();g.reviewBackup();assert.ok(g.state.pendingRestore);g.phoneBack();assert.equal(g.state.mode,'backup');assert.equal(g.state.pendingRestore,null);assert.equal(g.el('backupImport').value,g.backupText());assert.equal(g.journalSaved(),saved);assert.equal(g.saved(),record);g.phoneBack();assert.equal(g.state.mode,'settings');g.el('perfReport').click();assert.equal(g.state.mode,'benchmark');g.phoneBack();assert.equal(g.state.mode,'settings');assert.equal(g.state.benchmarkCapture,null);g.phoneBack();assert.equal(g.state.mode,'menu');assert.equal(g.historyInfo().left,0);
});
test('Alpha 0.51 Back pauses held movement, never resumes on repeat, and paused tools return to Pause',()=>{
 const g=loadGame();cleanRun(g);g.el('stick').dispatch('pointerdown',{pointerId:1,clientX:135.5,clientY:662.5});g.keys.d=true;g.phoneBack();assert.equal(g.state.mode,'paused');assert.equal(g.touch.id,null);assert.equal(g.el('stick').captures.size,0);assert.equal(Object.keys(g.keys).length,0);const time=g.state.elapsed,x=g.p.x;for(let i=0;i<4;i++){g.phoneBack();g.update(1);assert.equal(g.state.mode,'paused');near(g.state.elapsed,time);near(g.p.x,x)}
 for(const [id,mode] of [['pauseSettings','settings'],['pauseManual','manual'],['pauseGuide','guide'],['pauseMap','map']]){g.el(id).click();assert.equal(g.state.mode,mode);g.phoneBack();assert.equal(g.state.mode,'paused');near(g.state.elapsed,time)}g.el('resume').click();assert.equal(g.state.mode,'play');near(g.p.x,x);assert.equal(g.historyInfo().left,0);
});
test('Alpha 0.51 Back closes the field locker without consuming its reward or advancing play',()=>{
 const g=loadGame();cleanRun(g);g.setup({bossesDefeated:1});g.updateLocker();g.p.x=g.state.locker.x;g.p.y=g.state.locker.y;g.pause();g.showLocker();const locker=g.state.locker,rerolls=g.state.rerollsLeft,decoys=g.state.decoyCharges;g.phoneBack();assert.equal(g.state.mode,'paused');assert.equal(g.state.locker,locker);assert.equal(g.state.lockersUsed,0);assert.equal(g.state.rerollsLeft,rerolls);assert.equal(g.state.decoyCharges,decoys);assert.equal(g.historyInfo().left,0);
});
test('Alpha 0.51 Back cannot dismiss, reroll or automatically choose an upgrade',()=>{
 const g=loadGame();cleanRun(g);earnUpgrade(g);const offer=g.state.upgradeOffer,level=g.state.level,xp=g.state.xp,time=g.state.elapsed;for(let i=0;i<5;i++){g.phoneBack();g.frame(1000+i*100);assert.equal(g.state.mode,'upgrade');assert.equal(g.state.upgradeOffer,offer);assert.equal(g.state.level,level);assert.equal(g.state.xp,xp);near(g.state.elapsed,time)}assert.match(g.el('toast').textContent,/CHOOSE AN UPGRADE/);g.choose(0);assert.equal(g.state.mode,'play');assert.equal(g.historyInfo().left,0);
});
test('Alpha 0.51 Back cannot choose extraction, start overtime or lose the run',()=>{
 const g=loadGame();cleanRun(g);g.setup({exitBeacon:{x:0,y:0,r:30},elapsed:180,bossesDefeated:1});g.showExtractionChoice();const p=JSON.stringify(g.p),time=g.state.elapsed;for(let i=0;i<3;i++){g.phoneBack();g.update(2);assert.equal(g.state.mode,'extraction');assert.equal(g.state.overtime,0);assert.equal(g.state.runLogged,false);assert.equal(JSON.stringify(g.p),p);near(g.state.elapsed,time)}chooseExitForTest(g,'extract');assert.equal(g.state.mode,'end');assert.equal(g.state.runResult.outcome,'extracted');assert.equal(g.historyInfo().left,0);
});
test('Alpha 0.51 Back preserves finished results through report, guides and nested backup navigation',()=>{
 const g=loadGame();cleanRun(g);g.setup({elapsed:85});g.pause();quitForTest(g);const result=g.state.runResult,saved=g.journalSaved(),record=g.saved(),time=g.state.elapsed;for(const id of ['endReport','endBestiary','endWeapons','endGuide','endManual']){g.el(id).click();g.phoneBack();assert.equal(g.state.mode,'end');assert.equal(g.state.runResult,result)}g.el('endSettings').click();g.el('backupOpen').click();g.phoneBack();assert.equal(g.state.mode,'settings');g.phoneBack();assert.equal(g.state.mode,'end');g.frame(1000);assert.equal(g.state.runResult,result);near(g.state.elapsed,time);assert.equal(g.journalSaved(),saved);assert.equal(g.saved(),record);g.phoneBack();assert.equal(g.state.mode,'menu');assert.equal(g.historyInfo().left,0);g.phoneBack();assert.equal(g.historyInfo().left,1);
});
test('Alpha 0.51 Back follows preview parents, releases images and pauses live practice',()=>{
 const g=loadGame({artworkStatus:'pending'});g.el('previewsOpen').click();g.el('artOpen').click();g.phoneBack();assert.equal(g.state.mode,'previews');g.resolveArtwork();assert.equal(Object.keys(g.state.sampleArtwork).length,0);g.el('streetOpen').click();g.phoneBack();assert.equal(g.state.mode,'previews');g.phoneBack();assert.equal(g.state.mode,'menu');assert.equal(g.titleState().visible,true);assert.equal(g.historyInfo().left,0);
 const a=loadGame();enterStreet(a);a.phoneBack();assert.equal(a.state.mode,'paused');assert.equal(a.state.training,true);assert.equal(a.state.streetSession,true);assert.equal(a.state.journal.totals.runs,0);a.phoneBack();assert.equal(a.state.mode,'paused');
});
test('Alpha 0.51 history stays bounded across rerenders, on-screen Back, rapid new navigation and Forward',()=>{
 const g=loadGame();for(let i=0;i<30;i++){g.el('runLog').click();g.setJournalView('outcome',i%2?'extracted':'defeated');g.el('manualOpen').click();g.phoneBack();g.el('journalBack').click();assert.equal(g.historyInfo().pending,1);g.el('settingsOpen').click();g.flushHistory();assert.equal(g.state.mode,'settings','cleanup must not close a newly opened menu');g.phoneBack();assert.equal(g.state.mode,'menu');assert.equal(g.historyInfo().left,0);assert.ok(g.historyInfo().length<=3)}assert.equal(g.historyInfo().state.other,'preserved');g.phoneForward();assert.equal(g.state.mode,'menu');assert.equal(g.historyInfo().state.lastStandBack,'home');assert.equal(g.historyInfo().left,0);assert.ok(g.historyInfo().length<=3);g.event('popstate',{state:{foreign:true}});assert.equal(g.state.mode,'menu');
});
test('Alpha 0.51 denied or unavailable History API leaves every on-screen control working',()=>{
 for(const historyMode of ['missing','replace-error','push-error']){const g=loadGame({historyMode,storageBlocked:true});g.el('start').click();assert.equal(g.state.mode,'roster');g.el('rosterBack').click();g.el('settingsOpen').click();g.el('settingsBack').click();g.el('start').click();g.el('deploy').click();g.pause();assert.equal(g.state.mode,'paused');g.el('resume').click();assert.equal(g.state.mode,'play')}
 assert.doesNotMatch(source,/beforeunload|location\.hash|location\.href\s*=|history\.go\(/);
});
test('Alpha 0.51 reload releases an existing guard and pageshow never resumes or duplicates it',()=>{
 const g=loadGame({historyGuard:true});assert.equal(g.state.mode,'menu');g.flushHistory();assert.equal(g.historyInfo().state.lastStandBack,'home');assert.equal(g.historyInfo().left,0);g.el('start').click();const length=g.historyInfo().length;g.event('pageshow',{persisted:true});assert.equal(g.historyInfo().length,length);g.el('deploy').click();g.event('pagehide');assert.equal(g.state.mode,'paused');g.event('pageshow',{persisted:true});assert.equal(g.state.mode,'paused');assert.equal(g.historyInfo().length,length);g.phoneBack();assert.equal(g.state.mode,'paused');
});

// Alpha 0.52 — a composed, truthful HUD in the existing unscored intersection.
test('Alpha 0.52 prototype comparison remains separate from the scored Composed HUD',()=>{
 const g=loadGame();assert.equal(g.el('streetHud').hidden,true);assert.equal(g.el('hud').dataset.presentation,'classic');g.el('start').click();g.el('deploy').click();assert.equal(g.el('streetHud').hidden,false);assert.equal(g.el('touch').dataset.presentation,'run');g.pause();quitForTest(g);g.el('resultMenu').click();g.flushHistory();enterStreet(g);assert.equal(g.el('streetHud').hidden,false);assert.equal(g.el('hud').dataset.presentation,'street');assert.equal(g.el('touch').dataset.presentation,'street');g.pause();assert.ok(g.el('streetHudCompare'));assert.equal(g.el('streetHud').hidden,false);quitForTest(g);assert.equal(g.el('streetHud').hidden,true);assert.equal(g.el('hud').dataset.presentation,'classic');g.el('resultMenu').click();g.flushHistory();g.el('start').click();g.el('deploy').click();assert.equal(g.el('streetHud').hidden,false);assert.equal(g.el('hud').dataset.presentation,'run');assert.equal(g.streetHudState().portrait,null);
});
test('Alpha 0.52 vitals and boss instruments reflect current values with honest disabled practice XP',()=>{
 const g=loadGame();enterStreet(g);g.p.hp=23.4;g.p.max=100;g.setup({xp:7});Object.assign(g.state.activeBoss,{hp:142.2,max:650.1});g.updateHUD();const row=g.streetHudSnapshot();assert.equal(row.health,24);near(row.healthPercent,23.4);assert.equal(g.el('streetHealthText').textContent,'24 / 100');assert.equal(g.el('streetVitals').dataset.health,'low');assert.equal(g.el('streetXpFill').style.width,'0%');assert.equal(g.el('streetXpText').textContent,'XP OFF · PRACTICE');assert.equal(g.el('streetBossHp').textContent,'143 / 651');near(row.boss.percent,100*142.2/650.1);assert.equal(g.el('streetBossFill').style.width,row.boss.percent+'%');assert.equal(g.p.hp,23.4);assert.equal(g.state.xp,7);g.p.hp=100;g.updateHUD();assert.equal(g.el('streetVitals').dataset.health,'normal');
});
test('Alpha 0.52 one task cue follows real Breaker phases and missing boss state without changing attacks',()=>{
 const g=loadGame();enterStreet(g);for(const [phase,cue,status] of [['approach','KEEP MOVING','APPROACHING'],['warn','DODGE THE GOLD LANE','CHARGE WARNING'],['charge','STAY CLEAR','CHARGING'],['recover','OPENING — ATTACK','RECOVERING']]){g.state.activeBoss.phase=phase;const boss=JSON.stringify(g.state.activeBoss);g.updateHUD();assert.equal(g.el('streetThreat').dataset.phase,phase);assert.equal(g.el('streetTaskTitle').textContent,cue);assert.equal(g.el('streetBossState').textContent,status);assert.equal(JSON.stringify(g.state.activeBoss),boss)}g.setup({activeBoss:null});g.updateHUD();assert.equal(g.el('streetThreat').hidden,true);assert.equal(g.el('streetTaskTitle').textContent,'PRACTICE YOUR BUILD');
});
test('Alpha 0.52 portrait reuses decoded survivor artwork once and releases its reference outside the HUD',()=>{
 const g=loadGame({traceCanvas:true});enterStreet(g);const image=g.state.sampleArtwork.intersection.image;assert.equal(g.streetHudState().portrait,image);const draws=()=>g.drawingTrace('streetPortrait').filter(row=>row[0]==='drawImage');assert.equal(draws().length,1);assert.equal(draws()[0][1],image);assert.equal(g.pendingImages.length,12);for(let i=0;i<20;i++)g.updateHUD();assert.equal(draws().length,1);g.pause();g.el('streetHudCompare').click();assert.equal(g.streetHudState().portrait,null);g.el('streetHudCompare').click();assert.equal(draws().length,2);assert.equal(g.streetHudState().portrait,image);quitForTest(g);assert.equal(g.streetHudState().portrait,null);
});
test('Alpha 0.52 paused composed/classic comparison preserves the exact world, practice counters and stored data',()=>{
 const g=loadGame();enterStreet(g);for(let i=0;i<20;i++)g.update(.03);g.pause();const snapshot=()=>JSON.stringify({p:g.p,enemies:g.state.enemies,bullets:g.state.bullets,particles:g.state.particles,time:g.state.elapsed,pose:g.streetMotionFor(g.p),practice:g.practiceSnapshot(),journal:g.journalSaved(),preferences:g.preferencesSaved()}),before=snapshot();for(let i=0;i<6;i++){g.el('streetHudCompare').click();assert.equal(g.state.mode,'paused');assert.equal(g.streetHudState().polished,i%2!==0);assert.equal(g.el('streetHud').hidden,i%2===0);g.update(2);assert.equal(snapshot(),before)}assert.equal(g.historyInfo().left,0);
});
test('Alpha 0.52 HUD choice and repeated instrument refreshes do not consume combat RNG or alter practice outcomes',()=>{
 const a=loadGame({seed:5201}),b=loadGame({seed:5201});enterStreet(a);enterStreet(b);b.pause();b.el('streetHudCompare').click();b.resume();for(let i=0;i<240;i++){a.touch.x=b.touch.x=Math.cos(i/30)*.5;a.touch.y=b.touch.y=Math.sin(i/30)*.5;if(i===70){a.dash();b.dash()}a.update(.03);b.update(.03);a.syncStreetHud();a.syncStreetHud()}
 const snapshot=g=>JSON.stringify({p:g.p,enemies:g.state.enemies,bullets:g.state.bullets,barrels:g.state.barrels,particles:g.state.particles,time:g.state.elapsed,practice:g.practiceSnapshot(),journal:g.journalSaved(),preferences:g.preferencesSaved()});assert.equal(snapshot(a),snapshot(b));
});
test('Alpha 0.52 polished controls preserve second-finger Pause, pointer release and actual Dash cooldown',()=>{
 for(const [width,height,mirrored] of [[412,915,false],[915,412,true]]){const g=loadGame({width,height,preferencesStored:JSON.stringify({version:1,mirrored})});enterStreet(g);g.el('stick').dispatch('pointerdown',{pointerId:1,clientX:135.5,clientY:662.5});g.el('dash').dispatch('pointerdown',{pointerId:2,isPrimary:false});near(g.p.dashCd,2.5);assert.equal(g.touch.id,1);g.updateHUD();assert.equal(g.el('dash').textContent,'2.5s');assert.equal(g.el('dash').attrs['aria-disabled'],'true');g.el('pause').dispatch('pointerdown',{pointerId:3,isPrimary:false});assert.equal(g.state.mode,'paused');assert.equal(g.touch.id,null);assert.equal(g.el('stick').captures.size,0);assert.equal(g.el('hud').attrs['data-mirrored'],String(mirrored));assert.equal(g.el('touch').attrs['data-mirrored'],String(mirrored));const cd=g.p.dashCd;g.update(1);near(g.p.dashCd,cd);g.el('resume').click();assert.equal(g.state.mode,'play');assert.equal(g.el('touch').style.visibility,'visible')}
});
test('Alpha 0.52 phone Back, mirrored settings and backgrounding keep composed practice paused and readable',()=>{
 const g=loadGame();enterStreet(g);g.phoneBack();assert.equal(g.state.mode,'paused');g.el('pauseSettings').click();g.el('pref-mirrored').click();assert.equal(g.el('hud').attrs['data-mirrored'],'true');g.phoneBack();assert.equal(g.state.mode,'paused');assert.equal(g.el('hud').dataset.presentation,'street');g.phoneBack();assert.equal(g.state.mode,'paused');g.el('resume').click();g.event('pagehide');assert.equal(g.state.mode,'paused');const row=JSON.stringify(g.streetHudSnapshot());g.event('pageshow',{persisted:true});g.document.hidden=true;g.event('visibilitychange');g.frame(5000);assert.equal(g.state.mode,'paused');assert.equal(JSON.stringify(g.streetHudSnapshot()),row);
});
test('Alpha 0.52 practice path/evolution displays update and changing drill cleanly restores the original HUD',()=>{
 const g=loadGame();enterStreet(g);g.pause();g.configureTrainingWeapon('arc',true);assert.equal(g.el('streetWeapon').textContent,'Chain Lightning III · EVOLVED');assert.equal(g.el('streetTime').textContent,'00:00');assert.equal(g.el('streetTargets').textContent,'0');g.el('trainingScenarioPick').value='targets';g.el('trainingScenarioPick').dispatch('change');assert.equal(g.state.streetSession,false);assert.equal(g.el('hud').dataset.presentation,'classic');assert.equal(g.el('streetHud').hidden,true);assert.equal(g.streetHudState().portrait,null);assert.equal(g.state.training,true);
});
test('Alpha 0.52 practice counters and clock use current practice data rather than scored run labels',()=>{
 const g=loadGame();enterStreet(g);const target=g.state.enemies.find(e=>!e.bossKind);g.hitEnemy(target,target.hp+1,'GUN');g.setup({elapsed:72.9});g.updateHUD();assert.equal(g.el('streetTime').textContent,'01:12');assert.equal(g.el('streetTargets').textContent,String(g.practiceSnapshot().targets));assert.ok(g.practiceSnapshot().targets>0);assert.equal(g.state.journal.totals.runs,0);assert.equal(g.journalSaved(),null);
});
test('Alpha 0.52 end results and nested backup returns never revive prototype instruments or advance practice',()=>{
 const g=loadGame();enterStreet(g);g.pause();quitForTest(g);const result=g.state.runResult,practice=JSON.stringify(g.practiceSnapshot());assert.equal(g.el('streetHud').hidden,true);g.el('endSettings').click();assert.equal(g.el('streetHud').hidden,true);g.el('backupOpen').click();g.frame(10000);assert.equal(g.el('streetHud').hidden,true);g.phoneBack();g.phoneBack();assert.equal(g.state.mode,'end');assert.equal(g.state.runResult,result);assert.equal(JSON.stringify(g.practiceSnapshot()),practice);assert.equal(g.el('streetHud').hidden,true);
});
test('Alpha 0.52 benchmark records composed/classic HUD context while retaining camera and environment labels',()=>{
 const g=loadGame();enterStreet(g);g.pause();g.showSettings();g.el('perfReport').click();assert.match(g.benchmarkText(),/Angled intersection prototype · textured environment · composed HUD/);g.phoneBack();g.phoneBack();g.el('streetHudCompare').click();g.el('streetEnvironment').click();g.showSettings();g.el('perfReport').click();assert.match(g.benchmarkText(),/simple environment · classic HUD/);g.phoneBack();g.phoneBack();g.el('streetCompare').click();g.showSettings();g.el('perfReport').click();assert.match(g.benchmarkText(),/Intersection · overhead comparison · classic HUD/);g.phoneBack();g.phoneBack();g.el('streetReset').click();assert.equal(g.streetHudState().polished,true);assert.equal(g.el('streetHud').hidden,false);
});
test('Alpha 0.52 scoped responsive styling keeps a single set of controls, safe areas and the standalone budget',()=>{
 for(const id of ['streetHud','streetPortrait','pause','dash','stick'])assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,id);const css=html.match(/<style>([\s\S]*?)<\/style>/)[1];assert.match(css,/#hud:is\(\[data-presentation=street\],\[data-presentation=run\]\) #top/);assert.match(css,/#hud:is\(\[data-presentation=street\],\[data-presentation=run\]\)\[data-mirrored=true\] #streetHeader/);assert.match(css,/@media\(orientation:landscape\) and \(min-width:600px\)/);assert.match(css,/@media\(orientation:portrait\) and \(max-height:700px\)/);assert.match(css,/width:125px;height:125px/);assert.match(css,/width:82px;height:82px/);assert.match(css,/#streetHud\{[^}]*pointer-events:none/);assert.match(css,/top:max\(12px,env\(safe-area-inset-top\)\)/);assert.doesNotMatch(css.slice(css.indexOf('/* Street Prototype:')),/backdrop-filter|animation:|url\(/);assert.ok(Buffer.byteLength(html)<12*1024*1024);assert.match(html,/<button id="pause" aria-label="Pause game">/);
});

// Alpha 0.53 — generated directional Breaker attack keys, native timing and locked aim.
test('Alpha 0.53 attack atlas retains the original source and valid isolated foot-anchored view/pose crops',()=>{
 const meta=JSON.parse(readFileSync(join(__dirname,'../dist/assets/breaker-combat.json'),'utf8')),asset=JSON.parse(sampleAssetText).breakerCombat,source=readFileSync(join(__dirname,'../dist/assets/breaker-combat.png')),runtime=readFileSync(join(__dirname,'../dist/assets/breaker-combat.webp')),record=JSON.parse(readFileSync(join(__dirname,'../dist/assets/runtime-formats.json'),'utf8')).breakerCombat,hash=b=>require('node:crypto').createHash('sha256').update(b).digest('hex');assert.equal(hash(source),meta.sha256);assert.equal(hash(runtime),asset.sha256);assert.deepEqual(Buffer.from(asset.src.split(',')[1],'base64'),runtime);assert.equal(record.source_sha256,meta.sha256);assert.equal(record.alpha_exact,true);assert.equal(record.visible_rgb_alpha_threshold,8);assert.ok(record.visible_rgb_psnr_db>37);assert.deepEqual(meta.views,['east','southeast-front','south-front','northeast-rear','north-rear']);assert.deepEqual(meta.poses,['brace','loaded','stride-a','stride-b','recover']);assert.equal(asset.frames.length,25);assert.equal(source.readUInt32BE(16),meta.width);assert.equal(source.readUInt32BE(20),meta.height);
 for(let i=0;i<25;i++){const [x,y,w,h]=asset.frames[i],[px,py]=asset.pivots[i];assert.ok(x>=0&&y>=0&&w>80&&h>120&&x+w<=meta.width&&y+h<=meta.height);assert.ok(px>=0&&px<=w);assert.equal(py,h);for(let j=0;j<i;j++){const [u,v,a,b]=asset.frames[j];assert.ok(x>=u+a||u>=x+w||y>=v+b||v>=y+h,'isolated crop '+i+'/'+j)}}assert.ok(Buffer.byteLength(html)<12*1024*1024);
});
test('Alpha 0.53 runtime street compression preserves the original source and verified alpha/quality provenance',()=>{
 const asset=JSON.parse(sampleAssetText).street,manifest=JSON.parse(readFileSync(join(__dirname,'../dist/assets/manifest.json'),'utf8')),source=readFileSync(join(__dirname,'../dist/assets/street.png')),runtime=readFileSync(join(__dirname,'../dist/assets/street.webp')),record=JSON.parse(readFileSync(join(__dirname,'../dist/assets/runtime-formats.json'),'utf8')).street,hash=b=>require('node:crypto').createHash('sha256').update(b).digest('hex');assert.equal(hash(source),manifest.assets.street.sha256);assert.equal(hash(source),record.source_sha256);assert.equal(hash(runtime),record.runtime_sha256);assert.equal(hash(runtime),asset.sha256);assert.deepEqual(Buffer.from(asset.src.split(',')[1],'base64'),runtime);assert.equal(record.alpha_exact,true);assert.ok(record.visible_rgb_psnr_db>38);assert.ok(runtime.length<1000000);assert.match(record.encoding,/quality 96/);
});
test('Alpha 0.53 entry waits for the twelfth attack image and stale/error loads cannot revive a departed scene',()=>{
 const g=loadGame({artworkStatus:'pending'});g.openHomeEntry('streetOpen');assert.equal(g.pendingImages.length,12);for(const im of g.pendingImages.slice(0,11)){im.naturalWidth=1536;im.naturalHeight=1024;im.onload()}assert.equal(g.el('streetEnter').disabled,true);g.advanceClock(500);g.el('streetEnter').click();assert.equal(g.state.mode,'street-menu');const attack=g.pendingImages[11];attack.onerror();assert.match(g.el('streetAssetStatus').textContent,/could not load/);g.el('streetBack').click();g.el('previewsBack').click();g.resolveArtwork();assert.equal(g.state.mode,'menu');assert.equal(Object.keys(g.state.sampleArtwork).length,0);assert.equal(attack.onload,null);assert.equal(attack.onerror,null);
});
test('Alpha 0.53 attack direction maps all eight screen headings correctly in both orientations',()=>{
 const columns=[0,1,2,1,0,3,4,3],flips=[1,1,1,-1,-1,-1,1,1];for(const [width,height] of [[412,915],[915,412]])for(let direction=0;direction<8;direction++){const g=loadGame({width,height});enterStreet(g);const e=g.state.activeBoss,v=g.streetDirection(Math.cos(direction*Math.PI/4),Math.sin(direction*Math.PI/4));Object.assign(e,{chargeX:v.x,chargeY:v.y});for(const [phase,time,row] of [['warn',.8,0],['charge',.44,2],['recover',1.1,4]]){Object.assign(e,{phase,phaseTime:time});g.advanceStreetAnimations(.01);const info=g.streetActorInfo(e,'breaker');assert.equal(info.asset,'breakerCombat');assert.equal(info.index,row*5+columns[direction]);assert.equal(info.flip,flips[direction]);assert.equal(g.streetMotionFor(e).bossDirection,direction)}}
});
test('Alpha 0.53 warn, charge and recovery keep their locked facing as the player crosses behind',()=>{
 for(let direction=0;direction<8;direction++){const g=loadGame();enterStreet(g);const e=g.state.activeBoss,v=g.streetDirection(Math.cos(direction*Math.PI/4),Math.sin(direction*Math.PI/4));Object.assign(e,{chargeX:v.x,chargeY:v.y});for(const phase of ['warn','charge','recover']){e.phase=phase;e.phaseTime=phase==='recover'?1.1:.4;let expected;for(const [x,y] of [[-500,-500],[500,500],[-500,500],[500,-500]]){g.p.x=x;g.p.y=y;g.advanceStreetAnimations(.01);const row=g.streetBreakerPose(e,g.streetMotionFor(e));if(expected)assert.equal(JSON.stringify(row),expected);else expected=JSON.stringify(row);assert.equal(row.direction,direction)}}}
});
test('Alpha 0.53 brace/load keys follow native windup progress and never rewrite boss fields',()=>{
 const g=loadGame();enterStreet(g);const e=g.state.activeBoss;Object.assign(e,{phase:'warn',chargeX:1,chargeY:0});for(const [time,row] of [[.8,0],[.6,0],[.4,1],[.01,1]]){e.phaseTime=time;const before=JSON.stringify(e);g.advanceStreetAnimations(.01);assert.equal(Math.floor(g.streetFrame(e,'breaker')/5),row);assert.equal(JSON.stringify(e),before)}assert.ok(g.streetMotionFor(e).blend<=.09);
});
test('Alpha 0.53 charge alternates planted strides by actual phase progress rather than render calls',()=>{
 const g=loadGame();enterStreet(g);const e=g.state.activeBoss;Object.assign(e,{phase:'charge',chargeX:1,chargeY:0});for(const [fraction,row] of [[.9,2],[.7,3],[.4,2],[.1,3]]){e.phaseTime=.44*fraction;g.advanceStreetAnimations(.01);assert.equal(Math.floor(g.streetFrame(e,'breaker')/5),row);near(g.streetMotionFor(e).blend,.035);const pose=JSON.stringify(g.streetMotionFor(e).pose);for(let i=0;i<8;i++)g.render();assert.equal(JSON.stringify(g.streetMotionFor(e).pose),pose)}
});
test('Alpha 0.53 late recovery blends from landing to brace before the native approach resumes',()=>{
 const g=loadGame();enterStreet(g);const e=g.state.activeBoss;Object.assign(e,{phase:'recover',phaseTime:1.1,chargeX:0,chargeY:-1});g.advanceStreetAnimations(.01);assert.equal(Math.floor(g.streetFrame(e,'breaker')/5),4);g.setup({elapsed:.8});e.phaseTime=.3;g.advanceStreetAnimations(.01);assert.equal(Math.floor(g.streetFrame(e,'breaker')/5),0);near(g.streetMotionFor(e).blend,.3);assert.equal(e.phase,'recover');near(e.phaseTime,.3);g.setup({elapsed:.95});const info=g.streetActorInfo(e,'breaker');assert.equal(info.layers.length,2);near(info.layers.reduce((n,row)=>n+row.weight,0),1);assert.ok(info.layers.every(row=>row.weight>0&&row.weight<1));g.moveBoss(e,.31);assert.equal(e.phase,'approach');
});
test('Alpha 0.53 transition layers retain their own facing and common foot/height reference',()=>{
 const g=loadGame({traceCanvas:true});enterStreet(g);const e=g.state.activeBoss;stepEnemy46(g,e,-12,0);const old=g.streetMotionFor(e).facing;assert.equal(old,-1);Object.assign(e,{phase:'warn',phaseTime:.8,chargeX:1,chargeY:0});g.setup({elapsed:g.state.elapsed+.03});g.advanceStreetAnimations(.01);g.setup({elapsed:g.state.elapsed+.04});const info=g.streetActorInfo(e,'breaker');assert.equal(info.layers.length,2);assert.equal(info.layers[0].flip,-1);assert.equal(info.layers[1].flip,1);for(const layer of info.layers){near(-layer.pivot[1]*layer.scale+layer.crop[3]*layer.scale,0);assert.ok(layer.scale>0&&Number.isFinite(layer.scale))}g.clearTrace();g.render();assert.ok(g.drawingTrace().some(row=>row[0]==='scale'&&row[1]===-1));const scale=info.scale;for(const phase of ['warn','charge','recover']){e.phase=phase;e.phaseTime=phase==='recover'?1.1:.4;g.advanceStreetAnimations(.01);near(g.streetActorInfo(e,'breaker').scale,scale)}
});
test('Alpha 0.53 collision against a wall enters the same recovery while the visual retains the charge heading',()=>{
 const g=loadGame();enterStreet(g);const e=g.state.activeBoss;Object.assign(e,{x:-140,y:-280,phase:'charge',phaseTime:.38,chargeX:-1,chargeY:0,chargeLength:360});g.p.fireClock=Infinity;g.advanceStreetAnimations(.001);g.update(.035);assert.equal(e.phase,'recover');near(e.x,-140);near(e.phaseTime,1.1);assert.equal(Math.floor(g.streetFrame(e,'breaker')/5),4);const motion=g.streetMotionFor(e);assert.ok(motion.impact);assert.equal(motion.bossDirection,g.streetBreakerPose(e,motion).direction);
});
test('Alpha 0.53 Pause, Back and background freeze all directional pose progress and blend weights',()=>{
 const g=loadGame();enterStreet(g);const e=g.state.activeBoss;Object.assign(e,{phase:'warn',phaseTime:.3,chargeX:0,chargeY:-1});g.advanceStreetAnimations(.01);const snapshot=()=>JSON.stringify({motion:g.streetMotionFor(e),phase:e.phase,time:e.phaseTime,elapsed:g.state.elapsed,layers:g.streetActorInfo(e,'breaker').layers.map(row=>({index:row.index,weight:row.weight,flip:row.flip}))}),before=snapshot();g.phoneBack();g.update(5);g.advanceStreetAnimations(5);g.frame(9999);g.phoneBack();g.event('pagehide');assert.equal(g.state.mode,'paused');assert.equal(snapshot(),before);
});
test('Alpha 0.53 Reduced Effects preserves all directional keys while removing crossfades and extra body transforms',()=>{
 const g=loadGame();enterStreet(g);g.state.preferences.reduced=true;const e=g.state.activeBoss;for(let direction=0;direction<8;direction++){const v=g.streetDirection(Math.cos(direction*Math.PI/4),Math.sin(direction*Math.PI/4));Object.assign(e,{phase:'charge',phaseTime:.2,chargeX:v.x,chargeY:v.y});g.advanceStreetAnimations(.01);const info=g.streetActorInfo(e,'breaker'),visual=g.streetBossVisual(e);assert.equal(info.layers.length,1);assert.equal(g.streetMotionFor(e).blend,0);assert.equal(g.streetMotionFor(e).bossDirection,direction);near(visual.squash,1);near(visual.shear,0)}
});
test('Alpha 0.53 lethal attacks retain only a value snapshot of the correct pose and award practice credit immediately',()=>{
 const g=loadGame();enterStreet(g);const e=g.state.activeBoss;Object.assign(e,{phase:'charge',phaseTime:.2,chargeX:-1,chargeY:0});g.advanceStreetAnimations(.01);const pose={...g.streetMotionFor(e).pose},flip=g.streetMotionFor(e).facing,targets=g.practiceSnapshot().targets;g.hitEnemy(e,1e6,'GUN');assert.ok(e.hp<=0);assert.equal(g.gunTarget()===e,false);assert.equal(g.practiceSnapshot().targets,targets+1);const body=g.streetCombatSnapshot().defeats.find(b=>b.kind==='breaker');assert.equal(JSON.stringify(body.pose),JSON.stringify(pose));assert.equal(body.flip,flip);assert.equal(Object.keys(body.pose).sort().join(','),'asset,frame');assert.equal(g.state.killCount,0);assert.equal(g.state.gems.length,0);g.pause();quitForTest(g);g.el('resultMenu').click();assert.equal(g.streetCombatSnapshot().defeats.length,0);assert.equal(Object.keys(g.state.sampleArtwork).length,0);
});
test('Alpha 0.53 directional rendering is pure, preserves seeded combat and resets cleanly on another practice',()=>{
 const a=loadGame({seed:5301}),b=loadGame({seed:5301});enterStreet(a);enterStreet(b);const snapshot=g=>JSON.stringify({p:g.p,enemies:g.state.enemies,particles:g.state.particles,bullets:g.state.bullets,time:g.state.elapsed,practice:g.practiceSnapshot(),journal:g.journalSaved(),prefs:g.preferencesSaved()});for(let i=0;i<250;i++){a.touch.x=b.touch.x=Math.cos(i/40)*.4;a.touch.y=b.touch.y=Math.sin(i/40)*.4;a.update(.03);b.update(.03);if(i%5===0){a.render();a.render()}}assert.equal(snapshot(a),snapshot(b));a.pause();a.el('streetReset').click();assert.equal(a.streetMotionFor(a.state.activeBoss).previous,null);assert.equal(a.streetCombatSnapshot().defeats.length,0);a.pause();quitForTest(a);a.el('resultMenu').click();a.start();assert.equal(a.state.streetSession,false);assert.equal(Object.keys(a.state.sampleArtwork).length,0);
});

// Alpha 0.54 — session-only representative-scene trials and existing held phone report.
function enterTrial54(g,id,measure=false){g.openHomeEntry('streetOpen');g.el('streetTrialPick').value=id;g.el('streetTrialPick').dispatch('change');g.el('streetMeasure').checked=measure;g.advanceClock(500);g.el('streetEnter').click();assert.equal(g.state.mode,'play');assert.equal(g.streetTrialState().active,id)}
function trialWorld54(g){return JSON.stringify({p:g.p,enemies:g.state.enemies,bullets:g.state.bullets,particles:g.state.particles,time:g.state.elapsed,practice:g.practiceSnapshot(),journal:g.journalSaved(),prefs:g.preferencesSaved()})}
test('Alpha 0.54 trial selection is explicit, session-only and does not start or change a run',()=>{
 const g=loadGame();const saved=g.journalSaved(),prefs=g.preferencesSaved();g.openHomeEntry('streetOpen');assert.equal(g.el('streetTrialPick').value,'standard');assert.equal(g.el('streetMeasure').checked,false);assert.match(g.el('modal').innerHTML,/Crowd.*Evolved Effects/);g.el('streetTrialPick').value='effects';g.el('streetTrialPick').dispatch('change');assert.equal(g.streetTrialState().choice,'effects');assert.equal(g.state.mode,'street-menu');assert.equal(g.state.elapsed,0);assert.equal(g.state.training,false);assert.equal(g.journalSaved(),saved);assert.equal(g.preferencesSaved(),prefs);g.phoneBack();assert.equal(g.state.mode,'previews');g.el('streetOpen').click();assert.equal(g.el('streetTrialPick').value,'effects');assert.equal(g.state.mode,'street-menu');
});
test('Alpha 0.54 each preset starts with fixed valid slots and the native Breaker without extra image decodes',()=>{
 for(const id of ['standard','crowd','effects']){const g=loadGame();enterTrial54(g,id);const slots=id==='standard'?6:24;assert.equal(g.state.enemies.length,slots+1);assert.equal(g.state.enemies.filter(e=>!!e.bossKind).length,1);const crowd=g.state.enemies.filter(e=>!e.bossKind);assert.equal(new Set(crowd.map(e=>e.streetSlot)).size,slots);for(const e of crowd){assert.equal(e.hp,e.type===2?160:90);assert.equal(e.speed,e.type===1?85:45);assert.ok(Number.isFinite(e.x)&&Number.isFinite(e.y));for(const block of g.streetBlocks)assert.ok(g.pointRectDistance(e,block)>=e.r)}assert.equal(g.pendingImages.length,12);assert.equal(g.p.hp,100);assert.equal(g.state.training,true);assert.match(g.el('streetTrialLabel').textContent,/UNSCORED/)}
});
test('Alpha 0.54 Evolved Effects applies only existing rank-three evolutions and labels the real build',()=>{
 const g=loadGame();enterTrial54(g,'effects');for(const e of g.evolutions){assert.equal(g.p[e.weapon],3);assert.equal(g.p[e.field],true)}assert.equal(g.state.trainingEvolved,true);assert.equal(g.el('streetWeapon').textContent,'ALL FOUR PATHS · EVOLVED');assert.equal(g.el('streetXpText').textContent,'XP OFF · PRACTICE');assert.equal(g.state.journal.totals.runs,0);g.pause();assert.match(g.el('modal').innerHTML,/id="trainingEvolution">EVOLUTION: ON/);assert.match(g.el('modal').innerHTML,/Single-weapon changes or resets switch/);
});
test('Alpha 0.54 measured and unmeasured Standard trials produce identical seeded gameplay',()=>{
 const a=loadGame({seed:5401}),b=loadGame({seed:5401});enterTrial54(a,'standard',true);enterTrial54(b,'standard',false);for(let i=1;i<=180;i++){a.touch.x=b.touch.x=Math.cos(i/40)*.5;a.touch.y=b.touch.y=Math.sin(i/40)*.5;a.frame(i*16);b.frame(i*16)}assert.equal(trialWorld54(a),trialWorld54(b));assert.ok(a.performanceSnapshot().frames>0);assert.equal(b.performanceSnapshot().frames,0);
});
test('Alpha 0.54 crowd/effect trials keep bounded live slots, safe health, native effect limits and zero records',()=>{
 for(const id of ['crowd','effects']){const g=loadGame();const saved=g.journalSaved(),prefs=g.preferencesSaved();enterTrial54(g,id);for(let i=0;i<450;i++){g.touch.x=Math.cos(i/50)*.5;g.touch.y=Math.sin(i/50)*.5;if(i%100===0)g.dash();g.update(1/30);const live=g.state.enemies.filter(e=>e.hp>0);assert.ok(live.length<=25);assert.ok(live.filter(e=>e.bossKind).length<=1);assert.equal(new Set(live.filter(e=>!e.bossKind).map(e=>e.streetSlot)).size,live.filter(e=>!e.bossKind).length);assert.ok(g.state.bullets.length<=g.limits.bullets);assert.ok(g.state.particles.length<=g.limits.particles);assert.equal(g.state.mode,'play');near(g.p.hp,100)}assert.equal(g.state.xp,0);assert.equal(g.state.killCount,0);assert.equal(g.journalSaved(),saved);assert.equal(g.preferencesSaved(),prefs);assert.equal(g.state.journal.totals.runs,0)}
});
test('Alpha 0.54 changing the paused trial selection preserves the live scene until Restart',()=>{
 const g=loadGame();enterTrial54(g,'standard',true);g.frame(16);g.frame(32);g.pause();const before=trialWorld54(g),frames=g.performanceSnapshot().frames;const old=g.el('streetTrialPick');old.value='effects';old.dispatch('change');assert.equal(g.streetTrialState().active,'standard');assert.equal(g.streetTrialState().choice,'effects');assert.equal(trialWorld54(g),before);assert.equal(g.performanceSnapshot().frames,frames);g.el('streetHudCompare').click();assert.equal(g.el('streetTrialPick').value,'effects');old.value='crowd';old.dispatch('change');assert.equal(g.streetTrialState().choice,'effects');assert.equal(g.state.mode,'paused');g.el('streetReset').click();assert.equal(g.streetTrialState().active,'effects');assert.equal(g.state.enemies.length,25);
});
test('Alpha 0.54 restarting a trial resets setup, practice and measurements while preserving the measuring opt-in',()=>{
 const g=loadGame();enterTrial54(g,'effects',true);g.frame(16);g.frame(32);g.p.x=100;g.hitEnemy(g.state.enemies.find(e=>!e.bossKind),1e6,'GUN');assert.ok(g.practiceSnapshot().targets>0);g.pause();g.el('streetEnvironment').click();g.el('streetHudCompare').click();g.el('streetTrialPick').value='crowd';g.el('streetTrialPick').dispatch('change');g.el('streetReset').click();assert.equal(g.streetTrialState().active,'crowd');assert.equal(g.state.elapsed,0);near(g.p.x,0);near(g.p.y,70);assert.equal(g.practiceSnapshot().targets,0);assert.equal(g.performanceSnapshot().frames,0);assert.equal(g.performanceSnapshot().enabled,true);assert.equal(g.streetEnvironmentState(),true);assert.equal(g.streetHudState().polished,true);assert.equal(g.state.streetAngled,true);assert.equal(g.p.pierce,3);assert.equal(g.p.rail,false);assert.equal(g.p.arc,0);assert.equal(g.state.enemies.length,25);
});
test('Alpha 0.54 quick report holds actual trial/build/settings and measured frame data and downloads exact text',async()=>{
 const g=loadGame();enterTrial54(g,'effects',true);g.frame(16);g.frame(32);g.frame(64);g.pause();g.el('streetEnvironment').click();g.el('streetHudCompare').click();const before=trialWorld54(g),saved=g.journalSaved(),prefs=g.preferencesSaved();g.el('streetReport').click();assert.equal(g.state.mode,'benchmark');assert.equal(g.state.benchmarkCapture.returnTo,'paused');assert.ok(Object.isFrozen(g.state.benchmarkCapture.trial));assert.equal(g.state.benchmarkCapture.trial.id,'effects');const captured=g.state.benchmarkCapture;g.el('benchmarkDevice').value='S21 Ultra · Brave';g.el('benchmarkNotes').value='Gold lane readable; no obvious hitch <img>';g.el('benchmarkNotes').dispatch('input');const report=g.el('benchmarkText').value;assert.match(report,/Scene trial: Evolved Effects · 24 infected slots \+ Breaker · safe HP · unscored/);assert.match(report,/simple environment · classic HUD/);assert.match(report,/Railstorm.*Thunderweb.*Reaper Ring.*Wildfire/);assert.match(report,/Measured intervals: 2/);assert.doesNotMatch(g.el('modal').innerHTML,/Gold lane readable/);g.frame(99999);assert.equal(g.state.benchmarkCapture,captured);assert.equal(trialWorld54(g),before);g.el('benchmarkDownload').click();assert.equal(await g.downloads()[0].text(),report);g.phoneBack();assert.equal(g.state.mode,'paused');assert.equal(g.journalSaved(),saved);assert.equal(g.preferencesSaved(),prefs);assert.equal(trialWorld54(g),before);
});
test('Alpha 0.54 reports with measurement off show unavailable values rather than invented performance',()=>{
 const g=loadGame();enterTrial54(g,'crowd');g.pause();g.el('streetReport').click();const text=g.benchmarkText();assert.match(text,/Scene trial: Crowd · 24 infected slots/);assert.match(text,/Measuring at capture: OFF/);assert.match(text,/Measured intervals: 0/);assert.match(text,/Capture average: Unavailable/);assert.doesNotMatch(text,/NaN|Infinity/);g.phoneBack();g.el('resume').click();g.update(.02);assert.equal(g.state.mode,'play');
});
test('Alpha 0.54 quick report breaks the frame segment without including time spent paused',()=>{
 const g=loadGame();enterTrial54(g,'standard',true);g.frame(16);g.frame(32);g.pause();g.el('streetReport').click();g.phoneBack();g.advanceClock(100000);g.el('resume').click();g.frame(100048);g.frame(100064);const row=g.performanceSnapshot();assert.equal(row.frames,2);near(row.seconds,.032);near(row.maxMs,16);
});
test('Alpha 0.54 a single-weapon change leaves Effects for a truthful Crowd trial and restart restores the selected preset',()=>{
 const g=loadGame();enterTrial54(g,'effects');g.pause();g.configureTrainingWeapon('arc',true);assert.equal(g.streetTrialState().active,'crowd');assert.equal(g.streetTrialState().choice,'crowd');assert.equal(g.p.arc,3);assert.equal(g.p.thunder,true);assert.equal(g.p.pierce,0);assert.equal(g.p.blades,0);assert.equal(g.p.molotov,0);assert.equal(g.el('streetWeapon').textContent,'Chain Lightning III · EVOLVED');assert.match(g.el('modal').innerHTML,/Restart preset:/);g.el('streetTrialPick').value='effects';g.el('streetTrialPick').dispatch('change');g.el('streetReset').click();assert.equal(g.streetTrialState().active,'effects');for(const e of g.evolutions)assert.equal(g.p[e.field],true);
});
test('Alpha 0.54 invalid, hidden and stale trial actions cannot restart a scene or begin a report',()=>{
 const g=loadGame();g.openHomeEntry('streetOpen');const picker=g.el('streetTrialPick');picker.value='constructor';picker.dispatch('change');assert.equal(g.streetTrialState().choice,'standard');g.startStreetPrototype('constructor');assert.equal(g.state.mode,'street-menu');g.document.hidden=true;g.startStreetPrototype('effects');assert.equal(g.state.mode,'street-menu');g.document.hidden=false;g.advanceClock(500);g.el('streetEnter').click();g.pause();const report=g.el('streetReport');g.document.hidden=true;report.click();assert.equal(g.state.mode,'paused');g.document.hidden=false;quitForTest(g);const result=g.state.runResult;report.click();g.captureStreetReport();assert.equal(g.state.mode,'end');assert.equal(g.state.runResult,result);
});
test('Alpha 0.54 trial choice can be made during artwork loading but entry stays gated and Back stays safe',()=>{
 const g=loadGame({artworkStatus:'pending'});g.openHomeEntry('streetOpen');g.el('streetTrialPick').value='effects';g.el('streetTrialPick').dispatch('change');g.advanceClock(500);g.el('streetEnter').click();assert.equal(g.state.mode,'street-menu');assert.equal(g.pendingImages.length,12);g.phoneBack();assert.equal(g.state.mode,'previews');g.resolveArtwork();assert.equal(g.state.mode,'previews');assert.equal(Object.keys(g.state.sampleArtwork).length,0);g.phoneBack();assert.equal(g.state.mode,'menu');assert.equal(g.historyInfo().left,0);
});
test('Alpha 0.54 leaving trials never carries powers, targets or trial metadata into scored play and records',()=>{
 const g=loadGame();const saved=g.journalSaved(),prefs=g.preferencesSaved();enterTrial54(g,'effects');g.pause();quitForTest(g);const result=g.state.runResult;assert.equal(result.training,true);assert.equal(g.journalSaved(),saved);assert.equal(g.preferencesSaved(),prefs);g.el('endSettings').click();g.el('perfReport').click();g.frame(99999);assert.equal(g.state.runResult,result);g.phoneBack();g.phoneBack();g.el('resultMenu').click();g.el('start').click();g.el('deploy').click();assert.equal(g.state.training,false);assert.equal(g.state.streetSession,false);for(const e of g.evolutions){assert.equal(g.p[e.weapon],0);assert.equal(g.p[e.field],false)}assert.equal(g.el('streetHud').hidden,false);assert.equal(g.el('hud').dataset.presentation,'run');g.pause();assert.equal(g.el('streetReport'),undefined);g.showSettings();g.showBenchmark();assert.equal(g.state.benchmarkCapture.trial,null);assert.doesNotMatch(g.benchmarkText(),/Scene trial:/);assert.doesNotMatch(g.backupText(),/streetTrial|STREET_TRIALS/);
});
test('Alpha 0.54 opt-in state clears stale readouts, remains temporary, and controls retain native labels',()=>{
 const g=loadGame();enterTrial54(g,'standard',true);g.frame(16);g.frame(1032);assert.equal(g.el('performanceHud').style.display,'block');g.pause();quitForTest(g);g.el('resultMenu').click();g.openHomeEntry('streetOpen');assert.equal(g.el('streetMeasure').checked,true);g.el('streetMeasure').checked=false;g.advanceClock(500);g.el('streetEnter').click();assert.equal(g.state.diagnostics.enabled,false);assert.equal(g.el('performanceHud').style.display,'none');assert.equal(loadGame().state.diagnostics.enabled,false);assert.match(html,/label for="streetTrialPick"/);assert.match(html,/class="street-measure"><input type="checkbox" id="streetMeasure"/);assert.ok(Buffer.byteLength(html)<12*1024*1024);
});

// Alpha 0.55 — reviewed field instruments in real scored runs, with Classic fallback.
test('Alpha 0.55 default scored HUD shows true values and never loads practice artwork',()=>{
 const g=loadGame({preferencesStored:JSON.stringify({version:1,actors:'classic'})});assert.equal(g.el('streetHud').hidden,true);g.el('start').click();g.el('deploy').click();assert.equal(g.el('hud').dataset.presentation,'run');assert.equal(g.el('touch').dataset.presentation,'run');assert.equal(g.el('streetHud').hidden,false);assert.equal(g.el('streetSafetyText').textContent,'HP');assert.equal(g.el('streetClockLabel').textContent,'SURVIVE');assert.equal(g.el('streetCountLabel').textContent,' ELIMS');assert.equal(g.el('streetHealthText').textContent,'100 / 100');assert.equal(g.el('streetXpText').textContent,'LV 1 · 0 / 8 XP');assert.equal(g.el('runBadge').textContent,'SU');assert.equal(g.pendingImages.length,0);assert.equal(Object.keys(g.state.sampleArtwork).length,0);assert.equal(g.streetHudState().portrait,null);assert.match(g.el('streetTaskTitle').textContent,/EXIT IN 03:00/);assert.doesNotMatch(g.el('streetSafetyText').textContent,/SAFE/);
});
test('Alpha 0.55 each survivor and run rule uses its actual name, badge, HP and profile without new powers',()=>{
 const badges=['SU','SC','BU','EN','SA','TA','QM','CO'];for(let i=0;i<8;i++){const g=loadGame({preferencesStored:JSON.stringify({version:1,actors:'classic'})});g.showRoster();const role=g.survivors[i];g.selectSurvivor(role.id);g.selectRule('glass');g.start();assert.equal(g.el('streetSurvivorName').textContent,role.name.toUpperCase());assert.equal(g.el('runBadge').textContent,badges[i]);assert.equal(g.el('streetHealthText').textContent,Math.round(role.hp*.8)+' / '+Math.round(role.hp*.8));assert.equal(g.p.max,Math.round(role.hp*.8));assert.equal(g.pendingImages.length,0);assert.equal(g.p.arc,0);assert.equal(g.state.training,false)}
});
test('Alpha 0.55 live health, low-health tone, compact XP/counters and accessible exact progress stay accurate',()=>{
 const g=loadGame();cleanRun(g);g.p.hp=22.4;g.setup({xp:1234,nextXp:2500,level:12,elapsed:167.9,killCount:23601});g.updateHUD();assert.equal(g.el('streetHealthText').textContent,'23 / 100');assert.equal(g.el('streetVitals').dataset.health,'low');assert.equal(g.el('streetHealthTrack').attrs['aria-valuenow'],'22.4');near(parseFloat(g.el('streetHealthFill').style.width),22.4);near(parseFloat(g.el('streetXpFill').style.width),49.36);assert.equal(g.el('streetXpText').textContent,'LV 12 · 1.2K / 2.5K XP');assert.equal(g.el('streetXpTrack').attrs['aria-valuetext'],'Level 12 · 1234 / 2500 XP');assert.equal(g.el('streetTime').textContent,'02:47');assert.equal(g.el('streetTargets').textContent,'23.6K');g.pause();assert.match(g.el('modal').innerHTML,/1234 \/ 2500 XP · 23601 eliminations/);assert.equal(g.p.hp,22.4);
});
test('Alpha 0.55 queued upgrades stay deliberate while the composed HUD reflects the real level and XP',()=>{
 const g=loadGame();cleanRun(g);g.setup({xp:80});g.checkLevelUp();const offer=g.state.upgradeOffer,time=g.state.elapsed;assert.equal(g.state.mode,'upgrade');assert.equal(g.el('hud').dataset.presentation,'run');assert.equal(g.el('streetHud').hidden,false);assert.match(g.el('streetXpText').textContent,new RegExp('LV '+g.state.level+' ·'));g.frame(99999);assert.equal(g.state.upgradeOffer,offer);assert.equal(g.state.mode,'upgrade');near(g.state.elapsed,time);g.phoneBack();assert.equal(g.state.upgradeOffer,offer);g.choose(0);assert.ok(['play','upgrade'].includes(g.state.mode));
});
test('Alpha 0.55 all three boss bars and warning cues read the actual boss state and native labels',()=>{
 for(const kind of ['breaker','warden','harvester']){const g=loadGame();cleanRun(g);g.spawnBoss(kind);const boss=g.state.activeBoss;Object.assign(boss,{hp:245.5,max:910,phase:'warn'});g.updateHUD();assert.equal(g.el('streetThreat').hidden,false);assert.equal(g.el('streetThreat').dataset.kind,kind);assert.equal(g.el('streetBossTrack').hidden,false);assert.equal(g.el('streetBossHp').textContent,'246 / 910');near(parseFloat(g.el('streetBossFill').style.width),100*245.5/910);assert.match(g.el('streetBossState').textContent,kind==='breaker'?/DODGE THE LINE/:kind==='warden'?/DODGE BLUE LANES/:/LEAVE PULSE CIRCLE/);assert.equal(g.el('streetBossTrack').attrs['aria-valuenow'],'246');const before=JSON.stringify(boss);g.runHudSnapshot();g.syncStreetHud();assert.equal(JSON.stringify(boss),before)}
});
test('Alpha 0.55 boss arrival and Blackout warnings remain explicit with no invented health bar',()=>{
 const g=loadGame();cleanRun(g);g.setup({elapsed:85,nextBossAt:90});g.updateEncounter();g.updateHUD();assert.equal(g.el('streetThreat').dataset.kind,'incoming');assert.equal(g.el('streetBossTrack').hidden,true);assert.match(g.el('streetBossState').textContent,/PREPARE/);const h=loadGame();cleanRun(h);h.scheduleRush(10);h.setup({elapsed:6});h.updateRush(.01);h.updateHUD();assert.equal(h.el('streetThreat').dataset.kind,'blackout');assert.match(h.el('streetBossState').textContent,/BLACKOUT IN/);assert.equal(h.el('streetBossTrack').hidden,true);h.setup({elapsed:10});h.updateRush(.01);h.updateHUD();assert.match(h.el('streetBossState').textContent,/BLACKOUT RUSH/);
});
test('Alpha 0.55 extraction, Stay/overtime and held results use the existing goal truth and never resume implicitly',()=>{
 const g=loadGame();prepareExit(g);g.updateHUD();assert.equal(g.el('streetTaskTitle').textContent,g.el('runGoal').textContent);assert.match(g.el('streetTaskTitle').textContent,/EXTRACT = VICTORY/);g.showExtractionChoice();assert.equal(g.el('streetHud').hidden,false);const time=g.state.elapsed;g.update(20);near(g.state.elapsed,time);chooseExitForTest(g,'stay');g.updateHUD();assert.equal(g.state.overtime,1);assert.match(g.el('streetTaskTitle').textContent,/NEXT EXIT IN 01:00/);assert.equal(g.el('streetTaskTitle').textContent,g.el('runGoal').textContent);const h=loadGame();prepareExit(h);h.showExtractionChoice();chooseExitForTest(h,'extract');const result=h.state.runResult;assert.equal(h.el('streetHud').hidden,true);h.showSettings();h.selectRunHud('classic');h.selectRunHud('composed');assert.equal(h.el('streetHud').hidden,true);h.frame(99999);h.closeSettings();assert.equal(h.state.runResult,result);assert.equal(h.state.mode,'end');
});
test('Alpha 0.55 selected and relevant optional goals stay readable and all native status rows remain in Pause',()=>{
 const g=loadGame();cleanRun(g);g.p.hp=70;g.setup({supplyCache:{x:600,y:0,r:20,until:50},salvage:{x:0,y:500,r:110,progress:2,until:40,entered:true},supplyDrop:{x:-600,y:0,r:21,phase:'signal',readyAt:20,until:70}});g.updateHUD();assert.match(g.el('streetTaskHint').textContent,/OPTIONAL · MED/);g.pause();g.selectObjective('drop');g.resume();g.updateHUD();assert.match(g.el('streetTaskHint').textContent,/OPTIONAL · DROP/);const rows=g.runHudRows();g.pause();const markup=g.el('modal').innerHTML;for(const row of rows)assert.ok(markup.includes(row.text),row.id);g.el('dropGoal').textContent='<img src=x onerror=bad()> & forged';g.selectRunHud('classic');assert.match(g.el('modal').innerHTML,/&lt;img src=x onerror=bad\(\)&gt; &amp; forged/);assert.doesNotMatch(g.el('modal').innerHTML,/<img src=x/);g.selectRunHud('composed');g.resume();g.setup({supplyDrop:null});g.update(.001);assert.equal(g.state.objectiveFocus,'auto');assert.match(g.el('streetTaskHint').textContent,/MED/);
});
test('Alpha 0.55 contract and chosen medal progress use existing counts and remain separate from rewards',()=>{
 const g=loadGame();g.showRoster();g.selectContract('demolition');cleanRun(g);g.setup({barrelsBlown:2});g.pause();g.selectTrackedMedal('fuel');g.resume();g.updateHUD();const before=JSON.stringify(g.currentRunStats());assert.match(g.el('runHudContract').textContent,/2\//);assert.match(g.el('runHudMedal').textContent,/2\/5 Demolition/);assert.equal(g.el('runHudMeta').hidden,false);assert.equal(g.el('runHudMedal').attrs.title,g.el('runHudMedal').textContent);for(let i=0;i<20;i++)g.runHudSnapshot();assert.equal(JSON.stringify(g.currentRunStats()),before);
});
test('Alpha 0.55 Classic choice persists in preferences and switches a paused scene without changing combat',()=>{
 const g=loadGame();cleanRun(g);g.update(.02);g.pause();const before=JSON.stringify({p:g.p,enemies:g.state.enemies,time:g.state.elapsed,xp:g.state.xp,journal:g.journalSaved()});g.el('runHudCompare').click();assert.equal(g.state.preferences.hud,'classic');assert.equal(g.el('hud').dataset.presentation,'classic');assert.equal(g.el('streetHud').hidden,true);assert.equal(g.state.mode,'paused');assert.equal(JSON.stringify({p:g.p,enemies:g.state.enemies,time:g.state.elapsed,xp:g.state.xp,journal:g.journalSaved()}),before);const next=loadGame({preferencesStored:g.preferencesSaved()});next.start();assert.equal(next.el('hud').dataset.presentation,'classic');g.el('runHudCompare').click();assert.equal(g.el('hud').dataset.presentation,'run');assert.equal(g.state.mode,'paused');assert.equal(JSON.stringify({p:g.p,enemies:g.state.enemies,time:g.state.elapsed,xp:g.state.xp,journal:g.journalSaved()}),before);
});
test('Alpha 0.55 HUD preference validates old/new/future storage and never overwrites protected or blocked saves',()=>{
 for(const hud of [false,55,'<img>','prototype',null]){const g=loadGame({preferencesStored:JSON.stringify({version:1,hud})});assert.equal(g.state.preferences.hud,'composed')}for(const options of [{storageBlocked:true},{writeBlocked:true},{preferencesStored:JSON.stringify({version:99,hud:'classic',keep:'future'})}]){const g=loadGame(options),raw=g.preferencesSaved();g.showSettings();g.el('runHudStyle').value='classic';g.el('runHudStyle').dispatch('change');assert.equal(g.state.preferences.hud,'classic');assert.equal(g.preferencesSaved(),raw);g.closeSettings();g.start();assert.equal(g.el('hud').dataset.presentation,'classic')}
});
test('Alpha 0.55 stale/hidden/invalid style inputs cannot switch presentation or change live play',()=>{
 const g=loadGame();g.showSettings();const old=g.el('runHudStyle');g.selectRunHud('classic');old.value='composed';old.dispatch('change');assert.equal(g.state.preferences.hud,'classic');g.document.hidden=true;g.el('runHudStyle').value='composed';g.el('runHudStyle').dispatch('change');assert.equal(g.state.preferences.hud,'classic');g.document.hidden=false;g.selectRunHud('broken');assert.equal(g.state.preferences.hud,'classic');g.closeSettings();g.start();const before=JSON.stringify(g.p);g.selectRunHud('composed');assert.equal(g.state.preferences.hud,'classic');assert.equal(JSON.stringify(g.p),before);
});
test('Alpha 0.55 composed and Classic scored HUDs have identical seeded combat, upgrade draws and run accounting',()=>{
 const a=loadGame({seed:5501}),b=loadGame({seed:5501,preferencesStored:JSON.stringify({version:1,hud:'classic'})});a.start();b.start();for(let i=0;i<1500;i++){while(a.state.mode==='upgrade'){assert.equal(b.state.mode,'upgrade');assert.equal(JSON.stringify(a.state.upgradeOffer.picks.map(o=>o.name)),JSON.stringify(b.state.upgradeOffer.picks.map(o=>o.name)));a.choose(0);b.choose(0)}if(a.state.mode!=='play')break;a.touch.x=b.touch.x=Math.cos(i/45)*.6;a.touch.y=b.touch.y=Math.sin(i/45)*.6;if(i%90===0){a.dash();b.dash()}a.update(1/30);b.update(1/30);a.runHudSnapshot();a.syncStreetHud()}const snapshot=g=>JSON.stringify({p:g.p,enemies:g.state.enemies,bullets:g.state.bullets,particles:g.state.particles,time:g.state.elapsed,xp:g.state.xp,kills:g.state.killCount,journal:g.journalSaved(),weapons:g.state.weaponLedger,timeline:g.state.runTimeline});assert.equal(snapshot(a),snapshot(b));
});
test('Alpha 0.55 second-finger Pause, Dash and Back retain real input/cooldown behavior on the new run controls',()=>{
 const g=loadGame();cleanRun(g);g.el('stick').dispatch('pointerdown',{pointerId:1,clientX:135.5,clientY:662.5});g.el('dash').dispatch('pointerdown',{pointerId:2,isPrimary:false});near(g.p.dashCd,2.5);g.el('pause').dispatch('pointerdown',{pointerId:3,isPrimary:false});assert.equal(g.state.mode,'paused');assert.equal(g.touch.id,null);assert.equal(g.el('stick').captures.size,0);const time=g.state.elapsed;g.phoneBack();assert.equal(g.state.mode,'paused');g.showSettings();g.el('pref-mirrored').click();g.phoneBack();assert.equal(g.state.mode,'paused');assert.equal(g.el('hud').attrs['data-mirrored'],'true');g.event('pagehide');g.update(10);near(g.state.elapsed,time);g.el('resume').click();assert.equal(g.state.mode,'play');assert.equal(g.el('touch').dataset.presentation,'run');
});
test('Alpha 0.55 composed screen-edge markers avoid both utility docks and thumb controls in supported phone views',()=>{
 const overlap=(a,b)=>a.l<b.r&&a.r>b.l&&a.t<b.b&&a.b>b.t;for(const [width,height] of [[412,915],[320,568],[915,412],[600,320],[550,300]])for(const mirrored of [false,true]){const g=loadGame({width,height,preferencesStored:JSON.stringify({version:1,mirrored})});cleanRun(g);const utilityX=mirrored?20:width-118,stickX=mirrored?width-153:28,dashX=mirrored?28:width-110,boxes=[{l:utilityX,r:utilityX+98,t:height-252,b:height-208},{l:utilityX,r:utilityX+98,t:height-198,b:height-154},{l:stickX,r:stickX+125,t:height-155,b:height-30},{l:dashX,r:dashX+82,t:height-134,b:height-52}];for(const [dx,dy] of [[0,-3000],[3000,0],[0,3000],[-3000,0],[3000,3000],[-3000,-3000]]){const mark=g.screenMarker(dx,dy),label={l:mark.x-30,r:mark.x+30,t:mark.y-34,b:mark.y+18};assert.ok(mark.x>=0&&mark.x<=width&&mark.y>=0&&mark.y<=height);assert.ok(Math.hypot(mark.x-width/2,mark.y-height/2)>=60);assert.ok(boxes.every(b=>!overlap(label,b)),`${width}x${height} mirrored=${mirrored} ${dx},${dy}`)}const axes=[[0,-3000],[3000,0],[0,3000],[-3000,0]].map(([dx,dy])=>g.screenMarker(dx,dy));assert.equal(new Set(axes.map(m=>m.x+','+m.y)).size,4,'opposite directions must retain distinct marker positions')}
});
test('Alpha 0.55 no new images/canvases load for ordinary play, title failure or all eight loadouts',()=>{
 const g=loadGame({titleStatus:'error',artworkStatus:'error',preferencesStored:JSON.stringify({version:1,actors:'classic'})});g.start();g.update(.02);assert.equal(g.el('hud').dataset.presentation,'run');assert.equal(g.pendingImages.length,0);assert.equal(g.streetHudState().portrait,null);g.pause();quitForTest(g);g.el('resultMenu').click();g.openHomeEntry('streetOpen');assert.equal(g.el('streetEnter').disabled,true);g.phoneBack();g.phoneBack();g.start();assert.equal(g.pendingImages.length,12);assert.equal(Object.keys(g.state.sampleArtwork).length,0);assert.equal(g.el('hud').dataset.presentation,'run');
});
test('Alpha 0.55 prototype HUD comparison stays session-only and independent of the scored HUD preference',()=>{
 const g=loadGame();g.showSettings();g.selectRunHud('classic');g.closeSettings();enterTrial54(g,'effects');assert.equal(g.el('hud').dataset.presentation,'street');const prefs=g.preferencesSaved();g.pause();g.el('streetHudCompare').click();assert.equal(g.el('hud').dataset.presentation,'classic');assert.equal(g.preferencesSaved(),prefs);g.el('streetHudCompare').click();assert.equal(g.el('streetSafetyText').textContent,'HP SAFE');assert.equal(g.el('streetClockLabel').textContent,'PRACTICE');assert.equal(g.el('streetCountLabel').textContent,' TARGETS');quitForTest(g);g.el('resultMenu').click();g.start();assert.equal(g.el('hud').dataset.presentation,'classic');assert.equal(g.state.training,false);
});
test('Alpha 0.55 benchmarks identify the actual scored HUD and existing capture/reset parents remain frozen',()=>{
 const g=loadGame();cleanRun(g);g.pause();g.showSettings();g.showBenchmark();assert.match(g.benchmarkText(),/Presentation at capture: Composed run HUD/);const time=g.state.elapsed;g.phoneBack();g.selectRunHud('classic');g.showBenchmark();assert.match(g.benchmarkText(),/Presentation at capture: Classic/);g.frame(99999);near(g.state.elapsed,time);g.phoneBack();g.phoneBack();assert.equal(g.state.mode,'paused');
});
test('Alpha 0.55 finishing, reporting, settings and backup never revive the composed live HUD or alter held results',()=>{
 const g=loadGame();cleanRun(g);g.setup({elapsed:123,killCount:99});g.pause();quitForTest(g);const result=g.state.runResult,saved=g.journalSaved();for(const id of ['endSettings','endReport','endManual']){g.el(id).click();if(g.state.mode==='settings'){g.selectRunHud('classic');g.selectRunHud('composed')}assert.equal(g.el('streetHud').hidden,true);g.phoneBack();assert.equal(g.state.mode,'end');assert.equal(g.state.runResult,result)}g.el('endBackup').click();g.frame(99999);assert.equal(g.el('streetHud').hidden,true);g.phoneBack();assert.equal(g.state.runResult,result);assert.equal(g.journalSaved(),saved);assert.doesNotMatch(g.backupText(),/"hud"/);g.el('again').click();assert.equal(g.el('hud').dataset.presentation,'run');assert.equal(g.state.elapsed,0);
});
test('Alpha 0.55 run HUD keeps optional metadata out of tiny landscape action space and uses existing input targets',()=>{
 const css=html.match(/<style>([\s\S]*?)<\/style>/)[1];for(const id of ['pause','dash','stick','streetHud','runBadge','runHudMeta'])assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,id);assert.match(css,/#hud\[data-presentation=run\] #streetPortrait,#hud\[data-presentation=run\] #streetLoadout\{display:none\}/);assert.match(css,/@media\(orientation:landscape\) and \(max-width:599px\)/);assert.match(css,/width:125px;height:125px/);assert.match(css,/width:82px;height:82px/);assert.match(css,/#streetHud\{[^}]*pointer-events:none/);assert.ok(Buffer.byteLength(html)<12*1024*1024);
});

// Alpha 0.56 — native overhead camera with scored-run actor artwork.
function fieldWorld56(g){const s=g.state;return JSON.parse(JSON.stringify({p:g.p,elapsed:s.elapsed,enemies:s.enemies,bullets:s.bullets,gems:s.gems,obstacles:s.obstacles,barrels:s.barrels,barricades:s.barricades,killCount:s.killCount,xp:s.xp,level:s.level,ledger:s.weaponLedger,tally:s.enemyTally,journal:s.journal}))}
test('Alpha 0.56 field art defaults on only at normal deployment and loads five existing sheets under 32 MiB',()=>{
 const g=loadGame();assert.equal(g.state.preferences.actors,'field');assert.equal(g.pendingImages.length,0);g.el('start').click();assert.equal(g.pendingImages.length,0);g.el('deploy').click();assert.equal(g.fieldActorsActive(),true);assert.equal(g.pendingImages.length,5);assert.ok(g.pendingImages.every(image=>image.onload===null&&image.onerror===null));assert.equal(Object.keys(g.state.sampleArtwork).length,0);assert.equal(g.state.streetSession,false);assert.equal(g.state.training,false);assert.equal(g.p.arc,0);assert.equal(g.p.hp,100);const data=JSON.parse(sampleAssetText),ids=Object.keys(g.fieldState().rows);assert.deepEqual(ids,['survivorWalk','survivorAim','shamblerWalk','runnerRun','bruteWalk']);assert.equal(ids.reduce((n,id)=>n+data[id].width*data[id].height*4,0),29231176);assert.ok(html.length<12*1024*1024);
});
test('Alpha 0.56 pending art activates atomically without blocking controls or advancing native state',()=>{
 const g=loadGame({artworkStatus:'pending'});cleanRun(g);assert.equal(g.fieldActorsActive(),false);assert.equal(g.fieldState().status,'loading');g.touch.x=1;g.update(.02);assert.ok(g.p.x>0);g.pause();const world=fieldWorld56(g);for(const image of g.pendingImages.slice(0,4)){image.naturalWidth=1122;image.naturalHeight=1402;image.onload()}assert.equal(g.fieldActorsActive(),false);assert.match(g.el('fieldArtStatus').textContent,/Loading/);const last=g.pendingImages[4];last.naturalWidth=1122;last.naturalHeight=1402;last.onload();assert.equal(g.fieldActorsActive(),true);assert.match(g.el('fieldArtStatus').textContent,/ready/);assert.deepEqual(fieldWorld56(g),world);assert.equal(g.state.mode,'paused');
});
test('Alpha 0.56 decode errors, zero-size images and missing metadata preserve Classic playable fallback',()=>{
 for(const failure of ['error','zero','metadata']){const g=loadGame({artworkStatus:failure==='error'?'error':'pending',traceCanvas:true});if(failure==='metadata')g.el('sampleAssets').textContent='{}';cleanRun(g);if(failure==='zero'){const image=g.pendingImages[0];image.naturalWidth=0;image.naturalHeight=0;image.onload()}assert.equal(g.fieldState().status,'failed');assert.equal(g.fieldActorsActive(),false);g.render();assert.ok(g.drawingTrace().some(row=>row[0]==='arc'));g.touch.x=1;g.update(.02);assert.ok(g.p.x>0);g.pause();assert.match(g.fieldArtStatus(),/unavailable.*Classic/);assert.equal(Object.keys(g.fieldState().rows).length,0)}
});
test('Alpha 0.56 stale art callbacks cannot revive ended, Classic or replacement caches',()=>{
 const g=loadGame({artworkStatus:'pending'});cleanRun(g);const old=g.pendingImages.slice(),lateLoad=old[0].onload,lateError=old[0].onerror;g.pause();g.selectFieldActors('classic');assert.equal(g.fieldState().status,'idle');assert.ok(old.every(image=>image.onload===null&&image.onerror===null));g.selectFieldActors('field');const replacement=g.fieldState();lateLoad();lateError();assert.equal(g.fieldState(),replacement);assert.equal(g.fieldState().status,'loading');quitForTest(g);assert.equal(g.fieldState().status,'idle');g.resolveArtwork();assert.equal(g.fieldState().status,'idle');assert.equal(g.state.mode,'end');g.advanceClock(500);g.el('again').click();assert.equal(g.state.mode,'play');assert.equal(g.fieldState().status,'loading');assert.equal(g.state.elapsed,0);
});
test('Alpha 0.56 Classic comparison and Settings selection preserve the exact frozen run and persist independently of HUD',()=>{
 const g=loadGame();cleanRun(g);g.spawnEnemy();g.update(.02);g.pause();const world=fieldWorld56(g);g.el('fieldActorCompare').click();assert.equal(g.fieldActorsActive(),false);assert.equal(g.state.preferences.actors,'classic');assert.equal(g.state.preferences.hud,'composed');assert.equal(g.state.mode,'paused');assert.deepEqual(fieldWorld56(g),world);g.showSettings();g.el('fieldActorStyle').value='field';g.el('fieldActorStyle').dispatch('change');assert.equal(g.fieldActorsActive(),true);assert.equal(g.state.mode,'settings');assert.deepEqual(fieldWorld56(g),world);assert.equal(JSON.parse(g.preferencesSaved()).actors,'field');const fresh=loadGame({preferencesStored:g.preferencesSaved()});fresh.start();assert.equal(fresh.fieldActorsActive(),true);
});
test('Alpha 0.56 old, invalid, future and blocked preferences retain protected storage semantics',()=>{
 for(const value of [undefined,'invalid',false,23]){const g=loadGame({preferencesStored:JSON.stringify({version:1,actors:value,hud:'classic',musicVolume:19})});assert.equal(g.state.preferences.actors,'field');assert.equal(g.state.preferences.hud,'classic');assert.equal(g.state.preferences.musicVolume,19)}const raw=JSON.stringify({version:99,actors:'classic',secretFutureField:'retain'}),future=loadGame({preferencesStored:raw});future.start();future.pause();future.selectFieldActors('classic');assert.equal(future.preferencesSaved(),raw);for(const storageBlocked of [true,false]){const g=loadGame({storageBlocked,writeBlocked:true});g.start();g.pause();g.selectFieldActors('classic');assert.equal(g.state.preferences.available,false);assert.equal(g.state.preferences.actors,'classic');assert.equal(g.state.mode,'paused')}
});
test('Alpha 0.56 stale, hidden and invalid actor selectors cannot change live gameplay',()=>{
 const g=loadGame();cleanRun(g);const owner=g.fieldState();g.selectFieldActors('classic');assert.equal(g.fieldState(),owner);g.pause();g.selectFieldActors('invalid');assert.equal(g.fieldState(),owner);g.showSettings();const stale=g.el('fieldActorStyle');g.closeSettings();stale.value='classic';stale.dispatch('change');assert.equal(g.state.preferences.actors,'field');g.document.hidden=true;g.selectFieldActors('classic');assert.equal(g.state.preferences.actors,'field');assert.equal(g.state.mode,'paused');
});
test('Alpha 0.56 walking reads distance and all eight screen headings for each common actor',()=>{
 for(const kind of ['survivor','shambler','runner','brute'])for(let direction=0;direction<8;direction++){const g=loadGame();cleanRun(g);const e=kind==='survivor'?g.p:enemy({x:200,y:100,speed:50,type:['shambler','runner','brute'].indexOf(kind)});g.setup({enemies:kind==='survivor'?[]:[e]});g.advanceFieldActors(.02);const before=g.fieldActorInfo(e,kind).motion.travel,angle=direction*Math.PI/4;e.x+=Math.cos(angle)*10;e.y+=Math.sin(angle)*10;g.advanceFieldActors(.02);const info=g.fieldActorInfo(e,kind);assert.equal(info.motion.direction,direction);near(info.motion.travel,before+10);assert.equal(info.motion.moving,true);assert.equal(Math.floor(info.motion.pose.frame/4),[0,3,4,3,0,1,2,1][direction]);assert.equal(info.motion.flip,[1,1,1,-1,-1,-1,1,1][direction]);assert.ok(info.layers.every(layer=>layer.scale>0))}
});
test('Alpha 0.56 stationary and teleported bodies do not invent walk travel and paused poses stay frozen',()=>{
 const g=loadGame();cleanRun(g);const e=enemy({x:200,speed:50});g.setup({enemies:[e]});g.advanceFieldActors(.02);g.advanceFieldActors(.02);assert.equal(g.fieldActorInfo(e,'shambler').motion.moving,false);assert.equal(g.fieldActorInfo(e,'shambler').motion.travel,0);e.x+=2000;g.advanceFieldActors(.02);assert.equal(g.fieldActorInfo(e,'shambler').motion.travel,0);assert.equal(g.fieldActorInfo(e,'shambler').motion.moving,false);g.pause();const held=JSON.stringify(g.fieldActorInfo(e,'shambler').motion);e.x+=1;g.advanceFieldActors(.02);assert.equal(JSON.stringify(g.fieldActorInfo(e,'shambler').motion),held);g.frame(100000);assert.equal(JSON.stringify(g.fieldActorInfo(e,'shambler').motion),held);
});
test('Alpha 0.56 survivor legs follow movement while the upper body aims independently during a retreat',()=>{
 const g=loadGame({traceCanvas:true});cleanRun(g);const target=enemy({x:200,hp:1000,max:1000});g.setup({enemies:[target]});g.advanceFieldActors(.02);g.p.x-=10;g.advanceFieldActors(.02);const info=g.fieldActorInfo(g.p,'survivor');assert.equal(info.motion.direction,4);assert.equal(info.motion.aim.direction,0);assert.equal(info.motion.flip,-1);assert.equal(info.motion.aim.flip,1);g.clearTrace();g.drawFieldActor(g.el('game').getContext('2d'),g.p,'survivor');const trace=g.drawingTrace();assert.ok(trace.some(row=>row[0]==='clip'));assert.ok(trace.filter(row=>row[0]==='drawImage').length>=2);assert.equal(trace.some(row=>row[0]==='rotate'),false);for(let direction=0;direction<8;direction++){const a=direction*Math.PI/4;target.x=g.p.x+Math.cos(a)*200;target.y=g.p.y+Math.sin(a)*200;g.advanceFieldActors(.02);const aim=g.fieldActorInfo(g.p,'survivor').motion.aim;assert.equal(aim.direction,direction);assert.equal(aim.row,[0,3,4,3,0,1,2,1][direction]);assert.equal(aim.flip,[1,1,1,-1,-1,-1,1,1][direction])}
});
test('Alpha 0.56 common gait phases are staggered and scales use fixed per-view foot pivots',()=>{
 const g=loadGame();cleanRun(g);const bodies=Array.from({length:6},(_,i)=>enemy({x:200+i*30,type:0}));g.setup({enemies:bodies});g.advanceFieldActors(.02);for(const e of bodies)e.x+=10;g.advanceFieldActors(.02);assert.ok(new Set(bodies.map(e=>g.fieldActorInfo(e,'shambler').motion.pose.frame)).size>1);const data=JSON.parse(sampleAssetText);for(const e of bodies){const info=g.fieldActorInfo(e,'shambler'),row=Math.floor(info.motion.pose.frame/4);near(info.scale,49/data.shamblerWalk.referenceHeights[row]);assert.deepEqual(Array.from(info.pivot),data.shamblerWalk.pivots[info.motion.pose.frame])}
});
test('Alpha 0.56 Reduced Effects keeps the current pose and suppresses extra blend layers',()=>{
 const g=loadGame();cleanRun(g);g.advanceFieldActors(.02);g.p.x+=20;g.advanceFieldActors(.02);assert.equal(g.fieldActorInfo(g.p,'survivor').layers.length,2);g.state.preferences.reduced=true;assert.equal(g.fieldActorInfo(g.p,'survivor').layers.length,1);g.advanceFieldActors(.02);assert.equal(g.fieldActorInfo(g.p,'survivor').motion.previous,null);assert.equal(g.fieldActorInfo(g.p,'survivor').motion.aim.previous,null);
});
test('Alpha 0.56 all eight survivor roles keep native stats and their actual ground-ring color',()=>{
 for(const role of loadGame().survivors){const g=loadGame({traceCanvas:true});g.showRoster();g.selectSurvivor(role.id);g.start();assert.equal(g.p.max,role.hp);assert.equal(g.p.speed,role.speed);g.clearTrace();g.drawFieldActor(g.el('game').getContext('2d'),g.p,'survivor');assert.ok(g.drawingTrace().some(row=>row[0]==='set'&&row[1]==='strokeStyle'&&row[2]===role.color));assert.equal(g.p.arc,0);assert.equal(g.p.blades,0)}
});
test('Alpha 0.56 bosses, specialists, rush hunters, convoy and Bestiary portraits retain native appearances',()=>{
 const field=loadGame({traceCanvas:true}),classic=loadGame({traceCanvas:true,preferencesStored:JSON.stringify({version:1,actors:'classic'})});cleanRun(field);cleanRun(classic);for(const extra of [{bossKind:'breaker'},{bossKind:'warden'},{bossKind:'harvester'},{spitter:true,phase:'aim'},{riot:true,phase:'guard',faceX:1,faceY:0},{howler:true,phase:'idle'},{lobber:true,phase:'idle'},{rush:true}]){const e=enemy(extra);assert.equal(field.fieldEnemyKind(e),null);field.clearTrace();classic.clearTrace();field.renderEnemy(e);classic.renderEnemy(e);assert.deepEqual(field.drawingTrace(),classic.drawingTrace())}for(const type of [0,1,2]){const e=enemy({type});field.clearTrace();classic.clearTrace();field.renderEnemy(e,field.el('game').getContext('2d'),true);classic.renderEnemy(e,classic.el('game').getContext('2d'),true);assert.deepEqual(field.drawingTrace(),classic.drawingTrace())}
});
test('Alpha 0.56 dense actor state remains bounded by live entities and offscreen image draws are culled',()=>{
 const g=loadGame({traceCanvas:true,width:915,height:412});cleanRun(g);const bodies=Array.from({length:239},(_,i)=>enemy({x:i<15?-200+i*25:3000+i*10,y:100,type:i%3,speed:25}));g.setup({enemies:bodies});g.advanceFieldActors(.02);for(const e of bodies)e.x+=1;g.advanceFieldActors(.02);const world=fieldWorld56(g);g.clearTrace();for(const e of bodies)g.renderEnemy(e);assert.ok(g.drawingTrace().filter(row=>row[0]==='drawImage').length<=30);assert.deepEqual(fieldWorld56(g),world);assert.equal(typeof g.fieldState().motion.get,'function');assert.equal(g.fieldState().serial,240);
});
test('Alpha 0.56 art choices preserve seeded combat, RNG upgrade draws, native collision and run accounting',()=>{
 const field=loadGame({seed:5678}),classic=loadGame({seed:5678,preferencesStored:JSON.stringify({version:1,actors:'classic'})});for(const g of [field,classic]){cleanRun(g);g.keys.d=true;for(let i=0;i<20;i++)g.spawnEnemy();for(let i=0;i<180;i++){if(i===30)g.dash();g.update(.02);g.render()}g.keys.d=false}assert.deepEqual(fieldWorld56(field),fieldWorld56(classic));assert.deepEqual(JSON.parse(JSON.stringify(field.upgradeChoices())),JSON.parse(JSON.stringify(classic.upgradeChoices())));assert.equal(field.state.streetAngled,true);assert.equal(field.state.streetSession,false);
});
test('Alpha 0.56 animation stays paused through upgrades, extraction, Back and background return',()=>{
 const g=loadGame();cleanRun(g);g.advanceFieldActors(.02);g.keys.d=true;g.update(.02);g.keys.d=false;for(const action of ['back','upgrade','extraction','background']){if(g.state.mode==='paused')g.resume();if(action==='back')g.phoneBack();if(action==='upgrade'){g.setup({xp:8});g.checkLevelUp()}if(action==='extraction'){g.setup({exitBeacon:{x:100,y:0,r:24}});g.showExtractionChoice()}if(action==='background'){g.document.hidden=true;g.event('visibilitychange')}const time=g.state.elapsed,pose=JSON.stringify(g.fieldActorInfo(g.p,'survivor').motion);g.frame(500000);near(g.state.elapsed,time);assert.equal(JSON.stringify(g.fieldActorInfo(g.p,'survivor').motion),pose);if(action==='upgrade')g.choose(0);if(action==='extraction')g.stayAfterDark();if(action==='background'){g.document.hidden=false;g.event('visibilitychange');assert.equal(g.state.mode,'paused')}}
});
test('Alpha 0.56 held results release actor references and Retry creates fresh assets without carrying powers',()=>{
 const g=loadGame();cleanRun(g);const images=g.pendingImages.slice();g.end('abandoned');const result=g.state.runResult;assert.equal(g.fieldState().status,'idle');assert.ok(images.every(image=>image.onload===null&&image.onerror===null));g.frame(100000);g.showSettings();g.selectFieldActors('classic');g.closeSettings();assert.equal(g.state.runResult,result);assert.equal(g.state.mode,'end');g.advanceClock(500);g.el('again').click();assert.equal(g.state.mode,'play');assert.equal(g.fieldActorsActive(),false);assert.equal(g.state.elapsed,0);assert.equal(g.p.arc,0);assert.equal(g.p.rail,false);
});
test('Alpha 0.56 practice and street trials never decode or share scored-run actor caches',()=>{
 for(const kind of ['targets','breaker']){const g=loadGame();g.startTraining('pierce',false,kind);assert.equal(g.pendingImages.length,0);assert.equal(g.fieldActorsActive(),false);assert.equal(g.fieldState().status,'idle')}const g=loadGame();enterTrial54(g,'crowd');assert.equal(g.pendingImages.length,12);assert.equal(g.fieldState().status,'idle');assert.equal(g.fieldActorsActive(),false);const before=g.streetHudState().polished;g.pause();g.showSettings();g.selectFieldActors('classic');assert.equal(g.streetHudState().polished,before);assert.equal(g.state.training,true);assert.equal(g.state.enemies.length,25);
});
test('Alpha 0.56 phone reports capture actual actor readiness and retain frozen labels after changes',()=>{
 for(const artworkStatus of ['ready','pending','error']){const g=loadGame({artworkStatus});cleanRun(g);g.pause();g.showSettings();g.showBenchmark();const report=g.benchmarkText();assert.match(report,/ALPHA 0.85/);assert.match(report,new RegExp('Actor art at capture: '+(artworkStatus==='ready'?'Field actors ready':artworkStatus==='pending'?'Loading field actors':'Field artwork unavailable')));g.resolveArtwork();assert.equal(g.benchmarkText(),report);g.phoneBack();g.selectFieldActors('classic');g.showBenchmark();assert.match(g.benchmarkText(),/Actor art at capture: Classic actors selected/)}
});

// Alpha 0.57 — reviewed Breaker art in the scored overhead world.
function breaker57(g){g.spawnBoss('breaker');const e=g.state.activeBoss;Object.assign(e,{x:120,y:0,phase:'warn',phaseTime:g.tuning.windup,chargeX:-1,chargeY:0});g.prepareFieldBreaker();return e}
test('Alpha 0.57 normal deployment retains five images and Breaker warning lazily adds only two sheets',()=>{
 const g=loadGame();cleanRun(g);assert.equal(g.pendingImages.length,5);assert.equal(g.fieldState().breaker.status,'idle');g.setup({bossWarned:true});g.prepareFieldBreaker();assert.equal(g.pendingImages.length,7);assert.equal(g.fieldState().breaker.status,'ready');assert.deepEqual(Object.keys(g.fieldState().breaker.rows),['breakerWalk','breakerCombat']);assert.ok(g.pendingImages.every(im=>im.onload===null&&im.onerror===null));assert.match(g.fieldArtStatus(),/Breaker art ready/);assert.equal(Object.keys(g.state.sampleArtwork).length,0);
});
test('Alpha 0.57 other boss warnings and Classic actors do not decode the Breaker module',()=>{
 for(const bossesDefeated of [1,2]){const g=loadGame();cleanRun(g);g.setup({bossesDefeated,bossWarned:true});g.prepareFieldBreaker();assert.equal(g.pendingImages.length,5);assert.equal(g.fieldState().breaker.status,'idle');g.spawnBoss(bossesDefeated===1?'warden':'harvester');g.prepareFieldBreaker();assert.equal(g.pendingImages.length,5)}const g=loadGame({preferencesStored:JSON.stringify({version:1,actors:'classic'})});cleanRun(g);breaker57(g);assert.equal(g.pendingImages.length,0);assert.equal(g.fieldActorsActive(),false);
});
test('Alpha 0.57 pending boss sheets activate atomically and retain common actors and native state',()=>{
 const g=loadGame({artworkStatus:'pending'});cleanRun(g);g.resolveArtwork();const e=breaker57(g),world=fieldWorld56(g);assert.equal(g.fieldActorsActive(),true);assert.equal(g.fieldBreakerActive(e),false);const pair=g.pendingImages.slice(5);pair[0].naturalWidth=2172;pair[0].naturalHeight=724;pair[0].onload();assert.equal(g.fieldBreakerActive(e),false);pair[1].naturalWidth=1254;pair[1].naturalHeight=1254;pair[1].onload();assert.equal(g.fieldBreakerActive(e),true);assert.deepEqual(fieldWorld56(g),world);assert.ok(pair.every(im=>im.onload===null&&im.onerror===null));
});
test('Alpha 0.57 boss decode errors and bad metadata leave only the boss on playable Classic fallback',()=>{
 for(const failure of ['error','zero','metadata','budget']){const g=loadGame({artworkStatus:'pending'});cleanRun(g);g.resolveArtwork();if(['metadata','budget'].includes(failure)){const data=JSON.parse(sampleAssetText);if(failure==='metadata')delete data.breakerCombat;else data.breakerCombat.width=999999;g.el('sampleAssets').textContent=JSON.stringify(data)}const e=breaker57(g);if(failure==='error')g.pendingImages[5].onerror();if(failure==='zero'){const image=g.pendingImages[5];image.naturalWidth=0;image.naturalHeight=0;image.onload()}assert.equal(g.fieldState().breaker.status,'failed');assert.equal(g.fieldBreakerActive(e),false);assert.equal(g.fieldActorsActive(),true);assert.equal(Object.keys(g.fieldState().rows).length,5);assert.equal(Object.keys(g.fieldState().breaker.rows).length,0);assert.match(g.fieldArtStatus(),/Classic boss remains playable/);const n=g.pendingImages.length;g.prepareFieldBreaker();assert.equal(g.pendingImages.length,n);g.update(.02);assert.equal(g.state.mode,'play')}
});
test('Alpha 0.57 obsolete callbacks cannot revive a cancelled warning or corrupt a replacement boss module',()=>{
 const g=loadGame({artworkStatus:'pending'});cleanRun(g);g.resolveArtwork();g.setup({bossWarned:true});g.prepareFieldBreaker();const old=g.pendingImages.slice(5),load=old[0].onload,error=old[0].onerror;g.setup({bossWarned:false});g.prepareFieldBreaker();assert.equal(g.fieldState().breaker.status,'idle');assert.ok(old.every(im=>im.onload===null&&im.onerror===null));g.setup({bossWarned:true});g.prepareFieldBreaker();const replacement=g.fieldState().breaker;load();error();assert.equal(g.fieldState().breaker,replacement);assert.equal(replacement.status,'loading');g.pause();g.selectFieldActors('classic');load();assert.equal(g.fieldState().breaker.status,'idle');
});
test('Alpha 0.57 attack frames follow eight world-space locked directions in both phone orientations',()=>{
 for(const [width,height] of [[412,915],[915,412]]){const g=loadGame({width,height});cleanRun(g);const e=breaker57(g);for(let direction=0;direction<8;direction++)for(const phase of ['warn','charge','recover']){Object.assign(e,{phase,phaseTime:phase==='warn'?g.tuning.windup:phase==='charge'?g.tuning.chargeTime:g.tuning.recovery,chargeX:Math.cos(direction*Math.PI/4),chargeY:Math.sin(direction*Math.PI/4)});const info=g.fieldBreakerPose(e);assert.equal(info.direction,direction);assert.equal(info.pose.frame%5,[0,1,2,1,0,3,4,3][direction]);assert.equal(info.flip,[1,1,1,-1,-1,-1,1,1][direction]);g.p.x+=100;g.p.y-=60;assert.equal(g.fieldBreakerPose(e).direction,direction)}}
});
test('Alpha 0.57 native phase progress selects brace, load, charge strides and recovery without changing timers',()=>{
 const g=loadGame();cleanRun(g);const e=breaker57(g);for(const [phase,fraction,row] of [['warn',0,0],['warn',.6,1],['charge',0,2],['charge',.3,3],['charge',.6,2],['charge',.85,3],['recover',0,4],['recover',.8,0]]){const duration=phase==='warn'?g.tuning.windup:phase==='charge'?g.tuning.chargeTime:g.tuning.recovery;Object.assign(e,{phase,phaseTime:duration*(1-fraction)});const before=JSON.stringify(e),pose=g.fieldBreakerPose(e);assert.equal(Math.floor(pose.pose.frame/5),row);assert.equal(JSON.stringify(e),before)}
});
test('Alpha 0.57 Breaker approach steps follow real distance, stopping and teleports rather than waiting time',()=>{
 const g=loadGame();cleanRun(g);const e=breaker57(g);e.phase='approach';g.advanceFieldBreaker(.02);let m=g.fieldBreakerMotion(e);assert.equal(m.moving,false);e.x-=25;g.advanceFieldBreaker(.03);assert.equal(m.pose.asset,'breakerWalk');assert.equal(m.pose.frame,1);near(m.travel,25);g.advanceFieldBreaker(.03);assert.equal(m.moving,false);assert.equal(m.pose.asset,'breakerCombat');e.x+=2000;g.advanceFieldBreaker(.02);assert.equal(m.moving,false);near(m.travel,0);
});
test('Alpha 0.57 all walk and combat layers keep fixed standing height and bottom foot anchors',()=>{
 const g=loadGame();cleanRun(g);breaker57(g);const data=JSON.parse(sampleAssetText);for(const asset of ['breakerWalk','breakerCombat'])for(let frame=0;frame<data[asset].frames.length;frame++){const row=g.fieldState().breaker.rows[asset],meta=row.meta,reference=meta.referenceHeights[asset==='breakerCombat'?frame%5:0],pivot=meta.pivots[frame],crop=meta.frames[frame],scale=104/reference;near((-pivot[1]+crop[3])*scale,0);assert.ok(crop.every(Number.isFinite));assert.ok(scale>0);assert.ok(pivot[0]>=0&&pivot[0]<=crop[2])}assert.equal(g.fieldActorInfo(g.state.activeBoss,'breaker').height,104);
});
test('Alpha 0.57 boss transitions retain each layer facing, bounded weights and Reduced Effects single poses',()=>{
 const g=loadGame();cleanRun(g);const e=breaker57(g);g.advanceFieldBreaker(.02);e.chargeX=1;g.advanceFieldBreaker(.02);let info=g.fieldActorInfo(e,'breaker');assert.equal(info.layers.length,2);near(info.layers.reduce((sum,row)=>sum+row.weight,0),1);assert.equal(info.layers[0].flip,-1);assert.equal(info.layers[1].flip,1);g.state.preferences.reduced=true;info=g.fieldActorInfo(e,'breaker');assert.equal(info.layers.length,1);g.advanceFieldBreaker(.02);assert.equal(g.fieldBreakerMotion(e).previous,null);
});
test('Alpha 0.57 paused Field/Classic comparisons preserve boss state, health, warning vector and all gameplay',()=>{
 const g=loadGame();cleanRun(g);const e=breaker57(g);g.advanceFieldBreaker(.02);g.pause();const world=fieldWorld56(g);g.selectFieldActors('classic');assert.equal(g.state.mode,'paused');assert.equal(g.fieldState().breaker.status,'idle');assert.deepEqual(fieldWorld56(g),world);g.selectFieldActors('field');assert.equal(g.fieldBreakerActive(e),true);assert.deepEqual(fieldWorld56(g),world);assert.equal(g.state.mode,'paused');assert.equal(g.state.preferences.hud,'composed');
});
test('Alpha 0.57 Pause, Back, background, upgrades and extraction freeze active boss presentation',()=>{
 for(const mode of ['pause','upgrade','extraction','background']){const g=loadGame();cleanRun(g);const e=breaker57(g);g.advanceFieldBreaker(.02);if(mode==='pause')g.phoneBack();if(mode==='upgrade'){g.setup({xp:8});g.checkLevelUp()}if(mode==='extraction'){g.setup({exitBeacon:{x:0,y:0,r:34}});g.showExtractionChoice()}if(mode==='background'){g.document.hidden=true;g.event('visibilitychange')}const pose=JSON.stringify(g.fieldBreakerMotion(e)),world=fieldWorld56(g);g.advanceFieldBreaker(10);g.frame(100000);assert.equal(JSON.stringify(g.fieldBreakerMotion(e)),pose);assert.deepEqual(fieldWorld56(g),world)}
});
test('Alpha 0.57 defeat credits immediately, releases boss-only assets and permits a fresh later Breaker load',()=>{
 const g=loadGame();cleanRun(g);const e=breaker57(g),images=g.pendingImages.slice(5);g.hitEnemy(e,1e9);assert.equal(g.state.bossesDefeated,1);assert.equal(g.state.killCount,1);assert.equal(g.state.activeBoss,null);assert.ok(g.state.gems.length>0);g.setup({elapsed:g.state.elapsed+.6});g.advanceFieldActors(.02);g.prepareFieldBreaker();assert.equal(g.fieldState().breaker.status,'idle');assert.equal(g.fieldActorsActive(),true);assert.ok(images.every(im=>im.onload===null&&im.onerror===null));breaker57(g);assert.equal(g.pendingImages.length,9);assert.equal(g.fieldState().breaker.status,'ready');
});
test('Alpha 0.57 finish, Main, Retry and prototype practice do not retain or share boss actor resources',()=>{
 const g=loadGame();cleanRun(g);breaker57(g);g.end('abandoned');assert.equal(g.fieldState().breaker.status,'idle');assert.equal(g.fieldState().status,'idle');g.advanceClock(500);g.el('again').click();assert.equal(g.pendingImages.length,12);assert.equal(g.fieldState().breaker.status,'idle');g.end('abandoned');g.advanceClock(500);g.el('resultMenu').click();g.openHomeEntry('streetOpen');assert.equal(g.fieldState().breaker.status,'idle');assert.equal(Object.keys(g.state.sampleArtwork).length,12);
});
test('Alpha 0.57 boss rendering is pure, culls far sprites and leaves native warning/health overlays intact',()=>{
 const g=loadGame({traceCanvas:true});cleanRun(g);const e=breaker57(g);g.advanceFieldBreaker(.02);const world=fieldWorld56(g);g.clearTrace();g.renderEnemy(e);let trace=g.drawingTrace();assert.ok(trace.some(row=>row[0]==='drawImage'));assert.ok(trace.some(row=>row[0]==='fillText'&&row[1]==='BREAKER'));assert.ok(trace.some(row=>row[0]==='arc'&&row[3]===e.r+7));assert.deepEqual(fieldWorld56(g),world);e.x=5000;g.clearTrace();g.renderEnemy(e);assert.equal(g.drawingTrace().some(row=>row[0]==='drawImage'),false);
});
test('Alpha 0.57 Field and Classic have identical seeded Breaker combat, rewards and upgrade draws',()=>{
 const games=['field','classic'].map(actors=>loadGame({seed:5701,preferencesStored:JSON.stringify({version:1,actors,shake:false})}));for(const g of games){cleanRun(g);const e=breaker57(g);g.p.inv=999;g.keys.s=true;for(let i=0;i<200;i++){g.update(.02);g.render()}g.keys.s=false;g.hitEnemy(e,1e9);g.prepareFieldBreaker()}assert.deepEqual(fieldWorld56(games[0]),fieldWorld56(games[1]));assert.deepEqual(JSON.parse(JSON.stringify(games[0].upgradeChoices())),JSON.parse(JSON.stringify(games[1].upgradeChoices())));
});
test('Alpha 0.57 held phone reports capture actual boss-module readiness and remain unchanged after completion',()=>{
 const g=loadGame({artworkStatus:'pending'});cleanRun(g);g.resolveArtwork();breaker57(g);g.pause();g.showSettings();g.showBenchmark();const text=g.benchmarkText();assert.match(text,/Loading Breaker art/);g.resolveArtwork();assert.equal(g.benchmarkText(),text);g.phoneBack();g.showBenchmark();assert.match(g.benchmarkText(),/Breaker art ready/);
});
test('Alpha 0.57 reuses byte-identical media with a bounded twelve-MiB optional boss module and no new canvas',()=>{
 const data=JSON.parse(sampleAssetText),boss=['breakerWalk','breakerCombat'].reduce((n,id)=>n+data[id].width*data[id].height*4,0),common=['survivorWalk','survivorAim','shamblerWalk','runnerRun','bruteWalk'].reduce((n,id)=>n+data[id].width*data[id].height*4,0);assert.equal(boss,12580176);assert.ok(boss<12*1024*1024);assert.equal(common+boss,41811352);assert.ok(common+boss<44*1024*1024);assert.ok(Buffer.byteLength(html)<12*1024*1024);assert.equal((html.match(/<canvas\b/g)||[]).length,6);
});

// Alpha 0.58 — distinct Warden art on the unchanged five-lane native attack.
function warden58(g){g.spawnBoss('warden');const e=g.state.activeBoss;Object.assign(e,{x:180,y:0,phase:'warn',phaseTime:g.wardenTuning.windup,aimAngle:Math.PI});g.prepareFieldWarden();return e}
test('Alpha 0.58 original Warden source, runtime alpha/quality metadata and thirty-five crop cells are valid',()=>{
 const a=JSON.parse(sampleAssetText).warden,m=JSON.parse(readFileSync(join(__dirname,'../dist/assets/warden-field.json'))),r=JSON.parse(readFileSync(join(__dirname,'../dist/assets/runtime-formats.json'))).warden,source=readFileSync(join(__dirname,'../dist/assets/warden-field.png')),runtime=readFileSync(join(__dirname,'../dist/assets/warden-field.webp')),hash=b=>require('node:crypto').createHash('sha256').update(b).digest('hex');assert.equal(hash(source),m.sha256);assert.equal(hash(runtime),a.sha256);assert.equal(r.source_sha256,m.sha256);assert.deepEqual(Buffer.from(a.src.split(',')[1],'base64'),runtime);assert.equal(a.width,1024);assert.equal(a.height,1536);assert.equal(a.frames.length,35);assert.equal(a.pivots.length,35);assert.equal(m.views.length,5);assert.equal(m.poses.length,7);assert.equal(r.alpha_exact,true);assert.ok(r.visible_rgb_psnr_db>37);assert.ok(runtime.length<500000);for(let i=0;i<35;i++){const [x,y,w,h]=a.frames[i],cell=m.cellBounds[i];assert.ok(x>=cell[0]&&y>=cell[1]&&x+w<=cell[0]+cell[2]&&y+h<=cell[1]+cell[3]);assert.equal(a.pivots[i][1],h);assert.ok(a.pivots[i][0]>=0&&a.pivots[i][0]<=w)}
});
test('Alpha 0.58 Warden imagery is a single lazy sheet with mutually exclusive boss modules',()=>{
 const g=loadGame();cleanRun(g);assert.equal(g.pendingImages.length,5);g.setup({bossesDefeated:1,bossWarned:true});g.prepareFieldWarden();assert.equal(g.pendingImages.length,6);assert.equal(g.fieldState().warden.status,'ready');assert.equal(g.fieldState().breaker.status,'idle');assert.ok(g.pendingImages.every(im=>im.onload===null&&im.onerror===null));g.setup({bossesDefeated:0});g.prepareFieldBreaker();assert.equal(g.fieldState().warden.status,'idle');assert.equal(g.fieldState().breaker.status,'ready');g.setup({bossesDefeated:1});g.prepareFieldWarden();assert.equal(g.fieldState().breaker.status,'idle');assert.equal(g.fieldState().warden.status,'ready');assert.equal(g.fieldActorsActive(),true);
});
test('Alpha 0.58 Classic, Harvester warning and normal training do not decode Warden art',()=>{
 const g=loadGame({preferencesStored:JSON.stringify({version:1,actors:'classic'})});cleanRun(g);warden58(g);assert.equal(g.pendingImages.length,0);const h=loadGame();cleanRun(h);h.setup({bossesDefeated:2,bossWarned:true});h.prepareFieldWarden();assert.equal(h.pendingImages.length,5);assert.equal(h.fieldState().warden.status,'idle');const t=loadGame();t.startTraining('pierce',false,'warden');assert.equal(t.pendingImages.length,0);assert.equal(t.fieldState().warden.status,'idle');
});
test('Alpha 0.58 pending Warden load changes no native state and keeps common actors available',()=>{
 const g=loadGame({artworkStatus:'pending'});cleanRun(g);g.resolveArtwork();const e=warden58(g),world=fieldWorld56(g);assert.equal(g.fieldWardenActive(e),false);assert.equal(g.fieldActorsActive(),true);const im=g.pendingImages[5];im.naturalWidth=1024;im.naturalHeight=1536;im.onload();assert.equal(g.fieldWardenActive(e),true);assert.deepEqual(fieldWorld56(g),world);assert.equal(im.onload,null);assert.equal(im.onerror,null);
});
test('Alpha 0.58 decode/zero-size/missing/oversized Warden data fails only that boss with no retry loop',()=>{
 for(const failure of ['error','zero','missing','budget']){const g=loadGame({artworkStatus:'pending'});cleanRun(g);g.resolveArtwork();if(['missing','budget'].includes(failure)){const d=JSON.parse(sampleAssetText);if(failure==='missing')delete d.warden;else d.warden.width=999999;g.el('sampleAssets').textContent=JSON.stringify(d)}const e=warden58(g);if(failure==='error')g.pendingImages[5].onerror();if(failure==='zero'){const im=g.pendingImages[5];im.naturalWidth=0;im.naturalHeight=0;im.onload()}assert.equal(g.fieldState().warden.status,'failed');assert.equal(g.fieldActorsActive(),true);assert.equal(g.fieldWardenActive(e),false);assert.match(g.fieldArtStatus(),/Warden art unavailable/);const n=g.pendingImages.length;g.prepareFieldWarden();assert.equal(g.pendingImages.length,n);g.update(.02);assert.equal(g.state.mode,'play')}
});
test('Alpha 0.58 cancelled warnings and stale callbacks cannot revive or fail a replacement Warden module',()=>{
 const g=loadGame({artworkStatus:'pending'});cleanRun(g);g.resolveArtwork();g.setup({bossesDefeated:1,bossWarned:true});g.prepareFieldWarden();const old=g.pendingImages[5],load=old.onload,error=old.onerror;g.setup({bossWarned:false});g.prepareFieldWarden();assert.equal(old.onload,null);assert.equal(old.onerror,null);g.setup({bossWarned:true});g.prepareFieldWarden();const replacement=g.fieldState().warden;load();error();assert.equal(g.fieldState().warden,replacement);assert.equal(replacement.status,'loading');g.pause();g.selectFieldActors('classic');load();assert.equal(g.fieldState().warden.status,'idle');
});
test('Alpha 0.58 all eight locked volley headings map to actual front/rear atlas views in either orientation',()=>{
 for(const [width,height] of [[412,915],[915,412]]){const g=loadGame({width,height});cleanRun(g);const e=warden58(g);for(let direction=0;direction<8;direction++)for(const phase of ['warn','recover']){e.phase=phase;e.aimAngle=direction*Math.PI/4;const key=g.fieldWardenPose(e);assert.equal(key.direction,direction);assert.equal(key.pose.frame%5,[0,1,2,1,0,3,4,3][direction]);assert.equal(key.flip,[1,1,1,-1,-1,-1,1,1][direction]);g.p.x+=45;g.p.y-=80;assert.equal(g.fieldWardenPose(e).direction,direction)}}
});
test('Alpha 0.58 walking uses four actual-distance keys, eight travel headings and no stationary or teleport travel',()=>{
 const g=loadGame();cleanRun(g);const e=warden58(g);e.phase='approach';g.advanceFieldWarden(.02);for(let direction=0;direction<8;direction++){const a=direction*Math.PI/4;e.x+=Math.cos(a)*23;e.y+=Math.sin(a)*23;g.advanceFieldWarden(.02);const m=g.fieldWardenMotion(e);assert.equal(m.direction,direction);assert.equal(m.pose.frame%5,[0,1,2,1,0,3,4,3][direction]);assert.ok(m.travel>=0&&m.travel<84)}const held=g.fieldWardenMotion(e).travel;g.advanceFieldWarden(.02);assert.equal(g.fieldWardenMotion(e).moving,false);near(g.fieldWardenMotion(e).travel,held);e.x+=2000;g.advanceFieldWarden(.02);near(g.fieldWardenMotion(e).travel,0);assert.equal(g.fieldWardenMotion(e).moving,false);
});
test('Alpha 0.58 windup/release/recovery keys read phase progress and never emit shots or alter timers',()=>{
 const g=loadGame();cleanRun(g);const e=warden58(g);for(const [phase,fraction,row] of [['warn',.5,4],['recover',0,5],['recover',.4,6],['recover',.9,0]]){e.phase=phase;e.phaseTime=(phase==='warn'?g.wardenTuning.windup:g.wardenTuning.recovery)*(1-fraction);const before=fieldWorld56(g),n=g.state.hostileShots.length;assert.equal(Math.floor(g.fieldWardenPose(e).pose.frame/5),row);g.advanceFieldWarden(.02);assert.deepEqual(fieldWorld56(g),before);assert.equal(g.state.hostileShots.length,n)}
});
test('Alpha 0.58 native volley still emits exactly five aimed shots and image drawing cannot change them',()=>{
 const g=loadGame({traceCanvas:true});cleanRun(g);g.setup({obstacles:[]});const e=warden58(g);e.x=120;e.aimAngle=.3;e.phaseTime=.01;g.moveWarden(e,.02);assert.equal(e.phase,'recover');assert.equal(g.state.hostileShots.length,5);const shots=JSON.stringify(g.state.hostileShots);g.advanceFieldWarden(.02);g.renderEnemy(e);assert.equal(JSON.stringify(g.state.hostileShots),shots);g.state.hostileShots.forEach((s,i)=>near(Math.atan2(s.vy,s.vx),.3+g.wardenTuning.spread[i]));g.setup({hostileShots:[]});e.x=190;e.phase='warn';e.phaseTime=.01;g.moveWarden(e,.02);assert.equal(e.phase,'approach');assert.equal(g.state.hostileShots.length,0);g.advanceFieldWarden(.02);assert.ok(g.fieldWardenMotion(e).pose.frame<20);
});
test('Alpha 0.58 sprite scale and foot pivots remain fixed across gait/attack views and bounded blends',()=>{
 const g=loadGame();cleanRun(g);const e=warden58(g),m=g.fieldWardenMotion(e),data=JSON.parse(sampleAssetText).warden;for(let frame=0;frame<35;frame++){m.pose={asset:'warden',frame};m.previous=null;const info=g.fieldActorInfo(e,'warden');near(info.scale,102/data.referenceHeights[frame%5]);near((-info.pivot[1]+info.crop[3])*info.scale,0);assert.equal(info.height,102)}e.aimAngle=0;g.advanceFieldWarden(.02);e.aimAngle=Math.PI;g.advanceFieldWarden(.02);let info=g.fieldActorInfo(e,'warden');assert.ok(info.layers.length<=2);near(info.layers.reduce((n,l)=>n+l.weight,0),1);assert.equal(info.layers[0].flip,1);assert.equal(info.layers[1].flip,-1);g.state.preferences.reduced=true;assert.equal(g.fieldActorInfo(e,'warden').layers.length,1);
});
test('Alpha 0.58 same-scene Classic/Field selection stays paused and preserves every native boss field',()=>{
 const g=loadGame();cleanRun(g);const e=warden58(g);g.advanceFieldWarden(.02);g.pause();const world=fieldWorld56(g);g.selectFieldActors('classic');assert.deepEqual(fieldWorld56(g),world);assert.equal(g.fieldState().warden.status,'idle');g.selectFieldActors('field');assert.equal(g.fieldWardenActive(e),true);assert.deepEqual(fieldWorld56(g),world);assert.equal(g.state.mode,'paused');
});
test('Alpha 0.58 Back/background/upgrades/extraction cannot advance Warden animation or native simulation',()=>{
 for(const mode of ['back','background','upgrade','extraction']){const g=loadGame();cleanRun(g);const e=warden58(g);g.advanceFieldWarden(.02);if(mode==='back')g.phoneBack();if(mode==='background'){g.document.hidden=true;g.event('visibilitychange')}if(mode==='upgrade'){g.setup({xp:8});g.checkLevelUp()}if(mode==='extraction'){g.setup({exitBeacon:{x:0,y:0,r:34}});g.showExtractionChoice()}const motion=JSON.stringify(g.fieldWardenMotion(e)),world=fieldWorld56(g);g.advanceFieldWarden(100);g.frame(100000);assert.equal(JSON.stringify(g.fieldWardenMotion(e)),motion);assert.deepEqual(fieldWorld56(g),world)}
});
test('Alpha 0.58 Warden defeat grants immediate native rewards and frees only the optional boss module',()=>{
 const g=loadGame();cleanRun(g);const e=warden58(g);g.hitEnemy(e,1e9);assert.equal(g.state.activeBoss,null);assert.equal(g.state.wardensDefeated,1);assert.equal(g.state.bossesDefeated,1);assert.equal(g.state.killCount,1);assert.ok(g.state.gems.length);g.setup({elapsed:g.state.elapsed+.6});g.advanceFieldActors(.02);g.prepareFieldWarden();assert.equal(g.fieldState().warden.status,'idle');assert.equal(g.fieldActorsActive(),true);warden58(g);assert.equal(g.pendingImages.length,7);assert.equal(g.fieldState().warden.status,'ready');g.end('abandoned');assert.equal(g.fieldState().warden.status,'idle');g.advanceClock(500);g.el('again').click();assert.equal(g.fieldState().warden.status,'idle');assert.equal(g.state.elapsed,0);
});
test('Alpha 0.58 Warden drawing is pure, uses its atlas, retains native hexagon/ring and culls distant images',()=>{
 const g=loadGame({traceCanvas:true});cleanRun(g);const e=warden58(g);g.advanceFieldWarden(.02);const world=fieldWorld56(g);g.clearTrace();g.renderEnemy(e);const rows=g.drawingTrace();assert.ok(rows.some(r=>r[0]==='drawImage'&&r[1]===g.fieldState().warden.row.image));assert.ok(rows.some(r=>r[0]==='fillText'&&r[1]==='WARDEN'));assert.ok(rows.some(r=>r[0]==='set'&&r[1]==='strokeStyle'&&r[2]==='#c0f2ff'));assert.deepEqual(fieldWorld56(g),world);e.x=5000;g.clearTrace();g.renderEnemy(e);assert.equal(g.drawingTrace().some(r=>r[0]==='drawImage'),false);
});
test('Alpha 0.58 Field and Classic preserve seeded Warden behavior, projectiles, damage and upgrade RNG',()=>{
 const games=['field','classic'].map(actors=>loadGame({seed:5801,preferencesStored:JSON.stringify({version:1,actors,shake:false})}));for(const g of games){cleanRun(g);warden58(g);g.p.inv=999;g.keys.s=true;for(let i=0;i<240;i++){g.update(.02);g.render()}g.keys.s=false}assert.deepEqual(fieldWorld56(games[0]),fieldWorld56(games[1]));assert.equal(JSON.stringify(games[0].state.hostileShots),JSON.stringify(games[1].state.hostileShots));assert.deepEqual(JSON.parse(JSON.stringify(games[0].upgradeChoices())),JSON.parse(JSON.stringify(games[1].upgradeChoices())));
});
test('Alpha 0.58 held reports show actual Warden readiness and cannot change when loading finishes',()=>{
 const g=loadGame({artworkStatus:'pending'});cleanRun(g);g.resolveArtwork();warden58(g);g.pause();g.showSettings();g.showBenchmark();const text=g.benchmarkText();assert.match(text,/Loading Warden art/);g.resolveArtwork();assert.equal(g.benchmarkText(),text);g.phoneBack();g.showBenchmark();assert.match(g.benchmarkText(),/Warden art ready/);
});
test('Alpha 0.58 Warden stays within existing raw boss/download budgets and never enters prototype decoding',()=>{
 const a=JSON.parse(sampleAssetText).warden;assert.equal(a.width*a.height*4,6291456);assert.ok(29231176+a.width*a.height*4<44*1024*1024);assert.ok(Buffer.byteLength(html)<12*1024*1024);assert.equal((html.match(/<canvas\b/g)||[]).length,6);const g=loadGame();g.openHomeEntry('streetOpen');assert.equal(g.pendingImages.length,12);assert.equal(g.fieldState().warden.status,'idle');assert.equal(Object.keys(g.state.sampleArtwork).length,12);
});

// Alpha 0.59 — organic Harvester with native pulse rules and budget-safe packaging.
function harvester59(g){g.spawnBoss('harvester');const e=g.state.activeBoss;Object.assign(e,{x:120,y:0,phase:'warn',phaseTime:g.harvesterTuning.windup,pulseX:120,pulseY:0});g.prepareFieldHarvester();return e}
test('Alpha 0.59 Harvester source/runtime provenance, directional cells and alpha/quality records are valid',()=>{
 const a=JSON.parse(sampleAssetText).harvester,m=JSON.parse(readFileSync(join(__dirname,'../dist/assets/harvester-field.json'))),r=JSON.parse(readFileSync(join(__dirname,'../dist/assets/runtime-formats.json'))).harvester,hash=b=>require('node:crypto').createHash('sha256').update(b).digest('hex');assert.equal(hash(readFileSync(join(__dirname,'../dist/assets/harvester-field.png'))),m.sha256);const runtime=readFileSync(join(__dirname,'../dist/assets/harvester-field.webp'));assert.equal(hash(runtime),a.sha256);assert.deepEqual(Buffer.from(a.src.split(',')[1],'base64'),runtime);assert.equal(r.alpha_exact,true);assert.ok(r.visible_rgb_psnr_db>35);assert.equal(a.frames.length,35);assert.equal(m.views.length,5);assert.equal(m.poses.length,7);for(let i=0;i<35;i++){const [x,y,w,h]=a.frames[i],c=(m.packedRuntime?.cellBounds||m.cellBounds)[i];assert.ok(x>=c[0]&&y>=c[1]&&x+w<=c[0]+c[2]&&y+h<=c[1]+c[3]);assert.equal(a.pivots[i][1],h)}
});
test('Alpha 0.59 legacy preview-enemy optimization preserves original PNG, alpha and measured runtime quality',()=>{
 const a=JSON.parse(sampleAssetText).enemies,r=JSON.parse(readFileSync(join(__dirname,'../dist/assets/runtime-formats.json'))).enemies,m=JSON.parse(readFileSync(join(__dirname,'../dist/assets/manifest.json'))).assets.enemies,hash=b=>require('node:crypto').createHash('sha256').update(b).digest('hex');assert.equal(hash(readFileSync(join(__dirname,'../dist/assets/enemies.png'))),m.sha256);assert.equal(r.source_sha256,m.sha256);assert.equal(r.alpha_exact,true);assert.ok(r.visible_rgb_psnr_db>38);assert.match(r.encoding,/quality 95/);assert.equal(hash(readFileSync(join(__dirname,'../dist/assets/enemies.webp'))),a.sha256);assert.ok(r.runtime_bytes<600000);assert.deepEqual(Buffer.from(a.src.split(',')[1],'base64'),readFileSync(join(__dirname,'../dist/assets/enemies.webp')));
});
test('Alpha 0.59 single lazy Harvester sheet rotates exclusively with Warden and Breaker modules',()=>{
 const g=loadGame();cleanRun(g);assert.equal(g.pendingImages.length,5);g.setup({bossesDefeated:2,bossWarned:true});g.prepareFieldHarvester();assert.equal(g.pendingImages.length,6);assert.equal(g.fieldState().harvester.status,'ready');g.setup({bossesDefeated:1});g.prepareFieldWarden();assert.equal(g.fieldState().harvester.status,'idle');assert.equal(g.fieldState().warden.status,'ready');g.setup({bossesDefeated:2});g.prepareFieldHarvester();assert.equal(g.fieldState().warden.status,'idle');g.setup({bossesDefeated:0});g.prepareFieldBreaker();assert.equal(g.fieldState().harvester.status,'idle');assert.equal(g.fieldState().breaker.status,'ready');assert.equal(g.fieldActorsActive(),true);
});
test('Alpha 0.59 Classic, unrelated warnings and ordinary practice skip Harvester decoding',()=>{
 const g=loadGame({preferencesStored:JSON.stringify({version:1,actors:'classic'})});cleanRun(g);harvester59(g);assert.equal(g.pendingImages.length,0);for(const n of [0,1]){const h=loadGame();cleanRun(h);h.setup({bossesDefeated:n,bossWarned:true});h.prepareFieldHarvester();assert.equal(h.pendingImages.length,5)}const t=loadGame();t.startTraining('pierce',false,'harvester');assert.equal(t.pendingImages.length,0);assert.equal(t.fieldState().harvester.status,'idle');
});
test('Alpha 0.59 pending Harvester completion preserves native world and common-art readiness',()=>{
 const g=loadGame({artworkStatus:'pending'});cleanRun(g);g.resolveArtwork();const e=harvester59(g),world=fieldWorld56(g);assert.equal(g.fieldHarvesterActive(e),false);assert.equal(g.fieldActorsActive(),true);const im=g.pendingImages[5];im.naturalWidth=1536;im.naturalHeight=1024;im.onload();assert.equal(g.fieldHarvesterActive(e),true);assert.deepEqual(fieldWorld56(g),world);assert.equal(im.onload,null);assert.equal(im.onerror,null);
});
test('Alpha 0.59 decode/missing/oversized/zero Harvester art keeps native boss fallback with no repeated requests',()=>{
 for(const failure of ['error','missing','budget','zero']){const g=loadGame({artworkStatus:'pending'});cleanRun(g);g.resolveArtwork();if(['missing','budget'].includes(failure)){const d=JSON.parse(sampleAssetText);if(failure==='missing')delete d.harvester;else d.harvester.width=999999;g.el('sampleAssets').textContent=JSON.stringify(d)}const e=harvester59(g);if(failure==='error')g.pendingImages[5].onerror();if(failure==='zero'){const im=g.pendingImages[5];im.naturalWidth=0;im.naturalHeight=0;im.onload()}assert.equal(g.fieldState().harvester.status,'failed');assert.equal(g.fieldHarvesterActive(e),false);assert.equal(g.fieldActorsActive(),true);assert.match(g.fieldArtStatus(),/Harvester art unavailable/);const count=g.pendingImages.length;g.prepareFieldHarvester();assert.equal(g.pendingImages.length,count)}
});
test('Alpha 0.59 stale and cancelled Harvester generations cannot revive or fail a replacement module',()=>{
 const g=loadGame({artworkStatus:'pending'});cleanRun(g);g.resolveArtwork();g.setup({bossesDefeated:2,bossWarned:true});g.prepareFieldHarvester();const old=g.pendingImages[5],load=old.onload,error=old.onerror;g.setup({bossWarned:false});g.prepareFieldHarvester();assert.equal(old.onload,null);assert.equal(old.onerror,null);g.setup({bossWarned:true});g.prepareFieldHarvester();const next=g.fieldState().harvester;load();error();assert.equal(g.fieldState().harvester,next);assert.equal(next.status,'loading');g.pause();g.selectFieldActors('classic');load();assert.equal(g.fieldState().harvester.status,'idle');
});
test('Alpha 0.59 eight travel headings and pulse-facing hold remain correct in both orientations',()=>{
 for(const [width,height] of [[412,915],[915,412]]){const g=loadGame({width,height});cleanRun(g);const e=harvester59(g);e.phase='approach';g.advanceFieldHarvester(.02);for(let direction=0;direction<8;direction++){const a=direction*Math.PI/4;e.x+=Math.cos(a)*23;e.y+=Math.sin(a)*23;g.advanceFieldHarvester(.02);const m=g.fieldHarvesterMotion(e);assert.equal(m.direction,direction);assert.equal(m.pose.frame%5,[0,1,2,1,0,3,4,3][direction]);const anchor=[e.pulseX,e.pulseY];for(const phase of ['warn','recover']){e.phase=phase;g.p.x+=70;g.p.y-=50;g.advanceFieldHarvester(.02);assert.equal(m.direction,direction);assert.deepEqual([e.pulseX,e.pulseY],anchor)}e.phase='approach'}}
});
test('Alpha 0.59 pulse keys follow native clocks without creating damage, rings or changing anchors',()=>{
 const g=loadGame();cleanRun(g);const e=harvester59(g);for(const [phase,fraction,row] of [['warn',.5,4],['recover',0,5],['recover',.5,6],['recover',.9,0]]){e.phase=phase;e.phaseTime=(phase==='warn'?g.harvesterTuning.windup:g.harvesterTuning.recovery)*(1-fraction);const world=fieldWorld56(g),rings=g.state.blastRings.length;assert.equal(Math.floor(g.fieldHarvesterPose(e).pose.frame/5),row);g.advanceFieldHarvester(.02);assert.deepEqual(fieldWorld56(g),world);assert.equal(g.state.blastRings.length,rings)}
});
test('Alpha 0.59 native pulse still hits only its original radius and resolves exactly once before visual recovery',()=>{
 for(const inside of [true,false]){const g=loadGame();cleanRun(g);const e=harvester59(g);e.pulseX=e.pulseY=0;e.phaseTime=.01;g.p.x=g.harvesterTuning.radius+g.p.r+(inside?-.01:.01);g.p.y=0;g.p.inv=0;g.moveHarvester(e,.02);assert.equal(e.phase,'recover');near(g.p.hp,inside?84:100);assert.equal(g.state.blastRings.length,1);near(g.state.blastRings[0].radius,135);const hp=g.p.hp;g.p.inv=0;for(let i=0;i<10;i++)g.advanceFieldHarvester(.02);near(g.p.hp,hp);assert.equal(g.state.blastRings.length,1)}
});
test('Alpha 0.59 approach gait uses actual distance and stops or resets on stationary and teleported bodies',()=>{
 const g=loadGame();cleanRun(g);const e=harvester59(g);e.phase='approach';g.advanceFieldHarvester(.02);const seen=new Set();for(let i=0;i<8;i++){e.x+=22;g.advanceFieldHarvester(.02);seen.add(Math.floor(g.fieldHarvesterMotion(e).pose.frame/5))}assert.equal(seen.size,4);const travel=g.fieldHarvesterMotion(e).travel;g.advanceFieldHarvester(.02);assert.equal(g.fieldHarvesterMotion(e).moving,false);near(g.fieldHarvesterMotion(e).travel,travel);e.x+=2000;g.advanceFieldHarvester(.02);near(g.fieldHarvesterMotion(e).travel,0);assert.equal(g.fieldHarvesterMotion(e).moving,false);
});
test('Alpha 0.59 all Harvester feet/scales and cross-facing blends stay bounded with Reduced Effects fallback',()=>{
 const g=loadGame();cleanRun(g);const e=harvester59(g),m=g.fieldHarvesterMotion(e),d=JSON.parse(sampleAssetText).harvester;for(let frame=0;frame<35;frame++){m.pose={asset:'harvester',frame};m.previous=null;const i=g.fieldActorInfo(e,'harvester');near(i.scale,108/d.referenceHeights[frame%5]);near((-i.pivot[1]+i.crop[3])*i.scale,0)}e.phase='approach';e.x-=23;g.advanceFieldHarvester(.02);e.x+=23;g.advanceFieldHarvester(.02);let i=g.fieldActorInfo(e,'harvester');assert.ok(i.layers.length<=2);near(i.layers.reduce((n,l)=>n+l.weight,0),1);assert.equal(i.layers[0].flip,-1);assert.equal(i.layers[1].flip,1);g.state.preferences.reduced=true;assert.equal(g.fieldActorInfo(e,'harvester').layers.length,1);
});
test('Alpha 0.59 paused actor comparisons retain health, pulse center, timers and every native field',()=>{
 const g=loadGame();cleanRun(g);const e=harvester59(g);g.advanceFieldHarvester(.02);g.pause();const world=fieldWorld56(g);g.selectFieldActors('classic');assert.deepEqual(fieldWorld56(g),world);g.selectFieldActors('field');assert.deepEqual(fieldWorld56(g),world);assert.equal(g.fieldHarvesterActive(e),true);assert.equal(g.state.mode,'paused');
});
test('Alpha 0.59 modal/Back/background transitions never advance pulse animation or simulation',()=>{
 for(const mode of ['back','background','upgrade','extraction']){const g=loadGame();cleanRun(g);const e=harvester59(g);g.advanceFieldHarvester(.02);if(mode==='back')g.phoneBack();if(mode==='background'){g.document.hidden=true;g.event('visibilitychange')}if(mode==='upgrade'){g.setup({xp:8});g.checkLevelUp()}if(mode==='extraction'){g.setup({exitBeacon:{x:0,y:0,r:34}});g.showExtractionChoice()}const motion=JSON.stringify(g.fieldHarvesterMotion(e)),world=fieldWorld56(g);g.advanceFieldHarvester(100);g.frame(100000);assert.equal(JSON.stringify(g.fieldHarvesterMotion(e)),motion);assert.deepEqual(fieldWorld56(g),world)}
});
test('Alpha 0.59 Harvester defeat pays native credit immediately and releases only optional boss references',()=>{
 const g=loadGame();cleanRun(g);const e=harvester59(g);g.hitEnemy(e,1e9);assert.equal(g.state.activeBoss,null);assert.equal(g.state.harvestersDefeated,1);assert.equal(g.state.bossesDefeated,1);assert.equal(g.state.killCount,1);assert.ok(g.state.gems.length>0);g.setup({elapsed:g.state.elapsed+.6});g.advanceFieldActors(.02);g.prepareFieldHarvester();assert.equal(g.fieldState().harvester.status,'idle');assert.equal(g.fieldActorsActive(),true);harvester59(g);assert.equal(g.fieldState().harvester.status,'ready');assert.equal(g.pendingImages.length,7);
});
test('Alpha 0.59 held finish/Retry/Main release Harvester art without carrying resources or powers',()=>{
 const g=loadGame();cleanRun(g);harvester59(g);const im=g.fieldState().harvester.row.image;g.end('abandoned');const result=g.state.runResult;assert.equal(g.fieldState().harvester.status,'idle');assert.equal(im.onload,null);g.frame(100000);assert.equal(g.state.runResult,result);g.advanceClock(500);g.el('again').click();assert.equal(g.state.elapsed,0);assert.equal(g.fieldState().harvester.status,'idle');assert.equal(g.p.arc,0);g.end('abandoned');g.advanceClock(500);g.el('resultMenu').click();assert.equal(g.fieldState().harvester.status,'idle');
});
test('Alpha 0.59 Harvester drawing retains native spokes/warning circle, stays pure and culls far sprites',()=>{
 const g=loadGame({traceCanvas:true});cleanRun(g);const e=harvester59(g);g.advanceFieldHarvester(.02);const world=fieldWorld56(g);g.clearTrace();g.renderEnemy(e);let rows=g.drawingTrace();assert.ok(rows.some(r=>r[0]==='drawImage'&&r[1]===g.fieldState().harvester.row.image));assert.ok(rows.some(r=>r[0]==='fillText'&&r[1]==='HARVESTER'));assert.ok(rows.some(r=>r[0]==='set'&&r[1]==='strokeStyle'&&r[2]==='#dbffe1'));assert.deepEqual(fieldWorld56(g),world);g.clearTrace();g.renderBossWarning();assert.ok(g.drawingTrace().some(r=>r[0]==='arc'&&r[3]===135));e.x=5000;g.clearTrace();g.renderEnemy(e);assert.equal(g.drawingTrace().some(r=>r[0]==='drawImage'),false);
});
test('Alpha 0.59 Field and Classic have identical seeded Harvester combat, pulse outcomes and upgrade RNG',()=>{
 const games=['field','classic'].map(actors=>loadGame({seed:5901,preferencesStored:JSON.stringify({version:1,actors,shake:false})}));for(const g of games){cleanRun(g);harvester59(g);g.p.inv=999;g.keys.s=true;for(let i=0;i<240;i++){g.update(.02);g.render()}g.keys.s=false}assert.deepEqual(fieldWorld56(games[0]),fieldWorld56(games[1]));assert.equal(JSON.stringify(games[0].state.blastRings),JSON.stringify(games[1].state.blastRings));assert.deepEqual(JSON.parse(JSON.stringify(games[0].upgradeChoices())),JSON.parse(JSON.stringify(games[1].upgradeChoices())));
});
test('Alpha 0.59 held reports freeze actual Harvester readiness rather than updating after decode',()=>{
 const g=loadGame({artworkStatus:'pending'});cleanRun(g);g.resolveArtwork();harvester59(g);g.pause();g.showSettings();g.showBenchmark();const text=g.benchmarkText();assert.match(text,/Loading Harvester art/);g.resolveArtwork();assert.equal(g.benchmarkText(),text);g.phoneBack();g.showBenchmark();assert.match(g.benchmarkText(),/Harvester art ready/);
});
test('Alpha 0.59 Harvester fits existing raw/download budgets and remains outside prototype/practice decoding',()=>{
 const a=JSON.parse(sampleAssetText).harvester;assert.ok(a.width*a.height*4<=12*1024*1024);assert.ok(29231176+a.width*a.height*4<44*1024*1024);assert.ok(Buffer.byteLength(html)<12*1024*1024);assert.equal((html.match(/<canvas\b/g)||[]).length,6);const g=loadGame();g.openHomeEntry('streetOpen');assert.equal(g.pendingImages.length,12);assert.equal(g.fieldState().harvester.status,'idle');assert.equal(Object.keys(g.state.sampleArtwork).length,12);
});

// Alpha 0.60 — fast developer boss testing, isolated from scored runs.
function enterBoss60(g,kind='breaker'){g.el('previewsOpen').click();g.advanceClock(500);g.el('bossTest-'+kind).click();assert.equal(g.state.mode,'play');assert.equal(g.state.training,true);assert.equal(g.bossTestState().active,true)}
test('Alpha 0.60 three direct boss choices live in Development Previews without adding home clutter',()=>{
 const g=loadGame();assert.equal(g.el('bossTest-breaker'),undefined);assert.ok(g.el('start')&&g.el('runLog')&&g.el('settingsOpen'));g.el('previewsOpen').click();assert.match(g.el('modal').innerHTML,/DEVELOPER MODE · BOSS TESTING/);for(const id of ['breaker','warden','harvester'])assert.ok(g.el('bossTest-'+id));assert.equal(g.pendingImages.length,0);g.phoneBack();assert.equal(g.state.mode,'menu');
});
test('Alpha 0.60 each boss starts immediately with native base stats, Field art and attacks off in phone views',()=>{
 for(const [width,height] of [[412,915],[915,412],[320,568],[568,320]])for(const [kind,hp] of [['breaker',650],['warden',700],['harvester',750]]){const g=loadGame({width,height});enterBoss60(g,kind);const e=g.state.activeBoss;assert.equal(e.bossKind,kind);assert.equal(e.hp,hp);assert.equal(e.max,hp);assert.equal(g.state.elapsed,0);assert.equal(g.state.trainingScenario,kind);assert.equal(g.bossTestState().attacks,false);assert.equal(g.bossTestState().weapon,'gun');assert.equal(g.fieldActorsActive(),true);assert.ok(Math.abs(e.x-g.p.x)<width/2-35);assert.ok(Math.abs(e.y-g.p.y)<height/2-35);assert.equal(g.pendingImages.length,kind==='breaker'?7:6);assert.match(g.el('runGoal').textContent,/HP SAFE · ATTACKS OFF/)}
});
test('Alpha 0.60 test Field choice is session-only and preserves a saved Classic normal preference',()=>{
 const raw=JSON.stringify({version:1,actors:'classic',hud:'classic',musicVolume:17}),g=loadGame({preferencesStored:raw});enterBoss60(g,'warden');assert.equal(g.fieldStyle(),'field');assert.equal(g.state.preferences.actors,'classic');assert.equal(g.preferencesSaved(),raw);g.pause();g.showSettings();assert.equal(g.el('fieldActorStyle').value,'field');g.selectFieldActors('classic');assert.equal(g.fieldStyle(),'classic');assert.equal(g.preferencesSaved(),raw);g.selectFieldActors('field');assert.equal(g.preferencesSaved(),raw);g.closeSettings();quitForTest(g);g.advanceClock(500);g.el('resultMenu').click();assert.equal(g.fieldStyle(),'classic');g.start();assert.equal(g.fieldActorsActive(),false);assert.equal(g.bossTestState().active,false);
});
test('Alpha 0.60 testing disables timed hordes, side events and extraction without changing native bosses',()=>{
 const g=loadGame();enterBoss60(g,'harvester');for(const id of ['spawn','nextBossAt','nextHowlerAt','nextLobberAt','nextConvoyAt','nextDropAt','nextSpitterAt','nextRiotAt','nextRescueAt','nextSalvageAt','nextSupplyAt','exitAt','barrelClock','barricadeClock','shockClock'])if(id in g.state)assert.equal(g.state[id],Infinity,id);assert.equal(g.state.obstacles.length,0);assert.equal(g.state.barrels.length,0);assert.equal(g.state.barricades.length,0);assert.equal(g.state.patrol.length,0);for(let i=0;i<400;i++)g.update(.02);assert.equal(g.state.enemies.length,1);assert.equal(g.state.exitBeacon,null);assert.equal(g.state.level,1);assert.equal(g.state.xp,0);
});
test('Alpha 0.60 entering and ending tests preserves selected deployment, raw records and preferences',()=>{
 const g=loadGame({stored:'1800'});g.showRoster();g.selectSurvivor('quartermaster');g.selectRoute('park');g.selectRule('iron');g.selectContract('demolition');g.el('rosterBack').click();const before={role:g.state.selectedSurvivor,route:g.state.selectedRoute,rule:g.state.selectedRule,contract:g.state.selectedContract,journal:g.journalSaved(),prefs:g.preferencesSaved(),record:g.saved()};enterBoss60(g,'warden');g.setup({elapsed:4000});g.end('abandoned');assert.equal(g.saved(),before.record);assert.equal(g.journalSaved(),before.journal);assert.equal(g.preferencesSaved(),before.prefs);assert.equal(g.state.selectedSurvivor,before.role);assert.equal(g.state.selectedRoute,before.route);assert.equal(g.state.selectedRule,before.rule);assert.equal(g.state.selectedContract,before.contract);
});
test('Alpha 0.60 damage-safe HP uses native would-be-hit accounting and does not persist to scored play',()=>{
 const g=loadGame();enterBoss60(g);assert.equal(g.hurtPlayer(999,'breaker'),false);near(g.p.hp,100);assert.equal(g.practiceSnapshot().threats,1);g.end('abandoned');g.advanceClock(500);g.el('resultMenu').click();g.start();assert.equal(g.state.training,false);g.hurtPlayer(10,'runner');near(g.p.hp,90);
});
test('Alpha 0.60 each test boss runs native phases and attacks while player attacks are off',()=>{
 for(const kind of ['breaker','warden','harvester']){const g=loadGame();enterBoss60(g,kind);const e=g.state.activeBoss,phases=new Set();let hostile=false,pulse=false;for(let i=0;i<400;i++){g.update(.02);phases.add(e.phase);hostile||=g.state.hostileShots.length>0;pulse||=g.state.blastRings.length>0}assert.ok(phases.size>=3,kind);assert.equal(e.hp,e.max);near(g.p.hp,100);assert.equal(g.state.bullets.length,0);if(kind==='warden')assert.equal(hostile,true);if(kind==='harvester')assert.equal(pulse,true)}
});
test('Alpha 0.60 attacks OFF suppresses gun and all rank-three/evolved weapon damage and effects',()=>{
 for(const weapon of ['gun','pierce','arc','blades','molotov']){const g=loadGame();enterBoss60(g);g.pause();g.resetBossTesting('breaker',weapon,true);const e=g.state.activeBoss;g.resume();for(let i=0;i<200;i++){g.update(.02);g.render()}assert.equal(e.hp,e.max,weapon);assert.equal(g.state.bullets.length,0);assert.equal(g.state.lightning.length,0);assert.equal(g.state.fires.length,0);assert.equal(g.practiceSnapshot().damage,0)}
});
test('Alpha 0.60 attacks toggle preserves paused boss/clock and enables actual native gun damage',()=>{
 const g=loadGame();enterBoss60(g);g.update(.02);g.pause();const e=g.state.activeBoss,time=g.state.elapsed,phase=e.phase,pt=e.phaseTime;g.el('bossTestAttacks').click();assert.equal(g.state.mode,'paused');assert.equal(g.bossTestState().attacks,true);assert.equal(g.state.elapsed,time);assert.equal(e.phase,phase);assert.equal(e.phaseTime,pt);g.resume();for(let i=0;i<80;i++)g.update(.02);assert.ok(e.hp<e.max);assert.ok(g.practiceSnapshot().damage>0);g.pause();const hp=e.hp;g.el('bossTestAttacks').click();assert.equal(g.state.bullets.length,0);assert.equal(g.state.lightning.length,0);assert.equal(g.state.fires.length,0);g.resume();for(let i=0;i<50;i++)g.update(.02);assert.equal(e.hp,hp);
});
test('Alpha 0.60 boss dropdown, Next and Restart reset immediately and remain paused',()=>{
 const g=loadGame();enterBoss60(g);g.update(.2);g.p.x=120;g.pause();g.el('bossTestKind').value='warden';g.el('bossTestKind').dispatch('change');assert.equal(g.state.mode,'paused');assert.equal(g.state.activeBoss.bossKind,'warden');assert.equal(g.state.elapsed,0);assert.equal(g.p.x,0);g.el('bossTestNext').click();assert.equal(g.state.activeBoss.bossKind,'harvester');g.el('bossTestNext').click();assert.equal(g.state.activeBoss.bossKind,'breaker');g.state.activeBoss.hp=1;g.el('bossTestRestart').click();assert.equal(g.state.activeBoss.hp,650);assert.equal(g.state.mode,'paused');
});
test('Alpha 0.60 loadout/evolution selection uses real ranks and Gun-only keeps evolutions disabled',()=>{
 const g=loadGame();enterBoss60(g);g.pause();for(const weapon of ['arc','blades','molotov','pierce']){g.el('bossTestWeapon').value=weapon;g.el('bossTestWeapon').dispatch('change');assert.equal(g.p[weapon],3);assert.equal(g.state.mode,'paused');g.el('bossTestEvolved').click();assert.equal(g.state.trainingEvolved,true);const field={arc:'thunder',blades:'reaper',molotov:'wildfire',pierce:'rail'}[weapon];assert.equal(g.p[field],true);g.el('bossTestEvolved').click();assert.equal(g.p[field],false)}g.el('bossTestWeapon').value='gun';g.el('bossTestWeapon').dispatch('change');for(const id of ['pierce','arc','blades','molotov'])assert.equal(g.p[id],0);assert.equal(g.state.trainingEvolved,false);g.el('bossTestEvolved').click();assert.equal(g.state.trainingEvolved,false);
});
test('Alpha 0.60 restarting clears shots, hazards, threat/practice totals and frame measurements',()=>{
 const g=loadGame();enterBoss60(g);g.hurtPlayer(10,'breaker');g.setup({bullets:[bullet()],hostileShots:[{x:5,y:5}],fires:[{x:0,y:0}],bottles:[{x:0,y:0}],elapsed:40});g.pause();g.showSettings();g.togglePerformance();g.closeSettings();g.el('bossTestRestart').click();assert.equal(g.state.elapsed,0);assert.equal(g.practiceSnapshot().time,0);assert.equal(g.practiceSnapshot().threats,0);assert.equal(g.practiceSnapshot().damage,0);assert.equal(g.state.bullets.length,0);assert.equal(g.state.hostileShots.length,0);assert.equal(g.state.fires.length,0);assert.equal(g.state.bottles.length,0);assert.equal(g.performanceSnapshot().frames,0);assert.equal(g.state.diagnostics.enabled,true);
});
test('Alpha 0.60 killed bosses respawn nearby with full native HP and keep practice-only credit/art',()=>{
 const g=loadGame({stored:'900'});enterBoss60(g,'harvester');const saved=g.journalSaved(),prefs=g.preferencesSaved(),cache=g.fieldState().harvester;g.hitEnemy(g.state.activeBoss,1e9);assert.equal(g.practiceSnapshot().targets,1);assert.equal(g.state.killCount,0);assert.equal(g.state.bossesDefeated,0);assert.equal(g.state.harvestersDefeated,0);g.p.x=500;for(let i=0;i<90;i++)g.update(.02);assert.ok(g.state.activeBoss.hp>0);assert.equal(g.state.activeBoss.hp,750);near(g.state.activeBoss.x,g.p.x);assert.ok(Math.abs(g.state.activeBoss.y-g.p.y)<150);assert.equal(g.fieldState().harvester,cache);assert.equal(g.practiceSnapshot().targets,1);assert.equal(g.state.gems.length,0);assert.equal(g.saved(),'900');assert.equal(g.journalSaved(),saved);assert.equal(g.preferencesSaved(),prefs);
});
test('Alpha 0.60 native five-lane and pulse behavior remain real with damage-safe training',()=>{
 const w=loadGame();enterBoss60(w,'warden');const e=w.state.activeBoss;e.phase='warn';e.phaseTime=.01;e.aimAngle=.3;w.moveWarden(e,.02);assert.equal(w.state.hostileShots.length,5);near(w.p.hp,100);const h=loadGame();enterBoss60(h,'harvester');const b=h.state.activeBoss;b.phase='warn';b.phaseTime=.01;b.pulseX=h.p.x;b.pulseY=h.p.y;h.moveHarvester(b,.02);assert.equal(h.state.blastRings.length,1);near(h.state.blastRings[0].radius,135);near(h.p.hp,100);assert.equal(h.practiceSnapshot().threats,1);
});
test('Alpha 0.60 Field/Classic test comparisons preserve phase, HP, world and normal preferences',()=>{
 const g=loadGame();enterBoss60(g,'warden');g.update(.02);g.pause();const before=fieldWorld56(g),saved=g.preferencesSaved();g.el('bossTestArt').click();assert.equal(g.fieldActorsActive(),false);assert.equal(g.state.mode,'paused');assert.deepEqual(fieldWorld56(g),before);g.el('bossTestArt').click();assert.equal(g.fieldWardenActive(g.state.activeBoss),true);assert.deepEqual(fieldWorld56(g),before);assert.equal(g.preferencesSaved(),saved);
});
test('Alpha 0.60 dead/pending test art cannot revive after finish and Retry restores held test configuration',()=>{
 const g=loadGame({artworkStatus:'pending'});enterBoss60(g,'warden');const load=g.pendingImages[0].onload;g.pause();g.resetBossTesting('warden','arc',true);g.el('bossTestAttacks').click();quitForTest(g);const r=g.state.runResult;assert.equal(r.training,true);assert.equal(r.bossTest.boss,'warden');assert.equal(r.bossTest.weapon,'arc');assert.equal(r.bossTest.evolved,true);assert.equal(r.bossTest.attacks,true);assert.equal(g.fieldState().status,'idle');load();assert.equal(g.fieldState().status,'idle');g.advanceClock(500);g.el('again').click();assert.equal(g.bossTestState().active,true);assert.equal(g.state.trainingScenario,'warden');assert.equal(g.p.arc,3);assert.equal(g.p.thunder,true);assert.equal(g.bossTestState().attacks,true);assert.equal(g.state.elapsed,0);
});
test('Alpha 0.60 held practice results/report never save scores, medals, enemy totals or fake boss kills',()=>{
 const g=loadGame({stored:'1800'});enterBoss60(g);const journal=g.journalSaved(),prefs=g.preferencesSaved();g.hitEnemy(g.state.activeBoss,1e9);g.setup({elapsed:4000});g.end('abandoned');const r=g.state.runResult;assert.equal(r.training,true);assert.equal(r.kills,0);assert.equal(r.breakers,0);assert.equal(r.wardens,0);assert.equal(r.harvesters,0);assert.equal(r.practice.targets,1);assert.equal(g.earnedMedals(r).length,0);assert.equal(g.saved(),'1800');assert.equal(g.journalSaved(),journal);assert.equal(g.preferencesSaved(),prefs);assert.match(g.runReportText(),/BOSS TESTING: breaker/);assert.match(g.runReportText(),/NOT SAVED TO RUN LOG/);assert.match(g.el('modal').innerHTML,/BOSS TESTING COMPLETE/);
});
test('Alpha 0.60 held phone reports include actual boss/loadout/attacks/art and Back returns to Pause',()=>{
 const g=loadGame();enterBoss60(g,'harvester');g.pause();g.resetBossTesting('harvester','molotov',true);g.el('bossTestReport').click();assert.equal(g.state.mode,'benchmark');const report=g.benchmarkText(),time=g.state.elapsed;assert.match(report,/Boss test: harvester · molotov · evolution ON · attacks OFF · HP safe/);assert.match(report,/Harvester art ready/);g.frame(100000);assert.equal(g.benchmarkText(),report);near(g.state.elapsed,time);g.phoneBack();assert.equal(g.state.mode,'paused');g.el('bossTestNext').click();g.el('bossTestReport').click();assert.match(g.benchmarkText(),/Boss test: breaker/);
});
test('Alpha 0.60 Back, second-finger Pause and background keep tests frozen until explicit Resume',()=>{
 const g=loadGame();enterBoss60(g);g.el('stick').dispatch('pointerdown',{pointerId:1,clientX:135.5,clientY:662.5});g.el('pause').dispatch('pointerdown',{pointerId:2});assert.equal(g.state.mode,'paused');const world=fieldWorld56(g);g.phoneBack();g.frame(100000);assert.deepEqual(fieldWorld56(g),world);g.resume();g.document.hidden=true;g.event('visibilitychange');assert.equal(g.state.mode,'paused');const time=g.state.elapsed;g.document.hidden=false;g.event('visibilitychange');g.update(10);near(g.state.elapsed,time);
});
test('Alpha 0.60 stale/hidden/invalid developer actions cannot start or reset the wrong scene',()=>{
 const g=loadGame();g.startBossTesting('warden');assert.equal(g.state.mode,'menu');g.el('previewsOpen').click();g.startBossTesting('invalid');assert.equal(g.state.mode,'previews');g.document.hidden=true;g.startBossTesting('breaker');assert.equal(g.state.mode,'previews');g.document.hidden=false;g.startBossTesting('breaker');g.pause();const old=g.el('bossTestRestart'),pick=g.el('bossTestKind');g.resetBossTesting('warden');const boss=g.state.activeBoss;old.click();pick.value='harvester';pick.dispatch('change');assert.equal(g.state.activeBoss,boss);g.resetBossTesting('invalid');g.resetBossTesting('breaker','invalid');assert.equal(g.state.activeBoss,boss);g.resume();g.startBossTesting('harvester');assert.equal(g.state.activeBoss,boss);
});
test('Alpha 0.60 leaving developer tests restores fresh scored stats, schedules and saved art choice',()=>{
 const g=loadGame({preferencesStored:JSON.stringify({version:1,actors:'classic'})});enterBoss60(g);g.pause();g.resetBossTesting('warden','blades',true);g.el('bossTestAttacks').click();quitForTest(g);g.advanceClock(500);g.el('resultMenu').click();g.el('start').click();g.el('deploy').click();assert.equal(g.state.training,false);assert.equal(g.bossTestState().active,false);assert.equal(g.fieldStyle(),'classic');assert.equal(g.state.activeBoss,null);assert.equal(g.state.nextBossAt,90);assert.equal(g.state.exitAt,180);assert.ok(g.state.obstacles.length>0);for(const id of ['pierce','arc','blades','molotov'])assert.equal(g.p[id],0);assert.equal(g.p.reaper,false);assert.equal(g.p.damage,18);assert.equal(g.state.elapsed,0);assert.equal(g.currentRunStats().bossTest,undefined);
});
test('Alpha 0.60 ordinary training and Street Prototype retain their original art/caches/accounting',()=>{
 const g=loadGame();g.startTraining('pierce',false,'warden');assert.equal(g.bossTestState().active,false);assert.equal(g.pendingImages.length,0);assert.equal(g.fieldActorsActive(),false);assert.ok(g.el('bossTestKind')===undefined);const h=loadGame();enterTrial54(h,'crowd');assert.equal(h.bossTestState().active,false);assert.equal(h.pendingImages.length,12);assert.equal(h.fieldActorsActive(),false);
});
test('Alpha 0.60 blocked/future storage still permits safe session-only boss testing and preserves unknown data',()=>{
 const future=JSON.stringify({version:99,actors:'future',keep:'unchanged'});for(const storageBlocked of [false,true]){const g=loadGame({storageBlocked,preferencesStored:future,stored:'900'});enterBoss60(g,'harvester');g.pause();g.el('bossTestArt').click();g.el('bossTestAttacks').click();quitForTest(g);assert.equal(g.preferencesSaved(),future);assert.equal(g.saved(),'900');assert.equal(g.state.runResult.training,true)}
});
test('Alpha 0.60 developer mode adds no media, canvas, permanent preference or public production API',()=>{
 assert.ok(Buffer.byteLength(html)<12*1024*1024);assert.equal((html.match(/<canvas\b/g)||[]).length,6);assert.doesNotMatch(source,/globalThis\.api/);const g=loadGame();const before=JSON.stringify(g.state.preferences);enterBoss60(g);g.pause();g.el('bossTestArt').click();g.el('bossTestAttacks').click();assert.equal(JSON.stringify(g.state.preferences),before);assert.equal(g.preferencesSaved(),null);
});

// Alpha 0.61 — compact Riot Guard Field art and immediate native review drill.
function riot61(g,extra={}){const e=riot(extra);g.setup({enemies:[e],nextBossAt:Infinity,exitAt:Infinity,obstacles:[],barrels:[],barrelClock:Infinity,nextSupplyAt:Infinity});g.prepareFieldRiot();return e}
function enterRiot61(g){g.el('previewsOpen').click();g.advanceClock(500);g.el('riotReview').click();assert.equal(g.state.mode,'play');assert.equal(g.state.trainingScenario,'riot');return g.state.enemies.find(e=>e.riot)}
test('Alpha 0.61 Riot source/runtime hashes, lossless derivative metadata and 35 isolated crops are valid',()=>{
 const a=JSON.parse(sampleAssetText).riot,m=JSON.parse(readFileSync(join(__dirname,'../dist/assets/riot-field.json'))),r=JSON.parse(readFileSync(join(__dirname,'../dist/assets/runtime-formats.json'))).riot,hash=b=>require('node:crypto').createHash('sha256').update(b).digest('hex'),png=readFileSync(join(__dirname,'../dist/assets/riot-field.png')),runtime=readFileSync(join(__dirname,'../dist/assets/riot-field.webp'));assert.equal(hash(png),m.sha256);assert.equal(hash(runtime),a.sha256);assert.deepEqual(Buffer.from(a.src.split(',')[1],'base64'),runtime);assert.equal(png.readUInt32BE(16),1024);assert.equal(png.readUInt32BE(20),1536);assert.equal(r.rgba_exact,true);assert.equal(r.alpha_exact,true);assert.equal(r.visible_rgb_psnr_db,null);assert.match(r.encoding,/15:32 Lanczos.*lossless/);assert.match(r.alpha_comparison,/not full-resolution original/);assert.equal(a.width,640);assert.equal(a.height,432);assert.equal(a.frames.length,35);assert.equal(m.poses.length,7);assert.equal(m.views.length,5);for(let i=0;i<35;i++){const [x,y,w,h]=a.frames[i],c=(m.packedRuntime?.cellBounds||m.cellBounds)[i];assert.ok(x>=c[0]&&y>=c[1]&&x+w<=c[0]+c[2]&&y+h<=c[1]+c[3]);assert.ok(w>30&&h>80);assert.equal(a.pivots[i][1],h);assert.ok(a.pivots[i][0]>=0&&a.pivots[i][0]<=w)}
});
test('Alpha 0.61 Riot sheet loads once for two live guards and can coexist with the optional boss',()=>{
 const g=loadGame();cleanRun(g);assert.equal(g.pendingImages.length,5);assert.equal(g.fieldState().riot.status,'idle');const e=riot61(g);assert.equal(g.pendingImages.length,6);assert.equal(g.fieldRiotActive(e),true);const second=riot({x:140});g.state.enemies.push(second);g.prepareFieldRiot();assert.equal(g.pendingImages.length,6);assert.equal(g.fieldRiotActive(second),true);breaker57(g);assert.equal(g.fieldState().breaker.status,'ready');assert.equal(g.fieldState().riot.status,'ready');assert.equal(g.pendingImages.length,8);assert.ok(g.pendingImages.every(im=>im.onload===null&&im.onerror===null));
});
test('Alpha 0.61 Classic, ordinary practice and original street prototype skip Riot decoding',()=>{
 const g=loadGame({preferencesStored:JSON.stringify({version:1,actors:'classic'})});cleanRun(g);riot61(g);assert.equal(g.pendingImages.length,0);assert.equal(g.fieldState().riot.status,'idle');const t=loadGame();t.startTraining('pierce',false,'riot');assert.equal(t.pendingImages.length,0);assert.equal(t.fieldActorsActive(),false);const h=loadGame();enterTrial54(h,'crowd');assert.equal(h.pendingImages.length,12);assert.equal(h.fieldState().riot.status,'idle');
});
test('Alpha 0.61 pending Riot decode retains common art and completion changes no native world state',()=>{
 const g=loadGame({artworkStatus:'pending'});cleanRun(g);g.resolveArtwork();const e=riot61(g),world=fieldWorld56(g),im=g.pendingImages[5];assert.equal(g.fieldRiotActive(e),false);assert.equal(g.fieldActorsActive(),true);im.naturalWidth=480;im.naturalHeight=720;im.onload();assert.equal(g.fieldRiotActive(e),true);assert.deepEqual(fieldWorld56(g),world);assert.equal(im.onload,null);assert.equal(im.onerror,null);
});
test('Alpha 0.61 bad, absent, oversized or zero-size Riot art falls back without repeated requests',()=>{
 for(const failure of ['error','missing','budget','zero']){const g=loadGame({artworkStatus:'pending'});cleanRun(g);g.resolveArtwork();if(['missing','budget'].includes(failure)){const data=JSON.parse(sampleAssetText);if(failure==='missing')delete data.riot;else data.riot.width=999999;g.el('sampleAssets').textContent=JSON.stringify(data)}const e=riot61(g);if(failure==='error')g.pendingImages[5].onerror();if(failure==='zero'){const im=g.pendingImages[5];im.naturalWidth=0;im.naturalHeight=0;im.onload()}assert.equal(g.fieldState().riot.status,'failed');assert.equal(g.fieldRiotActive(e),false);assert.equal(g.fieldActorsActive(),true);assert.match(g.fieldArtStatus(),/Riot Guard art unavailable.*Classic/);const n=g.pendingImages.length;g.prepareFieldRiot();assert.equal(g.pendingImages.length,n);g.update(.02);assert.equal(g.state.mode,'play')}
});
test('Alpha 0.61 stale Riot callbacks cannot revive cancelled, replaced, finished or new-run caches',()=>{
 const g=loadGame({artworkStatus:'pending'});cleanRun(g);g.resolveArtwork();riot61(g);const im=g.pendingImages[5],onload=im.onload,onerror=im.onerror;g.setup({enemies:[]});g.prepareFieldRiot();assert.equal(im.onload,null);assert.equal(im.onerror,null);riot61(g);const replacement=g.fieldState().riot;onload();onerror();assert.equal(g.fieldState().riot,replacement);assert.equal(replacement.status,'loading');g.pause();g.selectFieldActors('classic');onload();assert.equal(g.fieldState().riot.status,'idle');g.end('abandoned');onload();assert.equal(g.fieldState().riot.status,'idle');g.start();onerror();assert.equal(g.fieldState().riot.status,'idle');
});
test('Alpha 0.61 last guard death releases its optional sheet without releasing common or boss artwork',()=>{
 const g=loadGame();cleanRun(g);const e=riot61(g);breaker57(g);e.hp=0;g.prepareFieldRiot();assert.equal(g.fieldState().riot.status,'idle');assert.equal(g.fieldState().breaker.status,'ready');assert.equal(g.fieldActorsActive(),true);assert.equal(Object.keys(g.fieldState().rows).length,5);
});
test('Alpha 0.61 eight Riot headings follow true shield facing even after many full turns',()=>{
 const g=loadGame();cleanRun(g);const e=riot61(g,{facing:0});for(const turn of [-100,-4,0,4,100])for(let dir=0;dir<8;dir++){e.facing=turn*2*Math.PI+dir*Math.PI/4;const k=g.fieldRiotPose(e,{moving:true,travel:20});assert.equal(k.direction,dir);assert.equal(k.pose.frame%5,[0,1,2,1,0,3,4,3][dir]);assert.equal(k.flip,[1,1,1,-1,-1,-1,1,1][dir])}e.facing=0;g.fieldRiotMotion(e);e.x-=15;g.advanceFieldRiot(.02);assert.equal(g.fieldRiotMotion(e).direction,0,'travel or player bearing must not override the native shield');
});
test('Alpha 0.61 native windup/bash/recovery/stun select correct poses with no raised-shield recovery ghost',()=>{
 const g=loadGame();cleanRun(g);const e=riot61(g,{facing:0});g.fieldRiotMotion(e);for(const [phase,row] of [['warn',4],['bash',5],['recover',6],['approach',0]]){e.phase=phase;g.advanceFieldRiot(.02);assert.equal(Math.floor(g.fieldRiotMotion(e).pose.frame/5),row);if(phase==='recover'||phase==='approach')assert.equal(g.fieldRiotMotion(e).previous,null)}e.salvageStunUntil=10;g.advanceFieldRiot(.02);assert.equal(Math.floor(g.fieldRiotMotion(e).pose.frame/5),6);assert.equal(g.fieldRiotMotion(e).previous,null);g.setup({elapsed:11});g.advanceFieldRiot(.02);assert.equal(Math.floor(g.fieldRiotMotion(e).pose.frame/5),0);assert.equal(g.fieldRiotMotion(e).previous,null);
});
test('Alpha 0.61 Riot gait advances by actual distance and stops or resets on idle and teleports',()=>{
 const g=loadGame();cleanRun(g);const e=riot61(g,{facing:0}),m=g.fieldRiotMotion(e),keys=new Set();for(let i=0;i<4;i++){e.x+=16;g.advanceFieldRiot(.02);keys.add(Math.floor(m.pose.frame/5))}assert.equal(keys.size,4);const travel=m.travel;g.advanceFieldRiot(.02);assert.equal(m.travel,travel);assert.equal(Math.floor(m.pose.frame/5),0);e.x+=1000;g.advanceFieldRiot(.02);assert.equal(m.travel,0);assert.equal(m.moving,false);assert.equal(m.previous,null);
});
test('Alpha 0.61 fixed Riot feet and per-view scales keep the native shield and name clear',()=>{
 const g=loadGame({traceCanvas:true});cleanRun(g);const e=riot61(g,{x:50,y:0,facing:Math.PI/2}),info=g.fieldActorInfo(e,'riot'),a=JSON.parse(sampleAssetText).riot;near(info.scale,60/a.referenceHeights[info.motion.pose.frame%5]);assert.deepEqual(Array.from(info.pivot),a.pivots[info.motion.pose.frame]);g.clearTrace();g.renderEnemy(e);const trace=g.drawingTrace();assert.ok(trace.some(row=>row[0]==='drawImage'&&row[1]===g.fieldState().riot.row.image));assert.ok(trace.some(row=>row[0]==='translate'&&row[1]===0&&row[2]===e.r*.6));assert.ok(trace.some(row=>row[0]==='arc'&&row[1]===e.x&&row[2]===e.y&&row[3]===25));const label=trace.find(row=>row[0]==='fillText'&&row[1]==='GUARD · SHIELDED');near(label[3],e.y+e.r*.6-60-24);
});
test('Alpha 0.61 Reduced Effects and shield changes never draw additional old shield-state layers',()=>{
 const g=loadGame();cleanRun(g);const e=riot61(g,{facing:0});g.fieldRiotMotion(e);e.facing=Math.PI/4;g.advanceFieldRiot(.02);assert.equal(g.fieldActorInfo(e,'riot').layers.length,2);g.state.preferences.reduced=true;assert.equal(g.fieldActorInfo(e,'riot').layers.length,1);g.advanceFieldRiot(.02);assert.equal(g.fieldRiotMotion(e).previous,null);g.state.preferences.reduced=false;e.phase='recover';g.advanceFieldRiot(.02);assert.equal(g.fieldActorInfo(e,'riot').layers.length,1);e.phase='approach';g.advanceFieldRiot(.02);assert.equal(g.fieldActorInfo(e,'riot').layers.length,1);
});
test('Alpha 0.61 offscreen guards cull image work while two live guard motions remain independent',()=>{
 const g=loadGame({traceCanvas:true});cleanRun(g);const a=riot61(g,{x:50,facing:0}),b=riot({x:3000,facing:Math.PI});g.state.enemies.push(b);g.fieldRiotMotion(a);g.fieldRiotMotion(b);a.x+=16;g.advanceFieldRiot(.02);assert.notEqual(g.fieldRiotMotion(a).travel,g.fieldRiotMotion(b).travel);const world=fieldWorld56(g);g.clearTrace();g.renderEnemy(b);assert.equal(g.drawingTrace().filter(row=>row[0]==='drawImage').length,0);assert.deepEqual(fieldWorld56(g),world);assert.equal(typeof g.fieldState().motion.get,'function');
});
test('Alpha 0.61 Field guard retains true frontal Railstorm blocking, flanks and shield-down damage',()=>{
 for(const route of ['front','rail','rear','recover']){const g=loadGame();cleanRun(g);const e=riot61(g,{x:100,facing:Math.PI,phase:route==='recover'?'recover':'approach'}),b=route==='rear'?{x:200,y:0,vx:-1000,vy:0}:{x:0,y:0,vx:1000,vy:0};g.setup({bullets:[{...b,r:4,life:1,dmg:18,remainingHits:route==='rail'?8:1,rail:route==='rail'}]});g.updateProjectiles(.2);near(e.hp,['front','rail'].includes(route)?100:82);assert.equal(g.state.bullets.length,0);assert.equal(g.state.killCount,0)}
});
test('Alpha 0.61 guard visuals preserve exact native ninety-unit bash and full recovery opening',()=>{
 const g=loadGame();cleanRun(g);const e=riot61(g,{x:100,facing:Math.PI,phase:'warn',phaseTime:.01});const before=fieldWorld56(g);g.fieldRiotPose(e);g.advanceFieldRiot(.02);assert.deepEqual(fieldWorld56(g),before);g.moveRiot(e,.02);assert.equal(e.phase,'bash');g.advanceFieldRiot(.02);assert.equal(Math.floor(g.fieldRiotMotion(e).pose.frame/5),5);g.moveRiot(e,.1);g.moveRiot(e,1);near(e.x,10);assert.equal(e.phase,'recover');near(e.phaseTime,2.2);g.advanceFieldRiot(.02);assert.equal(Math.floor(g.fieldRiotMotion(e).pose.frame/5),6);assert.equal(g.riotShieldUp(e),false);g.moveRiot(e,2.2);assert.equal(e.phase,'approach');assert.equal(g.riotShieldUp(e),true);
});
test('Alpha 0.61 Field and Classic guards produce equal seeded native combat, rewards and upgrade draws',()=>{
 const worlds=[];for(const actors of ['field','classic']){const g=loadGame({seed:113,preferencesStored:JSON.stringify({version:1,actors})});cleanRun(g);riot61(g,{hp:1000,max:1000});g.p.fireClock=999;g.p.inv=999;for(let i=0;i<120;i++){g.update(.02);g.render()}g.setup({xp:g.state.nextXp});g.checkLevelUp();worlds.push({world:fieldWorld56(g),choices:g.state.upgradeOffer?.choices?.map(x=>x.name)||g.choices().map(x=>x.innerHTML)})}assert.deepEqual(worlds[0],worlds[1]);
});
test('Alpha 0.61 Bestiary portraits and native shield overlay geometry remain unaffected by Field art',()=>{
 const g=loadGame({traceCanvas:true}),c=loadGame({traceCanvas:true,preferencesStored:JSON.stringify({version:1,actors:'classic'})});cleanRun(g);cleanRun(c);riot61(g);const e=g.enemyPortraitEntity('riot');g.clearTrace();c.clearTrace();g.renderEnemy(e,g.el('game').getContext('2d'),true);c.renderEnemy(e,c.el('game').getContext('2d'),true);assert.equal(JSON.stringify(g.drawingTrace()),JSON.stringify(c.drawingTrace()));for(const phase of ['approach','warn','bash','recover']){e.phase=phase;g.clearTrace();c.clearTrace();g.renderRiot(e);c.renderRiot(e);assert.equal(JSON.stringify(g.drawingTrace()),JSON.stringify(c.drawingTrace()))}
});
test('Alpha 0.61 direct Guard review is nearby, HP-safe, Field and unscored in all phone views',()=>{
 for(const [width,height] of [[412,915],[915,412],[320,568],[568,320]]){const g=loadGame({width,height,stored:'1800'}),e=enterRiot61(g);assert.equal(g.state.activeBoss,null);assert.equal(e.hp,300);assert.equal(e.max,300);assert.equal(g.fieldRiotActive(e),true);assert.equal(g.pendingImages.length,6);assert.equal(g.bossTestState().attacks,false);assert.equal(g.p.pierce,0);assert.equal(g.state.training,true);assert.ok(Math.abs(e.x-g.p.x)<width/2-25);assert.ok(Math.abs(e.y-g.p.y)<height/2-25);assert.match(g.el('runGoal').textContent,/HP SAFE · ATTACKS OFF/);assert.match(g.el('objective').textContent,/GUARD TEST/);assert.equal(g.saved(),'1800')}
});
test('Alpha 0.61 Guard review runs real shield phases safely with no player damage, hordes or side goals',()=>{
 const g=loadGame(),e=enterRiot61(g),phases=new Set();for(let i=0;i<600;i++){g.update(.02);phases.add(e.phase)}assert.ok(phases.has('warn')&&phases.has('bash')&&phases.has('recover'));near(g.p.hp,100);near(e.hp,300);assert.ok(g.practiceSnapshot().threats>0);assert.equal(g.state.bullets.length,0);assert.equal(g.state.enemies.length,1);assert.equal(g.state.exitBeacon,null);assert.equal(g.state.level,1);assert.equal(g.state.xp,0);
});
test('Alpha 0.61 Guard review weapon/reset controls hold Pause and preserve the three-boss Next cycle',()=>{
 const g=loadGame();enterRiot61(g);g.update(.02);g.pause();assert.match(g.el('modal').innerHTML,/RIOT GUARD ART DRILL/);g.el('bossTestWeapon').value='arc';g.el('bossTestWeapon').dispatch('change');assert.equal(g.state.mode,'paused');assert.equal(g.p.arc,3);assert.equal(g.state.elapsed,0);g.el('bossTestEvolved').click();assert.equal(g.p.thunder,true);g.el('bossTestAttacks').click();assert.equal(g.bossTestState().attacks,true);g.el('bossTestRestart').click();assert.equal(g.state.mode,'paused');assert.equal(g.state.enemies[0].hp,300);g.el('bossTestNext').click();assert.equal(g.state.activeBoss.bossKind,'breaker');g.el('bossTestNext').click();assert.equal(g.state.activeBoss.bossKind,'warden');g.el('bossTestNext').click();assert.equal(g.state.activeBoss.bossKind,'harvester');g.el('bossTestNext').click();assert.equal(g.state.activeBoss.bossKind,'breaker');g.el('bossTestKind').value='riot';g.el('bossTestKind').dispatch('change');assert.equal(g.state.activeBoss,null);assert.equal(g.state.enemies[0].riot,true);assert.equal(g.state.mode,'paused');
});
test('Alpha 0.61 dead training guards respawn nearby without scored credit or repeat image decoding',()=>{
 const g=loadGame(),e=enterRiot61(g),group=g.fieldState().riot,count=g.pendingImages.length;g.hitEnemy(e,1e9,'GUN');assert.equal(g.practiceSnapshot().targets,1);assert.equal(g.state.killCount,0);assert.equal(g.state.riotsDefeated,0);g.p.x=500;let next;for(let i=0;i<90&&!next;i++){g.update(.02);next=g.state.enemies.find(x=>x.riot&&x.hp>0)}assert.ok(next&&next!==e);near(next.x,g.p.x);assert.ok(Math.abs(next.y-g.p.y)<150);assert.equal(next.hp,300);assert.equal(g.fieldState().riot,group);assert.equal(g.pendingImages.length,count);assert.equal(g.state.gems.length,0);
});
test('Alpha 0.61 Guard review held results/report and One More Run preserve actual configuration only',()=>{
 const raw=JSON.stringify({version:1,actors:'classic'}),g=loadGame({preferencesStored:raw,stored:'900'});enterRiot61(g);g.pause();g.resetBossTesting('riot','blades',true);g.el('bossTestAttacks').click();g.el('bossTestArt').click();quitForTest(g);const r=g.state.runResult;assert.equal(r.training,true);assert.equal(r.bossTest.boss,'riot');assert.equal(r.bossTest.field,false);assert.equal(g.fieldState().riot.status,'idle');assert.match(g.el('modal').innerHTML,/RIOT GUARD DRILL COMPLETE · UNSCORED/);assert.match(g.runReportText(),/RIOT GUARD DRILL: riot/);assert.equal(g.saved(),'900');assert.equal(g.preferencesSaved(),raw);g.advanceClock(500);g.el('again').click();assert.equal(g.state.trainingScenario,'riot');assert.equal(g.p.reaper,true);assert.equal(g.fieldStyle(),'classic');assert.equal(g.bossTestState().attacks,true);g.end('abandoned');g.advanceClock(500);g.el('resultMenu').click();g.start();assert.equal(g.state.training,false);assert.equal(g.bossTestState().active,false);assert.equal(g.state.riotsDefeated,0);assert.equal(g.fieldStyle(),'classic');
});
test('Alpha 0.61 Guard review comparisons/reports/Back/background freeze the encounter and saved choice',()=>{
 const raw=JSON.stringify({version:1,actors:'classic'}),g=loadGame({preferencesStored:raw});enterRiot61(g);g.update(.02);g.pause();const world=fieldWorld56(g),prefs=g.preferencesSaved();g.el('bossTestArt').click();assert.deepEqual(fieldWorld56(g),world);g.el('bossTestArt').click();assert.deepEqual(fieldWorld56(g),world);g.el('bossTestReport').click();const report=g.benchmarkText();assert.match(report,/Developer guard drill: riot/);assert.match(report,/Riot Guard art ready/);g.frame(10000);assert.deepEqual(fieldWorld56(g),world);assert.equal(g.benchmarkText(),report);g.phoneBack();assert.equal(g.state.mode,'paused');g.resume();g.document.hidden=true;g.event('visibilitychange');assert.equal(g.state.mode,'paused');g.document.hidden=false;g.event('visibilitychange');g.update(10);assert.equal(g.state.mode,'paused');assert.deepEqual(fieldWorld56(g),world);assert.equal(g.preferencesSaved(),prefs);
});
test('Alpha 0.61 Riot fits retained download/combined decode budgets without new canvas, saves or public hooks',()=>{
 const a=JSON.parse(sampleAssetText).riot;assert.equal(a.width*a.height*4,1105920);assert.ok(41811352+a.width*a.height*4<44*1024*1024);assert.ok(Buffer.byteLength(html)<12*1024*1024);assert.equal((html.match(/<canvas\b/g)||[]).length,6);assert.doesNotMatch(source,/globalThis\.api/);const future=JSON.stringify({version:99,actors:'future',keep:'unchanged'});for(const storageBlocked of [false,true]){const g=loadGame({storageBlocked,preferencesStored:future});enterRiot61(g);g.pause();g.el('bossTestArt').click();quitForTest(g);assert.equal(g.preferencesSaved(),future);assert.equal(g.state.runResult.training,true)}
});

// Alpha 0.62 — Spitter art/shot readability and lossless survivor frame packing.
function spitter62(g,extra={}){const e=spitter(extra);g.setup({enemies:[e],nextBossAt:Infinity,exitAt:Infinity,obstacles:[],barrels:[],barrelClock:Infinity,nextSupplyAt:Infinity});g.prepareFieldSpitter();return e}
function enterSpitter62(g){g.el('previewsOpen').click();g.advanceClock(500);g.el('spitterReview').click();assert.equal(g.state.mode,'play');assert.equal(g.state.trainingScenario,'spitter');return g.state.enemies.find(e=>e.spitter)}
test('Alpha 0.62 packed survivor retains source, twenty full-frame hashes, pivots and original standing geometry',()=>{
 const a=JSON.parse(sampleAssetText).survivorWalk,m=JSON.parse(readFileSync(join(__dirname,'../dist/assets/survivor-walk.json'))),r=JSON.parse(readFileSync(join(__dirname,'../dist/assets/runtime-formats.json'))).survivorWalk,hash=b=>require('node:crypto').createHash('sha256').update(b).digest('hex');assert.equal(hash(readFileSync(join(__dirname,'../dist/assets/survivor-walk.png'))),m.sha256);assert.equal(hash(readFileSync(join(__dirname,'../dist/assets/survivor-walk.webp'))),a.sha256);assert.equal(a.width,742);assert.equal(a.height,1369);assert.equal(r.frame_rgba_exact,true);assert.equal(r.frame_rgba_sha256.length,20);assert.match(r.pixel_comparison,/No resampling/);assert.deepEqual(a.frames,r.runtime_frames);assert.deepEqual(a.pivots,m.pivots);assert.deepEqual(a.referenceHeights,m.referenceHeights);for(let i=0;i<20;i++){assert.deepEqual(a.frames[i].slice(2),m.frames[i].slice(2));assert.match(r.frame_rgba_sha256[i],/^[a-f0-9]{64}$/);for(let j=0;j<i;j++){const [x,y,w,h]=a.frames[i],[u,v,b,c]=a.frames[j];assert.ok(x>=u+b||u>=x+w||y>=v+c||v>=y+h)}}assert.equal(1122*1402*4-a.width*a.height*4,2228984);
});
test('Alpha 0.62 optional intersection optimization preserves original source, exact alpha and quality-100 provenance',()=>{
 const a=JSON.parse(sampleAssetText).intersection,m=JSON.parse(readFileSync(join(__dirname,'../dist/assets/intersection.json'))),r=JSON.parse(readFileSync(join(__dirname,'../dist/assets/runtime-formats.json'))).intersection,hash=b=>require('node:crypto').createHash('sha256').update(b).digest('hex');assert.equal(hash(readFileSync(join(__dirname,'../dist/assets/intersection.png'))),m.sha256);assert.equal(hash(readFileSync(join(__dirname,'../dist/assets/intersection.webp'))),a.sha256);assert.equal(r.alpha_exact,true);assert.ok(r.visible_rgb_psnr_db>40);assert.match(r.encoding,/quality 100/);assert.equal(r.runtime_bytes,654820);assert.equal(a.width,1448);assert.equal(a.height,1086);
});
test('Alpha 0.62 Spitter source/runtime provenance, 35 isolated crops and actual rear-view convention are valid',()=>{
 const a=JSON.parse(sampleAssetText).spitter,m=JSON.parse(readFileSync(join(__dirname,'../dist/assets/spitter-field.json'))),r=JSON.parse(readFileSync(join(__dirname,'../dist/assets/runtime-formats.json'))).spitter,hash=b=>require('node:crypto').createHash('sha256').update(b).digest('hex'),png=readFileSync(join(__dirname,'../dist/assets/spitter-field.png')),runtime=readFileSync(join(__dirname,'../dist/assets/spitter-field.webp'));assert.equal(hash(png),m.sha256);assert.equal(hash(runtime),a.sha256);assert.deepEqual(Buffer.from(a.src.split(',')[1],'base64'),runtime);assert.equal(png.readUInt32BE(16),1024);assert.equal(png.readUInt32BE(20),1536);assert.equal(r.rgba_exact,true);assert.equal(r.alpha_exact,true);assert.equal(r.visible_rgb_psnr_db,null);assert.match(r.alpha_comparison,/not full-resolution original/);assert.equal(a.frames.length,35);assert.equal(m.views[3],'northwest-rear');assert.deepEqual(m.directionFlips,[1,1,1,-1,-1,1,1,-1]);for(let i=0;i<35;i++){const [x,y,w,h]=a.frames[i],c=(m.packedRuntime?.cellBounds||m.cellBounds)[i];assert.ok(x>=c[0]&&y>=c[1]&&x+w<=c[0]+c[2]&&y+h<=c[1]+c[3]);assert.ok(w>30&&h>75);assert.equal(a.pivots[i][1],h)}
});
test('Alpha 0.62 shared Spitter sheet coexists with Riot and Breaker without redecoding for a second Spitter',()=>{
 const g=loadGame();cleanRun(g);assert.equal(g.pendingImages.length,5);const e=spitter62(g),second=spitter({x:120,y:20});g.state.enemies.push(second);g.prepareFieldSpitter();assert.equal(g.pendingImages.length,6);assert.equal(g.fieldSpitterActive(e),true);assert.equal(g.fieldSpitterActive(second),true);const guard=riot();g.state.enemies.push(guard);g.prepareFieldRiot();breaker57(g);assert.equal(g.pendingImages.length,9);assert.equal(g.fieldState().spitter.status,'ready');assert.equal(g.fieldState().riot.status,'ready');assert.equal(g.fieldState().breaker.status,'ready');assert.ok(g.pendingImages.every(im=>im.onload===null&&im.onerror===null));
});
test('Alpha 0.62 Classic, ordinary specialist practice and original prototype skip Spitter decoding',()=>{
 const g=loadGame({preferencesStored:JSON.stringify({version:1,actors:'classic'})});cleanRun(g);spitter62(g);assert.equal(g.pendingImages.length,0);assert.equal(g.fieldState().spitter.status,'idle');const t=loadGame();t.startTraining('pierce',false,'spitter');assert.equal(t.pendingImages.length,0);assert.equal(t.fieldActorsActive(),false);const h=loadGame();enterTrial54(h,'crowd');assert.equal(h.pendingImages.length,12);assert.equal(h.fieldState().spitter.status,'idle');
});
test('Alpha 0.62 pending Spitter completion preserves common readiness and native world',()=>{
 const g=loadGame({artworkStatus:'pending'});cleanRun(g);g.resolveArtwork();const e=spitter62(g),world=fieldWorld56(g),im=g.pendingImages[5];assert.equal(g.fieldSpitterActive(e),false);assert.equal(g.fieldActorsActive(),true);im.naturalWidth=480;im.naturalHeight=720;im.onload();assert.equal(g.fieldSpitterActive(e),true);assert.deepEqual(fieldWorld56(g),world);assert.equal(im.onload,null);assert.equal(im.onerror,null);
});
test('Alpha 0.62 missing, failed, zero or oversized Spitter art keeps native fallback with no retry loop',()=>{
 for(const failure of ['error','missing','budget','zero']){const g=loadGame({artworkStatus:'pending'});cleanRun(g);g.resolveArtwork();if(['missing','budget'].includes(failure)){const d=JSON.parse(sampleAssetText);if(failure==='missing')delete d.spitter;else d.spitter.width=999999;g.el('sampleAssets').textContent=JSON.stringify(d)}const e=spitter62(g);if(failure==='error')g.pendingImages[5].onerror();if(failure==='zero'){const im=g.pendingImages[5];im.naturalWidth=0;im.naturalHeight=0;im.onload()}assert.equal(g.fieldState().spitter.status,'failed');assert.equal(g.fieldSpitterActive(e),false);assert.equal(g.fieldActorsActive(),true);assert.match(g.fieldArtStatus(),/Spitter art unavailable.*Classic/);const n=g.pendingImages.length;g.prepareFieldSpitter();assert.equal(g.pendingImages.length,n);g.update(.02);assert.equal(g.state.mode,'play')}
});
test('Alpha 0.62 stale Spitter callbacks cannot revive old presence, style, finished or new-run caches',()=>{
 const g=loadGame({artworkStatus:'pending'});cleanRun(g);g.resolveArtwork();spitter62(g);const im=g.pendingImages[5],onload=im.onload,onerror=im.onerror;g.setup({enemies:[]});g.prepareFieldSpitter();assert.equal(im.onload,null);assert.equal(im.onerror,null);spitter62(g);const replacement=g.fieldState().spitter;onload();onerror();assert.equal(g.fieldState().spitter,replacement);assert.equal(replacement.status,'loading');g.pause();g.selectFieldActors('classic');onload();assert.equal(g.fieldState().spitter.status,'idle');g.end('abandoned');onerror();assert.equal(g.fieldState().spitter.status,'idle');g.start();onload();assert.equal(g.fieldState().spitter.status,'idle');
});
test('Alpha 0.62 last Spitter removal releases only its optional sheet',()=>{
 const g=loadGame();cleanRun(g);const e=spitter62(g);g.state.enemies.push(riot());g.prepareFieldRiot();breaker57(g);e.hp=0;g.prepareFieldSpitter();assert.equal(g.fieldState().spitter.status,'idle');assert.equal(g.fieldState().riot.status,'ready');assert.equal(g.fieldState().breaker.status,'ready');assert.equal(g.fieldActorsActive(),true);
});
test('Alpha 0.62 eight Spitter travel/aim headings use correct rear flips and native locked aim',()=>{
 const g=loadGame();cleanRun(g);const e=spitter62(g);for(let direction=0;direction<8;direction++){const angle=direction*Math.PI/4,m={moving:true,dx:Math.cos(angle),dy:Math.sin(angle),travel:16,releaseAt:-Infinity};e.phase='approach';let k=g.fieldSpitterPose(e,m);assert.equal(k.direction,direction);assert.equal(k.flip,[1,1,1,-1,-1,1,1,-1][direction]);assert.equal(k.pose.frame%5,[0,1,2,1,0,3,4,3][direction]);e.phase='aim';e.aimX=Math.cos(angle);e.aimY=Math.sin(angle);g.p.x=999;g.p.y=-999;k=g.fieldSpitterPose(e,m);assert.equal(k.direction,direction);assert.equal(Math.floor(k.pose.frame/5),4)}
});
test('Alpha 0.62 native one-second aim emits one real pink shot and visual updates never emit another',()=>{
 const g=loadGame();cleanRun(g);const e=spitter62(g);g.moveSpitter(e,.01);assert.equal(e.phase,'aim');near(e.phaseTime,1);g.advanceFieldSpitter(.01);const x=e.x,y=e.y;g.moveSpitter(e,.99);assert.equal(g.state.hostileShots.length,0);near(e.x,x);near(e.y,y);g.moveSpitter(e,.02);assert.equal(g.state.hostileShots.length,1);const shot=g.state.hostileShots[0];near(Math.hypot(shot.vx,shot.vy),210);near(shot.life,2.5);near(shot.dmg,10);assert.equal(shot.kind,'spitter');g.advanceFieldSpitter(.02);assert.equal(Math.floor(g.fieldSpitterMotion(e).pose.frame/5),5);for(let i=0;i<20;i++)g.advanceFieldSpitter(.02);assert.equal(g.state.hostileShots.length,1);
});
test('Alpha 0.62 release and recovery keys follow a real fresh shot and hold its aim direction',()=>{
 const g=loadGame();cleanRun(g);const e=spitter62(g,{phase:'aim',phaseTime:.01,aimX:-1,aimY:0});g.advanceFieldSpitter(.02);g.moveSpitter(e,.02);g.advanceFieldSpitter(.02);const m=g.fieldSpitterMotion(e);assert.equal(m.direction,4);assert.equal(Math.floor(m.pose.frame/5),5);g.p.y=200;g.setup({elapsed:.2});g.advanceFieldSpitter(.02);assert.equal(m.direction,4);assert.equal(Math.floor(m.pose.frame/5),6);g.setup({elapsed:.51});g.advanceFieldSpitter(.02);assert.ok(m.pose.frame<20);
});
test('Alpha 0.62 cancelled offscreen aims, full shot slots, stun resets and old projectiles never fake a spit',()=>{
 for(const reason of ['offscreen','full','stun','old']){const g=loadGame();cleanRun(g);const e=spitter62(g,{phase:'aim',phaseTime:.01,aimX:-1,aimY:0});g.advanceFieldSpitter(.02);if(reason==='offscreen'){e.x=5000;g.moveSpitter(e,.02)}else if(reason==='full'){g.setup({hostileShots:Array.from({length:g.limits.hostileShots},()=>hostileShot({x:500,y:500,vx:0,vy:0}))});g.moveSpitter(e,.02)}else{e.phase='approach';e.phaseTime=0;e.cooldown=2.8;if(reason==='stun')e.salvageStunUntil=10;else g.setup({hostileShots:[{x:e.x-25,y:e.y,vx:-210,vy:0,life:1,kind:'spitter'}]})}g.advanceFieldSpitter(.02);assert.equal(g.fieldSpitterMotion(e).releaseAt,-Infinity,reason);assert.notEqual(Math.floor(g.fieldSpitterMotion(e).pose.frame/5),5,reason)}
});
test('Alpha 0.62 Spitter gait uses real distance, stops at idle and resets travel/release on teleport',()=>{
 const g=loadGame();cleanRun(g);const e=spitter62(g),m=g.fieldSpitterMotion(e),keys=new Set();for(let i=0;i<4;i++){e.x+=15.5;g.advanceFieldSpitter(.02);keys.add(Math.floor(m.pose.frame/5))}assert.equal(keys.size,4);const travel=m.travel;g.advanceFieldSpitter(.02);assert.equal(m.travel,travel);assert.equal(Math.floor(m.pose.frame/5),0);m.releaseAt=0;e.x+=1000;g.advanceFieldSpitter(.02);assert.equal(m.travel,0);assert.equal(m.releaseAt,-Infinity);assert.equal(m.moving,false);assert.equal(m.previous,null);
});
test('Alpha 0.62 Spitter fixed feet, scale and label remain grounded above the native hitbox',()=>{
 const g=loadGame({traceCanvas:true});cleanRun(g);const e=spitter62(g,{x:60}),a=JSON.parse(sampleAssetText).spitter,info=g.fieldActorInfo(e,'spitter');near(info.scale,52/a.referenceHeights[info.motion.pose.frame%5]);assert.deepEqual(Array.from(info.pivot),a.pivots[info.motion.pose.frame]);g.clearTrace();g.renderEnemy(e);const trace=g.drawingTrace();assert.ok(trace.some(r=>r[0]==='drawImage'&&r[1]===g.fieldState().spitter.row.image));assert.ok(trace.some(r=>r[0]==='translate'&&r[1]===0&&r[2]===e.r*.6));const label=trace.find(r=>r[0]==='fillText'&&r[1]==='SPITTER');near(label[3],e.y+e.r*.6-52-22);assert.ok(trace.some(r=>r[0]==='strokeRect'&&r[1]===e.x-6&&r[2]===e.y-4));
});
test('Alpha 0.62 Reduced Effects, independent Spitters and offscreen culling bound visual work',()=>{
 const g=loadGame({traceCanvas:true});cleanRun(g);const a=spitter62(g),b=spitter({x:3000});g.state.enemies.push(b);g.fieldSpitterMotion(a);g.fieldSpitterMotion(b);a.x+=16;g.advanceFieldSpitter(.02);assert.equal(g.fieldActorInfo(a,'spitter').layers.length,2);assert.notEqual(g.fieldSpitterMotion(a).travel,g.fieldSpitterMotion(b).travel);g.state.preferences.reduced=true;assert.equal(g.fieldActorInfo(a,'spitter').layers.length,1);g.advanceFieldSpitter(.02);assert.equal(g.fieldSpitterMotion(a).previous,null);const world=fieldWorld56(g);g.clearTrace();g.renderEnemy(b);assert.equal(g.drawingTrace().filter(r=>r[0]==='drawImage').length,0);assert.deepEqual(fieldWorld56(g),world);
});
test('Alpha 0.62 native Spitter aim warnings and Bestiary portrait keep exact Classic commands',()=>{
 const g=loadGame({traceCanvas:true}),c=loadGame({traceCanvas:true,preferencesStored:JSON.stringify({version:1,actors:'classic'})});cleanRun(g);cleanRun(c);spitter62(g);const e=g.enemyPortraitEntity('spitter');e.phase='aim';e.aimX=1;e.aimY=0;e.phaseTime=.5;g.clearTrace();c.clearTrace();g.renderEnemy(e,g.el('game').getContext('2d'),true);c.renderEnemy(e,c.el('game').getContext('2d'),true);assert.equal(JSON.stringify(g.drawingTrace()),JSON.stringify(c.drawingTrace()));g.setup({enemies:[e]});c.setup({enemies:[e]});g.clearTrace();c.clearTrace();g.renderSpitterWarnings();c.renderSpitterWarnings();assert.equal(JSON.stringify(g.drawingTrace()),JSON.stringify(c.drawingTrace()));
});
test('Alpha 0.62 new art and packed survivor preserve seeded combat, damage, rewards and upgrade RNG',()=>{
 const worlds=[];for(const actors of ['field','classic']){const g=loadGame({seed:91,preferencesStored:JSON.stringify({version:1,actors})});cleanRun(g);spitter62(g,{hp:500,max:500});g.p.inv=999;for(let i=0;i<160;i++){g.update(.02);g.render()}g.setup({xp:g.state.nextXp});g.checkLevelUp();worlds.push({world:fieldWorld56(g),choices:g.choices().map(x=>x.innerHTML)})}assert.deepEqual(worlds[0],worlds[1]);
});
test('Alpha 0.62 direct Spitter drill is nearby, Field, safe and unscored across phone viewports',()=>{
 for(const [width,height] of [[412,915],[915,412],[320,568],[568,320]]){const g=loadGame({width,height,stored:'1800'}),e=enterSpitter62(g);assert.equal(e.hp,300);assert.equal(e.max,300);assert.equal(g.state.activeBoss,null);assert.equal(g.fieldSpitterActive(e),true);assert.equal(g.pendingImages.length,6);assert.equal(g.bossTestState().attacks,false);assert.equal(g.p.pierce,0);assert.ok(Math.abs(e.x-g.p.x)<width/2-25);assert.ok(Math.abs(e.y-g.p.y)<height/2-25);assert.match(g.el('objective').textContent,/SPITTER TEST/);assert.match(g.el('runGoal').textContent,/HP SAFE · ATTACKS OFF/);assert.equal(g.saved(),'1800')}
});
test('Alpha 0.62 safe Spitter drill runs real attacks with no hordes and enables genuine player damage',()=>{
 const g=loadGame(),e=enterSpitter62(g);let shot=false,aim=false;for(let i=0;i<400;i++){g.update(.02);shot||=g.state.hostileShots.length>0;aim||=e.phase==='aim'}assert.equal(shot,true);assert.equal(aim,true);near(g.p.hp,100);near(e.hp,300);assert.ok(g.practiceSnapshot().threats>0);assert.equal(g.state.bullets.length,0);assert.equal(g.state.enemies.length,1);assert.equal(g.state.exitBeacon,null);g.pause();g.el('bossTestAttacks').click();g.resume();for(let i=0;i<50;i++)g.update(.02);assert.ok(e.hp<300);assert.ok(g.practiceSnapshot().damage>0);
});
test('Alpha 0.62 Spitter controls reset while paused and preserve Riot and three-boss target navigation',()=>{
 const g=loadGame();enterSpitter62(g);g.pause();assert.match(g.el('modal').innerHTML,/SPITTER ART DRILL/);g.el('bossTestWeapon').value='arc';g.el('bossTestWeapon').dispatch('change');assert.equal(g.p.arc,3);g.el('bossTestEvolved').click();assert.equal(g.p.thunder,true);g.el('bossTestRestart').click();assert.equal(g.state.mode,'paused');assert.equal(g.state.elapsed,0);assert.equal(g.state.enemies[0].hp,300);g.el('bossTestNext').click();assert.equal(g.state.activeBoss.bossKind,'breaker');g.el('bossTestNext').click();assert.equal(g.state.activeBoss.bossKind,'warden');g.el('bossTestNext').click();assert.equal(g.state.activeBoss.bossKind,'harvester');g.el('bossTestNext').click();assert.equal(g.state.activeBoss.bossKind,'breaker');g.el('bossTestKind').value='riot';g.el('bossTestKind').dispatch('change');assert.equal(g.state.enemies[0].riot,true);g.el('bossTestNext').click();assert.equal(g.state.activeBoss.bossKind,'breaker');g.el('bossTestKind').value='spitter';g.el('bossTestKind').dispatch('change');assert.equal(g.state.enemies[0].spitter,true);assert.equal(g.state.mode,'paused');
});
test('Alpha 0.62 Spitter respawns nearby with cached art and only practice credit',()=>{
 const g=loadGame(),e=enterSpitter62(g),cache=g.fieldState().spitter,count=g.pendingImages.length;g.hitEnemy(e,1e9,'GUN');assert.equal(g.practiceSnapshot().targets,1);assert.equal(g.state.killCount,0);assert.equal(g.state.spittersDefeated,0);g.p.x=500;let next;for(let i=0;i<90&&!next;i++){g.update(.02);next=g.state.enemies.find(x=>x.spitter&&x.hp>0)}assert.ok(next&&next!==e);near(next.x,g.p.x);assert.ok(Math.abs(next.y-g.p.y)<150);assert.equal(next.hp,300);assert.equal(g.fieldState().spitter,cache);assert.equal(g.pendingImages.length,count);assert.equal(g.state.gems.length,0);
});
test('Alpha 0.62 Spitter held results and One More Run retain only the actual private test setup',()=>{
 const raw=JSON.stringify({version:1,actors:'classic'}),g=loadGame({stored:'900',preferencesStored:raw}),saved=g.journalSaved();enterSpitter62(g);g.pause();g.resetBossTesting('spitter','molotov',true);g.el('bossTestAttacks').click();g.el('bossTestArt').click();quitForTest(g);assert.match(g.el('modal').innerHTML,/SPITTER DRILL COMPLETE · UNSCORED/);assert.match(g.runReportText(),/SPITTER DRILL: spitter/);assert.equal(g.saved(),'900');assert.equal(g.preferencesSaved(),raw);assert.equal(g.journalSaved(),saved);g.advanceClock(500);g.el('again').click();assert.equal(g.state.trainingScenario,'spitter');assert.equal(g.p.wildfire,true);assert.equal(g.bossTestState().attacks,true);assert.equal(g.fieldStyle(),'classic');g.end('abandoned');g.advanceClock(500);g.el('resultMenu').click();g.start();assert.equal(g.state.training,false);assert.equal(g.bossTestState().active,false);assert.equal(g.state.spittersDefeated,0);assert.equal(g.fieldStyle(),'classic');
});
test('Alpha 0.62 frozen Spitter report reflects actual readiness and Back/background preserve Pause',()=>{
 for(const artworkStatus of ['ready','pending','error']){const g=loadGame({artworkStatus});enterSpitter62(g);g.pause();g.el('bossTestReport').click();const text=g.benchmarkText(),world=fieldWorld56(g);assert.match(text,/Developer Spitter drill: spitter/);assert.match(text,new RegExp(artworkStatus==='ready'?'Spitter art ready':artworkStatus==='pending'?'Loading field actors':'Field artwork unavailable'));g.resolveArtwork();assert.equal(g.benchmarkText(),text);g.phoneBack();assert.equal(g.state.mode,'paused');g.resume();g.document.hidden=true;g.event('visibilitychange');g.document.hidden=false;g.event('visibilitychange');g.update(10);assert.equal(g.state.mode,'paused');assert.deepEqual(fieldWorld56(g),world)}
});
test('Alpha 0.62 fresh tap, stale and hidden Spitter menu/control actions cannot change another context',()=>{
 const g=loadGame();g.el('previewsOpen').click();const entry=g.el('spitterReview');entry.click();assert.equal(g.state.mode,'previews');g.advanceClock(500);g.document.hidden=true;entry.click();assert.equal(g.state.mode,'previews');g.document.hidden=false;entry.click();assert.equal(g.state.trainingScenario,'spitter');g.pause();const old=g.el('bossTestRestart'),pick=g.el('bossTestKind');g.resetBossTesting('warden');const boss=g.state.activeBoss;old.click();pick.value='spitter';pick.dispatch('change');entry.click();assert.equal(g.state.activeBoss,boss);g.resetBossTesting('invalid');assert.equal(g.state.activeBoss,boss);
});
test('Alpha 0.62 combined sprite/download budgets, canvases, unknown storage and production hook isolation hold',()=>{
 const d=JSON.parse(sampleAssetText),common=['survivorWalk','survivorAim','shamblerWalk','runnerRun','bruteWalk'].reduce((n,k)=>n+d[k].width*d[k].height*4,0),boss=['breakerWalk','breakerCombat'].reduce((n,k)=>n+d[k].width*d[k].height*4,0),special=['riot','spitter'].reduce((n,k)=>n+d[k].width*d[k].height*4,0);assert.equal(common,29231176);assert.equal(common+boss+special,43978136);assert.ok(common+boss+special<44*1024*1024);assert.ok(common+boss+4*1024*1024<44*1024*1024);assert.ok(Buffer.byteLength(html)<12*1024*1024);assert.equal((html.match(/<canvas\b/g)||[]).length,6);assert.doesNotMatch(source,/globalThis\.api/);for(const storageBlocked of [false,true]){const raw=JSON.stringify({version:99,keep:'unknown'}),g=loadGame({storageBlocked,preferencesStored:raw});enterSpitter62(g);g.pause();g.el('bossTestArt').click();quitForTest(g);assert.equal(g.preferencesSaved(),raw);assert.equal(g.state.runResult.training,true)}
});

 test('Alpha 0.62 a real spit still shows release when its projectile resolves before the visual update',()=>{
 const g=loadGame();cleanRun(g);const e=spitter62(g,{phase:'aim',phaseTime:.01,aimX:-1,aimY:0});g.advanceFieldSpitter(.02);g.moveSpitter(e,.02);assert.equal(g.state.hostileShots.length,1);g.setup({hostileShots:[]});g.advanceFieldSpitter(.02);assert.equal(Math.floor(g.fieldSpitterMotion(e).pose.frame/5),5);assert.equal(g.state.hostileShots.length,0);assert.equal(g.fieldSpitterMotion(e).releaseAt,g.state.elapsed);
 });

// Alpha 0.63 — Howler Field artwork and immediate native rally review.
function howler63(g,extra={},targets=null){const e=howler({x:100,y:-50,...extra}),helpers=targets||[enemy({x:e.x+20,y:e.y+20,hp:1000,max:1000})];g.scheduleRush(Infinity);g.setup({enemies:[e,...helpers],nextBossAt:Infinity,exitAt:Infinity,obstacles:[],barrels:[],barrelClock:Infinity,nextSupplyAt:Infinity});g.p.fireClock=999;g.prepareFieldHowler();return e}
function enterHowler63(g){g.el('previewsOpen').click();g.advanceClock(500);g.el('howlerReview').click();assert.equal(g.state.mode,'play');assert.equal(g.state.trainingScenario,'howler');return g.state.enemies.find(e=>e.howler)}
test('Alpha 0.63 Howler original/runtime hashes, cell isolation and actual five-view convention are valid',()=>{
 const a=JSON.parse(sampleAssetText).howler,m=JSON.parse(readFileSync(join(__dirname,'../dist/assets/howler-field.json'))),r=JSON.parse(readFileSync(join(__dirname,'../dist/assets/runtime-formats.json'))).howler,hash=b=>require('node:crypto').createHash('sha256').update(b).digest('hex'),png=readFileSync(join(__dirname,'../dist/assets/howler-field.png')),runtime=readFileSync(join(__dirname,'../dist/assets/howler-field.webp'));assert.equal(hash(png),m.sha256);assert.equal(hash(runtime),a.sha256);assert.deepEqual(Buffer.from(a.src.split(',')[1],'base64'),runtime);assert.equal(png.readUInt32BE(16),1024);assert.equal(png.readUInt32BE(20),1536);assert.equal(r.rgba_exact,true);assert.equal(r.alpha_exact,true);assert.equal(r.visible_rgb_psnr_db,null);assert.match(r.alpha_comparison,/not full-resolution original/);assert.equal(a.frames.length,35);assert.equal(m.views[3],'northwest-rear');assert.deepEqual(m.directionFlips,[1,1,1,-1,-1,1,1,-1]);for(let i=0;i<35;i++){const [x,y,w,h]=a.frames[i],c=(m.packedRuntime?.cellBounds||m.cellBounds)[i];assert.ok(x>=c[0]&&y>=c[1]&&x+w<=c[0]+c[2]&&y+h<=c[1]+c[3]);assert.ok(w>30&&h>65);assert.equal(a.pivots[i][1],h)}
});
test('Alpha 0.63 legacy preview survivor optimization preserves original PNG, exact alpha and quality-100 metrics',()=>{
 const a=JSON.parse(sampleAssetText).survivor,m=JSON.parse(readFileSync(join(__dirname,'../dist/assets/manifest.json'))).assets.survivor,r=JSON.parse(readFileSync(join(__dirname,'../dist/assets/runtime-formats.json'))).survivor,hash=b=>require('node:crypto').createHash('sha256').update(b).digest('hex');assert.equal(hash(readFileSync(join(__dirname,'../dist/assets/survivor.png'))),m.sha256);assert.equal(hash(readFileSync(join(__dirname,'../dist/assets/survivor.webp'))),a.sha256);assert.equal(r.alpha_exact,true);assert.ok(r.visible_rgb_psnr_db>42);assert.match(r.encoding,/quality 100/);assert.equal(r.runtime_bytes,253318);assert.equal(a.width,2172);assert.equal(a.height,724);
});
test('Alpha 0.63 Howler combined-budget guard checks all common, boss and three specialist images',()=>{
 const data=JSON.parse(sampleAssetText),g=loadGame();assert.equal(g.fieldHowlerBudget(data),true);data.riot.width=99999;assert.equal(g.fieldHowlerBudget(data),false);const h=loadGame();cleanRun(h);const altered=JSON.parse(sampleAssetText);altered.bruteWalk.width=99999;h.el('sampleAssets').textContent=JSON.stringify(altered);const e=howler63(h);assert.equal(h.fieldState().howler.status,'failed');assert.equal(h.fieldHowlerActive(e),false);assert.equal(h.fieldActorsActive(),true);assert.equal(Object.keys(h.fieldState().rows).length,5);
});
test('Alpha 0.63 Howler lazily loads one shared image without replacing common helper artwork',()=>{
 const g=loadGame();cleanRun(g);assert.equal(g.pendingImages.length,5);assert.equal(g.fieldState().howler.status,'idle');const e=howler63(g);assert.equal(g.pendingImages.length,6);assert.equal(g.fieldHowlerActive(e),true);assert.equal(Object.keys(g.fieldState().rows).length,5);g.prepareFieldHowler();assert.equal(g.pendingImages.length,6);assert.ok(g.pendingImages.every(im=>im.onload===null&&im.onerror===null));
});
test('Alpha 0.63 Howler body can coexist with Riot, Spitter and the largest optional boss cache',()=>{
 const g=loadGame();cleanRun(g);howler63(g);g.state.enemies.push(riot(),spitter());g.prepareFieldRiot();g.prepareFieldSpitter();breaker57(g);assert.equal(g.pendingImages.length,10);for(const kind of ['howler','riot','spitter','breaker'])assert.equal(g.fieldState()[kind].status,'ready');assert.equal(g.fieldActorsActive(),true);
});
test('Alpha 0.63 Classic, ordinary Howler practice and original prototype do not decode Howler art',()=>{
 const g=loadGame({preferencesStored:JSON.stringify({version:1,actors:'classic'})});cleanRun(g);howler63(g);assert.equal(g.pendingImages.length,0);const t=loadGame();t.startTraining('pierce',false,'howler');assert.equal(t.pendingImages.length,0);assert.equal(t.state.enemies.length,4);assert.equal(t.fieldActorsActive(),false);const h=loadGame();enterTrial54(h,'crowd');assert.equal(h.pendingImages.length,12);assert.equal(h.fieldState().howler.status,'idle');
});
test('Alpha 0.63 pending Howler image completion changes no native world or common readiness',()=>{
 const g=loadGame({artworkStatus:'pending'});cleanRun(g);g.resolveArtwork();const e=howler63(g),world=fieldWorld56(g),im=g.pendingImages[5];assert.equal(g.fieldHowlerActive(e),false);assert.equal(g.fieldActorsActive(),true);im.naturalWidth=480;im.naturalHeight=720;im.onload();assert.equal(g.fieldHowlerActive(e),true);assert.deepEqual(fieldWorld56(g),world);assert.equal(im.onload,null);assert.equal(im.onerror,null);
});
test('Alpha 0.63 failed, missing, zero-size or oversized Howler images retain native fallback without retries',()=>{
 for(const failure of ['error','missing','budget','zero']){const g=loadGame({artworkStatus:'pending'});cleanRun(g);g.resolveArtwork();if(['missing','budget'].includes(failure)){const d=JSON.parse(sampleAssetText);if(failure==='missing')delete d.howler;else d.howler.width=999999;g.el('sampleAssets').textContent=JSON.stringify(d)}const e=howler63(g);if(failure==='error')g.pendingImages[5].onerror();if(failure==='zero'){const im=g.pendingImages[5];im.naturalWidth=0;im.naturalHeight=0;im.onload()}assert.equal(g.fieldState().howler.status,'failed');assert.equal(g.fieldHowlerActive(e),false);assert.equal(g.fieldActorsActive(),true);assert.match(g.fieldArtStatus(),/Howler art unavailable.*Classic/);const n=g.pendingImages.length;g.prepareFieldHowler();assert.equal(g.pendingImages.length,n);g.update(.02);assert.equal(g.state.mode,'play')}
});
test('Alpha 0.63 stale Howler callbacks cannot revive cancelled, replaced, finished or new-run groups',()=>{
 const g=loadGame({artworkStatus:'pending'});cleanRun(g);g.resolveArtwork();howler63(g);const im=g.pendingImages[5],onload=im.onload,onerror=im.onerror;g.setup({enemies:[]});g.prepareFieldHowler();assert.equal(im.onload,null);assert.equal(im.onerror,null);howler63(g);const replacement=g.fieldState().howler;onload();onerror();assert.equal(g.fieldState().howler,replacement);assert.equal(replacement.status,'loading');g.pause();g.selectFieldActors('classic');onload();assert.equal(g.fieldState().howler.status,'idle');g.end('abandoned');onerror();g.start();onload();assert.equal(g.fieldState().howler.status,'idle');
});
test('Alpha 0.63 last Howler removal releases its own sheet while other Field groups stay ready',()=>{
 const g=loadGame();cleanRun(g);const e=howler63(g);g.state.enemies.push(riot(),spitter());g.prepareFieldRiot();g.prepareFieldSpitter();breaker57(g);e.hp=0;g.prepareFieldHowler();assert.equal(g.fieldState().howler.status,'idle');for(const kind of ['riot','spitter','breaker'])assert.equal(g.fieldState()[kind].status,'ready');assert.equal(g.fieldActorsActive(),true);
});
test('Alpha 0.63 eight Howler headings use actual rear flips and hold during windup and successful pulse',()=>{
 const g=loadGame();cleanRun(g);const e=howler63(g);for(let direction=0;direction<8;direction++){const angle=direction*Math.PI/4,m={moving:true,dx:Math.cos(angle),dy:Math.sin(angle),travel:16.5,direction};e.phase='approach';e.pulseUntil=0;let k=g.fieldHowlerPose(e,m);assert.equal(k.direction,direction);assert.equal(k.flip,[1,1,1,-1,-1,1,1,-1][direction]);assert.equal(k.pose.frame%5,[0,1,2,1,0,3,4,3][direction]);e.phase='howl';g.p.x=999;g.p.y=-999;k=g.fieldHowlerPose(e,m);assert.equal(k.direction,direction);assert.equal(Math.floor(k.pose.frame/5),4);e.phase='approach';e.pulseUntil=.35;k=g.fieldHowlerPose(e,m);assert.equal(k.direction,direction);assert.equal(Math.floor(k.pose.frame/5),5)}
});
test('Alpha 0.63 full native howl windup grants real twenty-percent haste for three seconds and drives release',()=>{
 const g=loadGame();cleanRun(g);const e=howler63(g),target=g.state.enemies[1];g.updateHowls(.01);assert.equal(e.phase,'howl');near(e.phaseTime,1.2);g.advanceFieldHowler(.01);assert.equal(Math.floor(g.fieldHowlerMotion(e).pose.frame/5),4);g.setup({elapsed:1.19});g.updateHowls(1.19);assert.equal(e.phase,'howl');assert.equal(g.howlMultiplier(target),1);g.setup({elapsed:1.21});g.updateHowls(.02);assert.equal(e.phase,'approach');near(target.howlUntil,4.21);near(g.howlMultiplier(target),1.2);near(e.pulseUntil,1.56);g.advanceFieldHowler(.02);assert.equal(Math.floor(g.fieldHowlerMotion(e).pose.frame/5),5);const world=fieldWorld56(g);for(let i=0;i<20;i++)g.advanceFieldHowler(.02);assert.deepEqual(fieldWorld56(g),world);g.setup({elapsed:4.22});near(g.howlMultiplier(target),1);
});
test('Alpha 0.63 no eligible rally targets cannot produce a successful release or grant buffs',()=>{
 const g=loadGame();cleanRun(g);const e=howler63(g,{phase:'howl',phaseTime:.01},[spitter(),riot(),enemy({rush:true})]);g.advanceFieldHowler(.02);g.updateHowls(.02);g.advanceFieldHowler(.02);assert.equal(e.pulseUntil,0);assert.notEqual(Math.floor(g.fieldHowlerMotion(e).pose.frame/5),5);assert.ok(g.state.enemies.slice(1).every(x=>!x.howlUntil));
});
test('Alpha 0.63 offscreen, stunned, blocked and killed Howlers cancel native rally without a visual release',()=>{
 for(const reason of ['offscreen','stun','boss','kill']){const g=loadGame();cleanRun(g);const e=howler63(g,{phase:'howl',phaseTime:.01}),target=g.state.enemies[1];g.advanceFieldHowler(.02);if(reason==='offscreen')e.x=5000;if(reason==='stun')e.salvageStunUntil=10;if(reason==='boss')g.spawnBoss();if(reason==='kill')g.hitEnemy(e,1e6,'GUN');g.updateHowls(.02);g.advanceFieldHowler(.02);assert.equal(e.pulseUntil,0);assert.equal(g.howlMultiplier(target),1);if(reason==='kill')assert.equal(g.fieldHowlerActive(e),false);else assert.notEqual(Math.floor(g.fieldHowlerMotion(e).pose.frame/5),5)}
});
test('Alpha 0.63 native eight-target and one-hundred-seventy radius limits survive the art pass',()=>{
 const g=loadGame();cleanRun(g);const targets=Array.from({length:10},(_,i)=>enemy({x:(i+1)*10,y:0,hp:100,max:100})),outside=enemy({x:170.01,y:0}),e=howler63(g,{x:0,y:0,phase:'howl',phaseTime:.01},[...targets,outside]);g.advanceFieldHowler(.02);g.updateHowls(.02);g.advanceFieldHowler(.02);assert.equal(targets.filter(x=>g.howlMultiplier(x)>1).length,8);assert.equal(g.howlMultiplier(outside),1);assert.ok(g.state.enemies.filter(x=>x.howlUntil>0).length<=8);assert.equal(Math.floor(g.fieldHowlerMotion(e).pose.frame/5),5);
});
test('Alpha 0.63 Howler actual-distance gait stops and a teleport clears old gait/blend state',()=>{
 const g=loadGame();cleanRun(g);const e=howler63(g),m=g.fieldHowlerMotion(e),keys=new Set();for(let i=0;i<4;i++){e.x+=16.5;g.advanceFieldHowler(.02);keys.add(Math.floor(m.pose.frame/5))}assert.equal(keys.size,4);const travel=m.travel;g.advanceFieldHowler(.02);assert.equal(m.travel,travel);assert.equal(Math.floor(m.pose.frame/5),0);e.x+=16.5;g.advanceFieldHowler(.02);e.x+=1000;g.advanceFieldHowler(.02);assert.equal(m.travel,0);assert.equal(m.moving,false);assert.equal(m.previous,null);
});
test('Alpha 0.63 fixed Howler feet/scale and Field label keep native gold marker geometry',()=>{
 const g=loadGame({traceCanvas:true});cleanRun(g);const e=howler63(g),a=JSON.parse(sampleAssetText).howler,info=g.fieldActorInfo(e,'howler');near(info.scale,56/a.referenceHeights[info.motion.pose.frame%5]);assert.deepEqual(Array.from(info.pivot),a.pivots[info.motion.pose.frame]);g.clearTrace();g.renderEnemy(e);const trace=g.drawingTrace();assert.ok(trace.some(r=>r[0]==='drawImage'&&r[1]===g.fieldState().howler.row.image));const label=trace.find(r=>r[0]==='fillText'&&r[1]==='HOWLER');near(label[3],e.y+e.r*.6-56-22);assert.ok(trace.some(r=>r[0]==='arc'&&r[3]===e.r+5));assert.ok(trace.some(r=>r[0]==='arc'&&r[3]===e.r+10));
});
test('Alpha 0.63 Reduced Effects and offscreen culling bound Howler drawing without native mutations',()=>{
 const g=loadGame({traceCanvas:true});cleanRun(g);const e=howler63(g);g.fieldHowlerMotion(e);e.x+=17;g.advanceFieldHowler(.02);assert.equal(g.fieldActorInfo(e,'howler').layers.length,2);g.state.preferences.reduced=true;assert.equal(g.fieldActorInfo(e,'howler').layers.length,1);g.advanceFieldHowler(.02);assert.equal(g.fieldHowlerMotion(e).previous,null);e.x=3000;const world=fieldWorld56(g);g.clearTrace();g.renderEnemy(e);assert.equal(g.drawingTrace().filter(r=>r[0]==='drawImage').length,0);assert.deepEqual(fieldWorld56(g),world);
});
test('Alpha 0.63 native rally warning circles and Bestiary portrait match Classic draw commands',()=>{
 const g=loadGame({traceCanvas:true}),c=loadGame({traceCanvas:true,preferencesStored:JSON.stringify({version:1,actors:'classic'})});cleanRun(g);cleanRun(c);howler63(g);const e=g.enemyPortraitEntity('howler');e.phase='howl';e.phaseTime=.6;g.clearTrace();c.clearTrace();g.renderEnemy(e,g.el('game').getContext('2d'),true);c.renderEnemy(e,c.el('game').getContext('2d'),true);assert.equal(JSON.stringify(g.drawingTrace()),JSON.stringify(c.drawingTrace()));g.setup({enemies:[e]});c.setup({enemies:[e]});g.clearTrace();c.clearTrace();g.renderHowlerWarnings();c.renderHowlerWarnings();assert.equal(JSON.stringify(g.drawingTrace()),JSON.stringify(c.drawingTrace()));
});
test('Alpha 0.63 Field and Classic produce equal seeded rally/combat/rewards and upgrade choices',()=>{
 const worlds=[];for(const actors of ['field','classic']){const g=loadGame({seed:19,preferencesStored:JSON.stringify({version:1,actors})});cleanRun(g);howler63(g,{hp:1000,max:1000});g.p.inv=999;for(let i=0;i<220;i++){g.update(.02);g.render()}g.setup({xp:g.state.nextXp});g.checkLevelUp();worlds.push({world:fieldWorld56(g),choices:g.choices().map(x=>x.innerHTML)})}assert.deepEqual(worlds[0],worlds[1]);
});
test('Alpha 0.63 direct Howler drill has safe Field target and three live helpers in all phone views',()=>{
 for(const [width,height] of [[412,915],[915,412],[320,568],[568,320]]){const g=loadGame({width,height,stored:'1800'}),e=enterHowler63(g);assert.equal(e.hp,300);assert.equal(e.max,300);assert.equal(g.state.activeBoss,null);assert.equal(g.fieldHowlerActive(e),true);assert.equal(g.state.enemies.length,4);assert.equal(g.state.enemies.filter(x=>x.trainingHelper!==undefined).length,3);assert.equal(g.pendingImages.length,6);assert.equal(g.bossTestState().attacks,false);assert.equal(g.p.pierce,0);assert.ok(Math.abs(e.y-g.p.y)<height/2-25);assert.match(g.el('objective').textContent,/HOWLER TEST/);assert.match(g.el('runGoal').textContent,/HP SAFE · ATTACKS OFF.*targets defeated/);assert.equal(g.saved(),'1800')}
});
test('Alpha 0.63 safe Howler demonstration uses real helper haste and contact attempts without hordes or rewards',()=>{
 const g=loadGame(),e=enterHowler63(g);let windup=false,rallied=false,pose=false;for(let i=0;i<400;i++){g.update(.02);windup||=e.phase==='howl';rallied||=g.state.enemies.some(x=>x.trainingHelper!==undefined&&g.howlMultiplier(x)>1);pose||=Math.floor(g.fieldHowlerMotion(e).pose.frame/5)===5}assert.equal(windup,true);assert.equal(rallied,true);assert.equal(pose,true);near(g.p.hp,100);near(e.hp,300);assert.ok(g.practiceSnapshot().threats>0);assert.equal(g.state.bullets.length,0);assert.equal(g.state.enemies.length,4);assert.equal(g.state.exitBeacon,null);assert.equal(g.state.level,1);assert.equal(g.state.xp,0);
});
test('Alpha 0.63 paused Howler controls reset real loadouts and preserve all existing target cycles',()=>{
 const g=loadGame();enterHowler63(g);g.pause();assert.match(g.el('modal').innerHTML,/HOWLER ART DRILL/);assert.match(g.el('modal').innerHTML,/Three infected helpers/);g.el('bossTestWeapon').value='arc';g.el('bossTestWeapon').dispatch('change');assert.equal(g.p.arc,3);g.el('bossTestEvolved').click();assert.equal(g.p.thunder,true);g.el('bossTestRestart').click();assert.equal(g.state.mode,'paused');assert.equal(g.state.elapsed,0);assert.equal(g.state.enemies.length,4);g.el('bossTestNext').click();for(const kind of ['breaker','warden','harvester','breaker']){assert.equal(g.state.activeBoss.bossKind,kind);g.el('bossTestNext').click()}for(const kind of ['riot','spitter','howler']){g.el('bossTestKind').value=kind;g.el('bossTestKind').dispatch('change');assert.equal(g.state.trainingScenario,kind);assert.equal(g.state.mode,'paused')}g.el('bossTestAttacks').click();g.resume();for(let i=0;i<120;i++)g.update(.02);assert.ok(g.practiceSnapshot().damage>0);
});
test('Alpha 0.63 training Howler respawn rebuilds three nearby helpers and keeps only practice credit/cache',()=>{
 const g=loadGame(),e=enterHowler63(g),cache=g.fieldState().howler,count=g.pendingImages.length;g.hitEnemy(e,1e9,'GUN');assert.equal(g.practiceSnapshot().targets,1);assert.equal(g.state.killCount,0);assert.equal(g.state.enemyTally.howler,0);g.p.x=500;let next;for(let i=0;i<90&&!next;i++){g.update(.02);next=g.state.enemies.find(x=>x.howler&&x.hp>0)}assert.ok(next&&next!==e);near(next.x,g.p.x);assert.equal(next.hp,300);assert.equal(g.state.enemies.filter(x=>x.trainingHelper!==undefined).length,3);assert.ok(g.state.enemies.every(x=>Math.hypot(x.x-next.x,x.y-next.y)<80));assert.equal(g.fieldState().howler,cache);assert.equal(g.pendingImages.length,count);assert.equal(g.state.gems.length,0);
});
test('Alpha 0.63 held Howler results/One More Run retain private setup and restore normal record safety',()=>{
 const raw=JSON.stringify({version:1,actors:'classic'}),g=loadGame({stored:'900',preferencesStored:raw}),saved=g.journalSaved();enterHowler63(g);g.pause();g.resetBossTesting('howler','blades',true);g.el('bossTestAttacks').click();g.el('bossTestArt').click();quitForTest(g);assert.match(g.el('modal').innerHTML,/HOWLER DRILL COMPLETE · UNSCORED/);assert.match(g.runReportText(),/HOWLER DRILL: howler/);assert.equal(g.saved(),'900');assert.equal(g.preferencesSaved(),raw);assert.equal(g.journalSaved(),saved);g.advanceClock(500);g.el('again').click();assert.equal(g.state.trainingScenario,'howler');assert.equal(g.state.enemies.length,4);assert.equal(g.p.reaper,true);assert.equal(g.bossTestState().attacks,true);assert.equal(g.fieldStyle(),'classic');g.end('abandoned');g.advanceClock(500);g.el('resultMenu').click();g.start();assert.equal(g.state.training,false);assert.equal(g.bossTestState().active,false);assert.equal(g.state.enemyTally.howler,0);assert.equal(g.state.nextHowlerAt,210);assert.equal(g.fieldStyle(),'classic');
});
test('Alpha 0.63 frozen Howler report, paused style comparison, Back and background preserve the encounter',()=>{
 for(const artworkStatus of ['ready','pending','error']){const g=loadGame({artworkStatus});enterHowler63(g);g.el('stick').dispatch('pointerdown',{pointerId:1,clientX:135.5,clientY:662.5});g.el('pause').dispatch('pointerdown',{pointerId:2});assert.equal(g.state.mode,'paused');const world=fieldWorld56(g);if(artworkStatus==='ready'){g.el('bossTestArt').click();g.el('bossTestArt').click();assert.deepEqual(fieldWorld56(g),world)}g.el('bossTestReport').click();const text=g.benchmarkText();assert.match(text,/Developer Howler drill: howler/);assert.match(text,new RegExp(artworkStatus==='ready'?'Howler art ready':artworkStatus==='pending'?'Loading field actors':'Field artwork unavailable'));g.resolveArtwork();assert.equal(g.benchmarkText(),text);g.phoneBack();assert.equal(g.state.mode,'paused');g.resume();g.document.hidden=true;g.event('visibilitychange');g.document.hidden=false;g.event('visibilitychange');g.update(10);assert.equal(g.state.mode,'paused');assert.deepEqual(fieldWorld56(g),world)}
});
test('Alpha 0.63 fresh/stale/hidden actions, future storage, download/canvas and raw budgets stay isolated',()=>{
 const g=loadGame();g.el('previewsOpen').click();const entry=g.el('howlerReview');entry.click();assert.equal(g.state.mode,'previews');g.advanceClock(500);g.document.hidden=true;entry.click();assert.equal(g.state.mode,'previews');g.document.hidden=false;entry.click();g.pause();const old=g.el('bossTestRestart');g.resetBossTesting('warden');const boss=g.state.activeBoss;old.click();entry.click();assert.equal(g.state.activeBoss,boss);const data=JSON.parse(sampleAssetText),common=['survivorWalk','survivorAim','shamblerWalk','runnerRun','bruteWalk'].reduce((n,id)=>n+data[id].width*data[id].height*4,0),bossBytes=['breakerWalk','breakerCombat'].reduce((n,id)=>n+data[id].width*data[id].height*4,0),special=['riot','spitter','howler'].reduce((n,id)=>n+data[id].width*data[id].height*4,0);assert.equal(common+bossBytes+special,44884888);assert.ok(common+bossBytes+special<44*1024*1024);assert.ok(Buffer.byteLength(html)<12*1024*1024);assert.equal((html.match(/<canvas\b/g)||[]).length,6);assert.doesNotMatch(source,/globalThis\.api/);for(const storageBlocked of [false,true]){const raw=JSON.stringify({version:99,keep:'unknown'}),h=loadGame({storageBlocked,preferencesStored:raw});enterHowler63(h);h.end('abandoned');assert.equal(h.preferencesSaved(),raw);assert.equal(h.state.runResult.training,true)}
});

// Alpha 0.64 — Lobber Field art and lossless packing of existing specialists.
function lobber64(g,extra={}){const e={...enemy({x:150,y:0,r:20,hp:500,max:500,type:8,col:'#8da5d4',speed:55,dmg:10}),lobber:true,phase:'approach',phaseTime:0,cooldown:0,...extra};g.scheduleRush(Infinity);g.setup({enemies:[e],overtime:1,nextBossAt:Infinity,exitAt:Infinity,obstacles:[],barrels:[],barrelClock:Infinity,nextSupplyAt:Infinity});g.p.fireClock=999;g.prepareFieldLobber();return e}
function enterLobber64(g){g.el('previewsOpen').click();g.advanceClock(500);g.el('lobberReview').click();assert.equal(g.state.mode,'play');assert.equal(g.state.trainingScenario,'lobber');return g.state.enemies.find(e=>e.lobber)}
test('Alpha 0.64 all 105 prior specialist frame crops retain RGBA hashes, dimensions, pivots and scale',()=>{
 const data=JSON.parse(sampleAssetText),formats=JSON.parse(readFileSync(join(__dirname,'../dist/assets/runtime-formats.json')));for(const key of ['riot','spitter','howler']){const a=data[key],m=JSON.parse(readFileSync(join(__dirname,'../dist/assets/'+key+'-field.json'))),r=formats[key],hash=b=>require('node:crypto').createHash('sha256').update(b).digest('hex');assert.equal(hash(readFileSync(join(__dirname,'../dist/assets/'+key+'-field.png'))),m.sha256);assert.equal(hash(readFileSync(join(__dirname,'../dist/assets/'+key+'-field.webp'))),a.sha256);assert.equal(r.frame_rgba_exact,true);assert.equal(r.frame_rgba_sha256.length,35);assert.deepEqual(a.frames,m.packedRuntime.frames);assert.deepEqual(a.pivots,m.pivots);assert.deepEqual(a.referenceHeights,m.referenceHeights);assert.equal(a.width,m.packedRuntime.width);assert.equal(a.height,m.packedRuntime.height);for(let i=0;i<35;i++){assert.deepEqual(a.frames[i].slice(2),m.frames[i].slice(2));assert.match(r.frame_rgba_sha256[i],/^[a-f0-9]{64}$/)}assert.ok(a.width*a.height<480*720)}
});
test('Alpha 0.64 Lobber retains original PNG and 35 lossless compact crops with honest reference metadata',()=>{
 const a=JSON.parse(sampleAssetText).lobber,m=JSON.parse(readFileSync(join(__dirname,'../dist/assets/lobber-field.json'))),r=JSON.parse(readFileSync(join(__dirname,'../dist/assets/runtime-formats.json'))).lobber,hash=b=>require('node:crypto').createHash('sha256').update(b).digest('hex'),png=readFileSync(join(__dirname,'../dist/assets/lobber-field.png')),runtime=readFileSync(join(__dirname,'../dist/assets/lobber-field.webp'));assert.equal(hash(png),m.sha256);assert.equal(hash(runtime),a.sha256);assert.deepEqual(Buffer.from(a.src.split(',')[1],'base64'),runtime);assert.equal(png.readUInt32BE(16),1024);assert.equal(png.readUInt32BE(20),1536);assert.equal(r.rgba_exact,true);assert.equal(r.alpha_exact,true);assert.equal(r.visible_rgb_psnr_db,null);assert.match(r.encoding,/lossless/);assert.match(r.alpha_comparison,/not full-resolution original/);assert.equal(a.width,480);assert.equal(a.height,472);assert.equal(a.frames.length,35);assert.equal(m.views[3],'northwest-rear');for(let i=0;i<35;i++){const [x,y,w,h]=a.frames[i],c=m.packedRuntime.cellBounds[i];assert.ok(x>=c[0]&&y>=c[1]&&x+w<=c[0]+c[2]&&y+h<=c[1]+c[3]);assert.deepEqual([w,h],m.referenceAtlas.frames[i].slice(2));assert.equal(a.pivots[i][1],h)}
});
test('Alpha 0.64 optional street encoding retains original, exact alpha and the existing quality threshold',()=>{
 const a=JSON.parse(sampleAssetText).street,m=JSON.parse(readFileSync(join(__dirname,'../dist/assets/manifest.json'))).assets.street,r=JSON.parse(readFileSync(join(__dirname,'../dist/assets/runtime-formats.json'))).street,hash=b=>require('node:crypto').createHash('sha256').update(b).digest('hex');assert.equal(hash(readFileSync(join(__dirname,'../dist/assets/street.png'))),m.sha256);assert.equal(hash(readFileSync(join(__dirname,'../dist/assets/street.webp'))),a.sha256);assert.equal(r.alpha_exact,true);assert.ok(r.visible_rgb_psnr_db>38);assert.match(r.encoding,/quality 96/);assert.equal(r.runtime_bytes,796100);
});
test('Alpha 0.64 combined raw-budget check includes all four specialists and fails safely if metadata exceeds cap',()=>{
 const d=JSON.parse(sampleAssetText),g=loadGame();assert.equal(g.fieldHowlerBudget(d),true);d.lobber.width=99999;assert.equal(g.fieldHowlerBudget(d),false);const h=loadGame();cleanRun(h);const changed=JSON.parse(sampleAssetText);changed.riot.width=99999;h.el('sampleAssets').textContent=JSON.stringify(changed);const e=lobber64(h);assert.equal(h.fieldState().lobber.status,'failed');assert.equal(h.fieldLobberActive(e),false);assert.equal(h.fieldActorsActive(),true);
});
test('Alpha 0.64 lazy Lobber shares one image and coexists with every accepted specialist and largest boss',()=>{
 const g=loadGame();cleanRun(g);assert.equal(g.pendingImages.length,5);const e=lobber64(g);assert.equal(g.pendingImages.length,6);assert.equal(g.fieldLobberActive(e),true);g.prepareFieldLobber();assert.equal(g.pendingImages.length,6);g.state.enemies.push(riot(),spitter(),howler());g.prepareFieldRiot();g.prepareFieldSpitter();g.prepareFieldHowler();breaker57(g);assert.equal(g.pendingImages.length,11);for(const key of ['lobber','riot','spitter','howler','breaker'])assert.equal(g.fieldState()[key].status,'ready');assert.ok(g.pendingImages.every(im=>im.onload===null&&im.onerror===null));
});
test('Alpha 0.64 Classic, ordinary Lobber practice and original prototype skip Lobber artwork decoding',()=>{
 const g=loadGame({preferencesStored:JSON.stringify({version:1,actors:'classic'})});cleanRun(g);lobber64(g);assert.equal(g.pendingImages.length,0);const t=loadGame();t.startTraining('pierce',false,'lobber');assert.equal(t.pendingImages.length,0);assert.equal(t.fieldActorsActive(),false);const h=loadGame();enterTrial54(h,'crowd');assert.equal(h.pendingImages.length,12);assert.equal(h.fieldState().lobber.status,'idle');
});
test('Alpha 0.64 pending Lobber decode changes no native state and does not block common art',()=>{
 const g=loadGame({artworkStatus:'pending'});cleanRun(g);g.resolveArtwork();const e=lobber64(g),world=fieldWorld56(g),im=g.pendingImages[5];assert.equal(g.fieldLobberActive(e),false);assert.equal(g.fieldActorsActive(),true);im.naturalWidth=480;im.naturalHeight=472;im.onload();assert.equal(g.fieldLobberActive(e),true);assert.deepEqual(fieldWorld56(g),world);assert.equal(im.onload,null);assert.equal(im.onerror,null);
});
test('Alpha 0.64 absent, failed, zero or oversized Lobber art retains native fallback without repeated loads',()=>{
 for(const failure of ['error','missing','budget','zero']){const g=loadGame({artworkStatus:'pending'});cleanRun(g);g.resolveArtwork();if(['missing','budget'].includes(failure)){const d=JSON.parse(sampleAssetText);if(failure==='missing')delete d.lobber;else d.lobber.width=999999;g.el('sampleAssets').textContent=JSON.stringify(d)}const e=lobber64(g);if(failure==='error')g.pendingImages[5].onerror();if(failure==='zero'){const im=g.pendingImages[5];im.naturalWidth=0;im.naturalHeight=0;im.onload()}assert.equal(g.fieldState().lobber.status,'failed');assert.equal(g.fieldLobberActive(e),false);assert.equal(g.fieldActorsActive(),true);assert.match(g.fieldArtStatus(),/Lobber art unavailable.*Classic/);const n=g.pendingImages.length;g.prepareFieldLobber();assert.equal(g.pendingImages.length,n);g.update(.02);assert.equal(g.state.mode,'play')}
});
test('Alpha 0.64 stale Lobber callbacks cannot revive replaced, styled, finished or new-run caches',()=>{
 const g=loadGame({artworkStatus:'pending'});cleanRun(g);g.resolveArtwork();lobber64(g);const im=g.pendingImages[5],onload=im.onload,onerror=im.onerror;g.setup({enemies:[]});g.prepareFieldLobber();assert.equal(im.onload,null);assert.equal(im.onerror,null);lobber64(g);const replacement=g.fieldState().lobber;onload();onerror();assert.equal(g.fieldState().lobber,replacement);assert.equal(replacement.status,'loading');g.pause();g.selectFieldActors('classic');onload();assert.equal(g.fieldState().lobber.status,'idle');g.end('abandoned');onerror();g.start();onload();assert.equal(g.fieldState().lobber.status,'idle');
});
test('Alpha 0.64 removing a defeated Lobber releases its body sheet but preserves an already placed native warning',()=>{
 const g=loadGame();cleanRun(g);const e=lobber64(g,{phase:'windup',phaseTime:.01});g.updateLobbers(.02);const bomb=g.state.lobberBombs[0];assert.ok(bomb);g.hitEnemy(e,1e6,'GUN');g.setup({elapsed:g.state.elapsed+.6});g.advanceFieldActors(.02);g.prepareFieldLobber();assert.equal(g.fieldState().lobber.status,'idle');assert.equal(g.state.lobberBombs[0],bomb);g.updateLobbers(1.41);assert.equal(g.state.lobberBombs.length,0);near(g.p.hp,86);assert.equal(g.state.enemyTally.lobber,1);
});
test('Alpha 0.64 eight Lobber headings use correct rear flips and windup follows the native current player bearing',()=>{
 const g=loadGame();cleanRun(g);const e=lobber64(g);for(let direction=0;direction<8;direction++){const angle=direction*Math.PI/4,m={moving:true,dx:Math.cos(angle),dy:Math.sin(angle),travel:17,releaseAt:-Infinity};e.phase='approach';let k=g.fieldLobberPose(e,m);assert.equal(k.direction,direction);assert.equal(k.flip,[1,1,1,-1,-1,1,1,-1][direction]);assert.equal(k.pose.frame%5,[0,1,2,1,0,3,4,3][direction]);e.phase='windup';g.p.x=e.x+Math.cos(angle)*100;g.p.y=e.y+Math.sin(angle)*100;k=g.fieldLobberPose(e,m);assert.equal(k.direction,direction);assert.equal(Math.floor(k.pose.frame/5),4)}
});
test('Alpha 0.64 native one-second throw samples target at release and artwork holds that real direction',()=>{
 const g=loadGame();cleanRun(g);const e=lobber64(g);g.updateLobbers(.01);assert.equal(e.phase,'windup');near(e.phaseTime,1);g.advanceFieldLobber(.01);g.updateLobbers(.99);assert.equal(g.state.lobberBombs.length,0);g.p.x=30;g.p.y=50;g.updateLobbers(.02);const b=g.state.lobberBombs[0];assert.equal(b.x,30);assert.equal(b.y,50);near(b.remaining,1.4);g.advanceFieldLobber(.02);const m=g.fieldLobberMotion(e);assert.equal(Math.floor(m.pose.frame/5),5);near(m.releaseAngle,Math.atan2(50-e.y,30-e.x));const direction=m.direction;g.p.x=400;g.p.y=400;g.setup({elapsed:.2});g.advanceFieldLobber(.02);assert.equal(m.direction,direction);assert.equal(Math.floor(m.pose.frame/5),6);assert.equal(b.x,30);assert.equal(b.y,50);g.setup({elapsed:.51});g.advanceFieldLobber(.02);assert.ok(m.pose.frame<20);
});
test('Alpha 0.64 full native ground-warning window resolves once for fourteen damage with original radius',()=>{
 const g=loadGame();cleanRun(g);lobber64(g,{phase:'windup',phaseTime:.01});g.updateLobbers(.02);const b=g.state.lobberBombs[0];near(b.r,52);g.updateLobbers(1.39);near(g.p.hp,100);assert.equal(g.state.lobberBombs.length,1);g.updateLobbers(.02);near(g.p.hp,86);assert.equal(g.state.lobberBombs.length,0);assert.equal(g.state.blastRings.length,1);near(g.state.blastRings[0].radius,52);g.updateLobbers(.5);near(g.p.hp,86);assert.equal(g.state.blastRings.length,1);
});
test('Alpha 0.64 offscreen, stunned, boss-blocked and full-slot windups cannot fake a new throw',()=>{
 for(const reason of ['offscreen','stun','boss','full']){const g=loadGame();cleanRun(g);const e=lobber64(g,{phase:'windup',phaseTime:.01});g.advanceFieldLobber(.02);if(reason==='offscreen')e.x=5000;if(reason==='stun')e.salvageStunUntil=10;if(reason==='boss')g.spawnBoss();if(reason==='full')g.setup({lobberBombs:[{x:200,y:200,r:52,remaining:1}]});g.updateLobbers(.02);g.advanceFieldLobber(.02);assert.equal(g.fieldLobberMotion(e).releaseAt,-Infinity);assert.notEqual(Math.floor(g.fieldLobberMotion(e).pose.frame/5),5);assert.equal(g.state.lobberBombs.length,reason==='full'?1:0)}
});
test('Alpha 0.64 actual-distance Lobber gait stops and teleport clears old pose/release blending',()=>{
 const g=loadGame();cleanRun(g);const e=lobber64(g),m=g.fieldLobberMotion(e),keys=new Set();for(let i=0;i<4;i++){e.x+=17;g.advanceFieldLobber(.02);keys.add(Math.floor(m.pose.frame/5))}assert.equal(keys.size,4);const travel=m.travel;g.advanceFieldLobber(.02);assert.equal(m.travel,travel);assert.equal(Math.floor(m.pose.frame/5),0);m.releaseAt=0;e.x+=1000;g.advanceFieldLobber(.02);assert.equal(m.travel,0);assert.equal(m.releaseAt,-Infinity);assert.equal(m.previous,null);
});
test('Alpha 0.64 compact Lobber crop preserves fixed foot scale, label clearance and native chevron',()=>{
 const g=loadGame({traceCanvas:true});cleanRun(g);const e=lobber64(g),a=JSON.parse(sampleAssetText).lobber,info=g.fieldActorInfo(e,'lobber');near(info.scale,58/a.referenceHeights[info.motion.pose.frame%5]);assert.deepEqual(Array.from(info.pivot),a.pivots[info.motion.pose.frame]);g.clearTrace();g.renderEnemy(e);const trace=g.drawingTrace();assert.ok(trace.some(r=>r[0]==='drawImage'&&r[1]===g.fieldState().lobber.row.image));const label=trace.find(r=>r[0]==='fillText'&&r[1]==='LOBBER');near(label[3],e.y+e.r*.6-58-24);assert.ok(trace.some(r=>r[0]==='lineTo'&&r[1]===e.x&&r[2]===e.y-16));assert.ok(trace.some(r=>r[0]==='translate'&&r[1]===-e.r-14&&r[2]===e.r*.6-58+2));
});
test('Alpha 0.64 Reduced Effects and offscreen culling bound Lobber draw work without changing attacks',()=>{
 const g=loadGame({traceCanvas:true});cleanRun(g);const e=lobber64(g);g.fieldLobberMotion(e);e.x+=17;g.advanceFieldLobber(.02);assert.equal(g.fieldActorInfo(e,'lobber').layers.length,2);g.state.preferences.reduced=true;assert.equal(g.fieldActorInfo(e,'lobber').layers.length,1);g.advanceFieldLobber(.02);assert.equal(g.fieldLobberMotion(e).previous,null);e.x=3000;const world=fieldWorld56(g);g.clearTrace();g.renderEnemy(e);assert.equal(g.drawingTrace().filter(r=>r[0]==='drawImage').length,0);assert.deepEqual(fieldWorld56(g),world);assert.equal(g.state.lobberBombs.length,0);
});
test('Alpha 0.64 native orange warning and Bestiary portrait retain exact Classic draw commands',()=>{
 const g=loadGame({traceCanvas:true}),c=loadGame({traceCanvas:true,preferencesStored:JSON.stringify({version:1,actors:'classic'})});cleanRun(g);cleanRun(c);lobber64(g);const e=g.enemyPortraitEntity('lobber');e.phase='windup';g.clearTrace();c.clearTrace();g.renderEnemy(e,g.el('game').getContext('2d'),true);c.renderEnemy(e,c.el('game').getContext('2d'),true);assert.equal(JSON.stringify(g.drawingTrace()),JSON.stringify(c.drawingTrace()));const bombs=[{x:30,y:40,r:52,remaining:.7}];g.setup({lobberBombs:bombs});c.setup({lobberBombs:bombs});g.clearTrace();c.clearTrace();g.renderLobberBombs();c.renderLobberBombs();assert.equal(JSON.stringify(g.drawingTrace()),JSON.stringify(c.drawingTrace()));
});
test('Alpha 0.64 Field versus Classic preserves seeded throws, damage/rewards and upgrade choices',()=>{
 const worlds=[];for(const actors of ['field','classic']){const g=loadGame({seed:31,preferencesStored:JSON.stringify({version:1,actors})});cleanRun(g);lobber64(g);g.p.inv=999;for(let i=0;i<220;i++){g.update(.02);g.render()}g.setup({xp:g.state.nextXp});g.checkLevelUp();worlds.push({world:fieldWorld56(g),bombs:JSON.parse(JSON.stringify(g.state.lobberBombs)),choices:g.choices().map(x=>x.innerHTML)})}assert.deepEqual(worlds[0],worlds[1]);
});
test('Alpha 0.64 direct Lobber drill is nearby, Field, safe and attack-off across phone views',()=>{
 for(const [width,height] of [[412,915],[915,412],[320,568],[568,320]]){const g=loadGame({width,height,stored:'1800'}),e=enterLobber64(g);assert.equal(e.hp,300);assert.equal(e.max,300);assert.equal(g.state.enemies.length,1);assert.equal(g.state.activeBoss,null);assert.equal(g.fieldLobberActive(e),true);assert.equal(g.pendingImages.length,6);assert.equal(g.bossTestState().attacks,false);assert.equal(g.p.pierce,0);assert.ok(Math.abs(e.y-g.p.y)<height/2-25);assert.match(g.el('objective').textContent,/LOBBER TEST/);assert.match(g.el('runGoal').textContent,/HP SAFE · ATTACKS OFF.*lobbers defeated/);assert.equal(g.saved(),'1800')}
});
test('Alpha 0.64 safe drill runs real single-warning throws and blast attempts without hordes or player weapons',()=>{
 const g=loadGame(),e=enterLobber64(g);let windup=false,warning=false,release=false,blast=false;for(let i=0;i<400;i++){g.update(.02);windup||=e.phase==='windup';warning||=g.state.lobberBombs.length>0;release||=Math.floor(g.fieldLobberMotion(e).pose.frame/5)===5;blast||=g.state.blastRings.length>0;assert.ok(g.state.lobberBombs.length<=1)}assert.ok(windup&&warning&&release&&blast);near(g.p.hp,100);near(e.hp,300);assert.ok(g.practiceSnapshot().threats>0);assert.equal(g.state.bullets.length,0);assert.equal(g.state.enemies.length,1);assert.equal(g.state.exitBeacon,null);assert.equal(g.state.xp,0);
});
test('Alpha 0.64 paused Lobber controls switch true loadouts and preserve every previous target and Next cycle',()=>{
 const g=loadGame();enterLobber64(g);g.pause();assert.match(g.el('modal').innerHTML,/LOBBER ART DRILL/);g.el('bossTestWeapon').value='arc';g.el('bossTestWeapon').dispatch('change');assert.equal(g.p.arc,3);g.el('bossTestEvolved').click();assert.equal(g.p.thunder,true);g.el('bossTestRestart').click();assert.equal(g.state.mode,'paused');assert.equal(g.state.elapsed,0);g.el('bossTestNext').click();for(const kind of ['breaker','warden','harvester','breaker']){assert.equal(g.state.activeBoss.bossKind,kind);g.el('bossTestNext').click()}for(const kind of ['riot','spitter','howler','lobber']){g.el('bossTestKind').value=kind;g.el('bossTestKind').dispatch('change');assert.equal(g.state.trainingScenario,kind);assert.equal(g.state.mode,'paused')}assert.equal(g.state.enemies.length,1);g.el('bossTestAttacks').click();g.resume();for(let i=0;i<80;i++)g.update(.02);assert.ok(g.practiceSnapshot().damage>0);
});
test('Alpha 0.64 Lobber training respawns nearby with cache retained and practice-only credit',()=>{
 const g=loadGame(),e=enterLobber64(g),cache=g.fieldState().lobber,count=g.pendingImages.length;g.hitEnemy(e,1e9,'GUN');assert.equal(g.practiceSnapshot().targets,1);assert.equal(g.state.killCount,0);assert.equal(g.state.enemyTally.lobber,0);g.p.x=500;let next;for(let i=0;i<90&&!next;i++){g.update(.02);next=g.state.enemies.find(x=>x.lobber&&x.hp>0)}assert.ok(next&&next!==e);near(next.x,g.p.x);assert.equal(next.hp,300);assert.equal(g.state.enemies.length,1);assert.equal(g.fieldState().lobber,cache);assert.equal(g.pendingImages.length,count);assert.equal(g.state.gems.length,0);
});
test('Alpha 0.64 held Lobber results/One More Run preserve private setup and normal record isolation',()=>{
 const raw=JSON.stringify({version:1,actors:'classic'}),g=loadGame({stored:'900',preferencesStored:raw}),saved=g.journalSaved();enterLobber64(g);g.pause();g.resetBossTesting('lobber','molotov',true);g.el('bossTestAttacks').click();g.el('bossTestArt').click();quitForTest(g);assert.match(g.el('modal').innerHTML,/LOBBER DRILL COMPLETE · UNSCORED/);assert.match(g.runReportText(),/LOBBER DRILL: lobber/);assert.equal(g.saved(),'900');assert.equal(g.preferencesSaved(),raw);assert.equal(g.journalSaved(),saved);g.advanceClock(500);g.el('again').click();assert.equal(g.state.trainingScenario,'lobber');assert.equal(g.p.wildfire,true);assert.equal(g.bossTestState().attacks,true);assert.equal(g.fieldStyle(),'classic');g.end('abandoned');g.advanceClock(500);g.el('resultMenu').click();g.start();assert.equal(g.state.training,false);assert.equal(g.bossTestState().active,false);assert.equal(g.state.nextLobberAt,255);assert.equal(g.state.enemyTally.lobber,0);assert.equal(g.fieldStyle(),'classic');
});
test('Alpha 0.64 paused comparison, held Lobber report, Back/background and second-finger Pause freeze action',()=>{
 for(const artworkStatus of ['ready','pending','error']){const g=loadGame({artworkStatus});enterLobber64(g);g.el('stick').dispatch('pointerdown',{pointerId:1,clientX:135.5,clientY:662.5});g.el('pause').dispatch('pointerdown',{pointerId:2});assert.equal(g.state.mode,'paused');const world=fieldWorld56(g),bombs=JSON.stringify(g.state.lobberBombs);if(artworkStatus==='ready'){g.el('bossTestArt').click();g.el('bossTestArt').click();assert.deepEqual(fieldWorld56(g),world)}g.el('bossTestReport').click();const text=g.benchmarkText();assert.match(text,/Developer Lobber drill: lobber/);assert.match(text,new RegExp(artworkStatus==='ready'?'Lobber art ready':artworkStatus==='pending'?'Loading field actors':'Field artwork unavailable'));g.resolveArtwork();assert.equal(g.benchmarkText(),text);g.phoneBack();assert.equal(g.state.mode,'paused');g.resume();g.document.hidden=true;g.event('visibilitychange');g.document.hidden=false;g.event('visibilitychange');g.update(10);assert.equal(g.state.mode,'paused');assert.deepEqual(fieldWorld56(g),world);assert.equal(JSON.stringify(g.state.lobberBombs),bombs)}
});
test('Alpha 0.64 fresh, hidden and stale Lobber actions cannot start or alter a different encounter',()=>{
 const g=loadGame();g.el('previewsOpen').click();const entry=g.el('lobberReview');entry.click();assert.equal(g.state.mode,'previews');g.advanceClock(500);g.document.hidden=true;entry.click();assert.equal(g.state.mode,'previews');g.document.hidden=false;entry.click();g.pause();const old=g.el('bossTestRestart'),pick=g.el('bossTestKind');g.resetBossTesting('warden');const boss=g.state.activeBoss;old.click();entry.click();pick.value='lobber';pick.dispatch('change');assert.equal(g.state.activeBoss,boss);
});
test('Alpha 0.64 packed full-cast memory/download caps, unknown storage, canvases and production API isolation hold',()=>{
 const d=JSON.parse(sampleAssetText),common=['survivorWalk','survivorAim','shamblerWalk','runnerRun','bruteWalk'].reduce((n,k)=>n+d[k].width*d[k].height*4,0),boss=['breakerWalk','breakerCombat'].reduce((n,k)=>n+d[k].width*d[k].height*4,0),special=['riot','spitter','howler','lobber'].reduce((n,k)=>n+d[k].width*d[k].height*4,0);assert.equal(common+boss+special,45791128);assert.ok(common+boss+special<44*1024*1024);assert.ok(Buffer.byteLength(html)<12*1024*1024);assert.equal((html.match(/<canvas\b/g)||[]).length,6);assert.doesNotMatch(source,/globalThis\.api/);for(const storageBlocked of [false,true]){const raw=JSON.stringify({version:99,keep:'unknown'}),g=loadGame({storageBlocked,preferencesStored:raw});enterLobber64(g);g.end('abandoned');assert.equal(g.preferencesSaved(),raw);assert.equal(g.state.runResult.training,true)}
});
test('Alpha 0.64 killing a winding-up Lobber prevents release while ordinary non-overtime remains protected',()=>{
 const g=loadGame();cleanRun(g);const e=lobber64(g,{phase:'windup',phaseTime:.5});g.advanceFieldLobber(.02);g.hitEnemy(e,1e6,'GUN');g.updateLobbers(1);assert.equal(g.state.lobberBombs.length,0);assert.equal(g.fieldLobberActive(e),false);const h=loadGame();cleanRun(h);h.setup({elapsed:300,nextLobberAt:0,overtime:0,nextBossAt:Infinity});h.updateLobberSchedule();assert.equal(h.state.enemies.some(x=>x.lobber),false);
});

// Alpha 0.65: coherent, compact Field reference portraits without combat decodes.
function portraitDraws65(g,id){return g.drawingTrace('portrait-'+id).filter(r=>r[0]==='drawImage')}
test('Alpha 0.65 Bestiary opens with one shared Field image and the current correct crop identities',()=>{
 const g=loadGame({traceCanvas:true});g.openHomeEntry('bestiaryOpen');const a=JSON.parse(sampleAssetText).bestiaryPortraits,state=g.bestiaryArtState();assert.equal(state.status,'ready');assert.equal(state.look,'field');assert.equal(g.pendingImages.length,1);assert.equal(g.pendingImages[0].src,a.src);assert.equal(g.fieldState().status,'idle');assert.equal(Object.keys(g.state.sampleArtwork).length,0);
 for(const [i,id] of a.ids.entries()){const draw=portraitDraws65(g,id).at(-1);assert.ok(draw,id);assert.equal(draw[1],state.image);assert.deepEqual(draw.slice(2,6),a.frames[i]);assert.ok(draw[6]>=0&&draw[7]>=0&&draw[6]+draw[8]<=144&&draw[7]+draw[9]<=112,id+' fits');}assert.equal(portraitDraws65(g,'hunter').length,1);assert.match(g.el('bestiaryArtStatus').textContent,/all eleven enemies/);assert.equal(state.image.onload,null);assert.equal(state.image.onerror,null);
});
test('Alpha 0.65 Field guide descriptions match new silhouettes and all three boss entries',()=>{
 const g=loadGame();g.showBestiary();const text=g.el('modal').innerHTML;for(const phrase of ['yellow hooded jacket','gold-edged front shield','swollen pink throat','canisters by hand','long claws and ivory spines','blue-lit gauntlets'])assert.ok(text.includes(phrase),phrase);assert.match(text,/Bosses · 3/);assert.doesNotMatch(text,/raised launcher|raise its launcher/);assert.match(text,/one-second throwing windup/);assert.match(text,/fixed orange ground circle for 1.4 seconds/);assert.equal(guideIds(g).length,11);
});
test('Alpha 0.65 Classic preference keeps exact native guide drawings with no portrait decode',()=>{
 const g=loadGame({traceCanvas:true,preferencesStored:JSON.stringify({version:1,actors:'classic'})});g.showBestiary();assert.equal(g.pendingImages.length,0);assert.equal(g.el('bestiaryArt').value,'classic');for(const entry of g.enemyGuide){const e=g.enemyPortraitEntity(entry.id);g.clearTrace();g.renderEnemy(e,g.el('game').getContext('2d'),true);assert.deepEqual(g.drawingTrace(),g.drawingTrace('portrait-'+entry.id).slice(2));}assert.match(g.el('modal').innerHTML,/Steel-blue body/);
});
test('Alpha 0.65 reference style is temporary, filters preserve it, re-entry follows saved preference',()=>{
 const g=loadGame({traceCanvas:true});const pref=g.preferencesSaved(),saved=g.journalSaved();g.showBestiary();const image=g.bestiaryArtState().image;g.setBestiaryFilter('specialist');assert.equal(g.pendingImages.length,1);assert.equal(g.bestiaryArtState().image,image);assert.equal(guideIds(g).length,4);g.el('bestiaryArt').value='classic';g.el('bestiaryArt').dispatch('change');assert.equal(g.bestiaryArtState().status,'idle');assert.equal(g.bestiaryArtState().image,null);assert.equal(portraitDraws65(g,'riot').length,0);assert.equal(g.state.preferences.actors,'field');assert.equal(g.preferencesSaved(),pref);assert.equal(g.journalSaved(),saved);g.setBestiaryFilter('boss');assert.equal(g.el('bestiaryArt').value,'classic');g.closeBestiary();g.showBestiary();assert.equal(g.el('bestiaryArt').value,'field');assert.equal(g.pendingImages.length,2);
});
test('Alpha 0.65 pending filter changes update only connected current portrait canvases',()=>{
 const g=loadGame({traceCanvas:true,artworkStatus:'pending'});g.showBestiary();const old=g.el('portrait-riot'),oldCtx=g.drawingTrace('portrait-riot'),n=oldCtx.length;g.setBestiaryFilter('horde');assert.equal(old.isConnected,false);assert.equal(g.pendingImages.length,1);g.resolveArtwork();assert.equal(g.bestiaryArtState().status,'ready');assert.equal(oldCtx.length,n);for(const id of ['shambler','runner','brute'])assert.equal(portraitDraws65(g,id).length,1);assert.equal(g.el('portrait-riot'),undefined);assert.equal(g.el('bestiaryFilter').value,'horde');
});
test('Alpha 0.65 guide exit clears handlers and stale pending callbacks cannot repaint a new visit',()=>{
 const g=loadGame({traceCanvas:true,artworkStatus:'pending'});g.openHomeEntry('bestiaryOpen');const image=g.pendingImages[0],ready=image.onload,error=image.onerror;g.phoneBack();assert.equal(g.state.mode,'journal');assert.equal(image.onload,null);assert.equal(image.onerror,null);assert.equal(g.bestiaryArtState().image,null);g.el('bestiaryOpen').click();const current=g.bestiaryArtState();ready();error();assert.equal(g.bestiaryArtState().image,current.image);assert.equal(g.bestiaryArtState().status,'loading');g.resolveArtwork();assert.equal(g.bestiaryArtState().status,'ready');
});
test('Alpha 0.65 failures retain native portraits, tactics and navigation without automatic decode loops',()=>{
 for(const reason of ['error','zero','wrong-size','missing','budget','crop','ids','bad-json']){const g=loadGame({traceCanvas:true,artworkStatus:'pending'});if(['missing','budget','crop','ids','bad-json'].includes(reason)){const data=JSON.parse(sampleAssetText);if(reason==='missing')delete data.bestiaryPortraits;if(reason==='budget')data.bestiaryPortraits.width=999999;if(reason==='crop')data.bestiaryPortraits.frames[0][2]=999999;if(reason==='ids')data.bestiaryPortraits.ids.reverse();g.el('sampleAssets').textContent=reason==='bad-json'?'{':JSON.stringify(data);}g.showBestiary();const image=g.pendingImages[0];if(reason==='error')image.onerror();if(reason==='zero'||reason==='wrong-size'){image.naturalWidth=reason==='zero'?0:321;image.naturalHeight=168;image.onload();}assert.equal(g.bestiaryArtState().status,'failed',reason);assert.equal(g.bestiaryArtState().image,null);assert.match(g.el('bestiaryArtStatus').textContent,/unavailable.*Classic/);assert.equal(portraitDraws65(g,'riot').length,0);assert.ok(g.drawingTrace('portrait-riot').some(r=>r.includes('#f2c36b')));const n=g.pendingImages.length;g.setBestiaryFilter('boss');g.prepareBestiaryArt();assert.equal(g.pendingImages.length,n);assert.equal(guideIds(g).length,3);g.closeBestiary();assert.equal(g.state.mode,'menu');}
});
test('Alpha 0.65 deliberate style switching retries failed portraits and rejects obsolete controls',()=>{
 const g=loadGame({artworkStatus:'pending'});g.showBestiary();const old=g.el('bestiaryArt');g.pendingImages[0].onerror();g.selectBestiaryArt('classic');old.value='field';old.dispatch('change');assert.equal(g.bestiaryArtState().look,'classic');g.selectBestiaryArt('field');assert.equal(g.pendingImages.length,2);g.resolveArtwork();assert.equal(g.bestiaryArtState().status,'ready');g.selectBestiaryArt('invalid');assert.equal(g.bestiaryArtState().look,'field');g.closeBestiary();g.selectBestiaryArt('classic');assert.equal(g.bestiaryArtState().look,'field');
});
test('Alpha 0.65 browsing from held results leaves stats, time, record and Journal frozen',()=>{
 const g=loadGame({traceCanvas:true});cleanRun(g);g.setup({elapsed:181});finishForGuide(g);const result=g.state.runResult,saved=g.journalSaved(),record=g.saved(),world=fieldWorld56(g);g.el('endBestiary').click();assert.equal(g.pendingImages.at(-1),g.bestiaryArtState().image);for(const filter of ['boss','specialist','horde','all'])g.setBestiaryFilter(filter);g.frame(50000);assert.deepEqual(fieldWorld56(g),world);assert.equal(g.state.runResult,result);assert.equal(g.journalSaved(),saved);assert.equal(g.saved(),record);g.phoneBack();assert.equal(g.state.mode,'end');assert.equal(g.state.runResult,result);assert.equal(g.bestiaryArtState().image,null);g.el('again').click();assert.equal(g.state.mode,'play');near(g.state.elapsed,0);assert.equal(g.bestiaryArtState().status,'idle');
});
test('Alpha 0.65 guide art and combat caches remain separate and gameplay release clears pending guide work',()=>{
 const g=loadGame({artworkStatus:'pending'});g.showBestiary();const image=g.pendingImages[0],ready=image.onload;g.start();assert.equal(g.bestiaryArtState().status,'idle');assert.equal(image.onload,null);assert.equal(image.onerror,null);ready();assert.equal(g.bestiaryArtState().status,'idle');assert.equal(g.fieldState().status,'loading');g.resolveArtwork();assert.equal(g.fieldActorsActive(),true);assert.equal(g.pendingImages.length,6);assert.equal(g.fieldState().rows.survivorWalk.image.src,JSON.parse(sampleAssetText).survivorWalk.src);
});
test('Alpha 0.65 guide art survives backgrounding without gameplay, save writes or automatic navigation',()=>{
 const future=JSON.stringify({version:99,unknown:'retained'}),g=loadGame({journalStored:future,preferencesStored:JSON.stringify({version:1,actors:'field'}),artworkStatus:'pending'});g.openHomeEntry('bestiaryOpen');g.document.hidden=true;g.event('visibilitychange');g.resolveArtwork();assert.equal(g.state.mode,'bestiary');assert.equal(g.bestiaryArtState().status,'ready');g.document.hidden=false;g.event('visibilitychange');g.phoneBack();assert.equal(g.state.mode,'journal');assert.equal(g.journalSaved(),future);assert.equal(g.bestiaryArtState().image,null);
});
test('Alpha 0.65 guide reference sheet has reproducible provenance and stays outside combat/prototype budgets',()=>{
 const a=JSON.parse(sampleAssetText).bestiaryPortraits,m=JSON.parse(readFileSync(join(__dirname,'../dist/assets/bestiary-portraits.json'))),b=readFileSync(join(__dirname,'../dist',a.file)),hash=v=>require('node:crypto').createHash('sha256').update(v).digest('hex');assert.equal(hash(b),a.sha256);assert.equal(a.sha256,m.sha256);assert.equal(a.src,'data:image/webp;base64,'+b.toString('base64'));assert.deepEqual(a.frames,m.frames);assert.deepEqual(a.ids,m.ids);assert.equal(m.rgba_exact_to_thumbnail_reference,true);assert.equal(m.thumbnail_height_cap,80);assert.equal(a.width*a.height*4,236544);assert.ok(a.width*a.height*4<1024*1024);for(const ref of m.sources){const s=JSON.parse(sampleAssetText)[ref.asset];assert.equal(ref.runtime_sha256,hash(readFileSync(join(__dirname,'../dist',ref.file))));assert.deepEqual(ref.crop,s.frames[ref.frame]);assert.ok(ref.thumbnail_size[1]<=80);assert.ok(ref.thumbnail_size[0]<=ref.crop[2]);}assert.ok(Buffer.byteLength(html)<12*1024*1024);assert.equal(Object.keys(JSON.parse(sampleAssetText)).length,20);const g=loadGame();enterStreet(g);assert.equal(g.pendingImages.length,12);assert.equal(g.bestiaryArtState().status,'idle');
});

// Alpha 0.66: the last native horde identity gets Field art, without wave changes.
function hunter66(g,extra={}){g.scheduleRush(Infinity);const e=enemy({...g.enemyArt.hunter,x:100,y:-50,hp:1000,max:1000,speed:145,dmg:9,...extra});g.setup({enemies:[e],nextBossAt:Infinity});g.prepareFieldHunter();return e}
function enterHunter66(g){g.el('previewsOpen').click();g.advanceClock(500);g.el('hunterReview').click();assert.equal(g.state.trainingScenario,'hunter');return g.state.enemies[0]}
test('Alpha 0.66 Hunter preserves original source, lossless packed provenance and twenty valid foot crops',()=>{
 const a=JSON.parse(sampleAssetText).hunter,m=JSON.parse(readFileSync(join(__dirname,'../dist/assets/hunter-field.json'))),r=JSON.parse(readFileSync(join(__dirname,'../dist/assets/runtime-formats.json'))).hunter,hash=v=>require('node:crypto').createHash('sha256').update(v).digest('hex');assert.equal(hash(readFileSync(join(__dirname,'../dist/assets/hunter-field.png'))),m.sha256);const bytes=readFileSync(join(__dirname,'../dist',a.file));assert.equal(hash(bytes),a.sha256);assert.equal(a.sha256,r.runtime_sha256);assert.deepEqual(Buffer.from(a.src.split(',')[1],'base64'),bytes);assert.equal(r.rgba_exact,true);assert.equal(r.alpha_exact,true);assert.equal(r.runtime_bytes,84384);assert.deepEqual(m.views,['east','southeast-front','south-front','northwest-rear','north-rear']);assert.equal(m.poses.length,4);assert.equal(a.frames.length,20);assert.equal(a.width*a.height*4,344064);
 for(let i=0;i<20;i++){const [x,y,w,h]=a.frames[i],[px,py]=a.pivots[i],cell=m.packedRuntime.cellBounds[i];assert.ok(x>=cell[0]&&y>=cell[1]&&x+w<=a.width&&y+h<=a.height);assert.ok(px>=0&&px<=w);assert.equal(py,h);assert.ok(r.frame_rgba_sha256[i].length===64);}
});
test('Alpha 0.66 all actor groups including Hunter fit the unchanged combined cap and reject overflow',()=>{
 const g=loadGame(),data=JSON.parse(sampleAssetText),bytes=k=>data[k].width*data[k].height*4,common=['survivorWalk','survivorAim','shamblerWalk','runnerRun','bruteWalk'].reduce((n,k)=>n+bytes(k),0),sum=common+Math.max(bytes('breakerWalk')+bytes('breakerCombat'),bytes('warden'),bytes('harvester'))+['riot','spitter','howler','lobber','hunter'].reduce((n,k)=>n+bytes(k),0);assert.equal(sum,46135192);assert.ok(sum<44*1024*1024);assert.equal(g.fieldHowlerBudget(data),true);data.hunter.width++;assert.equal(g.fieldHowlerBudget(data),true);data.hunter.width+=10;assert.equal(g.fieldHowlerBudget(data),false);delete data.hunter;assert.equal(g.fieldHowlerBudget(data),false);assert.ok(Buffer.byteLength(html)<12*1024*1024);
});
test('Alpha 0.66 Hunter loads once during the real warning, shares the image and releases after the wave and last survivor',()=>{
 const g=loadGame();cleanRun(g);assert.equal(g.pendingImages.length,5);g.scheduleRush(5);g.updateRush(0);assert.equal(g.state.rushPhase,'warning');g.prepareFieldHunter();const group=g.fieldState().hunter;assert.equal(group.status,'ready');assert.equal(g.pendingImages.length,6);for(let i=0;i<5;i++)g.prepareFieldHunter();assert.equal(g.pendingImages.length,6);g.setup({elapsed:5});g.updateRush(.02);const e=g.state.enemies.find(e=>e.rush);assert.ok(e);assert.equal(g.fieldHunterActive(e),true);g.scheduleRush(Infinity);g.prepareFieldHunter();assert.equal(g.fieldState().hunter,group);g.setup({enemies:[]});g.prepareFieldHunter();assert.equal(g.fieldState().hunter.status,'idle');assert.equal(group.row.image.onload,null);assert.equal(group.row.image.onerror,null);
});
test('Alpha 0.66 Hunter remains independent alongside all specialists and the largest exclusive boss group',()=>{
 const g=loadGame();cleanRun(g);g.spawnBoss('breaker');const boss=g.state.activeBoss;const e=hunter66(g);g.setup({enemies:[boss,e,spitter(),riot(),howler(),enemy({type:8,lobber:true,phase:'approach'})]});g.advanceFieldActors(.02);for(const k of ['breaker','spitter','riot','howler','lobber','hunter'])assert.equal(g.fieldState()[k].status,'ready',k);const hunterImage=g.fieldState().hunter.row.image;g.setup({enemies:[e],activeBoss:null});g.prepareFieldBreaker();g.prepareFieldRiot();g.prepareFieldSpitter();g.prepareFieldHowler();g.prepareFieldLobber();assert.equal(g.fieldState().hunter.row.image,hunterImage);assert.equal(g.fieldHunterActive(e),true);
});
test('Alpha 0.66 pending Hunter shows exact native fallback and late completion changes only presentation',()=>{
 const g=loadGame({traceCanvas:true,artworkStatus:'pending'}),c=loadGame({traceCanvas:true,preferencesStored:JSON.stringify({version:1,actors:'classic'})});cleanRun(g);g.resolveArtwork();const e=hunter66(g),world=fieldWorld56(g),image=g.pendingImages[5];g.clearTrace();c.clearTrace();g.renderEnemy(e);c.renderEnemy(e);assert.equal(JSON.stringify(g.drawingTrace()),JSON.stringify(c.drawingTrace()));assert.equal(g.fieldHunterActive(e),false);g.resolveArtwork();assert.equal(g.fieldHunterActive(e),true);assert.equal(image.onload,null);assert.equal(image.onerror,null);assert.deepEqual(fieldWorld56(g),world);
});
test('Alpha 0.66 malformed, oversized, failed and wrong-sized Hunter art falls back without retries or base failure',()=>{
 for(const failure of ['error','zero','wrong-size','missing','budget','crop','pivot','references']){const g=loadGame({artworkStatus:'pending'});cleanRun(g);g.resolveArtwork();if(['missing','budget','crop','pivot','references'].includes(failure)){const data=JSON.parse(sampleAssetText);if(failure==='missing')delete data.hunter;if(failure==='budget')data.hunter.width=999999;if(failure==='crop')data.hunter.frames[0][2]=9999;if(failure==='pivot')data.hunter.pivots[0][0]=-1;if(failure==='references')data.hunter.referenceHeights[0]=0;g.el('sampleAssets').textContent=JSON.stringify(data);}const e=hunter66(g);if(failure==='error')g.pendingImages[5].onerror();if(failure==='zero'||failure==='wrong-size'){const image=g.pendingImages[5];image.naturalWidth=failure==='zero'?0:385;image.naturalHeight=224;image.onload();}assert.equal(g.fieldState().hunter.status,'failed',failure);assert.equal(g.fieldHunterActive(e),false);assert.equal(g.fieldActorsActive(),true);assert.match(g.fieldArtStatus(),/Hunter art unavailable.*Classic/);const n=g.pendingImages.length;g.prepareFieldHunter();g.advanceFieldActors(.02);assert.equal(g.pendingImages.length,n);assert.equal(g.state.mode,'play');}
});
test('Alpha 0.66 stale Hunter callbacks cannot replace fresh run or temporary style generations',()=>{
 const g=loadGame({artworkStatus:'pending'});cleanRun(g);g.resolveArtwork();hunter66(g);const image=g.pendingImages[5],ready=image.onload,error=image.onerror;g.pause();g.selectFieldActors('classic');assert.equal(image.onload,null);assert.equal(image.onerror,null);ready();error();assert.equal(g.fieldState().hunter.status,'idle');g.selectFieldActors('field');g.resolveArtwork();const current=g.fieldState().hunter;assert.equal(current.status,'ready');ready();error();assert.equal(g.fieldState().hunter,current);assert.equal(g.fieldActorsActive(),true);
});
test('Alpha 0.66 all eight run headings and four phases use correct columns and northwest mirroring',()=>{
 const g=loadGame(),columns=[0,1,2,1,0,3,4,3],flips=[1,1,1,-1,-1,1,1,-1];cleanRun(g);const e=hunter66(g);for(let direction=0;direction<8;direction++)for(let phase=0;phase<4;phase++){const pose=g.fieldHunterPose(e,{moving:true,dx:Math.cos(direction*Math.PI/4),dy:Math.sin(direction*Math.PI/4),direction,travel:phase*15+.1,offset:0});assert.equal(pose.direction,direction);assert.equal(pose.pose.frame,phase*5+columns[direction]);assert.equal(pose.flip,flips[direction]);}const m=g.fieldHunterMotion(e);m.direction=0;m.dx=Math.cos(Math.PI/8+.03);m.dy=Math.sin(Math.PI/8+.03);m.moving=true;assert.equal(g.fieldHunterPose(e,m).direction,0);
});
test('Alpha 0.66 Hunter stride follows real distance, stops at rest and resets on teleport without touching serial or combat',()=>{
 const g=loadGame();cleanRun(g);const e=hunter66(g),world=fieldWorld56(g),serial=g.fieldState().serial,m=g.fieldHunterMotion(e);assert.equal(g.fieldState().serial,serial);m.offset=0;e.x+=12;g.advanceFieldHunter(.1);near(m.travel,12);assert.equal(m.direction,0);const travel=m.travel;g.advanceFieldHunter(.2);near(m.travel,travel);assert.equal(m.moving,false);assert.equal(Math.floor(m.pose.frame/5),0);e.salvageStunUntil=99;g.advanceFieldHunter(.2);assert.equal(m.moving,false);e.salvageStunUntil=0;e.x+=1000;g.advanceFieldHunter(.02);near(m.travel,0);assert.equal(m.previous,null);assert.equal(m.moving,false);assert.equal(e.hp,world.enemies[0].hp);assert.equal(g.state.killCount,0);assert.equal(g.state.xp,0);assert.equal(g.fieldState().serial,serial);
});
test('Alpha 0.66 Hunter feet and standing scale are fixed while blends, Reduced Effects and culling stay bounded',()=>{
 const g=loadGame({traceCanvas:true});cleanRun(g);const e=hunter66(g),m=g.fieldHunterMotion(e),a=JSON.parse(sampleAssetText).hunter;for(let frame=0;frame<20;frame++){m.pose={asset:'hunter',frame};m.previous=null;const info=g.fieldActorInfo(e,'hunter');near(info.height,46);near(info.scale,46/a.referenceHeights[frame%5]);near((info.crop[3]-info.pivot[1])*info.scale,0);}m.offset=0;e.x+=20;g.advanceFieldHunter(.1);assert.equal(g.fieldActorInfo(e,'hunter').layers.length,2);g.state.preferences.reduced=true;assert.equal(g.fieldActorInfo(e,'hunter').layers.length,1);g.clearTrace();g.renderEnemy(e);assert.ok(g.drawingTrace().some(r=>r.includes('#c9b4ff')));e.x=3000;g.clearTrace();g.renderEnemy(e);assert.equal(g.drawingTrace().filter(r=>r[0]==='drawImage').length,0);
});
test('Alpha 0.66 normal Hunter HP, speed, damage, wave count and native spawn RNG agree across Field and Classic',()=>{
 const snapshots=[];for(const actors of ['field','classic']){const g=loadGame({seed:71,preferencesStored:JSON.stringify({version:1,actors})});cleanRun(g);g.scheduleRush(5);g.updateRush(0);g.prepareFieldHunter();assert.equal(g.state.rushPhase,'warning');g.setup({elapsed:5});g.updateRush(.02);for(let i=1;i<16;i++){g.setup({elapsed:5+i*.75});g.updateRush(.75);}const hunters=g.state.enemies.filter(e=>e.rush);assert.equal(hunters.length,16);assert.equal(g.state.rushSpawned,16);assert.equal(g.spawnRushHunter(),false);near(hunters[0].hp,24*(1+5/200));near(hunters[0].speed,145*(1+5/350));near(hunters[0].dmg,9);near(g.state.rushUntil,17);g.advanceFieldActors(.02);g.render();snapshots.push({world:fieldWorld56(g),axis:g.state.rushAxis,spawned:g.state.rushSpawned,until:g.state.rushUntil,choices:JSON.parse(JSON.stringify(g.upgradeChoices()))});}assert.deepEqual(snapshots[0],snapshots[1]);
});
test('Alpha 0.66 normal Hunter contact still removes nine HP and cannot gain rally or decoy eligibility',()=>{
 const g=loadGame();cleanRun(g);const e=hunter66(g,{x:0,y:0,speed:0});g.p.fireClock=Infinity;g.p.inv=0;g.update(.02);near(g.p.hp,91);assert.equal(g.state.lastThreat,'hunter');assert.equal(g.rallyEligible(e),false);g.deployDecoy();assert.equal(g.state.decoy.targets.has(e),false);near(g.howlMultiplier(e),1);assert.equal(g.fieldHunterActive(e),true);
});
test('Alpha 0.66 direct Hunter drill is nearby, private Field, safe, unscored and attack-off in both phone orientations',()=>{
 for(const [width,height] of [[412,915],[915,412],[360,740]]){const g=loadGame({width,height,preferencesStored:JSON.stringify({version:1,actors:'classic'})}),prefs=g.preferencesSaved(),saved=g.journalSaved(),e=enterHunter66(g);assert.equal(g.state.training,true);assert.equal(g.bossTestState().attacks,false);assert.equal(g.fieldStyle(),'field');assert.equal(g.state.preferences.actors,'classic');assert.equal(g.fieldHunterActive(e),true);assert.equal(e.rush,true);assert.equal(e.trainingLive,true);near(e.hp,300);near(e.speed,145);near(e.dmg,9);assert.ok(Math.abs(e.y-g.p.y)<=140);assert.equal(g.state.enemies.length,1);for(let i=0;i<90;i++)g.update(.02);assert.equal(g.state.bullets.length,0);near(g.p.hp,g.p.max);assert.match(g.el('objective').textContent,/BLACKOUT HUNTER TEST · PURSUING/);assert.match(g.el('runGoal').textContent,/hunters defeated/);assert.equal(g.state.rushSpawned,0);assert.equal(g.journalSaved(),saved);assert.equal(g.preferencesSaved(),prefs);}
});
test('Alpha 0.66 Hunter drill uses real contact feedback and respawns without wave, score or cache churn',()=>{
 const g=loadGame({stored:'900'}),saved=g.journalSaved(),e=enterHunter66(g),image=g.fieldState().hunter.row.image;e.x=g.p.x;e.y=g.p.y;g.update(.02);assert.ok(g.practiceSnapshot().threats>0);near(g.p.hp,g.p.max);g.hitEnemy(e,99999);assert.equal(g.practiceSnapshot().targets,1);const n=g.pendingImages.length;for(let i=0;i<90;i++)g.update(.02);const fresh=g.state.enemies.find(e=>e.rush&&e.hp>0);assert.ok(fresh&&fresh!==e);assert.equal(g.fieldState().hunter.row.image,image);assert.equal(g.pendingImages.length,n);assert.equal(g.state.rushPhase,'waiting');assert.equal(g.state.rushSpawned,0);assert.equal(g.state.rushesSurvived,0);assert.equal(g.state.bonusChoices,0);assert.equal(g.state.killCount,0);assert.equal(g.state.xp,0);assert.equal(g.state.gems.length,0);assert.equal(g.saved(),'900');assert.equal(g.journalSaved(),saved);
});
test('Alpha 0.66 paused Hunter controls retain real loadouts, previous targets, boss cycle and safe reset',()=>{
 const g=loadGame();enterHunter66(g);g.pause();g.el('bossTestAttacks').click();assert.equal(g.bossTestState().attacks,true);const weapon=g.el('bossTestWeapon');weapon.value='arc';weapon.dispatch('change');assert.equal(g.state.mode,'paused');near(g.state.elapsed,0);assert.equal(g.p.arc,3);g.el('bossTestEvolved').click();assert.equal(g.p.thunder,true);assert.equal(g.state.mode,'paused');g.el('bossTestRestart').click();assert.equal(g.state.mode,'paused');assert.equal(g.fieldHunterActive(g.state.enemies[0]),true);g.el('bossTestNext').click();assert.equal(g.state.trainingScenario,'breaker');g.el('bossTestNext').click();assert.equal(g.state.trainingScenario,'warden');g.el('bossTestNext').click();assert.equal(g.state.trainingScenario,'harvester');g.el('bossTestNext').click();assert.equal(g.state.trainingScenario,'breaker');const picker=g.el('bossTestKind');picker.value='hunter';picker.dispatch('change');assert.equal(g.state.trainingScenario,'hunter');assert.equal(g.state.mode,'paused');g.el('bossTestArt').click();assert.equal(g.fieldStyle(),'classic');assert.equal(g.fieldState().hunter.status,'idle');g.el('bossTestArt').click();assert.equal(g.fieldHunterActive(g.state.enemies[0]),true);
});
test('Alpha 0.66 Hunter report, frozen results and One More Run restore the captured drill and leave records alone',()=>{
 const g=loadGame({stored:'900'}),saved=g.journalSaved(),pref=g.preferencesSaved();enterHunter66(g);g.update(.02);g.pause();g.el('bossTestAttacks').click();g.el('bossTestReport').click();assert.equal(g.state.mode,'benchmark');const capture=g.state.benchmarkCapture,text=g.benchmarkText();assert.match(text,/ALPHA 0.85/);assert.match(text,/Developer Blackout Hunter drill: hunter/);assert.match(text,/Blackout Hunter art ready/);g.resolveArtwork();assert.equal(g.benchmarkText(),text);assert.equal(g.state.benchmarkCapture,capture);g.phoneBack();quitForTest(g);const result=g.state.runResult;assert.equal(result.bossTest.boss,'hunter');assert.equal(result.bossTest.attacks,true);assert.match(g.el('modal').innerHTML,/BLACKOUT HUNTER DRILL COMPLETE · UNSCORED/);assert.match(g.runReportText(),/BLACKOUT HUNTER DRILL/);g.frame(99999);assert.equal(g.state.runResult,result);g.advanceClock(500);g.el('again').click();assert.equal(g.state.trainingScenario,'hunter');assert.equal(g.bossTestState().attacks,true);near(g.state.elapsed,0);assert.equal(g.state.killCount,0);assert.equal(g.saved(),'900');assert.equal(g.journalSaved(),saved);assert.equal(g.preferencesSaved(),pref);
});
test('Alpha 0.66 Hunter art entry rejects held, hidden and stale input while two-finger Pause and phone Back freeze gait',()=>{
 const g=loadGame();g.el('previewsOpen').click();const entry=g.el('hunterReview');entry.click();assert.equal(g.state.mode,'previews');g.advanceClock(500);g.document.hidden=true;entry.click();assert.equal(g.state.mode,'previews');g.document.hidden=false;entry.click();const e=g.state.enemies[0];g.update(.02);g.el('stick').dispatch('pointerdown',{pointerId:1,clientX:135.5,clientY:662.5});g.el('pause').dispatch('pointerdown',{pointerId:2,isPrimary:false});assert.equal(g.state.mode,'paused');assert.equal(g.touch.id,null);const motion=JSON.stringify(g.fieldHunterMotion(e)),time=g.state.elapsed;g.frame(50000);near(g.state.elapsed,time);assert.equal(JSON.stringify(g.fieldHunterMotion(e)),motion);entry.click();assert.equal(g.state.mode,'paused');g.resume();g.phoneBack();assert.equal(g.state.mode,'paused');g.document.hidden=true;g.event('visibilitychange');g.document.hidden=false;g.event('visibilitychange');assert.equal(g.state.mode,'paused');
});
test('Alpha 0.66 Hunter guide picture and notes match the live atlas while original Classic portrait remains exact',()=>{
 const g=loadGame({traceCanvas:true});g.showBestiary();assert.match(g.el('modal').innerHTML,/torn plum jacket/);const p=JSON.parse(sampleAssetText).bestiaryPortraits,index=p.ids.indexOf('hunter'),ref=JSON.parse(readFileSync(join(__dirname,'../dist/assets/bestiary-portraits.json'))).sources[index];assert.equal(ref.asset,'hunter');assert.equal(ref.frame,2);assert.equal(portraitDraws65(g,'hunter').length,1);assert.deepEqual(portraitDraws65(g,'hunter')[0].slice(2,6),p.frames[index]);g.selectBestiaryArt('classic');g.clearTrace();g.renderEnemy(g.enemyPortraitEntity('hunter'),g.el('game').getContext('2d'),true);assert.deepEqual(g.drawingTrace(),g.drawingTrace('portrait-hunter').slice(2));assert.match(g.el('modal').innerHTML,/Small violet enemies/);assert.equal(g.pendingImages.length,1);
});
test('Alpha 0.66 preview optimization keeps the original and prior quality floor while Hunter never enters original prototype loading',()=>{
 const a=JSON.parse(sampleAssetText).enemies,r=JSON.parse(readFileSync(join(__dirname,'../dist/assets/runtime-formats.json'))).enemies;assert.equal(r.runtime_bytes,408144);assert.equal(r.alpha_exact,true);assert.ok(r.visible_rgb_psnr_db>38);assert.match(r.encoding,/quality 95/);assert.equal(a.width,2048);assert.equal(a.height,768);const g=loadGame();enterStreet(g);assert.equal(g.pendingImages.length,12);assert.equal(g.fieldState().hunter.status,'idle');assert.equal(g.bestiaryArtState().status,'idle');assert.equal(Object.keys(JSON.parse(sampleAssetText)).length,20);assert.doesNotMatch(source,/globalThis\.api/);
});
test('Alpha 0.66 Hunter drill exit restores selected setup and future storage without persisting developer powers',()=>{
 const future=JSON.stringify({version:99,custom:'keep'}),prefs=JSON.stringify({version:1,actors:'classic'}),g=loadGame({journalStored:future,preferencesStored:prefs});enterHunter66(g);g.pause();quitForTest(g);g.el('resultMenu').click();assert.equal(g.bossTestState().active,false);assert.equal(g.fieldState().hunter.status,'idle');g.el('start').click();g.el('deploy').click();assert.equal(g.state.training,false);assert.equal(g.fieldStyle(),'classic');assert.equal(g.bossTestState().attacks,false);assert.equal(g.journalSaved(),future);assert.equal(g.preferencesSaved(),prefs);
});
test('Alpha 0.66 native movement advances all four Hunter run keys through the shipped update and draw path',()=>{
 const g=loadGame({traceCanvas:true});cleanRun(g);const e=hunter66(g,{x:160,y:0});g.p.fireClock=Infinity;const keys=new Set();for(let i=0;i<30;i++){g.update(.02);g.clearTrace();g.renderEnemy(e);const m=g.fieldHunterMotion(e);keys.add(Math.floor(m.pose.frame/5));assert.equal(m.direction,4);assert.equal(m.flip,-1);assert.ok(g.drawingTrace().some(r=>r[0]==='drawImage'&&r[1]===g.fieldState().hunter.row.image));}assert.equal(keys.size,4);near(e.x,73);near(e.y,0);near(g.p.hp,100);assert.equal(g.state.hostileShots.length,0);assert.equal(g.state.lobberBombs.length,0);
});

// Alpha 0.67: bounded procedural normal-run scenery, independent of actors/HUD.
function sceneryRun67(g,route='downtown'){g.el('start').click();g.selectRoute(route);cleanRun(g);return g}
test('Alpha 0.67 old and malformed preferences default to Street while Classic scenery round-trips independently',()=>{
 for(const raw of [null,'bad',JSON.stringify({version:1}),JSON.stringify({version:1,scenery:'unknown'})]){const g=loadGame({preferencesStored:raw});assert.equal(g.state.preferences.scenery,'street');assert.equal(g.preferencesSaved(),raw)}const g=loadGame();g.showSettings();g.el('fieldWorldStyle').value='classic';g.el('fieldWorldStyle').dispatch('change');assert.equal(g.state.preferences.scenery,'classic');assert.equal(g.state.preferences.actors,'field');assert.equal(g.state.preferences.hud,'composed');const saved=JSON.parse(g.preferencesSaved());assert.equal(saved.version,1);assert.equal(saved.scenery,'classic');const h=loadGame({preferencesStored:g.preferencesSaved()});assert.equal(h.state.preferences.scenery,'classic');assert.equal(h.state.preferences.actors,'field');
});
test('Alpha 0.67 scenery renders for each scored route without extra images, objects, RNG or progression writes',()=>{
 for(const route of ['downtown','freight','riverside','park','market']){const g=sceneryRun67(loadGame({traceCanvas:true}),route),world=fieldWorld56(g),prefs=g.preferencesSaved(),saved=g.journalSaved(),n=g.pendingImages.length;g.clearTrace();assert.equal(g.fieldWorldActive(),true);g.render();assert.equal(g.state.runRoute,route);assert.ok(g.worldCacheState().tiles.length>0);assert.deepEqual(fieldWorld56(g),world);assert.equal(g.pendingImages.length,n);assert.equal(g.preferencesSaved(),prefs);assert.equal(g.journalSaved(),saved);assert.ok(g.drawingTrace().filter(r=>r[0]==='fillRect').length>20);}
});
test('Alpha 0.67 Street and Classic preserve seeded combat, native movement and later upgrade randomness on all routes',()=>{
 for(const route of ['downtown','freight','riverside','park','market']){const worlds=[];for(const scenery of ['street','classic']){const g=sceneryRun67(loadGame({seed:77,preferencesStored:JSON.stringify({version:1,scenery})}),route);for(let i=0;i<12;i++)g.spawnEnemy();g.keys.d=true;for(let i=0;i<90;i++){g.update(.02);g.render()}g.keys.d=false;worlds.push({world:fieldWorld56(g),choices:JSON.parse(JSON.stringify(g.upgradeChoices()))});}assert.deepEqual(worlds[0],worlds[1],route);}
});
test('Alpha 0.67 numeric scenery cache reuses sub-tile views, handles negatives and stays capped while travelling',()=>{
 const g=sceneryRun67(loadGame()),a=g.fieldWorldTiles(-120,-170),same=g.fieldWorldTiles(-119,-169);assert.equal(a,same);assert.ok(a.some(t=>t.x<0&&t.y<0));assert.ok(a.every(t=>t.x%160===0&&t.y%160===0&&Number.isInteger(t.seed)));for(let i=0;i<300;i++){const tiles=g.fieldWorldTiles(-100000+i*166,100000-i*173);assert.ok(tiles.length<=256);assert.deepEqual(Object.keys(g.worldCacheState()).sort(),['key','tiles']);assert.ok(tiles.every(t=>Object.keys(t).sort().join(',')==='seed,x,y'));}assert.equal(g.fieldWorldHash(-10,8,3),g.fieldWorldHash(-10,8,3));assert.notEqual(g.fieldWorldHash(-10,8,3),g.fieldWorldHash(-11,8,3));
});
test('Alpha 0.67 all existing structure kinds are drawn without adding collision or mutating footprints',()=>{
 const g=sceneryRun67(loadGame({traceCanvas:true}));for(let type=0;type<6;type++){const o={x:70,y:90,w:type===4?130:110,h:type===4?130:80,type},copy=JSON.stringify(o);assert.equal(g.drawFieldWorldStructure(o),true);assert.equal(JSON.stringify(o),copy)}assert.equal(g.drawFieldWorldStructure({x:0,y:0,w:10,h:10,type:9}),false);g.state.preferences.scenery='classic';assert.equal(g.drawFieldWorldStructure({x:0,y:0,w:100,h:100,type:0}),false);
});
test('Alpha 0.67 Classic keeps native ground and structure fallbacks and skips procedural planning',()=>{
 const g=sceneryRun67(loadGame({traceCanvas:true,preferencesStored:JSON.stringify({version:1,scenery:'classic'})}));g.clearTrace();assert.equal(g.drawFieldWorldGround(-100,-100),false);assert.equal(g.drawingTrace().length,0);g.render();assert.equal(g.worldCacheState().tiles.length,0);assert.ok(g.drawingTrace().some(r=>r.includes('#1b2836')));assert.equal(g.fieldActorsActive(),true);
});
test('Alpha 0.67 Reduced Effects cuts grain, glows and litter while preserving core route surfaces and gameplay',()=>{
 const samples=[];for(const reduced of [false,true]){const g=sceneryRun67(loadGame({traceCanvas:true,preferencesStored:JSON.stringify({version:1,reduced})}));g.p.x=120;g.p.y=145;const world=fieldWorld56(g);g.clearTrace();g.render();const trace=g.drawingTrace();samples.push(trace.length);assert.equal(trace.some(r=>r[0]==='set'&&r[2]==='#a8b6b30c'),!reduced);assert.ok(trace.some(r=>r.includes('#141d24')));assert.deepEqual(fieldWorld56(g),world);}assert.ok(samples[1]<samples[0]*.7);
});
test('Alpha 0.67 mobile scenery work is bounded and no image decode or game object cache is created',()=>{
 for(const [width,height]of [[412,915],[915,412],[360,740]])for(const route of ['downtown','freight','riverside','park','market']){const g=sceneryRun67(loadGame({width,height,traceCanvas:true}),route);g.p.x=120;g.p.y=145;g.clearTrace();g.render();assert.ok(g.drawingTrace().length<2200,route+' command bound');assert.ok(g.worldCacheState().tiles.length<=64);assert.equal(g.pendingImages.length,5);assert.ok(g.worldCacheState().tiles.every(t=>!('image'in t)&&!('enemy'in t)));}assert.ok(Buffer.byteLength(html)<12*1024*1024);
});
test('Alpha 0.67 pause comparison stays paused, clears held joystick and preserves live encounter/records/setup',()=>{
 const g=sceneryRun67(loadGame());g.spawnBoss('breaker');const boss=g.state.activeBoss,saved=g.journalSaved(),before=fieldWorld56(g);g.el('stick').dispatch('pointerdown',{pointerId:1,clientX:135.5,clientY:662.5});g.el('pause').dispatch('pointerdown',{pointerId:2,isPrimary:false});assert.equal(g.state.mode,'paused');const old=g.el('fieldWorldCompare');old.click();assert.equal(g.state.mode,'paused');assert.equal(g.touch.id,null);assert.equal(g.state.preferences.scenery,'classic');assert.equal(g.state.activeBoss,boss);assert.deepEqual(fieldWorld56(g),before);assert.equal(g.journalSaved(),saved);old.click();assert.equal(g.state.preferences.scenery,'classic');g.el('fieldWorldCompare').click();assert.equal(g.state.preferences.scenery,'street');assert.equal(g.state.mode,'paused');g.phoneBack();assert.equal(g.state.mode,'paused');
});
test('Alpha 0.67 invalid, active, hidden and disconnected scenery controls cannot change preferences',()=>{
 const g=sceneryRun67(loadGame());g.selectFieldWorld('classic');assert.equal(g.state.preferences.scenery,'street');g.pause();g.selectFieldWorld('invalid');assert.equal(g.state.preferences.scenery,'street');g.document.hidden=true;g.selectFieldWorld('classic');assert.equal(g.state.preferences.scenery,'street');g.document.hidden=false;g.showSettings();const old=g.el('fieldWorldStyle');g.el('pref-numbers').click();old.value='classic';old.dispatch('change');assert.equal(g.state.preferences.scenery,'street');
});
test('Alpha 0.67 changing scenery resets only active normal-run performance samples and leaves same-style samples intact',()=>{
 const g=loadGame();g.showSettings();g.el('perfToggle').click();g.el('settingsBack').click();sceneryRun67(g);g.frame(16);g.frame(32);g.frame(48);g.pause();assert.ok(g.performanceSnapshot().frames>0);const frames=g.performanceSnapshot().frames,time=g.state.elapsed;g.selectFieldWorld('street');assert.equal(g.performanceSnapshot().frames,frames);g.selectFieldWorld('classic');assert.equal(g.performanceSnapshot().frames,0);near(g.state.elapsed,time);assert.equal(g.state.mode,'paused');assert.equal(g.state.diagnostics.enabled,true);
});
test('Alpha 0.67 held phone reports capture actual scenery and do not follow later preference changes',()=>{
 const g=sceneryRun67(loadGame());g.pause();g.showSettings();g.showBenchmark();const text=g.benchmarkText(),capture=g.state.benchmarkCapture;assert.match(text,/Scenery at capture: Street materials/);assert.equal(capture.scenery,'Street materials');g.state.preferences.scenery='classic';g.state.preferences.reduced=true;assert.equal(g.benchmarkText(),text);assert.equal(g.state.benchmarkCapture,capture);
});
test('Alpha 0.67 ended-run settings apply scenery to the next run without repainting held stats or records',()=>{
 const g=sceneryRun67(loadGame());g.render();g.setup({elapsed:181});g.pause();quitForTest(g);const result=g.state.runResult,saved=g.journalSaved(),record=g.saved(),draws=g.drawCount();assert.equal(g.worldCacheState().tiles.length,0);g.el('endSettings').click();g.selectFieldWorld('classic');g.frame(90000);assert.equal(g.drawCount(),draws);assert.equal(g.state.runResult,result);assert.equal(g.journalSaved(),saved);assert.equal(g.saved(),record);g.showBenchmark();assert.match(g.benchmarkText(),/Held results · next-run setting: Classic ground/);g.phoneBack();g.phoneBack();assert.equal(g.state.mode,'end');assert.equal(g.state.runResult,result);g.advanceClock(500);g.el('again').click();assert.equal(g.state.mode,'play');assert.equal(g.fieldWorldActive(),false);
});
test('Alpha 0.67 training, developer drills and art/camera studies retain their own scenery and image budgets',()=>{
 const a=loadGame();a.startTraining('pierce');assert.equal(a.fieldWorldActive(),false);a.render();assert.equal(a.worldCacheState().tiles.length,0);assert.equal(a.pendingImages.length,0);const b=loadGame();enterHunter66(b);assert.equal(b.fieldWorldActive(),false);assert.equal(b.pendingImages.length,6);const c=loadGame();enterStreet(c);assert.equal(c.fieldWorldActive(),false);assert.equal(c.pendingImages.length,12);assert.equal(c.worldCacheState().tiles.length,0);
});
test('Alpha 0.67 future or unavailable preference storage allows session scenery comparison without overwriting data',()=>{
 const future=JSON.stringify({version:99,custom:'keep'});for(const options of [{preferencesStored:future},{storageBlocked:true},{writeBlocked:true}]){const g=loadGame(options),saved=g.preferencesSaved(),journal=g.journalSaved();g.showSettings();g.selectFieldWorld('classic');assert.equal(g.state.preferences.scenery,'classic');assert.equal(g.preferencesSaved(),saved);assert.equal(g.journalSaved(),journal);assert.equal(g.state.preferences.available,false);}
});
test('Alpha 0.67 route change, new run and Main release the previous numeric plan without retaining old world objects',()=>{
 const g=sceneryRun67(loadGame());g.render();const first=g.worldCacheState();g.pause();quitForTest(g);assert.equal(g.worldCacheState().tiles.length,0);g.el('resultMenu').click();assert.equal(g.worldCacheState().tiles.length,0);g.flushHistory();sceneryRun67(g,'park');g.render();assert.notEqual(g.worldCacheState(),first);assert.match(g.worldCacheState().key,/^park\|/);g.pause();g.el('fieldWorldCompare').click();assert.equal(g.worldCacheState().tiles.length,0);
});
test('Alpha 0.67 native boss warning commands remain exact and draw after all decorative world lights',()=>{
 for(const kind of ['breaker','warden','harvester']){const g=sceneryRun67(loadGame({traceCanvas:true}));g.setup({obstacles:[{x:70,y:-20,w:110,h:70,type:0}]});g.spawnBoss(kind);const e=g.state.activeBoss;Object.assign(e,{x:80,y:90,phase:'warn',chargeX:1,chargeY:0,chargeLength:400,aimAngle:0,pulseX:80,pulseY:90});g.clearTrace();g.renderBossWarning();const expected=g.drawingTrace().map(r=>JSON.stringify(r));g.clearTrace();g.render();const trace=g.drawingTrace(),strings=trace.map(r=>r[0]==='drawImage'?'image':JSON.stringify(r));const index=strings.findIndex((r,i)=>r===expected[0]&&expected.every((v,j)=>strings[i+j]===v));assert.ok(index>=0,kind+' warning unchanged');const glow=trace.findLastIndex(r=>r[0]==='set'&&r[1]==='fillStyle'&&r[2]?.radial?.[5]===42);assert.ok(glow>=0&&glow<index,kind+' terrain light stays underneath');}
});
test('Alpha 0.67 menu benchmark labels scenery as a next-run setting rather than claiming a rendered street',()=>{
 const g=loadGame();g.showSettings();g.showBenchmark();assert.match(g.benchmarkText(),/Scenery at capture: Menus · next-run setting: Street materials/);
});

// Alpha 0.68: native hit/volley observers own bounded presentation, never damage.
function combatEnemy68(g,extra={}){const e=enemy({x:90,y:0,hp:100,max:100,speed:0,...extra});g.setup({enemies:[e],nextBossAt:Infinity});g.fieldActorInfo(e,'shambler');return e}
test('Alpha 0.68 actual multishot volleys record one visual shot, with no fake shot from an empty or disabled gun',()=>{
 const g=loadGame();cleanRun(g);const e=combatEnemy68(g);g.p.proj=5;g.p.fireClock=0;g.update(.02);assert.equal(g.state.bullets.length,5);assert.ok(g.fieldState().combat.shot);near(g.fieldState().combat.shot.at,g.state.elapsed);const shot=g.fieldState().combat.shot;g.p.fireClock=100;g.update(.02);assert.equal(g.fieldState().combat.shot,shot);const h=loadGame();enterHunter66(h);h.update(.02);assert.equal(h.fieldState().combat.shot,null);h.pause();h.el('bossTestAttacks').click();h.resume();h.update(.02);assert.ok(h.fieldState().combat.shot);const empty=loadGame();cleanRun(empty);empty.p.fireClock=0;empty.update(.02);assert.equal(empty.fieldState().combat.shot,null);
});
test('Alpha 0.68 muzzle flash uses the accepted eight-direction gun tips while feet and native aim state stay fixed',()=>{
 const g=loadGame({traceCanvas:true});cleanRun(g);const a=JSON.parse(sampleAssetText).survivorAim;for(let direction=0;direction<8;direction++){const angle=direction*Math.PI/4,target={x:Math.cos(angle)*100,y:Math.sin(angle)*100};g.noteFieldShot(target);g.setup({elapsed:g.state.elapsed+.03});const shot=g.fieldShotVisual();assert.equal(shot.row,[0,3,4,3,0,1,2,1][direction]);assert.equal(shot.flip,[1,1,1,-1,-1,-1,1,1][direction]);const info=g.fieldActorInfo(g.p,'survivor'),aim=JSON.stringify(info.motion.aim),world=fieldWorld56(g);g.clearTrace();g.drawFieldActor(g.el('game').getContext('2d'),g.p,'survivor');const scale=32/a.referenceHeights[shot.row],tip=a.muzzles[shot.row],pivot=a.pivots[shot.row],trace=g.drawingTrace();assert.ok(trace.some(r=>r[0]==='translate'&&Math.abs(r[1]-((tip[0]-pivot[0])*scale*shot.flip-shot.dx*shot.recoil))<1e-8&&Math.abs(r[2]-(-22+1.5+(tip[1]-pivot[1])*scale-shot.dy*shot.recoil))<1e-8));assert.ok(trace.some(r=>r.includes('#ffe7a7')));assert.equal(JSON.stringify(info.motion.aim),aim);assert.deepEqual(fieldWorld56(g),world);}
});
test('Alpha 0.68 shot recoil and flash are short, bounded and follow simulation time rather than redraws',()=>{
 const g=loadGame();cleanRun(g);g.noteFieldShot({x:100,y:0});assert.equal(g.fieldShotVisual().flash,true);g.setup({elapsed:.06});near(g.fieldShotVisual().recoil,.75);assert.equal(g.fieldShotVisual().flash,false);for(let i=0;i<20;i++)g.render();near(g.fieldShotVisual().recoil,.75);g.setup({elapsed:.13});g.advanceFieldCombat();assert.equal(g.fieldState().combat.shot,null);assert.equal(g.fieldShotVisual().active,false);
});
test('Alpha 0.68 actual damage creates restrained body feedback without changing HP loss or movement',()=>{
 const g=loadGame();cleanRun(g);const e=combatEnemy68(g),p=JSON.stringify(g.p),speed=e.speed;g.hitEnemy(e,18);near(e.hp,82);assert.equal(g.fieldState().combat.hits.length,1);assert.equal(g.fieldState().combat.defeats.length,0);g.setup({elapsed:.09});assert.ok(Math.abs(g.fieldReaction(e,'shambler'))<=.04);assert.ok(Math.abs(g.fieldReaction(e,'shambler'))>0);assert.equal(e.speed,speed);assert.equal(e.x,90);assert.equal(e.y,0);assert.equal(JSON.stringify(g.p),p);g.setup({elapsed:.19});near(g.fieldReaction(e,'shambler'),0);
});
test('Alpha 0.68 throttling limits visuals, never repeated gun or burn damage and never lethal credit',()=>{
 const g=loadGame();cleanRun(g);const e=combatEnemy68(g,{hp:20,max:20});g.hitEnemy(e,5,'FIRE');g.hitEnemy(e,5,'FIRE');g.hitEnemy(e,5,'FIRE');near(e.hp,5);assert.equal(g.fieldState().combat.hits.length,1);g.hitEnemy(e,5,'FIRE');assert.equal(g.fieldState().combat.defeats.length,1);assert.equal(g.state.killCount,1);assert.equal(g.state.burnKills,1);assert.equal(g.state.gems.length,1);g.hitEnemy(e,99);assert.equal(g.fieldState().combat.defeats.length,1);assert.equal(g.state.killCount,1);
});
test('Alpha 0.68 invalid damage and blocked Riot gunfire cannot invent a hurt or defeat response',()=>{
 const g=loadGame();cleanRun(g);const e=combatEnemy68(g);for(const d of [0,-1,NaN,Infinity])g.hitEnemy(e,d);assert.equal(g.fieldState().combat.hits.length,0);const r=riot({x:100,hp:1000,max:1000});g.setup({enemies:[r],bullets:[{x:0,y:0,vx:600,vy:0,r:4,life:1,dmg:20,remainingHits:8,rail:true,hitEnemies:new Set()}]});g.prepareFieldRiot();g.updateProjectiles(.3);near(r.hp,1000);assert.equal(g.fieldState().combat.hits.length,0);assert.equal(g.fieldState().combat.defeats.length,0);g.hitEnemy(r,20,'LIGHTNING');near(r.hp,980);assert.equal(g.fieldState().combat.hits[0].color,'#a5edff');
});
test('Alpha 0.68 defeat snapshots contain no image or enemy references and kills reward immediately',()=>{
 const g=loadGame();cleanRun(g);const e=combatEnemy68(g,{hp:1,max:1});const serial=g.fieldState().serial;g.hitEnemy(e,18);assert.ok(e.hp<=0);assert.equal(g.state.killCount,1);assert.equal(g.state.gems.length,1);assert.equal(g.state.enemyTally.shambler,1);const body=g.fieldState().combat.defeats[0];assert.deepEqual(Object.keys(body).sort(),['at','duration','fall','flip','kind','pose','r','x','y']);assert.deepEqual(Object.keys(body.pose).sort(),['asset','frame']);assert.equal(g.fieldState().serial,serial);assert.equal(g.fieldState().combat.dead.has(e),true);assert.doesNotMatch(JSON.stringify(body),/"image"|"enemy"|"hp"|"max"/);
});
test('Alpha 0.68 hidden dead live sprites are replaced by one brief non-colliding defeat picture',()=>{
 const g=loadGame({traceCanvas:true});cleanRun(g);const e=combatEnemy68(g,{hp:1,max:1});g.hitEnemy(e,99);g.clearTrace();g.renderEnemy(e);assert.equal(g.drawingTrace().filter(r=>r[0]==='drawImage').length,0);g.renderFieldDefeats();assert.equal(g.drawingTrace().filter(r=>r[0]==='drawImage').length,1);assert.ok(g.drawingTrace().some(r=>r[0]==='scale'));const ledger=JSON.stringify(g.state.weaponLedger);g.renderFieldDefeats();assert.equal(JSON.stringify(g.state.weaponLedger),ledger);
});
test('Alpha 0.68 impacts and defeats are capped, culled and expired without growing a map or adding images',()=>{
 const g=loadGame({traceCanvas:true});cleanRun(g);const images=g.pendingImages.length;for(let i=0;i<90;i++){const e=enemy({x:20+i%10,y:i%5,hp:1});g.hitEnemy(e,18)}assert.equal(g.fieldState().combat.hits.length,24);assert.equal(g.fieldState().combat.defeats.length,12);assert.equal(g.pendingImages.length,images);const count=g.fieldState().combat.hits.length;g.hitEnemy(enemy({x:9999,hp:1}),18);assert.equal(g.fieldState().combat.hits.length,count);g.p.x=10000;g.clearTrace();g.renderFieldDefeats();g.renderFieldImpacts();assert.equal(g.drawingTrace().length,0);g.setup({elapsed:.6});g.advanceFieldCombat();assert.equal(g.fieldState().combat.hits.length,0);assert.equal(g.fieldState().combat.defeats.length,0);
});
test('Alpha 0.68 optional sprite groups hold only through their bounded defeat fade then release',()=>{
 const g=loadGame();cleanRun(g);const e=spitter62(g);g.hitEnemy(e,99999);const image=g.fieldState().spitter.row.image;g.setup({enemies:[]});g.prepareFieldSpitter();assert.equal(g.fieldState().spitter.row.image,image);assert.equal(g.fieldDefeatWanted('spitter'),true);g.setup({elapsed:.5});g.advanceFieldActors(.02);assert.equal(g.fieldState().spitter.status,'idle');assert.equal(g.fieldState().combat.defeats.length,0);assert.equal(image.onload,null);assert.equal(image.onerror,null);
});
test('Alpha 0.68 corpse retention never loads overlapping exclusive boss groups',()=>{
 const g=loadGame();cleanRun(g);const e=breaker57(g);g.hitEnemy(e,99999);assert.equal(g.fieldDefeatWanted('breaker'),true);g.spawnBoss('warden');g.advanceFieldActors(.02);assert.equal(g.fieldDefeatWanted('breaker'),false);assert.equal(g.fieldState().breaker.status,'idle');assert.equal(g.fieldState().warden.status,'ready');assert.equal(g.fieldHowlerBudget(JSON.parse(sampleAssetText)),true);
});
test('Alpha 0.68 Classic, Reduced Effects and missing art keep native feedback and skip the new state',()=>{
 for(const options of [{preferencesStored:JSON.stringify({version:1,actors:'classic'})},{preferencesStored:JSON.stringify({version:1,reduced:true})},{artworkStatus:'error'}]){const g=loadGame(options);cleanRun(g);const e=enemy({x:90,hp:1});g.setup({enemies:[e]});g.noteFieldShot(e);g.hitEnemy(e,18);assert.equal(g.fieldState().combat.shot,null);assert.equal(g.fieldState().combat.hits.length,0);assert.equal(g.fieldState().combat.defeats.length,0);assert.equal(g.state.killCount,1);assert.equal(g.state.gems.length,1);}
});
test('Alpha 0.68 paused, background and upgrade time freeze feedback, while style/new run/end reset it',()=>{
 const g=loadGame();cleanRun(g);const e=combatEnemy68(g);g.hitEnemy(e,1);g.noteFieldShot(e);g.pause();const state=JSON.stringify({h:g.fieldState().combat.hits,s:g.fieldState().combat.shot}),time=g.state.elapsed;g.frame(50000);assert.equal(JSON.stringify({h:g.fieldState().combat.hits,s:g.fieldState().combat.shot}),state);near(g.state.elapsed,time);g.document.hidden=true;g.event('visibilitychange');g.document.hidden=false;g.event('visibilitychange');assert.equal(g.state.mode,'paused');g.selectFieldActors('classic');assert.equal(g.fieldState().combat.hits.length,0);assert.equal(g.fieldState().combat.shot,null);g.selectFieldActors('field');g.resume();const f=combatEnemy68(g);g.hitEnemy(f,1);g.setup({xp:g.state.nextXp});g.checkLevelUp();assert.equal(g.state.mode,'upgrade');const at=g.state.elapsed;g.frame(60000);near(g.state.elapsed,at);g.choose(0);g.pause();quitForTest(g);assert.equal(g.fieldState().combat.defeats.length,0);assert.equal(g.fieldState().combat.hits.length,0);
});
test('Alpha 0.68 Field feedback preserves seeded damage, drops, later draws and records against Classic and Reduced',()=>{
 const worlds=[];for(const options of [{actors:'field'},{actors:'classic'},{actors:'field',reduced:true},{actors:'classic',reduced:true}]){const g=loadGame({seed:123,preferencesStored:JSON.stringify({version:1,...options})});cleanRun(g);Object.assign(g.p,{arc:3,blades:3,molotov:3,fireClock:0});const targets=Array.from({length:25},(_,i)=>enemy({x:60+(i%5)*30,y:-60+Math.floor(i/5)*30,hp:55,max:55}));g.setup({enemies:targets});for(let i=0;i<70;i++){g.update(.02);g.render()}worlds.push({world:fieldWorld56(g),choices:JSON.parse(JSON.stringify(g.upgradeChoices())),saved:g.journalSaved()});}assert.deepEqual(worlds[0],worlds[1]);assert.deepEqual(worlds[2],worlds[3]);
});
test('Alpha 0.68 training target defeat feedback remains unscored and does not survive held results or retry',()=>{
 const g=loadGame({stored:'900'}),saved=g.journalSaved(),prefs=g.preferencesSaved(),e=enterHunter66(g);g.hitEnemy(e,99999);assert.equal(g.fieldState().combat.defeats.length,1);assert.equal(g.practiceSnapshot().targets,1);assert.equal(g.state.killCount,0);assert.equal(g.state.gems.length,0);g.pause();quitForTest(g);const result=g.state.runResult;assert.equal(g.fieldState().combat.defeats.length,0);g.frame(99999);assert.equal(g.state.runResult,result);g.advanceClock(500);g.el('again').click();assert.equal(g.fieldState().combat.defeats.length,0);assert.equal(g.saved(),'900');assert.equal(g.journalSaved(),saved);assert.equal(g.preferencesSaved(),prefs);
});
test('Alpha 0.68 no new raster/image/preferences are introduced and original prototype stays isolated',()=>{
 const g=loadGame();enterStreet(g);assert.equal(g.fieldState().combat.hits.length,0);assert.equal(g.fieldState().combat.defeats.length,0);assert.equal(g.pendingImages.length,12);assert.equal(Object.keys(JSON.parse(sampleAssetText)).length,20);assert.ok(Buffer.byteLength(html)<12*1024*1024);assert.doesNotMatch(source,/globalThis\.api/);
});

// Alpha 0.69: material drawing for existing interactive objects; native rules remain.
function propsRun69(options={}){const g=loadGame({traceCanvas:true,...options});cleanRun(g);return g}
function propsBoard69(g){g.setup({barrels:[{x:45,y:20,r:17}],shockDrums:[{x:-50,y:20,r:17,spent:false}],supplyCache:{x:75,y:-70,r:20},supplyDrop:{x:-75,y:-70,r:21,phase:'ready'},salvage:{x:0,y:100,r:80,progress:3},locker:{x:90,y:100,r:20},barricades:[{x:-70,y:180,w:130,h:20,hp:30,max:90}]})}
function propsDraw69(g){g.renderFuel(-206,-457.5);g.renderShockDrums();g.renderSupplies();g.renderDrop();g.renderSalvage();g.renderLocker();g.renderBarricades(-206,-457.5)}
function propSnapshot69(g){const s=g.state;return JSON.stringify({world:fieldWorld56(g),shock:s.shockDrums,cache:s.supplyCache,drop:s.supplyDrop,salvage:s.salvage,locker:s.locker,prefs:g.preferencesSaved(),saved:g.saved(),journal:g.journalSaved()})}
test('Alpha 0.69 Street scenery independently selects object materials while Classic keeps native fallback',()=>{
 for(const actors of ['field','classic'])for(const scenery of ['street','classic']){const g=propsRun69({preferencesStored:JSON.stringify({version:1,actors,scenery})});g.clearTrace();assert.equal(g.drawFieldDrum({x:0,y:0}),scenery==='street');assert.equal(g.drawFieldBarricade({x:0,y:0,w:100,h:20,hp:90,max:90}),scenery==='street');assert.equal(g.drawFieldCase({x:0,y:0},'medical'),scenery==='street');assert.equal(g.drawingTrace().length>0,scenery==='street');}
});
test('Alpha 0.69 object rendering leaves native objects, player, rewards, time, preferences and records untouched',()=>{
 const g=propsRun69();propsBoard69(g);const before=propSnapshot69(g),images=g.pendingImages.length;for(let i=0;i<20;i++)propsDraw69(g);assert.equal(propSnapshot69(g),before);assert.equal(g.pendingImages.length,images);const t=g.drawingTrace();assert.equal(t.filter(r=>r[0]==='save').length,t.filter(r=>r[0]==='restore').length);
});
test('Alpha 0.69 orange fuel and teal shock retain native symbols, radius rings and proximity hints',()=>{
 const g=propsRun69();propsBoard69(g);g.clearTrace();g.renderFuel(-206,-457.5);g.renderShockDrums();const t=g.drawingTrace();for(const label of ['!','ϟ','DASH','DASH · STUN'])assert.ok(t.some(r=>r[0]==='fillText'&&r[1]===label),label);assert.ok(t.some(r=>r[0]==='arc'&&r[1]===45&&r[2]===20&&r[3]===g.fuelRadius()));assert.ok(t.some(r=>r[0]==='arc'&&r[1]===-50&&r[2]===20&&r[3]===150));assert.ok(t.some(r=>r.includes('#f0a550')||r[2]?.stops?.some(v=>v[1]==='#f0a550')));assert.ok(t.some(r=>r.includes('#277f88')||r[2]?.stops?.some(v=>v[1]==='#277f88')));
});
test('Alpha 0.69 medical case preserves the white cross and exact twenty HP label and pulse',()=>{
 const g=propsRun69();propsBoard69(g);g.clearTrace();g.renderSupplies();const t=g.drawingTrace();for(const rect of [[-3,-10,6,20],[-10,-3,20,6]])assert.ok(t.some(r=>r[0]==='fillRect'&&JSON.stringify(r.slice(1))===JSON.stringify(rect)));assert.ok(t.some(r=>r[0]==='fillText'&&r[1]==='MED +20 HP'&&r[2]===75&&r[3]===-108));assert.ok(t.some(r=>r[0]==='arc'&&r[3]===30));
});
test('Alpha 0.69 signalled XP drop remains only a landing marker until ready',()=>{
 const g=propsRun69();g.setup({supplyDrop:{x:70,y:20,r:21,phase:'signal',readyAt:3}});g.clearTrace();g.renderDrop();assert.ok(g.drawingTrace().some(r=>r[0]==='fillText'&&r[1]==='SUPPLY IN 3s'));assert.equal(g.drawingTrace().some(r=>r[0]==='set'&&r[2]?.linear),false);assert.equal(g.drawingTrace().some(r=>r[0]==='fillText'&&r[1]==='XP SWEEP • DASH'),false);g.state.supplyDrop.phase='ready';g.clearTrace();g.renderDrop();assert.ok(g.drawingTrace().some(r=>r[0]==='set'&&r[2]?.linear));assert.ok(g.drawingTrace().some(r=>r[0]==='fillText'&&r[1]==='XP SWEEP • DASH'));
});
test('Alpha 0.69 salvage material retains native six second progress arc, status and free upgrade label',()=>{
 const g=propsRun69();propsBoard69(g);g.clearTrace();g.renderSalvage();const t=g.drawingTrace();assert.ok(t.some(r=>r[0]==='arc'&&r[1]===0&&r[2]===100&&r[3]===80&&r[4]===-Math.PI/2&&Math.abs(r[5]-Math.PI/2)<1e-10));assert.ok(t.some(r=>r[0]==='fillText'&&r[1]==='SALVAGE · FREE UPGRADE'));assert.ok(t.some(r=>r[0]==='fillText'&&r[1]==='ENTER GOLD CIRCLE'));assert.equal(g.state.salvage.progress,3);
});
test('Alpha 0.69 mint locker draws double doors with its existing field label and releases on null',()=>{
 const g=propsRun69();propsBoard69(g);g.clearTrace();g.renderLocker();assert.ok(g.drawingTrace().some(r=>r[0]==='translate'&&r[1]===90&&r[2]===100));assert.ok(g.drawingTrace().some(r=>r[0]==='fillText'&&r[1]==='FIELD LOCKER'));g.setup({locker:null});g.clearTrace();g.renderLocker();assert.equal(g.drawingTrace().length,0);
});
test('Alpha 0.69 wood art follows exact horizontal and vertical centers and adds damage without changing HP',()=>{
 const g=propsRun69();for(const b of [{x:30,y:20,w:130,h:20,hp:90,max:90},{x:30,y:20,w:20,h:130,hp:30,max:90}]){const before=JSON.stringify(b);g.clearTrace();g.drawFieldBarricade(b);const t=g.drawingTrace();assert.ok(t.some(r=>r[0]==='translate'&&r[1]===b.x+b.w/2&&r[2]===b.y+b.h/2));assert.equal(t.some(r=>r[0]==='rotate'),b.h>b.w);assert.equal(t.some(r=>r.includes('#30271f')),b.hp/b.max<.7);assert.equal(JSON.stringify(b),before);}propsBoard69(g);g.clearTrace();g.renderBarricades(-206,-457.5);assert.ok(g.drawingTrace().some(r=>r[0]==='fillRect'&&r[3]===16&&r[4]===4));assert.ok(g.drawingTrace().some(r=>r[0]==='fillText'&&r[1]==='DASH TO BREAK'));
});
test('Alpha 0.69 Reduced Effects omits gradients and fine wear while retaining every interaction label',()=>{
 const rows=[];for(const reduced of [false,true]){const g=propsRun69({preferencesStored:JSON.stringify({version:1,reduced})});propsBoard69(g);g.clearTrace();propsDraw69(g);const t=g.drawingTrace();rows.push(t);assert.equal(t.some(r=>r[0]==='set'&&r[2]?.linear),!reduced);assert.equal(t.some(r=>r.includes('#ffdeb866')),!reduced);assert.equal(t.some(r=>r.includes('#4b382b99')),!reduced);}const labels=t=>t.filter(r=>r[0]==='fillText').map(r=>r.slice(1));assert.deepEqual(labels(rows[0]),labels(rows[1]));assert.ok(rows[1].length<rows[0].length);
});
test('Alpha 0.69 offscreen prop bodies are culled without allocating images or mutating objects',()=>{
 const g=propsRun69(),images=g.pendingImages.length,far={x:99999,y:99999,w:120,h:20,hp:90,max:90},before=JSON.stringify(far);g.clearTrace();assert.equal(g.fieldPropVisible(far),false);assert.equal(g.drawFieldDrum(far),true);assert.equal(g.drawFieldBarricade(far),true);assert.equal(g.drawFieldCase(far,'medical'),true);assert.equal(g.drawingTrace().length,0);assert.equal(g.pendingImages.length,images);assert.equal(JSON.stringify(far),before);
});
test('Alpha 0.69 Street versus Classic object draws preserve native seeded combat and later upgrade choices',()=>{
 for(const route of ['downtown','freight','riverside','park','market']){const worlds=[];for(const scenery of ['street','classic']){const g=sceneryRun67(loadGame({seed:123,preferencesStored:JSON.stringify({version:1,scenery})}),route);propsBoard69(g);g.setup({enemies:[enemy({x:60,y:0,hp:80,max:80})]});for(let i=0;i<40;i++){g.update(.02);propsDraw69(g)}worlds.push({world:propSnapshot69(g),choices:JSON.parse(JSON.stringify(g.upgradeChoices()))});}const strip=x=>{const v=JSON.parse(x.world);delete v.prefs;return {...x,world:JSON.stringify(v)}};assert.deepEqual(strip(worlds[0]),strip(worlds[1]),route);}
});
test('Alpha 0.69 developer, training and original camera scenes skip new object bodies and keep original image counts',()=>{
 const a=loadGame({traceCanvas:true});a.startTraining('pierce');a.clearTrace();assert.equal(a.drawFieldDrum({x:0,y:0}),false);assert.equal(a.drawingTrace().length,0);const b=loadGame({traceCanvas:true});enterHunter66(b);b.clearTrace();assert.equal(b.drawFieldCase({x:0,y:0},'medical'),false);assert.equal(b.drawingTrace().length,0);const c=loadGame({traceCanvas:true});enterStreet(c);c.clearTrace();assert.equal(c.drawFieldBarricade({x:0,y:0,w:100,h:20,hp:90,max:90}),false);assert.equal(c.drawingTrace().length,0);assert.equal(c.pendingImages.length,12);assert.equal(Object.keys(JSON.parse(sampleAssetText)).length,20);assert.ok(Buffer.byteLength(html)<12*1024*1024);
});

// Alpha 0.70: retain native geometry, lift only thin warning/goal edges above effects.
function cueRun70(options={}){return propsRun69({preferencesStored:JSON.stringify({version:1,shake:false}),...options})}
function cuePaints70(trace){let state={},stack=[],path=[],out=[];for(const r of trace){if(r[0]==='set')state[r[1]]=r[2];else if(r[0]==='save')stack.push({...state,dash:state.dash?.slice()});else if(r[0]==='restore')state=stack.pop()||{};else if(r[0]==='setLineDash')state.dash=Array.from(r[1]);else if(r[0]==='beginPath')path=[];else if(['moveTo','lineTo','arc','closePath'].includes(r[0]))path.push(r.slice());else if(r[0]==='stroke'||r[0]==='fill')out.push({op:r[0],color:state[r[0]==='stroke'?'strokeStyle':'fillStyle'],width:state.lineWidth,dash:state.dash||[],path:path.map(x=>x.slice())})}return out}
function cueTrace70(g){g.clearTrace();g.renderFieldReadability();return JSON.parse(JSON.stringify(g.drawingTrace()))}
function cueEdges70(trace){return cuePaints70(trace).filter(x=>x.op==='stroke'&&x.color!=='#071018')}
test('Alpha 0.70 normal Street cues are independent of actor art and Classic scenery keeps previous warning drawing',()=>{
 for(const actors of ['field','classic'])for(const scenery of ['street','classic']){const g=cueRun70({preferencesStored:JSON.stringify({version:1,actors,scenery})});assert.equal(g.fieldReadabilityActive(),scenery==='street');g.spawnBoss('breaker');Object.assign(g.state.activeBoss,{x:10,y:20,phase:'warn',chargeX:1,chargeY:0,chargeLength:300});const trace=cueTrace70(g);assert.equal(trace.some(r=>r.includes('#071018')),scenery==='street');}
});
test('Alpha 0.70 all three boss foreground paths, widths, colors and dashes match their native warnings',()=>{
 for(const kind of ['breaker','warden','harvester']){const g=cueRun70();g.spawnBoss(kind);Object.assign(g.state.activeBoss,{x:40,y:-20,phase:'warn',chargeX:.6,chargeY:.8,chargeLength:300,aimAngle:.4,pulseX:30,pulseY:40});g.clearTrace();g.renderBossWarning();const old=cuePaints70(g.drawingTrace()).filter(x=>x.op==='stroke'&&['#b7ffd0','#9edaff','#ffd394'].includes(x.color));const edges=cueEdges70(cueTrace70(g));assert.deepEqual(edges,old,kind);assert.equal(edges.length,kind==='warden'?5:1);g.state.activeBoss.phase='recover';assert.equal(cueEdges70(cueTrace70(g)).length,0);}
});
test('Alpha 0.70 Spitter line stays locked to native aim and disappears outside living aim phase',()=>{
 const g=cueRun70(),e=spitter({x:35,y:20,phase:'aim',aimX:.6,aimY:.8});g.setup({enemies:[e]});g.clearTrace();g.renderSpitterWarnings();const expected=cuePaints70(g.drawingTrace()).filter(x=>x.op==='stroke');assert.deepEqual(cueEdges70(cueTrace70(g)),expected);g.p.x=100;assert.deepEqual(cueEdges70(cueTrace70(g)),expected);e.phase='recover';assert.equal(cueEdges70(cueTrace70(g)).length,0);e.phase='aim';e.hp=0;assert.equal(cueEdges70(cueTrace70(g)).length,0);
});
test('Alpha 0.70 Guard bash cue follows its native facing/distance and respects stun and death',()=>{
 const g=cueRun70(),e=riot({x:20,y:10,phase:'warn',facing:.5});g.setup({enemies:[e]});g.clearTrace();g.renderRiot(e);const expected=cuePaints70(g.drawingTrace()).filter(x=>x.op==='stroke'&&x.color==='#ffe3ad');assert.deepEqual(cueEdges70(cueTrace70(g)),expected);e.salvageStunUntil=10;assert.equal(cueEdges70(cueTrace70(g)).length,0);e.salvageStunUntil=0;e.hp=0;assert.equal(cueEdges70(cueTrace70(g)).length,0);
});
test('Alpha 0.70 Howler windup uses exact native radius and progress while recovery adds no persistent ring',()=>{
 const g=cueRun70(),e=howler({x:20,y:10,phase:'howl',phaseTime:.6});g.setup({enemies:[e]});g.clearTrace();g.renderHowlerWarnings();const old=cuePaints70(g.drawingTrace()).filter(x=>x.op==='stroke');assert.deepEqual(cueEdges70(cueTrace70(g)),old);e.phase='recover';e.pulseUntil=1;assert.equal(cueEdges70(cueTrace70(g)).length,0);e.phase='howl';e.hp=0;assert.equal(cueEdges70(cueTrace70(g)).length,0);
});
test('Alpha 0.70 released Lobber warning persists independently of its caster and retains exact fuse progress',()=>{
 const g=cueRun70();g.setup({enemies:[],lobberBombs:[{x:25,y:40,r:52,remaining:.7}]});g.clearTrace();g.renderLobberBombs();const expected=cuePaints70(g.drawingTrace()).filter(x=>x.op==='stroke');assert.deepEqual(cueEdges70(cueTrace70(g)),expected);g.state.lobberBombs[0].remaining=.35;const edges=cueEdges70(cueTrace70(g));near(edges[1].path[0][3],39);g.setup({lobberBombs:[]});assert.equal(cueEdges70(cueTrace70(g)).length,0);
});
test('Alpha 0.70 salvage and extraction outlines retain native goal geometry and hold progress',()=>{
 const g=cueRun70();g.setup({salvage:{x:0,y:50,r:80,progress:3}});g.clearTrace();g.renderSalvage();const expected=cuePaints70(g.drawingTrace()).filter(x=>x.op==='stroke'&&['#b79550','#ffe09a'].includes(x.color));assert.deepEqual(cueEdges70(cueTrace70(g)),expected);g.setup({salvage:null,elapsed:.4,exitBeacon:{x:30,y:60,r:44}});g.clearTrace();g.renderExtraction();const old=cuePaints70(g.drawingTrace()).filter(x=>x.op==='stroke');assert.deepEqual(cueEdges70(cueTrace70(g)),old);g.setup({exitBeacon:null});assert.equal(cueEdges70(cueTrace70(g)).length,0);
});
test('Alpha 0.70 offscreen circles and segments are culled while a crossing warning remains visible',()=>{
 const g=cueRun70();g.setup({lobberBombs:[{x:10000,y:10000,r:52,remaining:.7}],salvage:{x:10000,y:0,r:80,progress:3},enemies:[spitter({x:10000,y:0,phase:'aim',aimX:1,aimY:0})]});assert.equal(cueEdges70(cueTrace70(g)).length,0);g.setup({lobberBombs:[],salvage:null,enemies:[spitter({x:-260,y:0,phase:'aim',aimX:1,aimY:0})]});assert.equal(cueEdges70(cueTrace70(g)).length,1);
});
test('Alpha 0.70 dark outlines bracket each native colored path and never add a fill or shadow glow',()=>{
 const g=cueRun70();g.setup({lobberBombs:[{x:0,y:0,r:52,remaining:.7}],enemies:[spitter({x:0,y:0,phase:'aim',aimX:1,aimY:0})]});const trace=cueTrace70(g),paint=cuePaints70(trace);assert.equal(paint.length,6);for(let i=0;i<paint.length;i+=2){assert.equal(paint[i].color,'#071018');assert.deepEqual(paint[i].path,paint[i+1].path);assert.equal(paint[i].width,paint[i+1].width+3)}assert.equal(paint.some(x=>x.op==='fill'),false);assert.equal(trace.some(r=>r[0]==='set'&&r[1]==='shadowBlur'&&r[2]>0),false);assert.equal(trace.filter(r=>r[0]==='save').length,trace.filter(r=>r[0]==='restore').length);
});
test('Alpha 0.70 critical edges draw after actors, weapons and particles but before floating damage text',()=>{
 const g=cueRun70();g.setup({enemies:[spitter({x:30,y:0,phase:'aim',aimX:1,aimY:0})]});g.state.particles.push({x:10,y:10,r:2,life:.5,max:1,color:'#123456'});g.state.texts.push({x:10,y:10,life:.5,color:'#fff',t:'ORDER TEST'});g.clearTrace();g.render();const t=g.drawingTrace(),edge=t.findIndex(r=>r.includes('#071018')),actor=t.findLastIndex(r=>r[0]==='drawImage'),particle=t.findIndex(r=>r.includes('#123456')),text=t.findIndex(r=>r[0]==='fillText'&&r[1]==='ORDER TEST');assert.ok(edge>actor&&edge>particle&&edge<text);const main=source.slice(source.indexOf('function render(){'));assert.ok(main.indexOf('renderWeapons()')<main.indexOf('renderFieldReadability()'));
});
test('Alpha 0.70 Reduced Effects retains the same critical edges without extra animation or saved state',()=>{
 const traces=[];for(const reduced of [false,true]){const g=cueRun70({preferencesStored:JSON.stringify({version:1,reduced})});g.setup({enemies:[spitter({x:0,y:0,phase:'aim',aimX:1,aimY:0})],lobberBombs:[{x:0,y:40,r:52,remaining:.7}]});const before=propSnapshot69(g),images=g.pendingImages.length;traces.push(cueTrace70(g));for(let i=0;i<10;i++)g.renderFieldReadability();assert.equal(propSnapshot69(g),before);assert.equal(g.pendingImages.length,images);}assert.deepEqual(traces[0],traces[1]);
});
test('Alpha 0.70 Street XP batch keeps exact visible diamond coordinates and culls with native margins',()=>{
 const g=cueRun70(),points=[{x:20,y:30,r:5,value:1},{x:-60,y:-50,r:7,value:3},{x:10000,y:0,r:5,value:1}];g.setup({gems:points});const before=JSON.stringify(points);g.clearTrace();g.renderGems(-206,-457.5);const t=g.drawingTrace(),fills=cuePaints70(t).filter(x=>x.op==='fill');assert.equal(fills.length,1);assert.equal(fills[0].color,'#55f7d4');assert.equal(fills[0].path.filter(r=>r[0]==='moveTo').length,2);const path=fills[0].path.filter(r=>r[0]!=='closePath');assert.deepEqual(path,points.slice(0,2).flatMap(b=>[['moveTo',b.x,b.y-b.r],['lineTo',b.x+b.r*.7,b.y],['lineTo',b.x,b.y+b.r],['lineTo',b.x-b.r*.7,b.y]]));assert.equal(JSON.stringify(points),before);
});
test('Alpha 0.70 crowded XP uses a single fill/outline without per-gem glow, and empty batches do not paint',()=>{
 const g=cueRun70();g.setup({gems:Array.from({length:500},(_,i)=>({x:(i%25)*12-150,y:Math.floor(i/25)*12-120,r:5,value:1}))});g.clearTrace();g.renderGems(-206,-457.5);const t=g.drawingTrace(),paints=cuePaints70(t);assert.equal(paints.filter(x=>x.op==='fill').length,1);assert.equal(paints.filter(x=>x.op==='stroke').length,1);assert.equal(t.some(r=>r[0]==='set'&&r[1]==='shadowBlur'&&r[2]>0),false);g.setup({gems:[]});g.clearTrace();g.renderGems(-206,-457.5);assert.equal(cuePaints70(g.drawingTrace()).length,0);
});
test('Alpha 0.70 Classic XP retains native individual diamond fill/glow and no foreground cue pass',()=>{
 const g=cueRun70({preferencesStored:JSON.stringify({version:1,scenery:'classic'})});g.setup({gems:[{x:20,y:30,r:5,value:1}]});g.clearTrace();assert.equal(g.drawFieldGems(-206,-457.5),false);assert.equal(g.drawingTrace().length,0);g.renderGems(-206,-457.5);assert.ok(g.drawingTrace().some(r=>r[0]==='set'&&r[1]==='shadowBlur'&&r[2]===12));assert.equal(g.drawingTrace().some(r=>r.includes('#07151d')),false);assert.equal(cueTrace70(g).length,0);
});
test('Alpha 0.70 redraws and scenery comparisons preserve seeded combat, pickups, later choices and records',()=>{
 for(const reduced of [false,true]){const worlds=[];for(const scenery of ['street','classic']){const g=cueRun70({seed:123,preferencesStored:JSON.stringify({version:1,scenery,reduced,shake:false})});Object.assign(g.p,{arc:2,blades:2,molotov:2});g.setup({enemies:Array.from({length:12},(_,i)=>enemy({x:80+(i%4)*25,y:-50+Math.floor(i/4)*40,hp:55,max:55})),gems:[{x:5,y:0,r:5,value:1}]});for(let i=0;i<50;i++){g.update(.02);g.render()}const v=JSON.parse(propSnapshot69(g));delete v.prefs;worlds.push({world:v,choices:JSON.parse(JSON.stringify(g.upgradeChoices()))});}assert.deepEqual(worlds[0],worlds[1]);}
});
test('Alpha 0.70 pause, background and upgrades keep warning progress and XP fixed until native time resumes',()=>{
 const g=cueRun70();g.setup({lobberBombs:[{x:0,y:20,r:52,remaining:.7}],gems:[{x:40,y:0,r:5,value:1}]});g.pause();const before=propSnapshot69(g),edges=cueEdges70(cueTrace70(g));g.frame(50000);g.document.hidden=true;g.event('visibilitychange');g.document.hidden=false;g.event('visibilitychange');assert.equal(g.state.mode,'paused');assert.equal(propSnapshot69(g),before);assert.deepEqual(cueEdges70(cueTrace70(g)),edges);g.resume();g.setup({xp:g.state.nextXp});g.checkLevelUp();assert.equal(g.state.mode,'upgrade');const at=g.state.elapsed;g.frame(60000);near(g.state.elapsed,at);assert.deepEqual(cueEdges70(cueTrace70(g)),edges);
});
test('Alpha 0.70 safe Field developer drills show contrast, private Classic comparison and original previews stay intact',()=>{
 const g=loadGame({traceCanvas:true});enterHunter66(g);assert.equal(g.fieldReadabilityActive(),true);g.pause();g.selectFieldActors('classic');assert.equal(g.fieldReadabilityActive(),false);g.selectFieldActors('field');assert.equal(g.fieldReadabilityActive(),true);const a=loadGame();a.startTraining('pierce');assert.equal(a.fieldReadabilityActive(),false);const b=loadGame();enterStreet(b);assert.equal(b.fieldReadabilityActive(),false);assert.equal(b.pendingImages.length,12);assert.equal(Object.keys(JSON.parse(sampleAssetText)).length,20);assert.ok(Buffer.byteLength(html)<12*1024*1024);
});

// Alpha 0.71: low-contrast wet scenery uses world coordinates and native elapsed time.
function wetTrace71(g){g.clearTrace();g.drawFieldWorldGround(g.p.x-206,g.p.y-457.5);return JSON.parse(JSON.stringify(g.drawingTrace()))}
function rainTrace71(g,tiles=[{x:0,y:0,seed:123}],left=-206,top=-457.5){g.clearTrace();g.drawFieldRain(tiles,left,top);return JSON.parse(JSON.stringify(g.drawingTrace()))}
test('Alpha 0.71 all five Street routes add wet surfaces below actors with independent actor selection',()=>{
 for(const route of ['downtown','freight','riverside','park','market'])for(const actors of ['field','classic']){const g=sceneryRun67(loadGame({traceCanvas:true,preferencesStored:JSON.stringify({version:1,actors})}),route),t=wetTrace71(g);assert.ok(t.some(r=>r[0]==='bezierCurveTo'),route);assert.ok(t.some(r=>r[0]==='set'&&r[2]?.linear&&r[2].stops.some(v=>v[1]==='#0b1922b8')),route);assert.ok(t.some(r=>r.includes('#9abac221')),route);}
});
test('Alpha 0.71 Reduced Effects keeps previous quiet surfaces without new water gradients, ripples or rain',()=>{
 const g=sceneryRun67(loadGame({traceCanvas:true,preferencesStored:JSON.stringify({version:1,reduced:true})})),t=wetTrace71(g);assert.equal(t.some(r=>r[0]==='bezierCurveTo'),false);assert.equal(t.some(r=>r.includes('#9abac221')),false);assert.equal(t.some(r=>r[0]==='set'&&r[2]?.linear),false);assert.ok(t.some(r=>r.includes('#07141a55')));g.clearTrace();g.drawFieldWorldLight(0,0,'#c99862');assert.equal(g.drawingTrace().length,0);
});
test('Alpha 0.71 drizzle repeats at fixed native time and changes only when simulation time advances',()=>{
 const g=cueRun70(),first=rainTrace71(g);assert.deepEqual(rainTrace71(g),first);g.setup({elapsed:.04});assert.notDeepEqual(rainTrace71(g),first);const before=propSnapshot69(g);for(let i=0;i<20;i++)g.drawFieldRain([{x:0,y:0,seed:123}],-206,-457.5);assert.equal(propSnapshot69(g),before);
});
test('Alpha 0.71 rain coordinates stay world anchored when camera bounds or negative cells change',()=>{
 const g=cueRun70();g.setup({elapsed:8});for(const tile of [{x:0,y:0,seed:123},{x:-160,y:-160,seed:987}]){const first=rainTrace71(g,[tile],-206,-457.5),next=rainTrace71(g,[tile],-180,-400);assert.deepEqual(first,next);}assert.notDeepEqual(rainTrace71(g,[{x:0,y:0,seed:123}]),rainTrace71(g,[{x:160,y:0,seed:123}]));
});
test('Alpha 0.71 rain is one faint batched stroke with bounded native-cell work and no fill, glow or image',()=>{
 const g=cueRun70(),images=g.pendingImages.length,tiles=g.fieldWorldTiles(-206,-457.5),t=rainTrace71(g,tiles);assert.equal(t.filter(r=>r[0]==='stroke').length,1);assert.ok(t.filter(r=>r[0]==='moveTo').length<=tiles.length*2);assert.ok(tiles.length<=256);assert.equal(t.filter(r=>r[0]==='fill'||r[0]==='drawImage').length,0);assert.equal(g.pendingImages.length,images);const far=rainTrace71(g,[{x:10000,y:10000,seed:1}]);assert.equal(far.filter(r=>r[0]==='moveTo').length,0);g.state.preferences.reduced=true;assert.equal(rainTrace71(g).length,0);
});
test('Alpha 0.71 small elliptical ripples stay bounded, vary with elapsed and never mutate patch or player state',()=>{
 const g=cueRun70(),before=propSnapshot69(g),rows=[];for(const elapsed of [0,.2,10,99999]){g.setup({elapsed});g.clearTrace();g.drawFieldWetPatch(20,30,124,{accent:'#81bcc5'});const t=g.drawingTrace(),ring=t.find(r=>r[0]==='ellipse');assert.ok(ring[3]>=2&&ring[3]<=10);assert.ok(ring[4]>=1&&ring[4]<=3.5);const alpha=t.find(r=>r[0]==='set'&&r[1]==='globalAlpha')[2];assert.ok(alpha>=0&&alpha<=.6);assert.equal(t.filter(r=>r[0]==='bezierCurveTo').length,5);rows.push(JSON.stringify(ring));}assert.notEqual(rows[0],rows[1]);g.setup({elapsed:0});assert.equal(propSnapshot69(g),before);
});
test('Alpha 0.71 broken warm/cool reflections remain static and preserve the existing bounded light pool',()=>{
 const g=cueRun70();g.clearTrace();g.drawFieldWorldLight(20,30,'#c99862');const first=JSON.stringify(g.drawingTrace()),t=g.drawingTrace();assert.ok(t.some(r=>r[0]==='set'&&r[2]?.radial?.[5]===42));assert.equal(t.filter(r=>r[0]==='moveTo').length,10);assert.ok(t.some(r=>r.includes('#c9986235')));g.setup({elapsed:30});g.clearTrace();g.drawFieldWorldLight(20,30,'#c99862');assert.equal(JSON.stringify(g.drawingTrace()),first);g.clearTrace();g.drawFieldWetReflection(20,30,'#81bcc5');assert.ok(g.drawingTrace().some(r=>r.includes('#81bcc535')));
});
test('Alpha 0.71 wet drawing preserves native world, interaction objects, records and image allocations',()=>{
 for(const route of ['downtown','freight','riverside','park','market']){const g=sceneryRun67(loadGame({traceCanvas:true}),route);propsBoard69(g);const before=propSnapshot69(g),images=g.pendingImages.length;for(let i=0;i<5;i++)wetTrace71(g);assert.equal(propSnapshot69(g),before);assert.equal(g.pendingImages.length,images);const t=g.drawingTrace();assert.equal(t.filter(r=>r[0]==='save').length,t.filter(r=>r[0]==='restore').length);}
});
test('Alpha 0.71 elapsed does not rebuild or enlarge the existing numeric scenery plan',()=>{
 const g=cueRun70();wetTrace71(g);const cache=g.worldCacheState();g.setup({elapsed:50});wetTrace71(g);assert.equal(g.worldCacheState(),cache);assert.ok(cache.tiles.length<=256);assert.ok(cache.tiles.every(t=>Object.keys(t).sort().join(',')==='seed,x,y'));g.pause();g.selectFieldWorld('classic');assert.equal(g.worldCacheState().tiles.length,0);g.clearTrace();assert.equal(g.drawFieldWorldGround(-206,-457.5),false);assert.equal(g.drawingTrace().length,0);
});
test('Alpha 0.71 material redraws cannot consume later spawn or upgrade randomness',()=>{
 const worlds=[];for(const draw of [false,true]){const g=cueRun70({seed:71123});if(draw)for(let i=0;i<30;i++)g.drawFieldWorldGround(-206,-457.5);for(let i=0;i<12;i++)g.spawnEnemy();worlds.push({world:propSnapshot69(g),choices:JSON.parse(JSON.stringify(g.upgradeChoices()))});}assert.deepEqual(worlds[0],worlds[1]);
});
test('Alpha 0.71 rain and ripple phases freeze during Pause, background and upgrades',()=>{
 const g=cueRun70();g.setup({elapsed:8});g.pause();const time=g.state.elapsed,trace=wetTrace71(g),before=propSnapshot69(g);g.frame(50000);g.document.hidden=true;g.event('visibilitychange');g.document.hidden=false;g.event('visibilitychange');assert.equal(g.state.mode,'paused');near(g.state.elapsed,time);assert.equal(propSnapshot69(g),before);assert.deepEqual(wetTrace71(g),trace);g.resume();g.setup({xp:g.state.nextXp});g.checkLevelUp();assert.equal(g.state.mode,'upgrade');const next=wetTrace71(g);g.frame(60000);assert.deepEqual(wetTrace71(g),next);
});
test('Alpha 0.71 existing Reduced Effects control removes ambience while preserving pause and gameplay',()=>{
 const g=cueRun70();g.setup({elapsed:8});g.pause();const before=fieldWorld56(g);g.showSettings();g.el('pref-reduced').click();assert.equal(g.state.preferences.reduced,true);assert.equal(wetTrace71(g).some(r=>r.includes('#9abac221')),false);g.closeSettings();assert.equal(g.state.mode,'paused');assert.deepEqual(fieldWorld56(g),before);g.showSettings();g.el('pref-reduced').click();g.closeSettings();assert.equal(wetTrace71(g).some(r=>r.includes('#9abac221')),true);
});
test('Alpha 0.71 native ground and foreground warnings remain above all wet scenery with exact geometry',()=>{
 const g=cueRun70();g.spawnBoss('breaker');Object.assign(g.state.activeBoss,{x:0,y:-100,phase:'warn',chargeX:1,chargeY:0,chargeLength:300});g.clearTrace();g.renderBossWarning();const native=g.drawingTrace().map(r=>JSON.stringify(r));g.clearTrace();g.render();const t=g.drawingTrace(),strings=t.map(r=>r[0]==='drawImage'?'image':JSON.stringify(r)),warn=strings.findIndex((s,i)=>s===native[0]&&native.every((v,j)=>strings[i+j]===v)),rain=t.findIndex(r=>r.includes('#9abac221')),edge=t.findIndex(r=>r.includes('#071018'));assert.ok(rain>=0&&warn>rain&&edge>warn);assert.ok(t.some(r=>r[0]==='drawImage'));
});
test('Alpha 0.71 developer/training/original previews keep their scenery and original asset counts',()=>{
 const g=loadGame();enterHunter66(g);g.clearTrace();assert.equal(g.drawFieldWorldGround(-206,-457.5),false);assert.equal(g.drawingTrace().length,0);const a=loadGame();a.startTraining('pierce');assert.equal(a.fieldWorldActive(),false);const b=loadGame();enterStreet(b);assert.equal(b.fieldWorldActive(),false);assert.equal(b.pendingImages.length,12);assert.equal(Object.keys(JSON.parse(sampleAssetText)).length,20);assert.ok(Buffer.byteLength(html)<12*1024*1024);
});

// Alpha 0.72: sparse flat route dressing never changes the field or its rules.
function dressingTrace72(g,tiles=[{x:0,y:0,seed:12}],left=-206,top=-457.5){g.clearTrace();const drawn=g.drawFieldRouteDressing(left,top,tiles);return {drawn,trace:JSON.parse(JSON.stringify(g.drawingTrace()))}}
test('Alpha 0.72 every route has distinct static floor detail under the existing Street setting',()=>{
 const signatures=[];for(const route of ['downtown','freight','riverside','park','market']){const g=sceneryRun67(loadGame({traceCanvas:true}),route),{drawn,trace}=dressingTrace72(g);assert.equal(drawn,true);signatures.push(JSON.stringify(trace));if(route==='downtown')assert.ok(trace.some(r=>r[0]==='strokeRect'&&r[3]===36&&r[4]===24));if(route==='freight')assert.ok(trace.some(r=>r[0]==='fillText'&&/^0[1-9]$/.test(r[1])));if(route==='riverside')assert.ok(trace.some(r=>r.includes('#617b4c66')));if(route==='park')assert.equal(trace.filter(r=>r[0]==='ellipse').length,5);if(route==='market')assert.ok(trace.some(r=>r.includes('#bcb59a70')));}assert.equal(new Set(signatures).size,5);
});
test('Alpha 0.72 Reduced and Classic skip dressing and leave previous quiet ground intact',()=>{
 for(const pref of [{reduced:true},{scenery:'classic'}]){const g=cueRun70({preferencesStored:JSON.stringify({version:1,...pref})}),r=dressingTrace72(g);assert.equal(r.drawn,false);assert.equal(r.trace.length,0);}
});
test('Alpha 0.72 floor-detail choice is independent of Field versus Classic actor preference',()=>{
 const rows=[];for(const actors of ['field','classic']){const g=cueRun70({preferencesStored:JSON.stringify({version:1,actors})});rows.push(dressingTrace72(g).trace)}assert.deepEqual(rows[0],rows[1]);
});
test('Alpha 0.72 floor details remain fixed across elapsed time and repeated rendering without state writes',()=>{
 const g=sceneryRun67(loadGame({traceCanvas:true}),'market'),before=propSnapshot69(g),first=dressingTrace72(g).trace;for(let i=0;i<20;i++)g.drawFieldRouteDressing(-206,-457.5,[{x:0,y:0,seed:12}]);assert.equal(propSnapshot69(g),before);g.setup({elapsed:100});assert.deepEqual(dressingTrace72(g).trace,first);
});
test('Alpha 0.72 detail anchors remain attached to positive and negative world cells while camera moves',()=>{
 const g=sceneryRun67(loadGame({traceCanvas:true}),'freight');for(const tile of [{x:0,y:0,seed:12},{x:-160,y:-160,seed:15}]){const a=dressingTrace72(g,[tile]).trace,b=dressingTrace72(g,[tile],-180,-400).trace;assert.deepEqual(a,b);assert.ok(a.some(r=>r[0]==='translate'&&r[1]===tile.x+28+tile.seed%100&&r[2]===tile.y+28+(tile.seed>>>9)%100));}
});
test('Alpha 0.72 sparse visible dressing has a hard twenty-four-mark ceiling and culls distant cells',()=>{
 const g=sceneryRun67(loadGame({traceCanvas:true}),'freight');const tiles=Array.from({length:256},(_,i)=>({x:0,y:0,seed:i*3})),t=dressingTrace72(g,tiles).trace;assert.equal(t.filter(r=>r[0]==='translate').length,24);const far=dressingTrace72(g,[{x:10000,y:10000,seed:12}]).trace;assert.equal(far.filter(r=>r[0]==='translate').length,0);const skip=dressingTrace72(g,[{x:0,y:0,seed:13}]).trace;assert.equal(skip.filter(r=>r[0]==='translate').length,0);
});
test('Alpha 0.72 Downtown road words use fixed street anchors and a separate sixteen-stencil ceiling',()=>{
 const g=cueRun70();g.clearTrace();g.drawFieldRoadStencils(-206,-457.5);const t=g.drawingTrace(),anchors=t.filter(r=>r[0]==='translate');assert.ok(anchors.length>0&&anchors.length<=16);assert.ok(anchors.every(r=>(r[1]-138)%400===0&&(r[2]-30)%400===0));assert.equal(t.filter(r=>r[0]==='fillText'&&r[1]==='SLOW').length,anchors.length);g.clearTrace();g.drawFieldRoadStencils(-200,-450);assert.deepEqual(g.drawingTrace().filter(r=>r[0]==='translate'),anchors);
});
test('Alpha 0.72 detail rendering preserves native props, player, records, future spawns and upgrade choices',()=>{
 const worlds=[];for(const render of [false,true]){const g=cueRun70({seed:72123});propsBoard69(g);const before=propSnapshot69(g),images=g.pendingImages.length;if(render)for(let i=0;i<20;i++)g.drawFieldRouteDressing(-206,-457.5,g.fieldWorldTiles(-206,-457.5));assert.equal(propSnapshot69(g),before);assert.equal(g.pendingImages.length,images);for(let i=0;i<8;i++)g.spawnEnemy();worlds.push({world:propSnapshot69(g),choices:JSON.parse(JSON.stringify(g.upgradeChoices()))});}assert.deepEqual(worlds[0],worlds[1]);
});
test('Alpha 0.72 no plan growth, persistent art state, image decode or unbalanced drawing context is introduced',()=>{
 const g=cueRun70();g.drawFieldWorldGround(-206,-457.5);const cache=g.worldCacheState(),images=g.pendingImages.length;const r=dressingTrace72(g,cache.tiles);assert.equal(g.worldCacheState(),cache);assert.equal(g.pendingImages.length,images);assert.ok(cache.tiles.length<=256);assert.equal(r.trace.filter(r=>r[0]==='save').length,r.trace.filter(r=>r[0]==='restore').length);assert.equal(r.trace.filter(r=>r[0]==='drawImage').length,0);assert.equal(Object.keys(JSON.parse(sampleAssetText)).length,20);assert.ok(Buffer.byteLength(html)<12*1024*1024);
});
test('Alpha 0.72 route marks draw before wet surfaces, actors and the unchanged native warning geometry',()=>{
 const g=cueRun70();g.spawnBoss('breaker');Object.assign(g.state.activeBoss,{x:0,y:-100,phase:'warn',chargeX:1,chargeY:0,chargeLength:300});g.clearTrace();g.renderBossWarning();const expected=g.drawingTrace().map(r=>JSON.stringify(r));g.clearTrace();g.render();const t=g.drawingTrace(),strings=t.map(r=>r[0]==='drawImage'?'image':JSON.stringify(r)),mark=t.findIndex(r=>r[0]==='fillText'&&r[1]==='SLOW'),water=t.findIndex(r=>r[0]==='set'&&r[2]?.linear?.[1]<0),actor=t.findIndex(r=>r[0]==='drawImage'),warn=strings.findIndex((r,i)=>r===expected[0]&&expected.every((v,j)=>strings[i+j]===v));assert.ok(mark>=0&&water>mark&&actor>mark&&warn>mark);
});
test('Alpha 0.72 existing Reduced setting and paused scenery comparison keep native game time and objects fixed',()=>{
 const g=cueRun70();propsBoard69(g);g.pause();const before=fieldWorld56(g);g.showSettings();g.el('pref-reduced').click();assert.equal(dressingTrace72(g).drawn,false);g.closeSettings();assert.equal(g.state.mode,'paused');assert.deepEqual(fieldWorld56(g),before);g.selectFieldWorld('classic');assert.equal(dressingTrace72(g).drawn,false);g.frame(60000);assert.deepEqual(fieldWorld56(g),before);
});
test('Alpha 0.72 standard training, private developer drills and original camera studies retain their own scenery',()=>{
 const g=loadGame();enterHunter66(g);assert.equal(dressingTrace72(g).drawn,false);const a=loadGame();a.startTraining('pierce');assert.equal(dressingTrace72(a).drawn,false);const b=loadGame();enterStreet(b);assert.equal(dressingTrace72(b).drawn,false);assert.equal(b.pendingImages.length,12);
});

// Alpha 0.73: controlled main-game pressure, temporary settings and frozen reports.
function enterMain73(g,id='early'){g.el('previewsOpen').click();g.advanceClock(500);g.el('mainPerf-'+id).click();assert.equal(g.state.mode,'play');assert.equal(g.state.training,true);return g}
function tickMain73(g,seconds){for(let i=0;i<Math.ceil(seconds*30);i++)g.update(1/30)}
function layoutMain73(g){return JSON.stringify({p:g.p,enemies:g.state.enemies,gems:g.state.gems,obstacles:g.state.obstacles,barrels:g.state.barrels,barricades:g.state.barricades,shocks:g.state.shockDrums,elapsed:g.state.elapsed,level:g.state.level})}
function sampleMain73(g){g.setup({elapsed:g.mainPerfState().startedAt+6});g.recordPerformanceFrame(0);g.recordPerformanceFrame(20);g.recordPerformanceFrame(40)}
test('Alpha 0.73 all three direct entries use controlled native-clock populations, loadouts and real main scenery',()=>{
 for(const [id,count,gems,clock,proj]of [['early',12,0,0,1],['crowded',100,160,150,3],['overtime',220,600,600,5]]){const g=enterMain73(loadGame(),id);assert.equal(g.state.enemies.length,count);assert.equal(g.state.gems.length,gems);near(g.state.elapsed,clock);assert.equal(g.p.proj,proj);assert.equal(g.fieldWorldActive(),true);assert.equal(g.fieldActorsActive(),true);assert.equal(g.composedRunHud(),true);assert.equal(g.performanceSnapshot().enabled,true);assert.match(g.el('objective').textContent,/PERFORMANCE TEST.*UNSCORED/);assert.match(g.el('runGoal').textContent,/WARM-UP 5s/);assert.equal(g.el('time').textContent,'00:00');}
});
test('Alpha 0.73 controls stay out of the root menu and reject stale, hidden, invalid and active-play entry',()=>{
 const g=loadGame();assert.equal(g.el('mainPerf-early'),undefined);g.startMainPerfTest('early');assert.equal(g.state.mode,'menu');g.el('previewsOpen').click();const early=g.el('mainPerf-early');early.click();assert.equal(g.state.mode,'previews');g.advanceClock(500);g.document.hidden=true;early.click();assert.equal(g.state.mode,'previews');g.document.hidden=false;g.startMainPerfTest('__proto__');g.startMainPerfTest('invalid');assert.equal(g.state.mode,'previews');early.click();const owner=g.mainPerfState();g.startMainPerfTest('overtime');early.click();assert.equal(g.mainPerfState(),owner);
});
test('Alpha 0.73 entering tests preserves the selected normal survivor, route, rule and contract',()=>{
 const g=loadGame();g.el('start').click();g.selectSurvivor('engineer');g.selectRoute('park');g.selectRule('iron');const expected=[g.state.selectedSurvivor,g.state.selectedRoute,g.state.selectedRule,g.state.selectedContract];g.phoneBack();g.flushHistory();enterMain73(g,'crowded');assert.deepEqual([g.state.selectedSurvivor,g.state.selectedRoute,g.state.selectedRule,g.state.selectedContract],expected);assert.equal(g.state.runSurvivor,'survivor');assert.equal(g.state.runRoute,'downtown');assert.equal(g.state.runRule,'standard');assert.equal(g.state.runContract,'none');g.pause();quitForTest(g);g.el('changeSurvivor').click();g.el('deploy').click();assert.equal(g.state.training,false);assert.equal(g.state.runSurvivor,'engineer');assert.equal(g.state.runRoute,'park');assert.equal(g.state.runRule,'iron');assert.equal(g.p.damage,18*g.ruleById('iron').damage);
});
test('Alpha 0.73 player HP is safe while real native movement, aim, projectiles and would-be hits run',()=>{
 const g=enterMain73(loadGame(),'early'),hp=g.p.hp,e=g.state.enemies[0],x=e.x,y=e.y;g.touch.x=1;tickMain73(g,.2);assert.ok(g.p.x>0);assert.ok(e.x!==x||e.y!==y);assert.ok(g.state.bullets.length>0);g.hurtPlayer(1000,'contact');assert.equal(g.p.hp,hp);assert.equal(g.state.mode,'play');assert.ok(g.practiceSnapshot().threats>0);assert.equal(g.state.hitsTaken,0);
});
test('Alpha 0.73 native target deaths grant practice credit and cannot grant scored kills, loot or discoveries',()=>{
 const g=enterMain73(loadGame({stored:'900'}),'crowded'),record=g.saved(),journal=g.journalSaved(),boss=g.state.activeBoss,gemCount=g.state.gems.length;g.hitEnemy(boss,1e9);assert.equal(g.practiceSnapshot().targets,1);assert.equal(g.state.killCount,0);assert.equal(g.state.bossesDefeated,0);assert.equal(g.state.gems.length,gemCount);assert.ok(Object.values(g.state.enemyTally).every(x=>x===0));g.pause();quitForTest(g);assert.equal(g.saved(),record);assert.equal(g.journalSaved(),journal);assert.equal(g.state.runResult.training,true);assert.equal(g.state.runResult.kills,0);
});
test('Alpha 0.73 sustained overtime replenishes bounded targets and XP under the existing native FX limits',()=>{
 const g=enterMain73(loadGame(),'overtime');tickMain73(g,8);const s=g.state;assert.ok(s.enemies.length>0&&s.enemies.length<=220);assert.ok(s.gems.length<=600);assert.ok(s.bullets.length<=100);assert.ok(s.particles.length<=600);assert.ok(s.texts.length<=100);assert.ok(s.hostileShots.length<=12);assert.ok(s.lightning.length<=15);assert.ok(s.fires.length<=2);assert.ok(s.bottles.length<=2);assert.equal(s.mode,'play');assert.equal(g.p.hp,g.p.max);assert.equal(s.xp>=0,true);assert.equal(s.upgradeOffer,null);assert.equal(s.enemies.every(e=>e.trainingDummy),true);
});
test('Alpha 0.73 fixture mix loads the existing specialists and Hunters without starting a timed Blackout',()=>{
 const g=enterMain73(loadGame(),'overtime');g.advanceFieldActors(.02);for(const [kind,n]of [['spitter',2],['riot',2],['howler',1],['lobber',1],['hunter',16]])assert.equal(g.state.enemies.filter(e=>e.perfKind===kind).length,n);for(const kind of ['spitter','riot','howler','lobber','hunter'])assert.equal(g.fieldState()[kind].status,'ready');assert.equal(g.state.activeBoss,null);assert.equal(g.state.rushPhase,'waiting');assert.equal(g.state.nextRushAt,Infinity);assert.equal(g.fieldHowlerBudget(JSON.parse(sampleAssetText)),true);
});
test('Alpha 0.73 dead controlled boss warnings clear immediately and the base boss respawns after a short gap',()=>{
 const g=enterMain73(loadGame(),'crowded'),boss=g.state.activeBoss;g.hitEnemy(boss,1e9);g.update(.02);assert.equal(g.state.activeBoss,null);tickMain73(g,2.5);assert.ok(g.state.activeBoss&&g.state.activeBoss!==boss);assert.equal(g.state.activeBoss.hp,650);assert.equal(g.state.enemies.length<=100,true);assert.equal(g.state.bossesDefeated,0);
});
test('Alpha 0.73 Restart restores identical initial fixtures and clears target credit, effects, time and samples',()=>{
 const g=enterMain73(loadGame(),'overtime'),before=layoutMain73(g);sampleMain73(g);g.hitEnemy(g.state.enemies[0],1e9);g.p.damage=999;g.pause();g.el('mainPerfRestart').click();assert.equal(g.state.mode,'paused');assert.equal(layoutMain73(g),before);assert.equal(g.performanceSnapshot().frames,0);assert.equal(g.practiceSnapshot().targets,0);assert.equal(g.state.bullets.length,0);assert.equal(g.state.fires.length,0);assert.equal(g.mainPerfSnapshot().duration,0);
});
test('Alpha 0.73 scene selection stays paused and stale dropdowns cannot reset the new scene',()=>{
 const g=enterMain73(loadGame());g.pause();const old=g.el('mainPerfScene');old.value='crowded';old.dispatch('change');assert.equal(g.mainPerfState().id,'crowded');assert.equal(g.state.mode,'paused');old.value='overtime';old.dispatch('change');assert.equal(g.mainPerfState().id,'crowded');const current=g.el('mainPerfScene');g.document.hidden=true;current.value='overtime';current.dispatch('change');assert.equal(g.mainPerfState().id,'crowded');g.document.hidden=false;current.value='bad';current.dispatch('change');assert.equal(g.mainPerfState().id,'crowded');current.value='overtime';current.dispatch('change');assert.equal(g.mainPerfState().id,'overtime');assert.equal(g.state.mode,'paused');
});
test('Alpha 0.73 measurement warm-up excludes the first five active seconds and reports unavailable without samples',()=>{
 const g=enterMain73(loadGame());g.recordPerformanceFrame(0);g.recordPerformanceFrame(20);assert.equal(g.performanceSnapshot().frames,0);g.setup({elapsed:4.99});g.recordPerformanceFrame(100);assert.equal(g.performanceSnapshot().frames,0);g.setup({elapsed:5.01});g.recordPerformanceFrame(200);g.recordPerformanceFrame(220);assert.equal(g.performanceSnapshot().frames,1);g.pause();g.el('mainPerfReport').click();assert.match(g.benchmarkText(),/Warm-up: first 5 active seconds excluded/);const h=enterMain73(loadGame());h.pause();h.el('mainPerfReport').click();assert.match(h.benchmarkText(),/average FPS: Unavailable/);
});
test('Alpha 0.73 manual measurement reset preserves current world and active test age',()=>{
 const g=enterMain73(loadGame(),'early');sampleMain73(g);g.pause();const world=fieldWorld56(g),age=g.mainPerfSnapshot().duration;g.el('mainPerfReset').click();assert.equal(g.state.mode,'paused');assert.equal(g.performanceSnapshot().frames,0);assert.equal(g.mainPerfSnapshot().duration,age);assert.deepEqual(fieldWorld56(g),world);
});
test('Alpha 0.73 live report freezes measured conditions, counters and active test age with a paused return',()=>{
 const g=enterMain73(loadGame(),'crowded');sampleMain73(g);g.pause();const world=fieldWorld56(g);g.el('mainPerfReport').click();const capture=g.state.benchmarkCapture,text=g.benchmarkText();assert.match(text,/MAIN GAME PERFORMANCE TEST: Crowded/);assert.match(text,/02:30.*00:06/);assert.match(text,/00:06 active test time/);assert.equal(capture.perfTest.row.frames,2);g.frame(50000);assert.equal(g.benchmarkText(),text);assert.deepEqual(fieldWorld56(g),world);g.phoneBack();assert.equal(g.state.mode,'paused');assert.equal(g.state.benchmarkCapture,null);assert.deepEqual(fieldWorld56(g),world);
});
test('Alpha 0.73 all presentation settings are temporary, restart-stable and never written to preference storage',()=>{
 const stored=JSON.stringify({version:1,actors:'field',scenery:'street',hud:'composed',reduced:false,mirrored:false}),g=enterMain73(loadGame({preferencesStored:stored}),'early');const original=JSON.stringify(g.mainPerfState().restore.preferences);sampleMain73(g);g.pause();g.selectFieldActors('classic');assert.equal(g.state.mode,'paused');assert.equal(g.performanceSnapshot().frames,0);g.selectFieldWorld('classic');g.selectRunHud('classic');g.showSettings();g.el('pref-reduced').click();g.el('pref-mirrored').click();assert.equal(g.preferencesSaved(),stored);g.closeSettings();g.el('mainPerfRestart').click();assert.equal(g.state.preferences.actors,'classic');assert.equal(g.state.preferences.scenery,'classic');assert.equal(g.state.preferences.hud,'classic');assert.equal(g.state.preferences.reduced,true);assert.equal(g.state.preferences.mirrored,true);quitForTest(g);assert.equal(JSON.stringify(g.state.preferences),original);assert.equal(g.preferencesSaved(),stored);assert.equal(g.mainPerfState(),null);
});
test('Alpha 0.73 actor/world/HUD/Reduced comparisons alter the real main renderer and reset timing',()=>{
 const g=enterMain73(loadGame({traceCanvas:true}),'early');assert.equal(g.fieldActorsActive(),true);assert.equal(g.fieldWorldActive(),true);assert.equal(g.composedRunHud(),true);g.pause();g.selectFieldActors('classic');assert.equal(g.fieldActorsActive(),false);g.selectFieldWorld('classic');assert.equal(g.fieldWorldActive(),false);g.selectRunHud('classic');assert.equal(g.composedRunHud(),false);g.showSettings();g.el('pref-reduced').click();assert.equal(g.performanceSnapshot().frames,0);g.closeSettings();g.selectFieldActors('field');g.selectFieldWorld('street');g.selectRunHud('composed');assert.equal(g.fieldActorsActive(),true);assert.equal(g.fieldWorldActive(),true);assert.equal(g.composedRunHud(),true);
});
test('Alpha 0.73 future and blocked preference storage remain untouched throughout test comparisons',()=>{
 const future=JSON.stringify({version:99,keep:'untouched'});for(const options of [{preferencesStored:future},{storageBlocked:true},{writeBlocked:true}]){const g=enterMain73(loadGame(options));const pref=g.preferencesSaved(),journal=g.journalSaved();g.pause();g.selectFieldActors('classic');g.showSettings();g.el('pref-reduced').click();g.closeSettings();quitForTest(g);assert.equal(g.preferencesSaved(),pref);assert.equal(g.journalSaved(),journal);assert.equal(g.mainPerfState(),null);}
});
test('Alpha 0.73 held results show active test duration and preserve captured measurements after preferences restore',()=>{
 const g=enterMain73(loadGame(),'overtime');sampleMain73(g);g.pause();g.selectFieldActors('classic');g.resume();sampleMain73(g);g.pause();quitForTest(g);const r=g.state.runResult;assert.equal(r.perfTest.id,'overtime');near(r.perfTest.duration,6);assert.equal(r.perfTest.actors,'classic');assert.equal(r.perfTest.row.frames,2);assert.match(g.el('modal').innerHTML,/PERFORMANCE.*TEST COMPLETE/);assert.match(g.el('modal').innerHTML,/TEST TIME/);assert.equal(g.state.preferences.actors,'field');assert.equal(g.fieldState().status,'idle');g.frame(90000);assert.equal(g.state.runResult,r);assert.equal(r.perfTest.row.frames,2);assert.match(g.runReportText(),/Test age: 00:06/);
});
test('Alpha 0.73 held Settings benchmark uses the frozen test row, style and viewport rather than next-run settings',()=>{
 const g=enterMain73(loadGame(),'early');g.pause();g.selectFieldWorld('classic');g.showSettings();g.el('pref-mirrored').click();g.closeSettings();g.resume();sampleMain73(g);g.pause();quitForTest(g);const saved=g.state.runResult.perfTest;g.el('endSettings').click();g.showBenchmark();assert.equal(g.state.benchmarkCapture.perfTest,saved);assert.equal(g.state.benchmarkCapture.row,saved.row);assert.equal(g.state.benchmarkCapture.viewport,saved.viewport);assert.equal(g.state.benchmarkCapture.mirrored,true);assert.match(g.benchmarkText(),/classic scenery/);assert.match(g.benchmarkText(),/Measured intervals: 2/);g.phoneBack();g.phoneBack();assert.equal(g.state.mode,'end');
});
test('Alpha 0.73 Retry repeats the finished preset and presentation privately without scoring',()=>{
 const g=enterMain73(loadGame({stored:'900'}),'crowded'),journal=g.journalSaved(),pref=g.preferencesSaved();g.pause();g.selectFieldActors('classic');g.selectFieldWorld('classic');quitForTest(g);g.advanceClock(500);g.el('again').click();assert.equal(g.state.mode,'play');assert.equal(g.mainPerfState().id,'crowded');assert.equal(g.state.preferences.actors,'classic');assert.equal(g.state.preferences.scenery,'classic');assert.equal(g.mainPerfSnapshot().duration,0);assert.equal(g.state.enemies.length,100);assert.equal(g.saved(),'900');assert.equal(g.journalSaved(),journal);assert.equal(g.preferencesSaved(),pref);
});
test('Alpha 0.73 menu and a fresh normal deployment clear fixture powers, clocks, caps, diagnostic opt-in and art',()=>{
 const g=enterMain73(loadGame(),'overtime');g.pause();g.selectFieldActors('classic');quitForTest(g);g.el('resultMenu').click();assert.equal(g.mainPerfState(),null);assert.equal(g.performanceSnapshot().enabled,false);assert.equal(g.fieldState().status,'idle');g.flushHistory();g.el('start').click();g.el('deploy').click();assert.equal(g.state.training,false);assert.equal(g.state.elapsed,0);assert.equal(g.p.damage,18);assert.equal(g.p.proj,1);assert.equal(g.p.arc,0);assert.equal(g.p.rail,false);assert.equal(g.state.overtime,0);assert.equal(g.state.nextBossAt,90);assert.equal(g.state.nextXp,8);assert.equal(g.state.preferences.actors,'field');assert.equal(g.fieldActorsActive(),true);
});
test('Alpha 0.73 joystick plus second-finger Pause, Back and backgrounding freeze test world and measurements',()=>{
 const g=enterMain73(loadGame());g.el('stick').dispatch('pointerdown',{pointerId:1,clientX:135.5,clientY:662.5});g.el('pause').dispatch('pointerdown',{pointerId:2,isPrimary:false});assert.equal(g.state.mode,'paused');assert.equal(g.touch.id,null);const world=fieldWorld56(g),age=g.mainPerfSnapshot().duration;g.phoneBack();g.frame(50000);assert.deepEqual(fieldWorld56(g),world);g.resume();g.document.hidden=true;g.event('visibilitychange');g.document.hidden=false;g.event('visibilitychange');assert.equal(g.state.mode,'paused');assert.equal(g.touch.id,null);assert.equal(g.mainPerfSnapshot().duration,age);assert.equal(g.performanceSnapshot().frames,0);
});
test('Alpha 0.73 expired callbacks cannot revive a discarded performance actor cache',()=>{
 const g=enterMain73(loadGame({artworkStatus:'pending'}),'overtime'),image=g.pendingImages[0],ready=image.onload,error=image.onerror;g.pause();quitForTest(g);g.el('resultMenu').click();assert.equal(image.onload,null);assert.equal(image.onerror,null);ready();error();assert.equal(g.fieldState().status,'idle');assert.equal(g.mainPerfState(),null);assert.equal(g.worldCacheState().tiles.length,0);
});
test('Alpha 0.73 unavailable artwork keeps the performance fixture playable and truthfully reports fallback',()=>{
 const g=enterMain73(loadGame({artworkStatus:'error'}),'early');assert.equal(g.fieldActorsActive(),false);assert.equal(g.state.enemies.length,12);tickMain73(g,.5);g.pause();g.el('mainPerfReport').click();assert.match(g.benchmarkText(),/Field artwork unavailable/);assert.equal(g.state.benchmarkCapture.perfTest.actors,'field');assert.equal(g.state.benchmarkCapture.perfTest.row.frames,0);
});
test('Alpha 0.73 entering ordinary training, existing boss drills or the original street scene never leaks a test',()=>{
 const g=enterMain73(loadGame(),'early');g.pause();quitForTest(g);g.el('changeSurvivor').click();g.el('trainingOpen').click();g.startTraining('arc');assert.equal(g.mainPerfState(),null);assert.equal(g.fieldActorsActive(),false);assert.equal(g.fieldWorldActive(),false);g.pause();quitForTest(g);g.el('resultMenu').click();g.flushHistory();enterHunter66(g);assert.equal(g.mainPerfState(),null);assert.equal(g.bossTestState().active,true);assert.equal(g.fieldWorldActive(),false);const h=loadGame();enterStreet(h);assert.equal(h.mainPerfState(),null);assert.equal(h.pendingImages.length,12);
});
test('Alpha 0.73 practice summaries identify moving performance scenes on Pause and held results',()=>{
 const g=enterMain73(loadGame(),'crowded');assert.equal(g.practiceSnapshot().label,'Performance test · Crowded');g.pause();assert.match(g.el('modal').innerHTML,/Performance test · Crowded/);assert.doesNotMatch(g.el('modal').innerHTML,/Stationary targets ·/);assert.ok(g.el('modal').innerHTML.indexOf('MAIN GAME PERFORMANCE TEST')<g.el('modal').innerHTML.indexOf('PRACTICE STATISTICS'));quitForTest(g);assert.equal(g.state.runResult.practice.label,'Performance test · Crowded');assert.match(g.el('modal').innerHTML,/Performance test · Crowded/);assert.doesNotMatch(g.runReportText(),/Stationary targets ·/);const a=loadGame();a.startTraining('arc');assert.equal(a.practiceSnapshot().label,undefined);a.pause();assert.match(a.el('modal').innerHTML,/Stationary targets ·/);
});

// Alpha 0.74: read-back-verified record replacement with one local recovery copy.
const recoveryKey74='ls-restore-recovery-v1';
function review74(g,text=exampleBackup()){g.showBackup();g.el('backupImport').value=text;g.reviewBackup();assert.ok(g.state.pendingRestore)}
test('Alpha 0.74 review alone never writes; confirmed legacy restore preserves a valid pre-restore copy',()=>{
 const raw=journalData('scout',{totals:{runs:2}}),g=loadGame({journalStored:raw,stored:'90'}),before=g.backupText();review74(g);assert.equal(g.recoverySaved(),null);assert.equal(g.journalSaved(),raw);confirmRestore(g);assert.equal(g.state.mode,'menu');assert.equal(g.recoverySaved(),before);assert.equal(g.restoreRecoveryText(),before);assert.equal(g.parseBackup(before).record,90);assert.equal(g.parseBackup(before).journal.totals.runs,2);assert.equal(g.saved(),'220');assert.equal(g.state.record,220);assert.match(g.el('toast').textContent,/READ-BACK VERIFIED/);
});
test('Alpha 0.74 previous records are reviewed without writes and Back cancels before replacement',()=>{
 const copy=exampleBackup(),g=loadGame({stored:'90',recoveryStored:copy});g.showBackup();assert.ok(g.el('recoveryReview'));g.el('recoveryReview').click();assert.equal(g.state.pendingRestore.record,220);assert.equal(g.saved(),'90');assert.equal(g.recoverySaved(),copy);g.phoneBack();assert.equal(g.state.mode,'backup');assert.equal(g.state.pendingRestore,null);assert.equal(g.saved(),'90');g.phoneBack();assert.equal(g.state.mode,'menu');
});
test('Alpha 0.74 restoring the previous copy keeps the replaced data as the next recovery copy',()=>{
 const g=loadGame({stored:'90',journalStored:journalData('scout',{totals:{runs:2}})}),original=g.backupText();review74(g);confirmRestore(g);const newer=g.backupText();g.showBackup();g.el('recoveryReview').click();confirmRestore(g);assert.equal(g.state.record,90);assert.equal(g.state.journal.totals.runs,2);assert.equal(g.recoverySaved(),newer);assert.equal(JSON.parse(g.backupText()).record,JSON.parse(original).record);
});
test('Alpha 0.74 recovery survives a fresh page load and remains a normal format-one backup',()=>{
 const g=loadGame({stored:'90'});review74(g);confirmRestore(g);const h=loadGame({stored:g.saved(),journalStored:g.journalSaved(),recoveryStored:g.recoverySaved()});h.showBackup();h.el('recoveryReview').click();assert.equal(h.state.pendingRestore.record,90);confirmRestore(h);assert.equal(h.saved(),'90');assert.equal(JSON.parse(h.backupText()).format,1);assert.equal(JSON.parse(h.recoverySaved()).game,'last-stand-after-dark');
});
test('Alpha 0.74 a blocked safety-copy write prevents active record changes',()=>{
 const raw=journalData('scout',{totals:{runs:2}}),g=loadGame({journalStored:raw,stored:'90',failWriteKey:recoveryKey74});review74(g);confirmRestore(g);assert.equal(g.state.mode,'backup');assert.equal(g.journalSaved(),raw);assert.equal(g.saved(),'90');assert.equal(g.state.record,90);assert.equal(g.recoverySaved(),null);assert.match(g.el('backupMessage').textContent,/unchanged.*verified safety copy/);
});
test('Alpha 0.74 silently ignored safety-copy storage is detected before active keys are written',()=>{
 const raw=journalData('scout'),g=loadGame({journalStored:raw,stored:'90',storageFault:({key})=>key===recoveryKey74?'ignore':undefined});review74(g);confirmRestore(g);assert.equal(g.journalSaved(),raw);assert.equal(g.saved(),'90');assert.equal(g.state.mode,'backup');assert.equal(g.recoverySaved(),null);assert.match(g.el('backupMessage').textContent,/unchanged/);
});
test('Alpha 0.74 silently ignored journal writes roll back the written best-time key',()=>{
 const raw=journalData('scout'),g=loadGame({journalStored:raw,stored:'90',storageFault:({key})=>key==='ls-journal-v1'?'ignore':undefined});review74(g);confirmRestore(g);assert.equal(g.journalSaved(),raw);assert.equal(g.saved(),'90');assert.equal(g.state.record,90);assert.equal(g.state.selectedSurvivor,'scout');assert.match(g.el('backupMessage').textContent,/unchanged/);assert.ok(g.restoreRecoveryText());
});
test('Alpha 0.74 silently ignored best-time writes roll back the written journal key',()=>{
 const raw=journalData('scout'),g=loadGame({journalStored:raw,stored:'90',storageFault:({key})=>key==='ls-record'?'ignore':undefined});review74(g);confirmRestore(g);assert.equal(g.journalSaved(),raw);assert.equal(g.saved(),'90');assert.equal(g.state.record,90);assert.match(g.el('backupMessage').textContent,/unchanged/);
});
test('Alpha 0.74 error after a record write restores both original strings without adopting the candidate',()=>{
 const raw=journalData('scout'),g=loadGame({journalStored:raw,stored:'90',storageFault:({key,value,values})=>{if(key==='ls-record'&&value==='220'){values.set(key,value);throw Error('write interruption')}}});review74(g);confirmRestore(g);assert.equal(g.journalSaved(),raw);assert.equal(g.saved(),'90');assert.equal(g.state.record,90);assert.equal(g.state.selectedSurvivor,'scout');assert.equal(g.state.mode,'backup');assert.match(g.el('backupMessage').textContent,/unchanged/);
});
test('Alpha 0.74 rollback read-back failure is reported honestly while session records and recovery remain available',()=>{
 const raw=journalData('scout',{totals:{runs:2}});let replacing=false;const g=loadGame({journalStored:raw,stored:'90',storageFault:({key,value,values})=>{if(key==='ls-journal-v1'&&value!==raw)replacing=true;if(key==='ls-record'&&value==='220'){values.set(key,value);throw Error('interrupted')}if(replacing&&(key==='ls-journal-v1'&&value===raw||key==='ls-record'&&value==='90'))return 'ignore'}});review74(g);confirmRestore(g);assert.equal(g.state.mode,'backup');assert.equal(g.state.record,90);assert.equal(g.state.journal.totals.runs,2);assert.equal(g.state.journal.available,false);assert.match(g.el('backupMessage').textContent,/storage rejected rollback.*Export this session/);assert.equal(JSON.parse(g.backupText()).record,90);assert.equal(g.parseBackup(g.restoreRecoveryText()).record,90);assert.notEqual(g.saved(),'90');
});
test('Alpha 0.74 failed replacement restores absent keys as absent rather than literal null strings',()=>{
 const g=loadGame({storageFault:({key,value,values})=>{if(key==='ls-record'&&value==='220'){values.set(key,value);throw Error('interrupted')}}});review74(g);confirmRestore(g);assert.equal(g.saved(),undefined);assert.equal(g.journalSaved(),undefined);assert.equal(g.state.record,0);assert.equal(g.state.journal.totals.runs,0);assert.equal(JSON.parse(g.restoreRecoveryText()).record,0);assert.match(g.el('backupMessage').textContent,/unchanged/);
});
test('Alpha 0.74 recovery cannot bypass future-log, hidden-page or active-run restore restrictions',()=>{
 const future=JSON.stringify({version:99,keep:true}),copy=exampleBackup(),g=loadGame({journalStored:future,stored:'90',recoveryStored:copy});g.showBackup();g.reviewRestoreRecovery();assert.equal(g.state.pendingRestore,null);assert.equal(g.journalSaved(),future);assert.equal(g.recoverySaved(),copy);const h=loadGame({recoveryStored:copy});h.showBackup();h.document.hidden=true;h.reviewRestoreRecovery();assert.equal(h.state.pendingRestore,null);h.document.hidden=false;h.closeBackup();cleanRun(h);h.reviewRestoreRecovery();assert.equal(h.state.mode,'play');assert.equal(h.state.pendingRestore,null);
});
test('Alpha 0.74 malformed, oversized and unsupported recovery copies are never offered as restore candidates',()=>{
 for(const copy of ['{','x'.repeat(262145),JSON.stringify({game:'last-stand-after-dark',format:99}),'<img src=x>']){const g=loadGame({recoveryStored:copy});g.showBackup();assert.equal(g.restoreRecoveryText(),'');assert.equal(g.el('recoveryReview'),undefined);g.reviewRestoreRecovery();assert.equal(g.state.pendingRestore,null);assert.doesNotMatch(g.el('modal').innerHTML,/<img/);assert.equal(g.recoverySaved(),copy);}
});
test('Alpha 0.74 recovery review supersedes an in-flight file read without allowing late candidate changes',async()=>{
 const copy=exampleBackup(),g=loadGame({stored:'90',recoveryStored:copy});g.showBackup();let resolve;const file=g.el('backupFile');file.files=[{size:100,text:()=>new Promise(r=>{resolve=r})}];const waiting=file.dispatch('change');g.el('recoveryReview').click();const candidate=g.state.pendingRestore;resolve(JSON.stringify({...JSON.parse(copy),record:999}));await waiting;assert.equal(g.state.pendingRestore,candidate);assert.equal(candidate.record,220);assert.equal(g.saved(),'90');
});
test('Alpha 0.74 stale recovery and confirmation buttons cannot act in a later backup screen',()=>{
 const g=loadGame({stored:'90',recoveryStored:exampleBackup()});g.showBackup();const old=g.el('recoveryReview');g.closeBackup();g.showBackup();old.click();assert.equal(g.state.pendingRestore,null);g.el('recoveryReview').click();const confirm=g.el('restoreConfirm');g.el('restoreEdit').click();g.el('backupImport').value=JSON.stringify({...JSON.parse(exampleBackup()),record:333});g.reviewBackup();g.advanceClock(500);choicePointer(confirm,'pointerdown');choicePointer(confirm,'pointerup');assert.equal(g.saved(),'90');assert.equal(g.state.pendingRestore.record,333);
});
test('Alpha 0.74 cancel from held results preserves the exact result, stats and saved records',()=>{
 const g=loadGame({recoveryStored:exampleBackup()});cleanRun(g);finishForGuide(g);const result=g.state.runResult,sheet=g.el('modal').innerHTML,saved=g.journalSaved(),best=g.saved(),draws=g.drawCount();g.showBackup();g.el('recoveryReview').click();g.frame(50000);g.phoneBack();assert.equal(g.state.mode,'backup');g.closeBackup();assert.equal(g.state.mode,'end');assert.equal(g.state.runResult,result);assert.equal(g.el('modal').innerHTML,sheet);assert.equal(g.journalSaved(),saved);assert.equal(g.saved(),best);assert.equal(g.drawCount(),draws);
});
test('Alpha 0.74 a simulated interrupted prior restore can recover its old pair after reloading',()=>{
 const source=loadGame({stored:'90',journalStored:journalData('scout',{totals:{runs:2}})}),recovery=source.backupText(),candidate=source.parseBackup(exampleBackup()),mixed=JSON.stringify({version:1,presets:candidate.journal.presets,bestiary:candidate.journal.bestiary,selected:candidate.journal.selected,totals:candidate.journal.totals,history:candidate.journal.history}),g=loadGame({stored:'90',journalStored:mixed,recoveryStored:recovery});g.showBackup();g.el('recoveryReview').click();confirmRestore(g);assert.equal(g.saved(),'90');assert.equal(g.state.journal.totals.runs,2);assert.equal(g.state.selectedSurvivor,'scout');
});
test('Alpha 0.74 portable backups keep format one and carry build-labelled filenames without test scores',async()=>{
 const g=loadGame({stored:'900'});enterMain73(g,'overtime');g.pause();quitForTest(g);const journal=g.journalSaved();g.showBackup();g.el('backupDownload').click();const packet=JSON.parse(await g.downloads().at(-1).text());assert.deepEqual(Object.keys(packet).sort(),['format','game','journal','record']);assert.equal(packet.format,1);assert.equal(packet.record,900);assert.equal(packet.journal.totals.runs,0);assert.equal(g.journalSaved(),journal);assert.equal(g.parseBackup(JSON.stringify(packet)).record,900);assert.ok(source.includes("a.download='Last_Stand_After_Dark_Save_Alpha_0_85.json'"));
});

// Alpha 0.75: ordinary save read-back and explicit held-result retry.
function finish75(g,time=120){cleanRun(g);g.setup({elapsed:time});g.end('abandoned');return g.state.runResult}
function retry75(g){const b=g.el('retryRunSave');assert.ok(b);choicePointer(b,'pointerdown');choicePointer(b,'pointerup')}
test('Alpha 0.75 a healthy completed run is saved once with one backup button and no failure action',()=>{
 const g=loadGame({stored:'900'});const r=finish75(g);assert.equal(g.state.record,900);assert.equal(g.saved(),'900');assert.equal(g.state.runRecordSaved,true);assert.equal(g.state.journal.available,true);assert.equal(JSON.parse(g.journalSaved()).totals.runs,1);assert.equal(g.el('retryRunSave'),undefined);assert.doesNotMatch(g.el('modal').innerHTML,/RECORDS NOT FULLY SAVED/);assert.equal((g.el('modal').innerHTML.match(/id="endBackup"/g)||[]).length,1);g.end('abandoned');assert.equal(g.state.runResult,r);assert.equal(g.state.journal.totals.runs,1);
});
test('Alpha 0.75 silently ignored best-time saving preserves session score and puts backup above stats',()=>{
 const g=loadGame({stored:'90',storageFault:({key})=>key==='ls-record'?'ignore':undefined});finish75(g);assert.equal(g.state.record,120);assert.equal(g.saved(),'90');assert.equal(g.state.runRecordSaved,false);assert.equal(g.state.journal.available,true);const ui=g.el('modal').innerHTML;assert.ok(ui.indexOf('RECORDS NOT FULLY SAVED')<ui.indexOf('THIS RUN’S STATS'));assert.ok(ui.indexOf('id="endBackup"')<ui.indexOf('THIS RUN’S STATS'));assert.equal((ui.match(/id="endBackup"/g)||[]).length,1);assert.ok(g.el('retryRunSave'));
});
test('Alpha 0.75 ignored run-log saving leaves the previous disk log and retains new session history',()=>{
 const raw=journalData('scout',{totals:{runs:2}}),g=loadGame({journalStored:raw,storageFault:({key})=>key==='ls-journal-v1'?'ignore':undefined});finish75(g);assert.equal(g.journalSaved(),raw);assert.equal(g.state.journal.totals.runs,3);assert.equal(g.state.journal.history.length,1);assert.equal(g.state.journal.available,false);assert.equal(g.state.runRecordSaved,true);assert.match(g.el('modal').innerHTML,/RECORDS NOT FULLY SAVED/);
});
test('Alpha 0.75 read-back rejection after writing a best time never reports verification success',()=>{
 let reject=false;const g=loadGame({storageReadFault:({key})=>reject&&key==='ls-record'});cleanRun(g);g.setup({elapsed:120});reject=true;g.end('abandoned');assert.equal(g.saved(),'120');assert.equal(g.state.runRecordSaved,false);assert.equal(g.state.record,120);assert.match(g.el('modal').innerHTML,/RECORDS NOT FULLY SAVED/);reject=false;retry75(g);assert.equal(g.state.runRecordSaved,true);
});
test('Alpha 0.75 read-back rejection after writing the log retains session data and shows failure',()=>{
 let reject=false;const g=loadGame({storageReadFault:({key})=>reject&&key==='ls-journal-v1'});cleanRun(g);g.setup({elapsed:120});reject=true;g.end('abandoned');assert.equal(JSON.parse(g.journalSaved()).totals.runs,1);assert.equal(g.state.journal.available,false);assert.equal(g.state.journal.history.length,1);reject=false;retry75(g);assert.equal(g.state.journal.available,true);assert.equal(g.state.journal.totals.runs,1);
});
test('Alpha 0.75 ignored preference writes show visit-only settings and can recover on a later change',()=>{
 let blocked=true;const g=loadGame({storageFault:({key})=>blocked&&key==='ls-preferences-v1'?'ignore':undefined});g.showSettings();g.el('pref-shake').click();assert.equal(g.state.preferences.shake,false);assert.equal(g.preferencesSaved(),null);assert.equal(g.state.preferences.available,false);assert.match(g.el('modal').innerHTML,/Storage unavailable; changes last for this visit/);blocked=false;g.el('pref-numbers').click();assert.equal(g.state.preferences.available,true);assert.equal(JSON.parse(g.preferencesSaved()).shake,false);assert.equal(JSON.parse(g.preferencesSaved()).numbers,false);
});
test('Alpha 0.75 preference read-back failures keep the chosen audio values without claiming persistence',()=>{
 let reject=false;const g=loadGame({storageReadFault:({key})=>reject&&key==='ls-preferences-v1'});g.showSettings();reject=true;g.el('pref-sound').click();assert.equal(g.state.preferences.sound,false);assert.equal(g.state.preferences.available,false);assert.equal(JSON.parse(g.preferencesSaved()).sound,false);assert.match(g.el('modal').innerHTML,/changes last for this visit/);reject=false;g.el('pref-shake').click();assert.equal(g.state.preferences.available,true);assert.equal(JSON.parse(g.preferencesSaved()).sound,false);
});
test('Alpha 0.75 retry persists the held run without duplicate totals, stats, samples or rendering',()=>{
 let blocked=true;const g=loadGame({stored:'90',storageFault:()=>blocked?'ignore':undefined}),r=finish75(g);const history=JSON.stringify(g.state.journal.history),totals=JSON.stringify(g.state.journal.totals),draws=g.drawCount(),samples=JSON.stringify(g.performanceSnapshot());blocked=false;retry75(g);assert.equal(g.state.mode,'end');assert.equal(g.state.runResult,r);assert.equal(g.saved(),'120');assert.equal(JSON.parse(g.journalSaved()).totals.runs,1);assert.equal(JSON.stringify(g.state.journal.history),history);assert.equal(JSON.stringify(g.state.journal.totals),totals);assert.equal(JSON.stringify(g.performanceSnapshot()),samples);assert.equal(g.drawCount(),draws);assert.equal(g.state.runRecordSaved,true);assert.equal(g.state.journal.available,true);assert.equal(g.el('retryRunSave'),undefined);assert.doesNotMatch(g.el('modal').innerHTML,/RECORDS NOT FULLY SAVED/);
});
test('Alpha 0.75 repeated rejected retries keep one run and its full exportable session backup',async()=>{
 const g=loadGame({storageFault:()=> 'ignore'}),r=finish75(g);for(let i=0;i<3;i++)retry75(g);assert.equal(g.state.runResult,r);assert.equal(g.state.journal.totals.runs,1);assert.equal(g.state.journal.history.length,1);g.el('endBackup').click();g.el('backupDownload').click();const packet=JSON.parse(await g.downloads().at(-1).text());assert.equal(packet.record,120);assert.equal(packet.journal.totals.runs,1);assert.equal(packet.journal.history[0].time,120);assert.equal(g.saved(),null);assert.equal(g.journalSaved(),null);assert.equal(packet.format,1);
});
test('Alpha 0.75 partial retry stays warned until both best time and journal are verified',()=>{
 let block='both';const g=loadGame({storageFault:({key})=>block==='both'||key===block?'ignore':undefined});finish75(g);assert.equal(g.state.runRecordSaved,false);assert.equal(g.state.journal.available,false);block='ls-record';retry75(g);assert.equal(g.state.journal.available,true);assert.equal(g.state.runRecordSaved,false);assert.match(g.el('modal').innerHTML,/RECORDS NOT FULLY SAVED/);block=null;retry75(g);assert.equal(g.state.runRecordSaved,true);assert.equal(g.state.journal.available,true);assert.equal(g.state.journal.totals.runs,1);assert.equal(g.state.runResult.time,120);assert.equal(g.el('retryRunSave'),undefined);
});
test('Alpha 0.75 a shorter subsequent run retries an unsaved prior personal best',()=>{
 let blocked=true;const g=loadGame({stored:'90',storageFault:({key})=>blocked&&key==='ls-record'?'ignore':undefined});finish75(g,200);assert.equal(g.state.runRecordSaved,false);blocked=false;finish75(g,100);assert.equal(g.state.record,200);assert.equal(g.saved(),'200');assert.equal(g.state.runRecordSaved,true);assert.equal(g.state.journal.totals.runs,2);assert.equal(JSON.parse(g.journalSaved()).totals.runs,2);
});
test('Alpha 0.75 an immediate zero-second end verifies explicit zero and one journal row',()=>{
 const g=loadGame();finish75(g,0);assert.equal(g.saved(),'0');assert.equal(g.state.runRecordSaved,true);assert.equal(g.state.journal.available,true);assert.equal(g.state.journal.totals.runs,1);assert.equal(g.state.journal.history.length,1);
});
test('Alpha 0.75 retry rejects hidden pages, inactive modes and another result identity',()=>{
 const writes=[];const g=loadGame({storageFault:({key})=>{writes.push(key);return 'ignore'}}),r=finish75(g);let n=writes.length;g.document.hidden=true;retry75(g);assert.equal(writes.length,n);g.document.hidden=false;g.showBackup();g.retryRunSave(r);assert.equal(writes.length,n);g.closeBackup();finish75(g,130);n=writes.length;g.retryRunSave(r);assert.equal(writes.length,n);assert.equal(g.state.journal.totals.runs,2);
});
test('Alpha 0.75 a detached retry button cannot save or replace a later result',()=>{
 let blocked=true;const g=loadGame({storageFault:()=>blocked?'ignore':undefined});finish75(g);const old=g.el('retryRunSave');finish75(g,140);const result=g.state.runResult;blocked=false;choicePointer(old,'pointerdown');choicePointer(old,'pointerup');old.click();assert.equal(g.saved(),null);assert.equal(g.state.runResult,result);assert.equal(g.state.journal.totals.runs,2);retry75(g);assert.equal(g.saved(),'140');assert.equal(JSON.parse(g.journalSaved()).totals.runs,2);
});
test('Alpha 0.75 a finishing release or compatibility click cannot activate save retry',()=>{
 let blocked=true;const g=loadGame({storageFault:()=>blocked?'ignore':undefined});finish75(g);const b=g.el('retryRunSave');blocked=false;choicePointer(b,'pointerup');b.dispatch('click',{detail:1});assert.equal(g.saved(),null);choicePointer(b,'pointerdown');choicePointer(b,'pointercancel');choicePointer(b,'pointerup');assert.equal(g.saved(),null);retry75(g);assert.equal(g.saved(),'120');
});
test('Alpha 0.75 newer journal versions have a truthful temporary-run notice and no retry overwrite',()=>{
 const raw=JSON.stringify({version:99,keep:'future'}),g=loadGame({journalStored:raw}),r=finish75(g);assert.equal(g.state.journal.readOnly,true);assert.equal(g.el('retryRunSave'),undefined);assert.match(g.el('modal').innerHTML,/NEWER RUN LOG · This run is temporary/);g.retryRunSave(r);assert.equal(g.journalSaved(),raw);assert.doesNotMatch(g.el('modal').innerHTML,/Export a backup before closing/);
});
test('Alpha 0.75 training and private boss or performance tests never write scores or offer save retry',()=>{
 for(const kind of ['training','boss','performance']){const writes=[];const g=loadGame({stored:'90',storageFault:({key})=>{writes.push(key)}});if(kind==='training')g.startTraining('arc');else if(kind==='boss'){g.showPreviews();g.startBossTesting('breaker');}else enterMain73(g,'crowded');const prior=writes.length;g.end('abandoned');assert.equal(g.state.runResult.training,true);assert.equal(g.el('retryRunSave'),undefined);assert.equal(g.saved(),'90');assert.equal(g.journalSaved(),null);assert.equal(writes.slice(prior).filter(k=>['ls-record','ls-journal-v1'].includes(k)).length,0);assert.doesNotMatch(g.el('modal').innerHTML,/RECORDS NOT FULLY SAVED/);g.retryRunSave(g.state.runResult);assert.equal(writes.length,prior);}
});
test('Alpha 0.75 returning from backup keeps failed status and exact held stats until explicit retry',()=>{
 let blocked=true;const g=loadGame({storageFault:()=>blocked?'ignore':undefined}),r=finish75(g),ui=g.el('modal').innerHTML;g.el('endBackup').click();blocked=false;g.phoneBack();assert.equal(g.state.mode,'end');assert.equal(g.state.runResult,r);assert.equal(g.el('modal').innerHTML,ui);assert.equal(g.saved(),null);retry75(g);assert.equal(g.saved(),'120');assert.equal(g.state.runResult,r);
});
test('Alpha 0.75 ordinary saves and explicit retry preserve the prior restore copy and preference schema',()=>{
 let blocked=true;const copy=exampleBackup(),future=JSON.stringify({version:99,keep:'future prefs'}),g=loadGame({recoveryStored:copy,preferencesStored:future,storageFault:({key})=>blocked&&key!=='ls-preferences-v1'?'ignore':undefined});finish75(g);blocked=false;retry75(g);assert.equal(g.recoverySaved(),copy);assert.equal(g.preferencesSaved(),future);const packet=JSON.parse(g.backupText());assert.deepEqual(Object.keys(packet).sort(),['format','game','journal','record']);assert.equal(packet.format,1);assert.equal(Object.hasOwn(packet.journal,'available'),false);assert.equal(Object.hasOwn(packet.journal,'readOnly'),false);
});
test('Alpha 0.75 all scored outcomes retain their native totals and survive same-context reload',()=>{
 for(const outcome of ['abandoned','defeated','extracted']){const g=loadGame();cleanRun(g);g.setup({elapsed:180});g.end(outcome);const r=g.state.runResult,h=loadGame({stored:g.saved(),journalStored:g.journalSaved()});assert.equal(h.state.record,180);assert.equal(h.state.journal.totals.runs,1);assert.equal(h.state.journal.totals.extractions,outcome==='extracted'?1:0);assert.equal(h.state.journal.history[0].outcome,r.outcome);assert.equal(g.state.runRecordSaved,true);assert.equal(g.el('retryRunSave'),undefined);}
});

// Alpha 0.76: viewport rotation and interrupted gesture safety.
function interrupt76(g,kind){if(kind==='visibility'){g.document.hidden=true;g.event('visibilitychange');g.document.hidden=false;g.event('visibilitychange')}else if(kind==='resize')g.resizeTo(915,412);else{g.event(kind);if(kind==='blur')g.event('focus');if(kind==='pagehide')g.event('pageshow')}}
test('Alpha 0.76 rotating active portrait play opens Pause without advancing the world',()=>{
 const g=loadGame();cleanRun(g);g.keys.d=true;g.el('stick').dispatch('pointerdown',{pointerId:1,clientX:135.5,clientY:662.5});const world=fieldWorld56(g),time=g.state.elapsed;g.resizeTo(915,412);assert.equal(g.state.mode,'paused');assert.match(g.el('modal').innerHTML,/Screen rotated/);assert.equal(g.touch.id,null);assert.equal(Object.keys(g.keys).length,0);g.frame(100000);assert.deepEqual(fieldWorld56(g),world);near(g.state.elapsed,time);g.resume();assert.equal(g.state.mode,'play');assert.equal(g.touch.x,0);g.update(.02);assert.equal(g.p.x,world.p.x);
});
test('Alpha 0.76 landscape to portrait also pauses until explicit Resume',()=>{
 const g=loadGame({width:915,height:412});cleanRun(g);const before=fieldWorld56(g);g.resizeTo(412,915);assert.equal(g.state.mode,'paused');assert.deepEqual(fieldWorld56(g),before);g.event('focus');g.event('pageshow');assert.equal(g.state.mode,'paused');g.el('resume').click();assert.equal(g.state.mode,'play');
});
test('Alpha 0.76 same-orientation address-bar and window resizing clears input without forcing Pause',()=>{
 for(const [width,height,next]of [[412,915,[412,800]],[915,412,[850,390]]]){const g=loadGame({width,height});cleanRun(g);g.keys.w=true;g.touch.x=.8;const before=fieldWorld56(g);g.resizeTo(...next);assert.equal(g.state.mode,'play');assert.equal(Object.keys(g.keys).length,0);assert.equal(g.touch.x,0);assert.deepEqual(fieldWorld56(g),before);}
});
test('Alpha 0.76 repeated rotations preserve the existing Pause sheet and never toggle Resume',()=>{
 const g=loadGame();cleanRun(g);g.pause();const sheet=g.el('modal').innerHTML,before=fieldWorld56(g);for(const size of [[915,412],[412,915],[915,412],[412,915]]){g.resizeTo(...size);assert.equal(g.state.mode,'paused');assert.equal(g.el('modal').innerHTML,sheet);assert.deepEqual(fieldWorld56(g),before)}g.resume();assert.equal(g.state.mode,'play');g.resizeTo(915,412);assert.equal(g.state.mode,'paused');
});
test('Alpha 0.76 an upgrade touch started before an interruption cannot select on return',()=>{
 for(const event of ['blur','visibility','pagehide','freeze','resize']){const g=loadGame();cleanRun(g);earnUpgrade(g);g.advanceClock(500);const card=g.choices()[0],before=JSON.stringify(g.p);choicePointer(card,'pointerdown');interrupt76(g,event);choicePointer(card,'pointerup');card.click(1);assert.equal(g.state.mode,'upgrade',event);assert.equal(JSON.stringify(g.p),before,event);choicePointer(card,'pointerdown');choicePointer(card,'pointerup');assert.equal(g.state.mode,'play',event);}
});
test('Alpha 0.76 a fresh pointer can recover when an interrupted old pointer never releases',()=>{
 const g=loadGame();cleanRun(g);earnUpgrade(g);g.advanceClock(500);const card=g.choices()[0];choicePointer(card,'pointerdown',1);interrupt76(g,'freeze');choicePointer(card,'pointerdown',2);choicePointer(card,'pointerup',1);assert.equal(g.state.mode,'upgrade');choicePointer(card,'pointerup',2);assert.equal(g.state.mode,'play');const h=loadGame();cleanRun(h);earnUpgrade(h);h.advanceClock(500);const next=h.choices()[0];choicePointer(next,'pointerdown',1);interrupt76(h,'freeze');next.dispatch('keydown',{key:'Enter'});choicePointer(next,'pointerup',1);assert.equal(h.state.mode,'upgrade');next.dispatch('keyup',{key:'Enter'});assert.equal(h.state.mode,'play');
});
test('Alpha 0.76 upgrade keyboard releases across interruption are rejected and a fresh key works',()=>{
 for(const key of ['Enter',' '])for(const event of ['blur','visibility','freeze','resize']){const g=loadGame();cleanRun(g);earnUpgrade(g);g.advanceClock(500);const card=g.choices()[0];card.dispatch('keydown',{key});interrupt76(g,event);card.dispatch('keyup',{key});assert.equal(g.state.mode,'upgrade');card.dispatch('keydown',{key});card.dispatch('keyup',{key});assert.equal(g.state.mode,'play');}
});
test('Alpha 0.76 interrupted reroll and banish presses keep their charges until a fresh tap',()=>{
 for(const id of ['rerollUpgrade','banishUpgrade']){const g=loadGame();laterUpgrade(g);g.advanceClock(500);const b=g.el(id),names=offerNames(g),rerolls=g.state.rerollsLeft,banishes=g.state.banishesLeft;choicePointer(b,'pointerdown');interrupt76(g,'blur');choicePointer(b,'pointerup');assert.deepEqual(offerNames(g),names);assert.equal(g.state.rerollsLeft,rerolls);assert.equal(g.state.banishesLeft,banishes);choicePointer(b,'pointerdown');choicePointer(b,'pointerup');assert.equal(id==='rerollUpgrade'?g.state.rerollsLeft:g.state.banishesLeft,0);}
});
test('Alpha 0.76 interrupted restore confirmation never writes until a new confirmed gesture',()=>{
 for(const event of ['visibility','freeze','resize']){const g=loadGame({stored:'90'});review74(g);g.advanceClock(500);const b=g.el('restoreConfirm'),candidate=g.state.pendingRestore;choicePointer(b,'pointerdown');interrupt76(g,event);choicePointer(b,'pointerup');assert.equal(g.saved(),'90');assert.equal(g.recoverySaved(),null);assert.equal(g.state.pendingRestore,candidate);choicePointer(b,'pointerdown');choicePointer(b,'pointerup');assert.equal(g.saved(),'220');assert.equal(g.state.mode,'menu');}
});
test('Alpha 0.76 interrupted results touches preserve the held run instead of starting another',()=>{
 for(const event of ['blur','visibility','pagehide','freeze','resize']){const g=loadGame(),r=finish75(g),b=g.el('again'),saved=g.journalSaved();choicePointer(b,'pointerdown');interrupt76(g,event);choicePointer(b,'pointerup');b.click(1);assert.equal(g.state.mode,'end',event);assert.equal(g.state.runResult,r);assert.equal(g.journalSaved(),saved);choicePointer(b,'pointerdown',2);choicePointer(b,'pointerup',2);assert.equal(g.state.mode,'play',event);}
});
test('Alpha 0.76 interrupted save retry cannot write on return and a fresh tap remains usable',()=>{
 let blocked=true;const g=loadGame({storageFault:()=>blocked?'ignore':undefined}),r=finish75(g),b=g.el('retryRunSave');choicePointer(b,'pointerdown');interrupt76(g,'freeze');blocked=false;choicePointer(b,'pointerup');assert.equal(g.saved(),null);assert.equal(g.state.runResult,r);choicePointer(b,'pointerdown',2);choicePointer(b,'pointerup',2);assert.equal(g.saved(),'120');assert.equal(g.state.runResult,r);assert.equal(g.state.journal.totals.runs,1);
});
test('Alpha 0.76 hidden results accessibility actions wait until the page is visible',()=>{
 const g=loadGame(),r=finish75(g),b=g.el('resultMenu');g.document.hidden=true;g.event('visibilitychange');b.click(0);assert.equal(g.state.mode,'end');assert.equal(g.state.runResult,r);g.document.hidden=false;g.event('visibilitychange');b.click(0);assert.equal(g.state.mode,'menu');
});
test('Alpha 0.76 rotation preserves the exact upgrade offer and its opening delay',()=>{
 const g=loadGame();cleanRun(g);earnUpgrade(g);const card=g.choices()[0],offer=g.state.upgradeOffer,ui=g.el('modal').innerHTML;g.resizeTo(915,412);assert.equal(g.state.mode,'upgrade');assert.equal(g.state.upgradeOffer,offer);assert.equal(g.el('modal').innerHTML,ui);choicePointer(card,'pointerdown');g.advanceClock(500);choicePointer(card,'pointerup');assert.equal(g.state.mode,'upgrade');choicePointer(card,'pointerdown');choicePointer(card,'pointerup');assert.equal(g.state.mode,'play');
});
test('Alpha 0.76 extraction stays a frozen deliberate choice across rotation and freeze',()=>{
 const g=loadGame();prepareExit(g);reachExit(g);const ui=g.el('modal').innerHTML,world=fieldWorld56(g);g.resizeTo(915,412);g.event('freeze');g.frame(100000);assert.equal(g.state.mode,'extraction');assert.equal(g.el('modal').innerHTML,ui);assert.deepEqual(fieldWorld56(g),world);chooseExitForTest(g,'stay');assert.equal(g.state.mode,'play');assert.equal(g.state.overtime,1);
});
test('Alpha 0.76 rotation keeps held reports and their captured viewport frozen',()=>{
 const g=loadGame();finish75(g);g.el('endSettings').click();g.showBenchmark();const capture=g.state.benchmarkCapture,text=g.benchmarkText(),r=g.state.runResult;g.resizeTo(915,412);g.event('freeze');g.frame(100000);assert.equal(g.state.mode,'benchmark');assert.equal(g.state.benchmarkCapture,capture);assert.equal(g.benchmarkText(),text);assert.equal(g.state.runResult,r);g.phoneBack();g.phoneBack();assert.equal(g.state.mode,'end');
});
test('Alpha 0.76 pressure scenes pause on rotation without advancing test age or inventing a frame stall',()=>{
 const g=enterMain73(loadGame(),'overtime');sampleMain73(g);const age=g.mainPerfSnapshot().duration,world=fieldWorld56(g),frames=g.performanceSnapshot().frames;g.resizeTo(915,412);assert.equal(g.state.mode,'paused');g.frame(100000);assert.equal(g.mainPerfSnapshot().duration,age);assert.deepEqual(fieldWorld56(g),world);assert.equal(g.performanceSnapshot().frames,frames);g.resume();g.recordPerformanceFrame(200000);assert.equal(g.performanceSnapshot().frames,frames);g.recordPerformanceFrame(200016);assert.equal(g.performanceSnapshot().frames,frames+1);assert.ok(g.performanceSnapshot().maxMs<50);
});
test('Alpha 0.76 joystick input remains cleared after rotation and needs a fresh drag after Resume',()=>{
 const g=loadGame();cleanRun(g);g.el('stick').dispatch('pointerdown',{pointerId:1,clientX:135.5,clientY:662.5});g.resizeTo(915,412);g.resume();g.el('stick').dispatch('pointermove',{pointerId:1,clientX:150,clientY:662.5});const x=g.p.x;g.update(.02);assert.equal(g.p.x,x);g.el('stick').dispatch('pointerdown',{pointerId:2,clientX:135.5,clientY:662.5});g.update(.02);assert.ok(g.p.x>x);assert.equal(g.touch.id,2);
});
test('Alpha 0.76 menu and nested settings rotation never starts a run or changes storage',()=>{
 const g=loadGame({stored:'90'});const journal=g.journalSaved(),prefs=g.preferencesSaved(),best=g.saved();g.resizeTo(915,412);assert.equal(g.state.mode,'menu');g.showSettings();const ui=g.el('modal').innerHTML;g.resizeTo(412,915);g.event('freeze');assert.equal(g.state.mode,'settings');assert.equal(g.el('modal').innerHTML,ui);assert.equal(g.journalSaved(),journal);assert.equal(g.preferencesSaved(),prefs);assert.equal(g.saved(),best);
});
test('Alpha 0.76 repeated interruption and rotation add no images, record writes or world changes',()=>{
 const writes=[],g=loadGame({storageFault:({key})=>{writes.push(key)}});cleanRun(g);const before=fieldWorld56(g),images=g.pendingImages.length,count=writes.length;for(let i=0;i<8;i++){g.resizeTo(i%2?412:915,i%2?915:412);g.event('freeze');assert.equal(g.state.mode,'paused');g.resume()}assert.deepEqual(fieldWorld56(g),before);assert.equal(g.pendingImages.length,images);assert.equal(writes.length,count);assert.ok(Buffer.byteLength(html)<12*1024*1024);
});
test('Alpha 0.76 a fresh accessibility choice still works after an interruption without a pointer',()=>{
 const g=loadGame();cleanRun(g);earnUpgrade(g);g.advanceClock(500);const card=g.choices()[0];choicePointer(card,'pointerdown');interrupt76(g,'blur');card.click(0);assert.equal(g.state.mode,'play');
});

// Alpha 0.77: ten-task overnight reliability and menu batch.
function openEnd77(g){cleanRun(g);g.pause();g.el('quit').click();assert.equal(g.state.mode,'end-confirm')}
function activate77(g,id,wait=500){g.advanceClock(wait);const b=g.el(id);choicePointer(b,'pointerdown');choicePointer(b,'pointerup')}
test('Alpha 0.77 Resume appears once before Pause details and remains usable with a second finger',()=>{
 const g=loadGame();cleanRun(g);g.pause();const ui=g.el('modal').innerHTML;assert.equal((ui.match(/id="resume"/g)||[]).length,1);assert.ok(ui.indexOf('id="resume"')<ui.indexOf('RUN BUILD &amp; ENCOUNTERS'));const time=g.state.elapsed;g.el('resume').dispatch('pointerdown',{pointerId:3,isPrimary:false});assert.equal(g.state.mode,'play');near(g.state.elapsed,time);
});
test('Alpha 0.77 grouped Pause retains combat, goals, audio, references and presentation controls',()=>{
 const g=loadGame();cleanRun(g);g.pause();for(const id of ['pauseMap','pauseGuide','pauseManual','pauseSettings','quit','gunPriorityPick','favoredPick','objectivePick','medalPick','audio-masterVolume','fieldWorldCompare'])assert.ok(g.el(id),id);for(const label of ['RUN BUILD &amp; ENCOUNTERS','COMBAT &amp; OBJECTIVE OPTIONS','HELP &amp; REFERENCE'])assert.ok(g.el('modal').innerHTML.includes(label));const before=fieldWorld56(g);g.frame(50000);assert.deepEqual(fieldWorld56(g),before);
});
test('Alpha 0.77 End Run review freezes the existing world and does not write records',()=>{
 const g=loadGame();cleanRun(g);g.setup({elapsed:120});g.pause();const world=fieldWorld56(g),saved=g.journalSaved();g.el('quit').click();assert.equal(g.state.mode,'end-confirm');assert.equal(g.state.runResult,null);assert.match(g.el('modal').innerHTML,/not an extraction victory/);g.frame(50000);assert.deepEqual(fieldWorld56(g),world);assert.equal(g.journalSaved(),saved);
});
test('Alpha 0.77 Cancel and phone Back leave End Run review on Pause without auto-Resume',()=>{
 for(const kind of ['cancel','back','escape']){const g=loadGame();openEnd77(g);const world=fieldWorld56(g);if(kind==='cancel')g.el('cancelEndRun').click();else if(kind==='back')g.phoneBack();else g.event('keydown',{key:'Escape'});assert.equal(g.state.mode,'paused');assert.deepEqual(fieldWorld56(g),world);assert.equal(g.state.runResult,null);g.update(10);assert.deepEqual(fieldWorld56(g),world);}
});
test('Alpha 0.77 End Run confirmation waits for a deliberate fresh press and logs exactly once',()=>{
 const g=loadGame();openEnd77(g);const b=g.el('confirmEndRun');choicePointer(b,'pointerdown');g.advanceClock(500);choicePointer(b,'pointerup');assert.equal(g.state.mode,'end-confirm');choicePointer(b,'pointerdown');choicePointer(b,'pointerup');assert.equal(g.state.mode,'end');assert.equal(g.state.runResult.outcome,'abandoned');assert.equal(g.state.journal.totals.runs,1);b.click(0);choicePointer(b,'pointerdown');choicePointer(b,'pointerup');assert.equal(g.state.journal.totals.runs,1);
});
test('Alpha 0.77 scrolling or interrupting End Run confirmation cannot end the run',()=>{
 for(const kind of ['scroll','freeze','resize']){const g=loadGame();openEnd77(g);g.advanceClock(500);const b=g.el('confirmEndRun');choicePointer(b,'pointerdown');if(kind==='scroll')choicePointer(b,'pointermove',7,{clientY:150});else interrupt76(g,kind);choicePointer(b,'pointerup');assert.equal(g.state.mode,'end-confirm');assert.equal(g.state.runResult,null);activate77(g,'confirmEndRun');assert.equal(g.state.mode,'end');}
});
test('Alpha 0.77 training End Run stays immediate, safe and unscored',()=>{
 const g=loadGame({stored:'900'});g.startTraining('arc');g.pause();g.el('quit').click();assert.equal(g.state.mode,'end');assert.equal(g.state.runResult.training,true);assert.equal(g.saved(),'900');assert.equal(g.journalSaved(),null);
});
test('Alpha 0.77 an old canceled End Run button cannot end a resumed encounter',()=>{
 const g=loadGame();openEnd77(g);const old=g.el('confirmEndRun');g.el('cancelEndRun').click();g.resume();g.advanceClock(1000);choicePointer(old,'pointerdown');choicePointer(old,'pointerup');old.click(0);assert.equal(g.state.mode,'play');assert.equal(g.state.runResult,null);
});
test('Alpha 0.77 extraction and overtime ignore carried releases and presses begun before the opening guard',()=>{
 for(const id of ['extract','stay']){const g=loadGame();prepareExit(g);reachExit(g);const b=g.el(id);choicePointer(b,'pointerup');b.click(1);choicePointer(b,'pointerdown');g.advanceClock(500);choicePointer(b,'pointerup');assert.equal(g.state.mode,'extraction');activate77(g,id);assert.equal(g.state.mode,id==='extract'?'end':'play');assert.equal(id==='extract'?g.state.runOutcome:g.state.overtime,id==='extract'?'extracted':1);}
});
test('Alpha 0.77 scrolling and canceled extraction gestures leave both choices untouched',()=>{
 for(const cancel of ['pointermove','pointercancel','lostpointercapture']){const g=loadGame();prepareExit(g);reachExit(g);g.advanceClock(500);const b=g.el('extract');choicePointer(b,'pointerdown');choicePointer(b,cancel,7,{clientY:150});choicePointer(b,'pointerup');assert.equal(g.state.mode,'extraction');assert.equal(g.state.runOutcome,'');assert.equal(g.state.journal.totals.runs,0);}
});
test('Alpha 0.77 extraction keyboard selection is fresh and supports either option',()=>{
 for(const id of ['extract','stay'])for(const key of ['Enter',' ']){const g=loadGame();prepareExit(g);reachExit(g);g.advanceClock(500);const b=g.el(id);b.dispatch('keyup',{key});assert.equal(g.state.mode,'extraction');b.dispatch('keydown',{key});assert.equal(g.state.mode,'extraction');b.dispatch('keyup',{key});assert.equal(g.state.mode,id==='extract'?'end':'play');}
});
test('Alpha 0.77 an extraction press across background or rotation cannot finish or begin overtime',()=>{
 for(const id of ['extract','stay'])for(const kind of ['visibility','resize']){const g=loadGame();prepareExit(g);reachExit(g);g.advanceClock(500);const b=g.el(id);choicePointer(b,'pointerdown');interrupt76(g,kind);choicePointer(b,'pointerup');assert.equal(g.state.mode,'extraction');assert.equal(g.state.overtime,0);activate77(g,id);assert.equal(g.state.mode,id==='extract'?'end':'play');}
});
test('Alpha 0.77 results keyboard activation waits for keyup and cannot act twice',()=>{
 for(const key of ['Enter',' ']){const g=loadGame();finish75(g);const b=g.el('again');b.dispatch('keyup',{key});assert.equal(g.state.mode,'end');b.dispatch('keydown',{key});assert.equal(g.state.mode,'end');b.dispatch('keyup',{key});assert.equal(g.state.mode,'play');b.click(1);b.dispatch('keyup',{key});assert.equal(g.state.mode,'play');assert.equal(g.state.elapsed,0);assert.equal(g.state.journal.totals.runs,1);}
});
test('Alpha 0.77 a held results key across background cannot restart when released',()=>{
 for(const key of ['Enter',' ']){const g=loadGame(),r=finish75(g),b=g.el('again');b.dispatch('keydown',{key});interrupt76(g,'visibility');b.dispatch('keyup',{key});assert.equal(g.state.mode,'end');assert.equal(g.state.runResult,r);b.dispatch('keydown',{key});b.dispatch('keyup',{key});assert.equal(g.state.mode,'play');}
});
test('Alpha 0.77 scrolling on a results action never starts another run',()=>{
 const g=loadGame(),r=finish75(g),b=g.el('again');choicePointer(b,'pointerdown');choicePointer(b,'pointermove',7,{clientY:145});choicePointer(b,'pointerup',7,{clientY:145});assert.equal(g.state.mode,'end');assert.equal(g.state.runResult,r);choicePointer(b,'pointerdown');choicePointer(b,'pointerup');assert.equal(g.state.mode,'play');
});
test('Alpha 0.77 results focus loss cancels an armed keyboard action',()=>{
 const g=loadGame(),r=finish75(g),b=g.el('again');b.dispatch('keydown',{key:'Enter'});b.dispatch('blur');b.dispatch('keyup',{key:'Enter'});assert.equal(g.state.mode,'end');assert.equal(g.state.runResult,r);b.click(0);assert.equal(g.state.mode,'play');
});
test('Alpha 0.77 Escape returns through menus and does not resume an already paused run',()=>{
 const g=loadGame();g.showRoster();g.event('keydown',{key:'Escape'});assert.equal(g.state.mode,'menu');cleanRun(g);g.event('keydown',{key:'Escape'});assert.equal(g.state.mode,'paused');g.event('keydown',{key:'Escape'});assert.equal(g.state.mode,'paused');g.el('pauseMap').click();assert.equal(g.state.mode,'map');g.event('keydown',{key:'Escape'});assert.equal(g.state.mode,'paused');
});
test('Alpha 0.77 Escape follows guide and results return context with exact held stats',()=>{
 const g=loadGame(),r=finish75(g);g.el('endGuide').click();g.event('keydown',{key:'Escape'});assert.equal(g.state.mode,'end');assert.equal(g.state.runResult,r);g.el('endReport').click();g.event('keydown',{key:'Escape',target:{tagName:'TEXTAREA'}});assert.equal(g.state.mode,'end');assert.equal(g.state.runResult,r);
});
test('Alpha 0.77 report typing and hidden keyboard events cannot resume or change combat',()=>{
 const g=loadGame();cleanRun(g);g.pause();g.showSettings();g.showBenchmark();g.event('keydown',{key:'p',target:{tagName:'INPUT'}});g.event('keydown',{key:'q',target:{tagName:'TEXTAREA'}});assert.equal(g.state.mode,'benchmark');const charges=g.state.decoyCharges;g.document.hidden=true;g.event('keydown',{key:'Escape'});assert.equal(g.state.mode,'benchmark');assert.equal(g.state.decoyCharges,charges);
});
test('Alpha 0.77 repeated Escape does not drain menu history or accidentally confirm a choice',()=>{
 const g=loadGame();openEnd77(g);g.event('keydown',{key:'Escape',repeat:true});assert.equal(g.state.mode,'end-confirm');g.event('keydown',{key:'Escape'});assert.equal(g.state.mode,'paused');const n=g.historyInfo().length;for(let i=0;i<10;i++)g.event('keydown',{key:'Escape'});assert.equal(g.state.mode,'paused');assert.equal(g.historyInfo().length,n);assert.equal(g.state.runResult,null);
});
test('Alpha 0.77 menu and game focus follow Play, Pause and Resume without opening a keyboard field',()=>{
 const g=loadGame();assert.equal(g.document.activeElement,g.el('modal'));assert.equal(g.el('modal').attrs.tabindex,'-1');g.el('start').click();assert.equal(g.document.activeElement,g.el('modal'));g.el('deploy').click();assert.equal(g.document.activeElement,g.el('game'));assert.equal(g.el('game').attrs.tabindex,'0');g.pause();assert.equal(g.document.activeElement,g.el('modal'));g.resume();assert.equal(g.document.activeElement,g.el('game'));
});
test('Alpha 0.77 settings redraw restores focus to the same chosen control',()=>{
 const g=loadGame();g.showSettings();g.el('settingsVisuals').open=true;g.el('panel').scrollTop=320;const old=g.el('pref-shake');old.focus();old.click();const fresh=g.el('pref-shake');assert.notEqual(fresh,old);assert.equal(g.document.activeElement,fresh);assert.equal(fresh.focusOptions.preventScroll,true);assert.equal(g.state.preferences.shake,false);assert.equal(g.el('panel').scrollTop,320);assert.match(g.el('modal').innerHTML,/<details class="medal-goals" id="settingsVisuals" open>/);assert.doesNotMatch(g.preferencesSaved(),/settingsVisuals|scrollTop/);g.el('settingsVisuals').open=true;fresh.click();assert.equal(g.state.preferences.shake,true);g.el('settingsPerformance').open=true;g.el('panel').scrollTop=500;g.el('perfToggle').click();assert.match(g.el('modal').innerHTML,/<details class="medal-goals" id="settingsPerformance" open>/);assert.equal(g.el('panel').scrollTop,500);
});
test('Alpha 0.77 opening backup and returning to results never focuses a file picker automatically',()=>{
 const g=loadGame(),r=finish75(g);g.el('endBackup').click();assert.equal(g.state.mode,'backup');assert.equal(g.document.activeElement,g.el('modal'));assert.notEqual(g.document.activeElement,g.el('backupFile'));g.phoneBack();assert.equal(g.state.mode,'end');assert.equal(g.state.runResult,r);assert.equal(g.document.activeElement,g.el('modal'));
});
test('Alpha 0.77 backgrounding cancels all active effect and alert voices before audio suspension',()=>{
 const g=loadGame(),ctx=audioContextMock();cleanRun(g);g.pause();g.setSampleAudio(ctx,true);for(let i=0;i<20;i++)g.el('audioTestEffects').click();for(let i=0;i<4;i++)g.el('audioTestAlerts').click();assert.equal(g.state.activeAudioVoices,24);assert.equal(g.audioVoiceHandles(),24);g.event('pagehide');assert.equal(g.state.activeAudioVoices,0);assert.equal(g.state.effectAudioVoices,0);assert.equal(g.audioVoiceHandles(),0);assert.equal(ctx.state,'suspended');assert.ok(ctx.oscillators.every(o=>o.disconnected));
});
test('Alpha 0.77 repeated audio cleanup and late ended callbacks cannot consume fresh voice capacity',()=>{
 const g=loadGame(),ctx=audioContextMock();cleanRun(g);g.pause();g.setSampleAudio(ctx,true);g.el('audioTestEffects').click();const old=ctx.oscillators[0].onended;g.event('freeze');g.event('blur');assert.equal(g.state.activeAudioVoices,0);g.el('audioTestEffects').click();assert.equal(g.state.activeAudioVoices,1);old();old();assert.equal(g.state.activeAudioVoices,1);g.stopAudioVoices();assert.equal(g.state.activeAudioVoices,0);assert.equal(g.audioVoiceHandles(),0);
});
test('Alpha 0.77 sample cue voices release their own credit when interrupted',()=>{
 const g=loadGame(),ctx=audioContextMock();g.openHomeEntry('artOpen');g.setSampleAudio(ctx,true);for(let i=0;i<12;i++)g.sampleSound('gun');assert.equal(g.state.sampleAudioVoices,6);g.event('pagehide');assert.equal(g.state.sampleAudioVoices,0);assert.equal(g.state.activeAudioVoices,0);assert.equal(g.audioVoiceHandles(),0);ctx.finish();assert.equal(g.state.sampleAudioVoices,0);
});
test('Alpha 0.77 hidden generic menu taps and accessibility clicks cannot navigate',()=>{
 const g=loadGame(),b=g.el('start');g.document.hidden=true;b.click(0);b.dispatch('pointerdown',{pointerId:2});assert.equal(g.state.mode,'menu');g.document.hidden=false;b.click(0);assert.equal(g.state.mode,'roster');
});
test('Alpha 0.77 hidden Pause actions cannot resume or open End Run confirmation',()=>{
 const g=loadGame();cleanRun(g);g.pause();g.document.hidden=true;g.el('resume').click();g.el('quit').dispatch('pointerdown',{pointerId:3});assert.equal(g.state.mode,'paused');g.document.hidden=false;g.el('quit').click();assert.equal(g.state.mode,'end-confirm');
});
test('Alpha 0.77 hidden backup download actions do not create a file or alter records',()=>{
 const g=loadGame({stored:'90'});g.showBackup();g.document.hidden=true;g.el('backupDownload').click();g.el('backupDownload').dispatch('pointerdown',{pointerId:2});assert.equal(g.downloads().length,0);assert.equal(g.saved(),'90');g.document.hidden=false;g.el('backupDownload').click();assert.equal(g.downloads().length,1);
});
test('Alpha 0.77 combined pause inspection, canceled end, extraction and results retain native accounting',()=>{
 const g=loadGame();prepareExit(g);const before=g.state.journal.totals.runs;g.pause();g.el('quit').click();g.phoneBack();assert.equal(g.state.mode,'paused');g.el('pauseSettings').click();g.closeSettings();g.resume();reachExit(g);chooseExitForTest(g,'extract');assert.equal(g.state.runResult.outcome,'extracted');assert.equal(g.state.journal.totals.runs,before+1);assert.equal(g.state.journal.totals.extractions,1);assert.equal(g.state.journal.history.length,1);assert.equal(g.state.runRecordSaved,true);
});

// Alpha 0.78: unscored native exit/overtime practice.
function enterExit78(g){g.showTraining();g.advanceClock(500);const b=g.el('drill-extraction');assert.ok(b);choicePointer(b,'pointerdown');choicePointer(b,'pointerup');assert.equal(g.state.trainingScenario,'extraction');assert.equal(g.state.mode,'play');return g}
function reachExit78(g){const b=g.state.exitBeacon;assert.ok(b);Object.assign(g.p,{x:b.x,y:b.y,fireClock:Infinity});g.update(.001);assert.equal(g.state.mode,'extraction')}
test('Alpha 0.78 exit practice is a deliberate Training entry and starts immediately with a beacon',()=>{
 const g=loadGame();g.showTraining();const b=g.el('drill-extraction');choicePointer(b,'pointerup');b.click(1);assert.equal(g.state.mode,'training-menu');g.advanceClock(500);choicePointer(b,'pointerdown');choicePointer(b,'pointerup');assert.equal(g.state.training,true);assert.equal(g.state.trainingScenario,'extraction');assert.ok(g.state.exitBeacon);assert.equal(g.state.elapsed,0);
});
test('Alpha 0.78 exit practice needs no synthetic boss defeat and spawns only four safe stationary targets',()=>{
 const g=enterExit78(loadGame());assert.equal(g.state.bossesDefeated,0);assert.equal(g.state.activeBoss,null);assert.equal(g.state.enemies.length,4);assert.ok(g.state.enemies.every(e=>e.trainingDummy&&e.hp===300&&e.speed===0&&e.dmg===0));assert.equal(g.state.nextBossAt,Infinity);assert.equal(g.state.nextRushAt,Infinity);assert.equal(g.state.nextRescueAt,Infinity);g.hurtPlayer(1000,'contact');assert.equal(g.p.hp,g.p.max);
});
test('Alpha 0.78 HUD and choice coaching distinguish the ten-second drill from normal timed runs',()=>{
 const g=enterExit78(loadGame());assert.match(g.el('objective').textContent,/EXIT PRACTICE.*UNSCORED/);assert.match(g.el('runGoal').textContent,/REACH GREEN/);reachExit78(g);const ui=g.el('modal').innerHTML;assert.match(ui,/EXIT PRACTICE · UNSCORED/);assert.match(ui,/10 active seconds/);assert.match(ui,/03:00/);assert.match(ui,/at least 60 seconds/);assert.doesNotMatch(ui,/chase a longer record/);chooseExitForTest(g,'stay');g.pause();g.el('pauseGuide').click();assert.match(g.el('modal').innerHTML,/Exit practice starts with an immediate beacon/);assert.match(g.el('modal').innerHTML,/10 active seconds/);g.closeQuickGuide();const pick=g.el('trainingScenarioPick');pick.value='targets';pick.dispatch('change');g.el('pauseGuide').click();assert.match(g.el('modal').innerHTML,/no timed street encounters or extraction/);
});
test('Alpha 0.78 reaching the practice beacon uses native frozen choices and clears held input',()=>{
 const g=enterExit78(loadGame());g.keys.d=true;g.touch.x=1;reachExit78(g);const world=fieldWorld56(g),time=g.state.elapsed;assert.equal(Object.keys(g.keys).length,0);assert.equal(g.touch.x,0);g.frame(100000);assert.deepEqual(fieldWorld56(g),world);assert.equal(g.state.elapsed,time);
});
test('Alpha 0.78 practice extraction ends on held unscored stats without saving victory, medals or discoveries',()=>{
 const g=loadGame({stored:'900',journalStored:journalData('scout',{totals:{runs:2}})}),saved=g.journalSaved(),prefs=g.preferencesSaved();enterExit78(g);reachExit78(g);chooseExitForTest(g,'extract');const r=g.state.runResult;assert.equal(r.training,true);assert.equal(r.practice.scenario,'extraction');assert.equal(r.outcome,'extracted');assert.match(g.el('modal').innerHTML,/EXIT PRACTICE<br>COMPLETE/);assert.match(g.runReportText(),/TRAINING · UNSCORED · NOT SAVED/);assert.match(g.runReportText(),/10-second practice return/);assert.equal(g.earnedMedals(r).length,0);assert.equal(r.newDiscoveries.length,0);assert.equal(g.journalSaved(),saved);assert.equal(g.preferencesSaved(),prefs);assert.equal(g.saved(),'900');assert.equal(g.state.journal.totals.runs,2);
});
test('Alpha 0.78 Stay demonstrates native landing clear and protection with practice-only target credit',()=>{
 const g=enterExit78(loadGame({stored:'900'}));reachExit78(g);const hp=g.p.hp;chooseExitForTest(g,'stay');assert.equal(g.state.mode,'play');assert.equal(g.state.overtime,1);assert.equal(g.state.enemies.length,0);assert.equal(g.practiceSnapshot().targets,4);assert.equal(g.state.killCount,0);assert.equal(g.state.gems.length,0);assert.equal(g.state.xp,0);assert.equal(g.p.hp,hp);near(g.p.inv,g.exitReturnTuning.shield);near(g.state.reliefUntil,g.state.elapsed+g.exitReturnTuning.breather);assert.equal(g.saved(),'900');assert.equal(g.journalSaved(),null);
});
test('Alpha 0.78 a new practice exit opens after ten active seconds without Blackout or rescue events',()=>{
 const g=enterExit78(loadGame());reachExit78(g);chooseExitForTest(g,'stay');const at=g.state.exitAt;assert.match(g.el('runGoal').textContent,/NEXT PRACTICE EXIT IN 10s/);assert.equal(g.state.nextRushAt,Infinity);assert.equal(g.state.nextRescueAt,Infinity);g.update(9.9);assert.equal(g.state.exitBeacon,null);g.update(.11);assert.ok(g.state.exitBeacon);assert.equal(g.state.enemies.length,4);assert.ok(g.state.elapsed>=at);assert.equal(g.state.rushPhase,'waiting');assert.equal(g.state.rescue,null);assert.equal(g.state.activeBoss,null);
});
test('Alpha 0.78 Pause and background do not consume the practice return countdown',()=>{
 const g=enterExit78(loadGame());reachExit78(g);chooseExitForTest(g,'stay');g.update(2);g.pause();const time=g.state.elapsed,due=g.state.exitAt;g.frame(100000);g.document.hidden=true;g.event('visibilitychange');g.document.hidden=false;g.event('visibilitychange');assert.equal(g.state.mode,'paused');assert.equal(g.state.elapsed,time);assert.equal(g.state.exitAt,due);assert.equal(g.state.exitBeacon,null);g.resume();g.update(8.01);assert.ok(g.state.exitBeacon);
});
test('Alpha 0.78 repeated practice overtime stays bounded and never earns normal records or XP',()=>{
 const g=enterExit78(loadGame({stored:'900'}));for(let i=0;i<4;i++){reachExit78(g);chooseExitForTest(g,'stay');assert.equal(g.state.overtime,i+1);assert.equal(g.state.enemies.length,0);g.update(10.01);assert.equal(g.state.enemies.length,4);assert.equal(g.state.activeBoss,null);assert.equal(g.state.nextRushAt,Infinity);assert.equal(g.state.bossesDefeated,0)}assert.equal(g.state.killCount,0);assert.equal(g.state.gems.length,0);assert.equal(g.state.journal.totals.runs,0);assert.equal(g.saved(),'900');
});
test('Alpha 0.78 Reset Exit moves the fixture around the current position and keeps it paused',()=>{
 const g=enterExit78(loadGame());reachExit78(g);chooseExitForTest(g,'stay');Object.assign(g.p,{x:500,y:600});g.pause();assert.match(g.el('trainingReset').textContent||g.el('modal').innerHTML,/RESET EXIT HERE/);g.el('trainingReset').click();assert.equal(g.state.mode,'paused');assert.ok(g.state.exitBeacon.x>500);assert.ok(g.state.exitBeacon.y<600);assert.equal(g.state.overtime,0);assert.equal(g.practiceSnapshot().targets,0);assert.equal(g.practiceSnapshot().time,0);assert.equal(g.state.enemies.length,4);assert.equal(g.state.nextRushAt,Infinity);
});
test('Alpha 0.78 changing away before Stay clears the practice beacon and keeps the old drill behavior',()=>{
 const g=enterExit78(loadGame());g.pause();const pick=g.el('trainingScenarioPick');pick.value='spitter';pick.dispatch('change');assert.equal(g.state.mode,'paused');assert.equal(g.state.trainingScenario,'spitter');assert.equal(g.state.exitBeacon,null);assert.equal(g.state.exitAt,Infinity);assert.equal(g.state.overtime,0);assert.equal(g.state.enemies.filter(e=>e.spitter).length,1);g.resume();g.update(30);assert.equal(g.state.exitBeacon,null);
});
test('Alpha 0.78 changing away after Stay clears the pending return and overtime',()=>{
 const g=enterExit78(loadGame());reachExit78(g);chooseExitForTest(g,'stay');g.pause();const pick=g.el('trainingScenarioPick');pick.value='targets';pick.dispatch('change');assert.equal(g.state.trainingScenario,'targets');assert.equal(g.state.exitBeacon,null);assert.equal(g.state.exitAt,Infinity);assert.equal(g.state.overtime,0);assert.equal(g.state.enemies.length,4);g.resume();g.update(11);assert.equal(g.state.exitBeacon,null);assert.equal(g.state.nextRushAt,Infinity);
});
test('Alpha 0.78 the existing paused scenario selector can enter Exit practice without resuming',()=>{
 const g=loadGame();g.startTraining('arc');g.pause();const pick=g.el('trainingScenarioPick');pick.value='extraction';pick.dispatch('change');assert.equal(g.state.mode,'paused');assert.equal(g.state.trainingScenario,'extraction');assert.ok(g.state.exitBeacon);assert.equal(g.state.enemies.length,4);assert.equal(g.p.arc,3);assert.equal(g.state.bossesDefeated,0);
});
test('Alpha 0.78 all existing weapon paths and evolution changes reset Exit practice safely',()=>{
 for(const id of ['pierce','arc','blades','molotov']){const g=enterExit78(loadGame());reachExit78(g);chooseExitForTest(g,'stay');g.pause();g.configureTrainingWeapon(id,true);assert.equal(g.state.mode,'paused');assert.equal(g.state.trainingScenario,'extraction');assert.ok(g.state.exitBeacon);assert.equal(g.state.overtime,0);assert.equal(g.p[id],3);assert.equal(g.practiceSnapshot().targets,0);assert.equal(g.state.gems.length,0);assert.equal(g.state.enemies.length,4);}
});
test('Alpha 0.78 Restart from held results replays Exit practice with a fresh clock and immediate beacon',()=>{
 const g=enterExit78(loadGame());reachExit78(g);chooseExitForTest(g,'extract');g.el('again').click();assert.equal(g.state.mode,'play');assert.equal(g.state.trainingScenario,'extraction');assert.equal(g.state.elapsed,0);assert.equal(g.state.overtime,0);assert.ok(g.state.exitBeacon);assert.equal(g.state.runResult,null);assert.equal(g.state.enemies.length,4);
});
test('Alpha 0.78 normal deployment restores chosen setup and original boss, Blackout and extraction schedules',()=>{
 const g=loadGame();g.showRoster();g.selectSurvivor('scout');g.selectRoute('market');g.selectRule('glass');g.selectContract('patrol');const saved=g.journalSaved();enterExit78(g);assert.equal(g.state.runSurvivor,'survivor');assert.equal(g.state.selectedSurvivor,'scout');reachExit78(g);chooseExitForTest(g,'extract');g.el('resultMenu').click();g.flushHistory();g.el('start').click();g.el('deploy').click();assert.equal(g.state.training,false);assert.equal(g.state.runSurvivor,'scout');assert.equal(g.state.runRoute,'market');assert.equal(g.state.runRule,'glass');assert.equal(g.state.runContract,'patrol');assert.equal(g.state.elapsed,0);assert.equal(g.state.nextBossAt,90);assert.equal(g.state.nextRushAt,45);assert.equal(g.state.exitAt,180);assert.equal(g.state.exitBeacon,null);assert.equal(g.p.pierce,0);assert.equal(g.journalSaved(),saved);
});
test('Alpha 0.78 hidden or stale Training entry presses cannot create an Exit session',()=>{
 const g=loadGame();g.showTraining();g.advanceClock(500);const old=g.el('drill-extraction');g.document.hidden=true;choicePointer(old,'pointerdown');choicePointer(old,'pointerup');assert.equal(g.state.mode,'training-menu');g.document.hidden=false;g.el('trainingBack').click();choicePointer(old,'pointerdown');choicePointer(old,'pointerup');old.click(0);assert.equal(g.state.mode,'roster');assert.equal(g.state.training,false);
});
test('Alpha 0.78 held Exit results and captured report stay frozen through settings, Back and rotation',()=>{
 const g=enterExit78(loadGame());reachExit78(g);chooseExitForTest(g,'extract');const r=g.state.runResult,sheet=g.el('modal').innerHTML,report=g.runReportText(),saved=g.journalSaved();g.el('endSettings').click();g.resizeTo(915,412);g.phoneBack();g.frame(100000);assert.equal(g.state.mode,'end');assert.equal(g.state.runResult,r);assert.equal(g.el('modal').innerHTML,sheet);assert.equal(g.runReportText(),report);assert.equal(g.journalSaved(),saved);g.placeTrainingExit();assert.equal(g.state.runResult,r);
});
test('Alpha 0.78 original weapon, boss and main performance practice never acquire an exit fixture',()=>{
 for(const scenario of ['targets','breaker','warden','harvester','spitter','riot','howler','lobber','hunter']){const g=loadGame();g.startTraining('pierce',false,scenario);assert.equal(g.state.exitBeacon,null);assert.equal(g.state.exitAt,Infinity);assert.equal(g.state.overtime,0);assert.equal(g.state.trainingScenario,scenario)}const g=enterMain73(loadGame(),'overtime');assert.equal(g.state.exitBeacon,null);assert.equal(g.state.enemies.length,220);assert.equal(g.mainPerfState().id,'overtime');g.end('abandoned');assert.equal(g.earnedMedals(g.state.runResult).length,0);
});
test('Alpha 0.78 practice helper cannot unlock an exit in normal play and backup format remains intact',()=>{
 const g=loadGame({stored:'900'});cleanRun(g);const before=fieldWorld56(g);g.placeTrainingExit();assert.deepEqual(fieldWorld56(g),before);assert.equal(g.state.exitBeacon,null);assert.equal(g.state.exitAt,180);const packet=JSON.parse(g.backupText());assert.equal(packet.format,1);assert.deepEqual(Object.keys(packet).sort(),['format','game','journal','record']);assert.equal(packet.record,900);
});

// Alpha 0.81: the paused briefing must describe the real gates without altering them.
test('Alpha 0.81 pause briefing freezes its run snapshot and cannot grant extraction or write records',()=>{
 const g=loadGame({stored:'900'});cleanRun(g);g.setup({elapsed:92,killCount:31});g.p.hp=64.25;
 const before=JSON.stringify({p:g.p,time:g.state.elapsed,kills:g.state.killCount,enemies:g.state.enemies,journal:g.journalSaved(),record:g.saved(),prefs:g.preferencesSaved()});
 g.pause();const sheet=g.el('modal').innerHTML;assert.match(sheet,/65 \/ 100/);assert.match(sheet,/01:28 until 03:00 extraction/);assert.match(sheet,/Defeat at least one boss/);assert.equal(g.state.exitBeacon,null);
 g.update(30);assert.equal(g.el('modal').innerHTML,sheet);assert.equal(JSON.stringify({p:g.p,time:g.state.elapsed,kills:g.state.killCount,enemies:g.state.enemies,journal:g.journalSaved(),record:g.saved(),prefs:g.preferencesSaved()}),before);
});
test('Alpha 0.81 boss checklist changes to an open exit only after the native boss defeat and unlock',()=>{
 const g=loadGame();cleanRun(g);g.scheduleRush(Infinity);g.setup({elapsed:180,nextBossAt:1000});g.spawnBoss();g.updateExtractionWindow();assert.equal(g.state.exitBeacon,null);g.pause();assert.match(g.el('modal').innerHTML,/defeat the active BREAKER/);assert.match(g.el('modal').innerHTML,/Time reached/);
 g.resume();g.hitEnemy(g.state.activeBoss,9999);g.updateExtractionWindow();assert.ok(g.state.exitBeacon);g.pause();assert.match(g.el('modal').innerHTML,/GREEN EXIT OPEN/);assert.doesNotMatch(g.el('modal').innerHTML,/id="pauseExit"[^]*EXTRACTION CHECKLIST/);
});
for(const phase of ['warning','active'])test(`Alpha 0.81 ${phase} Blackout remains an extraction blocker in the native window and paused checklist`,()=>{
 const g=loadGame();cleanRun(g);g.setup({elapsed:180,bossesDefeated:1,nextBossAt:1000});g.scheduleRush(phase==='warning'?184:180);g.updateRush(.01);assert.equal(g.state.rushPhase,phase);g.updateExtractionWindow();assert.equal(g.state.exitBeacon,null);
 g.pause();assert.match(g.el('modal').innerHTML,/finish the Blackout/);assert.match(g.el('modal').innerHTML,/Boss requirement met/);g.resume();g.scheduleRush(Infinity);g.updateExtractionWindow();assert.ok(g.state.exitBeacon);g.pause();assert.match(g.el('modal').innerHTML,/GREEN EXIT OPEN/);
});
test('Alpha 0.81 ordinary horde leaves the native open exit available and the paused directions agree',()=>{
 const g=loadGame();prepareExit(g);g.setup({enemies:Array.from({length:20},(_,i)=>enemy({x:1000+i*40,hp:100}))});g.pause();assert.match(g.el('modal').innerHTML,/GREEN EXIT OPEN/);assert.match(g.el('modal').innerHTML,/do not need to clear the ordinary horde/);assert.equal(g.state.enemies.length,20);
 g.resume();reachExit(g);chooseExitForTest(g,'extract');assert.equal(g.state.runResult.outcome,'extracted');
});
test('Alpha 0.81 overtime checklist uses the native next exit time and keeps the completed boss requirement',()=>{
 const g=loadGame();prepareExit(g);reachExit(g);chooseExitForTest(g,'stay');g.pause();const sheet=g.el('modal').innerHTML;assert.match(sheet,/NEXT EXIT CHECKLIST/);assert.match(sheet,/01:00 until the next exit/);assert.match(sheet,/Boss requirement met/);assert.equal(g.state.overtime,1);assert.equal(g.state.exitBeacon,null);
});
test('Alpha 0.81 practice briefing cannot claim scored extraction or synthetic survival time',()=>{
 const g=enterExit78(loadGame({stored:'900'}));g.pause();assert.match(g.el('modal').innerHTML,/Exit practice/);assert.match(g.el('modal').innerHTML,/PRACTICE CLOCK/);assert.doesNotMatch(g.el('modal').innerHTML,/id="pauseExit"/);assert.equal(g.saved(),'900');
 const perf=enterMain73(loadGame(),'overtime');perf.setup({elapsed:perf.mainPerfState().startedAt+7});perf.pause();assert.match(perf.el('modal').innerHTML,/<strong>00:07<\/strong><small>TEST ACTIVE/);assert.doesNotMatch(perf.el('modal').innerHTML,/id="pauseExit"/);assert.equal(perf.state.runLogged,false);
});

// Alpha 0.85: compare read-only previews with the existing native option effects.
for(const [name,field] of [['Piercing Rounds','pierce'],['Chain Lightning','arc'],['Orbiting Blades','blades'],['Molotov','molotov']])test('Alpha 0.85 rank preview follows '+name+' without equipping it',()=>{
 const g=loadGame();cleanRun(g);const option=g.opts.find(o=>o.name===name);
 for(let rank=0;rank<3;rank++){g.p[field]=rank;const before=JSON.stringify(g.p);assert.equal(g.upgradeImpact(option),`RANK ${rank}/3 → ${rank+1}/3`);assert.equal(JSON.stringify(g.p),before);option.apply();assert.equal(g.p[field],rank+1)}
 assert.equal(option.available(),false);
});
test('Alpha 0.85 evolution previews retain the native rank gate and never evolve on reading',()=>{
 const g=loadGame();cleanRun(g);
 for(const [name,rank,flag] of [['Railstorm','pierce','rail'],['Thunderweb','arc','thunder'],['Reaper Ring','blades','reaper'],['Wildfire','molotov','wildfire']]){const option=g.opts.find(o=>o.name==='Evolve: '+name);g.p[rank]=2;assert.equal(option.available(),false);g.p[rank]=3;assert.equal(option.available(),true);assert.equal(g.upgradeImpact(option),'RANK 3/3 → EVOLVED');assert.equal(g.p[flag],false);option.apply();assert.equal(g.p[flag],true);assert.equal(option.available(),false)}
});
for(const [name,label,read,unit] of [
 ['Rapid Fire','Gun volleys/s',g=>1/g.p.fire,''],['Heavy Rounds','Weapon base damage',g=>g.p.damage,''],['Runner','Move speed',g=>g.p.speed,''],['Multishot','Bullets/volley',g=>g.p.proj,''],['Salvager','XP pickup range',g=>g.p.magnet,''],['Regeneration','Recovery',g=>g.p.regen,' HP/s'],['Velocity','Base bullet speed',g=>g.p.bulletSpeed,''],['Armor Plating','Hit reduction',g=>g.p.armor,''],['Dash Capacitor','Dash recharge',g=>g.dashCooldown(),'s'],['Decoy Pouch','Decoy charges',g=>g.state.decoyCharges,'']
])test('Alpha 0.85 '+name+' preview agrees with its actual native effect',()=>{
 const g=loadGame();cleanRun(g);const option=g.opts.find(o=>o.name===name),before=read(g),snapshot=JSON.stringify({p:g.p,charges:g.state.decoyCharges});assert.ok(!option.available||option.available());const text=g.upgradeImpact(option);assert.equal(JSON.stringify({p:g.p,charges:g.state.decoyCharges}),snapshot);option.apply();const digits=unit==='s'?2:1,n=v=>Number(v.toFixed(digits));assert.equal(text,`${label}: ${n(before)} → ${n(read(g))}${unit}`);
});
for(const hp of [5,95,100])test('Alpha 0.85 Field Medic preview agrees with native HP/max changes at '+hp+' HP',()=>{
 const g=loadGame();cleanRun(g);g.p.hp=hp;const option=g.opts.find(o=>o.name==='Field Medic'),max=g.p.max,text=g.upgradeImpact(option);assert.equal(g.p.hp,hp);assert.equal(g.p.max,max);option.apply();assert.equal(text,`Max HP: ${max} → ${g.p.max} · HP: ${hp} → ${g.p.hp}`);assert.ok(g.p.hp<=g.p.max);
});
test('Alpha 0.85 rate and bullet previews respect the native last-step caps',()=>{
 const g=loadGame();cleanRun(g);g.p.fire=.076;g.p.proj=4;const rapid=g.opts.find(o=>o.name==='Rapid Fire'),multi=g.opts.find(o=>o.name==='Multishot');assert.equal(g.upgradeImpact(rapid),'Gun volleys/s: 13.2 → 13.3');assert.equal(g.upgradeImpact(multi),'Bullets/volley: 4 → 5');rapid.apply();multi.apply();near(g.p.fire,.075);assert.equal(g.p.proj,5);assert.equal(rapid.available(),false);assert.equal(multi.available(),false);
});
test('Alpha 0.85 dash preview uses each survivor current recharge and rank',()=>{
 for(const survivor of ['survivor','scout','courier']){const g=loadGame();g.showRoster();g.selectSurvivor(survivor);g.start();const option=g.opts.find(o=>o.name==='Dash Capacitor');for(let rank=0;rank<2;rank++){const before=g.dashCooldown(),text=g.upgradeImpact(option);option.apply();assert.equal(text,`Dash recharge: ${Number(before.toFixed(2))} → ${Number(g.dashCooldown().toFixed(2))}s`)}assert.equal(option.available(),false)}
});
test('Alpha 0.85 inspecting cards preserves stats, clocks, records and random offers',()=>{
 const a=loadGame({seed:8501}),b=loadGame({seed:8501});cleanRun(a);cleanRun(b);earnUpgrade(a);earnUpgrade(b);const snapshot=g=>JSON.stringify({p:g.p,time:g.state.elapsed,xp:g.state.xp,next:g.state.nextXp,bonus:g.state.bonusChoices,kinds:g.state.bonusKinds,rerolls:g.state.rerollsLeft,banishes:g.state.banishesLeft,journal:g.journalSaved(),prefs:g.preferencesSaved()}),before=snapshot(a);
 for(let i=0;i<4;i++){for(const o of a.opts.filter(o=>!o.available||o.available()))a.upgradeImpact(o);a.showUpgradeChoices(a.state.upgradeOffer.picks);a.update(20)}assert.equal(snapshot(a),before);assert.deepEqual(Array.from(offerNames(a)),Array.from(offerNames(b)));a.choose(0);b.choose(0);earnUpgrade(a);earnUpgrade(b);assert.deepEqual(Array.from(offerNames(a)),Array.from(offerNames(b)));assert.equal(snapshot(a),snapshot(b));
});
