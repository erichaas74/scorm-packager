import KinematicsModuleBase from './kinematics.js';
import * as Kinematics2dWorkAnalysis from './Kinematics2dWorkAnalysis.js';
import { drawWalkthroughOverlay } from './Kinematics2dWalkthroughOverlays.js';
import hoverAnimationMethods from './Kinematics2dHoverAnimations.js';
import walkthroughInteractionMethods from './Kinematics2dWalkthroughInteraction.js';
import stepExportMethods from './Kinematics2dStepExport.js';
import stepRendererMethods from './Kinematics2dStepRenderer.js';
import problemRendererMethods from './Kinematics2dProblemRenderer.js';
import sceneRendererMethods from './Kinematics2dSceneRenderer.js';
import uiRendererMethods from './Kinematics2dUIRenderer.js';
import {
    bindStepSettingsPanelEvents,
    buildStepSettingsPanel,
    loadStepSettings,
    saveStepSettings,
    saveStepSettingsDefaults
} from './Kinematics2dStepSettings.js';

export default class Module2DKinematics extends KinematicsModuleBase {
    constructor(canvasId) {
        super(canvasId, { duration: 4, fps: 30 });

        this.scale = 7;
        this.originX = 60;
        this.groundY = this.height - 32;
        this.airplaneReleaseFraction = 0.1;
        this.vectorBreakdownDuration = 6.2;
        this.stepState = this.createStepState();
        this.advtrajectoryCache = null;
        this._hoverRafId = null;
        this._hoverLoopToken = 0;
        this._hoverAnimStartMs = 0;
        this._hoverPreviewTime = null;
        this._stepHoverRestoreInputs = null;
    }

    init() {
        this.setupInputs('controls', {
            "Problem Setup": {
                sampleProblem2d: {
                    label: "Sample 2D Problem",
                    type: "select",
                    options: this.getSampleProblemOptions(),
                    value: "Custom / None"
                },
                problemStatement: {
                    label: "Problem Text",
                    type: "textarea",
                    value: "",
                    rows: 5,
                    livePreview: true,
                    placeholder: "Paste or write the full 2D projectile problem here."
                },
                scenarioType: {
                    label: "Launch Scenario",
                    type: "select",
                    options: [
                        "Standard Projectile",
                        "Higher Landing",
                        "Lower Landing / Cliff",
                        "Moving Drop / Airplane"
                    ],
                    value: "Standard Projectile"
                },
                objectType: {
                    label: "Object Type",
                    type: "select",
                    options: ["Ball", "Cannon Ball", "Rock", "Block", "Person", "Plane"],
                    value: "Ball"
                },
                workerStyle: {
                    label: "Worker Style",
                    type: "select",
                    options: ["Construction", "Navy", "Fireman", "Police", "Scientist", "Climber", "Acrobat"],
                    value: "Construction"
                },
                ghostFrameCount: { label: "Ghost Position Count", type: "number", value: 6, step: 1 },
                svgExportTime: { label: "SVG Diagram Time (s)", type: "number", value: 4, step: 0.1 },
                workAnalysisProblemType: {
                    label: "Problem Type: Given Variables",
                    type: "select",
                    options: this.getWorkAnalysisProblemTypeOptions(),
                    value: "Auto"
                },
                unknownDx:              { label: "Δx Unknown (?)", type: "checkbox", value: true },
                unknownDy:              { label: "Δy Unknown (?)", type: "checkbox", value: true },
                unknownHmax:            { label: "hₘₐₓ Unknown (?)", type: "checkbox", value: true },
                unknownInitialVelocity: { label: "v₀ Unknown (?)", type: "checkbox", value: false },
                unknownInitialVx:       { label: "v₀ₓ Unknown (?)", type: "checkbox", value: true },
                unknownInitialVy:       { label: "v₀ᵧ Unknown (?)", type: "checkbox", value: true },
                unknownFinalVx:         { label: "vₓ Unknown (?)", type: "checkbox", value: true },
                unknownFinalVy:         { label: "vᵧ Unknown (?)", type: "checkbox", value: true },
                unknownFinalVelocity:   { label: "v_final Unknown (?)", type: "checkbox", value: true },
                unknownTheta:           { label: "θ Unknown (?)", type: "checkbox", value: false },
                unknownTime:            { label: "t Unknown (?)", type: "checkbox", value: true },
                initialVelocity: { label: "Initial Velocity (m/s)", type: "number", value: 20, step: 1 },
                launchAngle: { label: "Launch Angle (deg)", type: "number", value: 60, step: 1 },
                initialHeight: { label: "Initial Height (m)", type: "number", value: 0, step: 1 },
                landingHeight: { label: "Landing Height (m)", type: "number", value: 0, step: 1 },
                givenDx: { label: "Given Δx / Range (m)", type: "number", value: 170, step: 1 },
                givenDy: { label: "Given Δy (m)", type: "number", value: 0, step: 1 },
                givenTime: { label: "Given Time (s)", type: "number", value: 4, step: 0.1 },
                givenVx: { label: "Given v₀ₓ / vₓ (m/s)", type: "number", value: 20, step: 0.5 },
                givenVy: { label: "Given v₀ᵧ (m/s)", type: "number", value: 15, step: 0.5 },
                givenHmax: { label: "Given hₘₐₓ (m)", type: "number", value: 25, step: 1 },
                givenHeightDrop: { label: "Given Height Drop (m)", type: "number", value: 40, step: 1 },
                gravity: { label: "Gravity (m/s²)", type: "number", value: 9.8, step: 0.1 }
            },
            "Animation Controls": {
                animateGivenValues: { label: "Animate Given Values Into Cards", type: "checkbox", value: true },
                givenValueAnimationSpeed: { label: "Given Animation Speed (1 = normal)", type: "number", value: 0.65, step: 0.05 }
            },
            "Value Panels": {
                listDisplay: { label: "Show Values", type: "select", options: ["Hidden", "Symbols", "Values"], value: "Values" },
                showXValuesPanel: { label: "Show X Panel", type: "checkbox", value: true },
                xPanelShowDisplacement: { label: "  X: Δx displacement", type: "checkbox", value: true },
                xPanelShowV0:           { label: "  X: v₀ₓ initial velocity", type: "checkbox", value: true },
                xPanelShowV:            { label: "  X: vₓ velocity", type: "checkbox", value: true },
                xPanelShowA:            { label: "  X: aₓ acceleration", type: "checkbox", value: true },
                xPanelShowT:            { label: "  X: t time", type: "checkbox", value: true },
                showYValuesPanel: { label: "Show Y Panel", type: "checkbox", value: true },
                yPanelShowDisplacement: { label: "  Y: Δy displacement", type: "checkbox", value: true },
                yPanelShowHmax:         { label: "  Y: hₘₐₓ max height", type: "checkbox", value: true },
                yPanelShowV0:           { label: "  Y: v₀ᵧ initial velocity", type: "checkbox", value: true },
                yPanelShowV:            { label: "  Y: vᵧ velocity", type: "checkbox", value: true },
                yPanelShowA:            { label: "  Y: aᵧ acceleration", type: "checkbox", value: true },
                yPanelShowT:            { label: "  Y: t time", type: "checkbox", value: true },
                valuesPanelLayout: { label: "Panel Layout", type: "select", options: ["Current Layout", "Left Stack", "Right Stack", "Bottom Corners", "Split Corners (X Top-Left)", "Split Corners (X Bottom-Left)"], value: "Current Layout" },
                valuesPanelOffsetX: { label: "Panel Offset X (px)", type: "number", value: 0, step: 5 },
                valuesPanelOffsetY: { label: "Panel Offset Y (px)", type: "number", value: 0, step: 5 }
            },
            ...this.getProblemSetupImportControls()
        });

        const defaultSettings = this.getDefaultSettings();

        Object.entries(defaultSettings).forEach(([key, value]) => {
            this.setInputValue(key, value);
        });

        this.inputElements.workAnalysisProblemType?.addEventListener('change', () => {
            this.resetStepState();
            this.resetStepSettingsPanel?.();
            this.applyWorkAnalysisProblemTypePreset(this.inputs.workAnalysisProblemType, { randomize: true, redraw: true });
            this.updateCustomProblemVisibility();
        });
        this.inputElements.sampleProblem2d?.addEventListener('change', () => {
            this.applySampleProblem(this.inputs.sampleProblem2d, { redraw: true });
            this.updateCustomProblemVisibility();
        });
        this.updateCustomProblemVisibility();
        this.drawPreview();
    }

    getDefaultSettings() {
        // Only non-UI sim state defaults — keys with input definitions are already initialised
        // by buildInputs() via their .value property and do not need to be listed here.
        return {
            rulerStyle: "Simple",
            autoScaleToFit: true,
            showGhostFrames: false,
            showXDisplacementGhosts: false,
            showYDisplacementGhosts: false,
            showAngleArc: true,
            showLaunchCannon: true,
            showProblemLabels: false,
            showDropPlaneGuide: true,
            stopAnimation: "End of Flight",
            customStopTime: 5,
            timingMode: "Always",
            trailStyle: "Dotted",
            showTimerDisplay: true,
            animateGivenValues: true,
            givenValueAnimationSpeed: 0.65,
            showDistanceMarkers: true,
            showMomentumVector: false,
            showVelocityVectors: true,
            showInitialVelocityVector: false,
            showVectorBreakdown: false,
            showFinalVectorAdditionZoom: false,
            captureVectorBreakdownInSvg: false,
            showAccelerationVector: false,
            showMaxHeight: false,
            showComponents: false,
            useProjectileXValues: false,
            showEquations: false,
            equationPanelPlacement: "Bottom Right",
            equationPanelOffsetX: 0,
            equationPanelOffsetY: 0,
            equationHighlight: "None",
            accelerationPlacement: "Auto",
            accelerationOffsetX: 0,
            accelerationOffsetY: 0,
            workAnalysisStepDuration: 2.2
        };
    }

    getWorkAnalysisProblemTypeDefinitions() {
        return Kinematics2dWorkAnalysis.getWorkAnalysisProblemTypeDefinitions();
    }

    getWorkAnalysisProblemTypeOptions() {
        return Kinematics2dWorkAnalysis.getWorkAnalysisProblemTypeOptions();
    }

    getSampleProblemOptions() {
        return Kinematics2dWorkAnalysis.getSample2dKinematicsProblemOptions();
    }

    getSampleProblemByTitle(title) {
        return Kinematics2dWorkAnalysis.getSample2dKinematicsProblemByTitle(title);
    }

    applySampleProblem(title, { redraw = false } = {}) {
        const sample = this.getSampleProblemByTitle(title);
        if (!sample || sample.id === 'custom') {
            this.setInputValue('problemStatement', '', { redraw: false });
            if (redraw) this.drawPreview();
            return;
        }

        this.setInputValue('problemStatement', sample.prompt, { redraw: false });
        Object.entries(sample.settings || {}).forEach(([key, value]) => {
            this.setInputValue(key, value, { redraw: false });
        });

        this.resetStepState();
        this.applyWorkAnalysisProblemTypePreset(this.inputs.workAnalysisProblemType, { randomize: false, redraw: false });
        if (redraw) this.drawPreview();
    }

