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
    applicationAssignment: true,
    completionQuestionCount: 15,
    count: 0,
    automaticPoints: 15,
    busybeeQuestionPoints: [],
    mix: 'no native Buzz questions; the SCORM SCO reports one point for each answered required item',
    mission: 'Crack a mail-route mystery by making a moving truck and two motion graphs tell the same story! You will follow stops, reversals, slopes, and velocity signs until you can read motion from a graph at a glance.',
    goals: [
      'Connect position-time slope to the magnitude and direction of velocity.',
      'Recognize stops, constant velocity, speeding up, and direction changes on paired graphs.',
      'Complete the 15 required application questions using motion evidence.'
    ],
    steps: [
      'Use Explore Cases to investigate the truck, position-time graph, and velocity-time graph.',
      'Open Assignment Questions and complete required Questions 1-15.',
      'Use the feedback to review each answer; correctness does not change completion credit.',
      'Questions 16-20 are optional and do not affect assignment completion.'
    ],
    checks: [
      'The self-contained application loads without an external dependency.',
      'All 15 required questions record completion after an answer is submitted.',
      'Questions 16-20 remain visibly optional and do not increase the 15-point completion score.',
      'The template contains no native Buzz question slots.',
      'The SCORM 1.2 SCO reports cmi.core.score.raw on a 0-15 scale and completion after all 15 required answers.'
    ],
    note: 'Publish the SCORM package as a gradable Buzz assignment/custom activity, not as a Buzz Assessment. Do not add native Buzz questions.'
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
    mix: 'three numeric, five multiple-choice, and two essay questions',
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
    totalPoints: 15,
    automaticPoints: 8,
    busybeeQuestionPoints: [3, 4],
    mix: 'eight numeric questions and two written lab explanations',
    mission: 'Reconstruct the fixed rocket launch in Sections 1?4, then calculate the acceleration needed after a late retro burn and explain the four phases of motion in Section 5.',
    goals: [
      'Apply constant-acceleration equations across connected flight phases.',
      'Calculate apex height, flight time, total distance, and touchdown behavior.',
      'Distinguish velocity, acceleration, distance, and displacement in a complete mission.'
    ],
    steps: [
      'Run Sections 1-4 and answer Questions 1-8 using the fixed +20 m/s^2, 2.5 s powered burn and -10 m/s^2 gravity.',
      'In Section 5, explain how to recover from a late retro burn and calculate the required net acceleration in Question 9.',
      'Analyze velocity and acceleration in all four phases in Question 10, using at least two calculated values.',
      'Enter your written answers in the visible Buzz response boxes, then submit the assessment.'
    ],
    checks: [
      'All four fixed-mission simulations load without a neighboring file.',
      'Questions 7-8 ask for retro displacement (-62.5 m) and duration (2.5 s).',
      'Section 5 contains two visible essay response boxes worth 3 and 4 points, with partial credit.',
      'There are exactly ten question slots and no automatic flight-record response.'
    ],
    note: 'Import the matching question bank and rubric metadata together with the template. Replace the old questions rather than appending; turn question shuffling off.' 
  }
];

function read(file) {
  return fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
}

function property(block, key) {
  return ((block.match(new RegExp(`^${key}:\\s*(.+)$`, 'm')) || [])[1] || '').trim();
}

function questionBlocks(item) {
  if (item.applicationAssignment) return [];
  const text = read(path.join(root, item.dir, 'buzz-assessment-questions.txt')).trim();
  return text.split(/\n\s*\n(?=Type:\s*)/).filter(Boolean);
}

