const fs = require('fs');
const path = require('path');

const root = __dirname;

const assessments = [
  { slug: 'sound_waves_resonance', dir: 'sound-waves-resonance-lab', sourceTemplate: 'sound_waves_lab_simulation.html', buzzTemplate: 'u5l2-resonance-tube-buzz-assessment-template.html', optionalEvidence: 'resonance-tube-evidence.png — 12-row data table plus the verified final result' },
  { slug: 'design_perfect_instrument', dir: 'design-the-perfect-instrument', sourceTemplate: 'index.html', buzzTemplate: 'u5l2-perfect-instrument-buzz-assessment-template.html', optionalEvidence: 'instrument-build-evidence.png — all seven recorded challenge builds' },
  { slug: 'thin_lens_refraction', dir: 'thin-lens-refraction-lab', sourceTemplate: 'thin_lens_refraction_investigation.html', buzzTemplate: 'u5l3-thin-lens-buzz-assessment-template.html', optionalEvidence: 'thin-lens-evidence.png — four observations plus three verified calculations' },
  { slug: 'light_color_vision', dir: 'light-color-and-vision-lab', sourceTemplate: 'index.html', buzzTemplate: 'u5l3-light-color-vision-buzz-assessment-template.html', optionalEvidence: 'light-color-vision-evidence.png — all 18 recorded evidence trials' },
  { slug: 'doppler_spectral_shift', dir: 'doppler-spectral-line-shift', sourceTemplate: 'index.html', buzzTemplate: 'u5l5-spectral-shift-buzz-assessment-template.html', optionalEvidence: 'spectral-shift-evidence.png — three recorded spectral matches and shifts' },
  { slug: 'honors_relativity', dir: 'honors-relativity-timekeeping-lab', sourceTemplate: 'index.html', buzzTemplate: 'u5h-relativity-timekeeping-buzz-assessment-template.html', optionalEvidence: 'relativity-timekeeping-evidence.png — the student trial table' },
  { slug: 'gps_relativity', dir: 'gps-relativity-investigation', sourceTemplate: 'gps_relativity_investigation.html', buzzTemplate: 'u5h-gps-relativity-buzz-assessment-template.html', optionalEvidence: 'gps-relativity-evidence.png — all four investigation parts' }
];

