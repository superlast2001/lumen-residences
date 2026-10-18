'use strict';
// Gym-goer / club-goer chibis, PAINTED to match the tenants' sheet chibis: ~2.3-head proportions, big glossy anime eyes,
// soft gradient shading with a cel shadow and rim light on every part, and a clean dark sticker outline around the
// silhouette (plus thinner inner lines), at the same on-screen height as the tenants. Original designs (not tenant copies).
// Frames are painted once into a cache (12-step loops per activity), then blitted.
const OL='#35202a',OW=1.25;
const hx2=c=>{const n=parseInt(c.slice(1),16);return[n>>16,n>>8&255,n&255];};
const tn=(c,f)=>{let [r,g,b]=hx2(c);const t=f<0?0:255,a=Math.abs(f);const q=v=>Math.round(v+(t-v)*a).toString(16).padStart(2,'0');return'#'+q(r)+q(g)+q(b);};
const mshade=(c,a)=>{const n=parseInt(c.slice(1),16);let r=n>>16,g=n>>8&255,bl=n&255;const f=v=>Math.max(0,Math.min(255,Math.round(v*a)));return'#'+((1<<24)|(f(r)<<16)|(f(g)<<8)|f(bl)).toString(16).slice(1);};
const SKIN={pale:'#ffe4d2',fair:'#ffd2b4',tan:'#e9a97e',olive:'#cf9466',brown:'#a5653f',deep:'#764327'};
// tiny dumbbell (used by the tenants' "fit" thought bubble too)
function dumbbell(c,x,y,ang,col='#3a3a46'){c.save();c.translate(x,y);c.rotate(ang);c.lineCap='round';c.strokeStyle=OL;c.lineWidth=2.6;c.beginPath();c.moveTo(-3.4,0);c.lineTo(3.4,0);c.stroke();c.strokeStyle='#c8ccd6';c.lineWidth=1.2;c.stroke();
 [-3.6,3.6].forEach(d=>{c.beginPath();c.roundRect(d-1.4,-2.7,2.8,5.4,1);c.fillStyle=col;c.fill();c.strokeStyle=OL;c.lineWidth=.8;c.stroke();});c.restore();}
// ---- painting primitives ----
function grad(c,col,x0,y0,x1,y1,k=.2){const g=c.createLinearGradient(x0,y0,x1,y1);g.addColorStop(0,tn(col,k));g.addColorStop(.5,col);g.addColorStop(1,tn(col,-k*1.1));return g;}
// a filled part: inner line, gradient fill, cel shadow (lower-right crescent) and rim light (upper-left crescent)
function paint(c,fn,col,o={}){const [x0,y0,x1,y1]=o.box||[-30,-120,30,0];
 c.beginPath();fn(c);if(o.line!==0){c.lineWidth=OW*(o.lw||1)*1.5;c.strokeStyle=OL;c.lineJoin='round';c.stroke();}
 c.fillStyle=o.flat?col:grad(c,col,x0,y0,x1,y1,o.k||.18);c.fill();
 if(o.cel!==0){const [sx,sy]=o.cel||[-3.2,-2.6];c.save();c.beginPath();fn(c);c.clip();c.beginPath();c.rect(-300,-400,600,600);c.save();c.translate(sx,sy);fn(c);c.restore();c.fillStyle=o.sc||'rgba(70,20,60,.24)';c.fill('evenodd');
  c.beginPath();c.rect(-300,-400,600,600);c.save();c.translate(1.4,1.6);fn(c);c.restore();c.fillStyle=o.rim||'rgba(255,250,240,.38)';c.fill('evenodd');c.restore();}}
function limb(c,pts,w,col,pass,o={}){c.lineCap='round';c.lineJoin='round';c.beginPath();c.moveTo(...pts[0]);for(let i=1;i<pts.length;i++)c.lineTo(...pts[i]);
 if(pass==0){c.lineWidth=w+OW*3;c.strokeStyle=OL;c.stroke();return;}
 c.lineWidth=w+OW*1.5;c.strokeStyle=OL;c.stroke();const a=pts[0],b=pts[pts.length-1],nx=-(b[1]-a[1]),ny=b[0]-a[0],L=Math.hypot(nx,ny)||1,g=c.createLinearGradient(a[0]-nx/L*w/2,a[1]-ny/L*w/2,a[0]+nx/L*w/2,a[1]+ny/L*w/2);
 g.addColorStop(0,tn(col,-.2));g.addColorStop(.35,col);g.addColorStop(.75,tn(col,.16));g.addColorStop(1,tn(col,-.1));c.lineWidth=w;c.strokeStyle=o.flat?col:g;c.stroke();}
