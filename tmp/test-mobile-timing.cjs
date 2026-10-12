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


  await send('Runtime.enable'); await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:3,mobile:true});
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__clock=1000;window.__raf=new Map();window.__rid=0;performance.now=()=>window.__clock;window.requestAnimationFrame=cb=>{__raf.set(++__rid,cb);return __rid};window.cancelAnimationFrame=id=>__raf.delete(id);window.__advance=(seconds,fps)=>{for(let i=0;i<Math.round(seconds*fps);i++){__clock+=1000/fps;const callbacks=[...__raf.values()];__raf.clear();callbacks.forEach(cb=>cb(__clock));}};`});
  const base='unit-ApplicationFiles/';
  const results=[];
  for(const fps of [15,60,120]){
   for(const suffix of ['', '-preview']) {
    const file=base+'unit-1/lesson-5/u1l5-skydiver-buzz-assessment-template'+suffix+'.html';
    errors.length=0;
    await send('Page.navigate',{url:pathToFileURL(path.join(process.cwd(),file)).href});await delay(350);
    await evaluate('__advance(1,60);startChallengeBtn.click();__advance(2,'+fps+')');
    const state=await evaluate("({time:readTime.textContent,speed:readSpeed.textContent,altitude:readAltitude.textContent})");
    assert(Math.abs(parseFloat(state.time)-4)<0.04,JSON.stringify({fps,state}));
    results.push({fps,file,state});assert.equal(errors.length,0,JSON.stringify(errors));
    console.log('PASS Skydiver '+suffix+' '+fps+'fps: '+JSON.stringify(state));
   }
   for(const name of ['usga-golfclub-ct-test.html','u3l2-golf-club-ct-buzz-assessment-template.html','u3l2-golf-club-ct-buzz-assessment-template-preview.html']){
    errors.length=0;
    await send('Page.navigate',{url:pathToFileURL(path.join(process.cwd(),base+'unit-3/lesson-2',name)).href});await delay(350);
    await evaluate('dropBtn.click();__advance(3,'+fps+')');
    const result=await evaluate('({phase:state.phase,ct:state.ctCalculated,peak:state.peakForce})');
    assert.equal(result.phase,'complete');assert(result.ct>0);results.push({fps,file:name,state:result});
    assert.equal(errors.length,0,JSON.stringify(errors));console.log('PASS Golf '+name+' '+fps+'fps: '+JSON.stringify(result));
   }
  }
  for(const file of new Set(results.map(r=>r.file))){const runs=results.filter(r=>r.file===file);assert.deepEqual(runs[0].state,runs[1].state,file+' same results at 15/60fps');assert.deepEqual(runs[1].state,runs[2].state,file+' same results at 60/120fps');}
  await send('Browser.close').catch(()=>{});
 }finally{if(ws)ws.close();chrome.kill();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
