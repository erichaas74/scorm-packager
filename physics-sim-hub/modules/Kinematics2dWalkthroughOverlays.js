/**
 * Walkthrough canvas overlays
 * ---------------------------
 * Each step in the work-analysis walkthrough has a `focusValues` array
 * (e.g. ['v0y', 'ay', 'time', 'vy']) describing which physical quantities
 * the step is reasoning about. This module turns those keys into geometric
 * highlights drawn on top of the parked projectile frame so the canvas and
 * the algebra panel are talking about the same thing at the same time.
 *
 * The module is ES-module-style mixin: import the methods and patch them
 * onto the Module2DKinematics prototype, or call them directly with a
 * `this` bound to a module instance that exposes `drawArrow`,
 * `drawAngleArc`, `drawTextLabel`, and `isSvgExporting`.
 */

const FOCUS_COLORS = {
    dx: '#ea580c',
    dy: '#047857',
    hmax: '#059669',
    v0: '#2563eb',
    v0x: '#b91c1c',
    v0y: '#047857',
    vy: '#047857',
    finalV: '#4338ca',
    theta: '#2563eb',
    time: '#7c3aed',
    ay: '#ea580c'
};

/**
 * Top-level entry point. Iterate over the step's focusValues and dispatch
 * to the appropriate drawer, with the result-bound key receiving emphasis.
 */
export function drawWalkthroughOverlay(ctx, model, step) {
    if (!step || !Array.isArray(step.focusValues) || !step.focusValues.length) return;
    if (!model) return;

    const focusKeys = Array.from(new Set(step.focusValues));
    const resultKeys = new Set(
        Array.isArray(step.resultValues)
            ? step.resultValues
            : (step.resultValue ? [step.resultValue] : [])
    );

    // Draw a faint dim layer behind the overlay so it pops without obscuring.
    drawDimVeil(ctx, model);

    // Order matters: spans first (background-y), vectors next, labels last.
    const drawOrder = [
        'dx', 'dy', 'hmax',                // spans
        'theta', 'v0', 'v0x', 'v0y',       // launch vectors
        'vy', 'finalV',                    // landing vectors
        'time', 'ay'                       // accent annotations
    ];

    for (const key of drawOrder) {
        if (!focusKeys.includes(key)) continue;
        const drawer = drawers[key];
        if (!drawer) continue;
        const accent = step.accent || FOCUS_COLORS[key] || '#7c3aed';
        const isResult = resultKeys.has(key);
        try {
            drawer.call(this, ctx, model, { key, accent, isResult, step });
        } catch (err) {
            // Drawing must never break the frame. Swallow and keep going.
            // eslint-disable-next-line no-console
            console.warn(`drawWalkthroughOverlay: drawer for "${key}" failed`, err);
        }
    }
}

function drawDimVeil(ctx, model) {
    // Very subtle wash so the overlay reads as additive emphasis, not
    // a takeover of the scene.
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.06)';
    const w = (model.worldWidth || 2000);
    const h = (model.worldHeight || 1500);
    const x = (model.worldMinX ?? -200);
    const y = -200;
    ctx.fillRect(x, y, w + 400, h + 600);
    ctx.restore();
}

const drawers = {
    dx: drawDxSpan,
    dy: drawDySpan,
    hmax: drawHmaxBar,
    theta: drawTheta,
    v0: drawV0Vector,
    v0x: drawV0xComponent,
    v0y: drawV0yComponent,
    vy: drawLandingVy,
    finalV: drawFinalVelocity,
    time: drawTimeStrip,
    ay: drawGravityArrow
};

/* ─────────────────────────────────────────────────────────────────────────
   Dimension spans
   ──────────────────────────────────────────────────────────────────────── */

function drawDxSpan(ctx, model, { accent, isResult }) {
    const geometry = typeof this.getDisplacementGeometry === 'function'
        ? this.getDisplacementGeometry(model)
        : null;
    const x1 = geometry?.dx?.x1 ?? model.startX;
    const y = geometry?.dx?.y1 ?? (Math.max(model.startY, model.endY) + (isResult ? 36 : 28));
    const x2 = geometry?.dx?.x2 ?? model.endX;
    drawDimensionLine(ctx, x1, y, x2, y, {
        color: accent,
        width: isResult ? 3 : 2.2,
        dashed: false
    });
    const label = `Δx = ${model.range.toFixed(2)} m`;
    this.drawTextLabel(ctx, (x1 + x2) / 2, y + 18, label, {
        font: isResult ? 'bold 13px serif' : 'bold 12px serif',
        fill: accent,
        background: isResult ? 'rgba(254, 243, 199, 0.96)' : 'rgba(255,255,255,0.94)',
        borderColor: accent,
        borderWidth: isResult ? 2 : 1,
        shadowColor: `${accent}55`,
        shadowBlur: this.isSvgExporting ? 0 : (isResult ? 12 : 6)
    });
}

