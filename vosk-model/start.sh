#!/usr/bin/env bash
# تشغيل مداد على :8080 وخادم Vosk على :2700 من هذا المجلد.
# على Windows استخدم start.bat
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

PYTHON="$ROOT/myenv/bin/python"
PIP="$ROOT/myenv/bin/pip"

if [ ! -d "$ROOT/model/am" ] || [ ! -f "$ROOT/asr_server.py" ] || [ ! -f "$ROOT/web_server.py" ]; then
  echo "الملفات المطلوبة ناقصة. تأكد من وجود asr_server.py و web_server.py ومجلد model/"
  exit 1
fi

if [ ! -x "$PYTHON" ]; then
  echo "إنشاء البيئة الافتراضية myenv..."
  python3 -m venv myenv --without-pip 2>/dev/null || python3 -m venv myenv
  if [ ! -x "$PIP" ]; then
    curl -fsSL -o /tmp/get-pip.py https://bootstrap.pypa.io/get-pip.py
    "$PYTHON" /tmp/get-pip.py
  fi
fi

if ! "$PYTHON" -c "import vosk, websockets" >/dev/null 2>&1; then
  echo "تثبيت الحزم..."
  "$PIP" install -r "$ROOT/requirements.txt"
fi

port_in_use() {
  ss -tln | grep -q ":$1 "
}

if port_in_use 2700; then
  echo "خادم Vosk يعمل مسبقاً على المنفذ 2700"
else
  echo "تشغيل خادم Vosk على ws://localhost:2700"
  export VOSK_SAMPLE_RATE=16000
  "$PYTHON" "$ROOT/asr_server.py" "$ROOT/model" &
  sleep 1
fi

if port_in_use 8080; then
  echo "فحص الصحة يعمل مسبقاً على المنفذ 8080"
else
  echo "تشغيل فحص الصحة على http://localhost:8080"
    python3 "$ROOT/web_server.py" &
  sleep 1
fi

echo
echo "خادم Vosk جاهز: ws://localhost:2700"
echo "افتح موقع مداد (React) واتركه يتصل بهذا الخادم عبر VITE_VOSK_WS_URL"
echo "للإيقاف: اضغط Ctrl+C"
wait
