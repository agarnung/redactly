#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [ -f .run/server.pid ]; then
  PID="$(cat .run/server.pid)"
  if kill -0 "$PID" 2>/dev/null; then
    kill "$PID"
    echo "Stopped PID $PID"
  else
    echo "Stale PID $PID"
  fi
  rm -f .run/server.pid
else
  echo "Not running"
fi
