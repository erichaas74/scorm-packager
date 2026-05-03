// core/VectorPopup.js
// A reusable popup overlay that wraps VectorBreakdownAnimator.
// Any simulation module can call vectorPopup.open({ magnitude, angleDeg })
// to show an interactive vector resolution / addition overlay.

import { VectorBreakdownAnimator } from '../vector-breakdown-animator/vector-breakdown-animator.js';

const POPUP_STYLES = `
.vp-overlay {
  position: fixed; inset: 0; z-index: 9999;
  display: flex; align-items: center; justify-content: center;
  background: rgba(0,0,0,0.45); backdrop-filter: blur(6px);
  opacity: 0; transition: opacity 0.2s ease;
  pointer-events: none;
}
.vp-overlay.open { opacity: 1; pointer-events: auto; }

.vp-card {
  background: #fff; border: 1px solid #e4e7ec; border-radius: 1.25rem;
  width: 96vw; max-width: 780px; max-height: 94vh;
  display: flex; flex-direction: column; overflow: hidden;
  box-shadow: 0 24px 64px -12px rgba(0,0,0,0.2);
  transform: translateY(12px) scale(0.97);
  transition: transform 0.25s ease;
}
.vp-overlay.open .vp-card { transform: translateY(0) scale(1); }

.vp-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0.875rem 1.25rem; border-bottom: 1px solid #eef0f4;
  background: #f8f9fb;
}
.vp-header h3 {
  font-size: 0.85rem; font-weight: 800; color: #111827;
  letter-spacing: -0.01em; margin: 0;
}
.vp-close {
  width: 1.75rem; height: 1.75rem; border-radius: 0.5rem;
  border: 1px solid #e4e7ec; background: #fff; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: #6b7280; transition: all 0.15s;
}
.vp-close:hover { background: #f3f4f6; color: #111827; }

.vp-canvas-wrap {
  padding: 0.75rem; background: #1e293b; flex-shrink: 0;
}
.vp-canvas-wrap canvas {
  display: block; width: 100%; height: auto;
  border-radius: 0.5rem;
}

.vp-body { padding: 1rem 1.25rem; overflow-y: auto; }

.vp-row {
  display: flex; flex-wrap: wrap; gap: 0.75rem;
  align-items: center; margin-bottom: 0.75rem;
}

.vp-slider-group { flex: 1; min-width: 140px; }
.vp-slider-group label {
  display: block; font-size: 0.7rem; font-weight: 700;
  color: #6b7280; text-transform: uppercase; letter-spacing: 0.06em;
  margin-bottom: 0.25rem;
}
.vp-slider-group .vp-slider-row {
  display: flex; align-items: center; gap: 0.5rem;
}
.vp-slider-group input[type="range"] {
  flex: 1; accent-color: #4f46e5; height: 4px;
}
.vp-slider-group .vp-val {
  font-size: 0.8rem; font-weight: 700; color: #111827;
  min-width: 2.5rem; text-align: right;
  font-variant-numeric: tabular-nums;
}

.vp-btns { display: flex; gap: 0.375rem; flex-wrap: wrap; }
.vp-btn {
  display: inline-flex; align-items: center; gap: 0.375rem;
  font-size: 0.75rem; font-weight: 700; padding: 0.4rem 0.75rem;
  border-radius: 0.5rem; border: 1px solid #e4e7ec;
  background: #fff; color: #374151; cursor: pointer;
  transition: all 0.12s;
}
.vp-btn:hover { background: #f3f4f6; border-color: #d1d5db; }
.vp-btn.primary { background: #4f46e5; color: #fff; border-color: #4f46e5; }
.vp-btn.primary:hover { background: #4338ca; }

.vp-toggles {
  display: flex; flex-wrap: wrap; gap: 0.5rem 1rem;
}
.vp-toggle {
  display: flex; align-items: center; gap: 0.375rem;
  font-size: 0.75rem; font-weight: 600; color: #4b5563;
  cursor: pointer; user-select: none;
}
.vp-toggle input { accent-color: #4f46e5; width: 0.9rem; height: 0.9rem; }

.vp-math {
  margin-top: 0.5rem; padding: 0.75rem; border-radius: 0.625rem;
  background: #f8f9fb; border: 1px solid #eef0f4;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 0.75rem; line-height: 1.7; color: #374151;
}
.vp-math .x { color: #0ea5e9; font-weight: 700; }
.vp-math .y { color: #f97316; font-weight: 700; }
.vp-math .v { color: #e2e8f0; font-weight: 700; }
.vp-math .a { color: #a78bfa; font-weight: 700; }
.vp-math .h { color: #4f46e5; font-weight: 700; }

.vp-steps {
  margin-top: 0.5rem; display: flex; flex-wrap: wrap; gap: 0.25rem;
}
.vp-step {
  font-size: 0.65rem; font-weight: 600; padding: 0.2rem 0.5rem;
  border-radius: 0.375rem; background: #f3f4f6; color: #9ca3af;
}
.vp-step.active { background: #eef2ff; color: #4f46e5; }
.vp-step.done { background: #ecfdf5; color: #059669; }
`;

