import React, { useEffect, useMemo, useRef, useState } from "react";

const MATERIALS = [
  {
    id: "steel",
    name: "Titan Steel",
    short: "Steel",
    density: 9,
    impact: 9,
    bend: 8,
    fire: 8,
    heat: 3,
    water: 3,
    acid: 5,
    nonMagnetic: 1,
    lowConductivity: 2,
    note: "Very strong, but heavy, magnetic, and can rust."
  },
  {
    id: "plastic",
    name: "Aqua Plastic",
    short: "Plastic",
    density: 3,
    impact: 4,
    bend: 6,
    fire: 2,
    heat: 4,
    water: 9,
    acid: 7,
    nonMagnetic: 9,
    lowConductivity: 8,
    note: "Light and waterproof, but weak against heat and impact."
  },
  {
    id: "rubber",
    name: "Flexi Rubber",
    short: "Rubber",
    density: 4,
    impact: 5,
    bend: 10,
    fire: 1,
    heat: 2,
    water: 8,
    acid: 6,
    nonMagnetic: 9,
    lowConductivity: 8,
    note: "Great for bending joints, but burns and melts easily."
  },
  {
    id: "ceramic",
    name: "Heat Ceramic",
    short: "Ceramic",
    density: 6,
    impact: 3,
    bend: 1,
    fire: 10,
    heat: 10,
    water: 8,
    acid: 7,
    nonMagnetic: 9,
    lowConductivity: 9,
    note: "Excellent heat shield, but brittle when smashed or bent."
  },
  {
    id: "foam",
    name: "Carbon Foam",
    short: "Foam",
    density: 2,
    impact: 8,
    bend: 7,
    fire: 2,
    heat: 5,
    water: 3,
    acid: 3,
    nonMagnetic: 10,
    lowConductivity: 7,
    note: "Light and shock absorbing, but flammable and chemically weak."
  },
  {
    id: "glass",
    name: "Glass Polymer",
    short: "Glass",
    density: 5,
    impact: 2,
    bend: 1,
    fire: 8,
    heat: 6,
    water: 9,
    acid: 10,
    nonMagnetic: 10,
    lowConductivity: 8,
    note: "Great against acid and water, but cracks under force."
  },
  {
    id: "copper",
    name: "Copper Mesh",
    short: "Copper",
    density: 8,
    impact: 6,
    bend: 7,
    fire: 7,
    heat: 1,
    water: 4,
    acid: 3,
    nonMagnetic: 7,
    lowConductivity: 1,
    note: "Flexible and energy-blocking, but transfers heat and corrodes."
  },
  {
    id: "wood",
    name: "Wood Fiber Board",
    short: "Wood",
    density: 4,
    impact: 5,
    bend: 6,
    fire: 1,
    heat: 7,
    water: 2,
    acid: 6,
    nonMagnetic: 10,
    lowConductivity: 8,
    note: "Light and low heat transfer, but burns and absorbs water."
  },
  {
    id: "aluminum",
    name: "Aluminum Alloy",
    short: "Aluminum",
    density: 5,
    impact: 6,
    bend: 5,
    fire: 7,
    heat: 2,
    water: 7,
    acid: 4,
    nonMagnetic: 8,
    lowConductivity: 2,
    note: "Balanced and light, but dents and transfers heat."
  },
  {
    id: "magno",
    name: "Magno-Metal",
    short: "Magno",
    density: 10,
    impact: 10,
    bend: 8,
    fire: 9,
    heat: 5,
    water: 2,
    acid: 4,
    nonMagnetic: 0,
    lowConductivity: 3,
    note: "Extremely strong, but very heavy, magnetic, and rust-prone."
  }
];

