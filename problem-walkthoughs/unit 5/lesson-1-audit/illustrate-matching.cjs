const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'revised-assets');
const L=(x,y,X,Y,c='#00818a')=>`<path d="M${x},${y}L${X},${Y}" fill="none" stroke="${c}" stroke-width="3"/>`;
const T=(x,y,t)=>`<text x="${x}" y="${y}" font-size="16" fill="#18354d">${t}</text>`;
const dot=(x,y,r=6)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="#d79a25"/>`;
function sine(){let p=[];for(let n=0;n<=180;n++)p.push(`${n?'L':'M'}${20+n*1.78},${95-42*Math.sin(n/180*4*Math.PI)}`);return `<path d="${p.join(' ')}" stroke="#3869b1" stroke-width="4" fill="none"/>`}
function particles(){let b='';for(let j=0;j<4;j++)for(let n=0;n<30;n++){let x=25+n*10+10*Math.sin(n*.6);b+=`<circle cx="${x}" cy="${55+j*23}" r="3" fill="#3869b1"/>`}return b}
function svg(k,i){let b=L(15,95,345,95,'#bdcad4');
 if(k===0){
  if(i===0)b+=sine()+T(100,25,'wave travels →')+T(115,175,'a length of rope');
  if(i===1)b=particles()+T(85,25,'vibrating air particles');
  if(i===2)b+=`<path d="M20,95L115,95Q150,5 185,95L340,95" fill="none" stroke="#3869b1" stroke-width="4"/>`+T(210,55,'→');
  if(i===3)b+=sine()+T(100,25,'regular source motion')+T(230,165,'→');
  if(i===4)b+=dot(180,95)+L(180,35,180,155)+T(170,30,'↑')+T(171,175,'↓')+T(20,25,'marked point');
  if(i===5)b+=dot(180,95)+T(112,45,'resting position');
 } else {
  if(i===0)b+=sine()+dot(180,95)+T(165,45,'↕')+T(235,30,'wave →');
  if(i===1)b=particles()+T(120,25,'wave →')+T(145,178,'↔');
  if(i===2)b+=sine()+dot(60,53)+T(57,35,'P');
  if(i===3)b+=sine()+dot(140,137)+T(135,170,'Q');
  if(i===4||i===5){b='';let spacing=i===4?11:37;for(let row=0;row<3;row++)for(let col=0;col<7;col++)b+=`<circle cx="${180+(col-3)*spacing}" cy="${65+row*25}" r="5" fill="#3869b1"/>`;b+=T(100,170,'selected air region');}
  if(i===6)b+=sine()+L(221,95,221,53)+L(214,53,228,53)+L(214,95,228,95)+T(238,75,'3 cm');
 }
 return `<svg aria-hidden="true" viewBox="0 0 360 190" style="display:block;width:100%;height:160px;background:#f1f6fa;border-radius:10px;margin:14px 0;font-family:Arial">${b}</svg>`;
}
for(let k=0;k<2;k++){let f=path.join(root,`matching-${k+1}`,'index.html'),html=fs.readFileSync(f,'utf8'),i=0;html=html.replace(/<select id="q\d+">/g,m=>svg(k,i++)+m);html=html.replace("n+' of '+data.length+' correct. You can revise your choices and check again.';","n+' of '+data.length+' correct. You can revise your choices and check again.';if(n===data.length)window.parent.postMessage({type:'complete'},'*');");fs.writeFileSync(f,html)}
