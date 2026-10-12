# Luggo - Luggage Storage Microservices Platform

## 🚀 Quick Start Guide

### Prerequisites
Before starting the services, ensure you have:
- ✅ **Java 17+** installed
- ✅ **Node.js 18+** and npm installed
- ✅ **PostgreSQL** running on port 5432
- ✅ **Redis** running on port 6379
- ✅ **Kafka** running on port 9092 (optional for full functionality)

### Required PostgreSQL Databases
Create these databases in PostgreSQL:
```sql
CREATE DATABASE user_db;
CREATE DATABASE provider_db;
CREATE DATABASE booking_db;
CREATE DATABASE payment_db;
```

Default credentials (as configured in application.yml files):
- Username: `postgres`
- Password: `postgres`

---

## 🎯 Starting All Services

### Option 1: Automated Startup (Recommended)
Simply double-click the batch file:
```
start-all-services.bat
```

This will open 6 terminal windows, one for each service:
1. **User Service** (Port 8081)
2. **Provider Service** (Port 8082)
3. **Booking Service** (Port 8084)
4. **Payment Service** (Port 8085)
5. **API Gateway** (Port 8080)
6. **Frontend React App** (Port 5174)

**Wait 30-60 seconds** for all services to fully initialize.

### Option 2: Manual Startup
If you prefer to start services individually:

#### Backend Services:
```bash
# Terminal 1 - User Service
cd User/User
mvnw.cmd spring-boot:run

# Terminal 2 - Provider Service
cd Provider/Provider
mvnw.cmd spring-boot:run

# Terminal 3 - Booking Service
cd Booking/Booking
mvnw.cmd spring-boot:run

# Terminal 4 - Payment Service
cd Payment/Payment
mvnw.cmd spring-boot:run

# Terminal 5 - API Gateway
cd ApiGateWay/ApiGateWay
mvnw.cmd spring-boot:run

# Terminal 6 - Frontend
cd L_Frontend
npm install  # First time only
npm run dev
```

---

## 🛑 Stopping All Services

### Automated Shutdown
Double-click:
```
stop-all-services.bat
```

### Manual Shutdown
Close each terminal window or press `Ctrl+C` in each terminal.

---

## 🌐 Service URLs

Once all services are running:

### Frontend Application
- **Main App**: http://localhost:5174

### API Gateway (Use this for all API calls)
- **Gateway**: http://localhost:8080

### Direct Service Access (for debugging)
- **User Service**: http://localhost:8081
- **Provider Service**: http://localhost:8082
- **Booking Service**: http://localhost:8084
- **Payment Service**: http://localhost:8085

### Health Check Endpoints
- User Service: http://localhost:8081/actuator/health
- Provider Service: http://localhost:8082/actuator/health
- Booking Service: http://localhost:8084/actuator/health
- Payment Service: http://localhost:8085/actuator/health
- API Gateway: http://localhost:8080/actuator/health

---

## 📋 Service Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (React)                    │
│                   http://localhost:5174                 │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│              API Gateway (Spring Cloud)                 │
│                   Port 8080                             │
│  - Routes requests to microservices                     │
│  - JWT authentication filter                            │
│  - Rate limiting (Redis)                                │
│  - CORS configuration                                   │
└──────┬────────┬───────────┬───────────┬────────────────┘
       │        │           │           │
       ▼        ▼           ▼           ▼
   ┌─────┐  ┌─────┐    ┌─────┐    ┌─────┐
   │User │  │Prov │    │Book │    │Pay  │
   │8081 │  │8082 │    │8084 │    │8085 │
   └─────┘  └─────┘    └─────┘    └─────┘
       │        │           │           │
       └────────┴───────────┴───────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │    PostgreSQL DBs     │
            │  user_db, provider_db │
            │  booking_db, payment_db│
            └───────────────────────┘
