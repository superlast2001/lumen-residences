'use strict';
// Lumen Residences — the user's DEFAULT APARTMENT shell (v0.3.2), redrawn in code on the tile grid to match their art:
// orange walls with a white top edge and dark outline, dark grey skirting, glossy cream square floor tiles with window light
// patches, sliding balcony glass doors with yellow curtains and a sea view on the back-left wall, a white wall AC on the
// notch wall, a glass front door on the back-right wall, and a blue-grey tiled bathroom in the front-right corner with a
// see-through glass partition, a tiled shower wall and the built-in glass shower (furnart.js shower_glass).
// Static parts are painted once into a cache; partitions/low walls are depth-sorted entities so nobody phases through them.
const APT={cv:null,key:''},AS=2;
const AC_={wallL:['#f8a62a','#ee9118'],wallR:['#f09a20','#e2830f'],base:'#4b4a52',baseHi:'#77757f',ol:'#34323a',slabL:'#f29a22',slabR:'#e0820f',
 tile:'#f8f0e6',grout:'rgba(176,150,124,.42)',btile:'#b6c6d9',bgrout:'rgba(86,106,138,.42)'};
// back walls that stand tall: L-type (u-line, faces +u) and R-type (v-line, faces +v) edges with no floor behind them
function aptTall(G){const L=[];for(let u=0;u<G.cols;u++)for(let v=0;v<G.rows;v++){if(!G.floor(u,v))continue;
  if(!G.floor(u-1,v)&&u<=3)L.push({side:'L',line:u,s:v});if(!G.floor(u,v-1)&&v<=2)L.push({side:'R',line:v,s:u});}return L;}
