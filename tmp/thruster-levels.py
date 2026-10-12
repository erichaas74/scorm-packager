from pathlib import Path
p=Path('problem-walkthoughs/unit 4/orbit-thruster-direction.html');s=p.read_text(encoding='utf-8')
s=s.replace('</header><div class="space">','</header><nav class="levels" aria-label="Choose level"><button id="level1" aria-pressed="true">Level 1 · Try controls</button><button id="level2" aria-pressed="false">Level 2 · Match transfer</button></nav><div class="space">')
s=s.replace('<path id="preview"','<circle id="target" cx="250" cy="220" r="180" fill="none" stroke="#ffd16f" stroke-width="2" stroke-dasharray="6 6" visibility="hidden"/><path id="transfer-guide" fill="none" stroke="#ffd16f" stroke-width="2" stroke-dasharray="5 6"/><circle id="burn2-dot" cx="70" cy="220" r="5" fill="#ffd16f" visibility="hidden"/><path id="preview"',1)
s=s.replace('<p class="instruction">','<p class="instruction" id="instruction">',1).replace('<p class="key">','<div class="level-actions"><button id="continue" hidden>Level 2 →</button><button id="skip" hidden>Go to second burn →</button></div><p class="key" id="key">',1)
s=s.replace('</style>','''.levels{display:flex;gap:8px;padding:0 20px 14px}.levels button{font-size:13px}.level-actions{text-align:center;margin-top:12px}.level-actions button{min-height:44px;font-size:13px}button:disabled{opacity:.45;cursor:default}[hidden]{display:none!important}.instruction{min-height:40px;margin-bottom:8px}.levels button[aria-pressed=true]{background:#176b80;color:#fff}
</style>''')
s=s.replace("function choose(name,interacted=true)","function explore(name,interacted=true)")
s=s.replace("if(seen.size===4&&!sent){window.parent.postMessage({ type: 'complete' }, '*');sent=true;}","$('continue').hidden=seen.size!==4;finish();")
s=s.replace("function frame(now)",'''let level=1,stage='ready',transferComplete=false;
function finish(){if(seen.size===4&&transferComplete&&!sent){window.parent.postMessage({ type: 'complete' }, '*');sent=true;}}
function transfer(){const a=1.5,e=1/3;return Array.from({length:1201},(_,i)=>{const M=Math.PI*i/1200;let E=M;for(let n=0;n<8;n++)E-=(E-e*Math.sin(E)-M)/(1-e*Math.cos(E));const rate=1/Math.sqrt(a**3)/(1-e*Math.cos(E));return {x:a*(Math.cos(E)-e),y:a*Math.sqrt(1-e*e)*Math.sin(E),vx:-a*Math.sin(E)*rate,vy:a*Math.sqrt(1-e*e)*Math.cos(E)*rate};});}
function panel(far=false){const arrows=far?{forward:'↓',backward:'↑',inward:'→',outward:'←'}:{forward:'↑',backward:'↓',inward:'←',outward:'→'};document.querySelectorAll('[data-direction]').forEach(b=>{b.disabled=stage==='coast'&&b.dataset.direction!=='none';b.setAttribute('aria-pressed','false');if(arrows[b.dataset.direction])b.firstChild.textContent=arrows[b.dataset.direction];});}
function setLevel(n){level=n;stage='ready';$('level1').setAttribute('aria-pressed',String(n===1));$('level2').setAttribute('aria-pressed',String(n===2));$('target').setAttribute('visibility',n===2?'visible':'hidden');$('burn2-dot').setAttribute('visibility',n===2?'visible':'hidden');$('transfer-guide').setAttribute('d',n===2?path(transfer()):'');$('skip').hidden=true;$('continue').hidden=n!==1||seen.size!==4;panel();
 if(n===1){$('instruction').textContent='Try all four pushes. Each starts at the gold dot.';$('key').textContent='Gold arrow = push · Dashed circle = original orbit';explore('none',false);}
 else {points=[{x:1,y:0,vx:0,vy:1}];cursor=0;paused=true;label();$('preview').setAttribute('d','');$('thrust-arrow').setAttribute('d','');$('status').textContent='Burn 1 of 2';$('instruction').textContent='Match the gold path. Which push starts the transfer?';$('key').textContent='Hohmann transfer · Choose the direction; burn strength is set.';draw();}
}
function arrival(){cursor=points.length-1;stage='arrival';paused=true;label();$('skip').hidden=true;$('status').textContent='Burn 2 of 2';$('instruction').textContent='At the far side, choose a push to join the gold circle.';panel(true);draw();}
function choose(name,interacted=true){if(level===1){explore(name,interacted);return;}if(name==='none'){setLevel(2);return;}if(stage==='coast'||stage==='done')return;
 if(name!=='forward'){$('instruction').textContent=stage==='ready'?'Not a match. Try pushing along the spacecraft’s motion.':'Not a match. The spacecraft needs more speed along its motion.';return;}
 if(stage==='ready'){stage='coast';points=transfer();cursor=0;paused=false;label();$('status').textContent='Coasting';$('instruction').textContent='Matched! Coast to the second gold dot.';$('thrust-arrow').setAttribute('d','M340 220l0 -45');$('skip').hidden=false;panel();draw();}
 else {stage='done';points=Array.from({length:2401},(_,i)=>{const a=Math.PI+i*2*Math.PI/2400;return {x:2*Math.cos(a),y:2*Math.sin(a),vx:-Math.sin(a)/Math.sqrt(2),vy:Math.cos(a)/Math.sqrt(2)};});cursor=0;paused=false;label();$('thrust-arrow').setAttribute('d','M70 220l0 45');$('status').textContent='Transfer matched!';$('instruction').textContent='Two forward pushes. One higher circular orbit.';transferComplete=true;finish();panel(true);document.querySelectorAll('[data-direction]').forEach(b=>b.disabled=b.dataset.direction!=='none');draw();}
}
$('level1').onclick=()=>setLevel(1);$('level2').onclick=$('continue').onclick=()=>setLevel(2);$('skip').onclick=arrival;
function frame(now)''')
a=s.index('function frame(now)');s=s[:a]+'''function frame(now){if(!paused&&!document.hidden){const step=Math.min(now-last,50)*.24;if(level===2&&stage==='coast'){cursor=Math.min(points.length-1,cursor+step);draw();if(cursor>=points.length-1)arrival();}else if(points.length>1){cursor=(cursor+step)%(points.length-1);draw();}}last=now;requestAnimationFrame(frame);}setLevel(1);label();requestAnimationFrame(frame);
</script></body></html>
'''
p.write_text(s,encoding='utf-8')
p=Path('problem-walkthoughs/index.html');s=p.read_text(encoding='utf-8').replace('Push forward, backward, inward, or outward and watch the orbit change.','Try four thruster directions, then match a two-burn Hohmann transfer.');p.write_text(s,encoding='utf-8')
