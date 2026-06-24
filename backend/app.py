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
                "id":          "statics-incline",
                "title":       "1 · Forces on an Incline",
                "description": "Start here. A clean free-body diagram of a block on a slope — tilt it up and watch friction lose to gravity at tanθ = μₛ. No spring, no clutter.",
                "url":         "/viz/statics-incline",
                "available":   True,
                "tags":        ["friction", "FBD", "equilibrium", "incline"],
            },
            {
                "id":          "statics-spring",
                "title":       "2 · Spring & Damped Oscillation",
                "description": "Add a spring and damping. Drag the block to compress it, release, and watch it ring down to equilibrium with a live position-vs-time trace.",
                "url":         "/viz/statics-spring",
                "available":   True,
                "tags":        ["spring", "damping", "oscillation", "SHM"],
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
                "id":          "fluid-bernoulli",
                "title":       "1 · Bernoulli's Principle",
                "description": "Start here. Pressure, motion and height as one energy budget along a streamline — three coloured bars that always sum to the same total head.",
                "url":         "/viz/fluid-bernoulli",
                "available":   True,
                "tags":        ["Bernoulli", "energy", "pressure", "streamline"],
            },
            {
                "id":          "fluid-venturi",
                "title":       "2 · Venturi Effect",
                "description": "Continuity meets Bernoulli. Pinch the pipe and watch the throat speed triple while a live pressure profile sags exactly where it narrows.",
                "url":         "/viz/fluid-venturi",
                "available":   True,
                "tags":        ["continuity", "venturi", "pressure", "flow"],
            },
            {
                "id":          "fluid-wing",
                "title":       "3 · Wing & Lift",
                "description": "Bernoulli on an airfoil: a colour-coded pressure field, streamlines, and lift/drag arrows that scale with free-stream speed and reveal the L/D ratio.",
                "url":         "/viz/fluid-wing",
                "available":   True,
                "tags":        ["lift", "drag", "airfoil", "pressure", "L/D"],
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


@app.route('/viz/statics-incline')
def viz_statics_incline():
    return render_template('viz/statics_incline.html')


@app.route('/viz/statics-spring')
def viz_statics_spring():
    return render_template('viz/statics_spring.html')


@app.route('/viz/fluid-bernoulli')
def viz_fluid_bernoulli():
    return render_template('viz/fluid_bernoulli.html')


@app.route('/viz/fluid-venturi')
def viz_fluid_venturi():
    return render_template('viz/fluid_venturi.html')


@app.route('/viz/fluid-wing')
def viz_fluid_wing():
    return render_template('viz/fluid_wing.html')


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
