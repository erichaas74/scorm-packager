'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { applyUnits, allowedScores, POLICY } = require('./application-scoring-policy.js');
const result = applyUnits(undefined, true);
assert.deepStrictEqual(result, { applications: 34, essayCount: 64 });
assert.deepStrictEqual(allowedScores(3), [0, 0.5, 1, 1.5, 2, 2.5, 3]);
for (const invalid of [-0.5, 0.25, 2.85, 3.5]) assert(!allowedScores(3).includes(invalid));
assert.deepStrictEqual(allowedScores(4, true), [0, 4]);

let nativeQuestions = 0;
for (const unit of [1, 2, 3, 4, 5, 6]) {
  const unitDir = path.join(__dirname, `unit-${unit}`);
  for (const entry of fs.readdirSync(unitDir, { withFileTypes: true }).filter(entry => entry.isDirectory())) {
    const dir = path.join(unitDir, entry.name);
    const files = fs.readdirSync(dir);
    const bank = files.find(file => /(?:buzz-assessment-questions|_buzz_questions)\.txt$/.test(file));
    if (!bank) continue;
    const blocks = fs.readFileSync(path.join(dir, bank), 'utf8').trim().split(/\r?\n\s*\r?\n(?=Type:)/).filter(block => /^Type:/m.test(block));
    const metadata = JSON.parse(fs.readFileSync(path.join(dir, files.find(file => /busybee-rubric-metadata\.json$/.test(file))), 'utf8'));
    const template = files.find(file => /-buzz-assessment-template\.html$/.test(file));
    const html = fs.readFileSync(path.join(dir, template), 'utf8');
    const preview = fs.readFileSync(path.join(dir, template.replace('.html', '-preview.html')), 'utf8');
    assert.strictEqual((html.match(/<a:question\s*(?:><\/a:question>|\/>)/g) || []).length, blocks.length, `${dir}: native slots`);
    assert.strictEqual((preview.match(/class="buzz-preview-(?:question|card)"/g) || []).length, blocks.length, `${dir}: preview slots`);
    nativeQuestions += blocks.length;
    if (!blocks.length) {
      assert.strictEqual(metadata.assessmentSettings.completionPoints, 15);
      continue;
    }
    const metadataEssays = metadata.questions.filter(question => question.grading === 'busybee' || question.buzzType === 'E');
    const bankEssays = blocks.filter(block => /^Type:\s*E\b/m.test(block));
    assert.strictEqual(metadataEssays.length, bankEssays.length, `${dir}: rubric count`);
    for (const question of metadataEssays) {
      assert(question.rubricText.includes(POLICY), `${dir}: rubric policy`);
      assert(question.allowedScores.every(score => score >= 0 && score <= question.points && Number.isInteger(score * 2)));
      assert(question.allowedScores.includes(0) && question.allowedScores.includes(question.points));
    }
    if (entry.name === 'thin-lens-refraction-lab') {
      const scores = blocks.map(block => Number(block.match(/^Score:\s*(.+)$/m)[1]));
      assert.deepStrictEqual(scores, [...Array(20).fill(0.5), 5]);
      assert.strictEqual((preview.match(/Score: 0\.5</g) || []).length, 20, 'Thin Lens preview must show the new weights');
      assert.strictEqual(metadata.assessmentSettings.automaticPoints, 10);
    }
  }
}
console.log(`Passed: 34 applications, ${nativeQuestions} native questions, 64 BusyBee rubrics, 15-point totals, preview slots, and half-point scoring.`);
