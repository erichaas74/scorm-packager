(() => {
  'use strict';
  const { label, line, arrow, box, single, path } = window.Unit5Diagrams.helpers;
  const scene = document.getElementById('scene');
  const prompt = document.getElementById('prompt');
  const explanation = document.getElementById('explanation');
  const start = document.getElementById('start');
  const advance = document.getElementById('advance');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const transmission = (intensity, angle) => intensity * Math.cos(angle * Math.PI / 180) ** 2;
  window.polarizationPhysics = { transmission };
  let phase = 'off', elapsed = 0, lastTime = null, paused = false, completed = false, waveTime = 0;
  function filter(center, vertical, angle, name, compact, offset = 0) {
    const projection = compact ? 'matrix(.35 .55 -1 0 0 0)' : 'matrix(.55 .35 0 1 0 0)';
    let stripes = '';
    for (let position = -56; position <= 56; position += 14) stripes += line(position, -70, position, 70, '#88b5ca', 2);
    const stand = compact ? '' : `<ellipse cx="${center + 19}" cy="397" rx="57" ry="11" fill="#dce5eb"/>` + box(center + 22, vertical + 60, 12, 78, 'url(#metalRim)', '#668195', 3) + `<path d="M${center - 14} 388 L${center + 46} 388 L${center + 65} 402 L${center + 5} 402Z" fill="#b9cbd7" stroke="#668195"/>`;
    return `<g transform="translate(${compact ? offset : 0} ${compact ? 0 : -offset})">` + stand +
      `<g transform="translate(${center} ${vertical}) ${projection}"><ellipse cx="14" cy="5" rx="74" ry="84" fill="url(#metalRim)" stroke="#456b87" stroke-width="2"/><ellipse rx="70" ry="80" fill="url(#filterGlass)" stroke="#315d7b" stroke-width="4"/><ellipse cx="-4" cy="-3" rx="64" ry="74" fill="none" stroke="#f7fdff" stroke-width="2"/><g clip-path="url(#filterFace)"><g transform="rotate(${angle})">${stripes}</g></g><g transform="rotate(${angle})">${arrow(0, 56, 0, -56, '#163d58', 4, true)}</g></g></g>` +
      label(compact ? 72 : center, compact ? vertical + 8 : vertical + 114, `${angle.toFixed(0)}°`, 'middle', 'strong');
  }
  function render() {
    const compact = innerWidth <= 760, width = compact ? 420 : 900;
    const center = width / 2, progress = Math.min(1, elapsed / (phase === 'insert' ? 3250 : 6500));
    const second = !['off', 'single'].includes(phase);
    const third = ['predict', 'insert', 'complete'].includes(phase);
    const angle = phase === 'rotate' ? progress * 90 : ['crossed', 'predict', 'insert', 'complete'].includes(phase) ? 90 : 0;
    const inserted = phase === 'complete';
    const insertionOffset = phase === 'insert' ? 160 * (1 - progress) : 0;
    const coverage = inserted ? 1 : phase === 'insert' ? Math.max(0, Math.min(1, (106 - insertionOffset) / 52)) : 0;
    document.getElementById('mind-blown').hidden = coverage === 0;
    const lit = phase !== 'off';
    const output = !lit ? 0 : coverage > 0 ? coverage * transmission(transmission(50, 45), 45) : transmission(50, angle);
    const positions = compact ? [center, center, center] : [second ? 210 : 400, 400, 590];
    const levels = compact ? [285, 450, third ? 615 : 450] : [250, 250, 250];
    const screenY = compact ? (second ? levels[2] : levels[0]) + 145 : 250;
    let drawing = '<defs><clipPath id="filterFace"><ellipse rx="66" ry="76"/></clipPath><radialGradient id="bulbGlow"><stop stop-color="#fff7a9"/><stop offset="1" stop-color="#f5c74b"/></radialGradient></defs>';
    drawing += '<defs><linearGradient id="metalRim"><stop stop-color="#56758b"/><stop offset=".45" stop-color="#e2edf4"/><stop offset="1" stop-color="#7796aa"/></linearGradient><linearGradient id="filterGlass" x2="1" y2="1"><stop stop-color="#f3fbff"/><stop offset=".5" stop-color="#c9e5f0"/><stop offset="1" stop-color="#e8f5fa"/></linearGradient><radialGradient id="screenSpot"><stop stop-color="#ffffff"/><stop offset=".3" stop-color="#fffde5"/><stop offset=".65" stop-color="#ffe978"/><stop offset="1" stop-color="#ffd34a" stop-opacity="0"/></radialGradient></defs>';
    if (!compact) drawing += '<path d="M80 375 L810 375 L875 425 L140 425Z" fill="#f1f5f8" stroke="#dce5ec"/>';
    const sourceX = compact ? center : 55, sourceY = compact ? 115 : 250;
    const beam = (fromX, fromY, toX, toY, intensity) => intensity < .001 ? '' :
      `<path d="M${fromX} ${fromY} L${toX} ${toY}" stroke="#f2c945" stroke-width="52" opacity="${.8 * Math.sqrt(intensity / 100)}" fill="none"/>`;
    const through = !lit ? 0 : 50 - 25 * coverage;
    drawing += beam(sourceX, sourceY, positions[0], levels[0], lit ? 100 : 0);
    if (second) {
      if (third) {
        drawing += beam(positions[0], levels[0], positions[1], levels[1], lit ? 50 : 0);
        drawing += beam(positions[1], levels[1], positions[2], levels[2], through);
      } else drawing += beam(positions[0], levels[0], positions[2], levels[2], lit ? 50 : 0);
    }
    drawing += beam(positions[second ? 2 : 0], levels[second ? 2 : 0], compact ? center : 810, screenY, output);
    drawing += `<circle cx="${sourceX}" cy="${sourceY}" r="28" fill="${lit ? 'url(#bulbGlow)' : '#eef2f5'}" stroke="#96752b" stroke-width="2"/>` +
      box(sourceX - 17, sourceY + 26, 34, 18, '#b9c8d1', '#526c80', 4) +
      line(sourceX - 14, sourceY + 33, sourceX + 14, sourceY + 33, '#526c80', 2);
    const field = (fromX, fromY, toX, toY, orientation, intensity, opacity = 1) => {
      if (intensity < .001) return '';
      const amplitude = 44 * Math.sqrt(intensity / 50), span = compact ? toY - fromY : toX - fromX;
      const radians = orientation * Math.PI / 180;
      const transverse = Math.cos(radians), depth = Math.sin(radians);
      const project = (distance, displacement) => compact
        ? [fromX + displacement * (transverse + .35 * depth), fromY + distance + displacement * .55 * depth]
        : [fromX + distance + displacement * .55 * depth, fromY + displacement * (.35 * depth - transverse)];
      const axisStart = project(0, 0), axisEnd = project(span, 0);
      const plane = [project(0, amplitude), project(span, amplitude), project(span, -amplitude), project(0, -amplitude)];
      const samples = Math.ceil(span / 2);
      const points = Array.from({ length: samples + 1 }, (_, sample) => {
        const distance = sample / samples * span;
        const position = (compact ? fromY : fromX) + distance;
        return project(distance, amplitude * Math.sin(position * Math.PI * 2 / 110 - waveTime * 3));
      });
      let drawing = `<g data-wave-angle="${orientation}" data-wave-intensity="${intensity}" data-wave-span="${span}" opacity="${opacity}"><polygon points="${plane.map(point => point.join(',')).join(' ')}" fill="#b9e1ed" fill-opacity=".12"/>`;
      drawing += line(...axisStart, ...axisEnd, '#91a9b8', 1, '3 4');
      const ribbon = [axisStart, ...points, axisEnd];
      drawing += `<polygon points="${ribbon.map(point => point.join(',')).join(' ')}" fill="#3186a5" fill-opacity=".16"/>`;
      for (let sample = 8; sample < samples; sample += 12) {
        const origin = project(sample / samples * span, 0);
        drawing += arrow(...origin, ...points[sample], '#28738e', 1.2);
      }
      return drawing + path(points, '#125d82', 3) + '</g>';
    };
    if (lit) {
      const span = compact ? levels[0] - sourceY : positions[0] - sourceX;
      drawing += '<g data-unpolarized-field="true">';
      for (const component of [1, 0]) {
        const project = (distance, displacement) => compact
          ? [sourceX + displacement * (component ? .35 : 1), sourceY + distance + displacement * (component ? .55 : 0)]
          : [sourceX + distance + displacement * (component ? .55 : 0), sourceY + displacement * (component ? .35 : -1)];
        const points = [], origins = [];
        for (let distance = 35; distance <= span; distance += 1) {
          const travelingPhase = distance * Math.PI * 2 / 100 - waveTime * 3;
          const phaseVariation = component
            ? 1.7 * Math.sin(travelingPhase * .37 + 1.2) + .8 * Math.sin(travelingPhase * .71)
            : .6 * Math.sin(travelingPhase * .29);
          const envelope = Math.min(1, (distance - 35) / 18);
          const displacement = 44 * envelope * Math.sin(travelingPhase + phaseVariation);
          origins.push(project(distance, 0));
          points.push(project(distance, displacement));
        }
        const color = component ? '#4b65ad' : '#a84417';
        const fill = component ? '#b8c9f5' : '#ffb477';
        drawing += `<g data-field-direction="${component * 90}"><polygon points="${[origins[0], ...points, origins[origins.length - 1]].map(point => point.join(',')).join(' ')}" fill="${fill}" fill-opacity=".7"/>`;
        for (let sample = 5; sample < points.length; sample += 9) drawing += line(...origins[sample], ...points[sample], color, .9);
        drawing += path(points, color, 2.2) + '</g>';
      }
      drawing += '</g>';
    }
    const waveBetween = (from, to, orientation, intensity, opacity = 1) => field(positions[from], levels[from], positions[to], levels[to], orientation, intensity, opacity);
    if (second) drawing += waveBetween(0, third ? 1 : 2, 0, lit ? 50 : 0);
    if (third) {
      if (coverage < 1) drawing += waveBetween(1, 2, 0, 50, 1 - coverage);
      if (coverage > 0) drawing += waveBetween(1, 2, 45, 25, coverage);
    }
    drawing += field(positions[second ? 2 : 0], levels[second ? 2 : 0], compact ? center : 810, screenY, angle, output);
    drawing += filter(positions[0], levels[0], 0, 'First filter', compact);
    if (second) drawing += filter(positions[2], levels[2], angle, 'Second filter', compact);
    if (phase === 'insert' || phase === 'complete') {
      drawing += filter(positions[1], levels[1], 45, 'Middle filter', compact, insertionOffset);
    } else if (phase === 'predict') {
      drawing += `<ellipse data-middle-slot="true" transform="translate(${positions[1]} ${levels[1]}) ${compact ? 'matrix(.35 .55 -1 0 0 0)' : 'matrix(.55 .35 0 1 0 0)'}" rx="70" ry="80" fill="none" stroke="#9db3c1" stroke-width="1.5" stroke-dasharray="6 6"/>`;
    }
    const screenShape = compact ? `M125 ${screenY - 40} L285 ${screenY - 40} L315 ${screenY + 40} L95 ${screenY + 40}Z` : 'M760 155 L865 190 L865 355 L760 320Z';
    drawing += `<path d="${screenShape}" transform="translate(7 6)" fill="#8298a8"/><path d="${screenShape}" fill="#263d50" stroke="#68869b" stroke-width="3"/>`;
    drawing += `<ellipse data-screen-glow="${output / 50}" cx="${compact ? center : 812}" cy="${screenY}" rx="${compact ? 82 : 46}" ry="${compact ? 30 : 72}" fill="url(#screenSpot)" opacity="${output < .001 ? 0 : Math.sqrt(Math.min(1, output / 50))}"/>`;
    if (['single', 'aligned', 'crossed', 'predict', 'complete'].includes(phase)) {
      drawing += label(compact ? center : 810, compact ? screenY + 80 : 390, ['single', 'aligned'].includes(phase) ? '50%' : ['crossed', 'predict'].includes(phase) ? '0%' : '12.5%', 'middle', 'strong');
    }
    const result = single(drawing, width, compact ? screenY + 105 : 435);
    scene.innerHTML = result.markup;
    const top = compact ? 65 : 105;
    scene.setAttribute('viewBox', `0 ${top} ${result.width} ${result.height - top}`);
    scene.dataset.phase = phase;
    scene.dataset.output = output < .001 ? '0' : output.toFixed(4);
    scene.dataset.filterCount = String(second ? (phase === 'insert' || phase === 'complete' ? 3 : 2) : 1);
    scene.setAttribute('aria-label', `Unpolarized light has varying electric-field directions before the first filter; after it, the field oscillates in one plane. First filter 0 degrees. ${second ? `Second filter ${angle.toFixed(0)} degrees.` : 'One filter only.'} ${inserted ? 'Middle filter 45 degrees.' : ''} Transmitted light ${Number(scene.dataset.output)} percent of the original.`);
  }
  function setPhase(next) {
    phase = next; elapsed = 0;
    paused = false;
    document.getElementById('mind-blown').style.animationPlayState = 'running';
    start.hidden = phase !== 'off';
    advance.hidden = !['single', 'aligned', 'rotate', 'crossed'].includes(phase) || phase === 'rotate' && !reduced.matches;
    advance.textContent = phase === 'single' ? 'Part 2: Add second filter' : phase === 'crossed' ? 'Part 3: Add a third filter' : phase === 'aligned' ? 'Rotate the second filter' : 'Rotate another 15°';

    const messages = {
      off: ['Turn on the light.', ''],
      single: ['One filter: 50% transmitted.', 'The filter transmits the electric-field component parallel to its transmission axis.'],
      aligned: ['Two aligned filters: still 50%.', 'Rotate the second filter and watch the light dim.'],
      rotate: ['Watch the spot on the screen dim.', ''],
      crossed: ['Crossed filters: no light.', ''],
      insert: ['Adding a third filter…', 'How can adding more filters cause more light to get through???'],
      complete: ['Mind blown—light returns!', 'How can adding more filters cause more light to get through???']
    };
    [prompt.textContent, explanation.textContent] = messages[phase];
    document.title = prompt.textContent;
    explanation.parentElement.hidden = !explanation.textContent;
    if (phase === 'complete' && !completed) { completed = true; window.parent.postMessage({ type: 'complete' }, '*'); }
    render();
  }
  start.addEventListener('click', () => setPhase('single'));
  advance.addEventListener('click', () => {
    if (phase === 'single') setPhase('aligned');
    else if (phase === 'aligned') setPhase('rotate');
    else if (phase === 'crossed') setPhase(reduced.matches ? 'complete' : 'insert');
    else if (phase === 'rotate' && reduced.matches) { elapsed += 6500 / 6; if (elapsed >= 6499) setPhase('crossed'); else render(); }
  });
  document.getElementById('replay').addEventListener('click', () => { paused = false; lastTime = null; waveTime = 0; setPhase('single'); });
  addEventListener('resize', render);
  reduced.addEventListener('change', () => { paused = false; if (phase === 'insert' && reduced.matches) setPhase('complete'); else if (phase === 'rotate') setPhase('rotate'); else render(); });
  function frame(timestamp) {
    const delta = lastTime === null ? 0 : Math.min(100, timestamp - lastTime); lastTime = timestamp;
    if (!paused && !reduced.matches && phase !== 'off') {
      waveTime += delta / 1000;
      if (['rotate', 'insert'].includes(phase)) {
        elapsed += delta;
        if (elapsed >= (phase === 'rotate' ? 6500 : 3250)) setPhase(phase === 'rotate' ? 'crossed' : 'complete'); else render();
      } else render();
    }
    requestAnimationFrame(frame);
  }
  setPhase('single'); requestAnimationFrame(frame);
})();
