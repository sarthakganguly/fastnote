import os

class Config:
    """Base Configuration via Environment Variables (12-Factor App)"""
    BASE_DIR = os.path.abspath(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
    
    # Security
    SECRET_KEY = os.environ.get('SECRET_KEY', 'change-this-in-production')
    
    # Database (Default to /app/data inside Docker)
    DEFAULT_DB_PATH = os.path.join(BASE_DIR, 'data', 'fastnote.db')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', f'sqlite:///{DEFAULT_DB_PATH}')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Observability
    LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO').upper()