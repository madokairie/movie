#!/bin/bash
# Auto-restart dev server on crash
# Usage: ./scripts/dev.sh

PORT=${PORT:-3200}
MAX_RESTARTS=10
RESTART_DELAY=3
restart_count=0

# Kill orphaned processes on the port before starting
kill_port() {
  local pids
  pids=$(lsof -ti :$PORT 2>/dev/null)
  if [ -n "$pids" ]; then
    echo "[dev.sh] Killing orphaned processes on port $PORT: $pids"
    echo "$pids" | xargs kill -9 2>/dev/null
    sleep 1
  fi
}

# Clear corrupted .next cache if needed
clear_cache_if_corrupt() {
  if [ -f .next/BUILD_ID ] && ! next build --no-lint --dry-run 2>/dev/null; then
    echo "[dev.sh] Detected potentially corrupted .next cache, clearing..."
    rm -rf .next
  fi
}

cleanup() {
  echo ""
  echo "[dev.sh] Shutting down..."
  kill $SERVER_PID 2>/dev/null
  exit 0
}

trap cleanup SIGINT SIGTERM

# Pre-flight: kill any existing process on the port
kill_port

# Open browser automatically on first start
open_browser() {
  (
    while ! curl -s -o /dev/null http://localhost:$PORT 2>/dev/null; do
      sleep 0.5
    done
    open "http://localhost:$PORT"
  ) &
}

FIRST_START=true

while true; do
  echo "[dev.sh] Starting Next.js dev server on http://localhost:$PORT ..."
  NODE_OPTIONS="--max-old-space-size=4096" npx next dev --port "$PORT" &
  SERVER_PID=$!

  if [ "$FIRST_START" = true ]; then
    open_browser
    FIRST_START=false
  fi

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
  kill_port
  sleep $RESTART_DELAY
done
