// Dependency-free, loopback-only preview. Source files are never modified.
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const root = __dirname;
const port = Number(process.env.PORT || 4173);
const watched = new Map();
const session = Date.now().toString();
let revision = 0;
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.mp4': 'video/mp4', '.json': 'application/json', '.woff2': 'font/woff2', '.pdf': 'application/pdf', '.zip': 'application/zip' };
const reload = `<script>(()=>{let version;setInterval(async()=>{try{const r=await fetch('/__preview/version',{cache:'no-store'});if(!r.ok)return;const next=await r.text();if(version&&version!==next)location.reload();version=next}catch{}},1000)})();</script>`;
function inside(file) {
  const relative = path.relative(root, file);
  return relative !== '..' && !relative.startsWith('..' + path.sep) && !path.isAbsolute(relative);
}
const server = http.createServer(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); return res.end(); }
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (pathname === '/__preview/version') {
      for (const [file, previous] of watched) {
        const current = await fs.stat(file).then(s => s.mtimeMs + ':' + s.size).catch(() => 'missing');
        if (current !== previous) { watched.set(file, current); revision++; }
      }
      res.setHeader('Content-Type', 'text/plain');
      return res.end(session + ':' + revision);
    }
    const segments = pathname.split(/[\\/]/);
    if (segments.some(s => s.startsWith('.') || s.includes(':') || s === 'node_modules')) {
      res.writeHead(403); return res.end('Forbidden');
    }
    let file = path.resolve(root, '.' + pathname);
    if (!inside(file)) { res.writeHead(403); return res.end('Forbidden'); }
    let stat = await fs.stat(file);
    if (stat.isDirectory()) {
      if (!pathname.endsWith('/')) { res.writeHead(302, { Location: pathname + '/' }); return res.end(); }
      file = path.join(file, 'index.html');
      stat = await fs.stat(file);
    }
    if (!inside(await fs.realpath(file))) { res.writeHead(403); return res.end('Forbidden'); }
    if (!stat.isFile()) { res.writeHead(404); return res.end('Not found'); }
    watched.set(file, stat.mtimeMs + ':' + stat.size);
    const ext = path.extname(file).toLowerCase();
    let body = await fs.readFile(file);
    if (ext === '.html') body = Buffer.from(body.toString().replace(/<\/body>/i, reload + '</body>'));
    res.setHeader('Content-Type', types[ext] || 'application/octet-stream');
    res.setHeader('Content-Length', body.length);
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch (error) {
    res.writeHead(error.code === 'ENOENT' || error.code === 'ENOTDIR' ? 404 : error instanceof URIError ? 400 : 500);
    res.end('Unable to load preview file');
  }
});
server.on('error', error => {
  console.error(error.code === 'EADDRINUSE'
    ? `Port ${port} is busy. Close the other server or set PORT to another number and run npm run preview.`
    : error.message);
  process.exitCode = 1;
});
server.listen(port, '127.0.0.1', () => console.log(`Preview ready: http://127.0.0.1:${port}\nAutomatic refresh enabled. Ctrl+C stops the server.`));

