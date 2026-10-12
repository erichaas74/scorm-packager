const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = fs.readFileSync('problem-walkthoughs/unit 4/rube-goldberg-energy-chain.html', 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
function setup(reduced) {
  let focused, clock = 0, sequence = 0;
  const pending = new Map(), messages = [], nodes = {};
  class Element {
    constructor() { this.children = []; this.events = {}; this.attrs = {}; this.hidden = false; this.checked = false; this.text = ''; }
    set textContent(value) { this.text = value; this.children = []; }
    get textContent() { return this.text + this.children.map(x => x.textContent).join(''); }
    set innerHTML(value) { this.markup = value; }
    append(child) { this.children.push(child); }
    replaceChildren() { this.children = []; this.text = ''; }
    setAttribute(name, value) { this.attrs[name] = String(value); }
    addEventListener(name, handler) { this.events[name] = handler; }
    focus() { focused = this; }
    click() { this.events.click?.(); }
  }
  for (const tag of html.matchAll(/<[^>]+\bid="([^"]+)"[^>]*>/g)) {
    nodes[tag[1]] = new Element(); nodes[tag[1]].hidden = /\bhidden\b/.test(tag[0]);
  }
  const media = { matches: reduced, addEventListener(_, fn) { this.change = fn; } };
  vm.runInNewContext(script, {
    document: { getElementById: id => nodes[id], createElement: () => new Element(), createElementNS: () => new Element() },
    matchMedia: () => media, performance: { now: () => clock },
    requestAnimationFrame: fn => { pending.set(++sequence, fn); return sequence; },
    cancelAnimationFrame: id => pending.delete(id),
    window: { parent: { postMessage: (message, origin) => messages.push({ message, origin }) } }
  });
  function tick() { clock += 5000; const callbacks = [...pending.values()]; pending.clear(); callbacks.forEach(fn => fn(clock)); }
  function finish() { if (nodes.reduced.checked) for (let i = 0; i < 3; i++) nodes.frame.click(); else tick(); }
  return { nodes, pending, messages, tick, finish, media, focused: () => focused };
}
for (const reduced of [false, true]) {
  const app = setup(reduced), n = app.nodes;
  assert.equal(n.reduced.checked, reduced);
  for (let run = 0; run < 2; run++) {
    for (let stage = 0; stage < 4; stage++) {
      assert.equal(n.choices.children.length, 3);
      assert.equal(n.evidence.children.length, 0, 'prediction has no energy evidence');
      assert(n.feedback.hidden && n.next.hidden && n.replay.hidden && n.summary.hidden);
      n.next.click(); n.frame.click(); n.replay.click();
      assert.equal(n.choices.children.length, 3, 'cannot bypass prediction');
      n.choices.children[[0,1,0,0][stage]].click(); // Every prediction is deliberately incorrect.
      assert.equal(n.choices.children.length, 0);
      assert(n.next.hidden && n.feedback.hidden && n.summary.hidden);
      assert.equal(app.pending.size, reduced ? 0 : 1);
      if (reduced) {
        n.frame.click(); n.frame.click();
        assert(n.feedback.hidden && n.next.hidden, 'reveal must be fully viewed');
        n.frame.click();
      } else app.tick();
      assert(!n.feedback.hidden);
      if (stage < 3) { assert.equal(app.messages.length, run); n.next.click(); }
      else {
        assert(!n.summary.hidden);
        assert.equal(app.messages.length, 1, 'completion once regardless of wrong answers/reset');
        assert.equal(app.messages[0].message.type, 'complete');
        assert.equal(app.messages[0].origin, '*');
        n.replay.click();
        assert(n.feedback.hidden && n.summary.hidden);
        assert.equal(n.evidence.children.length, 0, 'replay clears evidence');
        app.finish();
        assert.equal(app.messages.length, 1);
      }
    }
    n.reset.click();
    assert.equal(n.ball.attrs.transform, 'translate(106 124) rotate(0)');
  }
  console.log(`PASS ${reduced ? 'reduced-motion' : 'animated'}: all gates, wrong-answer completion, replay, reset, once-only message`);
}
const app = setup(false), n = app.nodes;
n.choices.children[0].click();
const stale = [...app.pending.values()][0];
n.reset.click(); stale(10000);
assert(n.feedback.hidden && n.next.hidden && n.summary.hidden);
assert.equal(n.choices.children.length, 3);
assert.equal(app.messages.length, 0);
n.choices.children[0].click();
app.media.change({ matches: true });
assert(n.reduced.checked && !n.frame.hidden);
assert.equal(app.pending.size, 0);
console.log('PASS reset cancels stale animation; operating-system reduced-motion changes stop animation');
assert(!/<(?:script|link|img)[^>]+(?:src|href)=["']https?:/i.test(html));
assert.match(html, /border:5px solid #285f9f/);
console.log('PASS self-contained assets and required border');
