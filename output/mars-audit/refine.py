from pathlib import Path
p=Path('problem-walkthoughs/unit 5/Unit 5 - Lesson 4 - 06 - Mars Rover - Delayed Images and Communications.html')
s=p.read_text(encoding='utf-8').replace('const w=420,h=210,left=76,scale=(w-left-90-60)/20;', 'const w=Math.max(300,Math.min(420,svg.clientWidth)),h=210,left=76,scale=(w-left-60-60)/20;svg.style.aspectRatio=w+" / 210";')
s=s.replace('.mr-scene{max-height:180px}', '.mr-scene{max-height:220px}')
s=s.replace("let status=z.blocked?", "let status=t===0&&!g().blocked?'Ready · Launch the rover to start the image and STOP journey.':z.blocked?")
p.write_text(s,encoding='utf-8')
