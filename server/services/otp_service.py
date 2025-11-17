import random
import logging
from models.user_model import User
from config.database import db
from werkzeug.security import generate_password_hash

# Module logger
logger = logging.getLogger(__name__)

# Try a top-level import so static analyzers (language servers) can resolve
# the `requests` symbol. If it's not available at runtime the helper functions
# will raise a RuntimeError as before.
try:
    import requests  # type: ignore
except Exception:  # pragma: no cover - best-effort import for editor/LS
    requests = None

# In-memory OTP storage fallback (when Redis is not available)
otp_storage = {}

def send_otp(contact, method=None):
    """
    Send OTP to a contact which can be:
    - an existing username (treated as email/username)
    - an email address
    - a phone number

    For now this function will store the OTP in Redis (or in-memory fallback)
    and print the OTP to server logs. If SMTP or Zalo integration is configured
    it can be wired here; currently we just log the delivery method.
    """
    import redis
    from flask import current_app
    # Determine delivery method
    is_email = False
    is_phone = False
    if method == 'email':
        is_email = True
    elif method == 'zalo' or method == 'sms':
        is_phone = True
    else:
        if isinstance(contact, str) and '@' in contact and '.' in contact:
            is_email = True
        else:
            # treat digit-heavy strings as phone numbers
            digits = ''.join([c for c in (contact or '') if c.isdigit()])
            if len(digits) >= 7:
                is_phone = True

    # Try to find a user by username or phone_number
    user = User.query.filter((User.username == contact) | (User.phone_number == contact)).first()
    if not user:
        return {'success': False, 'error': 'User not found'}

    otp = str(random.randint(100000, 999999))

    # Try to use Redis, fallback to in-memory storage
    try:
        r = redis.Redis.from_url(current_app.config['REDIS_URL'])
        r.setex(f'otp:{contact}', current_app.config.get('OTP_EXPIRE_SECONDS', 300), otp)
        # store full OTP at debug level only
        logger.debug("OTP stored in Redis for contact=%s otp=%s", contact, otp)
    except Exception as e:
        otp_storage[contact] = otp
        logger.info("Redis unavailable, using in-memory storage for contact=%s", contact)
        # log the OTP at debug level (so production doesn't leak OTP to info logs)
        logger.debug("OTP for %s: %s", contact, otp)
        logger.exception("Redis connection failed for contact=%s", contact)

    # Delivery: in dev we just print. Hook email/SMS/Zalo here.
    # Attempt real delivery if configuration present
    delivered = False
    try:
        cfg = current_app.config
        # Try SMTP first if configured and email
        if is_email and cfg.get('SMTP_HOST') and cfg.get('SMTP_USER'):
            try:
                send_via_smtp(cfg, contact, otp)
                delivered = True
            except Exception as e:
                logger.exception("[DELIVERY][SMTP] Failed to send to %s", contact)

        # If not delivered and SendGrid configured, try SendGrid
        if is_email and not delivered and cfg.get('SENDGRID_API_KEY'):
            try:
                send_via_sendgrid(cfg.get('SENDGRID_API_KEY'), contact, otp)
                delivered = True
            except Exception as e:
                logger.exception("[DELIVERY][SENDGRID] Failed to send to %s", contact)

        # For phone numbers, try Zalo if configured
        if is_phone and cfg.get('ZALO_ACCESS_TOKEN') and cfg.get('ZALO_OFFICIAL_ACCOUNT_ID'):
            try:
                send_via_zalo(cfg, contact, otp)
                delivered = True
            except Exception as e:
                logger.exception("[DELIVERY][ZALO] Failed to send to %s", contact)
    except Exception:
        delivered = False

    if not delivered:
        # Fallback logging (dev). Log masked OTP at info level and full OTP at debug.
        masked = (otp[:2] + '****') if otp and len(otp) >= 2 else '****'
        if is_email:
            logger.info("Fallback delivery: OTP to email %s masked=%s", contact, masked)
            logger.debug("Fallback delivery full OTP for %s: %s", contact, otp)
        elif is_phone:
            logger.info("Fallback delivery: OTP to phone %s masked=%s", contact, masked)
            logger.debug("Fallback delivery full OTP for %s: %s", contact, otp)
        else:
            logger.info("Fallback delivery: OTP for %s masked=%s", contact, masked)
            logger.debug("Fallback delivery full OTP for %s: %s", contact, otp)

    return {'success': True, 'message': 'OTP sent'}