function drawDySpan(ctx, model, { accent, isResult }) {
    const geometry = typeof this.getDisplacementGeometry === 'function'
        ? this.getDisplacementGeometry(model)
        : null;
    const dy = (model.yf ?? 0) - (model.yi ?? 0);
    if (Math.abs(dy) < 0.001) {
        // Same-height launch — nothing to span; show the equality marker instead.
        const y = geometry?.launchY ?? model.startY;
        const x = Math.min(model.startX, model.endX) - 18;
        drawDimensionLine(ctx, x, y, x + (model.endX - model.startX) + 36, y, {
            color: accent,
            width: 2,
            dashed: true
        });
        this.drawTextLabel(ctx, (model.startX + model.endX) / 2, y - 16, 'Δy = 0', {
            font: 'bold 12px serif',
            fill: accent,
            background: 'rgba(255,255,255,0.94)',
            borderColor: accent,
            borderWidth: 1
        });
        return;
    }

    const x = geometry?.dy?.x1 ?? (model.endX + (isResult ? 38 : 30));
    const yTop = Math.min(geometry?.dy?.y1 ?? model.startY, geometry?.dy?.y2 ?? model.endY);
    const yBot = Math.max(geometry?.dy?.y1 ?? model.startY, geometry?.dy?.y2 ?? model.endY);
    drawDimensionLine(ctx, x, yTop, x, yBot, {
        color: accent,
        width: isResult ? 3 : 2.2,
        vertical: true
    });
    const label = `Δy = ${dy.toFixed(2)} m`;
    this.drawTextLabel(ctx, x + 32, (yTop + yBot) / 2, label, {
        font: isResult ? 'bold 13px serif' : 'bold 12px serif',
        fill: accent,
        background: isResult ? 'rgba(254, 243, 199, 0.96)' : 'rgba(255,255,255,0.94)',
        borderColor: accent,
        borderWidth: isResult ? 2 : 1
    });
}

