const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const root = __dirname;
const outputDir = path.join(root, 'rise-zips');
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
// Optional relative paths package only those files and leave other generated ZIPs untouched.
const requested = process.argv.slice(2).map((entry) => decodeURIComponent(entry).replace(/\\/g, '/'));
const active = requested.length ? requested : [...new Set(
  [...indexHtml.matchAll(/<a\b[^>]*class=["'][^"']*\bopen-btn\b[^"']*["'][^>]*href=["']([^"']+\.html)["']/gi)]
    .map((match) => decodeURIComponent(match[1]))
)];

function mimeType(file) {
  const extension = path.extname(file).toLowerCase();
  return ({
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav'
  })[extension] || 'application/octet-stream';
}

function resolveLocal(sourceFile, reference) {
  const cleanReference = reference.split(/[?#]/)[0];
  const absolute = path.resolve(path.dirname(sourceFile), cleanReference);
  if (!fs.existsSync(absolute)) {
    throw new Error(`${path.relative(root, sourceFile)} references missing local asset: ${reference}`);
  }
  return absolute;
}

function prepareIndex(sourceFile) {
  let html = fs.readFileSync(sourceFile, 'utf8');

  html = html.replace(/<script\b([^>]*?)\bsrc=["']([^"']+)["']([^>]*)><\/script>/gi, (full, before, reference, after) => {
    if (/^https?:/i.test(reference)) throw new Error(`${sourceFile} still contains an external script: ${reference}`);
    const asset = resolveLocal(sourceFile, reference);
    const javascript = fs.readFileSync(asset, 'utf8').replace(/<\/script/gi, '<\\/script');
    return `<script${before}${after}>\n${javascript}\n</script>`;
  });

  html = html.replace(/<link\b([^>]*?)\brel=["']stylesheet["']([^>]*?)\bhref=["']([^"']+)["']([^>]*)>/gi, (full, before, middle, reference) => {
    if (/^https?:/i.test(reference)) throw new Error(`${sourceFile} still contains an external stylesheet: ${reference}`);
    const asset = resolveLocal(sourceFile, reference);
    return `<style>\n${fs.readFileSync(asset, 'utf8')}\n</style>`;
  });

  html = html.replace(/<(img|audio|video|source)\b([^>]*?)\bsrc=["']([^"']+)["']([^>]*)>/gi, (full, tag, before, reference, after) => {
    if (reference.startsWith('data:')) return full;
    if (/^https?:/i.test(reference)) throw new Error(`${sourceFile} still contains an external media asset: ${reference}`);
    const asset = resolveLocal(sourceFile, reference);
    const data = fs.readFileSync(asset).toString('base64');
    return `<${tag}${before}src="data:${mimeType(asset)};base64,${data}"${after}>`;
  });

  html = html.replace(/earthOverlay\.src\s*=\s*['"]([^'"]+svg)['"];?/i, (full, reference) => {
    const asset = resolveLocal(sourceFile, reference);
    const data = fs.readFileSync(asset).toString('base64');
    return `earthOverlay.src = 'data:image/svg+xml;base64,${data}';`;
  });

  if (/(?:src|href)=["']https?:|@import\s+url\(["']?https?:/i.test(html)) {
    throw new Error(`${path.relative(root, sourceFile)} still contains an external runtime request.`);
  }
  if (!/html\s*,\s*body\s*\{[^}]*background:\s*transparent/is.test(html)) {
    throw new Error(`${path.relative(root, sourceFile)} is missing the transparent iframe background rule.`);
  }
  if (!/window\.parent\.postMessage\s*\(\s*\{\s*type\s*:\s*['"]complete['"]\s*\}\s*,\s*['"]\*['"]\s*\)/.test(html)) {
    throw new Error(`${path.relative(root, sourceFile)} is missing the Rise completion message.`);
  }

  return html;
}

function packageName(relativeFile) {
  const parsed = path.parse(relativeFile);
  const unit = path.basename(parsed.dir).replace(/\s+/g, '-').toLowerCase();
  const name = parsed.name.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
  return `${unit}-${name}.zip`;
}

function writeZip(target, html) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(target);
    const archive = archiver('zip', { zlib: { level: 9 } });
    output.on('close', resolve);
    output.on('error', reject);
    archive.on('warning', reject);
    archive.on('error', reject);
    archive.pipe(output);
    archive.append(html, { name: 'index.html' });
    archive.finalize();
  });
}

async function main() {
  fs.mkdirSync(outputDir, { recursive: true });
  const expectedNames = new Set(active.map(packageName));
  if (!requested.length) {
    for (const entry of fs.readdirSync(outputDir, { withFileTypes: true })) {
      if (entry.isFile() && entry.name.endsWith('.zip') && !expectedNames.has(entry.name)) {
        fs.unlinkSync(path.join(outputDir, entry.name));
      }
    }
  }

  for (const relativeFile of active) {
    const sourceFile = path.join(root, ...relativeFile.split('/'));
    if (!fs.existsSync(sourceFile)) throw new Error(`Active walkthrough is missing: ${relativeFile}`);
    const html = prepareIndex(sourceFile);
    const target = path.join(outputDir, packageName(relativeFile));
    await writeZip(target, html);
  }

  console.log(`Built ${active.length} Rise ZIP packages in ${outputDir}`);
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
