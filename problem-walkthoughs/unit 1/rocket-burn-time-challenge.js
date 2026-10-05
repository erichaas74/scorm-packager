'use strict';
const A=20, G=10, BRAKE=25, FUEL=3, TARGET_V=60, TARGET_H=420;
const $=id=>document.getElementById(id);
const missions=[
 {title:'Find the burn time',instruction:'Choose a burn time that reaches the target velocity at engine cutoff.',target:'Engine-cutoff velocity: +60 m/s',label:'Your burn time',unit:'s',min:.1,max:6,tolerance:'Accepted: within 1 m/s of the target. Burn range: 0.1–6 s.'},
 {title:'Predict the apex',instruction:'Predict the maximum height above the launchpad, then test the flight.',target:'Same rocket. Exact target velocity. How high will it climb?',label:'Your predicted apex height',unit:'m',min:1,max:2000,tolerance:'Accepted: within 5 m of the measured apex.'},
 {title:'Predict final height',instruction:'Predict the maximum height after burning and coasting.',target:'Final height at the apex?',label:'Answer',unit:'m',min:0,max:2000,tolerance:'Accepted: within 5 m of the measured height.'},
 {title:'Predict the landing',instruction:'From rest at 180 m, predict the fall time and signed landing velocity.',target:'Engine off. Start height: 180 m. Initial velocity: 0 m/s.',label:'Your predicted landing time',unit:'s',min:.1,max:30,tolerance:'Accepted: time within 0.5 s AND velocity within 2 m/s. Downward velocity is negative.'},
 {title:'Choose the braking trigger',instruction:'Calculate the ignition velocity for a three-second burn, then test your trigger.',target:'Target landing velocity: −5 m/s after a 3.00 s braking burn.',label:'Ignite when velocity reaches',unit:'m/s',min:-120,max:-60,tolerance:'Use a negative velocity from −120 to −60 m/s. Accepted: landing velocity within 1 m/s of −5, with the full burn completed.'},
 {title:'Investigation mode',instruction:'Launch, cut the ascent engine, then choose when to fire the landing burn.',target:'Your mission: land at 6 m/s or slower. Explore and compare your trials.',label:'',unit:'',tolerance:'Ascent fuel: 6 s maximum. Landing burn: +25 m/s² for up to 3 s. Playback: real time.'}
];
let level=0,unlocked=0,passed=Array(5).fill(false),histories=Array.from({length:6},()=>[]);
let flight=null,running=false,paused=false,elapsed=0,last=null,completionSent=false,frameId=null;
let problem=null,answered=false,sceneHeightRange=0;
const previousProblems=Array(5).fill('');
const pick=items=>items[Math.floor(Math.random()*items.length)];
function newConditions(n){
 let p;
 do{
  p={a:pick([10,15,20]),h:0,v:0,targetV:pick([40,45,50,55,60]),targetH:pick([180,240,300,360,420,480]),brake:pick([20,25,30]),fuel:pick([2,2.5,3]),finalV:-5};
  if(n===0)p.targetV=p.a*pick([1,2,3,4,5,6]);
  if(n===1){p.h=pick([40,60,80,100]);p.v=pick([30,40,50,60]);}
  if(n===2)p.burn=pick([2,3,4,5,6]);
  if(n===3)p.h=pick([80,125,180,245,320]);
  if(n===4){const ignition=p.finalV-p.brake*p.fuel;p.v=ignition+pick([10,15,20]);const wait=(p.v-ignition)/G;p.h=-(p.v*wait-.5*G*wait*wait+(ignition+p.finalV)*p.fuel/2);}
 }while(JSON.stringify(n===0?[p.a,p.targetV]:n===1?[p.h,p.v]:n===2?[p.a,p.burn]:n===3?p.h:[p.v,p.brake,p.fuel])===previousProblems[n]);
 previousProblems[n]=JSON.stringify(n===0?[p.a,p.targetV]:n===1?[p.h,p.v]:n===2?[p.a,p.burn]:n===3?p.h:[p.v,p.brake,p.fuel]);
 return p;
}
function solve(burn,a=A){const v=a*burn,burnHeight=.5*a*burn*burn;return {burn,a,v,burnHeight,apex:burnHeight+v*v/(2*G),apexTime:burn+v/G};}
function sample(t,burn,a=A){
 if(t<burn)return {y:.5*a*t*t,v:a*t,a,phase:'Engine burning',engine:true};
 const r=solve(burn,a),u=Math.min(t-burn,r.v/G);
 return {y:r.burnHeight+r.v*u-.5*G*u*u,v:Math.max(0,r.v-G*u),a:-G,phase:t>=r.apexTime?'Apex · velocity = 0':'Engine off · coasting',engine:false};
}
// Solve the first future ground crossing exactly, including a soft touchdown at a double root.
function groundTime(y,v,a){
 if(y<=1e-8&&(v<0||(v===0&&a<0)))return 0;
 if(Math.abs(a)<1e-12)return v<0?-y/v:Infinity;
 const d=v*v-2*a*y;if(d< -1e-8)return Infinity;
 const roots=[(-v-Math.sqrt(Math.max(0,d)))/a,(-v+Math.sqrt(Math.max(0,d)))/a];
 return Math.min(...roots.filter(t=>t>1e-8));
}
function stateIn(segment,t){const dt=Math.max(0,t-segment.t);return {y:segment.y+segment.v*dt+.5*segment.a*dt*dt,v:segment.v+segment.a*dt,a:segment.a,phase:segment.phase,engine:segment.engine};}
function trajectory(y,v){return {segments:[],endTime:0,endY:y,endV:v,landed:false,apex:y,retroTime:null,cutoffTime:null};}
function addPhase(f,a,duration,phase,engine=false){
 if(f.landed)return;
 const s={t:f.endTime,y:f.endY,v:f.endV,a,phase,engine};
 const hit=groundTime(s.y,s.v,a),dt=Math.min(duration,hit);
 s.duration=dt;f.segments.push(s);
 const end=stateIn(s,s.t+dt);f.endTime+=dt;f.endY=end.y;f.endV=end.v;
 f.apex=Math.max(f.apex,s.y,end.y);
 if(a<0&&s.v>0&&s.v/(-a)<dt)f.apex=Math.max(f.apex,s.y-s.v*s.v/(2*a));
 if(hit<=duration+1e-9){f.landed=true;f.endY=0;}
}
function descent(trigger,p={h:267.5,v:-60,brake:BRAKE,fuel:FUEL}){
 const f=trajectory(p.h,p.v),wait=(p.v-trigger)/G;
 addPhase(f,-G,wait,'Falling to ignition velocity');
 if(!f.landed){f.retroTime=f.endTime;f.retroVelocity=f.endV;f.retroHeight=f.endY;addPhase(f,p.brake,p.fuel,'Landing burn',true);}
 if(!f.landed)addPhase(f,-G,Infinity,'Fuel exhausted · falling');
 return f;
}
function at(f,t){
 const time=Math.min(t,f.endTime);
 const s=[...f.segments].reverse().find(s=>time>=s.t-1e-9)||f.segments[0];
 const p=stateIn(s,time);p.y=Math.max(0,p.y);
 if(t>=f.endTime-1e-9&&f.landed){p.y=0;p.v=f.endV;p.engine=false;p.phase=Math.abs(p.v)<=6?'Soft landing':'Hard landing';}
 return p;
}
function liveState(t){
 if(!flight)return {y:problem?.h||0,v:problem?.v||0,a:0,phase:'Ready'};
 return level===0||level===2?sample(t,flight.burn,flight.a):at(flight,t);
}
function message(text,kind=''){$('feedback').textContent=text;$('feedback').dataset.kind=kind;}
function graphPoint(t,v){return `${42+t*378/(level===5?60:level>=3?20:18)} ${level===5?90-v*75/180:level>=3?90-v*.625:165-v*1.25}`;}
function draw(t=0){
 const s=liveState(t);
 // Fit the known problem, then expand only as the observed flight needs more room.
 // Retain the expanded range on descent so the scale does not move under the rocket.
 const knownHeight=level===3||level===4?problem.h:0;
 const baseRange=level===1||level===2?320:Math.max(120,Math.ceil(knownHeight*1.2/40)*40);
 sceneHeightRange=Math.max(sceneHeightRange,baseRange,Math.ceil(s.y*1.2/40)*40);
 const heightRange=sceneHeightRange;
 const y=550-s.y*500/heightRange;
 for(let i=1;i<=4;i++)$('heightTick'+i).textContent=i*heightRange/4;
 $('heightScene').setAttribute('aria-label',`Rocket height above the launchpad, from zero to ${heightRange} meters. Gravity: −10 m/s².`);
 $('heightMarker').toggleAttribute('hidden',level<2||(level===2&&!answered));
 if(level>=3||(level===2&&answered)){
  const targetHeight=level===2?flight.apex:0;
  const targetY=550-targetHeight*500/heightRange;
  $('heightLine').setAttribute('d',`M65 ${targetY}H440`);
  $('heightText').setAttribute('y',targetY-9);
  $('heightText').textContent=level===2?`Final height: ${Number(targetHeight.toFixed(1))} m`:'Landing: 0 m';
 }
 $('rocket').setAttribute('transform',`translate(235 ${y})`);
 const start=550-(problem?.h||0)*500/heightRange;
 $('trail').setAttribute('d',`M235 ${start}V${y}`);
 $('flame').toggleAttribute('hidden',!running||paused||!s.engine);
 $('phase').textContent=paused?'Paused':s.phase;
 $('time').textContent=t.toFixed(2)+' s';$('height').textContent=s.y.toFixed(1)+' m';$('velocity').textContent=s.v.toFixed(1)+' m/s';
 $('acceleration').textContent='Acceleration: '+(flight?s.a.toFixed(1)+' m/s²':'—');
 let points=[[0,problem?.v||0]];
 if(flight&&(level===0||level===2)){if(t>flight.burn)points.push([flight.burn,flight.v]);points.push([t,s.v]);}
 else if(flight){points=flight.segments.filter(seg=>seg.t<=t).map(seg=>[seg.t,seg.v]);points.push([t,s.v]);}
 $('velocityPath').setAttribute('d',points.map(([time,v],i)=>(i?'L':'M')+graphPoint(time,v)).join(' '));
 const dot=graphPoint(t,s.v).split(' ');$('graphDot').setAttribute('cx',dot[0]);$('graphDot').setAttribute('cy',dot[1]);
 if(level===5)pilotControls();
}
function trialTable(){
 $('trials').replaceChildren();
 for(const [i,row] of histories[level].entries()){
  const tr=document.createElement('tr');
  for(const text of [i+1,row.inputText??row.input.toFixed(2),row.actualText??row.actual.toFixed(1),row.ok?'Met target':'Try again']){const td=document.createElement('td');td.textContent=text;tr.append(td);}
  $('trials').append(tr);
 }
}
function pilotControls(){
 if(level!==5){$('cutoff').disabled=true;$('ignite').disabled=true;return;}
 const s=flight?at(flight,elapsed):null;
 $('cutoff').disabled=!running||paused||!s||s.phase!=='Ascent burn';
 $('ignite').disabled=!running||paused||!s||s.v>=0||s.y<=0||flight.retroTime!==null;
}
function controls(){
 $('answer').disabled=running||answered;$('landingVelocity').disabled=running||answered;$('launch').disabled=running||answered;$('pause').disabled=!running;
 for(const id of ['burnHeightAnswer','burnVelocityAnswer','coastHeightAnswer'])$(id).disabled=running||answered;
 $('newProblem').hidden=level===5||!answered;
 $('pause').textContent=paused?'Resume':'Pause';$('next').hidden=level===5||!passed[level]||running;
 $('next').textContent=level===4?'Open investigation →':'Next mission →';
 $('abort').disabled=!running;
 for(let i=0;i<6;i++){$('level'+(i+1)).disabled=running||i>unlocked;$('level'+(i+1)).setAttribute('aria-current',i===level?'step':'false');}
 pilotControls();
}
function openLevel(n){
 if(running||n>unlocked||n<0||n>5)return;
 level=n;flight=null;elapsed=0;last=null;paused=false;answered=false;sceneHeightRange=0;problem=n<5?newConditions(n):null;
 const m=missions[n];$('missionLabel').textContent=n===5?'Open flight lab':`Mission 0${n+1} / 05`;$('missionTitle').textContent=m.title;
 for(const id of ['instruction','target','tolerance'])$(id).textContent=m[id];
 $('answerLabel').textContent=m.label;$('unit').textContent=m.unit;$('answer').value='';$('answer').min=m.min??0;$('answer').max=m.max??6;
 $('answerGroup').hidden=n===5;$('landingGroup').hidden=n!==3;$('landingVelocity').value='';$('pilot').hidden=n!==5;
 $('burnParts').hidden=n!==2;$('answerGroup').toggleAttribute('data-sum',n===2);
 for(const id of ['burnHeightAnswer','burnVelocityAnswer','coastHeightAnswer','answer']){$(id).value='';$(id).setAttribute('aria-invalid','false');}
 $('carry').hidden=n!==1&&n!==4;
 $('carry').textContent=n===1?'Every Level 2 flight uses exactly 60 m/s at cutoff: a 3.00 s burn ending at 90.0 m.':'Start a separate descent with the correct −60 m/s velocity supplied. Your trigger starts the burn automatically; work backward from −5 m/s using v = u + at, then check when that velocity is reached.';
 $('launch').textContent=['Test burn time','Test apex prediction','Test burn time','Test landing predictions','Test ignition velocity','Launch rocket'][n];
 $('trialInput').textContent=['Burn (s)','Prediction (m)','Burn (s)','Predicted t / v','Ignition (m/s)','Cutoff / brake time'][n];
 $('trialOutput').textContent=['Cutoff v (m/s)','Apex (m)','Apex (m)','Landing t / v','Landing v / burn used','Apex / landing v'][n];
 $('heightMarker').toggleAttribute('hidden',n!==2);$('complete').hidden=!passed.every(Boolean);
 $('equations').innerHTML='';$('reference').open=false;
 $('axisTop').textContent=n===5?'180':'120';$('axisMiddle').textContent=n>=3?'0':'60';$('axisBottom').textContent=n===5?'−180':n>=3?'−120':'0';
 for(let i=1;i<=4;i++)$('heightTick'+i).textContent=i*(n===5?450:300);
 $('heightScene').setAttribute('aria-label',`Rocket height above the launchpad, from zero to ${n===5?1800:1200} meters.`);
 const graphEnd=n===5?60:n>=3?20:18;
 $('axisT1').textContent=(graphEnd/3).toFixed(n===3||n===4?1:0);$('axisT2').textContent=(graphEnd*2/3).toFixed(n===3||n===4?1:0);$('axisT3').textContent=graphEnd;
 $('velocityGraph').setAttribute('aria-label',`Velocity-time graph: 0 to ${graphEnd} seconds; ${n===5?'-180':n>=3?'-120':'0'} to +${n===5?180:120} m/s.`);
 $('playback').textContent=n===5?'Playback: 1× · Manual flight controls':'Playback: 2× · Stops at the test point';
 message(n===5?'Launch, cut the ascent engine, and fire the landing burn during descent.':passed[n]?'Mission complete. Try another prediction or continue.':'Enter a prediction, then launch.');
 simplifyProblem();controls();trialTable();draw();
}
function simplifyProblem(){
 const p=problem,n=level;
 for(const id of ['missionLabel','instruction','carry','tolerance','modelNote','reference'])$(id).hidden=true;
 $('trialPanel').hidden=n!==5;$('complete').hidden=true;
 $('answerLabel').textContent=n===2?'Final height = h₁ + h₂':n===3?'Time':'Answer';$('landingLabel').textContent='Landing velocity';
 $('launch').textContent=n===5?'Launch':'Test';
 $('target').textContent=n===0?`Reach ${p.targetV} m/s. Burn time?`:n===1?'Maximum height above the ground?':n===2?'Final height at the apex?':n===3?'Time and velocity at landing?':n===4?`Land at ${p.finalV} m/s. Ignition velocity?`:'Launch. Cut the engine. Fire the landing burn.';
 $('givens').textContent=n===0?`Start at rest · net a = +${p.a} m/s²`:n===1?`Start: ${p.h} m · upward v = ${p.v} m/s`:n===2?`From rest at ground level · t = ${p.burn} s · net burn a = +${p.a} m/s²`:n===3?`Start: ${p.h} m · v = 0`:n===4?`Start: ${p.h} m, v = ${p.v} m/s · net burn a = +${p.brake} m/s² for ${p.fuel} s`:'Ascent +20 m/s² · brake +25 m/s² for 3 s';
 if(n===4){$('answer').min=-150;$('answer').max=p.v;}
 message('');$('feedback').hidden=true;
}
function launch(event){
 event.preventDefault();if(running||answered)return;
 $('feedback').hidden=false;
 const m=missions[level],raw=$('answer').value.trim(),input=Number(raw),min=level===4?-150:m.min,max=level===4?problem.v:m.max;
 if(level!==5&&(!raw||!Number.isFinite(input)||input<min||input>max)){message(`Enter a number from ${min} to ${max} ${m.unit}.`,'retry');$('answer').focus();return;}
 const velocityRaw=$('landingVelocity').value.trim(),velocity=Number(velocityRaw);
 if(level===3&&(!velocityRaw||!Number.isFinite(velocity)||velocity>=0||velocity< -200)){message('Enter a negative landing velocity from −200 to below 0 m/s.','retry');$('landingVelocity').focus();return;}
 const parts={};
 if(level===2){
  for(const [key,id,label,maxValue] of [['h1','burnHeightAnswer','height after burn',2000],['v1','burnVelocityAnswer','velocity after burn',200],['h2','coastHeightAnswer','coasting height',2000]]){
   const rawPart=$(id).value.trim(),value=Number(rawPart);
   if(!rawPart||!Number.isFinite(value)||value<0||value>maxValue){message(`Enter ${label} from 0 to ${maxValue} ${key==='v1'?'m/s':'m'}.`,'retry');$(id).focus();return;}
   parts[key]=value;
  }
 }
 if(level===0||level===2)flight={...solve(level===2?problem.burn:input,problem.a),input};
 else if(level===1){flight=trajectory(problem.h,problem.v);addPhase(flight,-G,problem.v/G,'Coasting');flight.input=input;}
 else if(level===3){flight=trajectory(problem.h,0);addPhase(flight,-G,Infinity,'Free fall');flight.input=input;flight.predictedV=velocity;}
 else if(level===4){flight=descent(input,problem);flight.input=input;}
 else{flight=trajectory(0,0);addPhase(flight,A,6,'Ascent burn',true);flight.cutoffTime=6;addPhase(flight,-G,Infinity,'Coasting · engine off');}
 if(level===2)flight.parts=parts;
 elapsed=0;last=null;running=true;paused=false;
 message(level===5?'You have control. Cut the engine during ascent; the landing burn unlocks during descent.':'Flight in progress. Compare your prediction with the motion.');
 controls();draw();frameId=requestAnimationFrame(frame);
}
function workedSolution(n,p){
 const f=value=>Number(value.toFixed(2)).toString();
 if(n===0)return [
  'v = u + at → t = (v − u) / a',
  `t = (${p.targetV} − 0) / ${p.a} = <strong>${f(p.targetV/p.a)} s</strong>`
 ];
 if(n===1)return [
  'At the apex, v = 0.  v² = u² + 2aΔy',
  `Δy = (0 − ${p.v}²) / (2 × −${G}) = ${f(p.v*p.v/(2*G))} m`,
  `H = ${p.h} + ${f(p.v*p.v/(2*G))} = <strong>${f(p.h+p.v*p.v/(2*G))} m</strong>`
 ];
 if(n===2)return [
  `h₁ = ½at² = ½ × ${p.a} × ${p.burn}² = ${f(.5*p.a*p.burn*p.burn)} m`,
  `Cutoff velocity = at = ${p.a} × ${p.burn} = ${f(p.a*p.burn)} m/s`,
  `h₂ = v²/(2g) = ${f(p.a*p.burn)}² / (2 × ${G}) = ${f((p.a*p.burn)**2/(2*G))} m`,
  `Final height = h₁ + h₂ = ${f(.5*p.a*p.burn*p.burn)} + ${f((p.a*p.burn)**2/(2*G))} = <strong>${f(solve(p.burn,p.a).apex)} m</strong>`
 ];
 if(n===3){const time=Math.sqrt(2*p.h/G);return [
  '0 = h − ½gt² → t = √(2h/g)',
  `t = √[(2 × ${p.h}) / ${G}] = <strong>${f(time)} s</strong>`,
  `v = −gt = −${G} × ${f(time)} ≈ <strong>${f(-G*time)} m/s</strong>`
 ];}
 if(n===4){const ignition=p.finalV-p.brake*p.fuel;return [
  'v = u + aΔt → ignition velocity u = v − aΔt',
  `u = ${p.finalV} − (${p.brake} × ${p.fuel}) = <strong>${f(ignition)} m/s</strong>`,
  `Start time = (u − v₀) / (−g) = (${f(ignition)} − (${p.v})) / (−${G}) = <strong>${f((p.v-ignition)/G)} s</strong>`
 ];}
 return [];
}
function finish(){
 running=false;paused=false;let ok=false,row,text;
 if(level<3){
  const actual=level===0?flight.v:flight.apex,target=level===0?problem.targetV:flight.input;
  ok=Math.abs(actual-target)<=[1,5,5][level]+1e-9;row={input:flight.input,actual,ok};
  if(level===2){
   flight.partChecks=[
    ['burnHeightAnswer',Math.abs(flight.parts.h1-flight.burnHeight)<=5+1e-9],
    ['burnVelocityAnswer',Math.abs(flight.parts.v1-flight.v)<=1+1e-9],
    ['coastHeightAnswer',Math.abs(flight.parts.h2-flight.v*flight.v/(2*G))<=5+1e-9],
    ['answer',ok]
   ];
   for(const [id,correct] of flight.partChecks)$(id).setAttribute('aria-invalid',String(!correct));
   ok=flight.partChecks.every(([,correct])=>correct);row.ok=ok;
  }
  if(level===0)text=`Cutoff velocity: ${actual.toFixed(1)} m/s after ${flight.burn.toFixed(2)} s. ${ok?'Target reached: v = at.':actual<TARGET_V?'Increase the burn time and try again.':'Decrease the burn time and try again.'}`;
  else if(level===1)text=`Measured apex: ${actual.toFixed(1)} m; your prediction: ${flight.input.toFixed(1)} m. ${ok?'The 90 m burn height plus 180 m of coasting gives 270 m.':'Include both the burn height and the additional coast height.'}`;
  else text=`Measured apex: ${actual.toFixed(1)} m; target: ${TARGET_H} m. ${ok?'Target reached: your burn-time calculation works.':actual<TARGET_H?'Try a longer burn.':'Try a shorter burn.'}`;
 }else if(level===3){
  ok=Math.abs(flight.input-flight.endTime)<=.5+1e-9&&Math.abs(flight.predictedV-flight.endV)<=2+1e-9;
  row={inputText:`${flight.input.toFixed(2)} s / ${flight.predictedV.toFixed(1)} m/s`,actualText:`${flight.endTime.toFixed(2)} s / ${flight.endV.toFixed(1)} m/s`,ok};
  text=`Landing: ${flight.endTime.toFixed(2)} s at ${flight.endV.toFixed(1)} m/s. ${ok?'Both predictions match; the next mission supplies this correct velocity.':'Use 0 = 180 − 5t², then v = −10t; both predictions must match.'}`;
 }else if(level===4){
  const used=flight.retroTime===null?0:Math.min(problem.fuel,flight.endTime-flight.retroTime);
  ok=Math.abs(flight.endV-problem.finalV)<=1+1e-9&&used>=problem.fuel-1e-8;
  row={input:flight.input,actualText:`${flight.endV.toFixed(1)} m/s / ${used.toFixed(2)} s`,ok};
  text=`Landing velocity: ${flight.endV.toFixed(1)} m/s; burn used: ${used.toFixed(2)} s. `+(ok?`Ignition at −80 m/s occurs after 2.00 s; the full burn ends at −5 m/s.`:flight.retroTime===null?'The rocket hit the ground before reaching your trigger.':used<FUEL-1e-8?'The ground interrupted the burn; ignite at a less negative velocity.':'Work backward from −5 m/s with u = v − aΔt, then retry.');
 }else{
  ok=Math.abs(flight.endV)<=6;
  row={inputText:`${flight.cutoffTime.toFixed(2)} s / ${flight.retroTime===null?'none':flight.retroTime.toFixed(2)+' s'}`,actualText:`${flight.apex.toFixed(1)} m / ${flight.endV.toFixed(1)} m/s`,ok};
  text=`${ok?'Soft':'Hard'} landing at ${flight.endV.toFixed(1)} m/s; apex ${flight.apex.toFixed(1)} m. ${flight.retroTime===null?'Try a landing burn during descent.':'Adjust the ascent cutoff or landing-burn timing and compare another trial.'}`;
 }
 histories[level].push(row);
 if(ok&&level<5){passed[level]=true;unlocked=Math.max(unlocked,level+1);}
 if(level<5){
  answered=true;text=ok?'Correct.':'Not quite. Try new numbers.';
  $('equations').innerHTML=workedSolution(level,problem).join('<br>');
  $('reference').hidden=false;$('reference').open=true;
 }
 message(text,ok?'pass':'retry');$('complete').hidden=true;
 if(passed.every(Boolean)&&!completionSent){completionSent=true;window.parent.postMessage({ type: 'complete' }, '*');}
 controls();trialTable();draw(elapsed);if(level===0)$('phase').textContent='Engine cutoff · test complete';
}
function endTime(){return level===0?flight.burn:level===2?flight.apexTime:flight.endTime;}
function frame(now){
 if(!running)return;
 if(last!==null&&!paused&&!document.hidden)elapsed+=Math.min(.1,(now-last)/1000)*(level===5?1:2);
 last=now;elapsed=Math.min(elapsed,endTime());draw(elapsed);
 if(elapsed>=endTime()){finish();return;}frameId=requestAnimationFrame(frame);
}
function trimFlight(t){
 const state=at(flight,t),segments=flight.segments.filter(s=>s.t<t);
 if(segments.length)segments[segments.length-1].duration=t-segments[segments.length-1].t;
 flight.segments=segments;flight.endTime=t;flight.endY=state.y;flight.endV=state.v;flight.landed=false;
 flight.apex=Math.max(0,...segments.flatMap(s=>{const end=stateIn(s,s.t+s.duration);const top=s.a<0&&s.v>0&&s.v/(-s.a)<s.duration?s.y-s.v*s.v/(2*s.a):0;return [s.y,end.y,top];}));
}
function cutoff(){
 if(level!==5||!running||paused||at(flight,elapsed).phase!=='Ascent burn')return;
 trimFlight(elapsed);flight.cutoffTime=elapsed;addPhase(flight,-G,Infinity,'Coasting · engine off');controls();draw(elapsed);
}
function ignite(){
 if(level!==5||!running||paused||flight.retroTime!==null)return;
 const s=at(flight,elapsed);if(s.v>=0||s.y<=0)return;
 trimFlight(elapsed);flight.retroTime=elapsed;flight.retroHeight=s.y;flight.retroVelocity=s.v;
 addPhase(flight,BRAKE,FUEL,'Landing burn',true);if(!flight.landed)addPhase(flight,-G,Infinity,'Fuel exhausted · falling');
 controls();draw(elapsed);
}
function abort(){cancelAnimationFrame(frameId);running=false;paused=false;openLevel(level);}
$('flightForm').addEventListener('submit',launch);
$('pause').addEventListener('click',()=>{if(!running)return;paused=!paused;last=null;controls();draw(elapsed);});
$('next').addEventListener('click',()=>openLevel(level+1));
$('newProblem').addEventListener('click',()=>openLevel(level));
$('cutoff').addEventListener('click',cutoff);$('ignite').addEventListener('click',ignite);$('abort').addEventListener('click',abort);
for(let i=0;i<6;i++)$('level'+(i+1)).addEventListener('click',()=>openLevel(i));
$('restart').addEventListener('click',()=>{cancelAnimationFrame(frameId);running=false;paused=false;unlocked=0;passed=Array(5).fill(false);histories=Array.from({length:6},()=>[]);openLevel(0);});
openLevel(0);
