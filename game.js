'use strict';
// Lumen Residences — engine. Kairosoft-style portrait layout (game view on top, D-pad panel below),
// Ero-Condo-style tenant loop. Dialogue system, dev panel, save and sfx follow Fantasy Town v0.0.2.3.
const VERSION='v0.3.0',SAVE='lumen_res_v2',SLOT='lumen_res_slot1';
const $=id=>document.getElementById(id);
const cv=$('c'),ctx=cv.getContext('2d');
const DPR=()=>Math.min(3,window.devicePixelRatio||1);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const rnd=a=>a[Math.floor(Math.random()*a.length)];
const money=v=>'£'+Math.round(v).toLocaleString('en-GB');

// ---------------- images ----------------
const IMG={};
function img(src){let i=IMG[src];if(!i){i=new Image();i.decoding='async';i.src=src;IMG[src]=i;}return i;}
const ok=i=>i&&i.complete&&i.naturalWidth>0;
const tImg=(n,f)=>img(`assets/${TENANTS[n].dir}/${f}`);
const EXPR={normal:'normal',smile:'smile',laugh:'smile',happy:'smile',teasing:'teasing',smirk:'teasing',blush:'blushing',blushing:'blushing',angry:'angry',serious:'serious',thinking:'serious',surprised:'surprised',sad:'sad'};
const faceImg=(n,e='smile')=>tImg(n,`expr_${EXPR[e]||'smile'}_hd.png`);
const furnThumb=k=>FA.thumb(k);
const foodImg=k=>img(`assets/furn/food_${k}_hd.png`);
// preload what every screen needs
for(const n of TENANT_ORDER){const T=TENANTS[n];['front','right','back','left'].forEach(d=>tImg(n,`chibi_${d}_hd.png`));for(let i=0;i<T.walkN;i++)tImg(n,`walk_${i}_hd.png`);
 ['idle','smile','blush','angry','surprised','happy','sit'].forEach(e=>tImg(n,`emote_${e}_hd.png`));if(T.sitns)tImg(n,'emote_sitns_hd.png');Object.values(T.icons).forEach(f=>tImg(n,f+'_hd.png'));faceImg(n,'normal');if(T.poses)Object.values(T.poses).forEach(f=>tImg(n,f));}

// ---------------- state ----------------
let S;
function newState(){const s={v:2,day:1,min:8*60,money:200,hearts:30,unlocked:['Ares'],scene:'lobby',rel:{},rooms:{},inv:{},bag:{water:2,coffee:1},ring:0,seenHelp:0};
 TENANT_ORDER.forEach(n=>{s.rel[n]={p:0,talk:0,fed:0,used:{},day:0,dating:0,engaged:0,married:0,engDay:0};s.rooms[n]={furn:(ROOMS[n].defFurn||[]).map(f=>({r:0,...f})),fridge:n=='Ares'?{steak:1,water:2}:{water:1}};});return s;}
function load(key=SAVE){try{const j=JSON.parse(localStorage.getItem(key));if(j&&j.v==2)return j;}catch(e){}return null;}
function save(quiet,key=SAVE){try{localStorage.setItem(key,JSON.stringify(S));if(!quiet)toast('Game saved');}catch(e){}}
S=load()||newState();

// ---------------- relationship ----------------
const R=n=>S.rel[n];
function relLv(n){const r=R(n);let l=0;for(let i=0;i<REL_P.length;i++)if(r.p>=REL_P[i])l=i;if(!r.dating)l=Math.min(l,4);if(!r.engaged)l=Math.min(l,5);if(!r.married)l=Math.min(l,6);if(r.married)l=7;else if(r.engaged)l=Math.max(l,6);else if(r.dating)l=Math.max(l,5);return l;}
function nextP(n){const l=relLv(n);return l>=7?null:REL_P[l+1];}
function gain(n,v,why){const before=relLv(n),r=R(n);r.p=Math.max(0,r.p+v);if(v>0)S.hearts+=v;const after=relLv(n);
 if(v>0)toast(`♥ +${v} ${n}${why?' · '+why:''}`);else if(v<0)toast(`${n} ♥ ${v}`);
 if(after>before){setTimeout(()=>{toast(`${n} is now your ${REL[after]}!`);emote(n,'happy');sfx(1180);},400);}
 if(before<4&&r.p>=REL_P[4]&&!r.dating)setTimeout(()=>toast(`${n} has a CONFESSION ready — open the profile card!`),1300);
 updateHud();}

// ---------------- time & schedule ----------------
const hour=()=>Math.floor(S.min/60)%24;
function placeOf(n){if(!S.unlocked.includes(n))return null;const sc=TENANTS[n].sched,h=hour();let p='home';for(const [t,q] of sc)if(h>=t)p=q;return p;}
function untilOf(n){const sc=TENANTS[n].sched,h=hour();for(const [t] of sc)if(t>h)return t;return 24;}
const fmtH=h=>{h=h%24;return (h%12||12)+(h<12?' AM':' PM');};
function clock(){const h=hour(),m=Math.floor(S.min%60);return `${(h%12)||12}:${String(m).padStart(2,'0')} ${h<12?'AM':'PM'}`;}
function nightF(){const h=S.min/60%24;if(h>=7&&h<18)return 0;if(h>=18&&h<20)return(h-18)/2;if(h>=5&&h<7)return 1-(h-5)/2;return 1;}
function tickTime(dm){const before=S.min;S.min+=dm;if(S.min>=24*60){S.min-=24*60;newDay();}
 if(before<6*60&&S.min>=6*60)collectRent();}
function newDay(){S.day++;TENANT_ORDER.forEach(n=>{const r=R(n);r.talk=0;r.fed=0;r.used={};});toast(`Day ${S.day}`);save(1);}
function collectRent(){const n=S.unlocked.length,amt=20*n;S.money+=amt;sfx(880);
 openSheet(`<h3>RENT DAY · DAY ${S.day}</h3><p>Good morning, manager! ${n} resident${n>1?'s':''} paid <b>£20</b> each.</p><div class="pcard" style="text-align:center;font-weight:1000;font-size:26px;color:#1a7a2a">+ ${money(amt)}</div>`+S.unlocked.map(t=>`<p>• ${t} — £20 ${R(t).married?'(your spouse insisted on paying anyway)':''}</p>`).join('')+`<button class="mbtn gold" onclick="closeSheet()">Collect</button>`);updateHud();}

// ---------------- sfx (Fantasy Town) ----------------
let actx=null;function sfx(f){try{actx=actx||new(window.AudioContext||window.webkitAudioContext)();const o=actx.createOscillator(),g=actx.createGain();o.type='triangle';o.frequency.value=f;g.gain.value=.05;g.gain.exponentialRampToValueAtTime(.0001,actx.currentTime+.18);o.connect(g).connect(actx.destination);o.start();o.stop(actx.currentTime+.2);}catch(e){}}

// ---------------- toasts / sheet ----------------
function toast(t){const d=document.createElement('div');d.className='toast';d.textContent=t;const box=$('toasts');box.appendChild(d);while(box.children.length>3)box.firstChild.remove();setTimeout(()=>d.remove(),2600);}
function openSheet(h){$('sheetBox').innerHTML=`<button class="x" onclick="closeSheet()">✕</button>`+h;$('sheet').classList.add('open');$('sheetBox').scrollTop=0;}
function closeSheet(){$('sheet').classList.remove('open');}
const sheetOpen=()=>$('sheet').classList.contains('open');
$('sheet').addEventListener('pointerdown',e=>{if(e.target.id=='sheet')closeSheet();});

// ---------------- scenes ----------------
const DIA={T:[500,170],R:[950,395],B:[500,620],L:[50,395]},WALLH=200;
function sceneInfo(id=S.scene){if(id.startsWith('room:')){const n=id.slice(5),Rm=ROOMS[n];if(!Rm)return sceneInfo('lobby');return{kind:'room',n,W:Rm.W,H:Rm.H,ch:Rm.ch,title:Rm.name,R:Rm};}
 const p=id=='lobby'?'lobby':id.slice(6);if(!PLACES[p])return sceneInfo('lobby');return{kind:'place',p,W:1000,H:760,ch:122,title:PLACES[p].n,P:PLACES[p]};}
let SC=null;
function setScene(id){SC=sceneInfo(id);SC.G=buildGrid(SC);rebuildOcc(SC.G,sceneFurn());}
const cam={x:500,y:400,z:1},cur={x:500,y:420};
function viewSize(){return[cv.width/DPR(),cv.height/DPR()];}
function fitZoom(){const [vw,vh]=viewSize();if(SC.kind=='room')return Math.max(vh/SC.H,vw/SC.W,SC.R.z||0,SC.R.type=='tile'?.5:0);return Math.max(vh/(SC.H-40),vw/SC.W);}
function clampCam(){const [vw,vh]=viewSize(),z=cam.z,hw=vw/2/z,hh=vh/2/z;cam.x=SC.W<=hw*2?SC.W/2:clamp(cam.x,hw,SC.W-hw);const top=SC.kind=='place'?40:0;cam.y=SC.H-top<=hh*2?(SC.H+top)/2:clamp(cam.y,hh+top,SC.H-hh);}
const W2S=(x,y)=>{const [vw,vh]=viewSize();return[(x-cam.x)*cam.z+vw/2,(y-cam.y)*cam.z+vh/2];};
const S2W=(sx,sy)=>{const [vw,vh]=viewSize();return[(sx-vw/2)/cam.z+cam.x,(sy-vh/2)/cam.z+cam.y];};
function inDiamond(x,y,m=0){const {T,R,B,L}=DIA;const cx=T[0],cy=L[1],hw=(R[0]-L[0])/2-m,hh=(B[1]-T[1])/2-m*.5;return Math.abs(x-cx)/hw+Math.abs(y-cy)/hh<=1;}
const diaPt=(u,v)=>[DIA.T[0]+u*(DIA.R[0]-DIA.T[0])+v*(DIA.L[0]-DIA.T[0]),DIA.T[1]+u*(DIA.R[1]-DIA.T[1])+v*(DIA.L[1]-DIA.T[1])];

// ---------------- tenants in the current scene ----------------
let TN={};
function present(){if(SC.kind=='room')return placeOf(SC.n)=='home'?[SC.n]:[];if(SC.p=='lobby')return[];return S.unlocked.filter(n=>placeOf(n)==SC.p);}
let lastPlace={};
// keep the tenants in this scene in step with their schedules: they walk in through the entry and out through it
function syncTenants(initial){const G=SC.G;
 if(SC.kind=='place'&&SC.p=='lobby'){// lobby: residents changing place cross the lobby between the elevator and the front door
  for(const n of S.unlocked){const p=placeOf(n),q=lastPlace[n];lastPlace[n]=p;if(initial||!q||q==p||TN[n])continue;const P=SC.P,from=q=='home'?P.elev:P.entry,to=p=='home'?P.elev:P.entry;if(from===to)continue;
   const t=arriveT(n,from);if(t){t.transit=to;TN[n]=t;}}return;}
 const pr=present();for(const n of S.unlocked)lastPlace[n]=placeOf(n);
 for(const n in TN){const t=TN[n];if(!pr.includes(n)&&!t.leaving){if(initial)delete TN[n];else leaveT(t,()=>{delete TN[n];});}}
 pr.forEach(n=>{if(TN[n]&&!TN[n].leaving)return;if(TN[n]&&TN[n].leaving)return;
  if(initial){const E=exitOf(),R0=reach(G,E?E.t:[0,0],null).filter(([u,v])=>!G.keep.has(u*512+v)||Math.random()<.3);const [u,v]=rnd(R0.length?R0:[[E.t[0],E.t[1]]]);TN[n]=newT(n,u,v);TN[n].idle=.2+Math.random()*.5;}
  else{const t=arriveT(n);if(t)TN[n]=t;}});}
