"use strict";

var ROUND_FRAMES = 92;
var HIT_FRAME = 52;

var MATERIALS = [
  { id: "steel", name: "Titan Steel", short: "Steel", density: 9, impact: 9, bend: 8, fire: 8, heat: 3, water: 3, acid: 5, nonMagnetic: 1, lowConductivity: 2, color: "#64748b", note: "Very strong, but heavy, magnetic, and can rust." },
  { id: "plastic", name: "Aqua Plastic", short: "Plastic", density: 3, impact: 4, bend: 6, fire: 2, heat: 4, water: 9, acid: 7, nonMagnetic: 9, lowConductivity: 8, color: "#38bdf8", note: "Light and waterproof, but weak against heat and impact." },
  { id: "rubber", name: "Flexi Rubber", short: "Rubber", density: 4, impact: 5, bend: 10, fire: 1, heat: 2, water: 8, acid: 6, nonMagnetic: 9, lowConductivity: 8, color: "#111827", note: "Great for bending joints, but burns and melts easily." },
  { id: "ceramic", name: "Heat Ceramic", short: "Ceramic", density: 6, impact: 3, bend: 1, fire: 10, heat: 10, water: 8, acid: 7, nonMagnetic: 9, lowConductivity: 9, color: "#f8fafc", note: "Excellent heat shield, but brittle when smashed or bent." },
  { id: "foam", name: "Carbon Foam", short: "Foam", density: 2, impact: 8, bend: 7, fire: 2, heat: 5, water: 3, acid: 3, nonMagnetic: 10, lowConductivity: 7, color: "#facc15", note: "Light and shock absorbing, but flammable and chemically weak." },
  { id: "glass", name: "Glass Polymer", short: "Glass", density: 5, impact: 2, bend: 1, fire: 8, heat: 6, water: 9, acid: 10, nonMagnetic: 10, lowConductivity: 8, color: "#a7f3d0", note: "Great against acid and water, but cracks under force." },
  { id: "copper", name: "Copper Mesh", short: "Copper", density: 8, impact: 6, bend: 7, fire: 7, heat: 1, water: 4, acid: 3, nonMagnetic: 7, lowConductivity: 1, color: "#b45309", note: "Flexible and energy-blocking, but transfers heat and corrodes." },
  { id: "wood", name: "Wood Fiber Board", short: "Wood", density: 4, impact: 5, bend: 6, fire: 1, heat: 7, water: 2, acid: 6, nonMagnetic: 10, lowConductivity: 8, color: "#92400e", note: "Light and low heat transfer, but burns and absorbs water." },
  { id: "aluminum", name: "Aluminum Alloy", short: "Aluminum", density: 5, impact: 6, bend: 5, fire: 7, heat: 2, water: 7, acid: 4, nonMagnetic: 8, lowConductivity: 2, color: "#cbd5e1", note: "Balanced and light, but dents and transfers heat." },
  { id: "magno", name: "Magno-Metal", short: "Magno", density: 10, impact: 10, bend: 8, fire: 9, heat: 5, water: 2, acid: 4, nonMagnetic: 0, lowConductivity: 3, color: "#7c3aed", note: "Extremely strong, but very heavy, magnetic, and rust-prone." }
];

var HEROES = [
  { id: "flame", name: "Flame Face", power: "Fire Breath", stat: "fire", target: "shield", mark: "F", color: "#ef4444", glow: "#fed7aa", lesson: "Low flammability helps materials survive fire." },
  { id: "laser", name: "Laser Lass", power: "Laser Vision", stat: "heat", target: "shield", mark: "L", color: "#f59e0b", glow: "#fef3c7", lesson: "Low heat transfer helps protect the robot from heating up." },
  { id: "splash", name: "Captain Splash", power: "Water Cannon", stat: "water", target: "shield", mark: "W", color: "#0ea5e9", glow: "#bae6fd", lesson: "Water resistance helps prevent rusting and water damage." },
  { id: "acid", name: "Acid Kid", power: "Sour Slime", stat: "acid", target: "shield", mark: "A", color: "#84cc16", glow: "#d9f99d", lesson: "Low reactivity helps materials survive chemical attacks." },
  { id: "bend", name: "Bend-O-Man", power: "Twist Attack", stat: "bend", target: "joints", mark: "B", color: "#8b5cf6", glow: "#ddd6fe", lesson: "Flexible materials bend without snapping." },
  { id: "gravity", name: "Gravity Boss", power: "Stomp Smash", stat: "impact", target: "body", mark: "G", color: "#78716c", glow: "#e7e5e4", lesson: "Strong materials resist impact, but heavy materials may slow the robot." },
  { id: "magnet", name: "Magnet Max", power: "Magnet Pull", stat: "nonMagnetic", target: "body", mark: "M", color: "#dc2626", glow: "#fecaca", lesson: "Non-magnetic materials are harder for magnets to control." },
  { id: "static", name: "Static Shock Sue", power: "Electric Zap", stat: "lowConductivity", target: "joints", mark: "E", color: "#eab308", glow: "#fef08a", lesson: "Low conductivity helps block electric current." }
];

