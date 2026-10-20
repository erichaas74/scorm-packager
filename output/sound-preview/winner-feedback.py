from pathlib import Path
p=Path('problem-walkthoughs/unit 5/Speed_of_Sound_Explorer.html');s=p.read_text(encoding='utf-8')
s=s.replace('    const testedModes = new Set();', '''    const testedModes = new Set();
    const visitedModes = new Set(['substance']);
    let advanceTimer = null;
    function cancelAdvance() { clearTimeout(advanceTimer); advanceTimer = null; }''')
s=s.replace('    function resetAnimation() {', '    function resetAnimation() {\n      cancelAdvance();')
s=s.replace('      delete raceStatus.dataset.correct;', '      delete raceStatus.dataset.result;')
a=s.index('      const choice = comparison.tracks.find(item => item.id === prediction);',s.index('    function revealResult()'))
b=s.index("      tracks.querySelector('[data-track=",a)
s=s[:a]+'''      raceStatus.textContent = mode === 'substance'
        ? 'Steel arrives first. Its high stiffness relative to its density lets a vibration pass between neighboring particles much faster than in water or air.'
        : 'Warm air (40 \\u00b0C) arrives first. Its molecules move faster, so pressure disturbances travel faster through the gas. All three waves cover the same 100 m.';
      raceStatus.dataset.result = 'true';
      if (mode === 'substance' && !visitedModes.has('temperature')) {
        raceStatus.textContent += ' Temperature comparison follows shortly.';
        cancelAdvance();
        advanceTimer = setTimeout(() => {
          if (mode === 'substance' && phase === 'result' && !visitedModes.has('temperature')) selectMode('temperature');
        }, 8000);
      }
''' + s[b:]
a=s.index("    document.querySelectorAll('.mode-button').forEach((button) => {");b=s.index("    replayButton.addEventListener",a)
s=s[:a]+'''    function selectMode(nextMode) {
      resetAnimation();
      mode = nextMode;
      visitedModes.add(mode);
      document.querySelectorAll('.mode-button').forEach(button => {
        button.setAttribute('aria-pressed', String(button.dataset.mode === mode));
      });
      render();
    }
    document.querySelectorAll('.mode-button').forEach(button => {
      button.addEventListener('click', () => selectMode(button.dataset.mode));
    });
    window.addEventListener('pagehide', cancelAdvance);

''' + s[b:]
s=s.replace('.race-status[data-correct] { padding:12px; border:2px solid #187447; background:#e9f8ef; font-weight:800; }', '.race-status[data-result] { padding:12px; border:2px solid #285f9f; border-radius:8px; background:#edf5fc; color:#17365d; font-weight:650; line-height:1.5; }')
s=s.replace('.race-status[data-correct="false"] { border-color:#a83b32; background:#fff0ed; }','')
p.write_text(s,encoding='utf-8')
p=Path('problem-walkthoughs/unit 5/speed-of-sound-prediction-design.txt');s=p.read_text();s=s.replace('Show explicit prediction feedback and ordered measured times after the race.', 'Show a neutral explanation of why the winner is fastest and ordered measured times. Never label the prediction correct or not quite.');s=s.replace('Keep the result until replay, reset, or mode change.', 'Hold the material result for eight seconds, then automatically show the temperature prediction if temperature has not already been selected. Replay, Reset, and manual mode selection cancel the pending transition. Keep the temperature result visible.');p.write_text(s)
