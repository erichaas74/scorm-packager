import {
    getProblemTypeNumber,
    resolveProblemTypeOption,
    getSequenceState
} from './workAnalysis.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const CLIFF_LAUNCH_OPTION = '8: given vx, height drop, horizontal launch off a cliff';
const PLANE_DROP_OPTION = '9: given vx, height drop, airplane package drop';

const focusValuesByStepId = {
    components: ['v0', 'v0x', 'v0y'],
    vertical: ['dy', 'ay', 'time'],
    range: ['dx', 'v0x', 'time'],
    'vertical-result': ['vy', 'finalV'],
    summary: ['time', 'dx', 'vy', 'finalV']
};

const resultValueByStepId = {
    components: 'v0x',
    vertical: 'time',
    range: 'dx',
    'vertical-result': 'finalV',
    summary: null
};

const resultValuesByStepId = {
    components: ['v0x', 'v0y'],
    vertical: ['time'],
    range: ['dx'],
    'vertical-result': ['vy', 'finalV'],
    summary: []
};

function withFocusMetadata(step) {
    return {
        focusValues: focusValuesByStepId[step.id] || [],
        resultValue: resultValueByStepId[step.id] ?? null,
        resultValues: resultValuesByStepId[step.id] || [],
        equation: Array.isArray(step.lines) && step.lines.length >= 2
            ? {
                formula: step.lines[0],
                substitution: step.lines.length > 2 ? step.lines.slice(1, -1).join('  |  ') : null,
                result: step.lines[step.lines.length - 1],
                resultValue: resultValueByStepId[step.id] ?? null
            }
            : null,
        ...step
    };
}

export function getWorkAnalysisProblemTypeDefinitions() {
    return {
        '8': {
            option: CLIFF_LAUNCH_OPTION,
            title: 'Given vx and height drop for a horizontal launch off a cliff'
        },
        '9': {
            option: PLANE_DROP_OPTION,
            title: 'Given vx and height drop for an airplane package drop'
        }
    };
}

export function getWorkAnalysisProblemTypeOptions() {
    const definitions = getWorkAnalysisProblemTypeDefinitions();
    return Object.values(definitions).map((definition) => definition.option);
}

export function getSample2dKinematicsProblems() {
    return {
        custom: {
            id: 'custom',
            title: 'Custom / None',
            prompt: '',
            settings: {}
        },
        type8: {
            id: 'type8',
            title: 'Type 8: Horizontal launch off a cliff',
            prompt: 'A ball is launched horizontally at 22.0 m/s from the edge of a cliff that is 35 m above the water. Find the fall time, horizontal distance traveled, and impact velocity.',
            settings: {
                workAnalysisProblemType: CLIFF_LAUNCH_OPTION,
                scenarioType: 'Lower Landing / Cliff',
                initialVelocity: 22,
                launchAngle: 0,
                givenVx: 22,
                givenHeightDrop: 35,
                givenDy: -35,
                initialHeight: 35,
                landingHeight: 0,
                objectType: 'Ball'
            }
        },
        type9: {
            id: 'type9',
            title: 'Type 9: Airplane package drop',
            prompt: 'An airplane releases a rescue package while flying horizontally at 28.0 m/s from a height of 45 m above the beach. Find the fall time, horizontal distance traveled, and impact velocity.',
            settings: {
                workAnalysisProblemType: PLANE_DROP_OPTION,
                scenarioType: 'Lower Landing / Cliff',
                initialVelocity: 28,
                launchAngle: 0,
                givenVx: 28,
                givenHeightDrop: 45,
                givenDy: -45,
                initialHeight: 45,
                landingHeight: 0,
                objectType: 'Block'
            }
        }
    };
}

export function getSample2dKinematicsProblemOptions() {
    return Object.values(getSample2dKinematicsProblems()).map((sample) => sample.title);
}

export function getSample2dKinematicsProblemByTitle(title) {
    return Object.values(getSample2dKinematicsProblems()).find((sample) => sample.title === title)
        || getSample2dKinematicsProblems().custom;
}

export function resolveWorkAnalysisProblemTypeOption(value, normalizeToken) {
    const definitions = getWorkAnalysisProblemTypeDefinitions();
    const resolved = resolveProblemTypeOption(value, definitions, normalizeToken);
    return (!resolved || resolved === 'Auto') ? CLIFF_LAUNCH_OPTION : resolved;
}

export function getWorkAnalysisProblemTypeNumber(value, normalizeToken) {
    const definitions = getWorkAnalysisProblemTypeDefinitions();
    return getProblemTypeNumber(resolveWorkAnalysisProblemTypeOption(value, normalizeToken), definitions, normalizeToken) || '8';
}

export function getWorkAnalysisKnownVariablesForType(typeNumber) {
    if (!['8', '9'].includes(String(typeNumber))) return null;
    return { v0: true, v0x: true, v0y: true, dy: true, theta: true };
}

export function getVisiblePhysicsParameterKeys(typeNumber) {
    if (!['8', '9'].includes(String(typeNumber))) return [];
    return ['givenVx', 'givenHeightDrop'];
}