```

---

## 🔑 Default Test Users

After services start, you can register new users or use these test credentials (if seeded):

### Regular User
- Email: `user@example.com`
- Password: `password123`

### Provider Account
- Email: `provider@example.com`
- Password: `password123`

### Admin Account
- Email: `admin@example.com`
- Password: `admin123`

---

## ✅ Verification Checklist

After starting all services, verify:

1. ✅ All 6 terminal windows are open and showing logs
2. ✅ No error messages in any terminal (warnings are OK)
3. ✅ Each service shows "Started [ServiceName]Application in X seconds"
4. ✅ Frontend shows "Local: http://localhost:5174/"
5. ✅ Open http://localhost:5174 in your browser
6. ✅ You see the Luggo login/registration page

---

## 🐛 Troubleshooting

### Port Already in Use
If you see "Port already in use" errors:
```bash
# Windows: Check what's using the port
netstat -ano | findstr :8080
netstat -ano | findstr :8081
netstat -ano | findstr :5174

# Kill the process using the port
taskkill /PID <process_id> /F
```

### Database Connection Errors
- Ensure PostgreSQL is running
- Verify databases exist: `user_db`, `provider_db`, `booking_db`, `payment_db`
- Check credentials in `application.yml` files

### Redis Connection Errors
- API Gateway and User Service require Redis
- Start Redis or comment out Redis configuration if not needed

### Kafka Connection Errors (Optional)
- Kafka is optional for basic functionality
- Services will show warnings but continue to work
- Comment out Kafka configuration if not using

### Frontend Build Errors
```bash
cd L_Frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

## 📦 First Time Setup

### 1. Install Frontend Dependencies
```bash
cd L_Storing_System/L_Frontend
npm install
```

### 2. Build Backend Services (Optional)
```bash
# Each service directory
mvnw.cmd clean package -DskipTests
```

### 3. Database Migration
Flyway will automatically run migrations on first startup. Look for:
```
Flyway: Successfully applied X migration(s)
```

---

## 🔄 Development Workflow

1. **Start all services** using `start-all-services.bat`
2. **Make changes** to your code
3. **Backend**: Stop service (Ctrl+C), restart with `mvnw spring-boot:run`
4. **Frontend**: Changes auto-reload (Hot Module Replacement)
5. **Test** your changes in the browser
6. **Stop all services** when done using `stop-all-services.bat`

---

## 📊 Monitoring & Logs

### View Logs
Each service runs in its own terminal window. Watch for:
- ✅ Green "Started" messages = Service is ready
- ⚠️ Yellow "WARN" messages = Usually safe to ignore
- ❌ Red "ERROR" messages = Need attention

### Actuator Endpoints
Access detailed health information:
- http://localhost:8081/actuator/health (User Service)
- http://localhost:8082/actuator/health (Provider Service)
- http://localhost:8084/actuator/health (Booking Service)
- http://localhost:8085/actuator/health (Payment Service)

---

## 🎨 Recent UI Improvements (2026-09-26)

The frontend has been cleaned up and simplified:
- ✅ Removed rating/star components
- ✅ Cleaner, professional color palette (neutral tones + blue accent)
- ✅ Improved typography and spacing consistency
- ✅ Removed unnecessary UI clutter
- ✅ Better responsive design
- ✅ Simplified navigation and layout

---

## 📝 API Documentation

### Authentication
All API requests (except login/register) require a JWT token:
```
Authorization: Bearer <your-jwt-token>
```

### Key Endpoints
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/providers` - List all providers
- `GET /api/v1/locations` - List storage locations
- `POST /api/v1/bookings` - Create booking
- `GET /api/v1/bookings/user/{userId}` - Get user's bookings
- `GET /api/v1/payments` - Payment history

---

## 🆘 Support

If you encounter issues:
1. Check all prerequisites are installed and running
2. Verify all databases are created
3. Review logs in each service terminal
4. Ensure no port conflicts
5. Try stopping all services and restarting

---

**Last Updated**: September 26, 2026
**Platform**: Luggo - Luggage Storage Marketplace
**Architecture**: Spring Boot Microservices + React Frontend
