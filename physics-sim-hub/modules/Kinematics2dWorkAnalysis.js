// =============================================================================
// Kinematics2dWorkAnalysis.js — complete drop-in replacement
// =============================================================================
// All original behavior is preserved (problem-type definitions, sample
// problems, scenario solver, randomized inputs, step-id metadata, model →
// steps configuration).
//
// Two pedagogical extensions are baked in here so the rest of the rebuild
// can rely on them:
//
//   1. buildGivensStep is prepended to every problem type as step 0.
//      Students start by tagging every quantity the problem hands them
//      (multi-select task) before any algebra.
//
//   2. The 'components' step in projectile-launch types is augmented with a
//      hand-authored task chain: click v0 → click theta → pick the cosine
//      equation → drag the v0x arrow → compute v0x → pick the sine equation
//      → drag the v0y arrow → compute v0y. Each is a separately tracked
//      skill via the proficiency module.
//
// Every other step's tasks are auto-derived from its `resultValues` by
// getDefaultTasksForStep (in workAnalysis.js), which weaves a formula-pick
// before each numeric task.
// =============================================================================

import {
    buildGivensStep,
    getProblemTypeNumber,
    getProblemTypeOptions,
    getSequenceState,
    normalizeWorkAnalysisToken,
    resolveProblemTypeOption,
    stepCanvasAnchors,
    timeForStepAnchor
} from './workAnalysis.js';

export { stepCanvasAnchors, timeForStepAnchor };

// -----------------------------------------------------------------------------
// Local helpers (unchanged from the original module)
// -----------------------------------------------------------------------------

const normalizeNumber = (value, fallback = 0) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
};
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const randomBetween = (min, max, decimals = 0, random = Math.random) => {
    const factor = 10 ** decimals;
    return Math.round((min + random() * (max - min)) * factor) / factor;
};

const randomSignedMagnitude = (min, max, decimals = 0, random = Math.random) => {
    const sign = random() < 0.5 ? -1 : 1;
    return sign * randomBetween(min, max, decimals, random);
};

// -----------------------------------------------------------------------------
// Problem-type definitions and sample problems (unchanged)
// -----------------------------------------------------------------------------

export function getWorkAnalysisProblemTypeDefinitions() {
    return {
        '1': {
            option: '1: given v0, theta, delta y = 0',
            title: 'Given v0, theta, and level landing'
        },
        '2': {
            option: '2: given v0, theta, delta y',
            title: 'Given v0, theta, and delta y'
        },
        '3': {
            option: '3: given v0x, v0y, delta y',
            title: 'Given v0x, v0y, and delta y'
        },
        '4': {
            option: '4: given delta x, delta y, time',
            title: 'Given delta x, delta y, and time'
        },
        '5': {
            option: '5: given delta x, delta y, theta',
            title: 'Given delta x, delta y, and theta'
        },
        '6': {
            option: '6: given range, theta, same height',
            title: 'Given range and theta for same-height launch'
        },
        '7': {
            option: '7: given range, hmax, same height',
            title: 'Given range and hmax for same-height launch'
        },
        '8': {
            option: '8: given vx, height drop, horizontal launch',
            title: 'Given vx and height drop for horizontal launch'
        }
    };
}

export function getSample2dKinematicsProblems() {
    return {
        custom: {
            id: 'custom',
            title: 'Custom / None',
            prompt: '',
            settings: {}
        },
        type1: {
            id: 'type1',
            title: 'Type 1: Level launch with v0 and theta',
            prompt: 'A basketball is launched from floor level at 24.0 m/s and 52 degrees above the horizontal. It lands at the same height, so delta y = 0 m. Find the flight time, horizontal range, maximum height, and final velocity.',
            settings: {
                workAnalysisProblemType: '1: given v0, theta, delta y = 0',
                scenarioType: 'Standard Projectile',
                initialVelocity: 24,
                launchAngle: 52,
                givenDy: 0
            }
        },
        type2: {
            id: 'type2',
            title: 'Type 2: Nonlevel launch with v0, theta, and delta y',
            prompt: 'A soccer ball is kicked from a 1.5 m platform at 19.0 m/s and 38 degrees above the horizontal. It lands on a field 6.0 m lower than the launch point. Find the time in the air, range, and impact velocity.',
            settings: {
                workAnalysisProblemType: '2: given v0, theta, delta y',
                scenarioType: 'Lower Landing / Cliff',
                initialVelocity: 19,
                launchAngle: 38,
                givenDy: -6
            }
        },
        type3: {
            id: 'type3',
            title: 'Type 3: Given v0x, v0y, and delta y',
            prompt: 'A stunt object leaves a ramp with horizontal velocity 16.0 m/s and vertical velocity 12.0 m/s. It lands 4.0 m below its launch point. Find the flight time, range, launch speed, and launch angle.',
            settings: {
                workAnalysisProblemType: '3: given v0x, v0y, delta y',
                scenarioType: 'Lower Landing / Cliff',
                givenVx: 16,
                givenVy: 12,
                givenDy: -4
            }
        },
        type4: {
            id: 'type4',
            title: 'Type 4: Given delta x, delta y, and time',
            prompt: 'A package follows a projectile path and lands 140 m horizontally from its release point after 4.2 s. The landing point is 18 m below the release point. Find the initial horizontal and vertical velocity components.',
            settings: {
                workAnalysisProblemType: '4: given delta x, delta y, time',
                scenarioType: 'Lower Landing / Cliff',
                givenDx: 140,
                givenDy: -18,
                givenTime: 4.2
            }
        },
        type5: {
            id: 'type5',
            title: 'Type 5: Given delta x, delta y, and theta',
            prompt: 'A golf ball must clear a rise and land 185 m away on ground 9.0 m higher than where it was hit. The launch angle is 41 degrees. Find the required launch speed and flight time.',
            settings: {
                workAnalysisProblemType: '5: given delta x, delta y, theta',
                scenarioType: 'Higher Landing',
                givenDx: 185,
                givenDy: 9,
                launchAngle: 41
            }
        },
        type6: {
            id: 'type6',
            title: 'Type 6: Same-height range and theta',
            prompt: 'A water balloon is thrown across level ground and lands 72 m away. The launch angle is 36 degrees. Find the launch speed, time of flight, and maximum height.',
            settings: {
                workAnalysisProblemType: '6: given range, theta, same height',
                scenarioType: 'Standard Projectile',
                givenDx: 72,
                givenDy: 0,
                launchAngle: 36
            }
        },
        type7: {
            id: 'type7',
            title: 'Type 7: Same-height range and max height',
            prompt: 'A firework shell travels 210 m horizontally before returning to its launch height. Its maximum height above launch is 48 m. Find the initial velocity components, launch speed, and launch angle.',
            settings: {
                workAnalysisProblemType: '7: given range, hmax, same height',
                scenarioType: 'Standard Projectile',
                givenDx: 210,
                givenDy: 0,
                givenHmax: 48
            }
        },
        type8: {
            id: 'type8',
            title: 'Type 8: Horizontal launch from a height',
            prompt: 'A rescue package is released horizontally from a helicopter moving at 28.0 m/s. The package falls 45 m to the ground. Find the fall time, horizontal distance traveled, and impact velocity.',
            settings: {
                workAnalysisProblemType: '8: given vx, height drop, horizontal launch',
                scenarioType: 'Lower Landing / Cliff',
                givenVx: 28,
                givenHeightDrop: 45,
                givenDy: -45
            }
        }
    };
}

export function getSample2dKinematicsProblemOptions() {
    return Object.values(getSample2dKinematicsProblems()).map(sample => sample.title);
}

export function getSample2dKinematicsProblemByTitle(title) {
    const samples = getSample2dKinematicsProblems();
    return Object.values(samples).find(sample => sample.title === title) || samples.custom;
}

const workAnalysisProblemTypeTitles = {
    '1': 'Problem Type 1: Given v₀, θ, and level landing',
    '2': 'Problem Type 2: Given v₀, θ, and Δy',
    '3': 'Problem Type 3: Given v₀x, v₀y, and Δy',
    '4': 'Problem Type 4: Given Δx, Δy, and t',
    '5': 'Problem Type 5: Given Δx, Δy, and θ',
    '6': 'Problem Type 6: Given range and θ',
    '7': 'Problem Type 7: Given range and hₘₐₓ',
    '8': 'Problem Type 8: Horizontal launch from a height'
};

// -----------------------------------------------------------------------------
// Step-id metadata (unchanged)
// -----------------------------------------------------------------------------

const focusValuesByStepId = {
    components: ['v0', 'theta', 'v0x', 'v0y'],
    vertical: ['dy', 'v0y', 'ay'],
    time: ['time', 'dy', 'v0y'],
    range: ['dx', 'v0x', 'time'],
    horizontal: ['dx', 'v0x', 'time'],
    'vertical-result': ['hmax', 'vy', 'finalV'],
    'live-equation-vyf': ['v0y', 'ay', 'time', 'vy'],
    summary: ['time', 'dx', 'hmax', 'finalV'],
    reconstruct: ['v0x', 'v0y', 'v0', 'theta'],
    shortcut: ['dx', 'theta', 'v0'],
};

const resultValueByStepId = {
    components: 'v0x',
    vertical: 'dy',
    time: 'time',
    range: 'dx',
    horizontal: 'v0x',
    'vertical-result': 'hmax',
    'live-equation-vyf': 'vy',
    summary: null,
    reconstruct: 'v0',
    shortcut: 'v0'
};

const resultValuesByStepId = {
    components: ['v0x', 'v0y'],
    vertical: ['dy'],
    time: ['time'],
    range: ['dx'],
    horizontal: ['v0x'],
    'vertical-result': ['hmax', 'vy', 'finalV'],
    'live-equation-vyf': ['vy'],
    summary: [],
    reconstruct: ['v0', 'theta'],
    shortcut: ['v0']
};

const equationStepIds = new Set([
    'vertical',
    'time',
    'range',
    'horizontal',
    'vertical-result',
    'live-equation-vyf',
    'reconstruct',
    'shortcut'
]);

function buildEquationMetadata(step) {
    if (!equationStepIds.has(step.id) || !Array.isArray(step.lines) || step.lines.length < 2) {
        return null;
    }

    const [formula, ...rest] = step.lines;
    const result = rest.pop();
    const substitution = rest.length ? rest.join('  |  ') : null;

    return {
        formula,
        substitution,
        result,
        resultValue: resultValueByStepId[step.id] ?? null
    };
}

function withFocusMetadata(step) {
    const merged = {
        focusValues: focusValuesByStepId[step.id] || [],
        resultValue: resultValueByStepId[step.id] ?? null,
        resultValues: resultValuesByStepId[step.id] || [],
        equation: buildEquationMetadata(step),
        ...step
    };
    // Keep resultValue consistent with the merged resultValues so that canvas
    // highlight logic never shows a stale "solved" value for acknowledge steps
    // (those that explicitly set resultValues: []).
    const rv = merged.resultValues;
    if (!Array.isArray(rv) || !rv.length) {
        merged.resultValue = null;
    } else if (!rv.includes(merged.resultValue)) {
        merged.resultValue = rv[0];
    }
    return merged;
}

// -----------------------------------------------------------------------------
// Components-step augmenter
// -----------------------------------------------------------------------------
// Hand-author the components step's task list. The auto-derive in workAnalysis
// would weave formula-pick + numeric for each result; here we add canvas-pick
// (find the resultant + angle on the canvas) and vector-decompose (physically
// drag the component arrows) on either side of the formula-pick.
//
// Eight tasks total per components step. Each maps to its own skill signature
// in the proficiency tracker, so a student weak on any one of the eight (e.g.
// can compute the trig but can't visualize the triangle) keeps seeing that
// task come back while the others unlock skip suggestions.

const augmentComponentsStep = (step) => {
    if (step.id !== 'components') return step;
    if (!step.componentWalkthrough) return step;
    return {
        ...step,
        tasks: [
            { id: 'pick-v0',          kind: 'canvas-pick',     target: 'v0',    prompt: 'Click the resultant launch velocity vector.' },
            { id: 'pick-theta',       kind: 'canvas-pick',     target: 'theta', prompt: 'Click the launch angle.' },
            { id: 'pick-formula-v0x', kind: 'formula-pick',    target: 'v0x',
              pickerKind: 'vector-triangle', expectedEquationId: 'tri-cos',
              equationIds: ['tri-sin', 'tri-cos', 'tri-tan'], hideNoneOption: true,
              prompt: 'Which triangle equation gives you v₀x?' },
            { id: 'decompose-v0x',    kind: 'vector-decompose', target: 'v0x',
              prompt: 'Drag horizontally from the launch point until the readout matches v₀x.' },
            { id: 'enter-v0x',        kind: 'numeric',         target: 'v0x',   prompt: 'Compute v₀x.' },
            { id: 'pick-formula-v0y', kind: 'formula-pick',    target: 'v0y',
              pickerKind: 'vector-triangle', expectedEquationId: 'tri-sin',
              equationIds: ['tri-sin', 'tri-cos', 'tri-tan'], hideNoneOption: true,
              prompt: 'Which triangle equation gives you v₀ᵧ?' },
            { id: 'decompose-v0y',    kind: 'vector-decompose', target: 'v0y',
              prompt: 'Drag vertically from the end of the v₀x leg until the readout matches v₀ᵧ.' },
            { id: 'enter-v0y',        kind: 'numeric',         target: 'v0y',   prompt: 'Compute v₀ᵧ.' }
        ]
    };
};

// -----------------------------------------------------------------------------
// Public option / resolution helpers (unchanged)
// -----------------------------------------------------------------------------

export function getWorkAnalysisProblemTypeOptions() {
    return getProblemTypeOptions(getWorkAnalysisProblemTypeDefinitions());
}

export function resolveWorkAnalysisProblemTypeOption(value, normalizeToken = normalizeWorkAnalysisToken) {
    return resolveProblemTypeOption(value, getWorkAnalysisProblemTypeDefinitions(), normalizeToken);
}

export function getWorkAnalysisProblemTypeNumber(value, normalizeToken = normalizeWorkAnalysisToken) {
    return getProblemTypeNumber(value, getWorkAnalysisProblemTypeDefinitions(), normalizeToken);
}

export function getWorkAnalysisKnownVariablesForType(typeNumber) {
    const presets = {
        '1': { v0: true, theta: true, dy: true },
        '2': { v0: true, theta: true, dy: true },
        '3': { v0x: true, v0y: true, dy: true },
        '4': { dx: true, dy: true, time: true },
        '5': { dx: true, dy: true, theta: true },
        '6': { dx: true, dy: true, theta: true },
        '7': { dx: true, dy: true, hmax: true },
        '8': { v0x: true, dy: true }
    };
    return presets[typeNumber] || null;
}

export function getVisiblePhysicsParameterKeys(typeNumber) {
    const always = ['workAnalysisProblemType', 'gravity'];
    const typeSpecific = {
        '1': ['initialVelocity', 'launchAngle'],
        '2': ['initialVelocity', 'launchAngle', 'givenDy'],
        '3': ['givenVx', 'givenVy', 'givenDy'],
        '4': ['givenDx', 'givenDy', 'givenTime'],
        '5': ['givenDx', 'givenDy', 'launchAngle'],
        '6': ['givenDx', 'launchAngle'],
        '7': ['givenDx', 'givenHmax'],
        '8': ['givenVx', 'givenHeightDrop']
    };

    if (!typeNumber) {
        return [...always, 'initialVelocity', 'launchAngle', 'initialHeight', 'landingHeight'];
    }

    return [...always, ...(typeSpecific[typeNumber] || [])];
}

export function getRandomizedProblemTypeInputUpdates(typeNumber, random = Math.random) {
    const updatesByType = {
        '1': () => ({
            scenarioType: "Standard Projectile",
            initialVelocity: randomBetween(16, 34, 1, random),
            launchAngle: randomBetween(30, 70, 0, random),
            givenDy: 0
        }),
        '2': () => {
            const dy = randomSignedMagnitude(5, 22, 1, random);
            return {
                scenarioType: dy >= 0 ? "Higher Landing" : "Lower Landing / Cliff",
                initialVelocity: randomBetween(18, 36, 1, random),
                launchAngle: randomBetween(28, 66, 0, random),
                givenDy: dy
            };
        },
        '3': () => {
            const dy = randomSignedMagnitude(4, 18, 1, random);
            return {
                scenarioType: dy >= 0 ? "Higher Landing" : "Lower Landing / Cliff",
                givenVx: randomBetween(11, 30, 1, random),
                givenVy: randomBetween(8, 26, 1, random),
                givenDy: dy
            };
        },
        '4': () => {
            const dy = randomSignedMagnitude(4, 20, 1, random);
            return {
                scenarioType: dy >= 0 ? "Higher Landing" : "Lower Landing / Cliff",
                givenDx: randomBetween(80, 260, 0, random),
                givenDy: dy,
                givenTime: randomBetween(3, 7, 1, random)
            };
        },
        '5': () => {
            const dy = randomSignedMagnitude(4, 16, 1, random);
            return {
                scenarioType: dy >= 0 ? "Higher Landing" : "Lower Landing / Cliff",
                givenDx: randomBetween(80, 220, 0, random),
                givenDy: dy,
                launchAngle: randomBetween(30, 65, 0, random)
            };
        },
        '6': () => ({
            scenarioType: "Standard Projectile",
            givenDx: randomBetween(110, 320, 0, random),
            givenDy: 0,
            launchAngle: randomBetween(28, 62, 0, random)
        }),
        '7': () => ({
            scenarioType: "Standard Projectile",
            givenDx: randomBetween(110, 320, 0, random),
            givenDy: 0,
            givenHmax: randomBetween(12, 58, 0, random)
        }),
        '8': () => {
            const drop = randomBetween(18, 80, 0, random);
            return {
                scenarioType: "Lower Landing / Cliff",
                givenVx: randomBetween(14, 38, 1, random),
                givenHeightDrop: drop,
                givenDy: -drop
            };
        }
    };

    return updatesByType[typeNumber]?.() || null;
}

export function getScenarioForDeltaY(dy) {
    if (Math.abs(dy) < 0.01) return "Standard Projectile";
    return dy > 0 ? "Higher Landing" : "Lower Landing / Cliff";
}

export function componentsToLaunchValues(vx, vy) {
    const safeVx = Math.max(0.01, vx);
    const vi = Math.max(0.01, Math.hypot(safeVx, vy));
    const angleDeg = Math.atan2(vy, safeVx) * 180 / Math.PI;
    return { vi, angleDeg };
}