const ell=(x,y,rx,ry,r=0)=>c=>c.ellipse(x,y,rx,ry,r,0,Math.PI*2);
const rrect=(x,y,w,h,r)=>c=>c.roundRect(x,y,w,h,r);
// ---- poses: joints for each activity at loop phase p (0..1) ----
function joints(s,act,p,walk){const bk=s.bulk?1:0,W=bk?19:15,S=Math.sin(p*Math.PI*2),C=Math.cos(p*Math.PI*2),A=Math.abs(S);
 const sh=[[-W+2,-59],[W-2,-59]],hip=[[-7,-37],[7,-37]];let by=Math.sin(p*Math.PI*2)*.6,lean=0,mood='smile',turn=0,prop=null,arms,legs,hy=0;
 const hang=(i,dx=0,dy=0)=>{const x=i?1:-1;return[sh[i],[x*(W+3)+dx*x,-47+dy],[x*(W+4)+dx*x,-36+dy]];};
 const stand=(i,lift=0,kx=0)=>{const x=i?1:-1;return[hip[i],[x*(8+kx),-20-lift*.6],[x*8.5,-5-lift]];};
 arms=[hang(0),hang(1)];legs=[stand(0),stand(1)];
 if(walk){turn=1;const q=S;by=-A*2;legs=[stand(0,Math.max(0,q)*5,Math.max(0,q)*1.5),stand(1,Math.max(0,-q)*5,Math.max(0,-q)*1.5)];arms=[hang(0,0,-q*3),hang(1,0,q*3)];mood='smile';return{by,lean,mood,turn,prop,arms,legs,sh,hip,W};}
 switch(act){
 case'run':{turn=1;by=-A*3.5;lean=2;legs=[stand(0,Math.max(0,S)*8,Math.max(0,S)*3),stand(1,Math.max(0,-S)*8,Math.max(0,-S)*3)];
  arms=[[sh[0],[-W-2,-50],[-W+3+S*3,-58-S*3]],[sh[1],[W+2,-50],[W-3-S*3,-58+S*3]]];mood='grit';break;}
 case'squat':{const d=(1-C)/2;by=d*11;legs=[[hip[0],[-15,-21+d*6],[-10,-5]],[hip[1],[15,-21+d*6],[10,-5]]];
  arms=[[sh[0],[-W-9,-66],[-W-3,-73]],[sh[1],[W+9,-66],[W+3,-73]]];prop={k:'bar',y:-74};mood=d>.6?'grit':'focus';break;}
 case'curl':{const d=(1-C)/2;arms=[hang(0),[sh[1],[W+3,-46],[W+6-d*3,-36-d*22]]];prop={k:'db',arm:1};mood=d>.6?'grit':'focus';break;}
 case'punch':{turn=1;const L=S>0;by=-A*1.5;arms=[[sh[0],[-W+2,-50],L?[-W-6,-60]:[-8,-66]],[sh[1],[W+8,-58],L?[W-2,-66]:[W+24,-60]]];prop={k:'gloves'};mood='grit';break;}
 case'yoga':{by=0;lean=S*1.2;arms=[[sh[0],[-13,-90],[-3,-110]],[sh[1],[13,-90],[3,-110]]];legs=[stand(0),[hip[1],[16,-28],[4,-27]]];mood='calm';break;}
 case'pullup':{const d=(1-C)/2;by=-d*12;arms=[[sh[0],[-W-6,-80+d*8],[-W+1,-112+d*12]],[sh[1],[W+6,-80+d*8],[W-1,-112+d*12]]];legs=[[hip[0],[-6,-22],[-4,-10]],[hip[1],[6,-22],[4,-10]]];mood=d>.5?'grit':'focus';break;}
 case'water':{const up=p<.45?Math.sin(p/.45*Math.PI):0;arms=[hang(0),[sh[1],[W+5,-50-up*6],[W-1-up*9,-46-up*28]]];prop={k:'bottle',up};mood=up>.5?'drink':'smile';break;}
 case'row':case'pedal':{turn=0;by=A*1.2;legs=[stand(0,Math.max(0,S)*5),stand(1,Math.max(0,-S)*5)];arms=[[sh[0],[-W-2,-52],[-10,-58+S*2]],[sh[1],[W+2,-52],[10,-58-S*2]]];mood='focus';break;}
 case'stretch':{lean=S*4;arms=[[sh[0],[-14+S*4,-92],[-5+S*8,-110]],[sh[1],[14+S*4,-92],[5+S*8,-110]]];mood='calm';break;}
 case'dance':{by=-A*4;lean=S*3;const k=Math.floor(p*2);arms=k?[[sh[0],[-W-10,-74],[-W-6,-96+S*4]],[sh[1],[W+8,-52],[W+2,-62]]]:[[sh[0],[-W-8,-52],[-W-2,-62]],[sh[1],[W+10,-74],[W+6,-96-S*4]]];
  legs=[stand(0,Math.max(0,S)*4,2),stand(1,Math.max(0,-S)*4,2)];mood='joy';break;}
 case'cheer':{const d=(1-C)/2;by=-d*3;arms=[hang(0),[sh[1],[W+8,-70-d*6],[W+4,-90-d*12]]];mood='joy';break;}
 case'drink':{lean=S*1.5;arms=[hang(0),[sh[1],[W+5,-48],[W-4,-56]]];prop={k:'glass'};mood='smile';break;}
 case'coachme':default:{mood=(p<.5)?'smile':'happy';}}
 return{by,lean,mood,turn,prop,arms,legs,sh,hip,W};}
// ---- hair ----
const BANGS={def:[[1,5],[.78,-3],[.58,2],[.34,-6],[.12,1],[-.12,-7],[-.36,0],[-.6,-5],[-.82,3],[-1,5]],
 side:[[1,8],[.8,0],[.5,-8],[.2,-12],[-.2,-13],[-.6,-12],[-.85,-6],[-1,2]],buzz:[[1,-4],[.5,-11],[0,-12],[-.5,-11],[-1,-4]],
 curl:[[1,4],[.8,-2],[.6,3],[.4,-3],[.2,2],[0,-4],[-.2,2],[-.4,-3],[-.6,3],[-.8,-2],[-1,4]]};
