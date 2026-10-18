# Slice each tenant's reference sheet into game sprites. Pixels are only cropped + background keyed (no recolour/redraw).
import numpy as np,scipy.ndimage as nd,json,sys,os
from PIL import Image
CFG={
 'zayne':dict(mode='dark',expr_x=[(1014,1141),(1148,1269),(1278,1398),(1408,1528)],expr_y=[(38,198),(235,394)],
   dirs=(405,846,662,962),walk=(668,846,1019,962),nwalk=8,emo=(1027,840,1527,962),icons=['smile','blush','angry','surprised','happy'],
   ib={'note':(1089,844,1116,876),'hearts':(1157,851,1183,885),'angry':(1239,843,1271,872),'surprise':(1341,840,1367,871),'sparkle':(1413,846,1441,887)}),
 'batzz':dict(mode='white',expr_x=[(1044,1168),(1173,1290),(1295,1411),(1416,1531)],expr_y=[(35,181),(214,388)],
   dirs=(12,840,442,968),walk=(450,840,973,962),nwalk=8,emo=(982,834,1531,968),icons=['smile','blush','angry','surprised','happy'],
   ib={'note':(1037,840,1064,871),'hearts':(1179,840,1210,867),'angry':(1247,837,1284,864),'surprise':(1345,837,1371,875),'note2':(1424,842,1450,871)}),
 'ophion':dict(mode='white',expr_x=[(1029,1154),(1158,1281),(1285,1407),(1411,1533)],expr_y=[(42,198),(225,378)],
   dirs=(10,834,416,972),walk=(430,834,976,972),nwalk=8,emo=(985,816,1533,972),icons=['blush','junk','surprised','happy'],hard={'angry':(1237,818,1272,842)},blank=[(985,816,1200,827)],
   ib={'heart':(1114,835,1145,864),'angry':(1237,818,1272,847),'surprise':(1329,818,1357,851),'note':(1406,818,1434,847)}),
}
EXPR=['normal','smile','teasing','blushing','angry','serious','surprised','sad']
def keyed(A,box,mode):
    x0,y0,x1,y1=box;a=A[y0:y1,x0:x1].copy();c=a[...,:3].astype(int);mn=c.min(-1);mx=c.max(-1);sat=mx-mn
    if mode=='white':
        cand=(mn>226)&(sat<24)
        lab,k=nd.label(cand);edge=set(np.unique(np.r_[lab[0],lab[-1],lab[:,0],lab[:,-1]]))-{0};bg=np.isin(lab,list(edge))
        sz=nd.sum(np.ones(mn.shape),lab,range(1,k+1));pm=nd.mean(mn,lab,range(1,k+1))
        bg|=np.isin(lab,[i+1 for i in range(k) if sz[i]>25 and pm[i]>244])
        # soft grey ground shadows under the feet (only near the bottom, connected to background)
        sh=(mn>150)&(sat<30);sh[:int(sh.shape[0]*.80)]=False;l3,_=nd.label(sh|bg);keep=set(np.unique(l3[bg]))-{0};bg|=np.isin(l3,list(keep))&sh
        lo,T=200,245;edgev=mn
    else:
        r,b=c[...,0],c[...,2]
        cand=((mx<62)&(b>=r+6))|((mx<34)&(b>=r+2))
        lab,k=nd.label(cand);edge=set(np.unique(np.r_[lab[0],lab[-1],lab[:,0],lab[:,-1]]))-{0};bg=np.isin(lab,list(edge))
        sz=nd.sum(np.ones(mx.shape),lab,range(1,k+1));mm=nd.mean(mx,lab,range(1,k+1))
        bg|=np.isin(lab,[i+1 for i in range(k) if sz[i]>25 and mm[i]<50])
        nb=(mx<16);nb[:int(nb.shape[0]*.62)]=False;l4,k4=nd.label(nb);s4=nd.sum(np.ones(nb.shape),l4,range(1,k4+1));bg|=np.isin(l4,[i+1 for i in range(k4) if s4[i]>6])
        lo,T=None,None
    fg=~bg;fg=nd.binary_opening(fg,iterations=1)|(fg&nd.binary_erosion(fg))
    al=fg.astype(np.float32)
    # 1px soft rim + colour decontamination (rim takes nearest interior colour) -> no light/dark halo
    core=nd.binary_erosion(fg);rim=fg&~core
    if mode=='white':
        from matte import white_matte
        rgb2,al=white_matte(a[...,:3],fg,band=2);a[...,:3]=rgb2
    else:
        al[rim]=0.75
        idx=nd.distance_transform_edt(~core,return_distances=False,return_indices=True);ext=a[...,:3][idx[0],idx[1]];a[...,:3][rim]=ext[rim]
    lab2,n=nd.label(al>0,structure=np.ones((3,3)));sz=nd.sum(np.ones(al.shape),lab2,range(1,n+1))
    for i,s in enumerate(sz):
        if s<30: al[lab2==i+1]=0
    a[...,3]=(al*255).astype(np.uint8);return a
