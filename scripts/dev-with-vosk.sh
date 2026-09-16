#!/usr/bin/env bash
# Starts the local Vosk speech-recognition server in the background (if
# it isn't already running) and then runs the Vite dev server in the
# foreground. Ctrl+C stops Vite only — Vosk keeps running so repeated
# `npm run dev` calls don't reload the speech model every time.
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VOSK_DIR="$ROOT/vosk-model"
PYTHON="$VOSK_DIR/myenv/bin/python"

port_in_use() {
  ss -tln 2>/dev/null | grep -q ":$1 "
}

if [ -x "$PYTHON" ] && [ -f "$VOSK_DIR/asr_server.py" ] && [ -d "$VOSK_DIR/model" ]; then
  if port_in_use 2700; then
    echo "خادم Vosk يعمل مسبقاً على المنفذ 2700"
  else
    echo "تشغيل خادم Vosk على ws://localhost:2700 في الخلفية..."
    (cd "$VOSK_DIR" && VOSK_SAMPLE_RATE=16000 "$PYTHON" asr_server.py ./model \
      > "$ROOT/vosk-server.log" 2>&1 &)
  fi
else
  echo "تخطي تشغيل خادم Vosk: البيئة الافتراضية أو النموذج غير موجود في vosk-model/"
fi

exec npx vite
