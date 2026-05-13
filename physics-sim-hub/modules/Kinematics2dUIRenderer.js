// =============================================================================
// Kinematics2dUIRenderer.js
// =============================================================================
// Prototype mixin for Module2DKinematics.  Owns all canvas drawing for the
// interactive UI panels overlaid on the walkthrough canvas:
//
//   • Prompt banner (drawWalkthroughCanvasPrompt)
//   • Drag token ghost (drawGivensDragToken)
//   • Component trig value box (drawComponentTrigValueBox)
//   • Formula picker overlay (drawWalkthroughFormulaPicker)
//   • Numeric input overlay (drawWalkthroughNumericInput)
//   • Axis value panels (drawAxisValuePanel)
//   • Equation panel (drawEquationPanel)
//   • Live equation animation (drawLiveEquationAnimation)
//   • Vector breakdown UI: drawVectorBreakdownSolveCard, drawFinalVelocityCanvasSteps,
//     drawFinalVelocityPlainLabel, drawFinalVelocityBreakdown
//
// Consumed by Kinematics2d.js via:
//   Object.assign(Module2DKinematics.prototype, uiRendererMethods);
// =============================================================================

const uiRendererMethods = {

drawWalkthroughCanvasPrompt(ctx, { title, message, accent = '#2563eb' }) {
    const uiScale = this.getCanvasTextScale();
    const width = 330 * uiScale;
    const height = 68 * uiScale;
    const x = 22 * uiScale;
    const y = 18 * uiScale;

    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.strokeStyle = `${accent}55`;
    ctx.lineWidth = 1.2 * uiScale;
    this.roundRectPath(ctx, x, y, width, height, 10 * uiScale);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = accent;
    this.roundRectPath(ctx, x, y, 7 * uiScale, height, 10 * uiScale);
    ctx.fill();

    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = accent;
    ctx.font = this.scaleFontString('700 12px Inter, sans-serif', uiScale);
    ctx.fillText(title, x + (18 * uiScale), y + (20 * uiScale));
    ctx.fillStyle = '#334155';
    ctx.font = this.scaleFontString('600 10px Inter, sans-serif', uiScale);
    ctx.fillText(message, x + (18 * uiScale), y + (44 * uiScale));
    ctx.restore();
},

drawGivensDragToken(ctx, state = {}) {
    const drag = state.givenDrag;
    if (!drag) return;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 0.92;
    this.drawTextLabel(ctx, drag.x + 12, drag.y - 12, drag.text || getTargetLabel(drag.key), {
        font: 'bold 12px Inter, sans-serif',
        fill: '#0f172a',
        background: 'rgba(255,255,255,0.97)',
        borderColor: '#2563eb',
        borderWidth: 1.4,
        shadowColor: 'rgba(37,99,235,0.24)',
        shadowBlur: this.isSvgExporting ? 0 : 10
    });
    ctx.restore();
},

drawComponentTrigValueBox(ctx, model, task, state = {}) {
    if (!task || !['v0x', 'v0y'].includes(task.target)) return;
    if (this.activeWalkthroughStep?.id !== 'components') return;

    const uiScale = this.getCanvasTextScale();
    const target = task.target;
    const isX = target === 'v0x';
    const accent = isX ? '#b91c1c' : '#047857';
    const symbol = isX ? 'v0x' : 'v0y';
    const expectedEquation = isX ? 'v0x = v0 cos(theta)' : 'v0y = v0 sin(theta)';
    const substitution = isX
        ? `v0x = ${model.vi.toFixed(1)} cos(${model.angleDeg.toFixed(0)} deg)`
        : `v0y = ${model.vi.toFixed(1)} sin(${model.angleDeg.toFixed(0)} deg)`;
    const answer = isX ? model.vix : model.viy;
    const typedValue = String(state.answer || '').trim();
    const showAnswer = task.kind === 'numeric' && state.feedback?.ok;
    const slotText = showAnswer ? `${answer.toFixed(2)} m/s` : (typedValue || '?');
    const picked = state.lastFormulaPick || null;

    const width = 318 * uiScale;
    const height = 132 * uiScale;
    const x = 24 * uiScale;
    const y = this.height - height - (22 * uiScale);
    const rowH = 21 * uiScale;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = 'rgba(255,255,255,0.96)';
    ctx.strokeStyle = `${accent}55`;
    ctx.lineWidth = 1.2 * uiScale;
    this.roundRectPath(ctx, x, y, width, height, 10 * uiScale);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = accent;
    this.roundRectPath(ctx, x, y, 7 * uiScale, height, 10 * uiScale);
    ctx.fill();

    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = accent;
    ctx.font = this.scaleFontString('800 12px Inter, sans-serif', uiScale);
    ctx.fillText(`Resolve ${symbol}`, x + (18 * uiScale), y + (18 * uiScale));

    const rows = [
        { label: 'Have', text: `v0 = ${model.vi.toFixed(1)} m/s, theta = ${model.angleDeg.toFixed(0)} deg` },
        { label: 'Choose', text: picked ? this.getTrigEquationLabel(picked) : 'sin, cos, or tan?' },
        { label: 'Use', text: picked ? expectedEquation : `${symbol} = ?` },
        { label: 'Sub', text: picked ? substitution : `${symbol} = v0 * ?(theta)` },
        { label: 'Answer', text: `${symbol} = ${slotText}`, result: true }
    ];

    rows.forEach((row, index) => {
        const rowY = y + (42 * uiScale) + (index * rowH);
        ctx.fillStyle = row.result ? accent : '#64748b';
        ctx.font = this.scaleFontString('800 9px Inter, sans-serif', uiScale);
        ctx.fillText(row.label, x + (18 * uiScale), rowY);
        ctx.fillStyle = row.result ? '#0f172a' : '#334155';
        ctx.font = this.scaleFontString(row.result ? '800 11px JetBrains Mono, monospace' : '700 10px JetBrains Mono, monospace', uiScale);
        ctx.fillText(row.text, x + (72 * uiScale), rowY);
    });

    this.registerCanvasAnchor(ctx, `walkthrough:trig-value:${target}`, {
        x, y, width, height,
        kind: 'walkthrough-trig-value-box',
        key: target,
        text: `${symbol} trig workspace`
    });
    ctx.restore();
},

drawWalkthroughFormulaPicker(ctx, task, state = {}) {
    const uiScale = this.getCanvasTextScale();
    const equationIds = Array.isArray(task.equationIds) ? new Set(task.equationIds) : null;
    const equations = getEquationsForPicker(task.pickerKind || 'kinematic')
        .filter(eq => !equationIds || equationIds.has(eq.id));
    const rows = task.hideNoneOption
        ? equations
        : [...equations, { id: 'none', label: 'None of these', description: '' }];
    const width = 360 * uiScale;
    const rowHeight = 30 * uiScale;
    const height = (48 * uiScale) + (rows.length * rowHeight);
    const x = this.width - width - (22 * uiScale);
    const y = Math.max(16 * uiScale, (this.height - height) / 2);
    const accent = '#7c3aed';

    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.96)';
    ctx.strokeStyle = 'rgba(124,58,237,0.28)';
    ctx.lineWidth = 1.2 * uiScale;
    this.roundRectPath(ctx, x, y, width, height, 10 * uiScale);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = accent;
    ctx.font = this.scaleFontString('700 12px Inter, sans-serif', uiScale);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('Choose from the canvas', x + (16 * uiScale), y + (18 * uiScale));
    ctx.fillStyle = '#64748b';
    ctx.font = this.scaleFontString('600 9.5px Inter, sans-serif', uiScale);
    ctx.fillText('Click the equation that matches this step.', x + (16 * uiScale), y + (36 * uiScale));

    rows.forEach((row, index) => {
        const rowX = x + (12 * uiScale);
        const rowY = y + (48 * uiScale) + (index * rowHeight);
        const rowW = width - (24 * uiScale);
        const rowH = rowHeight - (6 * uiScale);
        const isPicked = state.lastFormulaPick === row.id;
        ctx.fillStyle = isPicked ? 'rgba(124,58,237,0.92)' : 'rgba(248,250,252,0.96)';
        ctx.strokeStyle = isPicked ? 'rgba(124,58,237,0.92)' : 'rgba(203,213,225,0.95)';
        this.roundRectPath(ctx, rowX, rowY, rowW, rowH, 7 * uiScale);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isPicked ? '#ffffff' : '#0f172a';
        ctx.font = this.scaleFontString(row.id === 'none' ? 'italic 11px Inter, sans-serif' : '700 11px Georgia, serif', uiScale);
        ctx.fillText(row.label, rowX + (12 * uiScale), rowY + (rowH / 2));

        this.registerCanvasAnchor(ctx, `walkthrough:formula:${row.id}`, {
            x: rowX, y: rowY, width: rowW, height: rowH,
            kind: 'walkthrough-formula',
            equationId: row.id,
            text: row.label
        });
    });
    ctx.restore();
},

