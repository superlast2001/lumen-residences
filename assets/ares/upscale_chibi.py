# Real-ESRGAN anime x4 of the in-world chibi slices (directions, walk cycle, emotes) -> <name>_hd.png at 3x native.
# Faithful upscaler only (no regeneration). RGB under transparent pixels is edge-extended first so no dark fringe appears;
# alpha is upscaled through the same network (crisper silhouette than resampling), then everything is Lanczos'd 4x -> 3x.
import sys,glob,torch,numpy as np,scipy.ndimage as nd
from PIL import Image
sys.path.insert(0,'.');from esrgan_arch import Net
net=Net();sd=torch.load('/tmp/ares7/anime6B.pth',map_location='cpu');net.load_state_dict(sd.get('params_ema',sd));net.eval();torch.set_num_threads(8)
def up(x):
    with torch.no_grad(): return net(torch.from_numpy(np.ascontiguousarray(x)).permute(2,0,1)[None].float()).clamp(0,1)[0].permute(1,2,0).numpy()
names=sorted([f[:-4] for f in glob.glob('chibi_*.png')+glob.glob('walk_?.png')+glob.glob('emote_*.png') if '_hd' not in f])
for n in names:
    a=np.asarray(Image.open(n+'.png').convert('RGBA')).astype(np.float32)/255;P=4
    a=np.pad(a,((P,P),(P,P),(0,0)));al=a[...,3];solid=al>.6
    idx=nd.distance_transform_edt(~solid,return_distances=False,return_indices=True);rgb=a[...,:3][idx[0],idx[1]]
    o=up(rgb);oa=up(np.repeat(al[...,None],3,-1)).mean(-1)
    oa=np.clip((oa-.22)/.62,0,1)
    im=Image.fromarray(np.dstack([(o*255+.5).astype(np.uint8),(oa*255+.5).astype(np.uint8)]))
    im=im.crop((P*4,P*4,im.width-P*4,im.height-P*4));w,h=im.size;im=im.resize((w*3//4,h*3//4),Image.LANCZOS);im.save(n+'_hd.png',optimize=True);print(n,im.size)
