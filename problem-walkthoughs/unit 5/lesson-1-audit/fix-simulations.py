from pathlib import Path
import zipfile

root=Path(__file__).parent
for stem in ['wave_pulse-periodic','wave_simulation']:
    source=root.parent/(stem+'.html')
    html=source.read_text(encoding='utf-8-sig')
    backup=root/'revised-assets'/(stem+'-before.html')
    if not backup.exists(): backup.write_text(html,encoding='utf-8')
    assert 'time += (frequency * 0.05);' in html
    html=html.replace('let time = 0;',"let time = 0;\n        let lastFrame = 0;\n        let animationPaused = false;")
    html=html.replace('function animate() {','function animate(timestamp = performance.now()) {')
    html=html.replace('time += (frequency * 0.05);',"const elapsed = lastFrame ? Math.min((timestamp - lastFrame) / 1000, 0.1) : 0;\n            lastFrame = timestamp;\n            if (!animationPaused) time += elapsed;")
    html=html.replace('const phase = k * s.baseX - time;','const phase = k * s.baseX - 2 * Math.PI * frequency * time;')
    html=html.replace('const phase = k * p.baseX - time;','const phase = k * p.baseX - 2 * Math.PI * frequency * time;')
    html=html.replace('<div id="canvas-container">','<button id="toggle-animation" type="button" style="display:block;margin:12px auto;padding:10px 24px;border:0;border-radius:8px;background:#224d6a;color:white;font:600 17px Arial;cursor:pointer">Pause animation</button>\n<div id="canvas-container">')
    html=html.replace('// Initialize',"document.getElementById('toggle-animation').addEventListener('click', function() { animationPaused = !animationPaused; this.textContent = animationPaused ? 'Play animation' : 'Pause animation'; });\n\n        // Initialize")
    if stem=='wave_pulse-periodic':
        html=html.replace('>Frequency<small id="frequency-caption">','><span id="frequency-name">Frequency</span><small id="frequency-caption">')
        html=html.replace('>Wavelength<small id="wavelength-caption">','><span id="wavelength-name">Wavelength</span><small id="wavelength-caption">')
        html=html.replace("waveMode = 'periodic';\n", "waveMode = 'periodic';\n                time = 0;\n")
        html=html.replace("waveMode = 'pulse';\n", "waveMode = 'pulse';\n                time = 0;\n")
        html=html.replace("wavelengthCaption.textContent = 'crest spacing';", "wavelengthCaption.textContent = 'crest spacing';\n                document.getElementById('frequency-name').textContent = 'Frequency';\n                document.getElementById('wavelength-name').textContent = 'Wavelength';\n                document.getElementById('val-frequency').textContent = frequency.toFixed(1) + ' Hz';")
        html=html.replace("wavelengthCaption.textContent = 'pulse width';", "wavelengthCaption.textContent = 'width at half height';\n                document.getElementById('frequency-name').textContent = 'Travel speed';\n                document.getElementById('wavelength-name').textContent = 'Pulse width';\n                document.getElementById('val-frequency').textContent = (frequency * 50).toFixed(0) + ' px/s';")
        html=html.replace("'A single disturbance travels along the rope. Each particle moves up and down once as the energy passes.'", "'One isolated disturbance crosses the rope. Each marked point moves up and returns to rest. The demonstration replays after the pulse exits.'")
        html=html.replace('const pulseWidth = wavelength / 3;', 'const pulseWidth = wavelength / 2.355;')
        html=html.replace('`${value.toFixed(1)} Hz`', "(waveMode === 'periodic' ? `${value.toFixed(1)} Hz` : `${(value * 50).toFixed(0)} px/s`)")
        html=html.replace('Controls how quickly periodic waves repeat.','In periodic mode, sets cycles per second. In pulse mode, sets travel speed.')
    else:
        html=html.replace('<small>wave height</small>','<small>particle displacement</small>')
        html=html.replace('<small>crest spacing</small>','<small>spacing of repeated pattern</small>')
    source.write_text(html,encoding='utf-8')
    out=root/'revised-assets'/stem
    out.mkdir(exist_ok=True)
    (out/'index.html').write_text(html,encoding='utf-8')
    with zipfile.ZipFile(str(out)+'.zip','w',zipfile.ZIP_DEFLATED) as z:z.writestr('index.html',html)
print('Prepared both simulation ZIPs with true seconds, mode-appropriate labels, and pause controls.')
