(() => {
  'use strict';
  const kind=window.showpieceKind,svg=document.getElementById('scene'),status=document.getElementById('status'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let elapsed=0,last=null,example=0,completed=false;const seen=new Set();
  const sign=()=>[0,1,-1][example];
  function beam(t,a){const x=t,vx=1,start=.15,end=1;let y=0,vy=0;if(t>start){const u=Math.min(t,end)-start;y=.5*a*u*u;vy=a*u;if(t>end)y+=vy*(t-end);}return {x,y,vx,vy,ay:t>=start&&t<end?a:0};}
  function jitter(t,i){const j=Math.floor(i/2),s=i%2?1:-1;return {x:s*(7*Math.sin(t*3.1+j*2.3)+4*Math.sin(t*7.7+j)),y:s*(9*Math.cos(t*4.3+j*1.7)+3*Math.sin(t*9.1+j))};}
  function electron(t,i,direction){const j=jitter(t,i);return {x:j.x-direction*9*t,y:j.y};}
  window.showpiecePhysics={beam,jitter,electron};
  const L=(x1,y1,x2,y2,c,w=1,dash='')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${w}" ${dash?`stroke-dasharray="${dash}"`:''}/>`;
  const T=(x,y,s,cls='',color)=>`<text x="${x}" y="${y}" text-anchor="middle" class="${cls}" ${color?`style="fill:${color}"`:''}>${s}</text>`;
  const P=(d,c,w=2,fill='none')=>`<path d="${d}" fill="${fill}" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const E=(x,y,rx,ry,fill,stroke='none',w=1)=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="${w}"/>`;
  const R=(x,y,w,h,fill,stroke='none',r=0)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}"/>`;
  function A(x1,y1,x2,y2,c,w=2.5){if(Math.hypot(x2-x1,y2-y1)<1)return '';const a=Math.atan2(y2-y1,x2-x1),h=7;return L(x1,y1,x2,y2,c,w)+P(`M${x2-h*Math.cos(a-.5)} ${y2-h*Math.sin(a-.5)} L${x2} ${y2} L${x2-h*Math.cos(a+.5)} ${y2-h*Math.sin(a+.5)}`,c,w);}
  const defs=`<defs>
  <linearGradient id="copper"><stop stop-color="#854323"/><stop offset=".2" stop-color="#cf905d"/><stop offset=".45" stop-color="#f7d7ad"/><stop offset=".7" stop-color="#b67242"/><stop offset="1" stop-color="#754022"/></linearGradient>
  <linearGradient id="cut"><stop stop-color="#f3e2cb"/><stop offset=".5" stop-color="#fff8ed"/><stop offset="1" stop-color="#e4c7a4"/></linearGradient>
  <radialGradient id="ion" cx=".32" cy=".25"><stop stop-color="#ffeed4"/><stop offset=".45" stop-color="#d6aa76"/><stop offset="1" stop-color="#a66e3d"/></radialGradient>
  <radialGradient id="electron" cx=".3" cy=".25"><stop stop-color="#d5f7ff"/><stop offset=".3" stop-color="#499dd0"/><stop offset="1" stop-color="#195388"/></radialGradient>
  <linearGradient id="steel"><stop stop-color="#607e92"/><stop offset=".24" stop-color="#f0f6fa"/><stop offset=".5" stop-color="#9eb5c5"/><stop offset=".8" stop-color="#e1edf5"/><stop offset="1" stop-color="#59778d"/></linearGradient>
  <linearGradient id="glass" x2="0" y2="1"><stop stop-color="#d6eaf4" stop-opacity=".65"/><stop offset=".35" stop-color="#f8fcfe" stop-opacity=".12"/><stop offset=".8" stop-color="#c9e1ef" stop-opacity=".25"/><stop offset="1" stop-color="#accbde" stop-opacity=".6"/></linearGradient>
  <linearGradient id="positive"><stop stop-color="#8c3c43"/><stop offset=".35" stop-color="#e49c9f"/><stop offset=".6" stop-color="#bd626d"/><stop offset="1" stop-color="#71323c"/></linearGradient>
  <linearGradient id="negative"><stop stop-color="#285780"/><stop offset=".35" stop-color="#a0c6e4"/><stop offset=".6" stop-color="#568cba"/><stop offset="1" stop-color="#254e75"/></linearGradient>
  <radialGradient id="glow"><stop stop-color="#b4ffe0"/><stop offset=".25" stop-color="#58e8ae" stop-opacity=".8"/><stop offset="1" stop-color="#58e8ae" stop-opacity="0"/></radialGradient>
  <radialGradient id="shadow"><stop stop-color="#25485a" stop-opacity=".16"/><stop offset="1" stop-color="#25485a" stop-opacity="0"/></radialGradient>
  </defs>`;
  function wire(W,t,d){
    const left=45,right=W-45,c=W/2,span=right-left,closed=d!==0;
    let s=T(c,28,['Switch open: random motion, no drift.','Switch closed: electrons drift left.','Source reversed: electrons drift right.'][example],'strong');
    // Real circuit and wire segment; the enlargement is physically connected below it.
    s+=P(`M${left} 136 L${left} 183 L${c-98} 183 M${c-32} 183 L${c+20} 183 M${c+78} 183 L${right} 183 L${right} 136`,'#416c88',3);
    s+=R(c-98,163,66,40,'#edf4f8','#8fa9bb',5)+L(c-73,169,c-73,195,'#365871',3)+L(c-62,175,c-62,189,'#365871',3)+T(c-86,189,d<0?'−':'+','small')+T(c-46,189,d<0?'+':'−','small');
    s+=E(c+20,183,4,4,'#d4e2ed','#416c88')+E(c+78,183,4,4,'#d4e2ed','#416c88')+L(c+20,183,c+78,closed?183:155,'#516d80',4);
    s+=R(left,123,span,26,'url(#copper)','#985c34',5)+E(left,136,7,13,'#bc804e','#985c34')+E(right,136,7,13,'#e9c398','#985c34');
    // Current across the top conductor follows the battery terminals around the circuit.
    s+=T(c,215,closed?(d>0?'Conventional current →':'← Conventional current'):'No conventional current','small',closed?'#a44a2b':undefined);
    if(closed)s+=A(c-d*65,109,c+d*65,109,'#a44a2b');
    s+=L(left+40,150,left+12,264,'#a9bdca',1,'3 4')+L(right-40,150,right-12,264,'#a9bdca',1,'3 4');
    // Copper cutaway with a fixed lattice, continuous interior, and metallic curved ends.
    s+=E(c,471,span*.52,19,'url(#shadow)')+R(left,270,span,174,'url(#copper)','#985c34',10)+E(left,357,13,87,'url(#copper)','#985c34')+E(right,357,13,87,'url(#copper)','#985c34')+R(left+10,286,span-20,142,'url(#cut)');
    const cols=W>600?10:6,dx=(span-52)/(cols-1);
    for(let row=0;row<3;row++)for(let col=0;col<cols;col++){const x=left+26+col*dx,y=310+row*45;s+=E(x,y+9,13,4,'#8d673b22')+E(x,y,12,12,'url(#ion)','#b38557')+T(x,y+5,'+','small','#94683d');}
    const xmin=left+18,xwidth=span-36;
    for(let i=0;i<36;i++){const base=18+(i%12)*(xwidth-36)/11,e=electron(t,i,d),x=xmin+((base+e.x+xwidth*4)%xwidth),y=320+Math.floor(i/12)*39+e.y;
      s+=E(x,y,4.6,4.6,'url(#electron)','#2a6999');}
    s+=L(left+12,280,right-12,280,'#ffecd4',2)+L(left+12,436,right-12,436,'#86552f',2);
    s+=T(c,254,'Inside the copper wire','strong');
    s+=T(c,481,'Copper ions stay in place.','small');
    if(closed){s+=A(c+d*75,520,c-d*75,520,'#23649a',4)+T(c,550,d>0?'Average electron drift ←':'Average electron drift →','strong','#23649a');}
    else s+=T(c,531,'Random motion cancels on average.','strong');
    s+=T(c,585,closed?'Electrons are negative: drift opposes current.':'Electrons keep moving even with the switch open.','small')+T(c,614,'Enlarged schematic · motion exaggerated','small');
    return {markup:s,height:634};
  }
  function chamber(W,progress,a){
    const left=45,right=W-45,span=right-left,c=W/2,mid=310,sy=148;
    const X=x=>left+span*x/1.3,Y=y=>mid+y*sy;
    const px1=X(.15),px2=X(1),target=X(1.3),p=beam(progress*1.3,a),x=X(p.x),y=Y(p.y);
    const active=example!==0,topPositive=a>0;
    let s=T(c,28,['Field off: the beam travels straight.','Field down: a positive charge bends down.','Field reversed: the beam bends up.'][example],'strong');
    s+=T(c,54,'Same particle · same starting speed','small');
    // Bench, glass envelope, machined flanges, and ceramic plate supports.
    s+=E(c,488,span*.57,19,'url(#shadow)')+R(left-17,159,span+34,315,'url(#glass)','#abc7d8',22);
    s+=E(left-9,315,13,150,'#edf5fa88','#9fbccc')+E(right+9,315,13,150,'#dceaf288','#9fbccc');
    s+=P(`M${left+10} 174 Q${c} 160 ${right-10} 174`,'#ffffff',3)+L(left+6,180,left+6,449,'#ffffffbb',2);
    for(const xx of [px1+18,px2-18])for(const yy of [167,430])s+=R(xx-8,yy,16,29,'#f4f1e9','#b8b6ac',4);
    s+=R(px1,193,px2-px1,14,active?`url(#${topPositive?'positive':'negative'})`:'url(#steel)','#6b8799',3)+R(px1,413,px2-px1,14,active?`url(#${topPositive?'negative':'positive'})`:'url(#steel)','#6b8799',3);
    for(let j=0;j<5;j++){const xx=px1+20+(px2-px1-40)*j/4;s+=T(xx,187,active?(topPositive?'+':'−'):'0','small')+T(xx,449,active?(topPositive?'−':'+'):'0','small');if(active)s+=a>0?A(xx,225,xx,392,'#8db8be',1.4):A(xx,392,xx,225,'#8db8be',1.4);}
    s+=T(c,115,active?(a>0?'Electric field ↓':'Electric field ↑'):'No electric field','strong','#087c80');
    // Source and target are apparatus, not graph axes.
    s+=R(left-28,292,34,36,'url(#steel)','#647f92',4)+R(left-31,299,25,22,'url(#copper)','#985c34',2)+E(left+8,310,5,14,'#516f83');
    s+=T(left+12,364,'source','small');
    s+=R(target-3,215,12,190,'#284e51','#94c3b5',4)+R(target,222,3,176,'#548d7f');
    s+=T(target-13,461,'screen','small');
    s+=L(X(0),mid,target,mid,'#afc0ca',1,'4 5');
    // Trace and equal-time dots come from the same piecewise trajectory.
    let trace='';for(let j=0;j<=90;j++){const q=beam(p.x*j/90,a);trace+=(j?' L':'M')+X(q.x)+' '+Y(q.y);}s+=P(trace,'#bf782c',2.4);
    for(let t=.13;t<p.x;t+=.13){const q=beam(t,a);s+=E(X(q.x),Y(q.y),2.5,2.5,'#bc7a36');}
    s+=E(x,y,14,14,'#f2ca6244')+E(x,y,7,7,'#e9b64a','#95671d')+T(x,y+4,'+','small');
    if(progress>0&&progress<1){s+=A(x,y,x+27,y+27*p.vy*sy/(span/1.3),'#23649a',3);if(p.ay)s+=A(x-12,y,x-12,y+Math.sign(p.ay)*37,'#a94b24',3);}
    if(progress>=1)s+=E(target+1,Y(beam(1.3,a).y),18,24,'url(#glow)');
    const after=p.x>1;
    s+=T(c,512,active?(after?'Past the plates: straight along the exit direction.':'Force changes the vertical motion.'):'No force: velocity stays unchanged.','strong');
    s+=T(c,542,active?'Horizontal speed stays the same.':'The source sends the same positive charge.','small');
    s+=L(c-150,576,c-130,576,'#23649a',3)+T(c-74,581,'velocity','small')+L(c+30,576,c+50,576,'#a94b24',3)+T(c+101,581,'force','small');
    s+=T(c,615,'Equal-time dots · ideal field; edge effects omitted','small');
    return {markup:s,height:634};
  }
  function render(){const W=innerWidth<=600?440:880,phase=reduced.matches?'hold':elapsed<1000?'setup':elapsed<6000?'animate':'hold',p=reduced.matches?1:Math.max(0,Math.min(1,(elapsed-1000)/5000)),d=sign();
    const result=kind==='wire'?wire(W,p*5,d):chamber(W,p,d*.8);
    svg.innerHTML=defs+result.markup;svg.setAttribute('viewBox',`0 0 ${W} ${result.height}`);svg.dataset.example=example;svg.dataset.phase=phase;
    const message=kind==='wire'?['Open switch: random motion, no average drift.','Current right, electron drift left.','Current left, electron drift right.'][example]:['No field: straight path.','Field down: downward force, curved path, straight exit.','Field up: upward force, curved path, straight exit.'][example];
    if(status.textContent!==message)status.textContent=message;svg.setAttribute('aria-label',message);
    if(phase==='hold'){seen.add(example);if(seen.size===3&&!completed){completed=true;window.parent.postMessage({type:'complete'},'*');}}
    window.showpieceState=()=>({kind,example,phase,progress:p,direction:d,elapsed,completed});
  }
  function reset(){elapsed=0;last=null;example=0;render();}
  document.getElementById('replay').addEventListener('click',reset);
  function frame(now){const dt=last===null?0:Math.min(100,now-last);last=now;if(!document.hidden){elapsed+=dt;if(elapsed>=(reduced.matches?5000:9000)){elapsed=0;example=(example+1)%3;}render();}requestAnimationFrame(frame);}
  addEventListener('resize',render);reduced.addEventListener('change',reset);reset();requestAnimationFrame(frame);
})();
