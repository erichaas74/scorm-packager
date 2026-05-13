import AtwoodMachineBase from './AtwoodMachineBase.js';

export default class AtwoodPulley extends AtwoodMachineBase {
    constructor(canvasId) {
        super(canvasId, { duration: 4, fps: 30 });

        this.pulleyX = 325;
        this.pulleyY = 100;
        this.pulleyRadius = 25;
        this.initialY = 260;
    }

    init() {
        this.setupInputs('controls', {
            "System Parameters": {
                mass1: { label: "Mass 1 (Left) (kg)", type: "number", value: 5, step: 1 },
                mass2: { label: "Mass 2 (Right) (kg)", type: "number", value: 10, step: 1 },
                gravity: { label: "Gravity (m/s^2)", type: "number", value: 9.8, step: 0.1 }
            },
            "Display Settings": this.getCommonDisplaySettings()
        });

        this.applySimulationTime();
        this.drawPreview();
    }

    computeState(time) {
        const { mass1: m1, mass2: m2, gravity: g } = this.inputs;

        let acceleration = 0;
        let status = "Static (Balanced)";

        if (m1 !== m2) {
            acceleration = ((m2 - m1) / (m1 + m2)) * g;
            status = acceleration > 0 ? "Accelerating (m2 DOWN)" : "Accelerating (m1 DOWN)";
        }

        const tension = m1 * (g + acceleration);
        const activeTime = this.getActiveTime(time);
        const rawDisplacementPx = 0.5 * acceleration * activeTime * activeTime * this.scale;
        const velocity = acceleration * activeTime;

        const blockWidth = 40;
        const blockHeight = 40;
        const maxDispPx = 130;
        const actualDispPx = Math.max(-maxDispPx, Math.min(maxDispPx, rawDisplacementPx));

        const leftY = this.initialY - actualDispPx;
        const rightY = this.initialY + actualDispPx;
        const leftX = this.pulleyX - this.pulleyRadius - (blockWidth / 2);
        const rightX = this.pulleyX + this.pulleyRadius - (blockWidth / 2);

        return this.createState(time, {
            m1,
            m2,
            g,
            acceleration,
            tension,
            velocity,
            status,
            blockWidth,
            blockHeight,
            actualDispPx,
            displacementMeters: Math.abs(actualDispPx / this.scale),
            leftX,
            leftY,
            rightX,
            rightY
        });
    }

    drawScene(ctx, state) {
        const { blockWidth, blockHeight } = state;

        ctx.fillStyle = "#f8fafc";
        ctx.fillRect(0, 0, this.width, this.height);

        ctx.fillStyle = "#334155";
        ctx.fillRect(0, 0, this.width, 20);
        ctx.fillStyle = "#64748b";
        ctx.fillRect(this.pulleyX - 8, 20, 16, this.pulleyY - 20);

        ctx.beginPath();
        ctx.moveTo(this.pulleyX - this.pulleyRadius, this.pulleyY);
        ctx.lineTo(state.leftX + blockWidth / 2, state.leftY);
        ctx.moveTo(this.pulleyX + this.pulleyRadius, this.pulleyY);
        ctx.lineTo(state.rightX + blockWidth / 2, state.rightY);
        ctx.strokeStyle = "#94a3b8";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(this.pulleyX, this.pulleyY, this.pulleyRadius, Math.PI, 0, false);
        ctx.stroke();

        this.drawPulleyWheel(ctx, this.pulleyX, this.pulleyY, this.pulleyRadius);

        this.drawBlock(ctx, {
            x: state.leftX,
            y: state.leftY,
            width: blockWidth,
            height: blockHeight,
            fillStyle: "#3b82f6",
            strokeStyle: "#1d4ed8",
            label: "m1"
        });

        this.drawBlock(ctx, {
            x: state.rightX,
            y: state.rightY,
            width: blockWidth,
            height: blockHeight,
            fillStyle: "#ef4444",
            strokeStyle: "#b91c1c",
            label: "m2"
        });

        if (!this.inputs.showForces) return;

        const forceScale = 1.2;
        const leftCenterX = state.leftX + blockWidth / 2;
        const rightCenterX = state.rightX + blockWidth / 2;

        this.drawArrow(ctx, leftCenterX, state.leftY, leftCenterX, state.leftY - state.tension * forceScale, "#10b981", 3, "T");
        this.drawArrow(ctx, leftCenterX, state.leftY + blockHeight, leftCenterX, state.leftY + blockHeight + (state.m1 * state.g) * forceScale, "#f59e0b", 2, "m1g");

        this.drawArrow(ctx, rightCenterX, state.rightY, rightCenterX, state.rightY - state.tension * forceScale, "#10b981", 3, "T");
        this.drawArrow(ctx, rightCenterX, state.rightY + blockHeight, rightCenterX, state.rightY + blockHeight + (state.m2 * state.g) * forceScale, "#f59e0b", 3, "m2g");
    }

    getEquationCardConfig(state) {
        const rows = state.m1 === state.m2
            ? [
                { text: `Status: ${state.status}`, color: "#059669" },
                { text: "a = 0 m/s^2" },
                { text: `T = m1g = ${(state.m1 * state.g).toFixed(1)} N` }
            ]
            : [
                { text: `Status: ${state.status}`, color: "#059669", gapAfter: 15 },
                { text: "a = g(m2 - m1) / (m1 + m2)" },
                { text: `a = ${Math.abs(state.acceleration).toFixed(2)} m/s^2`, color: "#059669", font: "bold 13px Inter", gapAfter: 25 },
                { text: "T = 2(m1m2)g / (m1 + m2)", color: "#2563eb" },
                { text: `T = ${state.tension.toFixed(2)} N`, color: "#2563eb", font: "bold 13px Inter" }
            ];

        return {
            x: this.width - 240,
            y: 30,
            width: 220,
            height: 150,
            title: "System Equations",
            rows
        };
    }

    getTelemetryCardConfig(state) {
        return {
            x: 20,
            y: 30,
            width: 180,
            height: 85,
            rows: [
                { text: `Time: ${state.activeTime.toFixed(2)} s` },
                { text: `Disp: ${state.displacementMeters.toFixed(2)} m`, color: "#38bdf8" },
                { text: `Vel: ${Math.abs(state.velocity).toFixed(2)} m/s`, color: "#c084fc" }
            ]
        };
    }
}
