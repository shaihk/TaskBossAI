@echo off
echo ========================================
echo    TaskBoss-AI - Complete Setup Script
echo ========================================
echo.

REM Stop all running servers first
echo Stopping any running servers...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im npm.exe >nul 2>&1
echo ✓ All Node.js processes stopped

echo.
echo Setting up TaskBoss-AI from scratch...
echo This will install all dependencies and configure everything.
echo.

REM Clean up old installations
echo ========================================
echo    Cleaning Previous Installation
echo ========================================
echo.

if exist "node_modules" (
    echo Removing old frontend dependencies...
    rmdir /s /q node_modules
    echo ✓ Frontend node_modules removed
)

if exist "server\node_modules" (
    echo Removing old server dependencies...
    rmdir /s /q server\node_modules
    echo ✓ Server node_modules removed
)

if exist "dist" (
    echo Removing old build files...
    rmdir /s /q dist
    echo ✓ Build files removed
)

if exist "package-lock.json" (
    del package-lock.json
    echo ✓ Frontend package-lock.json removed
)

if exist "server\package-lock.json" (
    del server\package-lock.json
    echo ✓ Server package-lock.json removed
)

echo.
echo ========================================
echo    OpenAI API Key Configuration
echo ========================================
echo.
echo To use the AI features (chat, task suggestions, consultation),
echo you need an OpenAI API key.
echo.
echo How to get your OpenAI API key:
echo 1. Go to: https://platform.openai.com/account/api-keys
echo 2. Sign in to your OpenAI account (or create one)
echo 3. Click "Create new secret key"
echo 4. Copy the key (it starts with sk-...)
echo.
echo IMPORTANT: Keep this key secure and never share it publicly!
echo.

:ask_key
set /p OPENAI_KEY="Please enter your OpenAI API key: "

if "%OPENAI_KEY%"=="" (
    echo Error: API key cannot be empty!
    echo.
    goto :ask_key
)

REM Basic validation - check if key starts with sk-
echo %OPENAI_KEY% | findstr /B "sk-" >nul
if errorlevel 1 (
    echo Warning: API key should start with 'sk-'
    echo Are you sure this is correct?
    set /p confirm="Continue anyway? (y/n): "
    if /i not "%confirm%"=="y" goto :ask_key
)

echo.
echo ✓ API key configured

REM Generate random JWT secret (longer and more secure)
set JWT_SECRET=TaskBossAI_%RANDOM%%RANDOM%%RANDOM%%RANDOM%%RANDOM%%RANDOM%%RANDOM%%RANDOM%_%RANDOM%%RANDOM%

REM Remove old .env files
if exist ".env" del .env
if exist "server\.env" del server\.env

REM Create main .env file
echo # TaskBoss-AI Configuration > .env
echo # Generated on %date% %time% >> .env
echo. >> .env
echo # OpenAI API Configuration >> .env
echo OPENAI_API_KEY=%OPENAI_KEY% >> .env
echo. >> .env
echo # JWT Secret (auto-generated) >> .env
echo JWT_SECRET=%JWT_SECRET% >> .env
echo. >> .env
echo # Server Configuration >> .env
echo PORT=3001 >> .env
echo NODE_ENV=development >> .env
echo. >> .env
echo # Database Configuration >> .env
echo DB_PATH=./server/taskboss.db >> .env

REM Create server .env file
if not exist "server" mkdir server
echo # TaskBoss-AI Server Configuration > server\.env
echo # Generated on %date% %time% >> server\.env
echo. >> server\.env
echo # OpenAI API Configuration >> server\.env
echo OPENAI_API_KEY=%OPENAI_KEY% >> server\.env
echo. >> server\.env
echo # JWT Secret (auto-generated) >> server\.env
echo JWT_SECRET=%JWT_SECRET% >> server\.env
echo. >> server\.env
echo # Server Configuration >> server\.env
echo PORT=3001 >> server\.env
echo NODE_ENV=development >> server\.env
echo. >> server\.env
echo # Database Configuration >> server\.env
echo DB_PATH=./taskboss.db >> server\.env

echo.
echo ✓ Configuration files created successfully!
echo ✓ JWT secret generated automatically
echo ✓ Environment variables configured
echo.

REM Handle database setup
echo ========================================
echo    Database Setup (SQLite)
echo ========================================
echo.

if exist "server\taskboss.db" (
    echo ✓ SQLite database found - using existing data
    echo ✓ Your tasks, goals, and user data will be preserved
) else (
    if exist "server\db.json" (
        echo JSON database found, will migrate to SQLite after dependencies...
    ) else (
        echo No existing database found, will create new SQLite database...
    )
)
echo.

echo ========================================
echo    Installing Dependencies
echo ========================================
echo.

echo Installing frontend dependencies...
call npm install
if errorlevel 1 (
    echo ❌ Frontend dependency installation failed!
    pause
    exit /b 1
)
echo ✓ Frontend dependencies installed

echo.
echo Installing server dependencies...
cd server
call npm install
if errorlevel 1 (
    echo ❌ Server dependency installation failed!
    pause
    exit /b 1
)
echo ✓ Server dependencies installed

echo.
echo Installing SQLite3...
call npm install sqlite3@^5.1.6
if errorlevel 1 (
    echo ❌ SQLite3 installation failed!
    pause
    exit /b 1
)
echo ✓ SQLite3 installed

REM Setup database after dependencies are installed
echo.
echo Setting up SQLite database...

if exist "taskboss.db" (
    echo ✓ SQLite database already exists
) else (
    if exist "db.json" (
        echo Migrating data from JSON to SQLite...
        node migrate-from-json.js
        if errorlevel 1 (
            echo ❌ Migration failed!
            pause
            exit /b 1
        )
        echo ✓ Data migrated from JSON to SQLite successfully
    ) else (
        echo Creating new SQLite database...
        node create-new-db.js
        if errorlevel 1 (
            echo ❌ Database creation failed!
            pause
            exit /b 1
        )
        echo ✓ New SQLite database created
    )
)

cd ..

echo.
echo ========================================
echo    Starting TaskBoss-AI...
echo ========================================
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
echo    TaskBoss-AI Setup Complete!
echo ========================================
echo Backend server: http://localhost:3001
echo Frontend server: http://localhost:5173
echo Database: SQLite (server/taskboss.db)
echo.
echo Your API key and configuration are stored locally
echo and will not be uploaded to Git.
echo.
echo Useful commands:
echo   run.bat     - Start servers (after setup)
echo   stop.bat    - Stop all servers
echo   status.bat  - Check server status
echo.
echo Press any key to exit...
pause >nul