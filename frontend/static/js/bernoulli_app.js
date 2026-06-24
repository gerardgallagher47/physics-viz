// Bernoulli & Venturi — renderer + animation
//
// Layout (SVG 860 × 400):
//   y  10–115  → pressure profile chart  (orange = dynamic, blue = static)
//   y 115–175  → gap: section labels, no other elements
//   y 175–305  → pipe cross-section  (CY=240, R1=65, R2=38)
//   y 305–365  → velocity labels + continuity note
//   y 365–395  → legend

// ── Geometry ──────────────────────────────────────────────────────────────────
const G = {
  W: 860, H: 400,
  CY: 240,         // pipe centreline
  R1: 65,          // wide-section radius px  → (65/38)² = 2.93 ≈ 3
  R2: 38,          // throat radius px
  X0:  55,         // pipe left
  XW1: 240,        // end of inlet wide
  XT1: 355,        // end of taper-in
  XTH: 560,        // end of throat
  XT2: 680,        // end of taper-out
  X1:  805,        // pipe right
  // chart
  CT: 12,          // chart top y
  CB: 112,         // chart bottom y  (= "baseline" / x-axis of chart)
};

// ── Pipe radius at x ──────────────────────────────────────────────────────────
function pipeR(x) {
  if (x <= G.XW1) return G.R1;
  if (x <= G.XT1) return G.R1 + (G.R2 - G.R1) * (x - G.XW1) / (G.XT1 - G.XW1);
  if (x <= G.XTH) return G.R2;
  if (x <= G.XT2) return G.R2 + (G.R1 - G.R2) * (x - G.XTH) / (G.XT2 - G.XTH);
  return G.R1;
}

// Precompute pipe outline — shape never changes
function buildPipePath() {
  const top = [], bot = [];
  for (let x = G.X0; x <= G.X1; x += 3) {
    const r = pipeR(x);
    top.push(`${x},${G.CY - r}`);
    bot.push(`${x},${G.CY + r}`);
  }
  return `M ${top.join(' L ')} L ${bot.reverse().join(' L ')} Z`;
}
const PIPE_PATH = buildPipePath();

// ── Particles ─────────────────────────────────────────────────────────────────
const LANES     = [-0.70, -0.42, -0.14, 0.14, 0.42, 0.70];
const PER_LANE  = 7;
const PX_S      = 46;   // px per second at 1 m/s
let particles   = [];

function initParticles() {
  const span = G.X1 - G.X0;
  particles = LANES.flatMap(fy =>
    Array.from({ length: PER_LANE }, (_, i) => ({
      x: G.X0 + (i / PER_LANE) * span + Math.random() * 20,
      fy,
    }))
  );
}

// ── SVG helpers ───────────────────────────────────────────────────────────────
const NS = 'http://www.w3.org/2000/svg';

function el(tag, attrs, parent) {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  if (parent) parent.appendChild(e);
  return e;
}

function txt(parent, x, y, content, opts = {}) {
  const t = el('text', {
    x, y,
    fill:                opts.fill    || '#94a3b8',
    'font-size':         opts.size    || 11,
    'font-family':       'system-ui, -apple-system, sans-serif',
    'font-weight':       opts.bold    ? '600' : '400',
    'text-anchor':       opts.anchor  || 'middle',
    'dominant-baseline': opts.base    || 'auto',
  }, parent);
  t.textContent = content;
  return t;
}

function arrow(parent, x1, y1, x2, y2, color, sw = 2.5, hs = 9) {
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
  if (len < 5) return;
  const ux = dx / len, uy = dy / len;
  el('line', { x1, y1, x2: x2 - ux * hs, y2: y2 - uy * hs,
    stroke: color, 'stroke-width': sw, 'stroke-linecap': 'round' }, parent);
  const px = -uy * hs * 0.45, py = ux * hs * 0.45;
  el('polygon', {
    points: `${x2},${y2} ${x2 - ux*hs + px},${y2 - uy*hs + py} ${x2 - ux*hs - px},${y2 - uy*hs - py}`,
    fill: color,
  }, parent);
}

function lerp(a, b, t) { return a + (b - a) * t; }

