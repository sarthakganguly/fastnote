# app/__init__.py (Corrected and Final Version)

import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager

db = SQLAlchemy()
login_manager = LoginManager()

def create_app():
    """Create and configure an instance of the Flask application."""
    # --- THIS IS THE FIX ---
    # We now explicitly tell Flask where to find the templates folder.
    app = Flask(
        __name__,
        instance_relative_config=True,
        static_folder='../static',
        template_folder='../templates'
    )
    
    # --- Configuration ---
    app.config['SECRET_KEY'] = 'a_very_secret_key'
    instance_path = os.path.join(app.root_path, '..', 'instance')
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{os.path.join(instance_path, "app.db")}'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # --- Initialize Extensions ---
    db.init_app(app)
    login_manager.init_app(app)
    login_manager.login_view = 'main.login'

    from .models import User

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    # --- Register Blueprints ---
    from . import main
    from . import api
    app.register_blueprint(main.main_bp)
    app.register_blueprint(api.api_bp)

    # --- Define CLI Commands directly on the app ---
    @app.cli.command("init-db")
    def init_db_command():
        """Create all database tables."""
        if not os.path.exists(instance_path):
            os.makedirs(instance_path)
        db.create_all()
        print("Database tables created successfully.")

    return app