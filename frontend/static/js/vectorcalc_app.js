// Vector calculus interactive — Curl, Divergence, Green's & Stokes.
//
// One vector field, one draggable circular loop.  The loop's boundary
// line integrals (circulation & flux) are shown next to the area
// integrals of curl & divergence over the enclosed disc — i.e. Green's
// theorem, live.  A paddle wheel spins at the local curl; a pulsing
// star shows the local divergence.

const NS = 'http://www.w3.org/2000/svg';

// ── Geometry ──────────────────────────────────────────────────────────
const D = {
  W: 680, H: 600,
  PAD_L: 70, PAD_T: 28, SIZE: 524,         // field square in px
};
D.SCALE = D.SIZE / (VC.XMAX - VC.XMIN);     // px per world unit (~65.5)

const wx2sx = (x) => D.PAD_L + (x - VC.XMIN) * D.SCALE;
const wy2sy = (y) => D.PAD_T + (VC.YMAX - y) * D.SCALE;
const sx2wx = (sx) => (sx - D.PAD_L) / D.SCALE + VC.XMIN;
const sy2wy = (sy) => VC.YMAX - (sy - D.PAD_T) / D.SCALE;

// ── SVG helpers ───────────────────────────────────────────────────────
function el(tag, attrs, parent) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, String(attrs[k]));
  if (parent) parent.appendChild(e);
  return e;
}
function txt(parent, x, y, s, o = {}) {
  const t = el('text', {
    x, y, fill: o.fill || '#94a3b8',
    'font-size': o.size || 12,
    'font-family': 'system-ui,-apple-system,sans-serif',
    'font-weight': o.bold ? '700' : '400',
    'text-anchor': o.anchor || 'middle',
    'dominant-baseline': o.base || 'auto',
    opacity: o.opacity != null ? o.opacity : 1,
  }, parent);
  t.textContent = s;
  return t;
}
// Arrow from (x1,y1) to (x2,y2) in px
function arrow(parent, x1, y1, x2, y2, color, sw, head) {
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
  if (len < 0.6) return;
  const ux = dx / len, uy = dy / len;
  const hs = head != null ? head : Math.min(len * 0.5, 7);
  el('line', { x1, y1, x2: x2 - ux * hs * 0.6, y2: y2 - uy * hs * 0.6,
    stroke: color, 'stroke-width': sw, 'stroke-linecap': 'round' }, parent);
  const px = -uy * hs * 0.42, py = ux * hs * 0.42;
  el('polygon', {
    points: `${x2},${y2} ${x2 - ux * hs + px},${y2 - uy * hs + py} ${x2 - ux * hs - px},${y2 - uy * hs - py}`,
    fill: color }, parent);
}

// ── State ─────────────────────────────────────────────────────────────
const S = {
  fieldKey: 'vortex',
  mode: 'curl',           // 'curl' (circulation) | 'flux'
  r: 1.0,                 // probe radius (world units)
  cx: 1.4, cy: 0.9,       // probe centre (world)
};

// animation refs (re-created each rebuild)
let anim = { paddle: null, pulse: null, curl: 0, div: 0, cxpx: 0, cypx: 0 };
let phase = 0, lastT = 0;

// ── Colour ramp for field arrows (dim slate → bright cyan) ────────────
function magColor(t) {
  t = Math.max(0, Math.min(1, t));
  const lerp = (a, b) => Math.round(a + (b - a) * t);
  return `rgb(${lerp(74, 125)},${lerp(94, 211)},${lerp(135, 252)})`;
}

