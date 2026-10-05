from pathlib import Path
import re
p=Path('unit-ApplicationFiles/unit-6/dynamic-electric-field-lab/dynamic_electric_field_lab.html')
old=p.read_text(encoding='utf-8')
script=old.split('<script>')[1].split('</script>')[0]
css='''
:root { color-scheme: light; --ink:#183044; --line:#c9d2d8; }
* { box-sizing:border-box; }
body { margin:0; background:#eef1f3; color:var(--ink); font:16px/1.45 Arial,sans-serif; }
button,select,input { font:inherit; }
button,a,input,select { touch-action:manipulation; }
button { min-height:42px; padding:8px 12px; border:1px solid #a8b6c0; border-radius:6px; background:#fff; color:var(--ink); cursor:pointer; }
button:hover { background:#edf4f8; } button:disabled { opacity:.5; cursor:not-allowed; }
:focus-visible { outline:3px solid #147da8; outline-offset:3px; }
.ef-lab { max-width:1240px; margin:auto; background:#fff; min-height:100vh; padding:18px clamp(12px,3vw,30px) 32px; }
header { display:flex; align-items:center; justify-content:space-between; gap:18px; margin-bottom:12px; }
h1 { font-size:clamp(1.35rem,3vw,1.85rem); margin:0; } h2 { font-size:1.2rem; margin:0 0 8px; }
h3 { font-size:1.05rem; margin:0; } p { margin:6px 0; }
.ef-progress-card { width:250px; max-width:100%; font-size:.85rem; }
.ef-progress-line { display:flex; justify-content:space-between; gap:12px; }
.ef-progress-track { height:6px; background:#e0e7eb; border-radius:5px; margin:5px 0; overflow:hidden; }
.ef-progress-fill { height:100%; background:#237954; width:0; }
#ef-save-status { font-size:.73rem; color:#506372; }
.ef-challenge-tabs { display:flex; gap:6px; overflow-x:auto; padding:3px 3px 10px; }
.ef-challenge-tab { flex:0 0 auto; text-align:left; font-size:.85rem; }
.ef-challenge-tab small { display:block; font-size:.67rem; color:#4c6372; }
.ef-challenge-tab.active { border:2px solid #14678e; background:#e8f3f9; }
.ef-challenge-tab.complete small { color:#216542; }
.ef-objective { margin:0 0 10px; } .ef-objective p { font-size:.9rem; }
.ef-rule { color:#415765; font-size:.84rem; }
.ef-workspace { display:grid; grid-template-columns:minmax(0,1fr) 270px; gap:14px; align-items:start; }
.ef-canvas-shell { position:relative; min-width:0; height:520px; overflow:hidden; border:1px solid #aebdc5; border-radius:8px; background:#f3f6f7; }
.ef-canvas { display:block; width:100%; height:100%; touch-action:none; }
.ef-control-panel { min-width:0; display:grid; gap:12px; font-size:.85rem; }
.ef-source-buttons,.ef-button-row { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
.ef-source-button.positive { border-color:#aa3838; color:#972c2c; }
.ef-source-button.negative { border-color:#2362a3; color:#21578c; }
.ef-button.green { background:#216e4c; border-color:#216e4c; color:#fff; }
.ef-field-toggle { display:flex; gap:8px; align-items:center; }
.ef-status { padding:8px; background:#edf3f6; border-radius:6px; min-height:38px; }
.ef-status.bad { background:#fff0ee; color:#982f26; }
.ef-status.good { background:#edf7f0; color:#216542; }
.ef-charge-editor { border:1px solid var(--line); border-radius:6px; padding:9px; margin:0; min-width:0; }
.ef-charge-editor label { display:block; margin-bottom:6px; }
.ef-charge-editor select { width:100%; min-height:38px; }
.ef-position-inputs { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
.ef-position-inputs input { width:100%; min-height:38px; }
.ef-help { font-size:.8rem; color:#455c6b; }
.ef-readouts { display:flex; flex-wrap:wrap; gap:8px 18px; margin:8px 0; font-size:.83rem; }
.ef-readouts span { white-space:nowrap; }
.ef-model-note { font-size:.8rem; color:#455c6b; margin-top:5px; }
.ef-toast { position:absolute; bottom:12px; left:12px; right:12px; background:#9b302a; color:#fff; padding:10px; border-radius:6px; opacity:0; pointer-events:none; }
.ef-toast.show { opacity:1; }
.ef-modal { position:absolute; inset:0; display:grid; place-items:center; padding:16px; background:#e8eff0e8; }
.ef-modal[hidden] { display:none; }
.ef-modal-card { background:white; border:2px solid #357b58; border-radius:8px; padding:20px; width:min(380px,100%); }
.ef-modal-actions { display:flex; flex-wrap:wrap; gap:8px; margin-top:12px; }
#ef-evidence,#ef-questions { margin-top:24px; min-width:0; }
.ef-evidence-actions { display:flex; flex-wrap:wrap; gap:8px; margin-top:10px; }
.ef-table-wrap { overflow-x:auto; border:1px solid var(--line); border-radius:6px; }
table { border-collapse:collapse; width:100%; font-size:.86rem; }
th,td { text-align:left; padding:10px; vertical-align:top; border-bottom:1px solid var(--line); }
th { background:#edf3f6; } td:first-child { min-width:100px; }
tr.active { background:#eef7fc; } .ef-complete-text { color:#216542; }
.ef-pending-text,.ef-feedback { color:#536977; }
.ef-snapshot { padding:10px; background:#edf5f8; border-left:3px solid #287494; margin:10px 0; font-size:.87rem; }
.ef-snapshot p { margin:4px 0; }
.ef-slot { padding:14px 0; border-top:1px solid var(--line); }
.ef-slot-label { font-size:.9rem; font-weight:bold; }
.ef-local-note { font-size:.85rem; color:#536977; }
.ef-sr-only { position:absolute!important; width:1px; height:1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; }
@media(max-width:760px) {
 header { display:block; } .ef-progress-card { margin-top:8px; width:100%; }
 .ef-workspace { grid-template-columns:minmax(0,1fr); }
 .ef-canvas-shell { height:440px; }
 .ef-control-panel { grid-template-columns:repeat(2,minmax(0,1fr)); }
 .ef-charge-editor,.ef-status,.ef-help { grid-column:1/-1; }
}
@media(max-width:420px) { .ef-control-panel { grid-template-columns:minmax(0,1fr); } th,td { padding:7px; } }
@media print { button,.ef-control-panel { display:none; } .ef-workspace { display:block; } }
'''
body='''
<div class="ef-lab" id="electric-field-buzz-lab">
<header>
 <h1>Electric-Field Motion Lab</h1>
 <div class="ef-progress-card" aria-label="Core challenge progress">
  <div class="ef-progress-line"><span id="ef-progress-label">Core challenges 0/3</span><strong id="ef-progress-percent">0%</strong></div>
  <div class="ef-progress-track" id="ef-progress-bar" role="progressbar" aria-label="Core challenge completion" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="ef-progress-fill" id="ef-progress-fill"></div></div>
  <span id="ef-save-status">Progress saves in this tab</span>
 </div>
</header>
<main>
 <section id="ef-simulator" aria-label="Electric-field experiment">
  <div class="ef-challenge-tabs" id="ef-challenge-tabs" role="group" aria-label="Choose a challenge"></div>
  <div class="ef-objective"><h2 id="ef-level-title">Challenge 1: Repel</h2><p id="ef-level-description"></p><p class="ef-rule" id="ef-level-rule"></p></div>
  <div class="ef-workspace">
   <div>
    <div class="ef-canvas-shell" id="ef-canvas-shell">
     <canvas class="ef-canvas" id="ef-canvas" tabindex="0" role="img" aria-label="Electric-field motion arena" aria-describedby="ef-canvas-directions ef-canvas-summary">Use the charge position controls to edit the field.</canvas>
     <p class="ef-sr-only" id="ef-canvas-summary"></p>
     <div class="ef-toast" id="ef-toast" role="status"></div>
     <div class="ef-modal" id="ef-success-modal" hidden>
      <div class="ef-modal-card" role="group" aria-labelledby="ef-success-title"><h3 id="ef-success-title">Target reached</h3><p id="ef-success-message"></p>
       <div class="ef-modal-actions"><button id="ef-keep-testing" type="button">Keep testing</button><button class="ef-button green" id="ef-next-level" type="button">Next challenge</button></div>
      </div>
     </div>
    </div>
    <div class="ef-readouts"><span>Speed: <strong id="ef-speed">0 model units/s</strong></span><span id="ef-direction">At rest</span></div>
    <p id="ef-vector-values" class="ef-help"></p>
    <p class="ef-model-note">E = electric field; F = electric force; a = electric acceleration; v = velocity. Arrow lengths use separate display scales. This model uses a positive unit charge and unit mass, accelerated time, and light damping.</p>
   </div>
   <aside class="ef-control-panel" aria-label="Charge and motion controls">
    <div class="ef-source-buttons"><button class="ef-source-button positive" id="ef-add-positive" type="button">+ Add source</button><button class="ef-source-button negative" id="ef-add-negative" type="button">− Add source</button></div>
    <div class="ef-button-row"><button class="ef-button green" id="ef-start-motion" type="button">Start motion</button><button id="ef-reset-motion" type="button">Reset particle</button></div>
    <fieldset class="ef-charge-editor"><legend>Edit a source</legend>
     <label>Selected source<select id="ef-charge-select" aria-label="Selected source"></select></label>
     <label>Sign<select id="ef-charge-sign"><option value="1">Positive (+)</option><option value="-1">Negative (−)</option></select></label>
     <div class="ef-position-inputs"><label>From left (%)<input id="ef-charge-x" type="number" min="0" max="100" step="0.1"></label><label>From top (%)<input id="ef-charge-y" type="number" min="0" max="100" step="0.1"></label></div>
     <button id="ef-apply-position" type="button">Apply position</button>
    </fieldset>
    <div class="ef-button-row"><button id="ef-remove-selected" type="button" disabled>Remove selected</button><button id="ef-clear-charges" type="button">Clear sources</button></div>
    <label class="ef-field-toggle"><input id="ef-show-field" type="checkbox" checked> Show field grid</label>
    <p class="ef-help" id="ef-canvas-directions">Add a source, then drag it or enter its position. On the arena, use arrows to move the selected source; Shift moves farther. [ and ] select other sources.</p>
    <div class="ef-status" id="ef-status" role="status" aria-live="polite"></div>
   </aside>
  </div>
 </section>
 <section id="ef-evidence" aria-labelledby="ef-evidence-heading">
  <h2 id="ef-evidence-heading">Saved designs</h2><p id="ef-evidence-message"></p>
  <div class="ef-table-wrap"><table><thead><tr><th scope="col">Challenge</th><th scope="col">Successful arrangement</th><th scope="col">Run</th></tr></thead><tbody id="ef-evidence-rows"></tbody></table></div>
  <div class="ef-evidence-actions"><button id="ef-download-evidence" type="button" disabled>Download evidence PNG (optional)</button><button id="ef-reset-progress" type="button">Reset all progress</button></div>
  <p id="ef-export-status" class="ef-feedback" role="status"></p>
 </section>
 <section id="ef-questions" tabindex="-1" aria-labelledby="ef-questions-heading">
  <h2 id="ef-questions-heading">Questions</h2>
  <p>Complete Challenges 1–3, then answer below. Your saved arrangements also appear beside Questions 7–8.</p>
  <p class="ef-local-note" id="ef-local-note" hidden>Response controls appear in Buzz. Use the generated preview to review the questions locally.</p>
'''
labels=['Field direction','Force direction','Field, force, and acceleration','Calculate force','Add perpendicular fields','Explain the curved path','One-charge design','Curved-path conclusion']
for i,label in enumerate(labels,1):
    body+=f'<div class="ef-slot"><p class="ef-slot-label">{i}. {label}</p>'
    if i in (7,8): body+=f'<div class="ef-snapshot" id="ef-question-{i}-evidence"></div>'
    body+='<a:question></a:question></div>\n'
