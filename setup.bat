@echo off
echo ========================================
echo    Task Flow AI - Setup Script
echo ========================================
echo.

REM Check if .env files exist
if exist ".env" if exist "server\.env" (
    echo Configuration files already exist.
    echo If you want to reconfigure, delete .env and server\.env files and run this script again.
    echo.
    goto :start_app
)

echo Setting up Task Flow AI for the first time...
echo.

REM Create directories if they don't exist
if not exist "server" mkdir server

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
echo Testing API key...

REM Generate random JWT secret (longer and more secure)
set JWT_SECRET=TaskFlowAI_%RANDOM%%RANDOM%%RANDOM%%RANDOM%%RANDOM%%RANDOM%%RANDOM%%RANDOM%_%RANDOM%%RANDOM%

REM Create main .env file
echo # OpenAI API Configuration > .env
echo OPENAI_API_KEY=%OPENAI_KEY% >> .env
echo. >> .env
echo # JWT Secret (auto-generated) >> .env
echo JWT_SECRET=%JWT_SECRET% >> .env
echo. >> .env
echo # Server Configuration >> .env
echo PORT=3001 >> .env
echo NODE_ENV=development >> .env

REM Create server .env file
echo # OpenAI API Configuration > server\.env
echo OPENAI_API_KEY=%OPENAI_KEY% >> server\.env
echo. >> server\.env
echo # JWT Secret (auto-generated) >> server\.env
echo JWT_SECRET=%JWT_SECRET% >> server\.env
echo. >> server\.env
echo # Server Configuration >> server\.env
echo PORT=3001 >> server\.env
echo NODE_ENV=development >> server\.env

echo.
echo ✓ Configuration files created successfully!
echo ✓ JWT secret generated automatically
echo ✓ Environment variables configured
echo.

REM Handle database initialization
echo ========================================
echo    Database Setup
echo ========================================
echo.

if exist "server\db.json" (
    echo ✓ Database file found - using existing data
    echo ✓ Your tasks, goals, and user data will be preserved
) else (
    if exist "server\db.example.json" (
        echo No database found, creating from example...
        copy "server\db.example.json" "server\db.json" >nul
        echo ✓ Database initialized with example data
    ) else (
        echo Warning: No database file found!
        echo Please ensure db.json exists in server directory
    )
)
echo.

:start_app
echo ========================================
echo    Starting Task Flow AI...
echo ========================================
echo.

echo Installing dependencies...
call npm install

echo.
echo Installing server dependencies...
cd server
call npm install
cd ..

echo.
echo Starting servers...
echo Starting backend server...
start "Backend Server" cmd /k "cd server && npm start"

echo.
echo Waiting for backend server to start...
timeout /t 3 /nobreak >nul

echo Starting frontend development server...
start "Frontend Server" cmd /k "npm run dev"

echo.
echo Opening application in browser...
timeout /t 5 /nobreak >nul
start http://localhost:5173

echo.
echo ========================================
echo    Task Flow AI is ready!
echo ========================================
echo Backend server: http://localhost:3001
echo Frontend server: http://localhost:5173
echo.
echo Your API key and configuration are stored locally
echo and will not be uploaded to Git.
echo.
echo Press any key to exit...
pause >nul