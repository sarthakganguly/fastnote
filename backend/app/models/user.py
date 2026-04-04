from app.extensions import db
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy.orm import relationship
import datetime

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256), nullable=False)
    
    # NEW: Robust Subscription Tracking
    subscription_status = db.Column(db.String(20), default='free') # 'free', 'trialing', 'active', 'expired', 'canceled'
    dodo_customer_id = db.Column(db.String(100), nullable=True)
    subscription_id = db.Column(db.String(100), nullable=True)
    trial_ends_at = db.Column(db.DateTime, nullable=True)
    
    notes = relationship('Note', backref='author', lazy=True, cascade="all, delete-orphan")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)