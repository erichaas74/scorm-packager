# Buzz Lab Conversion Guide

Last updated: 2026-07-13

This is the single working playbook for converting unit lesson activities into the
self-contained embedded-template plus Buzz-native assessment format. It replaces and
consolidates these former files:

- `buzz-conversion-rules-and-busybee-notes.md` (conversion rules)
- `Buzz Assesment LLM Reference.txt` (Buzz text-editor syntax, verified against official
  Agilix Help Center articles on 2026-03-18)
- `buzz-question-feedback-template.txt` (copy-ready question patterns)
- `buzz-lab-conversion-summary.txt` (global conversion notes and per-lesson status)

Companion files that stay in this folder:

- `busybee-rubric-metadata-template.json` — copy into a lesson folder as
  `busybee-rubric-metadata.json` for every lesson with BusyBee-graded written questions.
- `build-buzz-template-previews.js` — regenerates every
  `buzz-assessment-template-preview.html` from the template + questions files.

---

## 1. Model lessons — copy these, not the old rules

Three finished lessons define the current standard. When in doubt, open these folders
and match what they do.

| Model lesson | Pattern it demonstrates |
| --- | --- |
| `unit-1/lesson-3` (Galileo Acceleration Lab) | Embedded lab + data-table validation + evidence image download + **BusyBee-graded essays** (Meta tags, `@[Always]` line, Full/Partial/No credit rubric) + File Upload evidence question. 7 questions, 12 points. |
| `unit-ApplicationFiles/unit-2/lesson-u2l3` (Circus Launch) | Two embedded simulators + **variable-driven numeric grading** (`Var:` + `eval(...)`) + fixed-range numeric trials + one MC + short "A strong answer" essays. 10 questions, 12 points. |
| `unit-ApplicationFiles/unit-3/lesson-4` (Collision Lab) | Five per-trial embedded simulators sharing one script + **worksheet-style charts with `<a:question>` slots inside chart cells** + bare chart-label numeric prompts + "A strong answer" essays. 14 questions, 18 points. |

Key style facts from the model lessons (these override the older rules):

- **Auto-graded questions are minimal.** u2l3 and u3l4 use **no `Meta-` tags and no
  feedback lines** on numeric/MC questions. Prompts are short; when a question sits in a
  chart cell, the prompt is just the chart label ("Total P Before ________ kg*m/s") and
  the surrounding template provides all context.
- **`Figures:` is optional.** u2l3 uses `Figures: 3`; u3l4 omits it entirely and relies
  on explicit tolerance ranges alone.
- **Essays use one of two grader-guide styles** (section 5), not one mandatory style.
- **Meta tags and rubric metadata JSON are for BusyBee-graded written questions only**
  (u1l3), not for every question.
- **Assessment templates contain no solving help.** u3l4 deliberately has no formulas,
  sign hints, directions cards, or conclusions. Teaching lives in the standalone
  practice sim or the lesson guide, never in the graded template.

---

## 2. Decide the delivery mode first

- **SCORM** when the activity itself owns the score and already reports completion or
  points (example: Unit 1 Lesson 1 Motion Graphs, 15 in-activity questions).
- **Buzz-native assessment** when Buzz should own each question score, written response,
  upload, and feedback. This is the default target for labs.
- **Self-contained Buzz template** is the default form: the lab HTML, CSS, JavaScript,
  and `<a:question></a:question>` slots all live inside the lesson's uniquely named
  template file (section 3). Buzz cannot open linked or hosted files from
  a template, so the simulation code must live in the template itself.
- **Hosted support tools** only when the activity cannot run inside a Buzz template
  (e.g., PhET, which is embedded by iframe with an external-launch fallback button).

---

## 3. Standard lesson file set

Every Buzz-native lesson folder uses the same files:

| File | Purpose |
| --- | --- |
| `buzz-assessment-questions.txt` | **Pure import-ready Buzz text only** — no header notes, no teacher prose. Must be paste-whole into the Buzz text editor / Edit all questions screen. |
| `u#l#-<slug>-buzz-assessment-template.html` | The self-contained layout uploaded as the Buzz assessment template (e.g., `u3l4-collision-lab-buzz-assessment-template.html`). |
| `u#l#-<slug>-buzz-assessment-template-preview.html` | Generated local preview showing where each question lands (section 10). Never hand-edit. |
| `setup-instructions.html` | Teacher setup: question creation, template upload, settings, answer key, preview checklist (section 9). |
| `lab-format-suggestions.txt` | Remaining conversion/publishing work for that lesson. |
| `busybee-rubric-metadata.json` | Only for lessons with BusyBee-graded written questions (copy from `busybee-rubric-metadata-template.json`). |

