// Shared SVG + KaTeX helpers for the lesson-themed pages (Statics, Fluid).
// Self-contained; mirrors the vector-calculus helpers but module-neutral.

const LNS = 'http://www.w3.org/2000/svg';

function lel(tag, attrs, parent) {
  const e = document.createElementNS(LNS, tag);
  for (const k in attrs) e.setAttribute(k, String(attrs[k]));
  if (parent) parent.appendChild(e);
  return e;
}
function ltxt(parent, x, y, s, o = {}) {
  const t = lel('text', {
    x, y, fill: o.fill || '#94a3b8',
    'font-size': o.size || 12,
    'font-family': 'system-ui,-apple-system,sans-serif',
    'font-weight': o.bold ? '700' : '400',
    'font-style': o.italic ? 'italic' : 'normal',
    'text-anchor': o.anchor || 'middle',
    'dominant-baseline': o.base || 'auto',
    opacity: o.opacity != null ? o.opacity : 1,
  }, parent);
  t.textContent = s;
  return t;
}
function larrow(parent, x1, y1, x2, y2, color, sw, head) {
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
  if (len < 0.6) return;
  const ux = dx / len, uy = dy / len;
  const hs = head != null ? head : Math.min(len * 0.5, 9);
  lel('line', { x1, y1, x2: x2 - ux * hs * 0.6, y2: y2 - uy * hs * 0.6,
    stroke: color, 'stroke-width': sw, 'stroke-linecap': 'round' }, parent);
  const px = -uy * hs * 0.42, py = ux * hs * 0.42;
  lel('polygon', {
    points: `${x2},${y2} ${x2 - ux * hs + px},${y2 - uy * hs + py} ${x2 - ux * hs - px},${y2 - uy * hs - py}`,
    fill: color }, parent);
}
function lclear(g) { while (g.firstChild) g.removeChild(g.firstChild); }

// Render a list of { tag, tex, note } KaTeX cards into a container.
function lTheory(panelId, cards) {
  const panel = document.getElementById(panelId);
  if (!panel || typeof katex === 'undefined') return;
  panel.innerHTML = '';
  cards.forEach(c => {
    const div = document.createElement('div');
    div.className = 'lz-eq-card';
    const tag = document.createElement('div');
    tag.className = 'lz-eq-tag'; tag.textContent = c.tag;
    const body = document.createElement('div');
    body.className = 'lz-eq-body';
    katex.render(c.tex, body, { throwOnError: false, displayMode: false });
    div.append(tag, body);
    if (c.note) {
      const note = document.createElement('div');
      note.className = 'lz-eq-note'; note.textContent = c.note;
      div.appendChild(note);
    }
    panel.appendChild(div);
  });
}
