import SimulationGifMaker from '../core/SimulationGifMaker.js';

export default class MonkeyHunter extends SimulationGifMaker {
    constructor(canvasId) {
        super(canvasId, { duration: 4, fps: 30 }); 
        
        this.scale = 9; // 1 meter = 9 pixels
        this.originX = 80; // Shifted right to make room for the cannon
        this.groundY = this.height - 90;
    }

    init() {
        this.setupInputs('controls', {
            "Physics Parameters": {
                targetDist: { label: "Distance to Target X (m)", type: "number", value: 45, step: 1 },
                targetHeight: { label: "Target Initial Height Y (m)", type: "number", value: 20, step: 1 },
                initialVelocity: { label: "Projectile Velocity (m/s)", type: "number", value: 32, step: 1 },
                gravity: { label: "Gravity (m/s²)", type: "number", value: 9.8, step: 0.1 }
            },
            "Display Settings": {
                stopAnimation: { 
                    label: "Stop Animation", 
                    type: "select", 
                    options: ["At Collision", "Custom Time"], 
                    value: "At Collision" 
                },
                customStopTime: { label: "Custom Stop Time (s)", type: "number", value: 1.5, step: 0.1 },
                showLineOfSight: { label: "Show Aim Line", type: "checkbox", value: true },
                showGravityDrop: { label: "Show Gravity Drop (½gt²)", type: "checkbox", value: true },
                showVelocityVectors: { label: "Show Velocity Components", type: "checkbox", value: true },
                showTrail: { label: "Show Motion Trails", type: "checkbox", value: true },
                showTimerDisplay: { label: "Show Canvas Timer", type: "checkbox", value: true },
                showTelemetry: { label: "Show Telemetry HUD", type: "checkbox", value: true }
            }
        });
        
        this.drawPreview();
    }

    getVectorConfig() {
        const dx = this.inputs.targetDist ?? 45;
        const dy = this.inputs.targetHeight ?? 20;
        const angleDeg = Math.atan2(dy, dx) * 180 / Math.PI;
        return {
            magnitude: this.inputs.initialVelocity ?? 32,
            angleDeg: Math.round(angleDeg * 10) / 10,
            title: 'Projectile Velocity Vector',
        };
    }

    // --- Premium Drawing Helpers ---
    
