# Building Interactive Rise Walkthroughs in HTML

## Goal

Build one focused interaction inside one large simulation box. Let the learner **see**, **predict**, and **explain** instead of reading a worked solution.

## Common patterns in the current walkthroughs

The most effective pages share these ideas:

- One physical situation, one question, and one main visual.
- The simulation occupies most of the block; controls and text sit inside or directly below it.
- Motion pauses at the exact moment a learner should think.
- Two to four large answer buttons replace long instructions.
- The answer stays hidden until the learner commits to a prediction.
- The reveal uses animation, trails, vectors, labels, or equations as evidence.
- Feedback gives the result first and one short reason second.
- Replay or Try Again resets the same interaction without reloading the page.
- A small state machine controls the sequence instead of many unrelated click handlers.

Useful examples:

- `horzontal-table-launch.html`: clearest setup → prediction → reveal loop.
- `elevator-updated.html`: strong full-box simulation with scenario choices.
- `newtons-3rd-law.html`: repeated Predict → Explain scenarios.
- `change-in-mometum.html`: calculations and visual changes unlock together.
- `Atwood-machine-flat.html`: progressive vectors and equations on one canvas.

## Recommended learning structure

```text
ASK → PREDICT → REVEAL → EXPLAIN/REPLAY
```

| Phase | What the learner sees | Text limit | Main action |
|---|---|---:|---|
| Ask | Initial scene or a short setup animation | 1 sentence | Start / Watch |
| Predict | Motion paused at the decision point | 1 question | Choose an answer |
| Reveal | Outcome animation plus visual evidence | Label only | Watch |
| Explain | Result plus the physical reason | 1–2 sentences | Replay / Try Again |

The prediction does not need to block progress for being wrong. Save the choice, reveal the event, and connect the feedback to what the learner just saw.

## Simple Rise block layout

```text
┌────────────────────────────────────────────┐
│ Small title                    Reset       │
│                                            │
│                                            │
│             MAIN SIMULATION                │
│        objects • arrows • labels           │
│                                            │
│                                            │
│  Ask/predict card                          │
│  [Choice A] [Choice B] [Choice C]          │
│                         [Main action]       │
└────────────────────────────────────────────┘
```

Use one responsive wrapper with a stable aspect ratio. Keep the prompt in the simulation box so the learner never has to connect distant text to the event.

## Minimal HTML structure

```html
<section class="walkthrough" data-walkthrough>
  <header>
    <h2>Which object lands first?</h2>
    <button type="button" data-reset>Reset</button>
  </header>

  <div class="simulation" data-simulation aria-label="Projectile simulation">
    <!-- Canvas, SVG, or positioned HTML objects -->

    <div class="prompt" aria-live="polite">
      <h3 data-phase>Ask</h3>
      <p data-prompt>Watch what happens when both objects begin falling.</p>

      <div data-choices hidden>
        <button type="button" data-choice="a">Object A</button>
        <button type="button" data-choice="b">Object B</button>
        <button type="button" data-choice="same">Same time</button>
      </div>

      <p data-feedback></p>
      <button type="button" data-main>Start</button>
    </div>
  </div>
</section>
```

## Minimal state model

```js
let state = "ask";
let prediction = null;

function render() {
  // Update only the phase label, prompt, choices, feedback, and main button.
  // Draw the simulation from the current state.
}

function start() {
  playSetup(() => {
    state = "predict";
    render();
  });
}

function choose(value) {
  prediction = value;
  state = "reveal";
  render();
  playOutcome(() => {
    state = "explain";
    render();
  });
}

function reset() {
  state = "ask";
  prediction = null;
  cancelAnimation();
  render();
}
```

Keep animation functions separate from learning-state functions. This makes timing, replay, and later scenario changes much easier to manage.

## Visual and writing rules

- Make the simulation at least 60–70% of the block height.
- Use a single accent color for actions and consistent colors for physical quantities.
- Show only labels that help answer the current question.
- Reveal vectors, trails, values, and equations when they become evidence—not before.
- Keep directions under 15 words when possible.
- Ask one conceptual question at a time.
- Put units beside numeric inputs and accept a reasonable tolerance.
- Use visible focus states, real `<button>` elements, and `aria-live="polite"` for feedback.
- Support mouse, keyboard, and touch; do not make hover the only way to learn something.
- Avoid external libraries and remote assets when a self-contained Rise embed is required.
- Prefix classes or scope all CSS beneath `.walkthrough` to prevent Rise style collisions.

## Feedback formula

Use the same short pattern for correct and incorrect predictions:

```text
[Result]. [One-sentence reason tied to visible evidence].
```

Example:

> They land together. Both begin with the same vertical velocity and acceleration.

Avoid praise-only feedback, long derivations, or revealing the answer before the animation proves it.

## Build checklist

- [ ] One phenomenon and one learning objective
- [ ] One dominant simulation box
- [ ] Ask → Predict → Reveal → Explain flow
- [ ] Prediction required before reveal
- [ ] Visual evidence synchronized with feedback
- [ ] Short prompts and no duplicate instructions
- [ ] Replay/reset returns every object and label to its initial state
- [ ] Responsive at narrow Rise widths
- [ ] Keyboard and touch tested
- [ ] No page scrolling inside the interaction at its target embed size