    getPreviewTitle() {
        return this.previewTitleFallback || "Problem 2: 2D Projectile Motion Preview";
    }

    getControlsContainerForGroup(groupName, defaultContainer, topControlsContainer) {
        if (topControlsContainer && ['Problem Statement', 'Physics Parameters'].includes(groupName)) {
            return topControlsContainer;
        }

        return defaultContainer;
    }

    resolveWorkAnalysisProblemTypeOption(value) {
        return Kinematics2dWorkAnalysis.resolveWorkAnalysisProblemTypeOption(
            value,
            (rawValue) => this.normalizeImportToken(rawValue)
        );
    }

    getWorkAnalysisProblemTypeNumber(value) {
        return Kinematics2dWorkAnalysis.getWorkAnalysisProblemTypeNumber(
            value,
            (rawValue) => this.normalizeImportToken(rawValue)
        );
    }

    getWorkAnalysisKnownVariablesForType(typeNumber) {
        return Kinematics2dWorkAnalysis.getWorkAnalysisKnownVariablesForType(typeNumber);
    }

    getVisiblePhysicsParameterKeys(typeNumber) {
        return Kinematics2dWorkAnalysis.getVisiblePhysicsParameterKeys(typeNumber);
    }

    updatePhysicsParameterVisibility() {
        const typeNumber = this.getWorkAnalysisProblemTypeNumber(this.inputs.workAnalysisProblemType);
        const visible = new Set(this.getVisiblePhysicsParameterKeys(typeNumber));
        const physicsKeys = [
            'workAnalysisProblemType',
            'initialVelocity',
            'launchAngle',
            'initialHeight',
            'landingHeight',
            'givenDx',
            'givenDy',
            'givenTime',
            'givenVx',
            'givenVy',
            'givenHmax',
            'givenHeightDrop',
            'gravity'
        ];
        const unknownKeys = [
            'unknownDx', 'unknownDy', 'unknownHmax',
            'unknownInitialVelocity', 'unknownInitialVx', 'unknownInitialVy',
            'unknownFinalVx', 'unknownFinalVy', 'unknownFinalVelocity',
            'unknownTheta', 'unknownTime'
        ];

        physicsKeys.forEach((key) => {
            const wrapper = this.inputElements[key]?.parentElement;
            if (!wrapper) return;
            wrapper.style.display = visible.has(key) ? '' : 'none';
        });

        // Unknown checkboxes are always visible when a problem type is selected;
        // hidden in Auto mode since they have no canonical meaning there.
        const showUnknowns = Boolean(typeNumber);
        unknownKeys.forEach((key) => {
            const wrapper = this.inputElements[key]?.parentElement;
            if (!wrapper) return;
            wrapper.style.display = showUnknowns ? '' : 'none';
        });
    }

    updateCustomProblemVisibility() {
        const isCustom = this.inputs.sampleProblem2d === 'Custom / None';
        const customOnlyKeys = [
            'workAnalysisProblemType',
            'unknownDx', 'unknownDy', 'unknownHmax',
            'unknownInitialVelocity', 'unknownInitialVx', 'unknownInitialVy',
            'unknownFinalVx', 'unknownFinalVy', 'unknownFinalVelocity',
            'unknownTheta', 'unknownTime',
            'initialVelocity', 'launchAngle', 'initialHeight', 'landingHeight',
            'givenDx', 'givenDy', 'givenTime', 'givenVx', 'givenVy', 'givenHmax', 'givenHeightDrop',
            'gravity'
        ];
        customOnlyKeys.forEach((key) => {
            const wrapper = this.inputElements[key]?.parentElement;
            if (wrapper) wrapper.style.display = isCustom ? '' : 'none';
        });
        if (isCustom) {
            this.updatePhysicsParameterVisibility();
        }
    }

    randomBetween(min, max, decimals = 0) {
        const factor = 10 ** decimals;
        return Math.round((min + Math.random() * (max - min)) * factor) / factor;
    }

    randomSignedMagnitude(min, max, decimals = 0) {
        const sign = Math.random() < 0.5 ? -1 : 1;
        return sign * this.randomBetween(min, max, decimals);
    }

    randomizeProblemTypeInputs(typeNumber) {
        const updates = Kinematics2dWorkAnalysis.getRandomizedProblemTypeInputUpdates(typeNumber);
        if (!updates) return;

        Object.entries(updates).forEach(([key, value]) => {
            this.setInputValue(key, value);
        });
    }

    applyWorkAnalysisProblemTypePreset(selection, { redraw = false, randomize = false } = {}) {
        const typeNumber = this.getWorkAnalysisProblemTypeNumber(selection);
        const known = this.getWorkAnalysisKnownVariablesForType(typeNumber);
        if (!known) {
            this.updatePhysicsParameterVisibility();
            if (redraw) this.drawPreview();
            return;
        }

        if (randomize) {
            this.randomizeProblemTypeInputs(typeNumber);
        }

        const unknownUpdates = {
            unknownDx: !known.dx,
            unknownDy: !known.dy,
            unknownHmax: !known.hmax,
            unknownInitialVelocity: !known.v0,
            unknownInitialVx: !known.v0x,
            unknownInitialVy: !known.v0y,
            unknownFinalVx: !known.vx,
            unknownFinalVy: !known.vy,
            unknownFinalVelocity: !known.v,
            unknownTheta: !known.theta,
            unknownTime: !known.time
        };

        Object.entries(unknownUpdates).forEach(([key, value]) => {
            this.setInputValue(key, value);
        });

        this.updatePhysicsParameterVisibility();
        if (redraw) this.drawPreview();
    }

    coerceImportedValue(key, rawValue) {
        if (key === 'workAnalysisProblemType') {
            const option = this.resolveWorkAnalysisProblemTypeOption(rawValue);
            if (!option) return { ok: false, reason: 'invalid work analysis problem type' };
            return { ok: true, value: option };
        }

        return super.coerceImportedValue(key, rawValue);
    }

    getImportExtraAliases() {
        return {
            sampleProblem2d: ['sampleproblem', 'sample2dproblem', 'problemexample'],
            problemStatement: ['problem', 'problemtext', 'problemstatement', 'prompt'],
            initialVelocity: ['vi', 'v0', 'velocity', 'initialspeed', 'launchspeed'],
            launchAngle: ['theta', 'angle', 'launchtheta'],
            initialHeight: ['yi', 'y0', 'startheight', 'launchheight'],
            landingHeight: ['yf', 'yfinal', 'finalheight', 'endheight'],
            givenDx: ['dx', 'deltax', 'range', 'givenrange', 'givendx'],
            givenDy: ['dy', 'deltay', 'heightdifference', 'givendy'],
            givenTime: ['t', 'time', 'givetime', 'giventime'],
            givenVx: ['vx', 'v0x', 'givenvx', 'givenv0x'],
            givenVy: ['vy', 'v0y', 'givenvy', 'givenv0y'],
            givenHmax: ['hmax', 'maxheight', 'givenhmax'],
            givenHeightDrop: ['heightdrop', 'dropheight', 'givendropheight'],
            gravity: ['g'],
            scenarioType: ['scenario', 'launchscenario', 'diagramtype'],
            objectType: ['object', 'projectile', 'item'],
            workerStyle: ['workerstyle', 'characterstyle', 'worker'],
            rulerStyle: ['ruler'],
            listDisplay: ['variables', 'variablelist'],
            autoScaleToFit: ['autoscale', 'fitdiagram'],
            showGhostFrames: ['ghosts', 'showghosts', 'ghostpositions'],
            showXDisplacementGhosts: ['xdisplacementghosts', 'xghosts', 'showxghosts', 'horizontalghosts'],
            showYDisplacementGhosts: ['ydisplacementghosts', 'yghosts', 'showyghosts', 'verticalghosts'],
            ghostFrameCount: ['ghostcount', 'ghostscount'],
            showAngleArc: ['anglearc', 'showangle'],
            showLaunchCannon: ['launchcannon', 'showcannon', 'cannon'],
            showProblemLabels: ['problemlabels', 'labels'],
            showDropPlaneGuide: ['airplaneguide', 'dropplaneguide'],
            svgExportTime: ['svgtime', 'diagramtime'],
            unknownDx: ['unknownx', 'dxunknown'],
            unknownDy: ['unknowny', 'dyunknown'],
            unknownHmax: ['unknownhmax', 'hmaxunknown', 'maxheightunknown', 'unknownmaxheight'],
            unknownInitialVelocity: ['unknownvi', 'v0unknown'],
            unknownInitialVx: ['unknowninitialvx', 'initialvxunknown', 'unknownv0x', 'v0xunknown'],
            unknownInitialVy: ['unknowninitialvy', 'initialvyunknown', 'unknownv0y', 'v0yunknown'],
            unknownFinalVx: ['unknownfinalvx', 'finalvxunknown', 'unknownvx', 'vxunknown', 'xvelocityunknown'],
            unknownFinalVy: ['unknownfinalvy', 'finalvyunknown', 'unknownvy', 'vyunknown', 'yvelocityunknown'],
            unknownFinalVelocity: ['unknownv', 'vunknown', 'unknownvf', 'finalvunknown'],
            unknownTheta: ['unknowntheta', 'thetaunknown'],
            unknownTime: ['unknowntime', 'timeunknown'],
            stopAnimation: ['stopat', 'stopanimationat'],
            customStopTime: ['stoptime', 'customtime'],
            timingMode: ['overlaytiming', 'showoverlayat'],
            trailStyle: ['trail'],
            showTimerDisplay: ['timer', 'showtimer'],
            animateGivenValues: ['animategivenvalues', 'givenvalueanimation', 'animateknowns', 'animategivens'],
            givenValueAnimationSpeed: ['givenanimationspeed', 'givenspeed', 'givenvaluespeed', 'animategivensspeed'],
            showDistanceMarkers: ['distancelines', 'distanceguides'],
            showMomentumVector: ['momentumvector', 'showmomentum'],
            showVelocityVectors: ['velocityvectors', 'showvelocity'],
            showInitialVelocityVector: ['initialvelocityvector', 'showinitialvelocity', 'showlaunchvector'],
            showVectorBreakdown: ['vectorbreakdown', 'breakdownintro', 'vectorintro', 'initialvectorbreakdown', 'showinitialvectorbreakdown'],
            showFinalVectorAdditionZoom: ['finalvectoraddition', 'finalvectorzoom', 'showfinalvectoraddition', 'showfinalvectorzoom'],
            captureVectorBreakdownInSvg: ['svgvectorbreakdown', 'capturebreakdownsvg', 'capturesvgbreakdown'],
            showAccelerationVector: ['accelerationvector', 'showacceleration'],
            showMaxHeight: ['maxheightline', 'showhmax'],
            showComponents: ['components', 'showvxvy'],
            useProjectileXValues: ['simplexvalues', 'projectilexvalues', 'dxvt'],
            valuesPanelLayout: ['valueslayout', 'panellayout'],
            valuesPanelOffsetX: ['valuesxoffset'],
            valuesPanelOffsetY: ['valuesyoffset'],
            showXValuesPanel: ['showxvalues'],
            showYValuesPanel: ['showyvalues'],
            showEquations: ['equations', 'showequationbox'],
            equationPanelPlacement: ['equationplacement', 'equationboxplacement'],
            equationPanelOffsetX: ['equationxoffset'],
            equationPanelOffsetY: ['equationyoffset'],
            equationHighlight: ['highlightequation'],
            accelerationPlacement: ['accelerationlocation', 'aplace'],
            accelerationOffsetX: ['accelerationxoffset'],
            accelerationOffsetY: ['accelerationyoffset'],
            workAnalysisProblemType: ['worktype', 'problemtype', 'workanalysisproblemtype'],
            workAnalysisStepDuration: ['workstepduration', 'workanalysisduration', 'worksteptime']
        };
    }

