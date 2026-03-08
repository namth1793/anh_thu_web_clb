@echo off
echo ====================================
echo   FPT CLB Hub - Cai dat dependencies
echo ====================================
echo.

echo [1/2] Cai dat Backend dependencies...
cd /d %~dp0backend
call npm install
echo Backend OK!
echo.

echo [2/2] Cai dat Frontend dependencies...
cd /d %~dp0frontend
call npm install
echo Frontend OK!
echo.

echo ====================================
echo   Cai dat hoan tat!
echo   Chay: start.bat de bat dau
echo ====================================
pause
