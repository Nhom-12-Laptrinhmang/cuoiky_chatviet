#!/usr/bin/env bash
set -euo pipefail

# Supervised launcher: keeps restarting the backend if it crashes.
# Writes logs to server/backend.log and PID to server/backend.pid

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
SERVER_DIR="$ROOT_DIR/server"
VENV_DIR="$ROOT_DIR/.venv"
PY_BIN="$VENV_DIR/bin/python"

mkdir -p "$SERVER_DIR"
LOG="$SERVER_DIR/backend.log"
PIDFILE="$SERVER_DIR/backend.pid"

echo "Supervisor starting - logs -> $LOG"

# If venv exists, ensure python is executable
if [ ! -x "$PY_BIN" ]; then
  echo "Warning: $PY_BIN not found or not executable. Ensure .venv exists and pip packages are installed."
  PY_BIN="python3"
fi

attempt=0
backoff=1
while true; do
  attempt=$((attempt+1))
  echo "[supervisor] Starting backend (attempt $attempt) - $(date)" | tee -a "$LOG"
  # start from project root so module imports work
  nohup bash -lc "cd \"$ROOT_DIR\" && \"$PY_BIN\" -m server.app" >> "$LOG" 2>&1 &
  pid=$!
  echo "$pid" > "$PIDFILE"
  echo "[supervisor] started PID=$pid" | tee -a "$LOG"

  # wait for process to exit
  wait $pid
  exit_code=$?
  echo "[supervisor] backend exited with code $exit_code at $(date)" | tee -a "$LOG"

  # if exit_code is 0, it shut down cleanly - do not restart
  if [ "$exit_code" -eq 0 ]; then
    echo "[supervisor] backend exited cleanly - supervisor stopping" | tee -a "$LOG"
    rm -f "$PIDFILE"
    exit 0
  fi

  # restart with backoff
  echo "[supervisor] will restart after $backoff seconds" | tee -a "$LOG"
  sleep $backoff
  backoff=$((backoff*2))
  if [ $backoff -gt 60 ]; then backoff=60; fi
done
