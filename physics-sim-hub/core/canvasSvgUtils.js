export function normalizeCanvasText(text) {
    return String(text ?? '')
        .replace(/ÃŽÂ¸/g, 'θ')
        .replace(/Î¸/g, 'θ')
        .replace(/Ã‚Â°/g, '°')
        .replace(/Â°/g, '°')
        .replace(/\bV0(?=\b|[A-Za-z])/g, 'V₀')
        .replace(/\bv0(?=\b|[A-Za-z])/g, 'v₀')
        .replace(/\btheta\b/g, 'θ')
        .replace(/\bdeg\b/g, '°');
}

export function patchC2SContext(ctx) {
    if (typeof ctx.setLineDash !== 'function') ctx.setLineDash = () => {};

    ctx.roundRect = function(x, y, w, h, r) {
        const rv = Array.isArray(r) ? r[0] : (r || 0);
        const radius = Math.min(rv, Math.abs(w) / 2, Math.abs(h) / 2);
        this.moveTo(x + radius, y);
        this.lineTo(x + w - radius, y);
        this.quadraticCurveTo(x + w, y, x + w, y + radius);
        this.lineTo(x + w, y + h - radius);
        this.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
        this.lineTo(x + radius, y + h);
        this.quadraticCurveTo(x, y + h, x, y + h - radius);
        this.lineTo(x, y + radius);
        this.quadraticCurveTo(x, y, x + radius, y);
        this.closePath();
    };

    ['fillText', 'strokeText'].forEach((method) => {
        const orig = ctx[method];
        if (typeof orig !== 'function') return;
        ctx[method] = function(text, x, y, mw) {
            const saved = this.font;
            if (saved && saved.includes("'")) this.font = saved.replace(/'/g, '"');
            orig.call(this, normalizeCanvasText(text), x, y, mw);
            this.font = saved;
        };
    });

    const measureText = ctx.measureText;
    if (typeof measureText === 'function') {
        ctx.measureText = function(text) {
            return measureText.call(this, normalizeCanvasText(text));
        };
    }

    ['fillRect', 'strokeRect', 'clearRect'].forEach((method) => {
        const orig = ctx[method];
        if (typeof orig !== 'function') return;
        ctx[method] = function(x, y, w, h) {
            if (w < 0) { x += w; w = -w; }
            if (h < 0) { y += h; h = -h; }
            orig.call(this, x, y, w, h);
        };
    });
}
