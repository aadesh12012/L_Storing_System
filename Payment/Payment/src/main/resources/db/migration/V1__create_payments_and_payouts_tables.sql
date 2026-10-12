-- Flyway migration: V1__create_payments_and_payouts_tables.sql
-- Description: Create tables for platform commission, payments, payouts, and refunds

CREATE TABLE IF NOT EXISTS commission_configs (
    id BIGSERIAL PRIMARY KEY,
    commission_rate NUMERIC(5, 4) NOT NULL DEFAULT 0.1500,
    min_hourly_rate NUMERIC(10, 2) DEFAULT 1.00,
    max_hourly_rate NUMERIC(10, 2) DEFAULT 100.00,
    updated_by_admin_id BIGINT,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

-- Seed initial platform commission setting (15%)
INSERT INTO commission_configs (commission_rate, min_hourly_rate, max_hourly_rate, updated_by_admin_id, updated_at)
VALUES (0.1500, 1.00, 100.00, 1, NOW());

CREATE TABLE IF NOT EXISTS payments (
    id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    provider_id BIGINT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    commission_rate NUMERIC(5, 4) NOT NULL,
    commission_amount NUMERIC(10, 2) NOT NULL,
    provider_earnings NUMERIC(10, 2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    payment_method VARCHAR(30) NOT NULL DEFAULT 'CREDIT_CARD',
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    gateway_txn_id VARCHAR(100),
    failure_reason VARCHAR(500),
    refunded_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider_id ON payments(provider_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

CREATE TABLE IF NOT EXISTS payouts (
    id BIGSERIAL PRIMARY KEY,
    provider_id BIGINT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    payout_method VARCHAR(50) NOT NULL DEFAULT 'STRIPE_CONNECT',
    destination_account VARCHAR(100),
    reference_id VARCHAR(100),
    scheduled_date DATE,
    processed_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payouts_provider_id ON payouts(provider_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);

CREATE TABLE IF NOT EXISTS refunds (
    id BIGSERIAL PRIMARY KEY,
    payment_id BIGINT NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    booking_id BIGINT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    reason VARCHAR(500) NOT NULL,
    initiated_by_admin_id BIGINT NOT NULL,
    gateway_refund_id VARCHAR(100),
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refunds_payment_id ON refunds(payment_id);
CREATE INDEX IF NOT EXISTS idx_refunds_booking_id ON refunds(booking_id);
