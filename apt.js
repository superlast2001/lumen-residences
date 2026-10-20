'use strict';
// Lumen Residences — the user's DEFAULT APARTMENT shell, redrawn in code on the tile grid to match their art (v0.3.2), grown into a
// multi-room flat in v0.3.3: orange walls with a white top edge and dark outline, dark grey skirting, glossy cream floor tiles, a
// glass front door and wall AC on the back walls, an open balcony with decking, glass railing and a sea view behind yellow-curtained
// glass sliding doors, cut-away interior walls between the rooms (each room has its own floor: cream tiles, kitchen checks, honey
// and walnut planks, blue bathroom tiles), and the walk-in glass shower against a tiled wall (furnart.js shower_glass).
// Static parts are painted once into a cache; partitions and low walls are depth-sorted entities so nobody phases through them.
const APT={cv:null,key:''};let AS=2;
const AC_={wallL:['#f8a62a','#ee9118'],wallR:['#f09a20','#e2830f'],base:'#4b4a52',baseHi:'#77757f',ol:'#34323a',slabL:'#f29a22',slabR:'#e0820f',
 tile:'#f8f0e6',grout:'rgba(176,150,124,.42)',btile:'#b6c6d9',bgrout:'rgba(86,106,138,.42)'};
// back walls that stand tall: L-type (u-line, faces +u) and R-type (v-line, faces +v) edges with no floor behind them
function aptTall(G,R){const L=[],bu=R&&R.backU!=null?R.backU:3,bv=R&&R.backV!=null?R.backV:2;for(let u=0;u<G.cols;u++)for(let v=0;v<G.rows;v++){if(!G.floor(u,v))continue;
  if(!G.floor(u-1,v)&&u<=bu)L.push({side:'L',line:u,s:v});if(!G.floor(u,v-1)&&v<=bv)L.push({side:'R',line:v,s:u});}return L;}
const isOpen=(R,w)=>{const O=R.openView;return O&&w.side==O.side&&w.line==O.line&&w.s>=O.v0&&w.s<O.v1;};
// a point on a wall plane: s along the wall (tile units), h up (px)
function aptWP(G,side,line,s,h){const p=side=='L'?G.pt(line,s):G.pt(s,line);return[p[0],p[1]-h];}
function onWall(c,G,side,line,s0,fn){const o=aptWP(G,side,line,s0,0),e=aptWP(G,side,line,s0+1,0);c.save();c.transform(e[0]-o[0],e[1]-o[1],0,-1,o[0],o[1]);fn(c);c.restore();}
function aptSky(c,night,W,y0,y1){const g=c.createLinearGradient(0,y1,0,y0);g.addColorStop(0,night?'#1a2050':'#58b4ee');g.addColorStop(1,night?'#3d3a78':'#c4e8ff');return g;}
// floor finishes per room
const FLOORS={cream:{a:'#f8f0e6',g:'rgba(176,150,124,.42)'},check:{a:'#f8f0e6',b:'#ecc79a',g:'rgba(176,130,90,.35)'},wood:{a:'#dca468',g:'rgba(120,70,30,.38)',plank:1},walnut:{a:'#a8724c',g:'rgba(60,30,15,.42)',plank:1},
 blue:{a:'#b6c6d9',g:'rgba(86,106,138,.42)'},deck:{a:'#b39478',g:'rgba(60,40,25,.55)',deck:1}};