**Every template file must have a unique, lesson-specific filename — REQUIRED for
upload to Buzz.** Never name a template `buzz-assessment-template-for-buzz.html`: when
every lesson folder holds a file with the same name, the wrong lesson's template gets
uploaded (or overwrites another) and the mistake is invisible until a student opens the
assessment. Use the pattern `u#l#-<slug>-buzz-assessment-template.html` and the matching
`u#l#-<slug>-buzz-assessment-template-preview.html` for the generated preview. Name the
exact template file in the setup instructions. Also give every template a unique visible
page title and have the setup instructions verify it in preview (u1l3's setup
instructions catch a wrong upload because the preview title would read "Collision Lab"
instead of "Galileo Acceleration Lab Assessment").

Current template names (all renamed on 2026-07-13):

| Lesson | Template file |
| --- | --- |
| U1L2 | `u1l2-city-blocks-buzz-assessment-template.html` |
| U1L3 | `u1l3-galileo-buzz-assessment-template.html` |
| U1L3 (legacy Netlify-hosted variant) | `u1l3-galileo-netlify-buzz-assessment-template.html` |
| U1L5 | `u1l5-skydiver-buzz-assessment-template.html` |
| U2L1 | `u2l1-phet-projectile-buzz-assessment-template.html` |
| U2L2 | `u2l2-launch-velocity-buzz-assessment-template.html` |
| U2L3 | `u2l3-circus-launch-buzz-assessment-template.html` |
| U2L4 | `u2l4-river-rescue-buzz-assessment-template.html` |
| U2L5 | `u2l5-inertia-tension-buzz-assessment-template.html` |
| U3L1 | `u3l1-phet-forces-buzz-assessment-template.html` |
| U3L4 | `u3l4-collision-lab-buzz-assessment-template.html` |
| U3L5 | `u3l5-impulse-jump-buzz-assessment-template.html` |

---

## 4. Rules for the question text file

1. **Pure Buzz syntax, paste-whole.** The file starts with `Type:` on line 1 and
   contains nothing that is not Buzz text-editor syntax. Number the prompts
   sequentially (`1)`, `2)`, ...) so slot order is easy to verify.
2. **Integer scores.** Every `Score:` is a whole number and the assessment total is a
   whole number. Redistribute weights instead of using half-points.
3. **Keep auto-graded questions bare (the u2l3/u3l4 style).** No `Meta-` tags, no
   feedback lines, no repeated context that the template already shows. If the question
   loads into a chart cell, the prompt is the chart label only.
4. **Numeric answers always get explicit tolerance ranges** in the form
   `a. lower..upper` (`a. 2.9..3.1`). Never rely on the default 1% tolerance —
   and when the correct value is 0 an explicit range such as `a. -0.1..0.1` is
   mandatory, because 1% of zero is zero. `Figures:` is optional; use it only when
   significant figures matter to the grading.
5. **Variable-driven questions (the u2l3 pattern):** put `Var:` with the other
   properties after `Type:`/`Score:`, reference it in the prompt with `$name$`, and
   grade with `a. eval(...)`:

   ```text
   Type: F, Number
   Score: 1
   Figures: 3
   Var: launch1 = 20..35
   1) Level 1 Trial 1: Set Cannon 1 to $launch1$ degrees, click Fire Baseline,
      then adjust Cannon 2 until the act succeeds. What Cannon 2 angle worked? ________ degrees
   a. eval(90-$launch1$)
   ```

   Always preview variable import in Buzz and confirm the `eval` grades correctly
   before publishing.
6. **Choose auto-graded questions only when the answer source is fixed.** If the answer
   depends on a student's measured run, reaction time, chosen setting, or randomized
   trial, do not use a plain fixed-answer numeric question. Either validate the answer
   inside the lab against that student's own captured values before it can be recorded
   (the Reaction Time model), or grade with an evidence upload plus written explanation.
7. **Feedback lines are selective, not mandatory.** The model lessons ship auto-graded
   questions with no feedback at all. Add feedback only when it teaches without leaking:
   never include repair-step feedback (`@[When answer is incorrect] recheck the sign...`)
   when the skill being graded *is* that step — u3l4 grades sign convention itself, so
   its questions stay silent. Feedback-rich questions belong in practice/formative
   assessments; patterns are in section 7.
