const fs = require('fs');
const path = require('path');

const root = __dirname;
const appPath = path.join(root, 'Riverboat-crossing.html');
const sourcePath = path.join(root, 'river-rescue-buzz-assessment-source.html');
const outputPath = path.join(root, 'u2l4-river-rescue-buzz-assessment-template.html');
const loaderMarker = '<!-- RIVER_RESCUE_EMBED_LOADER -->';

function read(file) {
  return fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
}

const app = read(appPath);
const source = read(sourcePath);

if (!source.includes(loaderMarker)) throw new Error('Assessment source is missing the embed-loader marker.');
if (/<script[^>]+src\s*=|<link[^>]+rel=["']stylesheet/i.test(app)) {
  throw new Error('River Rescue must be self-contained before it can be embedded in Buzz.');
}

const safeAppLiteral = JSON.stringify(app)
  .replace(/</g, '\\u003c')
  .replace(/\u2028/g, '\\u2028')
  .replace(/\u2029/g, '\\u2029');

const loader = `<script id="river-rescue-embed-loader">
(function () {
  'use strict';
  var appSource = ${safeAppLiteral};
  var frames = document.querySelectorAll('iframe[data-river-level]');
  frames.forEach(function (frame) {
    var level = Number(frame.getAttribute('data-river-level'));
    var config = '<script>window.RIVER_RESCUE_EMBED_CONFIG={level:' + level + ',lockLevel:"1",hideHud:"1"};<\\/script>';
    frame.srcdoc = appSource.replace('</head>', config + '</head>');
  });
}());
</script>`;

const output = source.replace(loaderMarker, loader);
const frames = (output.match(/iframe[^>]+data-river-level=/g) || []).length;
const slots = (output.match(/<a:question\s*><\/a:question>|<a:question\s*\/>/gi) || []).length;

if (frames !== 4) throw new Error(`Expected 4 embedded level frames, found ${frames}.`);
if (slots !== 12) throw new Error(`Expected 12 Buzz question slots, found ${slots}.`);
if (/iframe[^>]+src=["'][^"']+/i.test(output)) throw new Error('Generated template still contains an external iframe source.');
if (!/buzz-assessment-integrity-guard|\['copy',\s*'cut',\s*'paste'/i.test(output)) throw new Error('Generated template is missing the required assessment integrity guard.');

fs.writeFileSync(outputPath, output, 'utf8');
console.log(`Built ${path.basename(outputPath)} with 4 self-contained River Rescue levels and 12 Buzz question slots.`);
