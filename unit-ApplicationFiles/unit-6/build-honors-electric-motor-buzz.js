"use strict";

const archiver = require("archiver");
const fs = require("fs");
const path = require("path");

const unitDir = __dirname;
const rootDir = path.resolve(unitDir, "..", "..");
const sourcePath = path.join(unitDir, "honors_electric_motor_engineering_challenge.html");
const appDir = path.join(unitDir, "honors-electric-motor-engineering-challenge");
const marker = "<!-- BUZZ_SCORM_WRAPPER -->";

fs.mkdirSync(appDir, { recursive: true });

const source = fs.readFileSync(sourcePath, "utf8");
if (!source.includes(marker)) {
  throw new Error(`SCORM injection marker not found in ${sourcePath}`);
}

const packagedHtml = source.replace(marker, '<script src="scorm-wrapper.js"></script>');
fs.writeFileSync(path.join(appDir, "index.html"), packagedHtml, "utf8");
fs.copyFileSync(path.join(rootDir, "scorm-wrapper.js"), path.join(appDir, "scorm-wrapper.js"));

async function createZip() {
  const zipPath = `${appDir}.zip`;
  const output = fs.createWriteStream(zipPath);
  const archive = archiver("zip", { zlib: { level: 9 } });

  await new Promise((resolve, reject) => {
    output.on("close", resolve);
    output.on("error", reject);
    archive.on("warning", error => error.code === "ENOENT" ? console.warn(error.message) : reject(error));
    archive.on("error", reject);
    archive.pipe(output);
    archive.directory(appDir, false);
    archive.finalize();
  });

  console.log(`Buzz package ready: ${zipPath} (${(archive.pointer() / 1024).toFixed(1)} KB)`);
}

createZip().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
