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