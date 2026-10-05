# Unit 5 application audit

Reviewed September 22, 2026. This is a fresh audit of the current seven applications, distinct from the earlier conversion report in `unit-5-buzz-assessment-audit.md`. Application code, question imports, and generated files were not changed.

## Findings

Remediation update: Finding 1 has been addressed. Spectral Shift now uses native reference buttons, a labeled keyboard-operable marker slider, and a Check alignment button using the existing alignment tolerance. Focus advances to Next Case and then the assessment heading; pointer dragging remains available. Source, template, preview, and setup directions are updated. `node unit-ApplicationFiles/unit-5/doppler-spectral-line-shift/test-workflow.js` exercises all three cases, wrong references, incorrect alignments, focus transitions, reset, and pointer compatibility using a DOM substitute. Native browser and assistive-technology verification remain outstanding. Findings 2–5 remain open. The descriptions below record the original audit findings.

### 1. P1 — Spectral Shift cannot be completed with a keyboard

Reference cards are created as clickable/draggable `div` elements without keyboard focus or activation. The spectrum alignment target is an SVG `rect` with pointer handlers but no keyboard interaction. Objects A and B require this alignment before their evidence is recorded and progression becomes available. The source contains no `keydown` handler or equivalent adjustment control.

- Reproduction: use Tab and Enter to try selecting a reference and aligning Object A's markers. Neither required operation has a keyboard control.
- Impact: keyboard-only learners cannot complete the investigation or obtain the required measured-shift evidence.
- Fix: use native buttons for reference selection and provide a labeled keyboard-operable range or numeric control for alignment, with the same completion checks as dragging.
- Source: `doppler-spectral-line-shift/index.html:362`, `:697`, `:744`, `:815`, and `:824`. The assessment template contains the same implementation.

### 2. P2 — GPS accepts a correction that fails its navigation specification

Part C labels a calibration locked and enables recording whenever residual drift is below 0.2 microseconds/day. Part A defines a 10 m position-error limit, and Part D runs for one day. A 0.2 microsecond timing error corresponds to about 60 m, so the acceptance threshold is too loose for the stated mission.

- Reproduction: set the Part C offset to **4.550 mHz**, record it, then run Part D.
- Verified by executing the actual `renderC()` and `runDay()` functions: the calibration is accepted at **+0.1730566 microseconds/day**, and the corrected error after one day is **0.051881 km = 51.881 m**. The mission allows this result to be recorded.
- Impact: a student can follow every success cue and finish with a corrected system that still violates the specified navigation limit. The accepted offset also falls inside Question 5's grading range.
- Fix: derive the calibration tolerance from the navigation budget and mission duration, requiring absolute one-day error at or below 10 m (about 0.03336 microseconds/day), or explicitly teach and flag residual mission failure. Update the generated directions as well.
- Source: `gps-relativity-investigation/gps_relativity_investigation.html:483`, `:496`, `:506`; generated direction source `build-unit5-buzz-assessments.js:182`.

### 3. P2 — Color Vision labels unfiltered white light as green

`singleResult()` selects the filter wavelength for its `after` description whenever the source is white, without checking whether the filter is inserted. `renderSingle()` displays that description in the Light After readout.

- Reproduction: select white light, leave the filter off, and retain the default green filter setting (530 nm).
- Verified function result: `before = white (many wavelengths)`, `after = green`, `perceived = white`, transmission = 100%, and output RGB = white.
- Impact: the textual observation contradicts the visual beam and perceived-color readout during the baseline filter comparison.
- Fix: when the filter is off, report the unchanged source description; apply the filter-color description only when a filter is inserted.
- Source: `light-color-and-vision-lab/index.html:257` and `:258`. The assessment template contains the same implementation.

### 4. P2 — Timekeeping supplies the answer to its Lorentz-factor calculation

