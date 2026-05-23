// =============================================================================
// Kinematics2dModeSvgExport.js
// =============================================================================
// Per-problem-type, per-mode SVG export settings for Module2DKinematics.
//
// Each of the 5 pedagogical modes (Intro / Givens / Equation / Solve /
// Final Vector) stores its own display settings. These are persisted in
// localStorage keyed by problem-type number.
//
// Public API (used by Kinematics2d.js and app.js):
//   buildModeSvgPanel(sim, state)         → HTML string for the panel
//   bindModeSvgPanelEvents(container, state, onChange)
//   loadSettings(typeKey)                 → allSettings object
//   saveSettings(typeKey, allSettings)
//   exportAllModeSvgs(sim, allSettings, statusEl)
//   exportModeSvg(sim, modeKey, modeSettings, statusEl)
//   previewModeOnCanvas(sim, modeKey, modeSettings)
// =============================================================================

// ── Mode descriptors ──────────────────────────────────────────────────────────

export const MODES = [
    { key: 'intro',           label: '1 · Intro',             accent: '#4f46e5', description: 'Full trajectory at peak height — no equations, no overlays. Good for problem context.' },
    { key: 'givens',          label: '2 · Givens',            accent: '#0891b2', description: 'Shows the launch setup with given values highlighted on the canvas.' },
    { key: 'vectorBreakdown', label: '3 · Vector Breakdown',  accent: '#d97706', description: 'v₀ splits into v₀x and v₀ᵧ — the component decomposition animation.' },
    { key: 'equation',        label: '4 · Equation',          accent: '#7c3aed', description: 'Equation panel overlay showing the decomposition equations.' },
    { key: 'solve',           label: '5 · Solve',             accent: '#059669', description: 'Exports one SVG per walkthrough step. Each step shows the canvas state and equation panel.' },
    { key: 'finalVector',     label: '6 · Final Vector',      accent: '#dc2626', description: 'Final velocity vector at landing — magnitude and direction fully labeled.' },
];

// ── Per-step display settings that can override global sim inputs ────────────────

export const STEP_DISPLAY_FIELDS = [
    { key: 'stopAnimation',             label: 'Stop Animation At',    type: 'select', options: ['End of Flight', 'Max Height', 'Custom Time'] },
    { key: 'customStopTime',            label: 'Custom Stop Time (s)', type: 'number', step: 0.1, default: 5 },
    { key: 'timingMode',                label: 'Overlay Timing',       type: 'select', options: ['Always', 'At End', 'At Max Height', 'At Custom Time'] },
    { key: 'listDisplay',               label: 'Variables List',       type: 'select', options: ['Hidden', 'Symbols', 'Values'] },
    { key: 'trailStyle',                label: 'Trail Style',          type: 'select', options: ['Dotted', 'Solid', 'None'] },
    { key: 'rulerStyle',                label: 'Ruler Style',          type: 'select', options: ['None', 'Simple', 'Detailed'] },
    { key: 'accelerationPlacement',     label: 'Accel Placement',      type: 'select', options: ['Auto', 'Near Object', 'Above Arc', 'Left Side', 'Right Side', 'Below Motion'] },
    { key: 'accelerationOffsetX',       label: 'Accel Offset X',       type: 'number', step: 5,   default: 0 },
    { key: 'accelerationOffsetY',       label: 'Accel Offset Y',       type: 'number', step: 5,   default: 0 },
    { key: 'workAnalysisStepDuration',  label: 'Step Duration (s)',     type: 'number', step: 0.1, default: 2.2 },
    { key: 'showVelocityVectors',       label: 'Velocity Vectors',     type: 'bool' },
    { key: 'showInitialVelocityVector', label: 'Launch Vector',        type: 'bool' },
    { key: 'showDistanceMarkers',       label: 'X/Y Distance Lines',   type: 'bool' },
    { key: 'showAngleArc',              label: 'Launch Angle Arc',     type: 'bool' },
    { key: 'showComponents',            label: 'Live Vx/Vy',           type: 'bool' },
    { key: 'showMaxHeight',             label: 'Max Height Line',      type: 'bool' },
    { key: 'showTimerDisplay',          label: 'Canvas Timer',         type: 'bool' },
    { key: 'showEquations',             label: 'Equation Box',         type: 'bool' },
    { key: 'useProjectileXValues',      label: 'X Equations (not Y)',  type: 'bool' },
    { key: 'showProblemLabels',         label: 'Problem Labels',       type: 'bool' },
    { key: 'showAccelerationVector',    label: 'Acceleration Vector',  type: 'bool' },
    { key: 'showMomentumVector',        label: 'Momentum Vector',      type: 'bool' },
    { key: 'showGhostFrames',           label: 'Ghost Frames',         type: 'bool' },
    { key: 'showXDisplacementGhosts',   label: 'X Displacement Ghost', type: 'bool' },
    { key: 'showYDisplacementGhosts',   label: 'Y Displacement Ghost', type: 'bool' },
    { key: 'autoScaleToFit',            label: 'Auto Scale to Fit',    type: 'bool' },
    { key: 'showLaunchCannon',          label: 'Launch Cannon',        type: 'bool' },
    { key: 'showDropPlaneGuide',        label: 'Airplane Guide',       type: 'bool' },
];

// ── Default settings per mode (capture timing only — display settings live in main controls) ──

export const DEFAULT_SETTINGS = {
    intro:           { captureTime: 'peak',          listDisplay: 'Values' },
    givens:          { captureTime: 'start',         listDisplay: 'Values', animateGivenValues: true },
    vectorBreakdown: { captureTime: 'breakdown-end', listDisplay: 'Values', showVectorBreakdown: true },
    equation:        { captureTime: 'breakdown-end', listDisplay: 'Values' },
    solve:           { captureTime: 'peak',          listDisplay: 'Values' },
    finalVector:     { captureTime: 'end',           listDisplay: 'Values', showFinalVectorAdditionZoom: true, captureVectorBreakdownInSvg: true },
};

