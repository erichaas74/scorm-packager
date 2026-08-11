# Unit 5 Application — Buzz Assessment Conversion Plan

Drafted 2026-08-10. **Executed 2026-08-10 — all six applications converted.**
Companion to `unit-buzz-template-conversion-files/buzz-conversion-guide.md` (the playbook)
and to the finished Unit 6 examples (`unit-ApplicationFiles/unit-6/`).

> **Decision taken:** no practice/assessment split. The teaching feedback was removed from
> every lab rather than preserved in a second build. Design the Perfect Instrument, Spectral
> Shift, and Honors Relativity each lost their built-in question sets and worked feedback;
> there is one artifact per application, and it is the Buzz assessment template.
>
> **Delivered:** 55 questions / 96 points across six assessments, matching the blueprints in
> section 5. Per-lab records of exactly what was removed live in each
> `*-format-suggestions.txt`. Section 11 below records what changed during execution.

---

## 1. Scope — what Unit 5 actually contains

Six applications ship from `unit-ApplicationFiles/unit-5/index.html`:

| # | Application | Source file | Size | Lesson fit | Data engine quality |
| --- | --- | --- | --- | --- | --- |
| 1 | Thin Lens Investigation | `thin_lens_refraction_investigation.html` | 864 lines / 63 KB | L3 optics | Strong — 4 trials + 3 verified calc rows |
| 2 | Sound Waves: Resonance Tube Lab | `sound_waves_lab_simulation.html` | 2166 lines / 95 KB | L2 sound | **Strongest** — 12 measured lengths + 36 validated calculations |
| 3 | Design the Perfect Instrument | `design-the-perfect-instrument/index.html` | 1212 lines / 52 KB | L2 resonance | Moderate — 7 tuning challenges, data not tabulated |
| 4 | Spectral Shift Investigation | `doppler-spectral-line-shift/index.html` | 1068 lines / 40 KB | L2–L3 Doppler | Moderate — 3 cases, one Δλ measurement each |
| 5 | Light, Color, and Vision Lab | `light-color-and-vision-lab/index.html` | 286 lines / 61 KB | L3 EM/light | Strong — 18 evidence trials in 4 tables |
| 6 | Honors Relativity Timekeeping Lab | `honors-relativity-timekeeping-lab/index.html` | 1363 lines / 60 KB | Honors | Strong — student-chosen trials + graph + unlock gate |

Not an application, leave alone: `GPS Relativity Calibrator.html` is a small Rise walkthrough
demo widget (191 lines), not on the applications index.

All six are already dependency-free (no CDN, no web fonts, no external images — the only
`http://` strings are SVG namespace URIs). **Rule 11 of the guide is already satisfied
everywhere.** All six are comfortably under any plausible Buzz size limit, so the hosted-iframe
size fallback is not needed for any of them.

---

## 2. What "a proper Buzz assessment lab" requires

Condensed from guide §3, §8, §9 into a per-lab checklist:

**Template file**
1. Self-contained: HTML + CSS + JS + `<a:question></a:question>` slots in one file.
2. Unique lesson-specific filename and a unique visible page title.
3. Slots equal question count, in display order, placed in context (chart cell / section).
4. No solving help: no formulas, no directions cards, no hints, no conclusions.
5. **No readout showing a value the questions ask the student to calculate.**
6. No answer-reveal, no internal scoring panel, no internal instant feedback.
7. Evidence panel with a **Download Evidence Image** button (gated on required work).
8. **No "Copy values for Buzz" button** — the integrity guard blocks paste, so it is dead
   weight (see `project_buzz-copy-button-vs-integrity-guard`; Unit 6 precedent).
9. `buzz-assessment-integrity-guard` script before `</body>` (capture-phase block of
   copy/cut/paste/contextmenu + Ctrl/Cmd+C/X/V).
10. Closing line telling students to answer the Buzz questions below the lab.