drawWalkthroughNumericInput(ctx, task, state = {}) {
    const uiScale = this.getCanvasTextScale();
    const width = 320 * uiScale;
    const height = 92 * uiScale;
    const x = this.width - width - (22 * uiScale);
    const y = this.height - height - (22 * uiScale);
    const accent = '#0f766e';
    const value = String(state.answer || '');
    const active = Boolean(state.canvasInputActive);

    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.96)';
    ctx.strokeStyle = active ? 'rgba(15,118,110,0.8)' : 'rgba(15,118,110,0.28)';
    ctx.lineWidth = active ? 2 * uiScale : 1.2 * uiScale;
    this.roundRectPath(ctx, x, y, width, height, 10 * uiScale);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = accent;
    ctx.font = this.scaleFontString('700 12px Inter, sans-serif', uiScale);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('Canvas answer input', x + (16 * uiScale), y + (18 * uiScale));
    ctx.fillStyle = '#64748b';
    ctx.font = this.scaleFontString('600 9.5px Inter, sans-serif', uiScale);
    ctx.fillText('Click here, type a number, then press Enter.', x + (16 * uiScale), y + (38 * uiScale));

    const inputX = x + (16 * uiScale);
    const inputY = y + (54 * uiScale);
    const inputW = width - (32 * uiScale);
    const inputH = 26 * uiScale;
    ctx.fillStyle = active ? 'rgba(236,253,245,0.98)' : 'rgba(248,250,252,0.98)';
    ctx.strokeStyle = active ? '#0f766e' : '#cbd5e1';
    this.roundRectPath(ctx, inputX, inputY, inputW, inputH, 7 * uiScale);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = value ? '#0f172a' : '#94a3b8';
    ctx.font = this.scaleFontString('700 12px JetBrains Mono, monospace', uiScale);
    ctx.fillText(value || 'type answer', inputX + (10 * uiScale), inputY + (inputH / 2));

    this.registerCanvasAnchor(ctx, 'walkthrough:numeric-input', {
        x: inputX, y: inputY, width: inputW, height: inputH,
        kind: 'walkthrough-numeric-input',
        target: task.target
    });
    ctx.restore();
},

