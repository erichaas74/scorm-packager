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


def charge(x,y,sign='+',r=28):
 return dot(x,y,r,RED if sign=='+' else BLUE)+tx(x,y+10,sign,34,'white')
def path(d,c=BLUE,w=5,fill='none',dash=''):
 return f'<path d="{d}" fill="{fill}" stroke="{c}" stroke-width="{w}" stroke-linejoin="round" stroke-linecap="round" stroke-dasharray="{dash}"/>'
def tag(x,y,s,c=TEAL):return rc(x-100,y-28,200,54,c,12)+tx(x,y+10,s,28,'white')
def ring(x,y,r,c=BLUE,w=4):return f'<circle cx="{x}" cy="{y}" r="{r}" fill="none" stroke="{c}" stroke-width="{w}"/>'
def field(charges):
 z=''
 # Numerically integrate field-line tangents. Lines terminate at charges or panel edge.
 seeds=charges
 for cx,cy,q in seeds:
  backward=q<0
  for k in range(16):
   a=(k+.5)*2*math.pi/16
   if q<0 and any(Q>0 for X,Y,Q in charges) and math.cos(a)<0:continue
   x=cx+34*math.cos(a);y=cy+34*math.sin(a);pts=[(x,y)]
   for st in range(330):
    ex=ey=0
    for X,Y,Q in charges:
     rr=max((x-X)**2+(y-Y)**2,20**2)**1.5;ex+=Q*(x-X)/rr;ey+=Q*(y-Y)/rr
    norm=math.hypot(ex,ey)
    if norm<1e-8:break
    sign=-1 if backward else 1;x+=sign*4*ex/norm;y+=sign*4*ey/norm
    if not(145<x<1295 and 110<y<540):break
    pts.append((x,y))
    if any(math.hypot(x-X,y-Y)<31 for X,Y,Q in charges if Q*q<0):break
   if len(pts)>3:
    z+=path(' '.join(('M'if j==0 else'L')+f'{X:.1f},{Y:.1f}'for j,(X,Y)in enumerate(pts)),TEAL,3)
    ix=min(len(pts)-2,max(2,len(pts)//2));p0,p1=pts[ix-2],pts[ix+1];z+=arrow(*(p1+p0 if backward else p0+p1),TEAL,3)
 for x,y,q in charges:z+=charge(x,y,'+'if q>0 else'−')
 return z

def plates(x=310,X=1100,y=170,Y=505,labels=True):
 z=rc(x-16,y,32,Y-y,RED,5)+rc(X-16,y,32,Y-y,BLUE,5)
 for yy in range(y+35,Y,70):z+=tx(x-45,yy,'+',30,RED)+tx(X+45,yy,'−',30,BLUE)
 for yy in range(y+45,Y-10,72):z+=arrow(x+60,yy,X-60,yy,TEAL,4)
 if labels:z+=tx(x,y-35,'higher V',30,RED)+tx(X,y-35,'lower V',30,BLUE)+tx((x+X)/2,y-35,'electric field E →',30,TEAL)
 return z

def capacitor(mode):
 if mode=='spacing':
  z=tx(720,100,'isolated plates: same charge Q and area A',33)
  for a,gap,label,v in [(250,220,'gap d','V'),(810,440,'gap 2d','2V')]:
   z+=plates(a,a+gap,205,475,False)+bracket(a,a+gap,520,label)+tx(a+gap/2,165,v,36,TEAL)
  return z
 z=plates()
 if mode=='maps':
  for x,v in [(470,'75 V'),(705,'50 V'),(940,'25 V')]:z+=ln(x,160,x,520,PURPLE,3,'8 8')+tx(x,565,v,29,PURPLE)
  z+=tx(720,82,'dashed lines: equal potential',30,PURPLE)
 elif mode=='energy':z+=rc(500,230,400,200,'white',20,ORANGE)+tx(700,315,'energy in the field',31)+tx(700,375,'U = ½CV² = ½QV',34,TEAL)
 else:z+=bracket(310,1100,555,'plate separation d')
 return z

def force_charge(neg=False):
 z=plates();x=800 if neg else 600
 z+=rc(410,270,620,115,'white',15)+charge(x,328,'−'if neg else'+')+arrow(x-45 if neg else x+45,328,480 if neg else 970,328,ORANGE)+tx(720,455,'force and initial acceleration',29,ORANGE)
 z+=tx(720,565,'released from rest: kinetic energy rises, electric potential energy falls',27)
 return z

def polarization(mode):
 z=rc(165,185,170,300,RED,45)+tx(250,145,'charged rod',30,RED)
 for yy in [245,340,435]:z+=tx(250,yy,'+',42,'white')
 z+=rc(600,185,650,300,BG,45,GRAY)
 if mode in('insulator','neutral'):
  for x in [720,910,1100]:
   for y in [260,390]:z+=rc(x-62,y-40,125,80,'white',40)+charge(x-30,y,'−',19)+charge(x+30,y,'+',19)
  z+=tx(925,145,'bound charges shift within molecules',28)
 else:
  for y in [250,335,420]:z+=charge(665,y,'−',23)+charge(1185,y,'+',23)
  z+=tx(930,145,'neutral conductor',31)+arrow(1040,335,795,335,BLUE)+tx(925,405,'electrons shift',28,BLUE)
 if mode=='neutral':z+=arrow(665,535,455,535,ORANGE)+tx(960,545,'net attraction',31,ORANGE)
 elif mode=='transfer':z+=ln(465,185,465,485,GRAY,3,'8 8')+tx(470,550,'no charge crosses the gap',29,TEAL)
 else:z+=tx(920,545,'equal + and − : net charge stays zero',30,TEAL)
 return z

def conductor(mode):
 if mode=='insulator':
  z=rc(290,190,850,310,'#eee9f8',35,PURPLE)
  for x in [385,450,515]:
   for y in [270,335,400]:z+=charge(x,y,'−',21)
  return z+tx(740,120,'added charge stays near the rubbed region',33)+tx(870,350,'bound electrons',31,PURPLE)
 if mode=='sphere':
  z=dot(720,330,200,BG,GRAY)
  for k in range(14):a=k*math.pi/7;z+=charge(720+190*math.cos(a),330+190*math.sin(a),'−',18)
  return z+tx(720,95,'isolated conducting sphere',34)+tx(720,340,'E = 0 inside',36,TEAL)+tx(720,570,'excess charge on the surface',31)
 z=path('M310,190 Q160,330 310,470 L1050,365 L1230,330 L1050,295 Z',GRAY,4,BG)
 for x,y in [(330,205),(280,260),(275,400),(380,455),(680,415),(680,245),(960,283),(1080,303),(1140,314),(1195,324),(1150,345),(1085,358),(960,379)]:z+=tx(x,y,'−',27,BLUE)
 for yy in [210,285,375,450]:z+=arrow(1360,yy,1250,330,ORANGE,3)
 return z+tx(660,105,'surface charge is not always uniform',32)+tx(1040,530,'sharper tip → stronger local field',30,ORANGE)

def spark(lightning=False):
 if lightning:
  z=path('M400,520 L400,310 L720,135 L1040,310 L1040,520 Z',GRAY,6,BG)+ln(720,135,720,70,NAVY,8)+path('M720,80 L720,205 L1080,335 L1080,580',TEAL,8)+ln(1020,580,1140,580,TEAL,6)+ln(1040,597,1120,597,TEAL,5)+tx(1085,250,'conducting path',30,TEAL)+tx(720,565,'building',31)+tx(335,110,'rod',30)+arrow(405,108,690,86,ORANGE,4)
 else:z=dot(370,330,140,BG,BLUE)+path('M510,330 L570,290 L600,370 L650,315 L690,350 L735,320',ORANGE,9)+dot(885,330,140,BG,GRAY)+tx(370,340,'− − −',35,BLUE)+tx(900,340,'+ + +',35,RED)+tx(720,110,'air becomes conducting',34)+tx(720,550,'a brief charge transfer through an ionized path',31)
 return z

def wire(x,y,w=600,h=100,label='metal wire'):
 return rc(x,y,w,h,BG,20,GRAY)+tx(x+w/2,y-28,label,29)
def drift(mode):
 z=wire(190,230,1060,220)
 for x in range(260,1200,120):
  for y in [285,395]:z+=dot(x,y,13,'#b8c7d2')
 for x in [330,555,800,1060]:z+=charge(x,340,'−',17)
 if mode==0:z+=path('M1100,330 l-50,-20 l-30,40 l-70,-15 l-40,35 l-60,-40 l-65,15',BLUE,3)+arrow(950,520,420,520,BLUE)+tx(700,575,'slow average drift ←',30,BLUE)+arrow(400,145,1040,145,TEAL)+tx(720,105,'electric signal propagates much faster',31,TEAL)
 elif mode==1:z+=arrow(420,145,1040,145,TEAL)+tx(720,105,'conventional current →',33,TEAL)+arrow(1040,525,420,525,BLUE)+tx(720,580,'electron drift ←  (metal wire)',31,BLUE)
 else:z+=ln(720,210,720,470,ORANGE,5,'8 6')+tx(720,145,'count charge crossing this section',33,ORANGE)+tx(720,550,'I = ΔQ / Δt',46,TEAL)
 return z

def resistance(kind):
 z=tx(720,100,'R = ρL / A',44,TEAL)
 if kind=='length':
  z+=wire(270,215,420,90,'length L')+wire(270,420,840,90,'length 2L')+tx(1160,275,'R',39,BLUE)+tx(1200,480,'2R',39,ORANGE)
 elif kind=='thickness':
  z+=wire(220,220,550,55,'area A')+wire(220,405,550,110,'area 2A')+tx(1070,265,'R',40,BLUE)+tx(1070,480,'R / 2',40,TEAL)
 elif kind=='material':
  z+=wire(250,200,640,100,'copper • lower resistivity')+wire(250,405,640,100,'iron • higher resistivity')+tx(1100,265,'lower R',32,TEAL)+tx(1100,470,'higher R',32,ORANGE)
 else:
  z+=wire(220,200,940,110,'cooler metal')+wire(220,420,940,110,'hotter metal')
  for x in range(290,1120,100):z+=dot(x,255,13,BLUE)+dot(x,475,13,ORANGE)+ring(x,475,27,ORANGE,2)
  z+=tx(720,365,'greater lattice vibration → usually higher R',31,ORANGE)
 return z

def resistor(x,y,w=150,label='R'):
 return ln(x,y,x+20,y,NAVY,5)+rc(x+20,y-23,w-40,46,'white',1,NAVY)+ln(x+w-20,y,x+w,y,NAVY,5)+tx(x+w/2,y-45,label,29)
def battery(x,y):return ln(x,y-85,x,y-30,NAVY,5)+ln(x-38,y-30,x+38,y-30,RED,6)+ln(x-21,y+10,x+21,y+10,BLUE,6)+ln(x,y+10,x,y+85,NAVY,5)+tx(x-65,y-17,'+',31,RED)+tx(x-65,y+30,'−',31,BLUE)
def meter(x,y,label):return dot(x,y,42,'white',TEAL)+tx(x,y+13,label,38,TEAL)
def circuit(mode='closed'):
 z=path('M290,215 L290,155 L1150,155 L1150,515 L290,515 L290,385',NAVY,5)+battery(290,300)+resistor(860,155,170,'load')
 # Cover wire behind components.
 z=path('M290,215 L290,155 L860,155 M1030,155 L1150,155 L1150,515 L290,515 L290,385',NAVY,5)+battery(290,300)+resistor(860,155,170,'load')
 if mode in('open','broken-series'):
  z+=rc(520,135,140,45,'white',0)+dot(540,155,7,NAVY)+dot(640,155,7,NAVY)+ln(540,155,625,95,ORANGE,6)+tx(600,235,'gap',30,ORANGE)+tx(720,420,'I = 0',42,GRAY)
 elif mode in('short','ammeter-parallel'):
  z+=path('M815,155 L815,315 L1075,315 L1075,155',RED,7)
  if mode=='ammeter-parallel':z+=meter(945,315,'A')
  z+=tx(720,440,'very low resistance bypass',31,RED)+tx(720,575,'incorrect connection • diagram only',28,RED)
 elif mode in('ammeter','voltmeter-series'):
  z+=rc(485,108,135,95,'white',0)+ln(485,155,510,155,NAVY,5)+ln(590,155,620,155,NAVY,5)+meter(550,155,'A'if mode=='ammeter'else'V')
  z+=tx(720,390,'same current through meter and load'if mode=='ammeter'else'very high meter resistance → tiny current',31,TEAL if mode=='ammeter'else RED)
 elif mode=='voltmeter':
  z+=path('M815,155 L815,335 L1075,335 L1075,155',TEAL,5)+meter(945,335,'V')+tx(650,460,'meter compares two points',31,TEAL)
 elif mode=='series':z+=rc(470,110,215,90,'white',0)+resistor(470,155,215,'R₁')+tx(720,360,'one path • same current',34,TEAL)+tx(720,435,'R eq = R₁ + R₂',37)
 else:z+=arrow(500,155,680,155,TEAL)+arrow(1150,300,1150,420,TEAL)+tx(720,365,'complete loop',38,TEAL)
 return z

def parallel(broken=False):
 z=battery(280,315)+path('M280,230 L280,150 L1100,150 M1100,525 L280,525 L280,400',NAVY,5)
 z+=path('M500,150 L500,220 M500,380 L500,525 M960,150 L960,220 M960,380 L960,525',NAVY,5)
 for x in [500,960]:z+=rc(x-25,220,50,160,'white',1,NAVY)+tx(x+85,315,'R₁'if x==500 else'R₂',31)
 if broken:z+=rc(467,407,70,55,'white',0)+ln(500,407,550,448,ORANGE,5)+tx(660,453,'break',27,ORANGE)+arrow(960,400,960,480,TEAL)
 else:z+=arrow(500,400,500,480,TEAL)+arrow(960,400,960,480,TEAL)+tx(730,80,'same voltage across both branches',33,TEAL)
 return z+tx(720,580,'other branch still works'if broken else'adding a branch lowers equivalent resistance',31)

def magnet(x,y,w=200,h=85,nleft=True):
 return rc(x,y,w/2,h,RED if nleft else BLUE,4)+rc(x+w/2,y,w/2,h,BLUE if nleft else RED,4)+tx(x+w/4,y+h*.64,'N'if nleft else'S',35,'white')+tx(x+3*w/4,y+h*.64,'S'if nleft else'N',35,'white')
def coil(x,y,w=360,h=165,turns=8,core=True):
 z=rc(x-30,y+h*.25,w+60,h*.5,'#bacbd3'if core else BG,20)
 for k in range(turns):
  X=x+k*w/max(turns-1,1);z+=f'<ellipse cx="{X}" cy="{y+h/2}" rx="24" ry="{h/2}" fill="none" stroke="{ORANGE}" stroke-width="6"/>'
 return z

def around_wire(reverse=False):
 z=''
 for x,into in [(410,False),(1030,True)] if reverse else [(720,False)]:
  for r in [70,135,205]:
   z+=ring(x,325,r,TEAL,4)
   if into:z+=arrow(x+r-7,285,x+r,325,TEAL,4)
   else:z+=arrow(x+r-7,365,x+r,325,TEAL,4)
  z+=dot(x,325,25,ORANGE)
  if into:z+=ln(x-10,315,x+10,335,'white',4)+ln(x-10,335,x+10,315,'white',4)
  else:z+=dot(x,325,8,'white')
  z+=tx(x,585,'I into page: clockwise'if into else'I out of page: counterclockwise',28)
 return z

def electromagnet(mode):
 z=''
 if mode in('current','turns','core'):
  for k,x in enumerate([350,1020]):
   turns=5 if mode=='turns' and k==0 else 9
   z+=coil(x-180,240,360,160,turns,not(mode=='core' and k==0))
   label=(['0.50 A','1.00 A']if mode=='current'else['fewer turns','more turns']if mode=='turns'else['air core','iron core'])[k]
   z+=tx(x,170,label,35,TEAL)
   for r in range(2+k if mode!='core' else 2+k):z+=path(f'M{x-245-r*22},330 Q{x}, {90-r*12} {x+245+r*22},330',TEAL,3)
  z+=tx(720,540,'same coil + core'if mode=='current'else'same current and similar geometry',32)
 else:
  z+=coil(250,260,500,160,10)+dot(860,340,22,BLUE)+dot(1180,340,22,BLUE)+bracket(760,870,460,'near')+bracket(760,1180,530,'far')+tx(925,160,'field generally weakens with distance',31)
 return z

def clips(x,y,n=3):
 z=''
 for k in range(n):z+=rc(x+k*27,y+k*30,30,63,'none',13,GRAY)
 return z

def labpair(labels=('0.50 A','1.00 A')):
 z=''
 for i,x in enumerate([390,1040]):z+=coil(x-155,200,310,130,7)+clips(x-55,375,3+i)+tx(x,135,labels[i],34,TEAL)
 return z

def table():
 z=tx(720,85,'fictional practice measurements',30,TEAL)
 cols=[270,510,695,880,1110];ys=[175,300,425]
 for j in range(3):
  z+=rc(130,ys[j]-45,1180,92,BG if j%2 else'#dbe9f0',10)
  for k,v in enumerate([['Current (A)','Trial 1','Trial 2','Trial 3','Mean'],['0.50','9','10','11','10'],['1.00','18','20','19','19']][j]):z+=tx(cols[k],ys[j]+12,v,32)
 z+=tx(720,565,'raw observations stay separate from the mean',30)
 return z

def graph(kind='scatter'):
 z=axis(290,510,1220,140,'current (A)','clips lifted')
 for y,n in [(510,0),(360,10),(210,20)]:z+=ln(280,y,1200,y,GRAY,1,'5 7')+tx(240,y+10,n,25,GRAY)
 for x,v in [(290,'0'),(645,'0.50'),(1000,'1.00')]:z+=tx(x,550,v,29)
 for x,vals in [(645,[9,10,11]),(1000,[18,20,19])]:
  for j,v in enumerate(vals):z+=dot(x,510-v*15,10,BLUE)
  mean=sum(vals)/3;z+=ln(x-55,510-mean*15,x+55,510-mean*15,ORANGE,7)
 z+=tx(740,88,'fictional results • blue trials, gold means',30)
 if kind=='limits':z+=rc(745,265,170,125,'white',15,GRAY)+tx(830,315,'untested',29,GRAY)+tx(830,360,'settings?',29,GRAY)
 return z

def lab(mode):
 if mode in('question','variables','fair','prediction'):
  z=labpair()+tx(720,85,{'question':'What changes when current increases?','variables':'change current • measure clips • hold setup fixed','fair':'one planned change • otherwise matched conditions','prediction':'predict first, then compare with evidence'}[mode],32)
  z+=tx(720,570,{'question':'measurable result: number of clips lifted','variables':'same turns, core, wire, pickup method','fair':'same contact, lift height, and timing','prediction':'greater current → stronger field → more clips predicted'}[mode],30,TEAL)
 elif mode=='measure':z=coil(310,170,460,160,9)+clips(500,385,4)+rc(960,210,290,250,BG,20)+tx(1105,285,'clips lifted',33)+tx(1105,345,'performance',30,TEAL)+tx(1105,400,'≠ field in tesla',29,ORANGE)
 elif mode=='repeat':
  z=panel(145,140,530,390,'physical repeats')+panel(765,140,530,390,'deterministic simulation')
  for x,y,v in [(280,305,'9'),(410,340,'10'),(540,290,'11'),(900,325,'same'),(1120,325,'same')]:z+=dot(x,y,45,'white',TEAL)+tx(x,y+12,v,30)
  z+=tx(410,475,'variation → mean',30,TEAL)+tx(1030,475,'same input → same output',27,TEAL)
 elif mode in('uncertainty','limits'):
  z=coil(240,190,430,140,8)+clips(440,385,3)+ln(730,230,730,520,GRAY,4,'8 8')+both(770,345,770,485,ORANGE)+tx(1030,290,'physical test:',30)+tx(1030,340,'control pickup height',29,TEAL)+tx(1010,455,'simulation:',30)+tx(1010,505,'test more designs',29,TEAL)
 elif mode=='record':
  z=rc(180,140,1080,370,BG,20)+tx(720,210,'one row per trial or design',34,TEAL)
  for k,(a,b) in enumerate([('Inputs','turns • core • wire • cells'),('Outputs','current • clips • cost'),('Comparison','clips per cost • change made')]):z+=tx(270,295+k*80,a,28,NAVY,'start')+tx(720,295+k*80,b,30)
 elif mode=='table':z=table()
 elif mode in('graph','trend','compare','performance'):z=graph('limits'if mode=='trend'else'scatter')
 elif mode=='cost':z=panel(150,140,510,380,'more turns')+panel(780,140,510,380,'compare the result')+coil(240,255,300,150,10)+tx(405,475,'more wire + resistance + cost',27)+tx(1035,290,'clips lifted',36,BLUE)+ln(895,320,1175,320,NAVY,3)+tx(1035,370,'displayed cost',36,ORANGE)+tx(1035,455,'value ratio',29,TEAL)
 elif mode=='core':z=electromagnet('core')+tx(720,585,'compare the recorded clip counts',29,TEAL)
 else:z=graph()
 return z


def induction_factor(mode):
 z=tx(720,85,'induced emf depends on the rate of flux change',32,TEAL)
 if mode=='orientation':
  for k,x in enumerate([400,1040]):
   z+=panel(x-280,140,560,420,'normal ∥ B'if k==0 else'normal ⟂ B')
   for y in [275,330,385]:z+=arrow(x-220,y,x+220,y,TEAL,3)
   z+=ln(x,245,x,415,ORANGE,12)if k==0 else ln(x-100,330,x+100,330,ORANGE,12)
   z+=arrow(x,330,x+135,330,PURPLE,5)if k==0 else arrow(x,330,x,230,PURPLE,5)
   z+=tx(x,465,'flux maximum'if k==0 else'flux zero',31)+tx(x,515,'rotating coil: emf zero'if k==0 else'rotating coil: |emf| maximum',25,BLUE)
  return z
 for k,x in enumerate([390,1040]):
  z+=coil(x-120,250,240 if mode!='area'or k==0 else 310,130 if mode!='area'or k==0 else 210,5 if mode=='turns'and k==0 else 9,False)
  for yy in [260,305,350] if mode!='field'or k==0 else[235,270,305,340,375]:z+=arrow(x-245,yy,x+240,yy,TEAL,3)
  labels={'field':['weaker changing B','stronger changing B'],'area':['smaller area','larger area'],'turns':['N turns','2N turns'],'speed':['slow change','fast change']}
  z+=tx(x,165,labels[mode][k],31)
  z+=rc(x-100,470,130+100*k,30,BLUE,5)+tx(x,550,'smaller |emf|'if k==0 else'larger |emf|',29,BLUE)
 return z

def lenz(mode):
 if mode=='energy':return flow('mechanical work','electrical energy','thermal + other transfers',device='loaded generator')
 leaving=mode=='leaving';reverse=mode=='reverse'
 z=magnet(290,290,240,100,nleft=reverse)+coil(835,230,310,220,7,False)
 z+=arrow(380,190,230 if leaving else 610,190,ORANGE)+tx(410,140,'magnet motion',29,ORANGE)
 z+=arrow(430,490,620 if leaving else 240,490,BLUE)+tx(430,545,'magnetic force on magnet',28,BLUE)
 z+=tx(990,160,'closed conducting coil',30)+tag(790,335,'S face'if leaving or reverse else'N face',BLUE if leaving or reverse else RED)
 z+=tx(1020,555,'opposes the change in flux',29,TEAL)
 return z

def motor(mode):
 if mode=='commutator':
  z=panel(135,125,555,435,'before half-turn')+panel(755,125,555,435,'after half-turn')
  for i,x in enumerate([410,1030]):
   z+=path(f'M{x-90},405 L{x-90},245 L{x+90},245 L{x+90},405',BLUE,4)+arrow(x-90,375 if i==0 else 265,x-90,265 if i==0 else 375,ORANGE)+arrow(x+90,265 if i==0 else 375,x+90,375 if i==0 else 265,ORANGE)+path(f'M{x-10},431 A36,36 0 0 0 {x-10},499',TEAL,9)+path(f'M{x+10},431 A36,36 0 0 1 {x+10},499',TEAL,9)+ln(x-90,405,x-28,437,BLUE,4)+ln(x+90,405,x+28,437,BLUE,4)+ln(x-50,465,x-40,465,NAVY,13)+ln(x+40,465,x+50,465,NAVY,13)+tx(x,530,'coil connection reverses',27)
  return z
 if mode=='orientation':
  z=tx(720,95,'θ is measured between the coil normal and B',30)+induction_factor('orientation')
  # Replace induction-specific labels with torque labels.
  return z.replace('induced emf depends on the rate of flux change','torque τ = NIAB sin θ').replace('flux maximum','θ = 0°').replace('flux zero','θ = 90°').replace('rotating coil: emf zero','torque zero').replace('rotating coil: |emf| maximum','torque maximum').replace(tx(720,95,'θ is measured between the coil normal and B',30),'')
 z=tx(720,85,'coil torque: τ = NIAB sin θ',36,TEAL)
 for i,x in enumerate([390,1040]):
  z+=magnet(x-225,255,100,180)+magnet(x+125,255,100,180)+rc(x-75,235,150,210,'none',10,ORANGE)
  z+=arrow(x-65,340,x-65,280-(40*i),BLUE)+arrow(x+65,340,x+65,400+(40*i),BLUE)
  label={'turns':['N turns','2N turns'],'current':['current I','current 2I'],'field':['field B','field 2B']}[mode][i]
  z+=tx(x,170,label,32)+tx(x,525,'torque τ'if i==0 else'torque 2τ',32,BLUE)
 return z

def generator_factor(mode):
 if mode=='acdc':
  z=panel(140,130,535,425,'slip rings: alternating output')+panel(765,130,535,425,'commutator: unidirectional output')
  z+=ln(185,360,635,360,GRAY,2)+wave(185,360,450,90,2,BLUE)
  pts=[(815+i*430/160,415-130*abs(math.sin(i/160*4*math.pi)))for i in range(161)]
  z+=ln(805,415,1250,415,GRAY,2)+path(' '.join(('M'if i==0 else'L')+f'{x},{y}'for i,(x,y)in enumerate(pts)),ORANGE,5)+tx(410,500,'changes sign',30,BLUE)+tx(1035,500,'pulsating DC',30,ORANGE)
  return z
 z=tx(720,85,'rotating coil: peak emf = N B A ω',35,TEAL)
 for i,x in enumerate([390,1040]):
  z+=coil(x-125,200,250,130 if mode=='area'and i==0 else 260 if mode=='area'else 180,5 if mode=='turns'and i==0 else 10,False)+path(f'M{x-95},455 Q{x},560 {x+95},455',ORANGE,5)+arrow(x+65,480,x+95,455,ORANGE,5)+tx(x,550,'rotation',26,ORANGE)
  labels={'speed':['ω','2ω'],'field':['B','2B'],'turns':['N','2N'],'area':['A','2A']}
  z+=tx(x,165,labels[mode][i],38)+tx(x,590,'peak emf ε₀'if i==0 else'peak emf 2ε₀',28,BLUE)
 return z

def flow(a,b,c='',device='device'):
 z=rc(150,250,330,180,BG,22)+rc(585,220,280,240,'#dbe9f1',25,TEAL)+rc(975,250,320,180,BG,22)+arrow(490,335,565,335,ORANGE)+arrow(875,335,955,335,TEAL)
 for x,t in [(315,a),(725,device),(1135,b)]:
  for k,line in enumerate(textwrap.wrap(t,18)):z+=tx(x,315+k*43,line,31)
 if c:z+=arrow(725,470,725,535,RED)+tx(725,585,c,29,RED)
 return z

def losses(mode):
 if mode in('resistance','heat'):
  z=resistor(380,295,630,'coil resistance R')+arrow(160,295,340,295,TEAL)+tx(240,240,'I',34,TEAL)
  for x in [480,680,880]:z+=wave(x,380,50,15,2,RED)+arrow(x+25,435,x+25,510,RED,4)
  z+=tx(720,150,'P thermal = I²R',40,RED)+tx(720,565,'electrical energy → thermal energy',31)
 elif mode=='friction':
  z=ring(720,330,140,GRAY,35)+ring(720,330,85,BLUE,15)+ln(400,330,1040,330,NAVY,30)+arrow(900,170,1020,170,ORANGE)+tx(1070,290,'rotation',31)+tx(720,550,'bearing contact → thermal energy',32,RED)
 elif mode=='sound':
  z=rc(250,245,320,200,BG,25,NAVY)+tx(410,355,'motor',38)+wave(680,340,540,45,4,BLUE)+tx(975,480,'vibrations → sound',32,BLUE)
 else:
  z=panel(150,150,505,380,'solid conducting core')+panel(785,150,505,380,'insulated laminations')
  z+=rc(260,250,280,190,'#c6d6e2',5)+ring(400,345,65,RED,7)+arrow(458,320,463,345,RED,4)
  for x in [850,915,980,1045,1110,1175]:z+=rc(x,250,45,190,'#c6d6e2',2)+f'<ellipse cx="{x+22}" cy="345" rx="12" ry="55" fill="none" stroke="{RED}" stroke-width="3"/>'
  z+=tx(400,485,'large induced loops',28,RED)+tx(1040,485,'smaller loops, lower loss',28,TEAL)
 return z

def design(mode):
 if mode=='turns':return flow('more coil turns','compare field and current','extra wire adds resistance and cost',device='fixed supply')
 if mode=='core':return electromagnet('core')
 if mode=='voltage':return flow('higher voltage','higher current if R fixed','greater I²R heating',device='I = V / R')
 if mode=='wire':return resistance('thickness')+tx(720,590,'compare at the same current when judging I²R heating',27,RED)
 if mode=='size':return panel(130,160,560,370,'compact design')+panel(755,160,560,370,'larger design')+coil(240,270,330,130,7)+coil(880,230,320,210,9)+tx(410,485,'mass • space • heat limits',28)+tx(1035,485,'capacity • mass • material cost',26)
 return panel(150,140,510,390,'performance')+panel(780,140,510,390,'budget')+coil(250,255,300,145,8)+tx(405,480,'clips lifted',32,TEAL)+tx(1035,310,'materials + wire + power',29)+tx(1035,390,'cost limit',38,ORANGE)+tx(720,585,'compare useful performance per cost unit',30,TEAL)

def device(mode):
 if mode=='crane':
  z=path('M300,540 L300,120 L1080,120 L1080,235',NAVY,12)+coil(865,255,380,140,9)+rc(990,455,130,80,'#bacbd3',10,GRAY)+arrow(1055,440,1055,405,TEAL)+tx(720,220,'current on → iron core magnetized',31)+tx(690,580,'lifting performance balanced against heating and cost',29)
 elif mode=='generator':z=flow('shaft rotation','electrical output','some energy becomes thermal energy',device='changing flux')
 elif mode=='brake':
  z=rc(300,205,850,260,'#cfdee8',25,GRAY)+magnet(700,115,220,110)+ring(780,335,70,RED,6)+ring(1010,335,60,RED,6)+arrow(350,535,670,535,ORANGE)+tx(505,585,'plate motion',29,ORANGE)+arrow(1140,535,820,535,BLUE)+tx(980,585,'opposing force',29,BLUE)+tx(720,80,'eddy currents in the moving metal plate',32)
 else:
  z=wave(150,320,290,50,3,BLUE)+ln(510,175,510,475,ORANGE,12)+coil(550,260,250,130,6,False)+magnet(940,160,180,330)+arrow(560,540,1170,540,TEAL)+tx(860,590,'changing flux linkage → signal voltage',29,TEAL)+tx(440,120,'sound moves diaphragm + coil',30)+both(475,495,575,495,ORANGE)
 return z

def render(b,j):
 if b==0:
  if j<2:return field([(720,330,1 if j==0 else -1)]),['E points away from a positive source charge.','E points toward a negative source charge.'][j]
  z=''.join(arrow(220,y,1210,y,TEAL,4)for y in [190,270,350,430,510])+dot(720,350,17,ORANGE)+tx(720,110,'one net field direction at each point',36)+arrow(750,350,900,350,ORANGE,7)
  return z,'Field lines do not cross: the net electric field is a single vector at each point.'
 if b==1:
  Q=[[(720,330,1)],[(480,330,1),(960,330,1)],[(480,330,1),(960,330,-1)],[(390,220,1),(700,455,1),(1070,270,-1)]][j]
  return field(Q),['A single charge creates a radial electric field.','For equal positive charges, the midpoint has zero net electric field.','Dipole field lines run from the positive charge to the negative charge.','The net field combines the vector contributions of all source charges.'][j]
 if b==2:
  if j<2:return force_charge(j==1),['A positive charge released from rest accelerates along E; its electric potential energy falls.','A negative charge released from rest accelerates opposite E; its electric potential energy also falls.'][j]
  return plates()+tx(720,565,'U = qV : the sign of q matters',37,ORANGE),'Potential decreases along E. Potential energy depends on both potential and charge.'
 if b==3:return capacitor(['plates','spacing','maps','energy'][j]),['Between large parallel plates, the field is nearly uniform away from edges.','Fixed Q and plate area: E stays approximately constant while V = Ed increases with separation.','An equipotential is perpendicular to E; moving along it changes no electric potential energy.','A charged capacitor stores electric potential energy in its electric field.'][j]
 if b==4:return conductor(['sphere','insulator','point'][j]),['At electrostatic equilibrium, excess charge is on the surface; only special shapes are uniform.','In an insulator, added charge does not freely spread across the object.','Sharp curvature can concentrate surface charge and strengthen the local field.'][j]
 if b==5:return polarization(['conductor','insulator','neutral','transfer'][j]),['Mobile electrons redistribute within a neutral conductor.','Bound charges shift within molecules; electrons do not flow freely across the insulator.','Opposite charge is nearer the rod, so attraction can exceed the more distant repulsion.','Polarization redistributes charge inside an object without transferring net charge across the gap.'][j]
 if b==6:return (conductor('point')if j==0 else spark(j==2)),['Sharper conducting surfaces can have stronger local electric fields.','A sufficiently strong electric field can ionize air and allow a discharge.','A bonded conductor routes lightning current toward ground; it does not stop every strike.'][j]
 if b==7:return drift(j),['Slow electron drift differs from the much faster propagation of an electric signal.','In metal wires, electron drift is opposite conventional current.','Current is the rate at which net charge crosses a section of the conductor.'][j]
 if b==8:return resistance(['length','thickness','material','temperature'][j]),['Same material and area: doubling wire length doubles resistance.','Same material and length: doubling cross-sectional area halves resistance.','Compare wires of equal length, area, and temperature to isolate material resistivity.','For ordinary metals, resistance usually rises as temperature rises.'][j]
 if b==9:return circuit(['open','closed','short'][j]),['An open path stops steady current in this simple DC circuit.','A complete path allows current through the load.','A low-resistance bypass can draw excessive current. This is a fault diagram, not a build instruction.'][j]
 if b==10:return circuit(['ammeter','voltmeter'][j]),['The ammeter carries the same branch current as the load.','The voltmeter connects to the two ends of the load to compare their potentials.'][j]
 if b==11:
  if j<2:return circuit('series')if j==0 else parallel(),['Series resistances add; at fixed supply voltage the current decreases.','Adding a parallel branch lowers equivalent resistance and increases total current at fixed voltage.'][j]
  return panel(120,130,580,415,'series')+panel(750,130,570,415,'parallel')+resistor(185,305,200,'R₁')+ln(385,305,435,305,NAVY)+resistor(435,305,200,'R₂')+tx(410,450,'R eq = R₁ + R₂',36)+tx(1035,300,'1 / R eq',38)+tx(1035,365,'= 1 / R₁ + 1 / R₂',35)+tx(1035,455,'R eq < either branch R',27,TEAL),'Use a direct sum for series and a reciprocal sum for parallel resistors.'
 if b==12:return parallel(True)if j==1 else circuit('broken-series'if j==0 else'short'),['One break interrupts the only series path.','A break in one parallel branch leaves the other complete path available.','A short bypasses the intended load through a low-resistance path.'][j]
 if b==13:return circuit(['ammeter','ammeter-parallel','voltmeter','voltmeter-series'][j]),['Use a low-resistance ammeter in series with the measured branch.','Incorrect: a low-resistance ammeter across a load creates an unwanted bypass.','Use a high-resistance voltmeter across the two points being compared.','Incorrect: a voltmeter in series greatly reduces the current.'][j]
 if b==14:
  if j==0:return around_wire()+tx(1100,160,'compass aligns with B',29)+dot(1100,325,55,'white',GRAY)+arrow(1100,360,1100,285,RED),'A compass near a current-carrying wire responds to the wire’s magnetic field.'
  return around_wire(j==2),['','Right-hand rule: thumb follows conventional current; curled fingers show B.','Reversing the current reverses the circular magnetic-field direction.'][j]
 if b==15:return electromagnet(['current','turns','core','distance'][j]),['With the same coil and core, greater current generally strengthens the magnetic field.','More turns can strengthen the field at fixed current; a fixed battery adds a resistance tradeoff.','An iron core can strengthen the field without changing the circuit current.','Keep pickup distance and method fixed when comparing lifting performance.'][j]
 if b==16:return lab(['question','variables','fair','prediction'][j]),['Ask how a specified change affects a measurable result.','Independent: current. Dependent: clips. Controls: coil, core, wire, and pickup method.','A fair comparison changes one intended variable while keeping relevant conditions fixed.','Record a reasoned prediction before examining the result.'][j]
 if b==17:return lab(['measure','repeat','uncertainty','record'][j]),['Clips lifted measure lifting performance; they are not a direct measurement of B in tesla.','Physical repeats reveal variation. Identical inputs in a deterministic model may repeat exactly.','Control physical measurement conditions; evaluate simulation limits without inventing random failures.','Record the settings, displayed outputs, and comparison measure for each design.'][j]
 if b==18:return lab(['table','graph','trend','compare'][j]),['Keep all six fictional raw measurements and show means in a separate column.','Plot current on the horizontal axis and clip count on the vertical axis.','Two tested settings support a comparison, not a universal proportional law.','Compare means and the spread of repeated observations.'][j]
 if b==19:return lab(['performance','cost','core','limits'][j]),['The invented mean rises from 10 to 19 clips; this is not an exact doubling law.','More lifting does not automatically mean better clips per cost.','Compare core materials while holding the circuit settings fixed.','Preserve inconvenient observations and propose a specific way to improve the evidence.'][j]
 if b==20:return induction_factor(['field','area','turns','speed','orientation'][j]),['For the same changing-field pattern and geometry, a larger change rate produces a larger emf.','For the same uniform dB/dt and orientation, a larger loop area gives a larger induced emf.','Same flux change per turn: doubling the turns doubles the induced emf.','Faster change of flux produces a larger induced emf; current also depends on circuit resistance.','For steady rotation, flux is largest when emf is zero; emf is largest when flux passes through zero.'][j]
 if b==21:return lenz(['entering','leaving','reverse','energy'][j]),['An approaching north pole induces a near north face, opposing the increasing flux.','A receding north pole induces a near south face, opposing the decreasing flux.','An approaching south pole induces a near south face; the induced current reverses.','Mechanical work supplies the electrical energy and losses in a loaded generator.'][j]
 if b==22:return motor(['turns','current','field','orientation','commutator'][j]),['At fixed current, field, area, and angle, more turns give greater torque.','At fixed field, geometry, and angle, greater current gives greater torque.','A stronger field increases torque with other factors held fixed; efficiency does not follow automatically.','Motor torque depends on the angle between the coil normal and magnetic field.','A split-ring commutator reverses the coil connection every half-turn in a simple DC motor.'][j]
 if b==23:return generator_factor(['speed','field','turns','area','acdc'][j]),['For a uniform field and fixed coil, doubling rotation speed doubles peak emf.','At fixed rotation speed and geometry, doubling B doubles peak emf.','More turns increase emf; the resulting current also depends on total resistance and load.','At fixed rotation rate, turns, and field, a larger coil area increases peak emf.','Slip rings give alternating output; a split-ring commutator can give pulsating DC.'][j]
 if b==24:return flow('electrical input','mechanical output','thermal + sound transfers','motor')if j==0 else flow('mechanical input','electrical output','thermal + sound transfers','generator'),['A motor transfers electrical energy into useful mechanical energy and other forms.','A generator transfers mechanical energy into electrical energy and other forms.'][j]
 if b==25:return losses(['resistance','friction','heat','sound','eddy'][j]),['Current through resistance transfers electrical energy into thermal energy at a rate I²R.','Friction in moving contacts transfers mechanical energy into thermal energy.','Heating changes where energy goes; it does not destroy energy.','Vibrating parts transfer some energy to sound in the surroundings.','Insulated laminations interrupt large eddy-current loops and can reduce unwanted heating.'][j]
 if b==26:return design(['turns','core','voltage','wire','size','cost'][j]),['Extra turns add field contribution, wire resistance, and cost; compare actual performance.','Core material affects field strength, losses, and cost.','Voltage is energy per charge; at fixed resistance, greater voltage gives greater current.','At the same current, lower wire resistance reduces I²R heating.','Design size trades off capacity, material use, mass, and available space.','Choose a design by comparing performance against a stated budget and constraints.'][j]
 if b==27:return device(['crane','generator','brake','microphone'][j]),['A powered coil magnetizes the core to lift suitable magnetic materials.','Rotation changes flux linkage and produces electrical output.','Eddy currents oppose relative motion and transfer kinetic energy into thermal energy.','Sound moves the diaphragm and coil; changing flux linkage produces a small signal voltage.'][j]
 raise ValueError((b,j))

(R/'images').mkdir(exist_ok=True)
for bi,b in enumerate(D):
 for j,it in enumerate(b['items']):
  content,cap=render(bi,j);slug=re.sub('[^a-z0-9]+','-',it['title'].lower()).strip('-')
  stem=f'{bi:02d}-{j:02d}-{slug}';it.update(diagramIndex=f'{bi:02d}-{j:02d}',svg=str(R/'images'/f'{stem}.svg'),image=str(R/'images'/f'{stem}.png'),alt=it['title']+'. '+cap)
  svg='<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="700" viewBox="0 0 1440 700">'+rc(0,0,1440,700,BG,24)+rc(28,28,1384,644,'white',24)+content+caption(cap)+'</svg>'
  Path(it['svg']).write_text(svg,encoding='utf8')
(R/'diagram-manifest.json').write_text(json.dumps(D,ensure_ascii=False,indent=2),encoding='utf8')
items=''.join('<article><h2>'+html.escape(it['diagramIndex']+' · '+it['title'])+'</h2><img src="images/'+Path(it['image']).name+'" alt="'+html.escape(it['alt'],quote=True)+'"><p>'+html.escape(it['alt'])+'</p></article>'for b in D for it in b['items'])
(R/'index.html').write_text('<!doctype html><meta charset="utf-8"><title>Unit 6 physics diagrams</title><style>body{font:18px Arial;background:#eef4f8;color:#18354e;margin:40px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(450px,1fr));gap:24px}article{background:white;padding:20px;border-radius:18px}img{width:100%}h2{font-size:21px}p{line-height:1.5}</style><h1>Unit 6 · Tab and accordion diagrams</h1><p>105 diagrams, matched to 28 native Rise blocks.</p><main>'+items+'</main>',encoding='utf8')
print('Generated',sum(len(b['items'])for b in D),'SVG diagrams')
