-- Fix duplicate key error on tests table
-- This fixes rows with null or duplicate IDs

-- Step 1: Check for null IDs
SELECT COUNT(*) as null_count FROM tests WHERE id IS NULL;

-- Step 2: Assign unique IDs to rows with null IDs
UPDATE tests 
SET id = gen_random_uuid() 
WHERE id IS NULL;

-- Step 3: Check for duplicate IDs (if any)
SELECT id, COUNT(*) as count 
FROM tests 
GROUP BY id 
HAVING COUNT(*) > 1;

-- Step 4: If duplicates exist, reassign unique IDs to duplicates
-- This will run only if there are duplicates
DO $$
DECLARE
    duplicate_record RECORD;
BEGIN
    FOR duplicate_record IN 
        SELECT id, ctid 
        FROM tests 
        WHERE id IN (
            SELECT id 
            FROM tests 
            GROUP BY id 
            HAVING COUNT(*) > 1
        )
        ORDER BY ctid
    LOOP
        -- Skip the first one (keep original), update others
        UPDATE tests 
        SET id = gen_random_uuid() 
        WHERE ctid = duplicate_record.ctid
        AND ctid NOT IN (
            SELECT MIN(ctid) 
            FROM tests 
            WHERE id = duplicate_record.id
        );
    END LOOP;
END $$;

-- Step 5: Verify all tests have unique IDs
SELECT id, COUNT(*) as count 
FROM tests 
GROUP BY id 
HAVING COUNT(*) > 1;

-- Step 6: Check current tests
SELECT id, name, test_number, time_duration, created_at 
FROM tests 
ORDER BY test_number;
