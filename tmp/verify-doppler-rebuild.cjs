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
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.completedMessages=0;window.tones=[];addEventListener('message',e=>{if(e.data?.type==='complete')window.completedMessages++});const original=AudioParam.prototype.setValueAtTime;AudioParam.prototype.setValueAtTime=function(v,t){window.tones.push(v);return original.call(this,v,t)};`});
  const check=async expression=>{if(!await ev(expression))throw Error('Failed: '+expression);};
  const screenshot=async name=>{const r=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('tmp/doppler-'+name+'.png',Buffer.from(r.data,'base64'));};
  const size=async width=>{await send('Emulation.setDeviceMetricsOverride',{width,height:700,deviceScaleFactor:1,mobile:false});await delay(80);};
  const layout=async()=>{return await ev(`(()=>{const svg=document.querySelector('svg'),box=svg.getBoundingClientRect(),buttons=document.querySelector('.choices').getBoundingClientRect();const clipped=[...svg.querySelectorAll('text')].filter(t=>{const b=t.getBBox();return b.x<0||b.x+b.width>svg.viewBox.baseVal.width||b.y<0||b.y+b.height>390});return {overflow:document.documentElement.scrollWidth>innerWidth,gap:buttons.top-box.bottom,clipped:clipped.map(t=>t.textContent),height:document.querySelector('main').getBoundingClientRect().height};})()`);};
  async function navigate(file){await send('Page.navigate',{url:'file:///'+path.resolve(file).replaceAll('\\','/')});await delay(150);}
  await size(900);await navigate('problem-walkthoughs/unit 5/doppler-sound.html');
  await screenshot('desktop-reference');
  await check(`document.querySelectorAll('h1').length===1 && document.body.children.length===1 && document.querySelector('main').contains(document.querySelector('script'))`);
  await delay(2400);
  await check(`document.querySelector('svg').dataset.phase==='question' && [...document.querySelectorAll('[data-answer]')].every(b=>!b.disabled)`);
  await screenshot('desktop-question');
  for(const width of [390,320]){await size(width);console.log('question',width,await layout());await screenshot(width+'-question');}
  await ev(`document.querySelector('[data-answer=lower]').click()`);
  await check(`document.querySelector('svg').dataset.phase==='evidence' && document.querySelector('[data-answer=higher]').dataset.result==='answer' && document.querySelector('[data-answer=lower]').dataset.result==='selected' && document.querySelector('svg').textContent.includes('667 Hz')`);
  for(const width of [320,390,900]){await size(width);const l=await layout();if(l.overflow||l.clipped.length||l.gap!==6)throw Error(JSON.stringify(l));console.log('evidence',width,l);await screenshot(width+'-toward-evidence');}
  await ev(`document.getElementById('hear').click()`);await delay(1500);
  await check(`tones.includes(600)&&tones.some(n=>Math.abs(n-600/.9)<.01)`);
  await ev(`document.getElementById('replay').click()`);
  await check(`document.querySelector('svg').dataset.phase==='reference' && !document.querySelector('svg').textContent.includes('667 Hz') && document.getElementById('hear').textContent==='Hear comparison'`);
  await delay(2500);await check(`document.querySelector('svg').dataset.case==='0' && document.querySelector('svg').dataset.phase==='question'`);
  // Natural evidence holds and next-case transitions. Both wrong and right answers reveal evidence.
  for(const [i,answer,hz] of [[0,'higher',667],[1,'lower',545],[2,'same',600]]){
    await check(`document.querySelector('svg').dataset.case==='${i}' && document.querySelector('svg').dataset.phase==='question'`);
    await ev(`document.querySelector('[data-answer=${answer}]').click()`);
    await check(`document.querySelector('svg').textContent.includes('${hz} Hz')`);
    if(i>0){await size(390);await screenshot(i===1?'away-evidence':'passenger-evidence');const l=await layout();if(l.clipped.length||l.overflow)throw Error(JSON.stringify(l));}
    await delay(6600);
    if(i<2)await delay(2400);
  }
  await check(`completedMessages===1`);
  await ev(`document.getElementById('replay').click()`);await delay(2500);
  await ev(`document.querySelector('[data-answer=higher]').click()`);await delay(6600);
  await check(`completedMessages===1`);
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await navigate('tmp/doppler-rebuild-extracted/index.html');await delay(2400);
  const before=await ev(`document.querySelector('svg').innerHTML`);await delay(300);
  if(before!==await ev(`document.querySelector('svg').innerHTML`))throw Error('Reduced motion still animates');
  await ev(`document.querySelector('[data-answer=same]').click()`);
  await check(`document.querySelector('svg').textContent.includes('667 Hz')`);
  await screenshot('zip-reduced-motion');
  await ev(`document.getElementById('replay').click()`);await delay(2500);
  await check(`document.querySelector('svg').dataset.case==='0' && document.querySelector('svg').dataset.phase==='question'`);
  if(errors.length)throw Error(JSON.stringify(errors));
  console.log('PASS: all cases, incorrect choice, audio frequencies, replay cancellation, automatic transitions, completion once, reduced motion, extracted ZIP, responsive geometry.');
 } finally {if(ws)ws.close();chrome.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});

