const fs = require('fs');
const path = require('path');

const root = __dirname;
const templatePath = path.join(root, 'u2l4-river-rescue-buzz-assessment-template.html');
const previewPath = path.join(root, 'u2l4-river-rescue-buzz-assessment-template-preview.html');
const questionsPath = path.join(root, 'buzz-assessment-questions.txt');

function fail(message) {
  throw new Error(message);
}

function read(file) {
  return fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
}

const template = read(templatePath);
const preview = read(previewPath);
const questions = read(questionsPath).trim().split(/\n\s*\n(?=Type:\s*)/).filter(Boolean);
const slots = (template.match(/<a:question\s*><\/a:question>|<a:question\s*\/>/gi) || []).length;
const frames = (template.match(/iframe[^>]+data-river-level=/gi) || []).length;
const rendered = (preview.match(/class="buzz-preview-question"/g) || []).length;

if (questions.length !== 12 || slots !== 12 || rendered !== 12) {
  fail(`Expected 12 questions, slots, and rendered preview questions; received ${questions.length}, ${slots}, and ${rendered}.`);
}
if (frames !== 4) fail(`Expected four embedded River Rescue levels, received ${frames}.`);
if (/iframe[^>]+src=["'][^"']+/i.test(template)) fail('Template contains an external iframe source that can trigger Buzz authentication.');
if (!template.includes('frame.srcdoc = appSource.replace')) fail('Self-contained iframe loader is missing.');
if (/password|passcode|teacher.?code/i.test(template)) fail('Template contains password or unlock code.');
if (!/buzz-assessment-integrity-guard|\['copy',\s*'cut',\s*'paste'/i.test(template)) fail('Required clipboard integrity guard is missing.');
if (/<script[^>]+src\s*=|<link[^>]+rel=["']stylesheet/i.test(template)) fail('Template contains an external script or stylesheet.');

const appLiteral = (template.match(/var appSource = ("(?:\\.|[^"\\])*");\n/) || [])[1];
if (!appLiteral) fail('Embedded River Rescue source was not found.');
const embeddedApp = JSON.parse(appLiteral);
if (!embeddedApp.includes('RIVER_RESCUE_EMBED_CONFIG')) fail('Embedded app does not support locked-level configuration.');

[...embeddedApp.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].forEach((match, index) => {
  try {
    new Function(match[1]);
  } catch (error) {
    fail(`Embedded app script ${index + 1} does not compile: ${error.message}`);
  }
});

[...template.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].forEach((match, index) => {
  try {
    new Function(match[1]);
  } catch (error) {
    fail(`Template script ${index + 1} does not compile: ${error.message}`);
  }
});

console.log('U2L4 River Rescue: 4 self-contained levels, 12 questions, no authentication target, required integrity guard, and accessible lab controls valid.');
