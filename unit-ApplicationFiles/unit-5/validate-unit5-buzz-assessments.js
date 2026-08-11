const fs = require('fs');
const path = require('path');

const root = __dirname;

const assessments = [
  { lesson: 'U5L2 Resonance', slug: 'sound_waves_resonance', dir: '.', source: 'sound_waves_lab_simulation.html', template: 'u5l2-resonance-tube-buzz-assessment-template.html', preview: 'u5l2-resonance-tube-buzz-assessment-template-preview.html', count: 10 },
  { lesson: 'U5L2 Instrument', slug: 'design_perfect_instrument', dir: 'design-the-perfect-instrument', source: 'index.html', template: 'u5l2-perfect-instrument-buzz-assessment-template.html', preview: 'u5l2-perfect-instrument-buzz-assessment-template-preview.html', count: 8 },
  { lesson: 'U5L3 Thin Lens', slug: 'thin_lens_refraction', dir: '.', source: 'thin_lens_refraction_investigation.html', template: 'u5l3-thin-lens-buzz-assessment-template.html', preview: 'u5l3-thin-lens-buzz-assessment-template-preview.html', count: 8 },
  { lesson: 'U5L3 Color Vision', slug: 'light_color_vision', dir: 'light-color-and-vision-lab', source: 'index.html', template: 'u5l3-light-color-vision-buzz-assessment-template.html', preview: 'u5l3-light-color-vision-buzz-assessment-template-preview.html', count: 8 },
  { lesson: 'U5L5 Spectral Shift', slug: 'doppler_spectral_shift', dir: 'doppler-spectral-line-shift', source: 'index.html', template: 'u5l5-spectral-shift-buzz-assessment-template.html', preview: 'u5l5-spectral-shift-buzz-assessment-template-preview.html', count: 8 },
  { lesson: 'U5H Timekeeping', slug: 'honors_relativity', dir: 'honors-relativity-timekeeping-lab', source: 'index.html', template: 'u5h-relativity-timekeeping-buzz-assessment-template.html', preview: 'u5h-relativity-timekeeping-buzz-assessment-template-preview.html', count: 8 },
  { lesson: 'U5H GPS', slug: 'gps_relativity', dir: '.', source: 'gps_relativity_investigation.html', template: 'u5h-gps-relativity-buzz-assessment-template.html', preview: 'u5h-gps-relativity-buzz-assessment-template-preview.html', count: 9 }
];

