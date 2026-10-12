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








    const root=path.resolve('unit-ApplicationFiles/unit-6/millikan-oil-drop-investigation');
    for(const file of ['millikan_oil_drop_simulation.html','u6l1-millikan-buzz-assessment-template-preview.html'])for(const width of [320,390,1200]){
      await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
      await send('Page.navigate',{url:pathToFileURL(path.join(root,file)).href});await delay(200);
      assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'),file+' overflow '+width);
      assert(await evaluate("['clearBtn','csvBtn'].every(id=>document.getElementById(id).getClientRects().length>0)"));
      await evaluate("drop = new Drop(2); voltageSlider.value=100; voltageSlider.dispatchEvent(new Event('input')); btnRecord.click()");
      assert(await evaluate('state.records.length>0'));
      await evaluate("document.getElementById('simCanvas').scrollIntoView({block:'center'})");await delay(150);
      fs.writeFileSync('tmp/millikan-fixed-'+(file.startsWith('u6')?'preview':'source')+'-'+width+'.png',Buffer.from((await send('Page.captureScreenshot')).data,'base64'));
      console.log('PASS '+file+' '+width+'px: fits, reset/export visible, balance and record work');
    }
  }finally{ws?.close();chrome.kill();}
})().catch(e=>{console.error(e);process.exit(1)});