var TACTICS = [
  { id: "brace", name: "Brace Mode", mark: "BR", covers: ["impact", "bend"], color: "#2364aa", copy: "Best against smashing and twisting attacks." },
  { id: "coolant", name: "Coolant Burst", mark: "CB", covers: ["fire", "heat"], color: "#0ea5e9", copy: "Best against flames and laser heat." },
  { id: "sealant", name: "Sealant Spray", mark: "SS", covers: ["water", "acid"], color: "#1c7c54", copy: "Best against water and chemical slime." },
  { id: "insulator", name: "Insulator Pulse", mark: "IP", covers: ["lowConductivity", "nonMagnetic"], color: "#7c3aed", copy: "Best against electricity and magnets." }
];

var PART_LABELS = { body: "Body Armor", shield: "Shield", joints: "Joint Cover" };
var PART_STATS = {
  body: ["impact", "nonMagnetic", "density"],
  shield: ["fire", "heat", "water", "acid"],
  joints: ["bend", "lowConductivity", "density"]
};

var state = {
  build: { body: "aluminum", shield: "ceramic", joints: "rubber" },
  selectedTactic: "brace",
  tacticAvailable: true,
  possibleHeroes: randomArena(),
  activeHeroes: [],
  roundIndex: -1,
  roundFrame: 0,
  roundResolved: false,
  battleLog: [],
  isRunning: false,
  frame: 0,
  robotHealth: 100,
  bestScore: null,
  lastFinal: null,
  particles: [],
  floaters: [],
  arenaFlash: 0,
  currentImpact: null,
  timer: null
};

var els = {};

document.addEventListener("DOMContentLoaded", function () {
  els.canvas = document.getElementById("arena");
  els.builder = document.getElementById("builder");
  els.tactics = document.getElementById("tactics");
  els.opponents = document.getElementById("opponents");
  els.battleLog = document.getElementById("battleLog");
  els.finalScore = document.getElementById("finalScore");
  els.battleBrief = document.getElementById("battleBrief");
  els.newArenaBtn = document.getElementById("newArenaBtn");
  els.runBattleBtn = document.getElementById("runBattleBtn");
  els.resetBtn = document.getElementById("resetBtn");

  els.newArenaBtn.addEventListener("click", newArena);
  els.runBattleBtn.addEventListener("click", runBattle);
  els.resetBtn.addEventListener("click", resetBattle);
  window.addEventListener("resize", draw);
  render();
});

function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function getMaterial(id) { return MATERIALS.find(function (m) { return m.id === id; }) || MATERIALS[0]; }
function getTactic(id) { return TACTICS.find(function (t) { return t.id === id; }) || TACTICS[0]; }
function randomArena() { return HEROES.slice().sort(function () { return Math.random() - 0.5; }).slice(0, 3); }

function shouldDeployTactic(hero, heroes, index, tacticId, available) {
  if (!available) return false;
  var tactic = getTactic(tacticId);
  if (tactic.covers.indexOf(hero.stat) !== -1) return true;
  for (var i = index + 1; i < heroes.length; i++) {
    if (tactic.covers.indexOf(heroes[i].stat) !== -1) return false;
  }
  return index === heroes.length - 1;
}

function calculateRound(hero, build, tacticId, deployTactic) {
  var material = getMaterial(build[hero.target]);
  var defense = material[hero.stat];
  var densityPenalty = hero.target === "body" ? Math.max(0, material.density - 6) * 2 : Math.max(0, material.density - 8);
  var tactic = getTactic(tacticId);
  var tacticMatched = deployTactic && tactic.covers.indexOf(hero.stat) !== -1;
  var tacticBonus = deployTactic ? (tacticMatched ? 10 : 3) : 0;
  var damage = clamp(34 - defense * 2.6 + densityPenalty - tacticBonus, 0, 36);
  var roundedDamage = Math.round(damage);
  return {
    hero: hero,
    material: material,
    defense: defense,
    damage: roundedDamage,
    part: hero.target,
    tactic: tactic,
    tacticUsed: !!deployTactic,
    tacticMatched: tacticMatched,
    tacticBonus: tacticBonus,
    result: roundedDamage <= 8 ? "Blocked" : roundedDamage <= 18 ? "Held on" : "Major hit"
  };
}

function buildScore(build, heroes, tacticId) {
  var tacticAvailable = true;
  var rounds = heroes.map(function (hero, index) {
    var deploy = shouldDeployTactic(hero, heroes, index, tacticId, tacticAvailable);
    var round = calculateRound(hero, build, tacticId, deploy);
    if (deploy) tacticAvailable = false;
    return round;
  });
  var totalDamage = rounds.reduce(function (sum, r) { return sum + r.damage; }, 0);
  var mass = getMaterial(build.body).density + getMaterial(build.shield).density + getMaterial(build.joints).density;
  var massPenalty = Math.max(0, mass - 18) * 2;
  var uniqueParts = {};
  Object.keys(build).forEach(function (part) { uniqueParts[build[part]] = true; });
  var comboBonus = Object.keys(uniqueParts).length === 3 ? 4 : 0;
  var tacticBonus = rounds.some(function (r) { return r.tacticMatched; }) ? 4 : 0;
  var score = clamp(100 - totalDamage - massPenalty + comboBonus + tacticBonus, 0, 100);
  return { rounds: rounds, totalDamage: totalDamage, mass: mass, massPenalty: massPenalty, comboBonus: comboBonus, tacticBonus: tacticBonus, score: Math.round(score) };
}

function reportScore(score) {
  if (!window.SCORM) return;
  window.SCORM.setScore(score, 0, 100);
  window.SCORM.setStatus(score >= 80 ? "passed" : "completed");
}

function updatePart(part, materialId) {
  if (state.isRunning) return;
  state.build[part] = materialId;
  state.lastFinal = null;
  render();
}

