(() => {
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
  const evidenceParts = [
    [
      { key: "p1_path", label: "Path from terminal to terminal", type: "select", options: ["Closed", "Open"] },
      { key: "p1_bulb", label: "Bulb in the complete circuit", type: "select", options: ["Lit", "Not lit"] }
    ],
    [
      { key: "p2_current_before", label: "Current before bulb", unit: "A", type: "number" },
      { key: "p2_current_after", label: "Current after bulb", unit: "A", type: "number" },
      { key: "p2_current_battery", label: "Current near battery", unit: "A", type: "number" }
    ],
    [
      { key: "p3_voltage_battery", label: "Voltage across battery", unit: "V", type: "number" },
      { key: "p3_voltage_bulb", label: "Voltage across bulb", unit: "V", type: "number" },
      { key: "p3_voltage_wire", label: "Voltage across wire", unit: "V", type: "number" }
    ],
    [
      { key: "p4_battery_voltage", label: "Battery voltage", unit: "V", type: "number" },
      { key: "p4_circuit_current", label: "Circuit current", unit: "A", type: "number" },
      { key: "p4_bulb1_voltage", label: "Voltage across Bulb 1", unit: "V", type: "number" },
      { key: "p4_bulb2_voltage", label: "Voltage across Bulb 2", unit: "V", type: "number" }
    ],
    [
      { key: "p5_battery_voltage", label: "Battery voltage", unit: "V", type: "number" },
      { key: "p5_total_current", label: "Total battery current", unit: "A", type: "number" },
      { key: "p5_bulb1_current", label: "Current through Bulb 1", unit: "A", type: "number" },
      { key: "p5_bulb2_current", label: "Current through Bulb 2", unit: "A", type: "number" },
      { key: "p5_bulb1_voltage", label: "Voltage across Bulb 1", unit: "V", type: "number" },
      { key: "p5_bulb2_voltage", label: "Voltage across Bulb 2", unit: "V", type: "number" }
    ],
    [
      { key: "p6_second_bulb", label: "Second bulb after failure", type: "select", options: ["Remained lit", "Turned off"] },
      { key: "p6_arrangement", label: "Final arrangement", type: "select", options: ["Parallel", "Series"] },
      { key: "p6_requirements", label: "Four design requirements", type: "select", options: ["Pass", "Fail"] }
    ],
    [
      { key: "p7_on_off", label: "Bulb 1 ON · Bulb 2 OFF", type: "select", options: ["Pass", "Fail"] },
      { key: "p7_off_on", label: "Bulb 1 OFF · Bulb 2 ON", type: "select", options: ["Pass", "Fail"] },
      { key: "p7_on_on", label: "Both bulbs ON", type: "select", options: ["Pass", "Fail"] },
      { key: "p7_off_off", label: "Both bulbs OFF", type: "select", options: ["Pass", "Fail"] }
    ],
    [
      { key: "p8_bulb1_voltage", label: "Voltage across Bulb 1", unit: "V", type: "number" },
      { key: "p8_bulb2_voltage", label: "Voltage across Bulb 2", unit: "V", type: "number" },
      { key: "p8_bulb3_voltage", label: "Voltage across Bulb 3", unit: "V", type: "number" },
      { key: "p8_total_current", label: "Total battery current", unit: "A", type: "number" },
      { key: "p8_disconnect_bulb1", label: "Disconnect Bulb 1 · other bulbs", type: "select", options: ["Stay lit", "Turn off"] },
      { key: "p8_open_switch1", label: "Open Switch 1 · result", type: "text" },
      { key: "p8_open_switch2", label: "Open Switch 2 · result", type: "text" }
    ]
  ];

  const numberField = (key, label, unit) => ({ key, label, unit, type: "number" });
  const textField = (key, label) => ({ key, label, type: "text" });
  const choiceField = (key, label, options) => ({ key, label, options, type: "select" });
  evidenceParts[0].push(textField("p1_open", "What happened when you disconnected a wire?"));
  [0, 1, 5, 6].forEach(i => evidenceParts[i].unshift(numberField(`m${i}_source`, "Measured battery voltage", "V")));
  [3, 4].forEach((i) => {
    evidenceParts[i].push(numberField(`m${i}_resistance`, "Total resistance (calculate measured V ÷ total I)", "Ω"));
    evidenceParts[i].push(choiceField(`m${i}_brightness`, "Each bulb compared with the original single bulb", ["Brighter", "Same brightness", "Dimmer"]));
    evidenceParts[i].push(textField(`m${i}_failure`, "Disconnect each bulb in turn: what happens to the other?"));
  });
  evidenceParts[7].unshift(numberField("p8_source", "Measured battery voltage", "V"), textField("p8_layout", "Describe your wiring and switch locations"));
  evidenceParts[7].push(
    choiceField("p8_disconnect_bulb2", "Disconnect Bulb 2 · other bulbs", ["Stay lit", "Turn off", "Only one stays lit"]),
    choiceField("p8_disconnect_bulb3", "Disconnect Bulb 3 · other bulbs", ["Stay lit", "Turn off", "Only one stays lit"]),
    choiceField("p8_branches", "Does your circuit have multiple branches?", ["Yes", "No"]),
    choiceField("p8_independent", "Can at least one bulb switch off without changing the others?", ["Yes", "No"]),
    choiceField("p8_no_short", "Did you trace every path and rule out a wire-only short?", ["Yes", "No"])
  );
  evidenceParts[7].find(f => f.key === "p8_disconnect_bulb1").options.push("Only one stays lit");
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"})[c]);
  const emptyState = () => ({ mission:0, evidence:{}, predictions:{}, observations:{}, image:"" });
  const validImage = value => typeof value === "string" && value.length <= 1500000 && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value);
  let state = emptyState();
  let storageAvailable = true;
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && typeof saved === "object") {
      if (Number.isInteger(saved.mission)) state.mission = Math.max(0, Math.min(7, saved.mission));
      for (const key of ["evidence", "predictions", "observations"]) {
        if (saved[key] && typeof saved[key] === "object" && !Array.isArray(saved[key])) {
          for (const [name, value] of Object.entries(saved[key])) if (typeof value === "string") state[key][name] = value.slice(0, 1500);
        }
      }
      if (validImage(saved.image)) state.image = saved.image;
    }
  } catch { storageAvailable = false; }

  function storageMessage() {
    $("#saveStatus").textContent = storageAvailable
      ? "Notebook saved in this browser. Keep your PhET tab open; its circuit is separate."
      : "Your latest changes could not be saved in this browser. Keep this tab open and download or print your report before leaving.";
  }
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); storageAvailable = true; }
    catch { storageAvailable = false; }
    storageMessage();
    updateProgress();
  }
  function fieldComplete(field) {
    const value = String(state.evidence[field.key] ?? "").trim();
    if (!value) return false;
    if (field.type === "number") return Number.isFinite(Number(value)) && Number(value) >= 0;
    if (field.type === "select") return field.options.includes(value);
    return true;
  }
  function missionComplete(index) { return evidenceParts[index].every(fieldComplete); }
  function updateProgress() {
    const count = missions.filter((_, i) => missionComplete(i)).length;
    const percent = Math.round(count / 8 * 100);
    $("#progressPercent").textContent = `${percent}%`;
    $("#progressFill").style.width = `${percent}%`;
    $(".progress-track").setAttribute("aria-valuenow", String(percent));
    $("#progressDetail").textContent = `${count} of 8 evidence tables complete`;
    $("#notebookCount").textContent = `${count}/8`;
    $$('[data-mission]').forEach(button => {
      const complete = missionComplete(Number(button.dataset.mission));
      button.classList.toggle("complete", complete);
      button.querySelector(".mission-complete").setAttribute("aria-label", complete ? "Evidence recorded" : "Evidence not recorded");
    });
    const recorded = evidenceParts[state.mission].filter(fieldComplete).length;
    $("#missionStatus").textContent = `${recorded} of ${evidenceParts[state.mission].length} entries recorded. Measurements are self-reported, not automatically verified.`;
  }
  function evidenceTable(index, editable = true, prefix = "bench") {
    return `<div class="data-table-wrap"><table class="data-table"><caption>Mission ${index + 1}: ${escapeHtml(missions[index].short)}</caption><thead><tr><th scope="col">Measurement or test</th><th scope="col">Your result</th><th scope="col">Unit</th></tr></thead><tbody>${evidenceParts[index].map(field => {
      const value = state.evidence[field.key] || "";
      const id = `${prefix}-${field.key}`;
      let input;
      if (!editable) input = escapeHtml(value || "Not recorded");
      else if (field.type === "select") input = `<select id="${id}" data-evidence="${field.key}"><option value="">Choose observed result…</option>${field.options.map(o => `<option${o === value ? " selected" : ""}>${escapeHtml(o)}</option>`).join("")}</select>`;
      else input = `<input id="${id}" data-evidence="${field.key}" type="${field.type === "number" ? "number" : "text"}" ${field.type === "number" ? 'min="0" step="any" inputmode="decimal"' : 'maxlength="800"'} value="${escapeHtml(value)}" placeholder="${field.type === "number" ? "Enter reading" : "Describe what you observed"}">`;
      return `<tr><th scope="row">${editable ? `<label for="${id}">${escapeHtml(field.label)}</label>` : escapeHtml(field.label)}</th><td>${input}</td><td>${field.unit || "—"}</td></tr>`;
    }).join("")}</tbody></table></div>`;
  }
  function bindEvidence(root) {
    root.querySelectorAll('[data-evidence]').forEach(input => input.addEventListener("input", () => {
      state.evidence[input.dataset.evidence] = input.value;
      input.setAttribute("aria-invalid", String(!input.validity.valid));
      save();
    }));
  }
  function renderBench() {
    const mission = missions[state.mission];
    $("#briefNumber").textContent = String(state.mission + 1).padStart(2, "0");
    $("#briefPart").textContent = `Mission ${state.mission + 1} · Hands-on investigation`;
    $("#briefTitle").textContent = mission.title;
    $("#briefText").textContent = "Predict, build in PhET, and explain what your measurements show.";
    $("#previousMission").disabled = state.mission === 0;
    $("#nextMission").disabled = state.mission === 7;
    $("#predictionLabel").textContent = mission.prediction;
    $("#prediction").value = state.predictions[state.mission] || "";
    $("#observation").value = state.observations[state.mission] || "";
    $("#buildSteps").innerHTML = mission.steps.map(step => `<li>${escapeHtml(step)}</li>`).join("");
    $("#missionEvidence").innerHTML = evidenceTable(state.mission);
    bindEvidence($("#missionEvidence"));
    $("#missionList").innerHTML = missions.map((m, i) => `<li><button type="button" class="mission-button ${i === state.mission ? "active" : ""}" data-mission="${i}" ${i === state.mission ? 'aria-current="step"' : ""}><span class="mission-number">${i + 1}</span><span class="mission-name">${escapeHtml(m.short)}</span><span class="mission-complete">✓</span></button></li>`).join("");
    $$('[data-mission]').forEach(button => button.addEventListener("click", () => setMission(Number(button.dataset.mission))));
    updateProgress();
  }
  function setMission(index) {
    state.mission = Math.max(0, Math.min(7, index));
    save(); renderBench();
    $("#briefTitle").setAttribute("tabindex", "-1");
    $("#briefTitle").focus();
  }
  function renderNotebook() {
    $("#notebookNav").innerHTML = missions.map((m,i) => `<button type="button" data-part="${i}">${i+1}. ${escapeHtml(m.short)}</button>`).join("");
    $("#notebookParts").innerHTML = missions.map((m,i) => `<details class="lab-part" id="part${i}" ${i === state.mission ? "open" : ""}><summary>${i+1}. ${escapeHtml(m.title)}</summary><div class="part-content"><p><strong>Prediction:</strong> ${escapeHtml(state.predictions[i] || "Not recorded")}</p>${evidenceTable(i,true,"notebook")}<p><strong>Explanation / repairs:</strong> ${escapeHtml(state.observations[i] || "Not recorded")}</p><button type="button" class="button button-secondary" data-build="${i}">Return to this challenge</button></div></details>`).join("");
    bindEvidence($("#notebookParts"));
    $$('[data-part]').forEach(button => button.addEventListener("click", () => {
      const panel = $(`#part${button.dataset.part}`); panel.open = true; panel.scrollIntoView({block:"start"}); panel.querySelector("summary").focus();
    }));
    $$('[data-build]').forEach(button => button.addEventListener("click", () => { state.mission = Number(button.dataset.build); save(); showView("bench"); }));
  }
  function reviewNotes() {
    const notes = [];
    const missing = missions.map((_,i) => i).filter(i => !missionComplete(i));
    if (missing.length) notes.push(`Finish evidence for missions ${missing.map(i => i+1).join(", ")}.`);
    const e = state.evidence;
    if (e.p4_battery_voltage && e.p5_battery_voltage && Math.abs(Number(e.p4_battery_voltage)-Number(e.p5_battery_voltage)) > .1) notes.push("Your series and parallel source voltages differ. Repeat at the same voltage for a fair comparison.");
    if (["p8_disconnect_bulb1","p8_disconnect_bulb2","p8_disconnect_bulb3"].some(k => e[k] && e[k] !== "Stay lit")) notes.push("A bulb-failure test did not keep both other rooms lit. Revise and retest.");
    if (["p8_branches","p8_independent","p8_no_short"].some(k => e[k] === "No")) notes.push("Your final design has an unmet requirement. Revisit the branches, switches, and short-circuit check.");
    const source = Number(e.p8_source);
    if (source > 0 && ["p8_bulb1_voltage","p8_bulb2_voltage","p8_bulb3_voltage"].some(k => e[k] && Math.abs(Number(e[k])-source) > Math.max(.1,source*.05))) notes.push("A recorded bulb voltage differs from the source by more than about 5%. Inspect your wiring and repeat the measurement.");
    return notes.length ? notes : ["All eight evidence tables are filled. Review your readings and explanations, then complete the Buzz assessment. This is a completeness check, not a grade or verification of your circuit."];
  }
  function renderReport() {
    $("#readiness").textContent = reviewNotes().join(" ");
    $("#reportEvidence").innerHTML = missions.map((m,i) => `<section><h4>${i+1}. ${escapeHtml(m.title)}</h4><p><strong>Prediction:</strong> ${escapeHtml(state.predictions[i] || "Not recorded")}</p>${evidenceTable(i,false)}<p><strong>Explanation / repairs:</strong> ${escapeHtml(state.observations[i] || "Not recorded")}</p></section>`).join("");
    $("#circuitPreview").hidden = !state.image;
    if (state.image) $("#circuitPreview").src = state.image;
    else $("#circuitPreview").removeAttribute("src");
    $("#removeImage").hidden = !state.image;
  }
  function showView(view) {
    if (view === "bench") renderBench();
    if (view === "notebook") renderNotebook();
    if (view === "report") renderReport();
    $$('[data-view-panel]').forEach(panel => { panel.hidden = panel.dataset.viewPanel !== view; panel.classList.toggle("active", !panel.hidden); });
    $$('[data-view]').forEach(button => { const active = button.dataset.view === view; button.classList.toggle("active", active); button.setAttribute("aria-pressed", String(active)); button.removeAttribute("aria-selected"); });
    const heading = $(`#${view}View h2`); heading.setAttribute("tabindex", "-1"); heading.focus();
  }
  function reportText() {
    return ["CIRCUIT DESIGN CHALLENGE — PHET EVIDENCE NOTEBOOK", "Student-entered evidence; not automatically verified or submitted to Buzz.", PHET_URL, "", ...reviewNotes(), ...missions.flatMap((m,i) => ["", `${i+1}. ${m.title}`, `Prediction: ${state.predictions[i] || "Not recorded"}`, ...evidenceParts[i].map(f => `${f.label}: ${state.evidence[f.key] || "Not recorded"}${f.unit ? " " + f.unit : ""}`), `Explanation / repairs: ${state.observations[i] || "Not recorded"}`]), "", "Screenshots are included in printing only, not this text file."].join("\r\n");
  }
  $$('[data-view]').forEach(button => button.addEventListener("click", () => showView(button.dataset.view)));
  $("#previousMission").addEventListener("click", () => setMission(state.mission-1));
  $("#nextMission").addEventListener("click", () => setMission(state.mission+1));
  $("#openNotebook").addEventListener("click", () => showView("notebook"));
  $("#returnToBench").addEventListener("click", () => showView("bench"));
  $("#prediction").addEventListener("input", e => { state.predictions[state.mission] = e.target.value; save(); });
  $("#observation").addEventListener("input", e => { state.observations[state.mission] = e.target.value; save(); });
  $("#printReport").addEventListener("click", () => { renderReport(); window.print(); });
  window.addEventListener("beforeprint", renderReport);
  $("#downloadReport").addEventListener("click", () => {
    const url = URL.createObjectURL(new Blob([reportText()], {type:"text/plain;charset=utf-8"}));
    const link = document.createElement("a"); link.href = url; link.download = "circuit-phet-evidence.txt"; document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  let imageVersion = 0;
  $("#circuitImage").addEventListener("change", async event => {
    const version = ++imageVersion;
    const file = event.target.files[0]; if (!file) return;
    if (!["image/png","image/jpeg","image/webp"].includes(file.type) || file.size > 1024*1024) {
      $("#saveStatus").textContent = "Choose a PNG, JPEG, or WebP screenshot no larger than 1 MB."; event.target.value = ""; return;
    }
    try {
      const data = await new Promise((resolve,reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); });
      const decoded = new Image(); decoded.src = data; await decoded.decode();
      if (version !== imageVersion) return;
      if (!validImage(data)) throw new Error("Invalid image");
      state.image = data; save(); renderReport();
    } catch { $("#saveStatus").textContent = "This screenshot could not be read. Choose a valid image file."; }
  });
  $("#removeImage").addEventListener("click", () => { imageVersion++; state.image = ""; $("#circuitImage").value = ""; save(); renderReport(); });
  $("#resetLab").addEventListener("click", () => {
    if (!confirm("Clear this PhET evidence notebook, including its screenshot? This will not reset your separate PhET circuit.")) return;
    imageVersion++; state = emptyState(); $("#circuitImage").value = ""; save(); showView("bench");
  });
  renderBench(); storageMessage();
})();
