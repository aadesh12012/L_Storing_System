@echo off
echo ========================================
echo Starting Luggo Microservices Platform
echo ========================================
echo.

echo [1/6] Starting User Service (Port 8081)...
start "User Service" cmd /k "cd User\User && mvnw.cmd spring-boot:run"
timeout /t 5 /nobreak > nul

echo [2/6] Starting Provider Service (Port 8082)...
start "Provider Service" cmd /k "cd Provider\Provider && mvnw.cmd spring-boot:run"
timeout /t 5 /nobreak > nul

echo [3/6] Starting Booking Service (Port 8084)...
start "Booking Service" cmd /k "cd Booking\Booking && mvnw.cmd spring-boot:run"
timeout /t 5 /nobreak > nul

echo [4/6] Starting Payment Service (Port 8085)...
start "Payment Service" cmd /k "cd Payment\Payment && mvnw.cmd spring-boot:run"
timeout /t 5 /nobreak > nul

echo [5/6] Starting API Gateway (Port 8080)...
start "API Gateway" cmd /k "cd ApiGateWay\ApiGateWay && mvnw.cmd spring-boot:run"
timeout /t 5 /nobreak > nul

echo [6/6] Starting Frontend React App (Port 5174)...
start "Frontend" cmd /k "cd L_Frontend && npm run dev"

echo.
echo ========================================
echo All services are starting up!
echo ========================================
echo.
echo Service URLs:
echo - API Gateway:      http://localhost:8080
echo - User Service:     http://localhost:8081
echo - Provider Service: http://localhost:8082
echo - Booking Service:  http://localhost:8084
echo - Payment Service:  http://localhost:8085
echo - Frontend App:     http://localhost:5174
echo.
echo Wait 30-60 seconds for all services to be ready.
echo Check each terminal window for startup status.
echo.
pause
