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

const childProcess = require('child_process');
const fs = require('fs');
const os = require('os');
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

// Use a lesson-specific SCORM wrapper when the lesson provides one.
const lessonWrapper = path.join(folderPath, 'scorm-wrapper.js');
const wrapperToUse  = fs.existsSync(lessonWrapper) ? lessonWrapper : wrapperSrc;
console.log(`  wrapper:  ${fs.existsSync(lessonWrapper) ? folderName + '/scorm-wrapper.js' : 'root scorm-wrapper.js (no lesson-specific found)'}`);

if (process.platform !== 'win32') {
  console.error('Error: package-sim.js now uses built-in Windows PowerShell ZIP support.');
  console.error('Run this script on Windows, or add a platform-specific ZIP implementation for your environment.');
  process.exit(1);
}

// ─── Create ZIP ──────────────────────────────────────────────────────────────

const outputZipName = `${folderName}.zip`;
const outputZipPath = path.resolve(outputZipName);
const SCORM_ASSETS = ['scorm-wrapper.js', 'imsmanifest.xml'];

function copyDirectoryFiltered(sourceDir, targetDir) {
  fs.mkdirSync(targetDir, { recursive: true });
  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });
  for (const entry of entries) {
    if (SCORM_ASSETS.indexOf(entry.name) !== -1) continue;
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);
    if (entry.isDirectory()) {
      copyDirectoryFiltered(sourcePath, targetPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

function zipWithPowerShell(sourceDir, destinationZip) {
  const escapedSource = sourceDir.replace(/'/g, "''");
  const escapedZip = destinationZip.replace(/'/g, "''");
  const script = [
    "$ErrorActionPreference = 'Stop'",
    `$sourceDir = '${escapedSource}'`,
    `$destinationZip = '${escapedZip}'`,
    "if (Test-Path -LiteralPath $destinationZip) { Remove-Item -LiteralPath $destinationZip -Force }",
    "$items = Get-ChildItem -LiteralPath $sourceDir -Force",
    "if (-not $items) { throw 'No files found to package.' }",
    "$items | Compress-Archive -DestinationPath $destinationZip -Force"
  ].join('; ');

  const result = childProcess.spawnSync(
    'powershell.exe',
    ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script],
    { encoding: 'utf8' }
  );

  if (result.status !== 0) {
    const stderr = (result.stderr || '').trim();
    const stdout = (result.stdout || '').trim();
    throw new Error(stderr || stdout || 'PowerShell ZIP packaging failed.');
  }
}

const stagingRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'scorm-packager-'));
const stagingDir = path.join(stagingRoot, 'package');

try {
  copyDirectoryFiltered(folderPath, stagingDir);
  fs.copyFileSync(wrapperToUse, path.join(stagingDir, 'scorm-wrapper.js'));
  fs.copyFileSync(manifestToUse, path.join(stagingDir, 'imsmanifest.xml'));
  zipWithPowerShell(stagingDir, outputZipPath);

  const kb = (fs.statSync(outputZipPath).size / 1024).toFixed(1);
  console.log(`✓  Packaged "${folderName}" → ${outputZipName}  (${kb} KB)`);
} catch (err) {
  console.error('Archive error:', err.message);
  process.exitCode = 1;
} finally {
  fs.rmSync(stagingRoot, { recursive: true, force: true });
}

if (process.exitCode) {
  process.exit(process.exitCode);
}
