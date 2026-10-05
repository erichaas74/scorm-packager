'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = __dirname;
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const template = fs.readFileSync(path.join(root, 'u4l1-simple-machine-buzz-assessment-template.html'), 'utf8');
const preview = fs.readFileSync(path.join(root, 'u4l1-simple-machine-buzz-assessment-template-preview.html'), 'utf8');
const questionText = fs.readFileSync(path.join(root, 'buzz-assessment-questions.txt'), 'utf8');
const walkthrough = fs.readFileSync(path.resolve(root, '..', '..', '..', 'problem-walkthoughs', 'unit 4', 'simple-machines.html'), 'utf8');

const machines = [
  ['inclined-plane', 'Inclined Plane', 0],
  ['lever', 'Lever', 1],
  ['wedge', 'Wedge', 2],
  ['wheel-and-axle', 'Wheel & Axle', 3],
  ['pulley', 'Pulley', 4],
  ['screw', 'Screw', 5]
];

function decodeAttribute(value) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function sectionFragment(html, id, nextId) {
  const start = html.indexOf(`data-machine-section="${id}"`);
  const end = nextId ? html.indexOf(`data-machine-section="${nextId}"`, start) : html.indexOf('</main>', start);
  assert(start >= 0 && end > start, `missing outer section for ${id}`);
  return html.slice(start, end);
}

