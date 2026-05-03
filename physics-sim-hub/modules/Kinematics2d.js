import SimulationGifMaker from '../core/SimulationGifMaker.js';

export default class Module2DKinematics extends SimulationGifMaker {
    constructor(canvasId) {
        // Default export length: 4 seconds @ 30fps
        super(canvasId, { duration: 4, fps: 30 }); 
        
        this.scale = 7; // 1 meter = 7 pixels
        this.originX = 40;
        this.groundY = this.height - 30;
    }

    init() {
        // Define all the specific inputs and UI toggles for 2D Motion
        this.setupInputs('controls', {
            "Physics Parameters": {
                mass: { label: "Mass (kg)", type: "number", value: 1.0, step: 0.1 },
                initialVelocity: { label: "Initial Velocity (m/s)", type: "number", value: 25, step: 1 },
                launchAngle: { label: "Launch Angle (deg)", type: "number", value: 60, step: 1 },
                initialHeight: { label: "Initial Height (m)", type: "number", value: 5, step: 1 },
                gravity: { label: "Gravity (m/s²)", type: "number", value: 9.8, step: 0.1 }
            },
            "Display Settings": {
                stopAnimation: { 
                    label: "Stop Animation At", 
                    type: "select", 
                    options: ["End of Flight", "Max Height", "Custom Time"], 
                    value: "Custom Time" 
                },
                customStopTime: { 
                    label: "Custom Stop Time (s)", 
                    type: "number", 
                    value: 3.1, 
                    step: 0.1 
                },
                timingMode: { 
                    label: "Overlay Timing", 
                    type: "select", 
                    options: ["Always", "At End", "At Max Height", "At Custom Time"], 
                    value: "At End" 
                },
                trailStyle: { 
                    label: "Trail Style", 
                    type: "select", 
                    options: ["Dotted", "Solid", "None"], 
                    value: "Dotted" 
                },
                showTimerDisplay: { label: "Show Canvas Timer", type: "checkbox", value: true },
                showDistanceMarkers: { label: "Show X/Y Distance Lines", type: "checkbox", value: true },
                showMomentumVector: { label: "Show Momentum (p) Vector", type: "checkbox", value: false },
                showForceVector: { label: "Show Force (F) Vector", type: "checkbox", value: false },
                showVelocityVectors: { label: "Show Velocity Vectors", type: "checkbox", value: true },
                showAccelerationVector: { label: "Show Acceleration Vector", type: "checkbox", value: true },
                showMaxHeight: { label: "Show Max Height Line", type: "checkbox", value: true },
                showTelemetry: { label: "Show Time/Position HUD", type: "checkbox", value: true },
                showComponents: { label: "Show Live Velocity (Vx, Vy)", type: "checkbox", value: false },
                showEquations: { label: "Show Equation Screen", type: "checkbox", value: true }
            }
        });
        
        // Draw the initial preview once the UI is bound
        this.drawPreview();
    }

    getVectorConfig() {
        return {
            magnitude: this.inputs.initialVelocity ?? 25,
            angleDeg: this.inputs.launchAngle ?? 60,
            title: 'Initial Velocity Vector',
        };
    }

    // Helper to draw clean vector arrows
    drawArrow(ctx, fromX, fromY, toX, toY, color, width = 2) {
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
    }

    // Helper to find exactly when the projectile hits the ground
    calculateTimeOfFlight(viy, yi, g) {
        const a = -0.5 * g;
        const b = viy;
        const c = yi;
        const discriminant = Math.pow(b, 2) - (4 * a * c);
        if (discriminant < 0) return 0; 
        
        const t1 = (-b + Math.sqrt(discriminant)) / (2 * a);
        const t2 = (-b - Math.sqrt(discriminant)) / (2 * a);
        return Math.max(t1, t2); 
    }

