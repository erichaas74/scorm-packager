# Buzz Conversion Rules and BusyBee Notes

Last researched: 2026-07-12

Purpose: use this as the working playbook when converting unit lesson activities into the current self-contained embedded-template plus Buzz-native assessment format.

## Source Snapshot

- Local syntax source: `unit-ApplicationFiles/Buzz Assesment LLM Reference.txt`.
- Local status source: `buzz-lab-conversion-summary.txt`.
- Research notes used:
  - Physics constructed-response grading works best with clear, skill-based checklist rubrics instead of broad holistic judgments: https://arxiv.org/abs/2604.12227
  - LLM/autorater agreement improves when rubrics include context and representative examples, but can get worse when rubrics become too complex: https://arxiv.org/abs/2605.06283
  - Automated short-answer scoring should send low-confidence or ambiguous cases to a human grader: https://arxiv.org/abs/2206.08288

## Conversion Rule Set

1. Decide the delivery mode before writing questions.
   - Use SCORM when the activity itself owns the score and already reports completion or points.
   - Use Buzz-native assessment when Buzz should own each question score, written response, upload, and feedback.
   - Default to a self-contained Buzz template when the lab can fit inside the template as inline HTML, CSS, and JavaScript.
   - Use hosted support tools only when the activity cannot run inside a Buzz template, such as a third-party tool that cannot be legally or technically embedded.

2. Keep lab files self-contained for the new Buzz format.
   - Put the lab HTML, CSS, JavaScript, chart/evidence UI, and `<a:question></a:question>` slots in `buzz-assessment-template-for-buzz.html`.
   - Do not require iframes, hosted URLs, CDN scripts, external stylesheets, or separate lab files for the Buzz upload when a local embedded version is possible.
   - Local `index.html` or simulator files may stay as references, but they are not part of the Buzz upload path unless the setup file explicitly says so.

3. Every Buzz-native lesson should follow the same file pattern.
   - `buzz-assessment-questions.txt`: import-ready Buzz text only. No teacher notes unless the file is intentionally labeled as a draft.
   - `buzz-assessment-template-for-buzz.html`: the layout uploaded as the Buzz assessment template.
   - `buzz-assessment-template-preview.html`: local visual check with visible placeholder slots.
   - `setup-instructions.html`: teacher setup, question order, answer key, and Buzz settings.
   - `lab-format-suggestions.txt`: remaining conversion work.
   - `busybee-rubric-metadata.json`: optional but recommended for every lesson with written questions.
   - When many folders contain `buzz-assessment-template-for-buzz.html`, also create or use a lesson-specific upload filename such as `u1l3-galileo-buzz-assessment-template.html` and name that file in setup instructions.

4. Use whole-number point values.
   - Every Buzz question `Score:` value must be an integer.
   - Every BusyBee question `points` value should match the Buzz integer score.
   - Keep assessment totals as integers and redistribute weights instead of using half-points such as `1.5`.

5. Choose Buzz questions only when the answer source is fixed.
   - If a chart is small and every student should get the same values, use native Buzz questions for the chart cells or follow-up calculations.
   - If the answer depends on a student's measured run, reaction time, chosen setting, or randomized trial, do not use a plain fixed-answer Buzz numeric question by itself.
   - For student-dependent labs, validate the answer inside the lab before it can be recorded, or require a Lab Evidence upload/copy block that BusyBee can compare against the written response.
   - Reaction Time is the model: the student's measured reaction time creates their expected answer, so the lab must check the calculation against that student's own captured value before accepting the trial.

6. Lock the data source when auto-grading numeric answers.
   - Use fixed simulator presets, fixed PhET settings, or Buzz variables with known formulas.
   - If students can choose different settings, grade with uploads and written explanation instead of strict numeric auto-grading.
   - For numeric fill-in questions, use `Type: F, Number`, `Figures:` when useful, and explicit tolerance ranges such as `a. 24.6..25.0`.

7. Keep the student workflow visible and transferable.
   - Add a Lab Evidence or Lab Report panel in the sim when students must copy data into Buzz.
   - Add a "Copy values for Buzz" control for numeric data.
   - Add a "Download Evidence Image" control when screenshots or graph/table evidence are graded.
   - End embedded labs with a direct instruction to finish the Buzz questions below the lab.

8. Keep template slots and question order locked.
   - If a template uses `<a:question></a:question>` slots, turn off question randomization.
   - Do not use one-question-per-page when multiple Buzz questions must appear in one chart or trial section.
   - The question text file order must match the template slot order exactly.

9. Split learning help from graded answers.
   - Put setup instructions, hints, and formulas in the simulator guide or non-graded directions.
   - Keep the assessment template mostly focused on the task, evidence, chart, and question slots.
   - Do not include answer-reveal tools in student-facing embedded labs unless they are teacher-locked or delayed until after submission.

10. Every written question must have a grading guide.
   - In pure Buzz text, use the Essay `a.` line as the grader model answer or rubric summary.
   - In BusyBee metadata, include full-credit, partial-credit, and no-credit criteria.
   - Include common misconceptions so BusyBee can give better feedback instead of generic comments.
   - Include required evidence, such as "uses Trial 2 data" or "references net force direction."

