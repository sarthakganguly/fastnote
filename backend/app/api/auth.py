import jwt
import datetime
from flask import Blueprint, request, jsonify, current_app
from ..models import User
from ..database import db

# Create a Blueprint for authentication routes
auth_bp = Blueprint('auth_bp', __name__)

@auth_bp.route('/signup', methods=['POST'])
def signup():
    """
    User registration route.
    Expects JSON payload with 'username' and 'password'.
    """
    data = request.get_json()
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'message': 'Username and password are required'}), 400

    username = data['username']
    password = data['password']

    # Check if user already exists
    if User.query.filter_by(username=username).first():
        return jsonify({'message': 'Username already exists'}), 409 # 409 Conflict

    # Create new user
    new_user = User(username=username)
    new_user.set_password(password)
    
    # Add to database
    db.session.add(new_user)
    db.session.commit()

    return jsonify({'message': 'User created successfully'}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    User login route.
    Authenticates user and returns a JWT.
    """
    data = request.get_json()
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'message': 'Username and password are required'}), 400

    user = User.query.filter_by(username=data['username']).first()

    # Check if user exists and password is correct
    if not user or not user.check_password(data['password']):
        return jsonify({'message': 'Invalid username or password'}), 401

    # Generate JWT
    token = jwt.encode({
        'user_id': user.id,
        # Token expires in 24 hours
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }, current_app.config['SECRET_KEY'], algorithm="HS256")

    return jsonify({
        'token': token,
        'user': {
            'id': user.id,
            'username': user.username
        }
    }), 200