# Problem walkthrough preferences

Read `RISE-INTERACTIVE-WALKTHROUGH-GUIDE.md` before creating or rebuilding a walkthrough. These preferences and the user's latest instructions govern the examples in that guide.

## Three activity groups

Choose one primary group for every new learner-facing walkthrough. These replace the previous eight-type classification.

1. **Animated demos:** show a phenomenon through a few animated examples. Start and advance automatically, highlight the evidence, and loop automatically without Play/Pause buttons, retain Replay, and respect reduced-motion preferences. No mandatory questions or answer gates.
2. **Misconception questions:** show a setup, obtain a student choice, then reveal the physical evidence through animation and labeled guides. Example misconception: doubling horizontal-launch height doubles horizontal range; at fixed horizontal speed without air resistance, the actual factor is sqrt(2). Wait for the answer, then automatically advance after the evidence.
3. **Guided simulations:** let students control a few values (typically 1-3) and follow a few steps (typically 3-4) to see their effects. Start with a baseline, change one value, observe, and compare. Run, Reset, and Next step are appropriate. Never auto-advance while the student is exploring; questions are optional.

Use the group's flow, not a universal quiz loop. Authoring tools are outside these groups. Older solvers, labs, and explorers are source material to adapt, not extra categories.

## Layout and identity

- Demos must have physics-textbook-quality graphics. A carefully drawn still diagram with explanatory arrows is valid when it explains the phenomenon fully; most demos should animate because motion, propagation, or change supplies essential evidence.
- Use accurate geometry, consistent scales, restrained line weights, clear arrowheads, and labels attached to the objects or measurements they describe. Distinguish motion arrows, light rays, measurement guides, and reference lines. Avoid decorative motion and generic illustrations that obscure the model.

- Use one single-line title only. No kicker, subtitle, or multiple introductory headings.
- Put values, labels, necessary instructions, and feedback inside the diagram, attached to the relevant object or measurement.
- Place answer buttons 4-8 px below the diagram container. Remove unused space inside the diagram that pushes controls away.
- Keep the diagram scale and footprint stable between setup, choice, and feedback.
- Keep object names, colors, and line styles consistent across scenarios, diagram, legend, buttons, and feedback. Buttons must include matching visual swatches, not just object names or color alone.
- Keep the interface simple. No extra information panels, scores, or quiz-style progress displays unless requested.

## Misconception questions and comparisons (Group 2)

- Build the diagram first. Automatically show the reference, reveal the comparison, and wait for an answer. Show visual evidence, then advance automatically. Keep Replay; do not add Start, Add B, or Next buttons by default.
- Omit visible question text when the answer buttons make the task clear. No redundant instructions such as "Choose by loudness" or "Watch the evidence."
- Ask about one property at a time. Answer labels identify both object and property: "Wave A is louder," "Wave B is louder," "Same loudness."
- Keep object choices in stable A/B/Same order. Vary which answer is correct; include A, B, and equal outcomes where meaningful. Shuffle numeric distractors where appropriate.
- Show the evidence needed to make the comparison before the answer. Hide the conclusion and answer-revealing guides until the answer.
- Default to visual feedback only: highlight the relevant measurement, with value and units directly on its guide. Highlight both when equal. Add prose only when the diagram cannot explain the result.
- Use shared axes for comparable curves, with fixed scales. Measure amplitude from equilibrium to a crest; cycle guides span matching phase points, and frequency values agree with cycle duration.
- Apply these answer-gated comparison rules to Group 2. Demos show evidence without requiring an answer; guided simulations retain student control over values and step advancement.

## Build and verification

- Before implementation, specify the group, what changes, what stays constant, the examples/questions/controls and steps, and the visual evidence that establishes the relationship.
- Update starter code and shared playback behavior together with guide changes; do not copy obsolete question cards or feedback paragraphs from older examples.
- Cancel pending timers and animations on Replay or scenario changes. Respect reduced motion, provide accessible status, and send completion only once per completed activity.
- Check the actual shipped activity and extracted ZIP, not only a legacy renderer. Cover each group's behavior: demo examples; misconception cases including equal outcomes and incorrect selections; simulation controls, bounds, and steps; replay/reset and completion.
- Inspect setup, animation or control states, and results (plus question states where applicable) in screenshots at desktop and narrow widths. Check label overlap, values, units, button-to-object identity, and the actual visible gap above buttons.
- Distinguish logic checks from browser visual verification; never claim visual verification when the browser check was unavailable.
