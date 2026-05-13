// =============================================================================
// workAnalysis.js — complete drop-in replacement
// =============================================================================
// Includes:
//   - Original problem-type / sequence / anchor helpers (unchanged behavior).
//   - resolveExpectedValue / formatExpectedValue / getTargetLabel — single
//     source of truth for numeric ground-truth values across panels and
//     walkthrough.
//   - getDefaultTasksForStep — auto-derives a task array per step, weaving
//     formula-pick before each numeric task.
//   - getTaskSignature — stable problem-type-independent skill IDs for the
//     proficiency tracker.
//   - buildGivensStep — the "step 0" factory that prepends a multi-select
//     givens task to every problem type.
//   - KINEMATIC_EQUATIONS / VECTOR_TRIANGLE_EQUATIONS — two parallel pickers.
//   - SPECIAL_EQUATIONS — for steps where "None of these" is the right chip.
//   - kinematicEquationByStepId — per-step (and per-target) picker mapping.
//   - getKinematicEquationForStep / getEquationsForPicker / getPickerLabel.
//   - stepCanvasAnchors now includes a 'givens' anchor.
// =============================================================================

export const normalizeWorkAnalysisToken = (value) =>
    String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '');

// -----------------------------------------------------------------------------
// Problem-type option helpers (unchanged from the original file)
// -----------------------------------------------------------------------------

export function getProblemTypeOptions(definitions) {
    return ['Auto', ...Object.values(definitions).map(def => def.option)];
}

export function resolveProblemTypeOption(value, definitions, normalizeToken = normalizeWorkAnalysisToken) {
    const raw = String(value || '').trim();
    const normalized = normalizeToken(raw);
    if (!raw || normalized === 'auto') return 'Auto';

    const directNumber = raw.match(/[1-9][0-9]*/)?.[0];
    if (directNumber && definitions[directNumber]) return definitions[directNumber].option;

    return Object.values(definitions).find(def => normalizeToken(def.option) === normalized)?.option || null;
}

export function getProblemTypeNumber(value, definitions, normalizeToken = normalizeWorkAnalysisToken) {
    const option = resolveProblemTypeOption(value, definitions, normalizeToken);
    if (!option || option === 'Auto') return null;
    return option.match(/[1-9][0-9]*/)?.[0] || null;
}

// -----------------------------------------------------------------------------
// Sequence state (unchanged)
// -----------------------------------------------------------------------------

export function getSequenceState({
    steps,
    visualTime,
    breakdownDuration,
    workAnalysisDuration,
    stepDuration,
    clamp
}) {
    if (!workAnalysisDuration || !steps.length) return null;
    if (visualTime < breakdownDuration) return null;

    const clampValue = clamp || ((value, min, max) => Math.max(min, Math.min(max, value)));
    const sequenceTime = clampValue(
        visualTime - breakdownDuration,
        0,
        Math.max(0, workAnalysisDuration - 0.0001)
    );
    const stepIndex = Math.min(steps.length - 1, Math.floor(sequenceTime / stepDuration));
    const localTime = sequenceTime - (stepIndex * stepDuration);
    const progress = clampValue(localTime / stepDuration, 0, 0.999);
    const step = steps[stepIndex];

    return {
        step,
        stepIndex,
        stepCount: steps.length,
        localTime,
        progress,
        lineCount: Math.max(1, Math.min(step.lines.length, Math.ceil(progress * step.lines.length)))
    };
}

// -----------------------------------------------------------------------------
// Step canvas anchors (unchanged except for the new `givens` entry)
// -----------------------------------------------------------------------------
// The givens step parks the canvas at the fully-broken-down vector frame so
// the student can tag every quantity that's drawn.

export const stepCanvasAnchors = {
    givens:              { phase: 'breakdown', progress: 1.00 },
    components:          { phase: 'breakdown', progress: 0.95 },
    horizontal:          { phase: 'launch',    progress: 0.20 },
    vertical:            { phase: 'launch',    progress: 0.05 },
    time:                { phase: 'landing',   progress: 1.00 },
    range:               { phase: 'landing',   progress: 1.00 },
    'vertical-result':   { phase: 'peak',      progress: 1.00 },
    'live-equation-vyf': { phase: 'landing',   progress: 1.00 },
    reconstruct:         { phase: 'launch',    progress: 0.05 },
    shortcut:            { phase: 'landing',   progress: 1.00 },
    summary:             { phase: 'final',     progress: 1.00 }
};