function selectTactic(tacticId) {
  if (state.isRunning) return;
  state.selectedTactic = tacticId;
  state.lastFinal = null;
  render();
}

function newArena() {
  if (state.isRunning) return;
  state.possibleHeroes = randomArena();
  state.activeHeroes = [];
  state.roundIndex = -1;
  state.roundFrame = 0;
  state.roundResolved = false;
  state.battleLog = [];
  state.robotHealth = 100;
  state.tacticAvailable = true;
  state.lastFinal = null;
  state.particles = [];
  state.floaters = [];
  state.currentImpact = null;
  render();
}

function runBattle() {
  if (state.isRunning) return;
  state.activeHeroes = state.possibleHeroes.slice().sort(function () { return Math.random() - 0.5; });
  state.battleLog = [];
  state.roundIndex = 0;
  state.roundFrame = 0;
  state.roundResolved = false;
  state.isRunning = true;
  state.frame = 0;
  state.robotHealth = 100;
  state.tacticAvailable = true;
  state.lastFinal = null;
  state.particles = [];
  state.floaters = [];
  state.currentImpact = null;
  renderPanels();
  tick();
}

function resetBattle() {
  state.isRunning = false;
  state.activeHeroes = [];
  state.roundIndex = -1;
  state.roundFrame = 0;
  state.roundResolved = false;
  state.battleLog = [];
  state.robotHealth = 100;
  state.tacticAvailable = true;
  state.frame = 0;
  state.lastFinal = null;
  state.currentImpact = null;
  if (state.timer) window.clearTimeout(state.timer);
  render();
}

function tick() {
  if (!state.isRunning) return;
  state.frame += 1;
  state.roundFrame += 1;
  updateEffects();

  if (!state.roundResolved && state.roundFrame >= HIT_FRAME) {
    resolveRound();
  }

  if (state.roundResolved && state.roundFrame >= ROUND_FRAMES) {
    if (state.roundIndex >= state.activeHeroes.length - 1) {
      finishBattle();
      return;
    }
    state.roundIndex += 1;
    state.roundFrame = 0;
    state.roundResolved = false;
    state.currentImpact = null;
    renderPanels();
  }

  draw();
  state.timer = window.setTimeout(tick, 33);
}

function resolveRound() {
  var hero = state.activeHeroes[state.roundIndex];
  if (!hero) return;
  var deploy = shouldDeployTactic(hero, state.activeHeroes, state.roundIndex, state.selectedTactic, state.tacticAvailable);
  var result = calculateRound(hero, state.build, state.selectedTactic, deploy);
  if (deploy) state.tacticAvailable = false;
  state.battleLog.push(result);
  state.robotHealth = clamp(state.robotHealth - result.damage, 0, 100);
  state.roundResolved = true;
  state.currentImpact = result;
  state.arenaFlash = result.tacticMatched ? 22 : 14;
  spawnImpact(result);
  renderPanels();
}

function finishBattle() {
  state.isRunning = false;
  state.roundFrame = 0;
  state.roundResolved = false;
  state.currentImpact = null;
  state.lastFinal = buildScore(state.build, state.activeHeroes, state.selectedTactic);
  state.bestScore = state.bestScore === null ? state.lastFinal.score : Math.max(state.bestScore, state.lastFinal.score);
  reportScore(state.lastFinal.score);
  render();
}

function updateEffects() {
  state.arenaFlash = Math.max(0, state.arenaFlash - 1);
  state.particles = state.particles.filter(function (p) {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += p.gravity || 0;
    p.life -= 1;
    return p.life > 0;
  });
  state.floaters = state.floaters.filter(function (f) {
    f.y -= 1.2;
    f.life -= 1;
    return f.life > 0;
  });
}

function spawnImpact(result) {
  var size = currentArenaSize();
  var robot = getRobotGeometry(size.width, size.height);
  var tx = robot.x + 52 * robot.scale;
  var ty = robot.y + 10 * robot.scale;
  var color = result.tacticMatched ? result.tactic.color : result.hero.color;
  var count = result.tacticMatched ? 34 : 24;

  for (var i = 0; i < count; i++) {
    var angle = Math.random() * Math.PI * 2;
    var speed = 1.5 + Math.random() * 5;
    state.particles.push({
      x: tx + (Math.random() - 0.5) * 35,
      y: ty + (Math.random() - 0.5) * 50,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1,
      gravity: 0.08,
      size: 2 + Math.random() * 5,
      color: color,
      life: 24 + Math.random() * 20,
      maxLife: 44
    });
  }

  state.floaters.push({
    x: tx + 18,
    y: ty - 64,
    text: result.tacticMatched ? "TACTIC BLOCK" : "-" + result.damage,
    color: color,
    life: 44
  });
}

function currentArenaSize() {
  var rect = els.canvas ? els.canvas.getBoundingClientRect() : { width: 920, height: 540 };
  return { width: Math.max(320, rect.width), height: Math.max(320, rect.height) };
}

function render() {
  renderBuilder();
  renderTactics();
  renderPanels();
  draw();
}

