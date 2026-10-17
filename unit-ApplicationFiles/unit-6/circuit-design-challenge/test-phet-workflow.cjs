const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { pathToFileURL } = require('node:url');
const delay = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const profile = fs.mkdtempSync(path.join(process.cwd(), 'tmp', 'phet-test-browser-'));
  const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless', '--disable-gpu', '--no-first-run', '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank'], { windowsHide: true, stdio: ['ignore','ignore','pipe'] });
  let launchErrors = ''; chrome.stderr.on('data', data => { launchErrors += data; });
  let ws;
  try {
    const portFile = path.join(profile, 'DevToolsActivePort');
    for (let i = 0; i < 100 && !fs.existsSync(portFile); i++) await delay(100);
    if (!fs.existsSync(portFile)) throw new Error('Chrome did not start: '+launchErrors);
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
    const evidenceDir=path.join(root,'audit-evidence');
    fs.mkdirSync(evidenceDir,{recursive:true});
    await send('Runtime.enable');
    const errors=[];
    const originalMessage=ws.onmessage;
    ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);originalMessage(e);};
    async function load(file) {
      await send('Page.navigate',{url:pathToFileURL(path.join(root,file)).href});
      for(let n=0;n<50;n++) { await delay(100); if(await evaluate("document.querySelectorAll('[data-mission]').length===8"))return; }
      throw new Error('App did not load');
    }
    for (const file of ['index.html','u6l3-circuit-design-buzz-assessment-template-preview.html']) {
      await load(file);
      await evaluate("localStorage.removeItem('u6l3-phet-notebook-v2')");
      await load(file);
      assert.equal(await evaluate("document.querySelector('#progressPercent').textContent"),'0%');
      assert.equal(await evaluate("document.querySelectorAll('canvas,#recordEvidence').length"),0);
      for(const width of [320,390,768,1200]) {
        await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
        for(let m=0;m<8;m++) {
          await evaluate(`document.querySelector('[data-mission="${m}"]').click()`);
          assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'),`${file} ${width} mission ${m} overflow`);
          assert(await evaluate("document.querySelector('#buildSteps').children.length>=3"));
        }
        await evaluate("document.querySelector('[data-mission=\"0\"]').click()");
        fs.writeFileSync(path.join(evidenceDir, 'phet-'+(file==='index.html'?'source':'preview')+'-'+width+'.png'),Buffer.from((await send('Page.captureScreenshot')).data,'base64'));
      }
      for(let m=0;m<8;m++) {
        await evaluate(`document.querySelector('[data-mission="${m}"]').click();document.querySelectorAll('#missionEvidence [data-evidence]').forEach(el=>{el.value=el.tagName==='SELECT'?el.options[1].value:el.type==='number'?'9':'Observed in PhET';el.dispatchEvent(new Event('input',{bubbles:true}));});`);
      }
      assert.equal(await evaluate("document.querySelector('#progressPercent').textContent"),'100%');
      await evaluate("document.querySelector('#prediction').value='My prediction';document.querySelector('#prediction').dispatchEvent(new Event('input'));document.querySelector('#observation').value='My wiring repair';document.querySelector('#observation').dispatchEvent(new Event('input'));");
      await load(file);
      assert.equal(await evaluate("document.querySelector('#prediction').value"),'My prediction');
      assert.equal(await evaluate("document.querySelector('#observation').value"),'My wiring repair');
      await evaluate("document.querySelector('#openNotebook').click();document.querySelector('[data-evidence=p8_total_current]').value='2.7';document.querySelector('[data-evidence=p8_total_current]').dispatchEvent(new Event('input'));");
      await evaluate("document.querySelector('[data-view=report]').click()");
      assert(await evaluate("document.querySelector('#reportEvidence').textContent.includes('2.7')"));
      await evaluate("window.exportBlob=null;URL.createObjectURL=b=>{window.exportBlob=b;return 'blob:test'};HTMLAnchorElement.prototype.click=function(){};document.querySelector('#downloadReport').click()");
      const exported=await send('Runtime.evaluate',{expression:'exportBlob.text()',awaitPromise:true,returnByValue:true});
      assert(exported.result.value.includes('My wiring repair'));
      assert(exported.result.value.includes('2.7 A'));
      const dom=await send('DOM.getDocument');
      const fileInput=await send('DOM.querySelector',{nodeId:dom.root.nodeId,selector:'#circuitImage'});
      await send('DOM.setFileInputFiles',{nodeId:fileInput.nodeId,files:[path.join(evidenceDir,'phet-source-390.png')]});
      for(let n=0;n<30;n++){await delay(100);if(await evaluate("!!JSON.parse(localStorage.getItem('u6l3-phet-notebook-v2')).image"))break;}
      assert(await evaluate("!document.querySelector('#circuitPreview').hidden"));
      await load(file);
      await evaluate("document.querySelector('[data-view=report]').click()");
      assert(await evaluate("document.querySelector('#circuitPreview').src.startsWith('data:image/png')"));
      await send('Emulation.setEmulatedMedia',{media:'print'});
      assert(await evaluate("getComputedStyle(document.querySelector('#reportView')).display!=='none'"));
      assert(await evaluate("getComputedStyle(document.querySelector('#circuitImage')).display==='none'"));
      await send('Emulation.setEmulatedMedia',{media:''});
      await evaluate("document.querySelector('#removeImage').click()");
      assert(await evaluate("!JSON.parse(localStorage.getItem('u6l3-phet-notebook-v2')).image"));
      for(const view of ['notebook','report']){
        await send('Emulation.setDeviceMetricsOverride',{width:320,height:900,deviceScaleFactor:1,mobile:false});
        await evaluate(`document.querySelector('[data-view="${view}"]').click()`);
        assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'),`${view} 320px overflow`);
      }
      await evaluate("document.querySelector('[data-view=bench]').click();document.querySelector('[data-evidence=p8_total_current]').value='-1';document.querySelector('[data-evidence=p8_total_current]').dispatchEvent(new Event('input'));");
      assert.equal(await evaluate("document.querySelector('#progressPercent').textContent"),'88%');
      await evaluate("Storage.prototype.setItem=function(){throw new Error('quota')};document.querySelector('#prediction').dispatchEvent(new Event('input'))");
      assert(await evaluate("document.querySelector('#saveStatus').textContent.includes('could not be saved')"));
      await load(file);
      await evaluate("window.confirm=()=>true;document.querySelector('#resetLab').click()");
      assert.equal(await evaluate("document.querySelector('#progressPercent').textContent"),'0%');
      console.log('PASS '+file+': 8 missions, 320/390/768/1200 layout, manual evidence, reload, notebook edits, report export, screenshot persistence/removal, print, reset, invalid numbers, storage failure');
    }
    assert.equal(errors.length,0,JSON.stringify(errors));
  }finally{ws?.close();chrome.kill();}
})().catch(e=>{console.error(e);process.exit(1)});
