function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function getVisibleLineText(line, revealProgress = 1) {
    const text = String(line ?? '');
    if (revealProgress >= 1) return escapeHtml(text);

    const visibleLength = Math.max(0, Math.min(text.length, Math.ceil(text.length * revealProgress)));
    return `${escapeHtml(text.slice(0, visibleLength))}<span class="module-extension__cursor"></span>`;
}

function renderSequenceLine(line, index, state) {
    const isCurrent = index === state.lineCount - 1;
    const lineProgress = isCurrent
        ? Math.max(0.08, Math.min(1, ((state.progress || 0) * state.step.lines.length) - index))
        : 1;
    const isResultLine = Boolean(state.step.resultValue) && index === state.step.lines.length - 1;
    const classes = [
        'module-extension__line',
        'module-extension__line--revealed',
        isCurrent ? 'module-extension__line--active' : '',
        isResultLine ? 'module-extension__line--result' : ''
    ].filter(Boolean).join(' ');

    return `<p class="${classes}" style="--step-accent:${state.step.accent};">${getVisibleLineText(line, lineProgress)}</p>`;
}

function getEquationStages(step) {
    if (step.equation) {
        return [
            { role: 'formula', label: 'Formula', text: step.equation.formula },
            { role: 'substitution', label: 'Substitute', text: step.equation.substitution },
            { role: 'result', label: 'Result', text: step.equation.result }
        ].filter(stage => stage.text);
    }

    if (step.id === 'summary' || !Array.isArray(step.lines) || !step.lines.length) {
        return [];
    }

    return step.lines.map((line, index) => ({
        role: index === step.lines.length - 1 && step.resultValues?.length ? 'result' : 'equation',
        label: step.lines.length === 1 ? 'Equation' : `Equation ${index + 1}`,
        text: line
    }));
}

function renderEquationStage(stage, index, stages, state) {
    const stageProgress = (state.progress || 0) * stages.length;
    const revealProgress = Math.max(0, Math.min(1, stageProgress - index));
    const isVisible = index === 0 || revealProgress > 0;
    if (!isVisible) return '';

    const isActive = revealProgress > 0 && revealProgress < 1;
    const isResult = stage.role === 'result';
    const classes = [
        'module-extension__equation-stage',
        isActive ? 'module-extension__equation-stage--active' : '',
        isResult ? 'module-extension__equation-stage--result' : ''
    ].filter(Boolean).join(' ');

    return `
        <div class="${classes}" style="--step-accent:${state.step.accent};">
            <div class="module-extension__equation-label">${stage.label}</div>
            <div class="module-extension__equation-text">${getVisibleLineText(stage.text, revealProgress)}</div>
        </div>
    `;
}

function renderEquationFlow(state) {
    const stages = getEquationStages(state.step);
    if (!stages.length) return '';

    return `
        <div class="module-extension__step-breakdown-block">
            <div class="module-extension__breakdown-label">Equations</div>
            <div class="module-extension__equation-flow">
            ${stages.map((stage, index) => renderEquationStage(stage, index, stages, state)).join('')}
            </div>
        </div>
    `;
}

function getStepValueEntry(key, model) {
    const dy = model.yf - model.yi;
    const entries = {
        dx: { label: 'Δx', value: `${model.range.toFixed(2)} m` },
        dy: { label: 'Δy', value: `${dy.toFixed(2)} m` },
        hmax: { label: 'hₘₐₓ', value: `${(model.yPeak - model.yi).toFixed(2)} m` },
        v0: { label: 'v₀', value: `${model.vi.toFixed(2)} m/s` },
        v0x: { label: 'v₀x', value: `${model.vix.toFixed(2)} m/s` },
        v0y: { label: 'v₀ᵧ', value: `${model.viy.toFixed(2)} m/s` },
        vx: { label: 'vₓ', value: `${model.vix.toFixed(2)} m/s` },
        vy: { label: 'vᵧ', value: `${model.finalVy.toFixed(2)} m/s` },
        finalV: { label: 'v(final)', value: `${model.finalSpeed.toFixed(2)} m/s` },
        theta: { label: 'θ', value: `${model.angleDeg.toFixed(1)}°` },
        time: { label: 't', value: `${model.tFlight.toFixed(2)} s` },
        ay: { label: 'aᵧ', value: `-${model.g.toFixed(2)} m/s²` }
    };

    return entries[key] ? { key, ...entries[key] } : null;
}