body+='</section></main><p class="ef-sr-only" id="ef-live-status" role="status" aria-live="polite"></p></div>'

# Save drafts independently of immutable successful arrangements; migrate old counts honestly.
script=script.replace('var STATE_VERSION = 1;', 'var STATE_VERSION = 2;')
script=script.replace('records: LEVELS.map(function () { return null; })','records: LEVELS.map(function () { return null; }), drafts: LEVELS.map(function () { return []; })')
script=script.replace('saved.version !== STATE_VERSION || ', '')
script=script.replace('      return saved;', '''      saved.version = STATE_VERSION;
      if (!Array.isArray(saved.drafts)) saved.drafts = LEVELS.map(function () { return []; });
      while (saved.drafts.length < LEVELS.length) saved.drafts.push([]);
      return saved;''')
script=script.replace("return state.records.slice(0, CORE_COUNT).filter(Boolean).length;", "return state.records.slice(0, CORE_COUNT).filter(function (record) { return record && Array.isArray(record.charges); }).length;")
script=script.replace("button.setAttribute('role', 'tab');", "button.setAttribute('aria-pressed', index === state.selected ? 'true' : 'false');")
script=script.replace("      button.setAttribute('aria-selected', index === state.selected ? 'true' : 'false');\n",'')
script=script.replace("(state.records[index] ?", "(state.records[index] && state.records[index].charges ?")
script=script.replace("    $('#ef-evidence-tag').textContent = evidenceReady() ? 'Ready to download' : complete + ' of ' + CORE_COUNT + ' core complete';\n",'')
script=script.replace("$('#ef-evidence-heading').textContent = evidenceReady() ? 'Core challenge evidence complete' : 'Complete the three core challenges';", "$('#ef-evidence-heading').textContent = 'Saved designs';")
script=script.replace("'Core evidence is complete. Keep this table visible while answering; the PNG download is optional.' : 'Successful runs are recorded automatically. Optional extension runs also appear in the evidence table.'", "'All three core designs are saved. Continue to the questions below.' : 'Successful arrangements save automatically in this tab. Later edits do not change a saved run until you reach the target again.'")
start=script.index('  function renderEvidenceTable()')
end=script.index('  function drawArrow',start)
script=script[:start]+'''  function describeCharges(charges) {
    return charges.map(function (charge, index) { return 'Source ' + (index + 1) + ': ' + (charge.q > 0 ? 'positive (+)' : 'negative (−)') + ', ' + round(charge.fx * 100, 1) + '% from left, ' + round(charge.fy * 100, 1) + '% from top'; }).join('; ');
  }
  function recordDescription(index) {
    var record = state.records[index];
    if (!record) return 'No successful run saved.';
    if (!record.charges) return 'Earlier completion retained, but positions were not saved. Run this challenge again to record the arrangement.';
    return describeCharges(record.charges) + '. Positive launch: ' + round(record.launch.fx * 100, 1) + '% from left, ' + round(record.launch.fy * 100, 1) + '% from top. Target: ' + round(record.target.fx * 100, 1) + '% from left, ' + round(record.target.fy * 100, 1) + '% from top.' + (index === 2 ? ' Barrier: 46–53% from left, 22–78% from top.' : '');
  }
  function renderEvidenceTable() {
    $('#ef-evidence-rows').innerHTML = LEVELS.map(function (level, index) {
      var record = state.records[index];
      return '<tr' + (index === state.selected ? ' class="active" aria-current="true"' : '') + '><th scope="row">' + (index + 1) + '. ' + escapeHtml(level.shortTitle) + (index >= CORE_COUNT ? ' (optional)' : '') + '</th><td>' + escapeHtml(recordDescription(index)) + '</td><td>' + (record ? escapeHtml(record.targetSpeed + ' model units/s; ' + (record.attempt || state.attempts[index] || 0) + ' attempt(s)') : 'Not recorded') + '</td></tr>';
    }).join('');
    $('#ef-question-7-evidence').innerHTML = '<strong>Saved one-charge evidence</strong><p>Challenge 1: ' + escapeHtml(recordDescription(0)) + '</p><p>Challenge 2: ' + escapeHtml(recordDescription(1)) + '</p>';
    $('#ef-question-8-evidence').innerHTML = '<strong>Saved Challenge 3 evidence</strong><p>' + escapeHtml(recordDescription(2)) + '</p>';
  }

''' +script[end:]
# resize uses existing normalized positions, no forced .04 snap
script=script.replace('clamp(charge.fx, .04, .96)', 'charge.fx').replace('clamp(charge.fy, .04, .96)', 'charge.fy')
script=script.replace('this.selectedCharge = null; this.updateControls(); this.render();', "this.selectedCharge = this.userCharges()[0] || null; if ($('#ef-success-modal')) $('#ef-success-modal').hidden = true; this.updateControls(); this.render();",1)
script=script.replace('    state.selected = clamp(index, 0, LEVELS.length - 1); saveState();','''    if (this.loaded) this.saveDraft();
    state.selected = clamp(index, 0, LEVELS.length - 1); saveState();''')
