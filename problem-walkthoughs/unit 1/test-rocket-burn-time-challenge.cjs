const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
class Element {
  constructor(){this.value='';this.hidden=false;this.disabled=false;this.dataset={};this.handlers={};this.children=[];}
  setAttribute(k,v){this[k]=v;}
  toggleAttribute(k,v){this[k]=v;}
  addEventListener(k,v){this.handlers[k]=v;}
  replaceChildren(){this.children=[];}
  append(el){this.children.push(el);}
  focus(){}
}
const elements=new Map(), get=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id);};
const messages=[],callbacks=new Map();let frameId=0;
const context=vm.createContext({assert,document:{hidden:false,getElementById:get,createElement:()=>new Element()},window:{parent:{postMessage:m=>messages.push(m)}},requestAnimationFrame:f=>{callbacks.set(++frameId,f);return frameId;},cancelAnimationFrame:id=>callbacks.delete(id)});
const html=fs.readFileSync(__dirname+'/rocket-burn-time-challenge.html','utf8');
vm.runInContext(fs.readFileSync(__dirname+'/rocket-burn-time-challenge.js','utf8'),context);
vm.runInContext(`
const near=(a,b)=>assert(Math.abs(a-b)<1e-6);
near(solve(3).apex,270);
for(const burn of [.1,1,3,6]){
 const result=solve(burn);near(sample(result.apexTime,burn).y,result.apex);
 near(sample(result.apexTime,burn).v,0);
}
assert.equal($('level2').disabled,true);openLevel(2);assert.equal(level,0);
function expected(){
 if(level===0)return problem.targetV/problem.a;
 if(level===1)return problem.h+problem.v*problem.v/(2*G);
 if(level===2)return .5*problem.a*problem.burn*problem.burn+(problem.a*problem.burn)**2/(2*G);
 if(level===3)return Math.sqrt(2*problem.h/G);
 return problem.finalV-problem.brake*problem.fuel;
}
function trial(input){
 $('answer').value=String(input);
 if(level===2){
  $('burnHeightAnswer').value=String(.5*problem.a*problem.burn**2);
  $('burnVelocityAnswer').value=String(problem.a*problem.burn);
  $('coastHeightAnswer').value=String((problem.a*problem.burn)**2/(2*G));
 }
 if(level===3)$('landingVelocity').value=String(-G*Math.sqrt(2*problem.h/G));
 launch({preventDefault(){}});assert(running);elapsed=endTime();finish();
}
for(let n=0;n<5;n++){
 openLevel(n);
 assert($('reference').hidden);assert($('trialPanel').hidden);assert($('carry').hidden);
 assert($('instruction').hidden);assert.equal($('answerLabel').textContent,n===2?'Final height = h₁ + h₂':n===3?'Time':'Answer');
 assert.equal($('burnParts').hidden,n!==2);
 assert.equal(flight,null);assert.equal($('feedback').hidden,true);
 if(n===1){near(liveState(0).y,problem.h);near(liveState(0).v,problem.v);}
 for(let attempt=0;attempt<15;attempt++){
  const signature=previousProblems[n],answer=expected();
  if(n===1)assert([30,40,50,60].includes(problem.v),'Level 2 velocity is a multiple of 10');
  if(n>=3){
   const known=problem.h;
   assert(sceneHeightRange>=known*1.2&&sceneHeightRange<known*1.2+40,'Scale fits problem height');
   const target=0;
   near(Number($('heightLine').d.match(/^M65 ([^H]+)/)[1]),550-target*500/sceneHeightRange);
   assert(!$('heightMarker').hidden);
  }
  if(n===0)assert(Number.isInteger(answer)&&answer>=1&&answer<=6,'Level 1 uses whole seconds from 1 through 6');
  if(n===2)assert($('heightMarker').hidden,'Do not reveal the predicted height before the answer');
  trial(answer);assert(passed[n]);assert(answered);assert($('answer').disabled);
  assert(!$('reference').hidden);assert($('reference').open);
  assert($('equations').innerHTML.includes('<strong>'+Number(answer.toFixed(2))+(n===1||n===2?' m':n===4?' m/s':' s')+'</strong>'),'Worked solution matches the current problem');
  assert.equal($('feedback').textContent,'Correct.');
  assert(!$('newProblem').hidden);
  const count=histories[n].length;launch({preventDefault(){}});assert(!running);assert.equal(histories[n].length,count,'Same revealed problem cannot be resubmitted');
  if(n===1){near(flight.apex,answer);near(at(flight,flight.endTime).v,0);}
  if(n===4){near(flight.endV,problem.finalV);near(flight.endTime-flight.retroTime,problem.fuel);}
  if(n===2){
   near(elapsed,flight.apexTime);near(flight.apex,answer);near(liveState(elapsed).v,0);assert.equal($('unit').textContent,'m');
   near(Number($('heightLine').d.match(/^M65 ([^H]+)/)[1]),550-answer*500/sceneHeightRange);
   near(Number($('rocket').transform.match(/translate[(]235 ([^)]+)/)[1]),550-answer*500/sceneHeightRange);
  }
  $('newProblem').handlers.click();assert.notEqual(previousProblems[n],signature,'New conditions each time');
  assert.equal(flight,null);assert.equal($('answer').value,'');assert.equal($('feedback').hidden,true);assert(!answered);
  assert($('reference').hidden);assert(!$('reference').open);assert.equal($('equations').innerHTML,'','Previous solution cleared');
 }
}
assert(passed.every(Boolean));assert.equal(unlocked,5);assert(completionSent);
for(const wrongId of ['burnHeightAnswer','burnVelocityAnswer','coastHeightAnswer','answer']){
 openLevel(2);
 $('answer').value=String(expected());
 launch({preventDefault(){}});assert(!running,'All component inputs required');
 $('burnHeightAnswer').value=String(.5*problem.a*problem.burn**2);
 $('burnVelocityAnswer').value=String(problem.a*problem.burn);
 $('coastHeightAnswer').value=String((problem.a*problem.burn)**2/(2*G));
 $(wrongId).value=String(Number($(wrongId).value)+20);
 launch({preventDefault(){}});assert(running);elapsed=endTime();finish();
 assert.equal($('feedback').textContent,'Not quite. Try new numbers.');
 assert.equal($(wrongId)['aria-invalid'],'true');
 assert.equal(flight.partChecks.filter(([,correct])=>!correct).length,1,'Each component is graded independently');
 $('newProblem').handlers.click();
 for(const id of ['burnHeightAnswer','burnVelocityAnswer','coastHeightAnswer','answer']){assert.equal($(id).value,'');assert.equal($(id)['aria-invalid'],'false');}
}
openLevel(1);const bad=expected()+50;trial(bad);assert.equal($('feedback').textContent,'Not quite. Try new numbers.');
assert(!$('reference').hidden);assert($('reference').open);assert($('equations').innerHTML.includes('<strong>'+Number(expected().toFixed(2))+' m</strong>'),'Wrong answers reveal the correct worked solution');
assert(answered);const old=previousProblems[1];$('newProblem').handlers.click();assert.notEqual(previousProblems[1],old);
openLevel(5);assert($('answerGroup').hidden);assert(!$('pilot').hidden);assert(!$('trialPanel').hidden);
launch({preventDefault(){}});assert(running);elapsed=3;cutoff();near(flight.apex,270);
draw(9);const expandedRange=sceneHeightRange;draw(10);assert.equal(sceneHeightRange,expandedRange,'Scale stays fixed on descent');
const ignitionV=Math.sqrt((2*BRAKE*G*270+G*25)/(BRAKE+G));
elapsed=9+ignitionV/G;ignite();near(flight.endV,-5);elapsed=endTime();finish();assert(histories[5][0].ok);
launch({preventDefault(){}});abort();assert(!running);assert.equal(histories[5].length,1);
$('restart').handlers.click();assert.equal(unlocked,0);assert(!passed.some(Boolean));
for(const value of ['', 'NaN','-1','0','7','Infinity']){$('answer').value=value;launch({preventDefault(){}});assert(!running);}
$('answer').value=String(expected());launch({preventDefault(){}});frame(100);frame(150);const before=elapsed;
$('pause').handlers.click();frame(200);frame(250);assert.equal(elapsed,before);
$('pause').handlers.click();frame(300);frame(350);assert(elapsed>before);
document.hidden=true;const hiddenTime=elapsed;frame(400);assert.equal(elapsed,hiddenTime);document.hidden=false;
$('restart').handlers.click();assert(!running);assert.equal(elapsed,0);
`,context);
assert.equal(messages.length,1,'Completion once after all five guided levels');
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(ids.length,new Set(ids).size);
const js=fs.readFileSync(__dirname+'/rocket-burn-time-challenge.js','utf8');
for(const m of js.matchAll(/\$\('([^']+)'\)/g))assert(ids.includes(m[1]),'Missing control '+m[1]);
assert(html.includes('id="velocityGraph"'),'Graph preserved');
console.log('Passed: 75 randomized guided problems, no immediate repeats, no replaying revealed answers, graph retained, physics, manual investigation, pause and reset.');
