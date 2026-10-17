'use strict';
const data = [
  ['A rope carries a disturbance away from your hand. What is the rope in this model?', 'Medium', 'The medium is the material through which a mechanical wave travels.', 'medium.png', 'A hand sends a traveling disturbance along a braided rope.'],
  ['In a sound wave, the highlighted region has air particles spread farther apart than at rest. What is this region called?', 'Rarefaction', 'A rarefaction is a region of lower pressure and lower particle density in a longitudinal wave.', 'rarefaction.svg', 'Air particles form alternating dense and sparse regions. A gold outline highlights a sparse region.'],
  ['One quick flick sends a single disturbance along a rope.', 'Pulse', 'A pulse is a single disturbance.', 'pulse.png', 'One isolated upward disturbance travels along an otherwise straight rope.'],
  ['A motor shakes a rope at regular intervals. What kind of travelling wave pattern does this produce?', 'Periodic wave', 'A periodic wave repeats at regular intervals.', 'periodic.png', 'A laboratory vibrator produces regularly spaced crests and troughs in a rope.'],
  ['The gold marker identifies the highest point of a transverse wave above its resting position. What is this point called?', 'Crest', 'A crest is the highest point of a transverse wave above equilibrium.', 'crest.svg', 'A transverse wave has a gold marker at its highest point above a dashed equilibrium line.'],
  ['The marked point is at its undisturbed resting position.', 'Equilibrium', 'Equilibrium is the resting reference position.', 'equilibrium.png', 'A gold marker sits on a straight undisturbed horizontal rope.']
];
const terms = ['Crest', 'Equilibrium', 'Medium', 'Periodic wave', 'Pulse', 'Rarefaction'];
const answers = Array(data.length).fill(null);
let selected = null;
let drag = null;
let suppressClick = false;
const byId = id => document.getElementById(id);
const say = text => { byId('announcement').textContent = text; };

terms.forEach(term => {
  const button = document.createElement('button');
  button.className = 'term'; button.textContent = term; button.dataset.term = term;
  button.setAttribute('aria-pressed', 'false');
  button.addEventListener('click', () => { if (!suppressClick) choose(selected === term ? null : term); });
  byId('terms').append(button);
});
data.forEach((q, i) => {
  const card = document.createElement('section'); card.className = 'card';
  card.setAttribute('aria-labelledby', 'question' + i);
  card.innerHTML = `<p class="question" id="question${i}"></p><img class="diagram" draggable="false"><div class="answer-row"><button class="target" id="target${i}" data-index="${i}" aria-describedby="question${i} feedback${i}">Drop a term here</button><button class="clear" id="clear${i}" hidden>Clear match</button></div><p id="feedback${i}" class="feedback"></p>`;
  card.querySelector('.question').textContent = q[0];
  const img = card.querySelector('img'); img.src = 'images/' + q[3]; img.alt = q[4];
  const target = card.querySelector('.target');
  target.setAttribute('aria-label', `Scenario ${i + 1}: empty answer target`);
  target.addEventListener('click', () => {
    if (suppressClick) return;
    if (selected) place(i, selected);
    else say(`Select a term first, then activate the target for Scenario ${i + 1}.`);
  });
  card.querySelector('.clear').setAttribute('aria-label', `Clear match for Scenario ${i + 1}`);
  card.querySelector('.clear').addEventListener('click', () => { answers[i] = null; update(i); invalidate(); say(`Scenario ${i + 1} cleared.`); });
  byId('cards').append(card);
});

function choose(term) {
  selected = term;
  document.querySelectorAll('.term').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.term === term)));
  byId('selection').textContent = term ? `${term} selected. Choose a scenario target.` : 'Drag a tile or select one to begin.';
}
function update(i) {
  const target = byId('target' + i);
  target.textContent = answers[i] || 'Drop a term here';
  target.className = 'target' + (answers[i] ? ' filled' : '');
  target.setAttribute('aria-label', `Scenario ${i + 1}: ${answers[i] || 'empty answer target'}`);
  byId('clear' + i).hidden = !answers[i];
  byId('feedback' + i).textContent = '';
  byId('progress').textContent = `${answers.filter(Boolean).length} of ${data.length} matched`;
}
function invalidate() {
  byId('result').textContent = '';
  data.forEach((_, i) => { byId('feedback' + i).textContent = ''; byId('target' + i).classList.remove('correct', 'incorrect'); });
}
function place(i, term, from = null) {
  if (!terms.includes(term)) return;
  if (from !== null && from !== i) { answers[from] = null; update(from); }
  answers[i] = term; update(i); invalidate(); choose(null);
  say(`${term} matched to Scenario ${i + 1}.`);
}