script=script.replace('    LEVELS[state.selected].setup(this);\n    $(\'#ef-level-title\')', '''    LEVELS[state.selected].setup(this);
    var appRef = this;
    (state.drafts[state.selected] || []).forEach(function (charge) { appRef.charges.push({x:charge.fx * appRef.width, y:charge.fy * appRef.height, q:charge.q, fixed:false, radius:18}); });
    this.selectedCharge = this.userCharges()[0] || null; this.loaded = true;
    $('#ef-level-title')''')
script=re.sub(r"    \$\('#ef-current-tag'\).*?\n",'',script)
script=script.replace("'Add at least one source charge, drag it into position, then start the motion.'", "'Arrange the sources, then start motion.'")
script=script.replace("if (shouldAnnounce !== false) announce(LEVELS[state.selected].title + ' loaded.');", "if (shouldAnnounce !== false) { announce(LEVELS[state.selected].title + ' loaded.'); this.canvas.focus(); }")
marker='  ElectricFieldApp.prototype.addCharge = function (sign) {'
script=script.replace(marker,'''  ElectricFieldApp.prototype.saveDraft = function () {
    var appRef = this;
    state.drafts[state.selected] = this.userCharges().map(function (charge) { return {fx:charge.x/appRef.width, fy:charge.y/appRef.height, q:charge.q}; });
    saveState();
  };
  ElectricFieldApp.prototype.syncEditor = function () {
    var users = this.userCharges(); var selected = this.selectedCharge;
    $('#ef-charge-select').innerHTML = users.length ? users.map(function (charge, index) { return '<option value="' + index + '">Source ' + (index + 1) + (charge.q > 0 ? ' (+)' : ' (−)') + '</option>'; }).join('') : '<option value="">Add a source</option>';
    $('#ef-charge-select').value = selected ? String(users.indexOf(selected)) : '';
    $('#ef-charge-sign').value = selected ? String(selected.q) : '1';
    $('#ef-charge-x').value = selected ? round(selected.x / this.width * 100, 1) : '';
    $('#ef-charge-y').value = selected ? round(selected.y / this.height * 100, 1) : '';
    ['ef-charge-select','ef-charge-sign','ef-charge-x','ef-charge-y','ef-apply-position'].forEach(function (id) { $('#' + id).disabled = this.isPlaying || !selected; }, this);
  };
''' +marker)
script=script.replace("this.updateControls(); this.render(); this.canvas.focus();", "this.updateControls(); this.saveDraft(); this.render(); this.canvas.focus();")
script=script.replace('this.selectedCharge = null; this.updateControls(); this.render();\n  };', 'this.selectedCharge = this.userCharges()[0] || null; this.updateControls(); this.saveDraft(); this.render();\n  };')
script=script.replace("this.setStatus('Movable source charges cleared.', ''); this.updateControls(); this.render();", "this.setStatus('Working sources cleared; saved successful evidence is unchanged.', ''); this.updateControls(); this.saveDraft(); this.render();")
script=script.replace('this.isPlaying = true; this.selectedCharge = null;', 'this.saveDraft(); this.isPlaying = true;')
script=script.replace('    var disabled = this.isPlaying;', '    this.syncEditor();\n    var disabled = this.isPlaying;')
script=script.replace('    state.records[state.selected] = { positive:', '''    var appRef = this;
    var snapshot = users.map(function (charge) { return {fx:charge.x/appRef.width, fy:charge.y/appRef.height, q:charge.q}; });
    state.records[state.selected] = { charges:snapshot, launch:{fx:this.testCharge.initialX/this.width, fy:this.testCharge.initialY/this.height}, target:{fx:this.targetZone.x/this.width, fy:this.targetZone.y/this.height}, arena:{width:this.width,height:this.height}, attempt:state.attempts[state.selected], positive:''')
