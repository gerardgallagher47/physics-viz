// Statics Lesson 1 — Forces on an Incline.
// Pure free-body diagram: weight, normal, friction, and the will-it-slide
// verdict.  No spring, no motion.  Reuses deriveForces() from physics.js
// with k = 0 so the spring term drops out.

(function () {
  const svg = document.getElementById('lz-svg');
  const W = 620, H = 470;
  const P0 = { x: 120, y: 410 };      // angle vertex (bottom-left)
  const LSLOPE = 360;                 // fixed slope length (px)
  const BLK = 36;                     // block size (px)

  const state = { m: 2, theta: 15, mu: 0.30, g: 9.81, decomp: false };

  function geom() {
    const th = state.theta * Math.PI / 180;
    const u = { x: Math.cos(th), y: -Math.sin(th) };          // up-slope (screen)
    const d = { x: -u.x, y: -u.y };                           // down-slope
    const n = { x: -Math.sin(th), y: -Math.cos(th) };         // outward normal
    const P2 = { x: P0.x + u.x * LSLOPE, y: P0.y + u.y * LSLOPE };
    const P1 = { x: P2.x, y: P0.y };                          // right angle corner
    const mid = { x: P0.x + u.x * LSLOPE * 0.52, y: P0.y + u.y * LSLOPE * 0.52 };
    const c = { x: mid.x + n.x * BLK / 2, y: mid.y + n.y * BLK / 2 };
    return { th, u, d, n, P1, P2, c };
  }

  function forces() {
    const p = { m: state.m, thetaDeg: state.theta, g: state.g, k: 0,
                muStatic: state.mu, muKinetic: state.mu, b: 0 };
    return deriveForces(p, { x: 0, v: 0, mode: 'static' });
  }

  function rebuild() {
    lclear(svg);
    lel('rect', { x: 0, y: 0, width: W, height: H, fill: '#0d1117' }, svg);
    const G = geom(), f = forces();
    const mg = state.m * state.g;
    const scale = 120 / Math.max(mg, 1e-6);   // weight arrow ≈ 120 px

    // ground + slope
    lel('line', { x1: 40, y1: P0.y, x2: 580, y2: P0.y, stroke: '#33415a', 'stroke-width': 2 }, svg);
    lel('polygon', { points: `${P0.x},${P0.y} ${G.P1.x},${G.P1.y} ${G.P2.x},${G.P2.y}`,
      fill: '#1b2536', stroke: '#3a4a64', 'stroke-width': 2 }, svg);
    // hatching under slope
    for (let t = 0.08; t < 1; t += 0.12) {
      const ax = P0.x + (G.P2.x - P0.x) * t, ay = P0.y;
      lel('line', { x1: ax, y1: ay, x2: ax - 12, y2: ay + 12, stroke: '#27344a', 'stroke-width': 1 }, svg);
    }

    // angle arc + label
    const aR = 50;
    const a0 = 0, a1 = -G.th;   // screen angles (y down): base→slope
    const arc = describeArc(P0.x, P0.y, aR, a0, a1);
    lel('path', { d: arc, fill: 'none', stroke: '#8aa0c0', 'stroke-width': 1.5 }, svg);
    ltxt(svg, P0.x + aR * 0.78 * Math.cos(-G.th / 2), P0.y + aR * 0.78 * Math.sin(-G.th / 2) + 4,
      `θ=${state.theta}°`, { fill: '#cbd5e1', size: 12, bold: true, anchor: 'start' });

    // block (rotated square)
    const cor = (su, sn) => `${G.c.x + G.u.x * su + G.n.x * sn},${G.c.y + G.u.y * su + G.n.y * sn}`;
    lel('polygon', {
      points: [cor(BLK / 2, BLK / 2), cor(-BLK / 2, BLK / 2), cor(-BLK / 2, -BLK / 2), cor(BLK / 2, -BLK / 2)].join(' '),
      fill: '#2b3a55', stroke: '#7d92b8', 'stroke-width': 1.6 }, svg);

    const c = G.c;
    // weight components (optional, dashed)
    if (state.decomp) {
      const along = mg * Math.sin(G.th), into = mg * Math.cos(G.th);
      drawArr(svg, c, G.d, along * scale, '#fca5a5', 'mg sinθ', true);
      drawArr(svg, c, { x: -G.n.x, y: -G.n.y }, into * scale, '#fca5a5', 'mg cosθ', true);
    }
    // weight (full)
    drawArr(svg, c, { x: 0, y: 1 }, mg * scale, '#ef4444', 'W = mg', false);
    // normal
    drawArr(svg, c, G.n, f.normalForce * scale, '#3b82f6', 'N', false);
    // friction (up-slope, opposing down-slope tendency)
    const fricMag = Math.abs(f.frictionForce);
    if (fricMag > 1e-6) drawArr(svg, c, G.u, fricMag * scale, '#f59e0b', 'f', false);
    // net (only if it slides)
    if (!f.isHeld) drawArr(svg, c, G.d, Math.abs(f.netForce) * scale, '#a855f7', 'Fₙₑₜ', false);

    // verdict tag on canvas
    ltxt(svg, W / 2, 34, f.isHeld ? 'STATIC EQUILIBRIUM — the block holds' : 'IT SLIDES — friction cannot hold it',
      { fill: f.isHeld ? '#4ade80' : '#f87171', size: 14, bold: true });

    renderReadout(f, mg);
    renderExplain(f);
  }

  function drawArr(parent, c, dir, lenPx, color, label, dashed) {
    if (lenPx < 1) return;
    const x2 = c.x + dir.x * lenPx, y2 = c.y + dir.y * lenPx;
    if (dashed) {
      lel('line', { x1: c.x, y1: c.y, x2, y2, stroke: color, 'stroke-width': 1.6, 'stroke-dasharray': '5,3' }, parent);
    } else {
      larrow(parent, c.x, c.y, x2, y2, color, 2.6, 9);
    }
    ltxt(parent, x2 + dir.x * 12 + (dir.y > 0.3 ? 0 : 6), y2 + dir.y * 14 + 4, label,
      { fill: color, size: 12, bold: true, italic: true });
  }

  function renderReadout(f, mg) {
    const along = mg * Math.sin(f.theta), N = f.normalForce;
    document.getElementById('lz-readout').innerHTML = `
      <div class="lz-ro-line"><span class="lbl">Weight  W = mg</span><span class="val">${mg.toFixed(1)} N</span></div>
      <div class="lz-ro-line"><span class="lbl">Normal  N = mg cosθ</span><span class="val">${N.toFixed(1)} N</span></div>
      <div class="lz-ro-line"><span class="lbl">Pull down-slope  mg sinθ</span><span class="val">${along.toFixed(1)} N</span></div>
      <div class="lz-ro-line"><span class="lbl">Max static friction  μₛN</span><span class="val">${f.frictionMax.toFixed(1)} N</span></div>
      <div class="lz-ro-line"><span class="lbl">Friction needed</span><span class="val">${Math.min(along, f.frictionMax).toFixed(1)} N</span></div>`;
  }

  function renderExplain(f) {
    const tanT = Math.tan(f.theta), holds = f.isHeld;
    const el = document.getElementById('lz-explain');
    el.style.borderLeftColor = holds ? '#22c55e' : '#ef4444';
    el.innerHTML = `
      <div class="verdict">${holds ? 'Friction wins — it stays put' : 'Gravity wins — it accelerates'}
        <span class="pill ${holds ? 'pill-green' : 'pill-red'}">${holds ? 'Holds' : 'Slides'}</span></div>
      <p>The block stays still only while the down-slope pull stays within what friction can supply: <strong>mg sinθ ≤ μₛ mg cosθ</strong>. Cancel mg cosθ and it becomes a pure angle test — <strong>tanθ ≤ μₛ</strong>.</p>
      <p style="color:var(--muted)">Right now tanθ = <span class="num-hi">${tanT.toFixed(2)}</span> and μₛ = <span class="num-hi">${f.frictionMax > 0 ? (f.frictionMax / f.normalForce).toFixed(2) : '0.00'}</span>, so ${holds ? 'friction has margin to spare' : 'the surface runs out of grip'}. Notice mass cancels — a heavier block does not slide sooner.</p>`;
  }

  // small-arc helper (screen angles, radians)
  function describeArc(cx, cy, r, a0, a1) {
    const p0 = `${cx + r * Math.cos(a0)},${cy + r * Math.sin(a0)}`;
    const p1 = `${cx + r * Math.cos(a1)},${cy + r * Math.sin(a1)}`;
    return `M ${p0} A ${r} ${r} 0 0 ${a1 < a0 ? 0 : 1} ${p1}`;
  }

  // controls
  const bind = (id, key, disp, fmt) => {
    const s = document.getElementById(id);
    s.addEventListener('input', () => {
      state[key] = parseFloat(s.value);
      document.getElementById(disp).textContent = fmt(state[key]);
      rebuild();
    });
  };
  bind('lz-m', 'm', 'lz-m-d', v => v.toFixed(1) + ' kg');
  bind('lz-theta', 'theta', 'lz-theta-d', v => v.toFixed(0) + '°');
  bind('lz-mu', 'mu', 'lz-mu-d', v => v.toFixed(2));
  bind('lz-g', 'g', 'lz-g-d', v => v.toFixed(2) + ' m/s²');
  const dc = document.getElementById('lz-decomp');
  dc.addEventListener('change', () => { state.decomp = dc.checked; rebuild(); });

  lTheory('lz-eq-panel', [
    { tag: 'Equilibrium', tex: '\\sum F_\\parallel = 0, \\quad \\sum F_\\perp = 0',
      note: 'At rest the along-slope and perpendicular forces each cancel.' },
    { tag: 'Normal force', tex: 'N = mg\\cos\\theta',
      note: 'Only the component of weight pressing into the surface.' },
    { tag: 'No-slip condition', tex: 'mg\\sin\\theta \\le \\mu_s\\,mg\\cos\\theta \\;\\Rightarrow\\; \\tan\\theta \\le \\mu_s',
      note: 'The block slips the instant the slope angle exceeds arctan(μₛ) — independent of mass.' },
  ]);
  rebuild();
})();
