@echo off
echo Installing dependencies for Task Flow AI...
echo.

echo Installing main app dependencies...
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
echo Task Flow AI is starting up!
echo Backend server: http://localhost:3001
echo Frontend server: http://localhost:5173
echo.
echo Press any key to exit...
pause >nul