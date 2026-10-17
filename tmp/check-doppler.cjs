const fs=require('fs'),{spawn}=require('child_process'),path=require('path');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const profile=fs.mkdtempSync(path.resolve('tmp/ray-check-'));
 const chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless','--autoplay-policy=no-user-gesture-required','--no-first-run','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:'ignore'});
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
  await send('Page.navigate',{url:'file:///'+path.resolve('unit-ApplicationFiles/unit-5/doppler-sound/index.html').replaceAll('\\','/')});await delay(600);
  for(const width of [1100,390]) {
    await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
    console.log(await ev(`(async()=>{
      const assert=(v,m)=>{if(!v)throw Error(m)};
      document.getElementById('restart').click();
      for(const [mode,answer,hz] of [['toward','higher',658],['away','lower',552],['passenger','same',600]]){
        document.querySelector('[data-mode='+mode+']').click();
        document.querySelector('[data-answer='+(answer==='higher'?'lower':'higher')+']').click();
        assert(document.getElementById('feedback').textContent.includes('Not quite'),'wrong feedback');
        document.querySelector('[data-answer='+answer+']').click();
        assert(document.getElementById('feedback').textContent.includes('Correct'),'correct feedback');
        assert(document.getElementById('readout').textContent.includes(hz+' Hz'),'frequency');
      }
      assert(document.getElementById('progress').textContent.includes('3 / 3'),'completion');
      await document.getElementById('play').onclick();
      assert(running,'playing');assert(context.state==='running','audio');await new Promise(r=>setTimeout(r,100));assert(oscillator.frequency.value===600,'passenger sound');
      document.getElementById('reset').click();assert(!running && elapsed===0,'reset');
      document.querySelector('[data-mode=toward]').click();
      const slider=document.getElementById('speed');slider.value='50';slider.oninput();assert(Math.round(frequency())===702,'speed change');slider.value='30';slider.oninput();
      assert(document.documentElement.scrollWidth<=innerWidth,'mobile overflow');
      document.getElementById('restart').click();assert(mastered.size===0,'restart');
      return 'Passed scenarios, feedback, frequencies, audio, speed, reset, layout at '+innerWidth;
    })()`));
  }
  if(errors.length) throw Error(JSON.stringify(errors));
 } finally {if(ws)ws.close();chrome.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});



