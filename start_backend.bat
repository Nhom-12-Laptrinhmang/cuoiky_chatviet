@echo off
echo ============================================
echo   Starting Vietnam Chat Backend Server
echo ============================================
echo.

cd /d "%~dp0server"

echo [1/2] Activating Python environment...
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
    echo ✓ Virtual environment activated
) else (
    echo ⚠ No virtual environment found, using system Python
)

echo.
echo [2/2] Starting Flask server...
echo.
python app.py

pause
