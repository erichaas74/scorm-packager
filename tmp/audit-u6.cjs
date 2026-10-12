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







    const root=path.resolve('unit-ApplicationFiles/unit-6');
    const files=fs.readdirSync(root,{recursive:true}).filter(f=>f.endsWith('-preview.html'));
    const results=[];
    for(const file of files){
      for(const width of [1200,390]){
        await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
        await send('Page.navigate',{url:pathToFileURL(path.join(root,file)).href});await delay(500);
        const report=await evaluate(`(()=>({title:document.title,width:innerWidth,scrollWidth:document.documentElement.scrollWidth,headings:[...document.querySelectorAll('h1,h2,h3')].map(e=>e.textContent.trim()),buttons:[...document.querySelectorAll('button')].filter(e=>e.getBoundingClientRect().width).map(e=>({id:e.id,text:e.textContent.trim().slice(0,85)})),inputs:[...document.querySelectorAll('input,select')].map(e=>({id:e.id,type:e.type,value:e.value,min:e.min,max:e.max})),graphics:[...document.querySelectorAll('canvas,svg,img')].filter(e=>e.getBoundingClientRect().width).slice(0,12).map(e=>({tag:e.tagName,id:e.id,rect:{x:e.getBoundingClientRect().x,y:e.getBoundingClientRect().y,w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height}})),overflow:[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>innerWidth+2&&e.getBoundingClientRect().width).slice(0,8).map(e=>({tag:e.tagName,id:e.id,cls:e.className?.baseVal??e.className}))}))()`);
        const name=file.split(/[\\/]/)[0];
        fs.writeFileSync('tmp/u6-'+name+'-'+width+'.png',Buffer.from((await send('Page.captureScreenshot',{captureBeyondViewport:false})).data,'base64'));
        results.push({file,...report});console.log(name,width,report.scrollWidth);
      }
    }
    fs.writeFileSync('tmp/u6-browser-audit.json',JSON.stringify(results,null,2));
  }finally{ws?.close();chrome.kill();}
})().catch(e=>{console.error(e);process.exit(1)});
