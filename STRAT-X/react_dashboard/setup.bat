@echo off
REM ICU Telemetry Simulator - Quick Start Script (Windows)

echo ========================================
echo ICU Telemetry Simulator - Starting...
echo ========================================
echo.

REM Check if Python is installed
python --version > nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ from python.org
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version > nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from nodejs.org
    pause
    exit /b 1
)

echo Python version:
python --version
echo.
echo Node.js version:
node --version
echo.

REM Install Python dependencies
echo Installing Python dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install Python dependencies
    pause
    exit /b 1
)

REM Install Node dependencies
echo.
echo Installing Node dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install Node dependencies
    pause
    exit /b 1
)

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo To start the system:
echo 1. Run "start_backend.bat" in one terminal
echo 2. Run "start_frontend.bat" in another terminal
echo 3. Open http://localhost:5173 in your browser
echo.
pause
