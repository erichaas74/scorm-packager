// Local Chrome/CDP checks. Uses a separate temporary profile; never touches personal tabs.
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const {pathToFileURL}=require('node:url');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function main(){
 const profile=fs.mkdtempSync(path.join(process.cwd(),'tmp','em-ratio-browser-'));
 const chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:'ignore'});
 let ws;
 try {
  const portFile=path.join(profile,'DevToolsActivePort');
  for(let i=0;i<100&&!fs.existsSync(portFile);i++)await delay(100);
  assert(fs.existsSync(portFile),'Chrome debugging endpoint did not start');
  const port=fs.readFileSync(portFile,'utf8').split('\n')[0];
  const targets=await (await fetch('http://127.0.0.1:'+port+'/json')).json();
  ws=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
  let id=0;const pending=new Map(),errors=[];
  ws.onmessage=e=>{const m=JSON.parse(e.data); if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p.reject(new Error(JSON.stringify(m.error)));else p.resolve(m.result);} if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails); if(m.method==='Page.javascriptDialogOpening')send('Page.handleJavaScriptDialog',{accept:true});};
  const send=(method,params={})=>new Promise((resolve,reject)=>{pending.set(++id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
  const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
  const click=async selector=>{await evaluate(`document.documentElement.style.scrollBehavior='auto';document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:"nearest"})`);await delay(400);const r=await evaluate(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);await send('Input.dispatchMouseEvent',{type:'mousePressed',...r,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',...r,button:'left',clickCount:1});};
  const key=async(key,code=key)=>{await send('Input.dispatchKeyEvent',{type:'keyDown',key,code});await send('Input.dispatchKeyEvent',{type:'keyUp',key,code});};
  const folder=path.join(process.cwd(),'unit-ApplicationFiles/unit-6/electromagnet-lab');
  const source=fs.readFileSync(path.join(folder,'electromagnet_lab.html'),'utf8');
  assert.equal(source,fs.readFileSync(path.join(folder,'u6l4-electromagnet-design-buzz-assessment-template.html'),'utf8'));
  assert.equal((source.match(/<a:question>/g)||[]).length,10);
  const vm=require('node:vm');const model={};vm.createContext(model);
  vm.runInContext(source.slice(source.indexOf('  var BUDGET_LIMIT'),source.indexOf('  var IDLE_Y'))+source.slice(source.indexOf('  function compute('),source.indexOf('  var TRIALS')),model);
  let maxRatio=0;
  for(let turns=10;turns<=100;turns+=5)for(let diameter=5;diameter<=25;diameter++)for(let batteries=1;batteries<=4;batteries++)for(const core of ['air','iron'])for(const config of ['series','parallel']){
    const r=model.compute({turns,diameter,batteries,core,config});if(!r.outOfWire&&!r.overBudget)maxRatio=Math.max(maxRatio,r.strength/Number(r.totalCost.toFixed(2)));
  }
  assert.equal(maxRatio.toFixed(2),'6.38');
  const state=()=>evaluate(`JSON.parse(sessionStorage.getItem('buzz-u6l4-electromagnet-ratio-v2'))`);
  const completed=()=>evaluate(`document.querySelectorAll('.em-trial-tab.complete').length`);
  const run=async()=>{await click('#em-run-test');await delay(2850);};
  const answer=async(ratio,gain)=>{await evaluate(`document.querySelector('#em-ratio-answer').value=${JSON.stringify(String(ratio))};document.querySelector('#em-improvement-answer').value=${JSON.stringify(String(gain??''))}`);await click('#em-check-calculation');};
  const checkPending=async()=>{const s=await state();const r=s.pending.strength/Number(s.pending.totalCost.toFixed(2));await answer(r.toFixed(2),((r/(49/14.14)-1)*100).toFixed(1));};
  const setDesign=async(turns,diameter)=>{await evaluate(`document.querySelector('#em-turns').value=${turns};document.querySelector('#em-turns').dispatchEvent(new Event('input'));document.querySelector('#em-diameter').value=${diameter};document.querySelector('#em-diameter').dispatchEvent(new Event('input'));document.querySelector('#em-core-iron').click();document.querySelector('[data-cells="4"]').click();document.querySelector('#em-config-series').click();`);};
  await send('Runtime.enable');await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:1100,height:1000,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:pathToFileURL(path.join(folder,'u6l4-electromagnet-design-buzz-assessment-template-preview.html')).href});await delay(400);
  assert(await evaluate(`!!document.querySelector('#em-stage #em-ratio-answer')`));
  await evaluate(`document.querySelectorAll('.em-trial-tab')[5].click()`);
  assert(await evaluate(`document.querySelector('#em-run-test').disabled`),'challenge locked before five calculations');
  const fixed=['3.47','3.13','0.56','4.69','2.98'];
  for(let i=0;i<5;i++){
    await evaluate(`document.querySelectorAll('.em-trial-tab')[${i}].click()`);
    await run();assert.equal(await completed(),i,'test alone must not complete');
    assert.equal(await evaluate(`document.activeElement.id`),'em-ratio-answer');
    await answer('');assert.equal(await completed(),i,'blank answer');
    await answer('99');assert.equal(await completed(),i,'wrong ratio');
    await answer(fixed[i]);assert.equal(await completed(),i+1);
    assert.equal(await evaluate(`document.activeElement.id`),'em-next-trial');
    await key('Tab');assert.equal(await evaluate(`document.activeElement.id`),'em-keep-testing');
    await click('#em-next-trial');
  }
  // First: a high-strength design with relatively poor value.
  await setDesign(20,25);await run();await answer((181/38.35).toFixed(2),'0');
  assert.equal((await state()).candidates.length,0,'wrong percentage must not qualify');
  await checkPending();assert.equal((await state()).candidates.length,1);assert.equal(await completed(),5);
  await checkPending();assert.equal((await state()).candidates.length,1,'repeat does not count as different design');
  // Second: highest raw strength is still not the highest score.
  await setDesign(60,13);await run();await checkPending();assert.equal((await state()).candidates.length,2);
  await send('Page.reload');await delay(300);assert.equal((await state()).candidates.length,2);
  // Third: true maximum ratio. Run alone and stale input must not qualify.
  await setDesign(100,5);await run();assert.equal(await completed(),5);
  await evaluate(`document.querySelector('#em-turns').value=95;document.querySelector('#em-turns').dispatchEvent(new Event('input'));`);
  assert(await evaluate(`document.querySelector('#em-check-calculation').disabled`));
  await setDesign(100,5);await checkPending();assert.equal(await completed(),6);
  const best=(await state()).records[5];assert.equal(best.strength,181);assert.equal(best.turns,100);assert.equal(best.totalCost.toFixed(2),'28.35');
  await click('#em-keep-testing');
  // Lower-value repeats cannot replace the winner.
  await setDesign(60,13);await run();await checkPending();assert.equal((await state()).records[5].turns,100);await click('#em-keep-testing');
  await send('Page.reload');await delay(300);assert.equal(await completed(),6);
  for(const width of [1100,820,650,390]){
    await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});await delay(100);
    assert(await evaluate(`document.documentElement.scrollWidth<=innerWidth`),'overflow at '+width);
    if(width===1100||width===390){await evaluate(`document.querySelector('#em-ratio-answer').scrollIntoView({block:'center',behavior:'instant'})`);const r=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(process.cwd(),'tmp','electromagnet-ratio-'+width+'.png'),Buffer.from(r.data,'base64'));}
  }
  await click('#em-reset-progress');await delay(200);assert.equal(await completed(),0);assert.equal((await state()).candidates.length,0);
  // Required setup mismatch and resource limits still block completion.
  await evaluate(`document.querySelector('#em-core-air').click()`);await run();assert.equal((await state()).pending,null);
  await evaluate(`document.querySelector('#em-turns').value=100;document.querySelector('#em-turns').dispatchEvent(new Event('input'));`);
  assert(await evaluate(`document.querySelector('#em-run-test').disabled`));
  assert.equal(errors.length,0,JSON.stringify(errors));
  console.log('PASS: maximum-ratio enumeration; five checked calculations; challenge prerequisites; blank/wrong/stale answers; percentage calculation; distinct designs; best ratio retention; reload/reset; focus handling; resource limits; responsive widths; no runtime errors.');
  await send('Browser.close').catch(()=>{});
 }finally{if(ws)ws.close();chrome.kill();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
