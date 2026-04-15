CREATE TABLE IF NOT EXISTS password_resets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_resets_email ON password_resets(email);
CREATE INDEX IF NOT EXISTS idx_password_resets_expires ON password_resets(expires_at);

ALTER TABLE password_resets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role full access on password_resets"
    ON password_resets FOR ALL
    USING (true)
    WITH CHECK (true);
