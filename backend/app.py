from flask import Flask, send_from_directory, render_template
import os

app = Flask(
    __name__,
    template_folder=os.path.join(os.path.dirname(__file__), '../frontend/templates'),
    static_folder=os.path.join(os.path.dirname(__file__), '../frontend/static'),
)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/static/<path:path>')
def static_files(path):
    return send_from_directory(app.static_folder, path)


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(debug=True, port=port)
