# Block on Slope — Spring & Friction

An interactive physics visualisation of a block resting on an inclined plane, compressed against a spring, with static and kinetic friction. Drag the block, release it, and watch the forces update live.

## What it teaches

| Interaction | Lesson |
|---|---|
| Drag block anywhere, watch equations panel | How each force depends on position |
| Enable "stiction band" overlay | Range of positions where static friction holds the block |
| Release → animation plays | Mass-spring-damper ODE: `mẍ + bẋ + kx = mg sinθ` |
| Sweep the `b` (damping) slider | Under / critically / over-damped responses |
| Toggle "Decompose weight" | Resolving `mg` into slope components |
| Change `g` | What happens on the Moon |

## Physics model

Single generalized coordinate **x = spring compression (m)**, positive down-slope. All slope forces are resolved along this axis. One pure function `deriveForces(params, state)` is the single source of truth — it feeds the FBD vectors, the equation panel, and the RK4 integrator, so the diagram and the maths are guaranteed to agree.

### Default parameters (regression test)

With `m = 2 kg`, `θ = 30°`, `k = 200 N/m`, `g = 9.81 m/s²`:

| Quantity | Value |
|---|---|
| `mg sinθ` | 9.810 N |
| `x_eq = mg sinθ / k` | 0.0490 m ≈ 4.9 cm |
| Normal force `N` | 16.991 N |
| Static friction limit `μₛN` (μₛ=0.3) | 5.097 N |
| Natural frequency `ωₙ = √(k/m)` | 10.0 rad/s |
| Damping ratio `ζ = b / 2√(km)` (b=12) | 0.300 |

At x = 0 the net force (9.81 N) exceeds the friction limit (5.1 N), so the block slips down on release — consistent with the spec.

### MVP seam (documented)

Dynamic playback uses **viscous damping** (`bẋ`) for a smooth RK4 integration and a clean 2nd-order story. Coulomb friction lives in the static FBD for the stiction-band lesson. Full stick-slip dynamics with `v = 0` event detection is a Phase-2 upgrade.

---

## Project structure

```
physics-viz/
├── backend/
│   ├── app.py            # Flask server (serves static files + templates)
│   └── requirements.txt
├── frontend/
│   ├── templates/
│   │   └── index.html    # Single-page app shell
│   └── static/
│       ├── css/
│       │   └── style.css
│       └── js/
│           ├── physics.js    # deriveForces, rk4Step, isSettled — pure functions, no DOM
│           ├── diagram.js    # SVG FBD renderer, drag hit-test, pointer→x mapping
│           ├── equations.js  # KaTeX equation panel builder
│           ├── plot.js       # Canvas time-series plot (x vs t)
│           └── app.js        # Controller: state machine, slider bindings, RAF loop
└── README.md
```

---

## Running locally

### 1. Install Python dependencies

Requires Python 3.9+.

```bash
cd physics-viz
pip install -r backend/requirements.txt
```

### 2. Start the server

```bash
python3 backend/app.py
```

The server starts on **http://localhost:5001** by default.

To use a different port:

```bash
PORT=8080 python3 backend/app.py
```

### 3. Open in browser

```
http://localhost:5001
```

No build step, no npm, no bundler — all JS is vanilla and loaded directly.

---

## Interaction guide

| Action | Effect |
|---|---|
| **Drag the block** along the slope | Sets spring compression `x`; forces update instantly |
| **Release** (pointer-up or Release button) | Starts RK4 animation; position plot records `x(t)` |
| **Reset position** | Returns block to equilibrium `x_eq`; clears plot |
| **Reset all parameters** | Restores factory defaults |
| **Sliders** | Recompute everything live; safe to adjust mid-drag |
| **Stiction band** toggle | Shows the range of `x` where friction can hold the block |
| **Decompose weight** toggle | Adds `mg sinθ` / `mg cosθ` component arrows |

---

## Dependencies

| Library | Version | Purpose |
|---|---|---|
| Flask | ≥ 3.0 | Backend server / template rendering |
| KaTeX | 0.16.9 (CDN) | Fast LaTeX equation rendering |

No other dependencies. KaTeX is loaded from jsDelivr CDN; if you need offline use, download it and update the `<link>` / `<script>` tags in `index.html`.
