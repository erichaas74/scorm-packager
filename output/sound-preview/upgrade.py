from pathlib import Path
p=Path('problem-walkthoughs/unit 5/Speed_of_Sound_Explorer.html')
s=p.read_text(encoding='utf-8')
s=s.replace('<button class="replay-button" id="test-button" type="button" disabled>Test prediction</button>', '')
s=s.replace("    const testButton = document.getElementById('test-button');\n", '')
s=s.replace("      testButton.hidden = false;\n      testButton.disabled = true;", '')
s=s.replace("      testButton.hidden = true;", '')
s=s.replace("    testButton.addEventListener('click', runRace);\n", '')
s=s.replace('Choose a track, then test.', 'Select your prediction to launch the waves.')
s=s.replace("      raceStatus.textContent = 'Your prediction: ' + choice.name + ' arrives first. Change your choice or test it.';\n      testButton.disabled = false;", '      runRace();')
s=s.replace('const scaled = 4300 * (slowest / item.speed);', "const scaled = (mode === 'substance' ? 12000 : 6000) * (slowest / item.speed);")
s=s.replace("normalDuration * (mode === 'substance' ? 2 : 1)", 'normalDuration')
s=s.replace("      phase = 'predict';", "      phase = 'predict';\n      tracks.dataset.phase = phase;")
s=s.replace("      phase = 'running';", "      phase = 'running';\n      tracks.dataset.phase = phase;")
s=s.replace("      phase = 'result';", "      phase = 'result';\n      tracks.dataset.phase = phase;")
s=s.replace("          drawLongitudinal(canvas, progress, item.color, true, item.id);", "          card.dataset.progress = progress.toFixed(4);\n          drawLongitudinal(canvas, progress, item.color, true, item.id);")
s=s.replace('<span class="source" aria-hidden="true"></span>', '''<span class="source" aria-hidden="true"><svg viewBox="0 0 28 80"><rect x="1" y="8" width="10" height="64" rx="4" fill="#253d55"/><path d="M10 26 L23 14 L23 66 L10 54Z" fill="#758da3" stroke="#17365d" stroke-width="2"/><path d="M23 18 Q14 40 23 62" fill="none" stroke="#d8e7f4" stroke-width="3"/><circle cx="6" cy="16" r="2" fill="#c3d1dc"/><circle cx="6" cy="64" r="2" fill="#c3d1dc"/></svg></span>''')
s=s.replace('<span class="detector" aria-hidden="true"></span>', '''<span class="detector" aria-hidden="true"><svg viewBox="0 0 24 80"><rect x="3" y="10" width="18" height="60" rx="6" fill="#e4eaf0" stroke="#516a80" stroke-width="2"/><path d="M7 23H17 M7 29H17 M7 35H17 M7 41H17 M7 47H17" stroke="#7890a4" stroke-width="2"/><circle class="detector-light" cx="12" cy="59" r="4" fill="#9cabb9"/></svg></span>''')
css='''
/* Enlarged material cutaways and source/detector apparatus. */
.track-card { grid-template-columns:118px minmax(0,1fr) 100px; gap:10px; }
.track { height:144px; background:linear-gradient(#f5f9fd,#e8f1f8); border-radius:12px; box-shadow:inset 0 2px 7px #17365d18; }
.track-card[data-track="water"] .track { background:linear-gradient(#eafcfc,#c7e8ee); }
.track-card[data-track="steel"] .track { background:linear-gradient(110deg,#ececf4,#fafaff 40%,#d9dce8); }
.track-card[data-track="hot-air"] .track { background:linear-gradient(#fff8ec,#f8e6d3); }
.track-card[data-track="cold-air"] .track { background:linear-gradient(#eef7ff,#dcebf8); }
.source,.detector { top:32px; height:80px; width:24px; border-radius:0; background:none; }
.source { left:4px; width:28px; }
.detector { right:4px; background:none; }
.source svg,.detector svg { display:block; width:100%; height:100%; }
.track-card.arrived .detector-light { fill:#138353; }
.distance-label { bottom:3px; padding:0 7px; border-radius:4px; font-weight:700; }
.medium-name::before { content:""; display:inline-block; width:9px; height:9px; border-radius:50%; margin-right:6px; background:var(--track-color); }
.track-card.selected { box-shadow:inset 4px 0 #d96522; }
.track-card.winner { box-shadow:inset 4px 0 #187447; }
.wave-key { margin:9px 0 0; color:#40566d; font-size:.78rem; text-align:center; }
@media(max-width:700px) {
 .track-card { grid-template-columns:minmax(0,1fr) 100px; padding:9px; }
 .race-panel { padding:9px; }
 .sos-body { padding:8px; }
 .track { height:140px; }
 .header-actions { gap:6px; }
 .mode-button { padding:8px 10px; }
}
'''
s=s.replace('</style></head>',css+'</style></head>')
s=s.replace('<div class="tracks" id="tracks"></div>', '<div class="tracks" id="tracks"></div><p class="wave-key">Shaded bands: compression. Particles vibrate locally. Pulse enlarged.</p>')
a=s.index('    function drawLongitudinal(');b=s.index('    function makePrediction',a)
s=s[:a]+'''    function drawLongitudinal(canvas, progress, color, active, materialId = 'air') {
      const dpr=Math.min(devicePixelRatio||1,2),w=Math.max(1,canvas.clientWidth),h=Math.max(1,canvas.clientHeight);
      if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)) {canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
      const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
      const solid=materialId==='steel',liquid=materialId==='water';
      const x0=36,x1=w-30,span=Math.max(1,x1-x0),top=38,bottom=h-30;
      const rows=solid?5:liquid?5:4,cols=Math.max(9,Math.round(span/(solid?14:liquid?15:23)));
      const dx=span/(cols-1),dy=(bottom-top)/(rows-1),front=x0+span*progress;
      const wavelength=span*.18,packet=span*.46;
      const envelope=x=>{const behind=front-x;return active&&behind>=0&&behind<=packet?Math.sin(Math.PI*behind/packet)**2:0;};
      const points=[];
      // A traveling compression packet; particle displacement stays local and ordered.
      for(let r=0;r<rows;r++) {
        points[r]=[];
        for(let c=0;c<cols;c++) {
          const jitter=solid?0:Math.sin(c*2.31+r*1.47)*dx*.16;
          const bx=x0+c*dx+jitter,by=top+r*dy+(solid?0:Math.sin(c*1.73+r*2.17)*dy*.16);
          const amp=Math.min(dx*.32,wavelength*.09);
          const displacement=-amp*Math.sin(2*Math.PI*(bx-front)/wavelength)*envelope(bx);
          points[r].push({x:bx+displacement,y:by,base:bx,energy:envelope(bx)});
        }
      }
      ctx.save();ctx.beginPath();ctx.rect(x0-5,28,span+10,h-50);ctx.clip();
      // Translucent compression bands move at the same speed as the front.
      if(active)for(let j=0;j<3;j++) {
        const x=front-wavelength*j;
        const strength=envelope(x);
        if(x<x0||x>x1||strength<.01)continue;
        const band=ctx.createLinearGradient(x-9,0,x+9,0);
        band.addColorStop(0,color+'00');band.addColorStop(.5,color+'65');band.addColorStop(1,color+'00');
        ctx.fillStyle=band;ctx.fillRect(x-9,28,18,h-50);
      }
      if(solid) {
        ctx.strokeStyle='#8c88a8';ctx.lineWidth=1;
        for(let r=0;r<rows;r++)for(let c=0;c<cols;c++) {
          const p=points[r][c];
          for(const q of [points[r][c+1],points[r+1]?.[c]].filter(Boolean)) {
            ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();
          }
        }
      }
      function bead(x,y,r,tint) {
        const g=ctx.createRadialGradient(x-r*.35,y-r*.4,.2,x,y,r);
        g.addColorStop(0,'#ffffff');g.addColorStop(.4,tint);g.addColorStop(1,tint);
        ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle='#17365d40';ctx.lineWidth=.6;ctx.stroke();
      }
      for(let r=0;r<rows;r++)for(let c=0;c<cols;c++) {
        const p=points[r][c],radius=solid?3.5:liquid?3.8:2.8;
        if(!solid&&!liquid)bead(p.x+3,p.y+2,radius*.8,color);
        bead(p.x,p.y,radius,color);
        if(r===2&&c===Math.floor(cols*.5)) {
          ctx.strokeStyle='#ad481b';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,radius+2,0,Math.PI*2);ctx.stroke();
          ctx.strokeStyle='#ad481b88';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(p.base,top-5);ctx.lineTo(p.base,bottom+5);ctx.stroke();
        }
      }
      ctx.restore();
      if(active) {
        ctx.strokeStyle=color;ctx.lineWidth=2.5;ctx.setLineDash([4,3]);
        ctx.beginPath();ctx.moveTo(front,31);ctx.lineTo(front,h-26);ctx.stroke();ctx.setLineDash([]);
        const arrowEnd=Math.min(x1,front+19),arrowStart=Math.max(x0,arrowEnd-34);
        ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(arrowStart,18);ctx.lineTo(arrowEnd,18);ctx.stroke();
        ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(arrowEnd,18);ctx.lineTo(arrowEnd-6,14);ctx.lineTo(arrowEnd-6,22);ctx.fill();
      }
    }

''' +s[b:]
p.write_text(s,encoding='utf-8')
