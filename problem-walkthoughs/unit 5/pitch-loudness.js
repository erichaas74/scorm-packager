(() => {
  'use strict';
  const { label, line, path, sample, graph, arrow, blue, rust, ink } = window.Unit5Diagrams.helpers;
  const scene = document.getElementById('scene');
  const status = document.getElementById('status');
  const replay = document.getElementById('replay');
  const choices = [...document.querySelectorAll('[data-choice]')];
  const compact = window.matchMedia('(max-width: 760px)');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const cases = [
    { topic: 'loudness', amplitude: 2, period: 5, answer: 1 },
    { topic: 'pitch', amplitude: 1.4, period: 10, answer: 0 },
    { topic: 'loudness', amplitude: 1.4, period: 2.5, answer: 2 },
    { topic: 'pitch', amplitude: .7, period: 2.5, answer: 1 },
    { topic: 'loudness', amplitude: .7, period: 2.5, answer: 0 },
    { topic: 'pitch', amplitude: 2, period: 5, answer: 2 }
  ];
  let caseIndex = 0, phase = 'reference', selected = null, timer;
  function startComparison() {
    clearTimeout(timer);
    phase = 'reference';
    selected = null;
    render();
    timer = setTimeout(() => {
      phase = reduced.matches ? 'question' : 'enter';
      render();
      if (phase === 'enter') timer = setTimeout(() => { phase = 'question'; render(); }, 1000);
    }, 2400);
  }
  function render() {
    const width = compact.matches ? 420 : 840;
    const current = cases[caseIndex];
    const loudness = current.topic === 'loudness';
    const answers = loudness ? ['Wave A is louder', 'Wave B is louder', 'Same loudness'] : ['Wave A has higher pitch', 'Wave B has higher pitch', 'Same pitch'];
    const chart = graph({ width, baseline: 230, top: 115, bottom: 335, xmax: 10, ticks: [0, 5, 10], xlabel: 'Time (ms)', ylabel: 'Pressure change (Pa)' });
    let drawing = line(25, 30, 60, 30, blue, 3, '7 4') + label(70, 36, 'Wave A', 'start', 'strong');
    if (phase !== 'reference') drawing += line(width / 2 + 5, 30, width / 2 + 40, 30, rust, 4) + label(width / 2 + 50, 36, 'Wave B', 'start', 'strong');
    for (let t = 0; t <= 10; t++) {
      const x = chart.left + t * chart.scale;
      drawing += line(x, 120, x, 330, '#e5edf2', 1);
    }
    for (const value of [-2, -1, 0, 1, 2]) {
      const y = 230 - value * 45;
      drawing += line(chart.left, y, chart.right, y, value === 0 ? ink : '#e5edf2', value === 0 ? 2 : 1);
      drawing += line(chart.left - 5, y, chart.left, y, ink) + label(chart.left - 12, y + 6, value, 'end', 'small');
    }
    drawing += chart.markup;
    const wave = (amplitude, period) => sample(chart.left, chart.right, x => 230 - amplitude * 45 * Math.sin((x - chart.left) / chart.scale * 2 * Math.PI / period), 400);
    if (phase !== 'reference') {
      drawing += `<defs><clipPath id="wave-reveal"><rect x="${chart.left}" y="115" width="${chart.right - chart.left}" height="220" class="${phase === 'enter' ? 'wave-reveal' : ''}"/></clipPath></defs>`;
      drawing += `<g data-wave="B" clip-path="url(#wave-reveal)">${path(wave(current.amplitude, current.period), rust, 4)}</g>`;
    }
    drawing += `<g data-wave="A">${path(wave(1.4, 5), blue, 3, '7 4')}</g>`;
    if (phase === 'feedback') {
      const measurement = (x, y, text, color, highlighted) => {
        const size = 124;
        return `<rect x="${x - size / 2}" y="${y - 21}" width="${size}" height="29" rx="5" fill="${highlighted ? '#fff0a8' : '#fff'}" stroke="${color}" stroke-width="${highlighted ? 2.5 : 1}"/>` + label(x, y, text, 'middle', 'small');
      };
      if (loudness) {
        for (const [position, amplitude, name, color, index] of [[1.25, 1.4, 'A', blue, 0], [current.period === 2.5 ? 8.125 : 6.25, current.amplitude, 'B', rust, 1]]) {
          const x = chart.left + position * chart.scale;
          const top = 230 - amplitude * 45;
          const highlighted = current.answer === index || current.answer === 2;
          if (highlighted) drawing += line(x, 230, x, top, '#ffe278', 10);
          drawing += arrow(x, 230, x, top, color, 3, true);
          drawing += measurement(Math.max(chart.left + 62, Math.min(chart.right - 62, x)), top - 15, `${name}: ${amplitude} Pa`, color, highlighted);
        }
      } else {
        for (const [period, name, color, y, index] of [[5, 'A', blue, 155, 0], [current.period, 'B', rust, 305, 1]]) {
          const start = chart.left, end = start + period * chart.scale;
          const highlighted = current.answer === index || current.answer === 2;
          drawing += line(start, 230, start, y, color, 1, '3 4') + line(end, 230, end, y, color, 1, '3 4');
          if (highlighted) drawing += line(start, y, end, y, '#ffe278', 10);
          drawing += line(start, y - 7, start, y + 7, color, 2) + line(end, y - 7, end, y + 7, color, 2) + arrow(start, y, end, y, color, 3, true);
          drawing += measurement(Math.max(chart.left + 62, (start + end) / 2), y - 14, `${name}: ${1000 / period} Hz`, color, highlighted);
        }
      }
    }
    scene.setAttribute('viewBox', `0 0 ${width} 405`);
    scene.innerHTML = drawing;
    scene.dataset.phase = phase;
    scene.dataset.case = caseIndex;
    const description = `Wave A: amplitude 1.4 Pa, frequency 200 Hz.${phase === 'reference' ? '' : ` Wave B: amplitude ${current.amplitude} Pa, frequency ${1000 / current.period} Hz.`} ${phase === 'feedback' ? answers[current.answer] + '.' : ''}`;
    scene.setAttribute('aria-label', description);
    status.textContent = description;
    choices.forEach((button, index) => {
      button.hidden = phase !== 'question';
      const swatch = wave => `<span class="wave-swatch wave-swatch-${wave}" aria-hidden="true"></span>`;
      button.innerHTML = `<span class="button-swatches">${index === 0 ? swatch('a') : index === 1 ? swatch('b') : swatch('a') + swatch('b')}</span><span>${answers[index]}</span>`;
      button.setAttribute('aria-label', answers[index]);
    });
  }
  choices.forEach(button => button.addEventListener('click', () => {
    if (phase !== 'question') return;
    selected = Number(button.dataset.choice);
    phase = 'feedback';
    render();
    replay.focus({ preventScroll: true });
    timer = setTimeout(() => { caseIndex = (caseIndex + 1) % cases.length; startComparison(); }, 6500);
    if (caseIndex === cases.length - 1) window.parent.postMessage({ type: 'complete' }, '*');
  }));
  replay.addEventListener('click', startComparison);
  compact.addEventListener('change', render);
  startComparison();
})();
