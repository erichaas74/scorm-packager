/* ================================================================
   Frontier Trading Company — EventSystem
   Random events with math challenges and decision points
   ================================================================ */

const EVENT_POOL = [
  // ── NEGATIVE — damage / cost ──
  {
    id:'wheel_break', type:'negative', title:'Wagon Wheel Cracked!',
    icon:'🔧', terrain:['mountain','forest','plains'],
    prob:{ low:0.04, medium:0.10, high:0.18, very_high:0.25 },
    buildEvent(cargo) {
      const pieces = 3, perPiece = 4.75, labor = 9.50;
      const answer = pieces * perPiece + labor;
      return {
        narrative: `Hitting a deep rut, your wagon wheel cracked and snapped. Old Silas the blacksmith can fix it — but it'll cost you.`,
        math: {
          question: `Repairs cost $${perPiece.toFixed(2)} per piece. You need ${pieces} pieces, plus $${labor.toFixed(2)} labor. What is the total repair cost?`,
          answer, tolerance: 0.05,
          hint: `Multiply ${pieces} × $${perPiece.toFixed(2)}, then add $${labor.toFixed(2)} labor.`
        },
        applyFull:  (st) => { st.company.money -= answer; st.sim.repairCosts += answer; },
        applyBonus: (st) => { const disc = answer * 0.8; st.company.money -= disc; st.sim.repairCosts += disc; },
        fullCostLabel: `$${answer.toFixed(2)} repair bill`,
        bonusCostLabel: `$${(answer*0.8).toFixed(2)} (20% haggle discount for correct math!)`
      };
    }
  },
  {
    id:'cargo_spoil', type:'negative', title:'Flour Gone Bad!',
    icon:'🤢', terrain:['river','forest','plains'],
    prob:{ low:0.05, medium:0.12, high:0.08, very_high:0.05 },
    buildEvent(cargo) {
      const flourQty = cargo['flour'] || 0;
      if (flourQty < 2) return null;
      const pct = 0.30, lost = Math.ceil(flourQty * pct);
      const lostValue = lost * GOODS.find(g=>g.id==='flour').buyPrice;
      return {
        narrative: `Cook Martha noticed moisture in your cargo bags. ${pct*100}% of your flour has spoiled and must be discarded.`,
        math: {
          question: `You had ${flourQty} units of flour. ${pct*100}% spoiled. How many units did you lose? (Round up to nearest whole unit)`,
          answer: lost, tolerance: 0,
          hint: `Multiply ${flourQty} × ${pct} = ?`
        },
        applyFull:  (st) => { st.company.cargo['flour'] = Math.max(0,(st.company.cargo['flour']||0)-lost); st.sim.losses += lostValue; },
        applyBonus: (st) => { const save = Math.floor(lost*0.5); const realLost = lost-save; st.company.cargo['flour']=Math.max(0,(st.company.cargo['flour']||0)-realLost); st.sim.losses += realLost*GOODS.find(g=>g.id==='flour').buyPrice; },
        fullCostLabel: `Lost ${lost} units of flour (worth $${lostValue.toFixed(2)})`,
        bonusCostLabel: `Correct! You saved half — only lost ${Math.ceil(lost/2)} units.`
      };
    }
  },
  {
    id:'river_flood', type:'negative', title:'River Floods the Trail!',
    icon:'🌊', terrain:['river'],
    prob:{ low:0.08, medium:0.05, high:0.04, very_high:0.03 },
    buildEvent(cargo) {
      const delay = 2, foodCostPerDay = 1.50;
      const totalDelay = delay * foodCostPerDay;
      return {
        narrative: `Trapper Joe warned you at dawn, but the water rose too fast. Floodwaters swamped the trail and you must wait ${delay} days for them to recede.`,
        math: {
          question: `You spend $${foodCostPerDay.toFixed(2)} per day on supplies. The flood delays you ${delay} days. How much extra will you spend waiting?`,
          answer: totalDelay, tolerance: 0.01,
          hint: `Multiply $${foodCostPerDay.toFixed(2)} × ${delay} days.`
        },
        applyFull:  (st) => { st.company.money -= totalDelay; st.sim.losses += totalDelay; st.sim.maxDays += delay; },
        applyBonus: (st) => { st.company.money -= totalDelay; st.sim.losses += totalDelay; st.sim.maxDays += delay; },
        fullCostLabel: `$${totalDelay.toFixed(2)} extra supply cost + 2 day delay`,
        bonusCostLabel: `$${totalDelay.toFixed(2)} supply cost (same — math didn't change the flood!)`
      };
    }
  },
  {
    id:'cargo_theft', type:'negative', title:'Bandits Raided Your Camp!',
    icon:'🥷', terrain:['mountain','forest','plains','winter'],
    prob:{ low:0.03, medium:0.08, high:0.15, very_high:0.18 },
    buildEvent(cargo) {
      const medQty = cargo['medicine'] || 0;
      const spiceQty = cargo['spices'] || 0;
      const target = medQty > 0 ? 'medicine' : (spiceQty > 0 ? 'spices' : 'fur');
      const targetGood = GOODS.find(g=>g.id===target);
      const qty = cargo[target] || 0;
      if (!qty) return null;
      const stolen = Math.ceil(qty * 0.25);
      const stolenValue = stolen * (targetGood ? targetGood.buyPrice : 5);
      return {
        narrative: `Captain Redhorn's gang crept into camp at night and made off with some of your most valuable cargo!`,
        math: {
          question: `The bandits stole 25% of your ${targetGood ? targetGood.name : target}. You had ${qty} units. How many units were stolen? (Round up)`,
          answer: stolen, tolerance: 0,
          hint: `Multiply ${qty} × 0.25, then round up.`
        },
        applyFull:  (st) => { st.company.cargo[target] = Math.max(0,(st.company.cargo[target]||0)-stolen); st.sim.losses += stolenValue; },
        applyBonus: (st) => { const saved = 1; const realLost = Math.max(0,stolen-saved); st.company.cargo[target]=Math.max(0,(st.company.cargo[target]||0)-realLost); st.sim.losses += realLost*(targetGood?targetGood.buyPrice:5); },
        fullCostLabel: `Lost ${stolen} units of ${targetGood?targetGood.name:target} ($${stolenValue.toFixed(2)})`,
        bonusCostLabel: `Quick thinking! Chased them off — only lost ${Math.max(0,stolen-1)} units.`
      };
    }
  },
  {
    id:'storm_delay', type:'negative', title:'Severe Storm Rolls In!',
    icon:'⛈️', terrain:['mountain','plains','winter'],
    prob:{ low:0.05, medium:0.12, high:0.20, very_high:0.30 },
    buildEvent(cargo) {
      const supplyQty = cargo['salt'] || 0;
      const lossAmt = 8.25;
      return {
        narrative: `A violent storm struck overnight, tearing open supply bags. You lost some salt to the rain.`,
        math: {
          question: `Storm damage cost you $8.25 in lost supplies. You started this leg with $${state.company.money.toFixed(2)}. How much do you have left after the storm?`,
          answer: state.company.money - lossAmt, tolerance: 0.05,
          hint: `Subtract $8.25 from your current money.`
        },
        applyFull:  (st) => { st.company.money -= lossAmt; st.sim.losses += lossAmt; },
        applyBonus: (st) => { const disc = lossAmt * 0.6; st.company.money -= disc; st.sim.losses += disc; },
        fullCostLabel: `Lost $${lossAmt.toFixed(2)} to storm damage`,
        bonusCostLabel: `Correct! You tarped your cargo in time — only lost $${(lossAmt*0.6).toFixed(2)}.`
      };
    }
  },
  {
    id:'bridge_toll', type:'negative', title:'Bridge Keeper Demands a Toll!',
    icon:'🌉', terrain:['plains','forest','river'],
    prob:{ low:0.06, medium:0.09, high:0.04, very_high:0.02 },
    buildEvent(cargo) {
      const weightBrackets = [{max:100,cost:5.00},{max:200,cost:8.50},{max:300,cost:12.00}];
      const w = getCargoWeight();
      const bracket = weightBrackets.find(b=>w<=b.max) || weightBrackets[2];
      return {
        narrative: `Horace the Bridge Keeper steps out from his shack. He charges by cargo weight: under 100 lbs costs $5.00, 101–200 lbs costs $8.50, over 200 lbs costs $12.00.`,
        math: {
          question: `Your cargo weighs ${w} lbs. According to the toll chart, which bracket are you in? What do you owe?`,
          answer: bracket.cost, tolerance: 0.01,
          hint: `Find which weight bracket ${w} lbs falls into, then read the cost.`
        },
        applyFull:  (st) => { st.company.money -= bracket.cost; st.sim.losses += bracket.cost; },
        applyBonus: (st) => { st.company.money -= bracket.cost; st.sim.losses += bracket.cost; },
        fullCostLabel: `Paid $${bracket.cost.toFixed(2)} bridge toll`,
        bonusCostLabel: `Correct bracket! Paid $${bracket.cost.toFixed(2)}.`
      };
    }
  },
  // ── POSITIVE — windfalls / opportunities ──
  {
    id:'trading_oppty', type:'positive', title:'Trading Opportunity!',
    icon:'💰', terrain:['river','plains','forest','mountain','winter'],
    prob:{ low:0.08, medium:0.10, high:0.07, very_high:0.05 },
    buildEvent(cargo) {
      const goodEntries = Object.entries(cargo).filter(([,v])=>v>0);
      if (!goodEntries.length) return null;
      const [gid, qty] = goodEntries[Math.floor(Math.random()*goodEntries.length)];
      const good = GOODS.find(g=>g.id===gid);
      if (!good) return null;
      const sellQty = Math.min(qty, Math.ceil(qty*0.4));
      const bonus = 1.2;
      const revenue = sellQty * good.baseSell * bonus;
      return {
        narrative: `The Beaumont Trading Caravan desperately needs ${good.name}! They offer ${(bonus*100-100).toFixed(0)}% above market price for up to ${sellQty} units.`,
        math: {
          question: `The merchant pays $${(good.baseSell*bonus).toFixed(2)} per unit for ${sellQty} units of ${good.name}. What is the total revenue?`,
          answer: revenue, tolerance: 0.05,
          hint: `Multiply $${(good.baseSell*bonus).toFixed(2)} × ${sellQty} units.`
        },
        applyFull:  (st) => { st.company.cargo[gid] = Math.max(0,(st.company.cargo[gid]||0)-sellQty); st.company.money += revenue * 0.9; },
        applyBonus: (st) => { st.company.cargo[gid] = Math.max(0,(st.company.cargo[gid]||0)-sellQty); st.company.money += revenue; },
        fullCostLabel: `Sold ${sellQty} units — earned $${(revenue*0.9).toFixed(2)} (10% lost to haggling)`,
        bonusCostLabel: `Correct math! Full deal — earned $${revenue.toFixed(2)}!`
      };
    }
  },
  {
    id:'price_surge', type:'positive', title:'Market Price Surge!',
    icon:'📈', terrain:['river','plains','forest','mountain','winter'],
    prob:{ low:0.07, medium:0.08, high:0.09, very_high:0.06 },
    buildEvent(cargo) {
      const pctIncrease = 35;
      const goodEntries = Object.entries(cargo).filter(([,v])=>v>0);
      if (!goodEntries.length) return null;
      const [gid] = goodEntries[Math.floor(Math.random()*goodEntries.length)];
      const good = GOODS.find(g=>g.id===gid);
      if (!good) return null;
      const newPrice = good.baseSell * (1 + pctIncrease/100);
      return {
        narrative: `Fast-rider Nate gallops up with news: ${good.name} prices at your destination spiked ${pctIncrease}% due to a shortage!`,
        math: {
          question: `${good.name} normally sells for $${good.baseSell.toFixed(2)}. Prices rose ${pctIncrease}%. What is the new sell price per unit?`,
          answer: newPrice, tolerance: 0.05,
          hint: `Multiply $${good.baseSell.toFixed(2)} × ${(1+pctIncrease/100).toFixed(2)}.`
        },
        applyFull:  (st) => { /* price bonus tracked at sell time */ if (!st.sim.priceBonuses) st.sim.priceBonuses = {}; st.sim.priceBonuses[gid] = (newPrice/good.baseSell)*0.85; },
        applyBonus: (st) => { if (!st.sim.priceBonuses) st.sim.priceBonuses = {}; st.sim.priceBonuses[gid] = newPrice/good.baseSell; },
        fullCostLabel: `${good.name} at destination: $${(newPrice*0.85).toFixed(2)}/unit (partial news)`,
        bonusCostLabel: `Correct! Full surge locked in — ${good.name} will sell at $${newPrice.toFixed(2)}/unit!`
      };
    }
  },
  // ── DECISION — no math, strategic choice ──
  {
    id:'shortcut_offer', type:'decision', title:'Scout Offers a Shortcut!',
    icon:'🗺️', terrain:['mountain','forest','plains','winter'],
    prob:{ low:0.05, medium:0.06, high:0.07, very_high:0.08 },
    buildEvent(cargo) {
      return {
        narrative: `Scout Willy Two-Trails says he knows a shortcut that cuts 2 days off your trip. But the path is rough — there's a 40% chance of cargo damage.`,
        isDecision: true,
        choices: [
          {
            label:'Take the Shortcut', risk:'40% cargo damage',
            apply(st) {
              if (Math.random() < 0.40) {
                const keys = Object.keys(st.company.cargo).filter(k=>st.company.cargo[k]>0);
                if (keys.length) {
                  const k = keys[Math.floor(Math.random()*keys.length)];
                  const lose = Math.ceil(st.company.cargo[k]*0.20);
                  const good = GOODS.find(g=>g.id===k);
                  st.company.cargo[k] = Math.max(0, st.company.cargo[k]-lose);
                  st.sim.losses += lose*(good?good.buyPrice:3);
                  return `Damaged! Lost ${lose} units of ${good?good.name:k}.`;
                }
              }
              st.sim.maxDays = Math.max(st.sim.day+1, st.sim.maxDays-2);
              return `Shortcut worked! Saved 2 days!`;
            }
          },
          {
            label:'Stay on the Main Trail', risk:'safe, no change',
            apply(st) { return `You stayed the course. Smart and safe.`; }
          }
        ]
      };
    }
  },
  {
    id:'stray_animal', type:'decision', title:'Lost Pack Animal Found!',
    icon:'🐎', terrain:['plains','forest','mountain'],
    prob:{ low:0.04, medium:0.05, high:0.03, very_high:0.02 },
    buildEvent(cargo) {
      return {
        narrative: `You spotted a stray horse with a saddle branded "R. Cooper & Sons." You could keep it for extra cargo weight, or return it to the nearest town for a reward.`,
        isDecision: true,
        choices: [
          {
            label:'Keep the Horse (+30 lbs capacity)',
            apply(st) {
              if (!st.sim.bonusCapacity) st.sim.bonusCapacity = 0;
              st.sim.bonusCapacity += 30;
              return `+30 lbs extra capacity for the rest of the trip!`;
            }
          },
          {
            label:'Return It — Collect $18 Reward',
            apply(st) { st.company.money += 18; return `Honest decision! Earned $18.00 reward.`; }
          }
        ]
      };
    }
  },
  // ── HUMOROUS NEW EVENTS ──
  {
    id:'raccoon_raid', type:'negative', title:'Raccoon Raid!',
    icon:'🦝', terrain:['forest','plains','river'],
    prob:{ low:0.04, medium:0.07, high:0.05, very_high:0.03 },
    buildEvent(cargo) {
      const packs = 3, priceEach = 1.50;
      const answer = packs * priceEach;
      return {
        narrative: `A bold raccoon crept into camp and ate your trail rations — while making eye contact the entire time. You had to buy replacement supplies from a nearby farm.`,
        math: {
          question: `Replacement rations cost $${priceEach.toFixed(2)} per pack. You need ${packs} packs. What is the total cost?`,
          answer, tolerance: 0.01,
          hint: `Multiply ${packs} × $${priceEach.toFixed(2)}`
        },
        applyFull:  (st) => { st.company.money -= answer; st.sim.losses += answer; },
        applyBonus: (st) => { const paid = answer - priceEach; st.company.money -= paid; st.sim.losses += paid; },
        fullCostLabel:  `Lost $${answer.toFixed(2)} to the world's boldest raccoon`,
        bonusCostLabel: `Correct! One pack was still sealed — only paid $${(answer-priceEach).toFixed(2)}.`
      };
    }
  },
  {
    id:'fog_lost', type:'negative', title:'Lost in the Fog!',
    icon:'🌫️', terrain:['mountain','forest','winter'],
    prob:{ low:0.04, medium:0.08, high:0.12, very_high:0.15 },
    buildEvent(cargo) {
      const extraDays = 1, dailyCost = 1.50;
      const answer = extraDays * dailyCost;
      return {
        narrative: `A thick fog rolled in overnight. Scout Wren doubled back at dawn but it cost a full day. Tracker Pete said "I told you so" the entire time.`,
        math: {
          question: `Each extra day costs $${dailyCost.toFixed(2)} in supplies. You lost ${extraDays} day. How much extra did you spend?`,
          answer, tolerance: 0.01,
          hint: `Multiply ${extraDays} × $${dailyCost.toFixed(2)}`
        },
        applyFull:  (st) => { st.company.money -= answer; st.sim.losses += answer; st.sim.maxDays += extraDays; },
        applyBonus: (st) => { st.company.money -= answer; st.sim.losses += answer; st.sim.maxDays += extraDays; },
        fullCostLabel:  `Lost 1 day and $${answer.toFixed(2)} to the fog`,
        bonusCostLabel: `Right! The fog costs what it costs — $${answer.toFixed(2)} and one wasted day.`
      };
    }
  },
  {
    id:'treasure_map', type:'decision', title:'You Found a Treasure Map!',
    icon:'🗺️', terrain:['forest','mountain','plains'],
    prob:{ low:0.03, medium:0.04, high:0.03, very_high:0.02 },
    buildEvent(cargo) {
      return {
        narrative: `Tucked under a mossy rock: a faded map marked with an X. The detour adds half a day but local legend says a trader buried $35 in coin there last winter.`,
        isDecision: true,
        choices: [
          {
            label: '🔍 Dig for Treasure! (50/50 chance)',
            risk: '50% chance: +$35 · 50% chance: −$6 & +1 day',
            apply(st) {
              if (Math.random() < 0.5) {
                st.company.money += 35;
                return `You found it! A tin of old coins — $35.00 added to your purse!`;
              } else {
                st.company.money -= 6;
                st.sim.losses += 6;
                st.sim.maxDays += 1;
                return `Empty hole. Lost $6.00 in wasted time and supplies.`;
              }
            }
          },
          {
            label: '🚶 Keep Moving — Stay on Schedule',
            risk: 'safe, no change',
            apply(st) { return `You pocketed the map as a souvenir. Smart business decision.`; }
          }
        ]
      };
    }
  },
  {
    id:'bee_swarm', type:'negative', title:'Bee Swarm!',
    icon:'🐝', terrain:['forest','plains','mountain'],
    prob:{ low:0.03, medium:0.06, high:0.04, very_high:0.02 },
    buildEvent(cargo) {
      const dropGid = Object.keys(cargo).find(k => (cargo[k] || 0) >= 2);
      if (!dropGid) return null;
      const good = GOODS.find(g => g.id === dropGid);
      if (!good) return null;
      const lost = 2;
      const answer = lost * good.buyPrice;
      return {
        narrative: `A wild bee swarm spooked your animals and everyone scattered! In the chaos, ${lost} units of cargo tumbled off and couldn't be recovered. Nobody was stung — but your dignity took a hit.`,
        math: {
          question: `You lost ${lost} units of ${good.name} at $${good.buyPrice.toFixed(2)} each. What is the total value lost?`,
          answer, tolerance: 0.01,
          hint: `Multiply ${lost} × $${good.buyPrice.toFixed(2)}`
        },
        applyFull:  (st) => { st.company.cargo[dropGid] = Math.max(0,(st.company.cargo[dropGid]||0)-lost); st.sim.losses += answer; },
        applyBonus: (st) => { st.company.cargo[dropGid] = Math.max(0,(st.company.cargo[dropGid]||0)-1); st.sim.losses += good.buyPrice; },
        fullCostLabel:  `Lost ${lost} units of ${good.name} (worth $${answer.toFixed(2)}) in the Great Bee Incident`,
        bonusCostLabel: `Quick thinking! Chased off fast — only lost 1 unit ($${good.buyPrice.toFixed(2)}).`
      };
    }
  }
];

