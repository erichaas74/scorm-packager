/* ================================================================
   Frontier Trading Company — Main Controller
   Screen rendering, event handlers, game flow
   ================================================================ */

// ── Screen managers ──
function renderTitleScreen() {
  const el = document.getElementById('title-stats');
  const board = loadLeaderboard();
  if (el && board.length) {
    const top = board[0];
    el.innerHTML = `<div class="title-top-score">Top Company: ${top.icon} <strong>${top.company}</strong> — $${top.profit.toFixed(2)} profit</div>`;
  }
}

function renderSetupScreen() {
  // Transport cards
  const grid = document.getElementById('transport-grid');
  if (grid) {
    grid.innerHTML = Object.values(TRANSPORTS).map(t => `
      <div class="transport-card ${state.company.transport===t.id?'selected':''}" onclick="selectTransport('${t.id}')">
        <div class="tc-emoji">${t.emoji}</div>
        <div class="tc-name">${t.name}</div>
        <div class="tc-stats">
          <div class="tc-stat"><span>Capacity</span><strong>${t.capacity} lbs</strong></div>
          <div class="tc-stat"><span>Speed</span><strong>${t.speed >= 1.2 ? 'Fast' : t.speed >= 0.9 ? 'Medium' : t.speed >= 0.7 ? 'Slow' : 'Very Slow'}</strong></div>
          <div class="tc-stat"><span>Cost</span><strong>$${t.startCost}.00</strong></div>
          <div class="tc-stat"><span>Routes</span><strong>${t.routes.length} of 5</strong></div>
        </div>
        <div class="tc-desc">${t.desc}</div>
        <div class="tc-pros-cons">
          <div class="tc-pro">✓ ${t.pros}</div>
          <div class="tc-con">✗ ${t.cons}</div>
        </div>
      </div>
    `).join('');
  }

  // Icon picker
  const iconPicker = document.getElementById('icon-picker');
  if (iconPicker) {
    iconPicker.innerHTML = COMPANY_ICONS.map(ic => `
      <button class="icon-btn ${state.company.icon===ic.id?'selected':''}" onclick="selectIcon('${ic.id}')">
        <span class="icon-emoji">${ic.symbol}</span>
        <span class="icon-label">${ic.label}</span>
      </button>
    `).join('');
  }

  updateSetupBudget();
}

function updateSetupBudget() {
  const t = getTransport();
  const cost = t ? t.startCost : 0;
  const remaining = state.company.startMoney - cost;
  const el = document.getElementById('setup-budget');
  if (el) {
    el.innerHTML = `Starting money: $${state.company.startMoney.toFixed(2)} | Transport cost: $${cost.toFixed(2)} | Market budget: <strong>$${remaining.toFixed(2)}</strong>`;
  }
}

function selectTransport(id) {
  state.company.transport = id;
  const t = TRANSPORTS[id];
  state.company.money = state.company.startMoney - t.startCost;
  renderSetupScreen();
}

function selectIcon(id) {
  state.company.icon = id;
  renderSetupScreen();
}

function proceedToMarket() {
  const nameInput = document.getElementById('company-name-input');
  if (nameInput) state.company.name = nameInput.value.trim() || 'Frontier Co.';
  if (!state.company.transport) {
    alert('Please choose a transport type first!');
    return;
  }
  state.company.cargo = {};
  state.company.totalWeight = 0;
  state.company.totalSpent = 0;
  renderMarketScreen();
  setPhase('market');
}

