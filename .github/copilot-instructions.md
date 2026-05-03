# SCORM 1.2 Simulation Build Instructions

Apply these rules whenever building or modifying physics simulations in this workspace.

---

## SCORM 1.2 Compliance Checklist

### imsmanifest.xml
- Schema declaration must reference `ADL SCORM` / `1.2` — never SCORM 2004.
- `adlcp:scormtype="sco"` is required on the resource element.
- Entry-point file must match the actual HTML filename.
- Set `<adlcp:masteryscore>` to the agreed passing threshold (default: 80).

### LMS Handshake (Agilix Buzz compatible)
- Call `LMSInitialize("")` immediately on `window load` — not `DOMContentLoaded`.
- Call `LMSCommit("")` after every meaningful `LMSSetValue` write.
- Call `LMSFinish("")` on `beforeunload` (always preceded by a final `LMSCommit`).
- API discovery must walk the **parent frame chain** (up to 7 levels) then fall back to `window.opener` — Agilix Buzz embeds the SCO in a nested iframe.
- All LMS calls must pass an **empty string `""`** as the argument, not `null` or `undefined`.
- Check `LMSGetLastError()` after every call in development; suppress (but log) in production.

### Scoring — `cmi.core.score.raw`
- Map the learner's final lab performance to `cmi.core.score.raw` (0–100 integer).
- Always set `cmi.core.score.min` and `cmi.core.score.max` alongside `.raw`.
- Set `cmi.core.lesson_status` to `"passed"` or `"failed"` based on masteryscore threshold **before** calling `LMSFinish`.

### Suspend Data — `cmi.suspend_data`
- Persist randomized lab variables (seeds, initial conditions) and learner progress in `cmi.suspend_data`.
- Serialize state as compact JSON; keep the payload under **4 096 characters** (SCORM 1.2 spec minimum guaranteed field length).
- On `LMSInitialize`, read back `cmi.suspend_data` and resume from saved state when a non-empty value is returned.
- Never store scores or lesson_status in suspend_data — those have dedicated CMI fields.

---

## Browser / Runtime Targets

### Google Chrome (primary target)
- **No absolute file paths.** All asset references (`src`, `href`) must be relative.
- **Responsive canvas.** Size the `<canvas>` with CSS (`width: 100%; max-width: Xpx`) and update internal resolution on `resize` events.
- **Autoplay gate.** Include a visible **Start** button that the learner must click before any audio or animation begins. Audio context must be created (or resumed) inside the click handler to satisfy Chrome's autoplay policy.
- Request `AudioContext` lazily — only after the Start button interaction.
- Use `requestAnimationFrame` for all animation loops; never `setInterval` for rendering.

### General compatibility
- No ES modules (`type="module"`) unless the LMS is known to support them; use IIFE or concatenated scripts instead.
- Avoid `localStorage` / `sessionStorage` for state — use `cmi.suspend_data` exclusively so state travels with the LMS enrolment.
- Test offline (file://) mode: the simulation must degrade gracefully when no LMS API is present.

---

## Packaging a Lesson as a SCORM ZIP

### Pre-packaging cleanup
- **Remove the `← Home` link** (`top-bar-home`) — it points to the dev homepage and will 404 inside an LMS.
- **Remove the `Submit to LMS` button** and its click handler — Buzz provides its own Submit Assignment button in the parent frame.
- Any other dev-only navigation (e.g. links to sibling lessons) should also be removed.

### Auto-commit scores for Agilix Buzz
- Buzz reads `cmi.core.score.raw` and `cmi.core.lesson_status` when the student clicks the Buzz-provided **Submit Assignment** button. The SCO does **not** need its own submit button.
- Write `SCORM.setScore(score, 0, 100)` and `SCORM.setStatus(score >= 80 ? 'passed' : 'failed')` followed by `SCORM.commit()` **after every graded attempt**, not just at the end. This keeps CMI fields current so Buzz always has the latest score.
- Guard all SCORM calls with `if (typeof SCORM !== 'undefined')` for standalone mode.

### imsmanifest.xml per lesson
- Create a lesson-specific `imsmanifest.xml` inside the lesson folder with:
  - A unique `manifest @identifier` (e.g. `com.yourorg.unit1-lesson1-motion-graphs`).
  - A descriptive `<title>` matching the lesson name.
  - All JS/CSS/asset files listed as `<file href="…"/>` entries in the resource.
- The packager (`package-sim.js`) injects the **root** template manifest by default. To use the lesson-specific one, swap it in before running the packager:
  ```
  Copy-Item imsmanifest.xml imsmanifest.xml.bak
  Copy-Item unit-1\lesson-N\imsmanifest.xml imsmanifest.xml -Force
  node package-sim.js unit-1/lesson-N
  Copy-Item imsmanifest.xml.bak imsmanifest.xml -Force
  Remove-Item imsmanifest.xml.bak
  ```

### Build command
- Run `node package-sim.js <folder>` from the workspace root.
- Output ZIP lands at `<folder>.zip` (e.g. `unit-1/lesson-1.zip`).
