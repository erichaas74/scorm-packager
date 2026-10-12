from pathlib import Path
source=Path('problem-walkthoughs/unit 4/orbit-energy-outcomes.html');s=source.read_text(encoding='utf-8')
s=s.replace('Faster or Slower?','Choose Your Thrust').replace('Faster or slower?','Choose your thrust').replace('Same circular path','Original orbit')
s=s.replace('A spacecraft circles Earth. Choose a slower or faster sideways speed to compare its path.','Choose a push forward, backward, inward toward Earth, or outward away from Earth.')
s=s.replace('<path id="trail"','<path id="preview" fill="none" stroke="#71cfe4" stroke-opacity=".23" stroke-width="2"/><path id="thrust-arrow" fill="none" stroke="#ffd16f" stroke-width="4" marker-end="url(#arrow-thrust)"/><circle cx="340" cy="220" r="4" fill="#ffd16f"/><path id="trail"',1)
s=s.replace('</defs>','<marker id="arrow-thrust" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7Z" fill="#ffd16f"/></marker></defs>')
a=s.index('<div class="controls"');b=s.index('</main>',a)
s=s[:a]+'''<section class="thruster-panel" aria-label="Thruster direction"><p class="instruction">Choose a push. Each starts at the gold dot.</p><div class="direction-pad"><button class="forward" data-direction="forward" aria-pressed="false">↑<span>Forward</span></button><button class="inward" data-direction="inward" aria-pressed="false">←<span>Inward</span></button><button class="reset" data-direction="none" aria-pressed="true">↺<span>Reset</span></button><button class="outward" data-direction="outward" aria-pressed="false">→<span>Outward</span></button><button class="backward" data-direction="backward" aria-pressed="false">↓<span>Backward</span></button></div><p class="key">Gold arrow = push · Dashed circle = original orbit</p></section>'''+s[b:]
s=s.replace('</style>','''.thruster-panel{padding:16px 20px 20px}.instruction,.key{text-align:center;margin:0 0 12px;font-size:13px;color:#466575}.key{font-size:12px;margin:14px 0 0}.direction-pad{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;max-width:370px;margin:auto}.direction-pad button{font-size:24px;line-height:1.1;padding:8px;min-height:65px}.direction-pad button span{display:block;font-size:13px;margin-top:5px}.forward{grid-column:2;grid-row:1}.inward{grid-column:1;grid-row:2}.reset{grid-column:2;grid-row:2;background:#f1f6f8}.outward{grid-column:3;grid-row:2}.backward{grid-column:2;grid-row:3}.space svg{max-height:420px}
</style>''')
a=s.index('<script>');s=s[:a]+'''<script>
const $=id=>document.getElementById(id),seen=new Set();let points=[],cursor=0,last=0,sent=false,paused=matchMedia('(prefers-reduced-motion: reduce)').matches;
const directions={none:{vx:0,vy:1,dx:0,dy:0,text:'Original orbit'},forward:{vx:0,vy:1.15,dx:0,dy:-50,text:'Forward: reaches farther'},backward:{vx:0,vy:.85,dx:0,dy:50,text:'Backward: dips closer'},inward:{vx:-.15,vy:1,dx:-50,dy:0,text:'Inward: dips inward first'},outward:{vx:.15,vy:1,dx:50,dy:0,text:'Outward: moves outward first'}};
// Equal one-time velocity changes at the same point; normalized GM = r = 1.
function orbit(vx0,vy0){let x=1,y=0,vx=vx0,vy=vy0;const a=1/(2-vx*vx-vy*vy),dt=2*Math.PI*Math.sqrt(a**3)/2400,list=[];for(let i=0;i<=2400;i++){list.push({x,y,vx,vy});const r=Math.hypot(x,y),ax=-x/r**3,ay=-y/r**3;x+=vx*dt+ax*dt*dt/2;y+=vy*dt+ay*dt*dt/2;const rn=Math.hypot(x,y);vx+=(ax-x/rn**3)*dt/2;vy+=(ay-y/rn**3)*dt/2;}return list;}
const xy=p=>[250+p.x*90,220-p.y*90];
const path=list=>list.filter((_,i)=>i%4===0).map((p,i)=>(i?'L':'M')+xy(p).join(' ')).join(' ');
function draw(){const p=points[Math.floor(cursor)],[x,y]=xy(p),r=Math.hypot(p.x,p.y),v=Math.hypot(p.vx,p.vy);$('craft').setAttribute('transform',`translate(${x} ${y})`);$('trail').setAttribute('d',path(points.slice(0,Math.floor(cursor)+1)));$('g-arrow').setAttribute('d',`M${x} ${y}l${-p.x/r*28} ${p.y/r*28}`);$('v-arrow').setAttribute('d',`M${x} ${y}l${p.vx/v*32} ${-p.vy/v*32}`);}
function choose(name,interacted=true){const d=directions[name];points=orbit(d.vx,d.vy);cursor=0;$('preview').setAttribute('d',path(points));$('thrust-arrow').setAttribute('d',name==='none'?'':`M340 220l${d.dx} ${d.dy}`);$('status').textContent=d.text;$('scene-desc').textContent=d.text+'. The gold arrow shows a brief push at the starting point; it is not continuous thrust.';document.querySelectorAll('[data-direction]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.direction===name)));if(interacted&&name!=='none'){seen.add(name);if(seen.size===4&&!sent){window.parent.postMessage({ type: 'complete' }, '*');sent=true;}}draw();}
function label(){$('play').textContent=paused?'▶':'❚❚';$('play').setAttribute('aria-label',paused?'Play animation':'Pause animation');$('play').title=paused?'Play animation':'Pause animation';}
document.querySelectorAll('[data-direction]').forEach(b=>b.onclick=()=>choose(b.dataset.direction));$('play').onclick=()=>{paused=!paused;label();};
function frame(now){if(!paused&&!document.hidden){cursor=(cursor+Math.min(now-last,50)*.24)%2400;draw();}last=now;requestAnimationFrame(frame);}choose('none',false);label();requestAnimationFrame(frame);
</script></body></html>
'''
Path('problem-walkthoughs/unit 4/orbit-thruster-direction.html').write_text(s,encoding='utf-8')
p=Path('problem-walkthoughs/index.html');s=p.read_text(encoding='utf-8');pos=s.index('          <article class="card">');card='''          <article class="card">
            <div class="label">Unit 4 &middot; Orbital motion</div>
            <h2>Choose Your Thrust</h2>
            <p>Push forward, backward, inward, or outward and watch the orbit change.</p>
            <div class="tags"><span class="tag">Thrust direction</span><span class="tag">Orbits</span></div>
            <a class="open-btn" href="unit%204/orbit-thruster-direction.html">Open walkthrough</a>
          </article>
''';s=s[:pos]+card+s[pos:];p.write_text(s,encoding='utf-8')
