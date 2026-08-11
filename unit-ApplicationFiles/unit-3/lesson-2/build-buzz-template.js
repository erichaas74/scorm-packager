'use strict';

const fs = require('fs');
const path = require('path');

const lessonDir = __dirname;
const sourcePath = path.join(lessonDir, 'usga-golfclub-ct-test.html');
const outputPath = path.join(lessonDir, 'u3l2-golf-club-ct-buzz-assessment-template.html');

const questionSlot = (label) => `<section class="buzz-question-card"><h5>${label}</h5><a:question></a:question></section>`;

const conceptMarkup = `
  <section class="buzz-concept" aria-labelledby="third-law-heading">
    <div>
      <span class="section-kicker">Before the tester</span>
      <h3 id="third-law-heading">Newton's Third Law Check</h3>
      <p>During contact, the club and ball exert equal-magnitude forces in opposite directions. Their accelerations differ because their masses differ.</p>
    </div>
    <div class="buzz-two-grid">
      ${questionSlot('Question 1 - Interaction-force graph')}
      ${questionSlot('Question 2 - Force, mass, and acceleration')}
    </div>
  </section>`;

const assessmentMarkup = `
  <section class="buzz-record" aria-labelledby="record-heading">
    <div class="buzz-section-heading">
      <span class="section-kicker">Complete the provided chart</span>
      <h3 id="record-heading">Force-Time Compliance Record</h3>
      <p>Run each fixed material, read the force-time trace, and enter the requested chart values in Buzz. The USGA limit is CT &le; 257 microseconds.</p>
    </div>

    <h4>Part 1 - Calibration Contact Times</h4>
    <div class="buzz-four-grid">
      ${questionSlot('Question 3 - Soft Polymer CT')}
      ${questionSlot('Question 4 - Alloy CT')}
      ${questionSlot('Question 5 - Thin Titanium CT')}
      ${questionSlot('Question 6 - Thick Titanium CT')}
    </div>

    <h4>Part 1 - Peak-Force Comparison</h4>
    <div class="buzz-two-grid">
      ${questionSlot('Question 7 - Soft Polymer peak force')}
      ${questionSlot('Question 8 - Thick Titanium peak force')}
    </div>

    <h4>Part 2 - Compliance Contact Times</h4>
    <div class="buzz-two-grid">
      ${questionSlot('Question 9 - Rigid Steel CT')}
      ${questionSlot('Question 10 - Prototype X-7 CT')}
    </div>

    <h4>Engineering Analysis</h4>
    <div class="buzz-two-grid">
      ${questionSlot('Question 11 - Chart pattern')}
      ${questionSlot('Question 12 - Compliance ruling')}
    </div>
    <p class="buzz-submit-note">Answer all 12 questions in order. No file upload is required.</p>
  </section>`;

const integrityGuard = `
<script id="buzz-assessment-integrity-guard">
  (function () {
    'use strict';
    function blockClipboardAction(event) { event.preventDefault(); }
    ['copy', 'cut', 'paste', 'contextmenu'].forEach(function (eventName) {
      document.addEventListener(eventName, blockClipboardAction, true);
    });
    document.addEventListener('keydown', function (event) {
      var key = String(event.key || '').toLowerCase();
      if ((event.ctrlKey || event.metaKey) && (key === 'c' || key === 'x' || key === 'v')) event.preventDefault();
    }, true);
  }());
</script>`;

let html = fs.readFileSync(sourcePath, 'utf8');

html = html.replace(
  /<div class="directions">[\s\S]*?<\/div>\s*\n\s*<div class="canvas-container"/,
  `<div class="directions"><h2>Testing Record</h2><p>Test all four calibration faces, then test Rigid Steel and Prototype X-7. Read each fixed force-time trace and complete the Buzz chart below.</p></div>${conceptMarkup}\n    <div class="canvas-container"`
);

html = html.replace(
  /<div class="table-section">[\s\S]*?<\/div>\s*<\/div>\s*\n\s*<div class="quiz-container">[\s\S]*?<\/div>\s*\n\s*<script(?:\s+id="standalone-activity-store")?[^>]*>[\s\S]*?<\/script>/,
  `${assessmentMarkup}\n</div>`
);

html = html.replace(
  /\s*\/\/ ================================================================\s*\n\s*\/\/\s+(?:ACTIVITY|STANDALONE PRACTICE):[\s\S]*?window\.addEventListener\('load', initActivity\);\s*\n\s*resizeCanvas\(\);\s*\n\s*drawGraphAxes\(\);\s*\n\s*updateMaterialButtons\(\);/,
  `

    const activity = { mysteryId: 'B' };
    function recordTestResult() {}

    resizeCanvas();
    drawGraphAxes();
    updateMaterialButtons();`
);

html = html.replace(/\s*\/\/ (?:The (?:SCORM wrapper|standalone activity store)|Run the local practice setup)[^\n]*\n?/, '\n');
html = html.replace(/function mysteryUnlocked\(\) \{\s*return activity\.tested\.size >= 5;\s*\}/, 'function mysteryUnlocked() { return true; }');

html = html.replace('</style>', `
  .buzz-concept, .buzz-record { margin: 18px 0; padding: 18px; border: 1px solid #bfdbfe; border-radius: 10px; background: #f8fbff; }
  .section-kicker { color: #2563eb; font-size: 0.7rem; font-weight: 800; letter-spacing: 0.7px; text-transform: uppercase; }
  .buzz-concept h3, .buzz-record h3 { margin: 4px 0 6px; color: #1e3a8a; }
  .buzz-concept p, .buzz-record p { color: #475569; line-height: 1.5; }
  .buzz-record h4 { margin: 20px 0 8px; color: #1f2937; }
  .buzz-two-grid, .buzz-four-grid { display: grid; gap: 10px; }
  .buzz-two-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .buzz-four-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .buzz-question-card { min-width: 0; padding: 10px; border: 1px solid #dbe3ee; border-top: 3px solid #2563eb; border-radius: 7px; background: #fff; }
  .buzz-question-card h5 { margin: 0 0 8px; color: #334155; font-size: 0.78rem; }
  .buzz-submit-note { margin: 18px 0 0; padding: 10px; border-radius: 7px; background: #eff6ff; font-weight: 700; }
  @media (max-width: 760px) { .buzz-four-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  @media (max-width: 520px) { .buzz-two-grid, .buzz-four-grid { grid-template-columns: 1fr; } }
</style>`);

if (!html.includes('id="buzz-assessment-integrity-guard"')) html = html.replace('</body>', `${integrityGuard}\n</body>`);

for (const required of ['function drawScene()', 'function drawGraph()', "const activity = { mysteryId: 'B' };", 'id="buzz-assessment-integrity-guard"']) {
  if (!html.includes(required)) throw new Error(`Template generation failed: missing ${required}`);
}

const slots = (html.match(/<a:question\s*><\/a:question>/gi) || []).length;
if (slots !== 12) throw new Error(`Template generation failed: expected 12 slots, found ${slots}`);
if (/scorm-wrapper\.js/i.test(html)) throw new Error('Template generation failed: SCORM wrapper reference remains');

fs.writeFileSync(outputPath, html, 'utf8');
console.log(`Generated ${path.basename(outputPath)} with ${slots} Buzz slots.`);
