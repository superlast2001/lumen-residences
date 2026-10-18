# Head fidelity check: (1) cg_full's head must be the sheet's pixels exactly; (2) the 4x ESRGAN head, downsampled back,
# must match it closely (shape-preserving) — rejects if mean error is high or edges move. Writes a side-by-side image.
import numpy as np,sys
from PIL import Image
sh=np.asarray(Image.open('sheet.png').convert('RGB')).astype(int);cf=Image.open('cg_full.png').convert('RGBA');u=Image.open('cg_full_4x.png').convert('RGBA')
hb=(205,0,350,150);H=np.asarray(cf.crop(hb)).astype(int);m=H[...,3]==255
# locate in sheet (CG panel area)
best=None
for y in range(0,60):
  for x in range(0,200):
    d=np.abs(sh[y:y+150,x:x+145]-H[...,:3])[m].mean()
    if best is None or d<best[0]: best=(d,x,y)
print('head vs sheet: mean abs diff %.3f at sheet (%d,%d)'%best)
U=u.crop(tuple(v*4 for v in hb));D=np.asarray(U.resize((145,150),Image.LANCZOS)).astype(int)
err=np.abs(D[...,:3]-H[...,:3])[m].mean()
from scipy import ndimage as nd
e1=np.hypot(nd.sobel(H[...,:3].mean(-1),0),nd.sobel(H[...,:3].mean(-1),1))>60;e2=np.hypot(nd.sobel(D[...,:3].mean(-1),0),nd.sobel(D[...,:3].mean(-1),1))>60
iou=(e1&nd.binary_dilation(e2)).sum()/max(1,e1.sum())
print('ESRGAN head (downsampled back) mean abs diff %.2f, edge agreement %.3f'%(err,iou));ok=err<8 and iou>.9;print('ACCEPT' if ok else 'REJECT')
sbs=Image.new('RGB',(145*4*2+20,600),(20,16,26));org=Image.fromarray(H.astype(np.uint8)).resize((580,600),Image.NEAREST)
bg=Image.new('RGBA',org.size,(20,16,26,255));bg.alpha_composite(org.convert('RGBA'));sbs.paste(bg.convert('RGB'),(0,0))
bg2=Image.new('RGBA',U.size,(20,16,26,255));bg2.alpha_composite(U);sbs.paste(bg2.convert('RGB'),(600,0));sbs.save('/workspace/fantasy-town/screenshot-ares-head-compare.png')
sys.exit(0 if ok else 1)
