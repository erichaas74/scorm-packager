import SimulationGifMaker from '../core/SimulationGifMaker.js';

export default class UnitConversion extends SimulationGifMaker {
    constructor(canvasId) {
        super(canvasId, { duration: 12, fps: 30 }); 
        
        // Base layout sizes
        this.cardY = 120;
        this.resultY = 270;
        this.cardW = 120;
        this.cardH = 90;
        this.signW = 30;
    }

    init() {
        const unitOptions = ["miles", "km", "meters", "feet", "in", "cm", "hr", "min", "sec", "days", "kg", "g", "lbs", "oz", "1"];

        this.setupInputs('controls', {
            "Problem Setup": {
                numSteps: { label: "Conversion Steps (2-5)", type: "select", options: ["2", "3", "4", "5"], value: "3" },
                initialValue: { label: "Starting Value", type: "number", value: 12, step: 1 },
                startNum: { label: "Start Unit (Top)", type: "select", options: unitOptions, value: "miles" },
                startDen: { label: "Start Unit (Bottom)", type: "select", options: unitOptions, value: "hr" },
                endNum: { label: "Target Unit (Top)", type: "select", options: unitOptions, value: "meters" },
                endDen: { label: "Target Unit (Bottom)", type: "select", options: unitOptions, value: "sec" }
            },
            "Step 1 Conversion": {
                s1NumVal: { label: "Top Value", type: "number", value: 1609, step: 1 },
                s1NumUnit: { label: "Top Unit", type: "select", options: unitOptions, value: "meters" },
                s1DenVal: { label: "Bottom Value", type: "number", value: 1, step: 1 },
                s1DenUnit: { label: "Bottom Unit", type: "select", options: unitOptions, value: "miles" }
            },
            "Step 2 Conversion": {
                s2NumVal: { label: "Top Value", type: "number", value: 1, step: 1 },
                s2NumUnit: { label: "Top Unit", type: "select", options: unitOptions, value: "hr" },
                s2DenVal: { label: "Bottom Value", type: "number", value: 60, step: 1 },
                s2DenUnit: { label: "Bottom Unit", type: "select", options: unitOptions, value: "min" }
            },
            "Step 3 Conversion": {
                s3NumVal: { label: "Top Value", type: "number", value: 1, step: 1 },
                s3NumUnit: { label: "Top Unit", type: "select", options: unitOptions, value: "min" },
                s3DenVal: { label: "Bottom Value", type: "number", value: 60, step: 1 },
                s3DenUnit: { label: "Bottom Unit", type: "select", options: unitOptions, value: "sec" }
            },
            "Step 4 Conversion": {
                s4NumVal: { label: "Top Value", type: "number", value: 1, step: 1 },
                s4NumUnit: { label: "Top Unit", type: "select", options: unitOptions, value: "1" },
                s4DenVal: { label: "Bottom Value", type: "number", value: 1, step: 1 },
                s4DenUnit: { label: "Bottom Unit", type: "select", options: unitOptions, value: "1" }
            },
            "Step 5 Conversion": {
                s5NumVal: { label: "Top Value", type: "number", value: 1, step: 1 },
                s5NumUnit: { label: "Top Unit", type: "select", options: unitOptions, value: "1" },
                s5DenVal: { label: "Bottom Value", type: "number", value: 1, step: 1 },
                s5DenUnit: { label: "Bottom Unit", type: "select", options: unitOptions, value: "1" }
            },
            "Display Settings": {
                simulateTime: { label: "Animation Duration (s)", type: "number", value: 12, step: 1 },
                sigFigs: { label: "Significant Figures", type: "number", value: 3, step: 1 },
                showTimerDisplay: { label: "Show Canvas Timer", type: "checkbox", value: true }
            }
        });
        
        this.config.duration = this.inputs.simulateTime;
        this.drawPreview();
    }

    smoothStep(time, min, max) {
        if (time <= min) return 0;
        if (time >= max) return 1;
        const t = (time - min) / (max - min);
        return t * t * (3 - 2 * t); 
    }

