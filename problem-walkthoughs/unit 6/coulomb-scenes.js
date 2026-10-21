(() => {
  'use strict';
  const lesson=window.walkthroughLesson, svg=document.getElementById('scene');
  const status=document.getElementById('status'), control=document.getElementById('parameter');
  const buttons=[...document.querySelectorAll('[data-choice]')];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const key=control?lesson.variant==='charge'?'charge':'distance':lesson.variant;
  const magenta='#a12979', green='#08764e', ink='#172f46';
  let answered=false, correct=false, elapsed=0, progress=0, setting=0, from=0, target=0, changed=false, completed=false, last=null, raf=0;
  const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;');
  const text=(x,y,s,cls='')=>`<text x="${x}" y="${y}" text-anchor="middle" class="${cls}">${esc(s)}</text>`;
  const line=(x,y,x2,y2,c='#9bafbf',sw=1.5)=>`<line x1="${x}" y1="${y}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${sw}"/>`;
  const circle=(x,y,r,fill,stroke='none')=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}"/>`;
  const defs=`<defs><radialGradient id="warm" cx="30%" cy="24%" r="80%"><stop stop-color="#fff9ec"/><stop offset=".4" stop-color="#f7ce9d"/><stop offset=".8" stop-color="#c58150"/><stop offset="1" stop-color="#875139"/></radialGradient><radialGradient id="metal" cx="30%" cy="24%" r="80%"><stop stop-color="#fff"/><stop offset=".38" stop-color="#cbd8e1"/><stop offset=".72" stop-color="#748b9d"/><stop offset="1" stop-color="#405a6f"/></radialGradient><radialGradient id="cloud"><stop stop-color="#f9fdff"/><stop offset=".65" stop-color="#dceffa"/><stop offset="1" stop-color="#b1d5eb" stop-opacity=".5"/></radialGradient><linearGradient id="glass"><stop stop-color="#84aab9"/><stop offset=".5" stop-color="#edfcff"/><stop offset="1" stop-color="#86a8b6"/></linearGradient></defs>`;
  function force(x,y,length,color=magenta,name='force'){
    if(Math.abs(length)<.2)return '';
    const end=x+length,dir=Math.sign(length),head=Math.min(9,Math.abs(length)*.45);
    return `<g class="cf-force" data-kind="${name}" data-length="${Math.abs(length)}" data-x="${x}" data-y="${y}" data-direction="${dir}">${line(x,y,end,y,'#fff',8)}${line(x,y,end,y,color,4)}<path d="M${end-dir*head} ${y-head*.58}L${end} ${y}L${end-dir*head} ${y+head*.58}" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round"/>${circle(x,y,3,color)}</g>`;
  }
  function sphere(x,y,r,n=6,neutral=false){
    let s=`<g class="cf-sphere" data-x="${x}" data-y="${y}" data-charge-markers="${neutral?0:n}"><ellipse cx="${x}" cy="${y+r+30}" rx="${r*.85}" ry="5" fill="#ccd9e2" opacity=".55"/><rect x="${x-5}" y="${y+r-4}" width="10" height="30" rx="3" fill="url(#glass)" stroke="#88a9b6"/>${line(x-20,y+r+28,x+20,y+r+28,'#6b8497',4)}${circle(x,y,r,neutral?'url(#metal)':'url(#warm)',neutral?'#526d82':'#945d3e')}<path d="M${x-r*.65} ${y-r*.22}Q${x-r*.6} ${y-r*.67} ${x-r*.22} ${y-r*.76}" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`;
    if(!neutral)for(let i=0;i<n;i++){
      const a=2*Math.PI*i/n+Math.PI/6,px=x+r*.66*Math.cos(a),py=y+r*.66*Math.sin(a);
      s+=`<g class="cf-plus">${circle(px,py,4.5,'#fff0d6','#a26540')}${line(px-2.5,py,px+2.5,py,'#884529',1.2)}${line(px,py-2.5,px,py+2.5,'#884529',1.2)}</g>`;
    }
    return s+'</g>';
  }
  function dimension(x1,x2,y,label){return line(x1,y-6,x1,y+6)+line(x2,y-6,x2,y+6)+line(x1,y,x2,y)+text((x1+x2)/2,y-10,label,'small');}
  function atom(cx,cy){
    let s=circle(cx,cy,95,'url(#cloud)','#9cbfd7');
    for(let i=0;i<85;i++){const a=i*2.39996,r=87*Math.sqrt((i+.5)/85);s+=circle(cx+r*Math.cos(a),cy+r*Math.sin(a),1.2,'#82afce');}
    for(let i=0;i<6;i++){
      const a=i*Math.PI/3,x=cx+18*Math.cos(a),y=cy+18*Math.sin(a);
      s+=`<g class="cf-proton">${circle(x,y,9,'url(#warm)','#9a613e')}${line(x-4,y,x+4,y,'#7a371c',1.5)}${line(x,y-4,x,y+4,'#7a371c',1.5)}</g>`;
      s+=circle(cx+8*Math.cos(a+.5),cy+8*Math.sin(a+.5),4.5,'url(#metal)','#526d82');
    }
    for(let i=0;i<7;i++){const a=i*2*Math.PI/7-.3,x=cx+80*Math.cos(a),y=cy+80*Math.sin(a);s+=`<g class="cf-electron">${circle(x,y,9,'#195686','#fff')}${line(x-4,y,x+4,y,'#fff',2)}</g>`;}
    return s;
  }
  const outcomes={gravity:'Electric force can push apart.',balance:'Midpoint: net force = 0.',force:'Net force: right.',count:'Net charge = −e.'};
  const questions={gravity:'Which can push apart?',balance:'Where is the net force zero?',force:'Which way is the net force?',count:'What is the net charge?'};
  function render(){
    const compact=innerWidth<=600,w=compact?420:720,c=w/2;
    let s=defs,height=400,description='';
    if(control){
      const q=key==='charge'?1+setting:1,r=key==='distance'?1+setting:1;
      const f=9*q/(r*r),unit=compact?120:180,x1=c-unit*r/2,x2=c+unit*r/2,y=155,radius=compact?39:53;
      const length=(compact?44:65)*f/9;
      s+=text(c,32,key==='charge'?'Change q₁ · keep q₂ and r fixed':'Change r · keep both charges fixed','small');
      s+=sphere(x1,y,radius,Math.round(6*q))+sphere(x2,y,radius);
      s+=text(x1,y-radius-20,`+${q.toFixed(q%1?1:0)} μC`,'strong')+text(x2,y-radius-20,'+1 μC','strong');
      s+=force(x1,y,-length)+force(x2,y,length);
      const value=Number(f.toFixed(2))+' mN';
      s+=text(x1,y+radius+56,value,'strong')+text(x2,y+radius+56,value,'strong');
      s+=dimension(x1,x2,290,`${Number(r.toFixed(2))} m`);
      const instruction=changed?(target===0?'Baseline restored.':key==='charge'?'Restore 1 μC to compare.':'Restore 1 m to compare.'):key==='charge'?'Try 2 μC.':'Try 2 m.';
      s+=text(c,340,instruction,'strong');
      s+=text(c,375,key==='charge'?'1 μC → 9 mN':'1 m → 9 mN','small');
      description=`${Number(q.toFixed(2))} microcoulombs, separation ${Number(r.toFixed(2))} meters. Equal opposite forces, ${value} each. ${instruction}`;
    }else{
      s+=text(c,32,questions[key],'strong');
      if(key==='gravity'){
        height=450;
        const r=compact?36:43,x1=w*.29,x2=w*.71;
        for(const [y,neutral,label] of [[135,false,'Like charges (+ / +)'],[305,true,'Two masses']]){
          s+=text(c,y-62,label,'small')+sphere(x1,y,r,6,neutral)+sphere(x2,y,r,6,neutral);
          if(answered){const len=(compact?46:67)*progress,dir=neutral?1:-1;s+=force(x1,y,dir*len,neutral?green:magenta)+force(x2,y,-dir*len,neutral?green:magenta);}
        }
      }else if(key==='count'){
        s+=atom(c,167)+text(c,295,'6 protons · 7 electrons','strong');
      }else{
        const y=175,a=w*.19,b=w*.81,r=compact?32:46,t=compact?27:38;
        s+=text(a,95,key==='force'?'+2 μC':'+Q','strong')+text(b,95,key==='force'?'+1 μC':'+Q','strong')+text(c,115,'+q','strong');
        s+=sphere(a,y,r,key==='force'?12:6)+sphere(b,y,r)+sphere(c,y,t,4);
        s+=dimension(a,c,278,'r')+dimension(c,b,278,'r');
        if(answered){
          const base=compact?36:58,right=base*(key==='force'?2:1),left=base;
          s+=force(c,y-8,right*progress)+force(c,y-8,-left*progress);
          s+=text(c+right/2,y-27,key==='force'?'2F':'F','small')+text(c-left/2,y-27,'F','small');
          if(key==='force')s+=force(c,y+12,base*progress,ink,'net');
          s+=text(c,320,key==='force'?'Net: F →':'Net: 0','strong');
        }
      }
      if(answered){
        const color=correct?'#096747':'#943522';
        s+=`<rect x="8" y="${height-64}" width="${w-16}" height="58" rx="8" fill="${correct?'#e6f4ed':'#fff0e8'}"/>`;
        s+=text(c,height-40,correct?'✓ CORRECT':'× NOT QUITE','strong').replace('<text ',`<text style="fill:${color}" `)+text(c,height-15,outcomes[key],'small');
      }
      description=questions[key]+(answered?' '+(correct?'Correct. ':'Not quite. ')+outcomes[key]:key==='count'?' Six protons and seven electrons.':key==='force'?' +2 microcoulombs at left; +1 microcoulomb at right, equal distances from +q.':key==='balance'?' Two equal positive fixed charges.':' Like positive charges and two neutral masses.');
    }
    svg.setAttribute('viewBox',`0 0 ${w} ${height}`);svg.innerHTML=s;
    svg.dataset.phase=control?'explore':answered?'feedback':'question';
    svg.setAttribute('aria-label',description);
    // Announce settled control results once, not every interpolated animation frame.
    if((!control||setting===target)&&status.textContent!==description)status.textContent=description;
  }
  function complete(){if(!completed){completed=true;window.parent.postMessage({type:'complete'},'*');}}
  function schedule(){if(!raf)raf=requestAnimationFrame(frame);}
  function frame(now){
    raf=0;const dt=last===null?0:Math.min(now-last,80);last=now;
    if(!document.hidden){
      elapsed+=dt;
      if(control){const p=reduced.matches?1:Math.min(1,elapsed/550);setting=from+(target-from)*(p*p*(3-2*p));render();if(p<1)schedule();else if(changed&&target===0)complete();}
      else if(answered){progress=reduced.matches?1:Math.min(1,elapsed/500);render();if(elapsed>=(reduced.matches?3000:3500)){complete();reset();}else schedule();}
    }else schedule();
  }
  function reset(){cancelAnimationFrame(raf);raf=0;last=null;elapsed=0;answered=false;progress=0;buttons.forEach(b=>b.disabled=false);if(control){setting=from=target=0;control.value='0';changed=false;}render();}
  buttons.forEach(b=>b.addEventListener('click',()=>{if(answered)return;answered=true;correct=Number(b.dataset.choice)===lesson.correct;elapsed=0;last=null;progress=reduced.matches?1:0;buttons.forEach(b=>b.disabled=true);render();schedule();}));
  control?.addEventListener('change',()=>{from=setting;target=Number(control.value);if(target===1)changed=true;elapsed=0;last=null;render();schedule();});
  document.getElementById('replay').addEventListener('click',reset);
  addEventListener('resize',render);reduced.addEventListener('change',()=>{render();if(answered||control&&setting!==target)schedule();});
  document.addEventListener('visibilitychange',()=>{last=null;});
  render();
})();
