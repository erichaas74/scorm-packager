const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const html=fs.readFileSync(process.argv[2]||'problem-walkthoughs/unit 5/Unit 5 - Lesson 4 - 02 - Romer - Eclipse Timing.html','utf8');
const elements=new Map();const get=id=>{if(!elements.has(id))elements.set(id,{textContent:'',innerHTML:'',attrs:{},setAttribute(k,v){this.attrs[k]=v;}});return elements.get(id)};
let frame,complete=0;const sandbox={Math,Set,innerWidth:1040,document:{hidden:false,getElementById:get,addEventListener(){}},matchMedia:()=>({matches:process.argv.includes("--reduced"),addEventListener(){}}),requestAnimationFrame:f=>{frame=f;return 1;},window:{parent:{postMessage(){complete++}},addEventListener(){}}};
vm.createContext(sandbox);vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],sandbox,{timeout:3000});
let last=sandbox.window.romerState(),states=[],prevStage=-1,prevCycle=-1;
for(let ms=0;ms<140000;ms+=100){frame(ms+1);const s=sandbox.window.romerState();assert(s.time>=last.time);assert.equal(s.day,s.time/1440);assert(Math.abs(sandbox.window.romerModel(s.day).a-s.time/1440/365.25*Math.PI*2)<1e-9);if(s.stage!==prevStage||s.cycle!==prevCycle){states.push({second:ms/1000,stage:s.stage,cycle:s.cycle,time:s.time});prevStage=s.stage;prevCycle=s.cycle;}last=s;}
assert.equal(last.cycle,3);for(const mark of states.filter(s=>s.stage===0&&s.cycle>0))assert(Math.abs(mark.second-45*mark.cycle)<=.11);assert.equal(complete,1);assert(last.nearRecord&&last.farRecord);assert(Math.abs((last.events.far-last.events.near)/(1.769*1440)-69)<1e-8);assert(last.farRecord.lag>last.nearRecord.lag);
console.log(JSON.stringify({states,near:last.nearRecord.lag,far:last.farRecord.lag,complete,cycles:last.cycle},null,2));
