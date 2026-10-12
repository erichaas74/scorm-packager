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








    for(const [folder,file,selector] of [
      ['generator-design-challenge','u6l5-generator-buzz-assessment-template-preview.html','.sim-stage'],
      ['honors-electric-motor-engineering-challenge','u6h-motor-buzz-assessment-template-preview.html','#motorCanvas']
    ]) for(const width of [320,390,1200]) {
      await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
      await send('Page.navigate',{url:pathToFileURL(path.resolve('unit-ApplicationFiles/unit-6',folder,file)).href});await delay(300);
      const info=await evaluate(`(()=>{const r=document.querySelector('${selector}').getBoundingClientRect();return {top:r.top,width:r.width,overflow:document.documentElement.scrollWidth>innerWidth}})()`);
      assert(!info.overflow,JSON.stringify(info)); if(width<500)assert(info.top<850,JSON.stringify(info));
      if(selector==='#motorCanvas') {
        assert(await evaluate("(()=>{const a=document.querySelector('#motorCanvas').getBoundingClientRect(),b=document.querySelector('.overlay').getBoundingClientRect();return b.top>=a.bottom})()"));
        await evaluate("document.querySelector('.task-guide').open=true;document.querySelector('input[name=challenge][value=lift]').click();document.querySelector('.task-guide').open=false");
      }
      fs.writeFileSync('tmp/'+folder+'-fixed-'+width+'.png',Buffer.from((await send('Page.captureScreenshot')).data,'base64'));
      console.log('PASS '+folder+' '+width+'px '+JSON.stringify(info));
    }
  }finally{ws?.close();chrome.kill();}
})().catch(e=>{console.error(e);process.exit(1)});
