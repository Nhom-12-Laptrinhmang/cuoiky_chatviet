@echo off
REM stop_all.bat - Stop backend (python), frontend (node) and ngrok on Windows
REM Run this from repository root (double-click or from CMD/PowerShell)

echo =========================================
echo Vietnam Chat - Stop all services (Windows)
echo =========================================

echo Stopping frontend (node)...
tasklist /FI "IMAGENAME eq node.exe" 2>NUL | find /I "node.exe" >NUL
if %ERRORLEVEL%==0 (
  echo Killing node.exe processes...
  taskkill /F /IM node.exe >NUL 2>&1
  echo node stopped.
) else (
  echo node not running.
)

echo Stopping backend (python)...
tasklist /FI "IMAGENAME eq python.exe" 2>NUL | find /I "python.exe" >NUL
if %ERRORLEVEL%==0 (
  echo Killing python.exe processes...
  taskkill /F /IM python.exe >NUL 2>&1
  echo python stopped.
) else (
  echo python not running.
)

echo Stopping ngrok if running...
tasklist /FI "IMAGENAME eq ngrok.exe" 2>NUL | find /I "ngrok.exe" >NUL
if %ERRORLEVEL%==0 (
  echo Killing ngrok.exe processes...
  taskkill /F /IM ngrok.exe >NUL 2>&1
  echo ngrok stopped.
) else (
  echo ngrok not running.
)

echo Done.
pause
