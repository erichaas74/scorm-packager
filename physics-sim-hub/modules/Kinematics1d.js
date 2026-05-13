import KinematicsModuleBase from './kinematics.js';

export default class Module1DKinematics extends KinematicsModuleBase {
    constructor(canvasId) {
        super(canvasId, { duration: 5, fps: 30, backgroundColor: '#e0f2fe' });
        this.margin = 70;
    }

    init() {
        this.setupInputs('controls', {
            "Physics Parameters": {
                initialPosition: { label: "Initial Position (m)", type: "number", value: 0, step: 1 },
                initialVelocity: { label: "Initial Velocity (m/s)", type: "number", value: 20, step: 1 },
                acceleration: { label: "Acceleration (m/s²)", type: "number", value: 2, step: 0.5 },
                stopTime: { label: "Simulate For (s)", type: "number", value: 4.0, step: 0.1 }
            },
            "Scenario / Diagram Type": {
                motionType: {
                    label: "Motion Type",
                    type: "select",
                    options: ["Horizontal", "Toss Up", "Drop", "Up & Down"],
                    value: "Horizontal"
                },
                objectType: {
                    label: "Object Type",
                    type: "select",
                    options: ["Ball", "Block", "Car", "Person"],
                    value: "Ball"
                },
                rulerStyle: {
                    label: "Ruler Style",
                    type: "select",
                    options: ["None", "Simple", "Detailed"],
                    value: "Detailed"
                },
                listDisplay: {
                    label: "Variables List",
                    type: "select",
                    options: ["Hidden", "Symbols", "Values"],
                    value: "Hidden"
                },
                equationsDisplay: {
                    label: "Equation Screen",
                    type: "select",
                    options: ["Hidden", "Visible"],
                    value: "Hidden"
                },
                equationHighlight: {
                    label: "Highlight Equation",
                    type: "select",
                    options: ["None", "Eq 1", "Eq 2", "Eq 3", "Eq 4"],
                    value: "None"
                },
                autoScaleToFit: { label: "Auto Scale To Fit Diagram", type: "checkbox", value: true },
                showGhostFrames: { label: "Show Ghost Positions", type: "checkbox", value: true },
                ghostFrameCount: { label: "Ghost Position Count", type: "number", value: 6, step: 1 },
                svgExportTime: { label: "SVG Diagram Time (s)", type: "number", value: 5, step: 0.1 }
            },
            "Problem Labels": {
                showProblemLabels: { label: "Show Problem Variable Labels", type: "checkbox", value: true },
                showDisplacementLabel: { label: "Show Δx / Δy / hmax", type: "checkbox", value: true },
                showInitialVelocityLabel: { label: "Show Initial Velocity", type: "checkbox", value: true },
                showFinalVelocityLabel: { label: "Show Final Velocity", type: "checkbox", value: true },
                showAccelerationLabel: { label: "Show Acceleration", type: "checkbox", value: true },
                showTimeLabel: { label: "Show Time Stopwatch", type: "checkbox", value: false },
                showUpDownTimeLabels: { label: "Show t_up and t_down", type: "checkbox", value: true }
            },
            "Unknown Variable Labels": {
                unknownDisplacement: { label: "Mark Δx / Δy / hmax Unknown (?)", type: "checkbox", value: false },
                unknownInitialVelocity: { label: "Mark v₀ Unknown (?)", type: "checkbox", value: false },
                unknownFinalVelocity: { label: "Mark v Unknown (?)", type: "checkbox", value: true },
                unknownAcceleration: { label: "Mark a Unknown (?)", type: "checkbox", value: false },
                unknownTime: { label: "Mark t Unknown (?)", type: "checkbox", value: false },
                unknownTimeUp: { label: "Mark t_up Unknown (?)", type: "checkbox", value: false },
                unknownTimeDown: { label: "Mark t_down Unknown (?)", type: "checkbox", value: false }
            },
            "Display Settings": {
                trailStyle: {
                    label: "Trail Style",
                    type: "select",
                    options: ["Dotted", "Solid", "None"],
                    value: "Dotted"
                },
                timingMode: {
                    label: "Overlay Timing",
                    type: "select",
                    options: ["Always", "At End", "At Custom Time"],
                    value: "Always"
                },
                customOverlayTime: { label: "Custom Overlay Time (s)", type: "number", value: 2.0, step: 0.1 },
                showTimerDisplay: { label: "Show Canvas Timer", type: "checkbox", value: true },
                showTelemetry: { label: "Show Time/Position HUD", type: "checkbox", value: true },
                valuePanelPlacement: {
                    label: "Value Panel Placement",
                    type: "select",
                    options: ["Top Left", "Top Right", "Bottom Left", "Bottom Right"],
                    value: "Top Left"
                },
                valuePanelOffsetX: { label: "Value Panel Offset X", type: "number", value: 0, step: 5 },
                valuePanelOffsetY: { label: "Value Panel Offset Y", type: "number", value: 0, step: 5 },
                equationPanelPlacement: {
                    label: "Equation Box Placement",
                    type: "select",
                    options: ["Top Left", "Top Right", "Bottom Left", "Bottom Right"],
                    value: "Top Right"
                },
                equationPanelOffsetX: { label: "Equation Box Offset X", type: "number", value: 0, step: 5 },
                equationPanelOffsetY: { label: "Equation Box Offset Y", type: "number", value: 0, step: 5 },
                accelerationPlacement: {
                    label: "Acceleration Placement",
                    type: "select",
                    options: ["Auto", "Above Axis", "Below Axis", "Left Side", "Right Side"],
                    value: "Auto"
                },
                accelerationOffsetX: { label: "Acceleration Offset X", type: "number", value: 0, step: 5 },
                accelerationOffsetY: { label: "Acceleration Offset Y", type: "number", value: 0, step: 5 },
                showVelocityVector: { label: "Show Velocity Vectors", type: "checkbox", value: true },
                showAccelerationVector: { label: "Show Acceleration Vector", type: "checkbox", value: true },
                showGroundOrAxis: { label: "Show Ground / Motion Axis", type: "checkbox", value: true }
            },
            ...this.getProblemSetupImportControls()
        });
        this.drawPreview();
    }

