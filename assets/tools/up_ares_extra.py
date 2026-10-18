# Ares: ESRGAN x4 of the sheet's emote icons (icon_*_hd.png at 3x) and the room at full 4x (room_4x.jpg) so phones at 3x DPR never upscale.
import glob,os;from esr import *
for p in sorted(glob.glob('../ares/icon_*.png')):
    if p.endswith('_hd.png'):continue
    im=Image.open(p);u=upscale_rgba(im).resize((im.width*3,im.height*3),Image.LANCZOS);u.save(p[:-4]+'_hd.png',optimize=True);print(p,flush=True)
im=Image.open('../ares/room.jpg').convert('RGB');u=upscale_rgb(im);u.save('../ares/room_4x.jpg',quality=88);print('room',u.size,flush=True)
