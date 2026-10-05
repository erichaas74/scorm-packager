# Unit 6 lab review guide

Prepared September 22, 2026, from the revised Unit 5 Resonance Tube, Thin Lens, and Spectral Shift labs.

This is a guide for a new audit, not a report that Unit 6 has passed. Use the current source, questions, and generated preview as evidence. Earlier audit reports describe earlier versions and do not establish the behavior of the revised files.

## What to carry forward from Unit 5

The student should encounter the apparatus quickly, understand what can be manipulated, collect readable measurements, and complete the assessed calculations in the questions associated with those measurements.

| Reference | What the current implementation demonstrates | Apply to Unit 6 |
| --- | --- | --- |
| Resonance Tube | Compact title and measurement progress; controls on the canvas; gray apparatus with surface graduations; fixed fork slots; selected row highlighting and manual entries; animated fork changes; calculations moved into per-frequency Buzz questions. | Remove redundant interface layers. Make equipment selection, active data, and the observation-to-question connection explicit. |
| Thin Lens | Four independent trial canvases with fixed object conditions, movable screens, and questions grouped with each trial. An impossible screen capture is treated as a valid virtual-image observation. | Keep trial state independent. Put each trial's questions near its evidence. Do not force an impossible physical condition to unlock progress. |
| Spectral Shift | Native reference buttons, pointer and keyboard alignment, feedback for incorrect alignment, controlled case progression, and focus moving to the next useful action. | Every required manipulation needs an accessible equivalent. Check failed attempts, successful progression, and the final handoff to questions. |

The detailed visual preferences are directly established by the Resonance Tube revision. The Thin Lens and Spectral Shift principles are also supported by their current source and workflow checks. Do not assume every feature present in these references is a requirement for every Unit 6 lab.

## 1. Audit the first screen

- [ ] Keep the lab title and a simple, accurately labeled progress indicator above the working area.
- [ ] Remove repeated introductions, mission cards, instruction grids, score badges, decorative bands, and duplicate apparatus headings that push the experiment down the page.
- [ ] Keep only instructions needed to begin or avoid a specific misunderstanding. Put detailed explanation beside the relevant question or in the setup directions.
- [ ] Remove tab navigation when it only separates experiment, calculations, and results that can form one readable page.
- [ ] Keep necessary case or challenge navigation when it controls a real sequence. Do not remove Spectral Shift-style Next Case behavior merely because Resonance Tube no longer has tabs.
- [ ] Check the actual embedded preview at desktop and narrow widths. The apparatus should not be buried below a control card on small screens.

Ask: Can a student identify the equipment, the first action, and where measurements belong without reading several panels?

## 2. Review apparatus and measurement readability

- [ ] Use a light, uncluttered working background by default. A dark instrument display may remain when it helps interpret the measurement, such as a spectrum.
- [ ] Review every label after changing a background. A lighter canvas alone does not fix pale text, yellow arrows, or faint outlines.
- [ ] Make current values, units, scale numbers, and object boundaries readable at the displayed size, not just at the canvas's intrinsic resolution.
- [ ] Draw graduations and numerals as markings on the instrument. Improve their strokes, size, placement, or material contrast; do not turn them into floating white label boxes.
- [ ] Distinguish material from contents: gray equipment can contain blue water; wire, magnets, glass, and metal should be visually distinguishable.
- [ ] Add useful physical detail: openings, rims, terminals, winding direction, meter connections, and clear moving parts. Remove decoration that obscures the experiment.
- [ ] Keep arrows, labels, selectors, and moving equipment from overlapping throughout the full adjustment range.
- [ ] Give meters an interpretable scale and units. A minimum reading must not look like a broken or missing display.
- [ ] Where the learner searches for a maximum, consider a peak marker and an explicit reset. Preserve the distinction between current and highest readings.

Do not impose a vertical peak-hold meter on every lab. Use it only when it helps the actual measurement task.

## 3. Review controls and equipment selection

