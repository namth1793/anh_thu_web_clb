@echo off
echo ====================================
echo   FPT CLB Hub - Khoi dong he thong
echo ====================================
echo.

echo [1/2] Khoi dong Backend (port 5000)...
start cmd /k "cd /d %~dp0backend && npm run dev"

timeout /t 3 /nobreak >nul

echo [2/2] Khoi dong Frontend (port 5173)...
start cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ====================================
echo   He thong dang chay!
echo   Backend:  http://localhost:5000
echo   Frontend: http://localhost:5173
echo ====================================
echo.
pause
