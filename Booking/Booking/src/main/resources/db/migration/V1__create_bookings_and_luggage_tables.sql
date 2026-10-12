CREATE TABLE IF NOT EXISTS bookings (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    provider_id BIGINT NOT NULL,
    location_id BIGINT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'REQUESTED',
    luggage_count INTEGER NOT NULL,
    expected_drop_off_time TIMESTAMP NOT NULL,
    expected_pickup_time TIMESTAMP NOT NULL,
    actual_drop_off_time TIMESTAMP,
    actual_pickup_time TIMESTAMP,
    hourly_rate NUMERIC(10, 2) NOT NULL,
    estimated_amount NUMERIC(10, 2) NOT NULL,
    total_amount NUMERIC(10, 2),
    special_instructions TEXT,
    cancellation_reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_provider_id ON bookings(provider_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

CREATE TABLE IF NOT EXISTS luggage_items (
    id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    size VARCHAR(20) NOT NULL,
    type VARCHAR(30) NOT NULL,
    description VARCHAR(255),
    photo_url VARCHAR(500)
);

CREATE INDEX IF NOT EXISTS idx_luggage_items_booking_id ON luggage_items(booking_id);
