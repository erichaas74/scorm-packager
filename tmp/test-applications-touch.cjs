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
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:3,mobile:true});
  await send('Emulation.setCPUThrottlingRate',{rate:6});
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__clicked='';document.addEventListener('click',e=>{const b=e.target.closest('button');if(b)window.__clicked=b.id||b.textContent.trim()},true);`});
  const tap=async selector=>{
   for(let i=0;i<80;i++){if(await evaluate(`!!document.querySelector(${JSON.stringify(selector)})`))break;await delay(150);}
   await evaluate(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center'})`);await delay(120);
   const p=await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)}),r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2,label:e.id||e.textContent.trim()}})()`);
   await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:p.x,y:p.y}]});await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await delay(150);
   assert.equal(await evaluate('__clicked'),p.label,'touch reaches '+selector);
  };
  const specs=[
   ['unit-1/lesson-1/u1l1-motion-graphs-buzz-assessment-template',['#start-btn','#playBtn']],
   ['unit-1/lesson-3/u1l3-galileo-buzz-assessment-template',['#startButton']],
   ['unit-1/lesson-honors/u1h-rocket-launch-buzz-assessment-template',['#s1-action-btn']],
   ['unit-1/lesson-5/u1l5-skydiver-buzz-assessment-template',['#startChallengeBtn']],
   ['unit-2/lesson-u2l2/u2l2-launch-velocity-buzz-assessment-template',['button']],
   ['unit-2/lesson-u2l3/u2l3-circus-launch-buzz-assessment-template',['[data-main]']],
   ['unit-2/lesson-u2l5/u2l5-inertia-tension-buzz-assessment-template',['#slow-pull']],
   ['unit-2/lesson-u2honors/u2h-coriolis-cannon-buzz-assessment-template',['#fireBtn']],
   ['unit-3/lesson-2/u3l2-golf-club-ct-buzz-assessment-template',['#dropBtn']],
   ['unit-3/lesson-3/u3l3-friction-force-buzz-assessment-template',['#startBtn','#constVelBtn','#part2-run','#part3-run']],
   ['unit-3/lesson-4/u3l4-collision-lab-buzz-assessment-template',['[data-run]']],
   ['unit-3/lesson-5/u3l5-impulse-jump-buzz-assessment-template',['button']]
  ];
  for(const [file,selectors] of specs.slice(5))for(const suffix of ['', '-preview']){
   errors.length=0;
   await send('Page.navigate',{url:pathToFileURL(path.join(process.cwd(),'unit-ApplicationFiles',file+suffix+'.html')).href});await delay(650);
   for(const selector of selectors)await tap(selector);
   await delay(900);
   assert.equal(errors.length,0,JSON.stringify(errors));
   const width=await evaluate('document.documentElement.scrollWidth');assert(width<=391,file+' overflow '+width);
   if(file.includes('skydiver'))assert(await evaluate('parseFloat(readTime.textContent)>0'));
   if(file.includes('impulse-jump'))assert(await evaluate("/Required graph|Running/.test(runMessage.textContent)"));
   if(!suffix&&(/friction|golf|impulse/.test(file))){const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('tmp/mobile-'+file.split('/')[1]+'.png',Buffer.from(shot.data,'base64'));}
   console.log('PASS 6x CPU / touch '+file+suffix);
  }
  await send('Browser.close').catch(()=>{});
 }finally{if(ws)ws.close();chrome.kill();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
