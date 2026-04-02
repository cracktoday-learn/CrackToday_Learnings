-- Fix answers column in test_attempts table
-- Run this in Supabase SQL Editor

-- First, check if column exists
DO $$
DECLARE
    col_type text;
BEGIN
    SELECT data_type INTO col_type
    FROM information_schema.columns
    WHERE table_name = 'test_attempts' AND column_name = 'answers';

    IF col_type IS NULL THEN
        -- Column doesn't exist, add it as JSONB
        ALTER TABLE test_attempts ADD COLUMN answers JSONB DEFAULT '{}';
        RAISE NOTICE 'Added answers column as JSONB';
    ELSIF col_type != 'jsonb' THEN
        -- Column exists but wrong type, convert it
        ALTER TABLE test_attempts ALTER COLUMN answers TYPE JSONB USING answers::jsonb;
        RAISE NOTICE 'Converted answers column to JSONB';
    ELSE
        RAISE NOTICE 'answers column already exists as JSONB';
    END IF;
END $$;

-- Verify the column
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'test_attempts' AND column_name = 'answers';