function capPath(hx,hy,R,spiky,bangs,side=4){return c=>{c.moveTo(hx-R-2,hy+side);
 if(spiky){const n=11;for(let i=0;i<=n;i++){const a=Math.PI+.12+(Math.PI-.24)*i/n,r=i%2?R+12:R+3.5;c.lineTo(hx+Math.cos(a)*r,hy-2+Math.sin(a)*r);}}
 else c.ellipse(hx,hy-1,R+2.6,R+2.2,0,Math.PI+.12,Math.PI*2-.12);
 c.lineTo(hx+R+2,hy+side);const B=bangs||BANGS.def;B.forEach(([x,y],i)=>{const px=hx+x*R*.98,py=hy+y;if(i==0)c.lineTo(px,py);else{const [x0,y0]=B[i-1];c.quadraticCurveTo(hx+(x0+x)/2*R,hy+Math.min(y0,y)-3,px,py);}});c.closePath();};}
function hairParts(s,hx,hy,R,back,t){const col=s.hc,P=[],B=[];const add=(fn,o={})=>P.push({fn,o}),addB=(fn,o={})=>B.push({fn,o});const h=s.hair;
 if(back){// seen from behind: the whole head is hair
  addB(ell(hx,hy-1,R+2.6,R+2.4));
  if(h=='long'||h=='braids')addB(rrect(hx-R-3,hy-6,2*R+6,46,[4,4,14,14]));if(h=='bob')addB(rrect(hx-R-4,hy-8,2*R+8,30,[6,6,14,14]));
  if(h=='ponytail')addB(ell(hx,hy+20,7,15));if(h=='twinbuns'){addB(ell(hx-19,hy-22,9,9));addB(ell(hx+19,hy-22,9,9));}
  if(h=='afro')addB(ell(hx,hy-6,R+11,R+9));if(h=='spiky')addB(capPath(hx,hy,R,1,[[1,10],[0,14],[-1,10]],10));if(h=='mohawk')addB(c=>{c.moveTo(hx-6,hy-20);for(let i=0;i<=6;i++){const y=hy-22-i*0;c.lineTo(hx-6+i*2,hy-30-(i%2?10:4));}c.lineTo(hx+6,hy-20);c.closePath();});
  return{back:B,front:[]};}
 switch(h){
 case'long':addB(rrect(hx-R-3,hy-10,2*R+6,48,[6,6,16,16]));add(capPath(hx,hy,R,0));add(c=>{c.moveTo(hx-R-2,hy);c.quadraticCurveTo(hx-R-5,hy+20,hx-R+2,hy+30);c.lineTo(hx-R+7,hy+12);c.closePath();c.moveTo(hx+R+2,hy);c.quadraticCurveTo(hx+R+5,hy+20,hx+R-2,hy+30);c.lineTo(hx+R-7,hy+12);c.closePath();});break;
 case'bob':addB(rrect(hx-R-5,hy-12,2*R+10,30,[8,8,12,12]));add(capPath(hx,hy,R,0,BANGS.def,12));break;
 case'ponytail':{const sw=Math.sin(t*3)*3;addB(c=>{c.moveTo(hx+R*.5,hy-14);c.quadraticCurveTo(hx+R+16+sw,hy-6,hx+R+8+sw,hy+22);c.quadraticCurveTo(hx+R+2,hy+6,hx+R*.3,hy-6);c.closePath();});add(capPath(hx,hy,R,0));add(ell(hx+R*.62,hy-15,3.5,3.5),{tie:1});break;}
 case'buzz':add(capPath(hx,hy,R-1.5,0,BANGS.buzz,-2),{k:.1});break;
 case'afro':addB(c=>{for(let i=0;i<9;i++){const a=Math.PI*.9+i*Math.PI*1.2/8;c.moveTo(hx+Math.cos(a)*(R+3)+10,hy-6+Math.sin(a)*(R+3));c.arc(hx+Math.cos(a)*(R+3),hy-6+Math.sin(a)*(R+3),10,0,Math.PI*2);}});add(capPath(hx,hy,R,0,BANGS.curl,0));break;
 case'mohawk':add(capPath(hx,hy,R-1.5,0,BANGS.buzz,-2),{dim:1});add(c=>{c.moveTo(hx-7,hy-19);const n=7;for(let i=0;i<=n;i++){const x=hx-7+i*14/n;c.lineTo(x,hy-26-(i%2?16:7)-Math.sin(i/n*Math.PI)*6);}c.lineTo(hx+7,hy-19);c.closePath();});break;
 case'sidepart':add(capPath(hx,hy,R,0,BANGS.side));break;
 case'curly':add(c=>{for(let i=0;i<10;i++){const a=Math.PI+.05+i*(Math.PI-.1)/9;c.moveTo(hx+Math.cos(a)*(R+1)+7,hy-2+Math.sin(a)*(R+1));c.arc(hx+Math.cos(a)*(R+1),hy-2+Math.sin(a)*(R+1),7,0,Math.PI*2);}});add(capPath(hx,hy,R,0,BANGS.curl));break;
 case'braids':addB(rrect(hx-R-2,hy-10,2*R+4,24,[6,6,6,6]));add(capPath(hx,hy,R,0));[-1,1].forEach(d=>{for(let i=0;i<4;i++)add(ell(hx+d*(R-2),hy+12+i*8,4.6,5));});break;
 case'twinbuns':addB(ell(hx-20,hy-23,9.5,9.5));addB(ell(hx+20,hy-23,9.5,9.5));add(capPath(hx,hy,R,0));break;
 case'spiky':default:add(capPath(hx,hy,R,1));}
 return{back:B,front:P};}
