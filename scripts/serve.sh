#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
PORT="${1:-8093}"
while python3 - "$PORT" <<'PY'
import socket, sys
s = socket.socket()
s.settimeout(0.2)
sys.exit(0 if s.connect_ex(("127.0.0.1", int(sys.argv[1]))) == 0 else 1)
PY
do
  PORT=$((PORT + 1))
done
mkdir -p .run
if [ -f .run/server.pid ] && kill -0 "$(cat .run/server.pid)" 2>/dev/null; then
  echo "Already running: http://localhost:${PORT}/ (PID $(cat .run/server.pid))"
  exit 0
fi
nohup python3 -m http.server "$PORT" --bind 127.0.0.1 --directory . >.run/server.log 2>&1 &
echo $! > .run/server.pid
sleep 1
echo "Redactly: http://localhost:${PORT}/"
echo "PID $(cat .run/server.pid) · log .run/server.log"