// ── Active event state ──
let activeEvent = null;
let eventCallback = null;

function rollEvent(routeId) {
  const route = ROUTES[routeId];
  if (!route) return null;
  const riskLevel = route.risk;
  const candidates = EVENT_POOL.filter(e => {
    if (!e.terrain.includes(route.terrain)) return false;
    const prob = (e.prob || {})[riskLevel] || 0;
    return Math.random() < prob;
  });
  if (!candidates.length) return null;
  const template = candidates[Math.floor(Math.random() * candidates.length)];
  const built = template.buildEvent(state.company.cargo);
  if (!built) return null;
  return { ...template, ...built };
}

function showEvent(eventData, onResolved) {
  activeEvent = eventData;
  eventCallback = onResolved;
  renderEventCard(eventData);
  document.getElementById('screen-event').classList.add('active');
}

function resolveEventMath(userAnswer) {
  if (!activeEvent || !activeEvent.math) return;
  const prevCargo = JSON.parse(JSON.stringify(state.company.cargo));
  const correct = Math.abs(userAnswer - activeEvent.math.answer) <= (activeEvent.math.tolerance || 0.05);
  let resultMsg = '';
  if (correct) {
    activeEvent.applyBonus(state);
    resultMsg = `Correct! ${activeEvent.bonusCostLabel}`;
  } else {
    activeEvent.applyFull(state);
    resultMsg = `The answer was $${activeEvent.math.answer.toFixed(2)}. ${activeEvent.fullCostLabel}`;
  }
  logEvent(activeEvent.title, resultMsg, correct ? 'positive' : 'negative');
  closeEvent(resultMsg, correct, prevCargo);
}