    getImportExtraAliases() {
        return {
            initialPosition: ['x0', 'y0', 'xi', 'yi', 'startposition', 'initialheight'],
            initialVelocity: ['vi', 'v0', 'velocity', 'initialspeed'],
            acceleration: ['a', 'accel', 'gravity', 'g'],
            stopTime: ['time', 't', 'duration', 'simulatetime'],
            motionType: ['motion', 'scenario', 'diagramtype'],
            objectType: ['object', 'item'],
            rulerStyle: ['ruler'],
            listDisplay: ['variables', 'variablelist'],
            equationsDisplay: ['equations', 'showequations'],
            equationHighlight: ['highlightequation'],
            autoScaleToFit: ['autoscale', 'fitdiagram'],
            showGhostFrames: ['ghosts', 'showghosts', 'ghostpositions'],
            ghostFrameCount: ['ghostcount', 'ghostscount'],
            svgExportTime: ['svgtime', 'diagramtime'],
            showProblemLabels: ['problemlabels', 'labels'],
            showDisplacementLabel: ['displacementlabel', 'showdisplacement'],
            showInitialVelocityLabel: ['initialvelocitylabel', 'showinitialvelocity'],
            showFinalVelocityLabel: ['finalvelocitylabel', 'showfinalvelocity'],
            showAccelerationLabel: ['accelerationlabel', 'showaccelerationlabel'],
            showTimeLabel: ['timelabel', 'showtime'],
            showUpDownTimeLabels: ['updowntime', 'showupdowntime'],
            unknownDisplacement: ['unknowndisplacement', 'unknowndx', 'unknowndy', 'hmaxunknown'],
            unknownInitialVelocity: ['unknownvi', 'unknownv0', 'v0unknown'],
            unknownFinalVelocity: ['unknownv', 'unknownvf', 'finalvunknown'],
            unknownAcceleration: ['unknowna', 'accelerationunknown'],
            unknownTime: ['unknowntime', 'timeunknown'],
            unknownTimeUp: ['unknowntimeup', 'tupunknown'],
            unknownTimeDown: ['unknowntimedown', 'tdownunknown'],
            trailStyle: ['trail'],
            timingMode: ['overlaytiming', 'showoverlayat'],
            customOverlayTime: ['overlaytime', 'customtime'],
            showTimerDisplay: ['timer', 'showtimer'],
            showTelemetry: ['telemetry', 'hud'],
            valuePanelPlacement: ['valueplacement', 'valuesplacement'],
            valuePanelOffsetX: ['valuesxoffset'],
            valuePanelOffsetY: ['valuesyoffset'],
            equationPanelPlacement: ['equationplacement', 'equationboxplacement'],
            equationPanelOffsetX: ['equationxoffset'],
            equationPanelOffsetY: ['equationyoffset'],
            accelerationPlacement: ['accelerationlocation', 'aplace'],
            accelerationOffsetX: ['accelerationxoffset'],
            accelerationOffsetY: ['accelerationyoffset'],
            showVelocityVector: ['velocityvector', 'showvelocity'],
            showAccelerationVector: ['accelerationvector', 'showacceleration'],
            showGroundOrAxis: ['ground', 'axis', 'showaxis']
        };
    }