**Question file** — pure Buzz text, `Type:` first, integer scores, explicit `lower..upper`
tolerance on every `F, Number`, bare auto-graded items (no `Meta-`, no feedback).

**Supporting files** — setup HTML with the answer key + randomization warning, format-suggestions
notes, generated preview, registration in the preview builder.

**Buzz settings** — randomize/shuffle **OFF**, one-question-per-page **OFF**, title
`Unit 5 Lesson #: <Activity Title>`.

---

## 3. Current-state gap matrix

| Requirement | Thin Lens | Sound | Instrument | Doppler | Light/Color | Honors Rel |
| --- | --- | --- | --- | --- | --- | --- |
| `<a:question>` slots | ✅ 9 | ❌ | ❌ | ❌ | ❌ | ❌ |
| Integrity guard | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Evidence PNG download | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `*_buzz_questions.txt` | ✅ 9 q / 15 pts | ❌ | ❌ | ❌ | ❌ | ❌ |
| `*_buzz_setup.html` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `*-format-suggestions.txt` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Generated `_preview.html` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Registered in preview builder | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Copy-button to remove | ⚠️ `tl-copy-data` | — | — | — | — | — |
| Internal questions to strip | none | none | ⚠️ 24 MC | ⚠️ ~9 MC | ⚠️ 29 written | ⚠️ 8 MC/numeric |
| Solving help to remove | clean | ⚠️ formula cards | ⚠️ per-question feedback | ⚠️ `z = Δλ/λ₀` readout | ⚠️ per-part directions | ⚠️ formula subtitles |
| Student work escapes the browser | ✅ | ❌ localStorage only | ❌ postMessage only | ❌ nothing | ❌ localStorage only | ❌ nothing |

---

## 4. The central problem

**Four of six labs already own their own assessment.** Design the Perfect Instrument runs 24
built-in multiple-choice items with instant explanatory feedback and posts `{type:"complete"}` to
the parent frame. Doppler runs three cases the same way. Honors Relativity has eight questions
with two attempts each and a percentage score. Light/Color stores 29 written responses and 18
evidence trials in `localStorage` behind a Submit button that reaches nothing.

That is the exact inverse of a Buzz assessment:

- **Buzz cannot see any of it.** No score, no response text, no evidence leaves the browser.
  A cleared cache erases a student's entire lab.
- **The built-in feedback leaks the answer** to any Buzz question written on the same physics.
  Every `feedback:` string in these labs is a fully worked explanation delivered *before* the
  graded question would be asked.
- **The one lab with real per-student data (Sound) has no export at all** — 12 measured lengths
  and 36 validated calculations that no teacher can ever see.

So the rework is not "add some questions." It is: **move ownership of assessment out of the lab
and into Buzz, and add the evidence pipeline that makes student-generated data gradeable.**

---

## 5. Grading design per lab

Applying the guide's §11 decision table. The recurring judgment: measured/chosen values get an
**in-lab validation gate + evidence upload**, never a plain fixed-answer numeric; derived values
that converge across students *can* be numerics with wide tolerance.

### 5.1 Sound Waves: Resonance Tube Lab — *the flagship conversion*

**What the student generates.** Twelve resonance lengths (4 forks × harmonics n = 1, 3, 5), then
36 calculations (L in m, λ = 4L/n, v = fλ), then an average speed and a percent difference.

**Why this is already a model of student-generated data.** `getCalculationResult()` validates each
row against **that student's own measured L** (±0.0012 m, ±0.006 m, ±2 m/s), and `getFinalResult()`
validates the average against their own 12 speeds. This is precisely the guide's "Reaction Time
model" validation gate — it is the correct design and must be preserved.

**Which values are student-specific and which converge.** Peaks sit at L = n·343/(4f); the record
threshold accepts |δ| ≤ γ/3 with γ = clamp(L_target/80, 0.22, 1.25), on a 0.1 cm grid:

