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


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(debug=True, port=port)
