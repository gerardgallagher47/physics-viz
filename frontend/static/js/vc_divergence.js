// Lesson 1 — Divergence.  Flux of a field out of a small loop.
// Heatmap = divergence (red source / blue sink); loop shows the outward
// normal component on its boundary and a star that pulses with the sign.

(function () {
  const view = makeView({ W: 620, H: 600, PAD_L: 60, PAD_T: 28, SIZE: 500 });
  const svg = document.getElementById('vc-svg');
  const gStatic = vel('g', {}, svg);
  const gDyn = vel('g', {}, svg);

  const state = { fieldKey: 'source', cx: 1.3, cy: 0.9, r: 1.0 };
  let ctx = { maxMag: 1 }, anim = {}, phase = 0, lastT = 0;

  function rebuildStatic() {
    const f = FIELDS[state.fieldKey];
    ctx = drawBackground(gStatic, view, f, { heatmap: 'div' });
    vtxt(gStatic, view.PAD_L, 18, `${f.name}:  F = ${plainLatex(f.latex)}`,
      { fill: '#cbd5e1', size: 13, bold: true, anchor: 'start' });
    // heatmap key
    vtxt(gStatic, view.W - 12, view.PAD_T + view.SIZE + 22, 'red = source (out)   ·   blue = sink (in)',
      { fill: '#64748b', size: 11, anchor: 'end' });
  }
  function rebuildLoop() {
    const f = FIELDS[state.fieldKey];
    anim = drawLoop(gDyn, view, f, state, ctx.maxMag,
      { showNormal: true, showPulse: true, color: '#fb923c', fill: 'rgba(249,115,22,0.07)' });
    renderReadout(f);
    renderExplain(f);
  }

  function renderReadout(f) {
    const flux = outwardFlux(f, state.cx, state.cy, state.r);
    const divA = divAreaIntegral(f, state.cx, state.cy, state.r);
    const dC = fieldDiv(f, state.cx, state.cy);
    const fmt = (v) => (Math.abs(v) < 5e-3 ? '0.00' : v.toFixed(2));
    document.getElementById('vc-readout').innerHTML = `
      <div class="vc-ro-card flux">
        <div class="vc-ro-title">Flux out of the loop</div>
        <div class="vc-ro-line"><span class="lbl">∮<sub>C</sub> F·n ds  (boundary)</span><span class="val">${fmt(flux)}</span></div>
        <div class="vc-ro-line"><span class="lbl">∬<sub>R</sub> (∇·F) dA  (interior)</span><span class="val">${fmt(divA)}</span></div>
        <div class="vc-ro-line"><span class="lbl">divergence at centre</span><span class="val">${fmt(dC)}</span></div>
      </div>`;
  }

  function renderExplain(f) {
    const flux = outwardFlux(f, state.cx, state.cy, state.r);
    const dC = fieldDiv(f, state.cx, state.cy);
    let pill, verdict, story;
    if (dC > 0.05) {
      pill = '<span class="pill pill-pos">Source</span>';
      verdict = 'Flow is bursting outward';
      story = `More arrows leave the loop than enter it, so the net flux is <span class="num-hi">+${flux.toFixed(2)}</span> — fluid is being <em>created</em> inside. That positive divergence is why the centre glows <strong style="color:#ef4444">red</strong>.`;
    } else if (dC < -0.05) {
      pill = '<span class="pill pill-neg">Sink</span>';
      verdict = 'Flow is draining inward';
      story = `More arrows enter the loop than leave it, so the net flux is <span class="num-hi">${flux.toFixed(2)}</span> — fluid is being <em>swallowed</em>. That negative divergence is why the centre glows <strong style="color:#3b82f6">blue</strong>.`;
    } else {
      pill = '<span class="pill pill-zero">Balanced</span>';
      verdict = 'Whatever flows in, flows out';
      story = `Every arrow entering is matched by one leaving, so the net flux is about <span class="num-hi">0</span>. The divergence here is zero — the field just passes through, neither piling up nor draining.`;
    }
    const el = document.getElementById('vc-explain');
    el.style.borderLeftColor = dC > 0.05 ? '#ef4444' : dC < -0.05 ? '#3b82f6' : '#94a3b8';
    el.innerHTML = `
      <div class="verdict">${verdict} ${pill}</div>
      <p>${story}</p>
      <p style="color:var(--muted)"><strong>Divergence</strong> measures exactly this: the net outflow per unit area at a point. Drag the loop to a differently-coloured patch to see it flip.</p>`;
  }

  function tick(now) {
    if (!lastT) lastT = now;
    phase += Math.min((now - lastT) / 1000, 0.05); lastT = now;
    if (anim.pulse) {
      const s = 1 + 0.22 * Math.sin(phase * 3.2);
      anim.pulse.setAttribute('transform',
        `translate(${anim.cxpx} ${anim.cypx}) scale(${s.toFixed(3)}) translate(${-anim.cxpx} ${-anim.cypx})`);
    }
    requestAnimationFrame(tick);
  }

  // controls
  document.querySelectorAll('.vc-field-btn').forEach(b => b.addEventListener('click', () => {
    state.fieldKey = b.dataset.field;
    document.querySelectorAll('.vc-field-btn').forEach(x => x.classList.toggle('active', x === b));
    document.getElementById('vc-blurb').textContent = FIELDS[state.fieldKey].blurb;
    rebuildStatic(); rebuildLoop();
  }));
  const rs = document.getElementById('vc-r-slider');
  rs.addEventListener('input', () => {
    state.r = parseFloat(rs.value);
    document.getElementById('vc-r-display').textContent = state.r.toFixed(2);
    drag.clamp(); rebuildLoop();
  });
  const drag = attachLoopDrag(svg, view, state, rebuildLoop);

  document.querySelector(`.vc-field-btn[data-field="${state.fieldKey}"]`)?.classList.add('active');
  document.getElementById('vc-blurb').textContent = FIELDS[state.fieldKey].blurb;
  renderTheoryCards('vc-eq-panel', [
    { tag: 'Divergence', tex: '\\operatorname{div}\\mathbf F = \\nabla\\!\\cdot\\!\\mathbf F = \\dfrac{\\partial P}{\\partial x} + \\dfrac{\\partial Q}{\\partial y}',
      note: 'A single number at each point: positive = source, negative = sink, zero = incompressible.' },
    { tag: 'Flux through the loop', tex: '\\oint_{C}\\mathbf F\\cdot\\mathbf{\\hat n}\\,ds = \\iint_{R}\\nabla\\!\\cdot\\!\\mathbf F\\,dA',
      note: 'The total flux crossing the boundary equals the divergence summed over the inside — you are watching both sides of this equation.' },
  ]);
  rebuildStatic(); rebuildLoop();
  requestAnimationFrame(tick);
})();
