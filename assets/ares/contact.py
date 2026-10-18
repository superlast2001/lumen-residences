import json
from PIL import Image,ImageDraw
S=json.load(open('slices.json'));names=list(S);W=1600;cell=150;cols=W//cell;rows=(len(names)+cols-1)//cols
im=Image.new('RGBA',(W,rows*(cell+18)),(0,0,0,255));d=ImageDraw.Draw(im)
for i,n in enumerate(names):
    x=(i%cols)*cell;y=(i//cols)*(cell+18)
    for yy in range(0,cell,10):
        for xx in range(0,cell,10): d.rectangle([x+xx,y+yy,x+xx+9,y+yy+9],fill=(200,200,200) if (xx+yy)//10%2 else (245,245,245))
    s=Image.open(n+'.png');k=min((cell-6)/s.width,(cell-6)/s.height);s=s.resize((max(1,round(s.width*k)),max(1,round(s.height*k))),Image.LANCZOS)
    im.alpha_composite(s,(x+(cell-s.width)//2,y+(cell-s.height)//2));d.text((x+4,y+cell+3),n,fill=(255,255,255))
im.convert('RGB').save('../../screenshot-ares-slices.png')
