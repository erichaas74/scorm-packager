'use strict';

// Run after the lesson builders. --check verifies generated setup without writing.
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const root = __dirname;
const check = process.argv.includes('--check');
const read = file => fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
const property = (block, name) => (block.match(new RegExp(`^${name}:\\s*(.+)$`, 'm')) || [,''])[1].trim();
function output(file, content) {
  if (check) assert.strictEqual(read(file), content, `Stale setup: ${path.relative(root, file)}`);
  else fs.writeFileSync(file, content, 'utf8');
}

const unit4 = [
  { lesson: 1, slug: 'simple_machine', title: 'Six Simple Machines Work Lab',
    mission: 'Use six adjustable machines to explain how mechanical advantage connects force, distance, work, and speed.',
    goals: ['Calculate ideal mechanical advantage from physical settings.', 'Compare input force and distance while keeping ideal work constant.', 'Use calculations from several machines to explain output speed.'],
    steps: ['Use the shared givens: output force 120 N, output distance 1.0 m, and input speed 1.0 m/s.', 'Work through inclined plane, lever, wedge, wheel and axle, pulley, and screw in order.', 'Compare the two settings named in each pair of questions. Calculate IMA, input force, input distance, ideal work, and output speed using the provided relationships.', 'Answer the two questions beneath each machine. Use the coarse and fine screw calculations and at least two other machines in your final responses.'] },
  { lesson: 2, slug: 'hookes_law', title: "Hooke's Law Lab",
    mission: 'Measure spring stretch and use the force-extension relationship to determine an unknown mass.',
    goals: ['Organize five force-extension measurements with consistent units.', 'Calculate a spring constant and compare it with a best-fit slope.', 'Use Hooke\'s law and evidence to infer a mystery mass.'],
    steps: ['Predict the force-extension relationship.', 'Record all five unique known masses for Spring A, measuring extension to 0.001 m.', 'Calculate and enter a finite positive spring-constant estimate before selecting Calculate best-fit line.', 'Attach the mystery mass and calculate its mass using m = kx/g.', 'Answer the questions using your measurements, slope, fit quality, and mystery-mass result.'] },
  { lesson: 3, slug: 'loop_sim_lab', title: 'Loop-the-Loop Energy Investigation',
    mission: 'Use release-height trials to explain when a cart maintains contact around a vertical loop.',
    goals: ['Apply conservation of energy to calculate speed.', 'Distinguish sufficient energy from the force needed to maintain contact.', 'Compare all three trials using numerical evidence.'],
    steps: ['Answer Question 1 and record the in-app prediction before running trials.', 'Use the fixed assessment conditions: mass 100 kg, radius 20 m, gravity 9.81 m/s2, and zero friction.', 'Run release heights of 45 m, 50 m, and 60 m and inspect the speed and contact evidence.', 'Calculate the requested energy and normal force. Do not treat a hypothetical top speed after detachment as an observed on-track speed.', 'Use all three trials in your final evidence-based conclusion.'] },
  { lesson: 5, slug: 'water_bottle_thermal_test', title: 'Water Bottle Thermal Test',
    mission: 'Compare controlled cooling trials to explain how bottle construction and lids affect thermal-energy transfer.',
    goals: ['Read temperature evidence over a 60-minute interval.', 'Calculate thermal-energy change and average cooling rate.', 'Use controlled comparisons to evaluate insulation and lid effects.'],
    steps: ['Answer Question 1 and record which bottle you predict will keep the water hottest.', 'Run all four trials: plastic with lid, metal with lid, vacuum with lid, and vacuum without lid.', 'Read the recorded temperatures at 0, 15, 30, 45, and 60 minutes.', 'Calculate the requested energy change and average rate with correct signs and units.', 'Use specific temperature evidence to explain the effects of wall construction and the lid.'] }
];

for (const item of unit4) {
  const dir = path.join(root, 'unit-4', `lesson-${item.lesson}`);
  const template = fs.readdirSync(dir).find(name => /-buzz-assessment-template\.html$/.test(name));
  const count = read(path.join(dir, 'buzz-assessment-questions.txt')).split(/^Type:/m).length - 1;
  const student = `${item.title.toUpperCase()}\nUNIT 4 BUZZ LAB GUIDE\n\nYOUR MISSION\n${item.mission}\n\nWHAT YOU WILL DO AND LEARN\n${item.goals.map(goal => `- ${goal}`).join('\n')}\n\nHOW TO COMPLETE THE LAB\n${item.steps.map((step, index) => `${index + 1}. ${step}`).join('\n')}\n${item.steps.length + 1}. Before submitting through Buzz, confirm that all ${count} questions are answered and the final two responses cite your evidence.\n\nSUCCESS AND SCORING\n- The assessment is worth 15 points: 10 auto-graded points plus 5 BusyBee points.\n- The final two evidence responses are worth 2 points and 3 points.\n- No file upload earns or replaces points.\n\n`;
  const teacher = `- ${require('./application-scoring-policy.js').POLICY}\n\nTEACHER BUZZ SETUP\n1. Create a Buzz Assessment titled "Unit 4 Lesson ${item.lesson}: ${item.title}".\n2. Import the ${count} questions from buzz-assessment-questions.txt in this folder.\n3. Confirm ${count} questions totaling 15 points, including the final 2-point and 3-point BusyBee essays.\n4. Upload ${template} as the assessment template.\n5. Turn question randomization/shuffling OFF and one-question-per-page OFF.\n6. Preserve the authored feedback and Meta-grading fields. Use busybee-rubric-metadata.json if the custom metadata is not retained.\n7. Use ${template.replace('.html', '-preview.html')} for local placement review; upload the template, not the preview.\n\nPUBLISHING AND PREVIEW CHECKS\n- Test the fixed assessment version and confirm all ${count} native questions appear in order.\n- Verify the investigation steps above and confirm numeric tolerance ranges and essay points survived import.\n- Verify keyboard controls, normal copy/paste, and question saving in the actual Buzz student preview.\n- Use setup-instructions.html for additional teacher reference values.\n- Simulation progress supplies evidence; native Buzz responses determine the score.\n`;
  output(path.join(dir, `u4l${item.lesson}_${item.slug}_buzz_setup.txt`), student + teacher);
}

