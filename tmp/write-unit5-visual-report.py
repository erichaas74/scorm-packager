from pathlib import Path
import html, json, statistics
from urllib.parse import quote

root=Path(__file__).resolve().parents[1]
out=root/'output/unit5-visual-audit'
data=json.loads((out/'metrics.json').read_text(encoding='utf-8'))
E=html.escape
findings=[
('High','White text disappears inside white wrappers',[3,5,14],
 'Cosmic Decoder, Duality Detective, and GPS Relativity Calibrator inherit white body text, but the Rise shell paints its background white. Their main headings disappear. GPS also loses both relativity checkbox labels; only the boxes remain visible. Computed heading color is rgb(255,255,255).',
 'Set an explicit dark foreground on the white shell, with light text scoped to the dark control panels. Review headings, instructions, and checkbox labels together.', ['03-desktop.png','14-mobile.png']),
('High','Honors Relativity starts behind an offscreen introduction',[61,62,63],
 'The dark overlay covers the lab, but its Begin panel is centered in the full application rather than the visible screen. At desktop width the panel starts about 1,507 px down in the source and 2,721 px down in the assessment preview. On a phone the preview panel starts about 4,413 px down. The first view looks disabled with no explanation.',
 'Anchor the introduction to the visible viewport or present it inline at the top. Keep Begin visible without scrolling through a dimmed page. Shorten the opening instructions to one goal and three steps.', ['61-desktop.png','detail-62-mobile.png']),
('High','Two phone layouts hide the information students need',[14,35],
 'GPS keeps its three status cards in one horizontal row inside an overflow-hidden shell. At 390 px the first card starts at x=-24 and the last ends at x=414, cutting off clock values and status. StandingWaveSimulation puts its large control panel over the center of the wave canvas, covering most of the phenomenon. These problems are present even though neither page reports document-level horizontal overflow.',
 'Stack the GPS cards. Put standing-wave controls below the graph on narrow screens, or use a collapsible drawer that does not cover the plotted wave.', ['14-mobile.png','35-mobile.png']),
('Medium','Important measurement graphics become too small on phones',[52,53,54,55,56,57,69,70,71,72,73,74],
 'Thin Lens shrinks each optical bench to about 313 × 143 px; its labels and close-up scale are difficult to read. Spectral Shift compresses the comparison to roughly 291 × 110 px, making closely spaced lines and axis labels hard to distinguish. Perfect Instrument compresses its mode diagram to 291 × 78 px. Resonance Tube retains 9.6 px frequency/reset labels and a 10.4 px sound control on phones.',
 'Reflow the drawing, not just the surrounding page. Separate the instrument view from the numeric readouts; offer a larger detail view for spectra and ray diagrams. Keep essential labels readable at the final display size.', ['72-mobile.png','55-mobile.png','69-mobile.png']),
('Medium','Light/Color controls are separated from their visual result',[65,66,67],
 'At phone width, the initial light-path graphic starts around y=1,285 px, below a long stack of controls. A student can change settings without seeing the bulb/filter/eye result in the same view. The tab strip also requires horizontal scrolling.',
 'Place the main light-path graphic immediately after the task prompt. Group only the current step’s controls beneath it and collapse secondary controls. Make the relationship between each control and the visual change visible without repeated scrolling.', ['65-mobile.png','65-desktop.png']),
('Medium','Spherical sound graphic is visually noisy',[33],
 'The initial canvas is filled with thousands of orange and cyan specks. Compression and rarefaction rings compete with particle noise; the source and listener are comparatively small. The listener is crowded against the right edge. The explanatory panel has to do much of the work that the picture should do.',
 'Use fewer neutral particles, stronger alternating density bands, and one tracked particle. Give the listener more margin. Reveal the detailed particle field as an optional mode rather than the default.', ['33-desktop.png']),
('Medium','Honors Relativity has the strongest text-density problem among the source labs',[61,62,63],
 'The source/template exposes approximately 903 DOM-text words and spans about 4,642 px on a phone. It combines setup instructions, controls, data collection, a graph, multiple evidence cards, export directions, assessment placeholders, and an introduction. This is a long, competing set of tasks even before the full assessment preview is added.',
 'Break the lab into Setup → Compare clocks → Explain evidence. Show one short instruction at each step; collapse the experiment background and keep the current graph and data in view.', ['61-desktop.png','detail-62-mobile.png']),
('Medium','Assessment previews mix learner work with lengthy scoring material',[53,56,62,66,70,73],
 'Six preview pages contain roughly 1,027–1,851 DOM-text words and reach 6,550–9,829 px in phone layout. They include correct answers, feedback, Full credit/Partial credit paragraphs, and BusyBee scoring rules. Thin Lens has a 117-word rubric paragraph. These are inspection previews: their length is not proof that learners see all this text in Buzz.',
 'Keep teacher feedback and rubrics collapsed by default in previews, or provide separate Teacher and Learner views. For the learner experience, show the current trial and its questions together. Verify actual Buzz rendering before removing grading content.', ['73-desktop.png','pages-contact-09.jpg']),
('Medium','Detailed raster diagrams lose their labels when embedded small',[],
 'The professional-diagrams set contains polished illustrations, but l3-vision-final.png combines eye anatomy, cones, the brain, labels, and three paragraphs in one bitmap. l5-power.png combines a complete plant, two fluid loops, five numbered stages, and component labels. l5-decay-types.png, l5-fusion.png, l5-sun.png, and l5-polarization.png have similar competing detail. These are useful large reference graphics; reduced to narrow cards, the smallest text becomes unreadable.',
 'Use one process stage per teaching panel. Move paragraphs into real page text. Keep the complete image as an expandable overview. Prefer the existing simplified step diagrams for small embeds.', ['assets-contact-06.jpg','assets-contact-07.jpg']),
('Low','Some simplified diagrams still have label/line collisions',[],
 'In tab-accordion-diagrams/images/08-00-definition.png, the diffraction arcs cross the top annotation area and approach the bottom opening label/caption. The matching small-opening and example variants reuse this arrangement. At reduced size the teal annotation and wavefronts blend together.',
 'Reserve a separate label band or use short callout leaders outside the wavefronts. Add a little padding between the bottom caption and the plotted region.', ['assets-contact-08.jpg']),
('Medium','Resource pages are difficult to read on narrow screens',[37,51],
 'The diagram gallery is about 32,637 px tall on a phone and overflows horizontally by 47 px. Its images are about 152 × 76 px in the first row. Buzz Assessment Instructions overflows by 531 px because of its wide file-map table. These are support pages rather than student simulations, but they make locating and checking materials unnecessarily hard.',
 'Use a one-column gallery with lesson/section navigation and click-to-enlarge images. Put the file map in a labeled scroll area or convert it to stacked file cards on small screens.', ['37-mobile.png','51-mobile.png']),
('Low','The Unit 5 walkthrough menu is now long to scan',[16],
 'The menu contains 43 activity cards and approximately 1,367 DOM-text words. The descriptions are individually short, but the combined list is burdensome on a phone and several entries have similar titles or are revised versions.',
 'Keep the standalone unit page, but add lesson/topic grouping and a simple title filter. Label alternate versions explicitly so users can choose the intended activity.', ['16-desktop.png'])
]

