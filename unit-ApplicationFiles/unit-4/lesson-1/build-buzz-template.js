'use strict';

const fs = require('fs');
const path = require('path');

const root = __dirname;
const { machines } = require('./build-six-machine-lab.js');

const sourcePath = path.join(root, 'index.html');
const templatePath = path.join(root, 'u4l1-simple-machine-buzz-assessment-template.html');
const previewPath = path.join(root, 'u4l1-simple-machine-buzz-assessment-template-preview.html');

const questions = [
  { machineId: 'inclined-plane', title: 'Question 1 / 1 point / Multiple choice', prompt: 'Decrease the ramp angle from 45 degrees to 15 degrees. What happens to the input force and IMA?', placeholder: 'Buzz multiple-choice options' },
  { machineId: 'inclined-plane', title: 'Question 2 / 1 point / Multiple choice', prompt: 'For that same angle decrease, what happens to input distance and load speed at the same input speed?', placeholder: 'Buzz multiple-choice options' },
  { machineId: 'lever', title: 'Question 3 / 1 point / Multiple choice', prompt: 'Move the fulcrum from 50% toward 20%, closer to the load. What happens to input force and IMA?', placeholder: 'Buzz multiple-choice options' },
  { machineId: 'lever', title: 'Question 4 / 1 point / Multiple choice', prompt: 'For that fulcrum change, what happens to hand distance and load speed at the same hand speed?', placeholder: 'Buzz multiple-choice options' },
  { machineId: 'wedge', title: 'Question 5 / 1 point / Multiple choice', prompt: 'Change the wedge from a thick 2:1 slope to a thin 6:1 slope. What happens to hammer force and IMA?', placeholder: 'Buzz multiple-choice options' },
  { machineId: 'wedge', title: 'Question 6 / 1 point / Multiple choice', prompt: 'For that thinner wedge, what happens to the driving distance and splitting speed?', placeholder: 'Buzz multiple-choice options' },
  { machineId: 'wheel-and-axle', title: 'Question 7 / 1 point / Multiple choice', prompt: 'Increase the wheel-to-axle ratio from 1.5:1 to 4.0:1. What happens to rim force and IMA?', placeholder: 'Buzz multiple-choice options' },
  { machineId: 'wheel-and-axle', title: 'Question 8 / 1 point / Multiple choice', prompt: 'For that ratio increase, what happens to hand distance and bucket speed at the same hand speed?', placeholder: 'Buzz multiple-choice options' },
  { machineId: 'pulley', title: 'Question 9 / 1 point / Multiple choice', prompt: 'Increase the supporting ropes from one to five. What happens to pull force and IMA?', placeholder: 'Buzz multiple-choice options' },
  { machineId: 'pulley', title: 'Question 10 / 1 point / Multiple choice', prompt: 'For that rope change, what happens to rope distance and load speed at the same pulling speed?', placeholder: 'Buzz multiple-choice options' },
  { machineId: 'screw', title: 'Question 11 / 2 points / Essay', prompt: 'Compare a coarse 8.0 cm pitch with a fine 2.0 cm pitch using your calculated IMA, force, distance, work, and speed values.', placeholder: 'Buzz BusyBee calculation-evidence response' },
  { machineId: 'screw', title: 'Question 12 / 3 points / Essay', prompt: 'Use the screw and two other machines to explain why ideal work stays constant while force, distance, mechanical advantage, and speed are linked.', placeholder: 'Buzz BusyBee synthesis response' }
];

const templateStyles = `
  <style id="buzz-question-layout-styles">
    .machine-question-block { margin-top: 12px; padding: 15px; border: 1px solid #cfe0f0; border-radius: 13px; background: #f8fafc; }
    .machine-question-block h3 { margin: 0; color: #075d66; }
    .machine-question-block > p { margin: 5px 0 11px; color: #475569; line-height: 1.45; }
    .machine-question-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .buzz-question-slot { padding: 12px; border: 1px solid #d8e2ee; border-left: 5px solid #087f8c; border-radius: 11px; background: #fff; color: #17233b; color-scheme: light; }
    .buzz-question-slot :where(input, textarea, select) { background: #fff !important; color: #111827 !important; }
    .buzz-slot-label { margin: 0 0 7px; color: #075d66; font-size: .76rem; font-weight: 900; text-transform: uppercase; }
    @media (max-width: 700px) { .machine-question-grid { grid-template-columns: 1fr; } }
  </style>`;

