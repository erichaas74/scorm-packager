from pathlib import Path
import re

root=Path('problem-walkthoughs/unit 5')
src=root/'am-fm-radio.html'
backup=Path('output/radio-split/original-am-fm-radio.html')
backup.parent.mkdir(parents=True,exist_ok=True)
if not backup.exists(): backup.write_bytes(src.read_bytes())
old=backup.read_text(encoding='utf-8')
css=old.split('<style>')[1].split('</style>')[0]
css+='''
html,body{background:transparent}
.stage{border:5px solid #285f9f}.feedback{min-height:74px;font-size:17px}.feedback strong{display:block;font-size:22px}.feedback.correct{color:#1d644c}.feedback.incorrect{color:#923d28}
.question{padding-bottom:10px}.answers{margin:6px 0 0}.answers button{flex:1}.controls{margin-top:6px}button:disabled{cursor:default;opacity:.75}
.demo-note{font-size:18px;font-weight:600;min-height:30px;margin-bottom:8px!important}.hint{max-width:400px}.swatch{background:#237b9a}.answer.good{color:#1d644c}
@media(max-width:600px){h1{font-size:23px;letter-spacing:-.7px}.feedback{min-height:110px;font-size:15px}.feedback strong{font-size:20px}.demo-note{font-size:16px;min-height:48px}.answers button{padding:9px 8px}.stage-top{gap:5px}.hint{font-size:12px}}
'''
graph=old[old.index('<svg class="graph"'):old.index('</svg>',old.index('<svg class="graph"'))+6]
graph=graph.replace('stroke="#8a9c9e"','stroke="#667e82"')
functions=old[old.index('function sample(u,p=phase)'):old.index('function announce(t)')]
functions=functions.replace("narrow?'0 0 430 400'", "narrow?'0 0 430 420'")
functions=functions.replace("narrow?390:351","narrow?407:351")
functions=functions.replace("narrow?185:650","narrow?20:650").replace("narrow?293:228","narrow?380:228")
demo_js='''
(()=>{'use strict';
const $=id=>document.getElementById(id),reduced=matchMedia('(prefers-reduced-motion: reduce)'),TAU=Math.PI*2;
let mode='am',phase=0,answered=true,plot,stage=0,elapsed=0,last=0,raf=0,completed=false;
const cases=['fm','am'];
const evidence={am:'Amplitude follows the audio; carrier-cycle spacing stays constant.',fm:'Frequency follows the audio; radio-signal amplitude stays constant.'};
FUNCTIONS
function complete(){if(!completed){completed=true;window.parent.postMessage({ type: 'complete' }, '*');}}
function sync(){
 const demo=stage<2,done=stage===4;
 mode=demo?(stage===0?'am':'fm'):cases[Math.min(stage-2,1)];
 $('modeLabel').textContent=demo?mode.toUpperCase()+' · '+(mode==='am'?'amplitude modulation':'frequency modulation'):done?'AM and FM matched':'Match signal '+(stage===2?'A':'B');
 $('demoNote').textContent=demo?evidence[mode]:done?'AM changes amplitude. FM changes frequency.':'Match the blue radio signal to its modulation.';
 $('answers').hidden=demo||done;
 document.querySelectorAll('.answer').forEach(b=>{b.disabled=answered;b.classList.toggle('good',!demo&&answered&&b.dataset.answer===mode);});
 $('envelope').hidden=!(answered&&mode==='am');$('fmGuides').hidden=!(answered&&mode==='fm');
 $('graphTitle').textContent=demo?mode.toUpperCase()+' demonstration':done?'Matched radio signal':'Unlabeled radio signal';
 $('graphDesc').textContent=answered?evidence[mode]:'Audio, carrier and radio traces share the same time window. Match the varying property to AM or FM.';
 $('feedback').className='feedback';
 if(demo)$('feedback').textContent=stage===0?'The dashed envelope tracks the audio. FM follows automatically.':'Closer cycles mean higher frequency. Matching follows automatically.';
 else if(done){$('feedback').innerHTML='<strong>✓ Matching complete</strong>Replay to watch the demonstrations and match again.';complete();}
 else if(!answered)$('feedback').textContent='Select AM or FM. The evidence appears after your choice.';
 draw();
}
function advance(){stage++;elapsed=0;phase=0;answered=stage<2||stage===4;sync();}
function tick(t){raf=0;if(document.hidden){last=0;return;}const dt=last?Math.min(t-last,100):0;last=t;
 if(stage<2||(!answered&&stage<4)){if(!reduced.matches)phase+=dt/1000*.025;draw();}
 if(stage<2||(answered&&stage<4)){elapsed+=dt;if(elapsed>=(stage<2?8000:3000))advance();}
 if(stage<4)raf=requestAnimationFrame(tick);
}
function start(){if(!raf&&stage<4&&!document.hidden)raf=requestAnimationFrame(tick);}
document.querySelectorAll('.answer').forEach(b=>b.onclick=()=>{if(answered||stage<2||stage>3)return;answered=true;elapsed=0;const correct=b.dataset.answer===mode;sync();$('feedback').className='feedback '+(correct?'correct':'incorrect');$('feedback').innerHTML='<strong>'+(correct?'✓ CORRECT':'✕ NOT QUITE')+' — '+mode.toUpperCase()+'</strong>'+evidence[mode];});
$('replay').onclick=()=>{cancelAnimationFrame(raf);raf=0;stage=0;elapsed=0;phase=0;last=0;answered=true;sync();start();};
document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(raf);raf=0;last=0;start();});
window.addEventListener('resize',layout);reduced.addEventListener('change',draw);layout();sync();start();
})();
'''.replace('FUNCTIONS',functions)
src.write_text('''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AM &amp; FM: Watch and Match</title><style>'''+css+'''</style></head><body><main>
<h1>AM &amp; FM: Watch and Match</h1><div class="stage"><div class="stage-top"><span class="mode" id="modeLabel"></span><span class="hint">Same audio · same time window · schematic frequencies</span></div>
'''+graph+'''<div class="question"><p class="demo-note" id="demoNote"></p><div class="answers" id="answers" hidden><button class="answer" data-answer="am"><span class="swatch"></span>AM · amplitude</button><button class="answer" data-answer="fm"><span class="swatch"></span>FM · frequency</button></div><p class="feedback" id="feedback" role="status" aria-live="polite"></p></div></div><div class="controls"><button id="replay">Replay</button></div><script>'''+demo_js+'''</script></main></body></html>''',encoding='utf-8')

