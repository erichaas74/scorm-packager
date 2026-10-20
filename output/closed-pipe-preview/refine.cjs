const fs=require('fs');
const p='problem-walkthoughs/unit 5/string_pipe_harmonics_simulation.html';let s=fs.readFileSync(p,'utf8');
s=s.replace('compact?620:580','compact?595:565');
s=s.replace("if(!compact||n<=5)h+=text((a+b)/2,340,'λ/4','small');", "if(!compact||n<=5)h+=text((a+b)/2,340,'λ/4','small');");
s=s.replace("h+=line(x1,310,x1,322,'#486174',1.4);", "h+=line(x1,310,x1,322,'#486174',1.4);if(compact&&n>5)h+=text(w/2,340,'Each section = λ/4','small');");
s=s.replace('`<path d="M${x} 197l6 6-6 6-6-6Z"', '`<path d="M${x+amp*Math.sin(j*Math.PI/2)*phase} 197l6 6-6 6-6-6Z"');
fs.writeFileSync(p,s);
const idx='problem-walkthoughs/unit 5/index.html';s=fs.readFileSync(idx,'utf8');s=s.replace(/<article class="card" data-category="misconceptions">(\s*<div class="label">Unit 5 &middot; Lesson 2 &middot; Resonance<\/div>\s*<h3>)A Closed Pipe's First Mode<\/h3>\s*<p>One pipe end is closed and the other open\. How much wavelength fits in its first mode\?<\/p>/,'<article class="card" data-category="demos">$1Closed-Pipe Harmonics</h3>\n          <p>Watch the odd harmonics form, locate nodes and antinodes, and count the quarter wavelengths in a closed-open pipe.</p>');fs.writeFileSync(idx,s);