// ---- the face ----
function face(c,s,hx,hy,mood,blink,turn){const fx=hx+turn*4.5,ey=hy+5,dx=10.5;const ec=s.eye||'#5a3a2a';
 const closed=blink||mood=='calm'||mood=='joy'||mood=='drink';
 // brows
 c.strokeStyle=tn(s.hc,-.25);c.lineWidth=2;c.lineCap='round';const ang=mood=='grit'||mood=='focus'?2.2:-.6;
 [-1,1].forEach(d=>{c.beginPath();c.moveTo(fx+d*dx-d*4,ey-11+ang*(d<0?-1:-1)*-.5);c.quadraticCurveTo(fx+d*dx,ey-13.5,fx+d*dx+d*4,ey-11.5+(mood=='grit'||mood=='focus'?-1.6:0));c.stroke();});
 [-1,1].forEach(d=>{const x=fx+d*dx*(turn&&d<0?.86:1),w=(turn&&d<0)?4:4.8;
  if(closed){c.strokeStyle=OL;c.lineWidth=2.2;c.beginPath();c.moveTo(x-w,ey+1);c.quadraticCurveTo(x,ey-5,x+w,ey+1);c.stroke();return;}
  c.beginPath();c.ellipse(x,ey,w,6,0,0,Math.PI*2);c.fillStyle='#fffaf6';c.fill();
  const ig=c.createLinearGradient(0,ey-5,0,ey+6);ig.addColorStop(0,tn(ec,-.45));ig.addColorStop(.55,ec);ig.addColorStop(1,tn(ec,.45));
  c.save();c.beginPath();c.ellipse(x,ey,w,6,0,0,Math.PI*2);c.clip();c.beginPath();c.ellipse(x+turn*.8,ey+.6,w*.82,5.5,0,0,Math.PI*2);c.fillStyle=ig;c.fill();
  c.beginPath();c.ellipse(x+turn*.8,ey+.8,w*.38,2.8,0,0,Math.PI*2);c.fillStyle=tn(ec,-.7);c.fill();c.restore();
  c.fillStyle='#fff';c.beginPath();c.ellipse(x-1.5,ey-2.4,1.7,2,0,0,Math.PI*2);c.fill();c.beginPath();c.arc(x+1.8,ey+2.3,.9,0,Math.PI*2);c.fill();
  c.strokeStyle=OL;c.lineWidth=2.3;c.beginPath();c.ellipse(x,ey,w+.3,6.2,0,Math.PI*1.08,Math.PI*1.92);c.stroke();
  if(s.lash){c.lineWidth=1.6;c.beginPath();c.moveTo(x+d*(w-.5),ey-3.5);c.lineTo(x+d*(w+2.2),ey-5.5);c.stroke();}});
 // blush, nose, mouth
 c.fillStyle='rgba(255,110,130,.32)';[-1,1].forEach(d=>{c.beginPath();c.ellipse(fx+d*14.5,hy+12,4.6,2.4,0,0,Math.PI*2);c.fill();});
 c.fillStyle='rgba(120,50,40,.5)';c.beginPath();c.ellipse(fx+turn*1.5,hy+11,1,.8,0,0,7);c.fill();
 const my=hy+16;c.strokeStyle=OL;c.lineWidth=1.6;
 if(mood=='happy'||mood=='joy'){c.beginPath();c.moveTo(fx-4,my-1);c.quadraticCurveTo(fx,my+6,fx+4,my-1);c.closePath();c.fillStyle='#8a2a3a';c.fill();c.stroke();c.fillStyle='#ff8aa0';c.beginPath();c.ellipse(fx,my+2.6,2,1.2,0,0,7);c.fill();}
 else if(mood=='grit'){c.beginPath();c.roundRect(fx-4.5,my-1.5,9,4,1.6);c.fillStyle='#fff';c.fill();c.stroke();c.beginPath();c.moveTo(fx-4.5,my+.5);c.lineTo(fx+4.5,my+.5);c.lineWidth=.8;c.stroke();
  c.fillStyle='rgba(140,210,255,.9)';c.beginPath();c.moveTo(hx+20,hy-6);c.quadraticCurveTo(hx+23,hy,hx+20,hy+1.5);c.quadraticCurveTo(hx+17,hy,hx+20,hy-6);c.fill();}
 else if(mood=='focus'){c.beginPath();c.moveTo(fx-3,my);c.lineTo(fx+3,my);c.stroke();}
 else if(mood=='drink'){c.beginPath();c.ellipse(fx+1,my,2,1.6,0,0,7);c.fillStyle='#8a2a3a';c.fill();}
 else{c.beginPath();c.moveTo(fx-3.5,my-.5);c.quadraticCurveTo(fx,my+3,fx+3.5,my-.5);c.stroke();}
 if(s.beard){c.fillStyle='rgba(40,25,25,.28)';c.beginPath();c.ellipse(fx,hy+16,12,7,0,0,Math.PI);c.fill();}
 if(s.glasses){c.strokeStyle=s.glasses;c.lineWidth=1.6;[-1,1].forEach(d=>{c.beginPath();c.roundRect(fx+d*dx-6,ey-6,12,11,4);c.stroke();});c.beginPath();c.moveTo(fx-4.5,ey-1);c.lineTo(fx+4.5,ey-1);c.stroke();}}
