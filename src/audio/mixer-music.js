const audioVoices=new Set();
function stopAudioVoices(){for(const cancel of [...audioVoices])cancel()}
function startAudioVoice(from,to,len,type,volume,bus='effects',ended=null){
 bus=bus==='alerts'?'alerts':'effects';if(!musicOn||document.hidden||audioOutputLevel(bus)===0)return false;unlockAudio();if(activeAudioVoices>=24||bus==='effects'&&effectAudioVoices>=20)return false;
 let o,a,occupied=false;const cancel=()=>{try{o?.stop()}catch{}cleanup()},cleanup=()=>{if(!occupied)return;occupied=false;audioVoices.delete(cancel);activeAudioVoices--;if(bus==='effects')effectAudioVoices--;try{o.disconnect();a.disconnect()}catch{}if(ended)ended()};
 try{const mix=getAudioMix(),at=audioCtx.currentTime;o=audioCtx.createOscillator();a=audioCtx.createGain();o.type=type;o.frequency.setValueAtTime(from,at);o.frequency.exponentialRampToValueAtTime(Math.max(30,to),at+len);a.gain.setValueAtTime(volume,at);a.gain.exponentialRampToValueAtTime(.0001,at+len);o.connect(a);a.connect(mix[bus]);o.onended=cleanup;activeAudioVoices++;if(bus==='effects')effectAudioVoices++;occupied=true;audioVoices.add(cancel);o.start();o.stop(at+len);return true}catch{cleanup();try{o?.disconnect();a?.disconnect()}catch{}return false}
}
// One cached, original 48-second loop; no game RNG, network, sequencer or timers.
function stopBackgroundMusic(reset=false){
 const handle=musicTrack.node;musicTrack.node=null;if(reset)musicTrack.offset=0;
 if(!handle)return;
 if(!reset&&!handle.preview&&musicTrack.buffer)musicTrack.offset=(handle.offset+Math.max(0,handle.ctx.currentTime-handle.startedAt))%musicTrack.buffer.duration;
 if(musicTrack.tail){const old=musicTrack.tail;try{old.source.stop()}catch{}old.cleanup()}
 musicTrack.tail=handle;
 try{const at=handle.ctx.currentTime,param=handle.gain.gain;param.cancelScheduledValues?.(at);param.setValueAtTime(param.value,at);if(param.linearRampToValueAtTime)param.linearRampToValueAtTime(0,at+.025);handle.source.stop(at+.03)}catch{handle.cleanup()}
}
function syncBackgroundMusic(){
 const preview=musicTrack.preview&&['paused','settings'].includes(mode);
 if(document.hidden||!musicOn||preferences.masterVolume===0||preferences.musicVolume===0||mode!=='play'&&!preview){musicTrack.preview=false;stopBackgroundMusic();return}
 if(musicTrack.error){musicTrack.preview=false;return}if(musicTrack.node||musicTrack.loading)return;
 try{
  const mix=getAudioMix(),ctx=audioCtx;
  if(musicTrack.ctx!==ctx){musicTrack.buffer=null;musicTrack.ctx=ctx;musicTrack.offset=0}
  if(!musicTrack.buffer){
   const asset=JSON.parse(document.getElementById('musicAsset').textContent),bytes=Uint8Array.from(atob(asset.data.split(',')[1]),c=>c.charCodeAt(0));
   const pending=Promise.resolve(ctx.decodeAudioData(bytes.buffer));musicTrack.loading=pending;
   pending.then(buffer=>{if(musicTrack.loading!==pending)return;musicTrack.loading=null;if(!buffer||!Number.isFinite(buffer.duration)||buffer.duration<=0)throw Error('Invalid music');musicTrack.buffer=buffer;syncBackgroundMusic();refreshAudioControls()}).catch(()=>{if(musicTrack.loading&&musicTrack.loading!==pending)return;musicTrack.loading=null;musicTrack.error=true;musicTrack.preview=false;refreshAudioControls()});return;
  }
  const source=ctx.createBufferSource(),gain=ctx.createGain(),at=ctx.currentTime,offset=preview?0:musicTrack.offset%musicTrack.buffer.duration;
  const handle={source,gain,ctx,preview,offset,startedAt:at,cleaned:false,cleanup(){if(handle.cleaned)return;handle.cleaned=true;source.onended=null;try{source.disconnect();gain.disconnect()}catch{}if(musicTrack.tail===handle)musicTrack.tail=null;if(musicTrack.node===handle){musicTrack.node=null;if(handle.preview){musicTrack.preview=false;refreshAudioControls()}}}};
  source.buffer=musicTrack.buffer;source.loop=true;source.loopStart=0;source.loopEnd=musicTrack.buffer.duration;source.connect(gain);gain.connect(mix.music);gain.gain.setValueAtTime(0,at);if(gain.gain.linearRampToValueAtTime)gain.gain.linearRampToValueAtTime(1,at+.08);else gain.gain.setValueAtTime(1,at);source.onended=handle.cleanup;musicTrack.node=handle;
  if(preview)source.start(at,offset,6);else source.start(at,offset);
 }catch{stopBackgroundMusic();musicTrack.error=true;musicTrack.preview=false;refreshAudioControls()}
}
function audioControls(withMute=false){
 return `<section class="medal-goals audio-controls" aria-label="Audio volume"><h2 style="font-size:16px;color:#ffdf93;margin:0 0 10px">AUDIO</h2>${Object.entries(AUDIO_LEVELS).map(([key,label])=>`<div class="audio-row"><label for="audio-${key}">${label} <output id="audio-value-${key}">${preferences[key]}%</output></label><input id="audio-${key}" type="range" min="0" max="100" step="5" value="${preferences[key]}" aria-valuetext="${preferences[key]} percent"></div>`).join('')}<p class="muted">Master changes everything. Effects covers combat and pickups; Alerts covers danger and encounter cues. Music plays the original Night Watch track during active play.</p><div class="result-actions">${withMute?`<button class="btn secondary" id="sound">Sound: ${musicOn?'ON':'OFF'}</button>`:''}<button class="btn secondary" id="audioTestEffects">TEST EFFECTS</button><button class="btn secondary" id="audioTestAlerts">TEST ALERTS</button><button class="btn secondary" id="audioTestMusic">PREVIEW MUSIC · 6 SEC</button><button class="btn secondary" id="audioReset">RESET LEVELS</button></div><p id="audioStatus" class="muted" role="status"></p></section>`;
}
function refreshAudioControls(){
 for(const key of Object.keys(AUDIO_LEVELS)){const input=document.getElementById('audio-'+key),value=document.getElementById('audio-value-'+key);if(input){input.value=String(preferences[key]);input.setAttribute('aria-valuetext',preferences[key]+' percent')}if(value)value.textContent=preferences[key]+'%'}
 const button=document.getElementById('sound');if(button)button.textContent='Sound: '+(musicOn?'ON':'OFF');
 const status=document.getElementById('audioStatus'),storageNote=preferences.readOnly?'Levels last for this visit; newer preferences are preserved.':preferences.available?'Levels saved in this browser.':'Storage unavailable; levels last for this visit.';if(status)status.textContent=(!musicOn||preferences.masterVolume===0?'Muted. Turn Sound on and raise Master to hear previews. ':'')+storageNote+(musicTrack.error?' Music could not load in this browser; effects still work.':'');const preview=document.getElementById('audioTestMusic');if(preview)preview.textContent=musicTrack.preview?'STOP MUSIC PREVIEW':'PREVIEW MUSIC · 6 SEC';
}
function bindAudioControls(){
 const current=input=>['paused','settings'].includes(mode)&&!document.hidden&&input.isConnected&&document.getElementById(input.id)===input;
 for(const key of Object.keys(AUDIO_LEVELS)){const input=document.getElementById('audio-'+key);input.addEventListener('input',()=>{if(!current(input))return;const value=Number(input.value);if(!Number.isFinite(value))return;preferences[key]=cleanAudioLevel(value,key==='musicVolume'?35:80);applyAudioMix();syncBackgroundMusic();savePreferences();refreshAudioControls()})}
 for(const bus of ['Effects','Alerts'])bindPress(document.getElementById('audioTest'+bus),()=>{if(['paused','settings'].includes(mode)&&!document.hidden)sound(bus==='Effects'?460:220,.18,'triangle',.03,bus.toLowerCase())});
 bindPress(document.getElementById('audioTestMusic'),()=>{if(!['paused','settings'].includes(mode)||document.hidden)return;musicTrack.preview=!musicTrack.preview;syncBackgroundMusic();refreshAudioControls()});
 bindPress(document.getElementById('audioReset'),()=>{if(!['paused','settings'].includes(mode)||document.hidden)return;for(const key of Object.keys(AUDIO_LEVELS))preferences[key]=key==='musicVolume'?35:80;applyAudioMix();syncBackgroundMusic();savePreferences();refreshAudioControls()});refreshAudioControls();
}
