const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { spawn } = require('child_process');
const { pathToFileURL } = require('url');

const sourceRoot = path.resolve(__dirname, 'unit 5');
const root = process.env.UNIT5_PACKAGE_ROOT || sourceRoot;
const files = JSON.parse(fs.readFileSync(path.join(sourceRoot, 'simple-walkthrough-files.json'), 'utf8')).filter(file => !process.env.UNIT5_ONLY || file === process.env.UNIT5_ONLY);
assert(files.length > 0, 'No matching lessons');
const output = path.resolve(__dirname, '../output/unit5-textbook-audit' + (process.env.UNIT5_PACKAGE_ROOT ? '-packaged' : '') + (process.env.UNIT5_ONLY ? '-focused' : ''));
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
      assert.equal(await evaluate("document.querySelectorAll('h1').length"),1,file);
      const type=await evaluate('walkthroughLesson.type');
      if(type==='animated-demo'){
        assert.equal(await evaluate("document.querySelectorAll('[data-choice]').length"),0,file);
        await evaluate('advanceLesson(4000)');
        const before=await evaluate("document.getElementById('scene').dataset.time");
        assert.equal(await evaluate("document.getElementById('pause') === null"),true,file);
        await evaluate('advanceLesson(1000)');
        assert.notEqual(await evaluate("document.getElementById('scene').dataset.time"),before,file);
        for(const width of [1000,390,320]){
          await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});await delay(40);
          await inspect(file,width,'demo');
          if(width!==320)await capture(file,width,'demo');
        }
        await evaluate("document.getElementById('replay').click()");
        assert.equal(await evaluate("document.getElementById('scene').dataset.time"),'0.00',file);
        results.push({file,type});
        continue;
      }
      const phase=()=>evaluate("document.getElementById('scene').dataset.phase");
      await evaluate("document.getElementById('pause').click();advanceLesson(1000)");
      assert.equal(await phase(),type==='critical'?'increase':'watch',file);
      await evaluate("document.getElementById('pause').click()");
      if(type==='critical'){
        const phases=['increase','critical','sine','simplify','divide','inverse','result','reflection','hold'];
        const durations=[8000,2500,3500,3500,4000,4000,4000,4000,6500];
        for(let caseIndex=0;caseIndex<2;caseIndex++){
          for(let index=0;index<phases.length;index++){
            assert.equal(await phase(),phases[index],file);
            await evaluate('advanceLesson('+Math.floor(durations[index]/2/100)*100+')');
            for(const width of [1000,768,640,390,320]){
              await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});await delay(40);
              await inspect(file,width,phases[index]);
              if(caseIndex===0&&width!==320&&['increase','sine','result','hold'].includes(phases[index]))await capture(file,width,phases[index]);
            }
            await evaluate('advanceLesson('+(durations[index]-Math.floor(durations[index]/2/100)*100)+')');
          }
        }
        await delay(10);
        assert.equal(await evaluate('testCompletions'),1,file);
        await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await delay(30);
        await evaluate("document.getElementById('replay').click();advanceLesson(12000)");
        assert.equal(await phase(),'increase',file);
        await evaluate("document.getElementById('step').click()");
        assert.equal(await phase(),'critical',file);
      } else {
        await evaluate('advanceLesson(2400)');
        assert.equal(await phase(),'predict',file);
        for(const width of [1000,768,640,390,320]){
          await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});await delay(40);
          await inspect(file,width,'predict');if(width===1000)await capture(file,width,'predict');
        }
        await evaluate("document.querySelector('[data-choice=\"'+walkthroughLesson.correct+'\"]').click();advanceLesson(3200)");
        assert.equal(await phase(),'reveal',file);
        for(const width of [1000,768,640,390,320]){
          await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});await delay(40);
          await inspect(file,width,'reveal');
          if(file==='wave-interference.html'&&width!==390)await capture(file,width,'overlap');
        }
        await evaluate('advanceLesson(3300)');
        assert.equal(await phase(),'complete',file);
        assert.equal(await evaluate("document.getElementById('prompt').textContent"),'Correct.',file);
        for(const width of [1000,768,640,390,320]){
          await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});await delay(40);
          await inspect(file,width,'complete');if(width===1000||width===320)await capture(file,width,'complete');
        }
        if(type==='refraction'){
          for(let caseIndex=1;caseIndex<5;caseIndex++){
            await evaluate('advanceLesson(7400)');
            assert.equal(await phase(),'predict',file);
            assert.equal(await evaluate("Number(document.getElementById('scene').dataset.case)"),caseIndex,file);
            await evaluate("document.querySelector('[data-choice=\"'+(walkthroughLesson.cases["+caseIndex+"].n2>walkthroughLesson.cases["+caseIndex+"].n1?0:1)+'\"]').click();advanceLesson(6500)");
            assert.equal(await evaluate("document.getElementById('prompt').textContent"),'Correct.',file);
          }
        }
        await delay(10);
        assert.equal(await evaluate('testCompletions'),1,file);
        await evaluate("document.getElementById('replay').click();advanceLesson(2500);document.querySelector('[data-choice=\"'+((walkthroughLesson.correct+1)%walkthroughLesson.choices.length)+'\"]').click();advanceLesson(6500)");
        assert.equal(await evaluate("document.getElementById('prompt').textContent"),'Here is what happens.',file);
        await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await delay(30);
        await evaluate("document.getElementById('replay').click()");
        assert.equal(await phase(),'predict',file);
        await evaluate("document.querySelector('[data-choice=\"0\"]').click()");
        assert.equal(await phase(),'complete',file);
      }
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