// a point on a wall plane: s along the wall (tile units), h up (px)
function aptWP(G,side,line,s,h){const p=side=='L'?G.pt(line,s):G.pt(s,line);return[p[0],p[1]-h];}
// draw in wall-local coords: x along the wall in tiles from s0 (L walls run from v=s0+W at screen-left... we keep s increasing), y = height px (up)
function onWall(c,G,side,line,s0,fn){const o=aptWP(G,side,line,s0,0),e=aptWP(G,side,line,s0+1,0);c.save();c.transform(e[0]-o[0],e[1]-o[1],0,-1,o[0],o[1]);fn(c);c.restore();}
function aptSky(c,night,W,y0,y1){const g=c.createLinearGradient(0,y1,0,y0);g.addColorStop(0,night?'#1a2050':'#58b4ee');g.addColorStop(1,night?'#3d3a78':'#c4e8ff');return g;}
function buildApt(R,G,night){const cv=document.createElement('canvas');cv.width=Math.ceil(SC.W*AS);cv.height=Math.ceil(SC.H*AS);const c=cv.getContext('2d');c.scale(AS,AS);c.lineJoin='round';
 const P=G.pt,F=(u,v)=>G.floor(u,v),WH=R.WH,D=34;
 // 1) floor slab sides along the open front edges
 for(let u=0;u<G.cols;u++)for(let v=0;v<G.rows;v++){if(!F(u,v))continue;
  if(!F(u+1,v)){const a=P(u+1,v),b=P(u+1,v+1);poly(c,[a,b,[b[0],b[1]+D],[a[0],a[1]+D]]);c.fillStyle=AC_.slabR;c.fill();}
  if(!F(u,v+1)){const a=P(u,v+1),b=P(u+1,v+1);poly(c,[a,b,[b[0],b[1]+D],[a[0],a[1]+D]]);const gr=c.createLinearGradient(0,a[1],0,a[1]+D);gr.addColorStop(0,AC_.slabL);gr.addColorStop(1,'#e88d18');c.fillStyle=gr;c.fill();}}
 // slab outlines + dark top edge
 c.strokeStyle=AC_.ol;c.lineWidth=2;for(let u=0;u<G.cols;u++)for(let v=0;v<G.rows;v++){if(!F(u,v))continue;
  if(!F(u+1,v)){const a=P(u+1,v),b=P(u+1,v+1);c.beginPath();c.moveTo(...a);c.lineTo(...b);c.stroke();c.lineWidth=1.2;c.beginPath();c.moveTo(b[0],b[1]+D);c.lineTo(a[0],a[1]+D);c.stroke();c.lineWidth=2;}
  if(!F(u,v+1)){const a=P(u,v+1),b=P(u+1,v+1);c.lineWidth=3;c.strokeStyle=AC_.base;c.beginPath();c.moveTo(...a);c.lineTo(...b);c.stroke();c.lineWidth=1.2;c.strokeStyle=AC_.ol;c.beginPath();c.moveTo(a[0],a[1]+D);c.lineTo(b[0],b[1]+D);c.stroke();c.lineWidth=2;}}
 // 2) floor tiles: glossy cream squares (living) and small blue-grey tiles (bathroom)
 for(let u=0;u<G.cols;u++)for(let v=0;v<G.rows;v++){if(!F(u,v))continue;const bath=(R.zones[G.zone[u][v]]||{}).floor=='blue';poly(c,tileQuad(G,u,v));
  const k=((u*7+v*13)%5)/5;c.fillStyle=bath?shade(AC_.btile,(k-.5)*.06):shade(AC_.tile,(k-.5)*.03);c.fill();
  c.strokeStyle=bath?AC_.bgrout:AC_.grout;c.lineWidth=bath?.8:1;c.stroke();
  if(bath){c.beginPath();const m1=P(u+.5,v),m2=P(u+.5,v+1),m3=P(u,v+.5),m4=P(u+1,v+.5);c.moveTo(...m1);c.lineTo(...m2);c.moveTo(...m3);c.lineTo(...m4);c.stroke();}}
 // gloss + light, clipped to the floor
 c.save();c.beginPath();for(let u=0;u<G.cols;u++)for(let v=0;v<G.rows;v++)if(F(u,v)){const q=tileQuad(G,u,v);c.moveTo(...q[0]);q.slice(1).forEach(p=>c.lineTo(...p));c.closePath();}c.clip();
 // ambient occlusion along the back walls
 aptTall(G).forEach(w=>{const a=w.side=='L'?P(w.line,w.s):P(w.s,w.line),b=w.side=='L'?P(w.line,w.s+1):P(w.s+1,w.line),off=w.side=='L'?G.eu:G.ev,k=.7;
  const q=[a,b,[b[0]+off[0]*k,b[1]+off[1]*k],[a[0]+off[0]*k,a[1]+off[1]*k]],gr=c.createLinearGradient(a[0],a[1],a[0]+off[0]*k,a[1]+off[1]*k);gr.addColorStop(0,'rgba(150,80,20,.20)');gr.addColorStop(1,'rgba(150,80,20,0)');poly(c,q);c.fillStyle=gr;c.fill();});
 if(!night){// sunlight through the balcony glass (3 panels) and the front door glass
  const B=R.balcony,pw=(B.v1-B.v0)/3;for(let i=0;i<3;i++){const va=B.v0+i*pw+.12,vb=B.v0+(i+1)*pw-.12,L=3.4,sk=.55;
   const q=[P(0,va),P(0,vb),P(L,vb+L*sk),P(L,va+L*sk)],gr=c.createLinearGradient(...P(0,(va+vb)/2),...P(L,(va+vb)/2+L*sk));gr.addColorStop(0,'rgba(255,250,232,.62)');gr.addColorStop(1,'rgba(255,250,232,0)');poly(c,q);c.fillStyle=gr;c.fill();}
  const E=R.entry,u0=E.t[0];const q=[P(u0+.18,0),P(u0+.82,0),P(u0+.82+.5,2.4),P(u0+.18+.5,2.4)],gr=c.createLinearGradient(...P(u0+.5,0),...P(u0+.9,2.4));gr.addColorStop(0,'rgba(220,240,255,.45)');gr.addColorStop(1,'rgba(220,240,255,0)');poly(c,q);c.fillStyle=gr;c.fill();}
 // glossy sheen: soft diagonal reflection bands across the cream tiles
 c.save();c.globalCompositeOperation='screen';const ctr=P(G.cols*.42,G.rows*.45);for(let i=-3;i<=3;i++){const x=ctr[0]+i*120;const gr=c.createLinearGradient(x-50,0,x+50,0);gr.addColorStop(0,'rgba(255,255,255,0)');gr.addColorStop(.5,`rgba(255,255,255,${night?.05:.13})`);gr.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=gr;c.save();c.translate(x,ctr[1]);c.rotate(-.45);c.fillRect(-50,-700,100,1400);c.restore();}c.restore();
 if(night){c.fillStyle='rgba(30,30,80,.32)';c.fillRect(-100,-100,SC.W+200,SC.H+200);const lp=P(G.cols*.55,G.rows*.5),gr=c.createRadialGradient(lp[0],lp[1],10,lp[0],lp[1],420);gr.addColorStop(0,'rgba(255,214,150,.22)');gr.addColorStop(1,'rgba(255,214,150,0)');c.fillStyle=gr;c.fillRect(lp[0]-420,lp[1]-420,840,840);}
 c.restore();
 // floor drain in the bathroom
 {const d=P(12.5,9.7);c.save();c.translate(d[0],d[1]);c.scale(1,.5);c.rotate(Math.PI/4);c.fillStyle='#8a96a6';c.fillRect(-7,-7,14,14);c.strokeStyle='#4f5868';c.lineWidth=1.4;c.strokeRect(-7,-7,14,14);for(let i=-4;i<=4;i+=2.6){c.beginPath();c.moveTo(-5,i);c.lineTo(5,i);c.stroke();}c.restore();}
 // 3) tall back walls
 const T=aptTall(G);
 T.forEach(w=>{const a=aptWP(G,w.side,w.line,w.s,0),b=aptWP(G,w.side,w.line,w.s+1,0),col=w.side=='L'?AC_.wallL:AC_.wallR;poly(c,[a,b,[b[0],b[1]-WH],[a[0],a[1]-WH]]);
  const gr=c.createLinearGradient(0,a[1]-WH,0,a[1]);gr.addColorStop(0,shade(col[0],.06));gr.addColorStop(1,col[1]);c.fillStyle=gr;c.fill();c.strokeStyle=col[1];c.lineWidth=1;c.stroke();});
 // night: walls dim a little
 if(night)T.forEach(w=>{const a=aptWP(G,w.side,w.line,w.s,0),b=aptWP(G,w.side,w.line,w.s+1,0);poly(c,[a,b,[b[0],b[1]-WH],[a[0],a[1]-WH]]);c.fillStyle='rgba(40,30,80,.28)';c.fill();});
 // balcony doors + curtains, AC, front door
 aptBalcony(c,G,R,night);aptAC(c,G,R);aptDoor(c,G,R,night);
 // skirting
 T.forEach(w=>{const a=aptWP(G,w.side,w.line,w.s,0),b=aptWP(G,w.side,w.line,w.s+1,0);if(w.side=='L'&&w.line==0&&w.s>=R.balcony.v0&&w.s<R.balcony.v1)return;if(w.side=='R'&&w.line==0&&w.s==R.entry.t[0])return;
  poly(c,[a,b,[b[0],b[1]-10],[a[0],a[1]-10]]);c.fillStyle=AC_.base;c.fill();c.strokeStyle=AC_.baseHi;c.lineWidth=1;c.beginPath();c.moveTo(a[0],a[1]-10);c.lineTo(b[0],b[1]-10);c.stroke();});
 // concave corners: a soft vertical crease
 T.forEach(w=>{const a=aptWP(G,w.side,w.line,w.s,0);const other=T.find(o=>o.side!=w.side&&((w.side=='L'&&o.line==w.s&&o.s==w.line)));if(other){c.strokeStyle='rgba(170,90,10,.55)';c.lineWidth=1.4;c.beginPath();c.moveTo(...a);c.lineTo(a[0],a[1]-WH);c.stroke();}});
 // wall tops: white cap with a dark outline (toward the outside), plus corner squares and exposed end faces
 const k=.13,capOf=w=>w.side=='L'?[-G.eu[0]*k,-G.eu[1]*k]:[-G.ev[0]*k,-G.ev[1]*k];
 T.forEach(w=>{const a=aptWP(G,w.side,w.line,w.s,WH),b=aptWP(G,w.side,w.line,w.s+1,WH),o=capOf(w);poly(c,[a,b,[b[0]+o[0],b[1]+o[1]],[a[0]+o[0],a[1]+o[1]]]);c.fillStyle='#ffffff';c.fill();});
 T.forEach(w=>{[w.s,w.s+1].forEach(s=>{const p=aptWP(G,w.side,w.line,s,WH),o1=[-G.eu[0]*k,-G.eu[1]*k],o2=[-G.ev[0]*k,-G.ev[1]*k];poly(c,[p,[p[0]+o1[0],p[1]+o1[1]],[p[0]+o1[0]+o2[0],p[1]+o1[1]+o2[1]],[p[0]+o2[0],p[1]+o2[1]]]);c.fillStyle='#fff';c.fill();});});
 c.strokeStyle=AC_.ol;c.lineWidth=1.6;T.forEach(w=>{const a=aptWP(G,w.side,w.line,w.s,WH),b=aptWP(G,w.side,w.line,w.s+1,WH),o=capOf(w);
  const inner=!T.some(q=>q!==w&&q.side==w.side&&q.line==w.line&&q.s==w.s+1);c.beginPath();c.moveTo(a[0]+o[0],a[1]+o[1]);c.lineTo(b[0]+o[0],b[1]+o[1]);c.stroke();
  c.lineWidth=1;c.strokeStyle='rgba(52,50,58,.5)';c.beginPath();c.moveTo(...a);c.lineTo(...b);c.stroke();c.lineWidth=1.6;c.strokeStyle=AC_.ol;});
 // exposed wall ends at the two front corners of the back walls
 [[ 'L',0,G.rows],[ 'R',0,G.cols]].forEach(([side,line,s])=>{const has=T.some(w=>w.side==side&&w.line==line&&w.s==s-1);if(!has)return;const a=aptWP(G,side,line,s,0),o=side=='L'?[-G.eu[0]*k,-G.eu[1]*k]:[-G.ev[0]*k,-G.ev[1]*k];
  poly(c,[a,[a[0]+o[0],a[1]+o[1]],[a[0]+o[0],a[1]+o[1]-WH],[a[0],a[1]-WH]]);c.fillStyle=side=='L'?'#d97a0c':'#c96e08';c.fill();c.strokeStyle=AC_.ol;c.lineWidth=1.6;c.stroke();});
 return cv;}