    // The core rendering loop
    drawFrame(ctx, time) {
        const vi = this.inputs.initialVelocity;
        const angleDeg = this.inputs.launchAngle;
        const yi = this.inputs.initialHeight;
        const g = this.inputs.gravity;
        const m = this.inputs.mass || 1.0; 

        const angleRad = angleDeg * (Math.PI / 180);
        const vix = vi * Math.cos(angleRad);
        const viy = vi * Math.sin(angleRad);

        // 1. Core Physics Timings
        const tFlight = this.calculateTimeOfFlight(viy, yi, g);
        const tPeak = Math.max(0, viy / g);
        
        let stopTime = tFlight;
        if (this.inputs.stopAnimation === 'Max Height') {
            stopTime = tPeak;
        } else if (this.inputs.stopAnimation === 'Custom Time') {
            stopTime = this.inputs.customStopTime;
        }

        const isFinished = time >= stopTime;
        const isAtPeak = time >= tPeak;
        const isAtCustom = time >= this.inputs.customStopTime;
        
        // Freeze physics time if flight is finished (holds final frame)
        const activeTime = Math.min(time, stopTime, tFlight);

        // Calculate positions
        const currentX = vix * activeTime;
        const currentY = yi + (viy * activeTime) - (0.5 * g * Math.pow(activeTime, 2));
        const canvasX = this.originX + (currentX * this.scale);
        const canvasY = this.groundY - (currentY * this.scale);

        // --- DRAWING BACKGROUND ---
        ctx.beginPath();
        ctx.moveTo(0, this.groundY);
        ctx.lineTo(this.width, this.groundY);
        ctx.strokeStyle = "#334155"; // slate-700
        ctx.lineWidth = 4;
        ctx.stroke();

        if (yi > 0) {
            ctx.fillStyle = "#94a3b8"; // slate-400
            ctx.fillRect(this.originX - 20, this.groundY - (yi * this.scale), 40, yi * this.scale);
        }

        // --- DRAWING TRAIL ---
        if (this.inputs.trailStyle !== 'None') {
            ctx.beginPath();
            ctx.moveTo(this.originX, this.groundY - (yi * this.scale));
            for(let t = 0; t <= activeTime; t += 0.05) {
                const tx = vix * t;
                const ty = yi + (viy * t) - (0.5 * g * Math.pow(t, 2));
                if(ty < 0) break;
                ctx.lineTo(this.originX + (tx * this.scale), this.groundY - (ty * this.scale));
            }
            ctx.strokeStyle = "rgba(37, 99, 235, 0.4)"; 
            ctx.lineWidth = 2;
            if (this.inputs.trailStyle === 'Dotted') ctx.setLineDash([5, 5]);
            ctx.stroke();
            ctx.setLineDash([]); 
        }

        // --- OVERLAY TIMING LOGIC ---
        const isOverlayTime = this.inputs.timingMode === 'Always' || 
                             (this.inputs.timingMode === 'At End' && isFinished) ||
                             (this.inputs.timingMode === 'At Max Height' && isAtPeak) ||
                             (this.inputs.timingMode === 'At Custom Time' && isAtCustom);

        // --- DRAWING DISTANCE MARKERS ---
        if (this.inputs.showDistanceMarkers && isOverlayTime && activeTime > 0) {
            ctx.beginPath();
            ctx.moveTo(canvasX, canvasY);
            ctx.lineTo(canvasX, this.groundY);
            ctx.moveTo(canvasX, canvasY);
            ctx.lineTo(this.originX, canvasY);
            ctx.strokeStyle = "rgba(148, 163, 184, 0.6)"; // slate-400
            ctx.setLineDash([4, 4]);
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.setLineDash([]);
            
            ctx.fillStyle = "#64748b"; // slate-500
            ctx.font = "12px Inter, sans-serif";
            if (canvasY < this.groundY - 15) ctx.fillText(`x = ${currentX.toFixed(1)}m`, canvasX + 5, this.groundY - 5);
            if (canvasX > this.originX + 15) ctx.fillText(`y = ${Math.max(0, currentY).toFixed(1)}m`, this.originX + 5, canvasY - 5);
        }

        // --- DRAWING MAX HEIGHT MARKER ---
        if (this.inputs.showMaxHeight && isOverlayTime) {
            const xPeak = vix * tPeak;
            const yPeak = yi + (viy * tPeak) - (0.5 * g * Math.pow(tPeak, 2));
            const cxPeak = this.originX + (xPeak * this.scale);
            const cyPeak = this.groundY - (yPeak * this.scale);

            ctx.beginPath();
            ctx.moveTo(this.originX, cyPeak);
            ctx.lineTo(cxPeak, cyPeak);
            ctx.lineTo(cxPeak, this.groundY);
            ctx.strokeStyle = "rgba(16, 185, 129, 0.6)"; // emerald-500
            ctx.setLineDash([4, 4]);
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.setLineDash([]);
            
            ctx.fillStyle = "#059669"; // emerald-600
            ctx.font = "600 13px Inter, sans-serif";
            ctx.fillText(`Max H: ${yPeak.toFixed(2)}m`, cxPeak + 8, cyPeak - 8);
        }

        // --- DRAWING PROJECTILE ---
        ctx.beginPath();
        ctx.arc(canvasX, canvasY, 12, 0, Math.PI * 2);
        ctx.fillStyle = "#3b82f6"; // blue-500
        ctx.fill();
        ctx.strokeStyle = "#1d4ed8"; // blue-700
        ctx.lineWidth = 2;
        ctx.stroke();

        // --- VECTOR ARROWS ---
        const currentVy = viy - (g * activeTime);

        // Momentum & Force first (thicker, semi-transparent)
        if (this.inputs.showMomentumVector && !isFinished) {
            const pScale = 1.5; 
            const px = m * vix;
            const py = m * currentVy;
            this.drawArrow(ctx, canvasX, canvasY, canvasX + px * pScale, canvasY - py * pScale, "rgba(6, 182, 212, 0.5)", 6);
        }

        if (this.inputs.showForceVector && !isFinished) {
            const fScale = 2.5; 
            const fg = m * g;
            this.drawArrow(ctx, canvasX, canvasY, canvasX, canvasY + fg * fScale, "rgba(147, 51, 234, 0.5)", 6);
        }

        // Velocity & Acceleration
        if (this.inputs.showVelocityVectors && !isFinished) {
            const vScale = 2.5; 
            this.drawArrow(ctx, canvasX, canvasY, canvasX + vix * vScale, canvasY, "#ef4444"); // Vx
            this.drawArrow(ctx, canvasX, canvasY, canvasX, canvasY - currentVy * vScale, "#10b981"); // Vy
            this.drawArrow(ctx, canvasX, canvasY, canvasX + vix * vScale, canvasY - currentVy * vScale, "#3b82f6"); // V Resultant
        }

        if (this.inputs.showAccelerationVector && !isFinished) {
            const aScale = 3.5; 
            this.drawArrow(ctx, canvasX, canvasY, canvasX, canvasY + g * aScale, "#f59e0b");
        }

        // --- CONDITIONAL OVERLAYS (STEP-BY-STEP CONTROLS) ---
        if (this.inputs.showTelemetry && isOverlayTime) {
            ctx.fillStyle = "#0f172a"; 
            ctx.font = "600 14px Inter, sans-serif";
            ctx.fillText(`Time: ${activeTime.toFixed(2)} s`, 20, 30);
            ctx.fillText(`X Pos: ${currentX.toFixed(2)} m`, 20, 55);
            ctx.fillText(`Y Pos: ${Math.max(0, currentY).toFixed(2)} m`, 20, 80);
        }

        if (this.inputs.showComponents && isOverlayTime && !isFinished) { 
            ctx.fillStyle = "#b91c1c"; 
            ctx.font = "600 14px Inter, sans-serif";
            ctx.fillText(`Vx: ${vix.toFixed(1)}`, canvasX + 15, canvasY - 15);
            ctx.fillText(`Vy: ${currentVy.toFixed(1)}`, canvasX + 15, canvasY + 5);
        }

        if (this.inputs.showEquations && isOverlayTime) {
            const boxX = this.width - 240;
            const boxY = 20;
            
            ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
            ctx.fillRect(boxX, boxY, 220, 190);
            ctx.strokeStyle = "#cbd5e1";
            ctx.lineWidth = 1;
            ctx.strokeRect(boxX, boxY, 220, 190);

            ctx.fillStyle = "#0f172a";
            ctx.font = "bold 14px Inter, sans-serif";
            ctx.fillText("Kinematic Analysis", boxX + 15, boxY + 25);
            
            ctx.beginPath();
            ctx.moveTo(boxX + 15, boxY + 35);
            ctx.lineTo(boxX + 205, boxY + 35);
            ctx.stroke();

            ctx.font = "13px Inter, sans-serif";
            ctx.fillText(`V₀ₓ = ${vi.toFixed(1)} · cos(${angleDeg}°) = ${vix.toFixed(1)}`, boxX + 15, boxY + 60);
            ctx.fillText(`V₀y = ${vi.toFixed(1)} · sin(${angleDeg}°) = ${viy.toFixed(1)}`, boxX + 15, boxY + 80);
            
            const yPeakEq = yi + (viy * tPeak) - (0.5 * g * Math.pow(tPeak, 2));
            ctx.fillStyle = "#059669";
            ctx.fillText(`Max y = ${yPeakEq.toFixed(2)} m (@ ${tPeak.toFixed(2)}s)`, boxX + 15, boxY + 110);

            ctx.fillStyle = "#3b82f6";
            ctx.fillText(`Δx (range) = ${vix.toFixed(1)} · ${tFlight.toFixed(2)}s`, boxX + 15, boxY + 140);
            ctx.font = "bold 14px Inter, sans-serif";
            ctx.fillText(`= ${(vix * tFlight).toFixed(2)} m`, boxX + 15, boxY + 160);
        }

        // --- VISIBLE CANVAS TIMER ---
        if (this.inputs.showTimerDisplay) {
            const timerText = `⏱️ ${activeTime.toFixed(2)} s`;
            ctx.font = "bold 16px Inter, sans-serif";
            const textWidth = ctx.measureText(timerText).width;
            
            const boxWidth = textWidth + 30;
            const tx = (this.width / 2) - (boxWidth / 2);
            
            ctx.fillStyle = "rgba(15, 23, 42, 0.85)"; 
            
            ctx.beginPath();
            if (ctx.roundRect) {
                ctx.roundRect(tx, 15, boxWidth, 34, 17);
            } else {
                ctx.rect(tx, 15, boxWidth, 34); 
            }
            ctx.fill();
            
            ctx.fillStyle = "#ffffff";
            ctx.fillText(timerText, tx + 15, 38);
        }
    }
}