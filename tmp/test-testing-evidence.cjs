const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('problem-walkthoughs/unit 4/rube-goldberg-testing-evidence.html','utf8');
const source=html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/reset\(\);\r?\n\}\)\(\);/,'reset();globalThis.inspect=()=>({mode,count,q,answers:[...answers],setupAnswered,running,active});\n})();');
const expected=[[false,false,true,true],[true,true,true,true],[false,false,false,false],[false,false,true,false],[true,false,true,true]];
function boot(staticMode){
 const nodes={},messages=[],pending=new Map();let seq=0,clock=0;
 class Element{constructor(){this.children=[];this.events={};this.hidden=false;this.disabled=false;this.checked=false;this.textContent='';this.innerHTML='';}append(e){this.children.push(e);}replaceChildren(){this.children=[];this.textContent='';this.innerHTML='';}addEventListener(k,f){this.events[k]=f;}focus(){}click(){this.events.click?.();}}
 for(const m of html.matchAll(/<[^>]+\bid="([^"]+)"[^>]*>/g)){nodes[m[1]]=new Element();nodes[m[1]].hidden=/\bhidden\b/.test(m[0]);}
 const media={matches:staticMode,addEventListener(k,f){this.change=f;}};
 const context={document:{getElementById:id=>nodes[id],createElement:()=>new Element()},matchMedia:()=>media,performance:{now:()=>clock},requestAnimationFrame:f=>{pending.set(++seq,f);return seq;},cancelAnimationFrame:id=>pending.delete(id),window:{parent:{postMessage:(data,origin)=>messages.push({data,origin})}}};
 vm.runInNewContext(source,context);
 function finish(){clock+=10000;const callbacks=[...pending.values()];pending.clear();callbacks.forEach(f=>f(clock));}
 function choose(text){const b=nodes.choices.children.find(b=>b.textContent===text);assert(b,`choice ${text}`);b.click();}
 function rows(){return nodes.rows.children.map(row=>[...row.innerHTML.matchAll(/<td>(.*?)<\/td>/g)].map(m=>m[1].includes('Yes')));}
 return {n:nodes,messages,pending,media,finish,choose,rows,state:context.inspect};
}
for(const staticMode of [false,true]){
 const a=boot(staticMode),n=a.n;
 for(let cycle=0;cycle<2;cycle++){
  assert.equal(a.state().mode,'setup');assert(n.records.hidden&&n.report.hidden);assert.equal(a.rows().length,0);
  n.run.click();n.next.click();n.replay.click();assert.equal(a.state().count,0);
  a.choose('Ball mass');assert(!n.feedback.hidden);assert(n.drawing.innerHTML.includes('#a94713'));
  n.next.click();
  for(let i=0;i<5;i++){
   assert.equal(a.rows().length,i);assert(n.report.hidden);assert.equal(n.choices.children.length,0);
   n.next.click();assert.equal(a.state().mode,'trials','analysis must remain gated');
   n.run.click();
   if(!staticMode){assert.equal(a.rows().length,i);assert(n.run.disabled);n.run.click();n.next.click();assert.equal(a.state().active,i);}
   a.finish();assert.equal(a.rows().length,i+1);assert.deepEqual(a.rows(),expected.slice(0,i+1));
   const rowsBefore=JSON.stringify(a.rows());n.replay.click();a.finish();assert.equal(JSON.stringify(a.rows()),rowsBefore,'replay duplicates no rows');
   assert.equal(a.messages.length,cycle);
   if(i===3)assert(n.drawing.innerHTML.includes('Car stopped short'),'adjusted trial 4 car stops short');
  }
  const sums=a.rows().reduce((tot,row)=>tot.map((v,i)=>v+Number(row[i])),[0,0,0,0]);assert.deepEqual(sums,[2,1,4,3]);
  n.next.click();
  for(let q=0;q<3;q++){
   assert.equal(a.state().mode,'question');assert.equal(a.state().q,q);assert(n.feedback.hidden);assert.equal(n.choices.children.length,3);
   n.next.click();assert.equal(a.state().q,q,'cannot skip unanswered question');
   n.replay.click();a.finish();assert.equal(a.state().mode,'question');assert(n.feedback.hidden);assert.equal(a.rows().length,5);
   a.choose(['It will always work','Yes, success measures energy efficiency','Stop testing; it is reliable'][q]);
   assert(!n.feedback.hidden);
   if(q<2){assert.equal(a.messages.length,cycle);assert(n.report.hidden);n.next.click();}
  }
  assert(!n.report.hidden);assert.equal(a.messages.length,1);assert.equal(a.messages[0].data.type,'complete');assert.equal(a.messages[0].origin,'*');
  n.replay.click();a.finish();assert.equal(a.messages.length,1);assert(!n.report.hidden);
  n.reset.click();assert.equal(a.rows().length,0);assert.equal(n.report.innerHTML,'');assert(n.feedback.hidden);
 }
 console.log(`PASS ${staticMode?'static':'animated'}: exact ten outcomes, totals 2/1/4/3, all gates, replay without duplicates, reset, once-only completion`);
}
const a=boot(false);a.choose('Alignment');a.n.next.click();a.n.run.click();const stale=[...a.pending.values()][0];a.n.reset.click();stale(10000);assert.equal(a.rows().length,0);assert.equal(a.state().mode,'setup');
a.choose('Alignment');a.n.next.click();a.n.run.click();a.media.change({matches:true});assert(a.n.static.checked);assert.equal(a.rows().length,1);assert.equal(a.pending.size,0);
assert(!/<(?:script|link|img)[^>]+(?:src|href)=["']https?:/i.test(html));
console.log('PASS reset cancels stale animation, reduced-motion switch finishes once, self-contained assets');
