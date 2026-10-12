'use strict';
const {C,PARTS,solve,state}=EnergyModel,$=id=>document.getElementById(id),fmt=n=>Math.max(0,n).toFixed(2);
const settings={part:'ramp',friction:.2,connected:true,mass:.18,drop:1,compression:.18,stretch:.25,battery:1.8};
let unlocked=false,prediction=null,running=false,paused=false,elapsed=0,lastTime=null,finished=false,tests=[],wonForms=new Set(),sent=false;
const phases=[0,1,2,2.8,3.4,4.9,6.4],rows=[['ballPE','Ball gravitational','#c19435'],['ke','Kinetic','#2f91ad'],['cupPE','Cup gravitational','#8db463'],['remaining','Unused extra store','#926caf'],['heat','Thermal + sound','#da805b']];
const notes={ramp:'The ball begins with 1.00 J of gravitational potential energy. There is no other energy source.',trigger:'The domino can pull a release string, but there is no stored-energy drive attached. A trigger alone cannot power the lift.',weight:'Setup: someone does work to raise the counterweight. Its gravitational potential energy can lift the ball and cup.',spring:'Setup: someone compresses the spring. A geared spring drive releases elastic potential energy to wind the lifting cord.',band:'Setup: someone stretches the band. An elastic drive releases that energy through a lifting drum.',battery:'The battery stores chemical energy. Closing a switch lets a motor wind the lifting cord.'};
const subtitles={ramp:'Test the rough ramp',trigger:'No extra energy',weight:'Gravitational store',spring:'Elastic store',band:'Elastic store',battery:'Chemical store'};
Object.entries(PARTS).forEach(([id,p])=>{const b=document.createElement('button');b.type='button';b.dataset.part=id;b.innerHTML=p.name+'<span>'+subtitles[id]+'</span>';b.setAttribute('aria-pressed','false');b.onclick=()=>{settings.part=id;reset();};$('parts').append(b);});
rows.forEach(([id,label,color])=>{const row=document.createElement('div');row.className='energyRow';row.innerHTML='<span>'+label+'</span><div class="bar" style="--color:'+color+'"><i id="bar-'+id+'"></i></div><output id="value-'+id+'">0.00 J</output>';$('bars').append(row);});
function controlState(){
 document.querySelectorAll('[data-part]').forEach(b=>{b.disabled=running||(!unlocked&&b.dataset.part!=='ramp');b.classList.toggle('selected',b.dataset.part===settings.part);b.setAttribute('aria-pressed',b.dataset.part===settings.part);});
 ['friction','mass','drop','compression','stretch','battery','connected'].forEach(id=>$(id).disabled=running||(!unlocked&&id==='friction'));
 document.querySelectorAll('[data-prediction]').forEach(b=>{b.disabled=running;b.classList.toggle('selected',b.dataset.prediction===prediction);b.setAttribute('aria-pressed',b.dataset.prediction===prediction);});
 $('run').disabled=!prediction||running;$('run').textContent=finished?'Run again':'Release ball';$('pause').disabled=!running||$('reduced').checked;$('pause').textContent=paused?'Resume':'Pause';$('step').hidden=!running||!$('reduced').checked;$('reduced').disabled=running;
}
function configure(){
 const p=settings.part,r=solve(settings);$('mechanismControls').hidden=p==='ramp';
 for(const name of ['mass','drop','compression','stretch','battery'])$(name+'Label').hidden=!(p==='weight'&&['mass','drop'].includes(name)||p==='spring'&&name==='compression'||p==='band'&&name==='stretch'||p==='battery'&&name==='battery');
 $('frictionOut').textContent=Math.round(settings.friction*100)+'%';$('massOut').textContent=fmt(settings.mass)+' kg';$('dropOut').textContent=fmt(settings.drop)+' m';$('compressionOut').textContent=fmt(settings.compression)+' m';$('stretchOut').textContent=fmt(settings.stretch)+' m';$('batteryOut').textContent=fmt(settings.battery)+' J';
 $('slot').textContent=p==='ramp'?'RAMP ONLY · NO EXTRA STORE':PARTS[p].name.toUpperCase()+' INSERTED';$('sourceNote').textContent=notes[p];
 $('sourceFormula').textContent=p==='ramp'?'Initial energy: mgh = 0.10 × 10 × 1.00 = 1.00 J':p==='weight'?'Store: mgh = '+fmt(settings.mass)+' × 10 × '+fmt(settings.drop)+' = '+fmt(r.store)+' J':p==='spring'?'Store: ½ × 80 × '+fmt(settings.compression)+'² = '+fmt(r.store)+' J':p==='band'?'Store: ½ × 40 × '+fmt(settings.stretch)+'² = '+fmt(r.store)+' J':p==='battery'?'Chemical energy available: '+fmt(r.store)+' J':'Extra stored energy: 0.00 J';
 $('unlockText').textContent=unlocked?'Choose a part, tune it, and test your prediction.':'Run the ramp-only test to unlock the parts.';
 $('liftAssembly').style.display=p==='ramp'?'none':'';$('returnTrack').style.opacity=p==='ramp'?'1':'.12';$('weight').style.display=p==='weight'?'':'none';$('drive').style.display=['ramp','weight','trigger'].includes(p)?'none':'';
 $('springArt').style.display=p==='spring'?'':'none';$('bandArt').style.display=p==='band'?'':'none';$('batteryArt').style.display=p==='battery'?'':'none';$('driveLabel').textContent=p==='spring'?'SPRING DRIVE':p==='band'?'ELASTIC DRIVE':'BATTERY WINCH';$('weightLabel').textContent=fmt(settings.mass);$('triggerString').style.opacity=settings.connected?'1':'.12';$('sceneLabel').textContent='WORKBENCH · '+PARTS[p].name.toUpperCase();controlState();
}
function draw(){
 const s=state(settings,elapsed),p=settings.part;let x,y;
 if(elapsed<=2){x=110+310*s.route;y=420-190*s.h;}
 else if(p==='ramp'){x=420+345*s.h/1.4;y=420-190*s.h;}
 else{x=420+145*Math.min(1,s.route-1);y=420-190*s.h;}
 $('ball').setAttribute('transform','translate('+x+' '+y+') rotate('+x*1.8+')');
 const cupHeight=p==='ramp'||elapsed<3.4?0:s.h;
 $('cup').setAttribute('transform','translate(0 '+(-190*cupHeight)+')');
 $('weight').setAttribute('transform','translate(0 '+(-26+190*(elapsed<3.4?0:s.h))+')');
 $('rope').setAttribute('d','M565 '+(392-190*cupHeight)+'V108A35 35 0 0 1 635 108V'+(p==='weight'?114+190*cupHeight:122));
 $('triggerString').setAttribute('d',p==='weight'?'M510 402Q585 355 635 114':'M510 402Q620 444 710 385');
 $('wheelSpokes').setAttribute('transform','rotate('+s.h*280+' 600 108)');
 const da=p!=='ramp'&&elapsed>2.45?70*Math.min(1,(elapsed-2.45)/.3):0;$('domino').setAttribute('transform','rotate('+da+' 510 432)');
 $('driveCaption').textContent=p==='trigger'?'Trigger only: no energy source':p==='weight'?'Cup rise = counterweight drop':'Energy stored during setup';$('storeRead').textContent=fmt(s.remaining)+' J left';
 $('heightRead').textContent='Ball height: '+fmt(s.h)+' m';$('total').textContent='Total: '+fmt(s.total)+' J';
 rows.forEach(([id])=>{$('bar-'+id).style.width=(100*s[id]/s.total)+'%';$('value-'+id).textContent=fmt(s[id])+' J';});
 $('balance').textContent='Ball + cup + motion + unused store + thermal/sound = '+fmt(s.total)+' J. Energy is accounted for.';
 $('sceneMessage').textContent=elapsed===0&&!running?'Ready: predict, then release the ball.':s.phase;if(running)$('status').textContent=s.phase;
}
function reset(){running=false;paused=false;finished=false;elapsed=0;lastTime=null;prediction=null;$('result').hidden=true;configure();draw();$('status').textContent=unlocked?'Choose a prediction, then release the ball.':'First, predict the ramp-only result. Then release the ball.';}
function run(){if(!prediction||running)return;finished=false;elapsed=0;running=true;paused=false;lastTime=null;$('result').hidden=true;controlState();draw();}
function end(){
 running=false;finished=true;const r=solve(settings),p=settings.part,actual=r.height>1+1e-7?'higher':r.height<1-1e-7?'below':'same';
 if(p==='ramp'&&settings.friction>0){unlocked=true;$('mission1').classList.add('done');}
 if(r.reached){wonForms.add(PARTS[p].form);$('mission2').classList.add('done');}
 if(wonForms.size>=2){$('mission3').classList.add('done');if(!sent){sent=true;parent.postMessage({type:'complete'},'*');}}
 let title,text;
 if(p==='ramp'){title=settings.friction>0?'Friction keeps it below the start':'Ideal track: back to the starting height';text=fmt(r.E0*settings.friction)+' J became thermal energy on the rough patch. '+fmt(r.ballPE)+' J remains as gravitational potential energy at '+fmt(r.height)+' m. The ball is paused at its turning point; it would roll back down. '+(settings.friction>0?'The parts are now unlocked.':'Without another energy source, even this ideal track cannot lift it above its start.');}
 else if(r.reason==='unconnected'){title='Stored energy is ready, but not released';text='The ball stops in the cup, but the release string is disconnected. '+fmt(r.store)+' J remains in the source. Connect the domino to the release and try again.';}
 else if(p==='trigger'){title='A trigger cannot supply the lift’s energy';text='The domino moves the string, but no extra energy store is connected. The ball’s initial energy has become thermal energy and sound as it rolls and stops. Insert a raised weight, elastic drive, or battery.';}
 else if(r.reason==='force'){title='The counterweight is too light';text='The loaded cup weighs 1.20 N and the lift has 0.10 N opposing resistance. This counterweight supplies '+fmt(settings.mass*10)+' N. It needs more than 1.30 N to start the governed lift. Increasing drop distance alone will not fix this.';}
 else{title=r.reached?'Target reached: '+fmt(r.height)+' m':r.higher?'Above the start, but below the target':'Not enough lift yet';text='The '+PARTS[p].label.toLowerCase()+' released '+fmt(r.used)+' J. The ball and cup gained '+fmt(r.ballPE+r.cupPE)+' J of gravitational potential energy and reached '+fmt(r.height)+' m. '+(r.reached?'The extra height came from energy stored during setup.':p==='weight'?'Increase the available counterweight drop; its drop limits the cup’s rise.':'Increase the stored energy and test again.')+' '+fmt(r.remaining)+' J remains unused in the source.';}
 $('resultTitle').textContent=title;$('resultText').textContent=text;$('predictionResult').textContent=(prediction===actual?'Your prediction matched the result. ':'You predicted '+({below:'below',same:'at',higher:'above'}[prediction])+' the starting height; the result was '+({below:'below',same:'at',higher:'above'}[actual])+' it.')+(wonForms.size>=2?' Challenge complete: you reached the target with two different forms of stored energy.':'');$('result').hidden=false;
 tests.push({...settings,height:r.height,reached:r.reached});renderHistory();configure();draw();$('status').textContent=title;
}
function renderHistory(){
 $('history').replaceChildren();tests.forEach((t,i)=>{const tr=document.createElement('tr');const tune=t.part==='weight'?fmt(t.mass)+' kg; '+fmt(t.drop)+' m drop':t.part==='spring'?fmt(t.compression)+' m compression':t.part==='band'?fmt(t.stretch)+' m stretch':t.part==='battery'?fmt(t.battery)+' J available':Math.round(t.friction*100)+'% ramp loss';[i+1,PARTS[t.part].name,tune+(t.part!=='ramp'&&!t.connected?'; disconnected':''),fmt(t.height)+' m',t.reached?'Reached':'Not yet'].forEach(v=>{const td=document.createElement('td');td.textContent=v;tr.append(td);});$('history').append(tr);});
}
function frame(now){if(running&&!paused&&!$('reduced').checked&&!document.hidden){if(lastTime!==null)elapsed+=Math.min(.05,(now-lastTime)/1000);const limit=settings.part==='ramp'?4.4:6.4;elapsed=Math.min(elapsed,limit);draw();if(elapsed>=limit)end();}lastTime=now;requestAnimationFrame(frame);}
document.querySelectorAll('[data-prediction]').forEach(b=>b.onclick=()=>{prediction=b.dataset.prediction;controlState();});
for(const id of ['friction','mass','drop','compression','stretch','battery'])$(id).oninput=()=>{settings[id]=Number($(id).value)/100;reset();};
$('connected').onchange=()=>{settings.connected=$('connected').checked;reset();};$('run').onclick=run;$('reset').onclick=reset;$('pause').onclick=()=>{paused=!paused;lastTime=null;controlState();};
$('step').onclick=()=>{const times=settings.part==='ramp'?[0,1,2,3.2,4.4]:phases;elapsed=times.find(t=>t>elapsed+.001)??times[times.length-1];draw();if(elapsed>=times[times.length-1])end();};
$('reduced').checked=matchMedia('(prefers-reduced-motion: reduce)').matches;
document.addEventListener('visibilitychange',()=>{lastTime=null;});configure();draw();requestAnimationFrame(frame);

