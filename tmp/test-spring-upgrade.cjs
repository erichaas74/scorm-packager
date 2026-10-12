const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { pathToFileURL } = require('node:url');
const delay = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const profile = fs.mkdtempSync(path.join(__dirname, 'spring-browser-'));
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
    for (const width of [320, 768, 1280]) {
      await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
      await send('Page.navigate', { url: pathToFileURL(path.resolve('problem-walkthoughs/unit 4/conservation-energy-spring-bounce.html')).href });
      await delay(250);
      assert(await evaluate('document.documentElement.scrollWidth <= innerWidth'), `overflow ${width}`);
      assert.equal(await evaluate('mode'), 'watch');
      await evaluate(`window.messages=[]; window.addEventListener('message', e=>messages.push(e.data)); document.getElementById('pause').click()`);
      assert(await evaluate('paused'));
      await evaluate(`document.getElementById('pause').click(); elapsed=5*PERIOD; frame(performance.now())`);
      assert.equal(await evaluate('mode'), 'question-motion');
      for (let i=0;i<5;i++) {
        await evaluate('questionElapsed=PERIOD+questions[questionIndex].time; frame(performance.now())');
        assert.equal(await evaluate('mode'), 'quiz');
        if (i===3) assert(await evaluate(`!document.getElementById('locations').hidden && document.getElementById('ball').style.display==='none'`));
        await evaluate(`document.querySelector('[data-answer="'+questions[questionIndex].answer+'"]').click()`);
        assert.equal(await evaluate('score'), i+1);
        await evaluate(`answer(questions[questionIndex].answer)`);
        assert.equal(await evaluate('responses.length'), i+1);
        await evaluate(`document.getElementById('next').click()`);
      }
      await delay(50);
      assert.equal(await evaluate('mode'), 'done');
      assert.equal(await evaluate(`messages.filter(m=>m.type==='complete').length`),1);
      assert(await evaluate(`document.documentElement.dataset.riseComplete==='true'`));
      await evaluate(`document.getElementById('restart').click()`);
      assert(await evaluate(`mode==='watch' && score===0 && responses.length===0`));
      assert(await evaluate(`Array.from({length:1000},(_,i)=>stateAt(PERIOD*i/1000)).every(s=>Math.abs(s.peg+s.ke+s.pes-1)<1e-9)`));
      console.log(`PASS ${width}px: layout, pause, five questions, scoring, completion, replay, energy conservation`);
    }
  } finally { ws?.close(); chrome.kill(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
