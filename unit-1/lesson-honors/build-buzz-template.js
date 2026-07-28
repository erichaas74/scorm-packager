const fs = require('fs');
const path = require('path');

const lessonDir = __dirname;

/* Sources vary between CRLF/BOM and LF; every match below assumes plain LF. */
function readSource(name) {
  return fs.readFileSync(path.join(lessonDir, name), 'utf8').replace(/^﻿/, '').replace(/\r\n/g, '\n');
}

const sourceHtml = readSource('index.html');
const sourceCss = readSource('style.css');
const sourceScript = readSource('sim.js');
const outputPath = path.join(lessonDir, 'u1h-rocket-launch-buzz-assessment-template.html');

const EXPECTED_SLOTS = 10;

function replaceOnce(source, find, replacement, label) {
  const parts = source.split(find);
  if (parts.length !== 2) {
    throw new Error(`Expected exactly one match for ${label} (found ${parts.length - 1}).`);
  }
  return parts.join(replacement);
}

/* ------------------------------------------------------------------ *
 * Section definitions
 *
 * Each section renders a complete, independent copy of the lab locked
 * to one flight stage. `rows` drives the Kinematics Values grid: a "?"
 * means the student calculates it, and the simulation must never print
 * that number anywhere on screen. Tokens {a} {t} {g} {retro} resolve
 * against the fixed mission at runtime.
 * ------------------------------------------------------------------ */
const BURN_ROW = ['?', '0.0 m/s', '?', '{a}', '{t}'];
const COAST_ROW = ['?', 'burnout v', '0.0 m/s', '{g}', '?'];

