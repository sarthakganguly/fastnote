from app.models.note import Note
from app.extensions import db
from app.core.exceptions import APIException
import logging
import datetime

logger = logging.getLogger(__name__)

class NoteService:
    """Handles all note-related business logic."""

    @staticmethod
    def get_all(user_id, page=1, per_page=20, search_term=None):
        query = Note.query.filter_by(user_id=user_id)
        
        # If a search term exists, filter the title (case-insensitive)
        if search_term:
            query = query.filter(Note.title.ilike(f'%{search_term}%'))
            
        # Error_out=False prevents crashing if a user requests a page past the limit
        pagination = query.order_by(Note.id.desc()).paginate(page=page, per_page=per_page, error_out=False)
        
        return {
            'notes': [note.to_dict() for note in pagination.items],
            'total_pages': pagination.pages,
            'current_page': pagination.page,
            'has_next': pagination.has_next
        }

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

    @staticmethod
    def sync_notes(user, data): 
        # 1. NEW: Hard guard at the service layer
        allowed_statuses = ['active', 'trialing']
        if user.subscription_status not in allowed_statuses:
            raise APIException(f"Sync denied. Account status: {user.subscription_status}", 403)

        upserts = data.get('upserts', [])
        deletes = data.get('deletes', [])

        # 2. Process Deletions
        if deletes:
            Note.query.filter(Note.id.in_(deletes), Note.user_id == user.id).delete(synchronize_session=False)

        # 3. Process Upserts
        for note_data in upserts:
            note_id = note_data.get('id')
            client_updated_str = note_data.get('updatedAt')
            
            if not note_id or not client_updated_str:
                continue

            try:
                client_updated_at = datetime.datetime.fromisoformat(client_updated_str.replace('Z', '+00:00')).replace(tzinfo=None)
            except ValueError:
                continue 

            existing_note = Note.query.filter_by(id=note_id, user_id=user.id).first()

            if existing_note:
                if not existing_note.updated_at or client_updated_at > existing_note.updated_at:
                    existing_note.title = note_data.get('title', existing_note.title)
                    existing_note.content = note_data.get('content', existing_note.content)
                    existing_note.type = note_data.get('type', existing_note.type)
                    existing_note.updated_at = client_updated_at
            else:
                new_note = Note(
                    id=note_id,
                    title=note_data.get('title', 'Untitled'),
                    content=note_data.get('content', ''),
                    type=note_data.get('type', 'markdown'),
                    user_id=user.id, 
                    updated_at=client_updated_at
                )
                db.session.add(new_note)

        db.session.commit()
        return {'message': 'Sync successful'}