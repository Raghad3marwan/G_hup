#!/bin/bash
cd "$(dirname "$0")"
PORT=8080
python3 -m http.server "$PORT" >/tmp/jinayat_natural_death_http.log 2>&1 &
PID=$!
sleep 1
open "http://localhost:$PORT/index.html"
echo "JINAYAT server started on http://localhost:$PORT/ (PID $PID)"
echo "Close this window only after you finish playing."
wait $PID