const SECTIONS = [
  {
    key: 1,
    stage: 1,
    tone: 'sky',
    prefix: 's1-',
    eyebrow: 'Section 1 of 4',
    name: 'Powered Burn',
    flightTitle: 'Flight View — Powered Burn',
    chip: 'Stage 1 · Burn',
    blurb: 'The rocket lifts off from rest and holds a constant engine acceleration until cutoff, then the flight freezes. '
      + 'The grid lists only what the flight computer measures: the starting velocity, the burn acceleration, and the burn time. '
      + 'Displacement and burnout velocity stay blank — read the givens off the simulation and calculate them yourself.',
    launchLabel: 'Run Burn',
    runningLabel: 'Burning...',
    replayLabel: 'Replay Burn',
    doneStatus: 'BURN COMPLETE',
    showTimer: true,
    briefChip: 'Burn phase only',
    rowTitles: { 1: 'Burn' },
    rows: { 1: BURN_ROW },
    equations: {
      ready: { label: 'Stage 1', body: 'Press <span class="eq">Run Burn</span> to fly the powered phase.' },
      powered: { label: 'Burn Phase', body: 'Constant acceleration from rest, engine on.' },
      default: { label: 'Burn Complete', body: 'The engine has cut off. Answer the Stage 1 questions in the Mission Brief.' },
    },
    freezeSubs: { cutoff: 'Engine cutoff — the powered phase is over.' },
    questions: {
      title: 'Stage 1 Questions',
      note: 'Both answers come from the burn givens in the grid above. The simulation never displays either one.',
      count: 2,
    },
  },
  {
    key: 2,
    stage: 2,
    tone: 'violet',
    prefix: 's2-',
    eyebrow: 'Section 2 of 4',
    name: 'Coast to Apex',
    flightTitle: 'Flight View — Coast to Apex',
    chip: 'Stage 2 · Coast',
    blurb: 'The same burn runs again, but this time the flight continues after cutoff. With the engine off, gravity alone acts on the rocket '
      + 'until it stops climbing, and the flight freezes at the apex. The mission clock is switched off for this run: the coast duration is '
      + 'one of the values you calculate.',
    launchLabel: 'Run Ascent',
    runningLabel: 'Climbing...',
    replayLabel: 'Replay Ascent',
    doneStatus: 'APEX REACHED',
    showTimer: false,
    briefChip: 'Burn + coast',
    rowTitles: { 1: 'Burn', 2: 'Coast' },
    rows: { 1: BURN_ROW, 2: COAST_ROW },
    equations: {
      ready: { label: 'Stage 2', body: 'Press <span class="eq">Run Ascent</span> to fly the burn and the coast together.' },
      powered: { label: 'Burn Phase', body: 'Engine on. Watch for cutoff.' },
      coast: { label: 'Coast Phase', body: 'Engine off. Gravity alone acts on the rocket.' },
      default: { label: 'Apex Reached', body: 'The rocket has stopped climbing. Answer the Stage 2 questions in the Mission Brief.' },
    },
    freezeSubs: {
      cutoff: 'Engine cutoff — the coast begins here.',
      apex: 'Apex — the rocket has stopped climbing.',
    },
    questions: {
      title: 'Stage 2 Questions',
      note: 'Carry your burnout velocity from Section 1 into the coast row, then use the coast acceleration shown above.',
      count: 2,
    },
  },
  {
    key: 3,
    stage: 3,
    tone: 'red',
    prefix: 's3-',
    eyebrow: 'Section 3 of 4',
    name: 'Apex Verification',
    flightTitle: 'Flight View — Full Ascent',
    chip: 'Stage 3 · Apex',
    blurb: 'The whole ascent again, burn and coast as one flight. Nothing new is measured here — this section is where the two phases get '
      + 'stacked together. The altitude rail, the altitude readout, and the apex marker are all blank, so the maximum height has to come '
      + 'from your Section 1 and Section 2 results rather than from the screen.',
    launchLabel: 'Run Full Ascent',
    runningLabel: 'Climbing...',
    replayLabel: 'Replay Ascent',
    doneStatus: 'APEX REACHED',
    showTimer: false,
    briefChip: 'Ascent total',
    rowTitles: { 1: 'Burn', 2: 'Coast', 3: 'Ascent total' },
    rows: {
      1: BURN_ROW,
      2: COAST_ROW,
      3: ['?', '0.0 m/s', '0.0 m/s', 'two phases', '?'],
    },
    equations: {
      ready: { label: 'Stage 3', body: 'Press <span class="eq">Run Full Ascent</span> to fly liftoff through apex.' },
      powered: { label: 'Burn Phase', body: 'Phase one of the ascent.' },
      coast: { label: 'Coast Phase', body: 'Phase two of the ascent.' },
      default: { label: 'Ascent Complete', body: 'Add the two phases together and answer the Stage 3 questions in the Mission Brief.' },
    },
    freezeSubs: {
      cutoff: 'Engine cutoff — end of phase one.',
      apex: 'Apex — end of phase two.',
    },
    questions: {
      title: 'Stage 3 Questions',
      note: 'Both answers are sums of your Section 1 and Section 2 results. Nothing on this screen reports them.',
      count: 2,
    },
  },
  {
    key: 4,
    stage: 4,
    tone: 'emerald',
    prefix: 's4-',
    eyebrow: 'Section 4 of 4',
    name: 'Full Mission',
    flightTitle: 'Flight View — Full Mission',
    chip: 'Stage 4 · Full mission',
    blurb: 'One uninterrupted flight: burn, coast, free fall, retro burn, touchdown. Every numeric readout is switched off for this run — '
      + 'no clock, no altitude, no velocity, no markers. <strong>Mission rule: the retro engine ignites at one third of the apex height, '
      + 'and the Retro row lists the net acceleration it produces, gravity already included.</strong> These questions are about the flight '
      + 'as a whole, so work out the free-fall and retro phases from that rule and then combine all four phases with your Section 1–3 answers.',
    launchLabel: 'Run Full Mission',
    runningLabel: 'Flying...',
    replayLabel: 'Replay Mission',
    doneStatus: null,
    showTimer: false,
    briefChip: 'All four phases',
    rowTitles: { 1: 'Burn', 2: 'Coast', 3: 'Free fall', 4: 'Retro burn' },
    rows: {
      1: BURN_ROW,
      2: COAST_ROW,
      3: ['?', '0.0 m/s', '?', '{g}', '?'],
      4: ['?', '?', '0.0 m/s', '{retro} net', '?'],
    },
    equations: {
      ready: { label: 'Stage 4', body: 'Press <span class="eq">Run Full Mission</span> and watch all four phases end to end.' },
      powered: { label: 'Burn Phase', body: 'Engine on, climbing away from the pad.' },
      coast: { label: 'Coast Phase', body: 'Engine off, still climbing.' },
      descent: { label: 'Free Fall', body: 'Falling from apex toward the retro ignition height.' },
      retro: { label: 'Retro Burn', body: 'Retro engine on, slowing the rocket for touchdown.' },
      default: { label: 'Touchdown', body: 'The mission is complete. Answer the Stage 4 questions in the Mission Brief.' },
    },
    freezeSubs: {
      cutoff: 'Engine cutoff.',
      apex: 'Apex.',
      retro: 'Retro ignition.',
      landed: 'Touchdown.',
      crashed: 'Vehicle destroyed.',
    },
    questions: {
      title: 'Stage 4 Questions',
      note: 'Nothing on this screen reports a number. These ask about the complete flight, not a single phase.',
      count: 4,
    },
  },
];

