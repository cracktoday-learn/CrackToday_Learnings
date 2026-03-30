-- URGENT: Fix duplicate key error on tests table
-- Run ALL queries in order

-- 1. First, let's see what's wrong
SELECT id, COUNT(*) as duplicates 
FROM tests 
GROUP BY id 
HAVING COUNT(*) > 1;

-- 2. Delete ALL tests and recreate with proper structure
-- WARNING: This deletes all existing tests
DELETE FROM tests;

-- 3. Reset the table properly (if needed)
-- ALTER TABLE tests DROP CONSTRAINT IF EXISTS tests_pkey;
-- ALTER TABLE tests ALTER COLUMN id SET DEFAULT gen_random_uuid();
-- ALTER TABLE tests ADD PRIMARY KEY (id);

-- 4. Verify empty table
SELECT * FROM tests;
