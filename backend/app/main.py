import os
from flask import Flask
from app.core.config import Config
from app.core.logger import setup_logging
from app.core.exceptions import register_error_handlers
# REMOVED 'cors' from imports
from app.extensions import db, migrate

def create_app(config_class=Config):
    setup_logging(config_class.LOG_LEVEL)
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    migrate.init_app(app, db)
    
    # REMOVED: cors.init_app(app, resources={r"/api/*": {"origins": "*"}})

    register_error_handlers(app)

    from app.api.auth import auth_bp
    from app.api.notes import notes_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(notes_bp, url_prefix='/api/notes')

    # Ensure the directory for the SQLite database exists
    db_uri = app.config['SQLALCHEMY_DATABASE_URI']
    if db_uri.startswith('sqlite:///'):
        db_path = db_uri.replace('sqlite:///', '')
        os.makedirs(os.path.dirname(db_path), exist_ok=True)

    return app

app = create_app()