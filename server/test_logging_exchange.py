import os
import json
import random
import string
from utils.logging_exchange import log_http_exchange, log_socket_event, log_upload, gen_request_id, mask_sensitive
from flask import Flask, request, g
from datetime import datetime
import time

def random_str(length=8):
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))

def random_phone():
    return '0' + ''.join(random.choices(string.digits, k=9))

def test_log_http():
    # Giả lập request context với dữ liệu ngẫu nhiên
    app = Flask(__name__)
    with app.test_request_context('/test-api', method='POST', json={
        'username': random_str(),
        'password': random_str(10),
        'token': random_str(16),
        'phone': random_phone(),
        'display_name': random_str(6),
        'gender': random.choice(['male', 'female', 'other'])
    }):
        g.request_id = gen_request_id()
        g.time_start = datetime.utcnow().isoformat()
        g.time_start_epoch = time.time()
        log_http_exchange(
            event_name='HTTP POST /test-api',
            user_id=random.randint(1, 9999),
            status=200,
            extra={'response_length': random.randint(50, 500)}
        )

def test_log_socket():
    log_socket_event(
        event_name='chat_message',
        from_user=random.randint(1, 9999),
        to_user=random.randint(1, 9999),
        to_room='room-' + random_str(4),
        payload={
            'content': random_str(20),
            'token': random_str(16),
            'emoji': random.choice(['😊', '😂', '👍', '❤️'])
        }
    )

def test_log_upload():
    log_upload(
        user_id=random.randint(1, 9999),
        filename=random_str(8) + '.png',
        file_size=random.randint(1000, 100000),
        status=random.choice(['success', 'fail']),
        duration_ms=random.randint(100, 2000)
    )

def test_mask_sensitive():
    data = {
        'password': random_str(10),
        'otp': random_str(6),
        'token': random_str(16),
        'phone': random_phone(),
        'profile': {
            'display_name': random_str(6),
            'gender': random.choice(['male', 'female', 'other'])
        }
    }
    masked = mask_sensitive(data)
    print('Masked:', masked)

if __name__ == '__main__':
    test_log_http()
    test_log_socket()
    test_log_upload()
    test_mask_sensitive()
    # Hiển thị nội dung log
    log_path = 'server/logs/exchange.log.jsonl'
    if os.path.exists(log_path):
        with open(log_path, 'r', encoding='utf-8') as f:
            print('\n--- Log file content ---')
            for line in f.readlines():
                print(line.strip())
    else:
        print('Log file not found.')
