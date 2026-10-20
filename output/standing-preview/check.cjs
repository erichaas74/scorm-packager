const {chromium}=require('C:/Users/erich/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const p=await b.newPage({reducedMotion:'reduce'}); const errors=[];p.on('pageerror',e=>errors.push(e.message));
for(const name of ['source','packaged']) {
 await p.goto(name==='source'?'http://127.0.0.1:4173/problem-walkthoughs/unit%205/StandingWaveSimulation.html':'http://127.0.0.1:4173/output/standing-preview/packaged/index.html');
 await p.evaluate(()=>{window.completions=0;addEventListener('message',e=>{if(e.data?.type==='complete')completions++})});
 for(let n=0;n<3;n++) {
  for(const [stage,phase] of ['travel','combine','standing','frequency'].entries()) {
   assert.equal(await p.locator('#scene').getAttribute('data-phase'),phase);
   assert.equal(await p.locator('#scene').getAttribute('data-example'),String(n));
   for(const width of [1000,390,320]) {
    await p.setViewportSize({width,height:900});
    assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    const clipped=await p.locator('#scene').evaluate(el=>[...el.querySelectorAll('text')].filter(t=>{const r=t.getBBox();return r.x<0||r.x+r.width>el.viewBox.baseVal.width}).map(t=>t.textContent));
    assert.deepEqual(clipped,[]);
    if(name==='packaged'&&n===1)await p.screenshot({path:`output/standing-preview/${width}-${phase}.png`,fullPage:true});
   }
   await p.locator('#step').click();
  }
 }
 await p.waitForFunction(()=>completions===1); assert.equal(await p.evaluate(()=>completions),1);
 await p.locator('#replay').click();assert.equal(await p.locator('#scene').getAttribute('data-phase'),'travel');
}
assert.deepEqual(errors,[]);await b.close();console.log('PASS source and packaged: all 3 harmonics / 4 phases; 1000, 390, 320 px; no clipped text; reduced-motion steps, replay, single completion, no JS errors.');
})().catch(e=>{console.error(e);process.exit(1)});

