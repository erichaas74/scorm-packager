(() => {
  'use strict';
  const { label, line, path, box, dot, arrow, sample, dimension, graph, panels, single, ink, blue, teal, rust, gold, muted, physics } = window.Unit5Diagrams.helpers;
  const decayOrder = Array.from({ length: 80 }, (_, index) => index);
  let decaySeed = 314159;
  for (let index = decayOrder.length - 1; index > 0; index--) {
    decaySeed = (1664525 * decaySeed + 1013904223) >>> 0;
    const target = Math.floor(decaySeed / 4294967296 * (index + 1));
    [decayOrder[index], decayOrder[target]] = [decayOrder[target], decayOrder[index]];
  }
  function photon(x, y, color = '#a77a14') {
    return path(sample(x - 18, x + 18, position => y - 7 * Math.sin((position - x) * Math.PI / 9) * Math.exp(-((position - x) ** 2) / 200), 50), color, 2.2);
  }
  function photons(lesson, state) {
    const { reveal, progress, compact } = state;
    if (lesson.variant === 'brightness') return panels([6, 12].map((count, index) => {
      let drawing = label(200, 35, index ? 'Twice the intensity' : 'Original intensity', 'middle', 'strong') + label(200, 77, 'Same area; same time: 1 s', 'middle', 'small');
      drawing += box(30, 105, 340, 150, '#fff9e7', '#ddceaa', 6);
      if (!index || reveal) {
        for (let packet = 0; packet < count; packet++) drawing += photon(72 + packet % 6 * 51, 155 + Math.floor(packet / 6) * 58);
        drawing += label(200, 295, `${count} photons arrive`, 'middle');
      } else drawing += label(200, 185, 'What changes?', 'middle');
      drawing += label(200, 341, 'Each photon: E = hf = 2 eV', 'middle', 'small');
      if (reveal) drawing += label(200, 385, `Total energy: ${count * 2} eV`, 'middle', 'strong');
      drawing += label(200, 430, 'Symbols count photons, not their size', 'middle', 'small');
      return { markup: drawing, height: 450 };
    }), compact);
    const ionization = lesson.variant === 'ionization';
    const threshold = ionization ? 12 : 2.3;
    return panels([ionization ? 5 : 1.5, ionization ? 15 : 3].map(energy => {
      const enough = energy > threshold;
      let drawing = label(200, 35, `${energy.toFixed(ionization ? 0 : 1)} eV photon`, 'middle', 'strong') + label(200, 75, `${ionization ? 'Ionization energy' : 'Work function'} = ${threshold} eV`, 'middle', 'small');
      if (ionization) {
        drawing += `<circle cx="240" cy="180" r="58" fill="none" stroke="${muted}" stroke-dasharray="4 4"/>` + dot(240, 180, 17, '#e9b9a3', rust);
      } else {
        drawing += box(205, 115, 80, 130, '#eef3f7', '#8ca4b6');
        for (let row = 0; row < 4; row++) for (let column = 0; column < 2; column++) drawing += dot(220 + column * 42, 132 + row * 32, 7, '#c4d7e5', '#637f95');
        drawing += label(247, 270, 'Metal', 'middle', 'small');
      }
      const impact = reveal && progress > .4;
      if (!impact) drawing += photon(65 + (reveal ? Math.min(1, progress / .4) * 135 : 0), 180) + arrow(55, 215, 140, 215, '#a77a14');
      if (impact && enough) {
        const distance = Math.min(1, (progress - .4) / .4);
        const start = ionization ? 298 : 278;
        drawing += dot(start + distance * (345 - start), 180 - distance * 45, 6, blue) + arrow(295, 200, 355, 150, blue);
      } else drawing += dot(ionization ? 298 : 278, 180, 6, blue);
      const baseline = 405, scale = 100 / (ionization ? 15 : 3);
      drawing += label(30, 298, 'Energy (eV)', 'start', 'small') + arrow(45, baseline, 45, 307, ink, 1.3) + label(32, baseline + 6, '0', 'end', 'small');
      drawing += line(50, baseline - threshold * scale, 360, baseline - threshold * scale, rust, 1.7, '5 4') + label(355, baseline - threshold * scale - 12, 'Threshold', 'end', 'small');
      drawing += box(75, baseline - energy * scale, 48, energy * scale, '#f9df86', '#8a712b') + label(100, 434, 'Photon', 'middle', 'small');
      if (impact) {
        drawing += label(260, 445, enough ? 'Electron escapes' : 'No electron escapes', 'middle', 'small');
        drawing += label(200, 492, enough ? `K${ionization ? '' : 'max'} = ${energy} − ${threshold} = ${(energy - threshold).toFixed(ionization ? 0 : 1)} eV` : 'Photon energy is below threshold', 'middle', 'small');
      }
      drawing += label(200, 534, 'Single-photon model; not to scale', 'middle', 'small');
      return { markup: drawing, height: 555 };
    }), compact);
  }
  function spectrum(lesson, state) {
    if (lesson.variant === 'doppler') {
      const width = state.compact ? 420 : 840, left = 45, right = width - 30;
      const map = wavelength => left + (wavelength - 400) / 300 * (right - left);
      let drawing = label(width / 2, 35, 'Match the same absorption lines', 'middle', 'strong');
      for (const [vertical, title, shift] of [[115, 'Laboratory', 1], [275, 'Distant star', 1.05]]) {
        drawing += label(left, vertical - 28, title) + box(left, vertical, right - left, 60, 'url(#visibleSpectrum)', 'none');
        for (const wavelength of [450, 480, 540, 620]) drawing += line(map(wavelength * shift), vertical, map(wavelength * shift), vertical + 60, ink, 4);
        for (const wavelength of [400, 500, 600, 700]) drawing += line(map(wavelength), vertical + 64, map(wavelength), vertical + 70, ink) + label(map(wavelength), vertical + 95, wavelength, 'middle', 'small');
      }
      drawing += label(width / 2, 415, 'Wavelength (nm)', 'middle');
      if (state.reveal) {
        drawing += arrow(map(540), 245, map(567), 245, rust, 2) + label(width / 2, 465, '540 nm → 567 nm', 'middle', 'strong') + label(width / 2, 505, 'Longer λ: source moving away', 'middle');
        drawing += label(width / 2, 545, 'Same fractional shift: Δλ/λ = 0.05', 'middle', 'small');
      }
      return single(drawing, width, state.reveal ? 570 : 445);
    }
    return panels([700, 350].map(wavelength => {
      const chart = graph({ baseline: 180, top: 100, bottom: 250, xmax: 1400, ticks: [0, 700, 1400], xlabel: 'Position (nm)', ylabel: 'Electric field (relative)' });
      let drawing = label(200, 35, wavelength === 700 ? 'Visible red' : 'Ultraviolet', 'middle', 'strong') + chart.markup;
      drawing += path(sample(chart.left, chart.right, position => 180 - 35 * Math.sin((position - chart.left) / chart.scale * 2 * Math.PI / wavelength)), wavelength === 700 ? '#ad4b4c' : '#7650a0');
      drawing += dimension(chart.left, chart.left + wavelength * chart.scale, 365, `λ = ${wavelength} nm`);
      if (state.reveal) drawing += label(200, 420, `E = ${physics.photonEnergy(wavelength).toFixed(2)} eV`, 'middle', 'strong') + label(200, 462, 'E = hc/λ; shorter λ → greater E', 'middle', 'small');
      drawing += label(200, 505, 'Same spatial scale; schematic field', 'middle', 'small');
      return { markup: drawing, height: 525 };
    }), state.compact);
  }
  function nucleus(centerX, centerY, protons, neutrons, radius = 48) {
    const count = protons + neutrons;
    let drawing = '';
    for (let particle = 0; particle < count; particle++) {
      const distance = radius * Math.sqrt((particle + .5) / count);
      const angle = particle * 2.399963;
      const proton = (particle * 73) % count < protons;
      drawing += dot(centerX + distance * Math.cos(angle), centerY + distance * Math.sin(angle), radius / Math.sqrt(count) * .91, proton ? '#e9b9a3' : '#accde5', proton ? rust : blue);
    }
    return drawing;
  }
  function nuclear(lesson, state) {
    const { reveal, progress, compact } = state;
    if (lesson.variant === 'alpha') {
      const width=compact?440:840, cx=width*.34, cy=220, radius=compact?86:108;
      const departure=reveal?Math.max(0,Math.min(1,(progress-.16)/.54)):0;
      const distance=(width-65-(cx+radius))*departure;
      const recoil=distance*4/222;
      const ax=cx+radius+distance, ay=cy-15;
      const separated=departure>.08;
      let drawing=label(width/2,35,reveal?'': 'How does mass number change?','middle','strong');
      // All 226 nucleons persist: 86p + 136n in the daughter and 2p + 2n in alpha.
      drawing+=`<g data-daughter transform="translate(${-recoil} 0)">${nucleus(cx,cy,86,136,radius)}</g>`;
      if(departure>0) {
        drawing+=line(cx+radius+14,ay,ax-16,ay,muted,1.5,'4 5');
        drawing+=arrow(cx+radius+18,ay+39,Math.max(cx+radius+18,ax-10),ay+39,rust,2);
      }
      drawing+=`<g data-alpha transform="translate(${ax} ${ay})">`;
      for(const [x,y,proton] of [[-6,-6,true],[6,-6,false],[-6,6,false],[6,6,true]])drawing+=dot(x,y,7,proton?'#e9b9a3':'#accde5',proton?rust:blue);
      drawing+='</g>';
      drawing+=label(cx-recoil,cy-radius-22,separated?'Radon-222':'Radium-226','middle','strong');
      if(separated) {
        drawing+=label(ax,ay-40,'Alpha','middle','strong');
        drawing+=label(ax,ay+77,'2 p + 2 n','middle','small');
      }
      drawing+=dot(52,365,6,'#e9b9a3',rust)+label(66,371,'Proton','start','small');
      drawing+=dot(width-148,365,6,'#accde5',blue)+label(width-134,371,'Neutron','start','small');
      if(reveal&&progress>=.72) {
        drawing+=label(width/2,420,'226 = 222 + 4','middle','isotope');
        drawing+=label(width/2,457,'Mass number: −4','middle','strong');
        drawing+=label(width/2,491,'Atomic number: 88 → 86','middle','small');
      }
      return single(drawing,width,515);
    }
    if (lesson.variant === 'halflife') {
      const decays = reveal ? Math.floor(80 * (1 - 2 ** -progress)) : 0;
      let population = label(200, 35, 'One sample: 80 parent nuclei', 'middle', 'strong');
      for (let index = 0; index < 80; index++) {
        const decayed = decayOrder.indexOf(index) < decays;
        population += dot(50 + index % 10 * 33, 95 + Math.floor(index / 10) * 29, 7, decayed ? '#fff' : rust, decayed ? '#aab9c4' : '#fff');
      }
      population += label(200, 365, `${80 - decays} parent nuclei remain`, 'middle') + label(200, 408, 'Filled = parent; outline = daughter', 'middle', 'small') + label(200, 448, 'Illustrative outcome; real counts vary', 'middle', 'small');
      const chart = graph({ baseline: 320, top: 105, bottom: 320, xmax: 2, ticks: [0, 1, 2], xlabel: 'Time (half-lives)', ylabel: 'Expected parent count' });
      let decay = label(200, 35, 'Population trend', 'middle', 'strong') + chart.markup;
      for (const count of [0, 20, 40, 80]) decay += line(chart.left, 320 - count * 2.5, chart.right, 320 - count * 2.5, '#e1e8ed', 1) + label(35, 326 - count * 2.5, count, 'end', 'small');
      if (reveal) decay += path(sample(chart.left, chart.right, position => 320 - physics.remaining(80, (position - chart.left) / chart.scale) * 2.5)) + dot(chart.left + chart.scale, 220, 5, rust) + label(200, 435, 'N = N₀ × (½)^(t/T½)', 'middle') + label(200, 472, 'After T½: expected count = 40', 'middle', 'small');
      return panels([{ markup: population, height: 495 }, { markup: decay, height: 495 }], compact);
    }
    let reaction = label(200, 35, 'One possible fission reaction', 'middle', 'strong');
    if (!reveal || progress < .35) reaction += nucleus(240, 190, 92, 143, 75) + label(240, 100, '²³⁵₉₂U', 'middle', 'isotope') + dot(65 + (reveal ? progress / .35 * 110 : 0), 190, 6, blue) + arrow(75, 225, 150, 225, blue) + label(65, 150, '¹₀n', 'middle');
    else {
      reaction += nucleus(130, 175, 56, 85, 55) + nucleus(270, 175, 36, 56, 47) + label(130, 100, '¹⁴¹₅₆Ba', 'middle', 'isotope') + label(270, 100, '⁹²₃₆Kr', 'middle', 'isotope');
      for (const center of [155, 200, 245]) reaction += dot(center, 260, 6, blue);
      reaction += label(200, 303, '3 neutrons + released energy', 'middle', 'small');
    }
    reaction += label(200, 355, '¹₀n + ²³⁵₉₂U →', 'middle') + label(200, 392, '¹⁴¹₅₆Ba + ⁹²₃₆Kr + 3¹₀n', 'middle') + label(200, 435, '236 nucleons on each side', 'middle', 'small') + label(200, 472, '92 protons on each side', 'middle', 'small');
    let chain = label(200, 35, 'Neutrons can continue the chain', 'middle', 'small') + dot(60, 220, 20, '#e2eaf0', blue) + label(60, 263, 'Fission', 'middle', 'small');
    for (const targetY of [125, 320]) {
      chain += nucleus(310, targetY, 92, 143, 43) + label(310, targetY - 52, '²³⁵U', 'middle');
      if (reveal) chain += arrow(90, 220, 265, targetY, blue) + dot(90 + 175 * progress, 220 + (targetY - 220) * progress, 5, blue);
    }
    if (reveal) chain += arrow(80, 210, 155, 90, blue) + label(160, 75, 'Some escape', 'middle', 'small') + label(200, 420, 'Enough further fissions → a chain', 'middle', 'small');
    chain += label(200, 465, 'Schematic; not every neutron succeeds', 'middle', 'small');
    return panels([{ markup: reaction, height: 505 }, { markup: chain, height: 505 }], compact);
  }
  Object.assign(window.Unit5Diagrams.scenes, { photons, spectrum, nuclear });
})();
