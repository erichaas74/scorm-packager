(() => {
  'use strict';
  const { label, line, path, box, dot, arrow, sample, dimension, graph, panels, single, ink, blue, teal, rust, muted } = window.Unit5Diagrams.helpers;
  function intensity(lesson, state) {
    let spheres = label(200, 35, 'Same power spreads outward', 'middle', 'strong');
    spheres += `<circle cx="200" cy="220" r="140" fill="#f1f7fb" stroke="${blue}" stroke-width="2"/><circle cx="200" cy="220" r="70" fill="#e4f1f1" stroke="${teal}" stroke-width="2"/>` + dot(200, 220, 9, rust);
    spheres += arrow(200, 220, 270, 220, teal, 1.6) + label(235, 205, 'r', 'middle') + arrow(200, 220, 101, 121, blue, 1.6) + label(135, 149, '2r', 'middle');
    spheres += label(200, 395, 'Cross-section of spherical fronts', 'middle', 'small') + label(200, 438, 'No absorption; point-source model', 'middle', 'small');
    let areas = label(200, 35, 'Double r → four times the area', 'middle', 'small');
    areas += box(80, 110, 64, 64, '#d7eded', teal) + label(112, 90, 'At r', 'middle') + label(112, 210, '1 area unit', 'middle', 'small');
    for (let column = 0; column < 2; column++) for (let row = 0; row < 2; row++) areas += box(220 + column * 64, 110 + row * 64, 64, 64, '#e5eef7', blue);
    areas += label(284, 90, 'At 2r', 'middle') + label(284, 275, '4 area units', 'middle', 'small');
    if (state.reveal) areas += label(200, 325, 'Same power ÷ 4 times the area', 'middle', 'small') + label(200, 370, 'I₂ = I₁ / 4', 'middle', 'strong');
    areas += label(200, 420, 'Sphere area = 4πr²; I = P/(4πr²)', 'middle', 'small') + label(200, 460, 'Squares compare areas, not detectors', 'middle', 'small');
    return panels([{ markup: spheres, height: 485 }, { markup: areas, height: 485 }], state.compact);
  }
  function oscillator(lesson, state) {
    const resonance = lesson.variant === 'resonance';
    const amplitude = resonance ? 15 + (state.reveal ? 75 * (1 - Math.exp(-3 * state.progress)) : 0) : 90;
    const phase = state.complete ? (resonance ? Math.PI / 2 : 0) : state.time * 2;
    const position = 220 + amplitude * Math.sin(phase), speed = 65 * Math.cos(phase);
    let mechanism = label(200, 35, resonance ? 'Push at the natural frequency' : 'Mass on an ideal spring', 'middle', 'strong');
    mechanism += box(25, 133, 15, 130, '#dbe5eb') + line(40, 253, 380, 253, muted, 2);
    mechanism += line(220, 105, 220, 285, muted, 1.4, '5 5');
    const spring = [[40, 205], [50, 205]];
    for (let coil = 0; coil <= 20; coil++) spring.push([50 + (position - 90) * coil / 20, 205 + (coil % 2 ? -12 : 12)]);
    spring.push([position - 30, 205]);
    mechanism += path(spring, blue, 2) + box(position - 30, 175, 60, 60, '#d7ecec', teal, 3);
    for (const end of [220 - amplitude, 220 + amplitude]) mechanism += line(end, 258, end, 271, ink);
    mechanism += label(220, 307, 'Equilibrium, x = 0', 'middle');
    if (!resonance) mechanism += label(130, 350, '−A', 'middle') + label(310, 350, '+A', 'middle');
    if (state.reveal) mechanism += arrow(position, 145, position + speed, 145, rust) + label(200, 100, resonance ? 'Timed push transfers energy' : 'Velocity changes during the cycle', 'middle', 'small');
    if (resonance) mechanism += dimension(220, 220 + amplitude, 390, 'A');
    else mechanism += label(200, 405, 'Turning points: v = 0', 'middle');
    let evidence = label(200, 35, resonance ? 'Amplitude grows, then levels off' : 'Energy changes form', 'middle', 'small');
    if (resonance) {
      const chart = graph({ baseline: 310, top: 105, bottom: 310, xmax: 10, ticks: [0, 5, 10], xlabel: 'Number of timed pushes', ylabel: 'Amplitude (relative)' });
      evidence += chart.markup;
      if (state.reveal) evidence += path(sample(chart.left, chart.left + (chart.right - chart.left) * state.progress, position => 310 - (30 + 150 * (1 - Math.exp(-3 * (position - chart.left) / (chart.right - chart.left)))))) + line(chart.left, 130, chart.right, 130, muted, 1.3, '5 5') + label(200, 440, 'Damping limits the final amplitude', 'middle', 'small');
    } else {
      const potential = Math.sin(phase) ** 2, kinetic = Math.cos(phase) ** 2;
      for (const [center, fraction, name, color] of [[115, kinetic, 'Kinetic', teal], [285, potential, 'Spring', blue]]) {
        evidence += box(center - 35, 135, 70, 180, '#f1f5f8');
        if (state.reveal) evidence += box(center - 35, 315 - 180 * fraction, 70, 180 * fraction, name === 'Kinetic' ? '#c9e7e5' : '#d1e2f2', color);
        evidence += label(center, 352, name, 'middle');
      }
      evidence += label(200, 397, 'Total mechanical energy is constant', 'middle', 'small');
      if (state.reveal) evidence += label(200, 440, 'At equilibrium: maximum speed', 'middle', 'small');
    }
    return panels([{ markup: mechanism, height: 465 }, { markup: evidence, height: 465 }], state.compact);
  }
  function harmonics(lesson, state) {
    const width = state.compact ? 420 : 840, left = 60, right = width - 50;
    let drawing = label(width / 2, 35, 'Air displacement, not air pressure', 'middle', 'strong');
    drawing += box(left, 130, right - left, 150, '#f0f7fa', 'none') + line(left, 130, right, 130, blue, 3) + line(left, 280, right, 280, blue, 3) + line(left, 130, left, 280, blue, 7);
    drawing += label(left, 95, 'Closed', 'middle') + label(right, 95, 'Open', 'middle') + line(left, 205, right, 205, muted, 1.2, '5 5');
    if (state.reveal) {
      for (const sign of [-1, 1]) drawing += path(sample(left, right, position => 205 + sign * 60 * Math.sin((position - left) / (right - left) * Math.PI / 2)), sign > 0 ? '#92b8bd' : teal, sign > 0 ? 1.5 : 3, sign > 0 ? '5 5' : '');
      drawing += dot(left, 205, 5, ink) + arrow(right, 145, right, 265, rust, 1.7, true);
      drawing += label(left, 330, 'Node', 'middle') + label(right, 330, 'Antinode', 'middle') + dimension(left, right, 385, 'L = λ/4');
      drawing += label(width / 2, 435, 'Envelope of longitudinal displacement', 'middle', 'small') + label(width / 2, 472, 'Air moves along the pipe, not up/down', 'middle', 'small');
      for (const fraction of [.15, .4, .65, .9]) {
        const center = left + fraction * (right - left), extent = 13 * Math.sin(fraction * Math.PI / 2);
        drawing += arrow(center - extent, 535, center + extent, 535, rust, 1.5, true) + dot(center, 535, 2, rust);
      }
      drawing += label(width / 2, 580, 'Particle motion (exaggerated)', 'middle', 'small');
    } else drawing += label(width / 2, 365, 'The closed end cannot move', 'middle');
    return single(drawing, width, state.reveal ? 610 : 400);
  }
  function race(lesson, state) {
    const electromagnetic = lesson.variant === 'em', width = state.compact ? 420 : 840;
    const left = 95, right = width - 35;
    const duration = electromagnetic ? 1 : 100;
    const elapsed = state.reveal ? duration * state.progress : 0;
    let drawing = label(width / 2, 35, electromagnetic ? 'Vacuum · distance = 300 km' : 'Same distance = 34.3 m', 'middle', 'strong');
    const lanes = electromagnetic ? [{ name: 'Radio', speed: 300000000 }, { name: 'Visible', speed: 300000000 }] : [{ name: 'Air', speed: 343 }, { name: 'Steel', speed: 5900 }];
    lanes.forEach((lane, index) => {
      const baseline = 150 + index * 190, arrival = electromagnetic ? 1 : 34300 / lane.speed;
      const fraction = Math.min(1, elapsed / arrival);
      drawing += box(left, baseline - 35, right - left, 70, index ? '#e4edf2' : '#f2f7fa', '#c4d2dc', 3) + label(20, baseline + 7, lane.name, 'start', 'small');
      drawing += line(right, baseline - 45, right, baseline + 45, muted, 1.5, '5 5') + arrow(left, baseline, left + (right - left) * fraction, baseline, index ? rust : teal, 3);
      drawing += line(left + (right - left) * fraction, baseline - 25, left + (right - left) * fraction, baseline + 25, index ? rust : teal, 3);
      drawing += label((left + right) / 2, baseline + 76, electromagnetic ? 'c = 3.00 × 10⁸ m/s' : `v ≈ ${lane.speed.toLocaleString('en-US')} m/s`, 'middle', 'small');
      if (state.reveal && fraction === 1) drawing += label((left + right) / 2, baseline - 65, `Arrival: ${arrival.toFixed(electromagnetic ? 1 : 2)} ms`, 'middle');
    });
    drawing += label(width / 2, 470, `Elapsed time: ${elapsed.toFixed(1)} ms`, 'middle') + label(width / 2, 512, 'Pulse fronts, not individual particles', 'middle', 'small');
    return single(drawing, width, 540);
  }
  function sound(lesson, state) {
    const width = state.compact ? 420 : 840, left = 100, right = width - 85;
    let drawing = label(width / 2, 35, state.reveal ? 'Vacuum gap: no material to vibrate' : 'Sound is a traveling pressure disturbance', 'middle', 'small');
    drawing += box(20, 185, 35, 65, '#d6e3ec', blue) + `<path d="M55 185L80 165V270L55 250Z" fill="#e4eef5" stroke="${blue}" stroke-width="2"/>` + label(55, 320, 'Speaker', 'middle', 'small');
    drawing += box(left, 110, right - left, 220, state.reveal ? '#fff' : '#f1f8fa', '#b2c8d7', 8) + dot(width - 40, 210, 18, '#e7eff5', blue) + label(width - 45, 365, 'Receiver', 'middle', 'small');
    if (!state.reveal) {
      const spacing = (right - left - 25) / 22;
      for (let column = 0; column < 22; column++) for (let row = 0; row < 6; row++) drawing += dot(left + 15 + column * spacing + spacing * .8 * Math.sin(column * .65 - state.time * 2), 155 + row * 25, 2.6, teal);
      drawing += arrow(left + 20, 80, right - 20, 80, teal);
    } else drawing += label(width / 2, 220, 'No particles', 'middle') + label(width / 2, 425, 'The speaker still vibrates.', 'middle') + label(width / 2, 465, 'No sound crosses the empty gap.', 'middle');
    return single(drawing, width, 500);
  }
  function communication(lesson, state) {
    const infrared = lesson.variant === 'infrared', width = state.compact ? 420 : 840;
    const source = 55, target = width - 55;
    let drawing = label(width / 2, 35, infrared ? 'Information carried by infrared light' : 'Information carried by radio waves', 'middle', 'small');
    drawing += box(source - 23, 95, 46, 100, '#e6eef4', blue, 8) + box(source - 15, 110, 30, 45, '#fff', blue, 2);
    for (let index = 0; index < 3; index++) drawing += dot(source - 10 + index * 10, 173, 2, blue);
    if (infrared) drawing += box(target - 35, 110, 70, 60, '#d9e8f0', blue, 3) + line(target, 170, target, 190, blue, 3) + line(target - 15, 190, target + 15, 190, blue, 3);
    else drawing += `<path d="M${target - 30} 165V145A30 30 0 0 1 ${target + 30} 145V165" fill="none" stroke="${blue}" stroke-width="5"/>` + box(target - 33, 155, 12, 28, '#d0e4ec', blue, 3) + box(target + 21, 155, 12, 28, '#d0e4ec', blue, 3);
    drawing += label(source, 230, infrared ? 'Remote' : 'Phone', 'middle', 'small') + label(width - 15, 230, infrared ? 'TV' : 'Headphones', 'end', 'small');
    if (state.reveal) drawing += arrow(source + 40, 145, target - 45, 145, teal, 2.5) + label(width / 2, 115, infrared ? 'Infrared' : 'Bluetooth', 'middle');
    const bits = [1, 0, 1, 1, 0], left = 45, span = width - 90;
    drawing += label(width / 2, 295, 'Example information: 1 0 1 1 0', 'middle');
    let points = [[left, 385]];
    bits.forEach((bit, index) => { const start = left + index * span / bits.length, end = left + (index + 1) * span / bits.length; points.push([start, bit ? 335 : 385], [end, bit ? 335 : 385]); });
    points.push([width - 45, 385]);
    drawing += path(points, blue, 2) + arrow(left, 410, width - 35, 410, ink, 1.4) + label(width / 2, 448, 'Time →', 'middle');
    if (state.reveal) drawing += label(width / 2, 495, 'Receiver decodes the same information', 'middle', 'small');
    drawing += label(width / 2, 540, 'Coding schematic, not a protocol waveform', 'middle', 'small');
    return single(drawing, width, 565);
  }
  function clocks(lesson, state) {
    let timing = label(200, 35, 'Uncorrected GPS clock', 'middle', 'strong');
    timing += label(25, 100, 'Weaker gravity: +45 μs/day') + label(25, 150, 'Orbital motion: −7 μs/day');
    const zero = 80, scale = 5;
    timing += line(zero, 195, zero, 355, ink, 1.4);
    timing += arrow(zero, 220, zero + 45 * scale, 220, teal, 7) + label(zero + 45 * scale, 202, '+45', 'end');
    timing += arrow(zero, 310, zero - 7 * scale, 310, rust, 7) + label(zero + 15, 317, '−7');
    if (state.reveal) timing += label(200, 405, 'Net: +38 μs per day', 'middle', 'strong');
    timing += label(200, 455, 'Rounded, representative values', 'middle', 'small');
    let distance = label(200, 35, 'Timing becomes a range error', 'middle', 'small') + label(200, 110, 'Range = c × travel time', 'middle');
    distance += box(35, 180, 45, 45, '#dceaf1', blue) + line(40, 173, 75, 232, blue, 2) + dot(345, 270, 20, '#e2f1ed', teal) + arrow(85, 215, 315, 265, teal, 2);
    distance += label(60, 270, 'Satellite', 'middle', 'small') + label(320, 325, 'Receiver', 'middle', 'small');
    if (state.reveal) distance += label(200, 380, 'Δr = (3 × 10⁸)(38 × 10⁻⁶)', 'middle', 'small') + label(200, 425, '≈ 11,400 m equivalent range error', 'middle', 'small');
    distance += label(200, 470, 'Not a direct prediction of position error', 'middle', 'small');
    return panels([{ markup: timing, height: 495 }, { markup: distance, height: 495 }], state.compact);
  }
  Object.assign(window.Unit5Diagrams.scenes, { intensity, oscillator, harmonics, race, sound, communication, clocks });
})();