/* ------------------------------------------------------------------ *
 * 1. Turn sim.js into a per-instance factory
 * ------------------------------------------------------------------ */
function buildLabFactory(script) {
  let out = script;

  /* Scope every DOM lookup to this instance's root element. */
  out = replaceOnce(
    out,
    "value = Array.from(document.querySelectorAll('.stage-tab'));",
    "value = Array.from(LAB_ROOT.querySelectorAll('.stage-tab'));",
    'stage tab lookup'
  );
  out = replaceOnce(
    out,
    "return document.getElementById('tick-' + index);",
    "return labById('tick-' + index);",
    'tick lookup'
  );
  out = replaceOnce(
    out,
    "value = document.querySelector('.flight-view');",
    "value = LAB_ROOT.querySelector('.flight-view');",
    'flight view lookup'
  );
  out = replaceOnce(
    out,
    "value = document.querySelector('.rocket-glow');",
    "value = LAB_ROOT.querySelector('.rocket-glow');",
    'rocket glow lookup'
  );
  out = replaceOnce(
    out,
    "value = document.getElementById('show-walkthrough');",
    "value = labById('show-walkthrough');",
    'walkthrough button lookup'
  );
  out = replaceOnce(
    out,
    'value = document.getElementById(elementId);',
    'value = labById(elementId);',
    'generic id lookup'
  );
  out = replaceOnce(
    out,
    "value = document.getElementById(elementId.replace(/(\\d+)$/, '-$1'));",
    "value = labById(elementId.replace(/(\\d+)$/, '-$1'));",
    'numeric id fallback'
  );
  out = replaceOnce(
    out,
    "value = document.getElementById(elementId.replace(/(\\d+[a-z])$/i, '-$1'));",
    "value = labById(elementId.replace(/(\\d+[a-z])$/i, '-$1'));",
    'numeric-alpha id fallback'
  );

  /* Keep the copy guard inside the lab so Buzz answer boxes stay usable. */
  out = replaceOnce(
    out,
    "document.addEventListener('copy', function(e) { e.preventDefault(); });",
    "LAB_ROOT.addEventListener('copy', function(e) { e.preventDefault(); });",
    'copy guard'
  );

  /* Every instance flies the same fixed mission so the numeric keys hold. */
  out = replaceOnce(
    out,
    'function createMission(targetHeight) {',
    `function createMission(targetHeight) {
      var fixed = solveMission(20, 2.5);
      return Object.assign({
        id: 'buzz-fixed',
        targetHeight: Number(fixed.apexHeight.toFixed(1)),
        gravity: GRAVITY,
        retroAccel: RETRO_ACCEL,
        safeLandingSpeed: SAFE_LANDING_SPEED,
      }, fixed);
    }

    function createMissionUnused(targetHeight) {`,
    'createMission hook'
  );

  /* Section-specific knowns/unknowns grid. */
  out = replaceOnce(
    out,
    `    function getBriefStageData(stageOverride) {
      var mission = appState.mission;
      var stage = stageOverride || appState.briefStage;`,
    `    function getBriefStageData(stageOverride) {
      var mission = appState.mission;
      var stage = stageOverride || appState.briefStage;
      return labBriefStageData(stageOverride);`,
    'brief stage data hook'
  );

  /* Extra headroom so the rocket at apex never sits under the status text. */
  out = replaceOnce(
    out,
    'return Math.max(90, target / 0.82);',
    'return Math.max(90, target / 0.70);',
    'viewport headroom hook'
  );

  /* Section-specific action button. */
  out = replaceOnce(
    out,
    `    function getActionButtonConfig() {
      var fv = appState.flightView;`,
    `    function getActionButtonConfig() {
      var fv = appState.flightView;
      return labActionButtonConfig();`,
    'action button hook'
  );

  /* Freeze-frame captions must never carry a measured number. */
  out = replaceOnce(
    out,
    'el.freezeSub.textContent = subtitle;',
    "el.freezeSub.textContent = (LAB.freezeSubs && LAB.freezeSubs[type]) || '';",
    'freeze subtitle hook'
  );

  /* Section-specific equation strip. */
  out = replaceOnce(
    out,
    `    function updateEquationStrip() {
      if (!el.eqLabel || !el.eqBody) return;`,
    `    function updateEquationStrip() {
      if (!el.eqLabel || !el.eqBody) return;
      return labEquationStrip();`,
    'equation strip hook'
  );

  /* Scripted flight for this section. */
  out = replaceOnce(
    out,
    '      if (appState.levelMode === 5 && sim.burnOn && sim.time >= appState.mission.burnTime) {',
    `      if (appState.levelMode === LAB_MODE) {
        labAutoScript(sim, mission);
        if (!sim.running) return;
      }

      if (appState.levelMode === 5 && sim.burnOn && sim.time >= appState.mission.burnTime) {`,
    'auto script hook'
  );

  /* Blank every readout the student is being asked to calculate. */
  out = replaceOnce(
    out,
    `        el.finishedCard.classList.add('hidden');
      }
    }

    /* ===== Event Binding ===== */`,
    `        el.finishedCard.classList.add('hidden');
      }

      labRedact();
    }

    /* ===== Event Binding ===== */`,
    'redaction hook'
  );

  /* Replace the standalone bootstrap with the instance bootstrap. */
  out = replaceOnce(out, '\n    init();', `\n${labRuntime()}\n    labInit();\n\n    return { run: labRunFlight, reset: labResetFlight, state: appState };`, 'init hook');

  return `  function createRocketLab(root, LAB) {
    var LAB_ROOT = root;
    var LAB_PREFIX = LAB.prefix || '';
    var LAB_MODE = 9;

    function labById(id) {
      return LAB_ROOT.querySelector('[id="' + LAB_PREFIX + id + '"]');
    }

${out}
  }`;
}

