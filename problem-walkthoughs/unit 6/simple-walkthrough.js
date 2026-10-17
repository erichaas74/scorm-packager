(() => {
  'use strict';
  const lesson = window.walkthroughLesson;
  const svg = document.getElementById('scene');
  const prompt = document.getElementById('prompt');
  const explanation = document.getElementById('explanation');
  const pauseButton = document.getElementById('pause');
  const replayButton = document.getElementById('replay');
  const choices = [...document.querySelectorAll('[data-choice]')];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let phase = 'watch';
  let elapsed = 0;
  let lastTime = null;
  let paused = false;
  let selected = null;
  let completionSent = false;
  const revealDuration = 6500;

  function render() {
    const revealed = phase === 'reveal' || phase === 'complete';
    const progress = phase === 'complete' ? 1 : phase === 'reveal' ? Math.min(1, elapsed / revealDuration) : 0;
    const result = window.Unit6Diagrams.render(lesson, { phase, reveal: revealed, progress, complete: phase === 'complete', compact: innerWidth <= 600, time: reducedMotion.matches ? 0 : elapsed / 1000 });
    svg.setAttribute('viewBox', '0 0 ' + result.width + ' ' + result.height);
    svg.innerHTML = result.markup;
    svg.dataset.phase = phase;
  }

  function setPhase(next) {
    phase = next;
    elapsed = 0;
    choices.forEach(button => { button.hidden = phase !== 'predict'; button.disabled = phase !== 'predict'; });
    pauseButton.hidden = phase === 'predict' || phase === 'complete';
    if (phase === 'watch') {
      prompt.textContent = 'Watch the setup.';
      explanation.textContent = '';
      svg.setAttribute('aria-label', lesson.title + '. ' + lesson.question);
    } else if (phase === 'predict') {
      prompt.textContent = lesson.question;
      explanation.textContent = '';
    } else if (phase === 'reveal') {
      prompt.textContent = 'Watch what happens.';
      explanation.textContent = '';
    } else {
      prompt.textContent = selected === lesson.correct ? 'Correct.' : 'Here is what happens.';
      explanation.textContent = lesson.explanation;
      svg.setAttribute('aria-label', lesson.explanation);
      if (!completionSent) {
        completionSent = true;
        window.parent.postMessage({ type: 'complete' }, '*');
      }
    }
    render();
  }

  function choose(index) {
    if (phase !== 'predict') return;
    selected = index;
    paused = false;
    pauseButton.textContent = 'Pause';
    setPhase(reducedMotion.matches ? 'complete' : 'reveal');
    replayButton.focus({ preventScroll: true });
  }

  function restart() {
    paused = false;
    selected = null;
    lastTime = null;
    pauseButton.textContent = 'Pause';
    setPhase(reducedMotion.matches ? 'predict' : 'watch');
  }

  function frame(timestamp) {
    const delta = lastTime === null ? 0 : Math.min(100, timestamp - lastTime);
    lastTime = timestamp;
    if (!paused && (phase === 'watch' || phase === 'reveal')) {
      elapsed += delta;
      if (phase === 'watch' && elapsed >= 2400) setPhase('predict');
      else if (phase === 'reveal' && elapsed >= revealDuration) setPhase('complete');
      else render();
    }
    requestAnimationFrame(frame);
  }

  choices.forEach(button => button.addEventListener('click', () => choose(Number(button.dataset.choice))));
  pauseButton.addEventListener('click', () => { paused = !paused; pauseButton.textContent = paused ? 'Play' : 'Pause'; });
  replayButton.addEventListener('click', restart);
  window.addEventListener('resize', render);
  restart();
  requestAnimationFrame(frame);
})();

