from pathlib import Path
p=Path('problem-walkthoughs/unit 5/Unit 5 - Lesson 4 - 06 - Mars Rover - Delayed Images and Communications.html')
s=p.read_text(encoding='utf-8')
a=s.index('<div id="mars-rover-delay">'); b=s.index('<script>',a)
s=s[:a]+'''<div id="mars-rover-delay" class="focus-root">
<h2>Mars rover rescue</h2>
<section class="mission-scene" aria-label="Mission challenge">
<div class="mission-brief" data-goal aria-live="polite"></div>
<div class="patches" data-patches aria-label="Earned mission patches"></div>
<div class="mr-views"><section><h3>Mars · happening now</h3><svg data-now class="mr-scene" role="img" aria-label="Live rover. Front-wheel clearance starts at 20 metres."></svg><div data-now-label></div></section><section><h3>Earth · received image</h3><svg data-image class="mr-scene" role="img" aria-label="Delayed rover snapshot, with capture time and image age below."></svg><div data-image-label></div></section></div>
<div class="mission-result" data-result role="status">Ready for launch · Can Earth stop the rover in time?</div>
</section>
<div class="mission-controls"><label>Response strategy<select class="form-select" data-plan><option value="earth">Earth sends STOP</option><option value="auto">Onboard STOP</option></select></label><button data-run type="button">Launch rover</button><button data-reset type="button">Reset activity</button></div>
<label class="distance-control">Earth–Mars separation: <strong data-distance></strong> · one-way delay: <strong data-delay></strong><input class="form-range" data-day type="range" min="0" max="780" step="0.1" aria-label="Orbital position; changes Earth–Mars separation"></label>
<div data-status role="status"></div>
<details class="signal-details"><summary>Signal journey &amp; mission replay</summary><div class="mr-orbit-row"><svg data-orbit class="mr-orbit" role="img" aria-label="Earth and Mars orbits and signal path"></svg><div><div>Image + STOP: <strong data-round></strong></div><button data-example type="button">225 million km</button><div>Model day <span data-day-label></span></div></div></div><svg data-events class="mr-events" role="img" aria-label="Image capture, reception, and Earth STOP timeline"></svg><label>Review mission time: <span data-time-label></span><input class="form-range" data-time type="range" min="0" max="40" step="0.01" value="0"></label><div class="mission-controls"><button data-jump="image" type="button">Image reaches Earth</button><button data-jump="stop" type="button">Earth STOP arrival</button></div></details>
<details><summary>About this model</summary><p>1 m/min; hazard initially 20 m ahead of the front wheel; images every 2 min; onboard stop after 6 s. Earth responds immediately to the first image. Braking is instantaneous. Playback: 4 mission minutes/s. Circular orbits; positions held during each exchange; c ≈ 300,000 km/s. Schematic sizes, not photographs or an actual rover procedure. Relays and transmission duration omitted.</p></details>
<div hidden><input data-answer><button data-check></button><div data-feedback></div></div>
</div>
<style>
#mars-rover-delay{display:grid;gap:10px;color:#17324f;--foreground:#17324f;--background:#fff;--muted-foreground:#52697a;--border:#a5bacb;--muted:#e5ebef;--viz-series-1:#177ca5;--viz-series-2:#ac5826}
#mars-rover-delay h2{font:700 clamp(20px,3vw,28px)/1.2 Arial;margin:0}
#mars-rover-delay h3{font:600 16px/1.4 Arial;margin:0}
#mars-rover-delay .mission-scene{background:#f5f8fa;border:1px solid #cfdae3;border-radius:12px;padding:12px}
#mars-rover-delay .mission-brief{font-weight:600;min-height:48px}
#mars-rover-delay .patches{display:flex;flex-wrap:wrap;gap:5px;margin:4px 0 10px;font-size:13px}
#mars-rover-delay .patches span{padding:3px 8px;border:1px solid #a5bacb;border-radius:20px;background:white}
#mars-rover-delay .patches .earned{background:#e0f2e9;border-color:#24704e;color:#165638}
#mars-rover-delay .mr-views{display:grid;grid-template-columns:1fr 1fr;gap:16px}
#mars-rover-delay .mr-views section{min-width:0}
#mars-rover-delay .mr-scene{display:block;width:100%;height:auto;aspect-ratio:420/210}
#mars-rover-delay svg text{font:12px Arial;fill:#17324f}
#mars-rover-delay .mr-views [data-now-label],#mars-rover-delay .mr-views [data-image-label]{font-size:14px;font-variant-numeric:tabular-nums;min-height:40px}
#mars-rover-delay .mission-result{padding:10px;border-radius:8px;background:#e4edf4;min-height:68px;font-weight:600}
#mars-rover-delay .mission-result[data-outcome="safe"]{background:#dff3e8;color:#165638}
#mars-rover-delay .mission-result[data-outcome="hazard"]{background:#fff0df;color:#793c0b}
#mars-rover-delay .mission-controls{display:flex;align-items:end;gap:8px;flex-wrap:wrap;margin-top:-4px}
#mars-rover-delay .mission-controls label{flex:1;min-width:180px}
#mars-rover-delay select{display:block;width:100%;color:#17324f;background:#fff}
#mars-rover-delay [data-run]{background:#285f9f;color:white;font-weight:600}
#mars-rover-delay .distance-control{display:block;font-size:15px}
#mars-rover-delay input[type="range"]{width:100%}
#mars-rover-delay .mr-orbit-row{display:grid;grid-template-columns:1fr 1fr;align-items:center;gap:12px}
#mars-rover-delay .mr-orbit{width:100%;height:220px}
#mars-rover-delay .mr-events{width:100%;height:150px}
#mars-rover-delay details{margin:0;font-size:14px}
#mars-rover-delay [data-status]{font-size:14px;min-height:44px}
@media(max-width:600px){#mars-rover-delay .mr-views{grid-template-columns:1fr;gap:8px}#mars-rover-delay .mr-scene{max-height:180px}#mars-rover-delay .mission-scene{padding:8px}#mars-rover-delay .mr-views [data-now-label],#mars-rover-delay .mr-views [data-image-label]{min-height:22px;font-size:12px}#mars-rover-delay .mission-brief{font-size:14px}#mars-rover-delay .mission-result{font-size:14px}#mars-rover-delay .mr-orbit-row{grid-template-columns:1fr}}
</style>
''' +s[b:]
a=s.index('\n<script>\n(()=>{\nconst cfg=');s=s[:a]+'</main></body></html>\n'
s=s.replace("let day=example,t=0,plan='earth',raf=0,lastSaved='';", "let day=example,t=0,plan='earth',raf=0,lastSaved='',running=false,earned=0,sent=false;")
s=s.replace('const w=Math.max(260,(svg.clientWidth/1.65)),h=210,left=76,right=w-74,scale=(right-left)/24;', 'const w=420,h=210,left=76,scale=(w-left-90-60)/20;')
s=s.replace('hx=left+20*scale','hx=left+60+20*scale')
s=s.replace("const id=root.id+'-'+kind;", "const id=root.id+'-'+kind+(svg.matches('[data-image]')?'-image':'');")
s=s.replace("function stop(){cancelAnimationFrame(raf);", "function stop(){running=false;cancelAnimationFrame(raf);")
s=s.replace("function setup(){stop();t=0;", "function setup(){stop();clearResult();t=0;")
s=s.replace("stop();day=example;t=0;", "stop();clearResult();day=example;t=0;")
a=s.index("q('[data-run]').addEventListener('click'");b=s.index("q('[data-check]')",a)
s=s[:a]+'''function guidance(){
const goals=['First contact: launch with Earth control and watch the delayed response.','Rescue challenge: shorten the separation until Earth can stop the rover before the hazard.','Deep-space rescue: use onboard STOP at 225 million km or farther.','Mission specialist! All three patches earned. Try another separation or replay a mission.'];
q('[data-goal]').textContent=goals[earned];
q('[data-patches]').innerHTML=['First contact','Earth rescue','Onboard rescue'].map((name,i)=>`<span class="${i<earned?'earned':''}">${i<earned?'✓':'○'} ${name}</span>`).join('');
}
function clearResult(){q('[data-result]').textContent='Ready for launch · Can your strategy protect the rover?';delete q('[data-result]').dataset.outcome;q('[data-run]').textContent='Launch rover';}
function finishMission(){
const failed=state(t).hazard,clearance=20-state(t).pos;
const qualifies=earned===0&&plan==='earth'||earned===1&&plan==='earth'&&!failed||earned===2&&plan==='auto'&&!failed&&g().distance>=224.99e6;
if(qualifies)earned++;
q('[data-result]').dataset.outcome=failed?'hazard':'safe';
q('[data-result]').textContent=(failed?'✕ HAZARD REACHED — Earth’s STOP arrived too late.':'✓ ROVER SAFE — '+clearance.toFixed(2)+' m of clearance.')+(qualifies?' Mission patch earned.':earned<3?' Try the current challenge to earn its patch.':'');
q('[data-run]').textContent='Launch again';guidance();
if(earned===3&&!sent){sent=true;window.parent.postMessage({type:'complete'},'*');}
}
q('[data-run]').addEventListener('click',()=>{
stop();clearResult();t=0;running=true;q('[data-result]').textContent='Mission in progress · Watch Mars now and Earth’s older image.';
q('[data-run]').disabled=true;q('[data-day]').disabled=true;q('[data-plan]').disabled=true;q('[data-example]').disabled=true;
q('[data-time]').disabled=true;root.querySelectorAll('[data-jump]').forEach(b=>b.disabled=true);
const end=endTime(),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;let previous=performance.now();
function frame(now){const delta=document.hidden?0:Math.min((now-previous)/1000,.1);previous=now;t=reduced?end:Math.min(end,t+delta*4);draw();if(t<end)raf=visualFrame(frame);else{stop();finishMission();save();}}
raf=visualFrame(frame);
});
q('[data-reset]').addEventListener('click',()=>{stop();earned=0;day=example;plan='earth';t=0;q('[data-day]').value=day;q('[data-plan]').value=plan;q('[data-answer]').value='';q('[data-feedback]').textContent='';clearResult();guidance();stop();draw();save();});
guidance();
''' +s[b:]
s=s.replace("q('[data-time]').addEventListener('input',()=>{stop();t=", "q('[data-time]').addEventListener('input',()=>{stop();q('[data-result]').textContent='Reviewing the mission · Launch a full run to earn a patch.';delete q('[data-result]').dataset.outcome;t=")
s=s.replace("stop();t=g().delay*(b.dataset.jump", "stop();q('[data-result]').textContent='Reviewing the signal journey · Launch a full run to earn a patch.';delete q('[data-result]').dataset.outcome;t=g().delay*(b.dataset.jump")
p.write_text(s,encoding='utf-8')
