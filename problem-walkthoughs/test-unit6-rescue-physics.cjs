const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const nodes=new Map();const get=id=>{if(!nodes.has(id))nodes.set(id,{textContent:'',dataset:{},setAttribute(){},addEventListener(){}});return nodes.get(id);};
const ctx=vm.createContext({window:{},document:{getElementById:get},matchMedia:()=>({matches:true,addEventListener(){}}),requestAnimationFrame(){}});
vm.runInContext(fs.readFileSync(path.join(__dirname,'unit 6/guillotine-rescue.js'),'utf8'),ctx);
const p=ctx.window.rescuePhysics,near=(a,b)=>assert(Math.abs(a-b)<1e-7,`${a} != ${b}`);
const open=p.crossing(null);near(open.t,Math.sqrt(2/p.g));near(open.y,1);assert(open.v>p.limit);
for(const t0 of [0,.05,.15,.3,.43]){
  const initial=p.model(t0,null),on={t:t0,...initial};
  near(p.model(t0,on).y,initial.y);near(p.model(t0,on).v,initial.v);
  const end=p.crossing(on);near(end.y,1);assert(end.t>=open.t-1e-9);
  for(const dt of [.01,.05,.1]){
    const t=t0+dt,h=1e-5,a=p.model(t+h,on),b=p.model(t-h,on),s=p.model(t,on);
    near((a.y-b.y)/(2*h),s.v);
    assert(Math.abs((a.v-b.v)/(2*h)-(p.g-s.v/p.tau))<1e-5);
  }
}
assert(p.crossing({t:.05,...p.model(.05,null)}).v<=p.limit);
assert(p.crossing({t:.43,...p.model(.43,null)}).v>p.limit);
console.log('PASS: free fall, continuous brake activation, exact velocity/acceleration, catch crossing and early/late outcomes.');
