'use strict';
// Lumen Residences — world: iso tile grids, A* pathfinding with walls/doorways, tile-scene rendering
// (floor textures + doors sliced from the user's furniture sheet), furniture footprints, tenant life AI and extras.

// ---------------- furniture definitions ----------------
// fp: footprint in tiles [along u (down-right), along v (down-left)] for the sheet's facing (front faces +v / down-left).
// Mirrored ("rotated") pieces swap the footprint and face +u. oy: world px nudge of the sprite's base.
// use: how a tenant uses it. pose: sit (sits on it) | sleep (on the bed) | bath (in the tub, legs hidden) | in (inside: shower, pull-up tower)
//      | run (on the treadmill) | front (stands at the front, facing it) | flex/punch/stretch (stands beside, exercising)
// Footprints come from the painted piece models in furnart.js. use.at = where the tenant sits/lies on the piece in the
// piece's local model space [x across, y depth (front = y max), z height px]; the painter's own projection maps it for each of 4 facings.
// r (0..3): 0 front faces +v (down-left), 1 faces +u (down-right), 2 faces -v (to the back wall), 3 faces -u.
const USE={bed:{act:'sleep',pose:'sleep',at:[1,1.0,33],ly:.9},bed_grey:{act:'sleep',pose:'sleep',at:[1,1.0,33],ly:.9},
 sofa_red:{act:'sit',pose:'sit',at:[1,.62,29]},sofa_cream:{act:'sit',pose:'sit',at:[1,.62,29]},sofa_grey:{act:'sit',pose:'sit',at:[1,.62,29]},sofa_black:{act:'sit',pose:'sit',at:[1,.62,29]},
 armchair:{act:'sit',pose:'sit',at:[.5,.62,29]},chair_red:{act:'sit',pose:'sit',at:[.5,.52,33]},bench_blue:{act:'lift',pose:'sit',at:[1,.5,30]},
 tv:{act:'tv',pose:'tv'},fridge:{act:'fridge',pose:'fridge'},fridge2:{act:'fridge',pose:'fridge'},counter:{act:'cook',pose:'eat'},table_dining:{act:'eat',pose:'eat'},table_coffee:{act:'eat',pose:'eat'},
 toilet:{act:'toilet',pose:'front'},sink:{act:'wash',pose:'front'},vanity:{act:'wash',pose:'front'},bathtub:{act:'bath',pose:'bath',at:[1,.5,10],clip:.5},shower_glass:{act:'shower',pose:'shower',at:[1,1,6],frontOnly:1,dur:12},bed_apt:{act:'sleep',pose:'sleep',at:[1,1.0,33],ly:.9},shower:{act:'shower',pose:'in',at:[.5,.5,7]},
 desk:{act:'read',pose:'sit',at:[1,1.38,31],back:1},bookshelf:{act:'read',pose:'front'},bookcase_red:{act:'read',pose:'front'},
 treadmill:{act:'run',pose:'run',at:[.85,.5,16]},machine_red:{act:'run',pose:'front'},bench_black:{act:'lift',pose:'squat'},kettlebell:{act:'lift',pose:'squat'},dumbbells:{act:'lift',pose:'squat'},speaker:{act:'dance',pose:'dance'},
 ball:{act:'stretch',pose:'ball',at:[.5,.5,44]},pullup:{act:'pull',pose:'in',at:[.5,.5,5],pull:1},speedbag:{act:'punch',pose:'punch'},djbooth:{act:'dj',pose:'dj'},
 // v0.3.3 pieces
 wardrobe_honey:{act:'dress',pose:'dress'},mirror_floor:{act:'dress',pose:'dress'},bed_single:{act:'sleep',pose:'sleep',at:[.5,1.0,30],ly:.9},
 sofa_teal:{act:'sit',pose:'sit',at:[1,.62,29]},sofa_honey:{act:'sit',pose:'sit',at:[1,.62,29]},armchair_teal:{act:'sit',pose:'sit',at:[.5,.62,29]},beanbag:{act:'sit',pose:'sit',at:[.5,.6,20]},
 tv_modern:{act:'tv',pose:'tv'},shelf_low:{act:'read',pose:'front'},aquarium:{act:'watch',pose:'watch'},arcade:{act:'game',pose:'tv'},
 stove:{act:'cook',pose:'cook'},counter_white:{act:'cook',pose:'cook'},island:{act:'cook',pose:'cook'},bbq:{act:'cook',pose:'cook'},
 table_wood:{act:'eat',pose:'eat'},chair_dining:{act:'eat',pose:'sit',at:[.5,.52,37],food:1},table_patio:{act:'eat',pose:'eat'},chair_patio:{act:'sit',pose:'sit',at:[.5,.52,37]},
 desk_modern:{act:'read',pose:'sit',at:[1,1.38,31],back:1},chair_office:{act:'sit',pose:'sit',at:[.5,.5,33]},cabinet_file:{act:'read',pose:'front'},caseboard:{act:'read',pose:'front'},
 washer:{act:'wash',pose:'front'},sunbed:{act:'sunbathe',pose:'sleep',at:[.5,1.15,24],ly:.95},
 lux_bed:{act:'sleep',pose:'sleep',at:[1,1.0,36],ly:.82},lux_sofa:{act:'sit',pose:'sit',at:[1,.64,31]},lux_armchair:{act:'sit',pose:'sit',at:[.5,.62,33]},lux_shelf:{act:'read',pose:'front'},
 lux_table:{act:'eat',pose:'eat'},lux_chair:{act:'eat',pose:'sit',at:[.5,.52,39],food:1},lux_tub:{act:'bath',pose:'bath',at:[1,.5,12],clip:.5},lux_wardrobe:{act:'dress',pose:'dress'},
 lux_piano:{act:'play',pose:'sit',at:[1,1.78,32],back:1},lux_bar:{act:'drink',pose:'eat'},lux_vanity:{act:'wash',pose:'front'}};
const FDEF={};for(const k in FA.DEF){const D=FA.DEF[k];FDEF[k]={fp:D.fp,flat:D.flat,hang:D.hang,h:D.h,use:USE[k]};}
// local model point -> grid offset from the piece's (u,v) origin, for facing r
function locToGrid(k,r,x,y){const [W,D]=FA.DEF[k].fp;return r==0?[x,y]:r==1?[y,W-x]:r==2?[W-x,D-y]:[D-y,x];}
const TEX={};function tex(id){return TEX[id]||(TEX[id]=img(`assets/tiles/${id}.jpg`));}
const furnSrc=k=>'';
const DOORIMG=k=>img(`assets/furn2/door_${k}_hd.png`);

// ---------------- grids ----------------
function mkGrid(cols,rows,O,eu,ev){const G={cols,rows,O,eu,ev,zone:[],door:new Set(),occ:[]};
 for(let u=0;u<cols;u++){G.zone.push(new Array(rows).fill(null));G.occ.push(new Array(rows).fill(null));}
 G.pt=(u,v)=>[O[0]+u*eu[0]+v*ev[0],O[1]+u*eu[1]+v*ev[1]];G.tc=(u,v)=>G.pt(u+.5,v+.5);
 const det=eu[0]*ev[1]-ev[0]*eu[1];G.uv=(x,y)=>{const dx=x-O[0],dy=y-O[1];return[(dx*ev[1]-ev[0]*dy)/det,(eu[0]*dy-dx*eu[1])/det];};
 G.in=(u,v)=>u>=0&&v>=0&&u<cols&&v<rows;G.floor=(u,v)=>G.in(u,v)&&G.zone[u][v]!=null;
 G.ek=(a,b,c,d)=>(a<c||(a==c&&b<d))?`${a},${b}|${c},${d}`:`${c},${d}|${a},${b}`;
 G.open=(a,b,c,d)=>G.floor(a,b)&&G.floor(c,d)&&(G.zone[a][b]==G.zone[c][d]||G.door.has(G.ek(a,b,c,d)));
 G.free=(u,v,me)=>G.floor(u,v)&&(!G.occ[u][v]||G.occ[u][v]===me);
 return G;}
function pinPoly(x,y,P){let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const [xi,yi]=P[i],[xj,yj]=P[j];if(((yi>y)!=(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi))c=!c;}return c;}
function buildGrid(sc){let G;
 if(sc.kind=='place'){G=mkGrid(10,10,[500,170],[45,22.5],[-45,22.5]);for(let u=0;u<10;u++)for(let v=0;v<10;v++)G.zone[u][v]='F';}
 else if(sc.R.type=='tile'){const R=sc.R;G=mkGrid(R.cols,R.rows,R.O,[R.TW/2,R.TW/4],[-R.TW/2,R.TW/4]);
  for(const z in R.zones)(R.zones[z].rs||[R.zones[z].r]).forEach(([u0,v0,w,h])=>{for(let u=u0;u<u0+w;u++)for(let v=v0;v<v0+h;v++)if(G.in(u,v))G.zone[u][v]=z;});
  R.doors.forEach(([a,b,c,d])=>G.door.add(G.ek(a,b,c,d)));}
 else{const R=sc.R;G=mkGrid(R.cols,R.rows,R.O,R.eu,R.ev);
  for(const z in R.zones)R.zones[z].rs.forEach(([u0,v0,w,h])=>{for(let u=u0;u<u0+w;u++)for(let v=v0;v<v0+h;v++)if(G.in(u,v))G.zone[u][v]=z;});
  R.doors.forEach(([a,b,c,d])=>G.door.add(G.ek(a,b,c,d)));}
 G.k=sc.kind=='place'?1:(sc.R.TW||80)/90;
 // tiles that must stay walkable: both sides of every doorway, the entry, painted-furniture use spots
 G.keep=new Set();const keep=(u,v)=>G.keep.add(u*512+v);
 if(sc.kind=='room'){sc.R.doors.forEach(([a,b,c,d])=>{keep(a,b);keep(c,d);});if(sc.R.entry)keep(...sc.R.entry.t);(sc.R.spots||[]).forEach(s=>keep(...s.t));}
 else{const P=sc.P||{};if(P.entry)keep(...P.entry.t);if(P.elev)keep(...P.elev.t);(P.hot||[]).forEach(h=>h.t&&keep(...h.t));}
 return G;}
