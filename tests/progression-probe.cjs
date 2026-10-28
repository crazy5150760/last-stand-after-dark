// Reproducible balance observations, not a player skill or phone-performance test.
// Run: node tests/progression-probe.cjs
// Compare a previous HTML: LS_GAME_HTML=/tmp/accepted.html node tests/progression-probe.cjs
// Uses native Survivor/Downtown/Standard without a contract or stat/invulnerability edits.
// Reads full world positions, including off-screen objects.
// At 30 updates/s: seek closest XP, repel nearby enemies, Dash within 60 units.
// Prioritize one weapon and its evolution, then common gun/healing supports, else first offer.
// No deliberate optional-objective pursuit; incidental rewards and Blackouts still occur.
// Stops at 180 seconds or the first non-play/non-upgrade screen; does not navigate extraction.
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const harness=readFileSync(join(__dirname,'game.test.cjs'),'utf8').split("\ntest('small joystick")[0].replace('advanceStreetAnimations,streetMotionFor,streetHeading,primeStreetAnimations,','').replace('showStreetPrototype,startStreetPrototype,streetProject,streetUnproject,streetDirection,streetResolveBody,streetBlocked,streetFrame,streetActorInfo,streetDrawQueue,streetBuildingAlpha,renderStreetPrototype,streetBlocks:STREET_BLOCKS,','').replace('streetSession,streetAngled,','').replace('syncBackgroundMusic,stopBackgroundMusic,','').replace('musicTrack,','').replace('sound,cleanAudioLevel,audioOutputLevel,applyAudioMix,','').replace('audioMix,activeAudioVoices,effectAudioVoices,','').replace('renderPlayerGun,sampleArtworkReady,ensureSampleArtwork,sampleSpriteFrame,drawSampleSprite,','').replace('sampleArtwork,','').replace('setSampleAudio(ctx,on){audioCtx=ctx;musicOn=on},','').replace('showArtSample,sampleLookActive,sampleEnemyKind,drawSamplePerson,paintSampleStreet,sampleCuePlan,sampleSound,playStyleAudio,','').replace('artSession,artLook,sampleAudioVoices,','').replace('renderGems,recordPerformanceFrame,performanceSnapshot,togglePerformance,resetPerformance,showBenchmark,benchmarkText,downloadBenchmark,','').replace('buildProgressSnapshot,cleanBuildProgress,buildProgressPanel,buildProgressLines,','').replace('diagnostics,benchmarkCapture,','');
if(!harness.includes('function loadGame('))throw Error('Test harness boundary changed');
const loadGame=new Function('require','__dirname',harness+'\nreturn loadGame;')(require,__dirname);
for(const seed of [101,202,303])for(const path of ['pierce','arc','blades','molotov']){
 const g=loadGame({seed});g.start();let choices=[],first=null,rank3=null,evolved=null;
 for(let step=0;step<180*30&&g.state.mode!=='end';step++){
  while(g.state.mode==='upgrade'){
   const offer=g.state.upgradeOffer;let index=offer.picks.findIndex(o=>o.weapon===path||o.evolution&&g.evolutions.some(e=>e.field===o.evolution&&e.weapon===path));
   if(index<0)index=offer.picks.findIndex(o=>['Heavy Rounds','Rapid Fire','Regeneration','Field Medic','Multishot'].includes(o.name));if(index<0)index=0;
   choices.push({at:+g.state.elapsed.toFixed(1),name:offer.picks[index].name,bonus:offer.reward||false});g.choose(index);if(first===null)first=g.state.elapsed;
   if(g.p[path]===3&&rank3===null)rank3=g.state.elapsed;const evo=g.evolutions.find(e=>e.weapon===path);if(g.p[evo.field]&&evolved===null)evolved=g.state.elapsed;
  }
  if(g.state.mode!=='play')break;
  const near=g.state.enemies.filter(e=>e.hp>0).sort((a,b)=>Math.hypot(a.x-g.p.x,a.y-g.p.y)-Math.hypot(b.x-g.p.x,b.y-g.p.y));
  const gems=g.state.gems;const target=gems.reduce((best,a)=>!best||Math.hypot(a.x-g.p.x,a.y-g.p.y)<Math.hypot(best.x-g.p.x,best.y-g.p.y)?a:best,null);
  let mx=target?target.x-g.p.x:Math.cos(step/120)*200,my=target?target.y-g.p.y:Math.sin(step/120)*200;let len=Math.hypot(mx,my)||1;mx/=len;my/=len;
  for(const e of near){const dx=g.p.x-e.x,dy=g.p.y-e.y,d=Math.hypot(dx,dy)||1;if(d<110){const force=(110-d)/35;mx+=dx/d*force;my+=dy/d*force;}}
  len=Math.hypot(mx,my)||1;g.touch.x=mx/len;g.touch.y=my/len;if(near[0]&&Math.hypot(near[0].x-g.p.x,near[0].y-g.p.y)<60)g.dash();g.update(1/30);
 }
 console.log(JSON.stringify({seed,path,time:+g.state.elapsed.toFixed(1),hp:+g.p.hp.toFixed(1),kills:g.state.killCount,first:first&&+first.toFixed(1),rank3:rank3&&+rank3.toFixed(1),evolved:evolved&&+evolved.toFixed(1),level:g.state.level,xp:g.state.xp,nextXp:g.state.nextXp,onStreet:g.state.gems.reduce((n,a)=>n+a.value,0),choices}));
}
