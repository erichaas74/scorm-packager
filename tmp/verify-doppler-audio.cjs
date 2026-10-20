const fs=require('fs'),{spawn}=require('child_process'),path=require('path');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const profile=fs.mkdtempSync(path.resolve('tmp/doppler-browser-'));
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
  await send('Page.enable');
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.completedMessages=0;window.tones=[];addEventListener('message',e=>{if(e.data?.type==='complete')window.completedMessages++});window.sweeps=[];const original=AudioParam.prototype.setValueCurveAtTime;AudioParam.prototype.setValueCurveAtTime=function(v,t,d){window.sweeps.push({min:Math.min(...v),max:Math.max(...v),duration:d});return original.call(this,v,t,d)};`});
  const check=async expression=>{if(!await ev(expression))throw Error('Failed: '+expression);};
  const screenshot=async name=>{const r=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('tmp/doppler-'+name+'.png',Buffer.from(r.data,'base64'));};
  const size=async width=>{await send('Emulation.setDeviceMetricsOverride',{width,height:700,deviceScaleFactor:1,mobile:false});await delay(80);};
  const layout=async()=>{return await ev(`(()=>{const svg=document.querySelector('svg'),box=svg.getBoundingClientRect(),buttons=document.querySelector('.choices').getBoundingClientRect();const clipped=[...svg.querySelectorAll('text')].filter(t=>{const b=t.getBoundingClientRect();return b.left<box.left-1||b.right>box.right+1||b.top<box.top-1||b.bottom>box.bottom+1});return {overflow:document.documentElement.scrollWidth>innerWidth,gap:buttons.top-box.bottom,clipped:clipped.map(t=>t.textContent),height:document.querySelector('main').getBoundingClientRect().height};})()`);};
  async function navigate(file){await send('Page.navigate',{url:'file:///'+path.resolve(file).replaceAll('\\','/')});await delay(150);}



 const source=fs.readFileSync('problem-walkthoughs/unit 5/doppler-sound.html','utf8');
 if(source!==fs.readFileSync('tmp/doppler-audio-extracted/index.html','utf8')||source!==fs.readFileSync('unit-ApplicationFiles/unit-5/doppler-sound/index.html','utf8'))throw Error('Copies differ');
 await size(900);await navigate('tmp/doppler-audio-extracted/index.html');
 await screenshot('audio-reference');await delay(2500);await screenshot('audio-question');
 for(const [i,width,choice] of [[0,900,'higher'],[1,390,'higher'],[2,320,'same']]){
  await size(width);
  await ev(`document.querySelector('[data-answer=${choice}]').click()`);await delay(100);
  await check(`document.querySelector('#hear').textContent==='Stop sound: At rest'`);
  const frozen=await ev(`document.querySelector('#ambulance').getAttribute('transform')`);
  await check(`document.querySelector('#scene').dataset.playback==='stationary' && document.querySelector('#scene').textContent.includes('Ambulance at rest') && document.querySelector('#scene').textContent.includes('You: 600 Hz')`);
  await screenshot('audio-feedback-'+width);
  const l=await layout();if(l.clipped.length||l.overflow)throw Error(JSON.stringify(l));
  await delay(1800);
  if(frozen!==await ev(`document.querySelector('#ambulance').getAttribute('transform')`))throw Error('Stationary sound has moving ambulance');
  await delay(1000);
  await check(`document.querySelector('#scene').dataset.phase==='evidence' && document.querySelector('#scene').dataset.case==='${i}' && document.querySelector('#hear').textContent==='Stop sound: You hear'`);
  if(frozen===await ev(`document.querySelector('#ambulance').getAttribute('transform')`))throw Error('Moving sound has stationary ambulance');
  await check(`document.querySelector('#scene').dataset.playback==='moving' && /CORRECT|NOT QUITE/.test(document.querySelector('#scene').textContent)`);
  await screenshot('audio-moving-'+width);
  await delay(2000);await check(`document.querySelector('#scene').dataset.phase==='evidence'`);
  await delay(700);await check(`document.querySelector('#scene').dataset.case==='${(i+1)%3}'`);
  await delay(2400);
 }
 await check(`completedMessages===1 && sweeps.length===6 && sweeps.every(s=>s.duration===2.4) && Math.abs(sweeps[0].min-450)<.1 && Math.abs(sweeps[0].max-750)<.1 && Math.abs(sweeps[1].min-720)<.1 && Math.abs(sweeps[3].min-281.25)<.1 && JSON.stringify(sweeps[4])===JSON.stringify(sweeps[5])`);
 await ev(`document.querySelector('[data-answer=higher]').click()`);await delay(150);
 await ev(`document.querySelector('#hear').click()`);await check(`document.querySelector('#hear').textContent==='Hear comparison'`);
 await ev(`document.querySelector('#hear').click()`);await delay(150);await check(`document.querySelector('#hear').textContent==='Stop sound: At rest'`);
 await ev(`document.querySelector('#replay').click()`);await delay(3000);await check(`document.querySelector('#scene').dataset.phase==='question' && document.querySelector('#hear').textContent==='Hear comparison' && completedMessages===1`);
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 await ev(`document.querySelector('[data-answer=higher]').click()`);await delay(3000);
 const still=await ev(`document.querySelector('#ambulance').getAttribute('transform')`);await delay(500);
 if(still!==await ev(`document.querySelector('#ambulance').getAttribute('transform')`))throw Error('Reduced motion moved');
 await ev(`document.querySelector('#hear').click()`);const stopped=await ev(`document.querySelector('#ambulance').getAttribute('transform')`);await delay(500);
 if(stopped!==await ev(`document.querySelector('#ambulance').getAttribute('transform')`))throw Error('Stop did not stop motion');
 if(errors.length)throw Error(JSON.stringify(errors));
 console.log('PASS: source/copy/ZIP identical; all cases auto-play, 2.4-second reference, full comparison before advance, persistent feedback, synchronized stationary/moving stages, exaggerated pitch sweeps, desktop/390/320 layouts, replay cancellation, completion once.');
 } finally {if(ws)ws.close();chrome.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
