const fs = require('fs');

const histSrc   = 'C:/Users/erich/AppData/Roaming/Code/User/History/c977463/8WSk.js';
const destPath  = 'c:/Users/erich/scorm-packager/physics-sim-hub/modules/Kinematics2d.js';
const sceneOut  = 'c:/Users/erich/scorm-packager/physics-sim-hub/modules/Kinematics2dSceneRenderer.js';
const uiOut     = 'c:/Users/erich/scorm-packager/physics-sim-hub/modules/Kinematics2dUIRenderer.js';

// ---------------------------------------------------------------------------
// Load source
// ---------------------------------------------------------------------------
let src = fs.readFileSync(histSrc, 'utf8');
console.log(`Loaded: ${src.split('\n').length} lines, ${src.length} chars`);

// ---------------------------------------------------------------------------
// Inject the 6 methods that were added after the last VSCode save.
// Insert them just before the closing } of the class so the extractor can
// find and remove them normally.
// ---------------------------------------------------------------------------
const injected = `
    drawLaunchGivenCallout(ctx, model) {
        if (!this.inputs.showLaunchCannon) return;
        if (model.scenarioType === "Moving Drop / Airplane") return;
        if (String(this.inputs.objectType || '').toLowerCase() === 'plane') return;
        if (Math.abs(model.angleDeg || 0) < 0.5) return;

        const uiScale = this.getCanvasTextScale();
        const boxW = 122 * uiScale;
        const boxH = 58 * uiScale;
        const viewportLeft = Number.isFinite(model.worldMinX) ? model.worldMinX : 0;
        const viewportRight = Number.isFinite(model.worldMaxX) ? model.worldMaxX : this.width;
        const viewportTop = Number.isFinite(model.worldMinY) ? model.worldMinY : 0;
        const x = this.clamp(model.startX + (30 * uiScale), viewportLeft + (12 * uiScale), viewportRight - boxW - (12 * uiScale));
        const y = Math.max(viewportTop + (12 * uiScale), model.startY - (88 * uiScale));
        const givensMode = this.isGivensMatchingTask(this.activeWalkthroughStep, this.activeWalkthroughTask);
        const matchedGivens = new Set(this.workWalkthroughState?.selection || []);
        const vUnknown = givensMode ? !matchedGivens.has('v0') : this.inputs.unknownInitialVelocity;
        const thetaUnknown = givensMode ? !matchedGivens.has('theta') : this.inputs.unknownTheta;
        let rows = [
            {
                key: 'v0',
                label: \`v = \${vUnknown ? '?' : \`\${model.vi.toFixed(1)} m/s\`}\`,
                color: '#2563eb'
            },
            {
                key: 'theta',
                label: \`angle = \${thetaUnknown ? '?' : \`\${model.angleDeg.toFixed(0)}°\`}\`,
                color: '#7c3aed'
            }
        ];
        const allowedGivenTargets = this.getInputWalkthroughCanvasPolicy()?.allowedGivenTargets;
        if (allowedGivenTargets) {
            rows = rows.filter(row => allowedGivenTargets.has(row.key));
            if (!rows.length) return;
        }

        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.96)';
        ctx.strokeStyle = 'rgba(37,99,235,0.28)';
        ctx.lineWidth = 1.2 * uiScale;
        this.roundRectPath(ctx, x, y, boxW, boxH, 8 * uiScale);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#0f172a';
        ctx.font = this.scaleFontString('800 9px Inter, sans-serif', uiScale);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('Launch givens', x + (10 * uiScale), y + (12 * uiScale));

        rows.forEach((row, index) => {
            const rowY = y + ((30 + (index * 17)) * uiScale);
            ctx.fillStyle = row.color;
            ctx.font = this.scaleFontString('700 11px Georgia, serif', uiScale);
            ctx.fillText(row.label, x + (10 * uiScale), rowY);
            this.registerCanvasAnchor(ctx, \`launch:given:\${row.key}\`, {
                x: x + (6 * uiScale),
                y: rowY - (8 * uiScale),
                width: boxW - (12 * uiScale),
                height: 15 * uiScale,
                text: row.label,
                kind: 'walkthrough-concept',
                key: row.key
            });
        });
        ctx.restore();
    }

    drawWalkthroughCanvasPrompt(ctx, { title, message, accent = '#2563eb' }) {
        const uiScale = this.getCanvasTextScale();
        const width = 330 * uiScale;
        const height = 68 * uiScale;
        const x = 22 * uiScale;
        const y = 18 * uiScale;

        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.strokeStyle = \`\${accent}55\`;
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
    }

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
    }

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
            ? \`v0x = \${model.vi.toFixed(1)} cos(\${model.angleDeg.toFixed(0)} deg)\`
            : \`v0y = \${model.vi.toFixed(1)} sin(\${model.angleDeg.toFixed(0)} deg)\`;
        const answer = isX ? model.vix : model.viy;
        const typedValue = String(state.answer || '').trim();
        const showAnswer = task.kind === 'numeric' && state.feedback?.ok;
        const slotText = showAnswer ? \`\${answer.toFixed(2)} m/s\` : (typedValue || '?');
        const picked = state.lastFormulaPick || null;

        const width = 318 * uiScale;
        const height = 132 * uiScale;
        const x = 24 * uiScale;
        const y = this.height - height - (22 * uiScale);
        const rowH = 21 * uiScale;

        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = 'rgba(255,255,255,0.96)';
        ctx.strokeStyle = \`\${accent}55\`;
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
        ctx.fillText(\`Resolve \${symbol}\`, x + (18 * uiScale), y + (18 * uiScale));

        const rows = [
            { label: 'Have', text: \`v0 = \${model.vi.toFixed(1)} m/s, theta = \${model.angleDeg.toFixed(0)} deg\` },
            { label: 'Choose', text: picked ? this.getTrigEquationLabel(picked) : 'sin, cos, or tan?' },
            { label: 'Use', text: picked ? expectedEquation : \`\${symbol} = ?\` },
            { label: 'Sub', text: picked ? substitution : \`\${symbol} = v0 * ?(theta)\` },
            { label: 'Answer', text: \`\${symbol} = \${slotText}\`, result: true }
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

        this.registerCanvasAnchor(ctx, \`walkthrough:trig-value:\${target}\`, {
            x, y, width, height,
            kind: 'walkthrough-trig-value-box',
            key: target,
            text: \`\${symbol} trig workspace\`
        });
        ctx.restore();
    }

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

            this.registerCanvasAnchor(ctx, \`walkthrough:formula:\${row.id}\`, {
                x: rowX, y: rowY, width: rowW, height: rowH,
                kind: 'walkthrough-formula',
                equationId: row.id,
                text: row.label
            });
        });
        ctx.restore();
    }

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
    }

`;

