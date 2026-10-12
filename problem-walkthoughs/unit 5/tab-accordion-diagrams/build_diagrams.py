import json,html,math,re,textwrap
from pathlib import Path
R=Path(__file__).parent
D=json.loads((R/'inventory.json').read_text(encoding='utf8'))
NAVY='#18354e';BLUE='#3869b1';TEAL='#07828b';ORANGE='#dd8432';RED='#c34b65';GRAY='#687e90';BG='#eff5f9';PURPLE='#7756af'
def tx(x,y,v,size=30,c=NAVY,a='middle'):
 return f'<text x="{x}" y="{y}" font-family="Arial,sans-serif" font-size="{size}" fill="{c}" text-anchor="{a}">{html.escape(str(v))}</text>'
def ln(x,y,X,Y,c=GRAY,w=4,dash=''):
 return f'<path d="M{x},{y}L{X},{Y}" fill="none" stroke="{c}" stroke-width="{w}" stroke-dasharray="{dash}" stroke-linecap="round"/>'
def arrow(x,y,X,Y,c=TEAL,w=6):
 a=math.atan2(Y-y,X-x);return ln(x,y,X,Y,c,w)+f'<path d="M{X},{Y}L{X-18*math.cos(a-.5)},{Y-18*math.sin(a-.5)}L{X-18*math.cos(a+.5)},{Y-18*math.sin(a+.5)}Z" fill="{c}"/>'
def both(x,y,X,Y,c=ORANGE):return arrow(x,y,X,Y,c)+arrow(X,Y,x,y,c)
def rc(x,y,w,h,c=BG,r=18,stroke='none'):return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{c}" stroke="{stroke}" stroke-width="3"/>'
def dot(x,y,r=10,c=ORANGE,stroke='none'):return f'<circle cx="{x}" cy="{y}" r="{r}" fill="{c}" stroke="{stroke}" stroke-width="3"/>'
def wave(x,y,w,amp=65,cycles=3,c=BLUE,phase=0):
 points=[(x+i*w/240,y-amp*math.sin(i/240*2*math.pi*cycles+phase))for i in range(241)]
 return '<path d="'+' '.join(('M'if i==0 else'L')+f'{a:.2f},{b:.2f}'for i,(a,b)in enumerate(points))+f'" fill="none" stroke="{c}" stroke-width="6" stroke-linecap="round"/>'
def bracket(x,X,y,label,c=TEAL):return ln(x,y,X,y,c)+ln(x,y-10,x,y+10,c)+ln(X,y-10,X,y+10,c)+tx((x+X)/2,y-18,label,29,c)
def axis(x,y,X,Y,xlabel='position',ylabel='displacement'):
 return arrow(x,y,X,y,GRAY,3)+arrow(x,y,x,Y,GRAY,3)+tx(X,y+42,xlabel,25,GRAY,'end')+tx(x,Y-25,ylabel,25,GRAY)
def caption(s):
 lines=textwrap.wrap(s,90)
 return ''.join(tx(720,624+i*34,v,27,GRAY)for i,v in enumerate(lines))
def panel(x,y,w,h,label):return rc(x,y,w,h)+tx(x+w/2,y+45,label,31,TEAL)
def antenna(x,y):return ln(x,y,x,y-130,NAVY,6)+ln(x-45,y,x,y-75,NAVY,6)+ln(x+45,y,x,y-75,NAVY,6)+dot(x,y-140,10,TEAL)
def phone(x,y,label='phone'):return rc(x-50,y-90,100,170,'white',16,NAVY)+rc(x-36,y-66,72,112,BG,6)+dot(x,y+63,5,GRAY)+tx(x,y+125,label,27)
def nucleus(x,y,label='',r=52):
 z=dot(x,y,r,'#c9dfee',BLUE)+f'<ellipse cx="{x-r*.25}" cy="{y-r*.3}" rx="{r*.35}" ry="{r*.17}" fill="white" opacity=".65"/>'
 return z+tx(x,y+r+40,label,27)
def longwave(x,y,w=1000):
 z=''
 for j in range(4):
  for i in range(48):
   px=x+i*w/47+35*math.sin(i/47*6*math.pi)
   z+=dot(px,y+j*28,5,BLUE)
 return z
def rayDiagram(index=False):
 z=rc(140,330,1160,215,'#dff0f6',0)+ln(140,330,1300,330,GRAY)+ln(720,115,720,550,GRAY,3,'9 8')+arrow(380,135,720,330,ORANGE)+arrow(720,330,860,525,TEAL)
 z+=tx(1080,265,'air: n ≈ 1.00',31)+tx(1080,425,'glass: n ≈ 1.50',31)+tx(758,125,'normal',25,GRAY,'start')+tx(405,200,'incident ray',28,ORANGE)+tx(1000,530,'refracted ray',28,TEAL)
 z+=tx(405,460,'toward the normal',29,TEAL)
 return z
def diffraction(wide=False,example=False):
 z='';gap=190 if wide else 48
 for x in range(170,630,85):z+=ln(x,150,x,505,BLUE,5)
 z+=ln(690,100,690,330-gap/2,NAVY,12)+ln(690,330+gap/2,690,550,NAVY,12)
 if wide:
  for k in range(1,6):
   x=700+k*85;z+=ln(x,240,x,420,TEAL,5)+f'<path d="M{x},240 Q{x-20},200 {x-40},195 M{x},420 Q{x-20},460 {x-40},465" fill="none" stroke="{TEAL}" stroke-width="4"/>'
 else:
  for r in [90,175,260,345,430]:z+=f'<path d="M690,{330-r} A{r},{r} 0 0 1 690,{330+r}" fill="none" stroke="{TEAL}" stroke-width="4"/>'
 z+=tx(380,90,'incoming wavefronts',30,BLUE)+tx(1040,90,'less spreading'if wide else'wide spreading',30,TEAL)+tx(720,570,'opening ≫ wavelength'if wide else'opening ≈ wavelength',31)
 return z