    getSvgExportTime() {
        if (Number.isFinite(this.inputs?.svgExportTime)) return this.inputs.svgExportTime;
        return this.config.duration;
    }

    getVectorConfig() {
        const model = this.computeMotionModel(0);
        return {
            magnitude: Math.abs(model.vi),
            angleDeg: model.isVertical ? (model.vi >= 0 ? 90 : -90) : (model.vi >= 0 ? 0 : 180),
            title: model.isVertical ? 'Initial Vertical Velocity' : 'Initial Velocity Vector'
        };
    }

    getEffectiveValues() {
        const motionType = this.inputs.motionType || 'Horizontal';
        const isVertical = motionType !== 'Horizontal';

        const x0 = this.normalizeNumber(this.inputs.initialPosition, 0);
        let vi = this.normalizeNumber(this.inputs.initialVelocity, 20);
        let a = this.normalizeNumber(this.inputs.acceleration, 0);
        let requestedTime = Math.max(0.1, this.normalizeNumber(this.inputs.stopTime, this.config.duration));

        if (motionType === 'Drop') {
            vi = 0;
            a = -Math.abs(a || 9.8);
        } else if (motionType === 'Toss Up' || motionType === 'Up & Down') {
            vi = Math.abs(vi || 20);
            a = -Math.abs(a || 9.8);
        }

        let diagramTime = requestedTime;
        const tPeak = (isVertical && a < 0 && vi > 0) ? vi / Math.abs(a) : 0;
        const tReturn = (isVertical && a < 0 && vi > 0) ? (2 * vi / Math.abs(a)) : requestedTime;

        if (motionType === 'Toss Up' && tPeak > 0) {
            diagramTime = tPeak;
        } else if (motionType === 'Up & Down' && tReturn > 0) {
            diagramTime = tReturn;
        }

        return { motionType, isVertical, x0, vi, a, requestedTime, diagramTime, tPeak, tReturn };
    }

    positionAt(t, values) {
        return values.x0 + (values.vi * t) + (0.5 * values.a * t * t);
    }

    velocityAt(t, values) {
        return values.vi + values.a * t;
    }

    computeMotionModel(time) {
        const values = this.getEffectiveValues();
        const endTime = Math.max(0.05, values.diagramTime || values.requestedTime || this.config.duration);
        const activeTime = this.clamp(time, 0, endTime);

        let startValue = values.x0;
        let endValue = this.positionAt(endTime, values);
        let peakValue = startValue;
        let peakTime = 0;

        if (values.motionType === 'Drop') {
            startValue = Math.abs(endValue - values.x0);
            endValue = 0;
        } else if (values.motionType === 'Up & Down') {
            startValue = values.x0;
            endValue = values.x0;
            peakTime = values.tPeak;
            peakValue = this.positionAt(peakTime, values);
        } else if (values.motionType === 'Toss Up') {
            peakTime = values.tPeak;
            peakValue = this.positionAt(peakTime, values);
            endValue = peakValue;
        } else {
            const maybePeakTime = values.a !== 0 ? -values.vi / values.a : 0;
            if (maybePeakTime > 0 && maybePeakTime < endTime) {
                peakTime = maybePeakTime;
                peakValue = this.positionAt(peakTime, values);
            }
        }

        let currentValue;
        if (values.motionType === 'Drop') {
            const fallDistance = Math.abs(this.positionAt(activeTime, values) - values.x0);
            currentValue = Math.max(0, startValue - fallDistance);
        } else {
            currentValue = this.positionAt(activeTime, values);
        }

        const currentVelocity = values.motionType === 'Drop'
            ? -Math.abs(this.velocityAt(activeTime, values))
            : this.velocityAt(activeTime, values);
        const finalVelocity = values.motionType === 'Drop'
            ? -Math.abs(this.velocityAt(endTime, values))
            : this.velocityAt(endTime, values);

        const displacement = values.motionType === 'Drop'
            ? -Math.abs(startValue - endValue)
            : endValue - startValue;
        const displayDisplacement = values.motionType === 'Up & Down'
            ? Math.max(0, peakValue - startValue)
            : Math.abs(displacement);

        const positions = [startValue, endValue, currentValue, peakValue, values.x0];
        if (values.motionType === 'Drop') positions.push(0);
        const minValue = Math.min(...positions);
        const maxValue = Math.max(...positions);

        const geometry = this.computeGeometry(values, minValue, maxValue);
        const startPoint = this.valueToPoint(startValue, geometry, values);
        const endPoint = this.valueToPoint(endValue, geometry, values);
        const currentPoint = this.valueToPoint(currentValue, geometry, values);
        const peakPoint = this.valueToPoint(peakValue, geometry, values);

        return {
            ...values,
            endTime,
            activeTime,
            startValue,
            endValue,
            currentValue,
            currentVelocity,
            finalVelocity,
            displacement,
            displayDisplacement,
            peakTime,
            peakValue,
            minValue,
            maxValue,
            geometry,
            startPoint,
            endPoint,
            currentPoint,
            peakPoint
        };
    }

