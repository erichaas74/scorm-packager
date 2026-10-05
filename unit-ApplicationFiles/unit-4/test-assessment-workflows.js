'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = (file) => fs.readFileSync(path.join(__dirname, file), 'utf8');

function springFunction(html, name) {
  const match = html.match(new RegExp(`function ${name}\\([^)]*\\) \\{[\\s\\S]*?\\n      \\}`));
  assert(match, `Missing ${name}`);
  return match[0];
}

for (const file of ['hookes-law-lab.html', 'u4l2-hookes-law-buzz-assessment-template.html', 'u4l2-hookes-law-buzz-assessment-template-preview.html']) {
  const html = read(`lesson-2/${file}`);
  const samples = [.05, .1, .15, .2, .25].map(mass => ({
    extension: Math.round(mass * 9.81 / 20 * 1000) / 1000,
    force: mass * 9.81
  }));
  const context = {
    samples, fit: null, studentK: { value: '', focus() {} },
    equationOut: {}, slopeOut: {}, rSquaredOut: {},
    progressBar: { style: {} }, trialCount: {}, fitButton: {},
    clearButton: {}, copyButton: {}, csvButton: {},
    setActiveStep() {}, drawGraph() {}, saveState() {}, setStatus() {}
  };
  vm.createContext(context);
  vm.runInContext(['hasSpringEstimate', 'calculateFit', 'updateProgress'].map(name => springFunction(html, name)).join('\n'), context);
  for (const value of ['', '0', '-1', 'Infinity', 'not a number']) {
    context.studentK.value = value;
    context.updateProgress();
    assert.equal(context.fitButton.disabled, true, `${file}: invalid estimate must disable fit`);
    context.calculateFit();
    assert.equal(context.fit, null, `${file}: invalid estimate must not reveal fit`);
  }
  context.studentK.value = '18'; // A reasonable independent estimate need not be correct.
  context.samples = samples.slice(0, 4);
  context.updateProgress();
  assert.equal(context.fitButton.disabled, true);
  context.calculateFit();
  assert.equal(context.fit, null);
  context.samples = samples;
  context.updateProgress();
  assert.equal(context.fitButton.disabled, false);
  context.calculateFit();
  assert.equal(context.slopeOut.textContent, '20.02 N/m');
  assert(html.includes('studentK.addEventListener("input", updateProgress)'));
}

for (const file of ['water-bottle-thermal-test.html', 'u4l5-water-bottle-thermal-test-buzz-assessment-template.html', 'u4l5-water-bottle-thermal-test-buzz-assessment-template-preview.html']) {
  const html = read(`lesson-5/${file}`);
  const code = html.slice(html.indexOf('function temperatureAt('), html.indexOf('function saveState()'));
  const strokes = [];
  let points = [];
  const ctx = new Proxy({
    beginPath() { points = []; },
    moveTo(x, y) { points.push([x, y]); },
    lineTo(x, y) { points.push([x, y]); },
    stroke() { strokes.push({ color: this.strokeStyle, points: [...points] }); },
    createLinearGradient() { return { addColorStop() {} }; }
  }, { get(target, key) { return key in target ? target[key] : () => {}; } });
  const context = { ctx, active: 0, trials: [{ values: [80, 68, 59, 52, 48], color: 'trial-curve', feature: 'Lid on' }] };
  vm.createContext(context);
  vm.runInContext(code, context);
  for (const fraction of [0, .013, .5, 1]) {
    strokes.length = 0;
    context.draw(fraction);
    const curves = strokes.filter(stroke => stroke.color === 'trial-curve');
    if (fraction === 0) assert.equal(curves.length, 0, `${file}: no curve before trial`);
    else {
      assert.equal(curves.length, 1);
      const xs = curves[0].points.map(point => point[0]);
      assert.equal(Math.min(...xs), 300);
      assert.equal(Math.max(...xs), 300 + 350 * fraction, `${file}: reveal only elapsed time`);
    }
  }
}

for (const file of ['u4l3-loop-sim-lab-buzz-assessment-template.html', 'u4l3-loop-sim-lab-buzz-assessment-template-preview.html']) {
  const html = read(`lesson-3/${file}`);
  const context = {};
  vm.runInNewContext(`trials = ${html.match(/var trials=(\[.*?\]);var active/)[1]}`, context);
  assert.equal(context.trials[2].top, 19.81);
  assert.equal(context.trials[2].outcome, 'Completes; maintains contact at the top');
  assert(!context.trials.some(trial => /981/.test(trial.outcome)));
}

for (const lesson of [2, 3, 5]) {
  const dir = path.join(__dirname, `lesson-${lesson}`);
  for (const file of fs.readdirSync(dir).filter(file => file.endsWith('.html'))) {
    const html = fs.readFileSync(path.join(dir, file), 'utf8');
    for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) new vm.Script(match[1], { filename: file });
  }
}

console.log('Passed: spring estimate gating, progressive thermal curves, loop evidence, and inline script compilation.');
