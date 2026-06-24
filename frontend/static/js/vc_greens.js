// Lesson 3 — Green's Theorem.  Boundary integral = interior integral.
// Shows both forms (circulation & flux) with live match badges, plus an
// optional subdivision overlay illustrating why interior edges cancel.

(function () {
  const view = makeView({ W: 620, H: 600, PAD_L: 60, PAD_T: 28, SIZE: 500 });
  const svg = document.getElementById('vc-svg');
  const gStatic = vel('g', {}, svg);
  const gDyn = vel('g', {}, svg);

  const state = { fieldKey: 'vortex', cx: 1.2, cy: 0.8, r: 1.2, mode: 'curl', subdiv: false };
  let ctx = { maxMag: 1 }, anim = {}, phase = 0, lastT = 0;

  function rebuildStatic() {
    const f = FIELDS[state.fieldKey];
    ctx = drawBackground(gStatic, view, f,
      { heatmap: state.mode === 'curl' ? 'curl' : 'div' });
    vtxt(gStatic, view.PAD_L, 18, `${f.name}:  F = ${plainLatex(f.latex)}`,
      { fill: '#cbd5e1', size: 13, bold: true, anchor: 'start' });
    vtxt(gStatic, view.W - 12, 18,
      state.mode === 'curl' ? 'Circulation form' : 'Flux form',
      { fill: state.mode === 'curl' ? '#34d399' : '#fb923c', size: 12, bold: true, anchor: 'end' });
  }

  function drawSubdivision(g, f) {
    // Tile the disc with small CCW loop glyphs; shared interior edges carry
    // opposite arrows that cancel, leaving only the outer boundary.
    const n = 5, cell = (2 * state.r) / n;
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        const wx = state.cx - state.r + (i + 0.5) * cell;
        const wy = state.cy - state.r + (j + 0.5) * cell;
        if (Math.hypot(wx - state.cx, wy - state.cy) > state.r - cell * 0.35) continue;
        const cx = view.wx2sx(wx), cy = view.wy2sy(wy), rr = cell * view.SCALE * 0.32;
        vel('circle', { cx, cy, r: rr, fill: 'none',
          stroke: 'rgba(52,211,153,0.5)', 'stroke-width': 1 }, g);
        // little CCW arrowhead at top of each mini-loop
        varrow(g, cx + 0.5, cy - rr, cx - 2, cy - rr + 0.5, 'rgba(52,211,153,0.7)', 1, 4);
      }
  }

  function rebuildLoop() {
    const f = FIELDS[state.fieldKey];
    clearEl(gDyn);
    const gSub = vel('g', {}, gDyn);
    if (state.subdiv) drawSubdivision(gSub, f);
    const gLoop = vel('g', {}, gDyn);
    anim = drawLoop(gLoop, view, f, state, ctx.maxMag, {
      showTangent: state.mode === 'curl',
      showNormal: state.mode === 'flux',
      showPaddle: state.mode === 'curl',
      showPulse: state.mode === 'flux',
      color: state.mode === 'curl' ? '#34d399' : '#fb923c',
      fill: state.mode === 'curl' ? 'rgba(16,185,129,0.06)' : 'rgba(249,115,22,0.06)',
    });
    renderReadout(f);
    renderExplain(f);
  }

  function renderReadout(f) {
    const circ = circulation(f, state.cx, state.cy, state.r);
    const curlA = curlAreaIntegral(f, state.cx, state.cy, state.r);
    const flux = outwardFlux(f, state.cx, state.cy, state.r);
    const divA = divAreaIntegral(f, state.cx, state.cy, state.r);
    const fmt = (v) => (Math.abs(v) < 5e-3 ? '0.00' : v.toFixed(2));
    const match = (a, b) => Math.abs(a - b) < 0.05 + 0.02 * Math.abs(a);
    document.getElementById('vc-readout').innerHTML = `
      <div class="vc-ro-card curl">
        <div class="vc-ro-title">Circulation form</div>
        <div class="vc-ro-line"><span class="lbl">∮<sub>C</sub> F·dr</span><span class="val">${fmt(circ)}</span></div>
        <div class="vc-ro-line"><span class="lbl">∬<sub>R</sub> (∇×F)·k̂ dA</span><span class="val">${fmt(curlA)}</span></div>
        ${match(circ, curlA) ? '<div class="vc-ro-match">✓ boundary = interior</div>' : ''}
      </div>
      <div class="vc-ro-card flux">
        <div class="vc-ro-title">Flux form</div>
        <div class="vc-ro-line"><span class="lbl">∮<sub>C</sub> F·n ds</span><span class="val">${fmt(flux)}</span></div>
        <div class="vc-ro-line"><span class="lbl">∬<sub>R</sub> (∇·F) dA</span><span class="val">${fmt(divA)}</span></div>
        ${match(flux, divA) ? '<div class="vc-ro-match">✓ boundary = interior</div>' : ''}
      </div>`;
  }

  function renderExplain(f) {
    const circ = circulation(f, state.cx, state.cy, state.r);
    const curlA = curlAreaIntegral(f, state.cx, state.cy, state.r);
    const el = document.getElementById('vc-explain');
    el.style.borderLeftColor = '#6366f1';
    el.innerHTML = `
      <div class="verdict">The boundary already knows the inside <span class="pill pill-zero">Green's</span></div>
      <p>Add up the tiny spins in every piece of the region and you get <span class="num-hi">${curlA.toFixed(2)}</span>. Walk just the outer rim and measure the push along it: <span class="num-hi">${circ.toFixed(2)}</span>. <strong>They are equal.</strong></p>
      <p style="color:var(--muted)">Why? Where two neighbouring pieces meet, their shared edge is traversed in opposite directions, so those interior contributions cancel in pairs — only the unmatched outer edges survive. Tick <em>“show subdivision”</em> to see the interior loops, and drag the loop anywhere: the equality holds.</p>`;
  }

  function tick(now) {
    if (!lastT) lastT = now;
    phase += Math.min((now - lastT) / 1000, 0.05); lastT = now;
    if (anim.paddle && Math.abs(anim.curl) > 1e-3)
      anim.paddle.setAttribute('transform', `rotate(${-anim.curl * 40 * phase} ${anim.cxpx} ${anim.cypx})`);
    if (anim.pulse) {
      const s = 1 + 0.22 * Math.sin(phase * 3.2);
      anim.pulse.setAttribute('transform',
        `translate(${anim.cxpx} ${anim.cypx}) scale(${s.toFixed(3)}) translate(${-anim.cxpx} ${-anim.cypx})`);
    }
    requestAnimationFrame(tick);
  }

  document.querySelectorAll('.vc-field-btn').forEach(b => b.addEventListener('click', () => {
    state.fieldKey = b.dataset.field;
    document.querySelectorAll('.vc-field-btn').forEach(x => x.classList.toggle('active', x === b));
    document.getElementById('vc-blurb').textContent = FIELDS[state.fieldKey].blurb;
    phase = 0; rebuildStatic(); rebuildLoop();
  }));
  document.querySelectorAll('.vc-mode-btn').forEach(b => b.addEventListener('click', () => {
    state.mode = b.dataset.mode;
    document.querySelectorAll('.vc-mode-btn').forEach(x => x.classList.toggle('active', x === b));
    rebuildStatic(); rebuildLoop();
  }));
  const rs = document.getElementById('vc-r-slider');
  rs.addEventListener('input', () => {
    state.r = parseFloat(rs.value);
    document.getElementById('vc-r-display').textContent = state.r.toFixed(2);
    drag.clamp(); rebuildLoop();
  });
  const sub = document.getElementById('vc-subdiv');
  sub.addEventListener('change', () => { state.subdiv = sub.checked; rebuildLoop(); });
  const drag = attachLoopDrag(svg, view, state, rebuildLoop);

  document.querySelector(`.vc-field-btn[data-field="${state.fieldKey}"]`)?.classList.add('active');
  document.querySelector(`.vc-mode-btn[data-mode="${state.mode}"]`)?.classList.add('active');
  document.getElementById('vc-blurb').textContent = FIELDS[state.fieldKey].blurb;
  renderTheoryCards('vc-eq-panel', [
    { tag: "Green's Theorem — circulation form", tex: '\\oint_{C}\\mathbf F\\cdot d\\mathbf r = \\iint_{R}\\!\\Big(\\dfrac{\\partial Q}{\\partial x} - \\dfrac{\\partial P}{\\partial y}\\Big)dA',
      note: 'Total circulation around C equals the total curl enclosed.' },
    { tag: "Green's Theorem — flux form", tex: '\\oint_{C}\\mathbf F\\cdot\\mathbf{\\hat n}\\,ds = \\iint_{R}\\nabla\\!\\cdot\\!\\mathbf F\\,dA',
      note: 'Total outward flux through C equals the total divergence enclosed (the 2-D Divergence Theorem).' },
  ]);
  rebuildStatic(); rebuildLoop();
  requestAnimationFrame(tick);
})();
