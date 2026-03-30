-- Fix the tests table schema issues
-- Run this in Supabase SQL Editor

-- Step 1: Remove wrong default from batch_id
ALTER TABLE tests ALTER COLUMN batch_id DROP DEFAULT;

-- Step 2: Check and fix the primary key constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'tests'::regclass 
AND contype = 'p';

-- If the primary key is on (batch_id) instead of (id), we need to fix it
-- Run this only if needed:

-- First, check for duplicate IDs and remove them
-- DELETE FROM tests 
-- WHERE id IN (
--     SELECT id 
--     FROM tests 
--     GROUP BY id 
--     HAVING COUNT(*) > 1
-- );

-- If tests_pkey is on batch_id, drop and recreate it on id
-- ALTER TABLE tests DROP CONSTRAINT tests_pkey;
-- ALTER TABLE tests ADD PRIMARY KEY (id);

-- Verify the fix
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'tests'::regclass 
AND contype = 'p';
