@echo off
title Calculator ~ by Ganit Technology
echo.
echo  =========================================
echo   Calculator ~ by Ganit Technology
echo   Powered by Dhurta Organisation
echo   BETA v0.1.0
echo  =========================================
echo.
echo  Starting local server on http://localhost:4200
echo  Press Ctrl+C to stop.
echo.
cd /d "%~dp0"
npx serve . --listen 4200 --no-clipboard
pause
