import SimulationGifMaker from '../core/SimulationGifMaker.js';

export default class KinematicsModuleBase extends SimulationGifMaker {
    constructor(canvasId, config = {}) {
        super(canvasId, config);
        this.canvasAnchors = new Map();
        this.kinematicsTheme = {
            backgroundColor: '#e0f2fe',
            gridColor: 'rgba(56, 189, 248, 0.22)',
            gridSize: 40,
            panelFill: 'rgba(255,255,255,0.9)',
            panelStroke: '#cbd5e1',
            labelFill: '#0f172a',
            labelBackground: 'rgba(255,255,255,0.86)',
            timerFill: 'rgba(15, 23, 42, 0.85)',
            timerText: '#ffffff'
        };
        this.hoveredValueAnchorId = null;
        this.hoveredValueKey = null;
        this.boundHandleCanvasValuePointerMove = (event) => this.handleCanvasValuePointerMove(event);
        this.boundHandleCanvasValuePointerLeave = () => this.handleCanvasValuePointerLeave();
        this.bindCanvasValueHoverEvents();
    }

    clearCanvasAnchors() {
        this.canvasAnchors = new Map();
    }

    transformCanvasPoint(ctx, x, y) {
        if (!ctx || typeof ctx.getTransform !== 'function') return { x, y };
        const matrix = ctx.getTransform();
        return {
            x: (matrix.a * x) + (matrix.c * y) + matrix.e,
            y: (matrix.b * x) + (matrix.d * y) + matrix.f
        };
    }

    registerCanvasAnchor(ctx, id, rect = {}) {
        if (!id) return null;

        const x = this.normalizeNumber(rect.x, 0);
        const y = this.normalizeNumber(rect.y, 0);
        const width = Math.max(0, this.normalizeNumber(rect.width, 0));
        const height = Math.max(0, this.normalizeNumber(rect.height, 0));
        const corners = [
            this.transformCanvasPoint(ctx, x, y),
            this.transformCanvasPoint(ctx, x + width, y),
            this.transformCanvasPoint(ctx, x, y + height),
            this.transformCanvasPoint(ctx, x + width, y + height)
        ];
        const left = Math.min(...corners.map(point => point.x));
        const right = Math.max(...corners.map(point => point.x));
        const top = Math.min(...corners.map(point => point.y));
        const bottom = Math.max(...corners.map(point => point.y));
        const anchor = {
            ...rect,
            id,
            x: left,
            y: top,
            width: right - left,
            height: bottom - top,
            cx: (left + right) / 2,
            cy: (top + bottom) / 2
        };

        this.canvasAnchors.set(id, anchor);
        return anchor;
    }

    getCanvasAnchor(id) {
        return this.canvasAnchors?.get(id) || null;
    }

    bindCanvasValueHoverEvents() {
        if (!this.canvas || this.canvasValueHoverBound) return;
        this.canvasValueHoverTargets = this.getCanvasHoverTargets();
        this.canvasValueHoverTargets.forEach(target => {
            target.addEventListener('pointermove', this.boundHandleCanvasValuePointerMove);
            target.addEventListener('mousemove', this.boundHandleCanvasValuePointerMove);
            target.addEventListener('pointerleave', this.boundHandleCanvasValuePointerLeave);
            target.addEventListener('mouseleave', this.boundHandleCanvasValuePointerLeave);
        });
        document.addEventListener('pointermove', this.boundHandleCanvasValuePointerMove, true);
        document.addEventListener('mousemove', this.boundHandleCanvasValuePointerMove, true);
        window.addEventListener('blur', this.boundHandleCanvasValuePointerLeave);
        this.canvasValueHoverBound = true;
    }

    teardown() {
        if (this.canvas && this.canvasValueHoverBound) {
            (this.canvasValueHoverTargets || this.getCanvasHoverTargets()).forEach(target => {
                target.removeEventListener('pointermove', this.boundHandleCanvasValuePointerMove);
                target.removeEventListener('mousemove', this.boundHandleCanvasValuePointerMove);
                target.removeEventListener('pointerleave', this.boundHandleCanvasValuePointerLeave);
                target.removeEventListener('mouseleave', this.boundHandleCanvasValuePointerLeave);
            });
            document.removeEventListener('pointermove', this.boundHandleCanvasValuePointerMove, true);
            document.removeEventListener('mousemove', this.boundHandleCanvasValuePointerMove, true);
            window.removeEventListener('blur', this.boundHandleCanvasValuePointerLeave);
            this.canvasValueHoverTargets = [];
            this.canvasValueHoverBound = false;
        }
        super.teardown();
    }

    getCanvasHoverTargets() {
        return [this.canvas, this.canvas?.parentElement].filter(Boolean);
    }

    setCanvasHoverCursor(cursor = '') {
        this.getCanvasHoverTargets().forEach(target => {
            target.style.cursor = cursor;
        });
    }

    getCanvasPointerPosition(event) {
        const rect = this.canvas.getBoundingClientRect();
        if (!rect.width || !rect.height) return { x: -Infinity, y: -Infinity };

        // When object-fit: contain is applied the canvas content may be letterboxed
        // or pillarboxed inside its CSS box. Compute the actual rendered content rect.
        const canvasAspect = this.canvas.width / this.canvas.height;
        const cssAspect = rect.width / rect.height;
        let contentLeft = rect.left;
        let contentTop = rect.top;
        let contentW = rect.width;
        let contentH = rect.height;

        if (canvasAspect > cssAspect + 0.001) {
            // Canvas is wider than the CSS box → pillarbox (bars top & bottom)
            contentH = rect.width / canvasAspect;
            contentTop += (rect.height - contentH) / 2;
        } else if (cssAspect > canvasAspect + 0.001) {
            // CSS box is wider than the canvas → letterbox (bars left & right)
            contentW = rect.height * canvasAspect;
            contentLeft += (rect.width - contentW) / 2;
        }

        return {
            x: (event.clientX - contentLeft) * (this.canvas.width / contentW),
            y: (event.clientY - contentTop) * (this.canvas.height / contentH)
        };
    }

