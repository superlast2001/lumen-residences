'use strict';
// Non-tenant NPCs (gym-goers, clubbers, lobby visitors): 20 painted chibi sprites in the style of the user's
// reference sheet (big glossy anime hair, fantasy-adventurer outfits, dark outlines, soft cel shading, ~2.5 heads),
// each with 4 views generated as one consistent character sheet: front idle, side walk (faces right), back, activity.
// Sprites were keyed off white with a flood fill + edge decontamination (no halos). Motion (walk bob/lean, run,
// reps, punches, dancing, hops) is done here in code with transforms only - no blur, no re-painting.
// dumbbell() is also used by the tenants' "fit" thought bubble (world.js).
const OL='#35202a';
function dumbbell(c,x,y,ang,col='#3a3a46'){c.save();c.translate(x,y);c.rotate(ang);c.lineCap='round';c.strokeStyle=OL;c.lineWidth=2.6;c.beginPath();c.moveTo(-3.4,0);c.lineTo(3.4,0);c.stroke();c.strokeStyle='#c8ccd6';c.lineWidth=1.2;c.stroke();
 [-3.6,3.6].forEach(d=>{c.beginPath();c.roundRect(d-1.4,-2.7,2.8,5.4,1);c.fillStyle=col;c.fill();c.strokeStyle=OL;c.lineWidth=.8;c.stroke();});c.restore();}
