// core/SimulationGifMaker.js
export default class SimulationGifMaker {
    constructor(canvasId, config = {}) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.config = Object.assign({ fps: 30, duration: 4, backgroundColor: '#f8fafc' }, config);
        this.inputs = {};
        this.animationRef = null;
        this.isPlaying = false;

        // GIF export settings with defaults
        this.exportSettings = { scale: 1.0, fps: this.config.fps, quality: 10 };
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

    setupInputs(containerId, configGroups) {
        const container = document.getElementById(containerId);
        container.innerHTML = ''; 

        for (const [groupName, inputs] of Object.entries(configGroups)) {
            const header = document.createElement('h3');
            header.innerText = groupName;
            container.appendChild(header);

            for (const [key, def] of Object.entries(inputs)) {
                this.inputs[key] = def.value; 
                const wrapper = document.createElement('div');
                const label = document.createElement('label');
                label.innerText = def.label;

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
                } else {
                    wrapper.className = "flex flex-col gap-1.5 mb-4";
                    inputElement = document.createElement('input');
                    inputElement.type = 'number';
                    inputElement.value = def.value;
                    if (def.step) inputElement.step = def.step;
                    inputElement.addEventListener('input', (e) => { this.inputs[key] = parseFloat(e.target.value) || 0; this.drawPreview(); });
                }

                wrapper.appendChild(label);
                wrapper.appendChild(inputElement);
                if (def.type === 'checkbox') wrapper.insertBefore(label, inputElement);
                container.appendChild(wrapper);
            }
        }

        // Auto-append GIF Export Settings
        this._buildExportSettingsUI(container);
    }

    _buildExportSettingsUI(container) {
        const header = document.createElement('h3');
        header.innerText = 'GIF Export Settings';
        container.appendChild(header);

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
            }
        };

        const sizeEstimate = document.createElement('div');
        sizeEstimate.id = '_gifSizeEstimate';
        sizeEstimate.style.cssText = 'font-size:0.75rem; color:#6b7280; font-weight:600; padding:0.5rem 0.75rem; background:#f3f4f6; border-radius:0.5rem; margin-bottom:0.5rem;';

        const updateEstimate = () => {
            const scaleVal = this.exportSettings.scale;
            const fpsVal = this.exportSettings.fps;
            const w = Math.round(this.width * scaleVal);
            const h = Math.round(this.height * scaleVal);
            const totalFrames = fpsVal * this.config.duration;
            sizeEstimate.innerHTML = `Output: ${w}×${h} &middot; ${totalFrames} frames &middot; ${fpsVal} fps`;
        };

        for (const [key, def] of Object.entries(exportInputs)) {
            const wrapper = document.createElement('div');
            wrapper.className = 'flex flex-col gap-1.5 mb-4';
            const label = document.createElement('label');
            label.innerText = def.label;

            const select = document.createElement('select');
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
                }
                updateEstimate();
            });

            wrapper.appendChild(label);
            wrapper.appendChild(select);
            container.appendChild(wrapper);
        }

        container.appendChild(sizeEstimate);
        updateEstimate();
    }

    drawFrame(ctx, time) { console.warn("drawFrame method must be overridden"); }

    drawPreview() {
        this.stopPreview();
        this.ctx.fillStyle = this.config.backgroundColor;
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.drawFrame(this.ctx, 10); 
    }

    playPreview() {
        this.stopPreview(); 
        this.isPlaying = true;
        let startTime = performance.now();

        const animate = (timestamp) => {
            if (!this.isPlaying) return;
            const elapsedSeconds = (timestamp - startTime) / 1000;
            this.ctx.fillStyle = this.config.backgroundColor;
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.drawFrame(this.ctx, elapsedSeconds);

            if (elapsedSeconds < this.config.duration) {
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

    exportSvg() {
        if (typeof C2S === 'undefined') {
            document.getElementById('status').innerText = "SVG Library Error!";
            return;
        }
        const svgContext = new C2S(this.width, this.height);
        svgContext.fillStyle = this.config.backgroundColor;
        svgContext.fillRect(0, 0, this.width, this.height);
        this.drawFrame(svgContext, 10); 

        const svgString = svgContext.getSerializedSvg(true);
        const blob = new Blob([svgString], {type: "image/svg+xml;charset=utf-8"});
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = "physics-diagram.svg";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    async exportGif(progressCallback) {
        const scale = this.exportSettings.scale;
        const exportFps = this.exportSettings.fps;
        const quality = this.exportSettings.quality;

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
        const totalFrames = exportFps * this.config.duration;
        const timeStep = 1 / exportFps;

        for (let i = 0; i < totalFrames; i++) {
            const currentTime = i * timeStep;
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
}