    isPointerNearCanvas(event) {
        const rect = this.canvas.getBoundingClientRect();
        if (!rect.width || !rect.height) return false;

        // Use the actual rendered content area (same letterbox logic as getCanvasPointerPosition)
        const canvasAspect = this.canvas.width / this.canvas.height;
        const cssAspect = rect.width / rect.height;
        let contentLeft = rect.left;
        let contentTop = rect.top;
        let contentRight = rect.right;
        let contentBottom = rect.bottom;

        if (canvasAspect > cssAspect + 0.001) {
            const contentH = rect.width / canvasAspect;
            const offsetY = (rect.height - contentH) / 2;
            contentTop += offsetY;
            contentBottom -= offsetY;
        } else if (cssAspect > canvasAspect + 0.001) {
            const contentW = rect.height * canvasAspect;
            const offsetX = (rect.width - contentW) / 2;
            contentLeft += offsetX;
            contentRight -= offsetX;
        }

        const padding = 4;
        return event.clientX >= contentLeft - padding
            && event.clientX <= contentRight + padding
            && event.clientY >= contentTop - padding
            && event.clientY <= contentBottom + padding;
    }

    isPointInsideAnchor(point, anchor, padding = 8) {
        return point.x >= anchor.x - padding
            && point.x <= anchor.x + anchor.width + padding
            && point.y >= anchor.y - padding
            && point.y <= anchor.y + anchor.height + padding;
    }

    getValueAnchorIdentity(anchor) {
        if (!anchor) return null;
        if (anchor.key) return `${anchor.axis || ''}:${anchor.key}`;
        return anchor.id || null;
    }

    findValueAnchorAtPoint(point) {
        const anchors = Array.from(this.canvasAnchors?.values() || []);
        const hits = anchors.filter(anchor => (
            (anchor.kind === 'value' || anchor.kind === 'value-row')
            && this.isPointInsideAnchor(point, anchor)
        ));
        if (!hits.length) return null;
        hits.sort((a, b) => {
            const aPriority = a.kind === 'value' ? 2 : 1;
            const bPriority = b.kind === 'value' ? 2 : 1;
            return bPriority - aPriority;
        });
        return hits[0];
    }

    handleCanvasValuePointerMove(event) {
        if (!this.canvas || this.isSvgExporting) return;
        if (!this.isPointerNearCanvas(event)) {
            if (this.hoveredValueAnchorId || this.hoveredValueKey) this.handleCanvasValuePointerLeave();
            return;
        }
        const anchor = this.findValueAnchorAtPoint(this.getCanvasPointerPosition(event));
        const nextAnchorId = anchor?.id || null;
        const nextValueKey = this.getValueAnchorIdentity(anchor);
        const changed = nextAnchorId !== this.hoveredValueAnchorId
            || nextValueKey !== this.hoveredValueKey;

        this.setCanvasHoverCursor(anchor ? 'pointer' : '');
        if (!changed) return;

        this.hoveredValueAnchorId = nextAnchorId;
        this.hoveredValueKey = nextValueKey;
        if (!this.isPlaying) this.drawPreview();
    }

    handleCanvasValuePointerLeave() {
        if (!this.canvas) return;
        this.setCanvasHoverCursor('');
        if (!this.hoveredValueAnchorId && !this.hoveredValueKey) return;

        this.hoveredValueAnchorId = null;
        this.hoveredValueKey = null;
        if (!this.isPlaying) this.drawPreview();
    }

    isValueRowHovered(row) {
        if (!row || typeof row === 'string') return false;
        const rowKey = row.key ? `${row.axis || ''}:${row.key}` : null;
        return this.hoveredValueKey === rowKey
            || this.hoveredValueAnchorId === row.anchorId
            || this.hoveredValueAnchorId === row.valueAnchorId
            || (row.anchorAliases || []).includes(this.hoveredValueAnchorId)
            || (row.valueAnchorAliases || []).includes(this.hoveredValueAnchorId);
    }

    getValueRowHoverStyle(row) {
        if (!this.isValueRowHovered(row)) return {};
        return {
            scale: 1.18,
            fill: '#1d4ed8',
            background: 'rgba(219, 234, 254, 0.96)',
            borderColor: 'rgba(37, 99, 235, 0.7)',
            shadowColor: 'rgba(37, 99, 235, 0.24)',
            shadowBlur: 12
        };
    }

    getCanvasAnchorPoint(id, fallback = null) {
        const anchor = this.getCanvasAnchor(id);
        if (!anchor) return fallback;
        return { x: anchor.cx, y: anchor.cy, anchor };
    }

    lerp(start, end, t) {
        return start + ((end - start) * t);
    }

    easeInOut(t) {
        const p = this.clamp(t, 0, 1);
        return p * p * (3 - (2 * p));
    }

    getMovingValueTokenPosition(token, progress) {
        const p = this.easeInOut(progress);
        return {
            x: this.lerp(token.from.x, token.to.x, p),
            y: this.lerp(token.from.y, token.to.y, p)
        };
    }

    drawMovingValueToken(ctx, token, progress) {
        if (!token?.from || !token?.to) return null;
        const p = this.clamp(progress, 0, 1);
        const point = this.getMovingValueTokenPosition(token, p);
        const pulse = 1 + (Math.sin(p * Math.PI) * 0.08);

        this.drawTextLabel(ctx, point.x, point.y, token.text, {
            font: token.font || 'bold 12.6px Georgia, serif',
            fill: token.fill || '#1d4ed8',
            background: token.background || 'rgba(255,255,255,0.95)',
            borderColor: token.borderColor || 'rgba(37, 99, 235, 0.35)',
            borderWidth: token.borderWidth ?? 1.2,
            shadowColor: token.shadowColor || 'rgba(37, 99, 235, 0.18)',
            shadowBlur: token.shadowBlur ?? (this.isSvgExporting ? 0 : 10),
            scale: token.scale || pulse
        });

        return point;
    }

    normalizeEquationTemplateRows(template) {
        const rawRows = Array.isArray(template)
            ? template
            : (template?.rows || [template?.tokens || []]);

        return rawRows.map(row => {
            const tokens = Array.isArray(row) ? row : (row.tokens || [row]);
            return tokens.map(token => (typeof token === 'string' ? { text: token } : token));
        });
    }

    getEquationTokenText(token) {
        if (!token) return '';
        if (token.slot) {
            return token.displayText ?? token.valueText ?? token.text ?? token.placeholder ?? '___';
        }
        return token.displayText ?? token.text ?? '';
    }

