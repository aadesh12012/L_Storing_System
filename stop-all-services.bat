@echo off
echo Stopping all Luggo services...
echo.

echo Stopping Java processes (Spring Boot services)...
taskkill /F /FI "WINDOWTITLE eq User Service*" 2>nul
taskkill /F /FI "WINDOWTITLE eq Provider Service*" 2>nul
taskkill /F /FI "WINDOWTITLE eq Booking Service*" 2>nul
taskkill /F /FI "WINDOWTITLE eq Payment Service*" 2>nul
taskkill /F /FI "WINDOWTITLE eq API Gateway*" 2>nul

echo Stopping Node.js processes (Frontend)...
taskkill /F /FI "WINDOWTITLE eq Frontend*" 2>nul

echo.
echo All services stopped.
pause