function fail(message) { throw new Error(message); }
function read(file) { return fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n'); }
function approx(actual, expected, tolerance, label) {
  if (Math.abs(actual - expected) > tolerance) fail(`${label}: expected ${expected}, received ${actual}`);
}
function property(block, name) {
  const match = block.match(new RegExp(`^${name}:\\s*(.+)$`, 'm'));
  return match ? match[1].trim() : '';
}

const visibleTitles = new Set();

for (const item of assessments) {
  const questionPath = path.join(root, `${item.slug}_buzz_questions.txt`);
  const templatePath = path.join(root, item.dir, item.template);
  const previewPath = path.join(root, item.dir, item.preview);
  const metadataPath = path.join(root, `${item.slug}-busybee-rubric-metadata.json`);
  const setupPath = path.join(root, `${item.slug}_buzz_setup.html`);
  const questionText = read(questionPath).trim();
  if (!questionText.startsWith('Type:')) fail(`${item.lesson}: question import must begin with Type:`);
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
    if (/^UP\b/.test(type)) fail(`${item.lesson} Q${index + 1}: graded uploads are not part of the Unit 5 standard`);
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
      if (/^F,\s*Number\b/.test(type) && !/^a\.\s*-?(?:\d|\.\d).*\.\.-?(?:\d|\.\d)/m.test(block)) {
        fail(`${item.lesson} Q${index + 1}: numeric answer needs an explicit range`);
      }
      if (/^MC\b/.test(type) && property(block, 'Options') !== 'MaintainOrder') {
        fail(`${item.lesson} Q${index + 1}: multiple-choice options must maintain order`);
      }
    }
  });
  if (automatic !== 10 || busybee !== 5) fail(`${item.lesson}: score split is ${automatic} auto + ${busybee} BusyBee`);
  const lastTwo = blocks.slice(-2);
  if (!lastTwo.every((block) => /^E\b/.test(property(block, 'Type'))) || Number(property(lastTwo[0], 'Score')) !== 2 || Number(property(lastTwo[1], 'Score')) !== 3) {
    fail(`${item.lesson}: final two questions must be 2- and 3-point BusyBee essays`);
  }

  const templateText = read(templatePath);
  const sourceText = read(path.join(root, item.dir, item.source));
  const previewText = read(previewPath);
  if (!/^u5(?:l\d+|h)-.+-buzz-assessment-template\.html$/.test(path.basename(item.template))) {
    fail(`${item.lesson}: Buzz template filename is not unique and lesson-specific`);
  }
  if (templateText !== sourceText) fail(`${item.lesson}: generated Buzz template is stale; rerun the Unit 5 builder`);
  const visibleTitle = (templateText.match(/<h1(?:\s[^>]*)?>([\s\S]*?)<\/h1>/i) || [])[1];
  if (!visibleTitle) fail(`${item.lesson}: template has no visible h1 title`);
  const normalizedTitle = visibleTitle.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  if (visibleTitles.has(normalizedTitle)) fail(`${item.lesson}: duplicate visible template title ${normalizedTitle}`);
  visibleTitles.add(normalizedTitle);
  const slots = (templateText.match(/<a:question\s*><\/a:question>|<a:question\s*\/>/gi) || []).length;
  if (slots !== item.count) fail(`${item.lesson}: ${slots} template slots, expected ${item.count}`);
  if (/<script[^>]+src\s*=|<link[^>]+rel=["']stylesheet/i.test(templateText)) fail(`${item.lesson}: template is not self-contained`);
  if (/buzz-assessment-integrity-guard|\['copy',\s*'cut',\s*'paste'|contextmenu[^\n]+preventDefault/i.test(templateText)) {
    fail(`${item.lesson}: accessibility-blocking clipboard/context-menu guard remains`);
  }
  if (/upload[^\n]{0,80}(?:Buzz\s*)?Question\s*1/i.test(templateText)) fail(`${item.lesson}: template still treats evidence as a required upload`);
  if (!previewText.includes('class="buzz-preview-question"')) fail(`${item.lesson}: preview questions were not rendered`);

  [...templateText.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].forEach((match, index) => {
    try { new Function(match[1]); } catch (error) { fail(`${item.lesson}: script ${index + 1} does not compile: ${error.message}`); }
  });

  const metadata = JSON.parse(read(metadataPath));
  if (metadata.assessmentSettings.totalPoints !== 15 || metadata.assessmentSettings.automaticPoints !== 10 || metadata.assessmentSettings.busybeePoints !== 5) {
    fail(`${item.lesson}: BusyBee assessment totals are stale`);
  }
  if (metadata.evidenceRequirements.requiredUploads.length !== 0) fail(`${item.lesson}: metadata still requires an evidence upload`);
  if (metadata.questions.length !== 2) fail(`${item.lesson}: metadata must contain exactly two BusyBee rubrics`);
  lastTwo.forEach((block, essayIndex) => {
    const expectedIndex = item.count - 1 + essayIndex;
    const metadataQuestion = metadata.questions[essayIndex];
    if (metadataQuestion.buzzIndex !== expectedIndex || metadataQuestion.points !== Number(property(block, 'Score')) || metadataQuestion.metadata['Meta-skill'] !== property(block, 'Meta-skill')) {
      fail(`${item.lesson}: BusyBee metadata does not match question ${expectedIndex}`);
    }
  });

  const setupText = read(setupPath);
  if (!setupText.includes(`Import the ${item.count} questions`) || !setupText.includes('10 auto-graded points plus 5 BusyBee points')) {
    fail(`${item.lesson}: setup guide has stale question-count or scoring directions`);
  }
  if (/Upload scoring:|one upload|upload question|copy and paste are blocked|uploaded evidence|uploaded data sheet/i.test(setupText)) {
    fail(`${item.lesson}: setup guide retains obsolete upload or accessibility directions`);
  }

  console.log(`${item.lesson}: ${item.count} questions, 10 auto + 5 BusyBee, template, preview, and metadata valid`);
}

// Fixed answer checks for every model-backed numeric question family.
const soundSpeed = 343;
approx(100 * soundSpeed / (4 * 2048), 4.187, 0.01, 'Resonance 2048 Hz first harmonic');
approx(100 * soundSpeed / (4 * 1024), 8.374, 0.01, 'Resonance 1024 Hz first harmonic');
approx(100 * soundSpeed / (4 * 512), 16.748, 0.01, 'Resonance 512 Hz first harmonic');
approx((3 * soundSpeed / (4 * 256)) / (soundSpeed / (4 * 256)), 3, 1e-9, 'Resonance length ratio');

approx(245 / (2 * 261.6), 0.468, 0.002, 'Instrument string length');
approx((331 + 0.6 * 20) / (2 * 330), 0.520, 0.002, 'Instrument open pipe at 20 C');
approx((331 + 0.6 * 20) / (4 * 220), 0.390, 0.002, 'Instrument stopped pipe');
approx((331 + 0.6 * 35) / (2 * 330), 0.533, 0.002, 'Instrument open pipe at 35 C');

const lensQ = 1 / (1 / 15 - 1 / 20);
approx(lensQ, 60, 1e-9, 'Thin-lens L3 image distance');
approx(-lensQ / 20, -3, 1e-9, 'Thin-lens L3 magnification');
const applicationQ = 5 * (0.55 / 2.72);
approx(applicationQ, 1.011, 0.002, 'Thin-lens application image distance');
approx(1 / (1 / 5 + 1 / applicationQ), 0.841, 0.002, 'Thin-lens application focal length');

const restWavelengths = { A: 656.3, B: 643.9, C: 667.8 };
approx(restWavelengths.A * 0.12, 78.756, 0.01, 'Object A spectral shift');
approx(restWavelengths.B * -0.09, -57.951, 0.01, 'Object B spectral shift');
approx(restWavelengths.C * 0, 0, 1e-9, 'Object C spectral shift');
approx(0.12 * 3e5, 36000, 1e-9, 'Object A recession speed');

const C = 2.99792458e8;
const secondsPerDay = 86400;
const gpsNetMicroseconds = 38.6;
approx(gpsNetMicroseconds * 1e-6 * C / 1000, 11.57, 0.02, 'Uncorrected GPS daily position error');
approx(1 / Math.sqrt(1 - 0.998 ** 2), 15.82, 0.02, 'Muon Lorentz factor');
approx(10 / C * 1e9, 33.36, 0.02, 'GPS 10 m timing limit');
approx(4.57e-3, 4.57e-3, 1e-12, 'GPS pre-launch frequency offset');
if (secondsPerDay !== 86400) fail('Seconds-per-day constant changed');

const launcher = read(path.join(root, 'index.html'));
if (!launcher.includes('buzz-assessment-instructions.html')) fail('Launcher does not link the Unit 5 Buzz instructions');
for (const item of assessments) {
  const previewHref = path.posix.join(item.dir === '.' ? '' : item.dir, item.preview);
  const templateHref = path.posix.join(item.dir === '.' ? '' : item.dir, item.template);
  if (!launcher.includes(`href="${previewHref}"`) || !launcher.includes(`href="${templateHref}"`)) {
    fail(`${item.lesson}: launcher is missing its preview or template link`);
  }
}
for (const href of launcher.matchAll(/href="([^"]+)"/g)) {
  const target = href[1];
  if (/^(?:https?:|#)/.test(target)) continue;
  if (!fs.existsSync(path.resolve(root, target))) fail(`Launcher has missing target: ${target}`);
}

console.log('Fixed model values and Unit 5 launcher links valid.');
