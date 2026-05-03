/**
 * package-sim.js
 * Packages a simulation folder into a SCORM 1.2-compliant ZIP.
 *
 * Usage:
 *   node package-sim.js <folder-name>
 *   e.g. node package-sim.js sim-projectile-motion
 *
 * The script zips the contents of the given folder and injects
 * imsmanifest.xml and scorm-wrapper.js into the root of the ZIP.
 */

'use strict';

const archiver = require('archiver');
const fs = require('fs');
const path = require('path');

// ─── Argument validation ─────────────────────────────────────────────────────

const folderName = process.argv[2];

if (!folderName) {
  console.error('Error: No folder name provided.');
  console.error('Usage: node package-sim.js <folder-name>');
  process.exit(1);
}

const folderPath = path.resolve(folderName);

if (!fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory()) {
  console.error(`Error: Folder not found or is not a directory: ${folderPath}`);
  process.exit(1);
}

// ─── Paths to shared SCORM assets (co-located with this script) ───────────────

const manifestSrc = path.join(__dirname, 'imsmanifest.xml');
const wrapperSrc  = path.join(__dirname, 'scorm-wrapper.js');

for (const [label, src] of [['imsmanifest.xml', manifestSrc], ['scorm-wrapper.js', wrapperSrc]]) {
  if (!fs.existsSync(src)) {
    console.error(`Error: Required file not found: ${src}`);
    console.error(`Make sure ${label} lives alongside package-sim.js.`);
    process.exit(1);
  }
}

// Use lesson-specific manifest if present, otherwise fall back to root template.
const lessonManifest = path.join(folderPath, 'imsmanifest.xml');
const manifestToUse  = fs.existsSync(lessonManifest) ? lessonManifest : manifestSrc;
console.log(`  manifest: ${fs.existsSync(lessonManifest) ? folderName + '/imsmanifest.xml' : 'root imsmanifest.xml (no lesson-specific found)'}`);

// ─── Create ZIP ──────────────────────────────────────────────────────────────

const outputZipName = `${folderName}.zip`;
const outputZipPath = path.resolve(outputZipName);
const output = fs.createWriteStream(outputZipPath);

const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
  const kb = (archive.pointer() / 1024).toFixed(1);
  console.log(`✓  Packaged "${folderName}" → ${outputZipName}  (${kb} KB)`);
});

archive.on('warning', (err) => {
  if (err.code === 'ENOENT') {
    console.warn('Warning:', err.message);
  } else {
    throw err;
  }
});

archive.on('error', (err) => {
  console.error('Archive error:', err.message);
  process.exit(1);
});

archive.pipe(output);

// Add the simulation folder contents at the root of the ZIP.
// Exclude local dev copies of the shared SCORM files — the master copies
// injected below always take precedence, preventing duplicate ZIP entries.
var SCORM_ASSETS = ['scorm-wrapper.js', 'imsmanifest.xml'];
archive.directory(folderPath, false, function (entry) {
  if (SCORM_ASSETS.indexOf(entry.name) !== -1) return false;
  return entry;
});

// Inject SCORM files at ZIP root — lesson manifest takes priority over root template
archive.file(wrapperSrc,   { name: 'scorm-wrapper.js' });
archive.file(manifestToUse, { name: 'imsmanifest.xml'  });

archive.finalize();