notes={
1:'Concise; waveform and controls are clear. Dark-panel supporting text could be slightly larger.',
2:'Concise initial prompt. Consider a small connection diagram instead of a large empty feedback panel before selection.',
3:'High: heading and spectrum captions disappear against the white shell.',
4:'Short text overall. Phone layout puts the material list before the graphic; enlarge the angle labels in the plot.',
5:'High: title disappears. The phone layout squeezes controls beside a tall canvas instead of stacking them.',
6:'Concise, but the first view is a largely empty black race panel. A labeled ready-state illustration would clarify the task.',
7:'Clear information grouping on desktop; spectrum categories become very small/vertical on phones.',
8:'Clear prediction task. Phone race labels are small; enlarge labels while keeping the graphic.',
9:'Clear, concise initial state; no major initial-view text-density issue.',
10:'Concise paired comparison. Small labels on the rope illustrations merit enlargement on phones.',
11:'Concise paired comparison; keep this focused structure. Small illustration labels merit enlargement.',
12:'Moderate side-panel density; move optional examples into a reveal. Main waveform is useful.',
13:'Phone protractor fills a tall drawing region and its perimeter is cramped; use a fitted diagram plus separate angle readout.',
14:'High: invisible checkbox labels and title; phone dashboard clips clock/status cards.',
15:'Clear population grid; relatively text-rich for a small walkthrough. Stage the analysis questions after the first trial.',
16:'Long navigation list: 43 cards. Group by topic and mark variants.',
17:'Useful area/intensity comparison. Tiny inset/schematic labels need a larger view on phones.',
18:'Large dark drawing area with a small source; side explanations dominate. Enlarge the photon/material interaction.',
19:'Archived pre-drag-drop matching version. Short scenario cards; six at once may be better paginated on a phone.',
20:'Revised matching activity has useful concrete images. Keep short prompts; consider one scenario at a time on phones.',
21:'Matching activity is concise per card. Sequence the six cards on phones to reduce scrolling.',
22:'Strong focused example: compact instruction, graphic, and controls; no major initial-view issue.',
23:'Archived variant; concise visual layout. Revised version is the preferable navigation target.',
24:'Focused wave representation. No major initial-view text-density issue.',
25:'Archived variant; focused layout. Avoid treating it as another required lesson.',
26:'Clear particle-count/prediction task. No major initial-view text-density issue.',
27:'Concise oscillator model. Add units to the y/v/a readout and strengthen the faint reference lines for readability.',
28:'Good physical apparatus illustration; measurement/recording region makes the phone page long. Stage the evidence table.',
29:'Atom and photon are very small relative to the dark canvas; enlarge the interaction and shorten the always-visible misconception list.',
30:'Focused distance/intensity layout; thin graph labels need care on phones.',
31:'Clear desktop refraction model; dense wavefront/angle labels shrink too much on phones.',
32:'Brief supporting-resource menu; no major issue in the initial view.',
33:'Particle speckle overwhelms the compression/rarefaction pattern; listener is crowded at the right edge.',
34:'Good short comparison of media; no major initial-view text-density issue.',
35:'High on phones: control panel covers the central wave; equation is also very low contrast.',
36:'Concise and well grouped. Fine node/antinode labels need larger phone rendering.',
37:'Very long gallery; phone thumbnails are tiny and the page overflows horizontally.',
38:'Three dense oscillation traces and fine labels compete in the phone plot. Offer trace toggles and a slower/zoomed view.',
39:'Focused lab; source is tiny and the default nearly-flat string can look inactive. Add a clearer drive/response cue.',
40:'Strong short prediction task with visual answer choices; no major initial-view issue.',
41:'Strong visual answer choices and little text; no major initial-view issue.',
42:'Good staged vocabulary: one short explanation and a changing model.',
43:'Clear ripple model; controls and prediction stack on phones. Keep the visual prominent.',
44:'Good before/after graphics. At 181 words, staging the three property questions could reduce phone scrolling.',
45:'Useful diffraction graphic and short readouts. Small labels need a larger phone view.',
46:'Good focused periodic/pulse model; preserve concise instructions.',
47:'Spring variant is visually denser than the dot model; use it as an optional representation.',
48:'Focused wave model with compact controls; no major initial-view issue.',
49:'Good one-question-at-a-time structure. Initial screen is mostly text; later scenario graphics require separate interaction review.',
50:'Teacher planning/audit document, not a student simulation. Its 3,941 words should not be counted as student overload.',
51:'Teacher setup document. Wide file table overflows by 531 px on phones.',
52:'Useful instrument rendering. Mode diagram labels shrink on phones; source is not particularly wordy.',
53:'Same instrument graphics; long preview includes scoring/feedback material.',
54:'Template shares the source layout; same small diagram-label issue.',
55:'Clear desktop spectra; phone spectrum and wavelength labels are too compressed.',
56:'Same spectral graphic; long preview includes scoring/feedback material.',
57:'Template shares the source spectrum layout.',
58:'Good staged explainer; phone orbit drawing is small. Not a broad text-overload problem in its initial stage.',
59:'Initial GPS preview is staged and matches the source, unlike the longer static previews.',
60:'Template matches the staged GPS source.',
61:'High: offscreen Begin panel. Long source lab combines many simultaneous tasks.',
62:'High: offscreen Begin panel plus the longest assessment-preview text.',
63:'Same offscreen introduction and source-lab density as the main Honors file.',
64:'Application menu is text-heavy as navigation but descriptions are reasonably short; no critical issue.',
65:'Phone controls precede the result graphic by about 1,285 px. Prioritize the light path.',
66:'Same phone visual-order problem; long assessment preview adds rubrics/feedback.',
67:'Template shares the source phone visual-order problem.',
68:'Brief teacher-resource menu; no major issue.',
69:'Useful apparatus illustration. Phone labels/controls are as small as 9.6–10.4 px; diagram and graph are separated.',
70:'Same apparatus readability issue plus a long scoring/feedback preview.',
71:'Template shares the source apparatus layout.',
72:'Good desktop ray diagram; phone bench reduces to 313 × 143 px and four trials make a long page.',
73:'Same small phone bench plus 21-question preview; nearly 9,829 px tall.',
74:'Template shares the source four-trial layout and phone measurement-size issue.'
}

