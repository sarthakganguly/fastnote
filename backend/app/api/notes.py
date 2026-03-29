from flask import Blueprint, request, jsonify, g
from app.core.security import token_required
from app.services.note_service import NoteService

notes_bp = Blueprint('notes_bp', __name__)

@notes_bp.route('/', methods=['GET'])
@token_required
def get_all_notes():
    return jsonify(NoteService.get_all(g.current_user.id)), 200

@notes_bp.route('/', methods=['POST'])
@token_required
def create_note():
    data = request.get_json() or {}
    return jsonify(NoteService.create(g.current_user.id, data)), 201

@notes_bp.route('/<int:note_id>', methods=['GET'])
@token_required
def get_note(note_id):
    note = NoteService.get_by_id(g.current_user.id, note_id)
    return jsonify(note.to_dict()), 200

@notes_bp.route('/<int:note_id>', methods=['PUT'])
@token_required
def update_note(note_id):
    data = request.get_json() or {}
    return jsonify(NoteService.update(g.current_user.id, note_id, data)), 200

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
    data = request.get_json() or[]
    return jsonify(NoteService.import_notes(g.current_user.id, data)), 201