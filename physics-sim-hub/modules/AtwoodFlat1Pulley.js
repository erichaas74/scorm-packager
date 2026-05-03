import SimulationGifMaker from '../core/SimulationGifMaker.js';

export default class AtwoodFlat1Pulley extends SimulationGifMaker {
    constructor(canvasId) {
        super(canvasId, { duration: 4, fps: 30 }); 
        
        this.scale = 35; // 1 meter = 35 pixels
        this.tableEdgeX = 450;
        this.tableY = 180;
        this.pulleyRadius = 15;
    }

    init() {
        this.setupInputs('controls', {
            "System Parameters": {
                mass1: { label: "Mass 1 (Table) (kg)", type: "number", value: 10, step: 1 },
                mass2: { label: "Mass 2 (Hanging) (kg)", type: "number", value: 5, step: 1 },
                friction: { label: "Coefficient of Friction (μ)", type: "number", value: 0.2, step: 0.05 },
                gravity: { label: "Gravity (m/s²)", type: "number", value: 9.8, step: 0.1 }
            },
            "Display Settings": {
                simulateTime: { label: "Simulate For (s)", type: "number", value: 2.5, step: 0.1 },
                showForces: { label: "Show Force Vectors (FBD)", type: "checkbox", value: true },
                showEquations: { label: "Show Equation Breakdown", type: "checkbox", value: true },
                showTelemetry: { label: "Show Live Telemetry", type: "checkbox", value: true }
            }
        });
        
        // Sync GIF duration to the requested simulation time
        this.config.duration = this.inputs.simulateTime;
        this.drawPreview();
    }

    // Helper for clean, proportional arrows
    drawArrow(ctx, fromX, fromY, toX, toY, color, width = 2, label = "") {
        const headlen = 8;
        const angle = Math.atan2(toY - fromY, toX - fromX);
        
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(toX, toY);
        ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.stroke();

        if (label) {
            ctx.fillStyle = color;
            ctx.font = "bold 12px Inter";
            // Offset label slightly from the arrow tip
            const lx = toX + 10 * Math.cos(angle);
            const ly = toY + 10 * Math.sin(angle);
            ctx.fillText(label, lx - 5, ly + 4);
        }
    }

