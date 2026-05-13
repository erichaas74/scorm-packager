/* ═════════════════════════════════════════════════════════════════════════
   drag-race.js  ─ Level 2 Graphics: Drag Race scene (Enhanced Lighting & Depth)
   ─────────────────────────────────────────────────────────────────────────
   Self-contained canvas-drawing module for the drag racing scenario.

   Public API (window.DragRaceGfx):
     draw(ctx, w, h, rc, lightIdx, isGreen)
       Render one frame of the drag race scene.
       rc       race context  → { opponentDist, opponentSpeed,
                                   playerDist, playerSpeed }
       lightIdx 0..3          → tree light state
       isGreen  bool          → tree shows green

     invalidateBackgroundCache()
       Call when the canvas is resized so the cached background re-renders.
   ═════════════════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  /* ── Local copies of sim-wide constants used here ─────────────────────── */
  var DRAG_FINISH_DISTANCE = 320;
  var DRAG_RENDER_DISTANCE = DRAG_FINISH_DISTANCE * 1.05;

  /* ── Local math helpers (independent copy) ────────────────────────────── */
  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
  function lerp(a, b, t)      { return a + (b - a) * t; }

  /* ── Cached background canvas ─────────────────────────────────────────── */
  var level2BgCanvas = document.createElement('canvas');
  var level2BgCached = false;

  /* ── Scene constants ──────────────────────────────────────────────────── */
  var DRAG_PITCH = 0.2;
  var DRAG_NOSE_OFFSET = 240;
  var DRAG_COCKPIT_SHIFT = 120;
  var DRAG_BODY_WIDTH = 42;
  var DRAG_WING_SHIFT = -120;
  var DRAG_WHEEL_SPREAD = 65;
  var DRAG_WING_WIDTH = 120;

  var TRACK_HORIZON_RATIO = 0.15; // Raised slightly to show off the sky
  var TRACK_CURVE_POWER = 0.69;
  var TRACK_Y_BASE = 0.94;
  var TRACK_Y_SPREAD = 0.85;
  var TRACK_WIDTH_BOT = 426;
  var TRACK_WIDTH_TOP = 162;
  var LANE_GAP_BOT = 164;
  var LANE_GAP_TOP = 73;
  var CAR_SCALE_MIN = 0.22;
  var CAR_SCALE_MAX = 2.92;