// ── Build the whole diagram ───────────────────────────────────────────
function rebuild() {
  const svg = document.getElementById('vc-svg');
  svg.innerHTML = '';
  const f = FIELDS[S.fieldKey];

  // background
  el('rect', { x: 0, y: 0, width: D.W, height: D.H, fill: '#0d1117' }, svg);

  // ── grid lines + axes ───────────────────────────────────────────────
  const gGrid = el('g', {}, svg);
  for (let i = VC.XMIN; i <= VC.XMAX; i++) {
    const sx = wx2sx(i), sy = wy2sy(i);
    const major = i === 0;
    el('line', { x1: sx, y1: D.PAD_T, x2: sx, y2: D.PAD_T + D.SIZE,
      stroke: major ? '#2d3b52' : '#171f2e', 'stroke-width': major ? 1.5 : 1 }, gGrid);
    el('line', { x1: D.PAD_L, y1: sy, x2: D.PAD_L + D.SIZE, y2: sy,
      stroke: major ? '#2d3b52' : '#171f2e', 'stroke-width': major ? 1.5 : 1 }, gGrid);
  }
  txt(gGrid, D.PAD_L + D.SIZE + 4, wy2sy(0) + 4, 'x', { fill: '#475569', size: 12, anchor: 'start' });
  txt(gGrid, wx2sx(0) - 6, D.PAD_T - 8, 'y', { fill: '#475569', size: 12, anchor: 'end' });

  // ── vector field arrows ─────────────────────────────────────────────
  const gField = el('g', {}, svg);
  const step = 0.7, lo = -3.5, hi = 3.5;
  // find max magnitude for normalisation
  let maxMag = 1e-6;
  for (let x = lo; x <= hi + 1e-9; x += step)
    for (let y = lo; y <= hi + 1e-9; y += step)
      maxMag = Math.max(maxMag, Math.hypot(f.P(x, y), f.Q(x, y)));
  const maxLen = step * D.SCALE * 0.62;

  for (let x = lo; x <= hi + 1e-9; x += step) {
    for (let y = lo; y <= hi + 1e-9; y += step) {
      const px = f.P(x, y), py = f.Q(x, y), mag = Math.hypot(px, py);
      const sx = wx2sx(x), sy = wy2sy(y);
      if (mag < 1e-6) { el('circle', { cx: sx, cy: sy, r: 1.6, fill: '#334155' }, gField); continue; }
      const t = mag / maxMag;
      const L = 5 + t * (maxLen - 5);
      const ux = px / mag, uy = -py / mag;            // flip y for screen
      arrow(gField, sx, sy, sx + ux * L, sy + uy * L, magColor(t), 1.6, 5.5);
    }
  }

  // ── probe (loop) ────────────────────────────────────────────────────
  const cxpx = wx2sx(S.cx), cypx = wy2sy(S.cy), rpx = S.r * D.SCALE;
  const gProbe = el('g', {}, svg);

  // disc fill tinted by active mode
  const discCol = S.mode === 'curl' ? 'rgba(16,185,129,0.10)' : 'rgba(249,115,22,0.10)';
  el('circle', { cx: cxpx, cy: cypx, r: rpx, fill: discCol,
    stroke: S.mode === 'curl' ? '#10b981' : '#f97316', 'stroke-width': 2 }, gProbe);

  // boundary sample arrows + component decomposition
  const N = 18;
  for (let i = 0; i < N; i++) {
    const th = 2 * Math.PI * i / N;
    const wx = S.cx + S.r * Math.cos(th), wy = S.cy + S.r * Math.sin(th);
    const bx = wx2sx(wx), by = wy2sy(wy);
    const px = f.P(wx, wy), py = f.Q(wx, wy), mag = Math.hypot(px, py);
    if (mag < 1e-6) continue;
    const t = mag / maxMag;
    const L = 6 + t * (maxLen * 1.15 - 6);
    const ux = px / mag, uy = -py / mag;
    // faint full field arrow
    arrow(gProbe, bx, by, bx + ux * L, by + uy * L, 'rgba(148,163,184,0.5)', 1.4, 5);

    if (S.mode === 'curl') {
      // tangential component (CCW tangent): t̂ = (−sin, cos) in world;
      // on screen (y flipped) the tangent unit is (−sin th, −cos th)
      const comp = px * -Math.sin(th) + py * Math.cos(th);
      const sUx = -Math.sin(th), sUy = -Math.cos(th);
      const cl = (comp / maxMag) * maxLen * 1.3;
      arrow(gProbe, bx, by, bx + sUx * cl, by + sUy * cl, '#34d399', 2.6, 7);
    } else {
      // outward normal component: n̂ = (cos, sin) world ; screen (cos, −sin)
      const comp = px * Math.cos(th) + py * Math.sin(th);
      const sUx = Math.cos(th), sUy = -Math.sin(th);
      const cl = (comp / maxMag) * maxLen * 1.3;
      arrow(gProbe, bx, by, bx + sUx * cl, by + sUy * cl, '#fb923c', 2.6, 7);
    }
  }

  // ── animated layer: paddle wheel (curl) + divergence pulse ──────────
  const gAnim = el('g', {}, svg);

  // divergence pulse star (drawn first, behind paddle)
  const divC = f.div();
  const gPulse = el('g', {}, gAnim);
  if (Math.abs(divC) > 1e-6) {
    const col = divC > 0 ? '#f87171' : '#60a5fa';
    const baseLen = Math.min(Math.abs(divC) * 9 + 8, rpx * 0.55);
    for (let k = 0; k < 8; k++) {
      const a = Math.PI * 2 * k / 8;
      const dx = Math.cos(a), dy = Math.sin(a);
      if (divC > 0) arrow(gPulse, cxpx, cypx, cxpx + dx * baseLen, cypx + dy * baseLen, col, 1.8, 5);
      else          arrow(gPulse, cxpx + dx * baseLen, cypx + dy * baseLen, cxpx + dx * 4, cypx + dy * 4, col, 1.8, 5);
    }
  }

  // paddle wheel
  const gPaddle = el('g', {}, gAnim);
  const curlC = f.curl();
  const pr = Math.min(rpx * 0.5, 30);
  if (Math.abs(curlC) > 1e-6) {
    for (let k = 0; k < 4; k++) {
      const a = Math.PI / 2 * k;
      el('line', { x1: cxpx, y1: cypx,
        x2: cxpx + Math.cos(a) * pr, y2: cypx + Math.sin(a) * pr,
        stroke: '#10b981', 'stroke-width': 3, 'stroke-linecap': 'round' }, gPaddle);
      el('circle', { cx: cxpx + Math.cos(a) * pr, cy: cypx + Math.sin(a) * pr,
        r: 3.5, fill: '#34d399' }, gPaddle);
    }
  }
  el('circle', { cx: cxpx, cy: cypx, r: 4.5, fill: '#fbbf24', stroke: '#0d1117', 'stroke-width': 1.5 }, gPaddle);

  anim = { paddle: gPaddle, pulse: gPulse, curl: curlC, div: divC, cxpx, cypx };

  // ── title strip ─────────────────────────────────────────────────────
  txt(svg, D.PAD_L, 18, `${f.name} field   F = ${plainLatex(f.latex)}`,
    { fill: '#cbd5e1', size: 13, bold: true, anchor: 'start' });
  txt(svg, D.W - 12, 18,
    S.mode === 'curl' ? 'Tangential view → circulation' : 'Normal view → flux',
    { fill: S.mode === 'curl' ? '#34d399' : '#fb923c', size: 12, bold: true, anchor: 'end' });

  // legend (bottom)
  const ly = D.PAD_T + D.SIZE + 24;
  legendSwatch(svg, D.PAD_L, ly, '#34d399', S.mode === 'curl' ? 'tangential comp (∮F·dr)' : 'paddle = curl');
  legendSwatch(svg, D.PAD_L + 205, ly, '#fb923c', S.mode === 'flux' ? 'normal comp (∮F·n ds)' : 'flux normals');
  legendSwatch(svg, D.PAD_L + 380, ly, '#f87171', 'divergence ±');
}