def doppler(mode=0):
 z='';source=780
 for k in range(1,6):
  r=k*45;cx=source if mode==2 else source-k*22
  z+=f'<circle cx="{cx}" cy="330" r="{r}" fill="none" stroke="{BLUE}" stroke-width="3"/>'
 z+=dot(source,330,22,ORANGE)+tx(source,400,'source',27)
 if mode!=2:z+=arrow(source,220,source+155,220,ORANGE)+tx(source+75,185,'motion',26,ORANGE)
 if mode in (0,4):z+=dot(1170,330,16,TEAL)+tx(1160,415,'higher f',32,TEAL)+tx(1160,465,'shorter λ',27)
 elif mode in(1,5):z+=dot(225,330,16,TEAL)+tx(230,440,'lower f',32,TEAL)+tx(230,485,'longer λ',27)
 elif mode==2:z+=tx(1170,330,'equal spacing',30,TEAL)+tx(720,100,'source and observer at rest in the medium',31)
 elif mode==3:z+=arrow(1080,330,1250,330,TEAL)+arrow(340,330,170,330,TEAL)+tx(1180,400,'v sound',29,TEAL)+tx(240,420,'v sound',29,TEAL)
 elif mode==6:
  z=dot(450,380,22,ORANGE)+arrow(480,380,940,380,ORANGE)+dot(980,380,20,'#dbe6ed')+dot(450,140,16,TEAL)+arrow(450,335,450,175,BLUE)+tx(740,470,'source motion →',30,ORANGE)+tx(470,555,'source position when this sound was emitted',27)+tx(855,170,'sound emitted at 90° to motion',29,TEAL)
 return z
def spectrum(k,application=False):
 names=['Radio','Micro','IR','Visible','UV','X-ray','Gamma'];colors=[BLUE,TEAL,'#b54c4c','#55a760',PURPLE,'#705795','#504778'];z=''
 for i,(n,c)in enumerate(zip(names,colors)):
  x=130+i*169;z+=rc(x,90,160,72,c if i==k else BG,10)+tx(x+80,134,n,28,'white'if i==k else GRAY)
 z+=arrow(170,210,1270,210,TEAL)+tx(720,250,'frequency and photon energy increase →',28,TEAL)+tx(720,58,'schematic spectrum • bands are not equal-width intervals',23,GRAY)
 if k==0:
  z+=antenna(290,495)+wave(370,390,620,50,2,BLUE)+phone(1120,425,'receiver')+tx(290,545,'transmitter',27)
 elif k==1:
  z+=antenna(270,485)+arrow(365,345,1000,345)+arrow(1000,450,365,450,BLUE)+rc(1080,330,145,130,'#d1dfe8')+tx(1150,510,'target',28)+tx(680,315,'radar pulse',28,TEAL)+tx(680,500,'reflected signal',28,BLUE)
 elif k==2:
  z+=dot(360,370,45,ORANGE)+rc(290,420,140,110,'#dc8e54')+wave(480,390,425,30,4,RED)+rc(1030,315,215,170,'#27455b')+rc(1050,335,175,130,'#df8249')+tx(355,570,'warm object emits IR',28)+tx(1138,545,'thermal detector',28)
 elif k==3:
  for j,c in enumerate(['#c33e46','#dd903d','#dec342','#4d9a67',BLUE,PURPLE]):z+=ln(250,330+j*28,955,330+j*28,c,10)
  z+=f'<path d="M1020,415Q1130,300 1250,415Q1130,530 1020,415Z" fill="{BG}" stroke="{NAVY}" stroke-width="4"/>'+dot(1135,415,30,BLUE)+dot(1135,415,14,NAVY)+tx(615,545,'visible wavelengths reach the eye',29)
 elif k==4:
  z+=rc(210,320,200,145,BG)+tx(310,403,'UV source',30)+wave(450,385,360,28,7,PURPLE)+dot(1060,385,58,BG,TEAL)+dot(1035,367,9,TEAL)+dot(1078,412,9,TEAL)+arrow(990,485,1125,315,RED)+tx(1040,550,'can damage molecules',29)
 elif k==5:
  z+=rc(590,290,180,240,'#e4d0c0')+rc(655,305,50,210,'white',20)+rc(1060,275,100,285,NAVY,6)
  for j in range(5):z+=arrow(250,320+j*43,550,320+j*43,BLUE,4)
  for j in [0,4]:z+=arrow(800,320+j*43,1030,320+j*43,TEAL,4)
  z+=tx(665,280,'bone + soft tissue',28)+tx(1110,590,'detector',26)+tx(330,540,'unequal absorption',28)
 elif k==6:
  z+=nucleus(345,400,'excited nucleus')+wave(445,395,570,35,9,PURPLE)+arrow(1025,395,1195,395,PURPLE)+tx(975,515,'high-energy photon',32,PURPLE)
 if application:z+=tx(720,585,['broadcast → antenna','outgoing pulse → echo','emission → temperature pattern','light → image','UV → molecular change','transmission → contrast','nuclear transition → radiation'][k],27,TEAL)
 return z