// A* over walkable tiles (4-neighbour = the two iso axes). Furniture blocks; walls block unless the edge is a doorway.
function astar(G,s,g,me){if(!G.floor(g[0],g[1]))return null;const K=(u,v)=>u*512+v,goal=K(g[0],g[1]);const open=[[Math.abs(s[0]-g[0])+Math.abs(s[1]-g[1]),0,s[0],s[1]]],came=new Map([[K(s[0],s[1]),null]]),cost=new Map([[K(s[0],s[1]),0]]);
 while(open.length){let bi=0;for(let i=1;i<open.length;i++)if(open[i][0]<open[bi][0])bi=i;const [,c,u,v]=open.splice(bi,1)[0],k=K(u,v);if(k==goal){const p=[];let q=k;while(q!=null){p.unshift([Math.floor(q/512),q%512]);q=came.get(q);}return p;}
  if(c>cost.get(k))continue;for(const [du,dv] of [[1,0],[-1,0],[0,1],[0,-1]]){const a=u+du,b=v+dv,kk=K(a,b);if(!G.open(u,v,a,b))continue;if(kk!=goal&&!G.free(a,b,me))continue;
   const nc=c+1+(G.zone[a][b]!=G.zone[u][v]?.2:0);if(!cost.has(kk)||nc<cost.get(kk)){cost.set(kk,nc);came.set(kk,k);open.push([nc+Math.abs(a-g[0])+Math.abs(b-g[1]),nc,a,b]);}}}
 return null;}
function reach(G,s,me){const seen=new Set([s[0]*512+s[1]]),q=[s],out=[];while(q.length){const [u,v]=q.shift();out.push([u,v]);for(const [du,dv] of [[1,0],[-1,0],[0,1],[0,-1]]){const a=u+du,b=v+dv,k=a*512+b;if(seen.has(k)||!G.open(u,v,a,b)||!G.free(a,b,me))continue;seen.add(k);q.push([a,b]);}}return out;}

// ---------------- furniture instances in the current scene ----------------
// {k,u,v,r} -> footprint tiles, sprite placement, use point
const fpOf=f=>{const d=FDEF[f.k]||{fp:[1,1]};return (f.r||0)%2?[d.fp[1],d.fp[0]]:d.fp;};
function fTiles(f){const [w,h]=fpOf(f),T=[];for(let i=0;i<w;i++)for(let j=0;j<h;j++)T.push([f.u+i,f.v+j]);return T;}
function fBase(G,f){const [w,h]=fpOf(f),L=G.pt(f.u,f.v+h),R=G.pt(f.u+w,f.v),B=G.pt(f.u+w,f.v+h);return{cx:(L[0]+R[0])/2,by:B[1],w:R[0]-L[0],depth:f.u+w/2+f.v+h/2};}
function sceneFurn(){return SC.kind=='room'?S.rooms[SC.n].furn:SC.P.props;}
function rebuildOcc(G,list,skip){for(let u=0;u<G.cols;u++)G.occ[u].fill(null);if(!list)return;list.forEach(f=>{if(f===skip)return;const d=FDEF[f.k];if(!d||d.flat)return;fTiles(f).forEach(([u,v])=>{if(G.in(u,v))G.occ[u][v]=f;});});
 }
function canPlace(G,f,skip){const T=fTiles(f);if(!T.every(([u,v])=>G.floor(u,v)))return false;const z=G.zone[T[0][0]][T[0][1]];
 if(!T.every(([u,v])=>G.zone[u][v]==z))return false;if(FDEF[f.k].flat)return true;
 if(!T.every(([u,v])=>!G.occ[u][v]||G.occ[u][v]===skip))return false;if(T.some(([u,v])=>G.keep.has(u*512+v)))return false;return true;}
// where a tenant stands to use f, and where the sprite is drawn while using it
function usePoint(G,f){const d=FDEF[f.k],U=d&&d.use;if(!U)return null;const [w,h]=fpOf(f),b=fBase(G,f),r=f.r||0;
 if(U.act=='dj'){const st=[[f.u+1,f.v-1],[f.u+2,f.v-1]].filter(([u,v])=>G.floor(u,v));const p=G.pt(f.u+w/2,f.v-.45);return{f,act:'dj',pose:'dj',stand:st,draw:p,depth:f.u+w/2+f.v-.4,face:'right',behind:1};}
 // tiles in front of the piece (the side its front faces), then the other free sides (never behind it)
 const front=[];if(r==0)for(let i=0;i<w;i++)front.push([f.u+i,f.v+h]);else if(r==1)for(let j=0;j<h;j++)front.push([f.u+w,f.v+j]);else if(r==2)for(let i=0;i<w;i++)front.push([f.u+i,f.v-1]);else for(let j=0;j<h;j++)front.push([f.u-1,f.v+j]);
 const side=[];for(let i=-1;i<=w;i++)for(let j=-1;j<=h;j++){if(i>=0&&i<w&&j>=0&&j<h)continue;if((i<0||i>=w)&&(j<0||j>=h))continue;side.push([f.u+i,f.v+j]);}
 const z=G.zone[f.u]&&G.zone[f.u][f.v],behind=([u,v])=>r==0?v<f.v:r==1?u<f.u:r==2?v>=f.v+h:u>=f.u+w;
 const cand=[...front,...(U.frontOnly?[]:side.filter(p=>!front.some(q=>q[0]==p[0]&&q[1]==p[1])&&!behind(p)))].filter(([u,v])=>G.free(u,v)&&G.zone[u][v]==z);
 let draw=[b.cx,b.by],depth=b.depth+.05,gp=null;
 if(U.at){const [gu,gv]=locToGrid(f.k,r,U.at[0],U.at[1]),q=G.pt(f.u+gu,f.v+gv),KZ=G.eu[0]/45;draw=[q[0],q[1]-U.at[2]*KZ];gp=U.ly!=null?[...locToGrid(f.k,r,U.at[0],U.ly),r==1?0:1]:[gu,gv];
  // facing the camera (r 0/1): the tenant is drawn over the piece, then the piece's front layer (arms, blanket) over the tenant
  depth=r<2?b.depth+.05:b.depth-.05;}
 // lying axis on screen (head direction), for beds
 let axis=null;if(U.pose=='sleep'||U.pose=='bath'){const h0=locToGrid(f.k,r,1,0),h1=locToGrid(f.k,r,1,1),A=G.pt(h0[0],h0[1]),B=G.pt(h1[0],h1[1]);axis=Math.atan2(A[0]-B[0],-(A[1]-B[1]));}
 return{f,act:U.act,pose:U.pose,stand:cand,draw,depth,gp,axis,r,clip:U.clip,back:U.back,pull:U.pull,dur:U.dur,food:U.food,face:r==1||r==2?'left':'right',away:r>=2};}