    getEquationTokenMetrics(ctx, token, options = {}) {
        const isSlot = Boolean(token?.slot);
        const text = this.getEquationTokenText(token);
        const font = token?.font || (isSlot ? options.slotFont : options.font);
        ctx.font = font;

        const textWidth = ctx.measureText(text).width;
        const paddingX = isSlot ? (token.paddingX ?? options.slotPaddingX) : 0;
        const paddingY = isSlot ? (token.paddingY ?? options.slotPaddingY) : 0;

        return {
            text,
            font,
            width: textWidth + (paddingX * 2),
            textWidth,
            paddingX,
            paddingY,
            height: options.rowHeight
        };
    }

    getEquationTemplateLayout(ctx, template, options = {}) {
        const rows = this.normalizeEquationTemplateRows(template);
        const settings = {
            font: options.font || 'bold 21px Georgia, serif',
            slotFont: options.slotFont || 'bold 21px Georgia, serif',
            rowHeight: options.rowHeight || 34,
            tokenGap: options.tokenGap ?? 7,
            paddingX: options.paddingX ?? 22,
            paddingY: options.paddingY ?? 16,
            titleHeight: options.title ? (options.titleHeight ?? 27) : 0,
            slotPaddingX: options.slotPaddingX ?? 8,
            slotPaddingY: options.slotPaddingY ?? 3
        };

        ctx.save();
        const rowLayouts = rows.map(tokens => {
            const tokenLayouts = tokens.map(token => ({
                token,
                metrics: this.getEquationTokenMetrics(ctx, token, settings)
            }));
            const width = tokenLayouts.reduce((sum, item, index) => (
                sum + item.metrics.width + (index > 0 ? settings.tokenGap : 0)
            ), 0);

            return { tokens: tokenLayouts, width };
        });
        ctx.restore();

        const contentWidth = Math.max(1, ...rowLayouts.map(row => row.width));
        const width = options.width || contentWidth + (settings.paddingX * 2);
        const height = settings.paddingY
            + settings.titleHeight
            + (rows.length * settings.rowHeight)
            + settings.paddingY;
        const x = Number.isFinite(options.x)
            ? options.x
            : this.normalizeNumber(options.centerX, this.width / 2) - (width / 2);
        const y = Number.isFinite(options.y)
            ? options.y
            : this.normalizeNumber(options.centerY, this.height / 2) - (height / 2);

        return {
            ...settings,
            id: template?.id || options.id || 'equation',
            rows: rowLayouts,
            x,
            y,
            width,
            height,
            contentWidth
        };
    }

    drawEquationTemplate(ctx, template, options = {}) {
        const layout = this.getEquationTemplateLayout(ctx, template, options);
        const title = options.title ?? template?.title;
        const activeSlots = new Set(options.activeSlots || template?.activeSlots || []);
        const filledSlots = new Set(options.filledSlots || template?.filledSlots || []);

        ctx.save();
        ctx.fillStyle = options.background || 'rgba(255,255,255,0.93)';
        ctx.strokeStyle = options.borderColor || 'rgba(15, 23, 42, 0.14)';
        ctx.lineWidth = options.borderWidth ?? 1;
        this.roundRect(ctx, layout.x, layout.y, layout.width, layout.height, options.radius ?? 10);
        ctx.fill();
        ctx.stroke();

        if (title) {
            ctx.fillStyle = options.titleFill || '#334155';
            ctx.font = options.titleFont || '800 11px Inter, sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(title, layout.x + layout.paddingX, layout.y + 17);
        }

        layout.rows.forEach((row, rowIndex) => {
            let cursorX = layout.x + ((layout.width - row.width) / 2);
            const centerY = layout.y
                + layout.paddingY
                + layout.titleHeight
                + (rowIndex * layout.rowHeight)
                + (layout.rowHeight / 2);

            row.tokens.forEach((item, tokenIndex) => {
                if (tokenIndex > 0) cursorX += layout.tokenGap;

                const { token, metrics } = item;
                const isSlot = Boolean(token?.slot);
                const slotKey = token?.slot;
                const active = isSlot && activeSlots.has(slotKey);
                const filled = isSlot && (filledSlots.has(slotKey) || token.valueText || token.displayText);
                const tokenX = cursorX;
                const tokenY = centerY - (metrics.height / 2);

                if (isSlot) {
                    ctx.fillStyle = token.background || (active
                        ? 'rgba(219, 234, 254, 0.96)'
                        : (filled ? 'rgba(240, 253, 244, 0.96)' : 'rgba(248, 250, 252, 0.96)'));
                    ctx.strokeStyle = token.borderColor || (active
                        ? '#2563eb'
                        : (filled ? '#16a34a' : 'rgba(100, 116, 139, 0.36)'));
                    ctx.lineWidth = active ? 1.8 : 1;
                    this.roundRect(ctx, tokenX, tokenY + metrics.paddingY, metrics.width, metrics.height - (metrics.paddingY * 2), 7);
                    ctx.fill();
                    ctx.stroke();
                }

                ctx.font = metrics.font;
                ctx.fillStyle = token?.fill || (isSlot ? '#1d4ed8' : '#0f172a');
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                ctx.fillText(metrics.text, tokenX + metrics.paddingX, centerY);

                if (isSlot) {
                    const slotAnchor = {
                        x: tokenX,
                        y: tokenY,
                        width: metrics.width,
                        height: metrics.height,
                        text: metrics.text,
                        kind: 'equation-slot',
                        key: slotKey,
                        templateId: layout.id,
                        rowIndex
                    };
                    this.registerCanvasAnchor(ctx, `equation:${layout.id}:slot:${slotKey}`, slotAnchor);
                    this.registerCanvasAnchor(ctx, `equation:slot:${slotKey}`, slotAnchor);
                    (token.anchorAliases || []).forEach(alias => this.registerCanvasAnchor(ctx, alias, slotAnchor));
                }

                cursorX += metrics.width;
            });
        });

        this.registerCanvasAnchor(ctx, `equation:${layout.id}:panel`, {
            x: layout.x,
            y: layout.y,
            width: layout.width,
            height: layout.height,
            kind: 'equation-panel',
            templateId: layout.id
        });

        ctx.restore();
        return layout;
    }

