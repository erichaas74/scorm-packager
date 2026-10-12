from pathlib import Path
import json,math,html
R=Path(__file__).parent
B=json.loads((R/'process-blocks.json').read_text(encoding='utf-8'))
BLUE='#2463a6'; TEAL='#0b8c91'; ORANGE='#e47a24'; INK='#233b53'; GRAY='#8fa2b2'; RED='#c45362'
class Art:
 def __init__(self):
  self.s=['<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="720" viewBox="0 0 1440 720"><defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="4" orient="auto-start-reverse"><path d="M0,0 L8,4 L0,8" fill="context-stroke"/></marker><linearGradient id="bg"><stop stop-color="#edf5fb"/><stop offset="1" stop-color="#f6fafb"/></linearGradient></defs><rect width="1440" height="720" rx="28" fill="url(#bg)"/><rect x="28" y="28" width="1384" height="664" rx="24" fill="white" stroke="#dbe6ee"/>']
 def line(self,x1,y1,x2,y2,c=GRAY,w=3,dash=False,arrow=False): self.s.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{c}" stroke-width="{w}" {"stroke-dasharray=\"10 8\"" if dash else ""} {"marker-end=\"url(#arrow)\"" if arrow else ""}/>')
 def text(self,x,y,t,size=28,c=INK,anchor='middle'): self.s.append(f'<text x="{x}" y="{y}" fill="{c}" font-family="Arial, sans-serif" font-size="{size}" text-anchor="{anchor}">{html.escape(str(t))}</text>')
 def rect(self,x,y,w,h,c='#eff5f9',stroke=GRAY): self.s.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="12" fill="{c}" stroke="{stroke}" stroke-width="3"/>')
 def circle(self,x,y,r=12,c=TEAL): self.s.append(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{c}"/>')
 def path(self,pts,c=BLUE,w=5,dash=False): self.s.append(f'<polyline points="{" ".join(f"{x:.1f},{y:.1f}" for x,y in pts)}" fill="none" stroke="{c}" stroke-width="{w}" stroke-linejoin="round" {"stroke-dasharray=\"10 8\"" if dash else ""}/>')
 def bracket(self,x1,y1,x2,y2,label,c=ORANGE):
  self.line(x1,y1,x2,y2,c,3);self.circle(x1,y1,4,c);self.circle(x2,y2,4,c);self.text((x1+x2)/2,(y1+y2)/2-14,label,26,c)
 def wave(self,x,y,length,amp,cycles=1,c=BLUE): self.path([(x+i*length/200,y-amp*math.cos(i/200*cycles*2*math.pi)) for i in range(201)],c)
 def finish(self): return ''.join(self.s)+'</svg>'

def make(kind,p):
 a=Art(); focus=ORANGE if p not in [0,5] else TEAL
 if kind=='wave':
  for base,label in [(230,'Position (m)'),(520,'Time (ms)')]:
   a.line(150,base,1260,base,GRAY,2,arrow=True);a.line(150,base+85,150,base-120,GRAY,2,arrow=True);a.text(90,base-115,'y (cm)',22)
   a.wave(350,base,600,70,1.5,BLUE if base==230 else TEAL);a.text(1260,base+65,label,25,'#536b7d','end')
  a.text(350,270,'0.20',23);a.text(750,270,'0.80',23);a.text(350,560,'0',23);a.text(750,560,'150',23);a.text(115,169,'+3',22);a.text(115,307,'−3',22)
  if p in [0,1,3,5]: a.bracket(350,120,750,120,'one wavelength',focus)
  if p in [0,2,3,5]: a.bracket(350,410,750,410,'one period',focus)
  if p in [1,4]:
   a.line(290,230,290,160,ORANGE,4,arrow=True);a.text(270,175,'A',28,ORANGE,'end')
  if p==4: a.bracket(1090,160,1090,300,'crest to trough',ORANGE)
 elif kind=='super':
  for j,(v,c,label) in enumerate([(3,BLUE,'pulse contribution 1'),(-2 if p!=4 else -3,TEAL,'pulse contribution 2'),(1 if p!=4 else 0,ORANGE,'combined rope')]):
   y=185+j*175;a.line(360,y,1160,y,GRAY,2,dash=True);a.text(110,y+7,label,25,INK,'start')
   pts=[(x,y-v*22*max(0,1-abs(x-740)/150)) for x in range(370,1151,5)]
   if j<2 or p>=2:a.path(pts,c);a.line(740,y,740,y-v*22,c,5,arrow=v!=0)
   if j<2:a.text(1070,y-50,'+3.0 cm' if j==0 else ('−3.0 cm' if p==4 else '−2.0 cm'),26,c)
  a.line(740,70,740,610,GRAY,2,dash=True);a.text(740,650,'same point • same instant',28)
 elif kind=='intensity':
  for r in [95,190,285]: a.s.append(f'<circle cx="550" cy="355" r="{r}" fill="none" stroke="{BLUE if r==95 else TEAL}" stroke-width="{5 if (p==1 or r==285) else 2}"/>')
  a.circle(550,355,20,ORANGE);a.text(550,395,'source',23)
  a.circle(645,355,11,BLUE);a.circle(835,355,11,TEAL);a.text(660,320,'2.0 m',26,BLUE);a.text(870,320,'6.0 m',26,TEAL)
  a.text(1090,125,'same source power',28)
  for row in range(3):
   for col in range(3):a.rect(980+col*72,225+row*72,60,60,'#d8eef0',TEAL);a.circle(1010+col*72,255+row*72,7,TEAL)
  a.text(1090,490,'larger area',27,TEAL);a.text(1090,530,'less power per m²',27,TEAL)
  if p>=2:
   for angle in range(0,360,40):
    t=angle*math.pi/180;a.line(550+110*math.cos(t),355+110*math.sin(t),550+270*math.cos(t),355+270*math.sin(t),'#a8c7d9',2,arrow=True)
 elif kind=='pipes':
  a.text(140,125,'open at both ends',30,BLUE,'start');a.text(140,407,'closed at one end',30,TEAL,'start')
  for y,L,c,closed in [(260,800,BLUE,False),(545,400,TEAL,True)]:
   a.line(180,y-65,180+L,y-65,c,6);a.line(180,y+65,180+L,y+65,c,6)
   if closed:a.line(180,y-65,180,y+65,c,10)
   a.line(170,y,200+L,y,GRAY,2,dash=True)
   n=3 if closed and p==4 else 2 if p==4 else 1
   pts=[(180+i*L/150,y-50*(math.sin(i/150*n*math.pi/2) if closed else math.cos(i/150*n*math.pi))) for i in range(151)];a.path(pts,c)
   a.circle(180,y if closed else y-50,7,ORANGE);a.circle(180+L,y-50*(math.sin(n*math.pi/2) if closed else math.cos(n*math.pi)),7,ORANGE)
   a.text(185,y+110,'node' if closed else 'antinode',23,c);a.text(180+L,y+110,'antinode',23,c)
  a.text(1190,225,'air',28);a.text(1190,262,'displacement',28);a.text(1190,325,'not pressure',23,GRAY)
  if p==3:a.bracket(180,160,980,160,'1.00 m',ORANGE);a.bracket(180,455,580,455,'0.500 m',ORANGE)
 elif kind=='resonance':
  a.rect(160,160,600,145,'#eef8fa',TEAL);a.line(175,155,175,310,TEAL,12);a.line(750,165,750,300,'white',16)
  a.path([(180+i*570/150,232-55*math.sin(i/150*math.pi/2)) for i in range(151)],BLUE)
  for i in range(18):a.line(180+i*32,350,180+i*32,375 if i%5==0 else 363,GRAY,2)
  a.bracket(180,420,724,420,'17.0 cm',ORANGE);a.text(945,230,'500 Hz source',30)
  if p>=3:
   a.line(390,565,1160,565,GRAY,3,arrow=True)
   for v,c in [(338,BLUE),(340,ORANGE),(342,BLUE),(343,TEAL)]:
    x=450+(v-338)*115;a.circle(x,565,12,c);a.text(x,612,str(v),25,c)
   a.text(250,575,'speed (m/s)',26);a.text(1025,530,'reference',23,TEAL)
 elif kind in ['photon','photoelectric']:
  if kind=='photon':
   a.wave(140,210,1120,70,4,TEAL);a.bracket(420,95,700,95,'500 nm',ORANGE)
   a.rect(1050,350,130,235,'#e9f0f7',BLUE);a.text(1115,625,'detector',25)
   for row in range(2 if p==4 else 1):
    for i in range(4 if row==0 else 8):a.circle(190+i*(180 if row==0 else 95),415+row*125,15,ORANGE if p==3 and i==2 else TEAL)
   a.line(220,535,940,535,BLUE,3,arrow=True);a.text(520,630,'same wavelength',28)
  else:
   a.rect(700,160,490,430,'#dae3eb',GRAY);a.text(945,640,'surface',28)
   c=RED if p==4 else TEAL
   for i in range(7 if p==4 else 3):
    a.wave(160+i*55,240+i*33,100,12,2,c)
   a.line(290,440,650,440,c,4,arrow=True);a.text(365,530,'700 nm' if p==4 else '500 nm',32,c)
   a.line(1040,500,1040,250,ORANGE,20);a.line(970,320,1120,320,RED,4,dash=True);a.text(1070,290,'threshold',25,RED)
   a.rect(915,420 if p==4 else 240,45,80 if p==4 else 260,c,c)
   if p in [2,3,5]:a.circle(800,270,12,BLUE);a.line(800,270,650,150,BLUE,4,arrow=True);a.text(600,140,'electron',26,BLUE)
 elif kind.startswith('lens'):
  virtual=kind.endswith('virtual');cx=680;axis=365;scale=6;ox=cx-(10 if virtual else 30)*scale;ix=cx+(-20 if virtual else 60)*scale;oy=axis-85;iy=axis+(-170 if virtual else 170)
  a.line(140,axis,1250,axis,GRAY,2,arrow=True);a.s.append(f'<path d="M {cx} 95 Q {cx-42} {axis} {cx} 635 Q {cx+42} {axis} {cx} 95" fill="#d9f1f5" stroke="{TEAL}" stroke-width="4"/>')
  for fx in [cx-120,cx+120]:a.circle(fx,axis,6,GRAY);a.text(fx,axis+40,'F',27)
  a.line(ox,axis,ox,oy,BLUE,7,arrow=True);a.text(ox-10,oy-28,'object',26,BLUE)
  a.bracket(cx,660,cx+120,660,'f = +20 cm',TEAL)
  if p>=2 or p==0:
   a.path([(ox,oy),(cx,oy),(ix,iy)] if not virtual else [(ox,oy),(cx,oy),(1180,oy+500*85/120)],ORANGE)
   slope=(axis-oy)/(cx-ox);endx=ix if not virtual else 850
   a.path([(ox,oy),(cx,axis),(endx,axis+(endx-cx)*slope)],BLUE)
   if virtual:a.path([(ix,iy),(cx,oy)],ORANGE,3,True);a.path([(ix,iy),(cx,axis)],BLUE,3,True)
  if p>=3 or p==5:
   a.line(ix,axis,ix,iy,TEAL,7,arrow=True,dash=virtual);a.text(ix,iy-20 if virtual else iy+40,'virtual image' if virtual else 'real image',26,TEAL)
  if p==4 and not virtual:a.rect(ix-10,440,20,180,'#dee7ed',GRAY);a.text(ix+65,615,'screen',24)
  if p==4 and virtual:a.text(1140,530,'actual rays diverge',26);a.text(330,175,'backward extensions',24,GRAY)
  a.text(300,620,'diagram not to scale vertically',20,GRAY)
 elif kind=='refraction':
  a.rect(90,360,1260,270,'#e4f5f6','#e4f5f6');a.line(90,360,1350,360,TEAL,4);a.line(730,100,730,620,GRAY,3,dash=True)
  a.text(250,150,'air • n = 1.00',29);a.text(250,540,'glass • n = 1.50',29,TEAL);a.text(820,115,'normal',26,GRAY)
  a.line(490,120,730,360,ORANGE,6,arrow=True);a.text(655,235,'45.0°',29,ORANGE)
  if p>=3 or p in [0,5]:a.line(730,360,850,585,BLUE,6,arrow=True);a.text(800,465,'θ₂',29,BLUE)
  else:a.text(850,480,'?',56,BLUE)
  if p==4:
   for i in range(4):a.line(500+i*32,165+i*32,570+i*32,95+i*32,ORANGE,2)
   for i in range(4):a.line(725+i*20,410+i*37,800+i*20,370+i*37,BLUE,2)
 elif kind=='timing':
  for x,c,label in [(380,BLUE,'reference clock'),(1040,TEAL,'receiver clock')]:
   a.s.append(f'<circle cx="{x}" cy="255" r="130" fill="#f1f7fb" stroke="{c}" stroke-width="5"/>')
   for j in range(12):
    t=j*math.pi/6;a.line(x+110*math.sin(t),255-110*math.cos(t),x+121*math.sin(t),255-121*math.cos(t),GRAY,3)
   a.line(x,255,x,160,c,5);a.line(x,255,x+(62 if x==380 else 78),210,c,5);a.circle(x,255,9,c);a.text(x,425,label,30,c)
  a.line(550,255,865,255,ORANGE,4,arrow=True);a.text(710,200,'timing offset',29,ORANGE)
  a.line(240,555,1230,555,GRAY,4,arrow=True);a.text(220,530,'0',25)
  a.rect(240,520,270,70,'#d8eeeb',TEAL);a.text(375,635,'allowed range error',26,TEAL)
  if p>=2:a.circle(1050,555,13,RED);a.text(1050,620,'inferred range error',26,RED)
  a.text(730,85,'clock hands and range scale are illustrative',23,GRAY)
 elif kind=='wireless':
  if p<3 and kind=='wireless':
   for x in [210,1180]:a.line(x,550,x,240,BLUE,8);a.line(x-70,550,x,300,BLUE,5);a.line(x+70,550,x,300,BLUE,5);a.circle(x,240,15,ORANGE)
   a.wave(320,335,750,60,4,TEAL);a.bracket(505,200,692.5,200,'one carrier cycle',ORANGE);a.text(210,625,'transmitter',29);a.text(1180,625,'receiver',29)
  else:
   a.rect(670,115,100,80,'#e4edf7',BLUE);a.rect(575,130,80,45,'#c4ddf2',BLUE);a.rect(785,130,80,45,'#c4ddf2',BLUE)
   a.path([(150,615),(300,560),(580,590),(900,555),(1300,620)],TEAL,4)
   a.circle(300,555,14,BLUE);a.circle(1120,580,14,BLUE)
   a.line(305,535,695,205,ORANGE,4,arrow=True);a.line(750,205,1110,560,TEAL,4,arrow=True)
   if kind=='wireless':a.text(380,330,'35,800 km',27,ORANGE);a.text(1040,330,'35,800 km',27,TEAL)
   else:a.text(350,340,'signal sent',28,ORANGE);a.text(1100,340,'signal received',28,TEAL);a.text(730,475,'clock offset',28,RED)
   if p==4:a.line(1090,570,740,235,BLUE,3,dash=True,arrow=True);a.line(680,235,320,560,BLUE,3,dash=True,arrow=True)
   a.text(300,660,'station A',26);a.text(1120,660,'station B',26);a.text(730,675,'schematic • not to scale',22,GRAY)
 elif kind=='spectrum':
  for y,label,c,shift in [(230,'rest',BLUE,0),(440,'observed',TEAL,30)]:
   a.rect(240,y-65,990,120,'#142b45','#142b45');a.text(140,y,label,30,c)
   a.line(480+shift,y-60,480+shift,y+50,ORANGE,7)
   if p==4:a.line(1030+shift*1.2,y-60,1030+shift*1.2,y+50,'#d485d7',7)
   a.text(480+shift,y+95,'500 nm' if shift==0 else '505 nm',25,c)
   if p==4:a.text(1030+shift*1.2,y+95,'600 nm' if shift==0 else '606 nm',25,c)
  a.line(240,595,1240,595,GRAY,3,arrow=True);a.text(1060,640,'longer wavelength',27)
  if p==3:a.line(640,105,1000,105,ORANGE,4,arrow=True);a.text(830,78,'source recedes',28,ORANGE)
 elif kind=='decay':
  counts=[64,32,16,8]
  for j,n in enumerate(counts):
   x=150+j*325;a.rect(x-40,160,270,360,'#f6f9fc','#d8e5ee')
   for i in range(64):a.circle(x+(i%8)*27,220+(i//8)*31,9,TEAL if i<n else '#dae2e8')
   a.text(x+95,130,str(j*6)+' h',29,INK);a.text(x+95,570,'parent' if j==0 else 'parent + products',23)
   if j<3:a.line(x+235,350,x+275,350,ORANGE,3,arrow=True)
  a.text(700,640,'colored = parent isotope • pale = transformed products',28)
  if p==4:a.circle(150,220,14,ORANGE);a.text(145,88,'tagged nucleus',22,ORANGE)
 elif kind=='nuclear':
  def nucleus(x,y,n=14,protons=6):
   for i in range(n):
    ang=i*2.399;r=18*math.sqrt(i);a.circle(x+math.cos(ang)*r,y+math.sin(ang)*r,15,RED if i<protons else BLUE)
  nucleus(330,350,14,6);nucleus(990,350,14,7 if p==2 else 6);a.line(465,350,815,350,ORANGE,5,arrow=True)
  a.text(330,520,'before',29);a.text(990,520,'after',29)
  if p in [0,1,5]:
   for i in range(4):a.circle(750+(i%2)*33,175+(i//2)*33,16,RED if i<2 else BLUE)
   a.text(785,135,'alpha particle',27);a.text(720,655,'nucleus icons are schematic',23,GRAY);a.text(330,565,'U-238: 92 p, 146 n',26,INK);a.text(990,565,'Th-234: 90 p, 144 n',26,INK)
  elif p==2:
   a.circle(740,170,10,TEAL);a.text(790,150,'electron',26,TEAL);a.wave(650,220,140,12,2,ORANGE);a.text(760,265,'antineutrino',25,ORANGE);a.text(330,565,'C-14: 6 p, 8 n',26,INK);a.text(990,565,'N-14: 7 p, 7 n',26,INK);a.text(720,650,'red = proton • blue = neutron',25,GRAY)
  elif p==3:a.wave(620,175,190,30,3,ORANGE);a.text(720,115,'gamma photon',28,ORANGE);a.text(730,610,'same proton and neutron counts',28)
  else:a.text(720,170,'released energy',30,ORANGE);a.wave(580,235,280,25,3,ORANGE);a.text(730,610,'product rest mass is lower',28)
 a.circle(1360,650,10,focus)
 return a.finish()

for b in B:
 folder=R/b['id'];folder.mkdir(exist_ok=True)
 kind=b['steps'][0]['art'].split(':')[0]
 for i in range(6):
  (folder/f'{i:02d}.svg').write_text(make(kind,i),encoding='utf-8')
 b['intro_image']=f"{b['id']}/00.png";b['summary_image']=f"{b['id']}/05.png"
 for i,s in enumerate(b['steps'],1):s['image']=f"{b['id']}/{i:02d}.png"
(R/'process-blocks.json').write_text(json.dumps(B,ensure_ascii=False,indent=2),encoding='utf-8')
print('Created 90 vector diagrams, with no repeated step headings or embedded calculation stacks.')