    measureRichText(ctx, textStr) {
        const parts = textStr.split(/(\[.*?\])/g);
        let totalW = 0;
        
        parts.forEach(part => {
            if (part.startsWith('[')) {
                ctx.font = "bold 12px Inter, sans-serif";
                totalW += ctx.measureText(part.slice(1, -1)).width + 18; 
            } else {
                ctx.font = "bold 16px Inter, sans-serif";
                totalW += ctx.measureText(part).width;
            }
        });
        return totalW;
    }
    
    drawPillTerm(ctx, x, y, numStr, unitStr, theme, isCanceled) {
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        
        ctx.font = "bold 18px Inter, sans-serif";
        const numW = ctx.measureText(numStr).width;
        
        let pillW = 0;
        let totalW = numW;
        
        // Hide pill if unit is "1" (unitless)
        if (unitStr !== "1") {
            ctx.font = "bold 13px Inter, sans-serif";
            pillW = ctx.measureText(unitStr).width + 16;
            totalW += 6 + pillW;
        }
        
        const startX = x - (totalW / 2);
        
        // Number
        ctx.fillStyle = "#1e293b";
        ctx.font = "bold 18px Inter, sans-serif";
        ctx.fillText(numStr, startX, y);

        // Unit Pill
        if (unitStr !== "1") {
            const pillX = startX + numW + 6;
            const isBlue = theme === 'blue';
            
            ctx.fillStyle = isBlue ? "#eff6ff" : "#fff7ed"; 
            ctx.strokeStyle = isBlue ? "#bfdbfe" : "#ffedd5"; 
            
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(pillX, y - 11, pillW, 22, 6);
            else ctx.rect(pillX, y - 11, pillW, 22);
            ctx.fill();
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.fillStyle = isBlue ? "#1d4ed8" : "#c2410c"; 
            ctx.font = "bold 13px Inter, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(unitStr, pillX + (pillW / 2), y);

            // Red Cancellation Strike
            if (isCanceled) {
                ctx.beginPath();
                ctx.moveTo(pillX - 2, y + 6);
                ctx.lineTo(pillX + pillW + 2, y - 6);
                ctx.strokeStyle = "#ef4444"; 
                ctx.lineWidth = 3;
                ctx.lineCap = "round";
                ctx.stroke();
                
                ctx.fillStyle = "rgba(239, 68, 68, 0.1)";
                ctx.beginPath();
                if (ctx.roundRect) ctx.roundRect(pillX, y - 11, pillW, 22, 6);
                else ctx.rect(pillX, y - 11, pillW, 22);
                ctx.fill();
            }
        }
    }

    drawFractionCard(ctx, cx, cy, data, opacity, highlight) {
        if (opacity <= 0) return;
        ctx.save();
        ctx.globalAlpha = opacity;

        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = highlight ? "#3b82f6" : "#e2e8f0";
        ctx.lineWidth = highlight ? 2 : 1;
        
        ctx.beginPath();
        if(ctx.roundRect) ctx.roundRect(cx - this.cardW/2, cy - this.cardH/2, this.cardW, this.cardH, 12);
        else ctx.rect(cx - this.cardW/2, cy - this.cardH/2, this.cardW, this.cardH);
        
        if (highlight) {
            ctx.shadowColor = "rgba(59, 130, 246, 0.3)";
            ctx.shadowBlur = 12;
            ctx.shadowOffsetY = 0;
        } else {
            ctx.shadowColor = "rgba(0, 0, 0, 0.05)";
            ctx.shadowBlur = 4;
            ctx.shadowOffsetY = 2;
        }
        
        ctx.fill(); 
        ctx.stroke();
        ctx.shadowBlur = 0; 
        ctx.shadowOffsetY = 0;
        ctx.shadowColor = "transparent";

        // Divider
        ctx.fillStyle = "#334155";
        ctx.fillRect(cx - (this.cardW/2 - 15), cy - 1, this.cardW - 30, 2);

        // Top Term
        this.drawPillTerm(ctx, cx, cy - 20, data.nVal.toString(), data.nUnit, data.nTheme, data.nCancel);
        // Bottom Term
        this.drawPillTerm(ctx, cx, cy + 20, data.dVal.toString(), data.dUnit, data.dTheme, data.dCancel);

        ctx.restore();
    }

