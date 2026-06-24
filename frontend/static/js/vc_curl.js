// Lesson 2 — Curl.  Local rotation of a field.
// Heatmap = curl (teal CCW / purple CW); loop shows the tangential
// component on its boundary and a paddle wheel that spins at the curl.

(function () {
  const view = makeView({ W: 620, H: 600, PAD_L: 60, PAD_T: 28, SIZE: 500 });
  const svg = document.getElementById('vc-svg');
  const gStatic = vel('g', {}, svg);
  const gDyn = vel('g', {}, svg);

  const state = { fieldKey: 'vortex', cx: 1.3, cy: 0.9, r: 1.0 };
  let ctx = { maxMag: 1 }, anim = {}, phase = 0, lastT = 0;

  function rebuildStatic() {
    const f = FIELDS[state.fieldKey];
    ctx = drawBackground(gStatic, view, f, { heatmap: 'curl' });
    vtxt(gStatic, view.PAD_L, 18, `${f.name}:  F = ${plainLatex(f.latex)}`,
      { fill: '#cbd5e1', size: 13, bold: true, anchor: 'start' });
    vtxt(gStatic, view.W - 12, view.PAD_T + view.SIZE + 22, 'teal = counter-clockwise   ·   purple = clockwise',
      { fill: '#64748b', size: 11, anchor: 'end' });
  }
  function rebuildLoop() {
    const f = FIELDS[state.fieldKey];
    anim = drawLoop(gDyn, view, f, state, ctx.maxMag,
      { showTangent: true, showPaddle: true, color: '#34d399', fill: 'rgba(16,185,129,0.07)' });
    renderReadout(f);
    renderExplain(f);
  }

  function renderReadout(f) {
    const circ = circulation(f, state.cx, state.cy, state.r);
    const curlA = curlAreaIntegral(f, state.cx, state.cy, state.r);
    const cC = fieldCurl(f, state.cx, state.cy);
    const fmt = (v) => (Math.abs(v) < 5e-3 ? '0.00' : v.toFixed(2));
    document.getElementById('vc-readout').innerHTML = `
      <div class="vc-ro-card curl">
        <div class="vc-ro-title">Circulation around the loop</div>
        <div class="vc-ro-line"><span class="lbl">∮<sub>C</sub> F·dr  (boundary)</span><span class="val">${fmt(circ)}</span></div>
        <div class="vc-ro-line"><span class="lbl">∬<sub>R</sub> (∇×F)·k̂ dA  (interior)</span><span class="val">${fmt(curlA)}</span></div>
        <div class="vc-ro-line"><span class="lbl">curl at centre</span><span class="val">${fmt(cC)}</span></div>
      </div>`;
  }

  function renderExplain(f) {
    const circ = circulation(f, state.cx, state.cy, state.r);
    const cC = fieldCurl(f, state.cx, state.cy);
    let pill, verdict, story;
    if (cC > 0.05) {
      pill = '<span class="pill pill-ccw">CCW spin</span>';
      verdict = 'A floating paddle would spin left';
      story = `Going around the loop, the field pushes <em>with</em> you more than against you, giving a circulation of <span class="num-hi">+${circ.toFixed(2)}</span>. The paddle wheel turns counter-clockwise — positive curl, shown in <strong style="color:#2dd4bf">teal</strong>.`;
    } else if (cC < -0.05) {
      pill = '<span class="pill pill-cw">CW spin</span>';
      verdict = 'A floating paddle would spin right';
      story = `Going around the loop, the field pushes <em>against</em> you on balance, giving a circulation of <span class="num-hi">${circ.toFixed(2)}</span>. The paddle wheel turns clockwise — negative curl, shown in <strong style="color:#a78bfa">purple</strong>.`;
    } else {
      pill = '<span class="pill pill-zero">No spin</span>';
      verdict = 'A floating paddle would not turn';
      story = `The push along the loop cancels out, so the circulation is about <span class="num-hi">0</span>. Even if the field is strong, it is <em>irrotational</em> here — zero curl.`;
    }
    const el = document.getElementById('vc-explain');
    el.style.borderLeftColor = cC > 0.05 ? '#10b981' : cC < -0.05 ? '#8b5cf6' : '#94a3b8';
    el.innerHTML = `
      <div class="verdict">${verdict} ${pill}</div>
      <p>${story}</p>
      <p style="color:var(--muted)"><strong>Curl</strong> measures this twisting tendency at a point. Try the <em>Shear</em> field — the flow is perfectly straight, yet it still has curl because one side moves faster than the other.</p>`;
  }

  function tick(now) {
    if (!lastT) lastT = now;
    phase += Math.min((now - lastT) / 1000, 0.05); lastT = now;
    if (anim.paddle && Math.abs(anim.curl) > 1e-3) {
      const ang = -anim.curl * 40 * phase;
      anim.paddle.setAttribute('transform', `rotate(${ang} ${anim.cxpx} ${anim.cypx})`);
    }
    requestAnimationFrame(tick);
  }

  document.querySelectorAll('.vc-field-btn').forEach(b => b.addEventListener('click', () => {
    state.fieldKey = b.dataset.field;
    document.querySelectorAll('.vc-field-btn').forEach(x => x.classList.toggle('active', x === b));
    document.getElementById('vc-blurb').textContent = FIELDS[state.fieldKey].blurb;
    phase = 0; rebuildStatic(); rebuildLoop();
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
    { tag: 'Curl (z-component)', tex: '(\\nabla\\times\\mathbf F)\\cdot\\mathbf{\\hat k} = \\dfrac{\\partial Q}{\\partial x} - \\dfrac{\\partial P}{\\partial y}',
      note: 'The local rate of rotation. The paddle wheel spins at exactly this value; its direction is the sign.' },
    { tag: 'Circulation around the loop', tex: '\\oint_{C}\\mathbf F\\cdot d\\mathbf r = \\iint_{R}(\\nabla\\times\\mathbf F)\\cdot\\mathbf{\\hat k}\\,dA',
      note: 'The total push around the boundary equals the curl summed over the inside — the two numbers above stay equal.' },
  ]);
  rebuildStatic(); rebuildLoop();
  requestAnimationFrame(tick);
})();
