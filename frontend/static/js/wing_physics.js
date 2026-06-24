// Aircraft wing (airfoil) physics — pure functions, no DOM
//
// Thin airfoil model at fixed 5° angle of attack, NACA 2412
// Bernoulli + Kutta-Joukowski: lift arises from v_upper > v_lower
//
// CL, CD are geometry/AoA constants (don't change with v at fixed AoA,
// incompressible flow). Only q = ½ρv² scales with speed.

const AIRFOIL = {
  RHO:    1.225,   // kg/m³  air at sea level
  CHORD:  1.0,     // m  reference chord
  CL:     0.82,    // lift coefficient  (NACA 2412 at ~5° AoA)
  CD:     0.012,   // drag coefficient
  CP_MIN: -1.25,   // peak Cp on suction (upper) surface
  CP_LE:  +0.97,   // Cp at leading-edge stagnation point
  // Approximate local Cp distribution, chordwise stations 0→1
  // Used to drive the colour scale on the wing surface
  CP_UPPER: [0.97, -1.10, -1.25, -1.05, -0.78, -0.52, -0.30, -0.14, -0.04, 0.00],
  CP_LOWER: [0.97,  0.45,  0.30,  0.20,  0.12,  0.06,  0.02, -0.01, -0.02, 0.00],
};

function wingDerive(v) {
  const q        = 0.5 * AIRFOIL.RHO * v * v;
  const lift     = q * AIRFOIL.CL  * AIRFOIL.CHORD;
  const drag     = q * AIRFOIL.CD  * AIRFOIL.CHORD;
  const dP_peak  = q * Math.abs(AIRFOIL.CP_MIN);   // peak suction above wing
  const dP_stag  = q * AIRFOIL.CP_LE;              // stagnation pressure
  const ld_ratio = AIRFOIL.CL / AIRFOIL.CD;        // constant (68.3)
  return {
    v, q, lift, drag, dP_peak, dP_stag, ld_ratio,
    CL: AIRFOIL.CL, CD: AIRFOIL.CD,
    rho: AIRFOIL.RHO,
  };
}
