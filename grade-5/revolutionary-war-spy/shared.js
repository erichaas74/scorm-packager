const STAGE_LABELS = ['Briefing','Cipher','Route Map','Lab Test','Report','Traitor Hunt','Invisible Ink','Signal Flags','Fraction Lock','Battle Command','Portfolio'];
const STAGE_PAGES  = ['briefing.html','cipher.html','route-map.html','lab-test.html','report.html','traitor-hunt.html','invisible-ink.html','signal-flags.html','fraction-lock.html','battle-command.html','portfolio.html'];
const STATE_KEY    = 'spy_mission_state';

function loadState() {
  try { return JSON.parse(localStorage.getItem(STATE_KEY)) || {}; } catch(e) { return {}; }
}

function saveState(updates) {
  const s = loadState();
  Object.assign(s, updates);
  localStorage.setItem(STATE_KEY, JSON.stringify(s));
}

function wordCount(s) {
  return s.trim().split(/\s+/).filter(w => w.length > 0).length;
}

function caesarEncode(msg, shift) {
  return msg.toUpperCase().split('').map(ch => {
    if (ch >= 'A' && ch <= 'Z') return String.fromCharCode(((ch.charCodeAt(0) - 65 + shift) % 26) + 65);
    return ch;
  }).join('');
}

function caesarDecode(coded, shift) {
  return caesarEncode(coded, 26 - (shift % 26));
}

function getCanvasXY(canvas, e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const src = e.touches ? e.touches[0] : e;
  return { x: (src.clientX - rect.left) * scaleX, y: (src.clientY - rect.top) * scaleY };
}

let _rafId = null;
function stopAllAnimations() {
  if (_rafId) { cancelAnimationFrame(_rafId); _rafId = null; }
}

function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function buildProgressBar(currentStage) {
  const row    = document.getElementById('pip-row');
  const labels = document.getElementById('pip-labels');
  row.innerHTML = '';
  labels.innerHTML = '';
  STAGE_LABELS.forEach((lbl, i) => {
    const pip = document.createElement('div');
    pip.className = 'pip' + (i < currentStage ? ' done' : i === currentStage ? ' active' : '');
    pip.textContent = i + 1;
    row.appendChild(pip);
    if (i < STAGE_LABELS.length - 1) {
      const conn = document.createElement('div');
      conn.className = 'pip-connector' + (i < currentStage ? ' done' : '');
      row.appendChild(conn);
    }
    const lblEl = document.createElement('div');
    lblEl.className = 'pip-label';
    lblEl.textContent = lbl;
    labels.appendChild(lblEl);
  });
}

function initPage(currentStage) {
  buildProgressBar(currentStage);
  const state = loadState();
  if (state.studentName) {
    const badge = document.getElementById('name-badge');
    if (badge) badge.innerHTML = `Agent: <span>${state.studentName}</span>`;
  }
}

function goToNextPage(currentStage) {
  if (currentStage + 1 < STAGE_PAGES.length) {
    window.location.href = STAGE_PAGES[currentStage + 1];
  }
}