function getStepValueEntries(step, model) {
    const orderedKeys = [...(step.focusValues || []), ...(step.resultValues || [])];
    const seen = new Set();

    return orderedKeys
        .filter(key => {
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        })
        .map(key => {
            const entry = getStepValueEntry(key, model);
            return entry ? { ...entry, isResult: (step.resultValues || []).includes(key) } : null;
        })
        .filter(Boolean);
}

function renderValueChip(entry, index, entries, state) {
    const stageProgress = (state.progress || 0) * entries.length;
    const revealProgress = state.progress >= 1 ? 1 : Math.max(0, Math.min(1, stageProgress - index));
    const isVisible = state.progress >= 1 || index === 0 || revealProgress > 0;
    if (!isVisible) return '';

    const isActive = revealProgress > 0 && revealProgress < 1;
    const classes = [
        'module-extension__value-chip',
        isActive ? 'module-extension__value-chip--active' : '',
        entry.isResult ? 'module-extension__value-chip--result' : ''
    ].filter(Boolean).join(' ');

    return `
        <div class="${classes}" style="--step-accent:${state.step.accent};">
            <div class="module-extension__value-key">${escapeHtml(entry.label)}</div>
            <div class="module-extension__value-text">${getVisibleLineText(entry.value, revealProgress || 1)}</div>
        </div>
    `;
}

function renderValueShowcase(step, model, state) {
    const entries = getStepValueEntries(step, model);
    if (!entries.length) return '';

    return `
        <div class="module-extension__step-breakdown-block">
            <div class="module-extension__breakdown-label">Values</div>
            <div class="module-extension__value-grid">
                ${entries.map((entry, index) => renderValueChip(entry, index, entries, state)).join('')}
            </div>
        </div>
    `;
}

export function renderWorkAnalysisStepBreakdown({ step, model, state }) {
    const equationFlow = renderEquationFlow(state);
    const valueShowcase = renderValueShowcase(step, model, state);

    if (!equationFlow && !valueShowcase) {
        return state.step.lines.map((line, index) => renderSequenceLine(line, index, state)).join('');
    }

    return `
        <div class="module-extension__step-breakdown">
            ${equationFlow}
            ${valueShowcase}
        </div>
    `;
}

