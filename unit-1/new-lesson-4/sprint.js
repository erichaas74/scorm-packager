/* ═════════════════════════════════════════════════════════════════════════
   sprint.js  ─ Level 3 Graphics: Elite Sprint scene
   ─────────────────────────────────────────────────────────────────────────
   Self-contained canvas-drawing module for the sprint scenario.
   Includes: scrolling parallax track, two animated runners, starter
   official with muzzle flash, dynamic camera zoom, raised "set" pose,
   and the distance HUD.

   Public API (window.SprintGfx):
     draw(ctx, w, h, rc, signal)
       Render one frame of the sprint scene.
       rc       race context  → { greenTime, now,
                                   opponentDist, playerDist,
                                   opponentLaunched, playerLaunched,
                                   playerReactionTime }
       signal   string        → used to detect "set" command

   Reads from window.SimShared:
     muzzleFlashStart  - timestamp set by sim.js when starter gun fires
   ═════════════════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  /* ── Shared state pulled from sim.js ──────────────────────────────────── */
  function shared() { return global.SimShared || {}; }

  /* ── Local copies of sim-wide constants used here ─────────────────────── */
  var RUNNER_ACCEL          = 6.0;
  var RUNNER_TOP_SPEED      = 10.0;
  var MUZZLE_FLASH_DURATION = 250;  // ms

  /* ── Local math helpers ───────────────────────────────────────────────── */
  function clamp(v, min, max)  { return Math.max(min, Math.min(max, v)); }
  function lerp(a, b, t)       { return a + (b - a) * t; }
  function smoothstep(t)       { return t * t * (3 - 2 * t); }

  /* ── Runner config ────────────────────────────────────────────────────── */
  var RUNNER_CFG = {
    bodyScale: 1.28,
    runnerYOffset: 11,

    hipBaseX: -102,
    hipBaseY: -84,

    shoulderOffX: 81,
    shoulderOffY: 19,
    shoulderReduce: 56,
    shoulderLift: 76,

    neckOffX: 20,
    neckOffY: -4,
    neckReduce: 10,
    neckLift: 12,

    headOffX: 16.5,
    headOffY: -4,
    headReduce: 17,
    headLift: 9,

    headRx: 14.5,
    headRy: 18,
    hairR: 15,
    neckW: 12.5,

    upperArmW: 12.5,
    lowerArmW: 10.5,
    upperLegW: 20,
    lowerLegW: 12,

    riseDur: 1.0,
    phaseDelay: 0.04,
    phaseBase: 8.7,
    phaseGain: 2.0,
    blendDur: 0.24,

    torsoLeanAmt: 0.99,
    torsoLeanDist: 19.5,

    hipFwd: 43,
    hipDrop: 12,

    legBase: 0.60,
    thighAmp: 1.18,
    shinBase: 1.10,
    shinPush: 0.14,

    armSwing: 1.23,
    elbowBase: 1.28,
    elbowGain: 0.90,

    footBase: 0.15,
    footGain: -0.18,
    footRecover: -0.44,
    footPhase: 0.42,

    upperArmL: 26,
    lowerArmL: 24,
    upperLegL: 41,
    lowerLegL: 39,
    footL: 18,

    primary: '#3f67c6',
    skin: '#ac7850',
    shoe: '#edf2ff',
    hair: '#121212',
    shadow: 'rgba(0,0,0,0.18)'
  };

  var opponentCfg = null;
  var playerCfg = null;

  function buildRunnerCfg(overrides) {
    var cfg = {};
    for (var k in RUNNER_CFG) {
      if (RUNNER_CFG.hasOwnProperty(k)) cfg[k] = RUNNER_CFG[k];
    }
    if (overrides) {
      for (var j in overrides) {
        if (overrides.hasOwnProperty(j)) cfg[j] = overrides[j];
      }
    }
    return cfg;
  }

  function initRunnerCfgs() {
    opponentCfg = buildRunnerCfg({
      bodyScale: 0.96,
      runnerYOffset: 8,
      primary: '#7a8797',
      skin: '#b8c2cc',
      shoe: '#222831',
      hair: '#111827',
      isRobot: true,
      metalLight: '#cbd5e1',
      metalMid: '#94a3b8',
      metalDark: '#475569',
      robotJoint: '#1f2937',
      robotEye: '#38bdf8'
    });

   playerCfg = buildRunnerCfg({
  bodyScale: 1.08,
  primary: '#c23616',
  skin: '#c38762',
  shoe: '#f8fafc',
  hair: '#2b160f',
  hairStyle: 'short',
  mouthStyle: 'gritted', // Try 'open' or 'smirk'
  // Human-only detail colors
  isRobot: false,
  shirtLight: '#e85d3f',
  shirtDark: '#7f1d1d',
  shorts: '#111827',
  sock: '#f8fafc',
  shoeAccent: '#111827',
  outline: 'rgba(20,20,30,0.45)'
});
  }
  /* ── Pose helpers ─────────────────────────────────────────────────────── */
  function ptVert(base, len, angle) {
    return {
      x: base.x + Math.sin(angle) * len,
      y: base.y + Math.cos(angle) * len
    };
  }

  function mixPose(a, b, t) {
    var out = {};
    for (var k in a) {
      if (a.hasOwnProperty(k)) {
        out[k] = {
          x: lerp(a[k].x, b[k].x, t),
          y: lerp(a[k].y, b[k].y, t)
        };
      }
    }
    return out;
  }

  function getSetPose(cfg) {
    return {
      frontHand: { x: -4, y: 0 },
      backHand: { x: -31, y: 1 },

      shoulder: { x: -36, y: -58 },
      neck: { x: -14, y: -62 },
      head: { x: 5, y: -74 },

      hip: { x: cfg.hipBaseX, y: cfg.hipBaseY },

      frontElbow: { x: -16, y: -32 },
      backElbow: { x: -50, y: -35 },

      frontKnee: { x: -73, y: -30 },
      frontAnkle: { x: -99, y: -5 },
      frontToe: { x: -117, y: 1 },

      backKnee: { x: -125, y: -42 },
      backAnkle: { x: -147, y: -16 },
      backToe: { x: -158, y: -13 }
    };
  }

  function getRaisedSetPose(cfg) {
    return {
      // Hands stay braced on the ground.
      frontHand: { x: -4, y: 0 },
      backHand: { x: -31, y: 1 },

      // Shoulders and head lift slightly.
      shoulder: { x: -30, y: -67 },
      neck: { x: -10, y: -76 },
      head: { x: 7, y: -88 },

      // Main visual change: hips rise and move forward.
      hip: { x: cfg.hipBaseX + 24, y: cfg.hipBaseY - 30 },

      // Arms become more braced.
      frontElbow: { x: -13, y: -36 },
      backElbow: { x: -46, y: -40 },

      // Legs load up into a stronger starting position.
      frontKnee: { x: -72, y: -43 },
      frontAnkle: { x: -99, y: -6 },
      frontToe: { x: -117, y: 0 },

      backKnee: { x: -118, y: -62 },
      backAnkle: { x: -146, y: -17 },
      backToe: { x: -158, y: 0 }
    };
  }

  var SET_RAISE_DURATION = 350; // ms
  var setPoseStartTime = 0;
  var wasSetSignal = false;

  function isSetSignal(signal) {
    var txt = String(signal || '').toLowerCase();

    // Matches "set", "SET!", "get set", etc.
    // Does not accidentally match "reset".
    return /\bset\b/.test(txt);
  }

  function getSetRaiseBlend(signal, rc) {
    var now = rc && rc.now ? rc.now : 0;

    // Once the gun has fired, keep them raised until running animation takes over.
    if (rc && rc.greenTime > 0) return 1;

    var setNow = isSetSignal(signal);

    if (setNow && !wasSetSignal) {
      setPoseStartTime = now;
    }

    if (!setNow) {
      wasSetSignal = false;
      setPoseStartTime = 0;
      return 0;
    }

    wasSetSignal = true;

    var t = setPoseStartTime > 0
      ? clamp((now - setPoseStartTime) / SET_RAISE_DURATION, 0, 1)
      : 1;

    return smoothstep(t);
  }

  function getRunnerDistance(t) {
    var tAccel = RUNNER_TOP_SPEED / RUNNER_ACCEL;
    if (t <= tAccel) return 0.5 * RUNNER_ACCEL * t * t;
    return (0.5 * RUNNER_ACCEL * tAccel * tAccel) + RUNNER_TOP_SPEED * (t - tAccel);
  }

  function clampToe(knee, ankle, toe) {
    if (toe.y <= 0) return { knee: knee, ankle: ankle, toe: toe };

    var s = toe.y;
    return {
      knee: { x: knee.x, y: knee.y - s },
      ankle: { x: ankle.x, y: ankle.y - s },
      toe: { x: toe.x, y: 0 }
    };
  }

  /* ── Pose calculation ─────────────────────────────────────────────────── */
  function calcPose(t, cfg) {
    var dist = getRunnerDistance(t);
    var rise = smoothstep(clamp(t / cfg.riseDur, 0, 1));
    var phase = Math.max(0, t - cfg.phaseDelay) * (cfg.phaseBase + cfg.phaseGain * rise);

    var hip = {
      x: cfg.hipBaseX + cfg.hipFwd * rise,
      y: cfg.hipBaseY + cfg.hipDrop * rise
    };

    var shoulder = {
      x: hip.x + cfg.shoulderOffX - cfg.shoulderReduce * rise,
      y: hip.y + cfg.shoulderOffY - cfg.shoulderLift * rise
    };

    var neck = {
      x: shoulder.x + cfg.neckOffX - cfg.neckReduce * rise,
      y: shoulder.y + cfg.neckOffY - cfg.neckLift * rise
    };

    var head = {
      x: neck.x + cfg.headOffX - cfg.headReduce * rise,
      y: neck.y + cfg.headOffY - cfg.headLift * rise
    };

    var lean = Math.max(0, 1 - dist / cfg.torsoLeanDist) * cfg.torsoLeanAmt;

    function leg(drive, sidePhase) {
      var thA = cfg.legBase + cfg.thighAmp * drive;
      var shA = thA - Math.max(0.10, cfg.shinBase - cfg.shinPush * Math.max(0, drive));

      var knee = ptVert(hip, cfg.upperLegL, thA);
      var ankle = ptVert(knee, cfg.lowerLegL, shA);

      var fd = Math.sin(sidePhase + cfg.footPhase);
      var fa = cfg.footBase + cfg.footGain * fd - cfg.footRecover * Math.max(0, -fd);

      var toe = {
        x: ankle.x + Math.cos(fa) * cfg.footL,
        y: ankle.y + Math.sin(fa) * cfg.footL + 2
      };

      return clampToe(knee, ankle, toe);
    }

    function arm(drive) {
      var uaA = cfg.armSwing * drive - lean;

      var elbow = {
        x: shoulder.x + Math.sin(uaA) * cfg.upperArmL,
        y: shoulder.y + Math.cos(uaA) * cfg.upperArmL
      };

      var laA = uaA + cfg.elbowBase + cfg.elbowGain * drive;

      var hand = {
        x: elbow.x + Math.sin(laA) * cfg.lowerArmL,
        y: elbow.y + Math.cos(laA) * cfg.lowerArmL
      };

      return { elbow: elbow, hand: hand };
    }

    var fDrive = Math.sin(phase);
    var bDrive = Math.sin(phase + Math.PI);

    var fLeg = leg(fDrive, phase);
    var bLeg = leg(bDrive, phase + Math.PI);

    var fArm = arm(-fDrive);
    var bArm = arm(-bDrive);

    return {
      shoulder: shoulder,
      neck: neck,
      head: head,
      hip: hip,

      frontHand: fArm.hand,
      backHand: bArm.hand,

      frontElbow: fArm.elbow,
      backElbow: bArm.elbow,

      frontKnee: fLeg.knee,
      frontAnkle: fLeg.ankle,
      frontToe: fLeg.toe,

      backKnee: bLeg.knee,
      backAnkle: bLeg.ankle,
      backToe: bLeg.toe
    };
  }

  /* ── Drawing primitives ───────────────────────────────────────────────── */
  function drawLimb(ctx, a, b, color, wA, wB) {
    var dx = b.x - a.x;
    var dy = b.y - a.y;
    var len = Math.hypot(dx, dy);
    var angle = Math.atan2(dy, dx);

    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(angle);

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, -wA / 2);
    ctx.quadraticCurveTo(len * 0.5, -Math.max(wA, wB) * 0.55, len, -wB / 2);
    ctx.lineTo(len, wB / 2);
    ctx.quadraticCurveTo(len * 0.5, Math.max(wA, wB) * 0.55, 0, wA / 2);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

 function drawShoe(ctx, ankle, toe, cfg) {
  var angle = Math.atan2(toe.y - ankle.y, toe.x - ankle.x);
  var cx = (ankle.x + toe.x) * 0.5;
  var cy = (ankle.y + toe.y) * 0.5 - 1;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  // Robot foot is handled separately if you added the robot CPU code.
  if (cfg.isRobot) {
    ctx.fillStyle = cfg.metalDark || '#475569';
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 1.3;

    ctx.beginPath();
    ctx.moveTo(-10, -4);
    ctx.lineTo(8, -5);
    ctx.lineTo(15, 1);
    ctx.lineTo(9, 5);
    ctx.lineTo(-12, 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = cfg.robotEye || '#38bdf8';
    ctx.fillRect(4, -1, 5, 2);

    ctx.restore();
    return;
  }

  // Human running shoe
  ctx.fillStyle = cfg.shoe || '#f8fafc';
  ctx.strokeStyle = cfg.outline || 'rgba(20,20,30,0.45)';
  ctx.lineWidth = 1.2;

  ctx.beginPath();
  ctx.moveTo(-11, -4);
  ctx.quadraticCurveTo(0, -7, 10, -4);
  ctx.quadraticCurveTo(16, -2, 18, 2);
  ctx.quadraticCurveTo(7, 6, -12, 5);
  ctx.quadraticCurveTo(-15, 1, -11, -4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Sole
  ctx.fillStyle = cfg.shoeAccent || '#111827';
  ctx.beginPath();
  ctx.moveTo(-12, 3);
  ctx.lineTo(17, 2);
  ctx.lineTo(15, 5);
  ctx.lineTo(-10, 6);
  ctx.closePath();
  ctx.fill();

  // Lace stripe
  ctx.strokeStyle = 'rgba(0,0,0,0.22)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-3, -2);
  ctx.lineTo(7, -3);
  ctx.stroke();

  ctx.restore();
}

  function drawHand(ctx, hand, elbow, skin) {
    var angle = Math.atan2(hand.y - elbow.y, hand.x - elbow.x);

    ctx.save();
    ctx.translate(hand.x, hand.y);
    ctx.rotate(angle);

    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.ellipse(0, 0, 5, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function robotRoundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function drawRobotSegment(ctx, a, b, w, fill, stroke) {
    var dx = b.x - a.x;
    var dy = b.y - a.y;
    var len = Math.hypot(dx, dy);
    if (len < 0.1) return;

    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(Math.atan2(dy, dx));

    ctx.fillStyle = fill || '#94a3b8';
    ctx.strokeStyle = stroke || '#1f2937';
    ctx.lineWidth = 1.3;
    robotRoundRect(ctx, 0, -w / 2, len, w, w / 3);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(4, -w * 0.22);
    ctx.lineTo(Math.max(4, len - 4), -w * 0.22);
    ctx.stroke();

    ctx.restore();
  }

  function drawRobotJoint(ctx, p, r, cfg) {
    ctx.fillStyle = cfg.robotJoint || '#1f2937';
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = cfg.metalLight || '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r * 0.55, 0, Math.PI * 2);
    ctx.stroke();
  }

  function drawRobotFoot(ctx, ankle, toe, cfg) {
    var angle = Math.atan2(toe.y - ankle.y, toe.x - ankle.x);
    var cx = (ankle.x + toe.x) * 0.5;
    var cy = (ankle.y + toe.y) * 0.5 - 1;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    ctx.fillStyle = cfg.metalDark || '#475569';
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(-10, -4);
    ctx.lineTo(8, -5);
    ctx.lineTo(15, 1);
    ctx.lineTo(9, 5);
    ctx.lineTo(-12, 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = cfg.robotEye || '#38bdf8';
    ctx.fillRect(4, -1, 5, 2);

    ctx.restore();
  }

  function drawLeg(ctx, hip, knee, ankle, toe, cfg) {
  if (cfg.isRobot) {
    drawRobotSegment(ctx, hip, knee, cfg.upperLegW * 0.72, cfg.metalMid, '#1f2937');
    drawRobotSegment(ctx, knee, ankle, cfg.lowerLegW * 0.85, cfg.metalLight, '#1f2937');

    drawRobotJoint(ctx, hip, 6, cfg);
    drawRobotJoint(ctx, knee, 6, cfg);
    drawRobotJoint(ctx, ankle, 5, cfg);

    drawRobotFoot(ctx, ankle, toe, cfg);
    return;
  }

  var thighMid = {
    x: lerp(hip.x, knee.x, 0.52),
    y: lerp(hip.y, knee.y, 0.52)
  };

  var shinMid = {
    x: lerp(knee.x, ankle.x, 0.55),
    y: lerp(knee.y, ankle.y, 0.55)
  };

  // Shorts / upper thigh
  drawLimb(ctx, hip, thighMid, cfg.shorts || cfg.primary, cfg.upperLegW * 1.02, cfg.upperLegW * 0.8);

  // --- NEW: Knee joint connector drawn behind the skin limbs ---
  ctx.fillStyle = cfg.skin;
  ctx.beginPath();
  ctx.arc(knee.x, knee.y, cfg.lowerLegW * 0.55, 0, Math.PI * 2);
  ctx.fill();

  // Skin thigh
  drawLimb(ctx, thighMid, knee, cfg.skin, cfg.upperLegW * 0.78, cfg.upperLegW * 0.62);

  // Lower leg / calf
  drawLimb(ctx, knee, shinMid, cfg.skin, cfg.lowerLegW * 1.08, cfg.lowerLegW * 0.78);
  drawLimb(ctx, shinMid, ankle, cfg.skin, cfg.lowerLegW * 0.78, cfg.lowerLegW * 0.52);

  // Knee detail
  ctx.fillStyle = 'rgba(120,70,45,0.22)';
  ctx.beginPath();
  ctx.ellipse(knee.x, knee.y, 4.2, 3.1, 0, 0, Math.PI * 2);
  ctx.fill();

  // Sock
  var sockTop = {
    x: lerp(knee.x, ankle.x, 0.72),
    y: lerp(knee.y, ankle.y, 0.72)
  };

  drawLimb(ctx, sockTop, ankle, cfg.sock || '#f8fafc', cfg.lowerLegW * 0.55, cfg.lowerLegW * 0.45);

  drawShoe(ctx, ankle, toe, cfg);
}

 function drawArm(ctx, shoulder, elbow, hand, cfg) {
  if (cfg.isRobot) {
    drawRobotSegment(ctx, shoulder, elbow, cfg.upperArmW * 0.75, cfg.metalLight, '#1f2937');
    drawRobotSegment(ctx, elbow, hand, cfg.lowerArmW * 0.75, cfg.metalMid, '#1f2937');

    drawRobotJoint(ctx, shoulder, 5, cfg);
    drawRobotJoint(ctx, elbow, 5, cfg);
    drawRobotJoint(ctx, hand, 4, cfg);

    return;
  }

  // Small shirt sleeve
  var sleeveEnd = {
    x: lerp(shoulder.x, elbow.x, 0.32),
    y: lerp(shoulder.y, elbow.y, 0.32)
  };

  drawLimb(ctx, shoulder, sleeveEnd, cfg.primary, cfg.upperArmW * 1.02, cfg.upperArmW * 0.9);

  // --- NEW: Elbow joint connector drawn behind the skin limbs ---
  ctx.fillStyle = cfg.skin;
  ctx.beginPath();
  ctx.arc(elbow.x, elbow.y, cfg.lowerArmW * 0.45, 0, Math.PI * 2);
  ctx.fill();

  // Upper arm
  drawLimb(ctx, sleeveEnd, elbow, cfg.skin, cfg.upperArmW * 0.86, cfg.upperArmW * 0.72);

  // Forearm
  drawLimb(ctx, elbow, hand, cfg.skin, cfg.lowerArmW * 0.86, cfg.lowerArmW * 0.58);

  // Elbow detail
  ctx.fillStyle = 'rgba(120,70,45,0.22)';
  ctx.beginPath();
  ctx.ellipse(elbow.x, elbow.y, 3.4, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();

  drawHand(ctx, hand, elbow, cfg.skin);
}

  function drawTorso(ctx, pose, cfg) {
  var sx = pose.shoulder.x;
  var sy = pose.shoulder.y;
  var hx = pose.hip.x;
  var hy = pose.hip.y + 7;

  var dx = hx - sx;
  var dy = hy - sy;

  var nx = -dy;
  var ny = dx;

  var len = Math.hypot(dx, dy) || 1;
  nx /= len;
  ny /= len;

  if (cfg.isRobot) {
    var robotTopW = 15;
    var robotBotW = 12;

    ctx.fillStyle = cfg.metalDark || '#475569';
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(sx + nx * robotTopW, sy + ny * robotTopW);
    ctx.lineTo(hx + nx * robotBotW, hy + ny * robotBotW);
    ctx.lineTo(hx - nx * robotBotW, hy - ny * robotBotW);
    ctx.lineTo(sx - nx * robotTopW, sy - ny * robotTopW);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    var panelX = lerp(sx, hx, 0.42);
    var panelY = lerp(sy, hy, 0.42);

    ctx.fillStyle = cfg.metalLight || '#cbd5e1';
    ctx.beginPath();
    ctx.ellipse(panelX, panelY, 9, 6, Math.atan2(dy, dx), 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = cfg.robotEye || '#38bdf8';
    ctx.beginPath();
    ctx.arc(panelX + 3, panelY, 2.2, 0, Math.PI * 2);
    ctx.fill();

    return;
  }

  // Human torso
  var topW = 14;
  var botW = 10;
  var chestW = 18;

  var mx = lerp(sx, hx, 0.35);
  var my = lerp(sy, hy, 0.35);

  // Shirt outline
  ctx.fillStyle = cfg.primary;
  ctx.strokeStyle = cfg.outline || 'rgba(20,20,30,0.45)';
  ctx.lineWidth = 1.2;

  ctx.beginPath();
  ctx.moveTo(sx + nx * topW, sy + ny * topW);
  ctx.quadraticCurveTo(mx + nx * chestW, my + ny * chestW, hx + nx * botW, hy + ny * botW);
  ctx.quadraticCurveTo(hx - nx * botW * 0.25, hy - ny * botW * 0.25, hx - nx * botW, hy - ny * botW);
  ctx.quadraticCurveTo(mx - nx * chestW * 0.65, my - ny * chestW * 0.65, sx - nx * topW * 0.8, sy - ny * topW * 0.8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Shirt highlight stripe
  ctx.strokeStyle = cfg.shirtLight || 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(sx + nx * 3, sy + ny * 3);
  ctx.quadraticCurveTo(mx + nx * 5, my + ny * 5, hx + nx * 3, hy + ny * 3);
  ctx.stroke();

  // Dark side stripe
  ctx.strokeStyle = cfg.shirtDark || 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(sx - nx * 9, sy - ny * 9);
  ctx.quadraticCurveTo(mx - nx * 10, my - ny * 10, hx - nx * 7, hy - ny * 7);
  ctx.stroke();

  // Small chest bib patch
  var bibX = lerp(sx, hx, 0.42);
  var bibY = lerp(sy, hy, 0.42);

  ctx.save();
  ctx.translate(bibX, bibY);
  ctx.rotate(Math.atan2(dy, dx) - Math.PI / 2);

  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 0.8;

  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(-7, -4, 14, 8, 2) : ctx.rect(-7, -4, 14, 8);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

  function drawHead(ctx, pose, cfg) {
    if (cfg.isRobot) {
      var rx = pose.head.x;
      var ry = pose.head.y;

      ctx.fillStyle = cfg.robotJoint || '#1f2937';
      ctx.beginPath();
      ctx.arc(pose.neck.x, pose.neck.y, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = cfg.metalLight || '#cbd5e1';
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 1.5;

      robotRoundRect(ctx, rx - 13, ry - 13, 26, 24, 5);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#111827';
      robotRoundRect(ctx, rx - 9, ry - 6, 18, 8, 3);
      ctx.fill();

      ctx.fillStyle = cfg.robotEye || '#38bdf8';
      ctx.beginPath();
      ctx.arc(rx - 4, ry - 2, 1.8, 0, Math.PI * 2);
      ctx.arc(rx + 4, ry - 2, 1.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = cfg.robotJoint || '#1f2937';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(rx, ry - 13);
      ctx.lineTo(rx + 4, ry - 22);
      ctx.stroke();

      ctx.fillStyle = cfg.robotEye || '#38bdf8';
      ctx.beginPath();
      ctx.arc(rx + 4, ry - 23, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = cfg.robotJoint || '#1f2937';
      ctx.fillRect(rx - 16, ry - 5, 4, 8);
      ctx.fillRect(rx + 12, ry - 5, 4, 8);

      return;
    }

    var x = pose.head.x;
    var y = pose.head.y;

    // Base Head
    ctx.fillStyle = cfg.skin;
    ctx.strokeStyle = 'rgba(20, 10, 5, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(x, y, cfg.headRx, cfg.headRy, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Hair
    ctx.fillStyle = cfg.hair || '#1a110b';
    ctx.beginPath();
    if (cfg.hairStyle === 'short') {
      // Top dome of the buzzcut
      ctx.arc(x, y - 5, cfg.hairR * 0.95, Math.PI * 1.0, Math.PI * 2.0);
      // Drop down to the front edge of the forehead (higher up)
      ctx.lineTo(x + 13.5, y - 8.5);
      // Horizontal line moving back towards the eye
      ctx.lineTo(x - 0.5, y - 8.5);
      // Soft rounded outer corner of the step
      ctx.quadraticCurveTo(x - 2.5, y - 8.5, x - 2.5, y - 6.5);
      // Vertical drop
      ctx.lineTo(x - 2.5, y - 3.5);
      // Soft rounded inner corner leading to the ear
      ctx.quadraticCurveTo(x - 2.5, y - 1.5, x - 4.5, y - 1.5);
      // Horizontal line moving back over the ear
      ctx.lineTo(x - 13, y - 1.5);
    } else {
      // Original swoop hair fallback
      ctx.arc(x, y - 5, cfg.hairR, Math.PI * 0.95, Math.PI * 2.05);
      ctx.quadraticCurveTo(x + 8, y - 16, x + 13, y - 4);
      ctx.quadraticCurveTo(x + 2, y - 8, x - 12, y - 2);
    }
    ctx.closePath();
    ctx.fill();

    // Detailed Ear (Smaller)
    ctx.fillStyle = cfg.skin;
    ctx.strokeStyle = 'rgba(20, 10, 5, 0.4)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.ellipse(x - 11.5, y + 1, 2.8, 4, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Inner ear detail
    ctx.strokeStyle = 'rgba(20, 10, 5, 0.35)';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(x - 12.5, y - 1.5);
    ctx.quadraticCurveTo(x - 10.5, y - 2.5, x - 9.8, y + 0.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 11.5, y + 1);
    ctx.lineTo(x - 10.5, y + 1.5);
    ctx.lineTo(x - 11, y + 2.8);
    ctx.stroke();

    // Eye
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.arc(x + 4, y - 2, 1.4, 0, Math.PI * 2);
    ctx.fill();
    
    // Brow
    ctx.strokeStyle = '#1a110b';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x + 2, y - 5);
    ctx.lineTo(x + 8, y - 4);
    ctx.stroke();

    // Detailed Nose (Smaller)
    ctx.strokeStyle = 'rgba(20, 10, 5, 0.5)';
    ctx.lineWidth = 1.2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x + 9, y - 1);
    ctx.quadraticCurveTo(x + 12, y + 0.5, x + 12, y + 3);
    ctx.quadraticCurveTo(x + 10, y + 4.5, x + 8, y + 4);
    ctx.stroke();

    // Nostril
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(x + 8.5, y + 1.8);
    ctx.quadraticCurveTo(x + 10.5, y + 2.5, x + 10, y + 3.8);
    ctx.stroke();

    // Dynamic Mouth Styles
    if (cfg.mouthStyle === 'open') {
      // Open mouth (heavy breathing)
      ctx.fillStyle = 'rgba(40, 20, 15, 0.9)'; 
      ctx.strokeStyle = 'rgba(20, 10, 5, 0.5)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.ellipse(x + 7, y + 8.5, 3.5, 2.5, -0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Hint of top teeth
      ctx.fillStyle = '#e5e7eb';
      ctx.beginPath();
      ctx.ellipse(x + 7, y + 7.5, 2.5, 1, -0.15, Math.PI, 0); 
      ctx.fill();

    } else if (cfg.mouthStyle === 'gritted') {
      // Gritted teeth
      ctx.fillStyle = '#e5e7eb'; 
      ctx.strokeStyle = 'rgba(20, 10, 5, 0.8)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(x + 4, y + 7.5);
      ctx.quadraticCurveTo(x + 7, y + 7, x + 11, y + 7.5);
      ctx.lineTo(x + 10.5, y + 9.5); 
      ctx.quadraticCurveTo(x + 7, y + 10, x + 4, y + 9.5); 
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Center line between teeth
      ctx.strokeStyle = 'rgba(20, 10, 5, 0.4)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(x + 4.2, y + 8.5);
      ctx.quadraticCurveTo(x + 7, y + 8.5, x + 10.5, y + 8.5);
      ctx.stroke();

    } else if (cfg.mouthStyle === 'smirk') {
      // Confident smirk
      ctx.strokeStyle = 'rgba(20, 10, 5, 0.6)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x + 3, y + 8);
      ctx.quadraticCurveTo(x + 6, y + 9.5, x + 11, y + 6); 
      ctx.stroke();

      // Dimple crease
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(x + 11.5, y + 5);
      ctx.lineTo(x + 10.5, y + 7.5);
      ctx.stroke();

    } else {
      // Fallback / focused mouth
      ctx.strokeStyle = 'rgba(20, 10, 5, 0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + 3, y + 8);
      ctx.quadraticCurveTo(x + 7, y + 9, x + 11, y + 7);
      ctx.stroke();
    }
  }
  /* ── Composite runner draw ────────────────────────────────────────────── */
  function drawRunner(ctx, x, groundY, localT, cfg, setRaiseBlend) {
    var runPose = calcPose(localT, cfg);

    var crouchPose = getSetPose(cfg);
    var raisedPose = getRaisedSetPose(cfg);

    var startPose = mixPose(
      crouchPose,
      raisedPose,
      clamp(setRaiseBlend || 0, 0, 1)
    );

    // Once launched, blend from the current start pose into the running pose.
    var runBlend = smoothstep(clamp(localT / cfg.blendDur, 0, 1));
    var pose = mixPose(startPose, runPose, runBlend);
    ctx.save();
    ctx.translate(x, groundY + cfg.runnerYOffset);
    ctx.scale(cfg.bodyScale, cfg.bodyScale);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.fillStyle = cfg.shadow;
    ctx.beginPath();
    ctx.ellipse(-78, 4, 86, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    drawArm(ctx, pose.shoulder, pose.backElbow, pose.backHand, cfg);
    drawLeg(ctx, pose.hip, pose.backKnee, pose.backAnkle, pose.backToe, cfg);
    drawTorso(ctx, pose, cfg);
    drawLeg(ctx, pose.hip, pose.frontKnee, pose.frontAnkle, pose.frontToe, cfg);
    drawArm(ctx, pose.shoulder, pose.frontElbow, pose.frontHand, cfg);

    if (cfg.isRobot) {
      drawRobotSegment(
        ctx,
        { x: pose.shoulder.x + 2, y: pose.shoulder.y - 1 },
        pose.neck,
        cfg.neckW * 0.7,
        cfg.metalMid,
        '#1f2937'
      );
    } else {
      drawLimb(
        ctx,
        { x: pose.shoulder.x + 2, y: pose.shoulder.y - 1 },
        pose.neck,
        cfg.skin,
        cfg.neckW,
        cfg.neckW * 0.8
      );
    }

    drawHead(ctx, pose, cfg);

    ctx.restore();

  }

  /* ── Scrolling track constants ────────────────────────────────────────── */
  var TRACK_DISTANCE = 50;          // meters
  var BASE_VIEWPORT_METERS = 20;    // normal zoom level
  var MAX_VIEWPORT_METERS = 95;     // zooms out enough to keep both runners visible

  var VIRT_W = 800;
  var VIRT_H = 400;

  // Runner anchor padding.
  // Left padding is larger because the crouched runner extends far behind its anchor.
  var LEFT_RUNNER_PAD_PX = 220;
  var RIGHT_RUNNER_PAD_PX = 140;

  var TRACK_TOP_Y = 285;
  var LANE1_Y = 315;
  var LANE2_Y = 355;

  function getDynamicCamera(playerDist, opponentDist) {
    var minDist = Math.min(playerDist, opponentDist);
    var maxDist = Math.max(playerDist, opponentDist);
    var spread = Math.max(0, maxDist - minDist);

    var availablePx = VIRT_W - LEFT_RUNNER_PAD_PX - RIGHT_RUNNER_PAD_PX;

    // If runners are far apart, widen the visible meters.
    var neededViewMeters = spread * (VIRT_W / availablePx);

    var viewMeters = clamp(
      Math.max(BASE_VIEWPORT_METERS, neededViewMeters),
      BASE_VIEWPORT_METERS,
      MAX_VIEWPORT_METERS
    );

    var trackPPM = VIRT_W / viewMeters;

    // Start by trying to keep the lead runner around 30% from the left.
    var leadDist = maxDist;
    var desiredCam = leadDist - viewMeters * 0.30;

    // Force both runner anchors to stay inside safe screen margins.
    var minCamForRightRunner = maxDist - (VIRT_W - RIGHT_RUNNER_PAD_PX) / trackPPM;
    var maxCamForLeftRunner = minDist - LEFT_RUNNER_PAD_PX / trackPPM;

    var cameraM = clamp(desiredCam, minCamForRightRunner, maxCamForLeftRunner);

    // Keep camera inside a reasonable track range.
    var trackMinCam = -LEFT_RUNNER_PAD_PX / trackPPM;
    var trackMaxCam = TRACK_DISTANCE - (VIRT_W - RIGHT_RUNNER_PAD_PX) / trackPPM;

    if (trackMinCam <= trackMaxCam) {
      cameraM = clamp(cameraM, trackMinCam, trackMaxCam);
    }

    return {
      cameraM: cameraM,
      trackPPM: trackPPM,
      viewMeters: viewMeters
    };
  }
  /* ── Draw scrolling track background each frame ───────────────────────── */
  function drawScrollingTrack(ctx, cameraM, trackPPM) {
    // Sky
    var sky = ctx.createLinearGradient(0, 0, 0, 280);
    sky.addColorStop(0, '#4a90d9');
    sky.addColorStop(0.6, '#87CEEB');
    sky.addColorStop(1, '#b8dff5');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, VIRT_W, 280);

    // Clouds scroll at 10% parallax.
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    var cx = -(cameraM * trackPPM * 0.10) % (VIRT_W + 200);

    ctx.beginPath();
    ctx.ellipse(130 + cx, 60, 70, 22, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(160 + cx, 55, 50, 18, 0.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(520 + cx, 90, 60, 20, -0.05, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(550 + cx, 85, 45, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(720 + cx, 45, 55, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Treeline at 30% parallax.
    var tx = -(cameraM * trackPPM * 0.30);
    ctx.fillStyle = '#3a6e3a';
    ctx.beginPath();
    ctx.moveTo(0, 270);

    for (var i = 0; i <= VIRT_W; i += 12) {
      var worldI = i - tx;
      ctx.lineTo(i, 262 + Math.sin(worldI * 0.03) * 6 + Math.sin(worldI * 0.08) * 3);
    }

    ctx.lineTo(VIRT_W, 280);
    ctx.lineTo(0, 280);
    ctx.closePath();
    ctx.fill();

    // Grass infield.
    var grass = ctx.createLinearGradient(0, 270, 0, TRACK_TOP_Y);
    grass.addColorStop(0, '#4a8c3f');
    grass.addColorStop(1, '#3d7a34');
    ctx.fillStyle = grass;
    ctx.fillRect(0, 270, VIRT_W, TRACK_TOP_Y - 270);

    // Track surface.
    var tg = ctx.createLinearGradient(0, TRACK_TOP_Y, 0, VIRT_H);
    tg.addColorStop(0, '#c75a28');
    tg.addColorStop(0.5, '#b7410e');
    tg.addColorStop(1, '#9a3610');
    ctx.fillStyle = tg;
    ctx.fillRect(0, TRACK_TOP_Y, VIRT_W, VIRT_H - TRACK_TOP_Y);

    // Track texture.
    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 1;

    for (var ty = TRACK_TOP_Y + 3; ty < VIRT_H; ty += 4) {
      ctx.beginPath();
      ctx.moveTo(0, ty);
      ctx.lineTo(VIRT_W, ty);
      ctx.stroke();
    }

    // Lane lines.
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 300);
    ctx.lineTo(VIRT_W, 300);
    ctx.moveTo(0, 335);
    ctx.lineTo(VIRT_W, 335);
    ctx.moveTo(0, 370);
    ctx.lineTo(VIRT_W, 370);
    ctx.stroke();

    // Track edge.
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, TRACK_TOP_Y);
    ctx.lineTo(VIRT_W, TRACK_TOP_Y);
    ctx.stroke();

    // World-positioned features.
    var camPx = cameraM * trackPPM;

    // Distance markers every 10m.
    ctx.font = '700 11px Segoe UI, sans-serif';
    ctx.textAlign = 'center';

    for (var dm = 0; dm <= TRACK_DISTANCE; dm += 10) {
      var mx = dm * trackPPM - camPx;
      if (mx < -40 || mx > VIRT_W + 40) continue;

      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(mx, TRACK_TOP_Y);
      ctx.lineTo(mx, TRACK_TOP_Y + 8);
      ctx.stroke();

      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillText(dm + 'm', mx, TRACK_TOP_Y - 4);
    }

    // Start line at 0m.
    var startPx = 0 - camPx;

    if (startPx > -20 && startPx < VIRT_W + 20) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 4;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(startPx, TRACK_TOP_Y);
      ctx.lineTo(startPx, VIRT_H);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#fff';
      ctx.font = '700 11px Segoe UI, sans-serif';
      ctx.fillText('START', startPx, TRACK_TOP_Y - 4);
    }

    // Finish line.
    var finPx = TRACK_DISTANCE * trackPPM - camPx;

    if (finPx > -20 && finPx < VIRT_W + 20) {
      var flX = finPx - 8;
      var flW = 16;
      var sqS = 8;

      for (var fy = TRACK_TOP_Y; fy < VIRT_H; fy += sqS) {
        for (var fx = flX; fx < flX + flW; fx += sqS) {
          var ci = Math.floor((fx - flX) / sqS) + Math.floor((fy - TRACK_TOP_Y) / sqS);
          ctx.fillStyle = ci % 2 === 0 ? '#fff' : '#111';
          ctx.fillRect(fx, fy, sqS, Math.min(sqS, VIRT_H - fy));
        }
      }

      ctx.fillStyle = '#fff';
      ctx.font = '700 12px Segoe UI, sans-serif';
      ctx.fillText('FINISH', finPx, TRACK_TOP_Y - 4);
    }
  }

  /* ── Starter official figure ──────────────────────────────────────────── */
  function drawStarter(ctx, gunFired, flashAlpha) {
  var sx = 0;
  var sy = 84;

  // About 15% shorter legs
  var LEG_SHORTEN = 5;

  // Shift upper body down so it still matches the shorter legs
  var BODY_DROP = LEG_SHORTEN;

  ctx.save();
  ctx.translate(sx, sy);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(0, 36, 18, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── Legs ──
  ctx.fillStyle = '#172033';

  // Left leg - shorter
  ctx.beginPath();
  ctx.moveTo(-9, 0);
  ctx.lineTo(-13, 17);
  ctx.lineTo(-12, 29);
  ctx.lineTo(-5, 29);
  ctx.lineTo(-3, 17);
  ctx.lineTo(-1, 0);
  ctx.closePath();
  ctx.fill();

  // Right leg - shorter
  ctx.beginPath();
  ctx.moveTo(1, 0);
  ctx.lineTo(3, 17);
  ctx.lineTo(5, 29);
  ctx.lineTo(12, 29);
  ctx.lineTo(13, 17);
  ctx.lineTo(9, 0);
  ctx.closePath();
  ctx.fill();

  // Pelvis / hips block
  ctx.fillStyle = '#172033';
  ctx.beginPath();
  ctx.moveTo(-10, -7 + BODY_DROP);
  ctx.lineTo(10, -7 + BODY_DROP);
  ctx.lineTo(10, 1 + BODY_DROP);
  ctx.lineTo(5, 3 + BODY_DROP);
  ctx.lineTo(2, 0 + BODY_DROP);
  ctx.lineTo(-2, 0 + BODY_DROP);
  ctx.lineTo(-5, 3 + BODY_DROP);
  ctx.lineTo(-10, 1 + BODY_DROP);
  ctx.closePath();
  ctx.fill();

  // Center seam
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, -5 + BODY_DROP);
  ctx.lineTo(0, 2 + BODY_DROP);
  ctx.stroke();

  // Pants highlight
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-9, 4);
  ctx.lineTo(-11, 26);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(9, 4);
  ctx.lineTo(11, 26);
  ctx.stroke();

  // Shoes stay on ground
  ctx.fillStyle = '#111';
  roundRect(-16, 26, 13, 5, 2);
  ctx.fill();

  roundRect(3, 26, 13, 5, 2);
  ctx.fill();

  // ── Torso / official shirt ──
  ctx.fillStyle = '#f3f3f3';
  ctx.beginPath();
  ctx.moveTo(-10, -7 + BODY_DROP);
  ctx.lineTo(10, -7 + BODY_DROP);
  ctx.lineTo(8, -25 + BODY_DROP);
  ctx.quadraticCurveTo(0, -29 + BODY_DROP, -8, -25 + BODY_DROP);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#c9c9c9';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Shirt center line
  ctx.strokeStyle = '#d4d4d4';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(0, -25 + BODY_DROP);
  ctx.lineTo(0, -8 + BODY_DROP);
  ctx.stroke();

  // Belt / waistband
  ctx.fillStyle = '#222';
  ctx.fillRect(-10, -8 + BODY_DROP, 20, 3);

  // Small badge
  ctx.fillStyle = '#e3c24b';
  ctx.beginPath();
  ctx.arc(4, -18 + BODY_DROP, 1.6, 0, Math.PI * 2);
  ctx.fill();

  // Neck
  ctx.fillStyle = '#c98a63';
  roundRect(-3, -27 + BODY_DROP, 6, 6, 2);
  ctx.fill();

  // ── Head and cap ──
  ctx.fillStyle = '#c98a63';
  ctx.beginPath();
  ctx.ellipse(0, -33 + BODY_DROP, 7, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Simple nose/face detail
  ctx.strokeStyle = 'rgba(80,45,30,0.35)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(2, -33 + BODY_DROP);
  ctx.lineTo(3, -30 + BODY_DROP);
  ctx.stroke();

  // Cap
  ctx.fillStyle = '#151526';
  ctx.beginPath();
  ctx.ellipse(0, -39 + BODY_DROP, 8, 4, 0, Math.PI, 0);
  ctx.fill();

  ctx.fillRect(-8, -39 + BODY_DROP, 16, 3);

  // Cap brim
  ctx.beginPath();
  ctx.ellipse(5, -38 + BODY_DROP, 6, 2, 0.1, 0, Math.PI * 2);
  ctx.fill();

  // ── Arm at side ──
  ctx.strokeStyle = '#c98a63';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-8, -19 + BODY_DROP);
  ctx.quadraticCurveTo(-14, -10 + BODY_DROP, -12, 2 + BODY_DROP);
  ctx.stroke();

  // Hand at side
  ctx.fillStyle = '#c98a63';
  ctx.beginPath();
  ctx.arc(-12, 2 + BODY_DROP, 2.4, 0, Math.PI * 2);
  ctx.fill();

  // ── Raised arm holding starter pistol ──
  var shoulderX = 8;
  var shoulderY = -19 + BODY_DROP;
  var elbowX = 15;
  var elbowY = -27 + BODY_DROP;
  var handX = 18;
  var handY = -38 + BODY_DROP;

  ctx.strokeStyle = '#c98a63';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(shoulderX, shoulderY);
  ctx.quadraticCurveTo(elbowX, elbowY, handX, handY);
  ctx.stroke();

  // Hand
  ctx.fillStyle = '#c98a63';
  ctx.beginPath();
  ctx.arc(handX, handY, 2.8, 0, Math.PI * 2);
  ctx.fill();

  // Starter pistol
  ctx.save();
  ctx.translate(handX + 1, handY - 2);
  ctx.rotate(-0.22);

  ctx.fillStyle = '#2b2b2b';

  // Barrel
  roundRect(-1, -13, 4, 13, 1);
  ctx.fill();

  // Grip
  ctx.save();
  ctx.rotate(0.28);
  roundRect(-3, -1, 6, 8, 1.5);
  ctx.fill();
  ctx.restore();

  // Trigger guard
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(1, 1, 3, 0.1, Math.PI * 1.3);
  ctx.stroke();

  ctx.restore();

  // ── Muzzle flash / smoke ──
  if (gunFired && flashAlpha > 0) {
    ctx.save();

    ctx.translate(handX + 3, handY - 16);
    ctx.rotate(-0.22);
    ctx.globalAlpha = flashAlpha;

    // Outer flash
    ctx.fillStyle = '#ffdd44';
    ctx.beginPath();
    ctx.moveTo(0, -2);
    ctx.lineTo(-6, -18);
    ctx.lineTo(-1, -9);
    ctx.lineTo(0, -24);
    ctx.lineTo(2, -9);
    ctx.lineTo(7, -18);
    ctx.closePath();
    ctx.fill();

    // Inner flash
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, -4);
    ctx.lineTo(-3, -14);
    ctx.lineTo(0, -10);
    ctx.lineTo(3, -14);
    ctx.closePath();
    ctx.fill();

    // Orange center
    ctx.fillStyle = '#ff7a22';
    ctx.beginPath();
    ctx.arc(0, -4, 4, 0, Math.PI * 2);
    ctx.fill();

    // Smoke puff
    ctx.globalAlpha = flashAlpha * 0.55;
    ctx.fillStyle = '#d8d8d8';
    ctx.beginPath();
    ctx.ellipse(
      -3,
      -21,
      8 + (1 - flashAlpha) * 12,
      5 + (1 - flashAlpha) * 6,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.restore();
  }

  ctx.restore();
}
  /* ── Signal text overlay ──────────────────────────────────────────────── */
  function drawTrackSignalText(ctx, signal) {
    var txt = String(signal || '').trim();
    if (!txt) return;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = '900 38px Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif';
    ctx.fillStyle = txt === 'ON YOUR MARKS' ? '#f8fafc' : '#ffd43b';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = 10;
    ctx.fillText(txt, VIRT_W * 0.5, 14);
    ctx.restore();
  }

  function drawLagToFinishOverlay(ctx, rc, trackPPM, camPx) {
    if (!rc || !rc.raceFinished) return;

    var finishPx = TRACK_DISTANCE * trackPPM - camPx;
    var playerDist = Math.max(0, Math.min(TRACK_DISTANCE, rc.playerDist || 0));
    var opponentDist = Math.max(0, Math.min(TRACK_DISTANCE, rc.opponentDist || 0));

    var trailingIsPlayer = playerDist <= opponentDist;
    var trailingDist = trailingIsPlayer ? playerDist : opponentDist;
    var trailingX = trailingDist * trackPPM - camPx;
    var laneY = (trailingIsPlayer ? LANE2_Y : LANE1_Y) - 24;
    var lagMeters = Math.max(0, TRACK_DISTANCE - trailingDist);

    if (lagMeters <= 0.01) return;

    var x0 = trailingX + 18;
    var x1 = finishPx - 10;
    if (x1 <= x0) return;

    ctx.save();
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(x0, laneY);
    ctx.lineTo(x1, laneY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x0, laneY - 7);
    ctx.lineTo(x0, laneY + 7);
    ctx.moveTo(x1, laneY - 7);
    ctx.lineTo(x1, laneY + 7);
    ctx.stroke();

    var label = lagMeters.toFixed(2) + ' m';
    var labelW = ctx.measureText(label).width + 16;
    var labelX = (x0 + x1) * 0.5;
    var labelY = laneY - 18;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(labelX - labelW * 0.5, labelY - 9, labelW, 18);
    ctx.strokeStyle = 'rgba(253, 224, 71, 0.8)';
    ctx.lineWidth = 1;
    ctx.strokeRect(labelX - labelW * 0.5, labelY - 9, labelW, 18);

    ctx.fillStyle = '#fde047';
    ctx.font = '700 12px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, labelX, labelY);
    ctx.restore();
  }

  /* ── Public draw entry point ──────────────────────────────────────────── */
  function draw(ctx, w, h, rc, signal) {
    if (!opponentCfg) initRunnerCfgs();

    var s = shared();
    var muzzleFlashStart = s.muzzleFlashStart || 0;

    ctx.clearRect(0, 0, w, h);

    ctx.save();
    ctx.scale(w / VIRT_W, h / VIRT_H);

    var timeSinceGreen = rc.greenTime > 0 ? (rc.now - rc.greenTime) / 1000 : 0;

    // Raised "set" pose blend.
    var setRaiseBlend = getSetRaiseBlend(signal, rc);

    // Dynamic camera: follows the race, but zooms out horizontally if runners separate.
    var cameraView = getDynamicCamera(rc.playerDist, rc.opponentDist);
    var cameraM = cameraView.cameraM;
    var trackPPM = cameraView.trackPPM;
    var camPx = cameraM * trackPPM;

    drawScrollingTrack(ctx, cameraM, trackPPM);

    // Starter official at world position 10m.
    var starterWorldPx = 10 * trackPPM - camPx;

    if (starterWorldPx > -120 && starterWorldPx < VIRT_W + 120) {
      ctx.save();
      ctx.translate(starterWorldPx, 0);
      ctx.scale(2.5, 2.5);

      var gunFired = rc.greenTime > 0;
      var flashAlpha = 0;

      if (muzzleFlashStart > 0 && rc.now > 0) {
        var elapsed = rc.now - muzzleFlashStart;
        if (elapsed < MUZZLE_FLASH_DURATION) {
          flashAlpha = 1 - (elapsed / MUZZLE_FLASH_DURATION);
        }
      }

      drawStarter(ctx, gunFired, flashAlpha);
      ctx.restore();
    }

    // Robot opponent.
    var localOppT = rc.opponentLaunched
      ? Math.max(0, timeSinceGreen - (rc.opponentLaunchTime || 0))
      : 0;

    var oppScreenX = rc.opponentDist * trackPPM - camPx;

    drawRunner(
      ctx,
      oppScreenX,
      LANE1_Y,
      localOppT,
      opponentCfg,
      setRaiseBlend
    );

    // Player.
    var playerLaunchTime = rc.playerLaunchTime || rc.playerReactionTime || Infinity;

    var localPlayerT = rc.playerLaunched
      ? Math.max(0, timeSinceGreen - playerLaunchTime)
      : 0;

    var playerScreenX = rc.playerDist * trackPPM - camPx;

    drawRunner(
      ctx,
      playerScreenX,
      LANE2_Y,
      localPlayerT,
      playerCfg,
      setRaiseBlend
    );

    drawLagToFinishOverlay(ctx, rc, trackPPM, camPx);

    drawTrackSignalText(ctx, signal);

    ctx.restore();
  }

  /* ── Public surface ───────────────────────────────────────────────────── */
  global.SprintGfx = {
    draw: draw
  };

}(window));
