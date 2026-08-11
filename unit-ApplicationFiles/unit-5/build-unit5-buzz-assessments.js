const fs = require('fs');
const path = require('path');

const root = __dirname;

const assessments = [
  { slug: 'sound_waves_resonance', sourceTemplate: 'sound_waves_lab_simulation.html', buzzTemplate: 'u5l2-resonance-tube-buzz-assessment-template.html', optionalEvidence: 'resonance-tube-evidence.png — 12-row data table plus the verified final result' },
  { slug: 'design_perfect_instrument', sourceTemplate: 'design-the-perfect-instrument/index.html', buzzTemplate: 'design-the-perfect-instrument/u5l2-perfect-instrument-buzz-assessment-template.html', optionalEvidence: 'instrument-build-evidence.png — all seven recorded challenge builds' },
  { slug: 'thin_lens_refraction', sourceTemplate: 'thin_lens_refraction_investigation.html', buzzTemplate: 'u5l3-thin-lens-buzz-assessment-template.html', optionalEvidence: 'thin-lens-evidence.png — four observations plus three verified calculations' },
  { slug: 'light_color_vision', sourceTemplate: 'light-color-and-vision-lab/index.html', buzzTemplate: 'light-color-and-vision-lab/u5l3-light-color-vision-buzz-assessment-template.html', optionalEvidence: 'light-color-vision-evidence.png — all 18 recorded evidence trials' },
  { slug: 'doppler_spectral_shift', sourceTemplate: 'doppler-spectral-line-shift/index.html', buzzTemplate: 'doppler-spectral-line-shift/u5l5-spectral-shift-buzz-assessment-template.html', optionalEvidence: 'spectral-shift-evidence.png — three recorded spectral matches and shifts' },
  { slug: 'honors_relativity', sourceTemplate: 'honors-relativity-timekeeping-lab/index.html', buzzTemplate: 'honors-relativity-timekeeping-lab/u5h-relativity-timekeeping-buzz-assessment-template.html', optionalEvidence: 'relativity-timekeeping-evidence.png — the student trial table' },
  { slug: 'gps_relativity', sourceTemplate: 'gps_relativity_investigation.html', buzzTemplate: 'u5h-gps-relativity-buzz-assessment-template.html', optionalEvidence: 'gps-relativity-evidence.png — all four investigation parts' }
];

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
  const questionFile = `${item.slug}_buzz_questions.txt`;
  const metadataFile = `${item.slug}-busybee-rubric-metadata.json`;
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

function buildTemplate(item) {
  const source = path.join(root, item.sourceTemplate);
  const output = path.join(root, item.buzzTemplate);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.copyFileSync(source, output);
  console.log(`Built ${item.buzzTemplate}`);
}

assessments.forEach((item) => {
  buildTemplate(item);
  buildMetadata(item);
});