function emote(n,e,dur=2.6){const t=TN[n];if(t){t.emo=e;t.emoT=dur;}}
// ---------------- illustrated interiors (smooth gradients + the furniture sheet's sprites) ----------------
const lerp=(a,b,u)=>[a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u];
const wallPt=(s,u,h)=>{const p=s=='L'?lerp(DIA.L,DIA.T,u):lerp(DIA.T,DIA.R,u);return[p[0],p[1]-h];};
function poly(g,pts){g.beginPath();pts.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.closePath();}
function shade(hex,f){const n=parseInt(hex.slice(1),16);let r=n>>16,gg=n>>8&255,b=n&255;const t=f<0?0:255,a=Math.abs(f);r=Math.round(r+(t-r)*a);gg=Math.round(gg+(t-gg)*a);b=Math.round(b+(t-b)*a);return`rgb(${r},${gg},${b})`;}
function wallQuad(g,s,u0,u1,h0,h1){poly(g,[wallPt(s,u0,h0),wallPt(s,u1,h0),wallPt(s,u1,h1),wallPt(s,u0,h1)]);}
function skyGrad(g,y0,y1){const n=nightF(),gr=g.createLinearGradient(0,y0,0,y1);gr.addColorStop(0,n>.5?'#1b2350':'#74c6ff');gr.addColorStop(1,n>.5?'#5a3f7a':'#d8efff');return gr;}
let PG=null;const placeGrid=()=>PG||(PG=buildGrid({kind:'place',P:{}}));
function drawPlace(g,p,time){const P=PLACES[p],{T,R,B,L}=DIA,n=nightF();
 if(P.outdoor){g.fillStyle=skyGrad(g,0,420);g.fillRect(-400,-200,1800,1200);
  // distant city + tree line
  g.fillStyle=n>.5?'#3a3560':'#a9c6e0';for(let i=0;i<14;i++){const x=-60+i*80,h=60+((i*53)%90);g.fillRect(x,300-h,58,h+40);}
  g.fillStyle=n>.5?'#22402a':'#4a9b4c';for(let i=0;i<20;i++){g.beginPath();g.arc(-40+i*58,330+Math.sin(i*1.7)*10,46+((i*37)%20),0,7);g.fill();}
  const gr=g.createLinearGradient(0,300,0,760);gr.addColorStop(0,n>.5?'#2f5a34':'#86cc6e');gr.addColorStop(1,n>.5?'#1e3d24':'#5aa84a');g.fillStyle=gr;g.fillRect(-400,330,1800,900);}
 else{const bg=g.createLinearGradient(0,0,0,760);bg.addColorStop(0,shade(P.wall[1],-.55));bg.addColorStop(1,shade(P.wall[1],-.75));g.fillStyle=bg;g.fillRect(-400,-200,1800,1200);
  // walls
  for(const s of ['L','R']){const base=s=='L'?P.wall[0]:P.wall[1];const gr=g.createLinearGradient(0,T[1]-WALLH,0,L[1]);gr.addColorStop(0,shade(base,.12));gr.addColorStop(1,shade(base,-.18));g.fillStyle=gr;
   poly(g,s=='L'?[L,T,[T[0],T[1]-WALLH],[L[0],L[1]-WALLH]]:[T,R,[R[0],R[1]-WALLH],[T[0],T[1]-WALLH]]);g.fill();
   g.strokeStyle=shade(base,-.3);g.globalAlpha=.25;g.lineWidth=2;for(let u=.05;u<1;u+=.05){const a=wallPt(s,u,0),b=wallPt(s,u,WALLH);g.beginPath();g.moveTo(...a);g.lineTo(...b);g.stroke();}g.globalAlpha=1;
   // windows
   (s=='L'?[[.38,.56],[.62,.8]]:[[.22,.4],[.78,.94]]).forEach(([u0,u1])=>{if(p=='lobby'&&s=='R'&&u0>.7)return;wallQuad(g,s,u0-.012,u1+.012,62,172);g.fillStyle=P.trim;g.fill();wallQuad(g,s,u0,u1,70,164);g.fillStyle=skyGrad(g,T[1]-170,T[1]);g.fill();
    g.strokeStyle=P.trim;g.lineWidth=4;const m0=wallPt(s,(u0+u1)/2,70),m1=wallPt(s,(u0+u1)/2,164);g.beginPath();g.moveTo(...m0);g.lineTo(...m1);g.stroke();const a=wallPt(s,u0,117),b=wallPt(s,u1,117);g.beginPath();g.moveTo(...a);g.lineTo(...b);g.stroke();
    if(n<.5){g.globalAlpha=.35;g.fillStyle='#fff';poly(g,[wallPt(s,u0+.01,150),wallPt(s,u0+.05,160),wallPt(s,u0+.02,80),wallPt(s,u0+.005,76)]);g.fill();g.globalAlpha=1;}});
   wallQuad(g,s,0,1,0,16);g.fillStyle=shade(P.trim,-.25);g.fill();wallQuad(g,s,0,1,WALLH-10,WALLH);g.fillStyle=P.trim;g.fill();}
  // exit door (left wall)
  wallQuad(g,'L',.08,.26,0,150);g.fillStyle=shade(P.trim,-.35);g.fill();wallQuad(g,'L',.095,.245,0,140);const dg=g.createLinearGradient(...wallPt('L',.1,0),...wallPt('L',.24,0));dg.addColorStop(0,'#bfe6ff');dg.addColorStop(.5,'#f2fbff');dg.addColorStop(1,'#8cc8ee');g.fillStyle=dg;g.fill();
  g.strokeStyle=shade(P.trim,-.35);g.lineWidth=3;const dm0=wallPt('L',.17,0),dm1=wallPt('L',.17,140);g.beginPath();g.moveTo(...dm0);g.lineTo(...dm1);g.stroke();
  wallQuad(g,'L',.11,.23,152,174);g.fillStyle='#1d6a3a';g.fill();g.save();const ex=wallPt('L',.17,157);g.translate(ex[0],ex[1]);g.transform(1,-.5,0,1,0,0);g.fillStyle='#fff';g.font='900 16px system-ui';g.textAlign='center';g.fillText('EXIT',0,0);g.restore();
  // sign plaque
  g.save();const sp=wallPt('L',.5,WALLH-30);g.translate(sp[0],sp[1]);g.transform(1,-.5,0,1,0,0);const sw=Math.max(170,P.sign.length*13+30);g.fillStyle='#30233d';g.strokeStyle='#ffdb75';g.lineWidth=4;
  g.beginPath();g.roundRect(-sw/2,-22,sw,34,9);g.fill();g.stroke();g.fillStyle=P.neon?'#48eaff':'#ffb6e1';if(P.neon){g.shadowColor='#48eaff';g.shadowBlur=12;}g.font='1000 19px Georgia,serif';g.textAlign='center';g.fillText(P.sign,0,3);g.restore();
  if(p=='lobby'){// elevator on the right wall
   wallQuad(g,'R',.52,.72,0,165);g.fillStyle='#6b553d';g.fill();wallQuad(g,'R',.535,.705,0,150);const eg=g.createLinearGradient(...wallPt('R',.53,0),...wallPt('R',.71,0));eg.addColorStop(0,'#c9a35a');eg.addColorStop(.5,'#fff0c4');eg.addColorStop(1,'#b48a48');g.fillStyle=eg;g.fill();
   g.strokeStyle='#8a6a3a';g.lineWidth=3;const e0=wallPt('R',.62,0),e1=wallPt('R',.62,150);g.beginPath();g.moveTo(...e0);g.lineTo(...e1);g.stroke();
   const ind=wallPt('R',.62,176);g.fillStyle='#28223a';g.beginPath();g.ellipse(ind[0],ind[1],22,12,0,0,7);g.fill();g.fillStyle='#ffd85d';g.font='900 13px system-ui';g.textAlign='center';g.fillText('▲▼',ind[0],ind[1]+5);}
  if(P.neon){const hue=(time*40)%360;g.save();g.lineWidth=5;g.shadowBlur=16;[[L,T],[T,R]].forEach(([a,b],i)=>{g.strokeStyle=g.shadowColor=`hsl(${(hue+i*120)%360},100%,65%)`;g.beginPath();g.moveTo(a[0],a[1]-WALLH+14);g.lineTo(b[0],b[1]-WALLH+14);g.stroke();});g.restore();}}
  // floor: the furniture sheet's floor texture mapped onto the tile grid (grass outdoors), LED tiles on the club dance floor
 const N=10,PGd=placeGrid();if(P.outdoor){for(let i=0;i<N;i++)for(let j=0;j<N;j++){poly(g,tileQuad(PGd,i,j));g.fillStyle=(i+j)%2?'#7cc46a':'#72ba60';g.fill();}}
 else{const pat=patFor(g,PGd,P.tex||'t01');poly(g,[T,R,B,L]);g.fillStyle=pat||P.wall[1];g.fill();
  if(P.dance){const [a,b,w,h]=P.dance;for(let i=a;i<a+w;i++)for(let j=b;j<b+h;j++){poly(g,tileQuad(PGd,i+.04,j+.04,.92,.92));g.fillStyle=`hsla(${(time*60+(i+j)*40)%360},90%,${(i+j)%2?52:38}%,.85)`;g.fill();}
   g.save();g.globalCompositeOperation='lighter';const c=PGd.pt(a+w/2,b+h/2),gr=g.createRadialGradient(c[0],c[1],10,c[0],c[1],260);gr.addColorStop(0,`hsla(${(time*60)%360},100%,60%,.28)`);gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.beginPath();g.ellipse(c[0],c[1],260,140,0,0,7);g.fill();g.restore();}}
 g.strokeStyle='rgba(0,0,0,.10)';g.lineWidth=1.2;for(let i=0;i<=N;i++){let a=diaPt(i/N,0),b=diaPt(i/N,1);g.beginPath();g.moveTo(...a);g.lineTo(...b);g.stroke();a=diaPt(0,i/N);b=diaPt(1,i/N);g.beginPath();g.moveTo(...a);g.lineTo(...b);g.stroke();}
 const fg=g.createRadialGradient(500,395,40,500,395,470);fg.addColorStop(0,'rgba(255,255,255,.10)');fg.addColorStop(1,'rgba(0,0,0,.22)');g.fillStyle=fg;poly(g,[T,R,B,L]);g.fill();
 if(P.outdoor){// path + pond
  g.fillStyle='#cbb48a';poly(g,[diaPt(.42,0),diaPt(.58,0),diaPt(.58,1),diaPt(.42,1)]);g.fill();poly(g,[diaPt(0,.44),diaPt(1,.44),diaPt(1,.56),diaPt(0,.56)]);g.fill();
  const pc=diaPt(.75,.25);const pg=g.createRadialGradient(pc[0],pc[1],10,pc[0],pc[1],120);pg.addColorStop(0,'#9fe0ff');pg.addColorStop(1,'#3a8ad0');g.fillStyle=pg;g.beginPath();g.ellipse(pc[0],pc[1],120,55,0,0,7);g.fill();g.strokeStyle='#e8ddc0';g.lineWidth=6;g.stroke();}
 if(P.neon){// moving spotlights
  g.save();g.globalCompositeOperation='lighter';for(let k=0;k<3;k++){const a=time*.7+k*2.1,c=PGd.pt(5+Math.cos(a)*2.4,5+Math.sin(a*1.3)*2.4),src=[200+k*300,40];const col=['#48eaff','#c15aff','#ff5aa8'][k];
   const gr=g.createLinearGradient(src[0],src[1],c[0],c[1]);gr.addColorStop(0,col+'00');gr.addColorStop(1,col+'40');g.fillStyle=gr;g.beginPath();g.moveTo(src[0]-6,src[1]);g.lineTo(src[0]+6,src[1]);g.lineTo(c[0]+60,c[1]);g.lineTo(c[0]-60,c[1]);g.closePath();g.fill();
   g.fillStyle=col+'38';g.beginPath();g.ellipse(c[0],c[1],62,30,0,0,7);g.fill();}g.restore();}
 // floor edge
 g.fillStyle=P.outdoor?'#5a8a3a':shade(P.wall[1],-.45);poly(g,[L,B,[B[0],B[1]+18],[L[0],L[1]+18]]);g.fill();g.fillStyle=P.outdoor?'#4a7a2e':shade(P.wall[1],-.6);poly(g,[B,R,[R[0],R[1]+18],[B[0],B[1]+18]]);g.fill();}
