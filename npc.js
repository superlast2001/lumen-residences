'use strict';
// Gym-goer / club-goer chibis. The vector chibi renderer is ported unchanged from Fantasy Town's gymnpc.js
// (hand-tuned vector chibis with thick dark outlines, cel shading and anime eyes; no sprite sheet exists for extras).
// Added poses: dance, dj, cheer. mshade = Fantasy Town's multiplicative shade().
const mshade=(c,a)=>{const n=parseInt(c.slice(1),16);let r=n>>16,g=n>>8&255,bl=n&255;const f=v=>Math.max(0,Math.min(255,Math.round(v*a)));return'#'+((1<<24)|(f(r)<<16)|(f(g)<<8)|f(bl)).toString(16).slice(1);};
const GO='#1e1626';
const SKIN={pale:['#ffe6d6','#f2c4ae'],fair:['#ffd9bf','#eab394'],tan:['#e8b088','#c98a64'],olive:['#d29a6c','#ad7650'],brown:['#a86c46','#84502f'],deep:['#7a4a2e','#5a321c']};
function gCap(c,x1,y1,x2,y2,w,col,sh){c.lineCap='round';c.strokeStyle=GO;c.lineWidth=w+1.8;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();c.strokeStyle=col;c.lineWidth=w;c.stroke();
 if(sh){c.strokeStyle=sh;c.lineWidth=w*.38;c.beginPath();c.moveTo(x1+w*.22,y1);c.lineTo(x2+w*.22,y2);c.stroke();}}
function gBlob(c,pts,fill,lw=1.1){c.beginPath();c.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++){const p=pts[i];if(p.length==4)c.quadraticCurveTo(p[0],p[1],p[2],p[3]);else c.lineTo(p[0],p[1]);}c.closePath();c.fillStyle=fill;c.fill();if(lw){c.strokeStyle=GO;c.lineWidth=lw;c.lineJoin='round';c.stroke();}}
function gEll(c,x,y,rx,ry,fill,lw=1.1,rot=0){c.beginPath();c.ellipse(x,y,rx,ry,rot,0,7);c.fillStyle=fill;c.fill();if(lw){c.strokeStyle=GO;c.lineWidth=lw;c.stroke();}}
function dumbbell(c,x,y,ang,col='#3a3a46'){c.save();c.translate(x,y);c.rotate(ang);gCap(c,-3.4,0,3.4,0,1.1,'#c8ccd6');[-3.6,3.6].forEach(d=>{c.beginPath();c.roundRect(d-1.3,-2.6,2.6,5.2,.9);c.fillStyle=col;c.fill();c.strokeStyle=GO;c.lineWidth=.8;c.stroke();});c.restore();}
// --- hair: back layer (behind head) and front layer
function hairBack(c,s,hx,hy,R,t){const h=s.hair,col=s.hc,dk=mshade(col,.72);
 if(h=='ponytail'){const sw=Math.sin(t*6)*1.6;gBlob(c,[[hx+R*.5,hy-R*.6],[hx+R*1.5+sw,hy-R*.2,hx+R*1.2+sw,hy+R*1.3],[hx+R*.9+sw*.5,hy+R*.4,hx+R*.6,hy-R*.1]],col);}
 if(h=='long'||h=='braids'){gBlob(c,[[hx-R*.95,hy-R*.2],[hx-R*1.15,hy+R*1.25],[hx-R*.3,hy+R*1.4],[hx+R*.3,hy+R*1.4],[hx+R*1.15,hy+R*1.25],[hx+R*.95,hy-R*.2]],dk);}
 if(h=='braids'){[-1,1].forEach(sd=>{for(let i=0;i<3;i++)gEll(c,hx+sd*R*.95,hy+R*(.5+i*.42),R*.24,R*.24,col,.8);});}
 if(h=='afro')gEll(c,hx,hy-R*.25,R*1.38,R*1.22,col,1.2);
 if(h=='bun')gEll(c,hx,hy-R*1.12,R*.48,R*.42,col,1.1);
 if(h=='twinbuns')[-1,1].forEach(sd=>gEll(c,hx+sd*R*.8,hy-R*.9,R*.4,R*.38,col,1.1));
 if(h=='curly')for(let i=0;i<9;i++){const a=Math.PI*(1.05+i*.11);gEll(c,hx+Math.cos(a)*R*1.02,hy-R*.05+Math.sin(a)*R*1.02,R*.36,R*.36,i%2?col:mshade(col,.9),1);}}
