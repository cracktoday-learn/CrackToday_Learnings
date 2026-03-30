-- ============================================================================
-- SAFE MIGRATION FOR QUESTIONS TABLE
-- Run statements ONE AT A TIME in Supabase SQL Editor
-- ============================================================================

-- STEP 1: Add test_id column (without foreign key first)
ALTER TABLE questions ADD COLUMN IF NOT EXISTS test_id UUID;

-- STEP 2: Add test_number column
ALTER TABLE questions ADD COLUMN IF NOT EXISTS test_number INTEGER DEFAULT 1;

-- STEP 3: Create index for test_id
CREATE INDEX IF NOT EXISTS idx_questions_test_id ON questions(test_id);

-- STEP 4: Create index for test_number
CREATE INDEX IF NOT EXISTS idx_questions_test_number ON questions(test_number);

-- STEP 5: Update existing questions to have test_number = 1
UPDATE questions SET test_number = 1 WHERE test_number IS NULL;

-- STEP 6: Verify columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'questions';

-- STEP 7 (Optional): Add foreign key constraint only after verifying tests table exists
-- Uncomment and run only if tests table exists with proper id column:
-- ALTER TABLE questions 
-- ADD CONSTRAINT fk_questions_test 
-- FOREIGN KEY (test_id) REFERENCES tests(id) 
-- ON DELETE SET NULL;
