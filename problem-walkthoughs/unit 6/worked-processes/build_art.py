import json,html,math
from pathlib import Path
R=Path(__file__).parent
blocks=json.loads((R/'process-blocks.json').read_text(encoding='utf8'))
NAVY='#203450';BLUE='#4265ad';TEAL='#087f86';ORANGE='#d57b2a';RED='#b84c68';GRAY='#6c7e91';LIGHT='#edf4fa'
def esc(t): return html.escape(str(t))
def text(x,y,t,size=28,color=NAVY,anchor='middle'):
    return f'<text x="{x}" y="{y}" font-family="Arial,sans-serif" font-size="{size}" fill="{color}" text-anchor="{anchor}">{esc(t)}</text>'
def line(x1,y1,x2,y2,c=GRAY,w=4,dash=''):
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{c}" stroke-width="{w}" stroke-dasharray="{dash}" stroke-linecap="round"/>'
def arrow(x1,y1,x2,y2,c=TEAL,w=6):
    a=math.atan2(y2-y1,x2-x1);d=20
    return line(x1,y1,x2,y2,c,w)+f'<path d="M{x2},{y2} L{x2-d*math.cos(a-.5)},{y2-d*math.sin(a-.5)} L{x2-d*math.cos(a+.5)},{y2-d*math.sin(a+.5)} Z" fill="{c}"/>'
def circle(x,y,r,c=LIGHT,stroke=GRAY,w=3): return f'<circle cx="{x}" cy="{y}" r="{r}" fill="{c}" stroke="{stroke}" stroke-width="{w}"/>'
def rect(x,y,w,h,c=LIGHT,stroke='none',r=20): return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{c}" stroke="{stroke}" stroke-width="3"/>'
def charge(x,y,label,positive=True,r=48):
    c=ORANGE if positive else BLUE
    return circle(x,y,r,'#fff',c,5)+text(x,y+14,'+' if positive else '−',44,c)+text(x,y+r+48,label,29)
