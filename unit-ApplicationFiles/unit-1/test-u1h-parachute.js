'use strict';
const assert = require('assert');
const createFlight = require('./lesson-honors/parachute-flight');
const near = (actual, expected, label) => assert(Math.abs(actual - expected) < 1e-7, `${label}: ${actual} != ${expected}`);
const event = (flight, name) => flight.state.events.find(e => e.name === name);

// Fuel exhaustion caps the altitude, independently of rendering timestep.
for (const step of [1/60, 0.1, 17]) {
  const f = createFlight(); f.start();
  for (let n = 0; n < 3000 && f.running(); n++) f.advance(step);
  near(f.state.burnDuration, 4, 'fuel limit');
  near(event(f, 'Apex').height, 300, 'altitude cap');
  assert.equal(f.state.cutoffReason, 'Fuel exhausted');
  assert.equal(f.state.result, 'Hard landing');
  near(f.state.time, 10 + Math.sqrt(60), 'unchuted time');
  assert.equal(f.start(), false);
  assert.equal(f.deploy(), false);
}

// Manual cutoff at 2 seconds; deploy one second after apex.
const safe = createFlight();
assert.equal(safe.deploy(), false);
safe.start(); safe.advance(2); safe.cutoff();
near(event(safe, 'Engine cutoff').velocity, 30, 'manual cutoff velocity');
assert.equal(safe.cutoff(), false);
assert.equal(safe.deploy(), false);
safe.advance(4); // t=6; apex was t=5, h=75; now h=70, v=-10.
assert(safe.deploy());
assert.equal(safe.deploy(), false);
safe.advance(100);
assert.equal(safe.state.result, 'Safe landing');
near(event(safe, 'Steady descent begins').height, 70 - 75/24, 'braking distance');
near(safe.state.velocity, -5, 'landing velocity');

// A too-late deployment must not instantly clamp the speed or fake a safe landing.
const late = createFlight(); late.start(); late.advance(2); late.cutoff();
late.advance(3 + Math.sqrt(14)); // descent from 75 m to 5 m
assert(late.deploy());
late.advance(100);
assert.equal(late.state.result, 'Hard landing');
assert(!event(late, 'Steady descent begins'));
near(late.state.velocity, -Math.sqrt(1280), 'late chute touchdown velocity');

// Zero burn and the earliest legal parachute opening must finish cleanly.
const zero = createFlight(); zero.start(); zero.cutoff(); zero.advance(1);
assert.equal(zero.state.phase, 'landed');
near(zero.state.time, 0, 'aborted launch time');
const early = createFlight(); early.start(); early.advance(2); early.cutoff(); early.advance(3.5);
assert(early.deploy()); early.advance(100); assert.equal(early.state.result, 'Safe landing');

// Independently reconstruct the answer from the event data exposed to students.
for (const f of [safe, late, early]) {
  const cutoff = event(f, 'Engine cutoff'), opened = event(f, 'Parachute opens');
  const steady = event(f, 'Steady descent begins'), touchdown = event(f, 'Touchdown');
  const underChute = ((steady || touchdown).velocity - opened.velocity)/12 + (steady ? steady.height/5 : 0);
  const total = f.state.burnDuration + cutoff.velocity/10 - opened.velocity/10 + underChute;
  near(total, f.state.time, 'record reconstructs total airborne time');
  near(underChute, f.state.time - opened.time, 'record reconstructs chute time');
}
console.log('ok: fuel limit, manual cutoff, chute timing, safe/hard landings, timestep independence, and calculable event records');

