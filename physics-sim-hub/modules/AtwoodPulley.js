import SimulationGifMaker from '../core/SimulationGifMaker.js';

export default class AtwoodPulley extends SimulationGifMaker {
    constructor(canvasId) {
        super(canvasId, { duration: 4, fps: 30 }); 
        
        this.scale = 35; // 1 meter = 35 pixels
        this.pulleyX = 325; // Center of a 650px canvas
        this.pulleyY = 100;
        this.pulleyRadius = 25;
        this.initialY = 260; // Starting Y position for both masses
    }

    init() {
        this.setupInputs('controls', {
            "System Parameters": {
                mass1: { label: "Mass 1 (Left) (kg)", type: "number", value: 5, step: 1 },
                mass2: { label: "Mass 2 (Right) (kg)", type: "number", value: 10, step: 1 },
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
        const m1 = this.inputs.mass1;
        const m2 = this.inputs.mass2;
        const g = this.inputs.gravity;

        // Calculate acceleration (Positive means m2 falls and m1 rises)
        let a = 0;
        let status = "Static (Balanced)";
        
        if (m1 !== m2) {
            a = ((m2 - m1) / (m1 + m2)) * g;
            status = a > 0 ? "Accelerating (m₂ DOWN)" : "Accelerating (m₁ DOWN)";
        }

        // Calculate Tension
        // T - m1*g = m1*a  =>  T = m1*(g + a)
        const T = m1 * (g + a);

        const activeTime = Math.min(time, this.inputs.simulateTime);
        const rawDisp = 0.5 * a * activeTime * activeTime * this.scale;
        const velocity = a * activeTime;

        // --- 2. SCENE COORDINATES ---
        const b1w = 40, b1h = 40;
        const b2w = 40, b2h = 40;

        // Clamp displacement so masses don't crash into the pulley or floor
        const maxDisp = 130; 
        let actualDisp = Math.max(-maxDisp, Math.min(maxDisp, rawDisp));

        // If a > 0, actualDisp is positive -> m1 goes UP, m2 goes DOWN
        const b1y = this.initialY - actualDisp;
        const b2y = this.initialY + actualDisp;

        const b1x = this.pulleyX - this.pulleyRadius - (b1w / 2);
        const b2x = this.pulleyX + this.pulleyRadius - (b2w / 2);

        // --- 3. DRAWING SCENERY ---
        ctx.fillStyle = "#f8fafc";
        ctx.fillRect(0, 0, this.width, this.height);

        // Ceiling Mount
        ctx.fillStyle = "#334155";
        ctx.fillRect(0, 0, this.width, 20);
        ctx.fillStyle = "#64748b";
        ctx.fillRect(this.pulleyX - 8, 20, 16, this.pulleyY - 20);

        // Strings
        ctx.beginPath();
        // Left string
        ctx.moveTo(this.pulleyX - this.pulleyRadius, this.pulleyY);
        ctx.lineTo(b1x + b1w / 2, b1y);
        // Right string
        ctx.moveTo(this.pulleyX + this.pulleyRadius, this.pulleyY);
        ctx.lineTo(b2x + b2w / 2, b2y);
        ctx.strokeStyle = "#94a3b8";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw Pulley Arc (Wrapping the string over the top)
        ctx.beginPath();
        ctx.arc(this.pulleyX, this.pulleyY, this.pulleyRadius, Math.PI, 0, false);
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
        
        // Mass 1 (Left)
        ctx.fillStyle = "#3b82f6";
        ctx.fillRect(b1x, b1y, b1w, b1h);
        ctx.strokeStyle = "#1d4ed8";
        ctx.lineWidth = 2;
        ctx.strokeRect(b1x, b1y, b1w, b1h);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 14px Inter";
        ctx.fillText("m₁", b1x + 10, b1y + 25);

        // Mass 2 (Right)
        ctx.fillStyle = "#ef4444";
        ctx.fillRect(b2x, b2y, b2w, b2h);
        ctx.strokeStyle = "#b91c1c";
        ctx.lineWidth = 2;
        ctx.strokeRect(b2x, b2y, b2w, b2h);
        ctx.fillStyle = "#ffffff";
        ctx.fillText("m₂", b2x + 10, b2y + 25);

        // --- 5. FORCE VECTORS (FREE BODY DIAGRAMS) ---
        if (this.inputs.showForces) {
            const fScale = 1.2; 
            
            // m1 Forces
            const c1x = b1x + b1w / 2;
            const c1y = b1y + b1h / 2;
            // Tension (Up)
            this.drawArrow(ctx, c1x, b1y, c1x, b1y - T * fScale, "#10b981", 3, "T");
            // Gravity (Down)
            this.drawArrow(ctx, c1x, b1y + b1h, c1x, b1y + b1h + (m1 * g) * fScale, "#f59e0b", 2, "m₁g");

            // m2 Forces
            const c2x = b2x + b2w / 2;
            const c2y = b2y + b2h / 2;
            // Tension (Up)
            this.drawArrow(ctx, c2x, b2y, c2x, b2y - T * fScale, "#10b981", 3, "T");
            // Gravity (Down)
            this.drawArrow(ctx, c2x, b2y + b2h, c2x, b2y + b2h + (m2 * g) * fScale, "#f59e0b", 3, "m₂g");
        }

        // --- 6. OVERLAYS & HUD ---
        if (this.inputs.showEquations) {
            const boxX = this.width - 240;
            const boxY = 30;
            
            ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
            if (ctx.roundRect) ctx.roundRect(boxX, boxY, 220, 150, 8);
            else ctx.fillRect(boxX, boxY, 220, 150);
            ctx.fill();
            ctx.strokeStyle = "#cbd5e1";
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.fillStyle = "#0f172a";
            ctx.font = "bold 13px Inter";
            ctx.fillText("System Equations", boxX + 15, boxY + 25);
            ctx.beginPath(); ctx.moveTo(boxX+15, boxY+32); ctx.lineTo(boxX+205, boxY+32); ctx.stroke();

            ctx.font = "12px Inter";
            if (m1 === m2) {
                ctx.fillStyle = "#059669";
                ctx.fillText("Status: " + status, boxX + 15, boxY + 55);
                ctx.fillStyle = "#475569";
                ctx.fillText(`a = 0 m/s²`, boxX + 15, boxY + 75);
                ctx.fillText(`T = m₁g = ${(m1*g).toFixed(1)} N`, boxX + 15, boxY + 95);
            } else {
                ctx.fillStyle = "#059669";
                ctx.fillText("Status: " + status, boxX + 15, boxY + 50);
                
                ctx.fillStyle = "#475569";
                ctx.fillText(`a = g(m₂ - m₁) / (m₁ + m₂)`, boxX + 15, boxY + 70);
                
                ctx.fillStyle = "#059669";
                ctx.font = "bold 13px Inter";
                ctx.fillText(`a = ${Math.abs(a).toFixed(2)} m/s²`, boxX + 15, boxY + 95);
                
                ctx.font = "12px Inter";
                ctx.fillStyle = "#2563eb";
                ctx.fillText(`T = 2(m₁m₂)g / (m₁ + m₂)`, boxX + 15, boxY + 120);
                ctx.font = "bold 13px Inter";
                ctx.fillText(`T = ${T.toFixed(2)} N`, boxX + 15, boxY + 140);
            }
        }

        if (this.inputs.showTelemetry) {
            ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
            if (ctx.roundRect) ctx.roundRect(20, 30, 180, 85, 8);
            else ctx.fillRect(20, 30, 180, 85);
            ctx.fill();

            ctx.fillStyle = "#f8fafc";
            ctx.font = "bold 13px Inter";
            ctx.fillText(`Time: ${activeTime.toFixed(2)} s`, 35, 55);
            
            ctx.fillStyle = "#38bdf8";
            ctx.fillText(`Disp: ${Math.abs(actualDisp / this.scale).toFixed(2)} m`, 35, 75);
            
            ctx.fillStyle = "#c084fc";
            ctx.fillText(`Vel:  ${Math.abs(velocity).toFixed(2)} m/s`, 35, 95);
        }
    }
}