function renderBuilder() {
  els.builder.innerHTML = "";
  Object.keys(PART_LABELS).forEach(function (part) {
    var mat = getMaterial(state.build[part]);
    var field = document.createElement("div");
    field.className = "builder-field";
    var label = document.createElement("label");
    label.htmlFor = "part-" + part;
    label.textContent = PART_LABELS[part];
    var select = document.createElement("select");
    select.id = "part-" + part;
    select.value = state.build[part];
    select.disabled = state.isRunning;
    select.addEventListener("change", function (event) { updatePart(part, event.target.value); });
    MATERIALS.forEach(function (material) {
      var option = document.createElement("option");
      option.value = material.id;
      option.textContent = material.name;
      select.appendChild(option);
    });
    var note = document.createElement("p");
    note.className = "material-note";
    note.textContent = mat.note;
    field.appendChild(label);
    field.appendChild(select);
    field.appendChild(note);
    field.appendChild(renderStatStack(part, mat));
    els.builder.appendChild(field);
  });
}

function renderStatStack(part, mat) {
  var stack = document.createElement("div");
  stack.className = "stat-stack";
  PART_STATS[part].forEach(function (stat) {
    var value = stat === "density" ? 11 - mat.density : mat[stat];
    var row = document.createElement("div");
    row.className = "stat-row";
    row.innerHTML =
      "<span>" + statName(stat === "density" ? "light" : stat) + "</span>" +
      '<span class="stat-track"><span class="stat-fill" style="width:' + (value * 10) + '%"></span></span>' +
      "<span>" + value + "</span>";
    stack.appendChild(row);
  });
  return stack;
}

function renderTactics() {
  els.tactics.innerHTML = "";
  TACTICS.forEach(function (tactic) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "tactic-card" + (state.selectedTactic === tactic.id ? " active" : "");
    button.disabled = state.isRunning;
    button.style.setProperty("--tactic-color", tactic.color);
    button.addEventListener("click", function () { selectTactic(tactic.id); });
    button.innerHTML =
      '<div class="card-title"><span><span class="token">' + tactic.mark + "</span> " + tactic.name + '</span><span class="pill">One use</span></div>' +
      '<p class="need-line">' + tactic.copy + "</p>";
    els.tactics.appendChild(button);
  });
}

function renderPanels() {
  setButtons();
  renderOpponents();
  renderBattleLog();
  renderFinalScore();
  renderBattleBrief();
}

function setButtons() {
  els.newArenaBtn.disabled = state.isRunning;
  els.runBattleBtn.disabled = state.isRunning;
}

function renderOpponents() {
  els.opponents.innerHTML = "";
  state.possibleHeroes.forEach(function (hero) {
    var card = document.createElement("div");
    card.className = "opponent-card";
    card.innerHTML =
      '<div class="card-title"><span><span class="token" style="color:' + hero.color + '">' + hero.mark + "</span> " + hero.name + '</span><span class="pill">Targets ' + PART_LABELS[hero.target] + "</span></div>" +
      '<p class="need-line">Needs: ' + statName(hero.stat) + "</p>" +
      '<p class="need-line">Power: ' + hero.power + "</p>";
    els.opponents.appendChild(card);
  });
}

function renderBattleLog() {
  if (!state.battleLog.length) {
    els.battleLog.innerHTML = '<p class="muted">Run a battle to see how your material choices perform.</p>';
    return;
  }
  els.battleLog.innerHTML = "";
  state.battleLog.forEach(function (entry) {
    var tone = entry.damage <= 8 ? "strong" : entry.damage <= 18 ? "warning" : "danger";
    var tacticLine = entry.tacticUsed
      ? (entry.tacticMatched ? entry.tactic.name + " matched the attack and reduced damage by " + entry.tacticBonus + "." : entry.tactic.name + " helped a little, but it was not the best counter.")
      : "No tactic used this round.";
    var card = document.createElement("div");
    card.className = "log-card " + tone;
    card.innerHTML =
      '<div class="card-title"><span><span class="token" style="color:' + entry.hero.color + '">' + entry.hero.mark + "</span> " + entry.hero.name + '</span><span class="pill">Damage: ' + entry.damage + "</span></div>" +
      "<p>" + PART_LABELS[entry.part] + " used <strong>" + entry.material.name + "</strong>. Result: <strong>" + entry.result + "</strong>.</p>" +
      '<p class="need-line">' + tacticLine + "</p>" +
      '<p class="need-line">' + entry.hero.lesson + "</p>";
    els.battleLog.appendChild(card);
  });
}

function renderFinalScore() {
  var finalScore = state.lastFinal;
  if (!finalScore) {
    var preview = buildScore(state.build, state.possibleHeroes, state.selectedTactic);
    els.finalScore.innerHTML =
      '<p class="muted">Predicted gauntlet score with this build: <strong>' + preview.score + "/100</strong>.</p>" +
      '<p class="muted">Change one material or tactic, then run the battle and compare the result.</p>';
    return;
  }
  var rating = finalScore.score >= 88 ? "Champion build" : finalScore.score >= 70 ? "Battle ready" : "Needs redesign";
  els.finalScore.innerHTML =
    '<div class="score-number">' + finalScore.score + "/100</div>" +
    "<p><strong>" + rating + ".</strong> Total damage: " + finalScore.totalDamage + " | Mass penalty: " + finalScore.massPenalty + " | Combo bonus: " + finalScore.comboBonus + " | Tactic bonus: " + finalScore.tacticBonus + "</p>" +
    '<div class="score-tip">Redesign idea: inspect the highest-damage round, change that target part, and run a fresh gauntlet.</div>';
}

