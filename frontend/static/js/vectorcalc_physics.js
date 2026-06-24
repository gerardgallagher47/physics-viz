// Vector calculus — pure functions, no DOM.
//
// Coordinate convention: standard math axes (x right, y up).
// The renderer flips y for SVG.  All fields F(x,y) = <P, Q>.
//
// Single source of truth for: field sampling, divergence, curl (z-component),
// and the line integrals (circulation ∮F·dr, outward flux ∮F·n ds) that
// Green's theorem equates to the area integrals of curl and divergence.

const VC = { XMIN: -4, XMAX: 4, YMIN: -4, YMAX: 4 };

// Each field carries closed-form div/curl so the readout can show the
// analytic value alongside the numerically-integrated one.
const FIELDS = {
  source: {
    key: 'source', name: 'Source',
    blurb: 'Flows outward everywhere — positive divergence, no rotation.',
    latex: '\\langle x,\\; y\\rangle',
    P: (x, y) => x,      Q: (x, y) => y,
    div: () => 2,        curl: () => 0,
  },
  sink: {
    key: 'sink', name: 'Sink',
    blurb: 'Flows inward everywhere — negative divergence, no rotation.',
    latex: '\\langle -x,\\; -y\\rangle',
    P: (x, y) => -x,     Q: (x, y) => -y,
    div: () => -2,       curl: () => 0,
  },
  vortex: {
    key: 'vortex', name: 'Vortex',
    blurb: 'Pure rotation about the origin — strong curl, zero divergence.',
    latex: '\\langle -y,\\; x\\rangle',
    P: (x, y) => -y,     Q: (x, y) => x,
    div: () => 0,        curl: () => 2,
  },
  shear: {
    key: 'shear', name: 'Shear',
    blurb: 'Parallel flow that varies across — hidden curl, zero divergence.',
    latex: '\\langle y,\\; 0\\rangle',
    P: (x, y) => y,      Q: (x, y) => 0,
    div: () => 0,        curl: () => -1,
  },
  saddle: {
    key: 'saddle', name: 'Saddle',
    blurb: 'Stretches one way, squeezes the other — zero div AND zero curl.',
    latex: '\\langle x,\\; -y\\rangle',
    P: (x, y) => x,      Q: (x, y) => -y,
    div: () => 0,        curl: () => 0,
  },
  spiral: {
    key: 'spiral', name: 'Spiral',
    blurb: 'Outward AND spinning — both divergence and curl are non-zero.',
    latex: '\\langle x-y,\\; x+y\\rangle',
    P: (x, y) => x - y,  Q: (x, y) => x + y,
    div: () => 2,        curl: () => 2,
  },
  // Spatially-varying fields — divergence/curl change from place to place,
  // so their heatmaps show structure (computed numerically, div/curl = null).
  bump: {
    key: 'bump', name: 'Hot Spot',
    blurb: 'A localized burst: strong outflow at the centre, weak inflow in the surrounding ring. Divergence changes with position.',
    latex: '\\langle x,\\; y\\rangle\\, e^{-(x^2+y^2)/3}',
    P: (x, y) => x * Math.exp(-(x * x + y * y) / 3),
    Q: (x, y) => y * Math.exp(-(x * x + y * y) / 3),
    div: null, curl: null,
  },
  wavy: {
    key: 'wavy', name: 'Ripple',
    blurb: 'A rippling flow whose spin reverses from cell to cell — curl is positive in some patches, negative in others, with zero divergence.',
    latex: '\\langle \\sin y,\\; \\sin x\\rangle',
    P: (x, y) => Math.sin(y),
    Q: (x, y) => Math.sin(x),
    div: null, curl: null,
  },
};

// Resolve div/curl at a point: prefer the closed form, else go numerical.
function fieldDiv(f, x, y)  { return f.div  ? f.div()  : divergenceAt(f, x, y); }
function fieldCurl(f, x, y) { return f.curl ? f.curl() : curlAt(f, x, y); }

// ── Local differential operators (numerical, central difference) ──────
function divergenceAt(f, x, y, h = 1e-3) {
  return (f.P(x + h, y) - f.P(x - h, y)) / (2 * h)
       + (f.Q(x, y + h) - f.Q(x, y - h)) / (2 * h);
}

function curlAt(f, x, y, h = 1e-3) {
  // z-component of ∇×F  =  ∂Q/∂x − ∂P/∂y
  return (f.Q(x + h, y) - f.Q(x - h, y)) / (2 * h)
       - (f.P(x, y + h) - f.P(x, y - h)) / (2 * h);
}

// ── Boundary line integrals around a circle (Green's theorem LHS) ─────
// Circle: centre (cx,cy), radius r, parametrised CCW.
function circulation(f, cx, cy, r, N = 240) {
  let sum = 0;
  const dt = 2 * Math.PI / N;
  for (let i = 0; i < N; i++) {
    const t = (i + 0.5) * dt;
    const x = cx + r * Math.cos(t), y = cy + r * Math.sin(t);
    // Unit tangent (CCW): (−sin t, cos t); ds = r dt
    sum += (f.P(x, y) * -Math.sin(t) + f.Q(x, y) * Math.cos(t)) * r * dt;
  }
  return sum;
}

function outwardFlux(f, cx, cy, r, N = 240) {
  let sum = 0;
  const dt = 2 * Math.PI / N;
  for (let i = 0; i < N; i++) {
    const t = (i + 0.5) * dt;
    const x = cx + r * Math.cos(t), y = cy + r * Math.sin(t);
    // Outward unit normal: (cos t, sin t); ds = r dt
    sum += (f.P(x, y) * Math.cos(t) + f.Q(x, y) * Math.sin(t)) * r * dt;
  }
  return sum;
}

// ── Area integrals over the disc (Green's theorem RHS) ────────────────
// ∬ (curl) dA  and  ∬ (div) dA  via a polar mid-point grid.
function areaIntegral(op, f, cx, cy, r, NR = 24, NT = 96) {
  let sum = 0;
  const dr = r / NR, dt = 2 * Math.PI / NT;
  for (let i = 0; i < NR; i++) {
    const rho = (i + 0.5) * dr;
    for (let j = 0; j < NT; j++) {
      const t = (j + 0.5) * dt;
      const x = cx + rho * Math.cos(t), y = cy + rho * Math.sin(t);
      sum += op(f, x, y) * rho * dr * dt;   // dA = ρ dρ dθ
    }
  }
  return sum;
}

const curlAreaIntegral = (f, cx, cy, r) => areaIntegral(curlAt, f, cx, cy, r);
const divAreaIntegral  = (f, cx, cy, r) => areaIntegral(divergenceAt, f, cx, cy, r);
