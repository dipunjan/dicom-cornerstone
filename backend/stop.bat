@echo off
title Stop CSOI Backend Server
color 0C

echo ========================================
echo     Stopping CSOI Backend Server
echo ========================================
echo.

echo Killing Node.js processes on port 8000...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8000" ^| find "LISTENING"') do (
    echo Stopping process ID: %%a
    taskkill /f /pid %%a >nul 2>&1
)

echo.
echo Killing all Node.js processes...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im nodemon.exe >nul 2>&1

echo.
echo CSOI Backend Server stopped.
echo.
pause
