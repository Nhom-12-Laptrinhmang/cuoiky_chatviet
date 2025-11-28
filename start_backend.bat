@echo off
echo ============================================
echo   Starting Vietnam Chat Backend Server
echo ============================================
echo.

REM Move to server directory
cd /d "%~dp0server"

echo [1/3] Prepare Python virtual environment (../.venv)...
if exist "..\.venv\Scripts\activate.bat" (
    echo Virtual environment found at ..\.venv
    call "..\.venv\Scripts\activate.bat"
    echo ✓ Virtual environment activated
) else (
    echo No virtual environment found at ..\.venv — creating one now
    python -m venv ..\.venv
    if exist "..\.venv\Scripts\activate.bat" (
        call "..\.venv\Scripts\activate.bat"
        echo ✓ Virtual environment created and activated
    ) else (
        echo Failed to create or find venv at ..\.venv; falling back to system Python
    )
)

echo.
echo [2/3] Installing Python dependencies (if needed)...
if exist "requirements.txt" (
    pip install -r requirements.txt
) else (
    echo requirements.txt not found in server/ - skipping pip install
)

echo.
REM Before starting: try to kill any process listening on the backend port
set "PORT=%BACKEND_PORT%"
if "%PORT%"=="" set "PORT=5000"
echo Checking for processes listening on port %PORT%...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /R /C:":%PORT% .*LISTENING"') do (
    echo Found PID %%a listening on port %PORT% - killing...
    taskkill /PID %%a /F >nul 2>&1 || echo Failed to kill PID %%a
)

echo.
echo [3/3] Starting Flask server...
echo.
python app.py

pause
