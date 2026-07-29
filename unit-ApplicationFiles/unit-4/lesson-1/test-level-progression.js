const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

function element(initial = {}) {
  const listeners = {};
  return Object.assign({
    textContent: '',
    innerHTML: '',
    hidden: false,
    disabled: false,
    value: '',
    dataset: {},
    classList: { toggle() {} },
    addEventListener(type, listener) { listeners[type] = listener; },
    click() { if (!this.disabled && listeners.click) listeners.click({ currentTarget: this }); },
    scrollIntoView() {}
  }, initial);
}

const context2d = new Proxy({}, {
  get(target, key) {
    if (key === 'createLinearGradient') return () => ({ addColorStop() {} });
    if (!(key in target)) target[key] = () => {};
    return target[key];
  },
  set(target, key, value) { target[key] = value; return true; }
});

const canvases = [0, 1, 2].map(index => element({
  getContext: () => context2d,
  width: 900,
  height: 470,
  dataset: { setupCanvas: String(index) }
}));

function trackedSetupCard(index) {
  const card = element({ dataset: { setupCard: String(index) }, history: [] });
  Object.defineProperty(card, 'innerHTML', {
    get() { return this.markup || ''; },
    set(markup) { this.markup = markup; this.history.push(markup); }
  });
  return card;
}
const setupCards = [0, 1, 2].map(trackedSetupCard);

const nodes = new Map();
const getNode = selector => {
  if (!nodes.has(selector)) nodes.set(selector, element());
  return nodes.get(selector);
};

const machineOrder = ['incline', 'pulley', 'lever', 'wheel'];
const tabs = machineOrder.map(machine => element({ dataset: { machineTab: machine } }));
const globalInputs = ['mass', 'height', 'speed'].map(key => element({ dataset: { global: key } }));

const root = element();
root.querySelector = selector => getNode(selector);
root.querySelectorAll = selector => {
  if (selector === '[data-machine-tab]') return tabs;
  if (selector === '[data-global]') return globalInputs;
  if (selector === '[data-canvas]') return canvases;
  if (selector === '[data-setup-card]') return setupCards;
  return [];
};

let animationTime = 0;
let scormStatus = '';
const sandbox = {
  document: { querySelector: selector => selector === '[data-simple-machine-app]' ? root : null },
  window: { SCORM: { setScore() {}, setStatus(value) { scormStatus = value; } } },
  navigator: { clipboard: { writeText: async () => {} } },
  matchMedia: () => ({ matches: false }),
  requestAnimationFrame(callback) { animationTime += 1000; callback(animationTime); return animationTime; },
  cancelAnimationFrame() {},
  setTimeout(callback) { callback(); },
  Blob,
  URL: { createObjectURL: () => 'blob:test', revokeObjectURL() {} },
  console
};

const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
const script = html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
vm.runInNewContext(script, sandbox, { filename: 'index.html' });

const runButton = getNode('[data-run]');
const nextButton = getNode('[data-next-level]');
const progress = getNode('[data-progress]');
const tableBody = getNode('[data-table-body]');

function tableRows() {
  return [...tableBody.innerHTML.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map(row =>
    [...row[1].matchAll(/<td>([\s\S]*?)<\/td>/g)].map(cell => cell[1].trim())
  );
}

function verifyThreeSetupLevel(expectedMachineText) {
  assert.strictEqual(canvases.length, 3, 'each level should keep three canvases visible');
  assert.strictEqual(setupCards.length, 3, 'each canvas should have its own setup card');
  assert(setupCards.every(card => /Equal output work:/.test(card.innerHTML)), 'all three cards should state equal work');
  assert.match(setupCards[0].innerHTML, /Setup A/);
  assert.match(setupCards[1].innerHTML, /Setup B/);
  assert.match(setupCards[2].innerHTML, /Setup C/);
  assert.match(getNode('[data-pre-difference]').textContent, /compare/i, 'each level should ask what differs before animation');
  assert.match(getNode('[data-pre-help]').textContent, /help/i, 'each level should ask how the machine helps before animation');
  const historyStart = setupCards[0].history.length;
  runButton.click();
  const rows = tableRows();
  assert.strictEqual(rows.length, 3, 'animation should produce three comparison rows');
  assert.deepStrictEqual(new Set(rows.map(row => row[6])).size, 1, 'output work must be equal in all three setups');
  assert.strictEqual(new Set(rows.map(row => row[5])).size, 3, 'the three recorded times must differ');
  assert.strictEqual(new Set(rows.map(row => row[11])).size, 3, 'the three recorded powers must differ');
  assert(rows.every(row => row[0].startsWith('Setup ')), 'rows should be labeled Setup A, B, and C');
  assert.match(getNode('[data-difference-question]').textContent, /compare/i);
  assert.match(getNode('[data-help-question]').textContent, /help/i);
  assert.match(getNode('[data-time-power-question]').textContent, /Setup A:.*Setup B:.*Setup C:/);
  assert(setupCards.every(card => /Time .* s \/ Power .* W/.test(card.innerHTML)), 'each card should show its own time and power');
  const runHistoryA = setupCards[0].history.slice(historyStart);
  const runHistoryC = setupCards[2].history.slice(historyStart);
  const separatedFinish = runHistoryA.some((markup, index) =>
    /Animation: 100%/.test(markup) && runHistoryC[index] && !/Animation: 100%/.test(runHistoryC[index]));
  assert.strictEqual(separatedFinish, true, 'side-by-side animation should show a faster setup finish while another is still moving');
  assert.match(getNode('[data-machine-title]').textContent, expectedMachineText);
}

assert.strictEqual(progress.textContent, '0 of 4 levels complete');
assert.deepStrictEqual(tabs.map(tab => tab.disabled), [false, false, false, false], 'all level tabs should be available immediately');
assert.strictEqual(globalInputs.every(input => input.disabled === false), true);
tabs[3].click();
assert.match(getNode('[data-machine-title]').textContent, /Wheel and axle/, 'students should be able to jump directly to Level 4');
tabs[0].click();
assert.match(getNode('[data-machine-title]').textContent, /Inclined plane/, 'students should be able to switch back at any time');

verifyThreeSetupLevel(/Inclined plane/);
assert.strictEqual(progress.textContent, '1 of 4 levels complete');
assert.strictEqual(globalInputs.every(input => input.disabled), true, 'shared task controls should lock after animation begins');

nextButton.click();
assert.doesNotMatch(tableBody.innerHTML, /deg ramp/, 'Level 2 table should not mix Level 1 rows');
verifyThreeSetupLevel(/Pulleys/);
assert.strictEqual(progress.textContent, '2 of 4 levels complete');

nextButton.click();
verifyThreeSetupLevel(/Levers/);
assert.strictEqual(progress.textContent, '3 of 4 levels complete');

nextButton.click();
verifyThreeSetupLevel(/Wheel and axle/);
assert.strictEqual(progress.textContent, '4 of 4 levels complete');
assert.strictEqual(nextButton.hidden, true, 'Level 4 should not show a next-level button');
assert.strictEqual(scormStatus, 'completed');

console.log('Free level switching, side-by-side canvases, card alignment, equal-work, distinct-duration/time/power, prompt, progression, and table checks passed.');
