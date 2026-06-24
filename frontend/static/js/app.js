// Main application controller

const DEFAULT_PARAMS = {
  m:                2.0,
  thetaDeg:         30,
  k:                200,
  springFreeLength: 0.10,
  b:                12.0,
  muStatic:         0.3,
  muKinetic:        0.25,
  g:                9.81,
};

// Derive sane default x from equilibrium
function defaultX(p) {
  const theta = p.thetaDeg * Math.PI / 180;
  return (p.m * p.g * Math.sin(theta)) / p.k;
}

let params = { ...DEFAULT_PARAMS };
let state  = {
  x:    defaultX(params),
  v:    0,
  mode: 'static',
  t:    0,
};

let opts = {
  decompose:        false,
  showNet:          true,
  showStictionBand: true,
};

// Animation
let animId      = null;
let lastTime    = null;
const DT        = 1 / 120; // fixed physics step (s)
let accumulator = 0;

// SVG layout constants (must match diagram.js)
const MARGIN_X = 60;
const MARGIN_Y = 20;

// Dragging
let isDragging  = false;
let svgRect     = null;

// Elements
let svgEl, equationsEl, plotCanvas, timePlot;

function init() {
  svgEl        = document.getElementById('diagram-svg');
  equationsEl  = document.getElementById('equations-panel');
  plotCanvas   = document.getElementById('time-plot');
  timePlot     = new TimePlot(plotCanvas, { yMin: -0.02, yMax: 0.15 });

  bindSliders();
  bindButtons();
  bindDrag();
  render();
}

// ── Render (single source of truth) ──────────────────────────────────────────

function render() {
  const forces = deriveForces(params, state);
  timePlot.setEquilibrium(forces.equilibriumX);

  renderDiagram(svgEl, params, state, forces, opts);

  const rows = buildEquationRows(params, state, forces);
  renderEquations(equationsEl, rows);
  renderDynamicInfo(equationsEl, params, forces);

  timePlot.draw();
}

// ── Playback loop ─────────────────────────────────────────────────────────────

function startPlayback() {
  if (animId) return;
  state.mode = 'playing';
  lastTime   = null;
  accumulator = 0;

  function loop(ts) {
    if (lastTime === null) lastTime = ts;
    const wallDt = Math.min((ts - lastTime) / 1000, 0.05); // cap at 50ms
    lastTime = ts;
    accumulator += wallDt;

    while (accumulator >= DT) {
      const forces = deriveForces(params, state);

      if (isSettled(forces, state.v)) {
        stopPlayback();
        state.v = 0;
        state.mode = 'static';
        render();
        return;
      }

      const [nx, nv] = rk4Step(params, state.x, state.v, DT);
      state.x = Math.max(0, nx);
      state.v = nv;
      state.t += DT;
      timePlot.push(state.t, state.x);
      accumulator -= DT;
    }

    render();
    animId = requestAnimationFrame(loop);
  }

  animId = requestAnimationFrame(loop);
}

function stopPlayback() {
  if (animId) { cancelAnimationFrame(animId); animId = null; }
}

// ── Drag interaction ──────────────────────────────────────────────────────────

function getSlopeDims() {
  const H = svgEl.viewBox.baseVal.height || 420;
  const baseX = MARGIN_X;
  const baseY = H - MARGIN_Y - 40;
  const theta = params.thetaDeg * Math.PI / 180;
  const springNatPx = params.springFreeLength * DIAGRAM.pixelsPerMetre;
  return { baseX, baseY, theta, springNatPx };
}

function svgPoint(e) {
  svgRect = svgEl.getBoundingClientRect();
  const scaleX = (svgEl.viewBox.baseVal.width  || 560) / svgRect.width;
  const scaleY = (svgEl.viewBox.baseVal.height || 420) / svgRect.height;
  const cx = (e.clientX ?? e.touches?.[0]?.clientX) - svgRect.left;
  const cy = (e.clientY ?? e.touches?.[0]?.clientY) - svgRect.top;
  return { x: cx * scaleX, y: cy * scaleY };
}