script=script.replace("$('#ef-success-message').textContent = LEVELS[state.selected].success; $('#ef-next-level').textContent = state.selected === LEVELS.length - 1 ? 'Return to challenge 1' : 'Next challenge'; $('#ef-success-modal').hidden = false;", "$('#ef-success-message').textContent = evidenceReady() ? 'All three core designs are saved. Continue to the questions, or keep testing.' : 'This design is saved. Complete the remaining core challenges before answering.'; $('#ef-next-level').textContent = evidenceReady() ? 'Answer questions' : 'Next core challenge'; $('#ef-success-modal').hidden = false; $('#ef-next-level').focus();")
# distinguish four vectors; keep them off overlaid HUDs (readouts are below canvas).
script=script.replace("this.ctx.globalAlpha = .48", "this.ctx.globalAlpha = .7").replace("'#8dc8e1', 1.2", "'#487586', 1.4")
script=script.replace("'#7ce3ad'", "'#216542'").replace("'#49d795'", "'#28794d'")
script=script.replace("'rgba(245, 200, 75, .62)'", "'#996e16'")
script=script.replace("ctx.strokeStyle = '#f5c84b'", "ctx.strokeStyle = '#132e44'")
script=script.replace("'#071721'", "'#263f50'")
script=script.replace("+ ' units/s'", "+ ' model units/s'")
script=script.replace("speed < 1 ? 'Ready'", "speed < 1 ? 'At rest'")
insert='''    if (this.testCharge) {
      var t = this.testCharge; var field = PHYSICS.getEField(t.x,t.y,this.charges);
      var vectors = [{name:'E',x:field.x,y:field.y,color:'#146895',offset:-9}, {name:'F',x:field.x*t.q,y:field.y*t.q,color:'#a52f42',offset:0}, {name:'a',x:field.x*t.q,y:field.y*t.q,color:'#674699',offset:9}, {name:'v',x:t.vx,y:t.vy,color:'#256c3a',offset:18}];
      vectors.forEach(function (vector) {
        var magnitude = Math.hypot(vector.x,vector.y); if (magnitude < .01) return;
        var angle = Math.atan2(vector.y,vector.x), length = clamp(24 + Math.log1p(magnitude)*9,24,76);
        var sx = t.x - Math.sin(angle)*vector.offset, sy = t.y + Math.cos(angle)*vector.offset;
        var ex = clamp(sx+Math.cos(angle)*length,12,this.width-12), ey = clamp(sy+Math.sin(angle)*length,16,this.height-16);
        drawArrow(ctx,sx,sy,ex,ey,vector.color,2,6);
        ctx.fillStyle=vector.color; ctx.font='bold 13px Arial'; ctx.textAlign='center'; ctx.fillText(vector.name,clamp(ex+Math.cos(angle)*10,10,this.width-10),clamp(ey+Math.sin(angle)*10,12,this.height-12));
      },this);
      $('#ef-vector-values').textContent = 'Model components (right +x, down +y): E ('+round(field.x,1)+', '+round(field.y,1)+'); F ('+round(field.x*t.q,1)+', '+round(field.y*t.q,1)+'); a ('+round(field.x*t.q,1)+', '+round(field.y*t.q,1)+'); v ('+round(t.vx,1)+', '+round(t.vy,1)+').';
    }
'''
script=script.replace('    var userCount = this.userCharges().length;',insert+'    var userCount = this.userCharges().length;')
script=script.replace("+ (this.isPlaying ? 'moving' : 'not moving') + '.';", "+ (this.isPlaying ? 'moving' : 'not moving') + '. Launch and target positions are recorded with each successful design. ' + describeCharges(this.userCharges().map(function(c){return {fx:c.x/this.width,fy:c.y/this.height,q:c.q};},this));")
script=script.replace("$('#ef-keep-testing').addEventListener('click', function () { $('#ef-success-modal').hidden = true; appRef.resetParticle(false); });", "$('#ef-keep-testing').addEventListener('click', function () { $('#ef-success-modal').hidden = true; appRef.resetParticle(false); appRef.canvas.focus(); });")
script=script.replace("$('#ef-next-level').addEventListener('click', function () { appRef.loadLevel(state.selected === LEVELS.length - 1 ? 0 : state.selected + 1); });", "$('#ef-next-level').addEventListener('click', function () { if (evidenceReady()) { $('#ef-success-modal').hidden = true; $('#ef-questions').focus(); $('#ef-questions').scrollIntoView({block:'start'}); } else { appRef.loadLevel(state.records.slice(0,CORE_COUNT).findIndex(function(record){return !record || !record.charges;})); } });")
events='''    $('#ef-charge-select').addEventListener('change',function(event){ appRef.selectedCharge=appRef.userCharges()[Number(event.target.value)] || null; appRef.updateControls(); appRef.render(); });
    $('#ef-charge-sign').addEventListener('change',function(event){ if(appRef.isPlaying || !appRef.selectedCharge)return; appRef.selectedCharge.q=Number(event.target.value); appRef.saveDraft(); appRef.updateControls(); appRef.render(); });
    $('#ef-apply-position').addEventListener('click',function(){
      if(appRef.isPlaying || !appRef.selectedCharge)return;
      var rawX=$('#ef-charge-x').value.trim(), rawY=$('#ef-charge-y').value.trim(); var x=Number(rawX),y=Number(rawY);
      var minX=22/appRef.width*100,maxX=100-minX,minY=22/appRef.height*100,maxY=100-minY;
      if(!rawX || !rawY || !Number.isFinite(x) || !Number.isFinite(y) || x<minX || x>maxX || y<minY || y>maxY){appRef.setStatus('Enter positions from '+Math.ceil(minX*10)/10+' to '+Math.floor(maxX*10)/10+'% left and '+Math.ceil(minY*10)/10+' to '+Math.floor(maxY*10)/10+'% top.','bad');return;}
      appRef.selectedCharge.x=x/100*appRef.width;appRef.selectedCharge.y=y/100*appRef.height;appRef.saveDraft();appRef.updateControls();appRef.render();appRef.setStatus('Source position updated.','');
    });
'''
script=script.replace('    var canvasPosition = function',events+'    var canvasPosition = function')
script=script.replace('appRef.selectedCharge = null; for (var i', 'appRef.canvas.focus(); for (var i')
script=script.replace('appRef.draggedCharge.y = clamp(position.y, 22, appRef.height - 22); appRef.render();','appRef.draggedCharge.y = clamp(position.y, 22, appRef.height - 22); appRef.syncEditor(); appRef.render();')
script=script.replace('appRef.draggedCharge = null; };','if(appRef.draggedCharge) appRef.saveDraft(); appRef.draggedCharge = null; };')
script=script.replace("if (appRef.isPlaying || !appRef.selectedCharge || appRef.selectedCharge.fixed) return; var moved", "if (appRef.isPlaying) return; if(event.key === '[' || event.key === ']'){var users=appRef.userCharges(); if(users.length){var current=users.indexOf(appRef.selectedCharge); appRef.selectedCharge=users[(current+(event.key === ']' ? 1 : users.length-1))%users.length]; appRef.updateControls(); appRef.render(); announce('Selected source '+(users.indexOf(appRef.selectedCharge)+1));} event.preventDefault(); return;} if (!appRef.selectedCharge || appRef.selectedCharge.fixed) return; var moved")
script=script.replace('appRef.selectedCharge.y = clamp(appRef.selectedCharge.y, 22, appRef.height - 22); appRef.render();','appRef.selectedCharge.y = clamp(appRef.selectedCharge.y, 22, appRef.height - 22); appRef.saveDraft(); appRef.syncEditor(); appRef.render();')
# export readable successful coordinates instead of counts only
script=script.replace('canvas.height = 760', 'canvas.height = 1300')
script=script.replace('1084, 72','1084, 178').replace('y += 84','y += 190')
script=script.replace("ctx.fillText(record.positive + ' positive source(s), ' + record.negative + ' negative source(s)', 450, y + 27);", "wrapCanvasText(ctx, recordDescription(index), 450, y + 27, 660, 22);")
script=script.replace('450, y + 51','450, y + 159').replace('58, 704','58, 1240').replace('58, 731','58, 1267')
script=script.replace("state = blankState(); try", "app.loaded = false; state = blankState(); try")
script=script.replace("app.loadLevel(0); announce", "app.loadLevel(0); $('#ef-add-positive').focus(); announce")
p.write_text('<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Electric-Field Motion Lab</title><style>\n'+css+'</style></head><body>\n'+body+'\n<script>'+script+'</script>\n</body></html>\n',encoding='utf-8')
