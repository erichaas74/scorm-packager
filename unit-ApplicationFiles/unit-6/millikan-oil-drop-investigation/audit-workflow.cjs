// Read-only audit probe: executes shipped scripts against a minimal DOM substitute.
// This does not establish browser layout, native focus behavior, or live Buzz grading.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
function mount(file, storage) {
  const html = fs.readFileSync(path.join(__dirname, file), 'utf8');
  const elements = new Map();
  const make = () => ({ value: '', textContent: '', innerHTML: '', style: {}, dataset: {}, events: {}, children: [],
    classList: { add() {}, toggle() {} },
    setAttribute() {},
    addEventListener(type, fn) { this.events[type] = fn; },
    replaceChildren() { this.children = []; }, appendChild(child) { this.children.push(child); },
    parentElement: { getBoundingClientRect: () => ({ width: 500, height: 360 }) },
    getContext: () => new Proxy({}, {get: () => () => {}})
  });
  for (const match of html.matchAll(/\bid="([^"]+)"/g)) elements.set(match[1], make());
  const responses = Array.from({length: 6}, (_, i) => ({...make(), dataset: {question: String(i+1)}}));
  const document = { getElementById: id => {assert(elements.has(id), id); return elements.get(id);},
    querySelectorAll: selector => selector === '[data-question]' ? responses : [], createElement: make };
  const context = vm.createContext({ document, window: {addEventListener(){}, location:{protocol:'http:'}},
    localStorage: {getItem:k=>storage.get(k) || null, setItem:(k,v)=>storage.set(k,v), removeItem:k=>storage.delete(k)},
    setTimeout(){}, clearTimeout(){}, requestAnimationFrame(){}, confirm:()=>true, location:{reload(){}}, console });
  const script = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].find(m=>m[1].includes('class Drop'))[1];
  vm.runInContext(script, context, {filename:file});
  return {html,elements,context,run:code=>vm.runInContext(code,context)};
}
for (const file of ['u6l1-millikan-buzz-assessment-template.html','u6l1-millikan-buzz-assessment-template-preview.html']) {
  const storage = new Map(); let lab = mount(file,storage);
  const input = v => lab.elements.get('voltageSlider').events.input({target:{value:String(v)}});
  for (let n=1;n<=6;n++) {
    lab.run(`drop = new Drop(${n});`); input(300);
    lab.elements.get('btnRecord').events.click(); assert.equal(lab.run('state.records.length'),n-1);
    input(Math.round(200/n)); lab.elements.get('btnRecord').events.click();
    lab.elements.get('btnRecord').events.click(); assert.equal(lab.run('state.records.length'),n);
  }
  assert.equal((lab.html.match(/id="simCanvas"/g) || []).length, 1);
  assert(!lab.html.includes('>Microscope View</h2>'));
  assert(lab.html.includes('max-width:900px'));
  lab.run('drop.x = canvas.width / 2; drop.y = canvas.height / 2;');
  lab.elements.get('simCanvas').parentElement.getBoundingClientRect = () => ({width:250,height:180});
  lab.run('resizeCanvas(); drop.draw(ctx);');
  assert.equal(lab.run('drop.x'),125); assert.equal(lab.run('drop.y'),90);
  assert(lab.run('drop.radius >= 3'));
  lab.elements.get('btnAtomize').events.click();
  assert.equal(lab.run('voltage'),0);
  assert.equal(lab.elements.get('voltageDisplay').textContent,'0');
  assert.equal(lab.elements.get('btnRecord').disabled,true);
  assert.equal((lab.html.match(/id="voltageSlider"/g)||[]).length,1);
  assert(lab.html.includes('aria-orientation="horizontal"'));
  assert(!lab.html.includes('>HV Supply</text>'));
  const progress = JSON.parse(lab.run('JSON.stringify(progressState())'));
  assert.equal(progress.score,50); assert.equal(progress.responses,0); assert.equal(progress.ready,false);
  assert.match(lab.html,/\.u6-buzz-assessment \.finish-card\{display:none!important\}/);
  assert.match(lab.html,/<section class="card finish-card">[\s\S]*?id="clearBtn"/);
  const records=JSON.parse(lab.run('JSON.stringify(state.records)'));
  console.log(JSON.stringify({file,progress,records,hiddenResetAndExport:true}));
  lab=mount(file,storage);assert.equal(lab.run('state.records.length'),6);
  assert.equal(lab.run('progressState().score'),50);
  lab.elements.get('clearBtn').events.click();assert.equal(storage.size,0);
  console.log('PASS: six legal balances, off-balance rejection, duplicate rejection, saved-record restore, reset handler (hidden in UI).');
}
