-- ============================================================================
-- ADD TEST REFERENCE TO QUESTIONS TABLE
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Add test_id column to questions table
ALTER TABLE questions ADD COLUMN IF NOT EXISTS test_id UUID REFERENCES tests(id);

-- Add test_number column as alternative (for easier CSV uploads)
ALTER TABLE questions ADD COLUMN IF NOT EXISTS test_number INTEGER;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_questions_test_id ON questions(test_id);
CREATE INDEX IF NOT EXISTS idx_questions_test_number ON questions(test_number);

-- Update existing questions to have test_number = 1 for backward compatibility
UPDATE questions 
SET test_number = 1 
WHERE test_number IS NULL;

-- Verify columns added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'questions';

-- Enable RLS for questions if not already
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to manage questions
CREATE POLICY IF NOT EXISTS "Allow authenticated users to manage questions" ON questions
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
