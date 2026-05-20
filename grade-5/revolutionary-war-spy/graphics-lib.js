/* ============================================================
   SPY GRAPHICS LIBRARY  —  Operation Liberty Quill
   grade-5/revolutionary-war-spy/graphics-lib.js

   QUICK-START FOR LLM CODE GENERATION
   ─────────────────────────────────────
   1. Add after shared.js: <script src="graphics-lib.js"></script>
   2. Mount a canvas:  const { ctx, W, H } = SPY.mount('my-canvas', 600, 420);
   3. Draw a scene:    SPY.draw.cipherWheel(ctx, W, H, { shift: 7 });
   4. UPSCALE ALL:     set SPY.CANVAS.scale = 2  (or window.devicePixelRatio)
      before the first mount() call — every canvas doubles in resolution
      while keeping the same CSS display size.

   EVERY DRAW FUNCTION FOLLOWS THIS SIGNATURE:
     drawXxx(ctx, W, H, opts)
       ctx  — 2D context already scaled by mount()
       W, H — LOGICAL pixel dimensions (same regardless of scale)
       opts — scene-specific options (documented above each function)

   HOW TO ADD A NEW SCENE
   ───────────────────────
   1. Copy any existing drawXxx function in Section 9-13 as a template.
   2. Replace hardcoded colors with SPY.C constants.
   3. Replace hardcoded fonts with SPY.F helpers: SPY.F.bold(14).
   4. Use proportional coords: x = W * 0.5, y = H * 0.3 — never raw pixels.
   5. Register at the bottom: SPY.draw.myScene = drawMyScene;
   6. Call from the page:  SPY.draw.myScene(ctx, W, H, { key: value });

   HOW TO ADD A NEW BATTLE MAP
   ────────────────────────────
   1. Create drawMyBattle(ctx, W, H, showArrows) in Section 13.
   2. Use mBox/mLabel/mSub/mArrow primitives (Section 6).
   3. Register in SPY.draw.battleMap dispatch switch.
   4. Create animMyBattle(ctx, W, H, t) in Section 14 (optional).
   5. Register in SPY.anim.start dispatch switch.
   ============================================================ */

'use strict';

/* ── SECTION 1: CONFIG ─────────────────────────────────────────
   LLM-GUIDE: Change SPY.CANVAS.scale to upscale every canvas.
   Logical dimensions (W, H) never change — only the pixel buffer.
   Example for retina:  SPY.CANVAS.scale = window.devicePixelRatio || 1;
   ─────────────────────────────────────────────────────────────── */
const SPY_CANVAS_SIZES = {
  cipher:   { W: 340, H: 340 },  // cipher wheel (cipher.html)
  map:      { W: 600, H: 420 },  // route grid   (route-map.html)
  rain:     { W: 560, H: 280 },  // rain lab     (lab-test.html)
  ink:      { W: 560, H: 200 },  // invisible ink (invisible-ink.html)
  codebook: { W: 432, H: 196 },  // flag codebook (signal-flags.html)
  puzzle:   { W: 504, H: 112 },  // flag puzzle   (signal-flags.html)
  battleSit:{ W: 600, H: 210 },  // battle static map — situation phase
  battleCmd:{ W: 600, H: 190 },  // battle static map — command phase
  battleAnim:{ W: 600, H: 280 }, // battle animation canvas
  confetti: { W: 840, H: 180 },  // confetti burst (portfolio.html)
};

/* ── SECTION 2: COLOR PALETTE ──────────────────────────────────
   LLM-GUIDE: All drawing must use these constants — never raw hex.
   They mirror the CSS variables in styles.css.
   To theme a new mission: clone this object with different values.
   ─────────────────────────────────────────────────────────────── */
const SPY_C = {
  /* Parchment / daylight theme */
  parchment:   '#f5e6c8',
  parchmentDk: '#e8d5a8',
  parchmentMd: '#eeddb5',
  ink:         '#2c1810',
  inkMuted:    '#5c3d2e',
  red:         '#8b1a1a',
  redAlt:      '#6b1414',
  gold:        '#c4932f',
  goldLt:      '#f0d080',
  blue:        '#2563eb',
  blueDk:      '#1d4ed8',
  green:       '#16a34a',
  /* Military / dark-map theme (battle-command.html) */
  bBg:         '#0c1a0e',   // battle card background
  bBlue:       '#3b82f6',   // Continental / Allied units
  bRed:        '#ef4444',   // British / Hessian units
  bGold:       '#facc15',   // labels, phase indicators
  bGreen:      '#4ade80',   // correct actions, captures
  nightSky:    '#111827',   // Trenton night background
  water:       '#1a3d6e',   // Delaware River
  bayWater:    '#0a1628',   // Chesapeake Bay
  terrain:     '#1e2d14',   // land / vegetation
};

/* ── SECTION 3: FONT HELPERS ────────────────────────────────────
   LLM-GUIDE: Always use these helpers for ctx.font strings.
   sz is in LOGICAL pixels — the scale transform handles retina.
   Example:  ctx.font = SPY_F.bold(14);
   ─────────────────────────────────────────────────────────────── */
const SPY_F = {
  bold:    (sz) => `bold ${sz}px "Space Grotesk",Arial`,
  normal:  (sz) => `${sz}px "Instrument Sans",Arial`,
  italic:  (sz) => `italic ${sz}px "Instrument Sans",Arial`,
  mono:    (sz) => `${sz}px "Courier New",monospace`,
  monoBold:(sz) => `bold ${sz}px "Courier New",monospace`,
};

/* ── SECTION 4: CANVAS MOUNT HELPER ────────────────────────────
   LLM-GUIDE: Call SPY.mount() once per canvas before drawing.
   It sets the pixel buffer to logicalW*scale × logicalH*scale,
   then pre-applies ctx.scale so all drawing uses logical coords.
   Returns { ctx, W, H, el } — pass ctx/W/H into draw functions.
   ─────────────────────────────────────────────────────────────── */
function spyMount(canvasId, logicalW, logicalH) {
  const el = typeof canvasId === 'string'
    ? document.getElementById(canvasId)
    : canvasId;
  if (!el) return null;
  const s = SPY.CANVAS.scale;
  el.width  = logicalW * s;
  el.height = logicalH * s;
  const ctx = el.getContext('2d');
  ctx.setTransform(s, 0, 0, s, 0, 0); // idempotent — safe to call repeatedly
  return { ctx, W: logicalW, H: logicalH, el };
}

/* ── SECTION 5: MAP GRID GEOMETRY ──────────────────────────────
   LLM-GUIDE: These helpers convert between grid cells and canvas
   logical pixels. Use them in BOTH the draw function and the
   click handler in route-map.html.
   NOTE: getCanvasXY() from shared.js returns physical pixel coords;
   divide by SPY.CANVAS.scale to get logical coords for these helpers.
   ─────────────────────────────────────────────────────────────── */
function spyMapCellSize(W, H) {
  const padL = 52, padT = 38;
  return {
    padL, padT,
    cw: (W - padL - 8) / 10,
    ch: (H - padT - 8) / 10,
  };
}
function spyMapColToX(W, H, col) {
  const { cw, padL } = spyMapCellSize(W, H);
  return padL + col * cw + cw / 2;
}
function spyMapRowToY(W, H, row) {
  const { ch, padT } = spyMapCellSize(W, H);
  return padT + row * ch + ch / 2;
}
function spyMapXYToCell(W, H, x, y) {
  const { cw, ch, padL, padT } = spyMapCellSize(W, H);
  const col = Math.floor((x - padL) / cw);
  const row = Math.floor((y - padT) / ch);
  if (col < 0 || col > 9 || row < 0 || row > 9) return null;
  return { col, row };
}

/* ── SECTION 6: DRAWING PRIMITIVES ─────────────────────────────
   LLM-GUIDE: Use these for all new battle maps and diagrams.
   mBox    — colored labeled box for troop/location markers
   mLabel  — bold text header for a marker
   mSub    — smaller detail text inside a marker
   mArrow  — directional arrow with optional text label
   All coordinates are logical pixels (scale-independent).
   ─────────────────────────────────────────────────────────────── */

