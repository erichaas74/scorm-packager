from pathlib import Path
src = Path('tmp/test-circuit-fixes.cjs').read_text()
head = src[:src.index('    const root=')]
head = head.replace("path.join(__dirname, 'work-sign-browser-')", "path.join(process.cwd(), 'tmp', 'phet-test-browser-')")
head = head.replace("stdio: 'ignore'", "stdio: ['ignore','ignore','pipe']")
head = head.replace('  let ws;', "  let launchErrors = ''; chrome.stderr.on('data', data => { launchErrors += data; });\n  let ws;")
head = head.replace("const port = fs.readFileSync", "if (!fs.existsSync(portFile)) throw new Error('Chrome did not start: '+launchErrors);\n    const port = fs.readFileSync")
tests = r'''
    const root=path.resolve('unit-ApplicationFiles/unit-6/circuit-design-challenge');
    await send('Runtime.enable');
    const errors=[];
    const originalMessage=ws.onmessage;
    ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);originalMessage(e);};
    async function load(file) {
      await send('Page.navigate',{url:pathToFileURL(path.join(root,file)).href});
      for(let n=0;n<50;n++) { await delay(100); if(await evaluate("document.querySelectorAll('[data-mission]').length===8"))return; }
      throw new Error('App did not load');
    }
    for (const file of ['index.html','u6l3-circuit-design-buzz-assessment-template-preview.html']) {
      await load(file);
      await evaluate("localStorage.removeItem('u6l3-phet-notebook-v2')");
      await load(file);
      assert.equal(await evaluate("document.querySelector('#progressPercent').textContent"),'0%');
      assert.equal(await evaluate("document.querySelectorAll('canvas,#recordEvidence').length"),0);
      for(const width of [390,1200]) {
        await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
        for(let m=0;m<8;m++) {
          await evaluate(`document.querySelector('[data-mission="${m}"]').click()`);
          assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'),`${file} ${width} mission ${m} overflow`);
          assert(await evaluate("document.querySelector('#buildSteps').children.length>=3"));
        }
        await evaluate("document.querySelector('[data-mission=\"0\"]').click()");
        fs.writeFileSync(path.join(root, 'phet-'+(file==='index.html'?'source':'preview')+'-'+width+'.png'),Buffer.from((await send('Page.captureScreenshot')).data,'base64'));
      }
      for(let m=0;m<8;m++) {
        await evaluate(`document.querySelector('[data-mission="${m}"]').click();document.querySelectorAll('#missionEvidence [data-evidence]').forEach(el=>{el.value=el.tagName==='SELECT'?el.options[1].value:el.type==='number'?'9':'Observed in PhET';el.dispatchEvent(new Event('input',{bubbles:true}));});`);
      }
      assert.equal(await evaluate("document.querySelector('#progressPercent').textContent"),'100%');
      await evaluate("document.querySelector('#prediction').value='My prediction';document.querySelector('#prediction').dispatchEvent(new Event('input'));document.querySelector('#observation').value='My wiring repair';document.querySelector('#observation').dispatchEvent(new Event('input'));");
      await load(file);
      assert.equal(await evaluate("document.querySelector('#prediction').value"),'My prediction');
      assert.equal(await evaluate("document.querySelector('#observation').value"),'My wiring repair');
      await evaluate("document.querySelector('#openNotebook').click();document.querySelector('[data-evidence=p8_total_current]').value='2.7';document.querySelector('[data-evidence=p8_total_current]').dispatchEvent(new Event('input'));");
      await evaluate("document.querySelector('[data-view=report]').click()");
      assert(await evaluate("document.querySelector('#reportEvidence').textContent.includes('2.7')"));
      await evaluate("window.exportBlob=null;URL.createObjectURL=b=>{window.exportBlob=b;return 'blob:test'};HTMLAnchorElement.prototype.click=function(){};document.querySelector('#downloadReport').click()");
      const exported=await send('Runtime.evaluate',{expression:'exportBlob.text()',awaitPromise:true,returnByValue:true});
      assert(exported.result.value.includes('My wiring repair'));
      assert(exported.result.value.includes('2.7 A'));
      await evaluate("document.querySelector('[data-view=bench]').click();document.querySelector('[data-evidence=p8_total_current]').value='-1';document.querySelector('[data-evidence=p8_total_current]').dispatchEvent(new Event('input'));");
      assert.equal(await evaluate("document.querySelector('#progressPercent').textContent"),'88%');
      await evaluate("Storage.prototype.setItem=function(){throw new Error('quota')};document.querySelector('#prediction').dispatchEvent(new Event('input'))");
      assert(await evaluate("document.querySelector('#saveStatus').textContent.includes('could not be saved')"));
      console.log('PASS '+file+': 8 missions, 390/1200 layout, manual evidence, reload, notebook edits, report export, invalid numbers, storage failure');
    }
    assert.equal(errors.length,0,JSON.stringify(errors));
  }finally{ws?.close();chrome.kill();}
})().catch(e=>{console.error(e);process.exit(1)});
'''
Path('unit-ApplicationFiles/unit-6/circuit-design-challenge/test-phet-workflow.cjs').write_text(head+tests, encoding='utf-8')
