const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, 'unit 5');
const context = vm.createContext({ window: {} });
for (const script of ['textbook-diagrams.js', 'textbook-waves.js', 'textbook-optics.js', 'textbook-matter.js', 'textbook-systems.js']) vm.runInContext(fs.readFileSync(path.join(root, script), 'utf8'), context);
const diagrams = context.window.Unit5Diagrams;
vm.runInContext(fs.readFileSync(path.join(root, 'animated-demos.js'), 'utf8'), context);
const physics = diagrams.physics;
const near = (actual, expected, tolerance = 1e-9) => assert(Math.abs(actual - expected) < tolerance, `${actual} differs from ${expected}`);
near(physics.critical(1.5) * 180 / Math.PI, 41.8103148958, 1e-8);
near(physics.critical(1.33) * 180 / Math.PI, 48.7534666313, 1e-8);
for (const startingIndex of [1, 1.33, 1.5, 1.6]) {
  for (const enteringIndex of [1, 1.33, 1.5, 2.42]) {
    const incident = Math.PI / 6;
    const output = physics.refracted(startingIndex, enteringIndex, incident);
    near(startingIndex * Math.sin(incident), enteringIndex * Math.sin(output));
    assert.equal(output < incident - 1e-12, enteringIndex > startingIndex);
  }
}
assert(Number.isNaN(physics.refracted(1.5, 1, Math.PI / 3)));
near(physics.lensImage(90, 225), 150);
near(1 / 90, 1 / 225 + 1 / physics.lensImage(90, 225));
near(physics.intensityRatio(2), .25);
near(physics.remaining(80, 1), 40);
near(physics.remaining(80, 2), 20);
near(physics.photonEnergy(350), 2 * physics.photonEnergy(700));
const files = JSON.parse(fs.readFileSync(path.join(root, 'simple-walkthrough-files.json')));
const pulseCenters = progress => {
  const diagram = diagrams.render({ type: 'wave', variant: 'interference' }, { reveal: true, progress, compact: false });
  return [...diagram.markup.match(/data-pulse-a="([^"]+)" data-pulse-b="([^"]+)"/)].slice(1).map(Number);
};
near(pulseCenters(0)[0], 1.2);
near(pulseCenters(0)[1], 4.8);
for (const progress of [.33, .44, .55]) {
  near(pulseCenters(progress)[0], 3);
  near(pulseCenters(progress)[1], 3);
}
near(pulseCenters(1)[0], 4.8);
near(pulseCenters(1)[1], 1.2);
assert(pulseCenters(.8)[0] > pulseCenters(.6)[0], 'Pulse A must keep moving right after overlap');
assert(pulseCenters(.8)[1] < pulseCenters(.6)[1], 'Pulse B must keep moving left after overlap');
for (const file of files) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const lesson = JSON.parse(html.match(/window.walkthroughLesson = (.*?);<\/script>/s)[1]);
  if (lesson.group === 'demos' && lesson.demoKind) {
    for (const width of [420,840]) for (const time of [0,2,4,8]) {
      const result = context.window.Unit5AnimatedDemos.render(lesson.demoKind,width,time,0);
      assert(!/NaN|Infinity|undefined/.test(result.svg), `${file}: invalid demo geometry`);
    }
    continue;
  }
  for (const compact of [false, true]) {
    const phases = lesson.type === 'critical' ? ['increase', 'critical', 'sine', 'simplify', 'divide', 'inverse', 'result', 'reflection', 'hold'] : ['watch', 'predict', 'reveal', 'complete'];
    for (const phase of phases) {
      for (const progress of [0, .25, .5, .75, 1]) {
        const result = diagrams.render(lesson, { phase, elapsed: 1200, progress, time: progress * 4, reveal: ['reveal', 'complete'].includes(phase), complete: phase === 'complete', compact, caseIndex: 0 });
        assert(!/NaN|Infinity|undefined/.test(result.markup), `${file}: invalid geometry in ${phase}`);
        assert(result.width > 0 && result.height > 0);
      }
    }
  }
}
console.log(`Physics identities and all render states pass for ${files.length} lessons.`);
