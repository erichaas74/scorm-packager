'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = __dirname;
const workspace = path.resolve(root, '..', '..');

const assessments = [
  {
    lesson: 'U1L1',
    dir: 'lesson-1',
    slug: 'u1l1_motion_graphs',
    title: 'Motion Graphs: Mail Carrier Mystery',
    buzzTitle: 'Unit 1 Lesson 1: Motion Graphs - Mail Carrier Mystery',
    template: 'u1l1-motion-graphs-buzz-assessment-template.html',
    preview: 'u1l1-motion-graphs-buzz-assessment-template-preview.html',
    simulation: 'index.html',
    count: 10,
    automaticPoints: 8,
    busybeeQuestionPoints: [3, 4],
    mix: 'five multiple-choice, three numeric, and two essay questions',
    mission: 'Crack a mail-route mystery by making a moving truck and two motion graphs tell the same story! You will follow stops, reversals, slopes, and velocity signs until you can read motion from a graph at a glance.',
    goals: [
      'Connect position-time slope to the magnitude and direction of velocity.',
      'Recognize stops, constant velocity, speeding up, and direction changes on paired graphs.',
      'Use evidence from two fixed explorer cases to defend a motion interpretation.'
    ],
    steps: [
      'Open each of the three fixed cases in the Motion Graph Explorer.',
      'Play or scrub each case and compare the truck, position-time graph, and velocity-time graph.',
      'Answer Questions 1-8 using the fixed graph relationships and calculations.',
      'Use one named case as evidence in Question 9.',
      'Compare two named cases and both graph types in Question 10.'
    ],
    checks: [
      'All three cases play, reset, and scrub without loading an external resource.',
      'Both graph markers follow the selected time and agree with the numerical readouts.',
      'All 10 Buzz questions appear in order below the explorer.'
    ],
    note: 'The standalone index.html remains an optional practice application; grading belongs to the native Buzz assessment.'
  },
  {
    lesson: 'U1L2',
    dir: 'lesson-2',
    slug: 'u1l2_city_blocks',
    title: 'City Blocks Challenge',
    buzzTitle: 'Unit 1 Lesson 2: City Blocks Challenge',
    template: 'u1l2-city-blocks-buzz-assessment-template.html',
    preview: 'u1l2-city-blocks-buzz-assessment-template-preview.html',
    simulation: 'index.html',
    count: 10,
    automaticPoints: 8,
    busybeeQuestionPoints: [3, 4],
    mix: 'three multiple-choice, five numeric, and two essay questions',
    mission: 'Navigate a city like a motion-planning expert! You will build routes that hit exact distance, displacement, speed, and velocity targets—and discover why waiting can be part of a winning physics strategy.',
    goals: [
      'Distinguish route distance from start-to-finish displacement.',
      'Calculate average speed and average velocity from route evidence.',
      'Explain how backtracking and waiting change motion quantities differently.'
    ],
    steps: [
      'Complete all six City Blocks levels and watch both target columns.',
      'Use WAIT when a rate target requires more elapsed time without more motion.',
      'Answer Questions 1-8 using the fixed level targets.',
      'Use one completed route calculation in Question 9.',
      'Compare a displacement level with a rate level in Question 10.'
    ],
    checks: [
      'All six levels load and mark passed levels correctly.',
      'Level 4, Level 5, and Level 6 target times reproduce 8, 10, and 8 minutes.',
      'The evidence report updates and all 10 questions appear in order.'
    ],
    note: 'The evidence download remains an optional reference convenience; no uploaded file earns or replaces assessment points.'
  },
  {
    lesson: 'U1L3',
    dir: 'lesson-3',
    slug: 'u1l3_galileo',
    title: 'Galileo Acceleration Lab',
    buzzTitle: 'Unit 1 Lesson 3: Galileo Acceleration Lab',
    template: 'u1l3-galileo-buzz-assessment-template.html',
    preview: 'u1l3-galileo-buzz-assessment-template-preview.html',
    simulation: 'index.html',
    count: 10,
    automaticPoints: 10,
    busybeeQuestionPoints: [2, 3],
    completedProvidedChart: true,
    mix: 'five numeric, three multiple-choice, and two essay questions',
    mission: 'Recreate Galileo’s breakthrough with a digital falling object! You will measure equal time intervals, uncover odd- and square-number patterns, and turn a table of distances into evidence for constant acceleration.',
    goals: [
      'Measure free-fall distance at fixed times and calculate interval distances.',
      'Recognize the odd-number and square-number patterns produced by constant acceleration.',
      'Evaluate experimental evidence and measurement uncertainty.'
    ],
    steps: [
      'Drop or scrub the ball to every marked time from 0.1 s through 0.7 s.',
      'Complete the distance, interval-distance, interval-ratio, and total-ratio columns in order.',
      'Answer Questions 1-8 using the fixed table values and patterns.',
      'Cite at least two completed rows in Question 9.',
      'Connect both mathematical patterns and one uncertainty source in Question 10.'
    ],
    checks: [
      'The four table stages unlock in order and accept the expected free-fall values.',
      'The completed chart reveals after every column is correct.',
      'All 10 questions render; no file upload question remains.'
    ],
    note: 'The optional image download is for student reference only and is not part of grading.'
  },
  {
    lesson: 'U1L4',
    dir: 'lesson-4',
    slug: 'u1l4_reaction_time',
    title: 'Reaction Time Kinematics Lab',
    buzzTitle: 'Unit 1 Lesson 4: Reaction Time Kinematics Lab',
    template: 'u1l4-reaction-time-buzz-assessment-template.html',
    preview: 'u1l4-reaction-time-buzz-assessment-template-preview.html',
    simulation: 'index.html',
    count: 10,
    automaticPoints: 8,
    busybeeQuestionPoints: [3, 4],
    mix: 'three multiple-choice, five numeric, and two essay questions',
    mission: 'Put your reflexes on the clock, then watch a split-second delay grow into a race-deciding gap! You will connect ruler drops, drag racing, and sprint starts with constant-acceleration and constant-speed models.',
    goals: [
      'Calculate reaction time from a falling-ruler distance.',
      'Predict how reaction delay affects an accelerating drag race and a constant-speed sprint.',
      'Compare visual and auditory trial evidence using human-response limits.'
    ],
    steps: [
      'Record multiple clean falling-ruler trials in Level 1.',
      'Complete drag-race trials on the canonical 300 m strip in Level 2.',
      'Complete auditory sprint trials in Level 3 and note false-start behavior.',
      'Answer Questions 1-8 using the fixed calculations and concepts.',
      'Use evidence from your visual, drag-race, and sprint trials in Questions 9-10.'
    ],
    checks: [
      'The ruler, 300 m drag strip, and sprint interactions all work.',
      'The fixed calculations reproduce 0.200 s, about 3.87 s, about 23 m, and 1.5 m.',
      'All 10 questions remain grouped beneath the matching levels.'
    ],
    note: 'Keep the 300 m primary lesson as canonical; the retired 320 m alternate build does not match the assessment.'
  },
  {
    lesson: 'U1L5',
    dir: 'lesson-5',
    slug: 'u1l5_skydiver',
    title: 'Skydiver Graphs and Formation Dive',
    buzzTitle: 'Unit 1 Lesson 5: Skydiver Graphs and Formation Dive',
    template: 'u1l5-skydiver-buzz-assessment-template.html',
    preview: 'u1l5-skydiver-buzz-assessment-template-preview.html',
    simulation: 'sky-dive-lab.html',
    count: 10,
    automaticPoints: 8,
    busybeeQuestionPoints: [3, 4],
    mix: 'six multiple-choice, two numeric, and two essay questions',
    mission: 'Dive into motion graphs from a skydiver’s point of view! You will chase terminal velocity, change drag with body position, hold formation, and explain why a falling partner can appear to rise.',
    goals: [
      'Interpret velocity-time slope, constant velocity, and acceleration-time sign.',
      'Connect body position and parachute deployment to drag and terminal velocity.',
      'Explain formation changes using ground-frame and relative-motion evidence.'
    ],
    steps: [
      'Play the fixed scripted jump and inspect both graph types.',
      'Complete a formation dive using Dive, Neutral, and Spread positions.',
      'Deploy the parachute and observe the velocity, acceleration, and relative-altitude graphs.',
      'Answer Questions 1-8 using the fixed graph relationships.',
      'Use specific evidence from your own formation dive in Questions 9-10.'
    ],
    checks: [
      'Both scripted and formation-dive simulations run and reset.',
      'Body-position changes and parachute deployment visibly change the graphs.',
      'All 10 questions appear and the final two are written evidence responses.'
    ],
    note: 'No screenshot or evidence file is required; students cite the live readouts and graph features in writing.'
  },
  {
    lesson: 'U1H',
    dir: 'lesson-honors',
    slug: 'u1h_rocket_launch',
    title: 'Mission Control Retro-Burn Landing',
    buzzTitle: 'Unit 1 Honors: Mission Control Retro-Burn Landing',
    template: 'u1h-rocket-launch-buzz-assessment-template.html',
    preview: 'u1h-rocket-launch-buzz-assessment-template-preview.html',
    simulation: 'index.html',
    count: 10,
    automaticPoints: 8,
    busybeeQuestionPoints: [3, 4],
    mix: 'eight numeric and two essay questions',
    mission: 'Take the flight engineer’s chair and reconstruct a four-phase rocket mission! You will calculate the powered burn, coast to apex, free fall, and retro burn before explaining how the velocity and acceleration story fits together.',
    goals: [
      'Apply constant-acceleration equations across connected flight phases.',
      'Calculate apex height, flight time, total distance, and touchdown behavior.',
      'Distinguish velocity, acceleration, distance, and displacement in a complete mission.'
    ],
    steps: [
      'Run the fixed powered-burn section and calculate its displacement and cutoff velocity.',
      'Run the coast and apex sections and calculate the added height and time.',
      'Run the complete mission with readouts hidden.',
      'Answer Questions 1-8 using the fixed 20 m/s², 2.5 s mission.',
      'Use the full path and all four phases in Questions 9-10.'
    ],
    checks: [
      'All four fixed-mission simulations load without a neighboring file.',
      'The numeric keys reproduce 62.5 m, 50 m/s, 187.5 m, about 15 s, and about 375 m.',
      'All 10 questions render and the document-wide integrity guard is present.'
    ],
    note: 'Run build-u1h-buzz-template.js from the Unit 1 folder whenever the rocket source changes; the Unit 1 builder invokes it automatically.'
  }
];

