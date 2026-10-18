# x4 ESRGAN of each tenant's cut dialogue CG, Lanczos down to the dialogue display height (phones never upscale it).
import sys;from esr import *
TH={'zayne':2600,'batzz':2500,'ophion':2300}
for n in sys.argv[1:]:
    im=Image.open(f'../{n}/cg_cut.png');u=upscale_rgba(im);H=TH[n];W=round(u.width*H/u.height);u=u.resize((W,H),Image.LANCZOS)
    u.save(f'../{n}/cg_hd.webp',quality=93,method=6);u.save(f'/tmp/v/{n}_cg_hd.png');print(n,u.size,flush=True)
