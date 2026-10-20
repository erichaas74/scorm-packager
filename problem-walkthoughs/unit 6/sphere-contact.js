(() => {
  'use strict';
  const clamp=x=>Math.max(0,Math.min(1,x));
  function model(t,a=6,b=-2){const f=clamp((t-5)/7),delta=(a-b)/2;return {t,f,qA:a-delta*f,qB:b+delta*f,total:a+b,direction:Math.sign(delta),contact:t>=5&&t<=15,flow:t>=5&&t<12&&delta!==0,approach:t<5?clamp((t-3)/2):t<15?1:1-clamp((t-15)/2),phase:t<3?'setup':t<5?'approach':t<12?'transfer':t<15?'equilibrium':t<17?'separate':'result'};}
  if(typeof module!=='undefined')module.exports={model};
  if(typeof document==='undefined')return;
  const svg=document.getElementById('scene'),status=document.getElementById('status'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let elapsed=0,last=null,raf=0,completed=false,lastPhase='',running=false;
  const inputA=document.getElementById('charge-a'),inputB=document.getElementById('charge-b'),run=document.getElementById('run');
  const signed=q=>{const n=Math.round(q*10)/10;return (n===0?'':n>0?'+':'−')+Math.abs(n).toFixed(1)+' nC';};
  const text=(x,y,s,cls='',anchor='middle')=>`<text x="${x}" y="${y}" text-anchor="${anchor}" class="${cls}">${s}</text>`;
  function surface(cx,cy,r,q){let out='';const n=Math.round(Math.abs(q));for(let i=0;i<n;i++){const top=Math.ceil(n/2),upper=i<top,count=upper?top:n-top,j=upper?i:i-top,theta=(upper?-3:1)*Math.PI/4+(count===1?Math.PI/4:j*Math.PI/2/(count-1)),x=cx+Math.cos(theta)*r*.79,y=cy+Math.sin(theta)*r*.79;out+=`<circle cx="${x}" cy="${y}" r="9" fill="${q>0?'#935023':'#126f86'}"/><text x="${x}" y="${y+5}" text-anchor="middle" style="fill:white;font-size:16px;font-weight:bold">${q>0?'+':'−'}</text>`;}return out;}
  function sphere(cx,cy,r,label,q){return `<g><ellipse cx="${cx}" cy="${cy+r+87}" rx="${r*.9}" ry="9" fill="#dbe3e9"/><path d="M${cx-12} ${cy+r-4}L${cx-15} ${cy+r+65}Q${cx} ${cy+r+74} ${cx+15} ${cy+r+65}L${cx+12} ${cy+r-4}Z" fill="url(#glass)" stroke="#78979e"/><path d="M${cx-42} ${cy+r+64}Q${cx} ${cy+r+56} ${cx+42} ${cy+r+64}L${cx+47} ${cy+r+80}Q${cx} ${cy+r+91} ${cx-47} ${cy+r+80}Z" fill="url(#base)" stroke="#677e8f"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#metal)" stroke="#4e677c" stroke-width="1.7"/><path d="M${cx-r*.72} ${cy-r*.2}A${r*.76} ${r*.76} 0 0 1 ${cx+r*.16} ${cy-r*.76}" fill="none" stroke="#fff" stroke-width="4" opacity=".85"/>${text(cx,cy-r-18,label,'value')}${text(cx,cy+9,signed(q),'value')}${surface(cx,cy,r,q)}</g>`;}
  function render(){
    const compact=svg.clientWidth<600,W=compact?420:880;
    const rt=reduced.matches?(elapsed<4?0:elapsed<9?8.5:elapsed<14?13:19):elapsed,m=model(rt,Number(inputA.value),Number(inputB.value)),r=compact?60:83,cy=compact?150:168;
    const rest=compact?105:235,cxA=rest+(W/2-r-rest)*m.approach,cxB=W-cxA,iy=compact?390:420,ix=compact?15:150,iw=compact?390:580,mid=W/2;
    const direction=m.direction>0?'B to A':'A to B';
    const title={setup:'Set charges, then touch the spheres',approach:'Bring the spheres together',transfer:m.direction?'Electrons move from '+direction:'Equal charges: no net transfer',equilibrium:'Equal potential: net flow stops',separate:'Separate the spheres',result:'Each sphere: '+signed(m.total/2)}[m.phase];
    const summary=title+'. A: '+signed(m.qA)+'. B: '+signed(m.qB)+'. Total: '+signed(m.total)+'.';
    let out=`<title id="scene-title">Two identical conductors exchange electrons</title><desc id="scene-desc">${summary} ${signed(m.qA)} on A; ${signed(m.qB)} on B. Representative particles and slowed motion.</desc><defs><radialGradient id="metal" cx="30%" cy="22%" r="80%"><stop stop-color="#fff"/><stop offset=".32" stop-color="#e6edf1"/><stop offset=".57" stop-color="#aabac5"/><stop offset=".78" stop-color="#dce5ea"/><stop offset="1" stop-color="#708798"/></radialGradient><linearGradient id="glass"><stop stop-color="#94b7bd"/><stop offset=".38" stop-color="#f1fbfc"/><stop offset=".65" stop-color="#c0d9dc"/><stop offset="1" stop-color="#789ca5"/></linearGradient><linearGradient id="base" x2="0" y2="1"><stop stop-color="#e2e9ee"/><stop offset="1" stop-color="#8196a5"/></linearGradient><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#126f86"/></marker></defs>${text(mid,29,title,'caption')}${sphere(cxA,cy,r,'A',m.qA)}${sphere(cxB,cy,r,'B',m.qB)}${text(mid,compact?324:367,'Total charge: '+signed(m.total),'caption')}${text(mid,compact?351:393,'Identical spheres • insulating stands','small')}`;
    if(m.contact)out+=`<circle cx="${mid}" cy="${cy}" r="12" fill="none" stroke="#126f86" stroke-width="2"/><path d="M${mid-8} ${cy+10}L${ix+iw*.35} ${iy}M${mid+8} ${cy+10}L${ix+iw*.65} ${iy}" fill="none" stroke="#638b98" stroke-dasharray="4 5"/>`;
    out+=`<rect x="${ix}" y="${iy}" width="${iw}" height="174" rx="15" fill="#eef4f7" stroke="#95acb9"/>${text(mid,iy+26,m.contact?'Contact region, enlarged':'Surface detail, enlarged','caption')}`;
    const gap=m.contact?0:24;
    out+=`<path d="M${mid-gap/2} ${iy+40}V${iy+136}M${mid+gap/2} ${iy+40}V${iy+136}" stroke="#708998" stroke-width="2"/>`;
    if(gap)out+=`<rect x="${mid-gap/2+1}" y="${iy+40}" width="${gap-2}" height="96" fill="white"/>`;
    for(const side of [-1,1])for(let col=0;col<3;col++)for(let row=0;row<2;row++){const x=mid+side*(35+col*(compact?46:65)),y=iy+60+row*52;out+=`<circle cx="${x}" cy="${y}" r="11" fill="#e9d5bf" stroke="#916239"/>${text(x,y+6,'+','small')}`;}
    for(let i=0;i<6;i++){const travel=m.flow?(reduced.matches?(i+.5)/6:((rt-5)*.32+i/6)%1):(i+.5)/6;let x=mid+(iw*.42-travel*iw*.84)*(m.direction||1);if(!m.contact&&Math.abs(x-mid)<25)x+=x>=mid?30:-30;const y=iy+86;out+=`<circle cx="${x}" cy="${y}" r="8" fill="#126f86" stroke="#fff" stroke-width="1.3"/><path d="M${x-3} ${y}h6" stroke="white" stroke-width="1.6"/>`;}
    if(m.flow)out+=`<path d="M${mid+70*m.direction} ${iy+146}H${mid-70*m.direction}" stroke="#126f86" stroke-width="2.6" marker-end="url(#arrow)"/>`;
    out+=text(ix+18,iy+159,'A','small','start')+text(ix+iw-18,iy+159,'B','small','end');
    const footer=iy+199;
    out+=text(mid,footer,'Blue −: electrons • Tan +: fixed ions','small');
    const explanation=m.phase==='result'||m.phase==='separate'?'Final charge = total charge ÷ 2.':m.phase==='equilibrium'?'Equal potential + symmetry → equal charge.':m.phase==='transfer'?(m.direction>0?'A gains electrons; B loses electrons.':m.direction<0?'B gains electrons; A loses electrons.':'No net electron transfer is needed.'):'No electron transfer across the gap.';
    out+=text(mid,footer+29,explanation,compact?'small':'caption')+text(mid,footer+56,'Isolated pair; symmetric surroundings.','small')+text(mid,footer+80,'Slowed motion; representative particles.','small')+text(mid,footer+103,'Surface signs show net charge, not protons.','small');
    svg.setAttribute('viewBox',`0 0 ${W} ${footer+119}`);svg.innerHTML=out;svg.dataset.phase=m.phase;svg.dataset.qa=m.qA;svg.dataset.qb=m.qB;
    if(lastPhase!==m.phase){status.textContent=summary;lastPhase=m.phase;}
  }
  function tick(now){const dt=last===null?0:Math.min((now-last)/1000,.1);last=now;if(running&&!document.hidden){elapsed+=dt;if(elapsed>=23){elapsed=23;running=false;run.disabled=false;if(!completed){completed=true;window.parent.postMessage({type:'complete'},'*');}}render();}raf=requestAnimationFrame(tick);}
  function reset(){elapsed=0;last=null;lastPhase='';running=false;run.disabled=false;render();}
  for(const input of [inputA,inputB])input.addEventListener('input',()=>{document.getElementById(input.id+'-value').textContent=signed(Number(input.value));reset();});
  run.addEventListener('click',()=>{elapsed=3;last=null;lastPhase='';running=true;run.disabled=true;render();});
  document.getElementById('replay').addEventListener('click',reset);
  document.addEventListener('visibilitychange',()=>{last=null;});reduced.addEventListener('change',reset);addEventListener('resize',render);render();raf=requestAnimationFrame(tick);
})();