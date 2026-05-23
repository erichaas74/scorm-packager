// =============================================================================
// Kinematics2dProblemRenderer.js
// =============================================================================
// Prototype mixin for Module2DKinematics.  Owns everything related to rendering
// the problem-statement header on the canvas:
//
//   • Reading and wrapping the free-text problem statement
//   • Building per-type value trackers (colored chips in the header)
//   • Laying out tokenised lines (number tokens get highlight chips)
//   • Drawing the header panel and registering canvas anchors per chip
//   • Animating "given value" chips flying from the header to the data cards
//
// No external imports needed — all helpers live on the base class (this.*).
//
// Consumed by Kinematics2d.js via:
//   Object.assign(Module2DKinematics.prototype, problemRendererMethods);
// =============================================================================

const problemRendererMethods = {

    getCanvasProblemStatement() {
        return String(this.inputs.problemStatement || '').trim();
    },

    wrapCanvasText(ctx, text, maxWidth, maxLines = 4) {
        const words = String(text || '').split(/\s+/).filter(Boolean);
        const lines = [];
        let line = '';

        words.forEach((word) => {
            const testLine = line ? `${line} ${word}` : word;
            if (ctx.measureText(testLine).width <= maxWidth || !line) {
                line = testLine;
                return;
            }

            lines.push(line);
            line = word;
        });

        if (line) lines.push(line);

        if (lines.length <= maxLines) return lines;

        const clipped = lines.slice(0, maxLines);
        let lastLine = clipped[maxLines - 1];
        while (lastLine.length > 4 && ctx.measureText(`${lastLine}...`).width > maxWidth) {
            lastLine = lastLine.slice(0, -1).trim();
        }
        clipped[maxLines - 1] = `${lastLine}...`;
        return clipped;
    },

    getProblemTrackerColor(valueKey) {
        const colors = {
            dx: '#ea580c',
            dy: '#047857',
            hmax: '#059669',
            v0: '#2563eb',
            v0x: '#b91c1c',
            v0y: '#047857',
            theta: '#2563eb',
            time: '#7c3aed'
        };
        return colors[valueKey] || '#4f46e5';
    },

    getProblemNumberVariants(value) {
        const n = Number(value);
        if (!Number.isFinite(n)) return [];
        const values = [n, Math.abs(n)];
        const variants = new Set();

        values.forEach((item) => {
            variants.add(String(item));
            variants.add(item.toFixed(0));
            variants.add(item.toFixed(1));
            variants.add(item.toFixed(2));
        });

        return [...variants];
    },

    getProblemValueTrackers() {
        const typeNumber = this.getWorkAnalysisProblemTypeNumber(this.inputs.workAnalysisProblemType);
        const trackers = [];
        const addTracker = (valueKey, inputKey, targetAnchor, axis = null) => {
            const value = this.inputs[inputKey];
            const variants = this.getProblemNumberVariants(value);
            if (!variants.length) return;
            const color = this.getProblemTrackerColor(valueKey);
            trackers.push({
                valueKey,
                inputKey,
                targetAnchor,
                axis,
                variants,
                color,
                background: `${color}18`,
                borderColor: `${color}66`
            });
        };

        if (typeNumber === '1') {
            addTracker('v0', 'initialVelocity', 'problem:value:v0');
            addTracker('theta', 'launchAngle', 'problem:value:theta');
            addTracker('dy', 'givenDy', 'value:y:displacement', 'y');
        } else if (typeNumber === '2') {
            addTracker('v0', 'initialVelocity', 'problem:value:v0');
            addTracker('theta', 'launchAngle', 'problem:value:theta');
            addTracker('dy', 'givenDy', 'value:y:displacement', 'y');
        } else if (typeNumber === '3') {
            addTracker('v0x', 'givenVx', 'value:x:v0', 'x');
            addTracker('v0y', 'givenVy', 'value:y:v0', 'y');
            addTracker('dy', 'givenDy', 'value:y:displacement', 'y');
        } else if (typeNumber === '4') {
            addTracker('dx', 'givenDx', 'value:x:displacement', 'x');
            addTracker('dy', 'givenDy', 'value:y:displacement', 'y');
            addTracker('time', 'givenTime', 'value:y:t', 'y');
        } else if (typeNumber === '5') {
            addTracker('dx', 'givenDx', 'value:x:displacement', 'x');
            addTracker('dy', 'givenDy', 'value:y:displacement', 'y');
            addTracker('theta', 'launchAngle', 'problem:value:theta');
        } else if (typeNumber === '6') {
            addTracker('dx', 'givenDx', 'value:x:displacement', 'x');
            addTracker('theta', 'launchAngle', 'problem:value:theta');
        } else if (typeNumber === '7') {
            addTracker('dx', 'givenDx', 'value:x:displacement', 'x');
            addTracker('hmax', 'givenHmax', 'value:y:hmax', 'y');
        } else if (typeNumber === '8') {
            addTracker('v0x', 'givenVx', 'value:x:v0', 'x');
            addTracker('dy', 'givenHeightDrop', 'value:y:displacement', 'y');
        }

        return trackers;
    },

    getProblemTrackerForWord(word, trackers) {
        const match = String(word).match(/[-+]?\d*\.?\d+/);
        if (!match) return null;

        const value = Number(match[0]);
        if (!Number.isFinite(value)) return null;

        return trackers.find((tracker) => tracker.variants.some((variant) => {
            const variantValue = Number(variant);
            if (!Number.isFinite(variantValue)) return false;
            return Math.abs(Math.abs(value) - Math.abs(variantValue)) < 0.005;
        })) || null;
    },

    layoutProblemStatementTokens(ctx, text, maxWidth, maxLines = 4) {
        const trackers = this.getProblemValueTrackers();
        const words = String(text || '').split(/\s+/).filter(Boolean);
        const lines = [];
        let currentLine = { tokens: [], width: 0 };
        const spaceWidth = ctx.measureText(' ').width;

        words.forEach((word) => {
            const tracker = this.getProblemTrackerForWord(word, trackers);
            const tokenWidth = ctx.measureText(word).width + (tracker ? 10 : 0);
            const nextWidth = currentLine.tokens.length
                ? currentLine.width + spaceWidth + tokenWidth
                : tokenWidth;

            if (currentLine.tokens.length && nextWidth > maxWidth) {
                lines.push(currentLine);
                currentLine = { tokens: [], width: 0 };
            }

            currentLine.tokens.push({ text: word, tracker, width: tokenWidth });
            currentLine.width = currentLine.tokens.length > 1
                ? currentLine.width + spaceWidth + tokenWidth
                : tokenWidth;
        });

        if (currentLine.tokens.length) lines.push(currentLine);

        if (lines.length > maxLines) {
            const clipped = lines.slice(0, maxLines);
            clipped[maxLines - 1].isClipped = true;
            return clipped;
        }

        return lines;
    },

    getCanvasProblemHeaderLayout(ctx) {
        const statement = this.getCanvasProblemStatement();
        if (!statement) return { height: 0, lines: [], statement: '' };

        const uiScale = this.getCanvasTextScale();
        const fontSize = (this.width >= 1000 ? 18 : 15) * uiScale;
        const lineHeight = Math.round(fontSize * 1.35);
        const maxWidth = Math.max(220 * uiScale, this.width - (80 * uiScale));

        ctx.save();
        ctx.font = `700 ${fontSize}px Inter, sans-serif`;
        const lines = this.layoutProblemStatementTokens(ctx, statement, maxWidth, this.width >= 1000 ? 4 : 3);
        ctx.restore();

        const height = Math.min(
            Math.max(62 * uiScale, (28 * uiScale) + (lines.length * lineHeight)),
            Math.max(72 * uiScale, Math.round(this.canvas.height * 0.25))
        );

        return { height, lines, statement, fontSize, lineHeight, maxWidth };
    },

    drawCanvasProblemHeader(ctx, layout) {
        if (!layout?.height) return;

        const uiScale = this.getCanvasTextScale();
        const panelX = 12 * uiScale;
        const panelY = 10 * uiScale;
        const panelWidth = this.width - (24 * uiScale);
        const panelHeight = layout.height - (18 * uiScale);

        ctx.save();
        ctx.fillStyle = "rgba(255,255,255,0.96)";
        ctx.strokeStyle = "rgba(15, 23, 42, 0.14)";
        ctx.lineWidth = 1.2 * uiScale;
        this.roundRectPath(ctx, panelX, panelY, panelWidth, panelHeight, 14 * uiScale);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#111827";
        ctx.font = `700 ${layout.fontSize}px Inter, sans-serif`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        layout.lines.forEach((line, index) => {
            let cursorX = panelX + (20 * uiScale);
            const lineY = panelY + (24 * uiScale) + (index * layout.lineHeight);
            const spaceWidth = ctx.measureText(' ').width;

            line.tokens.forEach((token, tokenIndex) => {
                if (tokenIndex > 0) cursorX += spaceWidth;
                const tracker = token.tracker;
                const textWidth = ctx.measureText(token.text).width;
                const tokenX = cursorX;

                if (tracker) {
                    const chipX = tokenX - 5;
                    const chipY = lineY - (layout.fontSize * 0.72);
                    const chipWidth = textWidth + 10;
                    const chipHeight = layout.fontSize * 1.38;

                    ctx.fillStyle = tracker.background;
                    ctx.strokeStyle = tracker.borderColor;
                    ctx.lineWidth = 1;
                    this.roundRectPath(ctx, chipX, chipY, chipWidth, chipHeight, 6);
                    ctx.fill();
                    ctx.stroke();

                    this.registerCanvasAnchor(ctx, `problem:value:${tracker.valueKey}`, {
                        x: chipX,
                        y: chipY,
                        width: chipWidth,
                        height: chipHeight,
                        text: token.text,
                        color: tracker.color,
                        kind: 'problem-value',
                        key: tracker.valueKey,
                        axis: tracker.axis,
                        targetAnchor: tracker.targetAnchor
                    });
                    this.registerCanvasAnchor(ctx, `problem:input:${tracker.inputKey}`, {
                        x: chipX,
                        y: chipY,
                        width: chipWidth,
                        height: chipHeight,
                        text: token.text,
                        color: tracker.color,
                        kind: 'problem-value',
                        key: tracker.valueKey,
                        axis: tracker.axis,
                        targetAnchor: tracker.targetAnchor
                    });

                    ctx.fillStyle = tracker.color;
                } else {
                    ctx.fillStyle = "#111827";
                }

                ctx.fillText(token.text, tokenX, lineY);
                cursorX += token.width;
            });

            if (line.isClipped) {
                ctx.fillStyle = "#64748b";
                ctx.fillText("...", Math.min(panelX + panelWidth - 44, cursorX + spaceWidth), lineY);
            }
        });
        ctx.restore();
    },

    getProblemValueTransferDuration() {
        if (!this.inputs.animateGivenValues) return 0;
        const transferableCount = this.getProblemValueTrackers()
            .filter(tracker => tracker.targetAnchor && tracker.targetAnchor.startsWith('value:'))
            .length;

        if (!this.getCanvasProblemStatement() || transferableCount === 0) return 0;
        return 0.55 + (transferableCount * 0.62);
    },

    getProblemValueTransferItems() {
        const seenTargets = new Set();

        return this.getProblemValueTrackers()
            .filter(tracker => tracker.targetAnchor && tracker.targetAnchor.startsWith('value:'))
            .map(tracker => {
                const fromAnchor = this.getCanvasAnchor(`problem:value:${tracker.valueKey}`);
                const toAnchor = this.getCanvasAnchor(tracker.targetAnchor)
                    || this.getCanvasAnchor(`${tracker.targetAnchor}:row`);
                if (!fromAnchor || !toAnchor || seenTargets.has(tracker.targetAnchor)) return null;
                seenTargets.add(tracker.targetAnchor);

                return {
                    tracker,
                    fromAnchor,
                    toAnchor,
                    text: fromAnchor.text,
                    fill: fromAnchor.color || tracker.color || '#4f46e5'
                };
            })
            .filter(Boolean);
    },

    drawProblemValueTransferAnimation(ctx, time, yOffset = 0) {
        if (!this.inputs.animateGivenValues) return;
        if (this.isStaticPreviewRendering) return;
        const items = this.getProblemValueTransferItems();
        if (!items.length) return;

        const startTime = 0.25;
        const itemDuration = 0.52;
        const itemGap = 0.62;

        items.forEach((item, index) => {
            const localProgress = this.clamp((time - startTime - (index * itemGap)) / itemDuration, 0, 1);
            if (localProgress <= 0 || localProgress >= 1) return;

            const pulse = Math.sin(localProgress * Math.PI);
            const from = { x: item.fromAnchor.cx, y: item.fromAnchor.cy };
            const to = { x: item.toAnchor.cx, y: item.toAnchor.cy };

            ctx.save();
            ctx.strokeStyle = `${item.fill}55`;
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 6]);
            ctx.beginPath();
            ctx.moveTo(from.x, from.y);
            ctx.quadraticCurveTo(
                (from.x + to.x) / 2,
                Math.min(from.y, to.y) - 32,
                to.x,
                to.y
            );
            ctx.stroke();
            ctx.restore();

            this.drawMovingValueToken(ctx, {
                text: item.text,
                from,
                to,
                fill: item.fill,
                borderColor: item.fill,
                background: "rgba(255,255,255,0.96)",
                shadowColor: `${item.fill}44`,
                scale: 1.02 + (pulse * 0.08)
            }, localProgress);
        });

        // After each chip lands, run the matching hover-style animation on the canvas
        const model = this.latestModel;
        if (!model || typeof this._drawGivenChipHoverAnim !== 'function') return;

        const arrivalHoverDuration = 1.8;
        const fadeOutWindow = 0.35;

        // Temporarily restore scene height so hover animations (getDisplacementGeometry, yToCanvas, etc.)
        // compute correct canvas-relative Y positions. this.height is already back to full canvas height
        // by this point, but hover draws into the scene area offset by yOffset.
        const savedHeight = this.height;
        if (yOffset > 0) this.height = Math.max(200, savedHeight - yOffset);

        items.forEach((item, index) => {
            const arrivalTime = startTime + (index * itemGap) + itemDuration;
            const arrivalElapsed = time - arrivalTime;
            if (arrivalElapsed <= 0 || arrivalElapsed > arrivalHoverDuration) return;

            const fadeIn  = Math.min(1, arrivalElapsed * 10);
            const fadeOut = arrivalElapsed > (arrivalHoverDuration - fadeOutWindow)
                ? 1 - (arrivalElapsed - (arrivalHoverDuration - fadeOutWindow)) / fadeOutWindow
                : 1;

            ctx.save();
            ctx.translate(0, yOffset);
            ctx.globalAlpha = fadeIn * fadeOut;
            this._drawGivenChipHoverAnim(ctx, model, item.tracker, arrivalElapsed);
            ctx.restore();
        });

        this.height = savedHeight;
    }

};

export default problemRendererMethods;