// Keys in DEFAULT_SETTINGS that map directly to sim inputs and are applied as overrides during export/preview.
export const MODE_INPUT_KEYS = ['listDisplay', 'animateGivenValues', 'showVectorBreakdown', 'showFinalVectorAdditionZoom', 'captureVectorBreakdownInSvg'];

// ── localStorage helpers ──────────────────────────────────────────────────────

const LS_PREFIX        = 'k2d-mode-svg-v1-';
const LS_DEFAULTS      = 'k2d-mode-svg-global-defaults';
const LS_STEP_PREFIX   = 'k2d-step-settings-v2-';
const LS_STEP_DEFAULTS = 'k2d-step-settings-defaults-v2';

function loadGlobalDefaults() {
    try {
        const raw = localStorage.getItem(LS_DEFAULTS);
        if (raw) {
            const parsed = JSON.parse(raw);
            return Object.fromEntries(
                MODES.map(m => [m.key, { ...DEFAULT_SETTINGS[m.key], ...(parsed[m.key] || {}) }])
            );
        }
    } catch (_) { /* ignore */ }
    return null;
}

export function saveGlobalDefaults(allSettings) {
    try {
        localStorage.setItem(LS_DEFAULTS, JSON.stringify(allSettings));
    } catch (_) { /* quota / private-browsing */ }
}

export function loadSettings(typeKey) {
    try {
        const raw = localStorage.getItem(LS_PREFIX + (typeKey || 'auto'));
        if (raw) {
            const parsed = JSON.parse(raw);
            return Object.fromEntries(
                MODES.map(m => [m.key, {
                    captureTime: parsed[m.key]?.captureTime ?? DEFAULT_SETTINGS[m.key].captureTime,
                    listDisplay: parsed[m.key]?.listDisplay ?? DEFAULT_SETTINGS[m.key].listDisplay,
                }])
            );
        }
    } catch (_) { /* ignore parse errors */ }
    const globalDefaults = loadGlobalDefaults();
    if (globalDefaults) {
        return Object.fromEntries(
            MODES.map(m => [m.key, {
                captureTime: globalDefaults[m.key]?.captureTime ?? DEFAULT_SETTINGS[m.key].captureTime,
                listDisplay: globalDefaults[m.key]?.listDisplay ?? DEFAULT_SETTINGS[m.key].listDisplay,
            }])
        );
    }
    return Object.fromEntries(MODES.map(m => [m.key, { ...DEFAULT_SETTINGS[m.key] }]));
}

export function saveSettings(typeKey, allSettings) {
    try {
        localStorage.setItem(LS_PREFIX + (typeKey || 'auto'), JSON.stringify(allSettings));
    } catch (_) { /* quota / private-browsing */ }
}

function loadStepOverlayGlobalDefaults() {
    try {
        const raw = localStorage.getItem(LS_STEP_DEFAULTS);
        if (raw) return JSON.parse(raw);
    } catch (_) {}
    return null;
}

export function saveStepOverlayGlobalDefaults(stepOverlays) {
    try { localStorage.setItem(LS_STEP_DEFAULTS, JSON.stringify(stepOverlays)); } catch (_) {}
}

export function loadStepOverlays(typeKey) {
    try {
        const raw = localStorage.getItem(LS_STEP_PREFIX + (typeKey || 'auto'));
        if (raw) return JSON.parse(raw);
    } catch (_) {}
    const globalDefaults = loadStepOverlayGlobalDefaults();
    return globalDefaults || {};
}

export function saveStepOverlays(typeKey, stepOverlays) {
    try { localStorage.setItem(LS_STEP_PREFIX + (typeKey || 'auto'), JSON.stringify(stepOverlays)); } catch (_) {}
}

// ── Step overlay helpers ──────────────────────────────────────────────────────

// Returns the overlay object for stepId, creating it if missing or in legacy array format.
// Returns null if state or state.stepOverlays is unavailable.
function getOrCreateStepOverlay(state, stepId) {
    if (!state || !state.stepOverlays || !stepId) return null;
    if (!state.stepOverlays[stepId] || Array.isArray(state.stepOverlays[stepId])) {
        state.stepOverlays[stepId] = {};
    }
    return state.stepOverlays[stepId];
}

// ── Capture-time resolution ───────────────────────────────────────────────────

// Returns the animation time (seconds) at which to capture the SVG frame.
export function resolveCaptureTime(sim, modeSettings) {
    const ct = modeSettings.captureTime;
    const model = sim.computeProjectileModel(0);
    const bd = model.breakdownDuration || 0;
    const motionStop = model.motionStopTime ?? model.tFlight ?? 0;

    if (ct === 'start') return 0;
    if (ct === 'peak')  return bd + (model.tPeak ?? 0);
    if (ct === 'end')   return bd + motionStop;
    if (ct === 'breakdown-end') {
        // Capture at ~91 % of the vector-breakdown animation → 'equations' stage
        const duration = (sim.vectorBreakdownDuration ?? 6.2);
        return duration * 0.91;
    }
    if (typeof ct === 'number' && Number.isFinite(ct)) return ct;
    return 0;
}

// ── Panel HTML builder ────────────────────────────────────────────────────────

function esc(v) {
    return String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}


function buildCaptureOptions(current) {
    const isCustom = typeof current === 'number';
    const sel = isCustom ? 'custom' : (current || 'peak');
    return [
        ['start',         'Start (t = 0)'],
        ['peak',          'Peak Height'],
        ['end',           'End of Flight'],
        ['breakdown-end', 'Vector Breakdown Stage'],
        ['custom',        'Custom (seconds)…'],
    ].map(([v, l]) => `<option value="${v}"${sel === v ? ' selected' : ''}>${l}</option>`).join('');
}

