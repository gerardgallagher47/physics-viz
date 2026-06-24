// Shared SVG + KaTeX helpers for the Aerospace Engineering visuals.
// Self-contained (no dependency on the vector-calculus modules).

const ANS = 'http://www.w3.org/2000/svg';

function ael(tag, attrs, parent) {
  const e = document.createElementNS(ANS, tag);
  for (const k in attrs) e.setAttribute(k, String(attrs[k]));
  if (parent) parent.appendChild(e);
  return e;
}
function atxt(parent, x, y, s, o = {}) {
  const t = ael('text', {
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
function aarrow(parent, x1, y1, x2, y2, color, sw, head) {
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
  if (len < 0.6) return;
  const ux = dx / len, uy = dy / len;
  const hs = head != null ? head : Math.min(len * 0.5, 8);
  ael('line', { x1, y1, x2: x2 - ux * hs * 0.6, y2: y2 - uy * hs * 0.6,
    stroke: color, 'stroke-width': sw, 'stroke-linecap': 'round' }, parent);
  const px = -uy * hs * 0.42, py = ux * hs * 0.42;
  ael('polygon', {
    points: `${x2},${y2} ${x2 - ux * hs + px},${y2 - uy * hs + py} ${x2 - ux * hs - px},${y2 - uy * hs - py}`,
    fill: color }, parent);
}
function aclear(g) { while (g.firstChild) g.removeChild(g.firstChild); }

// Render a stack of KaTeX equations into a container.
// items: [{ tex, label?, color? }]
function aRenderEquations(containerId, items) {
  const box = document.getElementById(containerId);
  if (!box || typeof katex === 'undefined') return;
  box.innerHTML = '';
  items.forEach(it => {
    const row = document.createElement('div');
    row.className = 'aero-eq-row';
    if (it.label) {
      const lab = document.createElement('div');
      lab.className = 'aero-eq-label';
      if (it.color) lab.style.color = it.color;
      lab.textContent = it.label;
      row.appendChild(lab);
    }
    const eq = document.createElement('div');
    eq.className = 'aero-eq';
    katex.render(it.tex, eq, { throwOnError: false, displayMode: false });
    row.appendChild(eq);
    box.appendChild(row);
  });
}
