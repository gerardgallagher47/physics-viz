// Aircraft wing (airfoil) Bernoulli diagram
//
// Static render on every slider change — no RAF loop needed (no particles).
// Single source of truth: wingDerive() from wing_physics.js

// ── SVG helpers ──────────────────────────────────────────────────────
const WNS = 'http://www.w3.org/2000/svg';

function wel(tag, attrs, parent) {
  const e = document.createElementNS(WNS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  if (parent) parent.appendChild(e);
  return e;
}

function wtxt(parent, x, y, content, opts = {}) {
  const t = wel('text', {
    x, y,
    fill:             opts.fill    || '#94a3b8',
    'font-size':      opts.size    || 11,
    'font-family':    'system-ui,-apple-system,sans-serif',
    'font-weight':    opts.bold    ? '700' : '400',
    'text-anchor':    opts.anchor  || 'middle',
    'dominant-baseline': opts.base || 'auto',
    opacity:          opts.opacity != null ? opts.opacity : 1,
  }, parent);
  t.textContent = content;
  return t;
}

// Arrow with arrowhead
function warrow(parent, x1, y1, x2, y2, color, sw = 3, hs = 10) {
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
  if (len < 4) return;
  const ux = dx / len, uy = dy / len;
  const shaft_x2 = x2 - ux * hs * 0.85;
  const shaft_y2 = y2 - uy * hs * 0.85;
  wel('line', { x1, y1, x2: shaft_x2, y2: shaft_y2,
    stroke: color, 'stroke-width': sw, 'stroke-linecap': 'round' }, parent);
  const px = -uy * hs * 0.42, py = ux * hs * 0.42;
  wel('polygon', {
    points: `${x2},${y2} ${x2 - ux * hs + px},${y2 - uy * hs + py} ${x2 - ux * hs - px},${y2 - uy * hs - py}`,
    fill: color,
  }, parent);
}

// ── Wing geometry (pixel coords in 900×400 SVG) ──────────────────────
// NACA 2412-inspired profile at ~5° AoA.
// LE = leading edge, TE = trailing edge
const WG = {
  W: 900, H: 400,
  LE: [188, 205],
  TE: [565, 200],
  // Upper surface path (two cubic bezier segments)
  UPPER: 'M 188,205 C 242,178 368,161 458,169 C 508,174 548,188 565,200',
  // Lower surface path
  LOWER: 'M 188,205 C 248,212 388,220 472,216 C 522,210 550,204 565,200',
  // Closed path for wing fill
  FILL:  'M 188,205 C 242,178 368,161 458,169 C 508,174 548,188 565,200'
        + ' C 550,204 522,210 472,216 C 388,220 248,212 188,205 Z',
  // Approximate upper surface y at midchord (for lift arrow origin)
  UPPER_MID_Y: 168,
  UPPER_MID_X: 375,
};

// ── Streamlines ──────────────────────────────────────────────────────
// Hand-tuned cubic bezier paths.
// All stay outside the wing interior.
// "closeness" (0=far, 1=near wing) drives colour intensity.

const SL_ABOVE = [
  { d: 'M 25,82  C 450,82  700,82  885,82',                                              c: 0.00 },
  { d: 'M 25,104 C 450,103 700,104 885,104',                                             c: 0.10 },
  { d: 'M 25,122 C 300,121 600,122 885,122',                                             c: 0.25 },
  { d: 'M 25,139 C 200,137 500,137 700,139 C 800,140 860,139 885,139',                   c: 0.45 },
  { d: 'M 25,154 C 160,150 300,141 395,138 C 490,136 570,143 660,149 C 770,152 845,153 885,153', c: 0.72 },
  { d: 'M 25,166 C 146,160 268,148 388,144 C 490,141 567,149 652,157 C 757,162 841,164 885,165', c: 1.00 },
];

const SL_BELOW = [
  { d: 'M 25,222 C 220,228 420,232 510,230 C 590,228 670,224 760,221 C 840,220 885,221 885,221', c: 1.00 },
  { d: 'M 25,243 C 260,248 460,252 550,250 C 630,248 710,243 790,241 C 850,240 885,241 885,241', c: 0.60 },
  { d: 'M 25,265 C 300,267 600,266 885,264',                                             c: 0.30 },
  { d: 'M 25,289 C 350,289 600,289 885,288',                                             c: 0.10 },
  { d: 'M 25,311 C 400,311 650,311 885,310',                                             c: 0.00 },
];

// ── Main render ──────────────────────────────────────────────────────

function renderWingDiagram(svg, vals) {
  svg.innerHTML = '';
  const { v, lift, drag, dP_peak, q } = vals;
  const intensity = Math.min(v / 55, 1);

  // ── Defs ────────────────────────────────────────────────────────────
  const defs = wel('defs', {}, svg);

  // Pressure field gradient (warm above, cool below, fades at edges)
  const pg = wel('linearGradient', { id: 'w-pgrad', x1:'0', y1:'0', x2:'0', y2:'1',
    gradientUnits: 'objectBoundingBox' }, defs);
  [
    { offset:'0%',   color:'#ef4444', op: 0 },
    { offset:'22%',  color:'#ef4444', op: intensity * 0.28 },
    { offset:'38%',  color:'#f97316', op: intensity * 0.14 },
    { offset:'48%',  color:'#0f172a', op: 0 },   // null zone at wing chord
    { offset:'55%',  color:'#1d4ed8', op: intensity * 0.14 },
    { offset:'68%',  color:'#1d4ed8', op: intensity * 0.28 },
    { offset:'100%', color:'#1d4ed8', op: 0 },
  ].forEach(s => wel('stop', { offset: s.offset,
    'stop-color': s.color, 'stop-opacity': s.op.toFixed(3) }, pg));

  // Wing surface gradient (dark blue-grey, 3-D effect)
  const wf = wel('linearGradient', { id: 'w-fill', x1:'0', y1:'0', x2:'0', y2:'1',
    gradientUnits: 'objectBoundingBox' }, defs);
  wel('stop', { offset:'0%',   'stop-color':'#28386a' }, wf);
  wel('stop', { offset:'45%',  'stop-color':'#182444' }, wf);
  wel('stop', { offset:'100%', 'stop-color':'#0e1830' }, wf);

  // Suction-side glow gradient along upper surface
  const ug = wel('linearGradient', { id: 'w-upper-glow', x1:'0', y1:'0', x2:'1', y2:'0',
    gradientUnits: 'objectBoundingBox' }, defs);
  wel('stop', { offset:'0%',   'stop-color':'#ef4444', 'stop-opacity':'0.0' }, ug);
  wel('stop', { offset:'30%',  'stop-color':'#ef4444', 'stop-opacity': (intensity * 0.7).toFixed(3) }, ug);
  wel('stop', { offset:'65%',  'stop-color':'#f97316', 'stop-opacity': (intensity * 0.5).toFixed(3) }, ug);
  wel('stop', { offset:'100%', 'stop-color':'#f97316', 'stop-opacity':'0.0' }, ug);

  // Pressure-side glow gradient along lower surface
  const lg = wel('linearGradient', { id: 'w-lower-glow', x1:'0', y1:'0', x2:'1', y2:'0',
    gradientUnits: 'objectBoundingBox' }, defs);
  wel('stop', { offset:'0%',   'stop-color':'#3b82f6', 'stop-opacity':'0.0' }, lg);
  wel('stop', { offset:'30%',  'stop-color':'#3b82f6', 'stop-opacity': (intensity * 0.5).toFixed(3) }, lg);
  wel('stop', { offset:'65%',  'stop-color':'#60a5fa', 'stop-opacity': (intensity * 0.35).toFixed(3) }, lg);
  wel('stop', { offset:'100%', 'stop-color':'#60a5fa', 'stop-opacity':'0.0' }, lg);

  // ── Background ──────────────────────────────────────────────────────
  wel('rect', { x:0, y:0, width:WG.W, height:WG.H, fill:'#060a12' }, svg);

  // Subtle grid
  for (let gx = 60; gx < WG.W; gx += 60)
    wel('line', { x1:gx, y1:0, x2:gx, y2:WG.H, stroke:'#0d1424', 'stroke-width':1 }, svg);
  for (let gy = 50; gy < WG.H; gy += 50)
    wel('line', { x1:0, y1:gy, x2:WG.W, y2:gy, stroke:'#0d1424', 'stroke-width':1 }, svg);

  // ── Pressure colour field ───────────────────────────────────────────
  wel('rect', { x:0, y:0, width:WG.W, height:WG.H, fill:'url(#w-pgrad)' }, svg);

  // ── Streamlines ─────────────────────────────────────────────────────
  // Above wing — converging/faster (compress toward wing surface)
  SL_ABOVE.forEach(sl => {
    const r = Math.round(96  + sl.c * 60);
    const g = Math.round(165 - sl.c * 50);
    const a = (0.30 + sl.c * 0.22).toFixed(2);
    wel('path', { d: sl.d, fill:'none',
      stroke: `rgba(${r},${g},250,${a})`,
      'stroke-width': sl.c > 0.5 ? 1.8 : 1.5,
      'stroke-linecap':'round' }, svg);
  });

  // Below wing — normal spacing, cooler colour
  SL_BELOW.forEach(sl => {
    const a = (0.22 + sl.c * 0.15).toFixed(2);
    wel('path', { d: sl.d, fill:'none',
      stroke: `rgba(96,145,250,${a})`,
      'stroke-width': 1.5, 'stroke-linecap':'round' }, svg);
  });

  // ── Wing surface glows (drawn behind wing fill so only edges show) ──
  // Suction (upper) surface glow — low pressure → warm
  wel('path', { d: WG.UPPER, fill:'none',
    stroke: 'url(#w-upper-glow)', 'stroke-width': 8,
    'stroke-linecap':'round', opacity: 0.9 }, svg);

  // Pressure (lower) surface glow — high pressure → cool
  wel('path', { d: WG.LOWER, fill:'none',
    stroke: 'url(#w-lower-glow)', 'stroke-width': 8,
    'stroke-linecap':'round', opacity: 0.8 }, svg);

  // ── Wing body ───────────────────────────────────────────────────────
  // Dark fill covers gradient/streamlines inside wing
  wel('path', { d: WG.FILL, fill: 'url(#w-fill)' }, svg);

  // Crisp outline
  wel('path', { d: WG.FILL, fill:'none',
    stroke:'#4a5a8a', 'stroke-width':1.8 }, svg);

  // Leading-edge stagnation dot
  wel('circle', { cx:WG.LE[0], cy:WG.LE[1], r:4,
    fill:'#fbbf24', stroke:'#f59e0b', 'stroke-width':1.5 }, svg);

  // ── Flow direction indicators (left side) ──────────────────────────
  const arrowYs = [82, 122, 165, 205, 243, 289, 311];
  arrowYs.forEach(y => warrow(svg, 20, y, 60, y, 'rgba(96,165,250,0.45)', 1.5, 6));

  // V∞ label
  wtxt(svg, 40, 365, 'V∞', { fill:'#60a5fa', size:12, bold:true });
  wtxt(svg, 40, 380, `${v.toFixed(0)} m/s`, { fill:'#60a5fa', size:11 });

  // ── Region labels ───────────────────────────────────────────────────
  // Low pressure label (above wing)
  const lowX = 375, lowY = 48;
  wtxt(svg, lowX, lowY,      'LOW PRESSURE', { fill:'#ef4444', size:12, bold:true });
  wtxt(svg, lowX, lowY + 15, `ΔP_peak = ${(dP_peak/1000).toFixed(2)} kPa`, { fill:'#f87171', size:10 });
  wel('line', { x1:lowX, y1:lowY+22, x2:lowX, y2:135,
    stroke:'#ef4444', 'stroke-width':1, 'stroke-dasharray':'4,3', opacity:0.45 }, svg);
  wel('polygon', { points:`${lowX},138 ${lowX-4},132 ${lowX+4},132`, fill:'#ef4444', opacity:0.5 }, svg);

  // High pressure label (below wing)
  const hiX = 375, hiY = 358;
  wtxt(svg, hiX, hiY,      'HIGH PRESSURE', { fill:'#3b82f6', size:12, bold:true });
  wtxt(svg, hiX, hiY + 14, `ΔP_stag ≈ ${(vals.dP_stag/1000).toFixed(2)} kPa`, { fill:'#93c5fd', size:10 });
  wel('line', { x1:hiX, y1:232, x2:hiX, y2:hiY - 8,
    stroke:'#3b82f6', 'stroke-width':1, 'stroke-dasharray':'4,3', opacity:0.45 }, svg);
  wel('polygon', { points:`${hiX},229 ${hiX-4},235 ${hiX+4},235`, fill:'#3b82f6', opacity:0.5 }, svg);

  // Stagnation label
  wtxt(svg, WG.LE[0] - 10, WG.LE[1] + 18, 'stagnation', { fill:'#fbbf24', size:9, anchor:'end' });
  wtxt(svg, WG.LE[0] - 10, WG.LE[1] + 29, 'point', { fill:'#fbbf24', size:9, anchor:'end' });

  // ── Force arrows ────────────────────────────────────────────────────
  // Lift: perpendicular to chord (upward for level flight), from midchord upper surface
  const liftOriginX = WG.UPPER_MID_X;
  const liftOriginY = WG.UPPER_MID_Y;
  const liftPx      = Math.min(Math.sqrt(lift) * 5.2, 125);

  warrow(svg, liftOriginX, liftOriginY, liftOriginX, liftOriginY - liftPx, '#22c55e', 3.5, 11);
  wtxt(svg, liftOriginX + 16, liftOriginY - liftPx / 2 - 2, 'L', { fill:'#22c55e', size:16, bold:true, anchor:'start' });
  wtxt(svg, liftOriginX + 16, liftOriginY - liftPx / 2 + 13, `${lift.toFixed(0)} N/m`, { fill:'#86efac', size:10, anchor:'start' });

  // Drag: parallel to chord (rightward), from trailing edge
  const dragOriginX = WG.TE[0];
  const dragOriginY = WG.TE[1];
  const dragPx      = Math.min(Math.sqrt(drag) * 5.0, 65);

  warrow(svg, dragOriginX, dragOriginY, dragOriginX + dragPx, dragOriginY, '#f97316', 2.5, 9);
  wtxt(svg, dragOriginX + dragPx + 12, dragOriginY - 2, 'D', { fill:'#f97316', size:14, bold:true, anchor:'start' });
  wtxt(svg, dragOriginX + dragPx + 12, dragOriginY + 13, `${drag.toFixed(1)} N/m`, { fill:'#fdba74', size:10, anchor:'start' });

  // ── Bernoulli annotation (top-right) ────────────────────────────────
  const brx = 870;
  wtxt(svg, brx, 18,  'v_top > v_bottom',      { fill:'#64748b', size:10, anchor:'end' });
  wtxt(svg, brx, 32,  '→  P_top < P_bottom',   { fill:'#64748b', size:10, anchor:'end' });
  wtxt(svg, brx, 47,  '→  Net upward force',   { fill:'#22c55e', size:10, anchor:'end', bold:true });

  // L/D ratio badge (bottom-right)
  const ld    = vals.ld_ratio.toFixed(1);
  const badgeX = 840, badgeY = 340;
  wel('rect', { x:badgeX - 56, y:badgeY - 17, width:112, height:46,
    fill:'#0f1a30', rx:6, stroke:'#1e3a5f', 'stroke-width':1 }, svg);
  wtxt(svg, badgeX, badgeY,      `L/D = ${ld}`,            { fill:'#a78bfa', size:13, bold:true });
  wtxt(svg, badgeX, badgeY + 16, 'lift-to-drag ratio',     { fill:'#6d48a0', size:9.5 });

  // q badge (bottom-right, smaller)
  wtxt(svg, badgeX, badgeY + 30, `q = ${q.toFixed(0)} Pa`, { fill:'#475569', size:9.5 });
}

// ── Equation panel (KaTeX) ───────────────────────────────────────────
let _lastEqV = null;

function renderWingEquations(vals) {
  if (_lastEqV === vals.v) return;
  _lastEqV = vals.v;

  const panel = document.getElementById('wg-eq-panel');
  if (!panel || typeof katex === 'undefined') return;

  const rows = [
    {
      color: '#a855f7', label: 'BERNOULLI',
      main:  'P + \\tfrac{1}{2}\\rho v^2 = \\text{const}',
      sub:   'v_{\\text{top}} > v_{\\text{bot}} \\;\\Rightarrow\\; P_{\\text{top}} < P_{\\text{bot}}',
      note:  'Net upward pressure → Lift',
    },
    {
      color: '#22c55e', label: 'LIFT',
      main:  'L = \\tfrac{1}{2}\\rho V_\\infty^2\\, C_L\\, c',
      sub:   `= \\tfrac{1}{2}\\times 1.225 \\times ${vals.v.toFixed(1)}^2 \\times 0.82 \\times 1.0`,
      result:`L = ${vals.lift.toFixed(0)}\\;\\text{N/m}`,
    },
    {
      color: '#f97316', label: 'DRAG',
      main:  'D = \\tfrac{1}{2}\\rho V_\\infty^2\\, C_D\\, c',
      sub:   `= \\tfrac{1}{2}\\times 1.225 \\times ${vals.v.toFixed(1)}^2 \\times 0.012 \\times 1.0`,
      result:`D = ${vals.drag.toFixed(2)}\\;\\text{N/m}`,
    },
    {
      color: '#f59e0b', label: 'L/D RATIO',
      main:  '\\dfrac{L}{D} = \\dfrac{C_L}{C_D} = \\dfrac{0.82}{0.012}',
      sub:   '\\text{Independent of }V_\\infty\\text{ (fixed AoA)}',
      result:`= ${vals.ld_ratio.toFixed(1)}`,
    },
  ];

  panel.innerHTML = '';
  rows.forEach(row => {
    const div = document.createElement('div');
    div.className = 'bv-eq-row';
    div.style.borderLeftColor = row.color;

    const tag = document.createElement('div');
    tag.className = 'bv-eq-tag';
    tag.style.color = row.color;
    tag.textContent = row.label;
    div.appendChild(tag);

    const main = document.createElement('div');
    main.className = 'bv-eq-main';
    katex.render(row.main, main, { throwOnError: false, displayMode: false });
    div.appendChild(main);

    if (row.sub) {
      const sub = document.createElement('div');
      sub.className = 'bv-eq-sub';
      katex.render(row.sub, sub, { throwOnError: false, displayMode: false });
      div.appendChild(sub);
    }

    if (row.result) {
      const res = document.createElement('div');
      res.className = 'bv-eq-result';
      res.style.color = row.color;
      katex.render(row.result, res, { throwOnError: false, displayMode: false });
      div.appendChild(res);
    }

    if (row.note) {
      const note = document.createElement('div');
      note.style.cssText = `font-size:0.77rem;color:${row.color};margin-top:2px;`;
      note.textContent = row.note;
      div.appendChild(note);
    }

    panel.appendChild(div);
  });
}

// ── Values panel ─────────────────────────────────────────────────────
let _lastValV = null;

function renderWingValues(vals) {
  if (_lastValV === vals.v) return;
  _lastValV = vals.v;

  const panel = document.getElementById('wg-values-panel');
  if (!panel) return;

  const rows = [
    { label: 'V∞  (m/s)',         v1: vals.v.toFixed(1)          },
    { label: 'q = ½ρV²  (Pa)',    v1: vals.q.toFixed(0)          },
    { label: 'Lift L  (N/m)',     v1: vals.lift.toFixed(1)       },
    { label: 'Drag D  (N/m)',     v1: vals.drag.toFixed(2)       },
    { label: 'L/D',               v1: vals.ld_ratio.toFixed(1)   },
    { label: 'ΔP_peak  (Pa)',     v1: vals.dP_peak.toFixed(0)    },
  ];

  panel.innerHTML = `
    <table class="bv-val-table">
      <thead class="bv-val-header">
        <tr><th>Quantity</th><th>Value</th></tr>
      </thead>
      <tbody>
        ${rows.map(r => `<tr><td>${r.label}</td><td style="color:var(--text);font-weight:600">${r.v1}</td></tr>`).join('')}
      </tbody>
    </table>`;
}

// ── Initialisation ───────────────────────────────────────────────────
(function init() {
  const svg     = document.getElementById('wg-svg');
  const slider  = document.getElementById('wg-v-slider');
  const display = document.getElementById('wg-v-display');

  let wingV = parseFloat(slider.value);

  function update() {
    const vals = wingDerive(wingV);
    renderWingDiagram(svg, vals);
    renderWingEquations(vals);
    renderWingValues(vals);
  }

  slider.addEventListener('input', () => {
    wingV = parseFloat(slider.value);
    display.textContent = wingV.toFixed(0) + ' m/s';
    _lastEqV = null;
    _lastValV = null;
    update();
  });

  update();
})();
