# Build the dialogue-CG alpha for each tenant (RGB stays the sheet's pixels; only alpha + edge colour decontamination).
#  zayne : BiRefNet-general mask (painted condo backdrop)
#  ophion: BiRefNet-HRSOD body mask + SAM wing masks (the bg-removal models drop his wings), wings limited to warm pixels
#  batzz : white-background key flood-filled from the panel border (pixel exact), largest component only
import numpy as np,scipy.ndimage as nd
from PIL import Image
BOX={'zayne':(0,0,400,1016),'batzz':(0,0,420,780),'ophion':(0,40,400,742)}
def finish(n,rgb,al):
    al=al.astype(np.float32)/255
    lab,k=nd.label(al>.5);sz=nd.sum(np.ones(al.shape),lab,range(1,k+1));keep=np.isin(lab,[i+1 for i,s in enumerate(sz) if s>=0.002*sz.max() and s>150])
    keep=nd.binary_dilation(keep,iterations=3);al=al*keep
    # hard core + 1px soft rim, rim pulled in 1px so no backdrop fringe remains
    core=al>.5;core=nd.binary_erosion(core,iterations=1)
    soft=nd.gaussian_filter(core.astype(np.float32),.7);al=np.minimum(al,np.clip(soft*1.15,0,1));al[al<.03]=0
    # edge decontamination: edge pixels take colour of nearest solid interior pixel
    solid=al>.97;idx=nd.distance_transform_edt(~solid,return_distances=False,return_indices=True);ext=rgb[idx[0],idx[1]]
    out=rgb.copy();edge=(al<.97);out[edge]=ext[edge]
    im=Image.fromarray(np.dstack([out,(al*255+.5).astype(np.uint8)]));bb=im.getbbox();im=im.crop(bb);im.save(f'../{n}/cg_cut.png');print(n,bb,im.size)
for n in ['zayne','batzz','ophion']:
    import os;os.makedirs(f'../{n}',exist_ok=True)
    rgb=np.asarray(Image.open(f'../src/{n}_sheet.png').convert('RGB').crop(BOX[n])).copy();A=rgb.astype(int)
    if n=='zayne': al=np.asarray(Image.open('zayne_cg_mask_birefnet.png').convert('L')).astype(np.float32)
    elif n=='ophion':
        body=np.asarray(Image.open('ophion_cg_mask_birefnet.png').convert('L')).astype(np.float32)
        warm=(A[...,0]>A[...,2]+40)&(A[...,0]>110);warm=nd.binary_closing(warm,iterations=1)
        w=((np.asarray(Image.open('ophion_wingL_sam.png'))>0)|(np.asarray(Image.open('ophion_wingR_sam.png'))>0))&warm
        w=nd.binary_opening(w,iterations=1);lab,k=nd.label(w);sz=nd.sum(np.ones(w.shape),lab,range(1,k+1));w=np.isin(lab,[i+1 for i,s in enumerate(sz) if s>400])
        w=nd.binary_fill_holes(w)&(warm|nd.binary_erosion(w,iterations=2))
        w=nd.binary_closing(w,structure=np.ones((5,5)));w=nd.binary_opening(w,structure=np.ones((3,3)));w=nd.binary_fill_holes(w)
        lab,k=nd.label(w|(body>128));sz=nd.sum(np.ones(w.shape),lab,range(1,k+1));w&=np.isin(lab,[int(np.argmax(sz))+1])
        al=np.maximum(body,w*255.)
    else:
        mn=A.min(-1);sat=A.max(-1)-mn
        bgc=(mn>228)&(sat<22)
        ln=np.zeros_like(bgc);ln[:,380:390]=True;bgc|=ln&(sat<26)&(mn>135)&(A[...,2]>=A[...,0]);bgc[:440,387:]=True;bgc[:712,386:]=True;bgc[:52,:186]=True;bgc[:,432:]=True
        sh=(mn>175)&(sat<24);sh[:728]=False;bgc|=sh  # neighbour panel border / turnaround panel
        lab,k=nd.label(bgc);edge=set(np.unique(np.r_[lab[0],lab[-1],lab[:,0],lab[:,-1]]))-{0}
        bg=np.isin(lab,list(edge))
        sz=nd.sum(np.ones(bgc.shape),lab,range(1,k+1));pure=nd.mean(mn,lab,range(1,k+1))
        bg|=np.isin(lab,[i+1 for i in range(k) if sz[i]>60 and pure[i]>246])   # enclosed pure-white pockets (between limbs)
        fg=~bg;lab2,k2=nd.label(fg);sz2=nd.sum(np.ones(fg.shape),lab2,range(1,k2+1));fg=lab2==(int(np.argmax(sz2))+1);fg=nd.binary_fill_holes(fg)|(fg)
        # re-open the pure pockets after hole fill
        fg&=~np.isin(lab,[i+1 for i in range(k) if sz[i]>60 and pure[i]>246])
        from matte import white_matte
        rgb2,al2=white_matte(rgb,fg,band=3)
        al2[:700,380:]=0;al2[:300,378:]=0;al2[:3,250:]=0;z=np.zeros_like(fg);z[700:,384:]=True;al2[z&(sat<30)&(mn>110)]=0
        im=Image.fromarray(np.dstack([rgb2,(al2*255+.5).astype(np.uint8)]));bb=im.getbbox();im=im.crop(bb);im.save(f'../{n}/cg_cut.png');print(n,'matte',bb,im.size);continue
        # soft edge from whiteness on the 1px border band
        band=nd.binary_dilation(fg,iterations=1)&~nd.binary_erosion(fg,iterations=1);wv=np.clip((255-mn)/40,0,1)*255;al[band]=np.minimum(al[band]+0,wv[band]) if False else al[band]
    finish(n,rgb,al)
