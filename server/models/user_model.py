from config.database import db
from datetime import datetime

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    avatar_url = db.Column(db.String(256))
    display_name = db.Column(db.String(120))
    gender = db.Column(db.String(16))
    birthdate = db.Column(db.Date)
    phone_number = db.Column(db.String(32))
    status = db.Column(db.String(32), default='offline')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<User {self.username}>'
