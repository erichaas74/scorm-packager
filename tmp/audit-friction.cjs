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
  const files=[];
  function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(e.name.endsWith('.html')&&!e.name.includes('-source')){if(e.name!=='parachute-challenge.html')files.push(p)};}}
  [1,2,3].forEach(u=>walk('unit-ApplicationFiles/unit-'+u));
  const reports=[];
  await send('Emulation.setTouchEmulationEnabled',{enabled:true});
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:3,mobile:true});
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.auditFrames=0;window.auditPaints=0;const clear=CanvasRenderingContext2D.prototype.clearRect;CanvasRenderingContext2D.prototype.clearRect=function(...a){window.auditPaints++;return clear.apply(this,a)};const raf=window.requestAnimationFrame;window.requestAnimationFrame=function(cb){return raf.call(window,t=>{window.auditFrames++;cb(t)})};`});
  for(const width of [320,390]) {
  await send('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:3,mobile:true});
  for(const file of files.filter(f=>f.includes('lesson-3')&&f.includes('unit-3'))){
   errors.length=0;
   await send('Page.navigate',{url:pathToFileURL(path.join(process.cwd(),file)).href});await delay(100);
   await evaluate(`(()=>{for(const id of ['beginBtn','start-btn','startBtn']){const b=document.getElementById(id);if(b&&b.getBoundingClientRect().width)b.click();}})()`);
   await delay(100);const start=await evaluate('window.auditPaints');await delay(150);
   const info=await evaluate(`(()=>{const w=${width};return {width:innerWidth,scroll:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,frames:window.auditFrames,paints:window.auditPaints,
     overflow:[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.right>w+2||r.left < -2)&&getComputedStyle(e).position!=='absolute'}).slice(-25).map(e=>({tag:e.tagName,id:e.id,cls:e.className,left:Math.round(e.getBoundingClientRect().left),width:Math.round(e.getBoundingClientRect().width)})),
     buttons:[...document.querySelectorAll('button')].filter(e=>e.getBoundingClientRect().width).slice(0,25).map(e=>({id:e.id,text:e.textContent.trim().slice(0,45)})),
     canvases:[...document.querySelectorAll('canvas')].map(e=>({id:e.id,w:e.width,h:e.height,cssW:Math.round(e.getBoundingClientRect().width)}))};})()`);
   reports.push({file,viewport:width,...info,idlePaints:info.paints-start,errors:[...errors]});
   if(info.scroll>width+1||errors.length)console.log(width+'px '+file+': overflow='+info.scroll+' errors='+errors.length);
  }
  }
  fs.writeFileSync('tmp/friction-audit.json',JSON.stringify(reports,null,2));
  console.log('Audited '+reports.length+' page/viewport combinations');
  await send('Browser.close').catch(()=>{});
 }finally{if(ws)ws.close();chrome.kill();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
