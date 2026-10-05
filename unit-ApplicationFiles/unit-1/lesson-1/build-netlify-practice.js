'use strict';

const fs = require('fs');
const path = require('path');

const lessonDir = __dirname;
const workspace = path.resolve(lessonDir, '..', '..', '..');
const sourcePath = path.join(lessonDir, 'index.html');
const simulationPath = path.join(lessonDir, 'sim.js');
const tailwindPath = path.join(workspace, 'problem-walkthoughs', 'vendor', 'tailwindcss-3.4.17.js');
const outputDir = path.join(lessonDir, 'netlify-practice-13-cases');
const outputPath = path.join(outputDir, 'index.html');

function read(file) {
  return fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
}

let html = read(sourcePath);
let simulation = read(simulationPath);
const tailwind = read(tailwindPath);

const assessmentStart = simulation.indexOf(' // Assessment Generators');
const assessmentEnd = simulation.indexOf('  const CORE_QUESTION_COUNT = 15;', assessmentStart);
if (assessmentStart < 0 || assessmentEnd < 0) {
  throw new Error('Could not isolate the Lesson 1 assignment-question generators.');
}

simulation = simulation.slice(0, assessmentStart)
  + '  // Practice-only Netlify build: assignment-question generators removed.\n'
  + '  const AssessmentGenerators = [];\n\n'
  + simulation.slice(assessmentEnd);

const practiceCaseCount = (simulation.match(/title:'Case\s+\d+:/g) || []).length;
if (practiceCaseCount !== 13) {
  throw new Error(`Expected 13 practice cases, found ${practiceCaseCount}.`);
}
if (/BONUS Q\d+|id:'q\d+'/i.test(simulation)) {
  throw new Error('Assignment-question data remains in the practice-only simulation.');
}

const practiceOnlyCss = `
  <style id="practice-only-netlify-overrides">
    #mode-assessment-btn,
    #top-bar-score,
    #overall-score-display,
    #assessment-top-controls,
    #assessment-stage-controls,
    #assessmentDirectionsWrapper,
    #assessment-feedback-panel,
    #completion-card { display: none !important; }
  </style>`;

html = html
  .replace('<title>Motion Graphs Assignment – Mail Carrier Mystery</title>', '<title>Motion Graphs Practice – 13 Cases</title>')
  .replace('<meta name="viewport" content="width=device-width, initial-scale=1.0">', '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <meta name="description" content="Thirteen interactive motion-graph practice cases for Unit 1 Lesson 1.">')
  .replace('<script src="https://cdn.tailwindcss.com"></script>', () => `<script id="embedded-tailwind">\n${tailwind}\n</script>`)
  .replace(/^\s*@import\s+url\([^\n]+\);\s*$/m, '')
  .replace('</head>', `${practiceOnlyCss}\n</head>`)
  .replace('Motion Graphs Assignment</h1>', 'Motion Graphs Practice</h1>')
  .replace('Complete Questions 1–15 by analyzing position and velocity graphs', 'Explore all 13 cases by connecting each motion story to its graphs')
  .replace('Start Assignment', 'Start Practice')
  .replace('<span class="text-lg font-extrabold tracking-tight">Motion Graphs Assignment</span>', '<span class="text-lg font-extrabold tracking-tight">Motion Graphs Practice: 13 Cases</span>')
  .replace('<button id="mode-practice-btn" class="mode-chip active flex-1">Explore Cases</button>', '<button id="mode-practice-btn" class="mode-chip active flex-1">13 Practice Cases</button>')
  .replace('<button id="mode-assessment-btn" class="mode-chip flex-1">Assignment Questions</button>', '<button id="mode-assessment-btn" class="mode-chip flex-1" style="display:none" disabled aria-hidden="true" tabindex="-1">Practice Only</button>')
  .replace(/<div class="overall-directions" role="note" aria-label="Overall lab directions">[\s\S]*?<\/div>\n\n        <div id="practice-brief-shell"/, '<div class="overall-directions" role="note" aria-label="Practice directions">\n          <div class="overall-directions-title">Practice Directions</div>\n          <p>Select any of the 13 cases. Play or scrub the motion, compare the position-time and velocity-time graphs, and answer the case prompt. Use Show Hints when you need another clue.</p>\n        </div>\n\n        <div id="practice-brief-shell"')
  .replace('<script src="sim.js"></script>', () => `<script id="embedded-motion-graphs-practice">\n${simulation}\n</script>`);

const markupWithoutScripts = html.replace(/<script(?:\s[^>]*)?>[\s\S]*?<\/script>/gi, '<script></script>');
if ((html.match(/<!DOCTYPE html>/gi) || []).length !== 1) throw new Error('Generated practice page contains duplicated document markup.');
if (/<script[^>]+src\s*=|<link[^>]+rel=["']stylesheet/i.test(markupWithoutScripts) || /@import\s+url\(/i.test(markupWithoutScripts)) {
  throw new Error('Generated practice page contains an external dependency.');
}
if (!html.includes('Case 13: Double Heist Chaos') || !html.includes('practiceAnswerType:\'suspect\'')) {
  throw new Error('Corrected Case 13 is missing from the generated practice page.');
}

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, html, 'utf8');
console.log(`Built ${path.relative(workspace, outputPath)} with ${practiceCaseCount} practice cases and no assignment-question generators.`);
