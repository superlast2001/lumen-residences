# Floor-tile textures from the user's furniture sheet (FLOOR TILES panel), Real-ESRGAN x4. Output: ../tiles/t<r><c>.jpg
import sys,os;sys.path.insert(0,'.');from esr import upscale_rgb
from PIL import Image
im=Image.open('../src/ares_apartment.png').convert('RGB');os.makedirs('../tiles',exist_ok=True)
xs=[11,62,113,164];ys=[562,610,658,706]
for r,y in enumerate(ys):
  for c,x in enumerate(xs):
    t=im.crop((x,y,x+47,y+44));u=upscale_rgb(t).resize((176,176),Image.LANCZOS);u.save(f'../tiles/t{r}{c}.jpg',quality=92);print(r,c,u.size,flush=True)
