'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const dir = path.join(__dirname, 'lesson-honors');
const read = name => fs.readFileSync(path.join(dir, name), 'utf8');
const html = read('u1h-rocket-launch-buzz-assessment-template.html');
const markup = html.split('<script>')[0];
const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m => m[1]);

// Minimal DOM doubles exercise the generated simulation, not browser layout.
function element(id = '') {
  const classes = new Set();
  return {
    id, textContent: '', innerHTML: '', clientHeight: 600, children: [], dataset: {},
    style: { setProperty() {} },
    classList: {
      add(...xs) { xs.forEach(x => classes.add(x)); },
      remove(...xs) { xs.forEach(x => classes.delete(x)); },
      contains(x) { return classes.has(x); },
      toggle(x, on = !classes.has(x)) { if (on) classes.add(x); else classes.delete(x); return on; }
    },
    addEventListener() {}, querySelector() { return null; }
  };
}

const roots = [1, 2, 3, 4].map(n => {
  const nodes = new Map([...markup.matchAll(/id="([^"]+)"/g)]
    .filter(m => m[1].startsWith(`s${n}-`)).map(m => [m[1], element(m[1])]));
  const view = element(), glow = element();
  return {
    nodes, addEventListener() {}, querySelectorAll() { return []; },
    querySelector(selector) {
      if (selector === '.flight-view') return view;
      if (selector === '.rocket-glow') return glow;
      const id = selector.match(/^\[id="([^"]+)"\]$/);
      return id ? nodes.get(id[1]) || null : null;
    }
  };
});
let frame;
const context = vm.createContext({
  document: {
    querySelector(selector) {
      const n = selector.match(/data-lab-root="(\d+)"/);
      return n ? roots[Number(n[1]) - 1] : null;
    },
    addEventListener() {}
  },
  requestAnimationFrame(fn) { frame = fn; return 1; },
  cancelAnimationFrame() { frame = null; },
  setTimeout() { return 1; }, clearTimeout() {}, performance: { now() { return 0; } }
});
vm.runInContext(scripts[0], context);
vm.runInContext(scripts[1], context);
assert.equal(context.LAB_SECTIONS.length, 4);
for (let i = 0; i < 4; i++) {
  const lab = context.createRocketLab(roots[i], context.LAB_SECTIONS[i]);
  assert.equal(lab.state.mission.burnAccel, 20);
  assert.equal(lab.state.mission.burnTime, 2.5);
  lab.run();
  // The simulation runs at half real time; allow 40 seconds of animation.
  for (let tick = 0; tick < 2400 && frame; tick++) {
    const next = frame;
    frame = null;
    next(tick * 1000 / 60);
  }
  assert.equal(lab.state.simulation.running, false, `Section ${i + 1} must finish`);
  if (i === 3) {
    assert.equal(lab.state.simulation.stage, 'landed');
    for (let stage = 1; stage <= 4; stage++) {
      assert.equal(roots[i].nodes.get(`s4-stage-val-row-${stage}`).classList.contains('hidden'), stage !== 4);
    }
  }
  console.log(`ok: Section ${i + 1} initializes and completes its flight`);
}

const sections = markup.split(/<section class="lab-section(?: independent-section)?"[^>]*>/).slice(1);
assert.equal(sections.length, 5);
assert.deepEqual(sections.map(s => (s.match(/<a:question>/g) || []).length), [2, 2, 2, 2, 1]);
assert(sections[4].includes('id="s5-buzz-response" class="buzz-slot s5-program-response" aria-hidden="true"'));
assert(sections[4].includes('id="s5-launch"') && sections[4].includes('id="s5-events"'), 'Section 5 must expose flight controls and event data');
assert(!/class="eq"|step-tracker|substep-card/.test(sections[4]), 'Section 5 must not provide worked calculation scaffolding');
const preview = read('u1h-rocket-launch-buzz-assessment-template-preview.html');
assert.deepEqual([...preview.matchAll(/data-buzz-preview-question="(\d+)"/g)].map(m => Number(m[1])), [1,2,3,4,5,6,7,8,9]);

const solve = vm.runInNewContext('const GRAVITY=-10, RETRO_ACCEL=20; (' +
  read('sim.js').match(/function solveMission\([^]*?\n    }/)[0] + ')');
const original = solve(20, 2.5);
assert.equal(-original.retroHeight, -62.5);
assert.equal(original.retroBurnDuration, 2.5);
console.log('ok: five sections, question order, independent flight controls, and original mission answer keys');
