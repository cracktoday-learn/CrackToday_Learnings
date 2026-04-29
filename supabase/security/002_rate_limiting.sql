-- ============================================================================
-- RATE LIMITING FOR SECURITY
-- Prevents brute force attacks and API abuse
-- ============================================================================

-- Create table to track rate limits
CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT NOT NULL UNIQUE, -- IP address or user identifier
    action TEXT NOT NULL, -- 'login', 'signup', 'api_call'
    count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    blocked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_key_action ON rate_limits(key, action);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits(window_start);

-- Enable RLS
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role can access rate limits
DROP POLICY IF EXISTS "Service role can manage rate limits" ON rate_limits;
CREATE POLICY "Service role can manage rate limits" ON rate_limits
    FOR ALL
    TO service_role
    USING (true);

-- Function to check rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_key TEXT,
    p_action TEXT,
    p_max_requests INTEGER DEFAULT 5,
    p_window_minutes INTEGER DEFAULT 15
)
RETURNS BOOLEAN AS $$
DECLARE
    v_record rate_limits%ROWTYPE;
    v_window_start TIMESTAMP WITH TIME ZONE;
    v_blocked_until TIMESTAMP WITH TIME ZONE;
BEGIN
    v_window_start := timezone('utc'::text, now()) - (p_window_minutes || ' minutes')::INTERVAL;
    
    -- Check if currently blocked
    SELECT * INTO v_record
    FROM rate_limits
    WHERE key = p_key 
    AND action = p_action
    AND blocked_until > timezone('utc'::text, now());
    
    IF FOUND THEN
        RETURN FALSE; -- Still blocked
    END IF;
    
    -- Get or create rate limit record for current window
    SELECT * INTO v_record
    FROM rate_limits
    WHERE key = p_key 
    AND action = p_action
    AND window_start > v_window_start;
    
    IF FOUND THEN
        -- Check if over limit
        IF v_record.count >= p_max_requests THEN
            -- Block for 30 minutes
            UPDATE rate_limits
            SET blocked_until = timezone('utc'::text, now()) + interval '30 minutes'
            WHERE id = v_record.id;
            RETURN FALSE;
        END IF;
        
        -- Increment count
        UPDATE rate_limits
        SET count = count + 1
        WHERE id = v_record.id;
        RETURN TRUE;
    ELSE
        -- Create new window
        INSERT INTO rate_limits (key, action, count, window_start)
        VALUES (p_key, p_action, 1, timezone('utc'::text, now()))
        ON CONFLICT (key) DO UPDATE SET
            action = EXCLUDED.action,
            count = 1,
            window_start = timezone('utc'::text, now()),
            blocked_until = NULL;
        RETURN TRUE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get remaining attempts
CREATE OR REPLACE FUNCTION get_rate_limit_status(
    p_key TEXT,
    p_action TEXT,
    p_max_requests INTEGER DEFAULT 5,
    p_window_minutes INTEGER DEFAULT 15
)
RETURNS TABLE (
    allowed BOOLEAN,
    remaining INTEGER,
    reset_at TIMESTAMP WITH TIME ZONE,
    blocked_until TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    v_record rate_limits%ROWTYPE;
    v_window_start TIMESTAMP WITH TIME ZONE;
BEGIN
    v_window_start := timezone('utc'::text, now()) - (p_window_minutes || ' minutes')::INTERVAL;
    
    SELECT * INTO v_record
    FROM rate_limits
    WHERE key = p_key 
    AND action = p_action
    AND window_start > v_window_start;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT TRUE, p_max_requests, v_window_start + (p_window_minutes || ' minutes')::INTERVAL, NULL::TIMESTAMP WITH TIME ZONE;
        RETURN;
    END IF;
    
    IF v_record.blocked_until > timezone('utc'::text, now()) THEN
        RETURN QUERY SELECT FALSE, 0, v_window_start + (p_window_minutes || ' minutes')::INTERVAL, v_record.blocked_until;
        RETURN;
    END IF;
    
    RETURN QUERY SELECT 
        TRUE, 
        GREATEST(0, p_max_requests - v_record.count),
        v_record.window_start + (p_window_minutes || ' minutes')::INTERVAL,
        NULL::TIMESTAMP WITH TIME ZONE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup old rate limit records (run periodically)
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS void AS $$
BEGIN
    DELETE FROM rate_limits
    WHERE window_start < timezone('utc'::text, now()) - interval '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (optional - requires pg_cron extension)
-- SELECT cron.schedule('cleanup-rate-limits', '0 0 * * *', 'SELECT cleanup_rate_limits()');