// ── Pressure profile chart ────────────────────────────────────────────────────
// Sits above the pipe in the same x-coordinate space.
// Bottom of chart (y=CB) = pressure baseline.
// The orange fill (top→curve) = dynamic; blue fill (curve→bottom) = static.
function drawPressureChart(svg, v1) {
  const { CT, CB } = G;
  const H = CB - CT;        // chart height px
  const Pt = BV.P_TOTAL;

  // Sample pressure curve aligned with pipe x positions
  const pts = [];
  for (let x = G.X0; x <= G.X1; x += 3) {
    const r  = pipeR(x);
    const vx = localVelocity(v1, r, G.R1);
    const Px = Pt - 0.5 * BV.RHO * vx * vx;
    const cy = CB - H * (Px / Pt);
    pts.push([x, cy]);
  }

  const ptStr  = pts.map(([x, y]) => `${x},${y}`).join(' L ');
  const firstX = G.X0, lastX = G.X1;

  // Orange: from chart top down to curve, then back along curve to start
  const orangeD = `M ${firstX},${CT} L ${ptStr} L ${lastX},${CT} Z`;
  el('path', { d: orangeD, fill: '#f97316', opacity: '0.65' }, svg);

  // Blue: from baseline up to curve
  const blueD = `M ${firstX},${CB} L ${ptStr} L ${lastX},${CB} Z`;
  el('path', { d: blueD, fill: '#2563eb', opacity: '0.70' }, svg);

  // White pressure curve
  el('path', { d: `M ${ptStr}`, fill: 'none', stroke: '#e2e8f0',
    'stroke-width': '2', 'stroke-linejoin': 'round' }, svg);

  // P_total ceiling (dashed)
  el('line', { x1: G.X0, y1: CT, x2: G.X1, y2: CT,
    stroke: '#475569', 'stroke-width': 1, 'stroke-dasharray': '6,4' }, svg);

  // Chart frame / baseline
  el('line', { x1: G.X0, y1: CB, x2: G.X1, y2: CB,
    stroke: '#1e293b', 'stroke-width': 1 }, svg);

  // Y-axis labels (right-hand side)
  txt(svg, G.X1 + 8, CT + 4,  'P_total', { anchor: 'start', size: 9.5, fill: '#475569' });
  txt(svg, G.X1 + 8, CB,       '0 Pa',    { anchor: 'start', size: 9.5, fill: '#334155', base: 'middle' });

  // Pressure value callouts at inlet and throat centres
  const annoX = [
    { x: (G.X0 + G.XW1) / 2,        label: 'P₁', col: '#60a5fa' },
    { x: (G.XT1 + G.XTH) / 2,       label: 'P₂', col: '#34d399' },
  ];
  annoX.forEach(({ x, label: lbl, col }) => {
    const r  = pipeR(x);
    const vx = localVelocity(v1, r, G.R1);
    const Px = Pt - 0.5 * BV.RHO * vx * vx;
    const cy = CB - H * (Px / Pt);
    // Dot on curve
    el('circle', { cx: x, cy, r: 3.5, fill: col }, svg);
    // Value label above dot
    const val = (Px / 1000).toFixed(1) + ' kPa';
    txt(svg, x, cy - 9, lbl + ' = ' + val, { fill: col, size: 10.5, bold: true });
  });

  // Chart title (top-left)
  txt(svg, G.X0, CT - 4, 'Static pressure along pipe', { anchor: 'start', size: 10, fill: '#475569' });
}

