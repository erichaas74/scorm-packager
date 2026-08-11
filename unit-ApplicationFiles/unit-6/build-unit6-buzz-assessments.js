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

const setupGuides = [
  {
    slug: 'millikan_oil_drop',
    dir: 'millikan-oil-drop-investigation',
    title: 'Millikan Oil Drop Investigation',
    buzzTitle: 'Unit 6 Lesson 1: Millikan Oil Drop Investigation',
    questions: 'buzz-assessment-questions.txt',
    template: 'u6l1-millikan-buzz-assessment-template.html',
    preview: 'u6l1-millikan-buzz-assessment-template-preview.html',
    count: 10,
    mix: 'three numeric, five multiple-choice, and two essay questions',
    mission: 'Suspend tiny charged drops in midair and uncover one of physics’ most important patterns! You will balance electric and gravitational forces, calculate relative charge, and use whole-number evidence to reveal that electric charge comes in discrete packets.',
    goals: [
      'Explain the force-balance condition for a suspended charged drop.',
      'Calculate relative charge from the model balance voltage.',
      'Use repeated whole-number results to support a claim about charge quantization.'
    ],
    steps: [
      'Adjust the plate voltage until the balance indicator confirms that the electric and gravitational forces are balanced.',
      'Record the balance voltage, atomize a new drop, and repeat until the evidence table contains six drops.',
      'Compare the calculated q/e values and look for the whole-number pattern across the trials.',
      'Answer all 10 Buzz questions in order and cite at least three evidence-table rows in the final responses.',
      'Export the evidence CSV only if you want a personal record; it is not submitted or graded.'
    ],
    checks: [
      'All six drops can be balanced and recorded, and the relative-charge values populate correctly.',
      'The force vectors, evidence table, and scaled-model note remain visible and usable.',
      'The optional CSV export works after evidence is recorded.'
    ],
    note: 'This is a scaled charge-pattern model; it does not reproduce every measurement required in a physical Millikan experiment.'
  },
  {
    slug: 'dynamic_electric_field',
    dir: 'dynamic-electric-field-lab',
    title: 'Dynamic Electric-Field Motion Lab',
    buzzTitle: 'Unit 6 Lesson 2: Dynamic Electric-Field Motion Lab',
    questions: 'dynamic_electric_field_buzz_questions.txt',
    template: 'u6l2-dynamic-electric-field-buzz-assessment-template.html',
    preview: 'u6l2-dynamic-electric-field-buzz-assessment-template-preview.html',
    count: 8,
    mix: 'two numeric, four multiple-choice, and two essay questions',
    mission: 'Become an electric-field navigator! You will arrange source charges, launch a positive test charge, and reshape its path using invisible fields and vector addition until it reaches each target.',
    goals: [
      'Predict electric-field direction around positive and negative source charges.',
      'Connect electric field, force, acceleration, and changing velocity.',
      'Use vector addition to explain a curved path created by multiple charges.'
    ],
    steps: [
      'Complete the field-direction warm-up and inspect the vectors acting on the positive test charge.',
      'Solve the first two one-charge challenges by choosing the correct source-charge sign and location.',
      'Complete Challenge 3 by combining fields to guide the test charge around the barrier.',
      'Review the three successful runs in the evidence table and answer all eight Buzz questions in order.',
      'Use the saved charge arrangements in the final two responses. The evidence PNG is optional and not graded.'
    ],
    checks: [
      'All three core challenges can be completed and record their source-charge arrangements.',
      'Field, force, acceleration, and velocity vectors update during a run.',
      'The optional evidence PNG unlocks only after all core evidence is complete.'
    ],
    note: 'Confirm drag, keyboard, and touch controls all allow students to place and adjust charges.'
  },
  {
    slug: 'circuit_design_challenge',
    dir: 'circuit-design-challenge',
    title: 'Circuit Design Challenge',
    buzzTitle: 'Unit 6 Lesson 3: Circuit Design Challenge',
    questions: 'buzz-assessment-questions.txt',
    template: 'u6l3-circuit-design-buzz-assessment-template.html',
    preview: 'u6l3-circuit-design-buzz-assessment-template-preview.html',
    count: 10,
    mix: 'five numeric, three multiple-choice, and two essay questions',
    mission: 'Wire a reliable three-room electrical system like an engineer! You will measure current and voltage, compare series and parallel circuits, test failures and switches, and defend a design that keeps every room working independently.',
    goals: [
      'Apply Ohms law and equivalent resistance to series and parallel circuits.',
      'Use ammeter and voltmeter evidence to compare circuit arrangements.',
      'Defend a parallel household-style design while recognizing its current tradeoff.'
    ],
    steps: [
      'Complete the eight circuit missions in order and avoid creating a direct short across the battery.',
      'Place the ammeter in series and the voltmeter across a component, then record model evidence for each mission.',
      'Test series and parallel bulb failures and all four switch combinations.',
      'Build the final three-room circuit and confirm that every design requirement passes.',
      'Answer all 10 Buzz questions using the evidence tables. Any downloaded report is optional and not graded.'
    ],
    checks: [
      'The circuit builder, meters, switches, failure tests, and evidence notebook respond.',
      'All eight missions can record evidence and the final design can satisfy all six requirements.',
      'The report download remains optional and does not affect the Buzz score.'
    ],
    note: 'Use meter readings, not electron-animation speed, as quantitative evidence.'
  },
  {
    slug: 'electromagnet',
    dir: 'electromagnet-lab',
    title: 'Electromagnet Design Lab',
    buzzTitle: 'Unit 6 Lesson 4: Electromagnet Design Lab',
    questions: 'electromagnet_buzz_questions.txt',
    template: 'u6l4-electromagnet-design-buzz-assessment-template.html',
    preview: 'u6l4-electromagnet-design-buzz-assessment-template-preview.html',
    count: 10,
    mix: 'five numeric, three multiple-choice, and two essay questions',
    mission: 'Build an electromagnet strong enough to win an engineering challenge! You will control coil turns, core material, diameter, cells, and wiring while balancing magnetic strength against wire and budget limits.',
    goals: [
      'Explain how current, coil turns, and core material affect an electromagnet.',
      'Design controlled-variable trials and interpret current and lifting data.',
      'Optimize a device while explaining resource and performance tradeoffs.'
    ],
    steps: [
      'Predict the result of each required change before running the trial.',
      'Complete and record fixed Trials 1-5 without changing extra variables.',
      'Use the remaining controls to create an optimized design within the 250 cm wire and 50.00 budget limits.',
      'Complete the optimization goal, then answer all 10 Buzz questions using the trial table.',
      'Cite measured values in the final two responses. The evidence PNG is optional and not graded.'
    ],
    checks: [
      'All five fixed trials reproduce the intended current and paperclip results.',
      'The wire-length, cost, current, and lifting readouts respond to every design control.',
      'The optional evidence PNG unlocks only after the fixed trials and optimization are complete.'
    ],
    note: 'Paperclip count is a classroom strength index, not a manufacturer performance prediction.'
  },
  {
    slug: 'generator_design_challenge',
    dir: 'generator-design-challenge',
    title: 'Generator Design Challenge',
    buzzTitle: 'Unit 6 Lesson 5: Generator Design Challenge',
    questions: 'buzz-assessment-questions.txt',
    template: 'u6l5-generator-buzz-assessment-template.html',
    preview: 'u6l5-generator-buzz-assessment-template-preview.html',
    count: 10,
    mix: 'two numeric, six multiple-choice, and two essay questions',
    mission: 'Turn motion into electricity and chase the brightest possible generator! You will control water flow, magnet strength, coil loops, and coil area while watching Faraday’s law come alive in the turbine, voltmeter, and bulb.',
    goals: [
      'Explain why changing magnetic flux produces an induced EMF.',
      'Use controlled-variable trials to identify how generator settings affect output.',
      'Optimize generator output while recognizing the load-speed tradeoff.'
    ],
    steps: [
      'Start the turbine, compare powered rotation with hand rotation, and observe the alternating voltmeter reading.',
      'Change only one variable at a time while testing water flow, magnet strength, coil loops, and coil area.',
      'Record the required controlled-variable evidence cards and compare RPM, peak EMF, and brightness.',
      'Build and record a final high-output design, then answer all 10 Buzz questions in order.',
      'Use two controlled series and the final design in the written responses; no file upload is graded.'
    ],
    checks: [
      'The turbine, magnet, electron motion, bulb, and voltmeter all respond to the controls.',
      'Every controlled-variable evidence card and the final design can be recorded.',
      'The specified and maximum settings reproduce the expected peak-EMF values.'
    ],
    note: 'The simulation is an instructional generator model, not a hardware power-rating tool.'
  },
  {
    slug: 'honors_electric_motor',
    dir: 'honors-electric-motor-engineering-challenge',
    title: 'Honors Electric Motor Engineering Challenge',
    buzzTitle: 'Unit 6 Honors: Electric Motor Engineering Challenge',
    questions: 'buzz-assessment-questions.txt',
    template: 'u6h-motor-buzz-assessment-template.html',
    preview: 'u6h-motor-buzz-assessment-template-preview.html',
    count: 10,
    mix: 'one numeric, seven multiple-choice, and two essay questions',
    mission: 'Engineer a motor for a real performance goal! You will make magnetic force produce torque, test controlled design changes, and optimize speed, load, or power without violating current, heat, mass, and resource constraints.',
    goals: [
      'Explain magnetic torque and the role of the commutator in continuous rotation.',
      'Analyze energy transfers, back EMF, resistance, current, and mechanical losses.',
      'Use systematic trial evidence to justify an optimized motor design.'
    ],
    steps: [
      'Choose an engineering task and adjust the motor until every baseline constraint passes.',
      'Save the baseline, select two investigation variables, and change only one selected variable between trials.',
      'Record at least four systematic trials that test both selected variables.',
      'Create and save a valid optimized design, then compare it quantitatively with the baseline.',
      'Answer all 10 Buzz questions using the trial table and design log. CSV export is optional and not graded.'
    ],
    checks: [
      'The motor animation and electrical, mechanical, thermal, and resource readouts respond.',
      'A valid baseline, four systematic trials, and an optimized design satisfy the evidence gate.',
      'The optional CSV export works and Reset clears teacher-test data.'
    ],
    note: 'Keep the current, heat, mass, and resource constraints active because they define the engineering tradeoffs.'
  }
];

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

