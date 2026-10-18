(() => {
  'use strict';
  const config = window.activityGroup, lesson = window.walkthroughLesson;
  const svg = document.getElementById('scene'), status = document.getElementById('status');
  const control = document.getElementById('parameter');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let elapsed = 0, last = null, step = 0, completed = false;
  const complete = () => { if (!completed) { completed = true; window.parent.postMessage({type: 'complete'}, '*'); } };
  const escape = value => value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
  function render() {
    const demo = config.group === 'demo', changed = control?.value === '1';
    const progress = demo ? reduced.matches ? 1 : Math.max(0, Math.min(1, (elapsed - 1400) / 4500)) : changed ? 1 : 0;
    const reveal = demo ? reduced.matches || elapsed >= 1400 : changed;
    const phase = demo ? progress === 1 ? 'complete' : reveal ? 'reveal' : 'watch' : 'explore';
    const result = Unit6Diagrams.render(lesson, {phase, reveal, progress, complete: progress === 1, compact: innerWidth <= 600, time: demo && !reduced.matches ? elapsed / 1000 : 0});
    let markup = result.markup, height = result.height;
    if (!demo) {
      // Keep the existing reference/comparison artwork and its validated two conditions.
      markup = markup.replaceAll('Before the change','Reference').replaceAll('After the change','Your setting');
      const c = config.control;
      const lines = step === 0 ? [c[3], 'Set '+c[0].toLowerCase()+' to '+c[2]+'.'] : step === 1 ? [c[4], 'Now restore '+c[1]+' and compare.'] : ['Baseline restored. Compare either setting.', c[3]];
      markup += lines.map((line,i)=>`<text x="${result.width/2}" y="${height+26+i*28}" text-anchor="middle" class="small">${escape(line)}</text>`).join('');
      height += 72;
      const message = lines.join(' '); if (status.textContent !== message) status.textContent = message;
    } else if (phase === 'complete') {
      if (status.textContent !== lesson.explanation) status.textContent = lesson.explanation;
      complete();
    }
    svg.setAttribute('viewBox', `0 0 ${result.width} ${height}`);
    svg.innerHTML = markup; svg.dataset.phase = phase; svg.dataset.step = step;
    svg.setAttribute('aria-label', lesson.title + '. ' + (demo ? lesson.explanation : status.textContent));
  }
  control?.addEventListener('change', () => {
    if (step === 0 && control.value === '1') step = 1;
    else if (step === 1 && control.value === '0') { step = 2; complete(); }
    render();
  });
  document.getElementById('replay').addEventListener('click', () => {
    elapsed = 0; last = null; step = 0; status.textContent = '';
    if (control) control.value = '0'; render();
  });
  function frame(now) {
    const delta = last === null ? 0 : Math.min(100, now-last); last = now;
    if (config.group === 'demo' && !reduced.matches && !document.hidden) {
      elapsed += delta; if (elapsed >= 8900) elapsed = 0; render();
    }
    requestAnimationFrame(frame);
  }
  addEventListener('resize', render); reduced.addEventListener('change', render);
  render(); requestAnimationFrame(frame);
})();