// ---------------- rendering of tile scenes ----------------
function patFor(g,G,id){const t=tex(id);if(!ok(t))return null;const p=g.createPattern(t,'repeat'),s=t.naturalWidth;p.setTransform(new DOMMatrix([G.eu[0]/s,G.eu[1]/s,G.ev[0]/s,G.ev[1]/s,G.O[0],G.O[1]]));return p;}
function tileQuad(G,u,v,w=1,h=1){return[G.pt(u,v),G.pt(u+w,v),G.pt(u+w,v+h),G.pt(u,v+h)];}
function drawRoomShell(g,time){const R=SC.R,G=SC.G,WH=R.WH,th=R.theme;if(R.style=='apt')return drawAptShell(g,time);
 g.fillStyle=th.bg;g.fillRect(-500,-500,SC.W+1000,SC.H+1000);
 // floors (the sheet's tile textures, mapped onto the iso grid)
 for(const z in R.zones){const Z=R.zones[z],[u0,v0,w,h]=Z.r,p=patFor(g,G,Z.tex);poly(g,tileQuad(G,u0,v0,w,h));g.fillStyle=p||'#3a3440';g.fill();
  if(Z.tint){g.fillStyle=Z.tint;g.fill();}}
 // soft light pools + ambient occlusion along walls
 g.save();g.globalCompositeOperation='multiply';const ao=g.createLinearGradient(...G.pt(0,0),...G.pt(1.4,1.4));ao.addColorStop(0,'rgba(0,0,0,.35)');ao.addColorStop(1,'rgba(0,0,0,0)');poly(g,tileQuad(G,0,0,R.cols,R.rows));g.fillStyle=ao;g.fill();g.restore();
 if(th.neon){g.save();g.globalCompositeOperation='lighter';for(const z in R.zones){const [u0,v0,w,h]=R.zones[z].r;const c=G.pt(u0+w/2,v0+h/2),r=Math.max(w,h)*R.TW*.55,gr=g.createRadialGradient(c[0],c[1],5,c[0],c[1],r);gr.addColorStop(0,(R.zones[z].glow||th.neon)+'40');gr.addColorStop(1,(R.zones[z].glow||th.neon)+'00');g.fillStyle=gr;g.beginPath();g.ellipse(c[0],c[1],r,r*.55,0,0,7);g.fill();}g.restore();}
 else{g.save();g.globalCompositeOperation='screen';for(const z in R.zones){const [u0,v0,w,h]=R.zones[z].r;const c=G.pt(u0+w/2,v0+h/2),r=Math.max(w,h)*R.TW*.5,gr=g.createRadialGradient(c[0],c[1],5,c[0],c[1],r);gr.addColorStop(0,'rgba(255,214,150,.16)');gr.addColorStop(1,'rgba(255,214,150,0)');g.fillStyle=gr;g.beginPath();g.ellipse(c[0],c[1],r,r*.55,0,0,7);g.fill();}g.restore();}
 // grout lines between zones (thin) and doorway thresholds
 g.lineWidth=1;g.strokeStyle='rgba(0,0,0,.25)';
 // back walls (tall): v=0 edge (right wall) and u=0 edge (left wall)
 const seg=(side,i,col)=>{const a=side=='R'?G.pt(i,0):G.pt(0,i+1),b=side=='R'?G.pt(i+1,0):G.pt(0,i);poly(g,[a,b,[b[0],b[1]-WH],[a[0],a[1]-WH]]);
  const gr=g.createLinearGradient(0,a[1]-WH,0,a[1]);gr.addColorStop(0,shade(col,side=='R'?.08:-.02));gr.addColorStop(1,shade(col,side=='R'?-.22:-.34));g.fillStyle=gr;g.fill();
  // panel seams
  g.strokeStyle=shade(col,-.45);g.globalAlpha=.35;g.lineWidth=1.5;g.beginPath();g.moveTo(b[0],b[1]);g.lineTo(b[0],b[1]-WH);g.stroke();g.globalAlpha=1;
  // skirting + crown
  poly(g,[a,b,[b[0],b[1]-10],[a[0],a[1]-10]]);g.fillStyle=shade(th.trim,-.35);g.fill();poly(g,[[a[0],a[1]-WH+8],[b[0],b[1]-WH+8],[b[0],b[1]-WH],[a[0],a[1]-WH]]);g.fillStyle=th.trim;g.fill();
  if(th.neon){g.save();g.strokeStyle=g.shadowColor=side=='R'?'#48eaff':'#c15aff';g.shadowBlur=10;g.lineWidth=2.5;g.globalAlpha=.75+Math.sin(time*2+i)*.2;g.beginPath();g.moveTo(a[0],a[1]-WH+18);g.lineTo(b[0],b[1]-WH+18);g.stroke();g.restore();}};
 const zc=(u,v)=>(R.zones[G.zone[u][v]]||{}).wall||th.wall;
 for(let u=0;u<R.cols;u++)if(G.floor(u,0))seg('R',u,zc(u,0));
 for(let v=0;v<R.rows;v++)if(G.floor(0,v))seg('L',v,zc(0,v));
 // wall top thickness
 g.fillStyle=shade(th.trim,-.15);poly(g,[[G.O[0],G.O[1]-WH],[G.pt(R.cols,0)[0],G.pt(R.cols,0)[1]-WH],[G.pt(R.cols,0)[0]+6,G.pt(R.cols,0)[1]-WH-3],[G.O[0],G.O[1]-WH-6],[G.pt(0,R.rows)[0]-6,G.pt(0,R.rows)[1]-WH-3],[G.pt(0,R.rows)[0],G.pt(0,R.rows)[1]-WH]]);g.fill();
 // windows on the back walls
 (R.windows||[]).forEach(([side,i,w])=>winOnWall(g,G,side,i,w||1,WH,th,time));
 // entry door
 const E=R.entry;if(E&&E.side!='F'){doorOnWall(g,G,E.side,E.side=='L'?E.t[1]:E.t[0],WH,E.img||'black',th);}
}
function wallBasis(G,side,i,w){// returns origin (bottom-left of the wall span as seen) and unit along-wall vector
 if(side=='R'){const a=G.pt(i,0),b=G.pt(i+w,0);return{a,b};}const a=G.pt(0,i+w),b=G.pt(0,i);return{a,b};}
function winOnWall(g,G,side,i,w,WH,th,time){const {a,b}=wallBasis(G,side,i,w),P=(s,h)=>[a[0]+(b[0]-a[0])*s,a[1]+(b[1]-a[1])*s-h];const h0=WH*.32,h1=WH*.86;
 poly(g,[P(.08,h0-5),P(.92,h0-5),P(.92,h1+5),P(.08,h1+5)]);g.fillStyle=th.trim;g.fill();poly(g,[P(.12,h0),P(.88,h0),P(.88,h1),P(.12,h1)]);
 const n=nightF(),gr=g.createLinearGradient(0,P(0,h1)[1],0,P(0,h0)[1]);gr.addColorStop(0,n>.5?'#1b2350':'#74c6ff');gr.addColorStop(1,n>.5?'#5a3f7a':'#d8efff');g.fillStyle=gr;g.fill();
 // skyline silhouettes
 g.save();g.clip();g.fillStyle=n>.5?'rgba(20,16,40,.85)':'rgba(120,150,190,.55)';for(let k=0;k<7;k++){const s0=.12+k*.11,hh=h0+ (12+((k*37)%30))*WH/150;poly(g,[P(s0,h0-2),P(s0+.09,h0-2),P(s0+.09,hh),P(s0,hh)]);g.fill();if(n>.5){g.fillStyle='rgba(255,220,120,.8)';for(let q=0;q<3;q++){const p=P(s0+.03+q*.02,h0+6+q*5);g.fillRect(p[0],p[1],2,2);}g.fillStyle='rgba(20,16,40,.85)';}}g.restore();
 g.strokeStyle=th.trim;g.lineWidth=3;g.beginPath();g.moveTo(...P(.5,h0));g.lineTo(...P(.5,h1));g.stroke();
 if(n<.5){g.globalAlpha=.3;g.fillStyle='#fff';poly(g,[P(.16,h1-4),P(.26,h1-4),P(.18,h0+6),P(.14,h0+6)]);g.fill();g.globalAlpha=1;}}
function doorOnWall(g,G,side,i,WH,kind,th){const {a,b}=wallBasis(G,side,i,1),D=DOORIMG(kind);const dh=WH*.78;
 // shadowed recess
 const P=(s,h)=>[a[0]+(b[0]-a[0])*s,a[1]+(b[1]-a[1])*s-h];poly(g,[P(.06,0),P(.94,0),P(.94,dh+6),P(.06,dh+6)]);g.fillStyle='rgba(0,0,0,.45)';g.fill();
 if(ok(D)){g.save();const ux=(b[0]-a[0]),uy=(b[1]-a[1]);g.transform(ux*.88/D.naturalWidth,uy*.88/D.naturalWidth,0,dh/D.naturalHeight,a[0]+ux*.06,a[1]+uy*.06-dh);g.imageSmoothingQuality='high';g.drawImage(D,0,0);g.restore();}
 // door mat
 const m0=side=='L'?G.pt(0,i+.15):G.pt(i+.15,0),m1=side=='L'?G.pt(0,i+.85):G.pt(i+.85,0),off=side=='L'?[G.eu[0]*.55,G.eu[1]*.55]:[G.ev[0]*.55,G.ev[1]*.55];
 poly(g,[m0,m1,[m1[0]+off[0],m1[1]+off[1]],[m0[0]+off[0],m0[1]+off[1]]]);g.fillStyle='rgba(140,30,40,.85)';g.fill();g.strokeStyle='rgba(255,210,140,.6)';g.lineWidth=1.5;g.stroke();}
