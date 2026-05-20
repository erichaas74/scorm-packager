/* ================================================================
   Frontier Trading Company — SimulationEngine
   Game loop, day advancement, event triggering, sell phase
   ================================================================ */

let simRAF = null;
let frameCount = 0;
const FRAMES_PER_DAY_BASE = 180; // at speed 1

function startSimulation() {
  const route = getSelectedRoute();
  if (!route) return;
  state.sim.day = 0;
  state.sim.maxDays = route.days;
  state.sim.progress = 0;
  state.sim.active = true;
  state.sim.paused = false;
  state.sim.losses = 0;
  state.sim.repairCosts = 0;
  state.sim.eventLog = [];
  state.sim.priceBonuses = {};
  state.sim.bonusCapacity = 0;
  frameCount = 0;

  // deduct supply cost budget (food for the journey)
  const supplyCost = route.days * 1.50;
  state.company.money -= supplyCost;
  logEvent('Departed!', `Departed Fort Cumberland. Journey: ${route.days} days. Supplies reserved: $${supplyCost.toFixed(2)}`, 'positive');

  setPhase('simulation');
  renderSimHUD();
  simLoop();
}

function simLoop() {
  if (!state.sim.active) return;
  simRAF = requestAnimationFrame(simLoop);
  if (state.sim.paused) return;

  frameCount++;
  const framesPerDay = Math.round(FRAMES_PER_DAY_BASE / (state.sim.speed || 1));
  if (frameCount % framesPerDay === 0) advanceDay();

  // smooth transport position
  const targetProgress = state.sim.day / state.sim.maxDays;
  state.sim.progress += (targetProgress - state.sim.progress) * 0.02;

  drawMap({
    selectedRoute: state.selectedRoute,
    simProgress: state.sim.progress
  });
  renderSimHUD();
}

function advanceDay() {
  if (state.sim.day >= state.sim.maxDays) {
    arriveAtDestination();
    return;
  }
  state.sim.day++;

  // check for event
  const route = getSelectedRoute();
  if (route) {
    const ev = rollEvent(state.selectedRoute);
    if (ev) {
      state.sim.paused = true;
      showEvent(ev, (msg, good) => {
        state.sim.paused = false;
        updateHUD();
      });
    }
  }
}

function arriveAtDestination() {
  state.sim.active = false;
  if (simRAF) cancelAnimationFrame(simRAF);
  simRAF = null;
  state.sim.progress = 1;
  drawMap({ selectedRoute: state.selectedRoute, simProgress: 1 });
  const route = getSelectedRoute();
  logEvent('Arrived!', `You reached ${route ? route.destination : 'your destination'}!`, 'positive');

  const overlay  = document.getElementById('arrival-overlay');
  const arrText  = document.getElementById('arrival-text');
  if (overlay && route) {
    arrText.textContent = `You've reached ${route.destination}!`;
    overlay.classList.remove('hidden');
    setTimeout(() => {
      overlay.classList.add('hidden');
      openSellPhase();
    }, 2400);
  } else {
    setTimeout(() => openSellPhase(), 1200);
  }
}

function pauseResumeSim() {
  state.sim.paused = !state.sim.paused;
  const btn = document.getElementById('btn-pause');
  if (btn) btn.textContent = state.sim.paused ? '▶ Resume' : '⏸ Pause';
}

function setSimSpeed(speed) {
  state.sim.speed = speed;
  document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
  const active = document.querySelector(`.speed-btn[data-speed="${speed}"]`);
  if (active) active.classList.add('active');
}

// ── Sell Phase ──
function openSellPhase() {
  const route = getSelectedRoute();
  state.sell.done = false;
  state.sell.revenue = 0;
  state.sell.prices = {};

  // calculate sell prices with demand bonuses and event bonuses
  const cargoItems = Object.entries(state.company.cargo).filter(([,v])=>v>0);

  for (const [gid, qty] of cargoItems) {
    const good = GOODS.find(g=>g.id===gid);
    if (!good) continue;
    let price = good.baseSell;
    const demandMult = (route.demandBonus || {})[gid] || 1.0;
    price *= demandMult;
    const eventMult = (state.sim.priceBonuses || {})[gid] || 1.0;
    price *= eventMult;
    state.sell.prices[gid] = Math.round(price * 100) / 100;
  }

  renderSellScreen();
  setPhase('sell');
}

