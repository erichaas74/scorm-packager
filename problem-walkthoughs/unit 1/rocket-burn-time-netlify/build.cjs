const fs = require('node:fs');
const path = require('node:path');
const source = path.resolve(__dirname, '..');
const publish = path.join(__dirname, 'public');
fs.mkdirSync(publish, { recursive: true });
// A standalone Netlify upload includes public/ but not the parent walkthroughs.
const htmlSource = fs.existsSync(path.join(source, 'rocket-burn-time-challenge.html'))
  ? path.join(source, 'rocket-burn-time-challenge.html') : path.join(publish, 'index.html');
const scriptSource = fs.existsSync(path.join(source, 'rocket-burn-time-challenge.js'))
  ? path.join(source, 'rocket-burn-time-challenge.js') : path.join(publish, 'rocket-burn-time-challenge.js');
const html = fs.readFileSync(htmlSource, 'utf8');
fs.writeFileSync(path.join(publish, 'index.html'), html, 'utf8');
if (scriptSource !== path.join(publish, 'rocket-burn-time-challenge.js')) {
  fs.copyFileSync(scriptSource, path.join(publish, 'rocket-burn-time-challenge.js'));
}
console.log('Built rocket web app in public/');
