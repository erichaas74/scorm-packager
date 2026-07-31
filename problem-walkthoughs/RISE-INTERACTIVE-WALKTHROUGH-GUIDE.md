# Building Interactive Rise Walkthroughs

## The one rule

**Show, ask, then tell — never in another order.**

A walkthrough is not a worked solution with pictures. It is a physical situation the learner
watches, a decision they commit to, and evidence that settles it. Everything in the file exists
to serve that loop. If a paragraph, label, hint, or equation is on screen before the learner has
chosen, it is either setup or it is a spoiler — and it is usually a spoiler.

Two hard constraints govern every type below:

1. **No answer before the choice.** No numeric result, no final vector, no equation with values
   substituted, no color-coded "correct" styling, no trail showing where the ball lands. Draw
   placeholders (`?`, dashed ghost, greyed row) until a selection is registered.
2. **No extra information.** One phenomenon, one question at a time. Directions under 15 words.
   Feedback is two sentences maximum. Delete any sentence that restates what the animation
   already showed.

---

## The eight types in this folder

| # | Type | What it does | Files |
|---|---|---|---|
| 1 | **Predict → Reveal** | One event, one prediction, one animated payoff | `horzontal-table-launch`, `cup-launch`, `airplane-drop`, `horizontal-double-height`, `ship-double-launch-time`, `angled-launch-samefinalspeed`, `galileo-interial-ramp-demo`, `force-box-drop` |
| 2 | **Scenario Series** | The same predict loop repeated over a scenario array | `newtons-3rd-law`, `elastic-collisions`, `inelastic-collisions`, `perfectly-elastic-collision`, `force-box-prediction`, `newtons-3rd-astronaut`, `work-sign-challenge`, `lost-energy-work`, `same-work-different-power` |
| 3 | **Stepped Numeric Solver** | Randomized problem, multiple choice at every algebra step | `Atwood-pulley`, `Atwood-machine-flat`, `Atwood-machine-ramp`, `change-in-mometum`, `u1-l5`, `gravity-relationship-lab` |
| 4 | **Guided Equation Walkthrough** | Back/Next narration of a solution, no question | `work-equation`, `work-equartion-angled` |
| 5 | **Goal Challenge** | Set parameters to hit a target, across rounds/levels | `spring-launcher-challenge`, `insulated-cup-challenge`, `circus-launch`, `thermal-equilibrium-mixer` |
| 6 | **Lab / Data Collection** | Run trials, fill a table, analysis unlocks after | `crosswind-Ariplane`, `collisiion-1d`, `Static-Forces` |
| 7 | **Free Explorer** | Sliders and live readouts, nothing gated | `KE-simulation-basic`, `newton-spacewalk`, `newtons-cannon`, `friction-tests`, `simple-machines`, `galileo-boat-relative-motion`, `elevator-updated`, `elevator-weight` |
| 8 | **Diagram Generator** | Authoring tool, not a learner activity | `1d-problem-4types`, `2d-problem-4types` |

Types 1–3 are the workhorses. Reach for those first. Types 4 and 7 have no prediction gate and
should only be chosen deliberately (see their sections).

---

## Type 1 — Predict → Reveal

**Use when** a single moment decides a single misconception. One scene, one question, done in
under 60 seconds.

**State machine** (`horzontal-table-launch.html:572` is the reference implementation):

```js
let state = 'setup';   // setup → predict → reveal → explain
let prediction = null;
```

| State | Screen | Text budget |
|---|---|---|
| `setup` | Static scene, one Start button | 1 sentence |
| `predict` | Motion frozen at the decision point, 2–4 large buttons | 1 question, no hint |
| `reveal` | Outcome animates; trails/vectors/timers appear as it happens | labels only |
| `explain` | Result + one reason, Replay button | 2 sentences |

**Do:** freeze motion exactly at the moment of doubt; add evidence (trail, ghost, ring, timer)
only during `reveal`; let a wrong prediction proceed to the same reveal — the animation is the
correction, not a red X.

**Don't:** show the landing point, flight path, or any comparison marker during `predict`. Don't
pre-render both outcomes and hide one with CSS the learner can inspect mid-question.

**Skeleton:**

