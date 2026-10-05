'use strict';

const fs = require('fs');
const path = require('path');

const unitDir = __dirname;
const workspace = path.resolve(unitDir, '..', '..');
const lessonDir = path.join(unitDir, 'lesson-1');
const sourcePath = path.join(lessonDir, 'index.html');
const simulationPath = path.join(lessonDir, 'sim.js');
const tailwindPath = path.join(workspace, 'problem-walkthoughs', 'vendor', 'tailwindcss-3.4.17.js');
const templatePath = path.join(lessonDir, 'u1l1-motion-graphs-buzz-assessment-template.html');

function read(file) {
  return fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
}

let template = read(sourcePath);
const simulation = read(simulationPath);
const tailwind = read(tailwindPath);

if (!template.includes('<script src="https://cdn.tailwindcss.com"></script>')) {
  throw new Error('U1L1 source is missing the expected Tailwind script tag.');
}
if (!template.includes('<script src="sim.js"></script>')) {
  throw new Error('U1L1 source is missing the expected sim.js script tag.');
}

template = template
  .replace('<meta name="viewport" content="width=device-width, initial-scale=1.0">', '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <meta name="buzz-activity-type" content="assignment">')
  .replace('<script src="https://cdn.tailwindcss.com"></script>', () => `<script id="embedded-tailwind">\n${tailwind}\n</script>`)
  .replace(/^\s*@import\s+url\([^\n]+\);\s*$/m, '')
  .replace('<body class="min-h-screen bg-slate-100 relative">', '<body class="min-h-screen bg-slate-100 relative" data-buzz-assignment="completion-1-15">')
  .replace('<script src="sim.js"></script>', () => `<script id="embedded-motion-graphs-application">\n${simulation}\n</script>`);

if (/<a:question\b/i.test(template)) throw new Error('U1L1 assignment template must not contain native Buzz question slots.');
if ((template.match(/<!DOCTYPE html>/gi) || []).length !== 1) throw new Error('U1L1 assignment template was corrupted while embedding scripts.');
const externalDependencyChecks = [
  ['external script tag', /<script[^>]+src\s*=/i],
  ['external stylesheet tag', /<link[^>]+rel=["']stylesheet/i],
  ['external asset URL', /<(?:script|img|iframe|link)\b[^>]*(?:src|href)=["']https?:\/\//i],
  ['CSS import', /@import\s+url\(/i]
];
const templateMarkup = template.replace(/<script(?:\s[^>]*)?>[\s\S]*?<\/script>/gi, '<script></script>');
const failedDependencyCheck = externalDependencyChecks.find((entry) => entry[1].test(templateMarkup));
if (failedDependencyCheck) throw new Error(`U1L1 assignment template contains an ${failedDependencyCheck[0]}.`);

fs.writeFileSync(templatePath, template, 'utf8');
console.log(`Built ${path.relative(unitDir, templatePath)} as a self-contained application assignment.`);
