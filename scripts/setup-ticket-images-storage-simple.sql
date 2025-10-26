-- Simplified script for ticket images bucket setup
-- This version avoids direct table modifications that require owner permissions

-- Create storage bucket for ticket images (this should work with standard permissions)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'ticket-images', 
  'ticket-images', 
  true, 
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create simple policies for ticket-images bucket
CREATE POLICY "Public can view ticket images" ON storage.objects
FOR SELECT USING (bucket_id = 'ticket-images');

CREATE POLICY "Authenticated users can upload ticket images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'ticket-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update ticket images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'ticket-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete ticket images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'ticket-images' 
  AND auth.role() = 'authenticated'
);

-- Verify the bucket was created
SELECT * FROM storage.buckets WHERE id = 'ticket-images';
