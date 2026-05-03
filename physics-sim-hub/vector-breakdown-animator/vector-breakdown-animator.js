export class VectorBreakdownAnimator {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onStateChange = null;
    this._destroyed = false;

    this.options = {
      vector: { magnitude: 10, angleDeg: 35 },
      display: {
        showTrig: true,
        showComponents: true,
        showAxes: true,
        showGrid: true,
        showAngle: true,
        showInstructionBar: true,
        showValueCards: true,
        showSideLabels: true
      },
      trigGuide: {
        activePair: null,
        activeFunction: null,
        showHighlight: true,
        showLabels: true
      },
      pxPerUnit: 34,
      stepDuration: 900,
      originX: null,
      originY: null,
      colors: {
        vector: '#f8fafc',
        x: '#38bdf8',
        y: '#f97316',
        angle: '#a78bfa',
        axis: '#64748b',
        grid: 'rgba(148, 163, 184, 0.12)',
        highlight: '#fde047'
      }
    };

    this.state = {
      playing: false,
      stepIndex: 0,
      stepProgress: 0,
      lastTime: 0
    };

    this._animate = this._animate.bind(this);
    this.setOptions(options, false);
    this.resize();
    requestAnimationFrame(this._animate);
  }

  setOptions(partial = {}, shouldReset = true) {
    if (partial.vector) this.options.vector = { ...this.options.vector, ...partial.vector };
    if (partial.display) this.options.display = { ...this.options.display, ...partial.display };
    if (partial.trigGuide) this.options.trigGuide = { ...this.options.trigGuide, ...partial.trigGuide };
    if (partial.colors) this.options.colors = { ...this.options.colors, ...partial.colors };
    if (typeof partial.pxPerUnit === 'number') this.options.pxPerUnit = partial.pxPerUnit;
    if (typeof partial.stepDuration === 'number') this.options.stepDuration = partial.stepDuration;
    if (typeof partial.originX === 'number' || partial.originX === null) this.options.originX = partial.originX;
    if (typeof partial.originY === 'number' || partial.originY === null) this.options.originY = partial.originY;

    this._normalizeVector();
    this._rebuildStages();
    if (shouldReset) this.reset();
    this._notify();
  }

  setVectorPolar({ magnitude, angleDeg }) {
    if (typeof magnitude === 'number') this.options.vector.magnitude = magnitude;
    if (typeof angleDeg === 'number') this.options.vector.angleDeg = angleDeg;
    this._normalizeVector();
    this.reset();
    this._notify();
  }

  setVectorCartesian({ x, y }) {
    const magnitude = Math.sqrt(x * x + y * y);
    const angleDeg = Math.atan2(y, x) * 180 / Math.PI;
    this.options.vector.magnitude = magnitude;
    this.options.vector.angleDeg = angleDeg;
    this.reset();
    this._notify();
  }

  setTrigGuide(partial = {}) {
    this.options.trigGuide = { ...this.options.trigGuide, ...partial };
    this._notify();
  }

  clearTrigGuide() {
    this.options.trigGuide = {
      ...this.options.trigGuide,
      activePair: null,
      activeFunction: null
    };
    this._notify();
  }

  getComponents() {
    const angleRad = this.options.vector.angleDeg * Math.PI / 180;
    return {
      magnitude: this.options.vector.magnitude,
      angleDeg: this.options.vector.angleDeg,
      angleRad,
      x: this.options.vector.magnitude * Math.cos(angleRad),
      y: this.options.vector.magnitude * Math.sin(angleRad)
    };
  }

  play() {
    if (!this.stages.length) return;
    if (this.state.stepIndex >= this.stages.length - 1 && this.state.stepProgress >= 1) {
      this.state.stepIndex = 0;
      this.state.stepProgress = 0;
    }
    this.state.playing = true;
    this._notify();
  }

  pause() {
    this.state.playing = false;
    this._notify();
  }

  reset() {
    this.state.playing = false;
    this.state.stepIndex = 0;
    this.state.stepProgress = 0;
    this._notify();
  }

  nextStep() {
    this.state.playing = false;
    if (this.state.stepIndex < this.stages.length - 1) {
      this.state.stepIndex += 1;
      this.state.stepProgress = 0;
    } else {
      this.state.stepIndex = Math.max(0, this.stages.length - 1);
      this.state.stepProgress = 1;
    }
    this._notify();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    this.canvas.width = Math.round(rect.width * ratio);
    this.canvas.height = Math.round(rect.height * ratio);
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    this.layout = {
      w: rect.width,
      h: rect.height,
      originX: this.options.originX ?? Math.max(110, rect.width * 0.18),
      originY: this.options.originY ?? Math.min(rect.height - 115, rect.height * 0.78)
    };
  }

  destroy() {
    this._destroyed = true;
  }

  _normalizeVector() {
    if (!Number.isFinite(this.options.vector.magnitude)) this.options.vector.magnitude = 10;
    if (!Number.isFinite(this.options.vector.angleDeg)) this.options.vector.angleDeg = 35;
    this.options.vector.magnitude = Math.max(0, this.options.vector.magnitude);
  }

  _rebuildStages() {
    const display = this.options.display;
    const stages = [{ id: 'vector', label: 'Draw the original vector.' }];
    if (display.showAngle) stages.push({ id: 'angle', label: 'Show the reference angle from the positive x-axis.' });
    if (display.showComponents) {
      stages.push({ id: 'x', label: 'Project to the x direction to show the adjacent side.' });
      stages.push({ id: 'y', label: 'Build the y direction to show the opposite side.' });
      stages.push({ id: 'triangle', label: 'Reveal the right triangle and the trig side names.' });
    }
    if (display.showTrig) stages.push({ id: 'trig', label: 'Show SOH-CAH-TOA and connect it to the vector.' });
    if (display.showComponents || display.showTrig || display.showValueCards) {
      stages.push({ id: 'final', label: 'Display the final values and relationships.' });
    }
    this.stages = stages;
    if (this.state.stepIndex >= this.stages.length) {
      this.state.stepIndex = Math.max(0, this.stages.length - 1);
      this.state.stepProgress = 0;
    }
  }

  _notify() {
    if (typeof this.onStateChange === 'function') this.onStateChange(this);
  }

  _stageProgress(id) {
    const index = this.stages.findIndex(stage => stage.id === id);
    if (index === -1) return 0;
    if (this.state.stepIndex > index) return 1;
    if (this.state.stepIndex < index) return 0;
    return this._ease(this.state.stepProgress);
  }

  _ease(t) {
    const c = Math.max(0, Math.min(1, t));
    return 1 - Math.pow(1 - c, 3);
  }

  _lerp(a, b, t) {
    return a + (b - a) * t;
  }

  _drawArrow(x1, y1, x2, y2, color, width = 4, alpha = 1) {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const head = 14;
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - head * Math.cos(angle - Math.PI / 7), y2 - head * Math.sin(angle - Math.PI / 7));
    ctx.lineTo(x2 - head * Math.cos(angle + Math.PI / 7), y2 - head * Math.sin(angle + Math.PI / 7));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  _drawLine(x1, y1, x2, y2, color, width = 4, alpha = 1) {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  _drawDashedLine(x1, y1, x2, y2, color, alpha = 1) {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  _roundRect(x, y, w, h, r) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  _drawLabel(text, x, y, color, bg = 'rgba(15, 23, 42, 0.85)') {
    const ctx = this.ctx;
    ctx.save();
    ctx.font = '700 18px Arial';
    const metrics = ctx.measureText(text);
    const w = metrics.width + 20;
    const h = 32;
    ctx.fillStyle = bg;
    this._roundRect(x - w / 2, y - h / 2, w, h, 10);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.fillText(text, x - metrics.width / 2, y + 6);
    ctx.restore();
  }

  _drawGrid() {
    const ctx = this.ctx;
    const { w, h } = this.layout;
    ctx.save();
    ctx.strokeStyle = this.options.colors.grid;
    ctx.lineWidth = 1;
    for (let x = 0; x <= w; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  _drawAxes() {
    const { w, h, originX: ox, originY: oy } = this.layout;
    const ctx = this.ctx;
    const axisColor = this.options.colors.axis;
    this._drawArrow(60, oy, w - 55, oy, axisColor, 2.5, 1);
    this._drawArrow(ox, h - 60, ox, 55, axisColor, 2.5, 1);

    ctx.save();
    ctx.strokeStyle = axisColor;
    ctx.fillStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.font = '700 20px Arial';
    ctx.fillText('x', w - 40, oy - 10);
    ctx.fillText('y', ox + 12, 76);
    ctx.fillText('O', ox - 28, oy + 28);

    ctx.font = '12px Arial';
    const scale = this.options.pxPerUnit;
    for (let i = -12; i <= 12; i++) {
      if (i === 0) continue;
      const x = ox + i * scale;
      if (x > 54 && x < w - 54) {
        ctx.beginPath();
        ctx.moveTo(x, oy - 5);
        ctx.lineTo(x, oy + 5);
        ctx.stroke();
        ctx.fillText(String(i), x - 6, oy + 20);
      }
    }
    for (let i = -8; i <= 8; i++) {
      if (i === 0) continue;
      const y = oy - i * scale;
      if (y > 54 && y < h - 54) {
        ctx.beginPath();
        ctx.moveTo(ox - 5, y);
        ctx.lineTo(ox + 5, y);
        ctx.stroke();
        ctx.fillText(String(i), ox - 22, y + 4);
      }
    }
    ctx.restore();
  }

  _drawAngleArc(ox, oy, angleRad, alpha = 1) {
    const ctx = this.ctx;
    const canvasAngle = -angleRad;
    const radius = 72;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = this.options.colors.angle;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(ox, oy, radius, 0, canvasAngle, canvasAngle < 0);
    ctx.stroke();

    const labelAngle = canvasAngle / 2;
    const lx = ox + Math.cos(labelAngle) * (radius + 22);
    const ly = oy + Math.sin(labelAngle) * (radius + 22);
    ctx.fillStyle = '#ddd6fe';
    ctx.font = '700 22px Arial';
    ctx.fillText('θ', lx - 6, ly + 6);
    ctx.restore();
  }

  _drawTriangleFill(ox, oy, px, py, alpha = 1) {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(px, oy);
    ctx.lineTo(px, py);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  _drawRightAngleMarker(cornerX, cornerY, xSign, ySign, alpha = 1) {
    const ctx = this.ctx;
    const size = 18;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cornerX, cornerY + ySign * size);
    ctx.lineTo(cornerX + xSign * size, cornerY + ySign * size);
    ctx.lineTo(cornerX + xSign * size, cornerY);
    ctx.stroke();
    ctx.restore();
  }

  _drawEquationOverlay(alpha) {
    const ctx = this.ctx;
    const x = 34 + (1 - alpha) * 20;
    const y = 28;
    const w = 386;
    const h = 182;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.24)';
    ctx.lineWidth = 1.5;
    this._roundRect(x, y, w, h, 16);
    ctx.fill();
    ctx.stroke();
    ctx.font = '700 18px Arial';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText('SOH-CAH-TOA', x + 16, y + 28);
    ctx.font = '700 18px Arial';
    ctx.fillStyle = '#fde047';
    ctx.fillText('sin θ = opp / hyp', x + 16, y + 62);
    ctx.fillStyle = '#93c5fd';
    ctx.fillText('cos θ = adj / hyp', x + 16, y + 92);
    ctx.fillStyle = '#fdba74';
    ctx.fillText('tan θ = opp / adj', x + 16, y + 122);
    ctx.fillStyle = '#e5e7eb';
    ctx.font = '700 17px Arial';
    ctx.fillText('For vectors: hyp = V, adj = Vx, opp = Vy', x + 16, y + 154);
    ctx.restore();
  }

  _drawValueCards(alpha, components) {
    if (!this.options.display.showValueCards) return;
    const ctx = this.ctx;
    const x = this.layout.w - 235;
    const y = 50 + (1 - alpha) * 18;
    const cards = [
      { label: 'Vector', value: components.magnitude.toFixed(1), color: this.options.colors.vector }
    ];
    if (this.options.display.showComponents) {
      cards.push({ label: 'Vx / adj', value: components.x.toFixed(2), color: this.options.colors.x });
      cards.push({ label: 'Vy / opp', value: components.y.toFixed(2), color: this.options.colors.y });
    }

    ctx.save();
    ctx.globalAlpha = alpha;
    cards.forEach((card, i) => {
      const cy = y + i * 76;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)';
      ctx.lineWidth = 1.5;
      this._roundRect(x, cy, 188, 58, 14);
      ctx.fill();
      ctx.stroke();
      ctx.font = '700 15px Arial';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText(card.label, x + 14, cy + 24);
      ctx.font = '700 24px Arial';
      ctx.fillStyle = card.color;
      ctx.fillText(card.value, x + 14, cy + 46);
    });
    ctx.restore();
  }

  _drawInstructionBar() {
    if (!this.options.display.showInstructionBar || this.stages.length === 0) return;
    const ctx = this.ctx;
    const text = this.stages[this.state.stepIndex]?.label || '';
    const x = 22;
    const y = this.layout.h - 74;
    const w = this.layout.w - 44;
    const h = 44;
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.18)';
    ctx.lineWidth = 1.5;
    this._roundRect(x, y, w, h, 14);
    ctx.fill();
    ctx.stroke();
    ctx.font = '700 18px Arial';
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(`Step ${this.state.stepIndex + 1}: ${text}`, x + 16, y + 28);
    ctx.restore();
  }

  _drawTrigSideLabels(ox, oy, projX, endY, endX, components, alpha = 1) {
    const showLabels = this.options.display.showSideLabels || this.options.trigGuide.showLabels;
    if (!showLabels) return;

    const guide = this.options.trigGuide;
    const activePair = Array.isArray(guide.activePair) ? guide.activePair : [];
    const highlightColor = this.options.colors.highlight;

    const sideMap = {
      hyp: {
        p1: { x: ox, y: oy },
        p2: { x: endX, y: endY },
        label: 'hyp',
        lx: (ox + endX) / 2 + 30,
        ly: (oy + endY) / 2 - 20,
        baseColor: this.options.colors.vector
      },
      adj: {
        p1: { x: ox, y: oy },
        p2: { x: projX, y: oy },
        label: 'adj',
        lx: (ox + projX) / 2,
        ly: oy + (components.y >= 0 ? 48 : -48),
        baseColor: this.options.colors.x
      },
      opp: {
        p1: { x: projX, y: oy },
        p2: { x: projX, y: endY },
        label: 'opp',
        lx: projX + (components.x >= 0 ? 48 : -48),
        ly: (oy + endY) / 2,
        baseColor: this.options.colors.y
      }
    };

    for (const key of Object.keys(sideMap)) {
      const side = sideMap[key];
      if (activePair.includes(key) && guide.showHighlight) {
        this._drawLine(side.p1.x, side.p1.y, side.p2.x, side.p2.y, highlightColor, 12, 0.35 * alpha);
      }
    }

    for (const key of Object.keys(sideMap)) {
      const side = sideMap[key];
      const labelColor = activePair.includes(key) ? highlightColor : side.baseColor;
      const bg = activePair.includes(key) ? 'rgba(82, 68, 3, 0.82)' : 'rgba(15, 23, 42, 0.85)';
      this._drawLabel(side.label, side.lx, side.ly, labelColor, bg);
    }
  }

  _drawScene() {
    const ctx = this.ctx;
    const { w, h, originX: ox, originY: oy } = this.layout;
    ctx.clearRect(0, 0, w, h);

    if (this.options.display.showGrid) this._drawGrid();
    if (this.options.display.showAxes) this._drawAxes();

    const components = this.getComponents();
    const scale = this.options.pxPerUnit;
    const xPx = components.x * scale;
    const yPx = components.y * scale;
    const endX = ox + xPx;
    const endY = oy - yPx;
    const projX = ox + xPx;
    const projY = oy;

    const vectorT = this._stageProgress('vector');
    const angleT = this._stageProgress('angle');
    const xT = this._stageProgress('x');
    const yT = this._stageProgress('y');
    const triangleT = this._stageProgress('triangle');
    const trigT = this._stageProgress('trig');
    const finalT = this._stageProgress('final');

    const currentEndX = this._lerp(ox, endX, vectorT);
    const currentEndY = this._lerp(oy, endY, vectorT);

    if (vectorT > 0.001) {
      this._drawArrow(ox, oy, currentEndX, currentEndY, this.options.colors.vector, 5, 1);
    }
    if (vectorT >= 0.98) {
      this._drawLabel('V', (ox + endX) / 2 + 24, (oy + endY) / 2 - 18, this.options.colors.vector);
    }

    if (this.options.display.showAngle && angleT > 0.001) {
      this._drawAngleArc(ox, oy, components.angleRad * angleT, 1);
    }

    if (this.options.display.showComponents && xT > 0.001) {
      const currentX = this._lerp(ox, projX, xT);
      this._drawArrow(ox, oy, currentX, oy, this.options.colors.x, 5, 1);
      if (xT > 0.6) {
        this._drawLabel('Vx', (ox + projX) / 2, oy + (components.y >= 0 ? 42 : -42), this.options.colors.x);
      }
    }

    if (this.options.display.showComponents && yT > 0.001) {
      const currentY = this._lerp(oy, endY, yT);
      this._drawArrow(projX, oy, projX, currentY, this.options.colors.y, 5, 1);
      if (yT > 0.6) {
        this._drawLabel('Vy', projX + (components.x >= 0 ? 44 : -44), (oy + endY) / 2, this.options.colors.y);
      }
    }

    const trigGuideActive = Array.isArray(this.options.trigGuide.activePair) && this.options.trigGuide.activePair.length > 0;
    if ((this.options.display.showComponents && triangleT > 0.001) || trigGuideActive) {
      const alpha = this.options.display.showComponents ? Math.max(0.45, triangleT) : 1;
      this._drawTriangleFill(ox, oy, projX, endY, 0.9 * alpha);
      this._drawDashedLine(endX, endY, projX, projY, '#94a3b8', 0.75 * alpha);
      const xSign = components.x >= 0 ? -1 : 1;
      const ySign = components.y >= 0 ? -1 : 1;
      this._drawRightAngleMarker(projX, projY, xSign, ySign, alpha);
      this._drawTrigSideLabels(ox, oy, projX, endY, endX, components, alpha);
    }

    if (this.options.display.showTrig && trigT > 0.05) {
      this._drawEquationOverlay(trigT);
    }

    if (finalT > 0.05) {
      this._drawValueCards(finalT, components);
    }

    this._drawInstructionBar();
  }

  _animate(time) {
    if (this._destroyed) return;
    if (!this.state.lastTime) this.state.lastTime = time;
    const dt = time - this.state.lastTime;
    this.state.lastTime = time;

    if (this.state.playing) {
      this.state.stepProgress += dt / this.options.stepDuration;
      if (this.state.stepProgress >= 1) {
        if (this.state.stepIndex < this.stages.length - 1) {
          this.state.stepIndex += 1;
          this.state.stepProgress = 0;
        } else {
          this.state.stepIndex = Math.max(0, this.stages.length - 1);
          this.state.stepProgress = 1;
          this.state.playing = false;
        }
        this._notify();
      }
    }

    this._drawScene();
    requestAnimationFrame(this._animate);
  }
}