const setupGuides = {
  sound_waves_resonance: {
    title: 'Resonance Tube Lab',
    buzzTitle: 'Unit 5 Lesson 2: Resonance Tube Lab',
    questionCount: 10,
    questionMix: 'six numeric, two multiple-choice, and two essay questions',
    mission: 'Turn an adjustable air column into a precision sound detector! You will hunt for resonance peaks, uncover the odd-harmonic pattern inside a closed tube, and use your own measurements to calculate the speed of sound.',
    learningGoals: [
      'Identify resonance by connecting tube length, frequency, and sound intensity.',
      'Explain why a closed-open tube supports odd harmonics.',
      'Use repeated measurements to determine whether sound speed depends on frequency.'
    ],
    studentSteps: [
      'Strike a tuning fork and scan the tube length until the intensity trace reaches a resonance peak.',
      'Record the required resonance lengths for 2048 Hz, 1024 Hz, 512 Hz, and 256 Hz until all 12 rows are complete.',
      'Verify every measurement and complete the final speed-of-sound result in the lab.',
      'Answer the Buzz questions in order. Use the values in your on-screen evidence table for the final two written responses.',
      'Download the evidence image only if you want a personal record; it is not submitted or graded.'
    ],
    previewChecks: [
      'The apparatus draws, the tube moves, and striking a fork produces an intensity trace.',
      'Record measurement unlocks only at a resonance peak, and all 12 rows can be verified.',
      'The optional evidence download unlocks only after the three completion checks turn green.'
    ],
    technicalNote: 'Confirm audio is allowed, while remembering that every audio cue also has a visual equivalent.'
  },
  design_perfect_instrument: {
    title: 'Design the Perfect Instrument',
    buzzTitle: 'Unit 5 Lesson 2: Design the Perfect Instrument',
    questionCount: 8,
    questionMix: 'four numeric, two multiple-choice, and two essay questions',
    mission: 'Step into the role of an instrument engineer! You will tune strings and air columns, test which standing-wave modes can exist, and discover how musicians control pitch through length, temperature, and boundary conditions.',
    learningGoals: [
      'Relate resonator length, wave speed, harmonic mode, and frequency.',
      'Compare strings, open pipes, and stopped pipes using their boundary conditions.',
      'Defend an engineering choice with evidence from successful and impossible builds.'
    ],
    studentSteps: [
      'Work through all seven design challenges and read each target frequency and constraint carefully.',
      'Adjust the resonator, mode, temperature, and length or capo position until the tuner confirms a valid build.',
      'For the impossible case, use No mode fits only after checking every allowed mode.',
      'Use Your recorded builds to answer the Buzz questions in order and cite specific builds in the final two responses.',
      'Download the evidence image only if you want a personal record; it is not submitted or graded.'
    ],
    previewChecks: [
      'The resonator scene, wave-fit diagram, length controls, and tuner all respond.',
      'A successful target locks the build and records a row; the impossible challenge records through No mode fits.',
      'All seven challenges can be completed and the optional evidence image unlocks at 7 of 7.'
    ],
    technicalNote: 'The tuner uses Web Audio; confirm audio permission and verify the visual tuner feedback independently.'
  },
  thin_lens_refraction: {
    title: 'Thin Lens Investigation',
    buzzTitle: 'Unit 5 Application: Thin Lens Investigation',
    questionCount: 8,
    questionMix: 'five numeric, one multiple-choice, and two essay questions',
    mission: 'Make light rays reveal an invisible rule! You will move an object and screen around a converging lens, capture real and virtual images, and test whether the thin-lens equation predicts what the simulation shows.',
    learningGoals: [
      'Distinguish real images from virtual images using ray behavior and screen evidence.',
      'Apply the thin-lens equation and magnification relationship with correct signs.',
      'Use multiple trials to explain how object distance changes image position, size, and orientation.'
    ],
    studentSteps: [
      'Record three focused real-image trials using the required object distances.',
      'Complete the p = 10.0 cm virtual-image trial and explain why no screen measurement exists for it.',
      'Calculate and verify the three required application rows before moving to the assessment questions.',
      'Answer the Buzz questions in order and cite values from the observation and calculation tables in the final responses.',
      'Download the evidence image only if you want a personal record; it is not submitted or graded.'
    ],
    previewChecks: [
      'Three real-image trials and the p = 10.0 cm virtual-image trial record correctly.',
      'The virtual row does not invent a screen measurement, and all three calculation rows verify.',
      'Saved evidence survives a reload and Reset entire lab clears it.'
    ],
    technicalNote: 'Keep the fixed assessment lens and required trial values unchanged.'
  },
  light_color_vision: {
    title: 'Light, Color, and Vision Lab',
    buzzTitle: 'Unit 5 Lesson 3: Light, Color, and Vision Lab',
    questionCount: 8,
    questionMix: 'one matching, two numeric, three multiple-choice, and two essay questions',
    mission: 'Build color the way light and your eyes do! You will filter wavelengths, mix red-green-blue light, and compare cone responses to explain why the same color sensation can come from very different light combinations.',
    learningGoals: [
      'Predict which wavelengths a colored filter transmits or absorbs.',
      'Explain additive color mixing with red, green, and blue light.',
      'Connect wavelength mixtures to the relative responses of the eye’s cone cells.'
    ],
    studentSteps: [
      'Complete the filter workspace and record every required source-filter trial.',
      'Complete the RGB mixing workspace and record the required primary and secondary combinations.',
      'Use the color-matching workspace to compare spectra and cone-response patterns until all 18 trials are recorded.',
      'Answer the Buzz questions in order and use values from the evidence tables in the final two responses.',
      'Download the evidence image only if you want a personal record; it is not submitted or graded.'
    ],
    previewChecks: [
      'The beam, photon-dot, and cone-response workspaces all render and respond.',
      'All 18 required trials can be recorded across the three workspaces.',
      'Clear saved work empties the evidence tables and the optional download unlocks only at 18 of 18.'
    ],
    technicalNote: 'Keep the beam, photon, and cone-response graphics intact because each carries instructional evidence.'
  },
  doppler_spectral_shift: {
    title: 'Spectral Shift Investigation',
    buzzTitle: 'Unit 5 Lesson 5: Spectral Shift Investigation',
    questionCount: 8,
    questionMix: 'four numeric, two multiple-choice, and two essay questions',
    mission: 'Read motion written in starlight! You will match elemental fingerprints, slide spectral lines into alignment, and use wavelength shifts to decide whether distant objects are racing toward us or away from us.',
    learningGoals: [
      'Identify an element from its unique spectral-line pattern.',
      'Distinguish redshift from blueshift and connect each to radial motion.',
      'Calculate fractional wavelength shift and approximate radial speed from measured data.'
    ],
    studentSteps: [
      'Drag a reference spectrum into the comparison area and identify the matching elemental fingerprint.',
      'Move the dashed spectral markers until the observed and reference lines align.',
      'Record the measured wavelength shift for all three objects and note each direction of motion.',
      'Answer the Buzz questions in order, calculating from the displayed rest wavelength and measured shift rather than a displayed z value.',
      'Download the evidence image only if you want a personal record; it is not submitted or graded.'
    ],
    previewChecks: [
      'Reference cards and spectral markers work with pointer and touch input.',
      'Alignment records a row, reveals the motion diagram, and preserves delta-lambda without displaying z.',
      'All three objects can be completed and the optional evidence image unlocks at 3 of 3.'
    ],
    technicalNote: 'Verify the drag interactions on a touch device as well as with a mouse.'
  },
  honors_relativity: {
    title: 'Honors Relativity Timekeeping Lab',
    buzzTitle: 'Unit 5 Honors: Relativity Timekeeping Lab',
    questionCount: 8,
    questionMix: 'three numeric, three multiple-choice, and two essay questions',
    mission: 'Put Einstein’s clocks into orbit! You will make gravity and motion compete, locate an orbit where their effects cancel, and explain why satellite navigation depends on corrections measured in millionths of a second.',
    learningGoals: [
      'Compare gravitational and special-relativistic clock-rate changes.',
      'Determine when an orbiting clock runs faster or slower than a clock on Earth.',
      'Connect tiny timing drifts to large navigation errors and real engineering decisions.'
    ],
    studentSteps: [
      'Explore presets and custom orbital conditions, watching the gravitational, motion, and net clock-rate changes.',
      'Record at least four trials, including one fast-clock case and one slow-clock case.',
      'Use the graph and Snap to circular orbit control to investigate the cancellation region near 1.5 Earth radii.',
      'Answer the Buzz questions in order and cite specific trials from your data table in the final two responses.',
      'Download the evidence image only if you want a personal record; it is not submitted or graded.'
    ],
    previewChecks: [
      'The orbit animation, both clocks, presets, sliders, and circular-orbit control respond.',
      'Four trials including a fast and slow clock satisfy the evidence gate and appear on the graph.',
      'Reset Lab clears the table and the optional evidence image unlocks only after the gate is satisfied.'
    ],
    technicalNote: 'Keep the orbital scene, clock dials, and graph intact because all three support the required reasoning.'
  },
  gps_relativity: {
    title: 'GPS and Relativity Investigation',
    buzzTitle: 'Unit 5 Honors: GPS and Relativity Investigation',
    questionCount: 9,
    questionMix: 'five numeric, two multiple-choice, and two essay questions',
    mission: 'Save a GPS receiver from drifting kilometers off course! You will measure how quickly a tiny clock error becomes a navigation failure, separate gravity and motion effects, and engineer the correction that keeps satellites synchronized with Earth.',
    learningGoals: [
      'Convert a position-accuracy requirement into an allowable timing error.',
      'Combine gravitational and special-relativistic clock-rate changes for GPS orbit.',
      'Explain how a pre-launch oscillator correction prevents accumulating navigation error.'
    ],
    studentSteps: [
      'Complete the five-step explainer, then open the four-part investigation.',
      'In Part A, find and record the timing error corresponding to the 10.0 m navigation limit.',
      'In Part B, record the gravitational-only, motion-only, and combined GPS clock drifts.',
      'In Part C, adjust the oscillator correction until residual drift is below 0.2 microseconds per day; then run the corrected and uncorrected missions in Part D.',
      'Answer the Buzz questions in order and use results from all four parts in the final responses. The optional evidence image is not submitted or graded.'
    ],
    previewChecks: [
      'The explainer advances through five steps and opens the investigation.',
      'Parts A-D enforce their completion conditions and record all required evidence.',
      'Reset investigation clears the data sheet and the optional evidence image unlocks only after all four parts are complete.'
    ],
    technicalNote: 'This assessment is titled for Honors; change the Buzz title and Meta-lesson tags together if it is assigned as a general-course on-ramp.'
  }
};

