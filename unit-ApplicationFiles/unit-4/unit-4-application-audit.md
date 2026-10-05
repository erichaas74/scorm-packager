# Unit 4 application audit

Reviewed September 22, 2026. Scope: the four applications in this folder (Lessons 1, 2, 3, and 5), their Buzz templates/previews, question imports, directions, and setup guides. Reviewed the current working tree, including existing uncommitted changes. The initial audit did not modify application files.

## Remediation status

Findings 2–4 were subsequently fixed at the user's request. The loop outcome retains contact evidence without the numerical normal force. Hooke's Law requires five samples and a finite positive student estimate before revealing the fit, with both button-state and function-level guards. Thermal curves now reveal only through elapsed trial time and remain hidden before running. Relevant templates and previews were updated, along with standalone Hooke's Law and thermal labs. Finding 1 remains open.

Validation: `node unit-ApplicationFiles/unit-4/test-assessment-workflows.js` passes. It exercises invalid/valid spring estimates, insufficient samples, partial and complete thermal curve rendering, loop trial evidence, and script compilation. Browser and live Buzz validation remain outstanding. Findings below document the original behavior.

## Findings

### 1. P2 — Simple Machines initializes the pulley with inconsistent settings

The embedded pulley starts with `choiceIndex = 2` and `controlSetting = 50`, inherited from the walkthrough. Its choices are `[0, 20, 40, 60, 80]`, so the selected third control says **3 ropes**, but the model uses **4 ropes**. `initUI()` renders controls without synchronizing the setting. Clicking the already-selected third choice also returns early in `setChoice()`.

- Reproduction: open the pulley section before changing any setting; compare the selected rope count with the modeled support count.
- Verified by executing the parameter function extracted from the actual embedded frame: selected setting has IMA 3; initial model has IMA 4.
- Impact: students can calculate 40 N from the selected control while observing a model configured for 30 N, undermining the required force/distance comparison.
- Fix: initialize each frame's control setting from its machine's middle choice before drawing or rendering controls; add a startup-state assertion to the existing test.
- Source: `lesson-1/build-six-machine-lab.js`, frame transformation around lines 80–92; inherited initialization in `problem-walkthoughs/unit 4/simple-machines.html` around lines 448–454 and 578. The generated standalone, template, and preview all contain this initialization.

### 2. P2 — Loop assessment supplies the answer to its normal-force calculation

Trial 3's outcome explicitly says `Completes; top normal force ≈ 981 N`. The outcome is drawn during the trial and copied into the observations table. Question 7 awards two automatically graded points for calculating that same normal force, accepting 960–1005 N.

- Reproduction: complete Trial 3 and copy its contact-evidence value into Question 7.
- Impact: this item measures copying a displayed result rather than applying `N + mg = mv²/R`.
- Fix: retain the observed contact outcome and top speed, but remove the numerical normal force from student-facing trial evidence. Keep it in teacher validation material.
- Source: `lesson-3/u4l3-loop-sim-lab-buzz-assessment-template.html:23` and `:34`; `lesson-3/buzz-assessment-questions.txt`, Question 7. Also present in the preview.

### 3. P2 — Hooke's Law does not enforce its calculate-before-fit workflow

The directions require students to calculate the spring constant before displaying the best-fit line. However, `updateProgress()` enables the fit button as soon as five samples exist, and `calculateFit()` checks only sample count and spread. It never checks the student's calculation.

- Reproduction: collect all five masses, leave the spring-constant entry blank, and display the fit.
- Verified by executing the template's `calculateFit()` with five rounded Spring A samples and no student entry: it displays **20.02 N/m**, R² **1.0000**.
- Impact: students can bypass the intended independent calculation and copy the fitted value.
- Fix: require a valid student estimate before revealing the fit, or revise the directions and assessment to explicitly make fit interpretation the intended task.
- Source: `lesson-2/u4l2-hookes-law-buzz-assessment-template.html:1129` and `:1573`; equivalent behavior in the standalone and preview.

### 4. P2 — Thermal graph reveals results before the prediction and trial

`render()` calls `draw(0)` before a prediction is recorded. Although the table hides unrecorded values, `draw(fraction)` draws the entire 0–60-minute curve using an unconditional loop from 0 through 40; the supplied animation fraction does not limit the curve. Trial tabs can also be changed before predicting.

- Reproduction: before selecting a prediction or running a trial, select each bottle tab and compare the fully drawn cooling curves.
- Impact: students see the relative final temperatures before making the requested prediction, and the Run action does not reveal new graph evidence.
- Fix: draw only axes before a trial, then reveal the curve through the elapsed fraction; show the full curve after completion.
- Source: `lesson-5/u4l5-water-bottle-thermal-test-buzz-assessment-template.html:72` and `:78`; equivalent behavior in the standalone and preview.

## Checks that passed

| Lesson | Question count / native slots | Automatic points | Essay points |
| --- | ---: | ---: | ---: |
| 1 — Simple Machines | 12 / 12 | 10 | 5 |
| 2 — Hooke's Law | 10 / 10 | 10 | 5 |
| 3 — Loop-the-Loop | 9 / 9 | 10 | 5 |
| 5 — Water Bottle Thermal Test | 10 / 10 | 10 | 5 |

- `node unit-ApplicationFiles/unit-4/lesson-1/test-level-progression.js` passes, including six frames, script parsing, question placement, ideal-work checks, and scoring. It does not test initial control/model agreement.
- All 11 top-level inline scripts across Unit 4 HTML files compile; the Lesson 1 test additionally compiles scripts inside its embedded frames.
- Static local `href`/`src` targets resolve.
- Spring A's rounded five-point fit agrees with the accepted spring-constant range; the fixed mystery mass and elastic-energy key are consistent with the model.
- Loop reference values agree with the numeric keys: bottom speed at 45 m is 29.714 m/s; detachment height is `(2h + R)/3 = 36.667 m`; top speeds at 50 and 60 m are 14.007 and 19.809 m/s; initial energy at 60 m is 58,860 J; top normal force there is 981 N.
- Thermal keys agree with the active fixed-trial data: final temperatures 48, 39, 72, and 64 °C; vacuum-bottle energy change −16.744 kJ; metal-bottle average rate −0.6833 °C/min.
- The thermal standalone contains a second, open-investigation implementation, but its enabling body attribute is absent. That code is inactive and was not treated as the delivered student workflow.

## Verification limits

This was a source, JavaScript compilation, and targeted function-execution audit. No live Buzz import, browser interaction/layout test, screen-reader test, or LMS grade-persistence test was performed. Passing local checks does not establish that Buzz preserves iframe `srcdoc` content or inline scripts.