function buildQuestionBlock(machine) {
  const machineQuestions = questions.filter((question) => question.machineId === machine.id);
  if (machineQuestions.length !== 2) throw new Error(`Expected two questions for ${machine.title}.`);

  return `<section class="machine-question-block" data-question-block="${machine.id}" aria-labelledby="${machine.id}-questions">
        <h3 id="${machine.id}-questions">${machine.title}: Questions ${questions.indexOf(machineQuestions[0]) + 1}-${questions.indexOf(machineQuestions[1]) + 1}</h3>
        <p>Use your calculations from this simulation to answer both questions.</p>
        <div class="machine-question-grid">
          ${machineQuestions.map((question) => {
            const questionNumber = questions.indexOf(question) + 1;
            return `<div class="buzz-question-slot"><p class="buzz-slot-label">Question ${questionNumber}</p><a:question></a:question></div>`;
          }).join('')}
        </div>
      </section>`;
}

let source = fs.readFileSync(sourcePath, 'utf8');
source = source.replace('</head>', `${templateStyles}\n</head>`);
source = source.replace('<title>Unit 4 Lesson 1 - Six Simple Machines Calculation Lab</title>', '<title>Unit 4 Lesson 1 - Six Simple Machines Calculation Lab Buzz Assessment</title>');
source = source.replace('<body>', '<body data-assessment-mode="true">');

for (const machine of machines) {
  const marker = `<!-- BUZZ_QUESTIONS:${machine.id} -->`;
  if (!source.includes(marker)) throw new Error(`Missing question marker for ${machine.title}.`);
  source = source.replace(marker, buildQuestionBlock(machine));
}

const slotCount = (source.match(/<a:question><\/a:question>/g) || []).length;
if (slotCount !== questions.length) throw new Error(`Expected ${questions.length} Buzz slots; found ${slotCount}.`);
source = source.replace(/[ \t]+$/gm, '');
fs.writeFileSync(templatePath, source, 'utf8');

const previewStyles = `
  <style id="buzz-preview-styles">
    .buzz-preview-note { margin: 10px 0 0; padding: 10px 12px; border-radius: 9px; background: #eaf5ff; color: #24435d; font-size: .84rem; font-weight: 800; }
    .buzz-preview-card { display: grid; gap: 8px; }
    .buzz-preview-title { color: #075d66; font-size: .77rem; font-weight: 900; text-transform: uppercase; }
    .buzz-preview-prompt { color: #17233b; font-weight: 800; line-height: 1.45; }
    .buzz-preview-placeholder { min-height: 74px; padding: 11px; border: 1px dashed #aebdca; border-radius: 9px; background: #fff; color: #5e6b82; font-size: .82rem; }
  </style>`;

let preview = source.replace('</head>', `${previewStyles}\n</head>`);
preview = preview.replace(
  '<p>Work through one machine at a time. Change the requested value, use the information provided, and calculate the results before answering the two questions directly below that simulation.</p>',
  '<p>Work through one machine at a time. Change the requested value, use the information provided, and calculate the results before answering the two questions directly below that simulation.</p><p class="buzz-preview-note">Local preview: these cards show where Buzz inserts its native question controls.</p>'
);

let questionIndex = 0;
preview = preview.replace(/<a:question><\/a:question>/g, () => {
  const question = questions[questionIndex++];
  return `<div class="buzz-preview-card"><div class="buzz-preview-title">${question.title}</div><div class="buzz-preview-prompt">${question.prompt}</div><div class="buzz-preview-placeholder">${question.placeholder}</div></div>`;
});
preview = preview.replace('<title>Unit 4 Lesson 1 - Six Simple Machines Calculation Lab Buzz Assessment</title>', '<title>Preview - Unit 4 Lesson 1 Six Simple Machines Calculation Lab</title>');
preview = preview.replace(/[ \t]+$/gm, '');
fs.writeFileSync(previewPath, preview, 'utf8');

console.log(`Built Buzz template and local preview with each simulation above its two questions (${questions.length} total).`);
