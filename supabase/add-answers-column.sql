-- Add answers column to test_attempts table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='test_attempts' 
        AND column_name='answers'
    ) THEN
        ALTER TABLE test_attempts ADD COLUMN answers JSONB DEFAULT '{}';
        RAISE NOTICE 'SUCCESS: Added answers column to test_attempts';
    ELSE
        RAISE NOTICE 'INFO: answers column already exists in test_attempts';
    END IF;
END $$;