function hairFront(c,s,hx,hy,R){const h=s.hair,col=s.hc,hl=mshade(col,1.45),dk=mshade(col,.7);
 const cap=()=>gBlob(c,[[hx-R*1.02,hy+R*.05],[hx-R*1.1,hy-R*1.15,hx,hy-R*1.12],[hx+R*1.1,hy-R*1.15,hx+R*1.02,hy+R*.05],[hx+R*.7,hy-R*.45],[hx,hy-R*.55],[hx-R*.7,hy-R*.45]],col);
 if(h=='spiky'){const P=[[hx-R*1.05,hy+R*.1]];[[-1.25,-.75],[-.9,-.55],[-.95,-1.35],[-.45,-.95],[-.2,-1.6],[.15,-1.0],[.55,-1.5],[.65,-.85],[1.2,-1.05],[.95,-.45],[1.15,-.1]].forEach(([a,b])=>P.push([hx+R*a,hy+R*b]));P.push([hx+R*1.02,hy+R*.12],[hx+R*.55,hy-R*.42],[hx+R*.2,hy-R*.2],[hx-R*.15,hy-R*.48],[hx-R*.55,hy-R*.3]);gBlob(c,P,col);
  c.strokeStyle=hl;c.lineWidth=.9;c.beginPath();c.moveTo(hx-R*.3,hy-R*1.25);c.lineTo(hx-R*.1,hy-R*.75);c.moveTo(hx+R*.45,hy-R*1.2);c.lineTo(hx+R*.4,hy-R*.8);c.stroke();}
 else if(h=='buzz'){gBlob(c,[[hx-R*.98,hy-R*.15],[hx-R*1.0,hy-R*1.08,hx,hy-R*1.06],[hx+R*1.0,hy-R*1.08,hx+R*.98,hy-R*.15],[hx+R*.6,hy-R*.62,hx,hy-R*.66],[hx-R*.6,hy-R*.62,hx-R*.98,hy-R*.15]],col,1);
  c.fillStyle='rgba(255,255,255,.18)';c.beginPath();c.ellipse(hx-R*.35,hy-R*.85,R*.3,R*.12,-.3,0,7);c.fill();}
 else if(h=='mohawk'){gBlob(c,[[hx-R*.95,hy-R*.2],[hx-R*.95,hy-R*1,hx,hy-R*1.02],[hx+R*.95,hy-R*1,hx+R*.95,hy-R*.2],[hx,hy-R*.62]],mshade(col,.55),.9);
  gBlob(c,[[hx-R*.28,hy-R*.75],[hx-R*.45,hy-R*1.55],[hx-R*.1,hy-R*1.35],[hx+R*.05,hy-R*1.85],[hx+R*.25,hy-R*1.4],[hx+R*.55,hy-R*1.6],[hx+R*.3,hy-R*.75]],col);}
 else if(h=='bob'||h=='long'||h=='braids'){cap();gBlob(c,[[hx-R*1.0,hy-R*.6],[hx-R*1.12,hy+R*.55],[hx-R*.72,hy+R*.42],[hx-R*.62,hy-R*.35]],col);gBlob(c,[[hx+R*1.0,hy-R*.6],[hx+R*1.12,hy+R*.55],[hx+R*.72,hy+R*.42],[hx+R*.62,hy-R*.35]],col);
  gBlob(c,[[hx-R*.8,hy-R*.8],[hx-R*.6,hy-R*.42],[hx-R*.32,hy-R*.62],[hx-R*.08,hy-R*.4],[hx+R*.2,hy-R*.62],[hx+R*.5,hy-R*.42],[hx+R*.8,hy-R*.78],[hx,hy-R*1.08]],col);
  c.strokeStyle=hl;c.lineWidth=1;c.beginPath();c.arc(hx-R*.15,hy-R*.55,R*.62,Math.PI*1.15,Math.PI*1.55);c.stroke();}
 else if(h=='sidepart'){gBlob(c,[[hx-R*1.02,hy+R*.05],[hx-R*1.12,hy-R*1.2,hx+R*.1,hy-R*1.18],[hx+R*1.15,hy-R*1.15,hx+R*1.04,hy-R*.05],[hx+R*.8,hy-R*.5],[hx+R*.15,hy-R*.75],[hx-R*.55,hy-R*.2],[hx-R*.8,hy-R*.35]],col);
  c.strokeStyle=hl;c.lineWidth=1;c.beginPath();c.moveTo(hx-R*.2,hy-R*1.0);c.quadraticCurveTo(hx+R*.4,hy-R*.95,hx+R*.75,hy-R*.6);c.stroke();}
 else if(h=='afro'||h=='curly'){cap();for(let i=0;i<6;i++)gEll(c,hx-R*.7+i*R*.28,hy-R*.62+Math.sin(i*1.7)*R*.08,R*.24,R*.22,i%2?col:mshade(col,1.15),.8);}
 else{cap();gBlob(c,[[hx-R*.8,hy-R*.7],[hx-R*.6,hy-R*.2],[hx-R*.2,hy-R*.45],[hx+R*.2,hy-R*.2],[hx+R*.6,hy-R*.45],[hx+R*.85,hy-R*.62],[hx,hy-R*1.05]],col);
  c.strokeStyle=hl;c.lineWidth=1;c.beginPath();c.arc(hx-R*.1,hy-R*.6,R*.6,Math.PI*1.2,Math.PI*1.5);c.stroke();}
 if(s.band){c.save();c.beginPath();c.ellipse(hx,hy-R*.12,R*1.03,R*.98,0,0,7);c.clip();c.fillStyle=s.band;c.fillRect(hx-R*1.1,hy-R*.72,R*2.2,R*.26);c.restore();c.strokeStyle=GO;c.lineWidth=.6;c.beginPath();c.moveTo(hx-R*.98,hy-R*.72);c.quadraticCurveTo(hx,hy-R*.88,hx+R*.98,hy-R*.72);c.stroke();}}