function aptBalcony(c,G,R,night){const B=R.balcony,W=B.v1-B.v0,WH=R.WH,h1=WH*.84;
 // L wall: s=v increases toward screen-left. Local x runs from v0 (screen-right end) to v1.
 onWall(c,G,'L',0,B.v0,c=>{const x0=.08,x1=W-.08,y0=6;
  c.save();c.beginPath();c.rect(x0,y0,x1-x0,h1-y0);c.clip();
  c.fillStyle=aptSky(c,night,W,y0,h1);c.fillRect(x0,y0,x1-x0,h1-y0);
  if(!night){c.fillStyle='rgba(255,255,255,.9)';[[1.1,104,.5,9],[1.5,110,.4,7],[3.6,98,.6,10],[4.1,104,.35,7],[5.3,112,.4,8]].forEach(([x,y,rx,ry])=>{c.beginPath();c.ellipse(x,y,rx,ry,0,0,7);c.fill();});}
  else{c.fillStyle='#fff8d8';c.beginPath();c.arc(4.6,108,.0001,0,7);c.fill();c.save();c.translate(4.6,108);c.scale(.12,6);c.beginPath();c.arc(0,0,1,0,7);c.restore();c.fill();
   c.fillStyle='rgba(255,255,255,.8)';for(let i=0;i<14;i++){c.fillRect(.3+((i*37)%55)/10,70+((i*53)%45),.02,1.2);}}
  // sea + horizon, then the balcony floor and railing
  c.fillStyle=night?'#1e3566':'#3d9ad6';c.fillRect(x0,46,x1-x0,22);c.fillStyle=night?'rgba(150,180,255,.25)':'rgba(255,255,255,.45)';for(let i=0;i<9;i++)c.fillRect(.3+i*.62,52+((i*7)%10),.28,1.2);
  c.fillStyle=night?'#4a4a62':'#e7e3dc';c.fillRect(x0,y0,x1-x0,40);c.fillStyle=night?'#3a3a52':'#d2cdc4';for(let i=0;i<6;i++)c.fillRect(x0,y0+4+i*6,x1-x0,1);
  c.strokeStyle='#2e2c34';c.lineWidth=.035;for(let x=.2;x<W;x+=.22){c.beginPath();c.moveTo(x,y0+8);c.lineTo(x,y0+48);c.stroke();}
  c.fillStyle='#2e2c34';c.fillRect(x0,y0+46,x1-x0,3.2);c.fillRect(x0,y0+12,x1-x0,1.6);
  // a green bush at the left end of the view
  const leaf=night?['#2a5a3a','#3a704a']:['#3f9a4a','#6cc860'];for(let i=0;i<9;i++){c.fillStyle=leaf[i%2];c.beginPath();c.ellipse(W-.55+((i*13)%7)/14-.2,y0+16+((i*29)%30),.28,11,0,0,7);c.fill();}
  // glass reflection streaks
  c.fillStyle=night?'rgba(255,255,255,.08)':'rgba(255,255,255,.28)';for(let p=0;p<3;p++){const px=x0+p*(W/3);c.beginPath();c.moveTo(px+.25,y0);c.lineTo(px+.45,y0);c.lineTo(px+.95,h1);c.lineTo(px+.75,h1);c.fill();}
  c.restore();
  // frame: outer, bottom track, mullions between the 3 sliding panels
  c.strokeStyle='#5c5a64';c.lineWidth=.06;c.strokeRect(x0,y0,x1-x0,h1-y0);c.lineWidth=.045;for(let p=1;p<3;p++){const px=x0+p*(x1-x0)/3;c.beginPath();c.moveTo(px,y0);c.lineTo(px,h1);c.stroke();}
  c.fillStyle='#5c5a64';c.fillRect(x0-.04,0,x1-x0+.08,y0+1);c.fillStyle='#8c8a94';c.fillRect(x0,y0,x1-x0,1.2);
  // curtain rod + yellow curtains gathered at both ends
  c.fillStyle='#d8b060';c.fillRect(-.3,h1+12,W+.6,2.2);[[-.3],[W+.3]].forEach(([x])=>{c.beginPath();c.arc(x,h1+13,.06,0,7);c.save();c.translate(x,h1+13);c.scale(.07,3);c.beginPath();c.arc(0,0,1,0,7);c.restore();c.fill();});
  const cur=(xa,xb,dir)=>{const top=h1+12,wst=WH*.42;c.beginPath();c.moveTo(xa,top);c.lineTo(xb,top);c.quadraticCurveTo(xb-dir*.02,wst+18,xb-dir*.22,wst);c.quadraticCurveTo(xb-dir*.12,wst-24,xb+dir*.05,2);c.lineTo(xa,2);c.closePath();
   const gr=c.createLinearGradient(xa,0,xb,0);gr.addColorStop(0,night?'#c8b070':'#fbe7a6');gr.addColorStop(.5,night?'#d8c080':'#fff2c4');gr.addColorStop(1,night?'#b89a58':'#efcf78');c.fillStyle=gr;c.fill();c.strokeStyle='rgba(150,110,40,.75)';c.lineWidth=.02;c.stroke();
   c.strokeStyle='rgba(200,150,60,.55)';c.lineWidth=.018;for(let i=1;i<4;i++){const x=xa+(xb-xa)*i/4;c.beginPath();c.moveTo(x,top);c.quadraticCurveTo(x+dir*.02,wst+10,x-dir*.04*(i),wst);c.lineTo(x+dir*.03,4);c.stroke();}
   c.fillStyle='#e0b050';c.fillRect(Math.min(xa,xb-dir*.22)-.02,wst-3,Math.abs(xb-dir*.22-xa)+.04,5);};
  cur(-.28,.42,1);cur(W+.28,W-.42,-1);});}
