import AtwoodMachineBase from './AtwoodMachineBase.js';

export default class AtwoodRamp extends AtwoodMachineBase {
    constructor(canvasId) {
        super(canvasId, { duration: 4, fps: 30 });

        this.pulleyX = 450;
        this.pulleyY = 150;
        this.pulleyRadius = 15;
    }

    init() {
        this.setupInputs('controls', {
            "System Parameters": {
                mass1: { label: "Mass 1 (Ramp) (kg)", type: "number", value: 10, step: 1 },
                mass2: { label: "Mass 2 (Hanging) (kg)", type: "number", value: 6, step: 1 },
                angle: { label: "Ramp Angle (deg)", type: "number", value: 30, step: 1 },
                friction: { label: "Coefficient of Friction (mu)", type: "number", value: 0.15, step: 0.05 },
                gravity: { label: "Gravity (m/s^2)", type: "number", value: 9.8, step: 0.1 }
            },
            "Display Settings": this.getCommonDisplaySettings()
        });

        this.applySimulationTime();
        this.drawPreview();
    }

    computeState(time) {
        const { mass1: m1, mass2: m2, angle, friction: mu, gravity: g } = this.inputs;
        const angleRad = angle * (Math.PI / 180);

        const pullForce = m2 * g;
        const rampParallel = m1 * g * Math.sin(angleRad);
        const rampNormal = m1 * g * Math.cos(angleRad);
        const driveForce = pullForce - rampParallel;
        const maxFriction = mu * rampNormal;

        let acceleration = 0;
        let tension = 0;
        let frictionForce = 0;
        let status = "Static";

        if (driveForce > maxFriction) {
            acceleration = (driveForce - maxFriction) / (m1 + m2);
            tension = m2 * (g - acceleration);
            frictionForce = maxFriction;
            status = "Accelerating (m1 UP)";
        } else if (driveForce < -maxFriction) {
            acceleration = (driveForce + maxFriction) / (m1 + m2);
            tension = m2 * (g - acceleration);
            frictionForce = -maxFriction;
            status = "Accelerating (m1 DOWN)";
        } else {
            tension = pullForce;
            frictionForce = driveForce;
            status = "Static (Friction holds)";
        }

        const activeTime = this.getActiveTime(time);
        const rawDispPx = 0.5 * acceleration * activeTime * activeTime * this.scale;
        const velocity = acceleration * activeTime;

        const ux = -Math.cos(angleRad);
        const uy = Math.sin(angleRad);
        const nx = -Math.sin(angleRad);
        const ny = -Math.cos(angleRad);

        const tangentX = this.pulleyX + this.pulleyRadius * nx;
        const tangentY = this.pulleyY + this.pulleyRadius * ny;

        const block1Width = 50;
        const block1Height = 40;
        const block2Width = 30;
        const block2Height = 40;
        const initialRampDistance = 220;
        const initialHangDistance = 80;

        let dispPx = rawDispPx;
        if (dispPx > initialRampDistance - 35) dispPx = initialRampDistance - 35;
        if (dispPx < -200) dispPx = -200;

        const rampDistance = initialRampDistance - dispPx;
        const hangingDistance = initialHangDistance + dispPx;

        const block1CenterX = tangentX + rampDistance * ux;
        const block1CenterY = tangentY + rampDistance * uy;
        const block2CenterX = this.pulleyX + this.pulleyRadius;
        const block2CenterY = this.pulleyY + hangingDistance;

        const displayDisp = dispPx === rawDispPx
            ? rawDispPx / this.scale
            : (dispPx - initialRampDistance + 220) / this.scale;

        return this.createState(time, {
            m1,
            m2,
            mu,
            g,
            angle,
            angleRad,
            pullForce,
            rampParallel,
            rampNormal,
            driveForce,
            maxFriction,
            acceleration,
            tension,
            frictionForce,
            status,
            velocity,
            ux,
            uy,
            nx,
            ny,
            tangentX,
            tangentY,
            block1Width,
            block1Height,
            block2Width,
            block2Height,
            initialRampDistance,
            initialHangDistance,
            rawDispPx,
            dispPx,
            rampDistance,
            hangingDistance,
            block1CenterX,
            block1CenterY,
            block2CenterX,
            block2CenterY,
            displayDisp
        });
    }