/* ── Dynamic Particle System ──────────────────────────────────────────── */
  var particles = [];

  function spawnParticle(type, dist, lane, z, carSpeed) {
    var p = { type: type, dist: dist, lane: lane, z: z, life: 1, maxLife: 1 };
    
    if (type === 'smoke') {
      p.vz = 0.5 + Math.random() * 1.5; // Drift upwards
      p.vDist = -0.2 + Math.random() * 0.4; // Slowly drift front/back
      p.vLane = (Math.random() - 0.5) * 0.05; // Spread horizontally
      p.maxLife = 30 + Math.random() * 30;
      p.size = 20 + Math.random() * 20;
    } else if (type === 'fire') {
      p.vz = Math.random() * 2;
      p.vDist = -(carSpeed * 0.3 + 10 + Math.random() * 10); // Shoot backwards relative to speed
      p.vLane = (Math.random() - 0.5) * 0.02;
      p.maxLife = 8 + Math.random() * 10;
      p.size = 15 + Math.random() * 15;
    } else if (type === 'spark') {
      p.vz = 3 + Math.random() * 5; // Pop upwards
      p.vDist = -(carSpeed * 0.4 + Math.random() * 15); // Shoot backwards
      p.vLane = (Math.random() - 0.5) * 0.1;
      p.maxLife = 15 + Math.random() * 20;
      p.size = 2 + Math.random() * 3;
    }
    p.life = p.maxLife;
    particles.push(p);
  }

  function updateAndDrawParticles(ctx, w, h) {
    for (var i = particles.length - 1; i >= 0; i--) {
    var p = particles[i];
    
    // 1. Safety check inside the loop
    if (p.dist < 0 && p.type !== 'smoke') {
      continue; // This is now legal because it skips to the next 'i'
    }

    p.life--;
    if (p.life <= 0) {
      particles.splice(i, 1);
      continue; // Also legal here
    }

      // 1. Update World Position
      p.dist += p.vDist;
      p.lane += p.vLane;
      p.z += p.vz;

      // Gravity and bounce for sparks
      if (p.type === 'spark') {
        p.vz -= 0.8; // Gravity
        if (p.z < 0) { 
          p.z = 0; 
          p.vz *= -0.5; // Bounce
        }
      }

      // 2. Project to Screen Space
      var y = projectYFromDistance(p.dist, h);
      var horizon = getHorizonY(h);
      var t = clamp((y - horizon) / (h - horizon), 0, 1);
      
      // Don't draw if it's past the horizon line
      if (t <= 0) continue; 

      var scale = projectScaleFromY(y, h) * 1.0625;
      var screenX = laneXAt(t, p.lane, w);
      var screenY = y - (p.z * scale);
      var lifeRatio = p.life / p.maxLife;

      // 3. Render
      ctx.save();
      ctx.translate(screenX, screenY);
      ctx.scale(scale, scale);

      if (p.type === 'smoke') {
        var spread = p.size + (1 - lifeRatio) * 40; // Expand as it dies
        ctx.fillStyle = 'rgba(200, 205, 215, ' + (lifeRatio * 0.6) + ')';
        ctx.beginPath();
        ctx.arc(0, 0, spread, 0, Math.PI * 2);
        ctx.fill();
      } 
      else if (p.type === 'fire') {
        var currentSize = p.size * (0.2 + lifeRatio * 1.2);
        var fG = ctx.createRadialGradient(0, 0, 0, 0, 0, currentSize);
        fG.addColorStop(0, 'rgba(255, 255, 200, ' + lifeRatio + ')');
        fG.addColorStop(0.3, 'rgba(255, 120, 0, ' + (lifeRatio * 0.8) + ')');
        fG.addColorStop(1, 'rgba(255, 0, 0, 0)');
        
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = fG;
        ctx.beginPath();
        ctx.arc(0, 0, currentSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      } 
      else if (p.type === 'spark') {
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = 'rgba(255, 230, 100, ' + lifeRatio + ')';
        ctx.fillRect(-p.size / 2, -p.size, p.size, p.size * 2);
      }
      ctx.restore();
    }
  }
  /* ── Track projection ─────────────────────────────────────────────────── */
  function getHorizonY(h) {
    return h * TRACK_HORIZON_RATIO;
  }

  function projectYFromDistance(distance, h) {
  // Use clamp to ensure t is between 0 and 1
  // This prevents negative values from breaking Math.pow
  var t = clamp(distance / DRAG_RENDER_DISTANCE, 0, 1);
  return h * TRACK_Y_BASE - Math.pow(t, TRACK_CURVE_POWER) * (h * TRACK_Y_SPREAD);
}

  function projectScaleFromY(y, h) {
    var horizon = getHorizonY(h);
    var ratio = (y - horizon) / (h * TRACK_Y_BASE - horizon);
    return clamp(ratio, CAR_SCALE_MIN, CAR_SCALE_MAX);
  }

  function laneXAt(yNorm, laneIndex, w) {
    var center = w / 2;
    var laneGap = yNorm * LANE_GAP_BOT + (1 - yNorm) * LANE_GAP_TOP;
    return center + laneIndex * laneGap;
  }

  /* ── Generic primitive ────────────────────────────────────────────────── */
  function roundRect(ctx, x, y, w, h, r, fill) {
    var radius = Math.min(r, w * 0.5, h * 0.5);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    if (fill) ctx.fill();
  }

  /* ── Wheels & flame parts ─────────────────────────────────────────────── */
  function drawRearWheel(ctx, x, y, width, height, pitch) {
    ctx.save(); ctx.translate(x, y);
    var displayH = height * (1 - pitch * 0.5);
    var topCapH = pitch * 20;
    
    // Core tire
    var tireGrad = ctx.createLinearGradient(-width / 2, 0, width / 2, 0);
    tireGrad.addColorStop(0, '#020617'); tireGrad.addColorStop(0.3, '#1e293b'); tireGrad.addColorStop(0.5, '#334155'); tireGrad.addColorStop(0.7, '#1e293b'); tireGrad.addColorStop(1, '#020617');
    ctx.fillStyle = tireGrad;
    roundRect(ctx, -width / 2, -displayH / 2, width, displayH, 8, true);
    
    // Perspective top cap
    if (pitch > 0.05) {
      var topGrad = ctx.createRadialGradient(0, -displayH / 2, 0, 0, -displayH / 2, width / 2);
      topGrad.addColorStop(0, '#1e293b'); topGrad.addColorStop(1, '#020617');
      ctx.fillStyle = topGrad;
      ctx.beginPath(); ctx.ellipse(0, -displayH / 2, width / 2, topCapH, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function drawFrontWheel(ctx, x, y, width, height, pitch) {
    ctx.save(); ctx.translate(x, y);
    var displayH = height * (1 - pitch * 0.4);
    ctx.fillStyle = '#0f172a';
    roundRect(ctx, -width / 2, -displayH / 2, width, displayH, 2, true);
    ctx.restore();
  }

  function drawFire(ctx, x, y, pitch, xSide) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(xSide * 0.4);
    var fireH = 20 + Math.random() * 25;
    var fireGrad = ctx.createLinearGradient(0, 0, 0, -fireH);
    fireGrad.addColorStop(0, 'rgba(255, 255, 0, 0.9)'); fireGrad.addColorStop(0.5, 'rgba(255, 120, 0, 0.7)'); fireGrad.addColorStop(1, 'rgba(255, 0, 0, 0)');
    ctx.fillStyle = fireGrad;
    ctx.beginPath(); ctx.moveTo(-4, 0); ctx.quadraticCurveTo(0, -fireH * 1.1, 4, 0); ctx.fill();
    ctx.restore();
  }

  function drawRocketJet(ctx, x, y, pitch) {
    ctx.save(); ctx.translate(x, y);
    var nozzleGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 15);
    nozzleGrad.addColorStop(0, '#1e293b'); nozzleGrad.addColorStop(1, '#020617');
    ctx.fillStyle = nozzleGrad;
    ctx.beginPath(); ctx.ellipse(0, 0, 16, 12 * (1 - pitch * 0.5), 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ef4444';
    ctx.beginPath(); ctx.ellipse(0, 0, 6, 4 * (1 - pitch * 0.5), 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  
 function drawExhaustPipes(ctx, xSide, yBase, pitch) {
    var pipeCount = 5;
    ctx.save(); ctx.translate(xSide * 16, yBase);
    for (var i = 0; i < pipeCount; i++) {
      var xOff = xSide * (i * 2.5);
      var yOff = (i * 9) * (1 - pitch * 0.5);
      ctx.save(); ctx.translate(xOff, yOff);
      var baseRot = xSide > 0 ? Math.PI - 0.7 : Math.PI + 0.7;
      ctx.rotate(baseRot - pitch * 0.3 * xSide);
      ctx.fillStyle = '#475569'; ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 1;
      roundRect(ctx, -3, -12, 6, 24, 3, true); ctx.stroke();
      ctx.fillStyle = '#0f172a'; ctx.beginPath(); ctx.ellipse(0, -12, 3, 1.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  function drawChromeEngine(ctx, x, y, width, pitch) {
    ctx.save(); ctx.translate(x, y);
    var chrome = ctx.createLinearGradient(-width / 2, 0, width / 2, 0);
    chrome.addColorStop(0, '#71717a'); chrome.addColorStop(0.2, '#f4f4f5'); chrome.addColorStop(0.5, '#a1a1aa'); chrome.addColorStop(0.8, '#ffffff'); chrome.addColorStop(1, '#52525b');
    ctx.fillStyle = chrome;
    var engineH = 25 * (1 - pitch * 0.4);
    roundRect(ctx, -width / 2, -engineH / 2, width, engineH, 5, true);
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 1;
    for (var i = -width / 2 + 5; i < width / 2; i += 6) {
      ctx.beginPath(); ctx.moveTo(i, -engineH / 2 + 2); ctx.lineTo(i, engineH / 2 - 2); ctx.stroke();
    }
    ctx.fillStyle = '#e4e4e7';
    var scoopW = width * 0.8; var scoopH = 12 * (1 - pitch * 0.5);
    roundRect(ctx, -scoopW / 2, -engineH / 2 - scoopH, scoopW, scoopH, 4, true);
    ctx.fillStyle = '#18181b';
    ctx.beginPath(); ctx.ellipse(0, -engineH / 2 - scoopH, scoopW * 0.4, scoopH * 0.3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawDriverHelmet(ctx, x, y, size, pitch) {
    ctx.save(); ctx.translate(x, y);
    var helmetH = size * (1 - pitch * 0.3);
    ctx.fillStyle = '#ffffff'; ctx.beginPath();
    ctx.ellipse(0, 0, size / 3, helmetH / 2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
  }

  /* ── Full dragster ────────────────────────────────────────────────────── */
  function drawDragster(ctx, bodyColor, stripeColor) {
    var pitch = DRAG_PITCH;
    var rearY = 110;
    var noseY = rearY - (DRAG_NOSE_OFFSET * (1 - pitch * 0.3));
    var cockpitTopY = rearY - DRAG_COCKPIT_SHIFT;
    var noseExtend = noseY - 15;
    var bodyRearY = rearY + 30;

    // Chassis Components
    ctx.strokeStyle = '#334155'; ctx.lineWidth = 4 * (1 - pitch * 0.2); ctx.beginPath(); ctx.moveTo(0, rearY); ctx.lineTo(0, noseY); ctx.stroke();
    ctx.lineWidth = 2; var axleSpread = 18 * (1 - pitch * 0.1); ctx.beginPath(); ctx.moveTo(-axleSpread, noseY); ctx.lineTo(axleSpread, noseY); ctx.stroke();
    drawFrontWheel(ctx, -axleSpread, noseY, 6, 24, pitch); drawFrontWheel(ctx, axleSpread, noseY, 6, 24, pitch);
    ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(-DRAG_WHEEL_SPREAD, rearY); ctx.lineTo(DRAG_WHEEL_SPREAD, rearY); ctx.stroke();
    drawRearWheel(ctx, -DRAG_WHEEL_SPREAD, rearY, 48, 120, pitch); drawRearWheel(ctx, DRAG_WHEEL_SPREAD, rearY, 48, 120, pitch);

    // Aero Body
    var bodyGrad = ctx.createLinearGradient(0, noseExtend, 0, bodyRearY);
    bodyGrad.addColorStop(0, '#94a3b8'); bodyGrad.addColorStop(0.2, bodyColor); bodyGrad.addColorStop(0.9, '#1e293b'); bodyGrad.addColorStop(1, '#020617');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath(); var halfW = DRAG_BODY_WIDTH / 2; var halfFrontW = 7;
    ctx.moveTo(-halfW, bodyRearY); ctx.lineTo(halfW, bodyRearY); ctx.lineTo(halfW, cockpitTopY); ctx.lineTo(halfFrontW, noseY); ctx.lineTo(halfFrontW * 0.7, noseExtend); ctx.lineTo(-halfFrontW * 0.7, noseExtend); ctx.lineTo(-halfFrontW, noseY); ctx.lineTo(-halfW, cockpitTopY); ctx.closePath(); ctx.fill();

    drawRocketJet(ctx, 0, bodyRearY, pitch);

    // Details
    ctx.fillStyle = stripeColor; ctx.beginPath(); ctx.moveTo(-2, cockpitTopY); ctx.lineTo(2, cockpitTopY); ctx.lineTo(1.5, noseExtend); ctx.lineTo(-1.5, noseExtend); ctx.closePath(); ctx.fill();
    drawChromeEngine(ctx, 0, cockpitTopY - 35, DRAG_BODY_WIDTH * 0.85, pitch);
    drawDriverHelmet(ctx, 0, cockpitTopY + 22, 32, pitch);
    drawExhaustPipes(ctx, -1, cockpitTopY - 10, pitch);
    drawExhaustPipes(ctx, 1, cockpitTopY - 10, pitch);
    
    // Canopy
    ctx.fillStyle = 'rgba(186, 230, 253, 0.4)'; var canopyW = DRAG_BODY_WIDTH - 12; var canopyH = 35 * (1 - pitch * 0.5);
    roundRect(ctx, -canopyW / 2, cockpitTopY + 10, canopyW, canopyH, 10, true);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'; ctx.lineWidth = 1; ctx.stroke();

    // Wing
    var wingY = bodyRearY + DRAG_WING_SHIFT * (1 - pitch * 0.5);
    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-18, rearY + 10); ctx.lineTo(-28, wingY); ctx.moveTo(18, rearY + 10); ctx.lineTo(28, wingY); ctx.stroke();
    var wingPlankH = 15 + pitch * 30; ctx.fillStyle = '#94a3b8';
    roundRect(ctx, -DRAG_WING_WIDTH / 2, wingY, DRAG_WING_WIDTH, wingPlankH, 4, true);
    ctx.fillStyle = bodyColor; var epH = 45; roundRect(ctx, -DRAG_WING_WIDTH / 2 - 2, wingY - epH / 3, 6, epH, 2, true); roundRect(ctx, DRAG_WING_WIDTH / 2 - 4, wingY - epH / 3, 6, epH, 2, true);
  }

  function drawCar(ctx, car, w, h, bodyColor, stripeColor) {
    var y = projectYFromDistance(car.distance, h);
    var scale = projectScaleFromY(y, h) * 1.0625;
    var horizon = getHorizonY(h);
    var t = clamp((y - horizon) / (h - horizon), 0, 1);
    var x = laneXAt(t, car.lane, w);

    ctx.save();
    ctx.translate(x, y - (110 * scale));
    ctx.scale(scale, scale);

    // Ambient Drop Shadow on the track
    ctx.save();
    ctx.translate(0, 110);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 90, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Emissive glow onto the track if firing
    if (car.speed > 0) {
      ctx.save();
      ctx.translate(0, 110);
      var floorGlow = ctx.createRadialGradient(0, 40, 10, 0, 40, 110);
      floorGlow.addColorStop(0, 'rgba(255, 120, 0, 0.4)');
      floorGlow.addColorStop(1, 'rgba(255, 50, 0, 0)');
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = floorGlow;
      ctx.beginPath(); ctx.ellipse(0, 40, 70, 50, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    drawDragster(ctx, bodyColor, stripeColor);

    // Permanent identity badge anchored on top of the rear wing.
    var labelText = car.label || '';
    if (labelText) {
      var badgeW = 68;
      var badgeH = 18;
      var badgeX = -badgeW * 0.5;
      var badgeY = 35;
      var badgeFill = car.labelFill || 'rgba(15, 23, 42, 0.9)';
      var badgeStroke = car.labelStroke || 'rgba(148, 163, 184, 0.85)';
      var badgeText = car.labelText || '#f8fafc';

      ctx.fillStyle = badgeFill;
      roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 9, true);
      ctx.strokeStyle = badgeStroke;
      ctx.lineWidth = 1.5;
      roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 9, false);
      ctx.stroke();

      ctx.fillStyle = badgeText;
      ctx.font = '900 11px Segoe UI, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(labelText, 0, badgeY + badgeH * 0.55);
    }

    ctx.restore();
  }

  /* ── Track elements ───────────────────────────────────────────────────── */
  function drawSky(ctx, w, h) {
    var horizon = getHorizonY(h);
    
    // Sunset gradient
    var skyGrad = ctx.createLinearGradient(0, 0, 0, horizon);
    skyGrad.addColorStop(0, '#0f172a');
    skyGrad.addColorStop(0.6, '#4c1d95');
    skyGrad.addColorStop(1, '#f97316');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, horizon);

    // Distant mountain parallax
    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.moveTo(0, horizon);
    ctx.lineTo(w * 0.15, horizon - h * 0.05);
    ctx.lineTo(w * 0.25, horizon - h * 0.02);
    ctx.lineTo(w * 0.45, horizon - h * 0.07);
    ctx.lineTo(w * 0.65, horizon - h * 0.01);
    ctx.lineTo(w * 0.85, horizon - h * 0.06);
    ctx.lineTo(w, horizon - h * 0.03);
    ctx.lineTo(w, horizon);
    ctx.fill();
  }

  function drawTrackAsphalt(ctx, w, h) {
    var horizon = getHorizonY(h);
    var center = w / 2;
    
    // Base asphalt gradient
    ctx.beginPath();
    ctx.moveTo(center - TRACK_WIDTH_TOP, horizon);
    ctx.lineTo(center + TRACK_WIDTH_TOP, horizon);
    ctx.lineTo(center + TRACK_WIDTH_BOT, h);
    ctx.lineTo(center - TRACK_WIDTH_BOT, h);
    ctx.closePath();
    var asphalt = ctx.createLinearGradient(0, horizon, 0, h);
    asphalt.addColorStop(0, '#303238');
    asphalt.addColorStop(0.55, '#24262b');
    asphalt.addColorStop(1, '#15171b');
    ctx.fillStyle = asphalt;
    ctx.fill();

    // Track wear / Skid marks in the launching lanes
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    // Left lane wear
    ctx.beginPath();
    ctx.moveTo(center - TRACK_WIDTH_TOP * 0.6, horizon);
    ctx.lineTo(center - TRACK_WIDTH_TOP * 0.4, horizon);
    ctx.lineTo(center - TRACK_WIDTH_BOT * 0.35, h);
    ctx.lineTo(center - TRACK_WIDTH_BOT * 0.65, h);
    ctx.fill();
    // Right lane wear
    ctx.beginPath();
    ctx.moveTo(center + TRACK_WIDTH_TOP * 0.4, horizon);
    ctx.lineTo(center + TRACK_WIDTH_TOP * 0.6, horizon);
    ctx.lineTo(center + TRACK_WIDTH_BOT * 0.65, h);
    ctx.lineTo(center + TRACK_WIDTH_BOT * 0.35, h);
    ctx.fill();

    // Distance marker lines
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    for (var i = 0; i < 18; i++) {
      var y = horizon + (i * (h - horizon) / 17);
      var t = (y - horizon) / (h - horizon);
      var half = lerp(TRACK_WIDTH_TOP, TRACK_WIDTH_BOT, t);
      ctx.beginPath();
      ctx.moveTo(center - half, y);
      ctx.lineTo(center + half, y);
      ctx.stroke();
    }
    ctx.restore();

    // Center line
    ctx.beginPath();
    ctx.moveTo(center - 7, horizon);
    ctx.lineTo(center + 7, horizon);
    ctx.lineTo(center + 17, h);
    ctx.lineTo(center - 17, h);
    ctx.closePath();
    ctx.fillStyle = '#efefef';
    ctx.globalAlpha = 0.7;
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function drawBarrierStrip(ctx, xB, yB, xT, yT, left) {
    for (var i = 0; i < 16; i++) {
      var t0 = i / 16, t1 = (i + 1) / 16;
      var xb0 = lerp(xB, xT, t0), yb0 = lerp(yB, yT, t0);
      var xb1 = lerp(xB, xT, t1), yb1 = lerp(yB, yT, t1);
      var th0 = lerp(36, 8, t0), th1 = lerp(36, 8, t1);
      ctx.beginPath();
      if (left) { ctx.moveTo(xb0, yb0); ctx.lineTo(xb0 + th0, yb0); ctx.lineTo(xb1 + th1, yb1); ctx.lineTo(xb1, yb1); }
      else      { ctx.moveTo(xb0 - th0, yb0); ctx.lineTo(xb0, yb0); ctx.lineTo(xb1, yb1); ctx.lineTo(xb1 - th1, yb1); }
      ctx.closePath();
      ctx.fillStyle = i % 2 === 0 ? '#d72638' : '#efefef';
      ctx.fill();
    }
  }

  function drawBarriers(ctx, w, h) {
    var center = w / 2;
    var horizon = getHorizonY(h);
    drawBarrierStrip(ctx, center - TRACK_WIDTH_BOT, h, center - TRACK_WIDTH_TOP - 3, horizon, true);
    drawBarrierStrip(ctx, center + TRACK_WIDTH_BOT, h, center + TRACK_WIDTH_TOP + 3, horizon, false);
  }

  function drawFinishLine(ctx, w, h) {
    var center = w / 2;
    var finishY = projectYFromDistance(DRAG_FINISH_DISTANCE, h) + (h * 0.02);
    var horizon = getHorizonY(h);
    var t = clamp((finishY - horizon) / (h - horizon), 0, 1);
    var halfW = lerp(TRACK_WIDTH_TOP, TRACK_WIDTH_BOT, t) * 1.15;
    var bandH = lerp(12, 34, t);
    var left = center - halfW * 0.64;
    var right = center + halfW * 0.64;
    var stripeW = (right - left) / 16;

    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.fillRect(left, finishY - bandH / 2, right - left, bandH);
    for (var i = 0; i < 16; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#111827' : '#f8fafc';
      ctx.fillRect(left + i * stripeW, finishY - bandH / 2, stripeW, bandH / 2);
      ctx.fillStyle = i % 2 === 0 ? '#f8fafc' : '#111827';
      ctx.fillRect(left + i * stripeW, finishY, stripeW, bandH / 2);
    }
    ctx.fillStyle = '#f8fafc';
    ctx.font = '700 11px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('FINISH', center, finishY - bandH / 2 - 6);
    ctx.restore();
  }

  function drawBleachers(ctx, w, h) {
    var center = w / 2;
    var horizon = getHorizonY(h);
    var topY = horizon - 20;
    var standH = h * 0.45;
    var rows = 8;

    ctx.save();
    for (var side = -1; side <= 1; side += 2) {
      if (side === 0) continue;

      var inTopX = center + side * (TRACK_WIDTH_TOP + 15);
      var inBotX = center + side * (TRACK_WIDTH_TOP + 15 + ((topY + standH) - horizon) / (h - horizon) * (TRACK_WIDTH_BOT - TRACK_WIDTH_TOP));

      var outTopX = inTopX + side * 180;
      var outBotX = inBotX + side * 400;

      // Draw the perspective rows flowing with the track edge
      for (var r = 0; r < rows; r++) {
        var t0 = r / rows;
        var t1 = (r + 1) / rows;

        var topX0 = lerp(inTopX, outTopX, t0);
        var topY0 = lerp(topY, topY - 15, t0);
        var botX0 = lerp(inBotX, outBotX, t0);
        var botY0 = topY + standH;

        var topX1 = lerp(inTopX, outTopX, t1);
        var topY1 = lerp(topY, topY - 15, t1);
        var botX1 = lerp(inBotX, outBotX, t1);
        var botY1 = topY + standH;

        // Alternate row colors for depth and bench separation
        ctx.fillStyle = r % 2 === 0 ? 'rgba(15, 23, 42, 0.82)' : 'rgba(30, 41, 59, 0.82)';
        ctx.beginPath();
        ctx.moveTo(topX0, topY0);
        ctx.lineTo(topX1, topY1);
        ctx.lineTo(botX1, botY1);
        ctx.lineTo(botX0, botY0);
        ctx.closePath();
        ctx.fill();

        // Draw the defining line pointing toward the horizon
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(topX0, topY0);
        ctx.lineTo(botX0, botY0);
        ctx.stroke();
      }
      
      // Draw the final outer boundary line
      ctx.beginPath();
      ctx.moveTo(outTopX, topY - 15);
      ctx.lineTo(outBotX, topY + standH);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawStaticCrowd(ctx, w, h) {
    var center = w / 2;
    var horizon = getHorizonY(h);
    var topY = horizon - 20;
    var standH = h * 0.45;
    var rows = 8;
    
    // Expanded palettes for more detail
    var shirtColors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ffffff', '#9ca3af', '#1e40af', '#be123c'];
    var skinTones = ['#fca5a5', '#fdba74', '#fcd34d', '#d6d3d1', '#a8a29e', '#78716c', '#44403c'];

    ctx.save();
    for (var side = -1; side <= 1; side += 2) {
      if (side === 0) continue;
      
      var inTopX = center + side * (TRACK_WIDTH_TOP + 15);
      var inBotX = center + side * (TRACK_WIDTH_TOP + 15 + ((topY + standH) - horizon) / (h - horizon) * (TRACK_WIDTH_BOT - TRACK_WIDTH_TOP));

      var outTopX = inTopX + side * 180;
      var outBotX = inBotX + side * 400;

      for (var r = 0; r < rows; r++) {
        var tCenter = (r + 0.5) / rows;
        
        var rowTopX = lerp(inTopX, outTopX, tCenter);
        var rowTopY = lerp(topY, topY - 15, tCenter);
        var rowBotX = lerp(inBotX, outBotX, tCenter);
        var rowBotY = topY + standH;

        // Slightly reduced count to accommodate their larger size without turning into a solid blob
        var numPeople = 35; 
        
        for (var p = 0; p < numPeople; p++) {
          var pt = Math.pow(p / numPeople, 1.4); 

          var px = lerp(rowTopX, rowBotX, pt);
          var py = lerp(rowTopY, rowBotY, pt);
          
          var rowWidthAtT = lerp(180 / rows, 400 / rows, pt);
          px += (Math.random() - 0.5) * (rowWidthAtT * 0.75);

          // 1. INCREASED SIZE: Scaled up the base multiplier
          var baseSize = lerp(3.5, 9.0, pt);

          var shirt = shirtColors[Math.floor(Math.random() * shirtColors.length)];
          var skin = skinTones[Math.floor(Math.random() * skinTones.length)];

          // 2. INCREASED DETAIL: Draw shoulders and a head instead of one dot
          
          // Draw Body (rounded shoulders sitting on the bench)
          ctx.fillStyle = shirt;
          ctx.beginPath();
          ctx.arc(px, py, baseSize * 0.8, Math.PI, 0);
          ctx.fill();

          // Draw Head
          ctx.fillStyle = skin;
          ctx.beginPath();
          ctx.arc(px, py - baseSize * 0.7, baseSize * 0.45, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    ctx.restore();
  }
  function drawCameraFlashes(ctx, w, h) {
    var horizon = getHorizonY(h);
    var center = w / 2;
    // Use a fast pseudo-random time slice for rapid flashing
    var timeSlice = Date.now();
    
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    
    // Generate a few random flashes every frame
    for (var i = 0; i < 6; i++) {
      // Create a deterministic but chaotic seed to pop flashes in and out quickly
      var seed = (timeSlice + i * 823) % 2000;
      if (seed < 80) { // Brief flash window
        var side = i % 2 === 0 ? 1 : -1;
        // Distribute flashes across the bleacher area
        var flashX = center + side * (TRACK_WIDTH_BOT * 0.7 + Math.random() * 250);
        var flashY = horizon + Math.random() * (h * 0.35);
        var size = 1.5 + Math.random() * 3;

        // Core bright spot
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(flashX, flashY, size, 0, Math.PI * 2);
        ctx.fill();

        // Soft halo
        var halo = ctx.createRadialGradient(flashX, flashY, 0, flashX, flashY, size * 5);
        halo.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        halo.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(flashX, flashY, size * 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }
function drawFinishSnapshot(ctx, w, h, snap) {
    if (!snap) return;

    var finishDist = snap.finishDist || 320; 
    var playerAt = snap.playerDistAtFinish || 0;
    var oppAt = snap.opponentDistAtFinish || 0;
    var gap = Math.max(0, snap.gap || 0);
    var playerRT = typeof snap.playerRT === 'number' ? snap.playerRT : null;
    var opponentRT = typeof snap.opponentRT === 'number' ? snap.opponentRT : null;

    ctx.clearRect(0, 0, w, h);

    // 1. Enhanced Background
   var bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#0f172a'); // Darker, richer slate
    bg.addColorStop(1, '#020617');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    var margin = 52;
    var trackX = margin;
    var trackY = 22;
    var trackW = w - margin * 2;
    var trackH = h - 44;

    // Track Surface with a subtle gradient
    var trackBg = ctx.createLinearGradient(0, trackY, 0, trackY + trackH);
    trackBg.addColorStop(0, '#1e232b');
    trackBg.addColorStop(1, '#11151a');
    ctx.fillStyle = trackBg;
    ctx.fillRect(trackX, trackY, trackW, trackH);

    // Subtle Skid Marks
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(trackX + trackW * 0.15, trackY, trackW * 0.2, trackH);
    ctx.fillRect(trackX + trackW * 0.65, trackY, trackW * 0.2, trackH);

    // Glowing Lane Separator & Edges
    var laneMid = trackX + trackW * 0.5;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.setLineDash([15, 10]);
    ctx.beginPath(); ctx.moveTo(laneMid, trackY); ctx.lineTo(laneMid, trackY + trackH); ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 4;
    ctx.strokeRect(trackX, trackY, trackW, trackH);

    // 2. Upgraded Finish Line (3-Row Checkerboard)
    var finishY = trackY + 110; 
    var cols = 24;
    var rows = 3;
    var stripeW = trackW / cols;
    var rowH = 8; // 3 rows of 8px = 24px total height
    var finishStartTop = finishY - (rows * rowH) / 2;
    
    ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
    ctx.shadowBlur = 8;
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        // Alternate colors based on the grid coordinates
        ctx.fillStyle = (r + c) % 2 === 0 ? '#f8fafc' : '#0f172a';
        ctx.fillRect(trackX + c * stripeW, finishStartTop + r * rowH, stripeW, rowH);
      }
    }
    ctx.shadowBlur = 0;

    // "FINISH" Badge
    ctx.fillStyle = '#0f172a';
    roundRect(ctx, laneMid - 35, finishY - 12, 70, 24, 4, true);
    ctx.fillStyle = '#f8fafc';
    ctx.font = '800 12px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('FINISH', laneMid, finishY);

    // Distance mapping
    var loserDist = Math.min(playerAt, oppAt);
    var metersBehindLoser = Math.max(0, finishDist - loserDist);
    var ppm = Math.min(18, Math.max(6, (trackH - 180) / Math.max(8, metersBehindLoser + 6)));

    function yFromDistance(d) {
      return finishY + Math.max(0, finishDist - d) * ppm;
    }

    var playerFrontY = yFromDistance(playerAt);
    var oppFrontY = yFromDistance(oppAt);
    var leftLaneX = trackX + trackW * 0.25;
    var rightLaneX = trackX + trackW * 0.75;

    // 3. Reaction Time Cards
    function drawRTCard(x, y, title, timeVal, ringColor) {
      if (timeVal === null) return;
      var cardW = 140;
      var cardH = 54;
      
      // Card Background
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      roundRect(ctx, x - cardW/2, y, cardW, cardH, 8, true);
      
      // Colored Glow Stroke
      ctx.strokeStyle = ringColor;
      ctx.lineWidth = 2;
      roundRect(ctx, x - cardW/2, y, cardW, cardH, 8, false);
      ctx.stroke();

      ctx.fillStyle = '#9ca3af';
      ctx.font = '700 12px Segoe UI, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(title, x, y + 18);

      ctx.fillStyle = '#f8fafc';
      ctx.font = '900 20px Segoe UI, sans-serif';
      ctx.fillText(timeVal.toFixed(3) + ' s', x, y + 38);
    }

    drawRTCard(leftLaneX, trackY + 12, 'CPU Reaction', opponentRT, '#fcd34d');
    drawRTCard(rightLaneX, trackY + 12, 'Your Reaction', playerRT, '#fda4af');

    // Draw Cars
    var snapScale = 0.39;
    var noseLocalY = -145;
    var localToFrontY = -noseLocalY * snapScale;

    function drawSnapshotDragster(x, frontY, color, stripe) {
      ctx.save();
      ctx.translate(x, frontY + localToFrontY);
      ctx.scale(snapScale, snapScale);
      drawDragster(ctx, color, stripe);
      ctx.restore();
    }

    drawSnapshotDragster(leftLaneX, oppFrontY, '#d4a247', '#8e6222');
    drawSnapshotDragster(rightLaneX, playerFrontY, '#e11d48', '#8f1239');

    // 4. Smart Gap Measurement Line
    var winnerY = snap.winner === 'player' ? playerFrontY : oppFrontY;
    var loserY2 = snap.winner === 'player' ? oppFrontY : playerFrontY;
    var measureX = laneMid;
    var gapDy = Math.abs(winnerY - loserY2);
    var midY = (winnerY + loserY2) * 0.5;

    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(measureX, winnerY);
    ctx.lineTo(measureX, loserY2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(measureX - 10, winnerY);
    ctx.lineTo(measureX + 10, winnerY);
    ctx.moveTo(measureX - 10, loserY2);
    ctx.lineTo(measureX + 10, loserY2);
    ctx.stroke();

    ctx.font = '800 13px Segoe UI, sans-serif';
    var textStr = 'Solve this gap (m)';
    var textW = ctx.measureText(textStr).width + 20;
    
    // Anti-overlap logic for tight finishes
    var textX = measureX;
    var isTight = gapDy < 35;
    
    if (isTight) {
      // Push text into the winner's lane side slightly to avoid the I-bar
      textX = snap.winner === 'player' ? measureX - textW/2 - 15 : measureX + textW/2 + 15;
    }

    // Pill background for text legibility
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    roundRect(ctx, textX - textW/2, midY - 12, textW, 24, 12, true);
    
    ctx.fillStyle = '#fde047';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(textStr, textX, midY + 1);

    // Winner banner
    {
      var bannerH = 46;
      var playerWon = snap.winner === 'player';
      var halfPad = 12;
      var bannerW = (trackW * 0.5) - (halfPad * 2);
      var bannerX = playerWon ? (trackX + trackW * 0.5 + halfPad) : (trackX + halfPad);
      var bannerY = trackY + trackH - bannerH - 16;

      var bannerGrad = ctx.createLinearGradient(0, bannerY, 0, bannerY + bannerH);
      if (playerWon) {
        bannerGrad.addColorStop(0, 'rgba(16, 185, 129, 0.95)');
        bannerGrad.addColorStop(1, 'rgba(5, 150, 105, 0.95)');
      } else {
        bannerGrad.addColorStop(0, 'rgba(239, 68, 68, 0.95)');
        bannerGrad.addColorStop(1, 'rgba(190, 24, 93, 0.95)');
      }

      ctx.fillStyle = bannerGrad;
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 10;
      roundRect(ctx, bannerX, bannerY, bannerW, bannerH, 8, true);
      ctx.shadowBlur = 0;

      ctx.strokeStyle = playerWon ? 'rgba(167, 243, 208, 0.95)' : 'rgba(254, 202, 202, 0.95)';
      ctx.lineWidth = 2;
      roundRect(ctx, bannerX, bannerY, bannerW, bannerH, 8, false);
      ctx.stroke();

      ctx.fillStyle = '#ecfeff';
      ctx.font = '900 22px Segoe UI, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(playerWon ? 'YOU WON' : 'CPU WON', bannerX + bannerW * 0.5, bannerY + bannerH * 0.5 + 2);
    }
  }

  function drawLaneIdentityOverlay(ctx, w, h, rc) {
    var oppDist = (rc && typeof rc.opponentDist === 'number') ? rc.opponentDist : 0;
    var playerDist = (rc && typeof rc.playerDist === 'number') ? rc.playerDist : 0;

    function projectedTagPos(dist, lane) {
      var y = projectYFromDistance(dist, h);
      var horizon = getHorizonY(h);
      var t = clamp((y - horizon) / (h - horizon), 0, 1);
      var x = laneXAt(t, lane, w);
      return { x: x, y: y - 120 };
    }

    var cpuPos = projectedTagPos(oppDist, -1);
    var youPos = projectedTagPos(playerDist, 1);

    ctx.save();
    ctx.font = '800 14px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // CPU tag
    ctx.fillStyle = 'rgba(212, 162, 71, 0.20)';
    roundRect(ctx, cpuPos.x - 56, cpuPos.y - 14, 112, 28, 14, true);
    ctx.strokeStyle = 'rgba(212, 162, 71, 0.80)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, cpuPos.x - 56, cpuPos.y - 14, 112, 28, 14, false);
    ctx.stroke();
    ctx.fillStyle = '#fcd34d';
    ctx.fillText('CPU CAR', cpuPos.x, cpuPos.y);

    // Player tag
    ctx.fillStyle = 'rgba(225, 29, 72, 0.20)';
    roundRect(ctx, youPos.x - 56, youPos.y - 14, 112, 28, 14, true);
    ctx.strokeStyle = 'rgba(225, 29, 72, 0.80)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, youPos.x - 56, youPos.y - 14, 112, 28, 14, false);
    ctx.stroke();
    ctx.fillStyle = '#fda4af';
    ctx.fillText('YOUR CAR', youPos.x, youPos.y);

    ctx.restore();
  }

  /* ── Christmas tree (start lights) ────────────────────────────────────── */
  
  function drawBulb(ctx, x, y, r, color, isOn) {
    // 1. The metal anti-glare cowling (hood) behind the light
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(x, y - 2, r + 4, Math.PI, 0); // Top half hood
    ctx.lineTo(x + r + 4, y + 2);
    ctx.lineTo(x - r - 4, y + 2);
    ctx.fill();

    // Cowling inner shadow
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y - 2, r + 3, Math.PI, 0);
    ctx.stroke();

    // 2. The Glass Lens
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    
    if (isOn) {
      // Intensely hot center fading to rich color
      var activeGlow = ctx.createRadialGradient(x, y, r * 0.2, x, y, r);
      if (color === 'yellow') {
        activeGlow.addColorStop(0, '#ffffff');
        activeGlow.addColorStop(0.3, '#fde047');
        activeGlow.addColorStop(1, '#ca8a04');
        ctx.shadowColor = '#fef08a';
      } else if (color === 'green') {
        activeGlow.addColorStop(0, '#ffffff');
        activeGlow.addColorStop(0.3, '#4ade80');
        activeGlow.addColorStop(1, '#16a34a');
        ctx.shadowColor = '#86efac';
      } else { // Small stage lights
        activeGlow.addColorStop(0, '#fef08a');
        activeGlow.addColorStop(1, '#b45309');
        ctx.shadowColor = '#fde047';
      }
      ctx.fillStyle = activeGlow;
      ctx.shadowBlur = 18;
    } else {
      // Dark, unlit glass
      var deadGlass = ctx.createRadialGradient(x, y - r*0.3, 0, x, y, r);
      deadGlass.addColorStop(0, '#475569');
      deadGlass.addColorStop(1, '#0f172a');
      ctx.fillStyle = deadGlass;
      ctx.shadowBlur = 0;
    }
    ctx.fill();
    ctx.shadowBlur = 0;

    // 3. Specular Sun Reflection (shiny glass curve)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(x, y, r * 0.7, Math.PI * 1.1, Math.PI * 1.6);
    ctx.stroke();
  }

  function drawCenterTree(ctx, w, h, lightIdx, isGreen) {
    var x = w / 2, y = h * 0.28;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(0.92, 0.92);

    // Green ambient bloom mapping the track
    if (isGreen) {
      ctx.save();
      var bloom = ctx.createRadialGradient(0, 110, 10, 0, 110, 180);
      bloom.addColorStop(0, 'rgba(22, 219, 101, 0.5)');
      bloom.addColorStop(1, 'rgba(22, 219, 101, 0)');
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = bloom;
      ctx.beginPath();
      ctx.arc(0, 110, 180, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // --- Structural Framework ---
    
    // Main vertical pole gradient (cylindrical metal look)
    var poleGrad = ctx.createLinearGradient(-11, 0, 11, 0);
    poleGrad.addColorStop(0, '#334155');
    poleGrad.addColorStop(0.3, '#94a3b8'); // Specular highlight
    poleGrad.addColorStop(0.7, '#475569');
    poleGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = poleGrad;
    roundRect(ctx, -11, -35, 22, 250, 6, true);

    // Top timing boards (Sponsor/Display boards)
    ctx.fillStyle = '#1e293b';
    roundRect(ctx, -70, -70, 140, 24, 4, true);
    ctx.fillStyle = '#0f172a';
    roundRect(ctx, -68, -68, 136, 20, 3, true);
    
    ctx.fillStyle = '#1e293b';
    roundRect(ctx, -58, -38, 116, 24, 4, true);
    ctx.fillStyle = '#0f172a';
    roundRect(ctx, -56, -36, 112, 20, 3, true);

    // Horizontal mounting brackets for the main bulbs
    ctx.fillStyle = '#475569';
    // --- UPDATED SPACING HERE ---
    var stackY = [0, 36, 72, 114]; 
    for(var b = 0; b < 4; b++) {
      roundRect(ctx, -38, stackY[b] - 4, 76, 8, 2, true);
      // Bracket bolts
      ctx.fillStyle = '#0f172a';
      ctx.beginPath(); ctx.arc(-15, stackY[b], 2, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(15, stackY[b], 2, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#475569'; // Reset for next bracket
    }

    // --- Bulbs ---

    // Top Pre-Stage & Stage Lights (Always on when racing)
    drawBulb(ctx, -40, -60, 5, 'stage', true);
    drawBulb(ctx, -20, -60, 5, 'stage', true);
    drawBulb(ctx, 20, -60, 5, 'stage', true);
    drawBulb(ctx, 40, -60, 5, 'stage', true);
    
    drawBulb(ctx, -30, -26, 5, 'stage', true);
    drawBulb(ctx, 30, -26, 5, 'stage', true);

    // Main Countdown Bulbs
    for (var i = 0; i < 3; i++) {
      var on = lightIdx >= i;
      drawBulb(ctx, -28, stackY[i], 12, 'yellow', on);
      drawBulb(ctx, 28, stackY[i], 12, 'yellow', on);
    }
    
    // Green GO Bulbs
    drawBulb(ctx, -28, stackY[3], 12, 'green', isGreen);
    drawBulb(ctx, 28, stackY[3], 12, 'green', isGreen);

    // Base Box (Electrical housing at the bottom)
    var baseGrad = ctx.createLinearGradient(-26, 0, 26, 0);
    baseGrad.addColorStop(0, '#1e293b');
    baseGrad.addColorStop(0.5, '#475569');
    baseGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = baseGrad;
    roundRect(ctx, -26, 200, 52, 16, 4, true);

    ctx.restore();
  }

  /* ── Background caching ───────────────────────────────────────────────── */
  function cacheLevel2Background(w, h) {
    level2BgCanvas.width = w;
    level2BgCanvas.height = h;
    var ctx = level2BgCanvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);
    
    drawSky(ctx, w, h); // Added Parallax Sunset & Mountains
    drawTrackAsphalt(ctx, w, h);
    drawBleachers(ctx, w, h);
    drawStaticCrowd(ctx, w, h);
    drawFinishLine(ctx, w, h);
    drawBarriers(ctx, w, h);
    level2BgCached = true;
  }

  /* ── Public draw entry point ──────────────────────────────────────────── */
  function draw(ctx, w, h, rc, lightIdx, isGreen) {
    if (!level2BgCached) cacheLevel2Background(w, h);
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(level2BgCanvas, 0, 0);
    
    drawCameraFlashes(ctx, w, h);
    drawCenterTree(ctx, w, h, lightIdx, isGreen);

    var cars = [
      {
        lane: -1,
        distance: rc.opponentDist,
        speed: rc.opponentSpeed,
        color: '#d4a247',
        stripe: '#8e6222',
        label: 'CPU',
        labelFill: 'rgba(180, 83, 9, 0.90)',
        labelStroke: 'rgba(251, 191, 36, 0.90)',
        labelText: '#fef3c7'
      },
      {
        lane: 1,
        distance: rc.playerDist,
        speed: rc.playerSpeed,
        color: '#e11d48',
        stripe: '#8f1239',
        label: 'YOU',
        labelFill: 'rgba(159, 18, 57, 0.90)',
        labelStroke: 'rgba(244, 114, 182, 0.90)',
        labelText: '#ffe4e6'
      }
    ];

    // Emitter Logic
    for (var i = 0; i < cars.length; i++) {
      var c = cars[i];
      if (c.speed > 0) {
        // 1. Volumetric Rocket Fire (Constant while moving)
        for (var f = 0; f < 3; f++) {
          spawnParticle('fire', c.distance - 15, c.lane, 55, c.speed); // Center engine
        }
        
        // 2. Tire Smoke (Heavy during launch: low speed, high acceleration)
        if (c.speed < 50) {
          // Left and right tires
          spawnParticle('smoke', c.distance - 5, c.lane - 0.15, 10, c.speed);
          spawnParticle('smoke', c.distance - 5, c.lane + 0.15, 10, c.speed);
        }
        
        // 3. Sparks (Chassis bottoming out randomly at high speeds)
        if (c.speed > 80 && Math.random() < 0.2) {
          for (var s = 0; s < 4; s++) {
             spawnParticle('spark', c.distance - 10, c.lane + (Math.random() - 0.5) * 0.1, 5, c.speed);
          }
        }
      }
    }

    // Render Particles (Draw particles behind the cars if they are further away)
    // To keep it simple and performant, we draw background particles, then cars, then foreground particles.
    updateAndDrawParticles(ctx, w, h);

    cars.sort(function (a, b) { return b.distance - a.distance; });
    for (var j = 0; j < cars.length; j++) {
      drawCar(ctx, cars[j], w, h, cars[j].color, cars[j].stripe);
    }

  }
  function invalidateBackgroundCache() {
    level2BgCached = false;
  }

  /* ── Public surface ───────────────────────────────────────────────────── */
  global.DragRaceGfx = {
    draw: draw,
    drawFinishSnapshot: drawFinishSnapshot,
    invalidateBackgroundCache: invalidateBackgroundCache
  };

}(window));