# Reuse the original station model and filter drawing, without the receiver pathway.
common=old[old.index('const stations='):old.index('function detail(best,recovered)')]
common=common.replace('function carrier(st){return 20*st.u;}','function carrier(st){return 8+20*st.u;}')
spectrum=old[old.index(' const narrow=innerWidth<600,W='):old.index(" $('rxAM').setAttribute")]
flow=old[old.index(' const selected=best.g>.5;'):old.index('function animate(stamp)')]
flow=flow.rsplit('}',1)[0]
# Match input/output spans, so frequency has the same horizontal scale.
flow=flow.replace('590+310*u','590+260*u').replace('H900','H850').replace('cx="912"','cx="867"')
tuner_css='''
html,body{background:transparent}*{box-sizing:border-box}body{margin:0;font:16px/1.45 system-ui,sans-serif;color:#203d49}main{max-width:1100px;margin:auto;padding:18px}h1{font-size:30px;margin:0 0 12px;letter-spacing:-.7px}.stage{border:5px solid #285f9f;border-radius:18px;background:#f7f5ee;padding:14px}svg{width:100%;display:block}.band{display:flex;gap:8px;align-items:center;margin-bottom:8px}.band p{flex:1;margin:0;font-weight:600}button{font:inherit;min-height:44px;padding:8px 14px;border:1px solid #a5b6ba;border-radius:8px;color:#203d49;background:white;cursor:pointer}button[aria-pressed=true]{background:#203d49;color:white}button:focus-visible,input:focus-visible{outline:3px solid #ad7918;outline-offset:3px}.traces{background:#fafbf6;border-radius:12px}#rxSpectrum{max-height:140px}.tuning{display:flex;align-items:center;gap:12px;margin:6px 0}.tuning label{flex:1;font-weight:600}.tuning output{float:right}.tuning input{display:block;width:100%;height:30px;accent-color:#237b9a}.result{font-weight:600;margin:10px 0 0;min-height:48px}.fine{font-size:13px;color:#526d75;margin:8px 0 0}.controls{display:flex;gap:8px;margin-top:6px}.mobile-traces{display:none}
@media(max-width:600px){main{padding:10px 6px}h1{font-size:25px}.stage{padding:10px}.band{flex-wrap:wrap}.band p{flex-basis:100%;font-size:15px}.desktop-traces{display:none}.mobile-traces{display:block}.tuning{gap:6px}.tuning button{padding:8px 12px}.result{font-size:15px;min-height:66px}.fine{font-size:12px}#rxSpectrum{margin-top:8px}}
'''
tuner_js='''
(()=>{'use strict';
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let tune=.5,mode='am',time=0,frame=0,previous=0,paused=false,step=0,completed=false;
COMMON
function render(){
SPECTRUM
FLOW
 $('rxAM').setAttribute('aria-pressed',String(mode==='am'));$('rxFM').setAttribute('aria-pressed',String(mode==='fm'));
 $('rxFrequency').textContent=frequency(tune);$('rxTune').setAttribute('aria-valuetext',frequency(tune));
 $('rxSpectrum').setAttribute('aria-label',`Tuned to ${frequency(tune)}. `+r.map(st=>`${st.tag}: ${Math.round(st.g*100)} percent passes`).join('. '));
 let mobile='';
 stations.forEach((st,i)=>{const y=61+i*123,g=response(st.u);let a='',b='';for(let k=0;k<=300;k++){const u=k/300,v=sample(st,u),p=k?'L':'M';a+=p+(20+148*u).toFixed(2)+' '+(y-23*v).toFixed(2);b+=p+(222+148*u).toFixed(2)+' '+(y-23*g*v).toFixed(2);}
 mobile+=text(20,y-33,st.tag+' · '+frequency(st.u),16,st.color)+line(`M20 ${y}H168M222 ${y}H370`,'#c8d4cd',1)+line(a,st.color,2)+line(b,st.color,2)+line(`M181 ${y}h27m-7-5l7 5-7 5`,'#237b9a',2)+text(222,y+46,Math.round(g*100)+'% passes',15,st.color);});
 $('mobileSignals').innerHTML=mobile;
 const instructions=['B is selected. Tune to A and compare the outgoing traces.','A passes strongly. Now tune between A and B so both fade.','Between stations, little passes. Now tune to C.','✓ Tuning complete. Explore either band or select Reset.'];
 $('guidance').textContent=instructions[step];
 const message=best.g>.85?`${best.tag} · ${best.name} selected — ${frequency(best.u)}. Other stations are suppressed.`:best.g>.18?`Near ${best.tag} · ${best.name}. Its outgoing signal is weakened.`:'Between stations: all three outgoing signals are weak.';
 if($('result').textContent!==message)$('result').textContent=message;
}
function check(){if(step===0&&response(.2)>.85)step=1;else if(step===1&&tune>.28&&tune<.42&&Math.max(...readings().map(s=>s.g))<.18)step=2;else if(step===2&&response(.8)>.85){step=3;if(!completed){completed=true;window.parent.postMessage({ type: 'complete' }, '*');}}}
function tuneTo(v){tune=Math.max(0,Math.min(1,Number(v)/1000));$('rxTune').value=Math.round(tune*1000);check();render();}
function animate(stamp){frame=0;if(document.hidden||paused||reduced.matches){previous=0;return;}if(previous)time+=Math.min(stamp-previous,60)/1000*.16;previous=stamp;render();frame=requestAnimationFrame(animate);}
function start(){if(!frame&&!paused&&!reduced.matches&&!document.hidden)frame=requestAnimationFrame(animate);}
$('rxTune').addEventListener('input',e=>tuneTo(e.target.value));$('rxMinus').onclick=()=>tuneTo(tune*1000-5);$('rxPlus').onclick=()=>tuneTo(tune*1000+5);
['am','fm'].forEach(b=>{$('rx'+b.toUpperCase()).onclick=()=>{mode=b;render();};});
$('reset').onclick=()=>{step=0;tune=.5;time=0;$('rxTune').value=500;render();};
$('pause').onclick=()=>{paused=!paused;$('pause').textContent=paused?'Play':'Pause';cancelAnimationFrame(frame);frame=0;previous=0;start();};
document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(frame);frame=0;previous=0;start();});reduced.addEventListener('change',()=>{cancelAnimationFrame(frame);frame=0;previous=0;start();});window.addEventListener('resize',render);render();start();
})();
'''.replace('COMMON',common).replace('SPECTRUM',spectrum).replace('FLOW',flow)
(root/'radio-tuner.html').write_text('''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Radio Tuner</title><style>'''+tuner_css+'''</style></head><body><main><h1>Radio Tuner</h1><div class="stage"><div class="band"><p id="guidance" role="status" aria-live="polite"></p><button id="rxAM" aria-pressed="true">AM</button><button id="rxFM" aria-pressed="false">FM</button></div><div class="traces"><svg class="desktop-traces" id="rxFilterAnimation" viewBox="0 0 940 430" role="img" aria-label="Incoming signals, filter, and outgoing signals. The same time and amplitude scales are used for input and output."></svg><svg class="mobile-traces" viewBox="0 0 390 425" role="img" aria-label="Three stations: incoming signals at left, filtered output at right. Both columns use the same scales."><text x="20" y="22" font-size="16" fill="#203d49">Incoming</text><text x="222" y="22" font-size="16" fill="#203d49">After filter</text><g id="mobileSignals" transform="translate(0 24)"></g></svg></div><svg id="rxSpectrum" role="img"></svg><div class="tuning"><label>Tuning <output id="rxFrequency"></output><input id="rxTune" type="range" min="0" max="1000" value="500" step="1" aria-label="Tuning frequency"></label><button id="rxMinus" aria-label="Tune down">−</button><button id="rxPlus" aria-label="Tune up">+</button></div><p id="result" class="result" role="status" aria-live="polite"></p><p class="fine">Incoming and outgoing traces share the same scales. Schematic waves and idealized filter; no sound playback.</p></div><div class="controls"><button id="pause">Pause</button><button id="reset">Reset</button></div><script>'''+tuner_js+'''</script></main></body></html>''',encoding='utf-8')
(root/'am-fm-radio-design.txt').write_text('''AM/FM split — 2026-10-19

am-fm-radio.html: animated demo with a user-requested matching follow-up.
Eight seconds of AM, eight seconds of FM, then two sequential selections
(unlabeled FM, unlabeled AM). Original three-trace visual and wave equations
are retained. Audio, time window and carrier baseline remain constant.
Demo reveals envelope/crest evidence; matching hides it until an answer.
Answer freezes motion, shows explicit CORRECT/NOT QUITE plus evidence,
holds three visible seconds, and advances automatically. Completion fires
once after both answers and evidence holds. Replay resets the sequence.
Reduced motion uses still diagrams; hidden tabs suspend the sequence.

radio-tuner.html: guided simulation split from the original tuner visual.
Three stations, common input/output time and amplitude scales, tuning and
AM/FM controls. Start at B, select A, move between A/B, then select C.
Meaningful tuning actions advance guidance without changing user settings.
Completion fires once after the guided sequence; free exploration continues.
Gaussian response is an illustrative station-amplitude model, not RF filtering.
The original receiver pathway is preserved in output/radio-split/original-am-fm-radio.html.
Packages: rise-zips/unit-5-am-fm-radio.zip and rise-zips/unit-5-radio-tuner.zip.
''',encoding='utf-8')
print('Created AM/FM demo + matching and standalone tuner.')