/* Centered rounded box — fill and stroke colors explicit */
function mBox(ctx, cx, cy, w, h, fill, stroke) {
  rrect(ctx, cx - w / 2, cy - h / 2, w, h, 5); // rrect from shared.js
  ctx.fillStyle = fill;   ctx.fill();
  ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke();
}

/* Bold header label centered at (x, y) */
function mLabel(ctx, txt, x, y, color) {
  ctx.fillStyle = color;
  ctx.font = SPY_F.bold(11);
  ctx.textAlign = 'center';
  ctx.fillText(txt, x, y);
}

/* Smaller detail text centered at (x, y) */
function mSub(ctx, txt, x, y, color) {
  ctx.fillStyle = color || 'rgba(200,230,200,0.6)';
  ctx.font = SPY_F.normal(9);
  ctx.textAlign = 'center';
  ctx.fillText(txt, x, y);
}

/* Directional arrow with arrowhead. label appears at midpoint above line. */
function mArrow(ctx, x1, y1, x2, y2, color, label) {
  ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.setLineDash([]);
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  const a = Math.atan2(y2 - y1, x2 - x1);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 11 * Math.cos(a - 0.4), y2 - 11 * Math.sin(a - 0.4));
  ctx.lineTo(x2 - 11 * Math.cos(a + 0.4), y2 - 11 * Math.sin(a + 0.4));
  ctx.closePath(); ctx.fill();
  if (label) {
    ctx.fillStyle = color; ctx.font = SPY_F.bold(10); ctx.textAlign = 'center';
    ctx.fillText(label, (x1 + x2) / 2, Math.min(y1, y2) - 8);
  }
}

/* ── SECTION 7: ANIMATION MATH HELPERS ─────────────────────────
   LLM-GUIDE: Use these in animation functions (Section 14).
   ap(t, start, end) returns 0→1 progress with ease-in-out.
   Example: const p = ap(t, 40, 160); x = lerp(x0, x1, p);
   ─────────────────────────────────────────────────────────────── */
function lerp(a, b, t)   { return a + (b - a) * t; }
function clamp01(v)       { return Math.max(0, Math.min(1, v)); }
function easeIO(t)        { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }
function ap(t, s, e)      { return easeIO(clamp01((t - s) / (e - s))); }

/* ── SECTION 8: ANIMATION DRAWING PRIMITIVES ───────────────────
   LLM-GUIDE: Use in battle animation functions (Section 14).
   troopCluster — N dots in a circle; represents a moving unit
   battleFlash  — radial gradient burst for engagement effects
   animVictory  — full-width victory banner at canvas bottom
   ─────────────────────────────────────────────────────────────── */

/* n dots arranged in a circle of radius spread, with center dot */
function troopCluster(ctx, cx, cy, color, n, spread, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(cx, cy, 3.5, 0, Math.PI * 2); ctx.fill();
  for (let i = 0; i < n - 1; i++) {
    const a = (i / (n - 1)) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * spread, cy + Math.sin(a) * spread, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/* Radial gradient glow burst. r/g/b are 0-255 color components. */
function battleFlash(ctx, cx, cy, radius, alpha, r, g, b) {
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  grad.addColorStop(0, `rgba(${r},${g},${b},${alpha})`);
  grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.fill();
}

/* Gradient fade-in banner at bottom 34% of canvas. alpha 0→1. */
function animVictory(ctx, W, H, line1, line2, alpha) {
  ctx.save();
  const bg = ctx.createLinearGradient(0, H * 0.66, 0, H);
  bg.addColorStop(0,    `rgba(5,15,6,0)`);
  bg.addColorStop(0.22, `rgba(5,15,6,${alpha * 0.95})`);
  bg.addColorStop(1,    `rgba(5,15,6,${alpha * 0.95})`);
  ctx.fillStyle = bg; ctx.fillRect(0, H * 0.66, W, H * 0.34);
  ctx.globalAlpha = alpha; ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(250,204,21,0.85)'; ctx.shadowBlur = 14;
  ctx.fillStyle = SPY_C.bGold; ctx.font = SPY_F.bold(21);
  ctx.fillText(line1, W / 2, H * 0.81);
  ctx.shadowColor = 'rgba(74,222,128,0.6)'; ctx.shadowBlur = 8;
  ctx.fillStyle = '#86efac'; ctx.font = SPY_F.normal(13);
  ctx.fillText(line2, W / 2, H * 0.91);
  ctx.restore();
}

/* ── SECTION 9: FLAG DATA ───────────────────────────────────────
   LLM-GUIDE: To add a new flag, add a key to FLAG_DATA:
     'Z': ['#bg1color', '#bg2color', 'shapeName']
   Available shapes: xdiag hstripe circle vhalf diagonal
                     ltriangle chevron innersq rtriangle vstripes
   Then add 'Z' to CODEBOOK array and/or PUZZLE array in
   signal-flags.html to include it in the game.
   ─────────────────────────────────────────────────────────────── */
const FLAG_DATA = {
  A: ['#ffffff', '#1e40af', 'xdiag'],
  B: ['#dc2626', '#ffffff', 'hstripe'],
  C: ['#f59e0b', '#111827', 'circle'],
  E: ['#2563eb', '#dc2626', 'hstripe'],
  I: ['#dc2626', '#f59e0b', 'vhalf'],
  K: ['#ffffff', '#2563eb', 'diagonal'],
  L: ['#111827', '#f59e0b', 'ltriangle'],
  M: ['#f1f5f9', '#dc2626', 'chevron'],
  P: ['#1e3a8a', '#ffffff', 'innersq'],
  R: ['#f1f5f9', '#dc2626', 'rtriangle'],
  T: ['#374151', '#ffffff', 'hstripe'],
  Y: ['#dc2626', '#fde047', 'vstripes'],
};

/* ── SECTION 10: SCENE — CIPHER WHEEL ──────────────────────────
   LLM-GUIDE: opts = { shift: number 1-25 }
   Outer ring = plain alphabet (red segments).
   Inner ring = shifted alphabet (blue segments), rotated by shift.
   Center circle shows "+shift" number.
   To change ring colors: edit the fillStyle calls in the loops.
   To change the number of segments: change N (currently 26 = A-Z).
   ─────────────────────────────────────────────────────────────── */
function drawCipherWheel(ctx, W, H, opts) {
  const shift = (opts && opts.shift) || 7;
  const cx = W / 2, cy = H / 2;
  /* Ring radii as fractions of W — change these to resize the rings */
  const R_outer  = W * 0.426;  // outer ring outer edge  (≈145/340)
  const R_inner  = W * 0.288;  // inner ring outer edge  (≈98/340)
  const R_center = W * 0.124;  // center circle radius   (≈42/340)
  const N   = 26;
  const arc = (Math.PI * 2) / N;

  ctx.clearRect(0, 0, W, H);

  /* Outer ring — plain alphabet */
  for (let i = 0; i < N; i++) {
    const s = i * arc - Math.PI / 2 - arc / 2;
    ctx.beginPath(); ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R_outer, s, s + arc); ctx.closePath();
    ctx.fillStyle = i % 2 === 0 ? SPY_C.red : SPY_C.redAlt; ctx.fill();
    ctx.strokeStyle = SPY_C.ink; ctx.lineWidth = 0.5; ctx.stroke();

    ctx.save(); ctx.translate(cx, cy); ctx.rotate(i * arc);
    ctx.fillStyle = SPY_C.goldLt;
    ctx.font = SPY_F.bold(Math.round(W * 0.035));
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(String.fromCharCode(65 + i), 0, -(R_outer + R_inner) / 2);
    ctx.restore();
  }

  /* Inner ring — shifted alphabet */
  for (let i = 0; i < N; i++) {
    const shifted = (i + shift) % N;
    const s = i * arc - Math.PI / 2 - arc / 2;
    ctx.beginPath(); ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R_inner, s, s + arc); ctx.closePath();
    ctx.fillStyle = i % 2 === 0 ? SPY_C.blue : SPY_C.blueDk; ctx.fill();
    ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 0.5; ctx.stroke();

    ctx.save(); ctx.translate(cx, cy); ctx.rotate(i * arc);
    ctx.fillStyle = '#e0f2fe';
    ctx.font = SPY_F.bold(Math.round(W * 0.032));
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(String.fromCharCode(65 + shifted), 0, -(R_inner + R_center) / 2);
    ctx.restore();
  }

  /* Center circle — shift indicator */
  ctx.beginPath(); ctx.arc(cx, cy, R_center, 0, Math.PI * 2);
  ctx.fillStyle = SPY_C.parchment; ctx.fill();
  ctx.strokeStyle = SPY_C.gold; ctx.lineWidth = 3; ctx.stroke();
  ctx.font = SPY_F.bold(Math.round(W * 0.065));
  ctx.fillStyle = SPY_C.red; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(`+${shift}`, cx, cy);

  /* Top pointer triangle */
  ctx.beginPath();
  ctx.moveTo(cx, cy - R_outer - 6);
  ctx.lineTo(cx - 7, cy - R_outer + 8);
  ctx.lineTo(cx + 7, cy - R_outer + 8);
  ctx.closePath();
  ctx.fillStyle = SPY_C.gold; ctx.fill();
}

