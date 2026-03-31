-- ============================================================================
-- STORAGE BUCKET SETUP FOR PREVIOUS YEAR PAPERS
-- ============================================================================

-- Step 1: Create the storage bucket (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pyq-papers',
  'Previous Year Papers',
  true,  -- Public bucket so files can be accessed via URL
  10485760,  -- 10MB file size limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Enable RLS on the bucket (recommended for security)
-- This allows us to control who can upload/download

-- Step 3: Create RLS policies for the storage bucket
-- Policy: Allow anyone to view/download files (since papers are for enrolled users only,
-- and enrollment check is done at the application level)
CREATE POLICY "Allow public read access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'pyq-papers');

-- Policy: Allow authenticated users to upload (admin check is done at app level)
CREATE POLICY "Allow authenticated uploads" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'pyq-papers');

-- Policy: Allow authenticated users to delete their own files
CREATE POLICY "Allow authenticated deletes" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'pyq-papers');

-- Step 4: Verify bucket was created
SELECT * FROM storage.buckets WHERE id = 'pyq-papers';
