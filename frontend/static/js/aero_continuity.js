// Aero Lesson 1 — Continuity & the Control Volume (Divergence Theorem).
//
// A converging duct (nozzle). The control volume is the duct interior;
// mass crosses only the inlet and outlet faces (walls are tangent to the
// flow, zero flux).  Steady incompressible ⇒ A1 V1 = A2 V2, so squeezing
// the area speeds the flow up.  Differential form: ∇·V = 0.

(function () {
  const svg = document.getElementById('aero-svg');
  const W = 820, H = 430, CY = 215;
  const X0 = 95, X1 = 725;            // duct extent
  const RHO = 1.225;                  // air density (kg/m³)

  const state = { v1: 4.0, cr: 2.5 };   // inlet speed, contraction ratio A1/A2
  const H1 = 150;                       // inlet full height (px, ∝ area)

  // smooth contraction profile, full height at x
  function ductH(x) {
    const h2 = H1 / state.cr;
    const u = (x - X0) / (X1 - X0);
    return h2 + (H1 - h2) * 0.5 * (1 + Math.cos(Math.PI * u));
  }
  const wallTop = (x) => CY - ductH(x) / 2;
  const wallBot = (x) => CY + ductH(x) / 2;
  const localV  = (x) => state.v1 * (H1 / ductH(x));   // continuity: V ∝ 1/area

  // particles
  const LANES = 7, PER = 6;
  let parts = [];
  function seed() {
    parts = [];
    for (let i = 0; i < LANES * PER; i++)
      parts.push({ x: X0 + Math.random() * (X1 - X0), lane: i % LANES });
  }
  seed();

  let lastT = 0;

  function rebuild() {
    aclear(svg);
    ael('rect', { x: 0, y: 0, width: W, height: H, fill: '#0d1117' }, svg);

    // duct silhouette
    const N = 60;
    let top = '', bot = '';
    for (let i = 0; i <= N; i++) {
      const x = X0 + (X1 - X0) * i / N;
      top += `${i ? 'L' : 'M'}${x.toFixed(1)},${wallTop(x).toFixed(1)} `;
    }
    for (let i = N; i >= 0; i--) {
      const x = X0 + (X1 - X0) * i / N;
      bot += `L${x.toFixed(1)},${wallBot(x).toFixed(1)} `;
    }
    ael('path', { d: top + bot + 'Z', fill: 'rgba(56,130,246,0.07)' }, svg);

    // particle layer placeholder (drawn in tick into its own group)
    const gParts = ael('g', { id: 'aero-parts' }, svg);

    // duct walls (solid)
    let twd = '', bwd = '';
    for (let i = 0; i <= N; i++) {
      const x = X0 + (X1 - X0) * i / N;
      twd += `${i ? 'L' : 'M'}${x.toFixed(1)},${wallTop(x).toFixed(1)} `;
      bwd += `${i ? 'L' : 'M'}${x.toFixed(1)},${wallBot(x).toFixed(1)} `;
    }
    ael('path', { d: twd, fill: 'none', stroke: '#64748b', 'stroke-width': 2.5 }, svg);
    ael('path', { d: bwd, fill: 'none', stroke: '#64748b', 'stroke-width': 2.5 }, svg);

    // control-volume boundary highlight: inlet + outlet faces (dashed)
    ael('line', { x1: X0, y1: wallTop(X0), x2: X0, y2: wallBot(X0),
      stroke: '#22d3ee', 'stroke-width': 2.5, 'stroke-dasharray': '6,4' }, svg);
    ael('line', { x1: X1, y1: wallTop(X1), x2: X1, y2: wallBot(X1),
      stroke: '#f59e0b', 'stroke-width': 2.5, 'stroke-dasharray': '6,4' }, svg);

    // inlet flux arrows (into CV)
    const v2 = state.v1 * state.cr;
    const nIn = 5;
    for (let i = 0; i < nIn; i++) {
      const y = wallTop(X0) + (i + 0.5) / nIn * ductH(X0);
      const L = 14 + state.v1 * 5;
      aarrow(svg, X0 - L, y, X0 - 4, y, '#22d3ee', 2.4, 8);
    }
    // outlet flux arrows (out of CV) — longer, faster
    const nOut = 5;
    for (let i = 0; i < nOut; i++) {
      const y = wallTop(X1) + (i + 0.5) / nOut * ductH(X1);
      const L = 14 + v2 * 5;
      aarrow(svg, X1 + 4, y, X1 + 4 + L, y, '#f59e0b', 2.4, 8);
    }

    // wall "no flux" markers (velocity tangent to wall)
    atxt(svg, (X0 + X1) / 2, wallTop((X0 + X1) / 2) - 10, 'wall: V ∥ surface → no flux', { fill: '#64748b', size: 11 });

    // labels
    atxt(svg, X0, wallBot(X0) + 22, 'inlet  A₁', { fill: '#22d3ee', size: 13, bold: true });
    atxt(svg, X1, wallBot(X1) + 22, 'outlet  A₂', { fill: '#f59e0b', size: 13, bold: true });
    atxt(svg, X0 - 30, CY, `V₁`, { fill: '#67e8f9', size: 13, bold: true, anchor: 'end' });
    atxt(svg, X1 + 40, CY - 18, `V₂ = ${v2.toFixed(1)}`, { fill: '#fbbf24', size: 13, bold: true, anchor: 'start' });
    atxt(svg, (X0 + X1) / 2, 30, 'Control volume — steady, incompressible', { fill: '#cbd5e1', size: 13, bold: true });

    // mass-flux bars (bottom) to show in = out
    const mIn = RHO * ductH(X0) * state.v1, mOut = RHO * ductH(X1) * v2;  // ∝ ρ A V
    drawBalance(svg, mIn, mOut);

    renderReadout();
    renderExplain();
  }

  function drawBalance(parent, mIn, mOut) {
    const y = H - 26, x0 = 95, maxW = 300;
    const m = Math.max(mIn, mOut, 1e-6);
    atxt(parent, x0, y - 12, 'ṁ in', { fill: '#22d3ee', size: 11, anchor: 'start' });
    ael('rect', { x: x0, y: y - 8, width: maxW * (mIn / m), height: 10, fill: '#22d3ee', rx: 2 }, parent);
    atxt(parent, x0 + 430, y - 12, 'ṁ out', { fill: '#f59e0b', size: 11, anchor: 'start' });
    ael('rect', { x: x0 + 430, y: y - 8, width: maxW * (mOut / m), height: 10, fill: '#f59e0b', rx: 2 }, parent);
    atxt(parent, x0 + maxW + 20, y, '=  balanced', { fill: '#4ade80', size: 12, bold: true, anchor: 'start' });
  }

  function renderReadout() {
    const v2 = state.v1 * state.cr;
    const mIn = RHO * (ductH(X0) / 100) * state.v1;   // arbitrary area units
    document.getElementById('aero-readout').innerHTML = `
      <div class="aero-ro-line"><span class="lbl">Inlet speed V₁</span><span class="val">${state.v1.toFixed(1)} m/s</span></div>
      <div class="aero-ro-line"><span class="lbl">Area ratio A₁/A₂</span><span class="val">${state.cr.toFixed(2)}</span></div>
      <div class="aero-ro-line"><span class="lbl">Outlet speed V₂ = (A₁/A₂)·V₁</span><span class="val">${v2.toFixed(1)} m/s</span></div>
      <div class="aero-ro-line"><span class="lbl">Mass in vs out</span><span class="val">equal</span></div>`;
  }

  function renderExplain() {
    const v2 = state.v1 * state.cr;
    const el = document.getElementById('aero-explain');
    el.style.borderLeftColor = '#22d3ee';
    el.innerHTML = `
      <div class="verdict">Squeeze the area, speed up the flow <span class="pill pill-blue">Continuity</span></div>
      <p>Mass can't pile up inside a steady control volume, so whatever crosses the inlet must cross the outlet. The duct narrows to <span class="num-hi">${(100 / state.cr).toFixed(0)}%</span> of its inlet area, so the air must accelerate from <span class="num-hi">${state.v1.toFixed(1)}</span> to <span class="num-hi">${v2.toFixed(1)} m/s</span> to carry the same mass through.</p>
      <p style="color:var(--muted)">No flow crosses the walls (velocity runs parallel to them), so the surface integral reduces to inlet + outlet. Shrinking the box to a point turns this into the differential law <strong>∇·V = 0</strong> — the incompressible continuity equation behind every CFD solver.</p>`;
  }

  function tick(now) {
    if (!lastT) lastT = now;
    const dt = Math.min((now - lastT) / 1000, 0.05); lastT = now;
    const g = document.getElementById('aero-parts');
    if (g) {
      aclear(g);
      for (const p of parts) {
        p.x += localV(p.x) * 26 * dt;
        if (p.x > X1) { p.x = X0; p.lane = Math.floor(Math.random() * LANES); }
        const frac = (p.lane + 0.5) / LANES;
        const y = wallTop(p.x) + frac * ductH(p.x);
        const t = Math.min(localV(p.x) / (state.v1 * state.cr), 1);
        const col = `rgb(${Math.round(56 + t * 110)},${Math.round(160 + t * 50)},250)`;
        ael('circle', { cx: p.x.toFixed(1), cy: y.toFixed(1), r: 2.6, fill: col }, g);
      }
    }
    requestAnimationFrame(tick);
  }

  // controls
  const sv = document.getElementById('aero-v1');
  sv.addEventListener('input', () => {
    state.v1 = parseFloat(sv.value);
    document.getElementById('aero-v1-disp').textContent = state.v1.toFixed(1) + ' m/s';
    rebuild();
  });
  const sc = document.getElementById('aero-cr');
  sc.addEventListener('input', () => {
    state.cr = parseFloat(sc.value);
    document.getElementById('aero-cr-disp').textContent = state.cr.toFixed(2);
    rebuild();
  });

  aRenderEquations('aero-eqs', [
    { label: 'General', color: '#2563eb', tex: '\\oiint_{S}\\rho\\,\\mathbf V\\!\\cdot\\!\\mathbf{\\hat n}\\,dA = -\\dfrac{\\partial}{\\partial t}\\iiint_{V}\\rho\\,dV' },
    { label: 'Steady 1-D', color: '#0891b2', tex: '\\rho_1 A_1 V_1 = \\rho_2 A_2 V_2 \\;\\Rightarrow\\; A_1 V_1 = A_2 V_2' },
    { label: 'Differential', color: '#7c3aed', tex: '\\nabla\\!\\cdot\\!(\\rho\\mathbf V) = 0 \\;\\Rightarrow\\; \\nabla\\!\\cdot\\!\\mathbf V = 0' },
  ]);
  rebuild();
  requestAnimationFrame(tick);
})();
