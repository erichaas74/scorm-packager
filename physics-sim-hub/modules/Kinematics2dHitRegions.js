/**
 * Hit regions for the walkthrough overlays
 * ----------------------------------------
 * Mirrors the layout decisions made in Kinematics2dWalkthroughOverlays.js so a
 * student clicking on the canvas hits the same conceptual element they see
 * highlighted. Each entry returns either:
 *   - a circle  : { kind: 'circle', x, y, r }
 *   - a segment : { kind: 'segment', x1, y1, x2, y2, padding }
 *   - a rect    : { kind: 'rect', x, y, w, h }
 *
 * Keep this file in lock-step with the drawers. If a drawer moves a label or
 * arrow, the matching hit region here moves with it. Drawers and hit regions
 * are intentionally NOT merged into one function so the rendering pass stays
 * cheap (no allocations) and the hit-test pass can run without a canvas.
 */

const HIT_PAD = 18;            // minimum click distance for "near" segments
const SEG_PAD = 14;            // segment thickness for line-like targets
const TIME_LABEL_HEIGHT = 22;  // matches drawTimeStrip label offset

function pickVectorScale(model) {
    const speed = Math.max(1, model.vi || Math.hypot(model.vix || 0, model.viy || 0));
    return 110 / speed;
}

function dxRegion(model) {
    const y = Math.max(model.startY, model.endY) + 28;
    return { kind: 'segment', x1: model.startX, y1: y, x2: model.endX, y2: y, padding: SEG_PAD };
}

function dyRegion(model) {
    const dy = (model.yf ?? 0) - (model.yi ?? 0);
    if (Math.abs(dy) < 0.001) {
        // Same-height: still allow clicks along the equality line.
        const y = model.startY;
        return { kind: 'segment', x1: model.startX - 18, y1: y, x2: model.endX + 18, y2: y, padding: SEG_PAD };
    }
    const x = model.endX + 30;
    const yTop = Math.min(model.startY, model.endY);
    const yBot = Math.max(model.startY, model.endY);
    return { kind: 'segment', x1: x, y1: yTop, x2: x, y2: yBot, padding: SEG_PAD };
}

function hmaxRegion(model) {
    const peakX = model.peakCanvasX;
    const peakY = model.peakCanvasY;
    const groundY = model.startY;
    if (!Number.isFinite(peakX) || !Number.isFinite(peakY)) return null;
    return { kind: 'segment', x1: peakX, y1: peakY, x2: peakX, y2: groundY, padding: SEG_PAD };
}

function v0Region(model) {
    const scale = pickVectorScale(model);
    const tipX = model.startX + (model.vix * scale);
    const tipY = model.startY - (model.viy * scale);
    return { kind: 'segment', x1: model.startX, y1: model.startY, x2: tipX, y2: tipY, padding: SEG_PAD };
}

function v0xRegion(model) {
    const scale = pickVectorScale(model);
    const tipX = model.startX + (model.vix * scale);
    return { kind: 'segment', x1: model.startX, y1: model.startY, x2: tipX, y2: model.startY, padding: SEG_PAD };
}

function v0yRegion(model) {
    const scale = pickVectorScale(model);
    const baseX = model.startX + (model.vix * scale);
    const tipY = model.startY - (model.viy * scale);
    return { kind: 'segment', x1: baseX, y1: model.startY, x2: baseX, y2: tipY, padding: SEG_PAD };
}

function thetaRegion(model) {
    // The angle arc is anchored at (startX, startY) with a small radius.
    return { kind: 'circle', x: model.startX, y: model.startY, r: 56 };
}

function vyRegion(model) {
    const scale = pickVectorScale(model);
    const finalVy = model.finalVy ?? 0;
    if (Math.abs(finalVy) < 0.01) return null;
    const tipY = model.endY - (finalVy * scale);
    return { kind: 'segment', x1: model.endX, y1: model.endY, x2: model.endX, y2: tipY, padding: SEG_PAD };
}

function finalVRegion(model) {
    const scale = pickVectorScale(model);
    const tipX = model.endX + (model.vix * scale);
    const tipY = model.endY - ((model.finalVy ?? 0) * scale);
    return { kind: 'segment', x1: model.endX, y1: model.endY, x2: tipX, y2: tipY, padding: SEG_PAD };
}

function timeRegion(model) {
    const stripY = Math.max(model.startY, model.endY) + 60;
    return {
        kind: 'rect',
        x: model.startX - 10,
        y: stripY - 12,
        w: (model.endX - model.startX) + 20,
        h: TIME_LABEL_HEIGHT + 18
    };
}

function ayRegion(model) {
    const x = Math.min(model.peakCanvasX + 80, model.endX - 40);
    const yTop = Math.min(model.startY, model.endY) - 80;
    const yBot = yTop + 50;
    return { kind: 'segment', x1: x, y1: yTop, x2: x, y2: yBot, padding: SEG_PAD };
}

const regionBuilders = {
    dx: dxRegion,
    dy: dyRegion,
    hmax: hmaxRegion,
    v0: v0Region,
    v0x: v0xRegion,
    v0y: v0yRegion,
    theta: thetaRegion,
    vy: vyRegion,
    finalV: finalVRegion,
    time: timeRegion,
    ay: ayRegion
};

export function getHitRegion(key, model) {
    const builder = regionBuilders[key];
    if (!builder || !model) return null;
    try { return builder(model); } catch { return null; }
}

/**
 * Iterate keys (typically a step's focusValues) and return the closest one to
 * the given canvas point, or null if nothing is within click range.
 *
 * Picking by *closest* rather than first-match means overlapping regions
 * (e.g. v0 overlapping v0x along the horizontal axis at small angles) resolve
 * cleanly: whichever segment the click is geometrically closer to wins.
 */
export function hitTestKeys(keys, model, x, y) {
    let best = null;
    let bestDist = Infinity;
    for (const key of keys) {
        const region = getHitRegion(key, model);
        if (!region) continue;
        const dist = distanceToRegion(region, x, y);
        if (!Number.isFinite(dist)) continue;
        if (dist < bestDist) {
            bestDist = dist;
            best = key;
        }
    }
    return bestDist <= HIT_PAD ? best : null;
}

function distanceToRegion(region, x, y) {
    if (region.kind === 'circle') {
        const dx = x - region.x;
        const dy = y - region.y;
        return Math.max(0, Math.hypot(dx, dy) - region.r);
    }
    if (region.kind === 'rect') {
        const cx = Math.max(region.x, Math.min(x, region.x + region.w));
        const cy = Math.max(region.y, Math.min(y, region.y + region.h));
        return Math.hypot(x - cx, y - cy);
    }
    // segment
    const { x1, y1, x2, y2, padding = 0 } = region;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / len2));
    const px = x1 + t * dx;
    const py = y1 + t * dy;
    return Math.max(0, Math.hypot(x - px, y - py) - padding);
}
