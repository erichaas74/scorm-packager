const fs = require('fs');
const path = require('path');

const lessons = [
  {
    dir: 'unit-ApplicationFiles/unit-1/lesson-1',
    template: 'u1l1-motion-graphs-buzz-assessment-template.html',
    questions: 'buzz-assessment-questions.txt',
    output: 'u1l1-motion-graphs-buzz-assessment-template-preview.html'
  },
  {
    dir: 'unit-ApplicationFiles/unit-1/lesson-2',
    template: 'u1l2-city-blocks-buzz-assessment-template.html',
    questions: 'buzz-assessment-questions.txt',
    output: 'u1l2-city-blocks-buzz-assessment-template-preview.html'
  },
  {
    dir: 'unit-ApplicationFiles/unit-1/lesson-3',
    template: 'u1l3-galileo-buzz-assessment-template.html',
    questions: 'buzz-assessment-questions.txt',
    output: 'u1l3-galileo-buzz-assessment-template-preview.html'
  },
  {
    dir: 'unit-ApplicationFiles/unit-1/lesson-4',
    template: 'u1l4-reaction-time-buzz-assessment-template.html',
    questions: 'buzz-assessment-questions.txt',
    output: 'u1l4-reaction-time-buzz-assessment-template-preview.html'
  },
  {
    dir: 'unit-ApplicationFiles/unit-1/lesson-5',
    template: 'u1l5-skydiver-buzz-assessment-template.html',
    questions: 'buzz-assessment-questions.txt',
    output: 'u1l5-skydiver-buzz-assessment-template-preview.html'
  },
  {
    dir: 'unit-ApplicationFiles/unit-1/lesson-honors',
    template: 'u1h-rocket-launch-buzz-assessment-template.html',
    questions: 'buzz-assessment-questions.txt',
    output: 'u1h-rocket-launch-buzz-assessment-template-preview.html'
  },
  {
    dir: 'unit-ApplicationFiles/unit-2/lesson-u2l1',
    template: 'u2l1-phet-projectile-buzz-assessment-template.html',
    questions: 'buzz-assessment-questions.txt',
    output: 'u2l1-phet-projectile-buzz-assessment-template-preview.html'
  },
  {
    dir: 'unit-ApplicationFiles/unit-2/lesson-u2l2',
    template: 'u2l2-launch-velocity-buzz-assessment-template.html',
    questions: 'buzz-assessment-questions.txt',
    output: 'u2l2-launch-velocity-buzz-assessment-template-preview.html'
  },
  {
    dir: 'unit-ApplicationFiles/unit-2/lesson-u2l3',
    template: 'u2l3-circus-launch-buzz-assessment-template.html',
    questions: 'buzz-assessment-questions.txt',
    output: 'u2l3-circus-launch-buzz-assessment-template-preview.html'
  },
  {
    dir: 'unit-ApplicationFiles/unit-2/lesson-u2l4',
    template: 'u2l4-river-rescue-buzz-assessment-template.html',
    questions: 'buzz-assessment-questions.txt',
    output: 'u2l4-river-rescue-buzz-assessment-template-preview.html'
  },
  {
    dir: 'unit-ApplicationFiles/unit-2/lesson-u2l5',
    template: 'u2l5-inertia-tension-buzz-assessment-template.html',
    questions: 'buzz-assessment-questions.txt',
    output: 'u2l5-inertia-tension-buzz-assessment-template-preview.html'
  },
  {
    dir: 'unit-ApplicationFiles/unit-2/lesson-u2honors',
    template: 'u2h-coriolis-cannon-buzz-assessment-template.html',
    questions: 'buzz-assessment-questions.txt',
    output: 'u2h-coriolis-cannon-buzz-assessment-template-preview.html'
  },
  {
    dir: 'unit-ApplicationFiles/unit-3/lesson-1',
    template: 'u3l1-phet-forces-buzz-assessment-template.html',
    questions: 'buzz-assessment-questions.txt',
    output: 'u3l1-phet-forces-buzz-assessment-template-preview.html'
  },
  {
    dir: 'unit-ApplicationFiles/unit-3/lesson-2',
    template: 'u3l2-golf-club-ct-buzz-assessment-template.html',
    questions: 'buzz-assessment-questions.txt',
    output: 'u3l2-golf-club-ct-buzz-assessment-template-preview.html'
  },
  {
    dir: 'unit-ApplicationFiles/unit-3/lesson-3',
    template: 'u3l3-friction-force-buzz-assessment-template.html',
    questions: 'buzz-assessment-questions.txt',
    output: 'u3l3-friction-force-buzz-assessment-template-preview.html'
  },
  {
    dir: 'unit-ApplicationFiles/unit-3/lesson-4',
    template: 'u3l4-collision-lab-buzz-assessment-template.html',
    questions: 'buzz-assessment-questions.txt',
    output: 'u3l4-collision-lab-buzz-assessment-template-preview.html'
  },
  {
    dir: 'unit-ApplicationFiles/unit-3/lesson-5',
    template: 'u3l5-impulse-jump-buzz-assessment-template.html',
    questions: 'buzz-assessment-questions.txt',
    output: 'u3l5-impulse-jump-buzz-assessment-template-preview.html'
  },
  {
    dir: 'unit-ApplicationFiles/unit-4/lesson-2',
    template: 'u4l2-hookes-law-buzz-assessment-template.html',
    questions: 'buzz-assessment-questions.txt',
    output: 'u4l2-hookes-law-buzz-assessment-template-preview.html'
  },
  {
    dir: 'unit-ApplicationFiles/unit-4/lesson-5',
    template: 'u4l5-water-bottle-thermal-test-buzz-assessment-template.html',
    questions: 'buzz-assessment-questions.txt',
    output: 'u4l5-water-bottle-thermal-test-buzz-assessment-template-preview.html'
  },
  {
    dir: 'unit-ApplicationFiles/unit-4/lesson-3',
    template: 'u4l3-loop-sim-lab-buzz-assessment-template.html',
    questions: 'buzz-assessment-questions.txt',
    output: 'u4l3-loop-sim-lab-buzz-assessment-template-preview.html'
  },
  {
    dir: 'unit-ApplicationFiles/unit-6/dynamic-electric-field-lab',
    template: 'u6l2-dynamic-electric-field-buzz-assessment-template.html',
    questions: 'dynamic_electric_field_buzz_questions.txt',
    output: 'u6l2-dynamic-electric-field-buzz-assessment-template-preview.html'
  },
  {
    dir: 'unit-ApplicationFiles/unit-6/electromagnet-lab',
    template: 'u6l4-electromagnet-design-buzz-assessment-template.html',
    questions: 'electromagnet_buzz_questions.txt',
    output: 'u6l4-electromagnet-design-buzz-assessment-template-preview.html'
  },
  {
    dir: 'unit-ApplicationFiles/unit-6/millikan-oil-drop-investigation',
    template: 'u6l1-millikan-buzz-assessment-template.html',
    questions: 'buzz-assessment-questions.txt',
    output: 'u6l1-millikan-buzz-assessment-template-preview.html'
  },
  {
    dir: 'unit-ApplicationFiles/unit-6/circuit-design-challenge',
    template: 'u6l3-circuit-design-buzz-assessment-template.html',
    questions: 'buzz-assessment-questions.txt',
    output: 'u6l3-circuit-design-buzz-assessment-template-preview.html'
  },
  {
    dir: 'unit-ApplicationFiles/unit-6/generator-design-challenge',
    template: 'u6l5-generator-buzz-assessment-template.html',
    questions: 'buzz-assessment-questions.txt',
    output: 'u6l5-generator-buzz-assessment-template-preview.html'
  },
  {
    dir: 'unit-ApplicationFiles/unit-6/honors-electric-motor-engineering-challenge',
    template: 'u6h-motor-buzz-assessment-template.html',
    questions: 'buzz-assessment-questions.txt',
    output: 'u6h-motor-buzz-assessment-template-preview.html'
  },
  {
    dir: 'unit-ApplicationFiles/unit-5/thin-lens-refraction-lab',
    template: 'u5l3-thin-lens-buzz-assessment-template.html',
    questions: 'thin_lens_refraction_buzz_questions.txt',
    output: 'u5l3-thin-lens-buzz-assessment-template-preview.html'
  },
  {
    dir: 'unit-ApplicationFiles/unit-5/sound-waves-resonance-lab',
    template: 'u5l2-resonance-tube-buzz-assessment-template.html',
    questions: 'sound_waves_resonance_buzz_questions.txt',
    output: 'u5l2-resonance-tube-buzz-assessment-template-preview.html'
  },
  {
    dir: 'unit-ApplicationFiles/unit-5/gps-relativity-investigation',
    template: 'u5h-gps-relativity-buzz-assessment-template.html',
    questions: 'gps_relativity_buzz_questions.txt',
    output: 'u5h-gps-relativity-buzz-assessment-template-preview.html'
  },
  {
    dir: 'unit-ApplicationFiles/unit-5/light-color-and-vision-lab',
    template: 'u5l3-light-color-vision-buzz-assessment-template.html',
    questions: 'light_color_vision_buzz_questions.txt',
    output: 'u5l3-light-color-vision-buzz-assessment-template-preview.html'
  },
  {
    dir: 'unit-ApplicationFiles/unit-5/honors-relativity-timekeeping-lab',
    template: 'u5h-relativity-timekeeping-buzz-assessment-template.html',
    questions: 'honors_relativity_buzz_questions.txt',
    output: 'u5h-relativity-timekeeping-buzz-assessment-template-preview.html'
  },
  {
    dir: 'unit-ApplicationFiles/unit-5/doppler-spectral-line-shift',
    template: 'u5l5-spectral-shift-buzz-assessment-template.html',
    questions: 'doppler_spectral_shift_buzz_questions.txt',
    output: 'u5l5-spectral-shift-buzz-assessment-template-preview.html'
  },
  {
    dir: 'unit-ApplicationFiles/unit-5/design-the-perfect-instrument',
    template: 'u5l2-perfect-instrument-buzz-assessment-template.html',
    questions: 'design_perfect_instrument_buzz_questions.txt',
    output: 'u5l2-perfect-instrument-buzz-assessment-template-preview.html'
  }
];