Question 3 awards two points for calculating the Lorentz factor at 0.998c, accepting 15.2–16.4. The student-facing cosmic-ray muon evidence card explicitly displays gamma approximately 15.8 for that same speed.

- Reproduction: read the muon card and copy 15.8 into Question 3.
- Impact: the calculation can be answered by copying a result rather than applying the Lorentz-factor relationship.
- Fix: retain the speed, rest lifetime, and qualitative experimental evidence, but defer the calculated factor and directly derived worked values until after the calculation is assessed.
- Source: `honors-relativity-timekeeping-lab/index.html:513`; `honors_relativity_buzz_questions.txt`, Question 3. Also present in its template and preview.

### 5. P2 — Timekeeping rubric excludes valid same-altitude fast/slow trials

Question 7 asks students to choose any fast and slow trial from their table. However, the full-credit rubric specifically requires a high-altitude, low-speed fast clock and a low-altitude, high-speed slow clock. The lab also offers eastbound and westbound jet presets at the same altitude; both are valid evidence under the prompt and satisfy the fast/slow gate.

- Reproduction: use the jet presets at 11 km as the fast/slow pair, with two other trials to meet the four-trial gate.
- Verified using the actual `rates()` function: eastbound at 715 m/s gives **−0.03813 microseconds/day** net; westbound at 215 m/s gives **+0.18538 microseconds/day** net. Both have the same GR contribution, **+0.10367 microseconds/day**. Speed relative to the rotating ground, rather than a change in altitude, explains the sign difference.
- Impact: a scientifically correct response permitted by the prompt conflicts with the full-credit requirements and risks an incorrect grading outcome. The same restriction appears in BusyBee metadata.
- Fix: accept any valid recorded fast/slow pair and grade the signed GR/SR comparison that explains it, or explicitly restrict the requested pair to circular-orbit trials.
- Source: `honors-relativity-timekeeping-lab/index.html:621`, `:645`, `:939`; `honors_relativity_buzz_questions.txt`, Question 7; `honors_relativity-busybee-rubric-metadata.json:63`.

## Coverage and passing checks

| Application | Questions | Result of review |
| --- | ---: | --- |
| Resonance Tube | 10 | No additional high-confidence issue found; enumerated every recordable 0.1 cm setting for all 12 trials against the resonance function. |
| Perfect Instrument | 8 | No additional high-confidence issue found in challenge controls, frequency model, progression, and numeric keys. |
| Thin Lens | 8 | No additional high-confidence issue found in focus/recording gates, lens calculations, and numeric keys. |
| Light, Color, Vision | 8 | Finding 3; filter transmission keys agree with the model. |
| Spectral Shift | 8 | Finding 1; fixed shifts and velocity key agree with the implemented approximation. |
| Honors Timekeeping | 8 | Findings 4–5. |
| GPS Relativity | 9 | Finding 2. |

- `node unit-ApplicationFiles/unit-5/validate-unit5-buzz-assessments.js` passes for all seven applications: question and slot counts, 10 automatic + 5 BusyBee points, rubric metadata, source/template equality, required setup content, and launcher links.
- All 21 inline scripts across the seven source/template/preview sets compile.
- Enumerated resonance recordings give first-harmonic values inside the graded ranges and exact-data average-speed extremes of approximately 342.312–344.058 m/s, within the accepted 340–346 m/s range.
- Color Vision's active-filter checks return 28% for filtered white light and 100% for a matched 530 nm monochromatic source/filter.
- The validator's fixed-number arithmetic is not an execution test of every application: for example, its frequency-offset check compares a constant with itself. Passing it does not establish correct interaction or calibration behavior.

## Limits

This audit used source inspection, the existing validator, script compilation, and targeted execution of application functions with DOM/canvas-independent stubs. No browser interaction/layout review, screen-reader test, live Buzz import, or LMS scoring/persistence test was performed. Keyboard findings are based on the source's controls and event handlers. The reported grading risk is a conflict in the written rubric, not an observed BusyBee grading decision.
