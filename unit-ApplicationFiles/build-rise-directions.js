'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;

const common = {
  prepare: 'Have your lesson notes available. Use a calculator and scratch paper when the investigation includes calculations or data comparisons.',
  finish: 'Complete every required investigation step and all required assessment questions. Review unanswered items before submitting. If the lab shows a Submit / Resubmit button, select it and wait for confirmation before returning to Rise.'
};

const applications = [
  { dir: 'unit-1/lesson-1', unit: 'Unit 1 • Lesson 1', title: 'Motion Graphs Lab: Mail Carrier Mystery', focus: 'Connect position–time and velocity–time graphs to an object’s motion.', steps: ['Use Practice mode to explore the delivery cases and read both graphs.', 'Replay or reset a case and use hints when you need more practice.', 'Open Assessment and answer all 15 core questions; questions 16–20 are optional bonus.', 'When satisfied with your work, select Submit / Resubmit to Buzz and wait for confirmation.'] },
  { dir: 'unit-1/lesson-1-additions', unit: 'Unit 1 • Lesson 1', title: 'Motion Graphs Lab: Alternate Build', focus: 'Practice interpreting position, velocity, stops, and changes in direction from motion graphs.', steps: ['Work through the practice cases before attempting assessment questions.', 'Compare what the animation does with the position and velocity graphs.', 'Complete the required assessment questions and check that each has a response.', 'Submit your score when ready and wait for the confirmation message.'] },
  { dir: 'unit-1/lesson-2', unit: 'Unit 1 • Lesson 2', title: 'City Blocks Challenge', concise: true, focus: 'Use position, displacement, distance, speed, and direction to describe motion through a city.', steps: ['Complete all six City Blocks levels.', 'Use your completed routes and results to answer all six assessment questions.', 'Upload the required screenshot or evidence image.', 'Review every answer, then submit the assessment to Buzz.'] },
  { dir: 'unit-1/lesson-3', unit: 'Unit 1 • Lesson 3', title: 'Galileo Acceleration Lab', focus: 'Investigate how velocity changes over time and use evidence to describe acceleration.', steps: ['Run each trial and observe the motion before recording conclusions.', 'Compare position, velocity, and time data across trials.', 'Use patterns in the data—not a single observation—to answer the assessment.', 'Complete all required questions and submit when ready.'] },
  { dir: 'unit-1/lesson-3-netlify-galileo-upload', unit: 'Unit 1 • Lesson 3', title: 'Galileo Acceleration Lab: Hosted Build', focus: 'Investigate acceleration by comparing motion and velocity over time.', steps: ['Launch and observe more than one trial.', 'Use the displayed measurements and graphs as evidence.', 'Answer the assessment questions using the trends you observed.', 'Review every response and submit when ready.'] },
  { dir: 'unit-1/lesson-4', unit: 'Unit 1 • Lesson 4', title: 'Reaction Time Kinematics Lab', focus: 'Measure reaction time and apply kinematics to compare human performance.', steps: ['Complete several practice trials so you understand the controls.', 'Collect enough trials to identify a representative reaction time.', 'Use your data and the lesson’s kinematics relationships in the assessment.', 'Complete all required questions, then submit your work.'] },
  { dir: 'unit-1/lesson-5', unit: 'Unit 1 • Lesson 5', title: 'Skydiver Graphs and BASE Jump Challenge', focus: 'Interpret free-fall motion, changing velocity, and graph evidence during a jump.', steps: ['Explore the skydiver motion and watch how the graphs change.', 'Use multiple trials when the challenge allows different conditions.', 'Base assessment answers on graph features and recorded observations.', 'Finish all required questions and submit when ready.'] },
  { dir: 'unit-1/lesson-honors', unit: 'Unit 1 • Honors', title: 'Mission Control Retro-Burn Landing', focus: 'Apply kinematics and acceleration reasoning to plan a safe rocket landing.', steps: ['Practice with the controls and observe how burn timing changes the landing.', 'Use motion data to revise your plan rather than guessing repeatedly.', 'Complete the mission and use your best trial as evidence in the assessment.', 'Review all answers and submit your final work.'] },
  { dir: 'unit-1/new-lesson-4', unit: 'Unit 1 • Lesson 4', title: 'Reaction Time Kinematics Lab: Updated Build', focus: 'Measure reaction time and connect the results to kinematics.', steps: ['Use the practice level to learn the timing controls.', 'Run multiple trials and compare the results.', 'Use your collected evidence to complete the assessment.', 'Check your responses and submit when ready.'] },
  { dir: 'unit-1/new-lesson-4-netlify', unit: 'Unit 1 • Lesson 4', title: 'Reaction Time Kinematics Lab: Hosted Build', focus: 'Measure reaction time and use trial data to reason about motion.', steps: ['Practice before recording a final result.', 'Complete multiple trials and note variation in reaction time.', 'Answer the assessment using your evidence and lesson concepts.', 'Review and submit all required work.'] },
  { dir: 'unit-1/new-lesson-4-netlify-scorm', unit: 'Unit 1 • Lesson 4', title: 'Reaction Time Kinematics Lab: SCORM Build', focus: 'Measure reaction time, analyze trial data, and connect it to kinematics.', steps: ['Practice the activity controls first.', 'Collect and compare multiple reaction-time trials.', 'Complete every required assessment response.', 'Use the in-lab submit control and wait for LMS confirmation.'] },

  { dir: 'unit-2/lesson-u2l1', unit: 'Unit 2 • Lesson 1', title: 'PhET Projectile Launch Lab', focus: 'Explore how launch conditions affect the path and range of a projectile.', steps: ['Use the simulation controls to establish a consistent starting setup.', 'Change one variable at a time and compare the resulting trajectories.', 'Record the observations needed for the assessment questions.', 'Complete and submit the assessment after your investigation.'] },
  { dir: 'unit-2/lesson-u2l2', unit: 'Unit 2 • Lesson 2', title: 'Projectile Launch: Finding Launch Velocity', focus: 'Use projectile motion measurements to determine an unknown launch velocity.', steps: ['Review the given measurements and identify the known quantities.', 'Run or replay the launch and collect the needed time, distance, or height data.', 'Show calculations on scratch paper and use correct units.', 'Enter all required answers, review them, and submit.'] },
  { dir: 'unit-2/lesson-u2l3', unit: 'Unit 2 • Lesson 3', title: 'Circus Launch: Complementary Angles', focus: 'Compare projectile trajectories launched at complementary angles.', steps: ['Run paired trials using complementary launch angles.', 'Keep launch speed and other conditions constant while comparing angles.', 'Compare range, height, and flight time using the displayed evidence.', 'Complete the assessment and submit when ready.'] },
  { dir: 'unit-2/lesson-u2l4', unit: 'Unit 2 • Lesson 4', title: 'River Rescue: Relative Velocity Lab', focus: 'Combine velocity vectors to plan a safe river crossing.', steps: ['Identify the boat velocity, current velocity, and desired destination.', 'Adjust the heading and test the resulting path across the river.', 'Use vector components and the simulation evidence in your answers.', 'Complete all required questions and submit your final response.'] },
  { dir: 'unit-2/lesson-u2l5', unit: 'Unit 2 • Lesson 5', title: 'Inertia and Tension Demonstration', focus: 'Use evidence to explain inertia, net force, and tension in connected objects.', steps: ['Run the demonstration and observe each object carefully.', 'Compare what happens before, during, and after the force is applied.', 'Use force and inertia concepts to explain the evidence.', 'Answer every required question and submit when ready.'] },
  { dir: 'unit-2/lesson-u2honors', unit: 'Unit 2 • Honors', title: 'Coriolis Cannon Investigation', focus: 'Analyze motion in a rotating reference frame and account for Coriolis deflection.', steps: ['Practice aiming while the platform is stationary and rotating.', 'Change one launch condition at a time and note the resulting deflection.', 'Use reference-frame reasoning and trial evidence to refine your solution.', 'Complete the honors assessment and submit your final work.'] },

  { dir: 'unit-3/lesson-1', unit: 'Unit 3 • Lesson 1', title: 'PhET Forces and Motion Lab', focus: 'Relate applied force, net force, mass, friction, and acceleration.', steps: ['Explore the controls and identify all forces acting on the object.', 'Change one variable at a time and compare the motion.', 'Use force diagrams and simulation evidence when answering questions.', 'Complete all required assessment items and submit.'] },
  { dir: 'unit-3/lesson-2', unit: 'Unit 3 • Lesson 2', title: 'USGA Golf Club CT Compliance Test', focus: 'Use collision timing and measurement evidence to evaluate golf-club compliance.', steps: ['Review the test procedure and the compliance threshold before testing.', 'Run the measurement carefully and record the characteristic time result.', 'Compare the measured value with the stated standard.', 'Support your compliance decision with evidence, then submit the assessment.'] },
  { dir: 'unit-3/lesson-3', unit: 'Unit 3 • Lesson 3', title: 'Friction Force Lab: Static vs. Kinetic', focus: 'Compare static and kinetic friction and identify the maximum static-friction force.', steps: ['Increase the applied force gradually and observe when motion begins.', 'Compare force readings before and after the object starts moving.', 'Use the graph or data to distinguish static from kinetic friction.', 'Complete the assessment using evidence and submit.'] },
  { dir: 'unit-3/lesson-4', unit: 'Unit 3 • Lesson 4', title: 'Collision Lab Simulator', focus: 'Investigate momentum changes in elastic and inelastic collisions.', steps: ['Record each object’s mass and velocity before the collision.', 'Run the collision and compare velocities and momentum afterward.', 'Use signs consistently to represent direction.', 'Complete the required calculations and explanations, then submit.'] },
  { dir: 'unit-3/lesson-u3l5', unit: 'Unit 3 • Lesson 5', title: 'Impulse Jump Lab', focus: 'Connect force–time graphs, impulse, momentum change, and jump performance.', steps: ['Run a jump and inspect the force–time data.', 'Compare trials or adjust the motion to see how force and contact time change.', 'Use the area under the force–time graph as evidence for impulse.', 'Complete all assessment questions and submit when ready.'] },

  { dir: 'unit-4/lesson-1', unit: 'Unit 4 • Lesson 1', title: 'Simple Machine Challenge', focus: 'Compare work, force, distance, and mechanical advantage in simple machines.', steps: ['Complete the practice levels and identify the machine used in each.', 'Record or compare input force and input distance.', 'Use work and mechanical-advantage relationships in the assessment.', 'Finish all required levels and questions, then submit.'] },
  { dir: 'unit-4/lesson-2', unit: 'Unit 4 • Lesson 2', title: "Hooke's Law Lab", focus: 'Determine how spring force and stretch are related and interpret the spring constant.', steps: ['Measure the spring’s extension for several applied forces.', 'Keep units consistent and organize the force–extension data.', 'Use the graph’s slope or the Hooke’s law relationship to find the spring constant.', 'Complete the assessment and submit your results.'] },
  { dir: 'unit-4/lesson-3', unit: 'Unit 4 • Lesson 3', title: 'Loop-the-Loop Energy Investigation', focus: 'Use conservation of energy to explain motion through a vertical loop.', steps: ['Test the object from different starting conditions.', 'Observe speed, height, and whether contact is maintained around the loop.', 'Use kinetic and gravitational potential energy to explain each outcome.', 'Complete all required questions and submit when ready.'] },
  { dir: 'unit-4/lesson-5', unit: 'Unit 4 • Lesson 5', title: 'Water Bottle Thermal Test', focus: 'Analyze thermal-energy transfer and evaluate how well a bottle limits temperature change.', steps: ['Review the test conditions and identify the variables being controlled.', 'Collect or inspect temperature data over the full test interval.', 'Compare temperature change and use the evidence to evaluate performance.', 'Complete the assessment and submit your evidence-based conclusion.'] },

  { dir: 'unit-5/doppler-spectral-line-shift', unit: 'Unit 5', title: 'Doppler and Spectral-Line Shift', focus: 'Connect source motion to observed wavelength, frequency, and spectral-line shifts.', steps: ['Explore approaching and receding motion before answering questions.', 'Compare the displayed wavelength or spectral lines for each case.', 'Use redshift and blueshift evidence to determine direction of motion.', 'Complete all required questions and submit when ready.'] },
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
