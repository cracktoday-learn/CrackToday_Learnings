-- Create current_affairs table for storing AI-generated news
CREATE TABLE IF NOT EXISTS current_affairs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('schemes', 'polity', 'national', 'defence', 'appointments', 'awards', 'international', 'bilateral', 'science', 'sports', 'economy', 'environment', 'banking', 'health', 'education')),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  source_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_current_affairs_category ON current_affairs(category);
CREATE INDEX IF NOT EXISTS idx_current_affairs_date ON current_affairs(date DESC);

-- Enable Row Level Security
ALTER TABLE current_affairs ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Allow public read access" ON current_affairs
  FOR SELECT USING (true);

-- Create policy for service role to insert/update
CREATE POLICY "Allow service role insert" ON current_affairs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow service role update" ON current_affairs
  FOR UPDATE USING (true) WITH CHECK (true);

-- Add unique constraint on title to prevent duplicates
ALTER TABLE current_affairs ADD CONSTRAINT unique_title UNIQUE (title);