header='''Unit 5 graphics and text audit — October 14, 2026

Scope: 74 local HTML pages across problem-walkthoughs/unit 5 and unit-ApplicationFiles/unit-5, rendered at 1280×900 and 390×844. This includes source labs, templates, previews, navigation, archived versions, and teacher documents—not 74 unique student simulations. Reviewed overview contact sheets for all 437 byte-distinct PNGs (502 total PNG files), with selected diagrams inspected at full resolution. All 288 SVGs parsed; 287 have PNG counterparts. No live Rise/Buzz publication was inspected.

Method limits: screenshots and measurements cover initial states, plus targeted offscreen-panel checks. Every simulation state, question, and animation frame was not exercised. Asset contact sheets are an overview, not a full-resolution typography review of every image. Word counts are approximate document.body.innerText counts; they can include accessibility/status text and omit text drawn inside canvas or images. They describe loaded text volume, not an exact count of visible prose in the first viewport. No activity files were edited.

Overall: most short walkthroughs already use modest text. The strongest problems are hidden text, offscreen or covering controls, small phone graphics, and a few dense application/preview pages. The professional illustrations are not uniformly poor; several need a simpler teaching version at small embed sizes.
'''

lines=[header]
for n,(priority,name,ids,observation,fix,shots) in enumerate(findings,1):
    lines += [f'{n}. {priority.upper()} — {name}',observation,'Suggested change: '+fix]
    lines += ['  '+data[i-1]['file'] for i in ids]
    lines.append('')
