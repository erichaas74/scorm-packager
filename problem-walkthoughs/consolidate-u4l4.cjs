// Build three standalone Rise activities from the detailed animation sources.
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, 'unit 4');
const read = name => fs.readFileSync(path.join(root, name + '.html'), 'utf8');
const deck = name => JSON.parse(read(name).match(/const slides=(\[.*?\]);let step=/s)[1]);
const energy = deck('u4l4-energy-visuals');
const design = deck('u4l4-design-visuals');
const evidence = deck('u4l4-evidence-visuals');
// Use prior work/energy skills in new contexts, with misconception-based choices.
energy[2].title='Account for every joule';
energy[2].setup='A fan motor receives 12 J electrically and delivers 9 J mechanically plus 1 J as sound.';
energy[2].q='How much energy is transferred into thermal energy?';
energy[2].choices=['2 J','3 J','10 J'];energy[2].correct=0;
energy[2].feedback='Energy is conserved: 12 − 9 − 1 = 2 J becomes thermal energy. The battery is the source; the motor converts electrical input into mechanical output, sound, and thermal energy.';
energy[3].setup='A flashlight receives 20 J electrically: 5 J becomes light and 15 J becomes thermal energy.';
energy[3].q='For illumination, what is its useful-energy efficiency?';
energy[3].choices=['75%','25%','400%'];energy[3].correct=1;
energy[3].feedback='Efficiency = useful output ÷ input × 100% = 5 ÷ 20 × 100% = 25%. Light is useful for illumination; the 75% thermal share is not the useful output for this task.';
design[0].setup='Practice brief: fit on one tabletop and finish unaided in at least 4 of 5 trials.';
design[0].q='Which design meets both the constraint and the success target?';
design[0].choices=['Fits the tabletop; succeeds in 3 of 5 trials','Extends off the tabletop; succeeds in 5 of 5 trials','Fits the tabletop; succeeds in 4 of 5 trials'];design[0].correct=2;
design[0].feedback='The design that fits the tabletop and succeeds in 4 of 5 trials meets both requirements. These numbers belong to this practice brief; set criteria appropriate to your own device.';
design[1].setup='Slowly lift a 0.40 kg flag by 0.30 m with a fixed pulley; use g = 10 N/kg and ignore friction.';
design[1].q='Which pull supplies the required force and distance?';
design[1].choices=['2 N through 0.30 m','4 N through 0.30 m','4 N through 0.15 m'];design[1].correct=1;
design[1].feedback='The flag weighs mg = 0.40 × 10 = 4 N; a fixed pulley redirects that force and requires 0.30 m of rope travel. The input work is Fd = 4 × 0.30 = 1.2 J, equal to the gain in gravitational potential energy.';
const plans = [
  {source:'rube-goldberg-energy-chain', file:'u4l4-consolidated-energy', title:'Follow the Energy', before:false, slides:energy.slice(2,4), bridge:'Continue: electrical examples', part:'Apply it: electrical devices', coreLabel:'Energy chain', end:'You traced stored energy, contact transfers, conversions, and useful outputs.'},
  {source:'rube-goldberg-repair-connection', file:'u4l4-consolidated-design', title:'Plan and Repair Your Device', before:true, slides:design.slice(0,2), bridge:'Start the repair challenges', part:'Plan your device', coreLabel:'Repair challenges', end:'You identified a goal, selected a simple machine, and tested repairs.'},
  {source:'rube-goldberg-testing-evidence', file:'u4l4-consolidated-evidence', title:'Test and Show Your Evidence', before:false, slides:[evidence[2]], bridge:'Continue: prepare your submission', part:'Show the whole device', coreLabel:'Testing evidence', end:'You compared fair trials and prepared evidence for your report and video.'}
];
const css = `
.merge-body{padding:16px 22px}.merge-body .merge-art svg{width:100%;height:auto;min-height:0;display:block}.merge-body .merge-art{background:#f4f8fb;border:1px solid #d1dce5;border-radius:12px;overflow:hidden}.merge-body h2{font-size:22px;margin:8px 0}.merge-body .merge-choices{display:flex;gap:10px;flex-wrap:wrap;margin:14px 0}.merge-body .merge-choices button{text-align:left;flex:1 1 210px;font-weight:650}.merge-body .merge-choices button:disabled{opacity:1}.merge-body .best{border:2px solid #23744e;background:#e4f2ea;color:#174e36}.merge-body .wrong{border:2px solid #946515;background:#fff2d6;color:#654614}.merge-body .merge-feedback{padding:12px;border-left:4px solid #285f9f;background:#edf4fc}.merge-body .merge-feedback:empty{display:none}.merge-body summary{cursor:pointer;font-weight:650;min-height:35px;padding:7px 0}.merge-body details{border-bottom:1px solid #cbd9e4;margin:8px 0}.merge-body details p{margin:8px 0}.merge-body .merge-controls{display:flex;gap:10px;flex-wrap:wrap;margin-top:16px}.merge-body .merge-progress{font-size:13px;font-weight:700;color:#285f9f}.merge-body .merge-zoom{display:none}.merge-body .merge-scroll{overflow:auto;border:1px solid #b9cbd7}.merge-body .merge-scroll svg{width:840px;max-width:none;min-height:0}.merge-body .merge-scroll:focus-visible{outline:3px solid #9b5900}.merge-completion{padding:16px 22px;background:#e9f4ed;border-top:1px solid #abc7b6}.merge-completion p{margin:4px 0}.merge-bridge{padding:16px 22px;border-top:1px solid #cbd9e4}.merge-core[hidden],.merge-body[hidden],.merge-bridge[hidden],.merge-completion[hidden]{display:none!important}@media(max-width:899px){.merge-body .merge-zoom{display:block}}@media(max-width:550px){.merge-body,.merge-bridge,.merge-completion{padding:12px}.merge-body .merge-choices{display:grid}.merge-body .merge-choices button{width:100%}.merge-body h2{font-size:19px}}
`;
function controller(config) {
  const $ = id => document.getElementById(id);
  const core = $('mergedCore'), module = $('mergedModule');
  let at = 0, answers = {}, coreDone = false, sent = false, active = config.before;
  const orders = config.slides.map(s => s.choices.map((label,i)=>({label,i})).sort(()=>Math.random()-.5));
  function complete() {
    const done = coreDone && Object.keys(answers).length === config.slides.length;
    $('mergedComplete').hidden = !done;
    if(done && !sent){sent=true;window.parent.postMessage({ type: 'complete' }, '*');}
  }
  function showModule(){active=true;core.hidden=true;module.hidden=false;$('mergedBridge').hidden=true;render();$('mergedTitle').focus();}
  function showCore(){active=false;core.hidden=false;module.hidden=true;$('mergedBridge').hidden=!coreDone||config.before;complete();const target=core.querySelector('h2,button');if(target)target.focus();}
  function namespace(svg, suffix){return svg.replace(/id="([^"]+)"/g,(_,id)=>`id="${suffix}-${id}"`).replace(/url\(#([^)]+)\)/g,(_,id)=>`url(#${suffix}-${id})`);}
  function extras(items) {
    $('mergedExtras').replaceChildren();
    for(const [title,html] of items||[]){const d=document.createElement('details'),s=document.createElement('summary'),body=document.createElement('div');s.textContent=title;body.innerHTML=namespace(html.startsWith('<svg')?html:'<p>'+html+'</p>','extra'+at);d.append(s,body);$('mergedExtras').append(d);}
  }
  function render(){
    const s=config.slides[at],done=at in answers;
    $('mergedProgress').textContent=config.part+' · '+(at+1)+' of '+config.slides.length;
    $('mergedTitle').textContent=s.title;$('mergedSetup').textContent=s.setup;
    const art=done&&s.reveal?s.reveal:s.art;
    $('mergedArt').innerHTML=namespace(art,'merged');$('mergedLarge').innerHTML=namespace(art,'large');
    $('mergedQuestion').textContent=s.q;$('mergedChoices').replaceChildren();
    for(const o of orders[at]){const b=document.createElement('button');b.type='button';b.textContent=(done&&o.i===s.correct?'Best answer: ':done&&o.i===answers[at]?'Your choice: ':'')+o.label;b.disabled=done;b.className=done&&o.i===s.correct?'best':done&&o.i===answers[at]?'wrong':'';b.onclick=()=>{answers[at]=o.i;render();complete();};$('mergedChoices').append(b);}
    $('mergedFeedback').textContent=done?(answers[at]===s.correct?'Correct. ':'Compare with the best answer. ')+s.feedback:'';
    extras(done?s.extra:[]);$('mergedBack').hidden=at===0;$('mergedNext').disabled=!done;
    $('mergedNext').textContent=at<config.slides.length-1?'Next example':config.before?config.bridge:'Review '+config.coreLabel.toLowerCase();
    if(done && !config.before && at===config.slides.length-1 && config.report){extras(config.report);}
  }
  $('mergedNext').onclick=()=>{$('mergedZoom').open=false;if(at<config.slides.length-1){at++;render();$('mergedTitle').focus();}else showCore();};
  $('mergedBack').onclick=()=>{$('mergedZoom').open=false;at--;render();$('mergedTitle').focus();};
  $('mergedContinue').onclick=showModule;
  document.addEventListener('u4-core-complete',()=>{coreDone=true;$('mergedBridge').hidden=config.before||active;complete();});
  $('reset').addEventListener('click',()=>{at=0;answers={};coreDone=false;sent=false;$('mergedComplete').hidden=true;$('mergedBridge').hidden=true;$('mergedZoom').open=false;config.before?showModule():showCore();});
  config.before?showModule():showCore();
}
for(const p of plans){
  let html=read(p.source);
  html=html.replace(/<title>[^<]+<\/title>/,`<title>${p.title} | Unit 4 Lesson 4</title>`).replace(/<h1>[^<]+<\/h1>/,`<h1>${p.title}</h1>`);
  html=html.replace('</style>',css+'</style>');
  // Defer Rise completion until the main animation and unique applications are explored.
  html=html.replace(/window\.parent\.postMessage\(\s*\{\s*type\s*:\s*['"]complete['"]\s*\}\s*,\s*['"]\*['"]\s*\)/g,"document.dispatchEvent(new Event('u4-core-complete'))");
  html=html.replaceAll("$('reset').addEventListener('click',()=>{", "$('reset').addEventListener('click',()=>{sent=false;");
  if(p.source.includes('testing'))html=html.replace('function reset(){stop();','function reset(){sent=false;stop();');
  if(p.source.includes('energy')){
    html=html.replace('const stages=[','let selectedAnswer=null;\nconst stages=[');
    html=html.replace("phase='predict';$('step')", "phase='predict';selectedAnswer=null;$('step')");
    html=html.replace("attempted[stage]=true;", "attempted[stage]=true;selectedAnswer=i;");
    html=html.replace("$('feedback').textContent=stages[stage].feedback;", "$('feedback').textContent=(selectedAnswer===stages[stage].correct?'Correct. ':'Best answer: '+stages[stage].options[stages[stage].correct]+'. ')+stages[stage].feedback;");
    html=html.replace("ask:'What energy is stored because the ball is raised?',options:['Kinetic energy','Gravitational potential energy','Thermal energy'],correct:1", "ask:'A 0.050 kg ball is raised 0.80 m above the ramp exit. Using g = 9.8 N/kg, how much gravitational potential energy is added?',options:['0.040 J','0.392 J','3.92 J'],correct:1");
    html=html.replace('The ball–Earth system stores gravitational potential energy. Lifting the ball during setup required work.','ΔE = mgΔh = 0.050 × 9.8 × 0.80 = 0.392 J. Lifting the ball requires work that increases the gravitational potential energy of the ball–Earth system.');
    html=html.replace("ask:'As the ball rolls down, how do its gravitational and kinetic energies change?',options:['Gravitational ↓; kinetic ↑','Both increase','Gravitational ↑; kinetic ↓'],correct:0", "ask:'The ball starts from rest with 0.392 J above the exit. If 0.080 J becomes thermal energy and sound, what total kinetic energy remains at the exit?',options:['0.312 J','0.392 J','0.472 J'],correct:0");
    html=html.replace('Gravitational potential energy decreases as kinetic energy increases. The rolling ball has kinetic energy in both its forward motion and its rotation.','A transformation changes energy from one form to another: gravitational potential energy decreases as kinetic energy increases. The ball has kinetic energy in both forward motion and rotation.');
    html=html.replace('A transformation changes energy from one form to another: gravitational potential energy decreases as kinetic energy increases. The ball has kinetic energy in both forward motion and rotation.','Kinetic energy = 0.392 − 0.080 = 0.312 J, including forward motion and rotation. This transformation changes energy from gravitational potential into kinetic, thermal, and sound forms.');
    html=html.replace('Contact transfers energy from the ball to the first domino and onward through the line.','A transfer moves energy between objects, here by contact from ball to domino and onward.');
    html=html.replace('Complete: all four predictions and reveals explored.','Energy chain explored. Continue to the electrical examples below.');
    p.slides[0].extra=[['Other energy stores','A battery stores chemical energy; a stretched rubber band stores elastic potential energy. Setting up your device transfers energy into its stores.']];
  }
  if(p.source.includes('repair')){
    html=html.replace('<section id="reflection"', '<section id="reflection"');
    const tip=`<details style="margin:12px 0"><summary>Another design trade-off: guide rails</summary><p>Rails can improve alignment, but added contact may increase friction. Test repeated runs; a longer ramp adds no gravitational potential energy when the vertical drop stays the same.</p></details>`;
    html=html.replace(/(<textarea[^>]*id="connection"[\s\S]*?<\/textarea>)/, '$1'+tip);
  }
  if(p.source.includes('testing')){
    html=html.replace('function answer(){','function answer(chosen){');
    html=html.replace("$('feedback').textContent=questions[q].feedback;", "$('feedback').textContent=(chosen===questions[q].options[[1,1,2][q]]?'Correct. ':'Best answer: '+questions[q].options[[1,1,2][q]]+'. ')+questions[q].feedback;");
    html=html.replace("$('status').textContent='Use the five recorded pairs below.'", "$('status').textContent=q===0?'Use the five recorded pairs below.':'Use the supplied measurements in this question.'");
    html=html.replace("ask:'Which conclusion is supported?',options:['It will always work','Contact improved: 2 of 5 → 4 of 5','Every contact completed the task']", "ask:'For the adjusted design, which pair correctly separates contact success from final-task success?',options:['80% contact; 80% final task','80% contact; 60% final task','60% contact; 80% final task']");
    html=html.replace('Contact improved from 2 of 5 to 4 of 5 in these example trials. Original trial 5 and adjusted trial 4 show that contact did not always complete the task.','Adjusted contact success is 4 ÷ 5 = 80%, while final-task success is 3 ÷ 5 = 60%. Trial 4 made contact but did not finish, so contact cannot stand in for whole-device success.');
    html=html.replace("ask:'Do 4 of 5 successful contacts mean 80% energy efficiency?',options:['Yes, success measures energy efficiency','No, this is contact success','Yes, four trials used no energy']", "ask:'Separate measurements on one successful run give 0.60 J total input and 0.18 J useful car output. What is the energy efficiency?',options:['80%','30%','60%']");
    html=html.replace('Four of five is 80% observed contact success, not energy efficiency. Efficiency requires input-energy and useful-output-energy measurements, which these records do not provide.','Contact success describes reliability; it does not measure energy efficiency or power. Efficiency compares useful output energy with input energy, while power is energy transferred per unit time.');
    html=html.replace('Contact success describes reliability; it does not measure energy efficiency or power. Efficiency compares useful output energy with input energy, while power is energy transferred per unit time.','Efficiency = 0.18 ÷ 0.60 × 100% = 30%. The 80% contact and 60% final-task success rates describe repeated performance, not energy efficiency.');
    html=html.replace("ask:'What should be tested next?',options:['Stop testing; it is reliable','Count contacts as completed tasks','Investigate failures; repeat and track task success']", "ask:'Another run uses the same 0.60 J input and delivers the same 0.18 J useful output, but takes 1.5 s instead of 3.0 s. What changes?',options:['Both useful power and efficiency double','Useful power halves; efficiency stays 30%','Useful power doubles; efficiency stays 30%']");
    html=html.replace('Investigate the remaining failures, repeat trials, and track whole-device success separately. The final task succeeded in 1 of 5 original trials and 3 of 5 adjusted trials.','Average useful power rises from 0.18 ÷ 3.0 = 0.060 W to 0.18 ÷ 1.5 = 0.120 W. Energy efficiency stays 30% because the input and useful output energies are unchanged.');
    html=html.replace('These examples suggest improved contact, not guaranteed future performance. Energy efficiency cannot be established without energy measurements.','Repeat tests and investigate failures before claiming reliability. The supplied energy measurements are separate practice data; use your own observations in your report.');
    html=html.replace('Only ramp alignment changed. The ball, release height, release method, surface, and domino positions stayed fixed.','Alignment is the independent variable; contact and final-task success are dependent variables. Ball, release height, release method, surface, and domino positions stayed fixed as controls.');
    html=html.replace('Complete: five paired trials and three interpretations explored.','Trials explored. Continue below to prepare your submission.');
    p.report=[...evidence[1].extra,...evidence[2].extra,['Fair-test notes','Define success before testing and record failures as well as successes. Keep conditions consistent and include units with any measured times or distances.'],['Compare the measures','Reliability: successful runs out of attempts. Efficiency: useful output energy ÷ input energy × 100%. Power: energy transferred ÷ time. Use your own trial records; numerical efficiency is not required without energy measurements.']];
  }
  html=html.replace('</header>','</header><div id="mergedCore" class="merge-core">');
  const start=html.indexOf('<script>');
  const markup=`</div><section id="mergedBridge" class="merge-bridge" hidden><button id="mergedContinue" class="primary">${p.bridge}</button></section><section id="mergedModule" class="merge-body" hidden><p id="mergedProgress" class="merge-progress"></p><h2 id="mergedTitle" tabindex="-1"></h2><p id="mergedSetup"></p><div id="mergedArt" class="merge-art"></div><details id="mergedZoom" class="merge-zoom"><summary>Enlarge diagram</summary><p>Swipe sideways, or use arrow keys within the diagram.</p><div id="mergedLarge" class="merge-scroll" tabindex="0" role="region" aria-label="Enlarged diagram"></div></details><h2 id="mergedQuestion"></h2><div id="mergedChoices" class="merge-choices" role="group" aria-labelledby="mergedQuestion"></div><p id="mergedFeedback" class="merge-feedback" role="status"></p><div id="mergedExtras"></div><div class="merge-controls"><button id="mergedBack">Back</button><button id="mergedNext" class="primary">Next example</button></div></section><section id="mergedComplete" class="merge-completion" role="status" hidden><strong>Activity complete</strong><p>${p.end}</p></section>`;
  html=html.slice(0,start)+markup+html.slice(start);
  html=html.replace('</main>',`<script>(${controller.toString()})(${JSON.stringify(p).replace(/<\/script/gi,'<\\/script')});</script></main>`);
  fs.writeFileSync(path.join(root,p.file+'.html'),html);
  console.log(p.file+'.html');
}
