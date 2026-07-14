@echo off
:: Automatically configure the execution path to use our local portable Node.js
set "PATH=%~dp0node-v22.12.0-win-x64;%PATH%"

echo Starting KCAU CU Attendance Poster Generator local server...
echo -------------------------------------------------------------
npm run dev
pause
