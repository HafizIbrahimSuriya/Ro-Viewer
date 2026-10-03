@echo off
cd /d "%~dp0"
node -v >nul 2>&1 || (echo Install Node.js 18+ from https://nodejs.org first & pause & exit /b)
start "" http://localhost:3200
node server.js
pause
