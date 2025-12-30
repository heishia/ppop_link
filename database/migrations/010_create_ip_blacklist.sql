-- IP Blacklist Table
-- Track and block malicious IP addresses

CREATE TABLE IF NOT EXISTS ip_blacklist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ip_address VARCHAR(45) NOT NULL UNIQUE,  -- IPv4 (15) or IPv6 (45)
    reason VARCHAR(500) NOT NULL,
    blocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,  -- NULL means permanent block
    violation_count INTEGER DEFAULT 1,
    last_violation_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_permanent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_ip_blacklist_ip ON ip_blacklist(ip_address);
CREATE INDEX idx_ip_blacklist_expires ON ip_blacklist(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_ip_blacklist_active ON ip_blacklist(is_permanent, expires_at);

-- Comments
COMMENT ON TABLE ip_blacklist IS 'Tracks blocked IP addresses to prevent abuse';
COMMENT ON COLUMN ip_blacklist.ip_address IS 'IP address in IPv4 or IPv6 format';
COMMENT ON COLUMN ip_blacklist.reason IS 'Reason for blocking (e.g., rate limit exceeded, malicious pattern)';
COMMENT ON COLUMN ip_blacklist.expires_at IS 'When the block expires (NULL for permanent blocks)';
COMMENT ON COLUMN ip_blacklist.violation_count IS 'Number of violations before blocking';

