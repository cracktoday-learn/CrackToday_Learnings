-- ============================================================================
-- RLS POLICIES FOR TESTS TABLE
-- Run this in Supabase SQL Editor
-- ============================================================================

-- First, enable RLS on tests table (if not already enabled)
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;

-- Policy: Allow admins to do everything on tests table
CREATE POLICY "Admins can manage all tests" ON tests
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Policy: Allow users to view tests (for their enrolled batches)
CREATE POLICY "Users can view tests" ON tests
    FOR SELECT
    TO authenticated
    USING (true);

-- Alternative: If you don't have a users table with roles, use this simpler policy:
-- Allow all authenticated users to manage tests (for development/testing)
-- CREATE POLICY "Allow all authenticated users" ON tests
--     FOR ALL
--     TO authenticated
--     USING (true)
--     WITH CHECK (true);

-- ============================================================================
-- VERIFY POLICIES
-- ============================================================================

-- Check if policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'tests';
