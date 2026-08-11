'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;

const common = {
  prepare: 'Have your lesson notes available. Use a calculator and scratch paper when the investigation includes calculations or data comparisons.',
  finish: 'Complete every required investigation step and all required assessment questions. Review unanswered items before submitting. If the lab shows a Submit / Resubmit button, select it and wait for confirmation before returning to Rise.'
};

const applications = [
  { dir: 'unit-4/lesson-1', unit: 'Unit 4 • Lesson 1', title: 'Simple Machine Challenge', focus: 'Compare work, force, distance, and mechanical advantage in simple machines.', steps: ['Complete the practice levels and identify the machine used in each.', 'Record or compare input force and input distance.', 'Use work and mechanical-advantage relationships in the assessment.', 'Finish all required levels and questions, then submit.'] },
  { dir: 'unit-4/lesson-2', unit: 'Unit 4 • Lesson 2', title: "Hooke's Law Lab", focus: 'Determine how spring force and stretch are related and interpret the spring constant.', steps: ['Measure the spring’s extension for several applied forces.', 'Keep units consistent and organize the force–extension data.', 'Use the graph’s slope or the Hooke’s law relationship to find the spring constant.', 'Complete the assessment and submit your results.'] },
  { dir: 'unit-4/lesson-3', unit: 'Unit 4 • Lesson 3', title: 'Loop-the-Loop Energy Investigation', focus: 'Use conservation of energy to explain motion through a vertical loop.', steps: ['Test the object from different starting conditions.', 'Observe speed, height, and whether contact is maintained around the loop.', 'Use kinetic and gravitational potential energy to explain each outcome.', 'Complete all required questions and submit when ready.'] },
  { dir: 'unit-4/lesson-5', unit: 'Unit 4 • Lesson 5', title: 'Water Bottle Thermal Test', focus: 'Analyze thermal-energy transfer and evaluate how well a bottle limits temperature change.', steps: ['Review the test conditions and identify the variables being controlled.', 'Collect or inspect temperature data over the full test interval.', 'Compare temperature change and use the evidence to evaluate performance.', 'Complete the assessment and submit your evidence-based conclusion.'] },

  { dir: 'unit-5/doppler-spectral-line-shift', unit: 'Unit 5', title: 'Spectral Shift Investigation', focus: 'Match absorption-line fingerprints, measure their displacement, and use the shift to infer relative motion.', steps: ['Match the observed absorption-line spacing to a reference element.', 'Move the reference markers until they align with the observed spectrum.', 'Classify the evidence as redshift, blueshift, or no shift.', 'Use the measured shift to determine the object\'s motion relative to Earth.'] },
  { dir: 'unit-5/double-slit-photon-builder', unit: 'Unit 5', title: 'Double-Slit Photon Builder', focus: 'Investigate how individual photon detections build an interference pattern.', steps: ['Begin with a small number of photons and observe individual detections.', 'Increase the trial size and watch the overall pattern emerge.', 'Compare conditions as directed and use the pattern as evidence.', 'Complete the assessment questions and submit your conclusions.'] },
  { dir: 'unit-5/light-color-and-vision-lab', unit: 'Unit 5', title: 'Light Color and Vision Lab', focus: 'Explore additive color mixing, filters, and how light reaching the eye determines perceived color.', steps: ['Test individual light colors before combining them.', 'Change one source or filter at a time and observe the perceived result.', 'Use transmitted, absorbed, and combined light as evidence.', 'Complete all required assessment items and submit.'] },
  { dir: 'unit-5/photoelectric-threshold-lab', unit: 'Unit 5', title: 'Photoelectric Threshold Lab', focus: 'Determine how light frequency and intensity affect photoelectron emission.', steps: ['Test frequencies below and above the threshold.', 'Change intensity separately from frequency and compare what changes.', 'Use the observations to distinguish photon energy from photon number.', 'Complete the assessment and submit your evidence-based answers.'] }
];

function page(app) {
  const steps = app.steps.map((step, index) => `${index + 1}. ${step}`).join('\n');
  if (app.concise) {
    return `${app.unit.toUpperCase()} — ${app.title.toUpperCase()}

BEFORE YOU SUBMIT
${steps}

Do not submit until all six levels, all six questions, and the required evidence upload are complete.
`;
  }
  return `${app.unit.toUpperCase()} — BEFORE YOU BEGIN
${app.title}

Read these directions before selecting Begin. This activity is your opportunity to practice the lesson concepts and collect the evidence you will need for the assessment.

YOUR GOAL
${app.focus}

BE PREPARED
${app.prepare || common.prepare}

WHAT TO DO
${steps}

BEFORE YOU FINISH
${app.finish || common.finish}

When you understand the directions, select Begin.
`;
}

for (const app of applications) {
  const targetDir = path.join(ROOT, ...app.dir.split('/'));
  if (!fs.existsSync(targetDir)) throw new Error(`Application folder not found: ${app.dir}`);
  fs.writeFileSync(path.join(targetDir, 'rise-before-you-begin.txt'), page(app), 'utf8');
}

const rows = applications.map((app, index) => `${index + 1}. ${app.unit} — ${app.title}\n   ${app.dir}/rise-before-you-begin.txt`).join('\n\n');
const index = `RISE BEFORE-YOU-BEGIN DIRECTION FILES

Use the student-facing text in each listed file on the corresponding Rise assessment home page.

${rows}
`;
fs.writeFileSync(path.join(ROOT, 'rise-directions-index.txt'), index, 'utf8');

console.log(`Created ${applications.length} Rise direction text files and rise-directions-index.txt.`);