function renderBattleBrief() {
  var preview = buildScore(state.build, state.possibleHeroes, state.selectedTactic);
  var kicker = "Ready bay";
  var title = "Choose parts, pick a tactic, then launch the gauntlet.";
  var copy = "The arena will run all three previewed opponents in a random order.";
  var score = "Preview " + preview.score + "/100";

  if (state.isRunning && state.activeHeroes[state.roundIndex]) {
    var hero = state.activeHeroes[state.roundIndex];
    kicker = "Round " + (state.roundIndex + 1) + " of " + state.activeHeroes.length;
    title = hero.name + " is charging " + hero.power + ".";
    copy = "Target: " + PART_LABELS[hero.target] + " | Defense needed: " + statName(hero.stat) + ".";
    score = "Integrity " + Math.round(state.robotHealth) + "%";
  } else if (state.lastFinal) {
    kicker = "Battle complete";
    title = state.lastFinal.score >= 80 ? "The robot held the arena." : "The robot survived, but the design can improve.";
    copy = "Best score this session: " + state.bestScore + "/100.";
    score = "Final " + state.lastFinal.score + "/100";
  }

  els.battleBrief.innerHTML =
    '<div class="brief-kicker">' + kicker + "</div>" +
    '<div><div class="brief-title">' + title + '</div><p class="brief-copy">' + copy + "</p></div>" +
    '<div class="brief-score">' + score + "</div>";
}

function statName(stat) {
  var names = {
    fire: "low flame",
    heat: "heat block",
    water: "water seal",
    acid: "acid resist",
    bend: "flex",
    impact: "impact",
    nonMagnetic: "nonmagnetic",
    lowConductivity: "insulation",
    light: "lightweight"
  };
  return names[stat] || stat;
}

function materialColor(id) {
  return getMaterial(id).color || "#94a3b8";
}

function draw() {
  var canvas = els.canvas;
  if (!canvas) return;
  var ctx = canvas.getContext("2d");
  var rect = canvas.getBoundingClientRect();
  var dpr = window.devicePixelRatio || 1;
  var width = Math.max(320, rect.width);
  var height = Math.max(320, rect.height);
  if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  drawArena(ctx, width, height);
  drawHud(ctx, width);
  drawHeroes(ctx, width, height);
  drawRobot(ctx, width, height);
  drawActiveAttack(ctx, width, height);
  drawParticles(ctx);
  drawFloaters(ctx);
  drawRoundBanner(ctx, width);

  if (state.arenaFlash > 0) {
    ctx.fillStyle = "rgba(255,255,255," + (state.arenaFlash / 70) + ")";
    ctx.fillRect(0, 0, width, height);
  }
}

