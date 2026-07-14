const fs = require('fs');
const path = require('path');

const lessonDir = __dirname;
const sourcePath = path.join(lessonDir, 'usga-golfclub-ct-test.html');
const outputPath = path.join(lessonDir, 'u3l2-golf-club-ct-buzz-assessment-template.html');

const questionParts = [
  {
    title: 'Part 2 - Compliance Test',
    description: 'Test Rigid Steel and Prototype X-7, then determine which face is compliant with the CT limit.',
    cards: [
      ['Rigid Steel', ['Contact time', 'Peak force', 'Average force']],
      ['Prototype X-7', ['Contact time', 'Peak force', 'Average force']],
      ['Part 2 Ruling', ['']]
    ]
  }
];

  const calibrationMaterials = ['Soft Polymer', 'Alloy', 'Thin Titanium', 'Thick Titanium'];
  const measurementGrid = (title, description) => `
      <section class="measurement-group">
        <div class="measurement-heading"><h5>${title}</h5><p>${description}</p></div>
        <div class="four-material-grid">
  ${calibrationMaterials.map(material => `                <section class="measurement-card"><h6>${material}</h6><a:question></a:question></section>`).join('\n')}
        </div>
      </section>`;

  const part1Markup = `    <section class="buzz-part"><div class="buzz-part-heading"><h4>Part 1 - Calibration Materials</h4><p>Test the four calibration faces, then use the force-time results to compare their effects on the ball.</p></div>
  ${measurementGrid('Contact Time', 'How long does each club face push on the ball?')}
  ${measurementGrid('Peak Force', 'What is the largest force during each collision?')}
  ${measurementGrid('Average Force', 'Compare the typical force over each contact interval.')}
      <section class="part1-analysis"><div class="measurement-heading"><h5>Part 1 Analysis</h5><p>Use the force-time graphs to reason about acceleration and impulse.</p></div><div class="part1-analysis-grid">
        <div class="analysis-question"><a:question></a:question></div>
        <div class="analysis-question"><a:question></a:question></div>
        <div class="analysis-question"><a:question></a:question></div>
      </div></section>
    </section>`;

  const preLabMarkup = `
  <section class="prelab-section" aria-labelledby="prelab-heading">
    <div class="prelab-heading">
      <div><span class="section-kicker">Before the tester</span><h3 id="prelab-heading">Newton's Third Law: Club and Ball</h3></div>
      <p>Read the club's force-time trace. Then predict the force-time trace for the ball during the same collision.</p>
    </div>
    <div class="third-law-visual">
      <div class="force-graph-card">
        <h4>Force on the Club from the Ball</h4>
        <svg class="force-graph" viewBox="0 0 520 215" role="img" aria-label="A force-time graph with a single positive pulse during contact">
          <rect x="0" y="0" width="520" height="215" fill="#ffffff"/>
          <g stroke="#e2e8f0" stroke-width="1"><line x1="58" y1="32" x2="500" y2="32"/><line x1="58" y1="76" x2="500" y2="76"/><line x1="58" y1="120" x2="500" y2="120"/><line x1="58" y1="164" x2="500" y2="164"/><line x1="146" y1="20" x2="146" y2="164"/><line x1="234" y1="20" x2="234" y2="164"/><line x1="322" y1="20" x2="322" y2="164"/><line x1="410" y1="20" x2="410" y2="164"/></g>
          <g stroke="#475569" stroke-width="2"><line x1="58" y1="20" x2="58" y2="164"/><line x1="58" y1="164" x2="500" y2="164"/></g>
          <path d="M58 164 L152 164 C183 164 200 147 218 108 C238 64 259 37 280 37 C301 37 322 64 342 108 C360 147 377 164 408 164 L500 164" fill="none" stroke="#dc2626" stroke-width="5" stroke-linecap="round"/>
          <g fill="#475569" font-family="Segoe UI, sans-serif" font-size="12"><text x="40" y="168">0</text><text x="19" y="124">10</text><text x="19" y="80">20</text><text x="19" y="36">30</text><text x="242" y="202">Time during collision</text><text x="65" y="187">before</text><text x="239" y="187">contact</text><text x="416" y="187">after</text></g>
          <text x="18" y="16" fill="#475569" font-family="Segoe UI, sans-serif" font-size="12">Force (N)</text>
        </svg>
      </div>
      <aside class="third-law-key">
        <h4>Collision Pair</h4>
        <div class="pair-row"><span class="force-arrow force-arrow-left">&larr;</span><span>The ball pushes on the club.</span></div>
        <div class="pair-row"><span class="force-arrow force-arrow-right">&rarr;</span><span>The club pushes on the ball.</span></div>
        <p>These forces act at the same time, have equal magnitudes, and point in opposite directions.</p>
      </aside>
    </div>
    <div class="prelab-slots">
      <div class="prelab-question"><span class="prelab-label">Prediction: ball's graph</span><a:question></a:question></div>
      <div class="prelab-question"><span class="prelab-label">Force pair</span><a:question></a:question></div>
      <div class="prelab-question"><span class="prelab-label">Acceleration and mass</span><a:question></a:question></div>
      <div class="prelab-question"><span class="prelab-label">Evidence-based conclusion</span><a:question></a:question></div>
    </div>
  </section>`;