// ── Main diagram render ───────────────────────────────────────────────────────
function renderDiagram(svg, vals) {
  svg.innerHTML = '';

  const { v1, v2, P1, P2, dynP1, dynP2, P_total, deltaP } = vals;

  // ── Defs ──────────────────────────────────────────────────────────
  const defs = el('defs', {}, svg);

  // Clip particles to pipe
  const clip = el('clipPath', { id: 'bv-clip' }, defs);
  el('path', { d: PIPE_PATH }, clip);

  // Fluid fill gradient (x-direction, speed-tinted)
  const fg = el('linearGradient', { id: 'bv-fgrad', x1: '0', x2: '1', y1: '0', y2: '0' }, defs);
  el('stop', { offset: '0%',   'stop-color': '#1e3a6e' }, fg);
  el('stop', { offset: '43%',  'stop-color': '#1e40af' }, fg);
  el('stop', { offset: '50%',  'stop-color': '#0e7490' }, fg);
  el('stop', { offset: '57%',  'stop-color': '#1e40af' }, fg);
  el('stop', { offset: '100%', 'stop-color': '#1e3a6e' }, fg);

  // ── Background ────────────────────────────────────────────────────
  el('rect', { x: 0, y: 0, width: G.W, height: G.H, fill: '#0a0f18' }, svg);

  // Very subtle grid
  for (let gx = 80; gx < G.W; gx += 80)
    el('line', { x1: gx, y1: 0, x2: gx, y2: G.H,
      stroke: '#0d1520', 'stroke-width': 1 }, svg);
  for (let gy = 50; gy < G.H; gy += 50)
    el('line', { x1: 0, y1: gy, x2: G.W, y2: gy,
      stroke: '#0d1520', 'stroke-width': 1 }, svg);

  // ── [ZONE 1] Pressure profile chart ──────────────────────────────
  drawPressureChart(svg, v1);

  // ── [ZONE 2] Section labels (gap, y=115–175) ──────────────────────
  // These have the entire gap zone, no overlap possible.
  const sectionY = 138;
  const sections = [
    { x: (G.X0 + G.XW1) / 2,      sym: '①', name: 'Inlet' },
    { x: (G.XT1 + G.XTH) / 2,     sym: '②', name: 'Throat' },
    { x: (G.XT2 + G.X1) / 2,      sym: '③', name: 'Outlet' },
  ];
  sections.forEach(({ x, sym, name }) => {
    // Subtle vertical guide from chart bottom to pipe top
    el('line', { x1: x, y1: G.CB + 2, x2: x, y2: G.CY - G.R1 - 4,
      stroke: '#1e293b', 'stroke-width': 1, 'stroke-dasharray': '3,4' }, svg);
    txt(svg, x, sectionY,      sym, { fill: '#334155', size: 13, bold: true });
    txt(svg, x, sectionY + 16, name, { fill: '#1e293b', size: 10  });
  });

  // ── [ZONE 3] Pipe ─────────────────────────────────────────────────

  // Fluid fill
  el('path', { d: PIPE_PATH, fill: 'url(#bv-fgrad)', opacity: '0.92' }, svg);

  // Particles (clipped to pipe interior)
  const pgrp = el('g', { 'clip-path': 'url(#bv-clip)' }, svg);
  particles.forEach(p => {
    const r  = pipeR(p.x);
    const py = G.CY + p.fy * r;
    const vL = localVelocity(v1, r, G.R1);
    const t  = Math.min(vL / Math.max(v2, 0.01), 1);
    const R_ = Math.round(lerp(0x60, 0x00, t));
    const Gv = Math.round(lerp(0xa5, 0xe0, t));
    el('circle', { cx: p.x.toFixed(1), cy: py.toFixed(1), r: 2.5,
      fill: `rgb(${R_},${Gv},255)`, opacity: '0.85' }, pgrp);
  });

  // Wall outline — drawn AFTER particles so it sits on top
  el('path', { d: PIPE_PATH, fill: 'none',
    stroke: '#334155', 'stroke-width': '2.5' }, svg);

  // End caps
  el('line', { x1: G.X0, y1: G.CY - G.R1, x2: G.X0, y2: G.CY + G.R1,
    stroke: '#475569', 'stroke-width': '2.5' }, svg);
  el('line', { x1: G.X1, y1: G.CY - G.R1, x2: G.X1, y2: G.CY + G.R1,
    stroke: '#475569', 'stroke-width': '2.5' }, svg);

  // ── Velocity arrows ───────────────────────────────────────────────
  // One prominent set per section; length ∝ velocity, capped to section width.
  const VCOL  = '#fbbf24';
  const VSCALE = 11; // px per m/s

  function drawVelocitySet(cx, radius, v, maxLen) {
    const len = Math.min(v * VSCALE, maxLen);
    const ySteps = radius <= G.R2 ? [-12, 0, 12] : [-24, 0, 24];
    ySteps.forEach(dy => {
      if (Math.abs(dy) < radius - 6)
        arrow(svg, cx, G.CY + dy, cx + len, G.CY + dy, VCOL, 2.2, 7);
    });
  }

  const inletCX  = G.X0 + 55;
  const throatCX = G.XT1 + 30;
  drawVelocitySet(inletCX,  G.R1, v1, G.XW1 - inletCX - 15);
  drawVelocitySet(throatCX, G.R2, v2, G.XTH - throatCX - 15);

  // ── [ZONE 4] Labels below pipe ────────────────────────────────────
  const lblY = G.CY + G.R1 + 30;  // y=305 + some margin

  txt(svg, inletCX + Math.min(v1 * VSCALE, 100) / 2, lblY,
    `v₁ = ${v1.toFixed(2)} m/s`, { fill: VCOL, size: 12.5, bold: true });

  txt(svg, throatCX + Math.min(v2 * VSCALE, 150) / 2, lblY,
    `v₂ = ${v2.toFixed(2)} m/s`, { fill: VCOL, size: 12.5, bold: true });

  // ΔP badge (centred)
  const dpX = G.W / 2 + 60;
  txt(svg, dpX, lblY,
    `ΔP = ${(deltaP / 1000).toFixed(2)} kPa`,
    { fill: '#f97316', size: 12.5, bold: true });

  // Continuity note
  txt(svg, G.W / 2, lblY + 22,
    `A₁v₁ = A₂v₂   →   v₂ = ${BV.AREA_RATIO}v₁   (area ratio A₁/A₂ = ${BV.AREA_RATIO})`,
    { fill: '#334155', size: 10.5 });

  // ── [ZONE 5] Legend ───────────────────────────────────────────────
  const LY = G.H - 18;
  const items = [
    { type: 'rect', fill: '#2563eb', label: 'Static pressure  P' },
    { type: 'rect', fill: '#f97316', label: 'Dynamic  ½ρv²' },
    { type: 'circle', fill: '#60a5fa', label: 'Slow' },
    { type: 'circle', fill: '#00e5ff', label: 'Fast' },
  ];
  let lx = 200;
  items.forEach(item => {
    if (item.type === 'rect') {
      el('rect', { x: lx, y: LY - 9, width: 13, height: 9,
        fill: item.fill, rx: 2 }, svg);
      lx += 16;
    } else {
      el('circle', { cx: lx + 5, cy: LY - 4, r: 4, fill: item.fill }, svg);
      lx += 13;
    }
    txt(svg, lx + 2, LY, item.label, { anchor: 'start', size: 10.5, fill: '#475569' });
    lx += item.label.length * 6.5 + 18;
  });
}