function gFace(c,s,hx,hy,R,mood,t){const ey=hy+R*.12,ex=R*.42,blink=((t*.7+s.seed)%4)<.12;
 [-1,1].forEach(sd=>{const x=hx+sd*ex;if(blink||mood=='effort'){c.strokeStyle=GO;c.lineWidth=1.2;c.lineCap='round';c.beginPath();if(mood=='effort'){c.moveTo(x-R*.2,ey-R*.08*sd*-1);c.lineTo(x+R*.14*sd,ey);c.lineTo(x-R*.2,ey+R*.1);}else{c.moveTo(x-R*.18,ey);c.quadraticCurveTo(x,ey+R*.1,x+R*.18,ey);}c.stroke();return;}
  gEll(c,x,ey,R*.2,R*.27,'#ffffff',.9);const ig=c.createLinearGradient(0,ey-R*.25,0,ey+R*.25);ig.addColorStop(0,mshade(s.eye,.6));ig.addColorStop(1,mshade(s.eye,1.35));gEll(c,x+sd*R*.02,ey+R*.03,R*.15,R*.22,ig,0);gEll(c,x+sd*R*.02,ey+R*.06,R*.07,R*.1,GO,0);
  gEll(c,x-R*.05,ey-R*.08,R*.06,R*.07,'#ffffff',0);gEll(c,x+R*.06,ey+R*.12,R*.03,R*.03,'#ffffff',0);
  c.strokeStyle=GO;c.lineWidth=1.3;c.beginPath();c.moveTo(x-R*.22,ey-R*.2);c.quadraticCurveTo(x,ey-R*.34,x+R*.22,ey-R*.18);c.stroke();if(s.lash){c.lineWidth=.8;c.beginPath();c.moveTo(x+sd*R*.2,ey-R*.2);c.lineTo(x+sd*R*.3,ey-R*.3);c.stroke();}});
 c.strokeStyle=mshade(s.hc,.8);c.lineWidth=1.1;c.lineCap='round';[-1,1].forEach(sd=>{c.beginPath();const bx=hx+sd*ex,by=ey-R*(mood=='effort'?.38:.46);c.moveTo(bx-sd*R*.2,by+(mood=='effort'?R*.08:0));c.lineTo(bx+sd*R*.18,by-(mood=='effort'?R*.06:R*.02));c.stroke();});
 c.fillStyle='rgba(255,120,130,.35)';[-1,1].forEach(sd=>{c.beginPath();c.ellipse(hx+sd*R*.62,ey+R*.3,R*.17,R*.09,0,0,7);c.fill();});
 const my=hy+R*.6;c.strokeStyle=GO;c.lineWidth=1;if(mood=='effort'){c.beginPath();c.roundRect(hx-R*.2,my-R*.08,R*.4,R*.16,R*.05);c.fillStyle='#ffffff';c.fill();c.stroke();c.beginPath();c.moveTo(hx-R*.2,my);c.lineTo(hx+R*.2,my);c.lineWidth=.5;c.stroke();}
 else if(mood=='open'){gEll(c,hx,my,R*.13,R*.1,'#a83a4a',.9);}else{c.beginPath();c.moveTo(hx-R*.18,my-R*.04);c.quadraticCurveTo(hx,my+R*.14,hx+R*.18,my-R*.04);c.stroke();}
 if(s.glasses){c.strokeStyle=s.glasses;c.lineWidth=1;[-1,1].forEach(sd=>{c.beginPath();c.roundRect(hx+sd*ex-R*.28,ey-R*.25,R*.56,R*.48,R*.12);c.stroke();});c.beginPath();c.moveTo(hx-R*.14,ey-R*.05);c.lineTo(hx+R*.14,ey-R*.05);c.stroke();}
 if(mood=='effort'){const sw=(t*1.3+s.seed)%1;gBlob(c,[[hx+R*1.05,hy-R*.5+sw*R*.6],[hx+R*1.18,hy-R*.2+sw*R*.6,hx+R*1.05,hy-R*.12+sw*R*.6],[hx+R*.92,hy-R*.2+sw*R*.6,hx+R*1.05,hy-R*.5+sw*R*.6]],'#bfe8ff',.6);}}
