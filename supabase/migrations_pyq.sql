-- ============================================================================
-- PREVIOUS YEAR QUESTION PAPERS (PYQ) - Database Migration
-- ============================================================================
-- This migration creates tables for storing previous year question papers
-- Only enrolled learners can access these papers

-- ============================================================================
-- STEP 1: Create previous_year_papers table
-- ============================================================================
CREATE TABLE IF NOT EXISTS previous_year_papers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  year INTEGER,
  description TEXT,
  file_url TEXT, -- URL to the uploaded PDF/image
  file_type TEXT DEFAULT 'pdf', -- pdf, image, etc.
  file_size INTEGER, -- size in bytes
  exam_name TEXT, -- e.g., "IBPS PO Prelims", "SBI Clerk Mains"
  paper_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries by batch
CREATE INDEX IF NOT EXISTS idx_pyq_batch_id ON previous_year_papers(batch_id);
CREATE INDEX IF NOT EXISTS idx_pyq_exam_name ON previous_year_papers(exam_name);
CREATE INDEX IF NOT EXISTS idx_pyq_year ON previous_year_papers(year);
CREATE INDEX IF NOT EXISTS idx_pyq_active ON previous_year_papers(is_active);

-- Create composite index for batch + active queries
CREATE INDEX IF NOT EXISTS idx_pyq_batch_active ON previous_year_papers(batch_id, is_active, paper_order);

-- ============================================================================
-- STEP 2: Create RLS Policies for previous_year_papers
-- ============================================================================

-- Enable RLS
ALTER TABLE previous_year_papers ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view active papers (enrollment check will be done in application layer)
CREATE POLICY "Allow viewing active papers" ON previous_year_papers
  FOR SELECT USING (is_active = true);

-- Policy: Only admins can insert/update/delete
CREATE POLICY "Allow admins to manage papers" ON previous_year_papers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- ============================================================================
-- STEP 3: Create function to check if user is enrolled in a batch
-- ============================================================================
CREATE OR REPLACE FUNCTION is_enrolled_in_batch(p_user_id UUID, p_batch_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM purchases 
    WHERE user_id = p_user_id 
    AND batch_id = p_batch_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 4: Create function to get previous year papers for enrolled users only
-- ============================================================================
CREATE OR REPLACE FUNCTION get_enrolled_pyq_papers(p_user_id UUID, p_batch_id UUID)
RETURNS SETOF previous_year_papers AS $$
BEGIN
  -- Check if user is enrolled
  IF NOT is_enrolled_in_batch(p_user_id, p_batch_id) THEN
    RAISE EXCEPTION 'User is not enrolled in this batch';
  END IF;
  
  -- Return papers for this batch
  RETURN QUERY
  SELECT * FROM previous_year_papers 
  WHERE batch_id = p_batch_id 
  AND is_active = true
  ORDER BY year DESC, paper_order ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 5: Create storage bucket for previous year papers (if using Supabase Storage)
-- ============================================================================
-- Note: Run this in Supabase dashboard SQL editor if storage API is available
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('pyq-papers', 'Previous Year Papers', false)
-- ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 6: Add trigger to update updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pyq_updated_at
  BEFORE UPDATE ON previous_year_papers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VERIFICATION QUERIES (Run these to verify the migration)
-- ============================================================================

-- Check table structure:
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'previous_year_papers' 
-- ORDER BY ordinal_position;

-- Check indexes:
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename = 'previous_year_papers';

-- Check RLS policies:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies 
-- WHERE tablename = 'previous_year_papers';
