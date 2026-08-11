'use strict';

const fs = require('fs');
const path = require('path');

const root = __dirname;
const workspace = path.resolve(root, '..', '..');
const assessments = [
  { lesson: 'U3L1', dir: 'lesson-1', setup: 'u3l1_phet_forces_buzz_setup.txt', template: 'u3l1-phet-forces-buzz-assessment-template.html', preview: 'u3l1-phet-forces-buzz-assessment-template-preview.html', simulation: 'index.html', count: 10, automaticPoints: 8, busybeeQuestionPoints: [3, 4], externalDependency: 'phet.colorado.edu' },
  { lesson: 'U3L2', dir: 'lesson-2', setup: 'u3l2_golf_club_ct_buzz_setup.txt', template: 'u3l2-golf-club-ct-buzz-assessment-template.html', preview: 'u3l2-golf-club-ct-buzz-assessment-template-preview.html', simulation: 'usga-golfclub-ct-test.html', count: 12, automaticPoints: 10, busybeeQuestionPoints: [2, 3], completedProvidedChart: true },
  { lesson: 'U3L3', dir: 'lesson-3', setup: 'u3l3_friction_force_buzz_setup.txt', template: 'u3l3-friction-force-buzz-assessment-template.html', preview: 'u3l3-friction-force-buzz-assessment-template-preview.html', simulation: 'index.html', count: 12, automaticPoints: 10, busybeeQuestionPoints: [2, 3], completedProvidedChart: true },
  { lesson: 'U3L4', dir: 'lesson-4', setup: 'u3l4_collision_lab_buzz_setup.txt', template: 'u3l4-collision-lab-buzz-assessment-template.html', preview: 'u3l4-collision-lab-buzz-assessment-template-preview.html', simulation: 'collison-lab.html', count: 12, automaticPoints: 10, busybeeQuestionPoints: [2, 3], completedProvidedChart: true },
  { lesson: 'U3L5', dir: 'lesson-5', setup: 'u3l5_impulse_jump_buzz_setup.txt', template: 'u3l5-impulse-jump-buzz-assessment-template.html', preview: 'u3l5-impulse-jump-buzz-assessment-template-preview.html', simulation: 'impulse-jump-lab.html', count: 10, automaticPoints: 8, busybeeQuestionPoints: [3, 4] }
];