- [ ] Put essential controls on or immediately beside the apparatus they affect.
- [ ] Replace a dropdown with visible equipment buttons when the learner chooses among a small, fixed set of physical items.
- [ ] Give each removable item a stable slot. Selecting it should leave an empty place, not shift the remaining items.
- [ ] Identify equipment with the meaningful property and unit, such as 256 Hz or 10 ohms. Avoid arbitrary A/B/C names when they add no meaning.
- [ ] Show the selected item in use and highlight its matching evidence row. Keep an accessible selected-state cue as well as color.
- [ ] Animate equipment changes when motion helps explain the transition. Respect reduced-motion preferences and rapid repeated selections.
- [ ] Keep hit areas synchronized with moved or resized drawings.
- [ ] Preserve keyboard and touch operation when removing sliders, accordions, or control panels. A cleaner appearance must not eliminate the only accessible way to complete a task.
- [ ] Retain a simple persistent toggle when needed, such as Keep tone sounding, without retaining an entire redundant controls section.

## 4. Review the evidence table

- [ ] Match the table to the actual experiment: one row per frequency, case, drop, configuration, or trial; columns for the required observations and units.
- [ ] Make the active row unmistakable. If manual entry is appropriate, enable its fields and keep other rows protected from accidental edits.
- [ ] Preserve entries when switching equipment or cases. Returning to a trial must restore the correct values and controls.
- [ ] Validate units, sensible bounds, blank entries, and nonnumeric input. Do not silently convert an invalid value into a different valid measurement.
- [ ] Distinguish a value typed by a student from an automatically verified physical condition. Presence of data alone does not prove accuracy.
- [ ] Updating or deleting a measurement must refresh progress and invalidate any dependent checks that still exist.
- [ ] Use read-only automatic measurements when that is the learning design; editable rows are not mandatory for every lab.
- [ ] Keep measurements available while students answer the related questions.

## 5. Move assessed calculations into the questions

- [ ] Remove duplicate in-lab calculation panels, answer checkers, and final-result gates when the same work is assessed in Buzz.
- [ ] Group questions by the frequency or trial that produced the observations. State which recorded values to use.
- [ ] Specify quantities, units, conversions, and the result to enter. Supply formulas when appropriate to the intended learning objective, without supplying the assessed numerical answer.
- [ ] Put cross-trial averages, comparisons, and conclusions after the individual trial work.
- [ ] Verify that a student can answer every question using accessible recorded evidence. No question may depend on a removed panel or export.
- [ ] Ensure the prompt, numeric acceptance range, feedback, and BusyBee rubric agree. Accept valid observations that the prompt permits, including negative results and alternative successful designs.
- [ ] Check acceptable numeric answers against actual model outputs and recording resolution, including tolerance boundaries. Do not rely only on a nominal answer copied into a validator.
- [ ] Preserve each lab's approved scoring unless a change is requested. The existing Unit 6 conversion describes 15 points: 10 automatic and 5 across the two final written responses. Verify the files rather than assuming that total.

Resonance Tube example: record three harmonic lengths per frequency in the apparatus table, calculate that frequency's result in its question, then calculate the overall average and percent difference in subsequent questions.

## 6. Make progress and completion honest

- [ ] Label progress by what it measures: observations, recorded trials, or completed challenges. Do not present it as the Buzz grade.
- [ ] Recalculate the denominator when stages are removed. No invisible calculation or results panel may prevent completion.
- [ ] Test that all required observations reach 100%, deleting evidence decreases progress where appropriate, and reset returns to the initial state.
- [ ] End the experiment with a clear handoff to the questions, not an inaccessible hidden results tab.
- [ ] Remove obsolete listeners, DOM references, completion messages, exports, and instructions together with removed panels.
- [ ] Preserve previously saved observations where practical. Check refresh, return visits, changing trials, and reset explicitly.
- [ ] Do not report the native assessment as submitted or graded merely because measurement progress is complete.

## 7. Unit 6 review targets

These are review questions based on the existing Unit 6 lesson descriptions, not confirmed defects.

