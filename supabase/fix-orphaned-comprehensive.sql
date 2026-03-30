-- COMPREHENSIVE QUESTIONS CLEANUP
-- Handles both test_id and test_number orphaned questions

-- Step 1: See what columns questions table has
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'questions';

-- Step 2: See all questions and their links
SELECT q.id, q.question, q.test_id, q.test_number, q.batch_id,
       t.id as linked_test_exists, t.name as test_name
FROM questions q
LEFT JOIN tests t ON q.test_id = t.id
ORDER BY q.batch_id, q.test_number;

-- Step 3: Delete questions with test_id pointing to non-existent tests
DELETE FROM questions
WHERE test_id IS NOT NULL
AND test_id NOT IN (SELECT id FROM tests);

-- Step 4: Delete questions with test_number but NO matching test in that batch
DELETE FROM questions q
WHERE q.test_number IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM tests t 
    WHERE t.batch_id = q.batch_id 
    AND t.test_number = q.test_number
);

-- Step 5: Delete questions with test_id IS NULL and test_number IS NULL
-- These are completely orphaned
DELETE FROM questions
WHERE test_id IS NULL AND test_number IS NULL;

-- Step 6: Verify cleanup
SELECT 
    COUNT(*) as total_questions,
    COUNT(CASE WHEN test_id IS NULL THEN 1 END) as no_test_id,
    COUNT(CASE WHEN test_number IS NULL THEN 1 END) as no_test_number
FROM questions;