function hotPos(h){const P=SC.P,G=SC.G;if(h.kind=='exit')return G.tc(...P.entry.t);if(h.id=='elevator')return G.tc(...P.elev.t);return G.tc(...h.t);}

// ---------------- targets (what the cursor / a tap can select) ----------------
let hover=null,sel=null,decor=null;
const furnAct=k=>(FURN[k]&&FURN[k].act)||(FDEF[k]&&FDEF[k].use&&FDEF[k].use.act)||null;
const furnName=k=>(FURN[k]&&FURN[k].n)||{djbooth:'DJ booth',speaker:'Speaker stack',barstool:'Bar stool'}[k]||k;
function zoneLv(n,zid){const Z=TENANTS[n].zones.find(z=>z.id==zid),Rm=ROOMS[n];let lv=1;(Rm.spots||[]).forEach(s=>{if(Z.acts.includes(s.act))lv++;});
 S.rooms[n].furn.forEach(f=>{const a=furnAct(f.k);if(a&&Z.acts.includes(a))lv++;});return Math.min(5,lv);}
function furnTop(f){const b=fBase(SC.G,f),d=FDEF[f.k]||{},h=(d.h||60)*SC.G.eu[0]/45;return[b.cx,b.by-b.w*.25-h*.5];}
function targets(){const L=[],G=SC.G;for(const n in TN){const t=TN[n];if(t.alpha<.5)continue;L.push({type:'tenant',n,x:t.x,y:t.y-SC.ch*.45,label:n});}
 if(SC.kind=='room'){const n=SC.n,Rm=SC.R;
  (Rm.spots||[]).forEach(s=>{const [x,y]=G.pt(...(s.at||[s.t[0]+.5,s.t[1]+.5]));L.push({type:'spot',s,x,y:y-24,act:s.act,label:s.n});});
  S.rooms[n].furn.forEach((f,i)=>{const [x,y]=furnTop(f);L.push({type:'furn',i,f,x,y,act:furnAct(f.k),label:furnName(f.k)});});
  TENANTS[n].zones.forEach(z=>{const p=G.pt(...Rm.zoneLabel[z.id]);L.push({type:'zone',z:z.id,x:p[0],y:p[1]+14,label:z.id+' zone'});});}
 else{const P=SC.P;P.hot.forEach(h=>{const [x,y]=hotPos(h);L.push({type:'hot',h,x,y,label:h.n});});
  P.props.forEach((f,i)=>{const a=furnAct(f.k);if(!a&&SC.p!='fshop')return;const [x,y]=furnTop(f);L.push({type:'prop',i,f,x,y,act:a,label:furnName(f.k)});});
  EX.forEach(e=>L.push({type:'npc',e,x:e.x,y:e.y-SC.ch*.4,label:e.c.n}));}
 return L;}
function targetAt(x,y,rad){rad=rad||52/cam.z;let b=null,bd=rad;for(const t of targets()){const d=Math.hypot(t.x-x,(t.y-y)*1.2);const r=t.type=='tenant'?bd*1.35:bd;if(d<r&&(!b||d<Math.hypot(b.x-x,(b.y-y)*1.2))){b=t;}}return b;}

// ---------------- render ----------------
let lastT=performance.now(),acc=0;
function resize(){const v=$('view'),d=DPR(),w=Math.round(v.clientWidth*d),h=Math.round(v.clientHeight*d);if(cv.width!=w||cv.height!=h){cv.width=w;cv.height=h;cam.z=fitZoom();clampCam();}}
function decorF(){if(!decor)return null;const G=SC.G,[uu,vv]=G.uv(cur.x,cur.y),f={k:decor.k,r:decor.r,u:0,v:0},[w,h]=fpOf(f);f.u=Math.round(uu-w/2);f.v=Math.round(vv-h/2);return f;}
function drawWorld(g,time){const [vw,vh]=viewSize(),G=SC.G;g.save();g.translate(vw/2,vh/2);g.scale(cam.z,cam.z);g.translate(-cam.x,-cam.y);
 if(SC.kind=='room'){if(SC.R.type=='tile')drawRoomShell(g,time);else{const im=img(SC.R.img);g.fillStyle='#0c0a12';g.fillRect(-2000,-2000,SC.W+4000,SC.H+4000);if(ok(im)){g.imageSmoothingQuality='high';g.drawImage(im,0,0,SC.W,SC.H);}}}
 else drawPlace(g,SC.p,time);
 if(DBG&&window.__grid){for(let u=0;u<G.cols;u++)for(let v=0;v<G.rows;v++)if(G.floor(u,v)){poly(g,tileQuad(G,u,v));g.fillStyle=G.occ[u][v]?'rgba(255,60,60,.35)':'rgba(60,255,120,.22)';g.fill();}}
 // cursor ring on the floor
 if(!decor){const pulse=1+Math.sin(time*5)*.08,rx=SC.ch*.42*pulse,ry=rx*.5;g.save();g.translate(cur.x,cur.y);g.strokeStyle='rgba(255,236,140,.95)';g.lineWidth=3/cam.z*1.6;g.shadowColor='#ffe16a';g.shadowBlur=10;
  g.beginPath();g.moveTo(0,-ry);g.lineTo(rx,0);g.lineTo(0,ry);g.lineTo(-rx,0);g.closePath();g.stroke();g.fillStyle='rgba(255,236,140,.18)';g.fill();g.restore();}
 // depth-sorted entities (iso depth = u+v)
 const E=[],list=sceneFurn(),df=decorF();
 list.forEach((f,i)=>{if(decor&&decor.from===f)return;const hl=hover&&(hover.type=='furn'||hover.type=='prop')&&hover.f===f;E.push({depth:FDEF[f.k]&&FDEF[f.k].flat?-1:fBase(G,f).depth,d:()=>drawFurn(g,G,f,null,hl,time)});});
 if(SC.kind=='room'&&SC.R.type=='tile')lowWalls(G,SC.R,SC.R.theme).forEach(w=>E.push({depth:w.depth,d:()=>w.d(g)}));
 for(const n in TN){const t=TN[n];E.push({depth:tDepth(t),d:()=>drawChibiT(g,t,time,(hover&&hover.type=='tenant'&&hover.n==n)||sel==n)});}
 for(const n in TN){const t=TN[n],U=t.U;if(t.state=='use'&&U&&U.f&&U.pose=='fridge'){const el=(t.useDur||6)-t.useT,k=Math.min(1,el/.4,Math.max(0,t.useT-.2)/.4);E.push({depth:fBase(G,U.f).depth+.3,d:()=>drawFridgeDoor(g,G,U.f,k)});}}
 for(const n in TN){const t=TN[n],U=t.U;if(t.state=='use'&&t.onIt&&U&&U.f&&U.gp&&!U.away)E.push({depth:U.depth+.01,d:()=>drawFurn(g,G,U.f,null,false,time,U.gp)});}
 EX.forEach(e=>E.push({depth:e.U?e.depth:e.fu+e.fv,d:()=>drawEx(g,e,time,hover&&hover.type=='npc'&&hover.e===e)}));
 EX.forEach(e=>{const U=e.UP;if(U&&U.gp&&!U.away&&ON_POSES.includes(U.pose))E.push({depth:U.depth+.01,d:()=>drawFurn(g,G,U.f,null,false,time,U.gp)});});
 if(df){footprint(g,G,df,canPlace(G,df,decor.from));E.push({depth:fBase(G,df).depth+.01,d:()=>drawFurn(g,G,df,.78,false,time)});}
 E.sort((a,b)=>a.depth-b.depth).forEach(e=>e.d());
 if(SC.kind=='place'&&nightF()>0&&!SC.P.neon){g.fillStyle=`rgba(20,20,70,${nightF()*.28})`;g.fillRect(-500,-300,2000,1400);}
 g.restore();}
function plate(g,x,y,txt,stars,col){g.save();g.font='900 12px system-ui';const w=Math.max(g.measureText(txt).width+18,stars!=null?74:0),h=stars!=null?34:22;
 g.fillStyle='rgba(26,20,38,.86)';g.strokeStyle=col||'#ffe16a';g.lineWidth=2;g.beginPath();g.roundRect(x-w/2,y-h/2,w,h,7);g.fill();g.stroke();g.fillStyle='#fff';g.textAlign='center';g.fillText(txt,x,y+(stars!=null?-3:4));
 if(stars!=null){g.font='12px system-ui';for(let i=0;i<5;i++){g.fillStyle=i<stars?'#ffd23a':'#5a5470';g.fillText('★',x-28+i*14,y+12);}}g.restore();}
function drawOverlay(g,time){const [vw,vh]=viewSize();
 if(SC.kind=='room'){const n=SC.n;TENANTS[n].zones.forEach(z=>{const [sx,sy]=W2S(...SC.G.pt(...SC.R.zoneLabel[z.id]));plate(g,sx,sy,z.id,zoneLv(n,z.id),TENANTS[n].color);});
  if(!TN[n]&&S.unlocked.includes(n)){const p=placeOf(n);plate(g,vw/2,vh-46,`${n} is out · ${PLACE_N[p]} until ${fmtH(untilOf(n))}`,null,'#48eaff');}}
 else SC.P.hot.forEach(h=>{const [x,y]=W2S(...hotPos(h));plate(g,x,y+16,h.n,null,h.kind=='exit'?'#5ad07a':'#ffe16a');});
 if(hover){const [x,y]=W2S(hover.x,hover.y),b=Math.sin(time*6)*4,yy=y-(hover.type=='tenant'?SC.ch*.62*cam.z:30)+b;g.save();g.fillStyle='#ffe16a';g.strokeStyle='#30263f';g.lineWidth=2;g.beginPath();g.moveTo(x-9,yy-12);g.lineTo(x+9,yy-12);g.lineTo(x,yy);g.closePath();g.fill();g.stroke();g.restore();
  if(hover.type!='zone'&&hover.type!='hot')plate(g,x,yy-26,hover.label,null,'#ffe16a');}}
