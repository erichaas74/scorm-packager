(() => {
  'use strict';
  const svg=document.getElementById('scene'),status=document.getElementById('status');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const g=9.81,m=.02,vt=.45,tau=vt/g,H=1;
  const fall=(t,copper)=>copper?vt*(t-tau*(1-Math.exp(-t/tau))):g*t*t/2;
  let lo=0,hi=4;for(let i=0;i<60;i++){const mid=(lo+hi)/2;if(fall(mid,true)<H)lo=mid;else hi=mid;}
  const copperTime=(lo+hi)/2,plasticTime=Math.sqrt(2*H/g),fallMs=copperTime*3000;
  function model(t,copper){const landed=t>=(copper?copperTime:plasticTime),v=landed?0:copper?vt*(1-Math.exp(-t/tau)):g*t;return {y:Math.min(H,fall(t,copper)),v,weight:m*g,drag:copper&&!landed?m*g*v/vt:0,landed};}
  window.brakingPhysics={model,fall,g,m,vt,tau,copperTime,plasticTime};
  let elapsed=0,last=null,example=0,completed=false;
  const shown=new Set();
  const L=(x1,y1,x2,y2,color,width=1,dash='')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}" ${dash?`stroke-dasharray="${dash}"`:''}/>`;
  const T=(x,y,s,cls='',color)=>`<text x="${x}" y="${y}" text-anchor="middle" class="${cls}" ${color?`style="fill:${color}"`:''}>${s}</text>`;
  const P=(d,color,width=2,fill='none')=>`<path d="${d}" fill="${fill}" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const E=(x,y,rx,ry,fill,stroke='none',width=1)=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="${width}"/>`;
  const R=(x,y,w,h,fill,stroke='none',radius=0)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" fill="${fill}" stroke="${stroke}"/>`;
  function arrow(x1,y1,x2,y2,color,width=3){if(Math.hypot(x2-x1,y2-y1)<2)return '';const a=Math.atan2(y2-y1,x2-x1),h=7;return L(x1,y1,x2,y2,color,width)+P(`M${x2-h*Math.cos(a-.5)} ${y2-h*Math.sin(a-.5)} L${x2} ${y2} L${x2-h*Math.cos(a+.5)} ${y2-h*Math.sin(a+.5)}`,color,width);}
  const defs=`<defs>
  <linearGradient id="copper"><stop stop-color="#824422"/><stop offset=".16" stop-color="#d99461"/><stop offset=".38" stop-color="#f8d5ac"/><stop offset=".62" stop-color="#bf7847"/><stop offset=".88" stop-color="#8b4c2a"/><stop offset="1" stop-color="#dfa570"/></linearGradient>
  <linearGradient id="inside"><stop stop-color="#b77a51"/><stop offset=".3" stop-color="#efd9bf"/><stop offset=".7" stop-color="#f8e9d8"/><stop offset="1" stop-color="#b98058"/></linearGradient>
  <linearGradient id="plastic"><stop stop-color="#c3dbe9" stop-opacity=".7"/><stop offset=".25" stop-color="#f6fcff" stop-opacity=".3"/><stop offset=".7" stop-color="#d7e8f0" stop-opacity=".4"/><stop offset="1" stop-color="#8dafc3" stop-opacity=".7"/></linearGradient>
  <linearGradient id="north"><stop stop-color="#793544"/><stop offset=".35" stop-color="#cf6676"/><stop offset=".63" stop-color="#bc4e60"/><stop offset="1" stop-color="#7b3040"/></linearGradient>
  <linearGradient id="south"><stop stop-color="#224e7b"/><stop offset=".35" stop-color="#5d94c5"/><stop offset=".63" stop-color="#3874ac"/><stop offset="1" stop-color="#204a76"/></linearGradient>
  <linearGradient id="base" x2="0" y2="1"><stop stop-color="#e3eaf0"/><stop offset="1" stop-color="#9fb2c1"/></linearGradient>
  <radialGradient id="shadow"><stop stop-color="#25485a" stop-opacity=".18"/><stop offset="1" stop-color="#25485a" stop-opacity="0"/></radialGradient>
  </defs>`;
  function magnet(x,y,r,polarity){const top=polarity===1?'north':'south',bottom=polarity===1?'south':'north';
    return R(x-r,y-22,r*2,22,`url(#${top})`)+R(x-r,y,r*2,22,`url(#${bottom})`)+E(x,y+22,r,6,`url(#${bottom})`,'#ffffff55')+E(x,y-22,r,6,`url(#${top})`,'#ffffff66')+L(x-r,y,x+r,y,'#ffffff99',1)+T(x,y-7,polarity===1?'N':'S','pole')+T(x,y+16,polarity===1?'S':'N','pole');
  }
  function loop(x,y,rx,dir,strength){const ry=10,w=1.4+strength*1.8,color='#b07813';
    // Ellipse front is its lower half. CCW from above moves right on the front.
    const a=dir===1?Math.PI*.64:Math.PI*.36,b=a-dir*.28;
    return `<g opacity="${.3+.7*strength}">`+E(x,y,rx,ry,'none',color,w)+arrow(x+rx*Math.cos(a),y+ry*Math.sin(a),x+rx*Math.cos(b),y+ry*Math.sin(b),color,w)+'</g>';
  }
  function scene(){
    const compact=innerWidth<=600,W=compact?440:880,centers=compact?[112,328]:[240,640],r=compact?39:65,magR=compact?21:29;
    const reducedTime=.8,t=reduced.matches?reducedTime:Math.max(0,Math.min(copperTime,(elapsed-1000)/3000));
    const phase=reduced.matches?'comparison':elapsed<1000?'setup':elapsed<1000+fallMs?'fall':'hold';
    const polarity=example===0?1:-1;
    let s=defs+T(W/2,27,phase==='setup'?'Same magnets. Same release.':example===0?'Watch the two falls together.':'Poles reversed. Still slowed by copper.','strong');
    s+=T(W/2,53,reduced.matches?`Same instant: t = ${t.toFixed(2)} s`:`t = ${t.toFixed(2)} s · motion shown 3× slower`,'small');
    s+=L(centers[0]-r-16,140,centers[1]+r+16,140,'#becdd6',1,'4 5')+L(centers[0]-r-16,450,centers[1]+r+16,450,'#becdd6',1,'4 5');
    const states=[];
    centers.forEach((x,i)=>{
      const copper=i===1,state=model(t,copper),y=140+310*state.y;states.push(state);
      s+=T(x,85,copper?'Copper':'Plastic','strong')+T(x,105,copper?'cutaway view':'transparent tube','small');
      s+=E(x,511,r+29,17,'url(#shadow)')+R(x-r-13,479,2*r+26,18,'url(#base)','#a1b3c1',5)+E(x,479,r+13,7,'#e7edf2','#b7c8d3');
      s+=R(x-r,122,2*r,346,copper?'url(#copper)':'url(#plastic)',copper?'#9a5b35':'#a0bdcc');
      if(copper)s+=R(x-r+12,126,2*r-24,337,'url(#inside)');
      s+=E(x,122,r,11,copper?'#e2ae7d':'#e0edf4',copper?'#8f5530':'#a0bdcc')+E(x,122,r-7,7,copper?'#765039':'#f4f9fc');
      s+=E(x,468,r,11,copper?'url(#copper)':'url(#plastic)',copper?'#9a5b35':'#a0bdcc');
      // Previous positions at equal physical time intervals: actual acceleration evidence.
      for(let k=1;k<=3;k++){const old=t-k*.1;if(old>=0&&!state.landed){const py=140+310*model(old,copper).y;s+=L(x-magR,py,x+magR,py,'#6c879866',1.5);}}
      if(copper&&state.v>0){const strength=state.drag/state.weight;s+=loop(x,y-40,r-5,polarity,strength)+loop(x,y+40,r-5,-polarity,strength);}
      s+=magnet(x,y,magR,polarity);
      // Narrow shiny wall edges preserve the cutaway cylinder's shape.
      if(copper)s+=L(x-r+8,137,x-r+8,452,'#f9dfbc',2)+L(x+r-8,137,x+r-8,452,'#713f28',2);
      else s+=L(x-r+7,138,x-r+7,451,'#ffffffbb',3)+L(x+r-6,138,x+r-6,451,'#ffffff77',1.5);
      if(phase!=='setup'){
        const weightX=x+(compact?52:88),dragX=x-(compact?52:88),len=48;
        s+=arrow(weightX,y+4,weightX,y+4+len,'#285f9f',3)+T(weightX,y+len+22,'mg','small','#285f9f');
        if(state.landed)s+=arrow(dragX,y+4+len,dragX,y+4,'#6c8190',3)+T(dragX,y-13,'support','small','#617c8b');
        else if(copper&&state.drag>0)s+=arrow(dragX,y+4,dragX,y+4-len*state.drag/state.weight,'#087c80',3)+T(dragX,y-10-len*state.drag/state.weight,compact?'Fₘ':'magnetic force','small','#087c80');
      }
      s+=T(x,543,state.landed?`Arrived: ${(copper?copperTime:plasticTime).toFixed(2)} s`:copper?(state.v>.43?'Nearly constant speed':'Braking grows with speed'):'Speed increases','strong');
      s+=T(x,568,state.landed?'At rest; supported':`v = ${state.v.toFixed(2)} m/s`,'small');
    });
    const message=phase==='setup'?'Gravity pulls both down.':phase==='hold'?'Copper’s induced currents slowed the fall.':example===0?'Moving magnet → currents → upward magnetic force.':'Reverse the poles → reverse currents; force stays upward.';
    // Two short lines remain readable on narrow displays.
    const lines=phase==='setup'?['Gravity pulls both down.']:phase==='hold'?['Copper’s induced currents slowed the fall.','No motion now → no induced current.']:example===0?['Moving magnet → currents in copper.','Their magnetic force opposes the fall.']:['Reverse poles → reverse currents.','The braking force still points upward.'];
    s+=lines.map((v,i)=>T(W/2,608+i*25,v,i===0?'strong':'small')).join('');
    s+=T(W/2,664,'Idealized 1 m drop · same force-arrow scale','small');
    svg.innerHTML=s;svg.setAttribute('viewBox',`0 0 ${W} 681`);svg.dataset.phase=phase;svg.dataset.example=example;
    const spoken=`${example===0?'North pole up.':'South pole up.'} ${message}`;if(status.textContent!==spoken)status.textContent=spoken;
    svg.setAttribute('aria-label',`Identical magnets falling in plastic and copper. ${spoken}`);
    if(phase==='hold'||reduced.matches){shown.add(example);if(shown.size===2&&!completed){completed=true;window.parent.postMessage({type:'complete'},'*');}}
    window.brakingState=()=>({phase,example,t,states,completed,elapsed});
  }
  document.getElementById('replay').addEventListener('click',()=>{elapsed=0;last=null;example=reduced.matches?1-example:0;scene();});
  function frame(now){const dt=last===null?0:Math.min(100,now-last);last=now;
    if(!reduced.matches&&!document.hidden){elapsed+=dt;if(elapsed>=1000+fallMs+3000){elapsed=0;example=1-example;}scene();}requestAnimationFrame(frame);
  }
  addEventListener('resize',scene);reduced.addEventListener('change',()=>{elapsed=0;last=null;scene();});scene();requestAnimationFrame(frame);
})();
