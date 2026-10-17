# Building Interactive Rise Walkthroughs

## Three groups

Every learner-facing walkthrough belongs to one of these three groups. Choose the group by what the student does, not by the rendering technology or number of examples. These replace the previous eight-type classification. Follow `AGENTS.md` and the user's latest instructions when an older example differs.

| Group | Purpose | What the student does | Default flow |
|---|---|---|---|
| 1. Animated demos | Show a phenomenon through animated examples | Watches and compares what happens | Setup -> animate -> highlight evidence -> next example |
| 2. Misconception questions | Expose a mistaken expectation through a question and visual evidence | Makes a choice, then sees why the result follows | Setup -> question -> student answer -> animated evidence -> next case |
| 3. Guided simulations | Show what a few student-controlled values do through a short sequence | Changes values, runs or watches the model, and follows a few steps | Baseline -> adjust -> observe -> compare -> next guided step |

Use one primary group per activity. A demo does not need a quiz. A guided simulation does not need an answer gate at every step. A misconception activity must obtain a choice before revealing the conclusion.

## Shared build instruction

Build the diagram first. Use one single-line title and place buttons and compact controls immediately beneath the diagram. Keep object names, colors, and line styles consistent everywhere, including object-specific controls and answer buttons. Put values and units directly on the objects or measurement guides they describe. Avoid explanatory paragraphs, redundant instructions, extra panels, and unused space. Preserve graph scale and layout between states. Provide Replay or Reset as appropriate and respect reduced-motion preferences. Use the playback rules of the selected group rather than forcing every activity into a question-and-answer flow.

## Specify the activity before coding

Record these decisions before drawing the scene:

- Group, phenomenon, and the single relationship students should notice.
- What changes and what stays constant, including scales and physical assumptions.
- The animated examples, misconception choices, or student-controlled values and guided steps.
- The model that computes the outcome and the visual evidence that establishes it.
- What appears at each stage and what, if anything, must stay hidden until an answer.
- Object names, colors, line styles, matching control swatches, and completion condition.

For directly comparable curves, use shared axes and fixed scales across cases. Draw measurements at the correct physical locations: amplitude from equilibrium to crest; one cycle between matching phase points; frequency consistent with cycle duration (`f = 1 / T`, converting milliseconds to seconds). Show only the measurements relevant to the current example, question, or step. Values and units belong on the guides, not in a separate readout.

## Group 1: Animated demos

**Use when:** students should see how a phenomenon works through a few clear animated examples.

**Visual standard:** physics textbook quality. Build a precise scientific figure first: correct geometry and proportions, readable labels, clear directional arrows, restrained colors, and deliberate line weights. Main physical objects should dominate; construction lines, equilibrium positions, and grids should be lighter. Attach labels and values to their objects or measurement guides. Distinguish propagation from material motion, rays from wavefronts, and measurements from motion arrows.

A demo may be a great still image or vector diagram with explanatory arrows when movement adds no useful evidence. Most demos should animate to reveal motion, propagation, interaction, or a changing relationship. Animate the physical model, not decorative objects. Keep reference points and scales fixed so the viewer can see what changes. Freeze representative states for reduced-motion users. Do not force animation onto an inherently static relationship or treat an attractive illustration as evidence of physical accuracy.

Review figures at desktop and mobile sizes: recognizable objects, no competing labels, unclipped arrowheads, legible units, consistent object identity, physically correct directions, and a clear distinction between the phenomenon and schematic aids. A screenshot should work as a textbook figure even without the animation.

- Start automatically with a simple setup, then animate the phenomenon.
- Use a small sequence of examples, changing one meaningful condition at a time so the relationship is visible.
- Show labels, motion, trails, and measurements when they help the student notice the phenomenon. There is no answer gate and no requirement to hide the result.
- Hold the result briefly, highlight the important evidence, and automatically move to the next example. Loop automatically without Play/Pause buttons, retain Replay, and respect reduced-motion preferences.
- Use visual evidence instead of narration paragraphs. Do not add prediction buttons, scores, or a final quiz by default.
- Complete after the required examples have been shown, not after an invented question has been answered.

