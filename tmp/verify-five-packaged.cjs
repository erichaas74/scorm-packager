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

 const cases=JSON.parse(fs.readFileSync('problem-walkthoughs/unit 6/motor-challenges.json'));
 const out='output/unit6-five-challenges-packaged';fs.mkdirSync(out,{recursive:true});const records=[];
 const snap=async name=>{await ev('document.documentElement.getBoundingClientRect()');await delay(60);const height=await ev('Math.max(document.documentElement.scrollHeight,document.body.scrollHeight)');const r=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:0,width:await ev('innerWidth'),height,scale:1}});fs.writeFileSync(out+'/'+name+'.png',Buffer.from(r.data,'base64'));};
 const inspect=async()=>ev(`(()=>{const s=document.querySelector('svg'),b=s.getBoundingClientRect();return {state:challengeState(),overflow:document.documentElement.scrollWidth>innerWidth,clipped:[...s.querySelectorAll('text')].filter(t=>{const r=t.getBoundingClientRect();return r.left<b.left-1||r.right>b.right+1||r.bottom>b.bottom+1}).map(t=>t.textContent),gap:document.querySelector('.controls').getBoundingClientRect().top-b.bottom}})()`);
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 for(const item of cases){for(const width of [320]){
  await size(width);await navigate('tmp/unit6-five-packaged/'+item.href.replace('.html','')+'/index.html');await delay(150);await check('challengeState().phase==="predict"');await snap(item.kind+'-'+width+'-setup');
  await ev(`window.phaseTimes=[];new MutationObserver(()=>{const phase=scene.dataset.phase;if(phaseTimes.at(-1)?.phase!==phase)phaseTimes.push({phase,time:performance.now()})}).observe(scene,{attributes:true,attributeFilter:['data-phase']})`);
  const correct=['load','wire'].includes(item.kind)?1:0;const selected=width===320?correct:(correct+1)%await ev('document.querySelectorAll("[data-choice]").length');
  await ev('document.querySelectorAll("[data-choice]")['+selected+'].click()');await delay(2550);await check('challengeState().phase==="feedback"');await snap(item.kind+'-'+width+'-feedback');records.push({kind:item.kind,width,...await inspect()});
  await delay(3100);await check('challengeState().phase==="experiment"');await check('phaseTimes.find(x=>x.phase==="experiment").time-phaseTimes.find(x=>x.phase==="feedback").time>=2900');
  if(item.kind==='motor')await ev('document.querySelector("[data-toggle]").click()');
  if(item.kind==='wire')await ev('document.querySelector("[data-toggle=polarity]").click();document.querySelector("[data-toggle=field]").click();document.querySelector("[data-toggle=polarity]").click()');
  if(item.kind==='load')await ev('bulbs.value=3;bulbs.dispatchEvent(new Event("change"));bulbs.value=1;bulbs.dispatchEvent(new Event("change"))');
  if(item.kind==='reversible')await ev('speed.value=20;speed.dispatchEvent(new Event("input"));document.querySelector("[data-toggle]").click()');
  if(item.kind==='induction'){
   await ev('motion.value=-1;motion.dispatchEvent(new Event("change"));document.querySelector("#run").click()');await delay(900);await check('challengeState().meter>0');await snap(item.kind+'-'+width+'-moving');await delay(1100);await check('challengeState().meter===0');
   await ev('motion.value=1;motion.dispatchEvent(new Event("change"));document.querySelector("[data-toggle]").click();document.querySelector("#run").click()');await delay(900);await check('challengeState().meter>0');await delay(1100);
  }
  await delay(100);await check('completedMessages===1');await snap(item.kind+'-'+width+'-experiment');records.push({kind:item.kind,width,...await inspect()});
  await ev('document.querySelector("#replay").click()');await check('challengeState().phase==="predict" && completedMessages===1');
  console.log(item.kind+' '+width+' passed');
 }}
 fs.writeFileSync(out+'/browser-checks.json',JSON.stringify({records,errors},null,2));if(errors.length)throw Error(JSON.stringify(errors));const bad=records.filter(x=>x.overflow||x.clipped.length||Math.abs(x.gap-6)>1);if(bad.length)throw Error(JSON.stringify(bad));console.log('All five extracted packages passed at 320 px with reduced motion and a full three-second feedback hold.');
 } finally {if(ws)ws.close();chrome.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});


