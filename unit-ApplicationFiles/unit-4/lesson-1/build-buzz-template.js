const fs = require('fs');
const path = require('path');

const root = __dirname;
const sourcePath = path.join(root, 'index.html');
const templatePath = path.join(root, 'u4l1-simple-machine-buzz-assessment-template.html');
const previewPath = path.join(root, 'u4l1-simple-machine-buzz-assessment-template-preview.html');

const questions = [
  {
    title: 'Question 1 / 1 point / Multiple choice',
    prompt: 'Identify the correct IMA and AMA formulas for the acquired lab data.',
    placeholder: 'Buzz multiple-choice options'
  },
  {
    title: 'Question 2 / 1 point / Number',
    prompt: 'Calculate IMA for inclined-plane Setup B from its distance measurements.',
    placeholder: 'Buzz numeric response'
  },
  {
    title: 'Question 3 / 1 point / Number',
    prompt: 'Calculate AMA for inclined-plane Setup B from its force measurements.',
    placeholder: 'Buzz numeric response'
  },
  {
    title: 'Question 4 / 1 point / Multiple choice',
    prompt: 'Explain why friction makes AMA lower than IMA in this lab.',
    placeholder: 'Buzz multiple-choice options'
  },
  {
    title: 'Question 5 / 1 point / Number',
    prompt: 'Calculate AMA for pulley Setup C from its force measurements.',
    placeholder: 'Buzz numeric response'
  },
  {
    title: 'Question 6 / 1 point / Number',
    prompt: 'Calculate IMA for lever Setup C from its distance measurements.',
    placeholder: 'Buzz numeric response'
  },
  {
    title: 'Question 7 / 2 points / Number',
    prompt: 'Calculate AMA for wheel-and-axle Setup C from its force measurements.',
    placeholder: 'Buzz numeric response'
  },
  {
    title: 'Question 8 / 2 points / Multiple choice',
    prompt: 'Identify the force-distance pattern as IMA increases.',
    placeholder: 'Buzz multiple-choice options'
  },
  {
    title: 'Question 9 / 2 points / Essay',
    prompt: 'Compare IMA, AMA, and input force for all three setups of one machine.',
    placeholder: 'Buzz comparison response'
  },
  {
    title: 'Question 10 / 3 points / Essay',
    prompt: 'Write a CER conclusion comparing IMA with AMA using two machine types.',
    placeholder: 'Buzz conclusion response'
  }
];

const templateStyles = `
  <style id="buzz-question-layout-styles">
    .buzz-assessment-section {
      width: min(100% - 24px, 1240px);
      margin: 18px auto 36px;
      padding: 18px;
      border: 1px solid #d8e2ee;
      border-radius: 22px;
      background: #fff;
      box-shadow: 0 18px 50px rgb(23 35 59 / 12%);
      font-family: Inter, Arial, sans-serif;
    }
    .buzz-assessment-section h2 { margin: 0; color: #17233b; }
    .buzz-assessment-section > p { margin: 5px 0 14px; color: #5e6b82; }
    .buzz-question-slot {
      margin-top: 10px;
      padding: 12px;
      border: 1px solid #d8e2ee;
      border-left: 5px solid #087f8c;
      border-radius: 12px;
      background: #f9fbfc;
    }
    .buzz-slot-label { margin: 0 0 7px; color: #075d66; font-size: .76rem; font-weight: 900; text-transform: uppercase; }
  </style>`;

const questionSlots = `
  <section class="buzz-assessment-section" aria-labelledby="buzz-questions-heading">
    <h2 id="buzz-questions-heading">Buzz Assessment Questions</h2>
    <p>Use the fixed 20 kg load and 1.5 m lift height. Acquire data and correctly calculate IMA and AMA for all four machines, then answer all ten questions.</p>
    ${questions.map((question, index) => `
    <div class="buzz-question-slot">
      <p class="buzz-slot-label">Question ${index + 1}</p>
      <a:question></a:question>
    </div>`).join('')}
  </section>`;

let source = fs.readFileSync(sourcePath, 'utf8');
source = source.replace('</head>', `${templateStyles}\n</head>`);
source = source.replace('  <script>\n    (() => {', `${questionSlots}\n\n  <script>\n    (() => {`);
source = source.replace('<title>Unit 4 Lesson 1 - IMA and AMA Lab</title>', '<title>Unit 4 Lesson 1 - IMA and AMA Lab Buzz Assessment</title>');
source = source.replace('<main class="app" data-simple-machine-app>', '<main class="app" data-simple-machine-app data-assessment-mode="true">');
fs.writeFileSync(templatePath, source, 'utf8');

const previewStyles = `
  <style id="buzz-preview-styles">
    .buzz-preview-note { padding: 10px 12px; border-radius: 9px; background: #eaf5ff; color: #24435d; font-size: .84rem; font-weight: 800; }
    .buzz-preview-card { display: grid; gap: 8px; }
    .buzz-preview-title { color: #075d66; font-size: .77rem; font-weight: 900; text-transform: uppercase; }
    .buzz-preview-prompt { color: #17233b; font-weight: 800; }
    .buzz-preview-placeholder { min-height: 74px; padding: 11px; border: 1px dashed #aebdca; border-radius: 9px; background: #fff; color: #7a8798; font-size: .82rem; }
  </style>`;

let preview = source.replace('</head>', `${previewStyles}\n</head>`);
preview = preview.replace(
  '<p>Use the fixed 20 kg load and 1.5 m lift height. Acquire data and correctly calculate IMA and AMA for all four machines, then answer all ten questions.</p>',
  '<p>Use the fixed 20 kg load and 1.5 m lift height. Acquire data and correctly calculate IMA and AMA for all four machines, then answer all ten questions.</p><p class="buzz-preview-note">Local preview: these cards show where Buzz inserts its native question controls.</p>'
);

let questionIndex = 0;
preview = preview.replace(/<a:question><\/a:question>/g, () => {
  const question = questions[questionIndex++];
  return `<div class="buzz-preview-card"><div class="buzz-preview-title">${question.title}</div><div class="buzz-preview-prompt">${question.prompt}</div><div class="buzz-preview-placeholder">${question.placeholder}</div></div>`;
});
preview = preview.replace('<title>Unit 4 Lesson 1 - IMA and AMA Lab Buzz Assessment</title>', '<title>Preview - Unit 4 Lesson 1 IMA and AMA Lab</title>');
fs.writeFileSync(previewPath, preview, 'utf8');

console.log('Built Buzz template and local preview.');
