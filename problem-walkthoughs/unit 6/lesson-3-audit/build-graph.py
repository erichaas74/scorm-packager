from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
root=Path(__file__).parent/'fixes'
root.mkdir(exist_ok=True)
im=Image.new('RGB',(1600,900),'#f5f8fc'); d=ImageDraw.Draw(im)
font=lambda n:ImageFont.truetype('C:/Windows/Fonts/arial.ttf',n)
def text(x,y,s,n=28,fill='#172a40'):d.text((x,y),s,font=font(n),fill=fill)
for j,title in enumerate(['Ohmic resistor: constant temperature','Heating filament: increasing resistance']):
 x=100+800*j;y=700;w=610;h=510
 text(x-20,35,title,32)
 text(x-20,85,'Voltage V (V)',25)
 for v in range(0,11,2):
  yy=y-h*v/10;d.line((x,yy,x+w,yy),fill='#dbe3ee',width=2);text(x-45,yy-14,str(v),22)
 for k in range(5):
  xx=x+w*k/4;d.line((xx,y,xx,y-h),fill='#dbe3ee',width=2);text(xx-15,y+15,f'{k/10:.1f}',22)
 d.line((x,y-h,x,y,x+w,y),fill='#172a40',width=3)
 pts=[]
 for k in range(101):
  i=.4*k/100;v=20*i if j==0 else 8*i+100*i**3
  pts.append((x+w*i/.4,y-h*v/10))
 d.line(pts,fill='#315c91' if j==0 else '#a55321',width=6)
 text(x+150,y+60,'Current I (A)',26)
 if j==0:
  text(x+10,140,'R = ΔV/ΔI = V/I = 20 Ω',28)
  for i in [.1,.2,.3]:
   xx=x+w*i/.4;yy=y-h*20*i/10;d.ellipse((xx-6,yy-6,xx+6,yy+6),fill='#315c91')
 else:text(x-10,140,'Illustrative curve, not measured data',23)
text(100,815,'Straight line through the origin.',27)
text(850,805,'With V vertical, the curve bends upward.',26)
text(850,845,'V/I need not equal the local tangent slope.',25)
im.save(root/'voltage-current-models.png')
