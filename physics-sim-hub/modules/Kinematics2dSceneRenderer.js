// =============================================================================
// Kinematics2dSceneRenderer.js
// =============================================================================
// Prototype mixin for Module2DKinematics.  Owns all canvas drawing for the
// projectile-world scene:
//
//   • Sky/terrain backgrounds (drawWorldBackground, drawScenarioTerrain)
//   • Scenario props: drawPoliceman, drawNavyBoat, drawFiretruck, drawLadder
//   • Launch cannon and given-value callout (drawLaunchCannon, drawLaunchGivenCallout)
//   • Trajectory, ghost frames, displacement ghost positions
//   • Drop-plane guide line
//   • Distance tools: drawDistanceTools, drawRuler, drawDetailedRuler
//   • Height markers and peak-zoom lens: drawMaxHeightMarker, drawPeakZeroVelocityZoom
//   • Physics vectors: drawPhysicsVectors, drawInitialVelocityVector, drawComponents
//   • Problem labels, telemetry overlay
//   • Utility primitives: drawAngleArc, drawLabeledArrow, drawAccelerationArrow
//
// Consumed by Kinematics2d.js via:
//   Object.assign(Module2DKinematics.prototype, sceneRendererMethods);
// =============================================================================

const sceneRendererMethods = {

drawWorldBackground(ctx, camera) {
    const worldMinX = camera.worldMinX || 0;
    const worldWidth = camera.worldWidth || this.width;
    const worldHeight = camera.worldHeight || this.height;

    ctx.save();
    const skyGradient = ctx.createLinearGradient(0, 0, 0, worldHeight);
    skyGradient.addColorStop(0, '#7dd3fc');
    skyGradient.addColorStop(0.58, '#bae6fd');
    skyGradient.addColorStop(1, '#e0f2fe');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(worldMinX, 0, worldWidth, worldHeight);
    ctx.restore();
},

drawPoliceman(ctx, model) {
    const policeX = model.endX + 50;
    const policeY = model.endY; 
    
    if (model.scenarioType === "Lower Landing / Cliff") {
        ctx.save();
        ctx.fillStyle = "#78350f"; 
        ctx.fillRect(policeX - 25, policeY - 2, 50, 6);
        ctx.fillStyle = "#facc15"; 
        ctx.fillRect(policeX - 25, policeY, 50, 2);
        ctx.restore();
    }

    const flip = true; 
    
    const gunBaseX = policeX + (flip ? -9 : 9); 
    const gunBaseY = policeY - 27;
    const dx = (flip ? -1 : 1) * (model.canvasX - gunBaseX);
    const dy = model.canvasY - gunBaseY;
    const armAngle = Math.atan2(dy, dx);

    this.drawTinyWorker(ctx, policeX, policeY, 0, 0, 'radar', 'police', flip, armAngle);

    ctx.save();
    const waveTime = (model.visualTime * 3) % 1; 
    ctx.strokeStyle = `rgba(239, 68, 68, ${Math.max(0, 1 - waveTime)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    const globalTargetAngle = Math.atan2(model.canvasY - gunBaseY, model.canvasX - gunBaseX);
    const waveRadius = Math.max(0, waveTime * 80); 
    
    ctx.arc(gunBaseX, gunBaseY, waveRadius, globalTargetAngle - 0.25, globalTargetAngle + 0.25);
    ctx.stroke();
    ctx.restore();

    if (model.visualTime > model.tFlight + 0.5) {
        const popTime = model.visualTime - (model.tFlight + 0.5);
        const scale = Math.min(1, popTime * 4) + (Math.sin(popTime * 10) * 0.2 * Math.max(0, 1 - popTime * 2));
        
        if (scale > 0) {
            ctx.save();
            ctx.translate(policeX, policeY - 65);
            ctx.scale(scale, scale);
            
            ctx.fillStyle = "rgba(255,255,255,0.95)";
            ctx.strokeStyle = "#1e3a8a"; 
            ctx.lineWidth = 2;
            const text = this.inputs.unknownFinalVelocity ? `v = ?` : `v = ${model.finalSpeed.toFixed(1)} m/s`;
            ctx.font = "bold 13px Inter, sans-serif";
            const tw = ctx.measureText(text).width;
            
            ctx.beginPath(); ctx.roundRect(-tw/2 - 14, -12, tw + 28, 24, 4);
            ctx.fill(); ctx.stroke();
            
            const flashTime = (model.visualTime * 5) % 2;
            const flash = flashTime > 1 ? "#ef4444" : "#3b82f6";
            ctx.fillStyle = flash;
            ctx.beginPath(); ctx.arc(-tw/2 - 6, -6, 3, 0, Math.PI*2); ctx.fill();
            
            ctx.fillStyle = "#1e3a8a";
            ctx.textAlign = "center"; ctx.textBaseline = "middle";
            ctx.fillText(text, 2, 1);
            ctx.restore();
        }
    }
},

drawNavyBoat(ctx, x, y, bobOffset, time) {
    ctx.save();
    ctx.translate(x, y - bobOffset);
    
    // The worker on the boat
    this.drawTinyWorker(ctx, 0, 8, 0, 0, 'tape', 'navy');

    // 1. Cabin Structure
    ctx.fillStyle = "#cbd5e1";
    ctx.beginPath();
    ctx.roundRect(-15, -18, 25, 15, 2);
    ctx.fill();
    // Cabin Window (Reflective)
    const winGrad = ctx.createLinearGradient(-10, -15, 5, -5);
    winGrad.addColorStop(0, "#38bdf8");
    winGrad.addColorStop(1, "#0369a1");
    ctx.fillStyle = winGrad;
    ctx.fillRect(-12, -15, 12, 8);

    // 2. Main Hull (Sleek metallic gradient)
    const hullGrad = ctx.createLinearGradient(-30, -5, 30, 10);
    hullGrad.addColorStop(0, "#94a3b8");
    hullGrad.addColorStop(0.5, "#475569");
    hullGrad.addColorStop(1, "#1e293b");
    
    ctx.fillStyle = hullGrad; 
    ctx.beginPath();
    ctx.moveTo(-35, -5);  // Back
    ctx.lineTo(35, -5);   // Bow tip
    ctx.lineTo(25, 10);   // Bottom front
    ctx.lineTo(-25, 10);  // Bottom back
    ctx.closePath();
    ctx.fill();

    // Hull Trim line
    ctx.fillStyle = "#0ea5e9";
    ctx.fillRect(-32, -2, 62, 2);
    
    // 3. Outboard Motor
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.roundRect(-42, -8, 10, 15, 2);
    ctx.fill();
    // Propeller wash (if moving)
    if (time > 0) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        const washPhase = (time * 15) % 5;
        ctx.beginPath();
        ctx.moveTo(-40 - washPhase, 8); ctx.lineTo(-55 - washPhase, 12);
        ctx.moveTo(-35 - washPhase, 12); ctx.lineTo(-50 - washPhase, 16);
        ctx.stroke();
    }

    ctx.restore();
},

drawFiretruck(ctx, x, y, time) {
    ctx.save();
    ctx.translate(x, y);

    // 1. Main Body (Fire Engine Red Gradient)
    const bodyGrad = ctx.createLinearGradient(-45, -35, 45, -5);
    bodyGrad.addColorStop(0, "#ef4444");
    bodyGrad.addColorStop(1, "#991b1b");
    
    ctx.fillStyle = bodyGrad; 
    ctx.beginPath();
    if (ctx.roundRect) {
        ctx.roundRect(-45, -25, 90, 20, 3); // Rear body
        ctx.roundRect(20, -35, 30, 30, 4);  // Cab
    } else {
        ctx.fillRect(-45, -25, 90, 20);
        ctx.fillRect(20, -35, 30, 30);
    }
    ctx.fill();

    // White side stripe
    ctx.fillStyle = "#f8fafc"; 
    ctx.fillRect(-45, -15, 90, 3);

    // 2. Details (Cabin Window)
    const winGrad = ctx.createLinearGradient(25, -32, 45, -20);
    winGrad.addColorStop(0, "#38bdf8");
    winGrad.addColorStop(1, "#0369a1");
    ctx.fillStyle = winGrad;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(28, -32, 18, 12, 2);
    else ctx.fillRect(28, -32, 18, 12);
    ctx.fill();

    // 3. Flashing Lightbar
    const flashPhase = (time > 0 && Math.sin(time * 15) > 0);
    ctx.fillStyle = "#cbd5e1"; // Lightbar base
    ctx.fillRect(32, -38, 8, 3);
    
    ctx.shadowBlur = flashPhase ? 15 : 0;
    ctx.shadowColor = "#ef4444";
    ctx.fillStyle = flashPhase ? "#ef4444" : "#7f1d1d";
    ctx.beginPath();
    ctx.arc(36, -38, 3, 0, Math.PI*2);
    ctx.fill();
    ctx.shadowBlur = 0; // reset
    
    // 4. Wheels with metallic rims
    const drawWheel = (wx, wy) => {
        // Tire
        ctx.fillStyle = "#0f172a";
        ctx.beginPath(); ctx.arc(wx, wy, 8, 0, Math.PI*2); ctx.fill();
        // Rim
        ctx.fillStyle = "#cbd5e1";
        ctx.beginPath(); ctx.arc(wx, wy, 4, 0, Math.PI*2); ctx.fill();
        // Hubcap center
        ctx.fillStyle = "#475569";
        ctx.beginPath(); ctx.arc(wx, wy, 1.5, 0, Math.PI*2); ctx.fill();
    };
    drawWheel(-25, -5);
    drawWheel(30, -5);

    ctx.restore();
},

drawLadder(ctx, x, y, angle, length) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle); 

    ctx.fillStyle = "#b45309"; 
    ctx.fillRect(-8, -length, 4, length);
    ctx.fillRect(4, -length, 4, length);

    ctx.fillStyle = "#92400e";
        for (let r = 15; r < length; r += 15) {
        ctx.fillRect(-6, -r, 12, 3);
    }
    ctx.restore();
},

drawScenarioTerrain(ctx, model) {
     const {
         launchSurfaceY: startY,
         landingSurfaceY: endY,
         lowerGroundY = model.startY,
         buildingRoofY = model.endY,
         buildingWallTopY = buildingRoofY,
         cliffTopY = model.startY,
         cliffGrassBottomY = model.startY + 16,
         waterSurfaceY = model.endY,
         flatGroundY = model.startY
     } = this.getTerrainSurfaceAnchors(model);
     const worldLeft = Number.isFinite(model.worldMinX) ? model.worldMinX : 0;
     const worldWidth = model.worldWidth || this.width;
     const worldRight = worldLeft + worldWidth;
     const worldHeight = model.worldHeight || this.height;
     
     // Determine where the elevation change happens based on the scenario
     const stepX = this.getScenarioStepX(model);

     ctx.save();

     // --- 1. UNIVERSAL BACKGROUND (Sky & Clouds) ---
     // Subtle vertical sky gradient
     const skyGrad = ctx.createLinearGradient(0, 0, 0, worldHeight);
     skyGrad.addColorStop(0, "#e0f2fe"); // Very light blue top
     skyGrad.addColorStop(1, "#bae6fd"); // Slightly deeper horizon
     ctx.fillStyle = skyGrad;
     ctx.fillRect(worldLeft, 0, worldWidth, worldHeight);

     // Fluffier clouds with volume (shadows and highlights)
     const drawCloud = (cx, cy, scale) => {
         ctx.save();
         ctx.translate(cx, cy);
         ctx.scale(scale, scale);
         
         // Cloud shadow
         ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
         ctx.beginPath();
         ctx.arc(0, 2, 25, 0, Math.PI * 2);
         ctx.arc(35, -13, 35, 0, Math.PI * 2);
         ctx.arc(70, 2, 25, 0, Math.PI * 2);
         ctx.fill();

         // Cloud highlight
         ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
         ctx.beginPath();
         ctx.arc(0, 0, 25, 0, Math.PI * 2);
         ctx.arc(35, -15, 35, 0, Math.PI * 2);
         ctx.arc(70, 0, 25, 0, Math.PI * 2);
         ctx.fill();
         ctx.restore();
     };

     drawCloud(worldLeft + (worldWidth * 0.15), 60, 1);
     drawCloud(worldLeft + (worldWidth * 0.75), 80, 0.8);
     drawCloud(worldLeft + (worldWidth * 0.45), 40, 0.6); // Distant cloud

     if (model.scenarioType === "Standard Projectile" || model.scenarioType === "Moving Drop / Airplane") {
         // --- SCENARIO 1 & 4: FLAT FIELD WITH DIRT LAYER ---
         if (worldLeft < 0) {
             const leftPatchWidth = -worldLeft;
             const leftGrassGrad = ctx.createLinearGradient(0, flatGroundY + 15, 0, worldHeight);
             leftGrassGrad.addColorStop(0, "#4ade80");
             leftGrassGrad.addColorStop(1, "#15803d");
             ctx.fillStyle = leftGrassGrad;
             ctx.fillRect(worldLeft, flatGroundY, leftPatchWidth, worldHeight - flatGroundY);
         }
         
         // Underground Dirt Layer
         const dirtGrad = ctx.createLinearGradient(0, flatGroundY + 15, 0, worldHeight);
         dirtGrad.addColorStop(0, "#2c8f4d"); // Top soil
         dirtGrad.addColorStop(1, "#3fae60"); // Deep earth
         ctx.fillStyle = dirtGrad;
         ctx.fillRect(0, flatGroundY + 15, worldRight, worldHeight - (flatGroundY + 15));

         // Thick Grass Layer
         const grassGrad = ctx.createLinearGradient(0, flatGroundY, 0, flatGroundY + 20);
         grassGrad.addColorStop(0, "#4ade80"); 
         grassGrad.addColorStop(1, "#15803d"); 
         ctx.fillStyle = grassGrad;
         ctx.fillRect(worldLeft, flatGroundY, worldWidth, 15);
         
         // Crisp grass edge
         ctx.strokeStyle = "#16a34a";
         ctx.lineWidth = 4;
         ctx.beginPath();
         ctx.moveTo(worldLeft, flatGroundY);
         ctx.lineTo(worldRight, flatGroundY);
         ctx.stroke();

     } else if (model.scenarioType === "Higher Landing") {
         // --- SCENARIO 2: GROUND TO BUILDING ---
         
         const bldgWidth = worldRight - stepX;
         
         // 1. Building Main Structure (3D shaded concrete)
         const bldgGrad = ctx.createLinearGradient(stepX, 0, stepX + bldgWidth, 0);
         bldgGrad.addColorStop(0, "#94a3b8"); // Lighter edge catching "sun"
         bldgGrad.addColorStop(0.1, "#64748b"); // Main concrete
         bldgGrad.addColorStop(1, "#475569"); // Shadow side
         ctx.fillStyle = bldgGrad;
         ctx.fillRect(stepX, buildingRoofY, bldgWidth, worldHeight - buildingRoofY);
         
         // Building Ledge / Parapet
         ctx.fillStyle = "#cbd5e1";
         ctx.fillRect(stepX, buildingRoofY, bldgWidth, 6);
         ctx.strokeStyle = "#475569";
         ctx.lineWidth = 1.5;
         ctx.strokeRect(stepX, buildingRoofY, bldgWidth, 6);

         // Left edge corner of the building
         ctx.fillStyle = "#e2e8f0";
         ctx.fillRect(stepX, buildingRoofY, 4, worldHeight - buildingRoofY);

         // Reflective Glass Windows
         for (let wx = stepX + 30; wx < worldRight - 10; wx += 55) {
             for (let wy = buildingRoofY + 35; wy < worldHeight - 10; wy += 55) {
                 // Glass gradient for reflection
                 const winGrad = ctx.createLinearGradient(wx, wy, wx + 24, wy + 32);
                 winGrad.addColorStop(0, "#0284c7");
                 winGrad.addColorStop(0.4, "#38bdf8");
                 winGrad.addColorStop(0.45, "#e0f2fe"); // Diagonal glare
                 winGrad.addColorStop(0.5, "#38bdf8");
                 winGrad.addColorStop(1, "#0369a1");
                 
                 ctx.fillStyle = winGrad;
                 ctx.fillRect(wx, wy, 24, 32);
                 
                 // Window frames
                 ctx.strokeStyle = "#1e293b";
                 ctx.lineWidth = 2;
                 ctx.strokeRect(wx, wy, 24, 32);
             }
         }

         // 2. Lower Ground (Grass & Dirt) overlapping the building base
         const grassOverlapX = stepX + 22; 

         if (worldLeft < 0) {
             ctx.fillStyle = "#43c95c";
             ctx.fillRect(worldLeft, lowerGroundY + 12, -worldLeft, worldHeight - (lowerGroundY + 12));
         }
         
         // Dirt under lower ground
         ctx.fillStyle = "#43c95c";
         ctx.fillRect(worldLeft, lowerGroundY + 12, grassOverlapX - worldLeft, worldHeight - (lowerGroundY + 12));

         // Grass top layer
         const grassGrad = ctx.createLinearGradient(0, lowerGroundY, 0, lowerGroundY + 12);
         grassGrad.addColorStop(0, "#4ade80");
         grassGrad.addColorStop(1, "#15803d");
         ctx.fillStyle = grassGrad;
         ctx.beginPath();
         ctx.moveTo(worldLeft, lowerGroundY);
         ctx.lineTo(grassOverlapX, lowerGroundY);
         ctx.lineTo(grassOverlapX + 12, lowerGroundY + 12); // Sloped edge against wall
         ctx.lineTo(worldLeft, lowerGroundY + 12);
         ctx.fill();
         
         ctx.strokeStyle = "#16a34a";
         ctx.lineWidth = 4;
         ctx.beginPath();
         ctx.moveTo(worldLeft, lowerGroundY);
         ctx.lineTo(grassOverlapX, lowerGroundY);
         ctx.lineTo(grassOverlapX + 10, lowerGroundY + 10);
         ctx.stroke();

     } else if (model.scenarioType === "Lower Landing / Cliff") {
         // --- SCENARIO 3: CLIFF DOWN TO WATER ---

         // 1. Distant Mountains (Layered with atmospheric fading)
         const drawMountainRange = (offset, color, scaleX, scaleY) => {
             ctx.fillStyle = color;
             ctx.beginPath();
             ctx.moveTo(stepX, waterSurfaceY);
             const rightSpan = worldRight - stepX;
             ctx.lineTo(stepX + rightSpan * (0.2 * scaleX), waterSurfaceY - (50 * scaleY));
             ctx.lineTo(stepX + rightSpan * (0.4 * scaleX), waterSurfaceY - (20 * scaleY));
             ctx.lineTo(stepX + rightSpan * (0.7 * scaleX), waterSurfaceY - (70 * scaleY));
             ctx.lineTo(worldRight, waterSurfaceY);
             ctx.fill();
         };

         // Back mountains (lighter, lower contrast)
         drawMountainRange(0, "#cbd5e1", 1.2, 1.1);
         // Front mountains (darker, sharper)
         drawMountainRange(0, "#94a3b8", 0.9, 0.8);

         // 2. Deep Water Body with Highlights
         const waterGrad = ctx.createLinearGradient(0, waterSurfaceY, 0, worldHeight);
         waterGrad.addColorStop(0, "#0ea5e9"); // Bright surface
         waterGrad.addColorStop(0.3, "#0284c7"); 
         waterGrad.addColorStop(1, "#082f49"); // Deep abyss
         ctx.fillStyle = waterGrad;
         ctx.fillRect(stepX, waterSurfaceY, worldRight - stepX, worldHeight - waterSurfaceY);
         
         // Surface line
         ctx.strokeStyle = "#38bdf8";
         ctx.lineWidth = 3;
         ctx.beginPath();
         ctx.moveTo(stepX, waterSurfaceY);
         ctx.lineTo(worldRight, waterSurfaceY);
         ctx.stroke();

         // Specular wave highlights
         ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
         ctx.beginPath();
         if (ctx.roundRect) {
             ctx.roundRect(stepX + 20, waterSurfaceY + 10, 40, 3, 2);
             ctx.roundRect(stepX + 80, waterSurfaceY + 15, 60, 3, 2);
             ctx.roundRect(stepX + 40, waterSurfaceY + 25, 30, 3, 2);
             ctx.roundRect(stepX + 130, waterSurfaceY + 35, 50, 3, 2);
         }
         ctx.fill();

         // 3. Cliff Face (Detailed Stone & Dirt)
         const cliffGrad = ctx.createLinearGradient(stepX - 40, 0, stepX, 0);
         cliffGrad.addColorStop(0, "#78716c"); // Shadowed rock
         cliffGrad.addColorStop(1, "#a8a29e"); // Exposed rock face
         ctx.fillStyle = cliffGrad; 
         ctx.beginPath();
         ctx.moveTo(worldLeft, cliffGrassBottomY);
         ctx.lineTo(stepX, cliffGrassBottomY);
         ctx.lineTo(stepX, worldHeight);
         ctx.lineTo(worldLeft, worldHeight);
         ctx.closePath();
         ctx.fill();
         
         // Rocky textures/cracks on the cliff face
         ctx.strokeStyle = "#57534e";
         ctx.lineWidth = 3;
         ctx.lineCap = "round";
         ctx.beginPath();
         ctx.moveTo(stepX - 10, cliffTopY + 40); ctx.lineTo(stepX, cliffTopY + 45);
         ctx.moveTo(stepX - 40, cliffTopY + 80); ctx.lineTo(stepX - 10, cliffTopY + 70); ctx.lineTo(stepX, cliffTopY + 75);
         ctx.moveTo(stepX - 25, cliffTopY + 130); ctx.lineTo(stepX - 5, cliffTopY + 135); ctx.lineTo(stepX, cliffTopY + 140);
         ctx.stroke();

         // Thicker 3D grass block on top of the cliff
         ctx.fillStyle = "#78350f"; // Dirt rim under the grass
         ctx.fillRect(worldLeft, cliffTopY, (stepX + 8) - worldLeft, cliffGrassBottomY - cliffTopY);

         ctx.fillStyle = "#4ade80"; // Top grass
         ctx.fillRect(worldLeft, cliffTopY, (stepX + 8) - worldLeft, 10);
         
         // Crisp Grass stroke
         ctx.strokeStyle = "#16a34a";
         ctx.lineWidth = 4;
         ctx.beginPath();
         ctx.moveTo(worldLeft, cliffTopY);
         ctx.lineTo(stepX + 8, cliffTopY); // Overhang lip
         ctx.stroke();
         
         // Cliff vertical drop edge
         ctx.strokeStyle = "#44403c";
         ctx.lineWidth = 4;
         ctx.beginPath();
         ctx.moveTo(stepX, cliffGrassBottomY);
         ctx.lineTo(stepX, worldHeight);
         ctx.stroke();
     }

     ctx.restore();
 },

drawLaunchCannon(ctx, model) {
    if (!this.inputs.showLaunchCannon) return;
    if (model.scenarioType === "Moving Drop / Airplane") return;
    if (String(this.inputs.objectType || '').toLowerCase() === 'plane') return;

    const { launchSurfaceY } = this.getTerrainSurfaceAnchors(model);
    const cannonScale = 0.4;
    const barrelAngle = Number.isFinite(model.angleRad) ? -model.angleRad : 0;
    const pivotX = model.startX;
    const pivotY = launchSurfaceY;

    ctx.save();
    ctx.translate(pivotX, pivotY);
    ctx.scale(cannonScale, cannonScale);

    // --- 1. BARREL ---
    ctx.save();
    ctx.rotate(barrelAngle);
    
    // Main Barrel Cylinder Gradient
    const barrelGrad = ctx.createLinearGradient(0, -22, 0, 22);
    barrelGrad.addColorStop(0, "#475569");    
    barrelGrad.addColorStop(0.3, "#94a3b8");  
    barrelGrad.addColorStop(0.8, "#1e293b");  
    barrelGrad.addColorStop(1, "#0f172a");    

    ctx.fillStyle = barrelGrad;
    ctx.fillRect(0, -22, 180, 44);
    
    // Muzzle Ring 
    const muzzleGrad = ctx.createLinearGradient(0, -26, 0, 26);
    muzzleGrad.addColorStop(0, "#334155");
    muzzleGrad.addColorStop(0.3, "#cbd5e1");
    muzzleGrad.addColorStop(1, "#0f172a");
    ctx.fillStyle = muzzleGrad;
    ctx.beginPath();
    if (ctx.roundRect) {
        ctx.roundRect(165, -26, 15, 52, 2);
    } else {
        ctx.fillRect(165, -26, 15, 52); 
    }
    ctx.fill();

    // Subtle barrel seam/groove 
    ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(165, 0);
    ctx.stroke();
    
    // Highlight right below the seam
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.beginPath();
    ctx.moveTo(0, 1);
    ctx.lineTo(165, 1);
    ctx.stroke();
    ctx.restore();

    // --- 2. BASE / MOUNT (SHINY METAL) ---
// Semi-circle mount with a shiny radial steel/aluminum gradient
const baseGrad = ctx.createRadialGradient(
0, 0, 4,     // inner circle: center of the mount
0, 0, 55     // outer circle: edge of the mount
);

baseGrad.addColorStop(0, "#ffffff");    // Bright center highlight
baseGrad.addColorStop(0.25, "#e2e8f0"); // Light steel
baseGrad.addColorStop(0.5, "#cbd5e1");  // Mid-light metal
baseGrad.addColorStop(0.75, "#94a3b8"); // Darker outer metal
baseGrad.addColorStop(1, "#475569");    // Dark rim shadow

ctx.beginPath();
ctx.arc(0, 0, 55, Math.PI, Math.PI * 2);
ctx.closePath();
ctx.fillStyle = baseGrad;
ctx.fill();
    
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#475569"; // Lighter border to match the metal
    ctx.stroke();

    // Structural ridges (made darker gray to contrast with the bright metal)
    ctx.beginPath();
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#64748b"; 
    ctx.lineCap = "round";
    ctx.moveTo(-48, 0);
    ctx.lineTo(-18, 0);
    ctx.moveTo(48, 0);
    ctx.lineTo(18, 0);
    ctx.moveTo(0, -18);
    ctx.lineTo(0, -48);
    ctx.stroke();
    
    // Rivets (bright white/silver so they pop against the metal)
    ctx.fillStyle = "#f8fafc"; 
    for (let angle = Math.PI; angle <= Math.PI * 2; angle += Math.PI / 4) {
        ctx.beginPath();
        ctx.arc(Math.cos(angle) * 46, Math.sin(angle) * 46, 2.5, 0, Math.PI * 2);
        ctx.fill();
    }

    // --- 3. PIVOT POINT ---
    const pivotGrad = ctx.createRadialGradient(0, -3, 2, 0, 0, 12);
    pivotGrad.addColorStop(0, "#fef08a");
    pivotGrad.addColorStop(1, "#ca8a04");
    
    ctx.beginPath();
    ctx.arc(0, 0, 12, Math.PI, Math.PI * 2);
    ctx.closePath();
    ctx.fillStyle = pivotGrad;
    ctx.fill();
    
    ctx.strokeStyle = "#854d0e";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
},

drawLaunchGivenCallout(ctx, model) {
    if (!this.inputs.showLaunchCannon) return;
    if (model.scenarioType === "Moving Drop / Airplane") return;
    if (String(this.inputs.objectType || '').toLowerCase() === 'plane') return;
    if (Math.abs(model.angleDeg || 0) < 0.5) return;

    const uiScale = this.getCanvasTextScale();
    const boxW = 122 * uiScale;
    const boxH = 58 * uiScale;
    const viewportLeft = Number.isFinite(model.worldMinX) ? model.worldMinX : 0;
    const viewportRight = Number.isFinite(model.worldMaxX) ? model.worldMaxX : this.width;
    const viewportTop = Number.isFinite(model.worldMinY) ? model.worldMinY : 0;
    const x = this.clamp(model.startX + (30 * uiScale), viewportLeft + (12 * uiScale), viewportRight - boxW - (12 * uiScale));
    const y = Math.max(viewportTop + (12 * uiScale), model.startY - (88 * uiScale));
    const givensMode = this.isGivensMatchingTask(this.activeWalkthroughStep, this.activeWalkthroughTask);
    const matchedGivens = new Set(this.workWalkthroughState?.selection || []);
    const vUnknown = givensMode ? !matchedGivens.has('v0') : this.inputs.unknownInitialVelocity;
    const thetaUnknown = givensMode ? !matchedGivens.has('theta') : this.inputs.unknownTheta;
    let rows = [
        {
            key: 'v0',
            label: `v = ${vUnknown ? '?' : `${model.vi.toFixed(1)} m/s`}`,
            color: '#2563eb'
        },
        {
            key: 'theta',
            label: `angle = ${thetaUnknown ? '?' : `${model.angleDeg.toFixed(0)}°`}`,
            color: '#7c3aed'
        }
    ];
    const allowedGivenTargets = this.getInputWalkthroughCanvasPolicy()?.allowedGivenTargets;
    if (allowedGivenTargets) {
        rows = rows.filter(row => allowedGivenTargets.has(row.key));
        if (!rows.length) return;
    }

    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.96)';
    ctx.strokeStyle = 'rgba(37,99,235,0.28)';
    ctx.lineWidth = 1.2 * uiScale;
    this.roundRectPath(ctx, x, y, boxW, boxH, 8 * uiScale);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.font = this.scaleFontString('800 9px Inter, sans-serif', uiScale);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('Launch givens', x + (10 * uiScale), y + (12 * uiScale));

    rows.forEach((row, index) => {
        const rowY = y + ((30 + (index * 17)) * uiScale);
        ctx.fillStyle = row.color;
        ctx.font = this.scaleFontString('700 11px Georgia, serif', uiScale);
        ctx.fillText(row.label, x + (10 * uiScale), rowY);
        this.registerCanvasAnchor(ctx, `launch:given:${row.key}`, {
            x: x + (6 * uiScale),
            y: rowY - (8 * uiScale),
            width: boxW - (12 * uiScale),
            height: 15 * uiScale,
            text: row.label,
            kind: 'walkthrough-concept',
            key: row.key
        });
    });
    ctx.restore();
},

drawTrajectory(ctx, model) {
    if (this.inputs.trailStyle === 'None') return;

    const points = this._getTrajectoryPoints(model);

    const drawPath = (endTime, strokeStyle, lineWidth, dash = []) => {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(model.startX, model.startY);
        for (const p of points) {
            if (p.t > endTime + 1e-9) break;
            ctx.lineTo(model.xToCanvas(p.x), model.yToCanvas(p.y));
        }
        // interpolated tip so the active trail ends exactly at activeTime
        const last = points[points.length - 1];
        if (endTime < last.t) {
            const { x, y } = this.getPositionAtTime(endTime, model);
            ctx.lineTo(model.xToCanvas(x), model.yToCanvas(y));
        }
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = lineWidth;
        ctx.setLineDash(dash);
        ctx.stroke();
        ctx.restore();
    };

    const fullDash = this.inputs.trailStyle === 'Dotted' ? [8, 8] : [];
    drawPath(model.tFlight, "rgba(100, 116, 139, 0.45)", 2, fullDash);

    if (model.activeTime > 0) {
        const activeDash = this.inputs.trailStyle === 'Dotted' ? [4, 4] : [];
        drawPath(model.activeTime, "rgba(37, 99, 235, 0.7)", 3, activeDash);
    }
},

drawGhostFrames(ctx, model) {
    const count = Math.max(1, Math.min(12, Math.round(this.normalizeNumber(this.inputs.ghostFrameCount, 6))));
    for (let i = 1; i < count; i++) {
        const t = (model.tFlight * i) / count;
        const { x, y } = this.getPositionAtTime(t, model);
        
        const progress = i / count;
        const opacity = 0.05 + 0.35 * Math.pow(progress, 2);
        
        this.drawObject(ctx, model.xToCanvas(x), model.yToCanvas(y), this.inputs.objectType, opacity, model);
    }
},

drawDisplacementGhostPositions(ctx, model) {
    const showXGhosts = Boolean(this.inputs.showXDisplacementGhosts);
    const showYGhosts = Boolean(this.inputs.showYDisplacementGhosts);
    if (!showXGhosts && !showYGhosts) return;

    const count = Math.max(2, Math.min(12, Math.round(this.normalizeNumber(this.inputs.ghostFrameCount, 6))));
    const ghostPoints = [];

    for (let i = 0; i <= count; i++) {
        const t = (model.tFlight * i) / count;
        const { x, y } = this.getPositionAtTime(t, model);
        ghostPoints.push({
            progress: i / count,
            x: model.xToCanvas(x),
            y: model.yToCanvas(y)
        });
    }

    const yGhostValues = ghostPoints.map(point => point.y);
    const yGhostTop = Math.min(...yGhostValues, model.startY);
    const yGhostBottom = Math.max(...yGhostValues, model.startY);

    ctx.save();
    ctx.lineWidth = 1.6;
    ctx.setLineDash([6, 6]);

    if (showXGhosts) {
        ctx.strokeStyle = "rgba(185, 28, 28, 0.48)";
        ctx.beginPath();
        ctx.moveTo(model.startX, model.startY);
        ctx.lineTo(model.endX, model.startY);
        ctx.stroke();
    }

    if (showYGhosts) {
        ctx.strokeStyle = "rgba(4, 120, 87, 0.48)";
        ctx.beginPath();
        ctx.moveTo(model.startX, yGhostBottom);
        ctx.lineTo(model.startX, yGhostTop);
        ctx.stroke();
    }

    ctx.setLineDash([]);

    ghostPoints.forEach((point, index) => {
        if (index === 0) return;
        const opacity = 0.08 + (0.34 * Math.pow(point.progress, 1.25));
        if (showXGhosts) {
            this.drawObject(ctx, point.x, model.startY, this.inputs.objectType, opacity, model);
        }
        if (showYGhosts) {
            this.drawObject(ctx, model.startX, point.y, this.inputs.objectType, opacity, model);
        }
    });

    if (showXGhosts) {
        const labelX = this.clamp((model.startX + model.endX) / 2, 48, this.width - 48);
        const labelY = this.clamp(model.startY + 26, 28, this.height - 28);
        this.drawTextLabel(ctx, labelX, labelY, "x ghost positions", {
            font: "bold 10px Inter, sans-serif",
            fill: "#b91c1c",
            background: "rgba(255,255,255,0.74)",
            borderColor: "rgba(185, 28, 28, 0.24)",
            shadowBlur: this.isSvgExporting ? 0 : 4
        });
    }

    if (showYGhosts) {
        const yLabelX = this.clamp(model.startX + 42, 42, this.width - 42);
        const yLabelY = this.clamp((yGhostTop + yGhostBottom) / 2, 28, this.height - 28);
        this.drawTextLabel(ctx, yLabelX, yLabelY, "y ghost positions", {
            rotate: -Math.PI / 2,
            font: "bold 10px Inter, sans-serif",
            fill: "#047857",
            background: "rgba(255,255,255,0.74)",
            borderColor: "rgba(4, 120, 87, 0.24)",
            shadowBlur: this.isSvgExporting ? 0 : 4
        });
    }

    ctx.restore();
},

drawDropPlaneGuide(ctx, model) {
    const planeY = model.startY - 32;
    const planeX = Math.max(-80, Math.min(this.width + 80, model.xToCanvas(model.currentX)));
    ctx.save();
    ctx.strokeStyle = "rgba(100, 116, 139, 0.7)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(model.startX, planeY);
    ctx.lineTo(model.endX, planeY);
    ctx.stroke();
    ctx.setLineDash([]);
    this.drawObject(ctx, planeX, planeY, "Plane", 0.95, model);
    ctx.restore();
},

drawDistanceTools(ctx, model) {
    const geometry = this.getDisplacementGeometry(model);
    this.drawRuler(
        ctx,
        geometry.dx.x1,
        geometry.dx.y1,
        geometry.dx.x2,
        geometry.dx.y2,
        "Δx",
        geometry.dx.value,
        "m",
        this.inputs.unknownDx,
        'dx',
        model
    );

    const dyValue = geometry.dy.value;
    const verticalLabel = Math.abs(dyValue) < 0.01 ? "hₘₐₓ" : "Δy";

    if (Math.abs(dyValue) < 0.01) {
        this.drawRuler(
            ctx,
            geometry.hmax.x1,
            geometry.hmax.y1,
            geometry.hmax.x2,
            geometry.hmax.y2,
            verticalLabel,
            geometry.hmax.value,
            "m",
            this.inputs.unknownHmax,
            'hmax',
            model
        );
    } else {
        this.drawRuler(
            ctx,
            geometry.dy.x1,
            geometry.dy.y1,
            geometry.dy.x2,
            geometry.dy.y2,
            verticalLabel,
            geometry.dy.value,
            "m",
            this.inputs.unknownDy,
            'dy',
            model
        );

        ctx.save();
        ctx.strokeStyle = "rgba(100, 116, 139, 0.5)";
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(model.startX, geometry.launchY);
        ctx.lineTo(geometry.dy.x1, geometry.launchY);
        ctx.moveTo(model.endX, geometry.landingY);
        ctx.lineTo(geometry.dy.x1, geometry.landingY);
        ctx.stroke();
        ctx.restore();
    }
},

drawRuler(ctx, x1, y1, x2, y2, symbol, value, unit, unknown = false, focusKey = null, model = null) {
    const isHorizontal = Math.abs(y1 - y2) < 1;
    const length = isHorizontal ? Math.abs(x2 - x1) : Math.abs(y2 - y1);
    const labelValue = focusKey === 'dy' ? value : Math.abs(value);
    const label = `${symbol} = ${unknown ? "?" : `${labelValue.toFixed(labelValue === 0 ? 0 : 1)} ${unit}`}`;
    const focusStyle = focusKey
        ? this.getWorkAnalysisValueFocusStyle(model, focusKey)
        : {};

    ctx.save();

    if (this.inputs.rulerStyle === "Detailed" && length > 30 && !unknown) {
        this.drawDetailedRuler(ctx, x1, y1, x2, y2, value, unit, label);
    } else {
        ctx.strokeStyle = focusStyle.lineColor || "#4b5563";
        ctx.lineWidth = focusStyle.lineWidth || 2;
        ctx.setLineDash([6, 6]);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.beginPath();
        if (isHorizontal) {
            ctx.moveTo(x1, y1 - 15);
            ctx.lineTo(x1, y1 + 15);
            ctx.moveTo(x2, y2 - 15);
            ctx.lineTo(x2, y2 + 15);
        } else {
            ctx.moveTo(x1 - 15, y1);
            ctx.lineTo(x1 + 15, y1);
            ctx.moveTo(x2 - 15, y2);
            ctx.lineTo(x2 + 15, y2);
        }
        ctx.stroke();
    }

    const tx = (x1 + x2) / 2;
    const ty = (y1 + y2) / 2;
    const labelPoint = this.clampCanvasPoint(
        isHorizontal ? tx : tx + 12,
        isHorizontal ? ty + 28 : ty,
        36
    );
    this.drawTextLabel(ctx, labelPoint.x, labelPoint.y, label, {
        rotate: isHorizontal ? 0 : -Math.PI / 2,
        font: "bold 12.8px serif",
        fill: focusStyle.fill || "#374151",
        background: focusStyle.background || null,
        shadowBlur: focusStyle.shadowBlur || 0,
        shadowColor: focusStyle.shadowColor || 'transparent',
        borderColor: focusStyle.borderColor,
        borderWidth: focusStyle.borderWidth || 0,
        scale: focusStyle.scale || 1
    });

    ctx.restore();
},

drawDetailedRuler(ctx, x1, y1, x2, y2, value, unit, label) {
    const isHorizontal = Math.abs(y1 - y2) < 1;
    const length = isHorizontal ? Math.abs(x2 - x1) : Math.abs(y2 - y1);
    const absValue = Math.max(0.001, Math.abs(value));
    let majorStep = 10;

    if (absValue >= 250) majorStep = 100;
    else if (absValue >= 100) majorStep = 50;
    else if (absValue >= 50) majorStep = 25;

    const minorStep = majorStep / 5;

    ctx.save();
    ctx.fillStyle = "#fef08a";
    ctx.strokeStyle = "#ca8a04";
    const uiScale = this.getCanvasTextScale();
    ctx.lineWidth = 2 * uiScale;

    if (isHorizontal) {
        const left = Math.min(x1, x2);
        ctx.fillRect(left, y1 - (10 * uiScale), length, 20 * uiScale);
        ctx.strokeRect(left, y1 - (10 * uiScale), length, 20 * uiScale);
    } else {
        const top = Math.min(y1, y2);
        ctx.fillRect(x1 - (10 * uiScale), top, 20 * uiScale, length);
        ctx.strokeRect(x1 - (10 * uiScale), top, 20 * uiScale, length);
    }

    ctx.strokeStyle = "#ca8a04";
    ctx.fillStyle = "#a16207";
    ctx.font = this.scaleFontString("bold 7px Inter, sans-serif");
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const dirX = isHorizontal ? (x2 >= x1 ? 1 : -1) : 0;
    const dirY = isHorizontal ? 0 : (y2 >= y1 ? 1 : -1);

    for (let val = 0; val <= absValue + 0.0001; val += minorStep) {
        const isMajor = Math.abs(val % majorStep) < 0.001 || Math.abs((val % majorStep) - majorStep) < 0.001;
        const dist = (val / absValue) * length;
        const cx = x1 + dirX * dist;
        const cy = y1 + dirY * dist;
        const tick = (isMajor ? 12 : 6) * uiScale;

        ctx.beginPath();
        if (isHorizontal) {
            ctx.moveTo(cx, y1 - (10 * uiScale));
            ctx.lineTo(cx, y1 - (10 * uiScale) + tick);
        } else {
            ctx.moveTo(x1 + (10 * uiScale) - tick, cy);
            ctx.lineTo(x1 + (10 * uiScale), cy);
        }
        ctx.stroke();

        if (isMajor) {
            if (isHorizontal) {
                ctx.fillText(String(Math.round(val)), cx, y1 + (17 * uiScale));
            } else {
                ctx.save();
                ctx.translate(x1 - (18 * uiScale), cy);
                ctx.rotate(-Math.PI / 2);
                ctx.fillText(String(Math.round(val)), 0, 0);
                ctx.restore();
            }
        }
    }

    ctx.restore();
},

drawMaxHeightMarker(ctx, model) {
    const { launchSurfaceY: launchY } = this.getTerrainSurfaceAnchors(model);
    ctx.save();
    const focusStyle = this.getWorkAnalysisValueFocusStyle(model, 'hmax');
    ctx.strokeStyle = focusStyle.lineColor || "rgba(16, 185, 129, 0.65)";
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = focusStyle.lineWidth || 1.5;

    ctx.beginPath();
    ctx.moveTo(model.startX, model.peakCanvasY);
    ctx.lineTo(model.peakCanvasX, model.peakCanvasY);
    ctx.lineTo(model.peakCanvasX, launchY);
    ctx.stroke();

    ctx.setLineDash([]);
    const hmaxLabel = `hₘₐₓ = ${this.inputs.unknownHmax ? "?" : `${(model.yPeak - model.yi).toFixed(2)} m`}`;
    this.drawTextLabel(ctx, model.peakCanvasX + 52, model.peakCanvasY - 10, hmaxLabel, {
        font: "600 9.1px Inter, sans-serif",
        fill: focusStyle.fill || "#059669",
        background: focusStyle.background || "rgba(255,255,255,0.82)",
        borderColor: focusStyle.borderColor,
        borderWidth: focusStyle.borderWidth ?? 1,
        shadowColor: focusStyle.shadowColor || 'rgba(15, 23, 42, 0.10)',
        shadowBlur: focusStyle.shadowBlur ?? (this.isSvgExporting ? 0 : 6),
        scale: focusStyle.scale || 1
    });

    const state = model?.isInWorkAnalysisSequence ? this.getWorkAnalysisSequenceState(model) : null;
    if (state?.step?.id === 'vertical-result' && Math.abs(model.yf - model.yi) < 0.01) {
        this.drawPeakZeroVelocityZoom(ctx, model, state.progress ?? 1);
    }
    ctx.restore();
},

drawPeakZeroVelocityZoom(ctx, model, progress = 1) {
    const uiScale = this.getCanvasTextScale();
    const pulse = this.isSvgExporting ? 0 : (0.5 + (0.5 * Math.sin((model.visualTime || 0) * Math.PI * 2.1)));
    const eased = this.easeInOut(progress);
    const peakX = model.peakCanvasX;
    const peakY = model.peakCanvasY;
    const focusStyle = this.getWorkAnalysisValueFocusStyle(model, ['hmax', 'v0y']);
    const lensRadius = 52 * uiScale;
    const lensX = this.clamp(peakX + (62 * uiScale), lensRadius + 16, this.width - lensRadius - 16);
    const lensY = this.clamp(peakY + (86 * uiScale), lensRadius + 16, this.height - lensRadius - 16);
    const insetGroundY = lensY + (18 * uiScale);
    const fullArrowLength = 42 * uiScale;
    const currentArrowLength = fullArrowLength * Math.max(0, 1 - eased);
    const labelText = eased >= 0.9 ? 'vᵧ = 0 at peak' : 'vᵧ → 0';

    ctx.save();

    ctx.strokeStyle = focusStyle.lineColor || 'rgba(5, 150, 105, 0.55)';
    ctx.fillStyle = 'rgba(16, 185, 129, 0.14)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(peakX, peakY, (10 * uiScale) + (pulse * 4 * uiScale), 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = 'rgba(15, 23, 42, 0.18)';
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(peakX + (10 * uiScale), peakY - (8 * uiScale));
    ctx.lineTo(lensX - (lensRadius * 0.55), lensY + (lensRadius * 0.55));
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = 'rgba(255,255,255,0.94)';
    ctx.beginPath();
    ctx.arc(lensX, lensY, lensRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(5, 150, 105, 0.26)';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    ctx.fillStyle = 'rgba(5, 150, 105, 0.08)';
    ctx.beginPath();
    ctx.arc(lensX, lensY, lensRadius - (8 * uiScale), 0, Math.PI * 2);
    ctx.fill();

    this.drawObject(ctx, lensX, insetGroundY, this.inputs.objectType, 1.8, model);

    ctx.strokeStyle = 'rgba(4, 120, 87, 0.22)';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(lensX, insetGroundY - (6 * uiScale));
    ctx.lineTo(lensX, insetGroundY - fullArrowLength);
    ctx.stroke();

    if (currentArrowLength > (4 * uiScale)) {
        this.drawArrow(
            ctx,
            lensX,
            insetGroundY - (6 * uiScale),
            lensX,
            insetGroundY - currentArrowLength,
            '#047857',
            4,
            { headSize: 11 * uiScale }
        );
    } else {
        ctx.fillStyle = '#047857';
        ctx.beginPath();
        ctx.arc(lensX, insetGroundY - (8 * uiScale), 4 * uiScale, 0, Math.PI * 2);
        ctx.fill();
    }

    this.drawTextLabel(ctx, lensX + (lensRadius * 0.9), lensY - (lensRadius * 0.4), labelText, {
        font: 'bold 11px Inter, sans-serif',
        fill: '#047857',
        background: 'rgba(255,255,255,0.92)',
        borderColor: 'rgba(4, 120, 87, 0.22)',
        borderWidth: 1,
        shadowColor: 'rgba(4, 120, 87, 0.14)',
        shadowBlur: this.isSvgExporting ? 0 : 8
    });

    this.drawTextLabel(ctx, lensX + (lensRadius * 0.92), lensY + (lensRadius * 0.12), `hₘₐₓ = ${this.inputs.unknownHmax ? '?' : `${(model.yPeak - model.yi).toFixed(2)} m`}`, {
        font: '600 10px Inter, sans-serif',
        fill: focusStyle.fill || '#059669',
        background: 'rgba(255,255,255,0.88)',
        borderColor: focusStyle.borderColor,
        borderWidth: focusStyle.borderWidth ?? 1,
        shadowColor: focusStyle.shadowColor || 'rgba(15, 23, 42, 0.10)',
        shadowBlur: focusStyle.shadowBlur ?? (this.isSvgExporting ? 0 : 6)
    });

    this.drawTextLabel(ctx, lensX, lensY - lensRadius - (12 * uiScale), 'Peak zoom', {
        font: '800 10px Inter, sans-serif',
        fill: '#047857',
        background: 'rgba(255,255,255,0.9)'
    });
    ctx.restore();
},

drawPhysicsVectors(ctx, model) {
    if (model.isInVectorBreakdown) return;
    const vectorScale = this.getVectorDrawingScale();
    const suppressLaunchComponents = this.isWorkAnalysisLaunchComponentStep(model);

    if (this.inputs.showMomentumVector) {
        const pScale = 1.5 * vectorScale;
        const px = model.m * model.vix;
        const py = model.m * model.currentVy;
        this.drawArrow(ctx, model.canvasX, model.canvasY, model.canvasX + px * pScale, model.canvasY - py * pScale, "rgba(6, 182, 212, 0.5)", 6);
    }

    if (this.inputs.showVelocityVectors && !suppressLaunchComponents) {
        const vScale = 2.5 * vectorScale;
        // Darker, high-contrast vectors
        this.drawArrow(ctx, model.canvasX, model.canvasY, model.canvasX + model.vix * vScale, model.canvasY, "#b91c1c", 2);
        this.drawArrow(ctx, model.canvasX, model.canvasY, model.canvasX, model.canvasY - model.currentVy * vScale, "#047857", 2);
        this.drawArrow(ctx, model.canvasX, model.canvasY, model.canvasX + model.vix * vScale, model.canvasY - model.currentVy * vScale, "#4338ca", 2);
    }

    if (this.inputs.showAccelerationVector) {
        const aScale = 3.5 * vectorScale;
        const anchor = this.getAccelerationAnchor(model);
        this.drawAccelerationArrow(ctx, anchor.x, anchor.y, model.g * aScale, "a");
    }
},

drawInitialVelocityVector(ctx, model) {
    const vectorScale = this.getVectorDrawingScale();
    const arrowLength = 72 * vectorScale;
    const endX = model.startX + (arrowLength * Math.cos(model.angleRad));
    const endY = model.startY - (arrowLength * Math.sin(model.angleRad));
    const magnitudeLabel = `v₀ = ${this.inputs.unknownInitialVelocity ? "?" : `${model.vi.toFixed(1)} m/s`}`;
    const v0FocusStyle = this.getWorkAnalysisValueFocusStyle(model, 'v0');
    this.drawArrow(ctx, model.startX, model.startY, endX, endY, v0FocusStyle.lineColor || "#2563eb", v0FocusStyle.lineWidth || 3);

    const midX = (model.startX + endX) / 2;
    const midY = (model.startY + endY) / 2;
    const magnitudePoint = this.clampCanvasPoint(midX - 42, midY - 8, 38);
    this.drawTextLabel(ctx, magnitudePoint.x, magnitudePoint.y, magnitudeLabel, {
        font: "bold 11.2px serif",
        fill: v0FocusStyle.fill || "#2563eb",
        background: v0FocusStyle.background || "rgba(255,255,255,0.88)",
        borderColor: v0FocusStyle.borderColor,
        borderWidth: v0FocusStyle.borderWidth ?? 1,
        shadowColor: v0FocusStyle.shadowColor || 'rgba(15, 23, 42, 0.10)',
        shadowBlur: v0FocusStyle.shadowBlur ?? (this.isSvgExporting ? 0 : 6),
        scale: v0FocusStyle.scale || 1
    });

    if (Math.abs(model.angleDeg) > 0.1) {
        const angleLabel = `θ = ${this.inputs.unknownTheta ? "?" : `${model.angleDeg.toFixed(0)}°`}`;
        this.drawAngleArc(ctx, model.startX, model.startY, model.angleDeg, 42 * vectorScale, angleLabel, this.getWorkAnalysisValueFocusStyle(model, 'theta'));
    }
},

drawProblemLabels(ctx, model) {
    const vectorScale = this.getVectorDrawingScale();
    const suppressLaunchComponents = this.isWorkAnalysisLaunchComponentStep(model);

    if (!suppressLaunchComponents) {
        const arrowLength = 72 * vectorScale;
        const v0EndX = model.startX + arrowLength * Math.cos(model.angleRad);
        const v0EndY = model.startY - arrowLength * Math.sin(model.angleRad);
        const v0Label = `v₀ = ${this.inputs.unknownInitialVelocity ? "?" : `${model.vi.toFixed(1)} m/s`}`;
        const v0FocusStyle = this.getWorkAnalysisValueFocusStyle(model, 'v0');
        this.drawLabeledArrow(ctx, model.startX, model.startY, v0EndX, v0EndY, v0FocusStyle.lineColor || "#2563eb", v0Label, v0FocusStyle);

        if (this.inputs.showAngleArc && Math.abs(model.angleDeg) > 0.1) {
            const thetaLabel = `θ = ${this.inputs.unknownTheta ? "?" : `${model.angleDeg.toFixed(0)}°`}`;
            this.drawAngleArc(ctx, model.startX, model.startY, model.angleDeg, 42 * vectorScale, thetaLabel, this.getWorkAnalysisValueFocusStyle(model, 'theta'));
        }
    }

    const vfAngle = Math.atan2(-model.finalVy, model.vix);
    const vfEndpoint = this.clampCanvasPoint(
        model.endX + (72 * vectorScale) * Math.cos(vfAngle),
        model.endY + (72 * vectorScale) * Math.sin(vfAngle),
        28
    );
    const vfLabel = `vf = ${this.inputs.unknownFinalVelocity ? "?" : `${model.finalSpeed.toFixed(1)} m/s`}`;
    const finalFocusStyle = this.getWorkAnalysisValueFocusStyle(model, 'finalV');
    this.drawLabeledArrow(ctx, model.endX, model.endY, vfEndpoint.x, vfEndpoint.y, finalFocusStyle.lineColor || "#2563eb", vfLabel, finalFocusStyle);

    const accX = Math.min(this.width - 120, Math.max(model.startX + 110, model.peakCanvasX + 70));
    const accY = Math.max(55, model.peakCanvasY - 100);
    this.drawAccelerationArrow(ctx, accX, accY, 78 * vectorScale, `a = ${model.g.toFixed(1)} m/s²`);

    const timeLabel = `t = ${this.inputs.unknownTime ? "?" : `${model.tFlight.toFixed(2)} s`}`;
    const timeFocusStyle = this.getWorkAnalysisValueFocusStyle(model, 'time');
    this.drawStopwatch(ctx, Math.min(this.width - 90, model.endX + 70), Math.max(50, model.endY - 55), timeLabel, timeFocusStyle);
},

drawComponents(ctx, model) {
    if (this.isWorkAnalysisLaunchComponentStep(model)) return;
    const vScale = 2.5 * this.getVectorDrawingScale();
    const vxEndX = model.canvasX + model.vix * vScale;
    const vyEndY = model.canvasY - model.currentVy * vScale;
    const vxValue = this.inputs.unknownFinalVx ? "?" : model.vix.toFixed(1);
    const vyValue = this.inputs.unknownFinalVy ? "?" : model.currentVy.toFixed(1);
    const vxPoint = this.clampCanvasPoint(vxEndX + 26, model.canvasY - 4, 40);
    const isVyDownward = model.currentVy < 0;
    const vyLabelY = isVyDownward
        ? (Math.max(model.canvasY, vyEndY) + 14)
        : (Math.min(model.canvasY, vyEndY) - 12);
    const vyPoint = this.clampCanvasPoint(model.canvasX + 10, vyLabelY, 40);

    ctx.save();
    ctx.fillStyle = "#b91c1c";
    ctx.font = this.scaleFontString("600 9.8px Inter, sans-serif");
    ctx.textAlign = "left";
    ctx.fillText(`Vx: ${vxValue}`, vxPoint.x, vxPoint.y);
    ctx.fillStyle = "#047857";
    ctx.fillText(`Vy: ${vyValue}`, vyPoint.x, vyPoint.y);
    ctx.restore();
},

drawAngleArc(ctx, x, y, angleDeg, radius, label, labelOptions = {}) {
    const vectorScale = this.getVectorDrawingScale();
    const angleRad = angleDeg * Math.PI / 180;
    const sweepDirection = angleDeg >= 0 ? -1 : 1;
    const endAngle = sweepDirection * angleRad;

    ctx.save();
    ctx.strokeStyle = labelOptions.lineColor || "#2563eb";
    ctx.fillStyle = labelOptions.lineColor || "#2563eb";
    ctx.lineWidth = labelOptions.lineWidth || 2;

    ctx.setLineDash([4 * vectorScale, 4 * vectorScale]);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + radius + (22 * vectorScale), y);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, endAngle, angleDeg >= 0);
    ctx.stroke();

    const labelAngle = endAngle / 2;
    const lx = x + (radius + (34 * vectorScale)) * Math.cos(labelAngle) + (labelOptions.labelOffsetX || 0);
    const ly = y + (radius + (34 * vectorScale)) * Math.sin(labelAngle) + (labelOptions.labelOffsetY || 0);
    if (label) {
        this.drawTextLabel(ctx, lx, ly, label, {
            font: "bold 10.5px serif",
            fill: labelOptions.fill || "#2563eb",
            background: labelOptions.background || "rgba(255,255,255,0.82)",
            borderColor: labelOptions.borderColor,
            borderWidth: labelOptions.borderWidth ?? 1,
            shadowColor: labelOptions.shadowColor || 'rgba(15, 23, 42, 0.10)',
            shadowBlur: labelOptions.shadowBlur ?? (this.isSvgExporting ? 0 : 6),
            scale: labelOptions.scale || 1
        });
    }

    ctx.restore();
},

drawLabeledArrow(ctx, fromX, fromY, toX, toY, color, label, labelOptions = {}) {
    this.drawArrow(ctx, fromX, fromY, toX, toY, color, labelOptions.lineWidth || 3);
    const midX = (fromX + toX) / 2;
    const midY = (fromY + toY) / 2;
    const angle = Math.atan2(toY - fromY, toX - fromX);
    
    // Push labels perpendicularly away from the arrow
    const pushDistance = 18;
    const offsetX = -Math.sin(angle) * pushDistance;
    const offsetY = Math.cos(angle) * pushDistance;
    const labelPoint = this.clampCanvasPoint(midX + offsetX, midY + offsetY, 38);

    this.drawTextLabel(ctx, labelPoint.x, labelPoint.y, label, {
        font: "bold 11.2px serif",
        fill: labelOptions.fill || color,
        background: labelOptions.background || "rgba(255,255,255,0.88)",
        borderColor: labelOptions.borderColor,
        borderWidth: labelOptions.borderWidth ?? 1,
        shadowColor: labelOptions.shadowColor || 'rgba(15, 23, 42, 0.10)',
        shadowBlur: labelOptions.shadowBlur ?? (this.isSvgExporting ? 0 : 6),
        scale: labelOptions.scale || 1
    });
},

drawAccelerationArrow(ctx, x, y, length, label) {
    const vectorScale = this.getVectorDrawingScale();
    ctx.save();
    ctx.strokeStyle = "#ea580c";
    ctx.fillStyle = "#ea580c";
    ctx.lineWidth = 2;
    ctx.setLineDash([3 * vectorScale, 3 * vectorScale]);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + length);
    ctx.stroke();

    ctx.setLineDash([]);

    for (let i = 0; i < 3; i++) {
        const p = 0.25 + i * 0.25;
        const cy = y + length * p;
        const size = (6 + i * 2) * vectorScale;
        ctx.beginPath();
        ctx.moveTo(x, cy + size);
        ctx.lineTo(x - size, cy - size);
        ctx.lineTo(x + size, cy - size);
        ctx.closePath();
        ctx.globalAlpha = 0.65 + i * 0.12;
        ctx.fill();
    }

    ctx.globalAlpha = 1;
    this.drawTextLabel(ctx, x + (65 * vectorScale), y + length / 2, label, {
        font: "bold 11.2px serif",
        fill: "#ea580c",
        background: "rgba(255,255,255,0.86)"
    });
    ctx.restore();
},

};

export default sceneRendererMethods;
