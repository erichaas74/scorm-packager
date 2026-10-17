'use strict';

window.unit6Scenes = ({ lesson, colors, text, line, arrow, circle, rect, curve, bracket }) => {

  function polarity(x, y, positive, color = colors.dark) {
    return line(x - 8, y, x + 8, y, color, 3) + (positive ? line(x, y - 8, x, y + 8, color, 3) : '');
  }

  function charge(x, y, sign, label = '', radius = 32) {
    const fill = sign === '−' ? '#d5e9fa' : sign === '+' ? '#fae3cb' : '#dce8ee';
    return circle(x, y, radius, fill, sign === '−' ? colors.blue : colors.orange) + text(x, y + 9, sign, 'middle') + (label ? text(x, y + radius + 37, label, 'middle', 'small') : '');
  }

  function bulb(x, y, lit = false, brightness = 1) {
    return (lit ? `<circle cx="${x}" cy="${y - 10}" r="47" fill="#f5d96b" opacity="${brightness * .35}"/>` : '') + circle(x, y - 10, 26, lit ? '#ffed98' : '#e6edf2', '#7998af') + `<path d="M${x - 11} ${y + 9} L${x - 7} ${y - 14} L${x} ${y - 2} L${x + 7} ${y - 14} L${x + 11} ${y + 9}" fill="none" stroke="${lit ? '#b47b16' : '#7890a5'}" stroke-width="3"/>` + rect(x - 15, y + 13, 30, 19, '#94adbf', '#5e7c92', 3);
  }

  function battery(x, y, voltage) {
    return rect(x - 35, y - 45, 70, 90, '#d6e6ef', '#6e91aa') + rect(x - 14, y - 52, 28, 7, '#7895aa', '#7895aa', 1) + polarity(x, y - 20, true) + polarity(x, y + 20, false) + text(x, y + 80, voltage, 'middle', 'small');
  }

  function resistor(x, y, value, width = 90) {
    return rect(x - width / 2, y - 18, width, 36, '#e1eee7', '#538779', 3) + text(x, y - 33, value, 'middle', 'small');
  }

  function coil(x, y, width, turns = 9, core = true) {
    let drawing = core ? rect(x - 10, y - 17, width + 20, 34, '#b4c9d6', '#7393a9', 4) : '';
    for (let turn = 0; turn < turns; turn++) drawing += `<ellipse cx="${turns === 1 ? x + width / 2 : x + turn * width / (turns - 1)}" cy="${y}" rx="13" ry="45" fill="none" stroke="#af631e" stroke-width="5"/>`;
    return drawing;
  }

  function charges(reveal, progress) {
    const variant = lesson.variant;
    let drawing = '';
    if (variant === 'sharing') {
      const movement = reveal ? 115 * Math.sin(progress * Math.PI) : 0;
      const left = 230 + movement, right = 570 - movement;
      drawing += charge(left, 190, '+', reveal && progress > .55 ? '+2 nC' : '+6 nC', 55);
      drawing += charge(right, 190, reveal && progress > .55 ? '+' : '−', reveal && progress > .55 ? '+2 nC' : '−2 nC', 55);
      drawing += text(400, 55, 'Identical isolated metal spheres', 'middle', 'small');
      if (reveal) drawing += text(400, 365, 'Total: +6 − 2 = +4 nC', 'middle');
      return drawing;
    }
    if (variant === 'transfer' || variant === 'count') {
      const centers = variant === 'count' ? [400] : [230, 570];
      for (const [index, center] of centers.entries()) {
        drawing += circle(center, 205, 82, 'none', '#a8c3d7') + circle(center, 205, 34, '#f5ddc7', '#c18d58') + text(center, 214, '6+', 'middle');
        const count = variant === 'count' ? 7 : 6;
        for (let particle = 0; particle < count; particle++) {
          if (variant === 'transfer' && index === 0 && particle === 0 && reveal) continue;
          const angle = particle * 2 * Math.PI / count;
          drawing += circle(center + 82 * Math.cos(angle), 205 + 82 * Math.sin(angle), 10, colors.blue) + text(center + 82 * Math.cos(angle), 213 + 82 * Math.sin(angle), '−', 'middle', 'small');
        }
        drawing += text(center, 75, variant === 'count' ? '6 protons · 7 electrons' : `Atom ${index ? 'B' : 'A'}`, 'middle');
        if (reveal) drawing += text(center, 340, variant === 'count' ? 'Net charge = −e' : index ? 'Negative' : 'Positive', 'middle');
      }
      if (reveal && variant === 'transfer') drawing += circle(312 + 329 * progress, 205 + 41 * progress - 90 * Math.sin(progress * Math.PI), 11, colors.blue) + text(400, 390, 'Only an electron moves', 'middle');
      return drawing;
    }
    if (variant === 'conductor') {
      drawing += rect(110, 125, 580, 140, '#d9e7f0', '#789aad', 65) + text(400, 65, 'Metal conductor', 'middle');
      for (let index = 0; index < 10; index++) {
        const initialX = 145 + index % 2 * 25, initialY = 155 + Math.floor(index / 2) * 20;
        const finalX = 160 + index % 5 * 120, finalY = index < 5 ? 140 : 250;
        const amount = reveal ? progress : 0;
        drawing += charge(initialX + (finalX - initialX) * amount, initialY + (finalY - initialY) * amount, '−', '', 12);
      }
      if (reveal) drawing += text(400, 350, 'Electrons redistribute on the surface', 'middle', 'small');
      return drawing;
    }
    if (variant === 'polarization') {
      drawing += `<ellipse cx="200" cy="210" rx="70" ry="90" fill="#cbdff1" stroke="${colors.blue}" stroke-width="3"/>` + text(200, 219, '− − −', 'middle') + text(200, 355, 'Negative balloon', 'middle', 'small');
      drawing += rect(500, 85, 170, 250, '#e2e9ee', '#99afbd') + text(585, 55, 'Neutral wall', 'middle');
      for (let index = 0; index < 4; index++) {
        drawing += charge(reveal ? 525 : 555, 125 + index * 55, '+', '', 13) + charge(reveal ? 625 : 600, 125 + index * 55, '−', '', 13);
      }
      if (reveal) drawing += arrow(280, 210, 425, 210, colors.orange) + text(400, 390, 'Polarization creates a net attraction', 'middle', 'small');
      return drawing;
    }
    if (variant === 'potential') {
      const position = reveal ? 370 + 260 * progress : 370;
      drawing += charge(170, 200, '+', 'Fixed source', 45) + circle(position, 200, 13, colors.teal) + text(position, 155, 'Probe', 'middle');
      drawing += bracket(170, position, 300, reveal ? 'Larger r' : 'r');
      if (reveal) drawing += text(400, 370, 'V = kQ/r → lower potential', 'middle');
      return drawing;
    }
    if (variant === 'gravity') {
      for (let lane = 0; lane < 2; lane++) {
        const y = 135 + 165 * lane;
        drawing += text(40, y - 65, lane ? 'Like electric charges' : 'Ordinary masses');
        drawing += charge(250, y, lane ? '+' : 'm', '', 30) + charge(550, y, lane ? '+' : 'm', '', 30);
        if (reveal) drawing += arrow(lane ? 215 : 285, y, lane ? 130 : 370, y) + arrow(lane ? 585 : 515, y, lane ? 670 : 430, y);
      }
      return drawing;
    }
    const spread = reveal ? 70 * progress : 0;
    drawing += charge(260 - spread, 210, '+') + charge(540 + spread, 210, '+');
    drawing += text(400, 65, 'Two positive charges', 'middle');
    if (reveal) drawing += arrow(220 - spread, 210, 135 - spread, 210) + arrow(580 + spread, 210, 665 + spread, 210) + text(400, 350, 'Equal forces · opposite directions', 'middle', 'small');
    return drawing;
  }

  function plates(reveal, progress) {
    const variant = lesson.variant;
    const changingGap = variant === 'isolated' || variant === 'voltage';
    const top = changingGap ? 150 - (reveal ? 50 * progress : 0) : 100;
    const bottom = changingGap ? 250 + (reveal ? 50 * progress : 0) : 310;
    let drawing = rect(90, top - 9, 620, 18, '#f1d6bd', '#ac6d33', 3) + rect(90, bottom - 9, 620, 18, '#c6dff1', '#3976a3', 3);
    for (let index = 0; index < 6; index++) drawing += polarity(130 + index * 105, top - 24, true) + polarity(130 + index * 105, bottom + 28, false);
    for (const position of [230, 400, 570]) drawing += arrow(position, 165, position, 245, '#719cac', 3);
    if (changingGap) {
      drawing += text(400, 45, variant === 'isolated' ? 'Fixed charge · fixed plate area' : 'E = 100 N/C, held fixed', 'middle', 'small');
      drawing += text(400, 375, reveal ? variant === 'isolated' ? 'Same E · twice the voltage' : 'Gap: 4 cm → |ΔV| = 4 V' : 'Gap: 2 cm', 'middle');
    } else if (variant === 'trajectory') {
      const amount = reveal ? progress : 0;
      const x = 140 + 430 * amount, y = 160 + 115 * amount * amount;
      drawing += text(400, 45, 'Positive charge · downward field', 'middle', 'small');
      if (reveal) {
        const points = [];
        for (let step = 0; step <= 50 * amount; step++) points.push([140 + 430 * step / 50, 160 + 115 * Math.pow(step / 50, 2)]);
        drawing += curve(points, colors.orange, 3);
      }
      drawing += charge(x, y, '+', '', 17) + arrow(x + 25, y, x + 95, y + (reveal ? 38 * amount : 0), colors.blue, 4);
      drawing += text(400, 390, reveal ? 'Rightward motion + downward acceleration' : 'Initial velocity →', 'middle', 'small');
    } else {
      const y = variant === 'work' ? 260 - (reveal ? 110 * progress : 0) : 175 + (reveal ? 105 * progress : 0);
      drawing += charge(465, y, '+', '', 22);
      if (reveal) drawing += variant === 'work' ? arrow(510, y + 25, 510, y - 50, colors.orange) : arrow(510, y - 35, 510, y + 35, colors.orange);
      drawing += text(400, 45, 'Electric field: + plate to − plate', 'middle', 'small');
      if (reveal) drawing += text(400, 390, variant === 'work' ? 'External work increases potential energy' : 'F = qE points down', 'middle', 'small');
    }
    return drawing;
  }

  function distance(reveal, progress) {
    const variant = lesson.variant;
    const magnetic = variant === 'magnetic';
    const doublingCharge = variant === 'charge';
    const right = doublingCharge ? 570 : 400 + (reveal ? 220 * progress : 0);
    let drawing = text(400, 45, magnetic ? 'Long straight wire · fixed current' : doublingCharge ? 'Same separation · same q₂' : 'Same source · increasing distance', 'middle', 'small');
    drawing += magnetic ? circle(180, 200, 24, '#d9e7f0', colors.blue) + circle(180, 200, 6, colors.blue) : charge(180, 200, '+', doublingCharge && reveal ? '2q₁' : 'Source', 35);
    drawing += magnetic ? rect(right - 30, 175, 60, 50, '#cbe5e6', colors.teal) : charge(right, 200, '+', doublingCharge ? 'q₂' : 'Probe', 24);
    drawing += bracket(180, right, 290, doublingCharge ? 'r unchanged' : reveal ? '2r' : 'r');
    if (reveal) {
      const label = magnetic ? 'B₂ = B₁ / 2' : doublingCharge ? 'F₂ = 2F₁' : variant === 'electric' ? 'E₂ = E₁ / 4' : 'F₂ = F₁ / 4';
      drawing += text(400, 365, label, 'middle', 'value');
      if (!magnetic) drawing += arrow(right + 30, 200, right + (doublingCharge ? 130 : 60), 200, colors.orange, 4);
    }
    return drawing;
  }

  function field(reveal, progress) {
    const variant = lesson.variant;
    let drawing = '';
    if (variant === 'lines') {
      drawing += charge(400, 215, '+', '', 37) + text(400, 45, 'Positive source charge', 'middle');
      if (reveal) for (let index = 0; index < 8; index++) {
        const angle = index * Math.PI / 4;
        drawing += arrow(400 + 55 * Math.cos(angle), 215 + 55 * Math.sin(angle), 400 + 155 * Math.cos(angle), 215 + 155 * Math.sin(angle), colors.teal, 4);
      }
      return drawing;
    }
    if (variant === 'test') {
      drawing += charge(230, 215, '+', 'Source') + circle(530, 215, 7, colors.dark) + text(530, 175, 'P', 'middle');
      if (reveal) drawing += arrow(530, 215, 690, 215, colors.teal) + text(630, 280, 'E', 'middle');
      return drawing;
    }
    if (variant === 'sum') {
      drawing += charge(220, 285, '+', '+Q') + charge(580, 285, '+', '+Q') + circle(400, 175, 7, colors.dark) + text(435, 175, 'P');
      drawing += line(220, 285, 400, 175, '#9db4c7', 2, true) + line(580, 285, 400, 175, '#9db4c7', 2, true);
      if (reveal) drawing += arrow(400, 175, 500, 114, colors.orange) + arrow(400, 175, 300, 114, colors.blue) + arrow(400, 175, 400, 53, colors.teal, 6) + text(400, 395, 'Sideways cancels · upward adds', 'middle', 'small');
      return drawing;
    }
    drawing += charge(180, 210, '+', variant === 'force' ? '+2 μC' : '+Q') + charge(620, 210, '+', variant === 'force' ? '+1 μC' : '+Q');
    drawing += bracket(180, 400, 325, 'r') + bracket(400, 620, 325, 'r');
    drawing += charge(400, 210, '+', 'Test charge', 20);
    if (reveal) {
      drawing += arrow(400, 155, variant === 'force' ? 600 : 505, 155, colors.orange) + arrow(400, 100, variant === 'force' ? 300 : 295, 100, colors.blue);
      drawing += text(400, 390, variant === 'force' ? 'Stronger push from left → net force right' : 'Equal and opposite → zero net force', 'middle', 'small');
    }
    return drawing;
  }

  function wire(reveal, progress, time) {
    const variant = lesson.variant;
    let drawing = '';
    if (variant === 'resistance') {
      drawing += text(400, 45, 'Same material · area · temperature', 'middle', 'small');
      drawing += rect(120, 120, 250, 40, '#b8d5e5', '#7299b0', 15) + text(245, 95, 'Length L', 'middle');
      drawing += rect(120, 255, reveal ? 500 : 250, 40, '#b8d5e5', '#7299b0', 15) + text(370, 235, reveal ? 'Length 2L' : 'Length L', 'middle');
      if (reveal) drawing += text(400, 365, 'R = ρL/A → twice the resistance', 'middle');
      return drawing;
    }
    if (variant === 'drift') {
      drawing += rect(65, 140, 670, 120, '#d5e7f1', '#9db9cb', 35) + arrow(250, 80, 550, 80, colors.orange) + text(400, 50, 'Conventional current', 'middle');
      for (let index = 0; index < 24; index++) {
        const position = 100 + ((index % 12 * 50 - (reveal ? time * 18 : 0) + 600) % 600);
        drawing += circle(position, 175 + Math.floor(index / 12) * 45 + 3 * Math.sin(time * 10 + index), 6, colors.blue);
      }
      if (reveal) drawing += arrow(550, 320, 250, 320, colors.blue) + text(400, 370, 'Average electron drift', 'middle');
      return drawing;
    }
    const compass = variant === 'compass';
    drawing += text(400, 40, 'Current out of the screen: •', 'middle');
    drawing += circle(400, 230, 23, '#dce7ef', colors.blue) + circle(400, 230, 7, colors.blue);
    if (reveal) {
      for (const radius of [80, 140]) {
        drawing += circle(400, 230, radius, 'none', '#70a2b8');
        drawing += arrow(400 + radius, 235, 400 + radius, 205, colors.teal, 4);
      }
    }
    if (compass) {
      drawing += circle(400, 125, 32, '#fff', '#8aa9bf') + text(400, 80, 'N', 'middle', 'small');
      const angle = reveal ? -.65 * progress : 0;
      drawing += arrow(400, 125, 400 + 25 * Math.sin(angle), 125 - 25 * Math.cos(angle), colors.orange, 4);
      if (reveal) drawing += arrow(360, 125, 290, 125, colors.teal, 4) + text(400, 395, 'Above the wire, its field points left', 'middle', 'small');
    } else {
      drawing += circle(540, 230, 6, colors.dark) + text(575, 245, 'P');
      if (reveal) drawing += arrow(540, 230, 540, 120, colors.teal, 6) + text(400, 395, 'Counterclockwise field', 'middle');
    }
    return drawing;
  }

  function coilScene(reveal, progress) {
    const core = lesson.variant === 'core';
    const loops = lesson.variant === 'loops';
    let drawing = text(400, 42, 'Current held fixed', 'middle');
    for (let lane = 0; lane < 2; lane++) {
      const center = 210 + lane * 380;
      drawing += coil(center - 85, 195, 170, loops ? lane ? 8 : 1 : lane && !core ? 12 : 6, core ? Boolean(lane) : false);
      drawing += text(center, 95, core ? lane ? 'Soft iron core' : 'Air core' : loops ? lane ? 'Aligned loops' : 'One loop' : lane ? '100 turns' : '50 turns', 'middle', 'small');
      if (reveal) {
        drawing += arrow(center - 70, 195, center + (lane ? 95 : 20), 195, colors.teal, lane ? 6 : 3);
        drawing += text(center, 310, lane ? 'Stronger field' : 'Weaker field', 'middle', 'small');
      }
    }
    if (reveal && lesson.variant === 'turns') drawing += text(400, 385, 'Same coil length: B ∝ N', 'middle');
    return drawing;
  }

  function graph(reveal, progress) {
    const current = lesson.variant === 'current';
    let drawing = arrow(130, 320, 690, 320, colors.dark, 3) + arrow(130, 320, 130, 65, colors.dark, 3);
    drawing += text(115, 45, current ? 'B (mT)' : 'B (μT)', 'middle', 'small') + text(560, 395, current ? 'Current (A)' : 'Distance (cm)', 'middle');
    const points = current ? [[260, 225], [390, 130]] : [[260, 120], [390, 220], [650, 270]];
    const labels = current ? [['1', '2'], ['2', '4']] : [['2', '20'], ['4', '10'], ['8', '5']];
    const visible = current ? reveal ? 2 : 1 : reveal ? 3 : 2;
    for (let index = 0; index < visible; index++) {
      const [x, y] = points[index];
      drawing += line(x, y, x, 320, '#adc6d5', 2, true) + circle(x, y, 9, colors.teal) + text(x, 355, labels[index][0], 'middle') + text(x + 18, y - 10, labels[index][1]);
    }
    if (reveal) {
      const trend = [];
      for (let distance = 2; distance <= 8; distance += .1) trend.push([130 + 65 * distance, 320 - 400 / distance]);
      drawing += current ? line(130, 320, 390, 130, colors.teal, 3) : curve(trend, colors.teal, 3);
    }
    else drawing += text(current ? 390 : 650, current ? 130 : 270, '?', 'middle');
    return drawing;
  }

  function circuit(reveal, progress) {
    const variant = lesson.variant;
    let drawing = '';
    function loop(left, top, width, height, voltage, components, lit) {
      let result = line(left, top, left + width, top, colors.blue, 5) + line(left + width, top, left + width, top + height, colors.blue, 5) + line(left + width, top + height, left, top + height, colors.blue, 5) + line(left, top + height, left, top, colors.blue, 5);
      result += battery(left, top + height / 2, voltage);
      for (const component of components) result += component.kind === 'bulb' ? bulb(component.x, top + 10, lit, component.brightness || 1) : resistor(component.x, top, component.label);
      return result;
    }
    if (variant === 'brightness') {
      drawing += text(220, 45, 'Series', 'middle') + text(600, 45, 'Parallel', 'middle');
      drawing += loop(80, 140, 270, 130, '12 V', [{ kind: 'bulb', x: 180, brightness: .25 }, { kind: 'bulb', x: 290, brightness: .25 }], reveal);
      drawing += loop(450, 140, 270, 130, '12 V', [], reveal);
      drawing += line(590, 140, 590, 270, colors.blue, 5) + bulb(590, 215, reveal) + bulb(720, 215, reveal);
      drawing += text(220, 385, reveal ? '6 V per bulb' : 'Identical bulbs', 'middle', 'small') + text(600, 385, reveal ? '12 V per bulb' : 'Identical bulbs', 'middle', 'small');
      return drawing;
    }
    const voltage = variant === 'series' ? '18 V' : variant === 'crane' ? '6 V' : variant === 'voltage' ? reveal ? '12 V' : '6 V' : '12 V';
    const resistorBased = ['ohm', 'voltage', 'parallel', 'series', 'crane'].includes(variant);
    drawing += loop(160, 120, 480, 170, voltage, resistorBased ? [{ kind: 'resistor', x: 450, label: variant === 'crane' ? 'Coil: 3 Ω' : '6 Ω' }] : [{ kind: 'bulb', x: 480 }], reveal && variant !== 'failure');
    if (variant === 'failure') {
      drawing += bulb(320, 130, !reveal) + bulb(480, 130, !reveal);
      if (reveal) drawing += rect(300, 95, 40, 50, '#f1f7fc', 'none', 0) + line(300, 110, 310, 90, colors.orange, 3) + line(330, 110, 340, 90, colors.orange, 3);
    }
    if (variant === 'series') drawing += resistor(290, 120, '3 Ω');
    if (variant === 'parallel' && reveal) drawing += line(260, 120, 260, 215, colors.blue, 5) + line(260, 215, 640, 215, colors.blue, 5) + resistor(450, 215, '6 Ω');
    if (variant === 'switch') drawing += line(290, 120, 370, 120, '#f1f7fc', 10) + circle(290, 120, 5, colors.blue) + circle(370, 120, 5, colors.blue) + line(290, 120, 370, reveal ? 120 : 80, colors.blue, 5);
    if (variant === 'meter') {
      if (reveal) drawing += circle(350, 120, 28, '#f5fbff', colors.teal) + text(350, 129, 'A', 'middle') + arrow(300, 185, 410, 185, colors.orange, 3);
      else drawing += circle(350, 120, 28, '#f5fbff', colors.teal) + text(350, 129, '?', 'middle');
    }
    const results = { ohm: 'I = 12 / 6 = 2 A', voltage: 'I: 1 A → 2 A', series: 'R = 9 Ω · I = 18 / 9 = 2 A', parallel: 'Rtotal = 3 Ω · Itotal = 4 A', switch: 'Closed path → current flows', failure: 'Open path → both bulbs go out', meter: 'Same current passes through the meter', crane: 'I = 6 / 3 = 2 A: within the limit' };
    drawing += text(400, 45, variant === 'crane' ? 'Current limit: 2 A' : variant === 'failure' ? 'Break one bulb' : variant === 'series' ? 'One loop · same current' : 'Ideal source and components', 'middle', 'small');
    drawing += text(400, 390, reveal ? results[variant] : variant === 'parallel' ? 'Add one parallel branch' : variant === 'crane' ? 'Choose 6 V or 12 V' : 'Predict before revealing', 'middle', 'small');
    if (reveal && resistorBased) drawing += arrow(570, 290, 470, 290, colors.orange, 4);
    return drawing;
  }

  function machine(reveal, progress, time) {
    const motor = lesson.variant === 'motor';
    const angle = reveal ? time * (lesson.variant === 'speed' ? 110 : 55) : 0;
    let drawing = rect(100, 95, 110, 220, '#f1d9c8', '#b67e52') + rect(590, 95, 110, 220, '#d0e3f3', '#5788b0') + text(155, 205, 'N', 'middle') + text(645, 205, 'S', 'middle');
    for (const y of [145, 205, 265]) drawing += arrow(220, y, 580, y, '#98bdca', 2);
    drawing += `<g transform="translate(400 205) scale(${Math.cos(angle * Math.PI / 180)} 1)"><rect x="-70" y="-55" width="140" height="110" rx="12" fill="none" stroke="#b66c24" stroke-width="7"/><rect x="-59" y="-44" width="118" height="88" rx="8" fill="none" stroke="#d59653" stroke-width="3"/></g>`;
    drawing += circle(400, 205, 9, '#385b73') + line(400, 205, 400, 325, '#55788e', 8);
    drawing += text(400, 45, motor ? 'Battery drives a coil' : 'A mechanical drive turns the coil', 'middle', 'small');
    if (reveal) {
      const statement = motor ? 'Electrical → mechanical' : lesson.variant === 'turns' ? 'Double turns → double peak emf' : lesson.variant === 'speed' ? 'Double speed → double peak emf' : 'Mechanical → electrical';
      drawing += text(400, 390, statement, 'middle', 'small');
      drawing += arrow(330, 335, 470, 335, colors.orange, 4);
    } else drawing += text(400, 375, lesson.variant === 'turns' ? 'N → 2N, other factors fixed' : lesson.variant === 'speed' ? 'ω → 2ω, same coil and field' : 'Energy transfer?', 'middle');
    return drawing;
  }

  function braking(reveal, progress) {
    let drawing = text(400, 40, 'Identical magnets · no contact', 'middle', 'small');
    for (let lane = 0; lane < 2; lane++) {
      const center = 230 + lane * 340;
      drawing += rect(center - 60, 100, 120, 230, lane ? '#ebc8a9' : '#d8eaf4', lane ? '#b68456' : '#94b7ce', 12);
      drawing += rect(center - 35, 100, 70, 230, '#f1f7fc', 'none', 0);
      const drop = reveal ? lane ? 160 * progress : 220 * Math.min(1, progress * 2) : 0;
      drawing += rect(center - 22, 105 + drop, 44, 25, '#d9a17e', '#b67e52', 2) + rect(center - 22, 130 + drop, 44, 25, '#98bfdc', '#5788b0', 2);
      drawing += text(center, 80, lane ? 'Copper' : 'Plastic', 'middle');
      if (reveal && lane) drawing += arrow(center + 90, 230, center + 90, 155, colors.orange) + text(center, 390, 'Magnetic braking', 'middle', 'small');
    }
    return drawing;
  }

  function conversion(reveal, progress) {
    const current = lesson.variant === 'current';
    let drawing = text(400, 70, current ? '8 C passes in 5 s' : 'Charge = 4 μC', 'middle');
    if (current) {
      drawing += rect(100, 155, 600, 80, '#d7e9f3', '#94b3c8', 20) + line(400, 125, 400, 270, colors.orange, 4, true);
      for (let index = 0; index < 8; index++) drawing += circle(140 + ((index * 65 + (reveal ? 260 * progress : 0)) % 520), 195, 10, colors.blue);
      if (reveal) drawing += text(400, 330, 'I = Q / t = 8 / 5 = 1.6 A', 'middle');
    } else {
      drawing += charge(400, 180, '+', '', 46) + text(400, 280, reveal ? 'μ means 10⁻⁶' : 'Convert to coulombs', 'middle');
      if (reveal) drawing += text(400, 355, '4 × 10⁻⁶ C = 0.000004 C', 'middle');
    }
    return drawing;
  }

  function experiment(reveal) {
    const variant = lesson.variant;
    let drawing = text(400, 42, 'Compare two trials', 'middle');
    const current = variant === 'current';
    for (let lane = 0; lane < 2; lane++) {
      const center = 210 + lane * 380;
      drawing += coil(center - 80, 190, 160, lane && !current ? 10 : 5, false);
      drawing += text(center, 90, `Trial ${lane + 1}`, 'middle');
      drawing += text(center, 295, `Turns: ${lane && !current ? 40 : 20}`, 'middle');
      drawing += text(center, 335, `Current: ${lane && (current || variant === 'unfair') ? 2 : 1} A`, 'middle');
    }
    if (reveal) drawing += text(400, 395, variant === 'unfair' ? 'Two changes: cannot isolate the cause' : current ? 'Only current changes' : 'Only turns change: 2 mT → 4 mT', 'middle', 'small');
    return drawing;
  }

  return { charges, plates, distance, field, wire, coil: coilScene, graph, circuit, machine, braking, conversion, experiment };
};
