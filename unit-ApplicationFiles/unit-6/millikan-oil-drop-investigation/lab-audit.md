## Repair verification ? October 12, 2026

Findings 1?4 below are now addressed. The earlier audit is retained as history.

- Native Buzz measurement progress depends only on six recorded drops; it reaches 100% without hidden responses and does not submit or grade the Buzz assessment.
- Reset and CSV export are visible beside the evidence table. Reset retains its confirmation.
- The native table and CSV contain measured voltages only. Learners calculate charge magnitudes in the questions; numerical keys remain unchanged.
- The model explains negative drops, plate polarity, and upward electric force. Formulas, questions, and rubric metadata use charge magnitude |q|/e.
- The standalone version retains its visible analysis workflow and calculated table, with corrected magnitude labels.

Validation: the updated audit-workflow.cjs passes six legal balances, off-balance and duplicate rejection, persistence, 100% measurement progress, and reset to zero for template and preview. Chrome checks passed at 320, 390, and 1200 px for source and preview, including visible reset/export and recording. Unit 6 structural validation passes. Live Buzz import and grading were not tested.

---

# Unit 6 Lesson 1 audit: Millikan Oil Drop

Reviewed September 22, 2026 using the [Unit 6 review guide](../unit-6-lab-review-guide.md). This is the first individual lab audit. Findings below concern the student-facing Buzz template and preview, not merely the older standalone source. The original audit made no implementation changes. The subsequent apparatus revision is documented below; line references describe the originally audited version.

**Result: revise before treating this lab as meeting the new design standard.** Five open findings follow. The most urgent changes are measurement-only progress, an accessible reset, and moving assessed calculations out of the evidence table.

## 1. P2 ? Progress depends on six invisible responses

**Observed:** After recording all six drops, the interface reports Evidence 6/6, Responses 0/6 and remains at 50%. The response fields belong to the hidden legacy analysis section. Native Buzz answers are separate and do not update those fields.

**Reproduce:** Start with empty saved data. Balance and record six distinct drops, then inspect the progress indicator. Completing the native questions cannot satisfy the six legacy textareas.

**Evidence:** Template line 170 hides `.u6-legacy-analysis`; lines 346?354 contain the old fields; lines 682?701 count them in progress. The executed audit probe returned `{evidence:6,responses:0,score:50,ready:false}` for both template and preview.

**Change:** Base simulation progress on six recorded observations and label it accordingly. Remove the legacy response count and obsolete submit/SCORM completion dependency from the native assessment route. Let Buzz grade and submit its own questions.

**Acceptance:** Initial progress is 0%; six records produce 100%; refresh preserves progress; reset returns to 0%. Progress must not claim that the Buzz assessment has been submitted.

## 2. P2 ? Reset and the advertised CSV export are hidden

**Observed:** The conversion hides the whole `.finish-card`, including Clear Saved Lab and Export Evidence. The setup guide still instructs students to export CSV and teachers to reset test data. Saved records return after refresh, but students have no visible reset or individual row-edit control.

**Reproduce:** Record data, refresh, and look for Clear Saved Lab or Export Evidence. Both buttons exist inside a section forced to `display:none!important`.

**Evidence:** Template lines 170 and 357?369; handlers at lines 784?802. The audit probe verified that six records survive reload and that the reset handler clears storage when invoked programmatically; this does not make the hidden button accessible.

**Change:** Keep a small visible reset near the evidence table, with confirmation. Decide whether CSV remains useful: expose it as an optional record or remove its instructions and code. Do not restore the obsolete Finish and Submit panel just to recover these controls.

**Acceptance:** A student can visibly reset and restart the investigation using a keyboard. Setup directions describe only controls actually available in the template.

## 3. P2 ? The table supplies the numerical work being assessed

**Observed:** Recording a voltage immediately fills both relative q/e and estimated charge. Questions 3 and 4 ask students to calculate q/e for 100 V and 50 V, but those same records display 2.00 and 4.00. The table also performs the charge conversion that Question 7 assesses, although the recorded 67 V result is a rounded approximation to its specified 3e case.

**Reproduce:** Record the 100 V and 50 V drops. Read 2.00 and 4.00 directly from the table, then compare with Questions 3 and 4.

**Evidence:** Template lines 672?677 render the calculated columns; lines 756?763 calculate them automatically. The audit probe recorded those exact voltage/result pairs. See Questions 3, 4, and 7 in [the question import](buzz-assessment-questions.txt).

**Change:** Keep drop number and measured balance voltage as the primary evidence. Put relative-charge and charge-magnitude calculations into clearly associated questions. If calculated fields remain for later interpretation, reveal them only after the relevant assessed work or redesign the questions to assess interpretation rather than calculation. Update Questions 9?10 and their rubrics if calculated values move out of the table.