const gpsCombinedMisconceptions = [
  'Describes the correction as speeding up the ground oscillator.',
  'Claims the receiver can ignore a satellite clock error because several satellites are used.',
  'Treats the uncorrected position error as constant rather than accumulating.',
  'Omits the measured time at which the 10 m navigation limit was exceeded.'
];

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
}

function questionBlocks(text) {
  return text.trim().split(/\n\s*\n(?=Type:\s*)/).filter(Boolean);
}

function property(block, name) {
  const match = block.match(new RegExp(`^${name}:\\s*(.+)$`, 'm'));
  return match ? match[1].trim() : '';
}

function questionIndex(block) {
  const match = block.match(/^(\d+)\)\s/m);
  return match ? Number(match[1]) : NaN;
}

function prompt(block) {
  const match = block.match(/^\d+\)\s(.+)$/m);
  return match ? match[1].trim() : '';
}

function gradedOn(block) {
  const match = block.match(/^@\[Always\]\s*(?:Grading feedback:\s*)?(.+)$/m);
  return match ? match[1].trim() : '';
}

function rubricPart(block, label) {
  const pattern = label === 'Full credit'
    ? /^a\.\s*Full credit:\s*([\s\S]*?)(?=\s+Partial credit:)/m
    : new RegExp(`\\s+${label}:\\s*([\\s\\S]*?)(?=\\s+(?:No credit:)|$)`, 'm');
  const match = block.match(pattern);
  return match ? match[1].replace(/\s+/g, ' ').trim() : '';
}