export default class VectorPopup {
  constructor() {
    this._overlay = null;
    this._animator = null;
    this._built = false;
    this._els = {};
    this._onKeydown = (e) => { if (e.key === 'Escape') this.close(); };
  }

  /** Open the popup with optional initial vector config.
   *  @param {object} config
   *  @param {number} [config.magnitude=10]
   *  @param {number} [config.angleDeg=35]
   *  @param {string} [config.title]  — optional header text
   */
  open(config = {}) {
    const { magnitude = 10, angleDeg = 35, title } = config;
    if (!this._built) this._build();

    // Set header
    if (title) this._els.title.textContent = title;

    // Update sliders
    this._els.magSlider.value = magnitude;
    this._els.angSlider.value = angleDeg;

    // Show overlay
    this._overlay.classList.add('open');
    document.addEventListener('keydown', this._onKeydown);

    // Resize canvas to fit, set vector, play
    requestAnimationFrame(() => {
      this._animator.resize();
      this._animator.setVectorPolar({ magnitude, angleDeg });
      this._animator.reset();
      this._animator.play();
      this._syncUI();
    });
  }

  close() {
    if (!this._overlay) return;
    this._animator.pause();
    this._overlay.classList.remove('open');
    document.removeEventListener('keydown', this._onKeydown);
  }

  get isOpen() {
    return this._overlay?.classList.contains('open') ?? false;
  }

  destroy() {
    this.close();
    if (this._animator) this._animator.destroy();
    if (this._style) this._style.remove();
    if (this._overlay) this._overlay.remove();
    this._built = false;
  }

  // ─── Internal ──────────────────────────────────────────────

  _build() {
    // Inject scoped styles
    this._style = document.createElement('style');
    this._style.textContent = POPUP_STYLES;
    document.head.appendChild(this._style);

    // Build DOM
    this._overlay = document.createElement('div');
    this._overlay.className = 'vp-overlay';
    this._overlay.innerHTML = `
      <div class="vp-card">
        <div class="vp-header">
          <h3 data-ref="title">Vector Breakdown</h3>
          <button class="vp-close" data-ref="closeBtn" aria-label="Close">&times;</button>
        </div>
        <div class="vp-canvas-wrap">
          <canvas data-ref="canvas" width="750" height="380"></canvas>
        </div>
        <div class="vp-body">
          <div class="vp-row">
            <div class="vp-slider-group">
              <label>Magnitude</label>
              <div class="vp-slider-row">
                <input type="range" data-ref="magSlider" min="0.5" max="20" step="0.5" value="10">
                <span class="vp-val" data-ref="magVal">10</span>
              </div>
            </div>
            <div class="vp-slider-group">
              <label>Angle (°)</label>
              <div class="vp-slider-row">
                <input type="range" data-ref="angSlider" min="0" max="360" step="1" value="35">
                <span class="vp-val" data-ref="angVal">35°</span>
              </div>
            </div>
          </div>
          <div class="vp-row">
            <div class="vp-btns">
              <button class="vp-btn primary" data-ref="playBtn">&#9654; Play</button>
              <button class="vp-btn" data-ref="stepBtn">Step &rarr;</button>
              <button class="vp-btn" data-ref="resetBtn">Reset</button>
            </div>
          </div>
          <div class="vp-toggles" data-ref="toggles">
            <label class="vp-toggle"><input type="checkbox" data-key="showComponents" checked> Components</label>
            <label class="vp-toggle"><input type="checkbox" data-key="showTrig" checked> Trig</label>
            <label class="vp-toggle"><input type="checkbox" data-key="showAngle" checked> Angle</label>
            <label class="vp-toggle"><input type="checkbox" data-key="showGrid" checked> Grid</label>
            <label class="vp-toggle"><input type="checkbox" data-key="showAxes" checked> Axes</label>
            <label class="vp-toggle"><input type="checkbox" data-key="showSideLabels" checked> Labels</label>
          </div>
          <div class="vp-steps" data-ref="stepList"></div>
          <div class="vp-math" data-ref="mathBox"></div>
        </div>
      </div>
    `;

    document.body.appendChild(this._overlay);

    // Collect refs
    this._overlay.querySelectorAll('[data-ref]').forEach(el => {
      this._els[el.dataset.ref] = el;
    });

    // Create animator
    this._animator = new VectorBreakdownAnimator(this._els.canvas, {
      vector: { magnitude: 10, angleDeg: 35 },
      display: {
        showTrig: true, showComponents: true, showAxes: true,
        showGrid: true, showAngle: true, showInstructionBar: true,
        showValueCards: true, showSideLabels: true,
      },
    });

    // Wire events
    this._els.closeBtn.addEventListener('click', () => this.close());
    this._overlay.addEventListener('click', (e) => {
      if (e.target === this._overlay) this.close();
    });

    this._els.playBtn.addEventListener('click', () => {
      if (this._animator.state.playing) {
        this._animator.pause();
      } else {
        this._animator.play();
      }
      this._syncUI();
    });

    this._els.stepBtn.addEventListener('click', () => {
      this._animator.nextStep();
      this._syncUI();
    });

    this._els.resetBtn.addEventListener('click', () => {
      this._animator.reset();
      this._animator.play();
      this._syncUI();
    });

    this._els.magSlider.addEventListener('input', () => this._applySliders());
    this._els.angSlider.addEventListener('input', () => this._applySliders());

    this._els.toggles.addEventListener('change', () => this._applyToggles());

    this._animator.onStateChange = () => this._syncUI();

    // Handle resize
    this._resizeHandler = () => { if (this.isOpen) this._animator.resize(); };
    window.addEventListener('resize', this._resizeHandler);

    this._built = true;
  }