// main renderer. pose: idle|curl|run|punch|stretch|squat|bike|row|pullup|water|wave|yoga
function drawGymNpc(c,x,y,s,t,walk){const sk=SKIN[s.skin],pose=walk?'walk':s.act||'idle',T=t*(s.spd||1)+s.seed;
 let bob=0,lean=0,lL=0,lR=0,sq=0,mood='smile',aL,aR,gloves=pose=='punch',prop=null,seated=pose=='bike'||pose=='row';
 const sh=Math.sin(T*(pose=='run'?11:pose=='bike'?8:3));
 switch(pose){
  case'run':bob=Math.abs(Math.sin(T*11))*1.6;lL=sh*4;lR=-sh*4;aL=[-5-sh*2,-6+sh*3];aR=[5+sh*2,-6-sh*3];mood='open';break;
  case'walk':bob=Math.abs(Math.sin(T*10))*1;lL=sh*2.5;lR=-sh*2.5;aL=[-6,-4+sh*2];aR=[6,-4-sh*2];break;
  case'curl':{const k=(Math.sin(T*2.6)+1)/2;aL=[-6,-2-k*8];aR=[6,-10+k*8];mood=k>.6?'effort':'smile';prop='db';break;}
  case'punch':{const k=Math.max(0,Math.sin(T*4.5)),k2=Math.max(0,-Math.sin(T*4.5));aL=[-4+k*6,-12+k*1];aR=[4-k2*6,-12+k2*1];lean=(k-k2)*1;mood=k>.7||k2>.7?'effort':'smile';break;}
  case'stretch':{const k=Math.sin(T*1.3);aL=[-8+k*3,-37];aR=[8+k*3,-37];lean=k*2.4;break;}
  case'squat':{const k=(Math.sin(T*2)+1)/2;sq=k*5;aL=[-8,-17+sq];aR=[8,-17+sq];mood=k>.6?'effort':'smile';prop='bar';break;}
  case'bike':aL=[-5,-11];aR=[5,-11];lean=1;mood='open';bob=Math.abs(sh)*.4;break;
  case'row':{const k=(Math.sin(T*2.4)+1)/2;lean=-2+k*4;aL=[-4+k*-1,-10+k*3];aR=[4+k,-10+k*3];mood=k<.25?'effort':'smile';break;}
  case'pullup':{const k=(Math.sin(T*1.8)+1)/2;bob=8+k*7;aL=[-10,-38+k*3];aR=[10,-38+k*3];mood=k>.6?'effort':'smile';break;}
  case'water':{const k=((T*.35)%3)<.8;aL=[-6,-4];aR=k?[3,-21]:[6,-6];prop='bottle';mood=k?'smile':'smile';break;}
  case'wave':aL=[-6,-4];aR=[11+Math.sin(T*7)*2,-33];mood='open';break;
  case'dance':{const k=Math.sin(T*6),k2=Math.sin(T*3);bob=Math.abs(k)*2.2;lean=k2*1.6;lL=k*2;lR=-k*2;aL=k2>0?[-9,-34]:[-7,-14+k*3];aR=k2>0?[7,-12-k*3]:[10,-35];mood=Math.abs(k2)>.7?'open':'smile';break;}
  case'dj':{const k=Math.sin(T*4.2);bob=Math.abs(k)*1.2;aL=[-6,-12+k*2];aR=[7,-30+Math.abs(k)*4];mood='open';break;}
  case'cheer':{const k=Math.sin(T*5);bob=Math.abs(k)*1.5;aL=[-9,-36+k*2];aR=[9,-36-k*2];mood='open';break;}
  case'yoga':{bob=-0;aL=[-11,-16];aR=[11,-16];lean=Math.sin(T*.8)*.8;break;}
  default:aL=[-6,-4+sh*.4];aR=[6,-4-sh*.4];bob=sh*.3;}
 c.save();c.translate(x,y);if(s.flip)c.scale(-1,1);
 // ground shadow
 if(!s.noShadow){const sg=c.createRadialGradient(0,0,0,0,0,9);sg.addColorStop(0,'rgba(30,20,40,.35)');sg.addColorStop(1,'rgba(30,20,40,0)');c.fillStyle=sg;c.beginPath();c.ellipse(0,0,9,3.6,0,0,7);c.fill();}
 c.translate(0,-bob);const hip=-11.5+sq*.7+(seated?-2:0),neck=-22.5+sq,top=s.top,tc=s.tc,bc=s.bc;
 // legs
 const leg=(dx,ph)=>{let kx=dx,ky=hip+(seated?5:6)-(seated?0:sq*.3),fx=dx+ph*.6,fy=-1;if(seated){const a=T*8+(dx>0?Math.PI:0);fx=dx+Math.cos(a)*2.4;fy=-3+Math.sin(a)*2.4;kx=dx+2.5;ky=hip+2;}
  if(pose=='pullup'){kx=dx;ky=hip+5;fx=dx*.6;fy=hip+10;}
  if(sq){kx=dx*1.8;ky=hip+3.5;}
  const shorts=s.bottom=='shorts';gCap(c,dx,hip,kx,ky,4.2,shorts?sk[0]:bc,shorts?null:mshade(bc,.8));gCap(c,kx,ky,fx,fy-1.2,shorts?3.6:4,shorts?sk[0]:bc,shorts?sk[1]:mshade(bc,.8));
  if(s.socks&&shorts)gCap(c,fx,fy-3.2,fx,fy-1.2,3.6,s.socks);
  c.beginPath();c.roundRect(fx-2.6,fy-2.2,5.6,3.2,1.5);c.fillStyle=s.shoe;c.fill();c.strokeStyle=GO;c.lineWidth=.9;c.stroke();c.fillStyle='#ffffff';c.fillRect(fx-2.2,fy+.1,4.8,.7);};
 leg(-2.4,lL);leg(2.4,lR);
 // shorts / pants top
 c.save();c.translate(lean*.4,0);
 if(s.bottom=='shorts')gBlob(c,[[-5.2,hip-1.6],[5.2,hip-1.6],[5.9,hip+4],[1,hip+4.4],[0,hip+2],[-1,hip+4.4],[-5.9,hip+4]],bc);else gBlob(c,[[-5.2,hip-1.6],[5.2,hip-1.6],[5.5,hip+2.6],[-5.5,hip+2.6]],bc);
 if(s.stripe){c.fillStyle=s.stripe;c.fillRect(4.3,hip-2.4,.9,6);c.fillRect(-5.2,hip-2.4,.9,6);}
 c.restore();c.save();c.translate(lean,0);
 const hb=pose=='run'||pose=='walk'?0:Math.sin(T*3)*.3,hx=0,hy=neck-9.6+hb,R=(s.R||10.6)*.9;hairBack(c,s,hx,hy,R,T);
 // back arm (left) behind torso when crossing? draw both after torso for clarity, but upper-arm roots behind
 const shL=[-5.2,neck+2.4],shR=[5.2,neck+2.4];const arm=(sh0,hnd,side)=>{const ex=(sh0[0]+hnd[0])/2+side*(hnd[1]<-20?5.5:1.8),ey=(sh0[1]+(neck+hnd[1]+6))/2+1;const hx2=hnd[0],hy2=neck+hnd[1]+18;
  const sleeve=s.top=='tee'||s.top=='hoodie';gCap(c,sh0[0],sh0[1],ex,ey,3.6,sleeve?tc:sk[0],sleeve?mshade(tc,.82):sk[1]);gCap(c,ex,ey,hx2,hy2,3.2,s.top=='hoodie'?tc:sk[0],s.top=='hoodie'?mshade(tc,.82):sk[1]);
  if(s.top=='tee'){gCap(c,sh0[0],sh0[1],sh0[0]+(ex-sh0[0])*.75,sh0[1]+(ey-sh0[1])*.75,4.2,tc,mshade(tc,.82));}
  if(s.wrist&&!gloves)gCap(c,hx2+(ex-hx2)*.18,hy2+(ey-hy2)*.18,hx2+(ex-hx2)*.32,hy2+(ey-hy2)*.32,3.5,s.wrist);
  if(gloves){gEll(c,hx2,hy2,3,2.8,'#d82a3a',1);c.fillStyle='rgba(255,255,255,.5)';c.beginPath();c.ellipse(hx2-1,hy2-1,1,.7,0,0,7);c.fill();}else gEll(c,hx2,hy2,1.9,1.9,sk[0],.9);
  return[hx2,hy2];};
 // torso
 const tw=s.bulk?7:6,tg=c.createLinearGradient(-tw,0,tw,0);tg.addColorStop(0,mshade(tc,1.12));tg.addColorStop(.55,tc);tg.addColorStop(.62,mshade(tc,.82));tg.addColorStop(1,mshade(tc,.78));
 if(top=='tank'||top=='crop'){gBlob(c,[[-tw+.4,neck+1],[-tw*.55,neck-.4],[-2.2,neck+2.2,0,neck+2.6],[2.2,neck+2.2,tw*.55,neck-.4],[tw-.4,neck+1],[tw-.8,hip-1],[-tw+.8,hip-1]],sk[0]);
  if(s.bulk){c.strokeStyle=sk[1];c.lineWidth=.7;c.beginPath();c.moveTo(-3.2,neck+3.6);c.quadraticCurveTo(-1.5,neck+5,0,neck+4.2);c.quadraticCurveTo(1.5,neck+5,3.2,neck+3.6);c.stroke();}}
 const cut=top=='tank'?[[-tw+1.8,neck+2.4],[-tw*.5+.2,neck+.2],[-1.6,neck+4,0,neck+4.4],[1.6,neck+4,tw*.5-.2,neck+.2],[tw-1.8,neck+2.4]]:top=='crop'?[[-tw+.6,neck+1.2],[-tw*.5,neck],[-2,neck+2.6,0,neck+2.8],[2,neck+2.6,tw*.5,neck],[tw-.6,neck+1.2]]:[[-tw,neck+1],[-2.2,neck,0,neck+2],[2.2,neck,tw,neck+1]];
 const bot=top=='crop'?neck+6.4:hip-.4;gBlob(c,[...cut,[tw-.5,bot],[-tw+.5,bot]],tg);
 if(top=='crop'){gBlob(c,[[-tw+.8,neck+6.2],[tw-.8,neck+6.2],[tw-1.2,neck+7.4],[-tw+1.2,neck+7.4]],tc,.6);}
 if(s.logo){c.fillStyle=s.logo;c.beginPath();if(top=='crop'){c.fillRect(-tw+1.2,neck+4.5,tw*2-2.4,.9);}else{c.moveTo(-2,neck+6);c.lineTo(2,neck+6);c.lineTo(0,neck+9);c.closePath();}c.fill();}
 if(top=='hoodie'){gCap(c,-2,neck+2,-2.4,neck+7,.6,'#ffffff');gCap(c,2,neck+2,2.4,neck+7,.6,'#ffffff');gBlob(c,[[-3.5,hip-5],[3.5,hip-5],[3,hip-2.4],[-3,hip-2.4]],mshade(tc,.88),.6);}
 if(s.towel)gBlob(c,[[-tw+1,neck+.8],[-2,neck+3.2],[2,neck+3.2],[tw-1,neck+.8],[tw-1.4,neck+6],[tw-3,neck+5.6],[tw-3,neck+3.4],[-3,neck+3.4],[-3.2,neck+5.4],[-tw+1.4,neck+6]],s.towel,.8);
 // arms
 const up=aL[1]<-20||aR[1]<-20;let hl=[aL[0],neck+aL[1]+18],hr=[aR[0],neck+aR[1]+18];if(!up){hl=arm(shL,aL,-1);hr=arm(shR,aR,1);}
 if(prop=='db'){dumbbell(c,hl[0],hl[1],0,s.dbc||'#3a3a46');dumbbell(c,hr[0],hr[1],0,s.dbc||'#3a3a46');}
 if(prop=='bottle'){c.beginPath();c.roundRect(hr[0]-1.4,hr[1]-6,2.8,6.4,1);c.fillStyle=s.btl||'#38a0ff';c.fill();c.strokeStyle=GO;c.lineWidth=.8;c.stroke();c.fillStyle='rgba(255,255,255,.6)';c.fillRect(hr[0]-.8,hr[1]-5,.6,4);gEll(c,hr[0],hr[1]-6.4,1,.7,'#ffffff',.6);}
 if(prop=='bar'){const by=neck+1.2;gCap(c,-13,by,13,by,1.2,'#d8dce4');[-13,13].forEach(d=>{gEll(c,d,by,1.6,4.6,'#2a2a34',1);gEll(c,d+(d<0?-1.4:1.4),by,1.2,3.6,'#d82a3a',.8);});}
 // neck + head
 gCap(c,0,neck-1,0,neck+1.4,3.4,sk[1]);
 [-1,1].forEach(sd=>gEll(c,hx+sd*R*.98,hy+R*.18,R*.17,R*.24,sk[0],.9));
 const fg=c.createRadialGradient(hx-R*.3,hy-R*.2,R*.2,hx,hy,R*1.1);fg.addColorStop(0,mshade(sk[0],1.04));fg.addColorStop(.8,sk[0]);fg.addColorStop(1,sk[1]);
 c.beginPath();c.moveTo(hx-R,hy-R*.1);c.bezierCurveTo(hx-R*1.02,hy-R*1.1,hx+R*1.02,hy-R*1.1,hx+R,hy-R*.1);c.bezierCurveTo(hx+R*.98,hy+R*.62,hx+R*.48,hy+R*.92,hx,hy+R*.95);c.bezierCurveTo(hx-R*.48,hy+R*.92,hx-R*.98,hy+R*.62,hx-R,hy-R*.1);c.closePath();c.fillStyle=fg;c.fill();c.strokeStyle=GO;c.lineWidth=1.2;c.stroke();
 if(s.beard){c.save();c.clip();c.fillStyle=s.hc;c.globalAlpha=.85;c.beginPath();c.moveTo(hx-R,hy+R*.2);c.quadraticCurveTo(hx,hy+R*1.3,hx+R,hy+R*.2);c.lineTo(hx+R*.6,hy+R*.55);c.quadraticCurveTo(hx,hy+R*.4,hx-R*.6,hy+R*.55);c.closePath();c.fill();c.restore();}
 gFace(c,s,hx,hy,R,mood,T);hairFront(c,s,hx,hy,R);
 if(up){if(aL[1]<-20)hl=arm(shL,aL,-1);else hl=arm(shL,aL,-1);hr=arm(shR,aR,1);}
 if(s.cap){gBlob(c,[[hx-R*1.02,hy-R*.35],[hx-R*1.05,hy-R*1.25,hx,hy-R*1.22],[hx+R*1.05,hy-R*1.25,hx+R*1.02,hy-R*.35]],s.cap);gBlob(c,[[hx-R*.9,hy-R*.4],[hx+R*1.5,hy-R*.42],[hx+R*1.45,hy-R*.22],[hx-R*.9,hy-R*.24]],mshade(s.cap,.8),.9);gEll(c,hx,hy-R*.8,R*.18,R*.14,'#ffffff',.6);}
 if(pose=='pullup'&&!s.z&&!s.noBar)gCap(c,-13,hl[1]-.5,13,hr[1]-.5,1.3,'#d8dce4');
 if(s.earbuds)[-1,1].forEach(sd=>gEll(c,hx+sd*R*1.0,hy+R*.2,R*.1,R*.1,'#ffffff',.6));
 c.restore();c.restore();}

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
// draw an extra at world (x,y) scaled to the scene's chibi height (Fantasy Town's chibis are ~48 units tall)
function drawExtra(c,x,y,s,t,walk,H,flip){c.save();c.translate(x,y);const k=H/48;c.scale(k,k);drawGymNpc(c,0,0,{...s,flip:flip?1:0},t,walk);c.restore();}
