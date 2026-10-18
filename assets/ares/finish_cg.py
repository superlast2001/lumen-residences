# Put the untouched CG pixels back on top of the outpainted legs and key the flat green from the NEW area only.
import numpy as np,sys,scipy.ndimage as nd
from PIL import Image
L=110;raw=np.asarray(Image.open(sys.argv[1]).convert('RGB')).astype(int);cg=Image.open('cg_cut.png').convert('RGBA')
r,g,b=raw[...,0],raw[...,1],raw[...,2];green=(g>r+25)&(g>b+25)
soft=np.clip(((g-np.maximum(r,b))-10)/40,0,1)  # 1 = green bg
al=(1-soft);xx=np.arange(raw.shape[1])[None,:];yy=np.arange(raw.shape[0])[:,None]
noise=(xx>=L+326-6)&(yy<560)&~((r>g*1.25+6)&(r>110));al=np.where(noise,0,al)  # SD left noise in the empty far-right margin
soft=np.where(noise,1,soft);al[nd.binary_erosion(green,iterations=2)]=0
# decontaminate green spill on edges
pm=(al>0)&(al<1);bgc=np.array([40,170,70]);A=raw.astype(float);a=al[pm][:,None];A[pm]=np.clip((A[pm]-(1-a)*bgc)/np.maximum(a,.25),0,255)
A[...,1]=np.minimum(A[...,1],np.maximum(A[...,0],A[...,2])*1.0+ (A[...,1]-np.maximum(A[...,0],A[...,2])).clip(max=0))  # no green cast in new pixels
lab,n=nd.label(al>.3);sz=nd.sum(np.ones(al.shape),lab,range(1,n+1));keep=np.isin(lab,[i+1 for i,s in enumerate(sz) if s>2000]);al[~nd.binary_dilation(keep,iterations=2)]=0
H0=cg.height
# colour-match the generated legs to the CG's own shins (generated pixels only)
cgA=np.zeros_like(A);cgal=np.zeros(al.shape);cgA[:H0,L:L+cg.width]=np.asarray(cg)[...,:3];cgal[:H0,L:L+cg.width]=np.asarray(cg)[...,3]/255
ref=cgA[H0-60:H0][cgal[H0-60:H0]>.9];src=A[H0:H0+120][al[H0:H0+120]>.9]
if len(ref) and len(src):
    gm=(np.arange(A.shape[0])>=H0-30)[:,None]&(al>0)
    A[gm]=np.clip((A[gm]-src.mean(0))/src.std(0)*ref.std(0)+ref.mean(0),0,255)
for xa,xb,ra,rb in [(L+cg.width-16,A.shape[1],L+cg.width-50,L+cg.width),(0,L+16,L,L+50)]:
    ref=cgA[:H0,ra:rb][cgal[:H0,ra:rb]>.9];sm=np.zeros(al.shape,bool);sm[:H0,xa:xb]=True;sm&=(al>.9)&(A[...,0]>A[...,1]*1.2)
    if len(ref)>50 and sm.sum()>50:
        src=A[sm];gm=np.zeros(al.shape,bool);gm[:H0,xa:xb]=True;gm&=al>0
        A[gm]=np.clip((A[gm]-src.mean(0))/(src.std(0)+1e-3)*ref.std(0)+ref.mean(0),0,255)
out=Image.fromarray(np.dstack([A,al*255]).astype(np.uint8));
blank=Image.new('RGBA',out.size,(0,0,0,0));top=blank.copy();top.paste(cg,(L,0))
# crossfades at the seams (bottom 24px, left/right cut edges 16px): original CG weight ramps to the completed limb
cw=cg.width;Hh,Ww=A.shape[:2];ga=np.asarray(out)[...,3]>0;wt=np.ones((Hh,Ww))
for k in range(24): wt[H0-24+k]*=1-(k+1)/25
for k in range(16): wt[:H0,L+cw-16+k]*=1-(k+1)/17; wt[:H0,L+k]*= (k+1)/17
wt=np.where(ga,wt,1)
ta=np.asarray(top).copy().astype(float);ta[...,3]*=wt
oa=np.asarray(out).copy();oa[(wt>=1)&(np.asarray(top)[...,3]>0)]=0;out=Image.fromarray(oa);top=Image.fromarray(ta.astype(np.uint8))
out.alpha_composite(top);o2=np.asarray(out).copy().astype(int)
bad=np.zeros(o2.shape[:2],bool);bad[580:]=(o2[580:,:,0]<o2[580:,:,1]*1.25+6)&(o2[580:,:,3]>0);o2[...,3][bad]=0
lab2,n2=nd.label(o2[...,3]>40);sz2=nd.sum(np.ones(bad.shape),lab2,range(1,n2+1));o2[...,3][~nd.binary_dilation(lab2==int(np.argmax(sz2))+1,iterations=1)]=0
bandm=np.zeros(bad.shape,bool);bandm[540:860]=True;op=nd.binary_opening(o2[...,3]>0,structure=np.ones((7,7)));o2[...,3][bandm&~op]=0
out=Image.fromarray(o2.astype(np.uint8));out=out.crop(out.getbbox());out.save('cg_full.png');print(out.size)
