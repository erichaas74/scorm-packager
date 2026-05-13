import { renderWorkAnalysisStepBreakdown } from './Kinematics2dWorkAnalysisPanels.js';
import {
    formatExpectedValue,
    getDefaultTasksForStep,
    getEquationsForPicker,
    getPickerLabel,
    getTargetLabel,
    getTaskSignature,
    resolveExpectedValue,
    SPECIAL_EQUATIONS
} from './workAnalysis.js';
import { evaluateDrop, getDragGeometry, getDragTolerance } from './Kinematics2dVectorDecompose.js';

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function extractNumbers(value) {
    return String(value ?? '').match(/[-+]?\d*\.?\d+(?:e[-+]?\d+)?/gi)?.map(Number).filter(Number.isFinite) || [];
}

function getTolerance(expected) {
    if (!Number.isFinite(expected)) return 0;
    return Math.max(0.05, Math.abs(expected) * 0.02);
}

// -----------------------------------------------------------------------------
// Task-kind registry
// -----------------------------------------------------------------------------
// Each kind owns getPrompt + check. Adding a new kind (formula-pick,
// vector-decompose, assign-axis) is a one-entry change.
// -----------------------------------------------------------------------------

const taskKinds = {
    numeric: {
        getPrompt(task, model) {
            const expected = resolveExpectedValue(task.target, model);
            return {
                question: task.prompt || `Enter the value for ${getTargetLabel(task.target)}.`,
                expected: Number.isFinite(expected) ? expected : null,
                expectedText: formatExpectedValue(task.target, model),
                tolerance: Number.isFinite(expected) ? getTolerance(expected) : null,
                hint: task.hint || `Use the focus values to compute ${getTargetLabel(task.target)}.`
            };
        },
        check(task, rawAnswer, model) {
            const prompt = this.getPrompt(task, model);
            const answerText = String(rawAnswer ?? '').trim();
            if (!answerText) return { ok: false, message: 'Enter an answer first.' };
            if (!Number.isFinite(prompt.expected)) {
                return { ok: false, message: 'No numeric answer is configured for this task.' };
            }
            const userNumber = extractNumbers(answerText)[0];
            if (!Number.isFinite(userNumber)) {
                return { ok: false, message: 'Try entering the numerical value.' };
            }
            const error = Math.abs(userNumber - prompt.expected);
            if (error <= prompt.tolerance) {
                return { ok: true, message: `Correct. Expected about ${prompt.expected.toFixed(2)}.` };
            }
            return {
                ok: false,
                message: userNumber > prompt.expected
                    ? 'Close check: your value is too high.'
                    : 'Close check: your value is too low.'
            };
        }
    },

    acknowledge: {
        getPrompt(task) {
            return {
                question: task.prompt || 'Review this step, then continue when ready.',
                expected: null,
                expectedText: '',
                tolerance: null,
                hint: task.hint || 'Read the equations and continue.'
            };
        },
        check() {
            return { ok: true, message: 'Acknowledged.' };
        }
    },

    'canvas-pick': {
        getPrompt(task) {
            return {
                question: task.prompt || `Click the ${getTargetLabel(task.target)} on the canvas.`,
                expected: task.target,
                expectedText: getTargetLabel(task.target),
                tolerance: null,
                hint: task.hint || `Look for the highlighted ${getTargetLabel(task.target)} on the diagram.`,
                kind: 'canvas-pick',
                target: task.target,
                pool: task.pool || [task.target]
            };
        },
        // rawAnswer here is the focus key produced by hitTestKeys() in
        // Kinematics2d.js after a canvas click.
        check(task, clickedKey) {
            const got = String(clickedKey ?? '').trim();
            if (!got) return { ok: false, message: 'Click a labeled element on the canvas.' };
            if (got === task.target) {
                return { ok: true, message: `Correct — that's ${getTargetLabel(task.target)}.` };
            }
            return {
                ok: false,
                message: `That's ${getTargetLabel(got)}. Try clicking the ${getTargetLabel(task.target)} instead.`
            };
        }
    },

    'multi-select': {
        getPrompt(task) {
            const expected = Array.isArray(task.expected) ? task.expected : [];
            return {
                question: task.prompt || 'Select every quantity given in the problem.',
                expected,
                expectedText: expected.map(getTargetLabel).join(', '),
                tolerance: null,
                hint: task.hint || 'Re-read the problem and tag each value the student is told.',
                kind: 'multi-select',
                pool: task.pool || expected
            };
        },
        // rawAnswer here is the array of currently-selected keys.
        check(task, rawAnswer) {
            const selected = new Set(Array.isArray(rawAnswer) ? rawAnswer : []);
            const expected = new Set(Array.isArray(task.expected) ? task.expected : []);

            if (!selected.size) return { ok: false, message: 'Select at least one item.' };

            const missing = [...expected].filter(k => !selected.has(k));
            const extra = [...selected].filter(k => !expected.has(k));

            if (!missing.length && !extra.length) {
                return { ok: true, message: 'Correct — every given identified.' };
            }
            const fragments = [];
            if (missing.length) fragments.push(`missing: ${missing.map(getTargetLabel).join(', ')}`);
            if (extra.length) fragments.push(`shouldn't be selected: ${extra.map(getTargetLabel).join(', ')}`);
            return { ok: false, message: `Not quite — ${fragments.join(' · ')}.` };
        }
    },

    'formula-pick': {
        getPrompt(task) {
            const pickerKind = task.pickerKind || 'kinematic';
            const equationIds = Array.isArray(task.equationIds) ? new Set(task.equationIds) : null;
            const equations = getEquationsForPicker(pickerKind)
                .filter(eq => !equationIds || equationIds.has(eq.id));
            const expected = task.expectedEquationId;
            const isSpecial = !equations.find(eq => eq.id === expected);
            const expectedLabel = isSpecial
                ? (SPECIAL_EQUATIONS[expected]?.label || expected)
                : equations.find(eq => eq.id === expected)?.label;
            return {
                question: task.prompt || `Which ${getPickerLabel(pickerKind)} applies to this step?`,
                expected: isSpecial ? 'none' : expected,
                expectedText: expectedLabel || '',
                tolerance: null,
                hint: isSpecial
                    ? (SPECIAL_EQUATIONS[expected]?.reason || `None of the listed ${getPickerLabel(pickerKind)}s applies here.`)
                    : (pickerKind === 'vector-triangle'
                        ? 'Which side of the triangle do you have, and which do you need? Pick the equation that connects them.'
                        : 'Identify the variables you have (vi, a, t, Δx, vf) and pick the equation that contains exactly those plus your unknown.'),
                kind: 'formula-pick',
                pickerKind,
                equations,
                isSpecial,
                specialId: isSpecial ? expected : null
            };
        },
        // rawAnswer is the equation id the student clicked, or 'none'.
        check(task, rawAnswer) {
            const got = String(rawAnswer ?? '').trim();
            if (!got) return { ok: false, message: 'Click one of the equations.' };

            const pickerKind = task.pickerKind || 'kinematic';
            const equations = getEquationsForPicker(pickerKind);
            const expectedId = task.expectedEquationId;
            const isSpecial = !equations.find(eq => eq.id === expectedId);

            if (isSpecial) {
                if (got === 'none') {
                    const label = SPECIAL_EQUATIONS[expectedId]?.label;
                    return { ok: true, message: label ? `Correct — ${label}.` : 'Correct — none of the listed equations applies.' };
                }
                const reason = SPECIAL_EQUATIONS[expectedId]?.reason
                    || `None of the listed ${getPickerLabel(pickerKind)}s applies here.`;
                return { ok: false, message: `Not quite — ${reason}` };
            }

            if (got === expectedId) {
                return { ok: true, message: 'Correct equation.' };
            }

            const correct = equations.find(eq => eq.id === expectedId);
            const picked = equations.find(eq => eq.id === got);
            if (got === 'none') {
                return { ok: false, message: `One of the listed equations does apply: ${correct?.label}.` };
            }
            return {
                ok: false,
                message: `${picked?.label || 'That equation'} doesn't fit here. Try ${correct?.label}.`
            };
        }
    },

    'vector-decompose': {
        getPrompt(task, model) {
            const geometry = getDragGeometry(task, model);
            const expectedAbs = geometry ? Math.abs(geometry.trueValue) : null;
            const tolerance = geometry ? getDragTolerance(geometry) : null;
            const axisName = geometry?.axis === 'horizontal' ? 'horizontal' : 'vertical';
            return {
                question: task.prompt
                    || `Drag the ${axisName} component arrow until its length equals ${getTargetLabel(task.target)}.`,
                expected: expectedAbs,
                expectedText: Number.isFinite(expectedAbs) ? `${expectedAbs.toFixed(2)} m/s` : '',
                tolerance,
                hint: task.hint
                    || `Pull along the ${axisName} axis only — the constraint is locked. Watch the readout.`,
                kind: 'vector-decompose',
                axis: geometry?.axis || null,
                geometry
            };
        },
        // rawAnswer is the projection object produced by the drag controller
        // at pointer-up, matching the shape returned by projectPointer().
        check(task, rawAnswer, model) {
            const geometry = getDragGeometry(task, model);
            if (!geometry) return { ok: false, message: 'Drag setup unavailable for this task.' };
            if (!rawAnswer || typeof rawAnswer !== 'object') {
                return { ok: false, message: 'Drag the component arrow before releasing.' };
            }

            const evaluation = evaluateDrop(geometry, rawAnswer);
            const expectedAbs = Math.abs(geometry.trueValue);

            if (evaluation.ok) {
                return {
                    ok: true,
                    message: `Within tolerance — ${evaluation.magnitude.toFixed(2)} m/s vs ${expectedAbs.toFixed(2)} m/s expected.`
                };
            }
            if (evaluation.direction === 'wrong-direction') {
                return {
                    ok: false,
                    message: `Drag in the other direction along the ${geometry.axis} axis.`
                };
            }
            if (evaluation.direction === 'too-short') {
                return {
                    ok: false,
                    message: `Too short — got ${evaluation.magnitude.toFixed(2)} m/s, target ${expectedAbs.toFixed(2)} m/s.`
                };
            }
            if (evaluation.direction === 'too-long') {
                return {
                    ok: false,
                    message: `Too long — got ${evaluation.magnitude.toFixed(2)} m/s, target ${expectedAbs.toFixed(2)} m/s.`
                };
            }
            return { ok: false, message: 'Drop was outside tolerance — try again.' };
        }
    }
};