8. **`Meta-` tags only on BusyBee-graded written questions** (u1l3 style):
   `Meta-unit`, `Meta-lesson`, `Meta-skill`, `Meta-grading: busybee`, `Meta-evidence`.
   Place them with the other properties, after `Type:` and before the prompt. If Buzz
   ignores custom metadata in a domain, the same fields live in
   `busybee-rubric-metadata.json`, which is the authoritative copy.
9. **`Rubric:` only when a real, tested Buzz rubric XML file exists.** Do not invent
   file names; use the BusyBee metadata JSON instead.

---

## 5. Two essay grader-guide styles

**Style A — simple grader guide (u2l3, u3l4).** Use when the teacher grades manually.
One `a.` line beginning "A strong answer ...", no Meta tags, no feedback line:

```text
Type: E
Score: 2
Height: 220
11) What did you notice about the total momentum before and after each collision?
a. A strong answer states that the total momentum after the collision equaled the
   total momentum before it in every trial - at 100%, 50%, and 0% elasticity, even
   when the balls stuck together. Momentum is conserved in every collision.
```

**Style B — BusyBee rubric style (u1l3).** Use when BusyBee auto-grades written work.
Meta tags, an `@[Always]` line telling the student what is graded, and a
Full/Partial/No credit rubric in the `a.` line (continuation lines indented 3 spaces):

```text
Type: E
Score: 2
Height: 220
Meta-unit: U1
Meta-lesson: U1L3
Meta-skill: acceleration_evidence
Meta-grading: busybee
Meta-evidence: completed_chart
2) Explain how you can tell from the data that the object was accelerating during the fall.
@[Always] Your response is graded on whether you connect changing velocity to evidence from equal time intervals.
a. Full credit: States that acceleration means velocity changes, then uses increasing interval distances or increasing speed over equal time intervals as evidence.
   Partial credit: Correctly says the object speeds up or accelerates but gives limited or vague evidence from the table.
   No credit: Confuses acceleration with total distance only, claims the speed stayed the same, or does not use data evidence.
```

Style B questions also get an entry in the lesson's `busybee-rubric-metadata.json`
(section 6). Typical `Height:` values are 140–260 depending on expected length.

Every written question, in either style, should answer these before conversion is done:

- What exact physics claim must the student make?
- What evidence must they cite from the sim, chart, screenshot, or copied values?
- What vocabulary or law must appear?
- What common misconception should be caught?
- What earns full, partial, and no credit?
- Does this question need human review when the answer is ambiguous?

---

## 6. BusyBee rubric metadata

Copy `busybee-rubric-metadata-template.json` into the lesson folder as
`busybee-rubric-metadata.json` and fill it in (see `unit-1/lesson-3/busybee-rubric-metadata.json`
for a completed example). Rules:

- Prefer 2 to 4 clear criteria over long holistic rubrics; use physics skills as
  criteria: claim, evidence, law/concept, calculation/sign/unit, reasoning.
