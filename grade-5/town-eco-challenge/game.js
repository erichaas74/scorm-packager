/* ================================================================
   Save Our Town Challenge — Upgraded Game Engine
   ================================================================ */

// ── Constants ──
const STAT_KEYS = ["water", "air", "land", "business", "health"];
const STAT_LABELS = { water: "Water", air: "Air", land: "Land", business: "Business", health: "Health" };
const STAT_COLORS = { water: "#2a7de1", air: "#8db7d9", land: "#3ba55d", business: "#d38c00", health: "#d44f45", budget: "#2f8f4e" };
const TOTAL_ROUNDS = 5;
const BUDGET_INCOME = 5;         // income per round
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

const eventPool = [
  {
    id: "river-trash", tone: "harmful",
    title: "Trash in the River",
    description: "Trash washes into the river and makes the water look dirty.",
    effects: { water: -8, land: -4 },
    actionTags: ["water", "land", "general"],
    customActions: [
      { id:"evt-river-low", title:"Quick River Pickup", cost:6, effects:{water:3,land:2}, tone:"helpful", description:"Send a small crew to pick up the worst trash along the riverbank.", eventSpecific:true },
      { id:"evt-river-mid", title:"River Filter Install", cost:14, effects:{water:8,land:4}, tone:"helpful", description:"Set up temporary filters at the worst dumping points to catch debris.", eventSpecific:true },
      { id:"evt-river-high", title:"Full River Restoration", cost:24, effects:{water:14,land:8,health:3}, tone:"helpful", description:"Hire a professional crew to dredge trash and restore the riverbed.", eventSpecific:true },
      { id:"evt-river-bad", title:"Build a Trash Dam", cost:0, effects:{water:-8,land:-6,business:4}, tone:"risky", description:"If you squint, it looks like a bridge! Just push all the trash to one side and call it \"modern art.\"", eventSpecific:true }
    ]
  },
  {
    id: "youth-volunteers", tone: "helpful",
    title: "Youth Volunteer Day",
    description: "A big group of student volunteers helps clean the town.",
    effects: { land: 6, water: 4, health: 2 },
    actionTags: ["water", "land", "health", "general"],
    customActions: [
      { id:"evt-youth-low", title:"Volunteer Snack Station", cost:4, effects:{health:3,land:2}, tone:"helpful", description:"Set up refreshments so volunteers stay energized and work longer.", eventSpecific:true },
      { id:"evt-youth-mid", title:"Volunteer Tool Kits", cost:12, effects:{land:6,water:4,health:2}, tone:"helpful", description:"Buy gloves, bags, and grabbers so volunteers can do more.", eventSpecific:true },
      { id:"evt-youth-high", title:"Youth Green Corps Program", cost:22, effects:{land:10,water:6,health:5,air:3}, tone:"helpful", description:"Launch an ongoing youth program that trains future environmental leaders.", eventSpecific:true },
      { id:"evt-youth-bad", title:"Cancel and Play Video Games", cost:0, effects:{land:-5,health:-4,water:-3}, tone:"risky", description:"Tell the volunteers to go home. Who needs fresh air when you have Wi-Fi?", eventSpecific:true }
    ]
  },
  {
    id: "flash-flood", tone: "harmful",
    title: "Flash Flood",
    description: "Heavy rain floods the town and carries trash into the river.",
    effects: { water: -15, land: -10 },
    actionTags: ["water", "land", "health", "general"],
    customActions: [
      { id:"evt-flood-low", title:"Sandbag Distribution", cost:5, effects:{land:3,health:2}, tone:"helpful", description:"Hand out sandbags to protect homes and businesses from floodwater.", eventSpecific:true },
      { id:"evt-flood-mid", title:"Emergency Pump Rental", cost:15, effects:{water:8,land:6,health:3}, tone:"helpful", description:"Rent pumps to drain flooded areas and clean up standing water.", eventSpecific:true },
      { id:"evt-flood-high", title:"Flood Barrier Construction", cost:26, effects:{water:14,land:10,health:4}, tone:"helpful", description:"Build permanent flood walls along the river to prevent future damage.", eventSpecific:true },
      { id:"evt-flood-bad", title:"Sell Pool Floaties", cost:0, effects:{water:-10,health:-6,business:6}, tone:"risky", description:"Forget cleanup — sell inflatable flamingos and call it a \"water park.\" Entrepreneurship!", eventSpecific:true }
    ]
  },
  {
    id: "festival-tradeoff", tone: "mixed",
    title: "Festival Tradeoff",
    description: "The town festival helps stores make money, but it leaves a lot of trash behind.",
    effects: { business: 10, land: -12, water: -5 },
    actionTags: ["business", "land", "water", "general"],
    customActions: [
      { id:"evt-fest-low", title:"Festival Recycling Stations", cost:5, effects:{land:4,water:2}, tone:"helpful", description:"Place recycling bins around the festival grounds to reduce litter.", eventSpecific:true },
      { id:"evt-fest-mid", title:"Green Vendor Rules", cost:13, effects:{land:7,water:4,business:2}, tone:"helpful", description:"Require vendors to use compostable containers and clean up after.", eventSpecific:true },
      { id:"evt-fest-high", title:"Zero-Waste Festival Upgrade", cost:23, effects:{land:12,water:6,business:4}, tone:"helpful", description:"Redesign the festival with reusable dishes, compost stations, and cleanup crews.", eventSpecific:true },
      { id:"evt-fest-bad", title:"Confetti Cannon Grand Finale", cost:0, effects:{land:-10,water:-5,business:5}, tone:"risky", description:"Launch 10,000 pieces of glitter into the sky. It looks amazing for exactly 4 seconds.", eventSpecific:true }
    ]
  },
  {
    id: "state-grant", tone: "helpful",
    title: "State Cleanup Grant",
    description: "The town gets extra money to help clean up and protect health.",
    effects: { budget: 15, health: 4, water: 3 },
    actionTags: ["budget", "health", "water", "general"],
    customActions: [
      { id:"evt-grant-low", title:"Health Flyer Campaign", cost:4, effects:{health:4,water:2}, tone:"helpful", description:"Print and hand out health safety flyers to every household.", eventSpecific:true },
      { id:"evt-grant-mid", title:"Water Testing Stations", cost:12, effects:{water:8,health:6}, tone:"helpful", description:"Use grant money to set up public water testing points around town.", eventSpecific:true },
      { id:"evt-grant-high", title:"Community Health Center Upgrade", cost:22, effects:{health:12,water:6,business:3}, tone:"helpful", description:"Invest grant funds into upgrading the town health center.", eventSpecific:true },
      { id:"evt-grant-bad", title:"Mayor's Pizza Party", cost:0, effects:{health:-6,water:-4,budget:10}, tone:"risky", description:"Spend the grant money on pizza for the mayor's office. The environment can wait — it's pepperoni day!", eventSpecific:true }
    ]
  },
  {
    id: "busy-traffic", tone: "harmful",
    title: "Busy Traffic Week",
    description: "More cars and trucks than usual make the air smoky and dirty.",
    effects: { air: -8, health: -4, business: 2 },
    actionTags: ["air", "health", "business", "general"],
    customActions: [
      { id:"evt-traffic-low", title:"Carpool Awareness Signs", cost:4, effects:{air:3,health:2}, tone:"helpful", description:"Put up signs encouraging people to share rides this week.", eventSpecific:true },
      { id:"evt-traffic-mid", title:"Temporary Bus Routes", cost:14, effects:{air:7,health:4,business:2}, tone:"helpful", description:"Run extra bus routes to get cars off the road during the rush.", eventSpecific:true },
      { id:"evt-traffic-high", title:"Traffic Reroute & Green Zone", cost:24, effects:{air:12,health:6,business:3}, tone:"helpful", description:"Close downtown to heavy trucks and create a pedestrian-only green zone.", eventSpecific:true },
      { id:"evt-traffic-bad", title:"Monster Truck Rally", cost:0, effects:{air:-10,health:-5,business:6}, tone:"risky", description:"More traffic? Perfect — add BIGGER trucks! SUNDAY SUNDAY SUNDAY! The air quality can take a day off.", eventSpecific:true }
    ]
  },
  {
    id: "factory-smoke", tone: "harmful",
    title: "Factory Smoke Burst",
    description: "The factory has a smoky week, and people nearby complain about the air.",
    effects: { air: -10, health: -6, business: 3 },
    actionTags: ["air", "health", "business", "general"],
    customActions: [
      { id:"evt-smoke-low", title:"Air Quality Alert", cost:3, effects:{health:3,air:2}, tone:"helpful", description:"Send alerts so people stay indoors and wear masks during the worst hours.", eventSpecific:true },
      { id:"evt-smoke-mid", title:"Emergency Filter Swap", cost:14, effects:{air:8,health:5}, tone:"helpful", description:"Rush-order temporary filters for the factory smokestacks.", eventSpecific:true },
      { id:"evt-smoke-high", title:"Factory Emissions Overhaul", cost:25, effects:{air:14,health:7,business:-3}, tone:"helpful", description:"Shut down the worst equipment and install modern low-emission replacements.", eventSpecific:true },
      { id:"evt-smoke-bad", title:"Rename It 'Flavor Clouds'", cost:0, effects:{air:-12,health:-8,business:5}, tone:"risky", description:"It's not pollution, it's atmosphere! Put up signs saying the smoke is \"artisan fog\" and charge tourists to see it.", eventSpecific:true }
    ]
  },
  {
    id: "garden-donation", tone: "helpful",
    title: "Community Garden Donation",
    description: "A local group gives supplies to help the town grow greener.",
    effects: { land: 7, health: 5, business: 3 },
    actionTags: ["land", "health", "business", "general"],
    customActions: [
      { id:"evt-garden-low", title:"Plant the Donation Seeds", cost:3, effects:{land:3,health:2}, tone:"helpful", description:"Use the donated seeds to plant flowers and vegetables in public spaces.", eventSpecific:true },
      { id:"evt-garden-mid", title:"Expand Garden Plots", cost:12, effects:{land:7,health:4,business:2}, tone:"helpful", description:"Build more raised beds so more families can join the community garden.", eventSpecific:true },
      { id:"evt-garden-high", title:"Town Garden & Education Center", cost:22, effects:{land:12,health:6,business:4}, tone:"helpful", description:"Turn the garden into a learning center with classes on composting and nutrition.", eventSpecific:true },
      { id:"evt-garden-bad", title:"Pave It Into a Parking Lot", cost:0, effects:{land:-8,health:-5,business:5}, tone:"risky", description:"Who needs vegetables when you can have 30 more parking spots? Gardens don't even have drive-throughs.", eventSpecific:true }
    ]
  },
  {
    id: "drought-warning", tone: "mixed",
    title: "Drought Warning",
    description: "There has not been much rain, so the river and farms are under stress.",
    effects: { water: -12, land: -4, business: -6 },
    actionTags: ["water", "land", "business", "health", "general"],
    customActions: [
      { id:"evt-drought-low", title:"Water Conservation Posters", cost:4, effects:{water:3,land:2}, tone:"helpful", description:"Remind everyone to save water with posters and announcements.", eventSpecific:true },
      { id:"evt-drought-mid", title:"Sprinkler Timers for Farms", cost:14, effects:{water:8,land:4,business:3}, tone:"helpful", description:"Give farmers timers so they water crops only when needed.", eventSpecific:true },
      { id:"evt-drought-high", title:"Emergency Reservoir & Rain Collection", cost:25, effects:{water:14,land:6,business:5}, tone:"helpful", description:"Build rain barrels and a small reservoir to store water for dry spells.", eventSpecific:true },
      { id:"evt-drought-bad", title:"Drain the Town Pool", cost:0, effects:{water:-10,health:-6,land:-4}, tone:"risky", description:"Need water? Just drain the public swimming pool onto the farms. Problem solved! (It's mostly chlorine.)", eventSpecific:true }
    ]
  },
  {
    id: "eco-tourism", tone: "helpful",
    title: "Eco-Tourism Weekend",
    description: "Visitors come to enjoy the town's nature and local shops.",
    effects: { business: 8, land: 4, health: 2, water: 2 },
    actionTags: ["business", "land", "health", "water", "general"],
    customActions: [
      { id:"evt-eco-low", title:"Welcome Signs & Maps", cost:4, effects:{business:3,land:2}, tone:"helpful", description:"Print trail maps and put up signs so visitors find the best spots.", eventSpecific:true },
      { id:"evt-eco-mid", title:"Guided Nature Tours", cost:13, effects:{business:6,land:4,health:3}, tone:"helpful", description:"Hire local guides to lead eco-tours that educate visitors about the area.", eventSpecific:true },
      { id:"evt-eco-high", title:"Eco-Lodge & Trail Upgrade", cost:24, effects:{business:10,land:6,health:4,water:3}, tone:"helpful", description:"Build a small eco-lodge and improve trails to attract more nature tourists year-round.", eventSpecific:true },
      { id:"evt-eco-bad", title:"Build a Gift Shop Over the Wetlands", cost:0, effects:{land:-8,water:-6,business:8}, tone:"risky", description:"Who cares about frogs? Tourists want keychains! Bulldoze the wetlands and sell overpriced souvenirs.", eventSpecific:true }
    ]
  }
];