lines += ['Text comparison (source / preview DOM-text words; preview phone page height):']
for a,b in [(52,53),(55,56),(58,59),(61,62),(65,66),(69,70),(72,73)]:
    lines.append(f'{data[a-1]["desktop"]["title"]}: {data[a-1]["desktop"]["words"]} / {data[b-1]["desktop"]["words"]} words; {data[b-1]["mobile"]["height"]:,} px.')
lines += ['', 'Recommended order: fix the hidden titles/labels and offscreen Begin panel; fix the two obscured phone layouts; enlarge measurement graphics; simplify Honors and learner preview flow; then refine dense diagrams and navigation.', '', 'FILE-BY-FILE CHECKLIST']
for r in data:
    lines += [f'{r["id"]:02}. {r["file"]}',notes[r['id']],f'DOM-text words: {r["desktop"]["words"]}; phone height: {r["mobile"]["height"]} px; document overflow: {max(0,r["mobile"]["overflow"])} px.','']
(out/'report.txt').write_text('\n'.join(lines),encoding='utf-8')

def source_link(file):
    return '../../'+quote(file,safe='/')
sections=[]
for n,(priority,name,ids,observation,fix,shots) in enumerate(findings,1):
    links=''.join(f'<li><a href="{source_link(data[i-1]["file"])}">{E(data[i-1]["file"])}</a></li>' for i in ids)
    images=''.join(f'<a href="{shot}"><img loading="lazy" src="{shot}" alt="Evidence for {E(name)}"><span>{E(shot)}</span></a>' for shot in shots)
    sections.append(f'<section id="finding-{n}"><span class="priority {priority.lower()}">{priority}</span><h2>{n}. {E(name)}</h2><p>{E(observation)}</p><p><strong>Suggested change:</strong> {E(fix)}</p><details><summary>Affected files</summary><ul>{links or "<li>See named diagram assets in the finding.</li>"}</ul></details><div class="evidence">{images}</div></section>')
rows=[]
for r in data:
    num=r['id']; shot=f'{num:02}-desktop.png';mobile=f'{num:02}-mobile.png'
    rows.append(f'<tr><td>{num}</td><td><a href="{source_link(r["file"])}">{E(r["file"])}</a></td><td>{E(notes[num])}</td><td>{r["desktop"]["words"]}</td><td>{r["mobile"]["height"]:,}</td><td><a href="{shot}">Desktop</a> · <a href="{mobile}">Phone</a></td></tr>')
text_rows=[]
for a,b in [(52,53),(55,56),(58,59),(61,62),(65,66),(69,70),(72,73)]:
    x,y=data[a-1],data[b-1]
    text_rows.append(f'<tr><td>{E(x["desktop"]["title"])}</td><td>{x["desktop"]["words"]}</td><td>{y["desktop"]["words"]}</td><td>{y["mobile"]["height"]:,} px</td></tr>')
