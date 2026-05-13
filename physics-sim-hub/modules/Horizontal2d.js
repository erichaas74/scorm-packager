import Module2DKinematics from './Kinematics2d.js';
import * as Horizontal2dWorkAnalysis from './Horizontal2dWorkAnalysis.js';

const CLIFF_LAUNCH_OPTION = '8: given vx, height drop, horizontal launch off a cliff';
const PLANE_DROP_OPTION = '9: given vx, height drop, airplane package drop';

export default class ModuleHorizontal2dKinematics extends Module2DKinematics {
    getVectorConfig() {
        const model = this.computeProjectileModel(0);
        return {
            magnitude: model.vi,
            angleDeg: model.angleDeg,
            title: 'Horizontal Velocity Vector'
        };
    }

    getWorkAnalysisProblemTypeDefinitions() {
        return Horizontal2dWorkAnalysis.getWorkAnalysisProblemTypeDefinitions();
    }

    getWorkAnalysisProblemTypeOptions() {
        return Horizontal2dWorkAnalysis.getWorkAnalysisProblemTypeOptions();
    }

    getSampleProblemOptions() {
        return Horizontal2dWorkAnalysis.getSample2dKinematicsProblemOptions();
    }

    getSampleProblemByTitle(title) {
        return Horizontal2dWorkAnalysis.getSample2dKinematicsProblemByTitle(title);
    }

    resolveWorkAnalysisProblemTypeOption(value) {
        return Horizontal2dWorkAnalysis.resolveWorkAnalysisProblemTypeOption(
            value,
            (rawValue) => this.normalizeImportToken(rawValue)
        );
    }

    getWorkAnalysisProblemTypeNumber(value) {
        return Horizontal2dWorkAnalysis.getWorkAnalysisProblemTypeNumber(
            value,
            (rawValue) => this.normalizeImportToken(rawValue)
        );
    }

    getWorkAnalysisKnownVariablesForType(typeNumber) {
        return Horizontal2dWorkAnalysis.getWorkAnalysisKnownVariablesForType(typeNumber);
    }

    getVisiblePhysicsParameterKeys(typeNumber) {
        return Horizontal2dWorkAnalysis.getVisiblePhysicsParameterKeys(typeNumber);
    }

    randomizeProblemTypeInputs(typeNumber) {
        const updates = Horizontal2dWorkAnalysis.getRandomizedProblemTypeInputUpdates(typeNumber);
        if (!updates) return;
        Object.entries(updates).forEach(([key, value]) => {
            this.setInputValue(key, value, { redraw: false });
        });
    }

    getSelectedWorkAnalysisProblemType(model) {
        return Horizontal2dWorkAnalysis.getSelectedWorkAnalysisProblemType(
            model,
            this.inputs,
            (rawValue) => this.normalizeImportToken(rawValue)
        );
    }

    getWorkAnalysisTypeConfigs(model) {
        return Horizontal2dWorkAnalysis.getWorkAnalysisTypeConfigs(model, this.getSelectedWorkAnalysisProblemType(model));
    }

    getConfiguredWorkAnalysisSteps(model, problemType = this.getSelectedWorkAnalysisProblemType(model)) {
        return Horizontal2dWorkAnalysis.getConfiguredWorkAnalysisSteps(model, problemType);
    }

    getWorkAnalysisSequenceState(model) {
        const stepDuration = model.workStepDuration || this.getWorkAnalysisStepDuration();
        return Horizontal2dWorkAnalysis.getWorkAnalysisSequenceState(
            model,
            stepDuration,
            (value, min, max) => this.clamp(value, min, max)
        );
    }

    getScenarioForDeltaY(dy) {
        return Horizontal2dWorkAnalysis.getScenarioForDeltaY(dy);
    }

    componentsToLaunchValues(vx, vy) {
        return Horizontal2dWorkAnalysis.componentsToLaunchValues(vx, vy);
    }

    getProblemTypeScenarioValues(typeNumber, g) {
        return Horizontal2dWorkAnalysis.getProblemTypeScenarioValues(typeNumber, this.inputs, g, {
            normalizeNumber: (value, fallback) => this.normalizeNumber(value, fallback),
            clamp: (value, min, max) => this.clamp(value, min, max)
        });
    }

    getHorizontalProblemTypeId(model = null) {
        if (model?.workAnalysisType?.id) return model.workAnalysisType.id;
        const typeNumber = this.getWorkAnalysisProblemTypeNumber(this.inputs.workAnalysisProblemType);
        return typeNumber === '9' ? 'type9' : 'type8';
    }

