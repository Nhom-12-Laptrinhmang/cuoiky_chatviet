# Project quick start

This repository contains a React frontend (`/client`) and a Flask backend (`/server`).

Quick steps for others (clone + run):

1) Install Python 3.8+ and Node.js (14+ recommended).

2) From project root, start the backend (script will create a `.venv` and install requirements automatically):

```bash
# from project root
./run_backend.sh
```

This will:
- Create a virtualenv at `./.venv` if missing
- Install packages listed in `server/requirements.txt`
- Launch the Flask server on http://localhost:5000

3) Start the frontend (in a separate terminal):

```bash
cd client
npm install   # first-time only
npm start
```

The frontend is configured to proxy API requests to `http://localhost:5000` (see `client/package.json`).

Troubleshooting:
- If you get `ECONNREFUSED` proxy errors, make sure step (2) shows the backend running on `http://127.0.0.1:5000` before starting the frontend.
- If SSL or ngrok download fails, that's non-fatal — the app will still run locally without ngrok.
- If dependencies fail to install, open a terminal in `server` and run:
  ```bash
  python3 -m venv .venv
  . .venv/bin/activate
  pip install -r requirements.txt
  python app.py
  ```

If you'd like, I can also add a `setup.sh` to perform initial setup (venv + pip + npm install).