-- SIMPLE CLEANUP: No primary key changes needed
-- The tests table already has a primary key

-- Step 1: Just clean up orphaned questions
DELETE FROM questions
WHERE test_id IS NOT NULL
AND test_id NOT IN (SELECT id FROM tests);

-- Step 2: Also clean by test_number if test_id is missing
DELETE FROM questions q
WHERE q.test_number IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM tests t 
    WHERE t.batch_id = q.batch_id 
    AND t.test_number = q.test_number
);

-- Step 3: Verify
SELECT COUNT(*) as remaining_questions FROM questions;
