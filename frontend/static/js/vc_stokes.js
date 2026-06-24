// Lesson 4 — Stokes' Theorem.  The 3-D generalisation of Green's.
//
// A fixed circular rim C bounds a cap surface S whose bulge/shape you can
// change.  The field has uniform upward curl (∇×F = 2k̂).  Stokes says
//     ∮_C F·dr  =  ∬_S (∇×F)·dS
// and the right side is the same for EVERY surface sharing the rim — only
// the boundary matters.  Watch both numbers stay equal and constant.

(function () {
  const svg = document.getElementById('vc-svg');
  const W = 620, H = 600;
  const ISO = { ox: 312, oy: 452, s: 74, cos: 0.866, sin: 0.5 };
  const R = 2;                      // rim radius (world)
  const iso = (x, y, z) => [
    ISO.ox + (x - y) * ISO.cos * ISO.s,
    ISO.oy + (x + y) * ISO.sin * ISO.s - z * ISO.s,
  ];

  const state = { shape: 'dome', h: 1.2 };
  let phase = 0, lastT = 0, marker = null;

  // surface height profile z(ρ), all zero at ρ = R so the rim is shared
  function zProfile(rho) {
    const u = rho / R;
    switch (state.shape) {
      case 'flat': return 0;
      case 'cone': return state.h * (1 - u);
      case 'bowl': return -state.h * (1 - u * u);      // dips below the rim
      default:     return state.h * (1 - u * u);        // dome
    }
  }

  function rebuild() {
    svg.innerHTML = '';
    vel('rect', { x: 0, y: 0, width: W, height: H, fill: '#0d1117' }, svg);

    // ── ground grid at z = 0 ──────────────────────────────────────────
    const gGrid = vel('g', {}, svg);
    for (let i = -3; i <= 3; i++) {
      let p = iso(i, -3, 0), q = iso(i, 3, 0);
      vel('line', { x1: p[0], y1: p[1], x2: q[0], y2: q[1], stroke: '#161f30', 'stroke-width': 1 }, gGrid);
      p = iso(-3, i, 0); q = iso(3, i, 0);
      vel('line', { x1: p[0], y1: p[1], x2: q[0], y2: q[1], stroke: '#161f30', 'stroke-width': 1 }, gGrid);
    }

    // ── shaded disc on the ground (projection of the rim) ─────────────
    const projPts = [];
    for (let k = 0; k <= 48; k++) {
      const t = 2 * Math.PI * k / 48;
      projPts.push(iso(R * Math.cos(t), R * Math.sin(t), 0));
    }
    vel('polygon', { points: projPts.map(p => p.join(',')).join(' '),
      fill: 'rgba(99,102,241,0.07)', stroke: 'rgba(99,102,241,0.25)', 'stroke-width': 1 }, svg);

    // ── cap surface wireframe ─────────────────────────────────────────
    const gSurf = vel('g', {}, svg);
    const NR = 5, NT = 36;
    // filled mesh quads (back-to-front by ring) for a soft solid look
    for (let i = 0; i < NR; i++) {
      const r0 = R * i / NR, r1 = R * (i + 1) / NR;
      const z0 = zProfile(r0), z1 = zProfile(r1);
      for (let j = 0; j < NT; j++) {
        const t0 = 2 * Math.PI * j / NT, t1 = 2 * Math.PI * (j + 1) / NT;
        const a = iso(r0 * Math.cos(t0), r0 * Math.sin(t0), z0);
        const b = iso(r1 * Math.cos(t0), r1 * Math.sin(t0), z1);
        const c = iso(r1 * Math.cos(t1), r1 * Math.sin(t1), z1);
        const d = iso(r0 * Math.cos(t1), r0 * Math.sin(t1), z0);
        const shade = 0.10 + 0.10 * (i / NR) + 0.04 * Math.cos(t0);
        vel('polygon', { points: `${a} ${b} ${c} ${d}`,
          fill: `rgba(56,189,248,${shade.toFixed(3)})`,
          stroke: 'rgba(56,189,248,0.22)', 'stroke-width': 0.6 }, gSurf);
      }
    }

    // ── curl vectors poking through the cap (flux of curl) ────────────
    const gCurl = vel('g', {}, svg);
    const ring = [0.8, 1.55];
    [[0, 0]].concat(ring.flatMap(rr =>
      Array.from({ length: 6 }, (_, m) => {
        const t = 2 * Math.PI * m / 6 + (rr > 1 ? Math.PI / 6 : 0);
        return [rr * Math.cos(t), rr * Math.sin(t)];
      }))).forEach(([x, y]) => {
      const z = zProfile(Math.hypot(x, y));
      const base = iso(x, y, z), tip = iso(x, y, z + 0.7);
      varrow(gCurl, base[0], base[1], tip[0], tip[1], '#34d399', 2, 7);
    });

    // ── rim C with CCW circulation arrows ─────────────────────────────
    const gRim = vel('g', {}, svg);
    vel('polygon', { points: projPts.map(p => p.join(',')).join(' '),
      fill: 'none', stroke: '#fbbf24', 'stroke-width': 2.5 }, gRim);
    for (let k = 0; k < 12; k++) {
      const t = 2 * Math.PI * k / 12;
      const base = iso(R * Math.cos(t), R * Math.sin(t), 0);
      // CCW tangent direction in 3D, projected
      const tx = -Math.sin(t), ty = Math.cos(t);
      const tip = iso(R * Math.cos(t) + tx * 0.45, R * Math.sin(t) + ty * 0.45, 0);
      varrow(gRim, base[0], base[1], tip[0], tip[1], '#f59e0b', 1.8, 6);
    }

    // moving marker around the rim
    marker = vel('circle', { cx: projPts[0][0], cy: projPts[0][1], r: 5,
      fill: '#fde047', stroke: '#0d1117', 'stroke-width': 1.5 }, svg);

    // ── labels ────────────────────────────────────────────────────────
    vtxt(svg, 20, 26, "Stokes' Theorem — surface independence", { fill: '#cbd5e1', size: 13, bold: true, anchor: 'start' });
    vtxt(svg, 20, 44, 'Field F with uniform upward curl  ∇×F = 2 k̂', { fill: '#64748b', size: 11, anchor: 'start' });
    const rimLbl = iso(R * Math.cos(-0.5), R * Math.sin(-0.5), 0);
    vtxt(svg, rimLbl[0] + 10, rimLbl[1] + 4, 'rim C (fixed)', { fill: '#fbbf24', size: 11, anchor: 'start' });
    const capTop = iso(0, 0, zProfile(0) + 0.7);
    vtxt(svg, capTop[0], capTop[1] - 8, 'curl through cap S', { fill: '#34d399', size: 11 });

    // legend
    vtxt(svg, 20, H - 16, 'gold = circulation ∮ F·dr   ·   green = curl flux ∬ (∇×F)·dS',
      { fill: '#64748b', size: 11, anchor: 'start' });

    renderReadout();
    renderExplain();
  }

  function renderReadout() {
    // Uniform curl 2k̂ ⇒ flux through any cap = 2·(πR²); circulation = same.
    const val = 2 * Math.PI * R * R;
    const fmt = (v) => v.toFixed(2);
    document.getElementById('vc-readout').innerHTML = `
      <div class="vc-ro-card curl">
        <div class="vc-ro-title">Stokes' identity</div>
        <div class="vc-ro-line"><span class="lbl">∮<sub>C</sub> F·dr  (rim)</span><span class="val">${fmt(val)}</span></div>
        <div class="vc-ro-line"><span class="lbl">∬<sub>S</sub> (∇×F)·dS  (cap)</span><span class="val">${fmt(val)}</span></div>
        <div class="vc-ro-match">✓ equal — and unchanged by the cap's shape</div>
      </div>
      <div class="vc-ro-card" style="border-left-color:#64748b">
        <div class="vc-ro-line"><span class="lbl">rim radius R</span><span class="val">${R.toFixed(2)}</span></div>
        <div class="vc-ro-line"><span class="lbl">cap bulge h</span><span class="val">${state.h.toFixed(2)}</span></div>
      </div>`;
  }

  function renderExplain() {
    const val = 2 * Math.PI * R * R;
    const shapeName = { dome: 'a domed cap', cone: 'a pointed cone', bowl: 'a downward bowl', flat: 'a flat disc' }[state.shape];
    const el = document.getElementById('vc-explain');
    el.style.borderLeftColor = '#0ea5e9';
    el.innerHTML = `
      <div class="verdict">Only the rim matters <span class="pill pill-ccw">Stokes</span></div>
      <p>The green arrows are the field's curl punching up through the cap. Right now the cap is <strong>${shapeName}</strong>, yet the total curl flux through it is <span class="num-hi">${val.toFixed(2)}</span> — exactly the circulation measured by walking the gold rim.</p>
      <p style="color:var(--muted)">Change the bulge or pick a different shape: the surface area changes, but that number never does. Every surface sharing this rim catches the same total curl. <strong>That is Stokes' Theorem</strong> — and flattening the cap to a disc turns it straight back into Green's Theorem.</p>`;
  }

  function tick(now) {
    if (!lastT) lastT = now;
    phase += Math.min((now - lastT) / 1000, 0.05); lastT = now;
    if (marker) {
      const t = (phase * 0.5) % 1 * 2 * Math.PI;
      const p = iso(R * Math.cos(t), R * Math.sin(t), 0);
      marker.setAttribute('cx', p[0]); marker.setAttribute('cy', p[1]);
    }
    requestAnimationFrame(tick);
  }

  document.querySelectorAll('.vc-field-btn').forEach(b => b.addEventListener('click', () => {
    state.shape = b.dataset.shape;
    document.querySelectorAll('.vc-field-btn').forEach(x => x.classList.toggle('active', x === b));
    document.getElementById('vc-blurb').textContent = b.dataset.blurb || '';
    rebuild();
  }));
  const hs = document.getElementById('vc-h-slider');
  hs.addEventListener('input', () => {
    state.h = parseFloat(hs.value);
    document.getElementById('vc-h-display').textContent = state.h.toFixed(2);
    rebuild();
  });

  document.querySelector(`.vc-field-btn[data-shape="${state.shape}"]`)?.classList.add('active');
  const cur = document.querySelector(`.vc-field-btn[data-shape="${state.shape}"]`);
  document.getElementById('vc-blurb').textContent = cur ? cur.dataset.blurb : '';
  renderTheoryCards('vc-eq-panel', [
    { tag: "Stokes' Theorem", tex: '\\oint_{\\partial S}\\mathbf F\\cdot d\\mathbf r = \\iint_{S}(\\nabla\\times\\mathbf F)\\cdot d\\mathbf S',
      note: 'Circulation around the boundary equals the flux of curl through ANY surface that boundary bounds.' },
    { tag: 'Back to Green', tex: '\\oint_{C}\\mathbf F\\cdot d\\mathbf r = \\iint_{R}(\\nabla\\times\\mathbf F)\\cdot\\mathbf{\\hat k}\\,dA',
      note: 'Take the surface to be a flat region in the plane and Stokes collapses to Green’s circulation form.' },
  ]);
  rebuild();
  requestAnimationFrame(tick);
})();
