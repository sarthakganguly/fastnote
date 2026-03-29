import jwt
import datetime
from functools import wraps
from flask import request, current_app, g
from app.models.user import User
from app.core.exceptions import APIException

def generate_token(user_id: int, username: str) -> str:
    """Generates a JWT valid for 24 hours."""
    payload = {
        'user_id': user_id,
        'username': username,
        'exp': datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=24)
    }
    return jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm="HS256")

def token_required(f):
    """Decorator to enforce valid JWT presence via HttpOnly Cookie."""
    @wraps(f)
    def decorated(*args, **kwargs):
        # NEW: We now extract the token from the cookie
        token = request.cookies.get('access_token')

        if not token:
            raise APIException('Authentication token is missing', 401)

        try:
            from app.extensions import db
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = db.session.get(User, data['user_id'])
            if not current_user:
                raise APIException('User associated with token no longer exists', 401)
            g.current_user = current_user
        except jwt.ExpiredSignatureError:
            raise APIException('Token has expired', 401)
        except jwt.InvalidTokenError:
            raise APIException('Token is invalid', 401)

        return f(*args, **kwargs)
    return decorated