// sprite metrics: [w,h,feetX] in px; every NPC's front view is 300px tall, all 4 views share that scale
const NPCMETA={"amara":{"front":[148,300,80.6],"side":[150,295,87.6],"back":[136,298,67.2],"act":[158,305,76.2]},"bram":{"front":[139,300,69.9],"side":[135,292,71.9],"back":[133,293,65.1],"act":[158,302,89.1]},"dano":{"front":[160,300,77.3],"side":[150,295,72.2],"back":[157,296,76.7],"act":[230,265,109.4]},"dex":{"front":[136,300,67.5],"side":[144,295,80.1],"back":[128,299,63.8],"act":[141,300,69.7]},"elise":{"front":[119,300,56.3],"side":[133,295,72.0],"back":[112,297,55.1],"act":[131,302,66.3]},"gus":{"front":[153,300,76.2],"side":[140,299,70.5],"back":[137,299,67.1],"act":[165,304,80.7]},"ivy":{"front":[141,300,69.7],"side":[134,296,70.8],"back":[134,297,65.9],"act":[170,300,80.0]},"jett":{"front":[127,300,62.6],"side":[123,294,63.5],"back":[120,296,59.9],"act":[180,296,68.4]},"kai":{"front":[146,300,72.8],"side":[135,295,59.4],"back":[126,297,59.2],"act":[162,302,81.1]},"leon":{"front":[139,300,69.3],"side":[135,293,59.7],"back":[132,297,65.0],"act":[189,298,93.7]},"luz":{"front":[149,300,73.6],"side":[137,299,77.5],"back":[141,298,69.8],"act":[177,302,82.1]},"mei":{"front":[146,300,70.9],"side":[141,294,92.3],"back":[131,295,69.3],"act":[152,299,60.4]},"mika":{"front":[119,300,57.5],"side":[147,292,89.3],"back":[101,291,45.7],"act":[157,291,96.1]},"nova":{"front":[170,300,89.6],"side":[155,295,98.6],"back":[150,294,74.9],"act":[187,301,90.9]},"priya":{"front":[126,300,74.5],"side":[138,293,77.6],"back":[95,297,46.5],"act":[179,300,101.5]},"rafe":{"front":[137,300,69.8],"side":[138,295,60.4],"back":[128,295,62.0],"act":[160,302,87.6]},"rin":{"front":[113,300,45.7],"side":[148,289,59.7],"back":[93,291,44.9],"act":[121,314,58.2]},"sora":{"front":[132,300,67.4],"side":[138,297,73.2],"back":[124,297,61.4],"act":[163,296,113.7]},"theo":{"front":[142,300,72.5],"side":[146,294,68.6],"back":[135,294,67.0],"act":[163,297,90.1]},"zed":{"front":[141,300,71.2],"side":[135,292,60.7],"back":[134,294,62.2],"act":[154,302,91.6]}};
const NPCV='0.3.1',NPCIMG={};
function npcImg(id,v){const k=id+'_'+v;let I=NPCIMG[k];if(!I){I=NPCIMG[k]=new Image();I.decoding='async';I.src='assets/npc/'+k+'.webp?v='+NPCV;}return I;}
const npcOk=I=>I&&I.complete&&I.naturalWidth>0;
// activity motion: returns view + transform (about the feet) at time T (s). d = 0..1 rep phase
const TAU=Math.PI*2;
function npcMotion(act,T,walk,back,s){const S=Math.sin,A=Math.abs;
 if(walk){const p=T/.62*TAU;return{v:back?'back':'side',dy:-A(S(p))*.028,rot:back?S(p)*.035:.045+S(p)*.02,sy:1-A(S(p+1.2))*.018,sx:1,dx:back?S(p)*.006:0};}
 switch(act){
 case'run':{const p=T/.4*TAU;return{v:'act',dy:-A(S(p))*.04,rot:.06+S(p)*.02,sy:1-A(S(p+1.4))*.03,sx:1,dx:0};}
 case'squat':{const d=(1-Math.cos(T/2.2*TAU))/2;return{v:'act',dy:0,rot:0,sy:1-d*.09,sx:1+d*.035,dx:0};}
 case'curl':case'press':case'kettlebell':{const d=(1-Math.cos(T/1.9*TAU))/2;return{v:'act',dy:-d*.012,rot:S(T/1.9*TAU)*.012,sy:1+d*.022-(1-d)*.008,sx:1-d*.01,dx:0};}
 case'punch':{const p=(T/.55)%1,j=p<.25?p/.25:p<.5?1-(p-.25)/.25:0;return{v:'act',dy:-j*.006,rot:j*.05,sy:1,sx:1+j*.02,dx:j*.05};}
 case'stretch':{const p=T/3.4*TAU;return{v:'act',dy:-(S(p)*.5+.5)*.012,rot:S(p)*.07,sy:1+(S(p*2)*.5+.5)*.018,sx:1,dx:0};}
 case'dance':{const b=T/.47*TAU;return{v:'act',dy:-A(S(b))*.035,rot:S(b/2)*.085,sy:1-A(S(b+1.3))*.035,sx:1+A(S(b+1.3))*.02,dx:S(b/2)*.025,mir:Math.floor(T/(.47*8))%2};}
 case'cheer':{const p=(T/.8)%1,h=p<.5?S(p*2*Math.PI):0;return{v:'act',dy:-h*.07,rot:S(T*2.2)*.03,sy:p<.5?1+h*.03:1-(S((p-.5)*2*Math.PI))*.05,sx:p<.5?1:1+(S((p-.5)*2*Math.PI))*.03,dx:0};}
 case'cheers':case'drink':{const p=T/3*TAU;return{v:'act',dy:0,rot:S(p)*.025,sy:1+S(p*2)*.01,sx:1,dx:0};}
 case'wave':{const p=T/1.1*TAU;return{v:'act',dy:-A(S(p))*.006,rot:S(p)*.04,sy:1,sx:1,dx:0};}
 case'read':{const p=T/4*TAU;return{v:'act',dy:0,rot:S(p)*.015,sy:1+S(p)*.008,sx:1,dx:0};}
 }
 return{v:'act',dy:0,rot:0,sy:1+Math.sin(T/3.2*TAU)*.01,sx:1,dx:0};}