function read(file) {
  return fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
}

function property(block, key) {
  return ((block.match(new RegExp(`^${key}:\\s*(.+)$`, 'm')) || [])[1] || '').trim();
}

function questionBlocks(item) {
  const text = read(path.join(root, item.dir, 'buzz-assessment-questions.txt')).trim();
  return text.split(/\n\s*\n(?=Type:\s*)/).filter(Boolean);
}

function buildSetup(item) {
  const dir = path.join(root, item.dir);
  const setupPath = path.join(dir, `${item.slug}_buzz_setup.txt`);
  const numberedSteps = item.steps.concat([
    `Before submitting, confirm that all ${item.count} questions are answered and the final two responses cite recorded evidence.`
  ]).map((step, index) => `${index + 1}. ${step}`);
  const output = [
    item.title.toUpperCase(),
    'UNIT 1 BUZZ LAB GUIDE',
    '',
    'YOUR MISSION',
    item.mission,
    '',
    'WHAT YOU WILL DO AND LEARN',
    ...item.goals.map((goal) => `- ${goal}`),
    '',
    'HOW TO COMPLETE THE LAB',
    ...numberedSteps,
    '',
    'SUCCESS AND SCORING',
    `- The assessment is worth 15 points: ${item.automaticPoints} auto-graded points plus ${15 - item.automaticPoints} BusyBee points.`,
    `- The final two evidence responses are worth ${item.busybeeQuestionPoints[0]} points and ${item.busybeeQuestionPoints[1]} points.`,
    item.completedProvidedChart
      ? '- This lesson uses 10 automatic points because students complete the provided Galileo data chart.'
      : '- This lesson does not use the 10-automatic-point chart model; its live evidence is evaluated in the final BusyBee responses.',
    '- No file upload earns or replaces points.',
    '',
    'TEACHER BUZZ SETUP',
    `1. Create a Buzz Assessment titled "${item.buzzTitle}".`,
    `2. Import the ${item.count} questions from buzz-assessment-questions.txt.`,
    `3. Confirm the import creates ${item.count} questions worth 15 points: ${item.mix}.`,
    `4. Upload ${item.template} from this folder as the assessment template.`,
    '5. Turn question randomization/shuffling OFF and one-question-per-page OFF.',
    '6. Preserve the authored feedback and Meta-grading fields; the final two essays route to BusyBee.',
    `7. Use ${item.preview} for placement checks only; never upload the preview as the template.`,
    '',
    'PUBLISHING AND PREVIEW CHECKS',
    ...item.checks.map((check) => `- ${check}`),
    '- Copy, cut, paste, keyboard clipboard shortcuts, and the context menu are intentionally blocked by the assessment integrity guard.',
    '- Keyboard navigation and all lab controls remain available.',
    `- ${item.note}`,
    '',
    'AUTHORITATIVE FILES',
    '- Questions, answer feedback, and BusyBee rubrics: buzz-assessment-questions.txt',
    `- Buzz assessment template: ${item.template}`,
    `- Generated local preview: ${item.preview}`,
    ''
  ].join('\n');

  fs.writeFileSync(setupPath, output, 'utf8');
  for (const legacy of ['setup-instructions.html', `${item.slug}_buzz_setup.html`]) {
    const legacyPath = path.join(dir, legacy);
    if (fs.existsSync(legacyPath)) fs.unlinkSync(legacyPath);
  }
  console.log(`Built ${path.relative(root, setupPath)}`);
}

