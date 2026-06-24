// Fluid Lesson 2 — Venturi Effect & Continuity.
// Horizontal venturi: continuity forces the flow to accelerate through the
// throat, and Bernoulli turns that speed-up into a pressure drop.
// Reuses bernoulliDerive() / localVelocity() from bernoulli_physics.js.

(function () {
  const svg = document.getElementById('lz-svg');
  const W = 700, H = 470, CY = 168;
  const X0 = 60, X1 = 640;
  const R1 = 66, R2 = 38;             // (R1/R2)² ≈ 3 → v2 = 3 v1 (matches BV)
  // pressure chart band
  const CHART = { y0: 300, y1: 410, pMax: 225000, pMin: 40000 };

  const state = { v1: 2.0 };
  let parts = [], lastT = 0;

  function half(x) {
    const xt = (X0 + X1) / 2, wThroat = 150;
    const d = Math.abs(x - xt);
    if (d > wThroat) return R1;
    const e = 0.5 - 0.5 * Math.cos(Math.PI * d / wThroat);   // 0 at throat → 1 at edge
    return R2 + (R1 - R2) * e;
  }
  const vAt = (x) => localVelocity(state.v1, half(x), R1);
  const pAt = (x) => BV.P_TOTAL - 0.5 * BV.RHO * vAt(x) * vAt(x);
  const pY = (P) => CHART.y1 - (P - CHART.pMin) / (CHART.pMax - CHART.pMin) * (CHART.y1 - CHART.y0);

  function seed() { parts = []; for (let i = 0; i < 70; i++) parts.push({ x: X0 + Math.random() * (X1 - X0), off: Math.random() * 2 - 1 }); }
  seed();

  function rebuild() {
    lclear(svg);
    lel('rect', { x: 0, y: 0, width: W, height: H, fill: '#0d1117' }, svg);
    const d = bernoulliDerive(state.v1);

    // pipe
    let top = '', bot = 'M';
    for (let x = X0; x <= X1; x += 4) { top += `${x === X0 ? 'M' : 'L'}${x},${(CY - half(x)).toFixed(1)} `; }
    let botRev = '';
    for (let x = X1; x >= X0; x -= 4) botRev += `L${x},${(CY + half(x)).toFixed(1)} `;
    for (let x = X0; x <= X1; x += 4) bot += `${x === X0 ? '' : 'L'}${x},${(CY + half(x)).toFixed(1)} `;
    lel('path', { d: top + botRev + 'Z', fill: 'rgba(56,130,246,0.06)' }, svg);

    lel('g', { id: 'lz-parts' }, svg);
    lel('path', { d: top, fill: 'none', stroke: '#64748b', 'stroke-width': 2.5 }, svg);
    lel('path', { d: bot, fill: 'none', stroke: '#64748b', 'stroke-width': 2.5 }, svg);

    // pressure profile chart
    drawChart(svg);

    // station markers (inlet & throat)
    const xt = (X0 + X1) / 2;
    markStation(svg, X0 + 40, 'v₁', '#67e8f9', d.v1, d.P1);
    markStation(svg, xt, 'v₂', '#fbbf24', d.v2, d.P2);

    ltxt(svg, W / 2, 26, 'Squeeze the area → flow speeds up → pressure drops', { fill: '#cbd5e1', size: 13, bold: true });
    renderReadout(d);
    renderExplain(d);
  }

  function drawChart(parent) {
    lel('line', { x1: X0, y1: CHART.y0, x2: X0, y2: CHART.y1, stroke: '#33415a', 'stroke-width': 1 }, parent);
    ltxt(parent, X0 - 6, CHART.y0 + 4, 'P', { fill: '#64748b', size: 11, anchor: 'end' });
    // static (blue fill under curve) + dynamic (orange above)
    let cv = '';
    for (let x = X0; x <= X1; x += 4) cv += `${x === X0 ? 'M' : 'L'}${x},${pY(pAt(x)).toFixed(1)} `;
    lel('path', { d: cv + `L${X1},${CHART.y1} L${X0},${CHART.y1} Z`, fill: 'rgba(59,130,246,0.18)' }, parent);
    lel('path', { d: cv + `L${X1},${CHART.y0} L${X0},${CHART.y0} Z`, fill: 'rgba(249,115,22,0.14)' }, parent);
    lel('path', { d: cv, fill: 'none', stroke: '#e2e8f0', 'stroke-width': 2 }, parent);
    ltxt(parent, X1 - 4, CHART.y0 + 14, 'dynamic ½ρv²', { fill: '#fb923c', size: 10, anchor: 'end' });
    ltxt(parent, X1 - 4, CHART.y1 - 8, 'static P', { fill: '#60a5fa', size: 10, anchor: 'end' });
  }

  function markStation(parent, x, lbl, col, v, P) {
    lel('line', { x1: x, y1: CY - half(x), x2: x, y2: pY(P), stroke: col, 'stroke-width': 1, 'stroke-dasharray': '3,3', opacity: 0.5 }, parent);
    lel('circle', { cx: x, cy: pY(P), r: 4, fill: col }, parent);
    ltxt(parent, x, pY(P) - 8, `${(P / 1000).toFixed(0)} kPa`, { fill: col, size: 11, bold: true });
    ltxt(parent, x, CY + 4, `${lbl}=${v.toFixed(1)}`, { fill: col, size: 11, bold: true });
  }

  function renderReadout(d) {
    document.getElementById('lz-readout').innerHTML = `
      <div class="lz-ro-line"><span class="lbl">Inlet speed v₁</span><span class="val">${d.v1.toFixed(2)} m/s</span></div>
      <div class="lz-ro-line"><span class="lbl">Throat speed v₂ = 3v₁</span><span class="val">${d.v2.toFixed(2)} m/s</span></div>
      <div class="lz-ro-line"><span class="lbl">Inlet pressure P₁</span><span class="val">${(d.P1/1000).toFixed(1)} kPa</span></div>
      <div class="lz-ro-line"><span class="lbl">Throat pressure P₂</span><span class="val">${(d.P2/1000).toFixed(1)} kPa</span></div>
      <div class="lz-ro-line"><span class="lbl">Pressure drop ΔP</span><span class="val">${(d.deltaP/1000).toFixed(1)} kPa</span></div>`;
  }
  function renderExplain(d) {
    const el = document.getElementById('lz-explain');
    el.style.borderLeftColor = '#22d3ee';
    el.innerHTML = `
      <div class="verdict">The throat is fast and low-pressure <span class="pill pill-blue">Venturi</span></div>
      <p>Continuity (A₁v₁ = A₂v₂) forces the flow through the 3× narrower throat to triple its speed, to <span class="num-hi">${d.v2.toFixed(1)} m/s</span>. Bernoulli then converts that extra ½ρv² into a pressure drop of <span class="num-hi">${(d.deltaP/1000).toFixed(1)} kPa</span>.</p>
      <p style="color:var(--muted)">The white curve is the static pressure along the pipe — it sags exactly where the pipe pinches. This is how a carburettor, an atomiser and a Venturi flow-meter all work.</p>`;
  }

  function tick(now) {
    if (!lastT) lastT = now;
    const dt = Math.min((now - lastT) / 1000, 0.05); lastT = now;
    const g = document.getElementById('lz-parts');
    if (g) {
      lclear(g);
      for (const p of parts) {
        p.x += vAt(p.x) * 12 * dt;
        if (p.x > X1) p.x = X0;
        const y = CY + p.off * half(p.x) * 0.72;
        const t = Math.min(vAt(p.x) / (state.v1 * 3), 1);
        lel('circle', { cx: p.x.toFixed(1), cy: y.toFixed(1), r: 2.4,
          fill: `rgb(${Math.round(80 + t * 150)},${Math.round(190 + t * 30)},255)` }, g);
      }
    }
    requestAnimationFrame(tick);
  }

  const s = document.getElementById('lz-v1');
  s.addEventListener('input', () => { state.v1 = parseFloat(s.value); document.getElementById('lz-v1-d').textContent = state.v1.toFixed(2) + ' m/s'; rebuild(); });

  lTheory('lz-eq-panel', [
    { tag: 'Continuity', tex: 'A_1 v_1 = A_2 v_2', note: 'Throat area is ⅓ of the inlet, so v₂ = 3v₁.' },
    { tag: 'Bernoulli (horizontal)', tex: 'P_1 + \\tfrac12\\rho v_1^2 = P_2 + \\tfrac12\\rho v_2^2', note: 'No height change here, so speed and pressure trade directly.' },
    { tag: 'Pressure drop', tex: '\\Delta P = \\tfrac12\\rho\\,(v_2^2 - v_1^2)', note: 'Grows with the square of the inlet speed.' },
  ]);
  rebuild();
  requestAnimationFrame(tick);
})();
