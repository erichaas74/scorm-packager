const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
class Element {
  constructor(){this.style={};this.dataset={};this.children=[];this.handlers={};this.classList={add(){},remove(){}};}
  setAttribute(k,v){this[k]=v;} addEventListener(k,v){this.handlers[k]=v;}
  append(b){this.children.push(b);} replaceChildren(){this.children=[];} focus(){}
}
const elements = new Map();
const get = id => {if(!elements.has(id))elements.set(id,new Element());return elements.get(id);};
const locations = ['A','B','C','D'].map(answer=>{const e=new Element();e.dataset.answer=answer;return e;});
const bars = ['peg','ke','pes'].map(answer=>{const e=new Element();e.dataset.answer=answer;return e;});
const document = {hidden:false,body:new Element(),getElementById:get,createElement:()=>new Element(),addEventListener(){},querySelectorAll:s=>s==='.location'?locations:s==='.energy-choice'?bars:[]};
const context = vm.createContext({document,requestAnimationFrame(){},assert});
vm.runInContext(fs.readFileSync(__dirname+'/energy-transfer-challenge-netlify/app.js','utf8'),context);
vm.runInContext(`
for(let i=0;i<=10000;i++){
  const s=stateAt(PERIOD*i/10000);
  assert(Math.abs(s.peg+s.ke+s.pes-1)<1e-10,'Total energy conserved');
  assert(s.h>=-1e-10 && s.h<=HEIGHT+1e-10,'Height bounds');
  assert(s.x>=-1e-10 && s.x<=COMPRESSION+1e-10,'Compression bounds');
}
const equal=stateAt(questions[3].time);
assert(Math.abs(equal.peg-.5)<1e-10 && Math.abs(equal.ke-.5)<1e-10 && equal.pes===0);
for(const q of questions.filter(q=>!q.type)){
 const s=stateAt(q.time);assert(s[q.answer]>Math.max(...['peg','ke','pes'].filter(k=>k!==q.answer).map(k=>s[k])));
}
answer('peg');assert.equal(score,0,'Cannot answer during watch');
frame(0);paused=true;frame(100);assert.equal(elapsed,0,'Pause holds time');paused=false;
document.hidden=true;frame(200);assert.equal(elapsed,0,'Hidden tab holds time');document.hidden=false;
elapsed=5*PERIOD-.02;lastFrame=null;frame(300);assert.equal(mode,'watch');frame(400);assert.equal(mode,'question-motion','Starts question bounce after five intro cycles');
let clock=500;
for(let i=0;i<5;i++){
  const q=questions[i];
  assert.equal(mode,'question-motion');assert.equal(questionElapsed,0,'Every question resets to top');assert.equal($('ball').cy,80);
  assert(document.querySelectorAll('.energy-choice').every(b=>b.disabled),'Bars disabled during motion');
  answer(q.answer);assert.equal(score,i,'No scoring during motion');
  frame(clock+=100);
  while(questionElapsed<PERIOD-.05)frame(clock+=100);
  assert.equal(mode,'question-motion','Must complete a full cycle before stopping');
  while(mode==='question-motion')frame(clock+=100);
  assert(Math.abs(questionElapsed-(PERIOD+q.time))<1e-10,'Stops exactly at tested phase after one cycle');
  if(q.type==='position'){assert.equal($('locations').hidden,false);assert.equal($('pegValue').textContent,'50%');assert.equal($('keValue').textContent,'50%');}
  else assert.equal($('pegValue').textContent,'?','Energy hidden until answer');
  const controls=document.querySelectorAll(q.type==='position'?'.location':'.energy-choice');
  const correctControl=controls.find(b=>b.dataset.answer===q.answer);
  assert.equal(correctControl.disabled,false);correctControl.handlers.click();
  answer(q.answer);assert.equal(score,i+1,'Duplicate answers cannot inflate score');
  assert(controls.every(b=>b.disabled),'Lock controls after first choice');
  $('next').handlers.click();
}
assert.equal(mode,'done');assert.equal(score,5);assert.equal(responses.length,5);
restart();assert.equal(mode,'watch');assert.equal(score,0);assert.equal(elapsed,0);assert.equal(responses.length,0);
showQuestion();answer('ke');assert.equal(score,0);assert.equal(responses.length,1);answer('peg');assert.equal(score,0,'Wrong first answer cannot be retried');
`,context);
console.log('PASS: physics; five-cycle intro; every question starts at top and completes a bounce before exact stop; click bars to score; equal-energy locations; input lock; duplicate protection; replay.');
