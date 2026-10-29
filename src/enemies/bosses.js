const BREAKER_TUNING=Object.freeze({windup:.8,chargeTime:.44,recovery:1.1,approach:1.8});
const WARDEN_TUNING=Object.freeze({windup:1.1,recovery:1.6,approach:.8,shotSpeed:200,shotLife:2.8,shotDamage:12,spread:Object.freeze([-.9,-.45,0,.45,.9])});
function nextBossKind(){return ['breaker','warden','harvester'][bossesDefeated%3]}
function bossName(e){const kind=e?e.bossKind:nextBossKind();return kind==='harvester'?'HARVESTER':kind==='warden'?'WARDEN':'BREAKER'}
// The first milestone is the original Breaker; later defeats cycle through Warden and Harvester.
function spawnBoss(kind=nextBossKind()){
  if(activeBoss)return;
  if(!['breaker','warden','harvester'].includes(kind))kind='breaker';
  scheduleRush(Infinity);
  const warden=kind==='warden',angle=rand(0,Math.PI*2),radius=Math.min(W,H)*.5+95,hp=(kind==='harvester'?750:warden?700:650)*(1+bossesDefeated*.4);
  activeBoss={x:p.x+Math.cos(angle)*radius,y:p.y+Math.sin(angle)*radius,hp,max:hp,speed:kind==='harvester'?90:warden?72:78,r:ENEMY_ART[kind].r,dmg:kind==='harvester'?26:warden?25:30,col:ENEMY_ART[kind].col,hit:0,type:3,bossKind:kind,phase:'approach',phaseTime:2.8,chargeX:0,chargeY:1,chargeLength:0,aimAngle:0};
  enemies.push(activeBoss);recordRunEvent(kind+'-arrived');toast(kind==='harvester'?'THE HARVESTER • LEAVE THE GREEN PULSE CIRCLE':warden?'THE WARDEN • DODGE BETWEEN BLUE LANES':'THE BREAKER • DODGE THE ORANGE CHARGE LANE',3500);sound(65,.35,'sawtooth',.045,'alerts');
}
function updateEncounter(){
  if(activeBoss)return;
  if(!bossWarned&&elapsed>=nextBossAt-10){bossWarned=true;toast(`${bossName()} IN 10 SECONDS • SAVE A BARREL`,3000);sound(140,.2,'triangle',.035,'alerts')}
  if(elapsed>=nextBossAt)spawnBoss();
}
function defeatBoss(boss){
  if(boss!==activeBoss)return;
  const label=bossName(boss);recordRunEvent(boss.bossKind+'-down');if(boss.bossKind==='warden')wardensDefeated++;if(boss.bossKind==='harvester')harvestersDefeated++;
  hostileShots=hostileShots.filter(b=>b.source!==boss);
  activeBoss=null;bossesDefeated++;nextBossAt=elapsed+90;bossWarned=false;reliefUntil=elapsed+8;reliefLabel=label+' DOWN';scheduleRush(elapsed+35);
  const heal=Math.min(25,p.max-p.hp);p.hp+=heal;
  toast(`${label} DOWN • +${Math.ceil(heal)} HP • 8s SPAWN BREAK`,3500);sound(540,.25,'sine',.045,'alerts');
  floatText(boss.x,boss.y-50,label+' DOWN','#ffe4a0');
}
function moveWarden(e,dt){
  const visible=rangedEnemyVisible(e),range=clamp(Math.min(W,H)*.38,135,250);
  if(e.phase==='approach'){
    if(dist(e,p)>range||!visible){const a=Math.atan2(p.y-e.y,p.x-e.x);e.x+=Math.cos(a)*e.speed*dt;e.y+=Math.sin(a)*e.speed*dt}
    e.phaseTime-=dt;
    if(e.phaseTime<=0&&rangedEnemyVisible(e)&&dist(e,p)<=range+25){e.aimAngle=Math.atan2(p.y-e.y,p.x-e.x);e.phase='warn';e.phaseTime=WARDEN_TUNING.windup}
  }else if(e.phase==='warn'){
    if(!visible){e.phase='approach';e.phaseTime=WARDEN_TUNING.approach;return}
    e.phaseTime-=dt;
    if(e.phaseTime<=0){
      if(hostileShots.length+WARDEN_TUNING.spread.length<=FX_LIMITS.hostileShots){
        for(const offset of WARDEN_TUNING.spread){const a=e.aimAngle+offset,x=Math.cos(a),y=Math.sin(a);hostileShots.push({x:e.x+x*(e.r+9),y:e.y+y*(e.r+9),vx:x*WARDEN_TUNING.shotSpeed,vy:y*WARDEN_TUNING.shotSpeed,r:7,life:WARDEN_TUNING.shotLife,dmg:WARDEN_TUNING.shotDamage,kind:'warden',source:e})}
        sound(175,.16,'triangle',.03,'alerts');
      }
      e.phase='recover';e.phaseTime=WARDEN_TUNING.recovery;
    }
  }else if(e.phase==='recover'){
    e.phaseTime-=dt;if(e.phaseTime<=0){e.phase='approach';e.phaseTime=WARDEN_TUNING.approach}
  }
}
const HARVESTER_TUNING=Object.freeze({windup:1.35,recovery:1.4,approach:2.4,radius:135,damage:16});
function moveHarvester(e,dt){
 if(mode!=='play'||e.hp<=0)return;
 if(e.phase==='approach'){const a=Math.atan2(p.y-e.y,p.x-e.x);if(dist(e,p)>105){e.x+=Math.cos(a)*e.speed*dt;e.y+=Math.sin(a)*e.speed*dt}e.phaseTime-=dt;if(e.phaseTime<=0&&rangedEnemyVisible(e)&&dist(e,p)<180){e.phase='warn';e.phaseTime=HARVESTER_TUNING.windup;e.pulseX=e.x;e.pulseY=e.y}}
 else if(e.phase==='warn'){e.phaseTime-=dt;if(e.phaseTime<=1e-8){e.phase='recover';e.phaseTime=HARVESTER_TUNING.recovery;blastRings.push({x:e.pulseX,y:e.pulseY,life:.4,max:.4,radius:HARVESTER_TUNING.radius,color:'#b0ffd3'});sound(120,.18,'triangle',.025,'alerts');if(Math.hypot(p.x-e.pulseX,p.y-e.pulseY)<=HARVESTER_TUNING.radius+p.r)hurtPlayer(HARVESTER_TUNING.damage,'harvester-pulse')}}
 else if(e.phase==='recover'){e.phaseTime-=dt;if(e.phaseTime<=0){e.phase='approach';e.phaseTime=HARVESTER_TUNING.approach}}
}
function renderHarvester(e,ctx=g){ctx.save();ctx.strokeStyle='#dbffe1';ctx.lineWidth=4;for(let i=0;i<3;i++){const a=i*Math.PI*2/3;ctx.beginPath();ctx.moveTo(e.x+Math.cos(a)*(e.r-8),e.y+Math.sin(a)*(e.r-8));ctx.lineTo(e.x+Math.cos(a)*(e.r+11),e.y+Math.sin(a)*(e.r+11));ctx.stroke()}ctx.restore()}
function moveBoss(e,dt){
  if(e.bossKind==='harvester'){moveHarvester(e,dt);return}
  if(e.bossKind==='warden'){moveWarden(e,dt);return}
  if(e.phase==='approach'){
    const target=streetSession?streetSteering(e):p,angle=Math.atan2(target.y-e.y,target.x-e.x);e.x+=Math.cos(angle)*e.speed*dt;e.y+=Math.sin(angle)*e.speed*dt;e.phaseTime-=dt;
    if(e.phaseTime<=0&&dist(e,p)<420){
      const aim=Math.atan2(p.y-e.y,p.x-e.x);e.chargeX=Math.cos(aim);e.chargeY=Math.sin(aim);e.chargeLength=clamp(dist(e,p)+90,180,360);e.phase='warn';e.phaseTime=BREAKER_TUNING.windup;if(sampleLookActive())playStyleAudio('warning');
    }
  }else if(e.phase==='warn'){
    e.phaseTime-=dt;if(e.phaseTime<=0){e.phase='charge';e.phaseTime=BREAKER_TUNING.chargeTime;sound(110,.12,'sawtooth',.025,'alerts')}
  }else if(e.phase==='charge'){
    const step=Math.min(dt,e.phaseTime)*e.chargeLength/BREAKER_TUNING.chargeTime;e.x+=e.chargeX*step;e.y+=e.chargeY*step;e.phaseTime=Math.max(0,e.phaseTime-dt);
    if(e.phaseTime<=0){e.phase='recover';e.phaseTime=BREAKER_TUNING.recovery}
  }else if(e.phase==='recover'){
    e.phaseTime-=dt;if(e.phaseTime<=0){e.phase='approach';e.phaseTime=BREAKER_TUNING.approach}
  }
}
function bossBearing(e){
  const arrows=['→','↘','↓','↙','←','↖','↑','↗'];return arrows[(Math.round(Math.atan2(e.y-p.y,e.x-p.x)/(Math.PI/4))+8)%8];
}