function buildSettingsForm(modeKey, allSettings) {
    const s = { ...DEFAULT_SETTINGS[modeKey], ...allSettings[modeKey] };
    const isCustomTime = typeof s.captureTime === 'number';
    const customVal    = isCustomTime ? s.captureTime : 4;
    const mode         = MODES.find(m => m.key === modeKey);
    const modeAccent   = mode?.accent || '#4f46e5';

    const sel = (key, options) =>
        `<select data-ms="${esc(key)}" style="width:100%;border:1px solid var(--border);border-radius:0.5rem;padding:0.35rem 0.55rem;font-size:0.78rem;font-weight:600;background:white;color:var(--text-primary);margin-bottom:0.35rem;">${options}</select>`;

    return `
        <div class="module-extension__card" style="margin-top:0.55rem;max-width:340px;">
            ${mode?.description ? `<p style="font-size:0.76rem;color:var(--text-secondary);margin:0 0 0.7rem;line-height:1.5;font-style:italic;border-left:3px solid ${modeAccent};padding-left:0.55rem;">${esc(mode.description)}</p>` : ''}
            <h4 style="font-size:0.65rem;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted);margin:0 0 0.45rem;">Capture Time</h4>
            ${sel('captureTime', buildCaptureOptions(s.captureTime))}
            <div data-custom-row style="display:${isCustomTime ? '' : 'none'};">
                <input type="number" data-ms="captureTimeCustom" value="${customVal}" step="0.5" min="0"
                    style="width:100%;border:1px solid var(--border);border-radius:0.5rem;padding:0.35rem 0.55rem;font-size:0.78rem;font-weight:600;background:white;color:var(--text-primary);margin-bottom:0.35rem;">
            </div>
            <div style="margin-top:0.45rem;padding-top:0.45rem;border-top:1px solid var(--border-subtle);">
                <label style="font-size:0.65rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;display:block;margin-bottom:0.3rem;">Variables List</label>
                ${sel('listDisplay',
                    ['Hidden','Symbols','Values'].map(v =>
                        `<option${s.listDisplay === v ? ' selected' : ''}>${v}</option>`
                    ).join('')
                )}
            </div>
            ${modeKey === 'givens' ? `
            <div style="margin-top:0.45rem;padding-top:0.45rem;border-top:1px solid var(--border-subtle);">
                <label style="display:flex;align-items:center;gap:0.45rem;font-size:0.78rem;font-weight:600;color:var(--text-primary);cursor:pointer;">
                    <input type="checkbox" data-ms="animateGivenValues"${s.animateGivenValues ? ' checked' : ''}>
                    Animate Given Values Into Cards
                </label>
            </div>` : ''}
            ${modeKey === 'vectorBreakdown' ? `
            <div style="margin-top:0.45rem;padding-top:0.45rem;border-top:1px solid var(--border-subtle);">
                <label style="display:flex;align-items:center;gap:0.45rem;font-size:0.78rem;font-weight:600;color:var(--text-primary);cursor:pointer;">
                    <input type="checkbox" data-ms="showVectorBreakdown"${s.showVectorBreakdown ? ' checked' : ''}>
                    Show Vector Breakdown
                </label>
            </div>` : ''}
            ${modeKey === 'finalVector' ? `
            <div style="margin-top:0.45rem;padding-top:0.45rem;border-top:1px solid var(--border-subtle);display:flex;flex-direction:column;gap:0.35rem;">
                <label style="display:flex;align-items:center;gap:0.45rem;font-size:0.78rem;font-weight:600;color:var(--text-primary);cursor:pointer;">
                    <input type="checkbox" data-ms="showFinalVectorAdditionZoom"${s.showFinalVectorAdditionZoom ? ' checked' : ''}>
                    Show Final Vector Addition Zoom
                </label>
                <label style="display:flex;align-items:center;gap:0.45rem;font-size:0.78rem;font-weight:600;color:var(--text-primary);cursor:pointer;">
                    <input type="checkbox" data-ms="captureVectorBreakdownInSvg"${s.captureVectorBreakdownInSvg ? ' checked' : ''}>
                    Capture Vector Breakdown In SVG
                </label>
            </div>` : ''}
        </div>`;
}

