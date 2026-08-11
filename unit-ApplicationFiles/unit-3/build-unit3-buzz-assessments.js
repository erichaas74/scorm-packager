'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = __dirname;
const workspace = path.resolve(root, '..', '..');

const assessments = [
  {
    lesson: 'U3L1', dir: 'lesson-1', slug: 'u3l1_phet_forces',
    title: 'Forces and Motion: PhET Net Force Investigation',
    buzzTitle: 'Unit 3 Lesson 1: Forces and Motion - PhET Net Force Investigation',
    template: 'u3l1-phet-forces-buzz-assessment-template.html',
    preview: 'u3l1-phet-forces-buzz-assessment-template-preview.html', simulation: 'index.html',
    count: 10, automaticPoints: 8, busybeeQuestionPoints: [3, 4],
    mix: 'three numeric, five multiple-choice, and two essay questions',
    externalDependency: 'phet.colorado.edu',
    mission: 'Take command of a virtual tug-of-war and a refrigerator on wheels! You will make force arrows predict motion, expose the difference between balanced and unbalanced forces, and use two PhET screens to put Newton\'s laws on trial.',
    goals: [
      'Calculate net force from opposing force teams and identify its direction.',
      'Connect nonzero net force to acceleration and zero net force to constant velocity.',
      'Use observations from both PhET screens as evidence for Newton\'s First and Second Laws.'
    ],
    steps: [
      'Open the embedded PhET simulation or use the direct PhET link if your browser blocks the embed.',
      'On Net Force, run the required 100 N left versus 150 N right setup plus one balanced comparison.',
      'On Motion, place the 200 kg refrigerator on the skateboard, apply 100 N right, then return the force to 0 N.',
      'Answer Questions 1-8 from the fixed forces and observations.',
      'Use named evidence from both PhET screens in Questions 9-10.'
    ],
    checks: [
      'The PhET link and iframe reach phet.colorado.edu; the district filter permits that domain.',
      'The required setup produces a 50 N rightward net force.',
      'All 10 Buzz questions appear in order below the lab directions.'
    ],
    note: 'This lesson is intentionally PhET-dependent; keep its direct link available as the iframe fallback.'
  },
  {
    lesson: 'U3L2', dir: 'lesson-2', slug: 'u3l2_golf_club_ct',
    title: 'USGA Golf Club CT Compliance Test',
    buzzTitle: 'Unit 3 Lesson 2: USGA Golf Club CT Compliance Test',
    template: 'u3l2-golf-club-ct-buzz-assessment-template.html',
    preview: 'u3l2-golf-club-ct-buzz-assessment-template-preview.html', simulation: 'usga-golfclub-ct-test.html',
    count: 12, automaticPoints: 10, busybeeQuestionPoints: [2, 3], completedProvidedChart: true,
    mix: 'two multiple-choice, eight numeric, and two essay questions',
    mission: 'Step into the equipment lab as a golf-club compliance engineer! You will fire a pendulum tester, read razor-thin force-time pulses, and decide whether a prototype passes the official CT limit.',
    goals: [
      'Read contact time and peak force from fixed force-time traces.',
      'Relate Newton\'s Third Law force pairs to different accelerations for different masses.',
      'Use a completed compliance chart and the 257-microsecond limit to justify an engineering ruling.'
    ],
    steps: [
      'Answer the two Newton\'s Third Law checks before using the tester.',
      'Test Soft Polymer, Alloy, Thin Titanium, and Thick Titanium and complete Questions 3-8 in the provided chart.',
      'Test Rigid Steel and Prototype X-7 and complete Questions 9-10.',
      'Use at least three chart entries to explain the calibration pattern in Question 11.',
      'File the final compliance ruling with both CT measurements in Question 12.'
    ],
    checks: [
      'All six fixed materials run and draw their force-time traces.',
      'The CT values reproduce 343, 274, 239, 196, 147, and 266 microseconds.',
      'All 12 questions render in the intended chart and analysis positions.'
    ],
    note: 'Run lesson-2/build-buzz-template.js after changing the tester source; this Unit 3 builder invokes it automatically.'
  },
  {
    lesson: 'U3L3', dir: 'lesson-3', slug: 'u3l3_friction_force',
    title: 'Friction Force Lab: Static vs. Kinetic',
    buzzTitle: 'Unit 3 Lesson 3: Friction Force Lab - Static vs. Kinetic',
    template: 'u3l3-friction-force-buzz-assessment-template.html',
    preview: 'u3l3-friction-force-buzz-assessment-template-preview.html', simulation: 'index.html',
    count: 12, automaticPoints: 10, busybeeQuestionPoints: [2, 3], completedProvidedChart: true,
    mix: 'eight numeric, two multiple-choice, and two essay questions',
    mission: 'Become a friction detective! You will pull blocks until they break loose, catch the static-force peak, track the lower sliding force, and use your own completed charts to identify a mystery surface.',
    goals: [
      'Measure maximum static and sliding kinetic friction from force-time graphs.',
      'Calculate coefficients of friction and separate material effects from normal-force effects.',
      'Use chart evidence to identify Unknown A and defend a complete friction conclusion.'
    ],
    steps: [
      'Run the four known materials and complete the Part 1 chart from the graph readings.',
      'Run Wood with +0 kg, +5 kg, and +10 kg and complete the Part 2 calculation chart.',
      'Test Unknown A and calculate its coefficient pair.',
      'Answer Questions 1-10 from the completed charts and force-time graphs.',
      'Use specific values from all three parts in Questions 11-12.'
    ],
    checks: [
      'The material, added-mass, and Unknown A simulations run and reset.',
      'The chart calculations reproduce Wood near 0.42/0.25 and Unknown A near 0.55/0.35.',
      'All 12 questions render and no upload prompt remains.'
    ],
    note: 'Students enter graph readings in the provided charts; they do not upload or recreate a separate report file.'
  },
  {
    lesson: 'U3L4', dir: 'lesson-4', slug: 'u3l4_collision_lab',
    title: 'Collision Lab: Momentum Conservation',
    buzzTitle: 'Unit 3 Lesson 4: Collision Lab - Momentum Conservation',
    template: 'u3l4-collision-lab-buzz-assessment-template.html',
    preview: 'u3l4-collision-lab-buzz-assessment-template-preview.html', simulation: 'collison-lab.html',
    count: 12, automaticPoints: 10, busybeeQuestionPoints: [2, 3], completedProvidedChart: true,
    mix: 'ten numeric and two essay questions',
    mission: 'Run a five-crash momentum investigation! You will track objects that bounce, slow, or stick together and use completed before-and-after charts to uncover the quantity every collision protects.',
    goals: [
      'Calculate signed momentum for objects moving left and right.',
      'Verify system momentum conservation across elastic and inelastic collisions.',
      'Explain zero total momentum, nonconserved velocity sums, and the effect of outside forces.'
    ],
    steps: [
      'Run each of the five fixed collision trials.',
      'Complete the two total-momentum entries in every provided trial chart.',
      'Check signs carefully: right is positive and left is negative.',
      'Use at least two completed trials as evidence in Question 11.',
      'Use Trial 2 and outside-force reasoning in Question 12.'
    ],
    checks: [
      'All five fixed trials run, reset, and confirm their chart entries.',
      'The before-and-after totals reproduce 3.00, 0.00, 7.50, 4.25, and 1.50 kg*m/s.',
      'All 12 questions remain paired with the correct charts and final analysis.'
    ],
    note: 'The original standalone filename collison-lab.html is retained so existing local references continue to work.'
  },
  {
    lesson: 'U3L5', dir: 'lesson-5', slug: 'u3l5_impulse_jump',
    title: 'Impulse Jump Lab',
    buzzTitle: 'Unit 3 Lesson 5: Impulse Jump Lab',
    template: 'u3l5-impulse-jump-buzz-assessment-template.html',
    preview: 'u3l5-impulse-jump-buzz-assessment-template-preview.html', simulation: 'impulse-jump-lab.html',
    count: 10, automaticPoints: 8, busybeeQuestionPoints: [3, 4],
    mix: 'seven numeric, one multiple-choice, and two essay questions',
    mission: 'Turn a jump into a chain of physics evidence! You will measure the area under a force-time pulse, convert it to momentum and takeoff speed, and predict how high the athlete rises.',
    goals: [
      'Read peak force and contact time and calculate impulse from graph area.',
      'Apply the impulse-momentum theorem to find takeoff velocity and jump height.',
      'Compare graph shape, force, time, impulse, and performance across jump profiles.'
    ],
    steps: [
      'Run the gold Required Assessment Jump to draw the fixed triangular graph.',
      'Answer Questions 1-8 through the calculation ladder from contact time to height.',
      'Run at least one named practice profile and compare its graph with the required jump.',
      'Show the full fixed calculation chain in Question 9.',
      'Use evidence from both graphs in Question 10.'
    ],
    checks: [
      'The required and practice jump buttons draw force-time graphs and animate the jumper.',
      'The fixed calculation reproduces about 300 N*s, 4.0 m/s, and 0.82 m.',
      'All 10 questions render and the standalone animator dependency resolves.'
    ],
    note: 'The displayed graph is analyzed but not filled in by the student, so this lesson uses 8 automatic points rather than the 10-point chart model.'
  }
];