// ---- whole figure for one frame ----
function paintNpc(c,s,act,p,walk,back){const J=joints(s,walk?'walk':act,p,walk),sk=SKIN[s.skin]||SKIN.fair,{W}=J,bk=s.bulk?1:0,aw=bk?12:10,lw=bk?14:12.5;
 const L=[];const P=(fn,col,o)=>L.push({t:'p',fn,col,o:o||{}}),Lm=(pts,w,col,o)=>L.push({t:'l',pts,w,col,o:o||{}}),D=fn=>L.push({t:'d',fn});
 c.save();c.translate(J.lean*.6,J.by);
 const tc=s.tc||'#5a8aff',bc=s.bc||'#2a2a3a',hy=-89+(J.hy||0),hx=J.lean*.5,R=29;const H=hairParts(s,hx,hy,R,back,p*6.28);
 const gloves=J.prop&&J.prop.k=='gloves';
 // back hair, back arms when seen from behind
 if(!back)H.back.forEach(h=>P(h.fn,s.hc,{box:[hx-20,hy-30,hx+20,hy+30],k:.24}));
 if(J.prop&&J.prop.k=='bar')D(c=>{const y=J.prop.y;c.lineCap='round';c.strokeStyle=OL;c.lineWidth=5;c.beginPath();c.moveTo(-46,y);c.lineTo(46,y);c.stroke();c.strokeStyle='#d8dee6';c.lineWidth=2.6;c.stroke();
  [-1,1].forEach(d=>{[38,31].forEach((x,i)=>{c.beginPath();c.roundRect(d*x-3.5,y-(i?8:11),7,i?16:22,2.5);c.fillStyle=i?'#e2525a':'#3a3442';c.fill();c.strokeStyle=OL;c.lineWidth=1.6;c.stroke();});});});
 // legs (skin, then leggings / socks), shoes
 J.legs.forEach(l=>Lm(l,lw,sk));
 if(s.bottom=='leggings')J.legs.forEach(l=>Lm([l[0],l[1],[l[2][0],l[2][1]-2]],lw+.6,bc));
 if(s.socks)J.legs.forEach(l=>Lm([[l[2][0],l[2][1]-6],[l[2][0],l[2][1]-1]],lw+.4,s.socks));
 J.legs.forEach(l=>{const [x,y]=l[2];P(ell(x+(x<0?-1.5:1.5),y+1.5,7.6,5),s.shoe||'#ffffff',{box:[x-7,y-4,x+7,y+6]});D(c=>{c.fillStyle='rgba(255,255,255,.55)';c.beginPath();c.ellipse(x+(x<0?-3:0),y-.5,2.6,1.2,0,0,7);c.fill();});});
 if(s.bottom=='leggings'&&s.stripe)J.legs.forEach(l=>D(c=>{c.strokeStyle=s.stripe;c.lineWidth=1.6;c.beginPath();const sx=l[0][0]<0?-4:4;c.moveTo(l[0][0]+sx,l[0][1]+2);c.lineTo(l[1][0]+sx,l[1][1]);c.lineTo(l[2][0]+sx*.8,l[2][1]-3);c.stroke();}));
 // torso
 const torso=c=>{c.moveTo(-W,-56);c.quadraticCurveTo(-W,-63,-W+5,-63);c.lineTo(W-5,-63);c.quadraticCurveTo(W,-63,W,-56);c.lineTo(W-3.5,-38);c.quadraticCurveTo(W-3.5,-33,W-7,-33);c.lineTo(-W+7,-33);c.quadraticCurveTo(-W+3.5,-33,-W+3.5,-38);c.closePath();};
 const crop=c=>{c.moveTo(-W,-56);c.quadraticCurveTo(-W,-63,-W+5,-63);c.lineTo(W-5,-63);c.quadraticCurveTo(W,-63,W,-56);c.lineTo(W-1.5,-47);c.lineTo(-W+1.5,-47);c.closePath();};
 const tb=[-W,-63,W,-33];
 if(s.top=='crop'||s.top=='tank'){P(torso,sk,{box:tb});if(!back&&s.top=='crop')D(c=>{c.strokeStyle='rgba(120,60,50,.35)';c.lineWidth=1;c.beginPath();c.moveTo(-4,-42);c.quadraticCurveTo(0,-40,4,-42);c.stroke();});}
 if(s.top=='crop')P(crop,tc,{box:tb});else if(s.top=='tank')P(c=>{c.moveTo(-W+5,-63);c.lineTo(-W+9,-63);c.quadraticCurveTo(0,-52,W-9,-63);c.lineTo(W-5,-63);c.quadraticCurveTo(W-1,-50,W-3.5,-38);c.quadraticCurveTo(W-3.5,-33,W-7,-33);c.lineTo(-W+7,-33);c.quadraticCurveTo(-W+3.5,-33,-W+3.5,-38);c.quadraticCurveTo(-W+1,-50,-W+5,-63);c.closePath();},tc,{box:tb});
 else P(torso,tc,{box:tb});
 if(s.top=='hoodie'&&!back)D(c=>{c.fillStyle=tn(tc,-.25);c.beginPath();c.ellipse(0,-62,11,4,0,0,7);c.fill();c.strokeStyle='#fff';c.lineWidth=1.1;c.beginPath();c.moveTo(-3,-60);c.lineTo(-3.5,-52);c.moveTo(3,-60);c.lineTo(3.5,-52);c.stroke();c.strokeStyle=tn(tc,-.35);c.lineWidth=1;c.beginPath();c.roundRect(-8,-44,16,7,3);c.stroke();});
 if(s.logo&&!back)D(c=>{const y=s.top=='crop'?-55:-52;c.fillStyle=s.logo;c.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?2:4.6;c.lineTo(Math.cos(a)*r,y+Math.sin(a)*r);}c.closePath();c.fill();});
 // shorts
 if(s.bottom=='shorts')P(c=>{c.moveTo(-W+3.5,-40);c.lineTo(W-3.5,-40);c.lineTo(W-1,-25);c.quadraticCurveTo(W-1,-22,W-4,-22);c.lineTo(2,-22);c.lineTo(0,-30);c.lineTo(-2,-22);c.lineTo(-W+4,-22);c.quadraticCurveTo(-W+1,-22,-W+1,-25);c.closePath();},bc,{box:[-W,-40,W,-22]});
 else P(rrect(-W+3.5,-41,2*W-7,7,3),tn(bc,.1),{box:[-W,-41,W,-34]});
 // neck
 P(rrect(-5,-68,10,8,3),tn(sk,-.08),{cel:0,box:[-5,-68,5,-60]});
 // arms (behind the head when raised overhead)
 const armUp=J.arms.some(a=>a[2][1]<-92);
 const arms=()=>{J.arms.forEach(a=>{Lm(a,aw,sk);if(s.top=='hoodie')Lm([a[0],a[1],[a[1][0]+(a[2][0]-a[1][0])*.8,a[1][1]+(a[2][1]-a[1][1])*.8]],aw+1.2,tc);else if(s.top=='tee')Lm([a[0],[a[0][0]+(a[1][0]-a[0][0])*.55,a[0][1]+(a[1][1]-a[0][1])*.55]],aw+3,tc);
   const [x,y]=a[2];if(s.wrist&&!gloves)Lm([[a[1][0]+(x-a[1][0])*.7,a[1][1]+(y-a[1][1])*.7],[a[1][0]+(x-a[1][0])*.85,a[1][1]+(y-a[1][1])*.85]],aw+1.4,s.wrist);
   P(ell(x,y,gloves?7:bk?5.8:5,gloves?6.5:bk?5.6:5),gloves?'#e2323c':sk,{box:[x-6,y-6,x+6,y+6]});});};
 if(armUp)arms();
 // head
 if(!back)[-1,1].forEach(d=>P(ell(hx+d*(R-1)+J.turn*2,hy+6,4.5,6),sk,{box:[hx-30,hy,hx+30,hy+12],cel:0}));
 P(c=>c.ellipse(hx,hy,R,R-2.5,0,0,Math.PI*2),sk,{box:[hx-R,hy-R,hx+R,hy+R],k:.12,cel:[-3.6,-3.4]});
 if(back)H.back.forEach(h=>P(h.fn,s.hc,{box:[hx-20,hy-34,hx+20,hy+20],k:.24}));
 if(!back)D(c=>face(c,s,hx,hy,J.mood,((p*9+(s.seed||0))%5)<.22&&J.mood!='grit',J.turn));
 H.front.forEach(h=>P(h.fn,h.o.tie?(s.band||'#e2525a'):h.o.dim?tn(s.hc,-.1):s.hc,{box:[hx-16,hy-34,hx+16,hy+10],k:h.o.k||.26,rim:'rgba(255,255,255,.4)'}));
 if(!back&&H.front.length)D(c=>{c.save();c.beginPath();H.front.forEach(h=>h.fn(c));c.clip();c.strokeStyle='rgba(255,255,255,.42)';c.lineWidth=3;c.lineCap='round';c.beginPath();c.arc(hx-2,hy+2,R-4,Math.PI*1.18,Math.PI*1.4);c.stroke();c.beginPath();c.arc(hx-2,hy+2,R-4,Math.PI*1.5,Math.PI*1.62);c.stroke();c.restore();});
 if(s.band)P(c=>{c.moveTo(hx-R-1,hy-8);c.quadraticCurveTo(hx,hy-17,hx+R+1,hy-8);c.lineTo(hx+R+1,hy-3);c.quadraticCurveTo(hx,hy-12,hx-R-1,hy-3);c.closePath();},s.band,{box:[hx-R,hy-15,hx+R,hy-3],cel:0});
 if(s.cap)P(c=>{c.ellipse(hx,hy-8,R+1.5,R-6,0,Math.PI,Math.PI*2);c.closePath();if(!back){c.moveTo(hx-4,hy-9);c.quadraticCurveTo(hx+20,hy-14,hx+R+12,hy-6);c.quadraticCurveTo(hx+18,hy-4,hx-4,hy-9);}},s.cap,{box:[hx-R,hy-30,hx+R,hy-4]});
 if(s.earbuds&&!back)D(c=>{[-1,1].forEach(d=>{c.fillStyle='#fff';c.beginPath();c.arc(hx+d*(R-1),hy+7,2.4,0,7);c.fill();c.strokeStyle=OL;c.lineWidth=1;c.stroke();});});
 if(s.towel)Lm([[-W+3,-64],[-6,-58],[0,-56],[6,-58],[W-3,-64]],5,s.towel);
 if(!armUp)arms();
 // props in hand
 if(J.prop&&J.prop.k=='db'){const [x,y]=J.arms[1][2];D(c=>{c.save();c.translate(x,y);c.scale(1.9,1.9);dumbbell(c,0,0,0,s.dbc||'#3a3442');c.restore();});}
 if(J.prop&&J.prop.k=='bottle'){const [x,y]=J.arms[1][2],u=J.prop.up;D(c=>{c.save();c.translate(x,y);c.rotate(-.4-u*1.6);c.beginPath();c.roundRect(-3.2,-15,6.4,15,2.5);c.fillStyle=s.btl||'#48eaff';c.fill();c.strokeStyle=OL;c.lineWidth=1.6;c.stroke();c.fillStyle='rgba(255,255,255,.55)';c.fillRect(-2,-13,1.4,10);c.fillStyle='#fff';c.fillRect(-2,-18,4,3);c.restore();});}
 if(J.prop&&J.prop.k=='glass'){const [x,y]=J.arms[1][2];D(c=>{c.save();c.translate(x,y-4);c.beginPath();c.moveTo(-6,-12);c.lineTo(6,-12);c.lineTo(0,-3);c.closePath();c.fillStyle='rgba(255,110,190,.85)';c.fill();c.strokeStyle=OL;c.lineWidth=1.3;c.stroke();c.beginPath();c.moveTo(0,-3);c.lineTo(0,4);c.stroke();c.restore();});}
 // pass 0: thick silhouette outline, pass 1: paint
 c.lineJoin='round';L.forEach(it=>{if(it.t=='p'){c.beginPath();it.fn(c);c.lineWidth=OW*3;c.strokeStyle=OL;c.stroke();}else if(it.t=='l')limb(c,it.pts,it.w,it.col,0);});
 L.forEach(it=>{if(it.t=='p')paint(c,it.fn,it.col,it.o);else if(it.t=='l')limb(c,it.pts,it.w,it.col,1,it.o);else it.fn(c);});
 c.restore();}
