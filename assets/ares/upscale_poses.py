# Upscale the full-body pose slices offline with Real-ESRGAN x4plus_anime_6B (CPU), then downsample with Lanczos
# to the dialogue height. RGB comes from the sheet panel (no recolor/filter); alpha = the slice's key, Lanczos-upscaled,
# with edge pixels decontaminated against the panel background. Run with /tmp/ares7/rbg/bin/python (torch).
import torch,torch.nn as nn,torch.nn.functional as F,numpy as np,json
from PIL import Image
class RDB(nn.Module):
    def __init__(s,f=64,g=32):
        super().__init__();s.conv1=nn.Conv2d(f,g,3,1,1);s.conv2=nn.Conv2d(f+g,g,3,1,1);s.conv3=nn.Conv2d(f+2*g,g,3,1,1);s.conv4=nn.Conv2d(f+3*g,g,3,1,1);s.conv5=nn.Conv2d(f+4*g,f,3,1,1);s.l=nn.LeakyReLU(.2,True)
    def forward(s,x):
        x1=s.l(s.conv1(x));x2=s.l(s.conv2(torch.cat((x,x1),1)));x3=s.l(s.conv3(torch.cat((x,x1,x2),1)));x4=s.l(s.conv4(torch.cat((x,x1,x2,x3),1)));return s.conv5(torch.cat((x,x1,x2,x3,x4),1))*.2+x
class RRDB(nn.Module):
    def __init__(s,f=64):super().__init__();s.rdb1=RDB(f);s.rdb2=RDB(f);s.rdb3=RDB(f)
    def forward(s,x):return s.rdb3(s.rdb2(s.rdb1(x)))*.2+x
class Net(nn.Module):
    def __init__(s,nb=6,f=64):
        super().__init__();s.conv_first=nn.Conv2d(3,f,3,1,1);s.body=nn.Sequential(*[RRDB(f) for _ in range(nb)]);s.conv_body=nn.Conv2d(f,f,3,1,1)
        s.conv_up1=nn.Conv2d(f,f,3,1,1);s.conv_up2=nn.Conv2d(f,f,3,1,1);s.conv_hr=nn.Conv2d(f,f,3,1,1);s.conv_last=nn.Conv2d(f,3,3,1,1);s.l=nn.LeakyReLU(.2,True)
    def forward(s,x):
        fe=s.conv_first(x);fe=fe+s.conv_body(s.body(fe));fe=s.l(s.conv_up1(F.interpolate(fe,scale_factor=2,mode='nearest')));fe=s.l(s.conv_up2(F.interpolate(fe,scale_factor=2,mode='nearest')))
        return s.conv_last(s.l(s.conv_hr(fe)))
net=Net();sd=torch.load('/tmp/ares7/anime6B.pth',map_location='cpu');net.load_state_dict(sd.get('params_ema',sd));net.eval()
SH=Image.open('sheet.png').convert('RGB');TH=640
P=['talking','laugh','teasing','embarrassed','angry','thinking','surprised','serious'];PC=[(343,487),(500,635),(647,783),(795,926),(936,1063),(1076,1196),(1208,1365),(1377,1521)]
# locate each keyed slice inside its key box to align alpha with the panel RGB
for p,(x0,x1) in zip(P,PC):
    box=(x0+4,514,x1-4,780);rgb=SH.crop(box);sl=Image.open(f'pose_{p}.png');sa=np.asarray(sl)
    R=np.asarray(rgb);best=None
    for dy in range(0,R.shape[0]-sa.shape[0]+1):
        for dx in range(0,R.shape[1]-sa.shape[1]+1):
            d=np.abs(R[dy:dy+sa.shape[0],dx:dx+sa.shape[1]].astype(int)-sa[...,:3].astype(int))[sa[...,3]==255].mean()
            if best is None or d<best[0]:best=(d,dx,dy)
            if d==0:break
        if best[0]==0:break
    _,dx,dy=best;al=np.zeros(R.shape[:2],np.uint8);al[dy:dy+sa.shape[0],dx:dx+sa.shape[1]]=sa[...,3]
    with torch.no_grad():
        t=torch.from_numpy(R.astype(np.float32)/255).permute(2,0,1)[None];o=net(t).clamp(0,1)[0].permute(1,2,0).numpy()
    up=Image.fromarray((o*255+.5).astype(np.uint8));aup=Image.fromarray(al).resize(up.size,Image.LANCZOS)
    k=TH/R.shape[0];W,H=round(R.shape[1]*k),TH
    up=up.resize((W,H),Image.LANCZOS);aup=aup.resize((W,H),Image.LANCZOS)
    A=np.asarray(up).astype(float);a=np.asarray(aup).astype(float)/255;a[a<.04]=0
    bgc=np.median(R[al==0],axis=0);pm=(a>0)&(a<1);aa=a[pm][:,None];A[pm]=np.clip((A[pm]-(1-aa)*bgc)/np.maximum(aa,.2),0,255)
    out=Image.fromarray(np.dstack([A,a*255]).astype(np.uint8));out=out.crop(out.getbbox());out.save(f'hd_{p}.png');print(p,out.size,'match',round(best[0],2))