function aptAC(c,G,R){const A=R.ac,WH=R.WH;onWall(c,G,A.side,A.line,A.v0,c=>{const W=A.v1-A.v0,x0=W*.18,x1=W*.82,y0=WH*.7,y1=WH*.86;
  c.fillStyle='rgba(120,60,10,.22)';c.fillRect(x0+.03,y0-4,x1-x0,y1-y0);
  const gr=c.createLinearGradient(0,y0,0,y1);gr.addColorStop(0,'#e9ecf0');gr.addColorStop(1,'#ffffff');c.fillStyle=gr;c.beginPath();c.roundRect(x0,y0,x1-x0,y1-y0,3);c.fill();c.strokeStyle='#3a3840';c.lineWidth=.025;c.stroke();
  c.fillStyle='#c9ced6';c.fillRect(x0+.05,y0+2,x1-x0-.1,4);c.strokeStyle='#9aa0aa';c.lineWidth=.012;for(let i=0;i<5;i++){c.beginPath();c.moveTo(x0+.06,y0+3+i*.8);c.lineTo(x1-.06,y0+3+i*.8);c.stroke();}
  c.fillStyle='#5ad07a';c.fillRect(x1-.16,y0+10,.04,1.6);c.fillStyle='#b8bec8';c.fillRect(x0+.08,y1-5,.3,1.2);});}