drawAxisValuePanel(ctx, { title, rows, x, y, width, model = null }) {
    const uiScale = this.getCanvasTextScale();
    const isDense = rows.length > 5;
    const headerY = y + (16 * uiScale);
    const rowStartY = y + ((isDense ? 36 : 40) * uiScale);
    const rowHeight = (isDense ? 17 : 19) * uiScale;
    const height = (isDense ? 138 : 140) * uiScale;

    ctx.save();
    ctx.fillStyle = this.kinematicsTheme.panelFill;
    ctx.strokeStyle = this.kinematicsTheme.panelStroke;
    ctx.lineWidth = 1 * uiScale;
    this.roundRectPath(ctx, x, y, width, height, 6 * uiScale);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#64748b";
    ctx.font = this.scaleFontString("800 10.8px Inter, sans-serif");
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(title, x + (14 * uiScale), headerY);

    ctx.font = this.scaleFontString(this.isSvgExporting
        ? "13px serif"
        : "13.2px 'Cambria Math', 'Times New Roman', Georgia, serif");
    rows.forEach((row, i) => {
        const rowText = typeof row === 'string' ? row : row.text;
        const focusKeys = typeof row === 'string' ? [] : row.focusKeys;
        const focusStyle = focusKeys?.length
            ? this.getWorkAnalysisValueFocusStyle(model, focusKeys)
            : {};
        const hoverStyle = this.getValueRowHoverStyle(row);
        const rowX = x + (14 * uiScale);
        const rowY = rowStartY + i * rowHeight;
        const rowScale = Math.max(focusStyle.scale || 1, hoverStyle.scale || 1);

        ctx.save();
        ctx.translate(rowX, rowY);
        ctx.scale(rowScale, rowScale);
        if (focusStyle.background || hoverStyle.background) {
            const measuredWidth = ctx.measureText(rowText).width + ((hoverStyle.background ? 12 : 8) * uiScale);
            const boxX = (hoverStyle.background ? -6 : -4) * uiScale;
            const boxY = hoverStyle.background ? -(rowHeight / 2) + (1 * uiScale) : -10 * uiScale;
            const boxHeight = hoverStyle.background ? rowHeight - (2 * uiScale) : 16 * uiScale;

            if (hoverStyle.background) {
                ctx.save();
                ctx.shadowColor = hoverStyle.shadowColor;
                ctx.shadowBlur = hoverStyle.shadowBlur;
                ctx.fillStyle = hoverStyle.background;
                this.roundRect(ctx, boxX, boxY, measuredWidth, boxHeight, 5);
                ctx.fill();
                ctx.restore();

                ctx.strokeStyle = hoverStyle.borderColor;
                ctx.lineWidth = 1 * uiScale;
                this.roundRect(ctx, boxX, boxY, measuredWidth, boxHeight, 5 * uiScale);
                ctx.stroke();
            } else {
                ctx.fillStyle = focusStyle.background;
                this.roundRect(ctx, boxX, boxY, measuredWidth, boxHeight, 5 * uiScale);
                ctx.fill();
            }
        }
        ctx.fillStyle = hoverStyle.fill || focusStyle.fill || "#334155";
        ctx.fillText(rowText, 0, 0);

        if (typeof row !== 'string') {
            const textWidth = ctx.measureText(rowText).width;
            const rowAnchor = {
                x: -6 * uiScale,
                y: -(rowHeight / 2),
                width: Math.max(textWidth + (12 * uiScale), width - (20 * uiScale)),
                height: rowHeight,
                text: rowText,
                kind: 'value-row',
                axis: row.axis,
                key: row.key,
                title
            };
            this.registerCanvasAnchor(ctx, row.anchorId, rowAnchor);
            (row.anchorAliases || []).forEach(alias => this.registerCanvasAnchor(ctx, alias, rowAnchor));

            if (row.valueAnchorId) {
                const valueText = row.valueText || this.getValueTextFromRow(rowText);
                const valueIndex = valueText ? rowText.indexOf(valueText) : -1;
                const valueX = valueIndex >= 0 ? ctx.measureText(rowText.slice(0, valueIndex)).width : 0;
                const valueAnchor = {
                    x: valueX,
                    y: -(rowHeight / 2),
                    width: valueText ? ctx.measureText(valueText).width : textWidth,
                    height: rowHeight,
                    text: valueText || rowText,
                    rowText,
                    kind: 'value',
                    axis: row.axis,
                    key: row.key,
                    title
                };
                this.registerCanvasAnchor(ctx, row.valueAnchorId, valueAnchor);
                (row.valueAnchorAliases || []).forEach(alias => this.registerCanvasAnchor(ctx, alias, valueAnchor));
            }
        }
        ctx.restore();
    });
    ctx.restore();
},

