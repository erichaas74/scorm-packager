const {chromium}=require('C:/Users/erich/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Users/erich/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe'});
 const page=await browser.newPage({viewport:{width:1000,height:800}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.completions=0;addEventListener('message',e=>{if(e.data?.type==='complete')window.completions++});});
 await page.clock.install();
 await page.clock.pauseAt(new Date(Date.now()+1000));
 for(const source of ['problem-walkthoughs/unit 5/telescope-microscope.html','output/telescope-microscope/extracted/index.html']){
  await page.goto('file:///'+path.resolve(source).replaceAll('\\','/'));
  const tag=source.startsWith('output')?'zip':'source';
  await page.screenshot({path:`output/telescope-microscope/${tag}-setup.png`});
  await page.clock.runFor(3650);
  assert.equal(await page.locator('#scene').getAttribute('data-stage'),'2');
  await page.screenshot({path:`output/telescope-microscope/${tag}-drawing.png`});
  await page.clock.runFor(7000);
  assert.equal(await page.locator('#scene').getAttribute('data-stage'),'5');
  await page.screenshot({path:`output/telescope-microscope/${tag}-telescope.png`});
  await page.clock.runFor(5000);
  assert.equal(await page.locator('#scene').getAttribute('data-mode'),'microscope');
  await page.clock.runFor(10500);
  await page.screenshot({path:`output/telescope-microscope/${tag}-microscope.png`});
  await page.clock.runFor(5000);
  assert.equal(await page.evaluate(()=>window.completions),1);
  await page.locator('#microscope').click();
  await page.clock.runFor(10500);
  for(const width of [390,320]){
   await page.setViewportSize({width,height:800});
   await page.screenshot({path:`output/telescope-microscope/${tag}-microscope-${width}.png`});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   await page.locator('.scroll').evaluate(el=>el.scrollLeft=el.scrollWidth);
   await page.screenshot({path:`output/telescope-microscope/${tag}-microscope-${width}-right.png`});
  }
  await page.locator('#replay').click();
  assert.equal(await page.locator('#scene').getAttribute('data-stage'),'0');
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.waitForFunction(()=>document.querySelector('#scene').dataset.stage==='5');
  assert.equal(await page.locator('#scene').getAttribute('data-stage'),'5');
  await page.clock.runFor(33000);
  assert.equal(await page.evaluate(()=>window.completions),1);
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.setViewportSize({width:1000,height:800});
 }
 assert.deepEqual(errors,[]);
 await browser.close();console.log('Passed source and extracted ZIP: stages, both examples, looping, replay, completion once, reduced motion, 320/390 overflow.');
})().catch(e=>{console.error(e);process.exit(1)});