    drawMultiplySign(ctx, x, y, opacity) {
        if (opacity <= 0) return;
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.fillStyle = "#64748b";
        ctx.font = "bold 24px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("×", x, y);
        ctx.restore();
    }

    drawConsolidatedResult(ctx, cx, cy, boxW, title, line1, line2, opacity) {
        if (opacity <= 0) return;
        ctx.save();
        ctx.globalAlpha = opacity;

        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#818cf8"; 
        ctx.lineWidth = 2;
        
        const boxH = 95;
        
        ctx.beginPath();
        if(ctx.roundRect) ctx.roundRect(cx - boxW/2, cy - boxH/2, boxW, boxH, 16);
        else ctx.rect(cx - boxW/2, cy - boxH/2, boxW, boxH);
        
        ctx.shadowColor = "rgba(99, 102, 241, 0.15)";
        ctx.shadowBlur = 15;
        ctx.shadowOffsetY = 4;
        ctx.fill(); 
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
        ctx.shadowColor = "transparent";

        ctx.fillStyle = "#818cf8";
        ctx.font = "bold 10px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(title.toUpperCase(), cx, cy - 32);

        const maxTextW = Math.max(this.measureRichText(ctx, line1), this.measureRichText(ctx, line2));
        ctx.fillStyle = "#334155";
        ctx.fillRect(cx - (maxTextW/2 + 5), cy + 5, maxTextW + 10, 2);

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        this.drawRichText(ctx, cx, cy - 12, line1);
        this.drawRichText(ctx, cx, cy + 22, line2);

        ctx.restore();
    }

    drawRichText(ctx, x, y, textStr) {
        const parts = textStr.split(/(\[.*?\])/g);
        let totalW = 0;
        
        parts.forEach(part => {
            if (part.startsWith('[')) {
                ctx.font = "bold 12px Inter, sans-serif";
                totalW += ctx.measureText(part.slice(1, -1)).width + 18; 
            } else {
                ctx.font = "bold 16px Inter, sans-serif";
                totalW += ctx.measureText(part).width;
            }
        });

        let currentX = x - (totalW / 2);
        
        parts.forEach(part => {
            if (part.startsWith('[')) {
                const unit = part.slice(1, -1);
                ctx.font = "bold 12px Inter, sans-serif";
                const uW = ctx.measureText(unit).width;
                const pW = uW + 12;
                
                ctx.fillStyle = "#eff6ff";
                ctx.strokeStyle = "#bfdbfe";
                ctx.beginPath();
                if(ctx.roundRect) ctx.roundRect(currentX + 3, y - 10, pW, 20, 6);
                else ctx.rect(currentX + 3, y - 10, pW, 20);
                ctx.fill(); ctx.stroke();
                
                ctx.fillStyle = "#3b82f6";
                ctx.textAlign = "center";
                ctx.fillText(unit, currentX + 3 + pW/2, y);
                currentX += pW + 6;
                ctx.textAlign = "left"; 
            } else {
                ctx.font = "bold 16px Inter, sans-serif";
                ctx.fillStyle = "#1e293b";
                ctx.textAlign = "left";
                ctx.fillText(part, currentX, y);
                currentX += ctx.measureText(part).width;
            }
        });
    }

