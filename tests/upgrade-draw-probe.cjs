// Frozen-pool native offer sampling; measures draw frequencies, not player balance.
// Compare with LS_GAME_HTML=/path/to/baseline.html. Does not apply cards or edit RNG.
const {readFileSync}=require('node:fs'),{join}=require('node:path'),assert=require('node:assert/strict');
const harness=readFileSync(join(__dirname,'game.test.cjs'),'utf8').split("\ntest('small joystick")[0];
const loadGame=new Function('require','__dirname',harness+'\nreturn loadGame;')(require,__dirname);
for(const stage of ['owned-lightning','ready-thunderweb']){
 const g=loadGame({seed:4801});g.start();g.p.arc=stage==='owned-lightning'?1:3;g.setup({level:4});const draws=6000,counts={},pool=g.opts.filter(o=>!o.available||o.available());for(const o of pool)counts[o.name]=0;
 const before=JSON.stringify({p:g.p,journal:g.journalSaved(),preferences:g.preferencesSaved(),time:g.state.elapsed});let noWeapon=0;const samples=[];
 for(let i=0;i<draws;i++){const picks=g.upgradeChoices();assert.equal(picks.length,3);assert.equal(new Set(picks).size,3);for(const o of picks){assert.ok(o.name in counts);counts[o.name]++}if(picks.every(o=>!o.weapon&&!o.evolution))noWeapon++;if(i<12)samples.push(picks.map(o=>o.name))}
 assert.equal(JSON.stringify({p:g.p,journal:g.journalSaved(),preferences:g.preferencesSaved(),time:g.state.elapsed}),before);
 console.log(JSON.stringify({stage,draws,eligible:pool.length,expectedUniformCardRate:3/pool.length,counts,noWeapon,samples}));
}