    getVectorConfig() {
        const model = this.computeProjectileModel(0);
        return {
            magnitude: model.vi,
            angleDeg: model.angleDeg,
            title: model.scenarioType === "Moving Drop / Airplane"
                ? "Horizontal Velocity Vector"
                : "Initial Velocity Vector",
        };
    }

    getVectorDrawingScale() {
        return 2;
    }

    getPlaybackDuration() {
        const model = this.computeProjectileModel(0);
        const givenValueAnimationDuration = this.inputs.animateGivenValues
            ? this.getProblemValueTransferDuration() + 0.5
            : 0;
        return Math.max(0.1, model.stopTime, givenValueAnimationDuration);
    }

    drawPreview() {
        this.stopPreview();
        this.updatePreviewTitle();
        this.ctx.fillStyle = this.config.backgroundColor;
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.isStaticPreviewRendering = true;
        try {
            this.drawFrame(this.ctx, 10);
        } finally {
            this.isStaticPreviewRendering = false;
        }
        this.syncExternalPanels();
    }

    getVectorBreakdownDurationForScenario(scenarioType) {
        if (this.isStaticPreviewRendering) return 0;
        if (!this.inputs.showVectorBreakdown) return 0;
        if (scenarioType === "Moving Drop / Airplane") return 0;
        return this.vectorBreakdownDuration;
    }

    getFinalVectorZoomDurationForScenario() {
        if (this.isStaticPreviewRendering) return 0;
        if (!this.inputs.showFinalVectorAdditionZoom) return 0;
        return 8.2;
    }

    getWorkAnalysisStepDuration() {
        return Math.max(0.6, this.normalizeNumber(this.inputs.workAnalysisStepDuration, 2.2));
    }

    shouldAnimateWorkAnalysis() { return Boolean(this.activeWalkthroughStep?.animatedPanel); }
    shouldDrawWorkAnalysisCanvas() { return Boolean(this.activeWalkthroughStep?.animatedPanel); }
    shouldHighlightWorkAnalysisDiagram() { return Boolean(this.activeWalkthroughStep?.animatedPanel); }
    isWorkAnalysisLaunchComponentStep() { return false; }
    isStepWalkthroughMode() { return Boolean(this.activeWalkthroughStep); }

    getMotionStopTime(tFlight, tPeak) {
        let stopTime = tFlight;
        if (this.inputs.stopAnimation === 'Max Height') {
            stopTime = tPeak;
        } else if (this.inputs.stopAnimation === 'Custom Time') {
            stopTime = this.normalizeNumber(this.inputs.customStopTime, this.config.duration);
        }

        return Math.max(0, Math.min(stopTime, tFlight));
    }

    getTeachingTimeline({ scenarioType, visualTime, workAnalysisBaseModel }) {
        const breakdownDuration = this.getVectorBreakdownDurationForScenario(scenarioType);
        const finalVectorDuration = this.getFinalVectorZoomDurationForScenario(scenarioType);
        const workStepDuration = this.getWorkAnalysisStepDuration();
        const workAnalysisType = this.getSelectedWorkAnalysisProblemType(workAnalysisBaseModel);
        const workAnalysisSteps = this.getConfiguredWorkAnalysisSteps(workAnalysisBaseModel, workAnalysisType);
        const workAnalysisDuration = this.shouldAnimateWorkAnalysis()
            ? (workAnalysisSteps.length * workStepDuration)
            : 0;
        const introDuration = breakdownDuration + workAnalysisDuration;

        return {
            breakdownDuration,
            finalVectorDuration,
            workStepDuration,
            workAnalysisType,
            workAnalysisSteps,
            workAnalysisDuration,
            introDuration,
            motionTime: Math.max(0, visualTime - introDuration)
        };
    }

    getProjectileViewport({ yi, yf, currentX, currentY, range, yPeak, xPeak }) {
        const rawMinY = Math.min(yi, yf, currentY);
        const rawMaxY = Math.max(yi, yf, yPeak, currentY);
        const rawMinX = 0;
        const rawMaxX = Math.max(range, currentX, xPeak);
        const xPadding = Math.max(1, (rawMaxX - rawMinX) * 0.04);
        const topPadding = Math.max(1, (rawMaxY - yi) * 0.05);
        const bottomPadding = Math.max(0.5, Math.max(0, yi - rawMinY) * 0.03);
        let minX = rawMinX;
        let maxX = rawMaxX;
        let minY = rawMinY;
        let maxY = rawMaxY;

        let scale = this.scale;
        const leftMargin = 28;
        const rightMargin = 28;
        const topMargin = 24;
        const bottomMargin = 22 + (this.height * 0.05);
        const canvasCenterX = this.width / 2;

        if (this.inputs.autoScaleToFit) {
            minX = rawMinX - xPadding;
            maxX = rawMaxX + xPadding;
            minY = rawMinY - bottomPadding;
            maxY = rawMaxY + topPadding;
            const worldWidth = Math.max(0.01, maxX - minX);
            const worldHeight = Math.max(0.01, maxY - minY);
            const usableWidth = Math.max(140, this.width - leftMargin - rightMargin);
            const usableHeight = Math.max(140, this.height - topMargin - bottomMargin);

            scale = Math.min(usableWidth / worldWidth, usableHeight / worldHeight);
            if (!Number.isFinite(scale) || scale <= 0) {
                scale = this.scale;
            }
        }

        const worldMidX = (minX + maxX) / 2;
        const xToCanvas = (x) => canvasCenterX + ((x - worldMidX) * scale);
        const yToCanvas = (y) => this.height - bottomMargin - ((y - minY) * scale);
        const startX = xToCanvas(0);
        const startY = yToCanvas(yi);
        const endX = xToCanvas(range);
        const endY = yToCanvas(yf);

        return {
            minX,
            maxX,
            minY,
            maxY,
            scale,
            originX: xToCanvas(0),
            baselineY: Math.max(startY, endY),
            yToCanvas,
            xToCanvas,
            canvasX: xToCanvas(currentX),
            canvasY: yToCanvas(currentY),
            startX,
            startY,
            endX,
            endY,
            peakCanvasX: xToCanvas(xPeak),
            peakCanvasY: yToCanvas(yPeak)
        };
    }

    getTerrainSurfaceAnchors({ scenarioType, startY, endY }) {
        const launchSurfaceY = Number.isFinite(startY) ? startY : 0;
        const landingSurfaceY = Number.isFinite(endY) ? endY : launchSurfaceY;
        const surfaceBaselineY = Math.max(launchSurfaceY, landingSurfaceY);

        if (scenarioType === "Higher Landing") {
            return {
                launchSurfaceY,
                landingSurfaceY,
                surfaceBaselineY,
                lowerGroundY: launchSurfaceY,
                buildingRoofY: landingSurfaceY,
                buildingWallTopY: landingSurfaceY
            };
        }

        if (scenarioType === "Lower Landing / Cliff") {
            const cliffGrassThickness = 16;
            return {
                launchSurfaceY,
                landingSurfaceY,
                surfaceBaselineY,
                cliffTopY: launchSurfaceY,
                cliffGrassBottomY: launchSurfaceY + cliffGrassThickness,
                waterSurfaceY: landingSurfaceY
            };
        }

        return {
            launchSurfaceY,
            landingSurfaceY,
            surfaceBaselineY,
            flatGroundY: launchSurfaceY
        };
    }

    getDisplacementGeometry(model) {
        const {
            launchSurfaceY: launchY,
            landingSurfaceY: landingY,
            surfaceBaselineY
        } = this.getTerrainSurfaceAnchors(model);
        const dyValue = model.yf - model.yi;
        const sameHeight = Math.abs(dyValue) < 0.01;
        const rulerY = Math.min(this.height - 25, surfaceBaselineY + 36);
        const dyRulerX = model.scenarioType === "Lower Landing / Cliff"
            ? this.clamp(this.getScenarioStepX(model) + 38, model.startX + 28, this.width - 55)
            : Math.max(model.startX + 45, Math.min(this.width - 55, model.endX - 44));

        return {
            launchY,
            landingY,
            surfaceBaselineY,
            dx: {
                x1: model.startX,
                y1: rulerY,
                x2: model.endX,
                y2: rulerY,
                value: model.range
            },
            dy: {
                x1: dyRulerX,
                y1: launchY,
                x2: dyRulerX,
                y2: landingY,
                value: dyValue,
                sameHeight
            },
            hmax: {
                x1: model.peakCanvasX + 28,
                y1: launchY,
                x2: model.peakCanvasX + 28,
                y2: model.peakCanvasY,
                value: model.yPeak - model.yi
            }
        };
    }

    getSelectedWorkAnalysisProblemType(model) {
        return Kinematics2dWorkAnalysis.getSelectedWorkAnalysisProblemType(
            model,
            this.inputs,
            (rawValue) => this.normalizeImportToken(rawValue)
        );
    }

    getWorkAnalysisTypeConfigs(model) {
        return Kinematics2dWorkAnalysis.getWorkAnalysisTypeConfigs(model);
    }

    getConfiguredWorkAnalysisSteps(model, problemType = this.getSelectedWorkAnalysisProblemType(model)) {
        return Kinematics2dWorkAnalysis.getConfiguredWorkAnalysisSteps(model, problemType);
    }

    getWorkAnalysisSequenceState(model) {
        const stepDuration = model.workStepDuration || this.getWorkAnalysisStepDuration();
        return Kinematics2dWorkAnalysis.getWorkAnalysisSequenceState(
            model,
            stepDuration,
            (value, min, max) => this.clamp(value, min, max)
        );
    }

