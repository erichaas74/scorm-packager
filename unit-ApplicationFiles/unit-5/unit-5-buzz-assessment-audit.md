# Unit 5 application audit and Buzz assessment conversion

## Assessment standard

All seven Unit 5 application labs now use the same measurable grading structure:

- 15 points total
- 10 points from native auto-graded multiple-choice, matching, and numeric questions
- 5 points from the final two BusyBee evidence responses (2 + 3)
- no grade points depend on downloading or uploading a file
- question order is fixed because each `<a:question>` slot has an activity-specific label
- the interactive model and on-screen tables supply evidence; native Buzz questions supply the score
- clipboard, keyboard shortcuts, text selection, and the context menu remain available

## Deep-dive findings and changes

All lab-specific sources and support artifacts now live together in seven application folders.
The Unit 5 root retains only the launcher, shared instructions, build and validation scripts,
this audit, and the README. Applications do not have Rise ZIPs; those packages are reserved
for problem walkthroughs. The former application ZIPs, Rise-only directions, and ZIP builder
were removed.
Each generated `_buzz_setup.txt` now begins with an engaging student mission, learning goals,
and completion instructions before the teacher-facing Buzz setup and preview checks. Legacy
HTML setup guides are removed automatically by the Unit 5 assessment builder.
The unreferenced legacy `GPS Relativity Calibrator.html` and superseded
`unit-5-buzz-conversion-plan.md` were removed; both remain recoverable from Git history.

| Application | Main issue found | Measurable evidence retained | Buzz assessment change |
| --- | --- | --- | --- |
| Resonance Tube | The earlier draft awarded upload points and exposed calculation help in the graded view. | Twelve resonance lengths, verified speeds, average, and percent difference. | Ten questions on fixed peak positions, odd harmonics, frequency-length evidence, and medium-dependent speed. |
| Perfect Instrument | Twenty-four tutorial checks and worked feedback revealed the same boundary-condition ideas later graded. Two challenges admitted multiple legitimate builds. | Seven completed string/open/stopped resonator builds. | Removed tutorial scoring, locked the two ambiguous pipe challenges to their fundamental, and added eight native questions. |
| Thin Lens | Essays appeared before the final application calculations, and the evidence image carried score weight. | Four lens observations, three verified calculation rows, real/virtual screen evidence. | Reordered six auto items before two evidence essays and made downloads optional. |
| Light, Color, Vision | A 29-response browser-only notebook was inaccessible to teachers; three essays plus upload points made grading uneven. | Eighteen trials across filters, RGB combinations, secondary colors, and color matching. | Replaced the shortest filter essay with a fixed absorption concept check; kept two data-rich final responses. |
| Spectral Shift | The model displayed the derived redshift value and the draft spent three points on an upload. | Element fingerprints, rest wavelengths, and three measured wavelength shifts. | Hid z, retained measured shift, added a spectral-fingerprint concept item, and rebalanced to 10 + 5. |
| Honors Timekeeping | The app mixed built-in analysis, a displayed uncorrected GPS error, and upload points. | Student-selected fast/slow trials, GR/SR/net readouts, cancellation graph, evidence cards. | Removed answer-leaking readouts and internal responses; added eight native calculation, concept, and evidence questions. |
| GPS Relativity | Four short report sections duplicated ideas and left only six auto-graded points. | Timing limit, separate GR/SR rates, net drift, frequency correction, corrected/uncorrected mission results. | Consolidated the report into two stronger evidence responses and added a GPS positioning concept check. |

## Fixed checks used for grading

- Resonance: first-harmonic lengths are about 4.19 cm at 2048 Hz, 8.37 cm at 1024 Hz, and 16.75 cm at 512 Hz; the third-to-first length ratio is 3.
- Instrument: 0.468 m string, 0.520 m open pipe at 20 °C, 0.390 m stopped pipe, and 0.533 m open pipe at 35 °C.
- Thin lens: the fixed 15.0 cm lens gives q = 60.0 cm and m = -3 at p = 20.0 cm; the application gives q ≈ 1.01 m and f ≈ 0.841 m.
- Color vision: white light through a filter reads 28%; a matched 530 nm source/filter reads 100%.
- Spectral shift: tracked-line shifts are about +78.8 nm, -58.0 nm, and 0.0 nm; Object A speed is about 36 000 km/s.
- Timekeeping: cancellation occurs near 1.5 Earth radii; 38.6 microseconds/day produces about 11.57 km/day error; gamma at 0.998c is about 15.82.
- GPS: 10 m corresponds to about 33.36 ns; GR is +45.71, SR is -7.11, net is +38.60 microseconds/day, and the oscillator offset is 4.570 mHz.

## Model boundaries

- Resonance and instrument activities use ideal standing-wave boundary conditions and the stated classroom sound-speed model.
- The lens activity uses an ideal thin converging lens with a fixed 15.0 cm focal length.
- The color activity is a simplified wavelength/filter/cone-response model, not a complete colorimetry system.
- Spectral velocities use the low-redshift approximation `v = zc` and grade the radial component only.
- Relativity activities use weak-field and low-speed approximations appropriate to Earth orbit; they are not full general-relativistic orbit solvers.
- The two relativity applications overlap. Assign one route unless comparison is intentional.

## Publishing checks

Run after any question, template, or rubric change:

```text
node unit-ApplicationFiles/unit-5/build-unit5-buzz-assessments.js
node unit-buzz-template-conversion-files/build-buzz-template-previews.js unit-ApplicationFiles/unit-5
node unit-ApplicationFiles/unit-5/validate-unit5-buzz-assessments.js
```

The validator checks counts, the 10 + 5 split, final BusyBee order, explicit numeric ranges,
slot order, self-containment, accessibility blockers, JavaScript compilation, rubric metadata,
fixed model values, and launcher links. Live Buzz still needs a student-preview check to confirm
the domain preserves embedded scripts and optional downloads.
