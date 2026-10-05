'use strict';

const fs = require('fs');
const path = require('path');

const lessonDir = __dirname;
const walkthroughPath = path.resolve(lessonDir, '..', '..', '..', 'problem-walkthoughs', 'unit 4', 'simple-machines.html');
const outputPath = path.join(lessonDir, 'index.html');

const machines = [
  {
    id: 'inclined-plane', index: 0, title: 'Inclined Plane',
    change: 'Change the ramp angle.',
    given: 'The animation gives the selected angle, \u03b8. The load rises 1.0 m.',
    relation: 'Use IMA = 1 / sin(\u03b8).'
  },
  {
    id: 'lever', index: 1, title: 'Lever',
    change: 'Change the fulcrum position.',
    given: 'The selected percentage locates the fulcrum from the load end of the lever. The load rises 1.0 m.',
    relation: 'Use IMA = effort-arm length / load-arm length.'
  },
  {
    id: 'wedge', index: 2, title: 'Wedge',
    change: 'Change the wedge slope.',
    given: 'The animation gives the wedge length-to-thickness ratio. The material separates 1.0 m.',
    relation: 'Use IMA = wedge length / wedge thickness.'
  },
  {
    id: 'wheel-and-axle', index: 3, title: 'Wheel and Axle',
    change: 'Change the wheel-to-axle ratio.',
    given: 'The animation gives the wheel-to-axle radius ratio. The load rises 1.0 m.',
    relation: 'Use IMA = wheel radius / axle radius.'
  },
  {
    id: 'pulley', index: 4, title: 'Pulley',
    change: 'Change the number of supporting rope sections.',
    given: 'Count the rope sections that directly support the moving load. The load rises 1.0 m.',
    relation: 'For an ideal pulley, IMA = number of supporting rope sections.'
  },
  {
    id: 'screw', index: 5, title: 'Screw',
    change: 'Change the thread pitch.',
    given: 'The animation gives the pitch in centimeters per turn. The handle radius is 0.20 m, and the load rises 1.0 m.',
    relation: 'Convert pitch to meters, then use IMA = 2\u03c0(handle radius) / pitch.'
  }
];

