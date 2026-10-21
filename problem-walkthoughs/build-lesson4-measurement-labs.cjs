const fs=require('fs'),path=require('path');
const dir=path.join(__dirname,'unit 5');
const labs=[
 ['wheel','03 - Fizeau - Rotating Wheel','Fizeau · Catch the return'],
 ['mirror','04 - Foucault - Rotating Mirror','Foucault · A moving mirror'],
 ['laser','05 - Modern Laser Measurement','Laser · Time the return']
];
const F=3e8/(4*8633*720);
for(const [kind,name,title] of labs){
const controls=kind==='laser'?`<label>Target <select id="target" data-setting><option value="30">A</option><option value="60" selected>B</option><option value="90">C</option></select></label><label>Measure <select id="mode" data-setting><option value="known">Light speed</option><option value="unknown">Unknown distance</option></select></label>`:`<label for="rate">${kind==='wheel'?'Wheel':'Mirror'} speed <output id="rate-value" for="rate"></output><input id="rate" data-setting type="range" min="0" max="${kind==='wheel'?28:800}" step="${kind==='wheel'?.01:25}" value="0"></label>`+(kind==='wheel'?[[0,'Stationary'],[F,'12.07 rev/s'],[2*F,'24.13 rev/s']]:[[0,'Stationary'],[400,'400 rev/s'],[800,'800 rev/s']]).map(([v,label])=>`<button type="button" data-setting data-value="${v}" aria-pressed="false">${label}</button>`).join('');
const calculation=kind==='laser'?`<div class="rph-controls"><button id="emission" type="button" disabled>Read emission</button><button id="return" type="button" disabled>Read return</button></div><div class="rph-calculation"><label><span id="answer-label">Light speed (m/s)</span> <input id="answer" type="number" min="0" step="any" inputmode="decimal" disabled></label><button id="check" type="button" disabled>Check calculation</button></div>`:'';
const notes=kind==='wheel'?'The optical bench is folded for display. One-way distance is 8,633 m; the wheel has 720 teeth and 720 equal gaps. The 24-tooth drawing and enlarged rim preserve tooth–gap phase, not literal rotation angle. Brightness is the overlap of equal-width gaps in an ideal beam. Light speed is 3.00 × 10⁸ m/s. At first extinction, c = 4DNf. Air correction is omitted.':kind==='mirror'?'Mirror separation is 20 m and viewing distance is 1 m. Light speed is 3.00 × 10⁸ m/s. The mirror turns through θ = 2πf(2D/c); the reflected ray turns through 2θ. Screen displacement is L tan(2θ). Angles in optical views are enlarged ×300; the screen scale gives physical millimeters. The final screen ray illustrates direction, outside the mirror-to-mirror flight timer. Lens systems and air correction are omitted. Recorded spot labels give rev/s.':'The targets are 30, 60, and 90 m away. Light speed is 299,792,458 m/s exactly in this ideal vacuum model. The speed exercise practices inference using a supplied distance. Emission occurs at 20 ns after acquisition starts; subtract that offset from reception. No random timing noise is added. Playback uses the same time scale for each target (100 ns per screen second); geometry is schematic.';
const html=`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>${fs.readFileSync(path.join(dir,'lesson4-measurement-labs.css'),'utf8')}</style></head>
<body><main class="rph-lab" data-lab="${kind}">
<h1>${title}</h1><div class="rph-views"><section class="rph-apparatus" aria-label="Optical apparatus"><p id="guide" class="rph-guide"></p><svg id="main" class="rph-main" viewBox="0 0 600 395" role="img" aria-label="Optical apparatus"></svg><div id="stage" class="rph-stage"></div></section><section class="rph-evidence" aria-label="Measurement evidence"><svg id="detail" viewBox="0 0 360 395" role="img" aria-label="Measurement evidence"></svg></section></div>
<div class="rph-controls"><button id="run" class="primary" type="button">Run light journey</button><button id="reset" type="button">Reset</button>${controls}</div>${calculation}
<p id="feedback" class="rph-feedback" role="status" aria-live="polite"></p><p id="status" class="rph-sr" role="status" aria-live="polite"></p>
<details><summary>About this model</summary><p>${notes} Playback is slowed. Reset clears the investigation and its recorded comparisons.</p></details>
<script>${fs.readFileSync(path.join(dir,'lesson4-measurement-labs.js'),'utf8')}</script></main></body></html>`;
fs.writeFileSync(path.join(dir,`Unit 5 - Lesson 4 - ${name}.html`),html);
console.log(`Updated ${name}`);
}
