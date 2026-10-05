# Unit 6 Lesson 2: Dynamic Electric-Field Motion audit and fixes

Revised September 22, 2026 using [the Unit 6 review guide](../unit-6-lab-review-guide.md). **All six findings have been addressed and checked locally.** Live Buzz and screen-reader verification remain outstanding.

## Increased-difficulty revision

The four image questions now comprise two combined-force mystery-sign problems and two initial-motion problems. Q1 compares opposing forces from magnitudes 2Q and Q; Q2 uses a negative test charge and a diagonal net-force arrow. Q3 requires reversing field direction for a negative test charge; Q6 requires the inverse-square 4:1 component ratio for distances d and 2d. Scoring and the other four questions remain unchanged. Tests confirm the force directions, unique mystery signs, component ratio, embedded-image agreement, and readable desktop/mobile layouts.

## Mystery-charge revision

Questions 1-2 now hide the source sign with a gray ? and show an electric-force arrow on the positive test charge. Students infer positive for the repulsive arrangement and negative for the attractive arrangement. Neither source color nor alternative text reveals the hidden sign. Questions 3 and 6 remain motion-direction images, so the set still contains exactly four image questions. All scores and other questions remain unchanged. Independent force/sign checks and desktop/mobile rendering checks passed.

## Mixed image-question revision

Questions 1, 2, 3, and 6 now show starting-position diagrams and ask which direction a positive test charge released from rest will begin moving. The four setups cover repulsion, attraction, perpendicular force addition, and equal-force cancellation. Questions 4?5 (numeric calculations) and 7?8 (evidence explanations) are unchanged, as are all point values and the 10 automatic + 5 BusyBee split. Diagrams are embedded in the template, with standalone SVG copies in `question-diagrams/`; no separate image upload is needed for the template.

`test-questions.cjs` passes independent force-direction and answer-key checks. `test-browser.cjs --questions-only` confirms all four embedded images load, with desktop/narrow screenshots and no overflow or JavaScript exceptions. Live Buzz image sanitization/import remains untested; confirm the template displays its diagrams in the target LMS. The question text also describes the arrangements for accessibility.

## Latest layout change

At the user's request, removed `ef-readings`, `ef-status`, and the entire `ef-evidence` section, including its table and PNG export. Successful arrangements still save beside Questions 7?8. Challenge buttons are now below the canvas; completed buttons are green, including the active completed button. Start over remains available in the arena toolbar. Earlier export/readout verification below describes the previous layout, not retained UI.

## Revised implementation

- Removed the oversized hero, section navigation, plan/mission block, procedure cards, fact badges, repeated apparatus heading, and footer. Retained a compact title, honest core progress, meaningful challenge buttons, and immediate directions.
- Changed to a light arena and simpler controls. The side panel is removed; compact source and run controls are integrated into the arena at every width. Detailed vector explanation is expandable.
- Added immutable successful charge-position snapshots, separate per-challenge working drafts, same-tab persistence, evidence beside Questions 7?8, and positions in the optional PNG. Earlier count-only records are retained and explicitly ask for a rerun to obtain the missing position evidence.
- Removed the source selector, sign editor, and position fields at the user's request. Sources are added with the on-arena +/minus buttons and positioned by dragging. Bracket-key reselection, arrow movement, persistent selection after a run, and touch dragging remain available.
- Added labeled E, F, a, and v arrows, textual components, and an explanation of the model's unit charge/mass, time scaling, and damping.
- Corrected out-of-order completion and focus handoff. Removed the obsolete upload instruction. Eight questions and the original 10 automatic + 5 BusyBee points are unchanged.
- Updated the authoritative source and builder setup inputs; added a lesson filter to the Unit 6 builder and regenerated only this lab's template, setup guide, and preview.

## Verification after fixes

| Check | Result |
| --- | --- |
| Unit 6 validator | Passed: question counts, scoring, syntax, source/template agreement, previews, setup guides, launcher links. |
| Model regression | Passed for source/template/preview at 760 ? 520 and 320 ? 520: all three successful paths, wrong-sign rejection, immutable snapshots, draft restoration, keyboard revision/reselection, reset, legacy-state migration, out-of-order completion. |
| Native Chrome workflow | Passed all three challenges in order 1 ? 3 ? 2; partial progress remains honest and final completion focuses Questions. |
| Native Chrome input/persistence | Passed keyboard movement after reset, bracket-key source cycling, actual page reload with retained drafts, and CDP-emulated touch dragging with saved coordinates. |
| Native Chrome reset/export | Passed confirmed reset to 0% with focus returned to Add source; downloaded evidence PNG inspected with complete source positions. |
| Rendered layout | Inspected desktop, field vectors, success states, question handoff, narrow layout, and export. The controls are part of the arena, with no side panel or numeric source editor. No page-level horizontal overflow. |
| Runtime/format checks | No browser JavaScript exceptions; git diff whitespace check passed. |
| Still not tested | Live Buzz embed/import/grading, LMS persistence, physical touch hardware, screen readers, optional challenges 4?5 end-to-end, every possible overlap/extreme placement. |