function frame(now){const dt=Math.min(.05,(now-lastT)/1000);lastT=now;resize();update(dt);const d=DPR();ctx.setTransform(d,0,0,d,0,0);ctx.clearRect(0,0,cv.width,cv.height);const time=now/1000;
 drawWorld(ctx,time);drawOverlay(ctx,time);requestAnimationFrame(frame);}
let hudT=0,infoKey='',exOpen=null;
function exTick(){if(SC.kind!='place'||!SC.P.extras)return;const h=hour(),o=SC.p=='gym'?(h>=6&&h<23):(h>=20||h<4);if(o!==exOpen){exOpen=o;rebuildOcc(SC.G,sceneFurn());spawnExtras();}}
function update(dt){const paused=dlg.on||sheetOpen()||$('stamp').classList.contains('open');
 if(!paused){tickTime(dt*1.5);tickNeeds(dt*1.5);syncTenants();exTick();}
 if(dlg.on){const l=dlg.lines[dlg.i];if(dlg.ch<l.t.length){dlg.ch=Math.min(l.t.length,dlg.ch+dt*45);$('dlgText').textContent=l.t.slice(0,Math.floor(dlg.ch));}}
 const tdt=paused&&!dlg.on?0:dt;for(const n in TN)updT(TN[n],tdt);EX.forEach(e=>updEx(e,tdt,performance.now()/1000));
 if(!paused&&!floorsOpen()){const v=[(keys.r?1:0)-(keys.l?1:0),(keys.d?1:0)-(keys.u?1:0)];if(v[0]||v[1]){const sp=300/cam.z*dt;cur.x+=v[0]*sp;cur.y+=v[1]*sp*.8;}
  cur.x=clamp(cur.x,20,SC.W-20);cur.y=clamp(cur.y,SC.kind=='place'?170:20,SC.H-20);
  const [vw,vh]=viewSize(),mx=vw*.28/cam.z,my=vh*.26/cam.z;if(!dragging){if(cur.x<cam.x-mx)cam.x+=(cur.x-(cam.x-mx))*Math.min(1,dt*8);if(cur.x>cam.x+mx)cam.x+=(cur.x-(cam.x+mx))*Math.min(1,dt*8);if(cur.y<cam.y-my)cam.y+=(cur.y-(cam.y-my))*Math.min(1,dt*8);if(cur.y>cam.y+my)cam.y+=(cur.y-(cam.y+my))*Math.min(1,dt*8);}clampCam();
  hover=decor?null:targetAt(cur.x,cur.y);}
 hudT-=dt;if(hudT<=0){hudT=.25;updateHud();updateInfo();}}

// ---------------- HUD / info strip / buttons ----------------
function updateHud(){$('day').textContent=`DAY ${S.day} · ${clock()}`;$('money').textContent=money(S.money);$('hearts').textContent=S.hearts;
 const t=floorsOpen()?'BUILDING':SC.kind=='room'?`${SC.n.toUpperCase()}'S ROOM`:SC.title.toUpperCase();$('loc').innerHTML=`${t}<small>${floorsOpen()?'Floor picker':SC.kind=='room'?SC.R.name:SC.p=='lobby'?'1F · Lobby':'Teleport destination'}</small>`;}
function talkTarget(){if(sel&&TN[sel])return sel;if(hover&&hover.type=='tenant')return hover.n;const k=Object.keys(TN);return k.length==1?k[0]:k.length?k[0]:null;}
function updateInfo(){const ic=$('infoIc'),it=$('infoT');let html,icon=null;
 if(floorsOpen()){const u=floorSel();html=u.t?(S.unlocked.includes(u.t)?`<b>${u.t}</b> · ${REL[relLv(u.t)]} · ${placeOf(u.t)=='home'?'At home':'Out: '+PLACE_N[placeOf(u.t)]}<br>OK to visit the room`:`<b>???</b> · Locked resident. Tap FIND NEW RESIDENT (♥ ${FIND_COST[S.unlocked.length]||'—'})`):u.lobby?'<b>1F Lobby</b> · OK to go down to the lobby':'<b>Vacant unit</b> · Coming soon';if(u.t&&S.unlocked.includes(u.t))icon=faceImg(u.t,'normal').src;}
 else if(decor){const f=decorF();html=`<b>Placing: ${furnName(decor.k)}</b> · ${canPlace(SC.G,f,decor.from)?'<span style="color:#1a8a3a">fits here</span>':'<span style="color:#c8323c">blocked</span>'}<br>D-pad move · ROTATE · PLACE · FLOOR = cancel`;}
 else if(hover){const h=hover;if(h.type=='tenant'){const r=R(h.n);html=`<b>${h.n}</b> · ${REL[relLv(h.n)]} ♥ ${r.p}${nextP(h.n)?'/'+nextP(h.n):''}<br>OK profile · TALK · FEED`;icon=faceImg(h.n,'normal').src;}
  else if(h.type=='zone'){const n=SC.n;html=`<b>${h.z}</b> zone ${'★'.repeat(zoneLv(n,h.z))}${'☆'.repeat(5-zoneLv(n,h.z))}<br>${TENANTS[n].zones.find(z=>z.id==h.z).desc}. Add matching furniture to level up.`;}
  else if(h.type=='hot')html=`<b>${h.label}</b><br>OK to ${{door:'ride the elevator',exit:'go out (teleport)',desk:'open reception',food:'order food',shop:'browse furniture',train:'train',dance:'dance',stroll:'take a stroll'}[h.h.kind]}`;
  else if(h.type=='npc')html=`<b>${h.label}</b> · regular here<br>OK to say hi`;
  else html=`<b>${h.label}</b>${h.act?`<br>OK: ${h.act=='fridge'?'open the fridge':'use it'+(SC.kind=='room'?` with ${SC.n}`:'')}`:''}${h.type=='furn'?' · MENU→Decorate to move':''}`;}
 else if(SC.kind=='room'){const n=SC.n;html=TN[n]?`<b>${n}</b> is home. Move the cursor onto furniture or ${n} and press OK.`:`<b>${n}</b> is out at ${PLACE_N[placeOf(n)]} until ${fmtH(untilOf(n))}.`;icon=faceImg(n,'normal').src;}
 else if(SC.p=='lobby')html='<b>Lobby</b> · Elevator → floors · Front door → teleport · Reception → residents';
 else{const pr=Object.keys(TN);html=`<b>${SC.title}</b> · ${pr.length?pr.join(', ')+' '+(pr.length>1?'are':'is')+' here':'No residents here right now'}`;}
 const key=html+icon;if(key!=infoKey){infoKey=key;it.innerHTML=html;ic.style.backgroundImage=icon?`url(${icon})`:'none';ic.style.display=icon?'':'none';}
 const tt=talkTarget();$('bTalk').disabled=!tt&&!decor;$('bFeed').disabled=!tt&&!decor;
 $('bFeed').innerHTML=decor?'ROTATE':'FEED';$('bTalk').innerHTML=decor?'PLACE':'TALK';$('bFloor').innerHTML=decor?'CANCEL<small>put back</small>':floorsOpen()?'BACK<small>to scene</small>':'FLOOR<small>building</small>';}

// ---------------- dialogue (Fantasy Town's system: typewriter, Skip / Hide / Next, face badge) ----------------
const dlg={on:false,lines:[],i:0,ch:0,name:'',hidden:false,after:null,key:''};
function startDialogue(name,lines,after){if(!lines||!lines.length){after&&after();return;}Object.assign(dlg,{on:true,lines,i:0,ch:0,name,hidden:false,after:after||null});$('dlg').style.display='block';document.body.classList.add('dlgon');$('dlgName').textContent=name.toUpperCase();for(const k in keys)keys[k]=0;showLine();}
// mood -> one of the sheet's dialogue poses (tenants with a pose set); others keep their single CG
const POSE_OF={smile:'talking',normal:'talking',happy:'laugh',laugh:'laugh',teasing:'teasing',smirk:'teasing',blush:'embarrassed',blushing:'embarrassed',angry:'angry',thinking:'thinking',sad:'thinking',surprised:'surprised',serious:'serious'};
function cgFor(n){const T=TENANTS[n],l=dlg.lines&&dlg.lines[dlg.i];if(T.poses&&l){const k=POSE_OF[l.e]||'talking',f=T.poses[k];if(f){const I=tImg(n,f);if(ok(I))return{b:I,th:T.pthigh,key:k};}}return{b:tImg(n,T.cg),th:T.thigh,key:'cg'};}
function layoutCG(){const n=dlg.name,C=cgFor(n),b=C.b,pc=$('dlgPortrait');if(!ok(b)){b.onload=()=>dlg.on&&layoutCG();return;}
 const vw=innerWidth,boxTop=$('dlgBox').getBoundingClientRect().top,th=C.th,ar=b.naturalWidth/b.naturalHeight;let H=(boxTop-14)/th,w=H*ar;if(w>vw){w=vw;H=w/ar;}const top=boxTop-th*H,d=DPR();
 const key=n+'|'+C.key+'|'+Math.round(w)+'|'+d;if(dlg.key!=key){dlg.key=key;pc.width=Math.round(w*d);pc.height=Math.round(H*d);const g=pc.getContext('2d');g.clearRect(0,0,pc.width,pc.height);g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.drawImage(b,0,0,pc.width,pc.height);}
 Object.assign(pc.style,{width:w+'px',height:H+'px',top:top+'px',left:(vw-w)/2+'px',transform:'none'});}
function showLine(){const l=dlg.lines[dlg.i],fc=$('dlgFace');layoutCG();const F=faceImg(dlg.name,l.e);
 const putFace=()=>{fc.width=F.naturalWidth;fc.height=F.naturalHeight;const g=fc.getContext('2d');g.clearRect(0,0,fc.width,fc.height);g.drawImage(F,0,0);fc.style.width='84px';fc.style.display='block';};
 if(ok(F))putFace();else{fc.style.display='none';F.onload=()=>{if(dlg.on&&dlg.lines[dlg.i]===l)putFace();};}
 dlg.ch=0;$('dlgText').textContent='';$('dlgBox').style.visibility='visible';dlg.hidden=false;const t=TN[dlg.name];if(t&&l.e){const m={smile:'happy',laugh:'happy',angry:'angry',surprised:'surprised',blush:'blush'}[l.e];if(m)emote(dlg.name,m,2);}}
function dlgNext(){if(!dlg.on)return;const l=dlg.lines[dlg.i];if(dlg.ch<l.t.length){dlg.ch=l.t.length;$('dlgText').textContent=l.t;return;}dlg.i++;if(dlg.i>=dlg.lines.length)dlgClose();else showLine();}
function dlgClose(){dlg.on=false;$('dlg').style.display='none';document.body.classList.remove('dlgon');const a=dlg.after;dlg.after=null;a&&a();}
$('dlgNext').onclick=e=>{e.stopPropagation();dlgNext();};$('dlgSkip').onclick=e=>{e.stopPropagation();dlgClose();};$('dlgHide').onclick=e=>{e.stopPropagation();dlg.hidden=true;$('dlgBox').style.visibility='hidden';};
$('dlg').onclick=()=>{if(dlg.hidden){dlg.hidden=false;$('dlgBox').style.visibility='visible';}else dlgNext();};
addEventListener('resize',()=>{if(dlg.on)layoutCG();});