    drawArrow(ctx, fromX, fromY, toX, toY, color, width = 2) {
        const headlen = 10;
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

    drawScenery(ctx) {
        // Sky Gradient
        const skyGrad = ctx.createLinearGradient(0, 0, 0, this.groundY);
        skyGrad.addColorStop(0, "#bae6fd"); // Light blue
        skyGrad.addColorStop(1, "#f0f9ff"); // Paler blue
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, this.width, this.groundY);

        // Sun
        ctx.beginPath();
        ctx.arc(150, 80, 40, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(253, 230, 138, 0.8)";
        ctx.fill();
        ctx.shadowBlur = 30;
        ctx.shadowColor = "#fef08a";
        ctx.fill();
        ctx.shadowBlur = 0;

        // Rolling Hills
        ctx.beginPath();
        ctx.moveTo(0, this.groundY);
        ctx.quadraticCurveTo(this.width * 0.25, this.groundY - 80, this.width * 0.6, this.groundY);
        ctx.fillStyle = "#dcfce7";
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(this.width * 0.4, this.groundY);
        ctx.quadraticCurveTo(this.width * 0.75, this.groundY - 60, this.width, this.groundY);
        ctx.fillStyle = "#bbf7d0";
        ctx.fill();

        // Ground Base
        ctx.fillStyle = "#86efac";
        ctx.fillRect(0, this.groundY, this.width, this.height - this.groundY);
        ctx.fillStyle = "#4ade80";
        ctx.fillRect(0, this.groundY, this.width, 6);
    }

    drawCannon(ctx, x, y, angle) {
        ctx.save();
        ctx.translate(x, y);
        
        // Cannon Base (Wood)
        ctx.fillStyle = "#78350f";
        ctx.beginPath();
        ctx.roundRect(-25, -10, 50, 25, 4);
        ctx.fill();
        ctx.strokeStyle = "#451a03";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Cannon Wheel
        ctx.beginPath();
        ctx.arc(-10, 15, 12, 0, Math.PI * 2);
        ctx.arc(15, 15, 12, 0, Math.PI * 2);
        ctx.fillStyle = "#451a03";
        ctx.fill();
        ctx.fillStyle = "#92400e";
        ctx.beginPath();
        ctx.arc(-10, 15, 6, 0, Math.PI * 2);
        ctx.arc(15, 15, 6, 0, Math.PI * 2);
        ctx.fill();

        // Cannon Barrel (Brass)
        ctx.rotate(-angle); // Rotate UP
        const brassGrad = ctx.createLinearGradient(0, -12, 0, 12);
        brassGrad.addColorStop(0, "#fde047");
        brassGrad.addColorStop(0.5, "#ca8a04");
        brassGrad.addColorStop(1, "#854d0e");
        
        ctx.fillStyle = brassGrad;
        ctx.beginPath();
        // Tapered barrel
        ctx.moveTo(-15, -12);
        ctx.lineTo(40, -8);
        ctx.lineTo(40, 8);
        ctx.lineTo(-15, 12);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Cannon muzzle details
        ctx.fillStyle = "#1c1917";
        ctx.fillRect(36, -6, 6, 12);
        ctx.fillStyle = brassGrad;
        ctx.fillRect(38, -10, 4, 20);

        ctx.restore();
    }

    drawTree(ctx, x, baseY, targetHeightCanvas) {
        ctx.save();
        // Trunk
        ctx.fillStyle = "#5d4037";
        ctx.beginPath();
        ctx.moveTo(x - 15, baseY);
        ctx.quadraticCurveTo(x - 10, targetHeightCanvas, x - 5, targetHeightCanvas - 20);
        ctx.lineTo(x + 5, targetHeightCanvas - 20);
        ctx.quadraticCurveTo(x + 10, targetHeightCanvas, x + 15, baseY);
        ctx.fill();

        // Branch holding the monkey
        ctx.beginPath();
        ctx.moveTo(x, targetHeightCanvas + 10);
        ctx.quadraticCurveTo(x - 30, targetHeightCanvas + 15, x - 45, targetHeightCanvas + 5);
        ctx.lineWidth = 8;
        ctx.strokeStyle = "#5d4037";
        ctx.lineCap = "round";
        ctx.stroke();

        // Leaves (Canopy)
        ctx.fillStyle = "#2e7d32";
        ctx.beginPath();
        ctx.arc(x, targetHeightCanvas - 30, 45, 0, Math.PI * 2);
        ctx.arc(x - 35, targetHeightCanvas - 10, 35, 0, Math.PI * 2);
        ctx.arc(x + 35, targetHeightCanvas - 10, 35, 0, Math.PI * 2);
        ctx.arc(x - 20, targetHeightCanvas - 50, 40, 0, Math.PI * 2);
        ctx.arc(x + 20, targetHeightCanvas - 50, 40, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    drawMonkey(ctx, x, y) {
        ctx.save();
        ctx.translate(x, y);
        
        // Tail (hanging)
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.quadraticCurveTo(15, -30, 5, -45);
        ctx.strokeStyle = "#795548";
        ctx.lineWidth = 4;
        ctx.stroke();

        // Body
        ctx.fillStyle = "#8d6e63";
        ctx.beginPath();
        ctx.ellipse(0, 10, 14, 18, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Belly
        ctx.fillStyle = "#d7ccc8";
        ctx.beginPath();
        ctx.ellipse(0, 12, 8, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.fillStyle = "#8d6e63";
        ctx.beginPath();
        ctx.arc(0, -5, 14, 0, Math.PI * 2);
        ctx.fill();

        // Ears
        ctx.beginPath();
        ctx.arc(-14, -8, 6, 0, Math.PI * 2);
        ctx.arc(14, -8, 6, 0, Math.PI * 2);
        ctx.fill();

        // Face area
        ctx.fillStyle = "#d7ccc8";
        ctx.beginPath();
        ctx.ellipse(0, -3, 11, 9, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyes & Nose
        ctx.fillStyle = "#3e2723";
        ctx.beginPath();
        ctx.arc(-4, -5, 2, 0, Math.PI * 2);
        ctx.arc(4, -5, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Smile
        ctx.beginPath();
        ctx.arc(0, 1, 4, 0.1, Math.PI - 0.1);
        ctx.strokeStyle = "#3e2723";
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.restore();
    }

    drawBracket(ctx, x, y1, y2, label) {
        const w = 8;
        const midY = (y1 + y2) / 2;
        
        ctx.beginPath();
        ctx.moveTo(x + w, y1);
        ctx.lineTo(x, y1);
        ctx.lineTo(x, y2);
        ctx.lineTo(x + w, y2);
        
        ctx.moveTo(x, midY);
        ctx.lineTo(x - w + 2, midY);
        
        ctx.strokeStyle = "#0f172a";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = "#0f172a";
        ctx.font = "bold 13px Inter";
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillText(label, x - w - 4, midY);
        ctx.textAlign = "left"; // reset
    }

    // --- Core Rendering Loop ---

    drawFrame(ctx, time) {
        const D = this.inputs.targetDist;
        const H = this.inputs.targetHeight;
        const v0 = this.inputs.initialVelocity;
        const g = this.inputs.gravity;

        // Perfectly aimed angle
        const angleRad = Math.atan2(H, D);
        const v0x = v0 * Math.cos(angleRad);
        const v0y = v0 * Math.sin(angleRad);

        // Critical times
        const tCollision = D / v0x; 
        const tTargetGround = Math.sqrt((2 * H) / g); 
        
        // Stop logic
        let stopTime = Math.min(tCollision, tTargetGround);
        if (this.inputs.stopAnimation === 'Custom Time') {
            stopTime = this.inputs.customStopTime;
        }

        const isFinished = time >= stopTime;
        const activeTime = Math.min(time, stopTime);

        // Physics positions
        const projX = v0x * activeTime;
        const projY = (v0y * activeTime) - (0.5 * g * Math.pow(activeTime, 2));
        
        const targX = D;
        const targetY = H - (0.5 * g * Math.pow(activeTime, 2));
        const losY = Math.tan(angleRad) * projX; // Line of sight height at current X

        // Canvas mapping
        const cProjX = this.originX + (projX * this.scale);
        const cProjY = this.groundY - (projY * this.scale);
        const cTargX = this.originX + (targX * this.scale);
        const cTargY = this.groundY - (targetY * this.scale);
        const cTargStartY = this.groundY - (H * this.scale);
        const cLosY = this.groundY - (losY * this.scale);

        // 1. Draw Environment
        this.drawScenery(ctx);
        this.drawTree(ctx, cTargX + 35, this.groundY, cTargStartY);
        this.drawCannon(ctx, this.originX, this.groundY - 10, angleRad);

        // 2. Line of Sight (Aim)
        if (this.inputs.showLineOfSight) {
            ctx.beginPath();
            ctx.moveTo(this.originX, this.groundY - 10);
            ctx.lineTo(cTargX, cTargStartY);
            ctx.strokeStyle = "rgba(100, 116, 139, 0.6)"; // Slate dashed
            ctx.setLineDash([6, 6]);
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.setLineDash([]);
            
            ctx.save();
            ctx.translate((this.originX + cTargX)/2, (this.groundY - 10 + cTargStartY)/2);
            ctx.rotate(-angleRad);
            ctx.fillStyle = "#475569";
            ctx.font = "italic 13px Inter";
            ctx.fillText("Theoretical gravity-free path", -60, -10);
            ctx.restore();
        }

        // 3. Motion Trails
        if (this.inputs.showTrail) {
            ctx.beginPath();
            ctx.moveTo(this.originX, this.groundY - 10);
            for(let t = 0; t <= activeTime; t += 0.05) {
                const px = v0x * t;
                const py = (v0y * t) - (0.5 * g * Math.pow(t, 2));
                ctx.lineTo(this.originX + (px * this.scale), this.groundY - 10 - (py * this.scale));
            }
            ctx.strokeStyle = "rgba(59, 130, 246, 0.5)"; 
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(cTargX, cTargStartY);
            ctx.lineTo(cTargX, cTargY);
            ctx.strokeStyle = "rgba(168, 85, 247, 0.5)"; 
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        // 4. Gravity Drop Brackets (Δy = 1/2 gt²)
        if (this.inputs.showGravityDrop && activeTime > 0.1) {
            const dropDist = 0.5 * g * Math.pow(activeTime, 2);
            const label = `½gt² = ${dropDist.toFixed(1)}m`;
            
            // Projectile Drop
            this.drawBracket(ctx, cProjX - 15, cLosY, cProjY, label);
            // Monkey Drop
            this.drawBracket(ctx, cTargX - 25, cTargStartY, cTargY, label);
        }

        // 5. Draw Actors
        // Projectile (Metallic sphere)
        const ballGrad = ctx.createRadialGradient(cProjX - 3, cProjY - 3, 2, cProjX, cProjY, 8);
        ballGrad.addColorStop(0, "#f8fafc");
        ballGrad.addColorStop(0.3, "#94a3b8");
        ballGrad.addColorStop(1, "#334155");
        
        ctx.beginPath();
        ctx.arc(cProjX, cProjY, 8, 0, Math.PI * 2);
        ctx.fillStyle = ballGrad;
        ctx.fill();
        ctx.strokeStyle = "#1e293b";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Monkey
        this.drawMonkey(ctx, cTargX, cTargY);

        // 6. Component Velocity Vectors
        if (this.inputs.showVelocityVectors && !isFinished) {
            const currentVy = v0y - (g * activeTime);
            const vScale = 1.5; 
            // Vx (Green)
            this.drawArrow(ctx, cProjX, cProjY, cProjX + v0x * vScale, cProjY, "#10b981", 3);
            // Vy (Red)
            this.drawArrow(ctx, cProjX, cProjY, cProjX, cProjY - currentVy * vScale, "#ef4444", 3);
        }

        // 7. Collision Explosion
        if (activeTime >= tCollision && Math.abs(projY - targetY) < 1) {
            ctx.beginPath();
            ctx.arc(cTargX, cTargY, 35, 0, Math.PI * 2);
            const boomGrad = ctx.createRadialGradient(cTargX, cTargY, 0, cTargX, cTargY, 35);
            boomGrad.addColorStop(0, "#ffffff");
            boomGrad.addColorStop(0.2, "#fde047");
            boomGrad.addColorStop(0.6, "#ea580c");
            boomGrad.addColorStop(1, "rgba(220, 38, 38, 0)");
            ctx.fillStyle = boomGrad;
            ctx.fill();
            
            ctx.fillStyle = "#ffffff";
            ctx.font = "900 18px Inter";
            ctx.strokeStyle = "#9a3412";
            ctx.lineWidth = 4;
            ctx.strokeText("BAM!", cTargX - 22, cTargY + 6);
            ctx.fillText("BAM!", cTargX - 22, cTargY + 6);
        }

        // --- Premium HUD ---
        if (this.inputs.showTelemetry) {
            const boxX = 20;
            const boxY = 20;
            
            ctx.fillStyle = "rgba(15, 23, 42, 0.85)"; // Dark glass
            ctx.roundRect ? ctx.roundRect(boxX, boxY, 230, 115, 12) : ctx.fillRect(boxX, boxY, 230, 115);
            ctx.fill();
            ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.fillStyle = "#f8fafc";
            ctx.font = "bold 13px Inter";
            ctx.fillText(`Telemetry`, boxX + 15, boxY + 25);
            ctx.beginPath(); ctx.moveTo(boxX + 15, boxY + 35); ctx.lineTo(boxX + 215, boxY + 35); ctx.stroke();

            ctx.font = "12px JetBrains Mono, monospace";
            ctx.fillStyle = "#38bdf8";
            ctx.fillText(`Proj Y:   ${projY.toFixed(2)} m`, boxX + 15, boxY + 55);
            
            ctx.fillStyle = "#c084fc";
            ctx.fillText(`Monkey Y: ${targetY.toFixed(2)} m`, boxX + 15, boxY + 75);
            
            ctx.fillStyle = "#f43f5e";
            ctx.fillText(`Distance: ${Math.abs(cProjX - cTargX) < 2 ? "0.00" : Math.abs(targX - projX).toFixed(2)} m`, boxX + 15, boxY + 95);
        }

        if (this.inputs.showTimerDisplay) {
            const timerText = `⏱ ${activeTime.toFixed(2)} s`;
            ctx.font = "bold 16px Inter";
            const textWidth = ctx.measureText(timerText).width;
            const tx = (this.width / 2) - ((textWidth + 30) / 2);
            
            ctx.fillStyle = "rgba(255, 255, 255, 0.9)"; 
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(tx, 15, textWidth + 30, 34, 17);
            else ctx.rect(tx, 15, textWidth + 30, 34); 
            ctx.fill();
            ctx.strokeStyle = "#cbd5e1";
            ctx.stroke();
            
            ctx.fillStyle = "#0f172a";
            ctx.fillText(timerText, tx + 15, 38);
        }
    }
}