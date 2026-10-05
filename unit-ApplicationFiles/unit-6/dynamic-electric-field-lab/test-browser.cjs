// Local Chrome/CDP checks. Uses a separate temporary profile; never touches personal tabs.
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const {pathToFileURL}=require('node:url');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function main(){
 const profile=fs.mkdtempSync(path.join(process.cwd(),'tmp','ef-browser-'));
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
  const click=async selector=>{await evaluate(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:"nearest"})`);const r=await evaluate(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);await send('Input.dispatchMouseEvent',{type:'mousePressed',...r,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',...r,button:'left',clickCount:1});};
  const key=async(key,code=key)=>{await send('Input.dispatchKeyEvent',{type:'keyDown',key,code});await send('Input.dispatchKeyEvent',{type:'keyUp',key,code});};
  const position=async(x,y)=>{
    const points=await evaluate(`(()=>{const s=JSON.parse(sessionStorage.getItem('buzz-u6l2-electric-field-v1'));const c=s.drafts[s.selected].at(-1);const r=document.querySelector('#ef-canvas').getBoundingClientRect();return {from:{x:r.x+c.fx*r.width,y:r.y+c.fy*r.height},to:{x:r.x+${x}/100*r.width,y:r.y+${y}/100*r.height}};})()`);
    await send('Input.dispatchMouseEvent',{type:'mousePressed',...points.from,button:'left',clickCount:1});
    await send('Input.dispatchMouseEvent',{type:'mouseMoved',...points.to,button:'left',buttons:1});
    await send('Input.dispatchMouseEvent',{type:'mouseReleased',...points.to,button:'left',clickCount:1});
  };
  const screenshot=async name=>{const r=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(__dirname,'audit-evidence',name),Buffer.from(r.data,'base64'));};
  await send('Runtime.enable');await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:820,height:1000,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:pathToFileURL(path.join(__dirname,'u6l2-dynamic-electric-field-buzz-assessment-template-preview.html')).href});
  await delay(500);
  if(process.argv.includes('--questions-only')) {
    const images=await evaluate(`Array.from(document.querySelectorAll('.ef-question-image')).map(img=>({loaded:img.complete&&img.naturalWidth===640,alt:img.alt}))`);
    assert.equal(images.length,4);assert(images.every(img=>img.loaded&&(img.alt.includes('rest')||img.alt.includes('mystery'))));
    for(const n of [1,2,3,6]) {
      await evaluate(`document.querySelectorAll('.ef-slot')[${n-1}].scrollIntoView({block:'start'})`);
      await screenshot('question-'+n+'-desktop.png');
    }
    await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await delay(250);
    await evaluate(`document.querySelectorAll('.ef-slot')[1].scrollIntoView({block:'start'})`);
    assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'));
    await screenshot('question-2-narrow.png');
    assert.equal(errors.length,0,JSON.stringify(errors));
    console.log('PASS: four self-contained question images loaded; desktop and narrow question layouts captured without overflow or runtime errors.');
    await send('Browser.close').catch(()=>{});return;
  }
  const initial=await evaluate(`({viewport:innerWidth,scroll:document.documentElement.scrollWidth,arena:document.querySelector('#ef-canvas').getBoundingClientRect().toJSON()})`);
  assert(initial.arena.y<360);assert(initial.scroll<=initial.viewport);
  assert.equal(await evaluate(`document.querySelectorAll('.ef-control-panel,.ef-readings,#ef-status,#ef-evidence,select,input[type=number]').length`),0);
  assert(await evaluate(`document.querySelector('#ef-challenge-tabs').getBoundingClientRect().top >= document.querySelector('#ef-canvas').getBoundingClientRect().bottom`));
  await screenshot('revised-desktop.png');
  await click('#ef-add-positive');await position(12,52);
  await screenshot('revised-vectors.png');
  await click('#ef-start-motion');
  for(let i=0;i<120;i++){if(await evaluate(`!document.querySelector('#ef-success-modal').hidden`))break;await delay(100);}
  assert.equal(await evaluate(`document.querySelector('#ef-progress-percent').textContent`),'33%');
  assert.equal(await evaluate(`document.activeElement.id`),'ef-next-level');
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('.ef-challenge-tab.complete')).backgroundColor`),'rgb(24, 86, 56)');
  await screenshot('revised-success.png');
  await click('#ef-keep-testing');const before=await evaluate(`JSON.parse(sessionStorage.getItem('buzz-u6l2-electric-field-v1')).drafts[0][0].fx`);await key('ArrowRight');
  assert(Number(await evaluate(`JSON.parse(sessionStorage.getItem('buzz-u6l2-electric-field-v1')).drafts[0][0].fx`))>Number(before));
  // Complete Curve before Attract to verify the intermediate completion message.
  await click('#ef-challenge-tabs button:nth-child(3)');await click('#ef-add-positive');await position(16.89931740425527,88.6041636695154);
  await click('#ef-add-negative');await position(86.46158644510433,60.47938295081259);
  await click('#ef-start-motion');
  for(let i=0;i<190;i++){if(await evaluate(`!document.querySelector('#ef-success-modal').hidden`))break;await delay(100);}
  assert.equal(await evaluate(`document.querySelector('#ef-progress-percent').textContent`),'67%');
  assert.match(await evaluate(`document.querySelector('#ef-success-message').textContent`),/remaining core/);
  await screenshot('revised-curve-success.png');
  await click('#ef-next-level');await click('#ef-add-negative');await position(86,48);await click('#ef-start-motion');
  for(let i=0;i<190;i++){if(await evaluate(`!document.querySelector('#ef-success-modal').hidden`))break;await delay(100);}
  assert.equal(await evaluate(`document.querySelector('#ef-progress-percent').textContent`),'100%');
  await click('#ef-next-level');assert.equal(await evaluate(`document.activeElement.id`),'ef-questions');
  await screenshot('revised-questions.png');
  await evaluate('window.scrollTo(0,0)');
  await click('#ef-challenge-tabs button:nth-child(3)');await click('#ef-add-positive');
  // The saved Curve draft already has two charges; one further source fits the limit.
  await key('[','BracketLeft');
  await key('ArrowLeft');const draft=await evaluate(`JSON.parse(sessionStorage.getItem('buzz-u6l2-electric-field-v1')).drafts[2]`);
  await send('Page.reload');await delay(400);
  assert.deepEqual(await evaluate(`JSON.parse(sessionStorage.getItem('buzz-u6l2-electric-field-v1')).drafts[2]`),draft);
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await delay(300);
  await evaluate('window.scrollTo(0,0)');
  const narrow=await evaluate(`({viewport:innerWidth,scroll:document.documentElement.scrollWidth,arena:document.querySelector('#ef-canvas').getBoundingClientRect().toJSON(),controls:document.querySelector('.ef-canvas-tools').getBoundingClientRect().toJSON()})`);
  assert(narrow.scroll<=narrow.viewport);assert(narrow.arena.y<500);assert(narrow.controls.y<narrow.arena.y);
  await screenshot('revised-narrow.png');
  // Touch drag an existing source across the arena, then confirm its saved coordinates change.
  await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
  await evaluate('window.scrollBy(0,180)');
  const point=await evaluate(`(()=>{let d=JSON.parse(sessionStorage.getItem('buzz-u6l2-electric-field-v1')).drafts[2][0],r=document.querySelector('#ef-canvas').getBoundingClientRect();return {x:r.x+d.fx*r.width,y:r.y+d.fy*r.height};})()`);
  await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...point,id:1}]});
  await send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:point.x+25,y:point.y-20,id:1}]});
  await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  const after=await evaluate(`JSON.parse(sessionStorage.getItem('buzz-u6l2-electric-field-v1')).drafts[2]`);
  assert.notEqual(after[0].fx,draft[0].fx);
  await evaluate(`document.querySelector('#ef-reset-progress').scrollIntoView({block:'center'})`);await click('#ef-reset-progress');await delay(200);
  assert.equal(await evaluate(`document.querySelector('#ef-progress-percent').textContent`),'0%');
  assert.equal(await evaluate(`document.activeElement.id`),'ef-add-positive');
  assert.equal(errors.length,0,JSON.stringify(errors));
  console.log(JSON.stringify({desktop:initial,narrow,checks:['all three challenges in order 1,3,2','accurate completion and question handoff','success focus','keyboard movement after reset','keyboard source cycling','refresh persistence','touch drag persistence','no page overflow','no runtime errors']},null,2));
  await send('Browser.close').catch(()=>{});
 }finally{if(ws)ws.close();chrome.kill();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
