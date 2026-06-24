// SVG diagram renderer for block-on-slope-against-spring
// All coordinates: SVG space (y points DOWN)

const DIAGRAM = {
  // Layout constants (px)
  slopeLength: 400,
  blockSize: 40,
  arrowHeadSize: 8,
  forceScale: 12,      // px per Newton
  pixelsPerMetre: 800, // px per metre for spring compression

  // Colours
  colors: {
    weight:   '#e74c3c',
    normal:   '#3498db',
    spring:   '#27ae60',
    friction: '#f39c12',
    net:      '#9b59b6',
    slope:    '#7f8c8d',
    block:    '#2c3e50',
    spring_coil: '#27ae60',
    stiction_band: 'rgba(39,174,96,0.12)',
  },
};

function getSlopeTransform(theta) {
  // Returns the SVG origin + rotation for the slope axis
  // Slope base starts at bottom-left of the SVG canvas
  return {
    cos: Math.cos(theta),
    sin: Math.sin(theta),
  };
}

function drawArrow(svg, x1, y1, x2, y2, color, label, dashed = false) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 4) return; // too short to draw

  const ux = dx / len, uy = dy / len;
  const hs = DIAGRAM.arrowHeadSize;

  // shaft
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('x1', x1); line.setAttribute('y1', y1);
  line.setAttribute('x2', x2 - ux * hs); line.setAttribute('y2', y2 - uy * hs);
  line.setAttribute('stroke', color);
  line.setAttribute('stroke-width', '2.5');
  if (dashed) line.setAttribute('stroke-dasharray', '5,3');
  svg.appendChild(line);

  // arrowhead
  const perp = { x: -uy * hs * 0.5, y: ux * hs * 0.5 };
  const tip   = { x: x2, y: y2 };
  const b1    = { x: x2 - ux * hs + perp.x, y: y2 - uy * hs + perp.y };
  const b2    = { x: x2 - ux * hs - perp.x, y: y2 - uy * hs - perp.y };
  const poly  = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
  poly.setAttribute('points', `${tip.x},${tip.y} ${b1.x},${b1.y} ${b2.x},${b2.y}`);
  poly.setAttribute('fill', color);
  svg.appendChild(poly);

  // label
  if (label) {
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', x2 + ux * 12 - uy * 10);
    text.setAttribute('y', y2 + uy * 12 + ux * 10);
    text.setAttribute('fill', color);
    text.setAttribute('font-size', '13');
    text.setAttribute('font-family', 'serif');
    text.setAttribute('font-style', 'italic');
    text.textContent = label;
    svg.appendChild(text);
  }
}

