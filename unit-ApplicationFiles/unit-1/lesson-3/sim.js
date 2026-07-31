(function () {
    'use strict';

    /* ── DOM ──────────────────────────────────────────────────────────── */
    var canvas      = document.getElementById('simulationCanvas');
    var ctx         = canvas.getContext('2d');
    var startButton = document.getElementById('startButton');
    var resetButton = document.getElementById('resetButton');
    var zoomButton  = document.getElementById('zoomButton');
    var scrubber    = document.getElementById('scrubber');
    var timeDisplay = document.getElementById('time-display');
    var tableBody   = document.getElementById('lab-table-body');
    var scoreBadge  = document.getElementById('score-badge');
    var showWalkthroughBtn = document.getElementById('show-walkthrough');
    var walkthroughOverlay = document.getElementById('walkthrough-overlay');
    var walkStepLabel = document.getElementById('walk-step-label');
    var walkTitle = document.getElementById('walk-title');
    var walkBody = document.getElementById('walk-body');
    var walkDots = document.getElementById('walk-dots');
    var walkPrevBtn = document.getElementById('walk-prev-btn');
    var walkNextBtn = document.getElementById('walk-next-btn');

    /* ── Constants ────────────────────────────────────────────────────── */
    var G                  = 981;   // cm/s²
    var TOTAL_DISTANCE_CM  = 250;
    var BALL_RADIUS_CM     = 5;
    var VERTICAL_PADDING   = 30;
    var PASS_THRESHOLD     = 80;
    var TEXT_IDS           = [];
    var MIN_RESPONSE_CHARS = 20;
    var HINT_THRESHOLD_1   = 2;    // wrong attempts before a hint appears
    var HINT_THRESHOLD_2   = 4;    // wrong attempts before stronger hints appear
    var WALK_STEPS = [
        {
            title: 'Measure the fall',
            body: 'Click <b>Drop Ball</b> or move the scrubber to each listed time. Read the tape measure and enter the distance dropped for every row from <b>0.1 s to 0.7 s</b>.'
        },
        {
            title: 'Complete the table in order',
            body: 'First fill in <b>Distance Dropped</b>. That unlocks <b>Interval Distance</b>, then the two ratio columns. Each column depends on the one before it.'
        },
        {
            title: 'Look for Galileo\'s pattern',
            body: 'The interval distances should follow an odd-number pattern, and the total distance ratios should line up with square numbers like <b>1, 4, 9, 16</b>. Use those patterns to check your work.'
        },
        {
            title: 'Use your data in Buzz',
            body: 'Once the table is complete, answer the native Buzz assessment questions below the lab.'
        }
    ];

    /* ── State ────────────────────────────────────────────────────────── */
    var pixelsPerCm, ballRadiusPx, startY, ballX;
    var animationFrameId = null;
    var startTime        = null;
    var isRunning        = false;
    var isZoomed         = false;
    var currentSimTime   = 0;
    var currentStage     = 1;
    var bestScore        = 0;
    var attemptCounts    = {};    // tracks wrong attempts per cell: "tf_col" → count
    var submitted        = false;
    var walkStep         = 0;

    var times = [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7];

    /* ── Build Table ──────────────────────────────────────────────────── */
    times.forEach(function (t) {
        var row = document.createElement('tr');
        row.className = 'border-b border-slate-900 hover:bg-slate-900/30 transition-colors';

        if (t === 0.0) {
            row.innerHTML =
                '<td class="p-3 font-mono text-cyan-500">0.0</td>' +
                '<td class="p-2"><input type="number" data-time="0.0" data-col="dist" class="w-full bg-slate-800 border border-slate-800 rounded px-2 py-1 text-white opacity-50 cursor-not-allowed text-center" value="0" disabled></td>' +
                '<td class="p-3 text-slate-600 font-mono italic text-center">\u2014</td>' +
                '<td class="p-3 text-slate-600 font-mono italic text-center">\u2014</td>' +
                '<td class="p-3 text-slate-600 font-mono italic text-center">\u2014</td>';
        } else {
            var base     = 'w-full border-2 rounded px-2 py-1 text-white focus:outline-none transition-colors text-center';
            var disabled = 'bg-slate-800 border-slate-800 opacity-50 cursor-not-allowed';
            var tf       = t.toFixed(1);
            row.innerHTML =
                '<td class="p-3 font-mono text-cyan-500">' + tf + '</td>' +
                '<td class="p-2"><input type="number" step="0.1" data-time="' + tf + '" data-col="dist"     class="' + base + ' bg-slate-900 border-slate-700 focus:border-cyan-500" placeholder="0"></td>' +
                '<td class="p-2"><input type="number" step="0.1" data-time="' + tf + '" data-col="interval" class="' + base + ' ' + disabled + '" placeholder="\u2014" disabled></td>' +
                '<td class="p-2"><input type="number" step="0.1" data-time="' + tf + '" data-col="intratio" class="' + base + ' ' + disabled + '" placeholder="\u2014" disabled></td>' +
                '<td class="p-2"><input type="number" step="0.1" data-time="' + tf + '" data-col="ratio"    class="' + base + ' ' + disabled + '" placeholder="\u2014" disabled></td>';
        }
        tableBody.appendChild(row);
    });

    /* ── Canvas ───────────────────────────────────────────────────────── */
    function setupCanvas() {
        var dpr     = window.devicePixelRatio || 1;
        var wrapper = document.getElementById('canvas-wrapper');
        var targetH = isZoomed ? 2000 : wrapper.clientHeight;

        canvas.width        = wrapper.clientWidth * dpr;
        canvas.height       = targetH * dpr;
        canvas.style.width  = wrapper.clientWidth + 'px';
        canvas.style.height = targetH + 'px';
        ctx.scale(dpr, dpr);

        var drawH    = Math.max(0, targetH - VERTICAL_PADDING * 2);
        pixelsPerCm  = drawH / TOTAL_DISTANCE_CM;
        ballRadiusPx = Math.max(0, BALL_RADIUS_CM * pixelsPerCm);
        startY       = VERTICAL_PADDING + ballRadiusPx;
        ballX        = wrapper.clientWidth / 2;
        updateFrame(currentSimTime);
    }

    function updateFrame(time) {
        currentSimTime = time;
        timeDisplay.textContent = time.toFixed(2) + 's';
        scrubber.value = time;
        var dist  = 0.5 * G * time * time;
        var ballY = startY + dist * pixelsPerCm;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawTapeMeasure();
        times.forEach(function (t) {
            if (t > 0 && t <= time) {
                var sd = 0.5 * G * t * t;
                var sy = startY + sd * pixelsPerCm;
                drawBall(ballX, sy, 0.6, '#fefce8', true);
                drawMeasurementLine(sy);
            }
        });
        drawBall(ballX, ballY, 1, '#facc15', false);
        if (isZoomed) {
            var w      = document.getElementById('canvas-wrapper');
            var offset = isRunning ? 0.7 : 0.5;
            w.scrollTop = ballY - w.clientHeight * offset;
        }
    }

    function drawTapeMeasure() {
        var tapeX      = 70;
        var tapeStartY = startY;
        var tapeEndY   = startY + TOTAL_DISTANCE_CM * pixelsPerCm;
        ctx.beginPath();
        ctx.moveTo(tapeX, tapeStartY);
        ctx.lineTo(tapeX, tapeEndY);
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth   = 3;
        ctx.stroke();
        ctx.fillStyle    = 'rgba(255,255,255,0.9)';
        ctx.font         = 'bold 12px Inter';
        ctx.textAlign    = 'right';
        ctx.textBaseline = 'middle';
        for (var cm = 0; cm <= TOTAL_DISTANCE_CM; cm++) {
            var y = tapeStartY + cm * pixelsPerCm;
            if (cm % 10 === 0) {
                ctx.beginPath(); ctx.moveTo(tapeX - 18, y); ctx.lineTo(tapeX, y);
                ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 2; ctx.stroke();
                ctx.fillText(cm, tapeX - 25, y);
            } else if (cm % 5 === 0) {
                ctx.beginPath(); ctx.moveTo(tapeX - 12, y); ctx.lineTo(tapeX, y);
                ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.5; ctx.stroke();
            } else if (isZoomed) {
                ctx.beginPath(); ctx.moveTo(tapeX - 6, y); ctx.lineTo(tapeX, y);
                ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1; ctx.stroke();
            }
        }
    }

    function drawBall(x, y, opacity, color, hasDot) {
        ctx.globalAlpha = opacity;
        ctx.beginPath();
        ctx.arc(x, y, ballRadiusPx, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        if (hasDot) {
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fillStyle = 'black';
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;
    }

    function drawMeasurementLine(y) {
        ctx.beginPath();
        ctx.moveTo(70, y);
        ctx.lineTo(ballX, y);
        ctx.strokeStyle = 'rgba(239,68,68,0.5)';
        ctx.lineWidth   = 1.5;
        ctx.stroke();
    }

    function animationLoop(currentTime) {
        if (!startTime) startTime = currentTime;
        var elapsed = (currentTime - startTime) / 1000;
        if (elapsed >= 0.72) {
            updateFrame(0.72);
            isRunning = false;
            startButton.textContent = 'Drop Ball';
            return;
        }
        updateFrame(elapsed);
        animationFrameId = requestAnimationFrame(animationLoop);
    }

    /* ── Hint System ──────────────────────────────────────────────────── */
    function cellKey(tf, col) { return tf + '_' + col; }

    function renderWalkthrough() {
        var step = WALK_STEPS[walkStep];
        walkStepLabel.textContent = 'Step ' + (walkStep + 1) + ' of ' + WALK_STEPS.length;
        walkTitle.textContent = step.title;
        walkBody.innerHTML = step.body;
        walkPrevBtn.disabled = walkStep === 0;
        walkNextBtn.textContent = walkStep === WALK_STEPS.length - 1 ? 'Close' : 'Next';
        walkDots.innerHTML = '';
        WALK_STEPS.forEach(function (_, index) {
            var dot = document.createElement('div');
            dot.className = 'walk-dot' + (index === walkStep ? ' active' : '');
            walkDots.appendChild(dot);
        });
    }

    function openWalkthrough() {
        walkStep = 0;
        renderWalkthrough();
        walkthroughOverlay.classList.remove('hidden');
    }

    function closeWalkthrough() {
        walkthroughOverlay.classList.add('hidden');
    }
    function getAttempts(tf, col) { return attemptCounts[cellKey(tf, col)] || 0; }
    function addAttempt(tf, col)  { attemptCounts[cellKey(tf, col)] = getAttempts(tf, col) + 1; }

    function hintText(col, time, level) {
        var tf = time.toFixed(1);
        if (col === 'dist') {
            return 'Hint: Zoom in on the graph.';
        }
        if (col === 'interval') {
            if (level === 1) return 'Hint: Subtract the distance in the row above from this row\u2019s distance.';
            var cur  = parseFloat((document.querySelector('input[data-time="' + tf + '"][data-col="dist"]') || {}).value) || 0;
            var prevTf = time === 0.1 ? null : (time - 0.1).toFixed(1);
            var prev = prevTf ? parseFloat((document.querySelector('input[data-time="' + prevTf + '"][data-col="dist"]') || {}).value) || 0 : 0;
            return 'Hint: ' + cur.toFixed(1) + ' \u2212 ' + prev.toFixed(1) + ' = ' + (cur - prev).toFixed(1) + ' cm';
        }
        if (col === 'intratio') {
            if (level === 1) return 'Hint: Divide this interval by the amber-highlighted reference interval at 0.1s.';
            var int01  = parseFloat((document.querySelector('input[data-time="0.1"][data-col="interval"]')  || {}).value) || 0;
            var intCur = parseFloat((document.querySelector('input[data-time="' + tf + '"][data-col="interval"]') || {}).value) || 0;
            return int01 > 0 ? 'Hint: ' + intCur.toFixed(1) + ' \u00F7 ' + int01.toFixed(1) + ' \u2248 ' + (intCur / int01).toFixed(2) : 'Hint: Complete the Interval Distance column first.';
        }
        if (col === 'ratio') {
            if (level === 1) return 'Hint: Divide this row\u2019s distance by the amber-highlighted reference distance at 0.1s.';
            var d01  = parseFloat((document.querySelector('input[data-time="0.1"][data-col="dist"]') || {}).value) || 0;
            var dCur = parseFloat((document.querySelector('input[data-time="' + tf + '"][data-col="dist"]') || {}).value) || 0;
            return d01 > 0 ? 'Hint: ' + dCur.toFixed(1) + ' \u00F7 ' + d01.toFixed(1) + ' \u2248 ' + (dCur / d01).toFixed(2) : 'Hint: Complete the Distance Dropped column first.';
        }
        return '';
    }

    function showHint(input, col, time) {
        var tf     = time.toFixed(1);
        var n      = getAttempts(tf, col);
        var level  = n >= HINT_THRESHOLD_2 ? 2 : 1;
        var hintId = 'hint-' + tf + '-' + col;
        var el     = document.getElementById(hintId);
        if (!el) {
            el           = document.createElement('div');
            el.id        = hintId;
            el.className = 'text-xs text-amber-400 mt-1 font-mono';
            input.parentNode.appendChild(el);
        }
        el.textContent = hintText(col, time, level);
    }

    function hideHint(tf, col) {
        var el = document.getElementById('hint-' + tf + '-' + col);
        if (el) el.remove();
    }

    /* ── Table Validation ─────────────────────────────────────────────── */
    function revalidateAll() {
        var check = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7];
        var cols  = ['dist', 'interval', 'intratio', 'ratio'];
        check.forEach(function (t) {
            cols.forEach(function (col) {
                var input = document.querySelector('input[data-time="' + t.toFixed(1) + '"][data-col="' + col + '"]');
                if (input && !input.disabled && input.value !== '') {
                    validateCell(input, col, t, parseFloat(input.value));
                }
            });
        });
        checkStageCompletion();
    }

    function validateCell(input, col, time, val) {
        if (isNaN(val)) { setInvalid(input); return false; }
        var tf       = time.toFixed(1);
        var expected, isCorrect = false;

        if (col === 'dist') {
            expected  = 0.5 * G * time * time;
            isCorrect = Math.abs(val - expected) <= 4.0;
        } else if (col === 'interval') {
            var curDist  = parseFloat(document.querySelector('input[data-time="' + tf + '"][data-col="dist"]').value);
            var prevDist = time === 0.1 ? 0 : parseFloat(document.querySelector('input[data-time="' + (time - 0.1).toFixed(1) + '"][data-col="dist"]').value);
            expected  = curDist - prevDist;
            isCorrect = Math.abs(val - expected) <= 0.2;
        } else if (col === 'intratio') {
            var intCur = parseFloat(document.querySelector('input[data-time="' + tf + '"][data-col="interval"]').value);
            var int01  = parseFloat(document.querySelector('input[data-time="0.1"][data-col="interval"]').value);
            expected  = intCur / int01;
            isCorrect = Math.abs(val - expected) <= Math.abs(expected) * 0.05;
        } else if (col === 'ratio') {
            var dCur = parseFloat(document.querySelector('input[data-time="' + tf + '"][data-col="dist"]').value);
            var d01  = parseFloat(document.querySelector('input[data-time="0.1"][data-col="dist"]').value);
            expected  = dCur / d01;
            isCorrect = Math.abs(val - expected) <= Math.abs(expected) * 0.05;
        }

        if (isCorrect) {
            setValid(input);
            hideHint(tf, col);
            delete attemptCounts[cellKey(tf, col)];
        } else {
            setInvalid(input);
            addAttempt(tf, col);
            if (getAttempts(tf, col) >= HINT_THRESHOLD_1) showHint(input, col, time);
        }
        return isCorrect;
    }

    function setValid(input) {
        input.classList.remove('border-slate-700', 'border-red-500', 'focus:border-cyan-500', 'focus:border-red-500', 'bg-red-900/20');
        input.classList.add('border-green-500', 'focus:border-green-500', 'bg-green-900/10', 'text-green-400');
        input.dataset.valid = 'true';
    }

    function setInvalid(input) {
        input.classList.remove('border-slate-700', 'border-green-500', 'focus:border-cyan-500', 'focus:border-green-500', 'bg-green-900/10', 'text-green-400');
        input.classList.add('border-red-500', 'focus:border-red-500', 'bg-red-900/20');
        input.dataset.valid = 'false';
    }

    /* ── Stage Progression ────────────────────────────────────────────── */
    function allValid(col) {
        return [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7].every(function (t) {
            var input = document.querySelector('input[data-time="' + t.toFixed(1) + '"][data-col="' + col + '"]');
            return input && input.dataset.valid === 'true';
        });
    }

    function checkStageCompletion() {
        if (currentStage === 1 && allValid('dist'))     { currentStage = 2; unlockColumn('interval');  updateGuidance(2); reportScore(); }
        if (currentStage === 2 && allValid('interval')) { currentStage = 3; unlockColumn('intratio');  updateGuidance(3); reportScore(); }
        if (currentStage === 3 && allValid('intratio')) { currentStage = 4; unlockColumn('ratio');     updateGuidance(4); reportScore(); }
        if (currentStage === 4 && allValid('ratio'))    { currentStage = 5; updateGuidance(5); updateCompletedChart(); reportScore(); }
        if (currentStage >= 5) updateCompletedChart();
    }

    function unlockColumn(col) {
        document.querySelectorAll('input[data-col="' + col + '"]').forEach(function (input) {
            if (input.dataset.time !== '0.0') {
                input.disabled = false;
                input.classList.remove('opacity-50', 'cursor-not-allowed', 'bg-slate-800');
                input.classList.add('bg-slate-900');
            }
        });
    }

    function highlightColumn(stage) {
        var stageToCol = { 1: 'dist', 2: 'interval', 3: 'intratio', 4: 'ratio' };
        ['dist', 'interval', 'intratio', 'ratio'].forEach(function (col) {
            var colEl = document.getElementById('col-' + col);
            var thEl  = document.getElementById('th-' + col);
            if (colEl) colEl.className = '';
            if (thEl)  thEl.classList.remove('col-active', 'col-done');
        });
        for (var s = 1; s < stage && s <= 4; s++) {
            var dc = stageToCol[s];
            var dColEl = document.getElementById('col-' + dc);
            var dThEl  = document.getElementById('th-' + dc);
            if (dColEl) dColEl.className = 'col-done';
            if (dThEl)  dThEl.classList.add('col-done');
        }
        if (stage <= 4) {
            var ac = stageToCol[stage];
            var aColEl = document.getElementById('col-' + ac);
            var aThEl  = document.getElementById('th-' + ac);
            if (aColEl) aColEl.className = 'col-active';
            if (aThEl)  aThEl.classList.add('col-active');
        }
    }

    function highlightReferenceCell(stage) {
        document.querySelectorAll('.ref-cell').forEach(function (el) { el.classList.remove('ref-cell'); });
        var refInput = null;
        if (stage === 3) refInput = document.querySelector('input[data-time="0.1"][data-col="interval"]');
        if (stage === 4) refInput = document.querySelector('input[data-time="0.1"][data-col="dist"]');
        if (refInput) refInput.classList.add('ref-cell');
    }

    function updateGuidance(stage) {
        var title  = document.getElementById('guidance-title');
        var text   = document.getElementById('guidance-text');
        var banner = document.getElementById('guidance-banner');
        highlightColumn(stage);
        highlightReferenceCell(stage);
        if (stage === 2) {
            title.textContent = 'Step 2: Calculate Interval Distance';
            text.innerHTML    = 'Subtract the previous distance from the current distance for each interval.<br><code class="bg-indigo-950 px-2 py-1 rounded text-cyan-300 mt-2 inline-block">Interval Dist = Current Dist \u2212 Previous Dist</code>';
        } else if (stage === 3) {
            title.textContent = 'Step 3: Calculate Interval Ratio';
            text.innerHTML    = 'Divide each interval distance by the <em>first</em> interval distance (at 0.1s).<br><code class="bg-indigo-950 px-2 py-1 rounded text-cyan-300 mt-2 inline-block">Interval Ratio = Interval Dist \u00F7 Interval Dist at 0.1s</code>';
        } else if (stage === 4) {
            title.textContent = 'Step 4: Calculate Galileo\u2019s Ratio';
            text.innerHTML    = 'Divide each total distance dropped by the distance at 0.1s.<br><code class="bg-indigo-950 px-2 py-1 rounded text-cyan-300 mt-2 inline-block">Ratio = Dist Dropped \u00F7 Dist at 0.1s</code>';
        } else if (stage === 5) {
            banner.classList.remove('bg-indigo-900/80', 'border-indigo-500', 'text-indigo-100');
            banner.classList.add('bg-green-900/80', 'border-green-500', 'text-green-100');
            title.textContent = 'Data Collection Complete';
            text.textContent  = 'The data table is complete. Download the evidence image, then return to Buzz and answer the assessment questions.';
        }
    }

    function getCellValue(time, col) {
        if (time === 0.0) return col === 'dist' ? '0' : '---';
        var input = document.querySelector('input[data-time="' + time.toFixed(1) + '"][data-col="' + col + '"]');
        return input && input.value !== '' ? input.value : '---';
    }

    function formatChartValue(time, col) {
        var value = getCellValue(time, col);
        if (value === '---') return value;
        var num = parseFloat(value);
        if (isNaN(num)) return value;
        if (col === 'intratio' || col === 'ratio') return num.toFixed(2);
        return num.toFixed(1);
    }

    function updateCompletedChart() {
        var section = document.getElementById('screenshot-chart');
        var body = document.getElementById('completed-chart-body');
        if (!section || !body) return;
        if (currentStage < 5) {
            section.classList.add('hidden');
            return;
        }

        body.innerHTML = '';
        times.forEach(function (time) {
            var row = document.createElement('tr');
            row.innerHTML =
                '<td>' + time.toFixed(1) + '</td>' +
                '<td>' + formatChartValue(time, 'dist') + '</td>' +
                '<td>' + formatChartValue(time, 'interval') + '</td>' +
                '<td>' + formatChartValue(time, 'intratio') + '</td>' +
                '<td>' + formatChartValue(time, 'ratio') + '</td>';
            body.appendChild(row);
        });
        section.classList.remove('hidden');
    }

    function downloadCompletedChart() {
        updateCompletedChart();
        var canvasEl = document.createElement('canvas');
        var scale = 2;
        var width = 1100;
        var rowHeight = 54;
        var top = 120;
        var left = 40;
        var colWidths = [140, 240, 240, 220, 260];
        var height = top + rowHeight * (times.length + 1) + 70;
        canvasEl.width = width * scale;
        canvasEl.height = height * scale;
        var imageCtx = canvasEl.getContext('2d');
        imageCtx.scale(scale, scale);
        imageCtx.fillStyle = '#ffffff';
        imageCtx.fillRect(0, 0, width, height);
        imageCtx.fillStyle = '#0f172a';
        imageCtx.font = 'bold 34px Arial, sans-serif';
        imageCtx.fillText('Completed Galileo Data Chart', left, 52);
        imageCtx.fillStyle = '#475569';
        imageCtx.font = '18px Arial, sans-serif';
        imageCtx.fillText('Unit 1 Lesson 3 - Acceleration Lab Evidence', left, 84);

        var headers = ['Time (s)', 'Distance Dropped (cm)', 'Interval Distance (cm)', 'Interval Ratio', 'Total Distance Ratio'];
        var x = left;
        imageCtx.strokeStyle = '#cbd5e1';
        imageCtx.lineWidth = 1;
        imageCtx.textAlign = 'center';
        imageCtx.textBaseline = 'middle';
        headers.forEach(function (header, index) {
            imageCtx.fillStyle = '#e8f1fb';
            imageCtx.fillRect(x, top, colWidths[index], rowHeight);
            imageCtx.strokeRect(x, top, colWidths[index], rowHeight);
            imageCtx.fillStyle = '#1f3b57';
            imageCtx.font = 'bold 16px Arial, sans-serif';
            imageCtx.fillText(header, x + colWidths[index] / 2, top + rowHeight / 2);
            x += colWidths[index];
        });

        times.forEach(function (time, rowIndex) {
            var rowY = top + rowHeight * (rowIndex + 1);
            var values = [
                time.toFixed(1),
                formatChartValue(time, 'dist'),
                formatChartValue(time, 'interval'),
                formatChartValue(time, 'intratio'),
                formatChartValue(time, 'ratio')
            ];
            x = left;
            values.forEach(function (value, colIndex) {
                imageCtx.fillStyle = rowIndex % 2 === 0 ? '#ffffff' : '#f8fafc';
                imageCtx.fillRect(x, rowY, colWidths[colIndex], rowHeight);
                imageCtx.strokeRect(x, rowY, colWidths[colIndex], rowHeight);
                imageCtx.fillStyle = '#172033';
                imageCtx.font = '18px Arial, sans-serif';
                imageCtx.fillText(value, x + colWidths[colIndex] / 2, rowY + rowHeight / 2);
                x += colWidths[colIndex];
            });
        });

        imageCtx.textAlign = 'left';
        imageCtx.fillStyle = '#475569';
        imageCtx.font = '15px Arial, sans-serif';
        imageCtx.fillText('Upload this image to the final Buzz question.', left, height - 28);

        var link = document.createElement('a');
        link.download = 'unit-1-lesson-3-galileo-evidence.png';
        link.href = canvasEl.toDataURL('image/png');
        link.click();
    }

    function unlockAnalysis() {
        var overlay = document.getElementById('lock-overlay');
        var content = document.getElementById('analysis-content');
        if (overlay) {
            overlay.style.opacity = '0';
            setTimeout(function () { if (overlay) overlay.style.display = 'none'; }, 500);
        }
        if (content) {
            content.classList.remove('opacity-30', 'pointer-events-none');
            initTextAreaFeedback();
        }
    }

    /* ── Text Response Grading ────────────────────────────────────────── */
    function getTextScore() {
        return TEXT_IDS.every(function (id) {
            var el = document.getElementById(id);
            return el && el.value.trim().length >= MIN_RESPONSE_CHARS;
        }) ? 20 : 0;
    }

    function updateCharCount(ta) {
        var count  = ta.value.trim().length;
        var span   = document.getElementById('count-' + ta.id);
        if (!span) return;
        var enough = count >= MIN_RESPONSE_CHARS;
        span.textContent = enough ? '\u2713 Response recorded' : count + ' / ' + MIN_RESPONSE_CHARS + ' chars minimum';
        span.className   = 'text-right text-xs mt-1 ' + (enough ? 'text-green-400' : 'text-slate-500');
        ta.classList.toggle('ta-done', enough);
    }

    function initTextAreaFeedback() {
        TEXT_IDS.forEach(function (id) {
            var ta = document.getElementById(id);
            if (!ta) return;
            if (!document.getElementById('count-' + id)) {
                var span = document.createElement('div');
                span.id  = 'count-' + id;
                ta.parentNode.insertBefore(span, ta.nextSibling);
            }
            updateCharCount(ta);
        });
        updateSubmitButton();
    }

    /* ── Scoring ──────────────────────────────────────────────────────── */
    function getScore() {
        return currentStage >= 5 ? 100 : Math.min((currentStage - 1) * 25, 75);
    }

    function updateSubmitButton() {
        var btn     = document.getElementById('submit-btn');
        var display = document.getElementById('submit-score-display');
        var status  = document.getElementById('submit-status-text');
        if (!btn || submitted) return;
        var score = getScore();
        var ready = currentStage >= 5 && getTextScore() === 20;
        display.textContent = score + '%';
        if (ready) {
            status.textContent = score >= PASS_THRESHOLD ? 'Passing score \u2014 ready to submit!' : 'Below passing (' + PASS_THRESHOLD + '%) \u2014 review your written responses.';
            status.className   = 'text-xs mt-1 ' + (score >= PASS_THRESHOLD ? 'text-green-400' : 'text-amber-400');
            btn.disabled       = false;
            btn.className      = 'w-full py-4 rounded-xl font-bold text-lg transition-all bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer';
        } else {
            var todo = [];
            if (currentStage < 5)       todo.push('complete the data table');
            if (getTextScore() < 20)    todo.push('finish all written responses (20+ chars each)');
            status.textContent = todo.length ? 'To submit: ' + todo.join(' and ') + '.' : '';
            status.className   = 'text-xs mt-1 text-slate-400';
            btn.disabled       = true;
            btn.className      = 'w-full py-4 rounded-xl font-bold text-lg transition-all bg-slate-700 text-slate-400 cursor-not-allowed';
        }
    }

    function showSubmittedState() {
        var btn     = document.getElementById('submit-btn');
        var confirm = document.getElementById('submitted-confirm');
        var display = document.getElementById('submit-score-display');
        if (btn)     btn.classList.add('hidden');
        if (confirm) confirm.classList.remove('hidden');
        if (display) display.textContent = bestScore + '%';
        document.querySelectorAll('#lab-table-body input').forEach(function (el) { el.disabled = true; });
        document.querySelectorAll('#analysis-content textarea').forEach(function (el) { el.disabled = true; });
    }

    function submitAssignment() {
        if (submitted) return;
        submitted = true;
        var score = getScore();
        if (score > bestScore) bestScore = score;
        if (scoreBadge) scoreBadge.textContent = 'Score: ' + bestScore + '%';
        showSubmittedState();
        saveSuspendData();
        if (typeof SCORM !== 'undefined') {
            SCORM.setScore(bestScore, 0, 100);
            SCORM.setStatus(bestScore >= PASS_THRESHOLD ? 'passed' : 'failed');
            SCORM.commit();
            SCORM.finish();
        }
    }

    function reportScore() {
        var score = getScore();
        if (score > bestScore) bestScore = score;
        if (scoreBadge) scoreBadge.textContent = 'Score: ' + bestScore + '%';
        if (typeof SCORM !== 'undefined') {
            SCORM.setScore(bestScore, 0, 100);
            SCORM.setStatus(bestScore >= PASS_THRESHOLD ? 'passed' : 'failed');
            SCORM.commit();
        }
        saveSuspendData();
        updateSubmitButton();
    }

    /* ── SCORM Persist ────────────────────────────────────────────────── */
    function saveSuspendData() {
        if (typeof SCORM === 'undefined') return;
        var colsList = ['dist', 'interval', 'intratio', 'ratio'];
        var cells    = {};
        times.forEach(function (t) {
            if (t === 0.0) return;
            var tf = t.toFixed(1);
            colsList.forEach(function (col) {
                var input = document.querySelector('input[data-time="' + tf + '"][data-col="' + col + '"]');
                if (input && input.value !== '') cells[tf + '_' + col] = input.value;
            });
        });
        var responses = {};
        TEXT_IDS.forEach(function (id) {
            var el = document.getElementById(id);
            if (el && el.value) responses[id] = el.value;
        });
        var payload = JSON.stringify({ v: 1, stg: currentStage, best: bestScore, submitted: submitted, cells: cells, responses: responses });
        if (payload.length > 4096) {
            console.warn('suspend_data exceeds 4096 chars (' + payload.length + '); saving without responses.');
            payload = JSON.stringify({ v: 1, stg: currentStage, best: bestScore, submitted: submitted, cells: cells, responses: {} });
        }
        SCORM.setValue('cmi.suspend_data', payload);
        SCORM.commit();
    }

    function loadSuspendData() {
        if (typeof SCORM === 'undefined') return false;
        var raw = SCORM.getValue('cmi.suspend_data');
        if (!raw) return false;
        try {
            var data   = JSON.parse(raw);
            if (!data || !data.v) return false;
            bestScore  = data.best || 0;
            var target = data.stg  || 1;

            if (data.cells) {
                Object.keys(data.cells).forEach(function (key) {
                    var under = key.indexOf('_');
                    var tf    = key.slice(0, under);
                    var col   = key.slice(under + 1);
                    var input = document.querySelector('input[data-time="' + tf + '"][data-col="' + col + '"]');
                    if (input) input.value = data.cells[key];
                });
            }

            if (target >= 2) { unlockColumn('interval');  updateGuidance(2); }
            if (target >= 3) { unlockColumn('intratio');  updateGuidance(3); }
            if (target >= 4) { unlockColumn('ratio');     updateGuidance(4); }
            if (target >= 5) { updateGuidance(5); updateCompletedChart(); }
            currentStage = target;

            if (data.responses) {
                TEXT_IDS.forEach(function (id) {
                    var el = document.getElementById(id);
                    if (el && data.responses[id]) el.value = data.responses[id];
                });
                initTextAreaFeedback();
            }

            if (scoreBadge) scoreBadge.textContent = 'Score: ' + bestScore + '%';
            revalidateAll();
            reportScore();    // sync current score to Buzz after full restore

            if (data.submitted === true) {
                submitted = true;
                showSubmittedState();
            }
            return true;
        } catch (e) {
            return false;
        }
    }

    /* ── Event Listeners ──────────────────────────────────────────────── */
    function isEditableTarget(target) {
        return target && (
            target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable
        );
    }

    function installClipboardGuards() {
        document.addEventListener('copy', function (e) { e.preventDefault(); }, true);
        document.addEventListener('cut', function (e) { e.preventDefault(); }, true);
        document.addEventListener('paste', function (e) {
            if (isEditableTarget(e.target)) e.preventDefault();
        }, true);
        document.addEventListener('drop', function (e) {
            if (isEditableTarget(e.target)) e.preventDefault();
        }, true);
        document.addEventListener('beforeinput', function (e) {
            if (e.inputType === 'insertFromPaste' || e.inputType === 'insertFromDrop') e.preventDefault();
        }, true);
        document.addEventListener('keydown', function (e) {
            var key = String(e.key || '').toLowerCase();
            if ((e.ctrlKey || e.metaKey) && (key === 'c' || key === 'v' || key === 'x')) e.preventDefault();
        }, true);
    }

    zoomButton.addEventListener('click', function () {
        isZoomed = !isZoomed;
        if (isZoomed) {
            zoomButton.innerHTML = '\uD83D\uDD0D Zoom Out';
            zoomButton.classList.remove('bg-slate-800', 'text-slate-300');
            zoomButton.classList.add('bg-purple-600', 'text-white');
        } else {
            zoomButton.innerHTML = '\uD83D\uDD0D Zoom In';
            zoomButton.classList.add('bg-slate-800', 'text-slate-300');
            zoomButton.classList.remove('bg-purple-600', 'text-white');
        }
        setupCanvas();
        if (isZoomed) {
            var w     = document.getElementById('canvas-wrapper');
            var ballY = startY + 0.5 * G * currentSimTime * currentSimTime * pixelsPerCm;
            w.scrollTop = ballY - w.clientHeight / 2;
        }
    });

    startButton.addEventListener('click', function () {
        if (isRunning) return;
        startTime = null;
        isRunning = true;
        startButton.textContent = 'Dropping...';
        animationFrameId = requestAnimationFrame(animationLoop);
    });

    resetButton.addEventListener('click', function () {
        cancelAnimationFrame(animationFrameId);
        isRunning = false;
        startTime = null;
        updateFrame(0);
        startButton.textContent = 'Drop Ball';
    });

    scrubber.addEventListener('input', function (e) {
        if (isRunning) return;
        updateFrame(parseFloat(e.target.value));
    });

    tableBody.addEventListener('input', function (e) {
        if (e.target.tagName === 'INPUT') {
            revalidateAll();
            saveSuspendData();
        }
    });

    installClipboardGuards();

    var submitBtn = document.getElementById('submit-btn');
    if (submitBtn) submitBtn.addEventListener('click', submitAssignment);
    var downloadChartBtn = document.getElementById('download-chart-btn');
    if (downloadChartBtn) downloadChartBtn.addEventListener('click', downloadCompletedChart);
    if (showWalkthroughBtn) showWalkthroughBtn.addEventListener('click', openWalkthrough);
    if (walkPrevBtn) {
        walkPrevBtn.addEventListener('click', function () {
            if (walkStep > 0) {
                walkStep--;
                renderWalkthrough();
            }
        });
    }
    if (walkNextBtn) {
        walkNextBtn.addEventListener('click', function () {
            if (walkStep >= WALK_STEPS.length - 1) closeWalkthrough();
            else {
                walkStep++;
                renderWalkthrough();
            }
        });
    }
    if (walkthroughOverlay) {
        walkthroughOverlay.addEventListener('click', function (e) {
            if (e.target === walkthroughOverlay) closeWalkthrough();
        });
    }

    var analysisContent = document.getElementById('analysis-content');
    if (analysisContent) {
        analysisContent.addEventListener('input', function (e) {
            if (e.target.tagName === 'TEXTAREA') {
                updateCharCount(e.target);
                reportScore();
                saveSuspendData();
            }
        });
    }

    window.addEventListener('resize', setupCanvas);

    /* ── Init ─────────────────────────────────────────────────────────── */
    var startScreenButton = document.getElementById('btn-start');
    if (startScreenButton) {
        startScreenButton.addEventListener('click', function () {
            document.getElementById('start-screen').style.display = 'none';
            document.getElementById('app-root').classList.remove('hidden');
            setupCanvas();
        });
    }

    window.addEventListener('load', function () {
        if (typeof SCORM !== 'undefined') SCORM.initialize();
        if (!startScreenButton) setupCanvas();
        loadSuspendData();
        highlightColumn(currentStage);
        highlightReferenceCell(currentStage);
    });

    window.addEventListener('beforeunload', function () {
        if (submitted) return;   // already finalized via submitAssignment()
        saveSuspendData();
        if (typeof SCORM !== 'undefined') {
            SCORM.setScore(bestScore, 0, 100);
            SCORM.setStatus(bestScore >= PASS_THRESHOLD ? 'passed' : 'failed');
            SCORM.commit();
            SCORM.finish();
        }
    });

}());