function cleanReviewTrigger(value) {
  return value
    .replace(/uploaded evidence image/gi, 'on-screen evidence table')
    .replace(/uploaded data sheet/gi, 'on-screen data sheet')
    .replace(/uploaded evidence/gi, 'on-screen evidence')
    .replace(/evidence image may/gi, 'recorded evidence may');
}

function buildMetadata(item) {
  const questionFile = path.join(item.dir, `${item.slug}_buzz_questions.txt`);
  const metadataFile = path.join(item.dir, `${item.slug}-busybee-rubric-metadata.json`);
  const previous = JSON.parse(read(metadataFile));
  const previousBySkill = new Map(previous.questions.map((question) => [question.metadata['Meta-skill'], question]));
  const essays = questionBlocks(read(questionFile)).filter((block) => /^E\b/.test(property(block, 'Type')));

  const questions = essays.map((block) => {
    const index = questionIndex(block);
    const points = Number(property(block, 'Score'));
    const skill = property(block, 'Meta-skill');
    const evidence = property(block, 'Meta-evidence');
    let prior = previousBySkill.get(skill);
    if (!prior && skill === 'engineering_correction_cer') prior = previousBySkill.get('engineering_correction');
    const commonMisconceptions = skill === 'engineering_correction_cer'
      ? gpsCombinedMisconceptions
      : (prior && prior.commonMisconceptions) || ['Response does not cite the requested recorded evidence.'];

    return {
      id: `${property(block, 'Meta-lesson')}-Q${String(index).padStart(2, '0')}`,
      buzzIndex: index,
      buzzType: 'E',
      points,
      objective: skill.replace(/_/g, ' '),
      metadata: {
        'Meta-unit': property(block, 'Meta-unit'),
        'Meta-lesson': property(block, 'Meta-lesson'),
        'Meta-skill': skill,
        'Meta-grading': property(block, 'Meta-grading'),
        'Meta-evidence': evidence
      },
      prompt: prompt(block),
      gradedOn: gradedOn(block),
      requiredEvidence: evidence.replace(/_/g, ' '),
      rubric: {
        fullCredit: { score: points, criteria: [rubricPart(block, 'Full credit')] },
        partialCredit: { scoreRange: points === 2 ? '1' : '1-2', criteria: [rubricPart(block, 'Partial credit')] },
        noCredit: { score: 0, criteria: [rubricPart(block, 'No credit')] }
      },
      commonMisconceptions,
      feedback: {
        fullCredit: 'Strong work. Your answer uses recorded evidence and connects it to the correct physics idea.',
        partialCredit: 'Revise by adding the specific recorded values and completing the physics reasoning requested in the prompt.',
        noCredit: 'Return to the on-screen evidence, identify the values this question asks about, and explain them using the target concept.',
        teacherNote: 'Flag for review if the reasoning is unusual but could be correct, or if cited values disagree with the on-screen evidence.'
      }
    };
  });

  const metadata = {
    ...previous,
    lastUpdated: '2026-08-10',
    assessmentSettings: {
      ...previous.assessmentSettings,
      totalPoints: 15,
      automaticPoints: 10,
      busybeePoints: 5,
      evidenceDownloadsAreOptional: true
    },
    evidenceRequirements: {
      requiredUploads: [],
      optionalDownloads: [item.optionalEvidence],
      requiredCopiedValues: ['Students read values from the on-screen evidence tables while answering the native Buzz questions.'],
      acceptedFileTypes: [],
      missingEvidenceAction: 'Use the on-screen evidence table and route contradictory or unverifiable written responses to human review.'
    },
    humanReviewTriggers: previous.humanReviewTriggers.map(cleanReviewTrigger),
    questions
  };

  fs.writeFileSync(path.join(root, metadataFile), `${JSON.stringify(metadata, null, 2)}\n`, 'utf8');
  console.log(`Built ${metadataFile} (${questions.length} BusyBee rubrics)`);
}