function buildMetadata(item) {
  const blocks = questionBlocks(item);
  const questions = blocks.map((block, index) => ({
    id: `${item.lesson}-Q${String(index + 1).padStart(2, '0')}`,
    buzzIndex: index + 1,
    buzzType: property(block, 'Type'),
    points: Number(property(block, 'Score')),
    objective: property(block, 'Meta-skill'),
    grading: property(block, 'Meta-grading'),
    evidence: property(block, 'Meta-evidence') || null,
    prompt: ((block.match(/^\d+\)\s*(.+)$/m) || [])[1] || '').trim(),
    rubricText: block.split('\n').filter((line) => /^@\[Always\]|^a\. Full credit:|^\s+Partial credit:|^\s+No credit:/.test(line)).join('\n') || null
  }));

  const metadata = {
    schema: 'busybee-rubric/v1',
    lastUpdated: '2026-08-11',
    lesson: {
      unit: 'U1',
      lesson: item.lesson,
      title: item.title,
      activityType: 'self-contained-buzz-template',
      simulationFile: `unit-1/${item.dir}/${item.template}`,
      buzzAssessmentTitle: item.buzzTitle
    },
    assessmentSettings: {
      questionOrderLocked: true,
      randomizeQuestions: false,
      oneQuestionPerPage: false,
      totalPoints: 15,
      automaticPoints: item.automaticPoints,
      busybeePoints: 15 - item.automaticPoints,
      finalBusyBeeQuestionPoints: item.busybeeQuestionPoints,
      completedProvidedChart: !!item.completedProvidedChart,
      requiredUploads: []
    },
    gradingDesign: {
      automaticQuestions: questions.filter((question) => question.grading === 'auto').map((question) => question.id),
      busybeeQuestions: questions.filter((question) => question.grading === 'busybee').map((question) => question.id),
      rule: 'All variable student evidence is graded only in the final two BusyBee responses.'
    },
    questions
  };

  const target = path.join(root, item.dir, 'busybee-rubric-metadata.json');
  fs.writeFileSync(target, `${JSON.stringify(metadata, null, 2)}\n`, 'utf8');
  console.log(`Built ${path.relative(root, target)}`);
}