function renderDiagram(svgEl, params, state, forces, opts = {}) {
  const W = svgEl.viewBox.baseVal.width  || 560;
  const H = svgEl.viewBox.baseVal.height || 420;

  svgEl.innerHTML = '';

  const theta = forces.theta;
  const cosT  = Math.cos(theta);
  const sinT  = Math.sin(theta);

  // Slope geometry: drawn from bottom-left corner
  const marginX = 60, marginY = 20;
  const slopeL  = DIAGRAM.slopeLength;

  // Slope base (wall) = bottom-left anchor
  const baseX = marginX;
  const baseY = H - marginY - 40;

  // Top of slope in SVG coords
  const topX = baseX + slopeL * cosT;
  const topY = baseY - slopeL * sinT;

  // --- Draw slope surface ---
  const slopeLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  slopeLine.setAttribute('x1', baseX); slopeLine.setAttribute('y1', baseY);
  slopeLine.setAttribute('x2', topX);  slopeLine.setAttribute('y2', topY);
  slopeLine.setAttribute('stroke', DIAGRAM.colors.slope);
  slopeLine.setAttribute('stroke-width', '4');
  svgEl.appendChild(slopeLine);

  // Hatching below slope
  for (let t = 0; t <= 1; t += 0.08) {
    const hx = baseX + t * slopeL * cosT;
    const hy = baseY - t * slopeL * sinT;
    const hatch = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    hatch.setAttribute('x1', hx);
    hatch.setAttribute('y1', hy);
    hatch.setAttribute('x2', hx + sinT * 12);
    hatch.setAttribute('y2', hy + cosT * 12);
    hatch.setAttribute('stroke', DIAGRAM.colors.slope);
    hatch.setAttribute('stroke-width', '1');
    hatch.setAttribute('opacity', '0.4');
    svgEl.appendChild(hatch);
  }

  // Wall (vertical line at base)
  const wall = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  wall.setAttribute('x1', baseX); wall.setAttribute('y1', baseY - 20);
  wall.setAttribute('x2', baseX); wall.setAttribute('y2', baseY + 20);
  wall.setAttribute('stroke', DIAGRAM.colors.slope);
  wall.setAttribute('stroke-width', '6');
  svgEl.appendChild(wall);

  // Spring anchor on wall (in slope direction)
  const springAnchorX = baseX;
  const springAnchorY = baseY;

  // Block position along slope: x = compression, so block is at distance
  // (springFreeLength + x) from wall along slope
  const springNatPx   = params.springFreeLength * DIAGRAM.pixelsPerMetre;
  const compressionPx = state.x * DIAGRAM.pixelsPerMetre;
  const blockDistPx   = springNatPx + compressionPx;  // down-slope from wall

  const blockCX = baseX + blockDistPx * cosT;
  const blockCY = baseY - blockDistPx * sinT;

  // --- Draw spring (zigzag) ---
  drawSpring(svgEl, springAnchorX, springAnchorY, blockCX - (DIAGRAM.blockSize / 2) * cosT,
    blockCY + (DIAGRAM.blockSize / 2) * sinT, DIAGRAM.colors.spring_coil);

  // --- Block ---
  const blockHalfW = DIAGRAM.blockSize / 2;
  const block = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  // rotated rect: use transform
  block.setAttribute('x', -blockHalfW);
  block.setAttribute('y', -blockHalfW);
  block.setAttribute('width', DIAGRAM.blockSize);
  block.setAttribute('height', DIAGRAM.blockSize);
  block.setAttribute('fill', DIAGRAM.colors.block);
  block.setAttribute('rx', '4');
  block.setAttribute('transform',
    `translate(${blockCX},${blockCY}) rotate(${-params.thetaDeg})`);
  svgEl.appendChild(block);

  // --- Force vectors ---
  const sc = DIAGRAM.forceScale;

  // Weight (straight down)
  const mg = params.m * params.g;
  drawArrow(svgEl, blockCX, blockCY,
    blockCX, blockCY + mg * sc,
    DIAGRAM.colors.weight, 'mg');

  if (opts.decompose) {
    // Gravity components
    drawArrow(svgEl, blockCX, blockCY,
      blockCX + forces.gravityAlongSlope * sc * cosT,
      blockCY - forces.gravityAlongSlope * sc * sinT,
      DIAGRAM.colors.weight, 'mg·sinθ', true);
    drawArrow(svgEl, blockCX, blockCY,
      blockCX + sinT * forces.normalForce * sc,
      blockCY + cosT * forces.normalForce * sc,
      DIAGRAM.colors.normal, 'mg·cosθ', true);
  }

  // Normal force (out of slope = rotated 90° from down-slope direction)
  // Perpendicular to slope, out of surface: (-sinθ, -cosθ) in SVG
  drawArrow(svgEl, blockCX, blockCY,
    blockCX - sinT * forces.normalForce * sc,
    blockCY - cosT * forces.normalForce * sc,
    DIAGRAM.colors.normal, 'N');

  // Spring force (up-slope = negative cosT, positive sinT in SVG)
  if (forces.springForce > 0.01) {
    drawArrow(svgEl, blockCX, blockCY,
      blockCX - forces.springForce * sc * cosT,
      blockCY + forces.springForce * sc * sinT,
      DIAGRAM.colors.spring, 'Fₛ');
  }

  // Friction force (along slope, direction from frictionForce sign)
  if (Math.abs(forces.frictionForce) > 0.1) {
    const fDir = Math.sign(forces.frictionForce); // + = down-slope
    drawArrow(svgEl, blockCX, blockCY,
      blockCX + fDir * Math.abs(forces.frictionForce) * sc * cosT,
      blockCY - fDir * Math.abs(forces.frictionForce) * sc * sinT,
      DIAGRAM.colors.friction, 'f');
  }

  // Net force arrow (optional)
  if (opts.showNet && Math.abs(forces.netForce) > 0.1) {
    const nDir = Math.sign(forces.netForce);
    drawArrow(svgEl, blockCX, blockCY,
      blockCX + forces.netForce * sc * cosT,
      blockCY - forces.netForce * sc * sinT,
      DIAGRAM.colors.net, 'Fₙₑₜ');
  }

  // --- Stiction band indicator (two lines on slope showing the band) ---
  if (opts.showStictionBand) {
    const xEq = forces.equilibriumX;
    const bandHalfWidth = forces.frictionMax / params.k;
    const xLow  = xEq - bandHalfWidth;
    const xHigh = xEq + bandHalfWidth;

    function slopePoint(xVal) {
      const d = (springNatPx + xVal * DIAGRAM.pixelsPerMetre);
      return [baseX + d * cosT, baseY - d * sinT];
    }

    const [lx1, ly1] = slopePoint(Math.max(xLow, 0));
    const [lx2, ly2] = slopePoint(xHigh);

    const bandRect = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    bandRect.setAttribute('x1', lx1); bandRect.setAttribute('y1', ly1);
    bandRect.setAttribute('x2', lx2); bandRect.setAttribute('y2', ly2);
    bandRect.setAttribute('stroke', DIAGRAM.colors.friction);
    bandRect.setAttribute('stroke-width', '8');
    bandRect.setAttribute('opacity', '0.25');
    svgEl.appendChild(bandRect);

    const bandLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    bandLabel.setAttribute('x', (lx1 + lx2) / 2 - sinT * 20);
    bandLabel.setAttribute('y', (ly1 + ly2) / 2 - cosT * 20);
    bandLabel.setAttribute('fill', DIAGRAM.colors.friction);
    bandLabel.setAttribute('font-size', '11');
    bandLabel.setAttribute('text-anchor', 'middle');
    bandLabel.textContent = 'stiction band';
    svgEl.appendChild(bandLabel);
  }

  // --- Angle label ---
  const arcR = 40;
  const arc = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  const arcX = baseX + arcR * cosT;
  const arcY = baseY - arcR * sinT;
  arc.setAttribute('d', `M ${baseX + arcR} ${baseY} A ${arcR} ${arcR} 0 0 1 ${arcX} ${arcY}`);
  arc.setAttribute('fill', 'none');
  arc.setAttribute('stroke', '#888');
  arc.setAttribute('stroke-width', '1.5');
  svgEl.appendChild(arc);

  const thetaLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  thetaLabel.setAttribute('x', baseX + (arcR + 14) * Math.cos(theta / 2));
  thetaLabel.setAttribute('y', baseY - (arcR + 14) * Math.sin(theta / 2));
  thetaLabel.setAttribute('fill', '#555');
  thetaLabel.setAttribute('font-size', '14');
  thetaLabel.setAttribute('font-family', 'serif');
  thetaLabel.setAttribute('font-style', 'italic');
  thetaLabel.textContent = 'θ';
  svgEl.appendChild(thetaLabel);

  // --- Block position indicator ---
  const posLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  posLabel.setAttribute('x', W - 10);
  posLabel.setAttribute('y', 20);
  posLabel.setAttribute('fill', '#333');
  posLabel.setAttribute('font-size', '12');
  posLabel.setAttribute('text-anchor', 'end');
  posLabel.textContent = `x = ${state.x.toFixed(4)} m`;
  svgEl.appendChild(posLabel);

  const held = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  held.setAttribute('x', W - 10);
  held.setAttribute('y', 38);
  held.setAttribute('fill', forces.isHeld ? DIAGRAM.colors.spring : DIAGRAM.colors.weight);
  held.setAttribute('font-size', '12');
  held.setAttribute('text-anchor', 'end');
  held.textContent = forces.isHeld ? '✓ held by friction' : '⚠ slipping';
  svgEl.appendChild(held);
}