function buildStepOverlayForm(state) {
    const { currentSteps, activeStepId, stepOverlays } = state;
    if (!currentSteps || !currentSteps.length) {
        return `<p style="font-size:0.76rem;color:var(--text-muted);margin:0.5rem 0;">No steps available for the current problem type.</p>`;
    }
    const activeStep = currentSteps.find(s => s.id === activeStepId) || currentSteps[0];
    const saved = (stepOverlays[activeStep.id] && !Array.isArray(stepOverlays[activeStep.id]))
        ? stepOverlays[activeStep.id] : {};
    const stepAccent = activeStep.accent || '#4f46e5';
    const instruction = activeStep.focusLabel || '';
    const captureTime = saved.captureTime ?? 'peak';
    const showExplanation = saved.showExplanation ?? false;
    const panelPosition = saved.panelPosition ?? 'top-right';
    const panelNudgeX = saved.panelNudgeX ?? 0;
    const panelNudgeY = saved.panelNudgeY ?? 0;
    const isCustomTime = typeof captureTime === 'number';
    const customVal = isCustomTime ? captureTime : 4;
    const animationSource = saved.animationSource ?? 'step-segment';
    const customStartTime = saved.customStartTime ?? 0;
    const customEndTime = saved.customEndTime ?? 5;
    const hoverKey = saved.hoverKey ?? '';
    // displayOverrides: per-step overrides for sim display inputs (null/absent = use global)
    // backward-compat: migrate top-level listDisplay into displayOverrides
    const displayOverrides = { ...(saved.displayOverrides || {}) };
    if (displayOverrides.listDisplay === undefined && saved.listDisplay !== undefined) {
        displayOverrides.listDisplay = saved.listDisplay;
    }

    const stepTabHtml = currentSteps.map((step, i) => `
        <button data-step-tab="${esc(step.id)}" style="
            padding:0.25rem 0.6rem;border-radius:0.4rem;
            border:1.5px solid ${step.id === activeStep.id ? (step.accent || '#4f46e5') : 'var(--border)'};
            background:${step.id === activeStep.id ? (step.accent || '#4f46e5') : 'white'};
            color:${step.id === activeStep.id ? 'white' : 'var(--text-secondary)'};
            font-family:inherit;font-size:0.67rem;font-weight:700;cursor:pointer;white-space:nowrap;">
            ${esc(`${i + 1}. ${step.title || step.id}`)}
        </button>
    `).join('');

    const sel = (attr, options) =>
        `<select ${attr} style="width:100%;border:1px solid var(--border);border-radius:0.5rem;padding:0.35rem 0.55rem;font-size:0.78rem;font-weight:600;background:white;color:var(--text-primary);margin-bottom:0.35rem;">${options}</select>`;

    return `
        <div style="display:flex;gap:0.3rem;flex-wrap:wrap;margin-bottom:0.6rem;">
            ${stepTabHtml}
        </div>
        <div class="module-extension__card">
            <h4 style="font-size:0.65rem;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:${stepAccent};margin:0 0 0.4rem;">
                ${esc(activeStep.title || activeStep.id)}
            </h4>
            ${instruction ? `<p style="font-size:0.76rem;color:var(--text-secondary);margin:0 0 0.55rem;line-height:1.5;font-style:italic;border-left:3px solid ${stepAccent};padding-left:0.55rem;">${esc(instruction)}</p>` : ''}
            ${Array.isArray(activeStep.lines) && activeStep.lines.length ? `
            <div style="margin:0 0 0.7rem;display:grid;gap:0.18rem;">
                ${activeStep.lines.map(line => `<p style="font-size:0.73rem;color:#1e293b;margin:0;line-height:1.4;font-family:'Cambria Math','STIX Two Math',serif;">${esc(line)}</p>`).join('')}
            </div>` : ''}
            <label style="display:flex;align-items:center;gap:0.45rem;margin-bottom:0.45rem;cursor:pointer;">
                <input type="checkbox" data-step-ms="showExplanation" ${showExplanation ? 'checked' : ''}
                    style="width:15px;height:15px;accent-color:${stepAccent};cursor:pointer;flex-shrink:0;">
                <span style="font-size:0.74rem;font-weight:700;color:var(--text-secondary);">Show Step Explanation on Canvas</span>
            </label>
            <div id="msvg-step-position-row" style="display:${showExplanation ? '' : 'none'};padding:0.5rem 0.55rem;background:#f8fafc;border-radius:0.5rem;border:1px solid var(--border-subtle);margin-bottom:0.5rem;">
                <label style="font-size:0.65rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;display:block;margin-bottom:0.3rem;">Panel Position</label>
                ${sel('data-step-ms="panelPosition"', [
                    ['top-left',      'Top – Left'],
                    ['top-center',    'Top – Center'],
                    ['top-right',     'Top – Right (default)'],
                    ['middle-left',   'Middle – Left'],
                    ['middle-right',  'Middle – Right'],
                    ['bottom-left',   'Bottom – Left'],
                    ['bottom-center', 'Bottom – Center'],
                    ['bottom-right',  'Bottom – Right'],
                ].map(([v, l]) => `<option value="${v}"${panelPosition === v ? ' selected' : ''}>${l}</option>`).join(''))}
                <div style="display:flex;gap:0.5rem;margin-top:0.1rem;">
                    <div style="flex:1;">
                        <label style="font-size:0.63rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;display:block;margin-bottom:0.2rem;">X Nudge (px)</label>
                        <input type="number" data-step-ms="panelNudgeX" value="${panelNudgeX}" step="5"
                            style="width:100%;border:1px solid var(--border);border-radius:0.4rem;padding:0.28rem 0.45rem;font-size:0.78rem;font-weight:600;background:white;color:var(--text-primary);">
                    </div>
                    <div style="flex:1;">
                        <label style="font-size:0.63rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;display:block;margin-bottom:0.2rem;">Y Nudge (px)</label>
                        <input type="number" data-step-ms="panelNudgeY" value="${panelNudgeY}" step="5"
                            style="width:100%;border:1px solid var(--border);border-radius:0.4rem;padding:0.28rem 0.45rem;font-size:0.78rem;font-weight:600;background:white;color:var(--text-primary);">
                    </div>
                </div>
            </div>
            <label style="font-size:0.65rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;display:block;margin-bottom:0.3rem;">Capture Time</label>
            ${sel('data-step-ms="captureTime"', buildCaptureOptions(captureTime))}
            <div data-step-custom-row style="display:${isCustomTime ? '' : 'none'};">
                <input type="number" data-step-ms="captureTimeCustom" value="${customVal}" step="0.5" min="0"
                    style="width:100%;border:1px solid var(--border);border-radius:0.5rem;padding:0.35rem 0.55rem;font-size:0.78rem;font-weight:600;background:white;color:var(--text-primary);margin-bottom:0.35rem;">
            </div>
            <div style="margin-top:0.5rem;padding-top:0.5rem;border-top:1px solid var(--border-subtle);">
                <label style="font-size:0.65rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;display:block;margin-bottom:0.3rem;">Animation Source</label>
                ${sel('data-step-ms="animationSource"', [
                    ['step-segment', 'Step Segment (auto)'],
                    ['full-flight',  'Full Flight'],
                    ['breakdown',    'Vector Breakdown'],
                    ['custom-range', 'Custom Range…'],
                ].map(([v, l]) => `<option value="${v}"${animationSource === v ? ' selected' : ''}>${l}</option>`).join(''))}
                <div data-step-anim-custom-row style="display:${animationSource === 'custom-range' ? 'flex' : 'none'};gap:0.5rem;margin-top:0.18rem;margin-bottom:0.25rem;">
                    <div style="flex:1;">
                        <label style="font-size:0.63rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;display:block;margin-bottom:0.2rem;">Start (s)</label>
                        <input type="number" data-step-ms="customStartTime" value="${customStartTime}" step="0.5" min="0"
                            style="width:100%;border:1px solid var(--border);border-radius:0.4rem;padding:0.28rem 0.45rem;font-size:0.78rem;font-weight:600;background:white;color:var(--text-primary);">
                    </div>
                    <div style="flex:1;">
                        <label style="font-size:0.63rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;display:block;margin-bottom:0.2rem;">End (s)</label>
                        <input type="number" data-step-ms="customEndTime" value="${customEndTime}" step="0.5" min="0"
                            style="width:100%;border:1px solid var(--border);border-radius:0.4rem;padding:0.28rem 0.45rem;font-size:0.78rem;font-weight:600;background:white;color:var(--text-primary);">
                    </div>
                </div>
                <label style="font-size:0.65rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;display:block;margin-top:0.4rem;margin-bottom:0.3rem;">Hover Animation</label>
                ${sel('data-step-ms="hoverKey"', [
                    ['',             'None'],
                    ['x:displacement','Δx – Construction Walk'],
                    ['y:displacement','Δy – Rappel / Climb'],
                    ['y:hmax',        'hₘₐₓ – Ladder / Tightrope'],
                    ['x:v0',          'v₀ₓ – Launch Vector X'],
                    ['y:v0',          'v₀ᵧ – Launch Vector Y'],
                    ['x:v',           'vₓ – Radar Gun (final)'],
                    ['y:v',           'vᵧ – Radar Gun (final)'],
                    ['x:a',           'aₓ – Zero Accel (z\'s)'],
                    ['y:a',           'aᵧ – Gravity / Apple Tree'],
                    ['y:t',           't – Flight Timer (Jumbotron)'],
                ].map(([v, l]) => `<option value="${v}"${hoverKey === v ? ' selected' : ''}>${l}</option>`).join(''))}
            </div>
            <div style="margin-top:0.5rem;padding-top:0.5rem;border-top:1px solid var(--border-subtle);">
                <h5 style="font-size:0.63rem;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted);margin:0 0 0.45rem;">Display Settings</h5>
                ${STEP_DISPLAY_FIELDS.filter(f => f.type === 'select' || f.type === 'number').map(field => {
                    const inputStyle = `width:100%;border:1px solid var(--border);border-radius:0.4rem;padding:0.25rem 0.4rem;font-size:0.75rem;font-weight:600;background:white;color:var(--text-primary);`;
                    const labelHtml = `<label style="font-size:0.62rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;display:block;margin-bottom:0.12rem;">${esc(field.label)}</label>`;
                    let input;
                    if (field.type === 'number') {
                        const cur = displayOverrides[field.key] ?? field.default ?? 0;
                        input = `<input type="number" data-step-display="${esc(field.key)}" value="${cur}" step="${field.step ?? 1}" style="${inputStyle}">`;
                    } else {
                        const cur = displayOverrides[field.key] ?? field.options[0];
                        input = `<select data-step-display="${esc(field.key)}" style="${inputStyle}">${field.options.map(o => `<option value="${esc(o)}"${cur===o?' selected':''}>${esc(o)}</option>`).join('')}</select>`;
                    }
                    return `<div style="margin-bottom:0.3rem;">${labelHtml}${input}</div>`;
                }).join('')}
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.1rem 0.4rem;margin-top:0.25rem;">
                    ${STEP_DISPLAY_FIELDS.filter(f => f.type === 'bool').map(field => {
                        const isChecked = displayOverrides[field.key] === true;
                        return `<label style="display:flex;align-items:center;gap:0.3rem;cursor:pointer;padding:0.18rem 0.1rem;border-radius:0.3rem;">
                            <input type="checkbox" data-step-display="${esc(field.key)}" ${isChecked ? 'checked' : ''}
                                style="width:13px;height:13px;accent-color:${stepAccent};cursor:pointer;flex-shrink:0;margin:0;">
                            <span style="font-size:0.7rem;color:var(--text-secondary);font-weight:600;line-height:1.2;">${esc(field.label)}</span>
                        </label>`;
                    }).join('')}
                </div>
            </div>
        </div>
        <div style="display:flex;gap:0.45rem;margin-top:0.7rem;flex-wrap:wrap;">
            <button id="msvg-save-step-defaults"
                style="padding:0.32rem 0.75rem;border-radius:0.45rem;border:1.5px solid #d97706;background:white;color:#d97706;font-family:inherit;font-size:0.72rem;font-weight:700;cursor:pointer;"
                title="Save all steps' current settings as the global default for future problem types">Save as Default</button>
            <button id="msvg-reset-step"
                style="padding:0.32rem 0.6rem;border-radius:0.45rem;border:1.5px solid var(--border);background:white;color:var(--text-muted);font-family:inherit;font-size:0.72rem;font-weight:700;cursor:pointer;"
                title="Reset this step's settings to defaults">Reset Step</button>
        </div>`;
}