// Insert the 6 methods before the last `}` of the class (just before Object.assign)
const insertAnchor = '\n}\n\nObject.assign(Module2DKinematics.prototype';
const insertPos = src.indexOf(insertAnchor);
if (insertPos === -1) {
    console.error('Cannot find class closing brace anchor — aborting');
    process.exit(1);
}
src = src.slice(0, insertPos) + injected + src.slice(insertPos);
console.log('Injected 6 missing methods');

// ---------------------------------------------------------------------------
// Block removal
// ---------------------------------------------------------------------------
function removeBlock(label, start, end) {
    const si = src.indexOf(start);
    const ei = src.indexOf(end);
    if (si === -1) { console.error(`START not found for: ${label}`); return; }
    if (ei === -1) { console.error(`END not found for: ${label}`); return; }
    if (si >= ei) { console.error(`START after END for: ${label}`); return; }
    src = src.slice(0, si) + src.slice(ei);
    console.log(`Removed: ${label}`);
}

console.log('\n--- Removing legacy / extracted blocks ---');
removeBlock('walkthrough block',     '\ncreateWorkWalkthroughState', '\n    getMotionStopTime');
removeBlock('getGenericWorkAnalysisStepsLegacy', '\n    getGenericWorkAnalysisStepsLegacy(', '\n    getSelectedWorkAnalysisProblemType(');
removeBlock('drawVectorBreakdownIntroLegacy',    '\n    drawVectorBreakdownIntroLegacy(',    '\n    isOverlayTime(');
removeBlock('problem renderer block', '\n    getCanvasProblemStatement()', '\n    drawFrame(');
removeBlock('getAxisSymbolLegacy',    '\n    getAxisSymbolLegacy(',        '\n    drawAngleArc(');

