Unit 5 Applications — Buzz Assessment Conversion

Last updated: 2026-08-10

All six Unit 5 applications are now Buzz-native, self-contained assessment templates.
Each carries its simulation, an evidence panel with a gated PNG export, ordered
<a:question /> slots, and the buzz-assessment-integrity-guard script. None of them
grades itself; Buzz owns every score.

FILE SET PER APPLICATION
  <slug>_buzz_questions.txt      pure Buzz text, paste-whole into the Text editor
  <slug>_buzz_setup.html         teacher setup, answer key, preview checklist
  <slug>-format-suggestions.txt  conversion notes, deviations, remaining publish checks
  <template>.html                the assessment template (sim + slots + guard)
  <template>_preview.html        GENERATED - never hand-edit

THE SIX APPLICATIONS

  Resonance Tube Lab                      Lesson 2   11 questions / 18 points
    template  sound_waves_lab_simulation.html
    slug      sound_waves_resonance

  Design the Perfect Instrument           Lesson 2    9 questions / 15 points
    template  design-the-perfect-instrument/index.html
    slug      design_perfect_instrument

  Thin Lens Investigation                 Lesson 3    9 questions / 15 points
    template  thin_lens_refraction_investigation.html
    slug      thin_lens_refraction

  Light, Color, and Vision Lab            Lesson 3    9 questions / 18 points
    template  light-color-and-vision-lab/index.html
    slug      light_color_vision

  Spectral Shift Investigation            Lesson 3    8 questions / 14 points
    template  doppler-spectral-line-shift/index.html
    slug      doppler_spectral_shift

  Honors Relativity Timekeeping Lab       Honors      9 questions / 16 points
    template  honors-relativity-timekeeping-lab/index.html
    slug      honors_relativity

  Total: 55 questions / 96 points across six assessments.

BUILD AND VERIFY

  Regenerate every preview and confirm slot counts match question counts:
    node unit-buzz-template-conversion-files/build-buzz-template-previews.js
  Every Unit 5 line must report "ok:", never "check:".

  Rebuild the four Rise ZIPs after editing any folder-based template:
    node unit-ApplicationFiles/unit-5/build-unit5-rise-zips.js

BUZZ SETTINGS — REQUIRED FOR ALL SIX

  Turn OFF randomize/shuffle question order. Buzz defaults to randomized order and the
  templates fill their slots in display order, so randomization puts questions in the
  wrong slots. This is the single most common way a working conversion breaks.

  Do NOT use one-question-per-page.

  Title convention: "Unit 5 Lesson #: <Activity Title>".

NOT AN APPLICATION
  GPS Relativity Calibrator.html is a small Rise walkthrough demo widget, not an
  assessment. It is not linked from index.html and was not converted.

The full conversion rationale, per-lab grading design, and the record of what was removed
from each lab is in unit-5-buzz-conversion-plan.md and in each lab's
-format-suggestions.txt.