// ── Equation panel (re-rendered only when v1 changes) ─────────────────────────
let _lastEqV1 = null;
function renderEquations(vals) {
  if (vals.v1 === _lastEqV1) return;
  _lastEqV1 = vals.v1;

  const panel = document.getElementById('bv-eq-panel');
  if (!panel || typeof katex === 'undefined') return;
  panel.innerHTML = '';

  const { v1, v2, deltaP, P_total, rho, areaRatio } = vals;

  [
    {
      tag: 'Continuity',
      col: '#60a5fa',
      eq:  'A_1 v_1 = A_2 v_2',
      sub: `v_2 = \\tfrac{A_1}{A_2}\\,v_1 = ${areaRatio}\\,v_1`,
      res: `v_2 = ${v2.toFixed(3)}\\;\\text{m/s}`,
    },
    {
      tag: 'Bernoulli',
      col: '#a78bfa',
      eq:  'P + \\tfrac{1}{2}\\rho v^2 = P_{\\mathrm{total}}',
      sub: `= ${(P_total/1000).toFixed(0)}\\;\\text{kPa (constant)}`,
      res: 'P_1 + \\tfrac{1}{2}\\rho v_1^2 = P_2 + \\tfrac{1}{2}\\rho v_2^2',
    },
    {
      tag: 'Pressure drop',
      col: '#f97316',
      eq:  '\\Delta P = \\tfrac{1}{2}\\rho\\,(v_2^2 - v_1^2)',
      sub: `= \\tfrac{1}{2}(${rho})(${v2.toFixed(1)}^2 - ${v1.toFixed(1)}^2)`,
      res: `\\Delta P = ${(deltaP/1000).toFixed(3)}\\;\\text{kPa}`,
    },
  ].forEach(row => {
    const wrap = document.createElement('div');
    wrap.className = 'bv-eq-row';
    wrap.style.borderLeftColor = row.col;

    const tag = document.createElement('span');
    tag.className = 'bv-eq-tag';
    tag.textContent = row.tag;
    tag.style.color = row.col;
    wrap.appendChild(tag);

    [row.eq, row.sub, row.res].forEach((src, i) => {
      const d = document.createElement('div');
      d.className = ['bv-eq-main', 'bv-eq-sub', 'bv-eq-result'][i];
      if (i === 2) d.style.color = row.col;
      try { katex.render(src, d, { throwOnError: false }); } catch(_) { d.textContent = src; }
      wrap.appendChild(d);
    });
    panel.appendChild(wrap);
  });
}

