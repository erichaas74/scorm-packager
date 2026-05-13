function getHoverVerticalAnchors(model) {
    return {
        startGroundY: Number.isFinite(model.launchSurfaceY) ? model.launchSurfaceY : model.startY,
        endGroundY: Number.isFinite(model.landingSurfaceY) ? model.landingSurfaceY : model.endY
    };
}

function runHoverAnimationGuard(instance, label, drawFn) {
    try {
        drawFn();
        instance._lastHoverAnimationErrorSignature = null;
        return true;
    } catch (error) {
        const errorSignature = `${instance.hoveredValueKey || 'none'}:${label}:${error?.message || error}`;
        if (instance._lastHoverAnimationErrorSignature !== errorSignature) {
            console.error(`Hover animation ${label} failed`, error);
            instance._lastHoverAnimationErrorSignature = errorSignature;
        }
        return false;
    }
}

export function drawFunVariableAnimations(ctx, model, elapsed = null) {
        if (elapsed === null) return;
        const hoverKey = this.hoveredValueKey;
        if (!hoverKey) return;

        let baseStyle = (this.inputs.workerStyle || 'Construction').toLowerCase();
        if (baseStyle === 'rock climber') baseStyle = 'climber';

        const isNavy = model.scenarioType === "Lower Landing / Cliff";
        const isBuilding = model.scenarioType === "Higher Landing";

        const walkDurationX = 2.0;
        const setupDurationH = 0.5;
        const climbDurationH = 1.5;
        const walkDurationH = 2.0;

        const walkProgressX = Math.min(1, Math.max(0, elapsed / walkDurationX));
        const easeOutX = 1 - Math.pow(1 - walkProgressX, 3);

        const { startGroundY, endGroundY } = getHoverVerticalAnchors(model);
        let groundY = startGroundY;
        let workerEndGroundY = endGroundY;
        const hoverWorkerFootOffset = 0;
        const groundWorkerY = groundY + hoverWorkerFootOffset;
        const workerEndFootY = workerEndGroundY + hoverWorkerFootOffset;
        const deltaYValue = model.yf - model.yi;
        const deltaYRulerX = model.scenarioType === 'Lower Landing / Cliff'
            ? this.clamp(this.getScenarioStepX(model) + 38, model.startX + 28, this.width - 55)
            : Math.max(model.startX + 45, Math.min(this.width - 55, model.endX - 44));
        const deltaXLineY = workerEndGroundY - 14;

        const isWalkingX = walkProgressX < 1;
        const walkBobX = isWalkingX ? Math.abs(Math.sin(elapsed * 20)) * 4 : 0;

        ctx.save();
        
        // --- 1. DELTA X ---
        if (hoverKey === 'x:displacement' && isNavy) {
            const stepX = Math.min(model.startX + 50, model.startX + (model.endX - model.startX) * 0.5);
            const currentWorkerX = model.startX + (model.endX - model.startX) * easeOutX;
            
            ctx.strokeStyle = "#facc15"; 
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(model.startX, deltaXLineY);
            ctx.lineTo(currentWorkerX, deltaXLineY);
            ctx.stroke();

            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 10]);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = "#78350f"; 
            ctx.fillRect(stepX, workerEndGroundY - 2, 20, 6);
            this.drawTinyWorker(ctx, model.startX, workerEndFootY, 0, 0, 'none', 'navy');
            this.drawNavyBoat(ctx, currentWorkerX, workerEndGroundY, walkBobX, isWalkingX ? elapsed : 0);

            if (!isWalkingX) {
                const popTime = elapsed - walkDurationX;
                const scale = Math.min(1, popTime * 4) + (Math.sin(popTime * 10) * 0.2 * Math.max(0, 1 - popTime * 2));
                if (scale > 0) {
                    ctx.save();
                    ctx.translate((model.startX + model.endX) / 2, deltaXLineY - 26);
                    ctx.scale(scale, scale);
                    ctx.fillStyle = "rgba(255,255,255,0.95)";
                    ctx.strokeStyle = "#ea580c";
                    ctx.lineWidth = 2;
                    const text = this.inputs.unknownDx ? `Δx = ?` : `Δx = ${model.range.toFixed(1)} m`;
                    ctx.font = "bold 14px Inter, sans-serif";
                    const tw = ctx.measureText(text).width;
                    this.roundRectPath(ctx, -tw/2 - 10, -12, tw + 20, 24, 6);
                    ctx.fill(); ctx.stroke();
                    ctx.fillStyle = "#ea580c";
                    ctx.textAlign = "center"; ctx.textBaseline = "middle";
                    ctx.fillText(text, 0, 1);
                    ctx.restore();
                }
            }
        } else if (hoverKey === 'x:displacement') {
            const currentWorkerX = model.startX + (model.endX - model.startX) * easeOutX;
            const lineY = groundY - 14;
            const workerY = groundWorkerY;
            
            ctx.strokeStyle = "#facc15"; 
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(model.startX, lineY);
            ctx.lineTo(currentWorkerX, lineY);
            ctx.stroke();

            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 10]);
            ctx.stroke();
            ctx.setLineDash([]);

            this.drawTinyWorker(ctx, model.startX, workerY, 0, 0, 'none', baseStyle);
            this.drawTinyWorker(ctx, currentWorkerX, workerY, walkBobX, isWalkingX ? elapsed : 0, 'tape', baseStyle);

            if (!isWalkingX) {
                const popTime = elapsed - walkDurationX;
                const scale = Math.min(1, popTime * 4) + (Math.sin(popTime * 10) * 0.2 * Math.max(0, 1 - popTime * 2));
                if (scale > 0) {
                    ctx.save();
                    ctx.translate((model.startX + model.endX) / 2, lineY - 16);
                    ctx.scale(scale, scale);
                    ctx.fillStyle = "rgba(255,255,255,0.95)";
                    ctx.strokeStyle = "#ea580c";
                    ctx.lineWidth = 2;
                    const text = this.inputs.unknownDx ? `Δx = ?` : `Δx = ${model.range.toFixed(1)} m`;
                    ctx.font = "bold 14px Inter, sans-serif";
                    const tw = ctx.measureText(text).width;
                    this.roundRectPath(ctx, -tw/2 - 10, -12, tw + 20, 24, 6);
                    ctx.fill(); ctx.stroke();
                    ctx.fillStyle = "#ea580c";
                    ctx.textAlign = "center"; ctx.textBaseline = "middle";
                    ctx.fillText(text, 0, 1);
                    ctx.restore();
                }
            }
        }

        // --- 2. DELTA Y ---
        // --- 2. DELTA Y ---
        if (isNavy && hoverKey === 'y:displacement') {
            const rappelDuration = 3.5;
            const cycles = 3;
            let yProgOverall = 1;
            let xOff = 0;
            let legAngle = 0;
            let bodyAngle = 0;

            if (elapsed < rappelDuration) {
                const t = (elapsed / rappelDuration) * cycles;
                const cycleIdx = Math.floor(t);
                const cycleP = t % 1;
                
                let yProgLocal = 0;
                if (cycleP < 0.2) { 
                    const p = cycleP / 0.2;
                    xOff = 40 * Math.sin(p * Math.PI / 2);
                    yProgLocal = 0;
                } else if (cycleP < 0.7) { 
                    const p = (cycleP - 0.2) / 0.5;
                    xOff = 40 * Math.cos(p * Math.PI / 2);
                    yProgLocal = this.easeInOut(p);
                } else { 
                    xOff = 0;
                    yProgLocal = 1;
                }
                
                yProgOverall = (Math.min(cycleIdx, cycles - 1) + yProgLocal) / cycles;
                const bracedFraction = 1 - (xOff / 40); 
                legAngle = -0.1 - 0.7 * bracedFraction; 
                bodyAngle = -0.3 * bracedFraction; 
            }

            const tapeX = deltaYRulerX;
            const currentWorkerAnchorY = groundY + (workerEndGroundY - groundY) * yProgOverall;
            const currentWorkerY = currentWorkerAnchorY + hoverWorkerFootOffset;
            const baseWorkerX = tapeX - 29;
            const currentWorkerX = baseWorkerX + xOff;
            const currentTapeY = groundY + (workerEndGroundY - groundY) * Math.min(1, elapsed / rappelDuration);

            ctx.strokeStyle = "#facc15";
            ctx.lineWidth = 4;
            ctx.beginPath(); ctx.moveTo(tapeX, groundY); ctx.lineTo(tapeX, currentTapeY); ctx.stroke();

            ctx.fillStyle = "#f97316"; 
            ctx.beginPath(); this.roundRectPath(ctx, tapeX - 5, currentTapeY - 10, 10, 10, 2); ctx.fill();

            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 10]);
            ctx.beginPath();
            ctx.moveTo(tapeX, groundY); ctx.lineTo(tapeX - 25, groundY);
            ctx.moveTo(tapeX, currentTapeY); ctx.lineTo(tapeX - 25, currentTapeY);
            ctx.stroke();
            ctx.setLineDash([]);

            // Define the consistent climber style for both workers
            const climberStyle = baseStyle === 'construction' ? 'climber' : baseStyle;

            // Worker 1: Belaying at the top
            this.drawTinyWorker(ctx, tapeX - 15, groundWorkerY, 0, 0, 'none', climberStyle);

            ctx.strokeStyle = "#94a3b8"; 
            ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(baseWorkerX, groundY); ctx.lineTo(currentWorkerX, currentWorkerY - 20); ctx.stroke();

            // Worker 2: Rappelling down
            const rappelPose = { arm: Math.PI/1.5, leg: legAngle, body: bodyAngle };
            this.drawTinyWorker(ctx, currentWorkerX, currentWorkerY, 0, 0, 'none', climberStyle, true, rappelPose);

            if (elapsed >= rappelDuration) {
                const popTime = elapsed - rappelDuration;
                const scale = Math.min(1, popTime * 4) + (Math.sin(popTime * 10) * 0.2 * Math.max(0, 1 - popTime * 2));
                if (scale > 0) {
                    ctx.save();
                    ctx.translate(tapeX + 45, (groundY + workerEndGroundY) / 2);
                    ctx.scale(scale, scale);
                    ctx.fillStyle = "rgba(255,255,255,0.95)";
                    ctx.strokeStyle = "#047857";
                    ctx.lineWidth = 2;
                    const text = this.inputs.unknownDy ? `Δy = ?` : `Δy = ${deltaYValue.toFixed(1)} m`;
                    ctx.font = "bold 14px Inter, sans-serif";
                    const tw = ctx.measureText(text).width;
                    this.roundRectPath(ctx, -tw/2 - 10, -12, tw + 20, 24, 6);
                    ctx.fill(); ctx.stroke();
                    ctx.fillStyle = "#047857";
                    ctx.textAlign = "center"; ctx.textBaseline = "middle";
                    ctx.fillText(text, 0, 1);
                    ctx.restore();
                }
            }
        } else if (isBuilding && hoverKey === 'y:displacement') {
            
            const walkDurationY = 2.0;
            const walkProgressY = Math.min(1, elapsed / walkDurationY);
            const easeOutY = 1 - Math.pow(1 - walkProgressY, 3);
            const tapeX = deltaYRulerX;
            const currentTapeY = groundY + (workerEndGroundY - groundY) * easeOutY;
            const currentWorkerY = currentTapeY + hoverWorkerFootOffset;

            ctx.strokeStyle = "#facc15";
            ctx.lineWidth = 4;
            ctx.beginPath(); ctx.moveTo(tapeX, groundY); ctx.lineTo(tapeX, currentTapeY); ctx.stroke();
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 1; ctx.setLineDash([2, 10]); ctx.stroke(); ctx.setLineDash([]);

            this.drawTinyWorker(ctx, tapeX - 14, groundWorkerY, 0, 0, 'none', baseStyle);
            this.drawTinyWorker(ctx, tapeX + 4, currentWorkerY, 0, 0, 'tape', baseStyle, false);

            if (walkProgressY >= 1) {
                const popTime = elapsed - walkDurationY;
                const scale = Math.min(1, popTime * 4) + (Math.sin(popTime * 10) * 0.2 * Math.max(0, 1 - popTime * 2));
                if (scale > 0) {
                    ctx.save();
                    ctx.translate(tapeX - 52, (groundY + workerEndGroundY) / 2);
                    ctx.scale(scale, scale);
                    ctx.fillStyle = "rgba(255,255,255,0.95)";
                    ctx.strokeStyle = "#ea580c";
                    ctx.lineWidth = 2;
                    const text = this.inputs.unknownDy ? `Δy = ?` : `Δy = ${deltaYValue.toFixed(1)} m`;
                    ctx.font = "bold 14px Inter, sans-serif";
                    const tw = ctx.measureText(text).width;
                    this.roundRectPath(ctx, -tw/2 - 10, -12, tw + 20, 24, 6);
                    ctx.fill(); ctx.stroke();
                    ctx.fillStyle = "#ea580c";
                    ctx.textAlign = "center"; ctx.textBaseline = "middle";
                    ctx.fillText(text, 0, 1);
                    ctx.restore();
                }
            }
        }

        // --- 3. MAX HEIGHT ---
        if (hoverKey === 'y:hmax') {
            if (isNavy) {
                // TIGHTROPE ACROBAT SEQUENCE
                const ropeWalkDuration = 2.5;
                const ropeSetupDuration = 0.5;
                
                const ropeTime = Math.max(0, elapsed - 0.2);
                const walkTH = Math.min(1, Math.max(0, ropeTime / ropeWalkDuration));
                const setupTH = Math.min(1, Math.max(0, (ropeTime - ropeWalkDuration) / ropeSetupDuration));
                const climbTH = Math.min(1, Math.max(0, (ropeTime - ropeWalkDuration - ropeSetupDuration) / climbDurationH));
                
                const ropeY = model.startY;
                const startWalkX = model.startX - 30; 
                const targetWalkX = model.peakCanvasX;
                const walkEase = 1 - Math.pow(1 - walkTH, 3);
                const currentX = startWalkX + (targetWalkX - startWalkX) * walkEase;
                
                // --- Updated Drone and Tightrope rendering ---
                ctx.save();
                ctx.strokeStyle = "#94a3b8"; // Solid steel cable color
                ctx.lineWidth = 3;           // Thicker solid rope
                ctx.setLineDash([]);         // Removed the dash
                ctx.beginPath();
                ctx.moveTo(model.startX - 50, ropeY);
                
                // Set drone X position to exactly 75% of the flight distance
                const droneX = model.startX + (model.endX - model.startX) * 0.75;
                
                ctx.lineTo(droneX, ropeY);
                ctx.stroke();
                
                // Upgraded Drone Body (Metallic)
                const droneGrad = ctx.createLinearGradient(droneX - 15, ropeY - 5, droneX + 15, ropeY + 5);
                droneGrad.addColorStop(0, "#e2e8f0");
                droneGrad.addColorStop(0.5, "#94a3b8");
                droneGrad.addColorStop(1, "#475569");
                ctx.fillStyle = droneGrad;
                ctx.beginPath(); 
                if (ctx.roundRect) {
                    ctx.roundRect(droneX - 18, ropeY - 6, 36, 12, 4); 
                } else {
                    ctx.fillRect(droneX - 18, ropeY - 6, 36, 12);
                }
                ctx.fill();

                // Glowing LED Indicator
                ctx.shadowColor = "#ef4444";
                ctx.shadowBlur = 8;
                ctx.fillStyle = "#ef4444";
                ctx.beginPath(); ctx.arc(droneX, ropeY, 2.5, 0, Math.PI*2); ctx.fill();
                ctx.shadowBlur = 0; // reset

                // Motion Blurred Rotors
                const rotorT = elapsed * 50; // Fast spin
                ctx.strokeStyle = "#475569"; 
                ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(droneX - 12, ropeY - 6); ctx.lineTo(droneX - 25, ropeY - 12); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(droneX + 12, ropeY - 6); ctx.lineTo(droneX + 25, ropeY - 12); ctx.stroke();
                
                ctx.fillStyle = "rgba(255, 255, 255, 0.5)"; // Blur effect
                ctx.beginPath(); ctx.ellipse(droneX - 25, ropeY - 12, 14 + Math.sin(rotorT)*6, 2.5, 0, 0, Math.PI*2); ctx.fill();
                ctx.beginPath(); ctx.ellipse(droneX + 25, ropeY - 12, 14 + Math.cos(rotorT)*6, 2.5, 0, 0, Math.PI*2); ctx.fill();
                ctx.restore();

                const poleHeight = ropeY - model.peakCanvasY + 10;
                if (walkTH >= 1) {
                    const setupEase = 1 - Math.pow(1 - setupTH, 2);
                    const currentPoleHeight = poleHeight * setupEase;
                    
                    ctx.save();
                    ctx.strokeStyle = "#b45309"; 
                    ctx.lineWidth = 4;
                    ctx.beginPath(); ctx.moveTo(targetWalkX + 12, ropeY); ctx.lineTo(targetWalkX + 12, ropeY - currentPoleHeight); ctx.stroke();
                    ctx.strokeStyle = "#000";
                    ctx.lineWidth = 1;
                    for(let i=5; i<currentPoleHeight; i+=8) {
                         ctx.beginPath(); ctx.moveTo(targetWalkX + 10, ropeY - i); ctx.lineTo(targetWalkX + 14, ropeY - i); ctx.stroke();
                    }
                    ctx.restore();
                }

                let climberY = ropeY;
                let climberX = currentX;
                let showBalance = true;
                let climbingTime = 0;

                let crisis1 = Math.exp(-Math.pow((walkTH - 0.35) * 15, 2));
                let crisis2 = Math.exp(-Math.pow((walkTH - 0.75) * 15, 2));
                let crisis = crisis1 + crisis2;
                
                let poleAngle = Math.sin(ropeTime * 2) * 0.15; 
                let wobbleBob = 0;

                if (walkTH >= 1 && setupTH < 1) {
                    showBalance = false;
                    climberX = targetWalkX;
                } else if (setupTH >= 1) {
                    showBalance = false;
                    climberX = targetWalkX + 12;
                    const climbEase = 1 - Math.pow(1 - climbTH, 2);
                    climberY = ropeY - (ropeY - model.peakCanvasY) * climbEase;
                    climbingTime = climbTH < 1 ? ropeTime * 2.0 : 0;
                } else if (walkTH > 0 && walkTH < 1) {
                    let stepJitter = Math.sin(ropeTime * 12) * 5;
                    climberX -= crisis * 15 + crisis * stepJitter; 
                    
                    let walkSpeed = 15 * (1 - crisis * 0.6);
                    wobbleBob = Math.abs(Math.sin(ropeTime * walkSpeed)) * 3;
                    poleAngle += crisis * Math.sin(ropeTime * 8) * 0.4; 
                }

                const isWalking = walkTH > 0 && walkTH < 1;
                const tightropeStyle = baseStyle === 'construction' ? 'acrobat' : baseStyle;
                
                let pose = { 
                   leg: 0,
                   body: isWalking ? crisis * Math.sin(ropeTime * 8) * 0.15 : 0 
                };
                
                this.drawTinyWorker(ctx, climberX, climberY, wobbleBob, (isWalking ? ropeTime : climbingTime), 'none', tightropeStyle, false, pose);

                if (showBalance) {
                    ctx.save();
                    ctx.translate(climberX, climberY - 18 - wobbleBob);
                    ctx.rotate(poleAngle);
                    ctx.strokeStyle = "#64748b"; 
                    ctx.lineWidth = 2.5;
                    ctx.beginPath(); ctx.moveTo(-45, 0); ctx.lineTo(45, 0); ctx.stroke();
                    ctx.fillStyle = "#0f172a";
                    ctx.beginPath(); ctx.arc(-45, 0, 3, 0, Math.PI*2); ctx.fill();
                    ctx.beginPath(); ctx.arc(45, 0, 3, 0, Math.PI*2); ctx.fill();
                    ctx.restore();
                }

                if (climbTH >= 1) {
                    const popTime = ropeTime - (ropeWalkDuration + ropeSetupDuration + climbDurationH);
                    const scale = Math.min(1, popTime * 4) + (Math.sin(popTime * 10) * 0.2 * Math.max(0, 1 - popTime * 2));
                    if (scale > 0) {
                        const badgePoint = this.clampCanvasPoint(model.peakCanvasX + 60, model.peakCanvasY - 22, 30);
                        ctx.save();
                        ctx.translate(badgePoint.x, badgePoint.y);
                        ctx.scale(scale, scale);
                        ctx.fillStyle = "rgba(255,255,255,0.95)";
                        ctx.strokeStyle = "#0ea5e9";
                        ctx.lineWidth = 2;
                        const text = this.inputs.unknownHmax ? `hₘₐₓ = ?` : `hₘₐₓ = ${(model.yPeak - model.yi).toFixed(1)} m`;
                        ctx.font = "bold 14px Inter, sans-serif";
                        const tw = ctx.measureText(text).width;
                        this.roundRectPath(ctx, -tw/2 - 10, -12, tw + 20, 24, 6);
                        ctx.fill(); ctx.stroke();
                        ctx.fillStyle = "#0ea5e9";
                        ctx.textAlign = "center"; ctx.textBaseline = "middle";
                        ctx.fillText(text, 0, 1);
                        ctx.restore();
                    }
                }
            } else {
                // Ladder Sequence for Standard/Higher Landing
                const ladderStartDelay = 0.5;
                const ladderTime = Math.max(0, elapsed - ladderStartDelay);
                
                const walkTH = Math.min(1, Math.max(0, ladderTime / walkDurationH));
                const setupTH = Math.min(1, Math.max(0, (ladderTime - walkDurationH) / setupDurationH));
                const climbTH = Math.min(1, Math.max(0, (ladderTime - walkDurationH - setupDurationH) / climbDurationH));
                
                let stepXH = model.startX;
                if (isBuilding) {
                    stepXH = Math.max(model.endX - 50, model.startX + (model.endX - model.startX) * 0.5);
                }
                
                const peakGroundY = groundY;
                
                const truckHeight = 25; 
                const ladderBaseY = peakGroundY - (isBuilding ? truckHeight : 0);
                const ladderLength = Math.max(40, ladderBaseY - model.peakCanvasY + 10); 
                
                const walkStartX = model.startX - ladderLength - 80; 
                const walkEaseH = 1 - Math.pow(1 - walkTH, 3);
                const currentMoverX = walkStartX + (model.peakCanvasX - walkStartX) * walkEaseH;
                
                if (walkTH < 1) {
                    const isMovingL = walkTH > 0;
                    const walkBobL = isMovingL ? Math.abs(Math.sin(ladderTime * 20)) * 4 : 0;
                    
                    if (isBuilding) {
                        this.drawFiretruck(ctx, currentMoverX, peakGroundY, isMovingL ? ladderTime : 0);
                        this.drawLadder(ctx, currentMoverX, ladderBaseY, Math.PI / 2, ladderLength);
                    } else {
                        this.drawLadder(ctx, currentMoverX, peakGroundY - 26, Math.PI / 2, ladderLength);
                        this.drawTinyWorker(ctx, currentMoverX, peakGroundY, walkBobL, ladderTime, 'none', baseStyle); 
                        this.drawTinyWorker(ctx, currentMoverX + ladderLength, peakGroundY, walkBobL, ladderTime + 0.2, 'none', baseStyle); 
                    }
                    
                } else if (setupTH < 1) {
                    const setupEase = 1 - Math.pow(1 - setupTH, 2);
                    const ladderAngle = (1 - setupEase) * (Math.PI / 2);
                    
                    if (isBuilding) {
                        this.drawFiretruck(ctx, model.peakCanvasX, peakGroundY, 0);
                        this.drawLadder(ctx, model.peakCanvasX, ladderBaseY, ladderAngle, ladderLength);
                    } else {
                        this.drawLadder(ctx, model.peakCanvasX, peakGroundY, ladderAngle, ladderLength);
                        this.drawTinyWorker(ctx, model.peakCanvasX - 12, peakGroundY, 0, 0, 'none', baseStyle);
                        const w4X = (model.peakCanvasX + ladderLength) * (1 - setupEase) + (model.peakCanvasX + 12) * setupEase;
                        this.drawTinyWorker(ctx, w4X, peakGroundY, Math.abs(Math.sin(ladderTime * 25)) * 4, ladderTime, 'none', baseStyle);
                    }
                    
                } else {
                    if (isBuilding) {
                        this.drawFiretruck(ctx, model.peakCanvasX, peakGroundY, 0);
                        this.drawLadder(ctx, model.peakCanvasX, ladderBaseY, 0, ladderLength);
                    } else {
                        this.drawLadder(ctx, model.peakCanvasX, peakGroundY, 0, ladderLength);
                        this.drawTinyWorker(ctx, model.peakCanvasX - 12, peakGroundY, 0, 0, 'none', baseStyle);
                    }
                    
                    const climbEase = 1 - Math.pow(1 - climbTH, 2);
                    const climberY = ladderBaseY - (ladderBaseY - model.peakCanvasY) * climbEase;
                    const isClimbing = climbTH < 1;
                    const climbAnimTime = isClimbing ? ladderTime * 1.5 : 0; 
                    
                    const climberStyle = isBuilding ? 'fireman' : baseStyle;
                    this.drawTinyWorker(ctx, model.peakCanvasX, climberY, 0, climbAnimTime, 'none', climberStyle);
                    
                    if (climbTH >= 1) {
                        const popTime = ladderTime - (walkDurationH + setupDurationH + climbDurationH);
                        const scale = Math.min(1, popTime * 4) + (Math.sin(popTime * 10) * 0.2 * Math.max(0, 1 - popTime * 2));
                        
                        if (scale > 0) {
                            const badgePoint = this.clampCanvasPoint(model.peakCanvasX + 55, model.peakCanvasY - 22, 30);
                            ctx.save();
                            ctx.translate(badgePoint.x, badgePoint.y);
                            ctx.scale(scale, scale);
                            ctx.fillStyle = "rgba(255,255,255,0.95)";
                            ctx.strokeStyle = "#0ea5e9";
                            ctx.lineWidth = 2;
                            const text = this.inputs.unknownHmax ? `hₘₐₓ = ?` : `hₘₐₓ = ${(model.yPeak - model.yi).toFixed(1)} m`;
                            ctx.font = "bold 14px Inter, sans-serif";
                            const tw = ctx.measureText(text).width;
                            this.roundRectPath(ctx, -tw/2 - 10, -12, tw + 20, 24, 6);
                            ctx.fill(); ctx.stroke();
                            ctx.fillStyle = "#0ea5e9";
                            ctx.textAlign = "center"; ctx.textBaseline = "middle";
                            ctx.fillText(text, 0, 1);
                            ctx.restore();
                        }
                    }
                }
            }
        }

        ctx.restore();
    }