    computeGeometry(values, minValue, maxValue) {
        const isVertical = values.isVertical;
        const pad = 0.1 * Math.max(1, Math.abs(maxValue - minValue));
        let domainMin = minValue - pad;
        let domainMax = maxValue + pad;

        if (values.motionType === 'Horizontal') {
            domainMin = Math.min(0, domainMin);
            domainMax = Math.max(0, domainMax);
        } else if (values.motionType === 'Drop') {
            domainMin = Math.min(0, domainMin);
        }

        if (Math.abs(domainMax - domainMin) < 1e-6) {
            domainMax += 1;
            domainMin -= 1;
        }

        if (isVertical) {
            return {
                isVertical: true,
                axisX: this.width * 0.52,
                bottomY: this.height - 92,
                topY: 92,
                domainMin,
                domainMax
            };
        }

        return {
            isVertical: false,
            leftX: this.margin + 40,
            rightX: this.width - this.margin - 35,
            axisY: this.height * 0.55,
            domainMin,
            domainMax
        };
    }

    valueToPoint(value, geometry, values) {
        const denom = geometry.domainMax - geometry.domainMin || 1;
        const u = (value - geometry.domainMin) / denom;

        if (geometry.isVertical) {
            return {
                x: geometry.axisX,
                y: geometry.bottomY - u * (geometry.bottomY - geometry.topY)
            };
        }

        return {
            x: geometry.leftX + u * (geometry.rightX - geometry.leftX),
            y: geometry.axisY
        };
    }

    pointAtTime(t, model) {
        let value;
        if (model.motionType === 'Drop') {
            const fallDistance = Math.abs(this.positionAt(t, model) - model.x0);
            value = Math.max(0, model.startValue - fallDistance);
        } else {
            value = this.positionAt(t, model);
        }
        return this.valueToPoint(value, model.geometry, model);
    }

    shouldShowTimedOverlay(model) {
        const mode = this.inputs.timingMode || 'Always';
        if (mode === 'Always') return true;
        if (mode === 'At End') return model.activeTime >= model.endTime - 0.01;
        if (mode === 'At Custom Time') return model.activeTime >= this.normalizeNumber(this.inputs.customOverlayTime, 0);
        return true;
    }

    getValuePanelLayout(model, rowCount, width) {
        const height = rowCount * 21 + 17 + 10;
        return this.getPanelPosition({
            placement: this.inputs.valuePanelPlacement || 'Top Left',
            width,
            height,
            xOffset: this.normalizeNumber(this.inputs.valuePanelOffsetX, 0),
            yOffset: this.normalizeNumber(this.inputs.valuePanelOffsetY, 0)
        });
    }

    getEquationPanelLayout(equationCount, width = 137) {
        const height = equationCount * 22 + 14 + 10;
        return this.getPanelPosition({
            placement: this.inputs.equationPanelPlacement || 'Top Right',
            width,
            height,
            xOffset: this.normalizeNumber(this.inputs.equationPanelOffsetX, 0),
            yOffset: this.normalizeNumber(this.inputs.equationPanelOffsetY, 0)
        });
    }

    getAccelerationAnchor(model) {
        const placement = this.inputs.accelerationPlacement || 'Auto';
        let point;

        if (placement === 'Left Side') {
            point = model.isVertical
                ? { x: model.geometry.axisX - 130, y: (model.geometry.topY + model.geometry.bottomY) / 2 }
                : { x: model.geometry.leftX + 55, y: model.geometry.axisY - 132 };
        } else if (placement === 'Right Side') {
            point = model.isVertical
                ? { x: model.geometry.axisX + 130, y: (model.geometry.topY + model.geometry.bottomY) / 2 }
                : { x: model.geometry.rightX - 55, y: model.geometry.axisY - 132 };
        } else if (placement === 'Above Axis') {
            point = model.isVertical
                ? { x: model.geometry.axisX + 130, y: model.geometry.topY + 60 }
                : { x: (model.geometry.leftX + model.geometry.rightX) / 2, y: model.geometry.axisY - 132 };
        } else if (placement === 'Below Axis') {
            point = model.isVertical
                ? { x: model.geometry.axisX + 130, y: model.geometry.bottomY - 60 }
                : { x: (model.geometry.leftX + model.geometry.rightX) / 2, y: model.geometry.axisY + 90 };
        } else {
            point = model.isVertical
                ? { x: model.geometry.axisX + 130, y: (model.geometry.topY + model.geometry.bottomY) / 2 }
                : { x: (model.geometry.leftX + model.geometry.rightX) / 2, y: model.geometry.axisY - 132 };
        }

        point.x += this.normalizeNumber(this.inputs.accelerationOffsetX, 0);
        point.y += this.normalizeNumber(this.inputs.accelerationOffsetY, 0);
        return point;
    }

