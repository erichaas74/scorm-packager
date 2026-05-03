import SimulationGifMaker from '../core/SimulationGifMaker.js';

export default class AtwoodRamp extends SimulationGifMaker {
    constructor(canvasId) {
        super(canvasId, { duration: 4, fps: 30 }); 
        
        this.scale = 35; // 1 meter = 35 pixels
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
                friction: { label: "Coefficient of Friction (μ)", type: "number", value: 0.15, step: 0.05 },
                gravity: { label: "Gravity (m/s²)", type: "number", value: 9.8, step: 0.1 }
            },
            "Display Settings": {
                simulateTime: { label: "Simulate For (s)", type: "number", value: 2.5, step: 0.1 },
                showForces: { label: "Show Force Vectors (FBD)", type: "checkbox", value: true },
                showEquations: { label: "Show Equation Breakdown", type: "checkbox", value: true },
                showTelemetry: { label: "Show Live Telemetry", type: "checkbox", value: true }
            }
        });
        
        this.config.duration = this.inputs.simulateTime;
        this.drawPreview();
    }

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
            const lx = toX + 12 * Math.cos(angle);
            const ly = toY + 12 * Math.sin(angle);
            ctx.fillText(label, lx - 6, ly + 4);
        }
    }

    drawFrame(ctx, time) {
        // --- 1. PHYSICS ENGINE ---
        const angleRad = this.inputs.angle * (Math.PI / 180);
        const m1 = this.inputs.mass1;
        const m2 = this.inputs.mass2;
        const mu = this.inputs.friction;
        const g = this.inputs.gravity;

        // Force driving the system towards m2
        const FPull = m2 * g;
        const FParallel = m1 * g * Math.sin(angleRad);
        const FNormal = m1 * g * Math.cos(angleRad);
        
        const FDrive = FPull - FParallel; // Positive means tends to move m1 UP the ramp
        const maxFriction = mu * FNormal;
        
        let a = 0;
        let T = 0;
        let fActual = 0; 
        let status = "Static";

        // Determine motion and dynamic friction direction
        if (FDrive > maxFriction) {
            // Accelerates m1 UP the ramp (m2 falls)
            a = (FDrive - maxFriction) / (m1 + m2);
            T = m2 * (g - a);
            fActual = maxFriction; // Acts DOWN the ramp
            status = "Accelerating (m₁ UP)";
        } else if (FDrive < -maxFriction) {
            // Accelerates m1 DOWN the ramp (m2 rises)
            a = (FDrive + maxFriction) / (m1 + m2); // 'a' is negative
            T = m2 * (g - a); 
            fActual = -maxFriction; // Acts UP the ramp
            status = "Accelerating (m₁ DOWN)";
        } else {
            // Friction perfectly balances the net drive
            a = 0;
            T = FPull;
            fActual = FDrive; 
            status = "Static (Friction holds)";
        }

        const activeTime = Math.min(time, this.inputs.simulateTime);
        const rawDisp = 0.5 * a * activeTime * activeTime * this.scale;
        const velocity = a * activeTime;

        // --- 2. VECTOR GEOMETRY FOR RAMP ---
        // Unit vector down the ramp
        const ux = -Math.cos(angleRad);
        const uy = Math.sin(angleRad);
        
        // Unit normal vector pointing UP and AWAY from the ramp surface
        const nx = -Math.sin(angleRad);
        const ny = -Math.cos(angleRad);

        // Tangent point on the pulley for the ramp string
        const tx = this.pulleyX + this.pulleyRadius * nx;
        const ty = this.pulleyY + this.pulleyRadius * ny;

        // Block dimensions
        const b1w = 50, b1h = 40;
        const b2w = 30, b2h = 40;

        // Clamp positions to avoid flying off the screen
        const initial_d1 = 220;
        const initial_d2 = 80;
        
        let disp = rawDisp;
        if (disp > initial_d1 - 35) disp = initial_d1 - 35; // Hits pulley
        if (disp < -200) disp = -200; // Falls off bottom left

        const d1 = initial_d1 - disp; // Distance from pulley down the ramp
        const d2 = initial_d2 + disp; // Distance from pulley hanging straight down

        // Center coordinates of Mass 1 (on the string line)
        const c1x = tx + d1 * ux;
        const c1y = ty + d1 * uy;

        // Center coordinates of Mass 2
        const c2x = this.pulleyX + this.pulleyRadius;
        const c2y = this.pulleyY + d2;

        // --- 3. DRAWING SCENERY ---
        ctx.fillStyle = "#f8fafc";
        ctx.fillRect(0, 0, this.width, this.height);

        // Calculate Ramp Surface
        const rampSurfaceDist = this.pulleyRadius - (b1h / 2);
        const rsX = this.pulleyX + rampSurfaceDist * nx;
        const rsY = this.pulleyY + rampSurfaceDist * ny;

        // Draw Wedge
        ctx.beginPath();
        ctx.moveTo(rsX, rsY);
        ctx.lineTo(rsX + 800 * ux, rsY + 800 * uy); // Extend far down-left
        ctx.lineTo(rsX + 800 * ux, this.height); // Down to ground
        ctx.lineTo(this.pulleyX, this.height); // Across to pillar
        ctx.lineTo(this.pulleyX, this.pulleyY); // Up to pulley
        ctx.closePath();
        ctx.fillStyle = "#334155";
        ctx.fill();

        // Draw Pillar
        ctx.fillStyle = "#475569";
        ctx.fillRect(this.pulleyX - 15, this.pulleyY, 30, this.height - this.pulleyY);

        // Strings
        ctx.beginPath();
        ctx.moveTo(tx, ty); // Ramp string tangent
        ctx.lineTo(c1x, c1y);
        ctx.moveTo(c2x, this.pulleyY); // Hanging string tangent
        ctx.lineTo(c2x, c2y);
        ctx.strokeStyle = "#94a3b8";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw Pulley Arc (Wrapping the string)
        ctx.beginPath();
        const startAngle = Math.atan2(ny, nx);
        ctx.arc(this.pulleyX, this.pulleyY, this.pulleyRadius, startAngle, 0, false);
        ctx.stroke();

        // Draw Pulley Wheel
        ctx.beginPath();
        ctx.arc(this.pulleyX, this.pulleyY, this.pulleyRadius, 0, Math.PI * 2);
        ctx.fillStyle = "#cbd5e1";
        ctx.fill();
        ctx.strokeStyle = "#475569";
        ctx.lineWidth = 3;
        ctx.stroke();
        
        ctx.beginPath(); 
        ctx.arc(this.pulleyX, this.pulleyY, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#1e293b"; 
        ctx.fill();

        // --- 4. DRAWING MASSES ---
        
        // Mass 1 (Rotated on Ramp)
        ctx.save();
        ctx.translate(c1x, c1y);
        ctx.rotate(Math.atan2(uy, ux)); // Align with ramp vector
        ctx.fillStyle = "#3b82f6";
        ctx.fillRect(-b1w / 2, -b1h / 2, b1w, b1h);
        ctx.strokeStyle = "#1d4ed8";
        ctx.lineWidth = 2;
        ctx.strokeRect(-b1w / 2, -b1h / 2, b1w, b1h);
        ctx.restore();
        
        // Draw Mass 1 label upright
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 14px Inter";
        ctx.fillText("m₁", c1x - 8, c1y + 5);

        // Mass 2 (Hanging)
        ctx.fillStyle = "#ef4444";
        ctx.fillRect(c2x - b2w / 2, c2y - b2h / 2, b2w, b2h);
        ctx.strokeStyle = "#b91c1c";
        ctx.lineWidth = 2;
        ctx.strokeRect(c2x - b2w / 2, c2y - b2h / 2, b2w, b2h);
        ctx.fillStyle = "#ffffff";
        ctx.fillText("m₂", c2x - 8, c2y + 5);

        // --- 5. FORCE VECTORS (FREE BODY DIAGRAMS) ---
        if (this.inputs.showForces) {
            const fScale = 1.2; 
            
            // m1 Forces
            // Gravity (Straight down)
            this.drawArrow(ctx, c1x, c1y, c1x, c1y + m1 * g * fScale, "#f59e0b", 2, "m₁g");
            // Normal Force (Up and away from ramp)
            this.drawArrow(ctx, c1x, c1y, c1x + nx * FNormal * fScale, c1y + ny * FNormal * fScale, "#a855f7", 2, "Fₙ");
            // Tension (Up the ramp)
            this.drawArrow(ctx, c1x, c1y, c1x - ux * T * fScale, c1y - uy * T * fScale, "#10b981", 3, "T");
            
            // Friction
            if (mu > 0 && Math.abs(fActual) > 0.1) {
                // fActual > 0 acts DOWN the ramp (along ux, uy)
                // fActual < 0 acts UP the ramp (along -ux, -uy)
                const dirX = fActual > 0 ? ux : -ux;
                const dirY = fActual > 0 ? uy : -uy;
                const fMag = Math.abs(fActual);
                this.drawArrow(ctx, c1x, c1y, c1x + dirX * fMag * fScale, c1y + dirY * fMag * fScale, "#f43f5e", 3, status.includes("Static") ? "fₛ" : "fₖ");
            }

            // m2 Forces
            // Tension (Up)
            this.drawArrow(ctx, c2x, c2y, c2x, c2y - T * fScale, "#10b981", 3, "T");
            // Gravity (Down)
            this.drawArrow(ctx, c2x, c2y, c2x, c2y + m2 * g * fScale, "#f59e0b", 3, "m₂g");
        }

        // --- 6. OVERLAYS & HUD ---
        if (this.inputs.showEquations) {
            const boxX = this.width - 250;
            const boxY = 20;
            
            ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
            if (ctx.roundRect) ctx.roundRect(boxX, boxY, 230, 165, 8);
            else ctx.fillRect(boxX, boxY, 230, 165);
            ctx.fill();
            ctx.strokeStyle = "#cbd5e1";
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.fillStyle = "#0f172a";
            ctx.font = "bold 13px Inter";
            ctx.fillText("System Equations", boxX + 15, boxY + 25);
            ctx.beginPath(); ctx.moveTo(boxX+15, boxY+32); ctx.lineTo(boxX+215, boxY+32); ctx.stroke();

            ctx.font = "12px Inter";
            if (status.includes("Static")) {
                ctx.fillStyle = "#e11d48";
                ctx.fillText("Status: " + status, boxX + 15, boxY + 55);
                ctx.fillStyle = "#475569";
                ctx.fillText(`Net Pull = m₂g - m₁g·sin(θ)`, boxX + 15, boxY + 75);
                ctx.fillText(`Net Pull = ${FDrive.toFixed(1)} N`, boxX + 15, boxY + 95);
                ctx.fillText(`Max fₛ = μ·m₁g·cos(θ) = ${maxFriction.toFixed(1)} N`, boxX + 15, boxY + 115);
            } else {
                ctx.fillStyle = "#059669";
                ctx.fillText("Status: " + status, boxX + 15, boxY + 50);
                
                ctx.fillStyle = "#475569";
                ctx.fillText(`F_net = m₂g - m₁g·sin(θ) ± fₖ`, boxX + 15, boxY + 70);
                
                ctx.fillStyle = "#059669";
                ctx.font = "bold 13px Inter";
                ctx.fillText(`a = ${a.toFixed(2)} m/s²`, boxX + 15, boxY + 95);
                
                ctx.font = "12px Inter";
                ctx.fillStyle = "#2563eb";
                ctx.fillText(`T = m₂(g - a)`, boxX + 15, boxY + 120);
                ctx.font = "bold 13px Inter";
                ctx.fillText(`T = ${T.toFixed(2)} N`, boxX + 15, boxY + 140);
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
            // Display displacement (positive means m2 is falling)
            const displayDisp = disp === rawDisp ? (rawDisp / this.scale) : ((disp - initial_d1 + 220) / this.scale);
            ctx.fillText(`Disp: ${displayDisp.toFixed(2)} m`, 35, 65);
            
            ctx.fillStyle = "#c084fc";
            ctx.fillText(`Vel:  ${status.includes("Static") ? 0.00 : velocity.toFixed(2)} m/s`, 35, 85);
        }
    }
}