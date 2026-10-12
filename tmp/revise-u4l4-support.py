from pathlib import Path
from shutil import copy2

root = Path(r'C:\Users\erich\scorm-packager\problem-walkthoughs')
p = root / 'build-u4l4-support.cjs'
backup = Path(r'C:\Users\erich\Documents\ChatGPT\physics grade reviews\u4l4-reshape\before-graphic-review')
backup.mkdir(exist_ok=True)
for source in [p, *[(root / 'unit 4' / f'u4l4-{kind}-visuals.html') for kind in ('energy', 'design', 'evidence')]]:
    if not (backup / source.name).exists():
        copy2(source, backup / source.name)
s = p.read_text(encoding='utf-8')
assert '// Student review refinements' not in s
refinements = r'''
// Student review refinements: physical contact, explicit response feedback, and readable enlarged diagrams.
const floor = '<path d="M85 230H755" stroke="#775f40" stroke-width="4"/>';
const transferSlide=decks[0].slides[1];
transferSlide.art=svg(floor+ball(170,209)+arrow(215,180,360,180)+doms(390,165)+text(90,272,'Moving ball',22)+text(420,272,'Dominoes at rest',22),'A ball rolls right along a level surface toward upright dominoes.');
transferSlide.reveal=svg(floor+ball(390,209)+[0,1,2].map((i)=>`<g transform="translate(${408+i*62} 230) rotate(${[38,12,0][i]})"><rect x="-17" y="-65" width="17" height="65" rx="3" fill="#9bcabb" stroke="#245c4b" stroke-width="3"/></g>`).join('')+arrow(410,105,590,105)+text(210,55,'Contact transfers energy',26),'The ball contacts the first domino. Each domino tips around its own base on the same surface.');
// Put the wheels on the surface and keep the energy destination separate from motion arrows.
for(const key of ['art','reveal'])decks[0].slides[4][key]=decks[0].slides[4][key].replaceAll('M95 185H730','M95 170H730');
decks[1].slides[1].art=decks[1].slides[1].art.replace('<circle cx="570"','<path d="M505 12H635M570 12V50" stroke="#18324c" stroke-width="5"/><circle cx="570" cy="90" r="6" fill="#18324c"/><circle cx="570"');
decks[1].slides[1].art=decks[1].slides[1].art.replace('Downward pull → flag rises','Pull here ↓');
decks[1].slides[1].setup='Pull down on one end of the rope to lift a light flag.';
decks[1].slides[1].art=decks[1].slides[1].art.replace('aria-label="Physics diagram"','aria-label="A pulley wheel is attached to a fixed overhead support. A rope passes over it and holds a light flag."');
decks[1].slides[2].setup='Guide rails can keep a ball aligned with the next stage.';
decks[1].slides[2].art=decks[1].slides[2].art.replace('More contact','Guide rail');
decks[2].slides[0].q='Which condition should remain unchanged?';
decks[2].slides[0].choices=['The tested ramp alignment','The ball’s release height','No conditions need to stay fixed'];
decks[2].slides[1].q='Which explanation identifies energy before and after contact?';
decks[2].slides[1].choices=['The ball hit the domino and it fell.','The domino created energy when it fell.','The moving ball transfers kinetic energy to the domino, which begins moving.'];
decks[2].slides[1].feedback='The moving ball has kinetic energy and transfers some to the domino during contact. For each stage, identify the interacting objects and the energy before and after.';
const reviewCss=`.verdict{font-weight:750;margin:12px 0 0}.verdict:empty{display:none}.choices button:disabled{opacity:1}.choices button.best-answer{background:#e4f2ea;color:#174e36;border-color:#23744e}.choices button.needs-revision{background:#fff2d6;color:#654614;border-color:#946515}.diagram-zoom{margin:8px 0;font-size:15px}.diagram-zoom summary{cursor:pointer;color:#285f9f;font-weight:650;padding:6px 0}.zoom-scroll{overflow:auto;border:2px solid #adc1d7;border-radius:10px;background:#f8fafc}.zoom-scroll:focus-visible{outline:3px solid #9b5900;outline-offset:3px}.zoom-scroll svg{display:block;width:840px;max-width:none;height:auto;font-family:system-ui,sans-serif}.zoom-hint{font-size:14px;margin:6px 0}@media(min-width:900px){.diagram-zoom{display:none}}`;
'''
s = s.replace('const css=', refinements + '\nconst css=', 1)
s = s.replace('<style>${css}</style>', '<style>${css}${reviewCss}</style>')
s = s.replace('<p id="question" class="question">', '<details class="diagram-zoom" id="diagramZoom"><summary>Enlarge diagram</summary><p class="zoom-hint">Swipe sideways, or focus the diagram and use the arrow keys.</p><div id="largeScene" class="zoom-scroll" role="region" aria-label="Enlarged diagram" tabindex="0"></div></details><p id="question" class="question">')
s = s.replace('<p id="feedback" class="feedback"', '<p id="verdict" class="verdict" role="status"></p><p id="feedback" class="feedback"')
s = s.replace("$('scene').className='scene'+(done?' reveal':'');", "$('scene').className='scene'+(done?' reveal':'');$('largeScene').innerHTML=$('scene').innerHTML;")
s = s.replace("b.textContent=o.x;b.type='button';", "b.textContent=done&&o.i===s.correct?'Best answer: '+o.x:done&&answers[step]===o.i?'Your choice: '+o.x:o.x;b.className=done&&o.i===s.correct?'best-answer':done&&answers[step]===o.i?'needs-revision':'';b.type='button';")
s = s.replace("$('feedback').textContent=done?s.feedback:'';", "$('verdict').textContent=!done?'':answers[step]===s.correct?'Correct choice':'Compare your choice with the best answer';$('feedback').textContent=done?s.feedback:'';")
s = s.replace("$('next').onclick=()=>{step=", "$('next').onclick=()=>{$('diagramZoom').open=false;step=")
s = s.replace("$('back').onclick=()=>{step=", "$('back').onclick=()=>{$('diagramZoom').open=false;step=")
s = s.replace("$('reset').onclick=()=>{step=", "$('reset').onclick=()=>{$('diagramZoom').open=false;step=")
p.write_text(s, encoding='utf-8')
print('Updated the support generator; backed up all three original HTML files.')