function aptDoor(c,G,R,night){const E=R.entry,WH=R.WH;onWall(c,G,'R',0,E.t[0],c=>{const x0=.16,x1=.84,h=WH*.8;
  c.fillStyle='rgba(60,30,10,.25)';c.fillRect(x0-.05,0,x1-x0+.1,h+5);
  c.fillStyle='#4e4c56';c.fillRect(x0-.04,0,x1-x0+.08,h+4);
  const gr=c.createLinearGradient(x0,0,x1,0);gr.addColorStop(0,night?'#3a4a78':'#9fd0ee');gr.addColorStop(.5,night?'#5a6a98':'#d6eefc');gr.addColorStop(1,night?'#2e3a66':'#86bfe4');c.fillStyle=gr;c.fillRect(x0+.03,3,x1-x0-.06,h-6);
  // warm sunlight glow at the bottom of the glass (as in the art)
  if(!night){const g2=c.createLinearGradient(0,3,0,h*.5);g2.addColorStop(0,'rgba(255,214,140,.75)');g2.addColorStop(1,'rgba(255,214,140,0)');c.fillStyle=g2;c.fillRect(x0+.03,3,x1-x0-.06,h*.5);}
  c.fillStyle='rgba(255,255,255,.45)';c.beginPath();c.moveTo(x0+.12,h-6);c.lineTo(x0+.2,h-6);c.lineTo(x0+.38,3);c.lineTo(x0+.3,3);c.fill();
  c.fillStyle='#2e2c34';c.fillRect(x1-.13,h*.42,.035,h*.14);c.fillStyle='#d8dee6';c.fillRect(x1-.125,h*.43,.025,h*.12);
  // light switch beside the door
  c.fillStyle='#ffffff';c.fillRect(1.04,h*.52,.12,12);c.strokeStyle='#8a8892';c.lineWidth=.012;c.strokeRect(1.04,h*.52,.12,12);c.fillStyle='#cfd3da';c.fillRect(1.08,h*.52+4,.04,4);});}