def find_seam(a,mask,lo,hi):
    lo=max(0,lo);hi=min(mask.shape[1]-1,hi);H=mask.shape[0];lum=a[...,:3].astype(float).mean(-1)
    cost=np.where(mask,1+lum/60,0)[:,lo:hi+1];W=cost.shape[1];D=cost.copy();B=np.zeros((H,W),int)
    for y in range(1,H):
        p=np.stack([np.r_[np.inf,D[y-1,:-1]],D[y-1],np.r_[D[y-1,1:],np.inf]]);j=np.argmin(p,0);D[y]+=p[j,np.arange(W)];B[y]=j-1
    x=int(np.argmin(D[-1]));seam=np.zeros(H,int)
    for y in range(H-1,-1,-1):seam[y]=x+lo;x=int(np.clip(x+B[y,x],0,W-1))
    return seam
def split(a,N,names,outdir,icons=None):
    al=a[...,3];lab,n=nd.label(al>0,structure=np.ones((3,3)));objs=nd.find_objects(lab);sz=nd.sum(al>0,lab,range(1,n+1))
    ew=a.shape[1]/N
    for it in range(30):
        order=sorted([k for k in range(n) if objs[k] is not None],key=lambda k:-sz[k]);big=[k for k in order if sz[k]>0.2*sz[order[0]]]
        anch=sorted(big[:N],key=lambda k:objs[k][1].start);widths=[objs[k][1].stop-objs[k][1].start for k in anch]
        wi=int(np.argmax(widths))
        if len(big)>=N and widths[wi]<1.5*ew: break
        k=anch[wi];sl=objs[k];w=widths[wi];cols=(lab[sl]==k+1).sum(0);m=max(2,round(w/ew))
        lo,hi=int(w/m*.6),int(w/m*1.4);c=lo+int(np.argmin(cols[lo:hi]))+sl[1].start
        seam=find_seam(a,lab==k+1,c-int(ew*.35),c+int(ew*.35))
        n+=1;sel=(lab==k+1);xs=np.arange(sel.shape[1])[None,:];sel&=xs>=seam[:,None];lab[sel]=n;objs=nd.find_objects(lab);sz=nd.sum(al>0,lab,range(1,n+1));print('  split col',c)
    cx=np.array([(objs[k][1].start+objs[k][1].stop)/2 for k in anch]);owner={}
    for k in range(n):
        if objs[k] is None:continue
        c=(objs[k][1].start+objs[k][1].stop)/2;owner[k+1]=int(np.argmin(np.abs(cx-c)))
    res={};h=a.shape[0];iconparts=[]
    if icons:
        for k in range(n):
            if objs[k] is None or (k in anch):continue
            sl=objs[k]
            if (sl[0].start+sl[0].stop)/2<h*.36 and sz[k]>12: iconparts.append(k)
        # group parts into marks by x proximity, then map marks (left→right) onto the emotes that carry one
        iconparts.sort(key=lambda k:objs[k][1].start);groups=[]
        for k in iconparts:
            if groups and objs[k][1].start-max(objs[q][1].stop for q in groups[-1])<10: groups[-1].append(k)
            else: groups.append([k])
        for nm,g in zip(icons,groups):
            m=np.isin(lab,[q+1 for q in g]);c2=a.copy();c2[...,3]=np.where(m,al,0);ic=Image.fromarray(c2);ic=ic.crop(ic.getbbox());ic.save(f'{outdir}/icon_{nm}.png');res['icon_'+nm]=list(ic.size)
            for q in g: owner[q+1]=-1
    for bi,nm in enumerate(names):
        b=a.copy();ow=np.zeros(n+1,int)-1
        for kk,v in owner.items(): ow[kk]=v
        own=ow[lab]==bi;own&=lab>0;b[...,3]=np.where(own,al,0)
        im=Image.fromarray(b);bb=im.getbbox();im=im.crop(bb);im.save(f'{outdir}/{nm}.png');res[nm]=list(im.size)
    return res
