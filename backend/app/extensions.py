from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

# Centralized extension registry to avoid circular imports
db = SQLAlchemy()
migrate = Migrate()
