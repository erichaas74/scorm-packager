const fs=require('fs'), path=require('path');
const sharp=require('C:/Users/erich/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const out=path.join(__dirname,'revision-diagrams');fs.mkdirSync(out,{recursive:true});
const C={ink:'#17344a',blue:'#355aa6',teal:'#087c80',orange:'#bd6821',red:'#b24a62',gray:'#637487',light:'#eef4f8'};
const esc=t=>String(t).replaceAll('&','&amp;').replaceAll('<','&lt;');
const tx=(x,y,t,s=28,c=C.ink)=>`<text x="${x}" y="${y}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${s}" fill="${c}">${esc(t)}</text>`;
const ln=(x,y,X,Y,c=C.gray,w=4)=>`<path d="M${x} ${y}L${X} ${Y}" stroke="${c}" stroke-width="${w}" fill="none"/>`;
const ar=(x,y,X,Y,c=C.teal)=>{let a=Math.atan2(Y-y,X-x);return ln(x,y,X,Y,c,6)+`<path d="M${X} ${Y}L${X-19*Math.cos(a-.5)} ${Y-19*Math.sin(a-.5)}L${X-19*Math.cos(a+.5)} ${Y-19*Math.sin(a+.5)}Z" fill="${c}"/>`};
const box=(x,y,w,h,c=C.light)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="${c}" stroke="#c8d6df" stroke-width="2"/>`;
const cir=(x,y,r,c='white',st=C.blue)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" stroke="${st}" stroke-width="4"/>`;
const magnet=(x,y)=>box(x,y,85,95,C.red)+box(x+85,y,85,95,C.blue)+tx(x+42,y+60,'S',36,'white')+tx(x+127,y+60,'N',36,'white');
const coil=(x,y)=>[0,1,2,3,4,5].map(i=>`<ellipse cx="${x+i*22}" cy="${y}" rx="25" ry="90" fill="none" stroke="${C.orange}" stroke-width="5"/>`).join('');
const meter=(x,y,active=true)=>cir(x,y,62)+tx(x,y+100,'sensitive meter',23)+ln(x,y,x+(active?35:0),y-38,C.red,5)+tx(x,y+38,'0',18);
const tag=(x,y,t,c=C.teal)=>box(x-150,y-32,300,62)+tx(x,y+8,t,25,c);
const base=z=>`<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="720" viewBox="0 0 1440 720"><rect width="1440" height="720" rx="28" fill="${C.light}"/><rect x="24" y="24" width="1392" height="672" rx="22" fill="white"/>${z}</svg>`;
const wave=(x,y,w,h,cycles=1)=>{let pts=[];for(let i=0;i<=120;i++)pts.push(`${x+w*i/120},${y-h*Math.sin(2*Math.PI*cycles*i/120)}`);return `<polyline points="${pts.join(' ')}" fill="none" stroke="${C.teal}" stroke-width="5"/>`};
const figs={};
for(let n=1;n<=4;n++){
 let z=magnet(190,225)+coil(730,275)+ar(405,265,620,265)+tx(495,220,'magnet approaches',26)+meter(995,485,n!==2)+ln(730,365,730,485)+ln(730,485,933,485)+ln(1057,485,1180,485)+ln(1180,485,1180,270)+ln(1180,270,865,270);
 if(n===1)z+=tx(740,110,'A moving magnet and a closed circuit',34)+tx(720,645,'Change the magnet’s position and observe the meter.',26);
 if(n===2){z=box(80,130,600,420)+box(760,130,600,420)+tx(380,195,'approaching magnet',30)+tx(1060,195,'stationary magnet',30)+magnet(160,270)+coil(490,320)+ar(340,318,425,318)+magnet(840,270)+coil(1170,320)+tag(380,490,'flux changes')+tag(1060,490,'flux steady',C.gray)+tx(720,630,'The presence of a field alone does not induce emf.',28)}
 if(n===3){z=tx(720,100,'Motion reversal changes voltage polarity',34)+box(85,155,590,395)+box(765,155,590,395)+magnet(135,280)+coil(480,320)+ar(325,320,405,320)+magnet(815,280)+coil(1160,320)+ar(1085,320,1005,320)+tx(380,220,'toward the coil',27)+tx(1060,220,'away from the coil',27)+tag(380,485,'one polarity')+tag(1060,485,'opposite polarity')+tx(720,625,'Same magnet orientation and meter connections.',26)}
 if(n===4){z=tx(720,110,'Voltage can exist without a closed current path',34)+box(100,185,580,360)+box(760,185,580,360)+tx(390,255,'closed conducting loop',29)+tx(1050,255,'open switch',29);for(let x of [200,860])z+=ln(x,330,x+300,330)+ln(x+300,330,x+300,450)+ln(x+300,450,x,450)+ln(x,450,x,330);z+=ar(280,330,410,330)+tx(390,505,'induced current can flow',26)+`<rect x="960" y="316" width="80" height="30" fill="${C.light}"/>`+ln(960,330,1030,290)+tx(1050,505,'no sustained conduction current',24)+tx(720,630,'Both coils experience a changing flux.',27)}
 figs['induction-'+n]=base(z);
}
for(let kind of ['motor','generator'])for(let n=1;n<=5;n++){
 let z=box(100,205,175,235,C.red)+tx(187,340,'N',60,'white')+box(1165,205,175,235,C.blue)+tx(1252,340,'S',60,'white');for(let y of [210,330,450])z+=ar(305,y,1120,y,'#9dafca');
 z+=`<path d="M490 230 L930 280 L930 460 L490 410 Z" stroke="${C.orange}" stroke-width="10" fill="white" fill-opacity=".8"/>`+tx(720,170,'field from N to S',25,C.blue)+ln(720,115,720,540,C.gray,5);
 let labels=kind==='motor'?['electrical input','forces on opposite sides','torque turns the coil','connections reverse each half-turn','useful mechanical output']:['mechanical input','orientation changes','changing flux induces emf','closed load carries current','electrical output and thermal transfer'];
 z+=tx(720,75,labels[n-1],34);
 if(kind==='motor'){
  z+=ar(815,265,535,235,C.red)+tx(655,218,'current',24,C.red)+cir(495,315,25,'white',C.teal)+cir(495,315,5,C.teal,C.teal)+cir(930,370,25,'white',C.teal)+ln(915,355,945,385,C.teal)+ln(915,385,945,355,C.teal)+tx(345,570,'⊙ force toward you',26,C.teal)+tx(1060,570,'⊗ force away from you',26,C.teal);
  if(n>=3)z+=`<path d="M1020 140 A55 30 0 1 1 1110 155" stroke="${C.teal}" stroke-width="6" fill="none"/>`+ar(1120,145,1110,165)+tx(1230,135,'rotation',24,C.teal);
  z+=tag(720,620,n===4?'split-ring commutator':n===5?'shaft drives a load':'battery supplies energy');
 }else{
  z+=`<path d="M1020 140 A55 30 0 1 1 1110 155" stroke="${C.teal}" stroke-width="6" fill="none"/>`+ar(1120,145,1110,165)+tx(1245,135,'external drive',22,C.teal);
  if(n===2)z+=ar(720,330,880,150,C.red)+tx(960,200,'coil normal',25,C.red);
  if(n===3)z+=ln(430,600,990,600)+wave(440,600,530,40,1)+tx(1135,610,'+ / − voltage',24);
  else z+=tag(720,615,n===4?'closed circuit + load':n===5?'mechanical → electrical':'shaft receives work');
 }
 figs[kind+'-'+n]=base(z);
}
for(let n=1;n<=4;n++){
 let z=tx(720,85,['air-pressure variations','diaphragm and coil move together','motion induces an alternating signal','signal sent to an amplifier'][n-1],34)+box(800,245,130,90,C.red)+box(800,415,130,90,C.blue)+tx(865,302,'N',38,'white')+tx(865,475,'S',38,'white');
 z+=ln(720,175,720,555,C.blue,13)+ln(720,365,1000,365,C.gray,10)+coil(850,370)+ar(990,340,1090,340)+ar(1090,400,990,400)+tx(615,600,'diaphragm',27)+tx(1015,600,'moving coil in magnetic gap',25);
 for(let x=180;x<=540;x+=90)z+=`<path d="M${x} 240 Q${x+100} 365 ${x} 490" fill="none" stroke="${C.teal}" stroke-width="5"/>`;
 if(n>=3)z+=wave(1030,180,300,40,2)+tx(1160,120,n===4?'to amplifier':'signal voltage',26);
 z+=tx(720,665,'A dynamic microphone uses induction; a speaker uses magnetic force.',25,C.gray);figs['microphone-'+n]=base(z);
}
const rows=[['A','7.5 V','40','Below target'],['B','8.5 V','65','Meets both'],['C','10.0 V','90','Over budget']];
for(let n=1;n<=6;n++){
 let z='';
 if(n===1){z=tx(720,105,'Generator brief',36)+box(120,185,560,330)+box(760,185,560,330)+tx(400,290,'OUTPUT',28,C.teal)+tx(400,385,'at least 8 V peak',40)+tx(1040,290,'BUDGET',28,C.orange)+tx(1040,385,'at most 70 units',40)+tx(720,625,'A valid design must satisfy both constraints.',30)}
 if(n===2){z=tx(720,100,'One-variable trial plan',36)+box(100,185,420,350)+tx(310,265,'CHANGE',30,C.orange)+tx(310,360,'rotation speed',32)+box(600,185,740,350)+tx(970,265,'HOLD FIXED',30,C.teal)+tx(970,350,'magnet • turns • coil area',30)+tx(970,415,'load • meter connections',30)+tx(720,625,'Record actual RPM as well as the water-flow setting.',28)}
 if(n===3){z=tx(720,100,'Read several complete rotations',36)+ln(180,360,1230,360)+ln(180,160,180,560)+wave(190,360,990,150,3)+tx(102,220,'+8 V',24)+tx(105,365,'0',24)+tx(102,515,'−8 V',24)+tx(1230,410,'time',25)+tx(720,630,'Peak magnitude is 8 V; a negative reading means reversed polarity.',27)}
 if(n===4||n===5){z=tx(720,100,n===4?'Compare measured results':'Choose using evidence',36);for(let j=0;j<4;j++){let yy=170+j*90;z+=box(160,yy,1120,78,j===2?'#ddf3eb':C.light);let rr=j===0?['Design','Peak emf','Cost','Decision']:rows[j-1];rr.forEach((t,k)=>z+=tx(280+k*285,yy+49,t,j===0?26:30,j===2?C.teal:C.ink));}z+=tx(720,620,n===4?'Target ≥ 8 V • Budget ≤ 70 units':'Design B clears the voltage target and stays within budget.',28)}
 if(n===6){z=tx(720,105,'Explain the energy transfer and trade-off',34)+box(80,230,330,150)+tx(245,315,'moving water',32)+ar(420,305,535,305)+box(545,230,360,150)+tx(725,315,'turbine + generator',29)+ar(915,305,1020,305)+box(1030,230,330,150)+tx(1195,315,'electrical load',30)+ar(725,390,725,500,C.red)+tx(725,555,'thermal energy to surroundings',28,C.red)+tx(720,630,'Greater electrical loading can oppose motion and lower RPM.',27)}
 figs['design-'+n]=base(z);
}
let z=tx(720,90,'Conducting plate moves through a localized magnetic field',31)+box(100,170,1240,350)+box(535,200,370,290,'#e4eafa');for(let x=575;x<900;x+=75)for(let y=245;y<470;y+=70)z+=ln(x-9,y-9,x+9,y+9,C.blue,3)+ln(x-9,y+9,x+9,y-9,C.blue,3);
z+=tx(720,155,'× magnetic field into the page',25,C.blue)+cir(540,345,88,'none',C.red)+cir(900,345,88,'none',C.red)+ar(540,257,500,267,C.red)+ar(900,257,938,266,C.red)+tx(400,500,'entering field: counterclockwise',22,C.red)+tx(1040,500,'leaving field: clockwise',22,C.red)+ar(190,595,465,595,C.orange)+tx(325,645,'plate motion',26,C.orange)+ar(1220,595,945,595,C.teal)+tx(1085,645,'braking force',26,C.teal)+tx(720,565,'kinetic → thermal',26);figs.braking=base(z);
(async()=>{for(let [name,svg] of Object.entries(figs)){fs.writeFileSync(path.join(out,name+'.svg'),svg);await sharp(Buffer.from(svg)).png().toFile(path.join(out,name+'.png'));}console.log('Rendered '+Object.keys(figs).length+' diagrams to '+out)})();

