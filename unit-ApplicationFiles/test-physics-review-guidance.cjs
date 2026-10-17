'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { checklists, addGuide, addTemplate } = require('./physics-review-guidance');
const dirs = ['unit-1/lesson-2', 'unit-1/lesson-3', 'unit-1/lesson-4', 'unit-1/lesson-5', 'unit-1/lesson-honors', 'unit-2/lesson-u2l1', 'unit-2/lesson-u2l2', 'unit-2/lesson-u2l3'];
const banks = {};
for (const dir of dirs) {
  const folder = path.join(__dirname, dir);
  const files = fs.readdirSync(folder);
  const metadata = JSON.parse(fs.readFileSync(path.join(folder, 'busybee-rubric-metadata.json'), 'utf8'));
  const lesson = metadata.lesson.lesson;
  const bank = fs.readFileSync(path.join(folder, 'buzz-assessment-questions.txt'), 'utf8').trim().split(/\n\s*\n(?=Type:)/);
  banks[lesson] = bank;
  assert.equal(bank.length, metadata.questions.length);
  assert.equal(metadata.questions.reduce((sum, q) => sum + q.points, 0), 15);
  for (const q of metadata.questions) {
    assert(bank[q.buzzIndex - 1].includes(`${q.buzzIndex}) ${q.prompt}`), `${q.id}: stale prompt`);
    if (q.grading === 'busybee') assert(q.rubricText.includes('Full credit:'));
  }
  const guide = fs.readFileSync(path.join(folder, files.find(f => f.endsWith('_buzz_setup.txt'))), 'utf8');
  const template = fs.readFileSync(path.join(folder, files.find(f => f.endsWith('-buzz-assessment-template.html'))), 'utf8');
  const preview = fs.readFileSync(path.join(folder, files.find(f => f.endsWith('-buzz-assessment-template-preview.html'))), 'utf8');
  assert.equal(addGuide(guide, lesson), guide, `${lesson}: guide rebuild not stable`);
  assert.equal(addTemplate(template, lesson), template, `${lesson}: checklist rebuild not stable`);
  assert.equal((template.match(/id="physics-answer-checklist"/g) || []).length, 1);
  assert(preview.includes('id="physics-answer-checklist"'));
  assert(guide.includes(checklists[lesson][0]));
}
// Actual previously rejected answers from the review, plus materially wrong controls.
function accepts(lesson, number, value) {
  const range = banks[lesson][number - 1].match(/^a\. (-?[\d.]+)\.\.(-?[\d.]+)$/m);
  assert(range, `${lesson} Q${number}: missing numeric range`);
  return value >= Number(range[1]) && value <= Number(range[2]);
}
for (const [lesson, number, value] of [
  ['U1L3',2,19], ['U1L3',2,20], ['U1L3',3,14],
  ['U2L1',2,7.8], ['U2L1',3,15.64], ['U2L1',4,31.3],
  ['U2L1',8,8.6], ['U2L1',9,8.6], ['U2L1',10,8.61],
  ['U2L2',3,12.25], ['U2L2',4,17.15], ['U2L2',5,45.6], ['U2L2',6,38.36]
]) assert(accepts(lesson, number, value), `${lesson} Q${number}: valid rounded answer rejected`);
for (const [lesson, number, value] of [['U1L3',2,4.9], ['U2L1',4,32.56], ['U2L2',4,45.6]]) {
  assert(!accepts(lesson, number, value), `${lesson} Q${number}: incorrect value accepted`);
}
const honors = JSON.parse(fs.readFileSync(path.join(__dirname, 'unit-1/lesson-honors/busybee-rubric-metadata.json'), 'utf8'));
assert.deepEqual(honors.questions.at(-2).allowedScores, [0,0.5,1,1.5,2,2.5,3]);
assert.deepEqual(honors.questions.at(-1).allowedScores, [0,0.5,1,1.5,2,2.5,3,3.5,4]);
assert(banks.U1L5[8].includes('exact numbers are not required'));
assert(banks.U2L2[8].includes('effects compete'));
console.log('PASS: eight aligned lab banks, stable guides/checklists, reviewed numeric answers accepted, wrong controls rejected, honors write-up partial credit preserved.');
