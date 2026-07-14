const fs = require('fs');
const path = require('path');

const lessonDir = __dirname;
const sourceHtml = fs.readFileSync(path.join(lessonDir, 'index.html'), 'utf8');
const sourceCss = fs.readFileSync(path.join(lessonDir, 'style.css'), 'utf8');
const sourceScript = fs.readFileSync(path.join(lessonDir, 'sim.js'), 'utf8');
const outputPath = path.join(lessonDir, 'u1h-rocket-launch-buzz-assessment-template.html');

const fixedMissionHook = `function createMission(targetHeight) {
      if (window.BUZZ_TEMPLATE) {
        var solved = solveMission(20, 2.5);
        return Object.assign({
          id: 'buzz-fixed',
          targetHeight: Number(solved.apexHeight.toFixed(1)),
          gravity: GRAVITY,
          retroAccel: RETRO_ACCEL,
          safeLandingSpeed: SAFE_LANDING_SPEED,
        }, solved);
      }`;

if (!sourceScript.includes('function createMission(targetHeight) {')) {
  throw new Error('Could not locate createMission in sim.js.');
}

const templateScript = sourceScript.replace(
  'function createMission(targetHeight) {',
  fixedMissionHook
);

const assessmentPanel = `
    <section class="buzz-assessment-panel" aria-label="Buzz assessment questions">
      <div class="buzz-assessment-heading">
        <h2>Rocket Flight Calculations</h2>
      </div>
      <section class="buzz-question-group sky">
        <h3>Level 1: Burn Phase</h3>
        <p>Use the burn givens shown in the Mission Brief. Answer both Buzz questions.</p>
        <a:question></a:question>
        <a:question></a:question>
      </section>
      <section class="buzz-question-group violet">
        <h3>Level 2: Coast Phase</h3>
        <p>Use the burnout velocity from Level 1 and gravity to find the added coast height.</p>
        <a:question></a:question>
      </section>
      <section class="buzz-question-group red">
        <h3>Level 3: Apex Verification</h3>
        <p>Combine the two ascent displacements, then launch a verification flight in the lab above.</p>
        <a:question></a:question>
      </section>
      <section class="buzz-question-group emerald">
        <h3>Level 4: Investigation Mode</h3>
        <p>Choose either challenge in the lab above and complete a flight. The on-screen Status reads <strong>Challenge cleared</strong> when the selected target or landing challenge succeeds. Record the displayed flight data, then finish the evidence and reflection questions below.</p>
        <div class="buzz-evidence-actions">
          <button class="btn" id="buzz-copy-values" type="button">Copy values for Buzz</button>
          <button class="btn" id="buzz-download-evidence" type="button">Download Evidence Image</button>
        </div>
        <a:question></a:question>
        <a:question></a:question>
      </section>
      <p class="buzz-return">Finish the Buzz questions in this section before submitting the assessment.</p>
    </section>`;

const templateStyles = `
    <style>
      #question-card,
      #score-badge,
      #toggle-coach-btn,
      #coach-card {
        display: none !important;
      }

      .buzz-assessment-panel {
        width: min(1280px, calc(100% - 32px));
        margin: 0 auto 32px;
        color: #e2e8f0;
      }

      .buzz-assessment-heading,
      .buzz-question-group {
        border: 1px solid #1e293b;
        border-radius: 12px;
        background: #0f172a;
        box-shadow: 0 18px 40px rgba(0, 0, 0, 0.25);
        padding: 18px;
        margin-top: 16px;
      }

      .buzz-question-group.sky { border-left: 5px solid #38bdf8; }
      .buzz-question-group.violet { border-left: 5px solid #a78bfa; }
      .buzz-question-group.red { border-left: 5px solid #f87171; }
      .buzz-question-group.emerald { border-left: 5px solid #34d399; }
      .buzz-question-group h3,
      .buzz-assessment-heading h2 { margin: 0 0 8px; }
      .buzz-question-group p,
      .buzz-return { color: #cbd5e1; line-height: 1.5; }
      .buzz-return { text-align: center; margin: 22px 0 0; font-weight: 700; }
      .buzz-evidence-actions { display: flex; flex-wrap: wrap; gap: 10px; margin: 14px 0; }
    </style>`;

const evidenceScript = `
    document.addEventListener('click', function(event) {
      var resultsCard = document.getElementById('finished-card');
      if (!resultsCard) return;
      var evidenceText = resultsCard.innerText.replace(/\\n{2,}/g, '\\n').trim();

      if (event.target.id === 'buzz-copy-values') {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(evidenceText);
        }
        return;
      }

      if (event.target.id === 'buzz-download-evidence') {
        var lines = evidenceText.split('\\n');
        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');
        canvas.width = 1200;
        canvas.height = Math.max(260, (lines.length + 3) * 30);
        context.fillStyle = '#0f172a';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = '#e2e8f0';
        context.font = '20px Arial';
        context.fillText('Rocket Launch Lab - Level 4 Evidence', 32, 42);
        context.font = '16px Arial';
        lines.forEach(function(line, index) {
          context.fillText(line, 32, 82 + index * 30);
        });
        var download = document.createElement('a');
        download.href = canvas.toDataURL('image/png');
        download.download = 'rocket-launch-level-4-evidence.png';
        download.click();
      }
    });`;

let template = sourceHtml
  .replace('<title>Mission Control Retro Burn Landing</title>', '<title>Unit 1 Honors: Rocket Launch Lab Assessment</title>')
  .replace('<link rel="stylesheet" href="style.css">', `<style>\n${sourceCss}\n</style>${templateStyles}`)
  .replace(/\s*<script src="scorm-wrapper\.js"><\/script>/, '')
  .replace('<script src="sim.js"></script>', `<script>window.BUZZ_TEMPLATE = true;</script>\n  <script>\n${templateScript}\n${evidenceScript}\n  </script>`)
  .replace('</body>', `${assessmentPanel}\n</body>`);

if ((template.match(/<a:question\s*><\/a:question>/g) || []).length !== 6) {
  throw new Error('Template must contain exactly six Buzz question slots.');
}

fs.writeFileSync(outputPath, template, 'utf8');
console.log(`Built ${path.relative(process.cwd(), outputPath)}`);