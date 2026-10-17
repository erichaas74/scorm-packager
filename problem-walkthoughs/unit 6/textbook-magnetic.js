(() => {
  'use strict';
  const { label, line, path, box, dot, arrow, dimension, panels, single, sample, ink, blue, teal, rust } = window.Unit6Diagrams.helpers;
  const ring = (x, y, radius, color = teal) => `<circle cx="${x}" cy="${y}" r="${radius}" fill="none" stroke="${color}" stroke-width="2"/>`;
  function currentSymbol(x, y, outward) {
    return dot(x, y, 11, '#fff', rust) + (outward ? dot(x, y, 3, rust, rust) : line(x - 5, y - 5, x + 5, y + 5, rust, 2) + line(x - 5, y + 5, x + 5, y - 5, rust, 2));
  }
  function solenoid(turns, core, strength) {
    let drawing = box(65, 165, 270, 90, core ? '#e3e8ed' : '#fafcfd', '#b5c5cf', 8);
    for (let index = 0; index < turns; index++) {
      const horizontal = 80 + index * 240 / (turns - 1);
      drawing += currentSymbol(horizontal, 165, true) + currentSymbol(horizontal, 255, false);
    }
    for (const vertical of [190, 210, 230]) drawing += arrow(95, vertical, 305, vertical, teal, strength);
    drawing += `<path d="M305 210 C385 210 375 100 300 100 H100 C25 100 15 210 95 210" fill="none" stroke="${teal}" stroke-width="1.6"/>` + arrow(235, 100, 170, 100, teal, 1.6);
    drawing += label(40, 240, 'S', 'middle') + label(360, 240, 'N', 'middle');
    return drawing + label(200, 305, 'Selected windings; side section', 'middle', 'small') + label(200, 340, '⊙ out of page    ⊗ into page', 'middle', 'small');
  }
  function coil(lesson, state) {
    const variant = lesson.variant;
    return panels([false, true].map(after => {
      const changed = after && state.reveal;
      let drawing = label(200, 35, after ? 'Change one variable' : 'Starting coil', 'middle', 'strong');
      if (variant === 'loops') {
        for (let index = 0; index < (changed ? 3 : 1); index++) drawing += `<ellipse cx="200" cy="210" rx="${60 + index * 7}" ry="${90 + index * 7}" fill="none" stroke="${rust}" stroke-width="2.5"/>`;
        drawing += arrow(75, 210, 325, 210, teal, changed ? 5 : 2.5) + label(200, 350, 'Same center, radius, and current', 'middle', 'small');
      } else drawing += solenoid(changed && variant === 'turns' ? 10 : 5, changed && variant === 'core', changed ? 4 : 2);
      drawing += label(200, 395, variant === 'core' ? changed ? 'Soft-iron core added' : 'Air core' : variant === 'loops' ? changed ? '3 aligned loops' : '1 loop' : changed ? '100 turns; same I and length' : '50 turns; same I and length', 'middle', 'small');
      if (state.reveal) drawing += label(200, 440, changed ? variant === 'core' ? 'Stronger B (before saturation)' : variant === 'loops' ? 'Center field: 3B' : 'Inside field: 2B' : 'Reference field: B', 'middle', 'small');
      return { markup: drawing, height: 470 };
    }), state.compact);
  }
  function wire(lesson, state) {
    const width = state.compact ? 420 : 840, center = width / 2;
    if (lesson.variant === 'resistance') return panels([1, 2].map(multiplier => {
      const length = multiplier * 130;
      let drawing = label(200, 40, multiplier === 1 ? 'Reference wire' : 'Longer wire', 'middle', 'strong') + box(55, 180, length, 65, '#f7e5cf', rust, 4) + dimension(55, 55 + length, 290, multiplier === 1 ? 'L' : '2L') + label(200, 100, 'Same material and cross section', 'middle', 'small');
      if (state.reveal) drawing += label(200, 355, multiplier === 1 ? 'R = ρL/A' : 'Rnew = ρ(2L)/A = 2R', 'middle');
      return { markup: drawing, height: 400 };
    }), state.compact);
    if (lesson.variant === 'drift') {
      let drawing = box(30, 150, width - 60, 180, '#edf5fa', '#abc0d0');
      for (let row = 0; row < 3; row++) for (let column = 0; column < 7; column++) drawing += dot(65 + column * (width - 130) / 6, 180 + row * 60, 10, '#e0d8c8', '#b7a789');
      for (let index = 0; index < 12; index++) {
        const span = width - 90, horizontal = 45 + ((index * span / 12 - state.progress * 65 + span) % span);
        drawing += dot(horizontal, 205 + (index % 2) * 60 + Math.sin(index * 3 + state.time * 8) * 10, 4, blue, blue);
      }
      drawing += arrow(center - 100, 100, center + 100, 100, rust) + label(center, 65, 'Conventional current →', 'middle') + arrow(center + 100, 385, center - 100, 385, blue) + label(center, 425, 'Electron drift ←', 'middle') + label(center, 475, 'Random motion plus a small net drift', 'middle', 'small');
      return single(drawing, width, 510);
    }
    const compass = lesson.variant === 'compass';
    let drawing = label(center, 35, 'Straight wire: current out of page', 'middle', 'small');
    const vertical = compass ? 300 : 245;
    for (const radius of [60, 100, 140]) {
      drawing += ring(center, vertical, radius);
      drawing += arrow(center + radius, vertical + 12, center + radius, vertical - 12, teal, 2);
      drawing += arrow(center - radius, vertical - 12, center - radius, vertical + 12, teal, 2);
    }
    drawing += currentSymbol(center, vertical, true);
    if (compass) {
      const deflection = state.reveal ? state.progress * 55 : 0;
      drawing += dot(center, 160, 34, '#fff', ink) + arrow(center, 160, center - deflection * .55, 130, rust, 3);
      drawing += arrow(center + 100, 90, center + 100, 40, blue) + label(center + 105, 75, 'Earth B', 'start', 'small');
      drawing += label(center, 485, state.reveal ? 'North end turns toward net B' : 'Compass initially follows Earth B', 'middle', 'small');
    } else drawing += label(center, 435, 'B circles counterclockwise', 'middle') + label(center, 480, 'Right-hand thumb points out: ⊙', 'middle', 'small');
    return single(drawing, width, 520);
  }
  function graph(lesson, state) {
    const distance = lesson.variant === 'distance';
    let drawing = label(210, 35, distance ? 'Field around a straight wire' : 'Field inside a fixed solenoid', 'middle', 'strong');
    const left = 70, right = 365, top = 100, bottom = 350;
    const xmax = distance ? 8 : 2, ymax = distance ? 20 : 4;
    for (let tick = 0; tick <= 4; tick++) {
      const vertical = bottom - tick * (bottom - top) / 4;
      drawing += line(left, vertical, right, vertical, '#dbe4ea', 1) + label(left - 12, vertical + 6, String(tick * ymax / 4), 'end', 'small');
      const horizontal = left + tick * (right - left) / 4;
      drawing += line(horizontal, bottom, horizontal, bottom + 6) + label(horizontal, bottom + 30, String(tick * xmax / 4), 'middle', 'small');
    }
    drawing += arrow(left, bottom, right + 10, bottom, ink, 1.5) + arrow(left, bottom, left, top - 20, ink, 1.5) + label(left, 70, distance ? 'B (μT)' : 'B (mT)') + label(210, 420, distance ? 'Distance r (cm)' : 'Current I (A)', 'middle');
    const points = distance ? [[2, 20], [4, 10], [8, 5]] : [[1, 2], [2, 4]];
    if (state.reveal) drawing += path(sample(distance ? left + 2 / xmax * (right - left) : left, right, horizontal => { const value = (horizontal - left) / (right - left) * xmax; return bottom - (distance ? 40 / value : 2 * value) / ymax * (bottom - top); }), teal, 3);
    points.forEach(([horizontal, vertical]) => { drawing += dot(left + horizontal / xmax * (right - left), bottom - vertical / ymax * (bottom - top), 5, rust); });
    drawing += label(210, 465, distance ? '2 cm: 20 μT · 4 cm: 10 μT' : '1 A: 2 mT · 2 A: 4 mT', 'middle', 'small');
    if (state.reveal) drawing += label(210, 505, distance ? 'B ∝ 1/r, not 1/r²' : 'B ∝ I (same coil and core)', 'middle');
    return single(drawing, 420, 535);
  }
  function experiment(lesson, state) {
    return panels([false, true].map(after => {
      const changed = after && state.reveal, turns = lesson.variant !== 'current', current = lesson.variant !== 'turns';
      let drawing = label(200, 35, after ? 'Trial B' : 'Trial A', 'middle', 'strong') + solenoid(changed && turns ? 8 : 4, false, changed ? 4 : 2);
      drawing += label(200, 390, `${changed && turns ? 40 : 20} turns; I = ${changed && current ? 2 : 1} A`, 'middle');
      drawing += label(200, 435, 'Same core, coil length, sensor point', 'middle', 'small');
      if (state.reveal) drawing += label(200, 480, lesson.variant === 'unfair' ? 'Two variables: cannot isolate cause' : `Model reading: ${changed ? 4 : 2} mT`, 'middle', 'small');
      return { markup: drawing, height: 510 };
    }), state.compact);
  }
  function machine(lesson, state) {
    const motor = lesson.variant === 'motor', width = state.compact ? 420 : 840, center = width / 2;
    const angle = state.reveal ? state.progress * (motor ? .65 : Math.PI * 2 * (lesson.variant === 'speed' ? 2 : 1)) : 0;
    let drawing = box(25, 140, 65, 180, '#f8e7df', rust) + box(width - 90, 140, 65, 180, '#e5eff8', blue) + label(57, 235, 'N', 'middle', 'strong') + label(width - 57, 235, 'S', 'middle', 'strong');
    for (const vertical of [165, 230, 295]) drawing += arrow(100, vertical, width - 100, vertical, teal, 1.5);
    drawing += label(center, 65, 'Uniform magnetic field B →', 'middle');
    if (motor) {
      const offset = 75 * Math.cos(angle), rise = 75 * Math.sin(angle);
      drawing += ring(center, 230, 80, '#b2c2cd') + line(center - offset, 230 - rise, center + offset, 230 + rise, ink, 2) + currentSymbol(center - offset, 230 - rise, true) + currentSymbol(center + offset, 230 + rise, false);
      if (state.reveal) drawing += arrow(center - offset, 230 - rise - 15, center - offset, 230 - rise - 65, rust, 3) + arrow(center + offset, 230 + rise + 15, center + offset, 230 + rise + 65, rust, 3);
      drawing += label(center, 385, 'Rotor section: ⊙ out, ⊗ in', 'middle', 'small') + label(center, 430, 'Opposite forces produce torque', 'middle', 'small') + label(center, 480, 'Electrical → mechanical energy', 'middle');
    } else {
      drawing += `<ellipse cx="${center}" cy="230" rx="${Math.max(8, 75 * Math.abs(Math.sin(angle)))}" ry="95" fill="#fff8e766" stroke="${rust}" stroke-width="3"/>` + line(center, 115, center, 345, ink, 1.5, '5 5');
      drawing += label(center, 385, 'Coil turns about the dashed axis', 'middle', 'small');
      const multiplier = lesson.variant === 'turns' || lesson.variant === 'speed' ? 2 : 1;
      drawing += label(center, 430, state.reveal ? lesson.variant === 'turns' ? 'Double N → double peak emf' : lesson.variant === 'speed' ? 'Double ω → double peak emf' : 'Changing flux induces emf' : 'Mechanical input: turn the coil', 'middle', 'small');
      if (state.reveal) drawing += label(center, 475, 'ε = NBAω sin(ωt)', 'middle') + label(center, 520, multiplier === 2 ? lesson.variant === 'speed' ? 'Frequency also doubles.' : 'Rotation rate stays the same.' : 'Mechanical → electrical energy', 'middle', 'small');
    }
    if (!motor) {
      const left = 55, right = width - 35, baseline = 625;
      const doubled = state.reveal && ['turns', 'speed'].includes(lesson.variant);
      const amplitude = doubled ? 45 : 22.5, frequency = state.reveal && lesson.variant === 'speed' ? 2 : 1;
      drawing += label(center, 565, 'Induced emf / initial peak emf', 'middle', 'small');
      drawing += arrow(left, baseline, right, baseline, ink, 1.5) + line(left, 575, left, 675, ink, 1.5);
      for (const value of [-2, 0, 2]) drawing += label(left - 10, baseline - value * 22.5 + 6, value, 'end', 'small');
      if (doubled) drawing += path(sample(left, right, horizontal => baseline - 22.5 * Math.sin((horizontal - left) / (right - left) * Math.PI * 2)), '#8296a5', 1.5, '5 5');
      drawing += path(sample(left, right, horizontal => baseline - amplitude * Math.sin((horizontal - left) / (right - left) * Math.PI * 2 * frequency)), rust, 2.5);
      drawing += label(center, 710, doubled ? 'Same time span; dashed = original' : 'Time → one rotation period', 'middle', 'small');
    }
    return single(drawing, width, motor ? 555 : 740);
  }
  function braking(lesson, state) {
    return panels([false, true].map(copper => {
      const progress = state.progress, displacement = state.reveal ? copper ? 73.8 * (progress - .18 * (1 - Math.exp(-progress / .18))) : 205 * progress ** 2 : 0;
      const vertical = 140 + displacement;
      let drawing = label(200, 35, copper ? 'Copper tube' : 'Plastic tube', 'middle', 'strong') + box(125, 90, 150, 330, copper ? '#faeee1' : '#edf5fa', copper ? rust : blue, 8) + box(150, vertical, 100, 30, '#f6d9cf', rust) + box(150, vertical + 30, 100, 30, '#dae9f6', blue) + label(200, vertical + 22, 'N', 'middle') + label(200, vertical + 52, 'S', 'middle');
      if (state.reveal) {
        drawing += arrow(300, vertical + 30, 300, vertical + 95, ink, 2) + label(315, vertical + 70, 'mg', 'start', 'small');
        if (copper) {
          drawing += arrow(100, vertical + 30, 100, vertical + 30 - 65 * (1 - Math.exp(-progress / .18)), teal, 3) + label(90, vertical - 40, 'Fmag', 'middle', 'small');
          for (const above of [true, false]) {
            const loopY = vertical + (above ? -20 : 80);
            drawing += `<ellipse cx="200" cy="${loopY}" rx="75" ry="12" fill="none" stroke="${teal}" stroke-width="2"/>` + arrow(above ? 185 : 215, loopY + 12, above ? 215 : 185, loopY + 12, teal, 2);
          }
        }
        drawing += label(200, 465, copper ? 'Induced currents oppose the fall' : 'No magnetic braking', 'middle', 'small') + label(200, 505, copper ? 'Slower fall; energy becomes heat' : 'Downward acceleration: g', 'middle', 'small');
      }
      return { markup: drawing, height: 535 };
    }), state.compact);
  }
  Object.assign(window.Unit6Diagrams.scenes, { coil, wire, graph, experiment, machine, braking });
})();
