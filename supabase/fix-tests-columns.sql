-- Fix missing tests table columns (safe version)
-- Run this in Supabase SQL Editor

-- Check current table structure first
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'tests' 
ORDER BY ordinal_position;

-- Add id column if missing (without primary key constraint)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='tests' AND column_name='id'
    ) THEN
        ALTER TABLE tests ADD COLUMN id UUID DEFAULT gen_random_uuid();
        UPDATE tests SET id = gen_random_uuid() WHERE id IS NULL;
        ALTER TABLE tests ALTER COLUMN id SET NOT NULL;
        RAISE NOTICE 'SUCCESS: Added id column to tests table';
    ELSE
        RAISE NOTICE 'INFO: id column already exists in tests table';
    END IF;
END $$;

-- Add created_at column if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='tests' AND column_name='created_at'
    ) THEN
        ALTER TABLE tests ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'SUCCESS: Added created_at column to tests table';
    ELSE
        RAISE NOTICE 'INFO: created_at column already exists in tests table';
    END IF;
END $$;

-- Add time_duration column if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='tests' AND column_name='time_duration'
    ) THEN
        ALTER TABLE tests ADD COLUMN time_duration INTEGER DEFAULT 60;
        RAISE NOTICE 'SUCCESS: Added time_duration column to tests table';
    ELSE
        RAISE NOTICE 'INFO: time_duration column already exists in tests table';
    END IF;
END $$;

-- Verify the fix
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'tests' 
ORDER BY ordinal_position;