function getTaskKind(task) {
    return taskKinds[task?.kind] || taskKinds.numeric;
}

// -----------------------------------------------------------------------------
// Per-step task list
// -----------------------------------------------------------------------------

export function getStepTasks(step) {
    return getDefaultTasksForStep(step);
}

export function getCurrentTask(step, taskIndex = 0) {
    const tasks = getStepTasks(step);
    const safeIndex = Math.max(0, Math.min(tasks.length - 1, taskIndex || 0));
    return { task: tasks[safeIndex] || null, taskIndex: safeIndex, taskCount: tasks.length };
}

// -----------------------------------------------------------------------------
// Public API used by Kinematics2d.js
// -----------------------------------------------------------------------------

export function getWalkthroughPrompt(step, taskIndexOrModel = 0, maybeModel = null) {
    let taskIndex = 0;
    let model = null;
    if (typeof taskIndexOrModel === 'number') {
        taskIndex = taskIndexOrModel;
        model = maybeModel;
    } else if (taskIndexOrModel && typeof taskIndexOrModel === 'object') {
        model = taskIndexOrModel;
    }

    const { task } = getCurrentTask(step, taskIndex);
    if (!task) {
        return { question: 'No task configured.', expected: null, expectedText: '', tolerance: null, hint: '' };
    }
    return getTaskKind(task).getPrompt(task, model);
}

