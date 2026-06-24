// Bernoulli & Venturi physics — pure functions, no DOM
//
// Convention:
//   x = horizontal flow direction
//   Section 1 = wide inlet, Section 2 = narrow throat
//   P_total = P + ½ρv² = constant along a streamline (Bernoulli)
//   Continuity: A₁v₁ = A₂v₂  →  v₂ = v₁·(A₁/A₂)
//
// We fix P_total so that P₂ stays positive across the full v₁ range.
// With AREA_RATIO=3 and v₁_max=6: dynP₂_max = ½·1000·(18²) = 162 000 Pa
// → choose P_TOTAL = 220 000 Pa so P₂_min = 58 000 Pa > 0.

const BV = {
  RHO:        1000,    // kg/m³ (water)
  AREA_RATIO: 3,       // A₁/A₂  (matches pipe geometry (R1/R2)² ≈ (60/35)² ≈ 2.94)
  P_TOTAL:    220000,  // Pa — Bernoulli constant (total/stagnation pressure)
};

function bernoulliDerive(v1) {
  const v2    = v1 * BV.AREA_RATIO;
  const dynP1 = 0.5 * BV.RHO * v1 * v1;
  const dynP2 = 0.5 * BV.RHO * v2 * v2;
  const P1    = BV.P_TOTAL - dynP1;
  const P2    = BV.P_TOTAL - dynP2;
  return {
    v1, v2,
    dynP1, dynP2,
    P1, P2,
    deltaP:     P1 - P2,    // = dynP2 - dynP1 = ½ρ(v2²−v1²)
    P_total:    BV.P_TOTAL,
    rho:        BV.RHO,
    areaRatio:  BV.AREA_RATIO,
  };
}

// Local velocity at pipe x-position using continuity A(x)·v(x) = A₁·v₁
// r = local radius, R1 = inlet radius (both in same units)
function localVelocity(v1, r, R1) {
  return v1 * (R1 / r) ** 2;
}
