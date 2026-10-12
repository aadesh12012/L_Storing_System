# Luggage Storage Marketplace — Requirements Document

## 1. Project overview

A two-sided marketplace platform where users can find nearby storage providers, drop off luggage for a fee, and providers manage their own listings, pricing, and bookings. An admin panel oversees the whole platform.

**Actors:** User, Provider, Admin

---

## 2. Functional requirements

### 2.1 User

| ID | Requirement |
|----|-------------|
| U-1 | User can register/login via email, phone (OTP), or social login |
| U-2 | User can view/edit their profile |
| U-3 | User can search for storage providers near their current location or a searched address |
| U-4 | User can filter results by distance, price, rating, and available capacity |
| U-5 | User can view a provider's details: photos, address, hourly rate, operating hours, reviews |
| U-6 | User can create a booking request: number of luggage items, size/type of each, expected drop-off time, expected duration |
| U-7 | User can see booking status: pending, approved, declined, active, completed, cancelled |
| U-8 | User receives a notification when the provider approves/declines the request |
| U-9 | User can cancel a booking before it becomes active |
| U-10 | User is charged automatically based on actual duration once the booking is marked completed |
| U-11 | User can view payment history and receipts |
| U-12 | User can rate and review the provider after service completion |
| U-13 | User can view an active booking's running cost estimate in real time |

### 2.2 Provider

| ID | Requirement |
|----|-------------|
| P-1 | Provider can register and submit KYC/verification documents |
| P-2 | Provider account requires admin approval before going live |
| P-3 | Provider can create/edit one or more storage locations (address, coordinates, capacity, operating hours, photos) |
| P-4 | Provider sets their own hourly storage rate (within any platform-defined min/max) |
| P-5 | Provider receives incoming booking requests with luggage details |
| P-6 | Provider can approve or decline a booking request |
| P-7 | Provider can mark a booking as "active" once luggage is physically received |
| P-8 | Provider can mark a booking as "completed" once luggage is picked up, triggering final billing |
| P-9 | Provider can view their booking history and earnings |
| P-10 | Provider can view payout schedule and payout history |
| P-11 | Provider can set capacity limits (e.g. max bags at a time) and go "unavailable" when full |
| P-12 | Provider can view ratings/reviews left by users |

### 2.3 Admin

| ID | Requirement |
|----|-------------|
| A-1 | Admin can view and approve/reject new provider registrations (KYC review) |
| A-2 | Admin can suspend or ban a user or provider account |
| A-3 | Admin can view all bookings across the platform with search/filter |
| A-4 | Admin can manually intervene on a booking (force cancel, issue refund) for disputes |
| A-5 | Admin can set the platform commission percentage taken from each transaction |
| A-6 | Admin can set global pricing guardrails (min/max hourly rate) |
| A-7 | Admin can moderate provider listing photos/content |
| A-8 | Admin can view platform analytics: total bookings, GMV, active providers/users, growth trends |
| A-9 | Admin can send platform-wide or targeted announcements/notifications |
| A-10 | Admin can manage platform configuration (supported cities, luggage size categories, etc.) |

---

## 3. Non-functional requirements

| Category | Requirement |
|----------|-------------|
| Performance | Nearby-provider search should respond in under 500ms for typical query loads |
| Scalability | Each microservice must scale independently; system should support horizontal scaling under load |
| Availability | Core booking and payment services should target 99.9% uptime |
| Security | All traffic over HTTPS/TLS; JWT-based auth; role-based access control enforced at the gateway and service level |
| Data isolation | Each microservice owns its own database (no direct cross-service DB access) |
| Consistency | Booking state transitions must be atomic; use event-driven updates for cross-service side effects (billing, notifications) |
| Auditability | All admin actions (bans, refunds, commission changes) must be logged with timestamp and admin ID |
| Compliance | Payment handling must be PCI-DSS compliant (delegate card data to the payment gateway, never store raw card data) |
| Localization | Support multiple currencies/locales if expanding beyond one country |

---

## 4. System architecture summary

- **API Gateway** — single entry point, authentication, routing, rate limiting
- **Identity service** — accounts, roles, KYC status
- **Provider/listing service** — provider profiles, storage locations, pricing, capacity
- **Location service** — geospatial search for nearby providers
- **Booking service** — booking lifecycle state machine
- **Luggage/inventory service** — per-booking luggage item details
- **Payment service** — billing calculation, payment capture, provider payouts
- **Notification service** — push/SMS/email
- **Review/rating service** — post-service ratings
- **Media/storage service** — photo storage (S3 or equivalent)
- **Admin service** — backs the admin panel
- **Event bus** (Kafka/RabbitMQ) — async communication between services
- **Data layer** — PostgreSQL (per service) + PostGIS/Elasticsearch (geo-search) + Redis (cache)

---

## 5. Booking lifecycle (state machine)

```
requested → pending_approval → approved → active → completed → paid
                              ↘ declined (terminal)
active/pending → cancelled (terminal, subject to cancellation policy)
```

---

## 6. Data requirements (high level)

**User**: id, name, email, phone, password hash, role, created_at
**Provider**: id, user_id, business_name, KYC_status, hourly_rate, capacity, rating_avg
**Location**: id, provider_id, address, lat, lng, operating_hours
**Booking**: id, user_id, provider_id, status, luggage_count, drop_off_time, pickup_time, total_amount
**Luggage item**: id, booking_id, size, type, photo_url
**Payment**: id, booking_id, amount, commission, provider_payout, status, gateway_txn_id
**Review**: id, booking_id, rating, comment

---

## 7. Out of scope (v1)

- Multi-language support
- Provider staff sub-accounts (multiple employees per provider)
- Insurance/liability coverage for stored items
- International currency support

---

## 8. Assumptions

- Payments are processed through a third-party gateway (e.g. Stripe Connect) that handles PCI compliance and provider payouts
- Providers physically inspect and receive luggage; the platform does not handle physical custody
- Initial launch targets a single country/currency
