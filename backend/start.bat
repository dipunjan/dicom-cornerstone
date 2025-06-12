@echo off
title CSOI Backend Server
color 0A

echo ========================================
echo    CSOI Backend API Server Setup
echo ========================================
echo.

echo [1/3] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo Node.js found:
node --version

echo.
echo [2/3] Installing dependencies...
if not exist "node_modules" (
    echo Installing npm packages...
    npm install
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
) else (
    echo Dependencies already installed, skipping...
)

echo.
echo [3/3] Starting CSOI Backend API server...
echo.
echo Server will be available at: http://localhost:8000
echo Health check: http://localhost:8000/health
echo Files endpoint: http://localhost:8000/files/
echo.
echo MongoDB: Will connect to localhost:27017 (optional)
echo QASamples: C:\Users\dipunjanb\Downloads\QASamples
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

npm run dev
