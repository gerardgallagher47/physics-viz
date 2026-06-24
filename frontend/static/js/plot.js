// Minimal time-series plot for x(t) using Canvas 2D

class TimePlot {
  constructor(canvasEl, opts = {}) {
    this.canvas  = canvasEl;
    this.ctx     = canvasEl.getContext('2d');
    this.maxPts  = opts.maxPts  || 1000;
    this.yMin    = opts.yMin    !== undefined ? opts.yMin : -0.05;
    this.yMax    = opts.yMax    !== undefined ? opts.yMax : 0.15;
    this.color   = opts.color   || '#2980b9';
    this.data    = []; // [{t, x}]
    this.eqX     = null;
  }

  push(t, x) {
    this.data.push({ t, x });
    if (this.data.length > this.maxPts) this.data.shift();
  }

  setEquilibrium(xEq) { this.eqX = xEq; }

  clear() { this.data = []; }

  draw() {
    const { canvas, ctx, data } = this;
    const W = canvas.width, H = canvas.height;
    const padL = 48, padR = 12, padT = 12, padB = 30;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;

    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = '#f9f9f9';
    ctx.fillRect(padL, padT, plotW, plotH);

    // Grid lines
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    const yTicks = 5;
    for (let i = 0; i <= yTicks; i++) {
      const y = padT + (i / yTicks) * plotH;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + plotW, y);
      ctx.stroke();
      const val = this.yMax - (i / yTicks) * (this.yMax - this.yMin);
      ctx.fillStyle = '#888';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(val.toFixed(3), padL - 4, y + 4);
    }

    // Equilibrium line
    if (this.eqX !== null) {
      const yPx = this._yToPx(this.eqX, padT, plotH);
      ctx.strokeStyle = '#27ae60';
      ctx.setLineDash([4, 3]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(padL, yPx);
      ctx.lineTo(padL + plotW, yPx);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#27ae60';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('x_eq', padL + 4, yPx - 3);
    }

    if (data.length < 2) return;

    const tMin = data[0].t;
    const tMax = Math.max(data[data.length - 1].t, tMin + 0.001);

    // Data line
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.beginPath();
    data.forEach((pt, i) => {
      const px = padL + ((pt.t - tMin) / (tMax - tMin)) * plotW;
      const py = this._yToPx(pt.x, padT, plotH);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    });
    ctx.stroke();

    // Axes labels
    ctx.fillStyle = '#555';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('x (m)', padL + plotW / 2, H - 4);
    ctx.save();
    ctx.translate(12, padT + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('t (s)', 0, 0);
    ctx.restore();
  }

  _yToPx(val, padT, plotH) {
    return padT + plotH - ((val - this.yMin) / (this.yMax - this.yMin)) * plotH;
  }
}