function resolveEventDecision(choiceIndex) {
  if (!activeEvent || !activeEvent.choices) return;
  const prevCargo = JSON.parse(JSON.stringify(state.company.cargo));
  const choice = activeEvent.choices[choiceIndex];
  const resultMsg = choice.apply(state);
  logEvent(activeEvent.title, resultMsg, 'neutral');
  closeEvent(resultMsg, true, prevCargo);
}

function closeEvent(msg, good, prevCargo) {
  const screen = document.getElementById('screen-event');
  screen.classList.remove('active');
  updateHUD();
  if (typeof renderCargoManifest === 'function') renderCargoManifest(prevCargo);
  if (eventCallback) eventCallback(msg, good);
  activeEvent = null;
  eventCallback = null;
}

function logEvent(title, msg, tone) {
  state.sim.eventLog.unshift({ title, msg, tone, day: state.sim.day });
  if (state.sim.eventLog.length > 12) state.sim.eventLog.pop();
  renderEventLog();
}

function renderEventCard(ev) {
  const el = document.getElementById('event-card');
  if (!el) return;
  const isDecision = ev.isDecision;
  el.innerHTML = `
    <div class="ev-header ev-${ev.type}">
      <span class="ev-icon">${ev.icon}</span>
      <div>
        <div class="ev-type-badge">${ev.type === 'positive' ? 'Opportunity' : ev.type === 'negative' ? 'Danger!' : 'Decision'}</div>
        <div class="ev-title">${ev.title}</div>
      </div>
    </div>
    <p class="ev-narrative">${ev.narrative}</p>
    ${isDecision ? renderDecisionChoices(ev) : renderMathChallenge(ev)}
  `;
}

function renderDecisionChoices(ev) {
  return `
    <div class="ev-choices">
      ${ev.choices.map((c,i) => `
        <button class="ev-choice-btn" onclick="resolveEventDecision(${i})">
          <strong>${c.label}</strong>
          <span class="ev-risk">${c.risk || ''}</span>
        </button>
      `).join('')}
    </div>
  `;
}

function renderMathChallenge(ev) {
  const m = ev.math;
  return `
    <div class="ev-math-box">
      <div class="ev-math-label">Math Challenge — Answer correctly for a bonus!</div>
      <div class="ev-math-q">${m.question}</div>
      <div class="ev-hint">Hint: ${m.hint}</div>
      <div class="ev-answer-row">
        <span class="ev-dollar">$</span>
        <input id="ev-answer" type="number" step="0.01" placeholder="0.00" class="ev-input" />
        <button class="ev-submit-btn" onclick="submitEventMath()">Submit Answer</button>
      </div>
    </div>
  `;
}

function submitEventMath() {
  const input = document.getElementById('ev-answer');
  if (!input) return;
  const val = parseFloat(input.value);
  if (isNaN(val)) { input.classList.add('shake'); setTimeout(()=>input.classList.remove('shake'),400); return; }
  resolveEventMath(val);
}