/* ── SECTION 11: SCENE — MAP GRID ──────────────────────────────
   LLM-GUIDE: opts = {
     route:       Array of { col, row, label } objects (waypoints clicked)
     landmarks:   Array of { col, row, name } objects (golden star pins)
     patrolZones: Array of { c1, r1, c2, r2 } objects (red danger zones)
   }
   Grid is always 10×10, columns A-J, rows 1-10.
   To change grid size: adjust the 10 constants and axis labels.
   To change patrol zone appearance: edit the fillStyle/strokeStyle below.
   ─────────────────────────────────────────────────────────────── */
function drawMapGrid(ctx, W, H, opts) {
  const route       = (opts && opts.route)       || [];
  const landmarks   = (opts && opts.landmarks)   || [];
  const patrolZones = (opts && opts.patrolZones) || [];
  const { cw, ch, padL, padT } = spyMapCellSize(W, H);

  /* Parchment background */
  ctx.fillStyle = '#d4c5a0'; ctx.fillRect(0, 0, W, H);

  /* Subtle dot texture — deterministic noise */
  ctx.fillStyle = 'rgba(100,70,30,0.04)';
  for (let tx = 0; tx < W; tx += 6)
    for (let ty = 0; ty < H; ty += 6)
      if (Math.sin(tx * 0.7) * Math.cos(ty * 0.9) > 0.6)
        ctx.fillRect(tx, ty, 2, 2);

  /* Patrol zones — red danger areas */
  for (const z of patrolZones) {
    const x1 = padL + z.c1 * cw, y1 = padT + z.r1 * ch;
    const x2 = padL + (z.c2 + 1) * cw, y2 = padT + (z.r2 + 1) * ch;
    ctx.fillStyle = 'rgba(220,38,38,0.18)'; ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
    ctx.strokeStyle = 'rgba(220,38,38,0.6)'; ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]); ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(220,38,38,0.7)'; ctx.font = SPY_F.bold(10);
    ctx.textAlign = 'center'; ctx.fillText('BRITISH PATROL', (x1 + x2) / 2, y1 + 14);
  }

  /* Grid lines */
  ctx.strokeStyle = 'rgba(80,50,20,0.25)'; ctx.lineWidth = 1;
  for (let c = 0; c <= 10; c++) {
    const x = padL + c * cw;
    ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + 10 * ch); ctx.stroke();
  }
  for (let r = 0; r <= 10; r++) {
    const y = padT + r * ch;
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + 10 * cw, y); ctx.stroke();
  }

  /* Axis labels */
  ctx.font = SPY_F.bold(12); ctx.fillStyle = '#4a3020';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (let c = 0; c < 10; c++)
    ctx.fillText(String.fromCharCode(65 + c), padL + c * cw + cw / 2, padT - 16);
  ctx.textAlign = 'right';
  for (let r = 0; r < 10; r++)
    ctx.fillText(r + 1, padL - 6, padT + r * ch + ch / 2);

  /* Landmark pins */
  for (const lm of landmarks) {
    const lx = spyMapColToX(W, H, lm.col), ly = spyMapRowToY(W, H, lm.row);
    ctx.beginPath(); ctx.arc(lx, ly, 9, 0, Math.PI * 2);
    ctx.fillStyle = SPY_C.gold; ctx.fill();
    ctx.strokeStyle = SPY_C.ink; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.font = SPY_F.normal(9); ctx.fillStyle = SPY_C.ink;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText(lm.name, lx, ly + 11);
  }

  /* Route line */
  if (route.length > 1) {
    ctx.beginPath();
    ctx.strokeStyle = SPY_C.blue; ctx.lineWidth = 2.5; ctx.setLineDash([]);
    ctx.moveTo(spyMapColToX(W, H, route[0].col), spyMapRowToY(W, H, route[0].row));
    for (let i = 1; i < route.length; i++)
      ctx.lineTo(spyMapColToX(W, H, route[i].col), spyMapRowToY(W, H, route[i].row));
    ctx.stroke();
  }

  /* Waypoint circles numbered 1-N */
  route.forEach((pt, idx) => {
    const px = spyMapColToX(W, H, pt.col), py = spyMapRowToY(W, H, pt.row);
    ctx.beginPath(); ctx.arc(px, py, 10, 0, Math.PI * 2);
    ctx.fillStyle = SPY_C.blue; ctx.fill();
    ctx.strokeStyle = 'white'; ctx.lineWidth = 2; ctx.stroke();
    ctx.font = SPY_F.bold(11); ctx.fillStyle = 'white';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(idx + 1, px, py);
  });
}

/* ── SECTION 12: SCENE — RAIN LAB ──────────────────────────────
   LLM-GUIDE: opts = {
     raining:          bool — storm sky vs clear sky
     damaged:          bool — show water-stain on scroll
     selectedMaterial: object { label, color, border } or null
                       (the LAST selected material shown on right)
   }
   drawRainDrops(ctx, W, H, drops) — call each animation frame
     drops: array of { x, y, speed, len } (mutate in the page loop)
   ─────────────────────────────────────────────────────────────── */
function drawRainScene(ctx, W, H, opts) {
  const raining  = opts && opts.raining;
  const damaged  = opts && opts.damaged;
  const mat      = opts && opts.selectedMaterial;

  /* Sky */
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, raining ? '#374151' : '#93c5fd');
  sky.addColorStop(1, raining ? '#6b7280' : '#bfdbfe');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

  /* Clouds */
  function cloud(cx, cy, scale) {
    ctx.fillStyle = raining ? '#9ca3af' : 'rgba(255,255,255,0.9)';
    [[0,0,28],[20,-8,22],[40,2,24],[-18,4,20]].forEach(([dx,dy,r]) => {
      ctx.beginPath(); ctx.arc(cx+dx*scale, cy+dy*scale, r*scale, 0, Math.PI*2); ctx.fill();
    });
  }
  cloud(W*0.18, H*0.20, 1); cloud(W*0.50, H*0.14, 1.2); cloud(W*0.80, H*0.23, 0.9);

  /* Ground */
  ctx.fillStyle = '#6b7c5a'; ctx.fillRect(0, H * 0.72, W, H);

  /* Scroll body */
  const sx = W*0.18, sy = H*0.28, sw = W*0.45, sh = H*0.44;
  ctx.fillStyle = damaged ? '#d4a57a' : SPY_C.parchment;
  rrect(ctx, sx, sy, sw, sh, 6); ctx.fill();
  ctx.strokeStyle = SPY_C.gold; ctx.lineWidth = 2; ctx.stroke();

  /* Scroll rolled ends */
  [sy, sy + sh].forEach(ry => {
    ctx.beginPath(); ctx.ellipse(sx + sw/2, ry, sw/2, 10, 0, 0, Math.PI*2);
    ctx.fillStyle = damaged ? '#c4952a' : SPY_C.parchmentDk; ctx.fill();
    ctx.strokeStyle = SPY_C.gold; ctx.lineWidth = 1.5; ctx.stroke();
  });

  /* Text lines on scroll */
  ctx.fillStyle = damaged ? 'rgba(100,60,20,0.3)' : 'rgba(44,24,16,0.6)';
  for (let i = 0; i < 4; i++) ctx.fillRect(sx+18, sy+20+i*18, sw-36, 4);

  /* Water-damage stain */
  if (damaged) {
    ctx.fillStyle = 'rgba(60,100,180,0.18)';
    ctx.beginPath(); ctx.ellipse(sx+sw/2, sy+sh/2, sw*0.4, sh*0.38, 0.2, 0, Math.PI*2);
    ctx.fill();
  }

  /* Selected material swatch — shown to right of scroll */
  if (mat) {
    const mx = sx+sw+20, my = sy, mw = W*0.22, mh = sh;
    ctx.fillStyle = mat.color; ctx.strokeStyle = mat.border; ctx.lineWidth = 2.5;
    rrect(ctx, mx, my, mw, mh, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.font = SPY_F.bold(11);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(mat.label, mx + mw/2, my + mh/2);
  }

  /* Idle hint */
  if (!raining && !damaged && !mat) {
    ctx.fillStyle = 'rgba(44,24,16,0.5)'; ctx.font = SPY_F.normal(12);
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText('Select 2 materials above, then click "Test in Rain"', W/2, H-6);
  }
}