| Fork | n=1 target | window | n=3 target | window | n=5 target | window |
| --- | --- | --- | --- | --- | --- | --- |
| 256 Hz | 33.50 cm | ±0.14 | 100.49 cm | ±0.42 | 167.48 cm | ±0.42 |
| 512 Hz | 16.75 cm | ±0.07 | 50.24 cm | ±0.21 | 83.74 cm | ±0.35 |
| 1024 Hz | 8.37 cm | ±0.07 | 25.12 cm | ±0.10 | 41.87 cm | ±0.17 |
| 2048 Hz | 4.19 cm | ±0.07 | 12.56 cm | ±0.07 | 20.94 cm | ±0.09 |

High-frequency short columns are effectively single-valued (one grid point records); the 256 Hz
long columns admit up to nine distinct lengths. Consequence: **short-column lengths are safe as
fixed numerics; long-column lengths are not.** Derived speeds land 341.7–344.4 m/s per trial, so
the 12-trial average is safely gradeable.

**Lab-side work.** Add evidence PNG export (12-row table + final result + percent difference);
add ordered question slots; strip the two `formula-step` cards (λ = 4L/n, v = fλ) and the
formula text in the table headers — that conversion *is* the graded skill; add the integrity
guard; gate the PNG on 12/12 recorded and 12/12 verified.

**Buzz blueprint — 11 questions / 18 points**

| # | Type | Pts | Content | Key |
| --- | --- | --- | --- | --- |
| 1 | UP | 3 | Evidence PNG of the completed 12-trial table | legible, all 12 rows verified |
| 2 | F, Number | 1 | Fork D (2048 Hz), n = 1 measured length | `4.1..4.3` cm |
| 3 | F, Number | 1 | Fork C (1024 Hz), n = 1 measured length | `8.3..8.5` cm |
| 4 | F, Number | 1 | Fork B (512 Hz), n = 1 measured length | `16.6..16.9` cm |
| 5 | F, Number | 1 | Fork A: L(n=3) ÷ L(n=1) | `2.9..3.1` |
| 6 | F, Number | 2 | Average of your 12 calculated speeds | `340..346` m/s |
| 7 | F, Number | 1 | Percent difference from 343 m/s | `0..1.5` % |
| 8 | MC | 1 | Why only odd harmonics fit this pipe | node at water / antinode at top |
| 9 | MC | 1 | Relationship between fork frequency and 1st-harmonic length | inverse |
| 10 | E | 3 | Use your own three lengths for one fork as evidence that L scales as odd multiples | style A |
| 11 | E | 3 | Why v came out near 343 for *every* fork, and what caused your percent difference | style A |

**Do not** write fixed numerics for the row λ and v values — the lab already validates those
against the student's own L, and re-grading them in Buzz breaks the student-dependent rule.

### 5.2 Thin Lens Investigation — *finish the last 15%*

Already a working template: 9 ordered slots, evidence PNG, fixed unknown lens f = 15.0 cm,
9 questions / 15 points, complete answer key in `thin_lens_refraction_buzz_setup.html`.

**Remaining work only:**
1. Remove the `tl-copy-data` "Copy values for Buzz" button (integrity-guard conflict).
2. Add the `buzz-assessment-integrity-guard` script.
3. Add `thin_lens_refraction-format-suggestions.txt`.
4. Register in the preview builder and generate `thin_lens_refraction_investigation_preview.html`.
5. Confirm the slot count is 9 (currently 9 `<a:question />` markers + 1 unrelated
   `getElementsByTagName('a:question')` guard at line 417 — the builder's count check will
   confirm).

Fixed reference values already established: (p, q, h_i) = (60, 20, −6.7), (30, 30, −20.0),
(20, 60, −60.0); p = 10.0 cm gives no screen image; 1/p + 1/q ≈ 0.0667 cm⁻¹; f ≈ 15.0 cm.

### 5.3 Light, Color, and Vision Lab — *curate 29 → 9*

