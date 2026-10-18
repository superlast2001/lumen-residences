# Complete Ares's lower legs + feet below the CG crop (outpainting). Guide = lower legs from the sheet's own
# front turnaround, scaled/aligned under each knee; SD1.5-inpainting (CPU) re-renders only the NEW area + a thin
# seam band. The original CG pixels are composited back on top unchanged. Output: cg_full.png (RGBA).
import numpy as np,torch,sys
from PIL import Image,ImageFilter
from diffusers import StableDiffusionInpaintPipeline
cg=Image.open('cg_cut.png').convert('RGBA');tf=Image.open('turn_front.png').convert('RGBA')
L,R,EXT=110,110,400;W,H=cg.width+L+R,cg.height+EXT;GREEN=(40,170,70)
base=Image.new('RGBA',(W,H),GREEN+(255,))
S=3.1
def leg(x0,x1,cx):  # crop one turnaround leg from the shin down, scale, centre under the CG leg
    g=tf.crop((x0,296,x1,tf.height));g=g.resize((round(g.width*S),round(g.height*S)),Image.LANCZOS)
    base.alpha_composite(g,(round(L+cx-g.width/2),cg.height-24))
leg(0,80,64.5-6);leg(82,162,256+8)
base.alpha_composite(cg,(L,0))
seed=int(sys.argv[1]) if len(sys.argv)>1 else 7
# work region: bottom part, at a resolution SD likes
y0=cg.height-330;reg=base.crop((0,y0,W,H)).convert('RGB');sc=512/W;rw,rh=512,int(round(reg.height*sc/8)*8)
mask=Image.new('L',(W,H),0);mask.paste(255,(0,cg.height-10,W,H));
ca=np.asarray(cg)[...,3];side=Image.new('L',(W,H),0);sa=np.zeros((H,W),np.uint8);sa[:cg.height,L:L+cg.width]=(ca<10)*255;sa[:cg.height,:L]=255;sa[:cg.height,L+cg.width:]=255
mask=Image.fromarray(np.maximum(np.asarray(mask),sa));mreg=mask.crop((0,y0,W,H)).resize((rw,rh)).filter(ImageFilter.GaussianBlur(2))
pipe=StableDiffusionInpaintPipeline.from_pretrained('/tmp/ares7/sdinp',torch_dtype=torch.float32,variant='fp16',safety_checker=None);pipe.set_progress_bar_config(disable=True)
torch.set_num_threads(8)
out=pipe(prompt='anime illustration, muscular man standing, bare muscular calves and bare feet, cel shading, clean line art, plain flat green background, full body',
 negative_prompt='shoes, socks, pants, clothing, extra legs, deformed, blurry, photo, realistic, text',image=reg.resize((rw,rh),Image.LANCZOS),mask_image=mreg,
 height=rh,width=rw,num_inference_steps=30,guidance_scale=7,strength=.62,generator=torch.Generator().manual_seed(seed)).images[0]
gen=out.resize(reg.size,Image.LANCZOS);full=base.copy().convert('RGB');full.paste(gen,(0,y0));full=full.convert('RGBA')
full.save(f'/tmp/ares7/ext_raw_{seed}.png');print('ok',full.size)
