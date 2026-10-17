const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {spawn}=require('node:child_process');
const root=process.cwd(),out=path.join(root,'output/unit5-visual-audit');

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

for(const file of ['index.html','u1h-rocket-launch-buzz-assessment-template.html','u1h-rocket-launch-buzz-assessment-template-preview.html']) {
 await send('Page.navigate',{url:'http://127.0.0.1:'+server.address().port+'/unit-ApplicationFiles/unit-1/lesson-honors/'+file});
 await delay(700);
 for(const embedded of [false,true]) {
 if(embedded) await evaluate("document.body.className='';document.body.style.color='black'");
 const colors=await evaluate("[...document.querySelectorAll('.card')].map(e=>getComputedStyle(e).color)");
 if(!colors.length || colors.some(c=>c!=='rgb(226, 232, 240)')) throw Error(file+' failed '+JSON.stringify(colors));
 console.log(file+' '+(embedded?'embedded':'standalone')+': light text verified on '+colors.length+' dark panels');
 }
}
}finally{if(ws)ws.close();chrome.kill();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
