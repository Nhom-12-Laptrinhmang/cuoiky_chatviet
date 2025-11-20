#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
PIDFILE="$ROOT_DIR/server/backend.pid"

if [ -f "$PIDFILE" ]; then
  pid=$(cat "$PIDFILE")
  echo "Stopping backend PID=$pid"
  kill -15 "$pid" 2>/dev/null || true
  sleep 1
  if kill -0 "$pid" 2>/dev/null; then
    echo "Process $pid did not exit - forcing kill"
    kill -9 "$pid" 2>/dev/null || true
  fi
  rm -f "$PIDFILE"
  echo "Stopped"
else
  echo "No PID file found at $PIDFILE - nothing to stop"
fi