export function buildModeSvgPanel(sim, state) {
    const { activeMode, allSettings, typeKey, typeTitle, activeSection } = state;
    const section = activeSection || 'modes';
    const activeModeObj = MODES.find(m => m.key === activeMode) || MODES[0];

    const sectionBtn = (key, label) => `
        <button data-section-tab="${key}" style="
            padding:0.27rem 0.72rem;border-radius:0.4rem;
            border:1.5px solid ${section === key ? '#0f172a' : 'var(--border)'};
            background:${section === key ? '#0f172a' : 'white'};
            color:${section === key ? 'white' : 'var(--text-secondary)'};
            font-family:inherit;font-size:0.71rem;font-weight:700;cursor:pointer;">
            ${label}
        </button>`;

    const headerButtons = section === 'modes' ? `
        <button id="msvg-preview"
            style="padding:0.32rem 0.75rem;border-radius:0.45rem;border:1.5px solid var(--border);background:white;color:var(--text-secondary);font-family:inherit;font-size:0.75rem;font-weight:700;cursor:pointer;">
            Preview
        </button>
        <button id="msvg-play"
            style="padding:0.32rem 0.75rem;border-radius:0.45rem;border:1.5px solid #059669;background:white;color:#059669;font-family:inherit;font-size:0.75rem;font-weight:700;cursor:pointer;">
            ▶ Play
        </button>
        <button id="msvg-export-this"
            style="padding:0.32rem 0.75rem;border-radius:0.45rem;border:1.5px solid ${activeModeObj.accent};background:white;color:${activeModeObj.accent};font-family:inherit;font-size:0.75rem;font-weight:700;cursor:pointer;">
            Export ${esc(activeModeObj.label)} SVG
        </button>
        <button id="msvg-export-all"
            style="padding:0.32rem 0.75rem;border-radius:0.45rem;border:1.5px solid var(--accent);background:var(--accent);color:white;font-family:inherit;font-size:0.75rem;font-weight:700;cursor:pointer;">
            Export All Modes
        </button>
        <button id="msvg-save-defaults"
            style="padding:0.32rem 0.75rem;border-radius:0.45rem;border:1.5px solid #d97706;background:white;color:#d97706;font-family:inherit;font-size:0.72rem;font-weight:700;cursor:pointer;"
            title="Save all modes' current settings as the global default for future problem types">Save as Default</button>
        <button id="msvg-reset"
            style="padding:0.32rem 0.6rem;border-radius:0.45rem;border:1.5px solid var(--border);background:white;color:var(--text-muted);font-family:inherit;font-size:0.72rem;font-weight:700;cursor:pointer;"
            title="Reset this mode to defaults">Reset</button>
    ` : '';

    const modeTabs = MODES.map(m => `
        <button data-mode-tab="${m.key}" style="
            padding:0.3rem 0.78rem;border-radius:0.45rem;border:1.5px solid ${m.key === activeMode ? m.accent : 'var(--border)'};
            background:${m.key === activeMode ? m.accent : 'white'};color:${m.key === activeMode ? 'white' : 'var(--text-secondary)'};
            font-family:inherit;font-size:0.72rem;font-weight:700;cursor:pointer;white-space:nowrap;transition:all 0.12s;
        ">${esc(m.label)}</button>
    `).join('');

    const mainContent = section === 'modes' ? `
        <div style="display:flex;gap:0.35rem;flex-wrap:wrap;margin-bottom:0.6rem;">
            ${modeTabs}
        </div>
        <div id="msvg-form-body">
            ${buildSettingsForm(activeMode, allSettings)}
        </div>
    ` : `
        <div id="msvg-step-body">
            ${buildStepOverlayForm(state)}
        </div>
    `;

    return `
        <div id="modeSvgEditorRoot">
            <div class="module-extension__header">
                <div>
                    <div class="module-extension__title">Mode SVG Export Settings</div>
                    <div class="module-extension__subtitle">${esc(typeTitle)}</div>
                </div>
                <div style="display:flex;gap:0.45rem;flex-wrap:wrap;align-items:center;">
                    ${headerButtons}
                </div>
            </div>

            <div style="display:flex;gap:0.35rem;flex-wrap:wrap;margin-bottom:0.6rem;align-items:center;">
                ${sectionBtn('modes', 'Modes')}
                ${sectionBtn('steps', 'Step Settings')}
                ${section === 'steps' ? `
                <button id="msvg-play-step"
                    style="padding:0.27rem 0.72rem;border-radius:0.4rem;border:1.5px solid #059669;background:white;color:#059669;font-family:inherit;font-size:0.71rem;font-weight:700;cursor:pointer;"
                    title="Preview the animation for this step">▶ Play Step</button>` : ''}
            </div>

            ${mainContent}
        </div>`;
}

