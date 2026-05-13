// =============================================================================
// Kinematics2dWalkthroughInteraction.js
// =============================================================================
// Prototype mixin for Module2DKinematics.  Owns everything related to the
// "Input Walkthrough" interaction loop:
//
//   • State creation and reset (workWalkthroughState, workSequenceState)
//   • Canvas pointer / keyboard event handlers (down, move, up, cancel, keydown)
//   • Hit-testing helpers (concept, formula, numeric-input, givens anchor)
//   • Givens-matching drag logic (start, record, auto-advance)
//   • Action dispatch (check, toggle, finalize, pick-formula, hint, answer,
//     skip, next, reset)
//   • Step advancement (_advanceWorkWalkthrough)
//   • Panel event binding (walkthrough + sequence panels)
//   • Preview / redraw helpers (renderWalkthroughStepPreview, requestCanvasRedraw)
//   • Export helpers (sanitize, download, exportWalkthroughStep, exportAll)
//
// Consumed by Kinematics2d.js via:
//   Object.assign(Module2DKinematics.prototype, walkthroughInteractionMethods);
// =============================================================================

import * as Kinematics2dWorkAnalysis from './Kinematics2dWorkAnalysis.js';
import { checkWalkthroughAnswer, getStepTasks } from './Kinematics2dWorkAnalysisWalkthrough.js';
import { formatExpectedValue, getTargetLabel, getTaskSignature } from './workAnalysis.js';
import { hitTestKeys } from './Kinematics2dHitRegions.js';
import { evaluateDrop, getDragGeometry, projectPointer } from './Kinematics2dVectorDecompose.js';