// low cutaway walls: interior zone boundaries (except doorways) and the front edges. Returned as y-sortable entities.
function lowWalls(G,R,th){const E=[],LH=R.LH||30,T=8;const wallCol=th.lowWall||shade(th.wall,.1);
 const add=(p0,p1,depth,door,front)=>E.push({depth,d:g=>{if(door){// door posts
   [p0,p1].forEach(p=>{g.fillStyle=shade(wallCol,-.2);g.fillRect(p[0]-3,p[1]-LH-6,6,LH+6);g.fillStyle=th.trim;g.fillRect(p[0]-3,p[1]-LH-8,6,3);});return;}
  const top=[[p0[0],p0[1]-LH],[p1[0],p1[1]-LH]];poly(g,[p0,p1,top[1],top[0]]);const gr=g.createLinearGradient(0,p0[1]-LH,0,p0[1]);gr.addColorStop(0,shade(wallCol,.06));gr.addColorStop(1,shade(wallCol,-.3));g.fillStyle=gr;g.fill();
  g.fillStyle=th.trim;poly(g,[top[0],top[1],[top[1][0],top[1][1]-4],[top[0][0],top[0][1]-4]]);g.fill();
  if(th.neon){g.save();g.strokeStyle=g.shadowColor=front?'#c15aff':'#48eaff';g.shadowBlur=8;g.lineWidth=2;g.beginPath();g.moveTo(top[0][0],top[0][1]-4);g.lineTo(top[1][0],top[1][1]-4);g.stroke();g.restore();}}});
 for(let u=0;u<=G.cols;u++)for(let v=0;v<G.rows;v++){// edges on the u-line between (u-1,v) and (u,v)
  const a=G.floor(u-1,v),b=G.floor(u,v);if(!a&&!b)continue;if(u==0)continue;const p0=G.pt(u,v+1),p1=G.pt(u,v),dep=u+v+.5+.02;
  if(a&&b){if(G.zone[u-1][v]==G.zone[u][v])continue;add(p0,p1,dep,G.door.has(G.ek(u-1,v,u,v)));}else{const E2=R.entry;if(E2&&E2.side=='F'&&E2.t[0]==u-1&&E2.t[1]==v){add(p0,p1,dep,1);continue;}add(p0,p1,dep,0,1);}}
 for(let v=0;v<=G.rows;v++)for(let u=0;u<G.cols;u++){const a=G.floor(u,v-1),b=G.floor(u,v);if(!a&&!b)continue;if(v==0)continue;const p0=G.pt(u,v),p1=G.pt(u+1,v),dep=u+.5+v+.02;
  if(a&&b){if(G.zone[u][v-1]==G.zone[u][v])continue;add(p0,p1,dep,G.door.has(G.ek(u,v-1,u,v)));}else add(p0,p1,dep,0,1);}
 return E;}

// ---------------- sprites ----------------
function drawFurn(g,G,f,alpha,hl,time,layer){const d=FDEF[f.k];if(!d)return;const R=FA.render(f.k,f.r||0,G.eu,layer);if(!R)return;const o=G.pt(f.u,f.v);
 g.save();if(alpha!=null)g.globalAlpha=alpha;g.imageSmoothingQuality='high';if(hl){g.shadowColor='rgba(255,236,140,.95)';g.shadowBlur=12*DPR();}g.drawImage(R.cv,o[0]+R.ox,o[1]+R.oy,R.w,R.h);g.restore();
 if(!layer&&FA.DEF[f.k].live)drawLive(g,G,f,time);}
// animated bits painted over the club fixtures (records spinning, neon strips, speaker pulse)
function drawLive(g,G,f,time){const r=f.r||0,KZ=G.eu[0]/45,P=(x,y,z)=>{const [a,b]=locToGrid(f.k,r,x,y),q=G.pt(f.u+a,f.v+b);return[q[0],q[1]-z*KZ];};const hue=(time*50)%360;
 if(f.k=='djbooth'){[[.25,0],[.62,1]].forEach(([z,i])=>{g.save();g.lineWidth=3;g.strokeStyle=g.shadowColor=`hsl(${(hue+i*140)%360},100%,62%)`;g.shadowBlur=12;g.beginPath();g.moveTo(...P(.08,1,56*z));g.lineTo(...P(3.92,1,56*z));g.stroke();g.restore();});
  [[.7,.5],[3.3,.5]].forEach(([x,y])=>{const c=P(x,y,64);g.save();g.translate(c[0],c[1]);g.scale(1,.5);g.rotate(time*3.4);g.strokeStyle='rgba(150,140,180,.55)';g.lineWidth=1;for(let rr=6;rr<20;rr+=4){g.beginPath();g.arc(0,0,rr,0,7);g.stroke();}g.fillStyle='#e2525a';g.beginPath();g.arc(0,0,5,0,7);g.fill();g.fillStyle='#fff';g.fillRect(9,-1,8,2);g.restore();});
  const mx=P(2,.5,64);for(let i=0;i<3;i++)for(let j=0;j<2;j++){g.beginPath();g.arc(mx[0]-12+i*12,mx[1]-3+j*6,2.4,0,7);g.fillStyle=`hsl(${(hue+i*60+j*30)%360},100%,${55+Math.sin(time*6+i+j)*15}%)`;g.fill();}
  if(r<2){g.save();const m=P(2,1,30);g.translate(...m);g.transform(1,r==0?-.5:.5,0,1,0,0);g.font='900 14px Georgia,serif';g.textAlign='center';g.fillStyle='#ffe6ff';g.shadowColor='#c15aff';g.shadowBlur=10;g.fillText('ZAYNE',0,5);g.restore();}return;}
 if(f.k=='aquarium'){g.save();g.strokeStyle='rgba(235,250,255,.85)';g.lineWidth=1;for(let i=0;i<6;i++){const ph=(time*.45+i/6)%1,x=.3+((i*37)%14)/10,c=P(x,.6,46+ph*48);g.beginPath();g.arc(c[0]+Math.sin(time*3+i)*1.5,c[1],1.4+ph*1.6,0,7);g.stroke();}g.restore();return;}
 if(f.k=='fireplace'){const c=P(1,1,24),k=.75+Math.sin(time*7.3)*.12+Math.sin(time*12.1)*.08;g.save();g.globalCompositeOperation='lighter';const gr=g.createRadialGradient(c[0],c[1],2,c[0],c[1],36);gr.addColorStop(0,`rgba(255,170,70,${.45*k})`);gr.addColorStop(1,'rgba(255,120,40,0)');g.fillStyle=gr;g.fillRect(c[0]-36,c[1]-36,72,72);g.restore();return;}
 if(f.k=='speaker'){const k=Math.max(0,Math.sin(time*8.4));if(k>.2){const c=P(.5,.5,60);g.save();g.globalCompositeOperation='lighter';const gr=g.createRadialGradient(c[0],c[1],2,c[0],c[1],40);gr.addColorStop(0,`rgba(72,234,255,${.25*k})`);gr.addColorStop(1,'rgba(72,234,255,0)');g.fillStyle=gr;g.fillRect(c[0]-40,c[1]-40,80,80);g.restore();}}}
function footprint(g,G,f,okc){fTiles(f).forEach(([u,v])=>{poly(g,tileQuad(G,u,v));g.fillStyle=okc?'rgba(90,230,120,.35)':'rgba(255,80,80,.38)';g.fill();g.strokeStyle=okc?'rgba(140,255,170,.9)':'rgba(255,120,120,.9)';g.lineWidth=2;g.stroke();});}

// ---------------- tenant life (needs drive what they do at home) ----------------
const NEED_ACT={food:['fridge','cook','eat','drink'],sleep:['sleep'],fun:['tv','sit','dj','read','watch','game','play','dress','sunbathe'],clean:['bath','shower','wash','toilet'],fit:['run','lift','stretch','pull','punch']};
const SLEEP_H={Ares:[22,6],Zayne:[4,12],Batzz:[23,7],Ophion:[23,7]};
const asleepH=n=>{const [a,b]=SLEEP_H[n],h=hour();return a<b?h>=a&&h<b:h>=a||h<b;};
function needs(n){S.need=S.need||{};return S.need[n]||(S.need[n]={food:70,sleep:80,fun:60,clean:75,fit:60});}
function tickNeeds(dm){for(const n of S.unlocked){const q=needs(n),home=placeOf(n)=='home';q.food-=dm*.05;q.fun-=dm*(home?.05:.02);q.clean-=dm*.03;q.sleep-=dm*.025;q.fit-=dm*(n=='Ares'||n=='Batzz'?.05:.02);for(const k in q)q[k]=clamp(q[k],0,100);}}
const NEED_OF={fridge:'food',cook:'food',eat:'food',drink:'food',sleep:'sleep',tv:'fun',sit:'fun',dj:'fun',read:'fun',watch:'fun',game:'fun',play:'fun',dress:'fun',sunbathe:'fun',bath:'clean',shower:'clean',wash:'clean',toilet:'clean',run:'fit',lift:'fit',stretch:'fit',pull:'fit',punch:'fit'};
// which acts a tenant enjoys most (themed)
const THEME={Ares:['lift','run','pull','punch','stretch','cook'],Zayne:['read','tv','dj','game','watch'],Batzz:['lift','punch','sit','eat','drink'],Ophion:['read','tv','play','eat']};

// usable things in the current scene: placed furniture + painted spots
function usables(){const L=[],G=SC.G;
 sceneFurn().forEach(f=>{const U=usePoint(G,f);if(U&&U.stand.length)L.push(U);});
 if(SC.kind=='room'&&SC.R.spots)SC.R.spots.forEach(s=>{const at=s.at||[s.t[0]+.5,s.t[1]+.5];L.push({spot:s,act:s.act,pose:s.pose,stand:[s.t],draw:G.pt(...at),depth:at[0]+at[1]+.6,clip:s.clip,face:s.face||'right',back:s.back,dur:s.act=='sleep'?14:null});});
 return L;}