function buildLabNotes(item) {
  const output = [
    `Unit 1 ${item.lesson === 'U1H' ? 'Honors' : `Lesson ${item.lesson.slice(-1)}`} - ${item.title}`,
    'Canonical Buzz application status',
    '',
    'Delivery design',
    `- Standalone practice application: ${item.simulation}`,
    `- Self-contained Buzz template: ${item.template}`,
    `- Generated preview: ${item.preview}`,
    `- Generated setup guide: ${item.slug}_buzz_setup.txt`,
    '- Native Buzz question source: buzz-assessment-questions.txt',
    '- BusyBee metadata: busybee-rubric-metadata.json',
    '',
    'Assessment contract',
    `- ${item.count} questions worth 15 total points (${item.mix}).`,
    `- Automatic questions total ${item.automaticPoints} points.`,
    `- The final two BusyBee responses are worth ${item.busybeeQuestionPoints[0]} and ${item.busybeeQuestionPoints[1]} points.`,
    '- No required file upload, SCORM package, application ZIP, or Rise directions file.',
    '- Question randomization and one-question-per-page must remain off.',
    '- Preserve the document-wide copy/cut/paste/context-menu integrity guard.',
    '',
    'Maintenance',
    '- Run node unit-ApplicationFiles/unit-1/build-unit1-buzz-assessments.js after editing a template, question bank, or setup definition.',
    '- Run node unit-ApplicationFiles/unit-1/validate-unit1-buzz-assessments.js before publishing.',
    `- ${item.note}`,
    ''
  ].join('\n');
  const target = path.join(root, item.dir, 'lab-format-suggestions.txt');
  fs.writeFileSync(target, output, 'utf8');
  console.log(`Built ${path.relative(root, target)}`);
}

