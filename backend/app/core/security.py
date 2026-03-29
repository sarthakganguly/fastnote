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
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }
    return jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm="HS256")

def token_required(f):
    """Decorator to enforce valid JWT presence."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            try:
                token = request.headers['Authorization'].split(" ")[1]
            except IndexError:
                raise APIException('Malformed Authorization header', 401)

        if not token:
            raise APIException('Authentication token is missing', 401)

        try:
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = User.query.get(data['user_id'])
            if not current_user:
                raise APIException('User associated with token no longer exists', 401)
            g.current_user = current_user
        except jwt.ExpiredSignatureError:
            raise APIException('Token has expired', 401)
        except jwt.InvalidTokenError:
            raise APIException('Token is invalid', 401)

        return f(*args, **kwargs)
    return decorated