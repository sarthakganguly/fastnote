import jwt
from functools import wraps
from flask import Blueprint, request, jsonify, current_app, g
from ..models import User, Note
from ..database import db

# Create a Blueprint for note-related routes
notes_bp = Blueprint('notes_bp', __name__)

# --- Token Verification Decorator ---
def token_required(f):
    """
    A decorator to ensure that a valid JWT is present in the request header.
    It retrieves the user associated with the token and makes it available via Flask's 'g' object.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        # Check for 'Authorization' header
        if 'Authorization' in request.headers:
            # The header is expected to be in the format "Bearer <token>"
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]
            except IndexError:
                return jsonify({'message': 'Malformed Authorization header'}), 401

        if not token:
            return jsonify({'message': 'Token is missing'}), 401

        try:
            # Decode the token using the app's secret key
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
            # Find the user and attach it to the request's global context ('g')
            current_user = User.query.get(data['user_id'])
            if not current_user:
                return jsonify({'message': 'User not found'}), 401
            g.current_user = current_user
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Token is invalid'}), 401

        return f(*args, **kwargs)
    return decorated

# --- API Routes for Notes ---

@notes_bp.route('/', methods=['GET'])
@token_required
def get_all_notes():
    """Fetches all notes for the authenticated user."""
    user = g.current_user
    notes = Note.query.filter_by(user_id=user.id).order_by(Note.id.desc()).all()
    return jsonify([note.to_dict() for note in notes]), 200

@notes_bp.route('/', methods=['POST'])
@token_required
def create_note():
    """Creates a new note for the authenticated user."""
    data = request.get_json()
    user = g.current_user

    new_note = Note(
        title=data.get('title', 'Untitled'),
        content=data.get('content', ''),
        type=data.get('type', 'markdown'),
        author=user
    )
    db.session.add(new_note)
    db.session.commit()
    return jsonify(new_note.to_dict()), 201

@notes_bp.route('/<int:note_id>', methods=['GET'])
@token_required
def get_note(note_id):
    """Fetches a single note by its ID."""
    user = g.current_user
    note = Note.query.filter_by(id=note_id, user_id=user.id).first()
    if not note:
        return jsonify({'message': 'Note not found or access denied'}), 404
    return jsonify(note.to_dict()), 200

@notes_bp.route('/<int:note_id>', methods=['PUT'])
@token_required
def update_note(note_id):
    """Updates a note's title or content."""
    user = g.current_user
    note = Note.query.filter_by(id=note_id, user_id=user.id).first()
    if not note:
        return jsonify({'message': 'Note not found or access denied'}), 404

    data = request.get_json()
    note.title = data.get('title', note.title)
    note.content = data.get('content', note.content)
    db.session.commit()
    return jsonify(note.to_dict()), 200

@notes_bp.route('/<int:note_id>', methods=['DELETE'])
@token_required
def delete_note(note_id):
    """Deletes a note."""
    user = g.current_user
    note = Note.query.filter_by(id=note_id, user_id=user.id).first()
    if not note:
        return jsonify({'message': 'Note not found or access denied'}), 404

    db.session.delete(note)
    db.session.commit()
    return jsonify({'message': 'Note deleted successfully'}), 200

@notes_bp.route('/export', methods=['GET'])
@token_required
def export_notes():
    """Exports all user's notes as a JSON object."""
    user = g.current_user
    notes = Note.query.filter_by(user_id=user.id).all()
    notes_data = [{'title': n.title, 'content': n.content, 'type': n.type} for n in notes]
    return jsonify(notes_data), 200

@notes_bp.route('/import', methods=['POST'])
@token_required
def import_notes():
    """Imports a list of notes from a JSON payload."""
    user = g.current_user
    notes_data = request.get_json()

    if not isinstance(notes_data, list):
        return jsonify({'message': 'Invalid data format. Expected a list of notes.'}), 400

    for note_item in notes_data:
        new_note = Note(
            title=note_item.get('title', 'Imported Note'),
            content=note_item.get('content', ''),
            type=note_item.get('type', 'markdown'),
            author=user
        )
        db.session.add(new_note)

    db.session.commit()
    return jsonify({'message': f'{len(notes_data)} notes imported successfully'}), 201