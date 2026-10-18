# Known-background matting for sheets on a white panel: for the outer band of a keyed figure, alpha is solved from
# the observed colour vs. white and the nearest interior colour; colour is un-premultiplied. Removes the light halo.
import numpy as np,scipy.ndimage as nd
def white_matte(rgb,fg,band=3,W=(250,250,250)):
    rgb=rgb.astype(np.float32);W=np.array(W,np.float32)
    inner=nd.binary_erosion(fg,iterations=band)
    if not inner.any(): inner=nd.binary_erosion(fg,iterations=1)
    idx=nd.distance_transform_edt(~inner,return_distances=False,return_indices=True);F=rgb[idx[0],idx[1]]
    d=F-W;o=rgb-W;den=(d*d).sum(-1);a=np.where(den>200,(o*d).sum(-1)/np.maximum(den,1),1.0)
    a=np.clip(a*1.08,0,1)
    zone=fg&~inner
    al=fg.astype(np.float32);al[zone]=a[zone]
    out=rgb.copy();aa=np.maximum(al[...,None],.35);un=np.clip((rgb-(1-aa)*W)/aa,0,255)
    # in the band use the un-premultiplied colour, blended toward the interior colour where alpha is low
    t=np.clip((al[...,None]-.35)/.5,0,1);mix=un*t+F*(1-t);out[zone]=mix[zone]
    al[al<.04]=0
    return out.astype(np.uint8),al
