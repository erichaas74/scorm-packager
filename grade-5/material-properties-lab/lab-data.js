/* ── Material Properties Lab — shared data, state, and drawing helpers ── */

const MAT = {
  wood:   { name:'Wood',         icon:'🪵', color:'#8B5E3C', lc:'#C18A5E', texture:'wood',    finish:'matte',
            wp:3, wr:'partly',   mag:false, ms:'none',
            fl:2, fr:'cracks',   str:4, mw:8,
            tr:'opaque',         flt:true,  fb:'floats',
            mass:15, vol:20 },
  plastic:{ name:'Plastic',      icon:'🥤', color:'#1E5FBB', lc:'#5B9BEE', texture:'plastic', finish:'glossy',
            wp:5, wr:'beads',    mag:false, ms:'none',
            fl:3, fr:'bends-r',  str:3, mw:5,
            tr:'translucent',    flt:true,  fb:'floats',
            mass:6,  vol:10 },
  metal:  { name:'Metal (Steel)',icon:'⚙️', color:'#5A6872', lc:'#9BB0BF', texture:'metal',   finish:'shiny',
            wp:5, wr:'beads',    mag:true,  ms:'strong',
            fl:1, fr:'bends-s',  str:5, mw:15,
            tr:'opaque',         flt:false, fb:'sinks',
            mass:80, vol:10 },
  rubber: { name:'Rubber',       icon:'⚫', color:'#222',    lc:'#555',    texture:'rubber',  finish:'matte',
            wp:5, wr:'beads',    mag:false, ms:'none',
            fl:5, fr:'bends-r',  str:2, mw:3,
            tr:'opaque',         flt:true,  fb:'floats',
            mass:20, vol:20 },
  fabric: { name:'Fabric',       icon:'🧵', color:'#8B22B8', lc:'#C870F5', texture:'fabric',  finish:'soft',
            wp:2, wr:'soaks',    mag:false, ms:'none',
            fl:5, fr:'bends-r',  str:2, mw:2,
            tr:'opaque',         flt:true,  fb:'floats-then-sinks',
            mass:12, vol:20 },
  paper:  { name:'Paper',        icon:'📄', color:'#C8A87A', lc:'#EDD9AA', texture:'paper',   finish:'matte',
            wp:1, wr:'soaks',    mag:false, ms:'none',
            fl:3, fr:'bends-r',  str:1, mw:1,
            tr:'translucent',    flt:true,  fb:'floats-then-sinks',
            mass:5,  vol:10 },
  foam:   { name:'Foam',         icon:'☁️', color:'#6BB8DC', lc:'#C8ECFF', texture:'foam',    finish:'soft',
            wp:3, wr:'partly',   mag:false, ms:'none',
            fl:4, fr:'bends-r',  str:1, mw:1,
            tr:'opaque',         flt:true,  fb:'floats',
            mass:5,  vol:50 },
  alfoil: { name:'Alum. Foil',   icon:'✨', color:'#A0A8B0', lc:'#D8DDE2', texture:'foil',    finish:'shiny',
            wp:4, wr:'beads',    mag:false, ms:'none',
            fl:5, fr:'bends-s',  str:1, mw:1,
            tr:'opaque',         flt:false, fb:'sinks',
            mass:27, vol:10 },
};

const STATIONS = [
  { num:1, title:'Waterproof Test',   icon:'💧', short:'Waterproof'   },
  { num:2, title:'Magnetism Test',    icon:'🧲', short:'Magnetism'    },
  { num:3, title:'Flex & Strength',   icon:'💪', short:'Flex/Strength'},
  { num:4, title:'Transparency Test', icon:'💡', short:'Transparency' },
  { num:5, title:'Buoyancy Test',     icon:'🌊', short:'Buoyancy'     },
  { num:6, title:'Density Test',      icon:'⚖️', short:'Density'      },
];