function buildSetup(item) {
  const dir = path.join(root, item.dir);
  const setupPath = path.join(dir, `${item.slug}_buzz_setup.txt`);
  if (item.applicationAssignment) {
    const output = [
      item.title.toUpperCase(),
      'UNIT 1 BUZZ APPLICATION ASSIGNMENT GUIDE',
      '',
      'YOUR MISSION',
      item.mission,
      '',
      'WHAT YOU WILL DO AND LEARN',
      ...item.goals.map((goal) => `- ${goal}`),
      '',
      'HOW TO COMPLETE THE ASSIGNMENT',
      ...item.steps.map((step, index) => `${index + 1}. ${step}`),
      `${item.steps.length + 1}. Confirm the completion display reads 15 / 15 required.`,
      '',
      'SUCCESS AND SCORING',
      `- The assignment is worth 15 completion points: one point for each attempted required question, Questions 1-${item.completionQuestionCount}.`,
      '- Correctness provides instructional feedback but does not change completion credit.',
      '- Questions 16-20 are optional and do not add points.',
      '- No native Buzz questions, BusyBee responses, or file uploads are used.',
      '',
      'TEACHER BUZZ SETUP',
      `1. Create a gradable Buzz Custom Activity titled "${item.buzzTitle}" and use it as the lesson assignment, not a Buzz Assessment.`,
      '2. Set Score entry to Points with 15 points possible.',
      '3. Upload unit-1-lesson-1-buzz-assignment-scorm.zip as a SCORM 1.2 package and use the SCO score as the grade source.',
      '4. Do not import buzz-assessment-questions.txt and do not add native Buzz questions.',
      '5. Set completion to occur when the SCO reports completed after all required Questions 1-15 are answered.',
      '6. Confirm cmi.core.score.raw increases from 0 to 15 by one point for each answered required question.',
      `7. Use ${item.preview} for local placement checks only; the SCORM ZIP is the scored Buzz delivery file.`,
      '',
      'PUBLISHING AND PREVIEW CHECKS',
      ...item.checks.map((check) => `- ${check}`),
      `- ${item.note}`,
      '',
      'AUTHORITATIVE FILES',
      `- Application source: ${item.simulation} and sim.js`,
      `- Self-contained Buzz assignment template: ${item.template}`,
      `- Generated local preview: ${item.preview}`,
      '- Scored Buzz delivery: unit-1-lesson-1-buzz-assignment-scorm.zip',
      '- SCORM package source: buzz-assignment-scorm/index.html and imsmanifest.xml',
      '- Native Buzz questions: none',
      ''
    ].join('\n');
    fs.writeFileSync(setupPath, output, 'utf8');
    console.log(`Built ${path.relative(root, setupPath)}`);
    return;
  }
  const numberedSteps = item.steps.concat([
    item.lesson === 'U1H'
      ? 'Before submitting, answer Questions 1-8 and write your explanations for Questions 9-10.'
      : `Before submitting, confirm that all ${item.count} questions are answered and the final two responses cite recorded evidence.`
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
    `- The assessment is worth ${item.totalPoints || 15} points: ${item.automaticPoints} auto-graded points plus ${(item.totalPoints || 15) - item.automaticPoints} BusyBee points.`,
    `- The final ${item.busybeeQuestionPoints.length} evidence response(s) are worth ${item.busybeeQuestionPoints.join(' and ')} points.`,
    item.completedProvidedChart
      ? '- This lesson uses 10 automatic points because students complete the provided Galileo data chart.'
      : item.lesson === 'U1H'
      ? '- Section 5 contains two written explanations worth 3 and 4 points, graded using their full-, partial-, and no-credit rubrics.'
      : '- This lesson does not use the 10-automatic-point chart model; its live evidence is evaluated in the final BusyBee responses.',
    '- No file upload earns or replaces points.',
    '',
    'TEACHER BUZZ SETUP',
    `1. Create a Buzz Assessment titled "${item.buzzTitle}".`,
    `2. Import the ${item.count} questions from buzz-assessment-questions.txt.`,
    `3. Confirm the import creates ${item.count} questions worth ${item.totalPoints || 15} points: ${item.mix}.`,
    `4. Upload ${item.template} from this folder as the assessment template.`,
    '5. Turn question randomization/shuffling OFF and one-question-per-page OFF.',
    '6. Preserve the authored feedback and Meta-grading fields; the final essay questions route to BusyBee.',
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
  if (item.applicationAssignment) {
    const metadata = {
      schema: 'buzz-scorm-assignment/v1',
      lastUpdated: '2026-08-31',
      lesson: {
        unit: 'U1',
        lesson: item.lesson,
        title: item.title,
        activityType: 'gradable-buzz-assignment-scorm-sco',
        simulationFile: `unit-1/${item.dir}/unit-1-lesson-1-buzz-assignment-scorm.zip`,
        buzzAssignmentTitle: item.buzzTitle
      },
      assessmentSettings: {
        totalPoints: 15,
        completionPoints: 15,
        requiredApplicationQuestions: item.completionQuestionCount,
        optionalApplicationQuestions: 5,
        nativeBuzzQuestions: 0,
        busybeePoints: 0,
        requiredUploads: [],
        buzzActivityKind: 'assignment',
        buzzAssessmentActivity: false,
        deliveryStandard: 'SCORM 1.2',
        scoreSource: 'cmi.core.score.raw',
        scoreMinimum: 0,
        scoreMaximum: 15,
        completionSource: 'cmi.core.lesson_status'
      },
      gradingDesign: {
        rule: 'Award one completion point for each attempted required application question, Questions 1-15. Correctness does not change completion credit.',
        optionalQuestionsAffectScore: false,
        scoreWriteTiming: 'Write and commit after every required answer; write completed after all 15 required answers.'
      },
      scormDataModel: {
        rawScore: 'cmi.core.score.raw',
        minimumScore: 'cmi.core.score.min',
        maximumScore: 'cmi.core.score.max',
        lessonStatus: 'cmi.core.lesson_status',
        resumeData: 'cmi.suspend_data'
      },
      questions: []
    };
    const target = path.join(root, item.dir, 'busybee-rubric-metadata.json');
    fs.writeFileSync(target, `${JSON.stringify(metadata, null, 2)}\n`, 'utf8');
    console.log(`Built ${path.relative(root, target)}`);
    return;
  }
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
    lastUpdated: item.lesson === 'U1H' ? '2026-10-14' : '2026-08-11',
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
      totalPoints: item.totalPoints || 15,
      automaticPoints: item.automaticPoints,
      busybeePoints: (item.totalPoints || 15) - item.automaticPoints,
      finalBusyBeeQuestionPoints: item.busybeeQuestionPoints,
      completedProvidedChart: !!item.completedProvidedChart,
      requiredUploads: []
    },
    gradingDesign: {
      automaticQuestions: questions.filter((question) => question.grading === 'auto').map((question) => question.id),
      busybeeQuestions: questions.filter((question) => question.grading === 'busybee').map((question) => question.id),
      rule: item.lesson === 'U1H'
        ? 'Section 5 contains two written explanations: late retro-burn acceleration (3 points) and four-phase motion (4 points). Award partial credit according to each rubric. Teacher reviews BusyBee suggestions.'
        : 'All variable student evidence is graded only in the final two BusyBee responses.'
    },
    questions
  };

  const target = path.join(root, item.dir, 'busybee-rubric-metadata.json');
  fs.writeFileSync(target, `${JSON.stringify(metadata, null, 2)}\n`, 'utf8');
  console.log(`Built ${path.relative(root, target)}`);
}

