# x4 Real-ESRGAN (anime_6B) upscale of cg_full.png, tiled on CPU. Transparent pixels get RGB from the nearest opaque
# pixel first (no dark/green halo pulled into edges); alpha is upscaled with Lanczos. Output: cg_full_4x.png
import sys,torch,numpy as np,scipy.ndimage as nd
from PIL import Image
sys.path.insert(0,'.');from esrgan_arch import Net
net=Net();sd=torch.load('/tmp/ares7/anime6B.pth',map_location='cpu');net.load_state_dict(sd.get('params_ema',sd));net.eval();torch.set_num_threads(8)
im=np.asarray(Image.open('cg_full.png').convert('RGBA')).astype(np.float32);al=im[...,3]
idx=nd.distance_transform_edt(al<128,return_distances=False,return_indices=True);rgb=im[...,:3][idx[0],idx[1]]
H,W=al.shape;T,O=160,12;out=np.zeros((H*4,W*4,3),np.float32)
with torch.no_grad():
  for y in range(0,H,T):
    for x in range(0,W,T):
      y0,x0=max(0,y-O),max(0,x-O);y1,x1=min(H,y+T+O),min(W,x+T+O)
      t=torch.from_numpy(np.ascontiguousarray(rgb[y0:y1,x0:x1]/255)).permute(2,0,1)[None].float();o=net(t).clamp(0,1)[0].permute(1,2,0).numpy()
      cy,cx=(y-y0)*4,(x-x0)*4;h,w=min(T,H-y)*4,min(T,W-x)*4;out[y*4:y*4+h,x*4:x*4+w]=o[cy:cy+h,cx:cx+w]
a4=np.asarray(Image.fromarray(al.astype(np.uint8)).resize((W*4,H*4),Image.LANCZOS))
Image.fromarray(np.dstack([(out*255+.5).clip(0,255).astype(np.uint8),a4])).save('cg_full_4x.png');print(W*4,H*4)