// ---- frame cache + public draw ----
const NPCF=new Map(),NPX=1.7,NPW=150,NPH=170;
const PERIOD={walk:.75,run:.42,squat:2.2,curl:1.8,punch:.5,yoga:4,pullup:2.4,water:5,row:1.2,pedal:.9,stretch:3.2,dance:.7,cheer:1.4,drink:3.5,idle:3.2};
function npcFrame(s,act,p,walk,back){const N=walk?8:12,f=Math.floor(p*N)%N,key=s.n+'|'+(walk?'walk':act)+'|'+f+'|'+(back?1:0);let cv=NPCF.get(key);
 if(!cv){cv=document.createElement('canvas');cv.width=NPW*NPX;cv.height=NPH*NPX;const c=cv.getContext('2d');c.scale(NPX,NPX);c.translate(NPW/2,NPH-12);paintNpc(c,s,act,f/N,walk,back);NPCF.set(key,cv);}return cv;}
// H = on-screen height of a tenant chibi (the NPCs are painted ~118 units tall, matching the tenants' head/body ratio)
function drawExtra(c,x,y,s,t,walk,H,flip){const act=s.act||'idle',per=walk?PERIOD.walk:(PERIOD[act]||3),T=t+(s.seed||0)*1.7,p=((T/per)%1+1)%1;const k=H/134;
 if(!s.noShadow){const g=c.createRadialGradient(x,y,0,x,y,H*.3);g.addColorStop(0,'rgba(10,6,20,.42)');g.addColorStop(1,'rgba(10,6,20,0)');c.save();c.translate(x,y);c.scale(1,.38);c.fillStyle=g;c.beginPath();c.arc(0,0,H*.3,0,7);c.fill();c.restore();}
 const cv=npcFrame(s,act,p,walk,s.back);c.save();c.translate(x,y);if(flip)c.scale(-1,1);c.imageSmoothingQuality='high';c.drawImage(cv,-NPW/2*k,-(NPH-12)*k,NPW*k,NPH*k);c.restore();}