function renderSellScreen() {
  const el = document.getElementById('sell-goods-list');
  if (!el) return;
  const route = getSelectedRoute();
  const cargoItems = Object.entries(state.company.cargo).filter(([,v])=>v>0);

  if (!cargoItems.length) {
    el.innerHTML = `<div class="sell-empty">No cargo to sell! Head to results.</div>`;
    updateSellTotals();
    return;
  }

  el.innerHTML = cargoItems.map(([gid, qty]) => {
    const good = GOODS.find(g=>g.id===gid);
    if (!good) return '';
    const sellPrice = state.sell.prices[gid] || good.baseSell;
    const demandMult = (route.demandBonus || {})[gid] || 1.0;
    const demandLabel = demandMult >= 1.4 ? '🔥 Hot Market' : demandMult >= 1.2 ? '📈 Good Demand' : '→ Normal';
    const totalRevenue = (sellPrice * qty).toFixed(2);
    const profit = ((sellPrice - good.buyPrice) * qty).toFixed(2);
    const profitClass = parseFloat(profit) >= 0 ? 'profit-pos' : 'profit-neg';
    return `
      <div class="sell-row" id="sell-row-${gid}">
        <div class="sell-icon">${good.icon}</div>
        <div class="sell-info">
          <div class="sell-name">${good.name} <span class="sell-demand-tag">${demandLabel}</span></div>
          <div class="sell-math">
            Bought at $${good.buyPrice.toFixed(2)} → Sell at $${sellPrice.toFixed(2)}/unit
            &nbsp;|&nbsp; <span class="${profitClass}">Profit/unit: $${((sellPrice-good.buyPrice)).toFixed(2)}</span>
          </div>
        </div>
        <div class="sell-qty-col">
          <div class="sell-qty-label">${qty} units</div>
          <div class="sell-total">= $${totalRevenue}</div>
        </div>
        <button class="sell-btn" onclick="sellGood('${gid}', ${qty}, ${sellPrice})">SELL ALL</button>
      </div>
    `;
  }).join('');

  updateSellTotals();
}

function sellGood(gid, qty, price) {
  const revenue = qty * price;
  state.company.money += revenue;
  state.sell.revenue += revenue;
  state.company.cargo[gid] = 0;

  const row = document.getElementById(`sell-row-${gid}`);
  if (row) {
    row.classList.add('sold');
    row.innerHTML = `<div class="sold-label">${GOODS.find(g=>g.id===gid)?.name || gid} — SOLD ✓ &nbsp; +$${revenue.toFixed(2)}</div>`;
  }
  updateSellTotals();
}

function updateSellTotals() {
  const el = document.getElementById('sell-total-display');
  if (el) el.textContent = `Revenue so far: $${state.sell.revenue.toFixed(2)}`;
  const moneyEl = document.getElementById('sell-money');
  if (moneyEl) moneyEl.textContent = `Company Cash: $${state.company.money.toFixed(2)}`;
}

function finishSelling() {
  state.sell.done = true;
  calculateResults();
  setPhase('results');
  renderResultsScreen();
}

// ── Results calculation ──
function calculateResults() {
  const startM = state.company.startMoney;
  const transport = getTransport();
  const transportCost = transport ? transport.startCost : 0;
  const spent = getCargoValue() + transportCost;

  state.results.startMoney = startM;
  state.results.spent = state.company.totalSpent + transportCost;
  state.results.revenue = state.sell.revenue;
  state.results.losses = state.sim.losses + state.sim.repairCosts;
  state.results.profit = state.company.money - startM;

  // score: profit + efficiency bonus + event speed
  const efficiencyBonus = state.company.totalWeight > 0 ?
    Math.round((state.sim.losses === 0 ? 20 : 10)) : 0;
  state.results.score = Math.max(0, Math.round(state.results.profit * 2 + efficiencyBonus));

  saveToLeaderboard();
}