function numbered(items) {
  return items.map((value, index) => `${index + 1}. ${value}`);
}

function bullets(items) {
  return items.map((value) => `- ${value}`);
}

function buildSetup(guide) {
  const setupPath = path.join(root, guide.dir, `${guide.slug}_buzz_setup.txt`);
  const legacyHtml = path.join(root, guide.dir, `${guide.slug}_buzz_setup.html`);
  const studentSteps = [
    ...guide.steps,
    `Before submitting, confirm that all ${guide.count} questions are answered and the final two responses cite recorded evidence.`
  ];
  const previewChecks = [
    ...guide.checks,
    `Questions 1-${guide.count} appear in their matching labeled slots and the final two essay questions remain last.`,
    'Keyboard navigation, copy/paste, text selection, and the context menu remain available.',
    'Teacher-test data is reset before students open the assessment.'
  ];
  const output = [
    guide.title.toUpperCase(),
    'UNIT 6 BUZZ LAB GUIDE',
    '',
    'YOUR MISSION',
    guide.mission,
    '',
    'WHAT YOU WILL DO AND LEARN',
    ...bullets(guide.goals),
    '',
    'HOW TO COMPLETE THE LAB',
    ...numbered(studentSteps),
    '',
    'SUCCESS AND SCORING',
    '- The assessment is worth 15 points: 10 auto-graded points plus 5 BusyBee points.',
    '- The final two evidence responses are worth 2 points and 3 points.',
    '- Evidence downloads are optional records. No file upload earns or replaces points.',
    '',
    'TEACHER BUZZ SETUP',
    `1. Create a Buzz Assessment titled "${guide.buzzTitle}".`,
    `2. Import the ${guide.count} questions from ${guide.questions}.`,
    `3. Confirm the import creates ${guide.count} questions worth 15 points: ${guide.mix}.`,
    `4. Upload ${guide.template} from this folder as the assessment template.`,
    '5. Turn question randomization/shuffling OFF and one-question-per-page OFF.',
    `6. Preserve the authored feedback and Meta-grading fields in ${guide.questions}; the final two essays route to BusyBee.`,
    `7. Use ${guide.preview} for the local placement check, never as the upload template.`,
    '',
    'PUBLISHING AND PREVIEW CHECKS',
    ...bullets(previewChecks),
    `- ${guide.note}`,
    '',
    'AUTHORITATIVE FILES',
    `- Questions, answer feedback, and BusyBee rubrics: ${guide.questions}`,
    `- Buzz assessment template: ${guide.template}`,
    `- Generated local preview: ${guide.preview}`,
    ''
  ].join('\n');

  fs.writeFileSync(setupPath, output, 'utf8');
  if (fs.existsSync(legacyHtml)) fs.unlinkSync(legacyHtml);
  console.log(`Built ${path.relative(root, setupPath)}`);
}

