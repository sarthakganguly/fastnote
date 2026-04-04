from app.models.user import User
from app.extensions import db
from app.core.exceptions import APIException
from app.core.security import generate_token
import logging

logger = logging.getLogger(__name__)

class AuthService:
    """Handles all authentication business logic."""
    
    @staticmethod
    def signup(username, password):
        if not username or not password:
            raise APIException('Username and password are required', 400)

        if User.query.filter_by(username=username).first():
            raise APIException('Username already exists', 409)

        user = User(username=username)
        user.set_password(password)
        
        db.session.add(user)
        db.session.commit()
        
        logger.info(f"New user registered: {username}")
        return {'message': 'User created successfully'}

    @staticmethod
    def login(username, password):
        if not username or not password:
            raise APIException('Username and password are required', 400)

        user = User.query.filter_by(username=username).first()

        if not user or not user.check_password(password):
            logger.warning(f"Failed login attempt for: {username}")
            raise APIException('Invalid username or password', 401)

        token = generate_token(user.id, user.username)
        logger.info(f"User logged in: {username}")
        
        return {
            'token': token,
            'user': {'id': user.id, 'username': user.username, 'subscription_status': user.subscription_status}
        }