**What the student generates.** 18 evidence trials across four tables (filters, RGB on/off,
secondary colors, color-matching challenges) plus 29 free-text responses.

**The problem.** 29 written responses is not a Buzz assessment; it is a worksheet with no grader.
And the color-matching challenge (orange / purple / gray / white) produces per-student slider
values — exactly the case that must never be a fixed numeric.

**Lab-side work.** Keep all four evidence tables and the 18 trials. **Delete the 29-question
notebook and the Submit card entirely** — those become Buzz questions. Keep the per-part
directions (they are procedure, not solving help) but move the physics explanations out. Add
evidence PNG covering all four tables, gated on 18/18. Add slots, guard.

**Buzz blueprint — 9 questions / 18 points**

| # | Type | Pts | Content |
| --- | --- | --- | --- |
| 1 | UP | 3 | Evidence PNG showing all four completed tables |
| 2 | MT | 3 | Match R+G, R+B, G+B → yellow, magenta, cyan (`Score: Partial`) |
| 3 | MC | 1 | What a colored filter does to white light (subtractive) |
| 4 | MC | 1 | Is white light a single wavelength |
| 5 | F, Number | 1 | Transmission % for a filter matched to the bulb wavelength — **verify the sim's transmission model before writing the tolerance** |
| 6 | E | 2 | Evidence from your filter table that filters are subtractive |
| 7 | E | 3 | Your gray vs. white match: same perceived color from different combinations (metamerism) — cite your own recorded slider values |
| 8 | E | 2 | Evaluate the claim "a red filter turns white light red by adding red light" |
| 9 | E | 3 | How the light reaching the eye determines perceived color (synthesis) |

Q5 is the one item that needs verification against the sim before it can be written; if the
transmission model turns out to be continuous/interpolated, drop Q5 and move its point to Q6.

### 5.4 Spectral Shift Investigation (Doppler) — *hide the answer, then grade it*

**What the student generates.** One measured Δλ per case by dragging rest markers onto the
observed lines. Cases are fixed: A = hydrogen, z = +0.12 (receding); B = calcium, z = −0.09
(approaching); C = helium, z = 0.

**The blocker.** Line 627–630 renders `Δλ = … nm · λ₀ = … nm · z = Δλ/λ₀ = …`. The lab displays
the very quantity a Buzz question would ask for. **Rule 6 violation — the z term and the λ₀
label must be removed from the readout**, leaving only the measured Δλ. Also strip the nine
built-in choice-feedback strings.

**Lab-side work.** Trim the readout to Δλ only; strip built-in questions and feedback; add a
three-row case table that persists each measured Δλ; add evidence PNG; add slots and guard.

**Buzz blueprint — 8 questions / 14 points**

| # | Type | Pts | Content |
| --- | --- | --- | --- |
| 1 | UP | 2 | Evidence PNG of all three aligned cases |
| 2–4 | F, Number | 1 each | Measured Δλ for Case A / B / C | compute from the sim λ₀ list; Case C needs an explicit zero range |
| 5 | MC | 1 | Classify Case A vs Case B | redshift → receding; blueshift → approaching |
| 6 | F, Number | 2 | Recession speed of Object A from z = Δλ/λ₀ and v = zc | `3.4e7..3.8e7` m/s |
| 7 | E | 3 | Why the *pattern* identifies the element while the *position* gives the motion | style A |
| 8 | E | 3 | Case C shows no shift — what that does and does not tell you | style A; radial vs transverse |

Pre-work required: extract λ₀ for the graded hydrogen/calcium lines from the sim's reference data
before Q2–Q4 and Q6 tolerances can be written.

### 5.5 Design the Perfect Instrument — *strip the tutorial, keep the tuning*

**What the student generates.** For each of seven challenges, the L / T / n they set to land the
target note inside the tolerance band (tol 15–30 Hz).