function fail(message) { throw new Error(message); }
function read(file) { return fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n'); }
function property(block, key) { return ((block.match(new RegExp(`^${key}:\\s*(.+)$`, 'm')) || [])[1] || '').trim(); }
function scriptBodies(html) {
  const bodies = [];
  const pattern = /<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = pattern.exec(html))) bodies.push(match[1]);
  return bodies;
}
function externalUrls(html) {
  return [...html.matchAll(/(?:src|href)=["'](https?:\/\/[^"']+)/gi)].map((match) => match[1]);
}

function verifyQuestionBank(item, dir) {
  const blocks = read(path.join(dir, 'buzz-assessment-questions.txt')).trim().split(/\n\s*\n(?=Type:\s*)/).filter(Boolean);
  if (blocks.length !== item.count) fail(`${item.lesson}: ${blocks.length} questions, expected ${item.count}`);
  let automatic = 0;
  let busybee = 0;
  blocks.forEach((block, index) => {
    const type = property(block, 'Type');
    const score = Number(property(block, 'Score'));
    const promptNumber = Number((block.match(/^(\d+)\)\s/m) || [])[1]);
    if (!type || !Number.isInteger(score)) fail(`${item.lesson} Q${index + 1}: missing Type or integer Score`);
    if (promptNumber !== index + 1) fail(`${item.lesson}: expected prompt ${index + 1}, received ${promptNumber}`);
    if (/^UP\b/.test(type)) fail(`${item.lesson} Q${index + 1}: upload questions are prohibited`);
    if (property(block, 'Meta-unit') !== 'U3' || property(block, 'Meta-lesson') !== item.lesson || !property(block, 'Meta-skill')) fail(`${item.lesson} Q${index + 1}: incomplete metadata`);

    const isFinal = index >= blocks.length - 2;
    if (isFinal) {
      const expectedScore = item.busybeeQuestionPoints[index - (blocks.length - 2)];
      if (!/^E\b/.test(type) || score !== expectedScore) fail(`${item.lesson} Q${index + 1}: final BusyBee question must be an essay worth ${expectedScore}`);
      if (property(block, 'Meta-grading') !== 'busybee' || !property(block, 'Meta-evidence')) fail(`${item.lesson} Q${index + 1}: incomplete BusyBee routing metadata`);
      if (!/^@\[Always\]\s+/m.test(block) || !/^a\. Full credit:/m.test(block) || !/^\s+Partial credit:/m.test(block) || !/^\s+No credit:/m.test(block)) fail(`${item.lesson} Q${index + 1}: incomplete BusyBee rubric`);
      busybee += score;
    } else {
      if (/^E\b/.test(type)) fail(`${item.lesson} Q${index + 1}: essays must be the final two questions only`);
      if (property(block, 'Meta-grading') !== 'auto') fail(`${item.lesson} Q${index + 1}: automatic question lacks Meta-grading: auto`);
      if (/^MC\b/.test(type) && (block.match(/^\*[a-z]\./gm) || []).length !== 1) fail(`${item.lesson} Q${index + 1}: MC question must have exactly one starred answer`);
      if (/^F,\s*Number\b/.test(type) && !/^a\.\s*.+/m.test(block)) fail(`${item.lesson} Q${index + 1}: numeric question lacks an answer key`);
      automatic += score;
    }
  });
  if (automatic !== item.automaticPoints || busybee !== 15 - item.automaticPoints) fail(`${item.lesson}: score split is ${automatic} automatic + ${busybee} BusyBee, expected ${item.automaticPoints} + ${15 - item.automaticPoints}`);
}

function verifyHtml(item, dir) {
  const template = read(path.join(dir, item.template));
  const preview = read(path.join(dir, item.preview));
  const slots = (template.match(/<a:question\s*><\/a:question>|<a:question\s*\/>/gi) || []).length;
  const rendered = (preview.match(/data-buzz-preview-question=/g) || []).length;
  if (slots !== item.count) fail(`${item.lesson}: ${slots} template slots, expected ${item.count}`);
  if (rendered !== item.count) fail(`${item.lesson}: ${rendered} preview questions, expected ${item.count}`);
  if (!template.includes('id="buzz-assessment-integrity-guard"') || !preview.includes('id="buzz-assessment-integrity-guard"')) fail(`${item.lesson}: template or preview is missing the integrity guard`);
  for (const action of ['copy', 'cut', 'paste', 'contextmenu']) if (!template.includes(`'${action}'`)) fail(`${item.lesson}: integrity guard does not block ${action}`);
  if (/scorm-wrapper\.js|window\.SCORM|\bSCORM\./i.test(template)) fail(`${item.lesson}: template still contains SCORM delivery code`);

  const urls = externalUrls(template);
  if (!item.externalDependency && urls.length) fail(`${item.lesson}: external template dependency detected: ${urls[0]}`);
  if (item.externalDependency) {
    if (!urls.length) fail(`${item.lesson}: intended PhET dependency is missing`);
    for (const url of urls) if (!new URL(url).hostname.endsWith(item.externalDependency)) fail(`${item.lesson}: unexpected external dependency: ${url}`);
  }
  scriptBodies(template).forEach((script, index) => {
    try { new Function(script); } catch (error) { fail(`${item.lesson}: template inline script ${index + 1} does not compile: ${error.message}`); }
  });
}

function verifyGeneratedFiles(item, dir) {
  for (const required of [item.setup, 'busybee-rubric-metadata.json', 'lab-format-suggestions.txt', item.simulation]) {
    if (!fs.existsSync(path.join(dir, required))) fail(`${item.lesson}: missing ${required}`);
  }
  for (const prohibited of ['setup-instructions.html', 'rise-before-you-begin.txt', 'imsmanifest.xml', 'scorm-wrapper.js']) {
    if (fs.existsSync(path.join(dir, prohibited))) fail(`${item.lesson}: prohibited legacy file remains: ${prohibited}`);
  }
  const setup = read(path.join(dir, item.setup));
  if (!setup.includes('YOUR MISSION') || !setup.includes('WHAT YOU WILL DO AND LEARN') || !setup.includes('HOW TO COMPLETE THE LAB')) fail(`${item.lesson}: TXT setup guide is missing its student-first sections`);
  if (!setup.includes(`${item.automaticPoints} auto-graded points plus ${15 - item.automaticPoints} BusyBee points`) || !setup.includes('No file upload earns or replaces points')) fail(`${item.lesson}: TXT setup scoring instructions are incorrect`);
  if (item.completedProvidedChart && !setup.includes('students complete a provided data or measurement chart')) fail(`${item.lesson}: chart scoring explanation is missing`);
  if (!item.completedProvidedChart && !setup.includes('do not fill a provided chart')) fail(`${item.lesson}: non-chart scoring explanation is missing`);

  const metadata = JSON.parse(read(path.join(dir, 'busybee-rubric-metadata.json')));
  const settings = metadata.assessmentSettings || {};
  if (settings.totalPoints !== 15 || settings.automaticPoints !== item.automaticPoints || settings.busybeePoints !== 15 - item.automaticPoints) fail(`${item.lesson}: metadata score settings are incorrect`);
  if (!Array.isArray(settings.requiredUploads) || settings.requiredUploads.length) fail(`${item.lesson}: metadata still requires an upload`);
  if ((item.automaticPoints === 10) !== (settings.completedProvidedChart === true)) fail(`${item.lesson}: 10 automatic points must be reserved for a completed provided chart`);
  const busybee = (metadata.questions || []).filter((question) => question.grading === 'busybee');
  if (busybee.length !== 2 || busybee[0].points !== item.busybeeQuestionPoints[0] || busybee[1].points !== item.busybeeQuestionPoints[1]) fail(`${item.lesson}: metadata has the wrong final BusyBee point values`);
}

function verifyStandalone(item, dir) {
  const html = read(path.join(dir, item.simulation));
  if (/scorm-wrapper\.js|window\.SCORM|\bSCORM\./i.test(html)) fail(`${item.lesson}: standalone still contains SCORM delivery code`);
  const urls = externalUrls(html);
  if (!item.externalDependency && urls.length) fail(`${item.lesson}: standalone has an unexpected external dependency: ${urls[0]}`);
  if (item.externalDependency) for (const url of urls) if (!new URL(url).hostname.endsWith(item.externalDependency)) fail(`${item.lesson}: standalone has an unexpected external dependency: ${url}`);
  scriptBodies(html).forEach((script, index) => {
    try { new Function(script); } catch (error) { fail(`${item.lesson}: standalone inline script ${index + 1} does not compile: ${error.message}`); }
  });
}

for (const item of assessments) {
  const dir = path.join(root, item.dir);
  verifyQuestionBank(item, dir);
  verifyHtml(item, dir);
  verifyGeneratedFiles(item, dir);
  verifyStandalone(item, dir);
  console.log(`ok: ${item.lesson} (${item.count} questions, ${item.automaticPoints} automatic + ${15 - item.automaticPoints} BusyBee)`);
}

const expectedDirs = new Set(assessments.map((item) => item.dir));
const actualDirs = fs.readdirSync(root, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name);
for (const dir of actualDirs) if (!expectedDirs.has(dir)) fail(`Unexpected Unit 3 application folder remains: ${dir}`);
for (const dir of expectedDirs) if (!actualDirs.includes(dir)) fail(`Canonical Unit 3 application folder is missing: ${dir}`);

const zipFiles = fs.readdirSync(root).filter((name) => /\.zip$/i.test(name));
if (zipFiles.length) fail(`Application ZIP files remain: ${zipFiles.join(', ')}`);

const launcher = read(path.join(root, 'index.html'));
const targets = [...launcher.matchAll(/data-(?:sim|buzz)-href="([^"]+)"/g)].map((match) => match[1]);
if (targets.length !== 10) fail(`Launcher exposes ${targets.length} simulation/preview targets, expected 10`);
for (const target of targets) if (!fs.existsSync(path.resolve(root, target))) fail(`Launcher target does not resolve: ${target}`);
const homeHref = ((launcher.match(/class="home-btn"\s+href="([^"]+)"/) || [])[1] || '');
if (!homeHref || !fs.existsSync(path.resolve(root, homeHref))) fail(`Launcher Home link does not resolve: ${homeHref || '(missing)'}`);
if (/lesson-u3l5|SCORM 1\.2|setup-instructions\.html/.test(launcher)) fail('Launcher still references a retired Unit 3 path or delivery artifact');

for (const item of assessments) {
  const dir = path.join(root, item.dir);
  for (const name of fs.readdirSync(dir).filter((entry) => /\.html$/i.test(entry))) {
    const file = path.join(dir, name);
    const html = read(file);
    for (const match of html.matchAll(/\b(?:src|href)=["']([^"']+)["']/gi)) {
      const target = match[1].trim().split('#')[0].split('?')[0];
      if (!target || /^(?:https?:|data:|blob:|mailto:|javascript:|#)/i.test(target) || /[{}<>]/.test(target)) continue;
      const resolved = path.resolve(path.dirname(file), decodeURIComponent(target));
      if (!fs.existsSync(resolved)) fail(`${path.relative(workspace, file)} has a missing local target: ${target}`);
    }
  }
}

const riseBuilder = read(path.join(workspace, 'unit-ApplicationFiles', 'build-rise-directions.js'));
const riseIndex = read(path.join(workspace, 'unit-ApplicationFiles', 'rise-directions-index.txt'));
if (/unit-3\//.test(riseBuilder) || /unit-3\//.test(riseIndex)) fail('Unit 3 still appears in the Rise directions registry');
const previewBuilder = read(path.join(workspace, 'unit-buzz-template-conversion-files', 'build-buzz-template-previews.js'));
if (!previewBuilder.includes("dir: 'unit-ApplicationFiles/unit-3/lesson-5'")) fail('Preview builder does not use the canonical Lesson 5 folder');
if (/unit-3\/lesson-u3l5/.test(previewBuilder)) fail('Preview builder still references lesson-u3l5');

for (const script of [path.join(root, 'lesson-2', 'build-buzz-template.js'), path.join(root, 'build-unit3-buzz-assessments.js')]) {
  try { new Function(read(script)); } catch (error) { fail(`${path.relative(workspace, script)} does not compile: ${error.message}`); }
}

console.log('Unit 3 validation passed: five canonical applications, chart-dependent scoring, native Buzz delivery, no application ZIPs, uploads, Rise files, or SCORM packages.');
