const assert=require('node:assert/strict');const {solve,state}=require('./model.js');
const base={part:'ramp',friction:.2,connected:true,mass:.18,drop:1,compression:.18,stretch:.25,battery:1.8};
assert.equal(solve(base).height,.8);assert.equal(solve({...base,friction:0}).height,1);
assert.equal(solve({...base,part:'trigger'}).height,0);
assert.equal(solve({...base,part:'weight',mass:.13,drop:1.4}).height,0);
assert.equal(solve({...base,part:'weight',mass:.14,drop:1.3}).height,1.3);
assert.equal(solve({...base,part:'weight',mass:.30,drop:.6}).height,.6);
assert(solve({...base,part:'spring',compression:.23}).reached);
assert(!solve({...base,part:'spring',compression:.20}).reached);
assert(solve({...base,part:'battery',battery:2.5}).reached);
assert(solve({...base,part:'band',stretch:.35}).reached);
for(const part of ['ramp','trigger','weight','spring','band','battery'])for(const connected of [true,false])for(const friction of [0,.2,.4])for(const value of [.08,.13,.14,.3]){
 const o={...base,part,connected,friction,mass:value,compression:value,stretch:value};const r=solve(o);
 assert(r.height>=0&&r.height<=1.4);assert(r.remaining>=-1e-10);assert(r.thermal>=-1e-10);
 assert(Math.abs(r.E0+r.store-r.ballPE-r.cupPE-r.remaining-r.thermal)<1e-9,'End energy balanced');
 for(let t=0;t<=6.5;t+=.025){const s=state(o,t);assert(Math.abs(s.total-s.ballPE-s.cupPE-s.ke-s.remaining-s.heat)<1e-9,'Energy balanced throughout '+part+' at '+t);assert(s.heat>=-1e-9);assert(s.remaining>=-1e-9);}
}
console.log('PASS: friction, trigger, force threshold, drop limits, target thresholds, and energy balance throughout every stage.');
