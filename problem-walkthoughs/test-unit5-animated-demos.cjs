const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.join(__dirname, 'unit 5');
const source = fs.readFileSync(path.join(root, 'animated-demos.js'), 'utf8');
const files = JSON.parse(fs.readFileSync(path.join(root, 'animated-demo-files.json')));
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(source, sandbox);
const { physics: p, render } = sandbox.window.Unit5AnimatedDemos;
const near = (actual, expected) => assert(Math.abs(actual - expected) < 1e-9, `${actual} != ${expected}`);
for (let center = -2; center < 14; center += .07) near(p.reflected(6, center), 0);
near(p.reflected(3, 9), -1);
near(p.pulses(4, 3), 2);
for (let x = 0; x < 8; x += .03) near(p.pulses(x, 3, -1), 0);
near(p.pulses(6, 5), 1); // Components pass through rather than bounce.
near(p.pulse(3, 0), 0);
near(p.pulse(3, 3), 1);
near(p.pulse(3, 7), 0);
for (const n of [2, 3]) for (const t of [0, .2, 1, 4]) {
  for (let j = 0; j <= n; j++) near(p.standing(6*j/n, t, n), 0);
  for (let x = 0; x <= 6; x += .1) {
    const k = n*Math.PI/6;
    near(p.standing(x, t, n), Math.sin(k*x - 2*k*t) + Math.sin(k*x + 2*k*t));
  }
}
for (const [n1,n2,angle] of [[1,1.5,30],[1,1.5,50],[1.5,1,30],[1,1.52,45],[1,2.42,45]]) {
  const a=angle*Math.PI/180, b=p.snell(n1,n2,a);
  near(n1*Math.sin(a), n2*Math.sin(b));
  // Equal tangential wave number ensures phase continuity across the boundary.
  near(Math.sin(a)/(600/n1), Math.sin(b)/(600/n2));
}
for (const ratio of [1.5,4]) {
  near(p.diffraction(ratio,0),1);
  near(p.diffraction(ratio,Math.asin(1/ratio)),0);
}
near(p.photonEV(300), 2*p.photonEV(600));
near(p.intensity(2), .25); near(p.intensity(3), 1/9);
near(p.lens(1,3),1.5); near(p.lens(1,1.5),3);
near(p.gps(1).net,38); near(p.gps(1).range,11392.113404);
for (const item of files) {
  const html=fs.readFileSync(path.join(root,item.file),'utf8');
  assert(html.includes('animated-demos.js'));
  assert(!html.includes('data-choice'));
  for (const width of [420,840]) for (const t of [0,2,4,7.9,12]) for (let ex=0;ex<(item.kind==='refraction'?3:2);ex++) {
    const result=render(item.kind,width,t,ex);
    assert(!/NaN|Infinity|undefined/.test(result.svg), item.file);
    assert(result.description && result.height>0);
  }
  // Exercise the actual controller, including replay, looping and completion.
  for (const reduce of [false,true]) {
    const elements={};
    const make=id=>elements[id]??={dataset:{},textContent:'',addEventListener(k,fn){this[k]=fn;},setAttribute(k,v){this[k]=v;}};
    let callback, now=0, completions=0;
    const context={window:{demoLesson:{kind:item.kind},parent:{postMessage(){completions++;}},addEventListener(){}},document:{getElementById:make,addEventListener(){},hidden:false},matchMedia:q=>({matches:q.includes('reduced')?reduce:false,addEventListener(){}}),requestAnimationFrame:fn=>{callback=fn;return 1;},cancelAnimationFrame(){}};
    vm.createContext(context);vm.runInContext(source,context);
    const tick=seconds=>{for(let i=0;i<seconds*10;i++){now+=100;callback(now);}};
    if(reduce) {
      assert(!elements.step.hidden);
      tick(2);assert.equal(elements.scene.dataset.time,'0.00');
      for(let i=0;i<24;i++)elements.step.click();
    } else {
      tick(2);const time=elements.scene.dataset.time;
      tick(2);assert.notEqual(elements.scene.dataset.time,time);
      tick(80);
    }
    assert.equal(completions,1,item.file+' completion');
    elements.replay.click();assert.equal(elements.scene.dataset.example,0);
    assert.equal(elements.scene.dataset.time,'0.00');
    if(reduce)for(let i=0;i<24;i++)elements.step.click();else tick(80);
    assert.equal(completions,1,item.file+' duplicate completion');
  }
}
console.log(`${files.length} demos: physics identities, render states, normal/reduced playback, replay and single completion passed.`);