Example: animate a pulse reflecting from a fixed boundary, then a free boundary. Keep the incoming pulse comparable and show the reflected pulse's orientation directly.

```text
setup -> animate example -> highlight relevant feature -> hold -> next example
```

## Group 2: Misconception questions

**Use when:** students are likely to make a specific mistaken prediction or misread a comparison. The question reveals the misconception; the animation and measurements resolve it.

- Define the misconception explicitly in authoring data, without displaying the explanation before the answer.
- Automatically show the setup. Wait indefinitely for the student's answer; do not time out the choice.
- Show the evidence needed to interpret a comparison before asking. For a prediction, withhold the future outcome. Hide correct-answer styling and explanatory guides until the answer.
- Ask about one property at a time. Omit visible question text if answer labels already communicate the task; include one short question inside the diagram when needed.
- Make answer labels explicit: "Wave A is louder," "Wave B is louder," "Same loudness." Match A's and B's button swatches to their diagram colors and line styles; Same carries both.
- Keep object choices in stable A/B/Same order. Vary the correct object across cases and include equal outcomes where meaningful. Use plausible misconceptions for numeric distractors and shuffle those where appropriate.
- After either a correct or incorrect answer, reveal the same physical evidence. Highlight measurement guides with object, value, and units directly on the lines. Highlight both when equal. No routine feedback paragraph or praise text.
- Automatically advance after enough time to inspect the evidence. Keep Replay; no Start, Add B, or Next buttons by default.
- Complete once the required cases have been answered and their evidence shown.

**Example: "Double the height means double the horizontal range."**

Use horizontal launches with equal horizontal speed, uniform gravity, and negligible air resistance. Show heights `h` and `2h` before the choice, but do not show landing positions or range guides yet. Ask whether doubling the height produces twice the range. After the answer, animate both launches and label the horizontal distances on the ground. Under these assumptions, `t = sqrt(2h/g)` and `R = vx * t`, so doubling height gives `sqrt(2)` times the range (about 1.41 times), not twice. The misconception is the distractor, never the model used to animate the result. Keep any mathematical explanation in authoring notes unless the diagram needs it.

```text
setup -> choice -> answer -> animate outcome -> labeled measurement evidence -> next case
```

For a visible-wave comparison, the two waves appear before the choice; only the explanatory amplitude or frequency guides are withheld.

## Group 3: Guided simulations

**Use when:** students should control a few values, see what those values do, and work through a few purposeful steps.

- Expose only a few relevant controls, typically 1-3 values. Do not build a large dashboard of settings.
- Use a short guided sequence, typically 3-4 steps: inspect a baseline, change one value, compare the effect, then try another value or combination if useful.
- Give each step one short action instruction inside the diagram. Show current values and units beside the corresponding object or measurement; give every slider/input an accessible name.
- Keep other variables fixed while introducing one relationship. Later steps may let students combine the few controls to explore their effects.
- Update the model live when useful; use a Run button when an event such as a launch needs a deliberate start. Preserve a clearly identified baseline or previous trial when it helps comparison.
- Let the student decide when to advance from exploration. A small Next step control is appropriate here; do not auto-advance while the student is adjusting values or examining a result.
- Keep Reset available and define whether it resets the trial, current step, or full activity. Do not silently discard settings between steps.
- Questions may be included when they serve the step, but are not mandatory. Do not turn every control change into a multiple-choice gate.
- Complete after the required guided steps or meaningful runs have been performed, not merely after moving any slider.

Example: start with a reference wave, let the student change amplitude while frequency stays fixed, then change frequency while amplitude stays fixed, then try both. Show the corresponding height and cycle spacing directly on the graph.

```text
baseline -> student adjusts value -> live change or run -> inspect comparison -> next step
```

## Choosing and adapting a group

