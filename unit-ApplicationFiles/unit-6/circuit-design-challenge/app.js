(() => {
  "use strict";

  const STORAGE_KEY = "u6l3-circuit-design-challenge-v1";
  const BULB_RESISTANCE = 10;

  const missions = [
    {
      part: "Part 1 · Build your first circuit",
      title: "Light one bulb",
      short: "First circuit",
      text: "Create one complete path from one battery terminal, through the bulb, and back to the other terminal.",
      prompt: "Confirm that the bulb is lit, then open the circuit once to compare.",
      topology: "one",
      bulbs: 1
    },
    {
      part: "Part 2 · Measure your circuit",
      title: "Trace the current",
      short: "Ammeter",
      text: "Move the ammeter around the single loop. Compare the current before the bulb, after the bulb, and near the battery.",
      prompt: "Record three current readings. A one-loop circuit should reveal a clear pattern.",
      topology: "one",
      bulbs: 1
    },
    {
      part: "Part 2 · Measure your circuit",
      title: "Map the voltage",
      short: "Voltmeter",
      text: "Measure potential difference across the battery, the bulb, and a section of ideal wire.",
      prompt: "Compare where the circuit gains voltage with where it transfers electrical energy.",
      topology: "one",
      bulbs: 1
    },
    {
      part: "Part 3 · Two-bulb series circuit",
      title: "Build one path",
      short: "Series circuit",
      text: "Place two identical bulbs in one loop, then disconnect either bulb to test the whole path.",
      prompt: "Compare current, voltage division, brightness, and the effect of one failed bulb.",
      topology: "series",
      bulbs: 2
    },
    {
      part: "Part 4 · Two-bulb parallel circuit",
      title: "Build two branches",
      short: "Parallel circuit",
      text: "Give each identical bulb its own branch between the same two battery terminals.",
      prompt: "Measure the branch voltages and currents, then compare their sum with battery current.",
      topology: "parallel",
      bulbs: 2
    },
    {
      part: "Part 5 · Circuit failure challenge",
      title: "Design for reliability",
      short: "Failure test",
      text: "Choose a series or parallel design, then test whether one room stays lit when the other bulb fails.",
      prompt: "A successful design keeps both bulbs at full voltage and isolates a single-bulb failure.",
      topology: "choice-two",
      bulbs: 2
    },
    {
      part: "Part 6 · Add control",
      title: "Control each room",
      short: "Independent switches",
      text: "Place a switch in each bulb branch so either room can be controlled without changing the other.",
      prompt: "Run all four switch combinations and record whether the observed bulb states match the commands.",
      topology: "parallel",
      bulbs: 2,
      switches: true
    },
    {
      part: "Part 7 · Final circuit design challenge",
      title: "Wire three rooms",
      short: "Final design",
      text: "Choose a three-bulb arrangement with multiple branches and at least two switches, then prove it meets every requirement.",
      prompt: "Use voltage, current, switch, and failure evidence to defend your final design.",
      topology: "choice-three",
      bulbs: 3,
      switches: true
    }
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

  const questions = [
    [1, "What must be true about the path from one side of the battery to the other for current to flow?"],
    [1, "Disconnect one wire. What happens to the bulb?"],
    [1, "Explain the difference between an open circuit and a closed circuit."],
    [2, "How does current compare at different locations in this one-loop circuit?"],
    [2, "What does your evidence suggest happens to current as it travels through a series circuit?"],
    [3, "Where did you measure the largest voltage difference?"],
    [3, "How does the voltage across the bulb compare with the voltage supplied by the battery?"],
    [4, "How does the brightness of each bulb compare with the original one-bulb circuit?"],
    [4, "How is the battery's voltage divided between the two bulbs?"],
    [4, "Disconnect Bulb 1. What happens to Bulb 2?"],
    [4, "Why does this happen?"],
    [5, "How does the voltage across each bulb compare with the battery voltage?"],
    [5, "What happens to current when it reaches the junction?"],
    [5, "How does the current in the two branches relate to the total current leaving the battery?"],
    [5, "Disconnect Bulb 1. What happens to Bulb 2?"],
    [5, "Why is this different from the series circuit?"],
    [6, "Did the second bulb remain lit?"],
    [6, "Is your final circuit series or parallel?"],
    [6, "Explain why your circuit satisfies the four design requirements."],
    [7, "Where did you have to place each switch?"],
    [7, "Why would one switch placed before the branches control both bulbs instead?"],
    [8, "Why did you choose a series, parallel, or combination circuit?"],
    [8, "Use your voltage measurements to explain why your bulbs have their observed brightness."],
    [8, "Use your current measurements to explain what happens to current at a junction."],
    [8, "Why are household electrical circuits generally designed with parallel branches instead of putting every device in one series loop?"],
    [8, "Draw a simple schematic of your final circuit. The workbench and report preserve your selected layout; use this space for labels or notes."],
    [8, "In 3–4 sentences, explain how current, voltage, resistance, and circuit arrangement work together to determine the behavior of your circuit."]
  ];

  const partDirections = [
    "Build one battery–bulb loop. Test both a complete path and a disconnected path.",
    "Place the ammeter at three positions in the same loop. An ammeter belongs in series with the path.",
    "Place the voltmeter across each target. A voltmeter compares two points and belongs in parallel with the target.",
    "Add an identical bulb without creating a branch. Test what happens when either bulb is removed.",
    "Reconnect the two bulbs on separate branches. Compare branch current with total current.",
    "Choose a design for two room lights, then run a one-bulb failure test.",
    "Put a switch inside each bulb branch and test all four ON/OFF combinations.",
    "Choose and prove a three-room design. Your selected workbench layout becomes the schematic in the design report."
  ];

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  function freshMissionState(index) {
    const bulbCount = missions[index].bulbs;
    return {
      connected: Array(bulbCount).fill(true),
      switches: Array(bulbCount).fill(true),
      topology: index === 5 ? "series" : index === 7 ? "combination" : missions[index].topology
    };
  }

  function defaultState() {
    return {
      mission: 0,
      voltage: 9,
      meter: "ammeter",
      meterLocation: "battery",
      missionStates: missions.map((_, index) => freshMissionState(index)),
      evidence: {},
      answers: {},
      submittedAt: ""
    };
  }

  function loadState() {
    const base = defaultState();
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!saved || typeof saved !== "object") return base;
      base.mission = Number.isInteger(saved.mission) ? Math.min(7, Math.max(0, saved.mission)) : 0;
      base.voltage = Number(saved.voltage) || 9;
      base.meter = saved.meter === "voltmeter" ? "voltmeter" : "ammeter";
      base.meterLocation = saved.meterLocation || "battery";
      base.evidence = saved.evidence && typeof saved.evidence === "object" ? saved.evidence : {};
      base.answers = saved.answers && typeof saved.answers === "object" ? saved.answers : {};
      base.submittedAt = saved.submittedAt || "";
      if (Array.isArray(saved.missionStates)) {
        base.missionStates = base.missionStates.map((fallback, index) => {
          const candidate = saved.missionStates[index] || {};
          return {
            topology: ["one", "series", "parallel", "combination"].includes(candidate.topology) ? candidate.topology : fallback.topology,
            connected: fallback.connected.map((value, bulb) => candidate.connected?.[bulb] !== false),
            switches: fallback.switches.map((value, bulb) => candidate.switches?.[bulb] !== false)
          };
        });
      }
      return base;
    } catch (error) {
      return base;
    }
  }

  let state = loadState();
  let toastTimer = 0;

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      // The app remains usable when storage is unavailable.
    }
    updateProgress();
  }

  function format(value, digits = 2) {
    if (!Number.isFinite(value)) return "∞";
    return Number(value).toFixed(digits);
  }

  function topologyFor(index = state.mission) {
    const mission = missions[index];
    if (mission.topology === "choice-two" || mission.topology === "choice-three") {
      return state.missionStates[index].topology;
    }
    return mission.topology;
  }

  function calculate(index = state.mission, overrides = {}) {
    const mission = missions[index];
    const topology = overrides.topology || topologyFor(index);
    const source = state.missionStates[index];
    const connected = overrides.connected || [...source.connected];
    const switches = overrides.switches || [...source.switches];
    const voltage = Number(overrides.voltage ?? state.voltage);
    const bulbCount = mission.bulbs;
    let currents = Array(bulbCount).fill(0);
    let voltages = Array(bulbCount).fill(0);
    let powers = Array(bulbCount).fill(0);
    let totalCurrent = 0;
    let equivalentResistance = Infinity;

    if (topology === "one" || topology === "series") {
      const closed = connected.every(Boolean) && (!mission.switches || switches.every(Boolean));
      if (closed) {
        equivalentResistance = BULB_RESISTANCE * bulbCount;
        totalCurrent = voltage / equivalentResistance;
        currents = currents.map(() => totalCurrent);
        voltages = voltages.map(() => voltage / bulbCount);
        powers = voltages.map((drop) => (drop * drop) / BULB_RESISTANCE);
      }
    } else if (topology === "parallel") {
      const active = connected.map((isConnected, bulb) => isConnected && (!mission.switches || switches[bulb]));
      currents = active.map((isActive) => isActive ? voltage / BULB_RESISTANCE : 0);
      voltages = active.map((isActive) => isActive ? voltage : 0);
      powers = active.map((isActive) => isActive ? (voltage * voltage) / BULB_RESISTANCE : 0);
      totalCurrent = currents.reduce((sum, value) => sum + value, 0);
      const activeCount = active.filter(Boolean).length;
      equivalentResistance = activeCount ? BULB_RESISTANCE / activeCount : Infinity;
    } else if (topology === "combination") {
      const branchOne = connected[0] && switches[0];
      const branchTwo = connected[1] && connected[2] && switches[1];
      if (branchOne) {
        currents[0] = voltage / BULB_RESISTANCE;
        voltages[0] = voltage;
        powers[0] = (voltage * voltage) / BULB_RESISTANCE;
      }
      if (branchTwo) {
        currents[1] = voltage / (BULB_RESISTANCE * 2);
        currents[2] = currents[1];
        voltages[1] = voltage / 2;
        voltages[2] = voltage / 2;
        powers[1] = (voltages[1] * voltages[1]) / BULB_RESISTANCE;
        powers[2] = powers[1];
      }
      totalCurrent = currents[0] + currents[1];
      const reciprocal = (branchOne ? 1 / BULB_RESISTANCE : 0) + (branchTwo ? 1 / (BULB_RESISTANCE * 2) : 0);
      equivalentResistance = reciprocal ? 1 / reciprocal : Infinity;
    }

    const fullPower = (voltage * voltage) / BULB_RESISTANCE;
    const brightness = powers.map((power) => fullPower ? power / fullPower : 0);
    return {
      topology,
      voltage,
      connected,
      switches,
      currents,
      voltages,
      powers,
      brightness,
      totalCurrent,
      equivalentResistance,
      activeBulbs: brightness.filter((value) => value > 0.001).length,
      closed: totalCurrent > 0
    };
  }

  function topologyLabel(topology) {
    return ({ one: "Single loop", series: "Series", parallel: "Parallel", combination: "Combination" })[topology] || topology;
  }

  function brightnessLabel(value) {
    if (value >= 0.85) return "normal brightness";
    if (value >= 0.2) return "dim";
    if (value > 0) return "very dim";
    return "off";
  }

  function finalRequirements(topology = topologyFor(7)) {
    return [
      { label: "All three bulbs can light", pass: true },
      { label: "At least one bulb can switch off independently", pass: topology === "parallel" || topology === "combination" },
      { label: "Any one bulb can fail without turning off the others", pass: topology === "parallel" },
      { label: "Every bulb receives approximately full battery voltage", pass: topology === "parallel" },
      { label: "The circuit uses multiple branches", pass: topology === "parallel" || topology === "combination" },
      { label: "No wire-only short-circuit path", pass: true }
    ];
  }

  function twoRoomRequirements(topology = topologyFor(5)) {
    return [
      { label: "Both lights operate normally", pass: topology === "parallel" },
      { label: "Each light receives full battery voltage", pass: topology === "parallel" },
      { label: "One bulb can fail while the other stays on", pass: topology === "parallel" },
      { label: "Each bulb has a complete path to the battery", pass: topology === "parallel" }
    ];
  }

  function renderMissionList() {
    const root = $("#missionList");
    root.innerHTML = missions.map((mission, index) => {
      const complete = missionComplete(index);
      return `<li><button class="mission-button ${index === state.mission ? "active" : ""} ${complete ? "complete" : ""}" type="button" data-mission="${index}" ${index === state.mission ? 'aria-current="step"' : ""}><span class="mission-number">${String(index + 1).padStart(2, "0")}</span><span class="mission-name">${mission.short}</span><span class="mission-complete" aria-label="${complete ? "Evidence recorded" : "Evidence not recorded"}">✓</span></button></li>`;
    }).join("");
    $$('[data-mission]', root).forEach((button) => {
      button.addEventListener("click", () => setMission(Number(button.dataset.mission)));
    });
  }

  function setMission(index) {
    state.mission = Math.min(7, Math.max(0, index));
    const mission = missions[state.mission];
    if (state.mission === 2) state.meter = "voltmeter";
    if (state.mission === 1) state.meter = "ammeter";
    state.meterLocation = state.meter === "ammeter" ? "battery" : "battery-voltage";
    saveState();
    renderBench();
    window.scrollTo({ top: 0, behavior: "smooth" });
    $("#briefTitle").focus?.({ preventScroll: true });
  }

  function renderBench() {
    const mission = missions[state.mission];
    $("#briefNumber").textContent = String(state.mission + 1).padStart(2, "0");
    $("#briefPart").textContent = mission.part;
    $("#briefTitle").textContent = mission.title;
    $("#briefText").textContent = mission.text;
    $("#evidencePrompt").textContent = mission.prompt;
    $("#previousMission").disabled = state.mission === 0;
    $("#nextMission").disabled = state.mission === 7;
    $("#batteryVoltage").value = String(state.voltage);
    $("#batteryOutput").textContent = `${state.voltage} V`;
    renderMissionList();
    renderTopologyControls();
    renderComponentControls();
    renderMeterControls();
    renderCircuitMetrics();
    renderMissionEvidence();
  }

  function renderTopologyControls() {
    const mission = missions[state.mission];
    let options;
    if (mission.topology === "choice-two") options = [["series", "Series"], ["parallel", "Parallel"]];
    else if (mission.topology === "choice-three") options = [["series", "Series"], ["parallel", "Parallel"], ["combination", "Combination"]];
    else options = [[mission.topology, topologyLabel(mission.topology)]];
    const chosen = topologyFor();
    $("#topologyOptions").innerHTML = options.map(([value, label]) => `<label class="segment-label"><input type="radio" name="topology" value="${value}" ${value === chosen ? "checked" : ""} ${options.length === 1 ? "disabled" : ""}><span>${label}</span></label>`).join("");
    $$('input[name="topology"]').forEach((input) => {
      input.addEventListener("change", () => {
        state.missionStates[state.mission].topology = input.value;
        state.missionStates[state.mission].connected.fill(true);
        state.missionStates[state.mission].switches.fill(true);
        saveState();
        renderBench();
        renderReport();
        showToast(`${topologyLabel(input.value)} arrangement selected. Test it against the requirements.`);
      });
    });
  }

  function switchIndexForBulb(index) {
    if (state.mission === 7 && topologyFor() === "combination") return index === 0 ? 0 : 1;
    return index;
  }

  function renderComponentControls() {
    const mission = missions[state.mission];
    const missionState = state.missionStates[state.mission];
    const topology = topologyFor();
    $("#componentControls").innerHTML = missionState.connected.map((connected, index) => {
      const switchIndex = switchIndexForBulb(index);
      const showSwitch = mission.switches && !(topology === "combination" && index === 2);
      const switchName = topology === "combination" && index === 1 ? "Switch 2 · bulbs 2 + 3" : `Switch ${switchIndex + 1}`;
      const switchButton = showSwitch ? `<button class="mini-switch ${missionState.switches[switchIndex] ? "" : "off"}" type="button" data-switch="${switchIndex}" aria-pressed="${missionState.switches[switchIndex]}">${switchName}: ${missionState.switches[switchIndex] ? "closed" : "open"}</button>` : `<span></span>`;
      return `<div class="component-row"><strong>Bulb ${index + 1} · ${BULB_RESISTANCE} Ω</strong>${switchButton}<button class="disconnect-button ${connected ? "" : "disconnected"}" type="button" data-bulb="${index}" aria-pressed="${!connected}">${connected ? "Disconnect" : "Reconnect"}</button></div>`;
    }).join("");
    $$('[data-switch]').forEach((button) => {
      button.addEventListener("click", () => {
        const index = Number(button.dataset.switch);
        missionState.switches[index] = !missionState.switches[index];
        saveState();
        renderBench();
      });
    });
    $$('[data-bulb]').forEach((button) => {
      button.addEventListener("click", () => {
        const index = Number(button.dataset.bulb);
        missionState.connected[index] = !missionState.connected[index];
        saveState();
        renderBench();
      });
    });
  }

  function meterOptions() {
    const count = missions[state.mission].bulbs;
    if (state.meter === "ammeter") {
      const options = [["battery", "Total current near battery"]];
      if (topologyFor() === "one" || topologyFor() === "series") {
        options.push(["before", "Current before first bulb"], ["after", "Current after last bulb"]);
      } else {
        for (let index = 0; index < count; index += 1) options.push([`branch-${index}`, `Current in Bulb ${index + 1} branch`]);
      }
      return options;
    }
    const options = [["battery-voltage", "Voltage across battery"]];
    for (let index = 0; index < count; index += 1) options.push([`bulb-${index}`, `Voltage across Bulb ${index + 1}`]);
    options.push(["wire", "Voltage across ideal wire"]);
    return options;
  }

  function renderMeterControls() {
    $$('.meter-button').forEach((button) => {
      const active = button.dataset.meter === state.meter;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    const options = meterOptions();
    if (!options.some(([value]) => value === state.meterLocation)) state.meterLocation = options[0][0];
    $("#meterLocation").innerHTML = options.map(([value, label]) => `<option value="${value}" ${value === state.meterLocation ? "selected" : ""}>${label}</option>`).join("");
    updateMeterReadout();
  }

  function getMeterValue() {
    const result = calculate();
    if (state.meter === "ammeter") {
      if (state.meterLocation.startsWith("branch-")) {
        const index = Number(state.meterLocation.split("-")[1]);
        return { value: result.currents[index] || 0, unit: "A" };
      }
      return { value: result.totalCurrent, unit: "A" };
    }
    if (state.meterLocation === "battery-voltage") return { value: result.voltage, unit: "V" };
    if (state.meterLocation === "wire") return { value: 0, unit: "V" };
    const index = Number(state.meterLocation.split("-")[1]);
    return { value: result.voltages[index] || 0, unit: "V" };
  }

  function updateMeterReadout() {
    const selected = $("#meterLocation");
    const reading = getMeterValue();
    $("#meterLabel").textContent = selected.options[selected.selectedIndex]?.textContent || "Meter reading";
    $("#meterReading").textContent = `${format(reading.value)} ${reading.unit}`;
  }

  function renderCircuitMetrics() {
    const result = calculate();
    $("#batteryMetric").textContent = `${format(result.voltage, 1)} V`;
    $("#resistanceMetric").textContent = Number.isFinite(result.equivalentResistance) ? `${format(result.equivalentResistance, 1)} Ω` : "Open";
    $("#currentMetric").textContent = `${format(result.totalCurrent)} A`;
    $("#bulbsMetric").textContent = `${result.activeBulbs} of ${missions[state.mission].bulbs}`;
    const status = $("#circuitStatus");
    status.classList.toggle("open", !result.closed);
    $("strong", status).textContent = result.closed ? "Current flowing" : "Open circuit";
    const descriptions = result.brightness.map((brightness, index) => `Bulb ${index + 1} ${brightnessLabel(brightness)}`);
    $("#canvasReadout").textContent = `${topologyLabel(result.topology)} · ${descriptions.join(" · ")}`;
    const canvas = $("#circuitCanvas");
    canvas.setAttribute("aria-label", `${topologyLabel(result.topology)} circuit with ${missions[state.mission].bulbs} bulbs. ${descriptions.join(". ")}. Total current ${format(result.totalCurrent)} amperes.`);
    drawCircuit(canvas, result, true);
  }

  function drawCircuit(canvas, result, showMeter) {
    const context = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    context.clearRect(0, 0, width, height);
    context.lineCap = "round";
    context.lineJoin = "round";

    const colors = {
      wire: "#a9bec8",
      wireHot: "#62d6bd",
      label: "#d9e7eb",
      muted: "#86a0ad",
      bulbOff: "#324d5d",
      bulbOn: "#ffc94a",
      orange: "#ed6d37",
      dark: "#102a39"
    };

    function line(points, hot = false, dashed = false) {
      context.save();
      context.beginPath();
      context.strokeStyle = hot ? colors.wireHot : colors.wire;
      context.lineWidth = hot ? 7 : 6;
      context.setLineDash(dashed ? [10, 10] : []);
      points.forEach(([x, y], index) => index ? context.lineTo(x, y) : context.moveTo(x, y));
      context.stroke();
      context.restore();
    }

    function text(value, x, y, size = 17, align = "center", color = colors.label, weight = 700) {
      context.save();
      context.fillStyle = color;
      context.font = `${weight} ${size}px Inter, Arial, sans-serif`;
      context.textAlign = align;
      context.textBaseline = "middle";
      context.fillText(value, x, y);
      context.restore();
    }

    function battery(x, centerY) {
      line([[x, 88], [x, centerY - 47]], result.closed);
      line([[x, centerY + 47], [x, height - 92]], result.closed);
      context.save();
      context.strokeStyle = "#f3f7f7";
      context.lineWidth = 8;
      context.beginPath();
      context.moveTo(x - 34, centerY - 34);
      context.lineTo(x + 34, centerY - 34);
      context.stroke();
      context.lineWidth = 4;
      context.beginPath();
      context.moveTo(x - 20, centerY + 34);
      context.lineTo(x + 20, centerY + 34);
      context.stroke();
      context.restore();
      text("+", x + 50, centerY - 34, 22, "left", "#ffad8b", 900);
      text("−", x + 50, centerY + 34, 22, "left", colors.label, 900);
      text(`${result.voltage} V`, x - 50, centerY, 17, "center", colors.label, 900);
      text("BATTERY", x - 50, centerY + 23, 11, "center", colors.muted, 800);
    }

    function bulb(x, y, index) {
      const brightness = result.brightness[index] || 0;
      const active = brightness > 0;
      context.save();
      if (active) {
        context.shadowColor = `rgba(255, 201, 74, ${Math.min(0.75, 0.25 + brightness * 0.5)})`;
        context.shadowBlur = 28 + brightness * 25;
      }
      context.fillStyle = active ? colors.bulbOn : colors.bulbOff;
      context.strokeStyle = active ? "#fff1ad" : "#718995";
      context.lineWidth = 5;
      context.beginPath();
      context.arc(x, y, 36, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      context.restore();
      context.save();
      context.strokeStyle = active ? "#7f5813" : "#9cb0b8";
      context.lineWidth = 3;
      context.beginPath();
      context.moveTo(x - 17, y + 4);
      context.lineTo(x - 7, y - 10);
      context.lineTo(x + 7, y + 10);
      context.lineTo(x + 17, y - 4);
      context.stroke();
      context.restore();
      if (!result.connected[index]) {
        context.save();
        context.strokeStyle = "#ff8c72";
        context.lineWidth = 5;
        context.beginPath();
        context.moveTo(x - 23, y - 23);
        context.lineTo(x + 23, y + 23);
        context.moveTo(x + 23, y - 23);
        context.lineTo(x - 23, y + 23);
        context.stroke();
        context.restore();
      }
      text(`B${index + 1}`, x, y + 60, 14, "center", colors.label, 900);
      text(`${format(result.voltages[index], 1)} V`, x, y + 79, 12, "center", colors.muted, 700);
    }

    function circuitSwitch(x, y, closed, label, vertical = true) {
      context.save();
      context.fillStyle = colors.dark;
      if (vertical) context.fillRect(x - 22, y - 28, 44, 56);
      else context.fillRect(x - 28, y - 22, 56, 44);
      context.strokeStyle = closed ? colors.wireHot : "#ff8c72";
      context.fillStyle = closed ? colors.wireHot : "#ff8c72";
      context.lineWidth = 6;
      if (vertical) {
        context.beginPath();
        context.arc(x, y - 15, 5, 0, Math.PI * 2);
        context.arc(x, y + 15, 5, 0, Math.PI * 2);
        context.fill();
        context.beginPath();
        context.moveTo(x, y - 15);
        context.lineTo(closed ? x : x + 25, closed ? y + 15 : y + 2);
        context.stroke();
      } else {
        context.beginPath();
        context.arc(x - 15, y, 5, 0, Math.PI * 2);
        context.arc(x + 15, y, 5, 0, Math.PI * 2);
        context.fill();
        context.beginPath();
        context.moveTo(x - 15, y);
        context.lineTo(closed ? x + 15 : x + 4, closed ? y : y - 24);
        context.stroke();
      }
      context.restore();
      text(label, x + (vertical ? 28 : 0), y + (vertical ? 1 : -28), 12, vertical ? "left" : "center", colors.muted, 800);
    }

    function arrow(x, y, direction = 1) {
      context.save();
      context.fillStyle = colors.orange;
      context.beginPath();
      if (direction > 0) {
        context.moveTo(x - 8, y - 6); context.lineTo(x + 8, y); context.lineTo(x - 8, y + 6);
      } else {
        context.moveTo(x + 8, y - 6); context.lineTo(x - 8, y); context.lineTo(x + 8, y + 6);
      }
      context.closePath();
      context.fill();
      context.restore();
    }

    function meter(x, y) {
      const value = getMeterValue();
      context.save();
      context.fillStyle = "#f6f2e8";
      context.strokeStyle = colors.orange;
      context.lineWidth = 5;
      context.beginPath();
      context.arc(x, y, 45, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      context.restore();
      text(state.meter === "ammeter" ? "A" : "V", x, y - 11, 22, "center", colors.dark, 950);
      text(`${format(value.value)} ${value.unit}`, x, y + 15, 12, "center", colors.dark, 900);
    }

    const left = 150;
    battery(left, height / 2);

    if (result.topology === "one" || result.topology === "series") {
      const top = 88;
      const bottom = height - 92;
      line([[left, 88], [width - 90, 88], [width - 90, bottom], [left, bottom]], result.closed);
      const positions = result.currents.length === 1 ? [width * 0.61] : result.currents.map((_, index) => width * (0.45 + index * 0.25));
      positions.forEach((x, index) => bulb(x, top, index));
      if (result.closed) {
        arrow(width * 0.34, 88, 1);
        arrow(width * 0.72, bottom, -1);
      }
      if (missions[state.mission].switches) circuitSwitch(width * 0.29, 88, result.switches[0], "S1", false);
    } else if (result.topology === "parallel") {
      const top = 88;
      const bottom = height - 92;
      const right = width - 85;
      line([[left, top], [right, top]], result.closed);
      line([[left, bottom], [right, bottom]], result.closed);
      const count = result.currents.length;
      const start = count === 2 ? width * 0.46 : width * 0.38;
      const spacing = count === 2 ? width * 0.3 : width * 0.23;
      result.currents.forEach((current, index) => {
        const x = start + index * spacing;
        const hot = current > 0;
        line([[x, top], [x, bottom]], hot);
        if (missions[state.mission].switches) circuitSwitch(x, 160, result.switches[index], `S${index + 1}`);
        bulb(x, 270, index);
        if (hot) arrow(x, 210, 1);
      });
      if (result.closed) {
        arrow(width * 0.29, top, 1);
        arrow(width * 0.29, bottom, -1);
      }
      text("JUNCTION", width * 0.27, top - 24, 11, "center", colors.muted, 800);
    } else {
      const top = 88;
      const bottom = height - 92;
      const right = width - 85;
      line([[left, top], [right, top]], result.closed);
      line([[left, bottom], [right, bottom]], result.closed);
      const branchOneX = width * 0.44;
      const branchTwoX = width * 0.72;
      line([[branchOneX, top], [branchOneX, bottom]], result.currents[0] > 0);
      line([[branchTwoX, top], [branchTwoX, bottom]], result.currents[1] > 0);
      circuitSwitch(branchOneX, 150, result.switches[0], "S1");
      circuitSwitch(branchTwoX, 150, result.switches[1], "S2");
      bulb(branchOneX, 270, 0);
      bulb(branchTwoX, 245, 1);
      bulb(branchTwoX, 345, 2);
      text("B2 + B3 SHARE A SERIES BRANCH", branchTwoX, bottom + 30, 11, "center", colors.muted, 800);
      if (result.closed) arrow(width * 0.27, top, 1);
    }

    if (showMeter) meter(width - 115, height - 62);
  }

  function liveEvidence() {
    const result = calculate();
    const cards = [];
    if (state.mission === 0) {
      cards.push(["Path", result.closed ? "Closed" : "Open"], ["Bulb", result.activeBulbs ? "Lit" : "Not lit"]);
    } else if (state.mission === 1) {
      cards.push(["Before bulb", `${format(result.totalCurrent)} A`], ["After bulb", `${format(result.totalCurrent)} A`], ["Near battery", `${format(result.totalCurrent)} A`]);
    } else if (state.mission === 2) {
      cards.push(["Across battery", `${format(result.voltage)} V`], ["Across bulb", `${format(result.voltages[0])} V`], ["Across wire", "0.00 V"]);
    } else if (state.mission === 3) {
      cards.push(["Circuit current", `${format(result.totalCurrent)} A`], ["Bulb 1", `${format(result.voltages[0])} V`], ["Bulb 2", `${format(result.voltages[1])} V`], ["Brightness", brightnessLabel(result.brightness[0])]);
    } else if (state.mission === 4) {
      cards.push(["Total current", `${format(result.totalCurrent)} A`], ["Branch 1", `${format(result.currents[0])} A`], ["Branch 2", `${format(result.currents[1])} A`], ["Each bulb", `${format(result.voltages[0])} V`]);
    } else if (state.mission === 5) {
      const failure = calculate(5, { connected: [false, true] });
      cards.push(["Arrangement", topologyLabel(result.topology)], ["Bulb 2 after B1 fails", failure.activeBulbs ? "Stays lit" : "Turns off"], ["Bulb voltage", `${format(result.voltages[0])} V`]);
    } else if (state.mission === 6) {
      cards.push(["Switch 1", result.switches[0] ? "Closed" : "Open"], ["Switch 2", result.switches[1] ? "Closed" : "Open"], ["Bulb 1", brightnessLabel(result.brightness[0])], ["Bulb 2", brightnessLabel(result.brightness[1])]);
    } else {
      cards.push(["Arrangement", topologyLabel(result.topology)], ["Total current", `${format(result.totalCurrent)} A`], ["Bulb voltages", result.voltages.map((value) => `${format(value, 1)} V`).join(" · ")], ["Active bulbs", `${result.activeBulbs} of 3`]);
    }
    return cards;
  }

  function renderMissionEvidence() {
    $("#missionEvidence").innerHTML = liveEvidence().map(([label, value]) => `<div class="reading-card"><span>${label}</span><strong>${value}</strong></div>`).join("");
    const requirements = state.mission === 5 ? twoRoomRequirements() : state.mission === 7 ? finalRequirements() : [];
    const root = $("#requirementChecks");
    root.hidden = !requirements.length;
    root.innerHTML = requirements.map((item) => `<div class="requirement-chip ${item.pass ? "pass" : ""}"><span class="check-mark"><span>${item.pass ? "✓" : "×"}</span></span><span>${item.label}</span></div>`).join("");
  }

  function recordMissionEvidence() {
    const index = state.mission;
    const result = calculate(index);
    const values = {};
    if (index === 0) {
      values.p1_path = result.closed ? "Closed" : "Open";
      values.p1_bulb = result.activeBulbs ? "Lit" : "Not lit";
    } else if (index === 1) {
      values.p2_current_before = format(result.totalCurrent);
      values.p2_current_after = format(result.totalCurrent);
      values.p2_current_battery = format(result.totalCurrent);
    } else if (index === 2) {
      values.p3_voltage_battery = format(result.voltage);
      values.p3_voltage_bulb = format(result.voltages[0]);
      values.p3_voltage_wire = "0.00";
    } else if (index === 3) {
      values.p4_battery_voltage = format(result.voltage);
      values.p4_circuit_current = format(result.totalCurrent);
      values.p4_bulb1_voltage = format(result.voltages[0]);
      values.p4_bulb2_voltage = format(result.voltages[1]);
    } else if (index === 4) {
      values.p5_battery_voltage = format(result.voltage);
      values.p5_total_current = format(result.totalCurrent);
      values.p5_bulb1_current = format(result.currents[0]);
      values.p5_bulb2_current = format(result.currents[1]);
      values.p5_bulb1_voltage = format(result.voltages[0]);
      values.p5_bulb2_voltage = format(result.voltages[1]);
    } else if (index === 5) {
      const failed = calculate(5, { connected: [false, true] });
      values.p6_second_bulb = failed.brightness[1] > 0 ? "Remained lit" : "Turned off";
      values.p6_arrangement = topologyLabel(result.topology);
      values.p6_requirements = twoRoomRequirements(result.topology).every((item) => item.pass) ? "Pass" : "Fail";
    } else if (index === 6) {
      values.p7_on_off = switchTest([true, false], [true, false]) ? "Pass" : "Fail";
      values.p7_off_on = switchTest([false, true], [false, true]) ? "Pass" : "Fail";
      values.p7_on_on = switchTest([true, true], [true, true]) ? "Pass" : "Fail";
      values.p7_off_off = switchTest([false, false], [false, false]) ? "Pass" : "Fail";
    } else {
      const healthy = calculate(7, { connected: [true, true, true], switches: [true, true, true] });
      const failure = calculate(7, { connected: [false, true, true], switches: [true, true, true] });
      const switchOne = calculate(7, { connected: [true, true, true], switches: [false, true, true] });
      const switchTwo = calculate(7, { connected: [true, true, true], switches: [true, false, true] });
      values.p8_bulb1_voltage = format(healthy.voltages[0]);
      values.p8_bulb2_voltage = format(healthy.voltages[1]);
      values.p8_bulb3_voltage = format(healthy.voltages[2]);
      values.p8_total_current = format(healthy.totalCurrent);
      values.p8_disconnect_bulb1 = failure.brightness.slice(1).every((value) => value > 0) ? "Stay lit" : "Turn off";
      values.p8_open_switch1 = describeBulbs(switchOne.brightness);
      values.p8_open_switch2 = describeBulbs(switchTwo.brightness);
    }
    Object.assign(state.evidence, values);
    saveState();
    renderMissionList();
    renderNotebook();
    renderReport();
    $("#recordStatus").textContent = `Mission ${index + 1} evidence recorded at ${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}.`;
    showToast(`Mission ${index + 1} evidence saved to the notebook.`);
  }

  function switchTest(switches, expectedOn) {
    const result = calculate(6, { connected: [true, true], switches });
    return expectedOn.every((shouldBeOn, index) => (result.brightness[index] > 0) === shouldBeOn);
  }

  function describeBulbs(brightness) {
    return brightness.map((value, index) => `B${index + 1} ${value > 0 ? "ON" : "OFF"}`).join(", ");
  }

  function missionComplete(index) {
    return evidenceParts[index].every((field) => String(state.evidence[field.key] ?? "").trim() !== "");
  }

  function answeredCount() {
    return questions.filter((_, index) => String(state.answers[index + 1] ?? "").trim()).length;
  }

  function updateProgress() {
    const missionCount = missions.filter((_, index) => missionComplete(index)).length;
    const answers = answeredCount();
    const totalItems = missions.length + questions.length;
    const percent = Math.round(((missionCount + answers) / totalItems) * 100);
    $("#progressPercent").textContent = `${percent}%`;
    $("#progressFill").style.width = `${percent}%`;
    $(".progress-track").setAttribute("aria-valuenow", String(percent));
    $("#progressDetail").textContent = `${missionCount} of 8 investigations · ${answers} of 27 responses`;
    $("#notebookCount").textContent = `${answers}/27`;
    renderMissionList();
  }

  function renderNotebook() {
    const nav = $("#notebookNav");
    const root = $("#notebookParts");
    nav.innerHTML = missions.map((mission, index) => {
      const partQuestions = questions.map((q, questionIndex) => ({ part: q[0], number: questionIndex + 1 })).filter((q) => q.part === index + 1);
      const complete = missionComplete(index) && partQuestions.every((q) => String(state.answers[q.number] || "").trim());
      return `<button type="button" data-notebook-part="${index}" class="${complete ? "complete" : ""}">${index + 1}. ${mission.short}</button>`;
    }).join("");

    root.innerHTML = missions.map((mission, index) => {
      const partQuestions = questions.map((q, questionIndex) => ({ part: q[0], text: q[1], number: questionIndex + 1 })).filter((q) => q.part === index + 1);
      return `<details class="lab-part" id="notebookPart${index + 1}" ${index === state.mission ? "open" : ""}>
        <summary><span class="part-number">${String(index + 1).padStart(2, "0")}</span><span>${mission.part}</span></summary>
        <div class="part-content">
          <div class="part-directions"><p>${partDirections[index]}</p><button class="small-link-button" type="button" data-go-bench="${index}">Open mission ${index + 1}</button></div>
          ${evidenceTable(index)}
          ${partQuestions.map((question) => questionHtml(question)).join("")}
        </div>
      </details>`;
    }).join("");

    $$('[data-notebook-part]', nav).forEach((button) => {
      button.addEventListener("click", () => {
        const detail = $(`#notebookPart${Number(button.dataset.notebookPart) + 1}`);
        detail.open = true;
        detail.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
    $$('[data-go-bench]', root).forEach((button) => button.addEventListener("click", () => {
      state.mission = Number(button.dataset.goBench);
      saveState();
      showView("bench");
      renderBench();
    }));
    $$('[data-evidence-key]', root).forEach((input) => {
      input.addEventListener("input", () => {
        state.evidence[input.dataset.evidenceKey] = input.value;
        saveState();
        renderReport();
      });
      input.addEventListener("change", () => {
        state.evidence[input.dataset.evidenceKey] = input.value;
        saveState();
        renderReport();
      });
    });
    $$('[data-question]', root).forEach((textarea) => {
      textarea.addEventListener("input", () => {
        const number = textarea.dataset.question;
        state.answers[number] = textarea.value;
        const meta = textarea.nextElementSibling;
        const answered = textarea.value.trim().length > 0;
        $(".answer-state", meta).textContent = answered ? "✓ Answered" : "Response needed";
        $(".answer-state", meta).classList.toggle("answered", answered);
        $(".character-count", meta).textContent = `${textarea.value.length}/1500`;
        saveState();
        renderReport();
      });
    });
  }

  function evidenceTable(partIndex) {
    const fields = evidenceParts[partIndex];
    return `<div class="data-table-wrap"><table class="data-table"><thead><tr><th scope="col">Evidence</th><th scope="col">Recorded value</th><th scope="col">Unit</th></tr></thead><tbody>${fields.map((field) => `<tr><th scope="row">${field.label}</th><td>${evidenceInput(field)}</td><td>${field.unit || "—"}</td></tr>`).join("")}</tbody></table></div>`;
  }

  function evidenceInput(field) {
    const value = String(state.evidence[field.key] ?? "");
    if (field.type === "select") {
      return `<select data-evidence-key="${field.key}" aria-label="${field.label}"><option value="">Select…</option>${field.options.map((option) => `<option value="${option}" ${option === value ? "selected" : ""}>${option}</option>`).join("")}</select>`;
    }
    const type = field.type === "number" ? "number" : "text";
    const extra = type === "number" ? 'step="0.01" inputmode="decimal"' : 'maxlength="140"';
    return `<input type="${type}" ${extra} data-evidence-key="${field.key}" aria-label="${field.label}" value="${escapeHtml(value)}" placeholder="Record value">`;
  }

  function questionHtml(question) {
    const answer = String(state.answers[question.number] ?? "");
    const answered = answer.trim().length > 0;
    return `<div class="question-block"><label for="question${question.number}"><span class="question-number">${question.number}.</span> ${question.text}</label><textarea id="question${question.number}" data-question="${question.number}" maxlength="1500" placeholder="Use observations and meter evidence in your explanation…">${escapeHtml(answer)}</textarea><div class="answer-meta"><span class="answer-state ${answered ? "answered" : ""}">${answered ? "✓ Answered" : "Response needed"}</span><span class="character-count">${answer.length}/1500</span></div></div>`;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character]);
  }

  function renderReport() {
    const finalResult = calculate(7, { connected: [true, true, true], switches: [true, true, true] });
    const requirements = finalRequirements(finalResult.topology);
    drawCircuit($("#reportCanvas"), finalResult, false);
    $("#summaryList").innerHTML = [
      ["Arrangement", topologyLabel(finalResult.topology)],
      ["Source", `${format(finalResult.voltage, 1)} V battery`],
      ["Bulbs", `3 × ${BULB_RESISTANCE} Ω`],
      ["Equivalent resistance", `${format(finalResult.equivalentResistance, 1)} Ω`],
      ["Total current", `${format(finalResult.totalCurrent)} A`],
      ["Design status", requirements.every((item) => item.pass) ? "All requirements pass" : "Revision needed"]
    ].map(([term, value]) => `<div><dt>${term}</dt><dd>${value}</dd></div>`).join("");
    $("#finalChecks").innerHTML = requirements.map((item) => `<div class="final-check ${item.pass ? "pass" : ""}"><span class="check-mark"><span>${item.pass ? "✓" : "×"}</span></span><span>${item.label}</span></div>`).join("");

    const finalFields = evidenceParts[7];
    $("#reportEvidence").innerHTML = `<table><thead><tr><th>Measurement or test</th><th>Recorded result</th></tr></thead><tbody>${finalFields.map((field) => `<tr><td>${field.label}</td><td>${escapeHtml(state.evidence[field.key] || "Not recorded")}${field.unit && state.evidence[field.key] ? ` ${field.unit}` : ""}</td></tr>`).join("")}</tbody></table>`;
    const answers = answeredCount();
    $("#responseMeterFill").style.width = `${Math.round((answers / questions.length) * 100)}%`;
    $("#responseReviewText").textContent = `${answers} of 27 questions answered.`;
    const missionsDone = missions.filter((_, index) => missionComplete(index)).length;
    const ready = missionsDone === 8 && answers === 27 && requirements.every((item) => item.pass);
    if (state.submittedAt) {
      $("#submissionMessage").textContent = `Submitted ${new Date(state.submittedAt).toLocaleString()}. You may revise and submit again.`;
      $("#submitLab").textContent = "Resubmit lab";
    } else if (ready) {
      $("#submissionMessage").textContent = "Every investigation, response, and design requirement is complete.";
      $("#submitLab").textContent = "Submit lab";
    } else {
      const needs = [];
      if (missionsDone < 8) needs.push(`${8 - missionsDone} investigation${8 - missionsDone === 1 ? "" : "s"}`);
      if (answers < 27) needs.push(`${27 - answers} response${27 - answers === 1 ? "" : "s"}`);
      if (!requirements.every((item) => item.pass)) needs.push("a passing final layout");
      $("#submissionMessage").textContent = `Still needed: ${needs.join(", ")}.`;
      $("#submitLab").textContent = "Check readiness";
    }
  }

  function showView(view) {
    $$('[data-view-panel]').forEach((panel) => {
      const active = panel.dataset.viewPanel === view;
      panel.hidden = !active;
      panel.classList.toggle("active", active);
    });
    $$('[data-view]').forEach((button) => {
      const active = button.dataset.view === view;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", String(active));
    });
    if (view === "notebook") renderNotebook();
    if (view === "report") renderReport();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("show"), 3400);
  }

  function reportText() {
    const finalResult = calculate(7, { connected: [true, true, true], switches: [true, true, true] });
    const lines = [
      "UNIT 6 LESSON 3 — CIRCUIT DESIGN CHALLENGE",
      "",
      "FINAL DESIGN",
      `Arrangement: ${topologyLabel(finalResult.topology)}`,
      `Battery: ${format(finalResult.voltage, 1)} V`,
      `Bulbs: 3 identical ${BULB_RESISTANCE} Ω bulbs`,
      `Total current: ${format(finalResult.totalCurrent)} A`,
      `Equivalent resistance: ${format(finalResult.equivalentResistance, 1)} Ω`,
      "",
      "FINAL REQUIREMENT TEST",
      ...finalRequirements(finalResult.topology).map((item) => `${item.pass ? "PASS" : "FAIL"} — ${item.label}`),
      "",
      "RECORDED EVIDENCE"
    ];
    evidenceParts.forEach((fields, index) => {
      lines.push(`Part ${index + 1}: ${missions[index].short}`);
      fields.forEach((field) => lines.push(`- ${field.label}: ${state.evidence[field.key] || "Not recorded"}${field.unit && state.evidence[field.key] ? ` ${field.unit}` : ""}`));
    });
    lines.push("", "WRITTEN RESPONSES");
    questions.forEach((question, index) => {
      lines.push(`${index + 1}. ${question[1]}`, state.answers[index + 1] || "No response", "");
    });
    return lines.join("\r\n");
  }

  function downloadReport() {
    const blob = new Blob([reportText()], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "circuit-design-challenge-report.txt";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast("Design report downloaded.");
  }

  function submitLab() {
    const missionsDone = missions.filter((_, index) => missionComplete(index)).length;
    const answers = answeredCount();
    const requirementsPass = finalRequirements().every((item) => item.pass);
    if (missionsDone < 8 || answers < 27 || !requirementsPass) {
      renderReport();
      showToast("The readiness summary shows what is still needed.");
      return;
    }
    state.submittedAt = new Date().toISOString();
    saveState();
    renderReport();
    try {
      window.parent.postMessage({ type: "complete", activity: "u6l3-circuit-design-challenge" }, "*");
    } catch (error) {
      // Submission remains recorded locally when the activity is not embedded.
    }
    showToast("Circuit Design Challenge submitted successfully.");
  }

  function bindEvents() {
    $$('[data-view]').forEach((button) => button.addEventListener("click", () => showView(button.dataset.view)));
    $("#previousMission").addEventListener("click", () => setMission(state.mission - 1));
    $("#nextMission").addEventListener("click", () => setMission(state.mission + 1));
    $("#batteryVoltage").addEventListener("input", (event) => {
      state.voltage = Number(event.target.value);
      $("#batteryOutput").textContent = `${state.voltage} V`;
      saveState();
      renderCircuitMetrics();
      renderMeterControls();
      renderMissionEvidence();
      renderReport();
    });
    $$('.meter-button').forEach((button) => button.addEventListener("click", () => {
      state.meter = button.dataset.meter;
      state.meterLocation = state.meter === "ammeter" ? "battery" : "battery-voltage";
      saveState();
      renderMeterControls();
      renderCircuitMetrics();
    }));
    $("#meterLocation").addEventListener("change", (event) => {
      state.meterLocation = event.target.value;
      saveState();
      updateMeterReadout();
      renderCircuitMetrics();
    });
    $("#recordEvidence").addEventListener("click", recordMissionEvidence);
    $("#openNotebook").addEventListener("click", () => showView("notebook"));
    $("#returnToBench").addEventListener("click", () => showView("bench"));
    $("#reviewResponses").addEventListener("click", () => showView("notebook"));
    $("#printReport").addEventListener("click", () => window.print());
    $("#downloadReport").addEventListener("click", downloadReport);
    $("#submitLab").addEventListener("click", submitLab);
    $("#resetLab").addEventListener("click", () => {
      if (!window.confirm("Reset all measurements, circuit choices, and written responses for this lab?")) return;
      state = defaultState();
      try { localStorage.removeItem(STORAGE_KEY); } catch (error) { /* no-op */ }
      renderAll();
      showView("bench");
      showToast("The lab has been reset.");
    });
  }

  function renderAll() {
    renderBench();
    renderNotebook();
    renderReport();
    updateProgress();
  }

  bindEvents();
  renderAll();
})();