function escapeAttribute(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildMachineFrame(machine, sourceHtml) {
  const frameStyles = `
  <style id="u4l1-isolated-machine-styles">
    html, body { width: 100%; min-height: 0; margin: 0; overflow-x: hidden; background: #fff; }
    body { display: block !important; min-height: 0 !important; padding: 0 !important; color: #17233b; }
    main.rise-embed { display: block !important; }
    header, #button-container, .hud, .ask, .result-bindings { display: none !important; }
    .w-full.max-w-6xl { width: 100% !important; max-width: none !important; }
    #canvas-container { width: 100%; height: 520px !important; min-height: 460px !important; border: 0; border-radius: 0; box-shadow: none; }
    .canvas-panel { z-index: 4; }
    @media (max-width: 620px) {
      #canvas-container { height: 500px !important; min-height: 440px !important; }
    }
  </style>`;

  let frame = sourceHtml
    .replace(/\s*<script src="\.\.\/vendor\/tailwindcss-3\.4\.17\.js"><\/script>/, '')
    .replace(/\s*<section class="hud hud-left"[\s\S]*?<\/section>/, '')
    .replace(/\s*<section class="hud hud-right"[\s\S]*?<\/section>/, '<span class="result-bindings" id="hud-force"></span><span class="result-bindings" id="hud-force-eq"></span>')
    .replace('<title>Six Simple Machines</title>', `<title>${machine.title} variable test simulation</title>`)
    .replace('</head>', `${frameStyles}\n</head>`)
    .replace('<body class="flex flex-col items-center min-h-screen p-3 md:p-5">', '<body>')
    .replace('aria-label="Six Simple Machines: Sim Canvas visual"', `aria-label="${machine.title} variable test simulation"`)
    .replace('let activeMachine = 0;', `let activeMachine = ${machine.index};`)
    .replace('const riseVisitedMachines = new Set([0]);', `const riseVisitedMachines = new Set([${machine.index}]);`);

  // Keep the fixed 1.0 m output marker, but remove values calculated from a setting.
  frame = frame
    .replace(/\s*measureSlope\(footX, groundY, bedLeftX, bedY,\s*`\$\{\(rampLength \/ pxPerM\)\.toFixed\(1\)\} m of ramp`, 'blue', boxSize \+ 26\);/, '')
    .replace(/\s*measure\(effortTipX \+ effortSide \* 24, pivotY - lift \* ma,\s*effortTipX \+ effortSide \* 24, pivotY,\s*`\$\{ma\.toFixed\(2\)\} m down`, 'blue'\);/, '')
    .replace(/\s*measure\(freeX \+ 52, handStartY, freeX \+ 52, handStartY \+ lift \* ma,\s*`\$\{ma\.toFixed\(0\)\} m`, 'blue'\);/, '')
    .replace(/\s*\/\/ --- Strike counter[\s\S]*?ctx\.textAlign = 'center';/, '')
    .replace(/\s*\/\/ Turn counter[\s\S]*?label\(`Turn \$\{Math\.floor\(p \* turnsTotal\)\} of \$\{turnsTotal\.toFixed\(0\)\}`, cw \* 0\.11, ch \* 0\.3, colors\.metalDark\);/, '');

  return frame.replace(/[ \t]+$/gm, '');
}

const sourceHtml = fs.readFileSync(walkthroughPath, 'utf8').replace(/\r\n/g, '\n');

const machineSections = machines.map((machine) => {
  const frame = escapeAttribute(buildMachineFrame(machine, sourceHtml));
  return `
    <section class="machine-section" id="${machine.id}" data-machine-section="${machine.id}">
      <div class="machine-heading">
        <div>
          <p class="machine-number">Machine ${machine.index + 1} of 6</p>
          <h2>${machine.title}</h2>
        </div>
        <p class="change-variable">${machine.change}</p>
      </div>
      <div class="needed-information" aria-label="Information needed for ${machine.title} calculations">
        <p><strong>Given:</strong> ${machine.given}</p>
        <p><strong>Machine relationship:</strong> ${machine.relation}</p>
      </div>
      <iframe class="machine-simulation" data-machine-simulation="${machine.id}" title="${machine.title} change-values simulation" srcdoc="${frame}" loading="lazy"></iframe>
      <!-- BUZZ_QUESTIONS:${machine.id} -->
    </section>`;
}).join('');

const document = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Unit 4 Lesson 1 - Six Simple Machines Calculation Lab</title>
  <style>
    :root { color-scheme: light; font-family: Inter, Arial, sans-serif; color: #17233b; background: #eef6f1; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #eef6f1; color: #17233b; }
    .lesson-header, .machine-section { width: min(1120px, calc(100% - 24px)); margin-inline: auto; }
    .lesson-header { margin-top: 18px; padding: 20px; border: 1px solid #bbf7d0; border-radius: 16px; background: #fff; box-shadow: 0 8px 24px rgb(22 101 52 / 9%); }
    .lesson-header h1 { margin: 0; color: #166534; font-size: clamp(1.55rem, 4vw, 2.2rem); }
    .lesson-header > p { max-width: 900px; margin: 8px 0 0; line-height: 1.55; }
    .shared-givens { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 16px; }
    .shared-givens > div { padding: 13px 14px; border-radius: 11px; background: #eff6ff; }
    .shared-givens h2 { margin: 0 0 6px; color: #1e3a5f; font-size: 1rem; }
    .shared-givens p { margin: 3px 0; line-height: 1.45; }
    .formula-list { font-family: Consolas, monospace; }
    .machine-section { margin-top: 20px; padding: 18px; border: 1px solid #d8e2ee; border-radius: 18px; background: #fff; box-shadow: 0 12px 34px rgb(23 35 59 / 10%); }
    .machine-heading { display: flex; align-items: end; justify-content: space-between; gap: 14px; }
    .machine-number { margin: 0 0 3px; color: #087f8c; font-size: .78rem; font-weight: 900; text-transform: uppercase; }
    .machine-heading h2 { margin: 0; color: #075d66; }
    .change-variable { margin: 0; padding: 7px 10px; border-radius: 999px; background: #dcfce7; color: #166534; font-weight: 800; }
    .needed-information { margin: 12px 0; padding: 12px 14px; border-left: 5px solid #285f9f; background: #f8fafc; }
    .needed-information p { margin: 4px 0; line-height: 1.5; }
    .machine-simulation { display: block; width: 100%; height: 522px; border: 1px solid #b9c9d8; border-radius: 13px; background: #fff; }
    footer { width: min(1120px, calc(100% - 24px)); margin: 18px auto 30px; color: #475569; text-align: center; }
    @media (max-width: 720px) {
      .shared-givens { grid-template-columns: 1fr; }
      .machine-heading { align-items: flex-start; flex-direction: column; }
      .machine-simulation { height: 502px; }
    }
  </style>
</head>
<body>
  <header class="lesson-header">
    <h1>Unit 4 Lesson 1: Change Values and Test</h1>
    <p>Work through one machine at a time. Change the requested value, use the information provided, and calculate the results before answering the two questions directly below that simulation.</p>
    <div class="shared-givens">
      <div>
        <h2>Givens for every machine</h2>
        <p>Output force: <strong>120 N</strong></p>
        <p>Output distance: <strong>1.0 m</strong></p>
        <p>Input speed for comparisons: <strong>1.0 m/s</strong></p>
      </div>
      <div class="formula-list">
        <h2>Use these ideal-machine formulas</h2>
        <p>d<sub>in</sub> = IMA &times; d<sub>out</sub></p>
        <p>F<sub>in</sub> = F<sub>out</sub> &divide; IMA</p>
        <p>W = F &times; d</p>
        <p>v<sub>out</sub> = v<sub>in</sub> &divide; IMA</p>
      </div>
    </div>
  </header>
  <main>${machineSections}
  </main>
  <footer>Calculate each answer from the givens and the setting you select. The simulation does not display calculated results.</footer>
</body>
</html>
`;

fs.writeFileSync(outputPath, document.replace(/[ \t]+$/gm, ''), 'utf8');
console.log(`Built ${path.relative(process.cwd(), outputPath)} with six isolated calculation simulations.`);

module.exports = { machines, buildMachineFrame, escapeAttribute };
