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






    for(const width of [320,768]){
      await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});
      await send('Page.navigate',{url:pathToFileURL(path.resolve('problem-walkthoughs/unit 4/orbit-energy-outcomes.html')).href});await delay(100);
      await evaluate("window.messages=[];addEventListener('message',e=>messages.push(e.data))");
      for(const n of [0,1]){
        await evaluate(`document.querySelector('[data-engine="${n===0?'rear':'nose'}"]').click()`);assert.equal(await evaluate('quizStep'),1);
        await evaluate(`document.querySelector('[data-engine="${n===0?'nose':'rear'}"]').click()`);assert.equal(await evaluate('quizStep'),2);
        assert.equal(await evaluate('selected'),1);
        await evaluate("document.querySelector('[data-orbit=same]').click()");assert.equal(await evaluate('quizStep'),2);
        await evaluate(`document.querySelector('[data-orbit="${n===0?'closer':'farther'}"]').click()`);assert.equal(await evaluate('quizStep'),3);
        assert.equal(await evaluate("document.getElementById('preview').getAttribute('d')"),'');
        await evaluate('cursor=nextIndex-1;paused=false');await delay(60);assert.equal(await evaluate('phase'),'burn');
        await evaluate('burnElapsed=1400');await delay(60);assert.equal(await evaluate('phase'),'depart');
        await evaluate('cursor=1199;paused=false');await delay(60);assert.equal(await evaluate('phase'),'returned');
        assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'));
        if(n===0)await evaluate("document.getElementById('next-round').click()");
      }
      await delay(30);assert.equal(await evaluate("messages.filter(m=>m.type==='complete').length"),1);
      await evaluate("document.getElementById('again').click()");assert.equal(await evaluate('round'),0);
      console.log('PASS '+width+'px: two predictions, wrong answers, hidden reveal, both burns, completion, restart');
    }
  }finally{ws?.close();chrome.kill();}
})().catch(e=>{console.error(e);process.exit(1)});
