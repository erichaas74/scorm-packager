'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { applyQuestionLabels } = require('./application-scoring-policy');
const { getFeedbackPolicy, correctFeedback } = require('./assessment-feedback');
let files = 0, count = 0;
for (const unit of [1, 2, 3]) {
  const root = path.join(__dirname, `unit-${unit}`);
  for (const entry of fs.readdirSync(root, { withFileTypes: true }).filter(e => e.isDirectory())) {
    const dir = path.join(root, entry.name), file = path.join(dir, 'busybee-rubric-metadata.json');
    if (!fs.existsSync(file)) continue;
    const metadata = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (metadata.schema !== 'busybee-rubric/v1') continue;
    const FEEDBACK_POLICY = getFeedbackPolicy(metadata.lesson.lesson);
    const bank = fs.readdirSync(dir).find(f => /(?:buzz-assessment-questions|_buzz_questions)\.txt$/.test(f));
    const blocks = fs.readFileSync(path.join(dir, bank), 'utf8').replace(/\r\n/g, '\n').trim().split(/\n\s*\n(?=Type:)/).filter(b => /^Type:/m.test(b));
    assert.equal(metadata.questions.length, blocks.length);
    const before = JSON.stringify(metadata);
    applyQuestionLabels(metadata, blocks);
    assert.equal(JSON.stringify(metadata), before, `${file}: stale or non-idempotent guidance`);
    for (const q of metadata.questions) {
      const block = blocks[q.buzzIndex - 1];
      assert.equal(q.points, Number(block.match(/^Score:\s*(.+)$/m)[1]));
      assert.equal(q.feedbackLabel, `Question ${q.buzzIndex}`);
      assert(q.feedbackInstructions.includes(FEEDBACK_POLICY));
      assert(q.topicsCovered.length > 0);
      assert.equal(q.feedback.whenCorrect, correctFeedback(q.topicsCovered));
      const explanation = q.feedback.whenIncorrect || q.feedback.missedAnswerExample;
      assert(explanation && explanation.split(/\s+/).length <= 25, `${q.id}: explanation must be <=25 words`);
      if (q.grading === 'busybee') {
        assert(q.rubricText.includes('Full credit:'));
        assert(q.rubricText.includes('No credit:'));
        assert.equal(q.rubricText.split(FEEDBACK_POLICY).length - 1, 1);
        assert(q.allowedScores.every(score => score * 2 === Math.round(score * 2)));
      } else {
        assert(q.answerReference, `${q.id}: missing grading reference`);
      }
      count++;
    }
    files++;
  }
}
console.log(`PASS: ${files} metadata files, ${count} question labels and brief explanations, preserved scores, idempotent rebuild guidance`);
