-- Incoming Payments Table Schema for PostgreSQL / SQLite
-- FF Rivals Tour BD: 1-Click Mobile Wallet Deposit Verification System

CREATE TABLE IF NOT EXISTS incoming_payments (
    id VARCHAR(64) PRIMARY KEY,
    trx_id VARCHAR(64) UNIQUE NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    provider VARCHAR(20) NOT NULL, -- 'BKASH', 'NAGAD', 'ROCKET'
    sender VARCHAR(50) NOT NULL,
    raw_message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'UNCLAIMED' NOT NULL, -- 'UNCLAIMED', 'CLAIMED'
    claimed_by VARCHAR(100),
    claimed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_incoming_payments_trx_id ON incoming_payments(trx_id);
