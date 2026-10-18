# Rooms: the user's isometric apartment art used directly, Real-ESRGAN anime x4 then Lanczos to 2x (sharp on phones).
import sys;from esr import *
import os
SRC={'ares':('../src/ares_apartment.png',(0,0,1536,542)),'batzz':('../src/batzz_room.png',None),'ophion':('../src/ophion_room.png',None)}
for n in sys.argv[1:]:
    p,box=SRC[n];im=Image.open(p).convert('RGB')
    if box: im=im.crop(box)
    im.save(f'../{n}/room.jpg',quality=92)
    u=upscale_rgb(im).resize((im.width*2,im.height*2),Image.LANCZOS);u.save(f'../{n}/room_hd.jpg',quality=90);print(n,u.size,flush=True)
