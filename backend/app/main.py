import os
from flask import Flask
from app.core.config import Config
from app.core.logger import setup_logging
from app.core.exceptions import register_error_handlers
from app.extensions import db, migrate, cors

def create_app(config_class=Config):
    setup_logging(config_class.LOG_LEVEL)
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    migrate.init_app(app, db)
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}})

    register_error_handlers(app)

    from app.api.auth import auth_bp
    from app.api.notes import notes_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(notes_bp, url_prefix='/api/notes')

    # IMPROVED DB INITIALIZATION
    db_uri = app.config['SQLALCHEMY_DATABASE_URI']
    if db_uri.startswith('sqlite:///'):
        db_path = db_uri.replace('sqlite:///', '')
        os.makedirs(os.path.dirname(db_path), exist_ok=True)

    # Use a try-except block or simply rely on Flask-Migrate in production.
    # For now, let's make it safe for Gunicorn workers.
    with app.app_context():
        try:
            db.create_all()
        except Exception as e:
            # If tables already exist or are being created by another worker, 
            # we log it and continue.
            app.logger.info(f"Database table sync skipped or handled by another process.")

    return app

app = create_app()