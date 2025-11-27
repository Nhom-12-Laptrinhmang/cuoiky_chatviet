@echo off
REM start_frontend.bat - convenience shim to run the frontend start script
REM Usage: run from repo root: .\start_frontend.bat

SETLOCAL

REM ensure we operate from script directory (supports running from other working dirs)
cd /d "%~dp0"

REM Kill any existing process on port 3000 to avoid "port already in use" errors
echo Cleaning up port 3000 (if in use)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000"') do taskkill /PID %%a /F 2>nul
timeout /t 1 /nobreak >nul

REM prefer an explicit run_frontend.bat if present (legacy); otherwise start client directly
if exist "%~dp0run_frontend.bat" (
  call "%~dp0run_frontend.bat"
) else (
  echo run_frontend.bat not found — starting frontend directly in a new window

  REM check Node is available
  where node >nul 2>&1
  if %ERRORLEVEL% NEQ 0 (
    echo Node.js not found in PATH. Install Node.js 14+ and retry.
    pause
    ENDLOCAL
    exit /b 1
  )

  REM Use doubled quotes to embed inner quoted commands for cmd /k
  start "Vietnam Chat - Frontend" cmd /k ""cd /d "%~dp0client" && npm install && set "REACT_APP_API_URL=http://localhost:5000" && set "REACT_APP_SOCKET_URL=http://localhost:5000" && npm start""
)

ENDLOCAL
exit /b 0
