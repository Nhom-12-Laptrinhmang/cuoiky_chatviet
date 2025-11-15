from models.user_model import User
from config.database import db
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
from flask import current_app

blacklist = set()

def register_user(username, password, display_name=None):
    if User.query.filter_by(username=username).first():
        return {'success': False, 'error': 'Username already exists'}
    password_hash = generate_password_hash(password)
    user = User(username=username, password_hash=password_hash, display_name=(display_name or username))
    db.session.add(user)
    db.session.commit()
    return {'success': True, 'message': 'User registered'}

def login_user(username, password):
    user = User.query.filter_by(username=username).first()
    if not user or not check_password_hash(user.password_hash, password):
        return {'success': False, 'error': 'Invalid credentials'}
    payload = {
        'user_id': user.id,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }
    token = jwt.encode(payload, current_app.config['JWT_SECRET_KEY'], algorithm='HS256')
    return {'success': True, 'token': token}

def create_token_for_user(user, hours=24):
    """Create a JWT token for a given User model instance."""
    payload = {
        'user_id': user.id,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=hours)
    }
    token = jwt.encode(payload, current_app.config['JWT_SECRET_KEY'], algorithm='HS256')
    return token

def decode_token(token):
    try:
        payload = jwt.decode(token, current_app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
        if is_token_blacklisted(token):
            return None
        return payload
    except Exception:
        return None

def logout_user(token):
    blacklist.add(token)
    return {'success': True, 'message': 'Logged out'}

def is_token_blacklisted(token):
    return token in blacklist
