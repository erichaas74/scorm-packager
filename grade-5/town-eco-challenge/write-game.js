// Build script — writes the upgraded game.js
const fs = require('fs');
const code = `
/* ================================================================
   Save Our Town Challenge — Upgraded Game Engine
   ================================================================ */

// ── Constants ──
const STAT_KEYS = ["water", "air", "land", "business", "health"];
const STAT_LABELS = { water: "Water", air: "Air", land: "Land", business: "Business", health: "Health" };
const STAT_COLORS = { water: "#2a7de1", air: "#8db7d9", land: "#3ba55d", business: "#d38c00", health: "#d44f45", budget: "#2f8f4e" };
const TOTAL_ROUNDS = 5;
const ACTIONS_PER_ROUND = 8;
const BUDGET_INCOME = 10;        // income per round
const TIMER_SECONDS = 60;        // discussion timer
const DIFFICULTY_SCALE = 0.15;   // event multiplier per round

// ── Achievement definitions ──
const ACHIEVEMENTS = [
  { id: "clean-water",  icon: "💧", title: "Clean Water Champ",  test: function(t){ return t.water >= 85; } },
  { id: "green-lungs",  icon: "🌬️", title: "Green Lungs",        test: function(t){ return t.air >= 85; } },
  { id: "budget-master", icon: "💰", title: "Budget Master",     test: function(t){ return t.budget >= 60; } },
  { id: "balanced",     icon: "⚖️", title: "Balanced Town",      test: function(t){
    var vals = STAT_KEYS.map(function(k){ return t[k]; });
    var mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals);
    return mx - mn <= 15;
  }},
  { id: "earth-hero",   icon: "🌍", title: "Earth Hero",         test: function(t){
    return t.water>=70 && t.air>=70 && t.land>=70 && t.business>=50 && t.health>=60 && t.budget>=0;
  }},
  { id: "comeback",     icon: "🔥", title: "Comeback Kid",       test: function(t){ return false; } }  // set dynamically
];

// ── Event pool ──
const eventPool = [
  { id:"river-trash", tone:"harmful", title:"Trash in the River", description:"Trash is washing into the river and making the park look dirty.", effects:{water:-8,land:-4}, actionTags:["water","land","general"] },
  { id:"youth-volunteers", tone:"helpful", title:"Youth Volunteer Day", description:"A big group of student volunteers helps clean parks and streams across town.", effects:{land:6,water:4,health:2}, actionTags:["water","land","health","general"] },
  { id:"flash-flood", tone:"harmful", title:"Flash Flood", description:"A flash flood sends trash and dirty water into the river and park.", effects:{water:-15,land:-10}, actionTags:["water","land","health","general"] },
  { id:"festival-tradeoff", tone:"mixed", title:"Festival Tradeoff", description:"A big festival helped stores make money, but it left trash everywhere.", effects:{business:10,land:-12,water:-5}, actionTags:["business","land","water","general"] },
  { id:"state-grant", tone:"helpful", title:"State Cleanup Grant", description:"The town receives grant money to support health and cleanup before summer.", effects:{budget:15,health:4,water:3}, actionTags:["budget","health","water","general"] },
  { id:"busy-traffic", tone:"harmful", title:"Busy Traffic Week", description:"Extra cars and trucks are filling the air with smoke.", effects:{air:-8,health:-4,business:2}, actionTags:["air","health","business","general"] },
  { id:"factory-smoke", tone:"harmful", title:"Factory Smoke Burst", description:"The factory has a smoky week and nearby families complain.", effects:{air:-10,health:-6,business:3}, actionTags:["air","health","business","general"] },
  { id:"garden-donation", tone:"helpful", title:"Community Garden Donation", description:"A local group donates seeds, tools, and supplies to help the town grow greener.", effects:{land:7,health:5,business:3}, actionTags:["land","health","business","general"] },
  { id:"drought-warning", tone:"mixed", title:"Drought Warning", description:"Rain has been low, so the river and farms are under stress.", effects:{water:-12,land:-4,business:-6}, actionTags:["water","land","business","health","general"] },
  { id:"eco-tourism", tone:"helpful", title:"Eco-Tourism Weekend", description:"Visitors come to enjoy the town's outdoor spaces and local shops.", effects:{business:8,land:4,health:2,water:2}, actionTags:["business","land","health","water","general"] }
];

// ── Action pool ──
const actionPool = [
  { id:"trash-bins", title:"Add Trash and Recycling Bins", cost:10, effects:{land:10,water:5,business:5}, tone:"helpful", description:"A smart cleanup choice that helps the park and river and keeps downtown looking nice.", tags:["land","water","business","general"] },
  { id:"cleanup-day", title:"Community Cleanup Day", cost:8, effects:{land:8,water:4,health:2}, tone:"helpful", description:"Volunteers clean up litter quickly and make public spaces safer.", tags:["land","water","health","general"] },
  { id:"river-barriers", title:"Build River Cleanup Barriers", cost:18, effects:{water:15,land:5}, tone:"helpful", description:"A stronger fix that catches trash before it spreads farther down the river.", tags:["water","land","general"] },
  { id:"water-safety", title:"Water Testing and Safety Plan", cost:15, effects:{water:12,health:10}, tone:"helpful", description:"The water gets checked and families get clear safety information.", tags:["water","health","general"] },
  { id:"factory-filters", title:"Help Factory Install Cleaner Filters", cost:20, effects:{air:15,health:8,business:-5}, tone:"helpful", description:"Cleaner equipment improves the air, even if it costs businesses a little at first.", tags:["air","health","business","general"] },
  { id:"plant-trees", title:"Plant Trees Near Roads", cost:15, effects:{air:8,land:8,health:3}, tone:"helpful", description:"Trees make the town greener and help clean the air.", tags:["air","land","health","general"] },
  { id:"bike-lanes", title:"Bike Lanes and Walking Routes", cost:18, effects:{air:10,health:6,business:2}, tone:"helpful", description:"Cleaner travel options improve the air and can help local shops too.", tags:["air","health","business","general"] },
  { id:"compost-sorting", title:"Compost and Waste Sorting", cost:12, effects:{land:10,water:3,business:2}, tone:"helpful", description:"The town sorts waste the right way and keeps more trash out of nature.", tags:["land","water","business","general"] },
  { id:"green-awards", title:"Green Business Award Program", cost:10, effects:{business:8,land:5,air:3}, tone:"helpful", description:"Businesses get rewarded for cleaner choices, helping both jobs and the environment.", tags:["business","land","air","general"] },
  { id:"farm-training", title:"Safer Fertilizer Training", cost:12, effects:{water:10,land:5,business:2}, tone:"helpful", description:"Farmers learn ways to protect crops while sending less runoff into rivers.", tags:["water","land","business","general"] },
  { id:"storm-drains", title:"Upgrade Storm Drains", cost:20, effects:{water:8,land:6,health:2}, tone:"helpful", description:"A long-term fix that helps the town handle future storms better.", tags:["water","land","health","general"] },
  { id:"volunteer-rescue", title:"Volunteer River Rescue", cost:5, effects:{water:4,land:4,health:2}, tone:"helpful", description:"A fast, low-cost effort that helps right away, even if it is not a full solution.", tags:["water","land","health","general"] },
  { id:"education-campaign", title:"Pollution Education Campaign", cost:7, effects:{water:4,air:4,land:4,health:4}, tone:"helpful", description:"Teaching people about pollution helps a little in many places at once.", tags:["water","air","land","health","general"] },
  { id:"park-restoration", title:"Emergency Park Restoration", cost:14, effects:{land:15,business:3,health:2}, tone:"helpful", description:"Workers and volunteers clean the park fast so families can enjoy it again.", tags:["land","business","health","general"] },
  { id:"factory-repair", title:"Repair Factory Equipment Safely", cost:16, effects:{air:9,water:5,business:-2}, tone:"helpful", description:"Repairs cut smoke and dirty runoff before they spread farther.", tags:["air","water","business","general"] },
  { id:"farmers-market", title:"Reusable Farmers Market", cost:11, effects:{business:6,land:4,health:3}, tone:"helpful", description:"The town supports local sellers while cutting down on throwaway waste.", tags:["business","land","health","general"] },
  { id:"empty-lot", title:"Push the Trash to an Empty Lot", cost:4, effects:{land:-8,water:-2,business:3}, tone:"risky", description:"It hides the mess for now, but it makes land pollution worse.", tags:["land","water","business","general"] },
  { id:"do-nothing", title:"Do Nothing This Week", cost:0, effects:{water:-4,air:-4,land:-4,health:-4,business:2}, tone:"risky", description:"The town saves money today, but pollution keeps spreading.", tags:["general"] },
  { id:"idle-trucks", title:"Let Trucks Idle Longer", cost:0, effects:{air:-10,health:-5,business:6}, tone:"risky", description:"Deliveries move faster, but the smoky air gets worse.", tags:["air","health","business","general"] },
  { id:"dump-back", title:"Dump Dirty Water Back Into the River", cost:3, effects:{water:-10,health:-8,business:3}, tone:"risky", description:"It clears streets fast, but it badly pollutes the river.", tags:["water","health","business","general"] },
  { id:"cut-health", title:"Cut the Health Budget", cost:0, effects:{health:-10,business:5}, tone:"risky", description:"The town saves money for stores, but families lose support.", tags:["health","business","budget","general"] },
  { id:"cheap-decor", title:"Use Cheap Disposable Decorations", cost:2, effects:{land:-6,water:-4,business:4}, tone:"risky", description:"The event stays cheap, but it creates even more waste.", tags:["land","water","business","general"] },
  { id:"chemical-spray", title:"Spray Strong Chemicals Everywhere", cost:6, effects:{water:-7,land:-8,business:4}, tone:"risky", description:"It looks like a quick cleanup, but the chemicals hurt the land and water.", tags:["water","land","business","general"] },
  { id:"delay-repair", title:"Delay Factory Repairs", cost:0, effects:{air:-8,water:-3,business:5}, tone:"risky", description:"The factory keeps running now, but the pollution problem grows.", tags:["air","water","business","general"] },
  { id:"burn-trash", title:"Burn Trash Behind Town", cost:1, effects:{air:-12,health:-7,land:-2,business:2}, tone:"risky", description:"The piles disappear fast, but the smoky air harms people.", tags:["air","health","land","general"] },
  { id:"skip-recycling", title:"Skip Recycling Pickup", cost:0, effects:{land:-9,water:-3,budget:3}, tone:"risky", description:"The town saves a little money now, but waste stacks up everywhere.", tags:["land","water","budget","general"] },
  { id:"remove-trees", title:"Pave Over Green Space", cost:4, effects:{land:-10,air:-6,business:6}, tone:"risky", description:"More parking may help shops for a moment, but the town gets hotter and dirtier.", tags:["land","air","business","general"] },
  { id:"ignore-volunteers", title:"Use Volunteers Only for Ads", cost:2, effects:{business:6,land:-4,health:-2}, tone:"risky", description:"Stores get attention, but the cleanup effort is mostly wasted.", tags:["business","land","health","general"] },
  { id:"pump-groundwater", title:"Pump Extra Water Without Limits", cost:5, effects:{water:-9,business:5,land:-3}, tone:"risky", description:"It helps businesses today, but it drains the town's water supply.", tags:["water","business","land","general"] },
  { id:"close-park-trash", title:"Fence Off the Dirty Park", cost:3, effects:{health:-4,land:-5,business:-2,budget:2}, tone:"risky", description:"Closing the park hides the problem instead of fixing it.", tags:["land","health","budget","business","general"] }
];

// ── DOM ──
var canvas = document.getElementById("gameCanvas");
var ctx = canvas.getContext("2d");

var els = {
  roundLabel: document.getElementById("roundLabel"),
  phaseLabel: document.getElementById("phaseLabel"),
  eventTitle: document.getElementById("eventTitle"),
  eventDescription: document.getElementById("eventDescription"),
  eventEffects: document.getElementById("eventEffects"),
  leaderText: document.getElementById("leaderText"),
  scorePreview: document.getElementById("scorePreview"),
  actionsGrid: document.getElementById("actionsGrid"),
  actionPrompt: document.getElementById("actionPrompt"),
  turnPrompt: document.getElementById("turnPrompt"),
  historyLog: document.getElementById("historyLog"),
  startBtn: document.getElementById("startBtn"),
  nextRoundBtn: document.getElementById("nextRoundBtn"),
  resetBtn: document.getElementById("resetBtn"),
  applyNamesBtn: document.getElementById("applyNamesBtn"),
  town1Name: document.getElementById("town1Name"),
  town2Name: document.getElementById("town2Name"),
  rolesTown1: document.getElementById("rolesTown1"),
  rolesTown2: document.getElementById("rolesTown2"),
  timerLabel: document.getElementById("timerLabel"),
  timerBar: document.getElementById("timerBar"),
  timerBtn: document.getElementById("timerBtn"),
  timerWrap: document.getElementById("timerWrap"),
  reportCard: document.getElementById("reportCard"),
  reportBody: document.getElementById("reportBody"),
  closeReportBtn: document.getElementById("closeReportBtn")
};

// ── State ──
var gameState;
var floatingTexts = [];
var smokeParticles = [];
var animationFrame;
var frameCount = 0;

// Animated display values for lerp bars
var displayStats = [{}, {}];

// Timer
var timerInterval = null;
var timerRemaining = 0;

// Audio
var audioCtx = null;
var audioUnlocked = false;

function unlockAudio() {
  if (audioUnlocked) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  audioUnlocked = true;
}

function playTone(freq, duration, type) {
  if (!audioCtx) return;
  var osc = audioCtx.createOscillator();
  var gain = audioCtx.createGain();
  osc.type = type || "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

function sfxGain()   { playTone(600, 0.18, "sine"); setTimeout(function(){ playTone(800, 0.15, "sine"); }, 80); }
function sfxLoss()   { playTone(300, 0.25, "sawtooth"); }
function sfxCoin()   { playTone(1200, 0.08, "square"); setTimeout(function(){ playTone(1600, 0.1, "square"); }, 60); }
function sfxTick()   { playTone(1000, 0.04, "square"); }
function sfxFanfare(){ playTone(523,0.15,"sine"); setTimeout(function(){playTone(659,0.15,"sine");},120); setTimeout(function(){playTone(784,0.25,"sine");},240); }

// ── Helpers ──
function createTown(name) {
  return { name:name, water:50, air:55, land:45, business:75, health:60, budget:100 };
}
function calculateScore(t) { return t.water + t.air + t.land + t.business + t.health + t.budget; }
function clampTown(t) {
  STAT_KEYS.forEach(function(k){ t[k] = Math.max(0, Math.min(100, t[k])); });
  t.budget = Math.max(0, Math.min(150, t.budget));
}
function formatEffects(e) {
  return Object.keys(e).map(function(k){ var v=e[k]; return (STAT_LABELS[k]||"Budget")+" "+(v>0?"+":"")+v; }).join(", ");
}
function getEventToneLabel(tone) {
  if (tone==="helpful") return "Helpful event";
  if (tone==="mixed") return "Mixed event";
  return "Harmful event";
}
function getEventToneSentence(tone) {
  if (tone==="helpful") return "This round starts with something good for both towns.";
  if (tone==="mixed") return "This round has both a benefit and a problem for both towns.";
  return "This round starts with a problem that hurts both towns.";
}
function shuffle(arr) {
  var c=[].concat(arr);
  for (var i=c.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var tmp=c[i]; c[i]=c[j]; c[j]=tmp; }
  return c;
}
function pickN(arr,n){ return shuffle(arr).slice(0,n); }
function actionMatchesEvent(a,e){ if(!a.tags||a.tags.indexOf("general")>=0) return true; return a.tags.some(function(t){ return e.actionTags.indexOf(t)>=0; }); }

// Scale event effects by round for escalating difficulty
function scaleEffects(effects, roundIndex) {
  var mult = 1 + roundIndex * DIFFICULTY_SCALE;
  var scaled = {};
  Object.keys(effects).forEach(function(k){ scaled[k] = Math.round(effects[k] * mult); });
  return scaled;
}

function buildActionOptions(event) {
  var matching = actionPool.filter(function(a){ return actionMatchesEvent(a, event); });
  var helpful = matching.filter(function(a){ return a.tone==="helpful"; });
  var risky = matching.filter(function(a){ return a.tone==="risky"; });
  var selH = pickN(helpful, Math.min(4, helpful.length));
  var selR = pickN(risky, Math.min(4, risky.length));
  if (selH.length < 4) {
    var extra = pickN(actionPool.filter(function(a){ return a.tone==="helpful" && !selH.some(function(s){return s.id===a.id;}); }), 4-selH.length);
    selH = selH.concat(extra);
  }
  if (selR.length < 4) {
    var extra2 = pickN(actionPool.filter(function(a){ return a.tone==="risky" && !selR.some(function(s){return s.id===a.id;}); }), 4-selR.length);
    selR = selR.concat(extra2);
  }
  var combined = selH.slice(0,4).concat(selR.slice(0,4));
  return shuffle(combined).map(function(a){ return JSON.parse(JSON.stringify(a)); });
}

function buildRoundDeck() {
  return pickN(eventPool, TOTAL_ROUNDS).map(function(ev,i){
    var copy = JSON.parse(JSON.stringify(ev));
    copy.effects = scaleEffects(copy.effects, i);
    copy.actions = buildActionOptions(copy);
    return copy;
  });
}

// ── Per-round snapshots (for report card) ──
function takeSnapshot() {
  return gameState.towns.map(function(t){ var s={}; STAT_KEYS.forEach(function(k){s[k]=t[k];}); s.budget=t.budget; s.score=calculateScore(t); return s; });
}

// ── Timer ──
function startTimer() {
  stopTimer();
  timerRemaining = TIMER_SECONDS;
  els.timerLabel.textContent = timerRemaining + "s";
  els.timerBar.style.width = "100%";
  els.timerWrap.classList.remove("hidden");
  timerInterval = setInterval(function(){
    timerRemaining--;
    if (timerRemaining <= 0) {
      stopTimer();
      autoDoNothing();
      return;
    }
    els.timerLabel.textContent = timerRemaining + "s";
    els.timerBar.style.width = (timerRemaining / TIMER_SECONDS * 100) + "%";
    if (timerRemaining <= 10) sfxTick();
  }, 1000);
}

function stopTimer() {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  els.timerWrap.classList.add("hidden");
}

function autoDoNothing() {
  // find "Do Nothing" action or pick first
  if (!gameState.currentRound || !["choose1","choose2"].includes(gameState.phase)) return;
  var idx = 0;
  gameState.currentRound.actions.forEach(function(a, i){ if (a.id === "do-nothing") idx = i; });
  chooseAction(idx);
}

// ── Smoke particles ──
function spawnSmoke(baseX, baseY, count) {
  for (var i = 0; i < count; i++) {
    smokeParticles.push({
      x: baseX + Math.random() * 30 - 15,
      y: baseY,
      vx: Math.random() * 0.6 - 0.3,
      vy: -(0.3 + Math.random() * 0.5),
      r: 8 + Math.random() * 14,
      life: 80 + Math.floor(Math.random() * 60),
      maxLife: 140
    });
  }
}

function updateSmokeParticles() {
  smokeParticles = smokeParticles.filter(function(p){ return p.life > 0; });
  smokeParticles.forEach(function(p){
    p.x += p.vx + Math.sin(frameCount * 0.03 + p.r) * 0.15;
    p.y += p.vy;
    p.r += 0.05;
    p.life--;
  });
}

// ── Game state ──
function resetGame() {
  unlockAudio();
  var town1 = els.town1Name.value.trim() || "Green Valley";
  var town2 = els.town2Name.value.trim() || "Blue River";
  gameState = {
    roundIndex: -1,
    phase: "ready",
    towns: [createTown(town1), createTown(town2)],
    roundDeck: buildRoundDeck(),
    currentRound: null,
    activeTownIndex: null,
    history: [],
    winner: null,
    snapshots: [],          // per-round snapshots
    choices: [[],[]],       // action ids chosen per town per round
    bothHelpful: 0,         // chain combo tracker
    bothRisky: 0,
    lowestScore: [null,null] // for comeback detection
  };
  // init display stats
  displayStats = gameState.towns.map(function(t){
    var d = {}; STAT_KEYS.forEach(function(k){ d[k]=t[k]; }); d.budget=t.budget;
    return d;
  });
  // take initial snapshot
  gameState.snapshots.push(takeSnapshot());
  floatingTexts = [];
  smokeParticles = [];
  stopTimer();
  els.rolesTown1.textContent = town1;
  els.rolesTown2.textContent = town2;
  els.roundLabel.textContent = "Not started";
  els.phaseLabel.textContent = "Press Start Game";
  els.eventTitle.textContent = "Ready to begin";
  els.eventDescription.textContent = "Start the game to reveal 1 of " + eventPool.length + " random events. Each round will also show " + ACTIONS_PER_ROUND + " random action choices.";
  els.eventEffects.textContent = "";
  els.leaderText.textContent = "No leader yet";
  els.scorePreview.textContent = "Final score = Water + Air + Land + Business + Health + Budget left";
  els.turnPrompt.textContent = "Teams will choose actions here.";
  els.actionPrompt.textContent = "Random action choices will appear after an event is revealed.";
  els.historyLog.innerHTML = "";
  els.actionsGrid.innerHTML = "";
  els.startBtn.disabled = false;
  els.nextRoundBtn.disabled = true;
  els.reportCard.classList.add("hidden");
  render();
}

function addHistory(text) {
  var item = document.createElement("div");
  item.className = "history-item";
  item.innerHTML = text;
  els.historyLog.prepend(item);
}

function startGame() {
  if (gameState.phase !== "ready") return;
  unlockAudio();
  els.startBtn.disabled = true;
  nextRound();
}

function nextRound() {
  if (gameState.phase === "gameOver") return;
  gameState.roundIndex++;
  if (gameState.roundIndex >= gameState.roundDeck.length) { finishGame(); return; }

  // Budget income
  gameState.towns.forEach(function(t, i){
    var before = t.budget;
    t.budget = Math.min(150, t.budget + BUDGET_INCOME);
    var delta = t.budget - before;
    if (delta > 0) {
      var panel = i===0 ? {x:24,y:54,w:636,h:620} : {x:700,y:54,w:636,h:620};
      floatingTexts.push({ x:panel.x+panel.w-160, y:panel.y+90, text:"Tax Revenue +$"+delta, color:"#2f8f4e", life:100 });
    }
  });

  var round = JSON.parse(JSON.stringify(gameState.roundDeck[gameState.roundIndex]));
  gameState.currentRound = round;
  gameState.phase = "choose1";
  gameState.activeTownIndex = 0;

  applyEffectsToTown(gameState.towns[0], round.effects, 0);
  applyEffectsToTown(gameState.towns[1], round.effects, 1);

  // Track lowest score for comeback
  gameState.towns.forEach(function(t,i){
    var s = calculateScore(t);
    if (gameState.lowestScore[i] === null || s < gameState.lowestScore[i]) gameState.lowestScore[i] = s;
  });

  els.roundLabel.textContent = "Round " + (gameState.roundIndex+1) + " of " + gameState.roundDeck.length;
  els.phaseLabel.textContent = "Random event applied";
  els.eventTitle.textContent = round.title + " (" + getEventToneLabel(round.tone) + ")";
  els.eventDescription.textContent = round.description + " " + getEventToneSentence(round.tone);
  els.eventEffects.textContent = formatEffects(round.effects);
  els.turnPrompt.textContent = gameState.towns[0].name + " chooses first.";
  els.actionPrompt.textContent = "Choose 1 of " + round.actions.length + " actions for " + gameState.towns[0].name + ".";
  els.nextRoundBtn.disabled = true;

  addHistory('<span class="highlight">Round ' + (gameState.roundIndex+1) + ' event:</span> ' + round.title + ' - ' + getEventToneLabel(round.tone) + ' (' + formatEffects(round.effects) + ')');
  renderActions();
  updateLeaderText();
  startTimer();
  render();
}

function applyEffectsToTown(town, effects, townIndex) {
  var before = {}; Object.keys(town).forEach(function(k){ before[k]=town[k]; });
  Object.keys(effects).forEach(function(k){ town[k] += effects[k]; });
  clampTown(town);

  var panel = townIndex===0 ? {x:24,y:54,w:636,h:620} : {x:700,y:54,w:636,h:620};
  var offset = 0;
  var hasGain = false, hasLoss = false;
  STAT_KEYS.concat(["budget"]).forEach(function(k){
    var delta = town[k] - (before[k]||0);
    if (delta !== 0) {
      floatingTexts.push({ x:panel.x+panel.w-160, y:panel.y+120+offset, text:(k==="budget"?"Budget":STAT_LABELS[k])+" "+(delta>0?"+":"")+delta, color:delta>0?"#2f8f4e":"#d44f45", life:120 });
      offset += 28;
      if (delta > 0) hasGain = true; else hasLoss = true;
    }
  });
  if (hasGain && !hasLoss) sfxGain();
  else if (hasLoss) sfxLoss();
}

function chooseAction(actionIndex) {
  if (!["choose1","choose2"].includes(gameState.phase)) return;
  unlockAudio();
  stopTimer();
  var townIndex = gameState.activeTownIndex;
  var town = gameState.towns[townIndex];
  var action = gameState.currentRound.actions[actionIndex];
  if (town.budget < action.cost) return;

  sfxCoin();
  town.budget -= action.cost;
  applyEffectsToTown(town, action.effects, townIndex);
  gameState.choices[townIndex].push(action.id);

  addHistory('<span class="highlight">' + town.name + '</span> chose <strong>' + action.title + '</strong> for $' + action.cost);

  if (gameState.phase === "choose1") {
    gameState.phase = "choose2";
    gameState.activeTownIndex = 1;
    els.turnPrompt.textContent = gameState.towns[1].name + " chooses now.";
    els.actionPrompt.textContent = "Choose 1 of " + gameState.currentRound.actions.length + " actions for " + gameState.towns[1].name + ".";
    els.phaseLabel.textContent = gameState.towns[0].name + " has chosen.";
    startTimer();
  } else {
    gameState.phase = "roundComplete";
    gameState.activeTownIndex = null;

    // Chain reaction check
    var lastC0 = gameState.choices[0][gameState.choices[0].length-1];
    var lastC1 = gameState.choices[1][gameState.choices[1].length-1];
    var a0 = actionPool.find(function(a){return a.id===lastC0;});
    var a1 = actionPool.find(function(a){return a.id===lastC1;});
    if (a0 && a1 && a0.tone==="helpful" && a1.tone==="helpful") {
      gameState.bothHelpful++;
      var bonus = {}, bonusKey = STAT_KEYS[Math.floor(Math.random()*STAT_KEYS.length)];
      bonus[bonusKey] = 3;
      applyEffectsToTown(gameState.towns[0], bonus, 0);
      applyEffectsToTown(gameState.towns[1], bonus, 1);
      addHistory('<span class="highlight">Community Spirit!</span> Both towns chose helpful actions — +3 ' + STAT_LABELS[bonusKey] + ' bonus!');
    } else if (a0 && a1 && a0.tone==="risky" && a1.tone==="risky") {
      gameState.bothRisky++;
      var penalty = {}, penKey = STAT_KEYS[Math.floor(Math.random()*STAT_KEYS.length)];
      penalty[penKey] = -3;
      applyEffectsToTown(gameState.towns[0], penalty, 0);
      applyEffectsToTown(gameState.towns[1], penalty, 1);
      addHistory('<span class="highlight">Both Suffered!</span> Both towns chose risky actions — −3 ' + STAT_LABELS[penKey] + ' penalty.');
    }

    // Take snapshot
    gameState.snapshots.push(takeSnapshot());

    els.turnPrompt.textContent = "Both towns chose. Compare results, then press Next Round.";
    els.actionPrompt.textContent = "Round complete. Press Next Round to continue.";
    els.phaseLabel.textContent = "Round complete";
    els.nextRoundBtn.disabled = false;
  }

  renderActions();
  updateLeaderText();
  render();
}

function updateLeaderText() {
  var t1=gameState.towns[0], t2=gameState.towns[1];
  var s1=calculateScore(t1), s2=calculateScore(t2);
  if (gameState.phase==="ready") return;
  if (s1===s2) { els.leaderText.textContent="Tied at "+s1; els.scorePreview.textContent=t1.name+" and "+t2.name+" are even."; }
  else if (s1>s2) { els.leaderText.textContent=t1.name+" by "+(s1-s2); els.scorePreview.textContent=t1.name+" has cleaner or stronger systems right now."; }
  else { els.leaderText.textContent=t2.name+" by "+(s2-s1); els.scorePreview.textContent=t2.name+" has cleaner or stronger systems right now."; }
}

function finishGame() {
  gameState.phase = "gameOver";
  stopTimer();
  sfxFanfare();
  var t1=gameState.towns[0], t2=gameState.towns[1];
  var s1=calculateScore(t1), s2=calculateScore(t2);
  if (s1===s2) { gameState.winner=null; els.leaderText.textContent="Tie game at "+s1; els.scorePreview.textContent="Both towns finished with the same score."; }
  else { gameState.winner=s1>s2?t1.name:t2.name; els.leaderText.textContent=gameState.winner+" wins!"; els.scorePreview.textContent=t1.name+": "+s1+" | "+t2.name+": "+s2; }
  els.roundLabel.textContent = "Game complete";
  els.phaseLabel.textContent = "Final scores ready";
  els.eventTitle.textContent = "Town Report Complete";
  els.eventDescription.textContent = "This game used " + gameState.roundDeck.length + " random events from a deck of " + eventPool.length + ".";
  els.eventEffects.textContent = "";
  els.turnPrompt.textContent = "Press Reset Game to play again with a new random deck.";
  els.actionPrompt.textContent = "Game over — view Report Card below.";
  els.actionsGrid.innerHTML = "";
  els.nextRoundBtn.disabled = true;
  addHistory('<span class="highlight">Game over.</span> ' + t1.name + ' scored ' + s1 + '. ' + t2.name + ' scored ' + s2 + '.');
  buildReportCard();
  render();
}

// ── Report Card ──
function buildReportCard() {
  var html = "";
  gameState.towns.forEach(function(t, ti) {
    var s = calculateScore(t);
    var rating = getTownRating(t);

    // Achievements
    var earned = [];
    ACHIEVEMENTS.forEach(function(a){
      if (a.id === "comeback") {
        // check if final score is > lowest + 80
        if (gameState.lowestScore[ti] !== null && s - gameState.lowestScore[ti] >= 80) earned.push(a);
      } else {
        if (a.test(t)) earned.push(a);
      }
    });

    // Letter grades per stat
    function grade(v) { if(v>=85) return "A"; if(v>=70) return "B"; if(v>=55) return "C"; if(v>=40) return "D"; return "F"; }

    html += '<div class="report-town"><h3>' + t.name + '</h3>';
    html += '<div class="report-score">Final Score: <strong>' + s + '</strong> — ' + rating + '</div>';
    html += '<div class="report-grades">';
    STAT_KEYS.forEach(function(k){ html += '<span class="report-grade grade-' + grade(t[k]).toLowerCase() + '">' + STAT_LABELS[k] + ': ' + grade(t[k]) + ' (' + t[k] + ')</span>'; });
    html += '<span class="report-grade grade-' + (t.budget>=60?'a':t.budget>=30?'c':'f') + '">Budget: $' + t.budget + '</span>';
    html += '</div>';

    // Stat history sparkline via text
    html += '<div class="report-history"><strong>Score by round:</strong> ';
    gameState.snapshots.forEach(function(snap, ri){
      html += (ri===0?"Start":"R"+ri) + ": " + snap[ti].score + (ri<gameState.snapshots.length-1?" → ":"");
    });
    html += '</div>';

    // Achievements
    if (earned.length > 0) {
      html += '<div class="report-badges">';
      earned.forEach(function(a){ html += '<span class="badge">' + a.icon + ' ' + a.title + '</span>'; });
      html += '</div>';
    }
    html += '</div>';
  });

  // Chain bonuses summary
  if (gameState.bothHelpful > 0 || gameState.bothRisky > 0) {
    html += '<div class="report-chain">';
    if (gameState.bothHelpful > 0) html += '💚 Community Spirit bonus triggered ' + gameState.bothHelpful + ' time(s). ';
    if (gameState.bothRisky > 0)   html += '⚠️ Both Suffered penalty triggered ' + gameState.bothRisky + ' time(s).';
    html += '</div>';
  }

  els.reportBody.innerHTML = html;
  els.reportCard.classList.remove("hidden");
}

// ── Action rendering (hidden effects) ──
function renderActions() {
  els.actionsGrid.innerHTML = "";
  if (!gameState.currentRound || !["choose1","choose2"].includes(gameState.phase)) return;
  var town = gameState.towns[gameState.activeTownIndex];
  gameState.currentRound.actions.forEach(function(action, index){
    var btn = document.createElement("button");
    btn.className = "action-btn " + (action.tone==="helpful"?"helpful-action":"risky-action");
    btn.disabled = town.budget < action.cost;
    var label = action.tone==="helpful" ? "Helpful choice" : "Risky choice";
    btn.innerHTML =
      '<div class="action-type ' + (action.tone==="helpful"?"action-type-helpful":"action-type-risky") + '">' + label + '</div>' +
      '<strong>' + action.title + '</strong>' +
      '<div class="action-cost">Cost: $' + action.cost + '</div>' +
      '<div class="action-desc">' + (action.description||"") + '</div>' +
      '<div class="action-effects hidden-fx">Effects revealed after choosing</div>';
    btn.addEventListener("click", function(){ chooseAction(index); });
    els.actionsGrid.appendChild(btn);
  });
}

function getTownRating(town) {
  var g = (town.water>=70)+(town.air>=70)+(town.land>=70)+(town.business>=50)+(town.health>=60)+(town.budget>=0);
  if (g>=6) return "Earth Hero Town 🌍";
  if (g>=4) return "Growing Green Town 🌱";
  return "Needs More Action ⚠️";
}

// ════════════════════════════════════════════
// ── CANVAS DRAWING ──
// ════════════════════════════════════════════

function lerpDisplayStats() {
  gameState.towns.forEach(function(t, i) {
    STAT_KEYS.forEach(function(k){
      if (displayStats[i][k] === undefined) displayStats[i][k] = t[k];
      displayStats[i][k] += (t[k] - displayStats[i][k]) * 0.12;
    });
    if (displayStats[i].budget === undefined) displayStats[i].budget = t.budget;
    displayStats[i].budget += (t.budget - displayStats[i].budget) * 0.12;
  });
}

function drawTownPanel(town, x, y, w, h, isActive, townIndex) {
  ctx.save();

  // Pulsing glow for active town
  if (isActive) {
    var pulse = 10 + Math.sin(frameCount * 0.06) * 6;
    ctx.shadowColor = "rgba(42, 125, 225, 0.45)";
    ctx.shadowBlur = pulse;
  }

  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = isActive ? "#2a7de1" : "#c9d9e6";
  ctx.lineWidth = isActive ? 5 : 2;
  roundRect(ctx, x, y, w, h, 24, true, true);
  ctx.shadowBlur = 0;
  ctx.shadowColor = "transparent";

  ctx.fillStyle = "#16324f";
  ctx.font = "bold 28px Arial";
  ctx.fillText(town.name, x+24, y+40);

  var score = calculateScore(town);
  ctx.fillStyle = "#5c7288";
  ctx.font = "20px Arial";
  ctx.fillText("Score: "+score, x+w-145, y+40);

  drawTownScene(town, x+20, y+60, w-40, 280, townIndex);

  var barY = y + 370;
  STAT_KEYS.forEach(function(key){
    var dv = displayStats[townIndex] ? displayStats[townIndex][key] : town[key];
    drawBar(x+24, barY, w-48, 28, key, town[key], dv);
    barY += 48;
  });

  // Budget pill
  var dispBudget = displayStats[townIndex] ? Math.round(displayStats[townIndex].budget) : town.budget;
  ctx.fillStyle = "#edf6ee";
  roundRect(ctx, x+24, y+h-74, 180, 42, 14, true, false);
  ctx.fillStyle = STAT_COLORS.budget;
  ctx.font = "bold 24px Arial";
  ctx.fillText("Budget: $"+dispBudget, x+40, y+h-45);

  ctx.fillStyle = "#5c7288";
  ctx.font = "bold 20px Arial";
  ctx.fillText(getTownRating(town), x+232, y+h-45);
  ctx.restore();
}

function drawTownScene(town, x, y, w, h, townIndex) {
  // ── Sky gradient based on air quality ──
  var skyGrad = ctx.createLinearGradient(x, y, x, y + h * 0.55);
  if (town.air >= 65) {
    skyGrad.addColorStop(0, "#a8d8ff");
    skyGrad.addColorStop(1, "#dff1ff");
  } else if (town.air >= 40) {
    skyGrad.addColorStop(0, "#c4c9d2");
    skyGrad.addColorStop(1, "#dde3e8");
  } else {
    skyGrad.addColorStop(0, "#8e8e8e");
    skyGrad.addColorStop(1, "#b8b0a8");
  }
  ctx.fillStyle = skyGrad;
  ctx.fillRect(x, y, w, h * 0.55);

  // ── Distant hills ──
  ctx.fillStyle = town.land >= 50 ? "rgba(120,190,100,0.25)" : "rgba(150,140,120,0.2)";
  ctx.beginPath();
  ctx.moveTo(x, y + h * 0.42);
  ctx.bezierCurveTo(x + w*0.2, y + h*0.28, x + w*0.4, y + h*0.38, x + w*0.6, y + h*0.30);
  ctx.bezierCurveTo(x + w*0.8, y + h*0.22, x + w*0.95, y + h*0.35, x + w, y + h*0.42);
  ctx.lineTo(x + w, y + h*0.55);
  ctx.lineTo(x, y + h*0.55);
  ctx.closePath();
  ctx.fill();

  // ── Sun / warning icon ──
  var sunX = x + w - 50, sunY = y + 36;
  if (town.air >= 50 && town.water >= 40) {
    ctx.fillStyle = "#ffe566";
    ctx.beginPath(); ctx.arc(sunX, sunY, 18, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "#ffd500";
    for (var r = 0; r < 8; r++) {
      var ang = r * Math.PI/4 + frameCount*0.01;
      ctx.fillRect(sunX + Math.cos(ang)*24 - 2, sunY + Math.sin(ang)*24 - 2, 5, 5);
    }
  } else {
    // warning triangle
    ctx.fillStyle = "#e8a030";
    ctx.beginPath();
    ctx.moveTo(sunX, sunY - 16);
    ctx.lineTo(sunX + 16, sunY + 12);
    ctx.lineTo(sunX - 16, sunY + 12);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 16px Arial";
    ctx.fillText("!", sunX - 4, sunY + 8);
  }

  // ── Clouds ──
  var cloudAlpha = town.air >= 65 ? 0.4 : town.air >= 40 ? 0.55 : 0.7;
  ctx.fillStyle = town.air >= 50 ? "rgba(255,255,255,"+cloudAlpha+")" : "rgba(160,160,160,"+cloudAlpha+")";
  drawCloud(x + 80 + Math.sin(frameCount*0.005)*8, y + 30);
  drawCloud(x + 280 + Math.sin(frameCount*0.004+1)*10, y + 50);
  if (w > 400) drawCloud(x + 460 + Math.sin(frameCount*0.006+2)*6, y + 25);

  // ── Land ──
  var landHue = town.land >= 60 ? "#8dcf72" : town.land >= 35 ? "#b4c96b" : "#a08d64";
  ctx.fillStyle = landHue;
  ctx.fillRect(x, y + h*0.52, w, h*0.48);

  // ── Road ──
  ctx.fillStyle = "#59636e";
  ctx.fillRect(x + w*0.42, y + h*0.58, w*0.5, 34);
  ctx.strokeStyle = "#f6e08a";
  ctx.lineWidth = 3;
  ctx.setLineDash([18, 12]);
  ctx.beginPath();
  ctx.moveTo(x + w*0.45, y + h*0.75);
  ctx.lineTo(x + w*0.88, y + h*0.75);
  ctx.stroke();
  ctx.setLineDash([]);

  // ── Animated water ──
  var waterColor = town.water >= 65 ? "#54c2ff" : town.water >= 40 ? "#4f8ec9" : "#62727f";
  ctx.fillStyle = waterColor;
  var waveOff = frameCount * 0.03;
  ctx.beginPath();
  ctx.moveTo(x, y + h*0.62 + Math.sin(waveOff)*4);
  ctx.bezierCurveTo(x+90, y+h*0.52+Math.sin(waveOff+1)*5, x+220, y+h*0.78+Math.sin(waveOff+2)*4, x+320, y+h*0.7+Math.sin(waveOff+3)*3);
  ctx.bezierCurveTo(x+420, y+h*0.62+Math.sin(waveOff+4)*5, x+520, y+h*0.9+Math.sin(waveOff+5)*3, x+w, y+h*0.8+Math.sin(waveOff+6)*4);
  ctx.lineTo(x+w, y+h);
  ctx.lineTo(x, y+h);
  ctx.closePath();
  ctx.fill();
  // Water ripple highlights
  if (town.water >= 40) {
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 2;
    for (var ri = 0; ri < 3; ri++) {
      var rx = x + 100 + ri*150 + Math.sin(frameCount*0.02+ri)*10;
      var ry = y + h*0.78 + ri*12 + Math.sin(frameCount*0.04+ri)*3;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx+30, ry-2);
      ctx.stroke();
    }
  }

  // ── Factory ──
  var factoryX = x + 44;
  var factoryY = y + h*0.42;
  ctx.fillStyle = "#9aa4ad";
  ctx.fillRect(factoryX, factoryY, 100, 110);
  // Roof
  ctx.fillStyle = "#7d8892";
  ctx.beginPath();
  ctx.moveTo(factoryX - 5, factoryY);
  ctx.lineTo(factoryX + 50, factoryY - 20);
  ctx.lineTo(factoryX + 105, factoryY);
  ctx.closePath();
  ctx.fill();
  // Chimneys
  ctx.fillStyle = "#7d8892";
  ctx.fillRect(factoryX + 70, factoryY - 45, 20, 45);
  ctx.fillRect(factoryX + 28, factoryY - 25, 16, 25);
  // Windows
  ctx.fillStyle = "#c8d3dc";
  ctx.fillRect(factoryX + 10, factoryY + 20, 22, 18);
  ctx.fillRect(factoryX + 40, factoryY + 20, 22, 18);
  ctx.fillRect(factoryX + 70, factoryY + 20, 22, 18);
  // Door
  ctx.fillStyle = "#6b7580";
  ctx.fillRect(factoryX + 38, factoryY + 70, 28, 40);

  // Animated smoke particles
  if (town.air < 60) {
    if (frameCount % 8 === 0) {
      spawnSmoke(factoryX + 80, factoryY - 50, 1);
      if (town.air < 40) spawnSmoke(factoryX + 38, factoryY - 30, 1);
    }
  }

  // ── Buildings / stores with pitched roofs ──
  var storeX = x + w - 250;
  var storeY = y + h*0.4;
  // Store 1 — yellow shop
  ctx.fillStyle = town.business >= 50 ? "#ffcb69" : "#bca98b";
  ctx.fillRect(storeX, storeY, 88, 92);
  // pitched roof
  ctx.fillStyle = town.business >= 50 ? "#e6a830" : "#a08868";
  ctx.beginPath(); ctx.moveTo(storeX-4,storeY); ctx.lineTo(storeX+44,storeY-18); ctx.lineTo(storeX+92,storeY); ctx.closePath(); ctx.fill();
  // windows
  ctx.fillStyle = "#fff5cf";
  ctx.fillRect(storeX+12, storeY+18, 24, 24);
  ctx.fillRect(storeX+52, storeY+18, 24, 24);
  // door
  ctx.fillStyle = "#a07030";
  ctx.fillRect(storeX+32, storeY+60, 24, 32);
  // awning
  ctx.fillStyle = town.business >= 50 ? "#d95f4e" : "#997766";
  ctx.beginPath(); ctx.moveTo(storeX+8,storeY+14); ctx.lineTo(storeX+80,storeY+14); ctx.lineTo(storeX+76,storeY+24); ctx.lineTo(storeX+12,storeY+24); ctx.closePath(); ctx.fill();
  // sign
  if (town.business >= 50) {
    ctx.fillStyle = "#fff";
    ctx.font = "bold 10px Arial";
    ctx.fillText("SHOP", storeX+26, storeY-4);
  }

  // Store 2 — red store
  ctx.fillStyle = town.business >= 50 ? "#d95f4e" : "#997766";
  ctx.fillRect(storeX+96, storeY+12, 86, 80);
  // pitched roof
  ctx.fillStyle = town.business >= 50 ? "#b84a3c" : "#886655";
  ctx.beginPath(); ctx.moveTo(storeX+92,storeY+12); ctx.lineTo(storeX+139,storeY-6); ctx.lineTo(storeX+186,storeY+12); ctx.closePath(); ctx.fill();
  // windows
  ctx.fillStyle = "#fff5cf";
  ctx.fillRect(storeX+108, storeY+24, 26, 22);
  ctx.fillRect(storeX+146, storeY+24, 26, 22);
  // door
  ctx.fillStyle = "#6b3328";
  ctx.fillRect(storeX+126, storeY+58, 22, 34);
  // boarded up if struggling
  if (town.business < 50) {
    ctx.fillStyle = "#6f5846";
    ctx.fillRect(storeX+18, storeY+60, 56, 10);
    ctx.fillRect(storeX+118, storeY+58, 52, 10);
  }

  // ── Health clinic (small building with cross) ──
  var clinicX = x + w - 118;
  var clinicY = y + h*0.58;
  ctx.fillStyle = "#f4f7fb";
  ctx.fillRect(clinicX, clinicY, 72, 64);
  ctx.strokeStyle = "#c6d4e2";
  ctx.strokeRect(clinicX, clinicY, 72, 64);
  // pitched roof
  ctx.fillStyle = "#e0e6ed";
  ctx.beginPath(); ctx.moveTo(clinicX-3,clinicY); ctx.lineTo(clinicX+36,clinicY-14); ctx.lineTo(clinicX+75,clinicY); ctx.closePath(); ctx.fill();
  // door
  ctx.fillStyle = "#cad4de";
  ctx.fillRect(clinicX+28, clinicY+38, 18, 26);
  // cross (pulses if critical)
  var crossColor = town.health >= 55 ? "#d44f45" : "#f1b100";
  var crossScale = 1;
  if (town.health < 40) crossScale = 0.9 + Math.sin(frameCount*0.1)*0.1;
  ctx.fillStyle = crossColor;
  ctx.fillRect(clinicX + 36 - 7*crossScale, clinicY + 10, 14*crossScale, 24*crossScale);
  ctx.fillRect(clinicX + 36 - 12*crossScale, clinicY + 15, 24*crossScale, 14*crossScale);

  // ── Trees — count scales with land stat ──
  var treeCount = Math.max(1, Math.min(8, Math.floor(town.land / 12)));
  var treeColor = town.land >= 45 ? "#3fa95e" : "#8c8c55";
  var treePositions = [
    {x:240,y:0.48},{x:300,y:0.46},{x:360,y:0.48},{x:200,y:0.50},
    {x:400,y:0.47},{x:160,y:0.51},{x:440,y:0.49},{x:280,y:0.44}
  ];
  for (var ti = 0; ti < treeCount; ti++) {
    var tp = treePositions[ti];
    var treeSize = 16 + Math.random()*4; // vary slightly (seeded by position)
    var sway = Math.sin(frameCount * 0.015 + ti * 1.3) * 2;
    drawTree(x + tp.x + sway, y + h*tp.y, treeColor, ti%3===0, 20 + ti*2);
  }

  // ── Trash ──
  var trashCount = Math.max(0, Math.floor((55 - Math.min(town.land, town.water)) / 8));
  for (var i=0; i<trashCount; i++) {
    var txx = x + 180 + i*42;
    var tyy = y + h*0.78 + (i%2)*10;
    drawTrash(txx, tyy, i);
  }

  // ── Fish — count scales with water ──
  var fishCount = town.water >= 65 ? 4 : town.water >= 45 ? 2 : 0;
  for (var fi = 0; fi < fishCount; fi++) {
    var fx = x + 390 + fi*60 + Math.sin(frameCount*0.02 + fi*2)*12;
    var fy = y + h*0.79 + fi*8 + Math.sin(frameCount*0.03 + fi)*4;
    drawFish(fx, fy, town.water >= 65 ? "#fff6d0" : "#d0d0d0");
  }

  // ── People ──
  var personCount = town.health >= 60 ? 3 : town.health >= 40 ? 1 : 0;
  var personColors = ["#d95f4e", "#2a7de1", "#3ba55d"];
  for (var pi = 0; pi < personCount; pi++) {
    var px = x + 260 + pi*55 + Math.sin(frameCount*0.012 + pi*3.5)*15;
    var py = y + h*0.55;
    drawPerson(px, py, personColors[pi % personColors.length]);
  }

  // ── Draw smoke particles for this panel ──
  drawSmokeForPanel(x, y, w, h, townIndex);
}

function drawCloud(cx, cy) {
  ctx.beginPath();
  ctx.arc(cx, cy, 16, 0, Math.PI*2);
  ctx.arc(cx+20, cy-6, 20, 0, Math.PI*2);
  ctx.arc(cx+42, cy, 16, 0, Math.PI*2);
  ctx.arc(cx+18, cy+4, 14, 0, Math.PI*2);
  ctx.fill();
}

function drawPerson(x, y, color) {
  // Head
  ctx.fillStyle = "#f0d0a0";
  ctx.beginPath(); ctx.arc(x, y-16, 6, 0, Math.PI*2); ctx.fill();
  // Body
  ctx.fillStyle = color;
  roundRect(ctx, x-5, y-10, 10, 16, 4, true, false);
  // Legs
  ctx.fillStyle = "#5c7288";
  ctx.fillRect(x-4, y+6, 3, 8);
  ctx.fillRect(x+1, y+6, 3, 8);
}

function drawTrash(x, y, idx) {
  if (idx % 3 === 0) {
    // crumpled paper
    ctx.fillStyle = "#e8dcc4";
    ctx.beginPath();
    ctx.moveTo(x, y); ctx.lineTo(x+12, y-3); ctx.lineTo(x+14, y+8); ctx.lineTo(x+2, y+10);
    ctx.closePath(); ctx.fill();
  } else if (idx % 3 === 1) {
    // can
    ctx.fillStyle = "#b0b8c0";
    roundRect(ctx, x, y, 8, 12, 3, true, false);
    ctx.fillStyle = "#f05b4f";
    ctx.fillRect(x+1, y+2, 6, 4);
  } else {
    // bottle
    ctx.fillStyle = "#a8d8f0";
    ctx.fillRect(x, y, 6, 14);
    ctx.fillStyle = "#78b8d0";
    ctx.fillRect(x+1, y-3, 4, 4);
  }
}

function drawSmokeForPanel(px, py, pw, ph, townIndex) {
  // Only draw particles that originated near this panel's factory
  var factoryBaseX = px + 44 + 80;  // approximate chimney x
  smokeParticles.forEach(function(p) {
    if (p.x < px || p.x > px + pw) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife) * 0.35;
    ctx.fillStyle = "#888";
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  });
}

function drawBar(x, y, w, h, key, realValue, displayValue) {
  // Background
  ctx.fillStyle = "#edf3f8";
  roundRect(ctx, x, y, w, h, 12, true, false);
  // Animated bar via lerp
  var barW = Math.max(0, w * (displayValue / 100));
  // Gradient fill
  var grad = ctx.createLinearGradient(x, y, x + barW, y);
  grad.addColorStop(0, STAT_COLORS[key]);
  grad.addColorStop(1, lightenColor(STAT_COLORS[key], 30));
  ctx.fillStyle = grad;
  roundRect(ctx, x, y, barW, h, 12, true, false);
  // Label
  ctx.fillStyle = "#16324f";
  ctx.font = "bold 19px Arial";
  ctx.fillText(STAT_LABELS[key] + ": " + realValue, x+12, y+21);
}

function lightenColor(hex, amt) {
  var r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  r = Math.min(255, r+amt); g = Math.min(255, g+amt); b = Math.min(255, b+amt);
  return "#" + ((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1);
}

function drawTree(x, y, color, isPine, size) {
  var s = (size || 24);
  ctx.fillStyle = "#73563d";
  ctx.fillRect(x-4, y+14, 8, 28);
  if (isPine) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y - s*0.6);
    ctx.lineTo(x + s*0.5, y + 14);
    ctx.lineTo(x - s*0.5, y + 14);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, s*0.7, 0, Math.PI*2);
    ctx.fill();
  }
}

function drawFish(x, y, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, 16, 10, 0, 0, Math.PI*2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x-18, y);
  ctx.lineTo(x-30, y-8);
  ctx.lineTo(x-30, y+8);
  ctx.closePath();
  ctx.fill();
  // Eye
  ctx.fillStyle = "#333";
  ctx.beginPath();
  ctx.arc(x+6, y-2, 2, 0, Math.PI*2);
  ctx.fill();
  // Fin
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x-2, y-6);
  ctx.lineTo(x+4, y-14);
  ctx.lineTo(x+10, y-6);
  ctx.stroke();
}

function roundRect(context, x, y, width, height, radius, fill, stroke) {
  if (width <= 0) return;
  var r = Math.min(radius, width/2, height/2);
  context.beginPath();
  context.moveTo(x+r, y);
  context.arcTo(x+width, y, x+width, y+height, r);
  context.arcTo(x+width, y+height, x, y+height, r);
  context.arcTo(x, y+height, x, y, r);
  context.arcTo(x, y, x+width, y, r);
  context.closePath();
  if (fill) context.fill();
  if (stroke) context.stroke();
}

function drawCenterHeader() {
  ctx.fillStyle = "#16324f";
  ctx.font = "bold 22px Arial";
  ctx.fillText("Live Town Board", 24, 30);
  if (gameState.phase === "gameOver") {
    ctx.fillStyle = "#2f8f4e";
    ctx.font = "bold 30px Arial";
    ctx.fillText(gameState.winner ? gameState.winner + " Wins!" : "It's a Tie!", 540, 36);
  } else if (gameState.phase !== "ready") {
    ctx.fillStyle = "#5c7288";
    ctx.font = "bold 24px Arial";
    ctx.fillText("Round " + (gameState.roundIndex+1), 620, 34);
    // Round tinting for day/night feel
    var tintAlpha = gameState.roundIndex * 0.025;
    if (tintAlpha > 0) {
      ctx.fillStyle = "rgba(16, 32, 60, " + tintAlpha + ")";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }
}

function drawOverlayIfGameOver() {
  if (gameState.phase !== "gameOver") return;
  ctx.save();
  ctx.fillStyle = "rgba(22, 50, 79, 0.22)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(255,255,255,0.97)";
  roundRect(ctx, 340, 180, 680, 320, 28, true, false);

  ctx.fillStyle = "#16324f";
  ctx.font = "bold 36px Arial";
  ctx.textAlign = "center";
  ctx.fillText(gameState.winner ? "🏆 " + gameState.winner + " Wins!" : "🤝 Tie Game", 680, 240);
  ctx.font = "24px Arial";
  var t1 = gameState.towns[0], t2 = gameState.towns[1];
  ctx.fillText(t1.name + ": " + calculateScore(t1) + "   |   " + t2.name + ": " + calculateScore(t2), 680, 290);
  ctx.font = "20px Arial";
  ctx.fillStyle = "#5c7288";
  ctx.fillText(getTownRating(t1) + "  vs  " + getTownRating(t2), 680, 330);

  // Confetti for winner side
  drawConfetti(680, 360);

  ctx.font = "18px Arial";
  ctx.fillStyle = "#5c7288";
  ctx.fillText("View Report Card below or Reset to play again", 680, 460);
  ctx.textAlign = "left";
  ctx.restore();
}

function drawConfetti(cx, cy) {
  var colors = ["#e74c3c","#3498db","#2ecc71","#f1c40f","#9b59b6","#e67e22"];
  for (var i = 0; i < 30; i++) {
    var angle = (i / 30) * Math.PI * 2 + frameCount * 0.008;
    var dist = 40 + Math.sin(frameCount * 0.02 + i) * 20 + i * 2;
    var px = cx + Math.cos(angle) * dist;
    var py = cy + Math.sin(angle) * dist * 0.4 + Math.sin(frameCount * 0.04 + i * 0.7) * 8;
    ctx.fillStyle = colors[i % colors.length];
    ctx.globalAlpha = 0.7;
    ctx.fillRect(px - 3, py - 3, 6+i%3, 4+i%2);
  }
  ctx.globalAlpha = 1;
}

function drawFloatingTexts() {
  floatingTexts = floatingTexts.filter(function(item){ return item.life > 0; });
  floatingTexts.forEach(function(item){
    ctx.save();
    // Ease-out movement
    var progress = 1 - (item.life / 120);
    var eased = 1 - (1 - progress) * (1 - progress);
    var yOff = eased * 35;
    ctx.globalAlpha = Math.min(1, item.life / 60);
    ctx.fillStyle = item.color;
    ctx.font = "bold 22px Arial";
    ctx.fillText(item.text, item.x, item.y - yOff);
    ctx.restore();
    item.life--;
  });
}

function render() {
  frameCount++;
  lerpDisplayStats();
  updateSmokeParticles();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawCenterHeader();
  drawTownPanel(gameState.towns[0], 24, 54, 636, 620, gameState.activeTownIndex===0, 0);
  drawTownPanel(gameState.towns[1], 700, 54, 636, 620, gameState.activeTownIndex===1, 1);
  drawFloatingTexts();
  drawOverlayIfGameOver();
}

function loop() {
  render();
  animationFrame = requestAnimationFrame(loop);
}

// ── Event listeners ──
els.startBtn.addEventListener("click", startGame);
els.nextRoundBtn.addEventListener("click", nextRound);
els.resetBtn.addEventListener("click", resetGame);
els.applyNamesBtn.addEventListener("click", resetGame);
els.timerBtn.addEventListener("click", function(){ unlockAudio(); startTimer(); });
els.closeReportBtn.addEventListener("click", function(){ els.reportCard.classList.add("hidden"); });

// ── Init ──
resetGame();
loop();
`.trimStart();

fs.writeFileSync('game.js', code, 'utf8');
console.log('game.js written: ' + code.length + ' chars');