function aptFloorTile(c,G,u,v,kind){const P=G.pt,F=FLOORS[kind]||FLOORS.cream,k=((u*7+v*13)%5)/5;poly(c,tileQuad(G,u,v));
 if(kind=='check'){c.fillStyle=F.a;c.fill();[[0,0],[.5,.5]].forEach(([a,b])=>{poly(c,tileQuad(G,u+a,v+b,.5,.5));c.fillStyle=shade(F.b,(k-.5)*.05);c.fill();});poly(c,tileQuad(G,u,v));c.strokeStyle=F.g;c.lineWidth=1;c.stroke();return;}
 c.fillStyle=shade(F.a,(k-.5)*(F.plank||F.deck?.1:.04));c.fill();c.strokeStyle=F.g;c.lineWidth=F.deck?1.6:1;
 if(F.plank){// three planks per tile along u, staggered joints
  for(let i=1;i<3;i++){c.beginPath();c.moveTo(...P(u,v+i/3));c.lineTo(...P(u+1,v+i/3));c.stroke();}const j=((u*3+v*5)%3)/3;for(let i=0;i<3;i++){const x=u+((j+i*.37)%1);c.beginPath();c.moveTo(...P(x,v+i/3));c.lineTo(...P(x,v+(i+1)/3));c.stroke();}
  c.save();poly(c,tileQuad(G,u,v));c.clip();c.strokeStyle='rgba(255,240,210,.18)';c.lineWidth=1;c.beginPath();c.moveTo(...P(u,v+.16));c.lineTo(...P(u+1,v+.16));c.stroke();c.restore();
  poly(c,tileQuad(G,u,v));c.strokeStyle=F.g;c.globalAlpha=.5;c.stroke();c.globalAlpha=1;return;}
 if(F.deck){for(let i=1;i<4;i++){c.beginPath();c.moveTo(...P(u+i/4,v));c.lineTo(...P(u+i/4,v+1));c.stroke();}poly(c,tileQuad(G,u,v));c.stroke();return;}
 c.stroke();if(kind=='blue'){c.beginPath();const m1=P(u+.5,v),m2=P(u+.5,v+1),m3=P(u,v+.5),m4=P(u+1,v+.5);c.moveTo(...m1);c.lineTo(...m2);c.moveTo(...m3);c.lineTo(...m4);c.stroke();}}
