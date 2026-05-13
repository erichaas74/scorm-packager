(function() {
  'use strict';

  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     CONSTANTS
     â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
  var G = 9.81;
  var DRAG_ACCEL = 40.0;
  var DRAG_FINISH_DISTANCE = 320;
  var SPRINT_TRACK_DISTANCE = 50;
  var RUNNER_ACCEL = 6.0;
  var RUNNER_TOP_SPEED = 10.0;
  var RULER_TOTAL_CM = 300;
  var RULER_PX_PER_CM = 7;
  var RULER_MISS_SECONDS = Math.sqrt((2 * (RULER_TOTAL_CM / 100)) / G);
  var REACTION_MISS_SECONDS = 3;
  var SPRINT_SET_TO_GUN_MIN_MS = 900;
  var SPRINT_SET_TO_GUN_RANDOM_MS = 800;
  var level1PreviewId = null;

  // â”€â”€ Starter gun state â”€â”€
  var gunAudioCtx = null;
  var dragEngineLoop = null;
  var muzzleFlashStart = 0;        // timestamp when gun fired
  var MUZZLE_FLASH_DURATION = 250; // ms
  var opponentDelay = 0;           // randomized each race

  // â”€â”€ Bridge to graphics modules (drag-race.js, sprint.js) â”€â”€
  // The sprint module reads muzzleFlashStart and opponentDelay from here.
  window.SimShared = window.SimShared || {};
  window.SimShared.muzzleFlashStart = 0;
  window.SimShared.opponentDelay = 0;

  function warmAudioCtx() {
    var AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return null;
    if (!gunAudioCtx) gunAudioCtx = new AudioCtor();
    if (gunAudioCtx.state === 'suspended') gunAudioCtx.resume();
    return gunAudioCtx;
  }

  function playGunshot() {
    var ctx = warmAudioCtx();
    if (!ctx) return;
    var t = ctx.currentTime;

    var master = ctx.createGain();
    var comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -30;
    comp.knee.value = 18;
    comp.ratio.value = 18;
    comp.attack.value = 0.001;
    comp.release.value = 0.11;
    master.gain.setValueAtTime(3.6, t);
    master.gain.exponentialRampToValueAtTime(0.02, t + 0.28);
    master.connect(comp);
    comp.connect(ctx.destination);

    // White-noise burst (the bang)
    var dur = 0.18;
    var buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.028));
    var src = ctx.createBufferSource();
    src.buffer = buf;
    // Bandpass for punch
    var bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 950; bp.Q.value = 0.75;
    src.connect(bp); bp.connect(master);
    src.start(t); src.stop(t + dur);

    // Bright crack for a starter-pistol edge.
    var crackDur = 0.045;
    var crackBuf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * crackDur), ctx.sampleRate);
    var crackData = crackBuf.getChannelData(0);
    for (var j = 0; j < crackData.length; j++) crackData[j] = (Math.random() * 2 - 1) * Math.exp(-j / (ctx.sampleRate * 0.008));
    var crack = ctx.createBufferSource();
    var hp = ctx.createBiquadFilter();
    crack.buffer = crackBuf;
    hp.type = 'highpass'; hp.frequency.value = 1800; hp.Q.value = 0.8;
    crack.connect(hp); hp.connect(master);
    crack.start(t); crack.stop(t + crackDur);

    // Low thud overlay
    var osc = ctx.createOscillator();
    osc.type = 'sine'; osc.frequency.setValueAtTime(95, t); osc.frequency.exponentialRampToValueAtTime(32, t + 0.20);
    var oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(1.5, t); oscGain.gain.exponentialRampToValueAtTime(0.02, t + 0.24);
    osc.connect(oscGain); oscGain.connect(master);
    osc.start(t); osc.stop(t + 0.20);
  }

  function playStarterTone(freq, duration) {
    var ctx = warmAudioCtx();
    if (!ctx) return;
    var t = ctx.currentTime;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.16, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  }

  function speakCue(text, options, onDone) {
    options = options || {};
    var fallbackDelay = options.fallbackDelay || 1000;
    var speechFallbackId = null;
    if (!('speechSynthesis' in window)) {
      if (onDone) timerId = setTimeout(onDone, fallbackDelay);
      return;
    }
    try {
      window.speechSynthesis.cancel();
      var completed = false;
      var utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = options.rate || 1;
      utterance.pitch = options.pitch || 1;
      utterance.volume = options.volume || 1;
      utterance.onend = utterance.onerror = function() {
        if (completed) return;
        completed = true;
        if (speechFallbackId) clearTimeout(speechFallbackId);
        if (onDone) onDone();
      };
      window.speechSynthesis.speak(utterance);
      if (onDone) {
        speechFallbackId = setTimeout(function() {
          if (completed) return;
          completed = true;
          if (onDone) onDone();
        }, fallbackDelay);
      }
    } catch (err) {
      if (onDone) timerId = setTimeout(onDone, fallbackDelay);
    }
  }

  function playStarterCue(text) {
    if (text === 'Set') {
      playStarterTone(620, 0.18);
    }
    speakCue(text, {
      rate: text === 'On your marks' ? 1.18 : 0.88,
      pitch: 0.82,
      fallbackDelay: text === 'On your marks' ? 900 : 500
    });
  }

  function playEngineRev() {
    var ctx = warmAudioCtx();
    if (!ctx) return;
    var t = ctx.currentTime;
    var duration = 2.2;
    var master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, t);
    master.gain.exponentialRampToValueAtTime(0.42, t + 0.08);
    master.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    master.connect(ctx.destination);

    for (var i = 0; i < 3; i++) {
      var osc = ctx.createOscillator();
      osc.type = i === 0 ? 'sawtooth' : 'square';
      osc.frequency.setValueAtTime(55 + i * 11, t);
      osc.frequency.exponentialRampToValueAtTime(150 + i * 28, t + duration * 0.82);
      osc.connect(master);
      osc.start(t);
      osc.stop(t + duration);
    }

    var thump = ctx.createOscillator();
    thump.type = 'sine';
    thump.frequency.setValueAtTime(42, t);
    thump.frequency.exponentialRampToValueAtTime(88, t + duration * 0.75);
    thump.connect(master);
    thump.start(t);
    thump.stop(t + duration);
  }

  function stopDragEngineLoop() {
    if (!dragEngineLoop) return;
    try {
      dragEngineLoop.master.gain.cancelScheduledValues(dragEngineLoop.ctx.currentTime);
      dragEngineLoop.master.gain.setTargetAtTime(0.0001, dragEngineLoop.ctx.currentTime, 0.06);
    } catch (e) {}
    for (var i = 0; i < dragEngineLoop.sources.length; i++) {
      try { dragEngineLoop.sources[i].stop(dragEngineLoop.ctx.currentTime + 0.18); } catch (e2) {}
    }
    dragEngineLoop = null;
  }

  function setDragEngineIntensity(multiplier) {
    if (!dragEngineLoop) return;
    var ctx = dragEngineLoop.ctx;
    var t = ctx.currentTime;
    var intensity = Math.max(0.6, multiplier || 1);
    dragEngineLoop.master.gain.cancelScheduledValues(t);
    dragEngineLoop.master.gain.setTargetAtTime(0.16 * intensity, t, 0.08);
    dragEngineLoop.filter.frequency.cancelScheduledValues(t);
    dragEngineLoop.filter.frequency.setTargetAtTime(180 + 120 * intensity, t, 0.1);
    dragEngineLoop.osc1.frequency.cancelScheduledValues(t);
    dragEngineLoop.osc1.frequency.setTargetAtTime(42 + 12 * intensity, t, 0.08);
    dragEngineLoop.osc2.frequency.cancelScheduledValues(t);
    dragEngineLoop.osc2.frequency.setTargetAtTime(63 + 18 * intensity, t, 0.08);
    dragEngineLoop.osc3.frequency.cancelScheduledValues(t);
    dragEngineLoop.osc3.frequency.setTargetAtTime(84 + 25 * intensity, t, 0.08);
  }

  function startDragEngineLoop(multiplier) {
    var ctx = warmAudioCtx();
    if (!ctx) return;
    if (dragEngineLoop) {
      setDragEngineIntensity(multiplier || 1);
      return;
    }

    var t = ctx.currentTime;
    var master = ctx.createGain();
    var filter = ctx.createBiquadFilter();
    var wobble = ctx.createOscillator();
    var wobbleGain = ctx.createGain();
    var osc1 = ctx.createOscillator();
    var osc2 = ctx.createOscillator();
    var osc3 = ctx.createOscillator();

    master.gain.setValueAtTime(0.0001, t);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(220, t);
    filter.Q.value = 0.9;

    wobble.type = 'sine';
    wobble.frequency.setValueAtTime(7, t);
    wobbleGain.gain.setValueAtTime(5, t);
    wobble.connect(wobbleGain);
    wobbleGain.connect(osc1.frequency);
    wobbleGain.connect(osc2.frequency);

    osc1.type = 'sawtooth';
    osc2.type = 'square';
    osc3.type = 'triangle';
    osc1.frequency.setValueAtTime(42, t);
    osc2.frequency.setValueAtTime(63, t);
    osc3.frequency.setValueAtTime(84, t);

    osc1.connect(filter);
    osc2.connect(filter);
    osc3.connect(filter);
    filter.connect(master);
    master.connect(ctx.destination);

    wobble.start(t);
    osc1.start(t);
    osc2.start(t);
    osc3.start(t);

    dragEngineLoop = {
      ctx: ctx,
      master: master,
      filter: filter,
      osc1: osc1,
      osc2: osc2,
      osc3: osc3,
      sources: [wobble, osc1, osc2, osc3]
    };

    setDragEngineIntensity(multiplier || 1);
  }

  function playLightBeep(isGreen) {
    var ctx = warmAudioCtx();
    if (!ctx) return;
    var t = ctx.currentTime;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(isGreen ? 880 : 520, t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(isGreen ? 0.18 : 0.12, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + (isGreen ? 0.22 : 0.14));
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + (isGreen ? 0.24 : 0.16));
  }

  function playDragRaceIntroCue(onDone) {
    speakCue('Drivers, start your engines', {
      rate: 0.95,
      pitch: 0.7,
      fallbackDelay: 1700
    }, onDone);
  }

  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smoothstep(t) { return t * t * (3 - 2 * t); }
  function isCanvasLevel(level) { return level === 2 || level === 3; }

  function clearPendingTimers() {
    sprintSequenceId += 1;
    clearTimeout(timerId);
    timerId = null;
    if (lightIntervalId) {
      clearInterval(lightIntervalId);
      lightIntervalId = null;
    }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    stopDragEngineLoop();
  }

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     CANVAS SIZING
     â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
  function sizeCanvas() {
    var rect = el.gameArea.getBoundingClientRect();
    el.canvas.width = rect.width;
    el.canvas.height = rect.height;
    if (window.DragRaceGfx) window.DragRaceGfx.invalidateBackgroundCache();
  }

  /* =======================================================================
     GRAPHICS
     -----------------------------------------------------------------------
      Level 2 (Sprint)     -> sprint.js      exposes window.SprintGfx
      Level 3 (Drag Race)  -> drag-race.js   exposes window.DragRaceGfx
    Level 1 (Ruler SVG)  -> inline in index.html

     Shared state from this file is mirrored to window.SimShared:
       muzzleFlashStart, opponentDelay
     ======================================================================= */

  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     LAB REBUILD â€“ notebook workflow + SCORM scoring
     â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
  var REQUIRED_TRIALS = 3;
  var ANALYSIS_MIN_LENGTH = 20;

  var SCENARIOS = {
    1: {
      title: 'Falling Ruler',
      shortTitle: 'Falling Ruler',
      subtitle: 'Classical Gravity',
      description: 'Measure how far a ruler falls while you react to the release. This scenario models an object starting from rest and accelerating downward under gravity.',
      unit: 'cm',
      distanceLabel: 'Ruler drop',
      formulaReference: 'Base equation: Δy = v<sub>i</sub>t + 1/2 g t<sup>2</sup>\nΔy = ruler drop distance (convert to meters)\nv<sub>i</sub> = 0 m/s\ng = 9.81 m/s^2',
      correctEquation: 'halfgt2'
    },
    2: {
      title: 'Elite Sprint',
      shortTitle: 'Elite Sprint',
      subtitle: 'Reaction Time',
      description: 'A sprinter who reacts later gives up distance while the race is already underway. Use the opponent\'s reaction time and the finish-line lag to calculate your own reaction time.',
      unit: 'm',
      distanceLabel: 'Finish line lag',
      formulaReference: 'Base equation: d = v t\nv = 10.0 m/s\nUse the lag distance and the reaction-time difference.',
      correctEquation: 'vt'
    },
    3: {
      title: 'Drag Racing',
      shortTitle: 'Drag Racing',
      subtitle: 'Acceleration Gap',
      description: 'Both cars accelerate at 40 m/s\u00B2 from rest over 320 m. Use the reaction-time difference to calculate the starting head start, then compare it to the finish-line gap.',
      unit: 'm',
      distanceLabel: 'Gap at finish (shown)',
      formulaReference: 'Step 1: Δt = |your RT - CPU RT|\nStep 2: Initial head start: d<sub>start</sub> = 1/2(40)(Δt)<sup>2</sup>\nStep 3: Final gap: t<sub>trail</sub> = 4 - Δt, d<sub>trail</sub> = 1/2(40)(t<sub>trail</sub>)<sup>2</sup>, Gap = 320 - d<sub>trail</sub>',
      correctEquation: 'halfat2'
    }
  };

  var state = {
    gameState: 'idle',
    currentLevel: 1,
    lightIndex: -1,
    trackSignal: '',
    activityStartedAt: 0,
    completedAt: 0,
    sessionStartedAt: 0,
    timeSpentMsBase: 0,
    startTime: 0,
    reactionTime: null,
    distance: null,
    visualDropCm: 0,
    level2FinishSnapshot: null,
    pendingTrial: null,
    tempCalculation: '',
    attemptCounts: {
      1: 0,
      2: 0,
      3: 0
    },
    recordedTrialAudit: [],
    analysis: {
      a1: '',
      a2: '',
      a3: '',
      a4: ''
    },
    trialsByLevel: {
      1: [],
      2: [],
      3: []
    },
    statusMessage: '',
    statusKind: 'muted',
    score: 0,
    submitted: false
  };

  var race = {
    playerLaunched: false,
    opponentLaunched: false,
    playerDist: 0,
    opponentDist: 0,
    playerSpeed: 0,
    opponentSpeed: 0,
    playerReactionTime: null,
    playerLaunchTime: 0,
    opponentLaunchTime: 0,
    greenTime: 0,
    raceFinished: false,
    lastTime: 0,
    now: 0
  };

  var timerId = null;
  var lightIntervalId = null;
  var animId = null;
  var el = {};
  var walkStep = 0;
  var sprintSequenceId = 0;
  var sprintSetAt = 0;
  var SPRINT_GUN_FAILSAFE_MS = 3500;

  var WALK_STEPS = [
    {
      title: 'Welcome to the Lab',
      body: '<p>In this lab you will measure your <strong>reaction time</strong> in three different scenarios and use kinematics equations to calculate distances or times.</p><p>Each scenario has <strong>3 trials</strong> - 9 total.</p>'
    },
    {
      title: '1. Falling Ruler',
      body: '<p>A ruler is held above your hand. When it drops, click or press Space to catch it.</p><p>Read the distance it fell (in cm), then use <code>d&nbsp;=&nbsp;1/2&nbsp;g&nbsp;t^2</code> to calculate your reaction time.</p>'
    },
    {
      title: '2. Elite Sprint',
      body: '<p>Two sprinters race 50&nbsp;m at 10&nbsp;m/s. A starter fires a gun - react to it.</p><p>Use the finish-line <strong>lag</strong> and the opponent\'s RT to calculate your own reaction time.</p>'
    },
    {
      title: '3. Drag Racing',
      body: '<p>Two cars accelerate from rest at 40&nbsp;m/s^2 over 320&nbsp;m. You and the computer have different reaction times.</p><p>Calculate the <strong>gap</strong> between the cars when the leader crosses the finish line.</p>'
    },
    {
      title: 'Scoring &amp; Submission',
      body: '<p>After recording all 9 trials, answer 4 analysis questions (20+ characters each).</p><p>Your score combines trial accuracy (60%) and teacher-graded analysis (40%). Click <strong>Submit Lab</strong> when finished.</p>'
    }
  ];

  function calculateExpectedAnswer(level, reactionTime) {
    if (reactionTime === null) return 0;
    if (level === 1) return parseFloat((0.5 * G * reactionTime * reactionTime * 100).toFixed(2));
    if (level === 3) {
      var deltaRT = Math.abs(reactionTime - opponentDelay);
      var tTravel = Math.sqrt(2 * DRAG_FINISH_DISTANCE / DRAG_ACCEL);
      var trailingTime = tTravel - deltaRT;
      var trailingDist = 0.5 * DRAG_ACCEL * trailingTime * trailingTime;
      return parseFloat((DRAG_FINISH_DISTANCE - trailingDist).toFixed(2));
    }
    return parseFloat((RUNNER_TOP_SPEED * Math.max(0, reactionTime - opponentDelay)).toFixed(2));
  }

  function getScenarioRaceDistance(level) {
    return level === 3 ? DRAG_FINISH_DISTANCE : SPRINT_TRACK_DISTANCE;
  }

  function getScenarioMotionSpeed(level) {
    return level === 3 ? DRAG_ACCEL : RUNNER_TOP_SPEED;
  }

  function getPendingReactionLabel(level) {
    if (level === 1) return 'Reaction Time (solve)';
    if (level === 2) return 'Opponent RT';
    if (level === 3) return 'Your RT';
    return 'Reaction Time';
  }
  function getPendingDistanceLabel(level) {
    return SCENARIOS[level].distanceLabel + ' (' + SCENARIOS[level].unit + ')';
  }
  function getStudentAnswerLabel(level) {
    if (level === 1 || level === 2) return 'Your calculated reaction time';
    return 'Your answer';
  }
  function getStudentAnswerPlaceholder(level) {
    if (level === 1 || level === 2) return 'e.g. 0.250';
    return 'e.g. 3.50';
  }
  function getStudentAnswerUnit(level) {
    if (level === 1 || level === 2) return 's';
    return SCENARIOS[level].unit;
  }
  function getPendingInstruction(level) {
    if (level === 1) return 'Read the ruler drop distance and enter it in cm. Calculate your reaction time and enter it in seconds.';
    if (level === 2) return 'Finding Your Reaction Time: Assuming you both run at the exact same speed of 10 m/s, the finish-line gap exists entirely because you started late.';
    if (level === 3) return 'For drag racing, calculate both values: initial head start and final race gap. Use Δt = |your RT - CPU RT|, d_start = 1/2(40)(Δt)^2, then t_trail = 4 - Δt and Gap = 320 - 1/2(40)(t_trail)^2.';
    return 'Use d = v * t with your measured reaction time. Enter your answer in ' + SCENARIOS[level].unit + '.';
  }

  function totalTrialsRecorded() {
    return state.trialsByLevel[1].length + state.trialsByLevel[2].length + state.trialsByLevel[3].length;
  }

  function allRequiredTrialsRecorded() {
    return totalTrialsRecorded() >= REQUIRED_TRIALS * 3;
  }

  function levelIsComplete(level) {
    return state.trialsByLevel[level].length >= REQUIRED_TRIALS;
  }

  function getNextTrialNumber(level) {
    return state.trialsByLevel[level].length + 1;
  }

  function recordOrReplaceTrial(level, trialRow) {
    var rows = state.trialsByLevel[level];
    if (rows.length < REQUIRED_TRIALS) {
      trialRow.trialNumber = rows.length + 1;
      rows.push(trialRow);
      return { recorded: true, replaced: false };
    }

    var slowestIdx = 0;
    for (var i = 1; i < rows.length; i++) {
      if (rows[i].reactionTime > rows[slowestIdx].reactionTime) slowestIdx = i;
    }

    if (trialRow.reactionTime < rows[slowestIdx].reactionTime) {
      trialRow.trialNumber = rows[slowestIdx].trialNumber || (slowestIdx + 1);
      rows[slowestIdx] = trialRow;
      return { recorded: true, replaced: true };
    }

    return { recorded: false, replaced: false, slowestTime: rows[slowestIdx].reactionTime };
  }

  function resetRace() {
    race.playerLaunched = false;
    race.opponentLaunched = false;
    race.playerDist = 0;
    race.opponentDist = 0;
    race.playerSpeed = 0;
    race.opponentSpeed = 0;
    race.playerReactionTime = null;
    race.playerLaunchTime = 0;
    race.opponentLaunchTime = 0;
    race.greenTime = 0;
    race.raceFinished = false;
    race.lastTime = 0;
    race.now = 0;
    state.level2FinishSnapshot = null;
    muzzleFlashStart = 0;
    opponentDelay = 0;
    sprintSetAt = 0;
    window.SimShared.muzzleFlashStart = 0;
    window.SimShared.opponentDelay = 0;
  }

  function resetCaptureState() {
    state.reactionTime = null;
    state.distance = null;
    state.visualDropCm = 0;
    state.level2FinishSnapshot = null;
    state.pendingTrial = null;
    state.tempCalculation = '';
  }

  function clearStatusMessage() {
    state.statusMessage = '';
    state.statusKind = 'muted';
  }

  function setStatusMessage(kind, text) {
    state.statusKind = kind || 'muted';
    state.statusMessage = text || '';
  }

  function buildRulerScale() {
    if (!el.rulerScale || !el.rulerBody || !el.rulerCore) return;
    while (el.rulerScale.firstChild) el.rulerScale.removeChild(el.rulerScale.firstChild);

    var svgNS = 'http://www.w3.org/2000/svg';
    var fullHeight = RULER_TOTAL_CM * RULER_PX_PER_CM;
    el.rulerBody.setAttribute('y', String(-fullHeight));
    el.rulerBody.setAttribute('height', String(fullHeight));
    el.rulerCore.setAttribute('y', String(-fullHeight));
    el.rulerCore.setAttribute('height', String(fullHeight));

    for (var cm = 0; cm <= RULER_TOTAL_CM; cm++) {
      var y = -cm * RULER_PX_PER_CM;
      var isFiveCm = cm % 5 === 0;
      var line = document.createElementNS(svgNS, 'line');
      line.setAttribute('x1', '66');
      line.setAttribute('x2', isFiveCm ? '24' : '40');
      line.setAttribute('stroke-width', isFiveCm ? '2' : '1.5');
      line.setAttribute('y1', String(y));
      line.setAttribute('y2', String(y));
      el.rulerScale.appendChild(line);
      if (isFiveCm) {
        var label = document.createElementNS(svgNS, 'text');
        label.setAttribute('fill', '#1c1917');
        label.setAttribute('font-family', 'Segoe UI, sans-serif');
        label.setAttribute('text-anchor', 'end');
        label.setAttribute('x', '20');
        label.setAttribute('y', String(y + 4));
        label.setAttribute('font-size', '12');
        label.setAttribute('font-weight', '400');
        label.textContent = cm === RULER_TOTAL_CM ? String(cm) + ' cm' : String(cm);
        el.rulerScale.appendChild(label);
      }
    }

    var readLine = document.getElementById('read-line');
    if (!readLine) {
      readLine = document.createElementNS(svgNS, 'line');
      readLine.id = 'read-line';
      readLine.setAttribute('stroke', '#16a34a');
      readLine.setAttribute('stroke-width', '3');
      readLine.setAttribute('stroke-dasharray', '6 4');
      readLine.setAttribute('pointer-events', 'none');
    }
    readLine.setAttribute('x1', '360');
    readLine.setAttribute('x2', '490');
    readLine.setAttribute('y1', '153');
    readLine.setAttribute('y2', '153');
    el.handGraphic.appendChild(readLine);
  }

  function stopLevel1Preview() {
    if (level1PreviewId) {
      cancelAnimationFrame(level1PreviewId);
      level1PreviewId = null;
    }
  }

  function startLevel1Preview() {
    stopLevel1Preview();
    var firstFrame = true;
    function tick() {
      if (state.currentLevel !== 1 || state.gameState !== 'dropping') {
        stopLevel1Preview();
        return;
      }
      if (firstFrame) { state.startTime = performance.now() + 30; firstFrame = false; }
      var t = Math.max(0, (performance.now() - state.startTime) / 1000);
      var dropCm = Math.min(RULER_TOTAL_CM, 0.5 * G * t * t * 100);
      el.level1Scene.style.setProperty('--ruler-drop', (dropCm * RULER_PX_PER_CM).toFixed(2) + 'px');
      if (t >= RULER_MISS_SECONDS) {
        markMissedReaction();
        return;
      }
      level1PreviewId = requestAnimationFrame(tick);
    }
    level1PreviewId = requestAnimationFrame(tick);
  }

  function cacheDom() {
    el.startScreen = document.getElementById('start-screen');
    el.startBtn = document.getElementById('start-btn');
    el.app = document.getElementById('app');
    el.showWalkthroughBtn = document.getElementById('show-walkthrough');
    el.completionChartItem = document.getElementById('completion-chart-item');
    el.completionChartStatus = document.getElementById('completion-chart-status');
    el.completionQuestionsItem = document.getElementById('completion-questions-item');
    el.completionQuestionsStatus = document.getElementById('completion-questions-status');
    el.resetLabBtn = document.getElementById('reset-lab-btn');
    el.scenarioSubtitle = document.getElementById('scenario-subtitle');
    el.scenarioBtns = document.querySelectorAll('.scenario-btn');
    el.scenarioMeta1 = document.getElementById('scenario-meta-1');
    el.scenarioMeta2 = document.getElementById('scenario-meta-2');
    el.scenarioMeta3 = document.getElementById('scenario-meta-3');
    el.gameArea = document.getElementById('game-area');
    el.canvas = document.getElementById('game-canvas');
    el.level1Scene = document.getElementById('level1-scene');
    el.l1StartPrompt = document.getElementById('l1-start-prompt');
    el.canvasStartPrompt = document.getElementById('canvas-start-prompt');
    el.handGraphic = document.getElementById('hand-graphic');
    el.rulerBody = document.getElementById('ruler-body');
    el.rulerCore = document.getElementById('ruler-core');
    el.rulerScale = document.getElementById('ruler-scale');
    el.trackSignal = document.getElementById('track-signal');
    el.gameFooter = document.querySelector('.game-footer');
    el.sceneInstruction = document.getElementById('scene-instruction');
    el.startSequenceBtn = document.getElementById('start-sequence-btn');
    el.resetScenarioBtn = document.getElementById('reset-scenario-btn');
    el.pendingLeftLabel = document.getElementById('pending-left-label');
    el.pendingRtGrid = document.getElementById('pending-rt-grid');
    el.pendingCpuRt = document.getElementById('pending-cpu-rt');
    el.pendingCpuChip = document.querySelector('.pending-rt-chip.cpu');
    el.pendingYouRt = document.getElementById('pending-you-rt');
    el.pendingDirections = document.getElementById('pending-directions');
    el.hintToggleBtn = document.getElementById('hint-toggle-btn');
    el.equationHint = document.getElementById('equation-hint');
    el.calcDistLabel = document.getElementById('calc-dist-label');
    el.calcDistRow = document.getElementById('calc-dist-row');
    el.calcDistInput = document.getElementById('calc-dist-input');
    el.calcDistUnit = document.getElementById('calc-dist-unit');
    el.calcInputLabel = document.getElementById('calc-input-label');
    el.calcInput = document.getElementById('calc-input');
    el.calcUnit = document.getElementById('calc-unit');
    el.recordTrialBtn = document.getElementById('record-trial-btn');
    el.discardTrialBtn = document.getElementById('discard-trial-btn');
    el.pendingFeedback = document.getElementById('pending-feedback');
    el.overallProgressBadge = document.getElementById('overall-progress-badge');
    el.analysisCard = document.getElementById('analysis-card');
    el.analysisLockChip = document.getElementById('analysis-lock-chip');
    el.analysisLockText = document.getElementById('analysis-lock-text');
    el.analysis1 = document.getElementById('analysis-1');
    el.analysis2 = document.getElementById('analysis-2');
    el.analysis3 = document.getElementById('analysis-3');
    el.analysis4 = document.getElementById('analysis-4');
    el.submitBtn = document.getElementById('submit-btn');

    // New UI elements
    el.pendingCard = document.getElementById('pending-card');
    el.stepCapture = document.getElementById('step-capture');
    el.stepEquation = document.getElementById('step-equation');
    el.stepCalculate = document.getElementById('step-calculate');
    el.confirmOverlay = document.getElementById('confirm-overlay');
    el.confirmTitle = document.getElementById('confirm-title');
    el.confirmMessage = document.getElementById('confirm-message');
    el.confirmCancel = document.getElementById('confirm-cancel');
    el.confirmProceed = document.getElementById('confirm-proceed');
    el.walkthroughOverlay = document.getElementById('walkthrough-overlay');
    el.walkStepLabel = document.getElementById('walk-step-label');
    el.walkTitle = document.getElementById('walk-title');
    el.walkBody = document.getElementById('walk-body');
    el.walkDots = document.getElementById('walk-dots');
    el.walkPrevBtn = document.getElementById('walk-prev-btn');
    el.walkNextBtn = document.getElementById('walk-next-btn');
  }

  function renderWalkthrough() {
    var step = WALK_STEPS[walkStep];
    el.walkStepLabel.textContent = 'Step ' + (walkStep + 1) + ' of ' + WALK_STEPS.length;
    el.walkTitle.textContent = step.title;
    el.walkBody.innerHTML = step.body;
    el.walkPrevBtn.disabled = walkStep === 0;
    el.walkNextBtn.textContent = walkStep === WALK_STEPS.length - 1 ? 'Close' : 'Next';
    el.walkDots.innerHTML = '';
    for (var i = 0; i < WALK_STEPS.length; i++) {
      var dot = document.createElement('div');
      dot.className = 'walk-dot' + (i === walkStep ? ' active' : '');
      el.walkDots.appendChild(dot);
    }
  }

  function openWalkthrough() {
    walkStep = 0;
    renderWalkthrough();
    el.walkthroughOverlay.classList.remove('hidden');
  }

  function closeWalkthrough() {
    el.walkthroughOverlay.classList.add('hidden');
  }

  function compactAnalysisText(value) {
    return (value || '').trim().slice(0, 220);
  }

  function nowMs() {
    return Date.now();
  }

  function roundTo(value, digits) {
    return parseFloat(Number(value || 0).toFixed(digits));
  }

  function hasSearchFlag(name) {
    try {
      var value = new URLSearchParams(window.location.search || '').get(name);
      if (value === null) return false;
      value = String(value).toLowerCase();
      return value === '' || value === '1' || value === 'true' || value === 'yes' || value === 'on';
    } catch (e) {
      return false;
    }
  }

  var TEST_AUTOFILL_MODE = hasSearchFlag('autofill') || hasSearchFlag('testAutofill');
  var TEST_ANALYSIS_ANSWERS = {
    a1: 'My fastest reaction time was closer to elite performance because my best trial stayed near a quarter of a second and was lower than a typical everyday reaction.',
    a2: 'My auditory reaction time was usually faster because I could react as soon as I heard the signal, while visual cues took a little longer to process.',
    a3: 'In the sprint the start gap stayed the same because both runners moved at the same constant speed after the delay. In the drag race the gap kept growing because both cars accelerated, so the leader gained more distance every second.',
    a4: 'A reaction faster than 0.100 s is treated as a false start because it is below normal human response time and usually means the runner anticipated the gun instead of reacting to it.'
  };

  function applyTestingAutofillForPending(level, pending) {
    if (!TEST_AUTOFILL_MODE || !pending || state.submitted) return;
    if (level === 1) {
      el.calcDistInput.value = pending.distance.toFixed(2);
      state.tempCalculation = roundTo(pending.expected, 4).toFixed(4);
      return;
    }
    if (level === 3) {
      el.calcDistInput.value = roundTo(pending.expected, 3).toFixed(3);
      state.tempCalculation = roundTo(typeof pending.finalGapExpected === 'number' ? pending.finalGapExpected : pending.distance, 3).toFixed(3);
      return;
    }
    state.tempCalculation = roundTo(pending.expected, 4).toFixed(4);
  }

  function applyTestingAutofillForAnalysis(unlocked) {
    if (!TEST_AUTOFILL_MODE || !unlocked || state.submitted) return;
    if (!state.analysis.a1.trim()) state.analysis.a1 = TEST_ANALYSIS_ANSWERS.a1;
    if (!state.analysis.a2.trim()) state.analysis.a2 = TEST_ANALYSIS_ANSWERS.a2;
    if (!state.analysis.a3.trim()) state.analysis.a3 = TEST_ANALYSIS_ANSWERS.a3;
    if (!state.analysis.a4.trim()) state.analysis.a4 = TEST_ANALYSIS_ANSWERS.a4;
  }

  function getTotalTimeSpentMs() {
    var base = state.timeSpentMsBase || 0;
    if (!state.sessionStartedAt) return base;
    return base + Math.max(0, nowMs() - state.sessionStartedAt);
  }

  function getCurrentScreenTag() {
    var tag = 'level-' + state.currentLevel + ':' + state.gameState;
    if (state.pendingTrial) tag += ':pending';
    if (state.submitted) tag += ':submitted';
    return tag;
  }

  function appendRecordedTrialAudit(entry) {
    state.recordedTrialAudit.push(entry);
  }

  function serializeTrialsCompact() {
    var out = { 1: [], 2: [], 3: [] };
    var level;
    var rows;
    var i;
    for (level = 1; level <= 3; level++) {
      rows = state.trialsByLevel[level];
      for (i = 0; i < rows.length; i++) {
        out[level].push([
          Number(rows[i].reactionTime) || 0,
          Number(rows[i].simDistance) || 0,
          rows[i].equationCorrect ? 1 : 0,
          rows[i].calculationCorrect ? 1 : 0
        ]);
      }
    }
    return out;
  }

  function deserializeTrialsCompact(data) {
    var out = { 1: [], 2: [], 3: [] };
    var level;
    var rows;
    var i;
    for (level = 1; level <= 3; level++) {
      rows = data && data[level] ? data[level] : [];
      for (i = 0; i < rows.length; i++) {
        var r = rows[i] || [];
        out[level].push({
          reactionTime: Number(r[0]) || 0,
          simDistance: Number(r[1]) || 0,
          equationCorrect: !!r[2],
          calculationCorrect: !!r[3],
          unit: SCENARIOS[level].unit
        });
      }
    }
    return out;
  }

  function serializeState() {
    return {
      v: 3,
      l: state.currentLevel,
      g: state.gameState,
      scr: getCurrentScreenTag(),
      st: state.activityStartedAt,
      ct: state.completedAt,
      tm: getTotalTimeSpentMs(),
      t: serializeTrialsCompact(),
      ac: [state.attemptCounts[1] || 0, state.attemptCounts[2] || 0, state.attemptCounts[3] || 0],
      ra: state.recordedTrialAudit,
      a: [
        compactAnalysisText(state.analysis.a1),
        compactAnalysisText(state.analysis.a2),
        compactAnalysisText(state.analysis.a3),
        compactAnalysisText(state.analysis.a4)
      ],
      sub: state.submitted ? 1 : 0
    };
  }

  function saveSuspendData() {
    if (typeof SCORM === 'undefined') return;
    try {
      var payload = JSON.stringify(serializeState());
      if (payload.length > 4096) {
        var fallback = {
          v: 3,
          l: state.currentLevel,
          g: state.gameState,
          scr: getCurrentScreenTag(),
          st: state.activityStartedAt,
          ct: state.completedAt,
          tm: getTotalTimeSpentMs(),
          t: serializeTrialsCompact(),
          ac: [state.attemptCounts[1] || 0, state.attemptCounts[2] || 0, state.attemptCounts[3] || 0],
          ra: state.recordedTrialAudit,
          a: ['', '', '', ''],
          sub: state.submitted ? 1 : 0
        };
        payload = JSON.stringify(fallback);
        if (payload.length > 4096) {
          payload = JSON.stringify({
            v: 3,
            l: state.currentLevel,
            g: state.gameState,
            scr: getCurrentScreenTag(),
            st: state.activityStartedAt,
            ct: state.completedAt,
            tm: getTotalTimeSpentMs(),
            ac: [state.attemptCounts[1] || 0, state.attemptCounts[2] || 0, state.attemptCounts[3] || 0],
            sub: state.submitted ? 1 : 0
          });
        }
      }
      SCORM.setValue('cmi.suspend_data', payload);
      SCORM.commit();
    } catch (err) {}
  }

  function loadSuspendData() {
    if (typeof SCORM === 'undefined') return false;
    var raw = SCORM.getValue('cmi.suspend_data');
    if (!raw) return false;
    try {
      var data = JSON.parse(raw);
      if (data.v === 3) {
        if (data.l) state.currentLevel = data.l;
        if (data.g) state.gameState = data.g;
        state.activityStartedAt = Number(data.st) || 0;
        state.completedAt = Number(data.ct) || 0;
        state.timeSpentMsBase = Number(data.tm) || 0;
        if (data.t) state.trialsByLevel = deserializeTrialsCompact(data.t);
        if (data.ac && data.ac.length === 3) {
          state.attemptCounts = {
            1: Number(data.ac[0]) || 0,
            2: Number(data.ac[1]) || 0,
            3: Number(data.ac[2]) || 0
          };
        }
        if (data.ra && data.ra.length) state.recordedTrialAudit = data.ra;
        if (data.a && data.a.length === 4) {
          state.analysis.a1 = data.a[0] || '';
          state.analysis.a2 = data.a[1] || '';
          state.analysis.a3 = data.a[2] || '';
          state.analysis.a4 = data.a[3] || '';
        }
        state.submitted = !!data.sub;
      } else if (data.v === 2) {
        if (data.l) state.currentLevel = data.l;
        if (data.t) state.trialsByLevel = deserializeTrialsCompact(data.t);
        if (data.a && data.a.length === 4) {
          state.analysis.a1 = data.a[0] || '';
          state.analysis.a2 = data.a[1] || '';
          state.analysis.a3 = data.a[2] || '';
          state.analysis.a4 = data.a[3] || '';
        }
        state.submitted = !!data.sub;
      } else {
        // Backward compatibility for earlier suspend_data schema.
        if (data.currentLevel) state.currentLevel = data.currentLevel;
        if (data.trialsByLevel) state.trialsByLevel = data.trialsByLevel;
        if (data.analysis) state.analysis = data.analysis;
        state.submitted = !!data.submitted;
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  function setSCORMProgress(finalize) {
    var breakdown = computeScoreBreakdown();
    state.score = breakdown.percent;
    if (typeof SCORM === 'undefined') return;
    SCORM.setStatus((finalize || state.submitted) ? 'completed' : 'incomplete');
    SCORM.commit();
  }

  function averageForLevel(level, key) {
    var rows = state.trialsByLevel[level];
    if (!rows.length) return null;
    var sum = 0;
    for (var i = 0; i < rows.length; i++) sum += rows[i][key];
    return sum / rows.length;
  }

  function countCorrectRows(key) {
    var count = 0;
    var level;
    var rows;
    var i;
    for (level = 1; level <= 3; level++) {
      rows = state.trialsByLevel[level];
      for (i = 0; i < rows.length; i++) {
        if (rows[i][key]) count += 1;
      }
    }
    return count;
  }

  function analysisPromptScore(text) {
    return (text || '').trim().length >= ANALYSIS_MIN_LENGTH ? 9 : 0;
  }

  function computeScoreBreakdown() {
    var completionPts = totalTrialsRecorded() * 2;
    var equationPts = countCorrectRows('equationCorrect') * 2;
    var calcPts = countCorrectRows('calculationCorrect') * 2;
    var labPts = completionPts + equationPts + calcPts; // max 54
    var labPercent = Math.round(labPts * 60 / 54); // scaled to 60% max
    return {
      completion: completionPts,
      equations: equationPts,
      calculations: calcPts,
      labPts: labPts,
      percent: labPercent
    };
  }

  function recordOrUpdateTextState() {
    state.analysis.a1 = el.analysis1.value;
    state.analysis.a2 = el.analysis2.value;
    state.analysis.a3 = el.analysis3.value;
    state.analysis.a4 = el.analysis4.value;
    setSCORMProgress(state.submitted);
    saveSuspendData();
    render();
  }

  function toleranceFor(level, expected) {
    if (level === 1 || level === 2) return Math.max(0.03, expected * 0.10);
    return Math.max(0.25, expected * 0.10);
  }

  function getEquationLabel(value) {
    if (value === 'halfgt2') return 'd = 1/2 gt^2';
    if (value === 'vt') return 'd = vt';
    if (value === 'halfat2') return 'd = 1/2 at^2';
    return '-';
  }

  function pendingTrialExists() {
    return !!state.pendingTrial;
  }

  function getHintContent(level) {
    if (level === 1) return 'Base equation: Δy = v<sub>i</sub>t + 1/2 g t<sup>2</sup>\nΔy = ruler drop distance (convert to meters)\nv<sub>i</sub> = 0 m/s\ng = 9.81 m/s²';
    if (level === 2) return 'Base equation: d = v t\nv = 10 m/s\nUse the lag distance and the reaction-time difference.';
    if (level === 3) return 'Step 1: Δt = |your RT - CPU RT|\nStep 2: d<sub>start</sub> = 1/2(40)(Δt)<sup>2</sup>\nStep 3: t<sub>trail</sub> = 4 - Δt, d<sub>trail</sub> = 1/2(40)(t<sub>trail</sub>)<sup>2</sup>, Gap = 320 - d<sub>trail</sub>';
    return '';
  }

  function formatHintMarkup(text) {
    return String(text || '').replace(/\n/g, '<br>');
  }

  function setHintOpen(open) {
    state.hintOpen = !!open;
    if (state.hintOpen) el.equationHint.innerHTML = formatHintMarkup(getHintContent(state.currentLevel));
    el.equationHint.classList.toggle('hidden', !state.hintOpen);
    el.hintToggleBtn.setAttribute('aria-expanded', state.hintOpen ? 'true' : 'false');
    el.hintToggleBtn.textContent = state.hintOpen ? 'Hide Hint' : 'Show Hint';
  }

  function markMissedReaction() {
    clearPendingTimers();
    stopLevel1Preview();
    stopAnimLoop();
    state.gameState = 'idle';
    resetRace();
    render();
  }

  function discardPendingTrial() {
    if (!state.pendingTrial) return;
    resetCaptureState();
    render();
  }

  function capturePendingTrial() {
    if (state.reactionTime === null || state.distance === null) return;
    var level = state.currentLevel;
    state.attemptCounts[level] = (state.attemptCounts[level] || 0) + 1;
    var pending = {
      level: level,
      trialNumber: getNextTrialNumber(level),
      capturedAt: nowMs(),
      reactionTime: state.reactionTime,
      distance: state.distance,
      expected: calculateExpectedAnswer(level, state.reactionTime)
    };
    if (level === 1) {
      // Student sees distance, must solve for time: t = sqrt(2d / g)
      var dMeters = state.distance / 100;
      pending.expected = parseFloat(Math.sqrt(2 * dMeters / G).toFixed(4));
    }
    if (level === 2) {
      pending.opponentRT = opponentDelay;
      pending.distance = RUNNER_TOP_SPEED * Math.max(0, state.reactionTime - opponentDelay);
      pending.expected = state.reactionTime;
    }
    if (level === 3) {
      pending.opponentRT = opponentDelay;
      var deltaRT = Math.abs(state.reactionTime - opponentDelay);
      pending.expected = parseFloat((0.5 * DRAG_ACCEL * deltaRT * deltaRT).toFixed(3));
      pending.finalGapExpected = parseFloat(pending.distance.toFixed(3));
    }
    state.pendingTrial = pending;
    state.tempCalculation = '';
    state.gameState = 'idle';
    stopAnimLoop();
    render();
  }

  function startAnimLoop() {
    if (!isCanvasLevel(state.currentLevel)) return;
    stopAnimLoop();
    race.lastTime = 0;
    function animate(now) {
      race.now = now;

      // Sprint fail-safe: if the SET phase lingers too long, force fire the gun.
      if (state.currentLevel === 2 && state.gameState === 'waiting' && state.trackSignal === 'SET' && sprintSetAt > 0) {
        if ((now - sprintSetAt) >= SPRINT_GUN_FAILSAFE_MS) {
          fireSprintGun();
        }
      }

      if (!race.lastTime) {
        race.lastTime = now;
        animId = requestAnimationFrame(animate);
        return;
      }
      var dt = Math.min(0.033, (now - race.lastTime) / 1000);
      race.lastTime = now;

      if (state.gameState === 'dropping') {
        var prevPlayerDist = race.playerDist;
        var prevOpponentDist = race.opponentDist;

        if (!race.greenTime) race.greenTime = state.startTime || now;
        var tSinceGreen = (now - race.greenTime) / 1000;
        if (!race.opponentLaunched && tSinceGreen >= opponentDelay) {
          race.opponentLaunched = true;
          race.opponentLaunchTime = opponentDelay;
          race.opponentSpeed = getScenarioMotionSpeed(state.currentLevel);
        }
        if (race.opponentLaunched) {
          if (state.currentLevel === 3) {
            var oppT = tSinceGreen - race.opponentLaunchTime;
            race.opponentDist = Math.min(getScenarioRaceDistance(state.currentLevel), 0.5 * DRAG_ACCEL * oppT * oppT);
          } else {
            var oppRunT = Math.max(0, tSinceGreen - race.opponentLaunchTime);
            race.opponentDist = Math.min(getScenarioRaceDistance(state.currentLevel), race.opponentSpeed * oppRunT);
          }
        }
        if (race.playerLaunched) {
          if (state.currentLevel === 3) {
            if (!race.playerLaunchTime) race.playerLaunchTime = race.playerReactionTime || tSinceGreen;
            var plyT = tSinceGreen - race.playerLaunchTime;
            race.playerDist = Math.min(getScenarioRaceDistance(state.currentLevel), 0.5 * DRAG_ACCEL * plyT * plyT);
          } else {
            if (!race.playerLaunchTime) race.playerLaunchTime = race.playerReactionTime || tSinceGreen;
            race.playerSpeed = getScenarioMotionSpeed(state.currentLevel);
            var playerRunT = Math.max(0, tSinceGreen - race.playerLaunchTime);
            race.playerDist = Math.min(getScenarioRaceDistance(state.currentLevel), race.playerSpeed * playerRunT);
          }
        }

        if (!race.playerLaunched && tSinceGreen >= REACTION_MISS_SECONDS) {
          markMissedReaction();
          return;
        }

        if (!race.raceFinished && race.playerLaunched) {
          var finishDist = getScenarioRaceDistance(state.currentLevel);
          if (state.currentLevel === 2) {
            // Freeze when the FIRST runner crosses the finish line
            if (race.playerDist >= finishDist || race.opponentDist >= finishDist) {
              race.raceFinished = true;
              // Draw one final finished frame so post-race sprint overlays are visible.
              var sprintCtx = el.canvas.getContext('2d');
              window.SprintGfx.draw(sprintCtx, el.canvas.width, el.canvas.height, race, state.trackSignal);
              capturePendingTrial();
              return;
            }
          } else {
            var playerCrossed = prevPlayerDist < finishDist && race.playerDist >= finishDist;
            var oppCrossed = prevOpponentDist < finishDist && race.opponentDist >= finishDist;

            if (playerCrossed || oppCrossed) {
              var playerRT = state.reactionTime;
              var oppRT = opponentDelay;
              var driveTimeToFinish = Math.sqrt((2 * finishDist) / DRAG_ACCEL);
              var winnerFinishTime = Math.min(playerRT, oppRT) + driveTimeToFinish;
              var winner = playerRT <= oppRT ? 'player' : 'opponent';
              var playerDriveTime = Math.max(0, winnerFinishTime - playerRT);
              var oppDriveTime = Math.max(0, winnerFinishTime - oppRT);
              var playerAt = Math.min(finishDist, 0.5 * DRAG_ACCEL * playerDriveTime * playerDriveTime);
              var oppAt = Math.min(finishDist, 0.5 * DRAG_ACCEL * oppDriveTime * oppDriveTime);
              var loserDist = winner === 'player' ? oppAt : playerAt;
              var gapAtFinish = Math.max(0, finishDist - loserDist);

              race.playerDist = playerAt;
              race.opponentDist = oppAt;

              state.distance = parseFloat(gapAtFinish.toFixed(2));
              state.level2FinishSnapshot = {
                winner: winner,
                finishDist: finishDist,
                gap: gapAtFinish,
                playerRT: playerRT,
                opponentRT: oppRT,
                playerDistAtFinish: playerAt,
                opponentDistAtFinish: oppAt
              };

              race.raceFinished = true;
              capturePendingTrial();
              return;
            }
          }
        }
      }

      var ctx = el.canvas.getContext('2d');
      if (state.currentLevel === 2) {
        window.SprintGfx.draw(ctx, el.canvas.width, el.canvas.height, race, state.trackSignal);
      } else if (state.currentLevel === 3) {
        window.DragRaceGfx.draw(ctx, el.canvas.width, el.canvas.height, race, state.lightIndex, state.gameState === 'dropping');
      }
      animId = requestAnimationFrame(animate);
    }
    animId = requestAnimationFrame(animate);
  }

  function stopAnimLoop() {
    if (animId) {
      cancelAnimationFrame(animId);
      animId = null;
    }
    stopDragEngineLoop();
  }

  function selectLevel(level) {
    clearPendingTimers();
    stopLevel1Preview();
    stopAnimLoop();
    state.currentLevel = level;
    state.gameState = 'idle';
    state.lightIndex = -1;
    state.trackSignal = '';
    state.hintOpen = false;
    resetRace();
    resetCaptureState();
    clearStatusMessage();
    sizeCanvas();
    if (isCanvasLevel(level)) startAnimLoop();
    render();
  }

  function resetScenarioData() {
    clearPendingTimers();
    stopLevel1Preview();
    stopAnimLoop();
    resetRace();
    resetCaptureState();
    clearStatusMessage();
    state.gameState = 'idle';
    saveSuspendData();
    if (isCanvasLevel(state.currentLevel)) startAnimLoop();
    render();
  }

  // Confirm dialog helpers
  var pendingConfirmAction = null;

  function showConfirm(title, message, proceedLabel, action) {
    el.confirmTitle.textContent = title;
    el.confirmMessage.textContent = message;
    el.confirmProceed.textContent = proceedLabel;
    pendingConfirmAction = action;
    el.confirmOverlay.classList.remove('hidden');
  }

  function hideConfirm() {
    el.confirmOverlay.classList.add('hidden');
    pendingConfirmAction = null;
  }

  function resetWholeLab() {
    showConfirm(
      'Reset Lab?',
      'This will erase all trial data, predictions, and analysis responses. This cannot be undone.',
      'Reset Everything',
      doResetWholeLab
    );
  }

  function doResetWholeLab() {
    clearPendingTimers();
    stopLevel1Preview();
    stopAnimLoop();
    state.currentLevel = 1;
    state.gameState = 'idle';
    state.lightIndex = -1;
    state.trackSignal = '';
    state.hintOpen = false;
    resetRace();
    resetCaptureState();
    clearStatusMessage();
    state.analysis = { a1: '', a2: '', a3: '', a4: '' };
    state.trialsByLevel = { 1: [], 2: [], 3: [] };
    state.attemptCounts = { 1: 0, 2: 0, 3: 0 };
    state.recordedTrialAudit = [];
    state.activityStartedAt = nowMs();
    state.completedAt = 0;
    state.sessionStartedAt = nowMs();
    state.timeSpentMsBase = 0;
    state.score = 0;
    state.submitted = false;
    if (typeof SCORM !== 'undefined') {
      SCORM.setValue('cmi.suspend_data', '');
      SCORM.setValue('cmi.core.score.raw', '');
      SCORM.setValue('cmi.core.score.min', '');
      SCORM.setValue('cmi.core.score.max', '');
      SCORM.setStatus('incomplete');
      SCORM.commit();
    }
    sizeCanvas();
    render();
  }

  function startLevel1Sequence() {
    var delay = Math.random() * 2000 + 1000;
    timerId = setTimeout(function() {
      state.gameState = 'dropping';
      state.startTime = performance.now();
      render();
      startLevel1Preview();
    }, delay);
  }

  function runLightSequence() {
    var current = 0;
    state.lightIndex = 0;
    playLightBeep(false);
    render();
    lightIntervalId = setInterval(function() {
      current += 1;
      if (current === 3) {
        clearInterval(lightIntervalId);
        lightIntervalId = null;
        setDragEngineIntensity(3);
        state.gameState = 'dropping';
        state.startTime = performance.now();
        opponentDelay = 0.20 + Math.random() * 0.15; // 0.20â€“0.35s
        window.SimShared.opponentDelay = opponentDelay;
        state.lightIndex = 3;
        playLightBeep(true);
        render();
        return;
      }
      state.lightIndex = current;
      playLightBeep(false);
      render();
    }, 500);
  }

  function startLevel2Sequence() {
    runTrackSequence();
  }

  function startLevel3Sequence() {
    state.trackSignal = 'DRIVERS, START YOUR ENGINES';
    render();
    playDragRaceIntroCue(function() {
      timerId = setTimeout(function() {
        state.trackSignal = '';
        startDragEngineLoop(1);
        runLightSequence();
      }, 1200);
    });
  }

  function fireSprintGun() {
    // Allow fire if still in waiting OR visibly in the SET phase.
    // This avoids stalls if state briefly drifts before the scheduled gun callback.
    if (state.currentLevel !== 2) return;
    if (state.gameState !== 'waiting' && state.trackSignal !== 'SET') return;

    state.trackSignal = '';
    state.gameState = 'dropping';
    state.startTime = performance.now();
    muzzleFlashStart = state.startTime;
    opponentDelay = 0;
    sprintSetAt = 0;

    race.greenTime = state.startTime;
    race.now = state.startTime;
    race.lastTime = state.startTime;
    race.opponentLaunched = true;
    race.opponentLaunchTime = 0;
    race.opponentSpeed = RUNNER_TOP_SPEED;

    window.SimShared.muzzleFlashStart = muzzleFlashStart;
    window.SimShared.opponentDelay = opponentDelay;

    if (!animId && isCanvasLevel(state.currentLevel)) startAnimLoop();

    try {
      playGunshot();
    } catch (err) {
      console.warn('[sim] starter gun audio failed', err);
    }

    render();
  }

  function runTrackSequence() {
    var sequenceId = ++sprintSequenceId;

    function schedule(delay, fn) {
      clearTimeout(timerId);
      timerId = setTimeout(function() {
        if (sequenceId !== sprintSequenceId || state.currentLevel !== 2) return;
        fn();
      }, delay);
    }

    state.trackSignal = 'ON YOUR MARKS';
    playStarterCue('On your marks');
    render();

    schedule(900, function() {
      state.trackSignal = 'SET';
      sprintSetAt = performance.now();
      playStarterCue('Set');
      render();
      schedule(SPRINT_SET_TO_GUN_MIN_MS + Math.random() * SPRINT_SET_TO_GUN_RANDOM_MS, function() {
        fireSprintGun();
      });
    });
  }

  function startTest() {
    if (pendingTrialExists()) {
      render();
      return;
    }

    clearPendingTimers();
    stopLevel1Preview();
    resetRace();
    clearStatusMessage();
    warmAudioCtx();  // prime audio on user gesture so gunshot plays later
    state.reactionTime = null;
    state.distance = null;
    state.visualDropCm = 0;
    state.gameState = 'waiting';
    state.trackSignal = '';
    state.lightIndex = -1;
    if (isCanvasLevel(state.currentLevel)) startAnimLoop();
    render();

    if (state.currentLevel === 1) startLevel1Sequence();
    else if (state.currentLevel === 2) startLevel2Sequence();
    else startLevel3Sequence();
  }

  function catchReaction(evt) {
    if (state.gameState === 'waiting') {
      if (state.currentLevel === 1) {
        clearPendingTimers();
        stopLevel1Preview();
        stopAnimLoop();
        resetRace();
        resetCaptureState();
        state.gameState = 'idle';
        setStatusMessage('bad', 'You jumped the gun. Press start again and wait for the ruler to fall.');
        render();
        return;
      }
      if (state.currentLevel === 2) return;
      clearPendingTimers();
      stopLevel1Preview();
      stopAnimLoop();
      state.gameState = 'idle';
      resetRace();
      render();
      return;
    }

    if (state.gameState !== 'dropping') return;

    var endTime = (evt && evt.timeStamp) ? evt.timeStamp : performance.now();
    if (Math.abs(endTime - performance.now()) > 60000) endTime = performance.now();
    var timeInSeconds = (endTime - state.startTime) / 1000;

    state.reactionTime = timeInSeconds;

    if (state.currentLevel === 1) {
      stopLevel1Preview();
      var frozenDropPx = parseFloat(getComputedStyle(el.level1Scene).getPropertyValue('--ruler-drop'));
      if (isNaN(frozenDropPx) || frozenDropPx < 0) {
        state.visualDropCm = clamp(0.5 * G * timeInSeconds * timeInSeconds * 100, 0, RULER_TOTAL_CM);
      } else {
        state.visualDropCm = clamp(frozenDropPx / RULER_PX_PER_CM, 0, RULER_TOTAL_CM);
      }
      el.level1Scene.style.setProperty('--ruler-drop', (state.visualDropCm * RULER_PX_PER_CM).toFixed(2) + 'px');
      state.distance = parseFloat(state.visualDropCm.toFixed(2));
      state.gameState = 'idle';
      capturePendingTrial();
      return;
    }

    if (race.playerLaunched) return;
    race.playerLaunched = true;
    race.playerReactionTime = timeInSeconds;
    race.playerLaunchTime = timeInSeconds;
    race.playerSpeed = getScenarioMotionSpeed(state.currentLevel);
    state.distance = calculateExpectedAnswer(state.currentLevel, timeInSeconds);
    render();
  }

  function recordPendingTrial() {
    if (!state.pendingTrial) return;
    var level = state.pendingTrial.level;
    var pending = state.pendingTrial;
    var expected = pending.expected;

    // Level 1: validate both distance and time inputs
    if (level === 1) {
      var distVal = parseFloat(el.calcDistInput.value);
      var timeVal = parseFloat(el.calcInput.value);
      if (isNaN(distVal)) {
        el.pendingFeedback.className = 'feedback-box bad';
        el.pendingFeedback.textContent = 'Enter your distance reading (in cm) before recording.';
        return;
      }
      if (isNaN(timeVal)) {
        el.pendingFeedback.className = 'feedback-box bad';
        el.pendingFeedback.textContent = 'Enter your calculated reaction time (in s) before recording.';
        return;
      }
      // Validate distance reading within 0.4 cm
      var distDiff = Math.abs(distVal - pending.distance);
      if (distDiff > 0.4) {
        el.pendingFeedback.className = 'feedback-box warn';
        el.pendingFeedback.textContent = 'Your distance reading of ' + distVal.toFixed(2) + ' cm is off by ' + distDiff.toFixed(2) + ' cm. Check the ruler again.';
        return;
      }
      var equationValue = SCENARIOS[level].correctEquation;
      var calculationCorrect = Math.abs(timeVal - expected) <= toleranceFor(level, expected);
      if (!calculationCorrect) {
        el.pendingFeedback.className = 'feedback-box warn';
        el.pendingFeedback.textContent = 'That reaction-time calculation is not close enough to record. Check your work and try again.';
        return;
      }
      var level1Trial = {
        scenario: SCENARIOS[level].shortTitle,
        trialNumber: pending.trialNumber,
        reactionTime: pending.reactionTime,
        equation: equationValue,
        equationLabel: getEquationLabel(equationValue),
        equationCorrect: true,
        calculatedDistance: timeVal,
        simDistance: pending.distance,
        calculationCorrect: calculationCorrect,
        expectedDistance: expected,
        studentDist: distVal,
        unit: SCENARIOS[level].unit
      };
      var level1Recorded = recordOrReplaceTrial(level, level1Trial);
      if (!level1Recorded.recorded) {
        el.pendingFeedback.className = 'feedback-box warn';
        el.pendingFeedback.textContent = 'Trial not recorded: keep trying to beat your slowest time (' + level1Recorded.slowestTime.toFixed(3) + ' s).';
        return;
      }
      appendRecordedTrialAudit({
        l: level,
        n: pending.trialNumber,
        ts: pending.capturedAt || nowMs(),
        rc: level1Recorded.replaced ? 2 : 1,
        a: state.attemptCounts[level] || 0,
        rt: roundTo(pending.reactionTime, 4),
        iv: [roundTo(G, 2)],
        sr: [roundTo(distVal, 2), roundTo(timeVal, 4)],
        out: roundTo(pending.distance, 2),
        exp: [roundTo(expected, 4)],
        ok: 1
      });
    } else if (level === 3) {
      var startGapVal = parseFloat(el.calcDistInput.value);
      var finalGapVal = parseFloat(el.calcInput.value);
      if (isNaN(startGapVal)) {
        el.pendingFeedback.className = 'feedback-box bad';
        el.pendingFeedback.textContent = 'Enter your calculated initial head-start gap (in m) before recording the trial.';
        return;
      }
      if (isNaN(finalGapVal)) {
        el.pendingFeedback.className = 'feedback-box bad';
        el.pendingFeedback.textContent = 'Enter your calculated final race gap (in m) before recording the trial.';
        return;
      }

      var equationValue = SCENARIOS[level].correctEquation;
      var expectedStart = expected;
      var expectedFinal = typeof pending.finalGapExpected === 'number' ? pending.finalGapExpected : pending.distance;
      var startCorrect = Math.abs(startGapVal - expectedStart) <= toleranceFor(level, expectedStart);
      var finalCorrect = Math.abs(finalGapVal - expectedFinal) <= toleranceFor(level, expectedFinal);
      var calculationCorrect = startCorrect && finalCorrect;
      if (!calculationCorrect) {
        el.pendingFeedback.className = 'feedback-box warn';
        el.pendingFeedback.textContent = 'Both drag-race calculations must be correct before the trial can be recorded.';
        return;
      }
      var trialRow = {
        scenario: SCENARIOS[level].shortTitle,
        trialNumber: pending.trialNumber,
        reactionTime: pending.reactionTime,
        equation: equationValue,
        equationLabel: getEquationLabel(equationValue),
        equationCorrect: true,
        calculatedDistance: finalGapVal,
        simDistance: pending.distance,
        calculationCorrect: calculationCorrect,
        expectedDistance: expectedFinal,
        studentStartGap: startGapVal,
        expectedStartGap: expectedStart,
        unit: SCENARIOS[level].unit
      };
      var recorded = recordOrReplaceTrial(level, trialRow);
      if (!recorded.recorded) {
        el.pendingFeedback.className = 'feedback-box warn';
        el.pendingFeedback.textContent = 'Trial not recorded: keep trying to beat your slowest time (' + recorded.slowestTime.toFixed(3) + ' s).';
        return;
      }
      appendRecordedTrialAudit({
        l: level,
        n: pending.trialNumber,
        ts: pending.capturedAt || nowMs(),
        rc: recorded.replaced ? 2 : 1,
        a: state.attemptCounts[level] || 0,
        rt: roundTo(pending.reactionTime, 4),
        op: roundTo(pending.opponentRT, 4),
        iv: [roundTo(DRAG_ACCEL, 2), roundTo(Math.abs(pending.reactionTime - pending.opponentRT), 4)],
        sr: [roundTo(startGapVal, 3), roundTo(finalGapVal, 3)],
        out: roundTo(pending.distance, 3),
        exp: [roundTo(expectedStart, 3), roundTo(expectedFinal, 3)],
        ok: 1
      });
    } else {
      var calcValue = parseFloat(el.calcInput.value);
      var answerLabel = getStudentAnswerLabel(level).toLowerCase();
      if (isNaN(calcValue)) {
        el.pendingFeedback.className = 'feedback-box bad';
        el.pendingFeedback.textContent = 'Enter ' + answerLabel + ' before recording the trial.';
        return;
      }
      var equationValue = SCENARIOS[level].correctEquation;
      var calculationCorrect = Math.abs(calcValue - expected) <= toleranceFor(level, expected);
      if (!calculationCorrect) {
        el.pendingFeedback.className = 'feedback-box warn';
        el.pendingFeedback.textContent = 'That answer is not close enough to record the trial. Check your work and try again.';
        return;
      }
      var trialRow = {
        scenario: SCENARIOS[level].shortTitle,
        trialNumber: pending.trialNumber,
        reactionTime: pending.reactionTime,
        equation: equationValue,
        equationLabel: getEquationLabel(equationValue),
        equationCorrect: true,
        calculatedDistance: calcValue,
        simDistance: pending.distance,
        calculationCorrect: calculationCorrect,
        expectedDistance: expected,
        unit: SCENARIOS[level].unit
      };
      var recorded = recordOrReplaceTrial(level, trialRow);
      if (!recorded.recorded) {
        el.pendingFeedback.className = 'feedback-box warn';
        el.pendingFeedback.textContent = 'Trial not recorded: keep trying to beat your slowest time (' + recorded.slowestTime.toFixed(3) + ' s).';
        return;
      }
      appendRecordedTrialAudit({
        l: level,
        n: pending.trialNumber,
        ts: pending.capturedAt || nowMs(),
        rc: recorded.replaced ? 2 : 1,
        a: state.attemptCounts[level] || 0,
        rt: roundTo(pending.reactionTime, 4),
        op: roundTo(pending.opponentRT, 4),
        iv: [roundTo(RUNNER_TOP_SPEED, 2)],
        sr: [roundTo(calcValue, 4)],
        out: roundTo(pending.distance, 2),
        exp: [roundTo(expected, 4)],
        ok: 1
      });
    }

    resetCaptureState();

    if (levelIsComplete(level)) {
      // No toast/notice UI currently shown; completion is reflected in notebook and badges.
    }

    setSCORMProgress(false);
    saveSuspendData();
    render();
  }

  function allAnalysisComplete() {
    return analysisPromptScore(state.analysis.a1) > 0 && analysisPromptScore(state.analysis.a2) > 0 && analysisPromptScore(state.analysis.a3) > 0 && analysisPromptScore(state.analysis.a4) > 0;
  }

  function submitLab() {
    if (!allRequiredTrialsRecorded() || !allAnalysisComplete()) return;

    state.submitted = true;
    state.completedAt = nowMs();
    setSCORMProgress(true);
    saveSuspendData();
    render();
  }

  function renderSceneVisibility() {
    var level = state.currentLevel;
    var showLevel1 = level === 1;
    el.canvas.classList.toggle('hidden', showLevel1);
    el.level1Scene.classList.toggle('hidden', !showLevel1);
    el.level1Scene.classList.toggle('waiting', level === 1 && state.gameState === 'waiting');
    el.level1Scene.classList.toggle('dropping', level === 1 && state.gameState === 'dropping');
    if (showLevel1) {
      var rulerDropPx = 0;
      if (state.pendingTrial && state.pendingTrial.level === 1) rulerDropPx = clamp(state.visualDropCm * RULER_PX_PER_CM, 0, RULER_TOTAL_CM * RULER_PX_PER_CM);
      else if (state.distance !== null) rulerDropPx = clamp(state.visualDropCm * RULER_PX_PER_CM, 0, RULER_TOTAL_CM * RULER_PX_PER_CM);
      if (state.gameState !== 'dropping') el.level1Scene.style.setProperty('--ruler-drop', rulerDropPx.toFixed(2) + 'px');
      el.handGraphic.classList.toggle('closed', !!state.pendingTrial && state.pendingTrial.level === 1);
      var showPrompt = !state.pendingTrial && state.gameState === 'idle';
      if (el.l1StartPrompt) {
        el.l1StartPrompt.classList.remove('ready', 'catch');
        el.l1StartPrompt.textContent = 'Click anywhere to begin, the ruler will start shaking and then fall! CLICK AGAIN anywhere to catch it.';
        if (state.gameState === 'waiting') el.l1StartPrompt.classList.add('ready');
        el.l1StartPrompt.style.display = showPrompt ? '' : 'none';
      }
      if (el.canvasStartPrompt) el.canvasStartPrompt.style.display = 'none';
    } else {
      el.level1Scene.classList.remove('waiting');
      el.handGraphic.classList.remove('closed');
      if (el.l1StartPrompt) el.l1StartPrompt.style.display = 'none';
      var showCanvasPrompt = state.gameState === 'idle' && !state.pendingTrial;
      if (el.canvasStartPrompt) el.canvasStartPrompt.style.display = showCanvasPrompt ? '' : 'none';
    }
  }

  function renderOverlays() {
    var level = state.currentLevel;

    if (level === 3 && state.gameState === 'waiting' && state.trackSignal) {
      el.trackSignal.textContent = state.trackSignal;
      el.trackSignal.className = 'track-signal engines';
    } else {
      el.trackSignal.textContent = '';
      el.trackSignal.className = 'track-signal';
    }
  }

  function renderCanvasSnapshotIfNeeded() {
    if (state.currentLevel !== 3) return;
    if (!state.pendingTrial || !state.level2FinishSnapshot) return;
    if (!window.DragRaceGfx || !window.DragRaceGfx.drawFinishSnapshot) return;

    var ctx = el.canvas.getContext('2d');
    window.DragRaceGfx.drawFinishSnapshot(ctx, el.canvas.width, el.canvas.height, state.level2FinishSnapshot);
  }

  function renderPendingTrial() {
    var level = state.currentLevel;
    var pending = state.pendingTrial;
    el.pendingRtGrid.classList.toggle('hidden', level === 1);
    el.pendingCard.classList.toggle('level1-input-mode', level === 1 || level === 3);
    el.pendingLeftLabel.textContent = level === 1 ? 'Distance Fallen' : 'CPU';
    el.pendingCpuChip.classList.remove('hidden');
    if (level === 3) {
      el.pendingDirections.textContent = '';
      el.pendingDirections.style.display = 'none';
    } else {
      el.pendingDirections.textContent = getPendingInstruction(level);
      el.pendingDirections.style.display = '';
    }
    el.calcInputLabel.textContent = getStudentAnswerLabel(level);
    el.calcInput.placeholder = getStudentAnswerPlaceholder(level);
    el.calcUnit.textContent = getStudentAnswerUnit(level);
    el.equationHint.innerHTML = formatHintMarkup(SCENARIOS[level].formulaReference);
    setHintOpen(state.hintOpen);

    if (level === 1) {
      el.calcDistLabel.style.display = '';
      el.calcDistRow.style.display = '';
      el.calcDistLabel.textContent = 'Read Distance from ruler';
      el.calcDistUnit.textContent = 'cm';
      el.calcDistInput.placeholder = 'e.g. 12.50';
      el.calcInputLabel.textContent = 'Calculate reaction time';
      el.calcInput.placeholder = 'e.g. 0.250';
      el.calcUnit.textContent = 's';
    } else if (level === 3) {
      el.calcDistLabel.style.display = '';
      el.calcDistRow.style.display = '';
      el.calcDistLabel.textContent = 'Initial Head Start (m) - Use the difference in reaction times and the 40 m/s^2 acceleration to find how much of a head start the leader got.';
      el.calcDistUnit.textContent = 'm';
      el.calcDistInput.placeholder = 'e.g. 0.40';
      el.calcInputLabel.textContent = 'Final Race Gap (m) - Find out how many seconds the trailing car was actually driving, calculate its distance, and subtract that from 320 m.';
      el.calcInput.placeholder = 'e.g. 3.50';
      el.calcUnit.textContent = 'm';
    } else {
      el.calcDistLabel.style.display = 'none';
      el.calcDistRow.style.display = 'none';
    }

    // Card highlight when trial is pending
    el.pendingCard.classList.toggle('card-active', !!pending);

    if (!pending) {
      el.pendingCpuRt.textContent = '--';
      el.pendingYouRt.textContent = '--';
      el.calcDistInput.value = '';
      el.calcInput.value = '';
      el.recordTrialBtn.disabled = true;
      el.discardTrialBtn.disabled = true;
      if (state.statusMessage) {
        el.pendingFeedback.className = 'feedback-box ' + state.statusKind;
        el.pendingFeedback.textContent = state.statusMessage;
      } else {
        el.pendingFeedback.className = 'feedback-box muted hidden';
        el.pendingFeedback.textContent = '';
      }
      // Step indicators reset
      el.stepCapture.classList.remove('done');
      el.stepEquation.classList.remove('done');
      el.stepCalculate.classList.remove('done');
      return;
    }
    if (level === 2) {
      el.pendingCpuRt.textContent = pending.opponentRT.toFixed(3) + ' s';
      el.pendingYouRt.textContent = 'Solve';
    } else if (level === 3) {
      el.pendingCpuRt.textContent = pending.opponentRT.toFixed(3) + ' s';
      el.pendingYouRt.textContent = pending.reactionTime.toFixed(3) + ' s';
    } else {
      el.pendingCpuRt.textContent = pending.distance.toFixed(2) + ' cm';
      el.pendingYouRt.textContent = 'Hidden';
    }

    applyTestingAutofillForPending(level, pending);
    el.calcInput.value = state.tempCalculation;
    el.calcInput.disabled = false;
    el.recordTrialBtn.disabled = false;
    el.discardTrialBtn.disabled = false;
    el.pendingFeedback.className = 'feedback-box muted hidden';
    el.pendingFeedback.textContent = '';

    // Step indicators
    el.stepCapture.classList.add('done');
    el.stepEquation.classList.add('done');
    if (level === 3) {
      el.stepCalculate.classList.toggle('done', !isNaN(parseFloat(el.calcDistInput.value)) && !isNaN(parseFloat(el.calcInput.value)));
    } else {
      el.stepCalculate.classList.toggle('done', state.tempCalculation !== '' && !isNaN(parseFloat(state.tempCalculation)));
    }
  }

  function renderScenarioInfo() {
    var scenario = SCENARIOS[state.currentLevel];
    var recorded = state.trialsByLevel[state.currentLevel].length;
    var canShowReset = (pendingTrialExists() || recorded > 0) && state.gameState !== 'waiting' && state.gameState !== 'dropping';
    if (el.scenarioSubtitle) el.scenarioSubtitle.textContent = scenario.description;
    el.sceneInstruction.textContent = '';
    el.sceneInstruction.hidden = true;
    el.startSequenceBtn.hidden = true;
    el.startSequenceBtn.disabled = pendingTrialExists() || state.gameState === 'waiting' || state.gameState === 'dropping';
    el.resetScenarioBtn.hidden = !canShowReset;
    el.resetScenarioBtn.disabled = !canShowReset;
    el.resetScenarioBtn.textContent = 'New Trial';
    if (el.gameFooter) el.gameFooter.classList.toggle('show-reset', canShowReset);

    for (var i = 0; i < el.scenarioBtns.length; i++) {
      var btn = el.scenarioBtns[i];
      var level = Number(btn.dataset.level);
      btn.classList.toggle('active', level === state.currentLevel);
      btn.classList.toggle('completed', levelIsComplete(level) && level !== state.currentLevel);
    }

    // Update game area cursor class
    el.gameArea.className = 'state-' + state.gameState;
    el.scenarioMeta1.textContent = state.trialsByLevel[1].length + ' / ' + REQUIRED_TRIALS + ' trials';
    el.scenarioMeta2.textContent = state.trialsByLevel[2].length + ' / ' + REQUIRED_TRIALS + ' trials';
    el.scenarioMeta3.textContent = state.trialsByLevel[3].length + ' / ' + REQUIRED_TRIALS + ' trials';
  }

  function renderNotebookChart() {
    el.overallProgressBadge.textContent = totalTrialsRecorded() + ' / 9 recorded';
    var level, i, trial, rows, unit, bestRT, row, cellEl, timeEl, distEl, bestEl, avgEl, avgRT;
    for (level = 1; level <= 3; level++) {
      rows = state.trialsByLevel[level];
      unit = SCENARIOS[level].unit;
      bestRT = null;
      for (i = 0; i < rows.length; i++) {
        if (bestRT === null || rows[i].reactionTime < bestRT) bestRT = rows[i].reactionTime;
      }
      for (trial = 1; trial <= REQUIRED_TRIALS; trial++) {
        cellEl = document.getElementById('rt-cell-' + level + '-' + trial);
        if (!cellEl) continue;
        row = rows[trial - 1] || null;
        timeEl = cellEl.querySelector('.rt-time');
        distEl = cellEl.querySelector('.rt-dist');
        if (row) {
          timeEl.textContent = row.reactionTime.toFixed(3) + ' s';
          distEl.textContent = row.simDistance.toFixed(2) + ' ' + unit;
          cellEl.classList.add('rt-filled');
          cellEl.classList.toggle('rt-best-highlight', row.reactionTime === bestRT);
        } else {
          timeEl.textContent = '--';
          distEl.textContent = '--';
          cellEl.classList.remove('rt-filled', 'rt-best-highlight');
        }
      }
      bestEl = document.getElementById('rt-best-' + level);
      if (bestEl) bestEl.textContent = bestRT !== null ? bestRT.toFixed(3) + ' s' : '--';
      avgRT = averageForLevel(level, 'reactionTime');
      avgEl = document.getElementById('rt-avg-' + level);
      if (avgEl) avgEl.textContent = avgRT !== null ? avgRT.toFixed(3) + ' s' : '--';
    }
  }

  function renderAnalysisLock() {
    var unlocked = allRequiredTrialsRecorded();
    applyTestingAutofillForAnalysis(unlocked);
    el.analysisCard.classList.toggle('locked', !unlocked);
    el.analysisLockChip.textContent = unlocked ? 'Unlocked' : 'Locked';
    el.analysisLockText.textContent = !unlocked ? 'Record all 9 trials to unlock the analysis section.' : (state.submitted ? 'Submission recorded. Analysis is now read-only.' : 'Use the evidence from your averages and trial data to explain what happened.');
    el.analysis1.disabled = !unlocked || state.submitted;
    el.analysis2.disabled = !unlocked || state.submitted;
    el.analysis3.disabled = !unlocked || state.submitted;
    el.analysis4.disabled = !unlocked || state.submitted;
    el.analysis1.value = state.analysis.a1;
    el.analysis2.value = state.analysis.a2;
    el.analysis3.value = state.analysis.a3;
    el.analysis4.value = state.analysis.a4;
  }

  function renderScore() {
    var breakdown = computeScoreBreakdown();
    state.score = breakdown.percent;
    var chartDone = allRequiredTrialsRecorded();
    var questionsDone = allAnalysisComplete();

    if (el.completionChartItem) el.completionChartItem.classList.toggle('done', chartDone);
    if (el.completionQuestionsItem) el.completionQuestionsItem.classList.toggle('done', questionsDone);
    if (el.completionChartStatus) el.completionChartStatus.textContent = chartDone ? 'Done' : 'In Progress';
    if (el.completionQuestionsStatus) el.completionQuestionsStatus.textContent = questionsDone ? 'Done' : 'In Progress';

    // Enable submit button when all trials recorded and all analysis answers have 20+ chars
    var canSubmit = chartDone && questionsDone && !state.submitted;
    el.submitBtn.disabled = !canSubmit;
    el.submitBtn.textContent = state.submitted ? 'Submitted' : 'Submit Lab';
  }

  function render() {
    renderScenarioInfo();
    renderSceneVisibility();
    renderOverlays();
    renderCanvasSnapshotIfNeeded();
    renderPendingTrial();
    renderNotebookChart();
    renderAnalysisLock();
    renderScore();
  }

  function bindEvents() {
    function preventClipboardActions(node) {
      if (!node) return;
      node.addEventListener('copy', function(evt) { evt.preventDefault(); });
      node.addEventListener('cut', function(evt) { evt.preventDefault(); });
      node.addEventListener('paste', function(evt) { evt.preventDefault(); });
      node.addEventListener('drop', function(evt) { evt.preventDefault(); });
      node.addEventListener('contextmenu', function(evt) { evt.preventDefault(); });
    }

    el.startBtn.addEventListener('click', function() {
      el.startScreen.classList.add('hidden');
      el.app.classList.remove('hidden');
      sizeCanvas();
      render();
    });

    el.showWalkthroughBtn.addEventListener('click', openWalkthrough);
    el.resetLabBtn.addEventListener('click', resetWholeLab);
    el.confirmCancel.addEventListener('click', hideConfirm);
    el.confirmProceed.addEventListener('click', function() {
      if (pendingConfirmAction) pendingConfirmAction();
      hideConfirm();
    });
    el.confirmOverlay.addEventListener('click', function(evt) {
      if (evt.target === el.confirmOverlay) hideConfirm();
    });
    el.walkthroughOverlay.addEventListener('click', function(evt) {
      if (evt.target === el.walkthroughOverlay) closeWalkthrough();
    });
    el.walkPrevBtn.addEventListener('click', function() {
      if (walkStep > 0) {
        walkStep--;
        renderWalkthrough();
      }
    });
    el.walkNextBtn.addEventListener('click', function() {
      if (walkStep >= WALK_STEPS.length - 1) closeWalkthrough();
      else {
        walkStep++;
        renderWalkthrough();
      }
    });
    el.resetScenarioBtn.addEventListener('click', resetScenarioData);
    el.startSequenceBtn.addEventListener('click', startTest);
    el.hintToggleBtn.addEventListener('click', function() {
      setHintOpen(!state.hintOpen);
    });
    el.recordTrialBtn.addEventListener('click', recordPendingTrial);
    el.discardTrialBtn.addEventListener('click', discardPendingTrial);
    el.submitBtn.addEventListener('click', submitLab);

    for (var i = 0; i < el.scenarioBtns.length; i++) {
      el.scenarioBtns[i].addEventListener('click', function(evt) {
        selectLevel(Number(evt.currentTarget.dataset.level));
      });
    }

    el.gameArea.addEventListener('click', function(e) {
      if (state.gameState === 'dropping' || state.gameState === 'waiting') catchReaction(e);
      else startTest();
    });

    el.gameArea.addEventListener('keydown', function(evt) {
      if (evt.key !== ' ' && evt.key !== 'Enter') return;
      evt.preventDefault();
      if (state.gameState === 'dropping' || state.gameState === 'waiting') catchReaction(evt);
      else startTest();
    });

    el.analysis1.addEventListener('input', recordOrUpdateTextState);
    el.analysis2.addEventListener('input', recordOrUpdateTextState);
    el.analysis3.addEventListener('input', recordOrUpdateTextState);
    el.analysis4.addEventListener('input', recordOrUpdateTextState);

    preventClipboardActions(el.calcInput);
    preventClipboardActions(el.calcDistInput);
    preventClipboardActions(el.analysis1);
    preventClipboardActions(el.analysis2);
    preventClipboardActions(el.analysis3);
    preventClipboardActions(el.analysis4);

    el.calcInput.addEventListener('input', function() {
      state.tempCalculation = el.calcInput.value;
      renderPendingTrial();
    });

    el.calcDistInput.addEventListener('input', function() {
      renderPendingTrial();
    });

    var resizeTimer = null;
    window.addEventListener('resize', function() {
      if (!el.app.classList.contains('hidden')) {
        if (resizeTimer) cancelAnimationFrame(resizeTimer);
        resizeTimer = requestAnimationFrame(function() {
          sizeCanvas();
          render();
          resizeTimer = null;
        });
      }
    });
  }

  function init() {
    cacheDom();
    buildRulerScale();
    loadSuspendData();
    if (!state.activityStartedAt) state.activityStartedAt = nowMs();
    state.sessionStartedAt = nowMs();
    sizeCanvas();
    bindEvents();
    setSCORMProgress(state.submitted);
    render();
  }

  window.addEventListener('load', init);
})();
