'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const createFlight = require('./lesson-honors/parachute-flight');
const grading = require('./lesson-honors/parachute-grading');
const flight = createFlight(); flight.start(); flight.advance(2); flight.cutoff();
flight.advance(4); flight.deploy(); flight.advance(100);
const record = grading.freezeFlight(flight.state, 1);
const answers = { total: record.totalTime, chute: record.chuteTime,
  percent: record.chuteTime/record.totalTime*100, safety: 'safe' };
const correct = grading.grade(record, answers);
assert.equal(grading.submission(null), '');
assert.equal(grading.submission(grading.grade(record, { ...answers, total: '' })), '');
const packet = grading.submission(correct);
assert.equal(grading.restore(packet).score, 4);
assert.equal(grading.restore('complete'), null);
assert.equal(grading.restore(packet.replace('"status":"complete"', '"status":"incomplete"')), null);

class Textarea {
  constructor(value = '') { this._value = value; this.tagName = 'TEXTAREA'; this.attrs = {}; this.events = []; this.ownerDocument = { defaultView: view }; }
  get value() { return this._value; }
  set value(value) { this._value = value; }
  setAttribute(key, value) { this.attrs[key] = value; }
  dispatchEvent(event) { this.events.push(event.type); }
}
const view = { HTMLTextAreaElement: Textarea, Event: class { constructor(type) { this.type = type; } } };
function fixture(initialFields, initialGrade) {
  let fields = initialFields, result = initialGrade, mutations;
  const status = { textContent: '' };
  const slot = { querySelectorAll(selector) { return selector === 'iframe' ? [] : fields; } };
  const root = {
    querySelector(selector) { return selector === '#s5-buzz-response' ? slot : status; },
    currentFlightGrade() { return result; },
    restoreFlightAssessment(saved) { result = saved; }
  };
  const document = { handlers: {}, getElementById() { return null; },
    addEventListener(name, fn) { this.handlers[name] = fn; } };
  const context = vm.createContext({ document, ParachuteGrading: grading,
    MutationObserver: class { constructor(fn) { mutations = fn; } observe() {} disconnect() {} } });
  vm.runInContext(fs.readFileSync(path.join(__dirname, 'lesson-honors/parachute-buzz-response.js'), 'utf8'), context);
  const bridge = context.connectParachuteBuzzResponse(root, document);
  return { root, document, status, bridge,
    change(value) { result = value; root.onFlightGrade(value); },
    inject(value) { fields = [value]; mutations(); } };
}

const input = new Textarea();
const app = fixture([input], null);
assert.equal(input.value, '');
assert.equal(input.attrs.tabindex, '-1');
app.change(grading.grade(record, { ...answers, total: 0 })); assert.equal(input.value, '');
app.change(correct); assert.equal(input.value, packet);
assert(input.events.includes('input') && input.events.includes('change'));
app.change(null); assert.equal(input.value, '', 'edits/retry clear stale completion evidence');
app.document.handlers.submit(); assert.equal(input.value, '', 'incomplete submission stays truly blank');
app.change(correct); app.document.handlers.submit(); assert.equal(input.value, packet);

const saved = new Textarea(packet);
const resumed = fixture([saved], null);
assert.equal(resumed.root.currentFlightGrade().score, 4);
assert.equal(saved.value, packet, 'opening saved work must not erase completed evidence');
const delayed = fixture([], correct);
assert(delayed.status.textContent.includes('not available'));
const delayedField = new Textarea(); delayed.inject(delayedField);
assert.equal(delayedField.value, packet, 'late Buzz rendering receives completion evidence');
const stale = fixture([], null); stale.change(null);
const staleField = new Textarea(packet); stale.inject(staleField);
assert.equal(staleField.value, '', 'reset before editor mounts must not restore old completion');

const rich = { tagName: 'DIV', textContent: '', ownerDocument: { defaultView: view },
  setAttribute() {}, events: [], dispatchEvent(event) { this.events.push(event.type); } };
const richApp = fixture([rich], null);
richApp.change(correct); assert.equal(rich.textContent, packet);
richApp.change(null); assert.equal(rich.textContent, '');
console.log('ok: hidden response blank/complete behavior, edit clearing, submit synchronization, saved evidence, delayed editors, textarea and rich-text events');
