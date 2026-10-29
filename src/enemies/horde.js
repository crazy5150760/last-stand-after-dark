function evasiveMultiplier(){return p.evasive&&p.evasiveUntil>elapsed?1.2:1}
function hordeSpawnInterval(){return .085+.695*Math.exp(-elapsed/150)}
function spawnEnemy(){let angle=rand(0,Math.PI*2),radius=Math.max(W,H)*.65+rand(50,180),tier=Math.random();let type=tier<.14&&elapsed>30?2:tier<.34?1:0;let stats=[{hp:30,spd:70,r:ENEMY_ART.shambler.r,dmg:12,col:ENEMY_ART.shambler.col},{hp:19,spd:130,r:ENEMY_ART.runner.r,dmg:9,col:ENEMY_ART.runner.col},{hp:95,spd:49,r:ENEMY_ART.brute.r,dmg:20,col:ENEMY_ART.brute.col},{hp:700,spd:55,r:45,dmg:30,col:'#ee6a85'}][type];let scale=(1+elapsed/200)*ruleById(runRule).horde;enemies.push({x:p.x+Math.cos(angle)*radius,y:p.y+Math.sin(angle)*radius,hp:stats.hp*scale,max:stats.hp*scale,speed:stats.spd* Math.min(1.6,1+elapsed/350)*overtimePressure().speed,r:stats.r,dmg:stats.dmg,col:stats.col,hit:0,type})}
function burst(x,y,color,n=9){if(preferences.reduced)n=Math.min(n,4);for(let i=0;i<n&&particles.length<(preferences.reduced?120:FX_LIMITS.particles);i++){let a=rand(0,Math.PI*2),s=rand(25,160);particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:rand(.2,.65),max:.65,color,r:rand(2,5)})}}function floatText(x,y,t,color='#f9e7a2'){if(!preferences.numbers&&/^(?:(?:FIRE|BLAST|LIGHTNING|BLADES) )?\d+(?:\.\d+)?$/.test(String(t)))return;if(texts.length>=FX_LIMITS.texts)return;texts.push({x,y,t,color,life:.8})}function hitEnemy(e,d,source=''){
 if(e.hp<=0||!Number.isFinite(d)||d<=0)return;
 noteFieldHit(e,d,source);if(streetSession)streetCombatHit(e,d);
 if(e.trainingDummy){if(sampleLookActive())playStyleAudio('impact');const actual=Math.min(e.hp,d),row=practiceLedger[weaponSource(source)];row.damage+=actual;practiceHits++;if(d>=e.hp){row.kills++;practiceTargets++}e.hp-=d;e.hit=.08;floatText(e.x,e.y,Math.round(d));burst(e.x,e.y,e.col,3);return}
 if(e.convoy){hitConvoy(e,d);return}
 const tally=weaponLedger[weaponSource(source)];tally.damage+=Math.min(e.hp,d);
 e.hp-=d;e.hit=.08;burst(e.x,e.y,e.col,3);
 const bypass=e.riot&&riotShieldUp(e)&&['LIGHTNING','BLADES','BLAST','FIRE'].includes(source);
 floatText(e.x,e.y,bypass?`${source} ${Math.round(d)}`:Math.round(d),bypass?'#a7ffda':'#f9e7a2');
 if(e.hp<=0){
  tally.kills++;killCount++;recordPace(1,0);const species=enemySpecies(e);if(species)enemyTally[species]=Math.min(1e9,enemyTally[species]+1);
  if(source==='FIRE')burnKills++;if(e.spitter)spittersDefeated++;if(e.riot)riotsDefeated++;
  burst(e.x,e.y,e.col,e.type===3?35:12);gems.push({x:e.x,y:e.y,r:e.type===3?11:7,value:e.type===3?20:e.type===2?4:e.spitter||e.riot||e.howler||e.lobber?3:1});
  if(killCount%25===0&&elapsed>=reliefUntil)toast(`${killCount} ELIMINATED`);sound(130,.055,'triangle',.018);if(e===activeBoss)defeatBoss(e);
 }
}
// Limited ranged pressure: visible locked aim, then one slow non-homing shot.