function drawAptShell(g,time){const R=SC.R,G=SC.G,night=nightF()>.5?1:0,key=SC.n+'|'+night+'|'+SC.W;
 g.fillStyle=night?'#262233':R.theme.bg;g.fillRect(-2000,-2000,SC.W+4000,SC.H+4000);
 if(APT.key!=key||!APT.cv){APT.key=key;APT.cv=buildApt(R,G,night);}
 g.imageSmoothingQuality='high';g.drawImage(APT.cv,0,0,SC.W,SC.H);}
// interior partitions as depth-sorted entities: low dark walls with door posts, the tall glass partition and the tiled shower wall
function aptWalls(G,R){const E=[],LH=24,WH=R.WH;
 const low=(p0,p1,depth)=>E.push({depth,d:g=>{poly(g,[p0,p1,[p1[0],p1[1]-LH],[p0[0],p0[1]-LH]]);const gr=g.createLinearGradient(0,p0[1]-LH,0,p0[1]);gr.addColorStop(0,'#6e6c76');gr.addColorStop(1,'#4a4852');g.fillStyle=gr;g.fill();
   poly(g,[[p0[0],p0[1]-LH],[p1[0],p1[1]-LH],[p1[0],p1[1]-LH-4],[p0[0],p0[1]-LH-4]]);g.fillStyle='#8c8a94';g.fill();g.strokeStyle='#2e2c34';g.lineWidth=1.2;g.stroke();}});
 const post=(p,depth)=>E.push({depth,d:g=>{g.fillStyle='#4a4852';g.fillRect(p[0]-3.5,p[1]-LH-14,7,LH+14);g.fillStyle='#8c8a94';g.fillRect(p[0]-3.5,p[1]-LH-16,7,3);g.strokeStyle='#2e2c34';g.lineWidth=1;g.strokeRect(p[0]-3.5,p[1]-LH-16,7,LH+16);}});
 const tall=R.tall||[];
 for(let u=1;u<G.cols;u++)for(let v=0;v<G.rows;v++){const a=G.floor(u-1,v),b=G.floor(u,v);if(!b)continue;const p0=G.pt(u,v+1),p1=G.pt(u,v),dep=u+v+.5+.02;
  if(a&&G.zone[u-1][v]!=G.zone[u][v]){if(G.door.has(G.ek(u-1,v,u,v))){post(p0,dep);post(p1,dep);}else low(p0,p1,dep);}else if(!a&&u>3)low(p0,p1,dep);}
 for(let v=1;v<G.rows;v++)for(let u=0;u<G.cols;u++){const a=G.floor(u,v-1),b=G.floor(u,v);if(!b)continue;const p0=G.pt(u,v),p1=G.pt(u+1,v),dep=u+.5+v+.02;
  if(a&&G.zone[u][v-1]!=G.zone[u][v]){const T=tall.find(t=>t.v==v&&u>=t.u0&&u<t.u1);if(T)E.push({depth:dep,d:g=>tallSeg(g,G,u,v,T,WH)});else if(G.door.has(G.ek(u,v-1,u,v))){post(p0,dep);post(p1,dep);}else low(p0,p1,dep);}
  else if(!a&&v>2)low(p0,p1,dep);}
 return E;}
