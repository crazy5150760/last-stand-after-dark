"""Build compact static portraits from the game's accepted runtime frames.

Pillow required. Run from the project root, optionally with --output-dir /tmp/path.
No source artwork is changed. Only new bestiary-portraits.webp/.json are written.
The lossless export equals the selected crops after capped Lanczos thumbnailing,
not the larger original source images. Combat continues using its existing files.
"""
from pathlib import Path
from PIL import Image
import argparse,hashlib,json,re,sys
sys.dont_write_bytecode=True
from pack_sprite_atlas import pack_image

SELECTIONS=[('shambler','shamblerWalk',16),('runner','runnerRun',16),
 ('brute','bruteWalk',16),('hunter','hunter',2),('breaker','breakerCombat',2),('warden','warden',2),
 ('harvester','harvester',2),('riot','riot',2),('spitter','spitter',2),
 ('howler','howler',2),('lobber','lobber',2)]

def build(root,output):
 catalog=json.loads(re.search(r'<script id="sampleAssets"[^>]*>(.*?)</script>',(root/'dist/index.html').read_text(),re.S)[1])
 crops=[];sources=[];sha=lambda b:hashlib.sha256(b).hexdigest()
 for enemy,asset,index in SELECTIONS:
  meta=catalog[asset];raw=(root/'dist'/meta['file']).read_bytes();x,y,w,h=meta['frames'][index]
  original=Image.open(root/'dist'/meta['file']).convert('RGBA').crop((x,y,x+w,y+h))
  factor=min(1,80/h);size=(max(1,round(w*factor)),min(h,80))
  crop=original.resize(size,Image.Resampling.LANCZOS) if size!=original.size else original
  crops.append(crop);sources.append({'enemy':enemy,'asset':asset,'file':meta['file'],'runtime_sha256':sha(raw),'frame':index,'crop':[x,y,w,h],'thumbnail_size':list(size),'thumbnail_RGBA_sha256':sha(crop.tobytes())})
 strip=Image.new('RGBA',(sum(im.width for im in crops),max(im.height for im in crops)));frames=[];x=0
 for im in crops:strip.paste(im,(x,0));frames.append([x,0,im.width,im.height]);x+=im.width
 image,frames=pack_image(strip,frames);output.mkdir(parents=True,exist_ok=True);target=output/'bestiary-portraits.webp';image.save(target,'WEBP',lossless=True,method=6,exact=True)
 decoded=Image.open(target).convert('RGBA')
 for crop,(x,y,w,h) in zip(crops,frames):assert crop.tobytes()==decoded.crop((x,y,x+w,y+h)).tobytes()
 result={'file':'assets/bestiary-portraits.webp','width':image.width,'height':image.height,'sha256':sha(target.read_bytes()),'ids':[s['enemy'] for s in sources],'frames':frames,'padding':2,'sources':sources,'encoding':'Lossless WebP, method 6, exact RGBA; selected accepted runtime crops capped at 80px height with Lanczos, no enlargement.','rgba_exact_to_thumbnail_reference':True,'thumbnail_height_cap':80,'usage':'Static Bestiary only; one shared image, no combat animation-sheet decoding. Includes the accepted violet-jacket Blackout Hunter.'}
 (output/'bestiary-portraits.json').write_text(json.dumps(result,indent=2)+'\n');return result

if __name__=='__main__':
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--output-dir',type=Path);args=parser.parse_args();root=Path(__file__).resolve().parent.parent
 result=build(root,args.output_dir or root/'dist/assets');print(json.dumps({k:result[k] for k in ['width','height','sha256','ids']}))
