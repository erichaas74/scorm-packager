# Walkthrough rebuild — integration guide

This is the apply-in-order checklist for everything delivered across the two
rounds. Files marked **NEW** are drop-in additions; files marked **EDIT** need
hunks applied to your existing source.

## File map

| File | Status | Source |
|---|---|---|
| `proficiency.js` | **NEW** — add to repo | `proficiency.js` |
| `Kinematics2dHitRegions.js` | **NEW** — add to repo | `Kinematics2dHitRegions.js` |
| `Kinematics2dVectorDecompose.js` | **NEW** — add to repo | `Kinematics2dVectorDecompose.js` |
| `workAnalysis.js` | **REPLACE** — full swap | `workAnalysis.js` |
| `Kinematics2dWorkAnalysisWalkthrough.js` | **REPLACE** — full swap | `Kinematics2dWorkAnalysisWalkthrough.js` |
| `Kinematics2dWorkAnalysis.js` | **REPLACE** — full swap | `Kinematics2dWorkAnalysis.js` |
| `Kinematics2d.js` | **EDIT** — apply hunks | `Kinematics2d.patch.js` (round 1), `Kinematics2d.patch.round2.js` (round 2), `Kinematics2d.patch.round3.js` (round 3), and `Kinematics2d.patch.round4.js` (round 4) |
| `Kinematics2dWorkAnalysisPanels.js` | unchanged | — |
| `Kinematics2dWalkthroughOverlays.js` | unchanged | — |

## Apply order

1. **Drop in the three new files.** `proficiency.js`,
   `Kinematics2dHitRegions.js`, and `Kinematics2dVectorDecompose.js` have no
   dependencies on each other and don't modify existing code; just put them
   alongside the other modules.

2. **Replace `workAnalysis.js`** with the new file. It's a strict superset
   of the original module — every export the old file had is still here
   (problem-type helpers, sequence state, `stepCanvasAnchors`,
   `timeForStepAnchor`), plus the new helpers the rebuild relies on
   (`resolveExpectedValue`, `getDefaultTasksForStep`, `getTaskSignature`,
   `buildGivensStep`, `getEquationsForPicker`, etc.).

3. **Replace `Kinematics2dWorkAnalysisWalkthrough.js`** with the new file.
   `getWalkthroughPrompt(step)` and `checkWalkthroughAnswer(step, answer)`
   keep their original signatures but accept optional `(taskIndex, model)`
   arguments for the new task-aware behavior.

4. **Replace `Kinematics2dWorkAnalysis.js`** with the new file. All 8
   problem-type definitions, sample problems, the scenario solver, randomized
   inputs, and the step-id metadata maps are byte-identical to the original.
   Two pedagogical changes: every problem type's steps array now starts with
   the givens step, and the components step in projectile-launch types has
   a hand-authored task chain (canvas-pick → formula-pick → vector-decompose
   → numeric).

5. **Apply the `Kinematics2d.js` patches in order.** Rounds 1–4 are
   stackable; later rounds extend the same methods that earlier rounds
   touched. Round 4 includes a sketch of `requestCanvasRedraw` if you don't
   already have one — that helper is what makes the vector-decompose drag
   smooth without re-rendering the HTML panel on every pointermove.

## What students see after the rebuild

Every problem type now starts with a **givens step**: a chip strip plus a
canvas they can click to tag every quantity the problem hands them. The
checker tells them what's missing or shouldn't be selected.

After the givens step, the **components step** for projectile-launch problem
types asks the student to click `v₀` and `θ` on the canvas before computing
`v₀x` and `v₀y` numerically.

For every other step that solves a 1D kinematic relationship, students see
an **always-visible four-equation chip strip** plus a "None of these" chip.
Before computing a value, they pick which canonical equation applies:

- `vf = vi + a · t`
- `Δx = vi · t + ½ a · t²`
- `vf² = vi² + 2 a · Δx`
- `Δx = ½ (vi + vf) · t`

Steps that aren't applying one of the four (the components step, the
Pythagorean reconstruction step, the range shortcut, and the summary)
correctly answer "None of these" — and the feedback explains *why* none of
the four applies, naming the actual technique used. This teaches recognition
of when the kinematic equations aren't the right tool, which is its own
hard skill.

Each task records an outcome to the proficiency tracker. After three
consecutive unaided successes on a skill (e.g. `numeric:v0x`,
`canvas-pick:theta`, `multi-select:givens`, `formula-pick:dx`), that skill
is marked mastered and a green skip banner appears whenever the student
encounters the same skill in the future. Picking the formula and computing
the value are tracked as **separate skills** — students who can do the
arithmetic but not pick the right equation will see the formula-pick task
keep coming back, and vice versa.

The skip is opt-in, never automatic.

## What's intentionally not done

- **Auto-skip.** `filterTasksForStudent` is exported from `proficiency.js`
  and ready to wire into the steps pipeline if you want mastered tasks to
  silently disappear. I held off because silent jumps confuse students.
- **Selection state on the canvas.** The chip strip shows what's selected
  for multi-select; the canvas overlay does not yet visually distinguish
  selected items. The hit-region module already supports this (the canvas
  knows which keys are selected via `state.selection`); the drawer just
  needs an `isSelected` flag like `isResult`.
- **Vector-decompose, assign-axis.** Both slot into the `taskKinds` registry
  the same way the existing kinds did.

## Next-up tasks worth authoring

Highest-leverage step authoring once the rebuild is in:

1. **`vector-decompose` task kind** for the components step. Student drags
   the v₀x and v₀y arrows from the resultant. Check: angle within ~3° and
   magnitude within tolerance of `vix`/`viy`.
2. **`assign-axis` task kind** for the components step's "x vs y" sorting.
   Student drags `v₀x`, `v₀y`, `dx`, `dy`, etc. into "horizontal" or
   "vertical" buckets.
3. **Auto-skip wiring.** Once you have data showing students reliably hit
   mastery on `multi-select:givens` and the formula-pick skills, switch
   from opt-in skip to auto-filter via `filterTasksForStudent` in the
   render call-site.