  _applySliders() {
    this._animator.setVectorPolar({
      magnitude: Number(this._els.magSlider.value),
      angleDeg: Number(this._els.angSlider.value),
    });
    this._syncUI();
  }

  _applyToggles() {
    const display = {};
    this._els.toggles.querySelectorAll('input[data-key]').forEach(cb => {
      display[cb.dataset.key] = cb.checked;
    });
    this._animator.setOptions({ display });
    this._syncUI();
  }

  _syncUI() {
    const c = this._animator.getComponents();

    // Slider readouts
    this._els.magVal.textContent = c.magnitude.toFixed(1).replace(/\.0$/, '');
    this._els.angVal.textContent = `${c.angleDeg.toFixed(0)}°`;

    // Play button label
    const a = this._animator;
    const finished = a.state.stepIndex >= a.stages.length - 1 && a.state.stepProgress >= 1;
    this._els.playBtn.innerHTML = a.state.playing
      ? '&#10074;&#10074; Pause'
      : finished ? '&#9654; Replay' : '&#9654; Play';

    // Steps
    this._els.stepList.innerHTML = '';
    a.stages.forEach((stage, i) => {
      const span = document.createElement('span');
      span.className = 'vp-step' +
        (i === a.state.stepIndex ? ' active' : '') +
        (i < a.state.stepIndex ? ' done' : '');
      span.textContent = stage.label;
      this._els.stepList.appendChild(span);
    });

    // Math box
    this._renderMath(c);
  }

  _renderMath(c) {
    const d = this._animator.options.display;
    if (d.showTrig) {
      const sinVal = c.magnitude === 0 ? 0 : c.y / c.magnitude;
      const cosVal = c.magnitude === 0 ? 0 : c.x / c.magnitude;
      const tanVal = Math.abs(c.x) < 0.0001 ? 'undef' : (c.y / c.x).toFixed(2);
      this._els.mathBox.innerHTML = `
        <div><span class="h">sin θ</span> = opp/hyp = <span class="y">Vy</span>/<span class="v">V</span> = ${c.y.toFixed(2)}/${c.magnitude.toFixed(2)} = <span class="h">${sinVal.toFixed(2)}</span></div>
        <div><span class="h">cos θ</span> = adj/hyp = <span class="x">Vx</span>/<span class="v">V</span> = ${c.x.toFixed(2)}/${c.magnitude.toFixed(2)} = <span class="h">${cosVal.toFixed(2)}</span></div>
        <div><span class="h">tan θ</span> = opp/adj = <span class="y">Vy</span>/<span class="x">Vx</span> = ${c.y.toFixed(2)}/${c.x.toFixed(2)} = <span class="h">${tanVal}</span></div>
        <div style="margin-top:6px"><span class="x">Vx</span> = <span class="v">V</span> cos(<span class="a">θ</span>) = ${c.magnitude.toFixed(1)} cos(${c.angleDeg.toFixed(0)}°) = <span class="x">${c.x.toFixed(2)}</span></div>
        <div><span class="y">Vy</span> = <span class="v">V</span> sin(<span class="a">θ</span>) = ${c.magnitude.toFixed(1)} sin(${c.angleDeg.toFixed(0)}°) = <span class="y">${c.y.toFixed(2)}</span></div>
      `;
    } else if (d.showComponents) {
      this._els.mathBox.innerHTML = `
        <div><span class="x">Vx</span> = <span class="x">${c.x.toFixed(2)}</span></div>
        <div><span class="y">Vy</span> = <span class="y">${c.y.toFixed(2)}</span></div>
        <div><span class="v">|V|</span> = ${c.magnitude.toFixed(1)} at ${c.angleDeg.toFixed(0)}°</div>
      `;
    } else {
      this._els.mathBox.textContent = 'Enable components or trig to see the math.';
    }
  }
}
