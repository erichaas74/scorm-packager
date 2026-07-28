const fs=require('fs');
const path=require('path');
const root=__dirname;
const sourcePath=path.join(root,'index.html');
const templatePath=path.join(root,'u4l2-track-race-buzz-assessment-template.html');
const previewPath=path.join(root,'u4l2-track-race-buzz-assessment-template-preview.html');
const questions=[
  ['Question 1 / 2 points / Essay','Predict the fastest track and explain how its shape changes when speed is gained.','Buzz prediction response'],
  ['Question 2 / 2 points / Essay','Record the six shared settings and explain the fair test.','Buzz setup response'],
  ['Question 3 / 6 points / Essay','Paste or recreate the complete four-row race-results table.','Large Buzz response for result data'],
  ['Question 4 / 1 point / Multiple choice','Why do final speeds match when friction is off?','Buzz multiple-choice options'],
  ['Question 5 / 3 points / Essay','Rank race times and use marker and average speeds to explain the result.','Buzz analysis response'],
  ['Question 6 / 3 points / Essay','Explain the energy bars and the velocity and centripetal-acceleration vectors.','Buzz analysis response'],
  ['Question 7 / 4 points / Essay','Report two variable tests and explain what changed.','Buzz variable-investigation response'],
  ['Question 8 / 4 points / Essay','Write a claim-evidence-reasoning conclusion about the fastest track.','Buzz conclusion response']
];
const templateStyles=`
  <style id="buzz-question-layout-styles">
    .buzz-assessment-section{width:min(100% - 24px,1280px);margin:18px auto 36px;padding:18px;border:1px solid #d8e2ee;border-radius:22px;background:#fff;box-shadow:0 18px 50px rgb(23 35 59 / 12%);font-family:Inter,Arial,sans-serif}
    .buzz-assessment-section h2{margin:0;color:#17233b}.buzz-assessment-section>p{margin:5px 0 14px;color:#5e6b82}
    .buzz-question-slot{margin-top:10px;padding:12px;border:1px solid #d8e2ee;border-left:5px solid #2563eb;border-radius:12px;background:#f9fbff}
    .buzz-slot-label{margin:0 0 7px;color:#1d4ed8;font-size:.76rem;font-weight:900;text-transform:uppercase}
  </style>`;
const slots=`
  <section class="buzz-assessment-section" aria-labelledby="buzz-questions-heading">
    <h2 id="buzz-questions-heading">Buzz Assessment Questions</h2>
    <p>Complete at least one race and the variable investigation before answering all eight questions.</p>
    ${questions.map((question,index)=>`<div class="buzz-question-slot"><p class="buzz-slot-label">Question ${index+1}</p><a:question></a:question></div>`).join('\n    ')}
  </section>`;
let source=fs.readFileSync(sourcePath,'utf8');
source=source.replace('</head>',`${templateStyles}\n</head>`).replace('  <script>\n    (() => {',`${slots}\n\n  <script>\n    (() => {`).replace('<title>Unit 4 Lesson 2 - Which Track Is Fastest?</title>','<title>Unit 4 Lesson 2 - Which Track Is Fastest Buzz Assessment</title>');
fs.writeFileSync(templatePath,source,'utf8');
const previewStyles=`
  <style id="buzz-preview-styles">
    .buzz-preview-note{padding:10px 12px;border-radius:9px;background:#eaf1ff;color:#24435d;font-size:.84rem;font-weight:800}
    .buzz-preview-card{display:grid;gap:8px}.buzz-preview-title{color:#1d4ed8;font-size:.77rem;font-weight:900;text-transform:uppercase}
    .buzz-preview-prompt{color:#17233b;font-weight:800}.buzz-preview-placeholder{min-height:74px;padding:11px;border:1px dashed #aebdca;border-radius:9px;background:#fff;color:#7a8798;font-size:.82rem}
  </style>`;
let preview=source.replace('</head>',`${previewStyles}\n</head>`).replace('<p>Complete at least one race and the variable investigation before answering all eight questions.</p>','<p>Complete at least one race and the variable investigation before answering all eight questions.</p><p class="buzz-preview-note">Local preview: these cards show where Buzz inserts its native question controls.</p>');
let index=0;
preview=preview.replace(/<a:question><\/a:question>/g,()=>{const q=questions[index++];return `<div class="buzz-preview-card"><div class="buzz-preview-title">${q[0]}</div><div class="buzz-preview-prompt">${q[1]}</div><div class="buzz-preview-placeholder">${q[2]}</div></div>`});
preview=preview.replace('<title>Unit 4 Lesson 2 - Which Track Is Fastest Buzz Assessment</title>','<title>Preview - Unit 4 Lesson 2 Which Track Is Fastest</title>');
fs.writeFileSync(previewPath,preview,'utf8');
console.log('Built Buzz template and local preview.');

