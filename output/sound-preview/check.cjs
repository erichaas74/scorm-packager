const {chromium}=require('C:/Users/erich/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const p=await b.newPage({viewport:{width:1100,height:1000}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.clock.install();await p.clock.pauseAt(new Date(Date.now()+1000));
 for(const source of ['source','packaged']) {
  await p.goto(source==='source'?'http://127.0.0.1:4173/problem-walkthoughs/unit%205/Speed_of_Sound_Explorer.html':'http://127.0.0.1:4173/output/sound-preview/packaged/index.html');
  await p.evaluate(()=>{window.done=0;addEventListener('message',e=>{if(e.data?.type==='complete')done++})});
  await p.clock.fastForward(20);
  await p.screenshot({path:`output/sound-preview/${source}-desktop-predict.png`,fullPage:true});
  assert.equal(await p.locator('#test-button').count(),0);
  await p.locator('[data-track="air"]').click();
  assert.equal(await p.locator('#tracks').getAttribute('data-phase'),'running');
  await p.clock.fastForward(400);
  const progress=await p.locator('.track-card').evaluateAll(es=>es.map(e=>Number(e.dataset.progress)));
  assert(progress[2]>progress[1]&&progress[1]>progress[0]);
  assert(Math.abs(progress[2]/progress[0]-5100/343)<.1);
  await p.screenshot({path:`output/sound-preview/${source}-desktop-moving.png`,fullPage:true});
  await p.clock.fastForward(2000);
  const before=await p.locator('[data-track="steel"] canvas').evaluate(e=>e.toDataURL());
  await p.clock.fastForward(250);
  const after=await p.locator('[data-track="steel"] canvas').evaluate(e=>e.toDataURL());
  assert.notEqual(before,after,'Steel must keep moving after arrival');
  assert.equal(await p.locator('#tracks').getAttribute('data-phase'),'running');
  await p.screenshot({path:`output/sound-preview/${source}-continuing.png`,fullPage:true});
  await p.clock.fastForward(12000);
  assert.equal(await p.locator('#tracks').getAttribute('data-phase'),'result');
  assert((await p.locator('#race-status').innerText()).includes('Steel arrives first')); assert(!/CORRECT|NOT QUITE/.test(await p.locator('#race-status').innerText()));
  assert.equal(await p.locator('.track-card.arrived').count(),3);
  const stopped=await p.locator('[data-track="steel"] canvas').evaluate(e=>e.toDataURL());
  await p.clock.fastForward(500);
  assert.equal(await p.locator('[data-track="steel"] canvas').evaluate(e=>e.toDataURL()),stopped);
  await p.screenshot({path:`output/sound-preview/${source}-result.png`,fullPage:true});
  assert.equal(await p.locator('.reason-choice').count(),0);
  await p.clock.fastForward(7000);
  assert.equal(await p.locator('[data-mode="substance"]').getAttribute('aria-pressed'),'true');
  await p.clock.fastForward(600);
  assert.equal(await p.locator('[data-mode="temperature"]').getAttribute('aria-pressed'),'true');
  assert.equal(await p.locator('#tracks').getAttribute('data-phase'),'predict');
  await p.locator('[data-track="hot-air"]').click();await p.clock.fastForward(3000);
  await p.screenshot({path:`output/sound-preview/${source}-temperature-moving.png`,fullPage:true});
  await p.clock.fastForward(3200);
  assert((await p.locator('#race-status').innerText()).includes('Warm air')); assert(!/CORRECT|NOT QUITE/.test(await p.locator('#race-status').innerText()));
  assert.equal(await p.locator('.reason-choice').count(),0);
  await p.waitForFunction(()=>done===1);
  for(const width of [390,320]) {
   await p.setViewportSize({width,height:1000});
   await p.locator('[data-mode="substance"]').click();await p.clock.fastForward(20);
   await p.locator('[data-track="steel"]').click();await p.clock.fastForward(400);
   await p.screenshot({path:`output/sound-preview/${source}-${width}-moving.png`,fullPage:true});
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await p.locator('#reset-button').click();await p.clock.fastForward(13000);
   assert.equal(await p.locator('#tracks').getAttribute('data-phase'),'predict');
  }
  await p.emulateMedia({reducedMotion:'reduce'});
  await p.locator('[data-track="water"]').click();await p.clock.fastForward(100);
  assert.equal(await p.locator('#tracks').getAttribute('data-phase'),'result');
  await p.locator('#replay-button').click();await p.clock.fastForward(100);
  assert.equal(await p.evaluate(()=>done),1);
  await p.emulateMedia({reducedMotion:'no-preference'});await p.setViewportSize({width:1100,height:1000});
 }
 assert.deepEqual(errors,[]);await b.close();console.log('PASS source and ZIP: immediate launch, relative speeds, both comparisons, correct/incorrect predictions, completion once, reset cancels race, replay, reduced motion, 390/320 layouts, no JS errors.');
})().catch(e=>{console.error(e);process.exit(1)});

