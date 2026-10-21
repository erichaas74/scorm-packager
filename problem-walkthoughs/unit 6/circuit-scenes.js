(() => {
  'use strict';
  const L=window.walkthroughLesson,k=L.variant,svg=document.getElementById('scene'),status=document.getElementById('status'),control=document.getElementById('parameter');
  const buttons=[...document.querySelectorAll('[data-choice]')],reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let answered=false,correct=false,p=0,t=0,last=null,raf=0,done=false,changed=false,value=0,from=0,target=0;
  const ink='#18384e',flow='#087b87';
  const text=(x,y,s,cl='')=>`<text x="${x}" y="${y}" text-anchor="middle" class="${cl}">${s}</text>`;
  const line=(x,y,X,Y,c=ink,n=2)=>`<line x1="${x}" y1="${y}" x2="${X}" y2="${Y}" stroke="${c}" stroke-width="${n}" stroke-linecap="round"/>`;
  const rect=(x,y,w,h,fill,stroke=ink,r=5)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}"/>`;
  const dot=(x,y,r,fill,stroke='none')=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}"/>`;
  const defs=`<defs><radialGradient id="glass"><stop stop-color="#fff" stop-opacity=".9"/><stop offset=".7" stop-color="#e5f4fc" stop-opacity=".6"/><stop offset="1" stop-color="#a6c9de"/></radialGradient><radialGradient id="glow"><stop stop-color="#fff7a2" stop-opacity=".9"/><stop offset=".55" stop-color="#ffd75b" stop-opacity=".5"/><stop offset="1" stop-color="#ffd75b" stop-opacity="0"/></radialGradient><linearGradient id="steel" x2="0" y2="1"><stop stop-color="#f4f9fc"/><stop offset=".45" stop-color="#8ca1af"/><stop offset=".65" stop-color="#e2ebf1"/><stop offset="1" stop-color="#5b7282"/></linearGradient><linearGradient id="copper" x2="0" y2="1"><stop stop-color="#955031"/><stop offset=".3" stop-color="#f8c798"/><stop offset=".55" stop-color="#d99158"/><stop offset="1" stop-color="#8c4428"/></linearGradient></defs>`;
  // Each arrow is a conventional-current indicator, not an electron or charge packet.
  function wire(x,y,X,Y,current=0,phase=0){
    let s=line(x,y,X,Y,'#456477',6)+line(x,y,X,Y,'#b8d0dc',2);
    if(current>0){const len=Math.hypot(X-x,Y-y),a=Math.atan2(Y-y,X-x),count=Math.max(1,Math.floor(len/47));
      for(let i=0;i<count;i++){const f=((i+.3+phase*current*.7)%count)/count,px=x+(X-x)*f,py=y+(Y-y)*f;
        s+=`<path class="current" data-current="${current}" d="M-5 -4L1 0L-5 4" transform="translate(${px} ${py}) rotate(${a*180/Math.PI})" fill="none" stroke="${flow}" stroke-width="3.5" stroke-linecap="round"/>`;
      }
    }return s;
  }
  function supply(x,y,v){return `<g class="supply">${rect(x-40,y-48,80,96,'#dce5ed','#607c90',9)}${rect(x-32,y-39,64,34,'#e9f5dd','#587266',4)}${text(x,y-16,`${v} V`,'strong')} ${dot(x-18,y+17,8,'#bd523d')}${dot(x+18,y+17,8,'#334d61')}${text(x-18,y+23,'+','terminal')}${text(x+18,y+23,'−','terminal')}${line(x,y-65,x,y-48,'#b04e39',5)}${line(x,y+48,x,y+65,'#334d61',5)}</g>`;}
  function resistor(x,y,label){return `<g class="resistor">${line(x-46,y,x-29,y,'#7e8d94',4)}${line(x+29,y,x+46,y,'#7e8d94',4)}${rect(x-29,y-14,58,28,'#ddc39b','#917249',8)}${line(x-17,y-12,x-17,y+12,'#a3452a',5)}${line(x-5,y-12,x-5,y+12,'#334d61',5)}${line(x+8,y-12,x+8,y+12,'#73511f',5)}${line(x+21,y-12,x+21,y+12,'#b18e32',3)}${text(x,y-28,label,'strong')}</g>`;}
  function bulb(x,y,power=0,broken=false,label=''){
    return `<g class="bulb" data-power="${power}" data-broken="${broken}">${power?`<circle cx="${x}" cy="${y-30}" r="${42+power*.8}" fill="url(#glow)" opacity="${.3+power/35}"/>`:''}${line(x-40,y,x-12,y,'#7d909b',4)}${line(x+12,y,x+40,y,'#7d909b',4)}<path d="M${x-13} ${y-3}C${x-13} ${y-15} ${x-31} ${y-15} ${x-31} ${y-36}A31 31 0 1 1 ${x+31} ${y-36}C${x+31} ${y-15} ${x+13} ${y-15} ${x+13} ${y-3}Z" fill="url(#glass)" stroke="#7398b0" stroke-width="2"/>${power?dot(x,y-33,24,'#ffdd69'):''}${line(x-9,y-2,x-10,y-30,'#647b89',2)}${line(x+9,y-2,x+10,y-30,'#647b89',2)}<path class="filament" d="M${x-10} ${y-30}l4 -8 l4 8 ${broken?`M${x+5} ${y-34}l5 4`:'l4 -8 l4 8 l4 -8'}" fill="none" stroke="${power?'#a7620d':'#465e70'}" stroke-width="3"/>${rect(x-14,y-3,28,18,'url(#steel)','#6f8695',3)}${[1,6,11].map(d=>line(x-13,y+d,x+13,y+d,'#627b8b',1)).join('')}<path d="M${x-21} ${y-40}q-1 -13 12 -18" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>${label?text(x,y+43,label,'small'):''}${broken?text(x,y-80,'Broken','strong'):''}</g>`;
  }
  function meter(x,y,reading){return `<g class="meter" data-reading="${reading}">${rect(x-50,y-29,100,58,'#33546c','#1e3c52',8)}${rect(x-40,y-21,80,35,'#d8edd3','#b4d2be',4)}${text(x,y+3,reading,'strong')}${dot(x-49,y,5,'#b8c8d5','#18384e')}${dot(x+49,y,5,'#cb654a','#18384e')}</g>`;}
  function knife(x,y,closed){const endX=x-30+60*Math.cos((1-closed)*.7),endY=y-60*Math.sin((1-closed)*.7);return `<g class="switch" data-closed="${closed>=1}">${line(x-38,y,x-30,y,'#7d909b',4)}${line(x+30,y,x+38,y,'#7d909b',4)}${rect(x-38,y+6,76,12,'#a9b9c5','#6e8695',3)}${dot(x-30,y,6,'#c38d3b','#77562d')}${dot(x+30,y,6,'#c38d3b','#77562d')}${line(x-30,y,endX,endY,'#667c8c',7)}${line(x-28,y-2,endX,endY-2,'#f0f5f8',2)}${dot(endX,endY,7,'#bd4b38','#843c2c')}</g>`;}
  const result={ohm:'12 ÷ 6 = 2 A',switch:'Closed path: the bulb lights.',failure:'Open path: both bulbs go out.',parallel:'Total: 3 Ω · 4 A',brightness:'Parallel: more power per bulb.',meter:'In series: current passes through it.',series:'3 + 6 = 9 Ω · 18 ÷ 9 = 2 A',resistance:'Double length → double resistance.',current:'8 C ÷ 5 s = 1.6 A'};
  const ask={ohm:'What is the current?',switch:'Close the switch. Does the bulb light?',failure:'Break A. What happens to B?',parallel:'Add a 6 Ω branch. Total resistance?',brightness:'Which bulbs will be brighter?',meter:'Where should the ammeter go?',series:'What is the current?',resistance:'Double the length. Resistance?',current:'8 C in 5 s. Average current?'};
  function circuit(w,variant,show,phase){
    const left=65,right=w-42,top=175,bottom=325,cy=250,c=w/2;
    const broken=variant==='failure'&&show&&p>=.45,closed=variant!=='switch'||show&&p>=.65;
    const active=closed&&!broken&&(show||variant==='failure'||variant==='voltage');
    const voltage=variant==='series'?18:variant==='voltage'?6+6*value:12;
    const amps=variant==='failure'?1:variant==='voltage'?voltage/6:2;
    const I=active?amps:0;
    let s=wire(left,cy-65,left,top,I,phase)+wire(left,top,right,top,I,phase)+wire(right,top,right,bottom,I,phase)+wire(right,bottom,left,bottom,I,phase)+wire(left,bottom,left,cy+65,I,phase)+supply(left,cy,Number(voltage.toFixed(1)));
    // Components cover their wire segments; open contacts have no hidden conductor.
    const cover=(x,r=46)=>rect(x-r,top-5,2*r,10,'#f7fafc','none',0);
    if(['ohm','voltage','series'].includes(variant)){
      const xs=variant==='series'?[w*.43,w*.76]:[w*.65];
      xs.forEach((x,i)=>{s+=cover(x)+resistor(x,top,variant==='series'&&i===0?'3 Ω':'6 Ω');});
      s+=meter(c+20,bottom,show||variant==='voltage'?`${Number(amps.toFixed(1))} A`:'? A');
    }else{
      if(variant==='switch'){const x=w*.38;s+=cover(x,38)+knife(x,top,show?Math.min(1,p/.65):0);}
      if(variant==='failure'){const x=w*.42;s+=cover(x,40)+bulb(x,top,broken?0:6,broken,'A');}
      const x=w*.76;s+=cover(x,40)+bulb(x,top,active?(variant==='failure'?6:24):0,false,variant==='failure'?'B':'');
      if(variant==='meter')s+=meter(c+20,show?bottom:bottom+65,show?'2 A':'A');
      else if(show)s+=meter(c+20,bottom,`${I} A`);
    }
    if(variant==='failure'||variant==='switch')s+=text(c,93,broken?'':variant==='switch'?(closed?'Closed switch':'Open switch'):'Two bulbs in series','small');
    s+=text(c,variant==='meter'&&!show?430:395,active?'→ Conventional current':show?'Current = 0':'','small');
    return s;
  }
  function branchScene(w,bulbs,show,phase){
    const l=60,b=155,r=w-30,x=(b+r)/2,y1=125,y2=255,bottom=325;
    const second=bulbs||show&&p>=.45,active=show;
    let s=wire(l,160,l,75,active?(second?4:2):0,phase)+wire(l,75,b,75,active?(second?4:2):0,phase)+wire(b,75,b,y1,active?(second?4:2):0,phase)+wire(r,y1,r,y2,active?2:0,phase)+wire(r,y2,r,bottom,active?(second?4:2):0,phase)+wire(r,bottom,l,bottom,active?(second?4:2):0,phase)+wire(l,bottom,l,290,active?(second?4:2):0,phase)+supply(l,225,12);
    for(const [y,on] of [[y1,true],[y2,second]])if(on){s+=wire(b,y,x-(bulbs?40:46),y,active?2:0,phase)+wire(x+(bulbs?40:46),y,r,y,active?2:0,phase)+(bulbs?bulb(x,y,show?24:0,false,show?'12 V · 24 W':'6 Ω'):resistor(x,y,'6 Ω'));if(show&&!bulbs)s+=text(x,y+38,'2 A','strong');}
    if(second)s+=wire(b,y1,b,y2,active?2:0,phase)+dot(b,y1,5,ink)+dot(r,y2,5,ink);
    if(!bulbs)s+=meter(w/2+20,bottom,second?'4 A':'2 A');
    return s;
  }
  function render(){
    const compact=innerWidth<=600,w=compact?480:800,c=w/2,show=answered;
    const phase=reduced.matches?0:control&&value!==target?t/600:answered&&p<1?p*1.5:0;
    let s=defs,h=500,description=control?'Change voltage; resistance stays 6 ohms.':ask[k];
    s+=text(c,35,control?'6 Ω stays fixed':ask[k],'strong');
    if(k==='parallel'){s+=branchScene(w,false,show,phase);s+=text(c,392,show?'Each branch still carries 2 A.':'One 6 Ω branch','small');}
    else if(k==='brightness'){
      h=compact?870:520;
      const pw=compact?w:400;
      for(const par of [false,true]){
        const x=compact?0:par?400:0,y=compact?(par?440:70):65;
        let part=text(pw/2,0,par?'B · Parallel':'A · Series','strong');
        if(par)part+=branchScene(pw,true,show,phase);
        else {const left=60,right=pw-30,top=125,bottom=325;part+=wire(left,160,left,top,show?1:0,phase)+wire(left,top,right,top,show?1:0,phase)+wire(right,top,right,bottom,show?1:0,phase)+wire(right,bottom,left,bottom,show?1:0,phase)+wire(left,bottom,left,290,show?1:0,phase)+supply(left,225,12);
          for(const bx of [pw*.47,pw*.79])part+=rect(bx-40,top-5,80,10,'#f7fafc','none',0)+bulb(bx,top,show?6:0,false,show?'6 V · 6 W':'6 Ω');
        }
        s+=`<g transform="translate(${x} ${y})">${part}</g>`;
      }
      s+=text(c,h-80,'Identical bulbs · fixed-resistance model','small');
    }else if(k==='resistance'){
      const x=65,unit=(w-130)/2;
      s+=text(c,78,'Same material, thickness and temperature','small');
      for(const [y,len,name] of [[160,unit,'L'],[285,unit*2,'2L']]){
        s+=`<g class="wire-sample" data-length="${len}">${rect(x,y-23,len,46,'url(#copper)','#8f5030',0)}<ellipse cx="${x+len}" cy="${y}" rx="9" ry="23" fill="#f6c293" stroke="#8f5030"/>${line(x+8,y-13,x+len-10,y-13,'#ffe0ba',3)}${text(x+len/2,y-39,name,'strong')}${show?text(x+len/2,y+58,name==='L'?'R':'2R','strong'):''}</g>`;
      }
    }else if(k==='current'){
      const y=205,left=35,right=w-35,travel=(w-100)*.42;
      s+=rect(left,y-45,right-left,90,'url(#copper)','#935637',12);
      s+=line(c,y-70,c,y+70,'#9c392b',3)+text(c,y+105,'Counting plane','small');
      const passed=show?Math.min(8,Math.floor(p*8+.5)):0;
      for(let i=0;i<8;i++){const cross=(i+.5)/8,px=c+(show?p:0)*travel-cross*travel;s+=`<g class="charge-packet" data-passed="${px>c}">${dot(px,y+(i%2?16:-16),9,'#eaf8fa',flow)}${text(px,y+(i%2?21:-11),'+','packet')}</g>`;}
      s+=text(c,105,show?`${passed} C crossed · ${(5*p).toFixed(1)} s`:'8 C crosses in 5 s','strong')+text(c,365,'Markers: 1 C each · time sped up','small');
    }else s+=circuit(w,k,show,phase);
    if(control)s+=text(c,450,changed?(target===0?'Baseline restored.':'Restore 6 V to compare.'):'Try 12 V.','strong');
    else if(show){s+=rect(8,h-67,w-16,60,correct?'#e6f4ed':'#fff0e8','none',8)+text(c,h-42,correct?'✓ CORRECT':'× NOT QUITE','strong')+text(c,h-17,result[k],'small');description+=' '+(correct?'Correct. ':'Not quite. ')+result[k];}
    if(control)description=`${Number((6+6*value).toFixed(1))} volts; 6 ohms; ${Number((1+value).toFixed(1))} amperes.`;
    svg.innerHTML=s;svg.setAttribute('viewBox',`0 0 ${w} ${h}`);svg.setAttribute('aria-label',description);svg.dataset.phase=control?'explore':answered?'feedback':'question';
    if((!control||value===target)&&status.textContent!==description)status.textContent=description;
  }
  function complete(){if(!done){done=true;parent.postMessage({type:'complete'},'*');}}
  function schedule(){if(!raf)raf=requestAnimationFrame(frame);}
  function frame(now){raf=0;const dt=last===null?0:Math.min(80,now-last);last=now;if(!document.hidden){t+=dt;if(control){const u=reduced.matches?1:Math.min(1,t/550);value=from+(target-from)*u;render();if(u<1)schedule();else if(changed&&target===0)complete();}else if(answered){const duration=k==='current'?1200:800;p=reduced.matches?1:Math.min(1,t/duration);render();if(t>=(reduced.matches?0:duration)+3000){complete();reset();}else schedule();}}else schedule();}
  function reset(){cancelAnimationFrame(raf);raf=0;last=null;t=p=0;answered=false;buttons.forEach(b=>b.disabled=false);if(control){value=from=target=0;changed=false;control.value='0';}render();}
  buttons.forEach(b=>b.addEventListener('click',()=>{if(answered)return;answered=true;correct=+b.dataset.choice===L.correct;p=reduced.matches?1:0;t=0;last=null;buttons.forEach(b=>b.disabled=true);render();schedule();}));
  control?.addEventListener('change',()=>{from=value;target=+control.value;if(target===1)changed=true;t=0;last=null;render();schedule();});
  document.getElementById('replay').addEventListener('click',reset);addEventListener('resize',render);document.addEventListener('visibilitychange',()=>last=null);reduced.addEventListener('change',()=>{render();if(answered||control&&value!==target)schedule();});render();
})();