    getWorkAnalysisValueFocusStyle(model, valueKeys, baseStyle = {}) {
        if (!model?.isInWorkAnalysisSequence) return baseStyle;

        const keys = Array.isArray(valueKeys) ? valueKeys : [valueKeys];
        const state = this.getWorkAnalysisSequenceState(model);
        const step = state?.step;
        if (!step?.focusValues?.length) return baseStyle;

        const isFocused = keys.some(key => step.focusValues.includes(key));
        if (!isFocused) return baseStyle;

        const resultValues = step.resultValues || (step.resultValue ? [step.resultValue] : []);
        const isResult = keys.some(key => resultValues.includes(key));
        const colorByKey = {
            dx: '#ea580c',
            dy: '#047857',
            hmax: '#059669',
            v0: '#2563eb',
            v0x: '#b91c1c',
            v0y: '#047857',
            vx: '#b91c1c',
            vy: '#047857',
            finalV: '#4338ca',
            theta: '#2563eb',
            time: '#7c3aed',
            ay: '#ea580c'
        };
        const accent = step.accent || keys.map(key => colorByKey[key]).find(Boolean) || '#7c3aed';
        const wave = 0.5 + (0.5 * Math.sin((model.visualTime || 0) * Math.PI * 2.2));
        const scale = (isResult ? 1.15 : 1.08) + (wave * (isResult ? 0.08 : 0.05));

        return {
            ...baseStyle,
            scale,
            fill: accent,
            background: isResult ? 'rgba(254, 243, 199, 0.96)' : 'rgba(255,255,255,0.94)',
            borderColor: accent,
            borderWidth: isResult ? 2 : 1.5,
            shadowColor: `${accent}55`,
            shadowBlur: this.isSvgExporting ? 0 : (isResult ? 16 : 10),
            lineColor: accent,
            lineWidth: isResult ? 3.2 : 2.6,
            textColor: accent,
            fillStyle: isResult ? 'rgba(254, 243, 199, 0.98)' : 'rgba(255,255,255,0.96)'
        };
    }

    getWorkAnalysisSolvedValueKeys(model) {
        const solved = new Set();
        const steps = model?.workAnalysisSteps || [];

        if (!steps.length) return solved;

        if (!model?.isInWorkAnalysisSequence) return solved;

        const state = this.getWorkAnalysisSequenceState(model);
        if (!state) return solved;

        steps.forEach((step, index) => {
            const completionProgress = step.liveEquation ? 0.96 : 0.82;
            const isCompleted = index < state.stepIndex || (index === state.stepIndex && state.progress >= completionProgress);
            if (!isCompleted) return;
            (step.resultValues || (step.resultValue ? [step.resultValue] : [])).forEach(valueKey => solved.add(valueKey));
        });

        return solved;
    }

    isAxisValueSolvedByWork(axis, key, model) {
        const solved = this.getWorkAnalysisSolvedValueKeys(model);
        if (!solved.size) return false;
        return this.getAxisValueFocusKeys(axis, key).some(valueKey => solved.has(valueKey));
    }

    clampCanvasPoint(x, y, padding = 24) {
        return {
            x: this.clamp(x, padding, this.width - padding),
            y: this.clamp(y, padding, this.height - padding)
        };
    }

    getScenarioForDeltaY(dy) {
        return Kinematics2dWorkAnalysis.getScenarioForDeltaY(dy);
    }

    componentsToLaunchValues(vx, vy) {
        return Kinematics2dWorkAnalysis.componentsToLaunchValues(vx, vy);
    }

    getProblemTypeScenarioValues(typeNumber, g) {
        return Kinematics2dWorkAnalysis.getProblemTypeScenarioValues(typeNumber, this.inputs, g, {
            normalizeNumber: (value, fallback) => this.normalizeNumber(value, fallback),
            clamp: (value, min, max) => this.clamp(value, min, max)
        });
    }

    getEffectiveScenarioValues() {
        let scenarioType = this.inputs.scenarioType || "Standard Projectile";
        let vi = Math.max(0, this.normalizeNumber(this.inputs.initialVelocity, 25));
        const g = Math.max(0.01, this.normalizeNumber(this.inputs.gravity, 9.8));
        const m = 1;

        let angleDeg = this.normalizeNumber(this.inputs.launchAngle, 60);
        let yi = this.normalizeNumber(this.inputs.initialHeight, 5);
        let yf = this.normalizeNumber(this.inputs.landingHeight, 0);
        const typeValues = this.getProblemTypeScenarioValues(this.getWorkAnalysisProblemTypeNumber(this.inputs.workAnalysisProblemType), g);
        if (typeValues) {
            return { ...typeValues, g, m };
        }

        const minHeightGap = 2;

        if (scenarioType === "Standard Projectile") {
            yf = yi;
        } else if (scenarioType === "Higher Landing") {
            yf = Math.max(yf, yi + minHeightGap);
        } else if (scenarioType === "Lower Landing / Cliff") {
            yf = Math.min(yf, yi - minHeightGap);
        }

        if (scenarioType === "Moving Drop / Airplane") {
            angleDeg = 0;
        }

        angleDeg = Math.max(-85, Math.min(89, angleDeg));

        return { scenarioType, vi, angleDeg, yi, yf, g, m };
    }

    calculateTimeToHeight(viy, yi, g, yf = 0) {
        const a = -0.5 * g;
        const b = viy;
        const c = yi - yf;
        const discriminant = (b * b) - (4 * a * c);

        if (Math.abs(a) < 1e-9) {
            if (Math.abs(b) < 1e-9) return 0;
            return Math.max(0, -c / b);
        }

        if (discriminant < 0) return 0;

        const sqrtD = Math.sqrt(discriminant);
        const t1 = (-b + sqrtD) / (2 * a);
        const t2 = (-b - sqrtD) / (2 * a);
        const candidates = [t1, t2].filter(t => Number.isFinite(t) && t >= 0);
        return candidates.length ? Math.max(...candidates) : 0;
    }

    computeProjectileModel(time) {
        const { scenarioType, vi, angleDeg, yi, yf, g, m } = this.getEffectiveScenarioValues();
        const visualTime = Math.max(0, time);

        const angleRad = angleDeg * (Math.PI / 180);
        const vix = vi * Math.cos(angleRad);
        const viy = vi * Math.sin(angleRad);

        let tFlight = this.calculateTimeToHeight(viy, yi, g, yf);
        let releaseTime = 0;
        let releaseX = 0;
        let tPeakRaw = viy / g;
        let tPeak = Math.max(0, Math.min(tFlight, tPeakRaw));
        let yPeak = yi + (viy * tPeak) - (0.5 * g * tPeak * tPeak);
        let xPeak = vix * tPeak;

        if (scenarioType === "Moving Drop / Airplane") {
            const freeFallTime = this.calculateTimeToHeight(0, yi, g, yf);
            releaseTime = freeFallTime * (this.airplaneReleaseFraction / (1 - this.airplaneReleaseFraction));
            tFlight = freeFallTime + releaseTime;
            releaseX = vix * releaseTime;
            tPeakRaw = releaseTime;
            tPeak = releaseTime;
            yPeak = yi;
            xPeak = releaseX;
        }

        const range = vix * tFlight;
        const finalVy = scenarioType === "Moving Drop / Airplane"
            ? -(g * (tFlight - releaseTime))
            : (viy - (g * tFlight));
        const finalSpeed = Math.sqrt((vix * vix) + (finalVy * finalVy));
        const workAnalysisBaseModel = {
            scenarioType, vi, angleDeg, angleRad, yi, yf, g, m,
            vix, viy, tFlight, tPeak, yPeak, xPeak, range,
            releaseTime, releaseX, finalVy, finalSpeed
        };
        const {
            breakdownDuration,
            finalVectorDuration,
            workStepDuration,
            workAnalysisDuration,
            workAnalysisType,
            workAnalysisSteps,
            introDuration,
            motionTime
        } = this.getTeachingTimeline({
            scenarioType,
            visualTime,
            workAnalysisBaseModel
        });
        const motionStopTime = this.getMotionStopTime(tFlight, tPeak);
        const activeTime = Math.max(0, Math.min(motionTime, motionStopTime));
        const finalVectorStartTime = introDuration + motionStopTime;
        const isInFinalVelocityZoom = finalVectorDuration > 0 &&
            visualTime >= finalVectorStartTime &&
            visualTime < (finalVectorStartTime + finalVectorDuration);
        const currentPosition = this.getPositionAtTime(activeTime, {
            scenarioType, vix, viy, yi, g, tFlight, releaseTime
        });
        const currentX = currentPosition.x;
        const currentY = currentPosition.y;
        const currentVy = scenarioType === "Moving Drop / Airplane"
            ? (activeTime <= releaseTime ? 0 : -(g * (activeTime - releaseTime)))
            : (viy - (g * activeTime));
        const viewport = this.getProjectileViewport({
            yi,
            yf,
            currentX,
            currentY,
            range,
            yPeak,
            xPeak
        });
        const terrainAnchors = this.getTerrainSurfaceAnchors({
            scenarioType,
            startY: viewport.startY,
            endY: viewport.endY
        });

        return {
            scenarioType, vi, angleDeg, angleRad, yi, yf, g, m,
            vix, viy, currentVy, finalVy, finalSpeed,
            tFlight, tPeak, stopTime: introDuration + motionStopTime + finalVectorDuration, motionStopTime, activeTime,
            currentX, currentY, range, yPeak, xPeak,
            releaseTime, releaseX,
            ...viewport,
            ...terrainAnchors,
            baselineY: terrainAnchors.surfaceBaselineY,
            isReleased: activeTime >= releaseTime,
            isFinished: visualTime >= (introDuration + motionStopTime),
            isAtPeak: visualTime >= (introDuration + tPeak),
            isAtCustom: visualTime >= (introDuration + this.normalizeNumber(this.inputs.customStopTime, this.config.duration)),
            visualTime,
            motionTime,
            breakdownDuration,
            finalVectorDuration,
            finalVectorStartTime,
            workStepDuration,
            workAnalysisDuration,
            workAnalysisType,
            workAnalysisSteps,
            introDuration,
            isInVectorBreakdown: breakdownDuration > 0 && visualTime < breakdownDuration,
            isInFinalVelocityZoom,
            isInWorkAnalysisSequence: workAnalysisDuration > 0 && visualTime >= breakdownDuration && visualTime < introDuration
        };
    }

    getPositionAtTime(time, model) {
        const clampedTime = Math.max(0, Math.min(time, model.tFlight));
        const x = model.vix * clampedTime;

        if (model.scenarioType === "Moving Drop / Airplane") {
            if (clampedTime <= model.releaseTime) {
                return { x, y: model.yi };
            }

            const fallTime = clampedTime - model.releaseTime;
            return {
                x,
                y: model.yi - (0.5 * model.g * fallTime * fallTime)
            };
        }

        return {
            x,
            y: model.yi + (model.viy * clampedTime) - (0.5 * model.g * clampedTime * clampedTime)
        };
    }

