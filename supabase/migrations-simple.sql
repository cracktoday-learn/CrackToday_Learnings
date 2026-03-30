-- ============================================================================
-- SIMPLE MIGRATION - Run each statement SEPARATELY in Supabase SQL Editor
-- ============================================================================

-- STEP 1: Check current columns (run this first to see what you have)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'test_attempts' 
ORDER BY ordinal_position;

-- STEP 2: Create tests table (run this next)
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

-- STEP 3: Create index for tests table
CREATE INDEX IF NOT EXISTS idx_tests_batch_id ON tests(batch_id);

-- STEP 4: Add batch_id column to test_attempts (run only if missing)
-- Check first: SELECT column_name FROM information_schema.columns WHERE table_name='test_attempts' AND column_name='batch_id';
-- If no results, then run:
ALTER TABLE test_attempts ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES batches(id);

-- STEP 5: Add test_number column to test_attempts (run only if missing)
-- Check first: SELECT column_name FROM information_schema.columns WHERE table_name='test_attempts' AND column_name='test_number';
-- If no results, then run:
ALTER TABLE test_attempts ADD COLUMN IF NOT EXISTS test_number INTEGER DEFAULT 1;

-- STEP 6: After confirming both columns exist, create index
-- Check first that both columns exist, then run:
CREATE INDEX IF NOT EXISTS idx_test_attempts_batch_test ON test_attempts(batch_id, test_number);

-- STEP 7: Update existing data (only if test_number column exists)
UPDATE test_attempts 
SET test_number = COALESCE(test_number, 1)
WHERE test_number IS NULL;

-- ============================================================================
-- VERIFICATION QUERIES (run after all steps)
-- ============================================================================

-- Show test_attempts columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'test_attempts';

-- Show all tests
SELECT * FROM tests;

-- Show sample test_attempts
SELECT id, user_id, batch_id, test_number, score, created_at 
FROM test_attempts 
LIMIT 10;
