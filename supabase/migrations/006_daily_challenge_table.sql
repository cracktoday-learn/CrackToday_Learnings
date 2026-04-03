-- Create daily_challenge_questions table for daily challenge feature
CREATE TABLE IF NOT EXISTS public.daily_challenge_questions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  question text NOT NULL,
  option_a text NOT NULL,
  option_b text NOT NULL,
  option_c text NOT NULL,
  option_d text NOT NULL,
  correct_answer text NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  explanation text NOT NULL,
  topic text NOT NULL,
  difficulty text DEFAULT 'hard',
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.daily_challenge_questions ENABLE ROW LEVEL SECURITY;

-- Allow read access for all authenticated users
CREATE POLICY "Allow read access to daily challenge questions" 
ON public.daily_challenge_questions
FOR SELECT 
TO authenticated 
USING (true);

-- Allow insert/update/delete only for service role
CREATE POLICY "Allow all access for service role" 
ON public.daily_challenge_questions
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Create index on date for efficient querying
CREATE INDEX IF NOT EXISTS idx_daily_challenge_date ON public.daily_challenge_questions(date);

-- Grant permissions
GRANT SELECT ON public.daily_challenge_questions TO authenticated;
GRANT ALL ON public.daily_challenge_questions TO service_role;