function tallSeg(g,G,u,v,T,WH){const a=G.pt(u,v),b=G.pt(u+1,v),Q=(s,h)=>[a[0]+(b[0]-a[0])*s,a[1]+(b[1]-a[1])*s-h];
 if(T.kind=='tile'){poly(g,[Q(0,0),Q(1,0),Q(1,WH),Q(0,WH)]);const gr=g.createLinearGradient(0,a[1]-WH,0,a[1]);gr.addColorStop(0,'#f4f8fc');gr.addColorStop(1,'#d6e2ee');g.fillStyle=gr;g.fill();
  g.strokeStyle='rgba(120,140,170,.5)';g.lineWidth=.8;for(let i=1;i<3;i++){g.beginPath();g.moveTo(...Q(i/3,0));g.lineTo(...Q(i/3,WH));g.stroke();}for(let h=16;h<WH;h+=16){g.beginPath();g.moveTo(...Q(0,h));g.lineTo(...Q(1,h));g.stroke();}
  g.fillStyle='rgba(255,255,255,.35)';poly(g,[Q(.1,WH-6),Q(.3,WH-6),Q(.2,20),Q(.05,20)]);g.fill();}
 else{poly(g,[Q(0,8),Q(1,8),Q(1,WH-6),Q(0,WH-6)]);g.fillStyle='rgba(200,230,250,.24)';g.fill();g.fillStyle='rgba(255,255,255,.42)';poly(g,[Q(.18,WH-8),Q(.3,WH-8),Q(.14,10),Q(.04,10)]);g.fill();poly(g,[Q(.38,WH-8),Q(.42,WH-8),Q(.3,10),Q(.26,10)]);g.fill();
  poly(g,[Q(0,0),Q(1,0),Q(1,8),Q(0,8)]);g.fillStyle='#5c5a64';g.fill();}
 poly(g,[Q(0,WH-6),Q(1,WH-6),Q(1,WH),Q(0,WH)]);g.fillStyle='#5c5a64';g.fill();g.strokeStyle='#2e2c34';g.lineWidth=1;g.stroke();
 [0,1].forEach(s=>{if(s==0&&u!=T.u0)return;const p=Q(s,0);g.fillStyle='#5c5a64';g.fillRect(p[0]-2.5,p[1]-WH,5,WH);g.strokeStyle='#2e2c34';g.strokeRect(p[0]-2.5,p[1]-WH,5,WH);});}
// ---------------- shower: timeline, water, steam, frosted glass, towel ----------------
const OPH_SHOWER=['approach','close','turnoff','shower_a','shower_b','shower_back','turnoff','open','exit'];
const OPH_AFTER=['shake','dry','towel','blush'];
function showerEl(t){return (t.useDur||12)-t.useT;}
// water runs from ~2s in until ~3.2s before the end
function showerWater(t){const el=showerEl(t),end=t.useDur||12;return Math.max(0,Math.min(1,(el-2)/.6,(end-3.2-el)/.6));}
function showerFog(t){const el=showerEl(t),end=t.useDur||12;const up=Math.max(0,Math.min(1,(el-2.4)/2.6)),down=Math.max(0,Math.min(1,(end-1.6-el)/1.6));return Math.min(up,down);}
// Ophion plays the frames from his bath sheet; others use their own front/back sprites
function showerFrame(t){const el=showerEl(t),end=t.useDur||12;
 if(t.n=='Ophion'){if(el<.8)return'shower_approach';if(el<1.6)return'shower_close';if(el<2.4)return'shower_turnoff';if(el<end-3.2){const k=Math.floor((el-2.4)/2.6)%3;return['shower_shower_a','shower_shower_b','shower_shower_back'][k];}
  if(el<end-2.4)return'shower_turnoff';if(el<end-1.6)return'shower_open';return'shower_exit';}
 if(el<1.2||el>end-1.2)return'chibi_back';const k=Math.floor((el-1.2)/2.2)%4;return['chibi_front','emote_happy','chibi_back','emote_smile'][k];}
