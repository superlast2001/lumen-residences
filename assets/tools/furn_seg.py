# Segment Ares's furniture sheet (bottom of ares-apartment.png) into item candidates; writes a numbered contact sheet.
import numpy as np,scipy.ndimage as nd,json
from PIL import Image,ImageDraw
im=Image.open('../src/ares_apartment.png').convert('RGB');A=np.asarray(im).astype(int)
y0=548;R=A[y0:]
bg=np.median(R[::7,::7].reshape(-1,3),axis=0);print('bg',bg)
lum=R.mean(-1);sat=R.max(-1)-R.min(-1);fg=(lum>44)|(sat>28)
fg=nd.binary_opening(fg,iterations=1);fg=nd.binary_closing(fg,iterations=1);fg=nd.binary_fill_holes(fg)
lab0,_=nd.label(nd.binary_dilation(fg,iterations=2))
lab=lab0*fg;k=lab.max();objs=nd.find_objects(lab);items=[]
for i,sl in enumerate(objs):
    h=sl[0].stop-sl[0].start;w=sl[1].stop-sl[1].start;s=(lab[sl]==i+1).sum()
    if s<260 or h<14 or w<14: continue
    items.append(dict(id=len(items),box=[sl[1].start,sl[0].start+y0,sl[1].stop,sl[0].stop+y0],lab=i+1,px=int(s)))
np.save('/tmp/v/furn_lab.npy',lab);json.dump(items,open('/tmp/v/furn_items.json','w'))
c=im.copy().resize((im.width*2,im.height*2));dr=ImageDraw.Draw(c)
for it in items:
    x0,yy0,x1,y1=[v*2 for v in it['box']];dr.rectangle([x0,yy0,x1,y1],outline=(0,255,0));dr.text((x0+2,yy0+1),str(it['id']),fill=(255,255,0))
c.crop((0,y0*2,c.width,c.height)).save('/tmp/v/furn_ids.png');print(len(items))