// ---------------------------------------------------------------------------
// Import block replacement
// ---------------------------------------------------------------------------
console.log('\n--- Updating imports ---');
const oldImports = `import {
    buildInputWalkthroughPanel,
    checkWalkthroughAnswer,
    getCurrentTaskSignature,
    getStepTasks
} from './Kinematics2dWorkAnalysisWalkthrough.js';
import {
    ProficiencyTracker,
    getSkipSuggestion,
    filterTasksForStudent
} from './proficiency.js';
import { getTaskSignature } from './workAnalysis.js';
import { drawWalkthroughOverlay } from './Kinematics2dWalkthroughOverlays.js';
import hoverAnimationMethods from './Kinematics2dHoverAnimations.js';
import { hitTestKeys, getHitRegion } from './Kinematics2dHitRegions.js';
import { buildGhostArrow, evaluateDrop, getDragGeometry, projectPointer } from './Kinematics2dVectorDecompose.js';`;

const newImports = `import {
    buildInputWalkthroughPanel,
    getStepTasks
} from './Kinematics2dWorkAnalysisWalkthrough.js';
import {
    ProficiencyTracker,
    getSkipSuggestion
} from './proficiency.js';
import { getEquationsForPicker, getTargetLabel, getTaskSignature } from './workAnalysis.js';
import { drawWalkthroughOverlay } from './Kinematics2dWalkthroughOverlays.js';
import hoverAnimationMethods from './Kinematics2dHoverAnimations.js';
import walkthroughInteractionMethods from './Kinematics2dWalkthroughInteraction.js';
import problemRendererMethods from './Kinematics2dProblemRenderer.js';
import sceneRendererMethods from './Kinematics2dSceneRenderer.js';
import uiRendererMethods from './Kinematics2dUIRenderer.js';
import { buildGhostArrow, getDragGeometry } from './Kinematics2dVectorDecompose.js';`;

if (src.includes(oldImports)) {
    src = src.replace(oldImports, newImports);
    console.log('Import block updated');
} else {
    console.error('WARNING: old import block not found');
}

// ---------------------------------------------------------------------------
// Object.assign block
// ---------------------------------------------------------------------------
const oldAssign = `Object.assign(Module2DKinematics.prototype, hoverAnimationMethods);`;
const newAssign = `Object.assign(Module2DKinematics.prototype, hoverAnimationMethods);
Object.assign(Module2DKinematics.prototype, walkthroughInteractionMethods);
Object.assign(Module2DKinematics.prototype, problemRendererMethods);
Object.assign(Module2DKinematics.prototype, sceneRendererMethods);
Object.assign(Module2DKinematics.prototype, uiRendererMethods);`;

if (src.includes(oldAssign)) {
    src = src.replace(oldAssign, newAssign);
    console.log('Object.assign block updated');
} else {
    console.error('WARNING: Object.assign anchor not found');
}

// ---------------------------------------------------------------------------
// Method extraction helpers
// ---------------------------------------------------------------------------
function extractMethod(content, name) {
    const re = new RegExp('(^[ \\t]*' + name + '\\s*\\()', 'm');
    const m = re.exec(content);
    if (!m) { console.error('NOT FOUND: ' + name); return null; }

    const lineStart = m.index;
    let pos = lineStart;
    while (pos < content.length && content[pos] !== '(') pos++;
    let parenDepth = 0, inStrP = null;
    while (pos < content.length) {
        const ch = content[pos];
        if (inStrP) { if (ch === '\\') { pos += 2; continue; } if (ch === inStrP) inStrP = null; }
        else if (ch === '"' || ch === "'" || ch === '`') { inStrP = ch; }
        else if (ch === '(') { parenDepth++; }
        else if (ch === ')') { parenDepth--; if (parenDepth === 0) { pos++; break; } }
        pos++;
    }
    while (pos < content.length && content[pos] !== '{') pos++;
    if (pos >= content.length) { console.error('No opening brace: ' + name); return null; }

    let depth = 0, inStr = null, i = pos;
    while (i < content.length) {
        const ch = content[i];
        if (inStr) { if (ch === '\\') { i += 2; continue; } if (ch === inStr) inStr = null; }
        else if (ch === '"' || ch === "'" || ch === '`') { inStr = ch; }
        else if (ch === '{') { depth++; }
        else if (ch === '}') { depth--; if (depth === 0) { i++; break; } }
        i++;
    }
    while (i < content.length && (content[i] === '\n' || content[i] === '\r')) i++;

    return { start: lineStart, end: i, text: content.slice(lineStart, i) };
}

