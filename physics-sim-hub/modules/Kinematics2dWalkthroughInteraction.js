// =============================================================================
// Kinematics2dWalkthroughInteraction.js
// =============================================================================
// Prototype mixin for Module2DKinematics.  Owns everything related to the
// step-by-step animation walkthrough:
//
//   • State management (sequence step index)
//   • Preview rendering helpers (renderWalkthroughStepPreview, requestCanvasRedraw)
//   • Canvas step/time helpers (getWalkthroughCanvasStep, getWalkthroughCanvasTime)
//   • Sequence navigation (handleWorkSequenceAction)
//   • Panel event binding (bindWorkAnalysisSequencePanelEvents)
//   • Export helpers (exportWalkthroughStep, exportAllWalkthroughSteps)
//
// Consumed by Kinematics2d.js via:
//   Object.assign(Module2DKinematics.prototype, walkthroughInteractionMethods);
// =============================================================================
// unit-ApplicationFiles\unit-3 unit-ApplicationFiles\unit-3
import * as Kinematics2dWorkAnalysis from './Kinematics2dWorkAnalysis.js';

const walkthroughInteractionMethods = {

    // -------------------------------------------------------------------------
    // State
    // -------------------------------------------------------------------------

    createWorkWalkthroughState() {
        return {};
    },

    isGivensMatchingTask() {
        return false;
    },

    getInputWalkthroughCanvasPolicy() {
        return null;
    },

    createWorkSequenceState(overrides = {}) {
        return { stepIndex: 0, ...overrides };
    },

    resetWorkWalkthroughState() {
        this.workSequenceState = this.createWorkSequenceState();
    },

    getWorkSequenceState(steps) {
        if (!this.workSequenceState) {
            this.workSequenceState = this.createWorkSequenceState();
        }
        const maxIndex = Math.max(0, steps.length - 1);
        if (this.workSequenceState.stepIndex > maxIndex) {
            this.workSequenceState.stepIndex = maxIndex;
        }
        return this.workSequenceState;
    },

    // -------------------------------------------------------------------------
    // Canvas step / time helpers
    // -------------------------------------------------------------------------

    getWalkthroughPreviewModel() {
        return this.latestModel || this.computeProjectileModel(0);
    },

    getWalkthroughCanvasStep(step) {
        if (!step) return null;
        return {
            ...step,
            focusValues: step.focusValues || [],
            resultValues: step.resultValues || (step.resultValue ? [step.resultValue] : []),
            resultValue: step.resultValue || (step.resultValues?.[0]) || null
        };
    },

    getWalkthroughCanvasTime(step) {
        const baseModel = this.getWalkthroughPreviewModel();
        return Kinematics2dWorkAnalysis.timeForStepAnchor(baseModel, step);
    },

    // -------------------------------------------------------------------------
    // Preview rendering
    // -------------------------------------------------------------------------

    renderWalkthroughStepPreview(step) {
        const canvasStep = this.getWalkthroughCanvasStep(step);
        const time = this.getWalkthroughCanvasTime(step);

        // Resolve per-step display overrides
        const stepSetting = this._modeSvgState?.stepOverlays?.[step?.id];
        const setting = (stepSetting && !Array.isArray(stepSetting)) ? stepSetting : {};
        const displayOverrides = { ...(setting.displayOverrides || {}) };
        // backward compat: top-level listDisplay
        if (displayOverrides.listDisplay === undefined && setting.listDisplay !== undefined) {
            displayOverrides.listDisplay = setting.listDisplay;
        }

        // Temporarily apply per-step display overrides
        const savedInputs = {};
        Object.entries(displayOverrides).forEach(([k, v]) => {
            if (v !== null && v !== undefined && k in this.inputs) {
                savedInputs[k] = this.inputs[k];
                this.setInputValue(k, v, { redraw: false });
            }
        });

        this.stopPreview();
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
            Object.entries(savedInputs).forEach(([k, v]) => this.setInputValue(k, v, { redraw: false }));
        }
        this.syncExternalPanels({ force: true });

        // Keep Step Settings panel in sync with the current walkthrough step
        if (step && this._modeSvgState && this._modeSvgState.activeStepId !== step.id) {
            this._modeSvgState.activeStepId = step.id;
            if (this._modeSvgState.activeSection === 'steps' && typeof this._refreshModeSvgPanel === 'function') {
                this._refreshModeSvgPanel();
            }
        }
    },

    renderWorkAnalysisSequenceStepPreview(steps) {
        const state = this.getWorkSequenceState(steps);
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

    handleWorkSequenceAction(action, steps) {
        const state = this.getWorkSequenceState(steps);

        if (action === 'prev' && state.stepIndex > 0) {
            state.stepIndex -= 1;
        } else if (action === 'next' && state.stepIndex < steps.length - 1) {
            state.stepIndex += 1;
        } else if (action === 'reset') {
            this.workSequenceState = this.createWorkSequenceState();
        }

        this.renderWorkAnalysisSequenceStepPreview(steps);
    },

    // -------------------------------------------------------------------------
    // Panel event binding
    // -------------------------------------------------------------------------

    bindWorkAnalysisSequencePanelEvents(steps) {
        if (!this.moduleExtension) return;

        this.moduleExtension.querySelectorAll('[data-work-sequence-action]').forEach((button) => {
            button.addEventListener('click', () => {
                this.handleWorkSequenceAction(button.dataset.workSequenceAction, steps);
            });
        });

        this.moduleExtension.querySelectorAll('[data-work-sequence-export]').forEach((button) => {
            button.addEventListener('click', async () => {
                const state = this.getWorkSequenceState(steps);
                button.disabled = true;
                try {
                    await this.exportWalkthroughStep(steps, state.stepIndex, button.dataset.workSequenceExport);
                } finally {
                    button.disabled = false;
                }
            });
        });

        this.moduleExtension.querySelectorAll('[data-work-sequence-export-all]').forEach((button) => {
            button.addEventListener('click', async () => {
                button.disabled = true;
                try {
                    await this.exportAllWalkthroughSteps(steps, button.dataset.workSequenceExportAll);
                } finally {
                    button.disabled = false;
                }
            });
        });
    },

    // -------------------------------------------------------------------------
    // Export helpers
    // -------------------------------------------------------------------------

    // Resolves the animation time range for a step, respecting its animationSource setting.
    getStepAnimationTimeRange(steps, stepIndex) {
        const step = steps[stepIndex];
        if (!step) return { startTime: 0, endTime: 0.1 };

        const stepOverlay = this._modeSvgState?.stepOverlays?.[step.id];
        const setting = (stepOverlay && !Array.isArray(stepOverlay)) ? stepOverlay : {};
        const animationSource = setting.animationSource || 'step-segment';

        const model = this.getWalkthroughPreviewModel();
        const breakdownDuration = Math.max(0, model.breakdownDuration || 0);

        if (animationSource === 'full-flight') {
            const flightEnd = breakdownDuration + (model.motionStopTime ?? model.tFlight ?? 0);
            return { startTime: 0, endTime: Math.max(0.1, flightEnd) };
        }
        if (animationSource === 'breakdown') {
            return { startTime: 0, endTime: Math.max(0.1, this.vectorBreakdownDuration ?? 6.2) };
        }
        if (animationSource === 'custom-range') {
            const start = Number.isFinite(setting.customStartTime) ? Math.max(0, setting.customStartTime) : 0;
            const end = Number.isFinite(setting.customEndTime) ? setting.customEndTime : start + 2;
            return { startTime: start, endTime: Math.max(start + 0.1, end) };
        }
        // Default: 'step-segment'
        const { startTime, endTime } = this.getWalkthroughStepExportWindow(steps, stepIndex);
        return { startTime, endTime };
    },

    getWalkthroughStepExportWindow(steps, stepIndex) {
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

    sanitizeExportFilenamePart(value, fallback = 'step') {
        return String(value || fallback)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '') || fallback;
    },

    downloadDataUrl(dataUrl, filename) {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
    },

    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    },

    playWalkthroughStepAnimation(steps, stepIndex) {
        const idx = stepIndex ?? this.getWorkSequenceState(steps).stepIndex;
        const step = steps[idx];
        if (!step) return;
        const { startTime, endTime } = this.getStepAnimationTimeRange(steps, idx);

        const stepSetting = this._modeSvgState?.stepOverlays?.[step.id];
        const setting = (stepSetting && !Array.isArray(stepSetting)) ? stepSetting : {};
        const displayOverrides = { ...(setting.displayOverrides || {}) };
        if (displayOverrides.listDisplay === undefined && setting.listDisplay !== undefined) {
            displayOverrides.listDisplay = setting.listDisplay;
        }

        const savedInputs = {};
        Object.entries(displayOverrides).forEach(([k, v]) => {
            if (v !== null && v !== undefined && k in this.inputs) {
                savedInputs[k] = this.inputs[k];
                this.setInputValue(k, v, { redraw: false });
            }
        });

        const canvasStep = this.getWalkthroughCanvasStep(step);
        this.activeWalkthroughStep = canvasStep;

        const savedHoverKey = this.hoveredValueKey;
        if (setting.hoverKey) {
            this.hoveredValueKey = setting.hoverKey;
            this._hoverAnimStartMs = performance.now();
        }

        this.playSegment(startTime, endTime, {
            onFrame: (t) => {
                this.ctx.fillStyle = this.config.backgroundColor;
                this.ctx.fillRect(0, 0, this.width, this.height);
                this.drawFrame(this.ctx, t);
                if (setting.showExplanation === true && typeof this.drawStepPanel === 'function') {
                    this.drawStepPanel(this.ctx, step);
                }
                this.syncExternalPanels({ force: true });
            },
            onEnd: () => {
                this.activeWalkthroughStep = null;
                this.hoveredValueKey = savedHoverKey;
                Object.entries(savedInputs).forEach(([k, v]) => this.setInputValue(k, v, { redraw: false }));
            }
        });
    },

    async exportWalkthroughStep(steps, stepIndex, format = 'gif', options = {}) {
        const step = steps[stepIndex];
        if (!step) return;

        const { startTime, endTime } = this.getStepAnimationTimeRange(steps, stepIndex);
        const statusEl = document.getElementById('status');
        const stepNumber = stepIndex + 1;
        const filenameBase = `work-step-${String(stepNumber).padStart(2, '0')}-${this.sanitizeExportFilenamePart(step.title, 'walkthrough')}`;

        // Apply per-step display overrides for the duration of the export
        const stepOverlay = this._modeSvgState?.stepOverlays?.[step.id];
        const setting = (stepOverlay && !Array.isArray(stepOverlay)) ? stepOverlay : {};
        const displayOverrides = { ...(setting.displayOverrides || {}) };
        if (displayOverrides.listDisplay === undefined && setting.listDisplay !== undefined) {
            displayOverrides.listDisplay = setting.listDisplay;
        }
        const savedInputs = {};
        Object.entries(displayOverrides).forEach(([k, v]) => {
            if (v !== null && v !== undefined && k in this.inputs) {
                savedInputs[k] = this.inputs[k];
                this.setInputValue(k, v, { redraw: false });
            }
        });
        this.activeWalkthroughStep = this.getWalkthroughCanvasStep(step);

        // If a hover animation is configured, temporarily patch drawFrame so that
        // each exported frame gets the correct hover-animation elapsed time
        // (GIF renders frames back-to-back, so performance.now() barely advances).
        const savedHoverKey = this.hoveredValueKey;
        const hasHoverAnim = Boolean(setting.hoverKey);
        if (hasHoverAnim) {
            this.hoveredValueKey = setting.hoverKey;
            const _origDrawFrame = this.drawFrame;
            const _segStart = startTime;
            this.drawFrame = (ctx, t) => {
                this._hoverAnimStartMs = performance.now() - Math.max(0, t - _segStart) * 1000;
                return _origDrawFrame.call(this, ctx, t);
            };
        }

        try {
            if (format === 'webm') {
                statusEl.innerText = `Recording WebM for step ${stepNumber}...`;
                const blob = await this.exportWebm((progress) => {
                    statusEl.innerText = `Recording WebM for step ${stepNumber}: ${Math.round(progress * 100)}%`;
                }, { startTime, endTime });
                this.downloadBlob(blob, `${filenameBase}.webm`);
                statusEl.innerText = `Step ${stepNumber} WebM downloaded.`;
            } else {
                statusEl.innerText = `Rendering GIF for step ${stepNumber}...`;
                const gifBase64 = await this.exportGif((progress) => {
                    statusEl.innerText = `Rendering GIF for step ${stepNumber}: ${Math.round(progress * 100)}%`;
                }, { startTime, endTime });
                this.downloadDataUrl(gifBase64, `${filenameBase}.gif`);
                statusEl.innerText = `Step ${stepNumber} GIF downloaded.`;
            }
        } finally {
            this.activeWalkthroughStep = null;
            this.hoveredValueKey = savedHoverKey;
            if (hasHoverAnim) { delete this.drawFrame; }
            Object.entries(savedInputs).forEach(([k, v]) => this.setInputValue(k, v, { redraw: false }));
        }

        if (!options.suppressStatusReset) {
            setTimeout(() => {
                if (statusEl.innerText.includes(`Step ${stepNumber}`)) statusEl.innerText = 'System Ready';
            }, 2000);
        }
    },

    async exportAllWalkthroughSteps(steps, format = 'gif') {
        if (!Array.isArray(steps) || !steps.length) return;

        const statusEl = document.getElementById('status');
        for (let stepIndex = 0; stepIndex < steps.length; stepIndex += 1) {
            statusEl.innerText = `Preparing ${format.toUpperCase()} for step ${stepIndex + 1} of ${steps.length}...`;
            await this.exportWalkthroughStep(steps, stepIndex, format, { suppressStatusReset: true });
        }

        statusEl.innerText = `All ${steps.length} ${format.toUpperCase()} step exports downloaded.`;
        setTimeout(() => {
            if (statusEl.innerText.includes(`All ${steps.length}`)) statusEl.innerText = 'System Ready';
        }, 2500);
    }

};

export default walkthroughInteractionMethods;
