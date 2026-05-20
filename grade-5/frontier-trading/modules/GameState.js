/* ================================================================
   Frontier Trading Company — GameState
   Central state store and data definitions
   ================================================================ */

// ── Transport Definitions ──
const TRANSPORTS = {
  wagon: {
    id: 'wagon', name: 'Covered Wagon', emoji: '🛻',
    capacity: 220, speed: 0.75, repairCost: 18,
    startCost: 40, color: '#8B4513',
    routes: ['mountain', 'forest', 'plains'],
    desc: 'Reliable and roomy. Struggles on river and winter routes.',
    pros: 'High capacity, works most routes', cons: 'Slow, expensive repairs'
  },
  canoe: {
    id: 'canoe', name: 'River Canoe', emoji: '🛶',
    capacity: 130, speed: 1.4, repairCost: 10,
    startCost: 25, color: '#2B6CA3',
    routes: ['river'],
    desc: 'Lightning-fast on rivers. River routes only.',
    pros: 'Very fast, cheap repairs', cons: 'Low capacity, river only'
  },
  mule: {
    id: 'mule', name: 'Mule Caravan', emoji: '🫏',
    capacity: 300, speed: 0.55, repairCost: 22,
    startCost: 55, color: '#6B4E32',
    routes: ['mountain', 'forest', 'plains', 'river', 'winter'],
    desc: 'Goes anywhere, carries everything. Painfully slow.',
    pros: 'Highest capacity, all routes', cons: 'Very slow, highest cost'
  },
  raft: {
    id: 'raft', name: 'River Raft', emoji: '🪵',
    capacity: 280, speed: 0.95, repairCost: 8,
    startCost: 30, color: '#5C8A3A',
    routes: ['river'],
    desc: 'Huge cargo on rivers, cheap to fix. River routes only.',
    pros: 'High capacity, cheap repairs', cons: 'River only, fragile in rapids'
  }
};

// ── Goods Definitions ──
const GOODS = [
  { id:'flour',    name:'Flour',          icon:'🌾', weight:10, buyPrice:2.50,  baseSell:4.25,  demand:'high',   maxQty:20, desc:'Essential frontier staple' },
  { id:'tools',    name:'Tools',          icon:'⚒️',  weight:8,  buyPrice:5.00,  baseSell:9.00,  demand:'medium', maxQty:15, desc:'Axes, hammers, and saws' },
  { id:'lanterns', name:'Lanterns',       icon:'🏮', weight:3,  buyPrice:3.50,  baseSell:6.50,  demand:'low',    maxQty:20, desc:'Oil lanterns for dark cabins' },
  { id:'cloth',    name:'Cloth Bolts',    icon:'🧵', weight:5,  buyPrice:4.00,  baseSell:7.50,  demand:'medium', maxQty:18, desc:'Wool and cotton fabric' },
  { id:'medicine', name:'Medicine',       icon:'⚗️',  weight:2,  buyPrice:8.00,  baseSell:16.00, demand:'high',   maxQty:10, desc:'Tinctures and tonics' },
  { id:'fur',      name:'Fur Pelts',      icon:'🦫', weight:7,  buyPrice:6.00,  baseSell:11.00, demand:'medium', maxQty:12, desc:'Beaver and fox pelts' },
  { id:'salt',     name:'Salt',           icon:'🧂', weight:12, buyPrice:1.50,  baseSell:3.25,  demand:'high',   maxQty:25, desc:'Preserves food for winter' },
  { id:'rope',     name:'Rope',           icon:'🪢', weight:6,  buyPrice:2.00,  baseSell:4.75,  demand:'medium', maxQty:20, desc:'Hemp rope by the coil' },
  { id:'hardwood', name:'Hardwood',       icon:'🪵', weight:15, buyPrice:1.00,  baseSell:2.75,  demand:'low',    maxQty:15, desc:'Milled planks for building' },
  { id:'spices',   name:'Spices',         icon:'🌶️', weight:2,  buyPrice:7.00,  baseSell:13.00, demand:'medium', maxQty:12, desc:'Pepper, cinnamon, and ginger' }
];

