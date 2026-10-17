from pathlib import Path
p = Path('unit-ApplicationFiles/unit-6/circuit-design-challenge')
old = (p/'app.js').read_text(encoding='utf-8')
fields = old[old.index('  const evidenceParts ='):old.index('  const questions =')]
prefix = '''(() => {
  "use strict";
  const STORAGE_KEY = "u6l3-phet-notebook-v2";
  const PHET_URL = "https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc_all.html";
  const missions = [
    {short:"First circuit", title:"Make a bulb light", prediction:"What connections will the bulb need to light?", steps:["In PhET, choose the Lab screen. Add one battery, one bulb, and wires. Select the battery and set it to 9.0 V; select the bulb and set its resistance to 10 Ω. Keep these settings for all comparisons.","Connect both battery terminals through the bulb to make a complete loop. If it does not light, inspect each connection and repair the path.","Disconnect one wire, observe the bulb, then reconnect it. Record both the working circuit and the open-circuit observation."]},
    {short:"Current", title:"Follow current around a loop", prediction:"Will current be smaller after it passes through the bulb?", steps:["Keep the one-bulb loop closed at the same settings.","Use PhET’s current meter to measure before the bulb, after it, and near the battery. If using a connecting ammeter, insert it in series; never connect it directly across the battery.","Read each location separately and enter all three readings in amperes. Explain any differences in your notes."]},
    {short:"Voltage", title:"Compare two points", prediction:"Where will you find the largest voltage difference?", steps:["Keep the one-bulb circuit connected. Bring the voltmeter into the workspace.","Place the probes across the battery, then across the bulb, then at two points on one uninterrupted wire. A voltmeter compares two points; it does not replace a wire in the loop.","Record voltage magnitudes in volts. If the display is negative, reverse the probes and note why the sign changed."]},
    {short:"Series", title:"Build one path for two bulbs", prediction:"How will adding a second bulb change current and brightness?", steps:["Add a second identical 10 Ω bulb in the same loop, with no branches. Keep the battery at 9.0 V.","Measure battery voltage, loop current, and voltage across each bulb. Calculate total resistance using measured battery voltage divided by total current. Compare brightness with your one-bulb circuit.","Disconnect Bulb 1 and observe Bulb 2. Reconnect it, then disconnect Bulb 2 and observe Bulb 1. Record the failure observation and restore both bulbs."]},
    {short:"Parallel", title:"Build a second path", prediction:"Will each bulb receive half the battery voltage or all of it?", steps:["Rewire the same two bulbs so each has its own path between the battery terminals. Keep the same source voltage and bulb resistance as mission 4.","Measure total current before the junction, current in each branch, and voltage across each bulb. Calculate total resistance using V/I. Compare brightness with the single-bulb reference.","Disconnect each bulb in turn and observe the other. Record the result, then restore both branches. Compare total current with the sum of branch currents."]},
    {short:"Reliability", title:"Keep the second room lit", prediction:"Which arrangement will keep one room lit if the other bulb fails?", steps:["Build your own two-room layout. Both bulbs must light normally, receive the full battery voltage, and have paths to the battery; one bulb must be able to fail while the other stays lit.","Test your design by disconnecting Bulb 1. Observe Bulb 2, then restore Bulb 1 and test the reverse failure.","Revise the wiring if needed. Record the arrangement you actually built, the observed failure result, and whether all four requirements were met."]},
    {short:"Switches", title:"Control two rooms independently", prediction:"Where must each switch go to control only one room?", steps:["Add two switches to your two-room circuit. Decide where they belong so either room can be controlled independently.","Test ON/OFF, OFF/ON, ON/ON, and OFF/OFF. In each row, Pass means the observed bulb states match that row’s requested states.","If a switch changes both rooms, trace the shared path, move the switch, and test again. Record what you changed and why."]},
    {short:"Final design", title:"Build and defend three rooms", prediction:"How will a third working room affect the battery’s total current?", steps:["Build a three-bulb circuit with multiple branches and at least two switches. Every bulb must receive approximately the full battery voltage, and at least one bulb must switch independently. Use identical bulbs and your original source settings.","With all bulbs connected and switches closed, record battery voltage, each bulb’s voltage, and total battery current. Describe the arrangement and switch locations you actually built.","Disconnect each bulb in turn, restoring it before the next test. Then open Switch 1 alone and Switch 2 alone, restoring each afterward. Record exactly which bulbs remain lit. Check that there is no wire-only path across the battery.","Revise and repeat any failed tests. Capture a screenshot for your own record if useful, or describe the wiring in enough detail to reconstruct it. Use your measurements and tests in the final Buzz explanations."]}
  ];
'''
(p/'app.js').write_text(prefix+fields, encoding='utf-8')
html = (p/'index.html').read_text(encoding='utf-8')
start = html.index('            <div class="work-grid">')
end = html.index('          </div>\n        </div>\n      </section>', start)
html = html[:start]+'''            <section class="phet-card" aria-labelledby="buildHeading">
              <p class="kicker">Build in PhET · Record here</p>
              <h2 id="buildHeading">Your circuit, your evidence</h2>
              <p>Open PhET in another tab or put the two windows side by side. Build and test there, then return here to enter your readings. This notebook does not read or save your PhET circuit.</p>
              <a class="button button-primary" href="https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc_all.html" target="_blank" rel="noopener">Open PhET Circuit Construction Kit ↗</a>
              <p class="save-note">Keep the PhET tab open between missions. Use the same 9.0 V battery and identical 10 Ω bulbs for comparisons. Record actual readings; do not substitute calculated answers for measurements.</p>
              <h3>Before you build</h3>
              <label id="predictionLabel" for="prediction"></label>
              <textarea id="prediction" maxlength="800" placeholder="Write your prediction before testing."></textarea>
              <h3>Build → measure → test</h3>
              <ol class="build-steps" id="buildSteps"></ol>
              <p><strong>Meter reminder:</strong> Measure current through a path and voltage across two points. Use meter readings, not animation speed, as numerical evidence. Avoid a wire-only path across the battery.</p>
            </section>
            <section class="phet-card" aria-labelledby="evidenceHeading">
              <p class="kicker">Your measurements</p>
              <h2 id="evidenceHeading">Record this mission</h2>
              <p>Enter your observations from PhET. A completed table means evidence is recorded, not that your answers have been graded.</p>
              <div id="missionEvidence"></div>
              <label for="observation"><strong>Explain what happened or what you repaired</strong></label>
              <textarea id="observation" maxlength="1500" placeholder="Compare your prediction with the result. Describe any wiring changes."></textarea>
              <p id="missionStatus" role="status"></p>
              <button class="button button-secondary" id="openNotebook" type="button">Review all evidence</button>
            </section>
''' + html[end:]
start = html.index('          <div class="report-grid">')
end = html.index('        </div>\n      </section>', start)
html = html[:start]+'''          <section class="phet-card">
            <h3>Your final circuit</h3>
            <p>The report uses only what you enter. It cannot verify your PhET wiring. Describe your final arrangement in mission 8; an optional screenshot can supplement the description.</p>
            <label for="circuitImage">Attach a screenshot for your local report (PNG, JPEG, or WebP; maximum 1 MB)</label>
            <input id="circuitImage" type="file" accept="image/png,image/jpeg,image/webp">
            <button id="removeImage" type="button" class="button button-secondary" hidden>Remove screenshot</button>
            <img id="circuitPreview" alt="Student-provided final circuit screenshot" hidden>
            <p class="save-note">The screenshot stays in this browser notebook and appears when printing. The text download contains your written evidence only. Nothing here submits a response or attachment to Buzz.</p>
          </section>
          <section class="phet-card"><h3>Evidence review</h3><p id="readiness" role="status"></p><div id="reportEvidence"></div></section>
          <section class="phet-card"><h3>Finish in Buzz</h3><p>Use your recorded evidence to answer the 10 assessment questions. Submit through Buzz when finished. The notebook and optional downloads are personal records, not a graded submission.</p></section>
''' + html[end:]
html = html.replace('0 of 8 investigations · 0 of 27 responses','0 of 8 evidence tables complete').replace('0/27','0/8').replace('Lab bench','Build challenges').replace('Return to bench','Return to challenges').replace('Use measurements from the model or PhET, then explain the patterns in your own words.','Review the measurements and observations you entered from PhET. Use these tables when answering the Buzz questions.').replace('Review the final circuit against every requirement before submitting your work.','Review your recorded measurements and tests before answering the Buzz questions.')
html = html.replace('<span id="progressLabel">Lab progress</span>', '<span id="progressLabel">Evidence recorded</span>')
html = html.replace('    <main id="mainContent">','    <p id="saveStatus" class="storage-status" role="status">Your notebook saves in this browser. Your PhET circuit is separate.</p>\n    <main id="mainContent">')
(p/'index.html').write_text(html, encoding='utf-8')