export function drawHoverVariableAnimation(ctx, model) {
        if (!this.hoveredValueKey) return;
        const parts = this.hoveredValueKey.split(':');
        if (parts.length < 2) return;
        const axis = parts[0], key = parts[1];
        
        // Use performance.now() to safely calculate elapsed seconds
        const elapsed = (performance.now() - this._hoverAnimStartMs) / 1000;

        ctx.save();
        ctx.globalAlpha = Math.min(1, elapsed * 5);
        switch (key) {
            case 'displacement':
            case 'hmax':
                ctx.globalAlpha = 1;
                runHoverAnimationGuard(this, `fun:${key}`, () => {
                    this.drawFunVariableAnimations(ctx, model, elapsed);
                });
                break;
            case 'v0':
                runHoverAnimationGuard(this, 'v0', () => {
                    this._hoverAnimV0(ctx, model, axis, elapsed);
                });
                break;
            case 'v':
                runHoverAnimationGuard(this, 'v', () => {
                    this._hoverAnimVFinal(ctx, model, axis, elapsed);
                });
                break;
            case 'a':
                runHoverAnimationGuard(this, 'a', () => {
                    this._hoverAnimAccel(ctx, model, axis, elapsed);
                });
                break;
            case 't':
                runHoverAnimationGuard(this, 't', () => {
                    this._hoverAnimTime(ctx, model, elapsed);
                });
                break;
        }
        ctx.restore();
    }