    computeProjectileModel(time) {
        const model = super.computeProjectileModel(time);
        const problemTypeId = this.getHorizontalProblemTypeId(model);

        model.horizontalSceneType = problemTypeId === 'type9' ? 'plane' : 'cliff';

        if (model.horizontalSceneType === 'plane') {
            model.launchSurfaceY = model.startY;
            model.landingSurfaceY = model.endY;
            model.surfaceBaselineY = model.endY;
            model.baselineY = model.endY;
        }

        return model;
    }

    shouldShowPlaneDropScene(model) {
        return Boolean(model) && this.getHorizontalProblemTypeId(model) === 'type9';
    }

    drawScenarioTerrain(ctx, model) {
        if (this.shouldShowPlaneDropScene(model)) {
            this.drawPlaneWorldTerrain(ctx, model);
            this.drawPlaneDropScene(ctx, model);
            return;
        }

        super.drawScenarioTerrain(ctx, model);
    }

    drawPlaneWorldTerrain(ctx, model) {
        const worldWidth = this.width;
        const worldHeight = this.height;
        const groundY = model.endY;

        ctx.save();

        const cloudColor = 'rgba(255,255,255,0.75)';
        ctx.fillStyle = cloudColor;
        ctx.beginPath();
        ctx.arc(worldWidth * 0.18, 88, 16, 0, Math.PI * 2);
        ctx.arc(worldWidth * 0.18 + 18, 78, 22, 0, Math.PI * 2);
        ctx.arc(worldWidth * 0.18 + 42, 88, 16, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(worldWidth * 0.72, 76, 14, 0, Math.PI * 2);
        ctx.arc(worldWidth * 0.72 + 18, 66, 20, 0, Math.PI * 2);
        ctx.arc(worldWidth * 0.72 + 40, 76, 14, 0, Math.PI * 2);
        ctx.fill();

        const waterHeight = Math.max(36, worldHeight - groundY);
        const waterGrad = ctx.createLinearGradient(0, groundY, 0, worldHeight);
        waterGrad.addColorStop(0, '#67e8f9');
        waterGrad.addColorStop(1, '#0f766e');
        ctx.fillStyle = waterGrad;
        ctx.fillRect(0, groundY, worldWidth, waterHeight);

        ctx.strokeStyle = '#0891b2';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, groundY);
        ctx.lineTo(worldWidth, groundY);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(32, groundY + 16);
        ctx.lineTo(72, groundY + 16);
        ctx.moveTo(118, groundY + 24);
        ctx.lineTo(168, groundY + 24);
        ctx.moveTo(worldWidth - 156, groundY + 18);
        ctx.lineTo(worldWidth - 110, groundY + 18);
        ctx.stroke();

        ctx.restore();
    }

    drawPlaneDropScene(ctx, model) {
        const planeX = this.clamp(model.canvasX, -80, this.width + 80);
        const planeY = this.clamp(model.startY - 44, 54, model.startY - 18);
        const connectorTopY = planeY + 18;
        const releasePulse = this.clamp(1 - (model.activeTime / 0.55), 0, 1);

        ctx.save();

        ctx.strokeStyle = 'rgba(59, 130, 246, 0.30)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(model.startX, planeY);
        ctx.lineTo(model.endX, planeY);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(30, 64, 175, 0.35)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(planeX, connectorTopY);
        ctx.lineTo(planeX, model.canvasY - 12);
        ctx.stroke();
        ctx.setLineDash([]);

        if (releasePulse > 0) {
            ctx.fillStyle = `rgba(250, 204, 21, ${0.18 * releasePulse})`;
            ctx.beginPath();
            ctx.arc(planeX, connectorTopY + 6, 10 + (18 * (1 - releasePulse)), 0, Math.PI * 2);
            ctx.fill();
        }

        this.drawObject(ctx, planeX, planeY, 'Plane', 0.96, model);
        ctx.restore();
    }

    drawPoliceman(ctx, model) {
        if (this.shouldShowPlaneDropScene(model)) return;
        super.drawPoliceman(ctx, model);
    }

    getPreviewTitle() {
        return this.previewTitleFallback || 'Problem 2B: Horizontal Launch Preview';
    }

    getDefaultSettings() {
        return {
            ...super.getDefaultSettings(),
            workAnalysisProblemType: CLIFF_LAUNCH_OPTION,
            sampleProblem2d: 'Type 8: Horizontal launch off a cliff',
            problemStatement: 'A ball is launched horizontally at 22.0 m/s from the edge of a cliff that is 35 m above the water. Find the fall time, horizontal distance traveled, and impact velocity.',
            scenarioType: 'Lower Landing / Cliff',
            initialVelocity: 22,
            launchAngle: 0,
            initialHeight: 35,
            landingHeight: 0,
            givenVx: 22,
            givenHeightDrop: 35,
            givenDy: -35,
            objectType: 'Ball'
        };
    }
}