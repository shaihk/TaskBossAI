@echo off
echo ========================================
echo    TaskBoss-AI - Stop All Servers
echo ========================================
echo.

echo Stopping all TaskBoss-AI processes...
echo.

REM Stop all Node.js processes
echo Stopping Node.js processes...
taskkill /f /im node.exe >nul 2>&1
if errorlevel 1 (
    echo ℹ No Node.js processes were running
) else (
    echo ✓ Node.js processes stopped
)

REM Stop all npm processes
echo Stopping npm processes...
taskkill /f /im npm.exe >nul 2>&1
if errorlevel 1 (
    echo ℹ No npm processes were running
) else (
    echo ✓ npm processes stopped
)

REM Close specific TaskBoss-AI windows if they exist
echo Closing TaskBoss-AI windows...
taskkill /fi "WindowTitle eq TaskBoss-AI Backend*" /f >nul 2>&1
taskkill /fi "WindowTitle eq TaskBoss-AI Frontend*" /f >nul 2>&1

echo.
echo ========================================
echo    All TaskBoss-AI servers stopped!
echo ========================================
echo.
echo To start the servers again, run:
echo   run.bat     - Start servers
echo   setup.bat   - Complete setup (if needed)
echo.
echo Press any key to exit...
pause >nul