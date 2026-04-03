-- Create daily_challenge_attempts table to track user attempts
CREATE TABLE IF NOT EXISTS public.daily_challenge_attempts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  score integer DEFAULT 0,
  correct_answers integer DEFAULT 0,
  wrong_answers integer DEFAULT 0,
  skipped integer DEFAULT 0,
  time_taken integer DEFAULT 0, -- in seconds
  completed boolean DEFAULT false,
  answers jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, date) -- One attempt per user per day
);

-- Enable Row Level Security
ALTER TABLE public.daily_challenge_attempts ENABLE ROW LEVEL SECURITY;

-- Allow users to read only their own attempts
CREATE POLICY "Users can read own attempts" 
ON public.daily_challenge_attempts FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

-- Allow users to insert only their own attempts
CREATE POLICY "Users can insert own attempts" 
ON public.daily_challenge_attempts FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

-- Allow service role full access
CREATE POLICY "Service role full access" 
ON public.daily_challenge_attempts FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_daily_challenge_attempts_user_date ON public.daily_challenge_attempts(user_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_challenge_attempts_date ON public.daily_challenge_attempts(date);

-- Grant permissions
GRANT SELECT, INSERT ON public.daily_challenge_attempts TO authenticated;
GRANT ALL ON public.daily_challenge_attempts TO service_role;