// ── Values table (re-rendered only when v1 changes) ───────────────────────────
let _lastValV1 = null;
function renderValues(vals) {
  if (vals.v1 === _lastValV1) return;
  _lastValV1 = vals.v1;

  const panel = document.getElementById('bv-values-panel');
  if (!panel) return;
  panel.innerHTML = '';

  const { v1, v2, P1, P2, dynP1, dynP2, deltaP, P_total } = vals;
  const rows = [
    ['',               '① Inlet',                '② Throat'],
    ['v  (m/s)',       v1.toFixed(3),             v2.toFixed(3)],
    ['P static (kPa)', (P1/1000).toFixed(2),      (P2/1000).toFixed(2)],
    ['½ρv²  (kPa)',    (dynP1/1000).toFixed(2),   (dynP2/1000).toFixed(2)],
    ['P_total (kPa)',  (P_total/1000).toFixed(2), (P_total/1000).toFixed(2)],
    ['ΔP  (kPa)',      (deltaP/1000).toFixed(3),  '—'],
  ];
  const colCols = [null, null, '#60a5fa', '#f97316', '#a78bfa', '#f97316'];

  const tbl = document.createElement('table');
  tbl.className = 'bv-val-table';
  rows.forEach((row, ri) => {
    const tr = document.createElement('tr');
    if (ri === 0) tr.className = 'bv-val-header';
    row.forEach((cell, ci) => {
      const td = document.createElement(ri === 0 ? 'th' : 'td');
      td.textContent = cell;
      if (ri > 0 && ci > 0 && colCols[ri]) td.style.color = colCols[ri];
      tr.appendChild(td);
    });
    tbl.appendChild(tr);
  });
  panel.appendChild(tbl);
}

// ── RAF loop ──────────────────────────────────────────────────────────────────
let bvV1 = 2.0, bvLastTs = null, bvSvg = null;

function bvLoop(ts) {
  if (bvLastTs !== null) {
    const dt = Math.min((ts - bvLastTs) / 1000, 0.05);
    particles.forEach(p => {
      const r  = pipeR(p.x);
      p.x += localVelocity(bvV1, r, G.R1) * PX_S * dt;
      if (p.x > G.X1) p.x = G.X0 + (p.x - G.X1) % (G.X1 - G.X0);
    });
  }
  bvLastTs = ts;
  const vals = bernoulliDerive(bvV1);
  renderDiagram(bvSvg, vals);
  renderEquations(vals);
  renderValues(vals);
  requestAnimationFrame(bvLoop);
}

// ── Init ──────────────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  bvSvg = document.getElementById('bv-svg');
  initParticles();

  const slider  = document.getElementById('bv-v1-slider');
  const display = document.getElementById('bv-v1-display');
  slider.addEventListener('input', () => {
    bvV1 = parseFloat(slider.value);
    display.textContent = `${bvV1.toFixed(1)} m/s`;
  });

  requestAnimationFrame(bvLoop);
});
