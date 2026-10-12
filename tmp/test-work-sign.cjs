const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { pathToFileURL } = require('node:url');
const delay = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const profile = fs.mkdtempSync(path.join(__dirname, 'work-sign-browser-'));
  const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless', '--disable-gpu', '--no-first-run', '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
  let ws;
  try {
    const portFile = path.join(profile, 'DevToolsActivePort');
    for (let i = 0; i < 100 && !fs.existsSync(portFile); i++) await delay(100);
    const port = fs.readFileSync(portFile, 'utf8').split('\n')[0];
    const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
    ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);
    let id = 0; const pending = new Map();
    ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.reject(m.error) : p.resolve(m.result); } };
    const send = (method, params = {}) => new Promise((resolve, reject) => { pending.set(++id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })); });
    const evaluate = async expression => { const r = await send('Runtime.evaluate', { expression, returnByValue: true }); assert(!r.exceptionDetails, JSON.stringify(r.exceptionDetails)); return r.result.value; };
    const tap = async selector => {
      const point = await evaluate(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); el.scrollIntoView({block:'center'}); const r = el.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2}; })()`);
      await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
      await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    };
    for (const width of [320, 390, 768, 900, 1280]) {
      await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
      await send('Emulation.setTouchEmulationEnabled', { enabled: true });
      await send('Page.navigate', { url: pathToFileURL(path.resolve('problem-walkthoughs/unit 4/work-sign-challenge.html')).href });
      await delay(350);
      assert(await evaluate(`(() => { const cards = [...document.querySelectorAll('.scenario-card')].map(e=>e.getBoundingClientRect()); return cards.every(r=>r.y===cards[0].y) && document.documentElement.scrollWidth<=innerWidth; })()`), `layout ${width}`);
      await tap('#ans-pos'); await tap('[data-drop="1"]');
      await tap('#ans-neg'); await tap('#ans-pos');
      assert.equal(await evaluate(`document.querySelector('#ans-neg').parentElement.dataset.drop`), '1');
      await tap('#ans-pos'); await tap('[data-drop="0"]');
      await tap('#ans-zero'); await tap('[data-drop="2"]');
      assert(await evaluate(`[...document.querySelectorAll('.feedback')].every(e=>e.textContent.includes('Correct!'))`), `answers ${width}`);
      fs.writeFileSync(path.join(__dirname, `work-sign-${width}.png`), Buffer.from((await send('Page.captureScreenshot', { captureBeyondViewport: true })).data, 'base64'));
      await tap('[data-level-btn="1"]');
      for (const [answer, zone] of [['neg',0],['zero',1],['pos',2]]) { await tap('#ans-'+answer); await tap(`[data-drop="${zone}"]`); }
      assert(await evaluate(`document.documentElement.dataset.riseComplete==='true' && [...document.querySelectorAll('.feedback')].every(e=>e.textContent.includes('Correct!'))`), `level 2 ${width}`);
      console.log(`PASS ${width}px: three columns, no overflow, touch placement/replacement, both levels and completion`);
    }
  } finally { ws?.close(); chrome.kill(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