function read(file) { return fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n'); }
function property(block, key) { return ((block.match(new RegExp(`^${key}:\\s*(.+)$`, 'm')) || [])[1] || '').trim(); }
function questionBlocks(item) {
  return read(path.join(root, item.dir, 'buzz-assessment-questions.txt')).trim().split(/\n\s*\n(?=Type:\s*)/).filter(Boolean);
}

function buildSetup(item) {
  const dir = path.join(root, item.dir);
  const target = path.join(dir, `${item.slug}_buzz_setup.txt`);
  const numberedSteps = item.steps.concat([`Before submitting, confirm that all ${item.count} questions are answered and the final two responses cite recorded evidence.`]);
  const scoringRule = item.completedProvidedChart
    ? '- This lesson uses 10 automatic points because students complete a provided data or measurement chart.'
    : '- This lesson does not use the 10-automatic-point chart model because students do not fill a provided chart.';
  const externalRule = item.externalDependency
    ? `- This lesson intentionally depends on ${item.externalDependency}; allow that domain in the student browser and district filter.`
    : '- The Buzz template is self-contained and does not load an external lab resource.';
  const output = [
    item.title.toUpperCase(), 'UNIT 3 BUZZ LAB GUIDE', '',
    'YOUR MISSION', item.mission, '',
    'WHAT YOU WILL DO AND LEARN', ...item.goals.map((goal) => `- ${goal}`), '',
    'HOW TO COMPLETE THE LAB', ...numberedSteps.map((step, index) => `${index + 1}. ${step}`), '',
    'SUCCESS AND SCORING',
    `- The assessment is worth 15 points: ${item.automaticPoints} auto-graded points plus ${15 - item.automaticPoints} BusyBee points.`,
    `- The final two evidence responses are worth ${item.busybeeQuestionPoints[0]} points and ${item.busybeeQuestionPoints[1]} points.`,
    scoringRule, '- No file upload earns or replaces points.', '',
    'TEACHER BUZZ SETUP',
    `1. Create a Buzz Assessment titled "${item.buzzTitle}".`,
    `2. Import the ${item.count} questions from buzz-assessment-questions.txt.`,
    `3. Confirm the import creates ${item.count} questions worth 15 points: ${item.mix}.`,
    `4. Upload ${item.template} as the assessment template.`,
    '5. Turn question randomization/shuffling OFF and one-question-per-page OFF.',
    '6. Preserve the authored feedback and Meta-grading fields; the final two essays route to BusyBee.',
    `7. Use ${item.preview} for placement checks only; never upload the preview as the template.`, '',
    'PUBLISHING AND PREVIEW CHECKS', ...item.checks.map((check) => `- ${check}`), externalRule,
    '- Copy, cut, paste, keyboard clipboard shortcuts, and the context menu are intentionally blocked by the assessment integrity guard.',
    '- Keyboard navigation and all lab controls remain available.', `- ${item.note}`, '',
    'AUTHORITATIVE FILES', '- Questions, answer feedback, and BusyBee rubrics: buzz-assessment-questions.txt',
    `- Buzz assessment template: ${item.template}`, `- Generated local preview: ${item.preview}`, ''
  ].join('\n');
  fs.writeFileSync(target, output, 'utf8');
  for (const legacy of ['setup-instructions.html', `${item.slug}_buzz_setup.html`]) {
    const legacyPath = path.join(dir, legacy);
    if (fs.existsSync(legacyPath)) fs.unlinkSync(legacyPath);
  }
  console.log(`Built ${path.relative(root, target)}`);
}

function buildMetadata(item) {
  const questions = questionBlocks(item).map((block, index) => ({
    id: `${item.lesson}-Q${String(index + 1).padStart(2, '0')}`,
    buzzIndex: index + 1, buzzType: property(block, 'Type'), points: Number(property(block, 'Score')),
    objective: property(block, 'Meta-skill'), grading: property(block, 'Meta-grading'),
    evidence: property(block, 'Meta-evidence') || null,
    prompt: ((block.match(/^\d+\)\s*(.+)$/m) || [])[1] || '').trim(),
    rubricText: block.split('\n').filter((line) => /^@\[Always\]|^a\. Full credit:|^\s+Partial credit:|^\s+No credit:/.test(line)).join('\n') || null
  }));
  const metadata = {
    schema: 'busybee-rubric/v1', lastUpdated: '2026-08-11',
    lesson: { unit: 'U3', lesson: item.lesson, title: item.title, activityType: item.externalDependency ? 'phet-dependent-buzz-template' : 'self-contained-buzz-template', simulationFile: `unit-3/${item.dir}/${item.template}`, buzzAssessmentTitle: item.buzzTitle },
    assessmentSettings: { questionOrderLocked: true, randomizeQuestions: false, oneQuestionPerPage: false, totalPoints: 15, automaticPoints: item.automaticPoints, busybeePoints: 15 - item.automaticPoints, finalBusyBeeQuestionPoints: item.busybeeQuestionPoints, completedProvidedChart: !!item.completedProvidedChart, requiredUploads: [] },
    externalDependency: item.externalDependency || null,
    gradingDesign: {
      automaticQuestions: questions.filter((question) => question.grading === 'auto').map((question) => question.id),
      busybeeQuestions: questions.filter((question) => question.grading === 'busybee').map((question) => question.id),
      rule: 'Only lessons with a completed provided chart use 10 automatic points; variable student evidence is graded in the final two BusyBee responses.'
    },
    questions
  };
  const target = path.join(root, item.dir, 'busybee-rubric-metadata.json');
  fs.writeFileSync(target, `${JSON.stringify(metadata, null, 2)}\n`, 'utf8');
  console.log(`Built ${path.relative(root, target)}`);
}

