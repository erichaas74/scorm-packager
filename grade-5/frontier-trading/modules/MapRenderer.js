/* ================================================================
   Frontier Trading Company — MapRenderer  v2 (Illustrated Map)
   Parchment texture, topographic terrain, hand-drawn routes,
   drawn settlement icons, edge vignette, decorated compass.
   ================================================================ */

let canvas, ctx;
let mapW, mapH;
let particleList = [];
let wagonBob = 0, wagonBobDir = 1;

// Per-resize caches — null forces rebuild on next draw
let parchmentCache    = null;
let routeDisplayPaths = {}; // pre-jittered pixel paths keyed by route id

// ══════════════════════════════════════════════════════
// INIT & RESIZE
// ══════════════════════════════════════════════════════
function initCanvas(canvasEl) {
  canvas = canvasEl;
  ctx    = canvas.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
}

function resizeCanvas() {
  if (!canvas) return;
  const parent = canvas.parentElement;
  mapW = parent.clientWidth  || 900;
  mapH = Math.max(420, Math.round(mapW * 0.52));
  canvas.width  = mapW;
  canvas.height = mapH;
  // Invalidate caches so they rebuild at new size
  parchmentCache    = null;
  routeDisplayPaths = {};
}

function px(fx, fy) { return [fx * mapW, fy * mapH]; }

// ══════════════════════════════════════════════════════
// PARCHMENT TEXTURE — built once, cached as offscreen canvas
// ══════════════════════════════════════════════════════
function buildParchmentCache() {
  const oc   = document.createElement('canvas');
  oc.width   = mapW;
  oc.height  = mapH;
  const o    = oc.getContext('2d');

  // Warm base gradient
  const grad = o.createLinearGradient(0, 0, mapW, mapH);
  grad.addColorStop(0,    '#FAF0D5');
  grad.addColorStop(0.30, '#F4E5B2');
  grad.addColorStop(0.65, '#EEDC9E');
  grad.addColorStop(1,    '#E8D098');
  o.fillStyle = grad;
  o.fillRect(0, 0, mapW, mapH);

  // Horizontal fiber streaks
  for (let i = 0; i < 180; i++) {
    const y   = Math.random() * mapH;
    const len = mapW * (0.2 + Math.random() * 0.8);
    const x0  = Math.random() * (mapW - len);
    o.strokeStyle = '#5C3A00';
    o.lineWidth   = 0.35 + Math.random() * 0.65;
    o.globalAlpha = 0.012 + Math.random() * 0.032;
    o.beginPath();
    o.moveTo(x0, y);
    o.lineTo(x0 + len, y + (Math.random() - 0.5) * 2.5);
    o.stroke();
  }

  // Age spots / blotches
  o.globalAlpha = 1;
  for (let i = 0; i < 55; i++) {
    const ax = Math.random() * mapW;
    const ay = Math.random() * mapH;
    const r  = 5 + Math.random() * 45;
    const sg = o.createRadialGradient(ax, ay, 0, ax, ay, r);
    sg.addColorStop(0, `rgba(100,58,8,${0.03 + Math.random() * 0.07})`);
    sg.addColorStop(1, 'rgba(100,58,8,0)');
    o.fillStyle = sg;
    o.beginPath();
    o.ellipse(ax, ay, r, r * (0.35 + Math.random() * 0.65), Math.random() * Math.PI, 0, Math.PI * 2);
    o.fill();
  }

  // Fine noise stipple
  o.fillStyle = '#4A2C00';
  for (let i = 0; i < 3500; i++) {
    o.globalAlpha = 0.018 + Math.random() * 0.045;
    o.fillRect(Math.random() * mapW, Math.random() * mapH,
               Math.random() < 0.75 ? 1 : 2, 1);
  }

  parchmentCache = oc;
}

function drawParchment() {
  if (!parchmentCache) buildParchmentCache();
  ctx.drawImage(parchmentCache, 0, 0);
}

// ══════════════════════════════════════════════════════
// TERRAIN — topographic / illustrated style
// ══════════════════════════════════════════════════════
function drawTerrainFeatures() {
  drawWinterZone();
  drawForestArea();
  drawRiver();
  drawMountains();
  drawPlains();
}

