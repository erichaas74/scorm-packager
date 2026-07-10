// =============================================================================
// Kinematics2dWalkthroughInteraction.js
// =============================================================================
// Prototype mixin for Module2DKinematics.  Owns everything related to the
// step-by-step animation walkthrough:
//
//   • State management (active step index)
//   • Preview rendering helpers (renderWalkthroughStepPreview, requestCanvasRedraw)
//   • Canvas step/time helpers (getWalkthroughCanvasStep, getWalkthroughCanvasTime)
//   • Step navigation (handleStepAction)
//
// Consumed by Kinematics2d.js via:
//   Object.assign(Module2DKinematics.prototype, walkthroughInteractionMethods);
// =============================================================================
// unit-ApplicationFiles\unit-3 unit-ApplicationFiles\unit-3
import * as Kinematics2dWorkAnalysis from './Kinematics2dWorkAnalysis.js';
import {
    getResolvedStepSetting,
    getStepDisplayOverrides as resolveStepDisplayOverrides,
    resolveStepTime,
    resolveStepTimeRange
} from './Kinematics2dStepSettings.js';

const walkthroughInteractionMethods = {

    // -------------------------------------------------------------------------
    // State
    // -------------------------------------------------------------------------

    getStepSettingsStore() {
        return this._stepSettingsState?.stepSettings || {};
    },

    getStepSetting(stepOrId) {
        const step = typeof stepOrId === 'string' ? { id: stepOrId } : stepOrId;
        return getResolvedStepSetting(this.getStepSettingsStore(), step);
    },

    getStepDisplayOverrides(step) {
        return resolveStepDisplayOverrides(this.getStepSettingsStore(), step);
    },

    applyTemporaryInputOverrides(overrides = {}) {
        const savedInputs = {};
        Object.entries(overrides).forEach(([k, v]) => {
            if (v !== null && v !== undefined && k in this.inputs) {
                savedInputs[k] = this.inputs[k];
                this.setInputValue(k, v, { redraw: false });
            }
        });
        return () => {
            Object.entries(savedInputs).forEach(([k, v]) => this.setInputValue(k, v, { redraw: false }));
        };
    },

    applyTemporaryExportOverrides(overrides = {}) {
        const saved = {};
        Object.entries(overrides).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                saved[key] = this.exportSettings?.[key];
                this.exportSettings[key] = value;
            }
        });
        return () => {
            Object.entries(saved).forEach(([key, value]) => {
                if (value === undefined) delete this.exportSettings[key];
                else this.exportSettings[key] = value;
            });
        };
    },

    createWorkWalkthroughState() {
        return {};
    },

    isGivensMatchingTask() {
        return false;
    },

    getInputWalkthroughCanvasPolicy() {
        return null;
    },

    createStepState(overrides = {}) {
        return { stepIndex: 0, ...overrides };
    },

    resetStepState() {
        this.stepState = this.createStepState();
    },

    getStepState(steps) {
        if (!this.stepState) {
            this.stepState = this.createStepState();
        }
        const maxIndex = Math.max(0, steps.length - 1);
        if (this.stepState.stepIndex > maxIndex) {
            this.stepState.stepIndex = maxIndex;
        }
        return this.stepState;
    },

    // -------------------------------------------------------------------------
    // Canvas step / time helpers
    // -------------------------------------------------------------------------

    getWalkthroughPreviewModel() {
        return this.computeProjectileModel(0);
    },

    getWalkthroughCanvasStep(step) {
        if (!step) return null;
        const setting = this.getStepSetting(step);
        const focusValues = Array.isArray(setting.focusValueOverrides)
            ? setting.focusValueOverrides
            : (step.focusValues || []);
        return {
            ...step,
            focusValues,
            resultValues: step.resultValues || (step.resultValue ? [step.resultValue] : []),
            resultValue: step.resultValue || (step.resultValues?.[0]) || null
        };
    },

    getWalkthroughAnchorTime(step) {
        const baseModel = this.getWalkthroughPreviewModel();
        return Kinematics2dWorkAnalysis.timeForStepAnchor(baseModel, step);
    },

    getWalkthroughCanvasTime(step) {
        const setting = this.getStepSetting(step);
        const restoreInputs = this.applyTemporaryInputOverrides(this.getStepDisplayOverrides(step));
        const previousStep = this.activeWalkthroughStep;
        if (step?.animatedPanel) this.activeWalkthroughStep = this.getWalkthroughCanvasStep(step);
        try {
            const steps = this._stepSettingsState?.currentSteps || [];
            const stepIndex = steps.findIndex(candidate => candidate.id === step?.id);
            const range = stepIndex >= 0 ? resolveStepTimeRange(this, steps, stepIndex, setting) : null;
            return resolveStepTime(this, step, setting, range);
        } finally {
            this.activeWalkthroughStep = previousStep;
            restoreInputs();
        }
    },

    // -------------------------------------------------------------------------
    // Preview rendering
    // -------------------------------------------------------------------------

    renderWalkthroughStepPreview(step) {
        const setting = this.getStepSetting(step);
        const displayOverrides = this.getStepDisplayOverrides(step);

        // Tear down any live step hover loop AND any running play animation
        // before applying new overrides — their cleanup callbacks restore saved
        // inputs and would clobber the overrides if they fired later.
        this.stopPreview();

        const restoreInputs = this.applyTemporaryInputOverrides(displayOverrides);
        const canvasStep = this.getWalkthroughCanvasStep(step);
        const time = setting.showLaunch !== false ? this.getWalkthroughCanvasTime(step) : 0;

        const savedHoverKey = this.hoveredValueKey;
        const savedHoverStart = this._hoverAnimStartMs;
        if (setting.hoverKey) {
            this.hoveredValueKey = setting.hoverKey;
            this._hoverAnimStartMs = performance.now() - 1500;
        }

        this.ctx.fillStyle = this.config.backgroundColor;
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.activeWalkthroughStep = canvasStep;
        try {
            this.drawFrame(this.ctx, time);
            if (step && setting.showExplanation === true && typeof this.drawStepPanel === 'function') {
                this.drawStepPanel(this.ctx, step);
            }
        } finally {
            this.activeWalkthroughStep = null;
            this.hoveredValueKey = savedHoverKey;
            this._hoverAnimStartMs = savedHoverStart;
            restoreInputs();
        }
        this.syncExternalPanels({ force: true });

        // After the static snapshot, start a live RAF loop so the selected hover
        // animation plays continuously while the user views this step.
        if (setting.hoverKey) {
            this._startStepHoverPreview(setting.hoverKey, canvasStep, time, displayOverrides);
        }

        if (step && this._stepSettingsState && this._stepSettingsState.activeStepId !== step.id) {
            this._stepSettingsState.activeStepId = step.id;
        }
    },

    _startStepHoverPreview(hoverKey, canvasStep, time, displayOverrides) {
        // Apply display overrides permanently (stored so cleanup can restore them).
        const restoreInputs = this.applyTemporaryInputOverrides(displayOverrides);
        this._stepHoverRestoreInputs = restoreInputs;

        this.hoveredValueKey = hoverKey;
        this._hoverAnimStartMs = performance.now();
        this._hoverPreviewTime = time;
        this.activeWalkthroughStep = canvasStep;

        this._startHoverLoop();
    },

    renderStepPreview(steps) {
        const state = this.getStepState(steps);
        const step = steps?.length ? steps[state.stepIndex] : null;
        this.renderWalkthroughStepPreview(step);
    },

    requestCanvasRedraw() {
        if (!this.ctx) return;
        this.stopPreview();
        this.ctx.fillStyle = this.config.backgroundColor;
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.activeWalkthroughStep = null;
        this.drawFrame(this.ctx, 0);
    },

    // -------------------------------------------------------------------------
    // Sequence navigation
    // -------------------------------------------------------------------------

    handleStepAction(action, steps) {
        const state = this.getStepState(steps);

        if (action === 'prev' && state.stepIndex > 0) {
            state.stepIndex -= 1;
        } else if (action === 'next' && state.stepIndex < steps.length - 1) {
            state.stepIndex += 1;
        } else if (action === 'reset') {
            this.stepState = this.createStepState();
        }

        this.renderStepPreview(steps);
    },

    // -------------------------------------------------------------------------
    // Export helpers
    // -------------------------------------------------------------------------

    // Resolves the animation time range for a step, respecting its animationSource setting.
    getStepAnimationTimeRange(steps, stepIndex) {
        const step = steps[stepIndex];
        if (!step) return { startTime: 0, endTime: 0.1 };

        const setting = this.getStepSetting(step);

        const restoreInputs = this.applyTemporaryInputOverrides(this.getStepDisplayOverrides(step));
        const previousStep = this.activeWalkthroughStep;
        if (step?.animatedPanel) this.activeWalkthroughStep = this.getWalkthroughCanvasStep(step);

        try {
            const flightSources = ['full-flight', 'step-window', 'custom-range'];
            if (setting.showLaunch === false && flightSources.includes(setting.animationSource)) {
                // Motion is frozen at launch for these clips; make the window long
                // enough for the given-value fly-in animation to complete.
                const transferDuration = this.getProblemValueTransferDuration?.() || 0;
                return { startTime: 0, endTime: Math.max(3, transferDuration + 0.5) };
            }
            const { startTime, endTime } = resolveStepTimeRange(this, steps, stepIndex, setting);
            return { startTime, endTime };
        } finally {
            this.activeWalkthroughStep = previousStep;
            restoreInputs();
        }
    },

    prepareStepAnimationContext(step) {
        this.activeWalkthroughStep = this.getWalkthroughCanvasStep(step);
    },

    getStepWindowTimeRange(steps, stepIndex) {
        const model = this.getWalkthroughPreviewModel();
        const stepDuration = model.workStepDuration || this.getWorkAnalysisStepDuration();
        const breakdownDuration = Math.max(0, model.breakdownDuration || 0);
        const workAnalysisDuration = Math.max(0, model.workAnalysisDuration || (steps.length * stepDuration));
        const workAnalysisEnd = breakdownDuration + workAnalysisDuration;
        const startTime = Math.min(workAnalysisEnd, breakdownDuration + (stepIndex * stepDuration));
        const endTime = Math.min(workAnalysisEnd, startTime + stepDuration);
        const minClipLength = 1 / Math.max(1, this.exportSettings?.fps || this.config.fps || 30);
        return {
            model,
            step: steps[stepIndex],
            stepIndex,
            startTime,
            endTime: Math.max(startTime + minClipLength, endTime)
        };
    },

    playWalkthroughStepAnimation(steps, stepIndex) {
        const idx = stepIndex ?? this.getStepState(steps).stepIndex;
        const step = steps[idx];
        if (!step) return;

        // Stop any running play animation or step-hover preview FIRST, so their
        // cleanup callbacks (input restores, walkthrough-context clearing) run
        // before this play snapshots input state — not in the middle of it.
        this.stopPreview();

        const setting = this.getStepSetting(step);
        const { startTime, endTime } = this.getStepAnimationTimeRange(steps, idx);

        const flightSources = ['full-flight', 'step-window', 'custom-range', 'hover-animation'];
        const freezeMotion = setting.showLaunch === false && flightSources.includes(setting.animationSource);
        const displayOverrides = {
            ...this.getStepDisplayOverrides(step),
            // Freeze the projectile at launch while time still advances, so
            // time-driven overlays (given-value fly-ins, hover animations)
            // keep playing instead of the whole frame being pinned to t = 0.
            ...(freezeMotion ? { stopAnimation: 'Custom Time', customStopTime: 0 } : {})
        };
        const restoreInputs = this.applyTemporaryInputOverrides(displayOverrides);
        const savedHoverKey = this.hoveredValueKey;

        const speed = Math.max(0.1, Number(setting.playbackSpeed) || 1);
        const wallEndTime = startTime + ((endTime - startTime) / speed);
        this.playSegment(startTime, wallEndTime, {
            onFrame: (t) => {
                const mappedTime = Math.min(endTime, startTime + ((t - startTime) * speed));
                this.drawFrame(this.ctx, mappedTime);
                if (setting.showExplanation === true && typeof this.drawStepPanel === 'function') {
                    this.drawStepPanel(this.ctx, step);
                }
                this.syncExternalPanels();
            },
            onEnd: () => {
                this.activeWalkthroughStep = null;
                this.hoveredValueKey = savedHoverKey;
                restoreInputs();
            }
        });

        // playSegment() begins with stopPreview(), whose step-hover cleanup
        // clears activeWalkthroughStep — so the step context and hover key must
        // be applied AFTER it starts, or step overlays never render.
        this.prepareStepAnimationContext(step);
        if (setting.hoverKey) {
            this.hoveredValueKey = setting.hoverKey;
            this._hoverAnimStartMs = performance.now();
        }
    }

};

export default walkthroughInteractionMethods;
