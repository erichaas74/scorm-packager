const fs = require('fs');
const path = require('path');

const root = __dirname;

const sharedCss = `
<style id="u6-buzz-assessment-styles">
  .u6-buzz-section{max-width:1180px;margin:22px auto;padding:22px;border:1px solid #cfdcdf;border-radius:18px;background:#fff;color:#172b3a;box-shadow:0 10px 28px rgba(19,42,58,.08);font-family:Arial,sans-serif}
  .u6-buzz-section h2{margin:0 0 7px;color:#123f5a;font-size:1.5rem}
  .u6-buzz-section>p{margin:0 0 16px;color:#5d6e76;line-height:1.55}
  .u6-score-strip{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 16px}
  .u6-score-strip span{padding:6px 10px;border-radius:999px;background:#e7f3f1;color:#174c50;font-weight:800;font-size:.82rem}
  .u6-question-slot{margin:12px 0;padding:15px;border:1px solid #d6e1e3;border-radius:13px;background:#fbfdfd}
  .u6-question-label{margin:0 0 9px;color:#17313a;font-weight:800}
  .u6-question-label span{display:block;margin-top:3px;color:#62747b;font-size:.86rem;font-weight:600}
  .u6-local-note{padding:11px 13px;border-left:5px solid #d27a1f;background:#fff6e8;color:#70490e;font-weight:700}
  @media(max-width:700px){.u6-buzz-section{padding:15px;border-radius:12px}.u6-question-slot{padding:11px}}
</style>`;

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function write(relativePath, value) {
  const outputPath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, value, 'utf8');
  console.log(`Built ${path.relative(root, outputPath)}`);
}

function addBodyClass(html) {
  return html.replace(/<body(\s*)>/i, '<body class="u6-buzz-assessment">');
}

function addHeadContent(html, content) {
  if (!html.includes('</head>')) throw new Error('Missing </head> marker');
  return html.replace('</head>', `${content}\n</head>`);
}

function insertBefore(html, marker, content) {
  const index = html.indexOf(marker);
  if (index < 0) throw new Error(`Missing insertion marker: ${marker.slice(0, 80)}`);
  return html.slice(0, index) + content + '\n' + html.slice(index);
}

function assessmentSection(title, description, questionFile, labels) {
  const slots = labels.map((label, index) => `
    <div class="u6-question-slot">
      <p class="u6-question-label">Question ${index + 1}<span>${label}</span></p>
      <a:question></a:question>
    </div>`).join('');

  return `<section class="u6-buzz-section" aria-labelledby="u6-buzz-heading">
  <h2 id="u6-buzz-heading">${title}</h2>
  <p>${description}</p>
  <div class="u6-score-strip" aria-label="Assessment scoring"><span>15 points total</span><span>10 auto-graded</span><span>5 BusyBee rubric-graded</span></div>
  <p class="u6-local-note" hidden data-u6-local-note>When opened outside Buzz, question controls are blank. Import <strong>${questionFile}</strong> and upload this file as the assessment template.</p>${slots}
</section>`;
}

function addLocalNoteScript(html) {
  const script = `<script id="u6-buzz-local-note-script">\n(function(){if(window.location.protocol==='file:'){var note=document.querySelector('[data-u6-local-note]');if(note)note.hidden=false;}}());\n</script>`;
  return html.replace('</body>', `${script}\n</body>`);
}

function buildMillikan() {
  let html = read('millikan_oil_drop_simulation.html');
  html = addBodyClass(html);
  html = addHeadContent(html, `${sharedCss}\n<style>
    .u6-buzz-assessment .u6-legacy-analysis,.u6-buzz-assessment .finish-card{display:none!important}
  </style>`);
  html = html.replace('<section class="card">\n        <h2>Evidence Analysis</h2>', '<section class="card u6-legacy-analysis">\n        <h2>Evidence Analysis</h2>');
  html = html.replace('Use your table as evidence in all six analysis responses.', 'Use the completed table as evidence in the native Buzz questions below.');
  html = html.replace('<!-- BUZZ_SCORM_WRAPPER -->', '');
  const section = assessmentSection(
    'Buzz assessment: Oil Drop Investigation',
    'Balance and record all six drops before answering. Keep the evidence table visible so your calculations and conclusion use your own measurements.',
    'buzz-assessment-questions.txt',
    [
      'Identify the force-balance condition',
      'Select the model relative-charge formula',
      'Calculate q/e for a 100 V balance',
      'Calculate q/e for a 50 V balance',
      'Reason about charge and balance voltage',
      'Identify the quantization pattern',
      'Calculate charge in coulombs',
      'Apply the inverse voltage-charge relationship',
      'Analyze three recorded drops',
      'Write a quantization CER conclusion'
    ]
  );
  html = insertBefore(html, '</main>', section);
  html = addLocalNoteScript(html);
  write('millikan-oil-drop-investigation/u6l1-millikan-buzz-assessment-template.html', html);
}

