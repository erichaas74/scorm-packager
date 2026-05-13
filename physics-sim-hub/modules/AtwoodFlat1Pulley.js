import AtwoodMachineBase from './AtwoodMachineBase.js';

export default class AtwoodFlat1Pulley extends AtwoodMachineBase {
    constructor(canvasId) {
        super(canvasId, { duration: 4, fps: 30 });

        this.tableEdgeX = 450;
        this.tableY = 180;
        this.pulleyRadius = 15;
    }

    init() {
        this.setupInputs('controls', {
            "System Parameters": {
                mass1: { label: "Mass 1 (Table) (kg)", type: "number", value: 10, step: 1 },
                mass2: { label: "Mass 2 (Hanging) (kg)", type: "number", value: 5, step: 1 },
                friction: { label: "Coefficient of Friction (mu)", type: "number", value: 0.2, step: 0.05 },
                gravity: { label: "Gravity (m/s^2)", type: "number", value: 9.8, step: 0.1 }
            },
            "Display Settings": this.getCommonDisplaySettings()
        });

        this.applySimulationTime();
        this.drawPreview();
    }

    computeState(time) {
        const { mass1: m1, mass2: m2, friction: mu, gravity: g } = this.inputs;

        const maxForceDrag = m2 * g;
        const maxFriction = mu * m1 * g;

        let acceleration = 0;
        let isMoving = false;

        if (maxForceDrag > maxFriction) {
            acceleration = (maxForceDrag - maxFriction) / (m1 + m2);
            isMoving = true;
        }

        const tension = isMoving ? m2 * (g - acceleration) : maxForceDrag;
        const activeTime = this.getActiveTime(time);
        const distanceMeters = 0.5 * acceleration * activeTime * activeTime;
        const velocity = acceleration * activeTime;

        const startX1 = 100;
        const startY2 = this.tableY + this.pulleyRadius;
        const maxAllowedDistance = (this.tableEdgeX - startX1 - 40) / this.scale;
        const actualDistance = Math.min(distanceMeters, maxAllowedDistance);
        const pxDist = actualDistance * this.scale;

        const block1Width = 50;
        const block1Height = 40;
        const block2Width = 30;
        const block2Height = 40;

        return this.createState(time, {
            m1,
            m2,
            mu,
            g,
            maxForceDrag,
            maxFriction,
            acceleration,
            isMoving,
            tension,
            velocity,
            distanceMeters,
            actualDistance,
            pxDist,
            startX1,
            startY2,
            block1Width,
            block1Height,
            block2Width,
            block2Height,
            block1X: startX1 + pxDist,
            block1Y: this.tableY - block1Height,
            block2X: this.tableEdgeX + this.pulleyRadius - (block2Width / 2),
            block2Y: startY2 + pxDist
        });
    }

    drawScene(ctx, state) {
        ctx.fillStyle = "#f8fafc";
        ctx.fillRect(0, 0, this.width, this.height);

        ctx.fillStyle = "#334155";
        ctx.fillRect(0, state.block1Y + state.block1Height, this.tableEdgeX, this.height - this.tableY);
        ctx.fillStyle = "#475569";
        ctx.fillRect(0, this.tableY, this.tableEdgeX, 6);

        ctx.strokeStyle = "#1e293b";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.tableEdgeX, this.tableY);
        ctx.lineTo(this.tableEdgeX, this.height);
        ctx.stroke();

        const pulleyCenterY = this.tableY - this.pulleyRadius;
        ctx.fillStyle = "#94a3b8";
        ctx.fillRect(this.tableEdgeX - 10, pulleyCenterY, 20, this.pulleyRadius + 6);
        this.drawPulleyWheel(ctx, this.tableEdgeX, pulleyCenterY, this.pulleyRadius);

