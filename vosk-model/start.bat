@echo off
setlocal EnableExtensions
chcp 65001 >nul
title مداد
cd /d "%~dp0"

if not exist "asr_server.py" goto missing
if not exist "web_server.py" goto missing
if not exist "model\am" goto missing

set "PYLAUNCH="
where py >nul 2>&1 && set "PYLAUNCH=py -3"
if not defined PYLAUNCH (
  where python >nul 2>&1 && set "PYLAUNCH=python"
)
if not defined PYLAUNCH (
  echo لم يتم العثور على Python.
  echo ثبّت Python 3 من python.org وفعّل خيار Add python.exe to PATH.
  pause
  exit /b 1
)

set "VENV=myenv"
if exist "myenv\Scripts\python.exe" (
  set "VENV=myenv"
) else if exist "myenv-win\Scripts\python.exe" (
  set "VENV=myenv-win"
) else if exist "myenv\bin\python" (
  set "VENV=myenv-win"
) else if exist "myenv" (
  set "VENV=myenv-win"
)

if not exist "%VENV%\Scripts\python.exe" (
  echo إنشاء بيئة Windows: %VENV%
  %PYLAUNCH% -m venv "%VENV%"
  if errorlevel 1 (
    echo فشل إنشاء البيئة الافتراضية.
    pause
    exit /b 1
  )
)

set "PY=%~dp0%VENV%\Scripts\python.exe"

"%PY%" -c "import vosk, websockets" >nul 2>&1
if errorlevel 1 (
  echo تثبيت الحزم...
  "%PY%" -m pip install --upgrade pip
  "%PY%" -m pip install -r "%~dp0requirements.txt"
  if errorlevel 1 (
    echo فشل تثبيت الحزم.
    pause
    exit /b 1
  )
)

set "VOSK_SAMPLE_RATE=16000"
set "VOSK_MODEL_PATH=%~dp0model"

echo تشغيل خادم التعرف على المنفذ 2700...
start "مداد - التعرف" /D "%~dp0" cmd /k "set VOSK_SAMPLE_RATE=16000&& set PYTHONUNBUFFERED=1&& echo [مداد] خادم التعرف && %VENV%\Scripts\python.exe -u asr_server.py model && echo. && echo توقف الخادم. راجع الرسائل أعلاه. && pause"

echo تشغيل فحص الصحة على المنفذ 8080...
start "مداد - فحص الصحة" /D "%~dp0" cmd /k "set PYTHONUNBUFFERED=1&& echo [مداد] فحص الصحة && %VENV%\Scripts\python.exe -u web_server.py && echo. && echo توقف الخادم. راجع الرسائل أعلاه. && pause"

echo.
echo تم فتح نوافذ الطرفية. اتركها مفتوحة لمراقبة الأخطاء.
echo خادم Vosk: ws://localhost:2700
echo افتح موقع مداد (React) واتركه يتصل بهذا الخادم عبر VITE_VOSK_WS_URL
echo للإيقاف استخدم stop.bat أو أغلق نوافذ الطرفية.
echo.
pause
exit /b 0

:missing
echo الملفات المطلوبة ناقصة. تأكد من وجود asr_server.py و web_server.py ومجلد model
pause
exit /b 1