for n in sys.argv[1:] or CFG:
    C=CFG[n];out=f'../{n}';os.makedirs(out,exist_ok=True);A=np.asarray(Image.open(f'../src/{n}_sheet.png').convert('RGBA'));S={}
    for i,e in enumerate(EXPR):
        x0,x1=C['expr_x'][i%4];y0,y1=C['expr_y'][i//4];im=Image.fromarray(A[y0+3:y1-2,x0+3:x1-3]);im.save(f'{out}/expr_{e}.png');S['expr_'+e]=list(im.size)
    S.update(split(keyed(A,C['dirs'],C['mode']),4,['chibi_front','chibi_right','chibi_back','chibi_left'],out))
    S.update(split(keyed(A,C['walk'],C['mode']),C['nwalk'],[f'walk_{i}' for i in range(C['nwalk'])],out))
    E=keyed(A,C['emo'],C['mode']);ex,ey=C['emo'][:2]
    for (x0,y0,x1,y1) in C.get('blank',[]): E[y0-ey:y1-ey,x0-ex:x1-ex,3]=0
    for nm,(x0,y0,x1,y1) in C.get('hard',{}).items():
        sub=E[y0-ey:y1-ey,x0-ex:x1-ex];im=Image.fromarray(sub.copy());bb=im.getbbox();im.crop(bb).save(f'{out}/icon_{nm}.png');S['icon_'+nm]=list(im.crop(bb).size);sub[...,3]=0
    lab,k=nd.label(E[...,3]>0,structure=np.ones((3,3)));parts=[]
    for i,sl in enumerate(nd.find_objects(lab)):
        px=(lab[sl]==i+1).sum()
        if 8<px<450 and (sl[0].start+sl[0].stop)/2<45: parts.append((sl[1].start,sl[1].stop,i+1))
    parts.sort();groups=[]
    for p in parts:
        if groups and p[0]-groups[-1][-1][1]<9: groups[-1].append(p)
        else: groups.append([p])
    names=C['icons'] if len(groups)==len(C['icons']) else [f'm{i}' for i in range(len(groups))]
    for nm,g in zip(names,groups):
        m=np.isin(lab,[p[2] for p in g]);ic=E.copy();ic[...,3]=np.where(m,ic[...,3],0);im=Image.fromarray(ic);im=im.crop(im.getbbox());im.save(f'{out}/icon_{nm}.png');S['icon_'+nm]=list(im.size);E[...,3][m]=0
    print(n,'icons',names)
    S.update(split(E,7,['emote_'+e for e in ['idle','smile','blush','angry','surprised','happy','sit']],out))
    json.dump(S,open(f'{out}/slices.json','w'),indent=0);print(n,len(S),'slices')
