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

    # Relationships
    # Friends (outgoing)
    friend_relations = db.relationship('Friend', foreign_keys='Friend.user_id', backref='user', cascade='all, delete-orphan')
    # Friends (incoming)
    friend_of_relations = db.relationship('Friend', foreign_keys='Friend.friend_id', backref='friend_user', cascade='all, delete-orphan')
    
    # Groups owned
    owned_groups = db.relationship('Group', foreign_keys='Group.owner_id', backref='owner', cascade='all, delete-orphan')
    
    # Group memberships
    group_memberships = db.relationship('GroupMember', backref='user_member', cascade='all, delete-orphan')
    
    # Message reactions
    reactions = db.relationship('MessageReaction', backref='user_reaction', cascade='all, delete-orphan')
    
    # Blocks outgoing
    blocks_made = db.relationship('Block', foreign_keys='Block.user_id', backref='blocker', cascade='all, delete-orphan')
    
    # Blocks incoming
    blocks_received = db.relationship('Block', foreign_keys='Block.target_id', backref='blocked_user', cascade='all, delete-orphan')
    
    # Contacts (phone numbers)
    contacts = db.relationship('Contact', backref='user_owner', cascade='all, delete-orphan')

    def __repr__(self):
        return f'<User {self.username}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'display_name': self.display_name,
            'avatar_url': self.avatar_url,
            'status': self.status,
            'gender': self.gender,
            'birthdate': self.birthdate.isoformat() if self.birthdate else None,
            'phone_number': self.phone_number,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
