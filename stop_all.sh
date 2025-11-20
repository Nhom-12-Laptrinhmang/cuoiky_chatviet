#!/usr/bin/env bash
set -euo pipefail

# stop_all.sh — stop frontend and backend created by start_all.sh/run_backend.sh

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
SERVER_DIR="$ROOT_DIR/server"
CLIENT_DIR="$ROOT_DIR/client"

echo "Stopping services if pidfiles exist or ports are in use"

if [ -f "$SERVER_DIR/backend.pid" ]; then
  PID=$(cat "$SERVER_DIR/backend.pid" 2>/dev/null || true)
  if [ -n "$PID" ]; then
    echo "Killing backend PID $PID"
    kill -15 "$PID" || true
    sleep 1
    kill -0 "$PID" >/dev/null 2>&1 && kill -9 "$PID" || true
  fi
  rm -f "$SERVER_DIR/backend.pid" || true
fi

# Fallback: kill any process listening on 5000
P=$(lsof -tiTCP:5000 -sTCP:LISTEN -P || true)
if [ -n "$P" ]; then
  echo "Also killing processes listening on 5000: $P"
  echo "$P" | xargs -r kill -15 || true
  sleep 1
  if lsof -iTCP:5000 -sTCP:LISTEN -P >/dev/null 2>&1; then
    echo "Forcing kill on remaining 5000 PIDs"
    echo "$P" | xargs -r kill -9 || true
  fi
fi

if [ -f "$CLIENT_DIR/frontend.pid" ]; then
  while read -r PID; do
    if [ -n "$PID" ]; then
      echo "Killing frontend PID $PID"
      kill -15 "$PID" || true
      sleep 1
      kill -0 "$PID" >/dev/null 2>&1 && kill -9 "$PID" || true
    fi
  done < "$CLIENT_DIR/frontend.pid" || true
  rm -f "$CLIENT_DIR/frontend.pid" || true
fi

# Fallback: kill any process listening on 3000
P3=$(lsof -tiTCP:3000 -sTCP:LISTEN -P || true)
if [ -n "$P3" ]; then
  echo "Also killing processes listening on 3000: $P3"
  echo "$P3" | xargs -r kill -15 || true
  sleep 1
  if lsof -iTCP:3000 -sTCP:LISTEN -P >/dev/null 2>&1; then
    echo "Forcing kill on remaining 3000 PIDs"
    echo "$P3" | xargs -r kill -9 || true
  fi
fi

echo "Removing known log pid files (if any)"
rm -f "$SERVER_DIR/backend.pid" "$CLIENT_DIR/frontend.pid" || true
echo "Stopped."