function buildApt(R,G,night){AS=Math.min(2,Math.sqrt(7.5e6/(SC.W*SC.H)));const cv=document.createElement('canvas');cv.width=Math.ceil(SC.W*AS);cv.height=Math.ceil(SC.H*AS);const c=cv.getContext('2d');c.scale(AS,AS);c.lineJoin='round';
 const P=G.pt,F=(u,v)=>G.floor(u,v),WH=R.WH,D=34,fk=(u,v)=>(R.zones[G.zone[u][v]]||{}).floor||'cream';
 // 1) floor slab sides along the open front edges (decking edge under the balcony)
 for(let u=0;u<G.cols;u++)for(let v=0;v<G.rows;v++){if(!F(u,v))continue;const deck=fk(u,v)=='deck';
  if(!F(u+1,v)){const a=P(u+1,v),b=P(u+1,v+1);poly(c,[a,b,[b[0],b[1]+D],[a[0],a[1]+D]]);c.fillStyle=deck?'#8a8a94':AC_.slabR;c.fill();}
  if(!F(u,v+1)){const a=P(u,v+1),b=P(u+1,v+1);poly(c,[a,b,[b[0],b[1]+D],[a[0],a[1]+D]]);const gr=c.createLinearGradient(0,a[1],0,a[1]+D);gr.addColorStop(0,deck?'#a4a4ae':AC_.slabL);gr.addColorStop(1,deck?'#8a8a94':'#e88d18');c.fillStyle=gr;c.fill();}}
 c.strokeStyle=AC_.ol;c.lineWidth=2;for(let u=0;u<G.cols;u++)for(let v=0;v<G.rows;v++){if(!F(u,v))continue;
  if(!F(u+1,v)){const a=P(u+1,v),b=P(u+1,v+1);c.beginPath();c.moveTo(...a);c.lineTo(...b);c.stroke();c.lineWidth=1.2;c.beginPath();c.moveTo(b[0],b[1]+D);c.lineTo(a[0],a[1]+D);c.stroke();c.lineWidth=2;}
  if(!F(u,v+1)){const a=P(u,v+1),b=P(u+1,v+1);c.lineWidth=3;c.strokeStyle=AC_.base;c.beginPath();c.moveTo(...a);c.lineTo(...b);c.stroke();c.lineWidth=1.2;c.strokeStyle=AC_.ol;c.beginPath();c.moveTo(a[0],a[1]+D);c.lineTo(b[0],b[1]+D);c.stroke();c.lineWidth=2;}}
 // 2) floors, room by room
 for(let u=0;u<G.cols;u++)for(let v=0;v<G.rows;v++)if(F(u,v))aptFloorTile(c,G,u,v,fk(u,v));
 // gloss + light, clipped to the floor
 c.save();c.beginPath();for(let u=0;u<G.cols;u++)for(let v=0;v<G.rows;v++)if(F(u,v)){const q=tileQuad(G,u,v);c.moveTo(...q[0]);q.slice(1).forEach(p=>c.lineTo(...p));c.closePath();}c.clip();
 aptTall(G,R).forEach(w=>{if(isOpen(R,w))return;const a=w.side=='L'?P(w.line,w.s):P(w.s,w.line),b=w.side=='L'?P(w.line,w.s+1):P(w.s+1,w.line),off=w.side=='L'?G.eu:G.ev,k=.7;
  const q=[a,b,[b[0]+off[0]*k,b[1]+off[1]*k],[a[0]+off[0]*k,a[1]+off[1]*k]],gr=c.createLinearGradient(a[0],a[1],a[0]+off[0]*k,a[1]+off[1]*k);gr.addColorStop(0,'rgba(150,80,20,.20)');gr.addColorStop(1,'rgba(150,80,20,0)');poly(c,q);c.fillStyle=gr;c.fill();});
 // soft contact shade along the interior cut-away walls
 for(let u=1;u<G.cols;u++)for(let v=0;v<G.rows;v++)if(F(u,v)&&F(u-1,v)&&G.zone[u][v]!=G.zone[u-1][v]&&!G.door.has(G.ek(u-1,v,u,v))){const q=[P(u,v),P(u,v+1),P(u+.25,v+1),P(u+.25,v)],gr=c.createLinearGradient(...P(u,v+.5),...P(u+.25,v+.5));gr.addColorStop(0,'rgba(120,60,20,.16)');gr.addColorStop(1,'rgba(120,60,20,0)');poly(c,q);c.fillStyle=gr;c.fill();}
 for(let v=1;v<G.rows;v++)for(let u=0;u<G.cols;u++)if(F(u,v)&&F(u,v-1)&&G.zone[u][v]!=G.zone[u][v-1]&&!G.door.has(G.ek(u,v-1,u,v))){const q=[P(u,v),P(u+1,v),P(u+1,v+.25),P(u,v+.25)],gr=c.createLinearGradient(...P(u+.5,v),...P(u+.5,v+.25));gr.addColorStop(0,'rgba(120,60,20,.16)');gr.addColorStop(1,'rgba(120,60,20,0)');poly(c,q);c.fillStyle=gr;c.fill();}
 if(!night){// sunlight: through the balcony glass doors into the living room, the front door glass and the windows
  const patch=(q,a0)=>{const gr=c.createLinearGradient(...q[0],...q[3]);gr.addColorStop(0,`rgba(255,250,232,${a0})`);gr.addColorStop(1,'rgba(255,250,232,0)');poly(c,q);c.fillStyle=gr;c.fill();};
  (R.tallU||[]).forEach(T=>{for(let v=T.v0;v<Math.min(T.v1,9)-1;v+=2){const va=v+.12,vb=v+1.88,L=3.2,sk=.5;patch([P(T.u,va),P(T.u,vb),P(T.u+L,vb+L*sk),P(T.u+L,va+L*sk)],.55);}});
  const E=R.entry,u0=E.t[0];patch([P(u0+.18,0),P(u0+.82,0),P(u0+.82+.5,2.4),P(u0+.18+.5,2.4)],.45);
  (R.windows||[]).forEach(w=>{if(w.side=='R')patch([P(w.s0+.1,0),P(w.s1-.1,0),P(w.s1+.3,2),P(w.s0+.5,2)],.4);else patch([P(w.line,w.s0+.1),P(w.line,w.s1-.1),P(w.line+2,w.s1+.5),P(w.line+2,w.s0+.6)],.4);});}
 c.save();c.globalCompositeOperation='screen';const ctr=P(G.cols*.42,G.rows*.45);for(let i=-4;i<=4;i++){const x=ctr[0]+i*130;const gr=c.createLinearGradient(x-50,0,x+50,0);gr.addColorStop(0,'rgba(255,255,255,0)');gr.addColorStop(.5,`rgba(255,255,255,${night?.04:.11})`);gr.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=gr;c.save();c.translate(x,ctr[1]);c.rotate(-.45);c.fillRect(-50,-900,100,1800);c.restore();}c.restore();
 if(night){c.fillStyle='rgba(30,30,80,.32)';c.fillRect(-100,-100,SC.W+200,SC.H+200);[[.3,.25],[.55,.5],[.75,.3],[.4,.8],[.8,.75]].forEach(([a,b])=>{const lp=P(G.cols*a,G.rows*b),gr=c.createRadialGradient(lp[0],lp[1],10,lp[0],lp[1],260);gr.addColorStop(0,'rgba(255,214,150,.2)');gr.addColorStop(1,'rgba(255,214,150,0)');c.fillStyle=gr;c.fillRect(lp[0]-260,lp[1]-260,520,520);});}
 c.restore();
 // floor drain in the bathroom
 if(R.drain){const d=P(...R.drain);c.save();c.translate(d[0],d[1]);c.scale(1,.5);c.rotate(Math.PI/4);c.fillStyle='#8a96a6';c.fillRect(-7,-7,14,14);c.strokeStyle='#4f5868';c.lineWidth=1.4;c.strokeRect(-7,-7,14,14);for(let i=-4;i<=4;i+=2.6){c.beginPath();c.moveTo(-5,i);c.lineTo(5,i);c.stroke();}c.restore();}
 // door mats inside the front door
 {const E=R.entry;const q=[P(E.t[0]+.12,E.t[1]+.1),P(E.t[0]+.88,E.t[1]+.1),P(E.t[0]+.88,E.t[1]+.7),P(E.t[0]+.12,E.t[1]+.7)];poly(c,q);c.fillStyle='#7a5a44';c.fill();c.strokeStyle='#5a3e2c';c.lineWidth=1.5;c.stroke();}
 // 3) tall back walls (the balcony side is open air: sky + sea + glass railing instead)
 const T=aptTall(G,R),TW_=T.filter(w=>!isOpen(R,w));
 if(R.openView)aptOpenView(c,G,R,night);
 TW_.forEach(w=>{const a=aptWP(G,w.side,w.line,w.s,0),b=aptWP(G,w.side,w.line,w.s+1,0),col=w.side=='L'?AC_.wallL:AC_.wallR;poly(c,[a,b,[b[0],b[1]-WH],[a[0],a[1]-WH]]);
  const gr=c.createLinearGradient(0,a[1]-WH,0,a[1]);gr.addColorStop(0,shade(col[0],.06));gr.addColorStop(1,col[1]);c.fillStyle=gr;c.fill();c.strokeStyle=col[1];c.lineWidth=1;c.stroke();});
 if(night)TW_.forEach(w=>{const a=aptWP(G,w.side,w.line,w.s,0),b=aptWP(G,w.side,w.line,w.s+1,0);poly(c,[a,b,[b[0],b[1]-WH],[a[0],a[1]-WH]]);c.fillStyle='rgba(40,30,80,.28)';c.fill();});
 if(R.ac)aptAC(c,G,R);aptDoor(c,G,R,night);(R.windows||[]).forEach(w=>aptWindow(c,G,R,w,night));
 TW_.forEach(w=>{const a=aptWP(G,w.side,w.line,w.s,0),b=aptWP(G,w.side,w.line,w.s+1,0);if(w.side=='R'&&w.line==0&&w.s==R.entry.t[0])return;
  poly(c,[a,b,[b[0],b[1]-10],[a[0],a[1]-10]]);c.fillStyle=AC_.base;c.fill();c.strokeStyle=AC_.baseHi;c.lineWidth=1;c.beginPath();c.moveTo(a[0],a[1]-10);c.lineTo(b[0],b[1]-10);c.stroke();});
 TW_.forEach(w=>{const a=aptWP(G,w.side,w.line,w.s,0);const other=TW_.find(o=>o.side!=w.side&&((w.side=='L'&&o.line==w.s&&o.s==w.line)));if(other){c.strokeStyle='rgba(170,90,10,.55)';c.lineWidth=1.4;c.beginPath();c.moveTo(...a);c.lineTo(a[0],a[1]-WH);c.stroke();}});
 const k=.13,capOf=w=>w.side=='L'?[-G.eu[0]*k,-G.eu[1]*k]:[-G.ev[0]*k,-G.ev[1]*k];
 TW_.forEach(w=>{const a=aptWP(G,w.side,w.line,w.s,WH),b=aptWP(G,w.side,w.line,w.s+1,WH),o=capOf(w);poly(c,[a,b,[b[0]+o[0],b[1]+o[1]],[a[0]+o[0],a[1]+o[1]]]);c.fillStyle='#ffffff';c.fill();});
 TW_.forEach(w=>{[w.s,w.s+1].forEach(s=>{const p=aptWP(G,w.side,w.line,s,WH),o1=[-G.eu[0]*k,-G.eu[1]*k],o2=[-G.ev[0]*k,-G.ev[1]*k];poly(c,[p,[p[0]+o1[0],p[1]+o1[1]],[p[0]+o1[0]+o2[0],p[1]+o1[1]+o2[1]],[p[0]+o2[0],p[1]+o2[1]]]);c.fillStyle='#fff';c.fill();});});
 c.strokeStyle=AC_.ol;c.lineWidth=1.6;TW_.forEach(w=>{const a=aptWP(G,w.side,w.line,w.s,WH),b=aptWP(G,w.side,w.line,w.s+1,WH),o=capOf(w);
  c.beginPath();c.moveTo(a[0]+o[0],a[1]+o[1]);c.lineTo(b[0]+o[0],b[1]+o[1]);c.stroke();c.lineWidth=1;c.strokeStyle='rgba(52,50,58,.5)';c.beginPath();c.moveTo(...a);c.lineTo(...b);c.stroke();c.lineWidth=1.6;c.strokeStyle=AC_.ol;});
 // exposed wall ends (front end of every run of tall wall), and the cap edge where the open balcony begins
 TW_.forEach(w=>{if(TW_.some(q=>q.side==w.side&&q.line==w.line&&q.s==w.s+1))return;const s=w.s+1,a=aptWP(G,w.side,w.line,s,0),o=capOf(w);
  poly(c,[a,[a[0]+o[0],a[1]+o[1]],[a[0]+o[0],a[1]+o[1]-WH],[a[0],a[1]-WH]]);c.fillStyle=w.side=='L'?'#d97a0c':'#c96e08';c.fill();c.strokeStyle=AC_.ol;c.lineWidth=1.6;c.stroke();});
 return cv;}
