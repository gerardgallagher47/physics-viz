// Shared rendering helpers for the vector-calculus pages.
// Pure-ish drawing utilities — depends on vectorcalc_physics.js for fields.
//
// Coordinate convention: math axes (x right, y up); y flipped for SVG.

const VNS = 'http://www.w3.org/2000/svg';

function vel(tag, attrs, parent) {
  const e = document.createElementNS(VNS, tag);
  for (const k in attrs) e.setAttribute(k, String(attrs[k]));
  if (parent) parent.appendChild(e);
  return e;
}
function vtxt(parent, x, y, s, o = {}) {
  const t = vel('text', {
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
function varrow(parent, x1, y1, x2, y2, color, sw, head) {
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
  if (len < 0.6) return;
  const ux = dx / len, uy = dy / len;
  const hs = head != null ? head : Math.min(len * 0.5, 7);
  vel('line', { x1, y1, x2: x2 - ux * hs * 0.6, y2: y2 - uy * hs * 0.6,
    stroke: color, 'stroke-width': sw, 'stroke-linecap': 'round' }, parent);
  const px = -uy * hs * 0.42, py = ux * hs * 0.42;
  vel('polygon', {
    points: `${x2},${y2} ${x2 - ux * hs + px},${y2 - uy * hs + py} ${x2 - ux * hs - px},${y2 - uy * hs - py}`,
    fill: color }, parent);
}
function clearEl(g) { while (g.firstChild) g.removeChild(g.firstChild); }

// dim slate → bright cyan, by normalized magnitude
function magColor(t) {
  t = Math.max(0, Math.min(1, t));
  const l = (a, b) => Math.round(a + (b - a) * t);
  return `rgb(${l(74,125)},${l(94,211)},${l(135,252)})`;
}

// ── Coordinate view ───────────────────────────────────────────────────
function makeView(cfg) {
  const v = Object.assign({ W: 620, H: 600, PAD_L: 60, PAD_T: 28, SIZE: 500 }, cfg);
  v.SCALE = v.SIZE / (VC.XMAX - VC.XMIN);
  v.wx2sx = (x) => v.PAD_L + (x - VC.XMIN) * v.SCALE;
  v.wy2sy = (y) => v.PAD_T + (VC.YMAX - y) * v.SCALE;
  v.sx2wx = (sx) => (sx - v.PAD_L) / v.SCALE + VC.XMIN;
  v.sy2wy = (sy) => VC.YMAX - (sy - v.PAD_T) / v.SCALE;
  return v;
}

// ── Heatmap colour for a scalar value (divergence or curl) ────────────
function heatColor(val, maxAbs, kind) {
  const t = Math.max(-1, Math.min(1, val / (maxAbs || 1)));
  const a = (Math.abs(t) * 0.55).toFixed(3);
  if (kind === 'div')  return t >= 0 ? `rgba(239,68,68,${a})`  : `rgba(56,130,246,${a})`;
  /* curl */            return t >= 0 ? `rgba(45,212,191,${a})` : `rgba(167,139,250,${a})`;
}

// ── Static background: heatmap + grid + axes + field arrows ───────────
// Returns { maxMag, maxAbs } for downstream scaling.
function drawBackground(g, view, f, opt = {}) {
  clearEl(g);
  vel('rect', { x: 0, y: 0, width: view.W, height: view.H, fill: '#0d1117' }, g);

  const op = opt.heatmap === 'div' ? divergenceAt : opt.heatmap === 'curl' ? curlAt : null;

  // heatmap
  let maxAbs = 1e-6;
  if (op) {
    const RES = 26, cell = view.SIZE / RES;
    const grid = [];
    for (let i = 0; i < RES; i++) {
      grid[i] = [];
      for (let j = 0; j < RES; j++) {
        const wx = view.sx2wx(view.PAD_L + (i + 0.5) * cell);
        const wy = view.sy2wy(view.PAD_T + (j + 0.5) * cell);
        const val = op(f, wx, wy);
        grid[i][j] = val;
        maxAbs = Math.max(maxAbs, Math.abs(val));
      }
    }
    for (let i = 0; i < RES; i++)
      for (let j = 0; j < RES; j++) {
        const c = heatColor(grid[i][j], maxAbs, opt.heatmap);
        vel('rect', { x: view.PAD_L + i * cell, y: view.PAD_T + j * cell,
          width: cell + 0.6, height: cell + 0.6, fill: c }, g);
      }
  }

  // grid lines + axes
  for (let i = VC.XMIN; i <= VC.XMAX; i++) {
    const sx = view.wx2sx(i), sy = view.wy2sy(i), major = i === 0;
    vel('line', { x1: sx, y1: view.PAD_T, x2: sx, y2: view.PAD_T + view.SIZE,
      stroke: major ? '#3a4a64' : '#1a2333', 'stroke-width': major ? 1.4 : 1 }, g);
    vel('line', { x1: view.PAD_L, y1: sy, x2: view.PAD_L + view.SIZE, y2: sy,
      stroke: major ? '#3a4a64' : '#1a2333', 'stroke-width': major ? 1.4 : 1 }, g);
  }
  vtxt(g, view.PAD_L + view.SIZE + 4, view.wy2sy(0) + 4, 'x', { fill: '#475569', anchor: 'start' });
  vtxt(g, view.wx2sx(0) - 6, view.PAD_T - 8, 'y', { fill: '#475569', anchor: 'end' });

  // field arrows
  let maxMag = 1e-6;
  const step = 0.7, lo = -3.5, hi = 3.5;
  for (let x = lo; x <= hi + 1e-9; x += step)
    for (let y = lo; y <= hi + 1e-9; y += step)
      maxMag = Math.max(maxMag, Math.hypot(f.P(x, y), f.Q(x, y)));
  const maxLen = step * view.SCALE * 0.6;

  if (opt.fieldArrows !== false) {
    const dim = op ? 0.85 : 1;   // soften arrows when a heatmap is behind them
    for (let x = lo; x <= hi + 1e-9; x += step)
      for (let y = lo; y <= hi + 1e-9; y += step) {
        const px = f.P(x, y), py = f.Q(x, y), mag = Math.hypot(px, py);
        const sx = view.wx2sx(x), sy = view.wy2sy(y);
        if (mag < 1e-6) { vel('circle', { cx: sx, cy: sy, r: 1.5, fill: '#334155' }, g); continue; }
        const t = mag / maxMag, L = 5 + t * (maxLen - 5);
        const ux = px / mag, uy = -py / mag;
        const col = op ? `rgba(203,213,225,${0.55 * dim})` : magColor(t);
        varrow(g, sx, sy, sx + ux * L, sy + uy * L, col, 1.5, 5);
      }
  }
  return { maxMag, maxAbs };
}

// ── Loop overlay: boundary components + paddle + divergence star ──────
// state: { cx, cy, r }.  opt: { showTangent, showNormal, showPaddle,
//          showPulse, color }.  Returns animation refs.
function drawLoop(g, view, f, state, maxMag, opt = {}) {
  clearEl(g);
  const cxpx = view.wx2sx(state.cx), cypx = view.wy2sy(state.cy), rpx = state.r * view.SCALE;
  const maxLen = 0.7 * view.SCALE * 0.6;
  const accent = opt.color || '#e2e8f0';

  vel('circle', { cx: cxpx, cy: cypx, r: rpx,
    fill: opt.fill || 'rgba(226,232,240,0.06)',
    stroke: accent, 'stroke-width': 2 }, g);

  const N = 18;
  for (let i = 0; i < N; i++) {
    const th = 2 * Math.PI * i / N;
    const wx = state.cx + state.r * Math.cos(th), wy = state.cy + state.r * Math.sin(th);
    const bx = view.wx2sx(wx), by = view.wy2sy(wy);
    const px = f.P(wx, wy), py = f.Q(wx, wy), mag = Math.hypot(px, py);
    if (mag < 1e-6) continue;
    const t = mag / maxMag, L = 6 + t * (maxLen * 1.1 - 6);
    const ux = px / mag, uy = -py / mag;
    varrow(g, bx, by, bx + ux * L, by + uy * L, 'rgba(148,163,184,0.5)', 1.3, 5);

    if (opt.showTangent) {
      const comp = px * -Math.sin(th) + py * Math.cos(th);
      const sUx = -Math.sin(th), sUy = -Math.cos(th);
      const cl = (comp / maxMag) * maxLen * 1.3;
      varrow(g, bx, by, bx + sUx * cl, by + sUy * cl, '#34d399', 2.5, 7);
    }
    if (opt.showNormal) {
      const comp = px * Math.cos(th) + py * Math.sin(th);
      const sUx = Math.cos(th), sUy = -Math.sin(th);
      const cl = (comp / maxMag) * maxLen * 1.3;
      const col = comp >= 0 ? '#fb923c' : '#60a5fa';
      varrow(g, bx, by, bx + sUx * cl, by + sUy * cl, col, 2.5, 7);
    }
  }

  let pulse = null, paddle = null;
  const divC = fieldDiv(f, state.cx, state.cy);
  const curlC = fieldCurl(f, state.cx, state.cy);

  if (opt.showPulse && Math.abs(divC) > 1e-3) {
    pulse = vel('g', {}, g);
    const col = divC > 0 ? '#f87171' : '#60a5fa';
    const baseLen = Math.min(Math.abs(divC) * 9 + 8, rpx * 0.55);
    for (let k = 0; k < 8; k++) {
      const a = Math.PI * 2 * k / 8, dx = Math.cos(a), dy = Math.sin(a);
      if (divC > 0) varrow(pulse, cxpx, cypx, cxpx + dx * baseLen, cypx + dy * baseLen, col, 1.8, 5);
      else          varrow(pulse, cxpx + dx * baseLen, cypx + dy * baseLen, cxpx + dx * 4, cypx + dy * 4, col, 1.8, 5);
    }
  }
  if (opt.showPaddle && Math.abs(curlC) > 1e-3) {
    paddle = vel('g', {}, g);
    const pr = Math.min(rpx * 0.5, 30);
    for (let k = 0; k < 4; k++) {
      const a = Math.PI / 2 * k;
      vel('line', { x1: cxpx, y1: cypx, x2: cxpx + Math.cos(a) * pr, y2: cypx + Math.sin(a) * pr,
        stroke: '#10b981', 'stroke-width': 3, 'stroke-linecap': 'round' }, paddle);
      vel('circle', { cx: cxpx + Math.cos(a) * pr, cy: cypx + Math.sin(a) * pr, r: 3.5, fill: '#34d399' }, paddle);
    }
  }
  vel('circle', { cx: cxpx, cy: cypx, r: 4.5, fill: '#fbbf24', stroke: '#0d1117', 'stroke-width': 1.5 }, g);

  return { pulse, paddle, curl: curlC, div: divC, cxpx, cypx };
}

// strip latex markup for plain-text SVG titles
function plainLatex(s) {
  return s.replace(/\\langle/g, '⟨').replace(/\\rangle/g, '⟩')
          .replace(/\\;/g, '').replace(/\\,/g, '').replace(/e\^\{([^}]*)\}/g, 'e^($1)')
          .replace(/\s+/g, ' ').trim();
}

// ── Drag: move loop centre to pointer, clamped inside domain ──────────
function attachLoopDrag(svg, view, state, onUpdate) {
  let dragging = false;
  function clamp() {
    const m = state.r + 0.05;
    state.cx = Math.max(VC.XMIN + m, Math.min(VC.XMAX - m, state.cx));
    state.cy = Math.max(VC.YMIN + m, Math.min(VC.YMAX - m, state.cy));
  }
  function moveTo(e) {
    const rect = svg.getBoundingClientRect();
    const sx = (e.clientX - rect.left) / rect.width * view.W;
    const sy = (e.clientY - rect.top) / rect.height * view.H;
    state.cx = view.sx2wx(sx); state.cy = view.sy2wy(sy);
    clamp(); onUpdate();
  }
  svg.addEventListener('pointerdown', (e) => { dragging = true; svg.classList.add('dragging'); svg.setPointerCapture(e.pointerId); moveTo(e); });
  svg.addEventListener('pointermove', (e) => { if (dragging) moveTo(e); });
  svg.addEventListener('pointerup',   () => { dragging = false; svg.classList.remove('dragging'); });
  svg.addEventListener('pointercancel', () => { dragging = false; svg.classList.remove('dragging'); });
  return { clamp };
}

// render KaTeX into a list of {tag, tex, note} cards
function renderTheoryCards(panelId, cards) {
  const panel = document.getElementById(panelId);
  if (!panel || typeof katex === 'undefined') return;
  panel.innerHTML = '';
  cards.forEach(c => {
    const div = document.createElement('div');
    div.className = 'vc-eq-card';
    const tag = document.createElement('div');
    tag.className = 'vc-eq-tag'; tag.textContent = c.tag;
    const body = document.createElement('div');
    body.className = 'vc-eq-body';
    katex.render(c.tex, body, { throwOnError: false, displayMode: false });
    div.append(tag, body);
    if (c.note) {
      const note = document.createElement('div');
      note.className = 'vc-eq-note'; note.textContent = c.note;
      div.appendChild(note);
    }
    panel.appendChild(div);
  });
}
