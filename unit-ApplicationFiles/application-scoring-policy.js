'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const root = __dirname;
const POLICY = 'BusyBee scoring: Award points only in 0.5-point increments, including whole points, from 0 to the question maximum. Select a rubric-supported allowed score; never report hundredths such as 2.85/3. Do not average or percentage-scale rubric criteria into an off-grid score. A binary completion rubric still permits only 0 or full credit.';
const read = file => fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
const prop = (block, name) => (block.match(new RegExp(`^${name}:\\s*(.+)$`, 'm')) || [, ''])[1].trim();
const parse = text => text.trim().split(/\n\s*\n(?=Type:)/).filter(block => /^Type:/m.test(block));
const allowedScores = (maximum, binary = false) => binary ? [0, maximum] : Array.from({ length: maximum * 2 + 1 }, (_, index) => index / 2);

function applyUnits(units = [1, 2, 3, 4, 5, 6], check = false) {
  let applications = 0;
  let essayCount = 0;
  function save(file, text) {
    if (check) assert.strictEqual(read(file), text, `Stale scoring/directions: ${path.relative(root, file)}`);
    else if (!fs.existsSync(file) || read(file) !== text) fs.writeFileSync(file, text, 'utf8');
  }
  for (const unit of units) {
    const unitRoot = path.join(root, `unit-${unit}`);
    const guides = [];
    for (const entry of fs.readdirSync(unitRoot, { withFileTypes: true }).filter(entry => entry.isDirectory())) {
      const dir = path.join(unitRoot, entry.name);
      const files = fs.readdirSync(dir);
      const bank = files.find(file => /(?:buzz-assessment-questions|_buzz_questions)\.txt$/.test(file));
      if (!bank) continue;
      const setup = files.find(file => /_buzz_setup\.txt$/.test(file));
      assert(setup, `${dir}: missing setup guide`);
      const template = files.find(file => /-buzz-assessment-template\.html$/.test(file));
      const metadataFile = files.find(file => /busybee-rubric-metadata\.json$/.test(file)) || 'busybee-rubric-metadata.json';
      const metadataPath = path.join(dir, metadataFile);
      const metadata = fs.existsSync(metadataPath) ? JSON.parse(read(metadataPath)) : { schema: 'busybee-rubric/v1', questions: [] };
      let setupText = read(path.join(dir, setup));
      const blocks = parse(read(path.join(dir, bank)));
      applications += 1;
      if (!blocks.length) {
        assert.strictEqual(metadata.schema, 'buzz-scorm-assignment/v1', `${dir}: empty question bank`);
        assert.strictEqual(metadata.assessmentSettings.totalPoints, 15);
        assert.strictEqual(metadata.assessmentSettings.busybeePoints, 0);
        guides.push({ lesson: metadata.lesson.lesson, student: setupText.split('TEACHER BUZZ SETUP')[0].trim() });
        continue;
      }
      const lesson = blocks.map(block => prop(block, 'Meta-lesson')).find(Boolean);
      assert(lesson, `${dir}: missing lesson identifier`);
      const total = blocks.reduce((sum, block) => sum + Number(prop(block, 'Score')), 0);
      assert.strictEqual(total, 15, `${lesson}: every application must total 15 points`);
      let busybee = 0;
      const updated = blocks.map((block, index) => {
        const points = Number(prop(block, 'Score'));
        assert(points > 0 && Number.isInteger(points * 2), `${lesson} Q${index + 1}: score must be a positive half-point multiple`);
        assert.strictEqual(Number((block.match(/^(\d+)\)/m) || [])[1]), index + 1);
        if (!/^E\b/.test(prop(block, 'Type'))) return block;
        busybee += points;
        essayCount += 1;
        assert.strictEqual(prop(block, 'Meta-grading'), 'busybee');
        assert(block.includes('@[Always]'), `${lesson} Q${index + 1}: missing grading feedback`);
        const binary = /Partial credit:\s*None\./i.test(block);
        const scores = allowedScores(points, binary);
        // Keep the rule inside the actual grading feedback, not merely in a separate teacher guide.
        if (!block.includes(POLICY)) block = block.replace(/(@\[Always\][^\n]*)/, `$1 ${POLICY} Allowed scores for this question: ${scores.join(', ')}.`);
        if (!/^Meta-score-increment:/m.test(block)) block = block.replace(/^Meta-grading: busybee$/m, 'Meta-grading: busybee\nMeta-score-increment: 0.5');
        const prior = (metadata.questions || []).find(question => question.buzzIndex === index + 1) || {};
        const question = {
          ...prior, id: prior.id || `${lesson}-Q${String(index + 1).padStart(2, '0')}`,
          buzzIndex: index + 1, buzzType: 'E', points, grading: 'busybee',
          objective: prior.objective || prop(block, 'Meta-skill'), evidence: prop(block, 'Meta-evidence'),
          metadata: { ...(prior.metadata || {}), ...Object.fromEntries([...block.matchAll(/^(Meta-[\w-]+):\s*(.+)$/gm)].map(match => [match[1], match[2].trim()])) },
          prompt: block.match(/^\d+\)\s*([\s\S]*?)(?=\n@\[Always\])/m)[1].trim(),
          rubricText: block.slice(block.indexOf('@[Always]')).trim(),
          scoreIncrement: 0.5, allowedScores: scores, scoringInstructions: POLICY
        };
        if (question.rubric?.partialCredit) {
          question.rubric.partialCredit.allowedScores = scores.filter(score => score > 0 && score < points);
          question.rubric.partialCredit.scoreRange = question.rubric.partialCredit.allowedScores.join(', ') || 'None';
        }
        const priorIndex = metadata.questions.findIndex(question => question.buzzIndex === index + 1);
        if (priorIndex < 0) metadata.questions.push(question);
        else metadata.questions[priorIndex] = question;
        return block;
      });
      save(path.join(dir, bank), updated.join('\n\n') + '\n');
      metadata.lesson ||= { unit: `U${unit}`, lesson, title: setupText.split('\n')[0], activityType: 'buzz-native', simulationFile: template };
      metadata.assessmentSettings = { ...metadata.assessmentSettings, totalPoints: 15, automaticPoints: 15 - busybee, busybeePoints: busybee, questionOrderLocked: true, randomizeQuestions: false, oneQuestionPerPage: false, busybeeScoreIncrement: 0.5, busybeeScoringInstructions: POLICY };
      save(metadataPath, JSON.stringify(metadata, null, 2) + '\n');
      assert(setupText.includes(`15 points: ${15 - busybee} auto-graded points plus ${busybee} BusyBee points`), `${lesson}: setup score mismatch`);
      assert(setupText.includes(`Import the ${blocks.length} questions`), `${lesson}: setup question-count mismatch`);
      if (!setupText.includes(POLICY)) setupText = setupText.replace('TEACHER BUZZ SETUP', `- ${POLICY}\n\nTEACHER BUZZ SETUP`);
      if (!setupText.includes(metadataFile)) setupText += `\nBUSYBEE RUBRIC FALLBACK\nUse ${metadataFile} if Buzz does not retain custom Meta- fields.\n`;
      save(path.join(dir, setup), setupText);
      const legacyDirections = path.join(dir, 'rise-before-you-begin.txt');
      if (fs.existsSync(legacyDirections)) save(legacyDirections, setupText.split('TEACHER BUZZ SETUP')[0].trim() + '\n');
      const legacySetup = path.join(dir, 'setup-instructions.html');
      if (fs.existsSync(legacySetup)) {
        const html = read(legacySetup);
        if (!html.includes('id="busybee-scoring-policy"')) save(legacySetup, html.replace('</body>', `<section id="busybee-scoring-policy"><h2>BusyBee scoring increments</h2><p>${POLICY}</p></section>\n</body>`));
      }
      for (const notes of files.filter(file => /(?:lab-format-suggestions|[-]format-suggestions)\.txt$/.test(file))) {
        const text = read(path.join(dir, notes));
        if (!text.includes(POLICY)) save(path.join(dir, notes), text.trimEnd() + `\n\n${POLICY}\n`);
      }
      guides.push({ lesson, student: setupText.split('TEACHER BUZZ SETUP')[0].trim() });
    }
    assert.strictEqual(guides.length, { 1: 6, 2: 6, 3: 5, 4: 4, 5: 7, 6: 6 }[unit], `Unit ${unit}: missing application`);
    guides.sort((a, b) => a.lesson.replace('H', 'L99').localeCompare(b.lesson.replace('H', 'L99'), 'en', { numeric: true }) || a.student.localeCompare(b.student));
    const directionsPath = path.join(unitRoot, `unit-${unit}-application-directions.txt`);
    const existingDirections = fs.existsSync(directionsPath) ? read(directionsPath) : '';
    const firstLesson = existingDirections.search(new RegExp(`^U${unit}(?:L\\d+|H)\\s*$`, 'm'));
    const introduction = firstLesson >= 0 ? existingDirections.slice(0, firstLesson) : '';
    const existingSections = existingDirections.split(new RegExp(`(?=^U${unit}(?:L\\d+|H)\\s*$)`, 'm'));
    const directionSections = guides.map(({ lesson, student }) => {
      const prior = existingSections.find(section => section.startsWith(`${lesson}\n\n${student.split('\n')[0]}\n`)) || '';
      const explanation = prior.match(/^WHAT THE LAB WILL SHOW\n[\s\S]*?(?=\n[A-Z][A-Z ]+\n|(?![\s\S]))/m);
      if (explanation && !student.includes('WHAT THE LAB WILL SHOW')) {
        student = student.replace('WHAT YOU WILL DO AND LEARN', `${explanation[0].trimEnd()}\n\nWHAT YOU WILL DO AND LEARN`);
      }
      return `${lesson}\n\n${student}`;
    });
    save(directionsPath, introduction + directionSections.join('\n\n\n') + '\n');
    const instructions = path.join(unitRoot, 'buzz-assessment-instructions.html');
    if (fs.existsSync(instructions)) {
      const html = read(instructions);
      if (!html.includes('id="busybee-scoring-policy"')) save(instructions, html.replace('</body>', `<section id="busybee-scoring-policy"><h2>BusyBee scoring increments</h2><p>${POLICY}</p></section>\n</body>`));
    }
  }
  return { applications, essayCount };
}

module.exports = { POLICY, applyUnits, allowedScores };
if (require.main === module) {
  const check = process.argv.includes('--check');
  const result = applyUnits(undefined, check);
  console.log(`${check ? 'Verified' : 'Updated'} ${result.applications} applications at 15 points and ${result.essayCount} BusyBee rubrics with 0.5-point increments.`);
}
