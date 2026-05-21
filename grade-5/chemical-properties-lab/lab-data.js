/* ── Chemical Properties Lab — Core Logic & Shared Assets ── */

// 1. Core Data
const SUBST = {
  iron: {
    name:'Iron Nail',    icon:'🔩', color:'#7a7a7a', lc:'#b0b0b0',
    flame:1, flameResult:'none',
    flameNote:'Iron does not catch fire under normal heat.',
    rusts:true, tarnishes:false, rustColor:'#b5651d',
    rustNote:'Forms orange-brown rust (iron oxide) when exposed to oxygen and water.',
    tox:1, toxLabel:'Low',
    toxNote:'Generally safe to handle. Rust dust can irritate the lungs.',
    react:2, reactBubbles:'few',
    reactNote:'Slowly reacts with acid — a few hydrogen gas bubbles are released.',
    ph:7, phLabel:'Neutral',
    phNote:'Iron does not dissolve in or change the pH of water.'
  },
  wood: {
    name:'Wood Chip',   icon:'🪵', color:'#8B5E3C', lc:'#C18A5E',
    flame:5, flameResult:'burns',
    flameNote:'Wood catches fire easily and burns quickly.',
    rusts:false, tarnishes:false,
    rustNote:'Wood does not rust — only metals oxidize. Wet wood can rot over time.',
    tox:1, toxLabel:'Low',
    toxNote:'Generally safe. Treated lumber can contain chemicals — never burn treated wood indoors.',
    react:1, reactBubbles:'none',
    reactNote:'Wood does not react with vinegar or common lab acids.',
    ph:6, phLabel:'Slightly Acidic',
    phNote:'Wood contains natural acids. A water extract tests at pH ~5–6.'
  },
  vinegar: {
    name:'Vinegar',     icon:'🧪', color:'#c8a04a', lc:'#e8c870',
    isLiquid:true,
    flame:2, flameResult:'steam',
    flameNote:'Vinegar is dilute acetic acid — it does not catch fire easily.',
    rusts:false, tarnishes:false,
    rustNote:'Vinegar actually dissolves rust — it is used to clean rusty metals!',
    tox:1, toxLabel:'Low',
    toxNote:'Safe in food amounts. Can irritate eyes and skin if concentrated.',
    react:4, reactBubbles:'lots',
    reactNote:'Vinegar IS an acid — it reacts vigorously with bases like baking soda.',
    ph:3, phLabel:'Acidic',
    phNote:'Vinegar (acetic acid) has a pH around 2–3 — strongly acidic.'
  },
  bakingsoda: {
    name:'Baking Soda', icon:'🥄', color:'#d0ccc0', lc:'#f0eee8',
    flame:1, flameResult:'none',
    flameNote:'Baking soda does not burn — it releases CO₂ and is used in fire extinguishers!',
    rusts:false, tarnishes:false,
    rustNote:'Baking soda does not rust. It is actually used to remove rust and tarnish.',
    tox:0, toxLabel:'None',
    toxNote:'Completely food-safe and non-toxic — used in baking and medicine.',
    react:5, reactBubbles:'extreme',
    reactNote:'Extremely reactive with acid! Produces a dramatic rush of CO₂ bubbles.',
    ph:9, phLabel:'Basic',
    phNote:'Baking soda dissolved in water is basic — pH around 8–9.'
  },
  copper: {
    name:'Copper Coin', icon:'🪙', color:'#c47b3c', lc:'#e8a060',
    flame:1, flameResult:'none',
    flameNote:'Copper does not burn, but glows orange-red when heated.',
    rusts:false, tarnishes:true, rustColor:'#5a8a5a',
    rustNote:'Copper does not rust, but forms a green coating called patina (verdigris).',
    tox:2, toxLabel:'Moderate',
    toxNote:'Large amounts of copper are toxic. Do not swallow coins or copper dust.',
    react:2, reactBubbles:'few',
    reactNote:'Copper slowly reacts with acid — surface becomes dull and slightly green.',
    ph:7, phLabel:'Neutral',
    phNote:'Copper does not change the pH of water under normal conditions.'
  },
  bleach: {
    name:'Bleach',      icon:'🧴', color:'#d0eeff', lc:'#f0faff',
    isLiquid:true,
    flame:1, flameResult:'none',
    flameNote:'Household bleach does not burn, but releases toxic gases when heated.',
    rusts:false, tarnishes:false,
    rustNote:'Bleach can corrode metals and damage surfaces — it is highly reactive.',
    tox:4, toxLabel:'High',
    toxNote:'DANGEROUS — bleach is corrosive. Never mix with ammonia or acids. Always wear gloves.',
    react:3, reactBubbles:'moderate',
    reactNote:'Bleach is a strong base — reacts with acids, potentially releasing harmful gases.',
    ph:12, phLabel:'Very Basic',
    phNote:'Bleach has a pH of 11–13 — strongly alkaline/basic.'
  },
  lemon: {
    name:'Lemon Juice',  icon:'🍋', color:'#f5e642', lc:'#fff5a0',
    isLiquid:true,
    flame:1, flameResult:'none',
    flameNote:'Lemon juice does not catch fire under normal conditions.',
    rusts:false, tarnishes:false,
    rustNote:'Lemon juice (citric acid) dissolves rust and is used as a natural cleaning agent.',
    tox:0, toxLabel:'None',
    toxNote:'Completely safe to eat! Its sour taste comes from citric acid.',
    react:3, reactBubbles:'moderate',
    reactNote:'Lemon juice reacts with baking soda and tarnished metals.',
    ph:2, phLabel:'Very Acidic',
    phNote:'Lemon juice has a pH around 2 — one of the most acidic common liquids.'
  },
  sugar: {
    name:'Sugar',       icon:'🍬', color:'#f0c060', lc:'#ffe090',
    flame:3, flameResult:'chars',
    flameNote:'Sugar does not burst into flame, but caramelizes and chars when heated.',
    rusts:false, tarnishes:false,
    rustNote:'Sugar does not rust or oxidize under normal conditions.',
    tox:0, toxLabel:'None',
    toxNote:'Food-safe and non-toxic, though not healthy in large quantities.',
    react:1, reactBubbles:'none',
    reactNote:'Sugar does not react with vinegar or common acid/base substances.',
    ph:7, phLabel:'Neutral',
    phNote:'Sugar dissolved in water stays neutral — pH remains at 7.'
  },
};