- Want students to watch a phenomenon unfold through examples? Choose **Animated demo**.
- Want students to commit to an expectation and discover a misconception? Choose **Misconception questions**.
- Want students to change values and learn their effects through a few steps? Choose **Guided simulation**.

Older prediction loops and scenario series generally fit Group 2. Older explorers, challenges, and labs can supply models for Group 3, but must be narrowed to a few controls and guided steps. Equation walkthroughs and numeric solvers are techniques to use inside a suitable group when they support the phenomenon; they are not additional top-level groups. A worksheet-only solver does not automatically qualify as a guided simulation. Diagram generators are authoring tools outside these three learner-facing groups. Existing files remain references, not automatic examples of compliance; this guide reorganization does not reclassify or rebuild them by itself.

---

## Text budget

| Element | Default |
|---|---|
| Main title | One single-line title; no subtitle or kicker |
| Setup / situation | Diagram labels; at most one necessary sentence |
| Question | Group 2, or an optional simulation check: omit when answer labels suffice; otherwise one line inside the diagram |
| Choice label | Explicit object and property, even if longer than five words |
| Feedback | Highlighted measurement guides labeled with object, value, and units |
| Guided step | One short action instruction inside the diagram; no extra introductory heading |
| Hints | Only when needed, behind a button; one sentence |

Examples: "Wave A is louder," "Wave B is louder," "Same loudness"; for pitch, "Wave A has higher pitch," "Wave B has higher pitch," "Same pitch." Each button includes the corresponding line swatch. Do not collapse different properties into vague "A," "B," or "Both" choices.

In Group 2, after answering, highlight the measurement that establishes the result; highlight both when equal. Keep the values attached to the actual guide lines. No routine "Correct!", result paragraph, or explanation panel. Add one short explanation only if the diagram cannot communicate the reasoning. Keep a concise equivalent result available through accessible status text.

---

## Layout and build conventions

Every learner-facing walkthrough with a fixed-width, rounded inner card must use **Standard Hex: `#285f9f`** as a visible 5px solid border on that card. Never place this border on `html`, `body`, or the outer viewport. If the inner card already defines a border, update that border instead of creating a second border; internal scene and panel borders may still use supporting colors.

For Articulate Rise compatibility, keep each walkthrough self-contained inside one main wrapper, such as `<main class="app">` or `<main class="walkthrough">`. The `<body>` must contain only that main wrapper: do not place controls, notes, status elements, or other sibling content outside it. Keep the walkthrough script inside the main wrapper as well.

### Preparing a code block ZIP

Prepare every walkthrough ZIP for use as an embedded code block with these requirements:

- Treat the walkthrough cards linked from `problem-walkthoughs/index.html` as the active packaging list. Files removed from that index are deprecated and must not be included in a batch build unless they are deliberately restored to the index.
- Run `node problem-walkthoughs/build-rise-zips.js` from the repository root to rebuild the active packages. The generated ZIPs are written to `problem-walkthoughs/rise-zips/` with one walkthrough per ZIP.

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

The following layout illustrates Group 2; demos use playback controls, and guided simulations use compact value controls and step navigation in the same location.

```text
+--------------------------------------------+
|              Single-line title             |
|                                            |
|          DIAGRAM / SHARED GRAPH            |
|     objects, labels, measurement guides     |
+--------------------------------------------+
  [A swatch + answer] [B swatch + answer]
  [Both swatches + same property] [Replay]
```

- One responsive wrapper, stable aspect ratio, no page scroll at the target embed width.
- Necessary question text lives inside the diagram. Omit it when answer labels suffice. Keep controls 4-8 px below the diagram container and remove unused space inside the diagram.
- Rendering: use SVG for scenes with discrete labeled parts; use canvas when continuous motion, many objects, or per-frame physics warrant it. Any of the three groups can use either.
- Self-contained: no remote assets or external libraries in files destined for a Rise embed.
- Prefix classes (`rph-*`) or scope all CSS under the root class to avoid Rise collisions.
- Real `<button>` elements, visible focus, `aria-live="polite"` on feedback, mouse + keyboard +
  touch. Never make hover the only path to information.