function buildCircuit() {
  let html = read('circuit-design-challenge/index.html');
  const css = read('circuit-design-challenge/styles.css');
  const js = read('circuit-design-challenge/app.js');
  html = html.replace('<link rel="stylesheet" href="styles.css">', () => `<style>\n${css}\n</style>`);
  // A replacement callback preserves JavaScript dollar signs such as the app's $$ selector helper.
  html = html.replace('<script src="app.js"></script>', () => `<script>\n${js}\n</script>`);
  html = addBodyClass(html);
  html = addHeadContent(html, `${sharedCss}\n<style>
    .u6-buzz-assessment .view-tabs [data-view="report"],.u6-buzz-assessment #reportView,.u6-buzz-assessment .progress-summary,.u6-buzz-assessment #notebookView .question-block,.u6-buzz-assessment #notebookCount{display:none!important}
  </style>`);
  html = html.replace('Answer questions</button>', 'Review evidence</button>');
  html = html.replace('Use measurements from the model or PhET, then explain the patterns in your own words.', 'Review and correct the measurements saved from each mission. Use these evidence tables in the native Buzz questions.');
  const section = assessmentSection(
    'Buzz assessment: Circuit Design Challenge',
    'Record the model evidence for the circuit missions before answering. Use 9.0 V and the model\'s 10 ohm bulbs for the fixed calculations.',
    'buzz-assessment-questions.txt',
    [
      'Identify the condition for a closed circuit',
      'Calculate current for one 10 ohm bulb',
      'Calculate current for two bulbs in series',
      'Calculate voltage across a series bulb',
      'Calculate total current for two parallel bulbs',
      'Identify branch voltage in parallel',
      'Explain why parallel branches improve reliability',
      'Apply the junction current rule',
      'Compare recorded series and parallel evidence',
      'Defend the three-room circuit with CER'
    ]
  );
  html = insertBefore(html, '</main>', section);
  html = addLocalNoteScript(html);
  write('circuit-design-challenge/u6l3-circuit-design-buzz-assessment-template.html', html);
}

function buildGenerator() {
  let html = read('generator-design-challenge/index.html');
  html = addBodyClass(html);
  html = addHeadContent(html, `${sharedCss}\n<style>
    .u6-buzz-assessment #notebookPanel .answer,.u6-buzz-assessment #submitCard,.u6-buzz-assessment .progress-box,.u6-buzz-assessment #answerBadge{display:none!important}
  </style>`);
  html = html.replace('Lab Notebook <span class="badge" id="answerBadge">0/24</span>', 'Evidence Tables <span class="badge" id="answerBadge">0/24</span>');
  html = html.replace('Your evidence and responses save automatically on this device. Use complete scientific sentences and cite observations from the generator.', 'Your recorded evidence saves automatically on this device. Review these tables while answering the native Buzz questions.');
  const section = assessmentSection(
    'Buzz assessment: Generator Design Challenge',
    'Complete the controlled-variable evidence cards and record a final design. Use the live RPM, peak EMF, and brightness readouts for calculations and written evidence.',
    'buzz-assessment-questions.txt',
    [
      'Identify the changing-flux requirement',
      'Predict the effect of faster rotation',
      'Explain the magnet-strength effect',
      'Explain the coil-loop effect',
      'Explain the coil-area effect',
      'Record peak EMF for the specified settings',
      'Explain the reversing voltmeter reading',
      'Record maximum-setting peak EMF',
      'Analyze two controlled-variable series',
      'Defend the final generator with CER'
    ]
  );
  html = insertBefore(html, '</main>', section);
  html = addLocalNoteScript(html);
  write('generator-design-challenge/u6l5-generator-buzz-assessment-template.html', html);
}

function buildHonorsMotor() {
  let html = read('honors_electric_motor_engineering_challenge.html');
  html = addBodyClass(html);
  html = addHeadContent(html, `${sharedCss}\n<style>
    .u6-buzz-assessment .u6-legacy-analysis,.u6-buzz-assessment #finishLab{display:none!important}
  </style>`);
  const legacyMarker = '<section class="panel section">\n    <div class="hd"><h2>5. Analysis Questions</h2>';
  html = html.replace(legacyMarker, '<section class="panel section u6-legacy-analysis">\n    <div class="hd"><h2>5. Analysis Questions</h2>');
  const section = assessmentSection(
    'Buzz assessment: Electric Motor Engineering Challenge',
    'Save a valid baseline, complete systematic trials on two variables, and mark an optimized design before answering. Keep the trial table and design log available as evidence.',
    'buzz-assessment-questions.txt',
    [
      'Explain magnetic force on a current-carrying wire',
      'Identify the force pair that produces torque',
      'Explain the commutator function',
      'Calculate default winding resistance',
      'Predict the magnetic-field effect and tradeoff',
      'Explain the supply-voltage constraint',
      'Select a valid controlled-variable test',
      'Trace energy and loss pathways',
      'Analyze three systematic motor trials',
      'Defend the optimized motor with CER'
    ]
  );
  html = insertBefore(html, '<section class="panel section u6-legacy-analysis">', section);
  html = addLocalNoteScript(html);
  write('honors-electric-motor-engineering-challenge/u6h-motor-buzz-assessment-template.html', html);
}

buildMillikan();
buildCircuit();
buildGenerator();
buildHonorsMotor();