// ── Event binding ─────────────────────────────────────────────────────────────

export function bindModeSvgPanelEvents(container, state, onChange) {
    // Section tab switches (Modes vs Step Overlays)
    container.querySelectorAll('[data-section-tab]').forEach(btn => {
        btn.addEventListener('click', () => {
            state.activeSection = btn.dataset.sectionTab;
            onChange('section');
        });
    });

    // Mode tab switches
    container.querySelectorAll('[data-mode-tab]').forEach(btn => {
        btn.addEventListener('click', () => {
            state.activeMode = btn.dataset.modeTab;
            onChange('tab');
        });
    });

    // Step tab switches
    container.querySelectorAll('[data-step-tab]').forEach(btn => {
        btn.addEventListener('click', () => {
            state.activeStepId = btn.dataset.stepTab;
            onChange('step-tab');
        });
    });

    // Step display setting changes (captureTime, listDisplay per step)
    container.querySelectorAll('[data-step-ms]').forEach(el => {
        const eventType = (el.type === 'number' || el.type === 'range') ? 'input' : 'change';
        el.addEventListener(eventType, () => {
            const key = el.dataset.stepMs;
            const stepId = state.activeStepId;
            const ms = getOrCreateStepOverlay(state, stepId);
            if (!ms) return;
            if (key === 'captureTime') {
                const customRow = container.querySelector('[data-step-custom-row]');
                if (el.value === 'custom') {
                    if (customRow) customRow.style.display = '';
                    const numInput = container.querySelector('[data-step-ms="captureTimeCustom"]');
                    const v = parseFloat(numInput?.value);
                    ms.captureTime = Number.isFinite(v) ? v : 4;
                } else {
                    if (customRow) customRow.style.display = 'none';
                    ms.captureTime = el.value;
                }
            } else if (key === 'captureTimeCustom') {
                const v = parseFloat(el.value);
                if (Number.isFinite(v)) ms.captureTime = v;
            } else if (key === 'listDisplay') {
                ms[key] = el.value;
            } else if (key === 'showExplanation') {
                ms[key] = el.checked;
                const posRow = container.querySelector('#msvg-step-position-row');
                if (posRow) posRow.style.display = el.checked ? '' : 'none';
            } else if (key === 'panelPosition') {
                ms[key] = el.value;
            } else if (key === 'panelNudgeX') {
                const v = parseInt(el.value, 10);
                ms[key] = Number.isFinite(v) ? v : 0;
            } else if (key === 'panelNudgeY') {
                const v = parseInt(el.value, 10);
                ms[key] = Number.isFinite(v) ? v : 0;
            } else if (key === 'animationSource') {
                ms[key] = el.value;
                const customRow = container.querySelector('[data-step-anim-custom-row]');
                if (customRow) customRow.style.display = el.value === 'custom-range' ? 'flex' : 'none';
            } else if (key === 'customStartTime' || key === 'customEndTime') {
                const v = parseFloat(el.value);
                if (Number.isFinite(v)) ms[key] = Math.max(0, v);
            } else if (key === 'hoverKey') {
                ms[key] = el.value || null;
            }
            onChange('step-setting');
        });
    });

    // Per-step display setting overrides
    container.querySelectorAll('[data-step-display]').forEach(el => {
        const eventType = el.type === 'number' ? 'input' : 'change';
        el.addEventListener(eventType, () => {
            const key = el.dataset.stepDisplay;
            const stepId = state.activeStepId;
            const ms = getOrCreateStepOverlay(state, stepId);
            if (!ms) return;
            if (!ms.displayOverrides) ms.displayOverrides = {};
            if (el.type === 'checkbox') {
                ms.displayOverrides[key] = el.checked;
            } else if (el.type === 'number') {
                const v = parseFloat(el.value);
                if (Number.isFinite(v)) ms.displayOverrides[key] = v;
            } else {
                ms.displayOverrides[key] = el.value;
            }
            onChange('step-setting');
        });
    });

    container.querySelector('#msvg-save-step-defaults')?.addEventListener('click', () => onChange('save-step-defaults'));
    container.querySelector('#msvg-reset-step')?.addEventListener('click', () => {
        const stepId = state.activeStepId;
        const step = (state.currentSteps || []).find(s => s.id === stepId);
        if (step && stepId) delete state.stepOverlays[stepId];
        onChange('reset-step');
    });

    // Mode setting changes (captureTime, listDisplay, and mode-specific toggles)
    container.querySelectorAll('[data-ms]').forEach(el => {
        el.addEventListener('change', () => {
            const key = el.dataset.ms;
            const ms  = state.allSettings[state.activeMode];
            if (!ms) return;

            if (key === 'captureTime') {
                const customRow = container.querySelector('[data-custom-row]');
                if (el.value === 'custom') {
                    if (customRow) customRow.style.display = '';
                    const numInput = container.querySelector('[data-ms="captureTimeCustom"]');
                    const v = parseFloat(numInput?.value);
                    ms.captureTime = Number.isFinite(v) ? v : 4;
                } else {
                    if (customRow) customRow.style.display = 'none';
                    ms.captureTime = el.value;
                }
            } else if (key === 'captureTimeCustom') {
                const v = parseFloat(el.value);
                if (Number.isFinite(v)) ms.captureTime = v;
            } else if (el.type === 'checkbox') {
                ms[key] = el.checked;
            } else {
                ms[key] = el.value;
            }

            onChange('setting');
        });
    });

    container.querySelector('#msvg-preview')?.addEventListener('click', () => onChange('preview'));
    container.querySelector('#msvg-play')?.addEventListener('click', () => onChange('play-mode'));
    container.querySelector('#msvg-play-step')?.addEventListener('click', () => onChange('play-step'));
    container.querySelector('#msvg-export-this')?.addEventListener('click', () => onChange('export-this'));
    container.querySelector('#msvg-export-all')?.addEventListener('click', () => onChange('export-all'));
    container.querySelector('#msvg-save-defaults')?.addEventListener('click', () => {
        saveGlobalDefaults(state.allSettings);
        onChange('save-defaults');
    });
    container.querySelector('#msvg-reset')?.addEventListener('click', () => {
        state.allSettings[state.activeMode] = { ...DEFAULT_SETTINGS[state.activeMode] };
        onChange('reset');
    });
}