/* ------------------------------------------------------------------ *
 * 2. Per-instance runtime injected into the factory
 * ------------------------------------------------------------------ */
function labRuntime() {
  return `    /* ===== Buzz section runtime ===== */
    function labFormatToken(token) {
      var mission = appState.mission;
      if (token === '{a}') return '+' + mission.burnAccel.toFixed(1) + ' m/s\\u00B2';
      if (token === '{t}') return mission.burnTime.toFixed(2) + ' s';
      if (token === '{g}') return mission.gravity.toFixed(1) + ' m/s\\u00B2';
      if (token === '{retro}') return '+' + mission.retroAccel.toFixed(1) + ' m/s\\u00B2';
      return token;
    }

    function labBriefStageData(stageOverride) {
      /* No override means the flight HUD, which tracks the phase in the air. */
      var stage = stageOverride;
      if (!stage) {
        var fv = appState.flightView;
        var phase = { powered: 1, coast: 2, descent: 3, retro: 4 }[fv.stage];
        stage = (fv.isRunning && phase && LAB.rows[phase]) ? phase : LAB.stage;
      }
      var row = (LAB.rows && LAB.rows[stage]) || ['?', '?', '?', '?', '?'];
      var labels = ['dy', 'v0', 'v', 'a', 't'];
      return {
        title: (LAB.rowTitles && LAB.rowTitles[stage]) || ('Stage ' + stage),
        tone: LAB.tone || 'sky',
        description: '',
        values: row.map(function(cell, index) {
          return { label: labels[index], value: String(cell).replace(/\\{[a-z]+\\}/gi, labFormatToken) };
        }),
      };
    }

    function labActionButtonConfig() {
      var fv = appState.flightView;
      if (fv.isRunning) {
        return { label: LAB.runningLabel, action: null, disabled: true, className: 'btn round ' + LAB.tone };
      }
      if (fv.hasStarted) {
        return { label: LAB.replayLabel, action: labRunFlight, disabled: false, className: 'btn round green' };
      }
      return { label: LAB.launchLabel, action: labRunFlight, disabled: false, className: 'btn round green' };
    }

    function labEquationStrip() {
      var fv = appState.flightView;
      var eq;
      if (!fv.hasStarted) eq = LAB.equations.ready;
      else if (fv.isRunning) eq = LAB.equations[fv.stage] || LAB.equations.default;
      else eq = LAB.equations.default;
      eq = eq || { label: '', body: '' };
      el.eqLabel.textContent = eq.label;
      el.eqBody.innerHTML = eq.body;
    }

    function labFreezeAt(kind) {
      var sim = appState.simulation;
      sim.running = false;
      sim.burnOn = false;
      sim.retroOn = false;
      if (kind === 'apex') sim.v = 0;
      sim.stage = 'coast';
      stopLoop();
      syncFlightView();
      render();
    }

    function labAutoScript(sim, mission) {
      if (sim.burnOn && sim.time >= mission.burnTime) {
        /* Snap to the exact cutoff so the clock matches the given burn time. */
        sim.time = mission.burnTime;
        sim.y = mission.burnoutHeight;
        sim.v = mission.burnoutVelocity;
        sim.maxHeightSeen = Math.max(sim.maxHeightSeen, sim.y);
        sim.burnOn = false;
        sim.stage = 'coast';
        sim.burnCutoffTime = sim.time;
        sim.burnCutoffHeight = sim.y;
        sim.burnCutoffVelocity = sim.v;
        triggerFreezeFrame('cutoff', sim);
        if (LAB.stage === 1) {
          labFreezeAt('cutoff');
          return;
        }
      }

      if (LAB.stage === 1) return;

      if (!sim.burnOn && !sim.retroOn && sim.v <= 0 && sim.time > 0.5) {
        if (LAB.stage === 2 || LAB.stage === 3) {
          sim.time = mission.burnTime + mission.timeToApexFromBurnout;
          sim.y = mission.apexHeight;
          sim.maxHeightSeen = mission.apexHeight;
          triggerFreezeFrame('apex', sim);
          labFreezeAt('apex');
          return;
        }
      }

      if (LAB.stage < 4) return;

      if (!sim.retroOn && sim.v < 0 && sim.y <= mission.retroHeight) {
        sim.y = mission.retroHeight;
        sim.v = -mission.descentSpeedAtRetro;
        sim.retroStartHeight = sim.y;
        sim.retroStartTime = sim.time;
        sim.retroStartVelocity = sim.v;
        sim.retroOn = true;
        sim.stage = 'retro';
        sim.retroLastOnTime = sim.time;
        triggerFreezeFrame('retro', sim);
        return;
      }

      if (sim.retroOn && sim.v >= -0.05) {
        finishFlight('landed', sim.v);
      }
    }

    function labResetFlight() {
      stopLoop();
      clearCrashIgnition();
      if (el.dustCloud) el.dustCloud.classList.remove('active', 'crash');
      resetRocketAttitudeState();
      appState.simulation = Object.assign({}, DEFAULT_SIMULATION_STATE);
      appState.flightView = Object.assign({}, DEFAULT_FLIGHT_VIEW);
      appState.finishedMetrics = null;
      appState.levelDemoResult = null;
      appState.levelMode = LAB_MODE;
      appState.briefStage = LAB.stage;
      syncFlightView();
      render();
    }

    function labRunFlight() {
      labResetFlight();
      var sim = appState.simulation;
      sim.stage = 'powered';
      sim.running = true;
      sim.burnOn = true;
      syncFlightView();
      render();
      appState.rafId = requestAnimationFrame(loop);
    }

    function labBlank(key, text) {
      if (el[key]) el[key].textContent = text;
    }

    function labRedact() {
      var fv = appState.flightView;
      var settled = fv.hasStarted && !fv.isRunning;
      var clock = LAB.showTimer ? fv.time.toFixed(2) + ' s' : '--';

      if (settled) {
        if (LAB.doneStatus && el.flightStageText) el.flightStageText.textContent = LAB.doneStatus;
        labBlank('flightDragSub', 'Run complete');
        /* A frozen frame must not assert a direction (v is 0 at apex) or leak
           magnitude through arrow length. Vectors animate during the run only. */
        if (el.vecVelocity) el.vecVelocity.classList.add('hidden');
        if (el.vecAccel) el.vecAccel.classList.add('hidden');
      }

      labBlank('timerDisplay', clock);
      labBlank('flightTimerDisplay', clock);
      labBlank('instTimer', clock);

      labBlank('flightAltitudeDisplay', '--');
      labBlank('instAltitude', '--');
      labBlank('instAltitudeSub', 'Readout off for this section');
      labBlank('instVelocity', '--');
      labBlank('badgeTarget', '');
      labBlank('scoreBadge', '');
      labBlank('briefTargetChip', LAB.briefChip || '');
      labBlank('coachBurnAnswer', '');
      labBlank('coachRetroAnswer', '');
      if (el.coachStepHint) el.coachStepHint.innerHTML = '';

      if (el.ticks) {
        el.ticks.forEach(function(tick, index) {
          if (tick) tick.textContent = index === 4 ? 'Pad' : '';
        });
      }

      ['minimapApexChip', 'minimapBurnChip', 'minimapRetroChip', 'minimapPredictedChip', 'minimapHeightLabel'].forEach(function(key) {
        if (!el[key]) return;
        el[key].textContent = '';
        el[key].classList.remove('visible');
      });

      if (el.instrumentGrid) el.instrumentGrid.classList.remove('hidden');
      if (el.flightValuesSection) el.flightValuesSection.classList.remove('hidden');
      if (el.finishedCard) el.finishedCard.classList.add('hidden');
    }

    function labInit() {
      appState.mission = createMission();
      appState.briefStage = LAB.stage;
      appState.burnLocked = true;
      appState.coastSubC.done = true;
      appState.coastSubD.done = true;
      closeWalkthrough();
      bindEvents();
      labResetFlight();
    }`;
}

