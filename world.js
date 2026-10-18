'use strict';
// Lumen Residences — world: iso tile grids, A* pathfinding with walls/doorways, tile-scene rendering
// (floor textures + doors sliced from the user's furniture sheet), furniture footprints, tenant life AI and extras.

// ---------------- furniture definitions ----------------
// fp: footprint in tiles [along u (down-right), along v (down-left)] for the sheet's facing (front faces +v / down-left).
// Mirrored ("rotated") pieces swap the footprint and face +u. oy: world px nudge of the sprite's base.
// use: how a tenant uses it. pose: sit (sits on it) | sleep (on the bed) | bath (in the tub, legs hidden) | in (inside: shower, pull-up tower)
//      | run (on the treadmill) | front (stands at the front, facing it) | flex/punch/stretch (stands beside, exercising)
const FDEF={
 bed:{fp:[2,2],oy:4,use:{act:'sleep',pose:'sleep',dx:0,dy:-34}},bed_grey:{fp:[3,2],oy:4,use:{act:'sleep',pose:'sleep',dx:0,dy:-30}},
 sofa_red:{fp:[2,1],oy:3,use:{act:'sit',pose:'sit',dx:-2,dy:-18}},sofa_cream:{fp:[2,1],oy:3,use:{act:'sit',pose:'sit',dx:-2,dy:-18}},
 sofa_grey:{fp:[2,1],oy:3,use:{act:'sit',pose:'sit',dx:-2,dy:-16}},sofa_black:{fp:[2,1],oy:3,use:{act:'sit',pose:'sit',dx:-4,dy:-20}},
 armchair:{fp:[1,1],oy:2,use:{act:'sit',pose:'sit',dx:0,dy:-14}},chair_red:{fp:[1,1],oy:2,use:{act:'sit',pose:'sit',dx:0,dy:-16}},
 table_coffee:{fp:[2,1],oy:2},table_red:{fp:[2,1],oy:2},rug_red:{fp:[3,2],flat:1,oy:0},
 tv:{fp:[2,1],oy:2,sc:.85,use:{act:'tv',pose:'front'}},
 fridge:{fp:[1,1],oy:3,use:{act:'fridge',pose:'front'}},fridge2:{fp:[1,1],oy:3,use:{act:'fridge',pose:'front'}},
 counter:{fp:[2,1],oy:3,use:{act:'cook',pose:'front'}},
 toilet:{fp:[1,1],oy:2,use:{act:'toilet',pose:'front'}},sink:{fp:[1,1],oy:2,use:{act:'wash',pose:'front'}},vanity:{fp:[1,1],oy:2,use:{act:'wash',pose:'front'}},
 bathtub:{fp:[2,1],oy:3,use:{act:'bath',pose:'bath',dx:0,dy:-6,clip:.52}},shower:{fp:[1,1],oy:2,use:{act:'shower',pose:'in',dx:0,dy:-6}},
 desk:{fp:[2,2],oy:3,use:{act:'read',pose:'sit',dx:-34,dy:-4,back:1}},bookshelf:{fp:[2,1],oy:2,use:{act:'read',pose:'front'}},bookcase_red:{fp:[2,1],oy:2,use:{act:'read',pose:'front'}},
 wardrobe_wood:{fp:[1,1],oy:2},wardrobe_black:{fp:[1,1],oy:2},lamp_floor:{fp:[1,1],oy:2},
 plant:{fp:[1,1],oy:3},plant_palm:{fp:[1,1],oy:3},plant_big:{fp:[1,1],oy:3},
 treadmill:{fp:[3,2],oy:3,sc:.8,use:{act:'run',pose:'run',dx:0,dy:-20}},bench_black:{fp:[2,1],oy:2,use:{act:'lift',pose:'flex'}},bench_blue:{fp:[2,1],oy:2,use:{act:'lift',pose:'sit',dx:0,dy:-8}},
 ball:{fp:[1,1],oy:2,sc:.72,use:{act:'stretch',pose:'stretch'}},pullup:{fp:[1,1],oy:3,use:{act:'pull',pose:'in',dx:0,dy:-4,pull:1}},
 speedbag:{fp:[1,1],oy:2,use:{act:'punch',pose:'punch'}},machine_red:{fp:[1,1],oy:2,use:{act:'run',pose:'front'}},kettlebell:{fp:[1,1],oy:1,use:{act:'lift',pose:'flex'}},
 lockers:{fp:[1,1],oy:2},
 // older clean decor cuts (assets/furn)
 armor:{fp:[1,1],oy:2,src:'furn'},statue_white:{fp:[1,1],oy:2,src:'furn'},roses:{fp:[1,1],oy:2,src:'furn'},lamp_warm:{fp:[1,1],oy:2,src:'furn'},palm:{fp:[1,1],oy:2,src:'furn'},
 // procedural club fixtures (no sheet art exists for them)
 djbooth:{fp:[4,1],proc:1,use:{act:'dj',pose:'dj'}},speaker:{fp:[1,1],proc:1},barstool:{fp:[1,1],proc:1},
};
const furnSrc=k=>`assets/${FDEF[k]&&FDEF[k].src||'furn2'}/${k}_hd.png`;
const TEX={};function tex(id){return TEX[id]||(TEX[id]=img(`assets/tiles/${id}.jpg`));}
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
  for(const z in R.zones){const [u0,v0,w,h]=R.zones[z].r;for(let u=u0;u<u0+w;u++)for(let v=v0;v<v0+h;v++)G.zone[u][v]=z;}
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
const fpOf=f=>{const d=FDEF[f.k]||{fp:[1,1]};return f.r?[d.fp[1],d.fp[0]]:d.fp;};
function fTiles(f){const [w,h]=fpOf(f),T=[];for(let i=0;i<w;i++)for(let j=0;j<h;j++)T.push([f.u+i,f.v+j]);return T;}
function fBase(G,f){const [w,h]=fpOf(f),L=G.pt(f.u,f.v+h),R=G.pt(f.u+w,f.v),B=G.pt(f.u+w,f.v+h);return{cx:(L[0]+R[0])/2,by:B[1],w:R[0]-L[0],depth:f.u+w/2+f.v+h/2};}
function sceneFurn(){return SC.kind=='room'?S.rooms[SC.n].furn:SC.P.props;}
function rebuildOcc(G,list,skip){for(let u=0;u<G.cols;u++)G.occ[u].fill(null);if(!list)return;list.forEach(f=>{if(f===skip)return;const d=FDEF[f.k];if(!d||d.flat)return;fTiles(f).forEach(([u,v])=>{if(G.in(u,v))G.occ[u][v]=f;});});
 }