```html
<section class="wt" data-wt>
  <div class="stage" data-stage aria-label="Simulation"><!-- SVG or canvas --></div>
  <div class="card" aria-live="polite">
    <p data-prompt>Both balls leave the table at the same instant.</p>
    <div data-choices hidden>
      <button data-choice="a">Dropped ball</button>
      <button data-choice="b">Launched ball</button>
      <button data-choice="same">Same time</button>
    </div>
    <p data-feedback></p>
    <button data-main>Start</button>
  </div>
</section>
```

```js
function choose(v) {
  if (state !== 'predict') return;
  prediction = v;
  state = 'reveal';
  render();                       // hides choices, clears prompt
  playOutcome(() => {             // evidence draws DURING this
    state = 'explain';
    render();                     // feedback text appears only now
  });
}
```

---

## Type 2 — Scenario Series

**Use when** one principle needs several cases before it generalizes (equal masses, head-on,
heavy-into-light…).

Identical to Type 1, plus a scenario array and a "Next scenario" button. Everything that varies
lives in data, so the flow code is written once. See `elastic-collisions.html:530`:

```js
const scenarios = [
  { title: 'Equal Mass Transfer',
    description: 'Cart A moves right into identical Cart B at rest.',
    m1: 1, u1: 3, m2: 1, u2: 0,
    askFor: 'B',
    colors: { /* per-scenario so cases stay visually distinct */ },
    explanation: 'Cart A stops after impact, so momentum predicts B.' }
];
```

**Rules specific to this type:**

- `description` is one sentence. `explanation` is one sentence. These are the whole text budget.
- Distractor options are generated from the physics (`buildOptions`), not hand-written, and
  shuffled. Never leave the correct answer in a fixed slot.
- Reset every panel between scenarios — `resetCards()` must clear equations, momentum rows, and
  result styling, or scenario 2 opens with scenario 1's answer visible.
- 4–6 scenarios. Past that, learners stop predicting and start clicking.
- Longer chains (`momentumChoice → choose → result`, as in `elastic-collisions`) are fine: each
  sub-step is its own gate, and each reveals only its own line of the equation.

---

## Type 3 — Stepped Numeric Solver

**Use when** the skill is executing a multi-step calculation, not predicting an outcome.

The problem is randomized per session and each algebra step is a 4-option multiple choice. The
critical pattern (`Atwood-pulley.html`) is the placeholder equation:

```js
equations: [
  `a = Fnet / mtotal`,                                   // the form — always shown
  `a = ${format1(p.fnet)} / ${format1(p.mtotal)}`,       // the substitution — always shown
  completed[i] ? `a = ${format1(p.a)} m/s²` : `a = ?`    // the result — gated
]
```

The learner always sees the equation and the numbers going in. They never see the number coming
out until they have picked it. Carry that `completed[i] ? value : '?'` idiom into every new
solver.

Distractors come from plausible errors, not noise:

```js
distractors: [p.fnet / p.m1, p.fnet / p.m2, p.a * 1.25, p.a * 0.75]
//            forgot to combine masses      arithmetic slips
```

Cache the shuffled choices per step (`choiceCache[step]`) so going Back doesn't reorder them, and
gate Next on `completed[step]`.

**Text budget:** a step is a `title` (3–5 words), a `question` (one line), and the equation stack.
No commentary paragraph. If a step needs prose to make sense, it's two steps.

---

## Type 4 — Guided Equation Walkthrough

**Use when** — rarely. This is Back/Next narration with no prediction, so it violates the one
rule by design: `work-equation.html` displays `W = 500 J` to a learner who was never asked.

Keep it only for a first exposure to a brand-new equation, where there is nothing yet to predict.
The moment the learner could plausibly attempt the step, convert it to Type 3 — the visual scene
and step array carry over almost unchanged; you add `choices`, `correctIndex`, and the
`completed[i] ? … : '?'` gate.

If you keep it as narration: three steps (Define → Substitute → Solve), one sentence each, and
reveal scene parts progressively via `parts: ['force', 'distance']` so the diagram builds with
the algebra rather than sitting complete from the start.

---

## Type 5 — Goal Challenge

**Use when** the learner should manipulate variables to *achieve* something — the prediction is
implicit in the setting they choose.