function buildLabNotes(item) {
  const output = [
    `Unit 3 Lesson ${item.lesson.slice(-1)} - ${item.title}`, 'Canonical Buzz application status', '',
    'Delivery design', `- Standalone practice application: ${item.simulation}`, `- Buzz template: ${item.template}`,
    `- Generated preview: ${item.preview}`, `- Generated setup guide: ${item.slug}_buzz_setup.txt`,
    '- Native Buzz question source: buzz-assessment-questions.txt', '- BusyBee metadata: busybee-rubric-metadata.json', '',
    'Assessment contract', `- ${item.count} questions worth 15 total points (${item.mix}).`,
    `- Automatic questions total ${item.automaticPoints} points.`,
    `- The final two BusyBee responses are worth ${item.busybeeQuestionPoints[0]} and ${item.busybeeQuestionPoints[1]} points.`,
    `- Completed provided chart: ${item.completedProvidedChart ? 'yes' : 'no'}.`,
    '- No required file upload, SCORM package, application ZIP, or Rise directions file.',
    '- Question randomization and one-question-per-page must remain off.',
    '- Preserve the document-wide copy/cut/paste/context-menu integrity guard.', '',
    'Maintenance', '- Run node unit-ApplicationFiles/unit-3/build-unit3-buzz-assessments.js after editing a template, question bank, or setup definition.',
    '- Run node unit-ApplicationFiles/unit-3/validate-unit3-buzz-assessments.js before publishing.', `- ${item.note}`, ''
  ].join('\n');
  const target = path.join(root, item.dir, 'lab-format-suggestions.txt');
  fs.writeFileSync(target, output, 'utf8');
  console.log(`Built ${path.relative(root, target)}`);
}

