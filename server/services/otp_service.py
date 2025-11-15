import random
from models.user_model import User
from config.database import db
from werkzeug.security import generate_password_hash

# In-memory OTP storage fallback (when Redis is not available)
otp_storage = {}

def send_otp(username):
    import redis
    from flask import current_app
    user = User.query.filter_by(username=username).first()
    if not user:
        return {'success': False, 'error': 'User not found'}
    otp = str(random.randint(100000, 999999))
    
    # Try to use Redis, fallback to in-memory storage
    try:
        r = redis.Redis.from_url(current_app.config['REDIS_URL'])
        r.setex(f'otp:{username}', current_app.config['OTP_EXPIRE_SECONDS'], otp)
        print(f"[OTP] OTP for {username} stored in Redis: {otp}")
    except Exception as e:
        otp_storage[username] = otp
        print(f"[OTP] Redis unavailable, using in-memory storage. OTP for {username}: {otp}")
        print(f"[WARNING] Redis connection failed: {e}")
    
    return {'success': True, 'message': 'OTP sent'}


def _verify_otp(username, otp):
    """Internal helper to verify an OTP. Returns True if valid."""
    import redis
    from flask import current_app
    real_otp = None
    try:
        r = redis.Redis.from_url(current_app.config['REDIS_URL'])
        real_otp = r.get(f'otp:{username}')
        if real_otp:
            real_otp = real_otp.decode()
    except Exception:
        real_otp = otp_storage.get(username)

    return bool(real_otp and otp == real_otp)

def reset_password(username, otp, new_password):
    import redis
    from flask import current_app
    
    # Try to get OTP from Redis first, then fallback to in-memory storage
    real_otp = None
    try:
        r = redis.Redis.from_url(current_app.config['REDIS_URL'])
        real_otp = r.get(f'otp:{username}')
        if real_otp:
            real_otp = real_otp.decode()
    except Exception:
        real_otp = otp_storage.get(username)
    
    if not real_otp or otp != real_otp:
        return {'success': False, 'error': 'Invalid OTP'}
    
    user = User.query.filter_by(username=username).first()
    if not user:
        return {'success': False, 'error': 'User not found'}
    
    user.password_hash = generate_password_hash(new_password)
    db.session.commit()
    
    # Clean up OTP
    try:
        r = redis.Redis.from_url(current_app.config['REDIS_URL'])
        r.delete(f'otp:{username}')
    except Exception:
        if username in otp_storage:
            del otp_storage[username]
    
    return {'success': True, 'message': 'Password reset'}
