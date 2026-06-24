// Fluid Lesson 3 — Lift on a Wing (Bernoulli view).
// Air speeds up over the curved top, slows underneath: low pressure above,
// high below, net upward lift.  Reuses wingDerive() from wing_physics.js.

(function () {
  const svg = document.getElementById('lz-svg');
  const W = 700, H = 460, CX = 350, CY = 232;

  // airfoil (NACA-like), chord ~330px
  const FOIL = 'M 195,243 C 270,206 430,188 530,198 C 588,204 628,219 650,231'
             + ' C 628,237 588,247 530,252 C 430,258 270,262 195,243 Z';
  const UPPER = 'M 195,243 C 270,206 430,188 530,198 C 588,204 628,219 650,231';
  const LOWER = 'M 195,243 C 270,250 430,256 530,252 C 588,248 628,239 650,231';
  const LE = [195, 243], TE = [650, 231];

  const state = { v: 50 };

  // streamlines (above converge/compress, below gentler)
  const ABOVE = [
    'M 20,96 C 250,96 470,96 690,96',
    'M 20,128 C 220,126 470,128 690,128',
    'M 20,158 C 200,150 320,140 430,140 C 540,140 620,150 690,156',
    'M 20,182 C 190,172 300,158 425,156 C 545,154 625,166 690,176',
  ];
  const BELOW = [
    'M 20,300 C 230,306 430,308 540,305 C 620,303 660,300 690,299',
    'M 20,330 C 300,332 600,331 690,330',
    'M 20,360 C 300,361 600,360 690,360',
  ];
  let parts = [], lastT = 0;
  function seed() { parts = []; for (let i = 0; i < 70; i++) parts.push({ x: Math.random() * W, y: 80 + Math.random() * 300 }); }
  seed();

  function rebuild() {
    lclear(svg);
    const d = wingDerive(state.v);
    const k = Math.min(state.v / 60, 1);

    lel('rect', { x: 0, y: 0, width: W, height: H, fill: '#0d1117' }, svg);
    // pressure tint
    const defs = lel('defs', {}, svg);
    const gr = lel('linearGradient', { id: 'lz-press', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    [['0%', '#ef4444', 0.22 * k], ['34%', '#f97316', 0.10 * k], ['50%', '#0d1117', 0],
     ['64%', '#1d4ed8', 0.10 * k], ['100%', '#1d4ed8', 0.22 * k]]
      .forEach(([o, c, a]) => lel('stop', { offset: o, 'stop-color': c, 'stop-opacity': a }, gr));
    lel('rect', { x: 0, y: 0, width: W, height: H, fill: 'url(#lz-press)' }, svg);

    // labels for pressure regions
    ltxt(svg, CX, 78, 'LOW PRESSURE  (fast flow)', { fill: '#f87171', size: 12, bold: true });
    ltxt(svg, CX, 392, 'HIGH PRESSURE  (slow flow)', { fill: '#60a5fa', size: 12, bold: true });

    // streamlines
    ABOVE.forEach((dp, i) => lel('path', { d: dp, fill: 'none', stroke: `rgba(125,180,255,${0.3 + i * 0.08})`, 'stroke-width': i >= 2 ? 1.8 : 1.4 }, svg));
    BELOW.forEach(dp => lel('path', { d: dp, fill: 'none', stroke: 'rgba(125,180,255,0.3)', 'stroke-width': 1.4 }, svg));

    lel('g', { id: 'lz-parts' }, svg);

    // airfoil
    lel('path', { d: FOIL, fill: '#1b2540', stroke: '#5b6c95', 'stroke-width': 1.6 }, svg);
    lel('circle', { cx: LE[0], cy: LE[1], r: 3.5, fill: '#fbbf24' }, svg);

    // free-stream arrows
    for (let i = 0; i < 4; i++) { const y = 110 + i * 70; larrow(svg, 20, y, 20 + 16 + state.v * 0.4, y, 'rgba(96,165,250,0.5)', 1.8, 6); }
    ltxt(svg, 26, H - 18, `V∞ = ${state.v} m/s`, { fill: '#60a5fa', size: 12, bold: true, anchor: 'start' });

    // lift & drag arrows
    const Lpx = Math.min(Math.sqrt(d.lift) * 5.0, 130);
    larrow(svg, CX, CY - 6, CX, CY - 6 - Lpx, '#22c55e', 4, 12);
    ltxt(svg, CX + 14, CY - 6 - Lpx / 2, "L", { fill: '#22c55e', size: 16, bold: true, anchor: 'start' });
    ltxt(svg, CX + 14, CY - 6 - Lpx / 2 + 15, `${d.lift.toFixed(0)} N/m`, { fill: '#86efac', size: 10, anchor: 'start' });
    const Dpx = Math.min(Math.sqrt(d.drag) * 6.0, 60);
    larrow(svg, TE[0], TE[1], TE[0] + Dpx, TE[1], '#f59e0b', 2.6, 9);
    ltxt(svg, TE[0] + Dpx + 8, TE[1] + 4, 'D', { fill: '#f59e0b', size: 13, bold: true, anchor: 'start' });

    ltxt(svg, W / 2, 26, 'NACA 2412 at 5° — pressure difference makes lift', { fill: '#cbd5e1', size: 13, bold: true });
    renderReadout(d);
    renderExplain(d);
  }

  function renderReadout(d) {
    document.getElementById('lz-readout').innerHTML = `
      <div class="lz-ro-line"><span class="lbl">Free-stream V∞</span><span class="val">${state.v} m/s</span></div>
      <div class="lz-ro-line"><span class="lbl">Dynamic pressure q = ½ρV²</span><span class="val">${d.q.toFixed(0)} Pa</span></div>
      <div class="lz-ro-line"><span class="lbl">Lift  L = q·C_L·c</span><span class="val">${d.lift.toFixed(0)} N/m</span></div>
      <div class="lz-ro-line"><span class="lbl">Drag  D = q·C_D·c</span><span class="val">${d.drag.toFixed(1)} N/m</span></div>
      <div class="lz-ro-line"><span class="lbl">Lift/Drag ratio</span><span class="val">${d.ld_ratio.toFixed(1)}</span></div>`;
  }
  function renderExplain(d) {
    const el = document.getElementById('lz-explain');
    el.style.borderLeftColor = '#22c55e';
    el.innerHTML = `
      <div class="verdict">Low pressure above, high below → lift <span class="pill pill-green">${d.lift.toFixed(0)} N/m</span></div>
      <p>The cambered top makes the air travel faster, so by Bernoulli the pressure there drops while the slower underside stays high. The difference, summed over the chord, is an upward force of <span class="num-hi">${d.lift.toFixed(0)} N</span> per metre of span.</p>
      <p style="color:var(--muted)">Both lift and drag scale with dynamic pressure q = ½ρV², so doubling the speed roughly quadruples the lift. Their ratio L/D = <span class="num-hi">${d.ld_ratio.toFixed(0)}</span> is fixed by the shape and angle, not the speed — the aircraft's aerodynamic efficiency.</p>`;
  }

  function tick(now) {
    if (!lastT) lastT = now;
    const dt = Math.min((now - lastT) / 1000, 0.05); lastT = now;
    const g = document.getElementById('lz-parts');
    if (g) {
      lclear(g);
      for (const p of parts) {
        const fast = p.y < CY ? 1.18 : 0.92;                 // top flow a touch faster
        p.x += state.v * 0.9 * fast * dt * 1.0;
        if (p.x > W + 4) { p.x = -4; p.y = 80 + Math.random() * 300; }
        if (Math.abs(p.x - CX) < 240 && Math.abs(p.y - CY) < 24) continue;   // skip inside foil
        lel('circle', { cx: p.x.toFixed(1), cy: p.y.toFixed(1), r: 1.8, fill: 'rgba(148,197,255,0.7)' }, g);
      }
    }
    requestAnimationFrame(tick);
  }

  const s = document.getElementById('lz-v');
  s.addEventListener('input', () => { state.v = parseFloat(s.value); document.getElementById('lz-v-d').textContent = state.v + ' m/s'; rebuild(); });

  lTheory('lz-eq-panel', [
    { tag: 'Bernoulli → pressure', tex: 'P + \\tfrac12\\rho v^2 = \\text{const} \\;\\Rightarrow\\; v\\!\\uparrow \\,\\Rightarrow\\, P\\!\\downarrow', note: 'Faster air over the top means lower pressure there.' },
    { tag: 'Lift', tex: "L = \\tfrac12\\rho V_\\infty^2\\, C_L\\, c", note: 'Per unit span; grows with the square of speed.' },
    { tag: 'Drag & efficiency', tex: "D = \\tfrac12\\rho V_\\infty^2\\, C_D\\, c, \\quad \\tfrac{L}{D} = \\tfrac{C_L}{C_D}", note: 'L/D depends on shape and angle of attack, not speed.' },
  ]);
  rebuild();
  requestAnimationFrame(tick);
})();
