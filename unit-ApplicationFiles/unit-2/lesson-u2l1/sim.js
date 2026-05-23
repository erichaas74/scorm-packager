(function() {
  "use strict";

  var SIM_SECONDS = 3;
  var FPS = 60;
  var AIRSPEED_PIXEL_BASE = 6;
  var KNOTS_PER_MPS = 1.94384;
  var LEVEL_CONFIGS = {
    1: {
      name: "Question 1: Fly Into Wind",
      meta: "Heading check",
      instructions: "The airplane starts on the runway line in a crosswind. Adjust only the air-velocity angle so the ground track stays straight down the runway.",
      givens: "Given: airspeed is fixed at 100 kt. Wind is from 270 degrees at 25 kt. Solve the crab angle of the red velocity vector.",
      controlMode: "angle",
      displayAirspeed: 100,
      headingDeg: -5,
      windDirection: 270,
      windSpeed: 25,
      startOffsetMeters: 0,
      targetMode: "straight",
      formula: "For a straight ground track: airspeed * sin(theta) + wind side component = 0",
      successMessage: "Centerline held. You solved the angle needed to fly into the wind.",
      failMessage: "The approach drifted off the runway. Angle the airplane into the wind."
    },
    2: {
      name: "Question 2: Fixed Angle",
      meta: "Speed check",
      instructions: "The airplane angle is fixed into the wind. Adjust only the magnitude of the red velocity vector until the sideways component cancels the wind.",
      givens: "Given: velocity-vector angle is fixed at -15.0 degrees. Wind is from 270 degrees at 25 kt. Solve the airspeed magnitude.",
      controlMode: "speed",
      displayAirspeed: 90,
      headingDeg: -15,
      windDirection: 270,
      windSpeed: 25,
      startOffsetMeters: 0,
      targetMode: "straight",
      formula: "For a fixed angle: airspeed = abs(wind side component / sin(theta))",
      successMessage: "Speed solved. The wind and sideways air-velocity component balanced.",
      failMessage: "The track drifted sideways. Recalculate the speed needed for the fixed angle."
    },
    3: {
      name: "Question 3: Offset Landing",
      meta: "Full vector check",
      instructions: "The airplane starts 30 m right of the landing spot. Use the lateral distance and forward distance to build the required ground vector, then choose the air-velocity angle and magnitude.",
      givens: "Given: touchdown is 30 m left and 150 m forward in 3.0 s. Wind is from 250 degrees at 35 kt.",
      controlMode: "both",
      displayAirspeed: 110,
      headingDeg: -8,
      windDirection: 250,
      windSpeed: 35,
      startOffsetMeters: 30,
      downrangeMeters: 150,
      targetMode: "point",
      formula: "Required ground vector = landing displacement / time; air velocity = required ground velocity - wind velocity",
      successMessage: "Offset landing cleared. Your air vector produced the required ground vector.",
      failMessage: "Missed the landing spot. Recalculate both the side component and the forward component."
    }
  };

  var el = {};
  var state = {
    level: 1,
    phase: "setup",
    maxFrames: SIM_SECONDS * FPS,
    currentFrame: 0,
    simAirspeedBase: 100,
    score: 0,
    cameraY: 0,
    completed: {},
    flightLog: [],
    submitted: false,
    hintOpen: false,
    animationStarted: false,
    walkthroughStep: 0,
    plane: { x: 0, y: 0, heading: 0, displayAirspeed: 100, airspeed: AIRSPEED_PIXEL_BASE },
    wind: { displaySpeed: 25, speed: 0, direction: 270 },
    runway: { width: 140, center: 0 }
  };

  var walkSteps = [
    {
      title: "Read the velocity triangle",
      body: "The red arrow is the airplane's velocity through the air. The blue arrow is wind velocity. Together they create the green ground velocity that determines the actual track over the runway."
    },
    {
      title: "Use the controls as givens",
      body: "Question 1 locks speed so students solve angle. Question 2 locks angle so students solve speed. Question 3 unlocks both controls after giving the offset distance, forward distance, and time."
    },
    {
      title: "Check with the simulator",
      body: "Press Engage Simulation after you think the vector setup is correct. A successful run records the level in the notebook; a miss gives the formula and current setup so you can revise."
    },
    {
      title: "Finish the lab",
      body: "Clear all three checks, then answer the analysis questions. The Submit Lab button unlocks only after the flight checks and written analysis are complete."
    }
  ];

  function $(id) { return document.getElementById(id); }
  function config() { return LEVEL_CONFIGS[state.level]; }
  function degToRad(deg) { return deg * Math.PI / 180; }
  function radToDeg(rad) { return rad * 180 / Math.PI; }
  function airspeedPixels(knots) { return AIRSPEED_PIXEL_BASE * (knots / state.simAirspeedBase); }
  function windPixels(knots) { return AIRSPEED_PIXEL_BASE * (knots / state.simAirspeedBase); }
  function fmt(value, places) { return Number(value).toFixed(places == null ? 1 : places); }
  function metersToPixels(meters) {
    return meters * AIRSPEED_PIXEL_BASE * KNOTS_PER_MPS * FPS / state.simAirspeedBase;
  }
  function pixelsToMeters(px) {
    return px / (AIRSPEED_PIXEL_BASE * KNOTS_PER_MPS * FPS / state.simAirspeedBase);
  }
  function startXForOffsetMeters(offsetMeters) {
    return state.runway.center + metersToPixels(offsetMeters || 0);
  }
  function windComponentsKt(c) {
    var windTo = degToRad(c.windDirection + 180);
    return {
      side: Math.sin(windTo) * c.windSpeed,
      forward: Math.cos(windTo) * c.windSpeed
    };
  }
  function targetComponentsKt(c) {
    if (c.targetMode === "point") {
      return {
        side: -(c.startOffsetMeters || 0) / SIM_SECONDS * KNOTS_PER_MPS,
        forward: (c.downrangeMeters || 0) / SIM_SECONDS * KNOTS_PER_MPS
      };
    }
    return { side: 0, forward: null };
  }
  function cacheElements() {
    [
      "start-screen","start-lesson-btn","app","show-walkthrough","submit-btn","reset-lab-btn",
      "simCanvas","sideCanvas","main-view-container","side-view-container","controls-container","student-controls-overlay",
      "heading-slider","angle-input","airspeed-slider","engage-btn","retry-btn","result-modal","modal-title",
      "modal-desc","modal-airspeed","modal-wind","modal-formula","activity-level-title",
      "activity-level-instructions","activity-level-givens","airspeed-readout",
      "wind-dir-readout","wind-speed-readout",
      "heading-control-group","airspeed-control-group","time-fill","time-text","score-display",
      "flight-log-body","overall-progress-badge","completion-trials-item","completion-trials-status",
      "completion-analysis-item","completion-analysis-status","analysis-card","analysis-lock-chip",
      "analysis-lock-text","analysis-fields","analysis-1","analysis-2","analysis-3","walkthrough-overlay",
      "walk-step-label","walk-title","walk-body","walk-prev-btn","walk-next-btn","walk-dots",
      "vector-hint-toggle","vector-hint-panel","vector-breakdown-canvas"
    ].forEach(function(id) { el[id] = $(id); });
    el.ctx = el.simCanvas.getContext("2d");
    el.sideCtx = el.sideCanvas.getContext("2d");
    el.vectorCtx = el["vector-breakdown-canvas"].getContext("2d");
    el.levelButtons = Array.prototype.slice.call(document.querySelectorAll(".scenario-btn"));
    el.analysisInputs = [el["analysis-1"], el["analysis-2"], el["analysis-3"]];
  }

  function setSliderEnabled(slider, enabled, group) {
    slider.disabled = !enabled;
    group.classList.toggle("hidden", !enabled);
  }

  function setHeadingFromDegrees(value, updateDisplayOnly) {
    var next = Number(value);
    if (!Number.isFinite(next)) next = 0;
    next = Math.max(-45, Math.min(45, next));
    state.plane.heading = degToRad(next);
    el["heading-slider"].value = next;
    el["angle-input"].value = fmt(next, 1);
    if (!updateDisplayOnly) updateUI();
  }

  function positionStudentControls() {
    var overlay = el["student-controls-overlay"];
    var main = el["main-view-container"];
    if (!overlay || !main) return;
    var viewW = main.clientWidth || el.simCanvas.width;
    var viewH = main.clientHeight || el.simCanvas.height;
    var overlayW = overlay.offsetWidth || 360;
    var overlayH = overlay.offsetHeight || 128;
    var halfW = overlayW / 2;
    var left = Math.max(14 + halfW, Math.min(viewW - 14 - halfW, state.plane.x));
    var top = Math.max(14, Math.min(viewH - overlayH - 14, state.plane.y + 52));
    overlay.style.left = left + "px";
    overlay.style.top = top + "px";
  }

  function resizeCanvases() {
    var main = el["main-view-container"];
    var side = el["side-view-container"];
    el.simCanvas.width = Math.max(320, main.clientWidth);
    el.simCanvas.height = Math.max(320, main.clientHeight);
    el.sideCanvas.width = Math.max(320, side.clientWidth);
    el.sideCanvas.height = Math.max(120, side.clientHeight);
    resizeVectorBreakdownCanvas();
    state.runway.center = el.simCanvas.width / 2;
  }

  function resizeVectorBreakdownCanvas() {
    var canvas = el["vector-breakdown-canvas"];
    var wrap = canvas.parentElement;
    canvas.width = Math.max(320, wrap.clientWidth || 520);
    canvas.height = Math.max(260, wrap.clientHeight || 340);
  }

  function applyLevelConfig() {
    var c = config();
    state.phase = "setup";
    state.currentFrame = 0;
    state.cameraY = 0;
    state.wind.direction = c.windDirection;
    state.wind.displaySpeed = c.windSpeed;
    state.wind.speed = windPixels(c.windSpeed);
    state.plane.displayAirspeed = c.displayAirspeed;
    state.plane.airspeed = airspeedPixels(c.displayAirspeed);
    state.plane.heading = degToRad(c.headingDeg);
    state.plane.x = startXForOffsetMeters(c.startOffsetMeters);
    state.plane.y = el.simCanvas.height - 175;
    el["airspeed-slider"].value = c.displayAirspeed;
    setSliderEnabled(el["heading-slider"], c.controlMode === "angle" || c.controlMode === "both", el["heading-control-group"]);
    el["angle-input"].disabled = !(c.controlMode === "angle" || c.controlMode === "both");
    setHeadingFromDegrees(c.headingDeg, true);
    setSliderEnabled(el["airspeed-slider"], c.controlMode === "speed" || c.controlMode === "both", el["airspeed-control-group"]);
    el["student-controls-overlay"].classList.toggle("two-controls", c.controlMode === "both");
    el["controls-container"].classList.remove("hidden");
    el["student-controls-overlay"].classList.remove("hidden");
    el["result-modal"].classList.add("hidden");
    updateUI();
  }

  function updateUI() {
    var c = config();
    var crosswind = Math.abs(state.wind.displaySpeed * Math.sin(degToRad(state.wind.direction)));
    var target = targetComponentsKt(c);
    el["activity-level-title"].textContent = c.name;
    el["activity-level-instructions"].textContent = c.instructions;
    el["activity-level-givens"].textContent = c.givens;
    el["airspeed-readout"].textContent = state.plane.displayAirspeed + " kt";
    el["wind-dir-readout"].textContent = state.wind.direction + " deg";
    el["wind-speed-readout"].textContent = state.wind.displaySpeed + " kt";
    el["modal-airspeed"].textContent = "Displayed Airspeed: " + state.plane.displayAirspeed + " kt";
    el["modal-wind"].textContent = "Crosswind Component: " + fmt(crosswind, 1) + " kt";
    el["modal-formula"].textContent = "Formula: " + buildFormulaText(c, target);
    el["time-fill"].style.height = ((state.maxFrames - state.currentFrame) / state.maxFrames * 100) + "%";
    el["time-text"].textContent = fmt(Math.max(0, (state.maxFrames - state.currentFrame) / FPS), 1) + " s";
    el["score-display"].textContent = state.score + " pts";
    drawVectorBreakdown();
    positionStudentControls();
    updateLevelTabs();
    updateCompletion();
  }

  function buildFormulaText(c, target) {
    if (c.targetMode === "point") {
      var wind = windComponentsKt(c);
      return c.formula + "\nNeeded ground side component: " + fmt(target.side, 1) + " kt. Needed ground forward component: " + fmt(target.forward, 1) + " kt.\nWind components: " + fmt(wind.side, 1) + " kt side, " + fmt(wind.forward, 1) + " kt forward. Positive side is to the right.";
    }
    if (c.controlMode === "speed") {
      return c.formula + "\nFixed angle: " + fmt(c.headingDeg, 1) + " deg. Use the wind side component and the sine of the angle to solve the speed.";
    }
    return c.formula + "\nUse the known airspeed and wind side component to solve the angle.";
  }

  function currentVectorBreakdownKt() {
    var c = config();
    var air = {
      side: Math.sin(state.plane.heading) * state.plane.displayAirspeed,
      forward: Math.cos(state.plane.heading) * state.plane.displayAirspeed
    };
    var wind = windComponentsKt(c);
    var ground = {
      side: air.side + wind.side,
      forward: air.forward + wind.forward
    };
    var target = targetComponentsKt(c);
    if (target.forward === null) target.forward = ground.forward;
    return { air: air, wind: wind, ground: ground, target: target };
  }

  function targetVectorBreakdownKt(liveData) {
    var c = config();
    var wind = liveData.wind;
    var ground;
    var air;
    if (c.targetMode === "point") {
      ground = targetComponentsKt(c);
      air = {
        side: ground.side - wind.side,
        forward: ground.forward - wind.forward
      };
    } else if (c.controlMode === "speed") {
      var fixedHeading = degToRad(c.headingDeg);
      var solvedSpeed = Math.abs(wind.side / Math.sin(fixedHeading));
      air = {
        side: Math.sin(fixedHeading) * solvedSpeed,
        forward: Math.cos(fixedHeading) * solvedSpeed
      };
      ground = {
        side: air.side + wind.side,
        forward: air.forward + wind.forward
      };
    } else {
      var airSide = -wind.side;
      var airForward = Math.sqrt(Math.max(0, c.displayAirspeed * c.displayAirspeed - airSide * airSide));
      air = { side: airSide, forward: airForward };
      ground = {
        side: air.side + wind.side,
        forward: air.forward + wind.forward
      };
    }
    return {
      air: air,
      wind: wind,
      ground: ground,
      heading: radToDeg(Math.atan2(air.side, air.forward)),
      speed: Math.sqrt(air.side * air.side + air.forward * air.forward)
    };
  }

  function drawVectorBreakdown() {
    if (!state.hintOpen) return;
    resizeVectorBreakdownCanvas();
    var ctx = el.vectorCtx;
    var canvas = el["vector-breakdown-canvas"];
    var w = canvas.width;
    var h = canvas.height;
    var data = currentVectorBreakdownKt();
    var targetData = targetVectorBreakdownKt(data);
    function text(label, x, y, color, size) {
      ctx.fillStyle = color || "#e2e8f0";
      ctx.font = "700 " + (size || 12) + "px system-ui, sans-serif";
      ctx.fillText(label, x, y);
    }

    function wrapText(label, x, y, maxWidth, color, size, lineHeight) {
      var words = String(label).split(" ");
      var line = "";
      var usedLines = 0;
      ctx.fillStyle = color || "#e2e8f0";
      ctx.font = "700 " + (size || 11) + "px system-ui, sans-serif";
      words.forEach(function(word) {
        var testLine = line ? line + " " + word : word;
        if (ctx.measureText(testLine).width > maxWidth && line) {
          ctx.fillText(line, x, y + usedLines * lineHeight);
          line = word;
          usedLines += 1;
        } else {
          line = testLine;
        }
      });
      if (line) {
        ctx.fillText(line, x, y + usedLines * lineHeight);
        usedLines += 1;
      }
      return y + usedLines * lineHeight;
    }

    function vectorMagnitude(vec) {
      return Math.sqrt(vec.side * vec.side + vec.forward * vec.forward);
    }

    function trigContent(c) {
      if (c.targetMode === "point") {
        return {
          instruction: "Use the landing displacement to build the target ground vector, then subtract wind to get the air vector.",
          steps: [
            "ground side = " + fmt(targetData.ground.side, 1) + " kt",
            "ground forward = " + fmt(targetData.ground.forward, 1) + " kt",
            "air = ground - wind",
            "theta = atan2(side, forward)",
            "theta = " + fmt(targetData.heading, 1) + " deg"
          ]
        };
      }
      if (c.controlMode === "speed") {
        return {
          instruction: "Keep the ground side component at 0 kt. The airplane side component must cancel the wind side component.",
          steps: [
            "air side = -" + fmt(data.wind.side, 1) + " kt",
            "speed = |air side / sin(theta)|",
            "= |" + fmt(-data.wind.side, 1) + " / sin(" + fmt(c.headingDeg, 1) + " deg)|",
            "speed = " + fmt(targetData.speed, 1) + " kt"
          ]
        };
      }
      return {
        instruction: "Keep the ground side component at 0 kt. With speed fixed, solve the angle that creates the needed side component.",
        steps: [
          "air side = -" + fmt(data.wind.side, 1) + " kt",
          "sin(theta) = air side / speed",
          "= " + fmt(-data.wind.side, 1) + " / " + fmt(c.displayAirspeed, 0),
          "theta = " + fmt(targetData.heading, 1) + " deg"
        ]
      };
    }

    function panel(x, y, width, height, title) {
      ctx.fillStyle = "rgba(15,23,42,.72)";
      ctx.strokeStyle = "rgba(148,163,184,.22)";
      ctx.lineWidth = 1;
      roundRect(ctx, x, y, width, height, 16);
      ctx.fill();
      ctx.stroke();
      if (title) text(title, x + 14, y + 24, "#e2e8f0", 12);
    }

    function drawVectorSet(bounds, title, vectorData, caption, showTargetStyle) {
      panel(bounds.x, bounds.y, bounds.w, bounds.h, title);
      var zero = { side: 0, forward: 0 };
      var airEnd = vectorData.air;
      var groundEnd = vectorData.ground;
      var minSide = Math.min(0, airEnd.side, groundEnd.side);
      var maxSide = Math.max(0, airEnd.side, groundEnd.side);
      var minForward = Math.min(0, airEnd.forward, groundEnd.forward);
      var maxForward = Math.max(0, airEnd.forward, groundEnd.forward);
      if (maxSide - minSide < 30) {
        var sideCenter = (minSide + maxSide) / 2;
        minSide = sideCenter - 15;
        maxSide = sideCenter + 15;
      }
      if (maxForward - minForward < 30) {
        var forwardCenter = (minForward + maxForward) / 2;
        minForward = forwardCenter - 15;
        maxForward = forwardCenter + 15;
      }
      var padX = 46;
      var padTop = 42;
      var padBottom = 46;
      var sideSpan = Math.max(30, maxSide - minSide);
      var forwardSpan = Math.max(30, maxForward - minForward);
      var scale = Math.min((bounds.w - padX * 2) / sideSpan, (bounds.h - padTop - padBottom) / forwardSpan);
      var origin = {
        x: bounds.x + padX - minSide * scale,
        y: bounds.y + bounds.h - padBottom + minForward * scale
      };
      function px(point) {
        return { x: origin.x + point.side * scale, y: origin.y - point.forward * scale };
      }
      function fromTo(a, b, color, width) {
        var pa = px(a);
        var pb = px(b);
        drawArrow(ctx, pa.x, pa.y, pb.x, pb.y, color, width);
      }
      ctx.save();
      ctx.strokeStyle = "rgba(148,163,184,.32)";
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 6]);
      ctx.beginPath();
      ctx.moveTo(bounds.x + 18, origin.y);
      ctx.lineTo(bounds.x + bounds.w - 18, origin.y);
      ctx.moveTo(origin.x, bounds.y + 38);
      ctx.lineTo(origin.x, bounds.y + bounds.h - 16);
      ctx.stroke();
      ctx.restore();

      fromTo(zero, airEnd, "rgba(239,68,68,.95)", 4);
      fromTo(airEnd, groundEnd, "rgba(96,165,250,.92)", 4);
      fromTo(zero, groundEnd, showTargetStyle ? "rgba(250,204,21,.92)" : "rgba(74,222,128,.95)", 5);

      var labelLeft = bounds.x + 16;
      var labelTop = bounds.y + 16;
      text("air " + fmt(vectorMagnitude(vectorData.air), 1) + " kt", labelLeft, labelTop + 16, "#fca5a5", 11);
      text("wind", labelLeft, labelTop + 34, "#bfdbfe", 11);
      text(showTargetStyle ? "target ground" : "ground", labelLeft, labelTop + 52, showTargetStyle ? "#fde68a" : "#86efac", 11);

      if (caption) {
        ctx.fillStyle = "#cbd5e1";
        ctx.font = "700 11px system-ui, sans-serif";
        ctx.fillText(caption, bounds.x + 14, bounds.y + bounds.h - 16);
      }
    }

    function drawTrigPanel(bounds, content) {
      panel(bounds.x, bounds.y, bounds.w, bounds.h, "Trig calculation");
      var x = bounds.x + 14;
      var y = bounds.y + 50;
      var maxTextW = bounds.w - 28;
      text("Instruction", x, y, "#67e8f9", 11);
      y += 18;
      y = wrapText(content.instruction, x, y, maxTextW, "#cbd5e1", 10, 14) + 16;
      text("Steps", x, y, "#67e8f9", 11);
      y += 20;
      content.steps.forEach(function(line, index) {
        var color = index === content.steps.length - 1 ? "#fde68a" : "#e2e8f0";
        y = wrapText((index + 1) + ". " + line, x, y, maxTextW, color, 11, 15) + 7;
      });
    }

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#08111f";
    ctx.fillRect(0, 0, w, h);

    var gap = 10;
    var targetW = (w - 32 - gap) * 0.56;
    var trigW = w - 32 - gap - targetW;
    var colH = h - 32;
    var targetX = 16;
    var trigX = targetX + targetW + gap;
    drawVectorSet(
      { x: targetX, y: 16, w: targetW, h: colH },
      "",
      targetData,
      "",
      true
    );

    drawTrigPanel({ x: trigX, y: 16, w: trigW, h: colH }, trigContent(config()));
  }

  function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  function updateLevelTabs() {
    el.levelButtons.forEach(function(btn) {
      var lvl = Number(btn.getAttribute("data-level"));
      btn.classList.toggle("active", lvl === state.level);
      btn.classList.toggle("completed", !!state.completed[lvl]);
      var meta = $("scenario-meta-" + lvl);
      if (meta) meta.textContent = state.completed[lvl] ? "Cleared" : (lvl === state.level ? "Current check" : LEVEL_CONFIGS[lvl].meta);
    });
  }

  function updateCompletion() {
    var cleared = Object.keys(state.completed).length;
    var analysisDone = analysisComplete();
    var analysisLocked = cleared < 3;
    el["completion-trials-status"].textContent = cleared + " / 3";
    el["overall-progress-badge"].textContent = cleared + " / 3 cleared";
    el["completion-trials-item"].classList.toggle("done", cleared === 3);
    el["analysis-card"].classList.toggle("locked", analysisLocked);
    el["analysis-lock-chip"].textContent = analysisLocked ? "Locked" : "Unlocked";
    el["analysis-lock-text"].textContent = analysisLocked ? "Clear all three flight checks to unlock the analysis section." : "Use your recorded approaches to explain the vector addition.";
    el["analysis-fields"].classList.toggle("hidden", analysisLocked);
    el["analysis-fields"].setAttribute("aria-hidden", analysisLocked ? "true" : "false");
    el.analysisInputs.forEach(function(input) { input.disabled = analysisLocked; });
    el["completion-analysis-status"].textContent = analysisDone ? "Complete" : "In Progress";
    el["completion-analysis-item"].classList.toggle("done", analysisDone);
    el["submit-btn"].disabled = state.submitted || !(cleared === 3 && analysisDone);
  }

  function analysisComplete() {
    if (Object.keys(state.completed).length < 3) return false;
    return el.analysisInputs.every(function(input) { return input.value.trim().length >= 12; });
  }

  function resetCurrentLevel() {
    resizeCanvases();
    applyLevelConfig();
  }

  function resetLab() {
    state.level = 1;
    state.score = 0;
    state.completed = {};
    state.flightLog = [];
    state.submitted = false;
    el["submit-btn"].textContent = "Submit Lab";
    el.analysisInputs.forEach(function(input) { input.value = ""; });
    renderFlightLog();
    resetCurrentLevel();
  }

  function getVelocityParts() {
    var airX = Math.sin(state.plane.heading) * state.plane.airspeed;
    var airY = -Math.cos(state.plane.heading) * state.plane.airspeed;
    var windTo = degToRad(state.wind.direction + 180);
    var windX = Math.sin(windTo) * state.wind.speed;
    var windY = -Math.cos(windTo) * state.wind.speed;
    return { airX: airX, airY: airY, windX: windX, windY: windY, groundX: airX + windX, groundY: airY + windY };
  }

  function updateSim() {
    if (state.phase !== "running") return;
    var v = getVelocityParts();
    state.plane.x += v.groundX;
    state.cameraY -= v.groundY;
    state.currentFrame += 1;
    updateUI();

    var c = config();
    var sideMiss = Math.abs(state.plane.x - state.runway.center);
    var forwardMiss = c.targetMode === "point" ? Math.abs(state.cameraY - metersToPixels(c.downrangeMeters)) : 0;
    if (c.targetMode === "straight" && sideMiss > state.runway.width / 2) {
      gameOver(false, c.failMessage);
    } else if (state.currentFrame >= state.maxFrames) {
      var success = c.targetMode === "point"
        ? sideMiss <= metersToPixels(8) && forwardMiss <= metersToPixels(12)
        : sideMiss <= state.runway.width / 2;
      gameOver(success, success ? c.successMessage : c.failMessage);
    }
  }

  function gameOver(success, message) {
    var c = config();
    var heading = radToDeg(state.plane.heading);
    var sideMiss = Math.abs(state.plane.x - state.runway.center);
    var forwardMiss = c.targetMode === "point" ? Math.abs(state.cameraY - metersToPixels(c.downrangeMeters)) : 0;
    state.phase = "ended";
    el["controls-container"].classList.add("hidden");
    el["student-controls-overlay"].classList.add("hidden");
    el["result-modal"].classList.remove("hidden");
    var card = el["result-modal"].querySelector(".result-card");
    card.classList.toggle("success", success);
    card.classList.toggle("fail", !success);
    el["modal-title"].textContent = success ? "Successful Landing" : "Missed Approach";
    el["modal-desc"].textContent = message;

    state.flightLog.unshift({
      level: state.level,
      heading: heading,
      airspeed: state.plane.displayAirspeed,
      wind: state.wind.displaySpeed + " kt from " + state.wind.direction + " deg",
      error: c.targetMode === "point" ? formatPointError(sideMiss, forwardMiss) : formatSideError(sideMiss),
      success: success
    });
    if (state.flightLog.length > 8) state.flightLog.length = 8;

    if (success && !state.completed[state.level]) {
      state.completed[state.level] = true;
      state.score += 100;
    }

    renderFlightLog();
    updateUI();
  }

  function renderFlightLog() {
    if (!state.flightLog.length) {
      el["flight-log-body"].innerHTML = '<tr><td colspan="6">Run an approach to start the notebook.</td></tr>';
      return;
    }
    el["flight-log-body"].innerHTML = state.flightLog.map(function(row) {
      return "<tr>" +
        "<td>Question " + row.level + "</td>" +
        "<td>" + fmt(row.heading, 1) + " deg</td>" +
        "<td>" + row.airspeed + " kt</td>" +
        "<td>" + row.wind + "</td>" +
        "<td>" + row.error + "</td>" +
        '<td><span class="badge-inline ' + (row.success ? "good" : "bad") + '">' + (row.success ? "Cleared" : "Revise") + "</span></td>" +
      "</tr>";
    }).join("");
  }

  function formatSideError(sidePx) {
    return fmt(pixelsToMeters(sidePx), 1) + " m side";
  }

  function formatPointError(sidePx, forwardPx) {
    return fmt(pixelsToMeters(sidePx), 1) + " m side / " + fmt(pixelsToMeters(forwardPx), 1) + " m forward";
  }

  function drawArrow(ctx, fromX, fromY, toX, toY, color, width) {
    var headlen = 12;
    var angle = Math.atan2(toY - fromY, toX - fromX);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  function drawPlane(ctx, x, y, heading) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(heading);
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(7, 8, 16, 31, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#e2e8f0";
    ctx.beginPath();
    ctx.moveTo(0, -5); ctx.lineTo(-45, 12); ctx.lineTo(-45, 20); ctx.lineTo(0, 8); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, -5); ctx.lineTo(45, 12); ctx.lineTo(45, 20); ctx.lineTo(0, 8); ctx.fill();
    ctx.fillStyle = "#64748b";
    ctx.fillRect(-22, 5, 7, 16);
    ctx.fillRect(15, 5, 7, 16);
    ctx.fillStyle = "#cbd5e1";
    ctx.beginPath();
    ctx.moveTo(0, 22); ctx.lineTo(-18, 30); ctx.lineTo(-18, 35); ctx.lineTo(0, 30); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, 22); ctx.lineTo(18, 30); ctx.lineTo(18, 35); ctx.lineTo(0, 30); ctx.fill();
    var gradient = ctx.createLinearGradient(-10, 0, 10, 0);
    gradient.addColorStop(0, "#cbd5e1");
    gradient.addColorStop(0.5, "#ffffff");
    gradient.addColorStop(1, "#94a3b8");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(0, 5, 10, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#0ea5e9";
    ctx.beginPath();
    ctx.moveTo(-5, -15);
    ctx.quadraticCurveTo(0, -22, 5, -15);
    ctx.quadraticCurveTo(0, -12, -5, -15);
    ctx.fill();
    ctx.fillStyle = "#0284c7";
    ctx.beginPath();
    ctx.moveTo(-1, 15); ctx.lineTo(-2, 34); ctx.lineTo(2, 34); ctx.lineTo(1, 15); ctx.fill();
    ctx.restore();
  }

  function drawVectors(ctx) {
    var scale = 30;
    var v = getVelocityParts();
    var x = state.plane.x;
    var y = state.plane.y;
    var airEndX = x + v.airX * scale;
    var airEndY = y + v.airY * scale;
    var windEndX = airEndX + v.windX * scale;
    var windEndY = airEndY + v.windY * scale;
    drawArrow(ctx, x, y, airEndX, airEndY, "rgba(239,68,68,.86)", 3);
    drawArrow(ctx, airEndX, airEndY, windEndX, windEndY, "rgba(96,165,250,.86)", 3);
    if (state.phase !== "setup") drawArrow(ctx, x, y, windEndX, windEndY, "#4ade80", 5);

    if (state.phase === "setup") {
      var framesLeft = state.maxFrames - state.currentFrame;
      var thresholdY = state.plane.y + v.groundY * framesLeft;
      var c = config();
      var targetY = c.targetMode === "point" ? state.plane.y - metersToPixels(c.downrangeMeters) : thresholdY;
      ctx.strokeStyle = "rgba(255,255,255,.42)";
      ctx.setLineDash([8, 8]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (c.targetMode === "straight") {
        ctx.moveTo(state.runway.center, y);
        ctx.lineTo(state.runway.center, thresholdY);
      } else {
        ctx.moveTo(x, y);
        ctx.lineTo(state.runway.center, targetY);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(state.runway.center, targetY, 15, 0, Math.PI * 2);
      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }

  function drawFixedAirspeedVector(ctx) {
    var c = config();
    if (state.phase !== "setup" || c.controlMode !== "angle") return;
    var arrowLength = 76;
    var labelWidth = 112;
    var x = Math.max(172, state.plane.x - 95);
    var y = state.plane.y - 8;
    var dx = Math.sin(state.plane.heading);
    var dy = -Math.cos(state.plane.heading);
    var fromX = x - dx * arrowLength / 2;
    var fromY = y - dy * arrowLength / 2;
    var toX = x + dx * arrowLength / 2;
    var toY = y + dy * arrowLength / 2;
    var labelX = Math.max(labelWidth / 2 + 18, fromX - labelWidth / 2 - 20);
    var labelY = y - 28;

    ctx.save();
    ctx.fillStyle = "rgba(2,6,23,.68)";
    ctx.strokeStyle = "rgba(248,113,113,.34)";
    ctx.lineWidth = 1;
    roundRect(ctx, labelX - labelWidth / 2, labelY, labelWidth, 58, 12);
    ctx.fill();
    ctx.stroke();

    drawArrow(ctx, fromX, fromY, toX, toY, "rgba(239,68,68,.94)", 4);

    ctx.textAlign = "center";
    ctx.fillStyle = "#fecaca";
    ctx.font = "900 11px system-ui, sans-serif";
    ctx.fillText("AIR SPEED", labelX, labelY + 18);
    ctx.fillStyle = "#fee2e2";
    ctx.font = "900 13px system-ui, sans-serif";
    ctx.fillText(state.plane.displayAirspeed + " kt", labelX, labelY + 34);
    ctx.fillStyle = "#fecaca";
    ctx.font = "800 11px system-ui, sans-serif";
    ctx.fillText("ANGLE " + fmt(radToDeg(state.plane.heading), 1) + " deg", labelX, labelY + 50);
    ctx.restore();
  }

  function drawWindCompass(ctx) {
    var cx = 86;
    var cy = 86;
    var r = 48;
    var windTo = degToRad(state.wind.direction + 180);
    var dx = Math.sin(windTo);
    var dy = -Math.cos(windTo);

    ctx.save();
    ctx.fillStyle = "rgba(2,6,23,.62)";
    ctx.strokeStyle = "rgba(255,255,255,.16)";
    ctx.lineWidth = 1;
    roundRect(ctx, 18, 20, 136, 166, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#e2e8f0";
    ctx.font = "900 11px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("WIND", cx, 42);

    ctx.translate(cx, cy);
    ctx.strokeStyle = "rgba(226,232,240,.58)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "rgba(226,232,240,.28)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-r + 8, 0);
    ctx.lineTo(r - 8, 0);
    ctx.moveTo(0, -r + 8);
    ctx.lineTo(0, r - 8);
    ctx.stroke();

    ctx.fillStyle = "#cbd5e1";
    ctx.font = "800 10px system-ui, sans-serif";
    ctx.fillText("N", 0, -r + 15);
    ctx.fillText("S", 0, r - 8);
    ctx.fillText("E", r - 12, 4);
    ctx.fillText("W", -r + 12, 4);

    drawArrow(ctx, -dx * 16, -dy * 16, dx * (r - 11), dy * (r - 11), "rgba(96,165,250,.95)", 4);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = "#dbeafe";
    ctx.font = "900 13px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(state.wind.displaySpeed + " kt", cx, 158);
    ctx.fillStyle = "#bfdbfe";
    ctx.font = "800 11px system-ui, sans-serif";
    ctx.fillText("FROM " + state.wind.direction + " deg", cx, 174);
    ctx.restore();
  }

  function drawSideView() {
    var ctx = el.sideCtx;
    var w = el.sideCanvas.width;
    var h = el.sideCanvas.height;
    ctx.clearRect(0, 0, w, h);
    var sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#0ea5e9");
    sky.addColorStop(1, "#e0f2fe");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);
    var landingY = h - 30;
    var landingX = w * 0.74;
    ctx.fillStyle = "#064e3b";
    ctx.fillRect(0, landingY, w, 30);
    ctx.fillStyle = "#334155";
    ctx.fillRect(landingX - 42, landingY, 260, 30);
    ctx.fillStyle = "#fff";
    ctx.fillRect(landingX - 42, landingY, 10, 30);
    if (state.phase === "setup") {
      ctx.strokeStyle = "rgba(255,255,255,.48)";
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(58, 42);
      ctx.lineTo(landingX, landingY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(landingX, landingY, 8, 0, Math.PI * 2);
      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    var progress = Math.min(state.currentFrame / state.maxFrames, 1);
    var px = 58 + (landingX - 58) * progress;
    var py = 42 + (landingY - 42) * progress;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(-3 * Math.PI / 180);
    ctx.fillStyle = "#475569";
    ctx.fillRect(-12, 8, 3, 10);
    ctx.fillRect(18, 8, 2, 10);
    ctx.fillStyle = "#0f172a";
    ctx.beginPath(); ctx.arc(-11, 18, 5, 0, Math.PI * 2); ctx.arc(19, 18, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#e2e8f0";
    ctx.beginPath();
    ctx.moveTo(25, 0); ctx.quadraticCurveTo(32, 5, 20, 8); ctx.lineTo(-15, 8); ctx.quadraticCurveTo(-32, 6, -35, 0); ctx.lineTo(-35, -4); ctx.lineTo(15, -8); ctx.quadraticCurveTo(25, -8, 25, 0); ctx.fill();
    ctx.fillStyle = "#0284c7";
    ctx.beginPath(); ctx.moveTo(-20, -6); ctx.lineTo(-32, -24); ctx.lineTo(-24, -24); ctx.lineTo(-14, -6); ctx.fill();
    ctx.fillStyle = "#0f172a";
    ctx.beginPath(); ctx.moveTo(18, -6); ctx.lineTo(24, -2); ctx.lineTo(19, -2); ctx.fill();
    ctx.fillStyle = "#cbd5e1";
    ctx.beginPath(); ctx.ellipse(4, 3, 13, 3, -0.1, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawMainView() {
    var ctx = el.ctx;
    var w = el.simCanvas.width;
    var h = el.simCanvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#064e3b";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#334155";
    ctx.fillRect(state.runway.center - state.runway.width / 2, 0, state.runway.width, h);
    ctx.strokeStyle = "#fff";
    ctx.setLineDash([30, 30]);
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(state.runway.center, 0);
    ctx.lineTo(state.runway.center, h);
    ctx.lineDashOffset = -state.cameraY;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 2;
    ctx.strokeRect(state.runway.center - state.runway.width / 2, -10, state.runway.width, h + 20);

    var v = getVelocityParts();
    var thresholdY = state.plane.y + v.groundY * (state.maxFrames - state.currentFrame);
    ctx.fillStyle = "rgba(255,255,255,.9)";
    for (var i = 0; i < 6; i++) {
      var spacing = (state.runway.width - 20) / 5;
      ctx.fillRect(state.runway.center - state.runway.width / 2 + 10 - 6 + i * spacing, thresholdY, 12, 45);
    }

    var windTo = degToRad(state.wind.direction + 180);
    var dustX = Math.sin(windTo) * state.wind.speed;
    var dustY = -Math.cos(windTo) * state.wind.speed;
    ctx.fillStyle = "rgba(255,255,255,.08)";
    for (var d = 0; d < 20; d++) {
      var t = state.phase === "running" ? state.currentFrame : Date.now() / 16;
      var x = ((d * 150 + t * dustX * 2) % (w + 200) + (w + 200)) % (w + 200) - 100;
      var y = ((d * 87 + state.cameraY + t * dustY * 2) % (h + 200) + (h + 200)) % (h + 200) - 100;
      ctx.beginPath();
      ctx.ellipse(x, y, 40, 10, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    if (state.hintOpen) drawVectors(ctx);
    drawFixedAirspeedVector(ctx);
    drawPlane(ctx, state.plane.x, state.plane.y, state.plane.heading);
    drawWindCompass(ctx);
    positionStudentControls();
  }

  function frame() {
    updateSim();
    drawSideView();
    drawMainView();
    window.requestAnimationFrame(frame);
  }

  function openWalkthrough() {
    state.walkthroughStep = 0;
    renderWalkthrough();
    el["walkthrough-overlay"].classList.remove("hidden");
  }

  function renderWalkthrough() {
    var step = walkSteps[state.walkthroughStep];
    el["walk-step-label"].textContent = "Step " + (state.walkthroughStep + 1) + " of " + walkSteps.length;
    el["walk-title"].textContent = step.title;
    el["walk-body"].innerHTML = "<p>" + step.body + "</p>";
    el["walk-prev-btn"].disabled = state.walkthroughStep === 0;
    el["walk-next-btn"].textContent = state.walkthroughStep === walkSteps.length - 1 ? "Close" : "Next";
    el["walk-dots"].innerHTML = walkSteps.map(function(_, index) {
      return '<span class="walk-dot ' + (index === state.walkthroughStep ? "active" : "") + '"></span>';
    }).join("");
  }

  function wireEvents() {
    el["start-lesson-btn"].addEventListener("click", function() {
      el["start-screen"].classList.add("hidden");
      el.app.classList.remove("hidden");
      resetCurrentLevel();
    });
    el.levelButtons.forEach(function(btn) {
      btn.addEventListener("click", function() {
        state.level = Number(btn.getAttribute("data-level"));
        resetCurrentLevel();
      });
    });
    el["heading-slider"].addEventListener("input", function(evt) {
      if (state.phase !== "setup") return;
      setHeadingFromDegrees(evt.target.value);
    });
    el["angle-input"].addEventListener("input", function(evt) {
      if (state.phase !== "setup") return;
      setHeadingFromDegrees(evt.target.value);
    });
    el["airspeed-slider"].addEventListener("input", function(evt) {
      if (state.phase !== "setup") return;
      state.plane.displayAirspeed = Number(evt.target.value);
      state.plane.airspeed = airspeedPixels(state.plane.displayAirspeed);
      updateUI();
    });
    el["engage-btn"].addEventListener("click", function() {
      if (state.phase !== "setup") return;
      state.phase = "running";
      el["controls-container"].classList.add("hidden");
      el["student-controls-overlay"].classList.add("hidden");
    });
    el["retry-btn"].addEventListener("click", resetCurrentLevel);
    el["reset-lab-btn"].addEventListener("click", resetLab);
    el["show-walkthrough"].addEventListener("click", openWalkthrough);
    el["vector-hint-toggle"].addEventListener("click", function() {
      state.hintOpen = !state.hintOpen;
      el["vector-hint-panel"].classList.toggle("hidden", !state.hintOpen);
      el["vector-hint-toggle"].setAttribute("aria-expanded", state.hintOpen ? "true" : "false");
      el["vector-hint-toggle"].textContent = state.hintOpen ? "Hide Vector Hint" : "Show Vector Hint";
      if (state.hintOpen) {
        resizeVectorBreakdownCanvas();
        drawVectorBreakdown();
      }
    });
    el["walk-prev-btn"].addEventListener("click", function() {
      if (state.walkthroughStep > 0) state.walkthroughStep -= 1;
      renderWalkthrough();
    });
    el["walk-next-btn"].addEventListener("click", function() {
      if (state.walkthroughStep >= walkSteps.length - 1) {
        el["walkthrough-overlay"].classList.add("hidden");
      } else {
        state.walkthroughStep += 1;
        renderWalkthrough();
      }
    });
    el["walkthrough-overlay"].addEventListener("click", function(evt) {
      if (evt.target === el["walkthrough-overlay"]) el["walkthrough-overlay"].classList.add("hidden");
    });
    el.analysisInputs.forEach(function(input) {
      input.addEventListener("input", updateCompletion);
    });
    el["submit-btn"].addEventListener("click", function() {
      state.submitted = true;
      if (window.SCORM) {
        window.SCORM.setScore(100, 0, 100);
        window.SCORM.setStatus("completed");
      }
      el["submit-btn"].textContent = "Submitted";
      updateUI();
    });
    window.addEventListener("resize", resetCurrentLevel);
  }

  function init() {
    cacheElements();
    wireEvents();
    resizeCanvases();
    applyLevelConfig();
    renderFlightLog();
    updateCompletion();
    frame();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
}());
