const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('problem-walkthoughs/unit 4/rube-goldberg-repair-connection.html','utf8');
const source=html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/setup\(\);\r?\n\}\)\(\);/,'setup();globalThis.inspect={config, challenges, state:()=>({stage,phase,kind,progress,selected,resolved:[...resolved],viewed:[...viewed]})};\n})();');
function boot(reduced){
 const nodes={},messages=[],pending=new Map();let seq=0,clock=0,active;
 class Element{constructor(){this.children=[];this.events={};this.hidden=false;this.checked=false;this.textContent='';this.value='';this.innerHTML='';}append(e){this.children.push(e);}replaceChildren(){this.children=[];this.textContent='';}addEventListener(k,f){this.events[k]=f;}focus(){active=this;}click(){this.events.click?.();}}
 for(const m of html.matchAll(/<[^>]+\bid="([^"]+)"[^>]*>/g)){nodes[m[1]]=new Element();nodes[m[1]].hidden=/\bhidden\b/.test(m[0]);}
 const media={matches:reduced,addEventListener(k,f){this.change=f;}};
 const context={document:{getElementById:id=>nodes[id],createElement:()=>new Element()},matchMedia:()=>media,performance:{now:()=>clock},requestAnimationFrame:f=>{pending.set(++seq,f);return seq;},cancelAnimationFrame:id=>pending.delete(id),window:{parent:{postMessage:(data,origin)=>messages.push({data,origin})}}};
 vm.runInNewContext(source,context);
 function finish(){if(nodes.reduced.checked){for(let i=0;i<4;i++)nodes.moment.click();}else{clock+=10000;const callbacks=[...pending.values()];pending.clear();callbacks.forEach(f=>f(clock));}}
 function pick(label){const b=nodes.choices.children.find(x=>x.textContent===label);assert(b,`missing choice ${label}`);b.click();}
 return {n:nodes,messages,pending,media,inspect:context.inspect,finish,pick,active:()=>active};
}
for(const reduced of [false,true]){
 const a=boot(reduced),n=a.n;
 for(let cycle=0;cycle<2;cycle++){
  for(let stage=0;stage<3;stage++){
   assert.equal(a.inspect.state().phase,'ready');assert(n.choices.hidden&&n.feedback.hidden);
   n.next.click();n.replay.click();n.moment.click();assert.equal(a.inspect.state().stage,stage);
   n.start.click();assert(n.choices.hidden);a.finish();assert.equal(a.inspect.state().phase,'predict');
   const challenge=a.inspect.challenges[stage];
   for(const choice of [...challenge.choices.filter(c=>!c.success),...challenge.choices.filter(c=>c.success)]){
    assert(n.feedback.hidden&&n.next.hidden&&n.reflection.hidden);
    assert(!n.drawing.innerHTML.includes('Contact → chain → finish'));
    a.pick(choice.label);
    const before=a.inspect.config(0),after=a.inspect.config(1);
    for(const key of Object.keys(before))if(key!==choice.key)assert.equal(after[key],before[key],`fixed ${key}`);
    assert.equal(after[choice.key],choice.value);
    assert.equal(a.pending.size,reduced?0:1);
    assert(n.feedback.hidden&&n.next.hidden);
    n.next.click();assert.equal(a.inspect.state().stage,stage,'cannot skip an unfinished reveal');
    if(reduced){for(let i=0;i<3;i++)n.moment.click();assert(n.feedback.hidden);assert.equal(a.messages.length,cycle);n.moment.click();}else a.finish();
    assert(!n.feedback.hidden);assert.equal(n.feedback.textContent,choice.feedback);
    if(!choice.success){assert(!n.retry.hidden&&n.next.hidden);assert.equal(a.messages.length,cycle);n.replay.click();assert(n.feedback.hidden);a.finish();n.retry.click();assert.equal(a.inspect.state().kind,'original');}
    else {assert(a.inspect.state().resolved[stage]);n.replay.click();assert(n.feedback.hidden&&n.reflection.hidden);assert(!n.drawing.innerHTML.includes('Contact → chain → finish'));a.finish();}
   }
   if(stage<2){assert.equal(a.messages.length,cycle);n.next.click();}
   else {assert(!n.reflection.hidden);assert.equal(a.messages.length,1);assert.equal(a.messages[0].data.type,'complete');assert.equal(a.messages[0].origin,'*');}
  }
  n.connection.value='Toy car connection';n.reset.click();assert.equal(n.connection.value,'');assert(n.reflection.hidden);assert(a.inspect.state().resolved.every(v=>!v));
 }
 console.log(`PASS ${reduced?'reduced motion':'animation'}: all nine choices, fixed variables, gates, retry, replay, reset, reflection and once-only completion`);
}
const a=boot(false);a.n.start.click();const stale=[...a.pending.values()][0];a.n.reset.click();stale(10000);assert.equal(a.inspect.state().phase,'ready');assert(a.n.choices.hidden);
a.n.start.click();a.media.change({matches:true});assert(a.n.reduced.checked&&!a.n.moment.hidden);assert.equal(a.pending.size,0);
assert(!/<(?:script|link|img)[^>]+(?:src|href)=["']https?:/i.test(html));
console.log('PASS stale-frame cancellation, system reduced-motion change, offline assets');
