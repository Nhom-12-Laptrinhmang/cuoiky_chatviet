from config.database import db
from datetime import datetime


class Contact(db.Model):
    """Phone contact for a user — migrated from contact_sync.contacts_json."""
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    phone_number = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'phone_number': self.phone_number,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
