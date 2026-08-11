const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = __dirname;

const assessments = [
  {
    lesson: 'U2L1',
    dir: 'lesson-u2l1',
    slug: 'u2l1_projectile_motion',
    title: 'PhET Projectile Launch Lab',
    buzzTitle: 'Unit 2 Lesson 1: PhET Projectile Launch Lab',
    template: 'u2l1-phet-projectile-buzz-assessment-template.html',
    preview: 'u2l1-phet-projectile-buzz-assessment-template-preview.html',
    count: 12,
    mix: 'seven numeric, three multiple-choice, and two essay questions',
    mission: 'Launch projectiles, chase down their trajectories, and uncover the hidden independence of horizontal and vertical motion! You will use the PhET Projectile Motion simulation to turn measured flight times, ranges, and heights into a defensible model of projectile motion.',
    goals: [
      'Measure how horizontal launch speed changes range without changing fall time.',
      'Connect initial vertical velocity to maximum height.',
      'Use PhET evidence to explain independent horizontal and vertical motion.'
    ],
    steps: [
      'Open the embedded PhET simulation or use the external PhET launch button if your browser blocks the iframe.',
      'Complete Part A at a 12 m height using 0, 5, 10, and 20 m/s horizontal launches.',
      'Reset to ground level and complete the three Part B angle-and-speed trials.',
      'Keep the PhET readouts visible while answering all 12 Buzz questions in order.',
      'Cite your measured range, time, and maximum-height evidence in the final two responses.'
    ],
    checks: [
      'The embedded PhET iframe loads from phet.colorado.edu, or the external PhET fallback opens successfully.',
      'The seven numeric tolerances agree with the current PhET simulation readouts.',
      'All 12 questions appear in order beneath the directions.'
    ],
    note: 'This lesson is intentionally PhET-dependent. Allow phet.colorado.edu through the school network and Buzz content policy.'
  },
  {
    lesson: 'U2L2',
    dir: 'lesson-u2l2',
    slug: 'u2l2_launch_velocity',
    title: 'Ball Throw Vector Challenge',
    buzzTitle: 'Unit 2 Lesson 2: Finding Launch Velocity',
    template: 'u2l2-launch-velocity-buzz-assessment-template.html',
    preview: 'u2l2-launch-velocity-buzz-assessment-template-preview.html',
    count: 9,
    mix: 'five numeric, two multiple-choice, and two essay questions',
    mission: 'Work like a motion analyst and reconstruct a ball launch from just distance and time! You will split velocity into components, rebuild the launch speed and angle, and decide how trustworthy the result is.',
    goals: [
      'Calculate horizontal and initial vertical velocity from measured projectile data.',
      'Combine perpendicular components to determine total launch speed and angle.',
      'Analyze how measurement uncertainty changes a calculated result.'
    ],
    steps: [
      'Collect one safe real launch or generate one simulated distance-and-time trial.',
      'Record horizontal distance in meters and total flight time in seconds.',
      'Complete the fixed reference calculation ladder in Questions 1-7.',
      'Apply the same formulas to your own trial in Question 8.',
      'Defend your calculated launch velocity and analyze two error sources in Question 9.'
    ],
    checks: [
      'The simulated-data button produces and displays a distance and total flight time.',
      'The fixed 30.0 m and 2.50 s reference answers reproduce the authored tolerances.',
      'All nine questions appear beside the self-contained launch visual.'
    ],
    note: 'Student-specific measurements are rubric-graded in the final two questions; fixed reference calculations supply reliable auto-grading.'
  },
  {
    lesson: 'U2L3',
    dir: 'lesson-u2l3',
    slug: 'u2l3_circus_launch',
    title: 'Complementary Launch Ranges',
    buzzTitle: 'Unit 2 Lesson 3: Complementary Launch Ranges',
    template: 'u2l3-circus-launch-buzz-assessment-template.html',
    preview: 'u2l3-circus-launch-buzz-assessment-template-preview.html',
    count: 10,
    mix: 'six numeric, two multiple-choice, and two essay questions',
    mission: 'Take control of a two-cannon circus act and find the angle pairs that make the performers land together! Then hunt for the launch angle that sends a projectile farthest.',
    goals: [
      'Use complementary angles to predict equal projectile ranges.',
      'Use trial evidence to identify the maximum-range angle in an ideal model.',
      'Explain why real baseball trajectories differ from the no-drag model.'
    ],
    steps: [
      'Complete the three Level 1 trials using the Buzz-generated Cannon 1 angles.',
      'Adjust Cannon 2 until each act succeeds and record the matching angle.',
      'In Level 2, launch at 30, 45, and 60 degrees and record each range.',
      'Answer all 10 Buzz questions in order.',
      'Use both complementary-angle and maximum-range evidence in the final responses.'
    ],
    checks: [
      'All three Buzz variables evaluate with answer = 90 - the generated angle.',
      'The 30- and 60-degree trials match within tolerance and 45 degrees has the greatest range.',
      'Both embedded simulator levels and all 10 question slots operate in Buzz.'
    ],
    note: 'Keep question randomization off because the two simulator levels are positioned beside their matching question groups.'
  },
  {
    lesson: 'U2L4',
    dir: 'lesson-u2l4',
    slug: 'u2l4_river_rescue',
    title: 'River Rescue',
    buzzTitle: 'Unit 2 Lesson 4: River Rescue',
    template: 'u2l4-river-rescue-buzz-assessment-template.html',
    preview: 'u2l4-river-rescue-buzz-assessment-template-preview.html',
    count: 12,
    mix: 'four numeric, six multiple-choice, and two essay questions',
    mission: 'Race a current, intercept a drifting baby, and thread a safe route between river hazards! You will use vector components and relative motion to solve four increasingly demanding rescues.',
    goals: [
      'Add swimmer and current velocity vectors to predict a ground-frame path.',
      'Separate across-river speed from downstream drift when analyzing crossing time.',
      'Use relative velocity to explain interception and collision risk.'
    ],
    steps: [
      'Complete the four locked River Rescue levels in order.',
      'Open each level DATA panel and record successful heading, speed, time, and stamina evidence.',
      'Answer the matching question group immediately after each successful level.',
      'Use a successful speed from the safe Level 4 band in Question 10.',
      'Compare frames and cite rescue telemetry in the final two responses.'
    ],
    checks: [
      'All four levels load inside the template without requesting a neighboring HTML file or authentication.',
      'The fixed current, crossing-time, relative-speed, and safe-speed answers match the model.',
      'All 12 questions appear in the labeled level sections.'
    ],
    note: 'The self-contained template stores the River Rescue source once and loads four locked-level iframe srcdoc views.'
  },
  {
    lesson: 'U2L5',
    dir: 'lesson-u2l5',
    slug: 'u2l5_inertia_tension',
    title: 'Inertia and Tension Demonstration',
    buzzTitle: 'Unit 2 Lesson 5: Inertia and Tension Demonstration',
    template: 'u2l5-inertia-tension-buzz-assessment-template.html',
    preview: 'u2l5-inertia-tension-buzz-assessment-template-preview.html',
    count: 10,
    mix: 'two numeric, six multiple-choice, and two essay questions',
    mission: 'Snap a card from under a penny and challenge two strings to a breaking contest! You will discover why slow and fast pulls send forces through a system in dramatically different ways.',
    goals: [
      'Use inertia and friction to explain the cup-card-penny demonstration.',
      'Compare string tension during slow and rapid pulls.',
      'Build one force-based explanation that accounts for both demonstrations.'
    ],
    steps: [
      'Run both slow and fast pulls in the cup-card-penny level.',
      'Switch to the string-tension level and run both pull speeds.',
      'Record the broken string and breaking-tension readout for each string trial.',
      'Answer all 10 Buzz questions in order.',
      'Use results from both levels in the final evidence and conclusion responses.'
    ],
    checks: [
      'The level switch and all four pull animations work.',
      'The slow-pull top-string and fast-pull bottom-string tensions match the authored tolerances.',
      'All 10 questions render below the correct demonstration sections.'
    ],
    note: 'Reset both demonstrations after teacher testing so students begin with clean evidence.'
  },
  {
    lesson: 'U2H',
    dir: 'lesson-u2honors',
    slug: 'u2h_coriolis_cannon',
    title: 'Coriolis Cannon Challenge',
    buzzTitle: 'Unit 2 Honors: Coriolis Cannon Challenge',
    template: 'u2h-coriolis-cannon-buzz-assessment-template.html',
    preview: 'u2h-coriolis-cannon-buzz-assessment-template-preview.html',
    count: 9,
    mix: 'seven multiple-choice and two essay questions',
    mission: 'Aim a cannon from a rotating world and outsmart an apparent sideways deflection! You will compare four launch directions, correct your aim, and reconcile what inertial and rotating observers see.',
    goals: [
      'Predict Northern Hemisphere Coriolis deflection for four launch directions.',
      'Use trial-and-correction evidence to hit a target in a rotating frame.',
      'Explain why inertial and rotating observers describe different paths.'
    ],
    steps: [
      'Run direct-aim trials in all four launch directions and record each miss direction.',
      'Choose at least one direction and adjust aim opposite the observed deflection until you hit.',
      'Review the two frame views and the completed trial log.',
      'Answer all nine Buzz questions in order.',
      'Cite the four-direction pattern and a corrected hit in the final two responses.'
    ],
    checks: [
      'All four directions, both frame views, aim correction, and trial logging work.',
      'The self-contained two-dimensional model loads without a hosted-globe placeholder.',
      'All nine questions render and no required file-upload question remains.'
    ],
    note: 'The standalone coriolis-effect.html remains the full practice source; the Buzz assessment uses the self-contained model and requires no hosted alternative.'
  }
];

