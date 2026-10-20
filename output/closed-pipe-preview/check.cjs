const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync('output/closed-pipe-preview/extracted/index.html','utf8');
const code=html.match(/<script>([\s\S]*?)<\/script>/)[1];
function boot(reduced=false){
const events={},buttons=Array.from({length:4},(_,i)=>({dataset:{mode:String(i)},setAttribute(k,v){this[k]=v},addEventListener(k,f){this[k]=f}}));
const svg={innerHTML:'',setAttribute(k,v){this[k]=v},parentElement:{}};const status={};let raf,posts=0;
const media={matches:reduced,addEventListener(){}};
const context={document:{hidden:false,getElementById(id){return id==='scene'?svg:id==='status'?status:{addEventListener(k,f){events.replay=f}}},querySelectorAll(){return buttons},addEventListener(){}},matchMedia:()=>media,ResizeObserver:class{constructor(f){this.f=f}observe(){this.f([{contentRect:{width:302}}])}},requestAnimationFrame:f=>raf=f,window:{parent:{postMessage(msg){assert.equal(msg.type,'complete');posts++}}}};
vm.runInNewContext(code,context);return{svg,buttons,events,step(t){raf(t)},posts:()=>posts};
}
const s=boot(true);
for(let i=0;i<4;i++){s.buttons[i].click();const n=Number(s.svg['data-harmonic']);assert.equal(n,2*i+1);assert(s.svg.innerHTML.includes(`${85*n} Hz`));assert(s.svg.innerHTML.includes('L = 1.00 m'));const nodes=(s.svg.innerHTML.match(/>N<\/text>/g)||[]).length;const anti=(s.svg.innerHTML.match(/>A<\/text>/g)||[]).length;assert.equal(nodes,i+1);assert.equal(anti,i+1);assert(s.svg.innerHTML.includes('0 0 302')===false);}
s.buttons[3].click();assert.equal(s.posts(),1);s.events.replay();s.buttons[3].click();assert.equal(s.posts(),1);
const a=boot();for(let i=0;i<990;i++)a.step(i*100);assert.equal(a.posts(),1);a.events.replay();for(let i=990;i<1980;i++)a.step(i*100);assert.equal(a.posts(),1);
assert(!/src="https?:|href="https?:/.test(html));assert(html.includes('background: transparent'));console.log('PASS: four harmonics, boundary counts, wavelength/frequency labels, automatic sequence, reduced motion, Replay, single completion, self-contained ZIP.');
const t=boot();
const visible=()=>[...t.svg.innerHTML.matchAll(/<text[^>]*>(.*?)<\/text>/g)].map(m=>m[1]).join('|');
assert(visible().includes('λ = 4L/n'));assert(!visible().includes('λ = 4.00 m'));assert(!visible().includes('f = 85 Hz'));
for(let i=0;i<=22;i++)t.step(i*100);
assert(visible().includes('4 × 1.00 / 1'));assert(!visible().includes('λ = 4.00 m'));
for(let i=23;i<=42;i++)t.step(i*100);
assert(visible().includes('λ = 4.00 m'));assert(!visible().includes('f = nv/(4L)'));
for(let i=43;i<=82;i++)t.step(i*100);
assert(visible().includes('f = nv/(4L)'));assert(!visible().includes('1 × 340'));
for(let i=83;i<=102;i++)t.step(i*100);
assert(visible().includes('1 × 340'));assert(!visible().includes('f = 85 Hz'));
for(let i=103;i<=122;i++)t.step(i*100);
assert(visible().includes('f = 85 Hz'));assert(visible().includes('v = 340 m/s'));
t.events.replay();assert(!visible().includes('f = 85 Hz'));
console.log('PASS: formula, substitution and result revealed in order; constants persist; Replay clears solutions.');
