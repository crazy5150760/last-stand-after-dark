// Local release-workflow verification using the existing VM harness.
// This does not launch a browser or measure device performance.
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),baseline=process.argv[2],output=process.argv[3];
assert.ok(baseline&&output,'Usage: node tools/release_check.cjs BASELINE_HTML OUTPUT_JSON');
const target=path.join(root,'dist/index.html'),parts=fs.readFileSync(path.join(root,'tests/game.test.cjs'),'utf8').split("\ntest('small joystick");
assert.equal(parts.length,2,'VM harness anchor must remain unique');const harness=parts[0];
assert.notEqual(path.resolve(output),target,'Output must not replace the game');
assert.notEqual(path.resolve(output),path.resolve(baseline),'Output must not replace the baseline');
function loader(file){
 const previous=process.env.LS_GAME_HTML;process.env.LS_GAME_HTML=file;
 try{return new Function('require','__dirname',harness+'\nreturn loadGame;')(require,path.join(root,'tests'))}
 finally{if(previous===undefined)delete process.env.LS_GAME_HTML;else process.env.LS_GAME_HTML=previous}
}
const current=loader(target),older=loader(path.resolve(baseline)),checks=[];
const plain=value=>JSON.parse(JSON.stringify(value));
function press(g,id){const b=g.el(id);assert.ok(b,id);g.advanceClock(500);for(const event of ['pointerdown','pointerup'])b.dispatch(event,{pointerId:812,clientX:100,clientY:100,isPrimary:false})}
function review(g,text){g.showBackup();g.el('backupImport').value=text;g.el('backupReview').click();assert.ok(g.state.pendingRestore)}
function arrive(g){const b=g.state.exitBeacon;assert.ok(b);const from={x:g.p.x,y:g.p.y};g.p.x=b.x;g.p.y=b.y;g.updateExtractionArrival(from);assert.equal(g.state.mode,'extraction')}
function cleanEncounter(g){g.scheduleRush(Infinity);g.setup({enemies:[],activeBoss:null,hostileShots:[],lobberBombs:[],nextBossAt:Infinity,nextSpitterAt:Infinity,nextRiotAt:Infinity,nextHowlerAt:Infinity,nextLobberAt:Infinity})}
function check(name,run){const detail=run();checks.push({name,status:'passed',detail});console.log('PASS '+name)}

for(const [width,height]of [[412,915],[915,412]])check('accelerated scored journey '+width+'x'+height,()=>{
 const g=current({width,height,stored:'100'});
 for(const id of ['start','runLog','settingsOpen'])assert.ok(g.el(id));
 g.el('start').click();g.useStarterSetup();g.el('deploy').click();assert.equal(g.state.mode,'play');assert.equal(g.state.training,false);
 assert.equal(g.state.runSurvivor,'survivor');assert.equal(g.state.runRoute,'downtown');assert.equal(g.state.runRule,'standard');
 g.setup({xp:g.state.nextXp});g.checkLevelUp();assert.equal(g.state.mode,'upgrade');
 const time=g.state.elapsed;g.advanceClock(2000);g.update(10);assert.equal(g.state.mode,'upgrade');assert.equal(g.state.elapsed,time);g.choose(0);assert.equal(g.state.mode,'play');
 g.el('stick').dispatch('pointerdown',{pointerId:11,clientX:100,clientY:625});g.el('pause').dispatch('pointerdown',{pointerId:12,isPrimary:false});assert.equal(g.state.mode,'paused');
 g.resume();g.phoneBack();assert.equal(g.state.mode,'paused');g.resume();
 g.resizeTo(height,width);assert.equal(g.state.mode,'paused');g.resume();
 g.document.hidden=true;g.event('visibilitychange');assert.equal(g.state.mode,'paused');g.document.hidden=false;g.event('visibilitychange');assert.equal(g.state.mode,'paused');g.resume();
 cleanEncounter(g);g.spawnBoss('breaker');g.hitEnemy(g.state.activeBoss,g.state.activeBoss.hp+1,'GUN');assert.equal(g.state.bossesDefeated,1);
 cleanEncounter(g);g.setup({elapsed:180});g.updateExtractionWindow();arrive(g);press(g,'stay');assert.equal(g.state.mode,'play');assert.equal(g.state.overtime,1);assert.equal(g.state.exitAt,240);assert.ok(g.p.inv>=1.5);
 cleanEncounter(g);g.setup({elapsed:240});g.updateExtractionWindow();arrive(g);press(g,'extract');assert.equal(g.state.mode,'end');assert.equal(g.state.runResult.outcome,'extracted');
 const result=g.state.runResult,saved=g.journalSaved(),record=g.saved();assert.equal(g.state.journal.totals.runs,1);assert.equal(g.state.journal.totals.extractions,1);
 for(const id of ['endReport','endGuide','endSettings','endBackup','endManual','endWeapons','endBestiary']){press(g,id);g.phoneBack();assert.equal(g.state.mode,'end');assert.equal(g.state.runResult,result);assert.equal(g.journalSaved(),saved);assert.equal(g.saved(),record)}
 g.update(999);assert.equal(g.state.elapsed,240);press(g,'again');assert.equal(g.state.mode,'play');assert.equal(g.state.elapsed,0);assert.equal(g.p.arc,0);assert.equal(g.p.pierce,0);assert.equal(g.state.journal.totals.runs,1);
 return {outcome:result.outcome,time:result.time,loggedRuns:1,overtime:result.overtime,nativeBossCredit:true,heldResultTools:7,freshReplay:true,limits:'Clock and encounter fields accelerated/controlled; not a natural balance or physical touch/layout observation.'};
});