// ---------------- scenes: enter / floor picker / teleport ----------------
function enterScene(id,quiet){if(decor)cancelDecor();setScene(id);S.scene=id;TN={};EX=[];exOpen=null;hover=null;sel=null;syncTenants(true);exTick();cam.z=fitZoom();
 if(SC.kind=='room'){const t=TN[SC.n],G=SC.G;if(t){[cur.x,cur.y]=G.tc(t.u,t.v);}else{const E=SC.R.entry;[cur.x,cur.y]=SC.R.type=='tile'?G.pt(SC.R.cols/2,SC.R.rows/2):G.tc(...E.t);}}else{cur.x=500;cur.y=430;}
 cam.x=cur.x;cam.y=cur.y-SC.ch*.3;clampCam();closeFloors();closeSheet();save(1);updateHud();infoKey='';if(!quiet)toast(SC.kind=='room'?SC.R.name:SC.title);sfx(660);
 if(SC.kind=='room'&&TN[SC.n]&&R(SC.n).talk==0)setTimeout(()=>emote(SC.n,'happy'),500);}
const FROWS=[{f:'4F',u:[null,null]},{f:'3F',u:['Batzz','Ophion']},{f:'2F',u:['Ares','Zayne']},{lobby:1}];
let fsel={r:2,u:0};const floorsOpen=()=>$('floors').classList.contains('open');
function floorSel(){const row=FROWS[fsel.r];if(row.lobby)return{lobby:1};return{t:row.u[fsel.u],row};}
function renderFloors(){const W=$('fworld');let h=`<div class="bld"><div class="bsign">LUMEN RESIDENCES</div><div class="roof"></div>`;
 FROWS.forEach((row,ri)=>{if(row.lobby){h+=`<div class="lobbyf ${fsel.r==ri?'fl cur':''}" style="${fsel.r==ri?'height:150px;display:grid;grid-template-columns:1fr 1fr 1fr;padding:30px 12px 14px':''}" data-r="${ri}" data-u="0"><div class="ls">♛ LOBBY · 1F</div><div class="door"></div><div class="door"></div><div class="door"></div></div><div class="ground"></div>`;return;}
  h+=`<div class="fl ${fsel.r==ri?'cur':''}"><span class="flabel">${row.f}</span><div class="vine l"></div><div class="vine r"></div>`+row.u.map((t,ui)=>{const s=fsel.r==ri&&fsel.u==ui?' sel':'';
   if(!t)return`<button class="bay${s}" data-r="${ri}" data-u="${ui}"><div class="win"></div><div class="bal"></div><div class="np vac">VACANT</div></button>`;
   const un=S.unlocked.includes(t),out=un&&placeOf(t)!='home';
   return`<button class="bay${s}" data-r="${ri}" data-u="${ui}"><div class="win"></div><div class="bal"></div>${out?`<span class="away">OUT</span>`:''}<div class="av${un?'':' lock'}" style="${un?`background-image:url(${faceImg(t,'normal').src})`:`background:url(${tImg(t,'chibi_front_hd.png').src}) center 4%/170% auto no-repeat`}"></div><div class="np">${un?t+(relLv(t)>=4?' <span class="hrt">♥</span>':''):'???'}</div></button>`;}).join('')+`</div>`;});
 W.innerHTML=h+`</div>`;const c=FIND_COST[S.unlocked.length],left=TENANT_ORDER.length-S.unlocked.length;$('findBtn').innerHTML=left?`FIND NEW<br>RESIDENT<small>♥ ${c}</small>`:`ALL<br>RESIDENTS<small>${S.unlocked.length}/4</small>`;$('findBtn').disabled=!left;
 W.querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>{const r=+b.dataset.r,u=+b.dataset.u;if(fsel.r==r&&fsel.u==u)enterFloorSel();else{fsel={r,u};renderFloors();}});
 requestAnimationFrame(()=>{const cur=W.querySelector('.cur')||W.querySelector('.sel');if(!cur)return;const vh=$('floors').clientHeight,y=cur.offsetTop+cur.offsetHeight/2;W.style.transform=`translate(-50%,${Math.min(10,vh*.45-y)}px)`;});updateInfo();}
function openFloors(){if(decor)cancelDecor();const r=FROWS.findIndex(q=>q.u&&q.u.includes(SC.n));if(SC.kind=='room'&&r>=0)fsel={r,u:FROWS[r].u.indexOf(SC.n)};else if(SC.p=='lobby')fsel={r:2,u:0};$('floors').classList.add('open');renderFloors();updateHud();sfx(520);}
function closeFloors(){$('floors').classList.remove('open');updateHud();}
function floorNav(d){if(d=='u')fsel.r=Math.max(0,fsel.r-1);if(d=='d')fsel.r=Math.min(FROWS.length-1,fsel.r+1);if(d=='l')fsel.u=0;if(d=='r')fsel.u=1;if(FROWS[fsel.r].lobby)fsel.u=0;sfx(440);renderFloors();}
function enterFloorSel(){const s=floorSel();if(s.lobby){enterScene('lobby');return;}if(!s.t){toast('Vacant unit — no resident yet');return;}if(!S.unlocked.includes(s.t)){toast(`Locked. FIND NEW RESIDENT costs ♥ ${FIND_COST[S.unlocked.length]}`);sfx(180);return;}enterScene('room:'+s.t);}
$('findBtn').onclick=()=>findResident();
function findResident(){const locked=TENANT_ORDER.filter(n=>!S.unlocked.includes(n));if(!locked.length){toast('Every unit is occupied!');return;}const c=FIND_COST[S.unlocked.length];
 if(S.hearts<c){toast(`Need ♥ ${c}. Talk to and feed residents to earn hearts.`);sfx(180);return;}S.hearts-=c;const n=rnd(locked);S.unlocked.push(n);save(1);showStamp(n);if(floorsOpen()){const r=FROWS.findIndex(q=>q.u&&q.u.includes(n));fsel={r,u:FROWS[r].u.indexOf(n)};renderFloors();}updateHud();}
function showStamp(n){const T=TENANTS[n],fl=FROWS.find(q=>q.u&&q.u.includes(n)).f,st=$('stamp');sfx(990);setTimeout(()=>sfx(1320),180);
 st.innerHTML=`<div class="scard"><div class="ph" style="background-image:url(${faceImg(n,'smile').src})"></div><img class="chb" src="${tImg(n,'chibi_front_hd.png').src}"><div class="nm">NAME:<br><span style="font-size:18px;color:#1a1a3a">${n.toUpperCase()}</span><br>${T.plate}</div>
 <div class="stp">YOU GOT A<br>NEW RESIDENT!</div><div class="msg">Congratulations!<br>A new resident has arrived at Lumen Residences. ${n} — ${T.title} — moved into ${ROOMS[n].name} (${fl}).<br>Sincerely, Lumen Residences</div><div class="tap">TAP TO CONTINUE</div></div>`;
 st.classList.add('open');st.onclick=()=>{st.classList.remove('open');};}
function thumb(c,p){const g=c.getContext('2d'),w=c.width=224,h=c.height=140,s=.3,G=placeGrid(),t=performance.now()/1000;g.save();g.translate(w/2,h/2);g.scale(s,s);g.translate(-500,-400);drawPlace(g,p,t);
 PLACES[p].props.slice().sort((a,b)=>fBase(G,a).depth-fBase(G,b).depth).forEach(f=>drawFurn(g,G,f,null,false,t));g.restore();}
function openTeleport(){const list=['lobby',...TRAVEL];const here=SC.kind=='place'?SC.p:null;
 openSheet(`<h3>WHERE TO?</h3><p>No town to walk — tap a place to teleport there. Residents head out on their own schedules.</p>`+list.map(p=>{const who=p=='lobby'?[]:S.unlocked.filter(n=>placeOf(n)==p);
  return`<button class="tp" onclick="enterScene('${p=='lobby'?'lobby':'place:'+p}')"><canvas data-p="${p}"></canvas><div><b>${p=='lobby'?'Lumen Residences':PLACES[p].n}</b><small>${p==here?'You are here':p=='lobby'?'Lobby · elevator to the floors':PLACE_DESC[p]}</small>${who.length?`<em>Here now: ${who.join(', ')}</em>`:''}</div></button>`;}).join(''));
 $('sheetBox').querySelectorAll('canvas[data-p]').forEach(c=>thumb(c,c.dataset.p));}
function hotAct(h){const pr=Object.keys(TN).filter(n=>!TN[n].leaving);
 if(h.kind=='door')return openFloors();if(h.kind=='exit')return openTeleport();if(h.kind=='desk')return reception();if(h.kind=='food')return foodShop(SC.p);if(h.kind=='shop')return openShop();
 if(!pr.length){toast('No residents here right now — check the schedules in MENU → Residents');return;}const n=talkTarget()||pr[0],T=TENANTS[n],t=TN[n],G=SC.G;
 const after=()=>{const r=R(n),k='out_'+h.kind,first=!r.used[k];r.used[k]=1;
  const lines=h.kind=='train'?(T.out.gym||T.use.lift):h.kind=='dance'?(T.out.club||[L("You came to dance with me? ...Fine. One song.",'blush')]):(T.out.park||[L("Nice day for a walk, isn't it?",'smile')]);
  startDialogue(n,lines,()=>{if(TN[n]){TN[n].act=null;TN[n].hold=0;}if(first)gain(n,4,{train:'trained together',dance:'danced together',stroll:'strolled together'}[h.kind]);});};
 halt(t);sfx(660);
 if(h.kind=='train'){const free=usables().filter(u=>['run','lift','stretch','pull','punch'].includes(u.act)&&!EX.some(e=>e.U===u.f)&&u.stand.length);const U=free.length?rnd(free):null;if(U){t.onUseStart=after;if(goUse(t,U))return;t.onUseStart=null;}}
 if(h.kind=='dance'&&SC.P.dance){const [a,b,w,hh]=SC.P.dance,tiles=[];for(let u=a;u<a+w;u++)for(let v=b;v<b+hh;v++)if(G.free(u,v))tiles.push([u,v]);if(tiles.length&&goTo(t,rnd(tiles),()=>{t.state='use';t.U={act:'dance',pose:'dance',stand:[]};t.onIt=false;t.useT=10;t.bubble={k:'note',t:2};setTimeout(after,400);}))return;}
 const g=h.t||[5,5],c=[[0,1],[1,0],[0,-1],[-1,0],[1,1]].map(([a,b])=>[g[0]+a,g[1]+b]).filter(([u,v])=>G.free(u,v));if(c.length&&goTo(t,rnd(c),()=>{t.state='idle';t.idle=5;t.act='talk';t.hold=1;setTimeout(()=>{after();},300);}))return;
 after();}
// ---------------- interactions ----------------
function actOn(t){if(!t){toast('Move the cursor onto a resident, furniture or a door, then press OK');return;}
 if(t.type=='tenant'){sel=t.n;openProfile(t.n);}else if(t.type=='zone')zoneInfo(SC.n,t.z);else if(t.type=='hot')hotAct(t.h);else useThing(t);}