function verifyTemplate(item) {
  const templatePath = path.join(root, item.dir, item.template);
  const html = read(templatePath);
  const slots = (html.match(/<a:question\s*><\/a:question>|<a:question\s*\/>/gi) || []).length;
  if (slots !== item.count) throw new Error(`${item.lesson}: ${slots} template slots, expected ${item.count}`);
  if (!html.includes('id="buzz-assessment-integrity-guard"')) throw new Error(`${item.lesson}: missing integrity guard`);
  if (/(?:src|href)=["']https?:\/\//i.test(html) || /@import\s+url\(["']?https?:\/\//i.test(html)) {
    throw new Error(`${item.lesson}: external template dependency detected`);
  }
}

require('./build-u1h-buzz-template.js');
assessments.forEach(verifyTemplate);
assessments.forEach(buildSetup);
assessments.forEach(buildMetadata);
assessments.forEach(buildLabNotes);

const previewBuilder = path.join(workspace, 'unit-buzz-template-conversion-files', 'build-buzz-template-previews.js');
const previewBuild = spawnSync(process.execPath, [previewBuilder, 'unit-ApplicationFiles/unit-1'], {
  cwd: workspace,
  stdio: 'inherit'
});
if (previewBuild.status !== 0) process.exit(previewBuild.status || 1);

console.log('Built all Unit 1 Buzz assessments, previews, metadata, notes, and TXT setup guides.');
