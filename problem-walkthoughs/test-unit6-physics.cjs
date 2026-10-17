const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, 'unit 6');
const context = vm.createContext({ window: {} });
for (const script of ['textbook-diagrams.js', 'textbook-electric.js', 'textbook-circuits.js', 'textbook-magnetic.js']) vm.runInContext(fs.readFileSync(path.join(root, script), 'utf8'), context);
const diagrams = context.window.Unit6Diagrams;
const physics = diagrams.physics;
const near = (actual, expected) => assert(Math.abs(actual - expected) < 1e-9, `${actual} differs from ${expected}`);
near(physics.force(1e-6, 1e-6, 1), .009);
near(physics.force(1e-6, 1e-6, 2), .00225);
near(physics.field(1e-6, 2), 2250);
near(physics.potential(1e-9, 2), 4.5);
near(physics.wireField(2, .02), 20e-6);
near(physics.wireField(2, .04), 10e-6);
near(physics.parallel([6, 6]), 3);
near(physics.current(18, 9), 2);
near(physics.emf(100, .2, .01, 10), 2);
const files = JSON.parse(fs.readFileSync(path.join(root, 'simple-walkthrough-files.json')));
for (const file of files) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const lesson = JSON.parse(html.match(/window.walkthroughLesson = (.*?);<\/script>/s)[1]);
  for (const compact of [false, true]) for (const reveal of [false, true]) for (const progress of [0, .25, .5, .75, 1]) {
    const result = diagrams.render(lesson, { phase: reveal ? 'reveal' : 'predict', reveal, progress, time: progress * 6.5, complete: progress === 1, compact });
    assert(!/NaN|Infinity|undefined/.test(result.markup), `${file}: invalid geometry`);
    assert(result.width > 0 && result.height > 0);
  }
}
console.log(`Physics identities and render states pass for ${files.length} lessons.`);