const HEROES = [
  {
    id: "flame",
    name: "Flame Face",
    power: "Fire Breath",
    stat: "fire",
    target: "shield",
    emoji: "🔥",
    lesson: "Low flammability helps materials survive fire."
  },
  {
    id: "laser",
    name: "Laser Lass",
    power: "Laser Vision",
    stat: "heat",
    target: "shield",
    emoji: "🔆",
    lesson: "Low heat transfer helps protect the robot from heating up."
  },
  {
    id: "splash",
    name: "Captain Splash",
    power: "Water Cannon",
    stat: "water",
    target: "shield",
    emoji: "💧",
    lesson: "Water resistance helps prevent rusting and water damage."
  },
  {
    id: "acid",
    name: "Acid Kid",
    power: "Sour Slime",
    stat: "acid",
    target: "shield",
    emoji: "🧪",
    lesson: "Low reactivity helps materials survive chemical attacks."
  },
  {
    id: "bend",
    name: "Bend-O-Man",
    power: "Twist Attack",
    stat: "bend",
    target: "joints",
    emoji: "🌀",
    lesson: "Flexible materials bend without snapping."
  },
  {
    id: "gravity",
    name: "Gravity Goblin",
    power: "Stomp Smash",
    stat: "impact",
    target: "body",
    emoji: "🪨",
    lesson: "Strong materials resist impact, but heavy materials may slow the robot."
  },
  {
    id: "magnet",
    name: "Magnet Max",
    power: "Magnet Pull",
    stat: "nonMagnetic",
    target: "body",
    emoji: "🧲",
    lesson: "Non-magnetic materials are harder for magnets to control."
  },
  {
    id: "static",
    name: "Static Shock Sue",
    power: "Electric Zap",
    stat: "lowConductivity",
    target: "joints",
    emoji: "⚡",
    lesson: "Low conductivity helps block electric current."
  }
];

