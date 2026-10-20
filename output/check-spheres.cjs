const {chromium}=require('C:/Users/erich/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),assert=require('assert');
(async()=>{
 const dir='C:/Users/erich/scorm-packager/output/sphere-demo-check';fs.mkdirSync(dir,{recursive:true});
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const page=await browser.newPage({viewport:{width:1000,height:1100}});let errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.clock.install();
 await page.goto('file:///C:/Users/erich/scorm-packager/output/sphere-demo-check/packaged/index.html');
 await page.clock.pauseAt(new Date(Date.now()+1000));
 await page.evaluate(()=>{window.completions=0;addEventListener('message',e=>{if(e.data?.type==='complete')window.completions++});});
 for(const width of [1000,390,320]){
  await page.setViewportSize({width,height:1100});await page.getByRole('button',{name:'Replay'}).click();
  await page.screenshot({path:dir+'/'+width+'-setup.png',fullPage:true});
  await page.clock.runFor(8500);await page.screenshot({path:dir+'/'+width+'-transfer.png',fullPage:true});
  await page.clock.runFor(10000);await page.screenshot({path:dir+'/'+width+'-result.png',fullPage:true});
  assert.equal(await page.locator('#scene').getAttribute('data-phase'),'result');
  assert.equal(await page.locator('#scene').getAttribute('data-qa'),'2');
  assert.equal(await page.locator('#scene').getAttribute('data-qb'),'2');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.clock.runFor(5000);
 }
 assert.equal(await page.evaluate(()=>window.completions),1);
 await page.emulateMedia({reducedMotion:'reduce'});await page.getByRole('button',{name:'Replay'}).click();await page.clock.runFor(6000);
 await page.screenshot({path:dir+'/320-reduced-contact.png',fullPage:true});
 assert.equal(await page.locator('#scene').getAttribute('data-phase'),'transfer');
 await page.clock.runFor(18000);assert.equal(await page.evaluate(()=>window.completions),1);
 assert.deepEqual(errors,[]);console.log('PASS: setup/transfer/result at 1000/390/320, no overflow, final charges, reduced motion, Replay and one completion; no JS errors.');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});



