"""Original, silent cartoon GIFs and accessible Rise upload projects. Pillow only."""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import math, json, zipfile, html

ROOT = Path(__file__).resolve().parent
INK = '#22364b'; TEAL = '#087f88'; GOLD = '#ffc857'; CORAL = '#ef7359'
FONT = Path('C:/Windows/Fonts')
def font(n, bold=False): return ImageFont.truetype(str(FONT / ('arialbd.ttf' if bold else 'arial.ttf')), n)
def text(d, xy, s, n=20, color=INK, bold=False): d.text(xy, s, font=font(n,bold), fill=color)
def line(d, pts, fill=INK, w=4): d.line(pts, fill=fill, width=w, joint='curve')
def box(d, xy, fill='white', radius=14, outline=None): d.rounded_rectangle(xy,radius,fill=fill,outline=outline,width=3)
def arrow(d, a, b, color=TEAL, w=4):
    line(d,[a,b],color,w); ang=math.atan2(b[1]-a[1],b[0]-a[0]); l=12
    d.polygon([b,(b[0]-l*math.cos(ang-.5),b[1]-l*math.sin(ang-.5)),(b[0]-l*math.cos(ang+.5),b[1]-l*math.sin(ang+.5))],fill=color)
def clamp(v): return max(0,min(1,v))
def ball(d,x,y,r=17):
    d.ellipse((x-r,y-r,x+r,y+r),fill=GOLD,outline=INK,width=3)
    d.ellipse((x-r*.55,y-r*.6,x-r*.1,y-r*.15),fill='#fff1bf')
    d.ellipse((x+3,y-4,x+6,y-1),fill=INK)
def cart(d,x,y,sail=False):
    box(d,(x-35,y-25,x+35,y-3),CORAL,7,INK)
    for xx in [x-22,x+22]:
        d.ellipse((xx-10,y-10,xx+10,y+10),fill=INK);d.ellipse((xx-4,y-4,xx+4,y+4),fill='white')
    if sail:
        line(d,[(x,y-24),(x,y-108)])
        d.polygon([(x+3,y-104),(x+3,y-35),(x+52,y-35)],fill='#8dd9df',outline=INK,width=3)
def domino(d,x,y,a=0,h=60):
    # Pivot at bottom left, rotating clockwise toward next object.
    pts=[]
    for xx,yy in [(0,0),(0,-h),(16,-h),(16,0)]:
        pts.append((x+xx*math.cos(a)-yy*math.sin(a),y+xx*math.sin(a)+yy*math.cos(a)))
    d.polygon(pts,fill='#9cc5ed',outline=INK,width=3)
def flag(d,x,y):
    line(d,[(x,y),(x,y-90)],INK,4)
    for row in range(3):
        for col in range(4):
            d.rectangle((x+col*10,y-90+row*10,x+(col+1)*10,y-80+row*10),fill=INK if (row+col)%2==0 else 'white')
def base(title, subtitle, step):
    im=Image.new('RGB',(960,540),'#edf5f7');d=ImageDraw.Draw(im)
    box(d,(18,18,942,522),'white',22)
    text(d,(42,32),'THE CHAIN-REACTION WORKSHOP',14,TEAL,True)
    text(d,(42,58),title,30,INK,True);text(d,(42,99),subtitle,18)
    box(d,(40,448,920,505),'#e8f3ef',12)
    text(d,(56,465),step,20,INK,True)
    return im,d

