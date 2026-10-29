function unlockAudio(){if(audioCtx&&audioCtx.state==='suspended')audioCtx.resume().catch(()=>{})}
function sound(freq=250,len=.06,type='square',volume=.025,bus='effects'){startAudioVoice(freq,Math.max(30,freq*.52),len,type,volume,bus)}