// the balcony's open side: sky, sea and the far shore above a glass railing with a steel handrail
function aptOpenView(c,G,R,night){const O=R.openView,W=O.v1-O.v0,WH=R.WH;
 onWall(c,G,O.side,O.line,O.v0,c=>{const top=WH+24,k=W/8;
  const g=c.createLinearGradient(0,0,0,top);g.addColorStop(0,night?'#3d3a78':'#bfe6ff');g.addColorStop(.75,night?'#1e2456':'#6ac0f2');g.addColorStop(1,night?'rgba(26,32,80,0)':'rgba(88,180,238,0)');c.fillStyle=g;c.fillRect(0,0,W,top);
  if(!night){c.fillStyle='rgba(255,255,255,.92)';[[1.2,118,.6,10],[1.7,124,.45,8],[4.4,108,.7,11],[5,114,.42,8],[6.8,126,.5,9]].forEach(([x,y,rx,ry])=>{c.beginPath();c.ellipse(x*k,y,rx,ry,0,0,7);c.fill();});}
  else{c.fillStyle='rgba(255,255,255,.85)';for(let i=0;i<22;i++)c.fillRect((.2+((i*37)%76)/10)*k,80+((i*53)%70),.025,1.4);c.fillStyle='#fff6d0';c.save();c.translate(5.6,126);c.scale(.1,8);c.beginPath();c.arc(0,0,1,0,7);c.restore();c.fill();}
  // far shore with a little skyline, then the sea
  c.fillStyle=night?'#2a2e5a':'#9cc0dc';for(let i=0;i<Math.round(12*k);i++){const x=.2+i*.62,h=8+((i*41)%18);c.fillRect(x,64,.4,h);}c.fillStyle=night?'#ffe38a':'#e8f4ff';for(let i=0;i<16;i++)c.fillRect((.3+((i*29)%74)/10)*k,66+((i*17)%14),.05,1.6);
  c.fillStyle=night?'#1e3566':'#3d9ad6';c.fillRect(0,30,W,35);c.fillStyle=night?'rgba(150,180,255,.25)':'rgba(255,255,255,.5)';for(let i=0;i<Math.round(14*k);i++)c.fillRect(.2+i*.56,36+((i*7)%22),.3,1.2);
  // glass railing panels + posts + handrail
  c.fillStyle=night?'rgba(160,190,230,.22)':'rgba(220,240,255,.42)';c.fillRect(0,4,W,48);c.fillStyle=night?'rgba(255,255,255,.08)':'rgba(255,255,255,.35)';for(let i=0;i<W;i++){c.beginPath();c.moveTo(i+.15,6);c.lineTo(i+.3,6);c.lineTo(i+.55,50);c.lineTo(i+.4,50);c.fill();}
  c.fillStyle='#5c5a64';for(let i=0;i<=W;i++)c.fillRect(i-.03,0,.06,54);c.fillStyle='#8c8a94';c.fillRect(0,50,W,4);c.fillStyle='#d8dee6';c.fillRect(0,53,W,1.4);c.fillStyle='#4b4a52';c.fillRect(0,0,W,5);});}
