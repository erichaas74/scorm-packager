import KinematicsModuleBase from './kinematics.js';
import * as Kinematics2dWorkAnalysis from './Kinematics2dWorkAnalysis.js';
import { drawWalkthroughOverlay } from './Kinematics2dWalkthroughOverlays.js';
import hoverAnimationMethods from './Kinematics2dHoverAnimations.js';
import walkthroughInteractionMethods from './Kinematics2dWalkthroughInteraction.js';
import problemRendererMethods from './Kinematics2dProblemRenderer.js';
import sceneRendererMethods from './Kinematics2dSceneRenderer.js';
import uiRendererMethods from './Kinematics2dUIRenderer.js';

export default class Module2DKinematics extends KinematicsModuleBase {
    constructor(canvasId) {
        super(canvasId, { duration: 4, fps: 30 });

        this.scale = 7;
        this.originX = 60;
        this.groundY = this.height - 32;
        this.airplaneReleaseFraction = 0.1;
        this.vectorBreakdownDuration = 6.2;
        this.workSequenceState = this.createWorkSequenceState();
        this.advtrajectoryCache = null;
        this._hoverRafId = null;
        this._hoverLoopToken = 0;
        this._hoverAnimStartMs = 0;
    }

    init() {
        this.setupInputs('controls', {
            "Problem Statement": {
                sampleProblem2d: {
                    label: "Sample 2D Problem",
                    type: "select",
                    options: this.getSampleProblemOptions(),
                    value: "Custom / None"
                },
                problemStatement: {
                    label: "Problem Text For Preview",
                    type: "textarea",
                    value: "",
                    rows: 5,
                    livePreview: true,
                    placeholder: "Paste or write the full 2D projectile problem here. It will replace the generic preview title."
                },
                animateGivenValues: { label: "Animate Given Values Into Cards", type: "checkbox", value: true }
            },
            "Physics Parameters": {
                workAnalysisProblemType: {
                    label: "Problem Type: Given Variables",
                    type: "select",
                    options: this.getWorkAnalysisProblemTypeOptions(),
                    value: "Auto"
                },
                mass: { label: "Mass (kg)", type: "number", value: 1.0, step: 0.1 },
                initialVelocity: { label: "Initial Velocity (m/s)", type: "number", value: 20, step: 1 },
                launchAngle: { label: "Launch Angle (deg)", type: "number", value: 60, step: 1 },
                initialHeight: { label: "Initial Height (m)", type: "number", value: 0, step: 1 },
                landingHeight: { label: "Landing Height (m)", type: "number", value: 0, step: 1 },
                givenDx: { label: "Given delta x / Range (m)", type: "number", value: 170, step: 1 },
                givenDy: { label: "Given delta y (m)", type: "number", value: 0, step: 1 },
                givenTime: { label: "Given Time (s)", type: "number", value: 4, step: 0.1 },
                givenVx: { label: "Given v0x / vx (m/s)", type: "number", value: 20, step: 0.5 },
                givenVy: { label: "Given v0y (m/s)", type: "number", value: 15, step: 0.5 },
                givenHmax: { label: "Given hmax (m)", type: "number", value: 25, step: 1 },
                givenHeightDrop: { label: "Given Height Drop (m)", type: "number", value: 40, step: 1 },
                gravity: { label: "Gravity (m/s²)", type: "number", value: 9.8, step: 0.1 }
            },
            "Scenario / Diagram Type": {
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
                    options: ["Ball", "Block", "Person", "Plane"],
                    value: "Ball"
                },
                rulerStyle: {
                    label: "Ruler Style",
                    type: "select",
                    options: ["None", "Simple", "Detailed"],
                    value: "Simple"
                },
                listDisplay: {
                    label: "Variables List",
                    type: "select",
                    options: ["Hidden", "Symbols", "Values"],
                    value: "Values"
                },
                autoScaleToFit: { label: "Auto Scale To Fit Diagram", type: "checkbox", value: true },
                showGhostFrames: { label: "Show Ghost Positions", type: "checkbox", value: false },
                showXDisplacementGhosts: { label: "Show X Displacement Ghosts", type: "checkbox", value: false },
                showYDisplacementGhosts: { label: "Show Y Displacement Ghosts", type: "checkbox", value: false },
                ghostFrameCount: { label: "Ghost Position Count", type: "number", value: 6, step: 1 },
                showAngleArc: { label: "Show Launch Angle Arc", type: "checkbox", value: true },
                showLaunchCannon: { label: "Show Launch Cannon", type: "checkbox", value: true },
                showProblemLabels: { label: "Show Problem Variable Labels", type: "checkbox", value: false },
                showDropPlaneGuide: { label: "Show Airplane Guide In Drop Mode", type: "checkbox", value: true },
                svgExportTime: { label: "SVG Diagram Time (s)", type: "number", value: 4, step: 0.1 }
            },
            "Unknown / Hidden Variable Labels": {
                unknownHmax: { label: "Mark hₘₐₓ Unknown (?)", type: "checkbox", value: false },
                unknownDx: { label: "Mark Δx Unknown (?)", type: "checkbox", value: false },
                unknownInitialVelocity: { label: "Mark v₀ Unknown (?)", type: "checkbox", value: false },
                unknownInitialVx: { label: "Mark v₀ₓ Unknown (?)", type: "checkbox", value: true },
                unknownInitialVy: { label: "Mark v₀ᵧ Unknown (?)", type: "checkbox", value: true },
                unknownFinalVx: { label: "Mark vₓ Unknown (?)", type: "checkbox", value: true },
                unknownFinalVy: { label: "Mark vᵧ Unknown (?)", type: "checkbox", value: true },
                unknownDy: { label: "Mark Δy Unknown (?)", type: "checkbox", value: false },
                unknownFinalVelocity: { label: "Mark Final v Unknown (?)", type: "checkbox", value: true },
                unknownTheta: { label: "Mark θ Unknown (?)", type: "checkbox", value: false },
                unknownTime: { label: "Mark t Unknown (?)", type: "checkbox", value: false }
            },
            "Display Settings": {
                stopAnimation: {
                    label: "Stop Animation At",
                    type: "select",
                    options: ["End of Flight", "Max Height", "Custom Time"],
                    value: "End of Flight"
                },
                customStopTime: {
                    label: "Custom Stop Time (s)",
                    type: "number",
                    value: 5.0,
                    step: 0.1
                },
                timingMode: {
                    label: "Overlay Timing",
                    type: "select",
                    options: ["Always", "At End", "At Max Height", "At Custom Time"],
                    value: "Always"
                },
                trailStyle: {
                    label: "Trail Style",
                    type: "select",
                    options: ["Dotted", "Solid", "None"],
                    value: "Dotted"
                },
                showTimerDisplay: { label: "Show Canvas Timer", type: "checkbox", value: true },
                showDistanceMarkers: { label: "Show X/Y Distance Lines", type: "checkbox", value: true },
                showMomentumVector: { label: "Show Momentum (p) Vector", type: "checkbox", value: false },
                showForceVector: { label: "Show Force (F) Vector", type: "checkbox", value: false },
                showVelocityVectors: { label: "Show Live Velocity Vectors", type: "checkbox", value: true },
                showInitialVelocityVector: { label: "Show Initial Velocity Vector", type: "checkbox", value: false },
                showVectorBreakdown: { label: "Show Initial Vector Breakdown", type: "checkbox", value: false },
                showFinalVectorAdditionZoom: { label: "Show Final Vector Addition Zoom", type: "checkbox", value: false },
                showVectorBreakdownValues: { label: "Show Vx / Vy Values In Breakdown", type: "checkbox", value: false },
                captureVectorBreakdownInSvg: { label: "Capture Vector Breakdown In SVG", type: "checkbox", value: false },
                showAccelerationVector: { label: "Show Acceleration Vector", type: "checkbox", value: false },
                showMaxHeight: { label: "Show Max Height Line", type: "checkbox", value: false },
                showTelemetry: { label: "Show Time/Position HUD", type: "checkbox", value: false },
                showComponents: { label: "Show Live Velocity (Vx, Vy)", type: "checkbox", value: false },
                useProjectileXValues: { label: "Use Simple Projectile X Values", type: "checkbox", value: false },
                showEquations: { label: "Show Equation Box", type: "checkbox", value: false },
                accelerationPlacement: {
                    label: "Acceleration Placement",
                    type: "select",
                    options: ["Auto", "Near Object", "Above Arc", "Left Side", "Right Side", "Below Motion"],
                    value: "Auto"
                },
                accelerationOffsetX: { label: "Acceleration Offset X", type: "number", value: 0, step: 5 },
                accelerationOffsetY: { label: "Acceleration Offset Y", type: "number", value: 0, step: 5 },
                workAnalysisStepDuration: { label: "Work Step Duration (s)", type: "number", value: 2.2, step: 0.1 }
            },
            ...this.getProblemSetupImportControls()
        });