const ACT_LINES={shower:'bath',wash:'bath',dj:'read',fridge:'cook',coach:'lift'};
function useThing(t){if(t.type=='npc'){const e=t.e;sfx(700);toast(`${e.c.n}: "${e.c.talk||'Hey!'}"`);return;}
 if(t.act=='fridge'&&SC.kind=='room')return openFridge(SC.n);if(!t.act){toast(`${t.label} · decoration`);return;}
 const n=SC.kind=='room'?(TN[SC.n]&&!TN[SC.n].leaving?SC.n:null):talkTarget();
 if(!n){toast(SC.kind=='room'?`${SC.n} is out right now — come back later`:'No resident here to use it with');sfx(180);return;}
 const tn=TN[n],G=SC.G;let U=null;if(t.type=='spot')U=usables().find(u=>u.spot===t.s);else U=usePoint(G,t.f);
 if(!U||!U.stand.length){toast(`There's no room to reach the ${t.label.toLowerCase()}`);sfx(180);return;}
 if(t.act=='dj'&&!(SC.kind=='place'&&n=='Zayne')){toast('Only the DJ touches the decks!');return;}
 halt(tn);sfx(660);tn.onUseStart=()=>{const r=R(n),first=!r.used[t.act];r.used[t.act]=1;emote(n,'happy');
  if(t.act=='toilet'){toast(`${n}: "A little privacy, please!"`);return;}
  const lines=TENANTS[n].use[t.act]||TENANTS[n].use[ACT_LINES[t.act]]||[L('...','normal')];startDialogue(n,lines,()=>{if(first)gain(n,2,t.label);});};
 if(!goUse(tn,U)){tn.onUseStart=null;toast(`${n} can't find a way there`);sfx(180);}}
function talk(n){if(!n||!TN[n])return;const r=R(n),T=TENANTS[n],lv=relLv(n),t=TN[n];if(t.state=='use'&&t.onIt){/* keep sitting / lying while chatting */t.hold=1;}else{halt(t);t.act='talk';t.hold=1;}
 const done=()=>{if(TN[n]){TN[n].act=null;TN[n].hold=0;}};
 if(r.engaged&&!r.married&&S.day>r.engDay){r.married=1;r.p=Math.max(r.p,REL_P[7]);return startDialogue(n,T.wed,()=>{done();toast(`You and ${n} are married!`);emote(n,'happy');save(1);});}
 const lines=r.talk==0?(SC.kind=='place'&&T.out[SC.p]?[...T.greet[lv].slice(0,1),...T.out[SC.p]]:T.greet[lv]):T.talks[(S.day*3+r.talk)%T.talks.length];
 sfx(760);startDialogue(n,lines,()=>{done();if(r.talk<3){r.talk++;gain(n,3,'chat');}else toast(`${n}: "We've talked plenty today!"`);save(1);});}
function foodList(src){return Object.entries(src).filter(([k,v])=>v>0);}
function openFeed(n){if(!n)return;const inRoom=SC.kind=='room'&&SC.n==n,fr=S.rooms[n].fridge,r=R(n);
 const cell=(k,v,from)=>`<button class="fcell" onclick="feed('${n}','${k}','${from}')"><img src="${foodImg(k).src}"><span>${FOOD[k].n}</span><i>${v}</i></button>`;
 openSheet(`<h3>FEED ${n.toUpperCase()}</h3><p>${r.fed>=3?`${n} is full for today.`:`Feed up to 3 times a day. Favourite foods give the most ♥.`}</p>`+
  (inRoom?`<div class="fr"><div><h4>${n.toUpperCase()}'S FRIDGE</h4>${foodList(fr).map(([k,v])=>cell(k,v,'fridge')).join('')||'<p>Empty</p>'}</div><div><h4>YOUR BAG</h4>${foodList(S.bag).map(([k,v])=>cell(k,v,'bag')).join('')||'<p>Empty — buy food at the Cafe or Restaurant</p>'}</div></div>`
  :`<h4 style="margin:4px 0">YOUR BAG</h4>${foodList(S.bag).map(([k,v])=>cell(k,v,'bag')).join('')||'<p>Your bag is empty — buy food at the Cafe or Restaurant counter.</p>'}`));}
function feed(n,k,from){const r=R(n),T=TENANTS[n],src=from=='fridge'?S.rooms[n].fridge:S.bag;if(r.fed>=3){toast(`${n} is full for today`);return;}if(!src[k])return;src[k]--;r.fed++;closeSheet();
 const love=T.foodLove.includes(k),hate=T.foodHate.includes(k),t=TN[n];if(t){halt(t);t.act='feed';t.hold=1;}sfx(880);const q=needs(n);q.food=Math.min(100,q.food+40);
 startDialogue(n,[L(`(You hand ${n} the ${FOOD[k].n.toLowerCase()}.)`,'normal'),...(love?T.fedLove:hate?T.fedHate:T.fedOk)],()=>{if(TN[n]){TN[n].act=null;TN[n].hold=0;}gain(n,love?6:hate?-1:3,FOOD[k].n);emote(n,love?'happy':hate?'angry':'happy');save(1);});}
function openFridge(n,flash){const fr=S.rooms[n].fridge;const cell=(k,v,act)=>`<button class="fcell" onclick="fridgeMove('${n}','${k}','${act}')"><img src="${foodImg(k).src}"><span>${FOOD[k].n}</span><i>${v}</i><b>${act=='take'?'TAKE →':'← PUT'}</b></button>`;
 openSheet(`<h3>${n.toUpperCase()}'S FRIDGE</h3><p>Stock the fridge so you can FEED ${n} at home. Tap an item to move it.</p><div class="fridgeview"><div class="fr"><div><h4>IN THE FRIDGE</h4>${foodList(fr).map(([k,v])=>cell(k,v,'take')).join('')||'<p style="text-align:center">Empty</p>'}</div><div><h4>YOUR BAG</h4>${foodList(S.bag).map(([k,v])=>cell(k,v,'put')).join('')||'<p style="text-align:center">Empty</p>'}</div></div></div>`+
  (TN[n]?`<button class="mbtn pink" onclick="openFeed('${n}')">FEED ${n.toUpperCase()} NOW</button>`:'')+`<p style="font-size:11px">Food is sold at Cafe Lumière, Restaurant Rosso and the Night Club bar (teleport via the lobby door).</p>`);}
