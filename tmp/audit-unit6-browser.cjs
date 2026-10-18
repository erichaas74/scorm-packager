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
  const layout=async()=>{return await ev(`(()=>{const svg=document.querySelector('svg'),box=svg.getBoundingClientRect(),buttons=document.querySelector('.choices').getBoundingClientRect();const clipped=[...svg.querySelectorAll('text')].filter(t=>{const b=t.getBoundingClientRect();return b.left<box.left-1||b.right>box.right+1||b.top<box.top-1||b.bottom>box.bottom+1});return {overflow:document.documentElement.scrollWidth>innerWidth,gap:buttons.top-box.bottom,clipped:clipped.map(t=>t.textContent),height:document.querySelector('main').getBoundingClientRect().height};})()`);};
  async function navigate(file){await send('Page.navigate',{url:'file:///'+path.resolve(file).replaceAll('\\','/')});await delay(150);}
 const inventory=JSON.parse(fs.readFileSync('tmp/unit6-inventory.json','utf8'));
 const out='output/unit6-walkthrough-audit-2026-10-17';fs.mkdirSync(out,{recursive:true});
 const records=[];
 const snap=async name=>{const r=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});fs.writeFileSync(out+'/'+name+'.png',Buffer.from(r.data,'base64'));};
 const measure=()=>ev(`(()=>{const svg=document.querySelector('#scene'),b=svg.getBoundingClientRect();return {phase:svg.dataset.phase,choices:[...document.querySelectorAll('[data-choice]')].filter(e=>!e.hidden).length,parameterControls:document.querySelectorAll('input,select').length,overflow:document.documentElement.scrollWidth>innerWidth,clippedText:[...svg.querySelectorAll('text')].filter(t=>{const r=t.getBoundingClientRect();return r.left<b.left-2||r.right>b.right+2||r.top<b.top-2||r.bottom>b.bottom+2}).map(t=>t.textContent),prompt:document.querySelector('#prompt')?.textContent,explanation:document.querySelector('#explanation')?.textContent};})()`);
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 for(let i=0;i<inventory.length;i++){
  const item=inventory[i],record={id:i+1,href:item.href,title:item.title,views:[]};
  for(const width of [1100,390,320]){
   await size(width);await navigate('problem-walkthoughs/unit 6/'+decodeURIComponent(item.href));
   const initial=await measure();
   if(initial.phase!=='predict'||!initial.choices)throw Error('Unexpected initial behavior: '+item.href+' '+width+' '+JSON.stringify(initial)+' '+JSON.stringify(errors));
   if(width!==320)await snap(`${i+1}-${width}-question`);
   await ev(`document.querySelector('[data-choice="'+window.walkthroughLesson.correct+'"]').click()`);
   const correct=await measure();
   if(width!==320)await snap(`${i+1}-${width}-result`);
   await ev(`document.getElementById('replay').click();document.querySelector('[data-choice="'+((window.walkthroughLesson.correct+1)%window.walkthroughLesson.choices.length)+'"]').click()`);
   const incorrect=await measure();
   record.views.push({width,initial,correct,incorrect});
  }
  records.push(record);if((i+1)%9===0){fs.writeFileSync(out+'/browser-audit.json',JSON.stringify(records,null,2));console.log('Audited '+(i+1)+' / '+inventory.length);}
 }
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
 await size(1100);await navigate('problem-walkthoughs/unit 6/charge-between-plates.html');
 const phases=[(await measure()).phase];await delay(2600);phases.push((await measure()).phase);
 await ev(`document.querySelector('[data-choice="0"]').click()`);phases.push((await measure()).phase);
 await delay(6800);phases.push((await measure()).phase);await delay(3500);phases.push((await measure()).phase);
 fs.writeFileSync(out+'/playback-audit.json',JSON.stringify({phases,errors},null,2));
 if(errors.length)throw Error(JSON.stringify(errors));console.log('Completed '+records.length+' activities at 1100, 390, 320 px; normal playback '+phases.join(' > '));
 } finally {if(ws)ws.close();chrome.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});