const DEFAULT_ANCHOR = { phase: 'landing', progress: 1.0 };

export function timeForStepAnchor(model, stepOrAnchor) {
    if (!model) return 0;

    const anchor = resolveAnchor(stepOrAnchor);
    const breakdownDuration = Math.max(0, model.breakdownDuration || 0);
    const workAnalysisDuration = Math.max(0, model.workAnalysisDuration || 0);
    const introDuration = breakdownDuration + workAnalysisDuration;
    const motionStop = Math.max(0, model.motionStopTime || 0);
    const tFlight = Math.max(0, model.tFlight || 0);
    const tPeak = Math.max(0, model.tPeak || 0);
    const totalStop = Math.max(introDuration, model.stopTime || introDuration + motionStop);
    const progress = clamp01(anchor.progress);

    let time;
    switch (anchor.phase) {
        case 'breakdown':
            time = breakdownDuration * progress;
            break;
        case 'launch':
            time = introDuration + (Math.min(tFlight, motionStop) * 0.10 * progress);
            break;
        case 'peak':
            time = introDuration + (tPeak * progress);
            break;
        case 'landing':
            time = introDuration + (motionStop * progress);
            break;
        case 'final':
            time = Math.max(introDuration + motionStop, totalStop - 0.001);
            break;
        default:
            time = introDuration + motionStop;
    }

    return Math.max(0, Math.min(time, totalStop));
}

function resolveAnchor(stepOrAnchor) {
    if (!stepOrAnchor) return DEFAULT_ANCHOR;
    if (typeof stepOrAnchor === 'string') {
        return stepCanvasAnchors[stepOrAnchor] || DEFAULT_ANCHOR;
    }
    if (stepOrAnchor.phase) return stepOrAnchor;
    if (stepOrAnchor.id && stepCanvasAnchors[stepOrAnchor.id]) {
        return stepCanvasAnchors[stepOrAnchor.id];
    }
    return DEFAULT_ANCHOR;
}

function clamp01(value) {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(1, value));
}

// =============================================================================
// Target value resolution
// =============================================================================
// Single source of truth for the numeric value behind a target key. Anywhere
// a "what is the right answer for v0x?" question shows up, it routes through
// here so problem types and panels agree.

const TARGET_LABELS = {
    v0:     { label: 'v₀',       unit: 'm/s', decimals: 2 },
    theta:  { label: 'θ',        unit: '°',   decimals: 1 },
    v0x:    { label: 'v₀x',      unit: 'm/s', decimals: 2 },
    v0y:    { label: 'v₀ᵧ',      unit: 'm/s', decimals: 2 },
    dx:     { label: 'Δx',       unit: 'm',   decimals: 2 },
    dy:     { label: 'Δy',       unit: 'm',   decimals: 2 },
    hmax:   { label: 'hₘₐₓ',    unit: 'm',   decimals: 2 },
    time:   { label: 't',        unit: 's',   decimals: 2 },
    vy:     { label: 'vᵧ',       unit: 'm/s', decimals: 2 },
    finalV: { label: 'v(final)', unit: 'm/s', decimals: 2 },
    ay:     { label: 'aᵧ',       unit: 'm/s²', decimals: 2 }
};

const NUMERIC_TARGETS = Object.keys(TARGET_LABELS);

export function resolveExpectedValue(target, model) {
    if (!model) return null;
    switch (target) {
        case 'v0':     return model.vi;
        case 'theta':  return model.angleDeg;
        case 'v0x':    return model.vix;
        case 'v0y':    return model.viy;
        case 'dx':     return model.range;
        case 'dy':     return (model.yf - model.yi);
        case 'hmax':   return (model.yPeak - model.yi);
        case 'time':   return model.tFlight;
        case 'vy':     return model.finalVy;
        case 'finalV': return model.finalSpeed;
        case 'ay':     return -model.g;
        default:       return null;
    }
}

export function formatExpectedValue(target, model) {
    const meta = TARGET_LABELS[target];
    const value = resolveExpectedValue(target, model);
    if (!meta || !Number.isFinite(value)) return '';
    return `${value.toFixed(meta.decimals)} ${meta.unit}`.trim();
}

export function getTargetLabel(target) {
    return TARGET_LABELS[target]?.label || target;
}

export function getNumericTargets() {
    return [...NUMERIC_TARGETS];
}

