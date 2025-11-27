@echo off
REM start_all.bat - Start backend, frontend and optional ngrok on Windows
REM Usage: start_all.bat [no-ngrok]

SETLOCAL

REM Determine script directory
SET REPO_DIR=%~dp0

REM If first arg is 'no-ngrok' then skip launching ngrok
IF "%1"=="no-ngrok" (
  SET SKIP_NGROK=1
) ELSE (
  SET SKIP_NGROK=0
)

echo Starting Vietnam Chat (Windows) from %REPO_DIR%

REM --- Backend ---
echo Launching backend in new window...
start "Vietnam Chat - Backend" cmd /k "cd /d "%REPO_DIR%server" && if not exist "..\.venv" (python -m venv ..\.venv) && call ..\.venv\Scripts\activate.bat && pip install -r requirements.txt && python app.py"

REM --- Frontend ---
echo Launching frontend in new window...
start "Vietnam Chat - Frontend" cmd /k "cd /d "%REPO_DIR%client" && npm install && set REACT_APP_API_URL=http://localhost:5000 && set REACT_APP_SOCKET_URL=http://localhost:5000 && npm start"

REM --- Ngrok (optional) ---
if "%SKIP_NGROK%"=="0" (
  echo Launching ngrok (if available)...
  start "Vietnam Chat - Ngrok" cmd /k "cd /d "%REPO_DIR%" && if exist ngrok.exe (ngrok http 5000) else (echo ngrok.exe not found in PATH && pause)"
) ELSE (
  echo Skipping ngrok as requested.
)

ENDLOCAL
exit /b 0