    getEquationPanelLayout(model = null) {
        const uiScale = this.getCanvasTextScale();
        const equationCount = this.getEquationLines().length;
        const boxScale = 0.75;
        const rowHeight = 27 * boxScale;
        const topPadding = 8 * boxScale;
        const width = ((137 * uiScale) * 2) * boxScale;
        const height = ((equationCount * rowHeight) + topPadding + 10) * uiScale;
        const xOffset = this.normalizeNumber(this.inputs.equationPanelOffsetX, 0);
        const yOffset = this.normalizeNumber(this.inputs.equationPanelOffsetY, 0);
        const panelModel = model || this.computeProjectileModel(0);
        const launchAngle = Math.abs(panelModel?.angleDeg ?? this.normalizeNumber(this.inputs.launchAngle, 60));
        const isFlatLaunch = Math.abs((panelModel?.yf ?? 0) - (panelModel?.yi ?? 0)) < 0.01;

        if (launchAngle > 0.1) {
            const launchY = Number.isFinite(panelModel?.launchSurfaceY) ? panelModel.launchSurfaceY : panelModel?.startY;
            const groundY = Number.isFinite(panelModel?.surfaceBaselineY) ? panelModel.surfaceBaselineY : launchY;
            const peakY = Number.isFinite(panelModel?.peakCanvasY) ? panelModel.peakCanvasY : launchY;
            const x = ((this.width - width) / 2) + xOffset;

            if (launchAngle <= 45) {
                if (isFlatLaunch && launchAngle < 40) {
                    return {
                        ...this.getPanelPosition({
                            placement: 'Top Center',
                            width,
                            height,
                            xOffset,
                            yOffset
                        }),
                        width,
                        height
                    };
                }

                const centerY = peakY / 2;
                const y = (centerY - (height / 2)) + yOffset;
                return {
                    ...this.clampPanelPosition(x, y, width, height),
                    width,
                    height
                };
            }

            const centerY = (groundY + peakY) / 2;
            const y = (centerY - (height / 2)) + yOffset;
            return {
                ...this.clampPanelPosition(x, y, width, height),
                width,
                height
            };
        }

        return {
            ...this.getPanelPosition({
                placement: this.inputs.equationPanelPlacement || 'Bottom Right',
                width,
                height,
                xOffset,
                yOffset
            }),
            width,
            height
        };
    }

    getCanvasTextScale() {
        return 1.5;
    }

    useSimpleProjectileXValues() {
        return Boolean(this.inputs.useProjectileXValues);
    }

    getXValueKeys() {
        if (this.useSimpleProjectileXValues()) {
            return ["displacement", "v", "t"];
        }

        return ["displacement", "v0", "v", "a", "t"];
    }

    getAxisPanelHeight(rowCount) {
        const uiScale = this.getCanvasTextScale();
        const isDense = rowCount > 5;
        const rowsTopOffset = (isDense ? 36 : 40) * uiScale;
        const rowHeight = (isDense ? 17 : 19) * uiScale;
        const bottomPadding = 14 * uiScale;
        return rowCount
            ? rowsTopOffset + ((rowCount - 0.5) * rowHeight) + bottomPadding
            : rowsTopOffset;
    }

    getEquationLines() {
        if (this.useSimpleProjectileXValues()) {
            return ['Δx = vt'];
        }

        const d = 'Δy';
        return [
            'v = v₀ + at',
            `${d} = v₀t + ½at²`,
            `v² = v₀² + 2a${d}`,
            `${d} = ½(v₀ + v)t`
        ];
    }

    getValuesPanelLayouts(xRowCount = 0, yRowCount = 0) {
        const uiScale = this.getCanvasTextScale();
        const width = 148 * uiScale;
        const xHeight = this.getAxisPanelHeight(xRowCount);
        const yHeight = this.getAxisPanelHeight(yRowCount);
        const layout = this.inputs.valuesPanelLayout || 'Current Layout';
        const offsetX = this.normalizeNumber(this.inputs.valuesPanelOffsetX, 0);
        const offsetY = this.normalizeNumber(this.inputs.valuesPanelOffsetY, 0);
        const gap = 8 * uiScale;

        if (layout === 'Left Stack') {
            const xPanel = this.getPanelPosition({ placement: 'Top Left', width, height: xHeight, xOffset: offsetX, yOffset: offsetY });
            const yPanel = this.clampPanelPosition(xPanel.x, xPanel.y + xHeight + gap, width, yHeight);
            return { xPanel, yPanel };
        }

        if (layout === 'Right Stack') {
            const xPanel = this.getPanelPosition({ placement: 'Top Right', width, height: xHeight, xOffset: offsetX, yOffset: offsetY });
            const yPanel = this.clampPanelPosition(xPanel.x, xPanel.y + xHeight + gap, width, yHeight);
            return { xPanel, yPanel };
        }

        if (layout === 'Bottom Corners') {
            return {
                xPanel: this.getPanelPosition({ placement: 'Bottom Left', width, height: xHeight, xOffset: offsetX, yOffset: offsetY }),
                yPanel: this.getPanelPosition({ placement: 'Bottom Right', width, height: yHeight, xOffset: offsetX, yOffset: offsetY })
            };
        }

        if (layout === 'Split Corners (X Top-Left)') {
            return {
                xPanel: this.getPanelPosition({ placement: 'Top Left', width, height: xHeight, xOffset: offsetX, yOffset: offsetY }),
                yPanel: this.getPanelPosition({ placement: 'Bottom Right', width, height: yHeight, xOffset: offsetX, yOffset: offsetY })
            };
        }

        if (layout === 'Split Corners (X Bottom-Left)') {
            return {
                xPanel: this.getPanelPosition({ placement: 'Bottom Left', width, height: xHeight, xOffset: offsetX, yOffset: offsetY }),
                yPanel: this.getPanelPosition({ placement: 'Top Right', width, height: yHeight, xOffset: offsetX, yOffset: offsetY })
            };
        }

        const xPanel = this.getPanelPosition({ placement: 'Top Left', width, height: xHeight, xOffset: offsetX, yOffset: offsetY });
        const yPanel = this.getPanelPosition({
            placement: 'Top Right',
            width,
            height: yHeight,
            xOffset: offsetX,
            yOffset: offsetY
        });
        return { xPanel, yPanel };
    }

    getAccelerationAnchor(model) {
        const placement = this.inputs.accelerationPlacement || 'Auto';
        let point;

        if (placement === 'Near Object') {
            point = { x: model.canvasX - 34, y: model.canvasY };
        } else if (placement === 'Above Arc') {
            point = {
                x: Math.min(this.width - 120, Math.max(85, model.peakCanvasX + 60)),
                y: Math.max(55, model.peakCanvasY - 100)
            };
        } else if (placement === 'Left Side') {
            point = {
                x: Math.max(70, model.startX - 70),
                y: Math.max(70, (model.startY + model.endY) / 2)
            };
        } else if (placement === 'Right Side') {
            point = {
                x: Math.min(this.width - 90, Math.max(model.endX + 70, model.peakCanvasX + 70)),
                y: Math.max(70, (model.startY + model.endY) / 2)
            };
        } else if (placement === 'Below Motion') {
            point = {
                x: Math.min(this.width - 100, Math.max(100, model.canvasX)),
                y: Math.min(this.height - 130, model.baselineY - 20)
            };
        } else {
            point = { x: model.canvasX - 34, y: model.canvasY };
        }

        point.x += this.normalizeNumber(this.inputs.accelerationOffsetX, 0);
        point.y += this.normalizeNumber(this.inputs.accelerationOffsetY, 0);
        return point;
    }

    getVectorBreakdownStage(model) {
        if (model.isInFinalVelocityZoom && model.finalVectorDuration > 0) {
            const progress = (model.visualTime - model.finalVectorStartTime) / model.finalVectorDuration;
            if (progress < 0.167) return 'final-zoom-vx';
            if (progress < 0.333) return 'final-zoom-vy';
            if (progress < 0.500) return 'final-zoom-tail-head';
            if (progress < 0.667) return 'final-zoom-resultant';
            if (progress < 0.833) return 'final-zoom-speed';
            return 'final-zoom-angle';
        }

        if (!model.isInVectorBreakdown || model.breakdownDuration <= 0) return null;

        const progress = model.visualTime / model.breakdownDuration;
        if (progress < 0.28) return 'vector';
        if (progress < 0.52) return 'triangle';
        if (progress < 0.82) return 'labels';
        return 'equations';
    }

    isOverlayTime(model) {
        return this.inputs.timingMode === 'Always' ||
            (this.inputs.timingMode === 'At End' && model.isFinished) ||
            (this.inputs.timingMode === 'At Max Height' && model.isAtPeak) ||
            (this.inputs.timingMode === 'At Custom Time' && model.isAtCustom);
    }

    isFinalVelocityZoomStage(stage) {
        return typeof stage === 'string' && stage.startsWith('final-zoom-');
    }

    easeInOut(t) {
        const p = this.clamp(t, 0, 1);
        return p * p * (3 - (2 * p));
    }

    buildZoomCamera(targetX, targetY, pan) {
        const worldMinX = Math.min(0, targetX - 40);
        const worldMaxX = Math.max(this.width, targetX + this.width + 120);
        return {
            x: targetX * pan,
            y: targetY * pan,
            targetX,
            targetY,
            worldMinX,
            worldMaxX,
            worldWidth: worldMaxX - worldMinX,
            worldHeight: Math.max(this.height, targetY + this.height + 120)
        };
    }

    getInitialVectorBreakdownGeometry(model) {
        const anchorX = model.startX;
        const anchorY = model.startY;
        const scale = this.getVelocityBreakdownScale(model.vix, model.viy, { zoom: true });
        const vxLen = model.vix * scale;
        const vyLen = -model.viy * scale;
        const tipX = anchorX + vxLen;
        const tipY = anchorY + vyLen;
        const projX = anchorX + vxLen;
        const projY = anchorY;
        const padX = Math.max(115, this.width * 0.16);
        const padY = Math.max(95, this.height * 0.18);
        const minX = Math.min(anchorX, projX, tipX) - padX;
        const maxX = Math.max(anchorX, projX, tipX) + padX;
        const minY = Math.min(anchorY, projY, tipY) - padY;
        const maxY = Math.max(anchorY, projY, tipY) + padY;

        return {
            anchorX,
            anchorY,
            scale,
            vxLen,
            vyLen,
            tipX,
            tipY,
            projX,
            projY,
            minX,
            maxX,
            minY,
            maxY,
            centerX: (minX + maxX) / 2,
            centerY: (minY + maxY) / 2,
            componentLength: Math.hypot(vxLen, vyLen)
        };
    }