require('./application-scoring-policy.js').applyUnits([4, 5, 6], check);

for (const unit of [4, 5, 6]) {
  const unitDir = path.join(root, `unit-${unit}`);
  const guides = [];
  for (const entry of fs.readdirSync(unitDir, { withFileTypes: true }).filter(entry => entry.isDirectory())) {
    const dir = path.join(unitDir, entry.name);
    const files = fs.readdirSync(dir);
    const setup = files.find(name => /_buzz_setup\.txt$/.test(name));
    if (!setup) continue;
    const questionsFile = files.find(name => /(?:buzz-assessment-questions|_buzz_questions)\.txt$/.test(name));
    const template = files.find(name => /-buzz-assessment-template\.html$/.test(name));
    const blocks = read(path.join(dir, questionsFile)).trim().split(/\n\s*\n(?=Type:)/);
    const lesson = blocks.map(block => property(block, 'Meta-lesson')).find(Boolean);
    assert(lesson, `${entry.name}: missing lesson metadata`);
    const essays = blocks.map((block, index) => ({ block, index })).filter(({ block }) => /^E\b/.test(property(block, 'Type')));
    const totalPoints = blocks.reduce((sum, block) => sum + Number(property(block, 'Score')), 0);
    const busybeePoints = essays.reduce((sum, { block }) => sum + Number(property(block, 'Score')), 0);
    const automaticPoints = totalPoints - busybeePoints;
    const settings = { questionOrderLocked: true, randomizeQuestions: false, oneQuestionPerPage: false, totalPoints, automaticPoints, busybeePoints, requiredUploads: [] };
    const setupText = read(path.join(dir, setup));
    const student = setupText.split('TEACHER BUZZ SETUP')[0].trim();
    assert(student.includes(`${totalPoints} points: ${automaticPoints} auto-graded points plus ${busybeePoints} BusyBee points`), `${lesson}: setup score mismatch`);
    assert(setupText.includes(`Import the ${blocks.length} questions`), `${lesson}: setup count mismatch`);
    const html = read(path.join(dir, template));
    assert.strictEqual((html.match(/<a:question\s*(?:><\/a:question>|\/>)/g) || []).length, blocks.length, `${lesson}: slot mismatch`);
    const preview = read(path.join(dir, template.replace('.html', '-preview.html')));
    assert.strictEqual((preview.match(/class="buzz-preview-(?:question|card)"/g) || []).length, blocks.length, `${lesson}: preview count mismatch`);
    blocks.forEach((block, index) => {
      assert.strictEqual(Number((block.match(/^(\d+)\)/m) || [])[1]), index + 1, `${lesson}: question order`);
      assert(!/^UP\b/.test(property(block, 'Type')), `${lesson}: unexpected upload`);
      if (/^MC\b/.test(property(block, 'Type'))) assert.strictEqual((block.match(/^\*[a-z]\./gm) || []).length, 1, `${lesson}: MC key`);
    });
    for (const { block, index } of essays) {
      assert(index >= blocks.length - essays.length, `${lesson}: essay order`);
      assert.strictEqual(property(block, 'Meta-grading'), 'busybee');
      for (const token of ['Meta-evidence:', '@[Always]', 'Full credit:', 'Partial credit:', 'No credit:']) assert(block.includes(token), `${lesson}: missing ${token}`);
    }
    guides.push({ lesson, name: entry.name, student });
    console.log(`${lesson} ${entry.name}: ${blocks.length} questions, ${automaticPoints} auto + ${busybeePoints} BusyBee`);
  }
  assert.strictEqual(guides.length, { 4: 4, 5: 7, 6: 6 }[unit], `Unit ${unit}: missing application guide`);
  guides.sort((a, b) => a.lesson.replace('H', 'L99').localeCompare(b.lesson.replace('H', 'L99'), 'en', { numeric: true }) || a.name.localeCompare(b.name));

}
console.log(check ? 'Application setup consistency passed.' : 'Application setup synchronized.');