/* Draws one frame of falling rain drops over the current scene */
function drawRainDrops(ctx, drops) {
  ctx.strokeStyle = 'rgba(100,160,255,0.65)'; ctx.lineWidth = 1.5;
  drops.forEach(d => {
    ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x+3, d.y+d.len); ctx.stroke();
  });
}

/* ── SECTION 13: SCENE — INVISIBLE INK ─────────────────────────
   LLM-GUIDE: opts = { progress: 0..1 }
     progress=0 → blank parchment with hint text
     progress=0..1 → partial reveal with amber heat glow at boundary
     progress=1 → fully revealed message
   To change the revealed message: edit MESSAGE_LINES below.
   y values are H fractions (0.19 = 19% from top).
   size values are H fractions (0.12 = 12% of canvas height).
   ─────────────────────────────────────────────────────────────── */
const INK_MESSAGE_LINES = [
  { text: 'TOP SECRET — PATRIOT INTELLIGENCE', yFrac: 0.19, sizeFrac: 0.065, bold: true  },
  { text: 'ATTACK AT DAWN',                    yFrac: 0.40, sizeFrac: 0.12,  bold: true  },
  { text: 'MEET AT LIBERTY BRIDGE',            yFrac: 0.59, sizeFrac: 0.08,  bold: true  },
  { text: 'Burn this message after reading.',  yFrac: 0.79, sizeFrac: 0.06,  bold: false },
  { text: '— Your Ally in the Cause',          yFrac: 0.91, sizeFrac: 0.065, bold: false, italic: true },
];

function drawInvisibleInk(ctx, W, H, opts) {
  const progress = (opts && opts.progress != null) ? opts.progress : 0;

  /* Parchment background */
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#f8ecd0'); bg.addColorStop(1, '#eeddb5');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  /* Dot texture */
  for (let tx = 4; tx < W; tx += 10)
    for (let ty = 4; ty < H; ty += 10)
      if ((tx*13 + ty*7) % 19 < 2) {
        ctx.fillStyle = 'rgba(100,60,20,0.06)'; ctx.fillRect(tx, ty, 2, 2);
      }

  /* Edge vignette */
  const vig = ctx.createRadialGradient(W/2, H/2, H*0.3, W/2, H/2, H*0.75);
  vig.addColorStop(0, 'rgba(0,0,0,0)'); vig.addColorStop(1, 'rgba(70,35,5,0.14)');
  ctx.fillStyle = vig; ctx.fillRect(0, 0, W, H);

  /* Decorative border */
  ctx.strokeStyle = 'rgba(100,60,20,0.25)'; ctx.lineWidth = 1.5;
  ctx.strokeRect(14, 10, W-28, H-20);

  if (progress <= 0) {
    ctx.fillStyle = 'rgba(100,60,20,0.3)'; ctx.font = SPY_F.normal(12);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('Select a revealing method below, then click Apply', W/2, H-16);
    return;
  }

  /* Revealed text — clipped to left band */
  const revealX = W * progress;
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, revealX, H); ctx.clip();
  INK_MESSAGE_LINES.forEach(line => {
    if (!line.text) return;
    const sz = Math.round(H * line.sizeFrac);
    ctx.font = `${line.italic?'italic ':''}${line.bold?'bold ':''}${sz}px "Courier New",monospace`;
    ctx.fillStyle = '#3d1e06'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(line.text, W/2, H * line.yFrac);
  });
  ctx.restore();

  /* Amber heat glow at reveal boundary */
  if (progress > 0 && progress < 1) {
    const gx = revealX;
    const glow = ctx.createRadialGradient(gx, H/2, 0, gx, H/2, 90);
    glow.addColorStop(0,    'rgba(255,180,30,0.42)');
    glow.addColorStop(0.45, 'rgba(255,110,15,0.18)');
    glow.addColorStop(1,    'rgba(255,80,0,0)');
    ctx.fillStyle = glow; ctx.fillRect(gx-90, 0, 180, H);
    /* Spark flecks */
    for (let k = 0; k < 6; k++) {
      const fx = gx + (Math.random()-0.5)*12;
      const fy = 20 + Math.random()*(H-40);
      const fr = 2 + Math.random()*3.5;
      ctx.beginPath(); ctx.arc(fx, fy, fr, 0, Math.PI*2);
      ctx.fillStyle = `rgba(255,${130+Math.random()*100|0},0,${0.35+Math.random()*0.45})`;
      ctx.fill();
    }
  }
}

/* ── SECTION 14: SCENE — SIGNAL FLAGS ──────────────────────────
   LLM-GUIDE: drawFlag(ctx, letter, x, y, w, h)
     letter — key into FLAG_DATA (must exist)
     x, y   — top-left corner (logical pixels)
     w, h   — flag dimensions
   drawFlagCodebook(ctx, W, H, opts)
     opts.codebook — array of letter strings to display in grid
     opts.flagData — flag data object (default: FLAG_DATA above)
   drawFlagPuzzle(ctx, W, H, opts)
     opts.puzzle   — array of letter strings (the secret word)
     opts.flagData — flag data object
   ─────────────────────────────────────────────────────────────── */
function drawFlag(ctx, letter, x, y, w, h, flagData) {
  const data = flagData || FLAG_DATA;
  const d = data[letter];
  if (!d) {
    ctx.fillStyle = '#94a3b8'; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1.5; ctx.strokeRect(x, y, w, h);
    return;
  }
  const [bg1, bg2, shape] = d;
  ctx.fillStyle = bg1; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = bg2;
  switch (shape) {
    case 'xdiag': {
      const t = w*0.22; ctx.save(); ctx.translate(x+w/2, y+h/2); ctx.rotate(Math.PI/4);
      ctx.fillRect(-w*0.8,-t/2,w*1.6,t); ctx.fillRect(-t/2,-h*0.8,t,h*1.6); ctx.restore(); break; }
    case 'hstripe': ctx.fillRect(x, y+h*0.37, w, h*0.26); break;
    case 'circle':
      ctx.beginPath(); ctx.arc(x+w/2, y+h/2, Math.min(w,h)*0.3, 0, Math.PI*2); ctx.fill(); break;
    case 'vhalf': ctx.fillRect(x+w/2, y, w/2, h); break;
    case 'diagonal':
      ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+w,y+h);
      ctx.lineTo(x+w,y+h-w*0.24); ctx.lineTo(x+w*0.24,y); ctx.closePath(); ctx.fill(); break;
    case 'ltriangle':
      ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+w,y+h/2); ctx.lineTo(x,y+h);
      ctx.closePath(); ctx.fill(); break;
    case 'chevron':
      ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+w*0.52,y+h/2); ctx.lineTo(x,y+h);
      ctx.lineTo(x+w*0.22,y+h); ctx.lineTo(x+w*0.74,y+h/2); ctx.lineTo(x+w*0.22,y);
      ctx.closePath(); ctx.fill(); break;
    case 'innersq': { const m=Math.min(w,h)*0.22; ctx.fillRect(x+m,y+m,w-m*2,h-m*2); break; }
    case 'rtriangle':
      ctx.beginPath(); ctx.moveTo(x+w,y); ctx.lineTo(x+w,y+h); ctx.lineTo(x,y+h/2);
      ctx.closePath(); ctx.fill(); break;
    case 'vstripes':
      for (let k=1;k<5;k+=2) ctx.fillRect(x+k*w/5, y, w/5, h); break;
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1.5;
  ctx.strokeRect(x+0.75, y+0.75, w-1.5, h-1.5);
}