export function checkWalkthroughAnswer(step, rawAnswer, taskIndex = 0, model = null) {
    const { task } = getCurrentTask(step, taskIndex);
    if (!task) return { ok: false, message: 'No task configured for this step.' };
    return getTaskKind(task).check(task, rawAnswer, model);
}

export function getCurrentTaskSignature(step, taskIndex = 0) {
    const { task } = getCurrentTask(step, taskIndex);
    return task ? getTaskSignature(task) : null;
}

// -----------------------------------------------------------------------------
// Card grid for non-active steps
// -----------------------------------------------------------------------------

function renderStepCards(steps, state) {
    return `
        <div class="module-extension__grid module-extension__grid--steps">
            ${steps.map((step, index) => {
                const isActive = state.stepIndex === index;
                const isDone = state.completedSteps?.includes(index);
                const classes = [
                    'module-extension__card',
                    'module-extension__card--step',
                    isActive ? 'module-extension__card--active-step' : '',
                    isDone ? 'module-extension__card--completed-step' : ''
                ].filter(Boolean).join(' ');

                return `
                    <section class="${classes}" style="--step-accent:${step.accent};">
                        <h4 style="color:${step.accent};">${escapeHtml(step.title)}</h4>
                        <p class="module-extension__line"><strong>Focus</strong> = ${escapeHtml(step.focusLabel)}</p>
                        ${step.lines.map(line => `<p class="module-extension__line">${escapeHtml(line)}</p>`).join('')}
                    </section>
                `;
            }).join('')}
        </div>
    `;
}

