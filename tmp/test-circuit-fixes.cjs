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








    const root=path.resolve('unit-ApplicationFiles/unit-6/circuit-design-challenge');
    for(const file of ['index.html','u6l3-circuit-design-buzz-assessment-template-preview.html'])for(const width of [320,390,768,1200]){
      await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
      await send('Page.navigate',{url:pathToFileURL(path.join(root,file)).href});await delay(200);
      assert(await evaluate("document.getElementById('shortWarning').hidden && getComputedStyle(document.getElementById('shortWarning')).display==='none'"));
      for(let m=0;m<8;m++){
        await evaluate(`document.querySelector('[data-mission="${m}"]').click()`);
        const dims=await evaluate('({w:innerWidth,sw:document.documentElement.scrollWidth})');assert(dims.sw<=dims.w,JSON.stringify({file,width,m,...dims}));
        await evaluate("document.getElementById('recordEvidence').click()");
      }
      await evaluate("document.querySelectorAll('[data-mission]')[0].click();document.querySelector('[data-bulb]').click()");
      assert(await evaluate("document.querySelector('.circuit-status').textContent.includes('Open circuit')"));
      await evaluate("document.querySelector('[data-bulb]').click()");
      assert(await evaluate("document.querySelector('.circuit-status').textContent.includes('Current flowing')"));
      await evaluate("document.getElementById('openNotebook').click()");
      assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'));
      await evaluate("document.querySelector('[data-view=bench]').click();document.querySelectorAll('[data-mission]')[4].click();document.querySelector('#circuitCanvas').scrollIntoView({block:'center'})");
      fs.writeFileSync('tmp/circuit-fixed-'+(file==='index.html'?'source':'preview')+'-'+width+'.png',Buffer.from((await send('Page.captureScreenshot')).data,'base64'));
      console.log('PASS '+file+' '+width+'px: all missions fit, warning hidden, disconnect/reconnect, record and notebook');
    }
  }finally{ws?.close();chrome.kill();}
})().catch(e=>{console.error(e);process.exit(1)});
