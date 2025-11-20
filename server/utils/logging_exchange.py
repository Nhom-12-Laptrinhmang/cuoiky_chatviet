
import json
import time
import uuid
import threading
import os
from datetime import datetime
from flask import request, g

LOG_FILE = 'server/logs/exchange.log.json'
LOG_LOCK = threading.Lock()

SENSITIVE_KEYS = {'password', 'otp', 'token', 'phone'}
MASK = '***MASKED***'

# Mask sensitive fields in dict
def mask_sensitive(data):
    if isinstance(data, dict):
        return {k: (MASK if k.lower() in SENSITIVE_KEYS else mask_sensitive(v)) for k, v in data.items()}
    elif isinstance(data, list):
        return [mask_sensitive(v) for v in data]
    return data

def write_log(entry, columns=None):
    with LOG_LOCK:
        logs = []
        if os.path.exists(LOG_FILE):
            try:
                with open(LOG_FILE, 'r', encoding='utf-8') as f:
                    logs = json.load(f)
            except Exception:
                logs = []
        entry['source'] = 'server'
        logs.append(entry)
        with open(LOG_FILE, 'w', encoding='utf-8') as f:
            json.dump(logs, f, ensure_ascii=False, indent=2)

# Generate summary for request body
def summarize_body(body):
    if not body:
        return None
    if isinstance(body, dict):
        return {k: ('***' if k.lower() in SENSITIVE_KEYS else str(v)[:100]) for k, v in body.items()}
    return str(body)[:200]

# Generate unique request/event id
def gen_request_id():
    return str(uuid.uuid4())

# Main logger for HTTP exchange
def log_http_exchange(event_name, user_id=None, status=None, extra=None, stage="request"):
    entry = {
        'request_id': getattr(g, 'request_id', gen_request_id()),
        'event_name': event_name,
        'stage': stage,
        'time_start': getattr(g, 'time_start', datetime.utcnow().isoformat()),
        'time_end': datetime.utcnow().isoformat(),
        'duration_ms': int((time.time() - getattr(g, 'time_start_epoch', time.time())) * 1000),
        'method': request.method,
        'url': request.path,
        'user_id': user_id,
        'ip': request.remote_addr,
        'body_summary': json.dumps(summarize_body(mask_sensitive(request.get_json(silent=True))), ensure_ascii=False),
        'status': status,
        'extra': json.dumps(extra or {}, ensure_ascii=False),
    }
    columns = ['request_id','event_name','time_start','time_end','duration_ms','method','url','user_id','ip','body_summary','status','extra']
    write_log(entry, columns)
    print('[LOG]', entry)

# Main logger for socket event
def log_socket_event(event_name, from_user=None, to_user=None, to_room=None, payload=None):
    entry = {
        'request_id': gen_request_id(),
        'event_name': event_name,
        'time': datetime.utcnow().isoformat(),
        'from_user': from_user,
        'to_user': to_user,
        'to_room': to_room,
        'payload_summary': json.dumps(summarize_body(mask_sensitive(payload)), ensure_ascii=False),
    }
    columns = ['request_id','event_name','time','from_user','to_user','to_room','payload_summary']
    write_log(entry, columns)
    print('[SOCKET]', entry)

# Main logger for upload
def log_upload(user_id, filename, file_size, status, duration_ms):
    entry = {
        'request_id': gen_request_id(),
        'event_name': 'upload_file',
        'time': datetime.utcnow().isoformat(),
        'user_id': user_id,
        'filename': filename,
        'file_size': file_size,
        'status': status,
        'duration_ms': duration_ms,
    }
    columns = ['request_id','event_name','time','user_id','filename','file_size','status','duration_ms']
    write_log(entry, columns)
    print('[UPLOAD]', entry)
