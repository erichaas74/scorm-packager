const fs=require('fs'),{spawn}=require('child_process'),path=require('path');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const profile=fs.mkdtempSync(path.resolve('tmp/ray-check-'));
 const chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless','--no-first-run','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:'ignore'});
 let ws;
 try {
  for(let i=0;i<100&&!fs.existsSync(path.join(profile,'DevToolsActivePort'));i++)await delay(100);
  const port=fs.readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').split('\n')[0];
  const targets=await(await fetch(`http://127.0.0.1:${port}/json`)).json();
  ws=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
  let id=0;const pending=new Map(),errors=[];
  ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)(m.result);pending.delete(m.id);}if(m.method==='Runtime.exceptionThrown')errors.push(m.params);};
  const send=(method,params={})=>new Promise(r=>{pending.set(++id,r);ws.send(JSON.stringify({id,method,params}));});
  const ev=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
  await send('Runtime.enable');
  await send('Page.navigate',{url:'file:///'+path.resolve('problem-walkthoughs/unit 5/ray-diagrams.html').replaceAll('\\','/')});await delay(500);
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  const results=[];
  for(const lens of ['convex','concave'])for(const pos of ['beyond2f','at2f','between','atf','insidef']){
   results.push(await ev(`(async()=>{selectLens('${lens}');selectPosition('${pos}');await runRayTracingSequence();return {lens:state.lensType,pos:state.posKey,summary:document.getElementById('result-summary').textContent,tip:Number(els.imgShaft.getAttribute('y2')),visible:els.imageGroup.style.opacity,selected:document.querySelectorAll('[aria-pressed="true"]').length,complete:els.status3.textContent};})()`));
  }
  for(const width of [320,520,760,920]){
   await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
   if(await ev('document.documentElement.scrollWidth > innerWidth'))throw Error('Overflow at '+width);
  }
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  if(!await ev('(async()=>{await runRayTracingSequence();return state.reduceMotion;})()'))throw Error('Reduced motion failed');
  for(const r of results){if(r.selected!==2||r.complete.indexOf('Complete')!==0)throw Error(JSON.stringify(r));if(r.visible==='1'&&(r.tip<0||r.tip>350))throw Error('Image clipped');}
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
  // Interrupt each stage, including the image reveal, through the actual buttons.
  for(const ms of [100,1600,3800,7200,9600]) {
   await ev("document.getElementById('btn-concave').click();document.getElementById('pos-insidef').click()");
   await delay(ms);
   const clean=await ev(`(()=>{document.querySelector('.replay-button').click();document.getElementById('pos-atf').click();document.getElementById('btn-convex').click();return state.timers.size===1 && getComputedStyle(els.imageGroup).opacity==='0' && getComputedStyle(els.infinityBadge).opacity==='0' && els.r2Inc.style.opacity==='0';})()`);
   if(!clean)throw Error('Restart failed at '+ms);
  }
  for(let i=0;i<50;i++)await ev(`document.getElementById('${i%2 ? 'btn-convex':'btn-concave'}').click();document.querySelector('.replay-button').click()`);
  await ev("document.getElementById('btn-convex').click();document.getElementById('pos-between').click()");
  await delay(10000);
  const final=await ev(`({timers:state.timers.size,complete:els.status3.textContent,image:els.imageGroup.style.opacity,infinity:els.infinityBadge.style.opacity,x:Number(els.imgShaft.getAttribute('x1')),y:Number(els.imgShaft.getAttribute('y2')),selected:document.querySelectorAll('[aria-pressed="true"]').length})`);
  if(final.timers!==0||final.complete!=='Complete'||final.image!=='1'||final.infinity!=='0'||final.x!==740||final.y!==320||final.selected!==2)throw Error(JSON.stringify(final));
  if(errors.length)throw Error(JSON.stringify(errors));
  console.log(JSON.stringify({passed:true,scenarios:results,widths:[320,520,760,920],reducedMotion:true,restartStress:true},null,2));
 } finally {if(ws)ws.close();chrome.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
