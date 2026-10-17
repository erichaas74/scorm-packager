(() => {
  'use strict';
  const { label, line, path, box, dot, arrow, sample, dimension, arc, graph, panels, single, ink, blue, teal, rust, muted } = window.Unit6Diagrams.helpers;
  function charge(centerX, centerY, sign, radius = 25) {
    return dot(centerX, centerY, radius, sign > 0 ? '#fbe7da' : '#e0eef9', sign > 0 ? rust : blue) + line(centerX - radius * .3, centerY, centerX + radius * .3, centerY, sign > 0 ? rust : blue, 2.5) + (sign > 0 ? line(centerX, centerY - radius * .3, centerX, centerY + radius * .3, rust, 2.5) : '');
  }
  function charges(lesson, state) {
    const { reveal, progress, compact } = state, variant = lesson.variant;
    const width = compact ? 420 : 840;
    if (['transfer', 'count'].includes(variant)) {
      const counting = variant === 'count', radius = counting ? 85 : compact ? 55 : 85;
      const centers = counting ? [width / 2] : [width * .25, width * .75];
      const moving = reveal && progress < .8;
      let drawing = label(width / 2, 35, counting ? 'Count positive and negative charges' : 'Transfer one electron, not a proton', 'middle', 'small');
      centers.forEach((center, index) => {
        drawing += dot(center, 210, radius, 'none', '#a8bac8') + dot(center, 210, 24, '#fbe7da', rust) + label(center, 217, '6p', 'middle');
        const electrons = counting ? 7 : 6;
        for (let electron = 0; electron < electrons; electron++) {
          if (!counting && index === 0 && electron === 0 && reveal) continue;
          const angle = electron * 2 * Math.PI / electrons;
          drawing += charge(center + radius * Math.cos(angle), 210 + radius * Math.sin(angle), -1, 8);
        }
        if (!counting && index === 1 && reveal && !moving) drawing += charge(center + radius * Math.cos(Math.PI / 6), 210 + radius * .5, -1, 8);
        drawing += label(center, 90, counting ? '6 protons, 7 electrons' : `Atom ${index ? 'B' : 'A'}`, 'middle');
        drawing += label(center, 340, counting ? '+6e − 7e' : reveal ? index ? moving ? '6 electrons' : '7 electrons' : '5 electrons' : '6 electrons', 'middle', 'small');
        if (reveal) drawing += label(center, 380, counting ? 'Net charge = −e' : index ? moving ? 'Receiving electron' : 'Charge = −e' : 'Charge = +e', 'middle', 'small');
      });
      if (!counting && moving) {
        const amount = progress / .8;
        const start = centers[0] + radius, end = centers[1] + radius * Math.cos(Math.PI / 6);
        drawing += charge(start + (end - start) * amount, 210 + radius * .5 * amount - 105 * Math.sin(Math.PI * amount), -1, 9);
      }
      drawing += label(width / 2, 430, 'Charge counts, not electron orbits', 'middle', 'small');
      if (reveal && !counting) drawing += label(width / 2, 470, 'Total charge remains zero', 'middle');
      return single(drawing, width, 495);
    }
    if (variant === 'sharing') {
      const radius = compact ? 45 : 65, initial = width / 4, shift = width / 4 - radius;
      const movement = !reveal ? 0 : progress < .35 ? progress / .35 : progress <= .65 ? 1 : (1 - progress) / .35;
      const shared = reveal && progress >= .35;
      let drawing = label(width / 2, 35, 'Identical isolated metal spheres', 'middle', 'strong');
      drawing += charge(initial + shift * movement, 220, 1, radius) + charge(width - initial - shift * movement, 220, shared ? 1 : -1, radius);
      drawing += label(initial + shift * movement, 330, shared ? '+2 nC' : '+6 nC', 'middle') + label(width - initial - shift * movement, 330, shared ? '+2 nC' : '−2 nC', 'middle');
      if (shared) drawing += label(width / 2, 390, '(+6 − 2) / 2 = +2 nC each', 'middle');
      drawing += label(width / 2, 440, 'Total charge: +4 nC throughout', 'middle');
      return single(drawing, width, 470);
    }
    if (variant === 'conductor') {
      const left = 35, right = width - 35, center = width / 2, radius = 75;
      let drawing = label(center, 35, 'Isolated metal conductor', 'middle', 'strong') + `<ellipse cx="${center}" cy="210" rx="${(right - left) / 2}" ry="${radius}" fill="#edf3f7" stroke="#8aa5b7"/>`;
      for (let index = 0; index < 12; index++) {
        const angle = index * 2 * Math.PI / 12;
        const finalX = center + (right - left) / 2 * Math.cos(angle), finalY = 210 + radius * Math.sin(angle);
        const startX = left + 40 + index % 3 * 13, startY = 185 + Math.floor(index / 3) * 17;
        const amount = reveal ? progress : 0;
        drawing += charge(startX + (finalX - startX) * amount, startY + (finalY - startY) * amount, -1, 7);
      }
      if (reveal) drawing += label(center, 350, 'Excess charge reaches the surface', 'middle') + label(center, 397, 'At equilibrium: E inside = 0', 'middle');
      drawing += label(center, 449, 'Charge symbols show redistribution', 'middle', 'small');
      return single(drawing, width, 475);
    }
    if (variant === 'polarization') {
      const wall = width - 155;
      let drawing = label(width / 2, 35, 'The wall remains electrically neutral', 'middle', 'small');
      drawing += `<ellipse cx="90" cy="215" rx="48" ry="70" fill="#e2eef9" stroke="${blue}" stroke-width="2"/>` + label(90, 223, '− − −', 'middle') + label(90, 330, 'Balloon', 'middle');
      drawing += box(wall, 105, 130, 230, '#f1f4f6', '#a7bac8');
      for (let row = 0; row < 4; row++) {
        const separation = reveal ? 12 + 12 * progress : 12;
        const center = wall + 65, vertical = 140 + row * 53;
        drawing += line(center - separation, vertical, center + separation, vertical, muted) + charge(center - separation, vertical, 1, 9) + charge(center + separation, vertical, -1, 9);
      }
      if (reveal) drawing += arrow(145, 215, wall - 18, 215, rust, 3) + label(width / 2, 390, 'Closer + attraction is stronger', 'middle') + label(width / 2, 432, 'Bound charges shift slightly', 'middle');
      drawing += label(width / 2, 475, 'Polarization exaggerated for visibility', 'middle', 'small');
      return single(drawing, width, 500);
    }
    if (variant === 'potential') {
      const chart = graph({ baseline: 330, top: 110, bottom: 330, xmax: 3, ticks: [1, 2, 3], xlabel: 'Distance r (m)', ylabel: 'Potential V (V)' });
      let plot = label(200, 35, 'V = kQ/r; Q = +1 nC', 'middle') + chart.markup;
      for (const value of [0, 3, 6, 9]) plot += line(chart.left, 330 - value * 20, chart.right, 330 - value * 20, '#e3eaef') + label(38, 336 - value * 20, value, 'end', 'small');
      plot += path(sample(chart.left + chart.scale * .85, chart.right, position => 330 - 180 / ((position - chart.left) / chart.scale)));
      if (reveal) plot += dot(chart.left + 2 * chart.scale, 240, 5, rust) + label(200, 445, 'Double r → half V', 'middle');
      let setup = label(200, 35, 'Potential is a scalar', 'middle', 'strong') + charge(65, 205, 1, 30);
      const distance = reveal ? 105 + 105 * progress : 105;
      setup += dot(65 + distance, 205, 7, teal) + label(65 + distance, 165, 'Probe', 'middle') + dimension(65, 65 + distance, 285, reveal && progress === 1 ? '2 m' : '1 m → 2 m');
      setup += label(200, 355, reveal ? '9 V → 4.5 V' : 'At 1 m: V = 9 V', 'middle') + label(200, 420, 'Reference: V = 0 at infinity', 'middle', 'small');
      return panels([{ markup: setup, height: 470 }, { markup: plot, height: 470 }], compact);
    }
    const gravity = variant === 'gravity';
    const rows = gravity ? [false, true] : [true];
    return panels(rows.map(electric => {
      let drawing = label(200, 35, electric ? 'Like electric charges' : 'Ordinary masses', 'middle', 'strong');
      const movement = reveal ? progress * 20 * (electric ? 1 : -1) : 0;
      const left = 120 - movement, right = 280 + movement;
      drawing += electric ? charge(left, 200, 1, 35) + charge(right, 200, 1, 35) : dot(left, 200, 35, '#e6edf3', blue) + dot(right, 200, 35, '#e6edf3', blue) + label(left, 207, 'm', 'middle') + label(right, 207, 'm', 'middle');
      if (reveal) drawing += electric ? arrow(left - 38, 200, left - 85, 200, rust, 3) + arrow(right + 38, 200, right + 85, 200, rust, 3) : arrow(left + 38, 200, left + 75, 200, teal, 3) + arrow(right - 38, 200, right - 75, 200, teal, 3);
      drawing += label(200, 315, electric ? 'Repulsion' : 'Attraction', 'middle') + label(200, 365, 'Equal forces, opposite directions', 'middle', 'small');
      return { markup: drawing, height: 400 };
    }), compact);
  }
  function plates(lesson, state) {
    const variant = lesson.variant, width = state.compact ? 420 : 840, left = 40, right = width - 40;
    const changing = ['voltage', 'isolated'].includes(variant);
    const amount = state.reveal ? state.progress : 0;
    const gap = changing ? 110 + amount * 110 : 240;
    const upper = 240 - gap / 2, lower = 240 + gap / 2;
    let drawing = label(width / 2, 35, changing ? variant === 'isolated' ? 'Fixed Q and plate area; isolated' : 'Field held fixed: E = 100 N/C' : 'Uniform field between parallel plates', 'middle', 'small');
    drawing += box(left, upper - 5, right - left, 10, '#f7decf', rust) + box(left, lower - 5, right - left, 10, '#dbeaf6', blue);
    for (let index = 0; index < 6; index++) {
      const horizontal = left + 22 + index * (right - left - 44) / 5;
      drawing += label(horizontal, upper - 17, '+', 'middle') + label(horizontal, lower + 32, '−', 'middle');
    }
    for (const fraction of [.18, .5, .82]) drawing += arrow(left + (right - left) * fraction, upper + 25, left + (right - left) * fraction, lower - 25, '#90b7ba', 2);
    drawing += label(right - 15, 245, 'E ↓', 'end');
    if (changing) {
      drawing += arrow(25, upper, 25, lower, ink, 1.5, true) + label(width / 2, 425, state.reveal ? 'd: 2 cm → 4 cm' : 'd = 2 cm', 'middle');
      if (state.reveal) drawing += label(width / 2, 468, variant === 'isolated' ? 'E = Q/(ε₀A): unchanged' : '|ΔV| = Ed = 100 × 0.04 = 4 V', 'middle', 'small') + label(width / 2, 505, 'Twice the gap → twice |ΔV|', 'middle');
    } else if (variant === 'trajectory') {
      const start = left + 25, span = right - left - 55, drop = 130;
      const horizontal = start + span * amount, vertical = upper + 45 + drop * amount ** 2;
      if (state.reveal) drawing += path(sample(start, horizontal, position => upper + 45 + drop * ((position - start) / span) ** 2), rust, 3, '6 4');
      drawing += charge(horizontal, vertical, 1, 12) + arrow(horizontal, vertical, horizontal + 38, vertical + 38 * 2 * drop * amount / span, blue, 3);
      if (state.reveal) drawing += arrow(horizontal - 20, vertical, horizontal - 20, vertical + 55, rust, 3);
      drawing += label(width / 2, 425, 'Blue: velocity tangent to the path', 'middle', 'small') + label(width / 2, 468, 'Force and acceleration stay downward', 'middle', 'small');
    } else {
      const work = variant === 'work', horizontal = width / 2 - 45;
      const vertical = work ? lower - 50 - amount * 120 : upper + 65 + amount * 110;
      drawing += charge(horizontal, vertical, 1, 16);
      if (state.reveal) {
        drawing += arrow(horizontal + 28, vertical, horizontal + 28, vertical + 55, rust, 3);
        if (work) drawing += arrow(horizontal - 28, vertical, horizontal - 28, vertical - 55, blue, 3);
      }
      drawing += label(width / 2, 425, work ? 'Move upward at constant speed' : 'Positive q: F = qE, downward', 'middle', 'small');
      if (state.reveal) drawing += label(width / 2, 468, work ? 'External work > 0; ΔU > 0' : 'Field points from + to −', 'middle') + (work ? label(width / 2, 505, 'Blue: external force; rust: electric force', 'middle', 'small') : '');
    }
    drawing += label(width / 2, 547, 'Edge effects neglected', 'middle', 'small');
    return single(drawing, width, 570);
  }
  function distance(lesson, state) {
    const variant = lesson.variant;
    const magnetic = variant === 'magnetic', doubleCharge = variant === 'charge';
    return panels([false, true].map(after => {
      const changed = after && state.reveal;
      const separation = doubleCharge ? 220 : changed ? 240 : 120;
      let drawing = label(200, 35, after ? 'After the change' : 'Before the change', 'middle', 'strong');
      drawing += magnetic ? dot(60, 185, 18, '#e7eff5', blue) + dot(60, 185, 5, blue) : charge(60, 185, 1, 23);
      drawing += magnetic ? box(60 + separation - 18, 170, 36, 30, '#e2f1ed', teal, 3) : charge(60 + separation, 185, 1, 15);
      drawing += dimension(60, 60 + separation, 275, magnetic ? changed ? '4 cm' : '2 cm' : doubleCharge ? 'r = 1 m (fixed)' : changed ? '2 m' : '1 m');
      const magnitude = magnetic ? changed ? 10 : 20 : doubleCharge ? changed ? 18 : 9 : variant === 'electric' ? changed ? 2.25 : 9 : changed ? 2.25 : 9;
      if (!after || state.reveal) drawing += label(200, 335, `${magnetic ? 'B' : variant === 'electric' ? 'E' : 'F'} = ${magnitude} ${magnetic ? 'μT' : variant === 'electric' ? 'kN/C' : 'mN'}`, 'middle', 'strong');
      if (!magnetic && (!after || state.reveal)) drawing += arrow(125, 390, 125 + magnitude / 9 * 90, 390, rust, 4);
      drawing += label(200, 435, magnetic ? 'Long wire: I = 2 A, out of page' : doubleCharge ? changed ? 'q₁ = 2 μC; q₂ = 1 μC' : 'q₁ = q₂ = 1 μC' : variant === 'electric' ? 'Point source: Q = +1 μC' : 'Fixed charges: q₁ = q₂ = 1 μC', 'middle', 'small');
      if (state.reveal) drawing += label(200, 480, magnetic ? 'B ∝ 1/r' : doubleCharge ? 'F ∝ q₁q₂' : variant === 'electric' ? 'E ∝ 1/r²' : 'F ∝ 1/r²', 'middle');
      return { markup: drawing, height: 505 };
    }), state.compact);
  }
  function field(lesson, state) {
    const width = state.compact ? 420 : 840, center = width / 2, variant = lesson.variant;
    let drawing = '';
    if (variant === 'lines') {
      drawing += label(center, 35, 'Field direction: force on positive q', 'middle', 'small') + charge(center, 235, 1, 32);
      if (state.reveal) for (let index = 0; index < 12; index++) {
        const angle = index * Math.PI / 6;
        drawing += arrow(center + 43 * Math.cos(angle), 235 + 43 * Math.sin(angle), center + 145 * Math.cos(angle), 235 + 145 * Math.sin(angle), teal, 2.5);
      }
      drawing += label(center, 445, 'Positive source: arrows point outward', 'middle', 'small');
    } else if (variant === 'sum') {
      const offset = width * .24, vertical = 330, pointY = 200;
      drawing += label(center, 35, 'Equal sources; P is equally far away', 'middle', 'small') + charge(center - offset, vertical, 1) + charge(center + offset, vertical, 1);
      drawing += label(center - offset, 385, '+Q', 'middle') + label(center + offset, 385, '+Q', 'middle') + dot(center, pointY, 5, ink) + label(center + 18, pointY + 25, 'P');
      for (const sign of [-1, 1]) drawing += line(center + sign * offset, vertical, center, pointY, muted, 1.5, '5 5');
      if (state.reveal) {
        for (const sign of [-1, 1]) {
          drawing += arrow(center, pointY, center + sign * offset * .45, pointY - 58.5, sign > 0 ? rust : blue, 3);
          drawing += line(center + sign * offset * .45, pointY - 58.5, center, pointY - 117, muted, 1.2, '5 4');
        }
        drawing += arrow(center, pointY, center, pointY - 117, teal, 4) + label(center + 15, 100, 'Net E');
        drawing += label(center, 440, 'Horizontal components cancel', 'middle') + label(center, 480, 'Vertical components add', 'middle');
      }
    } else if (variant === 'test') {
      drawing += label(center, 35, 'Field exists even without a test charge', 'middle', 'small') + charge(width * .25, 220, 1, 35) + label(width * .25, 300, '+Q', 'middle') + dot(width * .6, 220, 5, ink) + label(width * .6, 180, 'P', 'middle');
      if (state.reveal) drawing += arrow(width * .6, 220, width - 30, 220, teal, 4) + label(width * .75, 300, 'E →', 'middle') + label(center, 420, 'A positive test charge is repelled', 'middle', 'small');
    } else {
      const unequal = variant === 'force', unit = (center - 120) / 2;
      drawing += label(center, 35, 'Forces on the middle positive charge', 'middle', 'small') + charge(50, 235, 1) + charge(width - 50, 235, 1) + charge(center, 235, 1, 18);
      drawing += label(50, 300, unequal ? '+2 μC' : '+Q', 'middle', 'small') + label(width - 50, 300, unequal ? '+1 μC' : '+Q', 'middle', 'small') + label(center, 300, '+q', 'middle');
      drawing += dimension(50, center, 355, 'r') + dimension(center, width - 50, 355, 'r');
      if (state.reveal) {
        drawing += arrow(center + 23, 235, center + 23 + unit * (unequal ? 2 : 1), 235, rust, 4) + arrow(center - 23, 235, center - 23 - unit, 235, blue, 4);
        drawing += label(center + 23 + unit * (unequal ? 1 : .5), 202, unequal ? '2F' : 'F', 'middle') + label(center - 23 - unit / 2, 202, 'F', 'middle');
        drawing += label(center, 435, unequal ? 'Net: 2F − F = F, to the right' : 'Equal and opposite: net force = 0', 'middle', 'small');
      }
    }
    return single(drawing, width, 510);
  }
  window.Unit6Diagrams.helpers.charge = charge;
  Object.assign(window.Unit6Diagrams.scenes, { charges, plates, distance, field });
})();