const walkthroughInteractionMethods = {

    // -------------------------------------------------------------------------
    // State factories
    // -------------------------------------------------------------------------

    createWorkWalkthroughState(overrides = {}) {
        return {
            stepIndex: 0,
            taskIndex: 0,
            answer: '',
            feedback: null,
            showHint: false,
            showAnswer: false,
            usedHint: false,
            usedShowAnswer: false,
            completedSteps: [],
            completedTasks: [],
            skipSuggestion: null,
            selection: [],
            lastClickedKey: null,
            lastFormulaPick: null,
            canvasInputActive: false,
            pendingGivenKey: null,
            pendingGivenTargetKey: null,
            givenDrag: null,
            dragInteraction: null,
            dragActiveTaskKey: null,
            ...overrides
        };
    },

    createWorkSequenceState(overrides = {}) {
        return {
            stepIndex: 0,
            ...overrides
        };
    },

    resetWorkWalkthroughState() {
        this.workWalkthroughState = this.createWorkWalkthroughState();
        this.workSequenceState = this.createWorkSequenceState();
    },

    getWorkWalkthroughState(steps) {
        if (!this.workWalkthroughState) {
            this.resetWorkWalkthroughState();
        }
        const maxIndex = Math.max(0, steps.length - 1);
        if (this.workWalkthroughState.stepIndex > maxIndex) {
            this.workWalkthroughState.stepIndex = maxIndex;
        }
        return this.workWalkthroughState;
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
    // Canvas pointer / keyboard events
    // -------------------------------------------------------------------------

    onWalkthroughCanvasPointerDown(ev) {
        if (this.inputs?.workAnalysisPanelMode !== 'Input Walkthrough') return;
        if (!this.latestModel) return;

        const steps = this.latestModel.workAnalysisSteps;
        if (!Array.isArray(steps) || !steps.length) return;

        const state = this.getWorkWalkthroughState(steps);
        const step = steps[state.stepIndex];
        const tasks = getStepTasks(step);
        const task = tasks[state.taskIndex || 0];
        if (!task) return;

        const point = this.getPointerPointOnCanvas(ev);
        if (!point) return;
        this.canvas?.focus?.();

        if (this.isGivensMatchingTask(step, task)) {
            this.handleGivensMatchingPointerDown(point, state, task, steps, ev);
            return;
        }

        if (task.kind === 'vector-decompose') {
            const dragPoint = this.getWalkthroughWorldPoint(point);
            const geometry = getDragGeometry(task, this.latestModel);
            if (!geometry) return;
            const dist = Math.hypot(dragPoint.x - geometry.originX, dragPoint.y - geometry.originY);
            if (dist > 60) return;

            const projection = projectPointer(geometry, dragPoint.x, dragPoint.y);
            const evaluation = evaluateDrop(geometry, projection);
            state.dragInteraction = { ...projection, direction: evaluation.direction, ok: evaluation.ok };
            state.dragActiveTaskKey = `${state.stepIndex}.${state.taskIndex}`;
            try { this.canvas.setPointerCapture?.(ev.pointerId); } catch { /* ignore */ }
            this.requestCanvasRedraw?.();
            return;
        }

        if (task.kind === 'formula-pick') {
            const formulaPick = this.findWalkthroughFormulaPickAtPoint(point);
            if (!formulaPick) return;
            this.handleWorkWalkthroughAction('pick-formula', steps, { equationId: formulaPick.equationId });
            return;
        }

        if (task.kind === 'numeric') {
            if (!this.findWalkthroughNumericInputAtPoint(point)) return;
            state.canvasInputActive = true;
            this.syncExternalPanels({ force: true });
            this.requestCanvasRedraw?.();
            return;
        }

        if (task.kind !== 'canvas-pick' && task.kind !== 'multi-select') return;

        const pool = task.kind === 'multi-select'
            ? (task.pool || [])
            : (task.pool || [task.target]);
        const key = this.getWalkthroughCanvasConceptAtPoint(point, pool, this.latestModel, step);
        if (!key) return;

        if (task.kind === 'canvas-pick') {
            state.lastClickedKey = key;
            this.handleWorkWalkthroughAction('check-canvas-pick', steps, { clickedKey: key });
        } else {
            const selection = new Set(state.selection || []);
            if (selection.has(key)) selection.delete(key); else selection.add(key);
            state.selection = [...selection];
            state.lastClickedKey = key;
            this.syncExternalPanels({ force: true });
            this.requestCanvasRedraw?.();
        }
    },

    onWalkthroughCanvasKeyDown(ev) {
        if (this.inputs?.workAnalysisPanelMode !== 'Input Walkthrough') return;
        if (!this.latestModel) return;

        const steps = this.latestModel.workAnalysisSteps;
        if (!Array.isArray(steps) || !steps.length) return;

        const state = this.getWorkWalkthroughState(steps);
        const step = steps[state.stepIndex];
        const tasks = getStepTasks(step);
        const task = tasks[state.taskIndex || 0];
        if (!task || task.kind !== 'numeric') return;

        const key = ev.key;
        const isInputKey = /^[0-9.+\-eE]$/.test(key);
        if (!isInputKey && key !== 'Backspace' && key !== 'Delete' && key !== 'Enter' && key !== 'Escape') return;

        ev.preventDefault();
        if (key === 'Enter') {
            this.handleWorkWalkthroughAction('check', steps);
            return;
        }
        if (key === 'Escape') {
            state.canvasInputActive = false;
        } else if (key === 'Backspace' || key === 'Delete') {
            state.answer = String(state.answer || '').slice(0, -1);
        } else {
            state.answer = `${state.answer || ''}${key}`;
        }

        const input = this.moduleExtension?.querySelector('#workWalkthroughAnswer');
        if (input) input.value = state.answer || '';
        state.feedback = null;
        this.syncExternalPanels({ force: true });
        this.requestCanvasRedraw?.();
    },

    onWalkthroughCanvasPointerMove(ev) {
        if (this.inputs?.workAnalysisPanelMode !== 'Input Walkthrough') return;
        if (!this.latestModel) return;
        const steps = this.latestModel.workAnalysisSteps;
        if (!Array.isArray(steps) || !steps.length) return;

        const state = this.getWorkWalkthroughState(steps);
        if (state.givenDrag) {
            const point = this.getPointerPointOnCanvas(ev);
            if (!point) return;
            state.givenDrag = { ...state.givenDrag, x: point.x, y: point.y };
            this.requestCanvasRedraw?.();
            return;
        }
        if (!state.dragInteraction) return;

        const expectedKey = `${state.stepIndex}.${state.taskIndex}`;
        if (state.dragActiveTaskKey !== expectedKey) return;

        const step = steps[state.stepIndex];
        const tasks = getStepTasks(step);
        const task = tasks[state.taskIndex || 0];
        if (!task || task.kind !== 'vector-decompose') return;

        const point = this.getPointerPointOnCanvas(ev);
        if (!point) return;
        const dragPoint = this.getWalkthroughWorldPoint(point);

        const geometry = getDragGeometry(task, this.latestModel);
        if (!geometry) return;

        const projection = projectPointer(geometry, dragPoint.x, dragPoint.y);
        const evaluation = evaluateDrop(geometry, projection);
        state.dragInteraction = { ...projection, direction: evaluation.direction, ok: evaluation.ok };

        // Do NOT call syncExternalPanels here — that rebuilds panel HTML on every
        // pointermove. The panel refreshes when the drag ends.
        this.requestCanvasRedraw?.();
    },

    onWalkthroughCanvasPointerUp(ev) {
        if (this.inputs?.workAnalysisPanelMode !== 'Input Walkthrough') return;
        if (!this.latestModel) return;
        const steps = this.latestModel.workAnalysisSteps;
        if (!Array.isArray(steps) || !steps.length) return;

        const state = this.getWorkWalkthroughState(steps);
        if (state.givenDrag) {
            const point = this.getPointerPointOnCanvas(ev);
            const sourceKey = state.givenDrag.key;
            const step = steps[state.stepIndex];
            const task = getStepTasks(step)[state.taskIndex || 0];
            const target = point ? this.findGivensTargetAtPoint(point, task) : null;
            state.givenDrag = null;
            try { this.canvas.releasePointerCapture?.(ev.pointerId); } catch { /* ignore */ }
            if (target) this.recordGivensMatch(sourceKey, target.key, state, steps);
            this.requestCanvasRedraw?.();
            this.syncExternalPanels({ force: true });
            return;
        }
        if (!state.dragInteraction) return;
        if (state.dragActiveTaskKey !== `${state.stepIndex}.${state.taskIndex}`) return;

        const projection = {
            x: state.dragInteraction.x,
            y: state.dragInteraction.y,
            magnitude: state.dragInteraction.magnitude,
            absMagnitude: Math.abs(state.dragInteraction.magnitude || 0)
        };
        try { this.canvas.releasePointerCapture?.(ev.pointerId); } catch { /* ignore */ }
        this.handleWorkWalkthroughAction('check-vector-decompose', steps, { projection });
    },

    onWalkthroughCanvasPointerCancel(ev) {
        const steps = this.latestModel?.workAnalysisSteps;
        if (!Array.isArray(steps) || !steps.length) return;
        const state = this.getWorkWalkthroughState(steps);
        if (state.givenDrag) {
            state.givenDrag = null;
            try { this.canvas.releasePointerCapture?.(ev.pointerId); } catch { /* ignore */ }
            this.requestCanvasRedraw?.();
            return;
        }
        if (!state.dragInteraction) return;
        state.dragInteraction = null;
        state.dragActiveTaskKey = null;
        try { this.canvas.releasePointerCapture?.(ev.pointerId); } catch { /* ignore */ }
        this.requestCanvasRedraw?.();
    },

    // -------------------------------------------------------------------------
    // Canvas pointer utilities
    // -------------------------------------------------------------------------

    getPointerPointOnCanvas(ev) {
        if (typeof this.getCanvasPointerPosition === 'function') {
            return this.getCanvasPointerPosition(ev);
        }
        const canvas = this.canvas;
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        // Account for CSS scaling — the canvas's internal coordinate space (width/height)
        // can differ from its rendered size on screen.
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: (ev.clientX - rect.left) * scaleX,
            y: (ev.clientY - rect.top) * scaleY
        };
    },

    findCanvasAnchorAtPoint(point, predicate, padding = 8) {
        const anchors = Array.from(this.canvasAnchors?.values() || []);
        const hits = anchors.filter(anchor => (
            predicate(anchor) && this.isPointInsideAnchor(point, anchor, padding)
        ));
        if (!hits.length) return null;
        hits.sort((a, b) => (b.width * b.height) - (a.width * a.height));
        return hits[0];
    },

    // -------------------------------------------------------------------------
    // Walkthrough hit-testing
    // -------------------------------------------------------------------------

    getWalkthroughCanvasConceptAtPoint(point, keys, model, step = this.activeWalkthroughStep) {
        const allowed = new Set(keys || []);
        const anchor = this.findCanvasAnchorAtPoint(point, item => {
            if (!item?.key || !allowed.has(item.key)) return false;
            return item.kind === 'problem-value'
                || item.kind === 'value'
                || item.kind === 'value-row'
                || item.kind === 'walkthrough-concept';
        }, 10);
        if (anchor?.key) return anchor.key;
        const worldPoint = this.getWalkthroughWorldPoint(point);
        const vectorBreakdownHit = this.hitTestVectorBreakdownConcept([...allowed], model, worldPoint, step);
        if (vectorBreakdownHit) return vectorBreakdownHit;
        return hitTestKeys([...allowed], model, worldPoint.x, worldPoint.y);
    },

    getWalkthroughWorldPoint(point) {
        const camera = this.latestModel?.vectorBreakdownCamera;
        if (!camera || !this.latestModel?.isInVectorBreakdown) return point;
        return {
            x: point.x + (camera.x || 0),
            y: point.y + (camera.y || 0)
        };
    },

    hitTestVectorBreakdownConcept(keys, model, point, step = this.activeWalkthroughStep) {
        if (!model?.isInVectorBreakdown || step?.id !== 'components') return null;
        if (!Array.isArray(keys) || !keys.length || !point) return null;

        const geometry = this.getInitialVectorBreakdownGeometry(model);
        const vectorScale = this.getVectorDrawingScale();
        const angleArcRadius = this.clamp(geometry.componentLength * 0.18, 34 * vectorScale, 58 * vectorScale);
        const hitPad = 26;
        let bestKey = null;
        let bestDist = Infinity;

        const consider = (key, dist) => {
            if (!Number.isFinite(dist) || dist > hitPad) return;
            if (dist < bestDist) { bestDist = dist; bestKey = key; }
        };

        for (const key of keys) {
            if (key === 'v0') {
                consider(key, this.distanceToPaddedSegment(
                    point.x, point.y,
                    geometry.anchorX, geometry.anchorY,
                    geometry.tipX, geometry.tipY, 14
                ));
            } else if (key === 'v0x') {
                consider(key, this.distanceToPaddedSegment(
                    point.x, point.y,
                    geometry.anchorX, geometry.anchorY,
                    geometry.projX, geometry.projY, 14
                ));
            } else if (key === 'v0y') {
                consider(key, this.distanceToPaddedSegment(
                    point.x, point.y,
                    geometry.projX, geometry.projY,
                    geometry.tipX, geometry.tipY, 14
                ));
            } else if (key === 'theta') {
                const dx = point.x - geometry.anchorX;
                const dy = point.y - geometry.anchorY;
                const radius = Math.hypot(dx, dy);
                const angleDeg = Math.atan2(-dy, dx) * 180 / Math.PI;
                const minAngle = Math.min(0, model.angleDeg || 0) - 12;
                const maxAngle = Math.max(0, model.angleDeg || 0) + 12;
                const inAngleWedge = angleDeg >= minAngle && angleDeg <= maxAngle;
                const nearArc = Math.abs(radius - angleArcRadius);
                const nearOrigin = Math.max(0, radius - (angleArcRadius + 20));
                consider(key, inAngleWedge ? Math.min(nearArc, nearOrigin) : Infinity);
            }
        }

        return bestKey;
    },

    distanceToPaddedSegment(x, y, x1, y1, x2, y2, padding = 0) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len2 = (dx * dx) + (dy * dy) || 1;
        const t = Math.max(0, Math.min(1, (((x - x1) * dx) + ((y - y1) * dy)) / len2));
        const px = x1 + (t * dx);
        const py = y1 + (t * dy);
        return Math.max(0, Math.hypot(x - px, y - py) - padding);
    },

    findWalkthroughFormulaPickAtPoint(point) {
        return this.findCanvasAnchorAtPoint(point, item => item.kind === 'walkthrough-formula' && item.equationId, 4);
    },

    findWalkthroughNumericInputAtPoint(point) {
        return this.findCanvasAnchorAtPoint(point, item => (
            item.kind === 'walkthrough-numeric-input' || item.kind === 'walkthrough-trig-value-box'
        ), 6);
    },

    // -------------------------------------------------------------------------
    // Givens matching
    // -------------------------------------------------------------------------

    isGivensMatchingTask(step, task) {
        return step?.id === 'givens' && task?.kind === 'multi-select';
    },

    findGivensSourceAtPoint(point, task) {
        const allowed = new Set(task?.pool || []);
        return this.findCanvasAnchorAtPoint(point, item => (
            item.kind === 'problem-value' && item.key && allowed.has(item.key)
        ), 8);
    },

    getGivenTargetKeyForAnchor(anchor) {
        if (!anchor) return null;
        if (anchor.kind === 'walkthrough-concept' && (anchor.key === 'v0' || anchor.key === 'theta')) {
            return anchor.key;
        }
        if (anchor.kind === 'value' || anchor.kind === 'value-row') {
            return this.getAxisValueGivenTarget(anchor.axis, anchor.key);
        }
        return null;
    },

    findGivensTargetAtPoint(point, task = null) {
        const allowed = new Set(task?.pool || []);
        const anchor = this.findCanvasAnchorAtPoint(point, item => {
            const key = this.getGivenTargetKeyForAnchor(item);
            if (!key) return false;
            return !allowed.size || allowed.has(key);
        }, 6);
        const key = this.getGivenTargetKeyForAnchor(anchor);
        return key ? { ...anchor, key } : null;
    },

    handleGivensMatchingPointerDown(point, state, task, steps, ev) {
        const source = this.findGivensSourceAtPoint(point, task);
        const target = this.findGivensTargetAtPoint(point, task);

        if (source) {
            if (state.pendingGivenTargetKey) {
                this.recordGivensMatch(source.key, state.pendingGivenTargetKey, state, steps);
                state.pendingGivenTargetKey = null;
                this.requestCanvasRedraw?.();
                this.syncExternalPanels({ force: true });
                return;
            }

            state.pendingGivenKey = source.key;
            state.lastClickedKey = source.key;
            state.givenDrag = {
                key: source.key,
                text: source.text || formatExpectedValue(source.key, this.latestModel) || getTargetLabel(source.key),
                x: point.x,
                y: point.y
            };
            state.feedback = null;
            try { this.canvas.setPointerCapture?.(ev.pointerId); } catch { /* ignore */ }
            this.requestCanvasRedraw?.();
            this.syncExternalPanels({ force: true });
            return;
        }

        if (target) {
            if (state.pendingGivenKey) {
                this.recordGivensMatch(state.pendingGivenKey, target.key, state, steps);
                state.pendingGivenKey = null;
            } else {
                state.pendingGivenTargetKey = target.key;
                state.feedback = null;
            }
            this.requestCanvasRedraw?.();
            this.syncExternalPanels({ force: true });
        }
    },

    recordGivensMatch(sourceKey, targetKey, state, steps) {
        if (!sourceKey || !targetKey) return;
        const selection = new Set(state.selection || []);
        if (sourceKey === targetKey) {
            selection.add(sourceKey);
            state.selection = [...selection];
            state.lastClickedKey = sourceKey;
            state.pendingGivenKey = null;
            state.pendingGivenTargetKey = null;
            state.feedback = null;
            this.maybeAutoAdvanceCompletedGivens(state, steps);
            return;
        }
        state.feedback = {
            ok: false,
            message: `${getTargetLabel(sourceKey)} does not belong in the ${getTargetLabel(targetKey)} box.`
        };
        const step = steps[state.stepIndex];
        const task = getStepTasks(step)[state.taskIndex || 0];
        const signature = getTaskSignature(task);
        this.proficiency.record(signature, { ok: false });
    },

    maybeAutoAdvanceCompletedGivens(state, steps) {
        const step = steps[state.stepIndex];
        const tasks = getStepTasks(step);
        const task = tasks[state.taskIndex || 0];
        if (!this.isGivensMatchingTask(step, task)) return false;

        const expected = new Set(task.expected || []);
        const selected = new Set(state.selection || []);
        if (!expected.size) return false;
        const complete = [...expected].every(key => selected.has(key));
        if (!complete) return false;

        const feedback = checkWalkthroughAnswer(step, state.selection || [], state.taskIndex || 0, this.latestModel);
        state.feedback = feedback;
        if (!feedback.ok) return false;

        const taskKey = `${state.stepIndex}.${state.taskIndex || 0}`;
        const signature = getTaskSignature(task);
        this.proficiency.record(signature, {
            ok: true,
            usedHint: state.usedHint,
            usedShowAnswer: state.usedShowAnswer
        });
        if (!state.completedTasks.includes(taskKey)) {
            state.completedTasks = [...state.completedTasks, taskKey];
        }
        if (signature && !state.completedTasks.includes(signature)) {
            state.completedTasks = [...state.completedTasks, signature];
        }

        window.setTimeout(() => {
            const latestState = this.getWorkWalkthroughState(steps);
            if (latestState.stepIndex !== state.stepIndex || latestState.taskIndex !== state.taskIndex) return;
            this._advanceWorkWalkthrough(latestState, steps, tasks);
            this.requestCanvasRedraw?.();
            this.syncExternalPanels({ force: true });
        }, 250);
        return true;
    },

    // -------------------------------------------------------------------------
    // Walkthrough canvas step / time helpers
    // -------------------------------------------------------------------------

    getWalkthroughPreviewModel() {
        return this.latestModel || this.computeProjectileModel(0);
    },

    getWalkthroughTaskFocusValues(step, task) {
        if (!task) return step?.focusValues || [];
        if (task.kind === 'multi-select') return task.pool || step?.focusValues || [];
        if (task.kind === 'canvas-pick') return task.pool || [task.target].filter(Boolean);
        if (task.kind === 'vector-decompose') {
            return task.target === 'v0y' ? ['v0', 'v0x', 'v0y'] : ['v0', 'theta', 'v0x'];
        }
        if (task.kind === 'formula-pick') {
            if (task.target === 'v0x') return ['v0', 'theta', 'v0x'];
            if (task.target === 'v0y') return ['v0', 'theta', 'v0y'];
            if (task.target === 'finalV') return ['vx', 'vy', 'finalV'];
            if (task.target === 'theta') return ['v0x', 'v0y', 'theta'];
            if (task.target === 'v0') return ['v0x', 'v0y', 'v0'];
            return [...(step?.focusValues || []), task.target].filter(Boolean);
        }
        if (task.kind === 'numeric') {
            return [...(step?.focusValues || []), task.target].filter(Boolean);
        }
        return step?.focusValues || [];
    },

    getWalkthroughCanvasStep(step, task) {
        if (!step) return null;
        if (this.isGivensMatchingTask(step, task)) {
            return { ...step, focusValues: [], resultValues: [], resultValue: null };
        }
        const focusValues = Array.from(new Set(this.getWalkthroughTaskFocusValues(step, task)));
        const resultValues = task?.target ? [task.target] : (step.resultValues || []);
        return {
            ...step,
            focusValues,
            resultValues,
            resultValue: resultValues[0] || step.resultValue || null
        };
    },

    getWalkthroughCanvasTime(step, task) {
        const baseModel = this.getWalkthroughPreviewModel();
        if (task?.kind === 'canvas-pick' || task?.kind === 'vector-decompose' || task?.kind === 'formula-pick') {
            const breakdown = Math.max(0, baseModel.breakdownDuration || this.vectorBreakdownDuration || 0);
            if ((step?.id === 'components' || task?.target === 'v0x' || task?.target === 'v0y') && breakdown > 0) {
                return breakdown * (task.kind === 'formula-pick' ? 0.9 : 0.72);
            }
        }
        return Kinematics2dWorkAnalysis.timeForStepAnchor(baseModel, step);
    },

    // -------------------------------------------------------------------------
    // Preview rendering
    // -------------------------------------------------------------------------

    renderWalkthroughStepPreview(step, task = null, state = null) {
        const canvasStep = this.getWalkthroughCanvasStep(step, task);
        const time = this.getWalkthroughCanvasTime(step, task);

        this.stopPreview();
        this.ctx.fillStyle = this.config.backgroundColor;
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.activeWalkthroughStep = canvasStep;
        this.activeWalkthroughTask = task;
        this.activeWalkthroughState = state;
        try {
            this.drawFrame(this.ctx, time);
        } finally {
            this.activeWalkthroughStep = null;
            this.activeWalkthroughTask = null;
            this.activeWalkthroughState = null;
        }
        this.syncExternalPanels({ force: true });
    },

    renderWorkWalkthroughStepPreview(steps) {
        const state = this.getWorkWalkthroughState(steps);
        const step = steps && steps.length ? steps[state.stepIndex] : null;
        const tasks = getStepTasks(step);
        const task = tasks[state.taskIndex || 0] || null;
        this.renderWalkthroughStepPreview(step, task, state);
    },

    renderWorkAnalysisSequenceStepPreview(steps) {
        const state = this.getWorkSequenceState(steps);
        const step = steps && steps.length ? steps[state.stepIndex] : null;
        this.renderWalkthroughStepPreview(step);
    },

    requestCanvasRedraw() {
        if (!this.ctx) return;

        let step = null;
        let task = null;
        let state = null;
        if (this.inputs?.workAnalysisPanelMode === 'Input Walkthrough') {
            const steps = this.latestModel?.workAnalysisSteps || [];
            state = this.getWorkWalkthroughState(steps);
            step = steps[state.stepIndex] || null;
            task = getStepTasks(step)[state.taskIndex || 0] || null;
        }

        const time = step ? this.getWalkthroughCanvasTime(step, task) : 0;
        const canvasStep = this.getWalkthroughCanvasStep(step, task);

        this.stopPreview();
        this.ctx.fillStyle = this.config.backgroundColor;
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.activeWalkthroughStep = canvasStep;
        this.activeWalkthroughTask = task;
        this.activeWalkthroughState = state;
        try {
            this.drawFrame(this.ctx, time);
        } finally {
            this.activeWalkthroughStep = null;
            this.activeWalkthroughTask = null;
            this.activeWalkthroughState = null;
        }
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
    },

    // -------------------------------------------------------------------------
    // Action dispatch
    // -------------------------------------------------------------------------

    handleWorkWalkthroughAction(action, steps, payload = {}) {
        const state = this.getWorkWalkthroughState(steps);
        const step = steps[state.stepIndex];
        const tasks = getStepTasks(step);
        const taskIndex = Math.max(0, Math.min(tasks.length - 1, state.taskIndex || 0));
        const task = tasks[taskIndex];
        const taskKey = `${state.stepIndex}.${taskIndex}`;
        const signature = getTaskSignature(task);
        const input = this.moduleExtension?.querySelector('#workWalkthroughAnswer');
        if (input) state.answer = input.value ?? state.answer ?? '';

        const recordOk = () => {
            this.proficiency.record(signature, {
                ok: true,
                usedHint: state.usedHint,
                usedShowAnswer: state.usedShowAnswer
            });
            if (!state.completedTasks.includes(taskKey)) {
                state.completedTasks = [...state.completedTasks, taskKey];
            }
            if (signature && !state.completedTasks.includes(signature)) {
                state.completedTasks = [...state.completedTasks, signature];
            }
        };

        if (action === 'check') {
            const feedback = checkWalkthroughAnswer(step, state.answer, taskIndex, this.latestModel);
            state.feedback = feedback;
            if (feedback.ok) recordOk();
            else this.proficiency.record(signature, { ok: false });

        } else if (action === 'check-canvas-pick') {
            const feedback = checkWalkthroughAnswer(step, payload.clickedKey, taskIndex, this.latestModel);
            state.feedback = feedback;
            if (feedback.ok) recordOk();
            else this.proficiency.record(signature, { ok: false });

        } else if (action === 'toggle') {
            const selection = new Set(state.selection || []);
            if (selection.has(payload.key)) selection.delete(payload.key);
            else selection.add(payload.key);
            state.selection = [...selection];

        } else if (action === 'finalize') {
            const feedback = checkWalkthroughAnswer(step, state.selection || [], taskIndex, this.latestModel);
            state.feedback = feedback;
            if (feedback.ok) recordOk();
            else this.proficiency.record(signature, { ok: false });

        } else if (action === 'pick-formula') {
            state.lastFormulaPick = payload.equationId;
            const feedback = checkWalkthroughAnswer(step, payload.equationId, taskIndex, this.latestModel);
            state.feedback = feedback;
            if (feedback.ok) recordOk();
            else this.proficiency.record(signature, { ok: false });

        } else if (action === 'check-vector-decompose') {
            const feedback = checkWalkthroughAnswer(step, payload.projection, taskIndex, this.latestModel);
            state.feedback = feedback;
            if (feedback.ok) recordOk();
            else this.proficiency.record(signature, { ok: false });
            state.dragInteraction = null;
            state.dragActiveTaskKey = null;

        } else if (action === 'hint') {
            state.showHint = true;
            state.usedHint = true;

        } else if (action === 'answer') {
            state.showAnswer = true;
            state.usedShowAnswer = true;
            state.feedback = { ok: true, message: 'Answer shown. Move on when ready.' };
            if (!state.completedTasks.includes(taskKey)) {
                state.completedTasks = [...state.completedTasks, taskKey];
            }
            this.proficiency.record(signature, { ok: false, usedShowAnswer: true });

        } else if (action === 'skip') {
            this.proficiency.recordSkip(signature);
            if (!state.completedTasks.includes(taskKey)) {
                state.completedTasks = [...state.completedTasks, taskKey];
            }
            this._advanceWorkWalkthrough(state, steps, tasks);
            this.requestCanvasRedraw?.();
            this.syncExternalPanels({ force: true });
            return;

        } else if (action === 'next') {
            const canAdvance = state.feedback?.ok || state.showAnswer || task.kind === 'acknowledge';
            if (!canAdvance) {
                this.syncExternalPanels({ force: true });
                return;
            }
            this._advanceWorkWalkthrough(state, steps, tasks);
            this.requestCanvasRedraw?.();
            this.syncExternalPanels({ force: true });
            return;

        } else if (action === 'reset') {
            this.resetWorkWalkthroughState();
            this.renderWorkWalkthroughStepPreview(steps);
            return;
        }

        this.requestCanvasRedraw?.();
        this.syncExternalPanels({ force: true });
    },

    _advanceWorkWalkthrough(state, steps, tasksOfCurrentStep) {
        const isLastTask = state.taskIndex >= tasksOfCurrentStep.length - 1;
        const isLastStep = state.stepIndex >= steps.length - 1;

        if (!isLastTask) {
            state.taskIndex += 1;
            state.answer = '';
            state.feedback = null;
            state.showHint = false;
            state.showAnswer = false;
            state.usedHint = false;
            state.usedShowAnswer = false;
            state.selection = [];
            state.lastFormulaPick = null;
            state.lastClickedKey = null;
            state.canvasInputActive = false;
            state.pendingGivenKey = null;
            state.pendingGivenTargetKey = null;
            state.givenDrag = null;
            state.dragInteraction = null;
            state.dragActiveTaskKey = null;
            return;
        }

        if (!state.completedSteps.includes(state.stepIndex)) {
            state.completedSteps = [...state.completedSteps, state.stepIndex];
        }

        if (!isLastStep) {
            this.workWalkthroughState = this.createWorkWalkthroughState({
                stepIndex: state.stepIndex + 1,
                completedSteps: state.completedSteps,
                completedTasks: state.completedTasks
            });
            this.renderWorkWalkthroughStepPreview(steps);
        } else {
            state.feedback = { ok: true, message: 'Walkthrough complete.' };
        }
    },

    // -------------------------------------------------------------------------
    // Panel event binding
    // -------------------------------------------------------------------------

    bindWorkWalkthroughPanelEvents(steps) {
        if (!this.moduleExtension) return;

        const input = this.moduleExtension.querySelector('#workWalkthroughAnswer');
        input?.addEventListener('input', (event) => {
            const state = this.getWorkWalkthroughState(steps);
            state.answer = event.target.value;
        });
        input?.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            this.handleWorkWalkthroughAction('check', steps);
        });

        this.moduleExtension.querySelectorAll('[data-work-action]').forEach((button) => {
            button.addEventListener('click', () => {
                this.handleWorkWalkthroughAction(button.dataset.workAction, steps);
            });
        });

        this.moduleExtension.querySelectorAll('[data-work-pick-formula]').forEach((button) => {
            button.addEventListener('click', () => {
                this.handleWorkWalkthroughAction('pick-formula', steps, {
                    equationId: button.dataset.workPickFormula
                });
            });
        });

        this.moduleExtension.querySelectorAll('[data-work-toggle]').forEach((button) => {
            button.addEventListener('click', () => {
                this.handleWorkWalkthroughAction('toggle', steps, { key: button.dataset.workToggle });
            });
        });

        this.moduleExtension.querySelectorAll('[data-work-export]').forEach((button) => {
            button.addEventListener('click', async () => {
                const state = this.getWorkWalkthroughState(steps);
                button.disabled = true;
                try {
                    await this.exportWalkthroughStep(steps, state.stepIndex, button.dataset.workExport);
                } finally {
                    button.disabled = false;
                }
            });
        });

        this.moduleExtension.querySelectorAll('[data-work-export-all]').forEach((button) => {
            button.addEventListener('click', async () => {
                button.disabled = true;
                try {
                    await this.exportAllWalkthroughSteps(steps, button.dataset.workExportAll);
                } finally {
                    button.disabled = false;
                }
            });
        });
    },

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
    }
};

export default walkthroughInteractionMethods;