function drawFlagCodebook(ctx, W, H, opts) {
  const codebook = (opts && opts.codebook) || Object.keys(FLAG_DATA);
  const flagData = (opts && opts.flagData) || FLAG_DATA;
  ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, W, H);
  const COLS=6, ROWS=2, padX=14, padY=12, gapX=8, gapY=10, labelH=20;
  const cellW=(W-2*padX-(COLS-1)*gapX)/COLS;
  const cellH=(H-2*padY-(ROWS-1)*gapY)/ROWS;
  const flagH=cellH-labelH;
  codebook.forEach((letter, idx) => {
    const col=idx%COLS, row=Math.floor(idx/COLS);
    const cx=padX+col*(cellW+gapX), cy=padY+row*(cellH+gapY);
    drawFlag(ctx, letter, cx, cy, cellW, flagH, flagData);
    ctx.fillStyle = SPY_C.goldLt; ctx.font = SPY_F.bold(13);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(letter, cx+cellW/2, cy+flagH+labelH/2);
  });
}

function drawFlagPuzzle(ctx, W, H, opts) {
  const puzzle   = (opts && opts.puzzle)   || [];
  const flagData = (opts && opts.flagData) || FLAG_DATA;
  ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, W, H);
  const N=puzzle.length, padX=12, padY=10, gapX=10, numH=18;
  const cellW=(W-2*padX-(N-1)*gapX)/N;
  const flagH=H-2*padY-numH-4;
  puzzle.forEach((letter, i) => {
    const cx=padX+i*(cellW+gapX), cy=padY+numH+4;
    ctx.fillStyle='#94a3b8'; ctx.font=SPY_F.bold(11);
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(i+1, cx+cellW/2, padY+numH/2);
    drawFlag(ctx, letter, cx, cy, cellW, flagH, flagData);
  });
}

/* ── SECTION 15: SCENE — BATTLE MAPS ───────────────────────────
   LLM-GUIDE: Each battle map is drawXxx(ctx, W, H, showArrows).
     showArrows — true after the student picks a command (phase 3)
   All coordinates use W/H fractions — never raw pixel values.
   To add a new battle: copy drawTrenton as a template, rename,
   update terrain/troop positions, register in SPY.draw.battleMap.

   Color scheme uses SPY_C.nightSky / SPY_C.water / SPY_C.terrain
   and the mBox/mLabel/mSub/mArrow primitives from Section 6.
   ─────────────────────────────────────────────────────────────── */

