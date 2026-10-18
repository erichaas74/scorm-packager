# Problem walkthrough preferences

Read `RISE-INTERACTIVE-WALKTHROUGH-GUIDE.md` before creating or rebuilding a walkthrough. These preferences and the user's latest instructions govern the examples in that guide.

## Preserve the visual and the requested scope

- The visual is the main product; a little explanation supports it. Build recognizable, carefully drawn objects, clear motion, and physically meaningful visual evidence.
- Interface clutter and visual quality are separate concerns. Remove unwanted panels, text, settings, and scores without degrading or replacing the artwork. Minimal interface does not mean minimal-quality graphics.
- Inspect the existing activity and design notes before editing. Preserve established artwork, scene composition, object identity, and interactions unless the request requires changing them. A small correction is not permission to rebuild the activity.
- Do not introduce waveform graphs, charts, dashboards, or another teaching format as a substitute for the requested scene. Add a comparison visual when it serves the user's request; keep it subordinate to the main scene.
- Match source/listener colors and labels, use a common comparison scale, and position evidence on the side of the object or listener it explains. Check each scenario separately; do not assume one placement works for all cases.
- Complete authorized work autonomously. Do not transfer design checking to the user through repeated approval questions or a demand to supervise each edit.

## Three activity groups

Choose one primary group for every new learner-facing walkthrough. These replace the previous eight-type classification.

1. **Animated demos:** show a phenomenon through a few animated examples. Start and advance automatically, highlight the evidence, and loop automatically without Play/Pause buttons, retain Replay, and respect reduced-motion preferences. No mandatory questions or answer gates.
2. **Misconception questions:** show a setup, obtain a student choice, then reveal the physical evidence with explicit answer feedback. Example misconception: doubling horizontal-launch height doubles horizontal range; at fixed horizontal speed without air resistance, the actual factor is sqrt(2). Hold obvious feedback long enough to read, then advance automatically. Do not require Next for answer-based activities.
3. **Guided simulations:** let students control a few values (typically 1-3) and follow a few steps (typically 3-4) to see their effects. Start with a baseline, change one value, observe, and compare. Run and Reset are appropriate. Move guidance forward automatically after a meaningful action; never require a Next button or reset values while the student is exploring. Questions are optional.

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

- Build the diagram first. Automatically show the reference, reveal the comparison, and wait for an answer. Show the result and visual evidence, hold briefly, then advance automatically. Keep Replay; do not add Start, Add B, or Next controls by default.
- Omit visible question text when the answer buttons make the task clear. No redundant instructions such as "Choose by loudness" or "Watch the evidence."
- Ask about one property at a time. Answer labels identify both object and property: "Wave A is louder," "Wave B is louder," "Same loudness."
- Keep object choices in stable A/B/Same order. Vary which answer is correct; include A, B, and equal outcomes where meaningful. Shuffle numeric distractors where appropriate.
- Show the evidence needed to make the comparison before the answer. Hide the conclusion and answer-revealing guides until the answer.
- Answer feedback must be unmistakable: a prominent checkmark and CORRECT, or a cross and NOT QUITE, together with the correct outcome. Use color plus text/icon; do not rely on a subtle button border, small status line, or screen-reader-only message. A short explanation is appropriate; avoid a paragraph-heavy feedback panel.
- Keep physical evidence visible alongside feedback. Highlight the relevant measurement, with values and units on its guide; highlight both when equal. Preserve the main scene instead of replacing it with feedback.
- Stop ongoing motion and sound when the learner answers. Hold the result for a readable interval, then automatically advance. If an outcome needs animation, use a brief finite reveal and then hold. Replaying comparison audio must not erase feedback, restart unrelated motion, or cause premature advancement; allow the sound to finish before advancing.
- Use shared axes for comparable curves, with fixed scales. Measure amplitude from equilibrium to a crest; cycle guides span matching phase points, and frequency values agree with cycle duration.
- Apply these answer-gated comparison rules to Group 2. Demos show evidence without requiring an answer; guided simulations retain student control over values and step advancement.

## Build and verification

- Before implementation, specify the group, what changes, what stays constant, the examples/questions/controls and steps, and the visual evidence that establishes the relationship.
- Update starter code and shared playback behavior together with guide changes; do not copy obsolete question cards or feedback paragraphs from older examples.
- Cancel pending timers and animations on Replay or scenario changes. Respect reduced motion, provide accessible status, and send completion only once per completed activity.
- Check the actual shipped activity and extracted ZIP, not only a legacy renderer. Cover each group's behavior: demo examples; misconception cases including equal outcomes and incorrect selections; simulation controls, bounds, and steps; replay/reset and completion.
- Inspect setup, animation or control states, and results (plus question states where applicable) in screenshots at desktop and narrow widths. Check label overlap, values, units, button-to-object identity, and the actual visible gap above buttons.
- Distinguish logic checks from browser visual verification; never claim visual verification when the browser check was unavailable.