function drawArena(ctx, width, height) {
  var bg = ctx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, "#071626");
  bg.addColorStop(0.48, "#12324f");
  bg.addColorStop(1, "#e5edf4");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.globalAlpha = 0.22;
  drawSpotlight(ctx, width * 0.18, 0, width * 0.36, height * 0.86, "#fed7aa");
  drawSpotlight(ctx, width * 0.82, 0, width * 0.54, height * 0.82, "#bae6fd");
  ctx.restore();

  ctx.fillStyle = "rgba(255,255,255,0.12)";
  for (var i = 0; i < 95; i++) {
    var cx = (i * 67) % Math.max(1, width);
    var cy = 86 + ((i * 31) % 138);
    ctx.beginPath();
    ctx.arc(cx, cy, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#10243a";
  ctx.fillRect(0, height - 168, width, 42);
  ctx.fillStyle = "#dbe7ef";
  ctx.beginPath();
  ctx.moveTo(0, height - 126);
  ctx.lineTo(width, height - 126);
  ctx.lineTo(width - 72, height);
  ctx.lineTo(72, height);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(18,38,58,0.14)";
  ctx.lineWidth = 2;
  for (var x = -80; x < width + 80; x += 54) {
    ctx.beginPath();
    ctx.moveTo(x, height - 126);
    ctx.lineTo(x - 72, height);
    ctx.stroke();
  }
  for (var y = height - 105; y < height; y += 28) {
    ctx.beginPath();
    ctx.moveTo(55, y);
    ctx.lineTo(width - 55, y);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font = "800 22px Space Grotesk, system-ui, sans-serif";
  ctx.fillText("Robot Rumble: Materials Mayhem", 24, 34);
  ctx.font = "700 12px Instrument Sans, system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.68)";
  ctx.fillText("Build smarter. Block harder. Learn the material matchups.", 24, 56);
}

function drawSpotlight(ctx, x, y, targetX, targetY, color) {
  var grad = ctx.createLinearGradient(x, y, targetX, targetY);
  grad.addColorStop(0, color);
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(x - 52, y);
  ctx.lineTo(x + 52, y);
  ctx.lineTo(targetX + 112, targetY);
  ctx.lineTo(targetX - 112, targetY);
  ctx.closePath();
  ctx.fill();
}

function drawHud(ctx, width) {
  var health = state.isRunning || state.battleLog.length ? state.robotHealth : 100;
  drawBar(ctx, 24, 76, Math.min(300, width - 48), 16, health / 100, "ROBOT INTEGRITY", healthColor(health));
  var tactic = getTactic(state.selectedTactic);
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  roundRect(ctx, 24, 104, 190, 42, 10);
  ctx.fill();
  ctx.fillStyle = tactic.color;
  ctx.font = "900 13px Instrument Sans, system-ui, sans-serif";
  ctx.fillText(tactic.mark, 38, 130);
  ctx.fillStyle = "#12263a";
  ctx.font = "800 12px Instrument Sans, system-ui, sans-serif";
  ctx.fillText(tactic.name + (state.tacticAvailable ? " ready" : " used"), 72, 130);

  var total = state.activeHeroes.length || 3;
  var startX = width - 34 - total * 24;
  for (var i = 0; i < total; i++) {
    var done = state.battleLog.length > i;
    var active = state.isRunning && state.roundIndex === i;
    ctx.fillStyle = done ? "#1c7c54" : active ? "#f3c623" : "rgba(255,255,255,0.55)";
    ctx.beginPath();
    ctx.arc(startX + i * 24, 84, active ? 8 : 6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBar(ctx, x, y, width, height, pct, label, color) {
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  roundRect(ctx, x - 8, y - 24, width + 16, height + 34, 10);
  ctx.fill();
  ctx.fillStyle = "#12263a";
  ctx.font = "900 11px Instrument Sans, system-ui, sans-serif";
  ctx.fillText(label, x, y - 8);
  ctx.fillStyle = "#d5e0ea";
  roundRect(ctx, x, y, width, height, height / 2);
  ctx.fill();
  ctx.fillStyle = color;
  roundRect(ctx, x, y, Math.max(height, width * clamp(pct, 0, 1)), height, height / 2);
  ctx.fill();
}

function healthColor(value) {
  if (value >= 70) return "#1c7c54";
  if (value >= 38) return "#f3c623";
  return "#c84630";
}

function drawRobot(ctx, width, height) {
  var geo = getRobotGeometry(width, height);
  var bodyMat = getMaterial(state.build.body);
  var shieldMat = getMaterial(state.build.shield);
  var jointMat = getMaterial(state.build.joints);
  var damageShake = state.robotHealth < 55 ? Math.sin(state.frame * 0.65) * (state.robotHealth < 30 ? 5 : 2.5) : 0;

  ctx.save();
  ctx.translate(geo.x + damageShake, geo.y);
  ctx.scale(geo.scale, geo.scale);

  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.beginPath();
  ctx.ellipse(20, 102, 86, 15, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = 12;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-44, 2);
  ctx.lineTo(-78, 24);
  ctx.moveTo(60, 2);
  ctx.lineTo(100, 26);
  ctx.moveTo(-22, 54);
  ctx.lineTo(-42, 92);
  ctx.moveTo(36, 54);
  ctx.lineTo(58, 92);
  ctx.stroke();

  ctx.fillStyle = materialColor(jointMat.id);
  [-44, 60, -22, 36].forEach(function (x, i) {
    var y = i < 2 ? 3 : 55;
    ctx.beginPath();
    ctx.arc(x, y, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#071626";
    ctx.lineWidth = 3;
    ctx.stroke();
  });

  var bodyGrad = ctx.createLinearGradient(-42, -30, 58, 62);
  bodyGrad.addColorStop(0, lighten(bodyMat.color, 0.28));
  bodyGrad.addColorStop(0.55, bodyMat.color);
  bodyGrad.addColorStop(1, darken(bodyMat.color, 0.2));
  ctx.fillStyle = bodyGrad;
  roundRect(ctx, -44, -38, 104, 98, 16);
  ctx.fill();
  ctx.strokeStyle = "#071626";
  ctx.lineWidth = 4;
  ctx.stroke();
  drawRobotPlates(ctx, bodyMat.id);

  ctx.fillStyle = "#dbe7ef";
  roundRect(ctx, -28, -88, 72, 48, 14);
  ctx.fill();
  ctx.strokeStyle = "#071626";
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = "#38bdf8";
  ctx.beginPath();
  ctx.arc(-6, -64, 5, 0, Math.PI * 2);
  ctx.arc(24, -64, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#071626";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(8, -88);
  ctx.lineTo(8, -108);
  ctx.stroke();
  ctx.fillStyle = "#f3c623";
  ctx.beginPath();
  ctx.arc(8, -112, 5, 0, Math.PI * 2);
  ctx.fill();

  var shieldGrad = ctx.createLinearGradient(70, -28, 124, 66);
  shieldGrad.addColorStop(0, lighten(shieldMat.color, 0.32));
  shieldGrad.addColorStop(1, shieldMat.color);
  ctx.fillStyle = shieldGrad;
  roundRect(ctx, 72, -32, 54, 98, 20);
  ctx.fill();
  ctx.strokeStyle = "#071626";
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  roundRect(ctx, 84, -18, 14, 66, 7);
  ctx.fill();

  if (state.robotHealth < 75) drawCracks(ctx, state.robotHealth);

  ctx.fillStyle = "#071626";
  ctx.font = "900 11px Instrument Sans, system-ui, sans-serif";
  ctx.fillText(bodyMat.short, -24, 14);
  ctx.fillText(shieldMat.short, 76, 28);
  ctx.fillText(jointMat.short, -56, 112);
  ctx.restore();
}

function getRobotGeometry(width, height) {
  return {
    x: width < 620 ? 110 : 175,
    y: height - 160,
    scale: width < 520 ? 0.78 : width < 760 ? 0.9 : 1
  };
}

function drawRobotPlates(ctx, materialId) {
  ctx.strokeStyle = "rgba(7,22,38,0.28)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-26, -18);
  ctx.lineTo(42, -18);
  ctx.moveTo(-32, 8);
  ctx.lineTo(50, 8);
  ctx.moveTo(-20, 34);
  ctx.lineTo(38, 34);
  ctx.stroke();
  if (materialId === "glass" || materialId === "ceramic") {
    ctx.strokeStyle = "rgba(35,100,170,0.38)";
    ctx.beginPath();
    ctx.moveTo(-30, -30);
    ctx.lineTo(54, 50);
    ctx.moveTo(20, -34);
    ctx.lineTo(-38, 54);
    ctx.stroke();
  }
}

function drawCracks(ctx, health) {
  ctx.strokeStyle = health < 38 ? "#c84630" : "rgba(7,22,38,0.45)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-14, -22);
  ctx.lineTo(-4, -4);
  ctx.lineTo(-16, 12);
  ctx.moveTo(34, 0);
  ctx.lineTo(22, 18);
  ctx.lineTo(42, 34);
  ctx.stroke();
}

function drawHeroes(ctx, width, height) {
  var heroesToDraw = state.activeHeroes.length ? state.activeHeroes : state.possibleHeroes;
  var startX = width < 760 ? width - 174 : width - 280;
  var gap = width < 760 ? 75 : 126;
  heroesToDraw.forEach(function (hero, i) {
    var pos = getHeroPosition(width, height, i);
    drawHeroAvatar(ctx, hero, pos.x || (startX + i * gap), pos.y, i);
  });
}

function getHeroPosition(width, height, index) {
  var gap = width < 760 ? 75 : 126;
  var startX = width < 760 ? width - 174 : width - 280;
  return { x: startX + index * gap, y: height - 172 };
}

function drawHeroAvatar(ctx, hero, x, y, index) {
  var attacking = state.isRunning && state.activeHeroes[state.roundIndex] && state.activeHeroes[state.roundIndex].id === hero.id;
  var pulse = attacking ? Math.sin(state.frame * 0.38) * 7 : 0;
  var defeated = state.battleLog.some(function (r) { return r.hero.id === hero.id; });
  ctx.save();
  ctx.globalAlpha = defeated && !attacking ? 0.62 : 1;

  ctx.fillStyle = attacking ? hero.glow : "rgba(255,255,255,0.9)";
  roundRect(ctx, x - 43 - pulse / 2, y - 86 - pulse / 2, 92 + pulse, 126 + pulse, 18);
  ctx.fill();
  ctx.strokeStyle = attacking ? hero.color : "rgba(255,255,255,0.7)";
  ctx.lineWidth = attacking ? 4 : 2;
  ctx.stroke();

  ctx.fillStyle = hero.color;
  ctx.beginPath();
  ctx.arc(x + 3, y - 42, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 28px Space Grotesk, system-ui, sans-serif";
  centerText(ctx, hero.mark, x + 3, y - 32);

  ctx.fillStyle = "#12263a";
  ctx.font = "900 12px Instrument Sans, system-ui, sans-serif";
  centerText(ctx, shortName(hero.name), x + 3, y + 4);
  ctx.font = "700 10px Instrument Sans, system-ui, sans-serif";
  ctx.fillStyle = "#587184";
  centerText(ctx, hero.power, x + 3, y + 20);

  if (attacking) {
    ctx.fillStyle = hero.color;
    ctx.font = "900 11px Instrument Sans, system-ui, sans-serif";
    centerText(ctx, "ATTACK", x + 3, y + 36);
  } else if (defeated) {
    ctx.fillStyle = "#1c7c54";
    ctx.font = "900 11px Instrument Sans, system-ui, sans-serif";
    centerText(ctx, "CLEARED", x + 3, y + 36);
  } else {
    ctx.fillStyle = "rgba(18,38,58,0.46)";
    ctx.font = "900 11px Instrument Sans, system-ui, sans-serif";
    centerText(ctx, "ROUND " + (index + 1), x + 3, y + 36);
  }
  ctx.restore();
}

function shortName(name) {
  return name.length > 12 ? name.split(" ")[0] + " " + name.split(" ")[1].charAt(0) + "." : name;
}

function drawActiveAttack(ctx, width, height) {
  if (!state.isRunning || !state.activeHeroes[state.roundIndex]) return;
  var hero = state.activeHeroes[state.roundIndex];
  var heroPos = getHeroPosition(width, height, state.roundIndex);
  var robot = getRobotGeometry(width, height);
  var targetX = robot.x + 72 * robot.scale;
  var targetY = robot.y + 6 * robot.scale;
  var progress = clamp(state.roundFrame / HIT_FRAME, 0, 1);
  drawAttack(ctx, hero, heroPos.x - 18, heroPos.y - 48, targetX, targetY, progress);

  if (state.roundResolved && state.currentImpact && state.currentImpact.tacticUsed) {
    drawTacticShield(ctx, targetX, targetY, getTactic(state.selectedTactic), state.currentImpact.tacticMatched);
  }
}

function drawTacticShield(ctx, x, y, tactic, matched) {
  var pulse = Math.max(0, ROUND_FRAMES - state.roundFrame) / ROUND_FRAMES;
  ctx.save();
  ctx.strokeStyle = tactic.color;
  ctx.globalAlpha = matched ? 0.78 : 0.36;
  ctx.lineWidth = matched ? 6 : 3;
  ctx.beginPath();
  ctx.arc(x - 10, y, 48 + pulse * 26, 0, Math.PI * 2);
  ctx.stroke();
  ctx.font = "900 14px Instrument Sans, system-ui, sans-serif";
  ctx.fillStyle = tactic.color;
  ctx.fillText(tactic.mark, x - 28, y - 56);
  ctx.restore();
}

function drawParticles(ctx) {
  state.particles.forEach(function (p) {
    ctx.globalAlpha = clamp(p.life / p.maxLife, 0, 1);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  });
}

function drawFloaters(ctx) {
  state.floaters.forEach(function (f) {
    ctx.globalAlpha = clamp(f.life / 44, 0, 1);
    ctx.fillStyle = f.color;
    ctx.font = "900 18px Space Grotesk, system-ui, sans-serif";
    ctx.fillText(f.text, f.x, f.y);
    ctx.globalAlpha = 1;
  });
}

function drawRoundBanner(ctx, width) {
  if (!state.isRunning || !state.activeHeroes[state.roundIndex]) return;
  if (state.roundFrame > 34) return;
  var hero = state.activeHeroes[state.roundIndex];
  var alpha = clamp(1 - state.roundFrame / 34, 0, 1);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "rgba(7,22,38,0.72)";
  roundRect(ctx, width / 2 - 155, 150, 310, 76, 16);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 18px Space Grotesk, system-ui, sans-serif";
  centerText(ctx, "ROUND " + (state.roundIndex + 1), width / 2, 181);
  ctx.font = "800 15px Instrument Sans, system-ui, sans-serif";
  centerText(ctx, hero.name + " - " + hero.power, width / 2, 205);
  ctx.restore();
}

function drawAttack(ctx, hero, sx, sy, tx, ty, progress) {
  var ease = progress * progress * (3 - 2 * progress);
  var headX = sx + (tx - sx) * ease;
  var headY = sy + (ty - sy) * ease;
  var wobble = Math.sin(state.frame * 0.4) * 8;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (hero.id === "flame") {
    for (var f = 0; f < 5; f++) {
      ctx.strokeStyle = f % 2 ? "#fb923c" : hero.color;
      ctx.lineWidth = 5 + f;
      ctx.beginPath();
      ctx.moveTo(sx, sy + f * 7);
      ctx.quadraticCurveTo((sx + headX) / 2, sy - 50 + wobble + f * 8, headX, headY + f * 4);
      ctx.stroke();
    }
  } else if (hero.id === "laser") {
    ctx.strokeStyle = "#fde68a";
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(headX, headY);
    ctx.stroke();
    ctx.strokeStyle = hero.color;
    ctx.lineWidth = 3;
    ctx.stroke();
  } else if (hero.id === "splash") {
    ctx.strokeStyle = hero.color;
    ctx.lineWidth = 5;
    for (var s = 0; s < 7; s++) {
      ctx.beginPath();
      ctx.moveTo(sx, sy + s * 5);
      ctx.lineTo(headX - s * 4, headY + s * 8 + wobble * 0.25);
      ctx.stroke();
    }
  } else if (hero.id === "acid") {
    ctx.fillStyle = hero.color;
    for (var a = 0; a < 10; a++) {
      var px = sx + (tx - sx) * clamp(ease - a * 0.05, 0, 1);
      var py = sy + (ty - sy) * clamp(ease - a * 0.05, 0, 1) + Math.sin(a + state.frame * 0.3) * 18;
      ctx.beginPath();
      ctx.arc(px, py, 5 + (a % 3), 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (hero.id === "bend") {
    ctx.strokeStyle = hero.color;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(headX - 20, headY, 26 + progress * 36, 0, Math.PI * 1.7);
    ctx.stroke();
  } else if (hero.id === "gravity") {
    ctx.fillStyle = hero.color;
    ctx.beginPath();
    ctx.arc(headX, headY - 55 * (1 - progress), 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.beginPath();
    ctx.ellipse(tx, ty + 72, 42 * progress, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (hero.id === "magnet") {
    ctx.strokeStyle = hero.color;
    ctx.lineWidth = 5;
    for (var m = 0; m < 3; m++) {
      ctx.beginPath();
      ctx.moveTo(sx, sy + m * 13);
      ctx.quadraticCurveTo((sx + headX) / 2, sy - 42 + m * 28, headX, headY + m * 6);
      ctx.stroke();
    }
  } else if (hero.id === "static") {
    ctx.strokeStyle = hero.color;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(headX - 34, headY - 20);
    ctx.lineTo(headX - 10, headY + 2);
    ctx.lineTo(headX - 38, headY + 20);
    ctx.lineTo(headX, headY);
    ctx.stroke();
  }

  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  var radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function centerText(ctx, text, x, y) {
  var width = ctx.measureText(text).width;
  ctx.fillText(text, x - width / 2, y);
}

function lighten(hex, amount) {
  return shiftColor(hex, amount);
}

function darken(hex, amount) {
  return shiftColor(hex, -amount);
}

function shiftColor(hex, amount) {
  var clean = hex.replace("#", "");
  if (clean.length !== 6) return hex;
  var r = parseInt(clean.slice(0, 2), 16);
  var g = parseInt(clean.slice(2, 4), 16);
  var b = parseInt(clean.slice(4, 6), 16);
  r = clamp(Math.round(r + (amount > 0 ? 255 - r : r) * amount), 0, 255);
  g = clamp(Math.round(g + (amount > 0 ? 255 - g : g) * amount), 0, 255);
  b = clamp(Math.round(b + (amount > 0 ? 255 - b : b) * amount), 0, 255);
  return "#" + toHex(r) + toHex(g) + toHex(b);
}

function toHex(value) {
  var text = value.toString(16);
  return text.length === 1 ? "0" + text : text;
}
