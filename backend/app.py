from flask import Flask, render_template
import os

app = Flask(
    __name__,
    template_folder=os.path.join(os.path.dirname(__file__), '../frontend/templates'),
    static_folder=os.path.join(os.path.dirname(__file__), '../frontend/static'),
)

# Each entry here becomes a card on the home page.
# Set "available": True only when the viz is built.
CATEGORIES = [
    {
        "id":          "statics",
        "title":       "Statics",
        "description": "Forces in equilibrium on inclined planes, springs, and friction.",
        "problems": [
            {
                "id":          "block-on-slope",
                "title":       "Block on Slope — Spring & Friction",
                "description": "Drag the block, watch every force resolve live. Explore the stiction band, release for damped oscillation.",
                "url":         "/viz/block-on-slope",
                "available":   True,
                "tags":        ["friction", "spring", "FBD", "equilibrium"],
            },
        ],
        "icon": "⚖️",
    },
    {
        "id":          "fluid-mechanics",
        "title":       "Fluid Mechanics",
        "description": "Pressure, flow, continuity, and the Bernoulli principle.",
        "problems": [
            {
                "id":          "bernoulli-venturi",
                "title":       "Bernoulli Equation & Venturi Effect",
                "description": "Adjust inlet velocity and watch static pressure drop as fluid accelerates through a constriction. Stacked pressure bars show the Bernoulli constant live.",
                "url":         "/viz/bernoulli-venturi",
                "available":   True,
                "tags":        ["Bernoulli", "continuity", "pressure", "venturi", "flow"],
            },
            {
                "id":          "bernoulli-wing",
                "title":       "Bernoulli — Aircraft Wing & Lift",
                "description": "Air accelerates over the curved upper surface, pressure drops, and a net upward force emerges. Colour-coded pressure field, streamlines, and live lift/drag arrows all scale with free-stream velocity.",
                "url":         "/viz/bernoulli-wing",
                "available":   True,
                "tags":        ["Bernoulli", "lift", "drag", "airfoil", "pressure"],
            },
        ],
        "icon": "💧",
    },
    {
        "id":          "vector-calculus",
        "title":       "Vector Calculus",
        "description": "Curl, divergence, and the theorems of Green and Stokes — seen, not just stated.",
        "problems": [
            {
                "id":          "vc-divergence",
                "title":       "1 · Divergence — Sources & Sinks",
                "description": "Start here. Drag a loop through a field and watch how much flow leaves versus enters. A colour map and a pulsing star reveal where the field has positive or negative divergence.",
                "url":         "/viz/vc-divergence",
                "available":   True,
                "tags":        ["divergence", "flux", "source", "sink"],
            },
            {
                "id":          "vc-curl",
                "title":       "2 · Curl — Local Rotation",
                "description": "A paddle wheel spins at the local curl and a colour map shows clockwise versus counter-clockwise regions. See why even perfectly straight 'shear' flow can have curl.",
                "url":         "/viz/vc-curl",
                "available":   True,
                "tags":        ["curl", "circulation", "rotation", "vorticity"],
            },
            {
                "id":          "vc-greens",
                "title":       "3 · Green's Theorem — Edge = Interior",
                "description": "Combine the basics: the integral around a loop's boundary equals the curl (or divergence) summed over its inside. A subdivision overlay shows why the interior cancels.",
                "url":         "/viz/vc-greens",
                "available":   True,
                "tags":        ["Green's theorem", "circulation", "flux", "boundary"],
            },
            {
                "id":          "vc-stokes",
                "title":       "4 · Stokes' Theorem — Only the Rim Matters",
                "description": "The 3-D leap. Reshape a cap surface over a fixed rim and watch the curl flux through it stay equal to the circulation around the rim — no matter the surface.",
                "url":         "/viz/vc-stokes",
                "available":   True,
                "tags":        ["Stokes", "surface independence", "curl flux", "3D"],
            },
        ],
        "icon": "🌀",
    },
    {
        "id":          "dynamics",
        "title":       "Dynamics",
        "description": "Newton's laws, projectile motion, and energy methods.",
        "problems": [],
        "icon": "🚀",
    },
    {
        "id":          "waves",
        "title":       "Waves & Oscillations",
        "description": "Simple harmonic motion, standing waves, resonance.",
        "problems": [],
        "icon": "〰️",
    },
    {
        "id":          "thermodynamics",
        "title":       "Thermodynamics",
        "description": "Heat engines, PV diagrams, and entropy.",
        "problems": [],
        "icon": "🌡️",
    },
    {
        "id":          "electrostatics",
        "title":       "Electrostatics",
        "description": "Electric fields, Gauss's law, and potential.",
        "problems": [],
        "icon": "⚡",
    },
]


@app.route('/')
def home():
    return render_template('home.html', categories=CATEGORIES)


@app.route('/viz/block-on-slope')
def viz_block_on_slope():
    return render_template('viz/block_on_slope.html')


@app.route('/viz/bernoulli-venturi')
def viz_bernoulli_venturi():
    return render_template('viz/bernoulli_venturi.html')


@app.route('/viz/bernoulli-wing')
def viz_bernoulli_wing():
    return render_template('viz/bernoulli_wing.html')


@app.route('/viz/vc-divergence')
def viz_vc_divergence():
    return render_template('viz/vc_divergence.html')


@app.route('/viz/vc-curl')
def viz_vc_curl():
    return render_template('viz/vc_curl.html')


@app.route('/viz/vc-greens')
def viz_vc_greens():
    return render_template('viz/vc_greens.html')


@app.route('/viz/vc-stokes')
def viz_vc_stokes():
    return render_template('viz/vc_stokes.html')


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(debug=True, port=port)
