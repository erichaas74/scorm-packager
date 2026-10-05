'use strict';

// Execute the shipped script with a small DOM substitute. This checks application
// events and focus transitions, not native browser keyboard behavior or layout.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function load(file) {
  const html = fs.readFileSync(path.join(__dirname, file), 'utf8');
  const ids = new Map();
  const timers = [];
  let document;
  class Element {
    constructor(tag) {
      this.tagName = tag.toUpperCase(); this.children = []; this.dataset = {};
      this.attributes = {}; this.events = {}; this.style = {}; this.disabled = false;
      const classes = new Set();
      this.classList = {
        add: (...names) => names.forEach(n => classes.add(n)),
        remove: (...names) => names.forEach(n => classes.delete(n)),
        contains: name => classes.has(name),
        toggle(name, on = !classes.has(name)) { on ? classes.add(name) : classes.delete(name); }
      };
    }
    setAttribute(name, value) {
      this.attributes[name] = String(value);
      if (name === 'id') ids.set(value, this);
      if (name === 'disabled') this.disabled = true;
    }
    getAttribute(name) { return this.attributes[name]; }
    append(...nodes) { nodes.forEach(node => { node.parentElement = this; this.children.push(node); }); }
    appendChild(node) { this.append(node); return node; }
    set innerHTML(value) { this.markup = value; this.children = []; }
    get innerHTML() { return this.markup || ''; }
    addEventListener(name, fn) { (this.events[name] ||= []).push(fn); }
    fire(name, values = {}) { for (const fn of this.events[name] || []) fn({ target: this, preventDefault() {}, ...values }); }
    focus() { document.activeElement = this; }
    click() { if (!this.disabled) { this.focus(); this.fire('click'); } }
    contains(node) { return node === this || this.children.some(child => child.contains(node)); }
    querySelector(tag) { return this.children.find(child => child.tagName === tag.toUpperCase()) || null; }
    setPointerCapture() {}
    releasePointerCapture() {}
    getBoundingClientRect() { return { width: 760 }; }
  }
  document = {
    activeElement: null, getElementById: id => ids.get(id),
    createElement: tag => new Element(tag), createElementNS: (_, tag) => new Element(tag),
    getElementsByTagName: () => []
  };
  for (const match of html.matchAll(/<([\w-]+)\b[^>]*\bid="([^"]+)"[^>]*>/g)) {
    const el = new Element(match[1]); el.setAttribute('id', match[2]);
  }
  ids.get('alignActions').append(ids.get('markerPosition'), ids.get('checkAlignment'));
  const context = { document, window: { location: { protocol: 'http:' } },
    performance: { now: () => 0 }, requestAnimationFrame: () => 1, cancelAnimationFrame() {},
    setTimeout: fn => timers.push(fn), clearTimeout() {} };
  vm.runInNewContext(html.match(/<script>([\s\S]*?)<\/script>/)[1], context, { filename: file });
  const get = id => ids.get(id);
  const select = ref => {
    const button = get('referenceGrid').children.find(el => el.dataset.reference === ref);
    assert.equal(button.tagName, 'BUTTON'); assert.equal(button.type, 'button');
    button.click();
    assert.equal(document.activeElement, get('markerPosition'));
  };
  const adjust = value => { get('markerPosition').value = String(value); get('markerPosition').fire('input'); };
  return { get, select, adjust, document, timers, html };
}

for (const file of ['index.html', 'u5l5-spectral-shift-buzz-assessment-template.html', 'u5l5-spectral-shift-buzz-assessment-template-preview.html']) {
  const { get, select, adjust, document, timers, html } = load(file);
  assert.match(html, /label for="markerPosition"/);
  assert.match(html, /id="markerPosition" type="range"/);
  assert.equal(get('markerPosition').disabled, true);

  select('helium'); adjust(-120); get('checkAlignment').click();
  assert.match(get('status').textContent, /not all aligned/);
  assert(get('nextBtn').classList.contains('ssi-hidden'));

  select('hydrogen'); adjust(-40); get('checkAlignment').click();
  assert.match(get('status').textContent, /not all aligned/);
  adjust(-120); get('checkAlignment').click();
  assert.equal(document.activeElement, get('nextBtn'));
  assert.equal(get('markerPosition').disabled, true);
  assert.match(get('shiftReadout').innerHTML, /78\.8 nm/);

  get('nextBtn').click();
  assert.equal(document.activeElement, get('referenceGrid').children[0]);
  select('calcium'); adjust(90); get('checkAlignment').click();
  assert.match(get('shiftReadout').innerHTML, /-58\.0 nm/);
  assert.equal(document.activeElement, get('nextBtn'));

  get('nextBtn').click(); select('helium');
  while (timers.length) timers.shift()();
  assert.equal(document.activeElement, get('nextBtn'));
  assert.match(get('shiftReadout').innerHTML, /0\.0 nm/);
  assert.equal(get('downloadEvidence').disabled, false);
  get('nextBtn').click();
  assert.equal(get('progress').textContent, '3 of 3 cases measured');
  assert.equal(document.activeElement, get('buzzHeading'));

  get('resetBtn').click();
  assert.equal(get('downloadEvidence').disabled, true);
  assert.equal(document.activeElement, get('referenceGrid').children[0]);
  select('hydrogen');
  // Existing pointer alignment still records a case and synchronizes the slider.
  const drag = get('obsDragTarget');
  drag.fire('pointerdown', { clientX: 200, pointerId: 1 });
  drag.fire('pointermove', { clientX: 200 - .12 * 652 * 550 / 400, pointerId: 1 });
  assert.equal(get('markerPosition').value, '-120');
  drag.fire('pointerup', { pointerId: 1 });
  assert.match(get('shiftReadout').innerHTML, /78\.8 nm/);
}
console.log('Passed all three shipped views: reference selection, wrong alignments, three-case completion, focus, reset, and pointer compatibility.');
