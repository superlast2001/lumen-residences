# Slice purchasable furniture + food icons straight from the furniture sheet in ares-apartment.png (crop + background key).
import numpy as np,scipy.ndimage as nd,json
from PIL import Image
A=np.asarray(Image.open('../src/ares_apartment.png').convert('RGB'))
F2=lambda vx0,vy0,vx1,vy1:(round(766+vx0/1.3),round(530+vy0/1.3),round(766+vx1/1.3),round(530+vy1/1.3))
F1=lambda vx0,vy0,vx1,vy1:(round(vx0/1.3),round(530+vy0/1.3),round(vx1/1.3),round(530+vy1/1.3))
# key, name, category, price £, action
B=lambda *v:tuple(v)
L=[('fridge','White fridge','kitchen',60,'fridge',B(878,709,903,772)),('fridge2','Twin-door fridge','kitchen',80,'fridge',B(906,705,932,767)),
 ('fridge_glass','Glass drinks fridge','kitchen',90,'fridge',B(856,563,900,657)),
 ('stove','Oven range','kitchen',45,'cook',B(896,643,930,685)),('island','Marble kitchen island','kitchen',85,'cook',B(845,651,922,715)),
 ('sink','Sink counter','kitchen',40,None,B(795,714,850,772)),('stools','Red bar stools','kitchen',25,'sit',B(826,691,872,737)),
 ('sofa_red','Red velvet sofa','living',70,'sit',B(949,565,1013,613)),('sofa_cream','Cream sofa','living',65,'sit',B(1038,567,1094,619)),
 ('tv','Big TV + console','living',90,'tv',B(939,654,997,738)),('rug_red','Red rug','living',20,None,B(997,658,1065,706)),
 ('table_marble','Marble coffee table','living',35,None,B(947,617,1022,677)),('armchair','Red armchair','living',35,'sit',B(1120,563,1153,604)),
 ('lamp','Floor lamp','living',18,None,B(1193,644,1217,698)),('sofa_grey','Grey sofa','living',55,'sit',B(1113,669,1176,721)),
 ('table_dark','Dark coffee table','living',30,None,B(1088,609,1159,665)),('pc_desk','Gaming desk','living',60,'tv',B(1141,559,1197,633)),
 ('bed_red','Red & black bed','bedroom',90,'sleep',B(1228,562,1320,636)),('bed_grey','King grey bed','bedroom',120,'sleep',B(1274,592,1390,662)),
 ('bed_single','Grey single bed','bedroom',60,'sleep',B(1226,638,1298,692)),('couch_red','Red couch','bedroom',60,'sit',B(1264,670,1344,728)),
 ('wardrobe','Glass-front wardrobe','bedroom',55,'storage',B(1381,566,1430,650)),('wardrobe_black','Black double wardrobe','bedroom',50,'storage',B(1429,604,1476,684)),
 ('wardrobe_wood','Wood wardrobe','bedroom',45,'storage',B(1385,642,1428,722)),('lamp2','Standing lamp','bedroom',15,None,B(1500,630,1524,690)),
 ('armor','Red armour statue','decor',85,None,B(1476,678,1510,762)),('plant_big','Big potted palm','decor',25,None,B(1420,688,1466,772)),
 ('palm','Palm in white pot','decor',22,None,(920,792,970,876)),('plant','Leafy plant','decor',18,None,(981,792,1035,876)),
 ('statue_red','Knight statue','decor',70,None,(1070,784,1108,864)),('statue_white','Marble statue','decor',70,None,(1108,780,1151,864)),
 ('globe','Globe on desk','decor',30,None,(970,868,1016,934)),('lamp_warm','Warm floor lamp','decor',20,None,(1123,903,1162,987)),
 ('roses','Red-flower plant','decor',24,None,(1196,784,1247,871)),
 ('bathtub','White bathtub','bath',70,'bath',B(13,795,95,860)),('shower','Glass shower','bath',80,'bath',B(103,785,157,882)),
 ('tub_vanity','Bath vanity','bath',40,None,B(16,860,82,920)),('vanity_black','Black vanity','bath',45,None,B(113,930,167,1004)),
 ('toilet','Toilet','bath',30,None,B(173,940,215,1004)),('cabinet','Bathroom cabinet','bath',30,'storage',B(135,875,175,937)),
 ('powerrack','Power rack','gym',150,'squat',B(264,786,348,904)),('lockers','Red gym lockers','gym',40,'storage',B(351,786,394,862)),
 ('speedbag','Speed bag stand','gym',35,'punch',B(398,786,430,838)),('pullup','Pull-up tower','gym',70,'pull',B(426,786,468,862)),
 ('gym_cabinet','Gym cabinet','gym',45,'storage',B(474,786,513,868)),('machine_red','Red cardio machine','gym',100,'run',B(524,788,566,874)),
 ('bench','Flat weight bench','gym',45,'lift',B(365,838,440,884)),('barbell','Barbell','gym',30,'lift',B(450,852,518,894)),
 ('ball','Exercise ball','gym',12,'stretch',B(524,876,576,922)),('benchpress','Bench press station','gym',90,'lift',B(266,868,386,946)),
 ('kettlebell','Kettlebell','gym',10,'lift',B(385,886,405,916)),('abbench','Curved ab bench','gym',35,'stretch',B(322,910,382,962)),
 ('dumbbells','Dumbbell set','gym',60,'lift',B(262,938,378,1008)),('treadmill','Treadmill','gym',110,'run',B(462,912,572,986)),
 ('bench_blue','Blue flat bench','gym',30,'lift',B(430,964,484,1000)),
 ('bookcase_red','Red bookcase','study',60,'read',B(630,793,693,899)),('bookshelf','Tall bookshelf','study',60,'read',B(793,780,855,884)),
 ('bookshelf2','Wood bookshelf','study',55,'read',B(855,786,902,890)),('desk','Wood writing desk','study',55,'read',B(600,876,687,963)),
 ('chair_red','Red desk chair','study',20,'sit',B(682,880,720,936)),('lamp_floor','Brass floor lamp','study',18,None,B(578,795,605,888)),
 ('rug_ornate','Ornate red rug','study',30,None,B(642,942,749,1007)),('cabinet_glass','Display cabinet','study',50,'storage',B(743,786,789,876)),
]
FOOD=[('noodles','Noodle bowl',6,B(1259,796,1298,834)),('hotpot','Hot pot',9,B(1307,794,1338,834)),('grill','Grill platter',12,B(1348,796,1400,834)),
 ('paella','Paella',10,B(1257,836,1307,877)),('sushi','Sushi plates',11,B(1317,834,1371,869)),('steak','Steak box',14,B(1376,830,1438,871)),
 ('wine','Red wine',9,B(1442,846,1465,892)),('water','Water bottle',1,B(1255,876,1279,940)),('jar','Pickle jar',3,B(1280,874,1307,917)),
 ('sauce','Hot sauce',2,B(1309,869,1338,919)),('rice','Rice cooker',8,B(1403,882,1442,934)),('coffee','Coffee cup',2,B(1367,917,1394,944)),
 ('whiskey','Whiskey',12,B(1255,942,1286,1000)),('juice','Orange juice',3,B(1365,948,1390,1000)),('pizza','Pizza box',9,B(1340,874,1402,921)),('bento','Bento box',7,B(1419,934,1463,971))]