    createMovingValueTokenFromAnchors({ from, to, text, ...options } = {}) {
        const fromPoint = typeof from === 'string' ? this.getCanvasAnchorPoint(from) : from;
        const toPoint = typeof to === 'string' ? this.getCanvasAnchorPoint(to) : to;

        if (!fromPoint || !toPoint) return null;

        return {
            ...options,
            text: text ?? fromPoint.anchor?.text ?? '',
            from: { x: fromPoint.x, y: fromPoint.y },
            to: { x: toPoint.x, y: toPoint.y }
        };
    }

    normalizeNumber(value, fallback = 0) {
        const n = Number(value);
        return Number.isFinite(n) ? n : fallback;
    }

    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    formatNumber(value) {
        if (!Number.isFinite(value)) return '0';
        const abs = Math.abs(value);
        if (abs >= 100) return value.toFixed(0);
        if (abs >= 10) return value.toFixed(1);
        return value.toFixed(2);
    }

    getProblemSetupImportControls() {
        return {
            "Problem Setup Import": {
                problemSetupImport: {
                    label: "Paste Settings CSV",
                    type: "textarea",
                    value: "",
                    rows: 12,
                    placeholder: [
                        "Use CSV format: setting,value",
                        "Only mentioned settings change.",
                        "",
                        "Example:",
                        "setting,value",
                        "initialVelocity,20",
                        "objectType,Ball",
                        "showGhostFrames,off"
                    ].join('\n')
                },
                fillProblemSetupImportTemplate: {
                    label: "Load Current Settings CSV",
                    type: "button",
                    buttonText: "Load Current Settings CSV",
                    onClick: (moduleInstance) => moduleInstance.fillProblemSetupImportTemplate()
                },
                applyProblemSetupImport: {
                    label: "Apply Imported Settings",
                    type: "button",
                    buttonText: "Apply Imported Settings",
                    onClick: (moduleInstance) => moduleInstance.applyProblemSetupImport()
                }
            }
        };
    }

    normalizeImportToken(value) {
        return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
    }

    getImportExtraAliases() {
        return {};
    }

    getImportAliasMap() {
        if (this.importAliasMap) return this.importAliasMap;

        const aliasMap = {};
        const addAlias = (alias, key) => {
            const normalizedAlias = this.normalizeImportToken(alias);
            if (!normalizedAlias) return;
            aliasMap[normalizedAlias] = key;
        };

        for (const [key, def] of Object.entries(this.inputDefinitions || {})) {
            addAlias(key, key);
            addAlias(def.label, key);
        }

        const extraAliases = this.getImportExtraAliases();

        for (const [key, aliases] of Object.entries(extraAliases)) {
            aliases.forEach(alias => addAlias(alias, key));
        }

        this.importAliasMap = aliasMap;
        return aliasMap;
    }

    parseImportedBoolean(rawValue) {
        const normalized = String(rawValue || '').trim().toLowerCase();
        if (['true', 'yes', 'on', '1', 'show'].includes(normalized)) return true;
        if (['false', 'no', 'off', '0', 'hide'].includes(normalized)) return false;
        return null;
    }

    parseCsvLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i += 1) {
            const ch = line[i];
            const next = line[i + 1];

            if (ch === '"') {
                if (inQuotes && next === '"') {
                    current += '"';
                    i += 1;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (ch === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += ch;
            }
        }

        values.push(current.trim());
        return values;
    }

    serializeCsvCell(value) {
        const text = String(value ?? '');
        if (!/[",\r\n]/.test(text)) return text;
        return `"${text.replace(/"/g, '""')}"`;
    }

    isImportControlKey(key) {
        return ['problemSetupImport', 'fillProblemSetupImportTemplate', 'applyProblemSetupImport'].includes(key);
    }

    serializeInputValueForImport(key) {
        const def = this.inputDefinitions?.[key];
        const value = this.inputs?.[key];
        if (!def) return '';
        if (def.type === 'checkbox') return value ? 'on' : 'off';
        return value ?? '';
    }

    fillProblemSetupImportTemplate() {
        const rows = ['setting,value'];

        for (const key of Object.keys(this.inputDefinitions || {})) {
            if (this.isImportControlKey(key)) continue;
            const value = this.serializeInputValueForImport(key);
            rows.push(`${this.serializeCsvCell(key)},${this.serializeCsvCell(value)}`);
        }

        this.setInputValue('problemSetupImport', rows.join('\n'));
    }

    coerceImportedValue(key, rawValue) {
        const def = this.inputDefinitions?.[key];
        if (!def) return { ok: false, reason: 'unknown-setting' };

        if (def.type === 'checkbox') {
            const parsed = this.parseImportedBoolean(rawValue);
            if (parsed === null) return { ok: false, reason: `expected true/false for ${key}` };
            return { ok: true, value: parsed };
        }

        if (def.type === 'number') {
            const parsed = Number(String(rawValue).trim());
            if (!Number.isFinite(parsed)) return { ok: false, reason: `expected number for ${key}` };
            return { ok: true, value: parsed };
        }

        if (def.type === 'select') {
            const normalizedValue = this.normalizeImportToken(rawValue);
            const option = (def.options || []).find(opt => this.normalizeImportToken(opt) === normalizedValue);
            if (!option) return { ok: false, reason: `invalid option for ${key}` };
            return { ok: true, value: option };
        }

        return { ok: true, value: String(rawValue) };
    }

    applyProblemSetupImport() {
        const rawText = String(this.inputs.problemSetupImport || '').trim();
        if (!rawText) return;

        const aliasMap = this.getImportAliasMap();
        const rows = rawText
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(line => line && !line.startsWith('#') && !line.startsWith('//'));

        const applied = [];
        const unknown = [];
        const invalid = [];

        rows.forEach((row, index) => {
            const columns = this.parseCsvLine(row);
            if (columns.length < 2) {
                invalid.push(`${row} (use setting,value)`);
                return;
            }

            const rawKey = columns[0];
            const rawValue = columns.slice(1).join(',').trim();
            const normalizedKey = this.normalizeImportToken(rawKey);
            const normalizedHeaderValue = this.normalizeImportToken(columns[1]);

            if (
                index === 0 &&
                ['setting', 'key', 'name'].includes(normalizedKey) &&
                ['value', 'settingvalue'].includes(normalizedHeaderValue)
            ) {
                return;
            }

            const resolvedKey = aliasMap[normalizedKey];
            if (!resolvedKey || this.isImportControlKey(resolvedKey)) {
                unknown.push(rawKey.trim());
                return;
            }

            const coerced = this.coerceImportedValue(resolvedKey, rawValue);
            if (!coerced.ok) {
                invalid.push(`${rawKey.trim()}: ${rawValue.trim()} (${coerced.reason})`);
                return;
            }

            this.setInputValue(resolvedKey, coerced.value);
            applied.push(`${resolvedKey}=${coerced.value}`);
        });

        if (applied.length) {
            this.drawPreview();
        }

        const moduleName = this.constructor?.name || 'KinematicsModule';
        if (applied.length) {
            console.info(`[${moduleName}] Applied imported settings: ${applied.join(', ')}`);
        }
        if (unknown.length) {
            console.warn(`[${moduleName}] Unknown imported settings ignored: ${unknown.join(', ')}`);
        }
        if (invalid.length) {
            console.warn(`[${moduleName}] Invalid imported settings ignored: ${invalid.join(' | ')}`);
        }
    }

    drawBackground(ctx, options = {}) {
        const {
            gridColor = this.kinematicsTheme.gridColor,
            gridSize = this.kinematicsTheme.gridSize
        } = options || {};

        ctx.save();
        
        // NEW: Atmospheric Sky Gradient
        const skyGrad = ctx.createLinearGradient(0, 0, 0, this.height);
        skyGrad.addColorStop(0, '#7dd3fc'); // Deeper blue at the top
        skyGrad.addColorStop(1, '#f0f9ff'); // Pale blue/white near the horizon
        
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, this.width, this.height);

        // Draw the grid lines over the sky
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1;
        for (let x = 0; x <= this.width; x += gridSize) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, this.height); ctx.stroke();
        }
        for (let y = 0; y <= this.height; y += gridSize) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(this.width, y); ctx.stroke();
        }
        ctx.restore();
    }

    drawTimer(ctx, model, options = {}) {
        if (this.inputs?.showTimerDisplay === false) return;

        // Use a fixed-width format so the text doesn't jitter left/right as it ticks
        const timeStr = model.activeTime.toFixed(2).padStart(5, '0');
        const text = `t = ${timeStr} s`;

        const {
            top = 15,
            height = 36,
            radius = 18,
            font = '600 13.5px "Courier New", monospace', // Monospace prevents jitter
            paddingX = 40,
            textColor = '#38bdf8' // Glowing cyan text for a HUD look
        } = options;

        ctx.save();
        ctx.font = font;
        const textWidth = ctx.measureText(text).width;
        const boxWidth = textWidth + paddingX;
        const left = (this.width / 2) - (boxWidth / 2);

        // --- 1. Drop Shadow ---
        ctx.shadowColor = 'rgba(15, 23, 42, 0.4)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 4;

        // --- 2. Semi-transparent Dark Pill Background ---
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        this.roundRect(ctx, left, top, boxWidth, height, radius);
        ctx.fill();

        ctx.shadowColor = 'transparent'; // Reset shadow for internal elements

        // --- 3. Glowing Inner Border ---
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // --- 4. HUD Text ---
        ctx.fillStyle = textColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Add a slight text glow
        ctx.shadowColor = textColor;
        ctx.shadowBlur = 4;
        ctx.fillText(text, left + (boxWidth / 2), top + (height / 2) + 1);
        
        ctx.restore();
    }

    getCanvasTextScale() {
        return 1;
    }

    scaleFontString(font, scale = this.getCanvasTextScale()) {
        if (!font || scale === 1) return font;
        return String(font).replace(/(\d*\.?\d+)px/g, (_, size) => `${(parseFloat(size) * scale).toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1')}px`);
    }

    drawStopwatch(ctx, x, y, text, options = {}) {
        const {
            font = 'bold 11.5px "Courier New", monospace',
            minTextWidth = 64,
            textPadding = 20,
            outerPadding = 24,
            top = -20,
            height = 46,
            scale = 1
        } = options;
        const uiScale = this.getCanvasTextScale();
        const scaledFont = this.scaleFontString(font, uiScale);
        const scaledMinTextWidth = minTextWidth * uiScale;
        const scaledTextPadding = textPadding * uiScale;
        const scaledOuterPadding = outerPadding * uiScale;
        const scaledTop = top * uiScale;
        const scaledHeight = height * uiScale;

        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        ctx.font = scaledFont;

        const textWidth = Math.max(scaledMinTextWidth, ctx.measureText(text).width + scaledTextPadding);
        const boxWidth = textWidth + scaledOuterPadding;

        // --- 1. Stopwatch Buttons (Drawn before the body so they sit behind it) ---
        
        // Left Button (Lap/Reset) - Angled
        ctx.fillStyle = '#64748b'; // Slate metal
        ctx.save();
        ctx.translate(-boxWidth / 2 + (12 * uiScale), scaledTop - (2 * uiScale));
        ctx.rotate(-Math.PI / 7); // Rotate the canvas to angle the button
        this.roundRect(ctx, -7 * uiScale, -8 * uiScale, 14 * uiScale, 12 * uiScale, 2 * uiScale);
        ctx.fill();
        ctx.restore();

        // Right Button (Start/Stop) - Angled Red Accent
        ctx.fillStyle = '#ef4444'; // Bright Red
        ctx.save();
        ctx.translate(boxWidth / 2 - (12 * uiScale), scaledTop - (2 * uiScale));
        ctx.rotate(Math.PI / 7);
        this.roundRect(ctx, -7 * uiScale, -8 * uiScale, 14 * uiScale, 12 * uiScale, 2 * uiScale);
        ctx.fill();
        ctx.restore();

        // Center Crown & Ring
        ctx.fillStyle = '#94a3b8';
        this.roundRect(ctx, -9 * uiScale, scaledTop - (8 * uiScale), 18 * uiScale, 10 * uiScale, 2 * uiScale);
        ctx.fill();
        
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2.5 * uiScale;
        ctx.beginPath();
        ctx.arc(0, scaledTop - (13 * uiScale), 6 * uiScale, 0, Math.PI * 2); // The lanyard ring
        ctx.stroke();

        // --- 2. Main Casing (Metallic Gradient) ---
        const bodyGrad = ctx.createLinearGradient(-boxWidth/2, scaledTop, boxWidth/2, scaledTop + scaledHeight);
        bodyGrad.addColorStop(0, '#ffffff'); // Glare on the left
        bodyGrad.addColorStop(1, '#cbd5e1'); // Shading on the right

        ctx.shadowColor = 'rgba(15, 23, 42, 0.35)';
        ctx.shadowBlur = 8 * uiScale;
        ctx.shadowOffsetY = 5 * uiScale;

        ctx.fillStyle = bodyGrad;
        this.roundRect(ctx, -boxWidth / 2, scaledTop, boxWidth, scaledHeight, 12 * uiScale);
        ctx.fill();
        
        ctx.shadowColor = 'transparent'; // Reset shadows

        // Casing outline
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1 * uiScale;
        ctx.stroke();

        // --- 3. LCD Digital Screen (Dark Inset) ---
        ctx.fillStyle = '#0f172a'; // Deep LCD black/blue
        const screenWidth = textWidth;
        const screenHeight = 26 * uiScale;
        const screenTop = scaledTop + (10 * uiScale);
        this.roundRect(ctx, -screenWidth / 2, screenTop, screenWidth, screenHeight, 4 * uiScale);
        ctx.fill();

        // Screen inner shadow effect
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // --- 4. Digital Text ---
        ctx.fillStyle = '#10b981'; // Emerald green digital display
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Slight glow on the digital numbers
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 5;
        ctx.fillText(text, 0, screenTop + screenHeight / 2 + 1);

        ctx.restore();
    }

    drawTextLabel(ctx, x, y, text, options = {}) {
        const {
            rotate = 0,
            font = 'bold 11.4px Inter, sans-serif',
            fill = this.kinematicsTheme.labelFill,
            background = this.kinematicsTheme.labelBackground,
            paddingX = 3,
            paddingY = 0.5,
            radius = 7,
            borderColor = 'rgba(15, 23, 42, 0.18)',
            borderWidth = 1,
            shadowColor = 'rgba(15, 23, 42, 0.10)',
            shadowBlur = this.isSvgExporting ? 0 : 6,
            scale = 1
        } = options;
        const uiScale = this.getCanvasTextScale();
        const scaledFont = this.scaleFontString(font, uiScale);
        const scaledPaddingX = paddingX * uiScale;
        const scaledPaddingY = paddingY * uiScale;
        const scaledRadius = radius * uiScale;
        const scaledBorderWidth = borderWidth * uiScale;
        const scaledShadowBlur = shadowBlur * uiScale;

        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        ctx.rotate(rotate);
        ctx.font = scaledFont;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const width = ctx.measureText(text).width + scaledPaddingX * 2;
        const height = (22 * uiScale) + scaledPaddingY;

        if (background) {
            ctx.shadowColor = shadowColor;
            ctx.shadowBlur = scaledShadowBlur;
            ctx.fillStyle = background;
            this.roundRect(ctx, -width / 2, -height / 2, width, height, scaledRadius);
            ctx.fill();
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            if (borderColor && borderWidth > 0) {
                ctx.strokeStyle = borderColor;
                ctx.lineWidth = scaledBorderWidth;
                this.roundRect(ctx, -width / 2, -height / 2, width, height, scaledRadius);
                ctx.stroke();
            }
        }

        ctx.fillStyle = fill;
        ctx.fillText(text, 0, 0);
        ctx.restore();
    }

    drawArrow(ctx, fromX, fromY, toX, toY, color, width = 2, options = {}) {
        const dx = toX - fromX;
        const dy = toY - fromY;
        const length = Math.hypot(dx, dy);
        
        // Dynamically scale headSize based on vector length
        const dynamicHeadSize = Math.max(5, Math.min(16, length * 0.25));
        const headSize = options.headSize || dynamicHeadSize;
        const filled = options.filled !== false;
        const angle = Math.atan2(dy, dx);

        ctx.save();
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.stroke();

        if (filled) {
            ctx.beginPath();
            ctx.moveTo(toX, toY);
            ctx.lineTo(toX - headSize * Math.cos(angle - Math.PI / 6), toY - headSize * Math.sin(angle - Math.PI / 6));
            ctx.lineTo(toX - headSize * Math.cos(angle + Math.PI / 6), toY - headSize * Math.sin(angle + Math.PI / 6));
            ctx.closePath();
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.moveTo(toX, toY);
            ctx.lineTo(toX - headSize * Math.cos(angle - Math.PI / 6), toY - headSize * Math.sin(angle - Math.PI / 6));
            ctx.moveTo(toX, toY);
            ctx.lineTo(toX - headSize * Math.cos(angle + Math.PI / 6), toY - headSize * Math.sin(angle + Math.PI / 6));
            ctx.stroke();
        }

        ctx.restore();
    }

    drawListPanel(ctx, { rows, x, y, width, rowHeight = 22, topPadding = 18, radius = 6, font = '13.2px Georgia, serif' }) {
        const height = rows.length * rowHeight + topPadding + 10;

        ctx.save();
        ctx.fillStyle = this.kinematicsTheme.panelFill;
        ctx.strokeStyle = this.kinematicsTheme.panelStroke;
        ctx.lineWidth = 1;
        this.roundRect(ctx, x, y, width, height, radius);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#334155';
        ctx.font = font;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        rows.forEach((row, i) => {
            const rowText = typeof row === 'string' ? row : row.text;
            const hoverStyle = this.getValueRowHoverStyle(row);
            const textX = x + 12;
            const textY = y + topPadding + i * rowHeight;
            const textWidth = ctx.measureText(rowText).width;
            const textScale = hoverStyle.scale || 1;

            ctx.save();
            ctx.translate(textX, textY);
            ctx.scale(textScale, textScale);

            if (hoverStyle.background) {
                ctx.save();
                ctx.shadowColor = hoverStyle.shadowColor;
                ctx.shadowBlur = hoverStyle.shadowBlur;
                ctx.fillStyle = hoverStyle.background;
                this.roundRect(ctx, -6, -(rowHeight / 2) + 1, textWidth + 12, rowHeight - 2, 5);
                ctx.fill();
                ctx.restore();

                ctx.strokeStyle = hoverStyle.borderColor;
                ctx.lineWidth = 1;
                this.roundRect(ctx, -6, -(rowHeight / 2) + 1, textWidth + 12, rowHeight - 2, 5);
                ctx.stroke();
            }

            ctx.fillStyle = hoverStyle.fill || '#334155';
            ctx.fillText(rowText, 0, 0);

            if (typeof row === 'string') {
                ctx.restore();
                return;
            }

            const rowAnchor = {
                x: -6,
                y: -(rowHeight / 2),
                width: Math.max(textWidth + 12, width - 12),
                height: rowHeight,
                text: rowText,
                kind: 'value-row',
                key: row.key,
                axis: row.axis
            };
            this.registerCanvasAnchor(ctx, row.anchorId, rowAnchor);
            (row.anchorAliases || []).forEach(alias => this.registerCanvasAnchor(ctx, alias, rowAnchor));

            if (!row.valueAnchorId) {
                ctx.restore();
                return;
            }

            const valueText = row.valueText ?? this.getValueTextFromRow(rowText);
            const valueIndex = valueText ? rowText.indexOf(valueText) : -1;
            const valueX = valueIndex >= 0
                ? ctx.measureText(rowText.slice(0, valueIndex)).width
                : 0;
            const valueWidth = valueText ? ctx.measureText(valueText).width : textWidth;

            const valueAnchor = {
                x: valueX,
                y: -(rowHeight / 2),
                width: valueWidth,
                height: rowHeight,
                text: valueText || rowText,
                rowText,
                kind: 'value',
                key: row.key,
                axis: row.axis
            };
            this.registerCanvasAnchor(ctx, row.valueAnchorId, valueAnchor);
            (row.valueAnchorAliases || []).forEach(alias => this.registerCanvasAnchor(ctx, alias, valueAnchor));
            ctx.restore();
        });
        ctx.restore();
    }

    getValueTextFromRow(rowText) {
        const match = String(rowText).match(/=\s*(.+)$/);
        return match ? match[1] : String(rowText);
    }

    drawEquationBox(ctx, { equations, highlightKey = 'None', x, y, width = 137, rowHeight = 22, topPadding = 14, fontSize = 12.6 }) {
        const uiScale = this.getCanvasTextScale();
        const scaledRowHeight = rowHeight * uiScale;
        const scaledTopPadding = topPadding * uiScale;
        const height = equations.length * scaledRowHeight + scaledTopPadding + (10 * uiScale);
        const highlightIndex = ['Eq 1', 'Eq 2', 'Eq 3', 'Eq 4'].indexOf(highlightKey);

        ctx.save();
        ctx.fillStyle = this.kinematicsTheme.panelFill;
        ctx.strokeStyle = this.kinematicsTheme.panelStroke;
        ctx.lineWidth = 1 * uiScale;
        this.roundRect(ctx, x, y, width, height, 6 * uiScale);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        equations.forEach((equation, i) => {
            const lineY = y + scaledTopPadding + (11 * uiScale) + i * scaledRowHeight;
            if (i === highlightIndex) {
                ctx.fillStyle = '#fef08a';
                this.roundRect(ctx, x + (7 * uiScale), lineY - (11 * uiScale), width - (14 * uiScale), 20 * uiScale, 4 * uiScale);
                ctx.fill();
            }
            ctx.fillStyle = i === highlightIndex ? '#1d4ed8' : '#334155';
            ctx.font = this.scaleFontString(`${i === highlightIndex ? 'bold' : 'normal'} ${fontSize}px Georgia, serif`, uiScale);
            ctx.fillText(equation, x + (14 * uiScale), lineY);
        });
        ctx.restore();
    }

    clampPanelPosition(x, y, width, height, margin = 8) {
        return {
            x: this.clamp(x, margin, this.width - width - margin),
            y: this.clamp(y, margin, this.height - height - margin)
        };
    }

    getPanelPosition({
        placement = 'Top Left',
        width,
        height,
        margin = 8,
        xOffset = 0,
        yOffset = 0
    }) {
        let x = margin;
        let y = margin;

        switch (placement) {
            case 'Top Right':
                x = this.width - width - margin;
                y = margin;
                break;
            case 'Bottom Left':
                x = margin;
                y = this.height - height - margin;
                break;
            case 'Bottom Right':
                x = this.width - width - margin;
                y = this.height - height - margin;
                break;
            case 'Top Center':
                x = (this.width - width) / 2;
                y = margin;
                break;
            case 'Bottom Center':
                x = (this.width - width) / 2;
                y = this.height - height - margin;
                break;
            default:
                x = margin;
                y = margin;
                break;
        }

        return this.clampPanelPosition(x + xOffset, y + yOffset, width, height, margin);
    }

    drawObject(ctx, x, y, type = 'Ball', opacity = 1, model = null, options = {}) {
        const normalized = String(type || 'Ball').toLowerCase();
        const primaryColor = options.color || '#64748b'; 
        
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.translate(x, y);
// Add inside drawObject(), right after ctx.translate(x, y);
    ctx.shadowColor = 'rgba(15, 23, 42, 0.4)'; // Dark slate, 40% opacity
    ctx.shadowBlur = 12; // Soft, realistic blur
    ctx.shadowOffsetY = 6; // Push the shadow down slightly
        if (normalized === 'ball') {
            ctx.fillStyle = '#f59e0b';
            ctx.strokeStyle = '#b45309';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.strokeStyle = 'rgba(120, 53, 15, 0.7)';
            ctx.lineWidth = 1.3;
            ctx.beginPath();
            ctx.moveTo(0, -14);
            ctx.lineTo(0, 14);
            ctx.moveTo(-14, 0);
            ctx.lineTo(14, 0);
            ctx.moveTo(-9, -9);
            ctx.quadraticCurveTo(-2, 0, -9, 9);
            ctx.moveTo(9, -9);
            ctx.quadraticCurveTo(2, 0, 9, 9);
            ctx.stroke();
        } else if (normalized === 'car') {
            ctx.fillStyle = primaryColor;
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-32, 12);
            ctx.lineTo(-32, 4);
            ctx.quadraticCurveTo(-32, 0, -26, 0);
            ctx.lineTo(-18, -12);
            ctx.lineTo(10, -12);
            ctx.lineTo(20, 0);
            ctx.lineTo(30, 0);
            ctx.quadraticCurveTo(34, 0, 34, 5);
            ctx.lineTo(34, 12);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#e2e8f0';
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-16, -2);
            ctx.lineTo(-13, -10);
            ctx.lineTo(-2, -10);
            ctx.lineTo(-2, -2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, -2);
            ctx.lineTo(0, -10);
            ctx.lineTo(8, -10);
            ctx.lineTo(16, -2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            this.drawWheel(ctx, -16, 12);
            this.drawWheel(ctx, 18, 12);
        } else if (normalized === 'person') {
            ctx.fillStyle = primaryColor;
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, -19, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            this.roundRect(ctx, -5, -12, 10, 16, 4);
            ctx.fill();
            ctx.stroke();
            ctx.strokeStyle = primaryColor;
            ctx.lineWidth = 4.5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(-2, 4);
            ctx.lineTo(-6, 20);
            ctx.moveTo(2, 4);
            ctx.lineTo(6, 20);
            ctx.moveTo(-4, -6);
            ctx.quadraticCurveTo(-13, -1, -11, 7);
            ctx.moveTo(4, -6);
            ctx.quadraticCurveTo(13, -1, 11, 7);
            ctx.stroke();
        } else if (normalized === 'plane') {
            const wingAccentColor = '#94a3b8';
            ctx.fillStyle = primaryColor;
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 2;
            ctx.lineJoin = 'round';

            // Fuselage
            ctx.beginPath();
            ctx.moveTo(-34, 0);
            ctx.bezierCurveTo(-12, -10, 18, -10, 38, 0);
            ctx.lineTo(47, 5);
            ctx.lineTo(37, 9);
            ctx.bezierCurveTo(-12, 14, -34, 5, -34, 5);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Main wing
            ctx.fillStyle = wingAccentColor;
            ctx.beginPath();
            ctx.moveTo(-2, -2);
            ctx.lineTo(12, -18);
            ctx.lineTo(28, -4);
            ctx.lineTo(8, -1);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Tail wing
            ctx.beginPath();
            ctx.moveTo(-20, -1);
            ctx.lineTo(-30, -13);
            ctx.lineTo(-18, -5);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Cockpit window
            ctx.fillStyle = '#bae6fd';
            ctx.beginPath();
            ctx.ellipse(24, -1, 7, 4, 0, 0, Math.PI * 2);
            ctx.fill();
        } else if (normalized === 'cannon ball' || normalized === 'cannonball') {
            // Cast-iron cannonball
            ctx.fillStyle = '#374151';
            ctx.strokeStyle = '#111827';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            // Metallic sheen
            ctx.fillStyle = 'rgba(156,163,175,0.35)';
            ctx.beginPath();
            ctx.ellipse(-4, -5, 5, 3.5, -Math.PI / 4, 0, Math.PI * 2);
            ctx.fill();
            // Specular highlight
            ctx.fillStyle = 'rgba(229,231,235,0.65)';
            ctx.beginPath();
            ctx.arc(-5, -6, 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (normalized === 'rock') {
            // Irregular rock
            ctx.fillStyle = '#6b7280';
            ctx.strokeStyle = '#374151';
            ctx.lineWidth = 2;
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(0, -14);
            ctx.bezierCurveTo(7, -14, 15, -8, 14, 0);
            ctx.bezierCurveTo(15, 7, 10, 14, 3, 14);
            ctx.bezierCurveTo(-3, 16, -12, 11, -14, 4);
            ctx.bezierCurveTo(-17, -3, -12, -14, -5, -15);
            ctx.bezierCurveTo(-2, -16, -3, -14, 0, -14);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            // Crack texture
            ctx.strokeStyle = '#4b5563';
            ctx.lineWidth = 1;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(-4, -6);
            ctx.lineTo(2, 2);
            ctx.lineTo(8, 0);
            ctx.moveTo(-8, 2);
            ctx.lineTo(-2, 6);
            ctx.stroke();
            // Highlight
            ctx.fillStyle = 'rgba(156,163,175,0.3)';
            ctx.beginPath();
            ctx.ellipse(-3, -5, 5, 3, -0.5, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Isometric Crate / Block
            const size = 28;
            const depth = 8;
            const hSize = size / 2;
            const blockColor = options.color || '#d97706';
            
            ctx.fillStyle = blockColor; 
            ctx.strokeStyle = '#78350f';
            ctx.lineWidth = 2;
            ctx.lineJoin = 'round';
            ctx.fillRect(-hSize, -hSize, size, size);
            ctx.strokeRect(-hSize, -hSize, size, size);

            ctx.fillStyle = '#f59e0b'; 
            ctx.beginPath();
            ctx.moveTo(-hSize, -hSize);
            ctx.lineTo(-hSize + depth, -hSize - depth);
            ctx.lineTo(hSize + depth, -hSize - depth);
            ctx.lineTo(hSize, -hSize);
            ctx.closePath();
            ctx.fill(); 
            ctx.stroke();

            ctx.fillStyle = '#b45309'; 
            ctx.beginPath();
            ctx.moveTo(hSize, -hSize);
            ctx.lineTo(hSize + depth, -hSize - depth);
            ctx.lineTo(hSize + depth, hSize - depth);
            ctx.lineTo(hSize, hSize);
            ctx.closePath();
            ctx.fill(); 
            ctx.stroke();

            // Mass Label Overlay
            const massText = model && model.m ? `${model.m.toFixed(1)} kg` : 'm';
            ctx.fillStyle = '#fffbeb';
            ctx.font = 'bold 10px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(massText, 0, 1);
        }

        ctx.restore();
    }

    drawWheel(ctx, x, y) {
        ctx.save();
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    roundRect(ctx, x, y, w, h, r = 6) {
        const radius = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + w - radius, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
        ctx.lineTo(x + w, y + h - radius);
        ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
        ctx.lineTo(x + radius, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    roundRectPath(ctx, x, y, w, h, r = 6) {
        this.roundRect(ctx, x, y, w, h, r);
    }
}
