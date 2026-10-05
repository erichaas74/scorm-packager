'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const lessonDir = __dirname;
const templatePath = path.join(lessonDir, 'u1l1-motion-graphs-buzz-assessment-template.html');
const wrapperPath = path.join(lessonDir, 'scorm-wrapper.js');
const packageDir = path.join(lessonDir, 'buzz-assignment-scorm');
const packageIndexPath = path.join(packageDir, 'index.html');
const manifestPath = path.join(packageDir, 'imsmanifest.xml');
const zipPath = path.join(lessonDir, 'unit-1-lesson-1-buzz-assignment-scorm.zip');

function read(file) {
  return fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dosTimestamp(date) {
  const year = Math.max(1980, date.getFullYear());
  return {
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
    date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()
  };
}

function writeZip(target, entries) {
  const localParts = [];
  const centralParts = [];
  let localOffset = 0;
  const stamp = dosTimestamp(new Date());

  entries.forEach(entry => {
    const name = Buffer.from(entry.name.replace(/\\/g, '/'), 'utf8');
    const data = Buffer.isBuffer(entry.data) ? entry.data : Buffer.from(entry.data, 'utf8');
    const compressed = zlib.deflateRawSync(data, { level: 9 });
    const checksum = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(8, 8);
    local.writeUInt16LE(stamp.time, 10);
    local.writeUInt16LE(stamp.date, 12);
    local.writeUInt32LE(checksum, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    localParts.push(local, name, compressed);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(8, 10);
    central.writeUInt16LE(stamp.time, 12);
    central.writeUInt16LE(stamp.date, 14);
    central.writeUInt32LE(checksum, 16);
    central.writeUInt32LE(compressed.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(localOffset, 42);
    centralParts.push(central, name);
    localOffset += local.length + name.length + compressed.length;
  });

  const centralDirectory = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(localOffset, 16);
  end.writeUInt16LE(0, 20);
  fs.writeFileSync(target, Buffer.concat([...localParts, centralDirectory, end]));
}

const template = read(templatePath);
const wrapper = read(wrapperPath);
const applicationMarker = '<script id="embedded-motion-graphs-application">';
if (!template.includes(applicationMarker)) throw new Error('U1L1 self-contained assignment template is missing its application script.');

const scoIndex = template
  .replace('<meta name="buzz-activity-type" content="assignment">', '<meta name="buzz-activity-type" content="assignment">\n  <meta name="scorm-version" content="1.2">\n  <meta name="scorm-score-range" content="0-15">')
  .replace(applicationMarker, () => `<script id="embedded-scorm-wrapper">\n${wrapper}\n</script>\n  ${applicationMarker}`);

const manifest = `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="u1l1_motion_graphs_buzz_assignment_scorm_v3"
          version="1.2"
          xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
          xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd
                              http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>
  <organizations default="ORG-U1L1">
    <organization identifier="ORG-U1L1">
      <title>Unit 1 Lesson 1: Motion Graphs Assignment</title>
      <item identifier="ITEM-U1L1" identifierref="RES-U1L1">
        <title>Motion Graphs: Mail Carrier Mystery — 15 Point Assignment</title>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="RES-U1L1" type="webcontent" adlcp:scormtype="sco" href="index.html">
      <file href="index.html"/>
    </resource>
  </resources>
</manifest>
`;

if (!scoIndex.includes("cmi.core.score.raw") || !scoIndex.includes("cmi.core.score.max") || !scoIndex.includes("cmi.core.lesson_status")) {
  throw new Error('U1L1 SCO is missing required SCORM 1.2 score reporting fields.');
}
if (!scoIndex.includes("scoreRule: 'one-point-per-required-answer'")) {
  throw new Error('U1L1 SCO is missing the one-point-per-required-answer score rule.');
}
if ((scoIndex.match(/<!DOCTYPE html>/gi) || []).length !== 1) throw new Error('U1L1 SCO contains duplicated document markup.');

if (path.dirname(packageDir) !== lessonDir) throw new Error('Refusing to rebuild an unexpected SCORM package directory.');
fs.rmSync(packageDir, { recursive: true, force: true });
fs.mkdirSync(packageDir, { recursive: true });
fs.writeFileSync(packageIndexPath, scoIndex, 'utf8');
fs.writeFileSync(manifestPath, manifest, 'utf8');

if (path.dirname(zipPath) !== lessonDir) throw new Error('Refusing to overwrite an unexpected SCORM ZIP path.');
if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
writeZip(zipPath, [
  { name: 'index.html', data: scoIndex },
  { name: 'imsmanifest.xml', data: manifest }
]);

console.log(`Built ${path.basename(zipPath)} as a SCORM 1.2 SCO with a 0-15 Buzz Assignment score.`);
