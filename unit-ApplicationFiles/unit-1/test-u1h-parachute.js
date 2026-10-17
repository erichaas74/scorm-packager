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

// Legacy parachute modules remain standalone; the assessment now uses written responses.
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
