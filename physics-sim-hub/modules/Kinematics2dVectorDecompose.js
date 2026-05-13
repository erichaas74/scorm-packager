/**
 * Vector-decompose drag controller
 * --------------------------------
 * Pure-function helpers for the vector-decompose task kind. Owns:
 *   - the drag's geometry constraint (axis-locked or free)
 *   - tolerance checking against an expected magnitude
 *   - construction of the live "ghost arrow" payload that the canvas overlay
 *     reads during a drag
 *
 * No DOM dependencies. Kinematics2d.js is the only thing that knows about
 * pointer events; it calls into here with raw canvas-space coordinates.
 */

import { resolveExpectedValue } from './workAnalysis.js';

// Match the velocity-arrow scale used by the existing overlay drawers so the
// student's drag distance maps to m/s the same way the rendered arrows do.
function pickVectorScale(model) {
    const speed = Math.max(1, model.vi || Math.hypot(model.vix || 0, model.viy || 0));
    return 110 / speed;
}

/**
 * Geometry of the component-arrow rails for a given task.
 *
 *   axis: 'horizontal' | 'vertical'
 *   originX, originY: drag start (anchor) in canvas coords
 *   trueValue: the actual signed m/s value the student is aiming for (vix or viy)
 *   scale: canvas pixels per m/s
 *
 * The student's drag is converted to a signed magnitude in *physics*
 * convention: positive x = right, positive y = up. The drop is in tolerance
 * when the magnitude matches `trueValue` (sign included).
 */
export function getDragGeometry(task, model) {
    if (!task || !model) return null;
    const scale = pickVectorScale(model);
    const target = task.target;
    const startX = model.startX;
    const startY = model.startY;

    if (target === 'v0x') {
        return {
            axis: 'horizontal',
            originX: startX,
            originY: startY,
            trueValue: model.vix || 0,
            trueLengthPx: Math.abs(model.vix || 0) * scale,
            scale
        };
    }

    if (target === 'v0y') {
        // The vertical component anchors at the END of the v0x leg, so the
        // student literally builds the component triangle from corner to corner.
        return {
            axis: 'vertical',
            originX: startX + ((model.vix || 0) * scale),
            originY: startY,
            trueValue: model.viy || 0,
            trueLengthPx: Math.abs(model.viy || 0) * scale,
            scale
        };
    }

    return null;
}

/**
 * Project a pointer point onto the drag's constraint axis. Returns:
 *   { x, y, magnitude }
 * where (x, y) is the projected canvas point (locked to the axis) and
 * `magnitude` is in m/s with PHYSICS sign convention:
 *   - horizontal axis: + means rightward
 *   - vertical axis:   + means UP-the-screen (canvas y decreasing)
 */
export function projectPointer(geometry, pointerX, pointerY) {
    if (!geometry) return null;
    const { axis, originX, originY, scale } = geometry;

    let lockedX = originX;
    let lockedY = originY;
    let magnitude = 0;

    if (axis === 'horizontal') {
        lockedX = pointerX;
        magnitude = (pointerX - originX) / scale;
    } else {
        lockedY = pointerY;
        // canvas y grows downward, so subtract pointer-y from origin-y to
        // get a "positive when up" measurement.
        magnitude = (originY - pointerY) / scale;
    }

    return {
        x: lockedX,
        y: lockedY,
        magnitude,                       // signed, m/s, physics convention
        absMagnitude: Math.abs(magnitude)
    };
}

/**
 * Tolerance for a drag drop. ±10% of the true magnitude with a 0.5 m/s
 * absolute floor so very small components remain achievable.
 */
export function getDragTolerance(geometry) {
    if (!geometry) return 0;
    return Math.max(0.5, Math.abs(geometry.trueValue) * 0.1);
}

/**
 * Check whether a drop is within tolerance. Returns:
 *   { ok, magnitude, expected, tolerance, error, direction }
 * where `direction` is 'too-short' | 'too-long' | 'wrong-direction' | 'ok'.
 *
 * The student's drop is in the wrong direction when the signed magnitude has
 * the opposite sign to trueValue (and trueValue is non-trivially nonzero).
 */
export function evaluateDrop(geometry, projection) {
    if (!geometry || !projection) {
        return { ok: false, direction: 'invalid', magnitude: 0, expected: 0, tolerance: 0, error: 0 };
    }
    const expected = geometry.trueValue;
    const expectedAbs = Math.abs(expected);
    const tolerance = getDragTolerance(geometry);
    const got = projection.magnitude;

    // Wrong direction: signs disagree (and the true component is nontrivial).
    if (Math.abs(expected) > 0.05 && Math.sign(got) !== Math.sign(expected) && Math.abs(got) > 0.5) {
        return {
            ok: false,
            direction: 'wrong-direction',
            magnitude: got,
            expected,
            tolerance,
            error: Math.abs(got - expected)
        };
    }

    const error = Math.abs(Math.abs(got) - expectedAbs);
    if (error <= tolerance) {
        return { ok: true, direction: 'ok', magnitude: got, expected, tolerance, error };
    }
    return {
        ok: false,
        direction: Math.abs(got) < expectedAbs ? 'too-short' : 'too-long',
        magnitude: got,
        expected,
        tolerance,
        error
    };
}

/**
 * Build the ghost-arrow payload the canvas overlay reads during a drag.
 * Returned shape:
 *   { fromX, fromY, toX, toY, magnitude, color }
 * Color reflects in-tolerance / out-of-tolerance / wrong-direction state so
 * students get continuous feedback as they drag.
 */
export function buildGhostArrow(geometry, projection) {
    if (!geometry || !projection) return null;
    const evaluation = evaluateDrop(geometry, projection);

    let color = '#94a3b8';                                  // neutral grey: too short / live drag
    if (evaluation.direction === 'wrong-direction') color = '#dc2626'; // red
    else if (evaluation.ok) color = '#10b981';              // green: in tolerance
    else if (evaluation.direction === 'too-long') color = '#f59e0b';   // amber: overshoot

    return {
        fromX: geometry.originX,
        fromY: geometry.originY,
        toX: projection.x,
        toY: projection.y,
        magnitude: projection.magnitude,
        color,
        evaluation
    };
}
