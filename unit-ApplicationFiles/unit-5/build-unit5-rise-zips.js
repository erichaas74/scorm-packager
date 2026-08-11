"use strict";

// Rebuilds the Rise-ready ZIP for each Unit 5 application folder.
// Each ZIP carries the maintained source app as index.html. The separate Unit 5 Buzz builder
// copies that source to a uniquely named assessment-template file for upload safety.
// Run from anywhere: node unit-ApplicationFiles/unit-5/build-unit5-rise-zips.js

const archiver = require("archiver");
const fs = require("fs");
const path = require("path");

const unitDir = __dirname;

const apps = [
  "design-the-perfect-instrument",
  "doppler-spectral-line-shift",
  "honors-relativity-timekeeping-lab",
  "light-color-and-vision-lab"
];

function createZip(name) {
  const appDir = path.join(unitDir, name);
  const entry = path.join(appDir, "index.html");
  if (!fs.existsSync(entry)) throw new Error(`missing ${entry}`);

  const zipPath = path.join(unitDir, `${name}.zip`);
  const output = fs.createWriteStream(zipPath);
  const archive = archiver("zip", { zlib: { level: 9 } });

  return new Promise((resolve, reject) => {
    output.on("close", () => {
      console.log(`ok: ${name}.zip (${(archive.pointer() / 1024).toFixed(1)} KB)`);
      resolve();
    });
    output.on("error", reject);
    archive.on("warning", error => (error.code === "ENOENT" ? console.warn(error.message) : reject(error)));
    archive.on("error", reject);
    archive.pipe(output);
    archive.file(entry, { name: "index.html" });
    archive.finalize();
  });
}

(async () => {
  for (const name of apps) await createZip(name);
})().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
