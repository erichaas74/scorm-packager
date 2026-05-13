import React, { useState, useEffect, useRef } from 'react';

// --- Constants & Helpers ---
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;
const ORIGIN_X = 80;
const GROUND_Y = CANVAS_HEIGHT - 60; // Lifted slightly for the beach base

export default function App() {
    // --- State ---
    const [phase, setPhase] = useState('setup'); // 'setup', 'playing', 'guessing', 'finishing', 'done'
    const [setupStep, setSetupStep] = useState(5); // Default to 5 (Ready) to show full diagram immediately
    const [guess, setGuess] = useState(null);
    
    // Display Toggles
    const [showTrails, setShowTrails] = useState(true);
    const [showVectors, setShowVectors] = useState(true);
    const [showAnnotations, setShowAnnotations] = useState(true);

    // Physics parameters
    const [targetDist, setTargetDist] = useState(10);
    const [targetHeight, setTargetHeight] = useState(6.5);
    const [initialVelocity, setInitialVelocity] = useState(20);
    const [gravity, setGravity] = useState(9.8);

    // Refs for animation
    const canvasRef = useRef(null);
    const requestRef = useRef();
    const lastTimeRef = useRef();
    const timeRef = useRef(0);
    const phaseRef = useRef(phase);

    useEffect(() => {
        phaseRef.current = phase;
    }, [phase]);

    // --- Physics Calculations ---
    const getPhysicsData = () => {
        const D = targetDist;
        const H = targetHeight;
        const v0 = initialVelocity;
        const g = gravity;

        const angleRad = Math.atan2(H, D);
        const angleDeg = (angleRad * 180 / Math.PI);
        const v0x = v0 * Math.cos(angleRad);
        const v0y = v0 * Math.sin(angleRad);

        // Time to reach the X coordinate of the monkey
        const tCollision = D / v0x;
        
        // Height at collision time
        const yAtCollision = H - (0.5 * g * Math.pow(tCollision, 2));
        const isGroundHit = yAtCollision <= 0;
        
        // If it hits the ground before reaching the monkey
        const tGround = Math.sqrt((2 * H) / g);
        const finalTime = isGroundHit ? Math.min(tCollision, tGround) : tCollision;

        // Dynamic Scale
        const scaleX = 600 / Math.max(D, 1);
        const scaleY = 350 / Math.max(H, 1);
        const SCALE = Math.max(5, Math.min(60, Math.min(scaleX, scaleY))); 

        return { D, H, v0, g, angleRad, angleDeg, v0x, v0y, tCollision, finalTime, isGroundHit, yAtCollision, SCALE };
    };

    // --- Canvas Drawing Helpers ---
    const drawArrow = (ctx, fromX, fromY, toX, toY, color, width = 2, doubleEnded = false) => {
        const headlen = 10;
        const angle = Math.atan2(toY - fromY, toX - fromX);
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        
        ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(toX, toY);
        ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
        
        if (doubleEnded) {
            ctx.moveTo(fromX, fromY);
            ctx.lineTo(fromX + headlen * Math.cos(angle - Math.PI / 6), fromY + headlen * Math.sin(angle - Math.PI / 6));
            ctx.moveTo(fromX, fromY);
            ctx.lineTo(fromX + headlen * Math.cos(angle + Math.PI / 6), fromY + headlen * Math.sin(angle + Math.PI / 6));
        }

        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.stroke();
    };

    const drawBeachScenery = (ctx) => {
        const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
        skyGrad.addColorStop(0, "#38bdf8"); 
        skyGrad.addColorStop(1, "#e0f2fe"); 
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, CANVAS_WIDTH, GROUND_Y);

        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.beginPath();
        ctx.arc(200, 100, 30, 0, Math.PI*2);
        ctx.arc(240, 100, 40, 0, Math.PI*2);
        ctx.arc(280, 100, 30, 0, Math.PI*2);
        ctx.fill();

        const oceanGrad = ctx.createLinearGradient(0, GROUND_Y - 40, 0, GROUND_Y);
        oceanGrad.addColorStop(0, "#0891b2"); 
        oceanGrad.addColorStop(1, "#22d3ee"); 
        ctx.fillStyle = oceanGrad;
        ctx.fillRect(0, GROUND_Y - 40, CANVAS_WIDTH, 40);

        ctx.fillStyle = "#fde047"; 
        ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);
        
        ctx.fillStyle = "#fef08a"; 
        ctx.beginPath();
        ctx.ellipse(CANVAS_WIDTH/2, GROUND_Y, CANVAS_WIDTH/1.5, 20, 0, 0, Math.PI * 2);
        ctx.fill();
    };

    const drawPalmTree = (ctx, x, baseY, targetHeightCanvas) => {
        ctx.save();
        ctx.fillStyle = "#92400e"; 
        ctx.beginPath();
        ctx.moveTo(x + 15, baseY);
        ctx.quadraticCurveTo(x + 5, baseY - 50, x - 5, targetHeightCanvas);
        ctx.lineTo(x - 15, targetHeightCanvas);
        ctx.quadraticCurveTo(x - 5, baseY - 50, x - 15, baseY);
        ctx.fill();

        ctx.strokeStyle = "#78350f";
        ctx.lineWidth = 2;
        for(let py = baseY - 20; py > targetHeightCanvas + 10; py -= 15) {
            ctx.beginPath();
            const offset = (baseY - py) * 0.05;
            ctx.moveTo(x - 12 + offset, py);
            ctx.lineTo(x + 10 - offset, py + 3);
            ctx.stroke();
        }

        ctx.fillStyle = "#4ade80"; 
        ctx.strokeStyle = "#166534"; 
        ctx.lineWidth = 1;

        const drawFrond = (angle, length, droop) => {
            ctx.save();
            ctx.translate(x - 10, targetHeightCanvas);
            ctx.rotate(angle);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(length/2, -droop, length, 0);
            ctx.quadraticCurveTo(length/2, droop/2, 0, 0);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        };

        drawFrond(-Math.PI/8, 140, 40); drawFrond(Math.PI/10, 160, 50);
        drawFrond(Math.PI/4, 130, 40); drawFrond(Math.PI - Math.PI/8, 150, 40);
        drawFrond(Math.PI + Math.PI/10, 140, 50); drawFrond(Math.PI + Math.PI/4, 110, 30);
        ctx.restore();
    };

    const drawPirateCannon = (ctx, x, y, angle) => {
        ctx.save();
        ctx.translate(x, y);

        ctx.save();
        ctx.rotate(-angle);
        ctx.fillStyle = "#334155"; 
        ctx.beginPath(); ctx.moveTo(-15, -8); ctx.lineTo(45, -6); ctx.lineTo(45, 6); ctx.lineTo(-15, 8); ctx.fill();
        ctx.beginPath(); ctx.moveTo(45, -6); ctx.lineTo(55, -12); ctx.lineTo(55, 12); ctx.lineTo(45, 6); ctx.fill();
        ctx.beginPath(); ctx.arc(-15, 0, 8, Math.PI/2, Math.PI*1.5); ctx.fill();
        ctx.restore();

        const drawWheel = (wx, wy, radius) => {
            ctx.fillStyle = "#451a03"; ctx.beginPath(); ctx.arc(wx, wy, radius, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = "#b45309"; ctx.beginPath(); ctx.arc(wx, wy, radius - 3, 0, Math.PI*2); ctx.fill();
            ctx.lineWidth = 3; ctx.strokeStyle = "#451a03";
            for(let i=0; i<8; i++) {
                ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(wx + (radius-3)*Math.cos(i*Math.PI/4), wy + (radius-3)*Math.sin(i*Math.PI/4)); ctx.stroke();
            }
            ctx.fillStyle = "#fcd34d"; ctx.beginPath(); ctx.arc(wx, wy, radius/4, 0, Math.PI*2); ctx.fill();
        };

        drawWheel(-25, 12, 10); 
        drawWheel(-5, 8, 16);  
        ctx.restore();
    };

    const drawMonkey = (ctx, x, y) => {
        ctx.save();
        ctx.translate(x, y);
        
        ctx.beginPath(); ctx.moveTo(0, -10); ctx.quadraticCurveTo(15, -30, 5, -45);
        ctx.strokeStyle = "#8b4513"; ctx.lineWidth = 4; ctx.stroke();

        ctx.beginPath(); ctx.moveTo(-5, -2); ctx.lineTo(-10, -20); ctx.moveTo(5, -2); ctx.lineTo(10, -20);
        ctx.strokeStyle = "#8b4513"; ctx.stroke();

        ctx.fillStyle = "#a0522d"; ctx.beginPath(); ctx.ellipse(0, 10, 12, 16, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#f5deb3"; ctx.beginPath(); ctx.ellipse(0, 12, 7, 10, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#a0522d"; ctx.beginPath(); ctx.arc(0, -5, 12, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#f5deb3"; ctx.beginPath(); ctx.ellipse(0, -3, 9, 7, 0, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = "#000";
        ctx.beginPath(); ctx.arc(-3, -5, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(3, -5, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(0, 0, 3, 0.1, Math.PI - 0.1); ctx.stroke();

        ctx.restore();
    };

    // --- Core Render Loop ---
    const drawCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        const { D, H, v0, g, angleRad, angleDeg, v0x, v0y, tCollision, finalTime, SCALE } = getPhysicsData();
        const activeTime = timeRef.current;
        const isFinished = activeTime >= finalTime && phaseRef.current === 'done';

        // Mappings
        const projX = v0x * activeTime;
        const projY = (v0y * activeTime) - (0.5 * g * Math.pow(activeTime, 2));
        const targX = D;
        const targetY = H - (0.5 * g * Math.pow(activeTime, 2));

        const cProjX = ORIGIN_X + (projX * SCALE);
        const cProjY = GROUND_Y - (projY * SCALE);
        const cTargX = ORIGIN_X + (targX * SCALE);
        const cTargY = GROUND_Y - (targetY * SCALE);
        const cTargStartY = GROUND_Y - (H * SCALE);

        // 1. Environment
        drawBeachScenery(ctx);
        drawPalmTree(ctx, cTargX + 20, GROUND_Y + 10, cTargStartY);
        drawPirateCannon(ctx, ORIGIN_X, GROUND_Y - 5, angleRad);

        // 2. Step-by-Step Setup Annotations
        if (showAnnotations && phaseRef.current === 'setup') {
            ctx.font = "bold 20px sans-serif";
            
            // Scale vector visual length to exactly 1/3 of the distance to the monkey
            const canvasDistToMonkey = Math.hypot(cTargX - ORIGIN_X, (GROUND_Y - 5) - cTargStartY);
            const vScaleLen = canvasDistToMonkey / 3;
            
            const vxEnd = ORIGIN_X + Math.cos(angleRad) * vScaleLen;
            const vyEnd = (GROUND_Y - 5) - Math.sin(angleRad) * vScaleLen;

            // STEP 0: Show Distances
            if (setupStep >= 0) {
                // Horizontal (Red)
                const groundYLine = GROUND_Y + 25;
                drawArrow(ctx, ORIGIN_X, groundYLine, cTargX, groundYLine, "#ff0000", 3, true);
                ctx.fillStyle = "#ff0000";
                ctx.textAlign = "center";
                ctx.fillText(`${D}m`, ORIGIN_X + (cTargX - ORIGIN_X)/2, groundYLine + 22);

                // Vertical (Blue)
                drawArrow(ctx, cTargX, GROUND_Y, cTargX, cTargStartY, "#0000ff", 3, true);
                ctx.fillStyle = "#0000ff";
                ctx.textAlign = "left";
                ctx.fillText(`${H}m`, cTargX + 15, GROUND_Y - (GROUND_Y - cTargStartY)/2);
            }

            // STEP 1: Aiming Angle
            if (setupStep >= 1) {
                // Aim Line
                ctx.beginPath();
                ctx.moveTo(ORIGIN_X, GROUND_Y - 5);
                ctx.lineTo(cTargX, cTargStartY);
                ctx.strokeStyle = "rgba(255, 255, 255, 1)"; // White line like the image
                ctx.lineWidth = 2;
                ctx.stroke();

                // Angle Arc
                ctx.beginPath();
                ctx.arc(ORIGIN_X, GROUND_Y - 5, 45, -angleRad, 0);
                ctx.strokeStyle = "#000000";
                ctx.lineWidth = 2;
                ctx.stroke();

                // Angle Equation
                ctx.fillStyle = "#000000";
                ctx.textAlign = "left";
                ctx.font = "italic bold 22px sans-serif";
                ctx.fillText(`θ = ${Math.round(angleDeg)}`, ORIGIN_X + 55, GROUND_Y - 15);
            }

            // STEP 2: Velocity Components
            if (setupStep >= 2) {
                // Main Velocity Vector (Magenta)
                drawArrow(ctx, ORIGIN_X, GROUND_Y - 5, vxEnd, vyEnd, "#ff00ff", 4);
                
                // Vx Vector (Red) starting from cannon
                drawArrow(ctx, ORIGIN_X, GROUND_Y - 5, vxEnd, GROUND_Y - 5, "#ff0000", 4);
                
                // Vy Vector (Blue) starting from cannon
                drawArrow(ctx, ORIGIN_X, GROUND_Y - 5, ORIGIN_X, vyEnd, "#0000ff", 4);

                // Vx Text (Red Component Math)
                ctx.fillStyle = "#ff0000";
                ctx.textAlign = "center";
                ctx.font = "italic bold 20px sans-serif";
                ctx.fillText(`${v0} cos(${Math.round(angleDeg)}) = ${v0x.toFixed(1)} m/s`, (ORIGIN_X + vxEnd) / 2, GROUND_Y + 22);
                
                // Vy Text (Blue Component Math)
                ctx.fillStyle = "#0000ff";
                ctx.textAlign = "right";
                ctx.font = "italic bold 20px sans-serif";
                ctx.fillText(`${v0y.toFixed(1)}m/s`, ORIGIN_X - 8, (GROUND_Y - 5 + vyEnd) / 2);

                // V Text (Magenta main velocity)
                ctx.save();
                ctx.translate((ORIGIN_X + vxEnd) / 2, (GROUND_Y - 5 + vyEnd) / 2); // Rotate around midpoint
                ctx.rotate(-angleRad);
                ctx.fillStyle = "#ff00ff";
                ctx.textAlign = "center";
                ctx.fillText(`${v0} m/s`, 0, -10);
                ctx.restore();
            }

            // STEP 3: Time solving equation (Only show during step 3)
            if (setupStep === 3) {
                ctx.fillStyle = "#ff0000";
                ctx.textAlign = "left";
                ctx.font = "bold 32px sans-serif";
                
                const startY = 40;
                const lineH = 40;
                
                // Δx = v_ix Δt
                ctx.fillText(`Δx = v`, 20, startY);
                ctx.font = "bold 20px sans-serif";
                ctx.fillText(`ix`, 20 + ctx.measureText(`Δx = v`).width, startY + 8);
                ctx.font = "bold 32px sans-serif";
                ctx.fillText(` Δt`, 20 + ctx.measureText(`Δx = v`).width + 18, startY);
                
                // Step-by-step breakdown using dynamic values
                ctx.fillText(`${D} m = ${v0} cos(${Math.round(angleDeg)}) Δt`, 20, startY + lineH);
                ctx.fillText(`${D} m = ${v0x.toFixed(1)} Δt`, 20, startY + lineH * 2);
                ctx.fillText(`${D} / ${v0x.toFixed(1)} = Δt`, 20, startY + lineH * 3);
                ctx.fillText(`${tCollision.toFixed(1)}s = Δt`, 20, startY + lineH * 4);
            }

            // STEP 4: Position (Height) solving equation
            if (setupStep >= 4) {
                const tStr = tCollision.toFixed(1);
                const term1 = (v0y * tCollision).toFixed(1); // Equivalent to H
                const term2 = (4.9 * Math.pow(tCollision, 2)).toFixed(2); // The gravity drop

                ctx.fillStyle = "#000000";
                ctx.textAlign = "left";
                ctx.font = "bold 26px sans-serif";
                ctx.fillText(`Where will the cannonball be at ${tStr}s?`, 20, 35);

                ctx.fillStyle = "#0000ff";
                ctx.font = "bold 28px sans-serif";
                
                const startY = 80;
                const lineH = 35;
                
                // Δy = v_iy t + ½ (-9.8) t²
                ctx.fillText(`Δy = v`, 20, startY);
                ctx.font = "bold 16px sans-serif";
                ctx.fillText(`iy`, 20 + ctx.measureText(`Δy = v`).width, startY + 8);
                ctx.font = "bold 28px sans-serif";
                ctx.fillText(` ${tStr} + ½ (-9.8) (${tStr})²`, 20 + ctx.measureText(`Δy = v`).width + 16, startY);
                
                // Breakdown
                ctx.fillText(`Δy = ${v0}sin(${Math.round(angleDeg)}) (${tStr}) + ½ (-9.8) (${tStr})²`, 20, startY + lineH);
                ctx.fillText(`Δy = ${v0y.toFixed(1)} (${tStr}) - 4.9 (${tStr})²`, 20, startY + lineH * 2);
                ctx.fillText(`Δy = ${term1} - ${term2}`, 20, startY + lineH * 3);

                // Draw Light Blue Drop Box by the monkey
                ctx.fillStyle = "#bfdbfe"; // Light blue background
                ctx.fillRect(cTargX - 130, cTargStartY + 20, 110, 50);
                
                ctx.fillStyle = "#0000ff";
                ctx.textAlign = "center";
                ctx.font = "bold 24px sans-serif";
                ctx.fillText(`-${term2}m`, cTargX - 75, cTargStartY + 54);
            }
        }

        // 3. Motion Trails (During Flight)
        if (showTrails && activeTime > 0) {
            ctx.beginPath();
            ctx.moveTo(ORIGIN_X, GROUND_Y - 5);
            for(let t = 0; t <= activeTime; t += 0.05) {
                const px = v0x * t;
                const py = (v0y * t) - (0.5 * g * Math.pow(t, 2));
                ctx.lineTo(ORIGIN_X + (px * SCALE), GROUND_Y - 5 - (py * SCALE));
            }
            ctx.strokeStyle = "rgba(15, 23, 42, 0.4)";
            ctx.lineWidth = 3;
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // 4. Draw Actors
        if (projY >= -0.5 || phaseRef.current === 'done') {
            ctx.beginPath();
            ctx.arc(cProjX, cProjY, 8, 0, Math.PI * 2);
            ctx.fillStyle = "#1e293b"; 
            ctx.fill();
        }
        
        if (targetY >= -0.5 || phaseRef.current === 'done') {
            drawMonkey(ctx, cTargX, Math.min(cTargY, GROUND_Y));
        }

        // 5. Vectors during flight
        if (showVectors && !isFinished && activeTime > 0) {
            const currentVy = v0y - (g * activeTime);
            drawArrow(ctx, cProjX, cProjY, cProjX + v0x * 2, cProjY, "#10b981", 3); 
            drawArrow(ctx, cProjX, cProjY, cProjX, cProjY - currentVy * 2, "#ef4444", 3); 
        }

        // 6. Explosion Event
        if (phaseRef.current === 'done' && Math.abs(projX - targX) < (10/SCALE) && projY > 0 && Math.abs(projY - targetY) < (20/SCALE)) {
            ctx.beginPath();
            ctx.arc(cTargX, cTargY, 40, 0, Math.PI * 2);
            const boomGrad = ctx.createRadialGradient(cTargX, cTargY, 0, cTargX, cTargY, 40);
            boomGrad.addColorStop(0, "#ffffff"); boomGrad.addColorStop(0.3, "#fde047");
            boomGrad.addColorStop(0.7, "#ea580c"); boomGrad.addColorStop(1, "rgba(220, 38, 38, 0)");
            ctx.fillStyle = boomGrad; ctx.fill();
            
            ctx.fillStyle = "#ffffff";
            ctx.font = "900 24px sans-serif";
            ctx.strokeStyle = "#9a3412";
            ctx.lineWidth = 4;
            ctx.textAlign = "center";
            ctx.strokeText("POW!", cTargX, cTargY + 8);
            ctx.fillText("POW!", cTargX, cTargY + 8);
        }
    };

    // --- Animation Logic ---
    const animate = (time) => {
        if (phaseRef.current === 'playing' || phaseRef.current === 'finishing') {
            if (lastTimeRef.current !== undefined) {
                const dt = (time - lastTimeRef.current) / 1000;
                timeRef.current += dt;

                const { finalTime } = getPhysicsData();
                const pauseTime = finalTime * 0.55; 

                if (phaseRef.current === 'playing' && timeRef.current >= pauseTime) {
                    timeRef.current = pauseTime;
                    setPhase('guessing');
                } else if (phaseRef.current === 'finishing' && timeRef.current >= finalTime) {
                    timeRef.current = finalTime;
                    setPhase('done');
                }
            }
            lastTimeRef.current = time;
        } else {
            lastTimeRef.current = undefined; 
        }
        
        drawCanvas();
        requestRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, []);

    useEffect(() => {
        if (phase === 'setup') {
            timeRef.current = 0;
            drawCanvas();
        }
    }, [targetDist, targetHeight, initialVelocity, gravity, showTrails, showVectors, showAnnotations, phase, setupStep]);

    // --- Handlers ---
    const handleFire = () => {
        setGuess(null);
        timeRef.current = 0;
        setPhase('playing');
    };

    const handleReset = () => {
        timeRef.current = 0;
        setPhase('setup');
        setSetupStep(5);
        setGuess(null);
    };

    const nextStep = () => setSetupStep(prev => Math.min(prev + 1, 5));
    const prevStep = () => setSetupStep(prev => Math.max(prev - 1, 0));

    // --- Derived Data ---
    const pd = getPhysicsData();
    const hitMonkeyInAir = !pd.isGroundHit && pd.yAtCollision > 0;

    // --- Walkthrough Text ---
    const stepsData = [
        { title: "The Scenario", desc: "We want the cannonball to hit the monkey. We know the horizontal distance (X) and vertical height (Y)." },
        { title: "Aiming Angle (θ)", desc: "Using Trigonometry, we find the exact angle required to aim the cannon directly at the monkey using inverse tangent." },
        { title: "Velocity Components", desc: "The initial velocity is broken down into a horizontal (X) and vertical (Y) component using Cosine and Sine." },
        { title: "Time to Target", desc: "Because horizontal velocity is constant, we can solve for the exact time it takes the ball to cross the distance gap." },
        { title: "Vertical Position", desc: "Using the time we found, calculate the cannonball's vertical height. Notice it drops by exactly ½gt² from its aim point!" },
        { title: "Ready to Fire!", desc: "The math is complete. Both objects drop by exactly ½gt² simultaneously, guaranteeing a hit. Fire when ready!" }
    ];

    return (
        <div className="flex flex-col items-center min-h-screen bg-slate-100 p-6 font-sans text-slate-800">
            <header className="mb-6 text-center">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Zookeeper Monkey Problem</h1>
                <p className="text-slate-600 max-w-2xl">
                    Interactive visualization of projectile motion components and gravity's uniform effect.
                </p>
            </header>

            <div className="flex flex-col lg:flex-row gap-6 w-full max-w-6xl mb-6">
                {/* Canvas Container */}
                <div className="relative bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200" style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
                    <canvas 
                        ref={canvasRef} 
                        width={CANVAS_WIDTH} 
                        height={CANVAS_HEIGHT}
                        className="block"
                    />

                    {/* SETUP WALKTHROUGH OVERLAY */}
                    {phase === 'setup' && showAnnotations && (
                        <div className="absolute top-4 right-4 w-80 bg-white/95 backdrop-blur shadow-xl rounded-xl border border-slate-200 p-5 z-10 transition-all">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-bold text-lg text-slate-900">Step {setupStep + 1} of 6</h3>
                                <div className="flex space-x-1">
                                    {[0,1,2,3,4,5].map(i => (
                                        <div key={i} className={`w-2 h-2 rounded-full ${i <= setupStep ? 'bg-blue-600' : 'bg-slate-300'}`} />
                                    ))}
                                </div>
                            </div>
                            <h4 className="font-semibold text-blue-700 mb-2">{stepsData[setupStep].title}</h4>
                            <p className="text-sm text-slate-600 mb-5 min-h-[60px]">
                                {stepsData[setupStep].desc}
                            </p>
                            
                            <div className="flex justify-between items-center">
                                <button 
                                    onClick={prevStep} 
                                    disabled={setupStep === 0}
                                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${setupStep === 0 ? 'text-slate-400 bg-slate-100 cursor-not-allowed' : 'text-slate-700 bg-slate-200 hover:bg-slate-300'}`}
                                >
                                    Previous
                                </button>
                                
                                {setupStep < 5 ? (
                                    <button 
                                        onClick={nextStep} 
                                        className="px-4 py-1.5 rounded text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
                                    >
                                        Next
                                    </button>
                                ) : (
                                    <button 
                                        onClick={handleFire} 
                                        className="px-4 py-1.5 rounded text-sm font-bold bg-amber-500 text-white hover:bg-amber-600 transition-colors shadow-sm animate-pulse"
                                    >
                                        FIRE!
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Guessing Modal Overlay */}
                    {phase === 'guessing' && (
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6 z-20">
                            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md text-center">
                                <h2 className="text-2xl font-bold text-slate-900 mb-2">Simulation Paused!</h2>
                                <p className="text-slate-600 mb-6">
                                    The cannon has fired and the monkey dropped at the exact same moment. Both are falling due to gravity. 
                                    <br/><br/><strong>Will the cannonball hit the monkey?</strong>
                                </p>
                                <div className="flex flex-col gap-3">
                                    <button onClick={() => { setGuess('hit'); setPhase('finishing'); }} className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg shadow">
                                        Yes, it will hit!
                                    </button>
                                    <button onClick={() => { setGuess('miss'); setPhase('finishing'); }} className="w-full py-3 px-4 bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-lg shadow">
                                        No, it will miss!
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Results Modal Overlay */}
                    {phase === 'done' && (
                        <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center p-6 z-20">
                            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg text-center border-t-4 border-blue-500">
                                <h2 className="text-2xl font-bold text-slate-900 mb-4">
                                    {hitMonkeyInAir ? "Direct Hit!" : "Hit the Ground!"}
                                </h2>
                                
                                {hitMonkeyInAir ? (
                                    <div className="text-slate-600 text-sm leading-relaxed mb-6">
                                        <p className="mb-2 text-lg font-bold">
                                            {guess === 'hit' ? <span className="text-emerald-600">Correct!</span> : <span className="text-rose-600">Incorrect!</span>}
                                        </p>
                                        <p>Because gravity accelerates <strong>all</strong> objects downward at exactly the same rate, it alters both trajectories identically. The cannonball drops away from the straight aim-line by exactly <code className="bg-slate-100 px-1 rounded font-bold">½gt² = {(0.5 * 9.8 * Math.pow(pd.tCollision, 2)).toFixed(2)}m</code>. The monkey drops from the tree by that exact same amount!</p>
                                    </div>
                                ) : (
                                    <p className="text-slate-600 text-sm leading-relaxed mb-6">
                                        The cannonball hit the ground before reaching the tree! Try increasing the <strong>Initial Velocity</strong>.
                                    </p>
                                )}

                                <button onClick={handleReset} className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-colors">
                                    Reset Experiment
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Control Panel */}
                <div className="flex-1 bg-white p-6 rounded-xl shadow-lg border border-slate-200 flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-bold border-b pb-2 mb-4">Variables</h3>
                        <div className="space-y-5">
                            <div>
                                <label className="flex justify-between text-sm font-medium text-slate-700 mb-1">
                                    Distance to Tree (X): <span className="text-red-600 font-bold">{targetDist} m</span>
                                </label>
                                <input type="range" min="5" max="50" value={targetDist} onChange={e => setTargetDist(Number(e.target.value))} disabled={phase !== 'setup'} className="w-full accent-blue-600" />
                            </div>
                            <div>
                                <label className="flex justify-between text-sm font-medium text-slate-700 mb-1">
                                    Monkey Height (Y): <span className="text-blue-600 font-bold">{targetHeight} m</span>
                                </label>
                                <input type="range" min="2" max="30" step="0.5" value={targetHeight} onChange={e => setTargetHeight(Number(e.target.value))} disabled={phase !== 'setup'} className="w-full accent-blue-600" />
                            </div>
                            <div>
                                <label className="flex justify-between text-sm font-medium text-slate-700 mb-1">
                                    Cannon Velocity (v): <span className="text-fuchsia-600 font-bold">{initialVelocity} m/s</span>
                                </label>
                                <input type="range" min="10" max="60" value={initialVelocity} onChange={e => setInitialVelocity(Number(e.target.value))} disabled={phase !== 'setup'} className="w-full accent-blue-600" />
                            </div>
                        </div>

                        <h3 className="text-lg font-bold border-b pb-2 mt-8 mb-4">Display Toggles</h3>
                        <div className="space-y-3">
                            <label className="flex items-center space-x-3 text-sm text-slate-700 cursor-pointer">
                                <input type="checkbox" checked={showAnnotations} onChange={e => setShowAnnotations(e.target.checked)} className="rounded text-blue-600 w-4 h-4" disabled={phase !== 'setup'} />
                                <span>Show Interactive Walkthrough (Setup Phase)</span>
                            </label>
                            <label className="flex items-center space-x-3 text-sm text-slate-700 cursor-pointer">
                                <input type="checkbox" checked={showVectors} onChange={e => setShowVectors(e.target.checked)} className="rounded text-blue-600 w-4 h-4" />
                                <span>Show Velocity Components (In-Flight)</span>
                            </label>
                        </div>
                    </div>

                    <div className="pt-4 mt-6">
                        <button 
                            onClick={handleFire}
                            disabled={phase !== 'setup'}
                            className={`w-full py-4 rounded-xl font-bold text-lg shadow-md transition-all ${
                                phase === 'setup' ? 'bg-amber-500 hover:bg-amber-400 text-white hover:-translate-y-1' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            }`}
                        >
                            🔥 FIRE CANNON
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}