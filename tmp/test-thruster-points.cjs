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
      await send('Page.navigate',{url:pathToFileURL(path.resolve('problem-walkthoughs/unit 4/orbit-thruster-direction.html')).href});await delay(100);
      for(const lapPosition of [100,700,1300,1900])for(const direction of ['forward','backward','inward','outward']){
        await evaluate(`setLevel(1);paused=true;cursor=${lapPosition};choose('${direction}')`);
        assert.equal(await evaluate('nextBurnIndex'),(Math.floor(lapPosition/600)+1)*600);
        assert.equal(await evaluate('cursor'),lapPosition);
        assert.equal(await evaluate("document.getElementById('preview').getAttribute('d')"),'');
        await evaluate('cursor=nextBurnIndex-1;paused=false');await delay(60);
        assert.equal(await evaluate('flightPhase'),'burn');
        const state=await evaluate('({p:pendingPath[0],theta:nextBurnIndex/2400*2*Math.PI})');
        const c=Math.cos(state.theta),sn=Math.sin(state.theta),radial=state.p.vx*c+state.p.vy*sn,tangent=-state.p.vx*sn+state.p.vy*c;
        assert(Math.abs(radial-(direction==='inward'?-.15:direction==='outward'?.15:0))<1e-8);
        assert(Math.abs(tangent-(direction==='forward'?1.15:direction==='backward'?.85:1))<1e-8);
        await evaluate('burnElapsed=1400');await delay(50);assert.equal(await evaluate('flightPhase'),'depart');
      }
      await evaluate("setLevel(2);choose('forward');arrival();choose('forward')");assert.equal(await evaluate('stage'),'done');
      assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'));
      console.log('PASS '+width+'px: all four locations and directions, queue timing, hidden preview, burns, Level 2');
    }
  }finally{ws?.close();chrome.kill();}
})().catch(e=>{console.error(e);process.exit(1)});
