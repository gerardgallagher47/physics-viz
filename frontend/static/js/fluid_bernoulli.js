// Fluid Lesson 1 — Bernoulli's Principle (the energy idea).
// A streamline rising from a wide low section to a narrow raised one.
// Three energy terms — pressure P, dynamic ½ρv², gravity ρgh — always
// sum to the same total head.  Where the flow is fast, pressure is low.

(function () {
  const svg = document.getElementById('lz-svg');
  const W = 700, H = 470, RHO = 1000, G = 9.81;
  const DH = 2.0;                 // height rise (m)
  const AR = 2.0;                 // area ratio A1/A2 → V2 = AR·V1
  const C = 130000;               // total head (Pa) — constant along streamline

  const state = { v1: 3.0 };
  let parts = [], lastT = 0;

  // pipe geometry (px): section1 left wide/low, section2 right narrow/high
  const S1 = { x0: 70, x1: 250, yc: 330, half: 46 };
  const S2 = { x0: 450, x1: 630, yc: 190, half: 23 };
  // centreline through a smooth S-riser between them
  function centre(x) {
    if (x <= S1.x1) return { y: S1.yc, half: S1.half };
    if (x >= S2.x0) return { y: S2.yc, half: S2.half };
    const t = (x - S1.x1) / (S2.x0 - S1.x1);
    const e = 0.5 - 0.5 * Math.cos(Math.PI * t);
    return { y: S1.yc + (S2.yc - S1.yc) * e, half: S1.half + (S2.half - S1.half) * e };
  }

  function seed() { parts = []; for (let i = 0; i < 60; i++) parts.push({ x: 70 + Math.random() * 560, off: (Math.random() * 2 - 1) }); }
  seed();

  const speedAt = (x) => state.v1 * (S1.half / centre(x).half);  // continuity V ∝ 1/area

  function rebuild() {
    lclear(svg);
    lel('rect', { x: 0, y: 0, width: W, height: H, fill: '#0d1117' }, svg);

    // pipe walls + fill (single closed band)
    let top = '', botRev = '';
    for (let x = S1.x0; x <= S2.x1; x += 4) {
      const c = centre(x);
      top += `${x === S1.x0 ? 'M' : 'L'}${x},${(c.y - c.half).toFixed(1)} `;
    }
    for (let x = S2.x1; x >= S1.x0; x -= 4) {
      const c = centre(x);
      botRev += `L${x},${(c.y + c.half).toFixed(1)} `;
    }
    let bot = 'M';
    for (let x = S1.x0; x <= S2.x1; x += 4) {
      const c = centre(x);
      bot += `${x === S1.x0 ? '' : 'L'}${x},${(c.y + c.half).toFixed(1)} `;
    }
    lel('path', { d: top + botRev + 'Z', fill: 'rgba(56,130,246,0.06)' }, svg);
    lel('path', { d: top, fill: 'none', stroke: '#64748b', 'stroke-width': 2.5 }, svg);
    lel('path', { d: bot, fill: 'none', stroke: '#64748b', 'stroke-width': 2.5 }, svg);

    lel('g', { id: 'lz-parts' }, svg);

    // datum line
    lel('line', { x1: 40, y1: 400, x2: 660, y2: 400, stroke: '#27344a', 'stroke-width': 1, 'stroke-dasharray': '4,4' }, svg);
    ltxt(svg, 44, 414, 'datum  h = 0', { fill: '#475569', size: 10, anchor: 'start' });

    // station data
    const v1 = state.v1, v2 = v1 * AR;
    const P1 = C - 0.5 * RHO * v1 * v1 - 0;
    const P2 = C - 0.5 * RHO * v2 * v2 - RHO * G * DH;
    drawStation(svg, 160, 'point 1', v1, 0, P1, 0.5 * RHO * v1 * v1, 0);
    drawStation(svg, 540, 'point 2', v2, DH, P2, 0.5 * RHO * v2 * v2, RHO * G * DH);

    // velocity labels
    ltxt(svg, 160, S1.yc + 4, `v₁ = ${v1.toFixed(1)}`, { fill: '#67e8f9', size: 12, bold: true });
    ltxt(svg, 540, S2.yc + 4, `v₂ = ${v2.toFixed(1)}`, { fill: '#fbbf24', size: 12, bold: true });
    ltxt(svg, W / 2, 28, 'Same total head everywhere — energy just changes form', { fill: '#cbd5e1', size: 13, bold: true });

    renderReadout(P1, P2, v1, v2);
    renderExplain(P1, P2, v2);
  }

  function drawStation(parent, x, label, v, h, P, dyn, grav) {
    // stacked bar: pressure (blue) + dynamic (orange) + gravity (purple) = C
    const barH = 150, y0 = 392, scale = barH / C;
    let y = y0;
    const seg = (val, col) => { const hgt = val * scale; lel('rect', { x: x - 16, y: y - hgt, width: 32, height: hgt, fill: col }, parent); y -= hgt; };
    seg(P, '#3b82f6'); seg(dyn, '#f97316'); seg(grav, '#a855f7');
    lel('rect', { x: x - 16, y: y0 - barH, width: 32, height: barH, fill: 'none', stroke: '#475569', 'stroke-width': 1 }, parent);
    ltxt(parent, x, y0 + 14, label, { fill: '#94a3b8', size: 11, bold: true });
  }

  function renderReadout(P1, P2, v1, v2) {
    document.getElementById('lz-readout').innerHTML = `
      <div class="lz-ro-line"><span class="lbl">Speed v₁ → v₂</span><span class="val">${v1.toFixed(1)} → ${v2.toFixed(1)} m/s</span></div>
      <div class="lz-ro-line"><span class="lbl">Pressure P₁</span><span class="val">${(P1/1000).toFixed(1)} kPa</span></div>
      <div class="lz-ro-line"><span class="lbl">Pressure P₂</span><span class="val">${(P2/1000).toFixed(1)} kPa</span></div>
      <div class="lz-ro-line"><span class="lbl">Pressure drop P₁−P₂</span><span class="val">${((P1-P2)/1000).toFixed(1)} kPa</span></div>
      <div class="lz-ro-line"><span class="lbl">Total head (both)</span><span class="val">${(C/1000).toFixed(0)} kPa</span></div>`;
  }
  function renderExplain(P1, P2, v2) {
    const el = document.getElementById('lz-explain');
    el.style.borderLeftColor = '#3b82f6';
    el.innerHTML = `
      <div class="verdict">Faster &amp; higher means lower pressure <span class="pill pill-blue">Bernoulli</span></div>
      <p>Moving to point 2 the flow speeds up to <span class="num-hi">${v2.toFixed(1)} m/s</span> and climbs <span class="num-hi">${DH.toFixed(1)} m</span>. Both the dynamic term ½ρv² and the gravity term ρgh grow — so to keep the total fixed, the pressure term must fall by <span class="num-hi">${((P1-P2)/1000).toFixed(1)} kPa</span>.</p>
      <p style="color:var(--muted)">The three coloured blocks are energy per unit volume: <strong style="color:#3b82f6">pressure</strong>, <strong style="color:#f97316">motion</strong>, <strong style="color:#a855f7">height</strong>. Their stack is the same tall at every point — that constant is Bernoulli's equation. (Inviscid, incompressible, steady.)</p>`;
  }

  function tick(now) {
    if (!lastT) lastT = now;
    const dt = Math.min((now - lastT) / 1000, 0.05); lastT = now;
    const g = document.getElementById('lz-parts');
    if (g) {
      lclear(g);
      for (const pt of parts) {
        pt.x += speedAt(pt.x) * 22 * dt;
        if (pt.x > S2.x1) pt.x = S1.x0;
        const c = centre(pt.x);
        const y = c.y + pt.off * c.half * 0.7;
        const t = Math.min(speedAt(pt.x) / (state.v1 * AR), 1);
        lel('circle', { cx: pt.x.toFixed(1), cy: y.toFixed(1), r: 2.4,
          fill: `rgb(${Math.round(56 + t * 200)},${Math.round(180 - t * 40)},${Math.round(250 - t * 100)})` }, g);
      }
    }
    requestAnimationFrame(tick);
  }

  const s = document.getElementById('lz-v1');
  s.addEventListener('input', () => { state.v1 = parseFloat(s.value); document.getElementById('lz-v1-d').textContent = state.v1.toFixed(1) + ' m/s'; rebuild(); });

  lTheory('lz-eq-panel', [
    { tag: "Bernoulli's equation", tex: 'P + \\tfrac{1}{2}\\rho v^2 + \\rho g h = \\text{constant}',
      note: 'Along a streamline in steady, incompressible, inviscid flow.' },
    { tag: 'Between two points', tex: 'P_1 + \\tfrac12\\rho v_1^2 + \\rho g h_1 = P_2 + \\tfrac12\\rho v_2^2 + \\rho g h_2',
      note: 'Energy per unit volume is conserved; the terms trade off.' },
    { tag: 'Continuity', tex: 'A_1 v_1 = A_2 v_2',
      note: 'A narrower section forces a higher speed — explored next.' },
  ]);
  rebuild();
  requestAnimationFrame(tick);
})();
