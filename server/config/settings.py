import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'supersecretkey')
    # Use absolute path to storage folder to avoid relative path issues
    DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'storage', 'chatapp.db')
    SQLALCHEMY_DATABASE_URI = f'sqlite:///{DB_PATH}'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwtsecretkey')
    OTP_EXPIRE_SECONDS = 300
    RATE_LIMIT = 5
    RATE_LIMIT_WINDOW = 60
    # Optional delivery configuration
    SMTP_HOST = os.environ.get('SMTP_HOST', '')
    SMTP_PORT = int(os.environ.get('SMTP_PORT', 587) or 587)
    SMTP_USER = os.environ.get('SMTP_USER', '')
    SMTP_PASS = os.environ.get('SMTP_PASS', '')
    SENDGRID_API_KEY = os.environ.get('SENDGRID_API_KEY', '')
    ZALO_ACCESS_TOKEN = os.environ.get('ZALO_ACCESS_TOKEN', '')
    ZALO_OFFICIAL_ACCOUNT_ID = os.environ.get('ZALO_OFFICIAL_ACCOUNT_ID', '')
    
    # AWS S3 Configuration for file uploads
    AWS_ACCESS_KEY_ID = os.environ.get('AWS_ACCESS_KEY_ID', '')
    AWS_SECRET_ACCESS_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY', '')
    AWS_S3_BUCKET = os.environ.get('AWS_S3_BUCKET', 'vietnam-chat-files')
    AWS_S3_REGION = os.environ.get('AWS_S3_REGION', 'ap-southeast-1')
    S3_PRESIGNED_URL_EXPIRATION = 3600  # 1 hour