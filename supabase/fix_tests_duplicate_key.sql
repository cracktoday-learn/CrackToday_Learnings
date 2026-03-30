-- ============================================================================
-- FIX: Tests table duplicate key issue
-- Run this in Supabase SQL Editor to fix the duplicate key error
-- ============================================================================

-- First, let's see the current state of the tests table
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'tests' 
ORDER BY ordinal_position;

-- Check if there are any existing tests
SELECT * FROM tests ORDER BY created_at DESC LIMIT 10;

-- If the id column doesn't have a default, or there's an issue with the primary key,
-- we need to fix it. Here's the safe approach:

-- Option 1: If the table exists but has issues, fix the id column default
DO $$
BEGIN
    -- Check if id column exists and its default
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='tests' 
        AND column_name='id'
    ) THEN
        -- Check if the default is set correctly
        IF NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name='tests'
            AND column_name='id'
            AND column_default LIKE '%gen_random_uuid%'
        ) THEN
            -- Fix the default
            ALTER TABLE tests ALTER COLUMN id SET DEFAULT gen_random_uuid();
            RAISE NOTICE 'Fixed: Set default UUID generator for id column';
        END IF;
    END IF;
END $$;

-- Option 2: If there are orphaned records or duplicate IDs, clean them up
-- (Only run if you're sure you want to delete data)
-- DELETE FROM tests WHERE id IN (
--     SELECT id FROM tests 
--     GROUP BY id 
--     HAVING COUNT(*) > 1
-- );

-- Option 3: If all else fails, recreate the table properly
-- WARNING: This will DELETE ALL TEST DATA. Only use as last resort!
-- Uncomment only if you want to start fresh:

-- DROP TABLE IF EXISTS test_attempts CASCADE;
-- DROP TABLE IF EXISTS questions CASCADE;
-- DROP TABLE IF EXISTS tests CASCADE;

-- CREATE TABLE tests (
--   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--   batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
--   name TEXT NOT NULL,
--   test_number INTEGER NOT NULL,
--   time_duration INTEGER NOT NULL,
--   question_count INTEGER DEFAULT 0,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--   UNIQUE(batch_id, test_number)
-- );

-- Recreate questions table
-- CREATE TABLE questions (
--   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--   batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
--   test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
--   test_number INTEGER NOT NULL,
--   question_text TEXT NOT NULL,
--   option_a TEXT NOT NULL,
--   option_b TEXT NOT NULL,
--   option_c TEXT NOT NULL,
--   option_d TEXT NOT NULL,
--   correct_option TEXT NOT NULL,
--   explanation TEXT,
--   marks INTEGER DEFAULT 1,
--   negative_marks NUMERIC DEFAULT 0,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- Recreate test_attempts table
-- CREATE TABLE test_attempts (
--   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--   user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
--   batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
--   test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
--   test_number INTEGER,
--   score INTEGER DEFAULT 0,
--   total_marks INTEGER DEFAULT 0,
--   answers JSONB DEFAULT '{}',
--   completed BOOLEAN DEFAULT FALSE,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- Verify the fix
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'tests' 
ORDER BY ordinal_position;
