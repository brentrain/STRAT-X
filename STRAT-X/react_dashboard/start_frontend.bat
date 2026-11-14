@echo off
REM Start ICU Telemetry Simulator Frontend

cls
echo ========================================
echo ICU Telemetry Simulator - Frontend GUI
echo ========================================
echo.
echo Starting Vite development server on http://localhost:5173
echo.
echo Make sure the backend is running on http://localhost:5000
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

call npm run dev

pause
