(() => {
  'use strict';
  const { label, line, path, box, dot, arrow, panels, single, ink, blue, teal, rust } = window.Unit6Diagrams.helpers;
  function resistor(centerX, centerY, value, vertical = false) {
    const symbol = box(-30, -12, 60, 24, '#edf5f1', teal);
    return `<g transform="translate(${centerX} ${centerY})${vertical ? ' rotate(90)' : ''}">${symbol}</g>` + label(centerX, centerY - 30, value, 'middle', 'small');
  }
  function lamp(centerX, centerY, brightness, broken = false) {
    let drawing = dot(centerX, centerY, 23, brightness ? brightness > .5 ? '#ffe58d' : '#fff5cf' : '#f0f3f5', ink);
    if (broken) drawing += path([[centerX - 15, centerY - 15], [centerX - 4, centerY - 4]], ink, 1.7) + path([[centerX + 5, centerY + 5], [centerX + 15, centerY + 15]], ink, 1.7);
    else drawing += line(centerX - 15, centerY - 15, centerX + 15, centerY + 15, ink, 1.7) + line(centerX - 15, centerY + 15, centerX + 15, centerY - 15, ink, 1.7);
    return drawing;
  }
  function source(left, top, bottom, voltage) {
    const center = (top + bottom) / 2;
    return line(left, top, left, center - 8, ink, 2.5) + line(left - 22, center - 8, left + 22, center - 8, ink, 3) + line(left - 12, center + 8, left + 12, center + 8, ink, 3) + line(left, center + 8, left, bottom, ink, 2.5) + label(left - 30, center - 17, '+', 'middle', 'small') + label(left - 30, center + 28, '−', 'middle', 'small') + label(left + 35, center + 7, voltage, 'start', 'small');
  }
  function loop({ width = 420, voltage = '12 V', components = [], current = false, bottom = 360, top = 170 }) {
    const left = 60, right = width - 40;
    let drawing = source(left, top, bottom, voltage) + line(right, top, right, bottom, ink, 2.5) + line(right, bottom, left, bottom, ink, 2.5);
    let previous = left;
    components.forEach(component => {
      drawing += line(previous, top, component.center - component.radius, top, ink, 2.5) + component.markup;
      previous = component.center + component.radius;
    });
    drawing += line(previous, top, right, top, ink, 2.5);
    if (current) drawing += arrow(right - 35, bottom + 30, left + 60, bottom + 30, rust, 2.5) + label((right + left) / 2, bottom + 65, 'Conventional current', 'middle', 'small');
    return drawing;
  }
  function parallel({ voltage = '12 V', second = true, bulbs = false, lit = true }) {
    const left = 55, branchLeft = 175, right = 365, top = 130, bottom = 350;
    let drawing = source(left, top, bottom, voltage) + line(left, top, branchLeft, top, ink, 2.5) + line(left, bottom, branchLeft, bottom, ink, 2.5) + line(branchLeft, top, branchLeft, second ? 290 : 185, ink, 2.5) + line(right, 185, right, 290, ink, 2.5);
    const rows = second ? [185, 290] : [185];
    if (!second) drawing += line(right, 185, right, 350, ink, 2.5);
    drawing += line(branchLeft, bottom, right, bottom, ink, 2.5) + line(right, 290, right, bottom, ink, 2.5);
    rows.forEach(vertical => {
      const center = 270, radius = bulbs ? 23 : 30;
      drawing += line(branchLeft, vertical, center - radius, vertical, ink, 2.5) + line(center + radius, vertical, right, vertical, ink, 2.5);
      drawing += bulbs ? lamp(center, vertical, lit ? 1 : 0) : resistor(center, vertical, '6 Ω');
      drawing += dot(branchLeft, vertical, 3, ink, ink) + dot(right, vertical, 3, ink, ink);
    });
    return drawing;
  }
  function circuit(lesson, state) {
    const variant = lesson.variant, reveal = state.reveal, progress = state.progress;
    const width = state.compact ? 420 : 840;
    if (variant === 'brightness') return panels([false, true].map(isParallel => {
      let drawing = label(200, 35, isParallel ? 'Parallel bulbs' : 'Series bulbs', 'middle', 'strong') + label(200, 78, 'Identical resistive bulbs: 6 Ω each', 'middle', 'small');
      if (isParallel) drawing += parallel({ bulbs: true, lit: reveal });
      else drawing += loop({ width: 400, components: [170, 285].map(center => ({ center, radius: 23, markup: lamp(center, 170, reveal ? .25 : 0) })) });
      if (reveal) drawing += label(200, 425, isParallel ? 'Each bulb: 12 V, 24 W' : 'Each bulb: 6 V, 6 W', 'middle') + label(200, 470, 'Brightness follows power: P = V²/R', 'middle', 'small');
      return { markup: drawing, height: 495 };
    }), state.compact);
    if (variant === 'parallel') return panels([false, true].map(after => {
      const added = after && reveal;
      let drawing = label(200, 35, after ? 'Add a second path' : 'One resistor', 'middle', 'strong') + parallel({ second: added });
      if (!after || reveal) drawing += label(200, 425, added ? 'Rtotal = 3 Ω; Itotal = 4 A' : 'Rtotal = 6 Ω; I = 2 A', 'middle', 'small');
      if (added) drawing += label(200, 470, 'Each branch: I = 12/6 = 2 A', 'middle', 'small');
      return { markup: drawing, height: 495 };
    }), state.compact);
    const left = 60, right = width - 40, span = right - left, top = 170;
    const broken = variant === 'failure' && reveal && progress >= .2;
    const closed = variant !== 'switch' || reveal && progress >= .25;
    const voltage = variant === 'series' ? '18 V' : variant === 'crane' ? reveal ? '6 V' : '? V' : variant === 'voltage' ? reveal ? '12 V' : '6 V' : '12 V';
    const components = [];
    const addResistor = (fraction, value) => { const center = left + fraction * span; components.push({ center, radius: 30, markup: resistor(center, top, value) }); };
    if (['ohm', 'voltage', 'series', 'crane'].includes(variant)) {
      if (variant === 'series') addResistor(.32, '3 Ω');
      addResistor(variant === 'series' ? .72 : .6, variant === 'crane' ? 'Coil: 3 Ω' : '6 Ω');
    } else {
      if (variant === 'failure') { const center = left + span * .32; components.push({ center, radius: 23, markup: lamp(center, top, broken ? 0 : 1, broken) }); }
      if (variant === 'switch') {
        const center = left + span * .28, radius = 26;
        components.push({ center, radius, markup: dot(center - radius, top, 3, ink) + dot(center + radius, top, 3, ink) + line(center - radius, top, center + radius, closed ? top : top - 35, ink, 2.5) });
      }
      if (variant === 'meter' && reveal) { const center = left + span * .3; components.push({ center, radius: 23, markup: dot(center, top, 23, '#fff', teal) + label(center, top + 7, 'A', 'middle') }); }
      const center = left + span * .72;
      components.push({ center, radius: 23, markup: lamp(center, top, broken || !closed ? 0 : 1) });
    }
    let drawing = label(width / 2, 35, variant === 'crane' ? 'Coil current limit: 2 A' : variant === 'failure' ? 'A series bulb breaks' : variant === 'meter' ? 'Measure current through the bulb' : 'Ideal source and connecting wires', 'middle', 'small');
    drawing += loop({ width, voltage, components, current: closed && !broken && (reveal || variant === 'failure') });
    if (variant === 'meter' && !reveal) drawing += dot(width / 2, 440, 23, '#fff', teal) + label(width / 2, 447, 'A', 'middle');
    if (reveal) {
      const captions = {
        ohm: ['I = V/R = 12/6 = 2 A', 'The same current flows around the loop.'],
        voltage: ['I: 6/6 = 1 A → 12/6 = 2 A', 'Same resistance; double voltage.'],
        series: ['Rtotal = 3 + 6 = 9 Ω', 'I = 18/9 = 2 A everywhere'],
        crane: ['I = 6/3 = 2 A: at the limit', '12 V would give 4 A: too much.'],
        switch: [closed ? 'Complete path: the bulb lights' : 'The switch is closing', 'No current can cross the open gap.'],
        failure: [broken ? 'Open path: I = 0 everywhere' : 'Both bulbs initially conduct', 'Breaking either bulb stops both.'],
        meter: ['Ammeter in series: same current', 'Never connect it across the source.']
      };
      drawing += label(width / 2, 475, captions[variant][0], 'middle', 'small') + label(width / 2, 520, captions[variant][1], 'middle', 'small');
    }
    return single(drawing, width, 550);
  }
  function conversion(lesson, state) {
    const width = state.compact ? 420 : 840, center = width / 2;
    let drawing = label(center, 35, lesson.variant === 'current' ? 'Measure charge crossing a section' : 'Micro means one millionth', 'middle', 'strong');
    if (lesson.variant === 'current') {
      drawing += box(30, 140, width - 60, 110, '#eef5f9', '#a7becd', 20) + line(center, 105, center, 280, rust, 2, '6 5') + label(center, 315, 'Counting plane', 'middle');
      for (let index = 0; index < 8; index++) {
        const start = 40 + index * (center - 65) / 8;
        const position = state.reveal ? start + (center - 15) * Math.min(1, state.progress * 1.4) : start;
        drawing += dot(position, 175 + index % 2 * 35, 6, blue);
      }
      drawing += label(center, 85, 'ΔQ = 8 C in Δt = 5 s', 'middle');
      if (state.reveal) drawing += label(center, 380, 'Iavg = ΔQ/Δt = 8/5 = 1.6 A', 'middle', 'small');
      drawing += label(center, 435, 'Dots represent charge amounts, not electrons', 'middle', 'small');
    } else {
      drawing += label(center, 115, '4 μC', 'middle', 'isotope') + arrow(center, 145, center, 200, blue, 3);
      if (state.reveal) drawing += label(center, 245, '4 μC × (10⁻⁶ C / 1 μC)', 'middle') + label(center, 310, '= 4 × 10⁻⁶ C', 'middle', 'strong') + label(center, 375, '= 0.000004 C', 'middle', 'strong');
      drawing += label(center, 440, 'Units cancel; the physical charge is unchanged', 'middle', 'small');
    }
    return single(drawing, width, 470);
  }
  Object.assign(window.Unit6Diagrams.helpers, { resistor, lamp, source });
  Object.assign(window.Unit6Diagrams.scenes, { circuit, conversion });
})();
