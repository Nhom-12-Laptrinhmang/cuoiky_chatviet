from config.database import db
from datetime import datetime


class Group(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128), nullable=False)
    owner_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    avatar_url = db.Column(db.String(256))
    status = db.Column(db.String(32), default='offline')
    allow_edit_name_avatar = db.Column(db.Boolean, default=True)  # Quyền cho phép đổi tên/avatar
    
    # Relationships
    members = db.relationship('GroupMember', backref='group_obj', cascade='all, delete-orphan')
    messages = db.relationship('Message', foreign_keys='Message.group_id', backref='group_chat', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'owner_id': self.owner_id,
            'avatar_url': self.avatar_url,
            'status': self.status,
            'allow_edit_name_avatar': self.allow_edit_name_avatar,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class GroupMember(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    group_id = db.Column(db.Integer, db.ForeignKey('group.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    role = db.Column(db.String(32), default='member')
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'group_id': self.group_id,
            'user_id': self.user_id,
            'role': self.role,
            'joined_at': self.joined_at.isoformat() if self.joined_at else None,
        }
