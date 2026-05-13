// core/SimulationGifMaker.js
export default class SimulationGifMaker {
    constructor(canvasId, config = {}) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.config = Object.assign({ fps: 30, duration: 4, backgroundColor: '#f8fafc' }, config);
        this.inputs = {};
        this.inputElements = {};
        this.inputDefinitions = {};
        this.animationRef = null;
        this.isPlaying = false;
        this.moduleExtension = document.getElementById('moduleExtension');

        // GIF export settings with defaults
        this.exportSettings = { scale: 1.0, fps: this.config.fps, quality: 10, loopDelaySeconds: 0 };
        this.clearModuleExtension();
    }

    init() { console.warn("init() must be overridden"); }

    /** Override in subclass to provide a default vector for the Vector Breakdown popup.
     *  Return { magnitude, angleDeg, title? } or null. */
    getVectorConfig() { return null; }

    /** Open the Vector Breakdown popup with the current module's vector (if available). */
    showVectorBreakdown(config) {
        if (!this.vectorPopup) return;
        this.vectorPopup.open(config ?? this.getVectorConfig() ?? { magnitude: 10, angleDeg: 35 });
    }

    getPreviewTitle() {
        return this.previewTitleFallback || 'Simulation Output';
    }

    updatePreviewTitle() {
        const titleEl = document.getElementById('canvasTitle');
        if (!titleEl) return;

        const title = String(this.getPreviewTitle() || this.previewTitleFallback || 'Simulation Output').trim();
        const length = title.length;
        titleEl.innerText = title;
        titleEl.style.whiteSpace = 'normal';
        titleEl.style.maxWidth = '100%';
        titleEl.style.textAlign = 'left';
        titleEl.style.textTransform = length > 55 ? 'none' : '';
        titleEl.style.letterSpacing = length > 80 ? '0.02em' : '';
        titleEl.style.fontSize = length > 210 ? '0.56rem' : (length > 130 ? '0.61rem' : (length > 55 ? '0.66rem' : ''));
        titleEl.style.lineHeight = length > 55 ? '1.35' : '';
    }

    setupInputs(containerId, configGroups) {
        const container = document.getElementById(containerId);
        container.innerHTML = ''; 
        const topControlsContainer = document.getElementById('topControls');
        if (topControlsContainer) topControlsContainer.innerHTML = '';

        for (const [groupName, inputs] of Object.entries(configGroups)) {
            const section = this._createCollapsibleSection(groupName);
            const targetContainer = this.getControlsContainerForGroup(groupName, container, topControlsContainer);

            for (const [key, def] of Object.entries(inputs)) {
                this.inputDefinitions[key] = def;
                this.inputs[key] = def.value; 
                const wrapper = document.createElement('div');
                const label = document.createElement('label');
                const inputId = `${containerId}-${key}`;
                label.innerText = def.label;
                label.htmlFor = inputId;

                let inputElement;
                if (def.type === 'checkbox') {
                    wrapper.className = "flex flex-row items-center justify-between gap-3 mb-3 cursor-pointer";
                    inputElement = document.createElement('input');
                    inputElement.type = 'checkbox';
                    inputElement.checked = def.value;
                    inputElement.addEventListener('change', (e) => { this.inputs[key] = e.target.checked; this.drawPreview(); });
                } else if (def.type === 'select') {
                    wrapper.className = "flex flex-col gap-1.5 mb-4";
                    inputElement = document.createElement('select');
                    def.options.forEach(opt => {
                        const option = document.createElement('option');
                        option.value = opt; option.innerText = opt;
                        if(opt === def.value) option.selected = true;
                        inputElement.appendChild(option);
                    });
                    inputElement.addEventListener('change', (e) => { this.inputs[key] = e.target.value; this.drawPreview(); });
                } else if (def.type === 'textarea') {
                    wrapper.className = "flex flex-col gap-1.5 mb-4";
                    inputElement = document.createElement('textarea');
                    inputElement.value = def.value || '';
                    inputElement.rows = def.rows || 6;
                    inputElement.placeholder = def.placeholder || '';
                    inputElement.addEventListener('input', (e) => {
                        this.inputs[key] = e.target.value;
                        if (def.livePreview) this.drawPreview();
                    });
                } else if (def.type === 'button') {
                    wrapper.className = "flex flex-col gap-1.5 mb-4";
                    inputElement = document.createElement('button');
                    inputElement.type = 'button';
                    inputElement.innerText = def.buttonText || def.label || 'Apply';
                    inputElement.addEventListener('click', () => def.onClick?.(this));
                } else {
                    wrapper.className = "flex flex-col gap-1.5 mb-4";
                    inputElement = document.createElement('input');
                    inputElement.type = 'number';
                    inputElement.value = def.value;
                    if (def.step) inputElement.step = def.step;
                    inputElement.addEventListener('input', (e) => { this.inputs[key] = parseFloat(e.target.value) || 0; this.drawPreview(); });
                }

                if (def.type !== 'button') {
                    inputElement.id = inputId;
                    inputElement.name = key;
                }

                if (def.type !== 'button') {
                    wrapper.appendChild(label);
                }
                wrapper.appendChild(inputElement);
                if (def.type === 'checkbox') wrapper.insertBefore(inputElement, label);
                section.content.appendChild(wrapper);
                this.inputElements[key] = inputElement;
            }

            targetContainer.appendChild(section.root);
        }

        // Auto-append GIF Export Settings
        this._buildExportSettingsUI(container);
    }

    getControlsContainerForGroup(_groupName, defaultContainer, _topControlsContainer) {
        return defaultContainer;
    }

    setInputValue(key, value, { redraw = false } = {}) {
        this.inputs[key] = value;
        const inputElement = this.inputElements[key];
        const def = this.inputDefinitions[key];
        if (inputElement && def) {
            if (def.type === 'checkbox') {
                inputElement.checked = Boolean(value);
            } else if (def.type === 'textarea') {
                inputElement.value = value ?? '';
            } else if (def.type === 'button') {
                // no-op
            } else {
                inputElement.value = value;
            }
        }

        if (redraw) this.drawPreview();
    }

    _buildExportSettingsUI(container) {
        const section = this._createCollapsibleSection('GIF Export Settings');

        const exportInputs = {
            _exportScale: {
                label: 'Output Scale',
                type: 'select',
                options: ['100%', '75%', '50%', '25%'],
                value: '100%'
            },
            _exportFps: {
                label: 'Export FPS',
                type: 'select',
                options: ['30', '20', '15', '10', '5'],
                value: String(this.config.fps)
            },
            _exportQuality: {
                label: 'Quality (1=best, 20=smallest)',
                type: 'select',
                options: ['1', '5', '10', '15', '20'],
                value: '10'
            },
            _exportLoopDelay: {
                label: 'Replay Delay',
                type: 'select',
                options: ['None', '5 seconds'],
                value: 'None'
            }
        };

        const sizeEstimate = document.createElement('div');
        sizeEstimate.id = '_gifSizeEstimate';
        sizeEstimate.style.cssText = 'font-size:0.75rem; color:#6b7280; font-weight:600; padding:0.5rem 0.75rem; background:#f3f4f6; border-radius:0.5rem; margin-bottom:0.5rem;';

        const updateEstimate = () => {
            const scaleVal = this.exportSettings.scale;
            const fpsVal = this.exportSettings.fps;
            const loopDelaySeconds = this.exportSettings.loopDelaySeconds || 0;
            const w = Math.round(this.width * scaleVal);
            const h = Math.round(this.height * scaleVal);
            const playbackDuration = Math.max(0.01, this.getPlaybackDuration());
            const totalFrames = Math.round(fpsVal * (playbackDuration + loopDelaySeconds));
            sizeEstimate.innerHTML = `Output: ${w}×${h} &middot; ${totalFrames} frames &middot; ${fpsVal} fps`;
        };

        for (const [key, def] of Object.entries(exportInputs)) {
            const wrapper = document.createElement('div');
            wrapper.className = 'flex flex-col gap-1.5 mb-4';
            const label = document.createElement('label');
            const selectId = `gif-export-${key.replace(/^_+/, '')}`;
            label.innerText = def.label;
            label.htmlFor = selectId;

            const select = document.createElement('select');
            select.id = selectId;
            select.name = key;
            def.options.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt; option.innerText = opt;
                if (opt === def.value) option.selected = true;
                select.appendChild(option);
            });

            select.addEventListener('change', (e) => {
                const val = e.target.value;
                if (key === '_exportScale') {
                    this.exportSettings.scale = parseFloat(val) / 100;
                } else if (key === '_exportFps') {
                    this.exportSettings.fps = parseInt(val, 10);
                } else if (key === '_exportQuality') {
                    this.exportSettings.quality = parseInt(val, 10);
                } else if (key === '_exportLoopDelay') {
                    this.exportSettings.loopDelaySeconds = val === '5 seconds' ? 5 : 0;
                }
                updateEstimate();
            });

            wrapper.appendChild(label);
            wrapper.appendChild(select);
            section.content.appendChild(wrapper);
        }

        section.content.appendChild(sizeEstimate);
        updateEstimate();
        container.appendChild(section.root);
    }

    _createCollapsibleSection(title, isOpen = true) {
        const root = document.createElement('details');
        root.className = 'settings-section';
        root.open = isOpen;

        const summary = document.createElement('summary');
        summary.className = 'settings-section__summary';

        const titleText = document.createElement('span');
        titleText.innerText = title;

        const icon = document.createElement('span');
        icon.className = 'settings-section__icon';
        icon.innerHTML = '&#9662;';

        summary.appendChild(titleText);
        summary.appendChild(icon);

        const content = document.createElement('div');
        content.className = 'settings-section__content';

        root.appendChild(summary);
        root.appendChild(content);

        return { root, content };
    }

    clearModuleExtension() {
        if (!this.moduleExtension) return;
        this.moduleExtension.innerHTML = '';
        this.moduleExtension.classList.add('hidden');
    }

    setModuleExtensionContent(html) {
        if (!this.moduleExtension) return;
        if (!html || !String(html).trim()) {
            this.clearModuleExtension();
            return;
        }
        this.moduleExtension.innerHTML = html;
        this.moduleExtension.classList.remove('hidden');
    }

    syncExternalPanels() {}

    teardown() {
        this.stopPreview();
        this.clearModuleExtension();
    }

    drawFrame(ctx, time) { console.warn("drawFrame method must be overridden"); }

    getPlaybackDuration() {
        return this.config.duration;
    }

    getExportTimeRange(options = {}) {
        const defaultEnd = Math.max(0.01, this.getPlaybackDuration());
        const startTime = Math.max(0, Number.isFinite(options?.startTime) ? options.startTime : 0);
        const rawEndTime = Number.isFinite(options?.endTime) ? options.endTime : defaultEnd;
        const endTime = Math.max(startTime + 0.01, rawEndTime);
        return { startTime, endTime };
    }

    getGifExportScale() {
        const requestedScale = Number.isFinite(this.exportSettings?.scale) ? this.exportSettings.scale : 1;
        const sourcePixels = Math.max(1, this.width * this.height);
        const maxGifPixels = 230400;
        const safeScale = Math.min(1, Math.sqrt(maxGifPixels / sourcePixels));
        return Math.max(0.25, Math.min(requestedScale, safeScale));
    }

    drawPreview() {
        this.stopPreview();
        this.updatePreviewTitle();
        this.ctx.fillStyle = this.config.backgroundColor;
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.drawFrame(this.ctx, 10); 
        this.syncExternalPanels();
    }

    playPreview() {
        this.stopPreview(); 
        this.isPlaying = true;
        let startTime = performance.now();
        const playbackDuration = Math.max(0.01, this.getPlaybackDuration());

        const animate = (timestamp) => {
            if (!this.isPlaying) return;
            const elapsedSeconds = (timestamp - startTime) / 1000;
            const frameTime = Math.min(elapsedSeconds, playbackDuration);
            this.ctx.fillStyle = this.config.backgroundColor;
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.drawFrame(this.ctx, frameTime);
            this.syncExternalPanels();

            if (elapsedSeconds < playbackDuration) {
                this.animationRef = requestAnimationFrame(animate);
            } else {
                this.isPlaying = false;
            }
        };
        this.animationRef = requestAnimationFrame(animate);
    }

    stopPreview() {
        this.isPlaying = false;
        if (this.animationRef) { cancelAnimationFrame(this.animationRef); this.animationRef = null; }
    }

    getSvgExportTime() {
        return Number.isFinite(this.inputs?.svgExportTime) ? this.inputs.svgExportTime : this.config.duration;
    }

    async exportSvg() {
        if (typeof C2S === 'undefined') {
            document.getElementById('status').innerText = "SVG Library Error!";
            return;
        }
        try {
            this.isSvgExporting = true;
            const svgContext = new C2S(this.width, this.height);
            if (typeof svgContext.setLineDash !== 'function') {
                svgContext.setLineDash = () => {};
            }
            svgContext.fillStyle = this.config.backgroundColor;
            svgContext.fillRect(0, 0, this.width, this.height);
            this.drawFrame(svgContext, this.getSvgExportTime());

            const svgString = svgContext.getSerializedSvg(true);
            const blob = new Blob([svgString], {type: "image/svg+xml;charset=utf-8"});
            const filename = "physics-diagram.svg";
            const fallbackDownload = () => {
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            };

            if (typeof window !== 'undefined' && typeof window.showSaveFilePicker === 'function') {
                try {
                    const handle = await window.showSaveFilePicker({
                        suggestedName: filename,
                        types: [{
                            description: 'SVG file',
                            accept: { 'image/svg+xml': ['.svg'] }
                        }]
                    });
                    const writable = await handle.createWritable();
                    await writable.write(blob);
                    await writable.close();
                } catch (pickerError) {
                    if (pickerError?.name === 'AbortError') throw pickerError;
                    console.warn('showSaveFilePicker failed, falling back to normal download:', pickerError);
                    fallbackDownload();
                }
            } else {
                fallbackDownload();
            }
        } catch (error) {
            console.error("SVG export failed:", error);
            const statusEl = document.getElementById('status');
            if (statusEl) {
                statusEl.innerText = `SVG export failed: ${error?.message || error}`;
            }
        } finally {
            this.isSvgExporting = false;
        }
    }

    async exportGif(progressCallback, options = {}) {
        const scale = this.getGifExportScale();
        const exportFps = this.exportSettings.fps;
        const quality = this.exportSettings.quality;
        const loopDelaySeconds = this.exportSettings.loopDelaySeconds || 0;
        const { startTime, endTime } = this.getExportTimeRange(options);

        const outW = Math.round(this.width * scale);
        const outH = Math.round(this.height * scale);

        // Use an offscreen canvas if scaling down
        let captureCanvas, captureCtx;
        if (scale < 1) {
            captureCanvas = document.createElement('canvas');
            captureCanvas.width = outW;
            captureCanvas.height = outH;
            captureCtx = captureCanvas.getContext('2d');
        } else {
            captureCanvas = this.canvas;
        }

        const frames = [];
        const totalDuration = Math.max(0.01, endTime - startTime);
        const totalFrames = Math.max(1, Math.ceil(exportFps * totalDuration));
        const delayFrames = Math.max(0, Math.round(exportFps * loopDelaySeconds));
        const timeStep = 1 / exportFps;

        for (let i = 0; i < totalFrames; i++) {
            const currentTime = Math.min(endTime, startTime + (i * timeStep));
            // Always render at full resolution on the main canvas
            this.ctx.fillStyle = this.config.backgroundColor;
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.drawFrame(this.ctx, currentTime);

            if (scale < 1) {
                // Scale down to offscreen canvas
                captureCtx.clearRect(0, 0, outW, outH);
                captureCtx.drawImage(this.canvas, 0, 0, outW, outH);
                frames.push(captureCanvas.toDataURL('image/png'));
            } else {
                frames.push(this.canvas.toDataURL('image/png'));
            }
        }

        if (delayFrames > 0 && frames.length > 0) {
            const finalFrame = frames[frames.length - 1];
            for (let i = 0; i < delayFrames; i++) {
                frames.push(finalFrame);
            }
        }

        return new Promise((resolve, reject) => {
            if (typeof gifshot === 'undefined') return reject(new Error("gifshot missing!"));
            gifshot.createGIF({
                images: frames,
                gifWidth: outW,
                gifHeight: outH,
                interval: 1 / exportFps,
                quality: quality,
                progressCallback: (cp) => { if (progressCallback) progressCallback(cp); }
            }, (obj) => {
                if (!obj.error) resolve(obj.image); else reject(obj.error);
            });
        });
    }

    async exportWebm(progressCallback, options = {}) {
        if (typeof MediaRecorder === 'undefined') {
            throw new Error('MediaRecorder is not supported in this browser.');
        }
        if (!this.canvas.captureStream) {
            throw new Error('Canvas captureStream is not supported in this browser.');
        }

        const scale = this.exportSettings.scale;
        const exportFps = this.exportSettings.fps;
        const loopDelaySeconds = this.exportSettings.loopDelaySeconds || 0;
        const { startTime, endTime } = this.getExportTimeRange(options);
        const outW = Math.round(this.width * scale);
        const outH = Math.round(this.height * scale);
        const totalDuration = Math.max(0.01, endTime - startTime);
        const totalFrames = Math.max(1, Math.ceil(exportFps * totalDuration));
        const delayFrames = Math.max(0, Math.round(exportFps * loopDelaySeconds));
        const timeStep = 1 / exportFps;
        const frameDelayMs = Math.max(8, Math.round(1000 / exportFps));
        const mimeType = [
            'video/webm;codecs=vp9',
            'video/webm;codecs=vp8',
            'video/webm'
        ].find(type => MediaRecorder.isTypeSupported(type)) || '';

        const recordCanvas = scale < 1 ? document.createElement('canvas') : this.canvas;
        const recordCtx = scale < 1 ? recordCanvas.getContext('2d') : null;
        if (scale < 1) {
            recordCanvas.width = outW;
            recordCanvas.height = outH;
        }

        const stream = recordCanvas.captureStream(0);
        const [track] = stream.getVideoTracks();
        const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
        const chunks = [];
        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        const requestFrame = () => {
            if (track?.requestFrame) track.requestFrame();
        };
        const renderFrame = (time) => {
            this.ctx.fillStyle = this.config.backgroundColor;
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.drawFrame(this.ctx, time);

            if (recordCtx) {
                recordCtx.clearRect(0, 0, outW, outH);
                recordCtx.drawImage(this.canvas, 0, 0, outW, outH);
            }
            requestFrame();
        };

        recorder.addEventListener('dataavailable', (event) => {
            if (event.data?.size) chunks.push(event.data);
        });

        const stopped = new Promise((resolve, reject) => {
            recorder.addEventListener('stop', resolve, { once: true });
            recorder.addEventListener('error', () => reject(recorder.error), { once: true });
        });

        recorder.start();

        try {
            for (let i = 0; i < totalFrames; i++) {
                renderFrame(Math.min(endTime, startTime + (i * timeStep)));
                if (progressCallback) progressCallback(i / Math.max(1, totalFrames + delayFrames));
                await sleep(frameDelayMs);
            }

            if (delayFrames > 0) {
                const finalTime = Math.max(startTime, endTime - timeStep);
                for (let i = 0; i < delayFrames; i++) {
                    renderFrame(finalTime);
                    if (progressCallback) progressCallback((totalFrames + i) / Math.max(1, totalFrames + delayFrames));
                    await sleep(frameDelayMs);
                }
            }
        } finally {
            if (recorder.state !== 'inactive') recorder.stop();
            track?.stop();
        }

        await stopped;
        if (progressCallback) progressCallback(1);

        return new Blob(chunks, { type: mimeType || 'video/webm' });
    }
}
