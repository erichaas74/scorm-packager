const stepRendererMethods = {
    drawWorkAnalysisSequence(ctx, model) {
        const state = this.getWorkAnalysisSequenceState(model);
        if (!state) return;
        const uiScale = this.getCanvasTextScale();

        if (this.shouldHighlightWorkAnalysisDiagram() && !state.step.liveEquation) {
            this.drawWorkAnalysisHighlights(ctx, model, state.step);
        }

        if (state.step.liveEquation) {
            this.drawLiveEquationAnimation(ctx, model, state);
        }

        const visibleLines = state.step.lines.slice(0, state.lineCount);
        const panelWidth = 326 * uiScale;
        const maxTextWidth = panelWidth - (42 * uiScale);

        ctx.save();
        ctx.font = this.scaleFontString("15px 'Cambria Math', 'STIX Two Math', 'Times New Roman', serif");
        const wrappedLines = visibleLines.flatMap(line => this.wrapTextToWidth(ctx, line, maxTextWidth));
        ctx.restore();

        const panelHeight = (82 + (wrappedLines.length * 20.5)) * uiScale;
        const x = this.width - panelWidth - 20;
        const y = this.height - panelHeight - 20;

        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.strokeStyle = 'rgba(15,23,42,0.18)';
        ctx.lineWidth = 1.4 * uiScale;
        this.roundRectPath(ctx, x, y, panelWidth, panelHeight, 14 * uiScale);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = state.step.accent;
        this.roundRectPath(ctx, x, y, 9 * uiScale, panelHeight, 14 * uiScale);
        ctx.fill();

        ctx.fillStyle = '#0f172a';
        ctx.font = this.scaleFontString('700 15px Inter, sans-serif');
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(state.step.title, x + (21 * uiScale), y + (21 * uiScale));

        ctx.fillStyle = '#64748b';
        ctx.font = this.scaleFontString('600 12px Inter, sans-serif');
        ctx.fillText(state.step.focusLabel, x + (21 * uiScale), y + (43 * uiScale));

        ctx.fillStyle = '#1e293b';
        ctx.font = this.scaleFontString("15px 'Cambria Math', 'STIX Two Math', 'Times New Roman', serif");
        wrappedLines.forEach((line, index) => {
            ctx.fillText(line, x + (21 * uiScale), y + (68 * uiScale) + (index * 20.5 * uiScale));
        });
        ctx.restore();
    },

    drawStepPanel(ctx, step) {
        if (!step) return;
        const hasLines = Array.isArray(step.lines) && step.lines.length > 0;
        const uiScale = this.getCanvasTextScale();
        const panelWidth = 342 * uiScale;
        const maxTextWidth = panelWidth - (36 * uiScale);

        ctx.save();
        let wrappedLines = [];
        if (hasLines) {
            ctx.font = this.scaleFontString("15px 'Cambria Math', 'STIX Two Math', 'Times New Roman', serif");
            wrappedLines = step.lines.flatMap(line => this.wrapTextToWidth(ctx, line, maxTextWidth));
        }
        ctx.restore();

        const panelHeight = hasLines
            ? (64 + (wrappedLines.length * 23)) * uiScale
            : 52 * uiScale;

        const posSetting = this.getStepSetting?.(step) || {};
        const position = posSetting.panelPosition || 'top-right';
        const nudgeX = Number(posSetting.panelNudgeX) || 0;
        const nudgeY = Number(posSetting.panelNudgeY) || 0;
        const margin = 20 * uiScale;

        let baseX, baseY;
        if (position.includes('left')) baseX = margin;
        else if (position.includes('center')) baseX = (this.width - panelWidth) / 2;
        else baseX = this.width - panelWidth - margin;

        if (position.startsWith('top')) baseY = margin;
        else if (position.startsWith('middle')) baseY = (this.height - panelHeight) / 2;
        else baseY = this.height - panelHeight - margin;

        const x = Math.max(0, Math.min(this.width - panelWidth, baseX + nudgeX));
        const y = Math.max(0, Math.min(this.height - panelHeight, baseY + nudgeY));

        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.97)';
        ctx.strokeStyle = 'rgba(15,23,42,0.15)';
        ctx.lineWidth = 1.1 * uiScale;
        this.roundRectPath(ctx, x, y, panelWidth, panelHeight, 11 * uiScale);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = step.accent || '#4f46e5';
        this.roundRectPath(ctx, x, y, 7 * uiScale, panelHeight, 11 * uiScale);
        ctx.fill();

        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        ctx.fillStyle = '#0f172a';
        ctx.font = this.scaleFontString('700 14px Inter, sans-serif');
        ctx.fillText(step.title || '', x + (18 * uiScale), y + (18 * uiScale));

        if (step.focusLabel) {
            ctx.fillStyle = '#64748b';
            ctx.font = this.scaleFontString('500 11.5px Inter, sans-serif');
            ctx.fillText(step.focusLabel, x + (18 * uiScale), y + (39 * uiScale));
        }

        if (hasLines) {
            ctx.fillStyle = '#1e293b';
            ctx.font = this.scaleFontString("15px 'Cambria Math', 'STIX Two Math', 'Times New Roman', serif");
            wrappedLines.forEach((line, i) => {
                ctx.fillText(line, x + (18 * uiScale), y + (59 * uiScale) + (i * 23 * uiScale));
            });
        }
        ctx.restore();
    },

    drawWorkAnalysisHighlights(ctx, model, step) {
        if (!step) return;
        const vectorScale = this.getVectorDrawingScale();

        if (step.id === 'components' || step.id === 'reconstruct') {
            this.drawInitialVelocityVector(ctx, model);
            const componentScale = 3 * vectorScale;
            const xEnd = model.startX + (model.vix * componentScale);
            const yEnd = model.startY - (model.viy * componentScale);
            const vxFocusStyle = this.getWorkAnalysisValueFocusStyle(model, 'v0x');
            const vyFocusStyle = this.getWorkAnalysisValueFocusStyle(model, 'v0y');
            this.drawArrow(ctx, model.startX, model.startY, xEnd, model.startY, vxFocusStyle.lineColor || '#b91c1c', vxFocusStyle.lineWidth || 3);
            this.drawArrow(ctx, xEnd, model.startY, xEnd, yEnd, vyFocusStyle.lineColor || '#047857', vyFocusStyle.lineWidth || 3);
            this.drawTextLabel(ctx, xEnd + 18, model.startY - 6, 'v₀x', {
                font: 'bold 11px serif',
                fill: vxFocusStyle.fill || '#b91c1c',
                background: vxFocusStyle.background || 'rgba(255,255,255,0.88)',
                borderColor: vxFocusStyle.borderColor,
                borderWidth: vxFocusStyle.borderWidth ?? 1,
                shadowColor: vxFocusStyle.shadowColor || 'rgba(15, 23, 42, 0.10)',
                shadowBlur: vxFocusStyle.shadowBlur ?? (this.isSvgExporting ? 0 : 6),
                scale: vxFocusStyle.scale || 1
            });
            this.drawTextLabel(ctx, xEnd + 22, yEnd - 10, 'v₀ᵧ', {
                font: 'bold 11px serif',
                fill: vyFocusStyle.fill || '#047857',
                background: vyFocusStyle.background || 'rgba(255,255,255,0.88)',
                borderColor: vyFocusStyle.borderColor,
                borderWidth: vyFocusStyle.borderWidth ?? 1,
                shadowColor: vyFocusStyle.shadowColor || 'rgba(15, 23, 42, 0.10)',
                shadowBlur: vyFocusStyle.shadowBlur ?? (this.isSvgExporting ? 0 : 6),
                scale: vyFocusStyle.scale || 1
            });
            return;
        }

        if (step.id === 'horizontal' || step.id === 'range') {
            this.drawDistanceTools(ctx, model);
            return;
        }

        if (step.id === 'vertical') {
            this.drawMaxHeightMarker(ctx, model);
            const accX = Math.min(this.width - 110, model.peakCanvasX + 60);
            const accY = Math.max(60, model.peakCanvasY - 80);
            this.drawAccelerationArrow(ctx, accX, accY, 62 * vectorScale, `a = ${model.g.toFixed(1)} m/s²`);
            return;
        }

        if (step.id === 'time') {
            this.drawMaxHeightMarker(ctx, model);
            this.drawStopwatch(
                ctx,
                Math.min(this.width - 80, model.peakCanvasX + 70),
                Math.max(56, model.peakCanvasY - 36),
                `t = ${model.tFlight.toFixed(2)} s`,
                this.getWorkAnalysisValueFocusStyle(model, 'time')
            );
            return;
        }

        if (step.id === 'shortcut') {
            this.drawDistanceTools(ctx, model);
            this.drawMaxHeightMarker(ctx, model);
            return;
        }

        if (step.id === 'vertical-result') {
            if (Math.abs(model.yf - model.yi) < 0.01) {
                this.drawMaxHeightMarker(ctx, model);
            } else {
                const vyScale = 2.8 * vectorScale;
                this.drawArrow(ctx, model.endX, model.endY, model.endX, model.endY - (model.finalVy * vyScale), '#047857', 3);
                this.drawTextLabel(ctx, model.endX + 18, model.endY - (model.finalVy * vyScale), 'vᵧ(final)', {
                    font: 'bold 11px serif',
                    fill: '#047857',
                    background: 'rgba(255,255,255,0.88)'
                });
            }
            return;
        }

        if (step.id === 'summary') {
            this.drawDistanceTools(ctx, model);
            if (Math.abs(model.yf - model.yi) < 0.01) {
                this.drawMaxHeightMarker(ctx, model);
            }
        }
    }
};

export default stepRendererMethods;