const STATIONS = [
  { num:1, title:'Flammability Test', icon:'🔥', short:'Flammability' },
  { num:2, title:'Oxidation Test',    icon:'🟤', short:'Oxidation'    },
  { num:3, title:'Toxicity Check',    icon:'⚠️', short:'Toxicity'     },
  { num:4, title:'Reactivity Test',   icon:'⚗️', short:'Reactivity'   },
  { num:5, title:'Acidity (pH) Test', icon:'🌡️', short:'Acidity/pH'   },
];

const CHALLENGES = [
  { id:'plumbing', title:'Outdoor Pipes',      icon:'🔧',
    desc:'Which substance would be safest for outdoor water pipes? It must resist oxidation and be low toxicity.',
    best:['copper','wood'],
    hint:'Check the oxidation test. Materials that do not rust or corrode work best for pipes.' },
  { id:'cooking',  title:'Safe Food Container', icon:'🍳',
    desc:'Which substance is safest to store food in? It must be non-toxic and not react with food acids.',
    best:['sugar','bakingsoda'],
    hint:'Check toxicity (0 = None is best) and reactivity. A non-reactive, non-toxic substance is safest.' },
  { id:'volcano',  title:'Volcano Experiment',  icon:'🌋',
    desc:'Which substance creates the biggest reaction when mixed with vinegar (an acid)?',
    best:['bakingsoda'],
    hint:'Check your reactivity test. Which substance caused the most extreme fizzing and bubbling?' },
  { id:'safety',   title:'Safest Lab Substance', icon:'🏅',
    desc:'Which substance is the safest to work with in a school lab? Lowest toxicity and lowest flammability wins!',
    best:['bakingsoda','lemon','sugar'],
    hint:'Check the toxicity rating. Substances rated 0 (None) are completely safe for school labs.' },
];

// 2. LocalStorage State Management
const LAB_KEY = 'cpl_state';

function getState() {
  try { return JSON.parse(localStorage.getItem(LAB_KEY)) || {}; }
  catch(e) { return {}; }
}
function setState(patch) {
  const s = getState();
  Object.assign(s, patch);
  localStorage.setItem(LAB_KEY, JSON.stringify(s));
}

function getSubstId()   { return getState().substId || null; }
function getSubst()     { const id = getSubstId(); return id ? SUBST[id] : null; }
function getCompleted() { return getState().completed || []; }

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