def bracket(x1,x2,y,label):return line(x1,y,x2,y)+line(x1,y-9,x1,y+9)+line(x2,y-9,x2,y+9)+text((x1+x2)/2,y+42,label,27)
def pill(x,y,t,c=TEAL):return rect(x-125,y-28,250,52,'#fff',c,26)+text(x,y+8,t,25,c)
def resistor(x,y,label):return rect(x-85,y-24,170,48,'#fff',NAVY,4)+text(x,y-42,label,29)
def battery(x,y,label):return line(x,y-44,x,y+44,NAVY,7)+line(x+25,y-26,x+25,y+26,NAVY,5)+text(x+10,y+86,label,29)+text(x-18,y-62,'+',24,ORANGE)
def dots(x,y,n,c=BLUE):
    return ''.join(circle(x+(i%5)*34,y+(i//5)*34,9,c,c,1) for i in range(n))
def coil(x,y,w=380):
    return rect(x-30,y-48,w+60,96,'#dae5ed',GRAY,15)+''.join(f'<ellipse cx="{x+i*w/9}" cy="{y}" rx="20" ry="75" fill="none" stroke="{ORANGE}" stroke-width="7"/>' for i in range(10))
def base(i):
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="720" viewBox="0 0 1440 720"><rect width="1440" height="720" rx="32" fill="{LIGHT}"/><rect x="28" y="28" width="1384" height="664" rx="26" fill="white"/>'+''.join(circle(1280+j*20,656,5,TEAL if j==i%6 else '#d8e5ee','none',0) for j in range(6))
def art(b,i):
    z=base(i);kind=b['scene'];h=TEAL if i%2 else ORANGE
    if kind=='charge':
        z+=rect(145,175,380,350,LIGHT)+rect(915,175,380,350,LIGHT)
        z+=text(335,140,'Object A')+text(1105,140,'Object B')
        z+=charge(335,300,'gains electrons',False)+charge(1105,300,'loses electrons',True)
        z+=arrow(975,100,470,100,BLUE)+text(720,70,'electron transfer: B → A',28,BLUE)
        z+=dots(260,410,10)+dots(1030,410,5)
        z+=text(720,310,'initially neutral',27,GRAY)
        if i>=3:z+=pill(335,580,'−0.32 μC',BLUE)+pill(1105,580,'+0.32 μC',ORANGE)
        if i>=4:z+=f'<rect x="80" y="55" width="1280" height="565" rx="30" fill="none" stroke="{TEAL}" stroke-width="3" stroke-dasharray="12 9"/>'+text(720,650,'both objects form one isolated system',26,TEAL)
    elif kind=='coulomb':
        if i==4:
            for yy,dist,q1,q2 in [(190,700,'+2.0 μC','−3.0 μC'),(490,350,'+4.0 μC','−6.0 μC')]:
                x1=720-dist/2;x2=720+dist/2;z+=charge(x1,yy,q1)+charge(x2,yy,q2,False)+arrow(x1+65,yy,x1+170,yy)+arrow(x2-65,yy,x2-170,yy)+bracket(x1,x2,yy+100,'0.50 m' if yy==190 else '0.25 m')
        else:
            z+=charge(300,310,'+2.0 μC')+charge(1140,310,'−3.0 μC',False)+bracket(300,1140,485,'center-to-center separation: 0.50 m')
            z+=arrow(370,310,580,310,TEAL)+arrow(1070,310,860,310,TEAL)
            z+=text(720,175,'opposite charges attract',34)+text(475,265,'force on q₁',26,TEAL)+text(970,265,'force on q₂',26,TEAL)
            z+=text(720,620,'force arrows show directions; not a scale drawing',24,GRAY)
    elif kind=='net':
        z+=line(140,330,1300,330,'#d0dce6',3)
        z+=charge(250,330,'Q₁: +3.0 μC')+charge(700,330,'Q₂: −2.0 μC',False)+charge(1200,330,'Q₃: +5.0 μC')
        z+=bracket(250,700,485,'0.40 m')+bracket(700,1200,485,'0.50 m')
        z+=arrow(680,220,400,220,BLUE if i!=3 else GRAY)+arrow(720,180,1019,180,ORANGE if i!=2 else GRAY)
        z+=text(495,175,'Q₁ pulls left',26,BLUE)+text(915,130,'Q₃ pulls right',26,ORANGE)
        if i>=4:z+=arrow(700,590,755,590,TEAL)+text(930,600,'small net force to the right',27,TEAL)
        else:z+=text(720,615,'target: Q₂ only',28,TEAL)
    elif kind=='comparison':
        z+=charge(315,275,'proton')+charge(1125,275,'electron',False)+bracket(315,1125,425,'same separation r for both forces')
        z+=arrow(390,235,545,235,BLUE)+arrow(1050,235,895,235,BLUE)+text(720,225,'electric attraction',30,BLUE)
        z+=arrow(390,320,545,320,TEAL)+arrow(1050,320,895,320,TEAL)+text(720,330,'gravitational attraction',28,TEAL)
        z+=text(720,110,'arrows show direction only, not relative magnitude',25,GRAY)
        if i>=3:z+=text(720,560,'electric interaction dominates for this pair',31,BLUE)
        if i==4:
            z+=rect(530,575,380,75,LIGHT)+text(720,621,'neutral bulk: + and − balance',23)
    elif kind=='field':
        z+=charge(300,350,'source Q = +4.0 μC')
        for a in [-120,-60,60,120,180]:
            rad=math.radians(a);z+=arrow(300+70*math.cos(rad),350+70*math.sin(rad),300+200*math.cos(rad),350+200*math.sin(rad),ORANGE,4)
        xp=1050 if i==4 else 850
        z+=charge(xp,350,'q = −2.0 nC',False,34)+text(xp,285,'P',30)
        z+=arrow(xp,170,xp+(120 if i==4 else 280),170,TEAL)+text(xp+80,135,'electric field E',28,TEAL)
        z+=arrow(xp-10,440,xp-(65 if i==4 else 220),440,BLUE)+text(xp-130,493,'force on negative q',27,BLUE)
        z+=bracket(300,xp,575,'0.60 m' if i==4 else '0.30 m')
    elif kind=='plates':
        z+=rect(220,115,26,480,'#f1c995',ORANGE,5)+rect(1194,115,26,480,'#acbee5',BLUE,5)
        z+=text(232,85,'120 V',30,ORANGE)+text(1207,85,'0 V',30,BLUE)
        for yy in [180,280,420,520]:z+=arrow(280,yy,1160,yy,'#a9cbd0',4)
        z+=charge(725,350,'+2.0 μC',True,36)+bracket(233,1207,615,'0.040 m')
        z+=arrow(780,350,970,350,ORANGE)+text(970,315,'electric force',26,ORANGE)
        if i>=2:z+=arrow(670,350,450,350,BLUE)+text(470,320,'external force',26,BLUE)+arrow(850,90,600,90,TEAL)+text(725,65,'motion at constant speed',25,TEAL)
    elif kind=='current':
        z+=rect(120,240,1200,200,LIGHT,GRAY,60)
        for xx in range(195,1260,140):z+=circle(xx,340,22,'#fff',BLUE)+text(xx,350,'−',30,BLUE)+arrow(xx+35,340,xx+85,340,BLUE,3)
        z+=line(720,190,720,495,ORANGE,5,'9 8')+text(720,535,'cross-section',29,ORANGE)
        z+=arrow(430,165,1000,165,BLUE)+text(715,125,'electron drift',30,BLUE)
        if i>=2:z+=pill(1090,560,'18 C in 12 s')
        if i>=4:z+=arrow(1000,620,430,620,TEAL)+text(715,665,'conventional current',29,TEAL)
    elif kind=='ohm':
        z+=line(320,210,1120,210,NAVY)+line(320,210,320,530,NAVY)+line(1120,210,1120,530,NAVY)+line(320,530,660,530,NAVY)+line(690,530,1120,530,NAVY)
        z+=resistor(790,210,'unknown R' if i<2 else '60 Ω')+battery(665,530,'12 V' if i==3 else '9.0 V')
        z+=circle(475,210,42,'white',TEAL)+text(475,222,'A',31,TEAL)+text(470,130,'0.20 A' if i==3 else '150 mA',28,TEAL)
        z+=line(675,210,675,355,GRAY)+line(905,210,905,355,GRAY)+line(675,355,750,355,GRAY)+line(830,355,905,355,GRAY)+circle(790,355,40,'white',BLUE)+text(790,367,'V',31,BLUE)
        z+=text(790,435,'voltmeter across the resistor',27,BLUE)+text(720,650,'ideal meters • constant-temperature resistor',25,GRAY)
    elif kind=='graph':
        x0=255;y0=560;sx=2500;sy=48
        z+=arrow(x0,y0,1200,y0,GRAY,3)+arrow(x0,y0,x0,80,GRAY,3)+text(1190,615,'I (A)',29)+text(210,90,'V (V)',29)
        for v in [2,4,6,8]:z+=line(x0,y0-v*sy,1150,y0-v*sy,'#e0e9f0',2)+text(215,y0-v*sy+9,v,26)
        for a in [.1,.2,.3]:z+=text(x0+a*sx,605,f'{a:.2f}',26)
        z+=line(x0,y0,x0+.36*sx,y0-7.2*sy,BLUE,5)
        for a,v in [(.1,2),(.2,4),(.3,6)]:z+=circle(x0+a*sx,y0-v*sy,10,BLUE,BLUE)
        if i==2:z+=line(505,464,1005,464,ORANGE,4,'8 6')+line(1005,464,1005,272,ORANGE,4,'8 6')+text(770,500,'ΔI',27,ORANGE)+text(1050,380,'ΔV',27,ORANGE)
        if i>=4:z+=circle(x0+.32*sx,y0-8*sy,12,ORANGE,ORANGE)+text(1000,135,'later reading',27,ORANGE)
        z+=text(740,665,'voltage on the vertical axis',25,GRAY)
    elif kind=='series':
        z+=line(250,260,1210,260,NAVY)+line(250,260,250,530,NAVY)+line(1210,260,1210,530,NAVY)+line(250,530,680,530,NAVY)+line(705,530,1210,530,NAVY)
        z+=battery(680,530,'12 V')+resistor(510,260,'4.0 Ω')+resistor(950,260,'8.0 Ω')
        for xx in [305,685,1100]:z+=arrow(xx,180,xx+70,180,TEAL)
        z+=text(725,95,'one current path',34,TEAL)
        if i==3:z+=bracket(425,595,335,'4.0 V')+bracket(865,1035,335,'8.0 V')
        if i>=4:z+=rect(1194,364,32,56,'white',r=0)+line(1210,366,1250,402,ORANGE,5)+text(1090,410,'open gap',26,ORANGE)
    elif kind=='parallel':
        z+=line(315,170,315,550,NAVY)+line(1130,170,1130,550,NAVY)+line(315,230,1130,230,NAVY)+line(315,405,1130,405,NAVY)+line(315,550,690,550,NAVY)+line(715,550,1130,550,NAVY)
        z+=battery(690,550,'12 V')+resistor(790,230,'6.0 Ω')+resistor(790,405,'12 Ω')
        z+=arrow(390,180,560,180,TEAL)+arrow(390,355,475,355,BLUE)+text(485,135,'2.0 A' if i>=2 else 'branch 1',28,TEAL)+text(475,320,'1.0 A' if i>=2 else 'branch 2',28,BLUE)
        if i>=4:z+=rect(540,211,75,38,'white',r=0)+line(542,230,601,190,ORANGE,5)+text(590,280,'open',24,ORANGE)
        z+=text(720,665,'each branch spans the same two supply nodes',25,GRAY)
    elif kind=='power':
        if i==4:
            for xx,title in [(350,'series'),(1050,'parallel')]:
                z+=rect(xx-250,130,500,450,LIGHT)+text(xx,185,title,33)
                for dx in [-100,100]:z+=circle(xx+dx,335,65,'#fff6d7' if title=='parallel' else '#edf0e8',ORANGE,4)+line(xx+dx-25,310,xx+dx+25,360,ORANGE,4)+line(xx+dx+25,310,xx+dx-25,360,ORANGE,4)
                z+=text(xx,470,'12 V across both' if title=='series' else '12 V across each',28)+text(xx,530,'fixed 24 Ω per lamp',26,GRAY)
        else:
            z+=rect(550,220,340,240,'#fff8e7',ORANGE)+circle(720,305,60,'#fff1b2',ORANGE,4)+text(720,415,'lamp',32)
            z+=arrow(125,330,520,330,BLUE)+text(300,280,'12 V • 0.50 A',30,BLUE)
            z+=arrow(920,270,1260,170,ORANGE)+text(1180,130,'light',29,ORANGE)+arrow(920,400,1260,510,RED)+text(1180,565,'thermal energy',29,RED)
            z+=pill(720,595,'5.0 minutes' if i<3 else '300 seconds')
    elif kind=='data':
        if i<=1:
            z+=coil(530,275)+text(720,130,'same turns, core, and pickup method',30)
            z+=pill(375,515,'0.50 A')+pill(1065,515,'1.00 A')+text(375,590,'9, 10, 11 clips',30)+text(1065,590,'18, 20, 19 clips',30)
        else:
            z+=arrow(200,570,1240,570,GRAY,3)+arrow(200,570,200,105,GRAY,3)+text(180,82,'clips',27)
            for val in [0,5,10,15,20]:z+=line(200,570-val*20,1240,570-val*20,'#e0e9f0',2)+text(165,580-val*20,val,24)
            for xx,vs,mean,c in [(490,[9,10,11],10,BLUE),(980,[18,20,19],19,TEAL)]:
                for off,v in zip([-35,0,35],vs):z+=circle(xx+off,570-v*20,10,c,c)
                z+=line(xx-85,570-mean*20,xx+85,570-mean*20,c,6)+text(xx,625,'0.50 A' if xx==490 else '1.00 A',29)
            z+=text(720,665,'points: repeats • horizontal marks: means',24,GRAY)
    elif kind=='value':
        for xx,name,count,cost,ratio in [(290,'A',30,10,3),(720,'B',42,12,3.5),(1150,'C',54,20,2.7)]:
            z+=rect(xx-170,120,340,440,LIGHT,TEAL if name=='B' and i>=3 else '#d8e3ed')+text(xx,180,name,44)+text(xx,265,f'{count} clips',32)+text(xx,335,f'cost: {cost}',30)
            if i>=2:z+=rect(xx-110,405,ratio*60,32,TEAL if name=='B' else BLUE)+text(xx,505,f'{ratio:.2f} clips/unit',25)
            if name=='C':z+=text(xx,600,'over budget',29,RED)
        z+=text(720,75,'budget: 15 cost units',29)+text(720,656,'practice data, separate from lab measurements',23,GRAY)
    elif kind=='induction':
        z+=circle(680,345,215,'#edf6f6',TEAL,5)+circle(680,345,200,'none','#b1d6d8',3)
        for xx in [570,680,790]:
            for yy in [235,345,455]:z+=line(xx-11,yy-11,xx+11,yy+11,BLUE,4)+line(xx-11,yy+11,xx+11,yy-11,BLUE,4)
        z+=text(680,95,'100 turns • 0.020 m² per turn',29)+text(1100,210,'× field into page',27,BLUE)+text(1110,265,'0.10 T → 0.30 T',29,BLUE)+text(1100,315,'in 0.50 s',27)
        if i>=3:
            z+=arrow(680,123,510,200,ORANGE)+text(320,205,'induced current',27,ORANGE)+text(320,245,'counterclockwise',27,ORANGE)+circle(680,345,23,'white',ORANGE,3)+circle(680,345,7,ORANGE,ORANGE)+text(300,410,'• induced field',26,ORANGE)+text(300,450,'out of page',26,ORANGE)
        if i==4:z+=pill(1100,510,'steady field: no EMF')
        z+=text(720,625,'coil viewed face-on • increasing external flux',25,GRAY)
    elif kind=='efficiency':
        z+=rect(370,250,260,160,LIGHT,BLUE)+rect(890,250,240,160,LIGHT,TEAL)
        z+=text(500,335,'generator',34,BLUE)+text(1010,335,'motor',34,TEAL)
        z+=arrow(75,330,345,330,ORANGE)+text(210,260,'200 J',32)+text(210,390,'mechanical',25)
        z+=arrow(655,330,865,330,BLUE)+text(760,260,'150 J',32)+text(760,390,'electrical',25)
        z+=arrow(1155,330,1360,330,TEAL)+text(1260,260,'90 J' if i>=2 else '? J',32)+text(1260,390,'useful motion',24)
        z+=arrow(500,440,500,565,RED)+text(500,610,'50 J to surroundings',25,RED)+arrow(1010,440,1010,565,RED)+text(1010,610,'60 J to surroundings',25,RED)
        if i>=3:z+=f'<rect x="300" y="155" width="890" height="490" rx="30" fill="none" stroke="{GRAY}" stroke-width="3" stroke-dasharray="12 8"/>'+text(740,120,'whole conversion chain',31)
    return z+'</svg>'
for b in blocks:
    d=R/b['id'];d.mkdir(exist_ok=True)
    for i in range(6):(d/f'{i:02}.svg').write_text(art(b,i),encoding='utf8')
print('Created 96 SVG diagrams')