        ctx.beginPath();
        ctx.moveTo(state.block1X + state.block1Width, pulleyCenterY);
        ctx.lineTo(this.tableEdgeX, pulleyCenterY);
        ctx.moveTo(this.tableEdgeX + this.pulleyRadius, pulleyCenterY);
        ctx.lineTo(this.tableEdgeX + this.pulleyRadius, state.block2Y);
        ctx.strokeStyle = "#94a3b8";
        ctx.lineWidth = 2;
        ctx.stroke();

        this.drawBlock(ctx, {
            x: state.block1X,
            y: state.block1Y,
            width: state.block1Width,
            height: state.block1Height,
            fillStyle: "#3b82f6",
            strokeStyle: "#1d4ed8",
            label: "m1"
        });

        this.drawBlock(ctx, {
            x: state.block2X,
            y: state.block2Y,
            width: state.block2Width,
            height: state.block2Height,
            fillStyle: "#ef4444",
            strokeStyle: "#b91c1c",
            label: "m2",
            labelFont: "bold 13px Inter"
        });

        if (!this.inputs.showForces) return;

        const forceScale = 1.5;
        const block1CenterX = state.block1X + state.block1Width / 2;
        const block1CenterY = state.block1Y + state.block1Height / 2;
        const block2CenterX = state.block2X + state.block2Width / 2;

        this.drawArrow(ctx, block1CenterX, state.block1Y, block1CenterX, state.block1Y - 30, "#a855f7", 2, "Fn", 10);
        this.drawArrow(ctx, block1CenterX, state.block1Y + state.block1Height, block1CenterX, state.block1Y + state.block1Height + 30, "#f59e0b", 2, "m1g", 10);
        this.drawArrow(ctx, state.block1X + state.block1Width, block1CenterY, state.block1X + state.block1Width + state.tension * forceScale, block1CenterY, "#10b981", 3, "T", 10);

        if (state.mu > 0) {
            const frictionMag = state.isMoving ? state.maxFriction : state.tension;
            if (frictionMag > 0) {
                this.drawArrow(ctx, state.block1X, block1CenterY, state.block1X - frictionMag * forceScale, block1CenterY, "#f43f5e", 3, state.isMoving ? "fk" : "fs", 10);
            }
        }

        this.drawArrow(ctx, block2CenterX, state.block2Y, block2CenterX, state.block2Y - state.tension * forceScale, "#10b981", 3, "T", 10);
        this.drawArrow(ctx, block2CenterX, state.block2Y + state.block2Height, block2CenterX, state.block2Y + state.block2Height + (state.m2 * state.g) * forceScale, "#f59e0b", 3, "m2g", 10);
    }

    getEquationCardConfig(state) {
        const rows = !state.isMoving
            ? [
                { text: "Status: Static (Friction holds)", color: "#e11d48" },
                { text: `Max fs = mu*m1g = ${state.maxFriction.toFixed(1)} N` },
                { text: `Pull m2g = ${state.maxForceDrag.toFixed(1)} N` }
            ]
            : [
                { text: "a = g(m2 - mu*m1) / (m1 + m2)", color: "#059669" },
                { text: `a = ${state.acceleration.toFixed(2)} m/s^2`, color: "#059669", font: "bold 13px Inter", gapAfter: 35 },
                { text: "T = m2(g - a)", color: "#2563eb" },
                { text: `T = ${state.tension.toFixed(2)} N`, color: "#2563eb", font: "bold 13px Inter" }
            ];

        return {
            x: this.width - 240,
            y: 20,
            width: 220,
            height: 160,
            title: "System Equations",
            rows
        };
    }

    getTelemetryCardConfig(state) {
        return {
            rows: [
                { text: `Time: ${state.activeTime.toFixed(2)} s` },
                { text: `Dist: ${state.actualDistance.toFixed(2)} m`, color: "#38bdf8" },
                { text: `Vel: ${(state.isMoving ? state.velocity : 0).toFixed(2)} m/s`, color: "#c084fc" }
            ]
        };
    }
}