[['standalone', index], ['Buzz template', template], ['preview', preview]].forEach(([label, html]) => {
  assert.strictEqual((html.match(/data-machine-simulation=/g) || []).length, 6, `${label} should contain six simulations`);
  assert.doesNotMatch(html, /metric-ma|metric-force|metric-distance|metric-work|metric-speed|record-test|test-table-body/, `${label} must not contain the old calculated-results dashboard`);

  const frameMatches = [...html.matchAll(/srcdoc="([\s\S]*?)" loading="lazy"/g)];
  assert.strictEqual(frameMatches.length, 6, `${label} should contain six self-contained simulation frames`);
  frameMatches.forEach((match, frameIndex) => {
    const frame = decodeAttribute(match[1]);
    assert(frame.includes(`let activeMachine = ${frameIndex};`), `${label} frame ${frameIndex + 1} should be locked to its matching machine`);
    assert(frame.includes('header, #button-container, .hud, .ask, .result-bindings { display: none !important; }'), `${label} frame ${frameIndex + 1} should hide navigation, calculated HUDs, and built-in questions`);
    assert.doesNotMatch(frame, /<section class="hud hud-(?:left|right)"/, `${label} frame ${frameIndex + 1} must remove calculated HUD markup`);
    assert.doesNotMatch(frame, /m of ramp|`\$\{ma\.toFixed\(2\)\} m down|`\$\{ma\.toFixed\(0\)\} m`|Strike \$\{|Turn \$\{/, `${label} frame ${frameIndex + 1} must not draw calculated answer labels`);
    [...frame.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].forEach((scriptMatch, scriptIndex) => {
      assert.doesNotThrow(() => new Function(scriptMatch[1]), `${label} frame ${frameIndex + 1} script ${scriptIndex + 1} should parse`);
    });
  });
});

assert.strictEqual((index.match(/<!-- BUZZ_QUESTIONS:/g) || []).length, 6, 'standalone should retain six build markers');
assert.strictEqual((template.match(/<a:question><\/a:question>/g) || []).length, 12, 'Buzz template should contain 12 native question slots');
assert.strictEqual((template.match(/class="machine-question-block"/g) || []).length, 6, 'Buzz template should contain six machine question blocks');
assert.strictEqual((preview.match(/class="buzz-preview-card"/g) || []).length, 12, 'preview should render all 12 question cards');

machines.forEach(([id], machineIndex) => {
  const nextId = machines[machineIndex + 1]?.[0];
  const fragment = sectionFragment(template, id, nextId);
  const simulationPosition = fragment.indexOf(`data-machine-simulation="${id}"`);
  const questionPosition = fragment.indexOf(`data-question-block="${id}"`);
  assert(simulationPosition >= 0 && questionPosition > simulationPosition, `${id} simulation must appear above its question block`);
  assert.strictEqual((fragment.match(/data-machine-simulation=/g) || []).length, 1, `${id} section should contain only its own simulation`);
  assert.strictEqual((fragment.match(/<a:question><\/a:question>/g) || []).length, 2, `${id} section should contain exactly two questions`);
});

['Output force: <strong>120 N</strong>', 'Output distance: <strong>1.0 m</strong>', 'Input speed for comparisons: <strong>1.0 m/s</strong>', 'd<sub>in</sub> = IMA', 'F<sub>in</sub> = F<sub>out</sub>', 'W = F &times; d', 'v<sub>out</sub> = v<sub>in</sub>'].forEach((required) => {
  assert(index.includes(required), `missing required calculation information: ${required}`);
});
assert.doesNotMatch(index, /Setup A|Run all 3 trials|three configurations/i, 'old three-setup workflow must be removed');

// Verify the unchanged underlying ideal-machine model independently of the student display.
const machinesBlock = walkthrough.match(/const machinesData = (\[[\s\S]*?\n        \]);/);
const paramsBlock = walkthrough.match(/function machineParams\([\s\S]*?\n        }\n\n        function getMachineMetrics/);
const metricsBlock = walkthrough.match(/function getMachineMetrics\(\) \{[\s\S]*?\n        }\n\n        \/\/ One lift cycle/);
assert(machinesBlock && paramsBlock && metricsBlock, 'physics definitions should be extractable');

const sandbox = { result: null };
vm.runInNewContext(`
  const machinesData = ${machinesBlock[1]};
  let activeMachine = 0;
  let controlSetting = 50;
  const idealWork = 120;
  const LOAD_FORCE = 120;
  const LOAD_DISTANCE = 1.0;
  ${paramsBlock[0].replace(/\n\n        function getMachineMetrics$/, '')}
  ${metricsBlock[0].replace(/\n\n        \/\/ One lift cycle$/, '')}
  result = machinesData.map((machine, index) => {
    activeMachine = index;
    return [machine.choices[0], machine.choices[machine.choices.length - 1]].map((setting) => {
      controlSetting = setting;
      const metrics = getMachineMetrics();
      return {
        ...metrics,
        inputWork: metrics.effortForce * metrics.effortDistance,
        relativeLoadSpeed: 1 / metrics.mechanicalAdvantage
      };
    });
  });
`, sandbox);

assert.strictEqual(sandbox.result.length, 6, 'six machine models should run');
sandbox.result.forEach((pair, indexNumber) => {
  pair.forEach((metrics) => {
    assert(Math.abs(metrics.inputWork - 120) < 1e-8, `${machines[indexNumber][1]} should preserve 120 J ideal work`);
    assert(Math.abs(metrics.effortForce * metrics.effortDistance - 120) < 1e-8, `${machines[indexNumber][1]} force-distance product should be 120 J`);
  });
  const [lower, higher] = pair.sort((left, right) => left.mechanicalAdvantage - right.mechanicalAdvantage);
  assert(higher.effortForce < lower.effortForce, `${machines[indexNumber][1]} higher IMA should lower force`);
  assert(higher.effortDistance > lower.effortDistance, `${machines[indexNumber][1]} higher IMA should increase distance`);
  assert(higher.relativeLoadSpeed < lower.relativeLoadSpeed, `${machines[indexNumber][1]} higher IMA should lower output speed`);
});

const blocks = questionText.trim().split(/\n\s*\n(?=Type:\s*)/);
assert.strictEqual(blocks.length, 12, 'question import should contain 12 questions');
const scores = blocks.map((block) => Number((block.match(/^Score:\s*(\d+)/m) || [])[1]));
assert.strictEqual(scores.reduce((sum, score) => sum + score, 0), 15, 'question scores should total 15');
assert(blocks.slice(0, 10).every((block) => /^Type: MC$/m.test(block)), 'Questions 1-10 should be auto-graded multiple choice');
assert(blocks.slice(10).every((block) => /^Type: E$/m.test(block) && /Meta-grading: busybee/.test(block)), 'Questions 11-12 should be BusyBee essays');
assert.strictEqual(scores.slice(0, 10).reduce((sum, score) => sum + score, 0), 10, 'automatic questions should total 10 points');
assert.strictEqual(scores.slice(10).reduce((sum, score) => sum + score, 0), 5, 'BusyBee questions should total 5 points');
assert.doesNotMatch(questionText, /on-screen test table|recorded IMA|recorded tests/i, 'questions should require student calculations rather than displayed results');

console.log('Six isolated simulations, no displayed calculated answers, per-machine question placement, physics tradeoffs, and 15-point scoring passed.');