def energy(t):
    phase=min(3,int(t//2.5))
    caps=['1. Lift the ball: store gravitational potential energy.',
          '2. The rolling ball closes a switch. It triggers the circuit.',
          '3. Battery energy runs the fan; moving air pushes the sail cart.',
          '4. The cart crosses the line. Some energy also warms the motor.']
    im,d=base('A trigger is not the whole energy supply','Ball → switch → fan → sail cart',caps[phase])
    line(d,[(55,388),(909,388)],'#b9c7d0',5)
    d.polygon([(65,221),(255,358),(65,358)],fill='#ead2aa',outline=INK,width=3)
    for x in range(75,220,25):line(d,[(x,354),(x+18,337)],'#c4a272',2)
    text(d,(64,178),'Raised ball',18,bold=True)
    p=clamp((t-1.2)/2.1);ball(d,88+175*p,213+127*p)
    box(d,(252,360,327,383),'#b7c2cd',5,INK)
    line(d,[(265,357),(308,357 if t>=3.3 else 332)],CORAL,6)
    text(d,(250,402),'Switch',18,bold=True)
    # A complete two-wire battery, switch, and motor circuit.
    box(d,(338,224,397,315),'#ffc857',8,INK);text(d,(348,240),'+',22,bold=True);text(d,(351,279),'−',22,bold=True)
    text(d,(326,193),'Battery',18,bold=True)
    line(d,[(397,250),(445,250),(445,318),(480,318)],TEAL,3)
    line(d,[(397,293),(420,293),(420,373),(320,373)],TEAL,3)
    line(d,[(260,373),(239,373),(239,422),(484,422),(484,343)],TEAL,3)
    line(d,[(489,330),(489,383)],INK,9);box(d,(454,380,524,389),INK,5)
    cx,cy=489,302
    d.ellipse((cx-46,cy-46,cx+46,cy+46),fill='#e4f0f6',outline=INK,width=3)
    ang=t*7 if t>=3.3 else 0
    for j in range(3):
        a=ang+j*math.tau/3
        pts=[(cx,cy),(cx+35*math.cos(a),cy+35*math.sin(a)),(cx+25*math.cos(a+.7),cy+25*math.sin(a+.7))]
        d.polygon(pts,fill=TEAL)
    d.ellipse((cx-7,cy-7,cx+7,cy+7),fill=GOLD,outline=INK,width=2)
    text(d,(455,228),'Motor + fan',17,bold=True)
    if t>=3.3:
        for yy in [277,307,337]:arrow(d,(549,yy),(598+8*math.sin(t*4),yy),TEAL,3)
        for j in range(3):line(d,[(465+j*18,202),(460+j*18,192),(468+j*18,183)],CORAL,2)
        text(d,(574,225),'Moving air',17,TEAL,True)
    pos=clamp((t-4)/3.8);cart(d,654+213*pos,373,True);flag(d,828,388)
    text(d,(820,402),'Finish',18,bold=True)
    return im

def tradeoff(t):
    phase=min(3,int(t//2.5))
    caps=['1. Same ball and release height; compare one change: guide rails.',
          '2. The open lane lets the ball drift away from its target.',
          '3. The guided ball reaches the domino chain and rings the bell.',
          '4. Better alignment can cost extra friction. Test the trade-off.']
    im,d=base('Keep the chain on track','Two setups · illustrated outcomes, not a statistical test',caps[phase])
    for row,yy in enumerate([206,356]):
        text(d,(52,yy-65),'A · OPEN LANE' if row==0 else 'B · GUIDE RAILS',16,TEAL,True)
        box(d,(60,yy-29,530,yy+29),'#eee2c8',9)
        line(d,[(82,yy),(555,yy)],'#c6b795',2)
        if row:
            line(d,[(68,yy-27),(540,yy-27)],INK,7);line(d,[(68,yy+27),(540,yy+27)],INK,7)
        p=clamp((t-1)/3);xx=90+490*p
        by=yy+(65*clamp((p-.4)/.6) if not row else 0)
        ball(d,xx,by,15)
        for j in range(3):
            # Overhead domino symbols rotate progressively after the guided hit.
            a=clamp((t-4.0-j*.35)/.4)*1.35 if row else 0
            domino(d,592+j*55,yy+18,a,64)
        # Bell at the end, with clear impact waves in the successful lane.
        bx=790
        d.pieslice((bx-30,yy-30,bx+30,yy+30),180,360,fill=GOLD,outline=INK,width=3)
        line(d,[(bx-35,yy),(bx+35,yy)],INK,4);d.ellipse((bx-6,yy,bx+6,yy+12),fill=CORAL,outline=INK,width=2)
        if row and t>5.1:
            text(d,(793,yy-63),'DING!',23,TEAL,True)
            for offset in [40,52]:d.arc((bx-offset,yy-offset,bx+offset,yy+offset),205,335,fill=TEAL,width=3)
        if not row and t>4.2:text(d,(590,yy+40),'Missed the first domino',17,CORAL,True)
    return im

def evidence(t):
    phase=min(3,int(t//2.5))
    caps=['1. The goal is to move the car across the finish line.',
          '2. Each chain transfers energy through contacts.',
          '3. These cartoons show successful runs, not every trial.',
          '4. Use the measured energies AND the five-trial records.']
    im,d=base('Which design meets the brief?','Required: at least 40% energy efficiency and 4 successful runs out of 5',caps[phase])
    for row,yy in enumerate([228,389]):
        text(d,(52,yy-95),'DESIGN A' if row==0 else 'DESIGN B',17,TEAL,True)
        line(d,[(63,yy),(630,yy)],'#b9c7d0',4)
        d.polygon([(65,yy-58),(195,yy),(65,yy)],fill='#ead2aa',outline=INK,width=2)
        p=clamp((t-1)/2.4);ball(d,83+133*p,yy-63+48*p,14)
        for j in range(3):domino(d,230+j*56,yy,clamp((t-3.4-j*.33)/.4)*1.36,60)
        cart(d,437+153*clamp((t-4.6)/2.2),yy-10);flag(d,542,yy)
        box(d,(665,yy-96,906,yy+14),'#f0f6fa',12)
        text(d,(682,yy-83),'Supplied measurements',15,TEAL,True)
        text(d,(682,yy-59),'Input: 0.60 J' if row==0 else 'Input: 0.40 J',18,bold=True)
        text(d,(682,yy-35),'Useful output: 0.24 J' if row==0 else 'Useful output: 0.20 J',18)
        text(d,(682,yy-10),'Complete runs: 5 / 5' if row==0 else 'Complete runs: 3 / 5',18,bold=True)
    return im

CONFIGS=[
 dict(id='energy',title='Cartoon lab: what powers the next stage?',render=energy,
      intro='Watch a ball close a switch, then follow the separate energy supply that powers the fan.',
      alt='A raised ball rolls into a switch. A battery powers a fan, whose moving air pushes a sail cart across a finish line.',
      steps=['Lifted ball: gravitational potential energy is stored during setup.','The ball closes the switch; the switch controls the circuit.','The battery supplies energy, the motor converts it, and the fan moves air.','The sail cart crosses the line; sound and motor heating are other outputs.'],
      teach='The ball triggers the fan, but the battery supplies the fan’s energy. A chain can release energy stored in more than one place.',
      q='During one run, the motor-and-fan system receives 20 J electrically. It transfers 6 J in total into sound and thermal energy. If the remaining energy moves air, what is its useful-energy efficiency for moving air?',
      choices=['30%, because 6 of the 20 J has been transferred.','70%, because 14 of the 20 J moves air.','100%, because the ball successfully closes the switch.'],correct=1,
      feedback='Useful output = 20 − 6 = 14 J; efficiency = 14 ÷ 20 × 100% = 70%. The switch triggers the circuit; it does not supply the motor’s energy. Energy transferred into sound and thermal energy still exists.',
      transfer='Your device: identify one trigger, one energy store, and the component that converts or transfers that energy.'),
 dict(id='tradeoffs',title='Cartoon lab: a useful change can have a cost',render=tradeoff,
      intro='Compare an open lane with guide rails. Keep the ball and release height the same.',
      alt='Two setups: a ball on an open lane drifts past the dominoes. Guide rails keep another ball aligned; it topples the dominoes and rings a bell.',
      steps=['Both versions use the same ball and release height. Only the guide rails change.','The ball on the open lane drifts past the first domino.','The guided ball contacts the dominoes, and the chain rings a bell.','Guide contact may increase friction, so compare repeated runs and energy measurements.'],
      teach='Rails may improve alignment while extra contact transfers more energy into thermal energy. The bell’s sound is useful here because ringing it is the final task.',
      q='In repeated trials, the rails improve complete runs from 2/5 to 4/5, but measured useful output per successful run falls from 0.30 J to 0.24 J. Total input remains 0.40 J per run. Which conclusion fits both measurements?',
      choices=['Reliability improves, while successful-run efficiency falls from 75% to 60%.','Both improve: 4/5 means the device is 80% energy efficient.','Both decline, because any reduction in useful energy means fewer successes.'],correct=0,
      feedback='Complete-run success rises from 40% to 80%. For the measured successful runs, energy efficiency falls from 0.30/0.40 = 75% to 0.24/0.40 = 60%. This is a trade-off. These are supplied practice data, not measurements you can infer from the cartoon.',
      transfer='Your device: choose a change that could improve one criterion while making another worse. Describe how you would test it.'),
 dict(id='evidence',title='Cartoon lab: use two kinds of evidence',render=evidence,
      intro='The brief requires at least 40% energy efficiency and 4 complete runs out of 5. Use both measures to judge the designs.',
      alt='Two ball, domino, and toy-car chains complete a run. A measurement card for each lists input energy, useful output energy, and success across five trials.',
      steps=['Both designs must move the toy car across the finish line.','A rolling ball triggers dominoes, which push the car.','One successful run is shown for each design.','A: input 0.60 J, useful output 0.24 J, 5/5 complete runs. B: input 0.40 J, useful output 0.20 J, 3/5 complete runs.'],
      teach='Efficiency compares useful output energy with input energy. Reliability uses repeated outcomes. A successful cartoon run alone cannot establish either measure.',
      q='Which design meets both requirements in the supplied data?',
      choices=['B only: its 50% efficiency compensates for its three successful runs.','Both: each has at least 40% efficiency, and each cartoon shows success.','A only: 40% efficiency and 5/5 complete runs meet both requirements.'],correct=2,
      feedback='A: 0.24/0.60 × 100% = 40%, with 5/5 complete runs. B: 0.20/0.40 × 100% = 50%, but only 3/5 complete runs. B is more efficient in the measured run, yet misses the reliability requirement. Five trials do not guarantee future success.',
      transfer='Your device: write one measurable success criterion and one constraint before testing. Record every run, including failures.')]

TEMPLATE='''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>__TITLE__</title><style>
*{box-sizing:border-box}body{margin:0;background:#f1f7f8;color:#22364b;font:18px/1.5 Arial,sans-serif}main{max-width:1060px;margin:auto;padding:24px}h1{font-size:28px;line-height:1.2;margin:5px 0 12px}h2{font-size:21px}p{margin:12px 0}.tag{font-size:13px;font-weight:bold;letter-spacing:.08em;color:#087f88}img{display:block;width:100%;height:auto;border-radius:16px}button{font:inherit;cursor:pointer;border:2px solid #326479;border-radius:8px;padding:10px 16px;background:white;color:#22364b;min-height:46px}button:hover{background:#e1f0f1}button:focus-visible,summary:focus-visible{outline:3px solid #ac5200;outline-offset:3px}.controls{display:flex;gap:9px;flex-wrap:wrap;margin:12px 0}.primary{background:#096a74;color:white}.primary:hover{background:#064f58}.note{padding:12px 16px;border-left:4px solid #087f88;background:#fff}.choices{display:grid;gap:10px}.choices button{text-align:left}.choices .best{background:#e0f2e5;border-color:#287847}.choices .wrong{background:#fff0dc;border-color:#a75f1a}.choices button:disabled{opacity:1;cursor:default}#feedback:empty{display:none}#feedback{background:#fff;padding:15px;border-left:4px solid #287847}summary{cursor:pointer;padding:10px 0;font-weight:bold}.small{font-size:14px;color:#4b6071}details ol{padding-left:24px}.stillLabel{min-height:1.5em}@media(max-width:550px){main{padding:12px}h1{font-size:23px}body{font-size:16px}.controls button{flex:1}}
</style></head><body><main><div class="tag">UNIT 4 · LESSON 4 · 10-SECOND CARTOON</div><h1>__TITLE__</h1><p>__INTRO__</p><img id="movie" src="still-0.png" alt="__ALT__" width="960" height="540"><div class="controls"><button id="play" class="primary">Play animation</button><button id="stop">Stop / reset</button><button id="next">Next still frame</button></div><p class="small stillLabel" id="motionStatus" aria-live="polite">Ready. Motion starts only when you choose Play.</p><p class="note">__TEACH__</p><details><summary>Read the sequence without motion</summary><ol>__STEPS__</ol></details><h2 id="question">__QUESTION__</h2><div class="choices" id="choices" role="group" aria-labelledby="question"></div><p id="feedback" role="status"></p><button id="retry" hidden>Try question again</button><p class="small">__TRANSFER__</p><p class="small">Original schematic cartoon. Motion is illustrative, not a physics simulation; all numbers are supplied practice measurements.</p></main><script>
const config=__CONFIG__;const el=id=>document.getElementById(id);let timer,still=0,run=0;
function halt(){clearTimeout(timer);timer=null;}
function showStill(n){halt();still=n;el('movie').src='still-'+n+'.png';el('motionStatus').textContent='Still '+(n+1)+' of 4: '+config.steps[n];}
el('play').onclick=()=>{halt();el('movie').src='animation.gif?play='+(++run);el('motionStatus').textContent='Playing one 10-second animation. No audio.';timer=setTimeout(()=>{showStill(3);el('motionStatus').textContent='Animation finished. Replay or review the still frames.';},10000);};
el('stop').onclick=()=>showStill(0);el('next').onclick=()=>showStill((still+1)%4);
function render(){el('feedback').textContent='';el('retry').hidden=true;el('choices').replaceChildren();config.choices.forEach((s,i)=>{const b=document.createElement('button');b.textContent=s;b.onclick=()=>{[...el('choices').children].forEach((x,j)=>{x.disabled=true;if(j===config.correct){x.classList.add('best');x.textContent='Best answer: '+config.choices[j];}else if(j===i)x.classList.add('wrong');});el('feedback').textContent=(i===config.correct?'Correct. ':'Compare with the best answer. ')+config.feedback;el('retry').hidden=false;window.parent.postMessage({type:'complete'},'*');};el('choices').append(b);});}
el('retry').onclick=render;render();document.addEventListener('visibilitychange',()=>{if(document.hidden&&timer)showStill(0);});
</script></body></html>'''

def build():
    for c in CONFIGS:
        out=ROOT/c['id'];out.mkdir(parents=True,exist_ok=True)
        frames=[c['render'](i/8) for i in range(80)]
        # No loop extension: a single play, started explicitly by the learner.
        for i,at in enumerate([0,3.0,5.6,9.8]):c['render'](at).save(out/f'still-{i}.png')
        # Pillow GIF time is centiseconds; use 120ms and 130ms alternately for 10s.
        frames[0].save(out/'animation.gif',save_all=True,append_images=frames[1:],duration=[120,130]*40,optimize=True,disposal=2)
        doc=TEMPLATE
        substitutions={'TITLE':c['title'],'INTRO':c['intro'],'ALT':c['alt'],'TEACH':c['teach'],'QUESTION':c['q'],'TRANSFER':c['transfer']}
        for key,value in substitutions.items():doc=doc.replace('__'+key+'__',html.escape(value))
        doc=doc.replace('__STEPS__',''.join('<li>'+html.escape(s)+'</li>' for s in c['steps']))
        doc=doc.replace('__CONFIG__',json.dumps({k:c[k] for k in ['steps','choices','correct','feedback']},ensure_ascii=False).replace('</','<\\/'))
        (out/'index.html').write_text(doc,encoding='utf-8')
        z=ROOT/f'u4l4-cartoon-{c["id"]}.zip'
        with zipfile.ZipFile(z,'w',zipfile.ZIP_DEFLATED) as archive:
            for f in out.iterdir():archive.write(f,f.name)
        print(z, z.stat().st_size)
    # A compact preview sheet for checking key poses and labels.
    sheet=Image.new('RGB',(960,540*3),'white')
    for i,c in enumerate(CONFIGS):sheet.paste(c['render'](9.8),(0,540*i))
    sheet.save(ROOT/'cartoon-preview.png')

if __name__=='__main__':build()
