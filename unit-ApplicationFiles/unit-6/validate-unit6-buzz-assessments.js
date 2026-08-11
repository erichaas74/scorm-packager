const fs = require('fs');
const path = require('path');

const root = __dirname;
const assessments = [
  { lesson: 'U6L1', dir: 'millikan-oil-drop-investigation', questions: 'buzz-assessment-questions.txt', template: 'u6l1-millikan-buzz-assessment-template.html', preview: 'u6l1-millikan-buzz-assessment-template-preview.html', count: 10 },
  { lesson: 'U6L2', dir: '.', questions: 'dynamic_electric_field_buzz_questions.txt', template: 'dynamic_electric_field_lab.html', preview: 'dynamic_electric_field_lab_preview.html', count: 8 },
  { lesson: 'U6L3', dir: 'circuit-design-challenge', questions: 'buzz-assessment-questions.txt', template: 'u6l3-circuit-design-buzz-assessment-template.html', preview: 'u6l3-circuit-design-buzz-assessment-template-preview.html', count: 10 },
  { lesson: 'U6L4', dir: '.', questions: 'electromagnet_buzz_questions.txt', template: 'electromagnet_lab.html', preview: 'electromagnet_lab_preview.html', count: 10 },
  { lesson: 'U6L5', dir: 'generator-design-challenge', questions: 'buzz-assessment-questions.txt', template: 'u6l5-generator-buzz-assessment-template.html', preview: 'u6l5-generator-buzz-assessment-template-preview.html', count: 10 },
  { lesson: 'U6H', dir: 'honors-electric-motor-engineering-challenge', questions: 'buzz-assessment-questions.txt', template: 'u6h-motor-buzz-assessment-template.html', preview: 'u6h-motor-buzz-assessment-template-preview.html', count: 10 }
];

function fail(message) { throw new Error(message); }
function read(file) { return fs.readFileSync(file, 'utf8'); }
function approx(actual, expected, tolerance, label) {
  if (Math.abs(actual - expected) > tolerance) fail(`${label}: expected ${expected}, received ${actual}`);
}

