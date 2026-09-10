@echo off
setlocal EnableExtensions
chcp 65001 >nul
title إيقاف مداد

echo إيقاف خدمات مداد...

for %%P in (2700 8080) do (
  for /f "tokens=5" %%I in ('netstat -ano ^| findstr ":%%P" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%I >nul 2>&1
  )
)

echo تم الإيقاف.
timeout /t 2 /nobreak >nul
exit /b 0
