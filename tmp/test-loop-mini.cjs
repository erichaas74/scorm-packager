const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { pathToFileURL } = require('node:url');
const delay = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const profile = fs.mkdtempSync(path.join(__dirname, 'orbit-browser-'));
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
    for(const file of ['Loop-Sim-Lab.html','u4l3-loop-sim-lab-buzz-assessment-template.html','u4l3-loop-sim-lab-buzz-assessment-template-preview.html']) {
    for(const width of [320,1280]) {
      await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
      await send('Page.navigate',{url:pathToFileURL(path.resolve('unit-ApplicationFiles/unit-4/lesson-3',file)).href});
      await delay(300);
      assert.equal(await evaluate("document.querySelectorAll('.loop-primer > details').length"),4);
      await evaluate("document.querySelectorAll('.loop-primer details').forEach(d=>d.open=true)");
      assert(await evaluate("document.documentElement.scrollWidth<=innerWidth"),'overflow '+file+' '+width);
      assert(await evaluate("document.querySelector('.loop-primer').innerText.includes('20 newtons')"));
      assert(await evaluate("[...document.querySelectorAll('.primer-equation')].every(e=>!e.textContent.includes('?'))"));
      assert.equal(await evaluate("document.querySelectorAll('.loop-primer svg').length"),3);
      if(file.includes('template')) {
        assert(await evaluate("!!(document.querySelector('.loop-primer').compareDocumentPosition(document.querySelector('[aria-labelledby=prediction-heading]')) & Node.DOCUMENT_POSITION_FOLLOWING)"));
        await evaluate("document.querySelector('[data-predict]').click()");
        assert(await evaluate("!document.querySelector('[data-run]').disabled"));
      }
      if(width===1280 && file==='Loop-Sim-Lab.html') fs.writeFileSync(path.join(__dirname,'loop-mini-lesson.png'),Buffer.from((await send('Page.captureScreenshot',{captureBeyondViewport:true})).data,'base64'));
      console.log('PASS '+file+' '+width+'px: lesson, diagrams, equations, layout and prediction');
    }
    }
  } finally {ws?.close();chrome.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});