function toMixinProperty(text) {
    const lines = text.split('\n');
    const firstIndent = lines[0].match(/^(\s*)/)[1];
    const deindented = lines.map(line =>
        line.startsWith(firstIndent) ? line.slice(firstIndent.length) : line.trimStart()
    );
    let result = deindented.join('\n').trimEnd();
    if (result.endsWith('}')) result += ',';
    return result;
}

// ---------------------------------------------------------------------------
// Extract methods
// ---------------------------------------------------------------------------
const sceneNames = [
    'drawWorldBackground','drawPoliceman','drawNavyBoat','drawFiretruck','drawLadder',
    'drawScenarioTerrain','drawLaunchCannon','drawLaunchGivenCallout',
    'drawTrajectory','drawGhostFrames','drawDisplacementGhostPositions','drawDropPlaneGuide',
    'drawDistanceTools','drawRuler','drawDetailedRuler','drawMaxHeightMarker',
    'drawPeakZeroVelocityZoom','drawPhysicsVectors','drawInitialVelocityVector',
    'drawProblemLabels','drawTelemetry','drawComponents',
    'drawAngleArc','drawLabeledArrow','drawAccelerationArrow'
];
const uiNames = [
    'drawWalkthroughCanvasPrompt','drawGivensDragToken','drawComponentTrigValueBox',
    'drawWalkthroughFormulaPicker','drawWalkthroughNumericInput',
    'drawAxisValuePanel','drawEquationPanel','drawLiveEquationAnimation',
    'drawVectorBreakdownSolveCard','drawFinalVelocityCanvasSteps',
    'drawFinalVelocityPlainLabel','drawFinalVelocityBreakdown'
];

console.log('\n--- Extracting methods ---');
const extracted = {};
let allFound = true;
for (const name of [...sceneNames, ...uiNames]) {
    const r = extractMethod(src, name);
    if (!r) { allFound = false; } else { extracted[name] = r; }
}
if (!allFound) { process.exit(1); }
for (const name of [...sceneNames, ...uiNames]) {
    console.log(`  ${name} (${extracted[name].text.split('\n').length} lines)`);
}

// ---------------------------------------------------------------------------
// Write mixin files
// ---------------------------------------------------------------------------
const sceneHeader = `// =============================================================================
// Kinematics2dSceneRenderer.js
// =============================================================================
// Prototype mixin for Module2DKinematics.  Owns all canvas drawing for the
// projectile-world scene:
//
//   • Sky/terrain backgrounds (drawWorldBackground, drawScenarioTerrain)
//   • Scenario props: drawPoliceman, drawNavyBoat, drawFiretruck, drawLadder
//   • Launch cannon and given-value callout (drawLaunchCannon, drawLaunchGivenCallout)
//   • Trajectory, ghost frames, displacement ghost positions
//   • Drop-plane guide line
//   • Distance tools: drawDistanceTools, drawRuler, drawDetailedRuler
//   • Height markers and peak-zoom lens: drawMaxHeightMarker, drawPeakZeroVelocityZoom
//   • Physics vectors: drawPhysicsVectors, drawInitialVelocityVector, drawComponents
//   • Problem labels, telemetry overlay
//   • Utility primitives: drawAngleArc, drawLabeledArrow, drawAccelerationArrow
//
// Consumed by Kinematics2d.js via:
//   Object.assign(Module2DKinematics.prototype, sceneRendererMethods);
// =============================================================================

const sceneRendererMethods = {

`;
fs.writeFileSync(sceneOut,
    sceneHeader + sceneNames.map(n => toMixinProperty(extracted[n].text)).join('\n\n') + '\n\n};\n\nexport default sceneRendererMethods;\n',
    'utf8'
);
console.log(`\nWrote ${sceneOut}`);

const uiHeader = `// =============================================================================
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

`;
fs.writeFileSync(uiOut,
    uiHeader + uiNames.map(n => toMixinProperty(extracted[n].text)).join('\n\n') + '\n\n};\n\nexport default uiRendererMethods;\n',
    'utf8'
);
console.log(`Wrote ${uiOut}`);

// ---------------------------------------------------------------------------
// Remove extracted methods from main file and write
// ---------------------------------------------------------------------------
const sorted = [...sceneNames, ...uiNames]
    .map(n => extracted[n])
    .sort((a, b) => b.start - a.start);

for (const { start, end } of sorted) {
    src = src.slice(0, start) + src.slice(end);
}

fs.writeFileSync(destPath, src, 'utf8');
console.log(`\nWrote ${destPath}`);
console.log(`Final: ${src.split('\n').length} lines, ${src.length} chars`);
