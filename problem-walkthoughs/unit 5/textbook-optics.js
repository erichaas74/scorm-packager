(() => {
  'use strict';
  const { label, line, path, box, dot, arrow, ray, sample, dimension, arc, panels, single, ink, blue, teal, rust, muted, radians, degrees, physics } = window.Unit5Diagrams.helpers;
  function interfaceDiagram({ width = 400, upper, lower, angle = radians(45), outputAngle, reveal, progress = 1, outgoingProgress = 1, fromBelow = false, reflect = false, water = false }) {
    const center = width / 2, boundary = 225, length = 165;
    const incidentSign = fromBelow ? 1 : -1;
    let drawing = box(10, 60, width - 20, boundary - 60, '#f5f9fc', 'none') + box(10, boundary, width - 20, 190, '#e2f1f1', 'none');
    drawing += label(22, 37, upper, 'start', 'strong') + label(22, 450, lower, 'start', 'strong');
    drawing += line(10, boundary, width - 10, boundary, blue, 2) + label(width - 15, boundary - 12, 'Boundary', 'end', 'small');
    drawing += line(center, 74, center, 404, muted, 1.5, '6 6') + label(center + 10, 91, 'Normal', 'start', 'small');
    const startX = center - length * Math.sin(angle), startY = boundary + incidentSign * length * Math.cos(angle);
    const arrival = Math.min(1, progress);
    drawing += ray(startX, startY, startX + (center - startX) * arrival, startY + (boundary - startY) * arrival);
    const normalAngle = fromBelow ? Math.PI / 2 : -Math.PI / 2;
    drawing += arc(center, boundary, 47, normalAngle, normalAngle + incidentSign * angle) + label(25, fromBelow ? 385 : 115, `θ₁ = ${degrees(angle).toFixed(1)}°`);
    if (reveal) {
      const sign = reflect ? incidentSign : -incidentSign;
      const outgoing = reflect ? angle : outputAngle;
      const endX = center + length * outgoingProgress * Math.sin(outgoing), endY = boundary + sign * length * outgoingProgress * Math.cos(outgoing);
      drawing += ray(center, boundary, endX, endY);
      const normal = sign > 0 ? Math.PI / 2 : -Math.PI / 2;
      drawing += arc(center, boundary, 58, normal, normal - sign * outgoing, teal);
      drawing += label(width - 24, sign > 0 ? 385 : 123, `${reflect ? 'θr' : 'θ₂'} = ${degrees(outgoing).toFixed(1)}°`, 'end');
      if (water) {
        for (const distance of [45, 90, 135]) {
          const positionX = center - distance * Math.sin(angle), positionY = boundary - distance * Math.cos(angle);
          drawing += line(positionX - 30 * Math.cos(angle), positionY + 30 * Math.sin(angle), positionX + 30 * Math.cos(angle), positionY - 30 * Math.sin(angle), teal, 2);
          const lowerDistance = distance * 2 / 3;
          const lowerX = center + lowerDistance * Math.sin(outgoing), lowerY = boundary + lowerDistance * Math.cos(outgoing);
          drawing += line(lowerX - 30 * Math.cos(outgoing), lowerY + 30 * Math.sin(outgoing), lowerX + 30 * Math.cos(outgoing), lowerY - 30 * Math.sin(outgoing), teal, 2);
        }
      }
    }
    drawing += label(width / 2, 490, 'Angles measured from the normal', 'middle', 'small');
    return drawing;
  }
  function optics(lesson, state) {
    const { reveal, progress, compact } = state;
    if (lesson.variant === 'gem') return panels([{ name: 'Glass', index: 1.52 }, { name: 'Diamond', index: 2.42 }].map(material => ({ height: 510, markup: interfaceDiagram({ upper: 'Air · n₁ = 1.00', lower: `${material.name} · n₂ = ${material.index.toFixed(2)}`, outputAngle: physics.refracted(1, material.index, radians(45)), reveal, outgoingProgress: Math.min(1, progress * 2) }) })), compact);
    const width = compact ? 420 : 840;
    if (lesson.variant === 'water') {
      const diagramWidth = compact ? 420 : 640;
      let drawing = interfaceDiagram({ width: diagramWidth, upper: 'Deep water · v₁ = 3 m/s', lower: 'Shallow water · v₂ = 2 m/s', outputAngle: Math.asin(2 / 3 * Math.sin(Math.PI / 4)), reveal, water: true });
      if (reveal) drawing += label(diagramWidth / 2, 530, 'Closer wavefronts → shorter λ', 'middle') + label(diagramWidth / 2, 566, 'Frequency stays the same', 'middle');
      return single(drawing, diagramWidth, reveal ? 590 : 515);
    }
    const focal = (width - 90) / 5.5, objectX = 40, lensX = objectX + 2.5 * focal, imageX = lensX + physics.lensImage(focal, 2.5 * focal);
    const axis = 235, objectHeight = 65, imageHeight = objectHeight * (imageX - lensX) / (lensX - objectX);
    let drawing = label(width / 2, 35, 'Thin converging lens · object beyond 2F', 'middle', 'small') + line(20, axis, width - 15, axis, muted, 1.5);
    drawing += `<path d="M${lensX} 100 Q${lensX + 27} ${axis} ${lensX} 365 Q${lensX - 27} ${axis} ${lensX} 100Z" fill="#e0f1f5" stroke="${blue}" stroke-width="1.8"/>`;
    for (const [multiple, name] of [[-2, '2F'], [-1, 'F'], [1, 'F'], [2, '2F']]) drawing += dot(lensX + multiple * focal, axis, 3, ink) + label(lensX + multiple * focal, axis + (multiple > 0 ? -18 : 32), name, 'middle');
    drawing += arrow(objectX, axis, objectX, axis - objectHeight, rust, 4) + label(objectX - 15, 140, 'Object');
    if (reveal) {
      const end = imageX + (width - imageX - 22) * .7;
      const rays = [
        [[objectX, axis - objectHeight], [lensX, axis - objectHeight], [end, axis - objectHeight + (end - lensX) * objectHeight / focal]],
        [[objectX, axis - objectHeight], [lensX, axis], [end, axis + (end - lensX) * objectHeight / (lensX - objectX)]],
        [[objectX, axis - objectHeight], [lensX, axis + imageHeight], [end, axis + imageHeight]]
      ];
      rays.forEach((points, index) => {
        if (progress * 3 >= index || state.complete) {
          drawing += ray(...points[0], ...points[1]) + ray(...points[1], ...points[2]);
          const fraction = .35 + index * .25;
          const markerX = points[0][0] + (points[1][0] - points[0][0]) * fraction;
          const markerY = points[0][1] + (points[1][1] - points[0][1]) * fraction;
          drawing += dot(markerX, markerY, 11, '#fff', '#8c712b') + label(markerX, markerY + 6, index + 1, 'middle', 'small');
        }
      });
      if (progress > .75 || state.complete) drawing += arrow(imageX, axis, imageX, axis + imageHeight, blue, 4) + label(imageX, 355, 'Image', 'middle') + label(width / 2, 402, 'Real · inverted · smaller', 'middle', 'strong');
      drawing += label(25, 451, '1  Parallel → far focus', 'start', 'small') + label(25, 483, '2  Through center → undeviated', 'start', 'small') + label(25, 515, '3  Near focus → parallel', 'start', 'small');
      drawing += label(width / 2, 557, 'do = 2.5f → di = 1.67f', 'middle');
    } else drawing += label(width / 2, 420, 'Where will the rays meet?', 'middle');
    return single(drawing, width, reveal ? 585 : 450);
  }
  function refraction(lesson, state) {
    const scenario = lesson.cases[state.caseIndex];
    const angle = radians(30);
    const width = state.compact ? 420 : 640;
    return single(interfaceDiagram({ width, upper: `${scenario.from} · n₁ = ${scenario.n1.toFixed(2)}`, lower: `${scenario.to} · n₂ = ${scenario.n2.toFixed(2)}`, angle, outputAngle: physics.refracted(scenario.n1, scenario.n2, angle), reveal: state.reveal, progress: state.phase === 'watch' ? Math.min(1, state.elapsed / 1200) : 1, outgoingProgress: Math.min(1, state.progress * 2) }), width, 515);
  }
  function criticalAngle(lesson, state) {
    const material = lesson.cases[state.caseIndex];
    const limit = physics.critical(material.n1);
    const phase = state.phase;
    const reflection = ['reflection', 'hold'].includes(phase);
    let angle = limit;
    if (phase === 'increase') angle = radians(10) + (limit - radians(10)) * state.progress;
    if (reflection) angle += radians(15) * (phase === 'hold' ? 1 : state.progress);
    const total = angle > limit + 1e-9;
    const ratio = (1 / material.n1).toFixed(4), index = material.n1.toFixed(2);
    let drawing = interfaceDiagram({ upper: 'Air · n₂ = 1.00', lower: `${material.from} · n₁ = ${index}`, angle, outputAngle: total ? 0 : Math.asin(Math.min(1, material.n1 * Math.sin(angle))), reveal: true, fromBelow: true, reflect: total });
    if (!total) drawing += `<g opacity=".42">${ray(200, 225, 200 + 110 * Math.sin(angle), 225 + 110 * Math.cos(angle))}</g>` + label(382, 420, phase === 'increase' ? 'Reflected portion' : 'Reflected ray', 'end', 'small');
    const steps = {
      increase: ['Watch θ₁ and θ₂ grow', 'θ₂ grows faster than θ₁.', 'The dashed line is the normal.'],
      critical: ['At the critical angle', 'θ₂ = 90°', 'The refracted ray grazes', 'the boundary.'],
      sine: ['Snell’s law at the limit', 'n₁ sin θc = n₂ sin(90°)', 'sin(90°) = 1'],
      simplify: ['Substitute and simplify', `${index} sin θc = 1.00 × 1`, `${index} sin θc = 1.00`],
      divide: ['Divide both sides by n₁', `sin θc = 1.00 / ${index}`, `sin θc ≈ ${ratio}`],
      inverse: ['Take inverse sine', `θc = sin⁻¹(1.00 / ${index})`, 'Use degree mode.'],
      result: ['The critical angle', `θc ≈ ${degrees(limit).toFixed(1)}°`, 'This is the limiting angle,', 'not yet above the limit.'],
      reflection: ['Increase above θc', `θ₁ > ${degrees(limit).toFixed(1)}°`, 'No refracted ray enters air.', 'All light reflects inside.'],
      hold: ['Total internal reflection', 'Higher → lower index', 'AND θ₁ > θc', 'Reflected angle = incident angle', 'Ideal, lossless interface']
    };
    const rows = steps[phase];
    let explanation = label(25, 40, rows[0], 'start', 'strong');
    rows.slice(1).forEach((value, index) => { explanation += label(200, 110 + index * 53, value, 'middle', index === 0 ? 'strong' : ''); });
    if (['sine', 'simplify', 'divide', 'inverse', 'result'].includes(phase)) explanation += label(200, state.compact ? 330 : 430, 'The diagram stays at θ₂ = 90°', 'middle', 'small');
    return panels([{ markup: drawing, height: 515 }, { markup: explanation, height: state.compact ? 365 : 515 }], state.compact);
  }
  function diffraction(lesson, state) {
    if (lesson.variant === 'double') {
      const width = state.compact ? 420 : 840, barrier = width * .3, screen = width - 65, center = 225;
      let drawing = label(width / 2, 35, 'Coherent light · two narrow slits', 'middle', 'small');
      const slitY = [center - 28, center + 28];
      for (let position = 25; position < barrier - 10; position += 25) drawing += line(position, 115, position, 335, teal, 2);
      drawing += line(barrier, 95, barrier, slitY[0] - 6, ink, 6) + line(barrier, slitY[0] + 6, barrier, slitY[1] - 6, ink, 6) + line(barrier, slitY[1] + 6, barrier, 355, ink, 6);
      drawing += box(screen, 95, 24, 260, '#e5ebef') + label(screen + 12, 395, 'Screen', 'middle');
      if (state.reveal) {
        drawing += `<defs><clipPath id="waveFrontClip"><rect x="${barrier}" y="95" width="${screen - barrier}" height="260"/></clipPath></defs><g clip-path="url(#waveFrontClip)">`;
        for (const origin of slitY) for (let radius = 24; radius < (screen - barrier) * Math.min(1, state.progress * 2) + 40; radius += 24) drawing += arc(barrier, origin, radius, -Math.PI / 2, Math.PI / 2, '#94bdbd');
        drawing += '</g>';
        for (let vertical = 0; vertical < 260; vertical += 2) {
          const pathDifference = Math.hypot(screen - barrier, 95 + vertical - slitY[0]) - Math.hypot(screen - barrier, 95 + vertical - slitY[1]);
          const amplitude = Math.cos(Math.PI * pathDifference / 8) ** 2;
          drawing += box(screen + 1, 95 + vertical, 22, 2, `rgb(${Math.round(44 + 202 * amplitude)},${Math.round(60 + 151 * amplitude)},${Math.round(75 - 20 * amplitude)})`, 'none');
        }
        drawing += line(barrier, slitY[0], screen, center, rust, 1.5, '4 4') + line(barrier, slitY[1], screen, center, rust, 1.5, '4 4');
        drawing += label(width / 2, 440, 'Center: equal paths → bright', 'middle') + label(width / 2, 478, 'Bright: add · Dark: cancel', 'middle');
      }
      drawing += label(width / 2, 520, 'Selected wavefronts; schematic scale', 'middle', 'small');
      return single(drawing, width, 545);
    }
    return panels([40, 160].map(gap => {
      let drawing = label(200, 35, gap === 40 ? 'Opening a = λ' : 'Opening a = 4λ', 'middle', 'strong');
      for (const vertical of [80, 120, 160]) drawing += line(40, vertical, 360, vertical, teal, 2);
      drawing += line(20, 190, 200 - gap / 2, 190, ink, 7) + line(200 + gap / 2, 190, 380, 190, ink, 7);
      if (state.reveal) {
        for (const radius of [40, 80, 120, 160]) {
          if (gap === 40) drawing += arc(200, 190, radius, 0, Math.PI, teal);
          else {
            drawing += line(200 - gap / 2, 190 + radius, 200 + gap / 2, 190 + radius, teal, 2);
            drawing += arc(200 - gap / 2, 190, radius, Math.PI / 2, Math.PI * .7, teal) + arc(200 + gap / 2, 190, radius, Math.PI * .3, Math.PI / 2, teal);
          }
        }
        drawing += label(200, 405, gap === 40 ? 'Strong spreading' : 'Mostly forward; edge spreading', 'middle', 'small');
      }
      drawing += label(200, 445, 'Same wavelength in both cases', 'middle', 'small');
      return { markup: drawing, height: 470 };
    }), state.compact);
  }
  Object.assign(window.Unit5Diagrams.scenes, { optics, refraction, critical: criticalAngle, diffraction });
})();
