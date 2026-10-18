# Real-ESRGAN anime_6B x4 (CPU, tiled) for RGBA art. RGB under transparent pixels is edge-extended first (no dark/bg halo);
# alpha goes through the same network (crisper silhouette than resampling). Faithful upscaler only: no regeneration.
import sys,torch,numpy as np,scipy.ndimage as nd
from PIL import Image
sys.path.insert(0,'.');from esrgan_arch import Net
torch.set_num_threads(8)
_net=None
def net():
    global _net
    if _net is None:
        _net=Net();sd=torch.load('/tmp/ares7/anime6B.pth',map_location='cpu');_net.load_state_dict(sd.get('params_ema',sd));_net.eval()
    return _net
def up3(x,T=192,O=12):
    H,W,_=x.shape;out=np.zeros((H*4,W*4,3),np.float32)
    with torch.no_grad():
        for y in range(0,H,T):
            for X in range(0,W,T):
                y0,x0=max(0,y-O),max(0,X-O);y1,x1=min(H,y+T+O),min(W,X+T+O)
                t=torch.from_numpy(np.ascontiguousarray(x[y0:y1,x0:x1])).permute(2,0,1)[None].float();o=net()(t).clamp(0,1)[0].permute(1,2,0).numpy()
                cy,cx=(y-y0)*4,(X-x0)*4;h,w=min(T,H-y)*4,min(T,W-X)*4;out[y*4:y*4+h,X*4:X*4+w]=o[cy:cy+h,cx:cx+w]
    return out
def upscale_rgba(im,alpha_net=True):
    a=np.asarray(im.convert('RGBA')).astype(np.float32)/255;P=4
    a=np.pad(a,((P,P),(P,P),(0,0)));al=a[...,3];solid=al>.6
    if solid.any():
        idx=nd.distance_transform_edt(~solid,return_distances=False,return_indices=True);rgb=a[...,:3][idx[0],idx[1]]
    else: rgb=a[...,:3]
    o=up3(rgb)
    if alpha_net: oa=up3(np.repeat(al[...,None],3,-1)).mean(-1);oa=np.clip((oa-.08)/.84,0,1)
    else: oa=np.asarray(Image.fromarray((al*255).astype(np.uint8)).resize((al.shape[1]*4,al.shape[0]*4),Image.LANCZOS)).astype(np.float32)/255
    r=Image.fromarray(np.dstack([(o*255+.5).astype(np.uint8),(oa*255+.5).astype(np.uint8)]));return r.crop((P*4,P*4,r.width-P*4,r.height-P*4))
def upscale_rgb(im):
    a=np.asarray(im.convert('RGB')).astype(np.float32)/255;o=up3(a);return Image.fromarray((o*255+.5).astype(np.uint8))