function numbered(items) {
  return items.map((value, index) => `${index + 1}. ${value}`);
}

function bullets(items) {
  return items.map((value) => `- ${value}`);
}

function buildSetup(item) {
  const guide = setupGuides[item.slug];
  if (!guide) throw new Error(`Missing setup-guide content for ${item.slug}`);

  const questionFile = `${item.slug}_buzz_questions.txt`;
  const metadataFile = `${item.slug}-busybee-rubric-metadata.json`;
  const setupFile = path.join(root, item.dir, `${item.slug}_buzz_setup.txt`);
  const legacyHtml = path.join(root, item.dir, `${item.slug}_buzz_setup.html`);
  const studentSteps = [
    ...guide.studentSteps,
    `Before submitting, confirm that you answered all ${guide.questionCount} questions and that the final two responses cite your recorded evidence.`
  ];
  const teacherChecks = [
    ...guide.previewChecks,
    `Questions 1-${guide.questionCount} appear in their matching labeled slots and the final two essay questions remain last.`,
    'Keyboard navigation, copy/paste, text selection, and the context menu remain available.',
    'Teacher-test data is reset before students open the assessment.'
  ];

  const output = [
    guide.title.toUpperCase(),
    'UNIT 5 BUZZ LAB GUIDE',
    '',
    'YOUR MISSION',
    guide.mission,
    '',
    'WHAT YOU WILL DO AND LEARN',
    ...bullets(guide.learningGoals),
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
    `2. Import the ${guide.questionCount} questions from ${questionFile}.`,
    `3. Confirm the import creates ${guide.questionCount} questions worth 15 points: ${guide.questionMix}.`,
    `4. Upload ${item.buzzTemplate} from this folder as the assessment template.`,
    '5. Turn question randomization/shuffling OFF and one-question-per-page OFF.',
    `6. Confirm the template contains ${guide.questionCount} ordered Buzz question slots.`,
    `7. Use ${metadataFile} as the authoritative BusyBee rubric source if custom Meta- fields are not retained by Buzz.`,
    '',
    'PUBLISHING AND PREVIEW CHECKS',
    ...bullets(teacherChecks),
    `- ${guide.technicalNote}`,
    '',
    'AUTHORITATIVE FILES',
    `- Questions and embedded answer feedback: ${questionFile}`,
    `- BusyBee rubric metadata: ${metadataFile}`,
    `- Buzz assessment template: ${item.buzzTemplate}`,
    `- Generated local preview: ${item.buzzTemplate.replace(/\.html$/, '-preview.html')}`,
    '',
    `Optional evidence record: ${item.optionalEvidence}`,
    ''
  ].join('\n');

  fs.writeFileSync(setupFile, output, 'utf8');
  if (fs.existsSync(legacyHtml)) fs.unlinkSync(legacyHtml);
  console.log(`Built ${path.relative(root, setupFile)}`);
}

function buildTemplate(item) {
  const source = path.join(root, item.dir, item.sourceTemplate);
  const output = path.join(root, item.dir, item.buzzTemplate);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.copyFileSync(source, output);
  console.log(`Built ${item.buzzTemplate}`);
}

assessments.forEach((item) => {
  buildTemplate(item);
  buildMetadata(item);
  buildSetup(item);
});
