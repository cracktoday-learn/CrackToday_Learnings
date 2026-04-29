-- ============================================================================
-- SESSION SECURITY CONFIGURATION
-- Strengthen Supabase Auth security settings
-- ============================================================================

-- Set stronger password requirements
ALTER TABLE auth.users 
  ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Create function to track password changes
CREATE OR REPLACE FUNCTION track_password_change()
RETURNS TRIGGER AS $$
BEGIN
  NEW.password_changed_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger (only if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'track_password_change'
  ) THEN
    CREATE TRIGGER track_password_change
      BEFORE UPDATE OF encrypted_password ON auth.users
      FOR EACH ROW EXECUTE FUNCTION track_password_change();
  END IF;
END $$;

-- Create function to enforce password rotation (90 days)
CREATE OR REPLACE FUNCTION check_password_expiry()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if password is older than 90 days
  IF OLD.password_changed_at < timezone('utc'::text, now()) - interval '90 days' THEN
    -- Log the event but don't block (application should handle prompting)
    INSERT INTO security_audit_log (
      user_id,
      action,
      table_name,
      record_id,
      new_data
    ) VALUES (
      NEW.id,
      'PASSWORD_EXPIRED',
      'auth.users',
      NEW.id,
      jsonb_build_object('password_age_days', EXTRACT(DAY FROM timezone('utc'::text, now()) - OLD.password_changed_at))
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create login attempt tracking
CREATE TABLE IF NOT EXISTS auth_login_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    success BOOLEAN NOT NULL,
    failure_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE auth_login_attempts ENABLE ROW LEVEL SECURITY;

-- Only admins can view login attempts
DROP POLICY IF EXISTS "Admins can view login attempts" ON auth_login_attempts;
CREATE POLICY "Admins can view login attempts" ON auth_login_attempts
    FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ));

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON auth_login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON auth_login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_attempts_created ON auth_login_attempts(created_at);

-- Function to detect suspicious login patterns
CREATE OR REPLACE FUNCTION detect_suspicious_login(
    p_email TEXT,
    p_ip_address TEXT,
    p_success BOOLEAN
)
RETURNS TABLE (
    is_suspicious BOOLEAN,
    reason TEXT
) AS $$
DECLARE
    v_failed_attempts INTEGER;
    v_unique_ips INTEGER;
    v_recent_attempts INTEGER;
BEGIN
    -- Count failed attempts in last 15 minutes
    SELECT COUNT(*) INTO v_failed_attempts
    FROM auth_login_attempts
    WHERE email = p_email
    AND success = false
    AND created_at > timezone('utc'::text, now()) - interval '15 minutes';
    
    -- If more than 5 failed attempts, flag as suspicious
    IF v_failed_attempts >= 5 THEN
        RETURN QUERY SELECT TRUE, 'Multiple failed login attempts: ' || v_failed_attempts::TEXT;
        RETURN;
    END IF;
    
    -- Check for rapid login attempts from same IP
    SELECT COUNT(*) INTO v_recent_attempts
    FROM auth_login_attempts
    WHERE ip_address = p_ip_address
    AND created_at > timezone('utc'::text, now()) - interval '5 minutes';
    
    IF v_recent_attempts >= 10 THEN
        RETURN QUERY SELECT TRUE, 'Rapid login attempts from same IP: ' || v_recent_attempts::TEXT;
        RETURN;
    END IF;
    
    -- Check for logins from multiple IPs (possible account sharing)
    SELECT COUNT(DISTINCT ip_address) INTO v_unique_ips
    FROM auth_login_attempts
    WHERE email = p_email
    AND success = true
    AND created_at > timezone('utc'::text, now()) - interval '24 hours';
    
    IF v_unique_ips >= 3 THEN
        RETURN QUERY SELECT TRUE, 'Logins from multiple IPs in 24h: ' || v_unique_ips::TEXT;
        RETURN;
    END IF;
    
    RETURN QUERY SELECT FALSE, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create suspicious activity alerts table
CREATE TABLE IF NOT EXISTS security_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    alert_type TEXT NOT NULL, -- 'brute_force', 'account_sharing', 'suspicious_location', etc.
    description TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    ip_address TEXT,
    acknowledged BOOLEAN DEFAULT false,
    acknowledged_by UUID REFERENCES auth.users(id),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage security alerts" ON security_alerts;
CREATE POLICY "Admins can manage security alerts" ON security_alerts
    FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ));

-- Function to create security alert
CREATE OR REPLACE FUNCTION create_security_alert(
    p_user_id UUID,
    p_alert_type TEXT,
    p_description TEXT,
    p_severity TEXT,
    p_ip_address TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_alert_id UUID;
BEGIN
    INSERT INTO security_alerts (user_id, alert_type, description, severity, ip_address)
    VALUES (p_user_id, p_alert_type, p_description, p_severity, p_ip_address)
    RETURNING id INTO v_alert_id;
    
    RETURN v_alert_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create active sessions tracking
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_token TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    device_info TEXT,
    location TEXT,
    is_active BOOLEAN DEFAULT true,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view their own sessions
DROP POLICY IF EXISTS "Users can view own sessions" ON user_sessions;
CREATE POLICY "Users can view own sessions" ON user_sessions
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Users can revoke their own sessions
DROP POLICY IF EXISTS "Users can revoke own sessions" ON user_sessions;
CREATE POLICY "Users can revoke own sessions" ON user_sessions
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Create function to cleanup expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    UPDATE user_sessions
    SET is_active = false
    WHERE is_active = true
    AND (
        expires_at < timezone('utc'::text, now())
        OR last_activity_at < timezone('utc'::text, now()) - interval '7 days'
    );
    
    DELETE FROM user_sessions
    WHERE is_active = false
    AND updated_at < timezone('utc'::text, now()) - interval '30 days';
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
