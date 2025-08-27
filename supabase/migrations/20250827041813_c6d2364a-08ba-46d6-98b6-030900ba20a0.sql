-- Drop the existing safe_public_profiles view if it exists
DROP VIEW IF EXISTS public.safe_public_profiles;

-- Create the safe_public_profiles view with all required columns
CREATE VIEW public.safe_public_profiles AS
SELECT 
  user_id,
  display_name,
  username,
  avatar_url
FROM public.user_profiles
WHERE is_public = true 
   OR (privacy_settings->>'profile_visibility') = 'public'
   OR privacy_settings IS NULL;

-- Grant permissions to access the view
GRANT SELECT ON public.safe_public_profiles TO authenticated;
GRANT SELECT ON public.safe_public_profiles TO anon;