const CHALLENGES = [
  { id:'raincoat', title:'Raincoat',    icon:'🌧️',
    desc:'Which material would keep you driest in the rain? You need something that repels water.',
    best:['rubber','plastic','alfoil','metal'],
    hint:'Look at your waterproof rating (1–5). Materials rated 4–5 bead water off the surface.' },
  { id:'boat',     title:'Toy Boat',    icon:'⛵',
    desc:'Which material is best to build a floating toy boat? It must not sink!',
    best:['foam','wood','plastic','rubber'],
    hint:'Check your buoyancy results and density. Materials with density < 1 g/cm³ float in water.' },
  { id:'window',   title:'Window Pane', icon:'🪟',
    desc:'Which material would let the most light through, like a window?',
    best:['plastic'],
    hint:'Check your transparency test. Transparent materials let you see objects clearly through them.' },
  { id:'bridge',   title:'Bridge',      icon:'🌉',
    desc:'Which material could hold the most weight on a bridge?',
    best:['metal','wood'],
    hint:'Look at your strength rating. Higher ratings mean the material held more weight before failing.' },
];

/* ── LocalStorage state ── */
const LAB_KEY = 'mpl_state';

function getState() {
  try { return JSON.parse(localStorage.getItem(LAB_KEY)) || {}; }
  catch(e) { return {}; }
}
function setState(patch) {
  const s = getState();
  Object.assign(s, patch);
  localStorage.setItem(LAB_KEY, JSON.stringify(s));
}

function getMatId()      { return getState().matId || null; }
function getMat()        { const id = getMatId(); return id ? MAT[id] : null; }
function getCompleted()  { return getState().completed || []; }

function getStationData(n) {
  return ((getState().notes || {})[`s${n}`]) || {};
}
function saveStationNote(n, data) {
  const s = getState();
  const notes = s.notes || {};
  notes[`s${n}`] = Object.assign({}, notes[`s${n}`] || {}, data);
  setState({ notes });
}
function markComplete(n) {
  const s = getState();
  const completed = s.completed || [];
  if (!completed.includes(n)) completed.push(n);
  setState({ completed });
}

/* ── Shared rating helper ── */
function setRating(stationNum, key, val, container) {
  saveStationNote(stationNum, { [key]: val });
  container.querySelectorAll('.rb').forEach((b, i) => b.classList.toggle('sel', i + 1 === val));
}