// =============================================================================
// Equation pickers
// =============================================================================
// Two pickers, each with its own list of chips:
//
//   pickerKind: 'kinematic'        — the four 1D kinematic equations.
//   pickerKind: 'vector-triangle'  — sin / cos / Pythagorean / tangent.
//
// Steps that don't fit either picker (e.g. the projectile range shortcut,
// the summary step) declare a SPECIAL_EQUATIONS token; the chosen picker
// still renders, plus a "None of these" chip, and "None of these" is the
// right answer.

export const KINEMATIC_EQUATIONS = [
    { id: 'eq1', label: 'vf = vi + a · t',          description: 'Velocity from acceleration and time' },
    { id: 'eq2', label: 'Δx = vi · t + ½ a · t²',  description: 'Displacement from initial velocity, time, and acceleration' },
    { id: 'eq3', label: 'vf² = vi² + 2 a · Δx',    description: 'Final velocity from displacement (no t)' },
    { id: 'eq4', label: 'Δx = ½ (vi + vf) · t',    description: 'Displacement from average velocity' }
];

export const VECTOR_TRIANGLE_EQUATIONS = [
    { id: 'tri-cos',  label: 'vx = v · cos θ',         description: 'Adjacent leg from magnitude and angle' },
    { id: 'tri-sin',  label: 'vy = v · sin θ',         description: 'Opposite leg from magnitude and angle' },
    { id: 'tri-pyth', label: '|v| = √(vx² + vy²)',     description: 'Magnitude from two perpendicular legs' },
    { id: 'tri-tan',  label: 'θ = atan(vy / vx)',      description: 'Angle from two perpendicular legs' }
];

export const SPECIAL_EQUATIONS = {
    'range-shortcut': { label: 'Projectile range shortcut: R = v₀² sin(2θ) / g', reason: 'This step uses a derived shortcut, not one of the listed equations.' },
    none:             { label: 'No equation needed',                              reason: 'This step is an observation, not an equation application.' }
};

export const kinematicEquationByStepId = {
    // Components step: trig decomposition. v0x = cos, v0y = sin.
    'components:v0x':           { pickerKind: 'vector-triangle', id: 'tri-cos' },
    'components:v0y':           { pickerKind: 'vector-triangle', id: 'tri-sin' },

    // Single-axis kinematic steps.
    horizontal:                 { pickerKind: 'kinematic', id: 'eq2' },        // Δx = vix · t (a = 0)
    vertical:                   { pickerKind: 'kinematic', id: 'eq2' },        // Δy = viy · t + ½ a t²
    time:                       { pickerKind: 'kinematic', id: 'eq2' },        // solve eq2 for t
    range:                      { pickerKind: 'kinematic', id: 'eq2' },        // Δx = vix · t
    'live-equation-vyf':        { pickerKind: 'kinematic', id: 'eq1' },        // vy = viy + a · t

    // vertical-result has three results: two kinematic, one triangle.
    'vertical-result:hmax':     { pickerKind: 'kinematic',       id: 'eq3' },  // 0 = viy² + 2 a Δy at peak
    'vertical-result:vy':       { pickerKind: 'kinematic',       id: 'eq1' },
    'vertical-result:v0y':      { pickerKind: 'kinematic',       id: 'eq3' },
    'vertical-result:finalV':   { pickerKind: 'vector-triangle', id: 'tri-pyth' },

    // Reconstruct: triangle work going from components to magnitude+angle.
    'reconstruct:finalV':       { pickerKind: 'vector-triangle', id: 'tri-pyth' },
    'reconstruct:angle':        { pickerKind: 'vector-triangle', id: 'tri-tan' },
    'reconstruct:v0':           { pickerKind: 'vector-triangle', id: 'tri-pyth' },
    'reconstruct:theta':        { pickerKind: 'vector-triangle', id: 'tri-tan' },

    // Steps that don't fit either picker.
    shortcut:                   { pickerKind: 'kinematic',       id: 'range-shortcut' },
    summary:                    { pickerKind: 'kinematic',       id: 'none' }
};

const PICKER_REGISTRY = {
    'kinematic':       { equations: KINEMATIC_EQUATIONS, label: 'kinematic equation' },
    'vector-triangle': { equations: VECTOR_TRIANGLE_EQUATIONS, label: 'triangle equation' }
};

export function getKinematicEquations() {
    return KINEMATIC_EQUATIONS.map(eq => ({ ...eq }));
}

export function getVectorTriangleEquations() {
    return VECTOR_TRIANGLE_EQUATIONS.map(eq => ({ ...eq }));
}

export function getEquationsForPicker(pickerKind) {
    return (PICKER_REGISTRY[pickerKind]?.equations || []).map(eq => ({ ...eq }));
}

