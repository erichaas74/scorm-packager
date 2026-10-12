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
  await send('Page.addScriptToEvaluateOnNewDocument', {source: "window.AudioContext = undefined; window.webkitAudioContext = undefined;"});
  for (const suffix of ['', '-preview']) {
    const file='u1l4-reaction-time-buzz-assessment-template'+suffix+'.html';
    await send('Page.navigate',{url:pathToFileURL(path.join(process.cwd(),'unit-ApplicationFiles/unit-1/lesson-4',file)).href});
    await delay(500);
    assert.equal(errors.length,0,JSON.stringify(errors));
    for (const [id,cue] of [['r','It dropped'],['d','GREEN'],['s','BANG']]) {
      await evaluate(`document.querySelector('#${id}-overlay').click()`);
      let ready=false;
      for(let i=0;i<100;i++) {
        ready=await evaluate(`document.querySelector('#${id}-status').textContent.includes('${cue}')`);
        if(ready)break;
        await delay(70);
      }
      assert(ready, file+' '+id+' cue');
      await delay(150);
      await evaluate(`document.querySelector('#${id}-stage').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}))`);
      let done=false;
      for(let i=0;i<90;i++) {
        done=await evaluate(`!document.querySelector('#${id}-overlay').classList.contains('hidden')`);
        if(done)break;
        await delay(100);
      }
      assert(done,file+' '+id+' completes');
      const status=await evaluate(`document.querySelector('#${id}-status').textContent`);
      assert(/Caught|calculate|wins|win/.test(status),status);
      await evaluate(`document.querySelector('#${id}-stage').scrollIntoView({block:'center'})`);
      const shot=await send('Page.captureScreenshot',{format:'png'});
      fs.writeFileSync(path.join(process.cwd(),'tmp','u1l4-embedded'+suffix+'-'+id+'.png'),Buffer.from(shot.data,'base64'));
    }
    assert.equal(errors.length,0,JSON.stringify(errors));
    console.log('PASS: '+file+' ? all three trials, no runtime errors');
  }
  await send('Browser.close').catch(()=>{});
 }finally{if(ws)ws.close();chrome.kill();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