/* ── Shared animation helpers ── */
function clamp01(v) { return Math.max(0, Math.min(1, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }
function easeOutCubic(t) { return 1 - Math.pow(1 - clamp01(t), 3); }
function easeInOutSine(t) { return -(Math.cos(Math.PI * clamp01(t)) - 1) / 2; }

function seededRand(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}
function matSeed(mat) {
  const str = mat && mat.name ? mat.name : 'material';
  let total = 0;
  for (let i = 0; i < str.length; i++) total += str.charCodeAt(i) * (i + 1);
  return total;
}
function rr(ctx, x, y, w, h, r = 10) {
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
  else {
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
}
function drawSoftShadow(ctx, x, y, w, h, blur = 16, alpha = 0.18) {
  ctx.save();
  ctx.shadowColor = `rgba(0,0,0,${alpha})`;
  ctx.shadowBlur = blur;
  ctx.shadowOffsetY = 7;
  ctx.fillStyle = 'rgba(0,0,0,0.01)';
  rr(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.restore();
}

/* ── Shared polished lab background ── */
function drawLabBench(ctx, W, H, label = 'Lab Station') {
  const wall = ctx.createLinearGradient(0, 0, 0, H);
  wall.addColorStop(0, '#fbfdff');
  wall.addColorStop(0.58, '#e7f3fb');
  wall.addColorStop(1, '#d9e9f4');
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, W, H);

  // Soft vignette.
  const vignette = ctx.createRadialGradient(W * 0.5, H * 0.35, 20, W * 0.5, H * 0.35, W * 0.75);
  vignette.addColorStop(0, 'rgba(255,255,255,0.42)');
  vignette.addColorStop(1, 'rgba(46,89,120,0.10)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);

  // Pegboard dots.
  ctx.fillStyle = 'rgba(67,112,142,0.10)';
  for (let yy = 20; yy < H - 94; yy += 17) {
    for (let xx = 20; xx < W - 16; xx += 17) {
      ctx.beginPath();
      ctx.arc(xx, yy, 1.15, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Bench edge and top.
  ctx.strokeStyle = 'rgba(70,100,120,0.20)';
  ctx.beginPath();
  ctx.moveTo(0, H - 80);
  ctx.lineTo(W, H - 80);
  ctx.stroke();

  const bench = ctx.createLinearGradient(0, H - 80, 0, H);
  bench.addColorStop(0, '#d8ba94');
  bench.addColorStop(1, '#b99069');
  ctx.fillStyle = bench;
  ctx.fillRect(0, H - 80, W, 80);

  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  ctx.fillRect(0, H - 80, W, 8);
  ctx.strokeStyle = 'rgba(103,69,37,0.12)';
  for (let x = 0; x < W; x += 52) {
    ctx.beginPath();
    ctx.moveTo(x, H - 80);
    ctx.lineTo(x + 18, H);
    ctx.stroke();
  }

  // Small station sticker.
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.86)';
  ctx.strokeStyle = 'rgba(44,110,145,0.14)';
  rr(ctx, 10, 10, Math.max(94, label.length * 7.4), 24, 12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#45677d';
  ctx.font = 'bold 11px Instrument Sans, system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 20, 22);
  ctx.restore();
}

/* ── Shared material sample renderer ── */
function drawMaterialSample(ctx, x, y, w, h, mat, options = {}) {
  if (!mat) return;
  const radius = options.radius ?? 10;
  const showLabel = options.showLabel ?? true;
  const seed = matSeed(mat);

  drawSoftShadow(ctx, x, y, w, h, options.shadowBlur ?? 14, options.shadowAlpha ?? 0.18);

  ctx.save();
  const grad = ctx.createLinearGradient(x, y, x + w, y + h);
  grad.addColorStop(0, mat.lc || mat.color);
  grad.addColorStop(0.48, mat.color);
  grad.addColorStop(1, mat.color);
  ctx.fillStyle = grad;
  rr(ctx, x, y, w, h, radius);
  ctx.fill();

  rr(ctx, x, y, w, h, radius);
  ctx.clip();

  switch (mat.texture) {
    case 'wood': {
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(73,43,22,0.20)';
      for (let i = 0; i < 7; i++) {
        const yy = y + 8 + i * h / 7;
        ctx.beginPath();
        ctx.moveTo(x + 6, yy);
        ctx.bezierCurveTo(x + w * 0.32, yy - 6, x + w * 0.62, yy + 6, x + w - 6, yy - 2);
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(50,28,14,0.25)';
      for (let i = 0; i < 2; i++) {
        const kx = x + w * (0.28 + i * 0.37);
        const ky = y + h * (0.34 + seededRand(seed + i) * 0.28);
        ctx.beginPath();
        ctx.ellipse(kx, ky, 15, 7, 0.2, 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    }
    case 'metal': {
      for (let i = 0; i < 5; i++) {
        const sx = x - w * 0.2 + i * w * 0.29;
        ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.18)' : 'rgba(40,50,60,0.10)';
        ctx.beginPath();
        ctx.moveTo(sx, y);
        ctx.lineTo(sx + w * 0.12, y);
        ctx.lineTo(sx + w * 0.02, y + h);
        ctx.lineTo(sx - w * 0.10, y + h);
        ctx.closePath();
        ctx.fill();
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(x + 8, y + 7 + i * h / 6);
        ctx.lineTo(x + w - 8, y + 5 + i * h / 6);
        ctx.stroke();
      }
      break;
    }
    case 'rubber': {
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(x, y, w, h);
      for (let i = 0; i < 80; i++) {
        const px = x + seededRand(seed + i * 2.1) * w;
        const py = y + seededRand(seed + i * 3.7) * h;
        ctx.fillStyle = i % 2 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.09)';
        ctx.fillRect(px, py, 1.8, 1.8);
      }
      break;
    }
    case 'fabric': {
      ctx.strokeStyle = 'rgba(255,255,255,0.16)';
      ctx.lineWidth = 1;
      for (let xx = x - h; xx < x + w + h; xx += 11) {
        ctx.beginPath();
        ctx.moveTo(xx, y);
        ctx.lineTo(xx + h, y + h);
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(45,15,80,0.13)';
      for (let xx = x; xx < x + w; xx += 9) {
        ctx.beginPath(); ctx.moveTo(xx, y); ctx.lineTo(xx, y + h); ctx.stroke();
      }
      for (let yy = y; yy < y + h; yy += 9) {
        ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + w, yy); ctx.stroke();
      }
      break;
    }
    case 'paper': {
      ctx.fillStyle = 'rgba(255,255,255,0.16)';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = 'rgba(117,88,48,0.12)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 48; i++) {
        const px = x + seededRand(seed + i * 5.4) * w;
        const py = y + seededRand(seed + i * 8.1) * h;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + 4 + seededRand(seed + i) * 8, py + seededRand(seed + i * 2) * 2 - 1);
        ctx.stroke();
      }
      break;
    }
    case 'foam': {
      ctx.fillStyle = 'rgba(255,255,255,0.16)';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = 'rgba(255,255,255,0.36)';
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 26; i++) {
        const px = x + 8 + seededRand(seed + i * 2.2) * (w - 16);
        const py = y + 8 + seededRand(seed + i * 4.4) * (h - 16);
        const r = 2.5 + seededRand(seed + i * 6.6) * 5;
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    }
    case 'foil': {
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = 'rgba(255,255,255,0.28)';
      ctx.lineWidth = 1.4;
      for (let i = 0; i < 12; i++) {
        const x1 = x + seededRand(seed + i * 3.2) * w;
        const y1 = y + seededRand(seed + i * 8.6) * h;
        const x2 = x + seededRand(seed + i * 5.1) * w;
        const y2 = y + seededRand(seed + i * 10.2) * h;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(60,70,85,0.18)';
      for (let i = 0; i < 7; i++) {
        ctx.beginPath();
        ctx.moveTo(x + i * w / 7, y);
        ctx.lineTo(x + w - i * w / 12, y + h);
        ctx.stroke();
      }
      break;
    }
    case 'plastic':
    default: {
      ctx.fillStyle = 'rgba(255,255,255,0.09)';
      ctx.beginPath();
      ctx.ellipse(x + w * 0.28, y + h * 0.32, w * 0.18, h * 0.22, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(x + 12, y + 12 + i * 14);
        ctx.lineTo(x + w - 12, y + 18 + i * 12);
        ctx.stroke();
      }
      break;
    }
  }

  if (mat.finish === 'glossy' || mat.finish === 'shiny') {
    const shine = ctx.createLinearGradient(x, y, x + w, y + h);
    shine.addColorStop(0, 'rgba(255,255,255,0.35)');
    shine.addColorStop(0.16, 'rgba(255,255,255,0.05)');
    shine.addColorStop(0.55, 'rgba(255,255,255,0.00)');
    shine.addColorStop(1, 'rgba(255,255,255,0.20)');
    ctx.fillStyle = shine;
    ctx.fillRect(x, y, w, h);
  } else if (mat.finish === 'soft') {
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(x, y, w, h * 0.45);
  }

  ctx.restore();

  ctx.save();
  ctx.strokeStyle = 'rgba(40,64,82,0.20)';
  ctx.lineWidth = 1.5;
  rr(ctx, x, y, w, h, radius);
  ctx.stroke();

  if (showLabel) {
    ctx.fillStyle = options.labelColor || 'rgba(255,255,255,0.88)';
    ctx.font = 'bold 12px Instrument Sans, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(mat.name, x + w / 2, y + h / 2);
  }
  ctx.restore();
}

/* ── Render progress shell + station nav ── */
function renderProgress(currentStation) {
  const completed = getCompleted();
  const m = getMat();

  const progShell = document.getElementById('progShell');
  if (progShell && m) {
    progShell.innerHTML = `
      <div class="prog-row">
        <div class="dots">${STATIONS.map(s =>
          `<div class="dot ${completed.includes(s.num)?'done':s.num===currentStation?'active':''}"></div>`
        ).join('')}</div>
        <span class="prog-text">Station ${currentStation} of 6 &middot; ${completed.length}/6 recorded</span>
      </div>
      <div class="mat-badge">${m.icon} ${m.name}</div>`;
  }

  const sNav = document.getElementById('sNav');
  if (sNav) {
    sNav.innerHTML = STATIONS.map(s =>
      `<a href="station-${s.num}.html" class="s-pill ${s.num===currentStation?'active':''} ${completed.includes(s.num)&&s.num!==currentStation?'done':''}">${s.icon} ${s.short}</a>`
    ).join('');
  }
}