/* ------------------------------------------------------------------ *
 * 3. Per-section markup
 * ------------------------------------------------------------------ */
const appStart = sourceHtml.indexOf('<div class="app">');
const appEnd = sourceHtml.indexOf('<script src="scorm-wrapper.js">');
if (appStart === -1 || appEnd === -1) {
  throw new Error('Could not locate the app markup in index.html.');
}
const appMarkup = sourceHtml.slice(appStart, sourceHtml.lastIndexOf('</div>', appEnd) + 6);

const STAGE_TAB_BLOCK = `<div class="stage-tabs top-stage-tabs">
          <button class="stage-tab active stage-1" data-stage="1">Burn Walkthrough</button>
          <button class="stage-tab stage-2" data-stage="2">Coast Walkthrough</button>
          <button class="stage-tab stage-3" data-stage="3">Apex Verification</button>
          <button class="stage-tab stage-4" data-stage="4">Investigation Mode</button>
        </div>`;

const QUESTION_CARD_BLOCK = `<div id="question-card" class="calc-card sky" style="margin-top:16px;">
              <div class="calc-title" id="question-card-title">Stage 1 Walkthrough &mdash; Burn Phase</div>
              <div class="calc-prompt" id="question-card-prompt">Use the same givens to solve both burn height and burnout velocity before moving to the coast phase.</div>
              <div id="question-card-content"></div>
            </div>`;

