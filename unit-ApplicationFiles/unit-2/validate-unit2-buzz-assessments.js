const fs = require('fs');
const path = require('path');

const root = __dirname;
const workspace = path.resolve(root, '..', '..');
const assessments = [
  { lesson: 'U2L1', dir: 'lesson-u2l1', setup: 'u2l1_projectile_motion_buzz_setup.txt', template: 'u2l1-phet-projectile-buzz-assessment-template.html', preview: 'u2l1-phet-projectile-buzz-assessment-template-preview.html', simulation: 'index.html', count: 12, externalPhET: true },
  { lesson: 'U2L2', dir: 'lesson-u2l2', setup: 'u2l2_launch_velocity_buzz_setup.txt', template: 'u2l2-launch-velocity-buzz-assessment-template.html', preview: 'u2l2-launch-velocity-buzz-assessment-template-preview.html', simulation: 'baseball-throw.html', count: 9 },
  { lesson: 'U2L3', dir: 'lesson-u2l3', setup: 'u2l3_circus_launch_buzz_setup.txt', template: 'u2l3-circus-launch-buzz-assessment-template.html', preview: 'u2l3-circus-launch-buzz-assessment-template-preview.html', simulation: 'newer-circus-launches.html', count: 10 },
  { lesson: 'U2L4', dir: 'lesson-u2l4', setup: 'u2l4_river_rescue_buzz_setup.txt', template: 'u2l4-river-rescue-buzz-assessment-template.html', preview: 'u2l4-river-rescue-buzz-assessment-template-preview.html', simulation: 'Riverboat-crossing.html', count: 12 },
  { lesson: 'U2L5', dir: 'lesson-u2l5', setup: 'u2l5_inertia_tension_buzz_setup.txt', template: 'u2l5-inertia-tension-buzz-assessment-template.html', preview: 'u2l5-inertia-tension-buzz-assessment-template-preview.html', simulation: 'inertia-tension-demo.html', count: 10 },
  { lesson: 'U2H', dir: 'lesson-u2honors', setup: 'u2h_coriolis_cannon_buzz_setup.txt', template: 'u2h-coriolis-cannon-buzz-assessment-template.html', preview: 'u2h-coriolis-cannon-buzz-assessment-template-preview.html', simulation: 'coriolis-effect.html', count: 9 }
];

function fail(message) {
  throw new Error(message);
}

function read(file) {
  return fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
}

function property(block, key) {
  return ((block.match(new RegExp(`^${key}:\\s*(.+)$`, 'm')) || [])[1] || '').trim();
}

