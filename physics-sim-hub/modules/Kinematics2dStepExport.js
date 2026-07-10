import { patchC2SContext } from '../core/canvasSvgUtils.js';
import { getStepExportOverrides } from './Kinematics2dStepSettings.js';

const stepExportMethods = {
    getSvgExportTime() {
        if (
            this.inputs?.captureVectorBreakdownInSvg &&
            (this.inputs?.showVectorBreakdown || this.inputs?.showFinalVectorAdditionZoom)
        ) {
            const model = this.computeProjectileModel(0);
            if (model.finalVectorDuration > 0) {
                return model.finalVectorStartTime + (model.finalVectorDuration * 0.9);
            }
            if (model.breakdownDuration > 0) return model.breakdownDuration * 0.9;
        }
        if (Number.isFinite(this.inputs?.svgExportTime)) return this.inputs.svgExportTime;
        return this.config.duration;
    },

    async exportSvg() {
        if (typeof C2S === 'undefined') {
            document.getElementById('status').innerText = 'SVG Library Error!';
            return;
        }

        const baseModel = this.computeProjectileModel(0);
        const problemType = this.getSelectedWorkAnalysisProblemType(baseModel);
        const steps = this.getConfiguredWorkAnalysisSteps(baseModel, problemType);

        if (!steps || !steps.length) {
            const baseExportSvg = Object.getPrototypeOf(Object.getPrototypeOf(this))?.exportSvg;
            return typeof baseExportSvg === 'function' ? baseExportSvg.call(this) : null;
        }

        const statusEl = document.getElementById('status');
        for (let i = 0; i < steps.length; i++) {
            statusEl.innerText = `Exporting step ${i + 1} of ${steps.length}...`;
            try {
                const slug = this.sanitizeExportFilenamePart(steps[i].title, 'step');
                const filename = `step-${String(i + 1).padStart(2, '0')}-${slug}.svg`;
                this.downloadBlob(new Blob([this.renderStepSvg(steps[i])], { type: 'image/svg+xml;charset=utf-8' }), filename);
            } catch (error) {
                console.error(`Step ${i + 1} SVG failed:`, error);
            }
        }

        statusEl.innerText = `Downloaded ${steps.length} step SVGs!`;
        setTimeout(() => { statusEl.innerText = 'System Ready'; }, 2500);
    },

    renderStepSvg(step) {
        const restoreInputs = this.applyTemporaryInputOverrides(this.getStepDisplayOverrides(step));
        const canvasStep = this.getWalkthroughCanvasStep(step);
        const time = this.getWalkthroughCanvasTime(step);
        const svgCtx = new C2S(this.width, this.height);
        patchC2SContext(svgCtx);
        svgCtx.fillStyle = this.config.backgroundColor;
        svgCtx.fillRect(0, 0, this.width, this.height);
        this.isSvgExporting = true;
        this.activeWalkthroughStep = canvasStep;
        try {
            this.drawFrame(svgCtx, time);
            this.drawStepPanel(svgCtx, step);
        } finally {
            this.activeWalkthroughStep = null;
            this.isSvgExporting = false;
            restoreInputs();
        }
        return svgCtx.getSerializedSvg(true);
    },

    createSvgFrame(time, { walkthroughStep = null, drawStepPanel = null } = {}) {
        if (typeof C2S === 'undefined') return null;
        const ctx = new C2S(this.width, this.height);
        patchC2SContext(ctx);
        ctx.fillStyle = this.config.backgroundColor;
        ctx.fillRect(0, 0, this.width, this.height);
        this.isSvgExporting = true;
        const prevStep = this.activeWalkthroughStep;
        if (walkthroughStep) this.activeWalkthroughStep = walkthroughStep;
        try {
            this.drawFrame(ctx, time);
            if (drawStepPanel) this.drawStepPanel(ctx, drawStepPanel);
        } finally {
            this.activeWalkthroughStep = prevStep;
            this.isSvgExporting = false;
        }
        return ctx.getSerializedSvg(true);
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
        const step = steps[stepIndex];
        if (!step) return;

        // Stop any in-progress play animation so its onEnd cleanup runs before we
        // snapshot the current input state. Without this, the play's cleanup callback
        // can fire mid-export and corrupt the saved inputs that our finally block
        // will later restore, causing subsequent exports to silently fail.
        this.stopPreview();

        const statusEl = document.getElementById('status');
        const stepNumber = stepIndex + 1;
        const filenameBase = `work-step-${String(stepNumber).padStart(2, '0')}-${this.sanitizeExportFilenamePart(step.title, 'walkthrough')}`;

        const setting = this.getStepSetting(step);
        const exportFlightSources = ['full-flight', 'step-window', 'custom-range', 'hover-animation'];
        const freezeMotion = setting.showLaunch === false && exportFlightSources.includes(setting.animationSource);
        const restoreInputs = this.applyTemporaryInputOverrides({
            ...this.getStepDisplayOverrides(step),
            // Match Play Step: freeze the projectile at launch while time-driven
            // overlays (given-value fly-ins, hover animations) keep advancing.
            ...(freezeMotion ? { stopAnimation: 'Custom Time', customStopTime: 0 } : {})
        });
        const restoreExportSettings = this.applyTemporaryExportOverrides(getStepExportOverrides(this.getStepSettingsStore(), step));
        const { startTime, endTime } = this.getStepAnimationTimeRange(steps, stepIndex);
        this.prepareStepAnimationContext(step);

        const savedHoverKey = this.hoveredValueKey;
        const hasHoverAnim = Boolean(setting.hoverKey);
        const isHoverAnimation = setting.animationSource === 'hover-animation';
        if (hasHoverAnim) {
            this.hoveredValueKey = setting.hoverKey;
            const originalDrawFrame = this.drawFrame;
            const segmentStart = startTime;
            this.drawFrame = (ctx, t) => {
                this._hoverAnimStartMs = performance.now() - Math.max(0, t - segmentStart) * 1000;
                // For hover-animation steps, freeze the physics scene at t=0 while
                // the hover overlay advances with each frame via _hoverAnimStartMs.
                return originalDrawFrame.call(this, ctx, isHoverAnimation ? 0 : t);
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
            if (hasHoverAnim) delete this.drawFrame;
            restoreInputs();
            restoreExportSettings();
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

export default stepExportMethods;
