'use strict';
// Lumen Residences v0.3.5: food & drink art, painted in code in the same chibi sticker style as furnart.js
// (soft gradients, a light rim highlight, then one dark sticker outline round the whole silhouette). FOODART.img(k) -> cached Image.
const FOODART=(()=>{const S=128,OL='#34323a';
 const rr=(c,x,y,w,h,r)=>{c.beginPath();c.roundRect(x,y,w,h,r);};
 const lg=(c,x0,y0,x1,y1,a,b)=>{const g=c.createLinearGradient(x0,y0,x1,y1);g.addColorStop(0,a);g.addColorStop(1,b);return g;};
 const shade=(h,f)=>{let n=parseInt(h.slice(1),16),r=n>>16,g=n>>8&255,b=n&255;const t=f<0?0:255,p=Math.abs(f);r=Math.round((t-r)*p+r);g=Math.round((t-g)*p+g);b=Math.round((t-b)*p+b);return'#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1);};
 const ell=(c,x,y,rx,ry,fill,st)=>{if(fill&&fill.startsWith('rgba(0,0,0'))return;c.beginPath();c.ellipse(x,y,rx,ry,0,0,7);if(fill){c.fillStyle=fill;c.fill();}if(st){c.strokeStyle=st;c.lineWidth=1.6;c.stroke();}};
 const line=(c,col,w)=>{c.strokeStyle=col;c.lineWidth=w||1.6;c.stroke();};
 const hi=(c,x,y,w,h)=>{c.fillStyle='rgba(255,255,255,.55)';rr(c,x,y,w,h,w/2);c.fill();};
 const steam=c=>{c.strokeStyle='rgba(255,255,255,.9)';c.lineWidth=3;c.lineCap='round';[[52,30],[64,24],[76,30]].forEach(([x,y])=>{c.beginPath();c.moveTo(x,y+14);c.bezierCurveTo(x-6,y+8,x+6,y+4,x,y-4);c.stroke();});};
 // ---- families
 const mug=(c,liq,o={})=>{// a round café mug seen slightly from above
  c.fillStyle=lg(c,30,0,98,0,o.cup||'#ffffff',shade(o.cup||'#ffffff',-.18));rr(c,30,52,62,52,14);c.fill();line(c,'rgba(52,50,58,.45)');
  c.beginPath();c.ellipse(97,74,13,14,0,-1.4,1.4);c.lineWidth=7;c.strokeStyle=shade(o.cup||'#ffffff',-.12);c.stroke();
  ell(c,61,54,31,9,o.cup||'#fff');ell(c,61,55,26,6.5,liq);if(o.foam){ell(c,61,55,20,5,o.foam);c.strokeStyle=shade(liq,-.1);c.lineWidth=1.6;c.beginPath();c.moveTo(54,55);c.quadraticCurveTo(61,50,68,55);c.quadraticCurveTo(61,59,54,55);c.stroke();}
  if(o.band){c.fillStyle=o.band;c.fillRect(30,74,62,8);}hi(c,36,62,5,26);ell(c,61,106,30,5,'rgba(0,0,0,.12)');if(o.steam!==0)steam(c);};
 const glass=(c,liq,o={})=>{// tall glass, ice, straw, garnish
  c.fillStyle='rgba(220,240,255,.55)';c.beginPath();c.moveTo(38,30);c.lineTo(90,30);c.lineTo(84,110);c.lineTo(44,110);c.closePath();c.fill();
  c.fillStyle=lg(c,0,44,0,108,shade(liq,.15),liq);c.beginPath();c.moveTo(40,(o.lv||44));c.lineTo(88,(o.lv||44));c.lineTo(84,106);c.lineTo(44,106);c.closePath();c.fill();
  if(o.ice!==0){c.fillStyle='rgba(255,255,255,.55)';[[50,52],[66,60],[56,70]].forEach(([x,y])=>{rr(c,x,y,13,11,3);c.fill();});}
  if(o.layer){c.fillStyle=o.layer;c.beginPath();c.moveTo(43,88);c.lineTo(85,88);c.lineTo(84,106);c.lineTo(44,106);c.closePath();c.fill();}
  ell(c,64,30,26,6,'rgba(235,248,255,.7)');ell(c,64,(o.lv||44),23,5,shade(liq,.25));
  if(o.straw){c.strokeStyle=o.straw;c.lineWidth=5;c.lineCap='round';c.beginPath();c.moveTo(70,90);c.lineTo(80,16);c.lineTo(92,12);c.stroke();}
  if(o.garnish=='orange'||o.garnish=='lemon'||o.garnish=='lime'){const col={orange:'#ff9a1e',lemon:'#ffe04a',lime:'#8ad64a'}[o.garnish];c.save();c.translate(42,34);ell(c,0,0,13,13,col);ell(c,0,0,10,10,shade(col,.45));c.strokeStyle=col;c.lineWidth=1.2;for(let i=0;i<6;i++){c.beginPath();c.moveTo(0,0);c.lineTo(Math.cos(i)*10,Math.sin(i)*10);c.stroke();}c.restore();}
  if(o.garnish=='mint'){c.fillStyle='#4cc05a';c.beginPath();c.ellipse(50,28,9,5,-.6,0,7);c.fill();c.beginPath();c.ellipse(60,25,8,4.5,.5,0,7);c.fill();}
  if(o.garnish=='cream'){c.fillStyle='#fffaf0';[[52,26,12],[64,20,13],[76,26,12],[64,30,14]].forEach(([x,y,r])=>{c.beginPath();c.arc(x,y,r,0,7);c.fill();});ell(c,66,12,5,5,'#e8303a');}
  hi(c,46,40,4,56);ell(c,64,112,22,4,'rgba(0,0,0,.12)');};
 const boba=(c,liq,o={})=>{// bubble tea: dome lid, fat straw, tapioca pearls
  c.fillStyle='rgba(225,240,255,.6)';c.beginPath();c.moveTo(36,40);c.lineTo(92,40);c.lineTo(84,112);c.lineTo(44,112);c.closePath();c.fill();
  c.fillStyle=lg(c,0,46,0,110,shade(liq,.2),liq);c.beginPath();c.moveTo(38,48);c.lineTo(90,48);c.lineTo(84,110);c.lineTo(44,110);c.closePath();c.fill();
  if(o.swirl){c.strokeStyle=o.swirl;c.lineWidth=5;c.beginPath();c.moveTo(42,60);c.quadraticCurveTo(64,72,88,58);c.moveTo(44,78);c.quadraticCurveTo(66,90,86,76);c.stroke();}
  for(let i=0;i<14;i++){const x=48+(i*11)%32,y=96+((i*7)%3)*5-((i>9)?6:0);ell(c,x,y,4.6,4.6,o.pearl||'#3a2418');ell(c,x-1.4,y-1.6,1.3,1.3,'rgba(255,255,255,.6)');}
  c.fillStyle='rgba(255,255,255,.7)';c.beginPath();c.ellipse(64,40,30,8,0,0,7);c.fill();c.beginPath();c.ellipse(64,38,28,14,0,Math.PI,0);c.fillStyle='rgba(235,248,255,.75)';c.fill();c.strokeStyle='rgba(52,50,58,.4)';c.lineWidth=1.4;c.stroke();
  c.strokeStyle=o.straw||'#ff6aa8';c.lineWidth=8;c.lineCap='round';c.beginPath();c.moveTo(70,100);c.lineTo(76,6);c.stroke();c.strokeStyle='rgba(255,255,255,.5)';c.lineWidth=2;c.beginPath();c.moveTo(72,96);c.lineTo(78,10);c.stroke();
  if(o.top){c.fillStyle=o.top;c.beginPath();c.arc(54,30,6,0,7);c.fill();}hi(c,42,54,4,46);ell(c,64,114,22,4,'rgba(0,0,0,.12)');};
 const bowl=(c,fill,o={})=>{c.fillStyle=lg(c,0,64,0,112,o.bowl||'#ffffff',shade(o.bowl||'#ffffff',-.22));c.beginPath();c.moveTo(16,62);c.quadraticCurveTo(20,112,64,112);c.quadraticCurveTo(108,112,112,62);c.closePath();c.fill();
  if(o.rim)c.fillStyle=o.rim,c.fillRect(20,72,88,6);ell(c,64,62,48,14,o.bowl||'#fff');ell(c,64,62,43,11,fill);if(o.top)o.top(c);hi(c,26,72,5,20);ell(c,64,116,40,5,'rgba(0,0,0,.12)');};
 const plate=(c,o={})=>{ell(c,64,86,54,22,'#f6f8fb');ell(c,64,84,44,16,'#ffffff');c.strokeStyle='rgba(120,140,170,.45)';c.lineWidth=1.4;c.beginPath();c.ellipse(64,84,44,16,0,0,7);c.stroke();ell(c,64,110,48,5,'rgba(0,0,0,.1)');};
 const bottle=(c,col,o={})=>{c.fillStyle=lg(c,44,0,84,0,shade(col,.2),shade(col,-.2));c.beginPath();c.moveTo(56,10);c.lineTo(72,10);c.lineTo(72,34);c.quadraticCurveTo(86,42,86,58);c.lineTo(86,108);c.quadraticCurveTo(86,114,78,114);c.lineTo(50,114);c.quadraticCurveTo(42,114,42,108);c.lineTo(42,58);c.quadraticCurveTo(42,42,56,34);c.closePath();c.fill();
  c.fillStyle=o.cap||'#3a3840';rr(c,54,4,20,12,3);c.fill();if(o.label){c.fillStyle=o.label;rr(c,44,64,40,30,4);c.fill();if(o.mark){c.fillStyle=o.mark;c.beginPath();c.arc(64,79,8,0,7);c.fill();}}hi(c,48,46,5,52);ell(c,64,116,24,4,'rgba(0,0,0,.12)');};
 const can=(c,col,mark)=>{c.fillStyle=lg(c,40,0,88,0,shade(col,.25),shade(col,-.25));rr(c,40,26,48,86,10);c.fill();ell(c,64,28,24,7,'#d8dce4');ell(c,64,28,8,3,'#a0a6b0');c.fillStyle=mark;c.beginPath();c.moveTo(70,46);c.lineTo(56,74);c.lineTo(66,74);c.lineTo(58,98);c.lineTo(76,66);c.lineTo(66,66);c.closePath();c.fill();hi(c,46,36,5,66);ell(c,64,114,24,4,'rgba(0,0,0,.12)');};
 const stem=(c,liq,o={})=>{// wine / cocktail glass
  c.fillStyle='rgba(225,240,255,.55)';if(o.coupe){c.beginPath();c.moveTo(26,34);c.lineTo(102,34);c.lineTo(64,72);c.closePath();c.fill();c.fillStyle=liq;c.beginPath();c.moveTo(32,38);c.lineTo(96,38);c.lineTo(64,68);c.closePath();c.fill();}
  else{c.beginPath();c.moveTo(38,22);c.quadraticCurveTo(34,74,64,76);c.quadraticCurveTo(94,74,90,22);c.closePath();c.fill();c.fillStyle=liq;c.beginPath();c.moveTo(38,46);c.quadraticCurveTo(38,72,64,73);c.quadraticCurveTo(90,72,90,46);c.closePath();c.fill();}
  c.fillStyle='rgba(225,240,255,.85)';c.fillRect(61,72,6,30);ell(c,64,106,22,6,'rgba(225,240,255,.85)');if(o.cherry){c.strokeStyle='#4a8a3a';c.lineWidth=2;c.beginPath();c.moveTo(80,40);c.quadraticCurveTo(86,26,94,22);c.stroke();ell(c,80,42,6,6,'#e8303a');}
  if(o.garnish){ell(c,34,34,9,9,o.garnish);ell(c,34,34,6,6,shade(o.garnish,.4));}hi(c,44,28,4,30);};
 const slice=(c,sponge,cream,top)=>{plate(c);c.fillStyle=sponge;c.beginPath();c.moveTo(30,80);c.lineTo(84,96);c.lineTo(100,74);c.lineTo(100,52);c.lineTo(46,40);c.lineTo(30,58);c.closePath();c.fill();
  c.fillStyle=cream;c.beginPath();c.moveTo(30,58);c.lineTo(84,72);c.lineTo(100,52);c.lineTo(46,40);c.closePath();c.fill();c.fillStyle=shade(cream,-.06);c.fillRect(30,66,54,6);c.beginPath();c.moveTo(30,66);c.lineTo(84,82);c.lineTo(84,88);c.lineTo(30,72);c.fill();
  if(top=='berry'){ell(c,70,46,9,8,'#ff3a4a');c.fillStyle='#3aa040';c.beginPath();c.moveTo(66,39);c.lineTo(74,39);c.lineTo(70,44);c.fill();}if(top=='choco'){c.fillStyle='#5a3020';c.beginPath();c.moveTo(30,58);c.lineTo(84,72);c.lineTo(100,52);c.lineTo(46,40);c.closePath();c.fill();ell(c,68,52,6,6,'#ff3a4a');}};
 const P={
  // meals
  noodles:c=>bowl(c,'#f2c67a',{bowl:'#d8403a',top:c=>{c.strokeStyle='#fff0b0';c.lineWidth=3;for(let i=0;i<5;i++){c.beginPath();c.moveTo(30+i*10,60);c.quadraticCurveTo(50+i*8,52,70+i*6,64);c.stroke();}ell(c,48,58,10,7,'#fff');ell(c,48,58,5,4,'#ffb820');c.fillStyle='#f4a0a0';c.beginPath();c.arc(78,58,9,0,7);c.fill();ell(c,78,58,4,4,'#fff');c.fillStyle='#3aa040';c.fillRect(60,52,10,4);}}),
  hotpot:c=>{bowl(c,'#d8402a',{bowl:'#5a5a64',top:c=>{[['#ffd6a0',44,58],['#7ac25a',62,54],['#ff9a6a',80,60],['#fff',58,64],['#a0522d',72,66]].forEach(([col,x,y])=>{ell(c,x,y,8,5,col);});}});steam(c);},
  grill:c=>{plate(c);c.strokeStyle='#5a5a64';c.lineWidth=2;for(let i=0;i<6;i++){c.beginPath();c.moveTo(26+i*14,72);c.lineTo(36+i*14,98);c.stroke();}[['#b04a2a',44,76],['#c8602a',66,82],['#9a3a22',86,78]].forEach(([col,x,y])=>{c.fillStyle=col;rr(c,x-14,y-9,28,18,7);c.fill();c.strokeStyle='#5a2a1a';c.lineWidth=2;c.beginPath();c.moveTo(x-8,y-6);c.lineTo(x-2,y+6);c.moveTo(x+2,y-6);c.lineTo(x+8,y+6);c.stroke();});ell(c,56,92,6,4,'#5ac04a');ell(c,74,94,6,4,'#ffcf3a');},
  paella:c=>{c.fillStyle='#2e2c34';ell(c,64,82,54,24,'#3a3840');ell(c,64,80,48,19,'#f2b830');[['#ff6a4a',46,76],['#ff6a4a',80,82],['#3aa040',60,72],['#3aa040',72,88],['#fff0c0',58,86],['#ffe060',88,74]].forEach(([col,x,y])=>ell(c,x,y,6,4,col));ell(c,40,86,8,4,'#ffe04a');c.fillStyle='#3a3840';rr(c,4,74,14,8,3);c.fill();rr(c,110,74,14,8,3);c.fill();},
  sushi:c=>{c.fillStyle='#b8834a';rr(c,14,72,100,30,6);c.fill();c.fillStyle='#8a5a2a';c.fillRect(24,100,10,8);c.fillRect(94,100,10,8);[[34,'#ff7a5a'],[64,'#ffffff'],[94,'#ff9a3a']].forEach(([x,f])=>{c.fillStyle='#fffaf0';rr(c,x-14,62,28,18,7);c.fill();c.fillStyle=f;rr(c,x-16,54,32,14,7);c.fill();c.strokeStyle='rgba(255,255,255,.6)';c.lineWidth=2;c.beginPath();c.moveTo(x-8,58);c.lineTo(x-2,66);c.moveTo(x+2,58);c.lineTo(x+8,66);c.stroke();});c.fillStyle='#1e2a1e';c.fillRect(60,62,8,18);},
  steak:c=>{plate(c);c.fillStyle='#8a3a22';rr(c,30,64,58,34,16);c.fill();c.fillStyle='#b04a2a';rr(c,32,62,54,28,14);c.fill();c.strokeStyle='#5a2214';c.lineWidth=3;for(let i=0;i<3;i++){c.beginPath();c.moveTo(42+i*14,66);c.lineTo(50+i*14,86);c.stroke();}c.fillStyle='#f2c67a';rr(c,88,72,18,8,3);c.fill();rr(c,90,82,18,8,3);c.fill();ell(c,96,66,8,6,'#5ac04a');},
  bento:c=>{c.fillStyle='#2e2c34';rr(c,14,48,100,62,10);c.fill();c.fillStyle='#d8403a';rr(c,18,52,92,54,8);c.fill();c.fillStyle='#1e1c22';c.fillRect(62,52,4,54);c.fillRect(66,78,44,4);c.fillStyle='#fffaf0';rr(c,22,56,38,46,6);c.fill();ell(c,41,79,7,7,'#e8303a');
   ell(c,80,66,10,7,'#ffcf3a');ell(c,98,66,8,7,'#b04a2a');ell(c,80,94,9,7,'#5ac04a');ell(c,98,94,9,7,'#ff8a5a');},
  pizza:c=>{c.fillStyle='#e8a050';c.beginPath();c.moveTo(20,44);c.quadraticCurveTo(64,26,108,44);c.lineTo(64,112);c.closePath();c.fill();c.fillStyle='#ffd24a';c.beginPath();c.moveTo(26,50);c.quadraticCurveTo(64,36,102,50);c.lineTo(64,104);c.closePath();c.fill();[[50,58],[76,60],[62,80],[66,48]].forEach(([x,y])=>{ell(c,x,y,7,6,'#d8402a');ell(c,x-2,y-2,2,2,'rgba(255,255,255,.4)');});ell(c,56,70,3,2,'#3aa040');ell(c,72,74,3,2,'#3aa040');},
  rice:c=>bowl(c,'#fffaf2',{bowl:'#f4f0e6',rim:'#4a6aa8',top:c=>{c.fillStyle='#ffffff';for(let i=0;i<9;i++){c.beginPath();c.arc(36+i*7,52+(i%3)*2,7,0,7);c.fill();}c.fillStyle='#1e2a1e';c.fillRect(56,50,14,5);}}),
  curry:c=>{plate(c);c.fillStyle='#fffaf2';c.beginPath();c.arc(48,78,22,Math.PI,0);c.fill();ell(c,48,80,24,12,'#fffaf2');ell(c,80,84,28,13,'#c8862a');[[74,82],[86,86],[80,78]].forEach(([x,y])=>{c.fillStyle=['#ff9a3a','#f2d07a','#7a4a2a'][(x+y)%3];rr(c,x-5,y-4,10,8,3);c.fill();});ell(c,40,66,4,3,'#e8303a');},
  omurice:c=>{plate(c);c.fillStyle=lg(c,0,56,0,96,'#ffe56a','#f2b830');c.beginPath();c.ellipse(64,78,36,20,0,0,7);c.fill();c.strokeStyle='#e8303a';c.lineWidth=5;c.lineCap='round';c.beginPath();c.moveTo(50,74);c.bezierCurveTo(56,64,64,70,64,76);c.bezierCurveTo(64,70,72,64,78,74);c.bezierCurveTo(74,82,64,88,64,88);c.bezierCurveTo(64,88,54,82,50,74);c.stroke();ell(c,98,92,7,5,'#5ac04a');},
  burger:c=>{c.fillStyle=lg(c,0,30,0,64,'#f4b860','#d88a30');c.beginPath();c.ellipse(64,56,44,26,0,Math.PI,0);c.fill();c.fillRect(20,54,88,6);c.fillStyle='#fff2c4';[[44,40],[60,34],[78,40],[66,46],[52,48]].forEach(([x,y])=>{ell(c,x,y,2.6,1.6,'#fff2c4');});
   c.fillStyle='#5ac04a';c.beginPath();c.moveTo(18,62);for(let i=0;i<=8;i++)c.lineTo(18+i*11.5,i%2?70:62);c.lineTo(110,66);c.lineTo(18,66);c.fill();c.fillStyle='#ffcf3a';c.beginPath();c.moveTo(22,66);c.lineTo(106,66);c.lineTo(96,78);c.lineTo(84,70);c.lineTo(32,74);c.closePath();c.fill();c.fillStyle='#6a3420';rr(c,20,68,88,16,8);c.fill();c.fillStyle='#e8a050';rr(c,22,84,84,16,8);c.fill();ell(c,64,104,42,5,'rgba(0,0,0,.12)');},
  pasta:c=>{plate(c);c.strokeStyle='#f6d48a';c.lineWidth=4;for(let i=0;i<7;i++){c.beginPath();c.ellipse(64+(i%3-1)*8,78,26-i*2,10-i,i*.4,0,5.5);c.stroke();}[[54,72],[72,76],[62,84]].forEach(([x,y])=>ell(c,x,y,6,5,'#c84a2a'));ell(c,64,68,8,3,'#3aa040');},
  dumplings:c=>{c.fillStyle='#c8a060';ell(c,64,86,52,22,'#b8834a');ell(c,64,82,46,17,'#d8a868');[[40,78],[64,72],[88,78],[52,90],[76,90]].forEach(([x,y])=>{c.fillStyle='#fff6e6';c.beginPath();c.moveTo(x-14,y+6);c.quadraticCurveTo(x,y-14,x+14,y+6);c.closePath();c.fill();c.strokeStyle='rgba(180,150,110,.8)';c.lineWidth=1.4;for(let k=-1;k<=1;k++){c.beginPath();c.moveTo(x+k*5,y-4);c.lineTo(x+k*6,y+2);c.stroke();}});steam(c);},
  // snacks
  onigiri:c=>{c.fillStyle='#ffffff';c.beginPath();c.moveTo(64,20);c.quadraticCurveTo(76,22,104,86);c.quadraticCurveTo(108,104,90,106);c.lineTo(38,106);c.quadraticCurveTo(20,104,24,86);c.quadraticCurveTo(52,22,64,20);c.fill();c.fillStyle='#1e2a1e';rr(c,44,74,40,34,4);c.fill();c.fillStyle='rgba(60,90,60,.5)';c.fillRect(44,82,40,2);ell(c,64,52,7,6,'#e8303a');ell(c,64,110,40,4,'rgba(0,0,0,.12)');},
  sandwich:c=>{c.fillStyle='#f6dfa8';c.beginPath();c.moveTo(18,96);c.lineTo(110,96);c.lineTo(64,30);c.closePath();c.fill();c.fillStyle='#d8a050';c.fillRect(18,96,92,6);c.fillStyle='#5ac04a';c.beginPath();c.moveTo(16,90);for(let i=0;i<=8;i++)c.lineTo(16+i*12,i%2?96:88);c.lineTo(112,94);c.fill();c.fillStyle='#ff8a8a';c.fillRect(22,82,84,6);c.fillStyle='#ffd24a';c.fillRect(26,76,76,5);c.fillStyle='#f6dfa8';c.beginPath();c.moveTo(24,76);c.lineTo(104,76);c.lineTo(64,22);c.closePath();c.fill();c.fillStyle='#d8a050';c.beginPath();c.moveTo(64,22);c.lineTo(104,76);c.lineTo(100,76);c.lineTo(64,28);c.fill();},
  fries:c=>{['#ffd24a','#f6c23a','#ffe06a'].forEach((col,j)=>{for(let i=0;i<4;i++){c.fillStyle=col;c.save();c.translate(36+i*16+j*4,58);c.rotate((i-1.5)*.12+(j-1)*.08);rr(c,-4,-36+j*4,8,46,2);c.fill();c.restore();}});c.fillStyle=lg(c,32,0,96,0,'#ff4a4a','#c82a2a');c.beginPath();c.moveTo(30,56);c.lineTo(98,56);c.lineTo(88,112);c.lineTo(40,112);c.closePath();c.fill();c.fillStyle='#ffd24a';c.beginPath();c.arc(64,80,10,0,7);c.fill();c.fillStyle='#c82a2a';c.font='900 14px system-ui';c.textAlign='center';c.fillText('L',64,85);},
  croissant:c=>{c.fillStyle='#e8a050';[[34,74,16,-.6],[50,64,18,-.3],[64,60,20,0],[78,64,18,.3],[94,74,16,.6]].forEach(([x,y,r,a])=>{c.save();c.translate(x,y);c.rotate(a);c.fillStyle=lg(c,0,-r,0,r,'#f6c070','#c8782a');c.beginPath();c.ellipse(0,0,r*.75,r,0,0,7);c.fill();c.restore();});c.strokeStyle='rgba(120,60,20,.6)';c.lineWidth=2;[[42,60,42,86],[58,52,58,80],[70,52,70,80],[86,60,86,86]].forEach(([a,b,d,e])=>{c.beginPath();c.moveTo(a,b);c.lineTo(d,e);c.stroke();});ell(c,64,100,40,5,'rgba(0,0,0,.12)');},
  popcorn:c=>{c.fillStyle='#fff6d0';for(let i=0;i<16;i++){c.beginPath();c.arc(36+(i*13)%58,30+((i*7)%4)*7,10,0,7);c.fill();}c.fillStyle='#ffffff';c.beginPath();c.moveTo(30,46);c.lineTo(98,46);c.lineTo(88,112);c.lineTo(40,112);c.closePath();c.fill();c.fillStyle='#e8303a';for(let i=0;i<4;i++){c.beginPath();c.moveTo(34+i*17,46);c.lineTo(42+i*17,46);c.lineTo(46+i*15,112);c.lineTo(40+i*15,112);c.fill();}},
  taiyaki:c=>{c.save();c.translate(64,70);c.fillStyle=lg(c,0,-30,0,30,'#f2b860','#c8782a');c.beginPath();c.moveTo(-44,0);c.quadraticCurveTo(-30,-30,14,-24);c.lineTo(46,-34);c.lineTo(38,0);c.lineTo(46,34);c.lineTo(14,24);c.quadraticCurveTo(-30,30,-44,0);c.fill();ell(c,-26,-6,5,5,'#5a3020');c.strokeStyle='rgba(120,60,20,.6)';c.lineWidth=2;for(let i=0;i<4;i++){c.beginPath();c.arc(-6+i*10,0,8,-1,1);c.stroke();}c.restore();},
  jar:c=>{c.fillStyle='rgba(225,240,255,.6)';rr(c,34,34,60,76,14);c.fill();c.fillStyle='#8ab84a';rr(c,38,48,52,58,10);c.fill();[[50,64],[70,74],[56,88],[76,94]].forEach(([x,y])=>ell(c,x,y,9,6,'#6a9a3a'));c.fillStyle='#d8a030';rr(c,32,24,64,14,4);c.fill();hi(c,42,52,5,40);},
  sauce:c=>bottle(c,'#e8303a',{cap:'#3aa040',label:'#fff6e0',mark:'#ff7a1e'}),
  // desserts
  cake:c=>slice(c,'#fbe2a8','#fff6f0','berry'),
  chococake:c=>slice(c,'#7a4a2a','#a8704a','choco'),
  donut:c=>{ell(c,64,70,42,34,'#e8a050');ell(c,64,66,38,29,'#ff8ac0');ell(c,64,70,13,9,'rgba(0,0,0,0)');c.save();c.globalCompositeOperation='destination-out';ell(c,64,70,12,8,'#000');c.restore();['#ffffff','#5ac0ff','#ffe04a','#7ae05a'].forEach((col,i)=>{for(let k=0;k<4;k++){c.fillStyle=col;c.save();c.translate(40+((i*17+k*23)%48),50+((i*11+k*13)%32));c.rotate(i+k);c.fillRect(-4,-1.5,8,3);c.restore();}});hi(c,40,50,5,12);},
  macarons:c=>{[[40,'#ff9ac8'],[64,'#a8e6a0'],[88,'#c8a8ff']].forEach(([x,col],i)=>{const y=80-(i==1?14:0);ell(c,x,y+6,20,10,shade(col,-.12));c.fillStyle='#fff6ea';c.fillRect(x-19,y-2,38,6);ell(c,x,y-4,20,10,col);hi(c,x-12,y-10,4,6);});ell(c,64,104,44,5,'rgba(0,0,0,.12)');},
  icecream:c=>{c.fillStyle='#e8a050';c.beginPath();c.moveTo(40,62);c.lineTo(88,62);c.lineTo(64,116);c.closePath();c.fill();c.strokeStyle='rgba(140,80,30,.6)';c.lineWidth=1.6;for(let i=0;i<4;i++){c.beginPath();c.moveTo(44+i*10,62);c.lineTo(66+i*4,104-i*8);c.stroke();}ell(c,64,58,28,16,'#fff6ea');[['#ff9ac8',50,44],['#a8e6a0',78,44],['#fff0c0',64,26]].forEach(([col,x,y])=>{c.fillStyle=col;c.beginPath();c.arc(x,y,20,0,7);c.fill();hi(c,x-10,y-12,4,8);});ell(c,64,12,6,6,'#e8303a');},
  pudding:c=>{plate(c);c.fillStyle=lg(c,0,40,0,90,'#ffe08a','#f2b830');c.beginPath();c.moveTo(40,90);c.lineTo(46,48);c.quadraticCurveTo(64,40,82,48);c.lineTo(88,90);c.closePath();c.fill();c.fillStyle='#8a4a1e';c.beginPath();c.moveTo(46,48);c.quadraticCurveTo(64,40,82,48);c.lineTo(84,58);c.quadraticCurveTo(78,64,74,56);c.quadraticCurveTo(64,66,56,56);c.quadraticCurveTo(50,64,45,58);c.closePath();c.fill();ell(c,64,42,7,6,'#e8303a');},
  cupcake:c=>{c.fillStyle='#ff8ac0';c.beginPath();c.moveTo(38,66);c.lineTo(90,66);c.lineTo(82,110);c.lineTo(46,110);c.closePath();c.fill();c.strokeStyle='rgba(255,255,255,.6)';c.lineWidth=2;for(let i=0;i<5;i++){c.beginPath();c.moveTo(44+i*10,68);c.lineTo(48+i*8,108);c.stroke();}c.fillStyle='#fff6ea';[[64,30,14],[50,50,16],[78,50,16],[64,58,18]].forEach(([x,y,r])=>{c.beginPath();c.arc(x,y,r,0,7);c.fill();});ell(c,64,18,7,7,'#e8303a');['#5ac0ff','#ffe04a'].forEach((col,i)=>{c.fillStyle=col;c.fillRect(52+i*18,44,6,3);});},
  parfait:c=>glass(c,'#ff9ac8',{ice:0,lv:40,layer:'#fff0c0',garnish:'cream'}),
  crepe:c=>{c.fillStyle='#f6d090';c.beginPath();c.moveTo(42,112);c.lineTo(20,44);c.quadraticCurveTo(64,20,108,44);c.closePath();c.fill();c.fillStyle='#fff6ea';[[40,40,14],[60,30,14],[82,36,14]].forEach(([x,y,r])=>{c.beginPath();c.arc(x,y,r,0,7);c.fill();});ell(c,48,30,7,6,'#ff3a4a');ell(c,74,28,7,6,'#ff3a4a');c.fillStyle='#ffe04a';rr(c,58,40,12,8,3);c.fill();c.fillStyle='#fff';c.globalAlpha=.4;c.beginPath();c.moveTo(42,112);c.lineTo(30,52);c.lineTo(46,50);c.closePath();c.fill();c.globalAlpha=1;},
  mochi:c=>{plate(c);[[44,'#ffc8dc'],[64,'#ffffff'],[84,'#b8e6a8']].forEach(([x,col],i)=>{const y=72-(i==1?8:0);ell(c,x,y,17,14,col);hi(c,x-8,y-8,4,6);});c.fillStyle='#5a3020';c.fillRect(30,94,68,4);},
  chocobox:c=>{c.fillStyle='#5a3020';rr(c,16,52,96,56,8);c.fill();c.fillStyle='#ffd24a';c.fillRect(16,52,96,6);for(let i=0;i<3;i++)for(let j=0;j<2;j++){ell(c,34+i*30,70+j*22,11,9,'#3a1e10');ell(c,32+i*30,67+j*22,3,2,'rgba(255,255,255,.35)');}c.fillStyle='#e8303a';c.fillRect(60,48,8,64);c.beginPath();c.moveTo(64,50);c.quadraticCurveTo(44,30,50,46);c.quadraticCurveTo(54,54,64,50);c.quadraticCurveTo(84,30,78,46);c.quadraticCurveTo(74,54,64,50);c.fill();},
  // drinks
  water:c=>bottle(c,'#9ad8ff',{cap:'#3a8ad8',label:'#ffffff',mark:'#5ab4ff'}),
  juice:c=>glass(c,'#ff9a1e',{straw:'#ffffff',garnish:'orange'}),
  applejuice:c=>glass(c,'#f2c84a',{straw:'#7ae05a',garnish:'lime'}),
  lemonade:c=>glass(c,'#fff2a0',{straw:'#ffcf3a',garnish:'lemon'}),
  smoothie:c=>glass(c,'#ff6a9a',{ice:0,straw:'#ffffff',garnish:'cream'}),
  soda:c=>can(c,'#e8303a','#ffffff'),
  energy:c=>can(c,'#2e2c34','#7affc8'),
  milk:c=>{c.fillStyle=lg(c,36,0,92,0,'#ffffff','#dfe6ee');c.beginPath();c.moveTo(38,40);c.lineTo(64,24);c.lineTo(90,40);c.lineTo(90,112);c.lineTo(38,112);c.closePath();c.fill();c.fillStyle='#5ab4ff';c.fillRect(38,62,52,30);c.fillStyle='#fff';c.font='900 16px system-ui';c.textAlign='center';c.fillText('MILK',64,82);c.fillStyle='#dfe6ee';c.fillRect(54,14,20,14);},
  // coffee & tea
  coffee:c=>mug(c,'#6a3a1e'),
  latte:c=>mug(c,'#c8925a',{foam:'#fff6ea',cup:'#ffd8a8'}),
  icecoffee:c=>glass(c,'#7a4a2a',{straw:'#2e2c34',layer:'#e8d2b0'}),
  matcha:c=>mug(c,'#7ac25a',{foam:'#c8eaa8',cup:'#3a3840'}),
  greentea:c=>{c.fillStyle=lg(c,36,0,92,0,'#cfe6c0','#9ac08a');c.beginPath();c.moveTo(36,56);c.lineTo(92,56);c.lineTo(86,108);c.lineTo(42,108);c.closePath();c.fill();ell(c,64,56,28,8,'#cfe6c0');ell(c,64,57,24,6,'#b8d860');c.fillStyle='rgba(60,90,40,.35)';c.fillRect(38,78,52,4);hi(c,42,64,4,30);steam(c);ell(c,64,110,26,4,'rgba(0,0,0,.12)');},
  blacktea:c=>mug(c,'#b8582a',{cup:'#f6f0e6',band:'#4a6aa8'}),
  hotchoc:c=>mug(c,'#5a3020',{foam:'#fff6ea',cup:'#e8303a'}),
  // bubble tea
  boba_milk:c=>boba(c,'#e8c8a0'),
  boba_taro:c=>boba(c,'#c8a8f0',{straw:'#7a5ae8'}),
  boba_matcha:c=>boba(c,'#a8d880',{straw:'#3aa040'}),
  boba_brown:c=>boba(c,'#f2e2c8',{swirl:'#a8602a',straw:'#5a3020'}),
  boba_mango:c=>boba(c,'#ffc040',{straw:'#ff7a1e',pearl:'#fff6c0'}),
  boba_straw:c=>boba(c,'#ffb8d0',{straw:'#e8303a',swirl:'#ff6a8a'}),
  // bar
  wine:c=>stem(c,'#8a1a2a'),
  whiskey:c=>{c.fillStyle='rgba(225,240,255,.6)';rr(c,30,48,68,62,8);c.fill();c.fillStyle=lg(c,0,66,0,104,'#f2a040','#b86a1e');rr(c,34,66,60,40,6);c.fill();c.fillStyle='rgba(255,255,255,.6)';rr(c,44,58,22,20,4);c.fill();rr(c,62,64,20,18,4);c.fill();hi(c,36,56,4,40);ell(c,64,112,32,4,'rgba(0,0,0,.12)');},
  cocktail:c=>stem(c,'#ff6aa8',{coupe:1,cherry:1,garnish:'#ffcf3a'}),
  beer:c=>{c.fillStyle='rgba(225,240,255,.6)';rr(c,34,28,56,84,8);c.fill();c.fillStyle=lg(c,0,40,0,110,'#ffd24a','#e89a1e');rr(c,36,44,52,64,6);c.fill();c.fillStyle='#fffaf0';[[42,36,10],[56,30,12],[72,32,11],[84,38,8],[62,42,12]].forEach(([x,y,r])=>{c.beginPath();c.arc(x,y,r,0,7);c.fill();});c.beginPath();c.ellipse(96,70,10,20,0,-1.5,1.5);c.lineWidth=6;c.strokeStyle='rgba(225,240,255,.8)';c.stroke();for(let i=0;i<6;i++)ell(c,46+i*7,96-((i*13)%40),1.6,1.6,'rgba(255,255,255,.7)');hi(c,40,48,4,50);},
  sake:c=>{bottle(c,'#f6f0e6',{cap:'#d8403a',label:'#d8403a',mark:'#ffffff'});ell(c,100,100,14,6,'#f6f0e6');c.fillStyle='#f6f0e6';c.fillRect(86,88,28,12);ell(c,100,88,14,5,'#d8c8a8');},
 };
 const C={};
 function img(k){if(C[k])return C[k];if(!P[k])return null;const SS=2,cv=document.createElement('canvas');cv.width=cv.height=S*SS;const c=cv.getContext('2d');c.scale(SS,SS);c.lineJoin='round';P[k](c);
  // sticker outline: dilate the silhouette in a dark colour behind the art
  const out=document.createElement('canvas');out.width=out.height=S*SS+12;const o=out.getContext('2d');const m=document.createElement('canvas');m.width=m.height=S*SS;const mc=m.getContext('2d');mc.drawImage(cv,0,0);mc.globalCompositeOperation='source-in';mc.fillStyle=OL;mc.fillRect(0,0,S*SS,S*SS);
  for(let a=0;a<16;a++){const dx=Math.cos(a/16*Math.PI*2)*5,dy=Math.sin(a/16*Math.PI*2)*5;o.drawImage(m,6+dx,6+dy);}o.drawImage(cv,6,6);
  const I=new Image();I.src=out.toDataURL();C[k]=I;return I;}
 return{img,has:k=>!!P[k],keys:Object.keys(P)};})();