function fridgeMove(n,k,a){const fr=S.rooms[n].fridge;if(a=='take'){if(!fr[k])return;fr[k]--;S.bag[k]=(S.bag[k]||0)+1;}else{if(!S.bag[k])return;S.bag[k]--;fr[k]=(fr[k]||0)+1;}sfx(600);save(1);openFridge(n);}
function openProfile(n){const T=TENANTS[n],r=R(n),lv=relLv(n),np=nextP(n),p0=REL_P[lv],pc=np?Math.round((r.p-p0)/(np-p0)*100):100,where=placeOf(n);
 let cb;if(r.married)cb=`<button class="conf" disabled>MARRIED ♥</button>`;else if(r.engaged)cb=`<button class="conf" disabled>ENGAGED · TALK TOMORROW</button>`;
 else if(r.dating)cb=r.p>=REL_P[6]&&S.ring?`<button class="conf ready" onclick="propose('${n}')">PROPOSE</button>`:`<button class="conf" disabled>PROPOSE · needs ♥${REL_P[6]} + ring</button>`;
 else cb=r.p>=REL_P[4]?`<button class="conf ready" onclick="confess('${n}')">CONFESSION</button>`:`<button class="conf" disabled>CONFESSION · at ♥${REL_P[4]}</button>`;
 openSheet(`<div class="pcard"><div class="ptop"><div class="pface" style="background-image:url(${faceImg(n,'normal').src})"></div><div style="flex:1;min-width:0"><div class="pname">${n.toUpperCase()}</div><div class="ptitle">${T.title}</div>
 <div style="font-size:12px;font-weight:900;margin:6px 0 3px">${REL[lv]} · ♥ ${r.p}${np?' / '+np:''}</div><div class="hbar"><i style="width:${pc}%"></i></div><div style="font-size:11px;font-weight:800;margin-top:5px">${where=='home'?'At home now':'Out: '+PLACE_N[where]+' until '+fmtH(untilOf(n))}</div></div><img class="pchibi" src="${tImg(n,'chibi_front_hd.png').src}"></div>
 <div class="pbio">${T.bio}</div>`+T.zones.map(z=>{const zl=zoneLv(n,z.id);return`<div class="zrow"><b>${z.id}</b>${[1,2,3,4,5].map(i=>`<button class="${i<=zl?'on':''}${i==zl?' cur':''}" ${i<=zl?`onclick="zoneScene('${n}','${z.id}',${i})"`:'disabled'}>${i}</button>`).join('')}</div>`;}).join('')+
 `<div style="display:flex;justify-content:space-between;align-items:flex-end;gap:8px">${cb}<small style="font-size:10px;color:#5a6a8a;font-weight:700">Talk ${r.talk}/3 · Fed ${r.fed}/3 today</small></div></div>
 <div class="grid2"><button class="mbtn talk" style="background:linear-gradient(#8ee05a,#3fa628);color:#fff" onclick="closeSheet();talk('${n}')" ${TN[n]?'':'disabled'}>TALK</button><button class="mbtn pink" onclick="openFeed('${n}')" ${TN[n]?'':'disabled'}>FEED</button></div>
 ${SC.kind=='room'&&SC.n==n?'':`<button class="mbtn blue" onclick="enterScene('room:${n}')">Visit ${n}'s room</button>`}<p style="font-size:11px">Schedule: ${T.sched.map(([h,p])=>fmtH(h)+' '+PLACE_N[p]).join(' → ')}</p>`);}
function zoneScene(n,z,i){closeSheet();startDialogue(n,[L(TENANTS[n].zoneL[z][i-1],i>=4?'smile':i<=1?'teasing':'normal')]);}
function confess(n){closeSheet();const r=R(n);startDialogue(n,TENANTS[n].confess,()=>{r.dating=1;r.p=Math.max(r.p,REL_P[5]);toast(`You and ${n} are now dating!`);emote(n,'happy');sfx(1320);save(1);updateHud();});}
function propose(n){closeSheet();const r=R(n);S.ring--;startDialogue(n,TENANTS[n].propose,()=>{r.engaged=1;r.engDay=S.day;r.p=Math.max(r.p,REL_P[6]);toast(`Engaged to ${n}! Talk to ${n} tomorrow for the wedding.`);emote(n,'happy');save(1);});}
function zoneInfo(n,z){const Z=TENANTS[n].zones.find(q=>q.id==z),lv=zoneLv(n,z),items=Object.keys(FURN).filter(k=>FURN[k].act&&Z.acts.includes(FURN[k].act));
 openSheet(`<h3>${z} ZONE · ${'★'.repeat(lv)}${'☆'.repeat(5-lv)}</h3><p>${Z.desc}. Each matching item placed in ${n}'s room adds a star (max 5). Higher zones unlock more of ${n}'s zone scenes on the profile card.</p><p><i>"${TENANTS[n].zoneL[z][lv-1]}"</i></p><div class="grid3">`+
  items.map(k=>`<button class="item" onclick="buy('${k}',1)"><span class="own">${S.inv[k]||0}</span><img src="${furnThumb(k)}"><span>${FURN[k].n}</span><span class="pr">${money(FURN[k].p)}</span></button>`).join('')+`</div><button class="mbtn blue" onclick="decorMenu()">Decorate this room</button>`);}
function reception(){const left=TENANT_ORDER.length-S.unlocked.length;openSheet(`<h3>RECEPTION</h3><p>Residents pay <b>£20 a day</b> each, collected every morning at 6 AM.</p>
 <button class="mbtn gold" onclick="closeSheet();findResident()" ${left?'':'disabled'}>FIND NEW RESIDENT<small>${left?`Costs ♥ ${FIND_COST[S.unlocked.length]} · you have ♥ ${S.hearts}`:'All four units are occupied'}</small></button>
 <button class="mbtn" onclick="residents()">Resident list<small>profiles, schedules, hearts</small></button><button class="mbtn" onclick="openFloors();closeSheet()">Elevator · floor picker</button>`);}
function foodShop(p){const list=SHOP_FOOD[p]||SHOP_FOOD.cafe;openSheet(`<h3>${PLACES[p].n.toUpperCase()} · MENU</h3><p>Food goes into your bag. Put it in a resident's fridge or FEED it directly. You have ${money(S.money)}.</p><div class="grid3">`+
 list.map(k=>`<button class="item" onclick="buyFood('${k}','${p}')"><span class="own">${S.bag[k]||0}</span><img src="${foodImg(k).src}"><span>${FOOD[k].n}</span><span class="pr">${money(FOOD[k].p)}</span></button>`).join('')+`</div>`);}
function buyFood(k,p){if(S.money<FOOD[k].p){toast('Not enough money');sfx(180);return;}S.money-=FOOD[k].p;S.bag[k]=(S.bag[k]||0)+1;sfx(900);toast(`Bought ${FOOD[k].n}`);save(1);foodShop(p);updateHud();}
let shopCat='Gym';
function openShop(cat){if(cat)shopCat=cat;const ks=Object.keys(FURN).filter(k=>FURN[k].cat==shopCat);
 openSheet(`<h3>FURNITURE SHOP</h3><p>Paid from rent money · you have <b>${money(S.money)}</b>. Bought items go to storage; place them with MENU → Decorate.</p><div class="tabs">${FURN_CATS.map(c=>`<button class="tab${c==shopCat?' on':''}" onclick="openShop('${c}')">${c}</button>`).join('')}</div><div class="grid3">`+
 ks.map(k=>{const F=FURN[k],own=k=='ring'?S.ring:(S.inv[k]||0);return`<button class="item" onclick="buy('${k}')"><span class="own">${own}</span><img src="${k=='ring'?RING:furnThumb(k)}"><span>${F.n}</span><span class="pr">${money(F.p)}</span>${F.act?`<small style="font-size:9px;color:#6a5a72">use: ${F.act}</small>`:''}</button>`;}).join('')+`</div>`);}
function buy(k,fromZone){const F=FURN[k];if(S.money<F.p){toast(`Not enough money (${money(F.p)})`);sfx(180);return;}S.money-=F.p;if(k=='ring')S.ring++;else S.inv[k]=(S.inv[k]||0)+1;sfx(900);save(1);updateHud();
 if(k!='ring'&&SC.kind=='room'){openSheet(`<h3>BOUGHT: ${F.n.toUpperCase()}</h3><div style="text-align:center"><img src="${furnThumb(k)}" style="max-height:120px"></div><button class="mbtn gold" onclick="startDecor('${k}')">Place it in ${SC.n}'s room now</button><button class="mbtn" onclick="openShop()">Keep shopping</button>`);}
 else{toast(`Bought ${F.n}`);if(fromZone)zoneInfo(SC.n,fromZone);else openShop();}}
// decorate: buy → place, rotate (mirror to the other iso facing), move, store
function decorMenu(){if(SC.kind!='room'){toast('Go to a resident\'s room to decorate');return;}const n=SC.n,inv=Object.entries(S.inv).filter(([k,v])=>v>0&&FURN[k]),placed=S.rooms[n].furn;
 openSheet(`<h3>DECORATE · ${ROOMS[n].name.toUpperCase()}</h3><p>Choose an item from storage, move it with the D-pad (it snaps to the floor tiles — green fits, red is blocked), ROTATE, then PLACE.${SC.R.type=='paint'?' This apartment is painted art with its own furniture, so new pieces go on the free floor only.':''}</p><h4 style="margin:6px 0">STORAGE</h4><div class="grid3">`+(inv.map(([k,v])=>`<button class="item" onclick="startDecor('${k}')"><span class="own">${v}</span><img src="${furnThumb(k)}"><span>${FURN[k].n}</span></button>`).join('')||'<p>Empty — buy furniture in the shop.</p>')+`</div>
 <button class="mbtn gold" onclick="openShop()">Open the furniture shop</button><h4 style="margin:10px 0 6px">PLACED IN THIS ROOM</h4><div class="grid3">`+(placed.map((f,i)=>`<button class="item" onclick="pickFurn(${i})"><img src="${furnThumb(f.k)}"><span>${furnName(f.k)}</span><small style="font-size:9px">move / store</small></button>`).join('')||'<p>Nothing placed yet.</p>')+`</div>`);}
function startDecor(k){if(SC.kind!='room')return;if(!S.inv[k]){toast('None in storage');return;}S.inv[k]--;decor={k,r:0,from:null};closeSheet();toast('Move with the D-pad · ROTATE · PLACE');updateInfo();}
function pickFurn(i){const f=S.rooms[SC.n].furn[i];decor={k:f.k,r:f.r||0,from:f};const [x,y]=SC.G.pt(f.u+fpOf(f)[0]/2,f.v+fpOf(f)[1]/2);cur.x=x;cur.y=y;closeSheet();toast('Move it, ROTATE, PLACE — or MENU to store it');}
function placeDecor(){if(!decor)return;const f=decorF(),G=SC.G;if(!canPlace(G,f,decor.from)){toast("It doesn't fit there — find a free green spot");sfx(180);return;}
 const fs=S.rooms[SC.n].furn;if(decor.from){Object.assign(decor.from,{u:f.u,v:f.v,r:f.r});}else fs.push({k:f.k,u:f.u,v:f.v,r:f.r});
 toast(`${furnName(decor.k)} placed`);sfx(720);decor=null;rebuildOcc(G,sceneFurn());save(1);updateInfo();const n=SC.n;if(TN[n])setTimeout(()=>emote(n,'happy'),300);}
function cancelDecor(){if(!decor)return;if(!decor.from)S.inv[decor.k]=(S.inv[decor.k]||0)+1;decor=null;updateInfo();}
function storeDecor(){if(!decor)return;if(decor.from){const fs=S.rooms[SC.n].furn,i=fs.indexOf(decor.from);if(i>=0)fs.splice(i,1);}S.inv[decor.k]=(S.inv[decor.k]||0)+1;toast(`${furnName(decor.k)} stored`);decor=null;rebuildOcc(SC.G,sceneFurn());closeSheet();save(1);}

// ---------------- MENU ----------------
function openMenu(){if(decor){openSheet(`<h3>PLACING ${FURN[decor.k].n.toUpperCase()}</h3><button class="mbtn" onclick="decor.r=(decor.r+1)%4;closeSheet()">Rotate</button><button class="mbtn gold" onclick="closeSheet();placeDecor()">Place here</button><button class="mbtn" onclick="storeDecor()">Put it in storage</button><button class="mbtn" onclick="closeSheet();cancelDecor()">Cancel</button>`);return;}
 openSheet(`<h3>MENU</h3><div class="grid2">
 <button class="mbtn blue" onclick="saveSlot()">Save game<small>manual slot + autosave</small></button><button class="mbtn" onclick="loadSlot()">Load game<small>${localStorage.getItem(SLOT)?'slot 1':'no save yet'}</small></button>
 <button class="mbtn" onclick="residents()">Residents<small>tenant info</small></button><button class="mbtn gold" onclick="openShop()">Shop<small>furniture · ring</small></button>
 <button class="mbtn" onclick="decorMenu()" ${SC.kind=='room'?'':'disabled'}>Decorate<small>${SC.kind=='room'?'this room':'in a room only'}</small></button><button class="mbtn" onclick="bagView()">Bag<small>food you carry</small></button>
 <button class="mbtn" onclick="openTeleport()">Teleport<small>gym, cafe, club…</small></button><button class="mbtn pink" onclick="devPanel()">Cheats<small>developer tools</small></button></div>
 <button class="mbtn" onclick="helpSheet()">How to play</button><button class="mbtn" onclick="if(confirm('Reset all progress?')){localStorage.removeItem('${SAVE}');location.reload()}">Reset save</button><p style="font-size:11px;text-align:center">Lumen Residences ${VERSION}</p>`);}
function saveSlot(){save(1,SLOT);save(1);toast('Saved to slot 1');openMenu();}
function loadSlot(){const j=load(SLOT);if(!j){toast('No saved game in slot 1');return;}S=j;enterScene(S.scene,1);toast('Loaded slot 1 · Day '+S.day);}
function residents(){openSheet(`<h3>RESIDENTS</h3>`+TENANT_ORDER.map(n=>{const un=S.unlocked.includes(n);return un?`<button class="mbtn" style="display:flex;gap:10px;align-items:center" onclick="openProfile('${n}')"><span style="width:46px;height:46px;border-radius:10px;border:2px solid #30263f;background:#222 url(${faceImg(n,'normal').src}) center 15%/cover;flex:0 0 auto"></span><span>${n} · ${REL[relLv(n)]} ♥ ${R(n).p}<small>${placeOf(n)=='home'?'At home':'Out: '+PLACE_N[placeOf(n)]} · ${TENANTS[n].title}</small></span></button>`
 :`<button class="mbtn" disabled style="display:flex;gap:10px;align-items:center"><span style="width:46px;height:46px;border-radius:10px;border:2px solid #30263f;background:#222 url(${faceImg(n,'normal').src}) center 15%/cover;filter:brightness(0);flex:0 0 auto"></span><span>???<small>Find New Resident to unlock</small></span></button>`;}).join(''));}
function bagView(){const f=foodList(S.bag);openSheet(`<h3>BAG</h3>${f.map(([k,v])=>`<div class="fcell"><img src="${foodImg(k).src}"><span>${FOOD[k].n}</span><i>${v}</i></div>`).join('')||'<p>Empty.</p>'}<p>Rings: ${S.ring}</p>`);}
function helpSheet(){S.seenHelp=1;save(1);openSheet(`<h3>WELCOME, MANAGER</h3><p>You run <b>Lumen Residences</b>. Each resident pays <b>£20 a day</b>.</p>
 <p>• <b>D-pad</b> moves the cursor (or tap the screen, drag to look around). <b>OK</b> uses what's under it.</p><p>• <b>FLOOR</b> opens the building: tap a resident's face to visit. <b>FIND NEW RESIDENT</b> costs hearts.</p>
 <p>• <b>TALK</b> and <b>FEED</b> earn hearts. Use furniture together. Hearts climb Stranger → Friend → Crush → Dating → Engaged → Married.</p><p>• The lobby <b>front door</b> teleports you to the Gym, Cafe, Restaurant, Park, Furniture Shop and Night Club.</p>
 <p>• <b>MENU</b>: save/load, residents, shop, decorate, cheats.</p><button class="mbtn gold" onclick="closeSheet()">Let's go!</button>`);}
// ---------------- Cheats (developer panel, as in Fantasy Town v0.0.2.3) ----------------
let DBG=localStorage.getItem('lr_dbg')=='1',devT='Ares';
function devDo(k,v){if(k=='money'){S.money+=v;toast('+'+money(v));}else if(k=='hearts'){S.hearts+=v;toast('♥ +'+v);}
 else if(k=='unlock'){TENANT_ORDER.forEach(n=>{if(!S.unlocked.includes(n))S.unlocked.push(n);});toast('All residents unlocked');}
 else if(k=='tenant'){devT=v;}
 else if(k=='rel'){const r=R(devT);r.p=REL_P[v];r.dating=v>=5?1:0;r.engaged=v>=6?1:0;r.married=v>=7?1:0;r.engDay=S.day;if(!S.unlocked.includes(devT))S.unlocked.push(devT);toast(`${devT} → ${REL[v]}`);}
 else if(k=='hour'){tickTime(60);toast('+1 hour');}else if(k=='day'){S.min=5*60+59;tickTime(1);return;}
 else if(k=='ring'){S.ring++;toast('Ring added');}else if(k=='furn'){for(const q in FURN)if(!FURN[q].item)S.inv[q]=(S.inv[q]||0)+3;toast('+3 of every furniture item');}
 else if(k=='food'){for(const q in FOOD)S.bag[q]=(S.bag[q]||0)+3;toast('+3 of every food');}
 else if(k=='dbg'){DBG=!DBG;localStorage.setItem('lr_dbg',DBG?'1':'0');}
 else if(k=='tp'){closeSheet();enterScene(v);return;}
 save(1);updateHud();devPanel();}
function devPanel(){const B=(k,v,t)=>`<button class="mbtn" style="margin:0;padding:8px;font-size:12px" onclick="devDo('${k}',${typeof v=='string'?`'${v}'`:v})">${t}</button>`;
 openSheet(`<h3>CHEATS · DEVELOPER</h3><p>Day ${S.day} · ${clock()} · ${money(S.money)} · ♥ ${S.hearts}</p><b>Teleport</b><div class="grid3">${B('tp','lobby','Lobby')}${TENANT_ORDER.map(n=>B('tp','room:'+n,n+"'s room")).join('')}${TRAVEL.map(p=>B('tp','place:'+p,PLACES[p].n)).join('')}</div>
 <b>Money & hearts</b><div class="grid3">${B('money',100,'+ £100')}${B('money',1000,'+ £1,000')}${B('hearts',50,'+ ♥ 50')}</div>
 <b>Relationship</b><div class="tabs">${TENANT_ORDER.map(n=>`<button class="tab${n==devT?' on':''}" onclick="devDo('tenant','${n}')">${n}</button>`).join('')}</div><div class="grid3">${REL.map((r,i)=>B('rel',i,(relLv(devT)==i?'● ':'')+r)).join('')}</div>
 <b>World</b><div class="grid3">${B('unlock',0,'Unlock all residents')}${B('hour',0,'+1 hour')}${B('day',0,'Next day (rent)')}${B('ring',0,'Give ring')}${B('furn',0,'+3 all furniture')}${B('food',0,'+3 all food')}${B('dbg',0,'FPS overlay: '+(DBG?'ON':'OFF'))}</div>`);}
let fN=0,fT=performance.now();(function tick(now){fN++;if(now-fT>=500){const fps=Math.round(fN*1000/(now-fT));fN=0;fT=now;const o=$('dbgov');o.style.display=DBG?'block':'none';if(DBG)o.textContent=`FPS ${fps} · ${S.scene} · ${clock()} · z ${cam.z.toFixed(2)} · cur ${Math.round(cur.x)},${Math.round(cur.y)} · tenants ${Object.keys(TN).join(',')||'-'}`;}requestAnimationFrame(tick);})(performance.now());

// ---------------- input: D-pad, keys, tap / drag ----------------
const keys={u:0,d:0,l:0,r:0};
document.querySelectorAll('.dp').forEach(b=>{const d=b.dataset.d;
 b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);b.classList.add('on');if(floorsOpen())floorNav(d);else keys[d]=1;});
 const up=()=>{keys[d]=0;b.classList.remove('on');};b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);b.addEventListener('lostpointercapture',up);});
