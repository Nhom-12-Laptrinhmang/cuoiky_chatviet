#!/usr/bin/env bash
# Robust backend starter: ensures a virtualenv exists, installs requirements, then runs the server.

set -euo pipefail

# Project root (script lives at project root)
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
SERVER_DIR="$ROOT_DIR/server"
VENV_DIR="$ROOT_DIR/.venv"

echo "📁 Project root: $ROOT_DIR"

cd "$SERVER_DIR"

echo "🚀 Preparing Flask backend..."

# Create virtualenv if missing
if [ ! -d "$VENV_DIR" ]; then
	echo "⚙️  Virtualenv not found: creating $VENV_DIR"
	python3 -m venv "$VENV_DIR"
	echo "✅ Virtualenv created"
fi

PIP_BIN="$VENV_DIR/bin/pip"
PY_BIN="$VENV_DIR/bin/python"

# Choose backend port (allows overriding)
DEFAULT_PORT=5000
PORT=${BACKEND_PORT:-$DEFAULT_PORT}

# Before attempting to pick a free port, try to stop any process already
# listening on the requested port so the backend can use it.
echo "Checking for processes listening on port ${PORT}..."
PIDS=$(lsof -tiTCP:${PORT} -sTCP:LISTEN 2>/dev/null || true)
if [ -n "$PIDS" ]; then
	echo "Found processes listening on port ${PORT}: $PIDS"
	echo "Stopping processes..."
	for pid in $PIDS; do
		if [ -n "$pid" ]; then
			kill "$pid" 2>/dev/null || true
		fi
	done
	sleep 1

	# Escalate if still present
	if lsof -iTCP:${PORT} -sTCP:LISTEN -P >/dev/null 2>&1; then
		echo "Processes still listening on ${PORT} — forcing kill"
		PIDS=$(lsof -tiTCP:${PORT} -sTCP:LISTEN 2>/dev/null || true)
		for pid in $PIDS; do
			if [ -n "$pid" ]; then
				kill -9 "$pid" 2>/dev/null || true
			fi
		done
	fi
else
	echo "No process found listening on port ${PORT}"
fi

# If requested port is in use (after attempted kill), find the next free port
# (5001, 5002, ...). This keeps the original behavior if the port remains busy.
while lsof -iTCP:${PORT} -sTCP:LISTEN -P >/dev/null 2>&1; do
  echo "⚠️  Port ${PORT} is in use — trying next port"
  PORT=$((PORT+1))
done

export BACKEND_PORT=$PORT
echo "📍 Using backend port: $BACKEND_PORT"

# Install requirements (no-op if already satisfied)
if [ -f "$SERVER_DIR/requirements.txt" ]; then
	echo "📦 Installing requirements (may take a moment)..."
	"$PIP_BIN" install -r "$SERVER_DIR/requirements.txt" 2>&1 | tail -1
	echo "✅ Requirements satisfied"
else
	echo "⚠️  requirements.txt not found in $SERVER_DIR — please create it or install dependencies manually."
fi

echo "📍 Port: $BACKEND_PORT"
echo "🌐 Local URL: http://localhost:$BACKEND_PORT"
echo ""

# Check if ngrok is installed and ENABLE_NGROK is true
if command -v ngrok &> /dev/null && [ "${ENABLE_NGROK:-false}" == "true" ]; then
	echo "🌐 ngrok is enabled — will create public tunnel"
else
	echo "💡 To expose backend publicly, set: export ENABLE_NGROK=true"
fi
echo ""

echo "▶️  Starting Flask app using $PY_BIN (PORT=$BACKEND_PORT)"
BACKEND_HOST=${BACKEND_HOST:-0.0.0.0} BACKEND_PORT=$BACKEND_PORT ENABLE_NGROK=${ENABLE_NGROK:-false} "$PY_BIN" app.py