function buildLabNotes(item) {
  if (item.applicationAssignment) {
    const output = [
      `Unit 1 Lesson 1 - ${item.title}`,
      'Canonical Buzz scored application-assignment status',
      '',
      'Delivery design',
      `- Standalone application source: ${item.simulation} plus sim.js`,
      `- Self-contained Buzz assignment template: ${item.template}`,
      `- Generated preview: ${item.preview}`,
      `- Generated setup guide: ${item.slug}_buzz_setup.txt`,
      '- Scored SCORM 1.2 package: unit-1-lesson-1-buzz-assignment-scorm.zip',
      '- Native Buzz question source: none',
      '',
      'Assignment contract',
      '- 15 completion points for attempting required application Questions 1-15.',
      '- Correctness is feedback only and does not change completion credit.',
      '- Questions 16-20 are optional and do not affect completion.',
      '- The SCO commits cmi.core.score.raw from 0-15 after each required answer and marks completed after all 15.',
      '- No native Buzz questions, BusyBee grading, or required upload.',
      '',
      'Maintenance',
      '- Run node unit-ApplicationFiles/unit-1/build-unit1-buzz-assessments.js after editing index.html or sim.js.',
      '- Run node unit-ApplicationFiles/unit-1/validate-unit1-buzz-assessments.js before publishing.',
      `- ${item.note}`,
      ''
    ].join('\n');
    const target = path.join(root, item.dir, 'lab-format-suggestions.txt');
    fs.writeFileSync(target, output, 'utf8');
    console.log(`Built ${path.relative(root, target)}`);
    return;
  }
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
    `- ${item.count} questions worth ${item.totalPoints || 15} total points (${item.mix}).`,
    `- Automatic questions total ${item.automaticPoints} points.`,
    `- The final ${item.busybeeQuestionPoints.length} BusyBee response(s) are worth ${item.busybeeQuestionPoints.join(' and ')} points.`,
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
  if (item.applicationAssignment) {
    if (slots !== 0) throw new Error(`${item.lesson}: application assignment must not contain native Buzz question slots`);
    if (!html.includes('data-buzz-assignment="completion-1-15"')) throw new Error(`${item.lesson}: missing application-assignment marker`);
    const htmlMarkup = html.replace(/<script(?:\s[^>]*)?>[\s\S]*?<\/script>/gi, '<script></script>');
    if (/<script[^>]+src\s*=|<link[^>]+rel=["']stylesheet/i.test(htmlMarkup) || /<(?:script|img|iframe|link)\b[^>]*(?:src|href)=["']https?:\/\//i.test(htmlMarkup) || /@import\s+url\(/i.test(htmlMarkup)) {
      throw new Error(`${item.lesson}: assignment template is not self-contained`);
    }
    return;
  }
  if (slots !== item.count) throw new Error(`${item.lesson}: ${slots} template slots, expected ${item.count}`);
  if (!html.includes('id="buzz-assessment-integrity-guard"')) throw new Error(`${item.lesson}: missing integrity guard`);
  if (/(?:src|href)=["']https?:\/\//i.test(html) || /@import\s+url\(["']?https?:\/\//i.test(html)) {
    throw new Error(`${item.lesson}: external template dependency detected`);
  }
}

const requestedLessons = process.argv.slice(2).map((value) => value.toUpperCase());
const selectedAssessments = requestedLessons.length
  ? assessments.filter((item) => requestedLessons.includes(item.lesson.toUpperCase()) || requestedLessons.includes(item.dir.toUpperCase()))
  : assessments;

if (!selectedAssessments.length) throw new Error(`No Unit 1 lessons matched: ${process.argv.slice(2).join(', ')}`);
if (selectedAssessments.some((item) => item.lesson === 'U1L1')) {
  require('./build-u1l1-buzz-template.js');
  require('./lesson-1/build-u1l1-scorm-package.js');
}
if (selectedAssessments.some((item) => item.lesson === 'U1H')) require('./build-u1h-buzz-template.js');
selectedAssessments.forEach(verifyTemplate);
selectedAssessments.forEach(buildSetup);
selectedAssessments.forEach(buildMetadata);
selectedAssessments.forEach(buildLabNotes);

const previewBuilder = path.join(workspace, 'unit-buzz-template-conversion-files', 'build-buzz-template-previews.js');
const previewTargets = selectedAssessments.map((item) => `unit-ApplicationFiles/unit-1/${item.dir}`);
const previewBuild = spawnSync(process.execPath, [previewBuilder, ...previewTargets], {
  cwd: workspace,
  stdio: 'inherit'
});
if (previewBuild.status !== 0) process.exit(previewBuild.status || 1);

console.log(`Built Unit 1 delivery files for: ${selectedAssessments.map((item) => item.lesson).join(', ')}.`);