function bindDrag() {
  svgEl.addEventListener('pointerdown', e => {
    const pt = svgPoint(e);
    const { baseX, baseY, theta, springNatPx } = getSlopeDims();
    const { cx, cy } = getBlockCenter(baseX, baseY, theta, springNatPx, state.x);

    if (isOnBlock(pt.x, pt.y, cx, cy, params, theta)) {
      stopPlayback();
      state.mode  = 'dragging';
      isDragging  = true;
      state.v     = 0;
      svgEl.setPointerCapture(e.pointerId);
    }
  });

  svgEl.addEventListener('pointermove', e => {
    if (!isDragging) return;
    const pt = svgPoint(e);
    const { baseX, baseY, theta, springNatPx } = getSlopeDims();
    state.x = pointerToX(pt.x, pt.y, baseX, baseY, theta, springNatPx);
    render();
  });

  svgEl.addEventListener('pointerup', e => {
    if (!isDragging) return;
    isDragging = false;
    startPlayback();
  });

  svgEl.addEventListener('pointercancel', () => {
    isDragging = false;
    state.mode = 'static';
    render();
  });
}

// ── Sliders ───────────────────────────────────────────────────────────────────

const SLIDER_CONFIG = [
  { id: 'slider-m',         key: 'm',                label: 'm',              unit: 'kg',    fmt: v => v.toFixed(1) },
  { id: 'slider-theta',     key: 'thetaDeg',         label: 'θ',              unit: '°',     fmt: v => v.toFixed(0) },
  { id: 'slider-k',         key: 'k',                label: 'k',              unit: 'N/m',   fmt: v => v.toFixed(0) },
  { id: 'slider-b',         key: 'b',                label: 'b',              unit: 'Ns/m',  fmt: v => v.toFixed(1) },
  { id: 'slider-mu-s',      key: 'muStatic',         label: 'μₛ',             unit: '',      fmt: v => v.toFixed(2) },
  { id: 'slider-mu-k',      key: 'muKinetic',        label: 'μₖ',             unit: '',      fmt: v => v.toFixed(2) },
  { id: 'slider-g',         key: 'g',                label: 'g',              unit: 'm/s²',  fmt: v => v.toFixed(2) },
  { id: 'slider-spring-l',  key: 'springFreeLength', label: 'L₀',             unit: 'm',     fmt: v => v.toFixed(2) },
];

function bindSliders() {
  SLIDER_CONFIG.forEach(({ id, key, label, unit, fmt }) => {
    const slider = document.getElementById(id);
    const display = document.getElementById(id + '-val');
    if (!slider) return;

    slider.value = params[key];
    if (display) display.textContent = fmt(params[key]) + ' ' + unit;

    slider.addEventListener('input', () => {
      params[key] = parseFloat(slider.value);
      if (display) display.textContent = fmt(params[key]) + ' ' + unit;
      // Reset velocity so we don't carry stale dynamics
      if (state.mode !== 'playing') {
        state.v = 0;
      }
      render();
    });
  });
}

// ── Buttons ───────────────────────────────────────────────────────────────────

function bindButtons() {
  document.getElementById('btn-release')?.addEventListener('click', () => {
    if (state.mode !== 'playing') startPlayback();
  });

  document.getElementById('btn-reset')?.addEventListener('click', () => {
    stopPlayback();
    timePlot.clear();
    state = { x: defaultX(params), v: 0, mode: 'static', t: 0 };
    render();
  });

  document.getElementById('btn-reset-params')?.addEventListener('click', () => {
    stopPlayback();
    params = { ...DEFAULT_PARAMS };
    // Sync sliders
    SLIDER_CONFIG.forEach(({ id, key, fmt, unit }) => {
      const sl = document.getElementById(id);
      const disp = document.getElementById(id + '-val');
      if (sl) sl.value = params[key];
      if (disp) disp.textContent = fmt(params[key]) + ' ' + unit;
    });
    timePlot.clear();
    state = { x: defaultX(params), v: 0, mode: 'static', t: 0 };
    render();
  });

  document.getElementById('toggle-decompose')?.addEventListener('change', e => {
    opts.decompose = e.target.checked;
    render();
  });

  document.getElementById('toggle-net')?.addEventListener('change', e => {
    opts.showNet = e.target.checked;
    render();
  });

  document.getElementById('toggle-stiction')?.addEventListener('change', e => {
    opts.showStictionBand = e.target.checked;
    render();
  });
}

window.addEventListener('DOMContentLoaded', init);
