-- ============================================================================
-- COMPREHENSIVE SECURITY HARDENING - RLS POLICIES
-- Run this in Supabase SQL Editor to secure all tables
-- ============================================================================

-- ============================================================================
-- PROFILES TABLE - SECURE USER PROFILES
-- ============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can only view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT
    TO authenticated
    USING (id = auth.uid());

-- Users can only update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Admins can view all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ));

-- ============================================================================
-- BATCHES TABLE - SECURE EXAM BATCHES
-- ============================================================================
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;

-- Everyone can view active batches
DROP POLICY IF EXISTS "Anyone can view active batches" ON batches;
CREATE POLICY "Anyone can view active batches" ON batches
    FOR SELECT
    TO authenticated
    USING (is_active = true);

-- Admins can manage all batches
DROP POLICY IF EXISTS "Admins can manage all batches" ON batches;
CREATE POLICY "Admins can manage all batches" ON batches
    FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ));

-- ============================================================================
-- TESTS TABLE - SECURE TESTS
-- ============================================================================
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;

-- Users can view tests for batches they purchased
DROP POLICY IF EXISTS "Users can view tests for purchased batches" ON tests;
CREATE POLICY "Users can view tests for purchased batches" ON tests
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM purchases 
            WHERE user_id = auth.uid() 
            AND batch_id = tests.batch_id
            AND status = 'active'
        )
    );

-- Admins can manage all tests
DROP POLICY IF EXISTS "Admins can manage all tests" ON tests;
CREATE POLICY "Admins can manage all tests" ON tests
    FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ));

-- ============================================================================
-- QUESTIONS TABLE - SECURE QUESTIONS
-- ============================================================================
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Users can view questions for tests they have access to
DROP POLICY IF EXISTS "Users can view questions for accessible tests" ON questions;
CREATE POLICY "Users can view questions for accessible tests" ON questions
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM purchases p
            JOIN tests t ON p.batch_id = t.batch_id
            WHERE p.user_id = auth.uid()
            AND t.id = questions.test_id
            AND p.status = 'active'
        )
    );

-- Admins can manage all questions
DROP POLICY IF EXISTS "Admins can manage all questions" ON questions;
CREATE POLICY "Admins can manage all questions" ON questions
    FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ));

-- ============================================================================
-- PURCHASES TABLE - SECURE PURCHASE DATA
-- ============================================================================
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- Users can only view their own purchases
DROP POLICY IF EXISTS "Users can view own purchases" ON purchases;
CREATE POLICY "Users can view own purchases" ON purchases
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Admins can manage all purchases
DROP POLICY IF EXISTS "Admins can manage all purchases" ON purchases;
CREATE POLICY "Admins can manage all purchases" ON purchases
    FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ));

-- ============================================================================
-- TEST ATTEMPTS TABLE - SECURE TEST RESULTS
-- ============================================================================
ALTER TABLE test_attempts ENABLE ROW LEVEL SECURITY;

-- Users can only view their own attempts
DROP POLICY IF EXISTS "Users can view own attempts" ON test_attempts;
CREATE POLICY "Users can view own attempts" ON test_attempts
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Users can only insert their own attempts
DROP POLICY IF EXISTS "Users can insert own attempts" ON test_attempts;
CREATE POLICY "Users can insert own attempts" ON test_attempts
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Admins can view all attempts
DROP POLICY IF EXISTS "Admins can view all attempts" ON test_attempts;
CREATE POLICY "Admins can view all attempts" ON test_attempts
    FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ));

-- ============================================================================
-- USER_ROLES TABLE - SECURE ROLE ASSIGNMENTS
-- ============================================================================
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Only admins can manage roles
DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;
CREATE POLICY "Admins can manage roles" ON user_roles
    FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    ));

-- Users can view their own role
DROP POLICY IF EXISTS "Users can view own role" ON user_roles;
CREATE POLICY "Users can view own role" ON user_roles
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- ============================================================================
-- COUPONS TABLE - SECURE COUPON CODES
-- ============================================================================
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Everyone can view active coupons
DROP POLICY IF EXISTS "Anyone can view active coupons" ON coupons;
CREATE POLICY "Anyone can view active coupons" ON coupons
    FOR SELECT
    TO authenticated
    USING (is_active = true);

-- Admins can manage coupons
DROP POLICY IF EXISTS "Admins can manage coupons" ON coupons;
CREATE POLICY "Admins can manage coupons" ON coupons
    FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ));

-- ============================================================================
-- NOTIFICATIONS TABLE - SECURE NOTIFICATIONS
-- ============================================================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can view active notifications
DROP POLICY IF EXISTS "Users can view active notifications" ON notifications;
CREATE POLICY "Users can view active notifications" ON notifications
    FOR SELECT
    TO authenticated
    USING (is_active = true);

-- Admins can manage notifications
DROP POLICY IF EXISTS "Admins can manage notifications" ON notifications;
CREATE POLICY "Admins can manage notifications" ON notifications
    FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ));

-- ============================================================================
-- SECURITY AUDIT LOG TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS security_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    table_name TEXT,
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
DROP POLICY IF EXISTS "Admins can view audit logs" ON security_audit_log;
CREATE POLICY "Admins can view audit logs" ON security_audit_log
    FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ));

-- Create function to log changes
CREATE OR REPLACE FUNCTION log_security_audit()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO security_audit_log (
        user_id,
        action,
        table_name,
        record_id,
        old_data,
        new_data
    ) VALUES (
        auth.uid(),
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to sensitive tables
CREATE TRIGGER audit_purchases
    AFTER INSERT OR UPDATE OR DELETE ON purchases
    FOR EACH ROW EXECUTE FUNCTION log_security_audit();

CREATE TRIGGER audit_test_attempts
    AFTER INSERT OR UPDATE OR DELETE ON test_attempts
    FOR EACH ROW EXECUTE FUNCTION log_security_audit();

-- ============================================================================
-- VERIFY ALL POLICIES
-- ============================================================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