/* Battle of Trenton — Dec 25-26, 1776 — night river crossing */
function drawTrenton(ctx, W, H, showArrows) {
  ctx.fillStyle = SPY_C.nightSky; ctx.fillRect(0, 0, W, H);
  /* Stars — fixed positions, proportional to W */
  [[50,18],[110,32],[170,12],[280,22],[380,16],[440,35],[510,14],[560,28],[590,40]].forEach(([x,y]) => {
    ctx.fillStyle='rgba(255,255,255,0.65)';ctx.beginPath();ctx.arc(x*(W/600),y*(H/210),1.1,0,Math.PI*2);ctx.fill();
  });
  /* Pennsylvania (left bank), New Jersey (right bank), Delaware River */
  ctx.fillStyle=SPY_C.terrain; ctx.fillRect(0,0,W*0.37,H);
  ctx.fillStyle=SPY_C.terrain; ctx.fillRect(W*0.47,0,W*0.53,H);
  ctx.fillStyle=SPY_C.water;   ctx.fillRect(W*0.37,0,W*0.10,H);
  /* Ice chunks in river */
  ctx.fillStyle='rgba(180,220,255,0.14)';
  [[W*0.38,H*0.21,26,7],[W*0.42,H*0.48,18,6],[W*0.39,H*0.81,22,6]].forEach(([x,y,w,h])=>ctx.fillRect(x,y,w,h));
  /* Snow ground cover */
  ctx.fillStyle='rgba(210,225,255,0.06)';
  ctx.fillRect(0,H*0.72,W*0.37,H*0.28); ctx.fillRect(W*0.47,H*0.72,W*0.53,H*0.28);
  /* River label */
  ctx.save();ctx.translate(W*0.42,H/2);ctx.rotate(-Math.PI/2);
  ctx.fillStyle='rgba(100,160,255,0.7)';ctx.font=SPY_F.bold(10);
  ctx.textAlign='center';ctx.fillText('Delaware River',0,0);ctx.restore();
  /* Troop markers */
  const YX=W*0.18,YY=H*0.52;
  mBox(ctx,YX,YY,76,38,'#1e3a5f','#3b82f6');
  mLabel(ctx,"McKONKEY'S FERRY",YX,YY-8,'#93c5fd');mSub(ctx,'2,400 Continental',YX,YY+8,'#60a5fa');
  const EX=W*0.72,EY=H*0.5;
  mBox(ctx,EX,EY,66,36,'#5a1a1a',SPY_C.bRed);
  mLabel(ctx,'TRENTON',EX,EY-8,'#fca5a5');mSub(ctx,'1,500 Hessians',EX,EY+7,'#f87171');
  /* Distance line */
  ctx.strokeStyle='rgba(250,204,21,0.3)';ctx.lineWidth=1;ctx.setLineDash([5,5]);
  ctx.beginPath();ctx.moveTo(YX+38,YY);ctx.lineTo(EX-33,EY);ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle=SPY_C.bGold;ctx.font=SPY_F.bold(10);ctx.textAlign='center';
  ctx.fillText('9 miles',(YX+EX)/2,YY-14);
  /* Movement arrow */
  if(showArrows) mArrow(ctx,YX+38,YY,EX-33,EY,SPY_C.bGreen,'Cross & Attack at Dawn');
  /* Moon */
  ctx.fillStyle='rgba(255,248,200,0.5)';ctx.beginPath();ctx.arc(W-24,18,10,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=SPY_C.nightSky;ctx.beginPath();ctx.arc(W-20,16,9,0,Math.PI*2);ctx.fill();
  /* Compass */
  ctx.fillStyle='rgba(200,220,200,0.55)';ctx.font=SPY_F.bold(10);ctx.textAlign='left';
  ctx.fillText('N ↑',10,H-8);
}

/* Battle of Saratoga — Oct 7, 1777 — ridgeline defense */
function drawSaratoga(ctx, W, H, showArrows) {
  ctx.fillStyle='#0e1a0f';ctx.fillRect(0,0,W,H);
  /* Hudson River (right strip) */
  ctx.fillStyle='#1a3a6e';ctx.fillRect(W*0.86,0,W*0.14,H);
  ctx.fillStyle='rgba(100,150,255,0.1)';
  [[W*0.87,30,7,55],[W*0.89,100,5,70],[W*0.88,185,7,50]].forEach(([x,y,w,h])=>ctx.fillRect(x,y,w,h));
  ctx.save();ctx.translate(W*0.9,H/2);ctx.rotate(-Math.PI/2);
  ctx.fillStyle='rgba(100,160,255,0.65)';ctx.font=SPY_F.bold(10);
  ctx.textAlign='center';ctx.fillText('Hudson River',0,0);ctx.restore();
  /* Bemis Heights ridge polygon */
  ctx.fillStyle='#1a2e12';
  ctx.beginPath();
  ctx.moveTo(0,H*0.42);ctx.bezierCurveTo(W*0.25,H*0.30,W*0.55,H*0.32,W*0.85,H*0.42);
  ctx.lineTo(W*0.85,H*0.66);ctx.bezierCurveTo(W*0.55,H*0.66,W*0.25,H*0.68,0,H*0.68);
  ctx.closePath();ctx.fill();
  ctx.strokeStyle='#2a4a20';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(0,H*0.42);ctx.bezierCurveTo(W*0.25,H*0.30,W*0.55,H*0.32,W*0.85,H*0.42);ctx.stroke();
  /* Labels */
  ctx.fillStyle='rgba(150,200,120,0.55)';ctx.font=SPY_F.bold(10);ctx.textAlign='center';
  ctx.fillText('BEMIS HEIGHTS (High Ground)',W*0.35,H*0.52);
  ctx.fillStyle='rgba(200,230,200,0.45)';ctx.font=SPY_F.normal(9);
  ctx.fillText("▲ Canada — Burgoyne's origin",W*0.42,14);
  ctx.fillText("▼ Albany — Burgoyne's objective (48 mi south)",W*0.42,H-10);
  ctx.fillStyle='rgba(250,204,21,0.6)';ctx.font=SPY_F.normal(9);
  ctx.fillText("★ Freeman's Farm",W*0.60,H*0.28);
  /* Troop markers */
  const YX=W*0.35,YY=H*0.53;
  mBox(ctx,YX,YY,74,36,'#1e3a5f',SPY_C.bBlue);
  mLabel(ctx,'GEN. GATES',YX,YY-8,'#93c5fd');mSub(ctx,'9,000 Continental',YX,YY+7,'#60a5fa');
  const EX=W*0.50,EY=H*0.16;
  mBox(ctx,EX,EY,68,34,'#5a1a1a',SPY_C.bRed);
  mLabel(ctx,'BURGOYNE',EX,EY-7,'#fca5a5');mSub(ctx,'5,700 British',EX,EY+7,'#f87171');
  /* Threat arrow (faded) */
  ctx.strokeStyle='rgba(239,68,68,0.3)';ctx.lineWidth=1.5;ctx.setLineDash([4,4]);
  ctx.beginPath();ctx.moveTo(EX,EY+17);ctx.lineTo(YX,YY-18);ctx.stroke();ctx.setLineDash([]);
  if(showArrows) mArrow(ctx,YX+37,YY-8,EX+10,EY+17,SPY_C.bGreen,'Charge!');
  ctx.fillStyle='rgba(200,220,200,0.55)';ctx.font=SPY_F.bold(10);ctx.textAlign='left';
  ctx.fillText('N ↑',10,H-8);
}

/* Siege of Yorktown — Oct 14, 1781 — peninsula encirclement */
function drawYorktown(ctx, W, H, showArrows) {
  /* Chesapeake Bay water */
  ctx.fillStyle=SPY_C.bayWater;ctx.fillRect(0,0,W,H);
  ctx.strokeStyle='rgba(30,80,160,0.18)';ctx.lineWidth=1;
  for(let y=18;y<H;y+=18){
    ctx.beginPath();
    for(let x=0;x<W;x+=40){ctx.moveTo(x,y);ctx.quadraticCurveTo(x+10,y-4,x+20,y);ctx.quadraticCurveTo(x+30,y+4,x+40,y);}
    ctx.stroke();
  }
  /* Peninsula land */
  ctx.fillStyle=SPY_C.terrain;
  ctx.beginPath();
  ctx.moveTo(W*0.14,0);ctx.lineTo(W*0.86,0);
  ctx.lineTo(W*0.82,H*0.60);ctx.lineTo(W*0.50,H*0.72);ctx.lineTo(W*0.18,H*0.60);
  ctx.closePath();ctx.fill();
  /* York River */
  ctx.fillStyle='rgba(20,50,120,0.55)';ctx.fillRect(W*0.14,0,W*0.72,18);
  ctx.fillStyle='rgba(100,160,255,0.5)';ctx.font=SPY_F.normal(9);ctx.textAlign='center';
  ctx.fillText('York River',W*0.5,13);
  /* Bay label */
  ctx.fillStyle='rgba(80,140,230,0.55)';ctx.font=SPY_F.bold(11);
  ctx.fillText('Chesapeake Bay',W*0.5,H-13);
  /* Siege arc */
  ctx.strokeStyle='rgba(59,130,246,0.28)';ctx.lineWidth=2;ctx.setLineDash([6,5]);
  ctx.beginPath();ctx.arc(W*0.50,H*0.38,W*0.33,0.18*Math.PI,0.82*Math.PI);ctx.stroke();ctx.setLineDash([]);
  /* Yorktown */
  const TX=W*0.50,TY=H*0.38;
  mBox(ctx,TX,TY,72,36,'#5a1a1a',SPY_C.bRed);
  mLabel(ctx,'YORKTOWN',TX,TY-8,'#fca5a5');mSub(ctx,'8,000 British',TX,TY+7,'#f87171');
  /* Allied wings */
  [[W*0.20,H*0.40,'Left Wing','5,600'],[W*0.50,H*0.62,'Center','5,800'],[W*0.80,H*0.40,'Right Wing','5,600']].forEach(([px,py,lbl,n])=>{
    mBox(ctx,px,py,60,30,'#1e3a5f',SPY_C.bBlue);
    mLabel(ctx,lbl,px,py-6,'#93c5fd');mSub(ctx,n+' Allied',px,py+7,'#60a5fa');
  });
  /* Redoubts 9 & 10 */
  [[W*0.76,H*0.52],[W*0.82,H*0.45]].forEach(([rx,ry],i)=>{
    ctx.strokeStyle='#fbbf24';ctx.lineWidth=1.5;
    ctx.strokeRect(rx-8,ry-8,16,16);
    ctx.fillStyle='rgba(251,191,36,0.12)';ctx.fillRect(rx-8,ry-8,16,16);
    ctx.fillStyle='#fbbf24';ctx.font=SPY_F.bold(9);ctx.textAlign='center';
    ctx.fillText('R'+(9+i),rx,ry+4);
  });
  ctx.fillStyle='rgba(251,191,36,0.65)';ctx.font=SPY_F.normal(9);
  ctx.textAlign='left';ctx.fillText('← Redoubts 9 & 10',W*0.56,H*0.38);
  /* French fleet ships */
  [[W*0.18,H*0.84],[W*0.36,H*0.88],[W*0.64,H*0.88],[W*0.82,H*0.84]].forEach(([sx,sy])=>{
    ctx.fillStyle='rgba(255,255,255,0.5)';
    ctx.beginPath();ctx.ellipse(sx,sy,12,5,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.35)';ctx.fillRect(sx-1,sy-12,2,12);
  });
  ctx.fillStyle='rgba(200,220,255,0.5)';ctx.font=SPY_F.normal(9);ctx.textAlign='center';
  ctx.fillText('French Fleet (28 ships)',W*0.5,H*0.80);
  /* Movement arrows */
  if(showArrows){
    mArrow(ctx,W*0.76-8,H*0.52,TX+22,TY+5,SPY_C.bGreen,'Storm R9 & R10!');
    mArrow(ctx,W*0.82-8,H*0.45,TX+28,TY-5,SPY_C.bGreen,null);
  }
  ctx.fillStyle='rgba(200,220,200,0.55)';ctx.font=SPY_F.bold(10);ctx.textAlign='left';
  ctx.fillText('N ↑',10,H-8);
}

/* ── SECTION 16: BATTLE ANIMATION ──────────────────────────────
   LLM-GUIDE: Each battle has animXxx(ctx, W, H, t) where t runs
   0 → ANIM_FRAMES (360 at 60fps ≈ 6 seconds).
   Pattern inside each function:
     1. Draw base map (reuse drawXxx from Section 15)
     2. Move troop clusters with troopCluster() + lerp() + ap()
     3. Flash at clash point with battleFlash()
     4. Show capture overlay (rrect + mLabel)
     5. Show animVictory() in last third

   To add a new battle animation:
     1. Create animMyBattle(ctx, W, H, t)
     2. Register in SPY.anim.start dispatch switch
     3. Use battleId matching your SCENARIOS entry id in battle-command.html
   ─────────────────────────────────────────────────────────────── */
const ANIM_FRAMES = 360;
let _animFrame = null;
let _animT     = 0;

function animTrenton(ctx, W, H, t) {
  drawTrenton(ctx, W, H, false);
  /* Continental clusters cross the Delaware */
  const cU=[
    {x0:W*0.15,y0:H*0.36,x1:W*0.67,y1:H*0.43,d:0},
    {x0:W*0.12,y0:H*0.53,x1:W*0.66,y1:H*0.52,d:16},
    {x0:W*0.16,y0:H*0.68,x1:W*0.67,y1:H*0.61,d:10},
    {x0:W*0.20,y0:H*0.43,x1:W*0.69,y1:H*0.46,d:24},
  ];
  cU.forEach(u=>{
    const p=ap(t,45+u.d,195+u.d);if(p<=0)return;
    const x=lerp(u.x0,u.x1,p),y=lerp(u.y0,u.y1,p);
    if(p>0.07)troopCluster(ctx,lerp(u.x0,u.x1,Math.max(0,p-0.08)),lerp(u.y0,u.y1,Math.max(0,p-0.08)),'rgba(59,130,246,0.2)',5,7,0.2);
    troopCluster(ctx,x,y,SPY_C.bBlue,7,8,0.9);
  });
  if(t>208&&t<268){const fl=Math.abs(Math.sin(t*0.5));battleFlash(ctx,W*0.72,H*0.5,34,fl*0.72,239,68,68);battleFlash(ctx,W*0.72,H*0.5,16,fl*0.5,255,185,60);}
  if(t>252){
    const ca=clamp01((t-252)/50);
    rrect(ctx,W*0.72-35,H*0.5-20,70,40,6);
    ctx.fillStyle=`rgba(8,20,8,${ca*0.86})`;ctx.fill();
    ctx.strokeStyle=`rgba(74,222,128,${ca})`;ctx.lineWidth=2;ctx.stroke();
    ctx.fillStyle=`rgba(74,222,128,${ca})`;ctx.font=SPY_F.bold(11);ctx.textAlign='center';
    ctx.fillText('CAPTURED',W*0.72,H*0.5-4);
    ctx.font=SPY_F.normal(9);ctx.fillStyle=`rgba(74,222,128,${ca*0.75})`;
    ctx.fillText('~900 Hessians',W*0.72,H*0.5+10);
  }
  if(t>296)animVictory(ctx,W,H,'Victory at Trenton!','Christmas night, 1776 — The revolution lives on',clamp01((t-296)/52));
}

function animSaratoga(ctx, W, H, t) {
  drawSaratoga(ctx, W, H, false);
  /* British advance south then scatter */
  const bU=[
    {x0:W*0.43,y0:H*0.03,x1:W*0.49,y1:H*0.28,sx:W*0.33,sy:H*0.20,d:0},
    {x0:W*0.52,y0:H*0.02,x1:W*0.55,y1:H*0.26,sx:W*0.67,sy:H*0.08,d:14},
    {x0:W*0.47,y0:H*0.01,x1:W*0.52,y1:H*0.30,sx:W*0.70,sy:H*0.32,d:7},
  ];
  bU.forEach((u,i)=>{
    const p=ap(t,35+u.d,150+u.d);if(p<=0)return;
    const sc=t>230?ap(t,230+i*12,310+i*12):0;
    const x=sc>0?lerp(lerp(u.x0,u.x1,1),u.sx,sc):lerp(u.x0,u.x1,p);
    const y=sc>0?lerp(lerp(u.y0,u.y1,1),u.sy,sc):lerp(u.y0,u.y1,p);
    const alpha=sc>0?Math.max(0.05,0.9-sc*0.88):0.9;
    troopCluster(ctx,x,y,`rgba(239,68,68,${alpha})`,7,8,alpha);
  });
  /* American charge from ridge */
  const aU=[
    {x0:W*0.34,y0:H*0.51,x1:W*0.47,y1:H*0.31,d:0},
    {x0:W*0.29,y0:H*0.55,x1:W*0.51,y1:H*0.28,d:9},
    {x0:W*0.38,y0:H*0.49,x1:W*0.50,y1:H*0.33,d:5},
    {x0:W*0.32,y0:H*0.53,x1:W*0.45,y1:H*0.30,d:14},
  ];
  aU.forEach(u=>{
    const p=ap(t,118+u.d,218+u.d);if(p<=0)return;
    const x=lerp(u.x0,u.x1,p),y=lerp(u.y0,u.y1,p);
    if(p>0.07)troopCluster(ctx,lerp(u.x0,u.x1,Math.max(0,p-0.08)),lerp(u.y0,u.y1,Math.max(0,p-0.08)),'rgba(59,130,246,0.22)',5,7,0.22);
    troopCluster(ctx,x,y,SPY_C.bBlue,7,8,0.9);
  });
  if(t>207&&t<267){const fl=Math.abs(Math.sin(t*0.45));battleFlash(ctx,W*0.50,H*0.30,40,fl*0.65,255,160,40);battleFlash(ctx,W*0.50,H*0.30,18,fl*0.45,255,220,60);}
  if(t>278){
    const ca=clamp01((t-278)/52);
    rrect(ctx,W*0.50-36,H*0.16-20,72,40,6);
    ctx.fillStyle=`rgba(8,20,8,${ca*0.86})`;ctx.fill();
    ctx.strokeStyle=`rgba(74,222,128,${ca})`;ctx.lineWidth=2;ctx.stroke();
    ctx.fillStyle=`rgba(74,222,128,${ca})`;ctx.font=SPY_F.bold(10);ctx.textAlign='center';
    ctx.fillText('SURROUNDED',W*0.50,H*0.16-5);
    ctx.font=SPY_F.normal(9);ctx.fillStyle=`rgba(74,222,128,${ca*0.75})`;
    ctx.fillText('5,895 surrender Oct 17',W*0.50,H*0.16+9);
  }
  if(t>308)animVictory(ctx,W,H,'Victory at Saratoga!','France joins the war — the turning point of the Revolution',clamp01((t-308)/52));
}

function animYorktown(ctx, W, H, t) {
  drawYorktown(ctx, W, H, false);
  /* Cycling cannon fire */
  if(t<165){
    const seed=Math.floor(t/4)%7;
    const fp=[[W*0.38,H*0.26],[W*0.44,H*0.30],[W*0.56,H*0.28],[W*0.40,H*0.35],[W*0.60,H*0.32],[W*0.48,H*0.24],[W*0.52,H*0.36]];
    const[fx,fy]=fp[seed];const fl=1-(t%4)/4;
    battleFlash(ctx,fx,fy,18,fl*0.7,255,175,40);battleFlash(ctx,fx,fy,8,fl*0.5,255,230,80);
  }
  /* Allied wings advance */
  const alU=[
    {x0:W*0.20,y0:H*0.40,x1:W*0.38,y1:H*0.44,d:0},{x0:W*0.22,y0:H*0.46,x1:W*0.37,y1:H*0.49,d:12},
    {x0:W*0.80,y0:H*0.40,x1:W*0.72,y1:H*0.52,d:5},{x0:W*0.78,y0:H*0.35,x1:W*0.77,y1:H*0.45,d:18},
    {x0:W*0.50,y0:H*0.62,x1:W*0.50,y1:H*0.51,d:8},
  ];
  alU.forEach(u=>{const p=ap(t,55+u.d,182+u.d);if(p<=0)return;troopCluster(ctx,lerp(u.x0,u.x1,p),lerp(u.y0,u.y1,p),SPY_C.bBlue,7,7,0.9);});
  if(t>164&&t<228){const fl=Math.abs(Math.sin(t*0.5));battleFlash(ctx,W*0.50,H*0.38,34,fl*0.55,239,68,68);}
  if(t>174&&t<248){const fl=Math.abs(Math.sin(t*0.6));battleFlash(ctx,W*0.76,H*0.52,22,fl*0.78,74,222,128);battleFlash(ctx,W*0.82,H*0.45,22,fl*0.78,74,222,128);}
  /* Redoubt capture overlays */
  if(t>240){
    const ca=clamp01((t-240)/45);
    [[W*0.76,H*0.52,'R9 ✓'],[W*0.82,H*0.45,'R10 ✓']].forEach(([rx,ry,lbl])=>{
      ctx.strokeStyle=`rgba(74,222,128,${ca})`;ctx.lineWidth=2;
      ctx.fillStyle=`rgba(74,222,128,${ca*0.25})`;ctx.fillRect(rx-10,ry-10,20,20);ctx.strokeRect(rx-10,ry-10,20,20);
      ctx.fillStyle=`rgba(74,222,128,${ca})`;ctx.font=SPY_F.bold(8);ctx.textAlign='center';ctx.fillText(lbl,rx,ry+3);
    });
  }
  /* White flag rises */
  if(t>220){
    const fp=clamp01((t-220)/66),TX=W*0.50,TY=H*0.38;
    ctx.strokeStyle=`rgba(255,255,255,${fp*0.9})`;ctx.lineWidth=2.5;
    ctx.beginPath();ctx.moveTo(TX+5,TY-22);ctx.lineTo(TX+5,TY-22-fp*30);ctx.stroke();
    if(fp>0.25){const fa=clamp01((fp-0.25)/0.75);ctx.fillStyle=`rgba(255,255,255,${fa*0.85})`;ctx.fillRect(TX+6,TY-22-fp*30,18,12*fa);}
  }
  /* Surrender overlay on Yorktown */
  if(t>268){
    const ca=clamp01((t-268)/48),TX=W*0.50,TY=H*0.38;
    rrect(ctx,TX-42,TY-24,84,48,6);
    ctx.fillStyle=`rgba(8,20,8,${ca*0.86})`;ctx.fill();
    ctx.strokeStyle=`rgba(74,222,128,${ca})`;ctx.lineWidth=2;ctx.stroke();
    ctx.fillStyle=`rgba(74,222,128,${ca})`;ctx.font=SPY_F.bold(10);ctx.textAlign='center';
    ctx.fillText('CORNWALLIS',TX,TY-10);ctx.fillText('SURRENDERS',TX,TY+4);
    ctx.font=SPY_F.normal(9);ctx.fillStyle=`rgba(74,222,128,${ca*0.75})`;ctx.fillText('Oct 19, 1781',TX,TY+17);
  }
  if(t>300)animVictory(ctx,W,H,'Cornwallis Surrenders!','October 19, 1781 — The last major battle of the Revolution',clamp01((t-300)/52));
}

/* ── SECTION 17: CONFETTI ───────────────────────────────────────
   LLM-GUIDE: SPY.confetti.create(count, W, H) → particle array
   SPY.confetti.step(ctx, W, H, particles) → mutates + draws one frame
   In your page's animation loop, call step() then check frame count.
   ─────────────────────────────────────────────────────────────── */
function confettiCreate(count, W, H) {
  const COLORS=[SPY_C.red,SPY_C.gold,SPY_C.blue,SPY_C.green,'#f59e0b','#7c3aed'];
  return Array.from({length:count},()=>({
    x:Math.random()*W, y:Math.random()*H-H,
    vx:(Math.random()-0.5)*2, vy:2+Math.random()*3,
    size:6+Math.random()*7,
    color:COLORS[Math.floor(Math.random()*COLORS.length)],
    rotation:Math.random()*Math.PI*2,
    rotV:(Math.random()-0.5)*0.15,
  }));
}

function confettiStep(ctx, W, H, particles) {
  ctx.clearRect(0,0,W,H);
  particles.forEach(p=>{
    p.x+=p.vx; p.y+=p.vy; p.vy+=0.05; p.rotation+=p.rotV;
    if(p.y>H+12){p.y=-12;p.x=Math.random()*W;p.vy=2+Math.random()*2;}
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rotation);
    ctx.fillStyle=p.color;ctx.globalAlpha=0.85;
    ctx.fillRect(-p.size/2,-p.size/4,p.size,p.size*0.5);
    ctx.restore();
  });
}

