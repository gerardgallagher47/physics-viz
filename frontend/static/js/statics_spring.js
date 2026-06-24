// Statics Lesson 2 — Spring, Release & Damped Oscillation.
// Drag the block to set spring compression, release to animate. Reuses
// deriveForces / rk4Step / isSettled from physics.js.  g is fixed at 9.81.

(function () {
  const svg = document.getElementById('lz-svg');
  const plot = document.getElementById('lz-plot');
  const pctx = plot.getContext('2d');
  const W = 620, H = 470;
  const P0 = { x: 120, y: 410 }, LSLOPE = 360, BLK = 34;
  const A_OFF = 36, REST = 196, PXM = 760, XMAX = 0.24;

  const p = { m: 2, thetaDeg: 30, g: 9.81, k: 200, b: 12, muStatic: 0.30, muKinetic: 0.25 };
  const S = { x: 0.05, v: 0, mode: 'dragging' };   // start grabbed-ish (static)
  let samples = [], simT = 0, acc = 0, lastT = 0, dragging = false;

  function geom() {
    const th = p.thetaDeg * Math.PI / 180;
    const u = { x: Math.cos(th), y: -Math.sin(th) };
    const n = { x: -Math.sin(th), y: -Math.cos(th) };
    const P2 = { x: P0.x + u.x * LSLOPE, y: P0.y + u.y * LSLOPE };
    const P1 = { x: P2.x, y: P0.y };
    const A = { x: P0.x + u.x * A_OFF, y: P0.y + u.y * A_OFF };
    return { th, u, n, P1, P2, A };
  }
  const qOf = (x) => REST - x * PXM;                 // along-slope px for compression x
  const blockC = (G) => {
    const q = qOf(S.x);
    return { x: G.A.x + G.u.x * q + G.n.x * BLK / 2, y: G.A.y + G.u.y * q + G.n.y * BLK / 2 };
  };

  function rebuild() {
    lclear(svg);
    lel('rect', { x: 0, y: 0, width: W, height: H, fill: '#0d1117' }, svg);
    const G = geom();
    const f = deriveForces(p, S);
    const mg = p.m * p.g, scale = Math.min(110 / Math.max(mg, 1e-6), 8);
    const arrLen = (v) => Math.min(Math.abs(v) * scale, 150);

    // ground + slope
    lel('line', { x1: 40, y1: P0.y, x2: 580, y2: P0.y, stroke: '#33415a', 'stroke-width': 2 }, svg);
    lel('polygon', { points: `${P0.x},${P0.y} ${G.P1.x},${G.P1.y} ${G.P2.x},${G.P2.y}`,
      fill: '#1b2536', stroke: '#3a4a64', 'stroke-width': 2 }, svg);

    // equilibrium marker
    const qe = qOf(f.equilibriumX);
    const em = { x: G.A.x + G.u.x * qe, y: G.A.y + G.u.y * qe };
    lel('line', { x1: em.x - G.n.x * 26, y1: em.y - G.n.y * 26, x2: em.x + G.n.x * 30, y2: em.y + G.n.y * 30,
      stroke: '#64748b', 'stroke-width': 1.4, 'stroke-dasharray': '4,3' }, svg);
    ltxt(svg, em.x + G.n.x * 42, em.y + G.n.y * 42 + 4, 'x_eq', { fill: '#94a3b8', size: 11 });

    // spring coil from anchor to block base
    drawSpring(svg, G.A, { x: G.A.x + G.u.x * qOf(S.x), y: G.A.y + G.u.y * qOf(S.x) }, G.n);
    // anchor wall
    lel('circle', { cx: G.A.x, cy: G.A.y, r: 5, fill: '#475569' }, svg);

    // block
    const c = blockC(G);
    const cor = (su, sn) => `${c.x + G.u.x * su + G.n.x * sn},${c.y + G.u.y * su + G.n.y * sn}`;
    lel('polygon', { points: [cor(BLK / 2, BLK / 2), cor(-BLK / 2, BLK / 2), cor(-BLK / 2, -BLK / 2), cor(BLK / 2, -BLK / 2)].join(' '),
      fill: dragging ? '#3b4f74' : '#2b3a55', stroke: '#7d92b8', 'stroke-width': 1.6 }, svg);

    // arrows: weight, spring (up-slope), friction, net
    arr(svg, c, { x: 0, y: 1 }, arrLen(mg), '#ef4444', 'W');
    arr(svg, c, G.u, arrLen(f.springForce), '#22c55e', 'kx');
    if (Math.abs(f.frictionForce) > 1e-6) {
      const fd = f.frictionForce >= 0 ? G.u : { x: -G.u.x, y: -G.u.y };
      arr(svg, c, fd, arrLen(f.frictionForce), '#f59e0b', 'f');
    }
    if (Math.abs(f.netForce) > 1e-3) {
      const nd = f.netForce >= 0 ? { x: -G.u.x, y: -G.u.y } : G.u;  // net>0 = down-slope
      arr(svg, c, nd, arrLen(f.netForce), '#a855f7', 'Fₙₑₜ');
    }

    // mode badge
    const badge = { static: ['#0369a1', '#e0f2fe', 'STATIC'], dragging: ['#a16207', '#fef9c3', 'DRAGGING'], playing: ['#15803d', '#dcfce7', 'PLAYING'] }[S.mode];
    ltxt(svg, W / 2, 30, `${badge[2]} — drag the block, then Release`, { fill: badge[0] === '#0369a1' ? '#7dd3fc' : badge[0] === '#a16207' ? '#fde047' : '#86efac', size: 13, bold: true });

    renderReadout(f, mg);
    renderExplain(f);
  }

  function drawSpring(parent, a, b, n) {
    const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy);
    const ux = dx / (len || 1), uy = dy / (len || 1), coils = 9, amp = 9;
    let d = `M ${a.x},${a.y} `;
    for (let i = 1; i < coils; i++) {
      const t = i / coils, px = a.x + ux * len * t, py = a.y + uy * len * t;
      const s = (i % 2 ? 1 : -1) * amp;
      d += `L ${px + n.x * s},${py + n.y * s} `;
    }
    d += `L ${b.x},${b.y}`;
    lel('path', { d, fill: 'none', stroke: '#34d399', 'stroke-width': 2.2, 'stroke-linejoin': 'round' }, parent);
  }
  function arr(parent, c, dir, len, color, label) {
    if (len < 1) return;
    const x2 = c.x + dir.x * len, y2 = c.y + dir.y * len;
    larrow(parent, c.x, c.y, x2, y2, color, 2.6, 9);
    ltxt(parent, x2 + dir.x * 12, y2 + dir.y * 14 + 4, label, { fill: color, size: 12, bold: true, italic: true });
  }

  function renderReadout(f, mg) {
    document.getElementById('lz-readout').innerHTML = `
      <div class="lz-ro-line"><span class="lbl">Compression x</span><span class="val">${(S.x * 1000).toFixed(0)} mm</span></div>
      <div class="lz-ro-line"><span class="lbl">Spring force kx</span><span class="val">${f.springForce.toFixed(1)} N</span></div>
      <div class="lz-ro-line"><span class="lbl">Pull down-slope mg sinθ</span><span class="val">${f.gravityAlongSlope.toFixed(1)} N</span></div>
      <div class="lz-ro-line"><span class="lbl">Equilibrium x_eq</span><span class="val">${(f.equilibriumX * 1000).toFixed(0)} mm</span></div>
      <div class="lz-ro-line"><span class="lbl">Damping ratio ζ</span><span class="val">${f.zeta.toFixed(2)}</span></div>`;
  }
  function renderExplain(f) {
    const el = document.getElementById('lz-explain');
    const reg = f.zeta < 1 ? 'under-damped' : f.zeta > 1 ? 'over-damped' : 'critically damped';
    const pill = f.zeta < 1 ? 'pill-blue' : f.zeta > 1 ? 'pill-amber' : 'pill-green';
    el.style.borderLeftColor = '#22c55e';
    el.innerHTML = `
      <div class="verdict">Spring vs gravity, settling to balance <span class="pill ${pill}">${reg}</span></div>
      <p>At rest the spring exactly carries the down-slope pull: kx = mg sinθ, giving x_eq = <span class="num-hi">${(f.equilibriumX * 1000).toFixed(0)} mm</span>. Release it away from there and the net force drives an oscillation.</p>
      <p style="color:var(--muted)">Damping ratio ζ = b ⁄ 2√(km) = <span class="num-hi">${f.zeta.toFixed(2)}</span> (${reg}). ${f.zeta < 1 ? 'It overshoots and rings down.' : f.zeta > 1 ? 'It crawls back without overshooting.' : 'It returns as fast as possible without overshoot.'} Watch the x(t) trace below.</p>`;
  }

  // ── animation ──
  function step(now) {
    if (!lastT) lastT = now;
    const dt = Math.min((now - lastT) / 1000, 0.05); lastT = now;
    if (S.mode === 'playing') {
      acc += dt;
      const h = 1 / 120;
      while (acc >= h) {
        const [nx, nv] = rk4Step(p, S.x, S.v, h);
        S.x = nx; S.v = nv; simT += h; acc -= h;
        samples.push({ t: simT, x: S.x });
        if (samples.length > 1200) samples.shift();
        const fr = deriveForces(p, S);
        if (isSettled(fr, S.v)) { S.mode = 'static'; S.v = 0; break; }
      }
      rebuild();
    }
    drawPlot();
    requestAnimationFrame(step);
  }

  function drawPlot() {
    const w = plot.width, h = plot.height;
    pctx.clearRect(0, 0, w, h);
    pctx.fillStyle = '#0d1117'; pctx.fillRect(0, 0, w, h);
    const xeq = deriveForces(p, S).equilibriumX;
    const xmax = Math.max(XMAX, xeq * 1.4, 0.05);
    const Y = (x) => h - 12 - (x / xmax) * (h - 24);
    // equilibrium line
    pctx.strokeStyle = '#475569'; pctx.setLineDash([4, 3]); pctx.beginPath();
    pctx.moveTo(0, Y(xeq)); pctx.lineTo(w, Y(xeq)); pctx.stroke(); pctx.setLineDash([]);
    pctx.fillStyle = '#64748b'; pctx.font = '10px system-ui';
    pctx.fillText('x_eq', 4, Y(xeq) - 4);
    // trace
    if (samples.length > 1) {
      const tmax = Math.max(samples[samples.length - 1].t, 2);
      pctx.strokeStyle = '#38bdf8'; pctx.lineWidth = 1.8; pctx.beginPath();
      samples.forEach((s, i) => {
        const X = (s.t / tmax) * w, y = Y(s.x);
        i ? pctx.lineTo(X, y) : pctx.moveTo(X, y);
      });
      pctx.stroke();
    }
    pctx.fillStyle = '#64748b'; pctx.fillText('compression x  vs  time', 4, 12);
  }

  // ── drag ──
  function toLocal(e) {
    const r = svg.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H };
  }
  svg.addEventListener('pointerdown', (e) => {
    dragging = true; S.mode = 'dragging'; S.v = 0; svg.setPointerCapture(e.pointerId); dragTo(e);
  });
  svg.addEventListener('pointermove', (e) => { if (dragging) dragTo(e); });
  svg.addEventListener('pointerup', () => { dragging = false; });
  function dragTo(e) {
    const G = geom(), pt = toLocal(e);
    const along = (pt.x - G.A.x) * G.u.x + (pt.y - G.A.y) * G.u.y;
    S.x = Math.max(0, Math.min(XMAX, (REST - along) / PXM));
    rebuild();
  }

  // controls
  const bind = (id, key, disp, fmt, after) => {
    const s = document.getElementById(id);
    s.addEventListener('input', () => {
      p[key] = parseFloat(s.value);
      document.getElementById(disp).textContent = fmt(p[key]);
      if (after) after();
      rebuild();
    });
  };
  bind('lz-m', 'm', 'lz-m-d', v => v.toFixed(1) + ' kg');
  bind('lz-theta', 'thetaDeg', 'lz-theta-d', v => v.toFixed(0) + '°');
  bind('lz-k', 'k', 'lz-k-d', v => v.toFixed(0) + ' N/m');
  bind('lz-b', 'b', 'lz-b-d', v => v.toFixed(1) + ' Ns/m');
  bind('lz-mus', 'muStatic', 'lz-mus-d', v => v.toFixed(2));
  bind('lz-muk', 'muKinetic', 'lz-muk-d', v => v.toFixed(2));

  document.getElementById('lz-release').addEventListener('click', () => {
    S.mode = 'playing'; S.v = 0; simT = 0; acc = 0; samples = [{ t: 0, x: S.x }];
  });
  document.getElementById('lz-reset').addEventListener('click', () => {
    S.mode = 'dragging'; S.x = 0.05; S.v = 0; samples = []; rebuild();
  });

  lTheory('lz-eq-panel', [
    { tag: "Newton's 2nd law (along slope)", tex: 'm\\ddot x = mg\\sin\\theta - kx - b\\dot x - f',
      note: 'Spring and damping fight the gravity component; friction adds a stiction band at rest.' },
    { tag: 'Equilibrium', tex: 'kx_{eq} = mg\\sin\\theta \\;\\Rightarrow\\; x_{eq} = \\dfrac{mg\\sin\\theta}{k}',
      note: 'Where the block finally settles.' },
    { tag: 'Damped oscillation', tex: '\\omega_n = \\sqrt{k/m}, \\quad \\zeta = \\dfrac{b}{2\\sqrt{km}}',
      note: 'ζ < 1 rings (under-damped), ζ = 1 is critical, ζ > 1 crawls back.' },
  ]);
  rebuild();
  requestAnimationFrame(step);
})();