function legendSwatch(svg, x, y, color, label) {
  el('circle', { cx: x, cy: y - 4, r: 5, fill: color }, svg);
  txt(svg, x + 12, y, label, { fill: '#64748b', size: 11, anchor: 'start' });
}

// strip latex markup for the SVG plain-text title
function plainLatex(s) {
  return s.replace(/\\langle/g, '⟨').replace(/\\rangle/g, '⟩').replace(/\\;/g, '').replace(/\s+/g, ' ').trim();
}

// ── Animation loop (only mutates the animated layer) ──────────────────
function tick(now) {
  if (!lastT) lastT = now;
  const dt = Math.min((now - lastT) / 1000, 0.05);
  lastT = now;
  phase += dt;

  if (anim.paddle && Math.abs(anim.curl) > 1e-6) {
    // spin rate ∝ curl (deg/s).  Positive curl → CCW (negative screen angle)
    const ang = -anim.curl * 40 * phase;
    anim.paddle.setAttribute('transform', `rotate(${ang} ${anim.cxpx} ${anim.cypx})`);
  }
  if (anim.pulse && Math.abs(anim.div) > 1e-6) {
    const s = 1 + 0.22 * Math.sin(phase * 3.2);
    anim.pulse.setAttribute('transform',
      `translate(${anim.cxpx} ${anim.cypx}) scale(${s.toFixed(3)}) translate(${-anim.cxpx} ${-anim.cypx})`);
  }
  requestAnimationFrame(tick);
}

