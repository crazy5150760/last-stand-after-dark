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
