Unit 5 Applications — Buzz Assessment Conversion

Last updated: 2026-08-11

All seven Unit 5 applications are self-contained native Buzz assessment templates.
Each preserves its interactive model and on-screen evidence, uses ordered question slots,
and has a generated local preview. Buzz owns every score.

COMMON ASSESSMENT STANDARD
  15 points per application
  10 points from native auto-graded numeric, matching, or multiple-choice questions
   5 points from the final two BusyBee evidence responses (2 + 3)
   0 points from files: evidence downloads are optional records, not graded uploads

  Total: 59 questions / 105 points across seven assessments.
  BusyBee: 14 essays / 35 points across the unit.

FILE SET PER APPLICATION
  Each application's source, Buzz support files, and preview live in its lab folder.
  Do not create Rise ZIPs for applications; Rise packages are reserved for problem walkthroughs.
  <slug>_buzz_questions.txt                pure Buzz text; paste the whole file
  <slug>_buzz_setup.txt                     generated student guide and teacher Buzz setup
  <slug>-format-suggestions.txt             conversion decisions and publish checks
  <slug>-busybee-rubric-metadata.json       authoritative rubric copy for final essays
  <template>.html                           self-contained assessment template
  <template>-preview.html                   generated local preview; never hand-edit

THE SEVEN APPLICATIONS
  Resonance Tube Lab                 U5L2   10 questions   15 points
  Design the Perfect Instrument      U5L2    8 questions   15 points
  Thin Lens Investigation            U5L3    8 questions   15 points
  Light, Color, and Vision Lab       U5L3    8 questions   15 points
  Spectral Shift Investigation       U5L5    8 questions   15 points
  Honors Relativity Timekeeping      U5H     8 questions   15 points
  GPS and Relativity Investigation   U5H     9 questions   15 points

BUILD AND VERIFY
  node unit-ApplicationFiles/unit-5/build-unit5-buzz-assessments.js
  node unit-buzz-template-conversion-files/build-buzz-template-previews.js unit-ApplicationFiles/unit-5
  node unit-ApplicationFiles/unit-5/validate-unit5-buzz-assessments.js

  Every Unit 5 preview line must report "ok:" and the validator must finish with
  "Fixed model values and Unit 5 launcher links valid."

  The assessment builder regenerates every setup guide as plain text and removes any
  legacy <slug>_buzz_setup.html file automatically.

BUZZ SETTINGS — REQUIRED FOR ALL SEVEN
  Turn question randomization/shuffling OFF.
  Turn one-question-per-page OFF.
  Upload the source template, never the generated preview.
  Confirm Buzz preserves the embedded script before publishing.
  Reset locally saved teacher-test data before students open the assessment.

ACCESSIBILITY AND EVIDENCE
  Do not add clipboard, keyboard-shortcut, selection, or context-menu blockers.
  Evidence images may be downloaded for student records, but are never required uploads.
  Final responses cite the on-screen evidence tables and route ambiguous work to human review.

See buzz-assessment-instructions.html for the file map and publishing workflow, and
unit-5-buzz-assessment-audit.md for the deep-dive findings and fixed physics checks.
