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

        this.stopPreview();
        this.ctx.fillStyle = this.config.backgroundColor;
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.activeWalkthroughStep = canvasStep;
        try {
            this.drawFrame(this.ctx, time);
        } finally {
            this.activeWalkthroughStep = null;
        }
        this.syncExternalPanels({ force: true });
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

    async exportWalkthroughStep(steps, stepIndex, format = 'gif', options = {}) {
        const { step, startTime, endTime } = this.getWalkthroughStepExportWindow(steps, stepIndex);
        if (!step) return;

        const statusEl = document.getElementById('status');
        const stepNumber = stepIndex + 1;
        const filenameBase = `work-step-${String(stepNumber).padStart(2, '0')}-${this.sanitizeExportFilenamePart(step.title, 'walkthrough')}`;

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
