-- Make sure post-media bucket is public for profile pictures
UPDATE storage.buckets 
SET public = true 
WHERE id = 'post-media';

-- Ensure avatars bucket is public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'avatars';