drawEquationPanel(ctx, model) {
    if (!this.inputs.showEquations) return;

    const d = 'Δy';
    const eqs = [
        'v = v₀ + at',
        `${d} = v₀t + ½at²`,
        `v² = v₀² + 2a${d}`,
        `${d} = ½(v₀ + v)t`
    ];

    const panel = this.getEquationPanelLayout(model);
    this.drawEquationBox(ctx, {
        equations: this.getEquationLines(model),
        highlightKey: this.inputs.equationHighlight,
        x: panel.x,
        y: panel.y,
        width: panel.width,
        rowHeight: 27,
        topPadding: 8,
        fontSize: 18.9
    });
},

drawLiveEquationAnimation(ctx, model, state) {
    if (state.step.liveEquation?.type !== 'final-vy') return;

    const progress = state.progress;
    const slotsFilled = progress >= 0.52;
    const showResult = progress >= 0.62;
    const viyText = model.viy.toFixed(2);
    const ayText = (-model.g).toFixed(2);
    const tText = model.tFlight.toFixed(2);
    const answerText = `${model.finalVy.toFixed(2)} m/s`;
    const rows = [
        [
            { text: "vᵧf =" },
            { slot: "viy", text: "vᵧi", valueText: slotsFilled ? viyText : null },
            { text: "+" },
            { slot: "ay", text: "aᵧ", valueText: slotsFilled ? ayText : null },
            { text: "·" },
            { slot: "t", text: "t", valueText: slotsFilled ? tText : null }
        ]
    ];

    if (showResult) {
        rows.push([
            { text: "vᵧf =" },
            { slot: "answer", text: answerText, valueText: answerText, fill: "#7c3aed" }
        ]);
    }

    const layout = this.drawEquationTemplate(ctx, {
        id: "live-vyf",
        title: "Live equation animation",
        rows
    }, {
        centerX: this.width / 2,
        centerY: this.height * 0.43,
        width: 440,
        activeSlots: slotsFilled ? ["answer"] : ["viy", "ay", "t"],
        filledSlots: slotsFilled ? ["viy", "ay", "t", ...(showResult ? ["answer"] : [])] : [],
        background: "rgba(255,255,255,0.96)",
        borderColor: "rgba(124, 58, 237, 0.26)",
        titleFill: "#7c3aed"
    });

    const sourceFallbacks = [
        { x: layout.x + 44, y: layout.y + layout.height + 28 },
        { x: layout.x + 174, y: layout.y + layout.height + 28 },
        { x: layout.x + 304, y: layout.y + layout.height + 28 }
    ];
    const movingValues = [
        { from: "value:y:v0", to: "equation:live-vyf:slot:viy", text: viyText, fill: "#047857" },
        { from: "value:y:a", to: "equation:live-vyf:slot:ay", text: ayText, fill: "#ea580c" },
        { from: "value:y:t", to: "equation:live-vyf:slot:t", text: tText, fill: "#7c3aed" }
    ];

    movingValues.forEach((item, index) => {
        const tokenProgress = this.clamp((progress - 0.16 - (index * 0.07)) / 0.28, 0, 1);
        if (tokenProgress <= 0 || tokenProgress >= 1) return;

        const fromPoint = this.getCanvasAnchorPoint(item.from, sourceFallbacks[index]);
        const toPoint = this.getCanvasAnchorPoint(item.to);
        if (!fromPoint || !toPoint) return;

        this.drawMovingValueToken(ctx, {
            text: item.text,
            from: { x: fromPoint.x, y: fromPoint.y },
            to: { x: toPoint.x, y: toPoint.y },
            fill: item.fill,
            borderColor: item.fill,
            background: "rgba(255,255,255,0.96)"
        }, tokenProgress);
    });

    if (showResult) {
        const answerProgress = this.clamp((progress - 0.76) / 0.2, 0, 1);
        if (answerProgress > 0 && answerProgress < 1) {
            const fromPoint = this.getCanvasAnchorPoint("equation:live-vyf:slot:answer");
            const toPoint = this.getCanvasAnchorPoint("value:y:v", {
                x: layout.x + layout.width - 36,
                y: layout.y + layout.height + 34
            });

            if (fromPoint && toPoint) {
                this.drawMovingValueToken(ctx, {
                    text: answerText,
                    from: { x: fromPoint.x, y: fromPoint.y },
                    to: { x: toPoint.x, y: toPoint.y },
                    fill: "#7c3aed",
                    borderColor: "#7c3aed",
                    background: "rgba(250,245,255,0.97)"
                }, answerProgress);
            }
        }
    }
},

