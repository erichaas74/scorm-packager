import json, html, math
from pathlib import Path
R=Path(__file__).parent
def s(title,text,scene,alt,eq=None):
    return dict(title=title,text=text,scene=scene,alt=alt,eq=eq)
blocks=[dict(id='plan',old='Introduction to Modeling Magnetic Fields Around Wires and Coils',slides=[
s('Plan a fair electromagnet investigation','Practice scenario: a fictional team asks whether increasing current changes how many paperclips an electromagnet can lift. Use this model to learn the structure of a lab report. The sample results are invented for analysis, not observations from your assigned simulation.','overview','An electromagnet investigation connects a question, a controlled test, measurements, and a supported claim.'),
s('Ask a measurable question','How does changing current from 0.50 A to 1.00 A affect the number of identical paperclips lifted by the same electromagnet? Clip count is a measure of lifting performance, not a direct reading of magnetic-field strength.','question','The same coil is tested at 0.50 ampere and 1.00 ampere; paperclip count is the measured outcome.'),
s('Predict and explain','Prediction: the electromagnet will lift more clips at 1.00 A. Reason: moving charges create a magnetic field, and greater current strengthens the field for the same coil and core. This is a prediction to test, not a result to copy.','prediction','Two identical electromagnets carry different currents. Field symbols indicate a predicted stronger field at the higher current.'),
s('Separate the variables','Change current only. Measure clips lifted. Keep the coil turns, iron core, wire, clip type, pickup contact time, and lift method the same. In this fictional physical setup, an adjustable current supply changes current without rebuilding the coil.','variables','Current is the changed variable, clip count is the measured variable, and the coil, core, clips, and pickup method are held fixed.'),
s('Write a repeatable method','Practice apparatus: 50 turns of insulated copper wire, conductor diameter 0.50 mm, around an 8 cm iron nail. Use an adjustable current supply and identical clips. Set 0.50 A. Contact the clip pile for 3 seconds, lift 2 cm, and count clips retained after 3 seconds. Return clips and repeat three times, allowing cooling between tests. Repeat at 1.00 A. Record every result. This fictional physical method is practice; the assigned lab is a simulation.','method','A three-second pickup, a two-centimeter lift, and a three-second hold make each measurement comparable.'),
s('Your report begins before testing','Write the question, prediction with a reason, variables, and method before examining results. These sections explain what you tested and make the comparison understandable to someone who was not present.','reportplan','A report outline begins with question, prediction, variables, and a repeatable method.')]),
dict(id='assigned',old='Introduction to Planning an Electromagnet Investigation',slides=[
s('How to complete the assigned Electromagnet Design Lab','Open the Electromagnet Design Lab in the Unit 6 Lesson 4 Buzz assignment. Follow its trial sequence and use your own displayed results. The fictional current experiment in this lesson teaches reporting skills; its numbers do not replace your lab results.','assignment','The assigned simulation progresses from five fixed trials to a design challenge and evidence-based Buzz responses.'),
s('Complete and check Trials 1–5','Select each trial tab and run its preset test. Record settings, clips lifted, displayed build cost, and wire length. Divide clips by the displayed cost, round to two decimal places, and choose Check calculation. A correct check turns the trial tab green. Complete all five to unlock Trial 6.','fixed','Five preset trial tabs lead to the unlocked design challenge after their calculations are checked.',r'\text{Value ratio}=\frac{\text{clips lifted}}{\text{displayed build cost}}'),
s('Make comparisons that isolate a cause','Compare Trials 1 and 3 to explain the core-material effect: identify what changed, what stayed fixed, and both clip counts. Compare the series and parallel trials to explain how the cell arrangement changes current. More turns also add wire resistance and cost, so explain those tradeoffs instead of assuming more turns must be best.','compare','Paired trials isolate core material or cell arrangement; current and cost help explain the resulting clip counts.'),
s('Test at least three different designs','In Trial 6, record at least three different designs. For each, save turns, core, wire diameter, cell count and arrangement, clips, cost, wire length, and value ratio. Respect both limits: wire at most 250 cm and cost at most 50.00. Seek the target ratio of 6.38. Changing several settings can optimize a design, but cannot isolate the cause of an improvement.','design','Three distinct design records are checked against the 250-centimeter wire limit and 50.00 cost limit.'),
s('Compare value and explain the evidence','Compare your selected design with your Trial 1 baseline using clips per cost. Calculate with unrounded ratios derived from the displayed costs; round only the final percentage to one decimal place. Explain why the strongest design may not give the best value. The ratio measures value, not energy efficiency.','value','The chosen design is compared with the baseline by clips per cost, while both design limits remain satisfied.',r'\text{Improvement (\%)}=\left(\frac{R_{\text{new}}}{R_{\text{baseline}}}-1\right)\times100'),
s('Use your records to answer the Buzz questions','Complete the ten assigned Buzz questions using your own trial results. For the written responses, connect a claim to numerical evidence and a physics explanation. Keep your three-design comparison available. A results download is optional; the assignment uses its Buzz questions rather than requiring a separate report upload.','handoff','Own trial records and design comparisons support numerical answers and claim-evidence-reasoning responses in Buzz.')]),
dict(id='report',old='Introduction to Drawing Conclusions from Data',slides=[
s('Build a lab report from sample evidence','The following report models a fictional physical investigation. Invented practice data: at 0.50 A, the team lifts 9, 10, and 11 clips; at 1.00 A, it lifts 18, 20, and 19 clips. Study how the report separates observations from explanations. Use your own results in the assigned lab.','data','Invented sample data table: 0.50 ampere gives 9, 10, 11 clips; 1.00 ampere gives 18, 20, 19 clips.'),
s('State the question and prediction','Question: how does current affect the clip count for this coil and core? Prediction: increasing current from 0.50 A to 1.00 A will increase the number lifted because greater current strengthens the magnetic field when the coil and core are fixed. The prediction was written before looking at results.','question','The research question compares current with clip count while retaining the same electromagnet.'),
s('Describe the method and controls','The fictional team used 50 turns of insulated copper wire, conductor diameter 0.50 mm, around an 8 cm iron nail, identical clips, and an adjustable current supply. At each current it made three measurements: 3 seconds of contact, a 2 cm lift, and a 3-second hold before counting. It returned clips and allowed cooling between trials. Stating the apparatus and measurement procedure makes the comparison easier to reproduce.','method','Controlled pickup timing, lift height, and repeated measurements form the method section.'),
s('Present results before interpreting them','List all six observations in a table with current in amperes and clip count for each trial. Plot current on the horizontal axis and mean clips lifted on the vertical axis. Show individual observations too, so the reader sees the spread. Two current settings do not establish the shape of a relationship across all currents.','graph','A graph shows three raw clip counts and a mean of 10 at 0.50 ampere, and three counts and a mean of 19 at 1.00 ampere.'),
s('Show one sample calculation','Add the three clip counts at each current and divide by three. The means are 10 and 19 clips. The increase is 9 clips, which is 90% of the original mean. Current doubled, but the measured mean clip count did not exactly double.','means','The two sets of observations have means of 10 clips and 19 clips, with all trials retained.',r'\begin{aligned}\bar n_{0.50\,\mathrm A}&=\frac{9+10+11}{3}=10\text{ clips}\\\bar n_{1.00\,\mathrm A}&=\frac{18+20+19}{3}=19\text{ clips}\\\text{Increase}&=\frac{19-10}{10}\times100=90\%\end{aligned}'),
s('Connect claim, evidence, and reasoning','Claim: greater current increased lifting performance for this setup. Evidence: the mean rose from 10 to 19 clips, with trial ranges of 9–11 and 18–20. Reasoning: current produces a magnetic field; a stronger field in the same coil and core can exert a greater magnetic force on the clips. Clip count is indirect evidence, not a field measurement in tesla.','cer','Claim, numerical evidence, and a magnetic-field explanation form three connected parts of the conclusion.'),
s('Evaluate limits and propose an improvement','Only two current levels and three repeats were tested. Clip arrangement could change how well clips make contact. Improve the physical method by using a guide for the pickup position and lift height, and test more current levels with repeats. Repeating identical settings in a deterministic simulation may return identical values; it does not create new evidence about physical measurement uncertainty.','limits','Additional current levels and a positioning guide address specific limits of the fictional physical investigation.'),
s('Use the structure with your own investigation','A clear lab report contains a question and prediction, a repeatable method, labeled results, sample calculations, and a conclusion with limitations. In the assigned design lab, apply this structure to your notes and written Buzz answers. Distinguish a fair comparison that explains a cause from a multi-setting design search that finds better value.','reportplan','A complete report connects purpose, method, results, calculations, and a supported conclusion.')])]
NAVY='#193650';TEAL='#087e8b';ORANGE='#dc8738';BG='#edf4f7';GRAY='#617688'
def t(x,y,v,n=28,c=NAVY,a='middle'):return f'<text x="{x}" y="{y}" text-anchor="{a}" font-family="Arial,sans-serif" font-size="{n}" fill="{c}">{html.escape(str(v))}</text>'
def rect(x,y,w,h,c=BG,r=18):return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{c}"/>'
def line(x,y,X,Y,c=GRAY,w=4):return f'<path d="M{x},{y}L{X},{Y}" stroke="{c}" stroke-width="{w}" fill="none"/>'
def arrow(x,y,X,Y):return line(x,y,X,Y,TEAL,7)+f'<path d="M{X},{Y}l-17,-10v20z" fill="{TEAL}"/>'
def coil(x,y):return rect(x-150,y-30,300,60,'#c7d5df')+''.join(f'<ellipse cx="{x-110+i*27}" cy="{y}" rx="13" ry="65" fill="none" stroke="{ORANGE}" stroke-width="6"/>' for i in range(9))
def clip(x,y):return f'<path d="M{x+10},{y}v35a10,10 0 0 1 -20,0v-30a7,7 0 0 1 14,0v25" fill="none" stroke="{GRAY}" stroke-width="4"/>'
def box(x,y,w,h,label,sub='',c=TEAL):return rect(x,y,w,h)+rect(x,y,8,h,c,4)+t(x+w/2,y+55,label,30,c)+t(x+w/2,y+105,sub,24)
def art(scene):
 z='<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="720" viewBox="0 0 1440 720">'+rect(0,0,1440,720,BG,28)+rect(30,30,1380,660,'white',24)+t(80,82,'U6 • ELECTROMAGNET INVESTIGATION',22,TEAL,'start')
 if scene in ['question','prediction']:
  for x,v in [(370,'0.50 A'),(1070,'1.00 A')]:
   z+=rect(x-255,160,510,420)+t(x,215,'SAME COIL + IRON CORE',23,GRAY)+coil(x,340)+t(x,465,v,40,TEAL)+t(x,540,'Count clips lifted',28)
   if scene=='prediction':
    for j in range(2 if x==370 else 4):z+=f'<ellipse cx="{x}" cy="340" rx="{185+j*15}" ry="{95+j*16}" fill="none" stroke="{TEAL}" stroke-width="2" stroke-dasharray="8 7"/>'
  z+=t(720,635,'A prediction is tested against evidence.',26,GRAY)
 elif scene=='variables':
  z+=box(95,170,375,350,'CHANGE','current: 0.50 → 1.00 A')+box(535,170,375,350,'MEASURE','clips lifted')+box(975,170,375,350,'KEEP FIXED','coil, core, wire, clips')+t(1162,350,'contact time',25)+t(1162,400,'lift method',25)+coil(282,370)+''.join(clip(650+j*45,340)for j in range(4))+t(720,625,'One changed variable makes a causal comparison clearer.',28,GRAY)
 elif scene=='method':
  for x,label,sub in [(290,'Contact: 3 s','same clip pile'),(720,'Lift: 2 cm','same guide height'),(1150,'Hold: 3 s','count retained clips')]:
   z+=rect(x-190,160,380,400)+t(x,215,label,31,TEAL)+coil(x,320)+''.join(clip(x-50+j*45,415)for j in range(3))+t(x,520,sub,25)
  z+=t(720,635,'Three measurements at each current • return clips • allow cooling',27,GRAY)
 elif scene in ['data','means']:
  z+=rect(180,155,1080,390)+rect(180,155,1080,75,TEAL)
  for x,v in zip([300,530,720,910,1140],['Current (A)','Trial 1','Trial 2','Trial 3','Mean']):z+=t(x,203,v,27,'white')
  for y,row in [(320,['0.50','9','10','11','10']),(445,['1.00','18','20','19','19'])]:
   for x,v in zip([300,530,720,910,1140],row):z+=t(x,y,v,36,TEAL if x==1140 else NAVY)
  z+=t(720,610,'INVENTED PRACTICE DATA • clip counts, not magnetic-field readings',27,GRAY)
 elif scene=='graph':
  z+=line(280,550,1220,550)+line(280,550,280,150)+t(750,645,'Current (A)',28)+t(250,125,'Clips lifted',28)
  for n in [0,5,10,15,20]:
   y=550-n*18;z+=line(280,y,1220,y,'#dae5ec',2)+t(245,y+8,n,24)
  for x,vals,mean,label in [(550,[9,10,11],10,'0.50'),(1010,[18,20,19],19,'1.00')]:
   z+=t(x,590,label,28)
   z+=line(x-65,550-mean*18,x+65,550-mean*18,TEAL,7)+t(x,550-mean*18-48,f'mean {mean}',27,TEAL)
   for n in vals:z+=f'<circle cx="{x}" cy="{550-n*18}" r="8" fill="{ORANGE}"/>'
  z+=t(1300,115,'Invented data: orange = trials; teal = mean',25,GRAY,'end')
 elif scene=='fixed':
  for i in range(5):z+=box(80+i*255,185,230,180,f'Trial {i+1}','run → calculate')+t(195+i*255,420,'✓ checked',27,TEAL)
  z+=t(720,540,'All five checked → Trial 6 unlocks',38,TEAL)+t(720,625,'Use each trial’s displayed clips and build cost.',27,GRAY)
 elif scene=='compare':
  z+=box(110,160,570,365,'CORE COMPARISON','Trials 1 and 3')+box(760,160,570,365,'CELL ARRANGEMENT','series and parallel trials')
  z+=t(395,335,'change core material',27)+t(395,395,'retain circuit settings',27)+t(1045,335,'compare supply voltage',27)+t(1045,395,'explain current and lifting',27)+t(720,620,'Record what changed and what stayed fixed.',28,GRAY)
 elif scene=='design':
  for i in range(3):
   x=110+i*445;z+=box(x,150,390,380,f'Design {i+1}','settings + results')+t(x+195,330,'turns • core • wire',25)+t(x+195,385,'cells • arrangement',25)+t(x+195,440,'clips • cost • ratio',25)
  z+=t(720,605,'Wire ≤ 250 cm     Cost ≤ 50.00     Target ratio: 6.38',31,TEAL)
 elif scene=='value':
  z+=box(150,185,450,300,'BASELINE','clips per displayed cost')+box(840,185,450,300,'SELECTED DESIGN','clips per displayed cost')+arrow(630,330,805,330)+t(720,565,'Keep unrounded ratios for the percentage calculation.',28)+t(720,625,'Best value ≠ greatest clip count ≠ energy efficiency',27,TEAL)
 elif scene=='cer':
  for x,label,a,b in [(100,'CLAIM','greater current','improved lifting'),(550,'EVIDENCE','mean: 10 → 19 clips','ranges: 9–11; 18–20'),(1000,'REASONING','current → field','field → magnetic force')]:
   z+=box(x,180,350,350,label,'')+t(x+175,350,a,26)+t(x+175,410,b,26)
  z+=t(720,620,'Limit the claim to the conditions you actually tested.',29,GRAY)
 elif scene=='limits':
  z+=box(110,170,570,360,'LIMIT','only two current levels')+box(760,170,570,360,'IMPROVEMENT','test additional levels')+t(395,350,'clip contact can vary',27)+t(1045,350,'use a positioning guide',27)+t(1045,415,'repeat physical measurements',25)+t(720,625,'Name a specific limitation and a change that addresses it.',27,GRAY)
 elif scene in ['reportplan','overview','assignment','handoff']:
  labels=['Question','Method','Results','Conclusion'] if scene in ['reportplan','overview'] else ['Trials 1–5','Design search','Compare value','Buzz answers']
  for i,label in enumerate(labels):
   x=80+i*330;z+=rect(x,210,300,280)+f'<circle cx="{x+150}" cy="275" r="35" fill="{TEAL}"/>'+t(x+150,287,str(i+1),33,'white')+t(x+150,380,label,28)
   if i<3:z+=arrow(x+308,355,x+332,355)
  z+=t(720,585,'Evidence makes the explanation testable.',32,TEAL)+t(720,635,'Use invented data for practice; use your own data for the assignment.',25,GRAY)
 return z+'</svg>'
for b in blocks:
 (R/b['id']).mkdir(exist_ok=True)
 for i,v in enumerate(b['slides']):
  v['image']=str(R/b['id']/f'{i:02}.png')
  (R/b['id']/f'{i:02}.svg').write_text(art(v['scene']),encoding='utf8')
(R/'revision-processes.json').write_text(json.dumps(blocks,indent=2),encoding='utf8')
print('Created content and 20 SVG diagrams')