function drawRiver() {
  ctx.save();
  // Wide blue body
  ctx.beginPath();
  ctx.moveTo(...px(0.00, 0.80));
  ctx.bezierCurveTo(...px(0.08, 0.76), ...px(0.18, 0.65), ...px(0.28, 0.62));
  ctx.bezierCurveTo(...px(0.34, 0.59), ...px(0.40, 0.56), ...px(0.46, 0.52));
  ctx.strokeStyle = 'rgba(43,108,163,0.30)';
  ctx.lineWidth   = mapW * 0.032;
  ctx.lineCap     = 'round';
  ctx.stroke();

  // Lighter center channel
  ctx.beginPath();
  ctx.moveTo(...px(0.00, 0.80));
  ctx.bezierCurveTo(...px(0.08, 0.76), ...px(0.18, 0.65), ...px(0.28, 0.62));
  ctx.bezierCurveTo(...px(0.34, 0.59), ...px(0.40, 0.56), ...px(0.46, 0.52));
  ctx.strokeStyle = 'rgba(120,190,245,0.22)';
  ctx.lineWidth   = mapW * 0.012;
  ctx.stroke();

  // Ripple hatch lines
  ctx.lineWidth   = 0.7;
  for (let i = 0; i < 5; i++) {
    const t = i / 6;
    ctx.strokeStyle = `rgba(43,108,163,${0.06 + t * 0.04})`;
    ctx.beginPath();
    ctx.moveTo(...px(0.01 + t * 0.04, 0.79 - t * 0.01));
    ctx.bezierCurveTo(
      ...px(0.09 + t * 0.01, 0.75),
      ...px(0.20 + t * 0.01, 0.64),
      ...px(0.30 + t * 0.005, 0.61)
    );
    ctx.stroke();
  }
  ctx.restore();
}