function aptWindow(c,G,R,w,night){const WH=R.WH;onWall(c,G,w.side,w.line,w.s0,c=>{const W=w.s1-w.s0,x0=.18,x1=W-.18,y0=WH*.36,y1=WH*.82;
  c.fillStyle='rgba(120,60,10,.22)';c.fillRect(x0+.04,y0-5,x1-x0,y1-y0+4);c.fillStyle='#ffffff';c.fillRect(x0-.06,y0-4,x1-x0+.12,y1-y0+8);
  c.fillStyle=aptSky(c,night,W,y0,y1);c.fillRect(x0,y0,x1-x0,y1-y0);if(!night){c.fillStyle='rgba(255,255,255,.9)';c.beginPath();c.ellipse(x0+.5,y1-14,.3,6,0,0,7);c.fill();}
  c.fillStyle=night?'#2a2e5a':'#9cc0dc';c.fillRect(x0,y0,x1-x0,12);c.fillStyle=night?'rgba(255,255,255,.08)':'rgba(255,255,255,.35)';c.beginPath();c.moveTo(x0+.1,y0);c.lineTo(x0+.25,y0);c.lineTo(x0+.55,y1);c.lineTo(x0+.4,y1);c.fill();
  c.strokeStyle='#5c5a64';c.lineWidth=.04;c.strokeRect(x0,y0,x1-x0,y1-y0);c.beginPath();c.moveTo((x0+x1)/2,y0);c.lineTo((x0+x1)/2,y1);c.stroke();c.fillStyle='#e8e4dc';c.fillRect(x0-.1,y0-6,x1-x0+.2,5);
  // yellow tie-back curtains like the living room's
  [[x0-.16,x0+.2],[x1+.16,x1-.2]].forEach(([a,b])=>{const gr=c.createLinearGradient(a,0,b,0);gr.addColorStop(0,night?'#c8b070':'#fbe7a6');gr.addColorStop(1,night?'#b89a58':'#efcf78');c.fillStyle=gr;c.beginPath();c.moveTo(a,y1+12);c.lineTo(b,y1+12);c.quadraticCurveTo(b,y0+30,(a+b)/2,y0+20);c.quadraticCurveTo(a,y0+8,a,y0-8);c.closePath();c.fill();c.strokeStyle='rgba(150,110,40,.7)';c.lineWidth=.02;c.stroke();});
  c.fillStyle='#d8b060';c.fillRect(x0-.24,y1+12,x1-x0+.48,2);});}
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
// interior walls as depth-sorted entities: cut-away orange walls with white caps, door jambs, the balcony's glass sliding doors
// (yellow curtains gathered at the ends) and the tiled shower wall
function lowWallSeg(g,p0,p1,LH){poly(g,[p0,p1,[p1[0],p1[1]-LH],[p0[0],p0[1]-LH]]);const gr=g.createLinearGradient(0,p0[1]-LH,0,p0[1]);gr.addColorStop(0,'#f8a830');gr.addColorStop(1,'#e8860e');g.fillStyle=gr;g.fill();
 poly(g,[p0,p1,[p1[0],p1[1]-6],[p0[0],p0[1]-6]]);g.fillStyle=AC_.base;g.fill();
 poly(g,[[p0[0],p0[1]-LH],[p1[0],p1[1]-LH],[p1[0],p1[1]-LH-5],[p0[0],p0[1]-LH-5]]);g.fillStyle='#ffffff';g.fill();g.strokeStyle=AC_.ol;g.lineWidth=1.3;g.stroke();
 g.strokeStyle='rgba(52,50,58,.55)';g.lineWidth=1;g.beginPath();g.moveTo(...p0);g.lineTo(...p1);g.stroke();}