// ── Readouts: Green's theorem, live ───────────────────────────────────
function renderReadout() {
  const f = FIELDS[S.fieldKey];
  const area = Math.PI * S.r * S.r;
  const circ = circulation(f, S.cx, S.cy, S.r);
  const flux = outwardFlux(f, S.cx, S.cy, S.r);
  const curlA = curlAreaIntegral(f, S.cx, S.cy, S.r);
  const divA = divAreaIntegral(f, S.cx, S.cy, S.r);
  const fmt = (v) => (Math.abs(v) < 5e-3 ? '0.00' : v.toFixed(2));
  const match = (a, b) => Math.abs(a - b) < 0.05 + 0.02 * Math.abs(a);

  const panel = document.getElementById('vc-readout');
  panel.innerHTML = `
    <div class="vc-ro-card curl">
      <div class="vc-ro-title">Curl · Circulation  (Green I)</div>
      <div class="vc-ro-line"><span class="lbl" data-k>∮<sub>C</sub> F·dr  (boundary)</span><span class="val">${fmt(circ)}</span></div>
      <div class="vc-ro-line"><span class="lbl">∬<sub>R</sub> (∇×F)·k̂ dA  (area)</span><span class="val">${fmt(curlA)}</span></div>
      <div class="vc-ro-line"><span class="lbl">curl at centre</span><span class="val">${fmt(f.curl())}</span></div>
      ${match(circ, curlA) ? '<div class="vc-ro-match">✓ boundary = area integral</div>' : ''}
    </div>
    <div class="vc-ro-card flux">
      <div class="vc-ro-title">Divergence · Flux  (Green II)</div>
      <div class="vc-ro-line"><span class="lbl">∮<sub>C</sub> F·n ds  (boundary)</span><span class="val">${fmt(flux)}</span></div>
      <div class="vc-ro-line"><span class="lbl">∬<sub>R</sub> (∇·F) dA  (area)</span><span class="val">${fmt(divA)}</span></div>
      <div class="vc-ro-line"><span class="lbl">div at centre</span><span class="val">${fmt(f.div())}</span></div>
      ${match(flux, divA) ? '<div class="vc-ro-match">✓ boundary = area integral</div>' : ''}
    </div>
    <div class="vc-ro-card" style="border-left-color:#64748b">
      <div class="vc-ro-line"><span class="lbl">loop radius r</span><span class="val">${S.r.toFixed(2)}</span></div>
      <div class="vc-ro-line"><span class="lbl">enclosed area πr²</span><span class="val">${area.toFixed(2)}</span></div>
    </div>`;
}

