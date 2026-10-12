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

    for (const width of [320,390,768,940]) {
      await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});
      await send('Page.navigate',{url:pathToFileURL(path.resolve('problem-walkthoughs/unit 4/latent-heat-tempatureconstant.html')).href});
      await delay(250);
      assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'),'overflow '+width);
      await evaluate("window.messages=[];window.addEventListener('message',e=>messages.push(e.data));");
      for (const [q,temp] of [[0,'-20 \u00b0C'],[15,'0 \u00b0C'],[35,'0 \u00b0C'],[60,'100 \u00b0C'],[100,'120 \u00b0C']]) {
        await evaluate("slider.value="+q+";slider.dispatchEvent(new Event('input'))");
        assert.equal(await evaluate("document.getElementById('temperature').textContent"),temp);
        assert(await evaluate("document.getElementById('thermometer-fill').getAttribute('y')===document.getElementById('point').getAttribute('cy')"),'thermometer matches chart');
      }
      await delay(50);
      assert.equal(await evaluate("messages.filter(x=>x.type==='complete').length"),1);
      assert(await evaluate("!document.querySelector('.controls')"));
      assert(await evaluate("slider.getBoundingClientRect().top >= document.querySelector('.curve').getBoundingClientRect().bottom"),'slider below chart');
      assert(await evaluate("getComputedStyle(slider).writingMode==='horizontal-tb'"));
      await evaluate("slider.value=50;slider.dispatchEvent(new Event('input'));slider.focus()");
      await send('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39});
      await send('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39});
      assert.equal(await evaluate('Number(slider.value)'),51);
      for(const q of [0,45,100]){
        await evaluate("slider.value="+q+";slider.dispatchEvent(new Event('input'))");
        const count=await evaluate("[...document.querySelectorAll('#bonds line')].filter(e=>Number(e.getAttribute('opacity'))>0).length");
        assert(q===100?count===0:count>0,'bond state '+q);
        const before=await evaluate("document.querySelector('#particles circle').getAttribute('cx')");
        await delay(150);
        assert.notEqual(await evaluate("document.querySelector('#particles circle').getAttribute('cx')"),before,'motion '+q);
      }
      await evaluate("slider.value=45;slider.dispatchEvent(new Event('input'))");
      fs.writeFileSync('tmp/latent-heat-'+width+'.png',Buffer.from((await send('Page.captureScreenshot',{captureBeyondViewport:true})).data,'base64'));
      console.log('PASS '+width+'px: no overflow; temperature boundaries; horizontal slider; ArrowRight increases heat; removed footer; one completion message');
    }
  } finally {ws?.close();chrome.kill();}
})().catch(e=>{console.error(e);process.exit(1)});

