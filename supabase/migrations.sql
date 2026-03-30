-- ============================================================================
-- STEP 1: DIAGNOSTIC - Check Current Schema
-- ============================================================================
-- Run this first to see what you currently have:
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'test_attempts' 
-- ORDER BY ordinal_position;

-- ============================================================================
-- STEP 2: Create tests table (completely independent - no dependencies)
-- ============================================================================
CREATE TABLE IF NOT EXISTS tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  test_number INTEGER NOT NULL,
  time_duration INTEGER NOT NULL,
  question_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(batch_id, test_number)
);

-- Create index for tests table (safe - no dependencies)
CREATE INDEX IF NOT EXISTS idx_tests_batch_id ON tests(batch_id);

-- ============================================================================
-- STEP 3: Safely add columns to test_attempts using multiple separate checks
-- ============================================================================

-- Add batch_id column if it doesn't exist (completely safe)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='test_attempts' 
        AND column_name='batch_id'
    ) THEN
        ALTER TABLE test_attempts ADD COLUMN batch_id UUID REFERENCES batches(id);
        RAISE NOTICE 'SUCCESS: Added batch_id column to test_attempts';
    ELSE
        RAISE NOTICE 'INFO: batch_id column already exists in test_attempts';
    END IF;
END $$;

-- Add test_number column if it doesn't exist (completely safe)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='test_attempts' 
        AND column_name='test_number'
    ) THEN
        ALTER TABLE test_attempts ADD COLUMN test_number INTEGER DEFAULT 1;
        RAISE NOTICE 'SUCCESS: Added test_number column to test_attempts';
    ELSE
        RAISE NOTICE 'INFO: test_number column already exists in test_attempts';
    END IF;
END $$;

-- ============================================================================
-- STEP 4: Create index only after confirming both columns exist
-- ============================================================================
DO $$
DECLARE
    has_batch_id BOOLEAN;
    has_test_number BOOLEAN;
BEGIN
    -- Check if batch_id exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='test_attempts' AND column_name='batch_id'
    ) INTO has_batch_id;
    
    -- Check if test_number exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='test_attempts' AND column_name='test_number'
    ) INTO has_test_number;
    
    -- Only create index if BOTH exist
    IF has_batch_id AND has_test_number THEN
        CREATE INDEX IF NOT EXISTS idx_test_attempts_batch_test ON test_attempts(batch_id, test_number);
        RAISE NOTICE 'SUCCESS: Created index on test_attempts';
    ELSE
        RAISE NOTICE 'SKIPPED: Cannot create index - batch_id=% test_number=%', has_batch_id, has_test_number;
    END IF;
END $$;

-- ============================================================================
-- STEP 5: Update data (only references columns we know exist)
-- ============================================================================
DO $$
DECLARE
    has_batch_id BOOLEAN;
    has_test_number BOOLEAN;
BEGIN
    -- Check columns
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='test_attempts' AND column_name='batch_id'
    ) INTO has_batch_id;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='test_attempts' AND column_name='test_number'
    ) INTO has_test_number;
    
    -- Update logic based on what columns exist
    IF has_batch_id AND has_test_number THEN
        -- Both exist - safe to use batch_id in WHERE
        UPDATE test_attempts 
        SET test_number = COALESCE(test_number, 1)
        WHERE test_number IS NULL;
        RAISE NOTICE 'SUCCESS: Updated test_attempts (both columns exist)';
    ELSIF has_test_number THEN
        -- Only test_number exists
        UPDATE test_attempts 
        SET test_number = COALESCE(test_number, 1)
        WHERE test_number IS NULL;
        RAISE NOTICE 'SUCCESS: Updated test_attempts (test_number only)';
    ELSE
        RAISE NOTICE 'SKIPPED: No columns to update';
    END IF;
END $$;

-- ============================================================================
-- STEP 6: Verification
-- ============================================================================
-- Show what we have now:
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'test_attempts' 
-- ORDER BY ordinal_position;

-- Show the tests table:
-- SELECT * FROM tests LIMIT 5;

-- Show test_attempts with new columns:
-- SELECT id, user_id, batch_id, test_number, score, created_at 
-- FROM test_attempts 
-- LIMIT 5;
