const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.join(__dirname, 'unit 6');
// Minimal DOM shell: these assertions test the shipped model, not browser layout.
const nodes = new Map();
const node = key => {
  if (!nodes.has(key)) nodes.set(key, {textContent:'', value:'1', dataset:{}, addEventListener(){}, setAttribute(){}, focus(){}});
  return nodes.get(key);
};
const context = vm.createContext({window:{motorChallenge:{kind:'motor',title:'Motor'}}, document:{getElementById:node, querySelector:node, querySelectorAll:()=>[]}, matchMedia:()=>({matches:true,addEventListener(){}}), innerWidth:390, addEventListener(){}, requestAnimationFrame(){}});
vm.runInContext(fs.readFileSync(path.join(root,'textbook-diagrams.js'),'utf8'),context);
context.Unit6Diagrams=context.window.Unit6Diagrams;
vm.runInContext(fs.readFileSync(path.join(root,'motor-challenges.js'),'utf8'),context);
const m=context.window.challengePhysics;
const near=(actual,expected)=>assert(Math.abs(actual-expected)<1e-7,`${actual} != ${expected}`);
for(let n=0;n<=3;n++) {const r=m.load(n); near(r.power,n*6*6/12); near(r.torque*10,r.power);}
near(m.load(2).torque/m.load(1).torque,2);
for(const i of [-1,1]) for(const b of [-1,1]) near(m.force(i,b),-i*b);
for(const w of [0,5,10,20,30]) {near(m.output(w,1),w*.2);near(m.output(w,-1),-m.output(w,1));}
for(const x of [85,120,180,230,270]) for(const p of [-1,1]) for(const v of [-100,0,100]) {
  const dx=1e-3;
  const derivative=(m.flux(x+dx,p)-m.flux(x-dx,p))/(2*dx);
  near(m.emf(x,v,p),-derivative*v);
}
assert(m.emf(180,100,1)<0);
assert(m.emf(180,-100,1)>0);
assert(m.emf(180,100,-1)>0);
console.log('PASS: generator power/torque balance, voltage polarity/speed, all wire force reversals, and Faraday derivative/sign/zero-motion cases.');