const TONE_ORDER = ['sky', 'violet', 'red', 'emerald'];

function buildSectionMarkup(section) {
  let markup = appMarkup;

  markup = replaceOnce(
    markup,
    STAGE_TAB_BLOCK,
    `<div class="stage-tabs top-stage-tabs">
          <span class="lab-stage-chip ${section.tone}">${section.chip}</span>
        </div>`,
    `stage tabs (section ${section.key})`
  );

  const slots = Array.from({ length: section.questions.count }, () => '              <div class="buzz-slot"><a:question></a:question></div>').join('\n');
  markup = replaceOnce(
    markup,
    QUESTION_CARD_BLOCK,
    `<div class="buzz-block ${section.tone}">
              <div class="buzz-block-title">${section.questions.title}</div>
              <p class="buzz-block-note">${section.questions.note}</p>
${slots}
            </div>`,
    `question card (section ${section.key})`
  );

  /* Relabel the kinematics rows for this section's phases. */
  TONE_ORDER.forEach((tone, index) => {
    const label = section.rowTitles[index + 1] || '';
    markup = markup.replace(
      new RegExp(`<div class="stage-val-label ${tone}">[^<]*</div>`),
      `<div class="stage-val-label ${tone}">${label}</div>`
    );
  });

  markup = replaceOnce(
    markup,
    '<span>Flight View</span>',
    `<span>${section.flightTitle}</span>`,
    `flight view title (section ${section.key})`
  );

  /* Namespace every id so four copies can coexist on one page. */
  markup = markup.replace(/ id="([^"]+)"/g, ` id="${section.prefix}$1"`);

  markup = replaceOnce(
    markup,
    '<div class="app">',
    `<div class="app" data-lab-root="${section.key}">`,
    `app root (section ${section.key})`
  );

  return `    <section class="lab-section">
      <div class="lab-section-head ${section.tone}">
        <div class="lab-eyebrow">${section.eyebrow}</div>
        <h2>${section.name}</h2>
        <p>${section.blurb}</p>
      </div>
${markup.split('\n').map((line) => (line.trim() ? `    ${line}` : line)).join('\n')}
    </section>`;
}

