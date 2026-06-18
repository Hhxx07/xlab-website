CREATE TABLE IF NOT EXISTS pending_registrations (
    id            UUID PRIMARY KEY,
    email         TEXT NOT NULL UNIQUE,
    username      TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    token_hash    TEXT NOT NULL UNIQUE,
    expires_at    TIMESTAMPTZ NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pending_registrations_token
    ON pending_registrations(token_hash);

CREATE INDEX IF NOT EXISTS idx_pending_registrations_expires
    ON pending_registrations(expires_at);
