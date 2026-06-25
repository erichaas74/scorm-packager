// Shared helpers for the 2D kinematics step walkthrough.

export const normalizeWorkAnalysisToken = (value) =>
    String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '');

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

export const stepCanvasAnchors = {
    intro:               { phase: 'launch',    progress: 0.00 },
    givens:              { phase: 'breakdown', progress: 1.00 },
    'vector-breakdown':  { phase: 'breakdown', progress: 0.95 },
    components:          { phase: 'breakdown', progress: 0.95 },
    equation:            { phase: 'breakdown', progress: 1.00 },
    solve:               { phase: 'landing',   progress: 1.00 },
    'final-vector':      { phase: 'final',     progress: 1.00 },
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

export function buildGivensStep(knownVariables) {
    const expected = Object.keys(knownVariables || {}).filter(Boolean);
    return {
        id: 'givens',
        title: 'Identify The Givens',
        accent: '#0f172a',
        focusLabel: 'Tag every quantity the problem hands you',
        focusValues: expected,
        resultValues: [],
        lines: ['Mark each given on the canvas or in the variable list.']
    };
}