// Pointer capture gives the same direct dragging interaction to mouse, pen, and touch.
document.addEventListener('pointerdown', event => {
  if (event.button !== 0 || drag) return;
  const source = event.target.closest('.term, .target.filled');
  if (!source) return;
  const from = source.classList.contains('target') ? Number(source.dataset.index) : null;
  drag = {source, id:event.pointerId, term:from === null ? source.dataset.term : answers[from], from,
    x:event.clientX, y:event.clientY, startX:event.clientX, startY:event.clientY, active:false, ghost:null, frame:null};
  source.setPointerCapture(event.pointerId);
});
function hoverTarget() {
  if (!drag) return null;
  const target = document.elementFromPoint(drag.x, drag.y)?.closest('.target');
  document.querySelectorAll('.target.over').forEach(t => t.classList.remove('over'));
  if (target) target.classList.add('over');
  return target;
}
function autoScroll() {
  if (!drag?.active) return;
  const top = document.querySelector('.bank').getBoundingClientRect().bottom + 35;
  if (drag.y > window.innerHeight - 65) window.scrollBy(0, 10);
  else if (drag.y < top) window.scrollBy(0, -10);
  hoverTarget();
  drag.frame = requestAnimationFrame(autoScroll);
}
document.addEventListener('pointermove', event => {
  if (!drag || event.pointerId !== drag.id) return;
  drag.x = event.clientX; drag.y = event.clientY;
  if (!drag.active && Math.hypot(drag.x - drag.startX, drag.y - drag.startY) > 7) {
    drag.active = true; choose(drag.term);
    drag.ghost = document.createElement('div'); drag.ghost.className = 'ghost';
    drag.ghost.textContent = drag.term; drag.ghost.setAttribute('aria-hidden', 'true'); document.body.append(drag.ghost);
    drag.frame = requestAnimationFrame(autoScroll);
  }
  if (drag.active) { event.preventDefault(); drag.ghost.style.left = drag.x + 'px'; drag.ghost.style.top = drag.y + 'px'; hoverTarget(); }
}, {passive:false});
function endDrag(cancelled) {
  if (!drag) return;
  const current = drag;
  const target = current.active && !cancelled ? hoverTarget() : null;
  if (current.active) {
    suppressClick = true; setTimeout(() => { suppressClick = false; }, 0);
    if (target) place(Number(target.dataset.index), current.term, current.from);
    else { choose(null); say('Drag cancelled. Your matches are unchanged.'); }
  }
  cancelAnimationFrame(current.frame); current.ghost?.remove(); drag = null;
  document.querySelectorAll('.target.over').forEach(t => t.classList.remove('over'));
  if (current.source.hasPointerCapture(current.id)) current.source.releasePointerCapture(current.id);
}
document.addEventListener('pointerup', event => { if (drag?.id === event.pointerId) endDrag(false); });
document.addEventListener('pointercancel', () => endDrag(true));
document.addEventListener('lostpointercapture', () => { if (drag) endDrag(true); });
document.addEventListener('keydown', event => { if (event.key === 'Escape') { endDrag(true); choose(null); say('Selection cancelled.'); } });
window.addEventListener('blur', () => endDrag(true));
byId('check').addEventListener('click', () => {
  let correct = 0;
  data.forEach((q, i) => {
    const ok = answers[i] === q[1]; correct += Number(ok);
    const feedback = byId('feedback' + i); feedback.className = 'feedback ' + (ok ? 'ok' : 'retry');
    feedback.textContent = ok ? 'Correct. ' + q[2] : answers[i] ? 'Try again. ' + q[2] : 'Match a term to this scenario before checking.';
    byId('target' + i).classList.toggle('correct', ok);
    byId('target' + i).classList.toggle('incorrect', !ok);
  });
  byId('result').textContent = correct === data.length ? 'All 6 matches are correct. You have connected each wave concept to its context.' : `${correct} of ${data.length} correct. Revise your matches and check again.`;
});
byId('reset').addEventListener('click', () => {
  endDrag(true); answers.fill(null); data.forEach((_, i) => update(i)); invalidate(); choose(null);
  say('Activity reset. All six targets are empty.'); document.querySelector('.term').focus();
});
