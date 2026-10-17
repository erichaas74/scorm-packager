(() => {
  'use strict';
  const lesson = window.walkthroughLesson;
  const scene = document.getElementById('scene');
  const prompt = document.getElementById('prompt');
  const explanation = document.getElementById('explanation');
  const pauseButton = document.getElementById('pause');
  const replayButton = document.getElementById('replay');
  const stepButton = document.getElementById('step');
  const choices = [...document.querySelectorAll('[data-choice]')];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const compact = window.matchMedia('(max-width: 760px)');
  const durations = { watch: 2400, reveal: 6500, complete: 5000, increase: 8000, critical: 2500, sine: 3500, simplify: 3500, divide: 4000, inverse: 4000, result: 4000, reflection: 4000, hold: 6500 };
  const criticalPhases = ['increase', 'critical', 'sine', 'simplify', 'divide', 'inverse', 'result', 'reflection', 'hold'];
  let phase, elapsed = 0, lastTime = null, selected = null, caseIndex = 0, paused = false, completed = false;
  const isCritical = lesson.type === 'critical';
  const isRefraction = lesson.type === 'refraction';
  function correctIndex() {
    if (!isRefraction) return lesson.correct;
    const material = lesson.cases[caseIndex];
    return material.n2 > material.n1 ? 0 : 1;
  }
  function explanationText() {
    if (!isRefraction) return lesson.explanation;
    const material = lesson.cases[caseIndex];
    return material.n2 > material.n1 ? 'The entering index is higher. Light slows down; the angle to the normal decreases.' : 'The entering index is lower. Light speeds up; the angle to the normal increases.';
  }
  function render() {
    const reveal = phase === 'reveal' || phase === 'complete';
    const progress = phase === 'complete' ? 1 : Math.min(1, elapsed / durations[phase]);
    const time = phase === 'watch' ? elapsed / 1000 : phase === 'predict' ? 2.4 : 2.4 + progress * 5;
    const state = { phase, elapsed, progress, time: reducedMotion.matches ? 0 : time, reveal, complete: phase === 'complete', compact: compact.matches, caseIndex };
    const diagram = window.Unit5Diagrams.render(lesson, state);
    scene.setAttribute('viewBox', `0 0 ${diagram.width} ${diagram.height}`);
    scene.innerHTML = diagram.markup;
    scene.setAttribute('aria-label', `${lesson.title}. ${[...scene.querySelectorAll('text')].map(element => element.textContent).join('. ')}. ${prompt.textContent} ${explanation.textContent}`);
    scene.dataset.phase = phase;
    scene.dataset.case = caseIndex;
  }
  function signalCompletion() {
    if (completed) return;
    completed = true;
    window.parent.postMessage({ type: 'complete' }, '*');
  }
  function setPhase(next) {
    phase = next;
    elapsed = 0;
    choices.forEach(button => { button.hidden = phase !== 'predict'; button.disabled = phase !== 'predict'; });
    if (pauseButton) pauseButton.hidden = phase === 'predict' || (phase === 'complete' && !isRefraction) || (isCritical && reducedMotion.matches);
    stepButton.hidden = !(isCritical && reducedMotion.matches);
    explanation.textContent = '';
    if (isCritical) {
      const messages = {
        increase: ['Watch both angles increase.', 'Both angles are measured from the dashed normal.'],
        critical: ['The refracted angle reaches 90°.', 'The limiting refracted ray lies along the boundary.'],
        sine: ['Use Snell’s law at the critical angle.', 'First replace sin(90°) with 1.'],
        simplify: ['Substitute the two indices.', 'Multiplying by 1 leaves the right side unchanged.'],
        divide: ['Isolate sin θc.', 'Divide both sides by the index of the starting material.'],
        inverse: ['Solve for the angle.', 'Take inverse sine, using degrees.'],
        result: ['The critical angle is the limiting angle.', 'Next, increase the incident angle beyond it.'],
        reflection: ['Above the critical angle, the ray reflects inside.', 'There is no propagating refracted ray into the air.'],
        hold: ['Total internal reflection.', 'At an ideal lossless interface, all incident light reflects inside. This requires higher to lower index and an incident angle above the critical angle.']
      };
      prompt.textContent = messages[phase][0];
      explanation.textContent = messages[phase][1];
      if (phase === 'hold' && caseIndex === lesson.cases.length - 1) signalCompletion();
    } else if (phase === 'watch') prompt.textContent = 'Watch the setup.';
    else if (phase === 'predict') prompt.textContent = lesson.question;
    else if (phase === 'reveal') prompt.textContent = 'Watch the evidence.';
    else {
      prompt.textContent = selected === correctIndex() ? 'Correct.' : 'Here is what happens.';
      explanation.textContent = explanationText();
      if (!isRefraction || caseIndex === lesson.cases.length - 1) signalCompletion();
    }
    scene.setAttribute('aria-label', `${lesson.title}. ${prompt.textContent} ${explanation.textContent}`);
    render();
  }
  function advanceCritical() {
    if (phase === 'hold') { caseIndex = (caseIndex + 1) % lesson.cases.length; setPhase('increase'); }
    else setPhase(criticalPhases[criticalPhases.indexOf(phase) + 1]);
  }
  function restart() {
    elapsed = 0;
    lastTime = null;
    selected = null;
    caseIndex = 0;
    paused = false;
    if (pauseButton) pauseButton.textContent = 'Pause';
    setPhase(isCritical ? 'increase' : reducedMotion.matches ? 'predict' : 'watch');
  }
  choices.forEach(button => button.addEventListener('click', () => {
    if (phase !== 'predict') return;
    selected = Number(button.dataset.choice);
    setPhase(reducedMotion.matches ? 'complete' : 'reveal');
    replayButton.focus({ preventScroll: true });
  }));
  pauseButton?.addEventListener('click', () => { paused = !paused; pauseButton.textContent = paused ? 'Play' : 'Pause'; });
  replayButton.addEventListener('click', restart);
  stepButton.addEventListener('click', advanceCritical);
  compact.addEventListener('change', render);
  reducedMotion.addEventListener('change', restart);
  function frame(timestamp) {
    const delta = lastTime === null ? 0 : Math.min(100, timestamp - lastTime);
    lastTime = timestamp;
    if (!paused && phase !== 'predict' && !(phase === 'complete' && !isRefraction) && !(isCritical && reducedMotion.matches)) {
      elapsed += delta;
      if (elapsed >= durations[phase]) {
        if (isCritical) advanceCritical();
        else if (phase === 'watch') setPhase('predict');
        else if (phase === 'reveal') setPhase('complete');
        else { caseIndex = (caseIndex + 1) % lesson.cases.length; selected = null; setPhase(reducedMotion.matches ? 'predict' : 'watch'); }
      } else if (phase !== 'complete') render();
    }
    requestAnimationFrame(frame);
  }
  restart();
  requestAnimationFrame(frame);
})();
