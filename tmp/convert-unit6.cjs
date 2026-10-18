const fs=require('fs'),path=require('path');
const root='problem-walkthoughs/unit 6';
const inventory=JSON.parse(fs.readFileSync('tmp/unit6-inventory.json'));
const demos=['electron-drift-wire.html','materials-charge-behavior.html','motors-generators-energy-transfer.html','motors-generators-energy-transfer-2.html','electron-transfer-net-charge.html','charge-conservation-metal-spheres.html','u6-l5-p3-magnetic-braking-model.html','lesson-2-audit/force-and-velocity/index.html'];
const sims={
 'voltage-push-model.html':['Supply voltage','6 V','12 V','Resistance stays 6 Ω.','Current doubles: 1 A → 2 A.'],
 'coulomb-inverse-square-test.html':['Charge separation','1 m','2 m','Both charges stay 1 μC.','Force falls to one quarter: 9 → 2.25 mN.'],
 'coulomb-force-slider-model.html':['Source charge','1 μC','2 μC','Other charge: 1 μC; separation: 1 m.','Force doubles: 9 → 18 mN.'],
 'field-strength-sensor-lab.html':['Sensor distance','2 cm','4 cm','Wire current stays 2 A.','Magnetic field halves: 20 → 10 μT.'],
 'coil-turns-lifting.html':['Coil turns','50 turns','100 turns','Current and coil length stay fixed.','Twice the turns produces twice the field.'],
 'uniform-field-voltage.html':['Plate separation','2 cm','4 cm','Electric field stays 100 N/C.','Voltage doubles: 2 V → 4 V.']
};
const manifest=inventory.map(x=>({href:x.href,title:x.title,group:demos.includes(x.href)?'demo':sims[x.href]?'simulation':'question',...(sims[x.href]?{control:sims[x.href]}:{})}));
fs.writeFileSync(root+'/activity-groups.json',JSON.stringify(manifest,null,2)+'\n');
fs.writeFileSync(root+'/group-conversion-notes.txt',`Unit 6 conversion specification — 2026-10-17\n\nPreserve existing SVG artwork, colors, scene geometry and physics models.\n8 demos: automatically show setup, animate the existing outcome, hold 3 seconds and loop. Replay restarts; reduced motion uses a still result. Completion once after the outcome.\n6 guided simulations: a two-position physical parameter control uses the existing model's two validated conditions. Baseline → change to second condition and compare → restore baseline → free exploration. Guidance advances on actions only. Reset restores baseline and guidance. Existing before/after scenes provide the reference. No answer gate, Next button, timed reset or new plots.\n40 questions retain their existing source; audit findings remain recorded rather than silently rebuilding them.\n\nSimulation controls, fixed quantities and evidence:\n`+Object.entries(sims).map(([file,c])=>`${file}: ${c[0]} ${c[1]} / ${c[2]}; ${c[3]} ${c[4]}`).join('\n')+'\n');
for(const item of manifest.filter(x=>x.group!=='question')){
 const filename=root+'/'+item.href;let html=fs.readFileSync(filename,'utf8');
 const prefix=path.relative(path.dirname(filename),root).replaceAll('\\','/');const rel=prefix?prefix+'/':'';
 html=html.replace('</head>',`<link rel="stylesheet" href="${rel}grouped-walkthrough.css">\n</head>`);
 html=html.replace(/<div class="message"[\s\S]*?<\/div>/,'');
 const controls=item.group==='simulation'?`<label>${sims[item.href][0]} <select id="parameter"><option value="0">${sims[item.href][1]}</option><option value="1">${sims[item.href][2]}</option></select></label>`:'';
 html=html.replace(/<div class="buttons"[\s\S]*?<\/div>/,`<div class="buttons" role="group" aria-label="${item.group==='demo'?'Playback':'Experiment controls'}">${controls}<button class="utility" type="button" id="replay">${item.group==='demo'?'Replay':'Reset'}</button></div><span id="status" class="sr-only" role="status" aria-live="polite"></span>`);
 html=html.replace('</main>','').replace('</body>','</main>\n</body>');
 html=html.replace(/<script src="([^"]*)simple-walkthrough.js"><\/script>/,`<script>window.activityGroup = ${JSON.stringify(item)};</script>\n<script src="${rel}grouped-walkthrough.js"></script>`);
 fs.writeFileSync(filename,html);
}
let index=fs.readFileSync(root+'/index.html','utf8');const cards=[...index.matchAll(/<article class="card">[\s\S]*?<\/article>/g)].map(x=>x[0]);
const sections=[['demo','Animated demos'],['question','Misconception questions'],['simulation','Guided simulations']].map(([group,title])=>`<section class="activity-group" aria-labelledby="${group}"><h2 id="${group}">${title} <span>(${manifest.filter(x=>x.group===group).length})</span></h2><div class="grid">\n`+cards.filter(c=>manifest.find(x=>c.includes('href="'+x.href+'"'))?.group===group).map(c=>c.replace(/<h2>/g,'<h3>').replace(/<\/h2>/g,'</h3>')).join('\n')+'\n</div></section>').join('\n');
const start=index.indexOf('<div class="grid">');const end=index.lastIndexOf('</article>')+'</article>'.length;
index=index.slice(0,start)+sections+index.slice(end).replace(/^\s*<\/div>/,'');
index=index.replace('54 walkthroughs. Choose an activity to begin.','54 activities: 8 animated demos, 40 misconception questions, and 6 guided simulations.');
index=index.replace('</style>','.activity-group { margin-top: 28px; } .activity-group > h2 { font-size: 1.4rem; } .activity-group > h2 span { color: var(--muted); font-weight: 400; } .card h3 { margin: 12px 0; font-size: 1.2rem; }\n</style>');
fs.writeFileSync(root+'/index.html',index);