function aptWalls(G,R){const E=[],LH=30,WH=R.WH;
 const low=(p0,p1,depth)=>E.push({depth,d:g=>lowWallSeg(g,p0,p1,LH)});
 const post=(p,depth)=>E.push({depth:depth+.001,d:g=>{g.fillStyle='#f39a22';g.beginPath();g.roundRect(p[0]-4,p[1]-LH-5,8,LH+5,2);g.fill();g.fillStyle=AC_.base;g.fillRect(p[0]-4,p[1]-6,8,6);g.fillStyle='#fff';g.fillRect(p[0]-4,p[1]-LH-6,8,4);g.strokeStyle=AC_.ol;g.lineWidth=1.2;g.beginPath();g.roundRect(p[0]-4,p[1]-LH-6,8,LH+6,2);g.stroke();}});
 const door=(a,b,c,d)=>G.floor(a,b)&&G.floor(c,d)&&G.zone[a][b]!=G.zone[c][d]&&G.door.has(G.ek(a,b,c,d));
 const TU=R.tallU||[],TV=R.tall||[];
 for(let u=1;u<G.cols;u++)for(let v=0;v<G.rows;v++){const a=G.floor(u-1,v),b=G.floor(u,v);if(!b)continue;const p0=G.pt(u,v+1),p1=G.pt(u,v),dep=u+v+.5+.02;
  if(a&&G.zone[u-1][v]!=G.zone[u][v]){const T=TU.find(t=>t.u==u&&v>=t.v0&&v<t.v1);
   if(T){const o={door:(T.doors||[]).includes(v),back:v==T.v0,front:v==T.v1-1};E.push({depth:dep,d:g=>tallSegP(g,p0,p1,T,WH,o)});continue;}
   if(door(u-1,v,u,v)){if(!door(u-1,v-1,u,v-1))post(p1,dep);if(!door(u-1,v+1,u,v+1))post(p0,dep);}else low(p0,p1,dep);}
  else if(!a&&u>(R.backU!=null?R.backU:3))low(p0,p1,dep);}
 for(let v=1;v<G.rows;v++)for(let u=0;u<G.cols;u++){const a=G.floor(u,v-1),b=G.floor(u,v);if(!b)continue;const p0=G.pt(u,v),p1=G.pt(u+1,v),dep=u+.5+v+.02;
  if(a&&G.zone[u][v-1]!=G.zone[u][v]){const T=TV.find(t=>t.v==v&&u>=t.u0&&u<t.u1);
   if(T){const o={back:u==T.u0,front:u==T.u1-1};E.push({depth:dep,d:g=>tallSegP(g,p0,p1,T,WH,o)});continue;}
   if(door(u,v-1,u,v)){if(!door(u-1,v-1,u-1,v))post(p0,dep);if(!door(u+1,v-1,u+1,v))post(p1,dep);}else low(p0,p1,dep);}
  else if(!a&&v>(R.backV!=null?R.backV:2))low(p0,p1,dep);}
 return E;}
