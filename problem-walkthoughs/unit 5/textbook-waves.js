(() => {
  'use strict';
  const { label, line, path, box, dot, arrow, sample, dimension, graph, panels, single, ink, blue, teal, rust, muted } = window.Unit5Diagrams.helpers;
  function interference(state) {
    const width = state.compact ? 420 : 840;
    const progress = state.reveal ? state.progress : 0;
    const travel = progress < .33 ? progress / .33 : progress <= .55 ? 1 : 1 + (progress - .55) / .45;
    const centerA = 1.2 + 1.8 * travel;
    const centerB = 6 - centerA;
    const overlapping = progress >= .33 && progress <= .55;
    const separated = progress > .55;
    const chart = graph({ width, baseline: 330, top: 100, bottom: 350, xmax: 6, ticks: [0, 2, 4, 6] });
    const amplitude = 105;
    const displacement = (position, center) => Math.exp(-(((position - center) / .48) ** 2));
    const component = center => sample(chart.left, chart.right, position => 330 - amplitude * displacement((position - chart.left) / chart.scale, center), 300);
    let drawing = `<g data-pulse-a="${centerA}" data-pulse-b="${centerB}" data-overlap="${overlapping}">`;
    drawing += label(width / 2, 34, 'Actual rope = sum of both pulses', 'middle', 'strong') + chart.markup;
    for (const value of [0, 1, 2]) {
      const vertical = 330 - value * amplitude;
      drawing += line(chart.left - 5, vertical, chart.left, vertical, ink) + label(35, vertical + 6, value, 'end');
    }
    if (Math.abs(centerA - centerB) < 1.3) {
      drawing += path(component(centerA), blue, 2, '6 5') + path(component(centerB), rust, 2, '3 6');
    }
    drawing += path(sample(chart.left, chart.right, position => {
      const distance = (position - chart.left) / chart.scale;
      return 330 - amplitude * (displacement(distance, centerA) + displacement(distance, centerB));
    }, 300), teal, 4);
    if (Math.abs(centerA - centerB) >= 1.3) {
      for (const [center, name, direction, color] of [[centerA, 'A', 1, blue], [centerB, 'B', -1, rust]]) {
        const horizontal = chart.left + center * chart.scale;
        drawing += dot(horizontal, 225, 5, color) + label(horizontal, 190, `${name}: 1 cm`, 'middle');
        drawing += arrow(horizontal - direction * 22, 155, horizontal + direction * 22, 155, color, 3);
      }
    }
    if (overlapping) {
      drawing += label(width / 2, 447, 'At overlap: 1 cm + 1 cm = 2 cm', 'middle', 'strong') + label(width / 2, 484, 'Dashed curves: individual pulses', 'middle', 'small');
    } else if (separated) {
      drawing += label(width / 2, 447, 'They pass through, not bounce back.', 'middle', 'small') + label(width / 2, 484, 'Same shape, height and directions.', 'middle', 'small');
    } else {
      drawing += label(width / 2, 447, 'A travels right; B travels left.', 'middle') + label(width / 2, 484, 'Watch the rope as they overlap.', 'middle', 'small');
    }
    return single(drawing + '</g>', width, 510);
  }
  function wave(lesson, state) {
    const { reveal, progress, time, compact } = state;
    const width = compact ? 420 : 840;
    const variant = lesson.variant;
    if (variant === 'interference') return interference(state);
    const phase = state.complete ? 0 : time * 2;
    if (['frequency', 'pitch'].includes(variant)) {
      return panels([0, 1].map(index => {
        const frequency = variant === 'frequency';
        const chart = graph({ xmax: frequency ? 4 : 10, ticks: frequency ? [0, 1, 2, 3, 4] : [0, 5, 10], xlabel: frequency ? 'Position (m)' : 'Time (ms)', ylabel: frequency ? 'Displacement (cm)' : 'Pressure change (Pa)' });
        const period = frequency ? (index ? 1 : 2) : 5;
        const amplitude = frequency ? 35 : index ? 65 : 32.5;
        let drawing = label(25, 32, index ? 'After the change' : 'Before the change', 'start', 'strong') + chart.markup;
        drawing += line(chart.left - 5, 210 - amplitude, chart.left, 210 - amplitude, ink) + label(25, 216 - amplitude, frequency ? '1' : index ? '2' : '1', 'middle', 'small');
        if (!index || reveal || !frequency) drawing += path(sample(chart.left, chart.right, position => 210 - amplitude * Math.sin((position - chart.left) / chart.scale * 2 * Math.PI / period)));
        else drawing += label(210, 155, 'Predict the wavelength', 'middle');
        if (frequency) {
          drawing += label(200, 385, `f = ${index ? 8 : 4} Hz; v = 8 m/s`, 'middle');
          if (reveal) drawing += dimension(chart.left + .25 * period * chart.scale, chart.left + 1.25 * period * chart.scale, 125, `λ = ${period} m`);
        } else drawing += label(200, 385, reveal ? 'Same period: 5 ms → 200 Hz' : 'Same time scale in both graphs', 'middle', 'small');
        return { markup: drawing, height: 410 };
      }), compact);
    }
    if (['longitudinal', 'compression'].includes(variant)) {
      const left = 40, right = width - 40, wavelength = (right - left) / 2;
      const amplitude = wavelength * .095;
      let drawing = label(width / 2, 34, 'Energy travels; matter oscillates', 'middle', 'strong') + arrow(width / 2 - 65, 70, width / 2 + 65, 70) + label(width / 2, 100, 'Wave direction', 'middle');
      const spring = lesson.title === 'A Longitudinal Wave';
      const offset = reveal && state.complete ? 0 : phase;
      for (let column = 0; column <= 48; column++) {
        const origin = left + (right - left) * column / 48;
        const position = origin + amplitude * Math.sin(2 * Math.PI * (origin - left) / wavelength - offset);
        if (spring) drawing += `<ellipse cx="${position}" cy="210" rx="7" ry="48" fill="none" stroke="${column === 24 ? rust : teal}" stroke-width="${column === 24 ? 4 : 1.8}"/>`;
        else for (let row = 0; row < 5; row++) drawing += dot(position, 165 + row * 22, row === 2 && column === 24 ? 6 : 3, row === 2 && column === 24 ? rust : teal);
      }
      const origin = width / 2;
      drawing += line(origin, 140, origin, 285, rust, 1.5, '4 5') + label(origin, 310, 'One equilibrium position', 'middle', 'small');
      if (reveal) {
        drawing += arrow(origin - amplitude, 340, origin + amplitude, 340, rust, 2, true) + label(origin, 375, 'Particle motion: back and forth', 'middle');
        if (state.complete) {
          const compressionX = left + wavelength / 2;
          drawing += line(compressionX, 140, compressionX, 155, ink) + label(compressionX, 135, 'Compression', 'middle', 'small');
          drawing += line(left + wavelength, 265, left + wavelength, 279, ink);
          drawing += label(width / 2, 420, 'Close spacing = greater density', 'middle');
        }
      }
      return single(drawing, width, 445);
    }
    if (variant === 'standing') {
      const left = 55, right = width - 30, span = right - left;
      let drawing = label(width / 2, 32, 'Same amplitude, frequency and wavelength', 'middle', 'small');
      const rows = [{ y: 120, title: 'Right-moving wave', sign: -1, color: blue }, { y: 260, title: 'Left-moving wave', sign: 1, color: rust }, { y: 435, title: 'Sum on the same string', sign: 0, color: teal }];
      for (const row of rows) {
        drawing += label(left, row.y - 55, row.title) + line(left, row.y, right, row.y, muted, 1, '5 5');
        if (row.sign || reveal) drawing += path(sample(left, right, position => row.y - (row.sign ? 28 * Math.sin(4 * Math.PI * (position - left) / span + row.sign * phase) : 56 * Math.sin(4 * Math.PI * (position - left) / span) * Math.cos(phase))), row.color);
        if (row.sign) drawing += arrow(row.sign < 0 ? right - 65 : right, row.y - 55, row.sign < 0 ? right : right - 65, row.y - 55, row.color);
      }
      if (reveal) {
        for (let node = 0; node <= 4; node++) drawing += dot(left + span * node / 4, 435, 5, ink);
        drawing += line(left + span / 4, 440, left + span / 4, 510, ink) + label(left + span / 4, 535, 'Node: always still', 'middle', 'small');
        drawing += arrow(left + span * .625, 379, left + span * .625, 491, rust, 1.5, true) + label(left + span * .625, 570, 'Antinode: largest motion', 'middle', 'small');
      }
      return single(drawing, width, 595);
    }
    if (variant === 'beats') {
      const chart = graph({ width, baseline: 240, top: 115, bottom: 330, xmax: 1, ticks: [0, .25, .5, .75, 1], xlabel: 'Time (s)', ylabel: 'Sound pressure (relative)' });
      let drawing = label(width / 2, 35, '440 Hz + 444 Hz', 'middle', 'strong') + chart.markup;
      if (reveal) {
        drawing += path(sample(chart.left, chart.right, position => { const seconds = (position - chart.left) / chart.scale; return 240 - 34 * (Math.sin(2 * Math.PI * 440 * seconds) + Math.sin(2 * Math.PI * 444 * seconds)); }, 3500), '#8fb8be', 1);
        for (const direction of [-1, 1]) drawing += path(sample(chart.left, chart.right, position => 240 + direction * 68 * Math.abs(Math.cos(4 * Math.PI * (position - chart.left) / chart.scale))), teal, 2.5);
        drawing += dimension(chart.left, chart.left + chart.scale / 4, 150, '0.25 s') + label(width / 2, 420, '4 loudness cycles in 1 second', 'middle') + label(width / 2, 458, 'fbeat = |444 − 440| = 4 Hz', 'middle');
      } else drawing += label(width / 2, 180, 'How often will loudness peak?', 'middle');
      return single(drawing, width, 485);
    }
    const period = variant === 'period';
    const chart = graph({ width, baseline: 245, top: 120, bottom: 330, xmax: period ? 1 : 6, ticks: period ? [0, .5, 1] : [0, 2, 4, 6], xlabel: period ? 'Time (s)' : 'Position (m)' });
    const amplitude = 60;
    let drawing = chart.markup + label(33, 190, '+3', 'middle', 'small') + label(33, 251, '0', 'middle', 'small') + label(33, 310, '−3', 'middle', 'small');
    if (['pulse', 'boundary'].includes(variant)) {
      const center = variant === 'boundary' ? 4 + (reveal ? progress * 6 : 0) : 1 + (reveal ? progress * 3 : 0);
      const displacement = position => {
        const distance = (position - chart.left) / chart.scale;
        const pulse = origin => Math.exp(-(((distance - origin) / .28) ** 2));
        return variant === 'boundary' ? 60 * (pulse(center) - pulse(12 - center)) : 60 * pulse(center);
      };
      drawing += path(sample(chart.left, chart.right, position => 245 - displacement(position)));
      if (variant === 'boundary') {
        drawing += box(chart.right, 145, 12, 180, '#d9e3e9') + label(chart.right, 100, 'Fixed end', 'end');
        for (let hatch = 150; hatch < 320; hatch += 15) drawing += line(chart.right, hatch + 10, chart.right + 10, hatch, muted);
        drawing += dot(chart.right, 245, 4, ink) + arrow(center >= 6 ? chart.right - 20 : chart.left + 80, 150, center >= 6 ? chart.right - 85 : chart.left + 145, 150);
        if (reveal) drawing += label(width / 2, 430, 'Fixed end stays at y = 0', 'middle') + label(width / 2, 467, center > 6 ? 'Reflected pulse is inverted' : 'The incident pulse approaches the end', 'middle');
      } else {
        drawing += label(width / 2, 42, 'One disturbance at the source', 'middle') + arrow(chart.left + 80, 140, chart.left + 155, 140);
        if (reveal) drawing += label(width / 2, 430, 'One pulse carries the disturbance', 'middle');
      }
      return single(drawing, width, 490);
    }
    const fixed = ['amplitude', 'wavelength', 'period'].includes(variant);
    const offset = fixed ? 0 : phase;
    const wavelength = period ? .5 : 2;
    drawing += path(sample(chart.left, chart.right, position => 245 - amplitude * Math.sin((position - chart.left) / chart.scale * 2 * Math.PI / wavelength - offset)));
    drawing += label(width / 2, 36, period ? 'One point oscillates at 2 Hz' : 'A snapshot of the rope', 'middle', 'strong');
    if (variant === 'amplitude') {
      const crest = chart.left + chart.scale * .5;
      drawing += line(crest, 185, crest + 30, 185, rust) + arrow(crest + 30, 245, crest + 30, 185, rust, 2, true) + label(crest + 40, 216, '3 cm');
      if (reveal) drawing += label(width / 2, 430, 'A = 3 cm, not crest to trough', 'middle');
    } else if (variant === 'wavelength') {
      for (const position of [.5, 2.5]) drawing += dot(chart.left + position * chart.scale, 185, 5, rust);
      if (reveal) drawing += dimension(chart.left + .5 * chart.scale, chart.left + 2.5 * chart.scale, 140, 'λ = 2 m') + label(width / 2, 430, 'Matching points, one cycle apart', 'middle');
    } else if (period) {
      const moment = state.complete ? .5 : Math.min(.5, time / 8);
      drawing += dot(chart.left + moment * chart.scale, 245 - amplitude * Math.sin(4 * Math.PI * moment), 6, rust);
      if (reveal) drawing += dimension(chart.left, chart.left + .5 * chart.scale, 140, 'T = 0.5 s') + label(width / 2, 430, 'T = 1/f = 1/2 = 0.5 s', 'middle');
    } else {
      const position = chart.left + chart.scale * 3;
      drawing += line(position, 170, position, 320, rust, 1.4, '4 5') + dot(position, 245 - amplitude * Math.sin(3 * Math.PI - offset), 7, rust);
      drawing += arrow(width / 2 - 45, 75, width / 2 + 45, 75) + label(width / 2 + 65, 82, 'Energy', 'start', 'small');
      if (reveal) drawing += arrow(position + 24, 185, position + 24, 305, rust, 2, true) + label(width / 2, 430, 'Particle: up and down at fixed x', 'middle');
    }
    return single(drawing, width, 460);
  }
  window.Unit5Diagrams.scenes.wave = wave;
})();
