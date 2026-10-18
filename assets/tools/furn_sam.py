# Clean furniture slices from the user's furniture sheet (ares-apartment.png):
# crop -> Real-ESRGAN anime x4 (faithful upscale) -> SAM (vit_b) box+point mask on the upscaled crop -> soft alpha.
# Pixels are the user's; only the mask is computed. Output: furn2/<key>_hd.png (3x) and furn2/<key>.png (1x).
import sys,json,os,numpy as np,scipy.ndimage as nd,torch
from PIL import Image
sys.path.insert(0,'.');from esr import upscale_rgb
from segment_anything import sam_model_registry,SamPredictor
SRC=np.asarray(Image.open('../src/ares_apartment.png').convert('RGB'))
os.makedirs('../furn2',exist_ok=True)
sam=sam_model_registry['vit_b'](checkpoint='/workspace/tools/weights/sam_vit_b.pth');P=SamPredictor(sam)
ITEMS=json.load(open('furn_sam.json'))
only=sys.argv[1:]
for k,it in ITEMS.items():
    if only and k not in only: continue
    x0,y0,x1,y1=it['box'];M=6
    X0,Y0,X1,Y1=max(0,x0-M),max(0,y0-M),min(SRC.shape[1],x1+M),min(SRC.shape[0],y1+M)
    crop=Image.fromarray(SRC[Y0:Y1,X0:X1]);up=np.asarray(upscale_rgb(crop));S=4
    P.set_image(up)
    pts=[[(px-X0)*S,(py-Y0)*S] for px,py in it.get('pos',[])]+[[(px-X0)*S,(py-Y0)*S] for px,py in it.get('neg',[])]
    lb=[1]*len(it.get('pos',[]))+[0]*len(it.get('neg',[]))
    box=np.array([(x0-X0)*S,(y0-Y0)*S,(x1-X0)*S,(y1-Y0)*S])
    ms,sc,_=P.predict(point_coords=np.array(pts) if pts else None,point_labels=np.array(lb) if pts else None,box=box[None],multimask_output=True)
    i=int(it.get('mi',np.argmax(sc)));m=ms[i]
    m=nd.binary_closing(m,iterations=2)
    if not it.get("nofill"): m=nd.binary_fill_holes(m)
    lab,n=nd.label(m)
    if n>1:
        sz=nd.sum(m,lab,range(1,n+1));keep=np.isin(lab,[j+1 for j,s in enumerate(sz) if s>=0.03*sz.max()]);m=keep
    for (ex0,ey0,ex1,ey1) in it.get('erase',[]):
        m[max(0,(ey0-Y0)*S):max(0,(ey1-Y0)*S),max(0,(ex0-X0)*S):max(0,(ex1-X0)*S)]=0
    if it.get('key'):
        brd=np.concatenate([up[0],up[-1],up[:,0],up[:,-1]]).astype(int);bg=np.median(brd,axis=0)
        dd=np.abs(up.astype(int)-bg).max(-1);kk=nd.binary_opening(dd>it['key'],iterations=1);m=m&kk
    a=nd.gaussian_filter(nd.binary_erosion(m,iterations=1).astype(np.float32),1.0)
    rgba=np.dstack([up,(np.clip(a*1.15,0,1)*255).astype(np.uint8)])
    im=Image.fromarray(rgba);bb=im.getbbox();im=im.crop(bb)
    hd=im.resize((round(im.width*.75),round(im.height*.75)),Image.LANCZOS);hd.save(f'../furn2/{k}_hd.png',optimize=True)
    lo=im.resize((max(1,round(im.width/4)),max(1,round(im.height/4))),Image.LANCZOS);lo.save(f'../furn2/{k}.png')
    print(k,'score',[round(float(s),3) for s in sc],'pick',i,'hd',hd.size,flush=True)
