# Real-ESRGAN anime x4 of the 8 expression close-ups (opaque cards) -> expr_<e>_hd.png, for the face badge on HiDPI phones.
import sys,torch,numpy as np
from PIL import Image
sys.path.insert(0,'.');from esrgan_arch import Net
net=Net();sd=torch.load('/tmp/ares7/anime6B.pth',map_location='cpu');net.load_state_dict(sd.get('params_ema',sd));net.eval();torch.set_num_threads(8)
for e in ['normal','smile','teasing','blushing','angry','serious','surprised','sad']:
    im=np.asarray(Image.open(f'expr_{e}.png').convert('RGB')).astype(np.float32)/255
    with torch.no_grad(): o=net(torch.from_numpy(im).permute(2,0,1)[None]).clamp(0,1)[0].permute(1,2,0).numpy()
    Image.fromarray((o*255+.5).astype(np.uint8)).save(f'expr_{e}_hd.png',optimize=True);print(e,o.shape)