// ── HUD update ──
function renderSimHUD() {
  const simDay   = document.getElementById('sim-day');
  const simMoney = document.getElementById('sim-money');
  const simRoute = document.getElementById('sim-route');
  const route = getSelectedRoute();

  if (simDay)   simDay.textContent   = `Day ${state.sim.day} / ${state.sim.maxDays}`;
  if (simMoney) simMoney.textContent = `$${state.company.money.toFixed(2)}`;
  if (simRoute) simRoute.textContent = route ? route.name : '';

  // progress bar
  const bar = document.getElementById('sim-progress-bar');
  if (bar) bar.style.width = `${Math.round(state.sim.progress * 100)}%`;
}

function updateHUD() {
  renderSimHUD();
  const moneyEls = document.querySelectorAll('.hud-money');
  moneyEls.forEach(el => el.textContent = `$${state.company.money.toFixed(2)}`);
}

function renderEventLog() {
  const el = document.getElementById('event-log');
  if (!el) return;
  el.innerHTML = state.sim.eventLog.slice(0,8).map(e => `
    <div class="log-entry log-${e.tone}">
      <span class="log-day">Day ${e.day}:</span>
      <span class="log-title">${e.title}</span>
      <span class="log-msg">${e.msg}</span>
    </div>
  `).join('');
}

function renderResultsScreen() {
  const r = state.results;
  const t = getTransport();
  const route = getSelectedRoute();
  const profitClass = r.profit >= 0 ? 'result-profit-pos' : 'result-profit-neg';
  const grade = r.profit >= 60 ? 'A+' : r.profit >= 40 ? 'A' : r.profit >= 25 ? 'B' : r.profit >= 10 ? 'C' : 'D';
  const gradeMsg = { 'A+':'Outstanding Frontier Merchant!', A:'Excellent Trading Run!', B:'Good Business Sense!', C:'Decent First Expedition', D:'Tough Journey — Try Again!' };

  const el = document.getElementById('results-content');
  if (!el) return;

  const icon = COMPANY_ICONS.find(i=>i.id===state.company.icon);

  el.innerHTML = `
    <div class="results-badge">
      <span class="results-emblem">${icon?icon.symbol:'⭐'}</span>
      <div class="results-company-name">${state.company.name}</div>
      <div class="results-grade grade-${grade.replace('+','plus')}">${grade}</div>
      <div class="results-grade-msg">${gradeMsg[grade]}</div>
    </div>

    <div class="results-ledger">
      <div class="ledger-title">Company Ledger</div>
      <div class="ledger-row"><span>Starting Capital</span><span>$${r.startMoney.toFixed(2)}</span></div>
      <div class="ledger-row ledger-neg"><span>Transport (${t?t.name:''})</span><span>-$${(t?t.startCost:0).toFixed(2)}</span></div>
      <div class="ledger-row ledger-neg"><span>Goods Purchased</span><span>-$${Math.max(0,r.spent-(t?t.startCost:0)).toFixed(2)}</span></div>
      <div class="ledger-row ledger-neg"><span>Journey Supplies</span><span>-$${((route?route.days:0)*1.5).toFixed(2)}</span></div>
      ${r.losses > 0 ? `<div class="ledger-row ledger-neg"><span>Event Losses</span><span>-$${r.losses.toFixed(2)}</span></div>` : ''}
      <div class="ledger-row ledger-pos"><span>Sales Revenue</span><span>+$${r.revenue.toFixed(2)}</span></div>
      <div class="ledger-divider"></div>
      <div class="ledger-row ledger-profit ${profitClass}">
        <span>Net Profit</span>
        <span>${r.profit >= 0 ? '+' : ''}$${r.profit.toFixed(2)}</span>
      </div>
      <div class="ledger-row ledger-score"><span>Company Score</span><span>${r.score} pts</span></div>
    </div>

    <div class="results-btns">
      <button class="btn-primary" onclick="showLeaderboard()">View Leaderboard</button>
      <button class="btn-secondary" onclick="restartGame()">Play Again</button>
    </div>
  `;
}