function renderStepCards(steps, state = null) {
    return `
        <div class="module-extension__grid module-extension__grid--steps">
            ${steps.map((step, index) => {
                const isActive = state?.stepIndex === index;
                const classes = [
                    'module-extension__card',
                    'module-extension__card--step',
                    isActive ? 'module-extension__card--active-step' : ''
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

export function buildWorkAnalysisSequencePanel({ model, problemType, steps, state, manualState = null, showStepControls = false }) {
    if (!steps.length) return '';

    const resolvedState = manualState
        ? {
            step: steps[manualState.stepIndex] || steps[0],
            stepIndex: Math.max(0, Math.min(steps.length - 1, manualState.stepIndex || 0)),
            stepCount: steps.length,
            lineCount: (steps[manualState.stepIndex] || steps[0]).lines.length,
            progress: 1
        }
        : (state || (
            model.visualTime < model.breakdownDuration
                ? {
                    step: steps[0],
                    stepIndex: 0,
                    stepCount: steps.length,
                    lineCount: 1
                }
                : {
                    step: steps[steps.length - 1],
                    stepIndex: steps.length - 1,
                    stepCount: steps.length,
                    lineCount: steps[steps.length - 1].lines.length
                }
        ));
    const visibleLines = resolvedState.step.lines.slice(0, resolvedState.lineCount);
    const stepPills = steps.map((step, index) => {
        const tone = index === resolvedState.stepIndex ? step.accent : '#cbd5e1';
        return `<span style="display:inline-block;width:10px;height:10px;border-radius:999px;background:${tone};opacity:${index === resolvedState.stepIndex ? 1 : 0.72};"></span>`;
    }).join('');

    return `
        <div class="module-extension__header">
            <div>
                <div class="module-extension__title">Work Analysis Sequence</div>
                <div class="module-extension__subtitle">${problemType.title}</div>
            </div>
            <div class="module-extension__subtitle">Step ${resolvedState.stepIndex + 1} / ${resolvedState.stepCount}</div>
        </div>
        <div class="module-extension__sequence-stack">
            <section class="module-extension__card module-extension__card--current-step" style="--step-accent:${resolvedState.step.accent};">
                <div class="module-extension__current-label">Current Step</div>
                <h4 style="color:${resolvedState.step.accent};">${escapeHtml(resolvedState.step.title)}</h4>
                <p class="module-extension__line module-extension__line--focus" style="--step-accent:${resolvedState.step.accent};"><strong>Focus</strong> = ${escapeHtml(resolvedState.step.focusLabel)}</p>
                ${renderWorkAnalysisStepBreakdown({ step: resolvedState.step, model, state: resolvedState })}
                <div style="display:flex;gap:6px;margin-top:12px;">${stepPills}</div>
                ${showStepControls ? `
                    <div class="module-extension__walkthrough-actions">
                        <button class="module-extension__walkthrough-btn" data-work-sequence-action="prev" type="button" ${resolvedState.stepIndex <= 0 ? 'disabled' : ''}>Previous Step</button>
                        <button class="module-extension__walkthrough-btn module-extension__walkthrough-btn--primary" data-work-sequence-action="next" type="button" ${resolvedState.stepIndex >= steps.length - 1 ? 'disabled' : ''}>Next Step</button>
                        <button class="module-extension__walkthrough-btn" data-work-sequence-export="gif" type="button">Download Step GIF</button>
                        <button class="module-extension__walkthrough-btn" data-work-sequence-export="webm" type="button">Download Step WebM</button>
                        <button class="module-extension__walkthrough-btn" data-work-sequence-export-all="gif" type="button">Download All GIF Steps</button>
                        <button class="module-extension__walkthrough-btn" data-work-sequence-export-all="webm" type="button">Download All WebM Steps</button>
                        <button class="module-extension__walkthrough-btn" data-work-sequence-action="reset" type="button">Reset Steps</button>
                    </div>
                ` : ''}
            </section>
            ${renderStepCards(steps, resolvedState)}
        </div>
    `;
}

export function buildWorkAnalysisPanel({ model, problemType, steps }) {
    if (steps.length) {
        return `
            <div class="module-extension__header">
                <div>
                    <div class="module-extension__title">Work Analysis</div>
                    <div class="module-extension__subtitle">${problemType.title}</div>
                </div>
                <div class="module-extension__subtitle">${model.scenarioType}</div>
            </div>
            ${renderStepCards(steps)}
        `;
    }

    const dy = model.yf - model.yi;
    const dyValue = dy;
    const hmaxValue = model.yPeak - model.yi;
    const angleTerm = `${model.angleDeg.toFixed(0)}°`;

    return `
        <div class="module-extension__header">
            <div>
                <div class="module-extension__title">Work Analysis</div>
                <div class="module-extension__subtitle">${model.scenarioType}</div>
            </div>
            <div class="module-extension__subtitle">t = ${model.tFlight.toFixed(2)} s</div>
        </div>
        <div class="module-extension__grid">
            <section class="module-extension__card">
                <h4>Horizontal</h4>
                <p class="module-extension__line"><strong>v₀x</strong> = ${model.vi.toFixed(1)} cos(${angleTerm}) = ${model.vix.toFixed(2)} m/s</p>
                <p class="module-extension__line"><strong>aₓ</strong> = 0.00 m/s²</p>
                <p class="module-extension__line"><strong>Δx</strong> = v₀x t = ${model.vix.toFixed(2)} × ${model.tFlight.toFixed(2)} = ${model.range.toFixed(2)} m</p>
            </section>
            <section class="module-extension__card">
                <h4>Vertical</h4>
                <p class="module-extension__line"><strong>v₀y</strong> = ${model.vi.toFixed(1)} sin(${angleTerm}) = ${model.viy.toFixed(2)} m/s</p>
                <p class="module-extension__line"><strong>aᵧ</strong> = -${model.g.toFixed(2)} m/s²</p>
                <p class="module-extension__line"><strong>Δy</strong> = ${dyValue.toFixed(2)} m</p>
                <p class="module-extension__line"><strong>hₘₐₓ</strong> = ${hmaxValue.toFixed(2)} m</p>
                <p class="module-extension__line"><strong>vᵧ(final)</strong> = ${model.finalVy.toFixed(2)} m/s</p>
            </section>
            <section class="module-extension__card">
                <h4>Summary</h4>
                <p class="module-extension__line"><strong>Flight Time</strong> = ${model.tFlight.toFixed(2)} s</p>
                <p class="module-extension__line"><strong>Range</strong> = ${model.range.toFixed(2)} m</p>
                <p class="module-extension__line"><strong>Max Height</strong> = ${hmaxValue.toFixed(2)} m</p>
                <p class="module-extension__line"><strong>Final Speed</strong> = ${model.finalSpeed.toFixed(2)} m/s</p>
            </section>
        </div>
    `;
}