// stepping in/out of the enclosure (lerp between the stand tile and the spot inside)
function showerStep(t){const el=showerEl(t),end=t.useDur||12;return Math.min(1,el/.7,(end-el)/.7);}
function showerPos(t){const U=t.U,k=Math.max(0,Math.min(1,showerStep(t))),s=SC.G.pt(t.fu,t.fv);return[s[0]+(U.draw[0]-s[0])*k,s[1]+(U.draw[1]-s[1])*k];}
function drawShowerFx(g,G,t,time){const U=t.U,f=U.f,r=f.r||0,KZ=G.eu[0]/45,P=(x,y,z)=>{const [a,b]=locToGrid(f.k,r,x,y),q=G.pt(f.u+a,f.v+b);return[q[0],q[1]-z*KZ];};
 const w=showerWater(t),fog=showerFog(t)*(t.n=='Ophion'?.62:.86);
 if(w>0){// rain from the head, falling to the tray, with splashes
  const head=P(.78,.5,122);g.save();g.lineCap='round';for(let i=0;i<16;i++){const ox=.45+((i*37)%11)/11*.8,oy=.3+((i*53)%13)/13*.9,fl=P(ox,oy,6),ph=(time*2.6+i*.37)%1;
   const x0=head[0]+(i%5-2)*2.2,y0=head[1]+4;const xa=x0+(fl[0]-x0)*ph,ya=y0+(fl[1]-y0)*ph,xb=x0+(fl[0]-x0)*Math.min(1,ph+.22),yb=y0+(fl[1]-y0)*Math.min(1,ph+.22);
   g.strokeStyle=`rgba(190,228,255,${.85*w})`;g.lineWidth=1.6;g.beginPath();g.moveTo(xa,ya);g.lineTo(xb,yb);g.stroke();
   if(ph>.78){g.fillStyle=`rgba(225,244,255,${.8*w})`;g.beginPath();g.ellipse(fl[0],fl[1]-1,3+ph*3,1.4,0,0,7);g.fill();}}
  g.restore();}
 // frosted glass on the two front panels: misting up from the bottom, droplets and a few clear trickles
 if(fog>0){[[P(.06,2,6),P(1.96,2,6),P(1.96,2,150),P(.06,2,150)],[P(2,.04,6),P(2,1.96,6),P(2,1.96,150),P(2,.04,150)]].forEach((q,i)=>{const gr=g.createLinearGradient(0,q[0][1],0,q[2][1]);
   gr.addColorStop(0,`rgba(246,250,255,${.9*fog})`);gr.addColorStop(.55,`rgba(240,247,255,${.78*fog})`);gr.addColorStop(1,`rgba(236,244,255,${.5*fog})`);poly(g,q);g.fillStyle=gr;g.fill();
   g.save();poly(g,q);g.clip();g.strokeStyle=`rgba(170,205,235,${.55*fog})`;g.lineWidth=1.3;for(let j=0;j<5;j++){const s=.14+j*.17+i*.05,x=q[0][0]+(q[1][0]-q[0][0])*s,y=q[0][1]+(q[1][1]-q[0][1])*s,len=40+((j*41)%60),dr=(time*14+j*23)%60;
    g.beginPath();g.moveTo(x,y-140+dr*.6);g.quadraticCurveTo(x+2,y-110+dr,x,y-140+len+dr);g.stroke();}
   g.fillStyle=`rgba(255,255,255,${.75*fog})`;for(let j=0;j<22;j++){const s=((j*29)%97)/97,h=10+((j*61)%130),x=q[0][0]+(q[1][0]-q[0][0])*s,y=q[0][1]+(q[1][1]-q[0][1])*s-h;g.beginPath();g.arc(x,y,1.3,0,7);g.fill();}g.restore();});}
 // steam puffs rising out of the top
 const st=Math.max(fog,w*.6);if(st>0){for(let i=0;i<7;i++){const ph=(time*.32+i/7)%1,base=P(.5+((i*3)%5)*.25,.6+((i*7)%4)*.3,150),x=base[0]+Math.sin(time*1.4+i)*8,y=base[1]-ph*70,rad=10+ph*22,a=st*.5*(1-ph);
   const gr=g.createRadialGradient(x,y,1,x,y,rad);gr.addColorStop(0,`rgba(255,255,255,${a})`);gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.beginPath();g.arc(x,y,rad,0,7);g.fill();}}}
// after the shower: towel draped on the shoulders, rising steam and a sparkle (Ophion plays his after-shower frames instead)
function drawTowel(g,t,x,y,w,h,time){const k=Math.min(1,t.towel/1.2),hy=y-h*.56;g.save();g.globalAlpha=Math.min(1,t.towel*2);
 g.beginPath();g.moveTo(x-w*.28,hy+h*.02);g.quadraticCurveTo(x,hy+h*.12,x+w*.28,hy+h*.02);g.lineTo(x+w*.24,hy+h*.18);g.quadraticCurveTo(x+w*.2,hy+h*.22,x+w*.15,hy+h*.18);g.quadraticCurveTo(x,hy+h*.06,x-w*.15,hy+h*.18);g.quadraticCurveTo(x-w*.2,hy+h*.22,x-w*.24,hy+h*.18);g.closePath();
 const gr=g.createLinearGradient(0,hy,0,hy+h*.22);gr.addColorStop(0,'#ffffff');gr.addColorStop(1,'#d6e8f6');g.fillStyle=gr;g.fill();g.strokeStyle='#35202a';g.lineWidth=1.6;g.stroke();
 g.strokeStyle='#7ab8e8';g.lineWidth=2;g.beginPath();g.moveTo(x-w*.235,hy+h*.15);g.lineTo(x-w*.155,hy+h*.15);g.moveTo(x+w*.155,hy+h*.15);g.lineTo(x+w*.235,hy+h*.15);g.stroke();
 for(let i=0;i<3;i++){const ph=(time*.6+i/3)%1,sx=x+(i-1)*w*.18+Math.sin(time*2+i)*3,sy=y-h*(1.0+ph*.35),rad=4+ph*8;const sg=g.createRadialGradient(sx,sy,1,sx,sy,rad);sg.addColorStop(0,`rgba(255,255,255,${.6*(1-ph)*k})`);sg.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=sg;g.beginPath();g.arc(sx,sy,rad,0,7);g.fill();}
 g.restore();}
