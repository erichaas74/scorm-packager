const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {spawn}=require('node:child_process');
const root=process.cwd(),out=path.join(root,'output/unit5-visual-audit');
const allFiles=JSON.parse(fs.readFileSync(path.join(out,'inventory.json'),'utf8')); const ids=[3,5,14,35,61,62,65,70,73]; const files=ids.map(id=>allFiles[id-1]);
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png'};
const server=http.createServer((req,res)=>{let p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!p.startsWith(root+path.sep)){res.writeHead(403);return res.end();}try{if(fs.statSync(p).isDirectory())p=path.join(p,'index.html');res.setHeader('Content-Type',mime[path.extname(p)]||'application/octet-stream');fs.createReadStream(p).pipe(res);}catch{res.writeHead(404);res.end();}});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const profile=fs.mkdtempSync(path.join(root,'tmp','unit5-audit-browser-'));
 const chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless','--no-first-run','--no-default-browser-check','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:'ignore'});
 let ws;const results=[];
 try{
  const portFile=path.join(profile,'DevToolsActivePort');for(let i=0;i<100&&!fs.existsSync(portFile);i++)await delay(100);
  const port=fs.readFileSync(portFile,'utf8').split('\n')[0];
  const targets=await(await fetch(`http://127.0.0.1:${port}/json`)).json();ws=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});
  let id=0,errors=[];const pending=new Map();
  ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text+': '+(m.params.exceptionDetails.exception?.description||''));};
  const send=(method,params={})=>new Promise((resolve,reject)=>{const key=++id;pending.set(key,{resolve,reject});ws.send(JSON.stringify({id:key,method,params}));});
  const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
  await send('Page.enable');await send('Runtime.enable');
  for(let i=0;i<files.length;i++){
   errors=[];const file=files[i],entry={id:ids[i],file};
   for(const [name,width,height] of [['desktop',1280,900],['mobile',390,844]]){
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
    await send('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/`+file.split('/').map(encodeURIComponent).join('/')});
    for(let n=0;n<30;n++){await delay(100);if(await evaluate("document.readyState==='complete'"))break;}
    await delay(200);
    entry[name]=await evaluate(`(()=>{
      const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};};
      const sample=sel=>[...document.querySelectorAll(sel)].map(e=>({text:(e.innerText||e.textContent||'').trim().slice(0,100),box:rect(e),color:getComputedStyle(e).color,background:getComputedStyle(e).backgroundColor,font:getComputedStyle(e).fontSize}));
      return {headings:sample('h1'),labels:sample('.controls label'),shell:sample('.rise-shell'),dashboard:sample('.dashboard'),cards:sample('.dashboard .card'),overlay:sample('.overlay-panel'),canvas:sample('canvas'),graphics:sample('svg'),text:document.body.innerText};
    })()`);
    await evaluate("(()=>{const panel=document.querySelector('.overlay-panel');if(panel)panel.scrollIntoView({block:'center'});else if(document.body.scrollHeight>2000)window.scrollTo(0,document.body.scrollHeight-900);})()"); const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(path.join(out,`detail-${String(ids[i]).padStart(2,'0')}-${name}.png`),Buffer.from(shot.data,'base64'));
   }
   entry.errors=[...new Set(errors)];results.push(entry);fs.writeFileSync(path.join(out,'detail-metrics.json'),JSON.stringify(results,null,2));
   if((i+1)%10===0)console.log(`Reviewed ${i+1}/${files.length} pages at desktop and phone widths`);
  }
 }finally{if(ws)ws.close();chrome.kill();server.close();}
 console.log('Completed '+results.length+' pages');
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