// buildActionOptions removed — replaced by buildRoundActions with custom event actions


const actionPool = [
  {
    id: "trash-bins",
    title: "Add More Trash and Recycling Bins",
    cost: 14,
    effects: { land: 10, water: 5, business: 5 },
    tone: "helpful",
    description: "Put more bins around town so trash does not end up on the ground or in the water.",
    tags: ["land", "water", "business", "general"]
  },
  {
    id: "cleanup-day",
    title: "Community Cleanup Day",
    cost: 12,
    effects: { land: 8, water: 4, health: 2 },
    tone: "helpful",
    description: "Have volunteers help pick up trash around town.",
    tags: ["land", "water", "health", "general"]
  },
  {
    id: "river-barriers",
    title: "Build River Trash Barriers",
    cost: 22,
    effects: { water: 15, land: 5 },
    tone: "helpful",
    description: "Put barriers in the river to catch trash before it spreads.",
    tags: ["water", "land", "general"]
  },
  {
    id: "water-safety",
    title: "Water Safety Check",
    cost: 20,
    effects: { water: 12, health: 10 },
    tone: "helpful",
    description: "Test the water and share safety information with families.",
    tags: ["water", "health", "general"]
  },
  {
    id: "factory-filters",
    title: "Cleaner Factory Filters",
    cost: 25,
    effects: { air: 15, health: 8, business: -5 },
    tone: "helpful",
    description: "Help the factory add better filters to keep the air cleaner.",
    tags: ["air", "health", "business", "general"]
  },
  {
    id: "plant-trees",
    title: "Plant Trees Near Roads",
    cost: 20,
    effects: { air: 8, land: 8, health: 3 },
    tone: "helpful",
    description: "Plant trees to help clean the air and make the town greener.",
    tags: ["air", "land", "health", "general"]
  },
  {
    id: "bike-lanes",
    title: "Add Bike Lanes and Walking Paths",
    cost: 22,
    effects: { air: 10, health: 6, business: 2 },
    tone: "helpful",
    description: "Make it easier for people to walk or ride bikes instead of driving.",
    tags: ["air", "health", "business", "general"]
  },
  {
    id: "compost-sorting",
    title: "Start a Compost Program",
    cost: 16,
    effects: { land: 10, water: 3, business: 2 },
    tone: "helpful",
    description: "Sort food and yard waste so less trash goes to the dump.",
    tags: ["land", "water", "business", "general"]
  },
  {
    id: "green-awards",
    title: "Green Business Awards",
    cost: 14,
    effects: { business: 8, land: 5, air: 3 },
    tone: "helpful",
    description: "Reward stores and businesses for making cleaner choices.",
    tags: ["business", "land", "air", "general"]
  },
  {
    id: "farm-training",
    title: "Safer Farm Training",
    cost: 16,
    effects: { water: 10, land: 5, business: 2 },
    tone: "helpful",
    description: "Teach farmers ways to protect crops while keeping water cleaner.",
    tags: ["water", "land", "business", "general"]
  },
  {
    id: "storm-drains",
    title: "Fix Storm Drains",
    cost: 25,
    effects: { water: 8, land: 6, health: 2 },
    tone: "helpful",
    description: "Improve drains so dirty water does not flood streets and parks as easily.",
    tags: ["water", "land", "health", "general"]
  },
  {
    id: "volunteer-rescue",
    title: "Volunteer River Cleanup",
    cost: 8,
    effects: { water: 4, land: 4, health: 2 },
    tone: "helpful",
    description: "Have volunteers help clean the river area quickly.",
    tags: ["water", "land", "health", "general"]
  },
  {
    id: "education-campaign",
    title: "Pollution Awareness Campaign",
    cost: 10,
    effects: { water: 4, air: 4, land: 4, health: 4 },
    tone: "helpful",
    description: "Teach people simple ways to help keep the town clean.",
    tags: ["water", "air", "land", "health", "general"]
  },
  {
    id: "park-restoration",
    title: "Restore the Park",
    cost: 18,
    effects: { land: 15, business: 3, health: 2 },
    tone: "helpful",
    description: "Clean and fix the park so families can use it again.",
    tags: ["land", "business", "health", "general"]
  },
  {
    id: "factory-repair",
    title: "Repair Factory Equipment",
    cost: 20,
    effects: { air: 9, water: 5, business: -2 },
    tone: "helpful",
    description: "Fix old factory machines so they make less pollution.",
    tags: ["air", "water", "business", "general"]
  },
  {
    id: "farmers-market",
    title: "Reusable Farmers Market",
    cost: 15,
    effects: { business: 6, land: 4, health: 3 },
    tone: "helpful",
    description: "Support a market that uses less waste and helps local sellers.",
    tags: ["business", "land", "health", "general"]
  },

  {
    id: "empty-lot",
    title: "Temporary Trash Storage Area",
    cost: 6,
    effects: { land: -8, water: -2, business: 3 },
    tone: "risky",
    description: "Move trash to a different area for now so the town looks cleaner.",
    tags: ["land", "water", "business", "general"]
  },
  {
    id: "do-nothing",
    title: "Wait and Watch",
    cost: 0,
    effects: { water: -4, air: -4, land: -4, health: -4, business: 2 },
    tone: "risky",
    description: "Save money this week and see if the problem gets better on its own.",
    tags: ["general"]
  },
  {
    id: "idle-trucks",
    title: "Keep Deliveries Moving Faster",
    cost: 0,
    effects: { air: -10, health: -5, business: 6 },
    tone: "risky",
    description: "Let trucks stay running longer so stores get supplies more quickly.",
    tags: ["air", "health", "business", "general"]
  },
  {
    id: "dump-back",
    title: "Fast Floodwater Drain Plan",
    cost: 5,
    effects: { water: -10, health: -8, business: 3 },
    tone: "risky",
    description: "Move water off the streets quickly so roads and businesses can reopen.",
    tags: ["water", "health", "business", "general"]
  },
  {
    id: "cut-health",
    title: "Move Money to Help Businesses",
    cost: 0,
    effects: { health: -10, business: 5 },
    tone: "risky",
    description: "Shift some money away from health services to support local stores.",
    tags: ["health", "business", "budget", "general"]
  },
  {
    id: "cheap-decor",
    title: "Use Low-Cost Event Supplies",
    cost: 4,
    effects: { land: -6, water: -4, business: 4 },
    tone: "risky",
    description: "Buy cheaper supplies for town events to save money.",
    tags: ["land", "water", "business", "general"]
  },
  {
    id: "chemical-spray",
    title: "Strong Cleanup Chemicals",
    cost: 8,
    effects: { water: -7, land: -8, business: 4 },
    tone: "risky",
    description: "Use stronger cleaning products to clean polluted areas faster.",
    tags: ["water", "land", "business", "general"]
  },
  {
    id: "delay-repair",
    title: "Delay Big Repairs",
    cost: 0,
    effects: { air: -8, water: -3, business: 5 },
    tone: "risky",
    description: "Wait until later to fix equipment so business can keep going now.",
    tags: ["air", "water", "business", "general"]
  },
  {
    id: "burn-trash",
    title: "Quick Trash Removal Plan",
    cost: 3,
    effects: { air: -12, health: -7, land: -2, business: 2 },
    tone: "risky",
    description: "Get rid of trash fast using an emergency method.",
    tags: ["air", "health", "land", "general"]
  },
  {
    id: "skip-recycling",
    title: "Pause Recycling Service",
    cost: 0,
    effects: { land: -9, water: -3, budget: 3 },
    tone: "risky",
    description: "Stop recycling pickup for now to save money.",
    tags: ["land", "water", "budget", "general"]
  },
  {
    id: "remove-trees",
    title: "Add More Parking Spaces",
    cost: 6,
    effects: { land: -10, air: -6, business: 6 },
    tone: "risky",
    description: "Use green space for parking to help stores and events.",
    tags: ["land", "air", "business", "general"]
  },
  {
    id: "ignore-volunteers",
    title: "Town Promotion Campaign",
    cost: 4,
    effects: { business: 6, land: -4, health: -2 },
    tone: "risky",
    description: "Use volunteers to help bring more people to local businesses.",
    tags: ["business", "land", "health", "general"]
  },
  {
    id: "pump-groundwater",
    title: "Use More Groundwater",
    cost: 7,
    effects: { water: -9, business: 5, land: -3 },
    tone: "risky",
    description: "Take extra water from underground to support town needs.",
    tags: ["water", "business", "land", "general"]
  },
  {
    id: "close-park-trash",
    title: "Close the Park for Now",
    cost: 5,
    effects: { health: -4, land: -5, business: -2, budget: 2 },
    tone: "risky",
    description: "Keep people out of the park until there is money to clean it up.",
    tags: ["land", "health", "budget", "business", "general"]
  }
];



