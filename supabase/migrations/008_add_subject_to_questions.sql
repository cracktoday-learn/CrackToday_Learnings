-- Add subject column to questions table for AI classification
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS subject TEXT;

-- Create index for subject queries
CREATE INDEX IF NOT EXISTS idx_questions_subject ON public.questions(subject);

-- Update RLS policies if needed
-- Note: Existing SELECT/INSERT/UPDATE policies should cover the new column

-- Add helpful comment
COMMENT ON COLUMN public.questions.subject IS 'AI-classified subject category (Polity, Economy, History, Geography, etc.)';
