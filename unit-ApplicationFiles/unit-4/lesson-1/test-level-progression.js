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
    setAttribute(name, value) { this[name] = value; },
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
const globalInputs = ['mass', 'height'].map(key => element({ dataset: { global: key } }));
const imaInputs = [0, 1, 2].map(index => element({ dataset: { calculationIma: String(index) } }));
const amaInputs = [0, 1, 2].map(index => element({ dataset: { calculationAma: String(index) } }));
const calculationCards = [0, 1, 2].map(index => element({ dataset: { calculationCard: String(index) } }));

const root = element();
root.querySelector = selector => getNode(selector);
root.querySelectorAll = selector => {
  if (selector === '[data-machine-tab]') return tabs;
  if (selector === '[data-global]') return globalInputs;
  if (selector === '[data-canvas]') return canvases;
  if (selector === '[data-setup-card]') return setupCards;
  if (selector === '[data-calculation-ima]') return imaInputs;
  if (selector === '[data-calculation-ama]') return amaInputs;
  if (selector === '[data-calculation-card]') return calculationCards;
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
  sessionStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
  console
};

const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
const script = html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
vm.runInNewContext(script, sandbox, { filename: 'index.html' });

const runButton = getNode('[data-run]');
const nextButton = getNode('[data-next-level]');
const progress = getNode('[data-progress]');
const tableBody = getNode('[data-table-body]');
const checkButton = getNode('[data-check-calculations]');

function tableRows() {
  return [...tableBody.innerHTML.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map(row =>
    [...row[1].matchAll(/<td>([\s\S]*?)<\/td>/g)].map(cell => cell[1].trim())
  );
}

function verifyThreeSetupLevel(expectedMachineText) {
  assert.strictEqual(canvases.length, 3, 'each level should keep three canvases visible');
  assert.strictEqual(setupCards.length, 3, 'each canvas should have its own setup card');
  assert(setupCards.every(card => /Output force:/.test(card.innerHTML)), 'all three cards should identify the shared output force');
  assert.match(setupCards[0].innerHTML, /Setup A/);
  assert.match(setupCards[1].innerHTML, /Setup B/);
  assert.match(setupCards[2].innerHTML, /Setup C/);
  runButton.click();
  const rows = tableRows();
  assert.strictEqual(rows.length, 3, 'the lab should acquire three data rows');
  assert.deepStrictEqual(new Set(rows.map(row => row[2])).size, 1, 'output force must be equal in all three setups');
  assert.deepStrictEqual(new Set(rows.map(row => row[4])).size, 1, 'output distance must be equal in all three setups');
  assert.strictEqual(new Set(rows.map(row => row[3])).size, 3, 'the measured input forces must differ');
  assert.strictEqual(new Set(rows.map(row => row[5])).size, 3, 'the measured input distances must differ');
  assert(rows.every(row => row[0].startsWith('Setup ')), 'rows should be labeled Setup A, B, and C');
  assert(setupCards.every(card => /Measured input force:/.test(card.innerHTML)), 'each setup card should report its acquired input force');
  assert.doesNotMatch(tableBody.innerHTML, /power|time|efficiency/i, 'the simplified data table should stay focused on force and distance');

  imaInputs.forEach(input => { input.value = '99.00'; });
  amaInputs.forEach(input => { input.value = '99.00'; });
  checkButton.click();
  assert.strictEqual(getNode('[data-discovery]').hidden, true, 'incorrect calculations must not complete the machine');
  assert.match(getNode('[data-calculation-summary]').textContent, /0 of 3 setups verified/);

  rows.forEach((row, index) => {
    imaInputs[index].value = (Number(row[5]) / Number(row[4])).toFixed(2);
    amaInputs[index].value = (Number(row[2]) / Number(row[3])).toFixed(2);
  });
  checkButton.click();
  assert.strictEqual(getNode('[data-calculation]').hidden, false, 'calculation panel should remain visible after data acquisition');
  assert.strictEqual(getNode('[data-discovery]').hidden, false, 'correct IMA and AMA calculations should reveal the comparison');
  assert.match(getNode('[data-comparison-question]').textContent, /IMA .*AMA/);
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

console.log('Free level switching, three-trial data acquisition, IMA/AMA calculation checks, comparison feedback, progression, and focused table checks passed.');
