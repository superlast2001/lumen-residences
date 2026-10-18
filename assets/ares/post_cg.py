# Second pass after cut_cg.py (system python3): alpha-only cleanup of paving stones between the legs.
import numpy as np,scipy.ndimage as nd
from PIL import Image
A=np.asarray(Image.open('cg_cut.png')).copy();r,g=A[...,0].astype(int),A[...,1].astype(int)
bad=np.zeros(r.shape,bool);bad[560:]=(r[560:]<g[560:]*1.32+6);bad=nd.binary_opening(bad,iterations=1);A[...,3][bad]=0
lab,n=nd.label(A[...,3]>40);sz=nd.sum(np.ones(r.shape),lab,range(1,n+1));k=int(np.argmax(sz))+1;A[...,3][~nd.binary_dilation(lab==k,iterations=2)]=0
Image.fromarray(A).save('cg_cut.png')
