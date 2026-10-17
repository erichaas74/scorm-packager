(() => {
  'use strict';
  const ink = '#172f46', blue = '#23649a', teal = '#087c80', rust = '#a94b24', gold = '#f6ce43', muted = '#708595';
  const escape = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
  const label = (x, y, value, anchor = 'start', kind = '') => `<text x="${x}" y="${y}" text-anchor="${anchor}" class="${kind}">${escape(value)}</text>`;
  const line = (x1, y1, x2, y2, color = muted, width = 1.5, dash = '') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}" ${dash ? `stroke-dasharray="${dash}"` : ''}/>`;
  const path = (points, color = teal, width = 3, dash = '') => `<path d="${points.map((point, index) => `${index ? 'L' : 'M'}${point[0].toFixed(2)},${point[1].toFixed(2)}`).join(' ')}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linejoin="round" ${dash ? `stroke-dasharray="${dash}"` : ''}/>`;
  const box = (x, y, width, height, fill = '#f0f7fa', stroke = '#bccdd8', radius = 0) => `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="${fill}" stroke="${stroke}"/>`;
  const dot = (x, y, radius = 4, fill = teal, stroke = '#fff') => `<circle cx="${x}" cy="${y}" r="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="1.2"/>`;
  function arrow(x1, y1, x2, y2, color = blue, width = 2.4, both = false) {
    if (Math.hypot(x2 - x1, y2 - y1) < 1) return '';
    const head = (startX, startY, endX, endY) => {
      const angle = Math.atan2(endY - startY, endX - startX);
      return path([[endX - 8 * Math.cos(angle - .45), endY - 8 * Math.sin(angle - .45)], [endX, endY], [endX - 8 * Math.cos(angle + .45), endY - 8 * Math.sin(angle + .45)]], color, width);
    };
    return line(x1, y1, x2, y2, color, width) + head(x1, y1, x2, y2) + (both ? head(x2, y2, x1, y1) : '');
  }
  function ray(x1, y1, x2, y2) {
    return line(x1, y1, x2, y2, '#826522', 5) + arrow(x1, y1, x2, y2, gold, 3);
  }
  function sample(start, end, fn, steps = 200) {
    return Array.from({ length: steps + 1 }, (_, index) => { const position = start + (end - start) * index / steps; return [position, fn(position)]; });
  }
  function dimension(x1, x2, y, value) {
    return line(x1, y - 6, x1, y + 6, ink) + line(x2, y - 6, x2, y + 6, ink) + arrow(x1, y, x2, y, ink, 1.5, true) + label((x1 + x2) / 2, y - 12, value, 'middle');
  }
  function arc(centerX, centerY, radius, start, end, color = blue) {
    const points = Array.from({ length: 41 }, (_, index) => { const angle = start + (end - start) * index / 40; return [centerX + radius * Math.cos(angle), centerY + radius * Math.sin(angle)]; });
    return path(points, color, 1.8);
  }
  function graph({ width = 400, baseline = 210, top = 95, bottom = 285, xmax = 4, ticks = [0, 1, 2, 3, 4], xlabel = 'Position (m)', ylabel = 'Displacement (cm)' } = {}) {
    const left = 55, right = width - 25;
    let markup = label(left, top - 25, ylabel) + arrow(left, bottom, left, top, ink, 1.4) + arrow(left, baseline, right + 6, baseline, ink, 1.4);
    for (const tick of ticks) {
      const position = left + tick / xmax * (right - left);
      markup += line(position, baseline - 4, position, baseline + 4, ink) + label(position, bottom + 23, tick, 'middle', 'small');
    }
    markup += label((left + right) / 2, bottom + 52, xlabel, 'middle');
    return { markup, left, right, scale: (right - left) / xmax };
  }
  function panels(items, compact) {
    let offset = 0;
    const height = compact ? items.reduce((sum, item) => sum + item.height + 14, 0) : Math.max(...items.map(item => item.height)) + 20;
    const markup = items.map((item, index) => {
      const x = compact ? 10 : 10 + index * 420;
      const y = compact ? offset + 10 : 10;
      offset += item.height + 14;
      return `<g transform="translate(${x} ${y})">${box(0, 0, 400, item.height, '#fff', '#d0dce3', 8)}${item.markup}</g>`;
    }).join('');
    return { markup, width: compact ? 420 : items.length * 420, height };
  }
  const single = (markup, width, height) => ({ markup, width, height });
  const degrees = radians => radians * 180 / Math.PI;
  const radians = angle => angle * Math.PI / 180;
  const refracted = (n1, n2, angle) => Math.asin(n1 * Math.sin(angle) / n2);
  const critical = (n1, n2 = 1) => Math.asin(n2 / n1);
  const lensImage = (focal, distance) => 1 / (1 / focal - 1 / distance);
  const physics = { refracted, critical, lensImage, intensityRatio: distanceRatio => 1 / distanceRatio ** 2, remaining: (initial, halfLives) => initial * 2 ** -halfLives, photonEnergy: wavelength => 1239.841984 / wavelength };
  const helpers = { ink, blue, teal, rust, gold, muted, label, line, path, box, dot, arrow, ray, sample, dimension, arc, graph, panels, single, degrees, radians, physics };
  window.Unit5Diagrams = {
    helpers,
    physics,
    scenes: {},
    render(lesson, state) {
      const result = this.scenes[lesson.type](lesson, state, helpers);
      result.markup = `<defs><linearGradient id="visibleSpectrum"><stop stop-color="#7352a5"/><stop offset=".23" stop-color="#638fc8"/><stop offset=".46" stop-color="#8ac59d"/><stop offset=".65" stop-color="#f0dd77"/><stop offset="1" stop-color="#ce7475"/></linearGradient></defs>${result.markup}`;
      return result;
    }
  };
})();
