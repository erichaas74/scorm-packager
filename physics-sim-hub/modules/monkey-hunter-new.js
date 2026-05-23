import SimulationGifMaker from '../core/SimulationGifMaker.js';

export default class MonkeyHunter extends SimulationGifMaker {
    constructor(canvasId) {
        super(canvasId, { duration: 4, fps: 30 });
        this.groundY = this.height - 90;
    }

    init() {
        this.setupInputs('controls', {
            "Physics Parameters": {
                targetDist:      { label: "Distance to Target X (m)",  type: "number",   value: 45,  step: 1 },
                targetHeight:    { label: "Target Initial Height Y (m)", type: "number",  value: 20,  step: 1 },
                initialVelocity: { label: "Projectile Velocity (m/s)",  type: "number",   value: 32,  step: 1 },
                gravity:         { label: "Gravity (m/s²)",             type: "number",   value: 9.8, step: 0.1 }
            },
            "Problem-Solving Walkthrough": {
                walkthroughStep: {
                    label: "Walkthrough Step",
                    type: "select",
                    options: [
                        "1. Known Values",
                        "2. Aiming Angle",
                        "3. Velocity Components",
                        "4. Time to Target",
                        "5. Vertical Position",
                        "6. Compare Both Objects"
                    ],
                    value: "1. Known Values"
                },
                showWalkthroughPanel:  { label: "Show Step-by-Step Panel",    type: "checkbox", value: true },
                showAllPreviousSteps:  { label: "Show Previous Step Visuals", type: "checkbox", value: true }
            },
            "Display Settings": {
                stopAnimation:      { label: "Stop Animation",            type: "select",   options: ["At Collision", "Custom Time"], value: "At Collision" },
                customStopTime:     { label: "Custom Stop Time (s)",      type: "number",   value: 1.5,  step: 0.1 },
                showLineOfSight:    { label: "Show Aim Line",             type: "checkbox", value: true },
                showGravityDrop:    { label: "Show Gravity Drop (½gt²)",  type: "checkbox", value: true },
                showVelocityVectors:{ label: "Show Velocity Components",  type: "checkbox", value: true },
                showTrail:          { label: "Show Motion Trails",        type: "checkbox", value: true },
                showTimerDisplay:   { label: "Show Canvas Timer",         type: "checkbox", value: true },
                showTelemetry:      { label: "Show Telemetry HUD",        type: "checkbox", value: true }
            }
        });
        this.drawPreview();
    }

    getPhysicsData() {
        const D   = Number(this.inputs.targetDist      ?? 45);
        const H   = Number(this.inputs.targetHeight    ?? 20);
        const v0  = Number(this.inputs.initialVelocity ?? 32);
        const g   = Number(this.inputs.gravity         ?? 9.8);

        const angleRad      = Math.atan2(H, D);
        const angleDeg      = angleRad * 180 / Math.PI;
        const v0x           = v0 * Math.cos(angleRad);
        const v0y           = v0 * Math.sin(angleRad);
        const tCollision    = D / v0x;
        const yAtCollision  = H - 0.5 * g * tCollision * tCollision;
        const isGroundHit   = yAtCollision <= 0;
        const tTargetGround = Math.sqrt((2 * H) / g);
        const finalTime     = isGroundHit ? Math.min(tCollision, tTargetGround) : tCollision;
        const dropAtCollision = 0.5 * g * tCollision * tCollision;
        const cannonYAtTree   = v0y * tCollision - dropAtCollision;
        const monkeyYAtTree   = H - dropAtCollision;

        return {
            D, H, v0, g, angleRad, angleDeg, v0x, v0y,
            tCollision, yAtCollision, isGroundHit, tTargetGround, finalTime,
            dropAtCollision, cannonYAtTree, monkeyYAtTree
        };
    }

    getStepIndex() {
        const value = this.inputs.walkthroughStep ?? "1. Known Values";
        const match = String(value).match(/^(\d)/);
        return match ? Math.max(0, Math.min(5, Number(match[1]) - 1)) : 0;
    }

    getVectorConfig() {
        const pd = this.getPhysicsData();
        return {
            magnitude: pd.v0,
            angleDeg:  Math.round(pd.angleDeg * 10) / 10,
            title:     "Projectile Velocity Vector"
        };
    }

    // ── Canvas helpers ──────────────────────────────────────────────────────────