    drawScene(ctx, state) {
        ctx.fillStyle = "#f8fafc";
        ctx.fillRect(0, 0, this.width, this.height);

        const rampSurfaceOffset = this.pulleyRadius - (state.block1Height / 2);
        const rampStartX = this.pulleyX + rampSurfaceOffset * state.nx;
        const rampStartY = this.pulleyY + rampSurfaceOffset * state.ny;

        ctx.beginPath();
        ctx.moveTo(rampStartX, rampStartY);
        ctx.lineTo(rampStartX + 800 * state.ux, rampStartY + 800 * state.uy);
        ctx.lineTo(rampStartX + 800 * state.ux, this.height);
        ctx.lineTo(this.pulleyX, this.height);
        ctx.lineTo(this.pulleyX, this.pulleyY);
        ctx.closePath();
        ctx.fillStyle = "#334155";
        ctx.fill();

        ctx.fillStyle = "#475569";
        ctx.fillRect(this.pulleyX - 15, this.pulleyY, 30, this.height - this.pulleyY);

        ctx.beginPath();
        ctx.moveTo(state.tangentX, state.tangentY);
        ctx.lineTo(state.block1CenterX, state.block1CenterY);
        ctx.moveTo(state.block2CenterX, this.pulleyY);
        ctx.lineTo(state.block2CenterX, state.block2CenterY);
        ctx.strokeStyle = "#94a3b8";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        const startAngle = Math.atan2(state.ny, state.nx);
        ctx.arc(this.pulleyX, this.pulleyY, this.pulleyRadius, startAngle, 0, false);
        ctx.stroke();

        this.drawPulleyWheel(ctx, this.pulleyX, this.pulleyY, this.pulleyRadius);

        ctx.save();
        ctx.translate(state.block1CenterX, state.block1CenterY);
        ctx.rotate(Math.atan2(state.uy, state.ux));
        this.drawBlock(ctx, {
            x: -state.block1Width / 2,
            y: -state.block1Height / 2,
            width: state.block1Width,
            height: state.block1Height,
            fillStyle: "#3b82f6",
            strokeStyle: "#1d4ed8"
        });
        ctx.restore();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 14px Inter";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("m1", state.block1CenterX, state.block1CenterY);
        ctx.textAlign = "start";
        ctx.textBaseline = "alphabetic";

        this.drawBlock(ctx, {
            x: state.block2CenterX - state.block2Width / 2,
            y: state.block2CenterY - state.block2Height / 2,
            width: state.block2Width,
            height: state.block2Height,
            fillStyle: "#ef4444",
            strokeStyle: "#b91c1c",
            label: "m2",
            labelFont: "bold 13px Inter"
        });

        if (!this.inputs.showForces) return;

        const forceScale = 1.2;
        this.drawArrow(ctx, state.block1CenterX, state.block1CenterY, state.block1CenterX, state.block1CenterY + state.m1 * state.g * forceScale, "#f59e0b", 2, "m1g");
        this.drawArrow(ctx, state.block1CenterX, state.block1CenterY, state.block1CenterX + state.nx * state.rampNormal * forceScale, state.block1CenterY + state.ny * state.rampNormal * forceScale, "#a855f7", 2, "Fn");
        this.drawArrow(ctx, state.block1CenterX, state.block1CenterY, state.block1CenterX - state.ux * state.tension * forceScale, state.block1CenterY - state.uy * state.tension * forceScale, "#10b981", 3, "T");

        if (state.mu > 0 && Math.abs(state.frictionForce) > 0.1) {
            const dirX = state.frictionForce > 0 ? state.ux : -state.ux;
            const dirY = state.frictionForce > 0 ? state.uy : -state.uy;
            const frictionMag = Math.abs(state.frictionForce);
            this.drawArrow(ctx, state.block1CenterX, state.block1CenterY, state.block1CenterX + dirX * frictionMag * forceScale, state.block1CenterY + dirY * frictionMag * forceScale, "#f43f5e", 3, state.status.includes("Static") ? "fs" : "fk");
        }

        this.drawArrow(ctx, state.block2CenterX, state.block2CenterY, state.block2CenterX, state.block2CenterY - state.tension * forceScale, "#10b981", 3, "T");
        this.drawArrow(ctx, state.block2CenterX, state.block2CenterY, state.block2CenterX, state.block2CenterY + state.m2 * state.g * forceScale, "#f59e0b", 3, "m2g");
    }

    getEquationCardConfig(state) {
        const rows = state.status.includes("Static")
            ? [
                { text: `Status: ${state.status}`, color: "#e11d48" },
                { text: "Net Pull = m2g - m1g*sin(theta)" },
                { text: `Net Pull = ${state.driveForce.toFixed(1)} N` },
                { text: `Max fs = mu*m1g*cos(theta) = ${state.maxFriction.toFixed(1)} N` }
            ]
            : [
                { text: `Status: ${state.status}`, color: "#059669", gapAfter: 15 },
                { text: "Fnet = m2g - m1g*sin(theta) +/- fk" },
                { text: `a = ${state.acceleration.toFixed(2)} m/s^2`, color: "#059669", font: "bold 13px Inter", gapAfter: 25 },
                { text: "T = m2(g - a)", color: "#2563eb" },
                { text: `T = ${state.tension.toFixed(2)} N`, color: "#2563eb", font: "bold 13px Inter" }
            ];

        return {
            x: this.width - 250,
            y: 20,
            width: 230,
            height: 165,
            title: "System Equations",
            rows
        };
    }

    getTelemetryCardConfig(state) {
        return {
            rows: [
                { text: `Time: ${state.activeTime.toFixed(2)} s` },
                { text: `Disp: ${state.displayDisp.toFixed(2)} m`, color: "#38bdf8" },
                { text: `Vel: ${state.status.includes("Static") ? "0.00" : state.velocity.toFixed(2)} m/s`, color: "#c084fc" }
            ]
        };
    }
}
