// x = spring compression (m), positive = down-slope (into spring)
// All forces along-slope: down-slope positive

const V_EPS = 1e-4; // m/s threshold for "at rest"
const F_EPS = 1e-3; // N threshold for "settled"

function deriveForces(p, s) {
  const theta = p.thetaDeg * Math.PI / 180;

  const normalForce       = p.m * p.g * Math.cos(theta);
  const gravityAlongSlope = p.m * p.g * Math.sin(theta);
  const springForce       = p.k * s.x;
  const netBeforeFriction = gravityAlongSlope - springForce;

  const frictionMax = p.muStatic * normalForce;
  const isHeld      = Math.abs(netBeforeFriction) <= frictionMax;

  let frictionForce, netForce;

  if (s.mode === 'playing' && Math.abs(s.v) > V_EPS) {
    // sliding: kinetic friction opposes velocity, plus viscous damping
    frictionForce = -p.muKinetic * normalForce * Math.sign(s.v) - p.b * s.v;
    netForce      = netBeforeFriction + frictionForce;
  } else if (isHeld) {
    // stiction: friction exactly cancels net
    frictionForce = -netBeforeFriction;
    netForce      = 0;
  } else {
    // at rest but outside stiction band → slipping
    frictionForce = -frictionMax * Math.sign(netBeforeFriction);
    netForce      = netBeforeFriction + frictionForce;
  }

  return {
    theta,
    normalForce,
    gravityAlongSlope,
    springForce,
    netBeforeFriction,
    frictionMax,
    isHeld,
    frictionForce,
    netForce,
    acceleration:  netForce / p.m,
    equilibriumX:  gravityAlongSlope / p.k,
    omega_n:       Math.sqrt(p.k / p.m),
    zeta:          p.b / (2 * Math.sqrt(p.k * p.m)),
  };
}

// RK4 integrator step
function rk4Step(p, x, v, dt) {
  function deriv(xi, vi) {
    const f = deriveForces(p, { x: xi, v: vi, mode: 'playing' });
    return [vi, f.acceleration];
  }

  const [dx1, dv1] = deriv(x, v);
  const [dx2, dv2] = deriv(x + 0.5 * dt * dx1, v + 0.5 * dt * dv1);
  const [dx3, dv3] = deriv(x + 0.5 * dt * dx2, v + 0.5 * dt * dv2);
  const [dx4, dv4] = deriv(x + dt * dx3, v + dt * dv3);

  return [
    x + (dt / 6) * (dx1 + 2 * dx2 + 2 * dx3 + dx4),
    v + (dt / 6) * (dv1 + 2 * dv2 + 2 * dv3 + dv4),
  ];
}

function isSettled(forces, v) {
  return Math.abs(v) < V_EPS && Math.abs(forces.netForce) < F_EPS;
}
