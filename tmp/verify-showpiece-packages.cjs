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

 const cases=JSON.parse(fs.readFileSync('problem-walkthoughs/unit 6/showpiece-demos.json'));const out='output/unit6-showpiece-demos-packaged';fs.mkdirSync(out,{recursive:true});const records=[];
 const snap=async name=>{const h=await ev('Math.max(document.documentElement.scrollHeight,document.body.scrollHeight)');const r=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:0,width:await ev('innerWidth'),height:h,scale:1}});fs.writeFileSync(out+'/'+name+'.png',Buffer.from(r.data,'base64'));};
 const inspect=()=>ev(`(()=>{const s=document.querySelector('svg'),b=s.getBoundingClientRect();return {state:showpieceState(),overflow:document.documentElement.scrollWidth>innerWidth,clipped:[...s.querySelectorAll('text')].filter(t=>{const r=t.getBoundingClientRect();return r.left<b.left-1||r.right>b.right+1}).map(t=>t.textContent),gap:document.querySelector('.controls').getBoundingClientRect().top-b.bottom}})()`);
 for(const item of cases)for(const width of [320]){
  await size(width);await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await navigate('tmp/showpiece-packaged/'+item.kind+'/index.html');await delay(150);
  for(let example=0;example<3;example++){if(example)await delay(5100);await check('showpieceState().example==='+example);await snap(item.kind+'-'+width+'-'+example);records.push({kind:item.kind,width,...await inspect()});}
  await check('completedMessages===1');await ev('document.querySelector("#replay").click()');await check('showpieceState().example===0 && completedMessages===1');console.log(item.kind+' '+width+' passed');
 }
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});await size(1100);
 for(const item of cases){await navigate('tmp/showpiece-packaged/'+item.kind+'/index.html');await delay(3300);await snap(item.kind+'-motion');await check('showpieceState().phase==="animate"');await delay(2800);await check('showpieceState().phase==="hold"');await delay(3200);await check('showpieceState().example===1');await delay(3300);await snap(item.kind+'-field-motion');}
 fs.writeFileSync(out+'/browser-checks.json',JSON.stringify({records,errors},null,2));const bad=records.filter(x=>x.clipped.length||x.overflow||Math.abs(x.gap-6)>1);console.log(JSON.stringify({bad,errors}));if(bad.length||errors.length)throw Error('Browser checks failed');console.log('PASS all demo examples, layouts, automatic advance, replay and completion.');
 } finally {if(ws)ws.close();chrome.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});