// Generate a real format-one packet from the previous build in isolated mock
// storage. No owner records are read or fabricated as an owner backup.
const source=older({stored:'100'});
source.showRoster();source.selectSurvivor('tactician');source.selectRoute('riverside');source.selectRule('glass');source.selectContract('patrol');source.saveDeployment();source.start();
source.setup({xp:source.state.nextXp});source.checkLevelUp();
const pierce=source.state.upgradeOffer.picks.findIndex(card=>card.name==='Piercing Rounds');assert.ok(pierce>=0);source.choose(pierce);assert.equal(source.p.pierce,1);
source.spawnBoss('breaker');source.hitEnemy(source.state.activeBoss,source.state.activeBoss.hp+1,'GUN');
source.setup({elapsed:220,killCount:12});source.end('abandoned');
const packet=source.backupText(),parsed=JSON.parse(packet);assert.equal(parsed.format,1);assert.equal(parsed.journal.totals.runs,1);
check('previous-build backup into fresh current storage',()=>{
 const preferences=JSON.stringify({version:1,mirrored:true,reduced:true}),g=current({preferencesStored:preferences});review(g,packet);assert.equal(g.state.journal.totals.runs,0);press(g,'restoreConfirm');assert.equal(g.state.mode,'menu');
 assert.deepEqual(JSON.parse(g.backupText()),parsed);assert.equal(g.preferencesSaved(),preferences);
 const reload=current({stored:g.saved(),journalStored:g.journalSaved(),preferencesStored:g.preferencesSaved(),recoveryStored:g.recoverySaved()});assert.deepEqual(JSON.parse(reload.backupText()),parsed);assert.equal(reload.state.preferences.mirrored,true);
 reload.showRoster();reload.loadDeployment();assert.equal(reload.state.selectedRoute,'riverside');assert.equal(reload.state.selectedRule,'glass');reload.start();assert.equal(reload.state.runRoute,'riverside');assert.equal(reload.p.arc,0);assert.equal(reload.p.pierce,0);
 return {record:parsed.record,runs:parsed.journal.totals.runs,packetExact:true,preferencesRetained:true,presetRestored:true,activePowersNotTransferred:true,reload:'isolated mock storage values'};
});
check('review cancel, replacement and previous-records recovery',()=>{
 const g=current({stored:'90'});g.start();g.setup({elapsed:120});g.end('abandoned');const old=g.backupText(),oldJournal=g.journalSaved(),oldRecord=g.saved();
 review(g,packet);g.phoneBack();assert.equal(g.state.pendingRestore,null);assert.equal(g.journalSaved(),oldJournal);assert.equal(g.saved(),oldRecord);review(g,packet);press(g,'restoreConfirm');assert.deepEqual(JSON.parse(g.backupText()),parsed);
 const reload=current({stored:g.saved(),journalStored:g.journalSaved(),recoveryStored:g.recoverySaved()});reload.showBackup();reload.el('recoveryReview').click();assert.ok(reload.state.pendingRestore);press(reload,'restoreConfirm');assert.deepEqual(JSON.parse(reload.backupText()),JSON.parse(old));
 return {cancelPreservedBothKeys:true,replacementMatchesReviewedPacket:true,manualRecoveryAfterMockReload:true};
});
for(const [width,height]of [[412,915],[915,412]])for(const id of ['early','crowded','overtime'])check('performance fixture isolation '+id+' '+width+'x'+height,()=>{
 const preferences=JSON.stringify({version:1,mirrored:true,reduced:true,actors:'classic',scenery:'classic',hud:'classic'}),g=current({width,height,stored:'900',preferencesStored:preferences}),before={record:g.saved(),journal:g.journalSaved(),preferences:g.preferencesSaved()};
 g.el('previewsOpen').click();g.startMainPerfTest(id);assert.equal(g.state.mode,'play');assert.equal(g.state.training,true);assert.equal(g.mainPerfState().id,id);
 g.pause();g.showBenchmark('paused');assert.equal(g.state.mode,'benchmark');assert.match(g.benchmarkText(),/Training/);assert.equal(g.state.benchmarkCapture.row.frames,0);g.el('benchmarkBack').click();assert.equal(g.state.mode,'paused');g.end('abandoned');assert.equal(g.state.mode,'end');assert.equal(g.state.runResult.perfTest.id,id);assert.equal(g.earnedMedals(g.state.runResult).length,0);
 assert.deepEqual({record:g.saved(),journal:g.journalSaved(),preferences:g.preferencesSaved()},before);press(g,'resultMenu');g.el('start').click();g.el('deploy').click();assert.equal(g.state.training,false);assert.equal(g.state.elapsed,0);assert.equal(g.p.arc,0);assert.equal(g.p.pierce,0);assert.equal(g.state.overtime,0);
 return {fixture:id,training:true,sampling:'Not measured in VM; zero captured intervals',recordAndPreferencesUnchanged:true,normalDeploymentRestored:true};
});

const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const result={game:'Last Stand: After Dark',version:'Alpha 0.79',status:'local workflow checks passed; real-device gates pending',baseline:{file:path.basename(baseline),sha256:sha(baseline)},target:{file:path.basename(target),sha256:sha(target)},checksPassed:checks.length,checks,limits:['Existing Node VM/mock DOM/history/Canvas/storage/clock harness; no real browser, Android GPU or operating-system test.','Scored journeys accelerate clock/encounters and issue controlled native hits; not natural-run balance or sustained performance evidence.','Restore uses isolated synthetic session records; actual owner backup, file picker, content URL and persisted storage require phone checks.','No FPS, temperature, RAM or battery result is inferred from VM execution.','No gameplay/source/asset/save-schema/distribution change is made by this tool.']};
fs.writeFileSync(path.resolve(output),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({checksPassed:checks.length,output:path.resolve(output),realDeviceStatus:'pending'}));
