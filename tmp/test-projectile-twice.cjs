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








    await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
    for(const width of [320,390,1100]){
      await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
      await send('Page.navigate',{url:pathToFileURL(path.resolve('problem-walkthoughs/unit 2/projectile-same-height-twice.html')).href});await delay(200);
      assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'));
      await evaluate("document.querySelector('#next').click()");await delay(1800);
      assert.equal(await evaluate('stage'),'count');assert.equal(await evaluate('t'),3);
      assert(await evaluate("document.querySelector('#marks').innerHTML===''") );
      await evaluate("window.setTimeout=(fn)=>window.requestAnimationFrame(fn);document.querySelectorAll('#choices button')[1].click()");
      await delay(400);
      assert.equal(await evaluate('solved'),11);
      assert.equal(await evaluate('busy'),false);
      assert.equal(await evaluate("document.querySelector('#choices').textContent"),'1.0 s3.0 s');
      await evaluate("document.querySelectorAll('#choices button')[1].click()");
      assert(Math.abs(await evaluate('pos(1).y-pos(3).y'))<.001);
      await evaluate("document.querySelector('#next').click();document.querySelectorAll('#choices button')[1].click();document.querySelector('#next').click()");
      assert.equal(await evaluate('reveal'),false);
      assert.equal(await evaluate("document.querySelectorAll('#choices button').length"),3);
      await evaluate("document.querySelector('#choices button').click()");
      assert(await evaluate("document.querySelector('#work').textContent.includes('(1.0)') && document.querySelector('#work').textContent.includes('(3.0)')"));
      assert.equal(await evaluate('stage'),'done');assert(await evaluate('reveal'));
      fs.writeFileSync('tmp/projectile-twice-'+width+'.png',Buffer.from((await send('Page.captureScreenshot')).data,'base64'));
      await evaluate("document.querySelector('#next').click()");assert.equal(await evaluate('t'),0);
      console.log('PASS '+width+'px: predictions, two crossings, catches, reset, page fit');
    }
  }finally{ws?.close();chrome.kill();}
})().catch(e=>{console.error(e);process.exit(1)});