for (const item of assessments) {
  const dir = path.join(root, item.dir);
  const questionText = read(path.join(dir, item.questions)).replace(/\r\n/g, '\n').trim();
  const blocks = questionText.split(/\n\s*\n(?=Type:\s*)/).filter(Boolean);
  if (blocks.length !== item.count) fail(`${item.lesson}: ${blocks.length} question blocks, expected ${item.count}`);

  let automatic = 0;
  let busybee = 0;
  blocks.forEach((block, index) => {
    const type = (block.match(/^Type:\s*(.+)$/m) || [])[1];
    const score = Number((block.match(/^Score:\s*([0-9.]+)$/m) || [])[1]);
    if (!type || !Number.isFinite(score)) fail(`${item.lesson} Q${index + 1}: missing Type or Score`);
    if (/^E\b/.test(type)) {
      busybee += score;
      if (!/^Meta-grading:\s*busybee$/m.test(block)) fail(`${item.lesson} Q${index + 1}: essay missing BusyBee metadata`);
    } else {
      automatic += score;
    }
  });
  if (automatic !== 10 || busybee !== 5) fail(`${item.lesson}: score split is ${automatic} auto + ${busybee} BusyBee`);
  if (!/^Type:\s*E\b/m.test(blocks[blocks.length - 2]) || !/^Type:\s*E\b/m.test(blocks[blocks.length - 1])) fail(`${item.lesson}: final two questions must be essays`);

  const templateText = read(path.join(dir, item.template));
  const previewText = read(path.join(dir, item.preview));
  const slots = (templateText.match(/<a:question\s*><\/a:question>|<a:question\s*\/>/gi) || []).length;
  if (slots !== item.count) fail(`${item.lesson}: ${slots} template slots, expected ${item.count}`);
  if (/<script[^>]+src\s*=|<link[^>]+rel=["']stylesheet/i.test(templateText)) fail(`${item.lesson}: template is not self-contained`);
  if (/buzz-assessment-integrity-guard|preventDefault\(\).*contextmenu/i.test(templateText)) fail(`${item.lesson}: accessibility-blocking integrity guard remains`);
  if (!previewText.includes('class="buzz-preview-question"')) fail(`${item.lesson}: preview questions were not rendered`);

  const scripts = [...templateText.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
  scripts.forEach((match, index) => {
    try { new Function(match[1]); } catch (error) { fail(`${item.lesson}: script ${index + 1} does not compile: ${error.message}`); }
  });

  console.log(`${item.lesson}: ${item.count} questions, 10 auto + 5 BusyBee, template and preview valid`);
}

// Fixed model-value checks used by the auto-graded questions.
approx(200 / 100, 2, 1e-9, 'Millikan 100 V relative charge');
approx(3 * 1.602e-19, 4.806e-19, 1e-22, 'Millikan 3e charge');
approx(9 / 10, 0.9, 1e-9, 'Single-bulb current');
approx(9 / 20, 0.45, 1e-9, 'Two-bulb series current');
approx(2 * (9 / 10), 1.8, 1e-9, 'Two-bulb parallel current');

function generatorPeak(flow, magnet, loops, area) {
  const load = (loops / 4) * (magnet / 100) * (area / 100);
  const rpm = (flow / 100) * 120 / (1 + 0.35 * load);
  const flux = 0.322 * (magnet / 100) * (area / 100);
  return loops * flux * (rpm * Math.PI / 30);
}
approx(generatorPeak(100, 60, 2, 70), 3.166, 0.01, 'Generator specified-setting peak EMF');
approx(generatorPeak(100, 100, 4, 100), 11.99, 0.02, 'Generator maximum-setting peak EMF');

function electromagnet(config) {
  const wire = config.turns * Math.PI * (config.diameter / 10);
  const wireResistance = wire * 0.04;
  const voltage = config.wiring === 'series' ? config.batteries * 1.5 : 1.5;
  const internalResistance = config.wiring === 'series' ? config.batteries * 0.5 : 0.5 / config.batteries;
  const current = voltage / (wireResistance + internalResistance);
  const multiplier = config.core === 'iron' ? 12 : 1;
  return { current, strength: Math.floor((config.turns * current * multiplier * (config.diameter / 8)) / 3) };
}
const em1 = electromagnet({ turns: 20, diameter: 10, core: 'iron', batteries: 1, wiring: 'series' });
const em2 = electromagnet({ turns: 40, diameter: 10, core: 'iron', batteries: 1, wiring: 'series' });
const em3 = electromagnet({ turns: 20, diameter: 10, core: 'air', batteries: 1, wiring: 'series' });
const em4 = electromagnet({ turns: 20, diameter: 10, core: 'iron', batteries: 2, wiring: 'series' });
const em5 = electromagnet({ turns: 20, diameter: 10, core: 'iron', batteries: 2, wiring: 'parallel' });
approx(em1.current, 0.5, 0.01, 'Electromagnet Trial 1 current');
approx(em2.current, 0.27, 0.01, 'Electromagnet Trial 2 current');
if (em3.strength !== 4 || em4.strength !== 85 || em5.strength !== 54) fail('Electromagnet fixed lifting values changed');
approx(1.05 + 0.022 * 30 * (2 / 2), 1.71, 1e-9, 'Motor default winding resistance');

const launcher = read(path.join(root, 'index.html'));
for (const href of launcher.matchAll(/href="([^"]+)"/g)) {
  const target = href[1];
  if (/^(?:https?:|#)/.test(target)) continue;
  const localTarget = path.resolve(root, target);
  if (!fs.existsSync(localTarget)) fail(`Launcher has missing target: ${target}`);
}

console.log('Model values and Unit 6 launcher links valid.');