// Exercise the embedded controls and retry history with a minimal DOM.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, 'lesson-honors/u1h-rocket-launch-buzz-assessment-template.html'), 'utf8');
const nodes = new Map([...html.matchAll(/id="(s5-[^"]+)"/g)].map(m => [m[1], {
  textContent: '', innerHTML: '', disabled: false, style: {}, attrs: {}, handlers: {},
  setAttribute(key, value) { this.attrs[key] = value; },
  addEventListener(type, handler) { this.handlers[type] = handler; }
}]));
const root = { querySelector(selector) {
  return selector === '.s5-scene' ? { clientHeight: 420 } : nodes.get(selector.slice(1));
} };
let callback = null, timestamp = 0;
const context = vm.createContext({
  document: { getElementById(id) { assert.equal(id, 'independent-launch'); return root; } },
  requestAnimationFrame(fn) { callback = fn; return 1; },
  cancelAnimationFrame() { callback = null; }
});
const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m => m[1]);
vm.runInContext(scripts.find(s => s.includes('function createParachuteFlight()')), context);
vm.runInContext(scripts.find(s => s.includes('const ParachuteGrading =')), context);
vm.runInContext(scripts.find(s => s.includes('function mountParachuteChallenge(root)')), context);
const node = name => nodes.get('s5-' + name);
const click = name => { assert(!node(name).disabled, name + ' must be enabled'); node(name).handlers.click(); };
function frames(count) {
  for (let n = 0; n < count && callback; n++) {
    const next = callback; callback = null;
    next(timestamp); timestamp += 50;
  }
}
assert(node('cutoff').disabled && node('deploy').disabled);
click('launch'); frames(41); click('cutoff');
assert.equal(node('burn-duration').textContent, '2.00 s');
assert(node('launch').disabled && node('cutoff').disabled && node('deploy').disabled);
frames(80); click('deploy');
assert.equal(node('canopy').attrs.visibility, 'visible');
frames(1000);
assert(node('status').textContent.startsWith('Safe landing'));
assert(node('events').innerHTML.includes('Steady descent begins'));
assert(node('history').innerHTML.includes('Attempt 1'));
assert(!node('history').innerHTML.includes('Total time'));
let submitted;
root.onFlightGrade = result => { submitted = result; };
node('answer-total').value = '0'; node('answer-chute').value = '0';
node('answer-percent').value = '0'; node('answer-safety').value = 'hard';
click('check-answers');
assert.equal(submitted.score, 0);
assert.equal(submitted.flight.attempt, 1);
node('answer-total').value = String(safe.state.time);
node('answer-chute').value = String(safe.state.time - event(safe, 'Parachute opens').time);
node('answer-percent').value = String(Number(node('answer-chute').value) / safe.state.time * 100);
node('answer-safety').value = 'safe';
click('check-answers');
assert.equal(submitted.score, 4);
assert(submitted.flight.events.some(e => e.name === 'Touchdown'));
assert(Object.isFrozen(submitted.flight));
click('reset');
assert.equal(node('attempt').textContent, '· Attempt 2');
assert(node('history').innerHTML.includes('Attempt 1'));
assert.equal(node('canopy').attrs.visibility, 'hidden');
assert(node('answer-fields').disabled);
assert.equal(node('answer-total').value, '');
click('launch'); frames(1000);
assert(node('status').textContent.startsWith('Hard landing'));
assert.equal(node('burn-duration').textContent, '4.00 s');
assert(node('history').innerHTML.includes('Fuel exhausted'));
assert(node('history').innerHTML.includes('Attempt 2'));
click('reset'); click('launch'); frames(10); click('reset');
assert.equal(callback, null, 'reset cancels the active flight');
assert.equal(node('altitude').textContent, '0.00 m');
console.log('ok: embedded controls, visible records, canopy, fuel cutoff, preserved history, and reset');

const grading = require('./lesson-honors/parachute-grading');
const record = grading.freezeFlight(safe.state, 1);
const expected = { total: record.totalTime, chute: record.chuteTime, percent: record.chuteTime/record.totalTime*100, safety: 'safe' };
assert.equal(grading.grade(record, expected).score, 4);
assert.equal(grading.grade(record, { ...expected, total: expected.total + 0.1 }).score, 4);
assert.equal(grading.grade(record, { ...expected, total: expected.total + 0.101 }).score, 0);
assert.equal(grading.grade(record, { ...expected, percent: expected.percent + 0.501 }).score, 0);
for (const invalid of ['', ' ', 'NaN', 'Infinity', '1x', '-1', null, false]) {
  assert.equal(grading.grade(record, { ...expected, total: invalid }).questions[0].correct, false);
}
assert.equal(grading.grade(null, expected).eligible, false);
assert.equal(grading.freezeFlight(zero.state, 1), null);
const lateRecord = grading.freezeFlight(late.state, 2);
assert.equal(grading.grade(lateRecord, { total: lateRecord.totalTime, chute: lateRecord.chuteTime,
  percent: lateRecord.chuteTime/lateRecord.totalTime*100, safety:'hard' }).score, 4);
console.log('ok: binary grading, blank/invalid answers, tolerances, attached evidence, and hard-landing calculations');
