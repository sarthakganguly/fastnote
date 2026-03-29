from flask import Blueprint, request, jsonify, g
from marshmallow import ValidationError
from app.core.security import token_required
from app.services.note_service import NoteService
from app.schemas.note import note_schema

notes_bp = Blueprint('notes_bp', __name__)

@notes_bp.route('/', methods=['GET'])
@token_required
def get_all_notes():
    # Grab query parameters, setting safe defaults
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    search = request.args.get('search', '', type=str)
    
    return jsonify(NoteService.get_all(g.current_user.id, page, per_page, search)), 200

@notes_bp.route('/', methods=['POST'])
@token_required
def create_note():
    json_data = request.get_json() or {}
    
    try:
        # Validate the incoming data against our strict schema
        valid_data = note_schema.load(json_data)
    except ValidationError as err:
        # If it fails, return the exact fields that failed and a 400 status
        return jsonify({"message": "Validation failed", "errors": err.messages}), 400

    return jsonify(NoteService.create(g.current_user.id, valid_data)), 201

@notes_bp.route('/<int:note_id>', methods=['GET'])
@token_required
def get_note(note_id):
    note = NoteService.get_by_id(g.current_user.id, note_id)
    return jsonify(note.to_dict()), 200

@notes_bp.route('/<int:note_id>', methods=['PUT'])
@token_required
def update_note(note_id):
    json_data = request.get_json() or {}
    
    try:
        # partial=True means the frontend can send JUST the title to update it, 
        # without having to send the entire content and type all over again.
        valid_data = note_schema.load(json_data, partial=True)
    except ValidationError as err:
        return jsonify({"message": "Validation failed", "errors": err.messages}), 400

    return jsonify(NoteService.update(g.current_user.id, note_id, valid_data)), 200

@notes_bp.route('/<int:note_id>', methods=['DELETE'])
@token_required
def delete_note(note_id):
    return jsonify(NoteService.delete(g.current_user.id, note_id)), 200

@notes_bp.route('/export', methods=['GET'])
@token_required
def export_notes():
    notes = NoteService.get_all(g.current_user.id)
    export_data = [{'title': n['title'], 'content': n['content'], 'type': n['type']} for n in notes]
    return jsonify(export_data), 200

@notes_bp.route('/import', methods=['POST'])
@token_required
def import_notes():
    data = request.get_json() or []
    # Note: For production, you would also want to loop through and validate 
    # 'data' against note_schema(many=True) before importing!
    return jsonify(NoteService.import_notes(g.current_user.id, data)), 201