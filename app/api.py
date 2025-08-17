# app/api.py
import re
import json
from datetime import datetime
from flask import Blueprint, request, jsonify, Response
from flask_login import login_required, current_user
from sqlalchemy import and_, or_
import markdown2
from .models import Note
from . import db

api_bp = Blueprint('api', __name__, url_prefix='/api')

def parse_tags_from_string(tag_string):
    """Parses a string from the input form, accepting only '#tag' formats."""
    if not tag_string:
        return ""
    valid_tags = [
        part.strip()[1:]
        for part in tag_string.split(',')
        if part.strip().startswith('#') and len(part.strip()) > 1
    ]
    return ','.join(valid_tags)

@api_bp.route('/note', methods=['POST'])
@login_required
def create_note():
    """Creates a new note or diagram from a JSON payload."""
    data = request.get_json()
    note_type = data.get('note_type', 'markdown')
    tags_str = data.get('tags', '')
    cleaned_tags = parse_tags_from_string(tags_str)

    new_note = Note(
        title=f"{datetime.now().strftime('%Y-%m-%d')}-{cleaned_tags}",
        user_id=current_user.id,
        tags=cleaned_tags,
        note_type=note_type
    )

    if note_type == 'excalidraw':
        new_note.excalidraw_json = data.get('excalidraw_json')
        new_note.html_content = data.get('svg_content') # Store SVG in html_content
    else: # Default to markdown
        content = data.get('content', '')
        new_note.markdown_content = content
        new_note.html_content = markdown2.markdown(content)

    db.session.add(new_note)
    db.session.commit()
    return jsonify(new_note.to_dict()), 201

@api_bp.route('/note/<int:note_id>', methods=['PUT'])
@login_required
def update_note(note_id):
    """Updates an existing note or diagram."""
    note = Note.query.get_or_404(note_id)
    if note.author != current_user: return jsonify({"error": "Unauthorized"}), 403

    data = request.get_json()
    tags_str = data.get('tags', '')
    cleaned_tags = parse_tags_from_string(tags_str)

    note.tags = cleaned_tags
    note.title = f"{note.created_at.strftime('%Y-%m-%d')}-{cleaned_tags}"
    
    if note.note_type == 'excalidraw':
        note.excalidraw_json = data.get('excalidraw_json')
        note.html_content = data.get('svg_content')
    else:
        content = data.get('content', '')
        note.markdown_content = content
        note.html_content = markdown2.markdown(content, extras=["break-on-newline"])

        
    db.session.commit()
    return jsonify(note.to_dict())

@api_bp.route('/note/<int:note_id>', methods=['GET'])
@login_required
def get_note_details(note_id):
    """Gets the full details of a single note for viewing or editing."""
    note = Note.query.get_or_404(note_id)
    if note.author != current_user: return jsonify({"error": "Unauthorized"}), 403
    
    return jsonify({
        'id': note.id,
        'note_type': note.note_type,
        'tags': note.tags,
        'markdown_content': note.markdown_content,
        'html_content': note.html_content,
        'excalidraw_json': note.excalidraw_json
    })

@api_bp.route('/note/<int:note_id>', methods=['DELETE'])
@login_required
def delete_note_api(note_id):
    """Deletes a note."""
    note = Note.query.get_or_404(note_id)
    if note.author != current_user: return jsonify({"error": "Unauthorized"}), 403
    db.session.delete(note)
    db.session.commit()
    return jsonify({"success": True})
    
@api_bp.route('/search')
@login_required
def search_notes():
    query_str = request.args.get('q', '')
    base_query = Note.query.filter_by(user_id=current_user.id)
    tags_and = [t.strip() for t in re.findall(r'#(\w+)', query_str)]
    or_groups = re.findall(r'OR\((.*?)\)', query_str)
    text_query_str = re.sub(r'#\w+|OR\(.*?\)', '', query_str).strip(' ,')
    filters = []
    if text_query_str: filters.append(Note.markdown_content.like(f"%{text_query_str}%"))
    for tag in tags_and: filters.append(Note.tags.like(f"%{tag}%"))
    if or_groups:
        for group in or_groups:
            or_tags = [t.strip().replace('#', '') for t in group.split(',')]
            filters.append(or_(*[Note.tags.like(f"%{t}%") for t in or_tags]))
    final_query = base_query.filter(and_(*filters)) if filters else base_query
    return jsonify([note.to_dict() for note in final_query.order_by(Note.created_at.desc()).all()])

@api_bp.route('/download')
@login_required
def download_notes():
    """Exports all of the user's notes to a single JSON file."""
    notes = Note.query.filter_by(user_id=current_user.id).order_by(Note.created_at.asc()).all()
    notes_for_export = []
    for note in notes:
        content = note.markdown_content if note.note_type == 'markdown' else note.html_content
        notes_for_export.append({
            "noteCreatedDate": note.created_at.isoformat(),
            "noteUpdatedDate": note.updated_at.isoformat(),
            "noteContent": content,
            "noteTags": note.tags.split(',') if note.tags else []
        })
    response_json = json.dumps(notes_for_export, indent=2)
    return Response(response_json, mimetype='application/json', headers={'Content-Disposition': 'attachment;filename=fastnote_export.json'})

@api_bp.route('/tags')
@login_required
def get_all_tags():
    notes = Note.query.filter_by(user_id=current_user.id).all()
    all_tags = set()
    for note in notes:
        if note.tags: all_tags.update([t.strip() for t in note.tags.split(',')])
    return jsonify(sorted(list(all_tags)))