const sectionsMarkup = SECTIONS.map(buildSectionMarkup).join('\n\n');

/* ------------------------------------------------------------------ *
 * 4. Template styles
 * ------------------------------------------------------------------ */
const templateStyles = `
    <style>
      [id$="score-badge"],
      [id$="badge-target"],
      [id$="toggle-coach-btn"],
      [id$="show-walkthrough"],
      [id$="coach-card"],
      [id$="finished-card"],
      [id$="new-mission-btn"],
      [id$="retry-btn"],
      [id$="walkthrough-overlay"] {
        display: none !important;
      }

      .lab-intro {
        width: min(1400px, 100%);
        margin: 0 auto 28px;
        color: #e2e8f0;
      }

      .lab-intro h1 {
        margin: 0 0 10px;
        font-size: 1.6rem;
        letter-spacing: 0.01em;
      }

      .lab-intro p {
        margin: 0 0 8px;
        color: #cbd5e1;
        line-height: 1.6;
        max-width: 90ch;
      }

      .lab-section {
        margin: 0 auto 44px;
      }

      .lab-section-head {
        width: min(1400px, 100%);
        margin: 0 auto 18px;
        padding: 16px 20px;
        border: 1px solid #1e293b;
        border-left-width: 6px;
        border-radius: 14px;
        background: #0f172a;
        box-shadow: 0 18px 40px rgba(0, 0, 0, 0.25);
      }

      .lab-section-head.sky { border-left-color: #38bdf8; }
      .lab-section-head.violet { border-left-color: #a78bfa; }
      .lab-section-head.red { border-left-color: #f87171; }
      .lab-section-head.emerald { border-left-color: #34d399; }

      .lab-eyebrow {
        font-size: 0.74rem;
        font-weight: 800;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: #94a3b8;
      }

      .lab-section-head h2 {
        margin: 4px 0 8px;
        font-size: 1.3rem;
        color: #f1f5f9;
      }

      .lab-section-head p {
        margin: 0;
        color: #cbd5e1;
        line-height: 1.6;
        max-width: 95ch;
      }

      .lab-stage-chip {
        display: inline-flex;
        align-items: center;
        padding: 8px 14px;
        border: 1px solid #334155;
        border-radius: 999px;
        background: #0b1220;
        font-size: 0.86rem;
        font-weight: 800;
        color: #e2e8f0;
      }

      .lab-stage-chip.sky { border-color: #38bdf8; color: #7dd3fc; }
      .lab-stage-chip.violet { border-color: #a78bfa; color: #c4b5fd; }
      .lab-stage-chip.red { border-color: #f87171; color: #fca5a5; }
      .lab-stage-chip.emerald { border-color: #34d399; color: #6ee7b7; }

      /* Four stacked labs: keep each flight view a comfortable height. */
      .lab-section .flight-view {
        height: min(640px, calc(100vh - 200px));
        min-height: 480px;
      }

      /* The rocket flies up the centre, so the status label moves out of its lane. */
      .lab-section [id$="flight-stage-text"] {
        position: absolute;
        left: 100px;
        bottom: 16px;
        margin: 0 !important;
        text-align: left !important;
        z-index: 6;
      }

      .buzz-block {
        margin-top: 16px;
        padding: 16px;
        border: 1px solid #c8d3e1;
        border-left: 6px solid #2563a9;
        border-radius: 12px;
        background: #f8fafc;
        color: #172033;
      }

      .buzz-block.sky { border-left-color: #0284c7; }
      .buzz-block.violet { border-left-color: #7c3aed; }
      .buzz-block.red { border-left-color: #dc2626; }
      .buzz-block.emerald { border-left-color: #059669; }

      .buzz-block-title {
        margin-bottom: 6px;
        font-size: 1rem;
        font-weight: 800;
        color: #1f3b57;
      }

      .buzz-block-note {
        margin: 0 0 12px;
        font-size: 0.88rem;
        line-height: 1.5;
        color: #475569;
      }

      .buzz-slot + .buzz-slot {
        margin-top: 10px;
      }
    </style>`;

