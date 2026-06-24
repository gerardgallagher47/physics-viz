// Aero Lesson 2 — Circulation & Lift (Kutta–Joukowski).
//
// A wing behaves like a bound vortex of strength Γ = ∮ V·dl.  Superpose
// uniform free-stream + this circulation: the flow speeds up over the top
// and slows underneath, and the theorem gives lift per unit span
//     L' = ρ∞ V∞ Γ.
// With Γ = 0 there is no lift (d'Alembert's paradox); the Kutta condition
// fixes Γ so the flow leaves the trailing edge smoothly.

(function () {
  const svg = document.getElementById('aero-svg');
  const W = 820, H = 460, CX = 410, CY = 235;
  const RHO = 1.225;

  // airfoil profile (NACA-like), centred near (CX,CY), chord ~320px
  const FOIL =
    'M 250,243 C 320,212 470,196 560,205 C 612,210 648,222 668,232'
  + ' C 648,238 612,246 560,250 C 470,256 320,260 250,243 Z';
  const LE = [250, 243], TE = [668, 232];

  const state = { vinf: 50, gamma: 18 };   // m/s, m²/s (per unit span)

  // particles: free-stream drift + circulation orbit
  let stream = [], orbit = [];
  function seed() {
    stream = [];
    for (let i = 0; i < 80; i++)
      stream.push({ x: Math.random() * W, y: 40 + Math.random() * (H - 110) });
    orbit = [];
    for (let i = 0; i < 26; i++) orbit.push({ a: Math.PI * 2 * i / 26 });
  }
  seed();
  let lastT = 0;

  const lift = () => RHO * state.vinf * state.gamma;     // N per metre span

  // orbit ellipse around the foil
  const ORX = 190, ORY = 70;
  const orbitPt = (a) => [CX + ORX * Math.cos(a), CY - ORY * Math.sin(a)];

  function rebuild() {
    aclear(svg);
    ael('rect', { x: 0, y: 0, width: W, height: H, fill: '#0d1117' }, svg);

    // pressure tint: low (warm) above, high (cool) below — scales with Γ
    const defs = ael('defs', {}, svg);
    const grad = ael('linearGradient', { id: 'aero-press', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    const k = Math.min(state.gamma / 30, 1);
    [['0%', '#ef4444', 0.20 * k], ['38%', '#f97316', 0.08 * k], ['50%', '#0d1117', 0],
     ['62%', '#1d4ed8', 0.08 * k], ['100%', '#1d4ed8', 0.20 * k]]
      .forEach(([o, c, a]) => ael('stop', { offset: o, 'stop-color': c, 'stop-opacity': a }, grad));
    ael('rect', { x: 0, y: 0, width: W, height: H, fill: 'url(#aero-press)' }, svg);

    // free-stream particle layer
    ael('g', { id: 'aero-stream' }, svg);

    // circulation loop
    let lp = '';
    for (let i = 0; i <= 48; i++) {
      const [x, y] = orbitPt(Math.PI * 2 * i / 48);
      lp += `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)} `;
    }
    ael('path', { d: lp + 'Z', fill: 'none', stroke: 'rgba(52,211,153,0.55)',
      'stroke-width': 1.6, 'stroke-dasharray': '5,4' }, svg);
    ael('g', { id: 'aero-orbit' }, svg);

    // airfoil
    ael('path', { d: FOIL, fill: '#1b2540', stroke: '#5b6c95', 'stroke-width': 1.6 }, svg);
    ael('circle', { cx: LE[0], cy: LE[1], r: 3.5, fill: '#fbbf24' }, svg);

    // free-stream label arrows on the left
    for (let i = 0; i < 4; i++) {
      const y = 70 + i * 80;
      aarrow(svg, 24, y, 24 + 18 + state.vinf * 0.4, y, 'rgba(96,165,250,0.6)', 2, 7);
    }
    atxt(svg, 30, H - 60, `V∞ = ${state.vinf} m/s`, { fill: '#60a5fa', size: 12, bold: true, anchor: 'start' });

    // circulation label
    atxt(svg, CX, CY - ORY - 12, `circulation Γ = ${state.gamma.toFixed(0)} m²/s`, { fill: '#34d399', size: 12, bold: true });

    // lift arrow (per unit span), scaled
    const Lpx = Math.min(lift() / 30, 150);
    if (Lpx > 4) {
      aarrow(svg, CX, CY - 6, CX, CY - 6 - Lpx, '#22c55e', 4, 13);
      atxt(svg, CX + 16, CY - 6 - Lpx / 2, "L'", { fill: '#22c55e', size: 17, bold: true, anchor: 'start' });
      atxt(svg, CX + 16, CY - 6 - Lpx / 2 + 16, `${lift().toFixed(0)} N/m`, { fill: '#86efac', size: 11, anchor: 'start' });
    } else {
      atxt(svg, CX, CY - 30, 'no circulation → no lift', { fill: '#94a3b8', size: 12, bold: true });
    }

    // title
    atxt(svg, CX, 28, 'Bound vortex model of a wing — Kutta–Joukowski lift', { fill: '#cbd5e1', size: 13, bold: true });

    renderReadout();
    renderExplain();
  }

  function renderReadout() {
    const vTop = state.vinf + state.gamma / 4;     // illustrative surface speeds
    const vBot = Math.max(state.vinf - state.gamma / 4, 0);
    document.getElementById('aero-readout').innerHTML = `
      <div class="aero-ro-line"><span class="lbl">Free-stream V∞</span><span class="val">${state.vinf} m/s</span></div>
      <div class="aero-ro-line"><span class="lbl">Circulation Γ</span><span class="val">${state.gamma.toFixed(0)} m²/s</span></div>
      <div class="aero-ro-line"><span class="lbl">Speed over top (≈)</span><span class="val">${vTop.toFixed(0)} m/s</span></div>
      <div class="aero-ro-line"><span class="lbl">Speed under bottom (≈)</span><span class="val">${vBot.toFixed(0)} m/s</span></div>
      <div class="aero-ro-line"><span class="lbl">Lift  L' = ρ V∞ Γ</span><span class="val">${lift().toFixed(0)} N/m</span></div>`;
  }

  function renderExplain() {
    const el = document.getElementById('aero-explain');
    let pill, verdict, story;
    if (state.gamma < 0.5) {
      pill = '<span class="pill pill-amber">Γ = 0</span>';
      verdict = "No circulation, no lift";
      story = `With zero circulation the flow is symmetric top-to-bottom and the net force is zero — d'Alembert's paradox. A real wing avoids this through the <strong>Kutta condition</strong>: viscosity forces the flow off the sharp trailing edge, generating circulation.`;
    } else {
      pill = '<span class="pill pill-green">Lift!</span>';
      verdict = 'Circulation makes the pressure difference';
      story = `The bound vortex adds speed over the top and subtracts it underneath. By Bernoulli that means <strong style="color:#ef4444">low pressure above</strong> and <strong style="color:#3b82f6">high pressure below</strong> — a net upward force of <span class="num-hi">${lift().toFixed(0)} N per metre</span> of span.`;
    }
    el.style.borderLeftColor = state.gamma < 0.5 ? '#f59e0b' : '#22c55e';
    el.innerHTML = `
      <div class="verdict">${verdict} ${pill}</div>
      <p>${story}</p>
      <p style="color:var(--muted)">Circulation is the line integral of velocity around the wing, Γ = ∮ V·dl. By <strong>Stokes' theorem</strong> that equals the vorticity bound inside it. Kutta–Joukowski then turns it straight into lift: <strong>L' = ρ∞ V∞ Γ</strong>, linear in both speed and circulation.</p>`;
  }

  function tick(now) {
    if (!lastT) lastT = now;
    const dt = Math.min((now - lastT) / 1000, 0.05); lastT = now;

    const gs = document.getElementById('aero-stream');
    if (gs) {
      aclear(gs);
      for (const p of stream) {
        // base drift + a little upwash/downwash bias from circulation near the foil
        const near = Math.exp(-(((p.x - CX) / 240) ** 2 + ((p.y - CY) / 120) ** 2));
        const bias = (p.y < CY ? -1 : 1) * 0;   // keep straight; bias shown via tint
        p.x += (state.vinf * 0.9) * dt + 0;
        p.y += bias;
        if (p.x > W + 5) { p.x = -5; p.y = 40 + Math.random() * (H - 110); }
        // skip drawing inside the foil bounding region
        if (Math.abs(p.x - CX) < 210 && Math.abs(p.y - CY) < 26) continue;
        ael('circle', { cx: p.x.toFixed(1), cy: p.y.toFixed(1), r: 1.8, fill: 'rgba(148,197,255,0.7)' }, gs);
      }
    }
    const go = document.getElementById('aero-orbit');
    if (go) {
      aclear(go);
      const w = state.gamma * 0.06;   // angular speed ∝ Γ
      for (const o of orbit) {
        o.a += w * dt;
        const [x, y] = orbitPt(o.a);
        ael('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: 2.4, fill: '#34d399' }, go);
      }
    }
    requestAnimationFrame(tick);
  }

  const sv = document.getElementById('aero-vinf');
  sv.addEventListener('input', () => {
    state.vinf = parseFloat(sv.value);
    document.getElementById('aero-vinf-disp').textContent = state.vinf + ' m/s';
    rebuild();
  });
  const sg = document.getElementById('aero-gamma');
  sg.addEventListener('input', () => {
    state.gamma = parseFloat(sg.value);
    document.getElementById('aero-gamma-disp').textContent = state.gamma.toFixed(0) + ' m²/s';
    rebuild();
  });

  aRenderEquations('aero-eqs', [
    { label: 'Circulation', color: '#059669', tex: '\\Gamma = \\oint_{C}\\mathbf V\\!\\cdot\\! d\\mathbf l = \\iint_{S}\\boldsymbol\\omega\\!\\cdot\\! d\\mathbf S' },
    { label: 'Kutta–Joukowski', color: '#16a34a', tex: "L' = \\rho_\\infty\\, V_\\infty\\, \\Gamma" },
    { label: 'Kutta condition', color: '#64748b', tex: '\\text{flow leaves the trailing edge smoothly}' },
  ]);
  rebuild();
  requestAnimationFrame(tick);
})();
