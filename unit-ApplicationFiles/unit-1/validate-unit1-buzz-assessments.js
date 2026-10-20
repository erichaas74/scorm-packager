'use strict';

const fs = require('fs');
const path = require('path');

const root = __dirname;
const workspace = path.resolve(root, '..', '..');
const assessments = [
  { lesson: 'U1L1', dir: 'lesson-1', setup: 'u1l1_motion_graphs_buzz_setup.txt', template: 'u1l1-motion-graphs-buzz-assessment-template.html', preview: 'u1l1-motion-graphs-buzz-assessment-template-preview.html', simulation: 'index.html', applicationAssignment: true, completionQuestionCount: 15, count: 0, automaticPoints: 15, busybeeQuestionPoints: [] },
  { lesson: 'U1L2', dir: 'lesson-2', setup: 'u1l2_city_blocks_buzz_setup.txt', template: 'u1l2-city-blocks-buzz-assessment-template.html', preview: 'u1l2-city-blocks-buzz-assessment-template-preview.html', simulation: 'index.html', count: 10, automaticPoints: 8, busybeeQuestionPoints: [3, 4] },
  { lesson: 'U1L3', dir: 'lesson-3', setup: 'u1l3_galileo_buzz_setup.txt', template: 'u1l3-galileo-buzz-assessment-template.html', preview: 'u1l3-galileo-buzz-assessment-template-preview.html', simulation: 'index.html', count: 11, automaticPoints: 10, completedProvidedChart: true, busybeeQuestionPoints: [2, 3] },
  { lesson: 'U1L4', dir: 'lesson-4', setup: 'u1l4_reaction_time_buzz_setup.txt', template: 'u1l4-reaction-time-buzz-assessment-template.html', preview: 'u1l4-reaction-time-buzz-assessment-template-preview.html', simulation: 'index.html', count: 10, automaticPoints: 8, busybeeQuestionPoints: [3, 4] },
  { lesson: 'U1L5', dir: 'lesson-5', setup: 'u1l5_skydiver_buzz_setup.txt', template: 'u1l5-skydiver-buzz-assessment-template.html', preview: 'u1l5-skydiver-buzz-assessment-template-preview.html', simulation: 'sky-dive-lab.html', count: 10, automaticPoints: 8, busybeeQuestionPoints: [3, 4] },
  { lesson: 'U1H', dir: 'lesson-honors', setup: 'u1h_rocket_launch_buzz_setup.txt', template: 'u1h-rocket-launch-buzz-assessment-template.html', preview: 'u1h-rocket-launch-buzz-assessment-template-preview.html', simulation: 'index.html', count: 10, totalPoints: 15, automaticPoints: 8, busybeeQuestionPoints: [3, 4] }
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

function scriptBodies(html) {
  const bodies = [];
  const pattern = /<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = pattern.exec(html))) bodies.push(match[1]);
  return bodies;
}

function verifyQuestionBank(item, dir) {
  const questionSource = read(path.join(dir, 'buzz-assessment-questions.txt')).trim();
  if (item.applicationAssignment) {
    if (/^Type:\s*/m.test(questionSource) || /^\d+\)\s+/m.test(questionSource)) fail(`${item.lesson}: native Buzz questions remain in the application assignment`);
    return;
  }
  const blocks = questionSource.split(/\n\s*\n(?=Type:\s*)/).filter(Boolean);
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

    const isFinal = index >= blocks.length - item.busybeeQuestionPoints.length;
    if (isFinal) {
      const expectedScore = item.busybeeQuestionPoints[index - (blocks.length - item.busybeeQuestionPoints.length)];
      if (!/^E\b/.test(type) || score !== expectedScore) fail(`${item.lesson} Q${index + 1}: final BusyBee question must be an essay worth ${expectedScore}`);
      if (property(block, 'Meta-grading') !== 'busybee') fail(`${item.lesson} Q${index + 1}: final essay is not assigned to BusyBee`);
      for (const key of ['Meta-unit', 'Meta-lesson', 'Meta-skill', 'Meta-evidence']) {
        if (!property(block, key)) fail(`${item.lesson} Q${index + 1}: missing ${key}`);
      }
      if (!/^@\[Always\]\s+/m.test(block) || !/^a\. Full credit:/m.test(block) || !/^\s+Partial credit:/m.test(block) || !/^\s+No credit:/m.test(block)) {
        fail(`${item.lesson} Q${index + 1}: incomplete BusyBee rubric`);
      }
      busybee += score;
    } else {
      if (/^E\b/.test(type)) fail(`${item.lesson} Q${index + 1}: essays must be in the final BusyBee question group`);
      if (property(block, 'Meta-grading') !== 'auto') fail(`${item.lesson} Q${index + 1}: automatic question lacks Meta-grading: auto`);
      if (/^MC\b/.test(type) && (block.match(/^\*[a-z]\./gm) || []).length !== 1) fail(`${item.lesson} Q${index + 1}: MC question must have exactly one starred answer`);
      if (/^F,\s*Number\b/.test(type) && !/^a\.\s*.+/m.test(block)) fail(`${item.lesson} Q${index + 1}: numeric question lacks an answer key`);
      automatic += score;
    }
  });

  if (automatic !== item.automaticPoints || busybee !== (item.totalPoints || 15) - item.automaticPoints) fail(`${item.lesson}: score split is ${automatic} automatic + ${busybee} BusyBee, expected ${item.automaticPoints} + ${(item.totalPoints || 15) - item.automaticPoints}`);
}