function idleMotion(T){return{v:'front',dy:0,rot:Math.sin(T/5*TAU)*.012,sy:1+Math.sin(T/3.2*TAU)*.011,sx:1-Math.sin(T/3.2*TAU)*.004,dx:0};}
// H = on-screen height of a tenant chibi. flip: mirror (side/act views face right unmirrored)
function drawExtra(c,x,y,s,t,walk,H,flip){const id=s.id,M=NPCMETA[id];if(!M)return;const T=t+(s.seed||0)*1.7;
 // free-standing NPCs take short breaks (front idle) between activity sets; on equipment they keep going
 let m;if(walk)m=npcMotion('walk',T,1,s.back,s);else if(s.onU)m=npcMotion(s.act,T,0,0,s);
 else{const cyc=s.cyc||12,ph=((T/cyc)%1+1)%1;m=ph<(s.share==null?.72:s.share)?npcMotion(s.act,T,0,0,s):idleMotion(T);}
 const hh=H*(s.hs||1),k=hh/300,dm=M[m.v],I=npcImg(id,m.v);
 const lift=-m.dy*hh;
 if(!s.noShadow){const r=hh*.27*(1-Math.min(.35,lift/hh*3)),g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'rgba(10,6,20,.42)');g.addColorStop(1,'rgba(10,6,20,0)');c.save();c.translate(x,y);c.scale(1,.38);c.fillStyle=g;c.beginPath();c.arc(0,0,r,0,7);c.fill();c.restore();}
 if(!npcOk(I))return;
 let fl=flip?1:0;if(m.mir)fl^=1;if(m.v=='front'||m.v=='back')fl=0;
 c.save();c.translate(x+(fl?-1:1)*m.dx*hh,y+m.dy*hh);if(fl)c.scale(-1,1);c.rotate(m.rot);c.scale(m.sx,m.sy);c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
 c.drawImage(I,-dm[2]*k,-dm[1]*k,dm[0]*k,dm[1]*k);c.restore();}
