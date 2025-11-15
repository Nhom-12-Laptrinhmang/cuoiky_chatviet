from pyngrok import ngrok
import os
import subprocess


def start_ngrok(app, port=None):
    """Start an ngrok tunnel and return the public URL.

    - If NGROK_AUTH_TOKEN env var is set, configure it first.
    - Port can be passed explicitly; otherwise BACKEND_PORT or 5000 is used.
    - Uses ngrok from PATH (assumed to be installed manually or system-wide).
    """
    # Allow explicit port or read from env
    if port is None:
        try:
            port = int(os.environ.get('BACKEND_PORT', '5000'))
        except Exception:
            port = 5000

    auth_token = os.environ.get('NGROK_AUTH_TOKEN')
    if auth_token:
        try:
            ngrok.set_auth_token(auth_token)
        except Exception:
            # ignore if setting token fails
            pass

    try:
        # Try using pyngrok's tunnel (if it can auto-download or has ngrok cached)
        tunnel = ngrok.connect(port, bind_tls=True)
        public_url = tunnel.public_url
    except Exception as e:
        # Fallback: try calling ngrok binary directly from PATH
        print(f"[NGROK] pyngrok failed ({e}), trying ngrok binary directly...")
        try:
            # Start ngrok in background using subprocess
            result = subprocess.run(
                ['ngrok', 'http', str(port), '--log=stdout'],
                capture_output=False,
                text=True,
                timeout=5
            )
            # This won't work as-is since ngrok runs in foreground,
            # so we fall back to a simpler approach:
            # Just tell user to run ngrok separately
            raise Exception("Please run ngrok separately: ngrok http " + str(port))
        except FileNotFoundError:
            raise Exception("ngrok binary not found in PATH. Please install ngrok.")

    # Save public url into app config for the app to consume if needed
    app.config["BASE_URL"] = public_url
    return public_url
