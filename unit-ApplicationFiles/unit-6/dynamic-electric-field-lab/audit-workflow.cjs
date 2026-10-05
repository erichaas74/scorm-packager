// Regression checks using the shipped model and a minimal DOM substitute.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
function mount(file, storage = new Map(), width = 760) {
  const html = fs.readFileSync(path.join(__dirname, file), 'utf8');
  const elements = new Map();
  const make = () => ({style:{}, children:[], events:{}, classList:{add(){},remove(){}},
    setAttribute(){}, addEventListener(t,f){this.events[t]=f;}, appendChild(e){this.children.push(e);},
    focus(){}, scrollIntoView(){}, getBoundingClientRect(){return {width,height:520,left:0,top:0};},
    getContext(){return new Proxy({}, {get:()=>()=>{}});}, getElementsByTagName(){return [];}});
  for (const m of html.matchAll(/\bid="([^"]+)"/g)) elements.set(m[1],make());
  elements.get('electric-field-buzz-lab').querySelector = s => {assert(elements.has(s.slice(1)),s);return elements.get(s.slice(1));};
  const context = vm.createContext({document:{getElementById:id=>elements.get(id),createElement:make},
    sessionStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
    window:{devicePixelRatio:1,location:{protocol:'http:'},addEventListener(){},setTimeout(){},clearTimeout(){},confirm:()=>true},
    requestAnimationFrame(){},performance:{now:()=>0},console});
  const script = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].find(m=>m[1].includes('var PHYSICS'))[1];
  vm.runInContext(script.replace(/\}\(\)\);\s*$/, 'globalThis.audit = {app, PHYSICS, getState:()=>state, resetProgress}; }());'),context);
  return {a:context.audit,elements,storage,script};
}
function trial(a,index,charges) {
  a.app.loadLevel(index,false);
  a.app.charges=charges.map(([x,y,q])=>({x:x*a.app.width,y:y*a.app.height,q,fixed:false,radius:18}));
  a.app.selectedCharge=a.app.charges[0];
  a.app.start();
  for(let i=0;i<1100 && a.app.isPlaying;i++) a.app.update(1/60);
  return a.app.levelComplete;
}
// Deterministic model search, not evidence of a usable student/browser workflow.
let seed=718;
function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
for(const width of [760,320]) {
  const base=mount('dynamic_electric_field_lab.html',new Map(),width);
  let solution;
  for(let n=0;n<12000;n++) {
    const charges=Array.from({length:2+n%2},()=>[.07+.86*random(),.07+.86*random(),random()<.5?1:-1]);
    if(trial(base.a,2,charges)){solution=charges;break;}
  }
  assert(solution,'No model solution found for Challenge 3');
  for(const file of ['dynamic_electric_field_lab.html','u6l2-dynamic-electric-field-buzz-assessment-template.html','u6l2-dynamic-electric-field-buzz-assessment-template-preview.html']) {
    let lab=mount(file,new Map(),width); const {a,elements,storage}=lab;
    a.app.addCharge(-1);a.app.start();assert.equal(a.app.isPlaying,false);assert.equal(a.getState().attempts[0],0);
    assert(trial(a,0,[[.12,.52,1]]));
    const record=JSON.stringify(a.getState().records[0]);assert(record.includes('"charges"'));
    assert(Math.abs(a.getState().records[0].charges[0].fx-.12)<1e-12);
    a.app.resetParticle();
    const before=a.app.charges[0].x;
    elements.get('ef-canvas').events.keydown({key:'ArrowRight',preventDefault(){}});
    assert.equal(a.app.charges[0].x,before+3);assert(a.app.selectedCharge);
    assert.equal(JSON.stringify(a.getState().records[0]),record);
    a.app.loadLevel(1);a.app.loadLevel(0);assert.equal(a.app.userCharges().length,1);
    assert.equal(a.app.charges[0].x,before+3);
    assert(!elements.has('ef-charge-x'));assert(!elements.has('ef-charge-select'));
    assert(trial(a,1,[[.86,.48,-1]]));
    assert(trial(a,2,solution));assert.equal(elements.get('ef-progress-percent').textContent,'100%');
    assert.match(elements.get('ef-question-8-evidence').innerHTML,/from left/);
    assert.equal(elements.get('ef-next-level').textContent,'Answer questions');
    elements.get('ef-next-level').events.click(); assert.equal(elements.get('ef-success-modal').hidden,true);
    a.app.resetParticle();
    const original=a.app.selectedCharge; elements.get('ef-canvas').events.keydown({key:']',preventDefault(){}}); assert.notEqual(a.app.selectedCharge,original);
    const draft=JSON.stringify(a.getState().drafts[2]);
    lab=mount(file,storage,width);assert.equal(lab.elements.get('ef-progress-percent').textContent,'100%');assert.equal(lab.a.app.userCharges().length,solution.length);
    assert.equal(JSON.stringify(lab.a.getState().drafts[2]),draft);
    lab.a.app.clearCharges();assert.equal(lab.elements.get('ef-progress-percent').textContent,'100%');assert(lab.a.getState().records[2].charges.length);
    lab.a.resetProgress();assert.equal(lab.elements.get('ef-progress-percent').textContent,'0%');assert(lab.a.getState().records.every(r=>r===null));
    assert(lab.a.getState().drafts.every(d=>d.length===0));
    console.log(JSON.stringify({file,width,normalModelPath:'3/3',wrongSignRejected:true,snapshots:'immutable and available beside questions',drafts:'restored after switching and refresh',keyboard:'movement and reselection passed',reset:'0%'}));
  }
}
const source=mount('dynamic_electric_field_lab.html');
assert(trial(source.a,2,[[.1689931740425527,.886041636695154,1],[.8646158644510433,.6047938295081259,-1]]));
assert.equal(source.elements.get('ef-progress-percent').textContent,'33%');
assert.match(source.elements.get('ef-success-message').textContent,/remaining core challenges/);
source.elements.get('ef-next-level').events.click();assert.equal(source.a.getState().selected,0);
const legacy=new Map([['buzz-u6l2-electric-field-v1',JSON.stringify({version:1,selected:0,records:[{positive:1,negative:0,targetSpeed:11},null,null,null,null],attempts:[1,0,0,0,0]})]]);
const migrated=mount('dynamic_electric_field_lab.html',legacy);
assert(migrated.a.getState().records[0]);assert.equal(migrated.elements.get('ef-progress-percent').textContent,'0%');
assert.match(migrated.elements.get('ef-question-7-evidence').innerHTML,/Earlier completion retained/);
console.log('PASS: out-of-order completion and honest legacy-record migration.');
assert.equal(source.script,mount('u6l2-dynamic-electric-field-buzz-assessment-template.html').script);
assert.equal(source.script,mount('u6l2-dynamic-electric-field-buzz-assessment-template-preview.html').script);
console.log('PASS: source/template/preview simulation scripts agree.');