export function getRandomizedProblemTypeInputUpdates(typeNumber) {
    const randomBetween = (min, max, digits = 0) => {
        const factor = 10 ** digits;
        return Math.round((min + (Math.random() * (max - min))) * factor) / factor;
    };
    const heightDrop = randomBetween(18, 80, 0);
    const vx = randomBetween(14, 38, 1);
    const isPlaneDrop = String(typeNumber) === '9';
    return {
        scenarioType: 'Lower Landing / Cliff',
        initialVelocity: vx,
        launchAngle: 0,
        givenVx: vx,
        givenHeightDrop: heightDrop,
        givenDy: -heightDrop,
        initialHeight: heightDrop,
        landingHeight: 0,
        objectType: isPlaneDrop ? 'Block' : 'Ball'
    };
}

export function getScenarioForDeltaY(dy) {
    return dy < 0 ? 'Lower Landing / Cliff' : (dy > 0 ? 'Higher Landing' : 'Standard Projectile');
}

export function componentsToLaunchValues(vx, vy) {
    const vi = Math.sqrt((vx * vx) + (vy * vy));
    const angleDeg = Math.atan2(vy, vx) * (180 / Math.PI);
    return { vi, angleDeg };
}

export function getProblemTypeScenarioValues(typeNumber, inputs, g, helpers = {}) {
    if (!['8', '9'].includes(String(typeNumber))) return null;

    const toNumber = helpers.normalizeNumber || ((value, fallback) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    });
    const limit = helpers.clamp || clamp;
    const vx = Math.max(0.01, toNumber(inputs.givenVx, 28));
    const heightDrop = Math.max(0.01, toNumber(inputs.givenHeightDrop, 45));

    return {
        scenarioType: 'Lower Landing / Cliff',
        vi: vx,
        angleDeg: 0,
        yi: limit(heightDrop, 0.01, Number.MAX_SAFE_INTEGER),
        yf: 0,
        g
    };
}

export function getSelectedWorkAnalysisProblemType(model, inputs, normalizeToken) {
    const typeNumber = getWorkAnalysisProblemTypeNumber(inputs?.workAnalysisProblemType, normalizeToken);
    if (typeNumber === '9') {
        return {
            id: 'type9',
            number: 9,
            title: 'Problem Type 9: Airplane package drop'
        };
    }

    return {
        id: 'type8',
        number: 8,
        title: 'Problem Type 8: Horizontal launch off a cliff'
    };
}

export function getWorkAnalysisTypeConfigs(model, problemType = { id: 'type8' }) {
    const dy = model.yf - model.yi;
    const drop = Math.abs(dy);
    const isPlaneDrop = problemType.id === 'type9';
    const steps = [
        {
            id: 'components',
            title: 'Set Horizontal Launch',
            accent: '#1d4ed8',
            focusLabel: isPlaneDrop
                ? 'The package keeps the airplane\'s horizontal speed at release'
                : 'The projectile leaves the edge with only horizontal speed',
            lines: [
                `v₀x = ${model.vix.toFixed(2)} m/s`,
                'v₀ᵧ = 0.00 m/s'
            ]
        },
        {
            id: 'vertical',
            title: 'Solve Fall Time',
            accent: '#047857',
            focusLabel: 'Use the vertical free-fall equation',
            lines: [
                'Δy = v₀ᵧt - ½gt²',
                `${dy.toFixed(2)} = 0 - ½(${model.g.toFixed(2)})t²`,
                `t = ${model.tFlight.toFixed(2)} s`
            ]
        },
        {
            id: 'range',
            title: 'Solve Horizontal Distance',
            accent: '#ea580c',
            focusLabel: 'Horizontal speed stays constant during the fall',
            lines: [
                'Δx = v₀x t',
                `Δx = ${model.vix.toFixed(2)}(${model.tFlight.toFixed(2)})`,
                `Δx = ${model.range.toFixed(2)} m`
            ]
        },
        {
            id: 'vertical-result',
            title: 'Find Impact Velocity',
            accent: '#059669',
            focusLabel: 'Gravity builds the final vertical speed',
            lines: [
                'vᵧf = vᵧi + aᵧt',
                `vᵧf = 0 + (-${model.g.toFixed(2)})(${model.tFlight.toFixed(2)})`,
                `vᵧf = ${model.finalVy.toFixed(2)} m/s`,
                `v(final) = ${model.finalSpeed.toFixed(2)} m/s`
            ]
        },
        {
            id: 'summary',
            title: 'Answer Summary',
            accent: '#0f172a',
            focusLabel: isPlaneDrop ? 'Collect the airplane-drop results' : 'Collect the cliff-launch results',
            lines: [
                `Height drop = ${drop.toFixed(2)} m`,
                `Time = ${model.tFlight.toFixed(2)} s`,
                `Range = ${model.range.toFixed(2)} m`,
                `Final speed = ${model.finalSpeed.toFixed(2)} m/s`
            ]
        }
    ];

    return {
        type8: {
            id: 'type8',
            steps: steps.map(withFocusMetadata)
        },
        type9: {
            id: 'type9',
            steps: steps.map(withFocusMetadata)
        }
    };
}

export function getConfiguredWorkAnalysisSteps(model, problemType = { id: 'type8' }) {
    const configs = getWorkAnalysisTypeConfigs(model, problemType);
    return configs[problemType.id]?.steps || configs.type8.steps;
}

export function getWorkAnalysisSequenceState(model, stepDuration, clampValue = clamp) {
    return getSequenceState({
        steps: model.workAnalysisSteps || [],
        visualTime: model.visualTime,
        breakdownDuration: model.breakdownDuration,
        workAnalysisDuration: model.workAnalysisDuration,
        stepDuration,
        clamp: clampValue
    });
}