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








    const root=path.resolve('unit-ApplicationFiles/unit-6');const records=[];
    async function visit(folder,stem){await send('Emulation.setDeviceMetricsOverride',{width:1200,height:900,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:pathToFileURL(path.join(root,folder,stem+'-preview.html')).href});await delay(250);}
    await visit('millikan-oil-drop-investigation','u6l1-millikan-buzz-assessment-template');
    const millikan=await evaluate(`(()=>{for(let i=0;i<6;i++){document.getElementById('btnAtomize').click();const el=document.getElementById('voltageSlider');el.value=Math.round(200/drop.n);el.dispatchEvent(new Event('input',{bubbles:true}));document.getElementById('btnRecord').click();}return {records:state.records,progress:document.getElementById('progressText').textContent,hiddenResponses:[...document.querySelectorAll('[data-question]')].map(e=>({display:getComputedStyle(e.closest('section')).display,rect:e.getBoundingClientRect().width})),submitDisabled:document.getElementById('submitLab').disabled}})()`);records.push({millikan});
    await send('Page.reload');await delay(250);records.push({millikanReload:await evaluate('state.records.length')});
    await visit('circuit-design-challenge','u6l3-circuit-design-buzz-assessment-template');
    records.push({circuit:await evaluate(`(()=>{const e=document.getElementById('shortWarning');return {warning:{hidden:e.hidden,display:getComputedStyle(e).display,text:e.textContent},count:{text:document.getElementById('notebookCount').textContent,display:getComputedStyle(document.getElementById('notebookCount')).display},body:document.body.className}})()`)});
    await evaluate("document.getElementById('recordEvidence').click();document.getElementById('openNotebook').click()");records.push({circuitEvidence:await evaluate("document.getElementById('notebookView').innerText.slice(0,1300)")});
    await visit('generator-design-challenge','u6l5-generator-buzz-assessment-template');
    await evaluate("const f=document.getElementById('flowRange');f.value=100;f.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('[data-record=speed]').click()");await delay(250);
    records.push({generator:await evaluate(`({peak:document.getElementById('hudPeak').textContent,badge:document.getElementById('answerBadge').textContent,badgeDisplay:getComputedStyle(document.getElementById('answerBadge')).display,progress:document.getElementById('progressText').textContent,storage:Object.keys(localStorage).filter(k=>/generator/i.test(k)).map(k=>({key:k,value:JSON.parse(localStorage.getItem(k))}))})`)});
    await visit('electromagnet-lab','u6l4-electromagnet-design-buzz-assessment-template');
    await evaluate("document.getElementById('em-run-test').click()");await delay(2500);
    records.push({electromagnet:await evaluate("document.body.innerText.slice(-5000,-2500)")});
    await visit('honors-electric-motor-engineering-challenge','u6h-motor-buzz-assessment-template');
    await evaluate("document.getElementById('motorCanvas').scrollIntoView({block:'center'});document.getElementById('runBtn').click()");await delay(350);fs.writeFileSync('tmp/u6-motor-running.png',Buffer.from((await send('Page.captureScreenshot')).data,'base64'));await evaluate("document.getElementById('baselineBtn').click();document.getElementById('captureBtn').click()");records.push({motor:await evaluate("document.body.innerText.slice(-1800)")});
    fs.writeFileSync('tmp/u6-interaction-audit.json',JSON.stringify(records,null,2));console.log(JSON.stringify(records).slice(0,10500));
  }finally{ws?.close();chrome.kill();}
})().catch(e=>{console.error(e);process.exit(1)});
