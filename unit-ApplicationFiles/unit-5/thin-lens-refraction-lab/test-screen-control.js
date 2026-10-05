'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function mount(html, storage) {
  const elements = new Map();
  for (const match of html.matchAll(/\bid="([^"]+)"/g)) {
    const id = match[1];
    assert(!elements.has(id), `Duplicate id: ${id}`);
    const calls = [];
    const ctx = new Proxy({
      fillText: text => calls.push(String(text)),
      measureText: text => ({ width: text.length * 8 }),
      createLinearGradient: () => ({ addColorStop() {} })
    }, { get: (target, key) => key in target ? target[key] : () => {} });
    const el = { id, value: '', textContent: '', style: {}, events: {}, attrs: {}, calls,
      width: 1100, height: 500, capture: null,
      setAttribute(name, value) { this.attrs[name] = value; },
      addEventListener(name, fn) { this.events[name] = fn; },
      getContext: () => ctx,
      getBoundingClientRect: () => ({ left: 20, top: 30, width: 550, height: 250 }),
      setPointerCapture(id) { this.capture = id; },
      hasPointerCapture(id) { return this.capture === id; },
      releasePointerCapture() { this.capture = null; }
    };
    elements.set(id, el);
  }
  const roots = ['L1', 'L2', 'L3', 'L4'].map(id => ({ id: 'trial-' + id,
    dataset: { lensTrial: id }, querySelector: selector => {
      const el = elements.get(selector.slice(1));
      assert(el, `Missing target ${selector}`); return el;
    }
  }));
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.runInNewContext(script, {
    document: { querySelectorAll: () => roots, getElementById: id => elements.get(id) },
    sessionStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) }
  });
  return elements;
}
for (const file of ['thin_lens_refraction_investigation.html', 'u5l3-thin-lens-buzz-assessment-template.html', 'u5l3-thin-lens-buzz-assessment-template-preview.html']) {
  const html = fs.readFileSync(path.join(__dirname, file), 'utf8');
  assert.equal((html.match(/data-lens-trial=/g) || []).length, 4);
  if (!file.includes('-preview')) {
    assert.equal((html.match(/<a:question \/>/g) || []).length, 21);
    for (const section of html.matchAll(/<section[^>]*data-lens-trial="L\d"[^>]*>([\s\S]*?)<\/section>/g)) {
      assert.equal((section[1].match(/<a:question \/>/g) || []).length, 5);
    }
  }
  const storage = new Map();
  const dom = mount(html, storage);
  const el = (trial, name) => dom.get(`trial-${trial}-${name}`);
  const set = (trial, distance) => {
    const slider = el(trial, 'screen-distance');
    slider.value = String(distance); slider.events.input({ target: slider });
  };
  assert.equal(dom.get('tl-progress-percent').textContent, '0%');
  for (const [trial, p, q] of [['L1',60,20], ['L2',30,30], ['L3',20,60], ['L4',10,30]]) {
    assert(el(trial, 'lens-canvas').calls.includes(`Object p = ${p.toFixed(1)} cm (fixed)`));
    assert(el(trial, 'lens-canvas').calls.includes('Object height = +20.0 mm'));
    assert(el(trial, 'lens-canvas').calls.includes('Screen close-up'));
    if (trial !== 'L4') {
      assert(el(trial, 'record-lens').disabled);
      el(trial, 'record-lens').events.click();
      assert(!JSON.parse(storage.get(`thin-lens-four-trials-v1-${trial}`) || '{}').observed);
    }
    const otherValues = ['L1','L2','L3','L4'].filter(id => id !== trial).map(id => el(id, 'screen-distance').value);
    set(trial, q);
    assert.deepEqual(['L1','L2','L3','L4'].filter(id => id !== trial).map(id => el(id, 'screen-distance').value), otherValues);
    assert(!el(trial, 'record-lens').disabled);
    assert.match(el(trial, 'lens-summary').textContent, trial === 'L4' ? /cannot capture/ : /sharp, inverted/);
    el(trial, 'record-lens').events.click();
  }
  assert.equal(dom.get('tl-progress-percent').textContent, '100%');
  // Pointer coordinates are CSS pixels at half the intrinsic canvas size.
  const canvas = el('L1', 'lens-canvas');
  const pointer = x => ({ button: 0, pointerId: 7, clientX: 20 + x / 2, clientY: 30 + 320 / 2, preventDefault() {} });
  canvas.events.pointerdown(pointer(650));
  canvas.events.pointermove(pointer(700));
  canvas.events.pointerup(pointer(700));
  assert.equal(el('L1', 'screen-distance').value, '30');
  assert.equal(canvas.capture, null);
  assert.equal(el('L2', 'screen-distance').value, '30');
  el('L2', 'ray-mode').value = 'off'; el('L2', 'ray-mode').events.change();
  const restored = mount(html, storage);
  assert.equal(restored.get('trial-L1-screen-distance').value, '30');
  assert.equal(restored.get('trial-L2-ray-mode').value, 'off');
  assert.equal(restored.get('trial-L3-ray-mode').value, 'on');
  assert.equal(restored.get('tl-progress-percent').textContent, '100%');
  console.log(`PASS ${file}: four independent canvases, focus, dragging, progress, and restore`);
}