def network(kind):
 z=''
 if kind==0:z+=phone(330,360)+wave(420,330,560,35,4)+rc(1080,280,110,120,BG,30,NAVY)+tx(1135,475,'headphones',29)+tx(720,180,'short-range link • low power',35,TEAL)
 elif kind==1:
  z+=rc(610,310,220,105,BG,15,NAVY)+ln(645,310,620,235,NAVY,5)+ln(795,310,820,235,NAVY,5)+tx(720,385,'router',32)+phone(250,380,'device')+phone(1170,380,'device')+both(340,335,555,335,BLUE)+both(875,335,1090,335,BLUE)+tx(720,530,'local wireless network',34,TEAL)
 elif kind==2:
  z+=antenna(310,450)+antenna(1110,450)+phone(720,365)+arrow(395,310,620,310,BLUE)+arrow(825,310,1040,310,BLUE)+arrow(520,530,910,530,ORANGE)+tx(720,585,'handoff as the phone moves',30)+tx(310,500,'cell A',29)+tx(1110,500,'cell B',29)
 elif kind==3:
  z+=f'<path d="M180,530Q720,280 1260,530" fill="{BG}" stroke="{TEAL}" stroke-width="4"/>'+rc(650,145,140,70,'#c7d4e0')+rc(490,155,140,50,BLUE,2)+rc(810,155,140,50,BLUE,2)+antenna(270,505)+antenna(1170,505)+arrow(300,345,630,220,ORANGE)+arrow(810,220,1135,345,TEAL)+tx(720,340,'longer path → longer delay',29)+tx(720,585,'satellite relay',34,TEAL)
 return z
def linkissue(kind):
 z=antenna(230,450)+phone(1200,380,'receiver')
 if kind=='distance':
  for i,r in enumerate([150,280,410,540,670]):z+=f'<path d="M{230+r*.72},{310-r*.6} A{r},{r} 0 0 1 {230+r*.72},{310+r*.6}" fill="none" stroke="{BLUE}" stroke-opacity="{1-i*.16}" stroke-width="6"/>'
  z+=tx(730,570,'energy spreads over a larger area',32,TEAL)+tx(410,180,'near',28)+tx(1110,180,'far',28)
 elif kind=='wall':
  z+=rc(690,140,80,380,'#bdc9d2',5)+wave(320,325,330,62,3)+wave(820,325,275,24,2,TEAL)+tx(720,575,'some energy is absorbed or reflected',30)+tx(460,190,'stronger signal',28)+tx(1010,190,'weaker signal',28)
 elif kind=='interference':
  z+=antenna(670,555)+wave(340,285,705,32,6,BLUE)+wave(760,475,340,45,4,ORANGE)+tx(660,200,'wanted signal',30,BLUE)+tx(820,580,'competing signal',28,ORANGE)
 elif kind=='weather':
  z+=rc(555,200,420,145,'#d6e1eb',70)+tx(765,255,'rain / atmosphere',29)
  for i in range(8):z+=ln(590+i*48,365,575+i*48,405,BLUE,4)
  z+=wave(315,320,240,45,2)+wave(975,320,135,18,2,TEAL)+tx(745,550,'attenuation depends on frequency',30,TEAL)
 elif kind=='power':
  z+=wave(350,280,730,55,5,BLUE)+wave(350,465,730,20,5,GRAY)+tx(700,180,'higher transmitted power',31,BLUE)+tx(710,545,'more energy used by the transmitter',28,TEAL)
 elif kind=='antenna':
  z+=f'<path d="M280,310L1070,180L1070,500Z" fill="#dff0ed"/>'+arrow(300,310,1060,310)+tx(730,130,'directional antenna',32,TEAL)+tx(710,555,'focus radiation toward the receiver',30)
 return z