export function _drawHoverBadge(ctx, text, color, bgColor) {
        const pad = 10;
        ctx.font = 'bold 13px Inter, sans-serif';
        const tw = ctx.measureText(text).width;
        ctx.fillStyle = bgColor || 'rgba(255,255,255,0.96)';
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = color + '55';
        ctx.shadowBlur = 8;
        this.roundRectPath(ctx, -tw / 2 - pad, -10, tw + pad * 2, 20, 5);
        ctx.fill(); ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 0, 0);
    }
export function _hoverAnimDeltaX(ctx, model, elapsed) {
        const extT = this.easeInOut(this.clamp(elapsed / 0.5, 0, 1));
        const decay = Math.exp(-Math.max(0, elapsed - 0.5) * 3);
        const bounce = elapsed > 0.5 ? 1 + Math.sin((elapsed - 0.5) * 10) * 0.05 * decay : 1;
        const geometry = typeof this.getDisplacementGeometry === 'function'
            ? this.getDisplacementGeometry(model)
            : null;
        const lineY = geometry?.dx?.y1 ?? (model.endY - 28);
        const xStart = geometry?.dx?.x1 ?? model.startX;
        const xEnd = geometry?.dx?.x2 ?? model.endX;
        const midX = (xStart + xEnd) / 2;
        const halfW = ((xEnd - xStart) / 2) * extT;
        const x1 = midX - halfW, x2 = midX + halfW;

        ctx.save();
        ctx.strokeStyle = '#ea580c';
        ctx.fillStyle = '#ea580c';
        ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(x1, lineY); ctx.lineTo(x2, lineY); ctx.stroke();
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(xStart, lineY - 8); ctx.lineTo(xStart, lineY);
        ctx.moveTo(xEnd, lineY - 8); ctx.lineTo(xEnd, lineY);
        ctx.stroke();
        if (halfW > 8) {
            ctx.beginPath(); ctx.moveTo(x1, lineY); ctx.lineTo(x1 + 8, lineY - 4); ctx.lineTo(x1 + 8, lineY + 4); ctx.closePath(); ctx.fill();
            ctx.beginPath(); ctx.moveTo(x2, lineY); ctx.lineTo(x2 - 8, lineY - 4); ctx.lineTo(x2 - 8, lineY + 4); ctx.closePath(); ctx.fill();
        }
        ctx.restore();

        if (elapsed > 0.4) {
            const s = this.easeInOut(this.clamp((elapsed - 0.4) / 0.3, 0, 1)) * bounce;
            ctx.save();
            ctx.translate(midX, lineY - 18);
            ctx.scale(s, s);
            this._drawHoverBadge(ctx, `Δx = ${(model.range || 0).toFixed(1)} m`, '#ea580c', 'rgba(255,237,213,0.97)');
            ctx.restore();
        }
    }