const reportMarkup = `
<div class="table-section buzz-report">
    <h3>Compliance Record</h3>
    <p class="notebook-note">The USGA limit is CT &le; 257 microseconds. Complete Part 1 before using the two test materials in Part 2.</p>
${part1Markup}
${questionParts.map(part => `    <section class="buzz-part"><div class="buzz-part-heading"><h4>${part.title}</h4><p>${part.description}</p></div><div class="buzz-slot-grid">
${part.cards.map(([title, labels]) => `        <section class="buzz-slot-card"><h5>${title}</h5>${labels.map(label => `            <div class="buzz-slot">${label ? `<div class="buzz-slot-label">${label}</div>` : ''}<a:question></a:question></div>`).join('\n')}</section>`).join('\n')}
    </div></section>`).join('\n')}
</div>`;

let html = fs.readFileSync(sourcePath, 'utf8');

html = html.replace(
  /<div class="directions">[\s\S]*?<\/div>\s*\n\s*<div class="canvas-container"/,
  `<div class="directions"><h2>Testing Record</h2><p>Part 1: test the four calibration faces. Part 2: test Rigid Steel and Prototype X-7, then determine which face meets the CT limit. Inspect the original force-time trace and complete the matching Buzz questions below.</p></div>\n${preLabMarkup}\n    <div class="canvas-container"`
);

html = html.replace(
  /<div class="table-section">[\s\S]*?<\/div>\s*<\/div>\s*\n\s*<div class="quiz-container">[\s\S]*?<\/div>\s*\n\s*<script src="scorm-wrapper\.js"><\/script>/,
  `${reportMarkup}\n</div>`
);

html = html.replace(
  /\s*\/\/ ================================================================\s*\n\s*\/\/  ACTIVITY: notebook, questions, scoring, SCORM[\s\S]*?window\.addEventListener\('load', initActivity\);\s*\n\s*resizeCanvas\(\);\s*\n\s*drawGraphAxes\(\);\s*\n\s*updateMaterialButtons\(\);/,
  `

    const activity = { mysteryId: 'B' };

    function recordTestResult() {}

    resizeCanvas();
    drawGraphAxes();
    updateMaterialButtons();`
);

  html = html.replace(/\s*\/\/ The SCORM wrapper initializes on window load; run activity setup after it\./, '');

html = html.replace(
  /function mysteryUnlocked\(\) \{\s*return activity\.tested\.size >= 5;\s*\}/,
  'function mysteryUnlocked() { return true; }'
);

