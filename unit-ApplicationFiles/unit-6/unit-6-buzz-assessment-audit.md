# Unit 6 application audit and Buzz assessment conversion

## Assessment standard

All six Unit 6 application labs now use the same measurable grading structure:

- 15 points total
- 10 points from native auto-graded multiple-choice and numeric questions
- 5 points from the final two BusyBee rubric-graded evidence responses (2 + 3)
- no grade points depend on downloading or uploading a file
- question order is fixed because each `<a:question>` slot has a lesson-specific label
- simulation progress supplies evidence; native Buzz questions supply the score

## Deep-dive findings and changes

All application-specific sources and Buzz artifacts now live inside six lesson folders.
The Unit 6 root contains only the launcher, shared instructions, current builder and validator,
and this audit. The two manually created Lesson 2 and Lesson 4 folders were verified as exact
moves before their path consumers were updated.

Application Rise ZIPs, Rise-only directions, SCORM manifests and wrappers, two obsolete ZIP
builders, and redundant packaged `index.html` copies were removed. Applications remain native
Buzz templates and previews; ZIP packaging is reserved for problem walkthroughs.

The Unit 6 builder generates six `_buzz_setup.txt` guides. Each begins with an engaging student
mission, learning goals, and completion instructions before teacher Buzz setup and preview checks.
Legacy setup HTML files are removed automatically.

| Lesson | Main issue found | Measurable evidence retained | Buzz assessment change |
| --- | --- | --- | --- |
| 1 - Millikan Oil Drop | The SCORM version required six internal written responses and reported a completion percentage instead of a native assessment score. | Six balance voltages, relative `q/e`, and estimated charge values. | Added 10 native questions: force balance, calculations, inverse reasoning, three-row analysis, and a quantization CER. |
| 2 - Electric-Field Motion | The 10-point draft spent 2 points on a file upload and had only two auto-graded concepts. | Three recorded successful paths and the source-charge arrangements. | Expanded to 8 questions with 10 auto points in field direction, `F=qE`, vectors, and curved-path reasoning plus 5 BusyBee points. |
| 3 - Circuit Design | The Rise/SCORM-style app contained 27 internal notebook responses, which was too long and was not natively gradeable in Buzz. | Mission readings for voltage, current, resistance, topology, failure tests, and switch tests. | Added a self-contained 10-question template using the fixed 9 V, 10 ohm bulb model and a final reliability CER. |
| 4 - Electromagnet Design | The draft totaled 16 points, awarded 3 points for an upload, and blocked copy/paste and the context menu. | Five fixed controlled-variable trials and one constrained optimization trial. | Rebalanced to 10 auto + 5 BusyBee points, made evidence download optional, and removed the accessibility-blocking guard. |
| 5 - Generator Design | The Rise-style lab required 16 evidence records and 24 internal responses but did not expose a concise native Buzz score. | Controlled series for speed, magnet strength, loops, area, detector behavior, and final output. | Added a self-contained 10-question template with fixed peak-EMF checks, Faraday-law concepts, two-series analysis, and a design CER. |
| Honors - Electric Motor | The SCORM app mixed completion scoring with nine internal analysis responses. | Baseline and optimized designs, systematic trials, resource budget, current, RPM, torque, power, and task result. | Added a self-contained 10-question template measuring motor physics, winding resistance, controlled-variable design, and baseline-to-optimized reasoning. |

## Fixed numerical checks used for grading

- Millikan: `q/e = 200 V / balance voltage`; 100 V gives 2, 50 V gives 4, and `3e = 4.806 x 10^-19 C`.
- Circuit: one 10 ohm bulb at 9 V gives 0.90 A; two in series give 0.45 A and 4.5 V per bulb; two in parallel draw 1.80 A total.
- Electric field: `2.0 x 10^-6 C` in `3000 N/C` gives `0.0060 N`; perpendicular components 3 and 4 give a magnitude of 5.
- Electromagnet fixed trials: 0.50 A, 0.27 A, 4 clips, 85 clips, and 54 clips.
- Generator: 100% flow / 60% magnet / 2 loops / 70% area gives about 3.17 V peak; all maximum settings give about 11.99 V peak.
- Motor: the default 30-turn, 2.0 cm coil has `R = 1.71 ohms` in the scaled winding model.

## Model boundaries teachers should preserve

- The Millikan activity is a scaled pattern model. It holds drop weight constant and omits measured drop radius, drag, density, terminal speed, and plate spacing.
- The circuit activity uses ideal identical 10 ohm bulbs and an ideal voltage source; it is intended for comparative series/parallel reasoning.
- The electromagnet's paperclip result is a classroom strength index, not a manufacturer prediction.
- The generator preserves Faraday-law trends and a simplified electrical-load drag effect; it is not a utility generator model.
- The honors motor is explicitly a scaled comparison model with resource, heat, friction, load, and back-EMF approximations.

## Publishing checks

Run these commands after any model, question, or template change:

```text
node unit-ApplicationFiles/unit-6/build-unit6-buzz-assessments.js
node unit-buzz-template-conversion-files/build-buzz-template-previews.js unit-ApplicationFiles/unit-6
node unit-ApplicationFiles/unit-6/validate-unit6-buzz-assessments.js
```

The validator checks question counts, the 10 + 5 score split, final BusyBee metadata, question slots,
self-contained templates, JavaScript compilation, generated TXT setup structure, fixed physics values,
launcher links, and the absence of application ZIP/SCORM artifacts.