// 3. Shared UI Functions
function renderProgress(currentStation) {
  const completed = getCompleted();
  const sb = getSubst();

  const progShell = document.getElementById('progShell');
  if (progShell && sb) {
    progShell.innerHTML = `
      <div class="prog-row">
        <div class="dots">${STATIONS.map(s =>
          `<div class="dot ${completed.includes(s.num)?'done':s.num===currentStation?'active':''}"></div>`
        ).join('')}</div>
        <span class="prog-text">Station ${currentStation} of 5 &middot; ${completed.length}/5 recorded</span>
      </div>
      <div class="mat-badge">${sb.icon} ${sb.name}</div>`;
  }

  const sNav = document.getElementById('sNav');
  if (sNav) {
    sNav.innerHTML = STATIONS.map(s =>
      `<a href="station-${s.num}.html" class="s-pill ${s.num===currentStation?'active':''} ${completed.includes(s.num)&&s.num!==currentStation?'done':''}">${s.icon} ${s.short}</a>`
    ).join('');
  }
}

// 4. SVG Assets & Loader
const SVG_STRINGS = {
  beaker: `
    <svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" viewBox="0 0 140 140">
      <path d="M20,10 L20,130 C20,135 25,140 30,140 L110,140 C115,140 120,135 120,130 L120,10" fill="rgba(255,255,255,0.2)" stroke="#8aa2b5" stroke-width="5" stroke-linecap="round"/>
      <path d="M120,10 L130,2" fill="none" stroke="#8aa2b5" stroke-width="5" stroke-linecap="round"/>
      <line x1="20" y1="40" x2="35" y2="40" stroke="#8aa2b5" stroke-width="3"/>
      <line x1="20" y1="70" x2="35" y2="70" stroke="#8aa2b5" stroke-width="3"/>
      <line x1="20" y1="100" x2="35" y2="100" stroke="#8aa2b5" stroke-width="3"/>
      <path d="M28,25 L28,120" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="4" stroke-linecap="round"/>
    </svg>`,
  bunsen: `
    <svg xmlns="http://www.w3.org/2000/svg" width="60" height="80" viewBox="0 0 60 80">
      <rect x="5" y="65" width="50" height="10" rx="4" fill="#4a5568"/>
      <polygon points="15,65 25,50 35,50 45,65" fill="#718096"/>
      <rect x="22" y="10" width="16" height="40" fill="#a0aec0"/>
      <rect x="19" y="5" width="22" height="6" rx="2" fill="#cbd5e0"/>
      <circle cx="22" cy="45" r="5" fill="#e53e3e"/>
    </svg>`
};

const ASSETS = {};

function loadAssets(onComplete) {
  const keys = Object.keys(SVG_STRINGS);
  if (!keys.length) {
    if (onComplete) onComplete();
    return;
  }

  let remaining = keys.length;
  const finishOne = () => {
    remaining--;
    if (remaining === 0 && onComplete) onComplete();
  };

  keys.forEach(key => {
    if (ASSETS[key]) {
      finishOne();
      return;
    }

    const img = new Image();
    const svgBase64 = btoa(SVG_STRINGS[key]);
    img.onload = () => {
      ASSETS[key] = img;
      finishOne();
    };
    img.onerror = finishOne;
    img.src = `data:image/svg+xml;base64,${svgBase64}`;
  });
}

// 5. Shared Lab Environment (Canvas Background)
function drawSharedLabBackground(ctx, w, h) {
  ctx.fillStyle = '#1c212b';
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 1;
  for (let i = 0; i < w; i += 25) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h - 50); ctx.stroke();
  }
  for (let i = 0; i < h - 50; i += 25) {
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke();
  }

  const spotlight = ctx.createRadialGradient(w / 2, h / 2 - 20, 10, w / 2, h / 2 - 20, w * 0.7);
  spotlight.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
  spotlight.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
  ctx.fillStyle = spotlight;
  ctx.fillRect(0, 0, w, h);

  const benchY = h - 50;
  const benchGradient = ctx.createLinearGradient(0, benchY, 0, h);
  benchGradient.addColorStop(0, '#3a414d');
  benchGradient.addColorStop(0.05, '#21252b');
  benchGradient.addColorStop(1, '#0d0f12');

  ctx.fillStyle = benchGradient;
  ctx.fillRect(0, benchY, w, h - benchY);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.fillRect(0, benchY, w, 2);

  const wallShadow = ctx.createLinearGradient(0, benchY, 0, benchY + 15);
  wallShadow.addColorStop(0, 'rgba(0, 0, 0, 0.5)');
  wallShadow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = wallShadow;
  ctx.fillRect(0, benchY, w, 15);
}