html = html.replace(
  '</style>',
  `
        .buzz-report { margin-top: 4px; }
        .buzz-part { margin-top: 20px; }
        .buzz-part-heading { border-left: 4px solid #2563eb; margin-bottom: 10px; padding: 4px 0 4px 10px; }
        .buzz-part-heading h4 { margin: 0; color: #1d4ed8; font-size: 1rem; }
        .buzz-part-heading p { margin: 2px 0 0; color: #64748b; font-size: 0.78rem; }
        .buzz-slot-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(285px, 1fr)); gap: 12px; }
        .buzz-slot-card { border: 1px solid #e2e8f0; border-top: 4px solid #2563eb; border-radius: 8px; padding: 12px; background: #f8fbff; }
        .buzz-slot-card h5 { margin: 0 0 8px; color: #1f2937; font-size: 0.92rem; }
        .buzz-slot { border-top: 1px solid #dbe3ee; padding: 8px 0 2px; min-height: 48px; }
        .buzz-slot-label { color: #64748b; font-size: 0.68rem; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; }
        .measurement-group, .part1-analysis { margin-top: 16px; }
        .measurement-heading { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 8px; }
        .measurement-heading h5 { margin: 0; color: #1f2937; font-size: 0.92rem; }
        .measurement-heading p { margin: 0; color: #64748b; font-size: 0.76rem; line-height: 1.35; text-align: right; }
        .four-material-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
        .measurement-card, .analysis-question { border: 1px solid #dbe3ee; border-top: 3px solid #2563eb; border-radius: 6px; padding: 10px; background: #f8fbff; min-width: 0; }
        .measurement-card h6 { margin: 0 0 8px; color: #1f2937; font-size: 0.78rem; line-height: 1.25; text-align: center; }
        .part1-analysis-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
        .prelab-section { margin-bottom: 28px; padding: 18px; border: 1px solid #bfdbfe; border-radius: 8px; background: #f8fbff; }
        .prelab-heading { display: flex; justify-content: space-between; gap: 18px; align-items: end; margin-bottom: 14px; }
        .section-kicker { color: #2563eb; font-size: 0.68rem; font-weight: 800; letter-spacing: 0.7px; text-transform: uppercase; }
        .prelab-heading h3 { margin: 3px 0 0; color: #1e3a8a; font-size: 1.1rem; }
        .prelab-heading p { max-width: 480px; margin: 0; color: #475569; font-size: 0.82rem; line-height: 1.45; }
        .third-law-visual { display: grid; grid-template-columns: minmax(0, 1.7fr) minmax(200px, 0.8fr); gap: 14px; align-items: stretch; }
        .force-graph-card, .third-law-key { border: 1px solid #dbe3ee; border-radius: 8px; padding: 12px; background: #ffffff; }
        .force-graph-card h4, .third-law-key h4 { margin: 0 0 8px; color: #1f2937; font-size: 0.84rem; }
        .force-graph { display: block; width: 100%; height: auto; }
        .third-law-key { background: #eff6ff; }
        .pair-row { display: flex; align-items: center; gap: 8px; margin: 10px 0; color: #1e3a5f; font-size: 0.78rem; line-height: 1.35; }
        .force-arrow { flex: none; color: #dc2626; font-size: 1.45rem; font-weight: 800; }
        .force-arrow-right { color: #2563eb; }
        .third-law-key p { margin: 12px 0 0; padding-top: 10px; border-top: 1px solid #bfdbfe; color: #1e3a5f; font-size: 0.76rem; line-height: 1.45; font-weight: 600; }
        .prelab-slots { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-top: 14px; }
        .prelab-question { min-height: 72px; border: 1px solid #dbe3ee; border-radius: 6px; padding: 10px; background: #ffffff; }
        .prelab-label { display: block; margin-bottom: 7px; color: #2563eb; font-size: 0.68rem; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; }
        @media (max-width: 640px) { .prelab-heading, .third-law-visual { grid-template-columns: 1fr; display: grid; } .prelab-slots, .part1-analysis-grid { grid-template-columns: 1fr; } .measurement-heading { display: block; } .measurement-heading p { margin-top: 3px; text-align: left; } }
        @media (max-width: 640px) { .buzz-slot-grid { grid-template-columns: 1fr; } }
    </style>`
);

const required = [
  'function drawScene()',
  'function drawGraph()',
  'const activity = { mysteryId: \'B\' };',
  '<a:question></a:question>'
];

for (const text of required) {
  if (!html.includes(text)) throw new Error(`Template generation failed: missing ${text}`);
}

const slots = (html.match(/<a:question\s*><\/a:question>/gi) || []).length;
if (slots !== 26) throw new Error(`Template generation failed: expected 26 slots, found ${slots}`);

fs.writeFileSync(outputPath, html);
console.log(`Generated ${path.basename(outputPath)} with ${slots} Buzz slots.`);