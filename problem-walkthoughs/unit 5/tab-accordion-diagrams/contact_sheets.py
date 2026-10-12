from PIL import Image,ImageDraw
from pathlib import Path
import json
R=Path(__file__).parent
A=[i for b in json.loads((R/'diagram-manifest.json').read_text()) for i in b['items']]
for n in range(0,len(A),18):
 im=Image.new('RGB',(1440,1650),'#d7e3eb');dr=ImageDraw.Draw(im)
 for k,it in enumerate(A[n:n+18]):
  x=k%3*480;y=k//3*275
  dr.text((x+10,y+5),it['diagramIndex']+' '+it['title'],fill='black')
  im.paste(Image.open(it['image']).resize((480,240)),(x,y+30))
 im.save(R/f'contact-{n//18}.png')
