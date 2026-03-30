-- COMPREHENSIVE FIX: Tests Table and Questions Cleanup
-- Run ALL queries in order in Supabase SQL Editor

-- ============================================================================
-- PART 1: FIX DUPLICATE KEY ERROR ON TESTS TABLE
-- ============================================================================

-- Step 1: See all tests (including null IDs)
SELECT id, name, test_number, batch_id, created_at 
FROM tests 
ORDER BY created_at;

-- Step 2: Delete ALL tests with NULL id
DELETE FROM tests WHERE id IS NULL;

-- Step 3: Check for duplicate IDs
SELECT id, COUNT(*) as count 
FROM tests 
GROUP BY id 
HAVING COUNT(*) > 1;

-- Step 4: If duplicates exist, delete all but the first one
DELETE FROM tests a
WHERE a.ctid <> (
    SELECT MIN(b.ctid) 
    FROM tests b 
    WHERE b.id = a.id
);

-- Step 5: Verify all tests have unique IDs
SELECT COUNT(DISTINCT id) as unique_ids, COUNT(*) as total_tests
FROM tests;

-- ============================================================================
-- PART 2: CLEAN UP ORPHANED QUESTIONS
-- ============================================================================

-- Step 6: Delete questions linked to deleted tests (by test_id)
DELETE FROM questions
WHERE test_id IS NOT NULL
AND test_id NOT IN (SELECT id FROM tests);

-- Step 7: Delete questions with test_number but no matching test
DELETE FROM questions q
WHERE q.test_number IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM tests t 
    WHERE t.batch_id = q.batch_id 
    AND t.test_number = q.test_number
);

-- ============================================================================
-- PART 3: ADD CASCADE DELETE (Prevents future orphaned questions)
-- ============================================================================

-- Step 8: Add foreign key with CASCADE DELETE to questions table
-- First check if column exists
DO $$
BEGIN
    -- Add test_id column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='questions' AND column_name='test_id'
    ) THEN
        ALTER TABLE questions ADD COLUMN test_id UUID;
    END IF;
END $$;

-- Step 9: Add foreign key constraint with ON DELETE CASCADE
-- First drop existing constraint if exists
ALTER TABLE questions DROP CONSTRAINT IF EXISTS fk_questions_test;

-- Add the foreign key with cascade
ALTER TABLE questions 
ADD CONSTRAINT fk_questions_test 
FOREIGN KEY (test_id) 
REFERENCES tests(id) 
ON DELETE CASCADE;

-- ============================================================================
-- PART 4: VERIFY FIX
-- ============================================================================

-- Check tests
SELECT * FROM tests ORDER BY test_number;

-- Check questions count
SELECT COUNT(*) as total_questions FROM questions;

-- Check orphaned questions (should return 0 rows)
SELECT COUNT(*) as orphaned_questions 
FROM questions q
LEFT JOIN tests t ON q.test_id = t.id
WHERE q.test_id IS NOT NULL AND t.id IS NULL;