        const defaultSettings = this.getDefaultSettings();

        Object.entries(defaultSettings).forEach(([key, value]) => {
            this.setInputValue(key, value);
        });

        this.inputElements.workAnalysisProblemType?.addEventListener('change', () => {
            this.resetWorkWalkthroughState();
            this.applyWorkAnalysisProblemTypePreset(this.inputs.workAnalysisProblemType, { randomize: true, redraw: true });
        });
        this.inputElements.sampleProblem2d?.addEventListener('change', () => {
            this.applySampleProblem(this.inputs.sampleProblem2d, { redraw: true });
        });
        this.updatePhysicsParameterVisibility();
        this.drawPreview();
    }

    getDefaultSettings() {
        return {
            mass: 1,
            initialVelocity: 20,
            launchAngle: 60,
            initialHeight: 0,
            landingHeight: 0,
            givenDx: 170,
            givenDy: 0,
            givenTime: 4,
            givenVx: 20,
            givenVy: 15,
            givenHmax: 25,
            givenHeightDrop: 40,
            gravity: 9.8,
            scenarioType: "Standard Projectile",
            objectType: "Ball",
            rulerStyle: "Simple",
            listDisplay: "Values",
            autoScaleToFit: true,
            showGhostFrames: false,
            showXDisplacementGhosts: false,
            showYDisplacementGhosts: false,
            ghostFrameCount: 6,
            showAngleArc: true,
            showLaunchCannon: true,
            showProblemLabels: false,
            showDropPlaneGuide: true,
            svgExportTime: 4,
            unknownDx: true,
            unknownDy: true,
            unknownHmax: true,
            unknownInitialVelocity: false,
            unknownInitialVx: true,
            unknownInitialVy: true,
            unknownFinalVx: true,
            unknownFinalVy: true,
            unknownFinalVelocity: true,
            unknownTheta: false,
            unknownTime: true,
            stopAnimation: "End of Flight",
            customStopTime: 5,
            timingMode: "Always",
            trailStyle: "Dotted",
            showTimerDisplay: true,
            animateGivenValues: true,
            showDistanceMarkers: true,
            showMomentumVector: false,
            showForceVector: false,
            showVelocityVectors: true,
            showInitialVelocityVector: false,
            showVectorBreakdown: false,
            showFinalVectorAdditionZoom: false,
            showVectorBreakdownValues: false,
            captureVectorBreakdownInSvg: false,
            showAccelerationVector: false,
            showMaxHeight: false,
            showTelemetry: false,
            showComponents: false,
            useProjectileXValues: false,
            valuesPanelLayout: "Current Layout",
            valuesPanelOffsetX: 0,
            valuesPanelOffsetY: 0,
            showXValuesPanel: true,
            showYValuesPanel: true,
            showEquations: false,
            equationPanelPlacement: "Bottom Right",
            equationPanelOffsetX: 0,
            equationPanelOffsetY: 0,
            equationHighlight: "None",
            accelerationPlacement: "Auto",
            accelerationOffsetX: 0,
            accelerationOffsetY: 0,
            workAnalysisProblemType: "Auto",
            sampleProblem2d: "Custom / None",
            problemStatement: "",
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

        this.resetWorkWalkthroughState();
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
            'mass',
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

        physicsKeys.forEach((key) => {
            const wrapper = this.inputElements[key]?.parentElement;
            if (!wrapper) return;
            wrapper.style.display = visible.has(key) ? '' : 'none';
        });
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
            mass: ['m'],
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
            showDistanceMarkers: ['distancelines', 'distanceguides'],
            showMomentumVector: ['momentumvector', 'showmomentum'],
            showForceVector: ['forcevector', 'showforce'],
            showVelocityVectors: ['velocityvectors', 'showvelocity'],
            showInitialVelocityVector: ['initialvelocityvector', 'showinitialvelocity', 'showlaunchvector'],
            showVectorBreakdown: ['vectorbreakdown', 'breakdownintro', 'vectorintro', 'initialvectorbreakdown', 'showinitialvectorbreakdown'],
            showFinalVectorAdditionZoom: ['finalvectoraddition', 'finalvectorzoom', 'showfinalvectoraddition', 'showfinalvectorzoom'],
            showVectorBreakdownValues: ['vectorbreakdownvalues', 'breakdownvalues', 'showvxvyvalues'],
            captureVectorBreakdownInSvg: ['svgvectorbreakdown', 'capturebreakdownsvg', 'capturesvgbreakdown'],
            showAccelerationVector: ['accelerationvector', 'showacceleration'],
            showMaxHeight: ['maxheightline', 'showhmax'],
            showTelemetry: ['telemetry', 'hud'],
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

    getSvgExportTime() {
        if (
            this.inputs?.captureVectorBreakdownInSvg &&
            (this.inputs?.showVectorBreakdown || this.inputs?.showFinalVectorAdditionZoom)
        ) {
            const model = this.computeProjectileModel(0);
            if (model.finalVectorDuration > 0) {
                return model.finalVectorStartTime + (model.finalVectorDuration * 0.9);
            }
            if (model.breakdownDuration > 0) return model.breakdownDuration * 0.9;
        }
        if (Number.isFinite(this.inputs?.svgExportTime)) return this.inputs.svgExportTime;
        return this.config.duration;
    }

    async exportSvg() {
        if (typeof C2S === 'undefined') {
            document.getElementById('status').innerText = "SVG Library Error!";
            return;
        }

        const baseModel = this.computeProjectileModel(0);
        const problemType = this.getSelectedWorkAnalysisProblemType(baseModel);
        const steps = this.getConfiguredWorkAnalysisSteps(baseModel, problemType);

        if (!steps || !steps.length) {
            return super.exportSvg();
        }

        const statusEl = document.getElementById('status');

        const renderStepSvg = (step) => {
            const canvasStep = this.getWalkthroughCanvasStep(step);
            const time = this.getWalkthroughCanvasTime(step);
            const svgCtx = new C2S(this.width, this.height);
            if (typeof svgCtx.setLineDash !== 'function') svgCtx.setLineDash = () => {};
            svgCtx.roundRect = function(x, y, w, h, r) {
                const rv = Array.isArray(r) ? r[0] : (r || 0);
                const radius = Math.min(rv, Math.abs(w) / 2, Math.abs(h) / 2);
                this.moveTo(x + radius, y);
                this.lineTo(x + w - radius, y);
                this.quadraticCurveTo(x + w, y, x + w, y + radius);
                this.lineTo(x + w, y + h - radius);
                this.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
                this.lineTo(x + radius, y + h);
                this.quadraticCurveTo(x, y + h, x, y + h - radius);
                this.lineTo(x, y + radius);
                this.quadraticCurveTo(x, y, x + radius, y);
                this.closePath();
            };
            svgCtx.fillStyle = this.config.backgroundColor;
            svgCtx.fillRect(0, 0, this.width, this.height);
            this.isSvgExporting = true;
            this.activeWalkthroughStep = canvasStep;
            try {
                this.drawFrame(svgCtx, time);
                this.drawStepPanel(svgCtx, step);
            } finally {
                this.activeWalkthroughStep = null;
                this.isSvgExporting = false;
            }
            return svgCtx.getSerializedSvg(true);
        };

        const downloadSvg = (svgString, filename) => {
            const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        };

        for (let i = 0; i < steps.length; i++) {
            statusEl.innerText = `Exporting step ${i + 1} of ${steps.length}…`;
            try {
                const slug = this.sanitizeExportFilenamePart(steps[i].title, 'step');
                const filename = `step-${String(i + 1).padStart(2, '0')}-${slug}.svg`;
                downloadSvg(renderStepSvg(steps[i]), filename);
            } catch (e) {
                console.error(`Step ${i + 1} SVG failed:`, e);
            }
        }

        statusEl.innerText = `Downloaded ${steps.length} step SVGs!`;
        setTimeout(() => { statusEl.innerText = 'System Ready'; }, 2500);
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

    shouldAnimateWorkAnalysis() { return false; }
    shouldDrawWorkAnalysisCanvas() { return false; }
    shouldHighlightWorkAnalysisDiagram() { return false; }
    isWorkAnalysisLaunchComponentStep() { return false; }
    isStepWalkthroughMode() { return false; }

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
        const m = Math.max(0.01, this.normalizeNumber(this.inputs.mass, 1));

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

    getValuesPanelLayouts() {
        const uiScale = this.getCanvasTextScale();
        const width = 148 * uiScale;
        const height = 164 * uiScale;
        const layout = this.inputs.valuesPanelLayout || 'Current Layout';
        const offsetX = this.normalizeNumber(this.inputs.valuesPanelOffsetX, 0);
        const offsetY = this.normalizeNumber(this.inputs.valuesPanelOffsetY, 0);
        const gap = 8 * uiScale;

        if (layout === 'Left Stack') {
            const xPanel = this.getPanelPosition({ placement: 'Top Left', width, height, xOffset: offsetX, yOffset: offsetY });
            const yPanel = this.clampPanelPosition(xPanel.x, xPanel.y + height + gap, width, height);
            return { xPanel, yPanel };
        }

        if (layout === 'Right Stack') {
            const xPanel = this.getPanelPosition({ placement: 'Top Right', width, height, xOffset: offsetX, yOffset: offsetY });
            const yPanel = this.clampPanelPosition(xPanel.x, xPanel.y + height + gap, width, height);
            return { xPanel, yPanel };
        }

        if (layout === 'Bottom Corners') {
            return {
                xPanel: this.getPanelPosition({ placement: 'Bottom Left', width, height, xOffset: offsetX, yOffset: offsetY }),
                yPanel: this.getPanelPosition({ placement: 'Bottom Right', width, height, xOffset: offsetX, yOffset: offsetY })
            };
        }

        if (layout === 'Split Corners') {
            return {
                xPanel: this.getPanelPosition({ placement: 'Top Left', width, height, xOffset: offsetX, yOffset: offsetY }),
                yPanel: this.getPanelPosition({ placement: 'Bottom Right', width, height, xOffset: offsetX, yOffset: offsetY })
            };
        }

        const xPanel = this.getPanelPosition({ placement: 'Top Left', width, height, xOffset: offsetX, yOffset: offsetY });
        const yPanel = this.getPanelPosition({
            placement: 'Top Right',
            width,
            height,
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
            if (progress < 0.14) return 'final-zoom-camera';
            if (progress < 0.28) return 'final-zoom-vx';
            if (progress < 0.42) return 'final-zoom-vy';
            if (progress < 0.58) return 'final-zoom-tail-head';
            if (progress < 0.72) return 'final-zoom-resultant';
            if (progress < 0.86) return 'final-zoom-speed';
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
            const targetX = 0;
            const topPadding = Math.max(70, this.height * 0.14);
            const bottomPadding = Math.max(85, this.height * 0.17);
            const minCameraY = geometry.maxY - (this.height - bottomPadding);
            const maxCameraY = geometry.minY - topPadding;
            const centeredCameraY = geometry.centerY - (this.height / 2);
            const targetY = minCameraY <= maxCameraY
                ? this.clamp(centeredCameraY, minCameraY, maxCameraY)
                : (minCameraY + maxCameraY) / 2;
            const cameraY = targetY * pan;
            const worldMinX = Math.min(0, geometry.minX - 80);
            const worldMaxX = Math.max(this.width, geometry.maxX + 120);
            const worldHeight = Math.max(this.height, geometry.maxY + 160, cameraY + this.height + 120);

            return {
                x: 0,
                y: cameraY,
                targetX,
                targetY,
                worldMinX,
                worldMaxX,
                worldWidth: worldMaxX - worldMinX,
                worldHeight
            };
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

        if (this.inputs.showInitialVelocityVector && !this.inputs.showProblemLabels && !model.isInVectorBreakdown && !isFinalVelocityZoom && !this.isWorkAnalysisLaunchComponentStep(model)) {
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

        if (this.inputs.showProblemLabels && overlayTime && !isWAHighlight) {
            this.drawProblemLabels(ctx, model);
        }

        if (!isFinalVelocityZoom) {
            this.drawVariableList(ctx, model);
        }

        if (this.inputs.showTelemetry && overlayTime && !isFinalVelocityZoom) {
            this.drawTelemetry(ctx, model);
        }

        if (this.inputs.showComponents && overlayTime && !model.isFinished && !isFinalVelocityZoom) {
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
            this.drawProblemValueTransferAnimation(ctx, time);
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
            if (this.activeWalkthroughStep) {
                drawWalkthroughOverlay.call(this, ctx, model, this.activeWalkthroughStep);
            }
            ctx.restore();
        }

        if (this.inputs.showTimerDisplay && !isFinalVelocityZoom) {
            this.drawTimer(ctx, model);
        }
    }

    syncExternalPanels() {}

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
        super.stopPreview();
        if (this.hoveredValueKey) {
            this._hoverAnimStartMs = performance.now();
            this._startHoverLoop();
        }
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
                this.drawFrame(this.ctx, 10);

                const model = this.latestModel;
                if (model && !model.isInVectorBreakdown) {
                    const cam = model.vectorBreakdownCamera;
                    const problemHeaderLayout = this.getCanvasProblemHeaderLayout(this.ctx);
                    this.ctx.save();
                    if (problemHeaderLayout.height > 0) this.ctx.translate(0, problemHeaderLayout.height);
                    if (cam) this.ctx.translate(-cam.x, -cam.y);
                    this.drawHoverVariableAnimation(this.ctx, model);
                    this.ctx.restore();
                }
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
        const xRows = this.getXValueKeys().map(key => ({
            text: this.getAxisVarLabel("x", key, model, includeValue),
            axis: "x",
            key,
            valueText: includeValue ? this.getValueTextFromRow(this.getAxisVarLabel("x", key, model, includeValue)) : "",
            anchorId: `value:x:${key}:row`,
            valueAnchorId: includeValue ? `value:x:${key}` : null,
            focusKeys: this.getAxisValueFocusKeys("x", key)
        }));
        const yRows = [
            "displacement",
            "hmax",
            "v0",
            "v",
            "a",
            "t"
        ].map(key => ({
            text: this.getAxisVarLabel("y", key, model, includeValue),
            axis: "y",
            key,
            valueText: includeValue ? this.getValueTextFromRow(this.getAxisVarLabel("y", key, model, includeValue)) : "",
            anchorId: `value:y:${key}:row`,
            valueAnchorId: includeValue ? `value:y:${key}` : null,
            focusKeys: this.getAxisValueFocusKeys("y", key)
        }));

        const panelLayout = this.getValuesPanelLayouts();
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

    drawWorkAnalysisSequence(ctx, model) {
        const state = this.getWorkAnalysisSequenceState(model);
        if (!state) return;
        const uiScale = this.getCanvasTextScale();

        if (this.shouldHighlightWorkAnalysisDiagram() && !state.step.liveEquation) {
            this.drawWorkAnalysisHighlights(ctx, model, state.step);
        }

        if (state.step.liveEquation) {
            this.drawLiveEquationAnimation(ctx, model, state);
        }

        const visibleLines = state.step.lines.slice(0, state.lineCount);
        const panelWidth = 326 * uiScale;
        const panelHeight = (82 + (visibleLines.length * 20.5)) * uiScale;
        const x = 24;
        const y = this.height - panelHeight - 24;

        ctx.save();
        ctx.fillStyle = "rgba(255,255,255,0.95)";
        ctx.strokeStyle = "rgba(15,23,42,0.18)";
        ctx.lineWidth = 1.4 * uiScale;
        this.roundRectPath(ctx, x, y, panelWidth, panelHeight, 14 * uiScale);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = state.step.accent;
        this.roundRectPath(ctx, x, y, 9 * uiScale, panelHeight, 14 * uiScale);
        ctx.fill();

        ctx.fillStyle = "#0f172a";
        ctx.font = this.scaleFontString("700 15px Inter, sans-serif");
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(`Step ${state.stepIndex + 1}: ${state.step.title}`, x + (21 * uiScale), y + (21 * uiScale));

        ctx.fillStyle = "#64748b";
        ctx.font = this.scaleFontString("600 12px Inter, sans-serif");
        ctx.fillText(state.step.focusLabel, x + (21 * uiScale), y + (43 * uiScale));

        ctx.fillStyle = "#1e293b";
        ctx.font = this.scaleFontString("15px 'Cambria Math', 'STIX Two Math', 'Times New Roman', serif");
        visibleLines.forEach((line, index) => {
            ctx.fillText(line, x + (21 * uiScale), y + (68 * uiScale) + (index * 20.5 * uiScale));
        });
        ctx.restore();
    }

    drawStepPanel(ctx, step) {
        if (!step || !Array.isArray(step.lines) || !step.lines.length) return;
        const uiScale = this.getCanvasTextScale();
        const lines = step.lines;
        const panelWidth = 342 * uiScale;
        const panelHeight = (64 + (lines.length * 23)) * uiScale;
        const x = 20;
        const y = this.height - panelHeight - 20;

        ctx.save();
        ctx.fillStyle = "rgba(255,255,255,0.97)";
        ctx.strokeStyle = "rgba(15,23,42,0.15)";
        ctx.lineWidth = 1.1 * uiScale;
        this.roundRectPath(ctx, x, y, panelWidth, panelHeight, 11 * uiScale);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = step.accent || '#4f46e5';
        this.roundRectPath(ctx, x, y, 7 * uiScale, panelHeight, 11 * uiScale);
        ctx.fill();

        ctx.textAlign = "left";
        ctx.textBaseline = "middle";

        ctx.fillStyle = "#0f172a";
        ctx.font = this.scaleFontString("700 14px Inter, sans-serif");
        ctx.fillText(step.title || '', x + (18 * uiScale), y + (18 * uiScale));

        ctx.fillStyle = "#64748b";
        ctx.font = this.scaleFontString("500 11.5px Inter, sans-serif");
        ctx.fillText(step.focusLabel || '', x + (18 * uiScale), y + (39 * uiScale));

        ctx.fillStyle = "#1e293b";
        ctx.font = this.scaleFontString("15px 'Cambria Math', 'STIX Two Math', 'Times New Roman', serif");
        lines.forEach((line, i) => {
            ctx.fillText(line, x + (18 * uiScale), y + (59 * uiScale) + (i * 23 * uiScale));
        });
        ctx.restore();
    }

    drawWorkAnalysisHighlights(ctx, model, step) {
        if (!step) return;
        const vectorScale = this.getVectorDrawingScale();
        const state = this.getWorkAnalysisSequenceState(model);
        const stepProgress = state?.step?.id === step.id ? (state.progress ?? 1) : 1;

        if (step.id === 'components' || step.id === 'reconstruct') {
            this.drawInitialVelocityVector(ctx, model);
            const componentScale = 3 * vectorScale;
            const xEnd = model.startX + (model.vix * componentScale);
            const yEnd = model.startY - (model.viy * componentScale);
            const vxFocusStyle = this.getWorkAnalysisValueFocusStyle(model, 'v0x');
            const vyFocusStyle = this.getWorkAnalysisValueFocusStyle(model, 'v0y');
            this.drawArrow(ctx, model.startX, model.startY, xEnd, model.startY, vxFocusStyle.lineColor || "#b91c1c", vxFocusStyle.lineWidth || 3);
            this.drawArrow(ctx, xEnd, model.startY, xEnd, yEnd, vyFocusStyle.lineColor || "#047857", vyFocusStyle.lineWidth || 3);
            this.drawTextLabel(ctx, xEnd + 18, model.startY - 6, "v₀x", {
                font: "bold 11px serif",
                fill: vxFocusStyle.fill || "#b91c1c",
                background: vxFocusStyle.background || "rgba(255,255,255,0.88)",
                borderColor: vxFocusStyle.borderColor,
                borderWidth: vxFocusStyle.borderWidth ?? 1,
                shadowColor: vxFocusStyle.shadowColor || 'rgba(15, 23, 42, 0.10)',
                shadowBlur: vxFocusStyle.shadowBlur ?? (this.isSvgExporting ? 0 : 6),
                scale: vxFocusStyle.scale || 1
            });
            this.drawTextLabel(ctx, xEnd + 22, yEnd - 10, "v₀ᵧ", {
                font: "bold 11px serif",
                fill: vyFocusStyle.fill || "#047857",
                background: vyFocusStyle.background || "rgba(255,255,255,0.88)",
                borderColor: vyFocusStyle.borderColor,
                borderWidth: vyFocusStyle.borderWidth ?? 1,
                shadowColor: vyFocusStyle.shadowColor || 'rgba(15, 23, 42, 0.10)',
                shadowBlur: vyFocusStyle.shadowBlur ?? (this.isSvgExporting ? 0 : 6),
                scale: vyFocusStyle.scale || 1
            });
            return;
        }

        if (step.id === 'horizontal' || step.id === 'range') {
            this.drawDistanceTools(ctx, model);
            return;
        }

        if (step.id === 'vertical') {
            this.drawMaxHeightMarker(ctx, model);
            const accX = Math.min(this.width - 110, model.peakCanvasX + 60);
            const accY = Math.max(60, model.peakCanvasY - 80);
            this.drawAccelerationArrow(ctx, accX, accY, 62 * vectorScale, `a = ${model.g.toFixed(1)} m/s²`);
            return;
        }

        if (step.id === 'time') {
            this.drawMaxHeightMarker(ctx, model);
            this.drawStopwatch(
                ctx,
                Math.min(this.width - 80, model.peakCanvasX + 70),
                Math.max(56, model.peakCanvasY - 36),
                `t = ${model.tFlight.toFixed(2)} s`,
                this.getWorkAnalysisValueFocusStyle(model, 'time')
            );
            return;
        }

        if (step.id === 'shortcut') {
            this.drawDistanceTools(ctx, model);
            this.drawMaxHeightMarker(ctx, model);
            return;
        }

        if (step.id === 'vertical-result') {
            if (Math.abs(model.yf - model.yi) < 0.01) {
                this.drawMaxHeightMarker(ctx, model);
            } else {
                const vyScale = 2.8 * vectorScale;
                this.drawArrow(ctx, model.endX, model.endY, model.endX, model.endY - (model.finalVy * vyScale), "#047857", 3);
                this.drawTextLabel(ctx, model.endX + 18, model.endY - (model.finalVy * vyScale), "vᵧ(final)", {
                    font: "bold 11px serif",
                    fill: "#047857",
                    background: "rgba(255,255,255,0.88)"
                });
            }
            return;
        }

        if (step.id === 'summary') {
            this.drawDistanceTools(ctx, model);
            if (Math.abs(model.yf - model.yi) < 0.01) {
                this.drawMaxHeightMarker(ctx, model);
            }
        }
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

        if (stage === 'final-components' || stage === 'final-result' || stage.startsWith('final-zoom-')) {
            this.drawFinalVelocityBreakdown(ctx, model, stage);
            return;
        }

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
        const showBreakdownValues = Boolean(this.inputs.showVectorBreakdownValues);
        const displayV0Label = `vᵢ = ${model.vi.toFixed(1)} m/s`;
        const displayAngleLabel = `θ = ${model.angleDeg.toFixed(0)}°`;
        const displayVxLabel = stage === 'equations'
            ? 'Vx = v cos θ'
            : (showBreakdownValues ? `Vx = ${this.inputs.unknownInitialVx ? "?" : `${model.vix.toFixed(1)} m/s`}` : 'Vx');
        const displayVyLabel = stage === 'equations'
            ? 'Vy = v sin θ'
            : (showBreakdownValues ? `Vy = ${this.inputs.unknownInitialVy ? "?" : `${model.viy.toFixed(1)} m/s`}` : 'Vy');

        ctx.save();
        const componentVxLabel = stage === 'equations'
            ? 'v0x = v0 cos theta'
            : (showBreakdownValues ? `v0x = ${this.inputs.unknownInitialVx ? "?" : `${model.vix.toFixed(1)} m/s`}` : 'v0x');
        const componentVyLabel = stage === 'equations'
            ? 'v0y = v0 sin theta'
            : (showBreakdownValues ? `v0y = ${this.inputs.unknownInitialVy ? "?" : `${model.viy.toFixed(1)} m/s`}` : 'v0y');
        this.drawArrow(ctx, anchorX, anchorY, tipX, tipY, "#1d4ed8", 5, { headSize: 16 * vectorScale });
        this.drawTextLabel(ctx, ((anchorX + tipX) / 2) - 6, ((anchorY + tipY) / 2) - (24 * vectorScale), displayV0Label, {
            font: "bold 13px serif",
            fill: "#1d4ed8",
            background: "rgba(255,255,255,0.9)"
        });

        if (Math.abs(model.angleDeg) > 0.1) {
            this.drawAngleArc(ctx, anchorX, anchorY, model.angleDeg, angleArcRadius, displayAngleLabel);
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

            this.drawTextLabel(ctx, (anchorX + projX) / 2, anchorY + (28 * vectorScale), componentVxLabel, {
                font: "bold 12px serif",
                fill: "#b91c1c",
                background: "rgba(255,255,255,0.9)"
            });

            this.drawTextLabel(ctx, projX + (44 * vectorScale), (projY + tipY) / 2, componentVyLabel, {
                font: "bold 12px serif",
                fill: "#047857",
                background: "rgba(255,255,255,0.9)"
            });
        }

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
Object.assign(Module2DKinematics.prototype, problemRendererMethods);
Object.assign(Module2DKinematics.prototype, sceneRendererMethods);
Object.assign(Module2DKinematics.prototype, uiRendererMethods);
