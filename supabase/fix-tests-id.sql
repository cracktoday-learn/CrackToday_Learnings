-- Fix missing id column on tests table
-- Run this in Supabase SQL Editor

-- Check if id column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='tests' 
        AND column_name='id'
    ) THEN
        -- Add id column with default UUID
        ALTER TABLE tests ADD COLUMN id UUID DEFAULT gen_random_uuid();
        
        -- Set id for existing rows that don't have it
        UPDATE tests SET id = gen_random_uuid() WHERE id IS NULL;
        
        -- Make id NOT NULL
        ALTER TABLE tests ALTER COLUMN id SET NOT NULL;
        
        -- Add primary key constraint
        ALTER TABLE tests ADD PRIMARY KEY (id);
        
        RAISE NOTICE 'SUCCESS: Added id column to tests table';
    ELSE
        RAISE NOTICE 'INFO: id column already exists in tests table';
    END IF;
END $$;

-- Also ensure created_at column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='tests' 
        AND column_name='created_at'
    ) THEN
        ALTER TABLE tests ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'SUCCESS: Added created_at column to tests table';
    ELSE
        RAISE NOTICE 'INFO: created_at column already exists in tests table';
    END IF;
END $$;

-- Verify the fix
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'tests' 
ORDER BY ordinal_position;