function canPlace(G,f,skip){const T=fTiles(f);if(!T.every(([u,v])=>G.floor(u,v)))return false;const z=G.zone[T[0][0]][T[0][1]];
 if(!T.every(([u,v])=>G.zone[u][v]==z))return false;if(FDEF[f.k].flat)return true;
 if(!T.every(([u,v])=>!G.occ[u][v]||G.occ[u][v]===skip))return false;if(T.some(([u,v])=>G.keep.has(u*512+v)))return false;return true;}
// where a tenant stands to use f, and where the sprite is drawn while using it
function usePoint(G,f){const d=FDEF[f.k],U=d.use;if(!U)return null;const [w,h]=fpOf(f),b=fBase(G,f);
 if(U.act=='dj'){const st=[[f.u+1,f.v-1],[f.u+2,f.v-1]].filter(([u,v])=>G.floor(u,v));const p=G.pt(f.u+w/2,f.v-.45);return{f,act:'dj',pose:'dj',stand:st,draw:p,depth:f.u+w/2+f.v-.4,face:'right',behind:1};}
 const front=[];if(f.r){for(let j=0;j<h;j++)front.push([f.u+w,f.v+j]);}else{for(let i=0;i<w;i++)front.push([f.u+i,f.v+h]);}
 const side=[];for(let i=-1;i<=w;i++)for(let j=-1;j<=h;j++){if(i>=0&&i<w&&j>=0&&j<h)continue;if((i<0||i>=w)&&(j<0||j>=h))continue;side.push([f.u+i,f.v+j]);}
 const z=G.zone[f.u]&&G.zone[f.u][f.v],behind=([u,v])=>f.r?u<f.u:v<f.v;
 const cand=[...front,...side.filter(p=>!front.some(q=>q[0]==p[0]&&q[1]==p[1])&&!behind(p))].filter(([u,v])=>G.free(u,v)&&G.zone[u][v]==z);
 const dx=(U.dx||0)*(f.r?-1:1);return{f,act:U.act,pose:U.pose,stand:cand,draw:[b.cx+dx,b.by+(U.dy||0)],depth:b.depth+(U.pose=='in'?-.05:.05),clip:U.clip,back:U.back,pull:U.pull,
  face:f.r?'left':'right'};}