```js
const rounds = [
  { level: 1, mass: 2.0, k: 200, x: 0.30, targetSpeed: 3.0 },
  { level: 2, mass: 2.0, k: 250, targetHeight: 1.0, adjustable: 'k' }
];
let gameState = 'setup'; // setup → predict → launched → result → gameover
```

- Each round exposes exactly one adjustable variable (`adjustable: 'k'`). Two knobs turns physics
  into guess-and-check.
- Lock the target readout to the goal, and show the *achieved* value only after the run.
- Hints live behind a button (`hint-panel hidden`), never on screen by default.
- Ramp difficulty across rounds; end with a round where the learner picks the value from scratch.

---

## Type 6 — Lab / Data Collection

**Use when** the point is a relationship across trials, not a single event.

Structure: controls card → run trial → row appends to a data table → after N valid trials, the
analysis card unlocks and asks the conceptual question.

- Gate the analysis section (`analysis-fields hidden`, `locked-card`) with a completion checklist.
  The unlock *is* the pacing; without it learners answer from the prompt instead of the data.
- The table shows measurements only — no derived/expected column, no residuals, nothing that
  hands over the pattern.
- Accept numeric answers with a stated tolerance and units beside the input.
- These are the only walkthroughs that may exceed one screen, and only because the table grows.

---

## Type 7 — Free Explorer

**Use when** the goal is developing intuition before any question exists — introducing a new
quantity, or a demo you narrate live in class.

No gating, live readouts, sliders. Because nothing is hidden, an explorer must be paired with a
Type 1/2 activity that asks something, or the learner leaves having watched rather than thought.
Do not use an explorer where a prediction is possible.

---

## Type 8 — Diagram Generator

`1d-problem-4types` and `2d-problem-4types` are authoring tools for producing problem figures —
sidebar of parameters, rendered SVG, export. Not learner-facing. Don't model new walkthroughs on
their two-pane layout.

---

## Choosing a type

```text
Is there a single moment a learner will get wrong?      → Type 1
  …and does it take several cases to generalize?        → Type 2
Is the skill executing a calculation?                   → Type 3
Should they hit a target by changing one variable?      → Type 5
Is the point a relationship across many trials?         → Type 6
Is the equation brand new with nothing to predict yet?  → Type 4
None of the above (pure intuition-building)             → Type 7, paired with 1 or 2
```

---

## Text budget (applies to every type)

| Element | Limit |
|---|---|
| Setup / situation | 1 sentence |
| Question | 1 line, no restatement of the setup |
| Choice label | 2–5 words |
| Feedback | Result sentence + one reason sentence |
| Step title | 3–5 words |
| Hints | Behind a button, one sentence, never default-visible |

Feedback formula, correct and incorrect alike:

```text
[Result]. [One reason tied to what was just visible].
```

> They land together. Both started with zero vertical velocity and the same acceleration.

No praise-only feedback. No derivations. No "Great job!" No restating the question. No paragraph
of theory after the reveal — if the concept needs a paragraph, it belongs in the Rise text block
above the embed, not inside the interaction.

---

## Layout and build conventions

Every learner-facing walkthrough with a fixed-width, rounded inner card must use **Standard Hex: `#285f9f`** as a visible 5px solid border on that card. Never place this border on `html`, `body`, or the outer viewport. If the inner card already defines a border, update that border instead of creating a second border; internal scene and panel borders may still use supporting colors.

For Articulate Rise compatibility, keep each walkthrough self-contained inside one main wrapper, such as `<main class="app">` or `<main class="walkthrough">`. The `<body>` must contain only that main wrapper: do not place controls, notes, status elements, or other sibling content outside it. Keep the walkthrough script inside the main wrapper as well.

### Preparing a code block ZIP

Prepare every walkthrough ZIP for use as an embedded code block with these requirements:

- Place an `index.html` file at the root of the ZIP.
- Keep the HTML, CSS, and JavaScript self-contained in `index.html`, or include required local files in the ZIP. Do not make external web requests for scripts, styles, fonts, images, APIs, or other assets.
- Assume `index.html` will run inside an `<iframe>`. Do not depend on controlling the parent page or accessing parent-page DOM content.
- Give the project a transparent page background so it blends into its iframe container:

  ```css
  html,
  body {
    background: transparent;
  }
  ```

