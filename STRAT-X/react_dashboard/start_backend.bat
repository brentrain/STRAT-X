@echo off
REM Start ICU Telemetry Simulator Backend

cls
echo ========================================
echo ICU Telemetry Simulator - Backend Server
echo ========================================
echo.
echo Starting Flask API server on http://localhost:5000
echo.
echo API Endpoints:
echo   - POST   /api/simulator/start
echo   - POST   /api/simulator/stop
echo   - GET    /api/simulator/status
echo   - GET    /api/patients
echo   - GET    /api/patients/^<id^>
echo   - GET    /api/events
echo   - GET    /api/health
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

python backend_simulator.py

pause