export function _hoverAnimDeltaY(ctx, model, elapsed) {
        const extT = this.easeInOut(this.clamp(elapsed / 0.5, 0, 1));
        const geometry = typeof this.getDisplacementGeometry === 'function'
            ? this.getDisplacementGeometry(model)
            : null;
        const lineX = geometry?.dy?.x1 ?? (model.startX - 38);
        const topY = Math.min(geometry?.dy?.y1 ?? model.startY, geometry?.dy?.y2 ?? model.endY);
        const bottomY = Math.max(geometry?.dy?.y1 ?? model.startY, geometry?.dy?.y2 ?? model.endY);
        const midY = (topY + bottomY) / 2;
        const halfH = ((bottomY - topY) / 2) * extT;
        const y1 = midY - halfH, y2 = midY + halfH;

        ctx.save();
        ctx.strokeStyle = '#047857';
        ctx.fillStyle = '#047857';
        ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(lineX, y1); ctx.lineTo(lineX, y2); ctx.stroke();
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(lineX - 5, topY); ctx.lineTo(lineX + 5, topY);
        ctx.moveTo(lineX - 5, bottomY); ctx.lineTo(lineX + 5, bottomY);
        ctx.stroke();
        if (halfH > 8) {
            ctx.beginPath(); ctx.moveTo(lineX, y1); ctx.lineTo(lineX - 4, y1 + 8); ctx.lineTo(lineX + 4, y1 + 8); ctx.closePath(); ctx.fill();
            ctx.beginPath(); ctx.moveTo(lineX, y2); ctx.lineTo(lineX - 4, y2 - 8); ctx.lineTo(lineX + 4, y2 - 8); ctx.closePath(); ctx.fill();
        }
        ctx.restore();

        if (elapsed > 0.4) {
            const s = this.easeInOut(this.clamp((elapsed - 0.4) / 0.3, 0, 1));
            const dyM = (geometry?.dy?.value ?? (model.yf - model.yi)).toFixed(1);
            ctx.save();
            ctx.translate(lineX - 50, midY);
            ctx.scale(s, s);
            this._drawHoverBadge(ctx, `Δy = ${dyM} m`, '#047857', 'rgba(209,250,229,0.97)');
            ctx.restore();
        }
    }
export function _hoverAnimHmax(ctx, model, elapsed) {
        const peakX = model.xToCanvas(model.xPeak);
        const peakY = model.yToCanvas(model.yPeak);
        const popT = this.easeInOut(this.clamp(elapsed / 0.4, 0, 1));
        const decay = Math.exp(-Math.max(0, elapsed - 0.4) * 3);
        const bounce = elapsed > 0.4 ? 1 + Math.sin((elapsed - 0.4) * 12) * 0.12 * decay : 1;
        const scale = popT * bounce;
        const rayLen = 22 * popT;

        ctx.save();
        ctx.translate(peakX, peakY);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(Math.cos(angle) * 10, Math.sin(angle) * 10);
            ctx.lineTo(Math.cos(angle) * (10 + rayLen), Math.sin(angle) * (10 + rayLen));
            ctx.stroke();
        }
        ctx.scale(scale, scale);
        ctx.fillStyle = '#fbbf24';
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 2;
        ctx.shadowColor = 'rgba(245,158,11,0.5)';
        ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
            const angle = (i / 10) * Math.PI * 2 - Math.PI / 2;
            const r = i % 2 === 0 ? 9 : 4;
            if (i === 0) ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
            else ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
        }
        ctx.closePath(); ctx.fill();
        ctx.restore();

        if (elapsed > 0.35) {
            const s = this.easeInOut(this.clamp((elapsed - 0.35) / 0.3, 0, 1)) * bounce;
            const hmaxM = (model.yPeak - model.yi).toFixed(1);
            ctx.save();
            ctx.translate(peakX + 30, peakY - 16);
            ctx.scale(s, s);
            this._drawHoverBadge(ctx, `hₘₐₓ = ${hmaxM} m`, '#d97706', 'rgba(255,251,235,0.97)');
            ctx.restore();
        }
    }
