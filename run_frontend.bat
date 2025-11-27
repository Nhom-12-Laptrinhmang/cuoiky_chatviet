@echo off
REM run_frontend.bat - Windows wrapper to install deps and start React dev server
REM Usage: double-click or run from CMD/PowerShell in repo root

REM Change to script directory (support different drives)
cd /d "%~dp0client"

echo ================================
echo Vietnam Chat - Start Frontend (Windows)
echo ================================

echo Installing dependencies (if needed)...
npm install

echo Setting environment variables...
set "REACT_APP_API_URL=http://localhost:5000"
set "REACT_APP_SOCKET_URL=http://localhost:5000"

echo Starting frontend (npm start)...
npm start

pause
