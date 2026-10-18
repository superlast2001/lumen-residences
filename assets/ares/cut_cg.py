# Cut Ares out of the dialogue CG (removes the garden). Needs rembg (isnet-anime): run with /tmp/ares7/rbg/bin/python.
# Character RGB is untouched; only the alpha channel is computed (mask, 1px erode + 1.2px soft edge to drop background fringe).
from rembg import remove,new_session
from PIL import Image,ImageFilter,ImageChops
im=Image.open('sheet.png').convert('RGBA').crop((5,0,331,805))
m=remove(im.convert('RGB'),session=new_session('isnet-anime'),only_mask=True,post_process_mask=True).convert('L')
m=ImageChops.darker(m,m.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.2)))
m=m.point(lambda v:0 if v<28 else v)
import numpy as np
A=np.asarray(im).astype(int); M=np.asarray(m).copy(); sat=A[...,:3].max(-1)-A[...,:3].min(-1)
M[600:][(sat[600:]<70)]=0  # paving stones the mask kept between his legs (low-saturation grey); skin is strongly saturated
m=Image.fromarray(M).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(.8)); m=ImageChops.darker(m,Image.fromarray(M))
im.putalpha(m); im.crop(im.getbbox()).save('cg_cut.png'); print(im.getbbox())
