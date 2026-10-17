const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { spawn } = require('child_process');
const { pathToFileURL } = require('url');

const sourceRoot = path.resolve(__dirname, 'unit 5');
const root = process.env.UNIT5_PACKAGE_ROOT || sourceRoot;
const files = ['polarization-filters.html'];
assert(files.length > 0, 'No matching lessons');
const output = path.resolve(__dirname, '../output/unit5-polarization-audit' + (process.env.UNIT5_PACKAGE_ROOT ? '-packaged' : '') + (process.env.UNIT5_ONLY ? '-focused' : ''));
const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

(async () => {
  fs.mkdirSync(output, { recursive: true });
  const profile = fs.mkdtempSync(path.join(output, 'browser-'));
  const browser = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless', '--no-first-run', '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
  let socket;
  try {
    const portFile = path.join(profile, 'DevToolsActivePort');
    for (let attempt = 0; attempt < 100 && !fs.existsSync(portFile); attempt++) await delay(100);
    const port = fs.readFileSync(portFile, 'utf8').split('\n')[0];
    const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
    socket = new WebSocket(targets.find(target => target.type === 'page').webSocketDebuggerUrl);
    await new Promise(resolve => { socket.onopen = resolve; });
    let serial = 0;
    const pending = new Map();
    const errors = [];
    socket.onmessage = event => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const resolve = pending.get(message.id);
        pending.delete(message.id);
        resolve(message);
      }
      if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails);
    };
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      pending.set(++serial, message => message.error ? reject(Error(JSON.stringify(message.error))) : resolve(message.result));
      socket.send(JSON.stringify({ id: serial, method, params }));
    });
    const evaluate = async expression => {
      const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails));
      return result.result.value;
    };
    await send('Runtime.enable');
    await send('Page.enable');
    await send('Page.addScriptToEvaluateOnNewDocument', { source: `
      window.testTime = 0;
      window.testFrame = null;
      window.testCompletions = 0;
      window.requestAnimationFrame = callback => { window.testFrame = callback; return 1; };
      window.advanceLesson = milliseconds => {
        if (window.testTime === 0 && window.testFrame) window.testFrame(0);
        for (let elapsed = 0; elapsed < milliseconds; elapsed += 100) {
          window.testTime += 100;
          if (window.testFrame) window.testFrame(window.testTime);
        }
      };
      window.addEventListener('message', event => { if (event.data && event.data.type === 'complete') window.testCompletions++; });
    ` });

    const results = [], clipping = [], overlaps = [];
    const inspect = async (file, width, stage) => {
      const issues = await evaluate(`(() => {
        const svg=document.getElementById('scene'), view=svg.viewBox.baseVal, outer=svg.getBoundingClientRect();
        const labels=[...svg.querySelectorAll('text')].map(element=>({text:element.textContent,box:element.getBoundingClientRect()}));
        const unreadable=[...svg.querySelectorAll('text')].filter(element=>{
          const style=getComputedStyle(element), size=parseFloat(style.fontSize)*outer.width/view.width;
          const channels=style.fill.match(/[0-9.]+/g).slice(0,3).map(Number).map(value=>{const channel=value/255;return channel<=.04045?channel/12.92:((channel+.055)/1.055)**2.4;});
          const luminance=.2126*channels[0]+.7152*channels[1]+.0722*channels[2];
          return size<12||1.05/(luminance+.05)<7;
        }).map(element=>element.textContent);
        const clipped=labels.filter(({box})=>box.left<outer.left-1||box.right>outer.right+1||box.top<outer.top-1||box.bottom>outer.bottom+1).map(item=>item.text);
        const overlap=[];
        labels.forEach((first,index)=>labels.slice(index+1).forEach(second=>{
          const horizontal=Math.min(first.box.right,second.box.right)-Math.max(first.box.left,second.box.left);
          const vertical=Math.min(first.box.bottom,second.box.bottom)-Math.max(first.box.top,second.box.top);
          if(horizontal>3&&vertical>3)overlap.push([first.text,second.text]);
        }));
        if(document.documentElement.scrollWidth>innerWidth)clipped.push('BODY');
        if(document.querySelector('h1').scrollWidth>document.querySelector('h1').clientWidth)clipped.push('TITLE');
        return {clipped,overlap,unreadable,invalid:/NaN|Infinity/.test(svg.innerHTML)};
      })()`);
      assert.equal(issues.invalid,false,file+' invalid geometry');
      assert.deepEqual(issues.unreadable,[],file+' small or low-contrast labels');
      if(issues.clipped.length)clipping.push({file,width,stage,labels:issues.clipped});
      if(issues.overlap.length)overlaps.push({file,width,stage,labels:issues.overlap});
    };
    const capture = async (file, width, stage) => {
      const dimensions=await evaluate('({width:innerWidth,height:document.documentElement.scrollHeight})');
      const screenshot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:0,width:dimensions.width,height:dimensions.height,scale:1}});
      fs.writeFileSync(path.join(output,file.replace(/[^a-z0-9]/gi,'-')+'-'+width+'-'+stage+'.png'),Buffer.from(screenshot.data,'base64'));
    };
    for (const file of files) {
      await send('Emulation.setDeviceMetricsOverride',{width:1000,height:900,deviceScaleFactor:1,mobile:false});
      await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
      await send('Page.navigate',{url:pathToFileURL(path.join(root,file)).href});
      for(let attempt=0;attempt<80;attempt++){await delay(25);if(await evaluate("Boolean(document.getElementById('scene')?.dataset.phase)"))break;}
      const phase = () => evaluate("scene.dataset.phase");
      assert.equal(await phase(),'single');
      assert.equal(await evaluate("document.querySelector('h1').textContent"),'One filter: 50% transmitted.');
      assert.equal(await evaluate("document.getElementById('start').hidden"),true);
      assert.equal(await evaluate('scene.dataset.filterCount'),'1');
      assert.equal(await evaluate("Boolean(scene.querySelector('[data-middle-slot]'))"),false);
      assert.equal(await phase(),'single');
      assert.equal(await evaluate("scene.querySelectorAll('[data-wave-angle=\"mixed\"]').length"),0);
      assert.equal(await evaluate("Number(scene.dataset.output)"),50);
      assert.equal(await evaluate("Number(scene.querySelector('[data-wave-span]').dataset.waveSpan)"),410);
      const initialWaves = await evaluate("scene.innerHTML");
      const initialUnpolarized = await evaluate("scene.querySelector('[data-unpolarized-field]').innerHTML");
      assert(await evaluate("new Set([...scene.querySelectorAll('[data-field-direction]')].map(element => element.dataset.fieldDirection)).size > 1"));
      await evaluate('advanceLesson(500)');
      assert.notEqual(await evaluate("scene.querySelector('[data-unpolarized-field]').innerHTML"),initialUnpolarized);
      await evaluate("document.getElementById('pause').click()");
      const pausedUnpolarized = await evaluate("scene.querySelector('[data-unpolarized-field]').innerHTML");
      await evaluate('advanceLesson(500)');
      assert.equal(await evaluate("scene.querySelector('[data-unpolarized-field]').innerHTML"),pausedUnpolarized);
      await evaluate("document.getElementById('pause').click()");
      assert.notEqual(await evaluate('scene.innerHTML'),initialWaves,'Aligned waves must travel');
      for(const width of [1000,768,640,390,320]) {
        await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false}); await delay(50);
        await inspect(file,width,'single'); if(width===1000||width===320)await capture(file,width,'single');
      }
      await evaluate("document.getElementById('advance').click()");
      assert.equal(await phase(),'aligned');
      assert.equal(await evaluate("document.querySelector('h1').textContent"),'Two aligned filters: still 50%.');
      assert.equal(await evaluate('scene.dataset.filterCount'),'2');
      assert.equal(await evaluate("Boolean(scene.querySelector('[data-middle-slot]'))"),false);
      for(const width of [1000,768,640,390,320]) {
        await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false}); await delay(50);
        await inspect(file,width,'aligned'); if(width===1000||width===320)await capture(file,width,'aligned');
      }
      await evaluate("document.getElementById('advance').click();advanceLesson(3200)");
      assert.equal(await evaluate("document.querySelector('h1').textContent"),'Watch the spot on the screen dim.');
      const partial=await evaluate("Number(scene.dataset.output)");
      assert(partial>0&&partial<50);
      const glow = await evaluate("Number(scene.querySelector('[data-screen-glow]').getAttribute('opacity'))");
      assert(glow>0&&glow<1,'The screen must visibly dim during rotation');
      assert.equal(await evaluate("scene.textContent.includes('%')"),false,'No percentage readouts during rotation');
      await evaluate("document.getElementById('pause').click();advanceLesson(1000)");
      assert.equal(await evaluate("Number(scene.dataset.output)"),partial);
      await evaluate("document.getElementById('pause').click();advanceLesson(3300)");
      assert.equal(await phase(),'crossed');
      assert.equal(await evaluate("document.querySelector('h1').textContent"),'Crossed filters: no light.');
      assert.equal(await evaluate("Boolean(scene.querySelector('[data-middle-slot]'))"),false);
      await evaluate("document.getElementById('advance').click()");
      assert.equal(await phase(),'insert');
      assert.equal(await evaluate("document.getElementById('mind-blown').hidden"),true);
      assert.match(await evaluate("document.getElementById('explanation').textContent"),/How can adding more filters/);
      assert.equal(await evaluate("document.querySelectorAll('[data-choice]').length"),0);
      assert.equal(await evaluate("Boolean(scene.querySelector('[data-middle-slot]'))"),false);
      assert.equal(await evaluate("Number(scene.dataset.output)"),0);
      assert.equal(await evaluate("Number(scene.querySelector('[data-screen-glow]').getAttribute('opacity'))"),0);
      assert.equal(await evaluate("scene.querySelectorAll('[data-wave-angle=\"90\"]').length"),0,'Crossed filters must have no outgoing wave');
      await evaluate('advanceLesson(1000)');
      assert.equal(await evaluate("Number(scene.dataset.output)"),0);
      assert.equal(await evaluate("document.getElementById('mind-blown').hidden"),true);
      await evaluate('advanceLesson(600)');
      assert.equal(await phase(),'insert');
      assert.equal(await evaluate("document.getElementById('mind-blown').hidden"),false);
      assert(await evaluate("Number(scene.dataset.output) > 0 && Number(scene.dataset.output) < 12.5"));
      for(const width of [1000,640,320]) {
        await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false}); await delay(50);
        await inspect(file,width,'inserting');
      }
      await evaluate('advanceLesson(1700)');
      assert.equal(await phase(),'complete');
      assert.equal(await evaluate("document.getElementById('mind-blown').hidden"),false);
      assert.equal(await evaluate("getComputedStyle(document.getElementById('mind-blown')).animationName"),'mind-blown-pop');
      assert.equal(await evaluate("Number(scene.dataset.output)"),12.5);
      assert.equal(await evaluate("scene.querySelector('[data-wave-angle=\"45\"]').dataset.waveIntensity"),'25');
      assert(Math.abs(await evaluate("Number(scene.querySelector('[data-wave-angle=\"90\"]').dataset.waveIntensity)")-12.5)<1e-9);
      for(const width of [1000,768,640,390,320]) {
        await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false}); await delay(50);
        await inspect(file,width,'complete'); if(width===1000||width===320)await capture(file,width,'complete');
      }
      await delay(20); assert.equal(await evaluate('testCompletions'),1);
      await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]}); await delay(50);
      await evaluate("document.getElementById('replay').click()");
      assert.equal(await phase(),'single');
      assert.equal(await evaluate("Number(scene.dataset.output)"),50);
      await evaluate("document.getElementById('advance').click();document.getElementById('advance').click();advanceLesson(10000)");
      assert.equal(await evaluate("Number(scene.dataset.output)"),50);
      await evaluate("for(let index=0;index<6;index++)document.getElementById('advance').click()");
      assert.equal(await phase(),'crossed');
      await evaluate("document.getElementById('advance').click()");
      assert.equal(await phase(),'complete');
      assert.equal(await evaluate("getComputedStyle(document.getElementById('mind-blown')).animationName"),'none');
      assert.equal(await evaluate("Number(scene.dataset.output)"),12.5);
      assert.equal(await evaluate('polarizationPhysics.transmission(50,45).toFixed(1)'),'25.0');
      results.push({file,passed:true});process.stdout.write('.');
    }
    fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({results,clipping,overlaps,errors},null,2));
    console.log('\n'+JSON.stringify({tested:results.length,clipping,overlaps,errors},null,2));
    assert.equal(errors.length,0,'Browser errors');
    assert.equal(clipping.length,0,'Clipped labels');
    assert.equal(overlaps.length,0,'Overlapping labels');
  } finally {
    if (socket) socket.close();
    browser.kill();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });



