// Step-only walkthrough settings for Module2DKinematics.
// This is the single source of truth for saved step settings, the settings UI,
// and the defaults used by preview, play, SVG, GIF, and WebM exports.

const LS_STEP_PREFIX = 'k2d-step-settings-v3-';
const LS_STEP_DEFAULTS = 'k2d-step-settings-defaults-v3';

export const FOCUS_VALUE_LABELS = {
    v0:     'Launch Vector v₀',
    v0x:    'Horizontal v₀ₓ',
    v0y:    'Vertical v₀ᵧ',
    theta:  'Launch Angle θ',
    dx:     'Δx Displacement',
    dy:     'Δy Displacement',
    hmax:   'Max Height',
    vy:     'Final Vertical vᵧ',
    finalV: 'Final Velocity',
    time:   'Flight Time',
    ay:     'Gravity aᵧ'
};

const VALUE_ROW_MODE_OPTIONS = ['Auto', 'Show Value', 'Show ?', 'Symbol Only'];

export const STEP_DISPLAY_FIELDS = [
    // ── General scene ────────────────────────────────────────────────────────
    { key: 'stopAnimation', label: 'Stop Animation At', type: 'select', options: ['End of Flight', 'Max Height', 'Custom Time'], group: 'Scene' },
    { key: 'customStopTime', label: 'Custom Stop Time (s)', type: 'number', step: 0.1, default: 5, group: 'Scene' },
    { key: 'timingMode', label: 'Overlay Timing', type: 'select', options: ['Always', 'At End', 'At Max Height', 'At Custom Time'], group: 'Scene' },
    { key: 'trailStyle', label: 'Trail Style', type: 'select', options: ['Dotted', 'Solid', 'None'], group: 'Scene' },
    { key: 'rulerStyle', label: 'Ruler Style', type: 'select', options: ['None', 'Simple', 'Detailed'], group: 'Scene' },
    { key: 'workAnalysisStepDuration', label: 'Step Duration (s)', type: 'number', step: 0.1, default: 2.2, group: 'Scene' },
    { key: 'showVectorBreakdown', label: 'Vector Breakdown', type: 'bool', group: 'Scene' },
    { key: 'showFinalVectorAdditionZoom', label: 'Final Vector Zoom', type: 'bool', group: 'Scene' },
    { key: 'showVelocityVectors', label: 'Velocity Vectors', type: 'bool', group: 'Scene' },
    { key: 'showInitialVelocityVector', label: 'Launch Vector', type: 'bool', group: 'Scene' },
    { key: 'showAngleArc', label: 'Launch Angle Arc', type: 'bool', group: 'Scene' },
    { key: 'showComponents', label: 'Live Vx/Vy', type: 'bool', group: 'Scene' },
    { key: 'showDistanceMarkers', label: 'X/Y Distance Lines', type: 'bool', group: 'Scene' },
    { key: 'showMaxHeight', label: 'Max Height Line', type: 'bool', group: 'Scene' },
    { key: 'showAccelerationVector', label: 'Acceleration Vector', type: 'bool', group: 'Scene' },
    { key: 'showTimerDisplay', label: 'Canvas Timer', type: 'bool', group: 'Scene' },
    { key: 'showProblemLabels', label: 'Problem Labels', type: 'bool', group: 'Scene' },
    { key: 'showGhostFrames', label: 'Ghost Frames', type: 'bool', group: 'Scene' },
    { key: 'showLaunchCannon', label: 'Launch Cannon', type: 'bool', group: 'Scene' },

    // ── Values box (X/Y panels) ──────────────────────────────────────────────
    { key: 'listDisplay', label: 'Values Mode', type: 'select', options: ['Hidden', 'Symbols', 'Values'], group: 'Values Box' },
    { key: 'valuesPanelLayout', label: 'Panel Layout', type: 'select', options: ['Current Layout', 'Left Stack', 'Right Stack', 'Bottom Corners', 'Split Corners (X Top-Left)', 'Split Corners (X Bottom-Left)'], group: 'Values Box' },
    { key: 'valuesPanelOffsetX', label: 'Panels X Offset', type: 'number', step: 5, group: 'Values Box' },
    { key: 'valuesPanelOffsetY', label: 'Panels Y Offset', type: 'number', step: 5, group: 'Values Box' },
    { key: 'xRowModeDisplacement', label: 'X: Δx Show As', type: 'select', options: VALUE_ROW_MODE_OPTIONS, group: 'Values Box' },
    { key: 'xRowModeV0', label: 'X: v₀ₓ Show As', type: 'select', options: VALUE_ROW_MODE_OPTIONS, group: 'Values Box' },
    { key: 'xRowModeV', label: 'X: vₓ Show As', type: 'select', options: VALUE_ROW_MODE_OPTIONS, group: 'Values Box' },
    { key: 'xRowModeA', label: 'X: aₓ Show As', type: 'select', options: VALUE_ROW_MODE_OPTIONS, group: 'Values Box' },
    { key: 'xRowModeT', label: 'X: t Show As', type: 'select', options: VALUE_ROW_MODE_OPTIONS, group: 'Values Box' },
    { key: 'yRowModeDisplacement', label: 'Y: Δy Show As', type: 'select', options: VALUE_ROW_MODE_OPTIONS, group: 'Values Box' },
    { key: 'yRowModeHmax', label: 'Y: hₘₐₓ Show As', type: 'select', options: VALUE_ROW_MODE_OPTIONS, group: 'Values Box' },
    { key: 'yRowModeV0', label: 'Y: v₀ᵧ Show As', type: 'select', options: VALUE_ROW_MODE_OPTIONS, group: 'Values Box' },
    { key: 'yRowModeV', label: 'Y: vᵧ Show As', type: 'select', options: VALUE_ROW_MODE_OPTIONS, group: 'Values Box' },
    { key: 'yRowModeA', label: 'Y: aᵧ Show As', type: 'select', options: VALUE_ROW_MODE_OPTIONS, group: 'Values Box' },
    { key: 'yRowModeT', label: 'Y: t Show As', type: 'select', options: VALUE_ROW_MODE_OPTIONS, group: 'Values Box' },
    { key: 'showXValuesPanel', label: 'X Panel', type: 'bool', group: 'Values Box' },
    { key: 'showYValuesPanel', label: 'Y Panel', type: 'bool', group: 'Values Box' },
    { key: 'xPanelShowDisplacement', label: 'X: Δx Row', type: 'bool', group: 'Values Box' },
    { key: 'xPanelShowV0', label: 'X: v₀ₓ Row', type: 'bool', group: 'Values Box' },
    { key: 'xPanelShowV', label: 'X: vₓ Row', type: 'bool', group: 'Values Box' },
    { key: 'xPanelShowA', label: 'X: aₓ Row', type: 'bool', group: 'Values Box' },
    { key: 'xPanelShowT', label: 'X: t Row', type: 'bool', group: 'Values Box' },
    { key: 'yPanelShowDisplacement', label: 'Y: Δy Row', type: 'bool', group: 'Values Box' },
    { key: 'yPanelShowHmax', label: 'Y: hₘₐₓ Row', type: 'bool', group: 'Values Box' },
    { key: 'yPanelShowV0', label: 'Y: v₀ᵧ Row', type: 'bool', group: 'Values Box' },
    { key: 'yPanelShowV', label: 'Y: vᵧ Row', type: 'bool', group: 'Values Box' },
    { key: 'yPanelShowA', label: 'Y: aᵧ Row', type: 'bool', group: 'Values Box' },
    { key: 'yPanelShowT', label: 'Y: t Row', type: 'bool', group: 'Values Box' },

    // ── Equation box ─────────────────────────────────────────────────────────
    { key: 'equationHighlight', label: 'Highlight Equation', type: 'select', options: ['None', 'Eq 1', 'Eq 2', 'Eq 3', 'Eq 4'], group: 'Equation Box' },
    { key: 'equationPanelPlacement', label: 'Panel Placement', type: 'select', options: ['Bottom Right', 'Bottom Left', 'Top Right', 'Top Left', 'Top Center', 'Bottom Center'], group: 'Equation Box' },
    { key: 'equationPanelOffsetX', label: 'Equation X Offset', type: 'number', step: 5, group: 'Equation Box' },
    { key: 'equationPanelOffsetY', label: 'Equation Y Offset', type: 'number', step: 5, group: 'Equation Box' },
    { key: 'showEquations', label: 'Equation Box', type: 'bool', group: 'Equation Box' },
    { key: 'eqShowVfEquation', label: 'Eq 1: v = v₀ + at', type: 'bool', group: 'Equation Box' },
    { key: 'eqShowDisplacementEquation', label: 'Eq 2: Δy = v₀t + ½at²', type: 'bool', group: 'Equation Box' },
    { key: 'eqShowVSquaredEquation', label: 'Eq 3: v² = v₀² + 2aΔy', type: 'bool', group: 'Equation Box' },
    { key: 'eqShowAvgVelocityEquation', label: 'Eq 4: Δy = ½(v₀ + v)t', type: 'bool', group: 'Equation Box' },

    // ── Given-value animation ────────────────────────────────────────────────
    { key: 'givenValueAnimationSpeed', label: 'Given Anim Speed', type: 'number', step: 0.05, default: 0.65, group: 'Givens' },
    { key: 'animateGivenValues', label: 'Animate Given Values', type: 'bool', group: 'Givens' }
];

const BASE_STEP_SETTING = {
    captureTime: 'step-anchor',
    animationSource: 'step-window',
    showLaunch: true,
    focusValueOverrides: null,
    showExplanation: false,
    panelPosition: 'top-right',
    panelNudgeX: 0,
    panelNudgeY: 0,
    hoverKey: '',
    playbackSpeed: 1,
    exportFps: null,
    exportScale: null,
    exportQuality: null,
    exportLoopDelaySeconds: null,
    displayOverrides: {}
};

const STEP_DEFAULTS_BY_ID = {
    intro: {
        captureTime: 'start',
        animationSource: 'full-flight',
        displayOverrides: {
            showVectorBreakdown: false,
            showFinalVectorAdditionZoom: false,
            animateGivenValues: false
        }
    },
    givens: {
        captureTime: 'step-anchor',
        animationSource: 'step-window',
        showLaunch: false,
        displayOverrides: {
            animateGivenValues: true,
            givenValueAnimationSpeed: 0.65
        }
    },
    'vector-breakdown': {
        captureTime: 'breakdown-end',
        animationSource: 'vector-breakdown',
        showLaunch: false,
        displayOverrides: {
            showVectorBreakdown: true,
            captureVectorBreakdownInSvg: true,
            showVelocityVectors: false,
            showInitialVelocityVector: false,
            showAngleArc: false,
            showComponents: false,
            showDistanceMarkers: false,
            showMaxHeight: false,
            showAccelerationVector: false,
            showTimerDisplay: false,
            showEquations: false,
            showGhostFrames: false,
            showLaunchCannon: true,
            showProblemLabels: true,
            trailStyle: 'None',
            rulerStyle: 'None'
        }
    },
    components: {
        captureTime: 'breakdown-end',
        animationSource: 'vector-breakdown',
        showLaunch: false,
        displayOverrides: {
            showVectorBreakdown: true,
            captureVectorBreakdownInSvg: true,
            showVelocityVectors: false,
            showInitialVelocityVector: false,
            showAngleArc: false,
            showComponents: false,
            showDistanceMarkers: false,
            showMaxHeight: false,
            showAccelerationVector: false,
            showTimerDisplay: false,
            showEquations: false,
            showGhostFrames: false,
            showLaunchCannon: true,
            showProblemLabels: true,
            trailStyle: 'None',
            rulerStyle: 'None'
        }
    },
    equation: {
        captureTime: 'animation-end',
        animationSource: 'animated-step-panel',
        showLaunch: false,
        displayOverrides: {
            showEquations: false
        }
    },
    solve: {
        captureTime: 'animation-end',
        animationSource: 'animated-step-panel',
        showLaunch: false,
        displayOverrides: {
            showEquations: false
        }
    },
    'final-vector': {
        captureTime: 'final-vector',
        animationSource: 'final-vector',
        displayOverrides: {
            showFinalVectorAdditionZoom: true,
            captureVectorBreakdownInSvg: true
        }
    },
    hover: {
        captureTime: 'start',
        animationSource: 'hover-animation',
        showLaunch: false,
        hoverKey: 'y:a',
        displayOverrides: {
            showVectorBreakdown: false,
            showFinalVectorAdditionZoom: false,
            animateGivenValues: false,
            showVelocityVectors: false,
            showAngleArc: false,
            showDistanceMarkers: false,
            showMaxHeight: false,
            showAccelerationVector: false,
            showTimerDisplay: false,
            showEquations: false,
            showGhostFrames: false,
            trailStyle: 'None'
        }
    }
};

function esc(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function mergeSettings(...settings) {
    const merged = {};
    settings.forEach((setting) => {
        if (!setting) return;
        Object.assign(merged, setting);
        merged.displayOverrides = {
            ...(merged.displayOverrides || {}),
            ...(setting.displayOverrides || {})
        };
    });
    return merged;
}

function loadGlobalStepDefaults() {
    try {
        const raw = localStorage.getItem(LS_STEP_DEFAULTS);
        if (raw) return JSON.parse(raw);
    } catch (_) {}
    return null;
}

export function loadStepSettings(typeKey) {
    try {
        const raw = localStorage.getItem(LS_STEP_PREFIX + (typeKey || 'auto'));
        if (raw) return JSON.parse(raw);
    } catch (_) {}
    return loadGlobalStepDefaults() || {};
}

export function saveStepSettings(typeKey, stepSettings) {
    try {
        localStorage.setItem(LS_STEP_PREFIX + (typeKey || 'auto'), JSON.stringify(stepSettings || {}));
    } catch (_) {}
}

export function saveStepSettingsDefaults(stepSettings) {
    try {
        localStorage.setItem(LS_STEP_DEFAULTS, JSON.stringify(stepSettings || {}));
    } catch (_) {}
}

export function getSavedStepSetting(stepSettings, stepId) {
    const setting = stepSettings?.[stepId];
    return setting && !Array.isArray(setting) ? setting : {};
}

export function getResolvedStepSetting(stepSettings, step) {
    const id = step?.id;
    return mergeSettings(
        BASE_STEP_SETTING,
        STEP_DEFAULTS_BY_ID[id],
        getSavedStepSetting(stepSettings, id)
    );
}

export function getStepDisplayOverrides(stepSettings, step) {
    return { ...(getResolvedStepSetting(stepSettings, step).displayOverrides || {}) };
}

export function getStepExportOverrides(stepSettings, step) {
    const setting = getResolvedStepSetting(stepSettings, step);
    const overrides = {};
    if (Number.isFinite(setting.exportFps)) overrides.fps = setting.exportFps;
    if (Number.isFinite(setting.exportScale)) overrides.scale = setting.exportScale;
    if (Number.isFinite(setting.exportQuality)) overrides.quality = setting.exportQuality;
    if (Number.isFinite(setting.exportLoopDelaySeconds)) overrides.loopDelaySeconds = setting.exportLoopDelaySeconds;
    return overrides;
}

export function getOrCreateStepSetting(state, stepId) {
    if (!state || !state.stepSettings || !stepId) return null;
    if (!state.stepSettings[stepId] || Array.isArray(state.stepSettings[stepId])) {
        state.stepSettings[stepId] = {};
    }
    return state.stepSettings[stepId];
}

export function resetStepSetting(state, stepId) {
    if (state?.stepSettings && stepId) delete state.stepSettings[stepId];
}

export function resolveStepTime(sim, step, setting, range = null) {
    const model = sim.computeProjectileModel(0);
    const capture = setting?.captureTime || 'step-anchor';
    const breakdownDuration = Math.max(0, model.breakdownDuration || 0);
    const motionStop = Math.max(0, model.motionStopTime ?? model.tFlight ?? 0);
    const totalStop = Math.max(model.stopTime || 0, breakdownDuration + motionStop);

    if (typeof capture === 'number' && Number.isFinite(capture)) return Math.max(0, capture);
    if (capture === 'animation-start' && range) return range.startTime;
    if (capture === 'animation-end' && range) return range.endTime;
    if (capture === 'start') return 0;
    if (capture === 'peak') return breakdownDuration + Math.max(0, model.tPeak || 0);
    if (capture === 'end') return Math.max(0, breakdownDuration + motionStop);
    if (capture === 'breakdown-end') return (sim.vectorBreakdownDuration ?? 6.2) * 0.95;
    if (capture === 'final-vector') {
        if (model.finalVectorDuration > 0) {
            return model.finalVectorStartTime + (model.finalVectorDuration * 0.82);
        }
        return Math.max(0, totalStop - 0.001);
    }
    return sim.getWalkthroughAnchorTime(step);
}

export function resolveStepTimeRange(sim, steps, stepIndex, setting) {
    const step = steps[stepIndex];
    const source = setting?.animationSource || 'step-window';
    const model = sim.computeProjectileModel(0);
    const breakdownDuration = Math.max(0, model.breakdownDuration || 0);
    const motionStop = Math.max(0, model.motionStopTime ?? model.tFlight ?? 0);
    const totalStop = Math.max(model.stopTime || 0, breakdownDuration + motionStop);

    if (source === 'full-flight') {
        return { startTime: 0, endTime: Math.max(0.1, breakdownDuration + motionStop) };
    }
    if (source === 'vector-breakdown') {
        return { startTime: 0, endTime: Math.max(0.1, sim.vectorBreakdownDuration ?? 6.2) };
    }
    if (source === 'final-vector') {
        const start = Number.isFinite(model.finalVectorStartTime) ? model.finalVectorStartTime : Math.max(0, totalStop - 3);
        return { startTime: Math.max(0, start), endTime: Math.max(start + 0.1, totalStop) };
    }
    if (source === 'hover-animation') {
        const duration = Number(setting.customStopTime) > 0 ? Number(setting.customStopTime) : 6.2;
        return { startTime: 0, endTime: duration };
    }
    if (source === 'custom-range') {
        const start = Number.isFinite(setting.customStartTime) ? Math.max(0, setting.customStartTime) : 0;
        const end = Number.isFinite(setting.customEndTime) ? setting.customEndTime : start + 2;
        return { startTime: start, endTime: Math.max(start + 0.1, end) };
    }

    const stepDuration = model.workStepDuration || sim.getWorkAnalysisStepDuration();
    const workAnalysisDuration = Math.max(0, model.workAnalysisDuration || (steps.length * stepDuration));
    const workAnalysisEnd = breakdownDuration + workAnalysisDuration;
    const startTime = Math.min(workAnalysisEnd, breakdownDuration + (stepIndex * stepDuration));
    const endTime = Math.min(workAnalysisEnd, startTime + stepDuration);
    const minClipLength = 1 / Math.max(1, sim.exportSettings?.fps || sim.config.fps || 30);
    const stepWindow = {
        model,
        step,
        stepIndex,
        startTime,
        endTime: Math.max(startTime + minClipLength, endTime)
    };
    if (source === 'animated-step-panel') return stepWindow;
    return stepWindow;
}

function buildCaptureOptions(current) {
    const isCustom = typeof current === 'number';
    const selected = isCustom ? 'custom' : (current || 'step-anchor');
    return [
        ['step-anchor', 'Step Anchor'],
        ['animation-start', 'Animation Start'],
        ['animation-end', 'Animation End'],
        ['start', 'Start (t = 0)'],
        ['peak', 'Peak Height'],
        ['end', 'End of Flight'],
        ['breakdown-end', 'Vector Breakdown Zoom'],
        ['final-vector', 'Final Vector Zoom'],
        ['custom', 'Custom Seconds']
    ].map(([value, label]) => `<option value="${value}"${selected === value ? ' selected' : ''}>${label}</option>`).join('');
}

function buildOptionList(options, current) {
    return options.map(([value, label]) => `<option value="${esc(value)}"${current === value ? ' selected' : ''}>${esc(label)}</option>`).join('');
}

function numberInput(attr, value, { step = 0.1, min = null, max = null } = {}) {
    return `<input type="number" ${attr} value="${esc(value ?? '')}" step="${esc(step)}"${min !== null ? ` min="${esc(min)}"` : ''}${max !== null ? ` max="${esc(max)}"` : ''}
        style="width:100%;border:1px solid var(--border);border-radius:0.4rem;padding:0.28rem 0.45rem;font-size:0.78rem;font-weight:600;background:white;color:var(--text-primary);">`;
}

function sectionTitle(text) {
    return `<h5 style="font-size:0.63rem;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted);margin:0 0 0.45rem;">${esc(text)}</h5>`;
}

// Renders the Display Overrides section grouped by field.group. Selects get a
// leading "(global)" option: choosing it removes the override so the step falls
// back to the main control panel's setting.
function buildDisplayOverrideGroups(displayOverrides, accent) {
    const groups = [];
    STEP_DISPLAY_FIELDS.forEach((field) => {
        const name = field.group || 'Scene';
        if (!groups.includes(name)) groups.push(name);
    });

    return groups.map((groupName) => {
        const fields = STEP_DISPLAY_FIELDS.filter(field => (field.group || 'Scene') === groupName);
        const inputFields = fields.filter(field => field.type !== 'bool');
        const boolFields = fields.filter(field => field.type === 'bool');

        const inputGrid = inputFields.length ? `
            <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0.35rem 0.55rem;">
                ${inputFields.map((field) => {
                    const hasOverride = field.key in displayOverrides;
                    let control;
                    if (field.type === 'number') {
                        const value = displayOverrides[field.key] ?? field.default ?? '';
                        control = numberInput(`data-step-display="${esc(field.key)}"`, value, { step: field.step ?? 1 });
                    } else {
                        const current = hasOverride ? String(displayOverrides[field.key]) : '';
                        control = `<select data-step-display="${esc(field.key)}" style="width:100%;border:1px solid ${hasOverride ? accent : 'var(--border)'};border-radius:0.4rem;padding:0.28rem 0.45rem;font-size:0.76rem;font-weight:600;background:white;color:var(--text-primary);" title="${hasOverride ? 'Override active' : 'Using global setting'}">
                            <option value=""${hasOverride ? '' : ' selected'}>(global)</option>
                            ${field.options.map(option => `<option value="${esc(option)}"${current === option ? ' selected' : ''}>${esc(option)}</option>`).join('')}
                        </select>`;
                    }
                    return `<div><label style="font-size:0.61rem;font-weight:700;color:${hasOverride ? '#0f172a' : 'var(--text-muted)'};text-transform:uppercase;letter-spacing:0.05em;display:block;margin-bottom:0.12rem;">${esc(field.label)}</label>${control}</div>`;
                }).join('')}
            </div>` : '';

        const boolGrid = boolFields.length ? `
            <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0.1rem 0.4rem;margin-top:0.5rem;">
                ${boolFields.map((field) => {
                    const hasOverride = field.key in displayOverrides;
                    const triVal = hasOverride ? (displayOverrides[field.key] ? 'yes' : 'no') : 'default';
                    return `<label style="display:flex;align-items:center;gap:0.3rem;padding:0.18rem 0.1rem;border-radius:0.3rem;">
                        <select data-step-tri="${esc(field.key)}" style="width:42px;font-size:0.65rem;padding:0.08rem 0.1rem;border:1px solid var(--border);border-radius:0.3rem;background:white;color:var(--text-primary);cursor:pointer;flex-shrink:0;" title="${hasOverride ? 'Override active' : 'Using global setting'}">
                            <option value="default" ${triVal === 'default' ? 'selected' : ''}>-</option>
                            <option value="yes" ${triVal === 'yes' ? 'selected' : ''}>On</option>
                            <option value="no" ${triVal === 'no' ? 'selected' : ''}>Off</option>
                        </select>
                        <span style="font-size:0.7rem;color:${hasOverride ? '#0f172a' : 'var(--text-secondary)'};font-weight:${hasOverride ? '700' : '600'};line-height:1.2;">${esc(field.label)}</span>
                    </label>`;
                }).join('')}
            </div>` : '';

        return `<div style="margin-bottom:0.65rem;">
            <div style="font-size:0.6rem;font-weight:800;text-transform:uppercase;letter-spacing:0.07em;color:${accent};margin:0.2rem 0 0.35rem;">${esc(groupName)}</div>
            ${inputGrid}
            ${boolGrid}
        </div>`;
    }).join('');
}

export function buildStepSettingsPanel(state) {
    const { currentSteps, activeStepId, stepSettings } = state;
    if (!currentSteps || !currentSteps.length) {
        return `<p style="font-size:0.76rem;color:var(--text-muted);margin:0.5rem 0;">No steps available for the current problem type.</p>`;
    }
    const activeStep = currentSteps.find(step => step.id === activeStepId) || currentSteps[0];
    const setting = getResolvedStepSetting(stepSettings, activeStep);
    const displayOverrides = setting.displayOverrides || {};
    const accent = activeStep.accent || '#4f46e5';
    const isCustomCapture = typeof setting.captureTime === 'number';
    const customCapture = isCustomCapture ? setting.captureTime : 4;
    const customRangeVisible = setting.animationSource === 'custom-range';
    const stepIndex = currentSteps.findIndex(step => step.id === activeStep.id);

    const stepTabs = currentSteps.map((step, index) => `
        <button data-step-tab="${esc(step.id)}" type="button" style="
            padding:0.25rem 0.6rem;border-radius:0.4rem;
            border:1.5px solid ${step.id === activeStep.id ? (step.accent || '#4f46e5') : 'var(--border)'};
            background:${step.id === activeStep.id ? (step.accent || '#4f46e5') : 'white'};
            color:${step.id === activeStep.id ? 'white' : 'var(--text-secondary)'};
            font-family:inherit;font-size:0.67rem;font-weight:700;cursor:pointer;white-space:nowrap;">
            ${esc(step.title || step.id)}
        </button>
    `).join('');

    const animationOptions = buildOptionList([
        ['step-window', 'Step Window'],
        ['full-flight', 'Full Flight'],
        ['vector-breakdown', 'Vector Breakdown Zoom'],
        ['final-vector', 'Final Vector Zoom'],
        ['animated-step-panel', 'Animated Step Panel'],
        ['hover-animation', 'Hover Animation'],
        ['custom-range', 'Custom Range']
    ], setting.animationSource);

    const hoverOptions = buildOptionList([
        ['', 'None'],
        ['x:displacement', 'Delta x Construction Walk'],
        ['y:displacement', 'Delta y Rappel / Climb'],
        ['y:hmax', 'hmax Ladder / Tightrope'],
        ['x:v0', 'v0x Launch Vector'],
        ['y:v0', 'v0y Launch Vector'],
        ['x:v', 'vx Radar Gun (final)'],
        ['y:v', 'vy Radar Gun (final)'],
        ['x:a', 'ax Zero Accel'],
        ['y:a', 'ay Gravity'],
        ['y:t', 't Flight Timer']
    ], setting.hoverKey || '');

    return `
        <div style="display:flex;gap:0.3rem;flex-wrap:wrap;margin-bottom:0.6rem;">${stepTabs}</div>
        <div class="module-extension__card" style="--step-accent:${accent};">
            <div style="display:flex;justify-content:space-between;gap:0.75rem;align-items:flex-start;margin-bottom:0.55rem;">
                <div>
                    <div style="font-size:0.64rem;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:${accent};">Active Step</div>
                    <h4 style="font-size:0.98rem;margin:0.12rem 0 0;color:${accent};">${esc(activeStep.title || activeStep.id)}</h4>
                </div>
            </div>
            ${activeStep.focusLabel ? `<p style="font-size:0.76rem;color:var(--text-secondary);margin:0 0 0.7rem;line-height:1.5;border-left:3px solid ${accent};padding-left:0.55rem;">${esc(activeStep.focusLabel)}</p>` : ''}

            <div style="display:grid;gap:0.7rem;">
                <section>
                    ${sectionTitle('Step Actions')}
                    <div class="module-extension__walkthrough-actions" style="margin-top:0;">
                        <button class="module-extension__walkthrough-btn" data-step-action="prev" type="button" ${stepIndex <= 0 ? 'disabled' : ''}>Previous Step</button>
                        <button class="module-extension__walkthrough-btn module-extension__walkthrough-btn--primary" data-step-action="next" type="button" ${stepIndex >= currentSteps.length - 1 ? 'disabled' : ''}>Next Step</button>
                        <button class="module-extension__walkthrough-btn" data-step-action="play" type="button">Play Step</button>
                        <button class="module-extension__walkthrough-btn" data-step-export="gif" type="button">Download Step GIF</button>
                        <button class="module-extension__walkthrough-btn" data-step-export="webm" type="button">Download Step WebM</button>
                        <button class="module-extension__walkthrough-btn" data-step-export-all="gif" type="button">Download All GIF Steps</button>
                        <button class="module-extension__walkthrough-btn" data-step-export-all="webm" type="button">Download All WebM Steps</button>
                        <button class="module-extension__walkthrough-btn" data-step-action="reset-index" type="button">Reset Steps</button>
                    </div>
                </section>

                <section style="padding-top:0.55rem;border-top:1px solid var(--border-subtle);">
                    ${sectionTitle('Preview And SVG Frame')}
                    <label style="font-size:0.65rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;display:block;margin-bottom:0.25rem;">Static Frame Time</label>
                    <select data-step-ms="captureTime" style="width:100%;border:1px solid var(--border);border-radius:0.5rem;padding:0.35rem 0.55rem;font-size:0.78rem;font-weight:600;background:white;color:var(--text-primary);margin-bottom:0.35rem;">${buildCaptureOptions(setting.captureTime)}</select>
                    <div data-step-custom-row style="display:${isCustomCapture ? '' : 'none'};">
                        ${numberInput('data-step-ms="captureTimeCustom"', customCapture, { step: 0.5, min: 0 })}
                    </div>
                </section>

                <section style="padding-top:0.55rem;border-top:1px solid var(--border-subtle);">
                    ${sectionTitle('Play Step')}
                    <label style="display:flex;align-items:center;gap:0.45rem;margin-bottom:0.45rem;cursor:pointer;">
                        <input type="checkbox" data-step-ms="showLaunch" ${setting.showLaunch !== false ? 'checked' : ''} style="width:15px;height:15px;accent-color:${accent};cursor:pointer;flex-shrink:0;">
                        <span style="font-size:0.74rem;font-weight:700;color:var(--text-secondary);">Show projectile launch</span>
                    </label>
                    <label style="font-size:0.65rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;display:block;margin-bottom:0.25rem;">Animation Source</label>
                    <select data-step-ms="animationSource" style="width:100%;border:1px solid var(--border);border-radius:0.5rem;padding:0.35rem 0.55rem;font-size:0.78rem;font-weight:600;background:white;color:var(--text-primary);margin-bottom:0.35rem;">${animationOptions}</select>
                    <div data-step-anim-custom-row style="display:${customRangeVisible ? 'grid' : 'none'};grid-template-columns:1fr 1fr;gap:0.5rem;margin-bottom:0.35rem;">
                        <div><label style="font-size:0.63rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;display:block;margin-bottom:0.2rem;">Start (s)</label>${numberInput('data-step-ms="customStartTime"', setting.customStartTime ?? 0, { step: 0.5, min: 0 })}</div>
                        <div><label style="font-size:0.63rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;display:block;margin-bottom:0.2rem;">End (s)</label>${numberInput('data-step-ms="customEndTime"', setting.customEndTime ?? 5, { step: 0.5, min: 0 })}</div>
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;">
                        <div><label style="font-size:0.63rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;display:block;margin-bottom:0.2rem;">Playback Speed</label>${numberInput('data-step-ms="playbackSpeed"', setting.playbackSpeed ?? 1, { step: 0.1, min: 0.1, max: 5 })}</div>
                        <div><label style="font-size:0.63rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;display:block;margin-bottom:0.2rem;">Hover Animation</label><select data-step-ms="hoverKey" style="width:100%;border:1px solid var(--border);border-radius:0.4rem;padding:0.28rem 0.45rem;font-size:0.78rem;font-weight:600;background:white;color:var(--text-primary);">${hoverOptions}</select></div>
                    </div>
                </section>

                <section style="padding-top:0.55rem;border-top:1px solid var(--border-subtle);">
                    ${sectionTitle('Exports')}
                    <div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:0.5rem;">
                        <div><label style="font-size:0.63rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;display:block;margin-bottom:0.2rem;">FPS</label>${numberInput('data-step-ms="exportFps"', setting.exportFps ?? '', { step: 1, min: 1, max: 60 })}</div>
                        <div><label style="font-size:0.63rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;display:block;margin-bottom:0.2rem;">Scale</label>${numberInput('data-step-ms="exportScale"', setting.exportScale ?? '', { step: 0.1, min: 0.25, max: 2 })}</div>
                        <div><label style="font-size:0.63rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;display:block;margin-bottom:0.2rem;">Quality</label>${numberInput('data-step-ms="exportQuality"', setting.exportQuality ?? '', { step: 1, min: 1, max: 30 })}</div>
                        <div><label style="font-size:0.63rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;display:block;margin-bottom:0.2rem;">Loop Delay</label>${numberInput('data-step-ms="exportLoopDelaySeconds"', setting.exportLoopDelaySeconds ?? '', { step: 0.1, min: 0 })}</div>
                    </div>
                </section>

                <section style="padding-top:0.55rem;border-top:1px solid var(--border-subtle);">
                    ${sectionTitle('Explanation Panel')}
                    <label style="display:flex;align-items:center;gap:0.45rem;margin-bottom:0.45rem;cursor:pointer;">
                        <input type="checkbox" data-step-ms="showExplanation" ${setting.showExplanation ? 'checked' : ''} style="width:15px;height:15px;accent-color:${accent};cursor:pointer;flex-shrink:0;">
                        <span style="font-size:0.74rem;font-weight:700;color:var(--text-secondary);">Show step explanation on canvas</span>
                    </label>
                    <div id="step-position-row" style="display:${setting.showExplanation ? 'grid' : 'none'};grid-template-columns:1.4fr 1fr 1fr;gap:0.5rem;">
                        <div>
                            <label style="font-size:0.63rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;display:block;margin-bottom:0.2rem;">Position</label>
                            <select data-step-ms="panelPosition" style="width:100%;border:1px solid var(--border);border-radius:0.4rem;padding:0.28rem 0.45rem;font-size:0.78rem;font-weight:600;background:white;color:var(--text-primary);">
                                ${buildOptionList([
                                    ['top-left', 'Top Left'], ['top-center', 'Top Center'], ['top-right', 'Top Right'],
                                    ['middle-left', 'Middle Left'], ['middle-right', 'Middle Right'],
                                    ['bottom-left', 'Bottom Left'], ['bottom-center', 'Bottom Center'], ['bottom-right', 'Bottom Right']
                                ], setting.panelPosition)}
                            </select>
                        </div>
                        <div><label style="font-size:0.63rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;display:block;margin-bottom:0.2rem;">X Nudge</label>${numberInput('data-step-ms="panelNudgeX"', setting.panelNudgeX ?? 0, { step: 5 })}</div>
                        <div><label style="font-size:0.63rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;display:block;margin-bottom:0.2rem;">Y Nudge</label>${numberInput('data-step-ms="panelNudgeY"', setting.panelNudgeY ?? 0, { step: 5 })}</div>
                    </div>
                </section>

                <section style="padding-top:0.55rem;border-top:1px solid var(--border-subtle);">
                    ${sectionTitle('Focus Overlays')}
                    ${(() => {
                        const defaultFocus = new Set(Array.isArray(activeStep.focusValues) ? activeStep.focusValues : []);
                        const overrides = Array.isArray(setting.focusValueOverrides) ? setting.focusValueOverrides : null;
                        const hasOverride = overrides !== null;
                        const currentFocus = hasOverride ? new Set(overrides) : defaultFocus;
                        const rows = Object.entries(FOCUS_VALUE_LABELS).map(([key, label]) => {
                            const isActive = currentFocus.has(key);
                            const isDefault = defaultFocus.has(key) === isActive;
                            return `<label style="display:flex;align-items:center;gap:0.3rem;padding:0.18rem 0.1rem;border-radius:0.3rem;cursor:pointer;">
                                <input type="checkbox" data-step-focus="${esc(key)}" ${isActive ? 'checked' : ''} style="width:13px;height:13px;accent-color:${accent};cursor:pointer;flex-shrink:0;">
                                <span style="font-size:0.7rem;color:${isDefault ? 'var(--text-secondary)' : '#0f172a'};font-weight:${isDefault ? '600' : '700'};line-height:1.2;">${esc(label)}</span>
                            </label>`;
                        });
                        return `<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0.1rem 0.4rem;">${rows.join('')}</div>
                        ${hasOverride ? `<button id="step-reset-focus" type="button" style="margin-top:0.4rem;padding:0.2rem 0.5rem;border-radius:0.35rem;border:1.5px solid var(--border);background:white;color:var(--text-muted);font-family:inherit;font-size:0.68rem;font-weight:700;cursor:pointer;">Reset to Step Default</button>` : ''}`;
                    })()}
                </section>

                <section style="padding-top:0.55rem;border-top:1px solid var(--border-subtle);">
                    ${sectionTitle('Display Overrides')}
                    ${buildDisplayOverrideGroups(displayOverrides, accent)}
                </section>

                <section style="display:flex;gap:0.45rem;flex-wrap:wrap;padding-top:0.55rem;border-top:1px solid var(--border-subtle);">
                    <button id="step-save-defaults" type="button" style="padding:0.32rem 0.75rem;border-radius:0.45rem;border:1.5px solid #d97706;background:white;color:#d97706;font-family:inherit;font-size:0.72rem;font-weight:700;cursor:pointer;">Save Settings as Defaults</button>
                    <button id="step-reset-setting" type="button" style="padding:0.32rem 0.6rem;border-radius:0.45rem;border:1.5px solid var(--border);background:white;color:var(--text-muted);font-family:inherit;font-size:0.72rem;font-weight:700;cursor:pointer;">Reset This Step Setting</button>
                </section>
            </div>
        </div>
    `;
}

function parseMaybeNumber(value) {
    if (value === '' || value === null || value === undefined) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

function updateStepSettingFromInput(ms, key, el, container) {
    if (key === 'captureTime') {
        const customRow = container.querySelector('[data-step-custom-row]');
        if (el.value === 'custom') {
            if (customRow) customRow.style.display = '';
            const customInput = container.querySelector('[data-step-ms="captureTimeCustom"]');
            ms.captureTime = parseMaybeNumber(customInput?.value) ?? 4;
        } else {
            if (customRow) customRow.style.display = 'none';
            ms.captureTime = el.value;
        }
    } else if (key === 'captureTimeCustom') {
        ms.captureTime = parseMaybeNumber(el.value) ?? 4;
    } else if (key === 'animationSource') {
        ms.animationSource = el.value;
        const customRow = container.querySelector('[data-step-anim-custom-row]');
        if (customRow) customRow.style.display = el.value === 'custom-range' ? 'grid' : 'none';
    } else if (key === 'showLaunch') {
        ms.showLaunch = el.checked;
    } else if (key === 'showExplanation') {
        ms.showExplanation = el.checked;
        const row = container.querySelector('#step-position-row');
        if (row) row.style.display = el.checked ? 'grid' : 'none';
    } else if (['panelNudgeX', 'panelNudgeY'].includes(key)) {
        ms[key] = parseMaybeNumber(el.value) ?? 0;
    } else if (['customStartTime', 'customEndTime', 'playbackSpeed', 'exportFps', 'exportScale', 'exportQuality', 'exportLoopDelaySeconds'].includes(key)) {
        ms[key] = parseMaybeNumber(el.value);
    } else {
        ms[key] = el.value || '';
    }
}

export function bindStepSettingsPanelEvents(container, state, handlers = {}) {
    const activeSetting = () => getOrCreateStepSetting(state, state.activeStepId);

    container.querySelectorAll('[data-step-tab]').forEach(button => {
        button.addEventListener('click', () => handlers.onStepTab?.(button.dataset.stepTab));
    });

    container.querySelectorAll('[data-step-action]').forEach(button => {
        button.addEventListener('click', () => handlers.onAction?.(button.dataset.stepAction));
    });

    container.querySelectorAll('[data-step-export]').forEach(button => {
        button.addEventListener('click', () => handlers.onExport?.(button.dataset.stepExport));
    });

    container.querySelectorAll('[data-step-export-all]').forEach(button => {
        button.addEventListener('click', () => handlers.onExportAll?.(button.dataset.stepExportAll));
    });

    container.querySelectorAll('[data-step-ms]').forEach(el => {
        const eventType = (el.type === 'number' || el.type === 'range') ? 'input' : 'change';
        el.addEventListener(eventType, () => {
            const ms = activeSetting();
            if (!ms) return;
            updateStepSettingFromInput(ms, el.dataset.stepMs, el, container);
            handlers.onSettingChange?.();
        });
    });

    container.querySelectorAll('[data-step-display]').forEach(el => {
        const eventType = el.type === 'number' ? 'input' : 'change';
        el.addEventListener(eventType, () => {
            const ms = activeSetting();
            if (!ms) return;
            if (!ms.displayOverrides) ms.displayOverrides = {};
            const value = el.type === 'number' ? parseMaybeNumber(el.value) : el.value;
            // null (blank number) or '' ("(global)" select option) clears the override.
            if (value === null || value === '') delete ms.displayOverrides[el.dataset.stepDisplay];
            else ms.displayOverrides[el.dataset.stepDisplay] = value;
            handlers.onSettingChange?.();
        });
    });

    container.querySelectorAll('[data-step-tri]').forEach(el => {
        el.addEventListener('change', () => {
            const ms = activeSetting();
            if (!ms) return;
            if (!ms.displayOverrides) ms.displayOverrides = {};
            if (el.value === 'default') delete ms.displayOverrides[el.dataset.stepTri];
            else ms.displayOverrides[el.dataset.stepTri] = el.value === 'yes';
            handlers.onSettingChange?.();
        });
    });

    container.querySelectorAll('[data-step-focus]').forEach(el => {
        el.addEventListener('change', () => {
            const ms = activeSetting();
            if (!ms) return;
            const selected = [];
            container.querySelectorAll('[data-step-focus]').forEach(cb => {
                if (cb.checked) selected.push(cb.dataset.stepFocus);
            });
            ms.focusValueOverrides = selected;
            handlers.onSettingChange?.();
        });
    });

    container.querySelector('#step-reset-focus')?.addEventListener('click', () => {
        const ms = activeSetting();
        if (!ms) return;
        ms.focusValueOverrides = null;
        handlers.onSettingChange?.();
    });

    container.querySelector('#step-save-defaults')?.addEventListener('click', () => handlers.onSaveDefaults?.());
    container.querySelector('#step-reset-setting')?.addEventListener('click', () => handlers.onResetSetting?.());
}
