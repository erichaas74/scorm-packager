import SimulationGifMaker from '../core/SimulationGifMaker.js';

export default class Module1DKinematics extends SimulationGifMaker {
    constructor(canvasId) {
        super(canvasId, { duration: 3, fps: 30 }); 
    }

    init() {
        this.setupInputs('controls', {
            "1D Parameters": {
                initialVelocity: { label: "Initial Velocity (m/s)", type: "number", value: 0, step: 1 },
                acceleration: { label: "Acceleration (m/s²)", type: "number", value: 4, step: 0.5 },
                stopTime: { label: "Simulate For (s)", type: "number", value: 3.0, step: 0.1 }
            }
        });
        this.drawPreview();
    }

    drawFrame(ctx, time) {
        const vi = this.inputs.initialVelocity;
        const a = this.inputs.acceleration;
        const activeTime = Math.min(time, this.inputs.stopTime);
        
        const dx = (vi * activeTime) + (0.5 * a * Math.pow(activeTime, 2));
        
        const canvasX = 50 + (dx * 15); // 1m = 15px
        const cy = this.height / 2;

        // Draw Object
        ctx.beginPath(); ctx.arc(canvasX, cy, 20, 0, Math.PI * 2);
        ctx.fillStyle = "#ef4444"; ctx.fill();
        
        // HUD
        ctx.fillStyle = "#0f172a"; ctx.font = "bold 16px Inter";
        ctx.fillText(`Time: ${activeTime.toFixed(2)} s`, 20, 30);
    }
}