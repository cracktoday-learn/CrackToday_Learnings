-- Create the profiles storage bucket for avatar uploads
-- Run this in Supabase SQL Editor

-- First, create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'profiles',
  'profiles',
  true,
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated users to upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow public to read avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete avatars" ON storage.objects;

-- Policy: Allow authenticated users to upload their own avatar
CREATE POLICY "Allow authenticated users to upload avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profiles' AND
  name LIKE 'avatars/%'
);

-- Policy: Allow authenticated users to update their own avatar
CREATE POLICY "Allow authenticated users to update avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profiles' AND
  name LIKE 'avatars/%'
);

-- Policy: Allow public access to read avatars
CREATE POLICY "Allow public to read avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profiles');

-- Policy: Allow authenticated users to delete their own avatar
CREATE POLICY "Allow authenticated users to delete avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profiles' AND
  name LIKE 'avatars/%'
);