function renderTaskPills(tasks, state) {
    if (tasks.length <= 1) return '';
    const completedKeys = new Set(state.completedTasks || []);
    return `
        <div class="module-extension__task-pills" style="display:flex;gap:6px;margin:8px 0 4px;">
            ${tasks.map((task, index) => {
                const sig = getTaskSignature(task);
                const isDone = completedKeys.has(`${state.stepIndex}.${index}`) || (sig && completedKeys.has(sig));
                const isActive = index === (state.taskIndex || 0);
                const opacity = isActive ? 1 : (isDone ? 0.85 : 0.45);
                const bg = isDone ? '#10b981' : (isActive ? 'var(--step-accent, #7c3aed)' : '#cbd5e1');
                return `<span class="module-extension__task-pill" style="display:inline-block;min-width:18px;height:18px;padding:0 6px;border-radius:999px;background:${bg};color:white;font-size:11px;line-height:18px;text-align:center;opacity:${opacity};">${index + 1}</span>`;
            }).join('')}
        </div>
    `;
}

function renderInteractiveBlock(task, prompt, state) {
    if (task.kind === 'vector-decompose') {
        const live = state.dragInteraction;
        const liveLine = live
            ? `Currently: ${live.magnitude >= 0 ? '+' : ''}${live.magnitude.toFixed(2)} m/s ${live.direction === 'ok' ? '✓ in range' : live.direction === 'wrong-direction' ? '✗ wrong direction' : live.direction === 'too-long' ? '↑ too long' : '↓ too short'}`
            : 'Press and drag the component arrow on the canvas.';
        const expected = Number.isFinite(prompt.expected) ? `${prompt.expected.toFixed(2)} m/s` : '?';
        const tol = Number.isFinite(prompt.tolerance) ? `±${prompt.tolerance.toFixed(2)} m/s` : '';
        return `
            <div class="module-extension__vector-decompose" style="margin:6px 0 4px;padding:8px 10px;border-radius:6px;background:#f8fafc;border:1px solid #e2e8f0;">
                <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#64748b;margin-bottom:4px;">Drag the ${task.target === 'v0x' ? 'horizontal' : 'vertical'} component</div>
                <div style="font-family:'JetBrains Mono','SF Mono',monospace;font-size:13px;color:#0f172a;">${escapeHtml(liveLine)}</div>
                <div style="font-size:11px;color:#64748b;margin-top:4px;">Target: ${escapeHtml(expected)} ${escapeHtml(tol)}</div>
            </div>
        `;
    }

    if (task.kind === 'formula-pick') {
        const equations = prompt.equations || getEquationsForPicker(task.pickerKind || 'kinematic');
        const lastPick = state.lastFormulaPick || null;
        const headerLabel = task.pickerKind === 'vector-triangle' ? 'Triangle equations' : 'Kinematic equations';
        const noneButton = task.hideNoneOption ? '' : `
                <button type="button"
                    class="module-extension__formula-chip"
                    data-work-pick-formula="none"
                    style="padding:6px 12px;border-radius:6px;border:1px dashed #94a3b8;background:${lastPick === 'none' ? 'var(--step-accent, #7c3aed)' : 'transparent'};color:${lastPick === 'none' ? 'white' : '#475569'};font-size:12px;cursor:pointer;font-style:italic;text-align:left;">
                    None of these
                </button>`;
        return `
            <div class="module-extension__formula-pick" style="display:flex;flex-direction:column;gap:6px;margin:6px 0 4px;">
                <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#64748b;">${escapeHtml(headerLabel)}</div>
                ${equations.map(eq => {
                    const isPicked = lastPick === eq.id;
                    const bg = isPicked ? 'var(--step-accent, #7c3aed)' : '#f1f5f9';
                    const color = isPicked ? 'white' : '#0f172a';
                    return `<button type="button"
                        class="module-extension__formula-chip"
                        data-work-pick-formula="${escapeHtml(eq.id)}"
                        title="${escapeHtml(eq.description || '')}"
                        style="padding:8px 12px;border-radius:6px;border:1px solid ${isPicked ? 'transparent' : '#cbd5e1'};background:${bg};color:${color};font-size:13px;font-family:'JetBrains Mono','SF Mono',monospace;text-align:left;cursor:pointer;">
                        ${escapeHtml(eq.label)}
                    </button>`;
                }).join('')}
                ${noneButton}
            </div>
        `;
    }

    if (task.kind === 'multi-select') {
        const pool = Array.isArray(prompt.pool) ? prompt.pool : [];
        const selection = new Set(Array.isArray(state.selection) ? state.selection : []);
        if (!pool.length) return '';
        return `
            <div class="module-extension__multi-select" style="display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 4px;">
                ${pool.map(key => {
                    const isSelected = selection.has(key);
                    const bg = isSelected ? 'var(--step-accent, #7c3aed)' : '#e2e8f0';
                    const color = isSelected ? 'white' : '#0f172a';
                    return `<button type="button"
                        class="module-extension__chip"
                        data-work-toggle="${escapeHtml(key)}"
                        style="padding:4px 10px;border-radius:999px;border:1px solid ${isSelected ? 'transparent' : '#cbd5e1'};background:${bg};color:${color};font-size:12px;cursor:pointer;">
                        ${escapeHtml(getTargetLabel(key))}
                    </button>`;
                }).join('')}
            </div>
        `;
    }

    if (task.kind === 'canvas-pick') {
        const lastClicked = state.lastClickedKey
            ? `<span style="opacity:0.7;">Last click: ${escapeHtml(getTargetLabel(state.lastClickedKey))}</span>`
            : '<span style="opacity:0.5;">Awaiting click on the canvas…</span>';
        return `<div class="module-extension__canvas-pick" style="margin:6px 0 4px;font-size:12px;color:#475569;">${lastClicked}</div>`;
    }

    return '';
}