// ── DOM ──
var canvas = document.getElementById("gameCanvas");
var ctx = canvas.getContext("2d");

var els = {
  roundLabel: document.createElement("span"),
  phaseLabel: document.createElement("span"),
  eventTitle: document.createElement("span"),
  eventDescription: document.createElement("span"),
  eventEffects: document.createElement("span"),
  leaderText: document.createElement("span"),
  scorePreview: document.createElement("span"),
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
  reportCard: document.getElementById("reportCard"),
  reportBody: document.getElementById("reportBody"),
  closeReportBtn: document.getElementById("closeReportBtn"),
  eventOverlay: document.getElementById("eventOverlay"),
  eventOverlayIcon: document.getElementById("eventOverlayIcon"),
  eventOverlayTitle: document.getElementById("eventOverlayTitle"),
  eventOverlayDesc: document.getElementById("eventOverlayDesc"),
  eventOverlayEffects: document.getElementById("eventOverlayEffects"),
  eventOverlayBtn: document.getElementById("eventOverlayBtn")
};

// ── State ──
var gameState;
var floatingTexts = [];
var smokeParticles = [];
var animationFrame;
var frameCount = 0;

// Animated display values for lerp bars
var displayStats = [{}, {}];

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

function buildRoundActions(event, usedIds) {
  // 3 custom event-specific actions (always included)
  var custom = (event.customActions || []).map(function(a){ return JSON.parse(JSON.stringify(a)); });

  // Pool actions not yet used in previous rounds
  var available = actionPool.filter(function(a){ return usedIds.indexOf(a.id) < 0; });
  var helpful = available.filter(function(a){ return a.tone==="helpful"; });
  var risky   = available.filter(function(a){ return a.tone==="risky";   });

  // Pick 2 helpful + 2 risky from pool (4 random total, since 4 custom actions now)
  var selH = pickN(helpful, Math.min(2, helpful.length));
  var selR = pickN(risky,   Math.min(2, risky.length));

  // Fallback: if not enough helpful/risky, fill from the other tone
  var poolPicks = selH.concat(selR);
  if (poolPicks.length < 4) {
    var remaining = available.filter(function(a){ return !poolPicks.some(function(p){ return p.id===a.id; }); });
    poolPicks = poolPicks.concat(pickN(remaining, 4 - poolPicks.length));
  }

  // Mark used
  poolPicks.forEach(function(a){ usedIds.push(a.id); });

  // Deep-copy pool picks and combine with custom actions → shuffle
  var copies = poolPicks.map(function(a){ return JSON.parse(JSON.stringify(a)); });
  return shuffle(custom.concat(copies));
}