// --- casts (all adults, fully dressed). Gym cast = Fantasy Town's GYMCAST; club cast uses the same renderer with night-out outfits.
const GYMCAST=[
 {n:'Coach Rin',skin:'fair',hair:'ponytail',hc:'#2a1a3a',eye:'#7a4ad8',lash:1,top:'crop',tc:'#ff5a8a',logo:'#ffffff',bottom:'leggings',bc:'#2a2a3e',stripe:'#ff5a8a',shoe:'#ffffff',band:'#ff5a8a',act:'stretch',talk:"Ares runs a tight warm-up. Ten minutes, no skipping!"},
 {n:'Big Dano',skin:'deep',hair:'buzz',hc:'#14101a',eye:'#5a3a1a',top:'tank',tc:'#3a3a46',logo:'#ff7a3a',bottom:'shorts',bc:'#5a6a8a',shoe:'#ff7a3a',socks:'#ffffff',bulk:1,beard:1,act:'squat',R:10.2,talk:"Leg day is a lifestyle, friend. Ares spotted my PR!"},
 {n:'Mika',skin:'pale',hair:'bob',hc:'#ff9ad0',eye:'#38a0ff',lash:1,top:'tee',tc:'#ffffff',logo:'#38a0ff',bottom:'shorts',bc:'#38a0ff',shoe:'#ff9ad0',socks:'#ffffff',earbuds:1,act:'run',talk:"Kilometre five! Don't talk to me, I'm in the zone~"},
 {n:'Tomas',skin:'olive',hair:'sidepart',hc:'#4a2a1a',eye:'#3a8a5a',top:'tank',tc:'#3dbf6a',bottom:'shorts',bc:'#2a2a34',shoe:'#3a3a46',socks:'#3dbf6a',wrist:'#ffffff',bulk:1,act:'curl',dbc:'#3dbf6a',talk:"Ares says squeeze at the top. I'm squeezing!"},
 {n:'Priya',skin:'brown',hair:'braids',hc:'#1a1020',eye:'#6a3a1a',lash:1,top:'hoodie',tc:'#9a6aff',bottom:'leggings',bc:'#1a1a2a',shoe:'#ffffff',act:'yoga',talk:"Breathe in... and out. Yoga corner is the best corner."},
 {n:'Jett',skin:'tan',hair:'mohawk',hc:'#38e0ff',eye:'#2a5aa8',top:'tank',tc:'#1a1a22',logo:'#38e0ff',bottom:'shorts',bc:'#d82a3a',shoe:'#1a1a22',socks:'#ffffff',wrist:'#38e0ff',act:'punch',talk:"Jab, jab, cross! Ares taught me to keep my guard up."},
 {n:'Leon',skin:'deep',hair:'afro',hc:'#1a1010',eye:'#4a2a1a',top:'tank',tc:'#ff7a3a',bottom:'leggings',bc:'#2a2a34',stripe:'#ff7a3a',shoe:'#ffffff',bulk:1,act:'pullup',talk:"Ares does these with one arm. ONE ARM."},
 {n:'Gus',skin:'pale',hair:'curly',hc:'#c8682a',eye:'#3a7ad8',glasses:'#2a2238',top:'tee',tc:'#5a8aff',bottom:'shorts',bc:'#3a3a46',shoe:'#5a8aff',socks:'#ffffff',towel:'#ffffff',act:'water',btl:'#3dbf6a',talk:"First week at the gym! Everything hurts. Great!"},
 {n:'Sora',skin:'tan',hair:'long',hc:'#1a1a2e',eye:'#a83a5a',lash:1,top:'crop',tc:'#38c8c0',logo:'#ffffff',bottom:'leggings',bc:'#3a4a6a',shoe:'#38c8c0',act:'row',talk:"Two thousand metres, then smoothies."},
];
const CLUBCAST=[
 {n:'Nova',skin:'fair',hair:'long',hc:'#c15aff',eye:'#48eaff',lash:1,top:'crop',tc:'#16161e',logo:'#48eaff',bottom:'leggings',bc:'#2a1a3a',shoe:'#ffffff',earbuds:0,act:'dance',talk:"Zayne's set tonight is insane!"},
 {n:'Kai',skin:'tan',hair:'spiky',hc:'#1a1a2a',eye:'#3a3a5a',top:'tee',tc:'#2a2a3a',logo:'#ff3a8a',bottom:'leggings',bc:'#1a1a24',shoe:'#48eaff',act:'dance',talk:"When the bass drops, the whole floor jumps."},
 {n:'Luz',skin:'brown',hair:'twinbuns',hc:'#ff5aa8',eye:'#8a5a2a',lash:1,top:'tank',tc:'#ff5aa8',logo:'#ffffff',bottom:'shorts',bc:'#1a1a2a',shoe:'#ffffff',socks:'#ff5aa8',act:'dance',talk:"Best club in Lumen, no contest."},
 {n:'Dex',skin:'deep',hair:'buzz',hc:'#14101a',eye:'#5a3a1a',top:'hoodie',tc:'#3a2a5a',bottom:'leggings',bc:'#16161e',shoe:'#c15aff',cap:'#48eaff',act:'cheer',talk:"Is that the DJ with the mask? Legend."},
 {n:'Ivy',skin:'pale',hair:'bob',hc:'#48eaff',eye:'#3a9a6a',lash:1,top:'tee',tc:'#ffffff',logo:'#c15aff',bottom:'leggings',bc:'#2a2a3e',shoe:'#ff5aa8',act:'dance',talk:"One more song! ...Okay, five more."},
 {n:'Rafe',skin:'olive',hair:'sidepart',hc:'#2a1a12',eye:'#3a8a5a',top:'tank',tc:'#16161e',logo:'#ffd84a',bottom:'leggings',bc:'#2a2a34',shoe:'#ffd84a',bulk:1,act:'dance',talk:"I came for one drink. That was three hours ago."},
 {n:'Mei',skin:'fair',hair:'ponytail',hc:'#2a1a3a',eye:'#7a4ad8',lash:1,top:'crop',tc:'#ffd84a',logo:'#16161e',bottom:'leggings',bc:'#16161e',shoe:'#ffffff',act:'water',btl:'#48eaff',talk:"Water break. Then back to the floor!"},
];
GYMCAST.forEach((g,i)=>{g.seed=i*1.37;});CLUBCAST.forEach((g,i)=>{g.seed=i*2.11+.5;});