| Lab | Focus of the audit |
| --- | --- |
| Millikan Oil Drop | Are plate polarity, drop motion, force balance, and voltage readable? Does each of six drops retain its own evidence? If q/e is assessed as a calculation, does the interface reveal its answer first? Preserve the explanation that this is a scaled charge-pattern model. |
| Dynamic Electric-Field Motion | Can charge sign and position be changed by pointer, touch, and keyboard? Do field, force, acceleration, and velocity remain distinguishable? Are successful arrangements saved per challenge? Put numerical field/force work with its question. |
| Circuit Design | Are terminals, wires, junctions, switches, and meter placement clear? Are current and voltage units readable? Can required series, parallel, failure, and switch cases be completed without a duplicate notebook or unnecessary panels? Retain meaningful short-circuit feedback. |
| Electromagnet Design | Are current, coil turns, core choice, and pickup result clear? Keep controlled trials distinct from optimization. Check that changing one variable does not silently alter another. Move assessed numerical work to the matching questions. |
| Generator Design | Can the student connect motion to the changing output? Are polarity, current reading, and peak reading distinguished? Use peak hold only if needed. Keep speed, field strength, loops, area, and detector trials identifiable and independently recorded. |
| Honors Electric Motor | Are rotor, stator, coil, current direction, and rotation understandable? Can baseline and optimized designs be compared? Retain budget, load, heat, and other constraints needed for the design task while removing duplicate response forms. |

## 8. Verification and audit deliverables

For each lab, complete one normal path, one incorrect attempt, an edit to recorded evidence, a trial change, a refresh, and a reset. Repeat essential interactions using keyboard only and at a narrow viewport. Inspect visual extremes and overlapping equipment; screenshots of only the initial state are insufficient.

After fixes, update the authoritative source and the appropriate builder inputs, then regenerate only the affected artifacts where possible. Verify the source, assessment template, preview, question import, rubric metadata, setup directions, and launcher agree. Builders may intentionally transform source HTML; compare against that transformation rather than assuming byte equality.

Useful repository checks:

```text
node unit-ApplicationFiles/unit-6/validate-unit6-buzz-assessments.js
node unit-buzz-template-conversion-files/build-buzz-template-previews.js unit-ApplicationFiles/unit-6/<lesson-folder>
```

Inspect `build-unit6-buzz-assessments.js` before running it: it writes generated files. A passing validator or DOM substitute test does not prove visual layout, native keyboard behavior, live Buzz import, grading, or LMS persistence. Record each verification separately as passed, failed, or not tested.

Use this finding format:

- **Lab and severity:** P1 blocks required work or causes data loss; P2 creates misleading evidence, grading risk, or substantial usability difficulty; P3 is minor visual cleanup.
- **Observed problem:** What the student sees or cannot do.
- **Reproduction:** Starting state and exact actions.
- **Evidence:** Screenshot and source location, or an executed test result.
- **Proposed change:** A concrete fix tied to the relevant rule above.
- **Acceptance check:** The behavior that must pass after the fix.
- **Status:** Open, fixed and verified, or fixed with verification outstanding.

Do not mark a lab reviewed solely because its interface resembles Unit 5. Require readable measurements, correct physics, usable interactions, accessible controls, consistent questions, and a complete student path.

Reference files:

- [Resonance Tube source](../unit-5/sound-waves-resonance-lab/sound_waves_lab_simulation.html) and [questions](../unit-5/sound-waves-resonance-lab/sound_waves_resonance_buzz_questions.txt)
- [Thin Lens source](../unit-5/thin-lens-refraction-lab/thin_lens_refraction_investigation.html) and [workflow checks](../unit-5/thin-lens-refraction-lab/test-screen-control.js)
- [Spectral Shift source](../unit-5/doppler-spectral-line-shift/index.html) and [workflow checks](../unit-5/doppler-spectral-line-shift/test-workflow.js)
- [Earlier Unit 6 conversion audit](unit-6-buzz-assessment-audit.md), [builder](build-unit6-buzz-assessments.js), and [validator](validate-unit6-buzz-assessments.js)
