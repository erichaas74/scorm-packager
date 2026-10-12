from pathlib import Path
p=Path('problem-walkthoughs/unit 4/orbit-energy-outcomes.html');s=p.read_text(encoding='utf-8')
a=s.index('<svg viewBox=');b=s.index('</svg>',a)+6
svg=s[a:b]
import re
svg=re.sub(r'<circle id="target-orbit"[^>]*/>','',svg)
svg=re.sub(r'<path id="planned"[^>]*/>','',svg)
svg=re.sub(r'<g id="burn-markers".*?</g>','',svg)
svg=svg.replace('<desc id="scene-desc"></desc>','<desc id="scene-desc">A spacecraft circles Earth. Choose a slower or faster sideways speed to compare its path.</desc>')
html='''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Faster or Slower?</title><style>
*{box-sizing:border-box}html,body{background:transparent;margin:0}body{font:15px/1.5 system-ui,sans-serif;color:#193b50;padding:10px}main{max-width:760px;margin:auto;background:#fff;border:1px solid #dce5eb;border-radius:18px;overflow:hidden}header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:18px 22px}h1{font-size:clamp(22px,4vw,28px);margin:0}.status{font-size:13px;font-weight:650;color:#236c7f}.space{background:#0b2035}.space svg{display:block;width:100%;max-height:490px}.controls{display:flex;gap:10px;padding:18px 22px}button{flex:1;font:650 15px system-ui;min-height:48px;padding:10px;border:1px solid #b5ccd6;border-radius:10px;background:#fff;color:#193b50;cursor:pointer}button[aria-pressed=true]{background:#176b80;border-color:#176b80;color:#fff}button:hover{box-shadow:0 0 0 2px #176b8020}button:focus-visible{outline:3px solid #b87517;outline-offset:3px}.play{flex:0 0 44px;min-height:38px;padding:4px;font-size:17px;border:0;background:#eff5f7}.header-right{display:flex;align-items:center;gap:10px}@media(max-width:420px){body{padding:6px}header{padding:14px;flex-wrap:wrap;gap:6px}.controls{padding:14px;gap:7px}button{font-size:13px}.status{font-size:12px}}
</style></head><body><main><header><h1>Faster or slower?</h1><div class="header-right"><span id="status" class="status" role="status">Same circular path</span><button id="play" class="play" aria-label="Pause animation" title="Pause animation">&#10074;&#10074;</button></div></header><div class="space">'''+svg+'''</div><div class="controls" aria-label="Choose sideways speed"><button data-speed="0.85" aria-pressed="false">− Slower</button><button data-speed="1" aria-pressed="true">Original speed</button><button data-speed="1.12" aria-pressed="false">+ Faster</button></div></main><script>
const $=id=>document.getElementById(id),seen=new Set();let points=[],cursor=0,last=0,sent=false,paused=matchMedia('(prefers-reduced-motion: reduce)').matches;
// All choices begin at the same location. Only the tangential velocity changes.
function orbit(k){const a=1/(2-k*k),e=Math.abs(1-k*k),sign=k>=1?1:-1;return Array.from({length:1201},(_,i)=>{const M=(k>=1?0:Math.PI)+2*Math.PI*i/1200;let E=M;for(let n=0;n<10;n++)E-=(E-e*Math.sin(E)-M)/(1-e*Math.cos(E));const rate=1/Math.sqrt(a**3)/(1-e*Math.cos(E));return {x:sign*a*(Math.cos(E)-e),y:sign*a*Math.sqrt(1-e*e)*Math.sin(E),vx:-sign*a*Math.sin(E)*rate,vy:sign*a*Math.sqrt(1-e*e)*Math.cos(E)*rate};});}
const xy=p=>[250+p.x*90,220-p.y*90];
function draw(){const p=points[Math.floor(cursor)],[x,y]=xy(p),r=Math.hypot(p.x,p.y),v=Math.hypot(p.vx,p.vy);$('craft').setAttribute('transform',`translate(${x} ${y})`);$('trail').setAttribute('d',points.slice(0,Math.floor(cursor)+1).filter((_,i)=>i%3===0).map((p,i)=>(i?'L':'M')+xy(p).join(' ')).join(' '));$('g-arrow').setAttribute('d',`M${x} ${y}l${-p.x/r*28} ${p.y/r*28}`);$('v-arrow').setAttribute('d',`M${x} ${y}l${p.vx/v*32} ${-p.vy/v*32}`);}
function choose(k,interacted=true){points=orbit(k);cursor=0;$('status').textContent=k<1?'Path dips closer':k>1?'Path reaches farther':'Same circular path';$('scene-desc').textContent=$('status').textContent+'. Gravity points inward; velocity follows the path.';document.querySelectorAll('[data-speed]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.speed)===k)));if(interacted){seen.add(k);if(seen.has(.85)&&seen.has(1.12)&&!sent){window.parent.postMessage({ type: 'complete' }, '*');sent=true;}}draw();}
function label(){$('play').textContent=paused?'▶':'❚❚';$('play').setAttribute('aria-label',paused?'Play animation':'Pause animation');$('play').title=paused?'Play animation':'Pause animation';}
document.querySelectorAll('[data-speed]').forEach(b=>b.onclick=()=>choose(Number(b.dataset.speed)));
$('play').onclick=()=>{paused=!paused;label();};
function frame(now){if(!paused&&!document.hidden){cursor=(cursor+Math.min(now-last,50)*.12)%1200;draw();}last=now;requestAnimationFrame(frame);}choose(1,false);label();requestAnimationFrame(frame);
</script></body></html>
'''
p.write_text(html,encoding='utf-8')
p=Path('problem-walkthoughs/index.html');s=p.read_text(encoding='utf-8').replace('<h2>Change Speed. Change Orbit.</h2>','<h2>Faster or Slower?</h2>').replace('Add or subtract sideways velocity, test the resulting orbit, then perform a two-burn Hohmann transfer.','Choose slower, original speed, or faster and watch how the orbit changes.');p.write_text(s,encoding='utf-8')
