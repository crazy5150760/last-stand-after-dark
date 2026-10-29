"""Pack existing sprite crops without changing their RGBA pixels or pivots.

Requires Pillow. Example (writes new output, preserves original source/metadata):
python tools/pack_sprite_atlas.py --source dist/assets/riot-field.png \
  --metadata dist/assets/riot-field.json --output /tmp/riot-packed.webp \
  --metadata-output /tmp/riot-packed.json

Source metadata describes reference coordinates; packedRuntime is the export.
"""
from PIL import Image
import math,json
from pathlib import Path
def pack_rects(sizes,W,H):
 free=[(0,0,W,H)];placed={}
 for i,(w,h) in sorted(enumerate(sizes),key=lambda a:(max(a[1]),a[1][0]*a[1][1],a[1][1]),reverse=True):
  candidates=[(min(fw-w,fh-h),max(fw-w,fh-h),y,x,j) for j,(x,y,fw,fh) in enumerate(free) if w<=fw and h<=fh]
  if not candidates:return None
  _,_,y,x,j=min(candidates);r=(x,y,w,h);placed[i]=r;nextfree=[]
  for fx,fy,fw,fh in free:
   if x>=fx+fw or x+w<=fx or y>=fy+fh or y+h<=fy:nextfree.append((fx,fy,fw,fh));continue
   if x>fx:nextfree.append((fx,fy,x-fx,fh))
   if x+w<fx+fw:nextfree.append((x+w,fy,fx+fw-x-w,fh))
   if y>fy:nextfree.append((fx,fy,fw,y-fy))
   if y+h<fy+fh:nextfree.append((fx,y+h,fw,fy+fh-y-h))
  unique=list(dict.fromkeys(nextfree));free=[a for k,a in enumerate(unique) if not any(k!=j and a[0]>=b[0] and a[1]>=b[1] and a[0]+a[2]<=b[0]+b[2] and a[1]+a[3]<=b[1]+b[3] for j,b in enumerate(unique))]
 return placed

def pack_image(image,frames):
 padding=2;sizes=[(r[2]+padding*2,r[3]+padding*2) for r in frames];area=sum(w*h for w,h in sizes);best=None
 for W in [256,288,320,352,384,416,448,480,512,576,640,768,896,1024]:
  if W<max(w for w,h in sizes):continue
  start=math.ceil(max(max(h for w,h in sizes),area/W)/4)*4
  for H in range(start,start+400,4):
   if best and W*H>=best[0]:break
   result=pack_rects(sizes,W,H)
   if result:best=(W*H,W,H,result);break
 assert best
 _,W,H,positions=best;out=Image.new('RGBA',(W,H));packed=[]
 for i,(x,y,w,h) in enumerate(frames):
  X,Y,_,_=positions[i];X+=padding;Y+=padding;out.paste(image.crop((x,y,x+w,y+h)),(X,Y));packed.append([X,Y,w,h])
 return out,packed

if __name__=='__main__':
 import argparse,hashlib
 parser=argparse.ArgumentParser(description=__doc__)
 parser.add_argument('--source',required=True,type=Path)
 parser.add_argument('--metadata',required=True,type=Path)
 parser.add_argument('--output',required=True,type=Path)
 parser.add_argument('--metadata-output',type=Path)
 args=parser.parse_args()
 if args.output.resolve() in [args.source.resolve(),args.metadata.resolve()] or (args.metadata_output and args.metadata_output.resolve() in [args.source.resolve(),args.metadata.resolve(),args.output.resolve()]):parser.error('Outputs must differ from original source and metadata.')
 meta=json.loads(args.metadata.read_text());reference=meta.get('referenceAtlas',meta);image=Image.open(args.source).convert('RGBA');size=(reference['width'],reference['height'])
 if image.size!=size:image=image.resize(size,Image.Resampling.LANCZOS)
 frames=reference['frames']
 for x,y,w,h in frames:
  if not(x>=0 and y>=0 and w>0 and h>0 and x+w<=image.width and y+h<=image.height):parser.error('Reference crop outside image.')
 packed,export=pack_image(image,frames);packed.save(args.output,'WEBP',lossless=True,method=6,exact=True);decoded=Image.open(args.output).convert('RGBA');hashes=[]
 for old,new in zip(frames,export):
  x,y,w,h=old;X,Y,W,H=new;before=image.crop((x,y,x+w,y+h)).tobytes();after=decoded.crop((X,Y,X+W,Y+H)).tobytes()
  if before!=after:raise ValueError('Frame RGBA changed during packing.')
  hashes.append(hashlib.sha256(after).hexdigest())
 result={'width':packed.width,'height':packed.height,'frames':export,'cellBounds':[[x-2,y-2,w+4,h+4]for x,y,w,h in export],'padding':2,'pivots':meta.get('pivots'),'referenceHeights':meta.get('referenceHeights'),'frame_rgba_sha256':hashes,'runtime_sha256':hashlib.sha256(args.output.read_bytes()).hexdigest()}
 if args.metadata_output:args.metadata_output.write_text(json.dumps(result,indent=2)+'\n')
 print(json.dumps({'frames':len(export),'width':packed.width,'height':packed.height,'runtime_bytes':args.output.stat().st_size,'frame_RGBA_exact':True}))
