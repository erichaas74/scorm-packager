const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, 'sim.js'), 'utf8');

function lab(options = {}) {
  let now = 1000, id = 0;
  const timers = new Map(), frames = new Map();
  const window = { addEventListener() {}, ...options };
  const context = {
    window, document: { createElement: () => ({}) },
    performance: { now: () => now },
    setTimeout(fn, delay) { const key = ++id; timers.set(key, { fn, at: now + delay }); return key; },
    clearTimeout(key) { timers.delete(key); },
    setInterval(fn, delay) { const key = ++id; timers.set(key, { fn, at: now + delay, delay }); return key; },
    clearInterval(key) { timers.delete(key); },
    requestAnimationFrame(fn) { const key = ++id; frames.set(key, fn); return key; },
    cancelAnimationFrame(key) { frames.delete(key); },
    localStorage: { setItem() {} },
  };
  vm.createContext(context);
  vm.runInContext(source.replace("  window.addEventListener('load', init);", `
    render = function() {};
    sizeCanvas = function() {};
    drawCanvasScene = function() {};
    window.test = { state: state, race: race, startTest: startTest,
      clearPendingTimers: clearPendingTimers, speakCue: speakCue,
      selectLevel: selectLevel, catchReaction: catchReaction,
      playGunshot: playGunshot, playStarterTone: playStarterTone,
      playEngineRev: playEngineRev, playLightBeep: playLightBeep,
      startAnimLoop: startAnimLoop, setOpponentDelay: function(t) { opponentDelay = t; } };
  `), context);
  function advance(ms) {
    const end = now + ms;
    while (true) {
      const next = [...timers].filter(([, t]) => t.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
      if (!next) break;
      const [key, t] = next;
      now = t.at;
      if (t.delay) t.at += t.delay; else timers.delete(key);
      t.fn();
    }
    now = end;
  }
  return { api: window.test, timers, frames, advance,
    frame(ms) { advance(ms); const pending = [...frames.values()]; frames.clear(); pending.forEach(fn => fn(now)); } };
}

// All three countdowns must proceed with absent or failing audio.
for (const audio of [ {}, { AudioContext() { throw Error('blocked'); } },
  { AudioContext: function() { this.state = 'running'; this.createOscillator = this.createBuffer = () => { throw Error('device failed'); }; } } ]) {
  for (const level of [1, 2, 3]) {
    const l = lab(audio);
    l.api.state.currentLevel = level;
    l.api.startTest();
    l.advance(10000);
    assert.equal(l.api.state.gameState, 'dropping', `level ${level} must advance without sound`);
  }
}

// Reset/scenario changes must invalidate both fallback and late speech callbacks.
let utterance;
const speech = {
  SpeechSynthesisUtterance: function(text) { this.text = text; },
  speechSynthesis: { speak(u) { utterance = u; }, cancel() { if (utterance) utterance.onend(); } },
};
const l = lab(speech);
l.api.state.currentLevel = 2;
l.api.startTest();
const oldUtterance = utterance;
l.api.selectLevel(1);
oldUtterance.onerror();
l.advance(10000);
assert.equal(l.api.state.gameState, 'idle');
assert.equal(l.timers.size, 0);
assert.equal(l.frames.size, 0);

// Silent speech engines still advance exactly once via the fallback.
const fallback = lab({ SpeechSynthesisUtterance: function() {}, speechSynthesis: { cancel() {}, speak() {} } });
let calls = 0;
fallback.api.speakCue('test', { fallbackDelay: 500 }, () => calls++);
fallback.advance(1000);
assert.equal(calls, 1);

// Both races must complete in real time even when only drawing 5 frames/second.
for (const level of [2, 3]) {
  const slow = lab();
  slow.api.state.currentLevel = level;
  slow.api.state.gameState = 'dropping';
  slow.api.state.startTime = 1000;
  slow.api.setOpponentDelay(0.2);
  slow.api.startAnimLoop();
  slow.frame(200);
  slow.api.catchReaction({ timeStamp: 1300 });
  for (let i = 0; i < 30 && !slow.api.state.pendingTrial; i++) slow.frame(200);
  assert.ok(slow.api.state.pendingTrial, `level ${level} finishes at 5 fps`);
  assert.equal(slow.frames.size, 0);
}

// Selecting idle scenes must not leave an endless animation loop running.
const idle = lab();
idle.api.selectLevel(2);
assert.equal(idle.frames.size, 0);
idle.api.selectLevel(3);
assert.equal(idle.frames.size, 0);
console.log('PASS: audio failures, speech cancellation/fallback, low-frame-rate races, and idle animation lifecycle');
