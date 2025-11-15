#!/usr/bin/env python3
import sys
sys.path.insert(0, '/Users/melaniepham/Documents/Viet/HK1 Năm 3/CUOI KY/11_11cuoiky/server')

from app import app, db
from models.user_model import User
from models.message_model import Message

with app.app_context():
    # Create all tables
    db.create_all()
    print("✅ Database initialized successfully!")
    print(f"📊 Tables created: User, Message")
