const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const nodes=new Map(),get=id=>{if(!nodes.has(id))nodes.set(id,{dataset:{},textContent:'',setAttribute(){},addEventListener(){}});return nodes.get(id);};
const ctx=vm.createContext({window:{showpieceKind:'wire'},document:{getElementById:get},innerWidth:390,matchMedia:()=>({matches:true,addEventListener(){}}),requestAnimationFrame(){},addEventListener(){}});
vm.runInContext(fs.readFileSync(path.join(__dirname,'unit 6/showpiece-demos.js'),'utf8'),ctx);
const p=ctx.window.showpiecePhysics,near=(a,b,tol=1e-7)=>assert(Math.abs(a-b)<tol,`${a} != ${b}`);
for(const a of [-.8,0,.8]){
  for(const t of [.05,.3,.7,1.1,1.3]){const h=1e-5,q=p.beam(t,a),before=p.beam(t-h,a),after=p.beam(t+h,a);near((after.y-before.y)/(2*h),q.vy);near((after.vy-before.vy)/(2*h),q.ay);near(q.vx,1);}
  for(const edge of [.15,1]){near(p.beam(edge-1e-9,a).y,p.beam(edge+1e-9,a).y);near(p.beam(edge-1e-9,a).vy,p.beam(edge+1e-9,a).vy);}
  near(p.beam(1.3,a).y,p.beam(1,a).y+.3*p.beam(1,a).vy);
  for(let t=.13;t<1.2;t+=.13)near(p.beam(t+.13,a).x-p.beam(t,a).x,.13);
}
near(p.beam(1.3,.8).y,-p.beam(1.3,-.8).y);near(p.beam(1.3,0).y,0);
for(const t of [0,.1,1,2.5,5])for(const d of [-1,0,1]){
  const all=Array.from({length:36},(_,i)=>p.electron(t,i,d));
  near(all.reduce((s,e)=>s+e.x,0)/36,-d*9*t);near(all.reduce((s,e)=>s+e.y,0),0);
}
console.log('PASS: continuous beam trajectory, tangent exit, field reversal, equal-time spacing, and zero-mean irregular motion plus signed electron drift.');
