// Equation panel: renders force rows using KaTeX
// Each row: symbol | expression | substituted | value

function buildEquationRows(params, state, forces) {
  const p = params, f = forces;
  const fmt = (v, d = 2) => v.toFixed(d);

  return [
    {
      symbol:      'mg',
      expression:  'mg',
      substituted: `(${fmt(p.m)})(${fmt(p.g, 2)})`,
      value:       p.m * p.g,
      unit:        'N',
      highlight:   false,
      color:       '#e74c3c',
    },
    {
      symbol:      'N',
      expression:  'mg\\cos\\theta',
      substituted: `(${fmt(p.m * p.g, 2)})\\cos(${fmt(p.thetaDeg, 1)}°)`,
      value:       f.normalForce,
      unit:        'N',
      highlight:   false,
      color:       '#3498db',
    },
    {
      symbol:      'mg\\sin\\theta',
      expression:  'mg\\sin\\theta',
      substituted: `(${fmt(p.m * p.g, 2)})\\sin(${fmt(p.thetaDeg, 1)}°)`,
      value:       f.gravityAlongSlope,
      unit:        'N',
      highlight:   false,
      color:       '#e74c3c',
    },
    {
      symbol:      'F_\\text{spring}',
      expression:  'kx',
      substituted: `(${fmt(p.k, 0)})(${fmt(state.x, 4)})`,
      value:       f.springForce,
      unit:        'N',
      highlight:   false,
      color:       '#27ae60',
    },
    {
      symbol:      'f',
      expression:  f.isHeld
        ? '\\text{static (balancing)}'
        : (state.mode === 'playing' && Math.abs(state.v) > V_EPS)
          ? '-\\mu_k N \\operatorname{sgn}(v) - bv'
          : '-\\mu_s N \\operatorname{sgn}(F_\\text{net})',
      substituted: fmt(f.frictionForce, 3),
      value:       f.frictionForce,
      unit:        'N',
      highlight:   f.isHeld,
      color:       '#f39c12',
    },
    {
      symbol:      'F_\\text{net}',
      expression:  'mg\\sin\\theta - F_s + f',
      substituted: `${fmt(f.gravityAlongSlope, 2)} - ${fmt(f.springForce, 2)} + (${fmt(f.frictionForce, 2)})`,
      value:       f.netForce,
      unit:        'N',
      highlight:   false,
      color:       '#9b59b6',
    },
    {
      symbol:      'a',
      expression:  'F_\\text{net}/m',
      substituted: `${fmt(f.netForce, 3)}/${fmt(p.m, 1)}`,
      value:       f.acceleration,
      unit:        'ms⁻²',
      highlight:   false,
      color:       '#9b59b6',
    },
  ];
}

function renderEquations(containerEl, rows) {
  containerEl.innerHTML = '';

  // Header
  const header = document.createElement('div');
  header.className = 'eq-header';
  header.innerHTML = '<span>Quantity</span><span>Expression</span><span>Value</span>';
  containerEl.appendChild(header);

  rows.forEach(row => {
    const div = document.createElement('div');
    div.className = 'eq-row' + (row.highlight ? ' eq-held' : '');
    div.style.borderLeft = `3px solid ${row.color}`;

    const sym = document.createElement('span');
    sym.className = 'eq-symbol';
    katex.render(row.symbol, sym, { throwOnError: false });

    const expr = document.createElement('span');
    expr.className = 'eq-expr';
    katex.render(row.expression, expr, { throwOnError: false, displayMode: false });

    const val = document.createElement('span');
    val.className = 'eq-value';
    val.textContent = `${row.value.toFixed(3)} ${row.unit}`;
    val.style.color = row.color;

    div.appendChild(sym);
    div.appendChild(expr);
    div.appendChild(val);
    containerEl.appendChild(div);
  });

  // Dynamic section
  const dynDiv = document.createElement('div');
  dynDiv.className = 'eq-dynamic-section';
  containerEl.appendChild(dynDiv);
}

function renderDynamicInfo(containerEl, params, forces) {
  const existing = containerEl.querySelector('.eq-dynamic-section');
  if (!existing) return;
  const d = existing;
  d.innerHTML = '';

  const title = document.createElement('p');
  title.className = 'eq-section-title';
  title.textContent = 'Dynamic parameters';
  d.appendChild(title);

  [
    ['\\omega_n', `\\sqrt{k/m}`, `${forces.omega_n.toFixed(2)}`, 'rad/s'],
    ['\\zeta',    'b/(2\\sqrt{km})', `${forces.zeta.toFixed(3)}`, ''],
    ['x_{\\text{eq}}', 'mg\\sin\\theta/k', `${forces.equilibriumX.toFixed(4)}`, 'm'],
    ['\\mu_s N', '\\mu_s mg\\cos\\theta', `${forces.frictionMax.toFixed(3)}`, 'N'],
  ].forEach(([sym, expr, val, unit]) => {
    const row = document.createElement('div');
    row.className = 'eq-row eq-dyn';

    const s = document.createElement('span');
    s.className = 'eq-symbol';
    katex.render(sym, s, { throwOnError: false });

    const e = document.createElement('span');
    e.className = 'eq-expr';
    katex.render(expr, e, { throwOnError: false });

    const v = document.createElement('span');
    v.className = 'eq-value';
    v.textContent = `${val} ${unit}`;

    row.appendChild(s); row.appendChild(e); row.appendChild(v);
    d.appendChild(row);
  });
}
