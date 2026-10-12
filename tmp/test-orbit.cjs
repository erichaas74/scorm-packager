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
    for(const width of [320,768,1280]) {
      await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
      await send('Page.navigate',{url:pathToFileURL(path.resolve('problem-walkthoughs/unit 4/zero-gravity-free-fall.html')).href});
      await delay(250);
      assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'));
      assert.equal(await evaluate('camera'), 'cabin');
      if(width===1280)fs.writeFileSync(path.join(__dirname,'orbit-cabin.png'),Buffer.from((await send('Page.captureScreenshot',{captureBeyondViewport:true})).data,'base64'));
      await evaluate("$('fallingScale').click()");
      assert(await evaluate("camera==='scale' && $('scaleReading').textContent.includes('0 N')"));
      assert(await evaluate("(()=>{paused=false;const before=scaleOrbitAngle;lastTime=1000;frame(1050);return scaleOrbitAngle>before&&$('scaleReading').textContent.includes('0 N');})()"));
      await evaluate("$('fixedScale').click()");
      assert(await evaluate("$('scaleReading').textContent.includes('88.5%') && $('trajectory').textContent==='Stationary' && Math.abs(WEIGHT_PERCENT-88.533)<.01"));
      assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'));
      if(width===1280)fs.writeFileSync(path.join(__dirname,'orbit-scale.png'),Buffer.from((await send('Page.captureScreenshot',{captureBeyondViewport:true})).data,'base64'));
      await evaluate('reset()');
      const result=await evaluate(`(()=>{
        paused=true;
        for(let i=0;i<20000;i++)integrate(astronaut,STEP);
        const error=Math.abs(Math.hypot(astronaut.position.x,astronaut.position.y)/RADIUS-1);
        $('drop').click();
        for(let i=0;i<1000;i++){integrate(astronaut,STEP);integrate(ball,STEP);}
        const identical=JSON.stringify(astronaut)===JSON.stringify(ball);
        const velocity={...astronaut.velocity},position={...astronaut.position};
        $('off').click();
        for(let i=0;i<100;i++){integrate(astronaut,STEP);integrate(ball,STEP);}
        const straight=Math.hypot(astronaut.position.x-position.x-velocity.x*200,astronaut.position.y-position.y-velocity.y*200)<.001;
        const constant=JSON.stringify(velocity)===JSON.stringify(astronaut.velocity);
        render();
        const completed=document.documentElement.dataset.riseComplete==='true';
        const zero=$('g').textContent==='0.00 m/s\u00b2';
        reset();
        return {error,identical,straight,constant,completed,zero,reset:gravityScale===1&&ball!==null&&camera==='cabin'};
      })()`);
      assert(result.error<.00001,JSON.stringify(result));
      for(const key of ['identical','straight','constant','completed','zero','reset'])assert(result[key],key);
      console.log(`PASS ${width}px: stable orbit, matched ball, zero-gravity tangent, telemetry, completion, reset, no overflow`);
    }
  } finally {ws?.close();chrome.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});

