/* ── Material Properties Lab — shared data & state ── */

const MAT = {
  wood:   { name:'Wood',         icon:'🪵', color:'#8B5E3C', lc:'#C18A5E',
            wp:3, wr:'partly',   mag:false, ms:'none',
            fl:2, fr:'cracks',   str:4, mw:8,
            tr:'opaque',         flt:true,  fb:'floats',
            mass:15, vol:20 },
  plastic:{ name:'Plastic',      icon:'🥤', color:'#1E5FBB', lc:'#5B9BEE',
            wp:5, wr:'beads',    mag:false, ms:'none',
            fl:3, fr:'bends-r',  str:3, mw:5,
            tr:'translucent',    flt:true,  fb:'floats',
            mass:6,  vol:10 },
  metal:  { name:'Metal (Steel)',icon:'⚙️', color:'#5A6872', lc:'#9BB0BF',
            wp:5, wr:'beads',    mag:true,  ms:'strong',
            fl:1, fr:'bends-s',  str:5, mw:15,
            tr:'opaque',         flt:false, fb:'sinks',
            mass:80, vol:10 },
  rubber: { name:'Rubber',       icon:'⚫', color:'#222',    lc:'#555',
            wp:5, wr:'beads',    mag:false, ms:'none',
            fl:5, fr:'bends-r',  str:2, mw:3,
            tr:'opaque',         flt:true,  fb:'floats',
            mass:20, vol:20 },
  fabric: { name:'Fabric',       icon:'🧵', color:'#8B22B8', lc:'#C870F5',
            wp:2, wr:'soaks',    mag:false, ms:'none',
            fl:5, fr:'bends-r',  str:2, mw:2,
            tr:'opaque',         flt:true,  fb:'floats-then-sinks',
            mass:12, vol:20 },
  paper:  { name:'Paper',        icon:'📄', color:'#C8A87A', lc:'#EDD9AA',
            wp:1, wr:'soaks',    mag:false, ms:'none',
            fl:3, fr:'bends-r',  str:1, mw:1,
            tr:'translucent',    flt:true,  fb:'floats-then-sinks',
            mass:5,  vol:10 },
  foam:   { name:'Foam',         icon:'☁️', color:'#6BB8DC', lc:'#C8ECFF',
            wp:3, wr:'partly',   mag:false, ms:'none',
            fl:4, fr:'bends-r',  str:1, mw:1,
            tr:'opaque',         flt:true,  fb:'floats',
            mass:5,  vol:50 },
  alfoil: { name:'Alum. Foil',   icon:'✨', color:'#A0A8B0', lc:'#D8DDE2',
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
