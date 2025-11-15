import time
from flask import request

def is_rate_limited(key):
    import redis
    from flask import current_app
    r = redis.Redis.from_url(current_app.config['REDIS_URL'])
    window = current_app.config['RATE_LIMIT_WINDOW']
    limit = current_app.config['RATE_LIMIT']
    now = int(time.time())
    window_key = f"rate:{key}:{now // window}"
    count = r.incr(window_key)
    if count == 1:
        r.expire(window_key, window)
    return count > limit