function buildRoundDeck() {
  var usedIds = [];
  var events = pickN(eventPool, TOTAL_ROUNDS);
  return events.map(function(ev,i){
    var copy = JSON.parse(JSON.stringify(ev));
    copy.effects = scaleEffects(copy.effects, i);
    copy.actions = buildRoundActions(copy, usedIds);
    return copy;
  });
}

// ── Per-round snapshots (for report card) ──
function takeSnapshot() {
  return gameState.towns.map(function(t){ var s={}; STAT_KEYS.forEach(function(k){s[k]=t[k];}); s.budget=t.budget; s.score=calculateScore(t); return s; });
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
  var town1 = els.town1Name.value.trim() || "Town 1";
  var town2 = els.town2Name.value.trim() || "Town 2";
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
    choicesRemaining: [2, 2],
    pendingActions: [[],[]],  // deferred action effects applied after both teams pick
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
  els.roundLabel.textContent = "Not started";
  els.phaseLabel.textContent = "Press Start Game";
  els.eventTitle.textContent = "Ready to begin";
  els.eventDescription.textContent = "Start the game to reveal 1 of " + eventPool.length + " random events. Each town picks 2 actions per round.";
  els.eventEffects.textContent = "";
  els.leaderText.textContent = "No leader yet";
  els.scorePreview.textContent = "Final score = Water + Air + Land + Business + Health + Budget left";
  els.turnPrompt.textContent = "Teams will choose actions here.";
  els.actionPrompt.textContent = "Action Choices";
  els.actionsGrid.innerHTML = "";
  els.historyLog.innerHTML = "";
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

  // Budget income — scales with business strength
  gameState.towns.forEach(function(t, i){
    var bonus = t.business > 50 ? Math.floor((t.business - 50) / 10) : 0; // +1 per 10 pts above 50
    var income = BUDGET_INCOME + bonus;
    var before = t.budget;
    t.budget = Math.min(150, t.budget + income);
    var delta = t.budget - before;
    // Business decay — upkeep cost of a strong economy
    var decay = Math.min(5, Math.floor(t.business / 20)); // 0-5 pts lost per round
    t.business = Math.max(0, t.business - decay);
    if (delta > 0) {
      var panel = i===0 ? {x:24,y:54,w:636,h:520} : {x:700,y:54,w:636,h:520};
      var label = bonus > 0 ? "Tax Revenue +$"+delta+" (biz bonus +$"+bonus+")" : "Tax Revenue +$"+delta;
      floatingTexts.push({ x:panel.x+panel.w-160, y:panel.y+90, text:label, color:"#2f8f4e", life:100 });
    }
    if (decay > 0) {
      var p2 = i===0 ? {x:24,y:54,w:636,h:520} : {x:700,y:54,w:636,h:520};
      floatingTexts.push({ x:p2.x+p2.w-160, y:p2.y+120, text:"Business upkeep −"+decay, color:"#d38c00", life:100 });
    }
  });

  var round = JSON.parse(JSON.stringify(gameState.roundDeck[gameState.roundIndex]));
  gameState.currentRound = round;
  gameState.phase = "choosing";
  gameState.choicesRemaining = [2, 2];
  gameState.chosenByTown = [[], []];
  gameState.pendingActions = [[], []];
  gameState.activeTownIndex = null; // set after overlay dismissed
  gameState.phase = "eventReveal";

  applyEffectsToTown(gameState.towns[0], round.effects, 0);
  applyEffectsToTown(gameState.towns[1], round.effects, 1);

  // Track lowest score for comeback
  gameState.towns.forEach(function(t,i){
    var s = calculateScore(t);
    if (gameState.lowestScore[i] === null || s < gameState.lowestScore[i]) gameState.lowestScore[i] = s;
  });

  els.roundLabel.textContent = "Round " + (gameState.roundIndex+1) + " of " + gameState.roundDeck.length;
  els.phaseLabel.textContent = "Event revealed — read it aloud!";
  els.turnPrompt.textContent = "Read the event, then dismiss to start choosing.";
  els.nextRoundBtn.disabled = true;

  addHistory('<span class="highlight">Round ' + (gameState.roundIndex+1) + ' event:</span> ' + round.title + ' - ' + getEventToneLabel(round.tone) + ' (' + formatEffects(round.effects) + ')');

  // Show dramatic event overlay
  showEventOverlay(round);
  renderActions();
  updateLeaderText();
  render();
}

