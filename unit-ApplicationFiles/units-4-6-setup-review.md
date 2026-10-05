# Units 4–6 application setup review

Reviewed September 22, 2026 against the current Unit 1–3 files, including existing uncommitted work.

## Result

All 17 existing applications pass local setup consistency checks after the changes below. This covers question imports, native template slots, preview counts, score totals, final BusyBee essays, and student/teacher directions. It does not certify simulation behavior or a live Buzz import.

| Unit | Applications | Current scoring |
| --- | ---: | --- |
| 4 | 4 | 15 points: 10 automatic + 5 BusyBee |
| 5 | 7 | All at 15 points; Thin Lens has twenty 0.5-point questions and one 5-point conclusion |
| 6 | 6 | 15 points: 10 automatic + 5 BusyBee |

Unit 4 Lesson 4 is intentionally absent according to its shared publishing guide.

## Changes

- Added four student-first Unit 4 TXT setup guides with mission, learning goals, workflow, scoring, teacher setup, and preview checks. The launcher now points to these guides. Existing HTML guides remain available for teacher reference values.
- Added separate BusyBee rubric metadata for all four Unit 4 and six Unit 6 applications, preserving the exact authored essay prompts and grading feedback. Unit 5 already has separate metadata. The Unit 6 guide builder now references the fallback files.
- Regenerated combined student directions from individual setup guides for Units 4–6. This fixes the stale Unit 5 Thin Lens directions and brings Unit 6's combined directions into agreement with its current workflows. Unit 4's combined directions now describe native Buzz submission rather than a generic return-to-Rise flow.
- Added `sync-application-setup.js` to regenerate the setup artifacts and check all 17 applications. Run it after lesson builders or question edits; add `--check` for verification without writes.

## Differences deliberately preserved

The reference units do not have one universal delivery model: Unit 1 Lesson 1 uses a SCORM assignment, other Unit 1 lessons have different score splits, and Units 2–3 use native Buzz assessments. Units 4–6 retain their current native Buzz delivery, authored question order, score totals, and clipboard accessibility behavior. Older integrity guards from Units 2–3 were not copied into these units.

Unit 3 reserves its 10 automatic points for completed provided charts. Units 4–6 have broader existing uses of that score split, including calculation and design activities. Their scores were preserved rather than treating this lesson-specific Unit 3 rule as authorization to redesign the assessments.

Unit 4 retains compatibility direction files and its HTML teacher guides; their current directions and BusyBee policy are synchronized with the TXT guides. The compatibility builder no longer recreates retired applications or stale Rise submission directions.

Subsequent scoring update: all 34 applications across Units 1–6 now total 15 points. All 64 BusyBee question rubrics require 0.5-point increments and list their allowed scores. Existing binary completion rules remain binary. Five previously missing Unit 2 rubric metadata files were added. Run `node unit-ApplicationFiles/application-scoring-policy.js --check` to verify the common rule and directions.

## Verification

- Existing Unit 1, 2, and 3 validators passed during baseline comparison.
- Existing Unit 5 and 6 validators passed after updates.
- Unit 4 assessment-workflow and six-machine tests passed.
- `node unit-ApplicationFiles/sync-application-setup.js --check` passed for all 17 applications.
- All 98 static local HTML targets checked across Units 4–6 resolved.

Live Buzz question import, script/iframe preservation, student answer saving, and grade persistence still require a Buzz student-preview test. Previously documented simulation findings in the Unit 4 and Unit 5 application audits remain separate from this setup review; this review does not close those findings.