function drawSpring(svg, x1, y1, x2, y2, color) {
  const dx   = x2 - x1, dy = y2 - y1;
  const len  = Math.sqrt(dx * dx + dy * dy);
  if (len < 2) return;
  const ux = dx / len, uy = dy / len;
  const px = -uy, py = ux; // perpendicular

  const coils = 8;
  const amp   = 8;
  const points = [];
  const segments = coils * 2 + 2;

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const along = t * len;
    const side  = (i % 2 === 0) ? 0 : (i % 4 === 1 ? amp : -amp);
    points.push([x1 + ux * along + px * side, y1 + uy * along + py * side]);
  }

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
  path.setAttribute('points', points.map(p => p.join(',')).join(' '));
  path.setAttribute('stroke', color);
  path.setAttribute('stroke-width', '2');
  path.setAttribute('fill', 'none');
  svg.appendChild(path);
}

// Hit-test: is pointer near block centre?
function isOnBlock(px, py, blockCX, blockCY, params, theta) {
  const bs = DIAGRAM.blockSize;
  // Transform pointer into block-local coords (rotated by -theta)
  const rx = (px - blockCX) * Math.cos(-theta) - (py - blockCY) * Math.sin(-theta);
  const ry = (px - blockCX) * Math.sin(-theta) + (py - blockCY) * Math.cos(-theta);
  return Math.abs(rx) < bs && Math.abs(ry) < bs;
}

