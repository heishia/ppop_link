-- Add phone_number field to users table
-- Migration 005: Add phone number support for PPOP Auth verified phone numbers

ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20) UNIQUE;

-- Add index for phone number lookups
CREATE INDEX IF NOT EXISTS idx_users_phone_number ON users(phone_number);

-- Add comment
COMMENT ON COLUMN users.phone_number IS 'Verified phone number from PPOP Auth (E.164 format)';