export function buildInputWalkthroughPanel({ model, problemType, steps, state }) {
    if (!steps.length) return '';

    const stepIndex = Math.max(0, Math.min(steps.length - 1, state.stepIndex || 0));
    const step = steps[stepIndex];
    const tasks = getStepTasks(step);
    const taskIndex = Math.max(0, Math.min(tasks.length - 1, state.taskIndex || 0));
    const task = tasks[taskIndex];
    const prompt = getTaskKind(task).getPrompt(task, model);
    const feedbackClass = state.feedback?.ok
        ? 'module-extension__walkthrough-feedback--ok'
        : 'module-extension__walkthrough-feedback--error';
    const isInteractive = task.kind === 'canvas-pick' || task.kind === 'multi-select' || task.kind === 'formula-pick' || task.kind === 'vector-decompose';
    const canAdvance = Boolean(state.feedback?.ok || state.showAnswer || task.kind === 'acknowledge');
    const isLastTask = taskIndex >= tasks.length - 1;
    const isLastStep = stepIndex >= steps.length - 1;
    const nextLabel = (isLastStep && isLastTask) ? 'Finish' : (isLastTask ? 'Next Step' : 'Next Task');

    const skipBanner = state.skipSuggestion
        ? `<div class="module-extension__walkthrough-skip" style="margin:8px 0;padding:8px 10px;border-radius:6px;background:#ecfdf5;border:1px solid #10b981;font-size:13px;">
               <strong>Already proficient.</strong> ${escapeHtml(state.skipSuggestion.reason || 'You can skip this task.')}
               <button class="module-extension__walkthrough-btn" data-work-action="skip" type="button" style="margin-left:8px;">Skip Task</button>
           </div>`
        : '';

    const interactiveBlock = renderInteractiveBlock(task, prompt, state);
    const inputBlock = (task.kind === 'numeric')
        ? `<div class="module-extension__walkthrough-input-row">
               <input id="workWalkthroughAnswer" class="module-extension__walkthrough-input" type="text" value="${escapeHtml(state.answer || '')}" autocomplete="off" placeholder="Type your answer">
               <button class="module-extension__walkthrough-btn module-extension__walkthrough-btn--primary" data-work-action="check" type="button">Check</button>
           </div>`
        : '';

    return `
        <div class="module-extension__header">
            <div>
                <div class="module-extension__title">Input Walkthrough</div>
                <div class="module-extension__subtitle">${escapeHtml(problemType.title)}</div>
            </div>
            <div class="module-extension__subtitle">Step ${stepIndex + 1} / ${steps.length}${tasks.length > 1 ? ` · Task ${taskIndex + 1} / ${tasks.length}` : ''}</div>
        </div>
        <div class="module-extension__sequence-stack">
            <section class="module-extension__card module-extension__card--current-step" style="--step-accent:${step.accent};">
                <div class="module-extension__current-label">Answer To Continue</div>
                <h4 style="color:${step.accent};">${escapeHtml(step.title)}</h4>
                <p class="module-extension__line module-extension__line--focus" style="--step-accent:${step.accent};"><strong>Focus</strong> = ${escapeHtml(step.focusLabel)}</p>
                ${renderWorkAnalysisStepBreakdown({
                    step,
                    model,
                    state: { step, progress: 1, lineCount: step.lines.length }
                })}
                ${renderTaskPills(tasks, { ...state, taskIndex, stepIndex })}
                ${skipBanner}
                <label class="module-extension__walkthrough-question">${escapeHtml(prompt.question)}</label>
                ${interactiveBlock}
                ${inputBlock}
                ${state.feedback ? `<div class="module-extension__walkthrough-feedback ${feedbackClass}">${escapeHtml(state.feedback.message)}</div>` : ''}
                ${state.showHint ? `<div class="module-extension__walkthrough-hint"><strong>Hint</strong> ${escapeHtml(prompt.hint)}</div>` : ''}
                ${state.showAnswer && prompt.expectedText ? `<div class="module-extension__walkthrough-answer"><strong>Answer</strong> ${escapeHtml(prompt.expectedText)}</div>` : ''}
                <div class="module-extension__walkthrough-actions">
                    <button class="module-extension__walkthrough-btn" data-work-action="hint" type="button">Hint</button>
                    <button class="module-extension__walkthrough-btn" data-work-action="answer" type="button">Show Answer</button>
                    ${task.kind === 'multi-select' ? `<button class="module-extension__walkthrough-btn module-extension__walkthrough-btn--primary" data-work-action="finalize" type="button">Done Selecting</button>` : ''}
                    <button class="module-extension__walkthrough-btn module-extension__walkthrough-btn--primary" data-work-action="next" type="button" ${canAdvance ? '' : 'disabled'}>${nextLabel}</button>
                    <button class="module-extension__walkthrough-btn" data-work-export="gif" type="button">Download Step GIF</button>
                    <button class="module-extension__walkthrough-btn" data-work-export="webm" type="button">Download Step WebM</button>
                    <button class="module-extension__walkthrough-btn" data-work-action="reset" type="button">Reset</button>
                </div>
                ${isInteractive ? `<div class="module-extension__walkthrough-help" style="margin-top:8px;font-size:12px;color:#64748b;">Tip: ${
                    task.kind === 'canvas-pick' ? 'click directly on the highlighted element on the canvas.'
                    : task.kind === 'formula-pick' ? 'pick the equation that contains exactly the variables you have plus your unknown.'
                    : task.kind === 'vector-decompose' ? 'press and hold on the canvas at the launch point, drag along the locked axis, and release when the readout matches.'
                    : 'tap each chip — or click the matching element on the canvas — then press Done Selecting.'
                }</div>` : ''}
            </section>
            ${renderStepCards(steps, { ...state, stepIndex })}
        </div>
    `;
}