- Keep animation functions separate from state functions. Replay, scenario switching, and later
  edits all depend on that split.
- Reset must restore *everything*: positions, trails, equation placeholders, result styling,
  unlocked panels.

---

## Playback and starter implementation

Use these requirements in starters for all three groups and when revising shared playback code. Updating prose alone is insufficient if the copied template still generates question cards and explanation paragraphs. Older activities are not automatically compliant references.

- Use the selected group's state sequence. Demos have no answer gate; misconception questions wait indefinitely for an answer; guided simulations wait for student adjustments and step advancement.
- For automatic demos and misconception sequences, initial timing suggestions are reference 2.4 seconds, transition about 1 second, evidence 5-6.5 seconds. Tune to the phenomenon; never apply these as deadlines for student input. Keep Replay available and meet the accessibility requirements above.
- Reduced motion uses static stages or minimal transitions while preserving the phenomenon, required evidence, and any answer or student-control gate.
- Cancel all pending timers and animation callbacks when replaying or changing scenarios; do not let callbacks from the previous case change the new one.
- Use one object identity map for curves, labels, legend, buttons, and feedback. Keep scene geometry and graph scales fixed through the sequence.
- Use one scenario model to derive physical outcomes, rendered values, any correct answers, accessible status, and tests. Do not retain stale legacy configuration that describes a different question.
- Reset all feedback and answer state. Guard completion so a full activity sends one completion message, including when replayed.

## Build checklist

- [ ] One of the three groups selected; phenomenon, controls/examples/questions, model, and completion specified
- [ ] One title, diagram dominates, no redundant instructions or extra question card
- [ ] Group 1: examples animate without quiz gates; relevant evidence appears during or after the phenomenon
- [ ] Group 2: comparison evidence visible before choice; predicted outcome and explanatory guides withheld until answer
- [ ] Group 3: few working controls and a short guided sequence; student controls exploration and step advancement
- [ ] Playback matches the group; no forced question gates in demos or forced timed advancement during student exploration
- [ ] Where questions are used, labels identify object and property; A/B/Same order stable; correct outcome varies
- [ ] Diagram, legend, buttons, and feedback share object names, colors, and line styles
- [ ] Object-specific buttons include matching swatches; Same shows both where used; identity does not rely on color alone
- [ ] Comparable curves share axes and fixed scales; measurement geometry, values, and units correct
- [ ] Feedback highlights only the relevant measurement, both when equal, directly on the guides
- [ ] No unnecessary feedback prose; accessible status communicates the result
- [ ] Buttons sit 4-8 px beneath the diagram; no unused internal space or feedback layout jump
- [ ] Numeric distractors reflect plausible errors and are shuffled where appropriate
- [ ] Replay clears pending timers, animation, labels, and result state
- [ ] Reduced motion, keyboard, and touch behavior checked; completion sent exactly once
- [ ] Actual activity tested, not only an obsolete shared renderer or assumed Pause-button flow
- [ ] All cases and steps exercised: demo sequence, applicable equal/incorrect answers, simulation control bounds and reset, replay during transitions, and repeated completion
- [ ] Setup, active animation/control, and result screenshots (plus choice for Group 2) inspected at desktop and narrow widths (including 320 and 390 px); labels readable, no overlap or clipping
- [ ] Source and extracted ZIP checked; package has current assets and no external dependencies
- [ ] Relevant distributable copies updated; logic checks and visual checks reported separately

If browser verification is unavailable, report that limitation explicitly. Passing syntax or mocked interaction checks does not establish that the diagram, swatches, or spacing look correct.

## Future additions

Add agreed preferences to the relevant sections above and mirror lasting defaults in `AGENTS.md`. Update conflicting examples and checklist items at the same time; do not accumulate contradictory rules in an appendix. Update affected starters and tests when implementing a new behavior.