export function getPickerLabel(pickerKind) {
    return PICKER_REGISTRY[pickerKind]?.label || 'equation';
}

export function getKinematicEquationForStep(stepId, target = null) {
    if (!stepId) return null;
    const keyed = target ? `${stepId}:${target}` : null;
    const entry = (keyed && kinematicEquationByStepId[keyed]) || kinematicEquationByStepId[stepId];
    if (!entry) return null;

    const pool = PICKER_REGISTRY[entry.pickerKind]?.equations || [];
    const standard = pool.find(eq => eq.id === entry.id);
    if (standard) {
        return { ...standard, pickerKind: entry.pickerKind, isSpecial: false };
    }

    const special = SPECIAL_EQUATIONS[entry.id];
    if (special) {
        return {
            id: entry.id,
            pickerKind: entry.pickerKind,
            label: special.label,
            reason: special.reason,
            isSpecial: true
        };
    }

    return null;
}

// =============================================================================
// Tasks: auto-derivation, signatures, and the givens-step factory
// =============================================================================

/**
 * Auto-derive a tasks array for a step that doesn't define one. Each
 * `resultValues` entry produces TWO tasks: a `formula-pick` (which canonical
 * equation does this step apply?) followed by a `numeric` (compute the value).
 * Steps without a registered canonical equation skip the formula-pick and
 * emit only the numeric task. Steps with no result values (e.g. summary)
 * get a single 'acknowledge' task.
 *
 * Hand-authored `step.tasks` always wins.
 */
export function getDefaultTasksForStep(step) {
    if (Array.isArray(step?.tasks) && step.tasks.length) return step.tasks;

    const results = Array.isArray(step?.resultValues) ? step.resultValues : [];
    if (!results.length) {
        return [{
            id: 'acknowledge',
            kind: 'acknowledge',
            target: null,
            prompt: 'Review this step, then continue when ready.'
        }];
    }

    const tasks = [];
    for (const target of results) {
        const equation = getKinematicEquationForStep(step?.id, target);
        if (equation) {
            tasks.push({
                id: `pick-formula-${target}`,
                kind: 'formula-pick',
                target,
                pickerKind: equation.pickerKind,
                expectedEquationId: equation.id,
                prompt: equation.isSpecial
                    ? `Which equation applies for ${getTargetLabel(target)}?`
                    : `Which ${getPickerLabel(equation.pickerKind)} gives you ${getTargetLabel(target)}?`
            });
        }
        tasks.push({
            id: `enter-${target}`,
            kind: 'numeric',
            target,
            prompt: `Enter the value for ${getTargetLabel(target)}.`
        });
    }
    return tasks;
}

/**
 * Stable identity for a task across problems. The proficiency tracker keys
 * on this; problem-type-specific wording (step.id, step.title) is
 * intentionally NOT part of the signature so "compute v0x" is one skill
 * whether it shows up in type1, type5, or type6.
 *
 * Hand-authored tasks can pass `skillKey` to override the default.
 */
export function getTaskSignature(task) {
    if (!task) return null;
    if (task.skillKey) return task.skillKey;
    const target = task.target ? `:${task.target}` : '';
    return `${task.kind || 'unknown'}${target}`;
}

/**
 * Build the "step 0: identify the givens" step. Prepended to every problem
 * type so students start by parsing the problem before any algebra. The skill
 * key is fixed at `multi-select:givens` so proficiency on this skill
 * accumulates across every problem type.
 */
export function buildGivensStep(knownVariables, options = {}) {
    const expected = Object.keys(knownVariables || {}).filter(Boolean);
    const pool = options.pool || ['v0', 'theta', 'v0x', 'v0y', 'dx', 'dy', 'time', 'hmax'];
    return {
        id: 'givens',
        title: 'Identify The Givens',
        accent: '#0f172a',
        // Show the FULL pool on the canvas as selectable elements — students
        // need to be able to mis-pick a wrong one for the feedback to mean
        // anything.
        focusLabel: 'Tag every quantity the problem hands you',
        focusValues: pool,
        resultValues: [],
        lines: ['Mark each given on the canvas or in the variable list.'],
        tasks: [{
            id: 'select-givens',
            kind: 'multi-select',
            skillKey: 'multi-select:givens',
            expected,
            pool,
            prompt: 'Select every quantity given in the problem.',
            hint: 'Re-read the problem statement; tag each value the student is told (and only those).'
        }]
    };
}