    getVectorBreakdownCamera(model, stage) {
        if (this.isFinalVelocityZoomStage(stage)) {
            const sequenceProgress = model.finalVectorDuration > 0
                ? (model.visualTime - model.finalVectorStartTime) / model.finalVectorDuration
                : 1;
            const pan = this.easeInOut(sequenceProgress / 0.14);
            const targetX = model.endX - (this.width / 2);
            const targetY = model.endY - (this.height / 2);
            return this.buildZoomCamera(targetX, targetY, pan);
        }

        if (model.isInVectorBreakdown && model.breakdownDuration > 0) {
            const sequenceProgress = model.visualTime / model.breakdownDuration;
            const pan = this.easeInOut(sequenceProgress / 0.18);
            const geometry = this.getInitialVectorBreakdownGeometry(model);
            const targetX = Math.max(0, geometry.centerX - (this.width / 2));
            const targetY = geometry.centerY - (this.height / 2);
            return this.buildZoomCamera(targetX, targetY, pan);
        }

        return { x: 0, y: 0, worldWidth: this.width, worldHeight: this.height };
    }

    getFinalVelocityWorkspace(model, vxLen, vyLen, camera) {
        return {
            originX: model.endX,
            originY: model.endY
        };
    }

    getVelocityBreakdownScale(xComponent, yComponent, { zoom = true } = {}) {
        const safeX = Math.max(1, Math.abs(xComponent));
        const safeY = Math.max(1, Math.abs(yComponent));
        const baseScale = zoom
            ? Math.min(5.6, (this.width * 0.26) / safeX, (this.height * 0.31) / safeY)
            : Math.min(4.4, 145 / safeX, 105 / safeY);
        return baseScale * 1.2 * this.getVectorDrawingScale();
    }

    shouldDrawFinalVelocityPoliceman(model, isFinalVelocityZoom) {
        if (model.isInVectorBreakdown || isFinalVelocityZoom) return false;
        const hoverKey = this.hoveredValueKey;
        return typeof hoverKey === 'string' && hoverKey.split(':')[1] === 'v';
    }

    
    getVectorWorldCanvas(camera) {
        const width = Math.ceil(camera.worldWidth || this.width);
        const height = Math.ceil(camera.worldHeight || this.height);

        if (!this.vectorWorldCanvas) {
            this.vectorWorldCanvas = document.createElement('canvas');
        }

        if (this.vectorWorldCanvas.width !== width || this.vectorWorldCanvas.height !== height) {
            this.vectorWorldCanvas.width = width;
            this.vectorWorldCanvas.height = height;
        }

        const worldCtx = this.vectorWorldCanvas.getContext('2d');
        worldCtx.setTransform(1, 0, 0, 1, 0, 0);
        worldCtx.clearRect(0, 0, width, height);

        return { canvas: this.vectorWorldCanvas, ctx: worldCtx };
    }

    drawProjectileWorld(ctx, model, overlayTime, isFinalVelocityZoom) {
        this.drawScenarioTerrain(ctx, model);

        if (!isFinalVelocityZoom) {
            this.drawLaunchCannon(ctx, model);
        }

        if (!model.isInVectorBreakdown || isFinalVelocityZoom) {
            this.drawTrajectory(ctx, model);
        }

        if (this.inputs.showGhostFrames && !model.isInVectorBreakdown) {
            this.drawGhostFrames(ctx, model);
        }

        if ((this.inputs.showXDisplacementGhosts || this.inputs.showYDisplacementGhosts) && !model.isInVectorBreakdown) {
            this.drawDisplacementGhostPositions(ctx, model);
        }

        if (this.inputs.showDropPlaneGuide && model.scenarioType === "Moving Drop / Airplane") {
            this.drawDropPlaneGuide(ctx, model);
        }

        const isWAHighlight = model.isInWorkAnalysisSequence && this.shouldHighlightWorkAnalysisDiagram();
        const isWalkthroughOverlayActive = Boolean(this.activeWalkthroughStep);

        if (this.inputs.showDistanceMarkers && this.inputs.rulerStyle !== "None" && !model.isInVectorBreakdown && !isWAHighlight) {
            this.drawDistanceTools(ctx, model);
        }

        if (this.inputs.showMaxHeight && overlayTime && !model.isInVectorBreakdown && !isWAHighlight) {
            this.drawMaxHeightMarker(ctx, model);
        }

        if (this.inputs.showProblemLabels || this.inputs.showGhostFrames || this.inputs.showXDisplacementGhosts || this.inputs.showYDisplacementGhosts || isFinalVelocityZoom) {
            this.drawObject(ctx, model.startX, model.startY, this.inputs.objectType, 0.28, model);
            this.drawObject(ctx, model.endX, model.endY, this.inputs.objectType, 0.28, model);
        }

        if (this.inputs.showInitialVelocityVector && !this.inputs.showProblemLabels && !model.isInVectorBreakdown && !isFinalVelocityZoom && !this.isWorkAnalysisLaunchComponentStep(model) && !isWalkthroughOverlayActive) {
            this.drawInitialVelocityVector(ctx, model);
        }

        if (isFinalVelocityZoom) {
            this.drawObject(ctx, model.endX, model.endY, this.inputs.objectType, 1, model);
        } else {
            this.drawObject(ctx, model.canvasX, model.canvasY, this.inputs.objectType, 1, model);
        }

        if (model.isInVectorBreakdown && !isFinalVelocityZoom) {
            this.drawVectorBreakdownIntro(ctx, model);
        }

        // NEW: Draw our animations!
        if (this.shouldDrawFinalVelocityPoliceman(model, isFinalVelocityZoom)) {
            this.drawPoliceman(ctx, model);
        }

        if (!isFinalVelocityZoom && !isWAHighlight) {
            this.drawPhysicsVectors(ctx, model);
        }

        if (this.inputs.showProblemLabels && overlayTime && !isWAHighlight && !isWalkthroughOverlayActive) {
            this.drawProblemLabels(ctx, model);
        }

        if (!isFinalVelocityZoom) {
            this.drawVariableList(ctx, model);
        }

        if (this.inputs.showComponents && overlayTime && !model.isFinished && !model.isInVectorBreakdown && !isFinalVelocityZoom && !isWalkthroughOverlayActive) {
            this.drawComponents(ctx, model);
        }

        if (this.inputs.showEquations && overlayTime && !isFinalVelocityZoom) {
            this.drawEquationPanel(ctx, model);
        }

        if (model.isInWorkAnalysisSequence) {
            const state = this.getWorkAnalysisSequenceState(model);
            if (state && this.shouldHighlightWorkAnalysisDiagram()) {
                this.drawWorkAnalysisHighlights(ctx, model, state.step);
            }
            if (this.shouldDrawWorkAnalysisCanvas() || state?.step?.liveEquation) {
                this.drawWorkAnalysisSequence(ctx, model);
            }
        }
    }

    drawFrame(ctx, time) {
        this.clearCanvasAnchors();
        const originalHeight = this.height;
        const problemHeaderLayout = this.getCanvasProblemHeaderLayout(ctx);

        if (problemHeaderLayout.height > 0) {
            this.height = Math.max(260, originalHeight - problemHeaderLayout.height);
            ctx.save();
            try {
                ctx.translate(0, problemHeaderLayout.height);
                this.drawSceneFrame(ctx, time);
            } finally {
                ctx.restore();
                this.height = originalHeight;
            }
            this.drawCanvasProblemHeader(ctx, problemHeaderLayout);
            this.drawProblemValueTransferAnimation(ctx, time, problemHeaderLayout.height);
            return;
        }

        this.drawSceneFrame(ctx, time);
    }

    drawSceneFrame(ctx, time) {
        const model = this.computeProjectileModel(time);
        const overlayTime = this.isOverlayTime(model);
        const vectorStage = this.getVectorBreakdownStage(model);
        const isFinalVelocityZoom = this.isFinalVelocityZoomStage(vectorStage);
        const camera = this.getVectorBreakdownCamera(model, vectorStage);
        model.vectorBreakdownStage = vectorStage;
        model.vectorBreakdownCamera = camera;
        model.worldWidth = camera.worldWidth;
        model.worldHeight = camera.worldHeight;
        this.latestModel = model;
        this.latestOverlayTime = overlayTime;

        if (isFinalVelocityZoom) {
            ctx.save();
            this.drawWorldBackground(ctx, { worldWidth: this.width, worldHeight: this.height });
            model.worldMinX = camera.x - 80;
            model.worldMaxX = camera.x + this.width + 80;
            model.worldHeight = camera.y + this.height + 120;
            ctx.translate(-camera.x, -camera.y);
            this.drawProjectileWorld(ctx, model, overlayTime, isFinalVelocityZoom);
            this.drawFinalVelocityBreakdown(ctx, model, vectorStage);
            ctx.restore();
        } else {
            ctx.save();
            ctx.translate(-camera.x, -camera.y);
            this.drawWorldBackground(ctx, camera);
            this.drawProjectileWorld(ctx, model, overlayTime, isFinalVelocityZoom);
            const suppressVectorBreakdownOverlay = model.isInVectorBreakdown
                && (this.activeWalkthroughStep?.id === 'vector-breakdown' || this.activeWalkthroughStep?.id === 'components');
            if (this.activeWalkthroughStep && !suppressVectorBreakdownOverlay) {
                drawWalkthroughOverlay.call(this, ctx, model, this.activeWalkthroughStep);
            }
            ctx.restore();
        }

        if (model.isInVectorBreakdown && this.activeWalkthroughStep?.id === 'vector-breakdown') {
            this.drawVectorBreakdownNarrationPanel(ctx, model);
        }

        if (this.hoveredValueKey && !model.isInVectorBreakdown && !isFinalVelocityZoom) {
            this.drawHoverVariableAnimation(ctx, model);
        }

        if (this.inputs.showTimerDisplay && !isFinalVelocityZoom) {
            this.drawTimer(ctx, model);
        }
    }

    // ── Step settings panel ──────────────────────────────────────────────────

    _getStepSettingsTypeKey() {
        return String(this.getWorkAnalysisProblemTypeNumber(this.inputs.workAnalysisProblemType) || 'auto');
    }

    _getStepSettingsTypeTitle() {
        const typeNumber = this.getWorkAnalysisProblemTypeNumber(this.inputs.workAnalysisProblemType);
        if (!typeNumber) return 'Problem Type: Auto';
        const defs = this.getWorkAnalysisProblemTypeDefinitions();
        return defs[typeNumber]?.title || `Problem Type ${typeNumber}`;
    }

    _ensureStepSettingsState() {
        if (!this._stepSettingsState) {
            const typeKey = this._getStepSettingsTypeKey();
            const stepSettings = loadStepSettings(typeKey);
            const model = this.computeProjectileModel(0);
            const pType = this.getSelectedWorkAnalysisProblemType(model);
            const currentSteps = Kinematics2dWorkAnalysis.getConfiguredWorkAnalysisSteps(model, pType);
            this._stepSettingsState = {
                activeStepId:  currentSteps[0]?.id || null,
                typeKey,
                typeTitle:     this._getStepSettingsTypeTitle(),
                stepSettings,
                currentSteps,
            };
        }
        return this._stepSettingsState;
    }

