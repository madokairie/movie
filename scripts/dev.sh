#!/bin/bash
# Auto-restart dev server on crash
# Usage: ./scripts/dev.sh

PORT=${PORT:-3001}
MAX_RESTARTS=10
RESTART_DELAY=3
restart_count=0

cleanup() {
  echo ""
  echo "[dev.sh] Shutting down..."
  kill $SERVER_PID 2>/dev/null
  exit 0
}

trap cleanup SIGINT SIGTERM

while true; do
  echo "[dev.sh] Starting Next.js dev server (port $PORT)..."
  NODE_OPTIONS="--max-old-space-size=4096" npx next dev --port "$PORT" &
  SERVER_PID=$!

  wait $SERVER_PID
  EXIT_CODE=$?

  if [ $EXIT_CODE -eq 0 ]; then
    echo "[dev.sh] Server exited normally."
    break
  fi

  restart_count=$((restart_count + 1))
  echo "[dev.sh] Server crashed (exit code: $EXIT_CODE). Restart $restart_count/$MAX_RESTARTS..."

  if [ $restart_count -ge $MAX_RESTARTS ]; then
    echo "[dev.sh] Max restarts reached. Giving up."
    exit 1
  fi

  # Kill any orphaned processes on the port
  lsof -ti :$PORT | xargs kill -9 2>/dev/null
  sleep $RESTART_DELAY
done
