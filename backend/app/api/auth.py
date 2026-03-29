from flask import Blueprint, request, jsonify, make_response
from app.services.auth_service import AuthService
from app.core.security import token_required

auth_bp = Blueprint('auth_bp', __name__)

@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.get_json() or {}
    response_data = AuthService.signup(data.get('username'), data.get('password'))
    
    # Extract the token so it doesn't get sent in the readable JSON body
    token = response_data.pop('token', None)
    
    resp = make_response(jsonify(response_data), 201)
    if token:
        resp.set_cookie(
            'access_token', 
            token, 
            httponly=True, 
            samesite='Strict', # Protects against CSRF
            max_age=24*60*60   # 24 hours in seconds
        )
    return resp

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    response_data = AuthService.login(data.get('username'), data.get('password'))
    
    # Extract the token
    token = response_data.pop('token', None)
    
    resp = make_response(jsonify(response_data), 200)
    if token:
        resp.set_cookie(
            'access_token', 
            token, 
            httponly=True, 
            samesite='Strict',
            max_age=24*60*60
        )
    return resp

@auth_bp.route('/logout', methods=['POST'])
def logout():
    # To log a user out, we overwrite the cookie with an expired one
    resp = make_response(jsonify({'message': 'Logged out successfully'}), 200)
    resp.set_cookie('access_token', '', expires=0, httponly=True)
    return resp

@auth_bp.route('/me', methods=['GET'])
@token_required
def get_current_user():
    # If the @token_required decorator passes, it means the HttpOnly cookie 
    # is valid and it attached the user to the Flask 'g' object.
    return jsonify({
        'id': g.current_user.id,
        'username': g.current_user.username
    }), 200