const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const unit = path.join(__dirname, 'unit 5');
const entries = JSON.parse(fs.readFileSync(path.join(unit, 'animated-demo-files.json')));
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
for (const entry of entries) {
  const target = path.join(unit, entry.file);
  let relative = path.relative(path.dirname(target), unit).replaceAll('\\','/');
  if (relative) relative += '/';
  const metadata = { title: entry.title, group: 'demos', type: 'animated-demo', demoKind: entry.kind, choices: [] };
  const title = escape(entry.title);
  fs.writeFileSync(target, `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title><link rel="stylesheet" href="${relative}animated-demos.css"></head><body>
<main class="wave-demo">
<h1>${title}</h1><div class="stage"><svg id="scene" role="img" aria-label="Animated physics demonstration"></svg></div>
<div class="controls"><button id="step" type="button" hidden>Next view</button><button id="replay" type="button">Replay</button></div>
<span id="demo-status" class="sr-only" role="status" aria-live="polite"></span>
<script>window.walkthroughLesson = ${JSON.stringify(metadata)};</script>
<script>window.demoLesson = ${JSON.stringify({kind:entry.kind})};</script><script src="${relative}animated-demos.js"></script>
</main></body></html>
`);
}
if (process.argv.includes('--package')) {
  const built = spawnSync(process.execPath, [path.join(__dirname, 'build-rise-zips.js'), ...entries.map(e=>'unit 5/'+e.file)], {stdio:'inherit',windowsHide:true});
  if (built.status !== 0) process.exit(built.status || 1);
  for (const entry of entries) {
    const parsed = path.parse('unit 5/'+entry.file);
    const prefix = path.basename(parsed.dir).replace(/\s+/g,'-').toLowerCase();
    const stem = parsed.name.replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').toLowerCase();
    const zip = `${prefix}-${stem}.zip`, source = path.join(__dirname,'rise-zips',zip);
    fs.copyFileSync(source,path.join(unit,'rise-upload-packages',zip));
    const local = path.join(unit, entry.file.replace(/\.html$/,'.zip'));
    if(fs.existsSync(local))fs.copyFileSync(source,local);
  }
}
console.log(`Updated ${entries.length} animated demo pages.`);
