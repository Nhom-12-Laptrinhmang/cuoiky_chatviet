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
echo [3/3] Starting Flask server...
echo.
python app.py

pause
