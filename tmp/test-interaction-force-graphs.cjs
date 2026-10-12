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

    await send('Page.navigate', {url:pathToFileURL(path.resolve('problem-walkthoughs/unit 3/interaction-force-graphs.html')).href});
    await delay(500);
    await evaluate("window.completeCount=0;window.addEventListener('message',e=>{if(e.data.type==='complete')window.completeCount++})");
    for(const width of [320,768]) {
      await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
      for(let i=0;i<6;i++) {
        await evaluate(`document.getElementById('scenario').value=${i};document.getElementById('scenario').dispatchEvent(new Event('change'))`);
        if(width===320) assert(await evaluate("document.getElementById('result').hidden"));
        await evaluate("document.querySelector('#choices button').click()");
        await delay(30);
        if(i<3){
          assert.equal(await evaluate("document.querySelectorAll('#scene svg').length"),1);
          await evaluate("document.getElementById('play').click()");
          const initial=await evaluate("document.querySelector('#graph path').getAttribute('d')");
          await evaluate("document.getElementById('replay').click()");
          await delay(300);
          assert(await evaluate("Number(document.getElementById('time').value)>0"));
          assert.notEqual(await evaluate("document.querySelector('#graph path').getAttribute('d')"),initial);
        }else assert(await evaluate("document.getElementById('playback').hidden"));
        assert.equal(await evaluate("document.querySelectorAll('#graph path').length"),2);
        assert(await evaluate("document.documentElement.scrollWidth<=window.innerWidth"));
        await evaluate("document.getElementById('time').value=80;document.getElementById('time').dispatchEvent(new Event('input'))");
        assert(await evaluate("document.getElementById('readout').textContent.includes('dashed:')"));
      }
    }
    await delay(100);
    assert.equal(await evaluate('window.completeCount'),1);
    await evaluate("document.getElementById('reset').click()");
    assert(await evaluate("document.getElementById('result').hidden && document.getElementById('next').disabled"));
    console.log('PASS: six scenarios, prediction gating, graph rendering, slider, completion once, reset, 320px/768px reflow');
  } finally { if(ws)ws.close();chrome.kill(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