// ── Market Screen ──
function renderMarketScreen() {
  const transport = getTransport();
  const capacity = getCargoCapacity();
  renderMarketHeader();
  const grid = document.getElementById('market-goods-grid');
  if (!grid) return;

  grid.innerHTML = GOODS.map(g => {
    const qty = state.company.cargo[g.id] || 0;
    const profitPerUnit = (g.baseSell - g.buyPrice).toFixed(2);
    const demandColor = g.demand === 'high' ? '#2A5C1E' : g.demand === 'medium' ? '#C8932A' : '#888';
    const demandLabel = g.demand === 'high' ? '🔥 High' : g.demand === 'medium' ? '📊 Medium' : '📉 Low';
    const totalCost  = (g.buyPrice * qty).toFixed(2);
    const totalWeight = (g.weight * qty);
    return `
      <div class="market-card" id="mc-${g.id}">
        <div class="mc-icon">${g.icon}</div>
        <div class="mc-info">
          <div class="mc-name">${g.name}</div>
          <div class="mc-desc">${g.desc}</div>
          <div class="mc-prices">
            <span class="mc-buy">Buy: <strong>$${g.buyPrice.toFixed(2)}</strong></span>
            <span class="mc-sell">Est. Sell: $${g.baseSell.toFixed(2)}</span>
            <span class="mc-profit" style="color:${profitPerUnit>=0?'#2A5C1E':'#8B2635'}">
              Profit/unit: $${profitPerUnit}
            </span>
          </div>
          <div class="mc-meta">
            <span class="mc-weight">${g.weight} lbs/unit</span>
            <span class="mc-demand" style="color:${demandColor}">${demandLabel}</span>
          </div>
        </div>
        <div class="mc-controls">
          <button class="mc-btn mc-minus" onclick="changeQty('${g.id}', -1)">−</button>
          <span class="mc-qty" id="mc-qty-${g.id}">${qty}</span>
          <button class="mc-btn mc-plus" onclick="changeQty('${g.id}', 1)">+</button>
          <div class="mc-subtotal">$${totalCost} / ${totalWeight} lbs</div>
        </div>
      </div>
    `;
  }).join('');
  renderMarketHeader();
}

function renderMarketHeader() {
  const weight   = getCargoWeight();
  const capacity = getCargoCapacity() + (state.sim.bonusCapacity || 0);
  const budgetLeft = state.company.money - getCargoValue();
  const weightPct  = Math.min(100, Math.round(weight/capacity*100));
  const budgetSpent = state.company.startMoney - (getTransport()?getTransport().startCost:0) - budgetLeft;
  const budgetMax   = state.company.startMoney - (getTransport()?getTransport().startCost:0);
  const budgetPct   = Math.min(100, Math.round(budgetSpent/budgetMax*100));

  const wEl  = document.getElementById('weight-bar-fill');
  const wTxt = document.getElementById('weight-bar-text');
  const bEl  = document.getElementById('budget-bar-fill');
  const bTxt = document.getElementById('budget-bar-text');
  const remainEl = document.getElementById('budget-remaining');

  if (wEl)  wEl.style.width  = `${weightPct}%`;
  if (wEl)  wEl.style.background = weightPct > 90 ? '#8B2635' : weightPct > 70 ? '#C8932A' : '#2A5C1E';
  if (wTxt) wTxt.textContent = `${weight} / ${capacity} lbs`;
  if (bEl)  bEl.style.width  = `${budgetPct}%`;
  if (bEl)  bEl.style.background = budgetPct > 90 ? '#8B2635' : budgetPct > 70 ? '#C8932A' : '#2A5C1E';
  if (bTxt) bTxt.textContent = `$${budgetSpent.toFixed(2)} / $${budgetMax.toFixed(2)} spent`;
  if (remainEl) {
    remainEl.textContent = `$${budgetLeft.toFixed(2)} remaining`;
    remainEl.style.color = budgetLeft < 0 ? '#8B2635' : '#2A5C1E';
  }
}

