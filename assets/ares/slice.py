# Slice the user's Ares reference sheet into transparent PNGs. Pixels are only cropped + background keyed (no recolor/filter).
import numpy as np, scipy.ndimage as nd, json
from PIL import Image
SH=Image.open('sheet.png').convert('RGBA'); A=np.asarray(SH)
def key(box,T=40,lo=12,shadow=False):
    x0,y0,x1,y1=box; a=A[y0:y1,x0:x1].copy(); m=a[...,:3].astype(int).max(-1)
    r,b=a[...,0].astype(int),a[...,2].astype(int)
    lab,_=nd.label(((m<70)&(b>=r+4))|((m<40)&(b>=r+2))|(m<16)); edge=set(np.unique(np.r_[lab[0],lab[-1],lab[:,0],lab[:,-1]]))-{0}
    bg=np.isin(lab,list(edge))
    n_=lab.max(); mm=nd.mean(m,lab,range(1,n_+1)); br=nd.mean(b-r,lab,range(1,n_+1)); ss=nd.sum(np.ones_like(m),lab,range(1,n_+1))
    pockets=[k+1 for k in range(n_) if ss[k]>40 and mm[k]<26 and br[k]>=3]; bg|=np.isin(lab,pockets)
    if shadow:  # dark low-saturation floor-shadow haze around full-body figures, only where it touches the keyed background
        aa=a[...,:3].astype(int); sat=aa.max(-1)-aa.min(-1); cand=(m<34)&(sat<16); cand[:int(cand.shape[0]*.2)]=False
        l3,_=nd.label(cand|bg); keep=set(np.unique(l3[bg]))-{0}; bg|=np.isin(l3,list(keep))&cand
    fg=~bg
    fg=nd.binary_opening(fg,iterations=1)|(fg&nd.binary_erosion(fg,iterations=0+1)) # drop 1px specks
    near=nd.binary_dilation(fg,iterations=2)&~fg
    al=np.zeros(m.shape); al[fg]=1; al[near]=np.clip((m[near]-lo)/(T-lo),0,1)
    # remove tiny islands (border/label crumbs)
    lab2,n=nd.label(al>0); sz=nd.sum(np.ones_like(al),lab2,range(1,n+1))
    for i,s in enumerate(sz):
        if s<60: al[lab2==i+1]=0
    bgc=np.median(a[bg][:,:3],axis=0) if bg.any() else np.zeros(3)
    pm=(al>0)&(al<1); af=al[pm][:,None]; a[...,:3][pm]=np.clip((a[...,:3][pm].astype(float)-(1-af)*bgc)/np.maximum(af,.15),0,255).astype(np.uint8)
    a[...,3]=(al*255).astype(np.uint8); ys,xs=np.where(al>0)
    return Image.fromarray(a).crop((xs.min(),ys.min(),xs.max()+1,ys.max()+1))
out={}
def save(name,img): img.save(f'{name}.png'); out[name]=img.size
# dialogue CG keeps its painted backdrop (cannot be keyed cleanly); crop inside the border, below the title label
save('cg',SH.crop((5,52,331,805)))
for n,(x0,x1) in zip(['turn_front','turn_right','turn_back','turn_left'],[(343,505),(517,669),(677,838),(845,995)]): save(n,key((x0,38,x1,466),shadow=True))
E=['normal','smile','teasing','blushing','angry','serious','surprised','sad'];C=[(1007,1126),(1140,1258),(1272,1391),(1405,1521)]
for i,e in enumerate(E):
    x0,x1=C[i%4];y0,y1=[(40,175),(213,348)][i//4]; save('expr_'+e,SH.crop((x0,y0,x1,y1)))  # close-ups: rectangular face cards
P=['talking','laugh','teasing','embarrassed','angry','thinking','surprised','serious'];PC=[(343,487),(500,635),(647,783),(795,926),(936,1063),(1076,1196),(1208,1365),(1377,1521)]
for p,(x0,x1) in zip(P,PC): save('pose_'+p,key((x0+4,514,x1-4,780),shadow=True))
def split(x0,x1,y0,y1,names,icons=None):
    img=key((x0,y0,x1,y1)); al=np.asarray(img)[...,3]; lab,n=nd.label(al>0,structure=np.ones((3,3)))
    objs=nd.find_objects(lab); sz=nd.sum(al>0,lab,range(1,n+1)); big=[k for k in range(n) if sz[k]>0.25*sz.max()]
    big.sort(key=lambda k:objs[k][1].start); print(names[0][:5],len(big),'big parts')
    def cut(k):
        sl=objs[k];w=sl[1].stop-sl[1].start;cols=(lab[sl]==k+1).sum(0);lo=int(w*.35);c=lo+int(np.argmin(cols[lo:int(w*.65)]))+sl[1].start
        return c
    global_lab=lab
    while len(big)<len(names):
        k=max(big,key=lambda k:objs[k][1].stop-objs[k][1].start);c=cut(k);n+=1;sel=(lab==k+1);sel[:,:c]=False;lab[sel]=n
        objs=nd.find_objects(lab);big.append(n-1);big.sort(key=lambda k:objs[k][1].start);print(' cut at',c)
    cx=[(objs[k][1].start+objs[k][1].stop)/2 for k in big]; owner=np.zeros(n+1,int)-1
    for k in range(n): c=(objs[k][1].start+objs[k][1].stop)/2; owner[k+1]=int(np.argmin([abs(c-q) for q in cx]))
    A2=np.asarray(img)
    for bi,nm in enumerate(names[:len(big)]):
        a=A2.copy(); a[...,3]=np.where(owner[lab]==bi,al,0); a[lab==0,3]=0; im=Image.fromarray(a); save(nm,im.crop(im.getbbox()))
        if icons and nm in icons:
            body=big[bi]; part=(owner[lab]==bi)&(lab!=body+1)&(lab>0)
            # keep only parts above the shoulders / beside the head (the emote mark), skip stray specks
            ys_=np.where(part.any(1))[0]
            if len(ys_):
                b2=A2.copy(); b2[...,3]=np.where(part,al,0); ic=Image.fromarray(b2); bb=ic.getbbox(); save(icons[nm],ic.crop(bb))
split(20,412,866,979,['chibi_front','chibi_right','chibi_back','chibi_left'])
split(428,920,866,982,[f'walk_{i}' for i in range(7)])
split(936,1521,866,979,['emote_'+e for e in ['idle','smile','blush','angry','surprised','happy','sit']],icons={'emote_smile':'icon_heart','emote_blush':'icon_hearts','emote_angry':'icon_angry','emote_surprised':'icon_surprise','emote_sit':'icon_note'})
json.dump(out,open('slices.json','w'),indent=0); print(len(out),'slices')
# angry / surprise marks touch neighbouring sprites, so cut them from fixed boxes
save('icon_angry',key((1229,884,1255,913))); save('icon_surprise',key((1310,880,1328,918)))
json.dump(out,open('slices.json','w'),indent=0)