// preload every view so the first walk/turn never pops
function npcPreload(){for(const id in NPCMETA)['front','side','back','act'].forEach(v=>npcImg(id,v));}
// ---- the 20 NPCs (adults, original designs; tenants are separate and unchanged) ----
const NPCS=[
 // gym
 {n:'Bram',id:'bram',act:'curl',talk:"Ares says squeeze at the top. I'm squeezing!"},
 {n:'Mika',id:'mika',act:'run',talk:"Kilometre five! Don't talk to me, I'm in the zone~"},
 {n:'Big Dano',id:'dano',act:'squat',hs:1.06,talk:"Leg day is a lifestyle, friend. Ares spotted my PR!"},
 {n:'Jett',id:'jett',act:'punch',talk:"Jab, jab, cross! Ares taught me to keep my guard up."},
 {n:'Coach Rin',id:'rin',act:'stretch',talk:"Ares runs a tight warm-up. Ten minutes, no skipping!"},
 {n:'Priya',id:'priya',act:'kettlebell',talk:"Swing from the hips, not the arms. Ares's rule."},
 {n:'Leon',id:'leon',act:'press',hs:1.04,talk:"Ares does these with one arm. ONE ARM."},
 {n:'Sora',id:'sora',act:'run',talk:"Two kilometres, then smoothies."},
 {n:'Gus',id:'gus',act:'drink',share:.5,talk:"First week at the gym! Everything hurts. Great!"},
 // club
 {n:'Nova',id:'nova',act:'dance',share:.85,talk:"Zayne's set tonight is insane!"},
 {n:'Kai',id:'kai',act:'dance',share:.8,talk:"When the bass drops, the whole floor jumps."},
 {n:'Luz',id:'luz',act:'cheer',share:.7,hs:.97,talk:"Best club in Lumen, no contest."},
 {n:'Dex',id:'dex',act:'drink',share:.6,talk:"Is that the DJ with the mask? Legend."},
 {n:'Ivy',id:'ivy',act:'dance',share:.85,hs:.96,talk:"One more song! ...Okay, five more."},
 {n:'Rafe',id:'rafe',act:'cheers',share:.6,talk:"I came for one drink. That was three hours ago."},
 {n:'Mei',id:'mei',act:'drink',share:.6,talk:"Drinks are £8 after midnight. Worth it for this set."},
 {n:'Zed',id:'zed',act:'dance',share:.8,talk:"My knight coat? Best dance outfit ever made."},
 {n:'Amara',id:'amara',act:'cheer',share:.65,talk:"ZAYNE! ONE MORE! ONE MORE!"},
 // lobby / passing by
 {n:'Theo',id:'theo',act:'wave',share:.3,cyc:9,talk:"Parcel for the penthouse? No? I'll keep looking!"},
 {n:'Elise',id:'elise',act:'read',share:.8,talk:"The lobby's quieter than the library. Don't tell them."},
];
NPCS.forEach((g,i)=>{g.seed=i*1.37+.4;});
const GYMCAST=NPCS.slice(0,9),CLUBCAST=NPCS.slice(9,18),LOBBYCAST=NPCS.slice(18);
// ---- v0.3.3: daily routes. Every NPC is somewhere fitting at each hour, never in two places at once (checked by the test script).
// {n, p:place, h:[from,to) hours (wraps past midnight), t:tile or on:furniture, act (the sprite's own action), roam:wander radius, say:place line}
const NPC_SCHED=[
 // ---- Lobby (building common area): deliveries, early readers, residents' friends passing through
 {n:'Theo',p:'lobby',h:[8,11],t:[5,5],roam:4,say:"Morning! Three parcels for the fourth floor, one smells like cake."},
 {n:'Theo',p:'fshop',h:[11,14],t:[5,7],roam:3,say:"Picking up lunch for the whole delivery crew. Twelve bubble teas. TWELVE."},
 {n:'Theo',p:'lobby',h:[14,23],t:[5,5],roam:4,say:"Last round of the day. Who orders a lamp at 9 PM? Zayne, that's who."},
 {n:'Elise',p:'lobby',h:[7,10],t:[7,3],flip:1,say:"The lobby's quieter than the library. Don't tell them."},
 {n:'Elise',p:'cafe',h:[10,14],t:[8,6],flip:1,say:"One oat latte, one chapter. That's the deal I make with myself."},
 {n:'Elise',p:'park',h:[14,18],t:[4,7],say:"The pond ducks have heard this book three times now."},
 {n:'Elise',p:'lobby',h:[18,22],t:[7,3],flip:1,say:"Ophion lent me a mystery. I suspect the butler. I always suspect the butler."},
 {n:'Gus',p:'lobby',h:[7,10],t:[3,6],say:"Water bottle: full. Motivation: also full. Heading to the gym!"},
 {n:'Zed',p:'lobby',h:[9,13],t:[8,6],flip:1,act:'wave',say:"I don't live here. I just like the lobby lighting. Very knightly."},
 {n:'Mika',p:'lobby',h:[18,20],t:[4,5],roam:5,act:'run',say:"Cool-down lap of the lobby! The doorman hates it."},
 // ---- Lumen Gym (open 6 AM – 11 PM)
 {n:'Mika',p:'gym',h:[6,9],on:'treadmill',oi:0},
 {n:'Sora',p:'gym',h:[10,22],on:'treadmill',oi:1},
 {n:'Leon',p:'gym',h:[6,17],t:[7,2],flip:1},
 {n:'Big Dano',p:'gym',h:[6,23],t:[4,3]},
 {n:'Bram',p:'gym',h:[6,23],t:[3,6]},
 {n:'Jett',p:'gym',h:[11,23],t:[1,4]},
 {n:'Coach Rin',p:'gym',h:[9,18],t:[6,7]},
 {n:'Priya',p:'gym',h:[8,23],t:[6,5],flip:1},
 {n:'Gus',p:'gym',h:[10,18],t:[8,8],flip:1},
 // ---- Cafe Lumière
 {n:'Dex',p:'cafe',h:[7,13],t:[3,2],say:"Third espresso. I can hear colours now."},
 {n:'Mei',p:'cafe',h:[10,17],t:[6,6],flip:1,say:"The matcha here is better than the club drinks. Don't tell Zayne."},
 {n:'Ivy',p:'cafe',h:[8,12],t:[7,4],act:'wave',say:"Croissant and gossip, the perfect breakfast~"},
 {n:'Sora',p:'cafe',h:[22,23],t:[6,6],flip:1,act:'wave',say:"Post-gym smoothie. I earned this one."},
 // ---- Restaurant Rosso (lunch + dinner)
 {n:'Zed',p:'restaurant',h:[13,16],t:[7,3],flip:1,act:'wave',say:"I ordered the knight's platter. They said there isn't one. They made one anyway."},
 {n:'Amara',p:'restaurant',h:[12,15],t:[3,6],act:'cheer',say:"Lunch with the team! We closed the deal! Tiramisu for everyone!"},
 {n:'Amara',p:'restaurant',h:[17,20],t:[7,6],flip:1,act:'cheer',say:"Dinner, then dancing. This is the plan. The plan is perfect."},
 {n:'Nova',p:'restaurant',h:[17,20],t:[7,7],flip:1,act:'wave',say:"Carb-loading before Zayne's set. That's science."},
 {n:'Rafe',p:'restaurant',h:[19,22],t:[3,3],act:'cheers',say:"A toast! To the chef, to the wine, to the tiramisu!"},
 {n:'Zed',p:'restaurant',h:[17,20],t:[3,7],act:'wave',say:"Table for one knight, please."},
 // ---- City Park (joggers loop the paths)
 {n:'Mika',p:'park',h:[9,12],t:[4,4],roam:5,act:'run',say:"Park loop number three! The ducks are cheering for me. Probably."},
 {n:'Sora',p:'park',h:[7,10],t:[5,6],roam:5,act:'run',say:"Two laps of the pond, then smoothies."},
 {n:'Coach Rin',p:'park',h:[6,9],t:[7,5],flip:1,say:"Sunrise stretch class! Reach for the sky, breathe out the week."},
 {n:'Jett',p:'park',h:[7,11],t:[2,4],say:"Shadow boxing by the pond. The pond is winning."},
 {n:'Ivy',p:'park',h:[13,18],t:[7,8],flip:1,act:'dance',say:"Practising my moves where nobody's watching. ...You're watching."},
 {n:'Kai',p:'park',h:[18,20],t:[5,8],act:'wave',say:"Look, the first star! No wait, that's a plane."},
 // ---- Furniture Shop
 {n:'Nova',p:'fshop',h:[10,15],t:[6,3],flip:1,act:'wave',say:"Mango boba or taro boba? ...Both. The answer is both."},
 {n:'Kai',p:'fshop',h:[12,18],t:[2,7],act:'dance',say:"Free samples at the dumpling stand! I've had six. Don't tell them."},
 {n:'Leon',p:'fshop',h:[17,21],t:[7,7],flip:1,say:"Post-gym protein run. Steak plate, double rice, no regrets."},
 // ---- Roof Terrace (building common area): sunbeds, BBQ, skyline
 {n:'Priya',p:'roof',h:[6,8],t:[5,6],say:"Kettlebell swings with a view. Best gym in the city."},
 {n:'Dex',p:'roof',h:[13,17],t:[3,4],say:"Coffee tastes better ten floors up. That's just maths."},
 {n:'Rafe',p:'roof',h:[15,19],t:[7,3],flip:1,act:'cheers',say:"Sunset cocktail on the roof! The barman is me. I'm the barman."},
 {n:'Luz',p:'roof',h:[16,20],t:[4,6],act:'cheer',say:"Golden hour! Everyone look gorgeous, I'm taking photos!"},
 {n:'Coach Rin',p:'roof',h:[18,22],t:[6,7],flip:1,say:"Evening yoga on the roof. Stretch toward the skyline."},
 {n:'Gus',p:'roof',h:[18,23],t:[2,7],say:"BBQ's going! I brought veggie skewers. And sausages. Mostly sausages."},
 {n:'Mei',p:'roof',h:[17,21],t:[8,6],flip:1,say:"I come up here to watch the city lights switch on, one by one."},
 // ---- Night Club Neon (9 PM – 3 AM, Zayne DJs)
 {n:'Nova',p:'club',h:[20,4],t:[4,4]},{n:'Kai',p:'club',h:[20,4],t:[6,4]},{n:'Luz',p:'club',h:[20,4],t:[5,6]},{n:'Ivy',p:'club',h:[20,4],t:[3,6]},
 {n:'Zed',p:'club',h:[20,4],t:[4,6]},{n:'Amara',p:'club',h:[20,4],t:[6,7],flip:1},{n:'Rafe',p:'club',h:[22,4],t:[7,5],flip:1},{n:'Dex',p:'club',h:[21,4],t:[7,2],flip:1},{n:'Mei',p:'club',h:[21,4],t:[8,3],flip:1}];
const inHrs=(h,[a,b])=>a<b?h>=a&&h<b:(h>=a||h<b);
const npcCast=(p,h)=>NPC_SCHED.filter(s=>s.p==p&&inHrs(h,s.h));

npcPreload();
