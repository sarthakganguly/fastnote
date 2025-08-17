import os
from flask import Flask
from flask_cors import CORS
from flask_migrate import Migrate

# Import from our application modules
from .database import db, init_db
from .models import User, Note # Must be imported for Flask-Migrate to see the models
from .api.auth import auth_bp
from .api.notes import notes_bp # We will create this in the next step

def create_app():
    """
    Application factory function. Creates and configures the Flask app.
    This pattern is useful for testing and creating multiple instances of the app.
    """
    app = Flask(__name__, instance_relative_config=True)

    # --- Configuration ---
    # SECRET_KEY is crucial for security (signing sessions, JWTs, etc.)
    # In a real production app, this should ALWAYS be loaded from an environment variable
    # and should be a long, cryptographically random string.
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'a-super-secret-key-for-dev-only')

    # Ensure the instance folder exists. Flask will store the SQLite DB here.
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass

    # --- Initialize Extensions ---

    # Initialize the database with the app
    init_db(app)

    # Initialize Flask-Migrate. This tool helps with database schema changes.
    # After changing models.py, you can run `flask db migrate` and `flask db upgrade`.
    migrate = Migrate(app, db)

    # Enable Cross-Origin Resource Sharing (CORS).
    # This is essential to allow our React frontend (running on localhost:3000)
    # to make API requests to this backend (running on localhost:5000).
    CORS(app, resources={r"/api/*": {"origins": "*"}}) # For development, allow all origins.

    # --- Register Blueprints ---
    # Blueprints are Flask's way of organizing groups of related routes.
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(notes_bp, url_prefix='/api/notes')

    # --- A simple route to check if the server is up ---
    @app.route('/')
    def index():
        return "Fastnote backend is running correctly."

    return app

# Create an instance of the app for Gunicorn to use.
# The command in the Dockerfile `gunicorn ... app.main:app` looks for this 'app' variable.
app = create_app()