// ── Route Definitions ──
const ROUTES = {
  river: {
    id:'river', name:'River Trade Route', shortName:'River Route',
    destination:'River Mill Trading Post', destId:'riverMill',
    distance:120, days:8, risk:'low', terrain:'river', riskPct:0.12,
    color:'#2B6CA3', colorLight:'rgba(43,108,163,0.25)',
    desc:'Follow the river north to River Mill. Low risk, steady trade.',
    demandBonus:{ flour:1.25, salt:1.30, medicine:1.10, rope:1.20 },
    transportBonus:{ canoe:0.85, raft:0.88 },
    waypoints:[[0.08,0.73],[0.14,0.67],[0.21,0.61],[0.29,0.57],[0.37,0.55],[0.43,0.53]],
    terrainLabel:'Flat river valley — easy going',
    riskLabel:'Low risk'
  },
  mountain: {
    id:'mountain', name:'Mountain Trail', shortName:'Mountain Trail',
    destination:'Blue Ridge Mountain Post', destId:'blueRidge',
    distance:90, days:10, risk:'high', terrain:'mountain', riskPct:0.28,
    color:'#5C5C7A', colorLight:'rgba(92,92,122,0.25)',
    desc:'Dangerous mountain passes to Blue Ridge Post. High demand, high risk.',
    demandBonus:{ tools:1.55, medicine:1.45, fur:1.35, rope:1.25 },
    transportBonus:{ wagon:0.95, mule:0.90 },
    waypoints:[[0.08,0.73],[0.18,0.62],[0.30,0.47],[0.44,0.33],[0.57,0.24],[0.66,0.20]],
    terrainLabel:'Rocky mountain passes — very tough',
    riskLabel:'High risk'
  },
  forest: {
    id:'forest', name:'Forest Wagon Road', shortName:'Forest Road',
    destination:'Oak Forest Station', destId:'oakForest',
    distance:100, days:7, risk:'medium', terrain:'forest', riskPct:0.18,
    color:'#2A5C1E', colorLight:'rgba(42,92,30,0.25)',
    desc:'A steady road through the forest. Medium risk, good variety.',
    demandBonus:{ cloth:1.35, spices:1.25, lanterns:1.45, hardwood:1.15 },
    transportBonus:{ wagon:1.0, mule:0.97 },
    waypoints:[[0.08,0.73],[0.22,0.75],[0.36,0.76],[0.47,0.75],[0.55,0.74]],
    terrainLabel:'Forested wagon road — moderate',
    riskLabel:'Medium risk'
  },
  winter: {
    id:'winter', name:'Winter Shortcut', shortName:'Winter Pass',
    destination:'Winter Peak Trading Camp', destId:'winterPeak',
    distance:60, days:5, risk:'very_high', terrain:'winter', riskPct:0.40,
    color:'#5A9EC9', colorLight:'rgba(90,158,201,0.25)',
    desc:'Frozen passes cut travel time in half. Extremely dangerous.',
    demandBonus:{ medicine:1.85, spices:1.65, fur:1.55, cloth:1.40 },
    transportBonus:{ mule:0.92 },
    waypoints:[[0.08,0.73],[0.12,0.57],[0.17,0.41],[0.23,0.29],[0.29,0.19]],
    terrainLabel:'Frozen mountain passes — treacherous',
    riskLabel:'Very high risk'
  },
  plains: {
    id:'plains', name:'Frontier Fort Path', shortName:'Fort Path',
    destination:'Frontier Fort Adams', destId:'fortAdams',
    distance:150, days:12, risk:'low', terrain:'plains', riskPct:0.10,
    color:'#C8932A', colorLight:'rgba(200,147,42,0.25)',
    desc:'The long safe road to Fort Adams. Safe travel, big market.',
    demandBonus:{ rope:1.30, hardwood:1.45, flour:1.25, tools:1.20, salt:1.20 },
    transportBonus:{ wagon:0.97, mule:0.94 },
    waypoints:[[0.08,0.73],[0.26,0.74],[0.46,0.73],[0.62,0.70],[0.74,0.65],[0.87,0.61]],
    terrainLabel:'Open prairie — easy travel',
    riskLabel:'Low risk'
  }
};

// ── Central Game State ──
const state = {
  phase: 'title',
  company: {
    name: '',
    icon: 'eagle',
    transport: null,
    money: 200,
    startMoney: 200,
    cargo: {},         // { goodId: quantity }
    totalWeight: 0,
    totalSpent: 0
  },
  selectedRoute: null,
  sim: {
    day: 0,
    maxDays: 0,
    progress: 0,       // 0-1 along route
    active: false,
    paused: false,
    speed: 1,
    losses: 0,
    repairCosts: 0,
    eventLog: [],
    cargoLost: {}
  },
  sell: {
    revenue: 0,
    prices: {},
    done: false
  },
  results: {
    startMoney: 200,
    spent: 0,
    revenue: 0,
    losses: 0,
    profit: 0,
    score: 0
  }
};

// ── Icons for company emblems ──
const COMPANY_ICONS = [
  { id:'eagle',  label:'Eagle',   symbol:'🦅' },
  { id:'bear',   label:'Bear',    symbol:'🐻' },
  { id:'fox',    label:'Fox',     symbol:'🦊' },
  { id:'beaver', label:'Beaver',  symbol:'🦫' },
  { id:'wolf',   label:'Wolf',    symbol:'🐺' },
  { id:'deer',   label:'Deer',    symbol:'🦌' }
];

function getTransport() {
  return state.company.transport ? TRANSPORTS[state.company.transport] : null;
}

function getSelectedRoute() {
  return state.selectedRoute ? ROUTES[state.selectedRoute] : null;
}

function getCargoCapacity() {
  const t = getTransport();
  return t ? t.capacity : 200;
}

function getCargoWeight() {
  let total = 0;
  for (const [id, qty] of Object.entries(state.company.cargo)) {
    const good = GOODS.find(g => g.id === id);
    if (good) total += good.weight * qty;
  }
  return total;
}

function getCargoValue() {
  let total = 0;
  for (const [id, qty] of Object.entries(state.company.cargo)) {
    const good = GOODS.find(g => g.id === id);
    if (good) total += good.buyPrice * qty;
  }
  return total;
}

function isRouteCompatible(routeId) {
  const transport = getTransport();
  if (!transport) return false;
  return transport.routes.includes(routeId);
}

function setPhase(phase) {
  state.phase = phase;
  document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
  const screen = document.getElementById('screen-' + phase);
  if (screen) screen.classList.add('active');
}