// ---------------- tenant entities ----------------
const SPD=2.3; // tiles per second
function tPos(t){if(t.U&&t.state=='use'&&t.U.draw&&t.onIt)return t.U.pose=='shower'?showerPos(t):t.U.draw;return SC.G.pt(t.fu,t.fv);}
function tDepth(t){if(t.U&&t.state=='use'&&t.onIt)return t.U.pose=='shower'&&showerStep(t)<.5?t.fu+t.fv:t.U.depth;return t.fu+t.fv;}
function placeT(t,u,v){t.fu=u+.5;t.fv=v+.5;t.u=u;t.v=v;}
function newT(n,u,v){const t={n,u,v,fu:u+.5,fv:v+.5,path:[],face:'down',dir:1,state:'idle',U:null,useT:0,idle:.6+Math.random()*1.5,walkT:0,emo:null,emoT:0,bubble:null,alpha:1,onArrive:null,x:0,y:0};return t;}
function goTo(t,goal,then){const G=SC.G,p=astar(G,[t.u,t.v],goal,null);if(!p){return false;}t.path=p.slice(1);t.onArrive=then||null;t.state='walk';t.onIt=false;return true;}
function goUse(t,U,then){const G=SC.G;let best=null;for(const s of U.stand){const p=astar(G,[t.u,t.v],s,null);if(p&&(!best||p.length<best.length))best=p;}if(!best)return false;
 t.path=best.slice(1);t.state='walk';t.onIt=false;t.onArrive=()=>startUse(t,U,then);return true;}
const ON_POSES=['sit','sleep','bath','in','run','dj','ball','shower'];
function startUse(t,U,then){t.state='use';t.U=U;t.onIt=ON_POSES.includes(U.pose);t.useT=U.pose=='shower'?(t.n=='Ophion'?20:12):U.dur||(U.act=='sleep'?14:U.act=='sunbathe'?12:U.pose=='dj'?999:6+Math.random()*4);t.useDur=t.useT;t.towel=0;
 const ic={fridge:'food',cook:'food',eat:'food',drink:'food',watch:'note',game:'note',play:'note',dress:'heart',sunbathe:'heart',sleep:'zz',tv:'note',read:'note',dj:'note',bath:'drop',shower:'drop',wash:'drop',toilet:'drop',run:'fit',lift:'fit',stretch:'fit',pull:'fit',punch:'fit',sit:'heart'}[U.act];
 if(ic)t.bubble={k:ic,t:U.pose=='sleep'||U.pose=='dj'?999:3.2};
 if(U.f&&U.act=='fridge')t.fridgeOpen=1.2;
 t.thenUse=then||null;if(t.onUseStart){const f=t.onUseStart;t.onUseStart=null;setTimeout(f,450);}}
function endUse(t){const U=t.U;if(U&&NEED_OF[U.act]&&SC.kind=='room'){const q=needs(t.n);q[NEED_OF[U.act]]=Math.min(100,q[NEED_OF[U.act]]+(U.act=='sleep'?60:45));if(U.act=='fridge'||U.act=='cook'){const fr=S.rooms[t.n].fridge;const k=Object.keys(fr).find(q=>fr[q]>0);/* the tenant snacks from stock only when you feed them; idle snacking is free */}}
 const wasShower=U&&U.pose=='shower';t.state='idle';t.U=null;t.onIt=false;t.bubble=t.bubble&&t.bubble.t>50?null:t.bubble;t.idle=1.2+Math.random()*2.5;
 if(wasShower){t.towel=t.n=='Ophion'?5.6:5;t.idle=t.towel+.4;t.face='down';if(t.n!='Ophion'){t.emo='happy';t.emoT=2.4;}}const th=t.thenUse;t.thenUse=null;th&&th();}
function halt(t){if(!t)return;t.towel=0;if(t.state=='use'&&t.onIt){t.onIt=false;}t.path=[];t.onArrive=null;t.U=null;t.state='idle';t.bubble=null;t.idle=4;}
// pick something to do (needs + schedule + workplace)
function think(t){const G=SC.G,n=t.n,L=usables();
 if(t.transit){const E=t.transit;t.transit=null;if(!goTo(t,E.t,()=>{t.state='out';t.outT=0;t.outV=E.out;t.after=()=>{delete TN[t.n];};}))delete TN[t.n];return;}
 if(t.leaving)return;
 if(SC.kind=='place'){const p=SC.p;
  if(p=='club'&&n=='Zayne'){const U=L.find(u=>u.act=='dj');if(U&&goUse(t,U))return;}
  if(p=='gym'&&n=='Ares'){// coaching: walk up to a gym-goer, cheer them on
   const ex=EX.filter(e=>!e.walk);if(ex.length&&Math.random()<.85){const e=rnd(ex),c0=[[1,0],[0,1],[1,1]].map(([a,b])=>[e.u+a,e.v+b]).filter(([u,v])=>G.free(u,v)),c=c0.length?c0:[[-1,0],[0,-1]].map(([a,b])=>[e.u+a,e.v+b]).filter(([u,v])=>G.free(u,v));
    if(c.length&&goTo(t,rnd(c),()=>{t.state='use';t.U={act:'coach',pose:'coach',stand:[]};t.onIt=false;t.useT=5+Math.random()*3;t.bubble={k:'note',t:2.5};t.coachOf=e;}))return;}}
  if(p=='club'){if(Math.random()<.7){const df=SC.P.dance;if(df){const tiles=[];for(let u=df[0];u<df[0]+df[2];u++)for(let v=df[1];v<df[1]+df[3];v++)if(G.free(u,v))tiles.push([u,v]);if(tiles.length&&goTo(t,rnd(tiles),()=>{t.state='use';t.U={act:'dance',pose:'dance',stand:[]};t.onIt=false;t.useT=8+Math.random()*6;t.bubble={k:'note',t:2};}))return;}}}
  const want=p=='gym'?['run','lift','stretch','pull','punch']:p=='park'?['sit']:p=='cafe'||p=='restaurant'?['sit']:p=='club'?['sit']:[];
  const free=L.filter(u=>want.includes(u.act)&&!Object.values(TN).some(o=>o!==t&&o.U&&o.U.f===u.f)&&!EX.some(e=>e.U===u.f));
  if(free.length&&Math.random()<.75){const U=rnd(free);if(goUse(t,U))return;}
  return wanderT(t);}
 // at home
 if(asleepH(n)){const B=L.find(u=>u.act=='sleep');if(B&&goUse(t,{...B,dur:30}))return;}
 const q=needs(n),order=Object.keys(q).filter(k=>k!='sleep').sort((a,b)=>q[a]-q[b]);
 for(const k of order){if(q[k]>62&&Math.random()<.6)break;const acts=NEED_ACT[k].slice().sort((a,b)=>(THEME[n].includes(b)?1:0)-(THEME[n].includes(a)?1:0));
  const cand=L.filter(u=>acts.includes(u.act));if(!cand.length)continue;const pref=cand.filter(u=>THEME[n].includes(u.act));const U=rnd(pref.length&&Math.random()<.6?pref:cand);if(goUse(t,U))return;}
 if(Math.random()<.35){const pref=L.filter(u=>THEME[n].includes(u.act));if(pref.length&&goUse(t,rnd(pref)))return;}
 wanderT(t);}
function wanderT(t){const R=reach(SC.G,[t.u,t.v],null).filter(([u,v])=>Math.abs(u-t.u)+Math.abs(v-t.v)>1);if(!R.length){t.idle=2;return;}
 // prefer other zones sometimes so tenants visibly move room to room through doorways
 const z=SC.G.zone[t.u][t.v],other=R.filter(([u,v])=>SC.G.zone[u][v]!=z),pick=other.length&&Math.random()<.55?rnd(other):rnd(R);goTo(t,pick,()=>{t.state='idle';t.idle=1.5+Math.random()*3;});}
function exitOf(){if(SC.kind=='room')return SC.R.entry;return SC.P.entry;}
function leaveT(t,after){const E=exitOf();halt(t);t.leaving=1;if(!E){after&&after();return;}const ok=goTo(t,E.t,()=>{t.state='out';t.outT=0;t.outV=E.out;t.after=after;});if(!ok){t.state='out';t.outT=0;t.outV=E.out;t.after=after;}}
function arriveT(n,via){const E=via||exitOf();if(!E)return null;const t=newT(n,E.t[0],E.t[1]);t.fu=E.t[0]+.5+E.out[0]*.9;t.fv=E.t[1]+.5+E.out[1]*.9;t.alpha=0;t.state='in';t.inT=0;t.inV=E.out;return t;}
function updT(t,dt){if(t.towel>0)t.towel=Math.max(0,t.towel-dt);if(t.emoT>0){t.emoT-=dt;if(t.emoT<=0)t.emo=null;}if(t.bubble){t.bubble.t-=dt;if(t.bubble.t<=0)t.bubble=null;}if(t.fridgeOpen>0)t.fridgeOpen-=dt;
 if(t.state=='in'){t.inT+=dt*SPD;const k=Math.min(1,t.inT/.9);t.fu=t.u+.5+t.inV[0]*.9*(1-k);t.fv=t.v+.5+t.inV[1]*.9*(1-k);t.alpha=k;t.walkT+=dt;t.dir=(-t.inV[0]+t.inV[1])>0?-1:1;t.face=-(t.inV[0]+t.inV[1])>0?'down':'up';if(k>=1){t.state='idle';t.idle=.3;}return;}
 if(t.state=='out'){t.outT+=dt*SPD;const k=Math.min(1,t.outT/.9);t.fu=t.u+.5+t.outV[0]*.9*k;t.fv=t.v+.5+t.outV[1]*.9*k;t.alpha=1-k;t.walkT+=dt;t.dir=(t.outV[0]-t.outV[1])>0?1:-1;t.face=(t.outV[0]+t.outV[1])>0?'down':'up';if(k>=1){t.gone=1;t.after&&t.after();}return;}
 if(t.state=='walk'){if(!t.path.length){t.state='idle';const f=t.onArrive;t.onArrive=null;f&&f();return;}
  const [nu,nv]=t.path[0];if(!SC.G.open(t.u,t.v,nu,nv)||!SC.G.free(nu,nv)&&!(t.path.length==1)){// blocked (e.g. furniture just placed): replan
   const g=t.path[t.path.length-1],f=t.onArrive;if(!goTo(t,g,f)){t.path=[];t.state='idle';t.idle=1;}return;}
  const tx=nu+.5,ty=nv+.5,du=tx-t.fu,dv=ty-t.fv,d=Math.hypot(du,dv),sp=SPD*dt;t.walkT+=dt;
  const sx=du-dv,sy=du+dv;if(Math.abs(sx)>.01)t.dir=sx>0?1:-1;t.face=sy>0?'down':'up';
  if(d<=sp){t.fu=tx;t.fv=ty;t.u=nu;t.v=nv;t.path.shift();}else{t.fu+=du/d*sp;t.fv+=dv/d*sp;}return;}
 if(t.state=='use'){t.useT-=dt;if(t.U&&t.U.pose=='dj'&&!(SC.kind=='place'&&SC.p=='club'&&t.n=='Zayne')){t.useT=Math.min(t.useT,0);}
  if(t.U&&t.U.act=='sleep'&&SC.kind=='room'&&!asleepH(t.n)&&t.useT>8)t.useT=1;
  if(t.U&&t.U.act=='sleep'&&SC.kind=='room'&&asleepH(t.n)&&t.useT<1)t.useT=20;
  if(t.useT<=0)endUse(t);return;}
 t.idle-=dt;if(t.idle<=0&&!dlg.on&&!t.hold){think(t);if(t.state=='idle')t.idle=2+Math.random()*2;}}

