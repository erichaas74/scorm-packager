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
  await send('Page.navigate',{url:'file:///'+path.resolve('problem-walkthoughs/unit 5/Anatomy of Sound.html').replaceAll('\\','/')});await delay(500);
  for(const width of [840,390]) {
    await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
    await delay(100);
    for(let i=0;i<3;i++) {
      const result=await ev(`(() => {
        const scene=document.getElementById('scene');
        if(scene.querySelectorAll('[data-wave]').length!==1) throw Error('Reference must show only A');
        document.getElementById('add').click();
        if(scene.querySelectorAll('[data-wave]').length!==2) throw Error('Comparison must show two waves');
        if([...document.querySelectorAll('[data-choice]')].some(b=>b.hidden)) throw Error('Missing choices');
        document.querySelector('[data-choice="${i}"]').click();
        if(!scene.textContent.includes('Correct!')) throw Error('Wrong feedback');
        const overflow=[...scene.querySelectorAll('text')].filter(t=>{const b=t.getBBox();return b.x<0||b.x+b.width>scene.viewBox.baseVal.width;});
        if(overflow.length) throw Error('Text overflow: '+overflow.map(t=>t.textContent));
        document.getElementById('next').click();
        return 'passed';
      })()`);
      console.log(width,i,result);
    }
  }
  if(errors.length) throw Error(JSON.stringify(errors));
 } finally {if(ws)ws.close();chrome.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
