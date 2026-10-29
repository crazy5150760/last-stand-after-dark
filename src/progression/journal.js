function freshJournal(){return{presets:[null,null,null],bestiary:emptyEnemyTally(),version:1,selected:'survivor',totals:{runs:0,extractions:0,breakers:0,wardens:0,harvesters:0,blackouts:0,bestOvertime:0},history:[],available:true,readOnly:false}}
function safeCount(value,max=1e9,min=0){return typeof value==='number'&&Number.isFinite(value)?Math.max(min,Math.min(max,Math.floor(value))):min}
function cleanCombatStat(value,min=0){return typeof value==='number'&&Number.isFinite(value)&&value>=min?Math.max(min,Math.round(Math.min(1e9,value)*1e6)/1e6):null}
function savedCombatStats(row){return Object.fromEntries(['hp','max','damage','fire','speed','regen','magnet','bulletSpeed'].map(key=>[key,cleanCombatStat(row[key],key==='fire'?1e-6:0)]))}
function cleanPace(raw,time){
 if(!Array.isArray(raw))return null;const rows=[];
 for(const b of raw.slice(-60)){if(!b||typeof b!=='object'||!Number.isInteger(b.minute)||b.minute<0||b.minute>Math.floor(time/60)||rows.length&&b.minute<=rows[rows.length-1].minute||typeof b.kills!=='number'||!Number.isFinite(b.kills)||b.kills<0||typeof b.hpLost!=='number'||!Number.isFinite(b.hpLost)||b.hpLost<0)continue;rows.push({minute:b.minute,kills:safeCount(b.kills),hpLost:cleanMeasure(b.hpLost)})}return rows;
}
function recordPace(kills=0,hpLost=0){
 if(training||!['play','extraction'].includes(mode))return;const minute=Math.floor(elapsed/60);let b=paceBuckets[paceBuckets.length-1];
 if(!b||b.minute!==minute){b={minute,kills:0,hpLost:0};paceBuckets.push(b);paceBuckets=paceBuckets.filter(row=>row.minute>=minute-59)}b.kills+=kills;b.hpLost+=hpLost;
}
function paceSnapshot(){
 const lastMinute=Math.floor(elapsed/60),rows=[];for(let minute=Math.max(0,lastMinute-59);minute<=lastMinute;minute++){const b=paceBuckets.find(row=>row.minute===minute);rows.push(Object.freeze({minute,kills:b?.kills||0,hpLost:Math.round((b?.hpLost||0)*10)/10}))}return Object.freeze(rows);
}
function pacePanel(rows){
 if(!rows?.length)return '<details class="medal-goals"><summary>RUN PACE</summary><p class="muted">Minute-by-minute data unavailable in this older run.</p></details>';
 const maxKills=Math.max(0,...rows.map(b=>b.kills)),maxLost=Math.max(0,...rows.map(b=>b.hpLost)),width=560/rows.length;
 return `<details class="medal-goals"><summary>RUN PACE</summary><p>Eliminations and HP lost to hits per active minute. Latest ${rows.length} minute buckets; the final minute may be partial. Gold/pink bars use separate scales.</p><svg viewBox="0 0 600 182" role="img" aria-label="Run pace: gold eliminations, pink HP lost to hits" style="width:100%;height:auto;background:#101b29;border-radius:8px"><title>Run pace · peak ${maxKills} eliminations / ${maxLost} HP lost per minute</title><path d="M20 150H580 M20 85H580 M20 20H580" stroke="#34465b" fill="none"/>${rows.map((b,i)=>{const x=20+i*width,killHeight=b.kills/Math.max(1,maxKills)*130,hurtHeight=b.hpLost/Math.max(1,maxLost)*130;return `<rect x="${x.toFixed(2)}" y="${(150-killHeight).toFixed(2)}" width="${(width*.42).toFixed(2)}" height="${killHeight.toFixed(2)}" fill="#e9ba65"/><rect x="${(x+width*.45).toFixed(2)}" y="${(150-hurtHeight).toFixed(2)}" width="${(width*.42).toFixed(2)}" height="${hurtHeight.toFixed(2)}" fill="#ee829e"/>${i%Math.ceil(rows.length/10)===0?`<text x="${x.toFixed(2)}" y="174" fill="#c5cfda" font-size="11">${b.minute+1}</text>`:''}`}).join('')}</svg><p class="muted">Minute number along the bottom. This shows your recorded combat, not enemy spawn counts. Armor/protection, healing and movement affect the outcome.</p><table class="weapon-ranks"><thead><tr><th>Minute</th><th>Eliminations</th><th>HP lost to hits</th></tr></thead><tbody>${rows.map(b=>`<tr><th>${b.minute+1}</th><td>${b.kills}</td><td>${b.hpLost}</td></tr>`).join('')}</tbody></table></details>`;
}
// Bounded measurements only: four weapon paths, three rank times and one evolution each.
function freshBuildProgress(){return{collected:0,xpChoices:0,bonusChoices:0,firstChoice:null,paths:Object.fromEntries(EVOLUTIONS.map(e=>[e.weapon,{ranks:[null,null,null],evolution:null}]))}}
function recordCollectedXp(value){if(!training&&mode==='play'&&Number.isFinite(value)&&value>0)buildProgress.collected+=value}
function recordBuildChoice(choice,reward){
 if(training||mode!=='upgrade')return;
 if(buildProgress.firstChoice===null)buildProgress.firstChoice=elapsed;
 buildProgress[reward?'bonusChoices':'xpChoices']++;
 if(choice.weapon){const rank=p[choice.weapon]-1;if(rank>=0&&rank<3)buildProgress.paths[choice.weapon].ranks[rank]=elapsed}
 if(choice.evolution){const e=EVOLUTIONS.find(e=>e.field===choice.evolution);if(e)buildProgress.paths[e.weapon].evolution=elapsed}
}
function buildProgressSnapshot(){
 if(training||!buildProgress)return null;
 return Object.freeze({...buildProgress,xp,nextXp,onStreet:gems.reduce((total,a)=>total+a.value,0),paths:Object.freeze(Object.fromEntries(EVOLUTIONS.map(e=>{const row=buildProgress.paths[e.weapon];return[e.weapon,Object.freeze({ranks:Object.freeze([...row.ranks]),evolution:row.evolution})]})))});
}
function cleanBuildProgress(raw,time){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return null;
 const fields=['collected','xpChoices','bonusChoices','xp','nextXp','onStreet'];
 if(fields.some(key=>!Number.isInteger(raw[key])||raw[key]<0||raw[key]>1e9)||raw.nextXp<1)return null;
 const validTime=value=>typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=Math.min(time,86400);
 const firstChoice=validTime(raw.firstChoice)?raw.firstChoice:null,paths={};
 for(const e of EVOLUTIONS){const row=raw.paths?.[e.weapon],ranks=[null,null,null];let previous=firstChoice;
  for(let i=0;i<3;i++){const value=row?.ranks?.[i];if(previous===null||!validTime(value)||value<previous)break;ranks[i]=value;previous=value}
  paths[e.weapon]={ranks,evolution:ranks[2]!==null&&validTime(row?.evolution)&&row.evolution>=ranks[2]?row.evolution:null};
 }
 return{...Object.fromEntries(fields.map(key=>[key,raw[key]])),firstChoice,paths};
}
function buildProgressLines(row){
 if(!row)return ['Build progression unavailable in this older run.'];
 const when=value=>value===null?'Not chosen':fmt(value);
 return[`First upgrade chosen: ${when(row.firstChoice)}`,`Upgrades chosen: ${row.xpChoices} from XP · ${row.bonusChoices} bonus`, `XP collected: ${row.collected} · XP still on the street: ${row.onStreet}`,`Progress toward next XP upgrade: ${row.xp} / ${row.nextXp}`,...EVOLUTIONS.map(e=>{const path=row.paths[e.weapon];return `${e.name} path: ranks 1 / 2 / 3 at ${path.ranks.map(when).join(' / ')} · Evolution: ${when(path.evolution)}`})];
}
function buildProgressPanel(row){return `<details class="medal-goals"><summary>BUILD PROGRESSION</summary><p class="muted">Active run time when you chose each upgrade. Bonus choices do not spend XP. Collected XP includes supply-drop recovery; street XP is what remains at the end. These are your choices, not the earliest an upgrade was offered.</p><div class="field-list">${buildProgressLines(row).map(line=>`<div><p>${line}</p></div>`).join('')}</div></details>`}
function cleanRunEntry(row){
  if(!row||typeof row!=='object'||row.training===true||!['extracted','defeated','abandoned'].includes(row.outcome)||typeof row.time!=='number'||!Number.isFinite(row.time)||row.time<0)return null;
  return{progression:cleanBuildProgress(row.progression,row.time),pace:cleanPace(row.pace,row.time),bladeReach:row.bladeReach===true,arcRelay:row.arcRelay===true,lockers:typeof row.lockers==='number'?safeCount(row.lockers,1):null,evasive:typeof row.evasive==='boolean'?row.evasive:null,patrols:typeof row.patrols==='number'?safeCount(row.patrols,3):null,harvesters:typeof row.harvesters==='number'?safeCount(row.harvesters):null,steady:row.steady===true,steadyReady:row.steady===true&&row.steadyReady===true,route:ROUTES.some(r=>r.id===row.route)?row.route:null,timeline:cleanTimeline(row.timeline),timelineDropped:safeCount(row.timelineDropped),trackedMedal:row.trackedMedal==='off'||MEDAL_TRACKERS.some(m=>m.id===row.trackedMedal)?row.trackedMedal:null,newDiscoveries:cleanDiscoveries(row.newDiscoveries),weapons:cleanWeaponLedger(row.weapons),gunPriority:['nearest','weakest','threats'].includes(row.gunPriority)?row.gunPriority:null,decoyPouch:row.decoyPouch===true,decoys:typeof row.decoys==='number'?safeCount(row.decoys):null,decoyLured:typeof row.decoyLured==='number'?safeCount(row.decoyLured):null,...savedCombatStats(row),shocks:typeof row.shocks==='number'?safeCount(row.shocks):null,shockStuns:typeof row.shockStuns==='number'?safeCount(row.shockStuns):null,rule:RUN_RULES.some(r=>r.id===row.rule)?row.rule:null,damageTaken:cleanMeasure(row.damageTaken),hitsTaken:typeof row.hitsTaken==='number'?safeCount(row.hitsTaken):null,armorPrevented:cleanMeasure(row.armorPrevented),lastThreat:knownThreat(row.lastThreat)?row.lastThreat:null,armor:safeCount(row.armor,3),capacitor:safeCount(row.capacitor,2),secondWind:row.secondWind===true,windSpent:row.secondWind===true&&row.windSpent===true,enemyTally:row.enemyTally&&typeof row.enemyTally==='object'&&!Array.isArray(row.enemyTally)?cleanEnemyTally(row.enemyTally):null,...cleanContract(row),survivor:survivorById(row.survivor).id,outcome:row.outcome,time:Math.min(86400,row.time),kills:safeCount(row.kills),level:safeCount(row.level,10000,1),breakers:safeCount(row.breakers),wardens:typeof row.wardens==='number'?safeCount(row.wardens):null,blackouts:safeCount(row.blackouts),overtime:safeCount(row.overtime,1e6),pierce:safeCount(row.pierce,3),arc:safeCount(row.arc,3),blades:safeCount(row.blades,3),molotov:safeCount(row.molotov,3),wildfire:row.wildfire===true&&safeCount(row.molotov,3)===3,scrapRefreshes:typeof row.scrapRefreshes==='number'?safeCount(row.scrapRefreshes):null,scrapRecovered:typeof row.scrapRecovered==='number'&&Number.isFinite(row.scrapRecovered)?Math.round(Math.max(0,Math.min(1e9,row.scrapRecovered))*10)/10:null,convoys:typeof row.convoys==='number'?safeCount(row.convoys):null,drops:typeof row.drops==='number'?safeCount(row.drops):null,dropXp:typeof row.dropXp==='number'?safeCount(row.dropXp):null,fireKills:typeof row.fireKills==='number'?safeCount(row.fireKills):null,proj:safeCount(row.proj,5,1),rail:row.rail===true&&safeCount(row.pierce,3)===3,thunder:row.thunder===true&&safeCount(row.arc,3)===3,reaper:row.reaper===true&&safeCount(row.blades,3)===3,barricades:typeof row.barricades==='number'?safeCount(row.barricades):null,barrels:typeof row.barrels==='number'?safeCount(row.barrels):null,blastKills:typeof row.blastKills==='number'?safeCount(row.blastKills):null,salvages:typeof row.salvages==='number'?safeCount(row.salvages):null,spitters:typeof row.spitters==='number'?safeCount(row.spitters):null,riotGuards:typeof row.riotGuards==='number'?safeCount(row.riotGuards):null,rescues:typeof row.rescues==='number'?safeCount(row.rescues):null,supplies:typeof row.supplies==='number'?safeCount(row.supplies):null,supplyHealing:typeof row.supplyHealing==='number'&&Number.isFinite(row.supplyHealing)?Math.round(Math.max(0,Math.min(1e9,row.supplyHealing))*10)/10:null};
}
function readJournal(){
  const result=freshJournal();let raw;
  try{raw=localStorage.getItem(JOURNAL_KEY)}catch{result.available=false;return result}
  if(!raw)return result;let data;try{data=JSON.parse(raw)}catch{return result}
  return normalizeJournal(data);
}
function normalizeJournal(data){
  const result=freshJournal();
  if(!data||typeof data!=='object'||Array.isArray(data))return result;
  if(data.version>1){result.available=false;result.readOnly=true;return result}
  if(data.version!==1)return result;
  result.presets=cleanPresets(data.presets);result.selected=survivorById(data.selected).id;result.bestiary=cleanEnemyTally(data.bestiary);
  if(Array.isArray(data.history))for(const row of data.history){const entry=cleanRunEntry(row);if(entry)result.history.push(entry);if(result.history.length===8)break}
  const totals=data.totals&&typeof data.totals==='object'?data.totals:{};
  result.totals={runs:Math.max(result.history.length,safeCount(totals.runs)),extractions:safeCount(totals.extractions),breakers:safeCount(totals.breakers),wardens:safeCount(totals.wardens),harvesters:safeCount(totals.harvesters),blackouts:safeCount(totals.blackouts),bestOvertime:safeCount(totals.bestOvertime,1e6)};
  result.totals.extractions=Math.min(result.totals.runs,Math.max(result.totals.extractions,result.history.filter(row=>row.outcome==='extracted').length));
  result.totals.breakers=Math.max(result.totals.breakers,result.history.reduce((sum,row)=>sum+row.breakers,0));
  result.totals.wardens=Math.max(result.totals.wardens,result.history.reduce((sum,row)=>sum+(row.wardens??0),0));
  result.totals.harvesters=Math.max(result.totals.harvesters,result.history.reduce((sum,row)=>sum+(row.harvesters??0),0));
  result.totals.blackouts=Math.max(result.totals.blackouts,result.history.reduce((sum,row)=>sum+row.blackouts,0));
  result.totals.bestOvertime=Math.max(result.totals.bestOvertime,...result.history.map(row=>row.overtime));
  for(const entry of ENEMY_GUIDE){const recent=result.history.reduce((sum,row)=>sum+(row.enemyTally?.[entry.id]||0),0);result.bestiary[entry.id]=Math.min(1e9,Math.max(result.bestiary[entry.id],recent))}
  return result;
}
function journalPayload(log=journal){return{version:1,presets:log.presets,bestiary:log.bestiary,selected:log.selected,totals:log.totals,history:log.history}}
function saveJournal(){
  if(journal.readOnly)return false;
  try{const value=JSON.stringify(journalPayload());localStorage.setItem(JOURNAL_KEY,value);journal.available=localStorage.getItem(JOURNAL_KEY)===value;return journal.available}catch{journal.available=false;return false}
}
function journalNote(){return journal.readOnly?'A newer run log is present; this build keeps a temporary log.':journal.available?'Run log saved only in this browser.':'Browser storage is unavailable; the run log lasts for this visit.'}
function logCompletedRun(){
  const row=cleanRunEntry(runResult);
  journal.history.unshift(row);journal.history=journal.history.slice(0,8);
  const t=journal.totals;t.runs=Math.min(1e9,t.runs+1);if(runOutcome==='extracted')t.extractions=Math.min(1e9,t.extractions+1);
  t.breakers=Math.min(1e9,t.breakers+row.breakers);t.wardens=Math.min(1e9,t.wardens+(row.wardens??0));t.harvesters=Math.min(1e9,t.harvesters+(row.harvesters??0));t.blackouts=Math.min(1e9,t.blackouts+rushesSurvived);t.bestOvertime=Math.max(t.bestOvertime,overtime);
  for(const entry of ENEMY_GUIDE)journal.bestiary[entry.id]=Math.min(1e9,journal.bestiary[entry.id]+(row.enemyTally?.[entry.id]||0));
  return saveJournal();
}
