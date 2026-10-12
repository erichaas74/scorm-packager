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





    for(const width of [320,390,768]){
      await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});
      await send('Page.navigate',{url:pathToFileURL(path.resolve('problem-walkthoughs/unit 4/orbit-thruster-direction.html')).href});await delay(150);
      await evaluate("window.messages=[];addEventListener('message',e=>messages.push(e.data))");
      for(const name of ['forward','backward','inward','outward']){
        await evaluate(`document.querySelector('[data-direction="${name}"]').click()`);
        assert.equal(await evaluate('flightPhase'),'approach');
        await evaluate('paused=true;cursor=800');
        await evaluate(`document.querySelector('[data-direction="${name}"]').click()`);
        assert.equal(await evaluate('cursor'),800);
        assert(await evaluate("!document.querySelector('[data-direction=forward]').disabled"));
        await evaluate('cursor=points.length-2;paused=false');await delay(100);
        assert.equal(await evaluate('flightPhase'),'burn');
        assert.equal(await evaluate("document.getElementById('exhaust').getAttribute('visibility')"),'visible');
        await evaluate('burnElapsed=1400');await delay(60);
        assert.equal(await evaluate('flightPhase'),'depart');
        assert.equal(await evaluate("document.getElementById('exhaust').getAttribute('visibility')"),'hidden');
        const data=await evaluate('({start:points[0],end:points.at(-1),r:points.map(p=>Math.hypot(p.x,p.y))})');
        assert(Math.hypot(data.end.x-1,data.end.y)<.001);
        if(name==='forward')assert(Math.max(...data.r)>1.9);
        if(name==='backward')assert(Math.min(...data.r)>.455&&Math.min(...data.r)<.6);
        if(name==='inward')assert(data.start.vx<0);
        if(name==='outward')assert(data.start.vx>0);
        assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'));
        assert(await evaluate("document.querySelector('[data-direction=forward]').disabled"));
        await evaluate('cursor=points.length-2;paused=false');await delay(100);
        assert.equal(await evaluate('flightPhase'),'returned');
        assert(await evaluate("!document.querySelector('[data-direction=forward]').disabled && paused"));

      }
      await delay(30);assert.equal(await evaluate("messages.filter(m=>m.type==='complete').length"),0);
      await evaluate("document.querySelector('[data-direction=none]').click()");
      assert(await evaluate("document.getElementById('thrust-arrow').getAttribute('d')===' ' .trim()"));
      await evaluate("document.getElementById('level2').click();document.querySelector('[data-direction=inward]').click()");
      assert.equal(await evaluate('stage'),'ready');assert.equal(await evaluate("document.getElementById('match-meter').value"),50);
      await evaluate("document.querySelector('[data-direction=forward]').click()");
      assert.equal(await evaluate('stage'),'coast');
      assert(await evaluate("document.querySelector('[data-direction=forward]').disabled"));
      await evaluate('cursor=points.length-2;paused=false');await delay(100);
      assert.equal(await evaluate('stage'),'arrival');assert.equal(await evaluate("document.querySelector('[data-direction=forward]').firstChild.textContent"),'↑');
      assert(await evaluate('Math.abs(points.at(-1).x+2)<1e-8'));
      await evaluate("document.querySelector('[data-direction=backward]').click()");assert.equal(await evaluate('stage'),'arrival');
      await evaluate("document.querySelector('[data-direction=forward]').click()");assert.equal(await evaluate('stage'),'done');assert.equal(await evaluate("document.getElementById('match-meter').value"),25);
      assert(await evaluate('points.every(p=>Math.abs(Math.hypot(p.x,p.y)-2)<1e-8)'));
      await delay(30);assert.equal(await evaluate("messages.filter(m=>m.type==='complete').length"),1);
      assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'));
      await evaluate("document.querySelector('[data-direction=none]').click();document.querySelector('[data-direction=forward]').click();document.getElementById('skip').click()");
      assert.equal(await evaluate('stage'),'arrival');
      fs.writeFileSync('tmp/thruster-'+width+'.png',Buffer.from((await send('Page.captureScreenshot',{captureBeyondViewport:true})).data,'base64'));
      console.log('PASS '+width+'px: four directions, closed paths, reset, completion, layout');
    }
  }finally{ws?.close();chrome.kill();}
})().catch(e=>{console.error(e);process.exit(1)});