// ── Canvas preview ────────────────────────────────────────────────────────────

// Apply mode settings to sim, render the frame at captureTime on the canvas.
// Does NOT restore inputs — caller decides when to re-draw normally.
export function previewModeOnCanvas(sim, modeKey, allSettings) {
    const ms = allSettings[modeKey] || DEFAULT_SETTINGS[modeKey];

    // Apply all mode-level input overrides (listDisplay, showVectorBreakdown, etc.)
    MODE_INPUT_KEYS.forEach(key => {
        if (ms[key] !== undefined) {
            sim.setInputValue(key, ms[key], { redraw: false });
        }
    });

    // Special: for solve mode preview, use the first step's time
    if (modeKey === 'solve') {
        const model    = sim.computeProjectileModel(0);
        const pType    = sim.getSelectedWorkAnalysisProblemType(model);
        const steps    = sim.getConfiguredWorkAnalysisSteps(model, pType);
        const step     = steps[0] || null;
        const cStep    = step ? sim.getWalkthroughCanvasStep(step) : null;
        const cTime    = step ? sim.getWalkthroughCanvasTime(step) : 0;

        sim.stopPreview();
        sim.ctx.fillStyle = sim.config.backgroundColor;
        sim.ctx.fillRect(0, 0, sim.width, sim.height);
        const prevStep = sim.activeWalkthroughStep;
        sim.activeWalkthroughStep = cStep;
        try { sim.drawFrame(sim.ctx, cTime); } finally { sim.activeWalkthroughStep = prevStep; }
        return;
    }

    const captureTime = resolveCaptureTime(sim, ms);
    sim.stopPreview();
    sim.ctx.fillStyle = sim.config.backgroundColor;
    sim.ctx.fillRect(0, 0, sim.width, sim.height);
    try { sim.drawFrame(sim.ctx, captureTime); } catch (_) { /* ignore */ }
}