function verifyHtml(item, dir) {
  const templatePath = path.join(dir, item.template);
  const previewPath = path.join(dir, item.preview);
  const template = read(templatePath);
  const preview = read(previewPath);
  const slots = (template.match(/<a:question\s*><\/a:question>|<a:question\s*\/>/gi) || []).length;
  const rendered = (preview.match(/data-buzz-preview-question=/g) || []).length;
  if (item.applicationAssignment) {
    if (slots !== 0 || rendered !== 0 || /<a:question\b/i.test(template)) fail(`${item.lesson}: application assignment still contains native Buzz questions`);
    if (template !== preview) fail(`${item.lesson}: application assignment preview is stale`);
    if ((template.match(/<!DOCTYPE html>/gi) || []).length !== 1) fail(`${item.lesson}: assignment template contains duplicated document markup`);
    if (!template.includes('data-buzz-assignment="completion-1-15"')) fail(`${item.lesson}: missing assignment completion marker`);
    if (!template.includes('id="embedded-tailwind"') || !template.includes('id="embedded-motion-graphs-application"')) fail(`${item.lesson}: assignment template is not fully embedded`);
    if (!template.includes('const CORE_QUESTION_COUNT = 15') || !template.includes('const BONUS_QUESTION_COUNT = 5')) fail(`${item.lesson}: assignment question counts are incorrect`);
    const templateMarkup = template.replace(/<script(?:\s[^>]*)?>[\s\S]*?<\/script>/gi, '<script></script>');
    if (/<script[^>]+src\s*=|<link[^>]+rel=["']stylesheet/i.test(templateMarkup) || /<(?:script|img|iframe|link)\b[^>]*(?:src|href)=["']https?:\/\//i.test(templateMarkup) || /@import\s+url\(/i.test(templateMarkup)) fail(`${item.lesson}: assignment template has an external dependency`);
    const applicationScript = (template.match(/<script\s+id=["']embedded-motion-graphs-application["'][^>]*>([\s\S]*?)<\/script>/i) || [])[1];
    if (!applicationScript) fail(`${item.lesson}: embedded application script is missing`);
    try { new Function(applicationScript); } catch (error) { fail(`${item.lesson}: embedded application script does not compile: ${error.message}`); }
    return;
  }
  if (slots !== item.count) fail(`${item.lesson}: ${slots} template slots, expected ${item.count}`);
  if (rendered !== item.count) fail(`${item.lesson}: ${rendered} preview questions, expected ${item.count}`);
  if (!template.includes('id="buzz-assessment-integrity-guard"')) fail(`${item.lesson}: template missing integrity guard`);
  if (!preview.includes('id="buzz-assessment-integrity-guard"')) fail(`${item.lesson}: preview missing integrity guard`);
  for (const action of ['copy', 'cut', 'paste', 'contextmenu']) {
    if (!template.includes(`'${action}'`)) fail(`${item.lesson}: integrity guard does not block ${action}`);
  }
  if (/(?:src|href)=["']https?:\/\//i.test(template) || /@import\s+url\(["']?https?:\/\//i.test(template)) fail(`${item.lesson}: template has an external dependency`);
  if (/scorm-wrapper\.js/i.test(template)) fail(`${item.lesson}: template still references a SCORM wrapper`);
  scriptBodies(template).forEach((script, index) => {
    try { new Function(script); } catch (error) { fail(`${item.lesson}: template inline script ${index + 1} does not compile: ${error.message}`); }
  });
}

function verifyGeneratedFiles(item, dir) {
  const requiredFiles = [item.setup, 'busybee-rubric-metadata.json', 'lab-format-suggestions.txt', item.simulation];
  if (item.applicationAssignment) requiredFiles.push(
    'scorm-wrapper.js',
    'unit-1-lesson-1-buzz-assignment-scorm.zip',
    path.join('buzz-assignment-scorm', 'index.html'),
    path.join('buzz-assignment-scorm', 'imsmanifest.xml')
  );
  for (const required of requiredFiles) {
    if (!fs.existsSync(path.join(dir, required))) fail(`${item.lesson}: missing ${required}`);
  }
  const prohibitedFiles = item.applicationAssignment
    ? ['setup-instructions.html', 'rise-before-you-begin.txt']
    : ['setup-instructions.html', 'rise-before-you-begin.txt', 'imsmanifest.xml', 'scorm-wrapper.js'];
  for (const prohibited of prohibitedFiles) {
    if (fs.existsSync(path.join(dir, prohibited))) fail(`${item.lesson}: prohibited legacy file remains: ${prohibited}`);
  }
  const setup = read(path.join(dir, item.setup));
  if (item.applicationAssignment) {
    if (!setup.includes('HOW TO COMPLETE THE ASSIGNMENT') || !setup.includes('one point for each attempted required question') || !setup.includes('Do not import buzz-assessment-questions.txt')) fail(`${item.lesson}: assignment setup guide is stale`);
    const metadata = JSON.parse(read(path.join(dir, 'busybee-rubric-metadata.json')));
    const settings = metadata.assessmentSettings || {};
    if (metadata.schema !== 'buzz-scorm-assignment/v1' || settings.totalPoints !== 15 || settings.completionPoints !== 15 || settings.requiredApplicationQuestions !== 15 || settings.nativeBuzzQuestions !== 0 || settings.busybeePoints !== 0) fail(`${item.lesson}: application-assignment metadata is incorrect`);
    if (settings.buzzActivityKind !== 'assignment' || settings.buzzAssessmentActivity !== false || settings.deliveryStandard !== 'SCORM 1.2' || settings.scoreSource !== 'cmi.core.score.raw' || settings.scoreMinimum !== 0 || settings.scoreMaximum !== 15 || settings.completionSource !== 'cmi.core.lesson_status') fail(`${item.lesson}: Buzz SCORM score metadata is incorrect`);
    if (!Array.isArray(metadata.questions) || metadata.questions.length !== 0) fail(`${item.lesson}: native question metadata remains`);
    if (!Array.isArray(settings.requiredUploads) || settings.requiredUploads.length) fail(`${item.lesson}: metadata still requires an upload`);
    const simulation = read(path.join(dir, 'sim.js'));
    for (const field of ['cmi.core.score.raw', 'cmi.core.score.min', 'cmi.core.score.max', 'cmi.core.lesson_status', 'cmi.suspend_data']) {
      if (!simulation.includes(field)) fail(`${item.lesson}: simulation does not report ${field}`);
    }
    if (!simulation.includes("scoreRule: 'one-point-per-required-answer'")) fail(`${item.lesson}: simulation lacks the one-point-per-answer score contract`);
    const scoIndex = read(path.join(dir, 'buzz-assignment-scorm', 'index.html'));
    const manifest = read(path.join(dir, 'buzz-assignment-scorm', 'imsmanifest.xml'));
    if (!scoIndex.includes('id="embedded-scorm-wrapper"') || !scoIndex.includes('id="embedded-motion-graphs-application"')) fail(`${item.lesson}: SCO does not embed the SCORM bridge and application`);
    if (!/adlcp:scormtype="sco"/i.test(manifest) || !/href="index\.html"/i.test(manifest) || !/<schemaversion>1\.2<\/schemaversion>/i.test(manifest)) fail(`${item.lesson}: SCORM manifest is incorrect`);
    const zipPath = path.join(dir, 'unit-1-lesson-1-buzz-assignment-scorm.zip');
    const zipData = fs.readFileSync(zipPath);
    const zipNames = zipData.toString('latin1');
    if (zipData.readUInt32LE(0) !== 0x04034b50 || !zipNames.includes('index.html') || !zipNames.includes('imsmanifest.xml')) fail(`${item.lesson}: SCORM ZIP must contain index.html and imsmanifest.xml at its root`);
    return;
  }
  if (!setup.includes('YOUR MISSION') || !setup.includes('WHAT YOU WILL DO AND LEARN') || !setup.includes('HOW TO COMPLETE THE LAB')) fail(`${item.lesson}: TXT setup guide is missing its student-first sections`);
  if (!setup.includes(`${item.automaticPoints} auto-graded points plus ${(item.totalPoints || 15) - item.automaticPoints} BusyBee points`) || !setup.includes('No file upload earns or replaces points')) fail(`${item.lesson}: TXT setup scoring instructions are incorrect`);

  const metadata = JSON.parse(read(path.join(dir, 'busybee-rubric-metadata.json')));
  const settings = metadata.assessmentSettings || {};
  if (settings.totalPoints !== (item.totalPoints || 15) || settings.automaticPoints !== item.automaticPoints || settings.busybeePoints !== (item.totalPoints || 15) - item.automaticPoints) fail(`${item.lesson}: metadata score settings are incorrect`);
  if (!Array.isArray(settings.requiredUploads) || settings.requiredUploads.length) fail(`${item.lesson}: metadata still requires an upload`);
  if (!!item.completedProvidedChart !== (settings.completedProvidedChart === true)) fail(`${item.lesson}: completed-chart setting is incorrect`);
  const busybee = (metadata.questions || []).filter((question) => question.grading === 'busybee');
  if (busybee.length !== item.busybeeQuestionPoints.length || busybee.some((q, i) => q.points !== item.busybeeQuestionPoints[i])) fail(`${item.lesson}: metadata has the wrong final BusyBee point values`);
}

function verifyStandalone(item, dir) {
  const simulationPath = path.join(dir, item.simulation);
  const html = read(simulationPath);
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
  console.log(item.applicationAssignment
    ? `ok: ${item.lesson} (application assignment, ${item.completionQuestionCount} required completion items, 0 native Buzz questions)`
    : `ok: ${item.lesson} (${item.count} questions, ${item.automaticPoints} automatic + ${(item.totalPoints || 15) - item.automaticPoints} BusyBee)`);
}

const expectedDirs = new Set(assessments.map((item) => item.dir));
const actualDirs = fs.readdirSync(root, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name);
for (const dir of actualDirs) {
  if (!expectedDirs.has(dir)) fail(`Unexpected Unit 1 application folder remains: ${dir}`);
}
for (const dir of expectedDirs) {
  if (!actualDirs.includes(dir)) fail(`Canonical Unit 1 application folder is missing: ${dir}`);
}

const zipFiles = fs.readdirSync(root).filter((name) => /\.zip$/i.test(name));
if (zipFiles.length) fail(`Application ZIP files remain: ${zipFiles.join(', ')}`);

const launcherPath = path.join(root, 'index.html');
const launcher = read(launcherPath);
const targets = [...launcher.matchAll(/data-(?:sim|buzz)-href="([^"]+)"/g)].map((match) => match[1]);
if (targets.length !== 12) fail(`Launcher exposes ${targets.length} simulation/preview targets, expected 12`);
for (const target of targets) {
  if (!fs.existsSync(path.resolve(root, target))) fail(`Launcher target does not resolve: ${target}`);
}
const homeHref = ((launcher.match(/class="home-btn"\s+href="([^"]+)"/) || [])[1] || '');
if (!homeHref || !fs.existsSync(path.resolve(root, homeHref))) fail(`Launcher Home link does not resolve: ${homeHref || '(missing)'}`);
if (/new-lesson-4/.test(launcher)) fail('Launcher still references the retired Lesson 4 alternate build');

for (const item of assessments) {
  const dir = path.join(root, item.dir);
  const htmlFiles = fs.readdirSync(dir).filter((name) => /\.html$/i.test(name));
  for (const name of htmlFiles) {
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

for (const script of [
  path.join(root, 'lesson-1', 'sim.js'),
  path.join(root, 'lesson-1', 'scorm-wrapper.js'),
  path.join(root, 'lesson-1', 'build-u1l1-scorm-package.js'),
  path.join(root, 'lesson-3', 'sim.js'),
  path.join(root, 'lesson-4', 'sim.js'),
  path.join(root, 'lesson-honors', 'sim.js'),
  path.join(root, 'build-u1l1-buzz-template.js'),
  path.join(root, 'build-u1h-buzz-template.js'),
  path.join(root, 'build-unit1-buzz-assessments.js')
]) {
  try { new Function(read(script)); } catch (error) { fail(`${path.relative(workspace, script)} does not compile: ${error.message}`); }
}

console.log('Unit 1 validation passed: U1L1 is a 15-point SCORM application assignment; the other five lessons remain native Buzz assessments.');
