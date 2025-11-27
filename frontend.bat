@echo off
REM frontend.bat - start the React frontend from anywhere
REM Usage: ./frontend.bat  (works when run from repo root or any working dir)

REM Resolve script directory (where this .bat lives)
SET "SCRIPT_DIR=%~dp0"

REM Change to client directory relative to script location
cd /d "%SCRIPT_DIR%client" 2>nul || (
  echo Could not find 'client' folder at "%SCRIPT_DIR%client".
  echo Trying parent folder...
  cd /d "%SCRIPT_DIR%..\client" 2>nul || (
    echo ERROR: client folder not found. Please run this from project root.
    pause
    exit /b 1
  )
)

echo Running from: %CD%

REM Check Node
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo Node.js not found in PATH. Install Node.js 14+ and try again.
  pause
  exit /b 1
)

REM Install dependencies only if node_modules missing
if not exist "node_modules" (
  echo node_modules not found — running npm install (this may take a while)...
  npm install || (
    echo npm install failed. Check npm logs above.
    pause
    exit /b 1
  )
)

REM Set environment variables for this session
set "REACT_APP_API_URL=http://localhost:5000"
set "REACT_APP_SOCKET_URL=http://localhost:5000"

echo Starting React dev server (npm start)...
call npm start

pause
