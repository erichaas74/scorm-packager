from pathlib import Path
p=Path('problem-walkthoughs/unit 6/sphere-contact.js')
s=p.read_text(encoding='utf-8-sig')
a=s.index('  function model(t)');b=s.index("  if(typeof module",a)
s=s[:a]+'''  function model(t,a=6,b=-2){const f=clamp((t-5)/7),delta=(a-b)/2;return {t,f,qA:a-delta*f,qB:b+delta*f,total:a+b,direction:Math.sign(delta),contact:t>=5&&t<=15,flow:t>=5&&t<12&&delta!==0,approach:t<5?clamp((t-3)/2):t<15?1:1-clamp((t-15)/2),phase:t<3?'setup':t<5?'approach':t<12?'transfer':t<15?'equilibrium':t<17?'separate':'result'};}
'''+s[b:]
s=s.replace("let elapsed=0,last=null,raf=0,completed=false,lastPhase='';", "let elapsed=0,last=null,raf=0,completed=false,lastPhase='',running=false;\n  const inputA=document.getElementById('charge-a'),inputB=document.getElementById('charge-b'),run=document.getElementById('run');")
s=s.replace("${text(cx,cy+8,label,'value')}${text(cx,cy-r-22,signed(q),'value')}","${text(cx,cy-r-18,label,'value')}${text(cx,cy+9,signed(q),'value')}${surface(cx,cy,r,q)}")
pos=s.index('  function sphere')
s=s[:pos]+'''  function surface(cx,cy,r,q){let out='';const n=Math.round(Math.abs(q));for(let i=0;i<n;i++){const theta=-Math.PI/2+i*2*Math.PI/n,x=cx+Math.cos(theta)*r*.79,y=cy+Math.sin(theta)*r*.79;out+=`<circle cx="${x}" cy="${y}" r="9" fill="${q>0?'#935023':'#126f86'}"/><text x="${x}" y="${y+5}" text-anchor="middle" style="fill:white;font-size:16px;font-weight:bold">${q>0?'+':'−'}</text>`;}return out;}
'''+s[pos:]
s=s.replace('m=model(rt),','m=model(rt,Number(inputA.value),Number(inputB.value)),')
s=s.replace("const title={setup:'Before contact',approach:'Bring the spheres together',transfer:'Electrons move from B to A',equilibrium:'Equal potential: net flow stops',separate:'Separate the spheres',result:'Both spheres are now positive'}[m.phase];", "const direction=m.direction>0?'B to A':'A to B';\n    const title={setup:'Set charges, then touch the spheres',approach:'Bring the spheres together',transfer:m.direction?'Electrons move from '+direction:'Equal charges: no net transfer',equilibrium:'Equal potential: net flow stops',separate:'Separate the spheres',result:'Each sphere: '+signed(m.total/2)}[m.phase];\n    const summary=title+'. A: '+signed(m.qA)+'. B: '+signed(m.qB)+'. Total: '+signed(m.total)+'.';")
s=s.replace('${descriptions[m.phase]}','${summary}').replace("'Total charge: +4.0 nC'","'Total charge: '+signed(m.total)")
s=s.replace('let x=mid+iw*.42-travel*iw*.84;', 'let x=mid+(iw*.42-travel*iw*.84)*(m.direction||1);')
s=s.replace('${mid+70} ${iy+146}H${mid-70}','${mid+70*m.direction} ${iy+146}H${mid-70*m.direction}')
a=s.index('    const explanation=');b=s.index('\n    out+=',a)
s=s[:a]+'''    const explanation=m.phase==='result'||m.phase==='separate'?'Final charge = total charge ÷ 2.':m.phase==='equilibrium'?'Equal potential + symmetry → equal charge.':m.phase==='transfer'?(m.direction>0?'A gains electrons; B loses electrons.':m.direction<0?'B gains electrons; A loses electrons.':'No net electron transfer is needed.'):'No electron transfer across the gap.';'''+s[b:]
s=s.replace("'Unequal sizes can share unequally.'", "'Surface signs show net charge, not protons.'")
s=s.replace('status.textContent=descriptions[m.phase]','status.textContent=summary')
a=s.index('  function tick(now)');s=s[:a]+'''  function tick(now){const dt=last===null?0:Math.min((now-last)/1000,.1);last=now;if(running&&!document.hidden){elapsed+=dt;if(elapsed>=23){elapsed=23;running=false;run.disabled=false;if(!completed){completed=true;window.parent.postMessage({type:'complete'},'*');}}render();}raf=requestAnimationFrame(tick);}
  function reset(){elapsed=0;last=null;lastPhase='';running=false;run.disabled=false;render();}
  for(const input of [inputA,inputB])input.addEventListener('input',()=>{document.getElementById(input.id+'-value').textContent=signed(Number(input.value));reset();});
  run.addEventListener('click',()=>{elapsed=3;last=null;lastPhase='';running=true;run.disabled=true;render();});
  document.getElementById('replay').addEventListener('click',reset);
  document.addEventListener('visibilitychange',()=>{last=null;});reduced.addEventListener('change',reset);addEventListener('resize',render);render();raf=requestAnimationFrame(tick);
})();
'''
p.write_text(s,encoding='utf-8')
p=Path('problem-walkthoughs/unit 6/charge-conservation-metal-spheres.html');s=p.read_text(encoding='utf-8-sig');s=s.replace('<button id="replay" type="button">Replay</button>', '''<div class="controls"><label for="charge-a">Sphere A <output id="charge-a-value">+6.0 nC</output><input id="charge-a" type="range" min="-8" max="8" step="1" value="6"></label><label for="charge-b">Sphere B <output id="charge-b-value">−2.0 nC</output><input id="charge-b" type="range" min="-8" max="8" step="1" value="-2"></label></div><button id="run" type="button">Touch spheres</button> <button id="replay" type="button">Reset trial</button>''');s=s.replace('</style>', '''.controls{display:flex;gap:18px;margin-top:6px}.controls label{flex:1;min-width:0;font-size:14px;font-weight:650}.controls output{float:right}.controls input{display:block;width:100%;min-height:32px;accent-color:#285f9f}.spheres button:disabled{opacity:.6;cursor:default}.spheres svg .value{font-size:24px}
</style>''');p.write_text(s,encoding='utf-8')