**The decision to make.** This lab is currently a *teaching walkthrough*: 24 MC items with worked
feedback, delivered before each build. Converting it to a graded template destroys that teaching.
**Recommendation: ship both**, the way U1L4 did — keep the current build as the Rise/SCORM
practice activity, and produce a separate stripped assessment template. The two files share the
simulation code; only the question layer differs.

**Lab-side work (assessment copy).** Remove all `pre`/`q`/`post` question objects and feedback;
keep the seven challenge targets and the tuner; add a challenge results table recording the
student's final L, T, n, and achieved frequency per challenge; add evidence PNG gated on all
seven cleared; add slots and guard.

**Verified physics constants:** v_string = √(T/μ) with μ = 0.001 kg/m; v_sound = 331 + 0.6·T_°C
(343 m/s at 20 °C, 352 m/s at 35 °C).

**Buzz blueprint — 9 questions / 15 points**

| # | Type | Pts | Content | Key |
| --- | --- | --- | --- | --- |
| 1 | UP | 3 | Evidence PNG of all seven cleared challenges | — |
| 2 | F, Number | 1 | Capo position for middle C (v = 245 m/s) | `0.46..0.48` m |
| 3 | F, Number | 1 | Open-pipe length for E4 at 20 °C | `0.51..0.53` m |
| 4 | F, Number | 1 | Stopped-pipe length for A3 | `0.38..0.40` m |
| 5 | F, Number | 2 | Open-pipe length for E4 after the room warms to 35 °C | `0.525..0.542` m |
| 6 | MC | 1 | Why A4 is impossible on that stopped pipe | odd harmonics only; next mode is 660 Hz |
| 7 | MC | 1 | Three strings, same λ = 1.60 m, different pitch | v = √(T/μ) differs → f = v/λ |
| 8 | E | 2 | Node/antinode boundary conditions across your three builds | style A |
| 9 | E | 3 | Why the pipe had to get *longer* when the room warmed | style A; cite both lengths |

### 5.6 Honors Relativity Timekeeping Lab — *strip questions, keep the instrument*

**What the student generates.** Four or more self-chosen trials (altitude + speed) with GR, SR,
net drift, and position error, plus plotted points on the drift-vs-radius graph. The lab already
gates the analysis section on "4 trials including one fast clock and one slow clock" — a good
existing validation gate; keep it and move it to gate the evidence PNG instead.

**Rule 6 judgment call.** The GR / SR / net readouts are the lab's *measuring instrument*, not a
leaked answer — the same role a meter plays in Unit 6. Keep them visible, but then **do not write
Buzz numerics on GR, SR, or net drift**. Grade only quantities the readouts do not show:
zero-crossing radius (read off the graph), position error (drift × c), and the Lorentz factor.
Do remove the formula subtitles under each readout (`GM/c²(1/Rₑ − 1/r)`, `(v²_ground − v²)/2c²`)
— those are solving help.

**Lab-side work.** Strip the 8 built-in questions, the two-attempt logic, and the percentage
score summary; strip the 5-step walkthrough overlay; keep presets, sliders, snap-to-orbit, table,
graph, and the six evidence cards (they are source material for Q6–Q7, not answers). Add evidence
PNG covering table + graph. Add slots and guard.

**Buzz blueprint — 9 questions / 16 points**

| # | Type | Pts | Content | Key |
| --- | --- | --- | --- | --- |
| 1 | UP | 3 | Evidence PNG: ≥4 trials incl. one fast and one slow clock, plus the graph | — |
| 2 | F, Number | 2 | Orbital radius where the effects cancel, in Earth radii | `1.42..1.58` |
| 3 | F, Number | 2 | Uncorrected GPS position error after one day | `10.4..12.8` km/day |
| 4 | F, Number | 2 | Lorentz factor at v = 0.998c | `15.2..16.4` |
| 5 | MC | 1 | GPS satellite: which effect wins | gravity; clock runs fast |
| 6 | MC | 1 | ISS: which effect wins | motion; clock runs slow |
| 7 | MC | 1 | Hafele–Keating east/west sign flip | Earth-centered frame speed |
| 8 | E | 2 | Your fast-clock trial vs your slow-clock trial | style A; cite altitude, speed, GR, SR, net for both |
| 9 | E | 2 | An evidence card as independent confirmation | style A |