// ── Static theorem cards (KaTeX, rendered once) ───────────────────────
function renderTheory() {
  const panel = document.getElementById('vc-eq-panel');
  if (!panel || typeof katex === 'undefined') return;
  const cards = [
    { tag: 'Divergence', tex: '\\operatorname{div}\\mathbf F = \\nabla\\!\\cdot\\!\\mathbf F = \\dfrac{\\partial P}{\\partial x} + \\dfrac{\\partial Q}{\\partial y}',
      note: 'Net outward flow per unit area. Positive = source, negative = sink. The pulsing star shows its sign.' },
    { tag: 'Curl (z-component)', tex: '(\\nabla\\times\\mathbf F)\\cdot\\mathbf{\\hat k} = \\dfrac{\\partial Q}{\\partial x} - \\dfrac{\\partial P}{\\partial y}',
      note: 'Local rotation rate. The paddle wheel spins at exactly this value — its direction shows the sign.' },
    { tag: "Green's Theorem — circulation form", tex: '\\oint_{C}\\mathbf F\\cdot d\\mathbf r = \\iint_{R}\\!\\Big(\\dfrac{\\partial Q}{\\partial x} - \\dfrac{\\partial P}{\\partial y}\\Big)dA',
      note: 'Total circulation around the loop equals the total curl inside it. Drag the loop — the two numbers stay equal.' },
    { tag: "Green's Theorem — flux form", tex: '\\oint_{C}\\mathbf F\\cdot\\mathbf{\\hat n}\\,ds = \\iint_{R}\\nabla\\!\\cdot\\!\\mathbf F\\,dA',
      note: 'Total outward flux through the loop equals the total divergence inside it (the Divergence Theorem in 2-D).' },
    { tag: "Stokes' Theorem", tex: '\\oint_{\\partial S}\\mathbf F\\cdot d\\mathbf r = \\iint_{S}(\\nabla\\times\\mathbf F)\\cdot d\\mathbf S',
      note: "The 3-D generalisation: Green's circulation form is just Stokes for a flat region in the plane." },
  ];
  panel.innerHTML = '';
  cards.forEach(c => {
    const div = document.createElement('div');
    div.className = 'vc-eq-card';
    const tag = document.createElement('div');
    tag.className = 'vc-eq-tag'; tag.textContent = c.tag;
    const body = document.createElement('div');
    body.className = 'vc-eq-body';
    katex.render(c.tex, body, { throwOnError: false, displayMode: false });
    const note = document.createElement('div');
    note.className = 'vc-eq-note'; note.textContent = c.note;
    div.append(tag, body, note);
    panel.appendChild(div);
  });
}

// ── Interaction ───────────────────────────────────────────────────────
function clampProbe() {
  const m = S.r + 0.05;
  S.cx = Math.max(VC.XMIN + m, Math.min(VC.XMAX - m, S.cx));
  S.cy = Math.max(VC.YMIN + m, Math.min(VC.YMAX - m, S.cy));
}

function update() { rebuild(); renderReadout(); }

(function init() {
  const svg = document.getElementById('vc-svg');

  // field buttons
  document.querySelectorAll('.vc-field-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      S.fieldKey = btn.dataset.field;
      document.querySelectorAll('.vc-field-btn').forEach(b => b.classList.toggle('active', b === btn));
      document.getElementById('vc-blurb').textContent = FIELDS[S.fieldKey].blurb;
      phase = 0;
      update();
    });
  });

  // mode buttons
  document.querySelectorAll('.vc-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      S.mode = btn.dataset.mode;
      document.querySelectorAll('.vc-mode-btn').forEach(b => b.classList.toggle('active', b === btn));
      update();
    });
  });

  // radius slider
  const rs = document.getElementById('vc-r-slider');
  rs.addEventListener('input', () => {
    S.r = parseFloat(rs.value);
    document.getElementById('vc-r-display').textContent = S.r.toFixed(2);
    clampProbe();
    update();
  });

  // drag the loop
  let dragging = false;
  function moveTo(evt) {
    const rect = svg.getBoundingClientRect();
    const sx = (evt.clientX - rect.left) / rect.width * D.W;
    const sy = (evt.clientY - rect.top) / rect.height * D.H;
    S.cx = sx2wx(sx); S.cy = sy2wy(sy);
    clampProbe();
    update();
  }
  svg.addEventListener('pointerdown', (e) => {
    dragging = true; svg.classList.add('dragging');
    svg.setPointerCapture(e.pointerId); moveTo(e);
  });
  svg.addEventListener('pointermove', (e) => { if (dragging) moveTo(e); });
  svg.addEventListener('pointerup', (e) => { dragging = false; svg.classList.remove('dragging'); });
  svg.addEventListener('pointercancel', () => { dragging = false; svg.classList.remove('dragging'); });

  // initial active states
  document.querySelector(`.vc-field-btn[data-field="${S.fieldKey}"]`)?.classList.add('active');
  document.querySelector(`.vc-mode-btn[data-mode="${S.mode}"]`)?.classList.add('active');
  document.getElementById('vc-blurb').textContent = FIELDS[S.fieldKey].blurb;

  renderTheory();
  update();
  requestAnimationFrame(tick);
})();
