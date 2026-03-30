-- Clean up orphaned questions (questions linked to deleted tests)
-- Run this in Supabase SQL Editor

-- 1. Find questions linked to non-existent tests (by test_id)
SELECT q.id, q.question, q.test_id, q.batch_id
FROM questions q
LEFT JOIN tests t ON q.test_id = t.id
WHERE q.test_id IS NOT NULL 
AND t.id IS NULL;

-- 2. Delete orphaned questions (by test_id)
DELETE FROM questions
WHERE test_id IS NOT NULL
AND test_id NOT IN (SELECT id FROM tests);

-- 3. Find questions with test_number that don't match existing tests
SELECT q.id, q.question, q.test_number, q.batch_id
FROM questions q
WHERE q.test_number IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM tests t 
    WHERE t.batch_id = q.batch_id 
    AND t.test_number = q.test_number
);

-- 4. Delete orphaned questions (by test_number)
DELETE FROM questions q
WHERE q.test_number IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM tests t 
    WHERE t.batch_id = q.batch_id 
    AND t.test_number = q.test_number
);

-- 5. Verify cleanup
SELECT COUNT(*) as remaining_questions FROM questions;
