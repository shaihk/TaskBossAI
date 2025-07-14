@echo off
echo ========================================
echo    TaskBoss-AI - System Status
echo ========================================
echo.

REM Check configuration files
echo Configuration Status:
if exist ".env" (
    echo ✓ Main configuration file exists
) else (
    echo ❌ Main configuration file missing
)

if exist "server\.env" (
    echo ✓ Server configuration file exists
) else (
    echo ❌ Server configuration file missing
)

echo.

REM Check database
echo Database Status:
if exist "server\taskboss.db" (
    echo ✓ SQLite database exists
    for %%A in ("server\taskboss.db") do echo   Size: %%~zA bytes
    echo   Location: server\taskboss.db
) else (
    echo ❌ SQLite database not found
)

echo.

REM Check dependencies
echo Dependencies Status:
if exist "node_modules" (
    echo ✓ Frontend dependencies installed
) else (
    echo ❌ Frontend dependencies missing
)

if exist "server\node_modules" (
    echo ✓ Server dependencies installed
) else (
    echo ❌ Server dependencies missing
)

echo.

REM Check running processes
echo Process Status:
echo Checking for Node.js processes...

REM Check for node processes
tasklist /fi "imagename eq node.exe" /fo csv 2>nul | find /i "node.exe" >nul
if errorlevel 1 (
    echo ❌ No Node.js processes running
) else (
    echo ✓ Node.js processes found:
    tasklist /fi "imagename eq node.exe" /fo table | findstr /v "INFO:"
)

echo.

REM Check ports
echo Port Status:
echo Checking if ports are in use...

netstat -an | findstr ":3001" >nul
if errorlevel 1 (
    echo ❌ Backend port 3001 is not in use
) else (
    echo ✓ Backend port 3001 is in use
)

netstat -an | findstr ":5173" >nul
if errorlevel 1 (
    echo ❌ Frontend port 5173 is not in use
) else (
    echo ✓ Frontend port 5173 is in use
)

echo.

REM Check application URLs
echo Application URLs:
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:3001
echo   Database: server\taskboss.db

echo.

REM Show system info
echo System Information:
echo   Node.js version: 
node --version 2>nul || echo   ❌ Node.js not found
echo   npm version: 
npm --version 2>nul || echo   ❌ npm not found

echo.

REM Check recent log files if they exist
if exist "server\logs" (
    echo Recent Logs:
    echo   Log directory: server\logs\
    dir /b server\logs 2>nul || echo   No log files found
) else (
    echo ℹ No log directory found
)

echo.
echo ========================================
echo    Status Check Complete
echo ========================================
echo.
echo Available commands:
echo   run.bat     - Start servers
echo   stop.bat    - Stop all servers
echo   setup.bat   - Complete setup
echo.
pause