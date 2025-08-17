from .database import db
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy.orm import relationship

class User(db.Model):
    """
    User model for storing user information and credentials.
    """
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    
    # This relationship links a user to their notes.
    # `cascade="all, delete-orphan"` means if a user is deleted, all their notes are also deleted.
    notes = relationship('Note', backref='author', lazy=True, cascade="all, delete-orphan")

    def set_password(self, password):
        """Creates a hashed password."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Checks if the provided password matches the stored hash."""
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f'<User {self.username}>'

class Note(db.Model):
    """
    Note model for storing note content and details.
    """
    __tablename__ = 'notes'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False, default="Untitled")
    content = db.Column(db.Text, nullable=False, default="")
    # The 'type' field will distinguish between 'markdown' and 'excalidraw' notes.
    type = db.Column(db.String(20), nullable=False, default='markdown')
    
    # This establishes the many-to-one relationship with the User model.
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    def to_dict(self):
        """Serializes the Note object into a dictionary."""
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'type': self.type,
            'user_id': self.user_id
        }

    def __repr__(self):
        return f'<Note {self.title}>'