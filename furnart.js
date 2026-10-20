'use strict';
// Lumen Residences — furniture art. Every piece is PAINTED here in the tenants' chibi-sprite style (soft cel shading,
// rounded "cushiony" corners, a clean dark sticker outline, cute simplified shapes) instead of using cut-outs.
// Pieces are modelled in local tile space (x = width, y = depth with the FRONT at y=D, z = height in px) and projected
// onto the 2:1 iso grid for each of 4 facings, so rotation draws the real other sides — no mirroring.
const FA=(()=>{
const CS=2,OUT='#2b1b22';
const hx=c=>{if(c[0]!='#')return[128,128,128];const n=parseInt(c.slice(1),16);return[n>>16,n>>8&255,n&255];};
const tone=(c,f)=>{let [r,g,b]=hx(c);const t=f<0?0:255,a=Math.abs(f);r=Math.round(r+(t-r)*a);g=Math.round(g+(t-g)*a);b=Math.round(b+(t-b)*a);return`rgb(${r},${g},${b})`;};
const rgba=(c,a)=>{const [r,g,b]=hx(c);return`rgba(${r},${g},${b},${a})`;};
// palette (matches the painted apartments: dark lacquer, crimson, gold, cream)
const C={dark:'#3a2a33',black:'#2a2430',wood:'#8a5a3a',wood2:'#a8703f',red:'#c8323c',red2:'#e2525a',gold:'#e8b44e',gold2:'#ffe08a',cream:'#f3e6cc',white:'#f4f2f6',
 steel:'#b8c2cc',grey:'#7a7684',navy:'#3a4466',teal:'#4ab8c8',green:'#4aa85a',leaf:'#3f9a4a',leaf2:'#6cc860',pink:'#f08aa8',purple:'#8a5ad0',blue:'#4a8ad8'};
// ---------- painter context for one piece at one facing ----------
function mk(def,r,eu){const [W,D]=def.fp,KZ=eu[0]/45;
 const L=(x,y)=>r==0?[x,y]:r==1?[y,W-x]:r==2?[W-x,D-y]:[D-y,x];
 const S=(gu,gv,z)=>[gu*eu[0]-gv*eu[0],gu*eu[1]+gv*eu[1]-z*KZ];
 const P3=(x,y,z)=>{const [a,b]=L(x,y);return S(a,b,z);};
 const N=(nx,ny)=>r==0?[nx,ny]:r==1?[ny,-nx]:r==2?[-nx,-ny]:[-ny,nx];
 const items=[];const ctx={W,D,r,KZ,P3,L,items};
 const gbox=(x0,y0,x1,y1)=>{const a=L(x0,y0),b=L(x1,y1);return[Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[0],b[0]),Math.max(a[1],b[1])];};
 ctx.box=(x0,y0,z0,x1,y1,z1,col,o={})=>{const g=gbox(x0,y0,x1,y1),B={x0,y0,z0,x1,y1,z1,g,col,o,dec:[],ctx};items.push({bb:[g[0],g[1],g[2],g[3],z0,z1],d:(g[0]+g[2])/2+(g[1]+g[3])/2,z:z0,o:o.order||0,draw:c=>drawBox(c,B,S)});B.decs=B.dec;
  B.on=(face,fn)=>{const n={F:[0,1],B:[0,-1],R:[1,0],L:[-1,0]}[face];if(face!='T'){const m=N(...n);if(!(m[0]>0||m[1]>0))return B;}B.dec.push({face,fn});return B;};return B;};
 ctx.cyl=(cx,cy,z0,z1,rad,col,o={})=>{const [a,b]=L(cx,cy);items.push({bb:[a-rad,b-rad,a+rad,b+rad,z0,z1],d:a+b,z:z0,o:o.order||0,draw:c=>drawCyl(c,S,a,b,z0,z1,rad,col,Object.assign({KZ},o))});};
 ctx.ball=(cx,cy,z,rp,col,o={})=>{const [a,b]=L(cx,cy);items.push({bb:[a-rp/64,b-rp/64,a+rp/64,b+rp/64,z,z+rp*2],d:a+b+(o.dd||0),z,o:o.order||0,draw:c=>drawBall(c,S(a,b,z),rp*KZ,col,o)});};
 ctx.leaves=(cx,cy,z,sz,n,col,seed=1,o={})=>{const [a,b]=L(cx,cy);items.push({bb:[a-.05,b-.05,a+.05,b+.05,z,z+sz],d:a+b+.01,z,o:o.order||0,draw:c=>drawLeaves(c,S(a,b,z),sz*KZ,n,col,seed,o)});};
 ctx.flat=(x0,y0,x1,y1,z,fn,o={})=>{const g=gbox(x0,y0,x1,y1);items.push({bb:o.under?null:[g[0],g[1],g[2],g[3],z,z],d:o.under?-99:(g[0]+g[2])/2+(g[1]+g[3])/2,z,o:o.order||0,draw:c=>{const p0=P3(x0,y0,z),p1=P3(x1,y0,z),p3=P3(x0,y1,z);c.save();c.transform(p1[0]-p0[0],p1[1]-p0[1],p3[0]-p0[0],p3[1]-p0[1],p0[0],p0[1]);fn(c);c.restore();}});};
 ctx.fn=(x,y,z,fn,o={})=>{const [a,b]=L(x,y);items.push({post:o.post,bb:o.bb||[a-.02,b-.02,a+.02,b+.02,z,z+1],d:a+b+(o.dd||0),z,o:o.order||0,draw:c=>fn(c,S(a,b,z),ctx)});};
 return ctx;}
// box faces: top, +u (screen right, shaded) and +v (screen left, lit); rounded with a same-colour round-join stroke
function drawBox(c,B,S){const [u0,v0,u1,v1]=B.g,{z0,z1,col,o}=B;const P=(u,v,z)=>S(u,v,z);
 const top=[P(u0,v0,z1),P(u1,v0,z1),P(u1,v1,z1),P(u0,v1,z1)],rt=[P(u1,v0,z0),P(u1,v1,z0),P(u1,v1,z1),P(u1,v0,z1)],lf=[P(u0,v1,z0),P(u1,v1,z0),P(u1,v1,z1),P(u0,v1,z1)];
 const soft=o.soft||0,alpha=o.alpha==null?1:o.alpha;c.save();c.globalAlpha=alpha;c.lineJoin='round';
 const face=(pts,f0,f1,y0,y1)=>{c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();const gr=c.createLinearGradient(0,y0,0,y1);gr.addColorStop(0,tone(col,f0));gr.addColorStop(1,tone(col,f1));c.fillStyle=gr;c.fill();if(soft){c.strokeStyle=gr;c.lineWidth=soft;c.stroke();}};
 if(z1>z0){face(lf,o.lit!=null?o.lit:.06,-.16,lf[3][1],lf[0][1]);face(rt,-.2,-.38,rt[3][1],rt[0][1]);}
 face(top,o.tf!=null?o.tf:.3,.12,top[0][1],top[2][1]);
 // soft cel highlight on the top + thin interior edge lines
 if(o.gloss!==0){c.save();c.beginPath();top.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();c.clip();const m=[(top[0][0]+top[2][0])/2,(top[0][1]+top[2][1])/2];const w=Math.abs(top[1][0]-top[3][0]);
  const hg=c.createRadialGradient(m[0]-w*.12,m[1]-w*.05,1,m[0],m[1],w*.6);hg.addColorStop(0,'rgba(255,255,255,'+(o.gloss||.22)+')');hg.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=hg;c.fillRect(m[0]-w,m[1]-w,w*2,w*2);c.restore();}
 c.strokeStyle='rgba(43,27,34,.55)';c.lineWidth=1.1;if(z1>z0){c.beginPath();c.moveTo(...P(u0,v1,z1));c.lineTo(...P(u1,v1,z1));c.lineTo(...P(u1,v0,z1));c.moveTo(...P(u1,v1,z1));c.lineTo(...P(u1,v1,z0));c.stroke();}
 if(o.trim){c.strokeStyle=o.trim;c.lineWidth=o.tw||2.2;c.beginPath();c.moveTo(...P(u0,v1,z1-1));c.lineTo(...P(u1,v1,z1-1));c.lineTo(...P(u1,v0,z1-1));c.stroke();}
 c.restore();
 // decals drawn in the face's own unit square (0..1 across, 0..1 downward)
 B.dec.forEach(({face,fn})=>{const {x0,y0,z0,x1,y1,z1}=B;let Q;
  if(face=='F')Q=(s,w)=>[x0+s*(x1-x0),y1,z1-w*(z1-z0)];else if(face=='B')Q=(s,w)=>[x1-s*(x1-x0),y0,z1-w*(z1-z0)];
  else if(face=='R')Q=(s,w)=>[x1,y1-s*(y1-y0),z1-w*(z1-z0)];else if(face=='L')Q=(s,w)=>[x0,y0+s*(y1-y0),z1-w*(z1-z0)];else Q=(s,w)=>[x0+s*(x1-x0),y0+w*(y1-y0),z1];
  const pr=q=>B.ctx.P3(...q),o0=pr(Q(0,0)),e1=pr(Q(1,0)),e2=pr(Q(0,1));c.save();c.transform(e1[0]-o0[0],e1[1]-o0[1],e2[0]-o0[0],e2[1]-o0[1],o0[0],o0[1]);fn(c);c.restore();});}
function drawCyl(c,S,a,b,z0,z1,rad,col,o){const p0=S(a,b,z0),p1=S(a,b,z1),k=Math.SQRT2,rx=rad*45*k*(o.KZ||1),ry=rx/2;c.save();c.globalAlpha=o.alpha==null?1:o.alpha;
 const gr=c.createLinearGradient(p0[0]-rx,0,p0[0]+rx,0);gr.addColorStop(0,tone(col,.12));gr.addColorStop(.35,tone(col,.3));gr.addColorStop(.7,tone(col,-.12));gr.addColorStop(1,tone(col,-.34));
 c.beginPath();c.ellipse(p0[0],p0[1],rx,ry,0,0,Math.PI);c.lineTo(p1[0]-rx,p1[1]);c.ellipse(p1[0],p1[1],rx,ry,0,Math.PI,0,true);c.closePath();c.fillStyle=gr;c.fill();
 if(!o.open){c.beginPath();c.ellipse(p1[0],p1[1],rx,ry,0,0,7);c.fillStyle=o.top||tone(col,.32);c.fill();c.strokeStyle='rgba(43,27,34,.45)';c.lineWidth=1;c.stroke();}
 if(o.inner){c.beginPath();c.ellipse(p1[0],p1[1]+ry*.1,rx*.78,ry*.7,0,0,7);c.fillStyle=o.inner;c.fill();}
 c.restore();}
function drawBall(c,p,R,col,o){const g=c.createRadialGradient(p[0]-R*.35,p[1]-R*1.35,R*.1,p[0],p[1]-R,R*1.05);g.addColorStop(0,tone(col,.55));g.addColorStop(.45,col);g.addColorStop(1,tone(col,-.38));
 c.beginPath();c.arc(p[0],p[1]-R,R,0,7);c.fillStyle=g;c.fill();if(o.band){c.strokeStyle=o.band;c.lineWidth=R*.12;c.beginPath();c.ellipse(p[0],p[1]-R,R,R*.3,0,0,7);c.stroke();}
 c.fillStyle='rgba(255,255,255,.55)';c.beginPath();c.ellipse(p[0]-R*.35,p[1]-R*1.45,R*.22,R*.13,-.6,0,7);c.fill();}
// painter's order: behind on a grid axis first; overlapping footprints stack by height; ties by centre depth/order
function behind(A,B){const a=A.bb,b=B.bb,e=1e-3;if(!a)return true;if(!b)return false;
 const ab=a[2]<=b[0]+e||a[3]<=b[1]+e,ba=b[2]<=a[0]+e||b[3]<=a[1]+e;if(ab&&!ba)return true;if(ba&&!ab)return false;
 if(!ab&&!ba){if(a[5]<=b[4]+e&&b[5]>a[5])return true;if(b[5]<=a[4]+e&&a[5]>b[5])return false;}
 return (A.d-B.d||A.o-B.o||A.z-B.z)<0;}
function isoSort(L){const n=L.length,done=new Array(n).fill(false),out=[];for(let k=0;k<n;k++){let pick=-1;
 for(let i=0;i<n;i++){if(done[i])continue;let ok=true;for(let j=0;j<n;j++)if(j!=i&&!done[j]&&behind(L[j],L[i])&&!behind(L[i],L[j])){ok=false;break;}if(ok){pick=i;break;}}
 if(pick<0){let best=1e9;for(let i=0;i<n;i++)if(!done[i]&&L[i].d<best){best=L[i].d;pick=i;}}done[pick]=true;out.push(L[pick]);}return out;}
function rnd(s){return()=>{s=(s*9301+49297)%233280;return s/233280;};}
function drawLeaves(c,p,sz,n,col,seed,o){const R=rnd(seed*97+3),cols=Array.isArray(col)?col:[col,tone(col,.25)];
 for(let i=0;i<n;i++){const a=-Math.PI/2+(i/(n-1||1)-.5)*(o.spread||2.6)+(R()-.5)*.35,len=sz*(.65+R()*.45),w=len*(o.thin?.16:.3);c.save();c.translate(p[0],p[1]);c.rotate(a+Math.PI/2);
  const gr=c.createLinearGradient(0,0,0,-len);gr.addColorStop(0,tone(cols[0],-.25));gr.addColorStop(.6,cols[i%cols.length]);gr.addColorStop(1,tone(cols[0],.3));
  c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(w,-len*.45,0,-len);c.quadraticCurveTo(-w,-len*.45,0,0);c.fillStyle=gr;c.fill();c.strokeStyle='rgba(30,50,30,.5)';c.lineWidth=.9;c.stroke();
  c.beginPath();c.moveTo(0,-2);c.lineTo(0,-len*.85);c.strokeStyle='rgba(230,255,200,.35)';c.stroke();c.restore();}}
// ---------- piece library ----------
const rr=(c,x,y,w,h,r,fill)=>{c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();};
const knob=(c,x,y,col=C.gold)=>{c.beginPath();c.ellipse(x,y,.035,.05,0,0,7);c.fillStyle=col;c.fill();};
const sofa=(col,pip)=>p=>{const {W}=p;[[.12,.12],[W-.12,.12],[.12,.88],[W-.12,.88]].forEach(([x,y])=>p.cyl(x,y,0,7,.05,C.gold));
 p.box(.04,.06,6,W-.04,.98,18,tone2(col,-.25),{soft:3,trim:pip});p.box(.08,.06,16,W-.08,.36,58,col,{soft:6,gloss:.18});
 p.box(.22,.32,16,W-.22,.96,29,col,{soft:6,gloss:.3}).on('F',c=>{for(let i=1;i<W*2;i++){c.fillStyle='rgba(40,20,30,.25)';c.fillRect(i/(W*2)-.004,0,.008,1);}});
 p.box(.02,.08,16,.24,.98,40,col,{soft:6});p.box(W-.24,.08,16,W-.02,.98,40,col,{soft:6});
 p.box(.32,.3,29,.62,.44,50,C.cream,{soft:5,gloss:.4,order:1});if(W>1)p.box(W-.62,.3,29,W-.32,.44,50,pip==C.gold?C.red:C.gold,{soft:5,gloss:.4,order:1});};
function tone2(c,f){const [r,g,b]=hx(c),t=f<0?0:255,a=Math.abs(f);const q=v=>Math.round(v+(t-v)*a).toString(16).padStart(2,'0');return'#'+q(r)+q(g)+q(b);}
const bed=(frame,sheet,blanket)=>p=>{p.box(0,0,0,2,2,16,frame,{soft:3,trim:C.gold});
 p.box(0,0,0,2,.16,92,frame,{soft:5,trim:C.gold}).on('F',c=>{rr(c,.08,.12,.84,.62,.08,tone(frame,.12));c.fillStyle=C.gold;for(let i=0;i<4;i++)for(let j=0;j<2;j++){c.beginPath();c.ellipse(.2+i*.2,.3+j*.25,.018,.03,0,0,7);c.fill();}});
 p.box(.07,.14,16,1.93,1.96,32,sheet,{soft:6,gloss:.35});p.box(.04,.95,18,1.96,1.99,35,blanket,{soft:6,gloss:.3,order:1}).on('T',c=>{c.fillStyle=rgba(C.gold,.85);c.fillRect(0,.1,1,.07);});
 p.box(.18,.2,32,.92,.62,46,C.white,{soft:7,gloss:.5,order:2});p.box(1.08,.2,32,1.82,.62,46,C.white,{soft:7,gloss:.5,order:2});};
const shelf=(col,trim,books)=>p=>{const {W}=p;p.box(0,.25,0,W,1,140,col,{soft:3,trim}).on('F',c=>{const R=rnd(books);for(let s=0;s<4;s++){const y0=.06+s*.235;rr(c,.05,y0,.9,.19,.02,'rgba(30,18,24,.55)');
  let x=.08;while(x<.9){const w=.035+R()*.04,h=.11+R()*.06;c.fillStyle=['#c8323c','#e8b44e','#4a8ad8','#4aa85a','#f3e6cc','#8a5ad0'][Math.floor(R()*6)];c.fillRect(x,y0+.19-h,w,h);c.fillStyle='rgba(255,255,255,.3)';c.fillRect(x,y0+.19-h,w*.3,h);x+=w+.01;}}});};
const plant=(pot,leaf,n,sz,seed,thin)=>p=>{p.cyl(.5,.5,0,26,.2,pot,{inner:'#4a3020'});p.cyl(.5,.5,24,28,.22,C.gold,{open:0});p.leaves(.5,.5,26,sz,n,leaf,seed,{thin});};
const DEF={
 bed:{fp:[2,2],h:92,paint:bed('#4a2a3a','#f3e6cc',C.red)},
 bed_grey:{fp:[2,2],h:92,paint:bed('#4a4a5a','#e8eaf2','#5a6a9a')},
 sofa_red:{fp:[2,1],h:60,paint:sofa(C.red,C.gold)},sofa_cream:{fp:[2,1],h:60,paint:sofa(C.cream,C.gold)},sofa_grey:{fp:[2,1],h:60,paint:sofa('#7a7a8c','#c9ccd8')},sofa_black:{fp:[2,1],h:60,paint:sofa('#3a3340',C.gold)},
 armchair:{fp:[1,1],h:60,paint:sofa(C.red,C.gold)},
 chair_red:{fp:[1,1],h:74,paint:p=>{[[.25,.25],[.75,.25],[.25,.75],[.75,.75]].forEach(([x,y])=>p.cyl(x,y,0,26,.035,C.dark));p.box(.18,.18,26,.82,.82,33,C.red,{soft:5,gloss:.35});p.box(.18,.14,30,.82,.26,74,C.dark,{soft:4,trim:C.gold}).on('F',c=>rr(c,.15,.12,.7,.5,.1,C.red));}},
 table_coffee:{fp:[2,1],h:36,paint:p=>{[[.25,.3],[1.75,.3],[.25,.7],[1.75,.7]].forEach(([x,y])=>p.cyl(x,y,0,24,.04,C.gold));p.box(.12,.15,22,1.88,.85,30,C.dark,{soft:3,trim:C.gold,gloss:.45});
  p.cyl(.6,.5,30,46,.08,C.gold,{inner:'#3a6a3a'});p.ball(.6,.5,46,7,C.red);p.box(1.15,.35,30,1.55,.65,36,C.cream,{soft:2,order:1});}},
 table_dining:{fp:[2,1],h:60,paint:p=>{[[.3,.5],[1.7,.5]].forEach(([x,y])=>p.cyl(x,y,0,40,.06,C.dark));p.box(.05,.1,38,1.95,.9,46,C.white,{soft:4,gloss:.3}).on('F',c=>{c.fillStyle=rgba(C.red,.9);c.fillRect(.4,0,.2,1);});
  p.cyl(.6,.5,46,48,.14,C.white);p.cyl(1.4,.5,46,48,.14,C.white);p.cyl(1,.5,46,62,.03,C.gold);p.fn(1,.5,62,(c,q)=>{const g=c.createRadialGradient(q[0],q[1]-4,1,q[0],q[1]-4,12);g.addColorStop(0,'rgba(255,220,120,.9)');g.addColorStop(1,'rgba(255,200,100,0)');c.fillStyle=g;c.fillRect(q[0]-14,q[1]-18,28,28);c.fillStyle='#ffdf80';c.beginPath();c.ellipse(q[0],q[1]-5,2,4,0,0,7);c.fill();},{dd:.1,post:1});}},
 rug_red:{fp:[3,2],h:2,flat:1,paint:p=>p.flat(0,0,3,2,0,c=>{rr(c,.02,.03,.96,.94,.06,C.red);c.strokeStyle=C.gold;c.lineWidth=.025;c.beginPath();c.roundRect(.08,.12,.84,.76,.05);c.stroke();c.beginPath();c.ellipse(.5,.5,.16,.22,0,0,7);c.fillStyle=tone(C.red,-.25);c.fill();c.stroke();},{under:1})},
 tv:{fp:[2,1],h:110,paint:p=>{p.box(.05,.3,0,1.95,.95,30,C.dark,{soft:3,trim:C.gold}).on('F',c=>{rr(c,.05,.15,.42,.7,.05,tone(C.dark,.12));rr(c,.53,.15,.42,.7,.05,tone(C.dark,.12));knob(c,.44,.5);knob(c,.56,.5);});
  p.box(.85,.48,30,1.15,.62,36,C.black);p.box(.15,.5,34,1.85,.6,104,C.black,{soft:3,order:1}).on('F',c=>{const g=c.createLinearGradient(0,0,1,1);g.addColorStop(0,'#5a7ae0');g.addColorStop(.5,'#8a5ad0');g.addColorStop(1,'#e2525a');rr(c,.04,.07,.92,.86,.04,g);c.fillStyle='rgba(255,255,255,.28)';c.beginPath();c.moveTo(.08,.1);c.lineTo(.4,.1);c.lineTo(.18,.88);c.lineTo(.08,.88);c.fill();});}},
 fridge:{fp:[1,1],h:124,paint:p=>{p.box(.1,.12,0,.9,.92,124,'#eef0f6',{soft:5,gloss:.35}).on('F',c=>{c.fillStyle='rgba(60,60,80,.35)';c.fillRect(0,.34,1,.018);c.fillStyle=C.gold;rr(c,.8,.08,.06,.2,.03,C.gold);rr(c,.8,.42,.06,.32,.03,C.gold);c.fillStyle='#e2525a';c.beginPath();c.arc(.3,.2,.05,0,7);c.fill();c.fillStyle='#4a8ad8';c.beginPath();c.arc(.42,.16,.04,0,7);c.fill();});}},
 fridge2:{fp:[1,1],h:132,paint:p=>{p.box(.06,.1,0,.94,.92,132,'#3a3442',{soft:5,gloss:.3,trim:C.gold}).on('F',c=>{c.fillStyle='rgba(20,10,20,.6)';c.fillRect(.495,0,.012,1);rr(c,.4,.3,.04,.3,.02,C.gold);rr(c,.56,.3,.04,.3,.02,C.gold);rr(c,.12,.25,.22,.16,.03,'#5ac8ff');});}},
 counter:{fp:[2,1],h:60,paint:p=>{p.box(0,.12,0,2,1,40,C.dark,{soft:3}).on('F',c=>{for(let i=0;i<3;i++){rr(c,.03+i*.325,.12,.3,.78,.04,tone(C.dark,.12));knob(c,.18+i*.325,.25);}});
  p.box(-.02,.1,40,2.02,1.02,46,'#f2ece4',{soft:2,gloss:.45,trim:C.gold}).on('T',c=>{c.beginPath();c.ellipse(.3,.5,.14,.28,0,0,7);c.fillStyle='#9aa8b8';c.fill();c.beginPath();c.ellipse(.3,.52,.1,.2,0,0,7);c.fillStyle='#c8d8e8';c.fill();
   [[.68,.32],[.86,.32],[.68,.7],[.86,.7]].forEach(([x,y])=>{c.beginPath();c.ellipse(x,y,.06,.13,0,0,7);c.fillStyle='#2a2430';c.fill();c.strokeStyle='#e2525a';c.lineWidth=.012;c.stroke();});});
  p.cyl(.3,.22,46,64,.025,C.gold,{order:1});p.box(.26,.2,60,.34,.4,64,C.gold,{order:1});}},
 toilet:{fp:[1,1],h:62,paint:p=>{p.box(.24,.1,18,.76,.34,60,C.white,{soft:6,gloss:.4}).on('F',c=>rr(c,.4,.16,.2,.1,.05,C.gold));p.box(.3,.3,0,.7,.88,22,C.white,{soft:10,gloss:.2}).on('T',c=>{c.beginPath();c.ellipse(.5,.56,.42,.4,0,0,7);c.fillStyle='#e6e9f2';c.fill();c.beginPath();c.ellipse(.5,.58,.26,.26,0,0,7);c.fillStyle='#b9cde2';c.fill();});}},
 sink:{fp:[1,1],h:60,paint:p=>{p.cyl(.5,.55,0,36,.07,C.white);p.box(.2,.25,34,.8,.82,46,C.white,{soft:5,gloss:.4}).on('T',c=>{c.beginPath();c.ellipse(.5,.55,.3,.3,0,0,7);c.fillStyle='#c9d6e6';c.fill();});p.cyl(.5,.3,46,58,.025,C.gold,{order:1});}},
 vanity:{fp:[1,1],h:112,paint:p=>{p.box(.12,.06,48,.88,.14,112,C.gold,{soft:2}).on('F',c=>{const g=c.createLinearGradient(0,0,1,1);g.addColorStop(0,'#d8f0ff');g.addColorStop(1,'#7aa8d8');rr(c,.08,.06,.84,.88,.08,g);c.fillStyle='rgba(255,255,255,.5)';c.fillRect(.2,.1,.08,.75);});
  p.box(.08,.18,0,.92,.92,40,C.dark,{soft:3}).on('F',c=>{rr(c,.06,.15,.4,.75,.04,tone(C.dark,.12));rr(c,.54,.15,.4,.75,.04,tone(C.dark,.12));knob(c,.42,.5);knob(c,.58,.5);});
  p.box(.06,.16,40,.94,.94,46,'#f2ece4',{soft:2,gloss:.4}).on('T',c=>{c.beginPath();c.ellipse(.5,.55,.26,.3,0,0,7);c.fillStyle='#c9d6e6';c.fill();});p.cyl(.5,.26,46,58,.022,C.gold,{order:1});}},
 bathtub:{fp:[2,1],h:46,paint:p=>{[[.2,.2],[1.8,.2],[.2,.8],[1.8,.8]].forEach(([x,y])=>p.ball(x,y,0,6,C.gold));p.box(.06,.08,6,1.94,.94,42,C.white,{soft:9,gloss:.35,trim:C.gold}).on('T',c=>{const g=c.createLinearGradient(0,0,1,1);g.addColorStop(0,'#bfe8ff');g.addColorStop(1,'#6ab8e8');rr(c,.07,.14,.86,.72,.3,g);c.fillStyle='rgba(255,255,255,.75)';[[.3,.4],[.55,.6],[.7,.35]].forEach(([x,y])=>{c.beginPath();c.ellipse(x,y,.05,.09,0,0,7);c.fill();});});p.cyl(.2,.5,42,58,.03,C.gold,{order:1});}},
 // v0.3.2 default apartment: cosy honey-wood bed + the built-in glass shower (2x2, sits in the bathroom's back-right corner;
 // its back wall is the room's tiled partition). Glass panels in front of the tenant are kept in the front layer (furn front layer).
 bed_apt:{fp:[2,2],h:92,paint:p=>{bed('#b9773f','#fff7e8','#f5b83c')(p);p.box(.3,.68,34,.78,.98,52,'#ffe3a8',{soft:8,gloss:.45,order:3}).on('T',c=>{c.fillStyle='rgba(230,140,60,.5)';c.beginPath();c.ellipse(.5,.5,.18,.18,0,0,7);c.fill();});}},
 shower_glass:{fp:[2,2],h:156,paint:p=>{const GL='#cfeaff',FR='#5a5862';
  p.box(0,0,0,2,2,6,'#dfe8f1',{soft:2,gloss:.35}).on('T',c=>{c.strokeStyle='rgba(90,110,140,.35)';c.lineWidth=.012;for(let i=1;i<6;i++){c.beginPath();c.moveTo(i/6,0);c.lineTo(i/6,1);c.stroke();c.beginPath();c.moveTo(0,i/6);c.lineTo(1,i/6);c.stroke();}
   c.fillStyle='#8a96a6';c.fillRect(.66,.62,.1,.1);c.strokeStyle='#5a6272';c.lineWidth=.008;for(let i=0;i<4;i++){c.beginPath();c.moveTo(.67,.635+i*.022);c.lineTo(.75,.635+i*.022);c.stroke();}});
  // riser pipe + valve on the back wall, arm and rain head (all behind the tenant)
  p.cyl(.78,.07,6,134,.022,'#c8d0da');p.box(.62,.03,66,.86,.08,82,'#c8d0da',{soft:2,gloss:.5});p.box(.72,.05,130,.84,.5,134,'#c8d0da',{soft:1});p.cyl(.78,.5,124,130,.13,'#d8dee6',{top:'#9aa6b4'});
  // back-left glass (behind) + its posts
  p.box(0,0,6,.04,2,150,GL,{alpha:.24,gloss:.1,lit:.3,tf:.4}).on('R',c=>{c.fillStyle='rgba(255,255,255,.55)';c.fillRect(.18,.06,.05,.85);c.fillRect(.3,.06,.02,.85);});
  p.box(0,0,0,.06,.06,152,FR);p.box(0,1.94,0,.06,2,152,FR,{order:1});
  // front panels (in front of the tenant): right glass, front glass with door + handle, corner posts and top rail
  p.box(1.96,0,6,2,1.96,150,GL,{alpha:.24,gloss:.1,lit:.3,tf:.4}).on('R',c=>{c.fillStyle='rgba(255,255,255,.6)';c.fillRect(.22,.06,.05,.85);c.fillRect(.34,.06,.02,.85);});
  p.box(.06,1.96,6,1.96,2,150,GL,{alpha:.24,gloss:.1,lit:.3,tf:.4,order:1}).on('F',c=>{c.fillStyle='rgba(255,255,255,.6)';c.fillRect(.12,.06,.04,.85);c.fillRect(.2,.06,.016,.85);c.fillStyle='rgba(90,88,98,.85)';c.fillRect(.49,.02,.012,.96);c.fillStyle='#d8dee6';c.fillRect(.43,.42,.022,.2);});
  p.box(1.94,1.94,0,2,2,152,FR,{order:2});p.box(1.94,0,0,2,.06,152,FR);p.box(.04,1.95,148,2,2,154,FR,{order:2});p.box(1.95,.04,148,2,2,154,FR,{order:2});}},
 shower:{fp:[1,1],h:132,paint:p=>{p.box(0,0,0,1,1,7,C.white,{soft:2}).on('T',c=>{c.fillStyle='#b8d8ee';c.fillRect(.1,.1,.8,.8);});p.cyl(.15,.15,7,128,.025,C.gold);p.box(.15,.12,118,.5,.2,124,C.gold);
  p.box(.02,.02,7,.98,.98,128,'#bfe6ff',{alpha:.3,gloss:.1,order:2,lit:.3,tf:.4}).on('F',c=>{c.fillStyle='rgba(255,255,255,.5)';c.fillRect(.15,.05,.06,.9);c.fillRect(.27,.05,.025,.9);}).on('R',c=>{c.fillStyle='rgba(255,255,255,.4)';c.fillRect(.2,.05,.05,.9);});}},
 desk:{fp:[2,2],h:80,paint:p=>{p.box(0,.05,0,.5,.8,44,C.wood,{soft:3}).on('F',c=>{rr(c,.1,.1,.8,.35,.05,tone(C.wood,.12));rr(c,.1,.55,.8,.35,.05,tone(C.wood,.12));knob(c,.5,.27);knob(c,.5,.72);});p.box(1.5,.05,0,2,.8,44,C.wood,{soft:3});
  p.box(-.02,.02,44,2.02,.84,50,C.wood2,{soft:3,trim:C.gold,gloss:.35});p.box(1.3,.25,50,1.8,.55,52,'#2a2a34');p.box(1.32,.2,52,1.78,.26,82,'#2a2a34',{order:1}).on('F',c=>{const g=c.createLinearGradient(0,0,0,1);g.addColorStop(0,'#7ab8ff');g.addColorStop(1,'#4a5ad0');rr(c,.05,.08,.9,.84,.04,g);});
  p.cyl(.3,.3,50,72,.02,C.gold);p.fn(.3,.3,72,(c,q)=>{c.beginPath();c.moveTo(q[0]-9,q[1]+2);c.lineTo(q[0]+9,q[1]+2);c.lineTo(q[0]+5,q[1]-10);c.lineTo(q[0]-5,q[1]-10);c.closePath();c.fillStyle='#ffe08a';c.fill();},{dd:.02});
  [[.75,1.15],[1.25,1.15],[.75,1.65],[1.25,1.65]].forEach(([x,y])=>p.cyl(x,y,0,24,.03,C.dark));p.box(.68,1.08,24,1.32,1.72,31,C.red,{soft:5,gloss:.35});p.box(.68,1.62,28,1.32,1.74,72,C.dark,{soft:4,trim:C.gold}).on('B',c=>rr(c,.15,.12,.7,.5,.1,C.red));}},
 bookshelf:{fp:[2,1],h:140,paint:shelf(C.wood,C.gold,7)},bookcase_red:{fp:[2,1],h:140,paint:shelf('#8a2230',C.gold,11)},
 wardrobe_wood:{fp:[2,1],h:142,paint:p=>{p.box(0,.15,0,2,1,142,C.wood,{soft:4,trim:C.gold}).on('F',c=>{rr(c,.04,.04,.44,.9,.04,tone(C.wood,.1));rr(c,.52,.04,.44,.9,.04,tone(C.wood,.1));rr(c,.43,.4,.025,.16,.01,C.gold);rr(c,.545,.4,.025,.16,.01,C.gold);});}},
 wardrobe_black:{fp:[2,1],h:142,paint:p=>{p.box(0,.15,0,2,1,142,'#3a3340',{soft:4,trim:C.gold}).on('F',c=>{rr(c,.04,.04,.44,.9,.04,'#4a4250');rr(c,.52,.04,.44,.9,.04,'#4a4250');c.strokeStyle=C.gold;c.lineWidth=.01;c.strokeRect(.08,.08,.36,.82);c.strokeRect(.56,.08,.36,.82);rr(c,.43,.4,.025,.16,.01,C.gold);rr(c,.545,.4,.025,.16,.01,C.gold);});}},
 lamp_floor:{fp:[1,1],h:136,paint:p=>{p.cyl(.5,.5,0,5,.18,C.gold);p.cyl(.5,.5,5,104,.025,C.gold);p.cyl(.5,.5,100,132,.2,'#f6e2b0',{top:'#fff4d0'});p.fn(.5,.5,112,(c,q)=>{const g=c.createRadialGradient(q[0],q[1],4,q[0],q[1],46);g.addColorStop(0,'rgba(255,220,140,.45)');g.addColorStop(1,'rgba(255,220,140,0)');c.fillStyle=g;c.fillRect(q[0]-48,q[1]-48,96,96);},{dd:.3,post:1})}},
 lamp_warm:{fp:[1,1],h:120,paint:p=>{p.cyl(.5,.5,0,6,.16,C.dark);p.cyl(.5,.5,6,90,.03,C.dark);p.cyl(.5,.5,86,116,.24,'#e85a4a',{top:'#ffb08a'});p.fn(.5,.5,100,(c,q)=>{const g=c.createRadialGradient(q[0],q[1],4,q[0],q[1],44);g.addColorStop(0,'rgba(255,170,110,.4)');g.addColorStop(1,'rgba(255,170,110,0)');c.fillStyle=g;c.fillRect(q[0]-46,q[1]-46,92,92);},{dd:.3,post:1})}},
 plant:{fp:[1,1],h:80,paint:plant(C.dark,[C.leaf,C.leaf2],9,46,3)},plant_palm:{fp:[1,1],h:96,paint:plant('#f2ece4',['#3f9a4a','#5ab85a'],7,62,5,1)},
 plant_big:{fp:[1,1],h:120,paint:plant(C.red,['#2f8a42','#58b858','#3f9a4a'],12,80,8,1)},palm:{fp:[1,1],h:110,paint:plant(C.white,['#3f9a4a','#6cc860'],8,74,13,1)},
 roses:{fp:[1,1],h:78,paint:p=>{plant(C.gold,[C.leaf,C.leaf2],8,40,21)(p);[[.4,.45,58],[.6,.5,62],[.5,.6,54],[.55,.4,66]].forEach(([x,y,z])=>p.ball(x,y,z,6,C.red,{dd:.2}));}},
 statue_white:{fp:[1,1],h:150,paint:p=>{p.box(.15,.15,0,.85,.85,38,'#e8e2d8',{soft:2,trim:C.gold});p.cyl(.5,.5,38,100,.13,'#f2eee6');p.ball(.5,.5,100,15,'#f6f2ea');p.ball(.5,.5,128,12,'#f6f2ea');}},
 armor:{fp:[1,1],h:150,paint:p=>{p.box(.18,.18,0,.82,.82,14,C.dark,{soft:2,trim:C.gold});p.cyl(.4,.5,14,58,.07,'#8a2230');p.cyl(.6,.5,14,58,.07,'#8a2230');p.cyl(.5,.5,58,104,.2,C.red,{top:C.gold});p.ball(.5,.5,104,16,C.gold,{band:C.red});p.cyl(.24,.5,62,100,.05,C.gold);p.cyl(.76,.5,62,100,.05,C.gold);}},
 // gym
 treadmill:{fp:[2,1],h:84,run:1,paint:p=>{p.box(0,.15,0,1.75,.85,14,'#3a3442',{soft:3});p.box(.05,.25,14,1.7,.75,16,'#22202a',{gloss:.1}).on('T',c=>{c.fillStyle='rgba(255,255,255,.12)';for(let i=0;i<8;i++)c.fillRect(i/8,0,.02,1);});
  p.box(1.55,.15,0,1.95,.85,18,'#3a3442',{soft:3});p.cyl(1.82,.22,18,66,.035,C.steel);p.cyl(1.82,.78,18,66,.035,C.steel);p.box(1.7,.18,62,1.98,.82,76,C.red,{soft:3,order:1}).on('T',c=>{rr(c,.2,.2,.6,.6,.08,'#5ac8ff');});}},
 bench_black:{fp:[2,1],h:72,paint:p=>{p.cyl(.4,.5,0,22,.05,C.steel);p.cyl(1.6,.5,0,22,.05,C.steel);p.box(.15,.32,22,1.85,.68,32,'#2a2430',{soft:6,gloss:.35,trim:C.red});
  p.cyl(.2,.2,0,64,.03,C.steel);p.cyl(.2,.8,0,64,.03,C.steel);p.fn(.2,.5,62,(c,q,x)=>{const a=x.P3(.2,-.1,62),b=x.P3(.2,1.1,62);c.strokeStyle='#d8dee6';c.lineWidth=3;c.beginPath();c.moveTo(...a);c.lineTo(...b);c.stroke();[a,b].forEach(e=>{c.beginPath();c.ellipse(e[0],e[1],5,12,0,0,7);c.fillStyle='#2a2430';c.fill();c.strokeStyle=C.red;c.lineWidth=1.5;c.stroke();});},{dd:.5});}},
 bench_blue:{fp:[2,1],h:34,paint:p=>{p.cyl(.4,.5,0,20,.06,C.steel);p.cyl(1.6,.5,0,20,.06,C.steel);p.box(.1,.3,20,1.9,.7,30,'#c8323c',{soft:6,gloss:.4});}},
 ball:{fp:[1,1],h:60,paint:p=>{p.ball(.5,.5,0,26,'#8a5ad0');}},
 pullup:{fp:[1,1],h:150,paint:p=>{p.box(.05,.05,0,.95,.95,5,'#3a3442',{soft:2});p.cyl(.15,.5,5,146,.04,'#3a3442');p.cyl(.85,.5,5,146,.04,'#3a3442');p.box(.1,.45,140,.9,.55,146,C.steel,{order:1});p.box(.12,.3,70,.88,.7,76,C.red,{soft:3,order:1});}},
 speedbag:{fp:[1,1],h:150,paint:p=>{p.box(.1,.1,0,.9,.9,6,'#3a3442',{soft:2});p.cyl(.18,.18,6,146,.04,'#3a3442');p.box(.14,.14,140,.6,.22,146,'#3a3442');p.cyl(.55,.55,128,142,.008,C.steel);p.cyl(.55,.55,44,128,.17,C.red,{top:'#2a2430'});p.cyl(.55,.55,80,90,.175,C.gold,{open:1});}},
 machine_red:{fp:[1,1],h:96,run:1,paint:p=>{p.box(.2,.4,0,.8,.6,8,'#3a3442',{soft:2});p.fn(.62,.5,30,(c,q)=>{c.beginPath();c.ellipse(q[0],q[1],16,16,0,0,7);c.fillStyle='#3a3442';c.fill();c.strokeStyle=C.steel;c.lineWidth=3;c.stroke();},{dd:-.05});
  p.box(.3,.42,8,.75,.58,46,C.red,{soft:4,gloss:.35});p.cyl(.35,.5,46,58,.03,C.steel);p.box(.24,.4,56,.46,.6,62,'#2a2430',{soft:4,order:1});p.cyl(.75,.5,46,84,.03,C.steel);p.box(.7,.25,82,.8,.75,88,'#2a2430',{soft:3,order:1});}},
 kettlebell:{fp:[1,1],h:40,paint:p=>{p.box(.08,.2,0,.92,.8,10,'#3a3442',{soft:2});[[.25,'#c8323c'],[.5,'#e8b44e'],[.75,'#4a8ad8']].forEach(([x,col])=>{p.ball(x,.5,10,9,col);p.fn(x,.5,28,(c,q)=>{c.beginPath();c.arc(q[0],q[1]+2,5,Math.PI,0);c.strokeStyle='#2a2430';c.lineWidth=3;c.stroke();},{dd:.1});});}},
 dumbbells:{fp:[2,1],h:60,paint:p=>{p.box(.05,.3,0,1.95,.7,8,'#3a3442',{soft:2});p.box(.1,.35,8,.2,.65,52,'#3a3442');p.box(1.8,.35,8,1.9,.65,52,'#3a3442');p.box(.1,.32,26,1.9,.68,30,'#5a5466');p.box(.1,.32,48,1.9,.68,52,'#5a5466');
  for(let i=0;i<5;i++)for(const z of [30,52]){const x=.35+i*.32;p.fn(x,.5,z,(c,q,X)=>{const a=X.P3(x-.1,.5,z+5),b=X.P3(x+.1,.5,z+5);c.strokeStyle='#c8ccd8';c.lineWidth=2.5;c.beginPath();c.moveTo(...a);c.lineTo(...b);c.stroke();[a,b].forEach(e=>{c.beginPath();c.arc(e[0],e[1],4.5,0,7);c.fillStyle=i%2?C.red:'#2a2430';c.fill();});},{dd:.2});}}},
 lockers:{fp:[1,1],h:140,paint:p=>{p.box(.05,.2,0,.95,.95,140,C.red,{soft:3,trim:C.gold}).on('F',c=>{rr(c,.05,.03,.42,.94,.03,tone(C.red,.08));rr(c,.53,.03,.42,.94,.03,tone(C.red,.08));c.fillStyle='rgba(40,10,20,.45)';for(let i=0;i<4;i++){c.fillRect(.12,.08+i*.03,.28,.012);c.fillRect(.6,.08+i*.03,.28,.012);}knob(c,.4,.5,C.gold);knob(c,.6,.5,C.gold);});}},
 bar_counter:{fp:[2,1],h:90,paint:p=>{p.box(0,.2,0,2,1,52,'#2a2238',{soft:3}).on('F',c=>{const g=c.createLinearGradient(0,0,1,0);g.addColorStop(0,'#48eaff');g.addColorStop(1,'#c15aff');c.fillStyle=g;c.fillRect(0,.18,1,.04);c.fillRect(0,.78,1,.04);});
  p.box(-.03,.16,52,2.03,1.04,58,'#4a3a5a',{soft:2,gloss:.5,trim:'#c15aff'});[[.3,'#4aa85a'],[.55,'#e8b44e'],[1.5,'#c8323c']].forEach(([x,col])=>{p.cyl(x,.5,58,74,.05,col,{alpha:.9});p.cyl(x,.5,74,82,.02,col);});p.cyl(1.1,.6,58,64,.08,'#d8f0ff',{alpha:.7});}},
 barstool:{fp:[1,1],h:58,paint:p=>{p.cyl(.5,.5,0,4,.16,'#3a3442');p.cyl(.5,.5,4,44,.03,C.steel);p.cyl(.5,.5,44,52,.2,C.red,{top:'#e2525a'});}},
 speaker:{fp:[1,1],h:120,live:1,paint:p=>{p.box(.12,.12,0,.88,.88,118,'#26202e',{soft:4,trim:'#c15aff'}).on('F',c=>{[[.5,.3,.2],[.5,.7,.28]].forEach(([x,y,r])=>{c.beginPath();c.ellipse(x,y,r,r*.55,0,0,7);c.fillStyle='#14101a';c.fill();c.strokeStyle='#48eaff';c.lineWidth=.03;c.stroke();c.beginPath();c.ellipse(x,y,r*.35,r*.2,0,0,7);c.fillStyle='#3a3448';c.fill();});});}},
 djbooth:{fp:[4,1],h:70,live:1,paint:p=>{p.box(0,0,0,4,1,56,'#241e34',{soft:4,trim:'#c15aff'}).on('F',c=>{c.fillStyle='rgba(255,255,255,.06)';c.fillRect(.02,.1,.96,.8);});p.box(-.02,-.02,56,4.02,1.02,60,'#3a3150',{soft:2,gloss:.4});
  [[.7,.5],[3.3,.5]].forEach(([x,y])=>p.cyl(x,y,60,64,.32,'#14101a',{top:'#1e1a26'}));p.box(1.6,.2,60,2.4,.8,64,'#1a1626',{order:1});}},
};
// ---------- render + cache (with a dark sticker outline like the tenant chibis) ----------
const cache=new Map();
function render(k,r,eu,layer){const def=DEF[k];if(!def)return null;const key=k+'|'+r+'|'+eu[0]+'|'+(layer?layer.map(v=>v.toFixed(2)).join(','):'');if(cache.has(key))return cache.get(key);
 const ctx=mk(def,r,eu);def.paint(ctx);
 // front layer: only the parts in front of a tenant sitting/lying at grid point layer=[u,v] (arms, blanket)
 if(layer){const [lu,lv,ax]=layer;const keep=ctx.items.filter(it=>it.bb&&(ax!=null?it.bb[ax]>=(ax?lv:lu)-.001:(it.bb[0]>=lu-.001||it.bb[1]>=lv+.2)));ctx.items.length=0;ctx.items.push(...keep);}
 // bounds from the footprint and height
 const [W,D]=def.fp,gw=r%2?D:W,gh=r%2?W:D,pts=[[0,0],[gw,0],[gw,gh],[0,gh]].map(([a,b])=>[a*eu[0]-b*eu[0],a*eu[1]+b*eu[1]]);
 const pad=34,x0=Math.min(...pts.map(p=>p[0]))-pad,x1=Math.max(...pts.map(p=>p[0]))+pad,y0=Math.min(...pts.map(p=>p[1]))-(def.h+20)*ctx.KZ-pad,y1=Math.max(...pts.map(p=>p[1]))+pad;
 const cw=Math.ceil((x1-x0)*CS),chh=Math.ceil((y1-y0)*CS),cv=document.createElement('canvas');cv.width=cw;cv.height=chh;const c=cv.getContext('2d');c.scale(CS,CS);c.translate(-x0,-y0);
 // soft contact shadow
 if(!def.flat&&!layer){const m=[(pts[0][0]+pts[2][0])/2,(pts[0][1]+pts[2][1])/2],sw=Math.abs(pts[1][0]-pts[3][0])*.5;const g=c.createRadialGradient(m[0],m[1],2,m[0],m[1],sw);g.addColorStop(0,'rgba(20,10,20,.38)');g.addColorStop(1,'rgba(20,10,20,0)');c.save();c.translate(m[0],m[1]);c.scale(1,.5);c.translate(-m[0],-m[1]);c.fillStyle=g;c.beginPath();c.arc(m[0],m[1],sw,0,7);c.fill();c.restore();}
 const shadowLayer=c.getImageData(0,0,cw,chh);
 c.clearRect(-1e4,-1e4,2e4,2e4);
  const order=isoSort(ctx.items);order.forEach(it=>{if(!it.post)it.draw(c,ctx);});
 // sticker outline: dilate the alpha by ~2 world px in the outline colour, keep translucent glass see-through
 const im=c.getImageData(0,0,cw,chh),a=im.data,n=cw*chh,A=new Uint8Array(n);for(let i=0;i<n;i++)A[i]=a[i*4+3]>24?1:0;
 const R=Math.round(2.2*CS),offs=[];for(let dy=-R;dy<=R;dy++)for(let dx=-R;dx<=R;dx++)if(dx*dx+dy*dy<=R*R+1)offs.push([dx,dy]);
 const [orr,og,ob]=hx(OUT),out=new ImageData(cw,chh),o=out.data,s=shadowLayer.data;
 for(let y=0;y<chh;y++)for(let x=0;x<cw;x++){const i=y*cw+x,p=i*4;
  if(A[i]){const al=a[p+3]/255;// composite piece over (outline beneath translucent pixels only where it is the rim)
   o[p]=a[p];o[p+1]=a[p+1];o[p+2]=a[p+2];o[p+3]=a[p+3];if(al<.95){// glass: show shadow underneath
    const sa=s[p+3]/255;o[p+3]=Math.min(255,a[p+3]+s[p+3]*(1-al));}continue;}
  let hit=false;for(const [dx,dy] of offs){const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=cw||yy>=chh)continue;if(A[yy*cw+xx]){hit=true;break;}}
  if(hit){o[p]=orr;o[p+1]=og;o[p+2]=ob;o[p+3]=235;}else{o[p]=s[p];o[p+1]=s[p+1];o[p+2]=s[p+2];o[p+3]=s[p+3];}}
 c.putImageData(out,0,0);order.forEach(it=>{if(it.post)it.draw(c,ctx);});
 const res={cv,ox:x0,oy:y0,w:cw/CS,h:chh/CS};cache.set(key,res);return res;}
const thumbs={};function thumb(k){if(thumbs[k])return thumbs[k];const r=render(k,1,[45,22.5]);if(!r)return'';thumbs[k]=r.cv.toDataURL();return thumbs[k];}
return{DEF,render,thumb,C,tone,H:{rr,knob,sofa,bed,shelf,plant,tone2,rgba,rnd,hx}};})();
