# Remove the prop seat (beanbag / crate / block) from the sheet's sitting sprite so a tenant can sit on placed furniture.
# The character pixels are untouched; only the seat's pixels are made transparent (SAM mask from box + point prompts).
import sys,numpy as np,torch
from PIL import Image
from scipy import ndimage as ndi
from segment_anything import sam_model_registry,SamPredictor
P={'ares':dict(box=[40,165,384,336],pos=[(80,215),(150,320),(330,300),(360,190),(300,320)],neg=[(150,200),(250,170),(230,215),(260,225),(40,300),(280,210),(200,280),(120,260)]),
   'zayne':dict(box=[45,165,309,297],pos=[(200,250),(260,240),(290,230),(70,190),(60,215),(170,280)],neg=[(100,250),(130,215),(170,190),(150,170),(40,255),(20,250),(200,190)]),
   'batzz':dict(box=[0,250,282,348],pos=[(250,300),(255,330),(240,270)],neg=[(150,300),(120,330),(200,280),(60,290),(180,330),(100,260)])}
sam=sam_model_registry['vit_b'](checkpoint='/workspace/tools/weights/sam_vit_b.pth');pr=SamPredictor(sam)
for d in sys.argv[1:]:
  im=Image.open(f'{d}/emote_sit_hd.png').convert('RGBA');a=np.array(im);rgb=a[...,:3].astype(float);al=a[...,3:]/255.
  comp=(rgb*al+128*(1-al)).astype(np.uint8);pr.set_image(comp);q=P[d]
  pts=np.array(q['pos']+q['neg']);lab=np.array([1]*len(q['pos'])+[0]*len(q['neg']))
  m,sc,_=pr.predict(point_coords=pts,point_labels=lab,box=np.array(q['box']),multimask_output=True);i=int(np.argmax(sc));seat=m[i]
  seat=ndi.binary_dilation(seat,iterations=1)
  na=a.copy();na[...,3]=np.where(seat,0,a[...,3])
  # keep the main body component (drop crumbs of the seat left behind)
  lab2,n=ndi.label(na[...,3]>20);
  if n>1:
    sz=ndi.sum(np.ones_like(lab2),lab2,range(1,n+1));keep=np.isin(lab2,[j+1 for j,s in enumerate(sz) if s>=.04*sz.max()]);na[...,3]=np.where(keep,na[...,3],0)
  Image.fromarray(na).save(f'/tmp/sitns_{d}.png');print(d,'score',sc[i],'removed px',int(seat.sum()))