    drawFinalAnswer(ctx, cx, cy, boxW, answerStr, numUnit, denUnit, opacity) {
        if (opacity <= 0) return;
        ctx.save();
        ctx.globalAlpha = opacity;

        const boxH = 95;
        
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#22c55e"; 
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        if(ctx.roundRect) ctx.roundRect(cx - boxW/2, cy - boxH/2, boxW, boxH, 16);
        else ctx.rect(cx - boxW/2, cy - boxH/2, boxW, boxH);
        
        ctx.shadowColor = "rgba(34, 197, 94, 0.2)";
        ctx.shadowBlur = 15;
        ctx.shadowOffsetY = 4;
        ctx.fill(); 
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
        ctx.shadowColor = "transparent";

        ctx.fillStyle = "#22c55e";
        ctx.font = "bold 10px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("FINAL ANSWER", cx, cy - 32);

        // Measure text content
        ctx.font = "bold 26px Inter, sans-serif";
        const ansW = ctx.measureText(answerStr).width;
        let totalContentW = ansW;
        let fractionW = 35;
        
        if (denUnit !== "1") {
            totalContentW += 10 + fractionW;
        } else if (numUnit !== "1") {
            ctx.font = "bold 14px Inter, sans-serif";
            totalContentW += 10 + ctx.measureText(numUnit).width;
        }
        
        let startX = cx - (totalContentW / 2);

        ctx.fillStyle = "#0f172a";
        ctx.font = "bold 26px Inter, sans-serif";
        ctx.textAlign = "left";
        
        if (denUnit === "1") {
            // Flat answer without fraction line
            ctx.fillText(answerStr, startX, cy + 5);
            ctx.font = "bold 14px Inter, sans-serif";
            ctx.fillStyle = "#3b82f6";
            if (numUnit !== "1") ctx.fillText(numUnit, startX + ansW + 10, cy + 5);
        } else {
            // Fractional Answer
            ctx.fillText(answerStr, startX, cy + 5);
            ctx.fillStyle = "#334155";
            ctx.fillRect(startX + ansW + 10, cy + 5, fractionW, 2);
            
            const getShortUnit = (u) => {
                const map = { "miles": "mi", "meters": "m", "feet": "ft", "sec": "s", "min": "m", "hr": "h", "days": "d", "km": "km", "in": "in", "cm": "cm" };
                return map[u] || u.substring(0, 2);
            };

            ctx.font = "bold 13px Inter, sans-serif";
            ctx.textAlign = "center";
            ctx.fillStyle = "#3b82f6";
            ctx.fillText(getShortUnit(numUnit), startX + ansW + 10 + fractionW/2, cy - 5);
            ctx.fillStyle = "#c2410c";
            ctx.fillText(getShortUnit(denUnit), startX + ansW + 10 + fractionW/2, cy + 17);
        }

        ctx.restore();
    }

