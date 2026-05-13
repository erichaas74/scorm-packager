import SimulationGifMaker from '../core/SimulationGifMaker.js';

export default class AtwoodMachineBase extends SimulationGifMaker {
    constructor(canvasId, config = { duration: 4, fps: 30 }) {
        super(canvasId, config);

        this.scale = 35;
    }

    getCommonDisplaySettings(defaultTime = 2.5) {
        return {
            simulateTime: { label: "Simulate For (s)", type: "number", value: defaultTime, step: 0.1 },
            showForces: { label: "Show Force Vectors (FBD)", type: "checkbox", value: true },
            showEquations: { label: "Show Equation Breakdown", type: "checkbox", value: true },
            showTelemetry: { label: "Show Live Telemetry", type: "checkbox", value: true }
        };
    }

    applySimulationTime() {
        this.config.duration = this.inputs.simulateTime;
    }

    getActiveTime(time) {
        return Math.min(time, this.inputs.simulateTime);
    }

    createState(time, extra = {}) {
        return {
            time,
            activeTime: this.getActiveTime(time),
            ...extra
        };
    }

    drawFrame(ctx, time) {
        const state = this.computeState(time);
        this.drawScene(ctx, state);
        this.drawOverlays(ctx, state);
    }

    computeState() {
        throw new Error('AtwoodMachineBase subclasses must implement computeState(time).');
    }

    drawScene() {
        throw new Error('AtwoodMachineBase subclasses must implement drawScene(ctx, state).');
    }

    getEquationCardConfig() {
        return null;
    }

    getTelemetryCardConfig() {
        return null;
    }

    drawOverlays(ctx, state) {
        if (this.inputs.showEquations) {
            const equationCard = this.getEquationCardConfig(state);
            if (equationCard) {
                this.drawInfoCard(ctx, equationCard);
            }
        }

        if (this.inputs.showTelemetry) {
            const telemetryCard = this.getTelemetryCardConfig(state);
            if (telemetryCard) {
                this.drawTelemetryCard(ctx, telemetryCard);
            }
        }
    }

    drawArrow(ctx, fromX, fromY, toX, toY, color, width = 2, label = "", labelOffset = 12) {
        const headLength = 8;
        const angle = Math.atan2(toY - fromY, toX - fromX);

        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.lineTo(
            toX - headLength * Math.cos(angle - Math.PI / 6),
            toY - headLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(toX, toY);
        ctx.lineTo(
            toX - headLength * Math.cos(angle + Math.PI / 6),
            toY - headLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.stroke();

        if (!label) return;

        ctx.fillStyle = color;
        ctx.font = "bold 12px Inter";
        const labelX = toX + labelOffset * Math.cos(angle);
        const labelY = toY + labelOffset * Math.sin(angle);
        ctx.fillText(label, labelX - 6, labelY + 4);
    }

    fillRoundedRect(ctx, x, y, width, height, radius = 8) {
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(x, y, width, height, radius);
        } else {
            ctx.rect(x, y, width, height);
        }
        ctx.fill();
    }

    strokeRoundedRect(ctx, x, y, width, height, radius = 8) {
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(x, y, width, height, radius);
        } else {
            ctx.rect(x, y, width, height);
        }
        ctx.stroke();
    }

    drawCard(ctx, {
        x,
        y,
        width,
        height,
        fillStyle = "rgba(255, 255, 255, 0.95)",
        strokeStyle = "#cbd5e1",
        lineWidth = 1,
        radius = 8
    }) {
        ctx.fillStyle = fillStyle;
        this.fillRoundedRect(ctx, x, y, width, height, radius);
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = lineWidth;
        this.strokeRoundedRect(ctx, x, y, width, height, radius);
    }

    drawInfoCard(ctx, {
        x,
        y,
        width,
        height,
        title,
        rows,
        radius = 8
    }) {
        this.drawCard(ctx, { x, y, width, height, radius });

        ctx.fillStyle = "#0f172a";
        ctx.font = "bold 13px Inter";
        ctx.fillText(title, x + 15, y + 25);

        ctx.beginPath();
        ctx.moveTo(x + 15, y + 32);
        ctx.lineTo(x + width - 15, y + 32);
        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 1;
        ctx.stroke();

        let cursorY = y + 55;
        for (const row of rows) {
            ctx.fillStyle = row.color ?? "#475569";
            ctx.font = row.font ?? "12px Inter";
            ctx.fillText(row.text, x + 15, cursorY);
            cursorY += row.gapAfter ?? 20;
        }
    }

    drawTelemetryCard(ctx, {
        x = 20,
        y = 20,
        width = 180,
        height = 85,
        rows,
        radius = 8
    }) {
        this.drawCard(ctx, {
            x,
            y,
            width,
            height,
            fillStyle: "rgba(15, 23, 42, 0.85)",
            strokeStyle: "rgba(15, 23, 42, 0.1)",
            radius
        });

        let cursorY = y + 25;
        for (const row of rows) {
            ctx.fillStyle = row.color ?? "#f8fafc";
            ctx.font = row.font ?? "bold 13px Inter";
            ctx.fillText(row.text, x + 15, cursorY);
            cursorY += row.gapAfter ?? 20;
        }
    }

    drawBlock(ctx, {
        x,
        y,
        width,
        height,
        fillStyle,
        strokeStyle,
        label,
        labelColor = "#ffffff",
        labelFont = "bold 14px Inter",
        labelX = x + width / 2,
        labelY = y + height / 2,
        centeredLabel = true
    }) {
        ctx.fillStyle = fillStyle;
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        if (!label) return;

        ctx.fillStyle = labelColor;
        ctx.font = labelFont;
        if (centeredLabel) {
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(label, labelX, labelY);
            ctx.textAlign = "start";
            ctx.textBaseline = "alphabetic";
            return;
        }

        ctx.fillText(label, labelX, labelY);
    }

    drawPulleyWheel(ctx, x, y, radius) {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = "#cbd5e1";
        ctx.fill();
        ctx.strokeStyle = "#475569";
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#1e293b";
        ctx.fill();
    }
}
