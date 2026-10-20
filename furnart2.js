'use strict';
// Lumen Residences v0.3.3 — furniture library expansion. Same painter as furnart.js: soft cel-shaded rounded boxes, cylinders and
// balls modelled in local tile space and projected for all 4 facings (real rotation), with the dark sticker outline that matches
// the tenant chibis. Basic → standard → premium pieces, balcony furniture, and an expensive LUXURY line in the style of Ophion's
// old Roppongi dragon suite (black lacquer, gold trim, crimson velvet, gold dragon motifs, warm lamp glow).
(()=>{const {C,tone,H}=FA,{rr,knob,sofa,shelf,plant,tone2,rgba,rnd}=H,D=FA.DEF;
const LAC='#25212b',LAC2='#36303c',CRIM='#8e1f2c',CRIM2='#b8303c',GOLD='#e8b44e',GOLD2='#ffe08a',HONEY='#c98a4a',HONEY2='#e0a462',WAL='#7a4e33',TEAL='#3fa6a0',MINT='#9ad8c4',CREAM='#f3e6cc',WHITE='#f4f2f6';
// warm light glow drawn after the outline pass (no sticker edge on light)
const glow=(r,a=.5,rgb='255,214,140')=>(c,q)=>{const g=c.createRadialGradient(q[0],q[1],2,q[0],q[1],r);g.addColorStop(0,`rgba(${rgb},${a})`);g.addColorStop(1,`rgba(${rgb},0)`);c.fillStyle=g;c.fillRect(q[0]-r,q[1]-r,2*r,2*r);};
const flame=(c,q)=>{c.fillStyle='#ffd25a';c.beginPath();c.moveTo(q[0],q[1]-9);c.quadraticCurveTo(q[0]+3.4,q[1]-3,q[0],q[1]);c.quadraticCurveTo(q[0]-3.4,q[1]-3,q[0],q[1]-9);c.fill();c.fillStyle='#fff4c0';c.beginPath();c.ellipse(q[0],q[1]-2.6,1.2,2.2,0,0,7);c.fill();};
// a little gold dragon emblem (serpentine body, head, horns, spines) in a face's unit square; sx/sy undo the face's aspect
function dragon(c,x,y,sx,sy,col=GOLD,flip){c.save();c.translate(x,y);c.scale(flip?-sx:sx,sy);c.lineCap='round';c.lineJoin='round';
 const body=()=>{c.beginPath();c.moveTo(-.46,.34);c.bezierCurveTo(-.36,-.06,-.1,.42,.06,.06);c.bezierCurveTo(.18,-.2,.34,-.04,.4,-.26);};
 c.strokeStyle='#5a3a10';c.lineWidth=.13;body();c.stroke();c.strokeStyle=col;c.lineWidth=.095;body();c.stroke();c.strokeStyle=tone(col,.5);c.lineWidth=.025;body();c.stroke();
 c.fillStyle=col;for(let i=1;i<8;i++){const t=i/8,bx=-.46+t*.86,by=.34-t*.6+Math.sin(t*9)*.12;c.beginPath();c.moveTo(bx-.025,by-.03);c.lineTo(bx+.01,by-.11);c.lineTo(bx+.04,by-.02);c.fill();}
 c.beginPath();c.ellipse(.42,-.3,.085,.06,-.5,0,7);c.fill();c.strokeStyle='#5a3a10';c.lineWidth=.016;c.stroke();
 c.strokeStyle=col;c.lineWidth=.028;c.beginPath();c.moveTo(.4,-.35);c.quadraticCurveTo(.38,-.46,.31,-.5);c.moveTo(.46,-.35);c.quadraticCurveTo(.5,-.47,.45,-.54);c.stroke();
 c.beginPath();c.moveTo(.49,-.27);c.quadraticCurveTo(.6,-.2,.62,-.1);c.stroke();// whisker
 [[-.2,.24],[.12,.02]].forEach(([a,b])=>{c.beginPath();c.moveTo(a,b);c.lineTo(a-.04,b+.1);c.lineTo(a+.03,b+.1);c.stroke();});
 c.fillStyle='#c8323c';c.beginPath();c.arc(.44,-.31,.015,0,7);c.fill();c.restore();}
const tuft=(c,col)=>{c.fillStyle=rgba(col,.55);for(let i=0;i<5;i++)for(let j=0;j<2;j++){c.beginPath();c.ellipse(.12+i*.19+(j%2)*.09,.3+j*.35,.018,.04,0,0,7);c.fill();}};
const books=(c,y0,h,seed,x0=.06,x1=.94)=>{const R=rnd(seed);let x=x0;while(x<x1-.03){const w=.03+R()*.035,bh=h*(.6+R()*.38);c.fillStyle=['#c8323c','#e8b44e','#4a8ad8','#4aa85a','#f3e6cc','#8a5ad0','#3a3442'][Math.floor(R()*7)];c.fillRect(x,y0+h-bh,w,bh);c.fillStyle='rgba(255,255,255,.28)';c.fillRect(x,y0+h-bh,w*.3,bh);x+=w+.008;}};
const legs4=(p,x0,y0,x1,y1,z,r,col)=>[[x0,y0],[x1,y0],[x0,y1],[x1,y1]].forEach(([x,y])=>p.cyl(x,y,0,z,r,col));
const chair=(frame,seat,o={})=>p=>{legs4(p,.24,.24,.76,.76,o.sz||30,.035,frame);p.box(.18,.18,o.sz||30,.82,.82,(o.sz||30)+7,seat,{soft:5,gloss:.35});
 const bz=o.bh||78;p.box(.18,.14,(o.sz||30)+4,.82,.26,bz,frame,{soft:4,trim:o.trim}).on('F',c=>{if(o.slats){c.fillStyle=rgba('#000000',.18);[.3,.5,.7].forEach(x=>c.fillRect(x-.03,.15,.06,.7));}else rr(c,.14,.12,.72,.55,.12,seat);});
 if(o.knob)p.ball(.5,.2,bz,5,GOLD,{dd:.1});};
const DEF2={
// ---------------- bedroom ----------------
 nightstand:{fp:[1,1],h:96,paint:p=>{p.box(.14,.2,0,.86,.9,40,HONEY,{soft:3,trim:GOLD}).on('F',c=>{rr(c,.08,.1,.84,.36,.05,tone(HONEY,.14));rr(c,.08,.54,.84,.36,.05,tone(HONEY,.14));knob(c,.5,.28);knob(c,.5,.72);});
  p.cyl(.5,.5,40,44,.12,CREAM);p.cyl(.5,.5,44,62,.025,GOLD);p.cyl(.5,.5,60,82,.17,'#fff1c8',{top:'#fff8e0'});p.box(.2,.62,40,.38,.82,44,'#4a8ad8',{order:1});p.fn(.5,.5,70,glow(42),{dd:.3,post:1});}},
 wardrobe_honey:{fp:[2,1],h:156,paint:p=>{p.box(.04,.22,0,1.96,1,150,HONEY,{soft:3,trim:GOLD}).on('F',c=>{rr(c,.04,.04,.44,.9,.03,tone(HONEY,.12));const g=c.createLinearGradient(.52,0,.96,1);g.addColorStop(0,'#e4f4ff');g.addColorStop(1,'#9cc8e8');rr(c,.52,.04,.44,.9,.03,g);
   c.fillStyle='rgba(255,255,255,.55)';c.fillRect(.6,.08,.04,.8);c.fillRect(.68,.08,.015,.8);rr(c,.42,.4,.025,.16,.01,GOLD);rr(c,.555,.4,.025,.16,.01,GOLD);});
  p.box(0,.18,150,2,1.04,156,tone2(HONEY,-.2),{soft:2});p.box(.1,.26,0,1.9,.96,6,tone2(HONEY,-.35));}},
 dresser:{fp:[2,1],h:100,paint:p=>{p.box(.05,.28,4,1.95,.95,58,CREAM,{soft:3,trim:GOLD}).on('F',c=>{for(let r=0;r<3;r++)for(let k=0;k<2;k++){rr(c,.04+k*.48,.06+r*.31,.44,.26,.04,tone(CREAM,-.06));knob(c,.26+k*.48,.19+r*.31);}});
  legs4(p,.12,.36,1.88,.88,4,.03,HONEY);p.box(1.25,.42,58,1.75,.52,100,GOLD,{soft:2}).on('F',c=>{const g=c.createLinearGradient(0,0,1,1);g.addColorStop(0,'#e4f4ff');g.addColorStop(1,'#8cbce4');rr(c,.08,.06,.84,.88,.3,g);});
  p.cyl(.4,.62,58,74,.07,'#4a8ad8');[[.36,.6,80,C.pink],[.44,.66,78,'#ffd84a'],[.4,.56,84,C.red]].forEach(([x,y,z,col])=>p.ball(x,y,z,4,col,{dd:.2}));p.box(.7,.5,58,.95,.56,76,C.dark,{order:1}).on('F',c=>rr(c,.12,.1,.76,.8,.04,'#a8d0ee'));}},
 bed_single:{fp:[1,2],h:82,paint:p=>{p.box(0,0,0,1,2,14,'#8a6a9a',{soft:3,trim:GOLD});p.box(0,0,0,1,.14,82,'#8a6a9a',{soft:5,trim:GOLD}).on('F',c=>{rr(c,.1,.14,.8,.6,.1,tone('#8a6a9a',.16));c.fillStyle=GOLD;c.beginPath();c.arc(.5,.42,.07,0,7);c.fill();});
  p.box(.06,.14,14,.94,1.96,30,WHITE,{soft:6,gloss:.35});p.box(.03,.9,16,.97,1.99,33,'#6aa8e8',{soft:6,gloss:.3,order:1}).on('T',c=>{c.fillStyle='rgba(255,255,255,.7)';for(let i=0;i<4;i++)for(let j=0;j<6;j++){c.beginPath();c.arc(.15+i*.23,.12+j*.16,.03,0,7);c.fill();}});
  p.box(.14,.2,30,.86,.6,44,WHITE,{soft:7,gloss:.5,order:2});}},
 mirror_floor:{fp:[1,1],h:150,paint:p=>{p.box(.28,.42,0,.72,.62,8,HONEY,{soft:2});p.box(.2,.46,6,.8,.54,150,GOLD,{soft:2}).on('F',c=>{const g=c.createLinearGradient(0,0,1,1);g.addColorStop(0,'#eef8ff');g.addColorStop(.6,'#a8d0ee');g.addColorStop(1,'#7aa8d8');c.fillStyle=g;c.beginPath();c.ellipse(.5,.5,.4,.46,0,0,7);c.fill();
   c.fillStyle='rgba(255,255,255,.6)';c.beginPath();c.ellipse(.36,.34,.05,.22,.3,0,7);c.fill();});}},
// ---------------- living ----------------
 sofa_teal:{fp:[2,1],h:60,paint:sofa(TEAL,GOLD)},sofa_honey:{fp:[2,1],h:60,paint:sofa('#f0a640','#fff7e8')},armchair_teal:{fp:[1,1],h:60,paint:sofa(TEAL,GOLD)},
 beanbag:{fp:[1,1],h:52,paint:p=>{p.ball(.5,.3,6,18,tone2(C.pink,-.06),{dd:-.4});p.cyl(.5,.58,0,18,.36,C.pink,{top:tone(C.pink,.25)});p.fn(.5,.58,18,(c,q)=>{c.strokeStyle='rgba(120,40,70,.35)';c.lineWidth=1.2;c.beginPath();c.ellipse(q[0],q[1],12,5,0,0,Math.PI);c.stroke();},{dd:.1});}},
 table_side:{fp:[1,1],h:56,paint:p=>{p.cyl(.5,.5,0,4,.2,C.dark);p.cyl(.5,.5,4,38,.03,GOLD);p.cyl(.5,.5,38,43,.3,HONEY2,{top:'#f0c48a'});p.cyl(.4,.42,43,52,.05,C.red,{inner:'#5a3020'});p.box(.48,.42,43,.78,.66,46,'#4a8ad8',{order:1});}},
 rug_round:{fp:[2,2],h:2,flat:1,paint:p=>p.flat(0,0,2,2,0,c=>{c.fillStyle=CREAM;c.beginPath();c.ellipse(.5,.5,.48,.48,0,0,7);c.fill();c.strokeStyle='#e8a04a';c.lineWidth=.03;c.beginPath();c.ellipse(.5,.5,.4,.4,0,0,7);c.stroke();
   c.strokeStyle=TEAL;c.lineWidth=.02;c.beginPath();c.ellipse(.5,.5,.3,.3,0,0,7);c.stroke();c.fillStyle=rgba(TEAL,.35);c.beginPath();c.ellipse(.5,.5,.16,.16,0,0,7);c.fill();c.strokeStyle='rgba(60,40,30,.35)';c.lineWidth=.012;c.beginPath();c.ellipse(.5,.5,.48,.48,0,0,7);c.stroke();},{under:1})},
 rug_stripe:{fp:[3,2],h:2,flat:1,paint:p=>p.flat(0,0,3,2,0,c=>{rr(c,.02,.03,.96,.94,.04,CREAM);['#6aa8e8',TEAL,'#6aa8e8'].forEach((col,i)=>{c.fillStyle=col;c.fillRect(.02,.2+i*.25,.96,.1);});c.strokeStyle='rgba(60,40,30,.35)';c.lineWidth=.01;c.strokeRect(.02,.03,.96,.94);
   c.strokeStyle='#e8a04a';c.lineWidth=.008;for(let i=0;i<24;i++){c.beginPath();c.moveTo(.02+i*.04,.03);c.lineTo(.02+i*.04,0);c.moveTo(.02+i*.04,.97);c.lineTo(.02+i*.04,1);c.stroke();}},{under:1})},
 tv_modern:{fp:[2,1],h:104,paint:p=>{p.box(.04,.36,0,1.96,.96,24,WHITE,{soft:3}).on('F',c=>{rr(c,.03,.18,.3,.64,.04,HONEY2);rr(c,.35,.18,.3,.64,.04,tone(WHITE,-.06));rr(c,.67,.18,.3,.64,.04,HONEY2);});
  p.box(.9,.56,24,1.1,.66,32,C.black);p.box(.12,.56,30,1.88,.62,100,'#24202c',{soft:3,order:1}).on('F',c=>{const g=c.createLinearGradient(0,0,0,1);g.addColorStop(0,'#7ac8ff');g.addColorStop(.6,'#bfe8ff');g.addColorStop(.61,'#7ad07a');g.addColorStop(1,'#4aa85a');rr(c,.03,.06,.94,.88,.03,g);
   c.fillStyle='#fff';c.beginPath();c.arc(.7,.28,.06,0,7);c.fill();c.fillStyle='#ffd84a';c.beginPath();c.arc(.2,.24,.07,0,7);c.fill();c.fillStyle='rgba(255,255,255,.3)';c.beginPath();c.moveTo(.06,.1);c.lineTo(.35,.1);c.lineTo(.15,.9);c.lineTo(.06,.9);c.fill();});
  p.cyl(.3,.7,24,34,.06,C.leaf);p.leaves(.3,.7,34,22,6,[C.leaf,C.leaf2],4,{order:2});}},
 lamp_modern:{fp:[1,1],h:150,paint:p=>{p.cyl(.25,.25,0,6,.17,C.dark);p.cyl(.25,.25,6,136,.025,C.steel);
  p.fn(.25,.25,134,(c,q,X)=>{const b=X.P3(.66,.66,132);c.strokeStyle='#35202a';c.lineWidth=4.2;c.beginPath();c.moveTo(q[0],q[1]);c.quadraticCurveTo((q[0]+b[0])/2,q[1]-22,b[0],b[1]);c.stroke();c.strokeStyle=C.steel;c.lineWidth=2.2;c.stroke();},{dd:.2});
  p.cyl(.66,.66,110,130,.17,'#fff3d0',{top:'#ffffff',order:2});p.fn(.66,.66,104,glow(52,.45),{dd:.5,post:1});}},
 shelf_low:{fp:[2,1],h:84,paint:p=>{p.box(.04,.3,0,1.96,1,58,HONEY,{soft:3,trim:GOLD}).on('F',c=>{for(let r=0;r<2;r++){rr(c,.03,.07+r*.46,.94,.4,.03,'rgba(40,24,20,.55)');}books(c,.12,.32,7,.06,.5);books(c,.58,.32,9,.5,.94);
   c.fillStyle='#4aa85a';c.beginPath();c.arc(.72,.38,.08,0,7);c.fill();c.fillStyle='#e8a04a';c.fillRect(.66,.38,.12,.08);c.fillStyle=TEAL;c.fillRect(.14,.66,.16,.3);});
  p.cyl(1.55,.65,58,70,.08,WHITE);p.leaves(1.55,.65,70,26,7,[C.leaf,C.leaf2],11,{order:2});p.box(.3,.55,58,.64,.62,80,C.dark,{order:1}).on('F',c=>{rr(c,.1,.1,.8,.8,.04,'#ffd8a0');c.fillStyle='#e85a4a';c.beginPath();c.arc(.5,.5,.18,0,7);c.fill();});}},
 aquarium:{fp:[2,1],h:108,live:1,paint:p=>{p.box(.04,.26,0,1.96,.96,40,C.dark,{soft:3,trim:GOLD}).on('F',c=>{rr(c,.04,.15,.44,.7,.04,tone(C.dark,.12));rr(c,.52,.15,.44,.7,.04,tone(C.dark,.12));knob(c,.44,.5);knob(c,.56,.5);});
  p.box(.08,.3,40,1.92,.92,100,'#6ac8ee',{alpha:.62,gloss:.4,lit:.25,tf:.3}).on('F',c=>{const g=c.createLinearGradient(0,0,0,1);g.addColorStop(0,'rgba(140,220,255,.7)');g.addColorStop(1,'rgba(40,120,200,.9)');c.fillStyle=g;c.fillRect(0,.08,1,.92);
   c.fillStyle='#e8d0a0';c.beginPath();c.moveTo(0,1);c.quadraticCurveTo(.3,.84,.6,.92);c.quadraticCurveTo(.8,.86,1,.9);c.lineTo(1,1);c.fill();c.fillStyle='#3f9a4a';[[.12,.5],[.2,.6],[.82,.45],[.9,.55]].forEach(([x,y])=>{c.beginPath();c.moveTo(x,.95);c.quadraticCurveTo(x-.06,y+.2,x,y);c.quadraticCurveTo(x+.06,y+.2,x+.02,.95);c.fill();});
   [[.4,.4,'#ff8a3a'],[.6,.6,'#ffd84a'],[.3,.7,'#e2525a']].forEach(([x,y,col])=>{c.fillStyle=col;c.beginPath();c.ellipse(x,y,.05,.07,0,0,7);c.fill();c.beginPath();c.moveTo(x+.04,y);c.lineTo(x+.09,y-.06);c.lineTo(x+.09,y+.06);c.fill();c.fillStyle='#222';c.beginPath();c.arc(x-.02,y-.015,.008,0,7);c.fill();});
   c.fillStyle='rgba(255,255,255,.4)';c.fillRect(.05,.12,.03,.7);});p.box(.06,.28,100,1.94,.94,106,C.dark,{soft:2,order:1});}},
 arcade:{fp:[1,1],h:140,paint:p=>{p.box(.14,.2,0,.86,.86,136,'#5a3fb0',{soft:3,trim:'#ffd84a'}).on('F',c=>{c.fillStyle='#2a1a50';rr(c,.08,.04,.84,.12,.03,'#ff5aa8');c.fillStyle='#fff';c.font='bold .09px sans-serif';
   rr(c,.12,.2,.76,.34,.04,'#14102a');const g=c.createLinearGradient(0,.22,0,.52);g.addColorStop(0,'#48eaff');g.addColorStop(1,'#c15aff');rr(c,.15,.23,.7,.28,.03,g);c.fillStyle='#ffd84a';c.fillRect(.3,.4,.08,.06);c.fillStyle='#fff';c.fillRect(.6,.3,.06,.06);
   rr(c,.08,.58,.84,.12,.03,'#3a2a70');c.fillStyle='#e2525a';c.beginPath();c.arc(.3,.64,.04,0,7);c.fill();c.fillStyle='#48eaff';c.beginPath();c.arc(.6,.64,.03,0,7);c.fill();c.fillStyle='#ffd84a';c.beginPath();c.arc(.72,.64,.03,0,7);c.fill();rr(c,.42,.8,.16,.08,.02,'#ffd84a');});
  p.fn(.5,.86,100,glow(40,.35,'120,200,255'),{dd:.5,post:1});}},
 fireplace:{fp:[2,1],h:110,live:1,paint:p=>{p.box(.04,.3,0,1.96,1,96,'#e8e0d4',{soft:3,trim:GOLD}).on('F',c=>{rr(c,.22,.3,.56,.62,.06,'#2a2026');const g=c.createRadialGradient(.5,.9,.02,.5,.8,.3);g.addColorStop(0,'#fff0a0');g.addColorStop(.4,'#ff9a3a');g.addColorStop(1,'rgba(200,40,20,0)');c.fillStyle=g;c.fillRect(.24,.4,.52,.5);
   c.fillStyle=WAL;c.fillRect(.3,.86,.4,.05);c.strokeStyle='#c8b8a4';c.lineWidth=.01;for(let i=0;i<5;i++){c.beginPath();c.moveTo(0,.1+i*.2);c.lineTo(.2,.1+i*.2);c.moveTo(.8,.1+i*.2);c.lineTo(1,.1+i*.2);c.stroke();}});
  p.box(-.02,.26,96,2.02,1.04,102,WAL,{soft:2});p.cyl(.4,.6,102,118,.06,GOLD);p.fn(.4,.6,118,flame,{dd:.3,post:1});p.cyl(1.6,.6,102,114,.06,GOLD);p.fn(1.6,.6,114,flame,{dd:.3,post:1});p.fn(1,.95,40,glow(60,.4,'255,150,60'),{dd:.6,post:1});}},
// ---------------- kitchen & dining ----------------
 stove:{fp:[1,1],h:76,paint:p=>{p.box(.06,.14,0,.94,.94,56,'#eef0f6',{soft:3}).on('F',c=>{rr(c,.12,.32,.76,.56,.06,'#2a2430');const g=c.createLinearGradient(0,.4,0,.85);g.addColorStop(0,'#5a3a30');g.addColorStop(1,'#ff9a4a');rr(c,.18,.4,.64,.4,.04,g);rr(c,.16,.24,.68,.04,.02,C.steel);
   [.22,.4,.6,.78].forEach(x=>{c.fillStyle='#3a3442';c.beginPath();c.arc(x,.12,.04,0,7);c.fill();});});
  p.box(.04,.12,56,.96,.96,60,'#2a2430',{soft:1,gloss:.5}).on('T',c=>{[[.28,.3],[.72,.3],[.28,.72],[.72,.72]].forEach(([x,y])=>{c.strokeStyle='#e2525a';c.lineWidth=.035;c.beginPath();c.ellipse(x,y,.14,.14,0,0,7);c.stroke();c.strokeStyle='#5a5466';c.lineWidth=.02;c.beginPath();c.ellipse(x,y,.07,.07,0,0,7);c.stroke();});});
  p.cyl(.3,.32,60,72,.15,C.red,{inner:'#f3e6cc',order:1});p.box(.62,.24,72,.82,.3,74,'#3a3442',{order:1});}},
 counter_white:{fp:[2,1],h:66,paint:p=>{p.box(0,.12,0,2,1,42,WHITE,{soft:3}).on('F',c=>{for(let i=0;i<3;i++){rr(c,.03+i*.325,.12,.3,.78,.04,tone(WHITE,-.05));rr(c,.06+i*.325,.18,.24,.025,.01,HONEY);}});
  p.box(-.02,.1,42,2.02,1.02,48,HONEY2,{soft:2,gloss:.45}).on('T',c=>{c.beginPath();c.ellipse(.28,.5,.14,.28,0,0,7);c.fillStyle='#9aa8b8';c.fill();c.beginPath();c.ellipse(.28,.52,.1,.2,0,0,7);c.fillStyle='#c8d8e8';c.fill();rr(c,.6,.25,.28,.5,.04,'#e8c89a');
   [[.66,.4,'#e2525a'],[.76,.55,'#4aa85a'],[.82,.38,'#ffd84a']].forEach(([x,y,col])=>{c.fillStyle=col;c.beginPath();c.ellipse(x,y,.035,.06,0,0,7);c.fill();});});
  p.cyl(.28,.24,48,64,.022,C.steel,{order:1});p.box(.25,.22,60,.32,.42,64,C.steel,{order:1});p.cyl(1.55,.35,48,62,.06,C.cream,{inner:'#5a3020',order:1});}},
 island:{fp:[2,1],h:66,paint:p=>{p.box(.04,.12,0,1.96,.88,44,TEAL,{soft:3}).on('F',c=>{for(let i=0;i<2;i++){rr(c,.04+i*.48,.12,.44,.76,.04,tone(TEAL,.1));rr(c,.18+i*.48,.2,.16,.03,.01,GOLD);}});
  p.box(-.04,.06,44,2.04,.94,50,'#f2ece4',{soft:2,gloss:.5,trim:GOLD});p.cyl(1.4,.5,50,58,.2,WHITE,{inner:'#e8d8c0',order:1});[[1.32,.44,'#e2525a'],[1.46,.52,'#ffd84a'],[1.4,.4,'#4aa85a']].forEach(([x,y,col])=>p.ball(x,y,56,6,col,{dd:.2}));
  p.box(.3,.35,50,.8,.65,53,'#e8c89a',{order:1});}},
 table_wood:{fp:[2,1],h:76,paint:p=>{legs4(p,.2,.2,1.8,.8,40,.05,WAL);p.box(.04,.08,38,1.96,.92,46,HONEY,{soft:3,gloss:.4}).on('T',c=>{c.fillStyle=rgba(TEAL,.85);c.fillRect(.4,0,.2,1);c.strokeStyle='rgba(120,70,30,.3)';c.lineWidth=.01;for(let i=1;i<5;i++){c.beginPath();c.moveTo(0,i/5);c.lineTo(1,i/5);c.stroke();}});
  p.cyl(.5,.5,46,48,.14,WHITE);p.cyl(1.5,.5,46,48,.14,WHITE);p.cyl(1,.5,46,60,.06,'#6aa8e8');[[.96,.46,66,'#ffd84a'],[1.04,.52,64,C.pink],[1,.5,70,WHITE]].forEach(([x,y,z,col])=>p.ball(x,y,z,4.5,col,{dd:.2}));}},
 chair_dining:{fp:[1,1],h:80,paint:chair(WAL,CREAM,{slats:1,bh:80})},
// ---------------- study ----------------
 desk_modern:{fp:[2,2],h:104,paint:p=>{legs4(p,.08,.1,.92,.8,44,.03,WAL);p.box(1.42,.1,0,1.96,.82,44,HONEY,{soft:3}).on('F',c=>{[0,1,2].forEach(i=>{rr(c,.08,.06+i*.31,.84,.26,.04,tone(HONEY,.12));knob(c,.5,.19+i*.31);});});
  p.box(0,.04,44,2,.86,50,WHITE,{soft:2,gloss:.35});p.box(.9,.24,50,1.1,.34,60,C.dark);p.box(.52,.22,58,1.48,.3,104,'#24202c',{soft:2}).on('F',c=>{const g=c.createLinearGradient(0,0,1,1);g.addColorStop(0,'#3a5ab8');g.addColorStop(1,'#7a5ad0');rr(c,.04,.06,.92,.86,.03,g);
   c.fillStyle='rgba(255,255,255,.75)';for(let i=0;i<6;i++)c.fillRect(.1,.16+i*.12,.25+((i*37)%5)*.08,.04);c.fillStyle='#ffd84a';c.fillRect(.7,.2,.18,.3);});
  p.box(.66,.44,50,1.34,.62,52,'#d8dee6',{order:1});p.cyl(1.7,.4,50,62,.06,C.red,{inner:'#5a3020',order:1});p.box(.15,.3,50,.45,.6,58,'#ffd84a',{order:1});
  p.cyl(1,1.42,0,4,.24,C.dark);p.cyl(1,1.42,4,26,.03,C.steel);p.box(.72,1.16,26,1.28,1.68,33,C.navy,{soft:5,gloss:.3,order:2});p.box(.72,1.6,30,1.28,1.74,76,C.navy,{soft:5,order:3});}},
 chair_office:{fp:[1,1],h:78,paint:p=>{p.cyl(.5,.5,0,4,.26,C.dark);p.cyl(.5,.5,4,26,.03,C.steel);p.box(.2,.2,26,.8,.8,33,C.navy,{soft:5,gloss:.3});p.box(.2,.12,30,.8,.26,78,C.navy,{soft:5});p.box(.16,.3,33,.24,.72,46,C.dark,{soft:2});p.box(.76,.3,33,.84,.72,46,C.dark,{soft:2});}},
 cabinet_file:{fp:[1,1],h:100,paint:p=>{p.box(.14,.18,0,.86,.9,88,'#8a96a6',{soft:3}).on('F',c=>{[0,1,2].forEach(i=>{rr(c,.08,.04+i*.32,.84,.28,.03,tone('#8a96a6',.12));rr(c,.38,.14+i*.32,.24,.04,.01,'#d8dee6');rr(c,.4,.08+i*.32,.2,.04,.01,'#fff');});});
  p.cyl(.5,.5,88,96,.1,C.leaf);p.leaves(.5,.5,94,18,6,[C.leaf,C.leaf2],17,{order:2});}},
 caseboard:{fp:[1,1],h:150,paint:p=>{p.cyl(.3,.7,0,120,.025,WAL);p.cyl(.7,.7,0,120,.025,WAL);p.cyl(.5,.3,0,118,.025,WAL);
  p.box(.08,.5,50,.92,.56,148,'#b8834e',{soft:2,trim:WAL}).on('F',c=>{rr(c,.05,.05,.9,.9,.02,'#d8a868');const ph=[[.1,.1,'#f4f2f6'],[.55,.08,'#ffe8a8'],[.3,.45,'#f4f2f6'],[.65,.5,'#cfe8ff'],[.12,.68,'#ffe8a8']];
   ph.forEach(([x,y,col])=>{c.fillStyle=col;c.fillRect(x,y,.24,.26);c.fillStyle='rgba(60,40,40,.5)';c.fillRect(x+.04,y+.05,.16,.1);c.fillStyle='#e2525a';c.beginPath();c.arc(x+.12,y+.02,.025,0,7);c.fill();});
   c.strokeStyle='#d02030';c.lineWidth=.018;c.beginPath();c.moveTo(.22,.12);c.lineTo(.42,.47);c.lineTo(.67,.1);c.moveTo(.42,.47);c.lineTo(.77,.52);c.moveTo(.42,.47);c.lineTo(.24,.7);c.stroke();});}},
 globe:{fp:[1,1],h:96,paint:p=>{p.cyl(.5,.5,0,6,.2,WAL);p.cyl(.5,.5,6,40,.04,WAL);p.ball(.5,.5,40,22,'#4a8ad8',{band:GOLD});p.fn(.5,.5,62,(c,q)=>{c.fillStyle='#5ab85a';c.beginPath();c.ellipse(q[0]-6,q[1]-6,7,9,.4,0,7);c.fill();c.beginPath();c.ellipse(q[0]+8,q[1]+4,5,7,-.3,0,7);c.fill();},{dd:.3});}},
// ---------------- bath ----------------
 washer:{fp:[1,1],h:78,paint:p=>{p.box(.1,.14,0,.9,.92,76,WHITE,{soft:4,gloss:.3}).on('F',c=>{rr(c,.08,.06,.84,.14,.03,tone(WHITE,-.06));c.fillStyle='#5ad07a';c.fillRect(.7,.1,.08,.05);c.fillStyle='#8a96a6';c.beginPath();c.arc(.25,.13,.03,0,7);c.fill();
   c.fillStyle='#b8c2cc';c.beginPath();c.arc(.5,.58,.3,0,7);c.fill();const g=c.createRadialGradient(.45,.52,.02,.5,.58,.24);g.addColorStop(0,'#cfeaff');g.addColorStop(1,'#4a8ad8');c.fillStyle=g;c.beginPath();c.arc(.5,.58,.23,0,7);c.fill();c.fillStyle='rgba(255,255,255,.55)';c.beginPath();c.ellipse(.42,.5,.05,.1,.5,0,7);c.fill();});}},
 towel_rack:{fp:[1,1],h:108,paint:p=>{p.box(.2,.4,0,.8,.6,6,C.steel,{soft:2});p.cyl(.24,.5,6,104,.025,C.steel);p.cyl(.76,.5,6,104,.025,C.steel);
  [[100,'#6aa8e8'],[68,WHITE],[36,C.pink]].forEach(([z,col],i)=>{p.box(.22,.46,z,.78,.54,z+3,C.steel,{order:i});p.box(.28,.45,z-34,.72,.55,z+2,col,{soft:4,gloss:.25,order:i+.5}).on('F',c=>{c.fillStyle='rgba(255,255,255,.5)';c.fillRect(0,.82,1,.06);});});}},
 laundry_basket:{fp:[1,1],h:56,paint:p=>{p.cyl(.5,.5,0,40,.24,'#d8b880',{inner:'#c09a60'});p.cyl(.5,.5,30,34,.245,'#c09a60',{open:1});p.ball(.44,.5,36,9,'#6aa8e8');p.ball(.58,.46,38,7,C.pink,{dd:.1});}},
// ---------------- decor ----------------
 monstera:{fp:[1,1],h:118,paint:plant('#f2ece4',['#2f8a42','#4aa852','#62c060'],8,76,31)},
 cactus:{fp:[1,1],h:86,paint:p=>{p.cyl(.5,.5,0,22,.2,'#d0703a',{inner:'#6a4020'});p.cyl(.5,.5,20,70,.1,'#4aa85a',{top:'#62c06a'});p.cyl(.34,.5,40,58,.05,'#4aa85a',{top:'#62c06a'});p.cyl(.66,.5,46,62,.05,'#4aa85a',{top:'#62c06a'});p.ball(.5,.5,70,5,C.pink,{dd:.2});}},
 vase_flowers:{fp:[1,1],h:116,paint:p=>{p.box(.24,.24,0,.76,.76,60,WHITE,{soft:3,trim:GOLD});p.cyl(.5,.5,60,80,.1,'#4a8ad8',{inner:'#2a4a7a'});p.leaves(.5,.5,78,30,7,[C.leaf,C.leaf2],23,{order:1});
  [[.42,.46,100,C.pink],[.56,.5,104,'#ffd84a'],[.5,.42,108,C.red],[.6,.4,96,WHITE],[.4,.56,96,'#c88af0']].forEach(([x,y,z,col])=>p.ball(x,y,z,5,col,{dd:.3}));}},
 clock_tall:{fp:[1,1],h:168,paint:p=>{p.box(.2,.3,0,.8,.8,150,WAL,{soft:3,trim:GOLD}).on('F',c=>{c.fillStyle=CREAM;c.beginPath();c.arc(.5,.17,.3,0,7);c.fill();c.strokeStyle=GOLD;c.lineWidth=.04;c.stroke();c.strokeStyle='#35202a';c.lineWidth=.03;c.beginPath();c.moveTo(.5,.17);c.lineTo(.5,.07);c.moveTo(.5,.17);c.lineTo(.62,.2);c.stroke();
   rr(c,.25,.42,.5,.5,.06,'#3a2a26');c.strokeStyle=GOLD;c.lineWidth=.02;c.beginPath();c.moveTo(.5,.44);c.lineTo(.5,.78);c.stroke();c.fillStyle=GOLD;c.beginPath();c.arc(.5,.8,.07,0,7);c.fill();});p.box(.16,.26,150,.84,.84,162,tone2(WAL,-.15),{soft:3});p.ball(.5,.55,162,5,GOLD);}},
// ---------------- balcony ----------------
 sunbed:{fp:[1,2],h:56,paint:p=>{legs4(p,.12,.12,.88,1.88,14,.03,WHITE);p.box(.08,.5,14,.92,1.96,20,WHITE,{soft:3});p.box(.12,.56,20,.88,1.94,27,TEAL,{soft:5,gloss:.3}).on('T',c=>{c.fillStyle='rgba(255,255,255,.75)';for(let i=0;i<4;i++)c.fillRect(.1+i*.24,0,.1,1);});
  p.box(.08,.06,14,.92,.56,34,WHITE,{soft:3});p.box(.12,.1,32,.88,.54,48,TEAL,{soft:6,gloss:.3}).on('T',c=>{c.fillStyle='rgba(255,255,255,.75)';for(let i=0;i<4;i++)c.fillRect(.1+i*.24,0,.1,1);});p.box(.25,.14,46,.75,.4,54,WHITE,{soft:6,gloss:.4,order:1});}},
 table_patio:{fp:[1,1],h:66,paint:p=>{p.cyl(.5,.5,0,4,.18,WHITE);p.cyl(.5,.5,4,40,.03,WHITE);p.cyl(.5,.5,40,44,.34,WHITE,{top:'#eef4f8'});p.cyl(.42,.46,44,58,.05,'#ffe08a',{alpha:.85,inner:'#ffb83a'});p.cyl(.6,.56,44,47,.1,C.red,{order:1});}},
 chair_patio:{fp:[1,1],h:74,paint:chair(WHITE,TEAL,{slats:1,bh:72})},
 parasol:{fp:[1,1],h:186,paint:p=>{p.cyl(.5,.5,0,8,.22,'#3a3442');p.cyl(.5,.5,8,166,.025,WHITE);
  p.fn(.5,.5,160,(c,q,X)=>{const R=62*X.KZ,top=[q[0],q[1]-26*X.KZ];c.save();for(let i=0;i<8;i++){const a0=i/8*Math.PI*2,a1=(i+1)/8*Math.PI*2;c.beginPath();c.moveTo(...top);c.lineTo(q[0]+Math.cos(a0)*R,q[1]+Math.sin(a0)*R*.5);c.lineTo(q[0]+Math.cos(a1)*R,q[1]+Math.sin(a1)*R*.5);c.closePath();
    const s=Math.sin((a0+a1)/2);c.fillStyle=i%2?tone('#e2525a',s*.18):tone('#fff4e8',s*.12-.04);c.fill();}c.strokeStyle='#35202a';c.lineWidth=2.4;c.beginPath();c.ellipse(q[0],q[1],R,R*.5,0,0,Math.PI);c.stroke();c.beginPath();c.moveTo(q[0]-R,q[1]);c.lineTo(top[0],top[1]);c.lineTo(q[0]+R,q[1]);c.stroke();
    c.fillStyle=GOLD;c.beginPath();c.arc(top[0],top[1]-2,3,0,7);c.fill();c.restore();},{dd:3,bb:[0,0,1,1,160,186]});}},
 bbq:{fp:[1,1],h:96,paint:p=>{legs4(p,.25,.25,.75,.75,30,.025,'#3a3442');p.ball(.5,.5,22,19,'#2a2430',{dd:.1});p.box(.12,.42,40,.3,.58,44,'#8a96a6');p.box(.7,.42,40,.88,.58,44,'#8a96a6');
  p.fn(.5,.5,62,(c,q)=>{c.strokeStyle='#e2525a';c.lineWidth=1.5;c.beginPath();c.ellipse(q[0],q[1]-4,14,5,0,0,7);c.stroke();[[-6,-5,'#a8502a'],[5,-3,'#ffb83a']].forEach(([dx,dy,col])=>{c.fillStyle=col;c.beginPath();c.ellipse(q[0]+dx,q[1]+dy,5,2.4,0,0,7);c.fill();});},{dd:.4,post:1});}},
 planter_box:{fp:[2,1],h:64,paint:p=>{p.box(.05,.2,0,1.95,.8,30,HONEY,{soft:3}).on('F',c=>{c.strokeStyle='rgba(90,50,20,.35)';c.lineWidth=.02;[.33,.66].forEach(y=>{c.beginPath();c.moveTo(0,y);c.lineTo(1,y);c.stroke();});});
  [.35,.85,1.35,1.75].forEach((x,i)=>p.leaves(x,.5,28,24,6,[C.leaf,C.leaf2],41+i,{order:1}));[[.3,.5,50,C.pink],[.8,.45,52,'#ffd84a'],[1.3,.5,50,C.red],[1.7,.55,48,'#c88af0'],[1.05,.5,46,WHITE]].forEach(([x,y,z,col])=>p.ball(x,y,z,5,col,{dd:.3}));}},
 lemon_tree:{fp:[1,1],h:140,paint:p=>{p.cyl(.5,.5,0,26,.2,'#d0703a',{inner:'#6a4020'});p.cyl(.5,.5,26,80,.03,WAL);p.ball(.5,.5,72,24,'#3f9a4a');p.ball(.36,.46,84,16,'#4aa852',{dd:.05});p.ball(.62,.56,90,15,'#5ab85a',{dd:.1});
  [[.4,.6,90],[.6,.4,104],[.5,.55,112],[.32,.4,98]].forEach(([x,y,z])=>p.ball(x,y,z,4.5,'#ffd84a',{dd:.4}));}},
// ---------------- LUXURY (Ophion's Roppongi dragon suite style) ----------------
 lux_bed:{fp:[2,2],h:140,paint:p=>{p.box(0,0,0,2,2,18,LAC,{soft:3,trim:GOLD});legs4(p,.08,.08,1.92,1.92,4,.06,GOLD);
  p.box(-.04,0,0,2.04,.18,138,LAC,{soft:5,trim:GOLD}).on('F',c=>{rr(c,.05,.06,.9,.66,.06,CRIM);tuft(c,'#2a0a10');c.strokeStyle=GOLD;c.lineWidth=.012;c.strokeRect(.07,.08,.86,.62);dragon(c,.5,.38,.5,.95);});
  p.ball(0,.09,138,7,GOLD);p.ball(2,.09,138,7,GOLD);
  p.box(.06,.16,18,1.94,1.96,34,'#2c2832',{soft:6,gloss:.35});p.box(.03,.82,20,1.97,1.99,38,CRIM,{soft:6,gloss:.3,order:1}).on('T',c=>{c.fillStyle=rgba(GOLD,.9);c.fillRect(0,.08,1,.08);c.fillRect(0,.86,1,.04);dragon(c,.5,.5,.32,.5,GOLD2);});
  p.box(.14,.2,34,.66,.6,50,'#1e1a22',{soft:7,gloss:.5,order:2});p.box(1.34,.2,34,1.86,.6,50,'#1e1a22',{soft:7,gloss:.5,order:2});p.box(.7,.24,34,1.3,.56,52,CRIM2,{soft:7,gloss:.5,order:3}).on('T',c=>{c.fillStyle=GOLD;c.beginPath();c.arc(.5,.5,.12,0,7);c.fill();});}},
 lux_sofa:{fp:[2,1],h:66,paint:p=>{[[.12,.14],[1.88,.14],[.12,.86],[1.88,.86]].forEach(([x,y])=>p.ball(x,y,0,4,GOLD));
  p.box(.04,.06,6,1.96,.98,20,'#1e1a22',{soft:3,trim:GOLD});p.box(.06,.04,18,1.94,.36,64,'#2a2530',{soft:6,gloss:.22}).on('F',c=>tuft(c,'#000000'));
  p.box(.22,.32,18,1.78,.96,31,'#2a2530',{soft:6,gloss:.32}).on('F',c=>{c.fillStyle='rgba(0,0,0,.35)';c.fillRect(.495,0,.01,1);});p.box(.0,.06,18,.24,.98,44,'#2a2530',{soft:7,trim:GOLD});p.box(1.76,.06,18,2,.98,44,'#2a2530',{soft:7,trim:GOLD});
  p.box(.3,.3,31,.66,.46,54,CRIM2,{soft:5,gloss:.4,order:1}).on('F',c=>{c.fillStyle=GOLD;c.beginPath();c.arc(.5,.5,.12,0,7);c.fill();});p.box(1.34,.3,31,1.7,.46,54,CRIM2,{soft:5,gloss:.4,order:1}).on('F',c=>{c.fillStyle=GOLD;c.beginPath();c.arc(.5,.5,.12,0,7);c.fill();});p.box(.8,.3,31,1.2,.42,50,GOLD,{soft:5,gloss:.5,order:1});}},
 lux_armchair:{fp:[1,1],h:96,paint:p=>{[[.15,.15],[.85,.15],[.15,.85],[.85,.85]].forEach(([x,y])=>p.ball(x,y,0,4,GOLD));p.box(.08,.08,6,.92,.94,22,'#5a1018',{soft:3,trim:GOLD});
  p.box(.1,.06,18,.9,.32,94,CRIM,{soft:7,gloss:.25,trim:GOLD}).on('F',c=>{tuft(c,'#2a0a10');});p.box(.22,.3,18,.78,.94,33,CRIM,{soft:6,gloss:.35});p.box(.02,.1,18,.22,.94,52,CRIM,{soft:7,trim:GOLD});p.box(.78,.1,18,.98,.94,52,CRIM,{soft:7,trim:GOLD});p.ball(.5,.2,94,5,GOLD,{dd:.1});}},
 lux_shelf:{fp:[2,1],h:180,paint:p=>{p.box(0,.24,0,2,1,170,LAC,{soft:3,trim:GOLD}).on('F',c=>{for(let s=0;s<5;s++){const y0=.04+s*.19;rr(c,.05,y0,.9,.16,.02,'rgba(10,6,12,.75)');c.fillStyle=rgba(GOLD,.9);c.fillRect(.05,y0+.155,.9,.012);
   if(s%2==0)books(c,y0+.02,.13,31+s,.08,.6);else{[.15,.32,.5].forEach((x,i)=>{c.fillStyle=i==1?GOLD:'#e8d8b0';c.beginPath();c.ellipse(x,y0+.1,.04,.05,0,0,7);c.fill();c.fillRect(x-.015,y0+.03,.03,.04);});}
   if(s==1||s==3)dragon(c,.78,y0+.08,.16,.13);else{c.fillStyle=GOLD;c.beginPath();c.moveTo(.74,y0+.15);c.lineTo(.8,y0+.03);c.lineTo(.86,y0+.15);c.fill();}
   const g=c.createRadialGradient(.5,y0+.02,.01,.5,y0+.06,.3);g.addColorStop(0,'rgba(255,214,140,.35)');g.addColorStop(1,'rgba(255,214,140,0)');c.fillStyle=g;c.fillRect(.05,y0,.9,.16);}});
  p.box(-.04,.2,170,2.04,1.04,178,GOLD,{soft:2,gloss:.6});p.ball(1,.6,178,6,GOLD);}},
 lux_chandelier:{fp:[1,1],h:250,flat:1,hang:1,paint:p=>{p.fn(.5,.5,250,(c,q,X)=>{const KZ=X.KZ,z=v=>q[1]+(250-v)*KZ;const cx=q[0];
   c.strokeStyle='#8a6a2a';c.lineWidth=1.6;c.beginPath();c.moveTo(cx,q[1]-40*KZ);c.lineTo(cx,z(196));c.stroke();
   const ring=(zz,r,w)=>{c.strokeStyle='#5a3a10';c.lineWidth=w+2;c.beginPath();c.ellipse(cx,z(zz),r,r*.42,0,0,7);c.stroke();c.strokeStyle=GOLD;c.lineWidth=w;c.stroke();c.strokeStyle=GOLD2;c.lineWidth=1;c.beginPath();c.ellipse(cx,z(zz)-1,r,r*.42,0,Math.PI*1.1,Math.PI*1.7);c.stroke();};
   ring(170,34,3.2);ring(186,18,2.6);c.fillStyle=GOLD;c.strokeStyle='#5a3a10';c.lineWidth=1.4;c.beginPath();c.ellipse(cx,z(160),7,10,0,0,7);c.fill();c.stroke();
   for(let i=0;i<8;i++){const a=i/8*Math.PI*2,x=cx+Math.cos(a)*34,y=z(170)+Math.sin(a)*34*.42;c.fillStyle='#fff6e6';c.fillRect(x-2,y-12,4,12);c.strokeStyle='#8a6a2a';c.lineWidth=.8;c.strokeRect(x-2,y-12,4,12);flame(c,[x,y-12]);}
   for(let i=0;i<10;i++){const a=i/10*Math.PI*2+.3,x=cx+Math.cos(a)*26,y=z(166)+Math.sin(a)*26*.42+8;c.fillStyle='rgba(220,240,255,.9)';c.beginPath();c.moveTo(x,y-5);c.lineTo(x+2.4,y);c.lineTo(x,y+5);c.lineTo(x-2.4,y);c.fill();}
   const g=c.createRadialGradient(cx,z(176),4,cx,z(176),90);g.addColorStop(0,'rgba(255,214,140,.45)');g.addColorStop(1,'rgba(255,214,140,0)');c.fillStyle=g;c.fillRect(cx-90,z(176)-90,180,180);},{post:1,bb:[0,0,1,1,150,250]});
  p.flat(0,0,1,1,0,c=>{const g=c.createRadialGradient(.5,.5,.02,.5,.5,.6);g.addColorStop(0,'rgba(255,214,140,.38)');g.addColorStop(1,'rgba(255,214,140,0)');c.fillStyle=g;c.fillRect(-.2,-.2,1.4,1.4);},{under:1});}},
 lux_rug:{fp:[3,2],h:2,flat:1,paint:p=>p.flat(0,0,3,2,0,c=>{rr(c,.02,.03,.96,.94,.04,'#1c181f');c.strokeStyle=GOLD;c.lineWidth=.02;c.strokeRect(.06,.1,.88,.8);c.lineWidth=.008;c.strokeRect(.09,.15,.82,.7);
   c.fillStyle=rgba(GOLD,.85);for(let i=0;i<12;i++){c.beginPath();c.arc(.1+i*.073,.12,.008,0,7);c.arc(.1+i*.073,.88,.008,0,7);c.fill();}dragon(c,.5,.52,.42,.62);},{under:1})},
 lux_statue:{fp:[1,1],h:170,paint:p=>{p.box(.14,.14,0,.86,.86,46,LAC,{soft:2,trim:GOLD}).on('F',c=>{c.strokeStyle=GOLD;c.lineWidth=.03;c.strokeRect(.12,.2,.76,.6);});p.box(.1,.1,46,.9,.9,52,GOLD,{soft:2,gloss:.6});
  p.fn(.5,.5,52,(c,q,X)=>{const k=X.KZ,P=(x,y)=>[q[0]+x*k,q[1]-y*k];c.save();c.lineJoin='round';c.lineCap='round';
   const g=c.createLinearGradient(q[0]-30*k,q[1]-110*k,q[0]+30*k,q[1]);g.addColorStop(0,'#fff0b0');g.addColorStop(.45,GOLD);g.addColorStop(1,'#a8701a');
   const path=()=>{c.beginPath();c.moveTo(...P(-22,0));c.bezierCurveTo(...P(-30,30),...P(18,30),...P(14,54));c.bezierCurveTo(...P(10,74),...P(-20,70),...P(-14,92));c.bezierCurveTo(...P(-10,104),...P(6,110),...P(14,104));};
   c.strokeStyle='#4a2a08';c.lineWidth=16*k;path();c.stroke();c.strokeStyle=g;c.lineWidth=12*k;path();c.stroke();c.strokeStyle='rgba(255,250,210,.7)';c.lineWidth=2.5*k;path();c.stroke();
   c.fillStyle=g;c.strokeStyle='#4a2a08';c.lineWidth=1.8*k;c.beginPath();c.ellipse(...P(18,104),11*k,8*k,-.3,0,7);c.fill();c.stroke();c.beginPath();c.moveTo(...P(22,98));c.lineTo(...P(34,96));c.lineTo(...P(26,104));c.closePath();c.fill();c.stroke();
   c.strokeStyle=g;c.lineWidth=3*k;c.beginPath();c.moveTo(...P(14,110));c.quadraticCurveTo(...P(10,122),...P(2,126));c.moveTo(...P(20,110));c.quadraticCurveTo(...P(22,124),...P(14,130));c.stroke();
   c.fillStyle='#c8323c';c.beginPath();c.arc(...P(21,106),1.8*k,0,7);c.fill();
   c.fillStyle=g;[[-24,40],[-8,62],[4,84]].forEach(([x,y])=>{c.beginPath();c.moveTo(...P(x,y));c.lineTo(...P(x-10,y+8));c.lineTo(...P(x-2,y+12));c.closePath();c.fill();c.strokeStyle='#4a2a08';c.lineWidth=1.2*k;c.stroke();});
   c.fillStyle='#ffd84a';c.beginPath();c.arc(...P(-4,22),5*k,0,7);c.fill();c.strokeStyle='#4a2a08';c.stroke();c.restore();},{dd:.2,bb:[.2,.2,.8,.8,52,170]});}},
 lux_table:{fp:[2,1],h:90,paint:p=>{[[.3,.5],[1.7,.5]].forEach(([x,y])=>{p.cyl(x,y,0,4,.16,GOLD);p.cyl(x,y,4,42,.06,GOLD);});p.box(.02,.06,42,1.98,.94,50,'#24202a',{soft:3,trim:GOLD,gloss:.6}).on('T',c=>{c.strokeStyle='rgba(255,255,255,.18)';c.lineWidth=.008;c.beginPath();c.moveTo(.1,.2);c.quadraticCurveTo(.3,.6,.5,.4);c.quadraticCurveTo(.7,.2,.9,.7);c.stroke();c.fillStyle=rgba(CRIM2,.95);c.fillRect(0,.38,1,.24);c.fillStyle=rgba(GOLD,.9);c.fillRect(0,.38,1,.02);c.fillRect(0,.6,1,.02);});
  [[.45,.3],[.45,.7],[1.55,.3],[1.55,.7]].forEach(([x,y])=>{p.cyl(x,y,50,52,.13,WHITE,{order:1});p.cyl(x,y,52,54,.07,'#e8c070',{order:1});});
  p.cyl(1,.5,50,58,.1,GOLD,{order:1});p.cyl(1,.5,58,80,.02,GOLD,{order:1});[[.86,.5],[1,.5],[1.14,.5]].forEach(([x,y])=>{p.cyl(x,y,74,86,.025,'#fff6e6',{order:2});p.fn(x,y,86,flame,{dd:.4,post:1});});p.fn(1,.5,84,glow(56,.4),{dd:.5,post:1});}},
 lux_chair:{fp:[1,1],h:104,paint:chair(LAC,CRIM2,{bh:100,trim:GOLD,knob:1,sz:32})},
 lux_tub:{fp:[2,1],h:70,paint:p=>{[[.2,.2],[1.8,.2],[.2,.8],[1.8,.8]].forEach(([x,y])=>p.ball(x,y,0,7,GOLD));p.box(.06,.08,8,1.94,.94,44,WHITE,{soft:10,gloss:.45,trim:GOLD}).on('F',c=>{c.strokeStyle=rgba(GOLD,.9);c.lineWidth=.02;c.beginPath();c.moveTo(.05,.5);c.quadraticCurveTo(.5,.62,.95,.5);c.stroke();})
   .on('T',c=>{const g=c.createLinearGradient(0,0,1,1);g.addColorStop(0,'#cfeeff');g.addColorStop(1,'#78c0ea');rr(c,.07,.14,.86,.72,.3,g);c.fillStyle='#d8203a';for(let i=0;i<14;i++){const x=.15+((i*37)%70)/100,y=.25+((i*53)%50)/100;c.beginPath();c.ellipse(x,y,.022,.04,i,0,7);c.fill();}c.fillStyle='rgba(255,255,255,.7)';[[.3,.4],[.62,.62]].forEach(([x,y])=>{c.beginPath();c.ellipse(x,y,.05,.09,0,0,7);c.fill();});});
  p.cyl(.18,.5,44,62,.03,GOLD,{order:1});p.box(.14,.44,58,.34,.56,62,GOLD,{order:1});[[1.86,.16],[1.86,.84]].forEach(([x,y])=>{p.cyl(x,y,44,54,.03,'#fff6e6',{order:1});p.fn(x,y,54,flame,{dd:.4,post:1});});p.fn(1,.5,50,glow(46,.3),{dd:.5,post:1});}},
 lux_wardrobe:{fp:[2,1],h:168,paint:p=>{p.box(.02,.2,0,1.98,1,160,LAC,{soft:3,trim:GOLD}).on('F',c=>{rr(c,.04,.03,.44,.92,.03,LAC2);rr(c,.52,.03,.44,.92,.03,LAC2);c.strokeStyle=GOLD;c.lineWidth=.01;c.strokeRect(.07,.06,.38,.86);c.strokeRect(.55,.06,.38,.86);
   rr(c,.1,.1,.32,.3,.02,CRIM);rr(c,.58,.1,.32,.3,.02,CRIM);dragon(c,.26,.24,.13,.1);dragon(c,.74,.24,.13,.1,GOLD,1);rr(c,.43,.5,.02,.16,.01,GOLD);rr(c,.55,.5,.02,.16,.01,GOLD);});
  p.box(-.03,.16,160,2.03,1.04,168,GOLD,{soft:2,gloss:.55});p.box(.06,.24,0,1.94,.96,6,'#141016');}},
 lux_lantern:{fp:[1,1],h:150,paint:p=>{p.box(.22,.22,0,.78,.78,14,LAC,{soft:2,trim:GOLD});p.box(.28,.28,14,.72,.72,104,'#ffcf6a',{alpha:.75,gloss:.3,lit:.4,tf:.4}).on('F',c=>{c.strokeStyle=GOLD;c.lineWidth=.03;c.strokeRect(.05,.03,.9,.94);c.beginPath();c.moveTo(.5,0);c.lineTo(.5,1);c.stroke();});
  [[.28,.28],[.72,.28],[.28,.72],[.72,.72]].forEach(([x,y])=>p.cyl(x,y,14,106,.02,GOLD,{order:1}));p.box(.2,.2,104,.8,.8,112,GOLD,{soft:2,order:2});p.box(.3,.3,112,.7,.7,124,LAC,{soft:3,order:2});p.ball(.5,.5,124,6,GOLD,{order:3});
  p.fn(.5,.5,60,glow(60,.5),{dd:.5,post:1});}},
 lux_screen:{fp:[2,1],h:130,paint:p=>{[0,1,2].forEach(i=>{const x0=.04+i*.64;p.box(x0,.42,4,x0+.62,.58,128,LAC,{soft:2,trim:GOLD}).on('F',c=>{rr(c,.06,.04,.88,.92,.02,'#2e2834');c.strokeStyle=GOLD;c.lineWidth=.02;c.strokeRect(.08,.06,.84,.88);dragon(c,.5-(i-1)*0,.5,.36,.2,GOLD,i==2);
   c.fillStyle=rgba(CRIM2,.8);c.beginPath();c.arc(.5,.15,.08,0,7);c.fill();});p.box(x0+.08,.38,0,x0+.18,.62,4,GOLD);p.box(x0+.44,.38,0,x0+.54,.62,4,GOLD);});}},
 lux_bonsai:{fp:[1,1],h:104,paint:p=>{p.box(.18,.26,0,.82,.74,22,GOLD,{soft:4,gloss:.55,trim:LAC});p.box(.22,.3,20,.78,.7,24,'#4a3020');
  p.fn(.5,.5,24,(c,q,X)=>{const k=X.KZ;c.strokeStyle='#3a2414';c.lineWidth=7*k;c.lineCap='round';c.beginPath();c.moveTo(q[0],q[1]);c.bezierCurveTo(q[0]-14*k,q[1]-20*k,q[0]+16*k,q[1]-36*k,q[0]-4*k,q[1]-56*k);c.stroke();c.lineWidth=3.5*k;c.beginPath();c.moveTo(q[0]+2*k,q[1]-30*k);c.quadraticCurveTo(q[0]+18*k,q[1]-40*k,q[0]+22*k,q[1]-52*k);c.stroke();
   c.strokeStyle='#6a4a2a';c.lineWidth=2*k;c.beginPath();c.moveTo(q[0]-2,q[1]-4*k);c.bezierCurveTo(q[0]-12*k,q[1]-20*k,q[0]+12*k,q[1]-34*k,q[0]-4*k,q[1]-52*k);c.stroke();},{dd:.05});
  [[.38,.5,64,15,'#2f6a3a'],[.66,.5,74,12,'#3f8a4a'],[.48,.46,86,13,'#2f7a3a'],[.56,.56,62,10,'#4a9a52']].forEach(([x,y,z,r,col])=>p.ball(x,y,z,r,col,{dd:.1}));}},
 lux_piano:{fp:[2,2],h:104,paint:p=>{[[.3,.3],[1.7,.3],[1,1.15]].forEach(([x,y])=>{p.cyl(x,y,0,30,.05,LAC);p.ball(x,y,0,3,GOLD);});
  p.box(.1,.06,30,1.9,1.32,58,'#1c1820',{soft:8,gloss:.65,trim:GOLD});p.box(.2,1.3,40,1.8,1.48,50,LAC,{soft:2});p.box(.24,1.3,50,1.76,1.46,53,WHITE,{order:1}).on('T',c=>{c.fillStyle='#1c1820';for(let i=0;i<22;i++)if(i%7!=2&&i%7!=6)c.fillRect(.02+i*.045,0,.022,.55);});
  p.box(.5,1.12,58,1.5,1.18,82,'#1c1820',{soft:2,order:1}).on('F',c=>{rr(c,.15,.15,.7,.7,.04,'#f3e6cc');c.fillStyle='#35202a';for(let i=0;i<4;i++)c.fillRect(.22,.3+i*.13,.56,.012);});
  p.fn(1.5,.4,58,(c,q,X)=>{const a=X.P3(1.85,.1,104),b=X.P3(.2,.1,64);c.strokeStyle='#35202a';c.lineWidth=2.4;c.beginPath();c.moveTo(q[0],q[1]);c.lineTo(a[0],a[1]);c.stroke();c.strokeStyle=GOLD;c.lineWidth=1.2;c.stroke();},{dd:-.2});
  p.box(.62,1.62,0,1.38,1.94,28,LAC,{soft:3,trim:GOLD,order:2});p.box(.66,1.64,28,1.34,1.92,32,CRIM2,{soft:4,gloss:.4,order:2});}},
 lux_bar:{fp:[2,1],h:150,paint:p=>{p.box(.02,.3,0,1.98,1,62,LAC,{soft:3,trim:GOLD}).on('F',c=>{[0,1,2].forEach(i=>{rr(c,.03+i*.325,.1,.3,.8,.03,LAC2);c.strokeStyle=GOLD;c.lineWidth=.008;c.strokeRect(.06+i*.325,.14,.24,.72);knob(c,.18+i*.325,.5,GOLD);});});
  p.box(-.02,.26,62,2.02,1.04,68,'#2a2530',{soft:2,gloss:.6,trim:GOLD});p.box(.06,.3,68,1.94,.44,148,LAC,{soft:2,trim:GOLD}).on('F',c=>{[0,1].forEach(r=>{rr(c,.04,.06+r*.46,.92,.4,.02,'#120e14');c.fillStyle=rgba(GOLD,.9);c.fillRect(.04,.45+r*.46,.92,.012);
    [.1,.2,.3,.44,.56,.7,.82].forEach((x,i)=>{const col=['#4aa85a','#c8323c','#e8b44e','#8a5ad0','#d8f0ff','#a8501a','#4a8ad8'][(i+r*3)%7];c.fillStyle=col;rr(c,x,.18+r*.46,.06,.26,.02,col);c.fillRect(x+.02,.1+r*.46,.02,.1);});
    const g=c.createRadialGradient(.5,.08+r*.46,.01,.5,.2+r*.46,.4);g.addColorStop(0,'rgba(255,214,140,.4)');g.addColorStop(1,'rgba(255,214,140,0)');c.fillStyle=g;c.fillRect(.04,.06+r*.46,.92,.4);});});
  [[.5,.7],[.8,.66]].forEach(([x,y])=>p.cyl(x,y,68,80,.05,'#d8f0ff',{alpha:.8,inner:'#ffb83a',order:1}));p.cyl(1.4,.7,68,92,.06,'#2a6a3a',{order:1});p.cyl(1.4,.7,92,100,.02,GOLD,{order:1});}},
 lux_vanity:{fp:[1,1],h:140,paint:p=>{p.box(.08,.18,0,.92,.92,40,LAC,{soft:3,trim:GOLD}).on('F',c=>{rr(c,.06,.15,.4,.75,.03,LAC2);rr(c,.54,.15,.4,.75,.03,LAC2);knob(c,.42,.5,GOLD);knob(c,.58,.5,GOLD);});
  p.box(.06,.16,40,.94,.94,46,'#efe8f0',{soft:2,gloss:.6}).on('T',c=>{c.strokeStyle='rgba(120,110,130,.35)';c.lineWidth=.01;c.beginPath();c.moveTo(.1,.2);c.quadraticCurveTo(.5,.5,.9,.3);c.stroke();c.fillStyle=GOLD;c.beginPath();c.ellipse(.5,.58,.26,.28,0,0,7);c.fill();c.fillStyle='#c9d6e6';c.beginPath();c.ellipse(.5,.6,.2,.2,0,0,7);c.fill();});
  p.cyl(.5,.26,46,58,.022,GOLD,{order:1});p.box(.14,.06,46,.86,.14,140,GOLD,{soft:2}).on('F',c=>{const g=c.createLinearGradient(0,0,1,1);g.addColorStop(0,'#eef8ff');g.addColorStop(1,'#8cbce4');c.fillStyle=g;c.beginPath();c.ellipse(.5,.48,.4,.44,0,0,7);c.fill();c.fillStyle='rgba(255,255,255,.55)';c.beginPath();c.ellipse(.36,.34,.05,.2,.3,0,7);c.fill();});
  p.cyl(.2,.7,46,58,.05,'#f08aa8',{order:1});p.fn(.86,.4,46,flame,{dd:.4,post:1});}},
};
Object.assign(D,DEF2);})();
