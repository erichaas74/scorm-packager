from pathlib import Path
import json, zipfile

root = Path(__file__).parent / 'fixes'
root.mkdir(exist_ok=True)
sets = {
 'charge-flow-practice': ('Apply charge flow', [
  ['A charge magnitude of 8.0 C crosses a wire section in 5.0 s. What is the average current?', ['1.6 A','0.625 A','40 A'],0,'I = Q/t = 8.0 C / 5.0 s = 1.6 A. Current measures charge per second.'],
  ['How many electrons correspond to that 8.0 C charge magnitude? Use e = 1.60 × 10⁻¹⁹ C.', ['5.0 × 10¹⁹ electrons','1.28 × 10⁻¹⁸ electrons','5.0 × 10⁻¹⁹ electrons'],0,'N = Q/e = 8.0 / (1.60 × 10⁻¹⁹) = 5.0 × 10¹⁹ electrons. Conventional current points opposite electron drift in a metal.']
 ]),
 'circuit-transfer-practice': ('Apply circuit and energy models', [
  ['An ideal 18 V source supplies 3.0 Ω and 6.0 Ω resistors in series. Find total current and the voltage across the 6.0 Ω resistor.', ['2.0 A and 12 V','6.0 A and 18 V','2.0 A and 6.0 V'],0,'Rₑq = 3.0 + 6.0 = 9.0 Ω; I = 18/9.0 = 2.0 A. The 6.0 Ω voltage drop is IR = 12 V; the other drop is 6 V.'],
  ['An ideal 9.0 V source supplies separate 3.0 Ω and 6.0 Ω branches. What are total current and equivalent resistance?', ['4.5 A and 2.0 Ω','1.0 A and 9.0 Ω','1.5 A and 6.0 Ω'],0,'Branch currents are 9.0/3.0 = 3.0 A and 9.0/6.0 = 1.5 A. Total current is 4.5 A; Rₑq = 9.0/4.5 = 2.0 Ω.'],
  ['The 3.0 Ω branch opens. What happens to current in the remaining 6.0 Ω branch, assuming the source stays at 9.0 V?', ['It stays at 1.5 A','It rises to 4.5 A','It becomes zero'],0,'The intact branch still spans 9.0 V, so its current remains 9.0/6.0 = 1.5 A. Total source current falls to 1.5 A.'],
  ['A device operates at 6.0 V and 0.40 A for 2.0 minutes. Find its power and energy transferred.', ['2.4 W and 288 J','2.4 W and 4.8 J','15 W and 1800 J'],0,'P = VI = 6.0 × 0.40 = 2.4 W. Time is 120 s, so E = Pt = 2.4 × 120 = 288 J. Energy transfers to the device and surroundings; charge is conserved.']
 ])
}
template='''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>__TITLE__</title><style>body{font:18px/1.55 system-ui;margin:0;color:#172a40;background:#f3f6fa}main{max-width:850px;margin:auto;padding:28px}h1{font-size:1.65rem}section{background:white;border:1px solid #c8d5e5;border-radius:12px;padding:22px;margin:22px 0}button{display:block;width:100%;text-align:left;font:inherit;color:#173555;background:white;border:2px solid #a9bdd5;border-radius:7px;padding:12px;margin:10px 0;cursor:pointer}button:focus-visible{outline:3px solid #b45b00}button:disabled{cursor:default}button.correct{border-color:#24734a;background:#e9f7ef}.feedback{padding:12px;background:#edf3fa;min-height:1.4em}.progress{font-weight:700}</style><main><h1>__TITLE__</h1><p>Work out each answer before choosing. Use the feedback to check your method, then retry if needed.</p><div id="questions"></div><p class="progress" id="progress" aria-live="polite"></p></main><script>const data=__DATA__;let done=new Set();const host=document.getElementById('questions');function progress(){document.getElementById('progress').textContent=done.size+' of '+data.length+' correct';if(done.size===data.length)window.parent.postMessage({type:'complete'},'*');}data.forEach((q,i)=>{const s=document.createElement('section');const h=document.createElement('h2');h.style.fontSize='1.12rem';h.textContent=(i+1)+'. '+q[0];s.append(h);const f=document.createElement('p');f.className='feedback';f.setAttribute('aria-live','polite');f.textContent='Choose an answer.';q[1].map((text,j)=>({text,j})).sort((a,b)=>((a.j+i)%q[1].length)-((b.j+i)%q[1].length)).forEach(o=>{const b=document.createElement('button');b.textContent=o.text;b.onclick=()=>{if(o.j===q[2]){done.add(i);b.className='correct';f.textContent='Correct. '+q[3];s.querySelectorAll('button').forEach(x=>x.disabled=true);progress();}else f.textContent='Not yet. '+q[3]+' Choose the answer that matches this calculation.';};s.append(b);});s.append(f);host.append(s);});progress();</script></html>'''
for name,(title,questions) in sets.items():
    html=template.replace('__TITLE__',title).replace('__DATA__',json.dumps(questions,ensure_ascii=False))
    (root/(name+'.html')).write_text(html,encoding='utf-8')
    with zipfile.ZipFile(root/(name+'.zip'),'w',zipfile.ZIP_DEFLATED) as z: z.writestr('index.html',html)
    print(name, len(questions), 'questions')
