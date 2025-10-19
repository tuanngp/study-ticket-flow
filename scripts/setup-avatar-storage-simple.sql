-- Simplified script for avatars bucket setup
-- This version avoids direct table modifications that require owner permissions

-- Create storage bucket for avatars (this should work with standard permissions)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'avatars', 
  'avatars', 
  true, 
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Verify the bucket was created
SELECT * FROM storage.buckets WHERE id = 'avatars';