Screenshots: [desktop](audit-evidence/revised-desktop.png), [vectors](audit-evidence/revised-vectors.png), [Challenge 3 at 67%](audit-evidence/revised-curve-success.png), [narrow layout](audit-evidence/revised-narrow.png), [questions](audit-evidence/revised-questions.png), [downloaded evidence](audit-evidence/u6l2-electric-field-evidence.png).

Run:

```text
node unit-ApplicationFiles/unit-6/dynamic-electric-field-lab/audit-workflow.cjs
node unit-ApplicationFiles/unit-6/dynamic-electric-field-lab/test-browser.cjs
node unit-ApplicationFiles/unit-6/validate-unit6-buzz-assessments.js
```

The browser test uses installed Windows Chrome with a separate temporary profile. The model test uses a minimal DOM substitute and is not a substitute for browser testing.

## Original findings and acceptance criteria

The problem descriptions and source line references below document the pre-fix version. Their status entries have been updated; the revised verification above supersedes the original verification table at the bottom.

## 1. P1 — Successful arrangements are not recorded and working designs are discarded

- **Observed problem:** The “Successful setup” column contains only positive/negative counts. Neither storage nor the evidence PNG contains positions. Changing challenges or refreshing removes the working arrangement, including successful designs. Questions 7–8 require the signs and locations of successful arrangements, so the saved evidence cannot support the assessed responses.
- **Reproduction:** Complete Challenge 1 with a positive source left of the launch point; inspect the table; switch to Challenge 2 and back, or refresh. Completion remains recorded, but the source is gone. Repeat with Challenge 3. Two different arrangements with the same charge counts produce indistinguishable setup evidence.
- **Evidence:** [recordSuccess](dynamic_electric_field_lab.html#L566) (lines 566–570) stores counts, speeds, time, and date only; `loadLevel` (515–527) recreates empty initial setups; table generation (477–483) and PNG (645) show counts only. [audit-workflow.cjs](audit-workflow.cjs) reproduces loss on challenge change and reload for source, template, and preview. Questions 7–8 explicitly assess placement. Setup directions promise saved arrangements.
- **Proposed change:** Store immutable successful snapshots with each source's sign and normalized position, launch/target/barrier context, and readable positional descriptions or diagrams. Preserve working arrangements separately per challenge. Provide a way to review the successful snapshot while answering questions. Keep historical success clearly separate from later edits; historical completion need not disappear just because a draft changes.
- **Acceptance check:** Complete two distinguishable designs, switch challenges, refresh, and recover the correct successful arrangement and working draft for each. Answer Questions 7–8 entirely from retained evidence. A subsequent failed edit must not overwrite successful evidence.
- **Status:** Fixed and verified locally: successful positions and independent drafts survive switching and reload; snapshots appear beside Questions 7?8 and in the downloaded PNG. Guide sections 4, 5, 6, and the Dynamic Electric-Field target.

## 2. P2 — Keyboard users cannot reselect charges after a run

- **Observed problem:** Adding a source selects it and supports arrow movement, but starting clears selection. After resetting or failing, there is no keyboard selection mechanism. In a multi-charge design, adding another source also leaves no keyboard path back to earlier sources. Students must clear and rebuild their design to revise it without a pointer.
- **Reproduction:** Add and position a charge using arrow keys; start and reset the particle; focus the canvas and press arrows or Delete. Nothing happens. In Challenge 3, add two charges and try to select the first using the keyboard.
- **Evidence:** `addCharge` (528–535), `start` (551), pointer-only selection (626), and the selected-charge precondition in `keydown` (630). Probe confirms unchanged position and null selection after a run/reset. Canvas summary (609) gives charge count and motion state, but no positions or selected-charge identity.
- **Proposed change:** Provide a keyboard-accessible charge selector with sign and position, preserve/restore useful selection, and expose selected state and position changes accessibly. Add explicit sign editing or an accessible replacement operation. Verify touch dragging as well: current `touch-action: manipulation` permits browser panning, and native touch behavior has not been tested.
- **Acceptance check:** Using keyboard only, build three charges, select and revise any one, run, fail, reset, and revise again without clearing the design. Repeat with touch and verify drag is not canceled by scrolling. Test actual browser focus and a screen reader.
- **Status:** Fixed and verified locally: native keyboard selection/movement and emulated touch dragging pass. Screen-reader verification remains outstanding. Guide sections 3, 7, and 8. The keyboard handler defect is executed evidence; native input behavior remains untested.

## 3. P2 — The promised vector comparison is missing

- **Observed problem:** Students see a net-field grid, a trail, and numeric speed/velocity angle, but no force, acceleration, or velocity arrows attached to the test charge. The run status tells them to watch the “velocity vector,” and setup publishing checks promise all four vectors. The HUD is also hidden from accessibility APIs.
- **Reproduction:** Add a source and start motion. Inspect the renderer and HUD: only `drawField` produces arrows; the test-particle branch updates speed and angle text.
- **Evidence:** `drawField` and `render` (593–609), run status (551), `aria-hidden="true"` HUD (271), and builder checks (approximately 76–78). The render implementation has no drawing paths for the missing vectors. This finding is based on source, not a screenshot of moving vectors.
- **Proposed change:** Add clearly labeled, distinguishable local E, force, acceleration, and velocity vectors with accessible equivalents, consistent scaling/units, and a short explanation of model units. Clarify the simplified model's time scaling and damping where necessary rather than implying quantitatively exact SI motion. Synchronize setup promises with implemented behavior.
- **Acceptance check:** In a curved run, show the local field/force/acceleration relationship while velocity may point in another direction. Verify labels at rest, during motion, at extremes, and at narrow widths; expose equivalent information without relying solely on color or canvas.
- **Status:** Fixed and verified locally: E, F, a, and v have distinct labels/colors and accessible component text. Screen-reader verification remains outstanding. Guide sections 2, 3, and 7.

## 4. P2 — Introductory panels bury the apparatus

- **Observed problem:** The title/hero, section navigation, plan heading, design question, procedure cards, facts grid, and second apparatus heading precede the working area. At 1440 × 1000 capture size, the arena starts around y=873 and the test charge/target are below the first screen. Small-screen CSS stacks the entire control panel before the arena.
- **Reproduction:** Open the current generated preview at the top. Inspect the first screen and the responsive CSS at 900px and 620px breakpoints.
- **Evidence:** [Desktop screenshot](audit-evidence/desktop-initial.png); markup 178–267; CSS 146–163. [Narrow capture](audit-evidence/narrow-initial.png) also shows only introductory content. That capture is clipped horizontally; effective viewport/overflow measurements were not collected, so a separate horizontal-overflow diagnosis is not asserted.
- **Proposed change:** Keep a compact title and correctly labeled progress, then place the working arena and immediate controls early. Move detailed explanation beside questions or into setup directions. Retain meaningful challenge navigation. Apply the guide's light-background default and recheck all drawing colors and contrast.
- **Acceptance check:** In actual desktop and narrow embedded previews, students can identify the test charge, target, first action, and evidence destination without traversing several instruction panels. Measure layout, inspect overlap at charge-position extremes, and verify the arena is not below a full-height control card.
- **Status:** Fixed and verified locally: compact opening and light arena; controls are integrated into the arena with no side panel. Guide sections 1–3. Initial screenshots were inspected; moving-state visual verification is outstanding.

## 5. P2 — Obsolete upload instruction contradicts Question 1 and scoring

- **Observed problem:** “Build your evidence” says to upload the image in Buzz Question 1. Question 1 is a multiple-choice field-direction question with no upload requirement. Other directions correctly say that PNG export is optional and not graded.
- **Reproduction:** Read the evidence heading, then Question 1 and the setup guide's scoring instructions.
- **Evidence:** Source/template line 292; the generated preview preserves the instruction; question import Question 1; setup steps 4–6 and “SUCCESS AND SCORING.”
- **Proposed change:** Remove the upload instruction from the authoritative source; describe the optional PNG consistently and direct students to use the evidence for Questions 7–8. Update/regenerate affected artifacts through the existing builders after the source correction.
- **Acceptance check:** No source, template, preview, setup, or launcher text requires an upload; all eight question slots still match their imports; scoring remains 10 automatic + 5 BusyBee points.
- **Status:** Fixed and verified: obsolete upload direction removed from source, template, and preview; setup and scoring remain consistent. Guide sections 5, 6, and 8.

## 6. P2 — Challenge 3 announces completion even when other core work is missing

- **Observed problem:** Challenge tabs allow any order, but Challenge 3's success message unconditionally says “Core evidence is complete.” Completing it first leaves actual progress at 33%. The next action also advances to optional Challenge 4 instead of directing the learner to remaining core work or the assessment when ready.
- **Reproduction:** Start fresh; select Challenge 3 and solve it before Challenges 1–2. Read the success message and progress indicator together.
- **Evidence:** Challenge 3 message (404), freely selectable tabs (446–457), success/modal update (566–570), and Next handler (624). The probe explicitly asserts the conflicting “complete” message at 33%.
- **Proposed change:** Derive completion text and next action from the actual core records. Offer the next incomplete core challenge; once all three are complete, offer a clear handoff to the questions and label extensions optional. Move focus to the next useful action.
- **Acceptance check:** Complete challenges in multiple orders. No message claims core completion until all three records exist; the final core success offers the questions, and reset restores truthful initial messaging.
- **Status:** Fixed and verified locally: browser completion in order 1, 3, 2 shows truthful partial completion, then moves focus to questions at 100%. Guide sections 6 and 8.

## Original audit verification results (before fixes)

| Check | Result and scope |
| --- | --- |
| Unit 6 repository validator | **Passed:** all lessons; U6L2 has 8 questions, 10 automatic + 5 BusyBee points, required artifacts and launcher links. This validator does not detect the findings above. |
| Source/template/preview scripts | **Passed:** identical simulation script text. The builder intentionally copies this source to the template; preview adds question presentation. |
| Normal three-challenge model path | **Passed:** actual integration/collision/success functions reached all three targets at 760 × 520 and 320 × 520 arena sizes in all three artifacts. Deterministic search found Challenge 3 configurations; this is not a student usability pass. |
| Incorrect attempt | **Passed:** wrong-sign Challenge 1 rejected without recording success or incrementing attempts. |
| Challenge switching and refresh | **Failed for arrangements:** positions disappear. **Passed for counts:** recorded completion survives a simulated same-tab remount. Actual browser reload/LMS persistence not tested. |
| Edit after success | **Observed:** clearing working sources leaves historical completion at 100%. This is acceptable only with clearly retained successful snapshots; those snapshots are currently missing. There is no editable measurement table. |
| Reset | **Passed at handler/model level:** records cleared and progress returns to 0%. Native confirmation and focus not tested. |
| Keyboard revision | **Failed at handler level:** no selected charge after run/reset; no keyboard reselection route. Native keyboard-only end-to-end path not tested. |
| Desktop/narrow visuals | **Partial:** initial generated-preview screenshots captured in headless Chrome and inspected. These are local standalone previews, not live Buzz embeds. Dynamic states, modal focus, overlap extremes, and effective narrow viewport dimensions remain unverified. |
| Numeric questions | **Passed by direct calculation:** Q4 gives 0.006 N within 0.0059–0.0061; Q5 gives 5 N/C within 4.95–5.05. These use explicit hypothetical inputs, not measured simulator outputs. No duplicate calculation panel exists. Live numeric parsing/tolerance boundaries not tested in Buzz. |
| Question grouping/evidence | **Failed:** Questions 7–8 require positions absent from the saved record. All questions are grouped at the bottom; trial-specific evidence should remain available near the corresponding responses. |
| BusyBee | **Metadata/rubric review only:** the two essays retain 2 + 3 points and evidence-based rubrics in the question TXT. No separate metadata JSON exists in this folder. Actual routing/grading not tested. |
| Touch, screen reader, live Buzz import/grading | **Not tested.** Pointer handlers alone do not establish touch accessibility. |

Reproduce the executed checks:

```text
node unit-ApplicationFiles/unit-6/dynamic-electric-field-lab/audit-workflow.cjs
node unit-ApplicationFiles/unit-6/validate-unit6-buzz-assessments.js
```

The probe uses a minimal DOM and an in-memory export of the shipped script's closure. It does not change production HTML. Its defect assertions document current failures; update them when implementing fixes. Initial Chrome capture failed under the sandbox due to Windows IPC access; an approved escalated run produced the included screenshots. No claim is made that the full browser/student path or live assessment passed.
