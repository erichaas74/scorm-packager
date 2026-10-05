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
  const click=async selector=>{await evaluate(`document.documentElement.style.scrollBehavior='auto';document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:"nearest"})`);await delay(400);const r=await evaluate(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);await send('Input.dispatchMouseEvent',{type:'mousePressed',...r,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',...r,button:'left',clickCount:1});};
  const key=async(key,code=key)=>{await send('Input.dispatchKeyEvent',{type:'keyDown',key,code});await send('Input.dispatchKeyEvent',{type:'keyUp',key,code});};
  const position=async(x,y)=>{
    const points=await evaluate(`(()=>{const s=JSON.parse(sessionStorage.getItem('buzz-u6l2-electric-field-v1'));const c=s.drafts[s.selected].at(-1);const r=document.querySelector('#ef-canvas').getBoundingClientRect();return {from:{x:r.x+c.fx*r.width,y:r.y+c.fy*r.height},to:{x:r.x+${x}/100*r.width,y:r.y+${y}/100*r.height}};})()`);
    await send('Input.dispatchMouseEvent',{type:'mousePressed',...points.from,button:'left',clickCount:1});
    await send('Input.dispatchMouseEvent',{type:'mouseMoved',...points.to,button:'left',buttons:1});
    await send('Input.dispatchMouseEvent',{type:'mouseReleased',...points.to,button:'left',clickCount:1});
  };
  const screenshot=async name=>{const r=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(__dirname,'audit-evidence',name),Buffer.from(r.data,'base64'));};

  await send('Runtime.enable');await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:1100,height:1000,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:pathToFileURL(path.join(process.cwd(),'unit-ApplicationFiles/unit-6/electromagnet-lab/electromagnet_lab.html')).href});await delay(400);
  assert(await evaluate(`!!document.querySelector('#em-stage #em-turns')`));
  assert.equal(await evaluate(`document.querySelector('#em-evidence')`),null);
  for(let i=0;i<6;i++){
    await evaluate(`document.querySelectorAll('.em-trial-tab')[${i}].click()`);
    if(i<5)await click('#em-load-setup');
    else await evaluate(`document.querySelector('[data-cells="4"]').click();document.querySelector('#em-config-series').click();document.querySelector('#em-diameter').value=25;document.querySelector('#em-diameter').dispatchEvent(new Event('input'));`);
    await click('#em-run-test');await delay(2900);
    console.log(await evaluate(`({status:document.querySelector('#em-status').textContent,errors:${JSON.stringify(errors)}})`)); const debug=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('tmp/electromagnet-debug.png',Buffer.from(debug.data,'base64')); assert.equal(await evaluate(`document.querySelectorAll('.em-trial-tab.complete').length`),i+1);
    await click('#em-keep-testing');
  }
  const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('tmp/electromagnet-desktop.png',Buffer.from(shot.data,'base64'));
  await send('Page.reload');await delay(300);
  assert.equal(await evaluate(`document.querySelectorAll('.em-trial-tab.complete').length`),6);
  for(const width of [820,650,390]){
    await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});await delay(100);
    assert(await evaluate(`document.documentElement.scrollWidth<=innerWidth`),'overflow at '+width);
  }
  const mobile=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('tmp/electromagnet-mobile.png',Buffer.from(mobile.data,'base64'));
  await click('#em-reset-progress');await delay(150);
  assert.equal(await evaluate(`document.querySelectorAll('.em-trial-tab.complete').length`),0);
  assert.equal(errors.length,0,JSON.stringify(errors));
  console.log('PASS: six trials, green completion tabs, reload persistence, reset, in-canvas controls, responsive widths, no runtime errors.');
  await send('Browser.close').catch(()=>{});
 }finally{if(ws)ws.close();chrome.kill();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});

