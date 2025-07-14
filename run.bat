@echo off
echo ========================================
echo    TaskBoss-AI - Start Servers
echo ========================================
echo.

REM Check if .env files exist
if not exist ".env" (
    echo ❌ Configuration files not found!
    echo Please run setup.bat first to configure the application.
    echo.
    pause
    exit /b 1
)

if not exist "server\.env" (
    echo ❌ Server configuration not found!
    echo Please run setup.bat first to configure the application.
    echo.
    pause
    exit /b 1
)

REM Check if database exists
if not exist "server\taskboss.db" (
    echo ❌ Database not found!
    echo Please run setup.bat first to set up the database.
    echo.
    pause
    exit /b 1
)

REM Check if dependencies are installed
if not exist "node_modules" (
    echo ❌ Frontend dependencies not found!
    echo Please run setup.bat first to install dependencies.
    echo.
    pause
    exit /b 1
)

if not exist "server\node_modules" (
    echo ❌ Server dependencies not found!
    echo Please run setup.bat first to install dependencies.
    echo.
    pause
    exit /b 1
)

echo Starting TaskBoss-AI servers...
echo.

echo Starting backend server...
start "TaskBoss-AI Backend" cmd /k "cd server && npm start"

echo.
echo Waiting for backend server to start...
timeout /t 3 /nobreak >nul

echo Starting frontend development server...
start "TaskBoss-AI Frontend" cmd /k "npm run dev"

echo.
echo Opening application in browser...
timeout /t 5 /nobreak >nul
start http://localhost:5173

echo.
echo ========================================
echo    TaskBoss-AI is running!
echo ========================================
echo Backend server: http://localhost:3001
echo Frontend server: http://localhost:5173
echo Database: SQLite (server/taskboss.db)
echo.
echo Use stop.bat to stop all servers
echo Use status.bat to check server status
echo.
echo Press any key to exit...
pause >nul