function buildMillikan() {
  let html = read('millikan-oil-drop-investigation/millikan_oil_drop_simulation.html');
  html = addBodyClass(html);
  html = addHeadContent(html, `${sharedCss}\n<style>
    .u6-buzz-assessment .u6-legacy-analysis,.u6-buzz-assessment .finish-card{display:none!important}
  </style>`);
  html = html.replace('<section class="card">\n        <h2>Evidence Analysis</h2>', '<section class="card u6-legacy-analysis">\n        <h2>Evidence Analysis</h2>');
  html = html.replace('Use your table as evidence in all six analysis responses.', 'Use the completed table as evidence in the native Buzz questions below.');
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

function buildDynamicElectricField() {
  write(
    'dynamic-electric-field-lab/u6l2-dynamic-electric-field-buzz-assessment-template.html',
    read('dynamic-electric-field-lab/dynamic_electric_field_lab.html')
  );
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
  let html = read('honors-electric-motor-engineering-challenge/honors_electric_motor_engineering_challenge.html');
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

function buildElectromagnet() {
  write(
    'electromagnet-lab/u6l4-electromagnet-design-buzz-assessment-template.html',
    read('electromagnet-lab/electromagnet_lab.html')
  );
}

buildMillikan();
buildDynamicElectricField();
buildCircuit();
buildElectromagnet();
buildGenerator();
buildHonorsMotor();
setupGuides.forEach(buildSetup);
