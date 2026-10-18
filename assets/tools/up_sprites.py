# ESRGAN anime x4 of the in-world chibi slices -> <name>_hd.png at 3x native; expression cards -> expr_<e>_hd.png at 4x.
import sys,glob,os;from esr import *
for n in sys.argv[1:]:
    for p in sorted(glob.glob(f'../{n}/*.png')):
        b=os.path.basename(p)[:-4]
        if b.endswith('_hd') or b.startswith('cg'):continue
        im=Image.open(p)
        if b.startswith('expr_'): u=upscale_rgb(im)
        else:
            u=upscale_rgba(im);w,h=im.size;u=u.resize((w*3,h*3),Image.LANCZOS)
        u.save(f'../{n}/{b}_hd.png',optimize=True)
    print(n,'done',flush=True)