def art(bi,j,item):
 z='';cap='';alt=''
 if bi in [0,1,2,3,4,5,10]:
  if bi==0 and j==1:
   z=longwave(210,280)+arrow(450,180,1040,180)+tx(745,145,'wave travels →',32,TEAL)+both(625,465,780,465)+tx(720,520,'particle motion ↔',31,ORANGE);cap='Particles oscillate parallel to the direction of travel.'
  elif bi==0:
   z=axis(170,350,1280,145)+wave(200,350,1000,110,2)+arrow(970,130,1210,130)+dot(700,350,13)+both(700,245,700,450)+tx(995,90,'wave travel',30,TEAL)+tx(840,465,'particle motion',28,ORANGE);cap='Particle motion is perpendicular to wave travel.'
  elif bi==1 or (bi==3 and j==1):
   k=j if bi==1 else 3;z=ln(160,350,1280,350,GRAY,3,'9 8')+wave(190,350,1060,130,2)
   if k==0:z+=dot(322.5,220,15)+arrow(430,125,340,200,ORANGE)+tx(590,110,'maximum upward displacement',33,ORANGE)
   elif k==1:z+=dot(587.5,480,15)+arrow(690,555,605,495,ORANGE)+tx(920,565,'maximum downward displacement',31,ORANGE)
   elif k==2:z+=both(322.5,350,322.5,220)+tx(440,295,'amplitude A',32,ORANGE)+tx(1010,440,'measured from equilibrium',27)
   elif k==3:z+=bracket(322.5,852.5,155,'one wavelength λ')+ln(322.5,170,322.5,220,TEAL,2)+ln(852.5,170,852.5,220,TEAL,2)
   elif k==4:z+=ln(160,350,1280,350,ORANGE,6)+tx(1050,410,'zero displacement',32,ORANGE)
   cap=['Crest: the highest point above equilibrium.','Trough: the lowest point below equilibrium.','Amplitude is not the crest-to-trough height.','Measure between matching points in consecutive cycles.','The center line represents the undisturbed position.'][k]
  elif bi==2:
   if j<2:
    z=axis(180,350,1270,155,'time (s)','displacement')+wave(210,350,980,100,5)+bracket(210,1190,515,'1.0 second')
    z+=bracket(259,455,170,'T = 0.20 s') if j==1 else tx(720,140,'5 complete cycles → 5 Hz',37,TEAL)
   else:z=panel(140,150,530,355,'10 Hz')+wave(180,360,450,55,5)+tx(405,465,'T = 0.10 s',36,TEAL)+panel(770,150,530,355,'2 Hz')+wave(810,360,450,55,1)+tx(1035,465,'T = 0.50 s',36,TEAL)
   cap='Count cycles per second for frequency; measure seconds per cycle for period.'
  elif bi==3:
   if j==0:z=wave(180,320,260,90,.5,GRAY)+wave(960,320,260,90,.5,BLUE)+arrow(440,200,970,200)+tx(705,155,'after 1 second',34,TEAL)+bracket(310,1090,475,'3 meters traveled')
   elif j==2:z=axis(150,350,1290,150,'time (s)','displacement')+wave(180,350,1030,70,10)+bracket(180,1210,500,'1.0 s → 10 cycles → 10 Hz')
   else:z=wave(160,350,1090,85,4)+bracket(228,501,190,'λ = 2 m')+tx(720,510,'4 cycles each second × 2 m each cycle',35,TEAL)+tx(720,565,'wave travels 8 m in 1 s',34)
   cap='Wave speed describes travel of the disturbance, not the vibration speed of a particle.'
  elif bi==4 or (bi==5 and j==1):
   rev=bi==4 and j==1;a=(8,1)if rev else(4,2);bb=(4,2)if rev else(8,1)
   z=wave(260,230,940,60,a[0]/2)+wave(260,455,940,60,bb[0]/2)+tx(180,240,f'{a[0]} Hz',32)+tx(180,465,f'{bb[0]} Hz',32)+tx(1240,240,f'{a[1]} m',29)+tx(1240,465,f'{bb[1]} m',29)+tx(720,115,'same speed: 8 m/s',37,TEAL)
   cap='For this nondispersive model, frequency and wavelength change inversely.'
  elif bi==5:
   if j==0:z=panel(110,150,570,365,'lower tension')+wave(150,330,470,65,1.5)+arrow(290,475,455,475)+panel(760,150,570,365,'higher tension')+wave(800,330,470,65,1.5)+arrow(875,475,1190,475)+tx(720,90,'same rope, different tension',33)
   else:z=rc(720,150,580,395,'#dff0f6',0)+ln(720,150,720,545,NAVY,4)+wave(150,350,570,75,2,BLUE)+wave(720,350,570,75,3,TEAL)+tx(420,210,'faster medium',32)+tx(1010,210,'slower medium',32)+tx(720,565,'same frequency • shorter wavelength on the right',31,TEAL)
   cap='The source sets frequency; the medium determines wave speed in this model.'
  elif bi==10:
   if j==0:z=wave(230,245,980,60,2)+wave(230,455,980,60,6)+tx(160,250,'low f',28)+tx(160,460,'high f',28)+tx(720,125,'same time interval',33,TEAL);cap='More cycles per second correspond to higher pitch.'
   elif j==1:z=wave(230,245,980,28,3)+wave(230,455,980,85,3)+tx(170,250,'soft',28)+tx(170,460,'loud',28);cap='At the same frequency, larger sound-pressure amplitude usually sounds louder.'
   elif j==2:
    for x,y,a,n,l in [(110,130,25,4,'high, soft'),(780,130,65,4,'high, loud'),(110,365,25,1,'low, soft'),(780,365,65,1,'low, loud')]:z+=panel(x,y,550,200,l)+wave(x+35,y+120,480,a,n)
    cap='Frequency and amplitude can be adjusted independently.'
   elif j==3:
    for x,w,c,l in [(140,240,GRAY,'infrasound'),(380,660,TEAL,'human hearing'),(1040,250,PURPLE,'ultrasound')]:z+=rc(x,290,w,125,c)+tx(x+w/2,365,l,29,'white')
    z+=tx(380,465,'20 Hz',32)+tx(1040,465,'20,000 Hz',32)+tx(720,165,'approximate range • varies by person and age',30);cap='The frequency scale is schematic, not linear.'
   else:
    for x,h,l in [(350,70,'0 dB'),(720,150,'10 dB'),(1090,280,'20 dB')]:z+=rc(x-125,250,250,240,BG,18)+tx(x,415,l,36,TEAL)+tx(x,325,['I₀','10 I₀','100 I₀'][[350,720,1090].index(x)],38)
    z+=arrow(495,360,565,360)+arrow(865,360,935,360)+tx(720,550,'×10 intensity at each step',33,TEAL)
    z+=tx(720,105,'sound intensity level',36,TEAL);cap='Each 10 dB increase means 10 times the intensity, not 10 times perceived loudness.'
 elif bi==6:
  if j==0:
   z=ln(180,300,1130,300,GRAY,3)+ln(1180,145,1180,525,NAVY,10)+wave(370,300,240,100,.5)+arrow(650,195,925,195)+wave(710,420,240,-75,.5,ORANGE)+arrow(600,485,340,485,ORANGE)+tx(520,145,'incident pulse',30,BLUE)+tx(455,550,'inverted reflected pulse',30,ORANGE);cap='A transverse pulse reflecting at a fixed end is inverted.'
  elif j==1:z=rayDiagram()+tx(425,555,'energy crosses the boundary',30,TEAL);cap='A transmitted wave enters the second medium; its speed and wavelength may change.'
  elif j==2:z=rayDiagram()+arrow(720,330,1050,130,BLUE)+tx(1125,125,'reflected',29,BLUE);cap='At a transparent boundary, some energy can reflect and some can transmit.'
  else:z=rayDiagram();cap='Light entering glass obliquely bends toward the normal because its speed decreases.'
 elif bi==7:
  if j<2:
   z=wave(180,230,420,60,2,BLUE)+wave(820,230,420,60,2,ORANGE,0 if j==0 else math.pi)+tx(720,245,'+',60)+tx(720,345,'↓ sum',33,TEAL)+wave(510,465,420,120 if j==0 else 0,2,TEAL)+tx(1060,520,'2A'if j==0 else'0',38,TEAL)
   cap='Displacements add while the waves overlap.'if j==0 else'Equal opposite displacements cancel locally; the waves are not destroyed.'
  else:
   for y,label,pa,pb in [(190,'before',370,990),(350,'overlap',680,720),(510,'after',990,370)]:
    z+=tx(135,y,label,30)+arrow(1160,y,1270,y,BLUE)+arrow(290,y,180,y,ORANGE)
    z+=wave(630,y,180,90,.5,TEAL) if label=='overlap' else wave(pa-90,y,180,45,.5,BLUE)+wave(pb-90,y,180,45,.5,ORANGE)
   cap='In a linear medium, pulses pass through one another and continue along their paths.'
 elif bi==8:z=diffraction(j==2,j==3);cap=['Wavefronts spread into the region beyond an opening.','An opening comparable to wavelength produces substantial spreading.','A much wider opening produces a narrower central spread.','Sound spreading through a doorway can reach a listener off to the side.'][j]
 elif bi==9:
  z=longwave(210,275)+arrow(430,140,1100,140)+tx(760,100,'sound energy travels →',34,TEAL)
  if j==1:z+=tx(385,465,'compression',31,BLUE)+tx(635,525,'rarefaction',31,TEAL)+ln(385,425,377,370,BLUE)+ln(635,480,543,370,TEAL)
  else:z+=dot(710,317,11,ORANGE)+both(630,455,790,455)+tx(710,530,'one particle oscillates locally',32,ORANGE)
  cap='A longitudinal sound wave moves through the medium while particles vibrate about equilibrium.'
 elif bi==11:
  if j==0:
   z=axis(240,530,1240,150,'driving frequency','response amplitude')
   pts=[(x,525-320/(1+((x-760)/85)**2))for x in range(270,1201,5)]
   z+='<path d="'+' '.join(('M'if i==0 else'L')+f'{x},{y}'for i,(x,y)in enumerate(pts))+f'" fill="none" stroke="{BLUE}" stroke-width="6"/>'+ln(760,530,760,205,TEAL,3,'7 7')+tx(760,140,'largest response near natural frequency',31,TEAL);cap='Resonance transfers energy effectively when a periodic drive matches a natural mode.'
  elif j<3:
   z=ln(190,350,1250,350,GRAY,3)+wave(190,350,1060,135,1.5)+wave(190,350,1060,-135,1.5,'#95b2d7')
   for x in [190,543.33,896.67,1250]:z+=dot(x,350,12,ORANGE)
   if j==2:
    z+=ln(543.33,365,625,485,ORANGE,3)+tx(760,540,'node: no displacement',30,ORANGE)+both(366.7,215,366.7,485)+tx(410,130,'antinode: largest motion',30,TEAL)
   else:z+=tx(720,140,'two extreme shapes of one standing mode',31,TEAL)+tx(720,555,'nodes remain in fixed positions',31)
   cap='These curves represent particle displacement, not pressure.'
  else:
   z=ln(210,215,1210,215,NAVY,6)+ln(210,320,1210,320,NAVY,6)+wave(210,267,1000,45,.5,BLUE,math.pi/2)+tx(130,275,'open',26)+tx(1290,275,'open',26)+tx(720,175,'fundamental: L = λ/2',31,TEAL)
   z+=ln(210,440,1210,440,NAVY,6)+ln(210,545,1210,545,NAVY,6)+ln(210,440,210,545,NAVY,8)+wave(210,492,1000,45,.25,BLUE)+tx(130,500,'closed',26)+tx(1290,500,'open',26)+tx(720,405,'fundamental: L = λ/4',31,TEAL);cap='Displacement patterns: open ends are antinodes; a closed end is a node.'
 elif bi in[12,13]:
  mode=j if bi==12 else j+4;z=doppler(mode);cap=['Approaching source: closer wavefront spacing and higher observed frequency.','Receding source: wider spacing and lower observed frequency.','No relative motion through the medium gives no classical Doppler shift.','Wavefronts still travel at the sound speed relative to the medium.','Ahead: compressed wavefront spacing.','Behind: expanded wavefront spacing.','In the classical model, transverse emission has zero radial source velocity.'][mode]
 elif bi==14:
  if j==0:
   for k in range(1,6):z+=f'<circle cx="{980-k*65}" cy="340" r="{k*65}" fill="none" stroke="{BLUE}" stroke-width="3"/>'
   z+=dot(980,340,19,ORANGE)+arrow(1010,340,1220,340,ORANGE)+tx(720,105,'at the sound speed, fronts meet at the source',33);cap='The idealized Mach 1 limit has wavefronts piling up at the forward edge.'
  else:
   z=ln(1110,330,350,598.7,TEAL,6)+ln(1110,330,350,61.3,TEAL,6)+arrow(1125,330,1300,330,ORANGE)+dot(1110,330,18,ORANGE)
   for k in [1,2,3,4]:z+=f'<circle cx="{1110-k*150}" cy="330" r="{k*50}" fill="none" stroke="{BLUE}" stroke-width="2"/>'
   z+=tx(870,100,'supersonic source: Mach > 1',32,ORANGE)
   if j>=2:z+=ln(170,555,1270,555,GRAY,5)+dot(470,530,16,TEAL)+ln(470,546,470,555,NAVY,5)+tx(860,530,'shock passes the observer',29,TEAL)
   cap=['','A finite Mach cone forms for supersonic motion; Mach 1 is the limiting case.','The rapid pressure change at a passing shock is heard as a sonic boom.','The source continues producing a shock along its supersonic flight path.'][j]
 elif bi in[15,23]:z=spectrum(j,bi==23);cap=['Radio and microwaves overlap in naming: microwaves are a subset of radio waves.','Microwaves support radar, communication, and energy transfer to matter.','Infrared radiation can carry energy from warm objects to a detector.','Visible light is the portion detected by human vision.','UV photons interact with matter differently from visible photons.','X-ray images use differences in attenuation through materials.','Gamma rays can be emitted when an excited nucleus loses energy.'][j]
 elif bi==16:
  if j==0:z=rayDiagram();cap='Refraction depends on refractive index and angle of incidence, not mass density alone.'
  elif j==1:z=rayDiagram()+tx(400,95,'n = c / v',42,TEAL);cap='A larger refractive index means a lower light speed at the specified wavelength.'
  else:
   for y,w,l in [(210,950,'vacuum: c'),(360,710,'water: about 0.75c'),(510,635,'glass: about 0.67c')]:z+=arrow(180,y,180+w,y,BLUE,12)+tx(180,y-35,l,32,NAVY,'start')
   cap='Illustrative speeds; refractive index varies with wavelength and material.'
 elif bi==17:
  colors=['#c64144','#dc832b','#c2a100','#36936c',BLUE,PURPLE];nm=[700,610,580,530,470,400];c=colors[j]
  for i,co in enumerate(colors):z+=rc(170+i*180,125,170,65,co,8)+tx(255+i*180,235,str(nm[i])+' nm',26,c if i==j else GRAY)
  z+=wave(200,400,1035,100,700/nm[j]*2,c)+bracket(200+1035/(700/nm[j]*2)*.25,200+1035/(700/nm[j]*2)*1.25,550,f'example wavelength ≈ {nm[j]} nm',c)
  cap='Illustrative wavelength within the color band; color boundaries are approximate.'
 elif bi==18:
  labels=['data','modulator','antenna','EM signal','receiver','decoded data'];xx=[145,375,610,835,1060,1280]
  for i,x in enumerate(xx):z+=rc(x-90,260,180,140,TEAL if i==min(j+1,5) else BG)+tx(x,340,labels[i],25,'white'if i==min(j+1,5) else NAVY)
  for i in range(5):z+=arrow(xx[i]+98,330,xx[i+1]-97,330)
  if j in[0,4]:
   for k,bit in enumerate([1,0,1,1,0]):z+=tx(365+k*165,170,str(bit),40,ORANGE)+wave(310+k*165,510,125,40 if bit else 8,3)
  elif j==1:z+=antenna(610,590)+arrow(705,475,1000,475)+tx(875,530,'changing fields radiate',28)
  elif j==2:z+=wave(300,515,800,55,5)+tx(720,180,'no material medium required',35,TEAL)
  elif j==3:z+=wave(300,530,700,45,5)+arrow(1010,530,1200,530)+tx(720,180,'incoming field drives an electrical signal',33,TEAL)
  cap=['One simplified modulation scheme maps bits to different carrier amplitudes.','A transmitting antenna radiates an electromagnetic signal.','Electromagnetic waves propagate through air and vacuum.','A receiving antenna responds to the arriving electromagnetic field.','The receiver recovers the bit pattern from the modulated signal.'][j]
 elif bi==19 or(bi==22 and j==0):
  if bi==19 and j==2:z=panel(120,155,560,380,'design needs')+tx(400,300,'range • data rate • reliability',29)+panel(760,155,560,380,'engineering choices')+tx(1040,300,'band • bandwidth • power',29)+tx(1040,390,'antenna • environment',29)+arrow(690,360,750,360);cap='Carrier frequency alone does not set data rate or range.'
  else:
   z=wave(280,255,940,65,6 if j==0 else 2)+wave(280,480,940,65,2 if j==0 else 6)+tx(720,120,'same propagation speed in vacuum',35,TEAL)+tx(165,260,'high f'if j==0 else'low f',30)+tx(165,485,'low f'if j==0 else'high f',30)
   cap='Shorter wavelength means higher carrier frequency; bandwidth and noise govern data capacity.'
 elif bi==20:z=linkissue(['distance','wall','interference','weather'][j]);cap=['Greater distance usually reduces received signal strength.','Materials can absorb and reflect a signal.','Competing signals can reduce the receiver’s ability to recover data.','Rain attenuation is important in some high-frequency communication bands.'][j]
 elif bi==21:z=network(j);cap=['Personal devices exchange data over a nearby wireless link.','Devices communicate with a local access point.','Cellular networks transfer a moving connection between coverage areas.','Signal travel time depends on the total path length.'][j]
 elif bi==22:z=linkissue(['distance','power','antenna','wall','weather'][j]);cap=['','More power can improve the received signal, at an energy cost.','Antenna direction and gain affect how energy is distributed.','Obstacles and competing signals reduce link quality in different ways.','Weather effects depend on the frequency band and path.'][j]
 elif bi==24:
  if j==0:z=spectrum(0)+tx(720,580,'interaction depends on wavelength and material',29,TEAL);cap='Penetration is material- and frequency-dependent; no band passes through everything.'
  elif j==1:
   z=panel(120,140,560,410,'lower photon energy')+wave(155,355,300,55,2,BLUE)+dot(550,355,45,BG,GRAY)+panel(760,140,560,410,'higher photon energy')+wave(800,355,290,30,8,PURPLE)+dot(1170,355,40,BG,GRAY)+arrow(1200,350,1290,275,ORANGE)+tx(1110,470,'possible ionization',28,ORANGE);cap='Photon energy rises with frequency; ionization depends on the photon and target.'
  else:
   for x,label,sub in [(275,'communication','microwave link'),(720,'imaging','X-ray attenuation'),(1165,'astronomy','multiple bands')]:z+=panel(x-190,190,380,340,label)+tx(x,365,sub,27)
   cap='Choose the spectral band for the physical interaction or information required.'
 elif bi==25:
  z=rc(150,470,1140,75,'#b9cad7',10)+tx(720,560,'same metal • fixed threshold energy',30)
  if j==0:
   z+=wave(200,210,400,35,2,RED)+arrow(595,245,595,440,RED)+tx(370,150,'below threshold',32,RED)+wave(830,210,400,30,6,PURPLE)+arrow(1000,250,1000,440,PURPLE)+arrow(1010,445,1190,335,ORANGE)+dot(1190,335,10,ORANGE)+tx(1040,150,'above threshold',32,PURPLE)+tx(410,400,'no emission',30,GRAY)
   cap='E = hf: higher frequency means more energy per photon. Threshold depends on the material.'
  else:
   for x in [330,430]:z+=arrow(x,235,x,450,PURPLE)+dot(x,195,12,PURPLE)+arrow(x,465,x+55,375,ORANGE)
   for x in [850,950,1050,1150]:z+=arrow(x,235,x,450,PURPLE)+dot(x,195,12,PURPLE)+arrow(x,465,x+55,375,ORANGE)
   z+=tx(405,125,'lower intensity',32)+tx(995,125,'higher intensity',32)+tx(720,325,'same frequency above threshold',29,TEAL);cap='More photons per second can eject more electrons; maximum electron energy stays the same.'
 elif bi==26:
  if j==0:
   for y,l,c,shift in [(210,'approaching',BLUE,-60),(390,'rest',GRAY,0),(540,'receding',RED,60)]:
    z+=tx(220,y,l,29,c)+ln(380,y,1280,y,GRAY,2)
    for x in [620,770,880,1110]:
     xp=380+(x-380)*(0.88 if shift<0 else 1.12 if shift>0 else 1);z+=ln(xp,y-45,xp,y+45,c,7)
   z+=tx(720,95,'same spectral pattern shifts together',34,TEAL)+tx(1220,595,'wavelength →',25,GRAY);cap='A blueshift moves spectral lines to shorter wavelengths; a redshift moves them to longer wavelengths.'
  else:
   z=panel(100,120,580,450,'additive light')+rc(420,260,160,180,NAVY,10)+rc(450,290,100,120,'white',5)+arrow(160,250,425,315,RED)+arrow(160,350,425,350,'#36936c')+arrow(160,450,425,385,BLUE)+tx(385,535,'RGB → white',30)+panel(760,120,580,450,'subtractive filters')+rc(865,255,95,175,'#56c9d0')+rc(1000,255,95,175,'#d767b2')+rc(1135,255,95,175,'#e2c746')+tx(1050,505,'each removes wavelengths',27)
   cap='Adding light combines signals; pigments and filters remove parts of the incident spectrum.'
 elif bi==27:
  if j==0:
   z=rc(655,180,120,370,'#e3eef7',8,BLUE)
   for k in range(4):
    a=k*math.pi/4;z+=both(365-80*math.cos(a),365-80*math.sin(a),365+80*math.cos(a),365+80*math.sin(a),GRAY)
   z+=both(1050,250,1050,465,TEAL)+arrow(450,365,610,365)+arrow(815,365,945,365)+tx(360,155,'many orientations',30)+tx(1050,155,'one orientation',30)+tx(720,585,'electric-field direction',32,TEAL);cap='An ideal linear polarizer transmits the field component along its transmission axis.'
  else:
   for y,angle,l in [(245,0,'aligned: transmitted'),(470,90,'crossed: blocked')]:
    z+=rc(380,y-85,120,170,BG,6,BLUE)+rc(840,y-85,120,170,BG,6,BLUE)+both(440,y-60,440,y+60,TEAL)+both(900 if angle==0 else 840,y-60 if angle==0 else y,900 if angle==0 else 960,y+60 if angle==0 else y,TEAL)+arrow(550,y,780,y)+tx(1170,y,l,26)
   cap='For ideal polarizers, perpendicular transmission axes give zero transmitted intensity.'
 elif bi==28:
  z=nucleus(310,350,'parent')+arrow(415,350,675,350)+nucleus(805,350,'daughter')
  if j==0:
   for x,y,c in [(1115,320,ORANGE),(1150,320,ORANGE),(1115,355,BLUE),(1150,355,BLUE)]:z+=dot(x,y,18,c)
   z+=tx(1140,455,'2 protons + 2 neutrons',26)+tx(720,160,'A decreases by 4 • Z decreases by 2',35,TEAL);cap='An alpha particle carries four nucleons and charge +2e.'
  elif j==1:
   z+=dot(1120,300,12,ORANGE)+tx(1140,260,'electron',27)+arrow(1000,360,1240,455,PURPLE)+tx(1130,500,'antineutrino',27,PURPLE)+tx(720,155,'neutron → proton + electron + antineutrino',32,TEAL)+tx(720,550,'A unchanged • Z increases by 1',33);cap='This is beta-minus decay; the emitted electron is created in the decay.'
  else:z+=wave(940,350,310,40,6,PURPLE)+tx(1120,460,'gamma photon',29,PURPLE)+tx(720,160,'same A and Z • lower nuclear energy',35,TEAL);cap='Gamma emission changes the nuclear energy state, not the element or mass number.'
 elif bi==29:
  counts=[1,1,1]if j==0 else[1,2,4]
  for k,count in enumerate(counts):
   x=310+k*410
   for h in range(count):z+=nucleus(x,350+(h-(count-1)/2)*110,r=28)
   z+=tx(x,130,f'generation {k+1}',28)
   if k<2:z+=arrow(x+65,350,x+320,350)
  if j==0:z+=rc(640,470,170,40,GRAY,4)+tx(725,560,'surplus neutrons absorbed',29,TEAL)
  cap='A steady chain reaction averages one continuing fission per fission.'if j==0 else'If more than one fission continues per event on average, the chain grows.'
 elif bi==30:
  if j==0:z=nucleus(320,330,'heavy nucleus',80)+arrow(435,330,685,330)+nucleus(855,235,'fragment',45)+nucleus(855,445,'fragment',45)+dot(1160,225,12,BLUE)+dot(1200,350,12,BLUE)+dot(1160,465,12,BLUE)+tx(1170,565,'neutrons',30)
  else:z=nucleus(270,310,'light nucleus',38)+nucleus(480,390,'light nucleus',38)+arrow(585,350,835,350)+nucleus(975,350,'heavier product',62)+arrow(1060,350,1270,350,ORANGE)+tx(1170,430,'energy',31,ORANGE)
  cap='Fission splits a heavy nucleus and releases energy and neutrons.'if j==0 else'Fusion combines light nuclei; suitable reactions release energy.'
 elif bi==31:
  if j==0 or j==3:
   z=ln(430,110,430,295,NAVY,10)+ln(430,330,430,390,NAVY,10)+ln(430,425,430,565,NAVY,10)+ln(1150,110,1150,565,GRAY,7)
   for cy in[313,408]:
    for r in[120,220,320,420,520,620]:z+=f'<path d="M430,{cy-r} A{r},{r} 0 0 1 430,{cy+r}" fill="none" stroke="{BLUE}" stroke-width="2"/>'
   for y in[180,260,340,420,500]:z+=rc(1170,y-13,100,26,TEAL,5)
   if j==3:
    for a in range(65):z+=dot(1180+(a*37)%75,[180,260,340,420,500][a%5]+((a*11)%19)-9,3,NAVY)
   cap='Overlapping amplitudes produce alternating bright and dark bands.'if j==0 else'Individual detection events accumulate into an interference pattern.'
  elif j==1:z=rc(800,150,100,405,'#b6c9d8')+wave(250,335,400,35,5,PURPLE)+arrow(920,340,1230,200,ORANGE)+dot(1230,200,14,ORANGE)+tx(460,170,'one photon',33,PURPLE)+tx(1110,430,'one electron event',30,ORANGE);cap='A photon transfers a discrete amount of energy in an individual interaction.'
  else:
   for k,n in enumerate([16,8,4]):
    x=330+k*410
    for i in range(16):z+=dot(x+(i%4)*45-70,230+(i//4)*45,14,TEAL if i<n else'#dce5eb')
    z+=tx(x,480,[ '0 half-lives','1 half-life','2 half-lives'][k],30)+tx(x,545,f'{n} undecayed (expected)',26)
   cap='Half-life predicts an ensemble trend; the decay time of one nucleus is random.'
 if not z:raise ValueError((bi,j,item['title']))
 alt=item['title']+'. '+cap
 return '<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="720" viewBox="0 0 1440 720">'+rc(0,0,1440,720,BG,28)+rc(28,28,1384,664,'white',24)+'<defs><clipPath id="scene"><rect x="60" y="45" width="1320" height="555" rx="10"/></clipPath></defs><g clip-path="url(#scene)">'+z+'</g>'+caption(cap)+'</svg>',alt
for bi,b in enumerate(D):
 for j,item in enumerate(b['items']):
  name=f'{bi:02}-{j:02}-'+re.sub('[^a-z0-9]+','-',item['title'].lower()).strip('-')[:60]
  p=R/'images'/name;p.parent.mkdir(exist_ok=True)
  svg,alt=art(bi,j,item);p.with_suffix('.svg').write_text(svg,encoding='utf8')
  item.update(image=str(p.with_suffix('.png')),svg=str(p.with_suffix('.svg')),alt=alt,diagramIndex=f'{bi:02}-{j:02}')
(R/'diagram-manifest.json').write_text(json.dumps(D,indent=2),encoding='utf8')
out='<html><meta charset="utf-8"><title>Unit 5 diagram gallery</title><style>body{font:18px system-ui;max-width:1200px;margin:30px auto;color:#18354e}section{display:grid;grid-template-columns:1fr 1fr;gap:20px}img{width:100%}article{border:1px solid #ccdbe5;padding:12px}h2{margin-top:55px}</style><h1>Unit 5 tabs and accordion diagrams</h1>'
for b in D:
 out+=f'<h2>Lesson {b["course"]}, section {b["section"]}: {b["type"]}</h2><section>'
 for it in b['items']:out+='<article><h3>'+it['diagramIndex']+' '+html.escape(it['title'])+'</h3><img src="images/'+Path(it['image']).name+'"><p>'+html.escape(it['alt'])+'</p></article>'
 out+='</section>'
(R/'index.html').write_text(out+'</html>',encoding='utf8')
print(f'Created {sum(len(b["items"]) for b in D)} SVG diagrams and manifest.')