function changeQty(goodId, delta) {
  const good = GOODS.find(g=>g.id===goodId);
  if (!good) return;

  const current = state.company.cargo[goodId] || 0;
  const newQty  = Math.max(0, Math.min(good.maxQty, current + delta));

  // check budget
  const newCargoValue = getCargoValue() - (good.buyPrice*current) + (good.buyPrice*newQty);
  const budgetMax = state.company.money;
  if (newCargoValue > budgetMax && delta > 0) {
    flashElement('budget-remaining', 'flash-red');
    return;
  }

  // check weight
  const newWeight = getCargoWeight() - (good.weight*current) + (good.weight*newQty);
  const capacity = getCargoCapacity() + (state.sim.bonusCapacity || 0);
  if (newWeight > capacity && delta > 0) {
    flashElement('weight-bar-text', 'flash-red');
    return;
  }

  state.company.cargo[goodId] = newQty;
  state.company.totalWeight = getCargoWeight();

  // update just the qty display and subtotal
  const qtyEl = document.getElementById(`mc-qty-${goodId}`);
  if (qtyEl) qtyEl.textContent = newQty;

  // Update subtotal in card
  const card = document.getElementById(`mc-${goodId}`);
  if (card) {
    const subtotal = card.querySelector('.mc-subtotal');
    if (subtotal) subtotal.textContent = `$${(good.buyPrice*newQty).toFixed(2)} / ${good.weight*newQty} lbs`;
  }

  renderMarketHeader();
}

function flashElement(id, cls) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add(cls);
  setTimeout(()=>el.classList.remove(cls), 500);
}

function proceedToRoute() {
  const weight = getCargoWeight();
  const capacity = getCargoCapacity();
  if (weight === 0) {
    alert("You haven't bought any cargo yet! Head to the market and stock up.");
    return;
  }
  if (weight > capacity) {
    alert(`Your cargo (${weight} lbs) exceeds your capacity (${capacity} lbs). Remove some items.`);
    return;
  }
  state.company.totalSpent = getCargoValue();
  initRouteScreen();
  setPhase('route');
}

// ── Route Screen ──
let routeCanvas = null;
let hoveredRoute = null;

function initRouteScreen() {
  routeCanvas = document.getElementById('route-map-canvas');
  if (!routeCanvas) return;
  initCanvas(routeCanvas);

  // route info panel
  renderRouteCards();
  drawMap({ selectedRoute: state.selectedRoute, hoveredRoute });

  routeCanvas.addEventListener('mousemove', onRouteMouseMove);
  routeCanvas.addEventListener('click', onRouteClick);
  routeCanvas.addEventListener('mouseleave', () => {
    hoveredRoute = null;
    drawMap({ selectedRoute: state.selectedRoute, hoveredRoute });
  });
}

function onRouteMouseMove(e) {
  const rect = routeCanvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) * (routeCanvas.width / rect.width);
  const my = (e.clientY - rect.top)  * (routeCanvas.height / rect.height);
  const hit = getRouteAtPoint(mx, my);
  if (hit !== hoveredRoute) {
    hoveredRoute = hit;
    drawMap({ selectedRoute: state.selectedRoute, hoveredRoute });
    if (hit) {
      routeCanvas.style.cursor = 'pointer';
      updateRouteInfoPanel(hit);
    } else {
      routeCanvas.style.cursor = 'default';
    }
  }
}

function onRouteClick(e) {
  const rect = routeCanvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) * (routeCanvas.width / rect.width);
  const my = (e.clientY - rect.top)  * (routeCanvas.height / rect.height);
  const hit = getRouteAtPoint(mx, my);
  if (hit) selectRoute(hit);
}

function selectRoute(routeId) {
  state.selectedRoute = routeId;
  drawMap({ selectedRoute: routeId, hoveredRoute });
  renderRouteCards();
  updateRouteInfoPanel(routeId);
  document.getElementById('btn-depart').disabled = false;
  document.getElementById('btn-depart').classList.add('ready');
}