- Use this reusable build instruction when defining a walkthrough: "In the `index.html` file, create [describe your project], and give it a transparent background."
- Define a clear completion condition for every walkthrough. Once [describe completion parameters], call the parent completion message exactly once:

  ```js
  window.parent.postMessage({ type: 'complete' }, '*');
  ```

- Guard the completion message so replaying animation frames, revisiting a completed step, or repeated clicks do not send duplicate completion events.

### Accessibility: WCAG 2.2

Write and test every walkthrough to align with [WCAG 2.2](https://www.w3.org/TR/WCAG22/) Level AA. At minimum:

- Use semantic HTML, a descriptive `<title>`, logical heading order, and real `<button>`, `<label>`, `<input>`, and `<output>` elements where applicable. Do not use a clickable `div` or canvas-only hit region when an HTML control can provide the interaction.
- Make every action operable with keyboard, mouse, and touch. Preserve a logical focus order, prevent keyboard traps, and provide a clearly visible focus indicator.
- Give controls accessible names and expose their current state with native attributes or appropriate ARIA. Use `aria-live="polite"` or `role="status"` for feedback and state changes that occur without moving focus.
- Provide text alternatives for meaningful images, diagrams, SVG, and canvas content. A canvas simulation must have an accessible name plus keyboard-operable HTML controls and equivalent instructions or status text.
- Meet color contrast requirements: at least 4.5:1 for normal text, 3:1 for large text, and 3:1 for meaningful user-interface components and graphical objects. Never use color alone to communicate an answer, state, or required action.
- Keep pointer targets at least 24 by 24 CSS pixels and provide a non-dragging alternative for any drag interaction.
- Respect `prefers-reduced-motion`. Provide pause, stop, replay, or reduced-motion behavior for nonessential movement, and do not create content that flashes more than three times per second.
- Label inputs visibly, identify errors in text, and provide clear correction guidance. Do not clear a learner's valid work when reporting an error.
- Support browser zoom to 200% and reflow at a 320 CSS-pixel viewport without losing content or functionality or requiring two-dimensional scrolling, except where the content itself genuinely requires it.
- Do not place essential instructions only in hover states. Ensure instructions and feedback remain available to touch, keyboard, and assistive-technology users.

```text
┌────────────────────────────────────────────┐
│ Small title                        Reset   │
│                                            │
│            MAIN SIMULATION                 │  ≥ 60% of block height
│        objects • arrows • labels           │
│                                            │
│  Question card                             │
│  [Choice A] [Choice B] [Choice C]          │
└────────────────────────────────────────────┘
```

- One responsive wrapper, stable aspect ratio, no page scroll at the target embed width.
- Question lives *inside* the simulation box — never make the learner connect distant text to an
  event.
- Rendering: SVG for staged scenes with discrete labeled parts (Type 1, 4); canvas for continuous
  motion, many objects, or per-frame physics (Types 2, 3, 5, 7). Both are in use and both are fine.
- Self-contained: no remote assets or external libraries in files destined for a Rise embed.
- Prefix classes (`rph-*`) or scope all CSS under the root class to avoid Rise collisions.
- Real `<button>` elements, visible focus, `aria-live="polite"` on feedback, mouse + keyboard +
  touch. Never make hover the only path to information.
- Keep animation functions separate from state functions. Replay, scenario switching, and later
  edits all depend on that split.
- Reset must restore *everything*: positions, trails, equation placeholders, result styling,
  unlocked panels.

---

## Build checklist

- [ ] Type chosen deliberately from the table above
- [ ] One phenomenon, one objective
- [ ] Simulation dominates the block
- [ ] **Nothing on screen before the choice hints at the answer** — check placeholders, ghosts, CSS-hidden nodes, and pre-drawn trails
- [ ] Choices shuffled; correct answer not in a fixed position
- [ ] Distractors are plausible errors, not random numbers
- [ ] Evidence appears synchronized with the reveal, not before
- [ ] Every text element inside its budget; no sentence restates the animation
- [ ] Hints behind a button
- [ ] Reset/replay returns every object, label, and panel to initial state
- [ ] Responsive at narrow Rise widths; no internal page scroll
- [ ] Keyboard and touch tested
