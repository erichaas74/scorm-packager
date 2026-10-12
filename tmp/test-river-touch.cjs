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
  await send('Emulation.setTouchEmulationEnabled',{enabled:true});
  const touch=async (point,cancel=false)=>{
   await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});
   await send('Input.dispatchTouchEvent',{type:cancel?'touchCancel':'touchEnd',touchPoints:[]});
  };
  for(const width of [320,390,844]){
   errors.length=0;
   await send('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:3,mobile:true});
   await send('Page.navigate',{url:pathToFileURL(path.join(process.cwd(),'unit-ApplicationFiles/unit-2/lesson-u2l4/Riverboat-crossing.html')).href});await delay(350);
   await evaluate('__advance(1,60)');
   const bounds=await evaluate('[btnPlay,btnReset,btnHint,btnData].map(b=>({x:b.x,right:b.x+b.w}))');
   assert(bounds.every(b=>b.x>=0&&b.right<=width),JSON.stringify(bounds));
   const p=await evaluate('({x:btnPlay.x+btnPlay.w/2,y:btnPlay.y+btnPlay.h/2})');
   // No animation frame runs between touchstart and touchend.
   await touch(p);assert.equal(await evaluate('isPlaying'),true,'quick tap starts without waiting for a frame');
   await touch(p);assert.equal(await evaluate('isPlaying'),false,'second tap pauses');
   await touch(p,true);assert.equal(await evaluate('isPlaying'),false,'canceled touch does not activate');
   assert.equal(await evaluate('input.isDown'),false,'cancel releases drag');
   await touch(await evaluate('({x:btnData.x+btnData.w/2,y:btnData.y+btnData.h/2})'));
   assert.equal(await evaluate('showTelemetry'),true,'rightmost button reachable');
   await evaluate('__advance(0.1,60)');
   if(width===390){const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('tmp/mobile-river.png',Buffer.from(shot.data,'base64'));}
   assert.equal(errors.length,0,JSON.stringify(errors));console.log('PASS River Rescue quick tap, cancel, bounds '+width);
  }
  for(const fps of [15,60,120]){
   await send('Page.navigate',{url:pathToFileURL(path.join(process.cwd(),'unit-ApplicationFiles/unit-2/lesson-u2l5/inertia-tension-demo.html')).href});await delay(350);
   await evaluate('startPull("slow");__advance(5,'+fps+')');
   const result=await evaluate('({broken:state.topBroken,done:state.animationFrame===null,y:state.massY})');
   assert.deepEqual(result,{broken:true,done:true,y:220});console.log('PASS Inertia completes at '+fps+'fps');
  }
  await send('Browser.close').catch(()=>{});
 }finally{if(ws)ws.close();chrome.kill();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
