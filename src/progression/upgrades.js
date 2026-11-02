function evolutionHint(){
  const ready=EVOLUTIONS.filter(e=>p[e.weapon]===3&&!p[e.field]);
  return ready.length?'EVOLUTION CAN APPEAR: '+ready.map(e=>e.name).join(' · '):'Build a weapon to rank 3/3, then take its evolution on a later upgrade.';
}
const opts=[
{icon:'✦',name:'Blade Reach',desc:'Orbiting Blades circle 12 units farther out. Same blade count, damage, rotation and per-target interval. Also widens Reaper Ring and its shot interception orbit.',available:()=>p.blades>0&&!p.bladeReach,apply:()=>{p.bladeReach=true}},
{icon:'ϟ',name:'Arc Relay',desc:'Chain Lightning jumps 20% farther after its first target. First-target range, target cap, damage and recharge stay the same. Also works with Thunderweb.',available:()=>p.arc>0&&!p.arcRelay,apply:()=>{p.arcRelay=true}},
{icon:'↗',name:'Evasive Reload',desc:'Dash to prime your next gun volley for +20% damage within 2 active seconds. One volley per Dash; no extra bullets. Other weapons are unchanged.',available:()=>!p.evasive,apply:()=>{p.evasive=true;p.evasiveUntil=0}},
{icon:'⌾',name:'Steady Aim',desc:'After standing still for 0.6 seconds, gun bullets deal 15% more damage. Moving or dashing removes the bonus. Other weapons are unchanged.',available:()=>!p.steady,apply:()=>{p.steady=true;p.stillTime=0}},
{icon:'◇',name:'Decoy Pouch',desc:'Gain one extra decoy charge now (carry at most 2). Once per run; does not refill in overtime.',available:()=>!p.decoyPouch&&decoyCharges<DECOY_TUNING.maxCharges,apply:()=>{p.decoyPouch=true;decoyCharges=Math.min(DECOY_TUNING.maxCharges,decoyCharges+1);updateHUD()}},
{icon:'▰',name:'Armor Plating',desc:()=>`Plating rank ${p.armor+1}/3: reduce incoming hits by ${p.armor+1}, minimum 1 damage. No effect on movement or enemy damage values.`,available:()=>p.armor<3,apply:()=>{p.armor=Math.min(3,p.armor+1)}},
{icon:'↯',name:'Dash Capacitor',desc:()=>`Dash recharge rank ${p.capacitor+1}/2: ${dashCooldown(p.capacitor+1).toFixed(2)}s instead of ${dashCooldown(0).toFixed(2)}s at base.`,available:()=>p.capacitor<2,apply:()=>{p.capacitor=Math.min(2,p.capacitor+1);p.dashCd=Math.min(p.dashCd,dashCooldown())}},
{icon:'↟',name:'Second Wind',desc:'Once this run, a lethal hit restores up to 25 HP and gives 2 seconds of protection. Does not recharge in overtime.',available:()=>!p.secondWind,apply:()=>{p.secondWind=true}},
{icon:'🔥',evolution:'wildfire',name:'Evolve: Wildfire',desc:'Throw at up to 2 spread-out targets. Wider, stronger burns, then a short gap. At most 2 fires; overlapping damage does not stack.',available:()=>p.molotov===3&&!p.wildfire,apply:()=>{p.wildfire=true;molotovClock=Math.min(molotovClock,.2)}},
{icon:'➶',evolution:'rail',name:'Evolve: Railstorm',desc:'Pierce up to 8 enemies per shot, +25% gun damage, faster rail shots.',available:()=>p.pierce===3&&!p.rail,apply:()=>{p.rail=true}},
{icon:'ϟ',evolution:'thunder',name:'Evolve: Thunderweb',desc:'Fork into 2 chains striking up to 8 distinct enemies. More damage and faster recharge.',available:()=>p.arc===3&&!p.thunder,apply:()=>{p.thunder=true;chainClock=Math.min(chainClock,.2)}},
{icon:'✦',evolution:'reaper',name:'Evolve: Reaper Ring',desc:'6 wider, stronger blades. Blade contacts also block enemy shots.',available:()=>p.blades===3&&!p.reaper,apply:()=>{p.reaper=true}},
{icon:'➶',weapon:'pierce',name:'Piercing Rounds',desc:()=>`Bullets pass through ${p.pierce+1} extra ${p.pierce?'enemies':'enemy'}. Line up the horde.`,available:()=>p.pierce<3,apply:()=>p.pierce++},
{icon:'ϟ',weapon:'arc',name:'Chain Lightning',desc:()=>`Auto-zap up to ${p.arc+3} nearby enemies. Higher ranks strike more often.`,available:()=>p.arc<3,apply:()=>{p.arc++;if(p.arc===1)chainClock=.2}},
{icon:'✦',weapon:'blades',name:'Orbiting Blades',desc:()=>`${p.blades+2} blades circle you and cut enemies on contact.`,available:()=>p.blades<3,apply:()=>p.blades++},
{icon:'🔥',weapon:'molotov',name:'Molotov',desc:()=>`Lob burning ground: radius ${molotovStats(p.molotov+1,false).radius}, recharge ${molotovStats(p.molotov+1,false).cooldown}s. Safe for you and survivors.`,available:()=>p.molotov<3,apply:()=>{p.molotov++;if(p.molotov===1)molotovClock=.2}},
{icon:'⚡',name:'Rapid Fire',desc:'18% shorter gun intervals, with a 0.075s minimum.',available:()=>p.fire>.075001,apply:()=>p.fire=Math.max(.075,p.fire*.82)},{icon:'💥',name:'Heavy Rounds',desc:'Damage +30%',apply:()=>p.damage*=1.3},{icon:'👟',name:'Runner',desc:'Movement speed +18%',apply:()=>p.speed*=1.18},{icon:'❤️',name:'Field Medic',desc:'Max HP +30 and heal 40',apply:()=>{p.max+=30;p.hp=Math.min(p.max,p.hp+40)}},{icon:'🔫',name:'Multishot',desc:'Shoot one extra bullet (max 5)',available:()=>p.proj<5,apply:()=>p.proj=Math.min(5,p.proj+1)},{icon:'🧲',name:'Salvager',desc:'Pickup range +55%',apply:()=>p.magnet*=1.55},{icon:'🩹',name:'Regeneration',desc:'Recover 1.5 HP per second',apply:()=>p.regen+=1.5},{icon:'🚀',name:'Velocity',desc:'Bullet speed +25%',apply:()=>p.bulletSpeed*=1.25}];
let openingWeapon=null,followUpOffered=false;
function resetUpgradeFollowUp(){openingWeapon=null;followUpOffered=false}
function openingWeaponFollowUp(){
  const path=EVOLUTIONS.find(e=>e.weapon===openingWeapon);
  if(!path||p[path.field])return null;
  return opts.find(o=>p[openingWeapon]<3?o.weapon===openingWeapon:o.evolution===path.field)||null;
}
function shuffled(items){const result=[...items];for(let i=result.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[result[i],result[j]]=[result[j],result[i]]}return result}
function upgradeChoices(previous=[],followUp=null){
  const pool=opts.filter(o=>!banished.has(o.name)&&(!o.available||o.available())),starters=pool.filter(o=>o.weapon);
  if(level===2&&starters.length===4)return shuffled(starters);
  if(previous.length){
    const unseen=shuffled(pool.filter(o=>!previous.includes(o)));if(!unseen.length)return null;
    // Prefer fresh cards on a refresh, with no reserved weapon/evolution slot.
    const picks=unseen.slice(0,3);
    if(picks.length<3)picks.push(...shuffled(pool.filter(o=>previous.includes(o))).slice(0,3-picks.length));
    return shuffled(picks);
  }
  if(followUp&&pool.includes(followUp))return shuffled([followUp,...shuffled(pool.filter(o=>o!==followUp)).slice(0,2)]);
  return shuffled(pool).slice(0,3);
}
function levelUp(reward=false){
  level++;upgrades++;sound(570,.2,'sine',.06);mode='upgrade';
  const followUp=!reward&&elapsed>=60&&!followUpOffered?openingWeaponFollowUp():null;
  if(followUp)followUpOffered=true;
  showUpgradeChoices(upgradeChoices([],followUp),reward,false,!!followUp);
}
// Choice-screen text only: never apply an option or sample the random pool here.
function upgradeImpact(o){
  const change=(label,from,to,unit='')=>`${label}: ${Number(from.toFixed(unit==='s'?2:1))} → ${Number(to.toFixed(unit==='s'?2:1))}${unit}`;
  if(o.weapon)return `RANK ${p[o.weapon]}/3 → ${p[o.weapon]+1}/3`;
  if(o.evolution)return 'RANK 3/3 → EVOLVED';
  switch(o.name){
    case 'Rapid Fire':return change('Gun volleys/s',1/p.fire,1/Math.max(.075,p.fire*.82));
    case 'Heavy Rounds':return change('Weapon base damage',p.damage,p.damage*1.3);
    case 'Runner':return change('Move speed',p.speed,p.speed*1.18);
    case 'Field Medic':return change('Max HP',p.max,p.max+30)+' · '+change('HP',p.hp,Math.min(p.max+30,p.hp+40));
    case 'Multishot':return change('Bullets/volley',p.proj,Math.min(5,p.proj+1));
    case 'Salvager':return change('XP pickup range',p.magnet,p.magnet*1.55);
    case 'Regeneration':return change('Recovery',p.regen,p.regen+1.5,' HP/s');
    case 'Velocity':return change('Base bullet speed',p.bulletSpeed,p.bulletSpeed*1.25);
    case 'Armor Plating':return change('Hit reduction',p.armor,Math.min(3,p.armor+1));
    case 'Dash Capacitor':return change('Dash recharge',dashCooldown(),dashCooldown((p.capacitor||0)+1),'s');
    case 'Decoy Pouch':return change('Decoy charges',decoyCharges,Math.min(DECOY_TUNING.maxCharges,decoyCharges+1));
    default:return 'SUPPORT · NEW ABILITY';
  }
}
function showUpgradeChoices(picks,reward=false,rerolled=false,followUp=false){
  const offer={picks,reward};upgradeOffer=offer;
  const canReroll=rerollsLeft>0&&picks.length===3&&opts.some(o=>!banished.has(o.name)&&(!o.available||o.available())&&!picks.includes(o));
  const rerollControl=picks.length===4?'<p class="muted">All four starting weapons are offered. Your rerolls are available from the next upgrade.</p>':`<button class="btn secondary reroll-control" id="rerollUpgrade" ${canReroll?'':'disabled'}>${rerollsLeft?canReroll?'REROLL CHOICES · '+rerollsLeft+' LEFT':'NO DIFFERENT CHOICES':'REROLL USED · 0 LEFT'}</button><p class="muted">${rerolled?'Choices refreshed. ':''}${runSurvivor==='quartermaster'?'Two rerolls per run.':'One reroll per run.'} ${followUp?'Refreshing replaces this one-time weapon offer. ':''}Refreshes are random; no weapon or evolution is guaranteed. No extra upgrade is granted.</p>`;
  const banishOptions=picks.filter(o=>!o.weapon&&!o.evolution);
  const banishControl=picks.length===3&&banishesLeft&&banishOptions.length?`<div class="contract-picker"><label for="banishPick">OPTIONAL BANISH · ONCE PER RUN</label><select id="banishPick">${banishOptions.map(o=>`<option value="${o.name}">${o.name}</option>`).join('')}</select><p class="muted">Remove this non-weapon upgrade from this run’s future offers and refresh these choices. No extra upgrade.</p><button class="btn secondary reroll-control" id="banishUpgrade">BANISH SELECTED · 1 LEFT</button></div>`:picks.length===3?`<p class="muted">${banishesLeft?'Banish is available when a non-weapon upgrade is offered.':'Banish used this run.'}</p>`:'';
  show(`<div class="eyebrow">${reward==='convoy'?'CONVOY INTERCEPTED · BONUS UPGRADE':reward==='rescue'?'SURVIVOR RESCUED · BONUS UPGRADE':reward==='contract'?'CONTRACT COMPLETE · BONUS UPGRADE':reward==='salvage'?'SALVAGE SECURED · BONUS UPGRADE':reward?'BLACKOUT SURVIVED · BONUS UPGRADE':`LEVEL ${level} REACHED`}</div><h1 style="font-size:44px">CHOOSE YOUR EDGE</h1><p>${level===2?'Pick a weapon to shape this run.':followUp?'Your opening weapon has one follow-up offer. Choose it or another edge.':'Three random choices. Take an opportunity or try a new combination.'}</p><p class="muted">Time is paused. Take your time, then tap a power-up.</p><div class="cards${picks.length===4?' four':''}">${picks.map((o,i)=>`<button class="choice${o.evolution?' evolution':''}${favoredChoice(o)?' favored-choice':''}" data-pick="${i}">${favoredChoice(o)?'<small class="evolution-tag">FAVORED PATH</small>':''}${o.evolution?'<small class="evolution-tag">EVOLUTION</small>':''}<div class="emoji">${o.icon}</div><b>${o.name}</b><small class="upgrade-impact">${upgradeImpact(o)}</small><span>${typeof o.desc==='function'?o.desc():o.desc}</span></button>`).join('')}</div><details class="medal-goals" id="upgradeBuild"><summary>YOUR BUILD &amp; EVOLUTIONS</summary><p class="muted">${buildSummary()}</p><p class="evolution-hint">${evolutionHint()}</p></details>${rerollControl}${banishControl}`);
  if(banishesLeft&&picks.length===3&&banishOptions.length){const picker=document.getElementById('banishPick');picker.value=banishOptions[0].name;bindUpgradePress(document.getElementById('banishUpgrade'),()=>banishUpgrade(offer,picker.value))}
  if(canReroll)bindUpgradePress(document.getElementById('rerollUpgrade'),()=>rerollUpgrade(offer));
  modal.querySelectorAll('[data-pick]').forEach(el=>bindUpgradePress(el,()=>{const choice=picks[+el.dataset.pick];if(mode!=='upgrade'||upgradeOffer!==offer||!el.isConnected||choice.available&&!choice.available())return;upgradeOffer=null;choice.apply();if(choice.weapon&&!openingWeapon)openingWeapon=choice.weapon;recordBuildChoice(choice,reward);if(choice.evolution)recordRunEvent('evolve-'+choice.evolution);mode='play';hide();toast(choice.name.toUpperCase());sound(690,.1);checkLevelUp();finishRescueArrival();updateHUD()}));
}
function rerollUpgrade(offer){
  if(mode!=='upgrade'||document.hidden||p.hp<=0||rerollsLeft<=0||offer!==upgradeOffer||offer.picks.length!==3)return;
  const picks=upgradeChoices(offer.picks);if(!picks)return;
  rerollsLeft--;showUpgradeChoices(picks,offer.reward,true);sound(420,.07,'sine',.025);
}
function banishUpgrade(offer,name){
  if(mode!=='upgrade'||document.hidden||p.hp<=0||offer!==upgradeOffer||banishesLeft<=0||offer.picks.length!==3)return;
  const choice=offer.picks.find(o=>o.name===name&&!o.weapon&&!o.evolution);if(!choice)return;
  banished.add(name);const picks=upgradeChoices(offer.picks);
  if(!picks){banished.delete(name);return}
  banishesLeft--;showUpgradeChoices(picks,offer.reward);sound(260,.08,'triangle',.02);
}
// A card must receive a fresh gesture after this screen opens. Ignore browser
// compatibility clicks and scrolling; each queued upgrade gets its own guard.