function walk(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

for (const item of assessments) {
  const dir = path.join(root, item.dir);
  const questionPath = path.join(dir, 'buzz-assessment-questions.txt');
  const templatePath = path.join(dir, item.template);
  const previewPath = path.join(dir, item.preview);
  const setupPath = path.join(dir, item.setup);
  const questionText = read(questionPath).trim();
  const blocks = questionText.split(/\n\s*\n(?=Type:\s*)/).filter(Boolean);

  if (blocks.length !== item.count) fail(`${item.lesson}: ${blocks.length} questions, expected ${item.count}`);
  let automatic = 0;
  let busybee = 0;
  blocks.forEach((block, index) => {
    const type = property(block, 'Type');
    const score = Number(property(block, 'Score'));
    const promptNumber = Number((block.match(/^(\d+)\)\s/m) || [])[1]);
    if (!type || !Number.isInteger(score)) fail(`${item.lesson} Q${index + 1}: missing Type or integer Score`);
    if (promptNumber !== index + 1) fail(`${item.lesson}: expected prompt ${index + 1}, received ${promptNumber}`);
    if (/^UP\b/.test(type)) fail(`${item.lesson} Q${index + 1}: graded uploads are not allowed`);
    if (/^E\b/.test(type)) {
      busybee += score;
      for (const key of ['Meta-unit', 'Meta-lesson', 'Meta-skill', 'Meta-grading', 'Meta-evidence']) {
        if (!property(block, key)) fail(`${item.lesson} Q${index + 1}: essay missing ${key}`);
      }
      if (property(block, 'Meta-grading') !== 'busybee') fail(`${item.lesson} Q${index + 1}: essay is not assigned to BusyBee`);
      if (!/^@\[Always\]\s+/m.test(block) || !/^a\.\s*Full credit:/m.test(block) || !/Partial credit:/m.test(block) || !/No credit:/m.test(block)) {
        fail(`${item.lesson} Q${index + 1}: incomplete BusyBee rubric text`);
      }
    } else {
      automatic += score;
    }
  });

  if (automatic !== 10 || busybee !== 5) fail(`${item.lesson}: score split is ${automatic} auto + ${busybee} BusyBee`);
  const finalTwo = blocks.slice(-2);
  if (!finalTwo.every((block) => /^E\b/.test(property(block, 'Type'))) || Number(property(finalTwo[0], 'Score')) !== 2 || Number(property(finalTwo[1], 'Score')) !== 3) {
    fail(`${item.lesson}: final two questions must be 2- and 3-point BusyBee essays`);
  }

  const template = read(templatePath);
  const preview = read(previewPath);
  const setup = read(setupPath);
  const slots = (template.match(/<a:question\s*><\/a:question>|<a:question\s*\/>/gi) || []).length;
  const rendered = (preview.match(/class="buzz-preview-question"/g) || []).length;
  if (slots !== item.count || rendered !== item.count) fail(`${item.lesson}: ${slots} slots and ${rendered} rendered questions, expected ${item.count}`);
  if (!/id="buzz-assessment-integrity-guard"/.test(template) || !/\['copy',\s*'cut',\s*'paste',\s*'contextmenu'\]/.test(template)) {
    fail(`${item.lesson}: required copy/paste integrity guard is missing`);
  }

  const networkRefs = [...template.matchAll(/(?:src|href)=["'](https?:\/\/[^"']+)/gi)].map((match) => match[1]);
  if (item.externalPhET) {
    if (!networkRefs.some((url) => /^https:\/\/phet\.colorado\.edu\//.test(url))) fail(`${item.lesson}: intentional PhET dependency is missing`);
    if (networkRefs.some((url) => !/^https:\/\/phet\.colorado\.edu\//.test(url))) fail(`${item.lesson}: unexpected external dependency: ${networkRefs.join(', ')}`);
  } else if (networkRefs.length) {
    fail(`${item.lesson}: template has unexpected external dependencies: ${networkRefs.join(', ')}`);
  }
  if (/<script[^>]+src\s*=|<link[^>]+rel=["']stylesheet/i.test(template)) fail(`${item.lesson}: template has an external script or stylesheet`);
  if (item.lesson === 'U2L4') {
    if (/iframe[^>]+src=["'][^"']+/i.test(template)) fail('U2L4: external iframe source can trigger Buzz authentication');
    if (!template.includes('frame.srcdoc = appSource.replace')) fail('U2L4: self-contained iframe loader is missing');
    if (/password|passcode|teacher.?code/i.test(template)) fail('U2L4: password or unlock code remains');
  }

  [...template.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].forEach((match, index) => {
    try {
      new Function(match[1]);
    } catch (error) {
      fail(`${item.lesson}: template script ${index + 1} does not compile: ${error.message}`);
    }
  });

  if (!setup.includes(`Import the ${item.count} questions`) || !setup.includes('10 auto-graded points plus 5 BusyBee points')) {
    fail(`${item.lesson}: TXT setup guide has stale count or scoring directions`);
  }
  const mission = setup.indexOf('YOUR MISSION');
  const learning = setup.indexOf('WHAT YOU WILL DO AND LEARN');
  const instructions = setup.indexOf('HOW TO COMPLETE THE LAB');
  const teacher = setup.indexOf('TEACHER BUZZ SETUP');
  if (!(mission >= 0 && mission < learning && learning < instructions && instructions < teacher)) {
    fail(`${item.lesson}: setup TXT must lead with mission, learning, and completion directions`);
  }
  if (/<(?:html|body|h[1-6]|p|li|strong|code)\b/i.test(setup)) fail(`${item.lesson}: setup guide contains HTML markup`);
  if (!setup.includes('intentionally blocked by the assessment integrity guard')) fail(`${item.lesson}: setup guide does not document the required integrity block`);

  console.log(`${item.lesson}: ${item.count} questions, 10 auto + 5 BusyBee, integrity guard, template, preview, and TXT setup valid`);
}

const forbidden = walk(root).filter((file) => {
  const relative = path.relative(root, file).replace(/\\/g, '/');
  return /(?:\.zip|rise-before-you-begin\.txt|imsmanifest\.xml|scorm-wrapper\.js)$/i.test(relative)
    || /(?:setup-instructions|_buzz_setup)\.html$/i.test(relative)
    || /hosted-buzz-assessment/i.test(relative)
    || relative === 'lesson-u2l2/index.html';
});
if (forbidden.length) fail(`Obsolete Unit 2 artifacts remain: ${forbidden.map((file) => path.relative(root, file)).join(', ')}`);

const launcher = read(path.join(root, 'index.html'));
for (const item of assessments) {
  for (const file of [item.simulation, 'buzz-assessment-questions.txt', item.setup, item.template, item.preview]) {
    const relative = path.posix.join(item.dir, file);
    if (!launcher.includes(relative)) fail(`${item.lesson}: launcher is missing ${relative}`);
  }
}
for (const match of launcher.matchAll(/href="([^"]+)"/g)) {
  const target = match[1];
  if (/^(?:https?:|#)/.test(target)) continue;
  if (!fs.existsSync(path.resolve(root, target))) fail(`Launcher has missing target: ${target}`);
}

const honorsSource = read(path.join(root, 'lesson-u2honors', 'coriolis-effect.html'));
if (/scorm-wrapper\.js|REPLACE_WITH_HOSTED_SIMULATION_URL/.test(honorsSource)) fail('Honors source still references obsolete packaging or hosted placeholders');
const previewBuilder = read(path.join(workspace, 'unit-buzz-template-conversion-files', 'build-buzz-template-previews.js'));
if (/u2h-coriolis-cannon-hosted/.test(previewBuilder)) fail('Preview builder still contains the obsolete Honors hosted template');
const riseBuilder = read(path.join(workspace, 'unit-ApplicationFiles', 'build-rise-directions.js'));
const riseIndex = read(path.join(workspace, 'unit-ApplicationFiles', 'rise-directions-index.txt'));
if (/unit-2\/lesson-u2/.test(riseBuilder) || /unit-2\/lesson-u2/.test(riseIndex)) fail('Unit 2 application Rise directions are still registered');

const referenceTime = 2.5;
const referenceDistance = 30;
const vx = referenceDistance / referenceTime;
const vy = 9.8 * referenceTime / 2;
const speed = Math.sqrt(vx ** 2 + vy ** 2);
const angle = Math.atan2(vy, vx) * 180 / Math.PI;
const mph = speed * 2.23694;
if (Math.abs(vx - 12) > 0.001 || Math.abs(vy - 12.25) > 0.001 || Math.abs(speed - 17.15) > 0.02 || Math.abs(angle - 45.58) > 0.05 || Math.abs(mph - 38.36) > 0.05) {
  fail('U2L2 fixed reference calculation values changed');
}

console.log('Unit 2 cleanup, launcher dependencies, fixed model values, and build registrations valid.');