// Map pointer position to spring compression x
function pointerToX(pointerX, pointerY, baseX, baseY, theta, springNatPx) {
  const dir = { x: Math.cos(theta), y: -Math.sin(theta) }; // down-slope in SVG (y up on slope = y down in SVG for negative, so -)
  // Actually in SVG y is down, slope goes: x increases right, y decreases (goes up)
  // down-slope unit vector in SVG: (cosθ, -sinθ)  [x right, y upward = negative SVG y]
  // Wait: SVG y down means down-slope in SVG space is (cosθ, sinθ) when theta measured from horizontal
  // Let me be careful: slope angle theta from horizontal, going up-right.
  // Moving DOWN the slope in world: x increases, y decreases (goes up physically, but in SVG y is DOWN)
  // Actually the slope goes from bottom-left (baseX,baseY) to top-right (topX<baseX+L*cos, topY=baseY-L*sin)
  // So "down-slope" direction in SVG coords is: from top toward base = (baseX-topX, baseY-topY) normalised
  // = (-cosθ, sinθ) ... but we want down-slope as positive x direction
  // down-slope SVG unit vector: (cosθ, sinθ) if we go from base upward... no.
  // Slope: base at (baseX,baseY), top at (baseX + L*cosθ, baseY - L*sinθ)
  // "up-slope" direction in SVG = (cosθ, -sinθ)
  // "down-slope" direction in SVG = (-cosθ, sinθ)
  // Block is at distance (springNatPx + x * PPM) from base UP the slope
  // So block SVG position = base + (springNatPx + x*PPM) * (cosθ, -sinθ)

  // To recover x from pointer:
  // project (pointer - base) onto up-slope direction (cosθ, -sinθ)
  const rel = { x: pointerX - baseX, y: pointerY - baseY };
  const upSlopeDir = { x: Math.cos(theta), y: -Math.sin(theta) };
  const distAlongSlopePx = rel.x * upSlopeDir.x + rel.y * upSlopeDir.y;
  const x = (distAlongSlopePx - springNatPx) / DIAGRAM.pixelsPerMetre;
  return Math.max(0, x); // no pulling spring (x >= 0)
}

function getBlockCenter(baseX, baseY, theta, springNatPx, x) {
  const d = springNatPx + x * DIAGRAM.pixelsPerMetre;
  return {
    cx: baseX + d * Math.cos(theta),
    cy: baseY - d * Math.sin(theta),
  };
}