const slotPattern = /<a:question\s*><\/a:question>|<a:question\s*\/>/gi;

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parseQuestions(text) {
  const normalized = text.replace(/\r\n/g, '\n').trim();

  if (!/^Type:\s*/.test(normalized) && /^Question\s+\d+:/m.test(normalized)) {
    return parseLegacyQuestionList(normalized);
  }

  const blocks = normalized
    .split(/\n\s*\n(?=Type:\s*)/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks.map((block, index) => parseQuestionBlock(block, index + 1));
}

function parseLegacyQuestionList(text) {
  const firstQuestion = text.search(/^Question\s+\d+:/m);
  const questionText = firstQuestion >= 0 ? text.slice(firstQuestion) : text;
  const blocks = questionText
    .split(/\n\s*\n(?=Question\s+\d+:)/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks.map((block, index) => {
    const lines = block.split('\n');
    const titleMatch = lines[0].match(/^Question\s+\d+:\s*(.*)$/);
    const title = titleMatch ? titleMatch[1].trim() : `Question ${index + 1}`;
    const fieldMap = {};
    const details = [];
    let prompt = '';

    for (const line of lines.slice(1)) {
      const match = line.match(/^([^:]+):\s*(.*)$/);
      if (!match) {
        if (line.trim()) details.push(line.trim());
        continue;
      }

      const key = match[1].trim();
      const value = match[2].trim();
      if (key === 'Prompt') {
        prompt = value;
      } else if (key === 'Grading guide') {
        details.push(`a. ${value}`);
      } else if (key === 'Points') {
        fieldMap.Score = value;
      } else {
        fieldMap[key] = value;
      }
    }

    const fields = [
      { key: 'Type', value: fieldMap.Type || 'Question' },
      { key: 'Score', value: fieldMap.Score || '' }
    ].filter((field) => field.value);

    return {
      index: index + 1,
      fields,
      fieldMap,
      prompt: `${index + 1}) ${title}${prompt ? ` - ${prompt}` : ''}`,
      details
    };
  });
}

function parseQuestionBlock(block, index) {
  const lines = block.split('\n');
  const fields = [];
  const body = [];
  let readingFields = true;

  for (const line of lines) {
    const fieldMatch = line.match(/^([A-Za-z][A-Za-z0-9 -]*):\s*(.*)$/);
    if (readingFields && fieldMatch) {
      fields.push({ key: fieldMatch[1], value: fieldMatch[2] });
    } else {
      readingFields = false;
      body.push(line);
    }
  }

  const fieldMap = Object.fromEntries(fields.map((field) => [field.key, field.value]));
  const promptIndex = body.findIndex((line) => /^\d+\)\s*/.test(line.trim()));
  const prompt = promptIndex >= 0 ? body[promptIndex].trim() : `Question ${index}`;
  const details = promptIndex >= 0 ? body.slice(promptIndex + 1) : body;

  return {
    index,
    fields,
    fieldMap,
    prompt,
    details: details.filter((line) => line.trim())
  };
}

function renderFieldChips(question) {
  const shownKeys = new Set(['Type', 'Score', 'Figures', 'Height', 'MaxFiles', 'FileTypes', 'MinWords']);
  const chips = question.fields
    .filter((field) => shownKeys.has(field.key))
    .map((field) => `<span class="buzz-preview-chip">${escapeHtml(field.key)}: ${escapeHtml(field.value)}</span>`);

  return chips.length ? `<div class="buzz-preview-chips">${chips.join('')}</div>` : '';
}

function renderDetailLine(line) {
  const trimmed = line.trim();
  const correctOption = trimmed.match(/^\*([a-z])\.\s*(.*)$/i);
  const option = trimmed.match(/^([a-z])\.\s*(.*)$/i);

  if (/^@\[(.*?)\]\s*(.*)$/.test(trimmed)) {
    const match = trimmed.match(/^@\[(.*?)\]\s*(.*)$/);
    return `<div class="buzz-preview-feedback"><strong>${escapeHtml(match[1])}</strong> ${escapeHtml(match[2])}</div>`;
  }

  if (/^@\s*/.test(trimmed)) {
    return `<div class="buzz-preview-feedback">${escapeHtml(trimmed.replace(/^@\s*/, ''))}</div>`;
  }

  if (correctOption) {
    return `<div class="buzz-preview-option correct"><span>${escapeHtml(correctOption[1].toUpperCase())}</span><p>${escapeHtml(correctOption[2])}</p></div>`;
  }

  if (option) {
    return `<div class="buzz-preview-option"><span>${escapeHtml(option[1].toUpperCase())}</span><p>${escapeHtml(option[2])}</p></div>`;
  }

  return `<p class="buzz-preview-detail">${escapeHtml(trimmed)}</p>`;
}

function renderQuestion(question) {
  const type = question.fieldMap.Type || 'Question';
  const score = question.fieldMap.Score || '';
  const details = question.details.map(renderDetailLine).join('\n');

  return `<div class="buzz-preview-question" data-buzz-preview-question="${question.index}">
      <div class="buzz-preview-head">
        <strong>Buzz Question ${question.index}</strong>
        <span>${escapeHtml(type)}${score ? ` - ${escapeHtml(score)} point${score === '1' ? '' : 's'}` : ''}</span>
      </div>
      ${renderFieldChips(question)}
      <div class="buzz-preview-prompt">${escapeHtml(question.prompt)}</div>
      ${details ? `<div class="buzz-preview-details">${details}</div>` : '<div class="buzz-preview-placeholder">Upload question or external response field.</div>'}
    </div>`;
}

function previewStyles() {
  return `
  <style id="buzz-preview-question-styles">
    .buzz-preview-question {
      border: 1px solid #c8d3e1;
      border-left: 5px solid #2563a9;
      border-radius: 8px;
      padding: 12px;
      margin: 8px 0;
      background: #fff;
      color: #172033;
      font-family: Arial, Helvetica, sans-serif;
      line-height: 1.45;
      box-shadow: 0 6px 18px rgba(23, 32, 51, 0.08);
    }
    .buzz-preview-head {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 8px;
      color: #1f3b57;
    }
    .buzz-preview-head strong {
      font-size: 0.95rem;
    }
    .buzz-preview-head span {
      color: #5d687c;
      font-size: 0.82rem;
      font-weight: 700;
    }
    .buzz-preview-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 10px;
    }
    .buzz-preview-chip {
      border: 1px solid #d8e0ec;
      border-radius: 999px;
      padding: 3px 8px;
      background: #f3f7fc;
      color: #334155;
      font-size: 0.74rem;
      font-weight: 700;
    }
    .buzz-preview-prompt {
      margin: 0 0 10px;
      color: #111827;
      font-size: 0.98rem;
      font-weight: 700;
    }
    .buzz-preview-details {
      display: grid;
      gap: 6px;
    }
    .buzz-preview-option {
      display: grid;
      grid-template-columns: 28px minmax(0, 1fr);
      gap: 8px;
      align-items: start;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px;
      background: #f8fafc;
    }
    .buzz-preview-option span {
      display: inline-flex;
      width: 24px;
      height: 24px;
      align-items: center;
      justify-content: center;
      border-radius: 999px;
      background: #dbeafe;
      color: #1e3a8a;
      font-size: 0.78rem;
      font-weight: 800;
    }
    .buzz-preview-option.correct {
      border-color: #86efac;
      background: #f0fdf4;
    }
    .buzz-preview-option.correct span {
      background: #16a34a;
      color: #fff;
    }
    .buzz-preview-option p,
    .buzz-preview-detail {
      margin: 0;
      color: #1f2937;
      font-size: 0.92rem;
    }
    .buzz-preview-feedback {
      border-left: 3px solid #93c5fd;
      padding: 6px 8px;
      background: #eff6ff;
      color: #1e3a8a;
      font-size: 0.86rem;
    }
    .buzz-preview-placeholder {
      border: 1px dashed #cbd5e1;
      border-radius: 6px;
      padding: 10px;
      color: #64748b;
      background: #f8fafc;
      font-size: 0.9rem;
      font-weight: 700;
    }
  </style>`;
}

function buildPreview(lesson) {
  const lessonDir = path.join(process.cwd(), lesson.dir);
  const templatePath = path.join(lessonDir, lesson.template);
  const questionsPath = path.join(lessonDir, lesson.questions);
  const outputPath = path.join(lessonDir, lesson.output);

  const template = fs.readFileSync(templatePath, 'utf8');
  const questions = parseQuestions(fs.readFileSync(questionsPath, 'utf8'));
  let slotIndex = 0;

  const withQuestions = template.replace(slotPattern, () => {
    const question = questions[slotIndex] || {
      index: slotIndex + 1,
      fieldMap: { Type: 'Missing preview question' },
      fields: [{ key: 'Type', value: 'Missing preview question' }],
      prompt: `No question block found for slot ${slotIndex + 1}.`,
      details: []
    };
    slotIndex += 1;
    return renderQuestion(question);
  });

  if (slotIndex === 0) {
    throw new Error(`${lesson.dir}: template did not contain any Buzz question slots.`);
  }

  const output = withQuestions.replace(/<\/head>/i, `${previewStyles()}\n</head>`);
  fs.writeFileSync(outputPath, output, 'utf8');

  return {
    lesson: lesson.dir,
    slots: slotIndex,
    questions: questions.length,
    output: path.relative(process.cwd(), outputPath)
  };
}

const requestedLessons = process.argv.slice(2);
const selectedLessons = requestedLessons.length
  ? lessons.filter((lesson) => requestedLessons.some((request) =>
      lesson.dir === request || lesson.dir.startsWith(`${request}/`) || lesson.template === request
    ))
  : lessons;

if (!selectedLessons.length) {
  throw new Error(`No preview targets matched: ${requestedLessons.join(', ')}`);
}

const results = selectedLessons.map(buildPreview);
for (const result of results) {
  const status = result.slots === result.questions ? 'ok' : 'check';
  console.log(`${status}: ${result.output} (${result.slots} slots, ${result.questions} questions)`);
}