export function _hoverAnimV0(ctx, model, axis, elapsed) {
        const drawT = this.easeInOut(this.clamp(elapsed / 0.4, 0, 1));
        const pulse = 1 + Math.sin(elapsed * 5) * 0.06;
        const sx = model.startX, sy = model.startY;

        if (axis === 'x') {
            const len = Math.min(90, Math.abs(model.vix) * 4) * drawT * pulse;
            const dir = model.vix >= 0 ? 1 : -1;
            ctx.save();
            ctx.translate(sx, sy);
            ctx.strokeStyle = '#2563eb';
            ctx.fillStyle = '#2563eb';
            ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(dir * len, 0); ctx.stroke();
            ctx.strokeStyle = 'rgba(37,99,235,0.28)';
            ctx.lineWidth = 1.5;
            for (let i = 1; i <= 3; i++) {
                ctx.beginPath();
                ctx.moveTo(-dir * i * 8, -3 + i);
                ctx.lineTo(-dir * i * 8 + dir * 12, -3 + i);
                ctx.stroke();
            }
            if (len > 10) {
                ctx.fillStyle = '#2563eb';
                ctx.beginPath();
                ctx.moveTo(dir * len, 0); ctx.lineTo(dir * (len - 9), -4); ctx.lineTo(dir * (len - 9), 4);
                ctx.closePath(); ctx.fill();
            }
            ctx.restore();
            if (elapsed > 0.35) {
                const s = this.easeInOut(this.clamp((elapsed - 0.35) / 0.3, 0, 1)) * pulse;
                ctx.save();
                ctx.translate(sx + dir * Math.min(90, Math.abs(model.vix) * 4) * 0.5, sy - 20);
                ctx.scale(s, s);
                this._drawHoverBadge(ctx, `v₀ₓ = ${model.vix.toFixed(1)} m/s`, '#2563eb', 'rgba(219,234,254,0.97)');
                ctx.restore();
            }
        } else {
            const len = Math.min(90, Math.abs(model.viy) * 4) * drawT * pulse;
            const dir = model.viy >= 0 ? -1 : 1;
            ctx.save();
            ctx.translate(sx, sy);
            ctx.strokeStyle = '#16a34a';
            ctx.fillStyle = '#16a34a';
            ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, dir * len); ctx.stroke();
            if (drawT > 0.6) {
                const sparkT = (drawT - 0.6) / 0.4;
                for (let i = 0; i < 4; i++) {
                    const angle = (i / 4) * Math.PI * 2;
                    const dist = 14 + sparkT * 10;
                    ctx.fillStyle = `rgba(22,163,74,${(1 - sparkT) * 0.8})`;
                    ctx.beginPath();
                    ctx.arc(Math.cos(angle) * dist, dir * len + Math.sin(angle) * dist, 2.5, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            if (len > 10) {
                ctx.fillStyle = '#16a34a';
                ctx.beginPath();
                ctx.moveTo(0, dir * len); ctx.lineTo(-4, dir * (len - 9)); ctx.lineTo(4, dir * (len - 9));
                ctx.closePath(); ctx.fill();
            }
            ctx.restore();
            if (elapsed > 0.35) {
                const s = this.easeInOut(this.clamp((elapsed - 0.35) / 0.3, 0, 1)) * pulse;
                ctx.save();
                ctx.translate(sx + 32, sy + dir * Math.min(90, Math.abs(model.viy) * 4) * 0.5);
                ctx.scale(s, s);
                this._drawHoverBadge(ctx, `v₀ᵧ = ${model.viy.toFixed(1)} m/s`, '#16a34a', 'rgba(220,252,231,0.97)');
                ctx.restore();
            }
        }
    }
export function _hoverAnimVFinal(ctx, model, axis, elapsed) {
        const policeX = model.endX + 55;
        const policeY = model.endY;
        const flip = true;
        const gunBaseX = policeX - 9;
        const gunBaseY = policeY - 27;

        // Arm sweeps from launch direction to landing lock-on
        const lockT = this.easeInOut(this.clamp(elapsed / 0.8, 0, 1));
        const targetAngle = Math.atan2(model.endY - gunBaseY, model.endX - gunBaseX);
        const startAngle = Math.atan2(model.startY - gunBaseY, model.startX - gunBaseX);
        const armAngle = startAngle + (targetAngle - startAngle) * lockT;

        if (model.scenarioType === 'Lower Landing / Cliff') {
            ctx.save();
            ctx.fillStyle = '#78350f';
            ctx.fillRect(policeX - 25, policeY - 2, 50, 6);
            ctx.restore();
        }

        this.drawTinyWorker(ctx, policeX, policeY, 0, 0, 'radar', 'police', flip, armAngle);

        ctx.save();
        for (let w = 0; w < 2; w++) {
            const waveT = ((elapsed * 2.8) + w * 0.5) % 1;
            ctx.strokeStyle = `rgba(239,68,68,${Math.max(0, 1 - waveT)})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(gunBaseX, gunBaseY, waveT * 85, armAngle - 0.28, armAngle + 0.28);
            ctx.stroke();
        }
        ctx.restore();

        if (elapsed > 0.5) {
            const s = this.easeInOut(this.clamp((elapsed - 0.5) / 0.35, 0, 1));
            const flash = elapsed > 1.2 && Math.floor(elapsed * 3) % 2;
            const badgeColor = flash ? '#ef4444' : '#1e3a8a';
            let text;
            if (axis === 'x') {
                text = this.inputs.unknownFinalVelocity ? 'vₓ = ?' : `vₓ = ${model.vix.toFixed(1)} m/s`;
            } else {
                const vy = model.viy - (model.g * model.tFlight);
                text = this.inputs.unknownFinalVelocity ? 'vᵧ = ?' : `vᵧ = ${vy.toFixed(1)} m/s`;
            }
            ctx.save();
            ctx.translate(policeX, policeY - 68);
            ctx.scale(s, s);
            this._drawHoverBadge(ctx, text, badgeColor, 'rgba(255,255,255,0.97)');
            ctx.restore();
        }
    }
export function _hoverAnimAccel(ctx, model, axis, elapsed) {
        if (axis === 'x') {
            const cx = (model.startX + model.endX) / 2;
            const cy = (Math.min(model.startY, model.endY) + Math.max(model.startY, model.endY)) / 2 - 10;
            const popT = this.easeInOut(this.clamp(elapsed / 0.4, 0, 1));
            ctx.save();
            ctx.translate(cx, cy);
            ctx.scale(popT, popT);
            const zPositions = [[-22, 0], [0, -9], [18, 3]];
            zPositions.forEach(([zx, zy], i) => {
                const floatY = zy - Math.sin(elapsed * 2 + i * 1.2) * 5;
                const localAlpha = 0.4 + 0.4 * Math.sin(elapsed * 2.5 + i);
                ctx.font = `bold ${12 + i * 2}px Inter, sans-serif`;
                ctx.fillStyle = `rgba(100,116,139,${localAlpha})`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('z', zx, floatY);
            });
            ctx.restore();
            if (elapsed > 0.3) {
                const s = this.easeInOut(this.clamp((elapsed - 0.3) / 0.3, 0, 1));
                ctx.save();
                ctx.translate(cx, cy - 30);
                ctx.scale(s, s);
                this._drawHoverBadge(ctx, 'aₓ = 0 m/s²', '#64748b', 'rgba(241,245,249,0.97)');
                ctx.restore();
            }
            return;
        }

        // ay = g: Newton & The Ghost Apples
        const groundY = model.endY;
        const newtonX = model.startX + (model.endX - model.startX) * 0.35;
        const trunkX = newtonX + 38;
        const trunkTopY = groundY - 75;
        const branchEndX = trunkX + 44;
        const branchY = trunkTopY + 12;

        ctx.save();
        
        // 1. Upgraded Tree Trunk (Bark gradient)
        const trunkGrad = ctx.createLinearGradient(trunkX - 4, 0, trunkX + 4, 0);
        trunkGrad.addColorStop(0, "#451a03");
        trunkGrad.addColorStop(0.5, "#92400e");
        trunkGrad.addColorStop(1, "#451a03");
        ctx.fillStyle = trunkGrad;
        ctx.fillRect(trunkX - 4, trunkTopY, 8, groundY - trunkTopY);
        
        // Branch
        ctx.strokeStyle = trunkGrad;
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(trunkX, trunkTopY + 8); ctx.lineTo(branchEndX, branchY); ctx.stroke();
        
        // 2. Upgraded Canopy (Radial gradients for volumetric leaves)
        const drawLeafCluster = (cx, cy, radius) => {
            const leafGrad = ctx.createRadialGradient(cx - radius*0.3, cy - radius*0.3, radius*0.1, cx, cy, radius);
            leafGrad.addColorStop(0, "#4ade80"); // Highlight
            leafGrad.addColorStop(0.6, "#16a34a"); // Midtone
            leafGrad.addColorStop(1, "#14532d"); // Shadow
            ctx.fillStyle = leafGrad;
            ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.fill();
        };
        drawLeafCluster(trunkX + 10, trunkTopY - 2, 22);
        drawLeafCluster(trunkX - 10, trunkTopY + 5, 18);
        drawLeafCluster(branchEndX - 8, branchY - 12, 16);
        ctx.restore();

        const period = 1.7;
        const loopT = (elapsed % period) / period;
        const fallHeight = groundY - branchY - 8;

        // Falling apples (motion trail)
        for (let i = 5; i >= 1; i--) {
            const gt = Math.max(0, loopT - i * 0.065);
            const gy = branchY + fallHeight * gt * gt;
            if (gy > groundY) continue;
            ctx.save();
            ctx.globalAlpha = (1 - i / 6) * 0.55;
            ctx.fillStyle = '#dc2626';
            ctx.beginPath(); ctx.arc(branchEndX, gy, Math.max(2, 5.5 - i * 0.5), 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }

        const appleY = branchY + fallHeight * loopT * loopT;
        if (appleY <= groundY) {
            ctx.save();
            // 3. Upgraded Apple (Highlight and shadow)
            const appleGrad = ctx.createRadialGradient(branchEndX - 2, appleY - 2, 1, branchEndX, appleY, 6.5);
            appleGrad.addColorStop(0, "#f87171"); // Shine
            appleGrad.addColorStop(0.7, "#dc2626"); // Red
            appleGrad.addColorStop(1, "#7f1d1d"); // Shadow
            ctx.fillStyle = appleGrad;
            ctx.beginPath(); ctx.arc(branchEndX, appleY, 6.5, 0, Math.PI * 2); ctx.fill();
            
            // Apple Stem
            ctx.strokeStyle = '#16a34a'; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(branchEndX, appleY - 6); ctx.lineTo(branchEndX + 4, appleY - 10); ctx.stroke();
            
            // Gravity Arrow
            ctx.strokeStyle = '#ea580c'; ctx.fillStyle = '#ea580c'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(branchEndX + 14, appleY); ctx.lineTo(branchEndX + 14, appleY + 20); ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(branchEndX + 14, appleY + 20);
            ctx.lineTo(branchEndX + 10, appleY + 12);
            ctx.lineTo(branchEndX + 18, appleY + 12);
            ctx.closePath(); ctx.fill();
            ctx.restore();
        }

        this.drawTinyWorker(ctx, newtonX, groundY, 0, 0, 'none', 'scientist');

        if (elapsed > 0.5) {
            const s = this.easeInOut(this.clamp((elapsed - 0.5) / 0.3, 0, 1));
            ctx.save();
            ctx.translate(newtonX - 60, groundY - 50);
            ctx.scale(s, s);
            this._drawHoverBadge(ctx, `g = ${model.g.toFixed(1)} m/s²↓`, '#ea580c', 'rgba(255,237,213,0.97)');
            ctx.restore();
        }
    }

    export function _hoverAnimTime(ctx, model, elapsed) {
        const tFlight = model.tFlight;
        const dropDuration = 0.55;
        const countDuration = Math.max(1.5, tFlight * 0.65);
        const phase2Start = dropDuration;
        const phase3Start = phase2Start + countDuration;
        const refRunDuration = 1.1;
        const phase4Start = phase3Start + refRunDuration;

        const jbX = (model.startX + model.endX) / 2;
        const jbW = 150;
        const jbH = 54;
        const jbTargetY = Math.min(model.startY, model.endY) - 65;
        const dropT = this.easeInOut(this.clamp(elapsed / dropDuration, 0, 1));
        const jbY = -jbH - 10 + (jbTargetY + jbH + 10) * dropT;

        const chainXL = jbX - jbW / 2 + 18;
        const chainXR = jbX + jbW / 2 - 18;
        
        // Upgraded chains (metallic look)
        ctx.save();
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(chainXL, 0); ctx.lineTo(chainXL, jbY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(chainXR, 0); ctx.lineTo(chainXR, jbY); ctx.stroke();
        for (let ly = 4; ly < jbY; ly += 9) {
            ctx.fillStyle = '#94a3b8'; // Lighter chain links
            ctx.beginPath(); ctx.ellipse(chainXL, ly, 3.5, 2.5, 0, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(chainXR, ly, 3.5, 2.5, 0, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();

        const isLocked = elapsed >= phase3Start;
        const flashOn = isLocked && Math.floor((elapsed - phase3Start) * 5) % 2 === 0;
        
        ctx.save();
        ctx.translate(jbX, jbY);
        
        // 1. Upgraded Jumbotron Metal Frame
        const frameGrad = ctx.createLinearGradient(0, -jbH / 2, 0, jbH / 2);
        frameGrad.addColorStop(0, "#64748b");
        frameGrad.addColorStop(0.5, "#1e293b");
        frameGrad.addColorStop(1, "#0f172a");
        ctx.fillStyle = frameGrad;
        ctx.strokeStyle = flashOn ? '#fbbf24' : '#020617';
        ctx.lineWidth = flashOn ? 3 : 2;
        ctx.shadowColor = flashOn ? 'rgba(251,191,36,0.7)' : 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = flashOn ? 14 : 8;
        if (ctx.roundRect) ctx.roundRect(-jbW / 2, -jbH / 2, jbW, jbH, 7);
        else ctx.fillRect(-jbW / 2, -jbH / 2, jbW, jbH);
        ctx.fill(); ctx.stroke();
        ctx.shadowBlur = 0; // Reset
        
        // 2. Upgraded Glowing Screen
        const screenGrad = ctx.createLinearGradient(0, -jbH / 2, 0, jbH / 2);
        screenGrad.addColorStop(0, "#020617");
        screenGrad.addColorStop(1, "#0f172a");
        ctx.fillStyle = screenGrad;
        if (ctx.roundRect) ctx.roundRect(-jbW / 2 + 7, -jbH / 2 + 7, jbW - 14, jbH - 14, 4);
        else ctx.fillRect(-jbW / 2 + 7, -jbH / 2 + 7, jbW - 14, jbH - 14);
        ctx.fill();
        // Inner screen glow
        ctx.shadowColor = flashOn ? "#f59e0b" : "#10b981";
        ctx.shadowBlur = 10;
        ctx.strokeStyle = "rgba(255,255,255,0.05)";
        ctx.lineWidth = 1;
        if (ctx.roundRect) ctx.roundRect(-jbW / 2 + 7, -jbH / 2 + 7, jbW - 14, jbH - 14, 4);
        ctx.stroke();
        ctx.shadowBlur = 0; // Reset
        
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('FLIGHT TIME', 0, -jbH / 2 + 16);
        let displayT;
        if (elapsed < phase2Start) {
            displayT = 0;
        } else if (elapsed < phase3Start) {
            displayT = ((elapsed - phase2Start) / countDuration) * tFlight;
        } else {
            displayT = tFlight;
        }
        
        // Digital Font Effect
        ctx.shadowColor = flashOn ? "#fbbf24" : "#4ade80";
        ctx.shadowBlur = 8;
        ctx.fillStyle = flashOn ? '#fef08a' : (isLocked ? '#fbbf24' : '#86efac');
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(displayT.toFixed(2) + ' s', 0, 8);
        ctx.restore();

        if (elapsed >= phase3Start) {
            const runT = this.easeInOut(this.clamp((elapsed - phase3Start) / refRunDuration, 0, 1));
            const refX = (model.endX + 180) + (model.endX + 28 - (model.endX + 180)) * runT;
            const refY = model.endY;
            const running = runT < 1;
            this.drawTinyWorker(ctx, refX, refY,
                running ? Math.abs(Math.sin(elapsed * 14)) * 5 : 0,
                running ? elapsed : 0, 'none', 'police', true);

            if (elapsed >= phase4Start) {
                const popT = this.easeInOut(this.clamp((elapsed - phase4Start) / 0.35, 0, 1));
                ctx.save();
                ctx.translate(model.endX + 20, refY - 62);
                ctx.scale(popT, popT);
                ctx.fillStyle = 'rgba(255,255,255,0.97)';
                ctx.strokeStyle = '#1e3a8a';
                ctx.lineWidth = 1.5;
                if (ctx.roundRect) ctx.roundRect(-22, -11, 52, 22, 5);
                else ctx.fillRect(-22, -11, 52, 22);
                ctx.fill(); ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(6, 11); ctx.lineTo(14, 20); ctx.lineTo(20, 11);
                ctx.closePath();
                ctx.fillStyle = 'rgba(255,255,255,0.97)'; ctx.fill();
                ctx.strokeStyle = '#1e3a8a'; ctx.stroke();
                ctx.fillStyle = '#1e3a8a';
                ctx.font = 'bold 9px Inter, sans-serif';
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText('TWEET!', 4, 0);
                ctx.restore();
            }
        }
    }

export function drawTinyWorker(ctx, x, y, bobOffset, time = 0, heldItem = 'tape', style = 'construction', flip = false, armAngle = null) {
        ctx.save();
        
        const isNavy = style === 'navy';
        const isFireman = style === 'fireman';
        const isSci = style === 'scientist';
        const isCop = style === 'police';
        const isClimber = style === 'climber';
        const isAcrobat = style === 'acrobat';

        const colors = {
            sleeve: isSci ? '#f8fafc' : (isCop ? '#1e3a8a' : (isNavy ? '#ffffff' : (isFireman ? '#d97706' : (isClimber ? '#10b981' : (isAcrobat ? '#ec4899' : '#eab308'))))),
            pants: isSci ? '#475569' : (isNavy ? '#ffffff' : (isFireman ? '#1e293b' : (isClimber ? '#6366f1' : (isAcrobat ? '#f8fafc' : '#0f172a')))),
            shoes: (isSci || isCop || isNavy || isFireman) ? '#0f172a' : '#3f271d',
            torso: isSci ? '#f8fafc' : (isCop ? '#1e3a8a' : (isNavy ? '#ffffff' : (isFireman ? '#d97706' : (isClimber ? '#10b981' : (isAcrobat ? '#ec4899' : '#eab308'))))),
            skin: '#fcd34d',
            hand: '#fcd34d',
            hair: isCop ? '#0f172a' : (isNavy || isFireman ? '#451a03' : '#e2e8f0')
        };
        
        if (isAcrobat) colors.shoes = '#fde047'; 
        if (isClimber) { colors.shoes = '#1e293b'; colors.hand = '#1e293b'; } // Climbing gloves

        // Helper: Creates a 3D cylindrical lighting effect over any base color
        const drawCylinderOverlay = (x1, x2) => {
            const grad = ctx.createLinearGradient(x1, 0, x2, 0);
            grad.addColorStop(0, "rgba(0,0,0,0.4)");    // Left shadow
            grad.addColorStop(0.3, "rgba(255,255,255,0.25)"); // Highlight
            grad.addColorStop(1, "rgba(0,0,0,0.15)");   // Right shadow
            ctx.fillStyle = grad;
            ctx.fill();
        };

        // Floor Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath(); 
        ctx.ellipse(x, y, 16, 5, 0, 0, Math.PI*2); 
        ctx.fill();

        ctx.translate(x, y - bobOffset); 
        if (flip) ctx.scale(-1, 1);

        let customArm = null;
        let legAng = 0;
        let bodyAng = 0;
        if (armAngle !== null && typeof armAngle === 'object') {
            customArm = armAngle.arm !== undefined ? armAngle.arm : null;
            legAng = armAngle.leg || 0;
            bodyAng = armAngle.body || 0;
        } else {
            customArm = armAngle;
        }

        const isWalking = time > 0;
        const swing = isWalking ? Math.sin(time * 20) : 0; 

        // --- Back Leg ---
        ctx.save();
        ctx.translate(-4, -12); ctx.rotate(swing * 0.5 + legAng); 
        ctx.fillStyle = colors.pants; ctx.beginPath(); ctx.fillRect(-3, 0, 6, 10); drawCylinderOverlay(-3, 3);
        ctx.fillStyle = colors.shoes; ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(-5, 8, 9, 4, 2); else ctx.fillRect(-5, 8, 9, 4); ctx.fill();
        ctx.fillStyle = "#000"; ctx.fillRect(-5, 11, 9, 1.5); // Shoe sole
        ctx.restore();

        // --- Front Leg ---
        ctx.save();
        ctx.translate(4, -12); ctx.rotate(-swing * 0.5 + legAng * 0.8); 
        ctx.fillStyle = colors.pants; ctx.beginPath(); ctx.fillRect(-3, 0, 6, 10); drawCylinderOverlay(-3, 3);
        ctx.fillStyle = colors.shoes; ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(-3, 8, 9, 4, 2); else ctx.fillRect(-3, 8, 9, 4); ctx.fill();
        ctx.fillStyle = "#000"; ctx.fillRect(-3, 11, 9, 1.5); // Shoe sole
        ctx.restore();

        // Setup Torso Anchor
        ctx.save();
        ctx.translate(0, -12);
        ctx.rotate(bodyAng);
        ctx.translate(0, 12);

        // --- Back Arm ---
        ctx.save();
        ctx.translate(-9, -27);
        ctx.rotate(-swing * 0.5); 
        ctx.fillStyle = colors.sleeve;
        ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(-3, -2, 6, 14, 3); else ctx.fillRect(-3, -2, 6, 14); ctx.fill(); drawCylinderOverlay(-3, 3);
        ctx.fillStyle = colors.hand; ctx.beginPath(); ctx.arc(0, 13, 3.5, 0, Math.PI*2); ctx.fill(); 
        ctx.restore();

        // --- Torso ---
        ctx.fillStyle = colors.torso; 
        ctx.beginPath(); 
        if (ctx.roundRect) ctx.roundRect(-11, -30, 22, 18, 3); else ctx.fillRect(-11, -30, 22, 18);
        ctx.fill();
        drawCylinderOverlay(-11, 11);

        // Role-Specific Torso Details
        if (isSci) {
            ctx.fillStyle = "rgba(0,0,0,0.1)"; ctx.fillRect(0, -30, 2, 18); // Coat flap shadow
            ctx.strokeStyle = "#cbd5e1"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(0, -12); ctx.stroke(); // Opening
            ctx.fillStyle = "#38bdf8"; ctx.beginPath(); ctx.moveTo(-3, -30); ctx.lineTo(3, -30); ctx.lineTo(0, -26); ctx.fill(); // Shirt
            ctx.fillStyle = "#ef4444"; ctx.beginPath(); ctx.moveTo(-1, -26); ctx.lineTo(1, -26); ctx.lineTo(0, -20); ctx.fill(); // Tie
            ctx.strokeStyle = "#cbd5e1"; ctx.strokeRect(4, -22, 5, 6); // Pocket
            ctx.fillStyle = "#0284c7"; ctx.fillRect(5, -24, 1, 3); ctx.fillStyle = "#dc2626"; ctx.fillRect(7, -24, 1, 3); // Pens
            ctx.fillStyle = "#fef08a"; ctx.fillRect(-6, -23, 4, 5); ctx.fillStyle = "#3b82f6"; ctx.fillRect(-6, -23, 4, 1.5); // ID Badge
        } else if (isCop) {
            ctx.fillStyle = '#eab308'; ctx.beginPath(); ctx.arc(-5, -22, 2.5, 0, Math.PI*2); ctx.fill(); // Badge
            ctx.fillStyle = '#0f172a'; ctx.fillRect(-11, -16, 22, 4); // Thick Belt
            ctx.fillStyle = '#facc15'; ctx.fillRect(-2, -16.5, 4, 5); // Buckle
            ctx.fillStyle = '#0f172a'; ctx.fillRect(-1, -15.5, 2, 3); // Buckle inner
            ctx.fillStyle = "#38bdf8"; ctx.beginPath(); ctx.moveTo(-3, -30); ctx.lineTo(3, -30); ctx.lineTo(0, -26); ctx.fill(); // Shirt opening
            ctx.fillStyle = "#0f172a"; ctx.beginPath(); ctx.moveTo(-1, -26); ctx.lineTo(1, -26); ctx.lineTo(0, -20); ctx.fill(); // Tie
        } else if (isNavy) {
            ctx.fillStyle = "#1e3a8a"; ctx.beginPath(); ctx.moveTo(-4, -30); ctx.lineTo(4, -30); ctx.lineTo(0, -23); ctx.fill(); // Collar
            ctx.strokeStyle = "#f8fafc"; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(-3, -30); ctx.lineTo(0, -24); ctx.lineTo(3, -30); ctx.stroke(); // Collar trim
            ctx.fillStyle = "#0f172a"; ctx.fillRect(-11, -15, 22, 3); // Belt
            ctx.fillStyle = "#facc15"; ctx.fillRect(-2, -15, 4, 3); // Buckle
        } else if (isFireman) {
            ctx.fillStyle = "#facc15"; ctx.fillRect(-11, -20, 22, 3); ctx.fillRect(-11, -26, 22, 3); // Neon stripes
            ctx.fillStyle = "#e2e8f0"; ctx.fillRect(-11, -19, 22, 1); ctx.fillRect(-11, -25, 22, 1); // Silver reflectors
            ctx.strokeStyle = "#000000"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(0, -12); ctx.stroke(); // Jacket zipper
        } else if (isClimber) {
            ctx.fillStyle = "#1e293b"; ctx.fillRect(-11, -16, 22, 4); ctx.fillRect(-7, -30, 3, 14); ctx.fillRect(4, -30, 3, 14); // Harness
            ctx.strokeStyle = "#eab308"; ctx.lineWidth = 2; ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(-2, -18, 4, 6, 2); else ctx.strokeRect(-2, -18, 4, 6); ctx.stroke(); // Carabiner
        } else if (isAcrobat) {
            ctx.fillStyle = "#fde047"; ctx.beginPath(); ctx.moveTo(-6, -30); ctx.lineTo(6, -30); ctx.lineTo(0, -20); ctx.fill(); // Leotard V-neck
        } else {
            // Default Construction
            ctx.fillStyle = "#cbd5e1"; ctx.fillRect(-11, -25, 22, 4); ctx.fillRect(-11, -17, 22, 4); // Grey stripes
            ctx.fillStyle = "#f8fafc"; ctx.fillRect(-11, -23.5, 22, 1); ctx.fillRect(-11, -15.5, 22, 1); // Reflective trim
            ctx.strokeStyle = "#ca8a04"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(0, -12); ctx.stroke(); // Vest zipper
            ctx.fillStyle = "#38bdf8"; ctx.beginPath(); ctx.moveTo(-4, -30); ctx.lineTo(4, -30); ctx.lineTo(0, -25); ctx.fill(); // Blue shirt underneath
        }

        // --- Head/Skin ---
        const skinGrad = ctx.createRadialGradient(-2, -37, 2, 0, -35, 8);
        skinGrad.addColorStop(0, "#fef08a"); // Highlight
        skinGrad.addColorStop(1, colors.skin); // Base skin
        ctx.fillStyle = skinGrad;
        ctx.beginPath(); ctx.arc(0, -35, 8, 0, Math.PI * 2); ctx.fill();

        // Role-Specific Head Details
        if (isSci) {
            ctx.strokeStyle = "#1e293b"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(-3, -36, 2.5, 0, Math.PI*2); ctx.arc(3, -36, 2.5, 0, Math.PI*2); ctx.moveTo(-0.5, -36); ctx.lineTo(0.5, -36); ctx.stroke(); // Goggles
            ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.beginPath(); ctx.arc(-3, -36, 2, 0, Math.PI*2); ctx.arc(3, -36, 2, 0, Math.PI*2); ctx.fill(); // Goggle glare
            ctx.fillStyle = colors.hair; ctx.beginPath(); ctx.arc(0, -32, 3, Math.PI, 0, false); ctx.fill(); // Mustache
            ctx.beginPath(); ctx.arc(-8, -35, 3.5, 0, Math.PI*2); ctx.arc(-9, -39, 4, 0, Math.PI*2); ctx.arc(8, -35, 3.5, 0, Math.PI*2); ctx.arc(9, -39, 4, 0, Math.PI*2); ctx.arc(-4, -41, 4.5, 0, Math.PI*2); ctx.arc(4, -41, 4.5, 0, Math.PI*2); ctx.arc(0, -43, 5, 0, Math.PI*2); ctx.fill(); // Crazy hair
        } else if (isCop) {
            ctx.fillStyle = '#0f172a'; ctx.beginPath(); ctx.arc(-3, -36, 2.5, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(3, -36, 2.5, 0, Math.PI*2); ctx.fill(); // Aviators
            ctx.strokeStyle = "#0f172a"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-0.5, -36); ctx.lineTo(0.5, -36); ctx.stroke();
            ctx.fillStyle = colors.hair; ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(-4, -33, 8, 2, 1); else ctx.fillRect(-4, -33, 8, 2); ctx.fill(); // Mustache
            const capGrad = ctx.createLinearGradient(0, -48, 0, -40); capGrad.addColorStop(0, "#3b82f6"); capGrad.addColorStop(1, "#1e3a8a"); // Hat gradient
            ctx.fillStyle = capGrad; ctx.beginPath(); ctx.arc(0, -40, 8, Math.PI, 0); ctx.fill();
            ctx.fillStyle = '#0f172a'; ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(-10, -41, 14, 2, 1); else ctx.fillRect(-10, -41, 14, 2); ctx.fill(); // Brim
            ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(-8, -41, 6, 1); // Brim shine
            ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.arc(0, -43, 2, 0, Math.PI*2); ctx.fill(); // Hat badge
        } else if (isClimber) {
            const helmGrad = ctx.createRadialGradient(-2, -43, 2, 0, -37, 9);
            helmGrad.addColorStop(0, "#fdba74"); helmGrad.addColorStop(1, "#ea580c"); // Orange hardhat
            ctx.fillStyle = helmGrad; ctx.beginPath(); ctx.arc(0, -37, 8.5, Math.PI, 0); ctx.fill();
            ctx.fillStyle = "#1e293b"; ctx.fillRect(-8.5, -40, 17, 2); // Helmet rim
            ctx.fillStyle = "#fde047"; ctx.beginPath(); ctx.arc(0, -39, 2.5, 0, Math.PI*2); ctx.fill(); // Headlamp
            ctx.fillStyle = "#cbd5e1"; ctx.fillRect(-4, -44, 2, 3); ctx.fillRect(2, -44, 2, 3); // Top ridges
            ctx.fillStyle = "#000"; ctx.beginPath(); ctx.arc(-3, -34, 1.5, 0, Math.PI*2); ctx.fill(); ctx.arc(3, -34, 1.5, 0, Math.PI*2); ctx.fill(); // Eyes
        } else if (isAcrobat) {
            ctx.fillStyle = "#0f172a"; ctx.beginPath(); ctx.moveTo(-8, -35); ctx.lineTo(8, -35); ctx.lineTo(0, -45); ctx.fill(); // Spandex headpiece
            ctx.fillStyle = "#fde047"; ctx.fillRect(-8, -38, 16, 2); // Headband
            ctx.fillStyle = "#000"; ctx.beginPath(); ctx.arc(-3, -34, 1.5, 0, Math.PI*2); ctx.fill(); ctx.arc(3, -34, 1.5, 0, Math.PI*2); ctx.fill(); // Eyes
            ctx.fillStyle = "#f472b6"; ctx.beginPath(); ctx.arc(-5, -32, 1.5, 0, Math.PI*2); ctx.fill(); ctx.arc(5, -32, 1.5, 0, Math.PI*2); ctx.fill(); // Blush cheeks
        } else {
            // Standard faces (Navy, Fireman, Construction)
            ctx.fillStyle = "#451a03"; ctx.beginPath(); ctx.arc(-3, -36, 1.5, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(3, -36, 1.5, 0, Math.PI*2); ctx.fill(); // Eyes
            if (!isNavy && !isFireman) { ctx.beginPath(); ctx.arc(0, -32, 3, 0, Math.PI, false); ctx.fill(); } // Generic mouth
            
            if (isNavy) {
                ctx.fillStyle = "#f8fafc"; ctx.beginPath(); ctx.moveTo(-6, -42); ctx.lineTo(6, -42); ctx.lineTo(8, -48); ctx.lineTo(-8, -48); ctx.closePath(); ctx.fill(); // Dixie cup hat
                ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(-8, -43, 16, 3, 1.5); else ctx.fillRect(-8, -43, 16, 3); ctx.fill(); 
                ctx.strokeStyle = "#1d4ed8"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-6, -45); ctx.lineTo(6, -45); ctx.stroke(); // Blue hat line
            } else if (isFireman) {
                const helmGrad = ctx.createRadialGradient(-2, -45, 2, 0, -40, 8);
                helmGrad.addColorStop(0, "#f87171"); helmGrad.addColorStop(1, "#b91c1c"); // Red fire helmet
                ctx.fillStyle = helmGrad; ctx.beginPath(); ctx.arc(0, -40, 8, Math.PI, 0); ctx.fill(); 
                ctx.fillStyle = "#0f172a"; ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(-12, -41, 26, 3, 1.5); else ctx.fillRect(-12, -41, 26, 3); ctx.fill(); // Rim
                ctx.fillStyle = "#facc15"; ctx.beginPath(); ctx.arc(4, -42, 3, 0, Math.PI*2); ctx.fill(); // Badge
            } else {
                const helmGrad = ctx.createRadialGradient(-2, -45, 2, 0, -40, 9);
                helmGrad.addColorStop(0, "#fef08a"); helmGrad.addColorStop(1, "#d97706"); // Yellow construction hat
                ctx.fillStyle = helmGrad; ctx.beginPath(); ctx.arc(0, -40, 9, Math.PI, 0); ctx.fill(); 
                ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(-12, -42, 24, 3, 1.5); else ctx.fillRect(-12, -42, 24, 3); ctx.fill(); // Rim
                ctx.fillStyle = "#f59e0b"; ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(-2, -50, 4, 10, 2); else ctx.fillRect(-2, -50, 4, 10); ctx.fill(); // Top ridge
            }
        }

        // --- Front Arm ---
        ctx.save();
        ctx.translate(9, -27);
        if (customArm !== null) {
            ctx.rotate(customArm);
        } else {
            ctx.rotate(swing * 0.3 - 0.2); 
        }
        ctx.fillStyle = colors.sleeve;
        ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(-3, -2, 6, 14, 3); else ctx.fillRect(-3, -2, 6, 14); ctx.fill(); drawCylinderOverlay(-3, 3);
        ctx.fillStyle = colors.hand; ctx.beginPath(); ctx.arc(0, 13, 3.5, 0, Math.PI*2); ctx.fill(); 
        
        // --- Held Items ---
        if (heldItem === 'tape') {
            ctx.fillStyle = "#f97316"; ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(-4, 9, 10, 10, 2); else ctx.fillRect(-4, 9, 10, 10); ctx.fill(); // Tape body
            ctx.fillStyle = "#cbd5e1"; ctx.beginPath(); ctx.arc(1, 14, 2.5, 0, Math.PI*2); ctx.fill(); // Metal hub
            ctx.fillStyle = "#fef08a"; ctx.fillRect(6, 12, 4, 2); // Yellow tape measure extending
        } else if (heldItem === 'radar') {
            ctx.fillStyle = "#334155"; ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(-2, 7, 8, 6, 1); else ctx.fillRect(-2, 7, 8, 6); ctx.fill(); // Gun body
            const barrelGrad = ctx.createLinearGradient(6, 8, 6, 12);
            barrelGrad.addColorStop(0, "#e2e8f0"); barrelGrad.addColorStop(1, "#475569");
            ctx.fillStyle = barrelGrad; ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(6, 8, 8, 4, 1); else ctx.fillRect(6, 8, 8, 4); ctx.fill(); // Silver barrel
            ctx.fillStyle = "#ef4444"; ctx.shadowColor = "#ef4444"; ctx.shadowBlur = 4; ctx.fillRect(-2, 8, 2, 4); ctx.shadowBlur = 0; // Red LED
        }
        ctx.restore();

        ctx.restore(); 
        ctx.restore();
    }

const hoverAnimationMethods = {
    drawFunVariableAnimations,
    drawHoverVariableAnimation,
    _drawHoverBadge,
    _hoverAnimDeltaX,
    _hoverAnimDeltaY,
    _hoverAnimHmax,
    _hoverAnimV0,
    _hoverAnimVFinal,
    _hoverAnimAccel,
    _hoverAnimTime,
    drawTinyWorker
};

export default hoverAnimationMethods;