**Acceptance:** The student can identify the appropriate recorded drop for each calculation, but cannot copy its assessed answer from an automatically filled table cell. Rubrics refer to evidence students still have access to.

## 4. P2 ? Charge magnitude is not distinguished from signed charge

**Observed:** The microscope draws a positive upper plate and negative lower plate, while the electric force on the drop points upward. That depicts a negatively charged drop. However, the table labels positive values as Estimated charge, labels the dimensionless q/e column with an extra e in each cell, and never clarifies that it is reporting magnitudes.

**Evidence:** Template lines 579?606 draw the plate signs; lines 488?492 and the vector drawing implement upward electric force for positive model magnitude `n`; line 677 appends `e` to values under Relative q/e; lines 758?763 generate positive charge values.

**Change:** Preserve the existing physical arrangement but explain that the model uses charge magnitude. Label the columns and questions consistently as |q|/e and charge magnitude |q| where appropriate, omit the extra unit e from the dimensionless ratio, and identify the actual drop as negative. Alternatively, change all signs and plate orientation coherently. Do not change just a number's sign without updating questions and numeric keys.

**Acceptance:** Plate polarity, electric-field direction, force direction, charge sign, table units, formulas, questions, and answer keys tell the same story.

## 5. P3 ? The opening repeats explanations and apparatus headings

**Observed in source structure:** The opening contains an eyebrow, a long title, introductory copy, then Apparatus Overview plus another explanatory line and a large schematic before the working Microscope View. A separate Controls heading and later Investigation Method repeat the task framing. The assessment section adds a score strip. This exceeds the compact title/progress/apparatus pattern requested in Unit 5.

**Evidence:** Template lines 175?192, 263, 280, and 333?341. This is a structural finding; viewport placement and readability still need a rendered-browser review.

**Change:** Use a short title, measurement progress, and the working microscope first. Place atomize, voltage, vector visibility, and record controls beside the working view. Keep the schematic only if it helps explain the microscope connection; make it secondary. Preserve the scaled-model limitation and place calculation guidance with the questions.

**Acceptance:** At desktop and narrow widths, the learner quickly reaches the adjustable drop and voltage control without scrolling through repeated explanation. Essential controls remain keyboard operable.

## What passed

Executed against both shipped Buzz template and preview with a minimal DOM substitute:

- All six model charge multiples can be recorded with legal integer slider settings: 200, 100, 67, 50, 40, and 33 V.
- An off-balance 300 V attempt is rejected for every tested drop.
- Clicking Record twice for the same drop does not create duplicate evidence.
- Recorded rows persist across a fresh script mount using the same storage.
- The reset handler clears storage when invoked directly; its visibility fails as described above.
- The existing Unit 6 validator passes question counts, 10 automatic + 5 BusyBee points, template/preview structure, setup files, model-value checks, and launcher links. Its success does not detect the hidden-response progress problem.

The recordable relative values at those integer settings are 1.00, 2.00, 2.99, 4.00, 5.00, and 6.06. These are consistent with the stated approximate whole-number pattern; do not require students to fabricate exact integers from rounded voltage measurements.

## Recommended revision order

1. Remove hidden legacy response dependencies and make measurement progress correct.
2. Restore an accessible reset and resolve the export/directions mismatch.
3. Move assessed calculations into drop-associated questions and update the evidence-dependent rubrics.
4. Clarify signed charge versus magnitude consistently.
5. Simplify the opening and verify the actual visual layout and keyboard flow.

## Verification limits and reproduction

Run the read-only probe:

```text
node unit-ApplicationFiles/unit-6/millikan-oil-drop-investigation/audit-workflow.cjs
node unit-ApplicationFiles/unit-6/validate-unit6-buzz-assessments.js
```

The probe intentionally documents the current failures; its assertions are not a post-fix acceptance suite. Update the expectations when fixing the lab.

**Not tested:** rendered desktop/mobile screenshots, native browser focus and keyboard behavior, screen-reader behavior, live audio/animation, live Buzz import, LMS grading or persistence. The voltage range input and buttons are native controls in source, but that alone is not a full accessibility pass. No claim is made that the native Buzz assessment itself is blocked at 50%; the confirmed failure is the lab's own progress calculation.

Revision after review: the apparatus overview is now the sole working view, with its maximum width increased from 450 to 900 pixels. The live drop and optional force vectors run inside its plate chamber; the separate microscope panel and duplicate overview heading are removed. Controls and data sit below the apparatus. The recording/restore probe still passes and now checks that the live drop remains centered when its chamber resizes. Finding 5 is partially addressed; the remaining header/method simplification has not been performed. Findings 1-4 remain open.

A headless Chrome screenshot was attempted but the process could not start because Windows denied its IPC/crash-handler access. The combined layout has not yet been visually verified in a browser.

Next individual lab: Unit 6 Lesson 2, Dynamic Electric-Field Motion.