    _refreshStepSettingsPanel() {
        if (!this.moduleExtension) return;
        const state = this._ensureStepSettingsState();
        state.typeKey   = this._getStepSettingsTypeKey();
        state.typeTitle = this._getStepSettingsTypeTitle();
        const model = this.computeProjectileModel(0);
        const pType = this.getSelectedWorkAnalysisProblemType(model);
        state.currentSteps = Kinematics2dWorkAnalysis.getConfiguredWorkAnalysisSteps(model, pType);
        if (!state.currentSteps.find(s => s.id === state.activeStepId)) {
            state.activeStepId = state.currentSteps[0]?.id || null;
        }

        this.moduleExtension.classList.remove('hidden');
        const currentStepState = this.getStepState(state.currentSteps);
        state.activeStepId = state.currentSteps[currentStepState.stepIndex]?.id || state.currentSteps[0]?.id || null;
        this.moduleExtension.innerHTML = `
            <div class="module-extension__header">
                <div>
                    <div class="module-extension__title">Step Settings</div>
                    <div class="module-extension__subtitle">Saved per step for ${state.typeTitle}</div>
                </div>
            </div>
            <div id="stepSettingsRoot">
                ${buildStepSettingsPanel(state)}
            </div>
        `;
        bindStepSettingsPanelEvents(this.moduleExtension, state, {
            onStepTab: (stepId) => {
                const stepIdx = state.currentSteps.findIndex(step => step.id === stepId);
                if (stepIdx < 0) return;
                state.activeStepId = stepId;
                this.stepState = this.createStepState({ stepIndex: stepIdx });
                this.renderStepPreview(state.currentSteps);
                this._refreshStepSettingsPanel();
            },
            onAction: (action) => {
                if (action === 'play') {
                    this.playWalkthroughStepAnimation(state.currentSteps, this.getStepState(state.currentSteps).stepIndex);
                    return;
                }
                this.handleStepAction(action === 'reset-index' ? 'reset' : action, state.currentSteps);
            },
            onExport: async (format) => {
                const current = this.getStepState(state.currentSteps).stepIndex;
                try {
                    await this.exportWalkthroughStep(state.currentSteps, current, format);
                } catch (err) {
                    const statusEl = document.getElementById('status');
                    if (statusEl) statusEl.innerText = `Export failed: ${err?.message || err}`;
                    console.error('Step export failed:', err);
                }
                this.renderStepPreview(state.currentSteps);
            },
            onExportAll: async (format) => {
                try {
                    await this.exportAllWalkthroughSteps(state.currentSteps, format);
                } catch (err) {
                    const statusEl = document.getElementById('status');
                    if (statusEl) statusEl.innerText = `Export failed: ${err?.message || err}`;
                    console.error('Step export-all failed:', err);
                }
                this.renderStepPreview(state.currentSteps);
            },
            onSettingChange: () => {
                saveStepSettings(state.typeKey, state.stepSettings);
                const current = this.getStepState(state.currentSteps).stepIndex;
                state.activeStepId = state.currentSteps[current]?.id || state.activeStepId;
                this.renderStepPreview(state.currentSteps);
            },
            onSaveDefaults: () => {
                saveStepSettingsDefaults(state.stepSettings);
                const statusEl = document.getElementById('status');
                if (statusEl) {
                    statusEl.innerText = 'Step settings saved as global default.';
                    setTimeout(() => {
                        if (statusEl.innerText.includes('Step settings saved')) statusEl.innerText = 'System Ready';
                    }, 2000);
                }
            },
            onResetSetting: () => {
                if (state.activeStepId) delete state.stepSettings[state.activeStepId];
                saveStepSettings(state.typeKey, state.stepSettings);
                this.renderStepPreview(state.currentSteps);
                this._refreshStepSettingsPanel();
            }
        });
    }

    syncExternalPanels({ force = false } = {}) {
        if (!this.moduleExtension) return;
        // Only initialise the panel once; subsequent draw calls don't re-render it
        // (avoids losing focused input state while the canvas redraws).
        if (force || !this._stepSettingsPanelReady) {
            this._stepSettingsPanelReady = true;
            this._refreshStepSettingsPanel();
        }
    }

    // Reload the sequence panel from scratch (call when problem type changes).
    resetStepSettingsPanel() {
        this._stepSettingsState = null;
        this._stepSettingsPanelReady = false;
        this._refreshStepSettingsPanel();
    }

    getScenarioStepX(model) {
        if (!Number.isFinite(model.endX) || model.endX <= model.startX) return model.startX;

        if (model.scenarioType === "Lower Landing / Cliff") {
            return Math.min(model.startX + 50, model.startX + (model.endX - model.startX) * 0.5);
        }

        if (model.scenarioType === "Higher Landing") {
            return Math.max(model.endX - 50, model.startX + (model.endX - model.startX) * 0.5);
        }

        return (model.startX + model.endX) / 2;
    }

    _getTrajectoryPoints(model) {
        const key = [
            model.tFlight, model.vix, model.viy, model.yi,
            model.g, model.scenarioType, model.releaseTime
        ].join('|');

        if (this._trajectoryCache && this._trajectoryCache.key === key) {
            return this._trajectoryCache.points;
        }

        const steps = Math.max(10, Math.ceil(model.tFlight * 30));
        const points = [];
        for (let i = 0; i <= steps; i++) {
            const t = (model.tFlight * i) / steps;
            const { x, y } = this.getPositionAtTime(t, model);
            points.push({ x, y, t });
        }

        this._trajectoryCache = { key, points };
        return points;
    }

    // --- Hover Variable Animations ---

    handleCanvasValuePointerMove(event) {
        const prevKey = this.hoveredValueKey;
        super.handleCanvasValuePointerMove(event);
        if (this.hoveredValueKey !== prevKey) {
            this._hoverAnimStartMs = performance.now();
            if (this.hoveredValueKey) {
                // Mouse hover takes over — clear step hover context so the loop
                // draws the generic preview (no step overlays, time = 10).
                this._cleanupStepHoverPreview();
                if (!this.isPlaying) this._startHoverLoop();
            } else {
                this._stopHoverLoop();
            }
        }
    }

    handleCanvasValuePointerLeave() {
        super.handleCanvasValuePointerLeave();
        this._stopHoverLoop();
    }

    stopPreview() {
        this._cleanupStepHoverPreview();
        super.stopPreview();
        if (this.hoveredValueKey) {
            this._hoverAnimStartMs = performance.now();
            this._startHoverLoop();
        }
    }

    _cleanupStepHoverPreview() {
        if (this._stepHoverRestoreInputs) {
            this._stepHoverRestoreInputs();
            this._stepHoverRestoreInputs = null;
        }
        this.activeWalkthroughStep = null;
        this._hoverPreviewTime = null;
        this._stopHoverLoop();
    }

    _startHoverLoop() {
        this._stopHoverLoop();
        const loopToken = this._hoverLoopToken;
        const draw = () => {
            if (loopToken !== this._hoverLoopToken || !this.hoveredValueKey || this.isPlaying || !this.ctx) {
                this._hoverRafId = null;
                return;
            }

            try {
                const bg = (this.kinematicsTheme && this.kinematicsTheme.backgroundColor) || '#e0f2fe';
                this.ctx.fillStyle = bg;
                this.ctx.fillRect(0, 0, this.width, this.height);
                this.drawFrame(this.ctx, this._hoverPreviewTime ?? 10);
            } catch (error) {
                console.error('Hover animation render failed', error);
                this._stopHoverLoop();
                return;
            }

            if (loopToken !== this._hoverLoopToken) {
                this._hoverRafId = null;
                return;
            }

            this._hoverRafId = requestAnimationFrame(draw);
        };
        this._hoverRafId = requestAnimationFrame(draw);
    }

    _stopHoverLoop() {
        this._hoverLoopToken += 1;
        if (this._hoverRafId) { cancelAnimationFrame(this._hoverRafId); this._hoverRafId = null; }
    }

    drawVariableList(ctx, model) {
        const mode = this.inputs.listDisplay || "Hidden";
        if (mode === "Hidden") return;

        const includeValue = mode === "Values";
        const xKeyVisible = {
            displacement: this.inputs.xPanelShowDisplacement !== false,
            v0:           this.inputs.xPanelShowV0 !== false,
            v:            this.inputs.xPanelShowV !== false,
            a:            this.inputs.xPanelShowA !== false,
            t:            this.inputs.xPanelShowT !== false
        };
        const yKeyVisible = {
            displacement: this.inputs.yPanelShowDisplacement !== false,
            hmax:         this.inputs.yPanelShowHmax !== false,
            v0:           this.inputs.yPanelShowV0 !== false,
            v:            this.inputs.yPanelShowV !== false,
            a:            this.inputs.yPanelShowA !== false,
            t:            this.inputs.yPanelShowT !== false
        };
        const xRows = this.getXValueKeys().filter(k => xKeyVisible[k] !== false).map(key => ({
            text: this.getAxisVarLabel("x", key, model, includeValue),
            axis: "x",
            key,
            valueText: includeValue ? this.getValueTextFromRow(this.getAxisVarLabel("x", key, model, includeValue)) : "",
            anchorId: `value:x:${key}:row`,
            valueAnchorId: includeValue ? `value:x:${key}` : null,
            focusKeys: this.getAxisValueFocusKeys("x", key)
        }));
        const yRows = ["displacement", "hmax", "v0", "v", "a", "t"]
            .filter(k => yKeyVisible[k] !== false)
            .map(key => ({
                text: this.getAxisVarLabel("y", key, model, includeValue),
                axis: "y",
                key,
                valueText: includeValue ? this.getValueTextFromRow(this.getAxisVarLabel("y", key, model, includeValue)) : "",
                anchorId: `value:y:${key}:row`,
                valueAnchorId: includeValue ? `value:y:${key}` : null,
                focusKeys: this.getAxisValueFocusKeys("y", key)
            }));

        const panelLayout = this.getValuesPanelLayouts(xRows.length, yRows.length);
        const panelWidth = 148 * this.getCanvasTextScale();

        if (this.inputs.showXValuesPanel) {
            this.drawAxisValuePanel(ctx, {
                title: "X Values",
                rows: xRows,
                x: panelLayout.xPanel.x,
                y: panelLayout.xPanel.y,
                width: panelWidth,
                model
            });
        }

        if (this.inputs.showYValuesPanel) {
            this.drawAxisValuePanel(ctx, {
                title: "Y Values",
                rows: yRows,
                x: panelLayout.yPanel.x,
                y: panelLayout.yPanel.y,
                width: panelWidth,
                model
            });
        }
    }

