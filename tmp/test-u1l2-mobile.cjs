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
  await send('Emulation.setTouchEmulationEnabled',{enabled:true});
  for (const file of ['index.html','u1l2-city-blocks-buzz-assessment-template.html','u1l2-city-blocks-buzz-assessment-template-preview.html']) {
   for (const width of [320,390,768,1280]) {
    await send('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:true});
    await send('Page.navigate',{url:pathToFileURL(path.join(process.cwd(),'unit-ApplicationFiles/unit-1/lesson-2',file)).href});
    await delay(300);
    await evaluate("beginBtn.click(); loadLevel(0)");
    await delay(100);
    const layout=await evaluate('({width:innerWidth,scroll:document.documentElement.scrollWidth})');
    assert(layout.scroll<=width+1, file+' overflow '+JSON.stringify(layout));
    await evaluate("document.querySelector('[data-dir=E]').scrollIntoView({block:'center'})");
    const point=await evaluate("(()=>{const r=document.querySelector('[data-dir=E]').getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2}})()");
    await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});
    await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await delay(300);
    assert.equal(await evaluate('GameState.moves.length'),1,'touch moves exactly once');
    await evaluate('waitBtn.click()');
    assert.equal(await evaluate('GameState.getTimeMinutes()'),2);
    await evaluate('undoMove()');
    assert.equal(await evaluate('GameState.getTimeMinutes()'),1);
    // Find a valid route using the actual road graph, then undo during advance delay.
    await evaluate(`resetGame(); var queue=[{x:start.x,y:start.y,route:[]}], solution=null;
      while(queue.length){var q=queue.shift(); if(q.route.length===levels[0].distance){if(Math.abs(Math.hypot(q.x-start.x,q.y-start.y)-levels[0].displacement)<0.001){solution=q.route;break;}continue;}
      for(var d of ['N','S','E','W']){var x=q.x+(d==='E'?1:d==='W'?-1:0),y=q.y+(d==='S'?1:d==='N'?-1:0);if(x<0||y<0||x>=COLS||y>=ROWS)continue;if(isRoadMissing(d==='W'?x:q.x,d==='N'?y:q.y,d==='N'||d==='S'?'V':'H'))continue;queue.push({x,y,route:q.route.concat(d)});}}
      solution.forEach(move);`);
    assert.equal(await evaluate('GameState.levelJustCompleted'),true);
    await evaluate('undoMove()'); await delay(1150);
    assert.equal(await evaluate('GameState.currentLevelIndex'),0,'undo cancels level advance');
    await evaluate('move(solution[solution.length-1])'); await delay(1150);
    assert.equal(await evaluate('GameState.currentLevelIndex'),1,'success advances');
    assert.equal(errors.length,0,JSON.stringify(errors));
    console.log('PASS '+file+' '+width+'px: layout, touch, WAIT/Undo, canceled and successful advance');
   }
  }
  await send('Browser.close').catch(()=>{});
 }finally{if(ws)ws.close();chrome.kill();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
