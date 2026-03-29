from app.extensions import db

class Note(db.Model):
    __tablename__ = 'notes'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False, default="Untitled")
    content = db.Column(db.Text, nullable=False, default="")
    type = db.Column(db.String(20), nullable=False, default='markdown')
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'type': self.type,
            'user_id': self.user_id
        }