function drawForestArea() {
  const treePts = [
    [0.35, 0.67], [0.40, 0.70], [0.45, 0.65], [0.50, 0.72], [0.52, 0.68],
    [0.55, 0.63], [0.42, 0.78], [0.48, 0.80], [0.38, 0.75], [0.60, 0.70]
  ];
  ctx.save();
  for (const [fx, fy] of treePts) {
    const [x, y] = px(fx, fy);
    const r = mapW * 0.022;

    // Three overlapping canopy circles
    ctx.globalAlpha = 0.24;
    ctx.fillStyle   = '#2A5C1E';
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + r * 0.48, y - r * 0.28, r * 0.68, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x - r * 0.32, y - r * 0.38, r * 0.55, 0, Math.PI * 2); ctx.fill();

    // Stipple dots for texture
    ctx.globalAlpha = 0.07;
    ctx.fillStyle   = '#1A3C0E';
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(x + Math.cos(a) * r * 0.60, y + Math.sin(a) * r * 0.52, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawMountains() {
  const peaks = [
    [0.52, 0.38, 0.060],
    [0.58, 0.32, 0.070],
    [0.64, 0.25, 0.080],
    [0.70, 0.30, 0.055],
    [0.75, 0.22, 0.060],
    [0.60, 0.40, 0.045]
  ];
  // Painter's order: back to front (lower y = further back)
  const sorted = [...peaks].sort((a, b) => a[1] - b[1]);

  ctx.save();
  for (const [fx, fy, sz] of sorted) {
    const [x, y] = px(fx, fy);
    const h = sz * mapH * 1.35;
    const w = sz * mapW * 1.85;

    // Cast shadow to the right
    ctx.globalAlpha = 0.10;
    ctx.fillStyle   = '#2A3040';
    ctx.beginPath();
    ctx.moveTo(x + w * 0.05, y + h * 0.04);
    ctx.lineTo(x + w, y + h * 0.52);
    ctx.lineTo(x + w * 1.15, y + h * 0.52);
    ctx.lineTo(x + w * 0.20, y + h * 0.04);
    ctx.closePath();
    ctx.fill();

    // Main peak body
    ctx.globalAlpha = 0.33;
    ctx.fillStyle   = '#6B7A8D';
    ctx.beginPath();
    ctx.moveTo(x - w, y + h * 0.50);
    ctx.lineTo(x - w * 0.24, y + h * 0.07);
    ctx.lineTo(x, y);
    ctx.lineTo(x + w * 0.24, y + h * 0.07);
    ctx.lineTo(x + w, y + h * 0.50);
    ctx.closePath();
    ctx.fill();

    // Left face (slightly lighter)
    ctx.globalAlpha = 0.10;
    ctx.fillStyle   = '#B0C0D0';
    ctx.beginPath();
    ctx.moveTo(x - w, y + h * 0.50);
    ctx.lineTo(x - w * 0.24, y + h * 0.07);
    ctx.lineTo(x, y + h * 0.28);
    ctx.lineTo(x - w * 0.5, y + h * 0.50);
    ctx.closePath();
    ctx.fill();

    // Snow cap — irregular polygon
    ctx.globalAlpha = 0.90;
    ctx.fillStyle   = '#EEF5FA';
    ctx.beginPath();
    ctx.moveTo(x - w * 0.24, y + h * 0.07);
    ctx.lineTo(x, y);
    ctx.lineTo(x + w * 0.24, y + h * 0.07);
    ctx.lineTo(x + w * 0.14, y + h * 0.20);
    ctx.lineTo(x + w * 0.04, y + h * 0.15);
    ctx.lineTo(x - w * 0.06, y + h * 0.22);
    ctx.lineTo(x - w * 0.15, y + h * 0.20);
    ctx.closePath();
    ctx.fill();

    // Topographic contour lines
    ctx.strokeStyle = '#3A4855';
    ctx.lineWidth   = 0.9;
    for (let ring = 1; ring <= 3; ring++) {
      const t  = ring / 4;
      const xr = w * (1 - t * 0.78);
      const yr = h * (1 - t * 0.94);
      ctx.globalAlpha = 0.09;
      ctx.beginPath();
      ctx.moveTo(x - xr, y + yr * 0.52);
      ctx.quadraticCurveTo(x, y + yr * 0.44, x + xr, y + yr * 0.52);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawWinterZone() {
  ctx.save();
  ctx.globalAlpha = 0.14;
  const grad = ctx.createRadialGradient(...px(0.20, 0.20), 0, ...px(0.20, 0.20), mapW * 0.27);
  grad.addColorStop(0, '#C8EAF6');
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, mapW * 0.46, mapH * 0.52);
  ctx.restore();
}

function drawPlains() {
  ctx.save();
  ctx.globalAlpha = 0.07;
  const grad = ctx.createLinearGradient(...px(0.5, 0.58), ...px(1.0, 0.96));
  grad.addColorStop(0, '#C8B060');
  grad.addColorStop(1, '#A89040');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(...px(0.50, 0.58));
  ctx.lineTo(...px(1.00, 0.58));
  ctx.lineTo(...px(1.00, 1.00));
  ctx.lineTo(...px(0.50, 1.00));
  ctx.closePath();
  ctx.fill();

  // Subtle vertical grass lines
  ctx.globalAlpha = 0.04;
  ctx.strokeStyle = '#8A7030';
  ctx.lineWidth   = 0.7;
  for (let i = 0; i < 14; i++) {
    const t = i / 13;
    ctx.beginPath();
    ctx.moveTo(...px(0.50 + t * 0.50, 0.60));
    ctx.lineTo(...px(0.50 + t * 0.50, 0.98));
    ctx.stroke();
  }
  ctx.restore();
}

// ══════════════════════════════════════════════════════
// ROUTE LINES — hand-drawn jitter style, pre-computed
// ══════════════════════════════════════════════════════
function subdivideJitter(pts, amplitude) {
  let cur = pts.slice();
  for (let pass = 0; pass < 2; pass++) {
    const next = [cur[0]];
    for (let i = 0; i < cur.length - 1; i++) {
      const [ax, ay] = cur[i], [bx, by] = cur[i + 1];
      const mx  = (ax + bx) / 2, my = (ay + by) / 2;
      const len = Math.hypot(bx - ax, by - ay) || 1;
      const nx  = -(by - ay) / len, ny = (bx - ax) / len;
      const j   = (Math.random() - 0.5) * amplitude;
      next.push([mx + nx * j, my + ny * j], [bx, by]);
    }
    cur = next;
    amplitude *= 0.55;
  }
  return cur;
}

function getRouteDisplayPath(id) {
  if (!routeDisplayPaths[id]) {
    const route = ROUTES[id];
    if (!route) return [];
    const pts = route.waypoints.map(([fx, fy]) => px(fx, fy));
    routeDisplayPaths[id] = subdivideJitter(pts, 5);
  }
  return routeDisplayPaths[id];
}

function drawRoutes(selectedRouteId, hoveredRouteId) {
  for (const [id, route] of Object.entries(ROUTES)) {
    drawRoute(id, route, id === selectedRouteId, id === hoveredRouteId, isRouteCompatible(id));
  }
}

function drawRoute(id, route, selected, hovered, compatible) {
  const jpts = getRouteDisplayPath(id);
  if (jpts.length < 2) return;

  ctx.save();
  ctx.lineCap  = 'round';
  ctx.lineJoin = 'round';
  ctx.setLineDash([]);

  const pathThrough = () => {
    ctx.beginPath();
    ctx.moveTo(...jpts[0]);
    for (let i = 1; i < jpts.length; i++) ctx.lineTo(...jpts[i]);
  };

  if (!compatible) {
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = 'rgba(140,100,60,0.28)';
    ctx.lineWidth   = 2;
    pathThrough(); ctx.stroke();
  } else if (selected) {
    // Outer glow
    ctx.shadowColor  = route.color;
    ctx.shadowBlur   = 12;
    ctx.globalAlpha  = 0.20;
    ctx.lineWidth    = 18;
    ctx.strokeStyle  = route.color;
    pathThrough(); ctx.stroke();

    // Main stroke
    ctx.shadowBlur  = 0;
    ctx.globalAlpha = 1;
    ctx.lineWidth   = 5;
    ctx.strokeStyle = route.color;
    pathThrough(); ctx.stroke();

    // Inner highlight
    ctx.globalAlpha = 0.30;
    ctx.lineWidth   = 1.8;
    ctx.strokeStyle = '#fff';
    pathThrough(); ctx.stroke();
  } else {
    ctx.setLineDash([9, 6]);
    ctx.strokeStyle = hovered ? route.color : route.colorLight;
    ctx.lineWidth   = hovered ? 3.5 : 2.5;
    ctx.globalAlpha = hovered ? 0.85 : 0.55;
    pathThrough(); ctx.stroke();
  }
  ctx.restore();
}

function drawWaypointDots(selectedRouteId) {
  for (const [id, route] of Object.entries(ROUTES)) {
    if (!isRouteCompatible(id) && id !== selectedRouteId) continue;
    const pts      = route.waypoints.map(([fx, fy]) => px(fx, fy));
    const selected = id === selectedRouteId;
    for (let i = 1; i < pts.length - 1; i++) {
      const [x, y] = pts[i];
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, selected ? 4.5 : 3, 0, Math.PI * 2);
      ctx.fillStyle   = selected ? route.color : 'rgba(107,58,42,0.45)';
      ctx.fill();
      ctx.strokeStyle = '#F5E6C8';
      ctx.lineWidth   = 1.2;
      ctx.stroke();
      ctx.restore();
    }
  }
}

// ══════════════════════════════════════════════════════
// SETTLEMENTS — drawn icons, no emoji in canvas
// ══════════════════════════════════════════════════════
const SETTLEMENT_DISPLAY = {
  start:      { label: 'Fort Cumberland',     x: 0.08, y: 0.73, color: '#C8932A', type: 'fort' },
  riverMill:  { label: 'River Mill Post',     x: 0.43, y: 0.53, color: '#2B6CA3', type: 'post' },
  blueRidge:  { label: 'Blue Ridge Post',     x: 0.66, y: 0.20, color: '#5C5C7A', type: 'post' },
  oakForest:  { label: 'Oak Forest Station',  x: 0.55, y: 0.74, color: '#2A5C1E', type: 'post' },
  winterPeak: { label: 'Winter Peak Camp',    x: 0.29, y: 0.19, color: '#5A9EC9', type: 'camp' },
  fortAdams:  { label: 'Frontier Fort Adams', x: 0.87, y: 0.61, color: '#8B2635', type: 'fort' }
};

function drawSettlementIcon(x, y, r, type, color, highlighted) {
  ctx.save();
  ctx.translate(x, y);
  const s = r * 0.80;

  if (type === 'fort') {
    // Wall body
    ctx.fillStyle = highlighted ? color : '#A07840';
    ctx.fillRect(-s, -s * 0.55, s * 2, s * 1.55);

    // Crenellations
    const cn = 4;
    const cw = (s * 2) / cn;
    ctx.fillStyle = highlighted ? color : '#8B6830';
    for (let i = 0; i < cn; i++) {
      if (i % 2 === 0) ctx.fillRect(-s + i * cw + cw * 0.08, -s * 0.55 - s * 0.30, cw * 0.84, s * 0.30);
    }

    // Gate arch
    ctx.fillStyle = '#3D1C02';
    ctx.beginPath();
    ctx.arc(0, s * 0.38, s * 0.27, Math.PI, 0);
    ctx.rect(-s * 0.27, s * 0.38, s * 0.54, s * 0.62);
    ctx.fill();

    // Flag pole
    ctx.fillStyle = '#3D1C02';
    ctx.fillRect(-s * 0.04, -s * 0.55 - s * 0.65, s * 0.08, s * 0.65);

    // Flag
    ctx.fillStyle = highlighted ? '#FFD060' : '#8B2635';
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.55 - s * 0.65);
    ctx.lineTo(s * 0.48, -s * 0.55 - s * 0.47);
    ctx.lineTo(0, -s * 0.55 - s * 0.28);
    ctx.closePath();
    ctx.fill();

  } else if (type === 'post') {
    // House body
    ctx.fillStyle = highlighted ? color : '#B8943A';
    ctx.fillRect(-s, 0, s * 2, s * 1.10);

    // Roof
    ctx.fillStyle = highlighted ? '#5A3020' : '#6B3A2A';
    ctx.beginPath();
    ctx.moveTo(-s * 1.18, 0);
    ctx.lineTo(0, -s * 0.92);
    ctx.lineTo(s * 1.18, 0);
    ctx.closePath();
    ctx.fill();

    // Door arch
    ctx.fillStyle = '#3D1C02';
    ctx.beginPath();
    ctx.arc(0, s * 0.72, s * 0.22, Math.PI, 0);
    ctx.rect(-s * 0.22, s * 0.72, s * 0.44, s * 0.38);
    ctx.fill();

    // Windows
    ctx.fillStyle = highlighted ? 'rgba(255,220,100,0.65)' : 'rgba(210,190,110,0.55)';
    ctx.fillRect(-s * 0.65, s * 0.14, s * 0.36, s * 0.32);
    ctx.fillRect( s * 0.28, s * 0.14, s * 0.36, s * 0.32);

  } else { // camp / tent
    // Tent body
    ctx.fillStyle = highlighted ? color : '#7AAECC';
    ctx.beginPath();
    ctx.moveTo(0, -s * 1.10);
    ctx.lineTo(-s * 1.02, s * 0.82);
    ctx.lineTo( s * 1.02, s * 0.82);
    ctx.closePath();
    ctx.fill();

    // Door flap (darker center strip)
    ctx.fillStyle = highlighted ? '#3A8AAC' : '#4A90BC';
    ctx.beginPath();
    ctx.moveTo(0, -s * 1.10);
    ctx.lineTo(-s * 0.24, s * 0.82);
    ctx.lineTo( s * 0.24, s * 0.82);
    ctx.closePath();
    ctx.fill();

    // Pole tip
    ctx.fillStyle = '#2B5A80';
    ctx.fillRect(-s * 0.04, -s * 1.28, s * 0.08, s * 0.20);

    // Snow dusting on tent
    ctx.fillStyle = 'rgba(235,248,255,0.50)';
    ctx.beginPath();
    ctx.ellipse(-s * 0.36, s * 0.10, s * 0.26, s * 0.12, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(s * 0.30, s * 0.22, s * 0.18, s * 0.09, 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawSettlements(selectedRouteId) {
  const destId = selectedRouteId ? (ROUTES[selectedRouteId] || {}).destId : null;

  for (const [id, s] of Object.entries(SETTLEMENT_DISPLAY)) {
    const [x, y]   = px(s.x, s.y);
    const isStart   = id === 'start';
    const isDest    = id === destId;
    const r         = isStart ? 18 : isDest ? 16 : 11;
    const highlight = isStart || isDest;

    ctx.save();
    if (isDest) { ctx.shadowColor = s.color; ctx.shadowBlur = 16; }

    // Backing circle
    ctx.beginPath();
    ctx.arc(x, y, r + 4, 0, Math.PI * 2);
    ctx.fillStyle   = '#F5E6C8';
    ctx.fill();
    ctx.strokeStyle = s.color;
    ctx.lineWidth   = highlight ? 3 : 2;
    ctx.stroke();
    ctx.restore();

    drawSettlementIcon(x, y, r, s.type, s.color, highlight);

    // Label
    ctx.save();
    ctx.font          = `bold ${highlight ? 12 : 10}px Georgia, serif`;
    ctx.textAlign     = 'center';
    ctx.textBaseline  = 'top';
    ctx.fillStyle     = '#F5E6C8';
    ctx.shadowColor   = '#1A0C00';
    ctx.shadowBlur    = 5;
    ctx.fillText(s.label, x, y + r + 6);
    ctx.restore();
  }
}

// ══════════════════════════════════════════════════════
// TRANSPORT SPRITE
// ══════════════════════════════════════════════════════
function drawTransport(progress, routeId) {
  const route = ROUTES[routeId];
  if (!route) return;
  const pts     = route.waypoints.map(([fx, fy]) => px(fx, fy));
  const [x, y]  = interpolateAlongPath(pts, progress);
  const next    = interpolateAlongPath(pts, Math.min(1, progress + 0.01));
  const angle   = Math.atan2(next[1] - y, next[0] - x);
  const t       = getTransport();
  const emoji   = t ? t.emoji : '🛻';

  wagonBob += 0.08 * wagonBobDir;
  if (Math.abs(wagonBob) > 2) wagonBobDir *= -1;

  ctx.save();
  ctx.translate(x, y + wagonBob);
  ctx.rotate(angle);

  // Ground shadow ellipse
  ctx.globalAlpha = 0.18;
  ctx.beginPath();
  ctx.ellipse(0, 14, 20, 6, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#000';
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.font          = '28px serif';
  ctx.textAlign     = 'center';
  ctx.textBaseline  = 'middle';
  if (angle > Math.PI / 2 || angle < -Math.PI / 2) ctx.scale(-1, 1);
  ctx.fillText(emoji, 0, 0);
  ctx.restore();

  // Dust particles
  if (Math.random() < 0.25) {
    particleList.push({
      x, y: y + 8,
      vx: (Math.random() - 0.5) * 1.5,
      vy: -Math.random() * 1.2,
      life: 1, maxLife: 30
    });
  }
}

function updateAndDrawParticles() {
  particleList = particleList.filter(p => p.life > 0);
  for (const p of particleList) {
    p.x += p.vx; p.y += p.vy;
    p.life -= 1 / p.maxLife;
    ctx.save();
    ctx.globalAlpha = p.life * 0.3;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#A08060';
    ctx.fill();
    ctx.restore();
  }
}

// ══════════════════════════════════════════════════════
// EDGE VIGNETTE
// ══════════════════════════════════════════════════════
function drawVignette() {
  ctx.save();
  const vg = ctx.createRadialGradient(
    mapW / 2, mapH / 2, mapW * 0.28,
    mapW / 2, mapH / 2, mapW * 0.82
  );
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(26,10,2,0.30)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, mapW, mapH);
  ctx.restore();
}

// ══════════════════════════════════════════════════════
// MAP BORDER
// ══════════════════════════════════════════════════════
function drawMapBorder() {
  ctx.save();
  ctx.strokeStyle = '#6B3A2A';
  ctx.lineWidth   = 4;
  ctx.strokeRect(2, 2, mapW - 4, mapH - 4);
  ctx.strokeStyle = '#C8932A';
  ctx.lineWidth   = 1.5;
  ctx.strokeRect(7, 7, mapW - 14, mapH - 14);
  drawCompass(mapW - 58, 58, 34);
  ctx.restore();
}

// ══════════════════════════════════════════════════════
// COMPASS ROSE — decorative with 8 spokes + diamond needles
// ══════════════════════════════════════════════════════
function drawCompass(cx, cy, r) {
  ctx.save();

  // Background circle with gradient
  const bg = ctx.createRadialGradient(cx, cy - r * 0.2, 0, cx, cy, r);
  bg.addColorStop(0, '#FEFAF0');
  bg.addColorStop(1, '#E8D098');
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.strokeStyle = '#6B3A2A';
  ctx.lineWidth   = 2;
  ctx.stroke();

  // Inner ring
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.62, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(107,58,42,0.20)';
  ctx.lineWidth   = 1;
  ctx.stroke();

  // 8-point spokes
  ctx.strokeStyle = 'rgba(107,58,42,0.22)';
  ctx.lineWidth   = 0.9;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * (r - 2), cy + Math.sin(a) * (r - 2));
    ctx.stroke();
  }

  // Diamond needles (N/S/E/W)
  const diamond = (angleDeg, color, length) => {
    const a = (angleDeg - 90) * Math.PI / 180;
    ctx.save();
    ctx.translate(cx, cy); ctx.rotate(a);
    ctx.beginPath();
    ctx.moveTo(0, -length);
    ctx.lineTo(length * 0.26, 0);
    ctx.lineTo(0, length * 0.38);
    ctx.lineTo(-length * 0.26, 0);
    ctx.closePath();
    ctx.fillStyle = color; ctx.fill();
    ctx.restore();
  };
  diamond(0,   '#8B2635', r * 0.70); // N — red
  diamond(180, '#B8B0A0', r * 0.58); // S — grey
  diamond(90,  '#6B3A2A', r * 0.52); // E
  diamond(270, '#6B3A2A', r * 0.52); // W

  // Center cap
  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, Math.PI * 2);
  ctx.fillStyle = '#3D1C02'; ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, 2, 0, Math.PI * 2);
  ctx.fillStyle = '#C8932A'; ctx.fill();

  // Cardinal labels
  const pad  = r + 12;
  const fSz  = Math.round(r * 0.30);
  ctx.font   = `bold ${fSz}px Georgia, serif`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  const labels = [
    ['N', cx,       cy - pad, '#8B2635'],
    ['S', cx,       cy + pad, '#666'],
    ['E', cx + pad, cy,       '#3D1C02'],
    ['W', cx - pad, cy,       '#3D1C02']
  ];
  for (const [lbl, lx, ly, col] of labels) {
    ctx.fillStyle = col;
    ctx.fillText(lbl, lx, ly);
  }
  ctx.restore();
}

// ══════════════════════════════════════════════════════
// HIT TESTING — uses original waypoints for accuracy
// ══════════════════════════════════════════════════════
function getRouteAtPoint(mx, my) {
  const threshold = 16;
  for (const [id, route] of Object.entries(ROUTES)) {
    if (!isRouteCompatible(id)) continue;
    const pts = route.waypoints.map(([fx, fy]) => px(fx, fy));
    for (let i = 0; i < pts.length - 1; i++) {
      if (distPointToSegment(mx, my, pts[i], pts[i + 1]) < threshold) return id;
    }
  }
  return null;
}

function distPointToSegment(px2, py2, [ax, ay], [bx, by]) {
  const dx = bx - ax, dy = by - ay;
  const t  = Math.max(0, Math.min(1, ((px2 - ax) * dx + (py2 - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px2 - (ax + t * dx), py2 - (ay + t * dy));
}

// ══════════════════════════════════════════════════════
// PATH INTERPOLATION
// ══════════════════════════════════════════════════════
function interpolateAlongPath(pts, t) {
  if (t <= 0) return pts[0];
  if (t >= 1) return pts[pts.length - 1];
  const segs = pts.length - 1;
  const st   = t * segs;
  const idx  = Math.min(Math.floor(st), segs - 1);
  const lt   = st - idx;
  const [ax, ay] = pts[idx], [bx, by] = pts[idx + 1];
  return [ax + (bx - ax) * lt, ay + (by - ay) * lt];
}

// ══════════════════════════════════════════════════════
// PROGRESS TRAIL
// ══════════════════════════════════════════════════════
function drawProgressBar(progress, routeId) {
  const route = ROUTES[routeId];
  if (!route) return;
  const pts  = route.waypoints.map(([fx, fy]) => px(fx, fy));
  const segs = pts.length - 1;
  const pi   = progress * segs;

  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.strokeStyle = route.color;
  ctx.lineWidth   = 6;
  ctx.lineCap     = 'round';
  ctx.beginPath();
  ctx.moveTo(...pts[0]);
  for (let i = 0; i < segs; i++) {
    if (i + 1 <= pi) {
      ctx.lineTo(...pts[i + 1]);
    } else if (i < pi) {
      const lt = pi - i;
      const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
      ctx.lineTo(ax + (bx - ax) * lt, ay + (by - ay) * lt);
      break;
    } else break;
  }
  ctx.stroke();
  ctx.restore();
}

// ══════════════════════════════════════════════════════
// MASTER DRAW
// ══════════════════════════════════════════════════════
function drawMap(opts = {}) {
  if (!ctx) return;
  const { selectedRoute, hoveredRoute, simProgress } = opts;

  drawParchment();
  drawTerrainFeatures();
  drawRoutes(selectedRoute, hoveredRoute);
  drawWaypointDots(selectedRoute);
  if (simProgress != null && selectedRoute) drawProgressBar(simProgress, selectedRoute);
  drawSettlements(selectedRoute);
  if (simProgress != null && selectedRoute) drawTransport(simProgress, selectedRoute);
  updateAndDrawParticles();
  drawVignette();
  drawMapBorder();
}