// one tile of a tall partition between screen points p0 -> p1
function tallSegP(g,p0,p1,T,WH,o){const Q=(s,h)=>[p0[0]+(p1[0]-p0[0])*s,p0[1]+(p1[1]-p0[1])*s-h];const FR='#5c5a64';
 if(T.kind=='tile'){poly(g,[Q(0,0),Q(1,0),Q(1,WH),Q(0,WH)]);const gr=g.createLinearGradient(0,p0[1]-WH,0,p0[1]);gr.addColorStop(0,'#f4f8fc');gr.addColorStop(1,'#d6e2ee');g.fillStyle=gr;g.fill();
  g.strokeStyle='rgba(120,140,170,.5)';g.lineWidth=.8;for(let i=1;i<3;i++){g.beginPath();g.moveTo(...Q(i/3,0));g.lineTo(...Q(i/3,WH));g.stroke();}for(let h=16;h<WH;h+=16){g.beginPath();g.moveTo(...Q(0,h));g.lineTo(...Q(1,h));g.stroke();}
  g.fillStyle='rgba(255,255,255,.35)';poly(g,[Q(.1,WH-6),Q(.3,WH-6),Q(.2,20),Q(.05,20)]);g.fill();}
 else if(o.door){// open sliding doorway: floor track + header only
  poly(g,[Q(0,0),Q(1,0),Q(1,4),Q(0,4)]);g.fillStyle='#8c8a94';g.fill();}
 else{poly(g,[Q(0,8),Q(1,8),Q(1,WH-6),Q(0,WH-6)]);g.fillStyle='rgba(200,230,250,.26)';g.fill();g.fillStyle='rgba(255,255,255,.42)';poly(g,[Q(.18,WH-8),Q(.3,WH-8),Q(.14,10),Q(.04,10)]);g.fill();poly(g,[Q(.38,WH-8),Q(.42,WH-8),Q(.3,10),Q(.26,10)]);g.fill();
  poly(g,[Q(0,0),Q(1,0),Q(1,8),Q(0,8)]);g.fillStyle=FR;g.fill();}
 poly(g,[Q(0,WH-6),Q(1,WH-6),Q(1,WH),Q(0,WH)]);g.fillStyle=FR;g.fill();g.strokeStyle='#2e2c34';g.lineWidth=1;g.stroke();
 [0,1].forEach(s=>{const p=Q(s,0);g.fillStyle=FR;g.fillRect(p[0]-2.5,p[1]-WH,5,WH);g.strokeStyle='#2e2c34';g.strokeRect(p[0]-2.5,p[1]-WH,5,WH);});
 // yellow curtains gathered at both ends of the glass run (as in the user's art)
 if(T.kind=='glass'&&(o.back||o.front)){const night=nightF()>.5;const s0=o.front?0:1,s1=o.front?.42:.58;const top=WH-10,wst=WH*.42;
  const A=Q(s0,top),B=Q(s1,top),Cw=Q((s0+s1)/2+(o.front?-.06:.06),wst),Bot=Q(s0,2),Bot2=Q(s1-(o.front?.12:-.12),2);
  g.beginPath();g.moveTo(...A);g.lineTo(...B);g.quadraticCurveTo(...Q(s1,wst+20),...Cw);g.quadraticCurveTo(...Q(s1,wst-30),...Bot2);g.lineTo(...Bot);g.closePath();
  const gr=g.createLinearGradient(A[0],0,B[0],0);gr.addColorStop(0,night?'#c8b070':'#fbe7a6');gr.addColorStop(.5,night?'#d8c080':'#fff2c4');gr.addColorStop(1,night?'#b89a58':'#efcf78');g.fillStyle=gr;g.fill();g.strokeStyle='rgba(150,110,40,.75)';g.lineWidth=1;g.stroke();
  g.strokeStyle='rgba(200,150,60,.55)';for(let i=1;i<3;i++){const m=s0+(s1-s0)*i/3;g.beginPath();g.moveTo(...Q(m,top));g.lineTo(...Q(m,wst+6));g.stroke();}const t0=Q(s0,wst),t1=Q(s1,wst);g.strokeStyle='#e0b050';g.lineWidth=3;g.beginPath();g.moveTo(...t0);g.lineTo(...t1);g.stroke();
  g.fillStyle='#d8b060';const r0=Q(0,top+4),r1=Q(1,top+4);g.beginPath();g.moveTo(...r0);g.lineTo(...r1);g.lineTo(r1[0],r1[1]+2);g.lineTo(r0[0],r0[1]+2);g.fill();}}
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
