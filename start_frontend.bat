@echo off
REM start_frontend.bat - convenience shim to run the frontend start script
REM Usage: run from repo root: .\start_frontend.bat

SETLOCAL
cd /d "%~dp0"
if exist run_frontend.bat (
  call run_frontend.bat
) else (
  echo run_frontend.bat not found, attempting to start directly in client\
  start "Vietnam Chat - Frontend" cmd /k "cd /d "%~dp0client" && npm install && set REACT_APP_API_URL=http://localhost:5000 && set REACT_APP_SOCKET_URL=http://localhost:5000 && npm start"
)
ENDLOCAL
exit /b 0