function renderRouteCards() {
  const list = document.getElementById('route-cards');
  if (!list) return;
  list.innerHTML = Object.values(ROUTES).map(r => {
    const compat = isRouteCompatible(r.id);
    const selected = state.selectedRoute === r.id;
    const riskColor = r.risk==='low'?'#2A5C1E':r.risk==='medium'?'#C8932A':r.risk==='high'?'#8B4513':'#8B2635';
    return `
      <div class="route-card ${selected?'selected':''} ${!compat?'incompatible':''}"
           onclick="${compat ? `selectRoute('${r.id}')` : ''}">
        <div class="rc-dot" style="background:${r.color}"></div>
        <div class="rc-info">
          <div class="rc-name">${r.shortName}</div>
          <div class="rc-dest">→ ${r.destination}</div>
          <div class="rc-meta">
            <span>${r.days} days</span>
            <span style="color:${riskColor}">${r.riskLabel}</span>
          </div>
          ${!compat ? `<div class="rc-incompat">⚠ Not accessible by ${getTransport()?getTransport().name:''}</div>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function updateRouteInfoPanel(routeId) {
  const route = ROUTES[routeId];
  const el = document.getElementById('route-detail');
  if (!route || !el) return;
  const compat = isRouteCompatible(routeId);
  const riskColor = route.risk==='low'?'#2A5C1E':route.risk==='medium'?'#C8932A':route.risk==='high'?'#8B4513':'#8B2635';
  const topDemand = Object.entries(route.demandBonus||{})
    .sort((a,b)=>b[1]-a[1]).slice(0,3)
    .map(([id,mult])=>{
      const g = GOODS.find(g=>g.id===id);
      return `${g?g.icon:''} ${g?g.name:id} (+${Math.round((mult-1)*100)}%)`;
    }).join(', ');

  el.innerHTML = `
    <div class="rd-title" style="color:${route.color}">${route.name}</div>
    <div class="rd-dest">Destination: <strong>${route.destination}</strong></div>
    <div class="rd-desc">${route.desc}</div>
    <div class="rd-stats">
      <div class="rd-stat"><span>Distance</span><strong>${route.distance} mi</strong></div>
      <div class="rd-stat"><span>Travel Time</span><strong>${route.days} days</strong></div>
      <div class="rd-stat"><span>Terrain</span><strong>${route.terrainLabel}</strong></div>
      <div class="rd-stat"><span>Risk</span><strong style="color:${riskColor}">${route.riskLabel}</strong></div>
    </div>
    ${topDemand ? `<div class="rd-demand">🔥 Hot Demand: ${topDemand}</div>` : ''}
    ${!compat ? `<div class="rd-incompat">⚠ Your ${getTransport()?getTransport().name:''} cannot travel this route!</div>` : ''}
  `;
}

// ── Restart ──
function restartGame() {
  if (simRAF) cancelAnimationFrame(simRAF);
  simRAF = null;
  state.phase = 'title';
  state.company = { name:'', icon:'eagle', transport:null, money:200, startMoney:200, cargo:{}, totalWeight:0, totalSpent:0 };
  state.selectedRoute = null;
  state.sim = { day:0, maxDays:0, progress:0, active:false, paused:false, speed:1, losses:0, repairCosts:0, eventLog:[], priceBonuses:{}, bonusCapacity:0 };
  state.sell = { revenue:0, prices:{}, done:false };
  state.results = { startMoney:200, spent:0, revenue:0, losses:0, profit:0, score:0 };
  renderTitleScreen();
  setPhase('title');
}

// ── Teacher panel ──
function toggleTeacherPanel() {
  const panel = document.getElementById('teacher-panel');
  if (panel) panel.classList.toggle('hidden');
}

function teacherInjectEvent(evtId) {
  if (state.phase !== 'simulation') { alert('Simulation must be running to inject events.'); return; }
  const template = EVENT_POOL.find(e=>e.id===evtId);
  if (!template) return;
  const built = template.buildEvent(state.company.cargo);
  if (!built) { alert('Event not applicable (check cargo).'); return; }
  state.sim.paused = true;
  showEvent({ ...template, ...built }, (msg) => { state.sim.paused = false; });
}

function teacherSetSpeed(s) { setSimSpeed(parseFloat(s)); }
function teacherPause()     { if (state.phase==='simulation') pauseResumeSim(); }
function teacherReset()     { if (confirm('Reset game for all?')) restartGame(); }

// ── Boot ──
window.addEventListener('DOMContentLoaded', () => {
  renderTitleScreen();
  setPhase('title');

  // keyboard shortcut for teacher mode: Ctrl+T
  document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key === 't') { e.preventDefault(); toggleTeacherPanel(); }
  });
});
