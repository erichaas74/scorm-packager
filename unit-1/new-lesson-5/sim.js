    /* ===== Constants ===== */
    const GRAVITY = -10;
    const RETRO_ACCEL = 20;
    const SAFE_LANDING_SPEED = 5;
    const LANDING_SPEED_LIMIT = 7.5;
    const MAX_SIM_TIME = 30;
    const FIXED_DT = 1 / 60;
    const MAX_CATCHUP_TIME = 0.25;
    const MISSION_COMBOS = [
      { a: 15, t: 3 },
      { a: 20, t: 2.1 },
      { a: 20, t: 2.5 },
      { a: 20, t: 3 },
      { a: 25, t: 1.8 },
      { a: 25, t: 2 },
      { a: 30, t: 1.5 },
      { a: 30, t: 2 },
      { a: 45, t: 1.2 },
      { a: 40, t: 1.2 },
      { a: 40, t: 1.5 },
    ];
    const TIME_FACTOR = 2;

    const BURN_POINTS = 30;
    const BURN_SUBA_POINTS = 8;
    const BURN_SUBB_POINTS = 8;
    const BURN_SUBC_POINTS = 8;
    const BURN_SUBD_POINTS = 6;
    const RETRO_POINTS = 35;
    const RETRO_SUBA_POINTS = 7;
    const RETRO_SUBB_POINTS = 7;
    const RETRO_SUBC_POINTS = 21;
    const LANDING_POINTS = 35;

    const BURN_TOL = 0.10;
    const RETRO_TOL = 1.0;
    const SUB_TOL_VEL = 0.5;
    const SUB_TOL_HEIGHT = 1.0;
    const MAX_CALC_ATTEMPTS = 3;
    const PASS_THRESHOLD = 80;
    const ATTITUDE_THRUSTER_PULSE_MS = 840;
    const CRASH_IGNITION_MS = 180;

    const WALKTHROUGH_STEPS = [
      {
        title: 'Welcome to Mission Control',
        body: 'You are the flight engineer for a rocket launch lab. Work through the burn, coast, and apex walkthroughs first, then switch to investigation mode and run your own trials with the live simulation.',
        color: 'sky',
      },
      {
        title: 'Walkthrough 1 - Burn Phase',
        body: 'Stage 1 uses one set of givens: <span class="eq">v0 = 0</span>, known burn acceleration, and known burn time.<br><br>Solve both the burn displacement with <span class="eq">dy = 1/2at^2</span> and the burnout velocity with <span class="eq">v = at</span> before moving on.',
        color: 'sky',
      },
      {
        title: 'Walkthrough 2 - Coast Phase',
        body: 'After cutoff, only gravity acts: <span class="eq">a = -10 m/s^2</span> until <span class="eq">v = 0</span> at apex.<br><br>Use the burnout velocity from Stage 1 as <span class="eq">v0</span> and solve the extra coast displacement to the apex.',
        color: 'violet',
      },
      {
        title: 'Walkthrough 3 - Apex Verification',
        body: 'Combine the two ascent displacements with <span class="eq">y_apex = dy1 + dy2</span>.<br><br>Enter your predicted apex, then launch the rocket and compare your prediction with the measured apex.',
        color: 'red',
      },
      {
        title: 'Stage 4 - Investigation Mode',
        body: 'Use the live action button to run your own tests. Launch, stop the burn when you choose, then trigger retro burn during descent when you choose.<br><br>After each trial, read the recorded flight data to answer questions about apex, burnout height, burnout velocity, retro start height, landing velocity, and landing safety.',
        color: 'emerald',
      },
    ];

    const DEFAULT_FLIGHT_VIEW = {
      time: 0, y: 0, v: 0, acceleration: 0, height: 0, velocity: 0,
      stage: 'ready', isRunning: false, hasStarted: false, maxHeightSeen: 0,
    };

    const DEFAULT_SIMULATION_STATE = {
      time: 0, y: 0, v: 0, stage: 'ready',
      running: false, burnOn: false, retroOn: false,
      apexMarked: false, maxHeightSeen: 0,
      burnCutoffTime: null, retroStartHeight: null, burnCutoffHeight: null,
      burnCutoffVelocity: null, retroStartTime: null, retroStartVelocity: null,
      retroBurnAccum: 0, retroLastOnTime: null,
    };

    /* ===== State ===== */
    const appState = {
      mission: null,
      briefStage: 1,
      showCoach: false,
      burnLocked: false,
      challenge: null,
      flightView: { ...DEFAULT_FLIGHT_VIEW },
      finishedMetrics: null,
      simulation: { ...DEFAULT_SIMULATION_STATE },
      rafId: null,
      lastFrameTime: null,
      accumulator: 0,
      burnScore: 0,
      retroScore: 0,
      landingScore: 0,
      retroAttempts: 0,
      bestScore: 0,
      levelMode: 0,
      levelDemoResult: null,
      walkStep: 0,
      showInstrumentGrid: false,
      showFlightValues: false,
      rocketSideways: false,
      attitudeThrusterPulseMode: null,
      attitudeThrusterPulseTimer: null,
      crashIgnitionActive: false,
      crashIgnitionTimer: null,
      freezeType: null,
      freezeTimeoutId: null,
      burnSubA: { done: false, score: 0, attempts: 0, feedback: null, input: '' },
      burnSubB: { done: false, score: 0, attempts: 0, feedback: null, input: '' },
      burnSubC: { done: false, score: 0, attempts: 0, feedback: null, input: '' },
      coastSubC: { done: false, attempts: 0, feedback: null, input: '' },
      coastSubD: { done: false, attempts: 0, feedback: null, input: '' },
      l4Done: false,
      l4Score: 0,
      l4Attempts: 0,
      l4Feedback: null,
      l4Inputs: {
        burnV: '',
        burnDy: '',
        coastTime: '',
        coastDy: '',
        fallV: '',
        fallTime: '',
        retroAccel: '',
        retroTime: '',
        totalTime: '',
      },
    };

    function camelToKebab(value) {
      var result = '';
      for (var index = 0; index < value.length; index++) {
        var char = value.charAt(index);
        var prev = index > 0 ? value.charAt(index - 1) : '';
        var next = index < value.length - 1 ? value.charAt(index + 1) : '';
        var isUpper = char >= 'A' && char <= 'Z';
        var prevIsUpper = prev >= 'A' && prev <= 'Z';
        var prevIsLowerOrDigit = /[a-z0-9]/.test(prev);
        var nextIsLowerOrDigit = /[a-z0-9]/.test(next);

        if (isUpper) {
          if (index > 0 && (prevIsLowerOrDigit || (prevIsUpper && nextIsLowerOrDigit))) {
            result += '-';
          }
          result += char.toLowerCase();
        } else {
          result += char;
        }
      }
      return result;
    }

    const el = new Proxy({}, {
      get: function(target, prop) {
        if (typeof prop !== 'string') return undefined;

        if (prop in target) {
          var cached = target[prop];
          if (Array.isArray(cached)) return cached;
          if (cached && (cached.isConnected === undefined || cached.isConnected)) return cached;
          delete target[prop];
        }

        var value;
        if (prop === 'stageTabs') {
          value = Array.from(document.querySelectorAll('.stage-tab'));
        } else if (prop === 'ticks') {
          value = Array.from({ length: 5 }, function(_, index) {
            return document.getElementById('tick-' + index);
          });
        } else if (prop === 'flightView') {
          value = document.querySelector('.flight-view');
        } else if (prop === 'rocketGlow') {
          value = document.querySelector('.rocket-glow');
        } else if (prop === 'showWalkthroughBtn') {
          value = document.getElementById('show-walkthrough');
        } else {
          var elementId = camelToKebab(prop);
          value = document.getElementById(elementId);
          if (!value && /\d+$/.test(elementId)) {
            value = document.getElementById(elementId.replace(/(\d+)$/, '-$1'));
          }
          if (!value && /\d+[a-z]$/i.test(elementId)) {
            value = document.getElementById(elementId.replace(/(\d+[a-z])$/i, '-$1'));
          }
        }

        if (value !== null && value !== undefined) {
          target[prop] = value;
        }
        return value;
      },
    });

    /* ===== Utilities ===== */
    function clamp(value, min, max) {
      return Math.min(max, Math.max(min, value));
    }

    function formatSigned(value, digits) {
      if (digits === undefined) digits = 1;
      var sign = value > 0 ? '+' : '';
      return sign + Number(value).toFixed(digits);
    }

    function escapeHtml(value) {
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    function formatQuestionInputValue(value) {
      return value == null ? '' : escapeHtml(value);
    }

    function solveImpactTime(y0, v0, a, dt) {
      if (y0 <= 0) return 0;
      if (Math.abs(a) < 1e-9) {
        if (v0 >= 0) return dt;
        return clamp(-y0 / v0, 0, dt);
      }
      var discriminant = v0 * v0 - 2 * a * y0;
      if (discriminant < 0) return dt;
      var sqrtD = Math.sqrt(discriminant);
      var roots = [(-v0 - sqrtD) / a, (-v0 + sqrtD) / a]
        .filter(function(root) { return Number.isFinite(root) && root >= 0 && root <= dt + 1e-6; })
        .sort(function(left, right) { return left - right; });
      return roots[0] !== undefined ? roots[0] : dt;
    }

    /* ===== Physics ===== */
    function solveMission(burnAccel, burnTime) {
      var burnoutVelocity = burnAccel * burnTime;
      var burnoutHeight = 0.5 * burnAccel * burnTime * burnTime;
      var coastHeight = (burnoutVelocity * burnoutVelocity) / (2 * Math.abs(GRAVITY));
      var apexHeight = burnoutHeight + coastHeight;
      var retroHeight = apexHeight / 3;
      var descentSpeedAtRetro = Math.sqrt(2 * Math.abs(GRAVITY) * (apexHeight - retroHeight));
      var retroBurnDuration = descentSpeedAtRetro / RETRO_ACCEL;
      var timeToApexFromBurnout = burnoutVelocity / Math.abs(GRAVITY);
      return {
        burnAccel: burnAccel,
        burnTime: burnTime,
        burnoutVelocity: burnoutVelocity,
        burnoutHeight: burnoutHeight,
        coastHeight: coastHeight,
        apexHeight: apexHeight,
        retroHeight: retroHeight,
        descentSpeedAtRetro: descentSpeedAtRetro,
        retroBurnDuration: retroBurnDuration,
        timeToApexFromBurnout: timeToApexFromBurnout,
      };
    }

    function createMission(targetHeight) {
      var combos = MISSION_COMBOS.map(function(combo) {
        var solved = solveMission(combo.a, combo.t);
        return {
          a: combo.a,
          t: combo.t,
          solved: solved,
        };
      });

      var selected;
      if (typeof targetHeight === 'number' && Number.isFinite(targetHeight)) {
        selected = combos.slice().sort(function(left, right) {
          return Math.abs(left.solved.apexHeight - targetHeight) - Math.abs(right.solved.apexHeight - targetHeight);
        })[0];
      } else {
        selected = combos[Math.floor(Math.random() * combos.length)];
      }

      return Object.assign({
        id: Math.random().toString(36).slice(2, 9),
        targetHeight: typeof targetHeight === 'number' && Number.isFinite(targetHeight)
          ? targetHeight
          : Number(selected.solved.apexHeight.toFixed(1)),
        gravity: GRAVITY,
        retroAccel: RETRO_ACCEL,
        safeLandingSpeed: SAFE_LANDING_SPEED,
      }, selected.solved);
    }

    function getPhysicsAcceleration(sim, mission) {
      if (sim.burnOn) return mission.burnAccel;
      if (sim.retroOn) return mission.retroAccel;
      return mission.gravity;
    }

    function getDisplayAcceleration(sim, mission) {
      if (!sim.running) return 0;
      return getPhysicsAcceleration(sim, mission);
    }

    function buildFlightView(sim, mission) {
      return {
        time: sim.time,
        y: sim.y,
        v: sim.v,
        height: Math.max(0, sim.y),
        velocity: sim.v,
        acceleration: getDisplayAcceleration(sim, mission),
        stage: sim.stage,
        isRunning: sim.running,
        hasStarted: sim.stage !== 'ready',
        maxHeightSeen: sim.maxHeightSeen,
      };
    }

    /* ===== Display Helpers ===== */
    function getViewportMaxHeight() {
      var padded = Math.max(appState.mission.targetHeight, appState.mission.apexHeight) * 1.15;
      var rounded = Math.ceil(padded / 30) * 30;
      return Math.max(180, rounded);
    }

    function getAltitudeTicks(viewportMaxHeight) {
      return Array.from({ length: 5 }, function(_, index) {
        return Math.round(viewportMaxHeight * (1 - index / 4));
      });
    }

    function getRocketBottomPercent(viewportMaxHeight) {
      var flightViewHeight = el.flightView ? el.flightView.clientHeight : 600;
      var padTopPx = 50;
      var padOffset = (padTopPx / flightViewHeight) * 100;
      return (appState.flightView.height / viewportMaxHeight) * 100 + padOffset;
    }

    function getStageToneClass(stage) {
      switch (stage) {
        case 'crashed': return 'red';
        case 'landed': return 'emerald';
        case 'retro': return 'orange';
        case 'descent': return 'amber';
        case 'coast': return 'violet';
        case 'powered': return 'sky';
        default: return 'slate';
      }
    }

    function getBriefStageData(stageOverride) {
      var mission = appState.mission;
      var stage = stageOverride || appState.briefStage;
      var challenge = stage === 4 ? getActiveChallenge() : null;

      if (stage === 1) {
        return {
          title: 'Stage 1 ΓÇö Burn phase',
          tone: 'sky',
          description: 'Burn phase knowns/unknowns: known v0 = 0, known burn acceleration, known burn time. Solve both burn height and burnout velocity.',
          values: [
            { label: '╬öy', value: appState.burnLocked ? mission.burnoutHeight.toFixed(1) + ' m (╬öy1)' : '?' },
            { label: 'vΓéÇ', value: '0.0 m/s' },
            { label: 'v', value: appState.burnLocked ? '+' + mission.burnoutVelocity.toFixed(1) + ' m/s' : '?' },
            { label: 'a', value: '+' + mission.burnAccel.toFixed(1) + ' m/s┬▓' },
            { label: 't', value: mission.burnTime.toFixed(2) + ' s' },
          ],
        };
      }

      if (stage === 2) {
        return {
          title: 'Stage 2 ΓÇö Coast phase',
          tone: 'violet',
          description: 'Coast phase knowns/unknowns: known v0 from burnout, known a = -10, final v = 0 at apex, solve for coast height.',
          values: [
            { label: '╬öy', value: appState.coastSubC.done ? mission.coastHeight.toFixed(1) + ' m (╬öy2)' : '?' },
            { label: 'vΓéÇ', value: appState.burnLocked ? '+' + mission.burnoutVelocity.toFixed(1) + ' m/s' : '?' },
            { label: 'v', value: '0.0 m/s (at apex)' },
            { label: 'a', value: mission.gravity.toFixed(1) + ' m/s┬▓' },
            { label: 't', value: appState.coastSubC.done ? mission.timeToApexFromBurnout.toFixed(2) + ' s' : '?' },
          ],
        };
      }

      if (stage === 3) {
        return {
          title: 'Stage 3 ΓÇö Apex verification',
          tone: 'red',
          description: 'Combine the burn and coast displacements to predict the apex, then launch the verification run and compare it with the measured max height.',
          values: [
            { label: '╬öy', value: appState.coastSubD.done ? mission.apexHeight.toFixed(1) + ' m (y_apex)' : '?' },
            { label: 'vΓéÇ', value: '0.0 m/s' },
            { label: 'v', value: '0.0 m/s (at apex)' },
            { label: 'a', value: 'derived from stages 1 + 2' },
            { label: 't', value: 'launch to verify' },
          ],
        };
      }

      return {
        title: 'Stage 4 ΓÇö Investigation mode',
        tone: 'emerald',
        description: challenge && challenge.type === 'landing'
          ? 'Landing challenge: match the planned burn timing and retro window, then finish with a safe touchdown.'
          : 'Apex challenge: time your burn cutoff to hit the target apex, then compare the recorded result with the challenge goal.',
        values: [
          { label: '╬öy', value: 'ΓêÆ' + mission.retroHeight.toFixed(1) + ' m' },
          { label: 'vΓéÇ', value: 'ΓêÆ' + mission.descentSpeedAtRetro.toFixed(1) + ' m/s' },
          { label: 'v', value: '0.0 m/s' },
          { label: 'a', value: '+' + mission.retroAccel.toFixed(1) + ' m/s┬▓' },
          { label: 't', value: mission.retroBurnDuration.toFixed(2) + ' s' },
        ],
      };
    }

    function getBriefTargetChipText() {
      var mission = appState.mission;
      if (appState.briefStage === 1) return 'Target: solve burn height and burnout velocity';
      if (appState.briefStage === 2) return 'Target: solve coast height to reach apex';
      if (appState.briefStage === 3) return 'Target apex ' + mission.apexHeight.toFixed(1) + ' m';
      var challenge = getActiveChallenge();
      if (challenge) {
        if (challenge.type === 'landing') {
          return 'Challenge burn ' + challenge.burnTimeTarget.toFixed(2) + ' s ┬╖ retro ' + challenge.retroHeightTarget.toFixed(1) + ' m';
        }
        return 'Challenge apex ' + challenge.targetApex.toFixed(1) + ' m ┬▒ ' + challenge.apexTolerance.toFixed(1) + ' m';
      }
      return 'Planned retro start ' + mission.retroHeight.toFixed(1) + ' m';
    }

    function getActionButtonConfig() {
      var fv = appState.flightView;

      if (appState.levelDemoResult) {
        var result = appState.levelDemoResult;
        if (result.level === 3) {
          return {
            label: 'Continue to Investigation',
            action: function() { advanceToNextLevel(4); },
            disabled: false,
            className: 'btn round green',
          };
        }
        return {
          label: 'Continue',
          action: function() { advanceToNextLevel(result.level + 1); },
          disabled: false,
          className: 'btn round green',
        };
      }

      if (fv.isRunning) {
        if (appState.levelMode === 5) {
          return {
            label: fv.stage === 'powered' ? 'Verifying burn...' : 'Verifying apex...',
            action: null,
            disabled: true,
            className: 'btn round violet',
          };
        }

        if (appState.levelMode === 0) {
          if (appState.crashIgnitionActive) return { label: 'Misfire!', action: null, disabled: true, className: 'btn round red' };
          if (fv.stage === 'powered') return { label: 'Stop Burn', action: stopBurn, disabled: false, className: 'btn round red' };
          if (fv.stage === 'descent') return { label: 'Trigger Retro', action: triggerRetro, disabled: false, className: 'btn round green' };
          if (fv.stage === 'retro') return { label: 'Stop Retro', action: stopRetroBurn, disabled: false, className: 'btn round red' };
          return { label: 'Coasting...', action: null, disabled: true, className: 'btn round violet' };
        }

        return {
          label: fv.stage === 'powered' ? 'Burning...' : 'Coasting...',
          action: null,
          disabled: true,
          className: 'btn round ' + (fv.stage === 'powered' ? 'sky' : 'violet'),
        };
      }

      if (fv.hasStarted && !fv.isRunning) {
        return { label: 'Run Complete', action: null, disabled: true, className: 'btn round idle' };
      }

      if (appState.briefStage === 1) {
        return { label: appState.burnLocked ? 'Stage 1 Complete' : 'Solve Stage 1', action: null, disabled: true, className: 'btn round idle' };
      }
      if (appState.briefStage === 2) {
        return { label: appState.coastSubC.done ? 'Stage 2 Complete' : 'Solve Stage 2', action: null, disabled: true, className: 'btn round idle' };
      }
      if (appState.briefStage === 3) {
        return { label: 'Launch Apex Check', action: launchApexVerification, disabled: !appState.coastSubD.done, className: 'btn round green' };
      }
      var challenge = getActiveChallenge();
      return {
        label: challenge && challenge.type === 'landing' ? 'Start Landing Challenge' : 'Start Apex Challenge',
        action: launchInvestigation,
        disabled: false,
        className: 'btn round green',
      };
    }

    function createChallenge(type) {
      var mission = appState.mission;
      var burnTimeMin = Math.max(0.75, mission.burnTime * (type === 'landing' ? 0.58 : 0.45));
      var burnTimeMax = Math.max(burnTimeMin + 0.25, mission.burnTime * (type === 'landing' ? 0.92 : 0.9));
      var burnTimeTarget = Number((burnTimeMin + Math.random() * (burnTimeMax - burnTimeMin)).toFixed(2));
      var solved = solveMission(mission.burnAccel, burnTimeTarget);

      if (type === 'landing') {
        return {
          type: 'landing',
          title: 'Retro Landing Challenge',
          burnTimeTarget: burnTimeTarget,
          retroHeightTarget: Number(solved.retroHeight.toFixed(1)),
          retroBurnTarget: Number(solved.retroBurnDuration.toFixed(2)),
          landingLimit: mission.safeLandingSpeed,
          burnTolerance: 0.15,
          retroHeightTolerance: 6,
          retroBurnTolerance: 0.25,
          result: null,
        };
      }

      return {
        type: 'apex',
        title: 'Target Apex Challenge',
        targetApex: Number(solved.apexHeight.toFixed(1)),
        burnTimeTarget: burnTimeTarget,
        apexTolerance: 5,
        result: null,
      };
    }

    function getActiveChallenge() {
      if (!appState.mission) return null;
      if (!appState.challenge) {
        appState.challenge = createChallenge('apex');
      }
      return appState.challenge;
    }

    function setActiveChallenge(type) {
      if (appState.flightView.isRunning) return;
      stopLoop();
      el.dustCloud.classList.remove('active');
      resetRocketAttitudeState();
      appState.challenge = createChallenge(type);
      appState.simulation = { ...DEFAULT_SIMULATION_STATE };
      appState.flightView = { ...DEFAULT_FLIGHT_VIEW };
      appState.levelMode = 0;
      appState.levelDemoResult = null;
      appState.finishedMetrics = null;
      appState.briefStage = 4;
      render();
    }

    function evaluateActiveChallenge(finalStage, landingSpeed) {
      var challenge = getActiveChallenge();
      var sim = appState.simulation;
      if (!challenge || !sim) return null;

      if (challenge.type === 'apex') {
        var apexError = Math.abs(sim.maxHeightSeen - challenge.targetApex);
        var apexSuccess = apexError <= challenge.apexTolerance;
        return {
          success: apexSuccess,
          badge: apexSuccess ? 'Challenge cleared' : 'Challenge missed',
          message: '<b>' + (apexSuccess ? 'Challenge cleared.' : 'Target missed.') + '</b> Apex goal <span class="eq">' + challenge.targetApex.toFixed(1) + ' m</span>; actual <span class="eq">' + sim.maxHeightSeen.toFixed(1) + ' m</span>; error <span class="eq">' + apexError.toFixed(1) + ' m</span>. Ideal burn cutoff was about <span class="eq">' + challenge.burnTimeTarget.toFixed(2) + ' s</span>.',
        };
      }

      var burnTimeActual = sim.burnCutoffTime;
      var retroHeightActual = sim.retroStartHeight;
      var retroBurnActual = sim.retroBurnAccum;
      var burnOk = burnTimeActual != null && Math.abs(burnTimeActual - challenge.burnTimeTarget) <= challenge.burnTolerance;
      var retroHeightOk = retroHeightActual != null && Math.abs(retroHeightActual - challenge.retroHeightTarget) <= challenge.retroHeightTolerance;
      var retroBurnOk = retroBurnActual != null && Math.abs(retroBurnActual - challenge.retroBurnTarget) <= challenge.retroBurnTolerance;
      var landingOk = finalStage === 'landed' && landingSpeed <= challenge.landingLimit;
      var landingSuccess = burnOk && retroHeightOk && retroBurnOk && landingOk;
      var misses = [];

      if (!burnOk) {
        misses.push('burn cutoff ' + (burnTimeActual == null ? 'was never recorded' : 'was off by ' + Math.abs(burnTimeActual - challenge.burnTimeTarget).toFixed(2) + ' s'));
      }
      if (!retroHeightOk) {
        misses.push('retro ignition ' + (retroHeightActual == null ? 'never happened' : 'was off by ' + Math.abs(retroHeightActual - challenge.retroHeightTarget).toFixed(1) + ' m'));
      }
      if (!retroBurnOk) {
        misses.push('retro burn duration ' + (retroBurnActual == null ? 'never accumulated' : 'was off by ' + Math.abs(retroBurnActual - challenge.retroBurnTarget).toFixed(2) + ' s'));
      }
      if (!landingOk) {
        misses.push(finalStage !== 'landed' ? 'the rocket crashed' : 'landing speed was ' + landingSpeed.toFixed(2) + ' m/s');
      }

      return {
        success: landingSuccess,
        badge: landingSuccess ? 'Challenge cleared' : 'Challenge missed',
        message: '<b>' + (landingSuccess ? 'Challenge cleared.' : 'Landing challenge missed.') + '</b> Plan: burn <span class="eq">' + challenge.burnTimeTarget.toFixed(2) + ' s</span>, ignite retro near <span class="eq">' + challenge.retroHeightTarget.toFixed(1) + ' m</span>, hold for <span class="eq">' + challenge.retroBurnTarget.toFixed(2) + ' s</span>. ' +
          (landingSuccess ? 'You matched the retro window and landed within <span class="eq">' + challenge.landingLimit.toFixed(1) + ' m/s</span>.' : 'Misses: ' + misses.join('; ') + '.'),
      };
    }

    function stopLoop() {
      if (appState.rafId != null) cancelAnimationFrame(appState.rafId);
      appState.rafId = null;
      appState.lastFrameTime = null;
      appState.accumulator = 0;
    }

    function clearAttitudeThrusterPulse() {
      if (appState.attitudeThrusterPulseTimer != null) {
        clearTimeout(appState.attitudeThrusterPulseTimer);
        appState.attitudeThrusterPulseTimer = null;
      }
      appState.attitudeThrusterPulseMode = null;
    }

    function clearCrashIgnition() {
      if (appState.crashIgnitionTimer != null) {
        clearTimeout(appState.crashIgnitionTimer);
        appState.crashIgnitionTimer = null;
      }
      appState.crashIgnitionActive = false;
    }

    function resetRocketAttitudeState() {
      clearAttitudeThrusterPulse();
      clearCrashIgnition();
      appState.rocketSideways = false;
    }

    function triggerAttitudeThrusterPulse(mode) {
      clearAttitudeThrusterPulse();
      appState.attitudeThrusterPulseMode = mode;
      appState.attitudeThrusterPulseTimer = setTimeout(function() {
        appState.attitudeThrusterPulseTimer = null;
        appState.attitudeThrusterPulseMode = null;
        render();
      }, ATTITUDE_THRUSTER_PULSE_MS);
    }

    function triggerCrashIgnition() {
      const sim = appState.simulation;
      clearCrashIgnition();
      appState.crashIgnitionActive = true;
      sim.retroOn = true;
      sim.stage = 'retro';
      sim.retroLastOnTime = sim.time;
      syncFlightView();
      render();
      appState.crashIgnitionTimer = setTimeout(function() {
        appState.crashIgnitionTimer = null;
        appState.crashIgnitionActive = false;
        finishFlight('crashed', sim.v);
      }, CRASH_IGNITION_MS);
    }

    function toggleRocketAttitude() {
      if (!appState.flightView.isRunning || appState.levelMode !== 0) return;
      if (appState.crashIgnitionActive) return;
      if (appState.flightView.stage !== 'descent' && appState.flightView.stage !== 'retro') return;
      appState.rocketSideways = !appState.rocketSideways;
      triggerAttitudeThrusterPulse(appState.rocketSideways ? 'sideways' : 'upright');
      render();
    }

    function syncFlightView() {
      appState.flightView = buildFlightView(appState.simulation, appState.mission);
      appState.showInstrumentGrid = appState.flightView.hasStarted || appState.levelDemoResult !== null;
      appState.showFlightValues = appState.flightView.hasStarted || appState.briefStage >= 2;
    }

    function triggerFreezeFrame(type, sim) {
      if (!el.freezeAnnotation || !el.freezeTitle || !el.freezeSub) return;

      if (appState.freezeTimeoutId) {
        clearTimeout(appState.freezeTimeoutId);
      }

      var title = 'Flight Update';
      var subtitle = '';
      if (type === 'cutoff') {
        title = 'Burn Cutoff';
        subtitle = 't = ' + sim.time.toFixed(2) + ' s ┬╖ y = ' + sim.y.toFixed(1) + ' m ┬╖ v = ' + formatSigned(sim.v, 1) + ' m/s';
      } else if (type === 'apex') {
        title = 'Apex Reached';
        subtitle = 'Max height ' + sim.maxHeightSeen.toFixed(1) + ' m at t = ' + sim.time.toFixed(2) + ' s';
      } else if (type === 'retro') {
        title = 'Retro Ignition';
        subtitle = 'y = ' + sim.y.toFixed(1) + ' m ┬╖ v = ' + formatSigned(sim.v, 1) + ' m/s';
      } else if (type === 'landed') {
        title = 'Touchdown';
        subtitle = 'Landing speed ' + Math.abs(sim.v).toFixed(2) + ' m/s';
      } else if (type === 'crashed') {
        title = 'Vehicle Destroyed';
        subtitle = 'Retro burn fired while sideways at y = ' + sim.y.toFixed(1) + ' m';
      }

      appState.freezeType = type;
      el.freezeTitle.textContent = title;
      el.freezeSub.textContent = subtitle;
      el.freezeAnnotation.className = 'freeze-annotation ' + type;
      el.freezeAnnotation.classList.remove('hidden');

      appState.freezeTimeoutId = setTimeout(function() {
        el.freezeAnnotation.classList.add('hidden');
        appState.freezeType = null;
        appState.freezeTimeoutId = null;
      }, 1800);
    }

    function advanceSimulation(dt) {
      var sim = appState.simulation;
      var mission = appState.mission;
      if (!sim.running) return;
      if (sim.time >= MAX_SIM_TIME) {
        finishFlight('crashed', sim.v);
        return;
      }

      var a = getPhysicsAcceleration(sim, mission);
      var y0 = sim.y;
      var v0 = sim.v;
      var nextY = y0 + v0 * dt + 0.5 * a * dt * dt;
      var nextV = v0 + a * dt;
      var nextTime = sim.time + dt;

      if (nextY <= 0 && nextTime > 0.2) {
        var impactTime = solveImpactTime(y0, v0, a, dt);
        sim.time += impactTime;
        sim.y = 0;
        sim.v = v0 + a * impactTime;
        finishFlight(Math.abs(sim.v) <= LANDING_SPEED_LIMIT ? 'landed' : 'crashed', sim.v);
        return;
      }

      sim.time = nextTime;
      sim.y = nextY;
      sim.v = nextV;
      sim.maxHeightSeen = Math.max(sim.maxHeightSeen, sim.y);

      if (!sim.apexMarked && sim.v <= 0 && sim.time > 0.25) {
        sim.apexMarked = true;
        if (appState.levelMode === 0 || appState.levelMode === 5) {
          triggerFreezeFrame('apex', sim);
        }
      }

      if (appState.levelMode === 5 && sim.burnOn && sim.time >= appState.mission.burnTime) {
        sim.burnOn = false;
        sim.stage = 'coast';
        sim.burnCutoffTime = sim.time;
        sim.burnCutoffHeight = sim.y;
        sim.burnCutoffVelocity = sim.v;
        triggerFreezeFrame('cutoff', sim);
      }

      if (appState.levelMode === 5 && !sim.burnOn && sim.v <= 0 && sim.time > 0.5) {
        completeLevelDemo(3);
        return;
      }

      if (!sim.burnOn && !sim.retroOn) sim.stage = sim.v > 0 ? 'coast' : 'descent';
    }

    function loop(timestamp) {
      if (appState.lastFrameTime == null) {
        appState.lastFrameTime = timestamp;
        appState.rafId = requestAnimationFrame(loop);
        return;
      }

      var elapsed = (timestamp - appState.lastFrameTime) / 1000 / TIME_FACTOR;
      appState.lastFrameTime = timestamp;
      appState.accumulator = Math.min(appState.accumulator + elapsed, MAX_CATCHUP_TIME);

      var safetyCounter = 0;
      while (appState.accumulator >= FIXED_DT && appState.simulation.running) {
        advanceSimulation(FIXED_DT);
        appState.accumulator -= FIXED_DT;
        safetyCounter++;
        if (safetyCounter > 240) break;
      }

      if (appState.simulation.running) {
        syncFlightView();
        render();
        appState.rafId = requestAnimationFrame(loop);
      } else {
        stopLoop();
      }
    }

    function gradeBurnWalkthrough() {
      if (appState.burnLocked) return;

      var burnHeight = Number(el.subAInput.value);
      var burnoutVelocity = Number(el.subBInput.value);
      if (!Number.isFinite(burnHeight) || burnHeight <= 0 || !Number.isFinite(burnoutVelocity) || burnoutVelocity <= 0) {
        appState.burnSubC.feedback = {
          type: 'wrong',
          message: '<b>Enter both answers.</b> Provide a positive burn height in meters and a positive burnout velocity in m/s.'
        };
        render();
        return;
      }

      appState.burnSubC.attempts++;
      appState.burnSubA.input = el.subAInput.value;
      appState.burnSubB.input = el.subBInput.value;

      var correctHeight = appState.mission.burnoutHeight;
      var correctVelocity = appState.mission.burnoutVelocity;
      var heightOk = Math.abs(burnHeight - correctHeight) <= SUB_TOL_HEIGHT;
      var velocityOk = Math.abs(burnoutVelocity - correctVelocity) <= SUB_TOL_VEL;

      if (heightOk && velocityOk) {
        appState.burnLocked = true;
        appState.burnSubA.done = true;
        appState.burnSubB.done = true;
        appState.burnSubC.done = true;
        appState.burnSubA.input = correctHeight.toFixed(1);
        appState.burnSubB.input = correctVelocity.toFixed(1);
        appState.burnSubA.score = BURN_SUBA_POINTS;
        appState.burnSubB.score = BURN_SUBB_POINTS;
        appState.burnScore = BURN_SUBA_POINTS + BURN_SUBB_POINTS;
        appState.burnSubC.feedback = {
          type: 'correct',
          message: '<b>Stage 1 complete.</b> Burn height = ' + correctHeight.toFixed(1) + ' m and burnout velocity = ' + correctVelocity.toFixed(1) + ' m/s. Stage 2 is now unlocked.'
        };
        appState.briefStage = 2;
        reportScore();
      } else if (appState.burnSubC.attempts >= MAX_CALC_ATTEMPTS) {
        appState.burnSubA.done = true;
        appState.burnSubB.done = true;
        appState.burnSubC.done = true;
        appState.burnLocked = true;
        appState.burnSubA.input = correctHeight.toFixed(1);
        appState.burnSubB.input = correctVelocity.toFixed(1);
        if (el.subAInput) el.subAInput.value = correctHeight.toFixed(1);
        if (el.subBInput) el.subBInput.value = correctVelocity.toFixed(1);
        appState.burnSubC.feedback = {
          type: 'revealed',
          message: '<b>Stage 1 locked.</b> Burn height = <b>' + correctHeight.toFixed(1) + ' m</b> and burnout velocity = <b>' + correctVelocity.toFixed(1) + ' m/s</b>. Stage 2 is now unlocked.'
        };
        appState.briefStage = 2;
        reportScore();
      } else {
        var wrong = [];
        if (!heightOk) wrong.push('burn height');
        if (!velocityOk) wrong.push('burnout velocity');
        appState.burnSubC.feedback = {
          type: 'wrong',
          message: '<b>Not quite.</b> Recheck ' + wrong.join(' and ') + '. ' + (MAX_CALC_ATTEMPTS - appState.burnSubC.attempts) + ' attempt(s) left.'
        };
      }
      render();
    }

    function gradeCoastC() {
      if (appState.coastSubC.done) return;
      var val = Number(el.coastCInput.value);
      if (!Number.isFinite(val) || val <= 0) {
        appState.coastSubC.feedback = { type: 'wrong', message: '<b>Enter a positive number.</b> Coast height in meters.' };
        render(); return;
      }
      appState.coastSubC.attempts++;
      var correct = appState.mission.coastHeight;
      var err = Math.abs(val - correct);
      if (err <= SUB_TOL_HEIGHT) {
        appState.coastSubC.done = true;
        appState.coastSubC.input = correct.toFixed(1);
        appState.coastSubC.feedback = { type: 'correct', message: '<b>Stage 2 complete.</b> Coast height = ' + correct.toFixed(1) + ' m. The apex summary is now unlocked.' };
        appState.briefStage = 3;
      } else if (appState.coastSubC.attempts >= MAX_CALC_ATTEMPTS) {
        appState.coastSubC.done = true;
        appState.coastSubC.input = correct.toFixed(1);
        appState.coastSubC.feedback = { type: 'revealed', message: '<b>Stage 2 locked.</b> Coast height = <b>' + correct.toFixed(1) + ' m</b>. The apex summary is now unlocked.' };
        el.coastCInput.value = correct.toFixed(1);
        appState.briefStage = 3;
      } else {
        appState.coastSubC.feedback = { type: err <= SUB_TOL_HEIGHT * 3 ? 'close-miss' : 'wrong', message: '<b>' + (err <= SUB_TOL_HEIGHT * 3 ? 'Close.' : 'Not quite.') + '</b> ' + (MAX_CALC_ATTEMPTS - appState.coastSubC.attempts) + ' attempt(s) left.' };
      }
      render();
    }

    function gradeApexSummary() {
      if (appState.coastSubD.done) return;

      var val = Number(el.retroAInput.value);
      if (!Number.isFinite(val) || val <= 0) {
        appState.coastSubD.feedback = { type: 'wrong', message: '<b>Enter a positive number.</b> Predict the apex in meters.' };
        render();
        return;
      }

      appState.coastSubD.attempts++;
      appState.coastSubD.input = el.retroAInput.value;
      var correct = appState.mission.apexHeight;
      var err = Math.abs(val - correct);

      if (err <= SUB_TOL_HEIGHT) {
        appState.coastSubD.done = true;
        appState.coastSubD.input = correct.toFixed(1);
        appState.coastSubD.feedback = { type: 'correct', message: '<b>Apex prediction locked.</b> Launch the apex check with the main action button.' };
      } else if (appState.coastSubD.attempts >= MAX_CALC_ATTEMPTS) {
        appState.coastSubD.done = true;
        appState.coastSubD.input = correct.toFixed(1);
        appState.coastSubD.feedback = { type: 'revealed', message: '<b>Apex revealed.</b> The predicted apex is <b>' + correct.toFixed(1) + ' m</b>. Launch the apex check with the main action button.' };
        el.retroAInput.value = correct.toFixed(1);
      } else {
        appState.coastSubD.feedback = { type: err <= SUB_TOL_HEIGHT * 3 ? 'close-miss' : 'wrong', message: '<b>' + (err <= SUB_TOL_HEIGHT * 3 ? 'Close.' : 'Not quite.') + '</b> ' + (MAX_CALC_ATTEMPTS - appState.coastSubD.attempts) + ' attempt(s) left.' };
      }
      render();
    }

    /* ===== Level 4 Chart Grading ===== */
    function gradeLevel4Chart() {
      if (appState.l4Done) return;
      appState.l4Attempts++;

      var mission = appState.mission;
      var t1 = mission.burnTime;

      /* Correct values ΓÇö all 4 stages */
      var burnDy    = 0.5 * mission.burnAccel * t1 * t1;
      var burnV     = mission.burnAccel * t1;                        // burnout velocity
      var coastTime = burnV / Math.abs(GRAVITY);
      var coastDy   = (burnV * burnV) / (2 * Math.abs(GRAVITY));
      var apex      = burnDy + coastDy;
      var retroH    = apex / 3;                                      // retro ignition height
      var fallDist  = apex - retroH;                                 // distance of free-fall phase
      var fallV     = Math.sqrt(2 * Math.abs(GRAVITY) * fallDist);  // speed at retro ignition
      var fallTime  = fallV / Math.abs(GRAVITY);                    // time for free-fall phase
      // actual engine accel already stored as mission.retroAccel = RETRO_ACCEL
      var engineAccel = mission.retroAccel;                          // RETRO_ACCEL constant
      var retroTime   = fallV / (engineAccel + Math.abs(GRAVITY));  // time to stop from fallV
      var totalTime   = t1 + coastTime + fallTime + retroTime;

      /* Read student inputs */
      var vals = {
        burnV:      Number(el.l4BurnV      ? el.l4BurnV.value      : NaN),
        burnDy:     Number(el.l4BurnDy     ? el.l4BurnDy.value     : NaN),
        coastTime:  Number(el.l4CoastTime  ? el.l4CoastTime.value  : NaN),
        coastDy:    Number(el.l4CoastDy    ? el.l4CoastDy.value    : NaN),
        fallV:      Number(el.l4FallV      ? el.l4FallV.value      : NaN),
        fallTime:   Number(el.l4FallTime   ? el.l4FallTime.value   : NaN),
        retroAccel: Number(el.l4RetroAccel ? el.l4RetroAccel.value : NaN),
        retroTime:  Number(el.l4RetroTime  ? el.l4RetroTime.value  : NaN),
        totalTime:  Number(el.l4TotalTime  ? el.l4TotalTime.value  : NaN),
      };

      appState.l4Inputs.burnV = el.l4BurnV ? el.l4BurnV.value : '';
      appState.l4Inputs.burnDy = el.l4BurnDy ? el.l4BurnDy.value : '';
      appState.l4Inputs.coastTime = el.l4CoastTime ? el.l4CoastTime.value : '';
      appState.l4Inputs.coastDy = el.l4CoastDy ? el.l4CoastDy.value : '';
      appState.l4Inputs.fallV = el.l4FallV ? el.l4FallV.value : '';
      appState.l4Inputs.fallTime = el.l4FallTime ? el.l4FallTime.value : '';
      appState.l4Inputs.retroAccel = el.l4RetroAccel ? el.l4RetroAccel.value : '';
      appState.l4Inputs.retroTime = el.l4RetroTime ? el.l4RetroTime.value : '';
      appState.l4Inputs.totalTime = el.l4TotalTime ? el.l4TotalTime.value : '';

      var TOL_V = 0.5; // m/s tolerance for velocity cells
      var checks = [
        { key: 'burnV',      cor: burnV,      tol: TOL_V,           pts: 5,  label: 'Burn v' },
        { key: 'burnDy',     cor: burnDy,     tol: SUB_TOL_HEIGHT,  pts: 5,  label: 'Burn ╬öy' },
        { key: 'coastTime',  cor: coastTime,  tol: 0.15,            pts: 5,  label: 'Coast time' },
        { key: 'coastDy',    cor: coastDy,    tol: SUB_TOL_HEIGHT,  pts: 5,  label: 'Coast ╬öy' },
        { key: 'fallV',      cor: fallV,      tol: TOL_V,           pts: 5,  label: 'Fall v' },
        { key: 'fallTime',   cor: fallTime,   tol: 0.15,            pts: 5,  label: 'Fall time' },
        { key: 'retroAccel', cor: engineAccel, tol: 0.5,            pts: 5,  label: 'Retro accel' },
        { key: 'retroTime',  cor: retroTime,  tol: 0.15,            pts: 5,  label: 'Retro time' },
        { key: 'totalTime',  cor: totalTime,  tol: 0.3,             pts: 10, label: 'Total time' },
      ];

      var score = 0;
      var allCorrect = true;
      var wrongList = [];

      checks.forEach(function(c) {
        var v = vals[c.key];
        var err = Math.abs(v - c.cor);
        if (Number.isFinite(v) && err <= c.tol) {
          score += c.pts;
        } else {
          allCorrect = false;
          wrongList.push(c);
        }
      });

      if (allCorrect || appState.l4Attempts >= MAX_CALC_ATTEMPTS) {
        appState.l4Done = true;
        appState.l4Score = score;
        appState.landingScore = score;
        if (allCorrect) {
          appState.l4Feedback = { type: 'correct', message: '<b>All correct!</b> Total flight time = ' + totalTime.toFixed(2) + ' s. <b>+' + score + ' points</b>' };
        } else {
          var msg = '<b>Chart locked.</b> ';
          wrongList.forEach(function(c) { msg += c.label + ' = <b>' + c.cor.toFixed(2) + '</b>. '; });
          msg += '<b>' + score + ' points</b>';
          appState.l4Feedback = { type: 'revealed', message: msg };
          if (el.l4BurnV      && (!Number.isFinite(vals.burnV)      || Math.abs(vals.burnV - burnV)           > TOL_V))          el.l4BurnV.value      = burnV.toFixed(1);
          if (el.l4BurnDy     && (!Number.isFinite(vals.burnDy)     || Math.abs(vals.burnDy - burnDy)         > SUB_TOL_HEIGHT)) el.l4BurnDy.value     = burnDy.toFixed(1);
          if (el.l4CoastTime  && (!Number.isFinite(vals.coastTime)  || Math.abs(vals.coastTime - coastTime)   > 0.15))           el.l4CoastTime.value  = coastTime.toFixed(2);
          if (el.l4CoastDy    && (!Number.isFinite(vals.coastDy)    || Math.abs(vals.coastDy - coastDy)       > SUB_TOL_HEIGHT)) el.l4CoastDy.value    = coastDy.toFixed(1);
          if (el.l4FallV      && (!Number.isFinite(vals.fallV)      || Math.abs(vals.fallV - fallV)           > TOL_V))          el.l4FallV.value      = fallV.toFixed(1);
          if (el.l4FallTime   && (!Number.isFinite(vals.fallTime)   || Math.abs(vals.fallTime - fallTime)     > 0.15))           el.l4FallTime.value   = fallTime.toFixed(2);
          if (el.l4RetroAccel && (!Number.isFinite(vals.retroAccel) || Math.abs(vals.retroAccel - engineAccel) > 0.5))          el.l4RetroAccel.value = engineAccel.toFixed(1);
          if (el.l4RetroTime  && (!Number.isFinite(vals.retroTime)  || Math.abs(vals.retroTime - retroTime)   > 0.15))          el.l4RetroTime.value  = retroTime.toFixed(2);
          if (el.l4TotalTime  && (!Number.isFinite(vals.totalTime)  || Math.abs(vals.totalTime - totalTime)   > 0.3))           el.l4TotalTime.value  = totalTime.toFixed(2);
          appState.l4Inputs.burnV = el.l4BurnV ? el.l4BurnV.value : '';
          appState.l4Inputs.burnDy = el.l4BurnDy ? el.l4BurnDy.value : '';
          appState.l4Inputs.coastTime = el.l4CoastTime ? el.l4CoastTime.value : '';
          appState.l4Inputs.coastDy = el.l4CoastDy ? el.l4CoastDy.value : '';
          appState.l4Inputs.fallV = el.l4FallV ? el.l4FallV.value : '';
          appState.l4Inputs.fallTime = el.l4FallTime ? el.l4FallTime.value : '';
          appState.l4Inputs.retroAccel = el.l4RetroAccel ? el.l4RetroAccel.value : '';
          appState.l4Inputs.retroTime = el.l4RetroTime ? el.l4RetroTime.value : '';
          appState.l4Inputs.totalTime = el.l4TotalTime ? el.l4TotalTime.value : '';
        }
        reportScore();
      } else {
        appState.l4Feedback = {
          type: 'wrong',
          message: '<b>Not quite.</b> ' + wrongList.length + ' cell(s) incorrect: ' + wrongList.map(function(c) { return c.label; }).join(', ') + '. ' + (MAX_CALC_ATTEMPTS - appState.l4Attempts) + ' attempt(s) left.',
        };
      }
      render();
    }

    function scoreLanding(landingSpeed) {
      if (landingSpeed <= 1) return LANDING_POINTS;
      if (landingSpeed <= LANDING_SPEED_LIMIT) return Math.round(LANDING_POINTS * 0.7);
      return 0;
    }

    function getTotalScore() {
      return appState.burnScore + appState.retroScore + appState.landingScore;
    }

    function updateEquationStrip() {
      if (!el.eqLabel || !el.eqBody) return;

      var stage = appState.flightView.stage;
      var mission = appState.mission;
      if (stage === 'powered') {
        el.eqLabel.textContent = 'Burn Phase';
        el.eqBody.innerHTML = 'Use <span class="eq">╬öy = 1/2at┬▓</span> and <span class="eq">v = at</span> with <span class="eq">a = ' + mission.burnAccel.toFixed(1) + ' m/s┬▓</span>.';
        return;
      }
      if (stage === 'coast') {
        el.eqLabel.textContent = 'Coast Phase';
        el.eqBody.innerHTML = 'Use <span class="eq">v┬▓ = v0┬▓ + 2a╬öy</span> with <span class="eq">a = -10 m/s┬▓</span> to solve the climb to apex.';
        return;
      }
      if (stage === 'descent' || stage === 'retro') {
        el.eqLabel.textContent = stage === 'retro' ? 'Retro Burn' : 'Descent';
        el.eqBody.innerHTML = stage === 'retro'
          ? 'Retro is active. Compare your measured burn duration against the planned <span class="eq">' + mission.retroBurnDuration.toFixed(2) + ' s</span>.'
          : 'The rocket is descending under gravity. Fire retro when you want to test a landing approach.';
        return;
      }
      if (appState.briefStage === 1) {
        el.eqLabel.textContent = 'Ready';
        el.eqBody.innerHTML = 'Solve Stage 1, then move to the coast walkthrough.';
      } else if (appState.briefStage === 2) {
        el.eqLabel.textContent = 'Coast Walkthrough';
        el.eqBody.innerHTML = 'Use the burnout velocity from Stage 1 and solve the additional coast height.';
      } else if (appState.briefStage === 3) {
        el.eqLabel.textContent = 'Apex Verification';
        el.eqBody.innerHTML = 'Add <span class="eq">╬öy1 + ╬öy2</span>, predict the apex, then launch the verification run.';
      } else {
        el.eqLabel.textContent = 'Investigation';
        el.eqBody.innerHTML = 'Run your own trials and use the recorded flight data to compare planned and measured results.';
      }
    }

    function updateVectorArrows() {
      var velocityArrow = el.vecVelocity;
      var accelArrow = el.vecAccel;
      if (!velocityArrow || !accelArrow) return;

      var velocity = appState.flightView.velocity;
      var acceleration = appState.flightView.acceleration;
      var showVectors = appState.flightView.hasStarted;

      velocityArrow.classList.toggle('hidden', !showVectors);
      accelArrow.classList.toggle('hidden', !showVectors);
      if (!showVectors) return;

      var velocityMagnitude = Math.min(90, 20 + Math.abs(velocity) * 1.3);
      var accelMagnitude = Math.min(90, 20 + Math.abs(acceleration) * 3.5);

      velocityArrow.style.height = velocityMagnitude.toFixed(0) + 'px';
      accelArrow.style.height = accelMagnitude.toFixed(0) + 'px';
      velocityArrow.style.transform = velocity >= 0 ? 'translateX(-50%) rotate(0deg)' : 'translateX(-50%) rotate(180deg)';
      accelArrow.style.transform = acceleration >= 0 ? 'translateX(-50%) rotate(0deg)' : 'translateX(-50%) rotate(180deg)';
      velocityArrow.style.opacity = Math.abs(velocity) < 0.1 ? '0.35' : '';
      accelArrow.style.opacity = Math.abs(acceleration) < 0.1 ? '0.35' : '';
    }

    /* ===== SCORM ===== */
    function reportScore() {
      const total = Math.max(getTotalScore(), appState.bestScore);
      appState.bestScore = total;
      if (typeof SCORM !== 'undefined') {
        SCORM.setScore(total, 0, 100);
        SCORM.setStatus(total >= PASS_THRESHOLD ? 'passed' : 'failed');
        SCORM.commit();
      }
      saveSuspendData();
    }

    function saveSuspendData() {
      if (typeof SCORM === 'undefined') return;
      const data = {
        v: 2,
        th: appState.mission.targetHeight,
        bl: appState.burnLocked ? 1 : 0,
        bs: appState.burnScore,
        rs: appState.retroScore,
        ls: appState.landingScore,
        ra: appState.retroAttempts,
        best: appState.bestScore,
        stg: appState.briefStage,
        bA: appState.burnSubA,
        bB: appState.burnSubB,
        bC: appState.burnSubC,
        cC: appState.coastSubC,
        cD: appState.coastSubD,
        /* Level 4 chart */
        l4D: appState.l4Done ? 1 : 0,
        l4S: appState.l4Score,
        l4At: appState.l4Attempts,
      };
      SCORM.setValue('cmi.suspend_data', JSON.stringify(data));
      SCORM.commit();
    }

    function loadSuspendData() {
      if (typeof SCORM === 'undefined') return false;
      const raw = SCORM.getValue('cmi.suspend_data');
      if (!raw) return false;
      try {
        const data = JSON.parse(raw);
        if (!data || !data.th) return false;

        appState.mission = createMission(data.th);
        appState.burnLocked = !!data.bl;
        appState.burnScore = data.bs || 0;
        appState.retroScore = data.rs || 0;
        appState.landingScore = data.ls || 0;
        appState.retroAttempts = data.ra || 0;
        appState.bestScore = data.best || 0;
        appState.briefStage = data.stg || 1;

        if (data.bA) appState.burnSubA = Object.assign({ done: false, score: 0, attempts: 0, feedback: null, input: '' }, data.bA);
        if (data.bB) appState.burnSubB = Object.assign({ done: false, score: 0, attempts: 0, feedback: null, input: '' }, data.bB);
        if (data.bC) appState.burnSubC = Object.assign({ done: false, score: 0, attempts: 0, feedback: null, input: '' }, data.bC);
        if (data.cC) appState.coastSubC = Object.assign({ done: false, attempts: 0, feedback: null, input: '' }, data.cC);
        if (data.cD) appState.coastSubD = Object.assign({ done: false, attempts: 0, feedback: null, input: '' }, data.cD);

        /* Restore Level 4 chart */
        if (data.l4D) { appState.l4Done = true; appState.l4Score = data.l4S || 0; appState.l4Attempts = data.l4At || 0; appState.landingScore = appState.l4Score; }

        if (el.subAInput) el.subAInput.value = appState.burnSubA.input || '';
        if (el.subBInput) el.subBInput.value = appState.burnSubB.input || '';
        if (el.coastCInput) el.coastCInput.value = appState.coastSubC.input || '';
        if (el.retroAInput) el.retroAInput.value = appState.coastSubD.input || '';
        return true;
      } catch (e) {
        return false;
      }
    }

    /* ===== Walkthrough ===== */
    function openWalkthrough() {
      appState.walkStep = 0;
      el.walkthroughOverlay.classList.remove('hidden');
      renderWalkthrough();
    }

    function closeWalkthrough() {
      el.walkthroughOverlay.classList.add('hidden');
    }

    function renderWalkthrough() {
      const step = WALKTHROUGH_STEPS[appState.walkStep];
      const total = WALKTHROUGH_STEPS.length;
      el.walkStepLabel.textContent = 'Step ' + (appState.walkStep + 1) + ' of ' + total;
      el.walkTitle.textContent = step.title;
      el.walkTitle.style.color = 'var(--' + step.color + ')';
      el.walkBody.innerHTML = step.body;
      el.walkPrevBtn.disabled = appState.walkStep === 0;
      el.walkNextBtn.textContent = appState.walkStep === total - 1 ? 'Start Lab' : 'Next';

      let dotsHtml = '';
      for (let i = 0; i < total; i++) {
        dotsHtml += '<div class="walk-dot' + (i === appState.walkStep ? ' active' : '') + '"></div>';
      }
      el.walkDots.innerHTML = dotsHtml;
    }

    /* ===== Flight Actions ===== */
    function launchApexVerification() {
      if (!appState.coastSubD.done) return;
      stopLoop();
      el.dustCloud.classList.remove('active', 'crash');
      appState.levelDemoResult = null;
      appState.levelMode = 5;
      appState.simulation = {
        time: 0, y: 0, v: 0, stage: 'powered',
        running: true, burnOn: true, retroOn: false,
        apexMarked: false, maxHeightSeen: 0,
        burnCutoffTime: null, retroStartHeight: null, burnCutoffHeight: null,
        burnCutoffVelocity: null, retroStartTime: null, retroStartVelocity: null,
        retroBurnAccum: 0, retroLastOnTime: null,
      };
      appState.finishedMetrics = null;
      syncFlightView();
      render();
      appState.rafId = requestAnimationFrame(loop);
    }

    function launchInvestigation() {
      stopLoop();
      el.dustCloud.classList.remove('active', 'crash');
      appState.levelDemoResult = null;
      appState.finishedMetrics = null;
      if (appState.challenge) appState.challenge.result = null;
      appState.levelMode = 0;
      appState.briefStage = 4;
      appState.simulation = {
        time: 0, y: 0, v: 0, stage: 'powered',
        running: true, burnOn: true, retroOn: false,
        apexMarked: false, maxHeightSeen: 0,
        burnCutoffTime: null, retroStartHeight: null, burnCutoffHeight: null,
        burnCutoffVelocity: null, retroStartTime: null, retroStartVelocity: null,
        retroBurnAccum: 0, retroLastOnTime: null,
      };
      syncFlightView();
      render();
      appState.rafId = requestAnimationFrame(loop);
    }

    function completeLevelDemo(level) {
      var sim = appState.simulation;
      sim.running = false;
      syncFlightView();
      stopLoop();
      appState.levelDemoResult = {
        level: level,
        success: true,
        maxHeight: sim.maxHeightSeen,
        burnCutoffHeight: sim.burnCutoffHeight,
        burnCutoffVelocity: sim.burnCutoffVelocity,
      };
      render();
    }

    function advanceToNextLevel(nextLevel) {
      el.dustCloud.classList.remove('active', 'crash');
      resetRocketAttitudeState();
      appState.simulation = { ...DEFAULT_SIMULATION_STATE };
      appState.flightView = { ...DEFAULT_FLIGHT_VIEW };
      appState.levelMode = 0;
      appState.levelDemoResult = null;
      appState.finishedMetrics = null;
      appState.briefStage = nextLevel;
      saveSuspendData();
      render();
    }

    function stopBurn() {
      const sim = appState.simulation;
      if (!sim.running || sim.stage !== 'powered') return;
      sim.burnOn = false;
      sim.stage = 'coast';
      sim.burnCutoffTime = sim.time;
      sim.burnCutoffHeight = sim.y;
      sim.burnCutoffVelocity = sim.v;
      triggerFreezeFrame('cutoff', sim);
      syncFlightView();
      render();
    }

    function triggerRetro() {
      const sim = appState.simulation;
      if (!sim.running || sim.stage !== 'descent' || appState.crashIgnitionActive) return;
      if (sim.retroStartHeight === null) {
        sim.retroStartHeight = sim.y;
        sim.retroStartTime = sim.time;
        sim.retroStartVelocity = sim.v;
      }
      if (appState.rocketSideways) {
        triggerCrashIgnition();
        return;
      }
      sim.retroOn = true;
      sim.stage = 'retro';
      sim.retroLastOnTime = sim.time;
      triggerFreezeFrame('retro', sim);
      syncFlightView();
      render();
    }

    function stopRetroBurn() {
      const sim = appState.simulation;
      if (!sim.running || sim.stage !== 'retro' || appState.crashIgnitionActive) return;
      sim.retroBurnAccum += sim.time - (sim.retroLastOnTime || sim.time);
      sim.retroLastOnTime = null;
      sim.retroOn = false;
      sim.stage = sim.v > 0 ? 'coast' : 'descent';
      syncFlightView();
      render();
    }

    function finishFlight(finalStage, landingVelocity) {
      const sim = appState.simulation;
      if (sim.retroOn && sim.retroLastOnTime != null) {
        sim.retroBurnAccum += sim.time - sim.retroLastOnTime;
        sim.retroLastOnTime = null;
      }
      clearCrashIgnition();
      sim.running = false;
      sim.burnOn = false;
      sim.retroOn = false;
      sim.stage = finalStage;
      sim.y = 0;

      const landingSpeed = Math.abs(landingVelocity);

      if (finalStage === 'landed') {
        triggerFreezeFrame('landed', sim);
      } else if (finalStage === 'crashed') {
        triggerFreezeFrame('crashed', sim);
      }

      const summary = finalStage === 'landed' && landingSpeed <= LANDING_SPEED_LIMIT
        ? (landingSpeed <= 1 ? 'Perfect landing' : 'Safe landing')
        : 'Vehicle destroyed';
      var challengeResult = appState.briefStage === 4 ? evaluateActiveChallenge(finalStage, landingSpeed) : null;
      if (appState.challenge) {
        appState.challenge.result = challengeResult;
      }

      appState.landingScore = finalStage === 'landed' ? scoreLanding(landingSpeed) : 0;
      const total = getTotalScore();

      appState.finishedMetrics = {
        burnScore: appState.burnScore,
        enteredRetro: appState.mission.retroAccel,
        retroScore: appState.retroScore,
        landingSpeed: landingSpeed,
        landingScore: appState.landingScore,
        missionResult: summary,
        totalScore: total,
        actualBurnTime: sim.burnCutoffTime,
        actualBurnHeight: sim.burnCutoffHeight,
        actualBurnVelocity: sim.burnCutoffVelocity,
        actualRetroTime: sim.retroStartTime,
        actualRetroHeight: sim.retroStartHeight,
        actualRetroVelocity: sim.retroStartVelocity,
        actualMaxHeight: sim.maxHeightSeen,
        actualLandingVelocity: landingVelocity,
        actualTotalTime: sim.time,
        actualTotalRetroBurn: sim.retroBurnAccum,
        challengeResult: challengeResult,
      };

      appState.flightView = {
        time: sim.time, height: 0, velocity: landingVelocity,
        acceleration: 0, stage: finalStage, isRunning: false,
        hasStarted: true, maxHeightSeen: sim.maxHeightSeen,
      };

      if (finalStage === 'landed') {
        el.dustCloud.classList.remove('crash');
        el.dustCloud.classList.add('active');
      } else if (finalStage === 'crashed') {
        el.dustCloud.classList.add('crash');
        el.dustCloud.classList.add('active');
      }

      stopLoop();
      reportScore();
      render();
    }

    function retryFlight() {
      if (!appState.l4Done) return;
      stopLoop();
      el.dustCloud.classList.remove('active', 'crash');
      resetRocketAttitudeState();
      appState.simulation = { ...DEFAULT_SIMULATION_STATE };
      appState.flightView = { ...DEFAULT_FLIGHT_VIEW };
      appState.finishedMetrics = null;
      appState.levelMode = 0;
      appState.levelDemoResult = null;
      appState.briefStage = 4;
      render();
    }

    function resetMission(targetHeight) {
      stopLoop();
      el.dustCloud.classList.remove('active');
      resetRocketAttitudeState();
      appState.mission = createMission(targetHeight);
      appState.briefStage = 1;
      appState.showCoach = false;
      appState.burnLocked = false;
      appState.challenge = null;
      appState.flightView = { ...DEFAULT_FLIGHT_VIEW };
      appState.finishedMetrics = null;
      appState.simulation = { ...DEFAULT_SIMULATION_STATE };
      appState.burnScore = 0;
      appState.retroScore = 0;
      appState.landingScore = 0;
      appState.retroAttempts = 0;
      appState.levelMode = 0;
      appState.levelDemoResult = null;

      appState.burnSubA = { done: false, score: 0, attempts: 0, feedback: null, input: '' };
      appState.burnSubB = { done: false, score: 0, attempts: 0, feedback: null, input: '' };
      appState.burnSubC = { done: false, score: 0, attempts: 0, feedback: null, input: '' };
      appState.coastSubC = { done: false, attempts: 0, feedback: null, input: '' };
      appState.coastSubD = { done: false, attempts: 0, feedback: null, input: '' };

      /* Reset Level 4 chart state */
      appState.l4Done = false;
      appState.l4Score = 0;
      appState.l4Attempts = 0;
      appState.l4Feedback = null;
      appState.l4Inputs = {
        burnV: '',
        burnDy: '',
        coastTime: '',
        coastDy: '',
        fallV: '',
        fallTime: '',
        retroAccel: '',
        retroTime: '',
        totalTime: '',
      };

      if (el.subAInput) el.subAInput.value = '';
      if (el.subBInput) el.subBInput.value = '';
      if (el.coastCInput) el.coastCInput.value = '';
      if (el.retroAInput) el.retroAInput.value = '';
      if (el.l4BurnV)      el.l4BurnV.value      = '';
      if (el.l4BurnDy)     el.l4BurnDy.value     = '';
      if (el.l4CoastTime)  el.l4CoastTime.value  = '';
      if (el.l4CoastDy)    el.l4CoastDy.value    = '';
      if (el.l4FallV)      el.l4FallV.value      = '';
      if (el.l4FallTime)   el.l4FallTime.value   = '';
      if (el.l4RetroAccel) el.l4RetroAccel.value = '';
      if (el.l4RetroTime)  el.l4RetroTime.value  = '';
      if (el.l4TotalTime)  el.l4TotalTime.value  = '';

      saveSuspendData();
      render();
    }

    /* ===== Render ===== */
    function renderFeedback(elm, fb) {
      if (fb) {
        elm.classList.remove('hidden');
        elm.className = 'feedback-msg ' + fb.type;
        elm.innerHTML = fb.message;
      } else {
        elm.classList.add('hidden');
      }
    }

    function renderStepTracker(trackerEl, currentStep, doneSteps) {
      if (!trackerEl) return;
      Array.from(trackerEl.children).forEach(function(pill) {
        var step = pill.dataset.step;
        pill.classList.remove('active', 'done');
        if (doneSteps.indexOf(step) !== -1) {
          pill.classList.add('done');
        } else if (step === currentStep) {
          pill.classList.add('active');
        }
      });
    }

    function getStepHint() {
      var m = appState.mission;
      var a = m.burnAccel;
      var t = m.burnTime;
      var level = appState.briefStage;
      if (level === 1) {
        return 'Use the same burn givens twice.<br>' +
          'Known: <span class="eq">v0 = 0</span>, <span class="eq">a = ' + a + ' m/s\u00B2</span>, <span class="eq">t = ' + t + ' s</span>.<br>' +
          'Solve <span class="eq">dy1 = 1/2at^2</span> for burn height and <span class="eq">v1 = at</span> for burnout velocity.';
      }
      if (level === 2) {
        return 'Stage 2 is coast only.<br>' +
          'Known: <span class="eq">v0 = ' + m.burnoutVelocity.toFixed(1) + ' m/s</span>, <span class="eq">v = 0</span>, <span class="eq">a = -10 m/s^2</span>.<br>' +
          'Use <span class="eq">v^2 = v0^2 + 2ady</span> to solve for the extra coast height <span class="eq">dy2</span>.';
      }
      if (level === 3) {
        return 'Add the two ascent displacements.<br>' +
          'Use <span class="eq">y_apex = dy1 + dy2</span>, then launch the apex check and compare your prediction with the measured max height.';
      }
      if (level === 4) {
        var challenge = getActiveChallenge();
        if (challenge && challenge.type === 'landing') {
          return 'Landing challenge loaded.<br>' +
            'Try a burn cutoff near <span class="eq">' + challenge.burnTimeTarget.toFixed(2) + ' s</span>, trigger retro near <span class="eq">' + challenge.retroHeightTarget.toFixed(1) + ' m</span>, and hold it for about <span class="eq">' + challenge.retroBurnTarget.toFixed(2) + ' s</span>.';
        }
        return 'Apex challenge loaded.<br>' +
          'Use the live controls to stop the burn at the right moment and peak at <span class="eq">' + challenge.targetApex.toFixed(1) + ' m</span> within <span class="eq">┬▒' + challenge.apexTolerance.toFixed(1) + ' m</span>.';
      }
      return '';
    }

    const QUESTION_INPUTS = {
      burnHeight: {
        id: 'sub-a-input',
        unit: 'm',
        placeholder: 'Enter burn height in m',
        getValue: function() { return appState.burnSubA.input; },
        setValue: function(value) { appState.burnSubA.input = value; },
      },
      burnoutVelocity: {
        id: 'sub-b-input',
        unit: 'm/s',
        placeholder: 'Enter burnout velocity in m/s',
        getValue: function() { return appState.burnSubB.input; },
        setValue: function(value) { appState.burnSubB.input = value; },
      },
      coastHeight: {
        id: 'coast-c-input',
        unit: 'm',
        placeholder: 'Enter coast height in m',
        getValue: function() { return appState.coastSubC.input; },
        setValue: function(value) { appState.coastSubC.input = value; },
      },
      apexHeight: {
        id: 'retro-a-input',
        unit: 'm',
        placeholder: 'Enter apex height in m',
        getValue: function() { return appState.coastSubD.input; },
        setValue: function(value) { appState.coastSubD.input = value; },
      },
      l4BurnV: {
        id: 'l4-burn-v',
        unit: '',
        placeholder: '?',
        className: 'input chart-input',
        getValue: function() { return appState.l4Inputs.burnV; },
        setValue: function(value) { appState.l4Inputs.burnV = value; },
      },
      l4BurnDy: {
        id: 'l4-burn-dy',
        unit: '',
        placeholder: '?',
        className: 'input chart-input',
        getValue: function() { return appState.l4Inputs.burnDy; },
        setValue: function(value) { appState.l4Inputs.burnDy = value; },
      },
      l4CoastTime: {
        id: 'l4-coast-time',
        unit: '',
        placeholder: '?',
        className: 'input chart-input',
        getValue: function() { return appState.l4Inputs.coastTime; },
        setValue: function(value) { appState.l4Inputs.coastTime = value; },
      },
      l4CoastDy: {
        id: 'l4-coast-dy',
        unit: '',
        placeholder: '?',
        className: 'input chart-input',
        getValue: function() { return appState.l4Inputs.coastDy; },
        setValue: function(value) { appState.l4Inputs.coastDy = value; },
      },
      l4FallV: {
        id: 'l4-fall-v',
        unit: '',
        placeholder: '?',
        className: 'input chart-input',
        getValue: function() { return appState.l4Inputs.fallV; },
        setValue: function(value) { appState.l4Inputs.fallV = value; },
      },
      l4FallTime: {
        id: 'l4-fall-time',
        unit: '',
        placeholder: '?',
        className: 'input chart-input',
        getValue: function() { return appState.l4Inputs.fallTime; },
        setValue: function(value) { appState.l4Inputs.fallTime = value; },
      },
      l4RetroAccel: {
        id: 'l4-retro-accel',
        unit: '',
        placeholder: '?',
        className: 'input chart-input',
        getValue: function() { return appState.l4Inputs.retroAccel; },
        setValue: function(value) { appState.l4Inputs.retroAccel = value; },
      },
      l4RetroTime: {
        id: 'l4-retro-time',
        unit: '',
        placeholder: '?',
        className: 'input chart-input',
        getValue: function() { return appState.l4Inputs.retroTime; },
        setValue: function(value) { appState.l4Inputs.retroTime = value; },
      },
      l4TotalTime: {
        id: 'l4-total-time',
        unit: '',
        placeholder: '?',
        className: 'input chart-input',
        getValue: function() { return appState.l4Inputs.totalTime; },
        setValue: function(value) { appState.l4Inputs.totalTime = value; },
      },
    };

    const QUESTION_INPUTS_BY_ID = Object.keys(QUESTION_INPUTS).reduce(function(map, key) {
      var inputDef = QUESTION_INPUTS[key];
      map[inputDef.id] = inputDef;
      return map;
    }, {});

    const QUESTION_BUTTONS = {
      checkStage1: { id: 'sub-a-btn', label: 'Check Stage 1' },
      checkCoast: { id: 'coast-c-btn', label: 'Check' },
      checkApex: { id: 'retro-a-btn', label: 'Check Apex' },
      checkAll: { id: 'l4-check-btn', label: 'Check All' },
    };

    const QUESTION_LISTS = {
      investigationResults: [
        'How high did the rocket go?',
        'What was the burnout height?',
        'What was the burnout velocity?',
        'At what height did retro begin?',
        'What was the landing velocity?',
        'Was the landing safe?',
      ],
    };

    const QUESTION_TABLES = {
      stage4Chart: {
        className: 'flight-chart',
        columns: ['Stage', 'v0 (m/s)', 'v (m/s)', 'a (m/s&sup2;)', 't (s)', '&Delta;y (m)'],
        rows: [
          {
            className: '',
            cells: [
              { type: 'html', className: 'stage-label sky-text', value: '1. Burn (powered ascent)' },
              { type: 'text', className: 'given-cell', value: '0' },
              { type: 'input', input: 'l4BurnV' },
              { type: 'html', className: 'given-cell', value: '<span id="l4-burn-accel">+20</span>' },
              { type: 'html', className: 'given-cell', value: '<span id="l4-burn-time">--</span>' },
              { type: 'input', input: 'l4BurnDy' },
            ],
          },
          {
            className: '',
            cells: [
              { type: 'html', className: 'stage-label violet-text', value: '2. Coast (engine off to apex)' },
              { type: 'text', className: 'given-cell', id: 'l4-coast-v0-cell', value: '?' },
              { type: 'text', className: 'given-cell', value: '0' },
              { type: 'text', className: 'given-cell', value: '-10' },
              { type: 'input', input: 'l4CoastTime' },
              { type: 'input', input: 'l4CoastDy' },
            ],
          },
          {
            className: '',
            cells: [
              { type: 'html', className: 'stage-label red-text', value: '3. Free Fall (apex to retro height)' },
              { type: 'text', className: 'given-cell', value: '0' },
              { type: 'input', input: 'l4FallV' },
              { type: 'text', className: 'given-cell', value: '-10' },
              { type: 'input', input: 'l4FallTime' },
              { type: 'text', className: 'given-cell', id: 'l4-fall-dy-cell', value: '?' },
            ],
          },
          {
            className: '',
            cells: [
              { type: 'html', className: 'stage-label emerald-text', value: '4. Retro burn (retro height to 0)' },
              { type: 'text', className: 'given-cell', id: 'l4-retro-v0-cell', value: '?' },
              { type: 'text', className: 'given-cell', value: '0' },
              { type: 'input', input: 'l4RetroAccel' },
              { type: 'input', input: 'l4RetroTime' },
              { type: 'text', className: 'given-cell', id: 'l4-retro-dy-cell', value: '?' },
            ],
          },
          {
            className: 'total-row',
            cells: [
              { type: 'html', className: 'stage-label', value: '<b>Total Flight</b>' },
              { type: 'empty' },
              { type: 'empty' },
              { type: 'empty' },
              { type: 'input', input: 'l4TotalTime' },
              { type: 'empty' },
            ],
          },
        ],
      },
    };

    const QUESTION_SECTIONS = {
      stage1Burn: {
        type: 'calc-card',
        id: 'substep-a',
        header: 'Stage 1 &mdash; Burn Phase',
        prompt: function(mission) {
          return 'Known: <b>v0 = 0</b>, <b>a = <span id="given-burn-accel-1a">+' + mission.burnAccel + ' m/s&sup2;</span></b>, <b>t = <span id="given-burn-time-1a">' + mission.burnTime + ' s</span></b>.<br>' +
            'Find both <b>&Delta;y1 = 1/2 at&sup2;</b> and <b>v1 = at</b> from the same burn-phase givens.';
        },
        rows: [
          { type: 'input-row', input: 'burnHeight' },
          { type: 'input-row', input: 'burnoutVelocity' },
          { type: 'button-row', button: 'checkStage1' },
        ],
        feedbackId: 'sub-c-feedback',
      },
      stage2Coast: {
        type: 'calc-card',
        id: 'coast-c',
        header: 'Stage 2 &mdash; Coast Phase',
        prompt: 'Known: <b>v0 = <span id="coast-burnout-v">0 m/s</span></b>, <b>v = 0</b>, <b>a = -10 m/s&sup2;</b>.<br>Find the coast displacement <b>&Delta;y2</b> from burnout to apex.',
        rows: [
          { type: 'input-row', input: 'coastHeight', button: 'checkCoast' },
        ],
        feedbackId: 'coast-c-feedback',
      },
      stage3Apex: {
        type: 'calc-card',
        id: 'retro-a-card',
        header: 'Predict The Apex',
        prompt: 'Known: <b>&Delta;y1 = <span id="retro-apex-a">--</span></b>, <b>&Delta;y2 = <span id="retro-trial-h">--</span></b>.<br>Find <b>y_apex = &Delta;y1 + &Delta;y2</b>, then launch to compare your prediction with the measured apex.',
        rows: [
          { type: 'input-row', input: 'apexHeight', button: 'checkApex' },
        ],
        feedbackId: 'retro-a-feedback',
      },
      stage4Challenge: {
        type: 'custom',
        render: function() { return renderChallengeSection(); },
      },
      stage4Intro: {
        type: 'info-card',
        header: 'Test It Yourself',
        prompt: 'Launch the rocket.<br>Choose when to stop the burn.<br>Choose when to trigger retro burn.<br>Watch what happens.<br>Use the results to answer the questions.',
      },
      stage4Questions: {
        type: 'list-block',
        className: 'coach-block',
        style: 'margin-bottom:14px; margin-top:16px;',
        intro: 'After each trial, use the recorded flight data below to answer:',
        list: 'investigationResults',
      },
      stage4Chart: {
        type: 'table-block',
        table: 'stage4Chart',
        style: 'display:none;',
        button: 'checkAll',
        buttonRowStyle: 'margin-top:12px;',
        feedbackId: 'l4-feedback',
      },
    };

    const MASTER_QUESTION_LIST = {
      1: {
        tone: 'sky',
        title: 'Stage 1 Walkthrough &mdash; Burn Phase',
        prompt: 'Use the same givens to solve both burn height and burnout velocity before moving to the coast phase.',
        steps: [{ step: 'a', label: 'A + B &middot; Burn Phase', trackerId: 'burn-tracker' }],
        sections: ['stage1Burn'],
      },
      2: {
        tone: 'violet',
        title: 'Stage 2 Walkthrough &mdash; Coast Phase',
        prompt: 'Now the engine is off. Use the burnout velocity from Stage 1 with gravity alone to calculate the extra height to the apex.',
        steps: [{ step: 'c', label: 'C &middot; Coast Phase', trackerId: 'coast-tracker' }],
        sections: ['stage2Coast'],
      },
      3: {
        tone: 'red',
        title: 'Stage 2/3 Transition &mdash; Apex Summary',
        prompt: 'Combine your Stage 1 and Stage 2 displacements to predict the apex, then use the main action button to launch and verify the result.',
        steps: [{ step: 'a', label: 'C + D &middot; Apex Summary', trackerId: 'retro-tracker' }],
        sections: ['stage3Apex'],
      },
      4: {
        tone: 'emerald',
        title: 'Stage 4 &mdash; Investigation Mode',
        prompt: 'Choose a challenge, then use the main action button to launch. Press again to stop the burn, and trigger retro during descent when the challenge setup calls for it.',
        steps: [],
        sections: ['stage4Challenge', 'stage4Intro', 'stage4Questions', 'stage4Chart'],
      },
    };

    function renderChallengeSection() {
      var challenge = getActiveChallenge();
      var disabledAttr = appState.flightView.isRunning ? ' disabled' : '';
      var statusText = challenge.result ? challenge.result.badge : 'Awaiting trial';

      if (challenge.type === 'landing') {
        return '<div class="substep-card" id="challenge-mode-card">' +
          '<div class="substep-header">Challenge Mode</div>' +
          '<div class="substep-prompt">Landing setup: match the planned burn and retro window, then finish with a safe landing.</div>' +
          '<div class="chip-grid" style="margin-top:12px;">' +
            '<div class="data-chip"><div class="chip-label">Mode</div><div class="value">Retro landing</div></div>' +
            '<div class="data-chip"><div class="chip-label">Burn cutoff</div><div class="value">' + challenge.burnTimeTarget.toFixed(2) + ' s</div></div>' +
            '<div class="data-chip"><div class="chip-label">Retro start</div><div class="value">' + challenge.retroHeightTarget.toFixed(1) + ' m</div></div>' +
            '<div class="data-chip"><div class="chip-label">Retro burn</div><div class="value">' + challenge.retroBurnTarget.toFixed(2) + ' s</div></div>' +
            '<div class="data-chip"><div class="chip-label">Landing limit</div><div class="value">Γëñ ' + challenge.landingLimit.toFixed(1) + ' m/s</div></div>' +
            '<div class="data-chip"><div class="chip-label">Status</div><div class="value">' + statusText + '</div></div>' +
          '</div>' +
          '<div class="coach-block" style="margin-top:12px;">Question: can you fly the setup and land softly using the planned retro window?</div>' +
          '<div class="calc-row" style="gap:10px; flex-wrap:wrap; margin-top:12px;">' +
            '<button id="challenge-target-btn" class="btn"' + disabledAttr + '>Load Apex Challenge</button>' +
            '<button id="challenge-landing-btn" class="btn"' + disabledAttr + '>Refresh Landing Challenge</button>' +
          '</div>' +
          (challenge.result ? '<div class="feedback-msg ' + (challenge.result.success ? 'correct' : 'wrong') + '" style="margin-top:12px;">' + challenge.result.message + '</div>' : '') +
        '</div>';
      }

      return '<div class="substep-card" id="challenge-mode-card">' +
        '<div class="substep-header">Challenge Mode</div>' +
        '<div class="substep-prompt">Apex setup: you choose the burn cutoff. Hit the target peak as closely as you can.</div>' +
        '<div class="chip-grid" style="margin-top:12px;">' +
          '<div class="data-chip"><div class="chip-label">Mode</div><div class="value">Target apex</div></div>' +
          '<div class="data-chip"><div class="chip-label">Goal apex</div><div class="value">' + challenge.targetApex.toFixed(1) + ' m</div></div>' +
          '<div class="data-chip"><div class="chip-label">Tolerance</div><div class="value">┬▒ ' + challenge.apexTolerance.toFixed(1) + ' m</div></div>' +
          '<div class="data-chip"><div class="chip-label">Engine accel</div><div class="value">+' + appState.mission.burnAccel.toFixed(1) + ' m/s┬▓</div></div>' +
          '<div class="data-chip"><div class="chip-label">Status</div><div class="value">' + statusText + '</div></div>' +
        '</div>' +
        '<div class="coach-block" style="margin-top:12px;">Question: what burn cutoff gets the rocket to the target apex before you begin descent?</div>' +
        '<div class="calc-row" style="gap:10px; flex-wrap:wrap; margin-top:12px;">' +
          '<button id="challenge-target-btn" class="btn"' + disabledAttr + '>Refresh Apex Challenge</button>' +
          '<button id="challenge-landing-btn" class="btn"' + disabledAttr + '>Load Landing Challenge</button>' +
        '</div>' +
        (challenge.result ? '<div class="feedback-msg ' + (challenge.result.success ? 'correct' : 'wrong') + '" style="margin-top:12px;">' + challenge.result.message + '</div>' : '') +
      '</div>';
    }

    function resolveQuestionValue(value, mission) {
      return typeof value === 'function' ? value(mission) : value;
    }

    function renderQuestionTrackerMarkup(stepDefs) {
      if (!stepDefs || !stepDefs.length) return '';
      var trackerId = stepDefs[0].trackerId || '';
      return '<div class="step-tracker"' + (trackerId ? ' id="' + trackerId + '"' : '') + '>' +
        stepDefs.map(function(stepDef) {
          return '<div class="step-pill active" data-step="' + stepDef.step + '">' + stepDef.label + '</div>';
        }).join('') +
      '</div>';
    }

    function renderQuestionInputRow(inputKey, buttonKey) {
      var inputDef = QUESTION_INPUTS[inputKey];
      var buttonDef = buttonKey ? QUESTION_BUTTONS[buttonKey] : null;
      var value = inputDef.getValue ? inputDef.getValue() : '';
      return '<div class="calc-row">' +
        '<input id="' + inputDef.id + '" class="input" type="number" inputmode="decimal" step="any" placeholder="' + escapeHtml(inputDef.placeholder) + '" value="' + formatQuestionInputValue(value) + '" />' +
        '<span class="input-unit">' + inputDef.unit + '</span>' +
        (buttonDef ? '<button id="' + buttonDef.id + '" class="btn">' + buttonDef.label + '</button>' : '') +
      '</div>';
    }

    function renderQuestionButtonRow(buttonKey) {
      var buttonDef = QUESTION_BUTTONS[buttonKey];
      return '<div class="calc-row"><button id="' + buttonDef.id + '" class="btn">' + buttonDef.label + '</button></div>';
    }

    function renderQuestionTableInput(inputKey) {
      var inputDef = QUESTION_INPUTS[inputKey];
      var value = inputDef.getValue ? inputDef.getValue() : '';
      return '<input id="' + inputDef.id + '" class="' + (inputDef.className || 'input') + '" type="number" inputmode="decimal" step="any" placeholder="' + escapeHtml(inputDef.placeholder) + '" value="' + formatQuestionInputValue(value) + '" />';
    }

    function renderQuestionTableCell(cell, mission) {
      var className = cell.className ? ' class="' + cell.className + '"' : '';
      var id = cell.id ? ' id="' + cell.id + '"' : '';
      if (cell.type === 'empty') {
        return '<td' + className + id + '></td>';
      }
      if (cell.type === 'input') {
        return '<td' + className + id + '>' + renderQuestionTableInput(cell.input) + '</td>';
      }
      if (cell.type === 'html') {
        return '<td' + className + id + '>' + resolveQuestionValue(cell.value, mission) + '</td>';
      }
      return '<td' + className + id + '>' + escapeHtml(resolveQuestionValue(cell.value || '', mission)) + '</td>';
    }

    function renderQuestionTableBlock(section, mission) {
      var table = QUESTION_TABLES[section.table];
      var buttonDef = section.button ? QUESTION_BUTTONS[section.button] : null;
      return '<div' + (section.style ? ' style="' + section.style + '"' : '') + '>' +
        '<table class="' + (table.className || 'flight-chart') + '">' +
          '<thead><tr>' + table.columns.map(function(column) { return '<th>' + column + '</th>'; }).join('') + '</tr></thead>' +
          '<tbody>' + table.rows.map(function(row) {
            return '<tr' + (row.className ? ' class="' + row.className + '"' : '') + '>' +
              row.cells.map(function(cell) { return renderQuestionTableCell(cell, mission); }).join('') +
            '</tr>';
          }).join('') + '</tbody>' +
        '</table>' +
        (buttonDef ? '<div class="calc-row"' + (section.buttonRowStyle ? ' style="' + section.buttonRowStyle + '"' : '') + '><button id="' + buttonDef.id + '" class="btn">' + buttonDef.label + '</button></div>' : '') +
        (section.feedbackId ? '<div id="' + section.feedbackId + '" class="feedback-msg hidden"></div>' : '') +
      '</div>';
    }

    function renderQuestionSection(sectionKey, mission) {
      var section = QUESTION_SECTIONS[sectionKey];
      if (!section) return '';
      if (section.type === 'custom') {
        return resolveQuestionValue(section.render, mission);
      }
      if (section.type === 'list-block') {
        var items = QUESTION_LISTS[section.list] || [];
        return '<div class="' + (section.className || 'coach-block') + '"' + (section.style ? ' style="' + section.style + '"' : '') + '>' +
          resolveQuestionValue(section.intro, mission) +
          '<ul class="answer-list" style="margin-top:8px;">' +
            items.map(function(item) { return '<li>' + item + '</li>'; }).join('') +
          '</ul>' +
        '</div>';
      }
      if (section.type === 'table-block') {
        return renderQuestionTableBlock(section, mission);
      }

      var rows = (section.rows || []).map(function(row) {
        if (row.type === 'input-row') return renderQuestionInputRow(row.input, row.button);
        if (row.type === 'button-row') return renderQuestionButtonRow(row.button);
        return '';
      }).join('');

      return '<div class="' + (section.className || 'substep-card') + '"' + (section.id ? ' id="' + section.id + '"' : '') + (section.style ? ' style="' + section.style + '"' : '') + '>' +
        (section.header ? '<div class="substep-header">' + resolveQuestionValue(section.header, mission) + '</div>' : '') +
        (section.prompt ? '<div class="substep-prompt">' + resolveQuestionValue(section.prompt, mission) + '</div>' : '') +
        rows +
        (section.feedbackId ? '<div id="' + section.feedbackId + '" class="feedback-msg hidden"></div>' : '') +
      '</div>';
    }

    function renderQuestionCard() {
      if (!el.questionCard || !appState.mission) return;
      var definition = MASTER_QUESTION_LIST[appState.briefStage] || MASTER_QUESTION_LIST[4];
      el.questionCard.className = 'calc-card ' + definition.tone;
      el.questionCardTitle.innerHTML = definition.title;
      el.questionCardPrompt.innerHTML = definition.prompt;
      el.questionCardContent.innerHTML = renderQuestionTrackerMarkup(definition.steps) +
        definition.sections.map(function(sectionKey) {
          return renderQuestionSection(sectionKey, appState.mission);
        }).join('');
    }

    function syncQuestionCardInput(target) {
      if (!target || !target.id) return;
      var inputDef = QUESTION_INPUTS_BY_ID[target.id];
      if (!inputDef || !inputDef.setValue) return;
      inputDef.setValue(target.value);
    }

    function renderScaffolding() {
      var mission = appState.mission;
      var a = mission.burnAccel;
      var t = mission.burnTime;


      // Level 1 dynamic given values
      if (el.givenBurnAccel1a) el.givenBurnAccel1a.textContent = '+' + a + ' m/s\u00B2';
      if (el.givenBurnTime1a) el.givenBurnTime1a.textContent = t + ' s';
      if (el.chipBurnAccel) el.chipBurnAccel.textContent = '+' + a + ' m/s\u00B2';

      var burnDone = appState.burnLocked ? ['a'] : [];
      renderStepTracker(el.burnTracker, 'a', burnDone);

      if (el.substepA) {
        el.substepA.classList.remove('hidden');
        if (appState.burnSubA.done) el.substepA.classList.add('done');
        else el.substepA.classList.remove('done');
      }
      if (el.subAInput) el.subAInput.disabled = appState.burnLocked;
      if (el.subBInput) el.subBInput.disabled = appState.burnLocked;
      if (el.subABtn) {
        el.subABtn.disabled = appState.burnLocked;
        el.subABtn.textContent = appState.burnLocked ? 'Done' : 'Check Stage 1';
      }
      if (el.subCFeedback) renderFeedback(el.subCFeedback, appState.burnSubC.feedback);

      var coastDone = appState.coastSubC.done ? ['c'] : [];
      renderStepTracker(el.coastTracker, 'c', coastDone);

      if (el.coastBurnoutV) el.coastBurnoutV.textContent = mission.burnoutVelocity.toFixed(1) + ' m/s';

      if (el.coastC) el.coastC.classList.remove('hidden');
      if (el.coastCInput) el.coastCInput.disabled = appState.coastSubC.done;
      if (el.coastCBtn) { el.coastCBtn.disabled = appState.coastSubC.done; el.coastCBtn.textContent = appState.coastSubC.done ? 'Done' : 'Check'; }
      if (el.coastCFeedback) renderFeedback(el.coastCFeedback, appState.coastSubC.feedback);

      var retroDone = appState.coastSubD.done ? ['a'] : [];
      renderStepTracker(el.retroTracker, 'a', retroDone);

      if (el.retroACard) el.retroACard.classList.remove('hidden');
      if (el.retroAInput) el.retroAInput.disabled = appState.coastSubD.done;
      if (el.retroABtn) {
        el.retroABtn.disabled = appState.coastSubD.done;
        el.retroABtn.textContent = appState.coastSubD.done ? 'Done' : 'Check Apex';
      }
      if (el.retroAFeedback) renderFeedback(el.retroAFeedback, appState.coastSubD.feedback);
      if (el.retroApexA) el.retroApexA.textContent = mission.burnoutHeight.toFixed(1) + ' m';
      if (el.retroTrialH) el.retroTrialH.textContent = mission.coastHeight.toFixed(1) + ' m';
    }

    function renderLevel4() {
      if (!el.l4BurnTime) return;
      var mission = appState.mission;
      el.l4BurnTime.textContent = mission.burnTime.toFixed(1);
      if (el.l4BurnAccel) el.l4BurnAccel.textContent = '+' + mission.burnAccel;

      /* Populate given-cells that depend on solved physics */
      var burnV    = mission.burnAccel * mission.burnTime;
      var fallDist = mission.apexHeight - mission.retroHeight;
      var fallV    = Math.sqrt(2 * Math.abs(GRAVITY) * fallDist);
      if (el.l4CoastV0Cell)  el.l4CoastV0Cell.textContent  = burnV.toFixed(1);
      if (el.l4FallDyCell)   el.l4FallDyCell.textContent   = 'ΓêÆ' + (mission.apexHeight - mission.retroHeight).toFixed(1) + ' m';
      if (el.l4RetroV0Cell)  el.l4RetroV0Cell.textContent  = fallV.toFixed(1);
      if (el.l4RetroDyCell)  el.l4RetroDyCell.textContent  = 'ΓêÆ' + mission.retroHeight.toFixed(1) + ' m';

      var done = appState.l4Done;
      if (el.l4BurnV)      el.l4BurnV.disabled      = done;
      if (el.l4BurnDy)     el.l4BurnDy.disabled     = done;
      if (el.l4CoastTime)  el.l4CoastTime.disabled  = done;
      if (el.l4CoastDy)    el.l4CoastDy.disabled    = done;
      if (el.l4FallV)      el.l4FallV.disabled      = done;
      if (el.l4FallTime)   el.l4FallTime.disabled   = done;
      if (el.l4RetroAccel) el.l4RetroAccel.disabled = done;
      if (el.l4RetroTime)  el.l4RetroTime.disabled  = done;
      if (el.l4TotalTime)  el.l4TotalTime.disabled  = done;
      if (el.l4CheckBtn) {
        el.l4CheckBtn.disabled = done || !appState.burnLocked;
        el.l4CheckBtn.textContent = done ? 'Locked' : 'Check All';
      }
      if (el.l4Feedback) renderFeedback(el.l4Feedback, appState.l4Feedback);
    }

    function render() {
      const mission = appState.mission;
      const fv = appState.flightView;
      const viewportMax = getViewportMaxHeight();
      const ticks = getAltitudeTicks(viewportMax);
      const rocketBottom = getRocketBottomPercent(viewportMax);
      const tone = getStageToneClass(fv.stage);
      const brief = getBriefStageData();
      const action = getActionButtonConfig();
      const total = getTotalScore();

      el.badgeTarget.textContent = 'Target apex ' + mission.targetHeight + ' m';
      if (el.flightStageText) {
        el.flightStageText.textContent = fv.stage.toUpperCase();
        el.flightStageText.className = 'status-text ' + tone;
      }

      el.timerDisplay.textContent = fv.time.toFixed(2) + ' s';
      el.instTimer.textContent = fv.time.toFixed(2) + ' s';
      el.instAltitude.textContent = fv.height.toFixed(1) + ' m';
      el.instAltitudeSub.textContent = 'Scale max ' + viewportMax + ' m';
      el.instVelocity.textContent = formatSigned(fv.velocity, 1) + ' m/s';
      el.instAcceleration.textContent = formatSigned(fv.acceleration, 1) + ' m/s\u00B2';

      el.flightTimerDisplay.textContent = fv.time.toFixed(2) + ' s';
      el.flightAltitudeDisplay.textContent = fv.height.toFixed(1) + ' m';

      el.instrumentGrid.classList.toggle('hidden', !appState.showInstrumentGrid);
      el.flightValuesSection.classList.toggle('hidden', !appState.showFlightValues);

      ticks.forEach(function(tick, i) {
        el.ticks[i].textContent = i === 0 ? tick + ' m' : '' + tick;
      });

      var rocketWrapClassName = 'rocket-wrap';
      if (appState.rocketSideways) rocketWrapClassName += ' sideways';
      if (fv.stage === 'crashed') rocketWrapClassName += ' crashed';
      if (appState.crashIgnitionActive) rocketWrapClassName += ' crash-ignition';
      if (appState.attitudeThrusterPulseMode) {
        rocketWrapClassName += ' attitude-pulse-' + appState.attitudeThrusterPulseMode;
      }
      el.rocketWrap.className = rocketWrapClassName;
      el.rocketWrap.style.bottom = rocketBottom + '%';

      /* --- Minimap update --- */
      var mmTrackEl = el.minimap.querySelector('.minimap-track');
      var mmTrackH = mmTrackEl ? mmTrackEl.clientHeight - 10 : 200;
      var mmScale = mission.targetHeight * 2.0;
      if (fv.maxHeightSeen > mmScale) mmScale = fv.maxHeightSeen * 1.1;

      function setMiniBand(bandEl, startH, endH) {
        if (!bandEl || !Number.isFinite(startH) || !Number.isFinite(endH) || mmScale <= 0) return;
        var s = clamp((startH / mmScale) * 100, 0, 100);
        var e = clamp((endH / mmScale) * 100, 0, 100);
        if (e < s) { var tmp = e; e = s; s = tmp; }
        bandEl.style.bottom = s + '%';
        bandEl.style.height = Math.max(0.8, e - s) + '%';
      }

      setMiniBand(el.minibandS1, 0, mission.burnoutHeight);
      setMiniBand(el.minibandS2, mission.burnoutHeight, mission.apexHeight);
      setMiniBand(el.minibandS3, mission.retroHeight, mission.apexHeight);
      setMiniBand(el.minibandS4, 0, mission.retroHeight);

      var mmShipPct = clamp((fv.height / mmScale) * 100, 0, 100);
      var mmShipPx = 10 + (mmShipPct / 100) * mmTrackH;
      el.minimapShip.style.bottom = mmShipPx + 'px';

      function mmToFlight(mmPx) { return mmPx; }

      /* Target marker */
      var mmTargetPct = clamp((mission.targetHeight / mmScale) * 100, 0, 100);
      el.minimapTarget.style.bottom = (10 + (mmTargetPct / 100) * mmTrackH) + 'px';

      /* Apex marker */
      if (fv.maxHeightSeen > 0.5) {
        var mmApexPct = clamp((fv.maxHeightSeen / mmScale) * 100, 0, 100);
        var mmApexPx = 10 + (mmApexPct / 100) * mmTrackH;
        el.minimapApex.style.bottom = mmApexPx + 'px';
        el.minimapApex.classList.add('visible');
        el.minimapApexChip.textContent = fv.maxHeightSeen.toFixed(0) + 'm';
        el.minimapApexChip.style.bottom = mmToFlight(mmApexPx) + 'px';
        el.minimapApexChip.classList.add('visible');
      } else {
        el.minimapApex.classList.remove('visible');
        el.minimapApexChip.classList.remove('visible');
      }

      var sim = appState.simulation;
      if (sim.burnCutoffHeight !== null && sim.burnCutoffHeight !== undefined) {
        var mmBurnPct = clamp((sim.burnCutoffHeight / mmScale) * 100, 0, 100);
        var mmBurnPx = 10 + (mmBurnPct / 100) * mmTrackH;
        el.minimapBurnMarker.style.bottom = mmBurnPx + 'px';
        el.minimapBurnMarker.classList.add('visible');
        el.minimapBurnChip.textContent = sim.burnCutoffHeight.toFixed(0) + 'm';
        el.minimapBurnChip.style.bottom = mmToFlight(mmBurnPx) + 'px';
        el.minimapBurnChip.classList.add('visible');
      } else {
        el.minimapBurnMarker.classList.remove('visible');
        el.minimapBurnChip.classList.remove('visible');
      }

      if (sim.retroStartHeight !== null && sim.retroStartHeight !== undefined) {
        var mmRetroPct = clamp((sim.retroStartHeight / mmScale) * 100, 0, 100);
        var mmRetroPx = 10 + (mmRetroPct / 100) * mmTrackH;
        el.minimapRetroMarker.style.bottom = mmRetroPx + 'px';
        el.minimapRetroMarker.classList.add('visible');
        el.minimapRetroChip.textContent = sim.retroStartHeight.toFixed(0) + 'm';
        el.minimapRetroChip.style.bottom = mmToFlight(mmRetroPx) + 'px';
        el.minimapRetroChip.classList.add('visible');
      } else {
        el.minimapRetroMarker.classList.remove('visible');
        el.minimapRetroChip.classList.remove('visible');
      }

      const flameVisible = fv.stage === 'powered' || fv.stage === 'retro' || appState.crashIgnitionActive;
      el.rocketFlame.classList.toggle('hidden', !flameVisible);
      var flameMode = fv.stage === 'powered' ? 'powered' : 'retro';
      if (appState.crashIgnitionActive) flameMode += ' misfire';
      el.rocketFlame.className = 'flame ' + flameMode + (flameVisible ? '' : ' hidden');

      if (flameVisible) {
        el.rocketFlame.style.opacity = (0.82 + Math.random() * 0.18).toFixed(2);
      } else {
        el.rocketFlame.style.opacity = '';
      }

      if (fv.stage === 'powered' && fv.isRunning) {
        var shakeX = (Math.random() - 0.5) * 3;
        var shakeY = (Math.random() - 0.5) * 2;
        el.rocketWrap.style.marginLeft = shakeX.toFixed(1) + 'px';
        el.rocketWrap.style.marginTop = shakeY.toFixed(1) + 'px';
      } else {
        el.rocketWrap.style.marginLeft = '';
        el.rocketWrap.style.marginTop = '';
      }

      if (fv.stage === 'retro') {
        el.rocketGlow.style.opacity = '1';
        el.rocketGlow.style.width = '150px';
        el.rocketGlow.style.height = '150px';
        el.rocketGlow.style.background = 'radial-gradient(circle, rgba(251,146,60,0.4), transparent 65%)';
      } else if (fv.stage === 'powered') {
        el.rocketGlow.style.opacity = '0.9';
        el.rocketGlow.style.width = '120px';
        el.rocketGlow.style.height = '120px';
        el.rocketGlow.style.background = '';
      } else {
        el.rocketGlow.style.opacity = '';
        el.rocketGlow.style.width = '';
        el.rocketGlow.style.height = '';
        el.rocketGlow.style.background = '';
      }

      el.actionBtn.textContent = action.label;
      el.actionBtn.className = action.className;
      el.actionBtn.disabled = action.disabled;
      el.actionBtn.onclick = action.action || function() {};

      var showAttitudeButton = fv.isRunning && !appState.crashIgnitionActive && appState.levelMode === 0 && (fv.stage === 'descent' || fv.stage === 'retro');
      el.attitudeBtn.classList.toggle('hidden', !showAttitudeButton);
      el.attitudeBtn.disabled = !showAttitudeButton;
      el.attitudeBtn.textContent = appState.rocketSideways ? 'Stand Upright' : 'Turn Sideways';

      el.flightDragMode.textContent = appState.rocketSideways ? 'Sideways' : 'Upright';
      if (appState.crashIgnitionActive) {
        el.flightDragSub.textContent = 'Retro misfire';
      } else if (fv.stage === 'retro') {
        el.flightDragSub.textContent = appState.rocketSideways ? 'Retro burn while rotated' : 'Retro burn while upright';
      } else if (fv.stage === 'powered') {
        el.flightDragSub.textContent = 'Powered ascent';
      } else if (fv.stage === 'coast') {
        el.flightDragSub.textContent = 'Coasting to apex';
      } else if (fv.stage === 'descent') {
        el.flightDragSub.textContent = appState.rocketSideways ? 'Manual sideways attitude' : 'Ballistic descent';
      } else {
        el.flightDragSub.textContent = appState.rocketSideways ? 'Manual sideways attitude' : 'Ballistic descent';
      }

      el.stageTabs.forEach(function(tab) {
        const stage = Number(tab.dataset.stage);
        const base = 'stage-tab stage-' + stage;
        tab.className = appState.briefStage === stage ? base + ' active' : base;
      });

      // Stage 1 row: always visible, uses brief (already computed for active stage)
      const brief1 = getBriefStageData(1);
      el.valueDy.textContent = brief1.values[0].value;
      el.valueV0.textContent = brief1.values[1].value;
      el.valueV.textContent = brief1.values[2].value;
      el.valueA.textContent = brief1.values[3].value;
      el.valueT.textContent = brief1.values[4].value;
      // Stage 2 row
      el.stageValRow2.classList.toggle('hidden', appState.briefStage < 2);
      if (appState.briefStage >= 2) {
        const brief2 = getBriefStageData(2);
        el.valueDyS2.textContent = brief2.values[0].value;
        el.valueV0S2.textContent = brief2.values[1].value;
        el.valueVS2.textContent  = brief2.values[2].value;
        el.valueAS2.textContent  = brief2.values[3].value;
        el.valueTS2.textContent  = brief2.values[4].value;
      }
      // Stage 3 row
      el.stageValRow3.classList.toggle('hidden', appState.briefStage < 3);
      if (appState.briefStage >= 3) {
        const brief3 = getBriefStageData(3);
        el.valueDyS3.textContent = brief3.values[0].value;
        el.valueV0S3.textContent = brief3.values[1].value;
        el.valueVS3.textContent  = brief3.values[2].value;
        el.valueAS3.textContent  = brief3.values[3].value;
        el.valueTS3.textContent  = brief3.values[4].value;
      }
      // Stage 4 row
      el.stageValRow4.classList.toggle('hidden', appState.briefStage < 4);
      if (appState.briefStage >= 4) {
        const brief4 = getBriefStageData(4);
        el.valueDyS4.textContent = brief4.values[0].value;
        el.valueV0S4.textContent = brief4.values[1].value;
        el.valueVS4.textContent  = brief4.values[2].value;
        el.valueAS4.textContent  = brief4.values[3].value;
        el.valueTS4.textContent  = brief4.values[4].value;
      }
      // Flight HUD values mirror the active stage
      el.flightValueDy.textContent = brief.values[0].value;
      el.flightValueV0.textContent = brief.values[1].value;
      el.flightValueV.textContent = brief.values[2].value;
      el.flightValueA.textContent = brief.values[3].value;
      el.flightValueT.textContent = brief.values[4].value;
      if (el.briefTargetChip) {
        el.briefTargetChip.textContent = getBriefTargetChipText();
      }

      if (el.chipTarget) el.chipTarget.textContent = mission.targetHeight + ' m';
      if (el.chipLandingLimit) el.chipLandingLimit.textContent = '\u00B1' + mission.safeLandingSpeed + ' m/s';
      if (el.chipGravity) el.chipGravity.textContent = mission.gravity + ' m/s\u00B2';
      if (el.chipBurnAccel) el.chipBurnAccel.textContent = '+' + mission.burnAccel + ' m/s\u00B2';

      renderQuestionCard();
      renderScaffolding();
      renderLevel4();

      /* NEW: equation strip & vector arrows */
      updateEquationStrip();
      updateVectorArrows();

      /* Score badge */
      el.scoreBadge.textContent = 'Score: ' + total + ' / 100';

      el.retryBtn.disabled = appState.briefStage < 4 || appState.levelDemoResult !== null || fv.isRunning;

      el.toggleCoachBtn.textContent = appState.showCoach ? 'Hide Hint' : 'Hint';
      el.coachCard.classList.toggle('hidden', !appState.showCoach);
      if (el.coachStepHint) el.coachStepHint.innerHTML = getStepHint();
      el.coachBurnAnswer.textContent = appState.burnLocked
        ? 'Apex height: ' + mission.apexHeight.toFixed(1) + ' m'
        : 'Apex height: solve Stage 1 first';
      el.coachRetroAnswer.textContent = 'Investigation: compare your measured retro phase with the planned +' + mission.retroAccel.toFixed(1) + ' m/s^2 engine accel.';

      if (appState.finishedMetrics) {
        const fm = appState.finishedMetrics;
        el.finishedCard.classList.remove('hidden');
        el.finishedEnteredBurn.textContent = appState.mission.burnTime + ' s (given)';
        el.finishedBurnScore.textContent = fm.burnScore + ' / ' + BURN_POINTS;
        el.finishedEnteredRetro.textContent = fm.enteredRetro ? fm.enteredRetro + ' m/s\u00B2' : '--';
        el.finishedRetroScore.textContent = fm.retroScore + ' / ' + RETRO_POINTS;
        el.finishedLandingSpeed.textContent = fm.landingSpeed != null ? fm.landingSpeed.toFixed(2) + ' m/s' : '--';
        el.finishedLandingScore.textContent = fm.landingScore + ' / ' + LANDING_POINTS;
        el.finishedMissionResult.textContent = fm.challengeResult
          ? (fm.missionResult || '--') + ' ┬╖ ' + fm.challengeResult.badge
          : (fm.missionResult || '--');
        el.finishedTotalScore.textContent = fm.totalScore + ' / 100';

        el.finishedActualBurnTime.textContent = fm.actualBurnTime != null ? fm.actualBurnTime.toFixed(3) + ' s' : '--';
        el.finishedActualBurnHeight.textContent = fm.actualBurnHeight != null ? fm.actualBurnHeight.toFixed(2) + ' m' : '--';
        el.finishedActualBurnVelocity.textContent = fm.actualBurnVelocity != null ? formatSigned(fm.actualBurnVelocity, 2) + ' m/s' : '--';
        el.finishedActualMaxHeight.textContent = fm.actualMaxHeight != null ? fm.actualMaxHeight.toFixed(2) + ' m' : '--';
        el.finishedActualRetroTime.textContent = fm.actualRetroTime != null ? fm.actualRetroTime.toFixed(3) + ' s' : '--';
        el.finishedActualRetroHeight.textContent = fm.actualRetroHeight != null ? fm.actualRetroHeight.toFixed(2) + ' m' : '--';
        el.finishedActualRetroVelocity.textContent = fm.actualRetroVelocity != null ? formatSigned(fm.actualRetroVelocity, 2) + ' m/s' : '--';
        el.finishedActualLandingVelocity.textContent = fm.actualLandingVelocity != null ? formatSigned(fm.actualLandingVelocity, 2) + ' m/s' : '--';
        el.finishedActualRetroBurn.textContent = fm.actualTotalRetroBurn != null ? fm.actualTotalRetroBurn.toFixed(3) + ' s' : '--';
        el.finishedActualTotalTime.textContent = fm.actualTotalTime != null ? fm.actualTotalTime.toFixed(3) + ' s' : '--';
      } else {
        el.finishedCard.classList.add('hidden');
      }
    }

    /* ===== Event Binding ===== */
    function bindEvents() {
      el.toggleCoachBtn.addEventListener('click', function() {
        appState.showCoach = !appState.showCoach;
        render();
      });

      el.retryBtn.addEventListener('click', retryFlight);
      el.newMissionBtn.addEventListener('click', function() { resetMission(); });
      el.showWalkthroughBtn.addEventListener('click', openWalkthrough);
      el.attitudeBtn.addEventListener('click', toggleRocketAttitude);

      document.addEventListener('copy', function(e) { e.preventDefault(); });

      if (el.questionCard) {
        el.questionCard.addEventListener('click', function(event) {
          var target = event.target;
          if (!target || !target.id) return;
          if (target.id === 'sub-a-btn') gradeBurnWalkthrough();
          else if (target.id === 'coast-c-btn') gradeCoastC();
          else if (target.id === 'retro-a-btn') gradeApexSummary();
          else if (target.id === 'l4-check-btn') gradeLevel4Chart();
          else if (target.id === 'challenge-target-btn') setActiveChallenge('apex');
          else if (target.id === 'challenge-landing-btn') setActiveChallenge('landing');
        });

        el.questionCard.addEventListener('input', function(event) {
          syncQuestionCardInput(event.target);
        });

        el.questionCard.addEventListener('keydown', function(event) {
          var target = event.target;
          if (!target || event.key !== 'Enter') return;
          syncQuestionCardInput(target);
          if (target.id === 'sub-a-input' || target.id === 'sub-b-input') gradeBurnWalkthrough();
          else if (target.id === 'coast-c-input') gradeCoastC();
          else if (target.id === 'retro-a-input') gradeApexSummary();
        });

        el.questionCard.addEventListener('paste', function(event) {
          var target = event.target;
          if (target && target.tagName === 'INPUT') event.preventDefault();
        });
      }

      el.stageTabs.forEach(function(tab) {
        tab.addEventListener('click', function() {
          appState.briefStage = Number(tab.dataset.stage);
          render();
        });
      });

      el.walkPrevBtn.addEventListener('click', function() {
        if (appState.walkStep > 0) {
          appState.walkStep--;
          renderWalkthrough();
        }
      });

      el.walkNextBtn.addEventListener('click', function() {
        if (appState.walkStep >= WALKTHROUGH_STEPS.length - 1) {
          closeWalkthrough();
        } else {
          appState.walkStep++;
          renderWalkthrough();
        }
      });
    }

    /* ===== Init ===== */
    function init() {
      if (typeof SCORM !== 'undefined') {
        SCORM.initialize();
      }

      const restored = loadSuspendData();
      closeWalkthrough();

      if (!restored) {
        appState.mission = createMission();
      }

      bindEvents();
      render();
    }

    init();
