# Cut the dialogue CG figure out of each tenant sheet (alpha only; RGB = sheet pixels). rembg isnet-anime mask.
import sys,numpy as np
from rembg import remove,new_session
from PIL import Image
S=new_session(sys.argv[1])
BOX={'zayne':(0,0,400,1016),'batzz':(0,40,420,780),'ophion':(0,40,400,742)}
for n in sys.argv[2:]:
    im=Image.open(f'../src/{n}_sheet.png').convert('RGB').crop(BOX[n])
    m=remove(im,session=S,only_mask=True,post_process_mask=False)
    m.save(f'/tmp/v/{n}_mask_{sys.argv[1]}.png'); print(n,im.size)
