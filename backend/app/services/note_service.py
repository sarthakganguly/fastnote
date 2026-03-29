from app.models.note import Note
from app.extensions import db
from app.core.exceptions import APIException
import logging

logger = logging.getLogger(__name__)

class NoteService:
    """Handles all note-related business logic."""

    @staticmethod
    def get_all(user_id):
        notes = Note.query.filter_by(user_id=user_id).order_by(Note.id.desc()).all()
        return[note.to_dict() for note in notes]

    @staticmethod
    def get_by_id(user_id, note_id):
        note = Note.query.filter_by(id=note_id, user_id=user_id).first()
        if not note:
            raise APIException('Note not found or access denied', 404)
        return note

    @staticmethod
    def create(user_id, data):
        new_note = Note(
            title=data.get('title', 'Untitled'),
            content=data.get('content', ''),
            type=data.get('type', 'markdown'),
            user_id=user_id
        )
        db.session.add(new_note)
        db.session.commit()
        logger.info(f"Note created by user {user_id}: ID {new_note.id}")
        return new_note.to_dict()

    @staticmethod
    def update(user_id, note_id, data):
        note = NoteService.get_by_id(user_id, note_id)
        note.title = data.get('title', note.title)
        note.content = data.get('content', note.content)
        db.session.commit()
        return note.to_dict()

    @staticmethod
    def delete(user_id, note_id):
        note = NoteService.get_by_id(user_id, note_id)
        db.session.delete(note)
        db.session.commit()
        logger.info(f"Note deleted by user {user_id}: ID {note_id}")
        return {'message': 'Note deleted successfully'}

    @staticmethod
    def import_notes(user_id, notes_data):
        if not isinstance(notes_data, list):
            raise APIException('Invalid data format. Expected a list of notes.', 400)

        for item in notes_data:
            note = Note(
                title=item.get('title', 'Imported Note'),
                content=item.get('content', ''),
                type=item.get('type', 'markdown'),
                user_id=user_id
            )
            db.session.add(note)

        db.session.commit()
        logger.info(f"User {user_id} imported {len(notes_data)} notes.")
        return {'message': f'{len(notes_data)} notes imported successfully'}