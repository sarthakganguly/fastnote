from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS

# Centralized extension registry to avoid circular imports
db = SQLAlchemy()
migrate = Migrate()
cors = CORS()