// ---------------- rendering of tile scenes ----------------
function patFor(g,G,id){const t=tex(id);if(!ok(t))return null;const p=g.createPattern(t,'repeat'),s=t.naturalWidth;p.setTransform(new DOMMatrix([G.eu[0]/s,G.eu[1]/s,G.ev[0]/s,G.ev[1]/s,G.O[0],G.O[1]]));return p;}
function tileQuad(G,u,v,w=1,h=1){return[G.pt(u,v),G.pt(u+w,v),G.pt(u+w,v+h),G.pt(u,v+h)];}
function drawRoomShell(g,time){const R=SC.R,G=SC.G,WH=R.WH,th=R.theme;
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

// ---------------- procedural club fixtures ----------------
function drawProc(g,G,f,time){const b=fBase(G,f),[w,h]=fpOf(f);
 if(f.k=='speaker'){const x=b.cx,y=b.by,W=b.w*.7,H=118;const gr=g.createLinearGradient(x-W/2,0,x+W/2,0);gr.addColorStop(0,'#2a2438');gr.addColorStop(.5,'#16121f');gr.addColorStop(1,'#0c0a12');
  g.beginPath();g.roundRect(x-W/2,y-H-8,W,H,6);g.fillStyle=gr;g.fill();g.strokeStyle='#48eaff88';g.lineWidth=1.5;g.stroke();
  const pulse=1+Math.max(0,Math.sin(time*8.4))*.08;[[.32,.2],[.7,.33]].forEach(([fy,r])=>{const cy=y-H-8+H*fy,R=W*r*pulse;const cg=g.createRadialGradient(x,cy,1,x,cy,R);cg.addColorStop(0,'#5a5070');cg.addColorStop(.6,'#1a1626');cg.addColorStop(1,'#0a0810');g.beginPath();g.arc(x,cy,R,0,7);g.fillStyle=cg;g.fill();g.strokeStyle='#c15aff';g.lineWidth=1.2;g.stroke();});return;}
 if(f.k=='barstool'){const x=b.cx,y=b.by-8;g.fillStyle='#2a2438';g.fillRect(x-2,y-34,4,30);g.beginPath();g.ellipse(x,y-36,14,6,0,0,7);g.fillStyle='#c8323c';g.fill();g.strokeStyle='#1a1020';g.stroke();g.beginPath();g.ellipse(x,y-4,10,4,0,0,7);g.fillStyle='#3a3448';g.fill();return;}
 if(f.k=='djbooth'){const BH=58,p=(u,v,z=0)=>{const q=G.pt(f.u+u,f.v+v);return[q[0],q[1]-z];};
  // body: front face (+v side), right face (+u side), top
  const fr=[p(0,h),p(w,h),p(w,h,BH),p(0,h,BH)],rt=[p(w,0),p(w,h),p(w,h,BH),p(w,0,BH)],tp=[p(0,0,BH),p(w,0,BH),p(w,h,BH),p(0,h,BH)];
  let gr=g.createLinearGradient(...fr[0],...fr[1]);gr.addColorStop(0,'#1e1830');gr.addColorStop(1,'#120e1e');poly(g,fr);g.fillStyle=gr;g.fill();
  poly(g,rt);g.fillStyle='#0d0a16';g.fill();
  gr=g.createLinearGradient(...tp[0],...tp[2]);gr.addColorStop(0,'#3a3150');gr.addColorStop(1,'#241e36');poly(g,tp);g.fillStyle=gr;g.fill();
  // neon strips on the front
  const hue=(time*50)%360;[.25,.62].forEach((z,i)=>{const a=p(0,h,BH*z),c=p(w,h,BH*z);g.save();g.lineWidth=3;g.strokeStyle=g.shadowColor=`hsl(${(hue+i*140)%360},100%,62%)`;g.shadowBlur=14;g.beginPath();g.moveTo(...a);g.lineTo(...c);g.stroke();g.restore();});
  // LUMEN logo plate
  g.save();const m=p(w/2,h,BH*.44);g.translate(...m);g.transform(1,-.5,0,1,0,0);g.font='900 15px Georgia,serif';g.textAlign='center';g.fillStyle='#ffe6ff';g.shadowColor='#c15aff';g.shadowBlur=10;g.fillText('ZAYNE',0,5);g.restore();
  // turntables + mixer on top
  [[.7,.5],[3.3,.5]].forEach(([u,v])=>{const c=p(u,v,BH);g.beginPath();g.ellipse(c[0],c[1],30,15,0,0,7);g.fillStyle='#0a0810';g.fill();g.strokeStyle='#5a5070';g.lineWidth=2;g.stroke();
   g.save();g.translate(c[0],c[1]);g.scale(1,.5);g.rotate(time*3.4);g.strokeStyle='rgba(120,110,150,.6)';g.lineWidth=1;for(let r=8;r<28;r+=4){g.beginPath();g.arc(0,0,r,0,7);g.stroke();}g.fillStyle='#c8323c';g.beginPath();g.arc(0,0,6,0,7);g.fill();g.fillStyle='#fff';g.fillRect(14,-1,10,2);g.restore();});
  const mx=p(2,.5,BH);g.save();g.translate(...mx);g.transform(1,.5,-1,.5,0,0);g.fillStyle='#1a1626';g.fillRect(-16,-16,32,32);for(let i=0;i<3;i++)for(let j=0;j<3;j++){g.beginPath();g.arc(-9+i*9,-9+j*9,2.6,0,7);g.fillStyle=`hsl(${(hue+i*60+j*30)%360},100%,${55+Math.sin(time*6+i+j)*15}%)`;g.fill();}g.restore();
  // laptop glow
  const lp=p(2.4,.15,BH);g.save();g.fillStyle='#d8f6ff';g.shadowColor='#48eaff';g.shadowBlur=16;g.beginPath();g.moveTo(lp[0]-14,lp[1]);g.lineTo(lp[0]+10,lp[1]-12);g.lineTo(lp[0]+10,lp[1]-30);g.lineTo(lp[0]-14,lp[1]-18);g.closePath();g.fill();g.restore();
  return;}}

// ---------------- sprites ----------------
function drawFurn(g,G,f,alpha,hl,time){const d=FDEF[f.k];if(!d)return;if(d.proc){drawProc(g,G,f,time);return;}const i=img(furnSrc(f.k));if(!ok(i))return;const b=fBase(G,f);
 const k=(G.k||1)*(d.sc||1),w=i.naturalWidth/3*2*k,h=i.naturalHeight/3*2*k,x=b.cx,y=b.by+(d.oy||0)*k;
 if(!d.flat){const sh=g.createRadialGradient(x,y-b.w*.12,0,x,y-b.w*.12,b.w*.55);sh.addColorStop(0,'rgba(8,6,14,.42)');sh.addColorStop(1,'rgba(8,6,14,0)');g.save();g.translate(x,y-b.w*.12);g.scale(1,.5);g.fillStyle=sh;g.beginPath();g.arc(0,0,b.w*.55,0,7);g.fill();g.restore();}
 g.save();if(alpha!=null)g.globalAlpha=alpha;g.imageSmoothingQuality='high';g.translate(x,y);if(f.r)g.scale(-1,1);if(hl){g.shadowColor='rgba(255,236,140,.95)';g.shadowBlur=12*DPR();}g.drawImage(i,-w/2,-h,w,h);g.restore();}
function footprint(g,G,f,okc){fTiles(f).forEach(([u,v])=>{poly(g,tileQuad(G,u,v));g.fillStyle=okc?'rgba(90,230,120,.35)':'rgba(255,80,80,.38)';g.fill();g.strokeStyle=okc?'rgba(140,255,170,.9)':'rgba(255,120,120,.9)';g.lineWidth=2;g.stroke();});}

// ---------------- tenant life (needs drive what they do at home) ----------------
const NEED_ACT={food:['fridge','cook'],sleep:['sleep'],fun:['tv','sit','dj','read'],clean:['bath','shower','wash','toilet'],fit:['run','lift','stretch','pull','punch']};
const SLEEP_H={Ares:[22,6],Zayne:[4,12],Batzz:[23,7],Ophion:[23,7]};
const asleepH=n=>{const [a,b]=SLEEP_H[n],h=hour();return a<b?h>=a&&h<b:h>=a||h<b;};
function needs(n){S.need=S.need||{};return S.need[n]||(S.need[n]={food:70,sleep:80,fun:60,clean:75,fit:60});}
function tickNeeds(dm){for(const n of S.unlocked){const q=needs(n),home=placeOf(n)=='home';q.food-=dm*.05;q.fun-=dm*(home?.05:.02);q.clean-=dm*.03;q.sleep-=dm*.025;q.fit-=dm*(n=='Ares'||n=='Batzz'?.05:.02);for(const k in q)q[k]=clamp(q[k],0,100);}}
const NEED_OF={fridge:'food',cook:'food',sleep:'sleep',tv:'fun',sit:'fun',dj:'fun',read:'fun',bath:'clean',shower:'clean',wash:'clean',toilet:'clean',run:'fit',lift:'fit',stretch:'fit',pull:'fit',punch:'fit'};
// which acts a tenant enjoys most (themed)
const THEME={Ares:['lift','run','pull','punch','stretch'],Zayne:['read','tv','dj'],Batzz:['lift','punch','sit'],Ophion:['read','tv']};

// usable things in the current scene: placed furniture + painted spots
function usables(){const L=[],G=SC.G;
 sceneFurn().forEach(f=>{const U=usePoint(G,f);if(U&&U.stand.length)L.push(U);});
 if(SC.kind=='room'&&SC.R.spots)SC.R.spots.forEach(s=>{const at=s.at||[s.t[0]+.5,s.t[1]+.5];L.push({spot:s,act:s.act,pose:s.pose,stand:[s.t],draw:G.pt(...at),depth:at[0]+at[1]+.6,clip:s.clip,face:s.face||'right',back:s.back,dur:s.act=='sleep'?14:null});});
 return L;}

// ---------------- tenant entities ----------------
const SPD=2.3; // tiles per second
function tPos(t){if(t.U&&t.state=='use'&&t.U.draw&&t.onIt)return t.U.draw;return SC.G.pt(t.fu,t.fv);}
function tDepth(t){if(t.U&&t.state=='use'&&t.onIt)return t.U.depth;return t.fu+t.fv;}
function placeT(t,u,v){t.fu=u+.5;t.fv=v+.5;t.u=u;t.v=v;}
function newT(n,u,v){const t={n,u,v,fu:u+.5,fv:v+.5,path:[],face:'down',dir:1,state:'idle',U:null,useT:0,idle:.6+Math.random()*1.5,walkT:0,emo:null,emoT:0,bubble:null,alpha:1,onArrive:null,x:0,y:0};return t;}
function goTo(t,goal,then){const G=SC.G,p=astar(G,[t.u,t.v],goal,null);if(!p){return false;}t.path=p.slice(1);t.onArrive=then||null;t.state='walk';t.onIt=false;return true;}
function goUse(t,U,then){const G=SC.G;let best=null;for(const s of U.stand){const p=astar(G,[t.u,t.v],s,null);if(p&&(!best||p.length<best.length))best=p;}if(!best)return false;
 t.path=best.slice(1);t.state='walk';t.onIt=false;t.onArrive=()=>startUse(t,U,then);return true;}
const ON_POSES=['sit','sleep','bath','in','run','dj'];
function startUse(t,U,then){t.state='use';t.U=U;t.onIt=ON_POSES.includes(U.pose);t.useT=U.dur||(U.pose=='sleep'?14:U.pose=='dj'?999:6+Math.random()*4);
 const ic={fridge:'food',cook:'food',sleep:'zz',tv:'note',read:'note',dj:'note',bath:'drop',shower:'drop',wash:'drop',toilet:'drop',run:'fit',lift:'fit',stretch:'fit',pull:'fit',punch:'fit',sit:'heart'}[U.act];
 if(ic)t.bubble={k:ic,t:U.pose=='sleep'||U.pose=='dj'?999:3.2};
 if(U.f&&U.act=='fridge')t.fridgeOpen=1.2;
 t.thenUse=then||null;if(t.onUseStart){const f=t.onUseStart;t.onUseStart=null;setTimeout(f,450);}}
function endUse(t){const U=t.U;if(U&&NEED_OF[U.act]&&SC.kind=='room'){const q=needs(t.n);q[NEED_OF[U.act]]=Math.min(100,q[NEED_OF[U.act]]+(U.act=='sleep'?60:45));if(U.act=='fridge'||U.act=='cook'){const fr=S.rooms[t.n].fridge;const k=Object.keys(fr).find(q=>fr[q]>0);/* the tenant snacks from stock only when you feed them; idle snacking is free */}}
 t.state='idle';t.U=null;t.onIt=false;t.bubble=t.bubble&&t.bubble.t>50?null:t.bubble;t.idle=1.2+Math.random()*2.5;const th=t.thenUse;t.thenUse=null;th&&th();}
function halt(t){if(!t)return;if(t.state=='use'&&t.onIt){t.onIt=false;}t.path=[];t.onArrive=null;t.U=null;t.state='idle';t.bubble=null;t.idle=4;}
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
function updT(t,dt){if(t.emoT>0){t.emoT-=dt;if(t.emoT<=0)t.emo=null;}if(t.bubble){t.bubble.t-=dt;if(t.bubble.t<=0)t.bubble=null;}if(t.fridgeOpen>0)t.fridgeOpen-=dt;
 if(t.state=='in'){t.inT+=dt*SPD;const k=Math.min(1,t.inT/.9);t.fu=t.u+.5+t.inV[0]*.9*(1-k);t.fv=t.v+.5+t.inV[1]*.9*(1-k);t.alpha=k;t.walkT+=dt;t.dir=(-t.inV[0]+t.inV[1])>0?-1:1;t.face=-(t.inV[0]+t.inV[1])>0?'down':'up';if(k>=1){t.state='idle';t.idle=.3;}return;}
 if(t.state=='out'){t.outT+=dt*SPD;const k=Math.min(1,t.outT/.9);t.fu=t.u+.5+t.outV[0]*.9*k;t.fv=t.v+.5+t.outV[1]*.9*k;t.alpha=1-k;t.walkT+=dt;t.dir=(t.outV[0]-t.outV[1])>0?1:-1;t.face=(t.outV[0]+t.outV[1])>0?'down':'up';if(k>=1){t.gone=1;t.after&&t.after();}return;}
 if(t.state=='walk'){if(!t.path.length){t.state='idle';const f=t.onArrive;t.onArrive=null;f&&f();return;}
  const [nu,nv]=t.path[0];if(!SC.G.open(t.u,t.v,nu,nv)||!SC.G.free(nu,nv)&&!(t.path.length==1)){// blocked (e.g. furniture just placed): replan
   const g=t.path[t.path.length-1],f=t.onArrive;if(!goTo(t,g,f)){t.path=[];t.state='idle';t.idle=1;}return;}
  const tx=nu+.5,ty=nv+.5,du=tx-t.fu,dv=ty-t.fv,d=Math.hypot(du,dv),sp=SPD*dt;t.walkT+=dt;
  const sx=du-dv,sy=du+dv;if(Math.abs(sx)>.01)t.dir=sx>0?1:-1;t.face=sy>0?'down':'up';
  if(d<=sp){t.fu=tx;t.fv=ty;t.u=nu;t.v=nv;t.path.shift();}else{t.fu+=du/d*sp;t.fv+=dv/d*sp;}return;}
 if(t.state=='use'){t.useT-=dt;if(t.U&&t.U.pose=='dj'&&!(SC.kind=='place'&&SC.p=='club'&&t.n=='Zayne')){t.useT=Math.min(t.useT,0);}
  if(t.U&&t.U.pose=='sleep'&&SC.kind=='room'&&!asleepH(t.n)&&t.useT>8)t.useT=1;
  if(t.U&&t.U.pose=='sleep'&&SC.kind=='room'&&asleepH(t.n)&&t.useT<1)t.useT=20;
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
function chibiPick(t,time){const T=TENANTS[t.n];let n=null,im=null,flip=false,bob=0,clip=null,dy=0;
 const walkF=()=>{n='walk_'+(Math.floor(t.walkT*10.5)%T.walkN);flip=(t.dir>0?'right':'left')!=T.walkFace;};
 if(t.state=='walk'||t.state=='in'||t.state=='out')walkF();
 else if(t.state=='use'&&t.U){const P=t.U.pose,U=t.U;
  if(P=='sit'||P=='sleep'||P=='bath'){im=sitImg(t.n);const fr=U.f?!!U.f.r:U.face=='left'?false:U.face=='right';flip=(fr?'right':'left')!=SIT_NATIVE;if(U.back)flip=!flip;if(P=='bath')clip=U.clip||.5;if(P=='sleep')bob=Math.sin(time*1.6)*1.2;}
  else if(P=='run'){n='walk_'+(Math.floor(time*12)%T.walkN);const fr=U.f?!!U.f.r:false;flip=(fr?'left':'right')!=T.walkFace;}
  else if(P=='in'){n=U.pull?'chibi_back':'chibi_front';if(U.pull)bob=8+Math.sin(time*3.6)*8;}
  else if(P=='front'){n='chibi_back';}
  else if(P=='flex'){n=Math.floor(time*1.6)%2?'emote_happy':'emote_smile';bob=Math.abs(Math.sin(time*4))*4;}
  else if(P=='punch'){n='emote_angry';bob=Math.abs(Math.sin(time*7))*3;}
  else if(P=='stretch'){n='emote_smile';bob=Math.sin(time*2)*3;}
  else if(P=='dj'){n=Math.floor(time*2.1)%3==0?'chibi_front':'emote_happy';bob=Math.abs(Math.sin(time*8.4))*4;}
  else if(P=='dance'){n=Math.floor(time*3)%2?'emote_happy':'emote_smile';bob=Math.abs(Math.sin(time*7))*6;flip=Math.floor(time*1.5)%2==0;}
  else if(P=='coach'){n=Math.floor(time*1.2)%3==0?'emote_happy':Math.floor(time*1.2)%3==1?'emote_smile':'chibi_front';bob=Math.abs(Math.sin(time*3))*2;if(t.coachOf)flip=t.coachOf.fu+(-t.coachOf.fv)<t.fu-t.fv;}
  else n='chibi_front';}
 else if(t.act){const A={talk:'emote_smile',feed:'emote_happy'};n=A[t.act]||'chibi_front';}
 else n=t.face=='up'?'chibi_back':'chibi_front';
 if(!im)im=tImg(t.n,n+'_hd.png');return{im,flip,bob,clip};}
function drawChibiT(g,t,time,hl){const T=TENANTS[t.n],ref=tImg(t.n,'chibi_front_hd.png');const [x,y]=tPos(t);t.x=x;t.y=y;const H=SC.ch;
 const {im,flip,bob,clip}=chibiPick(t,time);g.save();g.globalAlpha=t.alpha;
 if(!(t.state=='use'&&t.onIt)){const sg=g.createRadialGradient(x,y,0,x,y,H*.3);sg.addColorStop(0,'rgba(10,6,20,.42)');sg.addColorStop(1,'rgba(10,6,20,0)');g.save();g.translate(x,y);g.scale(1,.38);g.fillStyle=sg;g.beginPath();g.arc(0,0,H*.3,0,7);g.fill();g.restore();}
 if(ok(im)&&ok(ref)){const k=H/ref.naturalHeight,w=im.naturalWidth*k,h=im.naturalHeight*k;g.save();g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.translate(x,y-bob);
  if(clip){g.beginPath();g.rect(-w,-h*1.2,w*2,h*1.2-h*clip);g.clip();}
  if(flip)g.scale(-1,1);if(hl){g.shadowColor='rgba(255,236,140,.95)';g.shadowBlur=14*DPR();}g.drawImage(im,-w/2,-h+2,w,h);g.restore();}
 g.restore();
 if(t.alpha>.5){if(t.emo){const f=T.icons[t.emo]||T.icons.happy,I=tImg(t.n,f+'_hd.png');if(ok(I)){const s=(H*.26)/I.naturalHeight,iw=I.naturalWidth*s,ih=I.naturalHeight*s,ax=x-H*.3,ay=y-bob-H*1.0+Math.sin(time*4)*3;
   g.save();g.beginPath();g.ellipse(ax,ay-ih/2,iw/2+H*.06,ih/2+H*.06,0,0,7);g.fillStyle='rgba(255,255,255,.94)';g.fill();g.strokeStyle='rgba(42,26,32,.8)';g.lineWidth=2;g.stroke();g.imageSmoothingQuality='high';g.drawImage(I,ax-iw/2,ay-ih,iw,ih);g.restore();}}
  bubbleDraw(g,t,x,y-bob,H,time);}}

// ---------------- extras (gym-goers, clubbers) ----------------
let EX=[];
function spawnExtras(){EX=[];if(SC.kind!='place')return;const G=SC.G,p=SC.p,P=SC.P;if(!P.extras)return;const h=hour();
 if(p=='gym'&&(h<6||h>=23))return;if(p=='club'&&!(h>=20||h<4))return;
 const cast=p=='gym'?GYMCAST:CLUBCAST,L=usables();
 P.extras.forEach((s,i)=>{const c=cast.find(q=>q.n==s.n);if(!c)return;let U=null,t=s.t;
  if(s.on){U=L.find(u=>u.f&&u.f.k==s.on&&(s.oi==null||P.props.indexOf(u.f)==s.oi));if(!U)return;t=[U.f.u,U.f.v];}
  const e={c,u:t[0],v:t[1],fu:t[0]+.5,fv:t[1]+.5,act:s.act||c.act,flip:s.flip||0,walk:0,path:[],timer:10+Math.random()*25,home:t.slice(),U:null,x:0,y:0};
  if(U){e.U=U.f;e.draw=U.draw;e.depth=U.depth;e.flip=U.f.r?1:0;}
  if(!e.U)G.occ[e.u][e.v]=G.occ[e.u][e.v]||e;EX.push(e);});}
function updEx(e,dt,time){if(e.walk){const [nu,nv]=e.path[0]||[e.u,e.v],tx=nu+.5,ty=nv+.5,du=tx-e.fu,dv=ty-e.fv,d=Math.hypot(du,dv),sp=1.6*dt;if(Math.abs(du-dv)>.01)e.flip=du-dv<0?1:0;
  if(d<=sp){e.fu=tx;e.fv=ty;e.u=nu;e.v=nv;e.path.shift();if(!e.path.length){e.walk=0;e.timer=12+Math.random()*30;SC.G.occ[e.u][e.v]=SC.G.occ[e.u][e.v]||e;}}else{e.fu+=du/d*sp;e.fv+=dv/d*sp;}return;}
 if(e.U)return;e.timer-=dt;if(e.timer<=0){// stroll to a nearby free tile, then carry on
  const G=SC.G;if(G.occ[e.u][e.v]===e)G.occ[e.u][e.v]=null;const R=reach(G,[e.u,e.v],null).filter(([u,v])=>Math.abs(u-e.home[0])+Math.abs(v-e.home[1])<=3&&(u!=e.u||v!=e.v));
  if(!R.length){e.timer=10;G.occ[e.u][e.v]=e;return;}const goal=Math.random()<.5?e.home:rnd(R),p=astar(G,[e.u,e.v],goal,e);if(!p||p.length<2){e.timer=10;G.occ[e.u][e.v]=e;return;}e.path=p.slice(1);e.walk=1;}}
function drawEx(g,e,time,hl){const [x,y]=e.U?e.draw:SC.G.pt(e.fu,e.fv);e.x=x;e.y=y;g.save();if(hl){g.shadowColor='rgba(255,236,140,.9)';g.shadowBlur=10*DPR();}
 drawExtra(g,x,y,{...e.c,act:e.act,noShadow:!!e.U},time,e.walk,SC.ch*.94,e.flip);g.restore();}
