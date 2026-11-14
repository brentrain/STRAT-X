@echo off
cd /d "%~dp0"
".venv\Scripts\python.exe" icu_telemetry_server.py
pause
