const fs = require('fs');
const path = require('path');

const root = __dirname;
const sourcePath = path.join(root, 'hookes-law-lab.html');
const outputPath = path.join(root, 'u4l2-hookes-law-buzz-assessment-template.html');

const styles = `
  <style id="buzz-question-layout-styles">
    .buzz-assessment-section { width:min(1180px,calc(100% - 24px)); margin:18px auto 36px; padding:18px; border:1px solid #c8d8e2; border-radius:16px; background:#fff; box-shadow:0 14px 36px rgb(23 48 71 / 12%); }
    .buzz-assessment-section h2 { margin:0; color:#173047; }
    .buzz-assessment-section > p { color:#5b7183; }
    .buzz-question-slot { margin-top:12px; padding:12px; border:1px solid #c8d8e2; border-left:5px solid #1d4ed8; border-radius:9px; background:#f8fbff; }
    .buzz-slot-label { margin:0 0 7px; color:#1d4ed8; font-size:.75rem; font-weight:900; text-transform:uppercase; }
    body[data-assessment-mode="true"] #springSet .spring-piece:not([data-spring-key="A"]) { opacity:.45; }
  </style>`;

const slots = `
  <section class="buzz-assessment-section" aria-labelledby="buzz-questions-heading">
    <h2 id="buzz-questions-heading">Buzz Assessment Questions</h2>
    <p>Complete all five known-mass trials, calculate k before displaying the best-fit line, test the mystery mass, and answer all ten questions.</p>
    ${Array.from({ length: 10 }, (_, index) => `<div class="buzz-question-slot"><p class="buzz-slot-label">Question ${index + 1}</p><a:question></a:question></div>`).join('\n    ')}
  </section>`;

let source = fs.readFileSync(sourcePath, 'utf8');
source = source.replace('<title>Hooke\'s Law Lab</title>', '<title>Unit 4 Lesson 2 - Hooke\'s Law Buzz Assessment</title>');
source = source.replace('<body>', '<body data-assessment-mode="true">');
source = source.replace('</head>', `${styles}\n</head>`);
source = source.replace('  <script>\n    (() => {', `${slots}\n\n  <script>\n    (() => {`);
fs.writeFileSync(outputPath, source, 'utf8');
console.log('Built Unit 4 Lesson 2 Buzz assessment template.');
