const {chromium}=require('C:/Users/erich/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Users/erich/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe'});
 const page=await browser.newPage({viewport:{width:1000,height:850}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.completions=0;window.addEventListener('message',e=>{if(e.data?.type==='complete')window.completions++});});
 const base='http://127.0.0.1:4178/';
 await page.goto(base+'output/radio-split/packaged/radio-tuner/index.html?dial=1');
 await page.setViewportSize({width:320,height:900});await page.screenshot({path:'output/radio-split/tuner-dial-320.png',fullPage:true});
 async function tune(v){await page.locator('#rxTune').evaluate((el,v)=>{el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));},v);}
 await tune(200);assert.match(await page.locator('#guidance').textContent(),/^A passes/);
 await tune(350);assert.match(await page.locator('#guidance').textContent(),/^Between/);
 await page.screenshot({path:'output/radio-split/tuner-between-320.png',fullPage:true});
 await tune(800);await page.waitForFunction(()=>window.completions===1);
 await page.locator('#rxFM').click();assert.equal(await page.locator('#rxFrequency').textContent(),'104.0 MHz');
 await page.setViewportSize({width:1000,height:950});await page.screenshot({path:'output/radio-split/tuner-dial-desktop.png',fullPage:true});
 await page.locator('#reset').click();await tune(200);await tune(350);await tune(800);assert.equal(await page.evaluate(()=>window.completions),1);
 await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#rxTune').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#rxTune').inputValue(),'801');
 await tune(0);await page.locator('#rxPlus').click();assert.equal(await page.locator('#rxTune').inputValue(),'5');await page.locator('#rxMinus').click();assert.equal(await page.locator('#rxTune').inputValue(),'0');await tune(1000);assert.deepEqual(await page.locator('.dial-number').allTextContents(),['88','93','98','103','108']);await page.setViewportSize({width:390,height:850});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.screenshot({path:'output/radio-split/tuner-390.png',fullPage:true});
 console.log('Tuner: A/between/C guidance, AM/FM, bounds, keyboard, reduced motion and once-only completion passed.');
 assert.deepEqual(errors,[]);console.log('No browser script errors.');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