/* ── SECTION 18: PUBLIC SPY NAMESPACE ──────────────────────────
   LLM-GUIDE: This object is the single import surface.
   SPY.CANVAS.scale — set this to 2 before any mount() call
   SPY.C            — color palette constants
   SPY.F            — font helper functions
   SPY.mount()      — set up canvas for scaled drawing
   SPY.mapGrid.*    — geometry helpers for route-map.html click handler
   SPY.draw.*       — all scene draw functions
   SPY.anim.*       — battle animation engine
   SPY.confetti.*   — particle system
   ─────────────────────────────────────────────────────────────── */
const SPY = {
  CANVAS: { scale: 1, sizes: SPY_CANVAS_SIZES },
  C:  SPY_C,
  F:  SPY_F,

  mount: spyMount,

  /* Map grid geometry — use in route-map.html click handler */
  mapGrid: {
    cellSize: spyMapCellSize,
    colToX:   spyMapColToX,
    rowToY:   spyMapRowToY,
    /* Returns { col, row } or null. x/y must be LOGICAL coords
       (divide getCanvasXY result by SPY.CANVAS.scale if scale > 1) */
    xyToCell: spyMapXYToCell,
  },

  draw: {
    /* cipher.html  — opts: { shift } */
    cipherWheel: drawCipherWheel,
    /* route-map.html — opts: { route, landmarks, patrolZones } */
    mapGrid: drawMapGrid,
    /* lab-test.html — opts: { raining, damaged, selectedMaterial } */
    rainScene:   drawRainScene,
    rainDrops:   drawRainDrops,
    /* invisible-ink.html — opts: { progress } */
    invisibleInk: drawInvisibleInk,
    /* signal-flags.html */
    flag:         drawFlag,
    flagCodebook: drawFlagCodebook,
    flagPuzzle:   drawFlagPuzzle,
    /* battle-command.html — dispatch by battleId */
    battleMap(ctx, W, H, opts) {
      const id = opts && opts.battleId;
      const sa = opts && opts.showArrows;
      if (id === 'trenton_1776')  drawTrenton(ctx, W, H, sa);
      if (id === 'saratoga_1777') drawSaratoga(ctx, W, H, sa);
      if (id === 'yorktown_1781') drawYorktown(ctx, W, H, sa);
    },
    /* battle animation frame dispatch */
    battleAnimFrame(ctx, W, H, opts) {
      const id = opts && opts.battleId, t = opts && opts.t || 0;
      if (id === 'trenton_1776')  animTrenton(ctx, W, H, t);
      if (id === 'saratoga_1777') animSaratoga(ctx, W, H, t);
      if (id === 'yorktown_1781') animYorktown(ctx, W, H, t);
    },
  },

  /* Battle animation engine */
  anim: {
    /* Start animation loop for a battle. canvasId = 'battle-anim'. */
    start(canvasId, battleId) {
      const canvas = typeof canvasId === 'string'
        ? document.getElementById(canvasId) : canvasId;
      if (!canvas) return;
      if (_animFrame) cancelAnimationFrame(_animFrame);
      _animFrame = null; _animT = 0;
      const s = SPY.CANVAS.scale;
      const W = canvas.width / s, H = canvas.height / s;
      const tick = () => {
        _animT++;
        const ctx = canvas.getContext('2d');
        if (battleId === 'trenton_1776')  animTrenton(ctx, W, H, _animT);
        if (battleId === 'saratoga_1777') animSaratoga(ctx, W, H, _animT);
        if (battleId === 'yorktown_1781') animYorktown(ctx, W, H, _animT);
        if (_animT < ANIM_FRAMES) {
          _animFrame = requestAnimationFrame(tick);
        } else {
          _animFrame = null;
          const rb = document.getElementById('replay-btn');
          if (rb) rb.style.display = 'inline-block';
        }
      };
      _animFrame = requestAnimationFrame(tick);
    },
    stop() {
      if (_animFrame) { cancelAnimationFrame(_animFrame); _animFrame = null; }
    },
    /* replay(canvasId, battleId) — hides Replay button, restarts */
    replay(canvasId, battleId) {
      const rb = document.getElementById('replay-btn');
      if (rb) rb.style.display = 'none';
      this.start(canvasId, battleId);
    },
  },

  confetti: {
    create: confettiCreate,
    step:   confettiStep,
  },
};