    drawFrame(ctx, time) {
        // --- 1. PHYSICS ENGINE ---
        const m1 = this.inputs.mass1;
        const m2 = this.inputs.mass2;
        const mu = this.inputs.friction;
        const g = this.inputs.gravity;

        const maxForceDrag = m2 * g;
        const maxFriction = mu * m1 * g;
        
        let a = 0;
        let isMoving = false;

        // Check if pulling force overcomes friction
        if (maxForceDrag > maxFriction) {
            a = (maxForceDrag - maxFriction) / (m1 + m2);
            isMoving = true;
        }

        const T = isMoving ? m2 * (g - a) : maxForceDrag;

        const activeTime = Math.min(time, this.inputs.simulateTime);
        const distance = 0.5 * a * activeTime * activeTime;
        const velocity = a * activeTime;

        // --- 2. SCENE COORDINATES ---
        const startX1 = 100; // m1 starting X position
        const startY2 = this.tableY + this.pulleyRadius; // m2 starting Y position
        
        // Prevent m1 from crashing through the pulley
        const maxAllowedDistance = (this.tableEdgeX - startX1 - 40) / this.scale;
        const actualDistance = Math.min(distance, maxAllowedDistance);
        
        // Map to pixels
        const pxDist = actualDistance * this.scale;
        
        // Box 1 (On Table)
        const b1w = 50, b1h = 40;
        const b1x = startX1 + pxDist;
        const b1y = this.tableY - b1h;

        // Box 2 (Hanging)
        const b2w = 30, b2h = 40;
        const b2x = this.tableEdgeX + this.pulleyRadius - (b2w / 2);
        const b2y = startY2 + pxDist;

        // --- 3. DRAWING SCENERY ---
        
        // Background
        ctx.fillStyle = "#f8fafc";
        ctx.fillRect(0, 0, this.width, this.height);

        // Table
        ctx.fillStyle = "#334155"; // Slate 700
        ctx.fillRect(0, this.tableY, this.tableEdgeX, this.height - this.tableY);
        ctx.fillStyle = "#475569"; // Slate 600 (top edge highlight)
        ctx.fillRect(0, this.tableY, this.tableEdgeX, 6);

        // Table Legs/Base detail
        ctx.strokeStyle = "#1e293b";
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(this.tableEdgeX, this.tableY); ctx.lineTo(this.tableEdgeX, this.height); ctx.stroke();

        // Pulley Base & Wheel
        const pulleyCenterY = this.tableY - this.pulleyRadius;
        
        ctx.fillStyle = "#94a3b8"; // Pulley mount
        ctx.fillRect(this.tableEdgeX - 10, pulleyCenterY, 20, this.pulleyRadius + 6);
        
        ctx.beginPath();
        ctx.arc(this.tableEdgeX, pulleyCenterY, this.pulleyRadius, 0, Math.PI * 2);
        ctx.fillStyle = "#cbd5e1";
        ctx.fill();
        ctx.strokeStyle = "#475569";
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Pulley Axle
        ctx.beginPath(); ctx.arc(this.tableEdgeX, pulleyCenterY, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#1e293b"; ctx.fill();

        // Strings
        ctx.beginPath();
        ctx.moveTo(b1x + b1w, pulleyCenterY); // From m1 to top of pulley
        ctx.lineTo(this.tableEdgeX, pulleyCenterY);
        ctx.moveTo(this.tableEdgeX + this.pulleyRadius, pulleyCenterY); // From right of pulley to m2
        ctx.lineTo(this.tableEdgeX + this.pulleyRadius, b2y);
        ctx.strokeStyle = "#94a3b8";
        ctx.lineWidth = 2;
        ctx.stroke();

        // --- 4. DRAWING MASSES ---
        
        // Mass 1 (Table)
        ctx.fillStyle = "#3b82f6"; // Blue
        ctx.fillRect(b1x, b1y, b1w, b1h);
        ctx.strokeStyle = "#1d4ed8";
        ctx.lineWidth = 2;
        ctx.strokeRect(b1x, b1y, b1w, b1h);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 14px Inter";
        ctx.fillText("m₁", b1x + 15, b1y + 25);

        // Mass 2 (Hanging)
        ctx.fillStyle = "#ef4444"; // Red
        ctx.fillRect(b2x, b2y, b2w, b2h);
        ctx.strokeStyle = "#b91c1c";
        ctx.lineWidth = 2;
        ctx.strokeRect(b2x, b2y, b2w, b2h);
        ctx.fillStyle = "#ffffff";
        ctx.fillText("m₂", b2x + 6, b2y + 25);

        // --- 5. FORCE VECTORS (FREE BODY DIAGRAMS) ---
        if (this.inputs.showForces) {
            const fScale = 1.5; // Visual scaling for force arrows
            
            // Forces on m1
            const c1x = b1x + b1w / 2;
            const c1y = b1y + b1h / 2;
            // Normal Force (Up)
            this.drawArrow(ctx, c1x, b1y, c1x, b1y - 30, "#a855f7", 2, "Fₙ");
            // Gravity m1g (Down)
            this.drawArrow(ctx, c1x, b1y + b1h, c1x, b1y + b1h + 30, "#f59e0b", 2, "m₁g");
            // Tension (Right)
            this.drawArrow(ctx, b1x + b1w, c1y, b1x + b1w + T * fScale, c1y, "#10b981", 3, "T");
            // Friction (Left)
            if (mu > 0) {
                const fk = isMoving ? maxFriction : T; // Static matches T until broken
                if (fk > 0) {
                    this.drawArrow(ctx, b1x, c1y, b1x - fk * fScale, c1y, "#f43f5e", 3, isMoving ? "fₖ" : "fₛ");
                }
            }

            // Forces on m2
            const c2x = b2x + b2w / 2;
            // Tension (Up)
            this.drawArrow(ctx, c2x, b2y, c2x, b2y - T * fScale, "#10b981", 3, "T");
            // Gravity m2g (Down)
            this.drawArrow(ctx, c2x, b2y + b2h, c2x, b2y + b2h + (m2 * g) * fScale, "#f59e0b", 3, "m₂g");
        }

        // --- 6. OVERLAYS & HUD ---
        
        if (this.inputs.showEquations) {
            const boxX = this.width - 240;
            const boxY = 20;
            
            ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
            if (ctx.roundRect) ctx.roundRect(boxX, boxY, 220, 160, 8);
            else ctx.fillRect(boxX, boxY, 220, 160);
            ctx.fill();
            ctx.strokeStyle = "#cbd5e1";
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.fillStyle = "#0f172a";
            ctx.font = "bold 13px Inter";
            ctx.fillText("System Equations", boxX + 15, boxY + 25);
            ctx.beginPath(); ctx.moveTo(boxX+15, boxY+32); ctx.lineTo(boxX+205, boxY+32); ctx.stroke();

            ctx.font = "12px Inter";
            if (!isMoving) {
                ctx.fillStyle = "#e11d48";
                ctx.fillText("Status: Static (Friction holds)", boxX + 15, boxY + 55);
                ctx.fillStyle = "#475569";
                ctx.fillText(`Max fₛ = μ·m₁g = ${maxFriction.toFixed(1)} N`, boxX + 15, boxY + 75);
                ctx.fillText(`Pull m₂g = ${maxForceDrag.toFixed(1)} N`, boxX + 15, boxY + 95);
            } else {
                ctx.fillStyle = "#059669";
                ctx.fillText(`a = g(m₂ - μm₁) / (m₁ + m₂)`, boxX + 15, boxY + 55);
                ctx.font = "bold 13px Inter";
                ctx.fillText(`a = ${a.toFixed(2)} m/s²`, boxX + 15, boxY + 75);
                
                ctx.font = "12px Inter";
                ctx.fillStyle = "#2563eb";
                ctx.fillText(`T = m₂(g - a)`, boxX + 15, boxY + 110);
                ctx.font = "bold 13px Inter";
                ctx.fillText(`T = ${T.toFixed(2)} N`, boxX + 15, boxY + 130);
            }
        }

        if (this.inputs.showTelemetry) {
            ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
            if (ctx.roundRect) ctx.roundRect(20, 20, 180, 85, 8);
            else ctx.fillRect(20, 20, 180, 85);
            ctx.fill();

            ctx.fillStyle = "#f8fafc";
            ctx.font = "bold 13px Inter";
            ctx.fillText(`Time: ${activeTime.toFixed(2)} s`, 35, 45);
            
            ctx.fillStyle = "#38bdf8";
            ctx.fillText(`Dist: ${actualDistance.toFixed(2)} m`, 35, 65);
            
            ctx.fillStyle = "#c084fc";
            ctx.fillText(`Vel:  ${(isMoving ? velocity : 0).toFixed(2)} m/s`, 35, 85);
        }
    }
}