    roundRectPath(ctx, x, y, w, h, r) {
        const radius = Math.min(r, w / 2, h / 2);
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + w - radius, y);
        ctx.quadraticCurveTo(x + w, y,         x + w, y + radius);
        ctx.lineTo(x + w, y + h - radius);
        ctx.quadraticCurveTo(x + w, y + h,     x + w - radius, y + h);
        ctx.lineTo(x + radius, y + h);
        ctx.quadraticCurveTo(x, y + h,         x, y + h - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y,             x + radius, y);
        ctx.closePath();
    }

    fillRoundRect(ctx, x, y, w, h, r, fillStyle, strokeStyle = null, lineWidth = 1) {
        ctx.save();
        this.roundRectPath(ctx, x, y, w, h, r);
        ctx.fillStyle = fillStyle;
        ctx.fill();
        if (strokeStyle) {
            ctx.strokeStyle = strokeStyle;
            ctx.lineWidth   = lineWidth;
            ctx.stroke();
        }
        ctx.restore();
    }

    drawArrow(ctx, fromX, fromY, toX, toY, color, width = 2, doubleEnded = false) {
        const headlen = 10;
        const angle   = Math.atan2(toY - fromY, toX - fromX);

        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.lineTo(
            toX - headlen * Math.cos(angle - Math.PI / 6),
            toY - headlen * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(toX, toY);
        ctx.lineTo(
            toX - headlen * Math.cos(angle + Math.PI / 6),
            toY - headlen * Math.sin(angle + Math.PI / 6)
        );

        if (doubleEnded) {
            ctx.moveTo(fromX, fromY);
            ctx.lineTo(
                fromX + headlen * Math.cos(angle - Math.PI / 6),
                fromY + headlen * Math.sin(angle - Math.PI / 6)
            );
            ctx.moveTo(fromX, fromY);
            ctx.lineTo(
                fromX + headlen * Math.cos(angle + Math.PI / 6),
                fromY + headlen * Math.sin(angle + Math.PI / 6)
            );
        }

        ctx.strokeStyle = color;
        ctx.lineWidth   = width;
        ctx.lineCap     = "round";
        ctx.lineJoin    = "round";
        ctx.stroke();
    }

    // ── Scene drawing ───────────────────────────────────────────────────────────

    drawBackground(ctx) {
        const skyGrad = ctx.createLinearGradient(0, 0, 0, this.groundY);
        skyGrad.addColorStop(0,    "#0f172a");
        skyGrad.addColorStop(0.16, "#2563eb");
        skyGrad.addColorStop(0.52, "#7dd3fc");
        skyGrad.addColorStop(1,    "#dbeafe");
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, this.width, this.groundY);

        const sunX   = this.width - 145;
        const sunY   = 86;
        const sunGlow = ctx.createRadialGradient(sunX, sunY, 8, sunX, sunY, 78);
        sunGlow.addColorStop(0,    "rgba(255,255,220,0.95)");
        sunGlow.addColorStop(0.45, "rgba(253,224,71,0.8)");
        sunGlow.addColorStop(1,    "rgba(253,224,71,0)");
        ctx.fillStyle = sunGlow;
        ctx.beginPath();
        ctx.arc(sunX, sunY, 78, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fde68a";
        ctx.beginPath();
        ctx.arc(sunX, sunY, 28, 0, Math.PI * 2);
        ctx.fill();

        const drawCloud = (x, y, scale = 1) => {
            ctx.fillStyle = "rgba(255,255,255,0.82)";
            ctx.beginPath();
            ctx.arc(x,                  y,              18 * scale, 0, Math.PI * 2);
            ctx.arc(x + 22 * scale,     y - 6 * scale,  26 * scale, 0, Math.PI * 2);
            ctx.arc(x + 48 * scale,     y,              20 * scale, 0, Math.PI * 2);
            ctx.arc(x + 26 * scale,     y + 8 * scale,  26 * scale, 0, Math.PI * 2);
            ctx.fill();
        };
        drawCloud(95,               85,  1.1);
        drawCloud(this.width * 0.38, 128, 0.9);
        drawCloud(this.width * 0.70, 68,  0.75);

        ctx.fillStyle = "rgba(30,64,175,0.28)";
        ctx.beginPath();
        ctx.moveTo(0, this.groundY - 95);
        ctx.quadraticCurveTo(this.width * 0.12, this.groundY - 150, this.width * 0.23, this.groundY - 105);
        ctx.quadraticCurveTo(this.width * 0.32, this.groundY - 155, this.width * 0.44, this.groundY - 102);
        ctx.lineTo(this.width * 0.44, this.groundY - 70);
        ctx.lineTo(0, this.groundY - 70);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "rgba(15,23,42,0.16)";
        ctx.beginPath();
        ctx.moveTo(this.width * 0.52,  this.groundY - 75);
        ctx.quadraticCurveTo(this.width * 0.65, this.groundY - 125, this.width * 0.79, this.groundY - 88);
        ctx.quadraticCurveTo(this.width * 0.88, this.groundY - 115, this.width,         this.groundY - 84);
        ctx.lineTo(this.width, this.groundY - 55);
        ctx.lineTo(this.width * 0.52, this.groundY - 55);
        ctx.closePath();
        ctx.fill();

        const oceanTop  = this.groundY - 58;
        const oceanGrad = ctx.createLinearGradient(0, oceanTop, 0, this.groundY + 10);
        oceanGrad.addColorStop(0,    "#38bdf8");
        oceanGrad.addColorStop(0.55, "#0ea5e9");
        oceanGrad.addColorStop(1,    "#0369a1");
        ctx.fillStyle = oceanGrad;
        ctx.fillRect(0, oceanTop, this.width, 65);

        ctx.strokeStyle = "rgba(255,255,255,0.35)";
        ctx.lineWidth   = 2;
        for (let i = 0; i < 4; i++) {
            const y = oceanTop + 14 + i * 12;
            ctx.beginPath();
            for (let x = -20; x <= this.width + 20; x += 20) {
                const waveY = y + Math.sin((x + i * 40) * 0.03) * 3;
                if (x === -20) ctx.moveTo(x, waveY);
                else           ctx.lineTo(x, waveY);
            }
            ctx.stroke();
        }

        const sandGrad = ctx.createLinearGradient(0, this.groundY - 5, 0, this.height);
        sandGrad.addColorStop(0,    "#fef08a");
        sandGrad.addColorStop(0.45, "#fde68a");
        sandGrad.addColorStop(1,    "#f59e0b");
        ctx.fillStyle = sandGrad;
        ctx.beginPath();
        ctx.moveTo(0, this.groundY - 8);
        ctx.quadraticCurveTo(this.width * 0.18, this.groundY + 22,  this.width * 0.35, this.groundY - 6);
        ctx.quadraticCurveTo(this.width * 0.58, this.groundY - 28,  this.width * 0.74, this.groundY + 16);
        ctx.quadraticCurveTo(this.width * 0.88, this.groundY + 36,  this.width,         this.groundY - 2);
        ctx.lineTo(this.width, this.height);
        ctx.lineTo(0, this.height);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "#d97706";
        ctx.beginPath();
        ctx.moveTo(0, this.groundY + 10);
        ctx.quadraticCurveTo(80, this.groundY - 70, 185, this.groundY + 8);
        ctx.lineTo(0, this.height);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "#ca8a04";
        ctx.beginPath();
        ctx.moveTo(this.width - 230, this.groundY + 10);
        ctx.quadraticCurveTo(this.width - 110, this.groundY - 50, this.width, this.groundY + 12);
        ctx.lineTo(this.width, this.height);
        ctx.lineTo(this.width - 230, this.height);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "rgba(120,53,15,0.35)";
        [
            [78,              this.groundY + 28, 9],
            [155,             this.groundY + 42, 7],
            [this.width - 108, this.groundY + 33, 11],
            [this.width - 60,  this.groundY + 45, 8]
        ].forEach(([x, y, r]) => {
            ctx.beginPath();
            ctx.ellipse(x, y, r, r * 0.55, 0, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    drawCannon(ctx, x, y, angle) {
        ctx.save();
        ctx.translate(x, y);

        ctx.save();
        ctx.rotate(-angle);
        const barrelGrad = ctx.createLinearGradient(-15, -12, 58, 12);
        barrelGrad.addColorStop(0,   "#111827");
        barrelGrad.addColorStop(0.5, "#475569");
        barrelGrad.addColorStop(1,   "#020617");
        ctx.fillStyle = barrelGrad;
        ctx.beginPath();
        ctx.moveTo(-18, -10);
        ctx.lineTo(45,  -8);
        ctx.lineTo(58,  -14);
        ctx.lineTo(58,   14);
        ctx.lineTo(45,   8);
        ctx.lineTo(-18,  10);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#020617";
        ctx.lineWidth   = 2;
        ctx.stroke();
        ctx.fillStyle = "#0f172a";
        ctx.beginPath();
        ctx.arc(58, 0, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = "#7c2d12";
        ctx.beginPath();
        ctx.moveTo(-38, 14);
        ctx.lineTo(28,   5);
        ctx.lineTo(44,  20);
        ctx.lineTo(-28, 28);
        ctx.closePath();
        ctx.fill();

        const drawWheel = (wx, wy, r) => {
            ctx.fillStyle = "#451a03";
            ctx.beginPath();
            ctx.arc(wx, wy, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#b45309";
            ctx.beginPath();
            ctx.arc(wx, wy, r - 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#451a03";
            ctx.lineWidth   = 3;
            for (let i = 0; i < 8; i++) {
                ctx.beginPath();
                ctx.moveTo(wx, wy);
                ctx.lineTo(
                    wx + (r - 3) * Math.cos(i * Math.PI / 4),
                    wy + (r - 3) * Math.sin(i * Math.PI / 4)
                );
                ctx.stroke();
            }
            ctx.fillStyle = "#fcd34d";
            ctx.beginPath();
            ctx.arc(wx, wy, r / 4, 0, Math.PI * 2);
            ctx.fill();
        };
        drawWheel(-25, 24, 12);
        drawWheel(10,  20, 17);

        ctx.restore();
    }

    drawPalmTree(ctx, x, baseY, topY) {
        ctx.save();

        ctx.fillStyle = "#92400e";
        ctx.beginPath();
        ctx.moveTo(x + 16, baseY);
        ctx.quadraticCurveTo(x + 8,  baseY - 80, x - 4,  topY);
        ctx.lineTo(x - 18, topY);
        ctx.quadraticCurveTo(x - 6,  baseY - 80, x - 18, baseY);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = "#78350f";
        ctx.lineWidth   = 2;
        for (let py = baseY - 20; py > topY + 10; py -= 17) {
            ctx.beginPath();
            const offset = (baseY - py) * 0.04;
            ctx.moveTo(x - 14 + offset, py);
            ctx.lineTo(x + 12 - offset, py + 3);
            ctx.stroke();
        }

        const drawFrond = (angle, length, width) => {
            ctx.save();
            ctx.translate(x - 10, topY);
            ctx.rotate(angle);
            ctx.fillStyle   = "#22c55e";
            ctx.strokeStyle = "#166534";
            ctx.lineWidth   = 1.5;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(length * 0.45, -width,       length, 0);
            ctx.quadraticCurveTo(length * 0.45,  width * 0.45, 0,      0);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        };
        drawFrond(-Math.PI / 8,              145, 38);
        drawFrond( Math.PI / 10,             160, 45);
        drawFrond( Math.PI / 4,              130, 38);
        drawFrond( Math.PI - Math.PI / 8,    150, 40);
        drawFrond( Math.PI + Math.PI / 10,   140, 45);
        drawFrond( Math.PI + Math.PI / 4,    115, 32);

        ctx.restore();
    }

    drawMonkey(ctx, x, y) {
        ctx.save();
        ctx.translate(x, y);

        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.quadraticCurveTo(20, -35, 5, -50);
        ctx.strokeStyle = "#8b4513";
        ctx.lineWidth   = 4;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-6, -4);
        ctx.lineTo(-16, -24);
        ctx.moveTo(6, -4);
        ctx.lineTo(17, -24);
        ctx.strokeStyle = "#8b4513";
        ctx.lineWidth   = 4;
        ctx.stroke();

        ctx.fillStyle = "#a0522d";
        ctx.beginPath();
        ctx.ellipse(0, 10, 13, 17, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#f5deb3";
        ctx.beginPath();
        ctx.ellipse(0, 12, 7, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#a0522d";
        ctx.beginPath();
        ctx.arc(0,   -7, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-12, -7, 5,  0, Math.PI * 2);
        ctx.arc(12,  -7, 5,  0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#f5deb3";
        ctx.beginPath();
        ctx.ellipse(0, -5, 9, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#000";
        ctx.beginPath();
        ctx.arc(-3, -7, 1.5, 0, Math.PI * 2);
        ctx.arc(3,  -7, 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(0, -1, 3, 0.1, Math.PI - 0.1);
        ctx.strokeStyle = "#3e2723";
        ctx.lineWidth   = 1;
        ctx.stroke();

        ctx.restore();
    }

    drawBracket(ctx, x, y1, y2, label) {
        const w   = 8;
        const midY = (y1 + y2) / 2;
        ctx.beginPath();
        ctx.moveTo(x + w, y1);
        ctx.lineTo(x,     y1);
        ctx.lineTo(x,     y2);
        ctx.lineTo(x + w, y2);
        ctx.moveTo(x,         midY);
        ctx.lineTo(x - w + 2, midY);
        ctx.strokeStyle = "#0f172a";
        ctx.lineWidth   = 1.5;
        ctx.stroke();
        ctx.fillStyle   = "#0f172a";
        ctx.font        = "bold 13px Inter, Arial, sans-serif";
        ctx.textAlign      = "right";
        ctx.textBaseline   = "middle";
        ctx.fillText(label, x - w - 4, midY);
        ctx.textAlign = "left";
    }

    drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
        const words    = String(text).split(" ");
        let line       = "";
        let currentY   = y;
        for (let n = 0; n < words.length; n++) {
            const testLine  = line + words[n] + " ";
            const testWidth = ctx.measureText(testLine).width;
            if (testWidth > maxWidth && n > 0) {
                ctx.fillText(line, x, currentY);
                line     = words[n] + " ";
                currentY += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, currentY);
        return currentY + lineHeight;
    }

    // ── Walkthrough data ────────────────────────────────────────────────────────

    getStepData(pd) {
        const fmt  = (value, digits = 2) => Number(value).toFixed(digits);
        const angleLabel           = fmt(pd.angleDeg, 1);
        const timeLabel            = fmt(pd.tCollision, 2);
        const verticalRiseBeforeGravity = pd.v0y * pd.tCollision;

        return [
            {
                title:   "1. Identify the known values",
                formula: "Known values",
                lines: [
                    `Horizontal distance: Δx = ${pd.D} m`,
                    `Monkey height: Δy = ${pd.H} m`,
                    `Initial speed: v₀ = ${pd.v0} m/s`,
                    `Gravity: aᵧ = -${pd.g} m/s²`
                ],
                key: "Separate horizontal and vertical motion before solving."
            },
            {
                title:   "2. Find the aiming angle",
                formula: "θ = tan⁻¹(Δy / Δx)",
                lines: [
                    `θ = tan⁻¹(${pd.H} / ${pd.D})`,
                    `θ = ${angleLabel}°`
                ],
                key: "This is the straight-line aim angle before gravity affects the shot."
            },
            {
                title:   "3. Break velocity into components",
                formula: "vₓ = v₀cosθ  vᵧ = v₀sinθ",
                lines: [
                    `vₓ = ${pd.v0}cos(${angleLabel}°) = ${fmt(pd.v0x)} m/s`,
                    `vᵧ = ${pd.v0}sin(${angleLabel}°) = ${fmt(pd.v0y)} m/s`
                ],
                key: "Horizontal velocity stays constant. Vertical velocity changes because of gravity."
            },
            {
                title:   "4. Solve for the time to reach the tree",
                formula: "Δx = vₓt  →  t = Δx / vₓ",
                lines: [
                    `${pd.D} = ${fmt(pd.v0x)}t`,
                    `t = ${pd.D} / ${fmt(pd.v0x)}`,
                    `t = ${timeLabel} s`
                ],
                key: "This is when the ball is horizontally lined up with the monkey."
            },
            {
                title:   "5. Find the cannonball height",
                formula: "Δy = vᵧt + ½aᵧt²",
                lines: [
                    `Δy = (${fmt(pd.v0y)})(${timeLabel}) + ½(-${pd.g})(${timeLabel})²`,
                    `Δy = ${fmt(verticalRiseBeforeGravity)} - ${fmt(pd.dropAtCollision)}`,
                    `Cannonball height at tree = ${fmt(pd.cannonYAtTree)} m`
                ],
                key: "The cannonball drops below the original aim line by exactly ½gt²."
            },
            {
                title:   "6. Compare both objects",
                formula: "Monkey height = H - ½gt²",
                lines: [
                    `Monkey height = ${pd.H} - ${fmt(pd.dropAtCollision)} = ${fmt(pd.monkeyYAtTree)} m`,
                    `Cannonball height = ${fmt(pd.cannonYAtTree)} m`,
                    pd.isGroundHit
                        ? "The shot reaches the ground first. Increase speed."
                        : "Same height at the tree, so the shot hits."
                ],
                key: "Aiming directly at the monkey works because both objects fall the same distance in the same time."
            }
        ];
    }

    // ── HUD panels ──────────────────────────────────────────────────────────────

    drawWalkthroughPanel(ctx, pd, stepIndex) {
        const steps  = this.getStepData(pd);
        const step   = steps[stepIndex];
        const panelW = 330;
        const panelX = this.width - panelW - 18;
        const panelY = 18;
        const panelH = 205;

        this.fillRoundRect(ctx, panelX, panelY, panelW, panelH, 14,
            "rgba(255,255,255,0.94)", "rgba(15,23,42,0.14)", 1.5);

        ctx.fillStyle    = "#0f172a";
        ctx.font         = "bold 17px Inter, Arial, sans-serif";
        ctx.textAlign    = "left";
        ctx.textBaseline = "alphabetic";
        ctx.fillText(step.title, panelX + 16, panelY + 28);

        for (let i = 0; i < 6; i++) {
            ctx.beginPath();
            ctx.arc(panelX + 18 + i * 15, panelY + 48, 4, 0, Math.PI * 2);
            ctx.fillStyle = i <= stepIndex ? "#2563eb" : "#cbd5e1";
            ctx.fill();
        }

        this.fillRoundRect(ctx, panelX + 14, panelY + 60, panelW - 28, 32, 8, "#0f172a");
        ctx.fillStyle = "#f8fafc";
        ctx.font      = "bold 13px JetBrains Mono, Consolas, monospace";
        ctx.fillText(step.formula, panelX + 26, panelY + 82);

        let y = panelY + 114;
        step.lines.forEach((line, index) => {
            ctx.fillStyle = "#dbeafe";
            ctx.beginPath();
            ctx.arc(panelX + 23, y - 4, 9, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle  = "#1d4ed8";
            ctx.font       = "bold 11px Inter, Arial, sans-serif";
            ctx.textAlign  = "center";
            ctx.fillText(String(index + 1), panelX + 23, y);
            ctx.fillStyle  = "#334155";
            ctx.font       = "12px JetBrains Mono, Consolas, monospace";
            ctx.textAlign  = "left";
            ctx.fillText(line, panelX + 40, y);
            y += 22;
        });

        this.fillRoundRect(ctx, panelX + 14, panelY + panelH - 36, panelW - 28, 24, 8,
            "#fef3c7", "#fbbf24", 1);
        ctx.fillStyle = "#78350f";
        ctx.font      = "bold 11px Inter, Arial, sans-serif";
        this.drawWrappedText(ctx, step.key, panelX + 24, panelY + panelH - 20, panelW - 48, 13);
    }

    drawTelemetry(ctx, pd, projY, targetY, remainingX, activeTime) {
        const boxX = 20;
        const boxY = 20;
        const boxW = 235;
        const boxH = 122;

        this.fillRoundRect(ctx, boxX, boxY, boxW, boxH, 12,
            "rgba(15,23,42,0.86)", "rgba(255,255,255,0.1)");

        ctx.fillStyle = "#f8fafc";
        ctx.font      = "bold 13px Inter, Arial, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText("Telemetry", boxX + 15, boxY + 25);

        ctx.strokeStyle = "rgba(255,255,255,0.15)";
        ctx.beginPath();
        ctx.moveTo(boxX + 15,        boxY + 35);
        ctx.lineTo(boxX + boxW - 15, boxY + 35);
        ctx.stroke();

        ctx.font = "12px JetBrains Mono, Consolas, monospace";
        ctx.fillStyle = "#38bdf8"; ctx.fillText(`Time: ${activeTime.toFixed(2)} s`,           boxX + 15, boxY + 55);
        ctx.fillStyle = "#60a5fa"; ctx.fillText(`Proj Y: ${projY.toFixed(2)} m`,               boxX + 15, boxY + 75);
        ctx.fillStyle = "#c084fc"; ctx.fillText(`Monkey Y: ${targetY.toFixed(2)} m`,           boxX + 15, boxY + 95);
        ctx.fillStyle = "#f43f5e"; ctx.fillText(`X gap: ${Math.max(0, remainingX).toFixed(2)} m`, boxX + 15, boxY + 115);
    }

    drawTimer(ctx, activeTime) {
        const timerText = `${activeTime.toFixed(2)} s`;
        ctx.font        = "bold 16px Inter, Arial, sans-serif";
        const textWidth = ctx.measureText(timerText).width;
        const tx        = (this.width / 2) - ((textWidth + 30) / 2);
        this.fillRoundRect(ctx, tx, 15, textWidth + 30, 34, 17, "rgba(255,255,255,0.9)", "#cbd5e1");
        ctx.fillStyle = "#0f172a";
        ctx.fillText(timerText, tx + 15, 38);
    }

    // ── Main render ─────────────────────────────────────────────────────────────

    drawFrame(ctx, time) {
        const pd          = this.getPhysicsData();
        const stepIndex   = this.getStepIndex();
        const showPrevious = this.inputs.showAllPreviousSteps ?? true;

        // effectiveStep gates which accumulated visuals are visible
        const effectiveStep = showPrevious ? stepIndex : 0;

        let stopTime = pd.finalTime;
        if (this.inputs.stopAnimation === "Custom Time") {
            stopTime = Number(this.inputs.customStopTime ?? 1.5);
        }

        const activeTime = Math.min(time, stopTime);
        const isFinished = time >= stopTime;

        const cannonBaseX  = 86;
        const cannonBaseY  = this.groundY - 6;
        const treeTrunkX   = this.width - 92;
        const monkeyX      = treeTrunkX - 16;

        const yScale       = Math.max(6, Math.min(18, 295 / Math.max(pd.H, 1)));
        const cTargStartY  = this.groundY - pd.H * yScale;

        const muzzleAimAngle = Math.atan2(cannonBaseY - cTargStartY, monkeyX - cannonBaseX);
        const muzzleLength   = 58;
        const originX        = cannonBaseX + muzzleLength * Math.cos(muzzleAimAngle);
        const originY        = cannonBaseY - muzzleLength * Math.sin(muzzleAimAngle);

        const xScale  = (monkeyX - originX) / Math.max(pd.D, 1);
        const projX   = pd.v0x * activeTime;
        const projY   = pd.v0y * activeTime - 0.5 * pd.g * activeTime * activeTime;
        const targetY = pd.H   - 0.5 * pd.g * activeTime * activeTime;
        const losY    = Math.tan(pd.angleRad) * projX;

        const cProjX  = originX + projX  * xScale;
        const cProjY  = originY - projY  * yScale;
        const cTargX  = monkeyX;
        const cTargY  = this.groundY - targetY * yScale;
        const cLosY   = originY - losY * yScale;

        const visualAimAngle = Math.atan2(originY - cTargStartY, cTargX - originX);

        // ── Scene
        this.drawBackground(ctx);
        this.drawPalmTree(ctx, treeTrunkX, this.groundY + 12, cTargStartY - 4);
        this.drawCannon(ctx, cannonBaseX, cannonBaseY, visualAimAngle);

        ctx.strokeStyle = "#78350f";
        ctx.lineWidth   = 2;
        ctx.beginPath();
        ctx.moveTo(cTargX + 2,  cTargStartY - 28);
        ctx.quadraticCurveTo(cTargX + 18, cTargStartY - 42, cTargX + 28, cTargStartY - 18);
        ctx.stroke();

        // ── Step 1: distance / height labels
        if (effectiveStep >= 0) {
            const groundYLine = this.groundY + 26;
            this.drawArrow(ctx, originX, groundYLine, cTargX, groundYLine, "#ef4444", 3, true);
            ctx.fillStyle = "#ef4444";
            ctx.textAlign = "center";
            ctx.font      = "bold 18px Inter, Arial, sans-serif";
            ctx.fillText(`${pd.D} m`, originX + (cTargX - originX) / 2, groundYLine + 24);

            this.drawArrow(ctx, cTargX, this.groundY, cTargX, cTargStartY, "#2563eb", 3, true);
            ctx.fillStyle = "#2563eb";
            ctx.textAlign = "left";
            ctx.fillText(`${pd.H} m`, cTargX + 14, this.groundY - (this.groundY - cTargStartY) / 2);
        }

        // ── Step 2: aim line + angle arc
        if ((this.inputs.showLineOfSight ?? true) && effectiveStep >= 1) {
            ctx.beginPath();
            ctx.moveTo(originX, originY);
            ctx.lineTo(cTargX,  cTargStartY);
            ctx.strokeStyle = "rgba(255,255,255,0.92)";
            ctx.setLineDash([7, 6]);
            ctx.lineWidth   = 2;
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.beginPath();
            ctx.arc(originX, originY, 42, -visualAimAngle, 0);
            ctx.strokeStyle = "#111827";
            ctx.lineWidth   = 2;
            ctx.stroke();

            ctx.fillStyle = "#111827";
            ctx.textAlign = "left";
            ctx.font      = "italic bold 22px Inter, Arial, sans-serif";
            ctx.fillText(`θ = ${Math.round(pd.angleDeg)}°`, originX + 50, originY - 10);
        }

        // ── Step 3: initial velocity vectors (shown only at t = 0)
        if ((this.inputs.showVelocityVectors ?? true) && effectiveStep >= 2 && activeTime === 0) {
            const canvasDistToMonkey = Math.hypot(cTargX - originX, originY - cTargStartY);
            const vScaleLen          = canvasDistToMonkey / 3;
            const vxEnd = originX + Math.cos(visualAimAngle) * vScaleLen;
            const vyEnd = originY - Math.sin(visualAimAngle) * vScaleLen;

            this.drawArrow(ctx, originX, originY, vxEnd, vyEnd,    "#d946ef", 4);
            this.drawArrow(ctx, originX, originY, vxEnd, originY,  "#ef4444", 4);
            this.drawArrow(ctx, originX, originY, originX, vyEnd,  "#2563eb", 4);

            ctx.fillStyle = "#ef4444";
            ctx.textAlign = "center";
            ctx.font      = "italic bold 17px Inter, Arial, sans-serif";
            ctx.fillText(
                `${pd.v0} cos(${Math.round(pd.angleDeg)}°) = ${pd.v0x.toFixed(1)} m/s`,
                (originX + vxEnd) / 2, originY + 30
            );
            ctx.fillStyle = "#2563eb";
            ctx.textAlign = "right";
            ctx.fillText(`${pd.v0y.toFixed(1)} m/s`, originX - 8, (originY + vyEnd) / 2);
        }

        // ── Motion trails
        if ((this.inputs.showTrail ?? true) && activeTime > 0) {
            ctx.beginPath();
            ctx.moveTo(originX, originY);
            for (let t = 0; t <= activeTime; t += 0.05) {
                const px = pd.v0x * t;
                const py = pd.v0y * t - 0.5 * pd.g * t * t;
                ctx.lineTo(originX + px * xScale, originY - py * yScale);
            }
            ctx.strokeStyle = "rgba(59,130,246,0.58)";
            ctx.lineWidth   = 3;
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(cTargX, cTargStartY);
            ctx.lineTo(cTargX, cTargY);
            ctx.strokeStyle = "rgba(168,85,247,0.62)";
            ctx.lineWidth   = 3;
            ctx.stroke();
        }

        // ── Gravity drop brackets
        if ((this.inputs.showGravityDrop ?? true) && activeTime > 0.1) {
            const dropDist = 0.5 * pd.g * activeTime * activeTime;
            const label    = `½gt² = ${dropDist.toFixed(1)} m`;
            this.drawBracket(ctx, cProjX - 15, cLosY,      cProjY, label);
            this.drawBracket(ctx, cTargX - 25, cTargStartY, cTargY, label);
        }

        // ── Projectile ball
        if (projY >= -0.5 || isFinished) {
            const ballGrad = ctx.createRadialGradient(cProjX - 3, cProjY - 3, 2, cProjX, cProjY, 9);
            ballGrad.addColorStop(0,   "#f8fafc");
            ballGrad.addColorStop(0.3, "#94a3b8");
            ballGrad.addColorStop(1,   "#334155");
            ctx.beginPath();
            ctx.arc(cProjX, cProjY, 9, 0, Math.PI * 2);
            ctx.fillStyle   = ballGrad;
            ctx.fill();
            ctx.strokeStyle = "#1e293b";
            ctx.lineWidth   = 1;
            ctx.stroke();
        }

        // ── Monkey
        if (targetY >= -0.5 || isFinished) {
            this.drawMonkey(ctx, cTargX, Math.min(cTargY, this.groundY));
        }

        // ── Live velocity vectors during flight
        if ((this.inputs.showVelocityVectors ?? true) && activeTime > 0 && !isFinished) {
            const currentVy = pd.v0y - pd.g * activeTime;
            const vScale    = 1.8;
            this.drawArrow(ctx, cProjX, cProjY, cProjX + pd.v0x * vScale, cProjY,                "#10b981", 3);
            this.drawArrow(ctx, cProjX, cProjY, cProjX,                    cProjY - currentVy * vScale, "#ef4444", 3);
        }

        // ── Collision flash
        if (activeTime >= pd.tCollision && Math.abs(projY - targetY) < 1 && targetY > 0) {
            const boomGrad = ctx.createRadialGradient(cTargX, cTargY, 0, cTargX, cTargY, 38);
            boomGrad.addColorStop(0,    "#ffffff");
            boomGrad.addColorStop(0.22, "#fde047");
            boomGrad.addColorStop(0.62, "#ea580c");
            boomGrad.addColorStop(1,    "rgba(220,38,38,0)");
            ctx.beginPath();
            ctx.arc(cTargX, cTargY, 38, 0, Math.PI * 2);
            ctx.fillStyle = boomGrad;
            ctx.fill();
            ctx.fillStyle   = "#ffffff";
            ctx.font        = "900 20px Inter, Arial, sans-serif";
            ctx.strokeStyle = "#9a3412";
            ctx.lineWidth   = 4;
            ctx.textAlign   = "center";
            ctx.strokeText("BAM!", cTargX, cTargY + 7);
            ctx.fillText("BAM!",   cTargX, cTargY + 7);
        }

        // ── Step 4 box: horizontal time equation
        if ((this.inputs.showWalkthroughPanel ?? true) && stepIndex === 3) {
            this.fillRoundRect(ctx, 20, 155, 330, 150, 12,
                "rgba(255,255,255,0.9)", "rgba(239,68,68,0.35)");
            ctx.fillStyle = "#ef4444";
            ctx.textAlign = "left";
            ctx.font      = "bold 22px Inter, Arial, sans-serif";
            ctx.fillText("Solve horizontal time", 38, 185);
            ctx.font = "bold 18px JetBrains Mono, Consolas, monospace";
            ctx.fillText("Δx = vₓt",                              38, 220);
            ctx.fillText(`${pd.D} = ${pd.v0x.toFixed(1)}t`,       38, 250);
            ctx.fillText(`t = ${pd.tCollision.toFixed(2)} s`,      38, 280);
        }

        // ── Step 5 box: vertical position equation
        if ((this.inputs.showWalkthroughPanel ?? true) && stepIndex === 4) {
            this.fillRoundRect(ctx, 20, 155, 360, 155, 12,
                "rgba(255,255,255,0.9)", "rgba(37,99,235,0.35)");
            ctx.fillStyle = "#2563eb";
            ctx.textAlign = "left";
            ctx.font      = "bold 22px Inter, Arial, sans-serif";
            ctx.fillText("Solve vertical position", 38, 185);
            ctx.font = "bold 17px JetBrains Mono, Consolas, monospace";
            ctx.fillText("Δy = vᵧt + ½aᵧt²", 38, 218);
            ctx.fillText(`Δy = ${pd.v0y.toFixed(1)}(${pd.tCollision.toFixed(2)}) - ${pd.dropAtCollision.toFixed(2)}`, 38, 248);
            ctx.fillText(`Δy = ${pd.cannonYAtTree.toFixed(2)} m`,  38, 278);
        }

        // ── HUD overlays
        if (this.inputs.showTelemetry ?? true) {
            this.drawTelemetry(ctx, pd, projY, targetY, pd.D - projX, activeTime);
        }
        if (this.inputs.showTimerDisplay ?? true) {
            this.drawTimer(ctx, activeTime);
        }
        if (this.inputs.showWalkthroughPanel ?? true) {
            this.drawWalkthroughPanel(ctx, pd, stepIndex);
        }
    }
}