const integrityGuard = `<script id="buzz-assessment-integrity-guard">
  (function () {
    'use strict';

    function blockClipboardAction(event) {
      event.preventDefault();
    }

    ['copy', 'cut', 'paste', 'contextmenu'].forEach(function (eventName) {
      document.addEventListener(eventName, blockClipboardAction, true);
    });

    document.addEventListener('keydown', function (event) {
      var key = String(event.key || '').toLowerCase();
      if ((event.ctrlKey || event.metaKey) && (key === 'c' || key === 'x' || key === 'v')) {
        event.preventDefault();
      }
    }, true);
  }());
</script>`;

function bullets(items) {
  return items.map((value) => `- ${value}`);
}

function numbered(items) {
  return items.map((value, index) => `${index + 1}. ${value}`);
}

function buildSetup(item) {
  const dir = path.join(root, item.dir);
  const setupPath = path.join(dir, `${item.slug}_buzz_setup.txt`);
  const output = [
    item.title.toUpperCase(),
    'UNIT 2 BUZZ LAB GUIDE',
    '',
    'YOUR MISSION',
    item.mission,
    '',
    'WHAT YOU WILL DO AND LEARN',
    ...bullets(item.goals),
    '',
    'HOW TO COMPLETE THE LAB',
    ...numbered(item.steps),
    `6. Before submitting, confirm that all ${item.count} questions are answered and the final two responses cite recorded evidence.`,
    '',
    'SUCCESS AND SCORING',
    '- The assessment is worth 15 points: 10 auto-graded points plus 5 BusyBee points.',
    '- The final two evidence responses are worth 2 points and 3 points.',
    '- No file upload earns or replaces points.',
    '',
    'TEACHER BUZZ SETUP',
    `1. Create a Buzz Assessment titled "${item.buzzTitle}".`,
    `2. Import the ${item.count} questions from buzz-assessment-questions.txt.`,
    `3. Confirm the import creates ${item.count} questions worth 15 points: ${item.mix}.`,
    `4. Upload ${item.template} from this folder as the assessment template.`,
    '5. Turn question randomization/shuffling OFF and one-question-per-page OFF.',
    '6. Preserve the authored feedback and Meta-grading fields; the final two essays route to BusyBee.',
    `7. Use ${item.preview} for local placement checks, never as the upload template.`,
    '',
    'PUBLISHING AND PREVIEW CHECKS',
    ...bullets(item.checks),
    '- Copy, cut, paste, keyboard clipboard shortcuts, and the context menu are intentionally blocked by the assessment integrity guard.',
    '- Keyboard navigation and all lab controls remain available.',
    '- Reset teacher-test data before students open the assessment.',
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

function normalizeTemplate(item) {
  const templatePath = path.join(root, item.dir, item.template);
  let html = fs.readFileSync(templatePath, 'utf8').replace(/\r\n/g, '\n');
  const slotPattern = /\s*<div class="question-card">\s*<a:question\s*><\/a:question>\s*<\/div>/gi;
  let count = (html.match(/<a:question\s*><\/a:question>|<a:question\s*\/>/gi) || []).length;

  while (count > item.count) {
    const matches = [...html.matchAll(slotPattern)];
    const last = matches[matches.length - 1];
    if (!last) throw new Error(`${item.lesson}: cannot remove surplus question slot`);
    html = html.slice(0, last.index) + html.slice(last.index + last[0].length);
    count -= 1;
  }
  if (count !== item.count) throw new Error(`${item.lesson}: found ${count} slots, expected ${item.count}`);

  if (!html.includes('id="buzz-assessment-integrity-guard"')) {
    if (!html.includes('</body>')) throw new Error(`${item.lesson}: template is missing </body>`);
    html = html.replace('</body>', `${integrityGuard}\n</body>`);
  }

  fs.writeFileSync(templatePath, html, 'utf8');
  console.log(`Normalized ${path.relative(root, templatePath)}`);
}

require('./lesson-u2l4/build-river-rescue-buzz-assessment.js');
assessments.forEach(normalizeTemplate);
assessments.forEach(buildSetup);

const previewBuilder = path.resolve(root, '..', '..', 'unit-buzz-template-conversion-files', 'build-buzz-template-previews.js');
const previewBuild = spawnSync(process.execPath, [previewBuilder, 'unit-ApplicationFiles/unit-2'], {
  cwd: path.resolve(root, '..', '..'),
  stdio: 'inherit'
});
if (previewBuild.status !== 0) process.exit(previewBuild.status || 1);

console.log('Built all Unit 2 Buzz assessments, previews, and TXT setup guides.');