---

## 6. Cross-cutting work (applies to all six)

1. **Integrity guard** — paste the standard `buzz-assessment-integrity-guard` block before
   `</body>` in every template. Copy verbatim from
   `unit-ApplicationFiles/unit-6/electromagnet_lab.html` (lines 1172–1178).
2. **No clipboard buttons** — remove `tl-copy-data` from Thin Lens; do not add one anywhere else.
   Values are read on screen and typed.
3. **Evidence PNG** — five labs need one built (Thin Lens has a working `canvas.toDataURL`
   implementation at lines 758–818 that is the reference implementation to copy).
4. **Unique titles** — every template gets a distinct visible `<h1>` and `<title>` so a
   wrong-template upload is caught in preview.
5. **Preview builder** — add all six as entries in
   `unit-buzz-template-conversion-files/build-buzz-template-previews.js` (Unit 6 already has two
   entries there at lines 120 and 126; Unit 5 has none). Run from the repo root and require an
   `ok:` line, not `check:`, before any upload.
6. **Rise ZIPs** — four labs ship as `.zip` from the applications index; rebuild each after the
   template edits, and decide per lab whether the ZIP carries the *practice* build or the
   *assessment* build (see §5.5 — for Instrument and Doppler it should be the practice build).
7. **`unit-5/README.txt` is stale** — it describes a PhET-based question-bank plan
   ("20 points total per lesson", PhET sim suggestions) that none of the six current
   applications follow. Rewrite or delete it as part of this work.

---

## 7. File deliverables per lab

Following the current Unit 6 flat naming (which Thin Lens already uses), not the older
`u#l#-<slug>-buzz-assessment-template.html` folder convention:

```
<slug>.html                       template: sim + slots + guard + evidence panel
<slug>_buzz_questions.txt         pure Buzz text, paste-whole
<slug>_buzz_setup.html            teacher setup + answer key + preview checklist
<slug>-format-suggestions.txt     conversion notes, deviations, remaining publish checks
<slug>_preview.html               GENERATED — never hand-edit
build-<slug>-buzz.js              only if a SCORM/Rise zip is also shipped
```

Totals if the whole plan lands: **55 questions / 96 points across six assessments.**

---

## 8. Verify workflow

```sh
node unit-buzz-template-conversion-files/build-buzz-template-previews.js
```

Then per lab, in Buzz preview as a student:

- Sim draws and runs (script not stripped).
- Every slot lands in its intended section — if not, randomization is still on.
- Every numeric key grades correct when the answer-key value is entered.
- Evidence PNG downloads, and is gated until the required work is complete.
- Essay boxes and the upload control render; upload accepts PNG.
- Page title names *this* lab.
- Copy/paste is blocked inside the Buzz question controls, not just the lab body.

---

## 9. Recommended sequence

1. **Thin Lens** — 5 small tasks, closes a lab to done and establishes the Unit 5 file set.
2. **Sound Waves** — highest value; best student-generated data in the unit; the evidence-PNG
   work here is reusable by the other four.
3. **Light, Color, and Vision** — largest deletion (29 responses), clearest before/after.
4. **Honors Relativity** — strip questions, keep the instrument.
5. **Spectral Shift** — blocked until the λ₀ line list is extracted; do the extraction first.
6. **Design the Perfect Instrument** — last, because it needs the two-build practice/assessment
   split decided and both artifacts maintained.

---

## 10. Decisions — all resolved

1. **Practice/assessment split** — **Resolved: lose the teaching feedback.** One artifact per
   application. No second practice build is maintained.