// ---------------- chibi drawing (the user's sheet sprites only) ----------------
const SIT_NATIVE='left'; // the sheets' sitting poses face down-left
function sitImg(n){if(TENANTS[n].sitns){const a=tImg(n,'emote_sitns_hd.png');if(ok(a))return a;}return tImg(n,'emote_sit_hd.png');}
function bubbleDraw(g,t,x,y,H,time){const b=t.bubble;if(!b)return;const T=TENANTS[t.n],bx=x+H*.32,by=y-H*1.08+Math.sin(time*3)*2,r=H*.16;
 g.save();g.beginPath();g.ellipse(bx,by,r*1.15,r,0,0,7);g.fillStyle='rgba(255,255,255,.95)';g.fill();g.strokeStyle='rgba(42,26,32,.75)';g.lineWidth=1.6;g.stroke();
 g.beginPath();g.arc(bx-r*.9,by+r*1.05,r*.2,0,7);g.fill();g.stroke();g.beginPath();g.arc(bx-r*1.25,by+r*1.45,r*.11,0,7);g.fill();g.stroke();
 if(b.k=='food'){const f=T.foodLove[0],I=foodImg(f);if(ok(I)){const s=r*1.5/Math.max(I.naturalWidth,I.naturalHeight);g.drawImage(I,bx-I.naturalWidth*s/2,by-I.naturalHeight*s/2,I.naturalWidth*s,I.naturalHeight*s);}}
 else if(b.k=='zz'){g.fillStyle='#5a6aa8';g.font=`900 ${Math.round(r*.95)}px Georgia,serif`;g.textAlign='center';g.fillText('z',bx-r*.35,by+r*.35);g.font=`900 ${Math.round(r*1.25)}px Georgia,serif`;g.fillText('Z',bx+r*.3,by+r*.1+Math.sin(time*2)*1.5);}
 else if(b.k=='drop'){g.fillStyle='#3aa8ff';g.beginPath();g.moveTo(bx,by-r*.7);g.quadraticCurveTo(bx+r*.6,by,bx+r*.45,by+r*.3);g.arc(bx,by+r*.25,r*.47,0,Math.PI);g.quadraticCurveTo(bx-r*.6,by,bx,by-r*.7);g.fill();g.fillStyle='rgba(255,255,255,.7)';g.beginPath();g.ellipse(bx-r*.15,by+r*.1,r*.1,r*.18,-.4,0,7);g.fill();}
 else if(b.k=='fit'){g.save();g.translate(bx,by);g.scale(r/5,r/5);dumbbell(g,0,0,-.5,'#c8323c');g.restore();}
 else{const f=b.k=='note'?T.icons.note:T.icons.heart||T.icons.happy,I=tImg(t.n,f+'_hd.png');if(ok(I)){const s=r*1.45/Math.max(I.naturalWidth,I.naturalHeight);g.drawImage(I,bx-I.naturalWidth*s/2,by-I.naturalHeight*s/2,I.naturalWidth*s,I.naturalHeight*s);}}
 g.restore();}