function verifyTemplate(item) {
  const html = read(path.join(root, item.dir, item.template));
  const slots = (html.match(/<a:question\s*><\/a:question>|<a:question\s*\/>/gi) || []).length;
  if (slots !== item.count) throw new Error(`${item.lesson}: ${slots} template slots, expected ${item.count}`);
  if (!html.includes('id="buzz-assessment-integrity-guard"')) throw new Error(`${item.lesson}: missing integrity guard`);
  const external = [...html.matchAll(/(?:src|href)=["'](https?:\/\/[^"']+)/gi)].map((match) => match[1]);
  if (!item.externalDependency && external.length) throw new Error(`${item.lesson}: external template dependency detected`);
  if (item.externalDependency && external.some((url) => !new URL(url).hostname.endsWith(item.externalDependency))) throw new Error(`${item.lesson}: unexpected external dependency detected`);
}

require('./lesson-2/build-buzz-template.js');
assessments.forEach(verifyTemplate);
assessments.forEach(buildSetup);
assessments.forEach(buildMetadata);
assessments.forEach(buildLabNotes);

const previewBuilder = path.join(workspace, 'unit-buzz-template-conversion-files', 'build-buzz-template-previews.js');
const previewBuild = spawnSync(process.execPath, [previewBuilder, 'unit-ApplicationFiles/unit-3'], { cwd: workspace, stdio: 'inherit' });
if (previewBuild.status !== 0) process.exit(previewBuild.status || 1);

console.log('Built all Unit 3 Buzz assessments, previews, metadata, notes, and TXT setup guides.');
