(function() {
  'use strict';

  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     CONSTANTS
     â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
  var G = 9.81;
  var DRAG_ACCEL = 40.0;
  var DRAG_FINISH_DISTANCE = 300;
  var RUNNER_ACCEL = 6.0;
  var RUNNER_TOP_SPEED = 10.0;
  var RULER_TOTAL_CM = 300;
  var RULER_PX_PER_CM = 7;
  var RULER_MISS_SECONDS = Math.sqrt((2 * (RULER_TOTAL_CM / 100)) / G);
  var REACTION_MISS_SECONDS = 3;
  var level1PreviewId = null;

  // â”€â”€ Starter gun state â”€â”€
  var gunAudioCtx = null;
  var muzzleFlashStart = 0;        // timestamp when gun fired
  var MUZZLE_FLASH_DURATION = 250; // ms
  var opponentDelay = 0;           // randomized each race

  function warmAudioCtx() {
    if (!gunAudioCtx) gunAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (gunAudioCtx.state === 'suspended') gunAudioCtx.resume();
  }

  function playGunshot() {
    warmAudioCtx();
    var ctx = gunAudioCtx;
    var t = ctx.currentTime;
    // White-noise burst (the bang)
    var dur = 0.12;
    var buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.02));
    var src = ctx.createBufferSource();
    src.buffer = buf;
    // Bandpass for punch
    var bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 800; bp.Q.value = 0.6;
    // Compressor for loudness
    var comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -20; comp.ratio.value = 12;
    // Gain
    var gain = ctx.createGain();
    gain.gain.setValueAtTime(1.0, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + dur);
    src.connect(bp); bp.connect(comp); comp.connect(gain); gain.connect(ctx.destination);
    src.start(t); src.stop(t + dur);
    // Low thud overlay
    var osc = ctx.createOscillator();
    osc.type = 'sine'; osc.frequency.setValueAtTime(80, t); osc.frequency.exponentialRampToValueAtTime(30, t + 0.15);
    var oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.6, t); oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
    osc.connect(oscGain); oscGain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.15);
  }

  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smoothstep(t) { return t * t * (3 - 2 * t); }
  function isCanvasLevel(level) { return level === 2 || level === 3; }

  function clearPendingTimers() {
    clearTimeout(timerId);
    if (lightIntervalId) {
      clearInterval(lightIntervalId);
      lightIntervalId = null;
    }
  }

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     CANVAS SIZING
     â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
  function sizeCanvas() {
    var rect = el.gameArea.getBoundingClientRect();
    el.canvas.width = rect.width;
    el.canvas.height = rect.height;
    level2BgCached = false;
  }

 /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     LEVEL 2 GRAPHICS â€“ Drag Race
     â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
  var level2BgCanvas = document.createElement('canvas');
  var level2BgCached = false;

  var DRAG_PITCH = 0.2;
  var DRAG_NOSE_OFFSET = 240;
  var DRAG_COCKPIT_SHIFT = 120;
  var DRAG_BODY_WIDTH = 42;
  var DRAG_WING_SHIFT = -120;
  var DRAG_WHEEL_SPREAD = 65;
  var DRAG_WING_WIDTH = 120;
  var START_LINE_X = 250;
  var FINISH_LINE_X = 695;
  var TRACK_PPM = (FINISH_LINE_X - START_LINE_X) / 100;

  var TRACK_HORIZON_RATIO = 0.03;
  var TRACK_CURVE_POWER = 0.69;
  var TRACK_Y_BASE = 0.94;
  var TRACK_Y_SPREAD = 0.85;
  var TRACK_WIDTH_BOT = 426;
  var TRACK_WIDTH_TOP = 162;
  var LANE_GAP_BOT = 164;
  var LANE_GAP_TOP = 73;
  var CAR_SCALE_MIN = 0.22;
  var CAR_SCALE_MAX = 2.92;

  function getHorizonY(h) { 
    return h * TRACK_HORIZON_RATIO; 
  }
  
  function projectYFromDistance(distance, h) {
    var t = Math.min(1, distance / DRAG_FINISH_DISTANCE);
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

  function drawRearWheel(ctx, x, y, width, height, pitch) {
    ctx.save(); ctx.translate(x, y);
    var displayH = height * (1 - pitch * 0.5);
    var topCapH = pitch * 20;
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath(); ctx.ellipse(0, displayH / 2, width / 2 + 5, 10 * (1-pitch*0.5), 0, 0, Math.PI * 2); ctx.fill();
    var tireGrad = ctx.createLinearGradient(-width/2, 0, width/2, 0);
    tireGrad.addColorStop(0, '#020617'); tireGrad.addColorStop(0.3, '#1e293b'); tireGrad.addColorStop(0.5, '#334155'); tireGrad.addColorStop(0.7, '#1e293b'); tireGrad.addColorStop(1, '#020617'); 
    ctx.fillStyle = tireGrad;
    roundRect(ctx, -width/2, -displayH/2, width, displayH, 8, true);
    if (pitch > 0.05) {
        var topGrad = ctx.createRadialGradient(0, -displayH/2, 0, 0, -displayH/2, width/2);
        topGrad.addColorStop(0, '#1e293b'); topGrad.addColorStop(1, '#020617');
        ctx.fillStyle = topGrad;
        ctx.beginPath(); ctx.ellipse(0, -displayH/2, width/2, topCapH, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function drawFrontWheel(ctx, x, y, width, height, pitch) {
    ctx.save(); ctx.translate(x, y);
    var displayH = height * (1 - pitch * 0.4);
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath(); ctx.ellipse(0, displayH / 2, width / 2 + 2, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0f172a';
    roundRect(ctx, -width/2, -displayH/2, width, displayH, 2, true);
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

  function drawRocketJet(ctx, x, y, pitch, showFire) {
    ctx.save(); ctx.translate(x, y);
    var nozzleGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 15);
    nozzleGrad.addColorStop(0, '#1e293b'); nozzleGrad.addColorStop(1, '#020617');
    ctx.fillStyle = nozzleGrad;
    ctx.beginPath(); ctx.ellipse(0, 0, 16, 12 * (1 - pitch * 0.5), 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ef4444';
    ctx.beginPath(); ctx.ellipse(0, 0, 6, 4 * (1 - pitch * 0.5), 0, 0, Math.PI * 2); ctx.fill();
    if (showFire) {
      var flameSize = 40 + Math.random() * 30;
      var flameGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, flameSize);
      flameGrad.addColorStop(0, 'rgba(255, 255, 200, 1)'); flameGrad.addColorStop(0.4, 'rgba(255, 150, 0, 0.8)'); flameGrad.addColorStop(1, 'rgba(255, 0, 0, 0)');
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = flameGrad;
      ctx.beginPath(); ctx.ellipse(0, 15, flameSize * 0.6, flameSize * 1.2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
  }

  function drawExhaustPipes(ctx, xSide, yBase, pitch, showFire) {
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
        if (showFire) drawFire(ctx, 0, -12, pitch, xSide);
        ctx.restore();
    }
    ctx.restore();
  }

  function drawChromeEngine(ctx, x, y, width, pitch) {
    ctx.save(); ctx.translate(x, y);
    var chrome = ctx.createLinearGradient(-width/2, 0, width/2, 0);
    chrome.addColorStop(0, '#71717a'); chrome.addColorStop(0.2, '#f4f4f5'); chrome.addColorStop(0.5, '#a1a1aa'); chrome.addColorStop(0.8, '#ffffff'); chrome.addColorStop(1, '#52525b');
    ctx.fillStyle = chrome;
    var engineH = 25 * (1 - pitch * 0.4);
    roundRect(ctx, -width/2, -engineH/2, width, engineH, 5, true);
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 1;
    for (var i = -width/2 + 5; i < width/2; i += 6) {
      ctx.beginPath(); ctx.moveTo(i, -engineH/2 + 2); ctx.lineTo(i, engineH/2 - 2); ctx.stroke();
    }
    ctx.fillStyle = '#e4e4e7';
    var scoopW = width * 0.8; var scoopH = 12 * (1 - pitch * 0.5);
    roundRect(ctx, -scoopW/2, -engineH/2 - scoopH, scoopW, scoopH, 4, true);
    ctx.fillStyle = '#18181b';
    ctx.beginPath(); ctx.ellipse(0, -engineH/2 - scoopH, scoopW*0.4, scoopH*0.3, 0, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }

  function drawDriverHelmet(ctx, x, y, size, pitch) {
    ctx.save(); ctx.translate(x, y);
    var helmetH = size * (1 - pitch * 0.3);
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); 
    ctx.ellipse(0, 0, size/3, helmetH/2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
  }

  function drawDragster(ctx, bodyColor, stripeColor, showFire) {
    var pitch = DRAG_PITCH;
    var rearY = 110; 
    var noseY = rearY - (DRAG_NOSE_OFFSET * (1 - pitch * 0.3));
    var cockpitTopY = rearY - DRAG_COCKPIT_SHIFT; 
    var noseExtend = noseY - 15;
    var bodyRearY = rearY + 30; 

    // Chassis Components
    ctx.strokeStyle = '#334155'; ctx.lineWidth = 4 * (1-pitch*0.2); ctx.beginPath(); ctx.moveTo(0, rearY); ctx.lineTo(0, noseY); ctx.stroke();
    ctx.lineWidth = 2; var axleSpread = 18 * (1-pitch*0.1); ctx.beginPath(); ctx.moveTo(-axleSpread, noseY); ctx.lineTo(axleSpread, noseY); ctx.stroke();
    drawFrontWheel(ctx, -axleSpread, noseY, 6, 24, pitch); drawFrontWheel(ctx, axleSpread, noseY, 6, 24, pitch);
    ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(-DRAG_WHEEL_SPREAD, rearY); ctx.lineTo(DRAG_WHEEL_SPREAD, rearY); ctx.stroke();
    drawRearWheel(ctx, -DRAG_WHEEL_SPREAD, rearY, 48, 120, pitch); drawRearWheel(ctx, DRAG_WHEEL_SPREAD, rearY, 48, 120, pitch);

    // Aero Body
    var bodyGrad = ctx.createLinearGradient(0, noseExtend, 0, bodyRearY);
    bodyGrad.addColorStop(0, '#94a3b8'); bodyGrad.addColorStop(0.2, bodyColor); bodyGrad.addColorStop(0.9, '#1e293b'); bodyGrad.addColorStop(1, '#020617');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath(); var halfW = DRAG_BODY_WIDTH / 2; var halfFrontW = 7; 
    ctx.moveTo(-halfW, bodyRearY); ctx.lineTo(halfW, bodyRearY); ctx.lineTo(halfW, cockpitTopY); ctx.lineTo(halfFrontW, noseY); ctx.lineTo(halfFrontW * 0.7, noseExtend); ctx.lineTo(-halfFrontW * 0.7, noseExtend); ctx.lineTo(-halfFrontW, noseY); ctx.lineTo(-halfW, cockpitTopY); ctx.closePath(); ctx.fill();

    drawRocketJet(ctx, 0, bodyRearY, pitch, showFire);

    // Details
    ctx.fillStyle = stripeColor; ctx.beginPath(); ctx.moveTo(-2, cockpitTopY); ctx.lineTo(2, cockpitTopY); ctx.lineTo(1.5, noseExtend); ctx.lineTo(-1.5, noseExtend); ctx.closePath(); ctx.fill();
    drawChromeEngine(ctx, 0, cockpitTopY - 35, DRAG_BODY_WIDTH * 0.85, pitch);
    drawDriverHelmet(ctx, 0, cockpitTopY + 22, 32, pitch); 
    drawExhaustPipes(ctx, -1, cockpitTopY - 10, pitch, showFire);
    drawExhaustPipes(ctx, 1, cockpitTopY - 10, pitch, showFire);
    ctx.fillStyle = 'rgba(186, 230, 253, 0.4)'; var canopyW = DRAG_BODY_WIDTH - 12; var canopyH = 35 * (1-pitch*0.5);
    roundRect(ctx, -canopyW/2, cockpitTopY + 10, canopyW, canopyH, 10, true);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'; ctx.lineWidth = 1; ctx.stroke();

    // Wing
    var wingY = bodyRearY + DRAG_WING_SHIFT * (1-pitch*0.5);
    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-18, rearY + 10); ctx.lineTo(-28, wingY); ctx.moveTo(18, rearY + 10); ctx.lineTo(28, wingY); ctx.stroke();
    var wingPlankH = 15 + pitch * 30; ctx.fillStyle = '#94a3b8';
    roundRect(ctx, -DRAG_WING_WIDTH/2, wingY, DRAG_WING_WIDTH, wingPlankH, 4, true);
    ctx.fillStyle = bodyColor; var epH = 45; roundRect(ctx, -DRAG_WING_WIDTH/2 - 2, wingY - epH/3, 6, epH, 2, true); roundRect(ctx, DRAG_WING_WIDTH/2 - 4, wingY - epH/3, 6, epH, 2, true);
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
    drawDragster(ctx, bodyColor, stripeColor, car.speed > 0);
    ctx.restore();
  }
  
  function drawTrackAsphalt(ctx, w, h) {
    var horizon = getHorizonY(h);
    var center = w / 2;
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
      else { ctx.moveTo(xb0 - th0, yb0); ctx.lineTo(xb0, yb0); ctx.lineTo(xb1, yb1); ctx.lineTo(xb1 - th1, yb1); }
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
    var finishY = projectYFromDistance(DRAG_FINISH_DISTANCE, h);
    var horizon = getHorizonY(h);
    var t = (finishY - horizon) / (h - horizon);
    var halfW = lerp(TRACK_WIDTH_TOP, TRACK_WIDTH_BOT, t);
    var bandH = lerp(12, 34, t);
    var left = center - halfW * 0.58;
    var right = center + halfW * 0.58;
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
      var inBotX = center + side * (TRACK_WIDTH_TOP + 15 + ((topY + standH) - horizon)/(h - horizon) * (TRACK_WIDTH_BOT - TRACK_WIDTH_TOP));
      
      var outTopX = inTopX + side * 180;
      var outBotX = inBotX + side * 400;

      ctx.fillStyle = 'rgba(15,23,42,0.82)';
      ctx.beginPath();
      ctx.moveTo(inTopX, topY);
      ctx.lineTo(outTopX, topY - 15);
      ctx.lineTo(outBotX, topY + standH);
      ctx.lineTo(inBotX, topY + standH);
      ctx.closePath();
      ctx.fill();

      for (var r = 1; r <= rows; r++) {
        var t = Math.pow(r / rows, 1.2);
        var rY = topY + t * standH;
        var lineInX = center + side * (TRACK_WIDTH_TOP + 15 + (rY - horizon)/(h - horizon) * (TRACK_WIDTH_BOT - TRACK_WIDTH_TOP));
        var lineOutX = lineInX + side * lerp(180, 400, t);
        
        ctx.strokeStyle = r % 2 === 0 ? '#94a3b8' : '#64748b';
        ctx.lineWidth = 1 + t * 3;
        ctx.beginPath();
        ctx.moveTo(lineInX, rY);
        ctx.lineTo(lineOutX, rY - 12*(1-t));
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawBulb(ctx, x, y, r, color) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = (color === '#404047' || color === '#3a3a3f') ? 0 : 14;
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  
  function drawCenterTree(ctx, w, h, lightIdx, isGreen) {
    var x = w / 2, y = h * 0.28;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(0.92, 0.92);
    ctx.fillStyle = '#6b7280';
    roundRect(ctx, -11, -15, 22, 230, 10, true);
    roundRect(ctx, -70, -70, 140, 24, 8, true);
    roundRect(ctx, -58, -38, 116, 24, 8, true);
    var stackY = [0, 24, 48, 80, 110];
    for (var i = 0; i < 3; i++) {
      var on = lightIdx >= i;
      drawBulb(ctx, -26, stackY[i], 11, on ? '#ffd43b' : '#404047');
      drawBulb(ctx, 26, stackY[i], 11, on ? '#ffd43b' : '#404047');
    }
    drawBulb(ctx, -26, stackY[3], 11, isGreen ? '#16db65' : '#404047');
    drawBulb(ctx, 26, stackY[3], 11, isGreen ? '#16db65' : '#404047');
    ctx.fillStyle = '#4b5563';
    roundRect(ctx, -22, 214, 44, 12, 6, true);
    ctx.restore();
  }

  function cacheLevel2Background(w, h) {
    level2BgCanvas.width = w;
    level2BgCanvas.height = h;
    var ctx = level2BgCanvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, w, h);
    drawTrackAsphalt(ctx, w, h);
    drawBleachers(ctx, w, h);
    drawFinishLine(ctx, w, h);
    drawBarriers(ctx, w, h);
    level2BgCached = true;
  }
  
  function drawDragRaceScene(ctx, w, h, rc, lightIdx, isGreen) {
    if (!level2BgCached) cacheLevel2Background(w, h);
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(level2BgCanvas, 0, 0); 
    drawCenterTree(ctx, w, h, lightIdx, isGreen);

    var cars = [
      { lane: -1, distance: rc.opponentDist, speed: rc.opponentSpeed, color: '#d4a247', stripe: '#8e6222' },
      { lane: 1, distance: rc.playerDist, speed: rc.playerSpeed, color: '#e11d48', stripe: '#8f1239' }
    ];
    cars.sort(function(a, b) { return b.distance - a.distance; });
    for (var i = 0; i < cars.length; i++) {
      drawCar(ctx, cars[i], w, h, cars[i].color, cars[i].stripe);
    }
  }

  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
      LEVEL 3 GRAPHICS â€“ Sprint Track (simplified)
     â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

  // â”€â”€ Flattened runner config (dead params inlined) â”€â”€
  var RUNNER_CFG = {
    bodyScale: 1.28, runnerYOffset: 11,
    hipBaseX: -102, hipBaseY: -84,
    shoulderOffX: 81, shoulderOffY: 19,
    shoulderReduce: 56, shoulderLift: 76,
    neckOffX: 20, neckOffY: -4,
    neckReduce: 10, neckLift: 12,
    headOffX: 16.5, headOffY: -4,
    headReduce: 17, headLift: 9,
    headRx: 14.5, headRy: 18, hairR: 15,
    neckW: 12.5, upperArmW: 12.5, lowerArmW: 10.5,
    upperLegW: 20, lowerLegW: 12,
    riseDur: 1.0, phaseDelay: 0.04, phaseBase: 8.7, phaseGain: 2.0, blendDur: 0.24,
    torsoLeanAmt: 0.99, torsoLeanDist: 19.5,
    hipFwd: 43, hipDrop: 12,
    legBase: 0.60, thighAmp: 1.18, shinBase: 1.10, shinPush: 0.14,
    armSwing: 1.23, elbowBase: 1.28, elbowGain: 0.90,
    footBase: 0.15, footGain: -0.18, footRecover: -0.44, footPhase: 0.42,
    upperArmL: 26, lowerArmL: 24, upperLegL: 41, lowerLegL: 39, footL: 18,
    primary: '#3f67c6', skin: '#d89c6e', shoe: '#edf2ff', hair: '#121212',
    shadow: 'rgba(0,0,0,0.18)'
  };

  // â”€â”€ Pre-built configs for the two runners â”€â”€
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
    opponentCfg = buildRunnerCfg({ bodyScale: 0.96, runnerYOffset: 8, primary: '#1e3799', skin: '#8d6e4c' });
    playerCfg = buildRunnerCfg({ bodyScale: 1.08, primary: '#c23616', skin: '#c98a63' });
  }

  // â”€â”€ Pose helpers â”€â”€
  function ptVert(base, len, angle) {
    return { x: base.x + Math.sin(angle) * len, y: base.y + Math.cos(angle) * len };
  }

  function mixPose(a, b, t) {
    var out = {};
    for (var k in a) {
      if (a.hasOwnProperty(k)) {
        out[k] = { x: lerp(a[k].x, b[k].x, t), y: lerp(a[k].y, b[k].y, t) };
      }
    }
    return out;
  }

  function getSetPose(cfg) {
    return {
      frontHand: { x: -4, y: 0 }, backHand: { x: -31, y: 1 },
      shoulder: { x: -36, y: -58 }, neck: { x: -14, y: -62 }, head: { x: 5, y: -74 },
      hip: { x: cfg.hipBaseX, y: cfg.hipBaseY },
      frontElbow: { x: -16, y: -32 }, backElbow: { x: -50, y: -35 },
      frontKnee: { x: -73, y: -30 }, frontAnkle: { x: -99, y: -5 }, frontToe: { x: -117, y: 1 },
      backKnee: { x: -125, y: -42 }, backAnkle: { x: -147, y: -16 }, backToe: { x: -158, y: -13 }
    };
  }

  function getRunnerDistance(t) {
    var tAccel = RUNNER_TOP_SPEED / RUNNER_ACCEL;
    if (t <= tAccel) return 0.5 * RUNNER_ACCEL * t * t;
    return (0.5 * RUNNER_ACCEL * tAccel * tAccel) + RUNNER_TOP_SPEED * (t - tAccel);
  }

  function clampToe(knee, ankle, toe) {
    if (toe.y <= 0) return { knee: knee, ankle: ankle, toe: toe };
    var s = toe.y;
    return { knee: { x: knee.x, y: knee.y - s }, ankle: { x: ankle.x, y: ankle.y - s }, toe: { x: toe.x, y: 0 } };
  }

  // â”€â”€ Pose calculation (same kinematics, flattened param names) â”€â”€
  function calcPose(t, cfg) {
    var dist = getRunnerDistance(t);
    var rise = smoothstep(clamp(t / cfg.riseDur, 0, 1));
    var phase = Math.max(0, t - cfg.phaseDelay) * (cfg.phaseBase + cfg.phaseGain * rise);

    var hip = { x: cfg.hipBaseX + cfg.hipFwd * rise, y: cfg.hipBaseY + cfg.hipDrop * rise };
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
      var toe = { x: ankle.x + Math.cos(fa) * cfg.footL, y: ankle.y + Math.sin(fa) * cfg.footL + 2 };
      return clampToe(knee, ankle, toe);
    }

    function arm(drive) {
      var uaA = cfg.armSwing * drive - lean;
      var elbow = { x: shoulder.x + Math.sin(uaA) * cfg.upperArmL, y: shoulder.y + Math.cos(uaA) * cfg.upperArmL };
      var laA = uaA + cfg.elbowBase + cfg.elbowGain * drive;
      var hand = { x: elbow.x + Math.sin(laA) * cfg.lowerArmL, y: elbow.y + Math.cos(laA) * cfg.lowerArmL };
      return { elbow: elbow, hand: hand };
    }

    var fDrive = Math.sin(phase), bDrive = Math.sin(phase + Math.PI);
    var fLeg = leg(fDrive, phase), bLeg = leg(bDrive, phase + Math.PI);
    var fArm = arm(-fDrive), bArm = arm(-bDrive);

    return {
      shoulder: shoulder, neck: neck, head: head, hip: hip,
      frontHand: fArm.hand, backHand: bArm.hand,
      frontElbow: fArm.elbow, backElbow: bArm.elbow,
      frontKnee: fLeg.knee, frontAnkle: fLeg.ankle, frontToe: fLeg.toe,
      backKnee: bLeg.knee, backAnkle: bLeg.ankle, backToe: bLeg.toe
    };
  }

  // â”€â”€ Drawing primitives â”€â”€

  function drawLimb(ctx, a, b, color, wA, wB) {
    var dx = b.x - a.x, dy = b.y - a.y;
    var len = Math.hypot(dx, dy), angle = Math.atan2(dy, dx);
    ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(angle);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, -wA / 2);
    ctx.quadraticCurveTo(len * 0.5, -Math.max(wA, wB) * 0.55, len, -wB / 2);
    ctx.lineTo(len, wB / 2);
    ctx.quadraticCurveTo(len * 0.5, Math.max(wA, wB) * 0.55, 0, wA / 2);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function drawShoe(ctx, ankle, toe, cfg) {
    var angle = Math.atan2(toe.y - ankle.y, toe.x - ankle.x);
    var cx = (ankle.x + toe.x) * 0.5, cy = (ankle.y + toe.y) * 0.5 - 1;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(angle);
    ctx.fillStyle = cfg.shoe;
    ctx.beginPath(); ctx.ellipse(1, 0, 12, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#cdd5df';
    ctx.fillRect(-8, 1, 16, 1.5);
    ctx.restore();
  }

  function drawHand(ctx, hand, elbow, skin) {
    var angle = Math.atan2(hand.y - elbow.y, hand.x - elbow.x);
    ctx.save(); ctx.translate(hand.x, hand.y); ctx.rotate(angle);
    ctx.fillStyle = skin;
    ctx.beginPath(); ctx.ellipse(0, 0, 5, 3.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawLeg(ctx, hip, knee, ankle, toe, cfg) {
    var mid = { x: lerp(hip.x, knee.x, 0.5), y: lerp(hip.y, knee.y, 0.5) };
    drawLimb(ctx, hip, mid, cfg.primary, cfg.upperLegW, cfg.upperLegW * 0.82);
    drawLimb(ctx, mid, knee, cfg.skin, cfg.upperLegW * 0.82, cfg.upperLegW * 0.7);
    drawLimb(ctx, knee, ankle, cfg.skin, cfg.lowerLegW, cfg.lowerLegW * 0.6);
    drawShoe(ctx, ankle, toe, cfg);
  }

  function drawArm(ctx, shoulder, elbow, hand, cfg) {
    drawLimb(ctx, shoulder, elbow, cfg.skin, cfg.upperArmW, cfg.upperArmW * 0.82);
    drawLimb(ctx, elbow, hand, cfg.skin, cfg.lowerArmW, cfg.lowerArmW * 0.66);
    drawHand(ctx, hand, elbow, cfg.skin);
  }

  function drawTorso(ctx, pose, cfg) {
    var sx = pose.shoulder.x, sy = pose.shoulder.y;
    var hx = pose.hip.x, hy = pose.hip.y + 7;
    var dx = hx - sx, dy = hy - sy;
    var nx = -dy, ny = dx;
    var len = Math.hypot(dx, dy) || 1;
    nx /= len; ny /= len;
    var topW = 13, botW = 10, chestW = 16;
    var mx = lerp(sx, hx, 0.35), my = lerp(sy, hy, 0.35);
    ctx.fillStyle = cfg.primary;
    ctx.beginPath();
    ctx.moveTo(sx + nx * topW, sy + ny * topW);
    ctx.quadraticCurveTo(mx + nx * chestW, my + ny * chestW, hx + nx * botW, hy + ny * botW);
    ctx.quadraticCurveTo(hx - nx * botW * 0.3, hy - ny * botW * 0.3, hx - nx * botW, hy - ny * botW);
    ctx.quadraticCurveTo(mx - nx * chestW * 0.6, my - ny * chestW * 0.6, sx - nx * topW * 0.7, sy - ny * topW * 0.7);
    ctx.closePath(); ctx.fill();
  }

  function drawHead(ctx, pose, cfg) {
    ctx.fillStyle = cfg.skin;
    ctx.beginPath(); ctx.ellipse(pose.head.x, pose.head.y, cfg.headRx, cfg.headRy, -0.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = cfg.hair;
    ctx.beginPath(); ctx.arc(pose.head.x, pose.head.y - 3, cfg.hairR, Math.PI, Math.PI * 2); ctx.fill();
  }

  // â”€â”€ Composite runner draw â”€â”€
  function drawRunner(ctx, x, groundY, localT, cfg) {
    var runPose = calcPose(localT, cfg);
    var blend = smoothstep(clamp(localT / cfg.blendDur, 0, 1));
    var pose = mixPose(getSetPose(cfg), runPose, blend);

    ctx.save();
    ctx.translate(x, groundY + cfg.runnerYOffset);
    ctx.scale(cfg.bodyScale, cfg.bodyScale);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';

    ctx.fillStyle = cfg.shadow;
    ctx.beginPath(); ctx.ellipse(-78, 4, 86, 8, 0, 0, Math.PI * 2); ctx.fill();

    drawArm(ctx, pose.shoulder, pose.backElbow, pose.backHand, cfg);
    drawLeg(ctx, pose.hip, pose.backKnee, pose.backAnkle, pose.backToe, cfg);
    drawTorso(ctx, pose, cfg);
    drawLeg(ctx, pose.hip, pose.frontKnee, pose.frontAnkle, pose.frontToe, cfg);
    drawArm(ctx, pose.shoulder, pose.frontElbow, pose.frontHand, cfg);
    drawLimb(ctx, { x: pose.shoulder.x + 2, y: pose.shoulder.y - 1 }, pose.neck, cfg.skin, cfg.neckW, cfg.neckW * 0.8);
    drawHead(ctx, pose, cfg);

    ctx.restore();
  }

  // â”€â”€ Scrolling track constants â”€â”€
  var TRACK_DISTANCE = 50;       // meters
  var VIEWPORT_METERS = 20;      // meters visible at once
  var VIRT_W = 800, VIRT_H = 400;
  var TRACK_PPM_VIEW = VIRT_W / VIEWPORT_METERS;  // 40 px per meter
  var TRACK_TOP_Y = 285;         // where track surface starts (virtual coords)
  var LANE1_Y = 315;
  var LANE2_Y = 355;

  // â”€â”€ Draw scrolling track background each frame â”€â”€
  function drawScrollingTrack(ctx, cameraM) {
    // Sky (static â€” doesn't scroll)
    var sky = ctx.createLinearGradient(0, 0, 0, 280);
    sky.addColorStop(0, '#4a90d9');
    sky.addColorStop(0.6, '#87CEEB');
    sky.addColorStop(1, '#b8dff5');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, VIRT_W, 280);

    // Clouds scroll at 10% parallax
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    var cx = -(cameraM * TRACK_PPM_VIEW * 0.10) % (VIRT_W + 200);
    ctx.beginPath(); ctx.ellipse(130 + cx, 60, 70, 22, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(160 + cx, 55, 50, 18, 0.1, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(520 + cx, 90, 60, 20, -0.05, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(550 + cx, 85, 45, 16, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(720 + cx, 45, 55, 18, 0, 0, Math.PI * 2); ctx.fill();

    // Treeline at 30% parallax
    var tx = -(cameraM * TRACK_PPM_VIEW * 0.30);
    ctx.fillStyle = '#3a6e3a';
    ctx.beginPath(); ctx.moveTo(0, 270);
    for (var i = 0; i <= VIRT_W; i += 12) {
      var worldI = i - tx;
      ctx.lineTo(i, 262 + Math.sin(worldI * 0.03) * 6 + Math.sin(worldI * 0.08) * 3);
    }
    ctx.lineTo(VIRT_W, 280); ctx.lineTo(0, 280); ctx.closePath(); ctx.fill();

    // Grass infield
    var grass = ctx.createLinearGradient(0, 270, 0, TRACK_TOP_Y);
    grass.addColorStop(0, '#4a8c3f'); grass.addColorStop(1, '#3d7a34');
    ctx.fillStyle = grass; ctx.fillRect(0, 270, VIRT_W, TRACK_TOP_Y - 270);

    // Track surface
    var tg = ctx.createLinearGradient(0, TRACK_TOP_Y, 0, VIRT_H);
    tg.addColorStop(0, '#c75a28'); tg.addColorStop(0.5, '#b7410e'); tg.addColorStop(1, '#9a3610');
    ctx.fillStyle = tg; ctx.fillRect(0, TRACK_TOP_Y, VIRT_W, VIRT_H - TRACK_TOP_Y);

    // Track texture grain
    ctx.strokeStyle = 'rgba(0,0,0,0.06)'; ctx.lineWidth = 1;
    for (var ty = TRACK_TOP_Y + 3; ty < VIRT_H; ty += 4) {
      ctx.beginPath(); ctx.moveTo(0, ty); ctx.lineTo(VIRT_W, ty); ctx.stroke();
    }

    // Lane lines
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 300); ctx.lineTo(VIRT_W, 300);
    ctx.moveTo(0, 335); ctx.lineTo(VIRT_W, 335);
    ctx.moveTo(0, 370); ctx.lineTo(VIRT_W, 370);
    ctx.stroke();

    // Track edge
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, TRACK_TOP_Y); ctx.lineTo(VIRT_W, TRACK_TOP_Y); ctx.stroke();

    // â”€â”€ World-positioned features (scroll with camera) â”€â”€
    var camPx = cameraM * TRACK_PPM_VIEW; // camera offset in pixels

    // Distance markers every 10m
    ctx.font = '700 11px Segoe UI, sans-serif'; ctx.textAlign = 'center';
    for (var dm = 0; dm <= TRACK_DISTANCE; dm += 10) {
      var mx = dm * TRACK_PPM_VIEW - camPx;
      if (mx < -40 || mx > VIRT_W + 40) continue;
      // Tick on track edge
      ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(mx, TRACK_TOP_Y); ctx.lineTo(mx, TRACK_TOP_Y + 8); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillText(dm + 'm', mx, TRACK_TOP_Y - 4);
    }

    // Start line (at 0m)
    var startPx = 0 - camPx;
    if (startPx > -20 && startPx < VIRT_W + 20) {
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 4;
      ctx.setLineDash([8, 6]);
      ctx.beginPath(); ctx.moveTo(startPx, TRACK_TOP_Y); ctx.lineTo(startPx, VIRT_H); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#fff'; ctx.font = '700 11px Segoe UI, sans-serif';
      ctx.fillText('START', startPx, TRACK_TOP_Y - 4);
    }

    // Finish line â€” checkerboard
    var finPx = TRACK_DISTANCE * TRACK_PPM_VIEW - camPx;
    if (finPx > -20 && finPx < VIRT_W + 20) {
      var flX = finPx - 8, flW = 16, sqS = 8;
      for (var fy = TRACK_TOP_Y; fy < VIRT_H; fy += sqS) {
        for (var fx = flX; fx < flX + flW; fx += sqS) {
          var ci = Math.floor((fx - flX) / sqS) + Math.floor((fy - TRACK_TOP_Y) / sqS);
          ctx.fillStyle = ci % 2 === 0 ? '#fff' : '#111';
          ctx.fillRect(fx, fy, sqS, Math.min(sqS, VIRT_H - fy));
        }
      }
      ctx.fillStyle = '#fff'; ctx.font = '700 12px Segoe UI, sans-serif';
      ctx.fillText('FINISH', finPx, TRACK_TOP_Y - 4);
    }
  }

  // â”€â”€ Starter official figure â”€â”€
  function drawStarter(ctx, gunFired, flashAlpha) {
    var sx = 0, sy = 84;
    ctx.save();
    ctx.translate(sx, sy);

    // Legs
    ctx.strokeStyle = '#1a1a2e'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-5, 18); ctx.lineTo(-4, 34); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(5, 18); ctx.lineTo(6, 34); ctx.stroke();
    // Shoes
    ctx.fillStyle = '#222';
    ctx.fillRect(-7, 32, 6, 3); ctx.fillRect(3, 32, 6, 3);
    // Torso
    ctx.fillStyle = '#f0f0f0';
    ctx.beginPath(); ctx.moveTo(-7, -2); ctx.lineTo(7, -2); ctx.lineTo(6, -22); ctx.lineTo(-6, -22); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#bbb'; ctx.lineWidth = 0.6; ctx.stroke();
    // Head
    ctx.fillStyle = '#c98a63';
    ctx.beginPath(); ctx.arc(0, -28, 6, 0, Math.PI * 2); ctx.fill();
    // Cap
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath(); ctx.ellipse(0, -32, 7, 3, -0.1, 0, Math.PI, true); ctx.fill();
    ctx.fillRect(-7, -33, 14, 2);

    // Arm holding gun (raised)
    var armEndX = 14, armEndY = -32;
    ctx.strokeStyle = '#c98a63'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(6, -18); ctx.quadraticCurveTo(12, -24, armEndX, armEndY); ctx.stroke();
    // Gun
    ctx.fillStyle = '#333';
    ctx.save(); ctx.translate(armEndX, armEndY); ctx.rotate(-0.3);
    ctx.fillRect(-1, -8, 3, 10);   // barrel
    ctx.fillRect(-2, 0, 5, 4);     // grip
    ctx.restore();

    // Muzzle flash
    if (gunFired && flashAlpha > 0) {
      ctx.save(); ctx.translate(armEndX, armEndY - 10); ctx.rotate(-0.3);
      ctx.globalAlpha = flashAlpha;
      // Flash spikes
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(0, -3); ctx.lineTo(-4, -14); ctx.lineTo(0, -10); ctx.lineTo(4, -14); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffdd44';
      ctx.beginPath();
      ctx.moveTo(0, -2); ctx.lineTo(-6, -18); ctx.lineTo(-1, -8); ctx.lineTo(1, -8); ctx.lineTo(6, -18); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ff6600';
      ctx.beginPath(); ctx.arc(0, -4, 5, 0, Math.PI * 2); ctx.fill();
      // Smoke puff
      ctx.fillStyle = 'rgba(200,200,200,' + (flashAlpha * 0.5) + ')';
      ctx.beginPath(); ctx.ellipse(-2, -16, 8 + (1 - flashAlpha) * 12, 5 + (1 - flashAlpha) * 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // Other arm at side
    ctx.strokeStyle = '#c98a63'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(-6, -18); ctx.quadraticCurveTo(-10, -8, -8, 0); ctx.stroke();

    ctx.restore();
  }

  // â”€â”€ Signal text overlay â”€â”€
  function drawTrackSignalText(ctx, signal) {
    // Signal text handled by HTML #track-signal overlay
  }

  function drawTrackScene(ctx, w, h, rc, signal) {
    if (!opponentCfg) initRunnerCfgs();

    ctx.clearRect(0, 0, w, h);
    ctx.save(); ctx.scale(w / VIRT_W, h / VIRT_H);

    var timeSinceGreen = rc.greenTime > 0 ? (rc.now - rc.greenTime) / 1000 : 0;

    // Camera follows the lead runner, keeping runners ~30% from left
    var leadDist = Math.max(rc.opponentDist, rc.playerDist);
    var camTarget = leadDist - VIEWPORT_METERS * 0.30;
    var cameraM = Math.max(-3, Math.min(camTarget, TRACK_DISTANCE - VIEWPORT_METERS + 3));

    // Draw scrolling track (sky, surface, markers, start/finish)
    drawScrollingTrack(ctx, cameraM);

    var camPx = cameraM * TRACK_PPM_VIEW;

    // Starter official (world pos = 10m, standing on the track)
    var starterWorldPx = 10 * TRACK_PPM_VIEW - camPx;
    if (starterWorldPx > -120 && starterWorldPx < VIRT_W + 120) {
      ctx.save(); ctx.translate(starterWorldPx, 0);
      ctx.scale(2.5, 2.5);
      var gunFired = signal === 'BANG!' || (rc.greenTime > 0);
      var flashAlpha = 0;
      if (muzzleFlashStart > 0 && rc.now > 0) {
        var elapsed = rc.now - muzzleFlashStart;
        if (elapsed < MUZZLE_FLASH_DURATION) flashAlpha = 1 - (elapsed / MUZZLE_FLASH_DURATION);
      }
      drawStarter(ctx, gunFired, flashAlpha);
      ctx.restore();
    }

    // Opponent (lane 1) world position in meters -> screen px
    var localOppT = rc.opponentLaunched ? Math.max(0, timeSinceGreen - opponentDelay) : 0;
    var oppScreenX = rc.opponentDist * TRACK_PPM_VIEW - camPx;
    drawRunner(ctx, oppScreenX, LANE1_Y, Math.max(0, localOppT), opponentCfg);

    // Player (lane 2)
    var playerRT2 = rc.playerReactionTime !== null ? rc.playerReactionTime : Infinity;
    var localPlayerT = rc.playerLaunched ? Math.max(0, timeSinceGreen - playerRT2) : 0;
    var playerScreenX = rc.playerDist * TRACK_PPM_VIEW - camPx;
    drawRunner(ctx, playerScreenX, LANE2_Y, Math.max(0, localPlayerT), playerCfg);

    // Distance HUD
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(10, 8, 160, 40);
    ctx.fillStyle = '#fff'; ctx.font = '700 13px Segoe UI, sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('You: ' + rc.playerDist.toFixed(1) + ' m', 18, 24);
    ctx.fillText('Opp: ' + rc.opponentDist.toFixed(1) + ' m', 18, 42);

    // Signal text on canvas
    drawTrackSignalText(ctx, signal);

    ctx.restore();
  }


  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     LAB REBUILD â€“ notebook workflow + SCORM scoring
     â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
  var REQUIRED_TRIALS = 3;
  var LAB_PASS_SCORE = 80;
  var ANALYSIS_MIN_LENGTH = 20;

  var SCENARIOS = {
    1: {
      title: 'Falling Ruler',
      shortTitle: 'Falling Ruler',
      subtitle: 'Classical Gravity',
      description: 'Measure how far a ruler falls while you react to the release. This scenario models an object starting from rest and accelerating downward under gravity.',
      unit: 'cm',
      distanceLabel: 'Ruler drop',
      formulaReference: 'Step 1: Use d = 1/2 gt^2\nStep 2: Plug in g = 9.81 m/s^2 and t = your reaction time\nStep 3: Multiply by 100 to convert meters -> centimeters',
      correctEquation: 'halfgt2'
    },
    2: {
      title: 'Drag Racing',
      shortTitle: 'Drag Racing',
      subtitle: 'Acceleration Gap',
      description: 'Both cars accelerate at 40 m/s\u00B2 from rest over 300 m. You and the computer have different reaction times. Calculate the distance gap between the cars when the leading car crosses the finish line.',
      unit: 'm',
      distanceLabel: 'Gap at finish',
      formulaReference: 'Step 1: Find drive time -> t_drive = sqrt(2*300 / 40)\nStep 2: Find dRT = |Your RT - Computer RT|\nStep 3: Trailing car drove t_drive - dRT seconds\nStep 4: Gap = 300 - 1/2*a*(t_drive - dRT)^2',
      correctEquation: 'halfat2'
    },
    3: {
      title: 'Elite Sprint',
      shortTitle: 'Elite Sprint',
      subtitle: 'Reaction Time',
      description: 'A sprinter who reacts later gives up distance while the race is already underway. Use the opponent\'s reaction time and the finish-line lag to calculate your own reaction time.',
      unit: 'm',
      distanceLabel: 'Finish line lag',
      formulaReference: 'Step 1: lag = v * (your RT - opponent RT)\nStep 2: Rearrange -> your RT = lag / v + opponent RT\nStep 3: Plug in v = 10.0 m/s, answer in seconds',
      correctEquation: 'vt'
    }
  };

  var state = {
    gameState: 'idle',
    currentLevel: 1,
    lightIndex: -1,
    trackSignal: '',
    startTime: 0,
    reactionTime: null,
    distance: null,
    visualDropCm: 0,
    pendingTrial: null,
    tempCalculation: '',
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
      title: '2. Drag Racing',
      body: '<p>Two cars accelerate from rest at 40&nbsp;m/s^2 over 300&nbsp;m. You and the computer have different reaction times.</p><p>Calculate the <strong>gap</strong> between the cars when the leader crosses the finish line.</p>'
    },
    {
      title: '3. Elite Sprint',
      body: '<p>Two sprinters race 50&nbsp;m at 10&nbsp;m/s. A starter fires a gun - react to it.</p><p>Use the finish-line <strong>lag</strong> and the opponent\'s RT to calculate your own reaction time.</p>'
    },
    {
      title: 'Scoring &amp; Submission',
      body: '<p>After recording all 9 trials, answer 4 analysis questions (20+ characters each).</p><p>Your score combines trial accuracy (60%) and teacher-graded analysis (40%). Click <strong>Submit Lab</strong> when finished.</p>'
    }
  ];

  function calculateExpectedAnswer(level, reactionTime) {
    if (reactionTime === null) return 0;
    if (level === 1) return parseFloat((0.5 * G * reactionTime * reactionTime * 100).toFixed(2));
    if (level === 2) {
      var deltaRT = Math.abs(reactionTime - opponentDelay);
      var tTravel = Math.sqrt(2 * DRAG_FINISH_DISTANCE / DRAG_ACCEL);
      var trailingTime = tTravel - deltaRT;
      var trailingDist = 0.5 * DRAG_ACCEL * trailingTime * trailingTime;
      return parseFloat((DRAG_FINISH_DISTANCE - trailingDist).toFixed(2));
    }
    return parseFloat((RUNNER_TOP_SPEED * reactionTime).toFixed(2));
  }

  function getScenarioRaceDistance(level) {
    return level === 2 ? DRAG_FINISH_DISTANCE : TRACK_DISTANCE;
  }

  function getScenarioMotionSpeed(level) {
    return level === 2 ? DRAG_ACCEL : RUNNER_TOP_SPEED;
  }

  function getPendingReactionLabel(level) {
    if (level === 1) return 'Reaction Time (solve)';
    if (level === 2) return 'Your RT';
    if (level === 3) return 'Opponent RT';
    return 'Reaction Time';
  }
  function getPendingDistanceLabel(level) {
    return SCENARIOS[level].distanceLabel + ' (' + SCENARIOS[level].unit + ')';
  }
  function getStudentAnswerLabel(level) {
    if (level === 1 || level === 3) return 'Calculate your reaction time';
    return 'Calculate the gap at 300 m';
  }
  function getStudentAnswerPlaceholder(level) {
    if (level === 1 || level === 3) return 'e.g. 0.250';
    return 'e.g. 3.50';
  }
  function getStudentAnswerUnit(level) {
    if (level === 1 || level === 3) return 's';
    return SCENARIOS[level].unit;
  }
  function getPendingInstruction(level) {
    if (level === 1) return 'Read the ruler drop distance and enter it in cm. Then use d = 1/2 gt^2 to solve for t and enter your time in seconds.';
    if (level === 2) return 'Find the gap between the cars when the leader crosses 300 m. Use both reaction times and a = 40 m/s^2. Enter your answer in m.';
    if (level === 3) return 'Use the lag distance and opponent RT to find your reaction time: RT = lag / v + opponent RT.';
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
  }

  function resetCaptureState() {
    state.reactionTime = null;
    state.distance = null;
    state.visualDropCm = 0;
    state.pendingTrial = null;
    state.tempCalculation = '';
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
    el.liveScore = document.getElementById('live-score');
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
    el.sceneInstruction = document.getElementById('scene-instruction');
    el.startSequenceBtn = document.getElementById('start-sequence-btn');
    el.resetScenarioBtn = document.getElementById('reset-scenario-btn');
    el.pendingRtLabel = document.getElementById('pending-rt-label');
    el.pendingRt = document.getElementById('pending-rt');
    el.pendingDist = document.getElementById('pending-dist');
    el.pendingDistLabel = document.getElementById('pending-dist-label');
    el.pendingOppRtChip = document.getElementById('pending-opp-rt-chip');
    el.pendingOppRt = document.getElementById('pending-opp-rt');
    el.pendingSpeedChip = document.getElementById('pending-speed-chip');
    el.pendingSpeedLabel = document.getElementById('pending-speed-label');
    el.pendingSpeed = document.getElementById('pending-speed');
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
      v: 2,
      l: state.currentLevel,
      t: serializeTrialsCompact(),
      a: [
        compactAnalysisText(state.analysis.a1),
        compactAnalysisText(state.analysis.a2),
        compactAnalysisText(state.analysis.a3),
        compactAnalysisText(state.analysis.a4)
      ],
      sc: state.score,
      sub: state.submitted ? 1 : 0
    };
  }

  function saveSuspendData() {
    if (typeof SCORM === 'undefined') return;
    try {
      var payload = JSON.stringify(serializeState());
      if (payload.length > 4096) {
        var fallback = {
          v: 2,
          l: state.currentLevel,
          t: serializeTrialsCompact(),
          a: ['', '', '', ''],
          sc: state.score,
          sub: state.submitted ? 1 : 0
        };
        payload = JSON.stringify(fallback);
        if (payload.length > 4096) {
          payload = JSON.stringify({ v: 2, l: state.currentLevel, sc: state.score, sub: state.submitted ? 1 : 0 });
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
      if (data.v === 2) {
        if (data.l) state.currentLevel = data.l;
        if (data.t) state.trialsByLevel = deserializeTrialsCompact(data.t);
        if (data.a && data.a.length === 4) {
          state.analysis.a1 = data.a[0] || '';
          state.analysis.a2 = data.a[1] || '';
          state.analysis.a3 = data.a[2] || '';
          state.analysis.a4 = data.a[3] || '';
        }
        if (typeof data.sc === 'number') state.score = data.sc;
        state.submitted = !!data.sub;
      } else {
        // Backward compatibility for earlier suspend_data schema.
        if (data.currentLevel) state.currentLevel = data.currentLevel;
        if (data.trialsByLevel) state.trialsByLevel = data.trialsByLevel;
        if (data.analysis) state.analysis = data.analysis;
        if (typeof data.score === 'number') state.score = data.score;
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
    SCORM.setScore(breakdown.percent, 0, 100);
    if (finalize || state.submitted) {
      SCORM.setStatus(breakdown.percent >= LAB_PASS_SCORE ? 'passed' : 'failed');
    } else {
      SCORM.setStatus('incomplete');
    }
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
    if (level === 1 || level === 3) return Math.max(0.03, expected * 0.10);
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

  function setHintOpen(open) {
    state.hintOpen = !!open;
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
    var pending = {
      level: level,
      trialNumber: getNextTrialNumber(level),
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
    }
    if (level === 3) {
      pending.opponentRT = opponentDelay;
      pending.distance = RUNNER_TOP_SPEED * Math.max(0, state.reactionTime - opponentDelay);
      pending.expected = state.reactionTime;
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
      if (!race.lastTime) {
        race.lastTime = now;
        animId = requestAnimationFrame(animate);
        return;
      }
      var dt = Math.min(0.033, (now - race.lastTime) / 1000);
      race.lastTime = now;

      if (state.gameState === 'dropping') {
        if (!race.greenTime) race.greenTime = now;
        var tSinceGreen = (now - race.greenTime) / 1000;
        if (!race.opponentLaunched && tSinceGreen >= opponentDelay) {
          race.opponentLaunched = true;
          race.opponentLaunchTime = tSinceGreen;
          race.opponentSpeed = getScenarioMotionSpeed(state.currentLevel);
        }
        if (race.opponentLaunched) {
          if (state.currentLevel === 2) {
            var oppT = tSinceGreen - race.opponentLaunchTime;
            race.opponentDist = Math.min(getScenarioRaceDistance(state.currentLevel), 0.5 * DRAG_ACCEL * oppT * oppT);
          } else {
            race.opponentDist = Math.min(getScenarioRaceDistance(state.currentLevel), race.opponentDist + race.opponentSpeed * dt);
          }
        }
        if (race.playerLaunched) {
          if (state.currentLevel === 2) {
            if (!race.playerLaunchTime) race.playerLaunchTime = tSinceGreen;
            var plyT = tSinceGreen - race.playerLaunchTime;
            race.playerDist = Math.min(getScenarioRaceDistance(state.currentLevel), 0.5 * DRAG_ACCEL * plyT * plyT);
          } else {
            race.playerSpeed = getScenarioMotionSpeed(state.currentLevel);
            race.playerDist = Math.min(getScenarioRaceDistance(state.currentLevel), race.playerDist + race.playerSpeed * dt);
          }
        }

        if (!race.playerLaunched && tSinceGreen >= REACTION_MISS_SECONDS) {
          markMissedReaction();
          return;
        }

        if (!race.raceFinished && race.playerLaunched) {
          var finishDist = getScenarioRaceDistance(state.currentLevel);
          if (state.currentLevel === 3) {
            // Freeze when the FIRST runner crosses the finish line
            if (race.playerDist >= finishDist || race.opponentDist >= finishDist) {
              race.raceFinished = true;
              capturePendingTrial();
              return;
            }
          } else if (race.playerDist >= finishDist && race.opponentDist >= finishDist) {
            race.raceFinished = true;
            capturePendingTrial();
            return;
          }
        }
      }

      var ctx = el.canvas.getContext('2d');
      if (state.currentLevel === 2) {
        drawDragRaceScene(ctx, el.canvas.width, el.canvas.height, race, state.lightIndex, state.gameState === 'dropping');
      } else if (state.currentLevel === 3) {
        drawTrackScene(ctx, el.canvas.width, el.canvas.height, race, state.trackSignal);
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
    sizeCanvas();
    if (isCanvasLevel(level)) startAnimLoop();
    render();
  }

  function resetScenarioData() {
    clearPendingTimers();
    stopLevel1Preview();
    stopAnimLoop();
    state.trialsByLevel[state.currentLevel] = [];
    resetRace();
    resetCaptureState();
    state.gameState = 'idle';
    setSCORMProgress(false);
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
    state.analysis = { a1: '', a2: '', a3: '', a4: '' };
    state.trialsByLevel = { 1: [], 2: [], 3: [] };
    state.score = 0;
    state.submitted = false;
    if (typeof SCORM !== 'undefined') {
      SCORM.setValue('cmi.suspend_data', '');
      SCORM.setScore(0, 0, 100);
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
    render();
    lightIntervalId = setInterval(function() {
      current += 1;
      state.lightIndex = current;
      render();
      if (current === 3) {
        clearInterval(lightIntervalId);
        lightIntervalId = null;
        state.gameState = 'dropping';
        state.startTime = performance.now();
        opponentDelay = 0.20 + Math.random() * 0.15; // 0.20â€“0.35s
        state.lightIndex = 3;
        render();
      }
    }, 500);
  }

  function startLevel2Sequence() {
    var initDelay = Math.random() * 1000 + 500;
    timerId = setTimeout(runLightSequence, initDelay);
  }

  function runTrackSequence() {
    state.trackSignal = 'On your marks...';
    render();
    timerId = setTimeout(function() {
      state.trackSignal = 'SET...';
      render();
      var wait = Math.random() * 2000 + 1000;
      timerId = setTimeout(function() {
        // Fire the gun!
        state.trackSignal = 'BANG!';
        state.gameState = 'dropping';
        state.startTime = performance.now();
        muzzleFlashStart = performance.now();
        opponentDelay = 0.15 + Math.random() * 0.10; // 0.15â€“0.25s
        playGunshot();
        render();
      }, wait);
    }, 1400);
  }

  function startLevel3Sequence() {
    runTrackSequence();
  }

  function startTest() {
    if (pendingTrialExists()) {
      render();
      return;
    }
    if (levelIsComplete(state.currentLevel)) {
      render();
      return;
    }

    clearPendingTimers();
    stopLevel1Preview();
    resetRace();
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
    var timeInSeconds = (endTime - state.startTime) / 1000;

    if (state.currentLevel === 3 && timeInSeconds < 0.100) {
      clearPendingTimers();
      stopAnimLoop();
      state.gameState = 'idle';
      resetRace();
      render();
      return;
    }

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
      state.trialsByLevel[level].push({
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
      state.trialsByLevel[level].push({
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
    setSCORMProgress(true);
    saveSuspendData();
    render();
  }

  function renderSceneVisibility() {
    var level = state.currentLevel;
    var showLevel1 = level === 1;
    el.canvas.classList.toggle('hidden', showLevel1);
    el.level1Scene.classList.toggle('hidden', !showLevel1);
    el.level1Scene.classList.toggle('dropping', level === 1 && state.gameState === 'dropping');
    if (showLevel1) {
      var rulerDropPx = 0;
      if (state.pendingTrial && state.pendingTrial.level === 1) rulerDropPx = clamp(state.visualDropCm * RULER_PX_PER_CM, 0, RULER_TOTAL_CM * RULER_PX_PER_CM);
      else if (state.distance !== null) rulerDropPx = clamp(state.visualDropCm * RULER_PX_PER_CM, 0, RULER_TOTAL_CM * RULER_PX_PER_CM);
      if (state.gameState !== 'dropping') el.level1Scene.style.setProperty('--ruler-drop', rulerDropPx.toFixed(2) + 'px');
      el.handGraphic.classList.toggle('closed', !!state.pendingTrial && state.pendingTrial.level === 1);
      var showPrompt = state.gameState === 'idle' && !state.pendingTrial;
      if (el.l1StartPrompt) el.l1StartPrompt.style.display = showPrompt ? '' : 'none';
      if (el.canvasStartPrompt) el.canvasStartPrompt.style.display = 'none';
    } else {
      el.handGraphic.classList.remove('closed');
      if (el.l1StartPrompt) el.l1StartPrompt.style.display = 'none';
      var showCanvasPrompt = state.gameState === 'idle' && !state.pendingTrial;
      if (el.canvasStartPrompt) el.canvasStartPrompt.style.display = showCanvasPrompt ? '' : 'none';
    }
  }

  function renderOverlays() {
    var level = state.currentLevel;

    if (level === 3 && (state.gameState === 'waiting' || state.gameState === 'dropping')) {
      el.trackSignal.textContent = state.trackSignal;
      el.trackSignal.className = 'track-signal' + (state.trackSignal === 'SET...' ? ' set' : '') + (state.trackSignal === 'BANG!' ? ' go' : '');
    } else {
      el.trackSignal.textContent = '';
      el.trackSignal.className = 'track-signal';
    }
  }

  function renderPendingTrial() {
    var level = state.currentLevel;
    var pending = state.pendingTrial;
    el.pendingRtLabel.textContent = getPendingReactionLabel(level);
    el.pendingDistLabel.textContent = getPendingDistanceLabel(level);
    el.calcInputLabel.textContent = getStudentAnswerLabel(level);
    el.calcInput.placeholder = getStudentAnswerPlaceholder(level);
    el.calcUnit.textContent = getStudentAnswerUnit(level);
    el.equationHint.textContent = SCENARIOS[level].formulaReference;
    el.pendingOppRtChip.style.display = (level === 2) ? '' : 'none';
    el.pendingOppRt.textContent = (pending && pending.opponentRT != null) ? pending.opponentRT.toFixed(3) + ' s' : '--';
    el.pendingSpeedChip.style.display = (level === 2 || level === 3) ? '' : 'none';
    el.pendingSpeed.textContent = level === 2 ? DRAG_ACCEL + ' m/s^2' : (level === 3 ? RUNNER_TOP_SPEED + ' m/s' : '--');
    el.pendingSpeedLabel.textContent = level === 2 ? 'Acceleration' : 'Top Speed';
    setHintOpen(state.hintOpen);

    // Card highlight when trial is pending
    el.pendingCard.classList.toggle('card-active', !!pending);

    if (!pending) {
      el.pendingRt.textContent = '--';
      el.pendingDist.textContent = '--';
      el.calcDistLabel.style.display = 'none';
      el.calcDistRow.style.display = 'none';
      el.calcDistInput.value = '';
      el.calcInput.value = '';
      el.recordTrialBtn.disabled = true;
      el.discardTrialBtn.disabled = true;
      el.pendingFeedback.className = 'feedback-box muted hidden';
      el.pendingFeedback.textContent = '';
      // Step indicators reset
      el.stepCapture.classList.remove('done');
      el.stepEquation.classList.remove('done');
      el.stepCalculate.classList.remove('done');
      return;
    }

    el.pendingRt.textContent = level === 1 ? 'Hidden' : (level === 3 ? pending.opponentRT.toFixed(3) + ' s' : pending.reactionTime.toFixed(3) + ' s');
    if (level === 2) el.pendingOppRt.textContent = pending.opponentRT.toFixed(3) + ' s';

    // Level 1: show both distance and time inputs; other levels: auto-fill
    if (level === 1) {
      el.pendingDist.textContent = pending.distance.toFixed(2) + ' cm';
      el.calcDistLabel.style.display = '';
      el.calcDistRow.style.display = '';
      el.calcDistLabel.textContent = 'Your distance reading';
      el.calcInputLabel.textContent = 'Your calculated reaction time';
      el.calcInput.placeholder = 'e.g. 0.250';
      el.calcUnit.textContent = 's';
    } else if (level === 2) {
      el.pendingDist.textContent = 'Calculate \u2193';
      el.calcDistLabel.style.display = 'none';
      el.calcDistRow.style.display = 'none';
    } else {
      el.pendingDist.textContent = pending.distance.toFixed(2) + ' ' + SCENARIOS[level].unit;
      el.calcDistLabel.style.display = 'none';
      el.calcDistRow.style.display = 'none';
    }

    el.calcInput.value = state.tempCalculation;
    el.calcInput.disabled = false;
    el.recordTrialBtn.disabled = false;
    el.discardTrialBtn.disabled = false;
    el.pendingFeedback.className = 'feedback-box muted';
    el.pendingFeedback.textContent = getPendingInstruction(level);

    // Step indicators
    el.stepCapture.classList.add('done');
    el.stepEquation.classList.add('done');
    el.stepCalculate.classList.toggle('done', state.tempCalculation !== '' && !isNaN(parseFloat(state.tempCalculation)));
  }

  function renderScenarioInfo() {
    var scenario = SCENARIOS[state.currentLevel];
    var recorded = state.trialsByLevel[state.currentLevel].length;
    el.scenarioSubtitle.textContent = scenario.description;
    el.sceneInstruction.textContent = pendingTrialExists() ? 'Record or discard the captured trial before starting another one.' : (recorded >= REQUIRED_TRIALS ? 'This scenario already has 3 recorded trials.' : 'Click the scene or press Space to begin Trial ' + (recorded + 1) + '.');
    el.startSequenceBtn.disabled = pendingTrialExists() || recorded >= REQUIRED_TRIALS || state.gameState === 'waiting' || state.gameState === 'dropping';

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
    el.liveScore.textContent = breakdown.percent;

    // Enable submit button when all trials recorded and all analysis answers have 20+ chars
    var canSubmit = allRequiredTrialsRecorded() && allAnalysisComplete() && !state.submitted;
    el.submitBtn.disabled = !canSubmit;
    el.submitBtn.textContent = state.submitted ? 'Submitted' : 'Submit Lab';
  }

  function render() {
    renderScenarioInfo();
    renderSceneVisibility();
    renderOverlays();
    renderPendingTrial();
    renderNotebookChart();
    renderAnalysisLock();
    renderScore();
  }

  function bindEvents() {
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

    el.calcInput.addEventListener('input', function() {
      state.tempCalculation = el.calcInput.value;
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
    sizeCanvas();
    bindEvents();
    setSCORMProgress(state.submitted);
    render();
  }

  window.addEventListener('load', init);
})();
