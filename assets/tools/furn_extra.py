# Extra furniture slices (TV, kitchen, gym gear) from the user's furniture sheet: crop + colour-distance background key only.
import numpy as np,scipy.ndimage as nd,json,sys
from PIL import Image
sys.path.insert(0,'.')
A=np.asarray(Image.open('../src/ares_apartment.png').convert('RGB')).astype(int)
L=[('tv','Big TV + console','living',90,'tv',(940,655,998,748)),
 ('table_marble','Marble coffee table','living',35,None,(949,617,1023,678)),
 ('table_dark','Dark coffee table','living',30,None,(1089,613,1159,664)),
 ('sofa_grey','Grey sofa','living',55,'sit',(1114,669,1176,720)),
 ('stove','Oven range','kitchen',45,'cook',(896,644,929,684)),
 ('island','Marble kitchen island','kitchen',85,'cook',(846,637,921,714)),
 ('stools','Red bar stools','kitchen',25,'sit',(827,692,873,744)),
 ('counter','Double sink counter','kitchen',50,None,(787,562,859,638)),
 ('dumbbells','Dumbbell set','gym',60,'lift',(261,939,379,1008)),
 ('benchpress','Bench press station','gym',90,'lift',(266,867,386,944)),
 ('barbells','Barbell pair','gym',30,'lift',(434,854,523,927)),
 ('bench','Flat weight bench','gym',45,'lift',(367,839,439,888)),
 ('abbench','Curved ab bench','gym',35,'stretch',(322,912,384,964)),
]
def cut(box,name):
    M=10;x0,y0,x1,y1=box;X0,Y0,X1,Y1=x0-M,y0-M,x1+M,y1+M;a=A[Y0:Y1,X0:X1]
    brd=np.concatenate([a[0],a[-1],a[:,0],a[:,-1]]);bg=np.percentile(brd,30,axis=0);d=np.abs(a-bg).max(-1)
    fg=d>(7 if bg.max()<22 else 13);fg=nd.binary_opening(fg,iterations=1);fg=nd.binary_fill_holes(nd.binary_closing(fg,iterations=1))
    lab,k=nd.label(fg,structure=np.ones((3,3)));h,w=fg.shape
    inner=np.zeros_like(fg);inner[M:h-M,M:w-M]=1
    keep=np.zeros_like(fg);best=0
    sizes=[];
    for i in range(1,k+1):
        m=lab==i;s=m.sum();ins=(m&inner).sum();sizes.append((i,s,ins))
    big=max(ins for i,s,ins in sizes)
    for i,s,ins in sizes:
        if ins>=0.75*s and s>=0.04*big: keep|=lab==i
    er=nd.binary_erosion(keep,iterations=2);l2,k2=nd.label(er)
    if k2>1:
        sz2=nd.sum(np.ones(er.shape),l2,range(1,k2+1));main=l2==(int(np.argmax(sz2))+1);keep=keep&nd.binary_dilation(main,iterations=4)
    al=keep.astype(np.float32);rim=keep&~nd.binary_erosion(keep);al[rim]=np.clip((d[rim]-4)/14,0.35,1)
    out=Image.fromarray(np.dstack([a.astype(np.uint8),(al*255).astype(np.uint8)]));out=out.crop(out.getbbox());out.save(f'../furn/{name}.png');return list(out.size)
meta=json.load(open('../furn/furn.json'))
for k,n,c,p,act,box in L:
    meta['furn'][k]=dict(n=n,cat=c,price=p,act=act,size=cut(box,k))
json.dump(meta,open('../furn/furn.json','w'),indent=1)
from esr import *
for k,*_ in L:
    im=Image.open(f'../furn/{k}.png');u=upscale_rgba(im).resize((im.width*3,im.height*3),Image.LANCZOS);u.save(f'../furn/{k}_hd.png',optimize=True);print(k,flush=True)