export function getProblemTypeScenarioValues(typeNumber, inputs, g, helpers = {}) {
    if (!typeNumber) return null;

    const toNumber = helpers.normalizeNumber || normalizeNumber;
    const clampValue = helpers.clamp || clamp;
    const dx = Math.max(0.01, Math.abs(toNumber(inputs.givenDx, 170)));
    const dy = toNumber(inputs.givenDy, 0);
    const time = Math.max(0.1, toNumber(inputs.givenTime, 4));
    const theta = clampValue(toNumber(inputs.launchAngle, 45), -80, 80);
    const thetaRad = theta * Math.PI / 180;
    const vx = Math.max(0.01, toNumber(inputs.givenVx, 20));
    const vy = toNumber(inputs.givenVy, 15);
    const hmax = Math.max(0.01, toNumber(inputs.givenHmax, 25));
    const heightDrop = Math.max(0.01, toNumber(inputs.givenHeightDrop, 40));
    const yi = 0;
    let values = null;

    if (typeNumber === '1') {
        values = {
            scenarioType: "Standard Projectile",
            vi: Math.max(0.01, toNumber(inputs.initialVelocity, 20)),
            angleDeg: theta,
            yi,
            yf: yi
        };
    } else if (typeNumber === '2') {
        values = {
            scenarioType: getScenarioForDeltaY(dy),
            vi: Math.max(0.01, toNumber(inputs.initialVelocity, 20)),
            angleDeg: theta,
            yi,
            yf: dy
        };
    } else if (typeNumber === '3') {
        values = {
            scenarioType: getScenarioForDeltaY(dy),
            ...componentsToLaunchValues(vx, vy),
            yi,
            yf: dy
        };
    } else if (typeNumber === '4') {
        const solvedVx = dx / time;
        const solvedVy = (dy + (0.5 * g * time * time)) / time;
        values = {
            scenarioType: getScenarioForDeltaY(dy),
            ...componentsToLaunchValues(solvedVx, solvedVy),
            yi,
            yf: dy
        };
    } else if (typeNumber === '5') {
        const cosTheta = Math.cos(thetaRad);
        const heightTerm = dx * Math.tan(thetaRad) - dy;
        const denominator = 2 * cosTheta * cosTheta * heightTerm;
        const solvedVi = denominator > 0 ? Math.sqrt((g * dx * dx) / denominator) : 20;
        values = {
            scenarioType: getScenarioForDeltaY(dy),
            vi: solvedVi,
            angleDeg: theta,
            yi,
            yf: dy
        };
    } else if (typeNumber === '6') {
        const sin2Theta = Math.sin(2 * thetaRad);
        const solvedVi = sin2Theta > 0.01 ? Math.sqrt((dx * g) / sin2Theta) : 20;
        values = {
            scenarioType: "Standard Projectile",
            vi: solvedVi,
            angleDeg: theta,
            yi,
            yf: yi
        };
    } else if (typeNumber === '7') {
        const solvedVy = Math.sqrt(2 * g * hmax);
        const solvedTime = (2 * solvedVy) / g;
        const solvedVx = dx / Math.max(0.1, solvedTime);
        values = {
            scenarioType: "Standard Projectile",
            ...componentsToLaunchValues(solvedVx, solvedVy),
            yi,
            yf: yi
        };
    } else if (typeNumber === '8') {
        values = {
            scenarioType: "Lower Landing / Cliff",
            vi: vx,
            angleDeg: 0,
            yi: heightDrop,
            yf: 0
        };
    }

    if (!values) return null;
    return {
        ...values,
        angleDeg: clampValue(values.angleDeg, -85, 89)
    };
}

export function getSelectedWorkAnalysisProblemType(model, inputs, normalizeToken = normalizeWorkAnalysisToken) {
    const manual = getWorkAnalysisProblemTypeNumber(inputs.workAnalysisProblemType, normalizeToken) || 'Auto';

    if (manual !== 'Auto') {
        return {
            id: `type${manual}`,
            number: Number(manual),
            title: workAnalysisProblemTypeTitles[manual] || `Problem Type ${manual}`
        };
    }

    const sameHeight = Math.abs(model.yf - model.yi) < 0.01;
    const horizontalLaunch = model.scenarioType === "Moving Drop / Airplane" || Math.abs(model.angleDeg) < 0.01;
    const given = {
        v0: !inputs.unknownInitialVelocity,
        dx: !inputs.unknownDx,
        dy: !inputs.unknownDy,
        hmax: !inputs.unknownHmax,
        theta: !inputs.unknownTheta,
        time: !inputs.unknownTime,
        v0x: !inputs.unknownInitialVx,
        v0y: !inputs.unknownInitialVy
    };

    if (horizontalLaunch && !sameHeight) return { id: 'type8', number: 8, title: workAnalysisProblemTypeTitles['8'] };
    if (given.dx && given.dy && given.time && !given.v0 && !given.theta) return { id: 'type4', number: 4, title: workAnalysisProblemTypeTitles['4'] };
    if (sameHeight && given.dx && given.hmax && !given.v0 && !given.theta && !given.v0x && !given.v0y) return { id: 'type7', number: 7, title: workAnalysisProblemTypeTitles['7'] };
    if (given.dx && given.dy && given.theta && !given.v0) return { id: 'type5', number: 5, title: workAnalysisProblemTypeTitles['5'] };
    if (given.v0x && given.v0y && given.dy && !given.v0 && !given.theta) return { id: 'type3', number: 3, title: workAnalysisProblemTypeTitles['3'] };
    if (sameHeight && given.dx && given.theta && !given.v0) return { id: 'type6', number: 6, title: workAnalysisProblemTypeTitles['6'] };
    if (!sameHeight && given.v0 && given.theta) return { id: 'type2', number: 2, title: workAnalysisProblemTypeTitles['2'] };
    return { id: 'type1', number: 1, title: workAnalysisProblemTypeTitles['1'] };
}

