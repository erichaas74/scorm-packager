/* ── Chemical Properties Lab — shared data & state ── */

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

/* ── LocalStorage state ── */
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

/* ── Render progress shell + station nav ── */
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
