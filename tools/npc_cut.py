import numpy as np, json, glob, os, sys
from PIL import Image
from scipy import ndimage as nd
SRC='/workspace/npcgen/sheets'; OUT='/workspace/lumen-residences/assets/npc'
os.makedirs(OUT,exist_ok=True)
VIEWS=['front','side','back','act']
TARGET=300  # px height for front view
meta={}
def cut(path):
    im=np.asarray(Image.open(path).convert('RGB')).astype(np.float32)
    H,W,_=im.shape
    dark=(255-im).max(2)              # distance from white
    cand=dark<26
    lab,n=nd.label(cand)
    border=set(np.unique(np.r_[lab[0],lab[-1],lab[:,0],lab[:,-1]]))-{0}
    bg=np.isin(lab,list(border))
    # soft edge band: within 2px of bg
    near=nd.binary_dilation(bg,iterations=2)&~bg
    a=np.ones((H,W),np.float32); a[bg]=0
    ea=np.clip((dark-26)/(110-26),0,1)
    a[near]=np.maximum(ea[near],0)    # anti-aliased edge
    a[near & (ea<0.08)]=0
    # decontaminate from white
    rgb=im.copy()
    m=a>0
    aa=np.maximum(a,1e-3)[...,None]
    dec=(im-255*(1-aa))/aa
    rgb[near]=np.clip(dec,0,255)[near]
    # remove tiny specks
    lab2,n2=nd.label(a>0.05)
    sizes=nd.sum(np.ones_like(a),lab2,range(1,n2+1))
    keep=np.zeros(n2+1,bool); keep[1:]=sizes>60
    a[~keep[lab2]]=0
    return rgb,a
def split(a):
    W=a.shape[1]
    col=(a>0.1).sum(0)
    # 4 segments: find cut columns in windows around quarters at min projection
    cuts=[0]
    for q in (1,2,3):
        c=int(W*q/4); lo,hi=c-90,c+90
        seg=col[lo:hi]; mins=np.where(seg==seg.min())[0]
        cuts.append(lo+int(mins[len(mins)//2]))
    cuts.append(W)
    return cuts
for p in sorted(glob.glob(SRC+'/*.jpg')):
    name=os.path.basename(p)[:-4]
    rgb,a=cut(p)
    cuts=split(a)
    figs=[]
    for i in range(4):
        sa=a[:,cuts[i]:cuts[i+1]]; sr=rgb[:,cuts[i]:cuts[i+1]]
        ys,xs=np.where(sa>0.05)
        y0,y1,x0,x1=ys.min(),ys.max()+1,xs.min(),xs.max()+1
        # feet anchor: alpha centroid of bottom 12% rows
        fb=sa[int(y1-(y1-y0)*.12):y1, x0:x1]
        fx=(np.where(fb>0.3)[1].mean())
        figs.append((sr[y0:y1,x0:x1],sa[y0:y1,x0:x1],fx,y1-y0, (cuts[i]+x0, y0)))
        edgefail = (x0==0 and i>0) or (x1==sa.shape[1] and i<3)
        if edgefail: print('WARN touching cut',name,VIEWS[i])
        if y0<=1 or y1>=a.shape[0]-1: print('WARN clipped top/bottom',name,VIEWS[i])
    k=TARGET/figs[0][3]
    meta[name]={}
    for v,(r,al,fx,h,_) in zip(VIEWS,figs):
        img=Image.fromarray(np.dstack([r,al*255]).astype(np.uint8),'RGBA')
        w2,h2=max(1,round(img.width*k)),max(1,round(img.height*k))
        img=img.resize((w2,h2),Image.LANCZOS)
        img.save(f'{OUT}/{name}_{v}.webp',quality=92,method=6)
        meta[name][v]=[w2,h2,round(fx*k,1)]
    print(name,cuts,[f[3] for f in figs])
json.dump(meta,open('/workspace/npcgen/meta.json','w'))