- Give concrete examples of acceptable evidence ("uses Trial 2 data", "references net
  force direction").
- Keep scoring levels simple: full, partial, no credit. `points` must match the Buzz
  integer `Score:`.
- List common misconceptions per question so BusyBee gives targeted feedback.
- Mark answers for human review when they are mid-level, ambiguous, contradictory,
  missing evidence uploads, or use unusual but possibly correct reasoning.
- Feedback should tell the student what to revise next, not restate the score. Keep
  style feedback separate from physics feedback unless writing quality is an objective.

Research basis:

- Skill-based checklist rubrics beat broad holistic judgments for physics
  constructed-response grading: <https://arxiv.org/abs/2604.12227>
- Autorater agreement improves with context and representative examples, but degrades
  when rubrics get too complex: <https://arxiv.org/abs/2605.06283>
- Low-confidence or ambiguous cases should route to a human grader:
  <https://arxiv.org/abs/2206.08288>

---

## 7. Copy-ready question patterns

**Numeric, fixed data (default — the u3l4 style):**

```text
Type: F, Number
Score: 1
1) Total P Before ________ kg*m/s
a. 2.9..3.1
```

**Numeric, correct value is zero:**

```text
Type: F, Number
Score: 1
3) Total P Before ________ kg*m/s
a. -0.1..0.1
```

**Multiple choice (bare, summative default):**

```text
Type: MC
Score: 1
Label: a
8) Compare your Level 2 range trials at 30 degrees, 45 degrees, and 60 degrees. Which launch angle gave the greatest range in the simulator?
a. 30 degrees
*b. 45 degrees
c. 60 degrees
d. All three angles had the same range.
```

**Multiple choice with feedback (practice/formative use only):**

```text
Type: MC
Score: 1
Label: a
1) Multiple-choice prompt goes here.
@[When answer is correct] Correct. Add one sentence that reinforces the physics idea.
@[When answer is incorrect] Review the relevant trial, graph, or setup, then choose the answer that matches the evidence.
a. Distractor tied to a common misconception.
@ Explain why this distractor is tempting but incorrect.
*b. Correct answer.
@ Correct because it matches the observed evidence.
c. Distractor tied to another common misconception.
@ Explain the correction in one short sentence.
d. Plausible but wrong answer.
@ Point the student back to the specific observation or variable.
```

**Numeric with feedback (practice/formative use only):**

```text
Type: F, Number
Score: 1
Figures: 3
1) Numeric prompt with units ________ unit
@[When answer is correct] Good. Your value is within tolerance and uses the correct unit/sign convention.
@[When answer is incorrect] Recheck the copied values, formula, unit, sign convention, and rounding before resubmitting.
a. lower..upper
```

**Evidence upload (u1l3 style):**

```text
Type: UP
Score: 2
MaxFiles: 1
FileTypes: png|jpg|pdf
7) Upload your completed data chart from the embedded lab above. Use the Download Evidence Image button or upload a clear screenshot showing all rows and all calculated columns.
```

Essay patterns are in section 5.

---

## 8. Rules for the assessment template

1. **Fully self-contained.** All lab HTML, CSS, JavaScript, chart/evidence UI, and
   `<a:question></a:question>` slots live in the one template file. No iframes to your
   own hosted files, no CDN scripts, no external stylesheets, no separate lab files in
   the Buzz upload path. (PhET iframes are the exception, with an external-launch
   fallback button in case Buzz blocks the iframe.)
2. **Multiple embedded sims are fine.** u3l4 embeds five trimmed per-trial simulators
   driven by one shared script; u2l3 embeds two simulator sections. Lock each embedded
   sim to its trial's fixed conditions so every student collects identical data.
3. **Script-strip fallback.** If Buzz strips the template's script (sims don't draw in
   preview), host the standalone sim file outside Buzz and switch the template to a
   hosted link or iframe. Every setup-instructions file names this fallback.
4. **Slots fill in display order.** The number of `<a:question></a:question>` slots must
   equal the number of questions, and the questions.txt order must match slot order
   exactly. Chart-cell placement is what gives short prompts their context, so a
   scrambled order grades answers against the wrong trial.
5. **No solving help in the template.** No formulas, sign hints, worked directions, or
   conclusions. Each section shows only its setup facts, the sim, and the chart or
   question slots. Teaching lives in the standalone practice sim (Guide/Hint overlays)
   or the lesson page. When the graded skill includes converting data (arrow-to-sign,
   units), the template must not do that conversion for the student.
