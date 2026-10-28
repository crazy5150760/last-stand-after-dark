// Deterministic native intersection observations, not a phone-performance test.
// Run: node tests/intersection-probe.cjs
// Previous build: LS_GAME_HTML=/path/to/accepted.html node tests/intersection-probe.cjs
// Three seeds, two orientations, ten seconds at 30 updates/s; fixed screen input
// and two native Dashes. No HP/damage/invulnerability/stat changes or art renders.
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const harness=readFileSync(join(__dirname,'game.test.cjs'),'utf8').split("\ntest('small joystick")[0].replace('advanceStreetAnimations,streetMotionFor,streetHeading,primeStreetAnimations,','');
if(!harness.includes('function loadGame('))throw Error('Harness boundary changed');
const loadGame=new Function('require','__dirname',harness+'\nreturn loadGame;')(require,__dirname);
for(const seed of [101,202,303])for(const [width,height] of [[412,915],[915,412]]){
 const g=loadGame({seed,width,height});g.openHomeEntry('streetOpen');g.advanceClock(500);g.el('streetEnter').click();
 if(!g.state.streetSession)throw Error('Intersection did not start');
 for(let i=0;i<300;i++){g.touch.x=Math.cos(i/45)*.7;g.touch.y=Math.sin(i/45)*.7;if(i===75||i===180)g.dash();g.update(1/30)}
 console.log(JSON.stringify({seed,width,height,p:g.p,enemies:g.state.enemies,bullets:g.state.bullets,barrels:g.state.barrels,particles:g.state.particles,time:g.state.elapsed,practice:g.practiceSnapshot(),journal:g.journalSaved(),preferences:g.preferencesSaved()}));
}
