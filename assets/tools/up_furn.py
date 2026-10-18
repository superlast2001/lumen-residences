import glob,os;from esr import *
for p in sorted(glob.glob('../furn/*.png')):
    if p.endswith('_hd.png'):continue
    im=Image.open(p);u=upscale_rgba(im);u=u.resize((im.width*3,im.height*3),Image.LANCZOS);u.save(p[:-4]+'_hd.png',optimize=True)
print('furn done',flush=True)