6. **Ungraded self-check inputs are allowed** (u3l4's yellow final-velocity cells): they
   may confirm a correct reading by locking into a display, but they give no feedback on
   wrong entries, are not saved, and must not expose any gradable value the sim doesn't
   already show.
7. **Evidence workflow controls.** Every lab where students transfer data into Buzz gets
   a Lab Evidence / Lab Report panel with the exact values to copy, a
   "Copy values for Buzz" button for numeric data, and a "Download Evidence Image"
   button when a chart/graph/table screenshot is graded.
8. **End with a return-to-Buzz instruction** telling students to finish the Buzz
   questions below the lab.
9. **No answer-reveal tools in student-facing templates** unless teacher-locked or
   delayed until after submission. Remove or lock Show Answer / Answer Key Preview
   buttons before publishing (e.g., baseball-throw.html).
10. **Package or inline all dependencies.** Replace Tailwind/CDN links with local or
    inline CSS; school networks and Buzz hosting may block external scripts and fonts.

---

## 9. Buzz assessment settings and setup-instructions.html

Every assessment that uses a template MUST set, and every `setup-instructions.html`
MUST state:

- **Turn OFF randomize/shuffle question order. Buzz defaults to randomized order**, and
  templates fill their placeholders in display order, so randomization puts questions in
  the wrong slots or chart cells. This is the single most common way a working
  conversion breaks.
- **Do not use one-question-per-page** when multiple questions must render together in
  one chart or section (both momentum questions of a trial must appear inside that
  trial's chart).
- Assessment title convention: `Unit # Lesson #: <Activity Title>` (e.g.,
  `Unit 3 Lesson 4: Collision Lab - Conservation of Momentum`).

Structure `setup-instructions.html` like `unit-ApplicationFiles/unit-3/lesson-4/setup-instructions.html`:

1. **What this activity is** — how the template is laid out, where the question slots
   land, what is fixed vs student-entered, and what is deliberately absent (solving
   help).
2. **Hosting step** — usually "Nothing to host" plus the script-strip fallback.
3. **Create the questions** — assessment title, paste `buzz-assessment-questions.txt`
   whole, question count and point total, order warning, and an **answer key table**
   with the fixed conditions, expected values, and tolerance ranges.
4. **Upload the template** — the exact unique template file name (section 3), slot
   count, randomization warning (use the visible `warn` callout style).
5. **Preview as a student** — checklist: sims draw and run (script not stripped),
   each slot lands in the right cell/section (if not, randomization is still on),
   readouts match the key, all numeric answers grade correct with key values, essay
   boxes appear, evidence download works, and the page title matches this lesson
   (catches a wrong-template upload).

---

## 10. Preview build workflow

`buzz-assessment-template-preview.html` files are generated — never hand-edit them.
After editing any template or questions file:

```sh
node unit-buzz-template-conversion-files/build-buzz-template-previews.js
```

Run it from the repo root (paths in the script are cwd-relative). It replaces each
`<a:question></a:question>` slot with a rendered question card and reports
`ok: ... (N slots, N questions)` per lesson; a `check:` line means the slot count and
question count disagree — fix that before uploading anything to Buzz. When you convert
a new lesson, add its folder to the `lessons` array at the top of the script.

---

## 11. Grading-design decision table

| Situation | Grade with |
| --- | --- |
| Small fixed chart; every student gets the same values | Native Buzz numeric/MC questions with explicit tolerance ranges (u3l4) |
| Fixed sim presets or known formulas, Buzz picks the numbers | `Var:` + `eval(...)` questions (u2l3) |
| Written analysis of fixed data | Essay style A (teacher grades) or style B + metadata JSON (BusyBee grades) |
| Answer depends on the student's own measured/chosen data | In-lab validation gate against that student's captured values (Reaction Time model), or evidence upload + written explanation — never a plain fixed-answer numeric question |
| Chart/graph/table evidence is graded | UP question + Download Evidence Image button |

Status vocabulary used in lesson notes:

- **Fixed numeric ready** — stable values suitable for Buzz numeric grading now.
- **Evidence based** — student answers vary; grade via screenshots, copied data, short
  answer, or essay.
- **Needs fixed mode** — could become numeric auto-graded if a locked preset/Buzz mode
  is added.
- **Student-dependent validation** — the lab must validate calculations against that
  student's captured values before accepting them, or BusyBee must compare the response
  to uploaded/copied evidence.
- **Already handled** — conversion done or confirmed done.

---

## 12. Buzz text-editor syntax reference

Verified against official Agilix Help Center articles on 2026-03-18. This is the
generation spec for producing Buzz question text that pastes cleanly into the Text
editor / Edit all questions screen.

### 12.1 Non-negotiable structure

Every question has five parts in this order:

1. `Type:` line (required, first line).
2. Properties (all of them immediately after `Type:`, before the prompt — including
   `Var:`).
3. Question prompt.
4. Feedback blocks (optional, immediately after the prompt).
5. Answers / choices / matches / order data.

Separate questions with a blank line. Indent every continuation line (question body,
feedback body, choice body, match body, rubric lines) with exactly **3 leading spaces**.
Use `[----]` only for Inline MC/MA/MT. Use runs of 3+ underscores only for Fill in the
Blank blanks. Use only documented property and option names — never invent names like
`Tolerance:` or `ChoicesTitle:`. Prefer plain text; HTML/iframes are supported in
prompts but plain text is most reliable. When unsure, prefer the simplest valid form.

### 12.2 Question type codes

| Code | Type | Notes |
| --- | --- | --- |
| `MC` | Multiple choice | exactly one `*` correct choice |
| `MA` | Multiple answer | one or more `*` correct choices |
| `F` | Fill in the blank | subtypes: `IgnoreCase`, `Match`, `Equivalent`, `Number`, `RegEx` |
| `MT` | Matching | `a. left = right` |
| `O` | Ordering | `1_a.` order prefixes |
| `E` | Essay | not available in Practice questions activities |
| `UP` | File upload | not available in Practice questions activities |
| `P` | Passage | no score, no answers, no feedback |
| `C` | Custom | only with a known custom renderer |

### 12.3 Properties

General: `Type:` (required), `Score:` (numeric; MA/MT/O also allow `Score: Partial` and
`Score: Partial, Round`), `Label:` (`1`, `A`, `a`, or `I`; MC/MA), `Groups:`,
`Objectives:`, `Calculator:` (`Basic`/`Standard`/`Scientific`), `Options:`,
`Meta-NAME:` (custom metadata), `Passage:` (attach question to a passage HREF),
`Custom:`, `ExtraCredit` (only if verified in your domain), `Var:`.

Essay: `Height:`, `Rubric: <file>.xml` (only if the rubric file really exists),
`MinWords:`, `MaxWords:`.
File upload: `MaxFiles:` (1–5), `FileTypes: pdf|docx|png` (pipe-separated, no dots;
100 MB limit).
Numeric fill-in: `Figures:`.
Graphic (MA/MT): `Image: Assets/diagram.png`, `Coords:` with `(left,top,width,height)`
percentages, `rect(...)` or `circle(...)`; MA-Graphic also allows `BorderColor`,
`BorderStyle`, `BorderWidth`, `SelectedColor`, `SelectedStyle`, `SelectedWidth`.

Documented `Options:` values by type — use no others:

| Option | Valid for |
| --- | --- |
| `DragAndDrop` | MT, O |
| `Graphic` | MA, MT |
| `Horizontal` | O only |
| `Inline` | MA, MC, MT |
| `MaintainOrder` | MA, MC, O |
| `MaintainQuestionOrder` | P |
| `Multiple` | F |
| `RemoveUsedChoices` | MT only |
| `ShowCorrect` | F |
| `Side`, `Single` | P |
| `Workspace` | all except E and P |

### 12.4 Variables and math

```text
Var: a = 1..10          (range; inclusive; default step 1)
Var: t = 0..5,0.5       (range with step)
Var: color = red,blue,green            (list)
Var: animalgroup.animals = dog,cat,bird (grouped lists align by position)
```

- Display a variable in text: `$m$`. Display a computed value: `$eval($m$*$a$,0)`.
- Grade a computed fill-in answer: `a. eval($m$*$a$)`.
- **Never use a literal `$` for currency** — Buzz parses it as a variable; write
  "dollars".
- Supported operations: `+ - * / ^`, `pi`, `e`, `abs(x)`/`|x|`, `cos sin tan sec csc
  cot asin acos atan` (radians), `sqrt(x)`, `x^(1/n)`, `ln(x)`, `log(x)`, `log_(x)(y)`,
  `eval(x)`, `floor(x)`, `ceil(x)`.

### 12.5 Feedback syntax

Feedback lines go immediately after the prompt:

```text
@[Always] message
@[When answer is correct] message
@[When answer is incorrect] message
```

Choice-specific feedback (MC/MA): a line starting with `@` directly under the choice.

Conditional feedback uses variables `score`, `teacher`, `answer`, `answer1...`,
`answercorrect1...` with operators `=  <>  <  <=  >  >=`:

```text
@[answercorrect1=false] Review the first section.
@[score<=0.5] Review Unit 3 activities.
@[LowScores: score<=0.5] Review the notes.
```

If multiple feedback lines share a group name, Buzz applies the first matched condition
in that group.

### 12.6 Type-by-type rules and examples

**MC** — exactly one `*` choice; `x.` fixes a choice in its listed position (e.g., "None
of the above"); `Options: MaintainOrder` keeps authored order; `Options: Inline` with
`[----]` for dropdown-in-sentence.

```text
Type: MC
Label: a
1) What is the SI unit of force?
*a. newton
b. joule
c. watt
x. None of the above
```

**MA** — mark every correct choice with `*`; `Score: Partial` for partial credit;
`Options: Graphic` only with `Image:` + `Coords:`.

**F** — blanks are 3+ underscores in the prompt, answer lines below map to blanks in
order. Use `F, IgnoreCase` for text blanks unless capitalization matters; `F, Number`
for numeric (default tolerance 1% unless you give `start..end` — always give the
range, see section 4); `F, Equivalent` accepts mathematically equivalent expressions;
`F, Match` normalized expression match; `F, RegEx` regex. `Options: Multiple` when one
blank has several acceptable answers; weighted credit via `[.6]` prefixes:

```text
Type: F, IgnoreCase
Score: 10
Options: Multiple
1) __________ is the capital of Finland, and __________ is the capital of Sweden.
[.6]a. Helsingfors
[.5] Helsinki
[.4]b. Stockholm
```

Never use `[----]` or `*a.` markers in F questions.

**MT** — `a. left = right` exactly; a blank left side (`d. = moo`) creates a distractor;
`Options: DragAndDrop` (+ `RemoveUsedChoices`) for drag; inline form uses
`Options: DragAndDrop, Inline, MaintainOrder` where the left side is the **blank
number**, not visible text:

```text
Type: MT
Options: DragAndDrop, Inline, MaintainOrder
1) Force is measured in [----], energy is measured in [----].
a. 1 = newtons
b. 2 = joules
c. = watts
```

**O** — prefix each option with its correct position: `1_a.`, `2_b.` ... Use
`Options: DragAndDrop` (+ `Horizontal`) for drag layouts, but keep the numbered
prefixes for reliable text import:

```text
Type: O
Options: MaintainOrder
1) Sort these from smallest to largest.
2_a. meter
1_b. centimeter
3_c. kilometer
```

**E** — the `a.` line is a grader guide, not an auto-graded key (see section 5).
Assessments only, never Practice questions.

**UP** — Assessments only. `MaxFiles: 1`–`5`, `FileTypes: png|jpg|pdf` (pipes, no
dots). Students upload local files; 100 MB limit.

**P** — a passage is display-only: no `Score:`, no answers, no feedback. Layout via
`Options: Side` / `Side, Single` / `MaintainQuestionOrder`. Attach questions to it with
`Passage: <href>` on the question.

**C** — only when the domain has a known custom renderer; never invent payloads.

### 12.7 Common failure modes

1. Missing `Type:` line, or properties placed after the prompt.
2. `[----]` in F questions, or underscores in Inline MC/MA/MT.
3. Missing `*` on the correct MC/MA choice, or two `*` choices in MC.
4. Missing `1_` order prefixes in O; `a = b` instead of `a. left = right` in MT.
5. `RemoveUsedChoices` outside MT; `Horizontal` outside O; `Graphic` without
   `Image:` + `Coords:`.
6. `FileTypes:` with commas or dotted extensions.
7. Essay or File upload inside Practice questions activities.
8. Mixing up `$eval(...,0)` (display) and `eval(...)` (answer key).
9. Continuation lines not indented exactly 3 spaces.
10. Answer keys, scores, or feedback on P passages.
11. Inventing properties (`Tolerance:`, `ChoicesTitle:`) or a literal `$` in text.
12. Relying on default 1% numeric tolerance — especially fatal when the answer is 0.

### 12.8 Pre-upload checklist

- Every question begins with `Type:`; every property and option value is documented for
  that type.
- MC has exactly one `*`; MA has one or more.
- Every `F, Number` answer is a number, an explicit `lower..upper` range, or
  `eval(...)`.
- Inline questions include `[----]`; graphic questions include `Image:` and `Coords:`.
- Scores are integers; the total matches the setup instructions and metadata JSON.
- Question count equals the template's `<a:question>` slot count
  (`node unit-buzz-template-conversion-files/build-buzz-template-previews.js` reports
  this).
- Prompt numbering `1) 2) 3)...` matches slot order top-to-bottom in the template.
- No prose, headers, or teacher notes anywhere in the file.

### 12.9 Prompt for delegating generation to an LLM

> Generate Buzz assessment text only. Use official text-editor syntax. Start each
> question with `Type:`. Put all properties before the prompt. Use `[----]` only for
> Inline MC/MA/MT. Use underscores only for Fill in the Blank. Use `*` to mark correct
> MC/MA choices. Use `a. left = right` syntax for Matching. Use numbered order prefixes
> for Ordering. Use `Var:` declarations for variables, `$name$` for displayed variable
> values, `$eval(...,0)` for displayed computed values, and `eval(...)` for Fill in the
> Blank answer keys. Give every numeric answer an explicit `lower..upper` tolerance
> range. Keep auto-graded questions minimal with no metadata or feedback lines unless
> asked. Output pure Buzz text with blank lines between questions and no explanation.

Official sources: Agilix Help Center — "How do I use the Text editor for questions in
Assessment or Practice question activities?", "How do I use assessment variables?", and
the per-type setup articles for Fill in the Blank, Matching, Ordering, File upload,
passages, and feedback.

---

## 13. Conversion status by lesson

As of 2026-07-13. Detailed remaining work lives in each lesson's
`lab-format-suggestions.txt`; answer keys live in each lesson's
`setup-instructions.html`.

| Lesson | Activity | Format | Questions / points | Status and next steps |
| --- | --- | --- | --- | --- |
| U1L1 | Motion Graphs / Delivery Game | SCORM (activity owns the 15-question score) | 15 pts in-activity | Upload `lesson-1.zip`, set gradebook to 15 pts, confirm `cmi.core.score.raw` 0–15. Do **not** add native Buzz questions. |
| U1L1-additions | Alternate Motion Graphs build | archived reference | — | Do not publish; scenarios merged into U1L1. |
| U1L2 | City Blocks Challenge | Buzz-native, self-contained | 6 q / 11 pts (1 MC, 4 E, 1 UP) | Full upload set + rubric metadata exists; preview embedded challenge, evidence download, copy-values in Buzz. |
| U1L3 | Galileo Acceleration Lab | **Model lesson** — Buzz-native, self-contained | 7 q / 12 pts (6 E, 1 UP) | Done. Upload `u1l3-galileo-buzz-assessment-template.html`; verify page title in preview. |
| U1L4 | Reflex Lab | Hosted, student-dependent validation | — | Done. Keep the validation gate; never convert reaction-time values to fixed-answer questions. |
| U1L5 | Skydiver Graphs and Challenge | Buzz-native, self-contained | fixed Part 1 questions + evidence/essay Part 2 | Full set exists. Upload `u1l5-skydiver-buzz-assessment-template.html`; preview graphs and evidence download. |
| U1 Honors | Rocket Launch Lab | evidence-based honors extension | — | Keep separate from U1L5; linked as Honors on the Unit 1 page. |
| U2L1 | PhET Projectile Motion | Buzz-native + PhET iframe | 13 q | Preview iframe in Buzz (keep external-launch fallback); verify all numeric tolerance ranges against PhET. |
| U2L2 | Projectile Launch: Finding Launch Velocity | evidence-based (real or simulated throw) | essays + upload | Full set exists. Require work upload; hide/teacher-lock the Answer Key Preview in `baseball-throw.html` if hosted. |
| U2L3 | Circus Launch Complementary Angles | **Model lesson** — Buzz-native, self-contained | 10 q / 12 pts | Done. Verify `eval(90-$launch$)` variable grading and Level 2 tolerances in Buzz preview. |
| U2L4 | River Rescue | evidence-based; needs fixed challenge mode for auto-grading | in progress | Template/preview files now exist; finish evidence panel, copy/download buttons, fixed mode decision. |
| U2L5 | Inertia and Tension Demo | Buzz-native, self-contained | fixed observable results | Full set exists. Preview stage bar + Slow/Fast Pull for both levels in Buzz. |
| U2 Honors | Coriolis Cannon Challenge | honors project | — | Stays in `lesson-u2honors`. |
| U3L1 | PhET Forces and Motion | evidence-based (screenshots + essays) | — | Full set exists. Require Net Force screenshot; keep Newton's 1st/2nd law grading distinction clean; rebuild zip only if SCORM delivery is needed. |
| U3L2 | Newton's Spacewalk Momentum | fixed numeric ready | not yet converted | Needs template conversion: lock/remove Show Answer, add Mission Results panel + evidence buttons. |
| U3L3 | Friction Force Lab | fixed numeric ready | in progress | Rubric metadata added; needs lab data table, student inputs before reveal, fixed required surfaces (Wood, Unknown A). |
| U3L4 | Collision Lab | **Model lesson** — Buzz-native, self-contained | 14 q / 18 pts (10 F-Number, 4 E) | Done. Order is critical: ten identical-looking numeric prompts rely on chart placement — randomization must stay off. |
| U3L5 | Impulse Jump Lab | fixed numeric ready (Athletic Max Jump profile) | in progress | Template/preview/setup files now exist; require the fixed profile, evidence panel, and non-advancing wrong answers if Buzz grades the calculations. |

### Fixed reference values for lessons still being converted

Keep these until each lesson's `setup-instructions.html` carries its own answer key.

- **U3L2 Spacewalk Momentum** — built-in correct choices:
  Level 1: Choice C, Radar Dish at 3.2 m/s → final speed 1.00 m/s left, arrival 20.0 s.
  Level 2: Choice D, Gold Bar at 2.4 m/s → final speed 0.95 m/s left, arrival about 21.1 s.
- **U3L3 Friction Force Lab** — fixed surface data:
  Wood: normal 49.1 N, static peak 20.6 N, kinetic 12.3 N, mu_s 0.42, mu_k 0.25.
  Unknown A: normal 49.1 N, static peak 27.0 N, kinetic 17.2 N, mu_s 0.55, mu_k 0.35.
- **U3L5 Impulse Jump Lab** — Athletic Max Jump profile:
  push time 0.32 s, average net force ≈ 938 N, net impulse ≈ 300 N·s,
  takeoff velocity ≈ 4.29 m/s, max height ≈ 0.94 m.
