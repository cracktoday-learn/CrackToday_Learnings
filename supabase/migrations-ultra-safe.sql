-- ============================================================================
-- ULTRA-SAFE MIGRATION - Run each statement SEPARATELY
-- ============================================================================

-- STEP 1: Create tests table WITHOUT foreign key constraint (safest)
CREATE TABLE IF NOT EXISTS tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID NOT NULL,
  name TEXT NOT NULL,
  test_number INTEGER NOT NULL,
  time_duration INTEGER NOT NULL,
  question_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STEP 2: Create index for tests table
CREATE INDEX IF NOT EXISTS idx_tests_batch_id ON tests(batch_id);

-- STEP 3: Add batch_id column to test_attempts (if missing)
ALTER TABLE test_attempts ADD COLUMN IF NOT EXISTS batch_id UUID;

-- STEP 4: Add test_number column to test_attempts (if missing)  
ALTER TABLE test_attempts ADD COLUMN IF NOT EXISTS test_number INTEGER DEFAULT 1;

-- STEP 5: Create index for test_attempts
CREATE INDEX IF NOT EXISTS idx_test_attempts_batch_test ON test_attempts(batch_id, test_number);

-- STEP 6: Update existing data
UPDATE test_attempts SET test_number = 1 WHERE test_number IS NULL;

-- STEP 7 (Optional): Add foreign key constraint to tests table after it exists
-- ALTER TABLE tests ADD CONSTRAINT fk_tests_batch FOREIGN KEY (batch_id) REFERENCES batches(id);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check test_attempts columns
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'test_attempts';

-- Check tests table
SELECT * FROM tests LIMIT 5;