    getAxisValueFocusKeys(axis, key) {
        if (key === "displacement") return axis === "x" ? ['dx'] : ['dy'];
        if (key === "hmax") return ['hmax'];
        if (key === "v0") return axis === "x" ? ['v0x'] : ['v0y'];
        if (key === "v") return axis === "x" ? ['vx', 'v0x'] : ['vy', 'finalV'];
        if (key === "a") return axis === "x" ? ['ax'] : ['ay'];
        if (key === "t") return ['time'];
        return [key];
    }

    getAxisVarLabel(axis, key, model, includeValue = true) {
        const symbol = this.getAxisSymbol(axis, key, model);
        if (!includeValue) return `${symbol} =`;

        const isX = axis === "x";
        const dy = model.yf - model.yi;
        const valueMap = {
            displacement: {
                unknown: isX ? this.inputs.unknownDx : this.inputs.unknownDy,
                value: isX ? model.range : dy,
                unit: "m"
            },
            hmax: {
                unknown: this.inputs.unknownHmax,
                value: model.yPeak - model.yi,
                unit: "m"
            },
            v0: {
                unknown: isX
                    ? this.inputs.unknownInitialVx
                    : this.inputs.unknownInitialVy,
                value: isX ? model.vix : model.viy,
                unit: "m/s"
            },
            v: {
                unknown: isX
                    ? this.inputs.unknownFinalVx
                    : this.inputs.unknownFinalVy,
                value: isX ? model.vix : model.finalVy,
                unit: "m/s"
            },
            a: {
                unknown: false,
                value: isX ? 0 : -model.g,
                unit: "m/s²"
            },
            t: {
                unknown: this.inputs.unknownTime,
                value: model.tFlight,
                unit: "s"
            }
        };

        const item = valueMap[key];
        if (!item) return `${symbol} = ?`;
        if (item.unknown && !this.isAxisValueSolvedByWork(axis, key, model)) return `${symbol} = ?`;
        return `${symbol} = ${this.formatNumber(item.value)} ${item.unit}`;
    }

    drawVectorBreakdownIntro(ctx, model) {
        const stage = this.getVectorBreakdownStage(model);
        if (!stage) return;

        const vectorScale = this.getVectorDrawingScale();
        const {
            anchorX,
            anchorY,
            tipX,
            tipY,
            projX,
            projY,
            componentLength
        } = this.getInitialVectorBreakdownGeometry(model);
        const angleArcRadius = this.clamp(componentLength * 0.18, 34 * vectorScale, 58 * vectorScale);
        const showBreakdownValues = Boolean(this.inputs.showComponents);
        const vectorBreakdownLabelShiftX = -(this.width * 0.03);
        const displayV0Label = `v₀ = ${model.vi.toFixed(1)} m/s`;
        const displayAngleLabel = `θ = ${model.angleDeg.toFixed(0)}°`;

        ctx.save();
        const componentVxLabel = stage === 'equations'
            ? 'v₀x = v₀ cos θ'
            : (showBreakdownValues ? `v₀x = ${this.inputs.unknownInitialVx ? "?" : `${model.vix.toFixed(1)} m/s`}` : 'v₀x');
        const componentVyLabel = stage === 'equations'
            ? 'v₀y = v₀ sin θ'
            : (showBreakdownValues ? `v₀y = ${this.inputs.unknownInitialVy ? "?" : `${model.viy.toFixed(1)} m/s`}` : 'v₀y');
        this.drawArrow(ctx, anchorX, anchorY, tipX, tipY, "#1d4ed8", 5, { headSize: 16 * vectorScale });
        this.drawTextLabel(ctx, ((anchorX + tipX) / 2) - 6 + vectorBreakdownLabelShiftX, ((anchorY + tipY) / 2) - (24 * vectorScale), displayV0Label, {
            font: "bold 13px serif",
            fill: "#1d4ed8",
            background: "rgba(255,255,255,0.9)"
        });

        if (Math.abs(model.angleDeg) > 0.1) {
            this.drawAngleArc(ctx, anchorX, anchorY, model.angleDeg, angleArcRadius, displayAngleLabel, {
                labelOffsetX: vectorBreakdownLabelShiftX
            });
        }

        if (stage === 'triangle' || stage === 'equations' || stage === 'labels') {
            ctx.save();
            ctx.strokeStyle = "rgba(59, 130, 246, 0.55)";
            ctx.lineWidth = 2;
            ctx.setLineDash([7, 5]);
            ctx.beginPath();
            ctx.moveTo(anchorX, anchorY);
            ctx.lineTo(projX, projY);
            ctx.lineTo(tipX, tipY);
            ctx.stroke();
            ctx.restore();
        }

        if (stage === 'equations' || stage === 'labels') {
            this.drawArrow(ctx, anchorX, anchorY, projX, projY, "#b91c1c", 4, { headSize: 14 * vectorScale });
            this.drawArrow(ctx, projX, projY, tipX, tipY, "#047857", 4, { headSize: 14 * vectorScale });

            this.drawTextLabel(ctx, ((anchorX + projX) / 2) + vectorBreakdownLabelShiftX, anchorY + (28 * vectorScale), componentVxLabel, {
                font: "bold 12px serif",
                fill: "#b91c1c",
                background: "rgba(255,255,255,0.9)"
            });

            this.drawTextLabel(ctx, projX + (44 * vectorScale) + vectorBreakdownLabelShiftX, (projY + tipY) / 2, componentVyLabel, {
                font: "bold 12px serif",
                fill: "#047857",
                background: "rgba(255,255,255,0.9)"
            });
        }

        ctx.restore();
    }

    drawVectorBreakdownNarrationPanel(ctx, model) {
        const stage = this.getVectorBreakdownStage(model);
        if (!stage || stage.startsWith('final-zoom-')) return;

        const uiScale = this.getCanvasTextScale();
        const vxStr = this.inputs.unknownInitialVx ? '?' : `${model.vix.toFixed(1)} m/s`;
        const vyStr = this.inputs.unknownInitialVy ? '?' : `${model.viy.toFixed(1)} m/s`;
        const viStr = this.inputs.unknownInitialVelocity ? '?' : model.vi.toFixed(1);
        const thetaStr = this.inputs.unknownTheta ? '?' : `${model.angleDeg.toFixed(0)}°`;

        const stageData = {
            vector: {
                step: 1, title: 'Launch Velocity', accent: '#1d4ed8',
                lines: [
                    `v₀ = ${viStr} m/s at θ = ${thetaStr}`,
                    'The launch speed and angle together',
                    'describe the initial velocity vector.'
                ]
            },
            triangle: {
                step: 2, title: 'Right Triangle', accent: '#3b82f6',
                lines: [
                    'v₀ is the hypotenuse. The two legs are',
                    'the horizontal component (red)',
                    'and the vertical component (green).'
                ]
            },
            labels: {
                step: 3, title: 'Component Values', accent: '#b91c1c',
                lines: [
                    `v₀x = ${vxStr}  (horizontal — red)`,
                    `v₀y = ${vyStr}  (vertical — green)`,
                    'The components act independently:',
                    'no x-acceleration, constant y-acceleration.'
                ]
            },
            equations: {
                step: 4, title: 'Trig Equations', accent: '#7c3aed',
                lines: [
                    'v₀x = v₀ cos θ',
                    'v₀y = v₀ sin θ',
                    `Result: v₀x = ${vxStr},  v₀y = ${vyStr}`
                ]
            }
        };

        const stageOrder = ['vector', 'triangle', 'labels', 'equations'];
        const stageIndex = stageOrder.indexOf(stage);
        const info = stageData[stage];
        if (!info) return;

        const lineH = 17 * uiScale;
        const panelWidth = 265 * uiScale;
        const panelHeight = (57 + (info.lines.length * lineH) + 20) * uiScale;
        const margin = 16 * uiScale;
        const x = this.width - panelWidth - margin;
        const y = this.height - panelHeight - margin;

        ctx.save();
        ctx.shadowColor = 'rgba(15,23,42,0.13)';
        ctx.shadowBlur = this.isSvgExporting ? 0 : 7;
        ctx.fillStyle = 'rgba(255,255,255,0.96)';
        ctx.strokeStyle = 'rgba(15,23,42,0.13)';
        ctx.lineWidth = 1.1 * uiScale;
        this.roundRectPath(ctx, x, y, panelWidth, panelHeight, 10 * uiScale);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.fillStyle = info.accent;
        this.roundRectPath(ctx, x, y, 7 * uiScale, panelHeight, 10 * uiScale);
        ctx.fill();

        const tx = x + 16 * uiScale;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        ctx.fillStyle = info.accent;
        ctx.font = this.scaleFontString('800 9.5px Inter, sans-serif');
        ctx.fillText(`STAGE ${info.step} OF 4`, tx, y + 15 * uiScale);

        ctx.fillStyle = '#0f172a';
        ctx.font = this.scaleFontString('700 13px Inter, sans-serif');
        ctx.fillText(info.title, tx, y + 31 * uiScale);

        ctx.fillStyle = '#1e293b';
        ctx.font = this.scaleFontString("11.5px 'Cambria Math','Times New Roman',Georgia,serif");
        info.lines.forEach((line, i) => {
            ctx.fillText(line, tx, y + 48 * uiScale + (i * lineH));
        });

        const dotsY = y + panelHeight - 12 * uiScale;
        const dotGap = 13 * uiScale;
        stageOrder.forEach((_, i) => {
            ctx.beginPath();
            ctx.arc(tx + (i * dotGap), dotsY, (i <= stageIndex ? 4.5 : 3) * uiScale, 0, Math.PI * 2);
            ctx.fillStyle = i <= stageIndex ? info.accent : 'rgba(148,163,184,0.45)';
            ctx.fill();
        });

        ctx.restore();
    }

    getAxisSymbol(axis, key, model) {
        if (key === "displacement") {
            if (axis === "x") return "Δx";
            return "Δy";
        }
        if (key === "hmax") return "hₘₐₓ";
        if (key === "v0") return axis === "x" ? "v₀ₓ" : "v₀ᵧ";
        if (key === "v") {
            if (axis === "x" && this.useSimpleProjectileXValues()) return "v";
            return axis === "x" ? "vₓ" : "vᵧ";
        }
        if (key === "a") return axis === "x" ? "aₓ" : "aᵧ";
        return key;
    }

}

Object.assign(Module2DKinematics.prototype, hoverAnimationMethods);
Object.assign(Module2DKinematics.prototype, walkthroughInteractionMethods);
Object.assign(Module2DKinematics.prototype, stepExportMethods);
Object.assign(Module2DKinematics.prototype, stepRendererMethods);
Object.assign(Module2DKinematics.prototype, problemRendererMethods);
Object.assign(Module2DKinematics.prototype, sceneRendererMethods);
Object.assign(Module2DKinematics.prototype, uiRendererMethods);