const PART_LABELS = {
  body: "Body Armor",
  shield: "Shield",
  joints: "Joint Cover"
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getMaterial(id) {
  return MATERIALS.find((m) => m.id === id) || MATERIALS[0];
}

function calculateRound(hero, build) {
  const material = getMaterial(build[hero.target]);
  const defense = material[hero.stat];
  const densityPenalty = hero.target === "body" ? Math.max(0, material.density - 6) * 2 : Math.max(0, material.density - 8);
  const damage = clamp(32 - defense * 2.7 + densityPenalty, 2, 35);
  return {
    hero,
    material,
    defense,
    damage: Math.round(damage),
    part: hero.target,
    result: defense >= 8 ? "Great match" : defense >= 5 ? "Survived" : "Weak choice"
  };
}

function buildScore(build, heroes) {
  const rounds = heroes.map((hero) => calculateRound(hero, build));
  const totalDamage = rounds.reduce((sum, r) => sum + r.damage, 0);
  const mass = getMaterial(build.body).density + getMaterial(build.shield).density + getMaterial(build.joints).density;
  const massPenalty = Math.max(0, mass - 18) * 2;
  const score = clamp(100 - totalDamage - massPenalty, 0, 100);
  return { rounds, totalDamage, mass, massPenalty, score: Math.round(score) };
}

function randomArena() {
  const shuffled = [...HEROES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

export default function RobotRumbleMaterialsGame() {
  const canvasRef = useRef(null);
  const [build, setBuild] = useState({ body: "aluminum", shield: "ceramic", joints: "rubber" });
  const [possibleHeroes, setPossibleHeroes] = useState(() => randomArena());
  const [activeHeroes, setActiveHeroes] = useState([]);
  const [roundIndex, setRoundIndex] = useState(-1);
  const [battleLog, setBattleLog] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [frame, setFrame] = useState(0);
  const [bestScore, setBestScore] = useState(null);

  const scorePreview = useMemo(() => {
    const heroes = activeHeroes.length ? activeHeroes : possibleHeroes.slice(0, 2);
    return buildScore(build, heroes);
  }, [build, activeHeroes, possibleHeroes]);

  function updatePart(part, materialId) {
    if (isRunning) return;
    setBuild((prev) => ({ ...prev, [part]: materialId }));
  }

  function newArena() {
    if (isRunning) return;
    setPossibleHeroes(randomArena());
    setActiveHeroes([]);
    setRoundIndex(-1);
    setBattleLog([]);
  }

  function runBattle() {
    if (isRunning) return;
    const selected = [...possibleHeroes].sort(() => Math.random() - 0.5).slice(0, 2);
    setActiveHeroes(selected);
    setBattleLog([]);
    setRoundIndex(0);
    setIsRunning(true);
    setFrame(0);
  }

  function resetBattle() {
    setIsRunning(false);
    setActiveHeroes([]);
    setRoundIndex(-1);
    setBattleLog([]);
    setFrame(0);
  }

  useEffect(() => {
    if (!isRunning) return;
    const timer = setInterval(() => {
      setFrame((f) => f + 1);
    }, 50);
    return () => clearInterval(timer);
  }, [isRunning]);

  useEffect(() => {
    if (!isRunning || activeHeroes.length === 0) return;
    if (frame > 0 && frame % 55 === 0) {
      const hero = activeHeroes[roundIndex];
      if (hero) {
        const result = calculateRound(hero, build);
        setBattleLog((prev) => [...prev, result]);
      }
      if (roundIndex >= activeHeroes.length - 1) {
        setIsRunning(false);
        const final = buildScore(build, activeHeroes);
        setBestScore((prev) => (prev === null ? final.score : Math.max(prev, final.score)));
      } else {
        setRoundIndex((i) => i + 1);
      }
    }
  }, [frame, isRunning, activeHeroes, roundIndex, build]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, "#e0f2fe");
    sky.addColorStop(1, "#f8fafc");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "#0f172a";
    ctx.font = "700 22px system-ui, sans-serif";
    ctx.fillText("Robot Rumble: Materials Mayhem", 24, 34);

    ctx.font = "14px system-ui, sans-serif";
    ctx.fillStyle = "#475569";
    ctx.fillText("Pick materials. Survive two surprise superhero attacks.", 24, 58);

    // Arena floor
    ctx.fillStyle = "#cbd5e1";
    ctx.fillRect(0, height - 60, width, 60);
    ctx.fillStyle = "#94a3b8";
    for (let x = 0; x < width; x += 40) {
      ctx.fillRect(x, height - 60, 20, 4);
    }

    // Robot
    const robotX = 180;
    const robotY = height - 145;
    const bodyMat = getMaterial(build.body);
    const shieldMat = getMaterial(build.shield);
    const jointMat = getMaterial(build.joints);

    const damageShake = battleLog.reduce((sum, r) => sum + r.damage, 0) > 45 ? Math.sin(frame * 0.6) * 3 : 0;
    const rx = robotX + damageShake;

    // shadow
    ctx.fillStyle = "rgba(15,23,42,0.16)";
    ctx.beginPath();
    ctx.ellipse(rx + 20, robotY + 95, 78, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // legs / joints
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 10;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(rx - 20, robotY + 52);
    ctx.lineTo(rx - 38, robotY + 86);
    ctx.moveTo(rx + 28, robotY + 52);
    ctx.lineTo(rx + 50, robotY + 86);
    ctx.stroke();

    ctx.fillStyle = materialColor(jointMat.id);
    ctx.beginPath();
    ctx.arc(rx - 20, robotY + 52, 10, 0, Math.PI * 2);
    ctx.arc(rx + 28, robotY + 52, 10, 0, Math.PI * 2);
    ctx.fill();

    // body
    ctx.fillStyle = materialColor(bodyMat.id);
    roundRect(ctx, rx - 35, robotY - 25, 90, 82, 16);
    ctx.fill();
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 3;
    ctx.stroke();

    // head
    ctx.fillStyle = "#e2e8f0";
    roundRect(ctx, rx - 22, robotY - 72, 64, 42, 14);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.arc(rx - 2, robotY - 50, 4, 0, Math.PI * 2);
    ctx.arc(rx + 23, robotY - 50, 4, 0, Math.PI * 2);
    ctx.fill();

    // shield
    ctx.fillStyle = materialColor(shieldMat.id);
    ctx.globalAlpha = 0.92;
    roundRect(ctx, rx + 58, robotY - 20, 42, 82, 18);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = "#0f172a";
    ctx.font = "700 12px system-ui, sans-serif";
    ctx.fillText(bodyMat.short, rx - 24, robotY + 20);
    ctx.fillText(shieldMat.short, rx + 60, robotY + 28);
    ctx.fillText(jointMat.short, rx - 52, robotY + 108);

    // Heroes
    const heroesToDraw = activeHeroes.length ? activeHeroes : possibleHeroes;
    heroesToDraw.forEach((hero, i) => {
      const hx = width - 250 + i * 115;
      const hy = height - 145;
      const attacking = isRunning && activeHeroes[roundIndex]?.id === hero.id;
      const pulse = attacking ? Math.sin(frame * 0.35) * 8 : 0;

      ctx.fillStyle = attacking ? "#fef3c7" : "#ffffff";
      roundRect(ctx, hx - 35 - pulse / 2, hy - 92 - pulse / 2, 86 + pulse, 112 + pulse, 20);
      ctx.fill();
      ctx.strokeStyle = attacking ? "#f59e0b" : "#cbd5e1";
      ctx.lineWidth = attacking ? 4 : 2;
      ctx.stroke();

      ctx.font = "32px system-ui";
      ctx.fillText(hero.emoji, hx - 14, hy - 48);
      ctx.fillStyle = "#0f172a";
      ctx.font = "700 12px system-ui, sans-serif";
      centerText(ctx, hero.name, hx + 8, hy - 20);
      ctx.font = "11px system-ui, sans-serif";
      ctx.fillStyle = "#64748b";
      centerText(ctx, hero.power, hx + 8, hy - 3);

      if (attacking) {
        drawAttack(ctx, hero, hx, hy, rx + 70, robotY + 10, frame);
      }
    });

    // damage / score board
    const shown = activeHeroes.length ? buildScore(build, activeHeroes) : null;
    const panelX = 24;
    const panelY = height - 210;
    ctx.fillStyle = "rgba(255,255,255,0.86)";
    roundRect(ctx, panelX, panelY, 280, 120, 18);
    ctx.fill();
    ctx.strokeStyle = "#cbd5e1";
    ctx.stroke();
    ctx.fillStyle = "#0f172a";
    ctx.font = "700 15px system-ui, sans-serif";
    ctx.fillText("Battle Score", panelX + 16, panelY + 28);
    ctx.font = "13px system-ui, sans-serif";
    ctx.fillStyle = "#475569";
    ctx.fillText(`Mass total: ${scorePreview.mass}`, panelX + 16, panelY + 54);
    ctx.fillText(`Predicted/Final Score: ${shown ? shown.score : scorePreview.score}`, panelX + 16, panelY + 78);
    ctx.fillText(`Best score: ${bestScore ?? "—"}`, panelX + 16, panelY + 102);
  }, [build, possibleHeroes, activeHeroes, battleLog, isRunning, roundIndex, frame, scorePreview, bestScore]);

  const finalScore = activeHeroes.length && !isRunning && battleLog.length === activeHeroes.length ? buildScore(build, activeHeroes) : null;

  return (
    <div className="min-h-screen bg-slate-100 p-4 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold">Robot Rumble: Materials Mayhem</h1>
              <p className="text-sm text-slate-600">Choose robot materials, then battle two surprise superheroes from the arena preview.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={newArena} disabled={isRunning} className="rounded-xl bg-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-300 disabled:opacity-50">New Heroes</button>
              <button onClick={runBattle} disabled={isRunning} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50">Run Battle</button>
              <button onClick={resetBattle} className="rounded-xl bg-white px-4 py-2 text-sm font-semibold ring-1 ring-slate-300 hover:bg-slate-50">Reset</button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-2xl bg-white p-3 shadow-sm">
            <canvas ref={canvasRef} className="h-[460px] w-full rounded-xl border border-slate-200" />
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-lg font-bold">Build Your Robot</h2>
              {Object.entries(PART_LABELS).map(([part, label]) => (
                <div key={part} className="mb-4">
                  <label className="mb-1 block text-sm font-semibold">{label}</label>
                  <select value={build[part]} onChange={(e) => updatePart(part, e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white p-2 text-sm">
                    {MATERIALS.map((mat) => (
                      <option key={mat.id} value={mat.id}>{mat.name}</option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-slate-500">{getMaterial(build[part]).note}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <h2 className="mb-2 text-lg font-bold">Possible Opponents</h2>
              <div className="space-y-2">
                {possibleHeroes.map((hero) => (
                  <div key={hero.id} className="rounded-xl border border-slate-200 p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{hero.emoji} {hero.name}</span>
                      <span className="text-xs text-slate-500">Targets {PART_LABELS[hero.target]}</span>
                    </div>
                    <p className="text-xs text-slate-600">Needs: {statName(hero.stat)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-lg font-bold">Battle Log</h2>
            {battleLog.length === 0 ? (
              <p className="text-sm text-slate-500">Run a battle to see how your material choices perform.</p>
            ) : (
              <div className="space-y-2">
                {battleLog.map((entry, i) => (
                  <div key={`${entry.hero.id}-${i}`} className="rounded-xl bg-slate-50 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold">{entry.hero.emoji} {entry.hero.name}</span>
                      <span className="rounded-full bg-white px-2 py-1 text-xs ring-1 ring-slate-200">Damage: {entry.damage}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{PART_LABELS[entry.part]} used <b>{entry.material.name}</b>. Result: <b>{entry.result}</b>.</p>
                    <p className="mt-1 text-xs text-slate-500">{entry.hero.lesson}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-lg font-bold">Final Score</h2>
            {finalScore ? (
              <div className="space-y-3">
                <div className="text-4xl font-bold">{finalScore.score}/100</div>
                <p className="text-sm text-slate-600">Total damage: {finalScore.totalDamage} | Mass penalty: {finalScore.massPenalty} | Mass total: {finalScore.mass}</p>
                <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Redesign idea: change one material, run a new arena, and compare the score. Best engineers use test data to improve.</p>
              </div>
            ) : (
              <div className="space-y-2 text-sm text-slate-600">
                <p>No final score yet.</p>
                <p>Tip: no material is perfect. A strong robot can still lose to magnets, water, heat, or acid.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function statName(stat) {
  const names = {
    fire: "low flammability",
    heat: "low heat transfer",
    water: "water/rust resistance",
    acid: "low reactivity",
    bend: "bending/flexibility",
    impact: "impact strength",
    nonMagnetic: "non-magnetic material",
    lowConductivity: "low conductivity"
  };
  return names[stat] || stat;
}

function materialColor(id) {
  const colors = {
    steel: "#64748b",
    plastic: "#38bdf8",
    rubber: "#111827",
    ceramic: "#f8fafc",
    foam: "#facc15",
    glass: "#a7f3d0",
    copper: "#b45309",
    wood: "#92400e",
    aluminum: "#cbd5e1",
    magno: "#7c3aed"
  };
  return colors[id] || "#94a3b8";
}

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function centerText(ctx, text, x, y) {
  const width = ctx.measureText(text).width;
  ctx.fillText(text, x - width / 2, y);
}

function drawAttack(ctx, hero, hx, hy, tx, ty, frame) {
  ctx.save();
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  const wobble = Math.sin(frame * 0.35) * 8;

  if (hero.id === "flame") {
    ctx.strokeStyle = "#ef4444";
    ctx.fillStyle = "#fb923c";
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(hx - 30, hy - 50 + i * 8);
      ctx.quadraticCurveTo((hx + tx) / 2, ty - 80 + wobble, tx, ty - 20 + i * 6);
      ctx.stroke();
    }
  } else if (hero.id === "laser") {
    ctx.strokeStyle = "#f59e0b";
    ctx.beginPath();
    ctx.moveTo(hx - 25, hy - 55);
    ctx.lineTo(tx, ty - 30 + wobble * 0.3);
    ctx.stroke();
    ctx.strokeStyle = "#fde68a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(hx - 25, hy - 55);
    ctx.lineTo(tx, ty - 30 + wobble * 0.3);
    ctx.stroke();
  } else if (hero.id === "splash") {
    ctx.strokeStyle = "#0ea5e9";
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(hx - 35, hy - 45 + i * 6);
      ctx.lineTo(tx - i * 5, ty - 45 + i * 10 + wobble * 0.2);
      ctx.stroke();
    }
  } else if (hero.id === "acid") {
    ctx.strokeStyle = "#22c55e";
    ctx.fillStyle = "#84cc16";
    for (let i = 0; i < 7; i++) {
      ctx.beginPath();
      ctx.arc(tx - i * 11 + wobble, ty - 40 + (i % 3) * 14, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (hero.id === "bend") {
    ctx.strokeStyle = "#8b5cf6";
    ctx.beginPath();
    ctx.arc(tx - 20, ty - 10, 42 + wobble * 0.2, 0, Math.PI * 1.6);
    ctx.stroke();
  } else if (hero.id === "gravity") {
    ctx.fillStyle = "#78716c";
    ctx.beginPath();
    ctx.arc(tx - 20, ty - 95 + Math.abs(wobble), 22, 0, Math.PI * 2);
    ctx.fill();
  } else if (hero.id === "magnet") {
    ctx.strokeStyle = "#dc2626";
    ctx.beginPath();
    ctx.moveTo(hx - 35, hy - 55);
    ctx.lineTo(tx, ty - 30);
    ctx.stroke();
    ctx.fillStyle = "#dc2626";
    ctx.font = "28px system-ui";
    ctx.fillText("🧲", hx - 48, hy - 40);
  } else if (hero.id === "static") {
    ctx.strokeStyle = "#eab308";
    ctx.beginPath();
    ctx.moveTo(hx - 35, hy - 55);
    ctx.lineTo(tx - 30, ty - 55);
    ctx.lineTo(tx - 10, ty - 30);
    ctx.lineTo(tx - 35, ty - 15);
    ctx.stroke();
  }

  ctx.restore();
}
