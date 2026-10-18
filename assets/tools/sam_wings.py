# SAM (vit_l) point-prompt masks for Ophion's wings, which background-removal models drop. Alpha only.
import numpy as np,torch,sys
from PIL import Image
from segment_anything import sam_model_registry,SamPredictor
sam=sam_model_registry['vit_l'](checkpoint='/tmp/sam_vit_l.pth');P=SamPredictor(sam)
im=np.asarray(Image.open('../src/ophion_sheet.png').convert('RGB').crop((0,40,400,742)))
P.set_image(im)
sets0={'L':([(30,100),(75,60),(25,400),(40,250)],[(250,520),(200,300),(120,450)]),
      'R':([(330,80),(360,210),(345,330),(355,540)],[(250,520),(200,300),(300,620)])}
sets={'L':([(30,100),(75,60),(25,400),(40,250),(35,450),(50,540)],[(250,520),(200,300),(120,450),(150,600)]),
      'R':([(330,80),(360,210),(345,330),(355,540),(362,420)],[(250,520),(270,560),(230,480),(200,300),(300,620)])}
for k,(pos,neg) in sets.items():
    pts=np.array(pos+neg);lb=np.array([1]*len(pos)+[0]*len(neg))
    ms,sc,_=P.predict(point_coords=pts,point_labels=lb,multimask_output=True)
    for i,m in enumerate(ms): Image.fromarray((m*255).astype(np.uint8)).save(f'/tmp/v/wing{k}{i}.png');print(k,i,sc[i])
