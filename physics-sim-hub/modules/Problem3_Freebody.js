// /modules/Problem3_FreeBody.js
import SimulationGifMaker from '../core/SimulationGifMaker.js';

export default class Problem3_FreeBody extends SimulationGifMaker {
    constructor(canvasId) {
        // Set duration and framerate for this specific animation
        super(canvasId, { duration: 2, fps: 30 }); 
    }

    init() {
        // 1. Define the UI controls for this specific problem
        this.setupInputs('controls', {
            "Forces": {
                mass: { label: "Mass (kg)", type: "number", value: 5, step: 1 },
                appliedForce: { label: "Applied Force (N)", type: "number", value: 20, step: 1 },
                friction: { label: "Friction (N)", type: "number", value: 5, step: 1 }
            },
            "Display Settings": {
                showNetForce: { label: "Show Net Force", type: "checkbox", value: true }
            }
        });
        
        // 2. Draw the initial static preview
        this.drawPreview();
    }

    getVectorConfig() {
        return {
            magnitude: this.inputs.appliedForce ?? 20,
            angleDeg: 0,
            title: 'Applied Force Vector',
        };
    }

    drawFrame(ctx, time) {
        // 3. Pull user inputs
        const m = this.inputs.mass;
        const fa = this.inputs.appliedForce;
        const ff = this.inputs.friction;

        // 4. Draw your custom graphics for this problem!
        const centerX = this.width / 2;
        const centerY = this.height / 2;

        // Draw a simple box
        ctx.fillStyle = "#cbd5e1";
        ctx.fillRect(centerX - 40, centerY - 40, 80, 80);
        ctx.strokeRect(centerX - 40, centerY - 40, 80, 80);

        // (Add your arrow drawing logic here...)
        ctx.fillStyle = "#0f172a";
        ctx.font = "bold 16px sans-serif";
        ctx.fillText(`Mass: ${m}kg`, centerX - 30, centerY + 5);
    }
}