# Pass 2: the sheet panel also cut his right upper arm (left edge) and raised elbow (right edge).
# Inpaint only the side margins beside those cuts on the pass-1 canvas; original pixels are restored by finish_cg.py.
import numpy as np,torch,sys
from PIL import Image,ImageFilter
from diffusers import StableDiffusionInpaintPipeline
L,R=110,110;raw=Image.open(sys.argv[1]).convert('RGB');cg=Image.open('cg_cut.png');W,H=raw.size;cw=cg.width
y1=520;reg=raw.crop((0,0,W,y1));rw=512;rh=int(round(y1*rw/W/8)*8)
m=np.zeros((y1,W),np.uint8);m[:,:L+3]=255;m[:,L+cw-3:]=255;mreg=Image.fromarray(m).resize((rw,rh)).filter(ImageFilter.GaussianBlur(2))
pipe=StableDiffusionInpaintPipeline.from_pretrained('/tmp/ares7/sdinp',torch_dtype=torch.float32,variant='fp16',safety_checker=None);pipe.set_progress_bar_config(disable=True);torch.set_num_threads(8)
o=pipe(prompt='anime illustration, muscular bodybuilder arms, bulging shoulder and biceps, elbow, cel shading, clean line art, plain flat green background',
 negative_prompt='extra arms, extra hands, extra fingers, deformed, blurry, photo, realistic, text, clothing',image=reg.resize((rw,rh),Image.LANCZOS),mask_image=mreg,height=rh,width=rw,
 num_inference_steps=30,guidance_scale=7,strength=1.0,generator=torch.Generator().manual_seed(int(sys.argv[2]) if len(sys.argv)>2 else 3)).images[0]
o=o.resize((W,y1),Image.LANCZOS);out=raw.copy();mk=Image.fromarray(m);out.paste(o,(0,0),mk);out.save(sys.argv[1].replace('.png','_arms.png'));print('ok')
