'use strict';
// Unit mass, g = 9.8 m/s², h = 0 at the ball's lowest position.
// Choose k so 1/2 k x_max² = mgH; all three energies stay nonnegative.
const G = 9.8, HEIGHT = 3.8, COMPRESSION = 0.6;
const K = 2 * G * HEIGHT / COMPRESSION ** 2;
const OMEGA = Math.sqrt(K);
const FALL = Math.sqrt(2 * (HEIGHT - COMPRESSION) / G);
const IMPACT = G * FALL;
const CONTACT = (2 * Math.PI - 2 * Math.atan(IMPACT * OMEGA / G)) / OMEGA;
const PERIOD = 2 * FALL + CONTACT;
const SLOWDOWN = 2.3;
const $ = id => document.getElementById(id);
const labels = {peg:'PE gravity', ke:'KE', pes:'PE spring'};
function stateAt(time) {
  const t = ((time % PERIOD) + PERIOD) % PERIOD;
  let h, v, x = 0;
  if (t < FALL) { h = HEIGHT - 0.5 * G * t * t; v = -G * t; }
  else if (t < FALL + CONTACT) {
    const s = t - FALL;
    x = IMPACT / OMEGA * Math.sin(OMEGA * s) + G / K * (1 - Math.cos(OMEGA * s));
    v = -(IMPACT * Math.cos(OMEGA * s) + G / OMEGA * Math.sin(OMEGA * s));
    h = COMPRESSION - x;
  } else { const s = t - FALL - CONTACT; h = COMPRESSION + IMPACT * s - 0.5 * G * s * s; v = IMPACT - G * s; }
  return {h, v, x, peg:Math.max(0,h / HEIGHT), ke:v * v / (2 * G * HEIGHT), pes:K * x * x / (2 * G * HEIGHT)};
}
const questions = [
  {time:0, answer:'peg', text:'At the highest point, which energy is greatest?', explanation:'At the top the ball is momentarily at rest and the spring is relaxed. All the energy is gravitational PE.'},
  {time:FALL, answer:'ke', text:'Just as the ball touches the spring, which energy is greatest?', explanation:'The ball has converted most of its gravitational PE into KE. The spring has not compressed yet.'},
  {time:FALL + CONTACT / 2, answer:'pes', text:'At maximum compression, which energy is greatest?', explanation:'The ball is momentarily at rest at the zero-height reference. All the energy is stored in the compressed spring.'},
  {time:Math.sqrt(HEIGHT / G), answer:'C', type:'position', text:'PE gravity = KE. Where is the ball?', explanation:'Position C is halfway between the release height and the zero-height reference: 1.9 m. PE gravity and KE are each 50%; the spring is not compressed.'},
  {time:FALL + CONTACT + 0.06, answer:'ke', text:'The ball is rising just above the spring. Which energy is greatest?', explanation:'The spring has returned its energy to the ball. Just above the spring, KE is still greatest; it changes into gravitational PE as the ball rises.'}
];
let mode = 'watch', elapsed = 0, lastFrame = null, paused = false, questionIndex = 0, score = 0, responses = [];
let questionElapsed = 0;
function resetChoices() {
  document.querySelectorAll('.energy-choice').forEach(b => { b.disabled = true; b.classList.remove('correct','incorrect'); });
  document.querySelectorAll('.location').forEach(b => { b.disabled = true; b.classList.remove('correct','incorrect'); });
}
function startQuestion() {
  mode = 'question-motion'; document.body.dataset.mode = 'quiz';
  questionElapsed = 0; lastFrame = null; paused = false;
  resetChoices();
  $('mode').textContent = '02 · Question mode';
  $('instruction').textContent = 'Watch one complete bounce from the top. Then the ball will stop at the position to test.';
  $('pause').hidden = false; $('pause').textContent = 'Pause animation';
  $('watchNote').hidden = true; $('question').hidden = false; $('results').hidden = true; $('locations').hidden = true;
  $('cycle').textContent = `Question ${questionIndex + 1} of ${questions.length} · Watch`;
  $('sceneTitle').textContent = 'One full bounce, then stop';
  $('sceneDescription').textContent = 'The ball starts at its release height, completes one full bounce, then continues to the tested position.';
  $('energyEyebrow').textContent = 'WATCH THE MOTION';
  $('energyTitle').textContent = 'Follow the ball.';
  $('energySubtitle').textContent = 'Choose your answer after the animation stops.';
  $('questionCount').textContent = `QUESTION ${questionIndex + 1} / ${questions.length} · 1 POINT`;
  $('questionText').textContent = 'Watch the bounce first.';
  $('questionHelp').textContent = 'Answers unlock when the ball stops.';
  $('feedback').textContent = ''; $('next').hidden = true;
  $('progress').value = responses.length; $('progress').setAttribute('aria-label','Answered questions');
  $('progressText').textContent = 'One point per correct answer. Each question counts once.';
  drawModel(stateAt(0)); drawEnergy(stateAt(0), true);
}
function drawModel(state, hideBall = false) {
  const y = 430 - state.h * 350 / HEIGHT;
  const springTop = 430 - (COMPRESSION - state.x) * 350 / HEIGHT + 18;
  let d = `M 264 480 L 264 476`;
  for (let i = 1; i <= 16; i++) d += ` L ${264 + (i % 2 ? 24 : -24)} ${476 - (476 - springTop) * i / 17}`;
  d += ` L 264 ${springTop}`;
  $('spring').setAttribute('d', d);
  $('springCap').setAttribute('d', `M 239 ${springTop} H 289`);
  $('ball').setAttribute('cy', y);
  $('ball').style.display = hideBall ? 'none' : '';
  $('motionLabel').textContent = hideBall ? '' : Math.abs(state.v) < 0.05 ? (state.x > 0.1 ? 'Fully compressed' : 'At the top') : state.v < 0 ? 'Falling ↓' : 'Rising ↑';
  $('motionLabel').setAttribute('y', y + 5);
}
function drawEnergy(state, hidden = false) {
  for (const key of ['peg','ke','pes']) {
    $(key + 'Bar').style.height = hidden ? '0%' : `${Math.max(0, Math.min(100, state[key] * 100))}%`;
    $(key + 'Value').textContent = hidden ? '?' : `${Math.round(state[key] * 100)}%`;
  }
}
function updateScore() {
  $('score').textContent = `${score} / ${questions.length}`;
  $('answered').textContent = `${responses.length} answered`;
}
function showQuestion() {
  mode = 'quiz'; document.body.dataset.mode = mode;
  const q = questions[questionIndex], position = q.type === 'position';
  $('mode').textContent = '02 · Question mode';
  $('instruction').textContent = position ? 'Read the energy bars, then click one of the four ball locations.' : 'Click the energy bar with the greatest energy at this ball position.';
  $('pause').hidden = true; $('watchNote').hidden = true; $('question').hidden = false; $('results').hidden = true;
  $('cycle').textContent = `Question ${questionIndex + 1} of ${questions.length}`;
  $('sceneTitle').textContent = position ? 'Choose a ball location' : 'A moment in the bounce';
  $('sceneDescription').textContent = position ? 'Four possible ball locations: A at 3.8 meters, B at 2.85 meters, C at 1.9 meters, and D at 0.95 meters.' : `The ball is ${stateAt(q.time).h.toFixed(2)} meters above its lowest position. ${questionIndex === 2 ? 'The spring is fully compressed.' : 'The spring is relaxed.'}`;
  $('energyEyebrow').textContent = position ? 'MATCH THE ENERGY' : 'PREDICT THE ENERGY';
  $('energyTitle').textContent = position ? 'Half potential. Half kinetic.' : 'Which energy is greatest?';
  $('energySubtitle').textContent = position ? 'PE gravity: 50% · KE: 50% · PE spring: 0%' : 'The bars will be revealed after you choose.';
  $('questionCount').textContent = `QUESTION ${questionIndex + 1} / ${questions.length} · 1 POINT`;
  $('questionText').textContent = q.text;
  $('questionHelp').textContent = position ? 'Select A, B, C, or D directly on the model.' : 'Click a bar above: PE gravity, KE, or PE spring. Your first choice counts.';
  $('feedback').textContent = ''; $('next').hidden = true;
  $('locations').hidden = !position;
  document.querySelectorAll('.location').forEach(b => { b.disabled = false; b.classList.remove('correct','incorrect'); });
  document.querySelectorAll('.energy-choice').forEach(b => { b.disabled = position; });
  drawModel(position ? stateAt(0) : stateAt(q.time), position);
  drawEnergy(position ? {peg:0.5,ke:0.5,pes:0} : stateAt(q.time), !position);
  $('progress').value = responses.length; $('progress').setAttribute('aria-label','Answered questions');
  $('progressText').textContent = 'One point per correct answer. Each question counts once.';
  $('questionText').focus({preventScroll:true});
}
function answer(choice) {
  if (mode !== 'quiz' || responses.length > questionIndex) return;
  const q = questions[questionIndex];
  const valid = q.type === 'position' ? ['A','B','C','D'] : ['peg','ke','pes'];
  if (!valid.includes(choice)) return;
  const correct = choice === q.answer;
  responses.push({choice, correct}); if (correct) score++;
  updateScore(); $('progress').value = responses.length;
  document.querySelectorAll(q.type === 'position' ? '.location' : '.energy-choice').forEach(b => {
    b.disabled = true;
    if (b.dataset.answer === q.answer) b.classList.add('correct');
    else if (b.dataset.answer === choice) b.classList.add('incorrect');
  });
  drawEnergy(stateAt(q.time));
  $('energySubtitle').textContent = 'Energy revealed · the total is still 100%.';
  $('feedback').textContent = `${correct ? 'Correct! +1 point.' : 'Not quite. +0 points.'} ${q.explanation}`;
  $('next').textContent = questionIndex === questions.length - 1 ? 'See my score →' : 'Next question →';
  $('next').hidden = false;
}
function finish() {
  mode = 'done'; document.body.dataset.mode = mode;
  $('question').hidden = true; $('results').hidden = false; $('locations').hidden = true;
  $('mode').textContent = '03 · Complete'; $('instruction').textContent = 'You followed the energy through a full bounce and tested your predictions.';
  $('cycle').textContent = '5 questions complete'; $('sceneTitle').textContent = 'Energy is conserved';
  $('energyTitle').textContent = 'One system. Three energy forms.';
  $('energyEyebrow').textContent = 'ACTIVITY COMPLETE';
  $('energySubtitle').textContent = 'At the top, the energy is all gravitational PE.';
  $('resultTitle').textContent = `Your score: ${score} / ${questions.length}`;
  $('resultText').textContent = `${Math.round(score / questions.length * 100)}% correct. ${score === questions.length ? 'You tracked every energy transfer!' : 'Replay the bounces and try to improve your score.'}`;
  $('progressText').textContent = 'Five bounces observed · Five questions answered';
  drawModel(stateAt(0)); drawEnergy(stateAt(0));
  $('sceneDescription').textContent = 'The ball is at its release height of 3.8 meters. The spring is relaxed.';
  $('resultTitle').focus({preventScroll:true});
}
function restart() {
  mode = 'watch'; elapsed = 0; lastFrame = null; paused = false; questionIndex = 0; score = 0; responses = [];
  document.body.dataset.mode = mode; updateScore(); resetChoices(); questionElapsed = 0;
  $('question').hidden = true; $('results').hidden = true; $('locations').hidden = true; $('watchNote').hidden = false;
  $('mode').textContent = '01 · Watch'; $('instruction').textContent = 'Watch five complete bounces. Follow the energy as it changes form.';
  $('pause').hidden = false; $('pause').textContent = 'Pause animation';
  $('sceneTitle').textContent = 'Follow the ball'; $('cycle').textContent = 'Bounce 1 of 5';
  $('energyEyebrow').textContent = 'LIVE ENERGY'; $('energyTitle').textContent = 'Energy changes form.';
  $('energySubtitle').textContent = 'The total stays at 100% through every bounce.';
  $('sceneDescription').textContent = 'An ideal spring returns the ball to its release height. Energy changes between gravitational potential, kinetic, and spring potential energy.';
  $('progress').value = 0; $('progress').setAttribute('aria-label','Completed bounces');
  $('progressText').textContent = 'Watch 5 bounces → Answer 5 questions → See your score';
  drawModel(stateAt(0)); drawEnergy(stateAt(0));
}
function frame(time) {
  const dt = lastFrame === null ? 0 : Math.min((time - lastFrame) / 1000, 0.1);
  lastFrame = time;
  if (mode === 'watch' && !paused && !document.hidden) {
    elapsed = Math.min(elapsed + dt / SLOWDOWN, 5 * PERIOD);
    if (elapsed >= 5 * PERIOD) startQuestion();
    else {
      const completed = Math.floor(elapsed / PERIOD);
      $('cycle').textContent = `Bounce ${completed + 1} of 5`; $('progress').value = completed;
      drawModel(stateAt(elapsed)); drawEnergy(stateAt(elapsed));
    }
  } else if (mode === 'question-motion' && !paused && !document.hidden) {
    const q = questions[questionIndex], target = PERIOD + q.time;
    questionElapsed = Math.min(questionElapsed + dt / SLOWDOWN, target);
    if (questionElapsed >= target) showQuestion();
    else {
      // For the position question, conceal the approach after the full bounce
      // so the animation does not reveal which of the four locations to choose.
      drawModel(stateAt(questionElapsed), q.type === 'position' && questionElapsed >= PERIOD);
      $('sceneTitle').textContent = questionElapsed < PERIOD ? 'One full bounce, then stop' : q.type === 'position' ? 'Match the energy to a location' : 'Moving to the tested position';
    }
  }
  requestAnimationFrame(frame);
}
$('pause').addEventListener('click', () => { paused = !paused; $('pause').textContent = paused ? 'Resume animation' : 'Pause animation'; });
$('next').addEventListener('click', () => { if (mode !== 'quiz' || responses.length <= questionIndex) return; if (++questionIndex === questions.length) finish(); else startQuestion(); });
$('restart').addEventListener('click', restart);
document.querySelectorAll('.location').forEach(b => b.addEventListener('click', () => answer(b.dataset.answer)));
document.querySelectorAll('.energy-choice').forEach(b => b.addEventListener('click', () => answer(b.dataset.answer)));
document.addEventListener('visibilitychange', () => { lastFrame = null; });
restart(); requestAnimationFrame(frame);
