"""Original Last Stand score: Night Watch. Requires Python/numpy and ffmpeg.
Run from project root. Writes the Ogg and its reproducible score manifest.
No recordings, sample packs, online services or gameplay RNG are used.
"""
from pathlib import Path
import hashlib, json, subprocess, tempfile, wave
import numpy as np

RATE=24000
BPM=80
BEAT=60/BPM
DURATION=64*BEAT
N=round(RATE*DURATION)
score=np.zeros((N,2),dtype=np.float64)
rng=np.random.default_rng(433)
notes=[]
def hz(midi):return 440*2**((midi-69)/12)
def voice(start,beats,midi,kind,level,pan=0):
    length=beats*BEAT;t=np.arange(round(length*RATE))/RATE;f=hz(midi)
    if kind=='pad':
        s=(np.sin(2*np.pi*f*t)+.26*np.sin(2*np.pi*f*1.003*t)+.12*np.sin(4*np.pi*f*t))
        env=np.minimum(t/.7,1)*np.minimum((length-t)/1.1,1)
    elif kind=='bass':
        s=np.sin(2*np.pi*f*t)+.16*np.sin(4*np.pi*f*t)
        env=np.minimum(t/.025,1)*np.exp(-t*2.8)*np.minimum((length-t)/.1,1)
    else:
        s=np.sin(2*np.pi*f*t)+.17*np.sin(4*np.pi*f*t)
        env=np.minimum(t/.015,1)*np.exp(-t*2.7)*np.minimum((length-t)/.15,1)
    s*=env*level
    begin=round(start*BEAT*RATE);idx=(begin+np.arange(len(s)))%N
    score[idx,0]+=s*np.sqrt((1-pan)/2);score[idx,1]+=s*np.sqrt((1+pan)/2)
    notes.append([start,beats,midi,kind])
# D minor / B-flat / F / C, two bars per chord, repeated with a sparse answer.
chords=[(38,[50,57,65]),(34,[50,58,65]),(41,[53,60,69]),(36,[52,55,62])]
for section in range(8):
    root,chord=chords[section%4];base=section*8
    for j,m in enumerate(chord):voice(base,8.4,m,'pad',.022,(-.5,0,.5)[j])
    for beat in range(8):
        voice(base+beat, .85,root,'bass',.053 if beat%2==0 else .032)
        if beat in [1,4,6]:voice(base+beat+.5,1.7,chord[(beat+section)%3]+12,'bell',.017,(-.45,.45)[beat%2])
    if section>=4:voice(base+7,1.8,chord[1]+12,'bell',.012,.35)
# Soft heartbeat-like kick and brushed hat; no alarm-like high lead.
for beat in range(64):
    length=.24;t=np.arange(round(length*RATE))/RATE
    phase=2*np.pi*(44*t+28*(1-np.exp(-t*22))/22)
    kick=np.sin(phase)*np.minimum(t/.006,1)*np.exp(-t*19)*.044
    idx=(round(beat*BEAT*RATE)+np.arange(len(t)))%N
    score[idx,:]+=kick[:,None]*.707
    t=np.arange(round(.07*RATE))/RATE;noise=rng.normal(0,1,len(t));noise=np.diff(noise,prepend=noise[0])
    hat=noise*np.minimum(t/.003,1)*np.exp(-t*65)*.0018
    idx=(round((beat+.5)*BEAT*RATE)+np.arange(len(t)))%N
    score[idx,:]+=hat[:,None]*np.array([.6,.8])
# Circular delay gives the same ambience at the seam as in the middle.
dry=score.copy()
for delay,amount in [(BEAT*.75,.2),(BEAT*1.5,.11),(BEAT*2.25,.065)]:
    score+=np.roll(dry[:,::-1],round(delay*RATE),axis=0)*amount
score-=score.mean(axis=0)
score*=.072/np.max(np.abs(score))
pcm=np.round(score*32767).astype('<i2')
out=Path('dist/assets');out.mkdir(parents=True,exist_ok=True)
with tempfile.TemporaryDirectory() as temp:
    wav=Path(temp)/'night-watch.wav'
    with wave.open(str(wav),'wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(RATE);w.writeframes(pcm.tobytes())
    subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(wav),'-c:a','libvorbis','-q:a','2',str(out/'night-watch.ogg')],check=True)
asset=out/'night-watch.ogg'
info={'title':'Night Watch','composer':'Original score composed for Last Stand: After Dark','license':'Project-original synthesized composition; no third-party samples','bpm':BPM,'duration_seconds':DURATION,'sample_rate':RATE,'channels':2,'bars':16,'key':'D minor','progression':['Dm','Bb','F','C'],'notes':len(notes),'peak_before_encoding':float(np.max(np.abs(score))),'rms_before_encoding':float(np.sqrt(np.mean(score**2))),'loop_seam_pcm_delta':float(np.max(np.abs(score[0]-score[-1]))),'sha256':hashlib.sha256(asset.read_bytes()).hexdigest(),'bytes':asset.stat().st_size,'source':'tools/compose_music.py','rebuild':'python tools/compose_music.py (Python/numpy and ffmpeg libvorbis)'}
(out/'music.json').write_text(json.dumps(info,indent=2)+'\n')
print(json.dumps(info,indent=2))