def _verify_otp(contact, otp):
    """Internal helper to verify an OTP. Returns True if valid."""
    import redis
    from flask import current_app
    real_otp = None
    try:
        r = redis.Redis.from_url(current_app.config['REDIS_URL'])
        real_otp = r.get(f'otp:{contact}')
        if real_otp:
            real_otp = real_otp.decode()
    except Exception:
        real_otp = otp_storage.get(contact)

    return bool(real_otp and otp == real_otp)


def send_via_smtp(cfg, to_email, otp):
    """Send OTP via SMTP (basic). Expects SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in cfg."""
    import smtplib
    from email.message import EmailMessage

    host = cfg.get('SMTP_HOST')
    port = int(cfg.get('SMTP_PORT') or 587)
    user = cfg.get('SMTP_USER')
    password = cfg.get('SMTP_PASS')

    if not host or not user:
        raise RuntimeError('SMTP not configured')

    msg = EmailMessage()
    msg['Subject'] = 'Your OTP code'
    msg['From'] = user
    msg['To'] = to_email
    msg.set_content(f'Your verification code is: {otp}\nThis code expires in {cfg.get("OTP_EXPIRE_SECONDS", 300)} seconds.')

    # Connect and send
    with smtplib.SMTP(host, port, timeout=10) as s:
        s.starttls()
        if password:
            s.login(user, password)
        s.send_message(msg)


def send_via_sendgrid(api_key, to_email, otp):
    """Send via SendGrid Web API (minimal). Requires requests package and SENDGRID_API_KEY."""
    if requests is None:
        raise RuntimeError('requests library required for SendGrid')

    url = 'https://api.sendgrid.com/v3/mail/send'
    payload = {
        'personalizations': [{'to': [{'email': to_email}], 'subject': 'Your OTP code'}],
        'from': {'email': 'no-reply@example.com'},
        'content': [{'type': 'text/plain', 'value': f'Your verification code is: {otp}'}]
    }
    headers = {'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'}
    r = requests.post(url, json=payload, headers=headers, timeout=10)
    if r.status_code not in (200, 202):
        raise RuntimeError(f'SendGrid failed: {r.status_code} {r.text}')


def send_via_zalo(cfg, phone, otp):
    """Send via Zalo Official Account API (placeholder). Requires ZALO_ACCESS_TOKEN and ZALO_OFFICIAL_ACCOUNT_ID in cfg."""
    if requests is None:
        raise RuntimeError('requests library required for Zalo')

    access_token = cfg.get('ZALO_ACCESS_TOKEN')
    oa_id = cfg.get('ZALO_OFFICIAL_ACCOUNT_ID')
    if not access_token or not oa_id:
        raise RuntimeError('Zalo not configured')

    # Zalo OA message send endpoint - simplified example (actual payload depends on Zalo API)
    url = f'https://openapi.zalo.me/v2.0/oa/message?access_token={access_token}'
    payload = {
        'recipient': {'phone': phone},
        'message': {'text': f'Your verification code is: {otp}'}
    }
    headers = {'Content-Type': 'application/json'}
    r = requests.post(url, json=payload, headers=headers, timeout=10)
    if r.status_code != 200:
        raise RuntimeError(f'Zalo send failed: {r.status_code} {r.text}')

def reset_password(contact, otp, new_password):
    import redis
    from flask import current_app

    # Try to get OTP from Redis first, then fallback to in-memory storage
    real_otp = None
    try:
        r = redis.Redis.from_url(current_app.config['REDIS_URL'])
        real_otp = r.get(f'otp:{contact}')
        if real_otp:
            real_otp = real_otp.decode()
    except Exception:
        real_otp = otp_storage.get(contact)

    if not real_otp or otp != real_otp:
        return {'success': False, 'error': 'Invalid OTP'}

    # Find user by username or phone_number
    user = User.query.filter((User.username == contact) | (User.phone_number == contact)).first()
    if not user:
        return {'success': False, 'error': 'User not found'}

    user.password_hash = generate_password_hash(new_password)
    db.session.commit()

    # Clean up OTP
    try:
        r = redis.Redis.from_url(current_app.config['REDIS_URL'])
        r.delete(f'otp:{contact}')
    except Exception:
        if contact in otp_storage:
            del otp_storage[contact]

    return {'success': True, 'message': 'Password reset'}
