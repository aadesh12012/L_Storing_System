@echo off
echo ========================================
echo  Luggo Service Health Check
echo ========================================
echo.
echo Checking if all services are running...
echo.

echo [1] User Service (Port 8081)
curl -s http://localhost:8081/actuator/health > nul 2>&1
if %errorlevel% equ 0 (
    echo    ✓ Running
) else (
    echo    ✗ Not responding
)

echo [2] Provider Service (Port 8082)
curl -s http://localhost:8082/actuator/health > nul 2>&1
if %errorlevel% equ 0 (
    echo    ✓ Running
) else (
    echo    ✗ Not responding
)

echo [3] Booking Service (Port 8084)
curl -s http://localhost:8084/actuator/health > nul 2>&1
if %errorlevel% equ 0 (
    echo    ✓ Running
) else (
    echo    ✗ Not responding
)

echo [4] Payment Service (Port 8085)
curl -s http://localhost:8085/actuator/health > nul 2>&1
if %errorlevel% equ 0 (
    echo    ✓ Running
) else (
    echo    ✗ Not responding
)

echo [5] API Gateway (Port 8080)
curl -s http://localhost:8080/actuator/health > nul 2>&1
if %errorlevel% equ 0 (
    echo    ✓ Running
) else (
    echo    ✗ Not responding
)

echo [6] Frontend (Port 5174)
curl -s http://localhost:5174 > nul 2>&1
if %errorlevel% equ 0 (
    echo    ✓ Running
) else (
    echo    ✗ Not responding
)

echo.
echo ========================================
echo Health check complete!
echo ========================================
echo.
pause
