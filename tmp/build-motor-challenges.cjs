const fs=require('fs'),path=require('path');const root='problem-walkthoughs/unit 6';
const items=[
{href:'motors-generators-energy-transfer.html',kind:'motor',title:'Which Way Will the Motor Spin?'},
{href:'magnet-coil-induction.html',kind:'induction',title:'Will the Magnet Produce Electricity?'},
{href:'motors-generators-energy-transfer-2.html',kind:'load',title:'Does a Generator Get Harder to Turn?'},
{href:'wire-magnetic-force.html',kind:'wire',title:'Which Way Will the Wire Move?'},
{href:'u6-l5-p3-device-evidence-sorter.html',kind:'reversible',title:'Can a Motor Become a Generator?'}];
for(const c of items){const config={title:c.title,type:'challenge',variant:c.kind};fs.writeFileSync(root+'/'+c.href,`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${c.title}</title><link rel="stylesheet" href="motor-challenges.css"></head>
<body><main class="rise-walkthrough"><h1>${c.title}</h1><div class="content"><svg id="scene" role="img" aria-label="${c.title}"></svg><div class="controls"><div class="choices" role="group" aria-label="Prediction"></div><div class="experiment" role="group" aria-label="Experiment" hidden></div><button id="replay" type="button">Replay</button></div><span id="status" class="sr-only" role="status" aria-live="polite"></span></div>
<script>window.walkthroughLesson = ${JSON.stringify(config)};</script>
<script>window.motorChallenge = ${JSON.stringify(c)};</script><script src="textbook-diagrams.js"></script><script src="motor-challenges.js"></script></main></body></html>\n`);}
fs.writeFileSync(root+'/motor-challenges.json',JSON.stringify(items,null,2)+'\n');
const manifest=JSON.parse(fs.readFileSync(root+'/activity-groups.json'));for(const c of items){let item=manifest.find(x=>x.href===c.href);if(item)Object.assign(item,{title:c.title,group:'simulation',challenge:c.kind});else manifest.push({...c,group:'simulation',challenge:c.kind});}fs.writeFileSync(root+'/activity-groups.json',JSON.stringify(manifest,null,2)+'\n');
const files=JSON.parse(fs.readFileSync(root+'/simple-walkthrough-files.json'));for(const c of items)if(!files.includes(c.href))files.push(c.href);fs.writeFileSync(root+'/simple-walkthrough-files.json',JSON.stringify(files,null,2)+'\n');
let index=fs.readFileSync(root+'/index.html','utf8');const existing=[...index.matchAll(/<article class="card">[\s\S]*?<\/article>/g)].map(x=>x[0]);const cards=new Map(existing.map(c=>[c.match(/class="open-btn" href="([^"]+)/)[1],c]));for(const c of items)cards.set(c.href,`<article class="card"><div class="label">Interactive challenge</div><h3>${c.title}</h3><p>Predict, watch the evidence, then experiment.</p><a class="open-btn" href="${c.href}">Open challenge</a></article>`);
const groups=[['demo','Animated demos'],['question','Misconception questions'],['simulation','Guided simulations']];const sections=groups.map(([group,title])=>`<section class="activity-group" aria-labelledby="${group}"><h2 id="${group}">${title} <span>(${manifest.filter(x=>x.group===group).length})</span></h2><div class="grid">`+manifest.filter(x=>x.group===group).sort((a,b)=>(b.challenge?1:0)-(a.challenge?1:0)).map(x=>cards.get(x.href)).join('\n')+'</div></section>').join('\n');
index=index.replace(/<section class="activity-group"[\s\S]*?<\/div><\/section>/g,'');const first=index.indexOf('<section class="activity-group"');
// Existing sections may contain whitespace before closing tags; replace their complete span.
if(first>=0){const last=index.lastIndexOf('</article>');const end=index.indexOf('</section>',last)+10;index=index.slice(0,first)+sections+index.slice(end);}else{const pos=index.indexOf('</section>');index=index.slice(0,pos)+sections+index.slice(pos);}
index=index.replace(/54 activities: 8 animated demos, 40 misconception questions, and 6 guided simulations\./,'56 activities: 6 animated demos, 39 misconception questions, and 11 guided simulations.');fs.writeFileSync(root+'/index.html',index);