    drawFrame(ctx, time) {
        this.config.duration = this.inputs.simulateTime;
        const D = this.inputs.simulateTime;
        const t = Math.min(time, D);
        const N = parseInt(this.inputs.numSteps);

        // --- 1. Gather & Process Data Steps Dynamically ---
        const cards = [];
        
        // Base Setup (Card 0)
        cards.push({
            nVal: this.inputs.initialValue, nUnit: this.inputs.startNum, 
            dVal: 1, dUnit: this.inputs.startDen,
            nCancelAt: Infinity, dCancelAt: Infinity,
            nTheme: 'blue', dTheme: 'orange'
        });

        // Conversion Cards 1 through N
        for (let i = 1; i <= N; i++) {
            cards.push({
                nVal: this.inputs[`s${i}NumVal`], nUnit: this.inputs[`s${i}NumUnit`],
                dVal: this.inputs[`s${i}DenVal`], dUnit: this.inputs[`s${i}DenUnit`],
                nCancelAt: Infinity, dCancelAt: Infinity,
                nTheme: 'blue', dTheme: 'orange' // Defaults, overriden by matcher
            });
        }

        // --- 2. Dynamic Animation Timings ---
        // Phase 1 (Step-by-step) takes ~65% of the total simulation time
        const phase1Duration = D * 0.65;
        const dt = phase1Duration / (N + 1); // <-- FIX: Divide by N + 1 to give the last step time to finish

        // --- 3. Dynamic Unit Cancellation Matcher ---
        for (let i = 1; i <= N; i++) {
            const cancelTime = i * dt + (dt * 0.6);
            
            // Check if top unit cancels a prior bottom unit
            for (let j = 0; j < i; j++) {
                if (cards[i].nUnit === cards[j].dUnit && cards[j].dCancelAt === Infinity && cards[i].nUnit !== "1") {
                    cards[i].nCancelAt = cancelTime;
                    cards[j].dCancelAt = cancelTime;
                    cards[i].nTheme = 'orange'; // Takes on the color of what it canceled
                    break;
                }
            }
            // Check if bottom unit cancels a prior top unit
            for (let j = 0; j < i; j++) {
                if (cards[i].dUnit === cards[j].nUnit && cards[j].nCancelAt === Infinity && cards[i].dUnit !== "1") {
                    cards[i].dCancelAt = cancelTime;
                    cards[j].nCancelAt = cancelTime;
                    cards[i].dTheme = 'blue'; // Takes on the color of what it canceled
                    break;
                }
            }
        }

        // --- 4. Background ---
        ctx.fillStyle = "#f1f5f9"; 
        ctx.fillRect(0, 0, this.width, this.height);

        ctx.fillStyle = "#1e293b";
        ctx.font = "bold 20px Inter, sans-serif";
        ctx.fillText("Dimensional Analysis Setup", 20, 35);
        
        ctx.fillStyle = "#64748b";
        ctx.font = "500 14px Inter, sans-serif";
        ctx.fillText(`Goal: Convert ${this.inputs.startNum}/${this.inputs.startDen} to ${this.inputs.endNum}/${this.inputs.endDen}`, 20, 60);

        // --- 5. Render Phase 1: Dynamic Card Scaling & Layout ---
        const totalW = (N + 1) * this.cardW + N * this.signW;
        // If it exceeds available width, compute a downscale factor
        const maxAvailableW = this.width - 40;
        const scaleFact = Math.min(1, maxAvailableW / totalW);
        
        ctx.save();
        ctx.translate(this.width / 2, this.cardY);
        ctx.scale(scaleFact, scaleFact);

        for (let i = 0; i <= N; i++) {
            const cx = -totalW / 2 + this.cardW / 2 + i * (this.cardW + this.signW);
            
            let op = 0, hi = false;
            if (i === 0) {
                op = this.smoothStep(t, 0, dt * 0.5);
            } else {
                op = this.smoothStep(t, i * dt, i * dt + dt * 0.4);
                hi = t > (i * dt + dt * 0.4) && t < (i * dt + dt * 0.9);
                
                // Draw multiply sign before the card
                const sx = -totalW / 2 + this.cardW + (i - 1) * (this.cardW + this.signW) + this.signW / 2;
                const opSign = this.smoothStep(t, i * dt - dt * 0.2, i * dt + dt * 0.2);
                this.drawMultiplySign(ctx, sx, 0, opSign);
            }

            const cData = cards[i];
            // Check timestamps for rendering red strike lines
            cData.nCancel = t >= cData.nCancelAt;
            cData.dCancel = t >= cData.dCancelAt;
            
            this.drawFractionCard(ctx, cx, 0, cData, op, hi);
        }
        ctx.restore();


        // --- 6. Render Phase 2: Consolidated Results ---
        const tBase = phase1Duration + (D * 0.05); // Start slightly after cards finish
        const rTime = (D - tBase) / 3; // Split remaining time into 3 steps
        
        const opRes1 = this.smoothStep(t, tBase, tBase + rTime * 0.5);
        const opRes2 = this.smoothStep(t, tBase + rTime, tBase + rTime * 1.5);
        const opRes3 = this.smoothStep(t, tBase + rTime * 2, tBase + rTime * 2.5);

        const rY = this.resultY;
        
        // Significant Figures Calculation
        let sf = parseInt(this.inputs.sigFigs);
        if (isNaN(sf) || sf < 1) sf = 3;

        // Clean formatter: applies sig figs but removes unnecessary scientific notation for simple integers
        const formatSF = (v) => v === 0 ? "0" : parseFloat(v.toPrecision(sf)).toString();

        // Compute Merge Strings
        let nums = [];
        if (cards[0].nVal !== 1) nums.push(cards[0].nVal);
        for(let i=1; i<=N; i++) if (cards[i].nVal !== 1) nums.push(cards[i].nVal);
        if (nums.length === 0) nums.push(1);
        let mNumStr = nums.join(" × ") + (this.inputs.endNum !== "1" ? ` [${this.inputs.endNum}]` : "");

        let dens = [];
        if (cards[0].dVal !== 1) dens.push(cards[0].dVal);
        for(let i=1; i<=N; i++) if (cards[i].dVal !== 1) dens.push(cards[i].dVal);
        if (dens.length === 0) dens.push(1);
        let mDenStr = dens.join(" × ") + (this.inputs.endDen !== "1" ? ` [${this.inputs.endDen}]` : "");

        // Measure widths to dynamically expand bounding boxes (Increased padding to +80 for longer strings)
        const box1W = Math.max(140, Math.max(this.measureRichText(ctx, mNumStr), this.measureRichText(ctx, mDenStr)) + 80);

        // Calculated Fractions
        const numCalc = nums.reduce((acc, val) => acc * val, 1);
        const denCalc = dens.reduce((acc, val) => acc * val, 1);
        
        // Apply Sig Figs to the intermediate Simplify box!
        let simpNumStr = `${formatSF(numCalc)}` + (this.inputs.endNum !== "1" ? ` [${this.inputs.endNum}]` : "");
        let simpDenStr = `${formatSF(denCalc)}` + (this.inputs.endDen !== "1" ? ` [${this.inputs.endDen}]` : "");
        const box2W = Math.max(140, Math.max(this.measureRichText(ctx, simpNumStr), this.measureRichText(ctx, simpDenStr)) + 80);

        // Apply Sig Figs to the Final Answer
        let finalAnsNum = (numCalc / denCalc);
        let finalAns = formatSF(finalAnsNum);

        ctx.font = "bold 26px Inter, sans-serif";
        let box3ContentW = ctx.measureText(finalAns).width;
        if (this.inputs.endDen !== "1") {
            box3ContentW += 10 + 35; // 35 for fraction
        } else if (this.inputs.endNum !== "1") {
            ctx.font = "bold 14px Inter, sans-serif";
            box3ContentW += 10 + ctx.measureText(this.inputs.endNum).width;
        }
        const box3W = Math.max(140, box3ContentW + 80);

        // Dynamic Layout Calculation to prevent overlap
        const eqW = 30; // Equals sign width
        const totalResultW = box1W + eqW + box2W + eqW + box3W;
        
        const resScale = Math.min(1, maxAvailableW / totalResultW);
        
        ctx.save();
        ctx.translate(this.width / 2, rY);
        ctx.scale(resScale, resScale);
        
        const startX2 = -totalResultW / 2;
        const r1x = startX2 + box1W/2;
        const eq1x = startX2 + box1W + eqW/2;
        const r2x = startX2 + box1W + eqW + box2W/2;
        const eq2x = startX2 + box1W + eqW + box2W + eqW/2;
        const r3x = startX2 + box1W + eqW + box2W + eqW + box3W/2;

        // Box 1: Merged Math
        this.drawConsolidatedResult(ctx, r1x, 0, box1W, "Merge Steps", mNumStr, mDenStr, opRes1);
        
        ctx.fillStyle = "#94a3b8";
        ctx.font = "bold 24px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.globalAlpha = opRes2;
        ctx.fillText("=", eq1x, 0);
        ctx.globalAlpha = 1;

        // Box 2: Simplify
        this.drawConsolidatedResult(ctx, r2x, 0, box2W, "Simplify", simpNumStr, simpDenStr, opRes2);

        ctx.globalAlpha = opRes3;
        ctx.fillText("=", eq2x, 0);
        ctx.globalAlpha = 1;

        // Box 3: Final Answer
        this.drawFinalAnswer(ctx, r3x, 0, box3W, finalAns, this.inputs.endNum, this.inputs.endDen, opRes3);

        ctx.restore();

        // --- 7. Timer HUD ---
        if (this.inputs.showTimerDisplay) {
            const timerText = `⏱️ ${t.toFixed(2)} s`;
            ctx.font = "bold 16px Inter, sans-serif";
            const textWidth = ctx.measureText(timerText).width;
            const tx = (this.width / 2) - ((textWidth + 30) / 2);
            
            ctx.fillStyle = "rgba(15, 23, 42, 0.85)"; 
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(tx, 15, textWidth + 30, 34, 17);
            else ctx.rect(tx, 15, textWidth + 30, 34); 
            ctx.fill();
            
            ctx.fillStyle = "#ffffff";
            ctx.textAlign = "left";
            ctx.textBaseline = "alphabetic";
            ctx.fillText(timerText, tx + 15, 38);
        }
    }
}