drawVectorBreakdownSolveCard(ctx, x, y, width, title, rows, accent = "#4338ca") {
    const rowHeight = 19;
    const height = 44 + (rows.length * rowHeight);

    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.strokeStyle = "rgba(15, 23, 42, 0.14)";
    ctx.lineWidth = 1;
    this.roundRectPath(ctx, x, y, width, height, 9);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = accent;
    this.roundRectPath(ctx, x, y, 7, height, 9);
    ctx.fill();

    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 12px Inter, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(title, x + 18, y + 18);

    ctx.font = "11.2px Georgia, serif";
    rows.forEach((row, index) => {
        ctx.fillStyle = row.color || "#334155";
        ctx.fillText(row.text, x + 18, y + 39 + (index * rowHeight));
    });

    ctx.restore();
    return height;
},

drawFinalVelocityCanvasSteps(ctx, x, y, title, rows, accent = "#4338ca") {
    ctx.save();
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(15, 23, 42, 0.12)";
    ctx.shadowBlur = this.isSvgExporting ? 0 : 8;

    const width = 420;
    const height = 44 + (rows.length * 20);
    ctx.fillStyle = "rgba(255,255,255,0.88)";
    ctx.strokeStyle = "rgba(15, 23, 42, 0.12)";
    ctx.lineWidth = 1;
    this.roundRectPath(ctx, x - 14, y - 21, width, height, 8);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.font = "bold 14px Inter, sans-serif";
    ctx.fillStyle = accent;
    ctx.fillText(title, x, y);

    ctx.font = "bold 12px Georgia, serif";
    rows.forEach((row, index) => {
        const lineY = y + 24 + (index * 20);
        ctx.fillStyle = row.color || "#334155";
        ctx.fillText(row.text, x, lineY);
    });

    ctx.restore();
},

