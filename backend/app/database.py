import os
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

def init_db(app):
    """
    Initializes the database.
    Crucially, it only creates tables if the database file does not exist.
    """
    db_path = os.path.join(app.instance_path, 'data')
    os.makedirs(db_path, exist_ok=True)
    
    db_file = os.path.join(db_path, 'fastnote.db')
    
    app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{db_file}"
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)

    # Check if the database file already exists.
    # If it doesn't, create the tables within an app context.
    if not os.path.exists(db_file):
        with app.app_context():
            print("Database file not found, creating all tables.")
            db.create_all()
            print("Tables created.")