    drawFrame(ctx, time) {
        this.clearCanvasAnchors();
        const model = this.computeMotionModel(time);
        const showTimed = this.shouldShowTimedOverlay(model);

        this.drawBackground(ctx, model);
        this.drawMotionAxis(ctx, model);
        this.drawPath(ctx, model);
        this.drawGhostFrames(ctx, model);

        if (this.inputs.showProblemLabels && showTimed) {
            this.drawProblemTools(ctx, model);
        }

        this.drawObject(ctx, model.startPoint.x, model.startPoint.y, this.inputs.objectType, model.activeTime <= 0.02 ? 1 : 0.25, model);
        this.drawObject(ctx, model.endPoint.x, model.endPoint.y, this.inputs.objectType, 0.25, model);
        if (model.motionType === 'Up & Down' || model.motionType === 'Toss Up') {
            this.drawObject(ctx, model.peakPoint.x, model.peakPoint.y, this.inputs.objectType, 0.18, model);
        }
        this.drawObject(ctx, model.currentPoint.x, model.currentPoint.y, this.inputs.objectType, 1, model);

        if (showTimed) {
            this.drawVectors(ctx, model);
        }

        this.drawVariableList(ctx, model);
        this.drawEquationPanel(ctx, model);
        this.drawTelemetry(ctx, model);
        this.drawTimer(ctx, model);
    }

    drawMotionAxis(ctx, model) {
        if (!this.inputs.showGroundOrAxis) return;
        ctx.save();
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';

        if (model.isVertical) {
            const x = model.geometry.axisX + 32;
            ctx.setLineDash(model.motionType === 'Drop' ? [10, 10] : []);
            ctx.beginPath();
            ctx.moveTo(x, model.geometry.topY - 10);
            ctx.lineTo(x, model.geometry.bottomY + 10);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.beginPath();
            ctx.moveTo(model.geometry.axisX - 170, model.geometry.bottomY + 22);
            ctx.lineTo(model.geometry.axisX + 170, model.geometry.bottomY + 22);
            ctx.strokeStyle = '#94a3b8';
            ctx.stroke();
        } else {
            ctx.beginPath();
            ctx.moveTo(model.geometry.leftX - 35, model.geometry.axisY + 30);
            ctx.lineTo(model.geometry.rightX + 35, model.geometry.axisY + 30);
            ctx.stroke();
        }
        ctx.restore();
    }

