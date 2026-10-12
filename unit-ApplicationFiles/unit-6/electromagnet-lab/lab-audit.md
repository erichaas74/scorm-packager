## Repair ? October 12, 2026

- Retained the existing checked calculation practice and optimization workflow.
- Questions 2?6 now assess transfer using new supplied measurements, rather than copying locally checked trial answers. Their numeric keys were recalculated; the 10 automatic + 5 BusyBee score split is unchanged.
- Question 10 now asks learners to reason about a new minimum lift of 190 clips, using their tested designs as evidence. The rubric and metadata match; practice ratios remain supporting evidence.
- Enlarged the coil/core display without changing physical model values, and increased copper and magnetic-field contrast.
- Regenerated the upload template, question preview, and setup guide. Unit 6 structural validation passed. Live Buzz import/grading has not been tested.

The audit below is historical.

---

# Electromagnet lab audit - prior 150-clip version

Historical audit, superseded by the calculation and strength-to-cost redesign. See electromagnet_lab-format-suggestions.txt and test-ratio-workflow.cjs for the current workflow and verification.

Audited 2026-09-22. Scope: current HTML lab, Buzz template/preview, completion workflow, and assessment alignment. No lab behavior changed during this audit.

## Findings

1. **Medium: budget cannot constrain a valid design.** With wire limited to 250 cm, wire costs at most 12.50; the largest iron core costs 14.50; four cells cost 16.00. Their sum is 43.00, below the 50.00 budget. Every wire-valid build fits the budget. The budget warning works, but only for builds already over the wire limit. Consider lowering the budget or changing costs if balancing both resources is intended.
2. **Medium: success popup lacks keyboard focus handling.** Completing a run does not move focus to Keep testing or Next trial. The popup has no dialog role, focus containment, or focus restoration. Add these so keyboard and screen-reader users can follow the completion path.
3. **Medium: opening a trial retains the previous build.** Students must select Load required setup or manually match every setting. Next trial changes only the selected trial. Incorrect setups correctly fail completion, but the extra step is easy to miss. Consider automatically loading required setups when opening a trial, or label the action clearly in the trial instruction.
4. **Low: the challenge has no prerequisite gate.** Trial 6 can turn green before any required trials. All six green tabs indicate all tasks are done, but challenge completion alone does not imply lab completion. Gate the challenge only if the five-trial sequence is required; otherwise clarify that tabs can be completed in any order.
5. **Low: predicted and tested values are not clearly distinguished.** The Magnet strength display updates immediately as controls change and gives the exact eventual test result. Run test is still necessary to earn completion. Label it Predicted lift, or display measured lift only after a run if prediction/testing is the learning objective.
6. **Low: feedback still says Run logged although the log is no longer visible.** Failed designs are kept internally, but students can only see the saved successful result on each tab. Change the message to describe the result without promising a visible log.
7. **Low: introductory comparison language is inaccurate.** Trial 1's success message says Trials 2 through 5 each change one variable from baseline. Trial 5 changes cell count and wiring from baseline; its proper single-variable comparison is Trial 4. Trial 5's own description correctly identifies that comparison.

## Verified behavior

Headless Chrome tests passed for all six completions, mismatched required setups, wire/budget blocking, challenge completion without prerequisites, green tabs, reload persistence, reset, and page widths 1100, 820, 650, and 390 pixels. No JavaScript exceptions occurred. Reviewed desktop and mobile screenshots. Source and generated upload template match; preview contains ten questions.

Required trial results: baseline 49 clips / 0.50 A; double turns 54 clips / 0.27 A; air core 4 clips / 0.50 A; two series cells 85 clips / 0.85 A; two parallel cells 54 clips / 0.54 A. These agree with the numeric Buzz answer ranges.

A test takes about 2.6 seconds. Controls, loading a setup, trial changes, and reset are blocked during a run. Exceeding wire or budget limits disables Run test. An incorrect required setup or a challenge below 150 clips does not earn completion. A completed tab stays complete when controls change or a later attempt fails. The challenge retains the strongest successful design. State uses sessionStorage: it survives reload in the same tab, but is not durable cross-session or LMS completion storage. The graphic displays at most 80 clips and labels this cap; scoring uses the full computed count.

## Student completion path

1. Open each of Trials 1 through 5.
2. Select Load required setup, then Run test.
3. Wait for the success message and green tab; select Next trial.
4. On Trial 6, select an iron core, 20 turns, 25 mm diameter, four cells, and Series wiring.
5. Select Run test. This tested build lifts 181 clips, uses 157 cm of wire, draws 0.72 A, and costs 38.35. Its tab turns green because it reaches at least 150 clips within both limits.
6. All six green tabs mean all six lab tasks have been recorded. Review saved results on those tabs to answer the separate Buzz assessment questions.

The challenge requires reaching 150 clips, not finding the absolute maximum. Enumeration of all slider/button settings found a maximum of 198 clips. One maximum-strength build is 60 turns, 13 mm iron core, four series cells: 245 cm wire, 0.51 A, and cost 36.75. This maximum was calculated from the current simulator function; the 181-clip example was also exercised in the browser.

## Limits of this audit

This audit verifies the simulator's implementation and local student workflow. It does not validate the simplified paperclip-strength model against a physical experiment, or verify submission/grading inside a live Buzz course.
