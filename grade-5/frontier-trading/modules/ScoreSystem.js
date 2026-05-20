/* ================================================================
   Frontier Trading Company — ScoreSystem
   Leaderboard stored in localStorage
   ================================================================ */

const LEADERBOARD_KEY = 'ftc_leaderboard_v1';
const MAX_ENTRIES = 20;

function loadLeaderboard() {
  try {
    return JSON.parse(localStorage.getItem(LEADERBOARD_KEY)) || [];
  } catch(e) { return []; }
}

function saveToLeaderboard() {
  const board = loadLeaderboard();
  const transport = getTransport();
  const route = getSelectedRoute();
  const icon = COMPANY_ICONS.find(i=>i.id===state.company.icon);
  const entry = {
    company:   state.company.name,
    icon:      icon ? icon.symbol : '⭐',
    transport: transport ? transport.name : '',
    route:     route ? route.shortName : '',
    profit:    state.results.profit,
    score:     state.results.score,
    date:      new Date().toLocaleDateString()
  };
  board.push(entry);
  board.sort((a,b) => b.profit - a.profit);
  const trimmed = board.slice(0, MAX_ENTRIES);
  try { localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(trimmed)); } catch(e) {}
  return trimmed;
}

function clearLeaderboard() {
  if (confirm('Clear the entire leaderboard? This cannot be undone.')) {
    localStorage.removeItem(LEADERBOARD_KEY);
    showLeaderboard();
  }
}

function showLeaderboard() {
  const board = loadLeaderboard();
  renderLeaderboard(board);
  setPhase('leaderboard');
}

function renderLeaderboard(board) {
  const el = document.getElementById('leaderboard-table');
  if (!el) return;

  if (!board.length) {
    el.innerHTML = `<div class="lb-empty">No companies yet — be the first to complete a trade run!</div>`;
    return;
  }

  const medals = ['🥇','🥈','🥉'];
  el.innerHTML = `
    <div class="lb-header-row">
      <span class="lb-rank">#</span>
      <span class="lb-company">Company</span>
      <span class="lb-route">Route</span>
      <span class="lb-transport">Transport</span>
      <span class="lb-profit">Profit</span>
      <span class="lb-score">Score</span>
    </div>
    ${board.map((e, i) => `
      <div class="lb-row ${i < 3 ? 'lb-top' : ''}">
        <span class="lb-rank">${medals[i] || (i+1)}</span>
        <span class="lb-company">${e.icon} ${e.company}</span>
        <span class="lb-route">${e.route}</span>
        <span class="lb-transport">${e.transport}</span>
        <span class="lb-profit ${e.profit>=0?'lb-pos':'lb-neg'}">${e.profit>=0?'+':''}$${e.profit.toFixed(2)}</span>
        <span class="lb-score">${e.score} pts</span>
      </div>
    `).join('')}
  `;
}