// Every pose comes from the tenant's own sheet sprites (directions, walk cycle, sit pose, all emote poses); activities
// add motion (bob, squash, lunge, lying rotation) and painted props (barbell, drink, food, fridge door) — never edits to the art.
const IDLE_SEQ=['chibi_front','emote_idle','chibi_front','emote_smile','side','chibi_front','emote_happy','emote_idle','side','emote_blush'];
function hseed(n){let h=0;for(const ch of n)h=(h*31+ch.charCodeAt(0))%997;return h/97;}
function chibiPick(t,time){const T=TENANTS[t.n];let n=null,im=null,flip=false,bob=0,clip=null,rot=0,dx=0,dy=0,sy=1;const pre=[],post=[];const sd=hseed(t.n);
 const walkF=()=>{n='walk_'+(Math.floor(t.walkT*10.5)%T.walkN);flip=(t.dir>0?'right':'left')!=T.walkFace;};
 if(t.state=='walk'||t.state=='in'||t.state=='out'){walkF();if(t.face=='up'&&t.state=='walk'&&Math.floor(t.walkT*1.2)%3==2){}}
 else if(t.state=='use'&&t.U){const P=t.U.pose,U=t.U,r=U.r||0,H=SC.ch;
  if(P=='sit'||P=='ball'){if(U.away||U.back){n='chibi_back';dy=H*.2;if(P=='ball')bob=Math.abs(Math.sin(time*3.2))*5;}
   else{im=sitImg(t.n);const fr=U.f?(r==1||r==3):U.face=='right';flip=(fr?'right':'left')!=SIT_NATIVE;dy=H*.1;
    // seated idle: breathe, now and then react with an emote pose
    const ph=Math.floor((time+sd)/4)%5;if(ph==3&&!TENANTS[t.n].sitns){}bob=Math.sin(time*1.8)*.8;if(P=='ball'){bob=Math.abs(Math.sin(time*3.2))*6;}}}
  else if(P=='sleep'){n='chibi_front';rot=U.axis!=null?U.axis:1.1;sy=1+Math.sin(time*1.4)*.018;}
  else if(P=='cook'){// at the stove / counter / barbecue: back to camera, stirring, steam and sizzle over the pan
   const k=Math.floor((time+sd)*1.4)%6;n=k==4?'emote_happy':'chibi_back';bob=Math.abs(Math.sin(time*5))*1.2;dx=Math.sin(time*5)*1.2;
   post.push((g,x,y,w,h)=>{g.save();for(let i=0;i<4;i++){const ph=(time*.7+i/4)%1,sx=x+w*.18+Math.sin(time*2+i*1.7)*6,sy2=y-h*(.62+ph*.5),rad=4+ph*9;const sg=g.createRadialGradient(sx,sy2,1,sx,sy2,rad);sg.addColorStop(0,`rgba(255,255,255,${.55*(1-ph)})`);sg.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=sg;g.beginPath();g.arc(sx,sy2,rad,0,7);g.fill();}
    if(Math.sin(time*9)>.2){g.fillStyle='#ffd25a';for(let i=0;i<3;i++){g.beginPath();g.arc(x+w*.1+i*5,y-h*.55-((time*40+i*13)%10),1.4,0,7);g.fill();}}g.restore();});}
  else if(P=='dress'){// trying outfits at the wardrobe / mirror: look in, turn to show off, happy
   const k=Math.floor((time+sd)/1.6)%4;n=['chibi_back','chibi_back','emote_happy','emote_smile'][k];bob=k>=2?Math.abs(Math.sin(time*6))*1.6:0;
   if(k>=2)post.push((g,x,y,w,h)=>{g.save();g.fillStyle='#ffe16a';for(let i=0;i<3;i++){const a=time*2+i*2.1,sx=x+Math.cos(a)*w*.5,sy2=y-h*.8+Math.sin(a)*h*.15;g.beginPath();for(let j=0;j<8;j++){const aa=j*Math.PI/4,rr=j%2?1.6:4.5;g.lineTo(sx+Math.cos(aa)*rr,sy2+Math.sin(aa)*rr);}g.closePath();g.fill();}g.restore();});}
  else if(P=='watch'){// watching the fish: back view, now and then turns round delighted; bubbles
   const k=Math.floor((time+sd)/2.2)%4;n=k==3?'emote_happy':'chibi_back';bob=k==3?Math.abs(Math.sin(time*7))*1.5:0;}
  else if(P=='bath'){im=sitImg(t.n);clip=U.clip||.5;const fr=U.f?(r==1||r==3):false;flip=(fr?'right':'left')!=SIT_NATIVE;}
  else if(P=='run'){n='walk_'+(Math.floor(time*13)%T.walkN);const face=U.f?(r==0||r==1?'right':'left'):'right';flip=face!=T.walkFace;bob=Math.abs(Math.sin(time*13*Math.PI/2))*2;}
  else if(P=='shower'){n=showerFrame(t);bob=n.startsWith('shower_shower')?Math.abs(Math.sin(time*3))*1.2:0;}
  else if(P=='in'){n=U.pull?'chibi_back':'chibi_front';if(U.pull)bob=8+Math.sin(time*2.6)*9;else bob=Math.sin(time*2)*1;}
  else if(P=='squat'){const d=(1-Math.cos(time*2.6))/2;n=d>.7?'emote_angry':'chibi_front';sy=1-d*.11;dy=0;
   const bar=(g,x,y,w,h)=>{const by=y-h*.5*sy;g.save();g.lineCap='round';g.strokeStyle='#35202a';g.lineWidth=5;g.beginPath();g.moveTo(x-H*.48,by);g.lineTo(x+H*.48,by);g.stroke();g.strokeStyle='#d8dee6';g.lineWidth=2.6;g.stroke();
    [-1,1].forEach(s=>[[.44,'#3a3442',22],[.38,'#e2525a',15]].forEach(([o,c,ph])=>{g.beginPath();g.roundRect(x+s*H*o-3.5,by-ph/2,7,ph,2.5);g.fillStyle=c;g.fill();g.strokeStyle='#35202a';g.lineWidth=1.6;g.stroke();}));g.restore();};pre.push(bar);}
  else if(P=='punch'){const F=U.f?fBase(SC.G,U.f):null,[x0]=tPos(t),dir=F?(F.cx>x0?1:-1):1,hit=Math.sin(time*11)>0;n=dir>0?'chibi_right':'chibi_left';dx=hit?dir*5:0;bob=hit?1:0;
   if(hit&&Math.floor(time*11/Math.PI)%2==0)post.push((g,x,y)=>{const sx=x+dir*H*.36,sy2=y-H*.6;g.save();g.fillStyle='#fff6a8';g.strokeStyle='#35202a';g.lineWidth=1.4;g.beginPath();for(let i=0;i<10;i++){const a=i*Math.PI/5,rr=i%2?4:10;g.lineTo(sx+Math.cos(a)*rr,sy2+Math.sin(a)*rr);}g.closePath();g.fill();g.stroke();g.restore();});}
  else if(P=='front'||P=='read'){n='chibi_back';bob=Math.abs(Math.sin(time*2.4))*1.2;}
  else if(P=='tv'){const laugh=((time+sd)%6)>4.6;n=laugh?'emote_happy':'chibi_back';bob=laugh?Math.abs(Math.sin(time*9))*2:0;
   post.push((g,x,y,w,h)=>{g.save();g.globalCompositeOperation='screen';const hue=(time*90)%360,gr=g.createRadialGradient(x,y-h*.55,4,x,y-h*.55,h*.6);gr.addColorStop(0,`hsla(${hue},80%,65%,${.18+Math.sin(time*7)*.06})`);gr.addColorStop(1,'hsla(0,0%,0%,0)');g.fillStyle=gr;g.fillRect(x-h*.6,y-h*1.15,h*1.2,h*1.2);g.restore();});}
  else if(P=='fridge'){const el=(t.useDur||6)-t.useT;if(el<2.6){n='chibi_back';}else{n=Math.floor(time*2)%2?'emote_happy':'emote_smile';const fl=T.foodLove[0],I=foodImg(fl);post.push((g,x,y,w,h)=>{if(!ok(I))return;const s=h*.2/Math.max(I.naturalWidth,I.naturalHeight),bx=x+w*.18,by=y-h*.42+Math.sin(time*5)*2;g.drawImage(I,bx-I.naturalWidth*s/2,by-I.naturalHeight*s/2,I.naturalWidth*s,I.naturalHeight*s);});}}
  else if(P=='eat'){const k=Math.floor(time*2.2)%4;n=k==1?'emote_happy':k==3?'emote_blush':'emote_smile';bob=k==1?Math.abs(Math.sin(time*8))*2:0;const fl=T.foodLove[Math.floor((time+sd)/9)%T.foodLove.length],I=foodImg(fl);
   post.push((g,x,y,w,h)=>{if(!ok(I))return;const s=h*.2/Math.max(I.naturalWidth,I.naturalHeight),up=k==1?-h*.08:0,bx=x+w*.22,by=y-h*.38+up;g.drawImage(I,bx-I.naturalWidth*s/2,by-I.naturalHeight*s/2,I.naturalWidth*s,I.naturalHeight*s);});}
  else if(P=='dj'){const k=Math.floor(time*2.1)%4;n=k==0?'chibi_front':k==1?'emote_happy':k==2?'emote_smile':'emote_surprised';bob=Math.abs(Math.sin(time*8.4))*4;}
  else if(P=='dance'){const k=Math.floor(time*3)%4;n=['emote_happy','side','emote_smile','emote_surprised'][k];if(n=='side'){n=Math.floor(time*1.5)%2?'chibi_left':'chibi_right';}bob=Math.abs(Math.sin(time*7))*6;flip=n.startsWith('emote')&&Math.floor(time*1.5)%2==0;}
  else if(P=='coach'){const k=Math.floor(time*1.3)%4;n=['emote_happy','emote_smile','emote_surprised','chibi_front'][k];bob=Math.abs(Math.sin(time*3))*2;if(t.coachOf)flip=t.coachOf.fu+(-t.coachOf.fv)<t.fu-t.fv;
   if(k==2)post.push((g,x,y,w,h)=>{g.save();g.font=`900 ${Math.round(h*.16)}px Georgia,serif`;g.fillStyle='#fff';g.strokeStyle='#35202a';g.lineWidth=3;const tx=x+(flip?-1:1)*w*.42,ty=y-h*.9;g.strokeText('!',tx,ty);g.fillText('!',tx,ty);g.restore();});}
  else n='chibi_front';}
 else if(t.act){const A={talk:'emote_smile',feed:'emote_happy'};n=A[t.act]||'chibi_front';}
 else if(t.towel>0&&t.n=='Ophion'){const k=Math.min(3,Math.floor((5.6-t.towel)/1.4));n='shower_'+OPH_AFTER[k];bob=k==0?Math.abs(Math.sin(time*16))*1.5:0;dx=k==0?Math.sin(time*30)*1.5:0;}
 else{// standing idle: cycle through the sheet's idle/emote poses and side views so they feel alive
  const q=IDLE_SEQ[Math.floor((time+sd*3)/2.6)%IDLE_SEQ.length];if(t.face=='up')n='chibi_back';else if(q=='side')n=t.dir>0?'chibi_right':'chibi_left';else n=q;bob=Math.sin(time*2+sd)*.6;}
 if(t.state=='use'&&t.U){const U=t.U,T2=TENANTS[t.n];
  if(U.food&&!U.away&&!U.back){const fl=T2.foodLove[Math.floor((time+sd)/9)%T2.foodLove.length],I=foodImg(fl);post.push((g,x,y,w,h)=>{if(!ok(I))return;const s=h*.2/Math.max(I.naturalWidth,I.naturalHeight),bx=x+w*.24,by=y-h*.4+Math.sin(time*2)*1.5;g.drawImage(I,bx-I.naturalWidth*s/2,by-I.naturalHeight*s/2,I.naturalWidth*s,I.naturalHeight*s);});}
  if(U.act=='play'){bob=Math.abs(Math.sin(time*4))*1.2;post.push((g,x,y,w,h)=>{g.save();g.font=`900 ${Math.round(h*.16)}px Georgia,serif`;g.textAlign='center';for(let i=0;i<3;i++){const ph=(time*.5+i/3)%1;g.globalAlpha=1-ph;g.fillStyle=['#ffd84a','#ff8ac8','#8ad8ff'][i];g.strokeStyle='#35202a';g.lineWidth=2;const tx=x+(i-1)*w*.35+Math.sin(time*2+i)*5,ty=y-h*(.9+ph*.45);g.strokeText(i%2?'♫':'♪',tx,ty);g.fillText(i%2?'♫':'♪',tx,ty);}g.restore();});}
  if(U.act=='sunbathe'&&nightF()<.5)post.push((g,x,y,w,h)=>{g.save();g.globalCompositeOperation='screen';const sg=g.createRadialGradient(x,y-h*.3,2,x,y-h*.3,h*.7);sg.addColorStop(0,'rgba(255,230,150,.35)');sg.addColorStop(1,'rgba(255,230,150,0)');g.fillStyle=sg;g.fillRect(x-h*.7,y-h,h*1.4,h*1.4);g.restore();});
  if(U.pose=='watch')post.push((g,x,y,w,h)=>{g.save();g.strokeStyle='rgba(200,240,255,.9)';g.lineWidth=1.2;for(let i=0;i<4;i++){const ph=(time*.6+i/4)%1;g.beginPath();g.arc(x+w*(-.3+i*.2),y-h*(.4+ph*.6),2+ph*2,0,7);g.stroke();}g.restore();});}
 if(t.towel>0&&t.n!='Ophion'&&t.state!='use')post.push((g,x,y,w,h)=>drawTowel(g,t,x,y,w,h,time));
 if(t.towel>0&&t.n=='Ophion'&&t.towel>4.2)post.push((g,x,y,w,h)=>{g.save();g.fillStyle='rgba(190,228,255,.9)';for(let i=0;i<10;i++){const a=i*.63+time*3,rr=w*(.42+((i*7)%5)*.04);g.beginPath();g.ellipse(x+Math.cos(a)*rr,y-h*.55+Math.sin(a)*rr*.8,2.2,3.4,a,0,7);g.fill();}g.restore();});
 if(!im)im=tImg(t.n,n+'_hd.png');return{im,flip,bob,clip,rot,dx,dy,sy,pre,post};}