drawFinalVelocityPlainLabel(ctx, x, y, text, color, options = {}) {
    const {
        font = "bold 14px Georgia, serif",
        textAlign = "center",
        textBaseline = "middle"
    } = options;
    const uiScale = this.getCanvasTextScale();

    ctx.save();
    ctx.font = this.scaleFontString(font, uiScale);
    ctx.textAlign = textAlign;
    ctx.textBaseline = textBaseline;
    ctx.lineWidth = 4 * uiScale;
    ctx.strokeStyle = "rgba(255,255,255,0.92)";
    ctx.strokeText(text, x, y);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    ctx.restore();
},

drawFinalVelocityBreakdown(ctx, model, stage) {
    const vectorScale = this.getVectorDrawingScale();
    const vx = model.vix;
    const vy = model.finalVy;
    const isZoom = stage.startsWith('final-zoom-');
    const scale = this.getVelocityBreakdownScale(vx, vy, { zoom: isZoom });
    const vxLen = vx * scale;
    const vyLen = -vy * scale;
    const minScreenY = Math.min(0, vyLen);
    const maxScreenY = Math.max(0, vyLen);
    const workspace = isZoom
        ? this.getFinalVelocityWorkspace(model, vxLen, vyLen, model.vectorBreakdownCamera)
        : null;
    const originX = isZoom
        ? workspace.originX
        : this.clamp(model.endX - (vxLen * 0.58), 68, this.width - Math.abs(vxLen) - 78);
    const originY = isZoom
        ? workspace.originY
        : this.clamp(model.endY - (maxScreenY * 0.45), 86 - minScreenY, this.height - maxScreenY - 64);
    const xEnd = originX + vxLen;
    const tipX = xEnd;
    const tipY = originY + vyLen;
    const verticalAtX = (stage === 'final-zoom-vy') ? originX : xEnd;
    const resultantLength = Math.max(1, Math.hypot(vxLen, vyLen));
    const resultantLabelX = ((originX + tipX) / 2) - ((vyLen / resultantLength) * 42);
    const resultantLabelY = ((originY + tipY) / 2) + ((vxLen / resultantLength) * 42);
    const showHorizontal = stage !== 'final-zoom-camera';
    const showVertical = stage !== 'final-zoom-vx';
    const showTailHead = !isZoom || ['final-zoom-tail-head', 'final-zoom-resultant', 'final-zoom-speed', 'final-zoom-angle'].includes(stage);
    const showResultant = stage === 'final-result' || ['final-zoom-resultant', 'final-zoom-speed', 'final-zoom-angle'].includes(stage);
    const showSpeedSolve = stage === 'final-result' || stage === 'final-zoom-speed' || stage === 'final-zoom-angle';
    const showAngleSolve = stage === 'final-zoom-angle';
    const angleDeg = Math.atan2(Math.abs(vy), Math.abs(vx)) * 180 / Math.PI;
    const directionLabel = vy < 0 ? `${angleDeg.toFixed(1)} deg below +x` : `${angleDeg.toFixed(1)} deg above +x`;
    const pulse = this.isSvgExporting ? 0 : (0.5 + 0.5 * Math.sin((model.visualTime || 0) * Math.PI * 2.2));

    ctx.save();

    if (isZoom) {
        ctx.fillStyle = "rgba(67, 56, 202, 0.14)";
        ctx.strokeStyle = "rgba(67, 56, 202, 0.34)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(model.endX, model.endY, 12 + (pulse * 4), 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        this.drawFinalVelocityPlainLabel(ctx, model.endX - 18, model.endY - 31, "impact", "#4338ca", {
            font: "bold 11px Inter, sans-serif",
            textAlign: "right"
        });
    }

    if (!isZoom) {
        this.drawTextLabel(ctx, originX, originY - 24, "At landing", {
            font: "bold 11px Inter, sans-serif",
            fill: "#0f172a",
            background: "rgba(255,255,255,0.92)"
        });
    }

    if (showHorizontal) {
        ctx.strokeStyle = "rgba(15, 23, 42, 0.14)";
        ctx.lineWidth = 1.2;
        ctx.setLineDash([6, 5]);
        ctx.beginPath();
        ctx.moveTo(originX, originY);
        ctx.lineTo(xEnd, originY);
        if (showTailHead && showVertical) {
            ctx.lineTo(tipX, tipY);
        } else if (showVertical) {
            ctx.moveTo(originX, originY);
            ctx.lineTo(originX, originY + vyLen);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        this.drawArrow(ctx, originX, originY, xEnd, originY, "#b91c1c", 4, { headSize: 13 * vectorScale });
        if (isZoom) {
            this.drawFinalVelocityPlainLabel(ctx, xEnd + 14, originY - 16, "vₓf", "#b91c1c", {
                textAlign: "left"
            });
        } else {
            this.drawTextLabel(ctx, (originX + xEnd) / 2, originY + (vyLen >= 0 ? -34 : 34), `vx = ${vx.toFixed(2)} m/s`, {
                font: "bold 11px Georgia, serif",
                fill: "#b91c1c",
                background: "rgba(255,255,255,0.92)"
            });
        }
    }

    if (showHorizontal && showVertical) {
        this.drawArrow(ctx, verticalAtX, originY, verticalAtX, originY + vyLen, "#047857", 4, { headSize: 13 * vectorScale });
        if (isZoom) {
            this.drawFinalVelocityPlainLabel(ctx, verticalAtX + 18, tipY - 12, "vᵧf", "#047857", {
                textAlign: "left"
            });
        } else {
            this.drawTextLabel(ctx, verticalAtX + 68, originY + (vyLen / 2), `vᵧf = ${vy.toFixed(2)} m/s`, {
                font: "bold 11px Georgia, serif",
                fill: "#047857",
                background: "rgba(255,255,255,0.92)"
            });
        }
    }

    if (showHorizontal && showResultant) {
        const resultWidth = 4.8 + (pulse * 1.2);
        this.drawArrow(ctx, originX, originY, tipX, tipY, "#4338ca", resultWidth, { headSize: 16 * vectorScale });
        if (isZoom) {
            this.drawFinalVelocityPlainLabel(ctx, resultantLabelX, resultantLabelY, "vf", "#4338ca");
        } else {
            this.drawTextLabel(ctx, resultantLabelX, resultantLabelY, `vf = ${model.finalSpeed.toFixed(2)} m/s`, {
                font: "bold 12px Georgia, serif",
                fill: "#4338ca",
                background: "rgba(238, 242, 255, 0.95)",
                borderColor: "#4338ca",
                borderWidth: 1.6,
                shadowColor: "rgba(67, 56, 202, 0.25)",
                shadowBlur: this.isSvgExporting ? 0 : 12
            });
        }
    }

    if (showHorizontal && showAngleSolve) {
        const arcRadius = 38 * vectorScale;
        const endAngle = vyLen >= 0 ? Math.atan2(vyLen, vxLen) : -Math.atan2(Math.abs(vyLen), vxLen);
        ctx.strokeStyle = "#7c3aed";
        ctx.fillStyle = "#7c3aed";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(originX, originY, arcRadius, 0, endAngle, vyLen < 0);
        ctx.stroke();
        if (isZoom) {
            this.drawFinalVelocityPlainLabel(ctx, originX + arcRadius + 22, originY + (vyLen >= 0 ? 30 : -30), "θ", "#7c3aed", {
                textAlign: "left"
            });
        } else {
            this.drawTextLabel(ctx, originX + arcRadius + 24, originY + (vyLen >= 0 ? 28 : -28), `θ = ${angleDeg.toFixed(1)} deg`, {
                font: "bold 12px Georgia, serif",
                fill: "#7c3aed",
                background: "rgba(245, 243, 255, 0.96)",
                borderColor: "#7c3aed",
                borderWidth: 1.3
            });
        }
    }

    const cardWidth = 266;
    let cardTitle = "Final components";
    let cardAccent = "#0f766e";
    let cardRows = [
        { text: `vₓf stays constant = ${vx.toFixed(2)} m/s`, color: "#b91c1c" },
        { text: `vᵧf = vᵧi - gt = ${vy.toFixed(2)} m/s`, color: "#047857" },
        { text: "Next: add the perpendicular components" },
        { text: "v = sqrt(vₓf^2 + vᵧf^2)" }
    ];

    if (stage === 'final-zoom-camera') {
        cardTitle = "Center impact point";
        cardAccent = "#4338ca";
        cardRows = [
            { text: "The ball has completed its flight.", color: "#4338ca" },
            { text: "Camera centers on the impact point." },
            { text: "Final velocity vectors start at the ball center." }
        ];
    } else if (stage === 'final-zoom-vx') {
        cardTitle = "Step 1: vₓf";
        cardAccent = "#b91c1c";
        cardRows = [
            { text: "Horizontal velocity does not accelerate.", color: "#b91c1c" },
            { text: `vₓf = vₓi = ${vx.toFixed(2)} m/s` },
            { text: "This is one leg of the final velocity triangle." }
        ];
    } else if (stage === 'final-zoom-vy') {
        cardTitle = "Step 2: vᵧf";
        cardAccent = "#047857";
        cardRows = [
            { text: "Gravity changes only the vertical velocity.", color: "#047857" },
            { text: `vᵧf = vᵧi - gt = ${vy.toFixed(2)} m/s` },
            { text: "For now, compare it with the same tail point." }
        ];
    } else if (stage === 'final-zoom-tail-head') {
        cardTitle = "Step 3: Tail to head";
        cardAccent = "#0f766e";
        cardRows = [
            { text: "Slide vy so its tail starts at the head of vx." },
            { text: "The two perpendicular components form a right triangle." },
            { text: "The diagonal will be the final velocity vector." }
        ];
    } else if (stage === 'final-zoom-resultant') {
        cardTitle = "Step 4: Resultant vector";
        cardAccent = "#4338ca";
        cardRows = [
            { text: "Draw from the original tail to the final head.", color: "#4338ca" },
            { text: "That diagonal is the final velocity vector." },
            { text: `vf points ${directionLabel}` }
        ];
    } else if (showAngleSolve) {
        cardTitle = "Step 6: Solve angle";
        cardAccent = "#7c3aed";
        cardRows = [
            { text: "tan(θ) = |vᵧf| / |vₓf|", color: "#7c3aed" },
            { text: `θ = tan^-1(${Math.abs(vy).toFixed(2)} / ${Math.abs(vx).toFixed(2)})` },
            { text: `θ = ${angleDeg.toFixed(1)} deg` },
            { text: `direction = ${directionLabel}` }
        ];
    } else if (showSpeedSolve) {
        cardTitle = isZoom ? "Step 5: Solve speed" : "Solve final velocity";
        cardAccent = "#4338ca";
        cardRows = [
            { text: "v = sqrt(vₓf^2 + vᵧf^2)", color: "#4338ca" },
            { text: `v = sqrt((${vx.toFixed(2)})^2 + (${vy.toFixed(2)})^2)` },
            { text: `vf = ${model.finalSpeed.toFixed(2)} m/s`, color: "#4338ca" },
            { text: `tan(θ) = |vᵧf| / |vₓf|` },
            { text: `direction = ${directionLabel}` }
        ];
    }

    if (isZoom) {
        const textX = model.endX - (this.width / 2) + 28;
        const textY = model.endY - (this.height / 2) + 34;
        this.drawFinalVelocityCanvasSteps(ctx, textX, textY, cardTitle, cardRows, cardAccent);
        ctx.restore();
        return;
    }

    const cardHeight = 44 + (cardRows.length * 19);
    const cardX = isZoom
        ? this.clamp(this.width - cardWidth - 44, 40, this.width - cardWidth - 30)
        : (tipX + cardWidth + 28 < this.width
        ? tipX + 24
        : Math.max(18, originX - cardWidth - 24));
    const cardY = isZoom
        ? this.clamp(86, 74, this.height - cardHeight - 28)
        : this.clamp(Math.min(originY, tipY) - 58, 18, this.height - cardHeight - 18);
    this.drawVectorBreakdownSolveCard(
        ctx,
        cardX,
        cardY,
        cardWidth,
        cardTitle,
        cardRows,
        cardAccent
    );

    ctx.restore();
},

};

export default uiRendererMethods;