    drawPath(ctx, model) {
        if (this.inputs.trailStyle === 'None') return;
        ctx.save();
        ctx.strokeStyle = 'rgba(37, 99, 235, 0.4)';
        ctx.lineWidth = 2;
        if (this.inputs.trailStyle === 'Dotted') ctx.setLineDash([6, 6]);

        ctx.beginPath();
        const steps = 90;
        for (let i = 0; i <= steps; i++) {
            const t = model.endTime * i / steps;
            const p = this.pointAtTime(t, model);
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
        ctx.restore();
    }

    drawGhostFrames(ctx, model) {
        if (!this.inputs.showGhostFrames) return;
        const count = Math.max(2, Math.min(12, Math.round(this.normalizeNumber(this.inputs.ghostFrameCount, 6))));
        ctx.save();
        for (let i = 0; i <= count; i++) {
            const t = model.endTime * i / count;
            const p = this.pointAtTime(t, model);
            
            // Exponential fade mimics natural motion blur
            const progress = i / count;
            const opacity = 0.05 + 0.35 * Math.pow(progress, 2);
            
            this.drawObject(ctx, p.x, p.y, this.inputs.objectType, opacity, model);
        }
        ctx.restore();
    }

    drawProblemTools(ctx, model) {
        if (this.inputs.rulerStyle !== 'None' && this.inputs.showDisplacementLabel) {
            this.drawDisplacementRuler(ctx, model);
        }

        if (this.inputs.showTimeLabel) {
            const offset = model.isVertical ? { x: 130, y: 0 } : { x: 110, y: -10 };
            this.drawStopwatch(ctx, model.endPoint.x + offset.x, model.endPoint.y + offset.y, this.getVarLabel('t', model), model);
        }

        if (model.motionType === 'Up & Down' && this.inputs.showUpDownTimeLabels) {
            this.drawStopwatch(ctx, model.peakPoint.x - 170, model.peakPoint.y + 60, this.getVarLabel('t_up', model), model);
            this.drawStopwatch(ctx, model.peakPoint.x + 170, model.peakPoint.y + 60, this.getVarLabel('t_down', model), model);
        }
    }

    drawDisplacementRuler(ctx, model) {
        let from, to, label;
        if (model.motionType === 'Up & Down' || model.motionType === 'Toss Up') {
            from = { x: model.peakPoint.x - 92, y: model.startPoint.y };
            to = { x: model.peakPoint.x - 92, y: model.peakPoint.y };
            label = this.getVarLabel('displacement', model);
        } else if (model.isVertical) {
            from = { x: model.startPoint.x - 90, y: model.startPoint.y };
            to = { x: model.endPoint.x - 90, y: model.endPoint.y };
            label = this.getVarLabel('displacement', model);
        } else {
            from = { x: model.startPoint.x, y: model.startPoint.y + 82 };
            to = { x: model.endPoint.x, y: model.endPoint.y + 82 };
            label = this.getVarLabel('displacement', model);
        }
        this.drawRuler(ctx, from.x, from.y, to.x, to.y, label, model.displayDisplacement, this.inputs.rulerStyle, model);

        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.5;
        if (model.isVertical) {
            ctx.beginPath();
            ctx.moveTo(from.x, from.y);
            ctx.lineTo(model.startPoint.x, model.startPoint.y);
            ctx.moveTo(to.x, to.y);
            ctx.lineTo(model.motionType === 'Up & Down' || model.motionType === 'Toss Up' ? model.peakPoint.x : model.endPoint.x, to.y);
            ctx.stroke();
        } else {
            ctx.beginPath();
            ctx.moveTo(model.startPoint.x, model.startPoint.y + 18);
            ctx.lineTo(model.startPoint.x, from.y - 12);
            ctx.moveTo(model.endPoint.x, model.endPoint.y + 18);
            ctx.lineTo(model.endPoint.x, to.y - 12);
            ctx.stroke();
        }
        ctx.restore();
    }

    drawRuler(ctx, x1, y1, x2, y2, label, value, style, model) {
        const isHoriz = Math.abs(y1 - y2) < 1;
        const length = isHoriz ? Math.abs(x2 - x1) : Math.abs(y2 - y1);
        if (length < 1) return;

        ctx.save();
        if (style === 'Detailed' && Number.isFinite(value) && Math.abs(value) > 0.001) {
            const left = isHoriz ? Math.min(x1, x2) : x1 - 10;
            const top = isHoriz ? y1 - 10 : Math.min(y1, y2);
            const width = isHoriz ? length : 20;
            const height = isHoriz ? 20 : length;
            this.roundRect(ctx, left, top, width, height, 2);
            ctx.fillStyle = '#fef08a';
            ctx.fill();
            ctx.strokeStyle = '#ca8a04';
            ctx.lineWidth = 2;
            ctx.stroke();

            const maxVal = Math.abs(value);
            let step = 10;
            if (maxVal >= 250) step = 100;
            else if (maxVal >= 100) step = 50;
            else if (maxVal >= 50) step = 25;
            else if (maxVal < 10) step = Math.max(1, Math.ceil(maxVal / 5));

            const dir = isHoriz ? (x2 > x1 ? 1 : -1) : (y2 > y1 ? 1 : -1);
            for (let v = 0; v <= maxVal + 0.0001; v += step / 5) {
                const clean = Math.round(v * 100) / 100;
                const p = (clean / maxVal) * length;
                const cx = isHoriz ? x1 + dir * p : x1;
                const cy = isHoriz ? y1 : y1 + dir * p;
                const isMajor = Math.abs(clean % step) < 0.001 || Math.abs((clean % step) - step) < 0.001;
                const tick = isMajor ? 12 : 6;

                ctx.beginPath();
                if (isHoriz) {
                    ctx.moveTo(cx, cy - 10);
                    ctx.lineTo(cx, cy - 10 + tick);
                } else {
                    ctx.moveTo(cx + 10 - tick, cy);
                    ctx.lineTo(cx + 10, cy);
                }
                ctx.strokeStyle = '#ca8a04';
                ctx.lineWidth = isMajor ? 2 : 1;
                ctx.stroke();

                if (isMajor) {
                    ctx.fillStyle = '#a16207';
                    ctx.font = 'bold 7px Inter, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    if (isHoriz) {
                        ctx.fillText(String(clean), cx, cy + 7);
                    } else {
                        ctx.save();
                        ctx.translate(cx - 3, cy);
                        ctx.rotate(-Math.PI / 2);
                        ctx.fillText(String(clean), 0, 0);
                        ctx.restore();
                    }
                }
            }
        } else {
            ctx.strokeStyle = '#4b5563';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 6]);
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.beginPath();
            if (isHoriz) {
                ctx.moveTo(x1, y1 - 15); ctx.lineTo(x1, y1 + 15);
                ctx.moveTo(x2, y2 - 15); ctx.lineTo(x2, y2 + 15);
            } else {
                ctx.moveTo(x1 - 15, y1); ctx.lineTo(x1 + 15, y1);
                ctx.moveTo(x2 - 15, y2); ctx.lineTo(x2 + 15, y2);
            }
            ctx.stroke();
        }

        const tx = isHoriz ? (x1 + x2) / 2 : x1 - 45;
        const ty = isHoriz ? y1 + 25 : (y1 + y2) / 2;
        ctx.fillStyle = '#374151';
        ctx.font = 'bold 14px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (isHoriz) {
            ctx.fillText(label, tx, ty);
        } else {
            ctx.save();
            if (model.motionType === 'Up & Down' || model.motionType === 'Toss Up') {
                ctx.fillText(label, tx - 18, ty);
            } else {
                ctx.translate(tx, ty);
                ctx.rotate(-Math.PI / 2);
                ctx.fillText(label, 0, 0);
            }
            ctx.restore();
        }
        ctx.restore();
    }

    drawVectors(ctx, model) {
        if (this.inputs.showVelocityVector) {
            if (this.inputs.showInitialVelocityLabel) {
                const p = model.startPoint;
                this.drawVelocityArrow(ctx, p.x, model.isVertical ? p.y : p.y - 52, model.vi, this.getVarLabel('v0', model), model, '#2563eb');
            }
            if (this.inputs.showFinalVelocityLabel) {
                const p = model.endPoint;
                this.drawVelocityArrow(ctx, p.x, model.isVertical ? p.y : p.y - 52, model.finalVelocity, this.getVarLabel('v', model), model, '#2563eb');
            }
        }

        if (this.inputs.showAccelerationVector && this.inputs.showAccelerationLabel) {
            const p = this.getAccelerationAnchor(model);
            this.drawAccelerationArrow(ctx, p.x, p.y, model.a, this.getVarLabel('a', model), model, '#ea580c');
        }
    }

    drawVelocityArrow(ctx, x, y, velocity, label, model, color) {
        const isVertical = model.isVertical;
        const sign = velocity >= 0 ? 1 : -1;
        const len = 70;
        const x2 = isVertical ? x : x + len * sign;
        const y2 = isVertical ? y - len * sign : y;
        this.drawArrow(ctx, x, y, x2, y2, color, 3);

        ctx.save();
        ctx.fillStyle = color;
        ctx.font = 'bold 12.6px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const tx = isVertical ? x + (x < this.width / 2 ? -70 : 70) : (x + x2) / 2;
        const ty = isVertical ? (y + y2) / 2 : y - 22;
        ctx.fillText(label, tx, ty);
        ctx.restore();
    }

    drawAccelerationArrow(ctx, x, y, acceleration, label, model, color) {
        const isVertical = model.isVertical;
        const sign = acceleration >= 0 ? 1 : -1;
        const len = 70;
        const x2 = isVertical ? x : x + len * sign;
        const y2 = isVertical ? y - len * sign : y;

        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.globalAlpha = 1;

        const angle = Math.atan2(y2 - y, x2 - x);
        const pulse = 0.2 + 0.8 * Math.abs(Math.sin(model.activeTime * Math.PI));
        for (let i = 0; i < 2; i++) {
            const offset = 7 + i * 14;
            const hx = x2 - Math.cos(angle) * offset;
            const hy = y2 - Math.sin(angle) * offset;
            ctx.save();
            ctx.translate(hx, hy);
            ctx.rotate(angle);
            ctx.globalAlpha = i === 0 ? pulse : Math.max(0.25, pulse * 0.75);
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(8, 0);
            ctx.lineTo(-8, -8);
            ctx.lineTo(-3, 0);
            ctx.lineTo(-8, 8);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }

        ctx.fillStyle = color;
        ctx.font = 'bold 12.6px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const tx = isVertical ? x + 88 : (x + x2) / 2;
        const ty = isVertical ? (y + y2) / 2 : y - 28;
        ctx.fillText(label, tx, ty);
        ctx.restore();
    }

    drawVariableList(ctx, model) {
        const mode = this.inputs.listDisplay || 'Hidden';
        if (mode === 'Hidden') return;

        const keys = ['displacement', 'v0', 'v', 'a', 't'];
        if (model.motionType === 'Up & Down') keys.push('t_up', 't_down');
        const includeValue = mode === 'Values';
        const rows = keys.map(k => this.getValueCardRow(k, model, includeValue));
        const boxWidth = mode === 'Values' ? 156 : 78;
        const position = this.getValuePanelLayout(model, rows.length, boxWidth);
        this.drawListPanel(ctx, {
            rows,
            x: position.x,
            y: position.y,
            width: boxWidth
        });
    }

    getValueCardRow(key, model, includeValue = true) {
        const axis = model.motionType === 'Horizontal' ? 'x' : 'y';
        const text = this.getVarLabel(key, model, includeValue);
        const valueText = includeValue ? this.getValueTextFromRow(text) : '';
        const rowAnchorId = `value:1d:${key}:row`;
        const valueAnchorId = includeValue ? `value:1d:${key}` : null;

        return {
            text,
            key,
            axis,
            valueText,
            anchorId: rowAnchorId,
            anchorAliases: [`value:${axis}:${key}:row`],
            valueAnchorId,
            valueAnchorAliases: includeValue ? [`value:${axis}:${key}`] : []
        };
    }

    drawEquationPanel(ctx, model) {
        if ((this.inputs.equationsDisplay || 'Hidden') === 'Hidden') return;
        const d = model.motionType === 'Horizontal' ? 'Δx' : (model.motionType === 'Up & Down' || model.motionType === 'Toss Up' ? 'hmax' : 'Δy');
        const eqs = [
            'v = v₀ + at',
            `${d} = v₀t + ½at²`,
            `v² = v₀² + 2a${d}`,
            `${d} = ½(v₀ + v)t`
        ];

        const position = this.getEquationPanelLayout(eqs.length, 137);
        this.drawEquationBox(ctx, {
            equations: eqs,
            highlightKey: this.inputs.equationHighlight,
            x: position.x,
            y: position.y
        });
    }

    drawTelemetry(ctx, model) {
        if (!this.inputs.showTelemetry) return;
        ctx.save();
        ctx.fillStyle = '#0f172a';
        ctx.font = '600 9.8px Inter, sans-serif';
        const axisSymbol = model.motionType === 'Horizontal' ? 'x' : 'y';
        ctx.fillText(`Time: ${model.activeTime.toFixed(2)} s`, 20, this.height - 70);
        ctx.fillText(`${axisSymbol}: ${model.currentValue.toFixed(2)} m`, 20, this.height - 48);
        ctx.fillText(`v: ${model.currentVelocity.toFixed(2)} m/s`, 20, this.height - 26);
        ctx.restore();
    }


    getVarLabel(key, model, includeValue = true) {
        const symbol = this.getSymbol(key, model);
        if (!includeValue) return `${symbol} =`;

        const map = {
            displacement: {
                unknown: this.inputs.unknownDisplacement,
                value: model.displayDisplacement,
                unit: 'm'
            },
            v0: {
                unknown: this.inputs.unknownInitialVelocity,
                value: model.vi,
                unit: 'm/s'
            },
            v: {
                unknown: this.inputs.unknownFinalVelocity,
                value: model.finalVelocity,
                unit: 'm/s'
            },
            a: {
                unknown: this.inputs.unknownAcceleration,
                value: model.a,
                unit: 'm/s²'
            },
            t: {
                unknown: this.inputs.unknownTime,
                value: model.endTime,
                unit: 's'
            },
            t_up: {
                unknown: this.inputs.unknownTimeUp,
                value: model.peakTime,
                unit: 's'
            },
            t_down: {
                unknown: this.inputs.unknownTimeDown,
                value: Math.max(0, model.endTime - model.peakTime),
                unit: 's'
            }
        };

        const item = map[key];
        if (!item) return `${symbol} = ?`;
        if (item.unknown) return `${symbol} = ?`;
        return `${symbol} = ${this.formatNumber(item.value)} ${item.unit}`;
    }

    getSymbol(key, model) {
        if (key === 'displacement') {
            if (model.motionType === 'Horizontal') return 'Δx';
            if (model.motionType === 'Up & Down' || model.motionType === 'Toss Up') return 'hmax';
            return 'Δy';
        }
        if (key === 'v0') return 'v₀';
        if (key === 't_up') return 't_up';
        if (key === 't_down') return 't_down';
        return key;
    }
}
