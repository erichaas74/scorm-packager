from pathlib import Path
p=Path('problem-walkthoughs/unit 5/Speed_of_Sound_Explorer.html')
s=p.read_text(encoding='utf-8')
a=s.index('      <section class="explanation"');b=s.index('      </section>',a)+len('      </section>');s=s[:a]+s[b:]
a=s.index('    const reasonPrompts =');b=s.index('    const tracks =',a);s=s[:a]+s[b:]
for line in ["    const explanation = document.getElementById('explanation');", "    const feedbackHeading = document.getElementById('feedback-heading');", "    const feedbackText = document.getElementById('feedback-text');", "    const reasonChoices = document.getElementById('reason-choices');", '      explanation.hidden = true;', '      resetReasonQuestion();']:
 s=s.replace(line+'\n','')
a=s.index('    function resetReasonQuestion()');b=s.index('    function render()',a);s=s[:a]+s[b:]
s=s.replace('const wavelength=span*.18,packet=span*.46;', 'const wavelength=span*.18;')
s=s.replace('return active&&behind>=0&&behind<=packet?Math.sin(Math.PI*behind/packet)**2:0;', 'return active&&behind>=0?Math.min(1,behind/(wavelength*.5)):0;')
s=s.replace('// A traveling compression packet; particle displacement stays local and ordered.', '// Continuous traveling sound; particles oscillate locally behind the first wavefront.')
s=s.replace("if(active)for(let j=0;j<3;j++) {", "if(active)for(let j=Math.max(0,Math.ceil((front-x1)/wavelength));j<=Math.floor((front-x0)/wavelength);j++) {")
s=s.replace("ctx.beginPath();ctx.moveTo(front,31);ctx.lineTo(front,h-26);ctx.stroke();ctx.setLineDash([]);", "if(progress<=1){ctx.beginPath();ctx.moveTo(front,31);ctx.lineTo(front,h-26);ctx.stroke();}ctx.setLineDash([]);")
s=s.replace('const arrowEnd=Math.min(x1,front+19)', 'const arrowEnd=Math.min(x1,x0+span*(progress%1)+19)')
s=s.replace('Shaded bands: compression. Particles vibrate locally. Pulse enlarged.', 'Shaded bands: compression. Particles vibrate locally. Waves enlarged.')
s=s.replace('Testing: all pulses start together over 100 m. Playback is slowed equally for every track.', 'Sound starts together over 100 m. All waves continue until the last arrival. Equally slowed playback.')
s=s.replace('const progress = Math.min(1, (now - start) / durations[index]);', '''const waveProgress = Math.min(now-start,Math.max(...durations))/durations[index];
          const progress = Math.min(1,waveProgress);
          card.dataset.waveProgress = String(waveProgress);''')
s=s.replace('drawLongitudinal(canvas, progress, item.color, true, item.id);', 'drawLongitudinal(canvas, waveProgress, item.color, true, item.id);')
s=s.replace('revealExplanation();', 'revealResult();')
a=s.index('    function revealExplanation()');b=s.index('      replayButton.hidden = false;',a)
s=s[:a]+'''    function revealResult() {
      testedModes.add(mode);
      if (testedModes.size === 2 && !completionSent) {
        completionSent = true;
        window.parent.postMessage({ type: 'complete' }, '*');
      }
'''+s[b:]
a=s.index("    reasonChoices.addEventListener('click'");b=s.index("    document.querySelectorAll('.mode-button')",a);s=s[:a]+s[b:]
s=s.replace("Number(card.dataset.progress||0)","Number(card.dataset.waveProgress||0)")
p.write_text(s,encoding='utf-8')
p=Path('problem-walkthoughs/unit 5/speed-of-sound-prediction-design.txt');s=p.read_text();s=s.replace('Ask a short explanation question. Completion fires once after both comparisons and explanation checks;', 'Do not ask the follow-up why question. Completion fires once after both comparisons finish;');s=s.replace('Show a finite right-moving packet', 'Show continuous right-moving sound');s=s.replace('Freeze completed tracks and keep their arrival evidence visible.', 'Record first arrival while waves continue moving in every track. Stop all animation together when the slowest first wave arrives; retain the ordered arrival evidence.');p.write_text(s)