function applyEffectsToTown(town, effects, townIndex) {
  var before = {}; Object.keys(town).forEach(function(k){ before[k]=town[k]; });
  Object.keys(effects).forEach(function(k){ town[k] += effects[k]; });
  clampTown(town);

  var panel = townIndex===0 ? {x:24,y:54,w:636,h:520} : {x:700,y:54,w:636,h:520};
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

// ── Event overlay ──
function showEventOverlay(round) {
  var icon = round.tone === "helpful" ? "🌟" : round.tone === "mixed" ? "⚡" : "🌪️";
  els.eventOverlayIcon.textContent = icon;
  els.eventOverlayTitle.textContent = round.title;
  els.eventOverlayDesc.textContent = round.description + " " + getEventToneSentence(round.tone);
  els.eventOverlayEffects.textContent = formatEffects(round.effects);
  els.eventOverlay.classList.remove("hidden");
  // Trigger entrance animation
  els.eventOverlay.offsetWidth; // force reflow
  els.eventOverlay.classList.add("visible");
}

function dismissEventOverlay() {
  els.eventOverlay.classList.remove("visible");
  setTimeout(function(){
    els.eventOverlay.classList.add("hidden");
    // Now begin the choosing phase — alternate who picks first each round
    gameState.phase = "choosing";
    var firstPicker = gameState.roundIndex % 2;
    gameState.activeTownIndex = firstPicker;
    els.phaseLabel.textContent = "Both towns choose actions";
    els.turnPrompt.textContent = gameState.towns[firstPicker].name + " picks first (2 actions).";
    renderActions();
    render();
  }, 350);
}

function chooseAction(actionIndex) {
  if (gameState.phase !== "choosing") return;
  var townIndex = gameState.activeTownIndex;
  if (townIndex === null) return;
  if (gameState.choicesRemaining[townIndex] <= 0) return;
  if (gameState.chosenByTown[townIndex].indexOf(actionIndex) >= 0) return;
  unlockAudio();
  var town = gameState.towns[townIndex];
  var action = gameState.currentRound.actions[actionIndex];
  if (!action) return;
  if (town.budget < action.cost) return;

  sfxCoin();
  // Deduct budget immediately (so both teams see cost), but defer stat effects
  town.budget -= action.cost;
  gameState.pendingActions[townIndex].push(action);
  gameState.choices[townIndex].push(action.id);
  gameState.chosenByTown[townIndex].push(actionIndex);
  gameState.choicesRemaining[townIndex]--;

  addHistory('<span class="highlight">' + town.name + '</span> chose <strong>' + action.title + '</strong> for $' + action.cost);

  // Check if current town is done picking
  if (gameState.choicesRemaining[townIndex] <= 0) {
    // Switch to other town or finish round
    var otherTown = townIndex === 0 ? 1 : 0;
    if (gameState.choicesRemaining[otherTown] > 0) {
      gameState.activeTownIndex = otherTown;
      els.turnPrompt.textContent = gameState.towns[otherTown].name + " picks now (" + gameState.choicesRemaining[otherTown] + " actions).";
    } else {
      // Both done — NOW apply all deferred action effects
      gameState.phase = "roundComplete";
      gameState.activeTownIndex = null;
      applyDeferredActions();

      // Chain reaction — both towns chose 2 helpful or 2 risky
      var t0Ids = gameState.choices[0].slice(-2);
      var t1Ids = gameState.choices[1].slice(-2);
      var allHelpful0 = t0Ids.every(function(id){ var a=actionPool.find(function(x){return x.id===id;}); return a&&a.tone==="helpful"; });
      var allHelpful1 = t1Ids.every(function(id){ var a=actionPool.find(function(x){return x.id===id;}); return a&&a.tone==="helpful"; });
      var allRisky0 = t0Ids.every(function(id){ var a=actionPool.find(function(x){return x.id===id;}); return a&&a.tone==="risky"; });
      var allRisky1 = t1Ids.every(function(id){ var a=actionPool.find(function(x){return x.id===id;}); return a&&a.tone==="risky"; });

      if (allHelpful0 && allHelpful1) {
        gameState.bothHelpful++;
        var bonus = {}, bonusKey = STAT_KEYS[Math.floor(Math.random()*STAT_KEYS.length)];
        bonus[bonusKey] = 3;
        applyEffectsToTown(gameState.towns[0], bonus, 0);
        applyEffectsToTown(gameState.towns[1], bonus, 1);
        addHistory('<span class="highlight">Community Spirit!</span> Both towns chose all helpful actions — +3 ' + STAT_LABELS[bonusKey] + ' bonus!');
      } else if (allRisky0 && allRisky1) {
        gameState.bothRisky++;
        var penalty = {}, penKey = STAT_KEYS[Math.floor(Math.random()*STAT_KEYS.length)];
        penalty[penKey] = -3;
        applyEffectsToTown(gameState.towns[0], penalty, 0);
        applyEffectsToTown(gameState.towns[1], penalty, 1);
        addHistory('<span class="highlight">Both Suffered!</span> Both towns chose all risky actions — −3 ' + STAT_LABELS[penKey] + ' penalty.');
      }

      gameState.snapshots.push(takeSnapshot());
      els.turnPrompt.textContent = "Results revealed! Compare the effects, then press Next Round.";
      els.phaseLabel.textContent = "Round complete — effects applied";
      els.nextRoundBtn.disabled = false;
    }
  }

  renderActions();
  updateLeaderText();
  render();
}

function applyDeferredActions() {
  for (var ti = 0; ti < 2; ti++) {
    gameState.pendingActions[ti].forEach(function(action){
      applyEffectsToTown(gameState.towns[ti], action.effects, ti);
    });
    addHistory('<span class="highlight">' + gameState.towns[ti].name + ' effects revealed:</span> ' +
      gameState.pendingActions[ti].map(function(a){ return a.title; }).join(" + "));
  }
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
  els.actionPrompt.textContent = "Game Over";
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
  if (!gameState.currentRound || gameState.phase === "ready" || gameState.phase === "gameOver" || gameState.phase === "eventReveal") {
    els.actionPrompt.textContent = gameState.phase === "eventReveal" ? "Read the event above..." : "Action Choices";
    els.actionsGrid.className = "actions-grid";
    return;
  }
  var ti = gameState.activeTownIndex;
  if (ti === null) {
    els.actionPrompt.textContent = "Round complete";
    els.actionsGrid.className = "actions-grid";
    return;
  }
  var town = gameState.towns[ti];
  var remaining = gameState.choicesRemaining[ti];
  var chosen = gameState.chosenByTown[ti];
  els.actionPrompt.textContent = town.name + " — Pick " + remaining + " action" + (remaining !== 1 ? "s" : "");
  // Color the grid to match the active town
  els.actionsGrid.className = "actions-grid " + (ti === 0 ? "town1-turn" : "town2-turn");
  var actions = gameState.currentRound.actions;
  actions.forEach(function(action, index) {
    var isChosen = chosen.indexOf(index) >= 0;
    var btn = document.createElement("button");
    btn.className = "action-btn";
    btn.disabled = isChosen || town.budget < action.cost || remaining <= 0;
    if (isChosen) btn.classList.add("action-chosen");
    btn.innerHTML =
      '<strong>' + action.title + '</strong>' +
      '<div class="action-cost">Cost: $' + action.cost + '</div>' +
      '<div class="action-desc">' + (action.description||"") + '</div>';
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

var TOWN_BORDER = ["#2a7de1", "#2f8f4e"];  // Town1=blue, Town2=green
var TOWN_GLOW   = ["rgba(42,125,225,0.45)", "rgba(47,143,78,0.45)"];

function drawTownPanel(town, x, y, w, h, isActive, townIndex) {
  ctx.save();

  var borderColor = TOWN_BORDER[townIndex] || "#2a7de1";
  // Pulsing glow for active town
  if (isActive) {
    var pulse = 10 + Math.sin(frameCount * 0.06) * 6;
    ctx.shadowColor = TOWN_GLOW[townIndex] || "rgba(42,125,225,0.45)";
    ctx.shadowBlur = pulse;
  }

  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = isActive ? 6 : 4;
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

  drawTownScene(town, x+20, y+60, w-40, 220, townIndex);

  var barY = y + 300;
  STAT_KEYS.forEach(function(key){
    var dv = displayStats[townIndex] ? displayStats[townIndex][key] : town[key];
    drawBar(x+24, barY, w-48, 20, key, town[key], dv);
    barY += 34;
  });

  // Budget bar (same style as stats)
  var dispBudget = displayStats[townIndex] ? displayStats[townIndex].budget : town.budget;
  drawBudgetBar(x+24, barY, w-48, 20, town.budget, dispBudget);

  ctx.restore();
}


function drawTownScene(town, x, y, w, h, townIndex) {
  ctx.save();

  const airBad = town.air < 45;
  const waterBad = town.water < 45;
  const landBad = town.land < 45;
  const businessBad = town.business < 50;
  const healthBad = town.health < 50;

  // SKY
  let skyGrad = ctx.createLinearGradient(x, y, x, y + h * 0.6);
  if (town.air >= 70) {
    skyGrad.addColorStop(0, "#8fd3ff");
    skyGrad.addColorStop(1, "#e7f8ff");
  } else if (town.air >= 45) {
    skyGrad.addColorStop(0, "#bcc7d1");
    skyGrad.addColorStop(1, "#e1e7eb");
  } else {
    skyGrad.addColorStop(0, "#8e8e8e");
    skyGrad.addColorStop(1, "#b8afa7");
  }
  ctx.fillStyle = skyGrad;
  ctx.fillRect(x, y, w, h * 0.6);

  // distant hills
  ctx.fillStyle = town.land >= 50 ? "rgba(118,185,98,0.28)" : "rgba(148,136,110,0.22)";
  ctx.beginPath();
  ctx.moveTo(x, y + h * 0.44);
  ctx.bezierCurveTo(x + w * 0.18, y + h * 0.28, x + w * 0.34, y + h * 0.40, x + w * 0.52, y + h * 0.30);
  ctx.bezierCurveTo(x + w * 0.70, y + h * 0.22, x + w * 0.86, y + h * 0.35, x + w, y + h * 0.28);
  ctx.lineTo(x + w, y + h * 0.58);
  ctx.lineTo(x, y + h * 0.58);
  ctx.closePath();
  ctx.fill();

  // sun or warning icon
  const sunX = x + w - 44;
  const sunY = y + 36;
  if (!airBad && !waterBad) {
    ctx.fillStyle = "#ffe36a";
    ctx.beginPath();
    ctx.arc(sunX, sunY, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffd23c";
    for (let r = 0; r < 8; r++) {
      const ang = r * Math.PI / 4 + frameCount * 0.01;
      ctx.fillRect(
        sunX + Math.cos(ang) * 24 - 2,
        sunY + Math.sin(ang) * 24 - 2,
        5,
        5
      );
    }
  } else {
    ctx.fillStyle = "#eca83a";
    ctx.beginPath();
    ctx.moveTo(sunX, sunY - 20);
    ctx.lineTo(sunX - 18, sunY + 16);
    ctx.lineTo(sunX + 18, sunY + 16);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#6e4f00";
    ctx.fillRect(sunX - 2, sunY - 7, 4, 12);
    ctx.beginPath();
    ctx.arc(sunX, sunY + 10, 2.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // clouds
  if (town.air >= 55) {
    ctx.fillStyle = town.air >= 75 ? "rgba(255,255,255,0.92)" : "rgba(236,240,242,0.82)";
    drawCloud(x + 56, y + 48, 0.95);
    drawCloud(x + 190, y + 58, 0.75);
    drawCloud(x + 330, y + 40, 0.85);
  }

  // haze
  if (town.air < 55) {
    ctx.fillStyle = town.air < 35 ? "rgba(108,100,92,0.22)" : "rgba(165,165,165,0.12)";
    ctx.fillRect(x, y, w, h * 0.70);
  }

  // GROUND
  const groundY = y + h * 0.58;
  let groundGrad = ctx.createLinearGradient(x, groundY, x, y + h);
  if (town.land >= 70) {
    groundGrad.addColorStop(0, "#8fd576");
    groundGrad.addColorStop(1, "#72b85c");
  } else if (town.land >= 45) {
    groundGrad.addColorStop(0, "#a8c57b");
    groundGrad.addColorStop(1, "#90ac65");
  } else {
    groundGrad.addColorStop(0, "#ad9a72");
    groundGrad.addColorStop(1, "#8b7856");
  }
  ctx.fillStyle = groundGrad;
  ctx.fillRect(x, groundY, w, h - (groundY - y));

  // LEFT RIVER + SHORE
  const riverRight = x + w * 0.23;

  // sandy shoreline
  ctx.fillStyle = "#ccb58b";
  ctx.beginPath();
  ctx.moveTo(riverRight - 18, y);
  ctx.bezierCurveTo(riverRight + 8, y + h * 0.18, riverRight - 28, y + h * 0.40, riverRight + 10, y + h * 0.70);
  ctx.bezierCurveTo(riverRight + 14, y + h * 0.84, riverRight + 4, y + h * 0.94, riverRight - 6, y + h);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x, y);
  ctx.closePath();
  ctx.fill();

  // river body
  let riverGrad = ctx.createLinearGradient(x, y, riverRight, y + h);
  if (town.water >= 70) {
    riverGrad.addColorStop(0, "#66cbff");
    riverGrad.addColorStop(1, "#2587d8");
  } else if (town.water >= 45) {
    riverGrad.addColorStop(0, "#5d9dbc");
    riverGrad.addColorStop(1, "#3d708f");
  } else {
    riverGrad.addColorStop(0, "#6d7c56");
    riverGrad.addColorStop(1, "#4e583a");
  }

  ctx.fillStyle = riverGrad;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(riverRight - 24, y);
  ctx.bezierCurveTo(riverRight + 4, y + h * 0.16, riverRight - 34, y + h * 0.40, riverRight + 6, y + h * 0.70);
  ctx.bezierCurveTo(riverRight + 10, y + h * 0.84, riverRight - 8, y + h * 0.94, riverRight - 14, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.fill();

  // ripples
  ctx.strokeStyle = town.water >= 45 ? "rgba(255,255,255,0.42)" : "rgba(255,255,255,0.16)";
  ctx.lineWidth = 2;
  for (let wr = 0; wr < 5; wr++) {
    const ry = y + 28 + wr * 42 + Math.sin(frameCount * 0.03 + wr) * 2;
    ctx.beginPath();
    ctx.moveTo(x + 14, ry);
    ctx.bezierCurveTo(x + 48, ry - 6, x + 86, ry + 6, x + 118, ry);
    ctx.stroke();
  }

  // reeds / rocks
  for (let rr = 0; rr < 5; rr++) {
    const rx = riverRight - 8 + (rr % 2) * 10;
    const ry2 = y + 46 + rr * 42;
    if (rr % 2 === 0) {
      ctx.fillStyle = "#7d8a92";
      ctx.beginPath();
      ctx.ellipse(rx, ry2, 7, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = "#7cad5a";
      ctx.fillRect(rx, ry2 - 8, 2, 10);
      ctx.fillRect(rx + 4, ry2 - 11, 2, 13);
    }
  }

  // polluted patches
  if (town.water < 50) {
    ctx.fillStyle = town.water < 30 ? "rgba(84,94,42,0.56)" : "rgba(130,120,70,0.34)";
    ctx.beginPath();
    ctx.ellipse(riverRight - 12, y + h * 0.64, 20, 8, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(riverRight - 18, y + h * 0.44, 15, 6, 0.15, 0, Math.PI * 2);
    ctx.fill();
  }

  // BRIDGE + MAIN ROAD
  const roadY = y + h * 0.64;
  const roadH = 28;

  // bridge
  ctx.fillStyle = "#7b8690";
  ctx.fillRect(riverRight - 30, roadY - 2, 58, roadH + 4);

  // road
  ctx.fillStyle = "#5b646d";
  ctx.fillRect(riverRight + 20, roadY, w - (riverRight - x) - 30, roadH);

  // road dashes
  ctx.strokeStyle = "#f8ef9f";
  ctx.lineWidth = 3;
  for (let dl = riverRight + 40; dl < x + w - 40; dl += 34) {
    ctx.beginPath();
    ctx.moveTo(dl, roadY + roadH / 2);
    ctx.lineTo(dl + 18, roadY + roadH / 2);
    ctx.stroke();
  }

  // park path down from road
  ctx.fillStyle = "#d5bf96";
  ctx.fillRect(x + w * 0.49, roadY + roadH, 14, h * 0.17);

  // FACTORY ZONE
  const fx = x + w * 0.25;
  const fy = y + h * 0.31;
  const fw = 112;
  const fh = 72;

  // factory body
  ctx.fillStyle = businessBad ? "#969ca5" : "#adb7c2";
  ctx.fillRect(fx, fy, fw, fh);

  // roof zig-zag
  ctx.fillStyle = "#7f8893";
  ctx.beginPath();
  ctx.moveTo(fx - 4, fy);
  ctx.lineTo(fx + 24, fy - 18);
  ctx.lineTo(fx + 50, fy);
  ctx.lineTo(fx + 78, fy - 18);
  ctx.lineTo(fx + 106, fy);
  ctx.lineTo(fx + 116, fy);
  ctx.lineTo(fx + 116, fy + 4);
  ctx.lineTo(fx - 4, fy + 4);
  ctx.closePath();
  ctx.fill();

  // stacks
  ctx.fillStyle = "#6e7882";
  ctx.fillRect(fx + 14, fy - 34, 18, 34);
  ctx.fillRect(fx + 46, fy - 54, 18, 54);
  ctx.fillRect(fx + 78, fy - 28, 16, 28);

  // windows
  ctx.fillStyle = airBad ? "#9ca5ad" : "#dcefff";
  for (let wx = 0; wx < 4; wx++) {
    ctx.fillRect(fx + 12 + wx * 24, fy + 18, 14, 12);
    ctx.fillRect(fx + 12 + wx * 24, fy + 40, 14, 12);
  }

  // door
  ctx.fillStyle = "#5f4d3e";
  ctx.fillRect(fx + fw - 18, fy + fh - 24, 12, 24);

  // drain pipe toward river
  ctx.fillStyle = "#6a727c";
  ctx.fillRect(fx - 24, fy + 48, 24, 9);
  if (town.water < 55) {
    ctx.fillStyle = town.water < 30 ? "#51603c" : "#8d8b58";
    ctx.beginPath();
    ctx.ellipse(fx - 28, fy + 57, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // static smoke puffs
  const smokiness = town.air >= 70 ? 1 : town.air >= 45 ? 3 : 5;
  const smokeBaseX = fx + 54;
  const smokeBaseY = fy - 52;
  for (let sp = 0; sp < smokiness; sp++) {
    const sx = smokeBaseX + Math.sin(frameCount * 0.02 + sp) * 4 + sp * 6;
    const sy = smokeBaseY - sp * 11;
    const sr = 10 + sp * 3;
    ctx.fillStyle = town.air >= 70
      ? "rgba(230,240,245,0.45)"
      : town.air >= 45
      ? "rgba(170,175,180,0.45)"
      : "rgba(95,95,95,0.60)";
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();
  }

  // PARK
  const parkX = x + w * 0.44;
  const parkY = y + h * 0.43;
  const parkW = w * 0.23;
  const parkH = h * 0.33;

  ctx.fillStyle = town.land >= 55 ? "#90dd79" : town.land >= 35 ? "#a0ae6b" : "#8d7b61";
  roundRect(ctx, parkX, parkY, parkW, parkH, 18, true, false);

  // curving path
  ctx.strokeStyle = "#ead7b4";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(parkX + 20, parkY + parkH - 16);
  ctx.quadraticCurveTo(parkX + parkW * 0.45, parkY + parkH * 0.55, parkX + parkW - 20, parkY + 18);
  ctx.stroke();

  // bench
  ctx.fillStyle = "#8b5a2b";
  ctx.fillRect(parkX + 24, parkY + 28, 22, 6);
  ctx.fillRect(parkX + 24, parkY + 36, 22, 4);
  ctx.fillRect(parkX + 27, parkY + 40, 3, 10);
  ctx.fillRect(parkX + 40, parkY + 40, 3, 10);

  // fountain or dirt patch
  if (town.land >= 65 && town.water >= 60) {
    ctx.fillStyle = "#d8edf8";
    ctx.beginPath();
    ctx.arc(parkX + parkW * 0.66, parkY + parkH * 0.54, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#63bdf1";
    ctx.fillRect(parkX + parkW * 0.66 - 3, parkY + parkH * 0.54 - 16, 6, 16);
  } else {
    ctx.fillStyle = "#876b54";
    ctx.beginPath();
    ctx.ellipse(parkX + parkW * 0.66, parkY + parkH * 0.54, 18, 12, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // flowers if healthy
  if (town.land >= 70 && town.health >= 65) {
    for (let fl = 0; fl < 6; fl++) {
      const fx2 = parkX + 16 + fl * 22;
      const fy2 = parkY + parkH - 6;
      ctx.fillStyle = ["#ff6fa0", "#ffd34d", "#7a6cff"][fl % 3];
      ctx.beginPath();
      ctx.arc(fx2, fy2, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // DOWNTOWN
  const shopStartX = x + w * 0.73;
  const shopY = y + h * 0.38;
  const shopGap = 10;

  for (let b = 0; b < 3; b++) {
    const bx = shopStartX + b * (54 + shopGap);
    const by = shopY + (b % 2) * 6;
    const bw = 54;
    const bh = 74 - (b % 2) * 4;

    ctx.fillStyle = businessBad ? "#9f9890" : ["#f2c572", "#f29d72", "#8ac6f2"][b];
    roundRect(ctx, bx, by, bw, bh, 8, true, false);

    ctx.fillStyle = businessBad ? "#7b736c" : "#d15b5b";
    ctx.fillRect(bx - 2, by - 8, bw + 4, 10);

    // windows
    ctx.fillStyle = businessBad ? "#8a827a" : "#eaf7ff";
    ctx.fillRect(bx + 8, by + 12, 14, 12);
    ctx.fillRect(bx + bw - 22, by + 12, 14, 12);

    // awning
    if (!businessBad) {
      ctx.fillStyle = ["#3d86d6", "#4db26b", "#e28b2d"][b];
      ctx.fillRect(bx + 4, by + 28, bw - 8, 8);
    }

    // door or boarded front
    if (town.business >= 50 || b === 0) {
      ctx.fillStyle = "#7c5330";
      ctx.fillRect(bx + 20, by + bh - 26, 14, 26);
    } else {
      ctx.fillStyle = "#675241";
      ctx.fillRect(bx + 16, by + bh - 30, 22, 30);
      ctx.strokeStyle = "#c9ae7f";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(bx + 16, by + bh - 24);
      ctx.lineTo(bx + 38, by + bh - 10);
      ctx.moveTo(bx + 16, by + bh - 10);
      ctx.lineTo(bx + 38, by + bh - 24);
      ctx.stroke();
    }
  }

  // CLINIC
  const clinicX = x + w * 0.78;
  const clinicY = y + h * 0.70;

  ctx.fillStyle = "#eef3f8";
  roundRect(ctx, clinicX, clinicY, 82, 62, 10, true, false);

  ctx.fillStyle = "#dfe6ee";
  ctx.beginPath();
  ctx.moveTo(clinicX - 4, clinicY);
  ctx.lineTo(clinicX + 41, clinicY - 18);
  ctx.lineTo(clinicX + 86, clinicY);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#c9d4de";
  ctx.fillRect(clinicX + 30, clinicY + 36, 18, 26);

  const crossPulse = healthBad ? 1 + Math.sin(frameCount * 0.08) * 0.08 : 1;
  ctx.fillStyle = town.health >= 60 ? "#d94f45" : "#f1b100";
  ctx.fillRect(clinicX + 39 - 6 * crossPulse, clinicY + 10, 12 * crossPulse, 24 * crossPulse);
  ctx.fillRect(clinicX + 39 - 12 * crossPulse, clinicY + 16, 24 * crossPulse, 12 * crossPulse);

  // TREES
  const treeCount = Math.max(2, Math.min(8, Math.floor(town.land / 12)));
  const treeSpots = [
    [parkX - 24, parkY + 24],
    [parkX + 14, parkY - 6],
    [parkX + parkW - 8, parkY + 12],
    [parkX + parkW - 26, parkY + parkH - 6],
    [x + w * 0.34, y + h * 0.55],
    [x + w * 0.58, y + h * 0.34],
    [x + w * 0.68, y + h * 0.56],
    [x + w * 0.52, y + h * 0.78]
  ];

  for (let t = 0; t < treeCount; t++) {
    const tp = treeSpots[t];
    drawTree(
      tp[0] + Math.sin(frameCount * 0.02 + t) * 1.5,
      tp[1],
      town.land >= 50 ? "#41aa5f" : "#8e8a53",
      t % 3 === 0,
      20 + t
    );
  }

  // PEOPLE
  const personCount = town.health >= 65 ? 4 : town.health >= 45 ? 2 : 1;
  const personColors = ["#d95f4e", "#2a7de1", "#3ba55d", "#8a5fd9"];
  for (let p = 0; p < personCount; p++) {
    const px = parkX + 30 + p * 28;
    const py = parkY + parkH - 18 - (p % 2) * 8;
    drawPerson(px, py, personColors[p % personColors.length]);
  }

  // TRASH
  const trashCount = Math.max(0, Math.floor((60 - Math.min(town.land, town.water)) / 7));
  const trashSpots = [
    [riverRight - 14, y + h * 0.30],
    [riverRight - 4, y + h * 0.52],
    [parkX + 10, parkY + parkH - 8],
    [parkX + 64, parkY + 22],
    [x + w * 0.72, roadY + 38],
    [x + w * 0.88, roadY + 34]
  ];
  for (let tr = 0; tr < trashCount && tr < trashSpots.length; tr++) {
    drawTrash(trashSpots[tr][0], trashSpots[tr][1], tr);
  }

  // FISH
  const fishCount = town.water >= 70 ? 4 : town.water >= 45 ? 2 : 0;
  for (let fi = 0; fi < fishCount; fi++) {
    const fpx = x + 42 + fi * 20 + Math.sin(frameCount * 0.03 + fi) * 6;
    const fpy = y + h * (0.34 + fi * 0.13);
    drawFish(fpx, fpy, town.water >= 70 ? "#ecfbff" : "#c0d9e8");
  }

  // dead fish if very bad
  if (town.water < 30) {
    ctx.strokeStyle = "#e4e4e4";
    ctx.lineWidth = 2;
    for (let df = 0; df < 2; df++) {
      const dfx = x + 56 + df * 26;
      const dfy = y + h * (0.58 + df * 0.08);
      ctx.beginPath();
      ctx.ellipse(dfx, dfy, 10, 5, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(dfx - 7, dfy - 4);
      ctx.lineTo(dfx + 7, dfy + 4);
      ctx.stroke();
    }
  }

  // smoke particles
  drawSmokeForPanel(x, y, w, h, townIndex);

  ctx.restore();
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
  roundRect(ctx, x, y, w, h, 8, true, false);
  // Animated bar via lerp
  var barW = Math.max(0, w * (displayValue / 100));
  // Gradient fill
  var grad = ctx.createLinearGradient(x, y, x + barW, y);
  grad.addColorStop(0, STAT_COLORS[key]);
  grad.addColorStop(1, lightenColor(STAT_COLORS[key], 30));
  ctx.fillStyle = grad;
  roundRect(ctx, x, y, barW, h, 8, true, false);
  // Label
  ctx.fillStyle = "#16324f";
  ctx.font = "bold 14px Arial";
  ctx.fillText(STAT_LABELS[key] + ": " + realValue, x+10, y+15);
}

function drawBudgetBar(x, y, w, h, realValue, displayValue) {
  // Budget 0-100 range for bar width (cap at 100)
  var pct = Math.min(Math.max(displayValue, 0), 100);
  ctx.fillStyle = "#edf3f8";
  roundRect(ctx, x, y, w, h, 8, true, false);
  var barW = Math.max(0, w * (pct / 100));
  var col = realValue >= 20 ? STAT_COLORS.budget : "#d44f45";
  var grad = ctx.createLinearGradient(x, y, x + barW, y);
  grad.addColorStop(0, col);
  grad.addColorStop(1, lightenColor(col, 30));
  ctx.fillStyle = grad;
  roundRect(ctx, x, y, barW, h, 8, true, false);
  ctx.fillStyle = "#16324f";
  ctx.font = "bold 14px Arial";
  ctx.fillText("Budget: $" + realValue, x+10, y+15);
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
  var t1Active = gameState.phase === "choosing" && gameState.activeTownIndex === 0;
  var t2Active = gameState.phase === "choosing" && gameState.activeTownIndex === 1;
  drawTownPanel(gameState.towns[0], 24, 54, 636, 520, t1Active, 0);
  drawTownPanel(gameState.towns[1], 700, 54, 636, 520, t2Active, 1);
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
els.closeReportBtn.addEventListener("click", function(){ els.reportCard.classList.add("hidden"); });
els.eventOverlayBtn.addEventListener("click", dismissEventOverlay);

// ── Init ──
resetGame();
loop();