// fridge door swung open while a tenant takes something out (drawn between the fridge and the tenant)
function drawFridgeDoor(g,G,f,k){const r=f.r||0,KZ=G.eu[0]/45,P=(x,y,z)=>{const [a,b]=locToGrid(f.k,r,x,y),q=G.pt(f.u+a,f.v+b);return[q[0],q[1]-z*KZ];};const H=FA.DEF[f.k].h-6;
 const face=[P(.12,.92,4),P(.88,.92,4),P(.88,.92,H),P(.12,.92,H)];poly(g,face);const gr=g.createLinearGradient(0,face[2][1],0,face[0][1]);gr.addColorStop(0,'#fffbe8');gr.addColorStop(1,'#ffe9a8');g.fillStyle=gr;g.fill();
 g.strokeStyle='rgba(200,170,110,.8)';g.lineWidth=1.4;for(let z=30;z<H;z+=28){g.beginPath();g.moveTo(...P(.14,.92,z));g.lineTo(...P(.86,.92,z));g.stroke();}
 const fr=['#e2525a','#4aa85a','#e8b44e'];fr.forEach((c,i)=>{const p=P(.3+i*.2,.92,34+i*28);g.beginPath();g.ellipse(p[0],p[1]-5,5,6,0,0,7);g.fillStyle=c;g.fill();g.strokeStyle='#35202a';g.lineWidth=1.2;g.stroke();});
 const o=Math.min(1,k)*.8,door=[P(.88,.92,2),P(.88,.92+o,2),P(.88,.92+o,H+2),P(.88,.92,H+2)];poly(g,door);g.fillStyle=f.k=='fridge2'?'#4a4252':'#e8eaf2';g.fill();g.strokeStyle='#35202a';g.lineWidth=2;g.stroke();
 g.save();g.globalCompositeOperation='screen';const c=P(.5,1.3,0),lg=g.createRadialGradient(c[0],c[1],4,c[0],c[1],60);lg.addColorStop(0,'rgba(255,240,180,.35)');lg.addColorStop(1,'rgba(255,240,180,0)');g.fillStyle=lg;g.fillRect(c[0]-60,c[1]-60,120,120);g.restore();}
function drawChibiT(g,t,time,hl){const T=TENANTS[t.n],ref=tImg(t.n,'chibi_front_hd.png');const [x0,y0]=tPos(t);t.x=x0;t.y=y0;const H=SC.ch;
 const {im,flip,bob,clip,rot,dx,dy,sy,pre,post}=chibiPick(t,time);const x=x0+dx,y=y0+dy;g.save();g.globalAlpha=t.alpha;
 if(!(t.state=='use'&&t.onIt)){const sg=g.createRadialGradient(x,y,0,x,y,H*.3);sg.addColorStop(0,'rgba(10,6,20,.42)');sg.addColorStop(1,'rgba(10,6,20,0)');g.save();g.translate(x,y);g.scale(1,.38);g.fillStyle=sg;g.beginPath();g.arc(0,0,H*.3,0,7);g.fill();g.restore();}
 if(ok(im)&&ok(ref)){const k=H/ref.naturalHeight,w=im.naturalWidth*k,h=im.naturalHeight*k;pre.forEach(f=>f(g,x,y-bob,w,h));g.save();g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.translate(x,y-bob);
  if(rot){g.rotate(rot);g.scale(1,sy);if(flip)g.scale(-1,1);g.drawImage(im,-w/2,-h/2,w,h);}
  else{if(clip){g.beginPath();g.rect(-w,-h*1.2,w*2,h*1.2-h*clip);g.clip();}g.scale(1,sy);if(flip)g.scale(-1,1);if(hl){g.shadowColor='rgba(255,236,140,.95)';g.shadowBlur=14*DPR();}g.drawImage(im,-w/2,-h+2,w,h);}
  g.restore();post.forEach(f=>f(g,x,y-bob,w,h));}
 g.restore();
 if(t.alpha>.5){if(t.emo){const f=T.icons[t.emo]||T.icons.happy,I=tImg(t.n,f+'_hd.png');if(ok(I)){const s=(H*.26)/I.naturalHeight,iw=I.naturalWidth*s,ih=I.naturalHeight*s,ax=x-H*.3,ay=y-bob-H*1.0+Math.sin(time*4)*3;
   g.save();g.beginPath();g.ellipse(ax,ay-ih/2,iw/2+H*.06,ih/2+H*.06,0,0,7);g.fillStyle='rgba(255,255,255,.94)';g.fill();g.strokeStyle='rgba(42,26,32,.8)';g.lineWidth=2;g.stroke();g.imageSmoothingQuality='high';g.drawImage(I,ax-iw/2,ay-ih,iw,ih);g.restore();}}
  bubbleDraw(g,t,x,y-bob-(rot?-H*.3:0),H,time);}}

// ---------------- extras (gym-goers, clubbers, lobby visitors; sprites in npc.js) ----------------
let EX=[];
function spawnExtras(){EX=[];if(SC.kind!='place')return;const G=SC.G,p=SC.p,P=SC.P;const h=hour();
 if(p=='gym'&&(h<6||h>=23))return;if(p=='club'&&!(h>=20||h<4))return;
 const L=usables();
 npcCast(p,h).forEach((s,i)=>{const c=NPCS.find(q=>q.n==s.n);if(!c)return;let U=null,t=s.t;
  if(s.on){U=L.find(u=>u.f&&u.f.k==s.on&&(s.oi==null||P.props.indexOf(u.f)==s.oi));if(!U)return;t=[U.f.u,U.f.v];}
  if(!s.on&&(!G.floor(t[0],t[1])||G.occ[t[0]][t[1]])){const R=reach(G,t,null).filter(([u,v])=>!G.occ[u][v]);if(!R.length)return;t=R[0];}
  const e={c,s,u:t[0],v:t[1],fu:t[0]+.5,fv:t[1]+.5,act:s.act||c.act,flip:s.flip||0,walk:0,path:[],timer:(s.roam?2:10)+Math.random()*(s.roam?6:25),home:t.slice(),U:null,x:0,y:0,roam:s.roam||0};
  if(U){e.U=U.f;e.UP=U;e.draw=U.draw;e.depth=U.depth;e.flip=(U.f.r==1||U.f.r==2)?1:0;}
  if(!e.U)G.occ[e.u][e.v]=G.occ[e.u][e.v]||e;EX.push(e);});}
function updEx(e,dt,time){if(e.walk){const [nu,nv]=e.path[0]||[e.u,e.v],tx=nu+.5,ty=nv+.5,du=tx-e.fu,dv=ty-e.fv,d=Math.hypot(du,dv),sp=1.6*dt;if(Math.abs(du-dv)>.01)e.flip=du-dv<0?1:0;e.back=du+dv<-.01;
  if(d<=sp){e.fu=tx;e.fv=ty;e.u=nu;e.v=nv;e.path.shift();if(!e.path.length){e.walk=0;e.timer=e.roam?.6+Math.random()*2.5:12+Math.random()*30;SC.G.occ[e.u][e.v]=SC.G.occ[e.u][e.v]||e;}}else{e.fu+=du/d*sp;e.fv+=dv/d*sp;}return;}
 if(e.U)return;e.timer-=dt;if(e.timer<=0){// stroll to a nearby free tile, then carry on
  const G=SC.G;if(G.occ[e.u][e.v]===e)G.occ[e.u][e.v]=null;const R=reach(G,[e.u,e.v],null).filter(([u,v])=>Math.abs(u-e.home[0])+Math.abs(v-e.home[1])<=(e.roam||3)&&(u!=e.u||v!=e.v)&&(!e.roam||Math.abs(u-e.u)+Math.abs(v-e.v)>=2));
  if(!R.length){e.timer=10;G.occ[e.u][e.v]=e;return;}const goal=!e.roam&&Math.random()<.5?e.home:rnd(R),p=astar(G,[e.u,e.v],goal,e);if(!p||p.length<2){e.timer=10;G.occ[e.u][e.v]=e;return;}e.path=p.slice(1);e.walk=1;}}
function drawEx(g,e,time,hl){const [x,y]=e.U?e.draw:SC.G.pt(e.fu,e.fv);e.x=x;e.y=y;g.save();if(hl){g.shadowColor='rgba(255,236,140,.9)';g.shadowBlur=10*DPR();}
 drawExtra(g,x,y,{...e.c,act:e.U&&e.UP&&e.UP.pose=='run'?'run':e.act,onU:!!e.U,noShadow:!!e.U,back:e.walk&&e.back},time,e.walk,SC.ch*.97,e.flip);g.restore();}