function drawHmaxBar(ctx, model, { accent, isResult, step }) {
    const geometry = typeof this.getDisplacementGeometry === 'function'
        ? this.getDisplacementGeometry(model)
        : null;
    const hmax = (model.yPeak ?? model.yi) - (model.yi ?? 0);
    if (hmax <= 0.001) return;

    const peakX = geometry?.hmax?.x2 ?? model.peakCanvasX;
    const peakY = geometry?.hmax?.y2 ?? model.peakCanvasY;
    const groundY = geometry?.hmax?.y1 ?? model.startY;

    drawDimensionLine(ctx, peakX, peakY, peakX, groundY, {
        color: accent,
        width: isResult ? 3 : 2.2,
        vertical: true
    });

    // Peak marker dot
    ctx.save();
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(peakX, peakY, isResult ? 6 : 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const label = `hₘₐₓ = ${hmax.toFixed(2)} m`;
    this.drawTextLabel(ctx, peakX - 56, (peakY + groundY) / 2, label, {
        font: isResult ? 'bold 13px serif' : 'bold 12px serif',
        fill: accent,
        background: isResult ? 'rgba(254, 243, 199, 0.96)' : 'rgba(255,255,255,0.94)',
        borderColor: accent,
        borderWidth: isResult ? 2 : 1
    });

    if (step?.id === 'vertical-result' && typeof this.drawPeakZeroVelocityZoom === 'function') {
        this.drawPeakZeroVelocityZoom(ctx, model, 1);
    }
}

/* ─────────────────────────────────────────────────────────────────────────
   Launch-point vectors
   ──────────────────────────────────────────────────────────────────────── */

function drawV0Vector(ctx, model, { accent, isResult }) {
    const scale = pickVectorScale(model);
    const tipX = model.startX + (model.vix * scale);
    const tipY = model.startY - (model.viy * scale);
    this.drawArrow(ctx, model.startX, model.startY, tipX, tipY, accent, isResult ? 4 : 3, { headSize: isResult ? 16 : 14 });
    const label = `v₀ = ${model.vi.toFixed(1)} m/s`;
    this.drawTextLabel(ctx, (model.startX + tipX) / 2 - 6, (model.startY + tipY) / 2 - 22, label, {
        font: isResult ? 'bold 13px serif' : 'bold 12px serif',
        fill: accent,
        background: isResult ? 'rgba(254, 243, 199, 0.96)' : 'rgba(255,255,255,0.94)',
        borderColor: accent,
        borderWidth: isResult ? 2 : 1
    });
}

function drawV0xComponent(ctx, model, { accent, isResult }) {
    const scale = pickVectorScale(model);
    const tipX = model.startX + (model.vix * scale);
    const tipY = model.startY;
    this.drawArrow(ctx, model.startX, model.startY, tipX, tipY, accent, isResult ? 4 : 3, { headSize: isResult ? 14 : 12 });
    const label = `v₀ₓ = ${model.vix.toFixed(2)} m/s`;
    this.drawTextLabel(ctx, (model.startX + tipX) / 2, model.startY + 24, label, {
        font: isResult ? 'bold 13px serif' : 'bold 12px serif',
        fill: accent,
        background: isResult ? 'rgba(254, 243, 199, 0.96)' : 'rgba(255,255,255,0.94)',
        borderColor: accent,
        borderWidth: isResult ? 2 : 1
    });
}

function drawV0yComponent(ctx, model, { accent, isResult }) {
    const scale = pickVectorScale(model);
    // Anchor the v0y arrow at the end of the v0x arrow (component triangle).
    const baseX = model.startX + (model.vix * scale);
    const tipY = model.startY - (model.viy * scale);
    this.drawArrow(ctx, baseX, model.startY, baseX, tipY, accent, isResult ? 4 : 3, { headSize: isResult ? 14 : 12 });
    const label = `v₀ᵧ = ${model.viy.toFixed(2)} m/s`;
    this.drawTextLabel(ctx, baseX + 38, (model.startY + tipY) / 2, label, {
        font: isResult ? 'bold 13px serif' : 'bold 12px serif',
        fill: accent,
        background: isResult ? 'rgba(254, 243, 199, 0.96)' : 'rgba(255,255,255,0.94)',
        borderColor: accent,
        borderWidth: isResult ? 2 : 1
    });
}

function drawTheta(ctx, model, { accent, isResult }) {
    const angle = model.angleDeg ?? 0;
    if (Math.abs(angle) < 0.5) return;
    const radius = isResult ? 56 : 46;
    const label = `θ = ${angle.toFixed(1)}°`;
    this.drawAngleArc(ctx, model.startX, model.startY, angle, radius, label, {
        lineColor: accent,
        lineWidth: isResult ? 2.6 : 2,
        fill: accent,
        background: isResult ? 'rgba(254, 243, 199, 0.96)' : 'rgba(255,255,255,0.94)',
        borderColor: accent,
        borderWidth: isResult ? 2 : 1
    });
}

/* ─────────────────────────────────────────────────────────────────────────
   Landing-point vectors
   ──────────────────────────────────────────────────────────────────────── */

function drawLandingVy(ctx, model, { accent, isResult }) {
    const scale = pickVectorScale(model);
    const finalVy = model.finalVy ?? 0;
    if (Math.abs(finalVy) < 0.01) return;
    // finalVy is signed (negative when descending); arrow tip below the landing point.
    const tipX = model.endX;
    const tipY = model.endY - (finalVy * scale);
    this.drawArrow(ctx, model.endX, model.endY, tipX, tipY, accent, isResult ? 4 : 3, { headSize: isResult ? 14 : 12 });
    const label = `vᵧ = ${finalVy.toFixed(2)} m/s`;
    this.drawTextLabel(ctx, tipX + 38, (model.endY + tipY) / 2, label, {
        font: isResult ? 'bold 13px serif' : 'bold 12px serif',
        fill: accent,
        background: isResult ? 'rgba(254, 243, 199, 0.96)' : 'rgba(255,255,255,0.94)',
        borderColor: accent,
        borderWidth: isResult ? 2 : 1
    });
}

function drawFinalVelocity(ctx, model, { accent, isResult }) {
    const scale = pickVectorScale(model);
    const tipX = model.endX + (model.vix * scale);
    const tipY = model.endY - ((model.finalVy ?? 0) * scale);
    this.drawArrow(ctx, model.endX, model.endY, tipX, tipY, accent, isResult ? 4 : 3, { headSize: isResult ? 16 : 14 });
    const label = `v = ${(model.finalSpeed ?? 0).toFixed(2)} m/s`;
    this.drawTextLabel(ctx, (model.endX + tipX) / 2 - 6, (model.endY + tipY) / 2 - 22, label, {
        font: isResult ? 'bold 13px serif' : 'bold 12px serif',
        fill: accent,
        background: isResult ? 'rgba(254, 243, 199, 0.96)' : 'rgba(255,255,255,0.94)',
        borderColor: accent,
        borderWidth: isResult ? 2 : 1
    });
}

/* ─────────────────────────────────────────────────────────────────────────
   Annotations
   ──────────────────────────────────────────────────────────────────────── */

function drawTimeStrip(ctx, model, { accent, isResult }) {
    // A small timeline strip beneath the trajectory, t=0 at startX, t=tFlight at endX.
    const stripY = Math.max(model.startY, model.endY) + 60;
    const x1 = model.startX;
    const x2 = model.endX;
    const stripWidth = x2 - x1;
    if (stripWidth < 40) return;

    ctx.save();
    ctx.strokeStyle = accent;
    ctx.fillStyle = accent;
    ctx.lineWidth = isResult ? 2.4 : 1.8;

    // Main rail
    ctx.beginPath();
    ctx.moveTo(x1, stripY);
    ctx.lineTo(x2, stripY);
    ctx.stroke();

    // Tick marks at start, peak, and end
    const tickHeight = 7;
    const ticks = [
        { x: x1, label: 't = 0' },
        { x: model.peakCanvasX, label: `t = ${(model.tPeak ?? 0).toFixed(2)} s` },
        { x: x2, label: `t = ${(model.tFlight ?? 0).toFixed(2)} s` }
    ];
    for (const tick of ticks) {
        ctx.beginPath();
        ctx.moveTo(tick.x, stripY - tickHeight);
        ctx.lineTo(tick.x, stripY + tickHeight);
        ctx.stroke();
    }
    ctx.restore();

    // Labels — main flight time gets the emphasis, others are smaller
    for (let i = 0; i < ticks.length; i++) {
        const tick = ticks[i];
        const isMain = i === ticks.length - 1;
        this.drawTextLabel(ctx, tick.x, stripY + 22, tick.label, {
            font: (isMain && isResult) ? 'bold 13px serif' : (isMain ? 'bold 12px serif' : '11px serif'),
            fill: accent,
            background: (isMain && isResult) ? 'rgba(254, 243, 199, 0.96)' : 'rgba(255,255,255,0.94)',
            borderColor: isMain ? accent : null,
            borderWidth: isMain ? (isResult ? 2 : 1) : 0
        });
    }
}

function drawGravityArrow(ctx, model, { accent, isResult }) {
    const g = Math.abs(model.g ?? 9.8);
    // Anchor in upper-right of the trajectory area where it won't fight other overlays.
    const x = Math.min(model.peakCanvasX + 80, model.endX - 40);
    const yTop = Math.min(model.startY, model.endY) - 80;
    const yBot = yTop + 50;
    this.drawArrow(ctx, x, yTop, x, yBot, accent, isResult ? 3.5 : 2.8, { headSize: isResult ? 13 : 11 });
    const label = `g = ${g.toFixed(2)} m/s²`;
    this.drawTextLabel(ctx, x + 44, (yTop + yBot) / 2, label, {
        font: isResult ? 'bold 13px serif' : 'bold 12px serif',
        fill: accent,
        background: isResult ? 'rgba(254, 243, 199, 0.96)' : 'rgba(255,255,255,0.94)',
        borderColor: accent,
        borderWidth: isResult ? 2 : 1
    });
}

/* ─────────────────────────────────────────────────────────────────────────
   Drawing primitives
   ──────────────────────────────────────────────────────────────────────── */

function drawDimensionLine(ctx, x1, y1, x2, y2, opts = {}) {
    const color = opts.color || '#475569';
    const width = opts.width || 2;
    const isVertical = opts.vertical || (Math.abs(x2 - x1) < 0.1 && Math.abs(y2 - y1) > 0.1);
    const tickLength = 8;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    if (opts.dashed) ctx.setLineDash([6, 4]);

    // Main line
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // End ticks (perpendicular)
    ctx.setLineDash([]);
    if (isVertical) {
        ctx.beginPath();
        ctx.moveTo(x1 - tickLength, y1);
        ctx.lineTo(x1 + tickLength, y1);
        ctx.moveTo(x2 - tickLength, y2);
        ctx.lineTo(x2 + tickLength, y2);
        ctx.stroke();
    } else {
        ctx.beginPath();
        ctx.moveTo(x1, y1 - tickLength);
        ctx.lineTo(x1, y1 + tickLength);
        ctx.moveTo(x2, y2 - tickLength);
        ctx.lineTo(x2, y2 + tickLength);
        ctx.stroke();
    }
    ctx.restore();
}

/**
 * Pick a velocity-arrow scale that's visible without leaving the viewport.
 * Mirrors the heuristic used elsewhere in the module.
 */
function pickVectorScale(model) {
    const speed = Math.max(1, model.vi || Math.hypot(model.vix || 0, model.viy || 0));
    // Aim for arrows roughly 80–140 px long for a typical 20 m/s launch.
    const target = 110;
    return target / speed;
}
