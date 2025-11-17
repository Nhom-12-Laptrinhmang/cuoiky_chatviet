#!/usr/bin/env python3
import sys
import logging
sys.path.insert(0, '/Users/melaniepham/Documents/Viet/HK1 Năm 3/CUOI KY/11_11cuoiky/server')

from app import app, db
from models.user_model import User
from models.message_model import Message

logger = logging.getLogger(__name__)

with app.app_context():
    # Create all tables
    db.create_all()
    logger.info("Database initialized successfully")
    logger.info("Tables created (if missing): User, Message")