// -----------------------------------------------------------------------------
// Step configurations
// -----------------------------------------------------------------------------
// stepsByType is unchanged from the original (same accent colors, same lines,
// same focusLabels). The only change is in the return: each type's steps are
// composed with [givens, ...withLiveEquation(steps)] and each step is run
// through augmentComponentsStep before withFocusMetadata.

export function getWorkAnalysisTypeConfigs(model) {
    const dy = model.yf - model.yi;
    const sameHeight = Math.abs(dy) < 0.01;
    const angleTerm = `${model.angleDeg.toFixed(0)}°`;
    const hmax = model.yPeak - model.yi;
    const dyLabel = sameHeight ? "hₘₐₓ" : "Δy";
    const componentLines = model.scenarioType === "Moving Drop / Airplane"
        ? [
            `v₀x = ${model.vix.toFixed(2)} m/s`,
            `v₀ᵧ = 0.00 m/s`
        ]
        : [
            `v₀x = ${model.vi.toFixed(1)} cos(${angleTerm}) = ${model.vix.toFixed(2)} m/s`,
            `v₀ᵧ = ${model.vi.toFixed(1)} sin(${angleTerm}) = ${model.viy.toFixed(2)} m/s`
        ];
    const rangeEquation = `Δx = ${model.vix.toFixed(2)} × ${model.tFlight.toFixed(2)} = ${model.range.toFixed(2)} m`;

    const liveFinalVyStep = {
        id: 'live-equation-vyf',
        title: 'Animate Equation Values',
        accent: '#7c3aed',
        focusLabel: 'Move known values into the equation, then send the answer to the value card',
        liveEquation: { type: 'final-vy' },
        lines: [
            'vᵧf = vᵧi + aᵧt',
            `vᵧf = ${model.viy.toFixed(2)} + (-${model.g.toFixed(2)})(${model.tFlight.toFixed(2)})`,
            `vᵧf = ${model.finalVy.toFixed(2)} m/s`
        ]
    };
    const withLiveEquationStep = (steps) => {
        const alreadySolvesFinalVy = steps.some(step => (
            Array.isArray(step.resultValues) && step.resultValues.includes('vy')
        ));
        if (alreadySolvesFinalVy) return steps;
        const summaryIndex = steps.findIndex(step => step.id === 'summary');
        const nextSteps = [...steps];
        nextSteps.splice(summaryIndex >= 0 ? summaryIndex : nextSteps.length, 0, liveFinalVyStep);
        return nextSteps;
    };

    const stepsByType = {
        type1: [
            { id: 'components', title: 'Resolve Components', accent: '#1d4ed8', focusLabel: 'Given v₀ and θ, find v₀x and v₀ᵧ', lines: componentLines, componentWalkthrough: true },
            { id: 'vertical', title: 'Use Same-Height Condition', accent: '#047857', focusLabel: 'Set the launch and landing heights equal', lines: ['Δy = 0', `aᵧ = -${model.g.toFixed(2)} m/s²`], resultValues: [] },
            { id: 'time', title: 'Solve Flight Time', accent: '#7c3aed', focusLabel: 'Use y-motion to find total time', lines: ['0 = v₀ᵧt - ½gt²', `t = ${model.tFlight.toFixed(2)} s`] },
            { id: 'range', title: 'Solve Range', accent: '#ea580c', focusLabel: 'Use x-motion with that time', lines: ['Δx = v₀x t', rangeEquation] },
            { id: 'vertical-result', title: 'Find Max Height', accent: '#059669', focusLabel: 'Use the vertical component at the top', lines: ['hₘₐₓ = v₀ᵧ² / 2g', `hₘₐₓ = ${hmax.toFixed(2)} m`], resultValues: ['hmax'] },
            { id: 'summary', title: 'Answer Summary', accent: '#0f172a', focusLabel: 'Collect the level-launch results', lines: [`Time = ${model.tFlight.toFixed(2)} s`, `Range = ${model.range.toFixed(2)} m`, `hₘₐₓ = ${hmax.toFixed(2)} m`] }
        ],
        type2: [
            { id: 'components', title: 'Resolve Components', accent: '#1d4ed8', focusLabel: 'Given v₀ and θ, find v₀x and v₀ᵧ', lines: componentLines, componentWalkthrough: true },
            { id: 'vertical', title: 'Use The Height Difference', accent: '#047857', focusLabel: 'Write the vertical displacement equation', lines: [`${dyLabel} = ${dy.toFixed(2)} m`, `aᵧ = -${model.g.toFixed(2)} m/s²`], resultValues: [] },
            { id: 'time', title: 'Solve Time', accent: '#7c3aed', focusLabel: 'Find the time from y-motion', lines: [`${dyLabel} = v₀ᵧt - ½gt²`, `t = ${model.tFlight.toFixed(2)} s`] },
            { id: 'range', title: 'Solve Range', accent: '#ea580c', focusLabel: 'Use the solved time in x-motion', lines: ['Δx = v₀x t', rangeEquation] },
            { id: 'vertical-result', title: 'Find Final Velocity', accent: '#059669', focusLabel: 'Use vᵧ = v₀ᵧ - gt at landing', lines: [`vᵧ(final) = ${model.finalVy.toFixed(2)} m/s`, `v(final) = ${model.finalSpeed.toFixed(2)} m/s`], resultValues: ['vy', 'finalV'] },
            { id: 'summary', title: 'Answer Summary', accent: '#0f172a', focusLabel: 'Collect the nonlevel-launch results', lines: [`Time = ${model.tFlight.toFixed(2)} s`, `Range = ${model.range.toFixed(2)} m`, `Final speed = ${model.finalSpeed.toFixed(2)} m/s`] }
        ],
        type3: [
            { id: 'components', title: 'Start With Given Components', accent: '#1d4ed8', focusLabel: 'v₀x and v₀ᵧ are already known', lines: [`v₀x = ${model.vix.toFixed(2)} m/s`, `v₀ᵧ = ${model.viy.toFixed(2)} m/s`], resultValues: [] },
            { id: 'vertical', title: 'Solve Time From y-Motion', accent: '#047857', focusLabel: 'Use Δy, v₀ᵧ, and gravity', lines: [`Δy = ${dy.toFixed(2)} m`, `t = ${model.tFlight.toFixed(2)} s`], focusValues: ['time', 'dy', 'v0y', 'ay'], resultValues: ['time'] },
            { id: 'range', title: 'Solve Range', accent: '#ea580c', focusLabel: 'Use Δx = v₀x t', lines: ['Δx = v₀x t', rangeEquation] },
            { id: 'reconstruct', title: 'Rebuild v₀ and θ', accent: '#0ea5e9', focusLabel: 'Combine the components if needed', lines: [`v₀ = ${model.vi.toFixed(2)} m/s`, `θ = ${model.angleDeg.toFixed(1)}°`] },
            { id: 'summary', title: 'Answer Summary', accent: '#0f172a', focusLabel: 'Collect the component-based results', lines: [`Time = ${model.tFlight.toFixed(2)} s`, `Range = ${model.range.toFixed(2)} m`, `θ = ${model.angleDeg.toFixed(1)}°`] }
        ],
        type4: [
            { id: 'horizontal', title: 'Solve v₀x', accent: '#b91c1c', focusLabel: 'Use the given horizontal displacement and time', lines: ['v₀x = Δx / t', `v₀x = ${model.vix.toFixed(2)} m/s`] },
            { id: 'vertical', title: 'Solve v₀ᵧ', accent: '#047857', focusLabel: 'Rearrange the y-equation', lines: ['Δy = v₀ᵧt - ½gt²', `v₀ᵧ = ${model.viy.toFixed(2)} m/s`], resultValues: ['v0y'] },
            { id: 'reconstruct', title: 'Rebuild v₀ and θ', accent: '#0ea5e9', focusLabel: 'Combine the recovered components', lines: [`v₀ = ${model.vi.toFixed(2)} m/s`, `θ = ${model.angleDeg.toFixed(1)}°`] },
            { id: 'summary', title: 'Answer Summary', accent: '#0f172a', focusLabel: 'Collect the reconstructed launch values', lines: [`v₀x = ${model.vix.toFixed(2)} m/s`, `v₀ᵧ = ${model.viy.toFixed(2)} m/s`, `v₀ = ${model.vi.toFixed(2)} m/s`] }
        ],
        type5: [
            { id: 'components', title: 'Write Component Forms', accent: '#1d4ed8', focusLabel: 'Express v₀x and v₀ᵧ in terms of v₀ and θ', lines: ['v₀x = v₀ cosθ', 'v₀ᵧ = v₀ sinθ'], resultValues: [] },
            { id: 'time', title: 'Substitute Time', accent: '#7c3aed', focusLabel: 'Use t = Δx / (v₀ cosθ)', lines: ['Δx = v₀ cosθ · t', 't = Δx / (v₀ cosθ)'], focusValues: ['time', 'dx', 'v0', 'theta'], resultValues: [] },
            { id: 'vertical', title: 'Solve For v₀', accent: '#047857', focusLabel: 'Put that time into the y-equation', lines: [`${dyLabel} = v₀ sinθ · t - ½gt²`, `v₀ = ${model.vi.toFixed(2)} m/s`], focusValues: ['v0', 'theta', 'dx', 'dy'], resultValues: ['v0'] },
            { id: 'components', title: 'Evaluate Components', accent: '#0ea5e9', focusLabel: 'Now compute the launch components', lines: [`v₀x = ${model.vix.toFixed(2)} m/s`, `v₀ᵧ = ${model.viy.toFixed(2)} m/s`], componentWalkthrough: true },
            { id: 'summary', title: 'Answer Summary', accent: '#0f172a', focusLabel: 'Collect the solved launch values', lines: [`v₀ = ${model.vi.toFixed(2)} m/s`, `θ = ${model.angleDeg.toFixed(1)}°`, `Time = ${model.tFlight.toFixed(2)} s`] }
        ],
        type6: [
            { id: 'shortcut', title: 'Use The Range Shortcut', accent: '#7c3aed', focusLabel: 'Same-height launches use R = v₀² sin(2θ) / g', lines: ['R = v₀² sin(2θ) / g', `v₀ = ${model.vi.toFixed(2)} m/s`] },
            { id: 'components', title: 'Resolve Components', accent: '#1d4ed8', focusLabel: 'Find v₀x and v₀ᵧ from v₀ and θ', lines: componentLines, componentWalkthrough: true },
            { id: 'time', title: 'Solve Time', accent: '#ea580c', focusLabel: 'Use the known range with x-motion', lines: [`t = ${model.tFlight.toFixed(2)} s`, `Range = ${model.range.toFixed(2)} m`] },
            { id: 'vertical-result', title: 'Find Max Height', accent: '#059669', focusLabel: 'Use the vertical component at the peak', lines: ['hₘₐₓ = v₀ᵧ² / 2g', `hₘₐₓ = ${hmax.toFixed(2)} m`], resultValues: ['hmax'] },
            { id: 'summary', title: 'Answer Summary', accent: '#0f172a', focusLabel: 'Collect the shortcut-based results', lines: [`v₀ = ${model.vi.toFixed(2)} m/s`, `Time = ${model.tFlight.toFixed(2)} s`, `hₘₐₓ = ${hmax.toFixed(2)} m`] }
        ],
        type7: [
            { id: 'vertical-result', title: 'Use hₘₐₓ To Solve v₀ᵧ', accent: '#059669', focusLabel: 'Start from the peak-height shortcut', lines: ['hₘₐₓ = v₀ᵧ² / 2g', `v₀ᵧ = ${model.viy.toFixed(2)} m/s`], focusValues: ['hmax', 'v0y', 'ay'], resultValues: ['v0y'] },
            { id: 'time', title: 'Solve Total Time', accent: '#7c3aed', focusLabel: 'Same-height launches use t = 2v₀ᵧ / g', lines: ['t = 2v₀ᵧ / g', `t = ${model.tFlight.toFixed(2)} s`] },
            { id: 'horizontal', title: 'Solve v₀x', accent: '#b91c1c', focusLabel: 'Use the given range and solved time', lines: ['v₀x = Δx / t', `v₀x = ${model.vix.toFixed(2)} m/s`] },
            { id: 'reconstruct', title: 'Rebuild v₀ and θ', accent: '#0ea5e9', focusLabel: 'Combine the component values', lines: [`v₀ = ${model.vi.toFixed(2)} m/s`, `θ = ${model.angleDeg.toFixed(1)}°`] },
            { id: 'summary', title: 'Answer Summary', accent: '#0f172a', focusLabel: 'Collect the reconstructed launch results', lines: [`Range = ${model.range.toFixed(2)} m`, `hₘₐₓ = ${hmax.toFixed(2)} m`, `θ = ${model.angleDeg.toFixed(1)}°`] }
        ],
        type8: [
            { id: 'components', title: 'Horizontal Launch Setup', accent: '#1d4ed8', focusLabel: 'There is no upward launch component', lines: ['v₀x = v₀', 'v₀ᵧ = 0.00 m/s'], resultValues: [] },
            { id: 'vertical', title: 'Solve Fall Time', accent: '#047857', focusLabel: 'Use free fall in the y direction', lines: ['Δy = -½gt²', `t = ${model.tFlight.toFixed(2)} s`], focusValues: ['time', 'dy', 'ay'], resultValues: ['time'] },
            { id: 'range', title: 'Solve Horizontal Distance', accent: '#ea580c', focusLabel: 'Use constant horizontal speed', lines: ['Δx = v₀x t', `Δx = ${model.range.toFixed(2)} m`] },
            { id: 'vertical-result', title: 'Find Impact Velocity', accent: '#059669', focusLabel: 'The vertical speed grows during the fall', lines: [`vᵧ(final) = ${model.finalVy.toFixed(2)} m/s`, `v(final) = ${model.finalSpeed.toFixed(2)} m/s`], resultValues: ['vy', 'finalV'] },
            { id: 'summary', title: 'Answer Summary', accent: '#0f172a', focusLabel: 'Collect the horizontal-launch results', lines: [`Time = ${model.tFlight.toFixed(2)} s`, `Range = ${model.range.toFixed(2)} m`, `Final speed = ${model.finalSpeed.toFixed(2)} m/s`] }
        ]
    };

    return Object.fromEntries(
        Object.entries(stepsByType).map(([id, steps]) => {
            const typeNumber = id.replace(/^type/, '');
            const knownVars = getWorkAnalysisKnownVariablesForType(typeNumber);
            const givensStep = buildGivensStep(knownVars);
            const composed = [givensStep, ...withLiveEquationStep(steps)].map(augmentComponentsStep);
            return [id, { id, steps: composed.map(withFocusMetadata) }];
        })
    );
}

export function getConfiguredWorkAnalysisSteps(model, problemType = { id: 'type1' }) {
    const configs = getWorkAnalysisTypeConfigs(model);
    return configs[problemType.id]?.steps || configs.type1.steps;
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