2. **Sound Waves formula cards** — **Resolved: removed**, consistent with decision 1. The
   three-step formula banner, the formulas in the table headers, the percent-difference
   formula, and the `L = nλ/4 · n = 1, 3, 5` tag are all gone.
3. **Point totals** — **Resolved: kept the 14–18 per lab blueprints.** The old 20-per-lesson
   figure came from a stale PhET plan that no current application follows; `README.txt` was
   rewritten.
4. **Light/Color Q5** — **Resolved: kept, and doubled.** The transmission model turned out to be
   fully deterministic (white light → exactly 28%; matched monochromatic → 100%), so it
   supports two auto-graded numerics rather than one. Confirmed by driving the sim in a
   headless browser: the readout reports `28% transmitted`.

---

## 11. Execution record — what changed versus this plan

**Delivered as planned.** All six applications converted; 55 questions / 96 points; the file set
in §7 exists for every lab; all six are registered in the preview builder and report `ok` with
matching slot and question counts.

**Four substantive findings during execution:**

1. **Design the Perfect Instrument had ambiguous answer keys.** Challenges 4 and 5 left the
   harmonic slider live, and a second valid build exists inside the slider range — an open pipe
   at 1.039 m (n = 2) also produces E4, and a stopped pipe at 1.169 m (n = 3) also produces A3.
   Either clears the challenge, so a student using the higher mode would have been marked wrong
   on a legitimate build. Both are now locked to `enable:["L"]`. Every accepted length was then
   recomputed from the sim's own cents tolerance and verified single-valued.

2. **The Doppler keys had to come from the sim, not from z alone.** The readout tracks the
   *longest-wavelength line* of the matched element, so the rest wavelengths are 656.3 / 643.9 /
   667.8 nm and the shifts are +78.8 / −58.0 / 0.0 nm. Tolerances derive from the sim's own
   `ALIGN_TOLERANCE_Z = 0.008`, giving wider bands than the ±3% this plan guessed. Q6 asks for
   the speed in km/s rather than m/s so students are not typing scientific notation into a Buzz
   numeric field.

3. **The relativity evidence PNG deliberately omits the graph.** Q2 asks the student to read the
   zero crossing off the on-screen graph; baking the graph into a downloadable image would hand
   over the answer. The PNG carries the trial table only.

4. **Two answer leaks survived the first pass and were caught by a full-text audit** — the
   Sound lab's calculation-check feedback still printed `λ = 4L/n, and v = fλ`, and the
   Instrument lab's "No mode fits" confirmation read "Correct — no harmonic of this pipe reaches
   the target", which is the answer to its own Q6. Both are fixed. A repeat audit across all six
   templates now returns clean.

**Verification performed:**

- JS syntax parse of every `<script>` block in all six templates.
- Headless Chrome load of all six: no console errors, all expected IDs present.
- Interactive drive of the reworked control flow in five labs — confirmed the Doppler readout no
  longer prints z, the Instrument lab goes straight to tuning with no prediction question and
  records a build on match, the Relativity lab unlocks its PNG after four trials including a
  fast and a slow clock and no longer shows the error column, the Sound lab records a peak and
  advances its evidence gate, and the Light lab has zero notebook textareas and no submit button.
- Full-text audit of all six templates for leaked formulas and stated conclusions.
- All 27 links on `index.html` resolve.

**Known and accepted:** the relativity template retains a source-code comment documenting the
weak-field rate model. It is maintainer documentation, not rendered text, and the code beneath it
computes the same quantities — stripping it would make the physics model unmaintainable without
providing real protection, since view-source exposes every lab's answer logic regardless.

**Not yet done — requires the live Buzz domain:** every lab's `-format-suggestions.txt` lists its
publishing checks. The universal ones are turning randomization and one-question-per-page off,
confirming Buzz preserves the embedded scripts, and confirming the evidence PNG download is
permitted inside the Buzz viewport.
