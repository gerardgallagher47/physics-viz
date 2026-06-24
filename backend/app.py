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


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(debug=True, port=port)
