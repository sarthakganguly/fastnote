from flask import Blueprint, request, jsonify
from app.services.auth_service import AuthService

auth_bp = Blueprint('auth_bp', __name__)

@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.get_json() or {}
    response = AuthService.signup(data.get('username'), data.get('password'))
    return jsonify(response), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    response = AuthService.login(data.get('username'), data.get('password'))
    return jsonify(response), 200