// ── SVG export ────────────────────────────────────────────────────────────────

function downloadSvg(svgString, filename) {
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), { href: url, download: filename });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function slugify(str, fallback = 'item') {
    return String(str || fallback).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || fallback;
}

// Save the sim's current inputs, apply mode-level input overrides, run fn(), then restore.
function withInputs(sim, modeSettings, fn) {
    const saved = { ...sim.inputs };
    MODE_INPUT_KEYS.forEach(key => {
        if (modeSettings[key] !== undefined) {
            sim.setInputValue(key, modeSettings[key], { redraw: false });
        }
    });
    try     { return fn(); }
    finally { Object.entries(saved).forEach(([k, v]) => sim.setInputValue(k, v, { redraw: false })); }
}

// Export a single mode's SVG(s). Returns true on success.
export async function exportModeSvg(sim, modeKey, modeSettings, statusEl, stepSettings = {}) {
    if (typeof C2S === 'undefined') {
        if (statusEl) statusEl.innerText = 'SVG library (canvas2svg) not loaded.';
        return false;
    }

    if (modeKey === 'solve') {
        // One SVG per work-analysis step; per-step displayOverrides applied around each frame.
        // Apply mode-level overrides the same way as withInputs (MODE_INPUT_KEYS), then restore all.
        const savedGlobal = { ...sim.inputs };
        MODE_INPUT_KEYS.forEach(key => {
            if (modeSettings[key] !== undefined) {
                sim.setInputValue(key, modeSettings[key], { redraw: false });
            }
        });
        try {
            const model = sim.computeProjectileModel(0);
            const pType = sim.getSelectedWorkAnalysisProblemType(model);
            const steps = sim.getConfiguredWorkAnalysisSteps(model, pType);

            for (let i = 0; i < steps.length; i++) {
                if (statusEl) statusEl.innerText = `Exporting Solve — step ${i + 1} / ${steps.length}…`;
                const step        = steps[i];
                const stepSetting = (stepSettings[step.id] && !Array.isArray(stepSettings[step.id]))
                    ? stepSettings[step.id] : {};
                const displayOverrides = { ...(stepSetting.displayOverrides || {}) };
                // backward compat: top-level listDisplay
                if (displayOverrides.listDisplay === undefined && stepSetting.listDisplay !== undefined) {
                    displayOverrides.listDisplay = stepSetting.listDisplay;
                }

                // Apply per-step display overrides; track what changed for restore
                const stepChanges = {};
                Object.entries(displayOverrides).forEach(([k, v]) => {
                    if (v !== null && v !== undefined) {
                        stepChanges[k] = sim.inputs[k];
                        sim.setInputValue(k, v, { redraw: false });
                    }
                });

                const cStep = sim.getWalkthroughCanvasStep(step);
                const cTime = sim.getWalkthroughCanvasTime(step);
                const showExplanation = stepSetting.showExplanation === true;
                const svgData = sim.createSvgFrame(cTime, { walkthroughStep: cStep, drawStepPanel: showExplanation ? step : null });
                if (svgData) downloadSvg(svgData, `mode-solve-${String(i + 1).padStart(2, '0')}-${slugify(step.title)}.svg`);

                // Restore to mode-level state before next step
                Object.entries(stepChanges).forEach(([k, v]) => sim.setInputValue(k, v, { redraw: false }));
            }
        } finally {
            Object.entries(savedGlobal).forEach(([k, v]) => sim.setInputValue(k, v, { redraw: false }));
        }
    } else {
        withInputs(sim, modeSettings, () => {
            const captureTime = resolveCaptureTime(sim, modeSettings);
            const svgData     = sim.createSvgFrame(captureTime);
            if (svgData) downloadSvg(svgData, `mode-${modeKey}.svg`);
        });
    }

    return true;
}

// Play the full animation for the given mode, applying its MODE_INPUT_KEYS overrides.
// Restores inputs when the playback ends or is stopped externally.
export function playModeAnimation(sim, modeKey, allSettings) {
    const ms = allSettings[modeKey] || DEFAULT_SETTINGS[modeKey];

    const savedInputs = {};
    MODE_INPUT_KEYS.forEach(key => {
        if (ms[key] !== undefined) {
            savedInputs[key] = sim.inputs[key];
            sim.setInputValue(key, ms[key], { redraw: false });
        }
    });

    const startTime = 0;
    const endTime = Math.max(0.01, sim.getPlaybackDuration());

    sim.playSegment(startTime, endTime, {
        onEnd: () => {
            Object.entries(savedInputs).forEach(([k, v]) => sim.setInputValue(k, v, { redraw: false }));
        }
    });
}

// Export all 5 modes in order.
export async function exportAllModeSvgs(sim, allSettings, statusEl, stepSettings = {}) {
    if (typeof C2S === 'undefined') {
        if (statusEl) statusEl.innerText = 'SVG library (canvas2svg) not loaded.';
        return;
    }
    for (const mode of MODES) {
        if (statusEl) statusEl.innerText = `Exporting ${mode.label}…`;
        const ms = allSettings[mode.key] || DEFAULT_SETTINGS[mode.key];
        await exportModeSvg(sim, mode.key, ms, statusEl, stepSettings);
        await new Promise(r => setTimeout(r, 80));
    }
    if (statusEl) statusEl.innerText = 'All mode SVGs exported!';
    setTimeout(() => { if (statusEl?.innerText?.includes('exported')) statusEl.innerText = 'System Ready'; }, 2500);
}