11. Every auto-graded question should have feedback in the text upload.
   - For MC/MA, add choice-specific feedback with `@` lines under choices when a distractor reveals a useful misconception.
   - For MC/MA/F/MT/O, add conditional feedback blocks when useful:
     - `@[When answer is correct]`
     - `@[When answer is incorrect]`
   - For numeric answers, incorrect feedback should point to the most likely repair step: sign convention, unit, copied trial, tolerance/rounding, or formula.
   - For essays, use `@[Always]` for short student-facing process feedback, not the full answer key, especially if retakes are allowed.

12. Use metadata consistently.
   - Buzz text supports custom `Meta-NAME:` properties. Use these only as simple tags and only after `Type:` and before the prompt.
   - Recommended tags for written questions:
     - `Meta-unit: U3`
     - `Meta-lesson: U3L4`
     - `Meta-skill: momentum_conservation`
     - `Meta-grading: busybee`
     - `Meta-evidence: trial_chart`
   - If Buzz ignores custom metadata in a domain, keep the same fields in `busybee-rubric-metadata.json`.

13. Use `Rubric:` only when the actual Buzz rubric file exists.
    - `Rubric: Rubric1.xml` is documented for Essay questions, but do not invent XML file names.
    - If no tested Buzz rubric file exists, omit `Rubric:` from the import text and use the BusyBee metadata JSON instead.

## Written Question Standard

Every written question should answer these before conversion is complete:

- What exact physics claim must the student make?
- What evidence must they cite from the sim, chart, screenshot, or copied values?
- What vocabulary or law must appear?
- What common misconception should be caught?
- What earns full, partial, and no credit?
- What feedback should a student see if the response is incomplete?
- Does this question need human review when the answer is ambiguous?

## Import-Ready Essay Pattern

Use this pattern for new Buzz text files. Keep continuation lines indented with three spaces.

```text
Type: E
Score: 2
Height: 220
Meta-unit: U3
Meta-lesson: U3L4
Meta-skill: momentum_conservation
Meta-grading: busybee
Meta-evidence: trial_chart
1) What did you notice about the total momentum before and after each collision?
@[Always] Your response is graded on claim, evidence from the trial data, and correct use of physics vocabulary.
a. Full credit: States that total momentum before and after is equal or nearly equal in every trial and explains that momentum is conserved for the collision system.
   Partial credit: Says momentum is the same but gives little evidence, or uses evidence correctly with weak vocabulary.
   No credit: Claims velocity is conserved instead of momentum, ignores direction/sign, or gives no usable comparison.
```

## Import-Ready Numeric Feedback Pattern

```text
Type: F, Number
Score: 1
Figures: 3
Meta-unit: U3
Meta-lesson: U3L4
Meta-skill: signed_momentum
1) Trial 1: Total P Before ________ kg*m/s
@[When answer is correct] Good. Your total momentum uses the correct sign convention and is within tolerance.
@[When answer is incorrect] Recheck the right/left sign convention, multiply mass by velocity for each ball, then add the two momenta.
a. 2.9..3.1
```

## Import-Ready Multiple Choice Feedback Pattern

```text
Type: MC
Score: 1
Label: a
Meta-unit: U2
Meta-lesson: U2L5
Meta-skill: inertia_observation
1) In Level 1, click Fast Pull for the cup, card, and penny demo. What happens to the penny?
a. The penny stays on the card and moves with it.
@ This describes the slow pull, where friction has enough time to move the penny.
*b. The penny falls into the cup.
@ Correct. During the fast pull, inertia keeps the penny nearly at rest while the card moves away.
c. The penny sticks to the bottom of the card.
@ Rewatch the trial and focus on where the penny moves after the card is removed.
d. The penny breaks the cup.
@ The demo shows motion, not damage to the cup.
```

## BusyBee Rubric Rules

- Prefer 2 to 4 clear criteria over long holistic rubrics.
- Use physics skills as criteria: claim, evidence, law/concept, calculation/sign/unit, reasoning.
- Give concrete examples of acceptable evidence.
- Keep scoring levels simple: full, partial, no credit.
- Mark answers for human review when they are mid-level, ambiguous, contradictory, missing evidence uploads, or use unusual but possibly correct reasoning.
- Keep style feedback separate from physics feedback unless writing quality is part of the objective.
- Feedback should tell the student what to revise next, not just restate the score.

## Current Repo Audit Notes

As of 2026-07-12:

- Some current `buzz-assessment-questions.txt` files are pure import-ready Buzz text and begin with `Type:`.
- Several older files are teacher-facing question guides and do not begin with `Type:`.
- Most written questions already include "A strong answer" or "Grading guide" prose.
- Only a small number of current files include student-facing feedback lines in Buzz text syntax.

Conversion target: new or revised text uploads should be pure Buzz syntax, include metadata tags where helpful, include feedback lines for auto-graded questions, and have BusyBee-ready rubric metadata for written questions.
