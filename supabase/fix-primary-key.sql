-- FIX: Add primary key to tests.id then add cascade
-- Run these in order

-- Step 1: Check current primary key
SELECT constraint_name, column_name 
FROM information_schema.key_column_usage 
WHERE table_name = 'tests';

-- Step 2: Drop existing primary key if it exists (optional, be careful)
-- ALTER TABLE tests DROP CONSTRAINT IF EXISTS tests_pkey;

-- Step 3: Add primary key to id column
ALTER TABLE tests ADD PRIMARY KEY (id);

-- Step 4: Delete duplicate IDs first (keep first occurrence)
DELETE FROM tests a
WHERE a.ctid <> (
    SELECT MIN(b.ctid) FROM tests b WHERE b.id = a.id
)
AND a.id IN (
    SELECT id FROM tests GROUP BY id HAVING COUNT(*) > 1
);

-- Step 5: Fix null IDs
UPDATE tests SET id = gen_random_uuid() WHERE id IS NULL;

-- Step 6: Now add primary key
ALTER TABLE tests ADD PRIMARY KEY (id);

-- Step 7: Add cascade delete to questions
ALTER TABLE questions 
ADD CONSTRAINT fk_questions_test 
FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE;