function okPress(){if(dlg.on){dlgNext();return;}if(sheetOpen())return;if(floorsOpen())return enterFloorSel();if(decor)return placeDecor();actOn(hover);}
$('ok').addEventListener('click',okPress);
$('bFloor').onclick=()=>{if(decor){cancelDecor();toast('Cancelled');return;}floorsOpen()?closeFloors():openFloors();};
$('bMenu').onclick=()=>openMenu();
$('bTalk').onclick=()=>{if(decor)return placeDecor();talk(talkTarget());};
$('bFeed').onclick=()=>{if(decor){decor.r=(decor.r+1)%4;sfx(520);return;}openFeed(talkTarget());};
addEventListener('keydown',e=>{const m={ArrowUp:'u',KeyW:'u',ArrowDown:'d',KeyS:'d',ArrowLeft:'l',KeyA:'l',ArrowRight:'r',KeyD:'r'}[e.code];
 if(m){if(floorsOpen()&&!e.repeat)floorNav(m);else keys[m]=1;e.preventDefault();}
 if(e.code=='Enter'||e.code=='Space'){okPress();e.preventDefault();}if(e.code=='Escape'){if(sheetOpen())closeSheet();else if(floorsOpen())closeFloors();else if(decor)cancelDecor();}
 if(e.code=='KeyT'&&!dlg.on&&!sheetOpen())talk(talkTarget());if(e.code=='KeyM'&&!dlg.on)openMenu();});
addEventListener('keyup',e=>{const m={ArrowUp:'u',KeyW:'u',ArrowDown:'d',KeyS:'d',ArrowLeft:'l',KeyA:'l',ArrowRight:'r',KeyD:'r'}[e.code];if(m)keys[m]=0;});
let dragging=false,pd=null;
cv.addEventListener('pointerdown',e=>{pd={x:e.clientX,y:e.clientY,cx:cam.x,cy:cam.y,ux:cur.x,uy:cur.y};cv.setPointerCapture(e.pointerId);});
cv.addEventListener('pointermove',e=>{if(!pd)return;const dx=e.clientX-pd.x,dy=e.clientY-pd.y;if(!dragging&&Math.hypot(dx,dy)>9)dragging=true;if(dragging){cam.x=pd.cx-dx/cam.z;cam.y=pd.cy-dy/cam.z;clampCam();cur.x=pd.ux+(cam.x-pd.cx);cur.y=pd.uy+(cam.y-pd.cy);}});
cv.addEventListener('pointerup',e=>{if(!pd)return;const wasDrag=dragging;dragging=false;pd=null;if(wasDrag)return;const r=cv.getBoundingClientRect(),[x,y]=S2W(e.clientX-r.left,e.clientY-r.top);cur.x=x;cur.y=y;if(decor)return;const t=targetAt(x,y,60/cam.z);hover=t;if(t)actOn(t);});
cv.addEventListener('pointercancel',()=>{dragging=false;pd=null;});

// ---------------- ring illustration (no sheet art exists for it) ----------------
const RING=(()=>{const c=document.createElement('canvas');c.width=c.height=120;const g=c.getContext('2d');const gr=g.createLinearGradient(20,40,100,110);gr.addColorStop(0,'#fff3b0');gr.addColorStop(.5,'#e8b030');gr.addColorStop(1,'#a8701a');
 g.lineWidth=12;g.strokeStyle=gr;g.beginPath();g.ellipse(60,74,32,26,0,0,7);g.stroke();const dg=g.createRadialGradient(56,34,2,60,40,20);dg.addColorStop(0,'#ffffff');dg.addColorStop(.6,'#bfe8ff');dg.addColorStop(1,'#6aaee0');g.fillStyle=dg;g.beginPath();g.moveTo(60,58);g.lineTo(44,40);g.lineTo(52,28);g.lineTo(68,28);g.lineTo(76,40);g.closePath();g.fill();g.strokeStyle='#ffffffaa';g.lineWidth=2;g.stroke();return c.toDataURL();})();

// ---------------- boot ----------------
window.Lumen={focus(n){const t=TN[n];if(!t)return false;const [x,y]=tPos(t);cur.x=x;cur.y=y+8;cam.x=x;cam.y=y-SC.ch*.3;clampCam();return true;},
 freeze(n,on=1){const t=TN[n];if(t){t.hold=on;if(on&&t.state=='walk'){}}return !!t;},
 // walk n to a tile in another zone through doorways; returns the A* path (tiles) and the zones it crosses
 walkTo(n,u,v){const t=TN[n];if(!t)return null;halt(t);t.hold=1;if(!goTo(t,[u,v],()=>{t.state='idle';t.idle=99;}))return null;return{path:[[t.u,t.v],...t.path],zones:[...new Set([[t.u,t.v],...t.path].map(([a,b])=>SC.G.zone[a][b]))]};},
 place(n,u,v){const t=TN[n];if(!t)return false;halt(t);placeT(t,u,v);t.hold=1;return true;},
 use(n,k){const t=TN[n];if(!t)return null;const U=usables().find(q=>(q.f&&q.f.k==k)||(q.spot&&q.act==k)||q.act==k);if(!U)return null;halt(t);t.hold=0;return goUse(t,U)?{stand:U.stand,act:U.act}:null;},
 state(n){const t=TN[n];return t?{u:t.u,v:t.v,fu:t.fu,fv:t.fv,state:t.state,act:t.U&&t.U.act,pose:t.U&&t.U.pose,onIt:t.onIt,zone:SC.G.zone[t.u]&&SC.G.zone[t.u][t.v],path:t.path.length}:null;},
 walls(){const G=SC.G;let blocked=0,doors=0;for(let u=0;u<G.cols;u++)for(let v=0;v<G.rows;v++)for(const [a,b] of [[u+1,v],[u,v+1]]){if(!G.floor(u,v)||!G.floor(a,b)||G.zone[u][v]==G.zone[a][b])continue;if(G.open(u,v,a,b))doors++;else blocked++;}return{blocked,doors};},
 connected(){const G=SC.G,E=exitOf();const R=reach(G,E.t,null),K=new Set(R.map(([u,v])=>u*512+v)),miss=[];let all=0;for(let u=0;u<G.cols;u++)for(let v=0;v<G.rows;v++)if(G.floor(u,v)&&!G.occ[u][v]){all++;if(!K.has(u*512+v))miss.push([u,v,G.zone[u][v]]);}return{reach:R.length,all,miss:miss.slice(0,30)};},
 extras:()=>EX.map(e=>({n:e.c.n,u:e.u,v:e.v,on:!!e.U})),grid:on=>{window.__grid=on;DBG=on;},G:()=>SC.G,setHour(h){S.min=h*60;},screenOf(n){const t=TN[n];if(!t)return null;const [x,y]=W2S(t.x,t.y);return{x,y,h:SC.ch*cam.z};},get S(){return S;},enterScene,openFloors,openTeleport,openProfile,openFridge,talk,startDialogue,findResident,devDo,TN:()=>TN,cam,cur,SC:()=>SC,actOn,targets,openShop,decorMenu,startDecor,placeDecor,save};
enterScene(S.scene,1);updateHud();requestAnimationFrame(frame);if(!S.seenHelp)setTimeout(helpSheet,400);