/* ------------------------------------------------------------------ *
 * 5. Assemble
 * ------------------------------------------------------------------ */
const intro = `    <header class="lab-intro">
      <h1>Unit 1 Honors: Rocket Launch Lab Assessment</h1>
      <p>Four flights of the same mission, one per section. Each simulation shows only the values its flight computer can measure &mdash;
      every quantity you are asked for has been switched off on screen, so the answers have to be calculated, not read.</p>
      <p>Work the sections in order. Section 4 flies the whole mission end to end with every readout dark.</p>
    </header>`;

const bootstrap = `  <script>
    var LAB_SECTIONS = ${JSON.stringify(SECTIONS.map((section) => ({
    key: section.key,
    stage: section.stage,
    tone: section.tone,
    prefix: section.prefix,
    launchLabel: section.launchLabel,
    runningLabel: section.runningLabel,
    replayLabel: section.replayLabel,
    doneStatus: section.doneStatus,
    showTimer: section.showTimer,
    briefChip: section.briefChip,
    rowTitles: section.rowTitles,
    rows: section.rows,
    equations: section.equations,
    freezeSubs: section.freezeSubs,
  })), null, 2).split('\n').join('\n    ')};

    LAB_SECTIONS.forEach(function(config) {
      var root = document.querySelector('[data-lab-root="' + config.key + '"]');
      if (root) createRocketLab(root, config);
    });
  </script>`;

const body = `<body>
${intro}

${sectionsMarkup}

  <script>
${buildLabFactory(sourceScript)}
  </script>
${bootstrap}
</body>`;

const template = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Unit 1 Honors: Rocket Launch Lab Assessment</title>
  <style>
${sourceCss}
  </style>${templateStyles}
</head>
${body}
</html>
`;

const slotCount = (template.match(/<a:question\s*><\/a:question>/g) || []).length;
if (slotCount !== EXPECTED_SLOTS) {
  throw new Error(`Template must contain exactly ${EXPECTED_SLOTS} Buzz question slots (found ${slotCount}).`);
}

fs.writeFileSync(outputPath, template, 'utf8');
console.log(`Built ${path.relative(process.cwd(), outputPath)} (${slotCount} question slots, ${SECTIONS.length} simulations)`);
