const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const path=require('path');
const root=path.join(__dirname,'revised-assets','unit-5-wave-concepts-matching');
const nodes=new Map(),all=[],docEvents={};
class Element {
 constructor(tag='div'){this.tag=tag;this.events={};this.dataset={};this.attrs={};this.style={};this.children=[];this.className='';this.textContent='';this.hidden=false;all.push(this);}
 setAttribute(k,v){this.attrs[k]=v;}
 addEventListener(k,fn){(this.events[k]??=[]).push(fn);}
 append(...items){this.children.push(...items);}
 get classList(){const e=this;return {contains(c){return e.className.split(' ').includes(c)},add(c){if(!this.contains(c))e.className+=' '+c},remove(c){e.className=e.className.split(' ').filter(x=>x!==c).join(' ')},toggle(c,on){on?this.add(c):this.remove(c)}};}
 set innerHTML(s){const i=Number(s.match(/question(\d+)/)[1]); for(const [id,cl,tag] of [[`question${i}`,'question','p'],[null,'diagram','img'],[`target${i}`,'target','button'],[`clear${i}`,'clear','button'],[`feedback${i}`,'feedback','p']]){const e=new Element(tag);e.className=cl;if(id)nodes.set(id,e);if(cl==='target')e.dataset.index=String(i);this.children.push(e);}}
 querySelector(s){return this.children.find(e=>s==='img'?e.tag==='img':e.classList.contains(s.slice(1)));}
 closest(s){return s.split(',').some(x=>x.trim().slice(1).split('.').every(c=>this.classList.contains(c)))?this:null;}
 setPointerCapture(id){this.capture=id;} hasPointerCapture(id){return this.capture===id;} releasePointerCapture(){this.capture=null;}
 remove(){this.removed=true;} focus(){document.activeElement=this;}
 getBoundingClientRect(){return {bottom:140};}
}
for(const id of ['terms','cards','selection','progress','announcement','result','check','reset'])nodes.set(id,new Element());
const bank=new Element();bank.className='bank';let hit=null;
const document={body:new Element(),createElement:t=>new Element(t),getElementById:id=>nodes.get(id),querySelectorAll:s=>all.filter(e=>!e.removed&&s.slice(1).split('.').every(c=>e.classList.contains(c))),querySelector:s=>document.querySelectorAll(s)[0],elementFromPoint:()=>hit,addEventListener:(k,f)=>(docEvents[k]??=[]).push(f)};
const context={document,window:{innerHeight:900,scrollBy(){},addEventListener(){}},requestAnimationFrame:()=>1,cancelAnimationFrame(){},setTimeout(){},console};
vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(root,'activity.js'),'utf8'),context);
function fire(el,type,event={}){for(const fn of el.events[type]||[])fn(event);}
function emit(type,event={}){for(const fn of docEvents[type]||[])fn(event);}
function term(name){return all.find(e=>e.dataset.term===name);}
function drag(source,target,id=1){emit('pointerdown',{button:0,target:source,pointerId:id,clientX:200,clientY:100});hit=target;emit('pointermove',{pointerId:id,clientX:400,clientY:500,preventDefault(){}});emit('pointerup',{pointerId:id});vm.runInContext('suppressClick=false',context);}
drag(term('Medium'),nodes.get('target0'));assert.equal(nodes.get('target0').textContent,'Medium');
drag(term('Medium'),nodes.get('target1'));assert.equal(nodes.get('target0').textContent,'Medium');assert.equal(nodes.get('target1').textContent,'Medium');
drag(nodes.get('target1'),nodes.get('target2'));assert.equal(nodes.get('target1').textContent,'Drop a term here');assert.equal(nodes.get('target2').textContent,'Medium');
drag(term('Pulse'),null);assert.equal(nodes.get('target2').textContent,'Medium');
fire(nodes.get('check'),'click');assert.match(nodes.get('result').textContent,/1 of 6/);assert.match(nodes.get('feedback2').textContent,/Try again/);
const solutions=['Medium','Rarefaction','Pulse','Periodic wave','Crest','Equilibrium'];solutions.forEach((s,i)=>{fire(term(s),'click');fire(nodes.get('target'+i),'click')});
fire(nodes.get('check'),'click');assert.match(nodes.get('result').textContent,/All 6 matches are correct/);
fire(nodes.get('clear0'),'click');assert.equal(nodes.get('target0').textContent,'Drop a term here');assert.equal(nodes.get('result').textContent,'');
fire(term('Pulse'),'click');emit('keydown',{key:'Escape'});assert.equal(term('Pulse').attrs['aria-pressed'],'false');
fire(nodes.get('reset'),'click');for(let i=0;i<6;i++)assert.equal(nodes.get('target'+i).textContent,'Drop a term here');assert.equal(nodes.get('progress').textContent,'0 of 6 matched');
for(const e of all.filter(e=>e.tag==='img'))assert.ok(fs.existsSync(path.join(root,e.src)),e.src);
assert.equal(all.filter(e=>e.tag==='img').length,6);
assert.ok(!/<select\b|<svg\b/.test(fs.readFileSync(path.join(root,'index.html'),'utf8')));
console.log('PASS: drag, reusable terms, move existing match, cancelled drop, wrong/blank feedback, all-correct, clear, Escape, reset, six local illustrations.');
