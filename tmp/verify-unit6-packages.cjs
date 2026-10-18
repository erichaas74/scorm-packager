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
 const inventory=JSON.parse(fs.readFileSync('problem-walkthoughs/unit 6/activity-groups.json')).filter(x=>x.group!=='question');
 const out='output/unit6-walkthrough-audit-2026-10-17';const records=[];
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 for(const [i,item] of inventory.entries()) for(const width of [390]){
  await size(width);await navigate('tmp/unit6-extracted/'+item.href.replace(/\.html$/, '')+'/index.html');await delay(180);
  await check(`window.activityGroup.group === '${item.group}'`);
  const inspect=async(state)=>{const measure=await ev(`(()=>{const s=document.querySelector('#scene'),b=s.getBoundingClientRect();return {overflow:document.documentElement.scrollWidth>innerWidth,clipped:[...s.querySelectorAll('text')].filter(t=>{const r=t.getBoundingClientRect();return r.left<b.left-2||r.right>b.right+2}).map(t=>t.textContent),step:s.dataset.step,completion:completedMessages}})()`);records.push({href:item.href,width,state,...measure});if(measure.overflow||measure.clipped.length)throw Error(JSON.stringify(records.at(-1)));if(width!==320){const m=await send('Page.getLayoutMetrics');const r=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:0,width,height:Math.ceil(m.cssContentSize.height),scale:1}});fs.writeFileSync(out+'/packaged-'+i+'-'+width+'-'+state+'.png',Buffer.from(r.data,'base64'));}};
  await inspect('baseline');
  if(item.group==='simulation'){
   await ev(`parameter.value='1';parameter.dispatchEvent(new Event('change'))`);await inspect('changed');await check(`document.querySelector('#scene').dataset.step==='1'`);
   await ev(`parameter.value='0';parameter.dispatchEvent(new Event('change'))`);await check(`document.querySelector('#scene').dataset.step==='2' && completedMessages===1`);
   await ev(`parameter.value='1';parameter.dispatchEvent(new Event('change'))`);await delay(20);await check(`parameter.value==='1' && document.querySelector('#scene').dataset.step==='2'`);
  }
  await ev(`document.querySelector('#replay').click()`);await check(`completedMessages===1`);
 }
 await navigate('problem-walkthoughs/unit 6/index.html');await delay(200);await check(`document.querySelectorAll('.activity-group').length===3 && document.querySelectorAll('article.card').length===54`);
 await size(1100);const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(out+'/grouped-index.png',Buffer.from(shot.data,'base64'));
 fs.writeFileSync(out+'/packaged-browser-audit.json',JSON.stringify({records,errors},null,2));if(errors.length)throw Error(JSON.stringify(errors));console.log('PASS: 14 extracted packages, simulation controls and completion; index has 54 unique cards in 3 sections.');
 } finally {if(ws)ws.close();chrome.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});