toc=''.join(f'<li><a href="#finding-{n}">{E(name)}</a></li>' for n,(_,name,*_) in enumerate(findings,1))
style='''body{margin:0;background:#f3f5f8;color:#17283c;font:16px/1.6 system-ui,sans-serif}main{max-width:1180px;margin:auto;padding:36px 22px}h1{font-size:clamp(2rem,5vw,3.2rem);line-height:1.1}h2{line-height:1.25}section,header,nav{padding:26px;margin:20px 0;background:white;border:1px solid #d8e0ea;border-radius:16px}a{color:#165d9d}li{margin:7px 0;overflow-wrap:anywhere}.priority{display:inline-block;padding:3px 12px;border-radius:20px;font-weight:700}.high{background:#fce2e2;color:#9a2222}.medium{background:#fff0cc;color:#805300}.low{background:#e4eefb;color:#23548a}.evidence{display:flex;flex-wrap:wrap;gap:18px;margin-top:18px}.evidence a{display:flex;flex-direction:column;max-width:46%;font-size:12px}.evidence img{object-fit:contain;object-position:left top;width:100%;height:250px;background:#edf1f6;border:1px solid #d8e0ea}table{width:100%;border-collapse:collapse;font-size:14px}td,th{padding:12px;text-align:left;vertical-align:top;border-bottom:1px solid #d8e0ea}td:nth-child(2){overflow-wrap:anywhere}.tablewrap{overflow-x:auto}summary{cursor:pointer;font-weight:600}.muted{color:#526176}@media(max-width:700px){main{padding:15px}section,header,nav{padding:18px}.evidence a{max-width:100%}table{min-width:760px}}'''
html_doc=f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Unit 5 graphics and text audit</title><style>{style}</style></head><body><main>
<header><p class="muted">READ-ONLY AUDIT · OCTOBER 14, 2026</p><h1>Unit 5 graphics and text</h1><p><strong>Fix the visibility and layout failures first.</strong> Most short walkthroughs are already concise. The largest reading burden is concentrated in Honors Relativity and assessment inspection previews.</p><p>74 local HTML pages · desktop and phone screenshots · 437 distinct PNGs reviewed in overview · 288 SVGs parsed</p><p><a href="report.txt">Plain-text report</a> · <a href="metrics.json">Measurements</a> · <a href="#checklist">All 74 pages</a></p></header>
<section><h2>Scope and limits</h2><p>{E(header.split('Scope: ')[1].split('Method limits:')[0])}</p><p>{E(header.split('Method limits: ')[1].split('Overall:')[0])}</p><p>No initial-load JavaScript exceptions or broken rendered image elements were detected in these browser checks. That does not certify every interaction.</p></section>
<nav><h2>Prioritized findings</h2><ol>{toc}</ol></nav>{''.join(sections)}
<section><h2>Where the text volume is concentrated</h2><p>Counts are approximate DOM text, including some accessibility/status text. Preview counts include inspection feedback and rubrics; they are not a claim about the live learner view.</p><div class="tablewrap"><table><thead><tr><th>Application</th><th>Source words</th><th>Preview words</th><th>Preview phone height</th></tr></thead><tbody>{''.join(text_rows)}</tbody></table></div></section>
<section><h2>Keep these patterns</h2><p>Wave Properties, Wave Interference, Boundary Behavior, Wave Pulse/Periodic, and the revised Transverse/Longitudinal model keep a clear graphic with compact controls and short instructions. The staged GPS Investigation is more manageable than the long Honors page. Most simplified worked-process images are focused and worth retaining.</p><p>Use one goal, one visible change, and one short prompt per step. A useful editing target is 20–40 words of initial instructions, with explanations available when needed; it is a design target, not a rigid rule for assessments.</p></section>
<section id="checklist"><h2>File-by-file checklist</h2><p>“No major issue” means no major issue found in the inspected initial view, not a full interaction or accessibility certification.</p><div class="tablewrap"><table><thead><tr><th>ID</th><th>File</th><th>Finding</th><th>DOM words</th><th>Phone height</th><th>Evidence</th></tr></thead><tbody>{''.join(rows)}</tbody></table></div></section>
</main></body></html>'''
(out/'report.html').write_text(html_doc,encoding='utf-8')
print('Created report.html and report.txt with 12 findings and all 74 page notes.')