def cut(box,name):
    x0,y0,x1,y1=box;M=6;x0-=M;y0-=M;x1+=M;y1+=M;a=A[y0:y1,x0:x1].astype(int);lum=a.mean(-1);sat=a.max(-1)-a.min(-1)
    brd=np.r_[lum[0],lum[-1],lum[:,0],lum[:,-1]];bl=np.median(brd)
    fg=(lum>bl+11)|(sat>30);fg=nd.binary_opening(fg,iterations=1);fg=nd.binary_closing(fg,structure=np.ones((3,3)),iterations=3);fg=nd.binary_fill_holes(fg);fg=nd.binary_erosion(fg,iterations=1)|((lum>bl+20)&fg)
    lab,k=nd.label(fg);
    if k==0: return None
    h,w=fg.shape;cy,cx=h/2,w/2;best=None
    sz=nd.sum(np.ones(fg.shape),lab,range(1,k+1));keep=np.zeros_like(fg)
    big=int(np.argmax(sz))+1;keep|=lab==big
    for i in range(k):  # attach other parts that lie mostly inside the inner box and are reasonably large
        if i+1==big: continue
        sl=nd.find_objects((lab==i+1).astype(int))[0]
        if sz[i]>60 and sl[0].start>M-2 and sl[1].start>M-2 and sl[0].stop<h-M+2 and sl[1].stop<w-M+2: keep|=lab==i+1
    al=keep.astype(np.float32);rim=keep&~nd.binary_erosion(keep);al[rim]=np.clip((lum[rim]-bl)/30,0.35,1)
    out=np.dstack([a.astype(np.uint8),(al*255).astype(np.uint8)]);im=Image.fromarray(out);im=im.crop(im.getbbox());im.save(f'../furn/{name}.png');return list(im.size)
meta={}
for k,n,c,p,act,box in L:
    s=cut(box,k);meta[k]=dict(n=n,cat=c,price=p,act=act,size=s)
food={}
for k,n,p,box in FOOD: s=cut(box,'food_'+k);food[k]=dict(n=n,price=p,size=s)
json.dump(dict(furn=meta,food=food),open('../furn/furn.json','w'),indent=1);print(len(meta),len(food))
